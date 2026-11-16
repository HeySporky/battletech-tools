import {
    acesIconTokens,
    IAcesBehaviorColumn,
    IAcesSpecialOrder,
    newAcesSpecialOrder,
    TAcesSpecialOrderKind,
} from "../data/aces-cards";
import { acesScanTagColour, allWords, clampRect, editDistance, fuzzyIs, parseAcesScanColumn, parseAcesScanFooter } from "./aces-card-scan";
import { cardScanInkBoxes, cardScanMargin, ICardScanBox, ICardScanColours, ICardScanIO, ICardScanLine, ICardScanOptions, ICardScanRect, TCardScanMode } from "./card-scan-io";

/*
 * Reads an Aces Special Order card from a photo of the players' own card, as the behavior and Command card readers do
 * (aces-card-scan.ts, aces-command-card-scan.ts): text from OCR, coloured icons from their colour, and the result is a
 * draft the player checks against the card before saving.
 *
 * The card prints landscape: the name over its category top left, the priority box top right (a leading "-" makes it
 * a modifier), a rules panel on the left and a narrower panel on the right, over a footer with "Special Order n/5".
 * The right panel holds a behavior column (a condition, a zone, a movement tab and numbered filters), filters
 * labelled 0a, 0b ... to apply first, a numbered spotter list, or more rules under a heading.
 */

export interface IAcesSpecialOrderScanResult {
    found: boolean;
    name: string;
    kind: TAcesSpecialOrderKind;
    cardNumber: string;
    priority: number | null;
    priorityIsModifier: boolean;
    rules: string[];
    column: IAcesBehaviorColumn | null;
    preFilters: string[];
    spotter: string[];
    /** What the player should check by hand. */
    warnings: string[];
}

const emptyResult = (): IAcesSpecialOrderScanResult => ( {
    found: false, name: "", kind: "other", cardNumber: "", priority: null, priorityIsModifier: false, rules: [], column: null, preFilters: [], spotter: [], warnings: [],
} );

/* ----- header fields ----- */

/**
 * The printed priority: "-500" or "+300" (a modifier, kept signed as the app stores it) or "000"; null when the box
 * holds no number of exactly three digits.
 */
export const parseAcesSpecialOrderPriority = ( text: string ): { priority: number | null, priorityIsModifier: boolean } => {
    const match = /([-–—~+]?)\s*(?<!\d)(\d{3})(?!\d)/.exec( text.replace( /[Oo]/g, "0" ) );
    if( !match ) return { priority: null, priorityIsModifier: false };
    const modifier = match[1] !== "";
    const value = +match[2];
    return { priority: match[1] === "+" ? value : modifier ? -value : value, priorityIsModifier: modifier };
}

const letters = ( text: string ): string => text.toLowerCase().replace( /[^a-z]/g, "" );

const kindIds: TAcesSpecialOrderKind[] = [ "forced-withdrawal", "fleeing", "movement-objective", "destroy-objective", "indirect-attacks" ];

const kindName = ( kind: TAcesSpecialOrderKind ): string => kind.split( "-" ).map( ( word ) => word.charAt( 0 ).toUpperCase() + word.substring( 1 ) ).join( " " );

/** The kind a card's name gives, allowing a letter or two of OCR slips; "other" for any other name. */
export const acesSpecialOrderKindOf = ( name: string ): TAcesSpecialOrderKind => {
    const read = letters( name );
    if( read === "" ) return "other";
    const scored = kindIds.map( ( kind ) => ( { kind, edits: editDistance( read, letters( kind ) ) } ) ).sort( ( a, b ) => a.edits - b.edits );
    const best = scored[0];
    return best.edits <= Math.max( 1, Math.floor( letters( best.kind ).length * 0.3 ) ) ? best.kind : "other";
}

/** "Special Order 2/5"; the slash can read as a 1, l or nothing ("Order 25"). */
export const parseAcesSpecialOrderCardNumber = ( text: string ): string => {
    const plain = parseAcesScanFooter( text );
    if( plain ) return plain;
    const glued = /\b[O0o]r\w*\W*([1-9])\s*[1lI|\\]?\s*([1-9])\b/.exec( text );
    return glued && +glued[1] <= +glued[2] ? glued[1] + "/" + glued[2] : "";
}

/* ----- text and icons ----- */

/** A word that is a mark rather than print: a bullet, an icon, a speck. */
const isMark = ( word: string ): boolean => !/[A-Za-z]{2,}/.test( word ) && !/^\W*[aAI]\W*$/.test( word ) && !/^[-–]?\d+([.,:/]\d+)?["”']?[.,:;]*$/.test( word ) && !/^\W?\d[a-e][.,:]$/.test( word );

/** The token a coloured icon stands for: ▲ blue, ▼ red, the moved check green. */
const colourToken = ( colours: ICardScanColours ): string => {
    if( colours.green >= 0.02 && colours.green > colours.blue ) return "[moved]";
    const tag = acesScanTagColour( colours );
    return tag === "blue" ? "[highest]" : tag === "red" ? "[lowest]" : "";
}

/** Icon names the app knows (aces-cards.ts acesIconTokens), lower case: "standstill", "movement objective". */
const tokenMeanings = acesIconTokens.map( ( entry ) => ( { token: "[" + entry.token + "]", words: letters( entry.meaning.split( ":" )[0] ) } ) );

/**
 * Places the unread icons ("[?]") of a line from the words round them: an icon whose objective the line names just
 * before it ("paint the Kite Objective (⊗ sticker)", "the Kite and Teapot Objectives (⊗ and ⊕ stickers)", with the
 * names from the app's own icon meanings) or whose own name follows it ("■ standstill"). Failing the words, the
 * icon's shape guess (acesSpecialOrderIconShape) places it.
 */
export const placeAcesSpecialOrderIcons = ( text: string, objective: string = "" ): string => {
    const words = text.split( " " );
    // The objectives the line names, in order: "Kite Objective", "Kite and Teapot Objectives".
    const named: string[] = [];
    const flat = text.toLowerCase();
    const pairs = /\b(\w+)\s+and\s+(\w+)\s+objectives?\b/.exec( flat );
    for( const word of pairs ? [ pairs[1], pairs[2] ] : ( flat.match( /\b\w+(?=\s+objectives?\b)/g ) || [] ) ) {
        const entry = tokenMeanings.find( ( meaning ) => meaning.words === letters( word ) + "objective" );
        if( entry ) named.push( entry.token );
    }
    let nextNamed = 0;
    return words.map( ( word, index ) => {
        const icon = /^(\(?)\[\?(\w*)\](.*)$/.exec( word );
        if( !icon ) return word;
        const place = ( token: string ) => icon[1] + token + icon[3];
        const previous = words[index - 1] || "";
        const after = words.slice( index + 1, index + 4 ).join( " " ).toLowerCase();
        // In brackets after the objectives' names, "(⊗ and ⊕ stickers)".
        const opened = icon[1] === "(" || /\($/.test( previous );
        if( nextNamed < named.length && ( opened || ( previous === "and" && nextNamed > 0 ) ) ) return place( named[nextNamed++] );
        const next = letters( words[index + 1] || "" );
        const own = tokenMeanings.find( ( meaning ) => next.length >= 4 && meaning.words === next );
        if( own ) return place( own.token );
        // An icon before "objective" on a card for that objective.
        if( objective && /^objective/.test( after ) ) return place( objective );
        // Failing the words, the icon's shape (acesSpecialOrderIconShape).
        return place( icon[2] ? "[" + icon[2] + "]" : "[?]" );
    } ).join( " " );
}

/** OCR slips in plain card text. */
export const tidyAcesSpecialOrderText = ( text: string ): string => text
    .replace( /\b([a-z]{3,})vs\b/g, "$1 vs" )
    .replace( /\b[Il1|]f(?=[a-z]{2,})/g, "If " )
    .replace( /\b1f\b/g, "If" )
    .replace( /(?<=[a-z])0\b/g, "o" )
    .replace( /\b0(?=[a-z])/g, "o" )
    .replace( /’/g, "'" )
    .replace( /[”“]/g, "\"" )
    .replace( /\(\s+/g, "(" )
    .replace( /\s+([),.:;])/g, "$1" )
    .replace( /\s+/g, " " )
    .trim();

/** Brackets OCR saw in a round icon ("3%)" for ⊗, "(D"): a bracket next to an icon with no partner goes. */
export const balanceBrackets = ( text: string ): string => {
    const open: number[] = [];
    const drop = new Set<number>();
    // Closing brackets just after an icon that matched an opening one: if a later bracket has no partner, the
    // icon's was OCR's ("(⊗) and ⊕ kites)" is "(⊗ and ⊕ kites)").
    const afterIcon: number[] = [];
    for( let index = 0; index < text.length; index++ ) {
        if( text[index] === "(" ) open.push( index );
        else if( text[index] === ")" ) {
            const iconBefore = text[index - 1] === "]" || ( text[index - 1] === ")" && text[index - 2] === "]" );
            if( open.length > 0 ) {
                open.pop();
                if( iconBefore ) afterIcon.push( index );
            } else if( iconBefore ) drop.add( index );
            else if( afterIcon.length > 0 ) drop.add( afterIcon.pop()! );
        }
    }
    for( const index of open ) if( text[index + 1] === "[" ) drop.add( index );
    return text.split( "" ).filter( ( _, index ) => !drop.has( index ) ).join( "" );
}

/** A pixel's darkness for ink tests: its brightest channel, so coloured print is light and only black is dark. */
const brightness = ( pixels: ArrayLike<number>, index: number ): number => Math.max( pixels[index * 4], pixels[index * 4 + 1], pixels[index * 4 + 2] );

/** Otsu's threshold between ink and paper over a region's pixels (brightest channel), for photos lit darker or lighter. */
export const acesSpecialOrderOtsu = ( pixels: ArrayLike<number>, width: number, height: number ): number => {
    const histogram = new Array<number>( 256 ).fill( 0 );
    const count = width * height;
    for( let index = 0; index < count; index++ ) histogram[Math.round( brightness( pixels, index ) )]++;
    let sum = 0;
    for( let value = 0; value < 256; value++ ) sum += value * histogram[value];
    let darkCount = 0, darkSum = 0, best = 0, threshold = 115;
    for( let value = 0; value < 256; value++ ) {
        darkCount += histogram[value];
        if( darkCount === 0 ) continue;
        const lightCount = count - darkCount;
        if( lightCount === 0 ) break;
        darkSum += value * histogram[value];
        const between = darkCount * lightCount * ( darkSum / darkCount - ( sum - darkSum ) / lightCount ) ** 2;
        if( between > best ) { best = between; threshold = value + 1; }
    }
    return threshold;
}

/** An icon's measurements, to match an icon the shapes can't name with one they named on the same card. */
export interface IAcesSpecialOrderIconSignature {
    /** Big solid parts of ink. */
    parts: number;
    holes: number;
    /** Width over height of the biggest part. */
    aspect: number;
    /** Share of the biggest part's box that is ink. */
    fill: number;
}

/**
 * A black icon's likely token from its shape, as a hint for placeAcesSpecialOrderIcons ("[?closer]"), which the words
 * round it can overrule, with its measurements: the ink's solid parts and the holes in them. ›‹ is two solid
 * arrowheads side by side; ⊗ a roughly square ring cut into four or more holes; ⊘ an eye cut by its slash into two or
 * three; with one hole, a wide shape is the eye 👁, a round one with a dot in it the ⌖, and one without a dot the hand
 * of ■ standstill. A solid blob (a bullet), an odd shape or anything else gives no hint: better "[?]" than a guess.
 */
export const acesSpecialOrderIconMeasure = ( pixels: ArrayLike<number>, width: number, height: number, threshold = 115 ): { token: string, signature: IAcesSpecialOrderIconSignature | null } => {
    const none = { token: "", signature: null };
    if( width <= 0 || height <= 0 ) return none;
    const ink = new Uint8Array( width * height );
    for( let index = 0; index < width * height; index++ ) ink[index] = brightness( pixels, index ) < threshold ? 1 : 0;
    // Connected parts of ink (value 1) or background (0), with their sizes, boxes and whether they reach the edge.
    const label = new Int32Array( width * height ).fill( -1 );
    const parts: { value: number, size: number, x0: number, y0: number, x1: number, y1: number, edge: boolean }[] = [];
    for( let start = 0; start < width * height; start++ ) {
        if( label[start] >= 0 ) continue;
        const id = parts.length;
        const part = { value: ink[start], size: 0, x0: width, y0: height, x1: 0, y1: 0, edge: false };
        const stack = [ start ];
        label[start] = id;
        while( stack.length > 0 ) {
            const at = stack.pop()!;
            const x = at % width, y = Math.floor( at / width );
            part.size++;
            part.x0 = Math.min( part.x0, x ); part.y0 = Math.min( part.y0, y ); part.x1 = Math.max( part.x1, x ); part.y1 = Math.max( part.y1, y );
            if( x === 0 || y === 0 || x === width - 1 || y === height - 1 ) part.edge = true;
            for( const [ dx, dy ] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ] ) {
                const nx = x + dx, ny = y + dy;
                if( nx < 0 || ny < 0 || nx >= width || ny >= height ) continue;
                const next = ny * width + nx;
                if( label[next] < 0 && ink[next] === part.value ) { label[next] = id; stack.push( next ); }
            }
        }
        parts.push( part );
    }
    const blobs = parts.filter( ( part ) => part.value === 1 ).sort( ( a, b ) => b.size - a.size );
    if( blobs.length === 0 || blobs[0].size < width * height * 0.05 ) return none;
    const main = blobs[0];
    const big = blobs.filter( ( blob ) => blob.size >= main.size * 0.4 );
    const holes = parts.filter( ( part ) => part.value === 0 && !part.edge && part.size >= main.size * 0.02
        && part.x0 >= main.x0 && part.x1 <= main.x1 && part.y0 >= main.y0 && part.y1 <= main.y1 );
    const aspect = ( main.x1 - main.x0 + 1 ) / ( main.y1 - main.y0 + 1 );
    const signature = { parts: big.length, holes: holes.length, aspect, fill: main.size / ( ( main.x1 - main.x0 + 1 ) * ( main.y1 - main.y0 + 1 ) ) };
    const guess = ( token: string ) => ( { token, signature } );
    if( big.length === 2 && holes.length === 0 ) {
        const [ a, b ] = big.slice().sort( ( p, q ) => p.x0 - q.x0 );
        const overlap = Math.min( a.y1, b.y1 ) - Math.max( a.y0, b.y0 );
        if( b.x0 >= a.x1 - 2 && overlap > ( a.y1 - a.y0 ) * 0.6 ) return guess( "[?closer]" );
    }
    // ⊘ printed as three parts: two halves of the eye with the slash, as tall as the whole, between them.
    const sizeable = blobs.filter( ( blob ) => blob.size >= main.size * 0.25 );
    if( holes.length === 0 && sizeable.length === 3 ) {
        const [ a, b, c ] = sizeable.slice().sort( ( p, q ) => ( p.x0 + p.x1 ) - ( q.x0 + q.x1 ) );
        const tall = Math.max( a.y1, b.y1, c.y1 ) - Math.min( a.y0, b.y0, c.y0 ) + 1;
        const across = Math.max( a.x1, b.x1, c.x1 ) - Math.min( a.x0, b.x0, c.x0 ) + 1;
        const height = ( part: typeof a ) => part.y1 - part.y0 + 1;
        if( height( b ) >= tall * 0.8 && height( a ) >= tall * 0.4 && height( c ) >= tall * 0.4 && across >= tall * 1.1 ) return guess( "[?nolos]" );
    }
    if( big.length !== 1 ) return guess( "" );
    if( holes.length >= 4 ) return guess( aspect >= 0.75 && aspect <= 1.33 ? "[?moveobj]" : "" );
    if( holes.length >= 2 ) return guess( "[?nolos]" );
    if( holes.length === 1 ) {
        if( aspect >= 1.35 ) return guess( "[?los]" );
        const hole = holes[0];
        const dot = blobs.some( ( blob ) => blob !== main && blob.x0 >= hole.x0 && blob.x1 <= hole.x1 && blob.y0 >= hole.y0 && blob.y1 <= hole.y1 );
        return guess( dot ? "[?range]" : "[?standstill]" );
    }
    return guess( "" );
}

/** The shape guess alone (see acesSpecialOrderIconMeasure). */
export const acesSpecialOrderIconShape = ( pixels: ArrayLike<number>, width: number, height: number, threshold = 115 ): string => acesSpecialOrderIconMeasure( pixels, width, height, threshold ).token;

/**
 * Icons met on one card: those the shapes named, and those they couldn't, which wait as "[?U<n>]" for the card's
 * end. An unnamed icon whose measurements match a named one's takes its token (resolveAcesSpecialOrderIcons).
 */
export interface IAcesSpecialOrderIconMemory {
    known: { signature: IAcesSpecialOrderIconSignature, token: string }[];
    unknown: IAcesSpecialOrderIconSignature[];
}

export const newAcesSpecialOrderIconMemory = (): IAcesSpecialOrderIconMemory => ( { known: [], unknown: [] } );

const sameIcon = ( a: IAcesSpecialOrderIconSignature, b: IAcesSpecialOrderIconSignature ): boolean => a.parts === b.parts && a.holes === b.holes
    && Math.abs( a.aspect - b.aspect ) <= Math.max( a.aspect, b.aspect ) * 0.2 && Math.abs( a.fill - b.fill ) <= 0.12;

/** Replaces the waiting "[?U<n>]" / "[U<n>]" icons in a text with the token of a matching named icon, else "[?]". */
export const resolveAcesSpecialOrderIcons = ( text: string, memory: IAcesSpecialOrderIconMemory ): string => text.replace( /\[\??U(\d+)\]/g, ( _, index: string ) => {
    const signature = memory.unknown[+index];
    const tokens = signature ? Array.from( new Set( memory.known.filter( ( entry ) => sameIcon( entry.signature, signature ) ).map( ( entry ) => entry.token ) ) ) : [];
    return tokens.length === 1 ? tokens[0] : "[?]";
} );

/**
 * A word OCR ran together with a short function word after it ("flewto"), split where the print shows a word's space:
 * blanks are the runs of empty columns inside the word's box (pixels from its left edge), wordSpace the line's usual
 * gap between words. Only a gap at least half a word space wide, where the function word would start, splits it.
 */
export const acesSpecialOrderSplitGlued = ( text: string, width: number, blanks: { start: number, end: number }[], wordSpace: number ): string => {
    const match = /^([A-Za-z]{2,})([.,:;]?)$/.exec( text );
    if( !match || width <= 0 ) return text;
    const letters = match[1];
    for( const blank of blanks ) {
        if( blank.end - blank.start < wordSpace * 0.5 ) continue;
        const at = ( blank.start + blank.end ) / 2 / width * letters.length;
        for( const small of [ "to", "of", "in", "at", "on", "or", "by", "and", "the", "for" ] ) {
            const split = letters.length - small.length;
            if( split >= 2 && letters.toLowerCase().endsWith( small ) && Math.abs( split - at ) <= 1.2 ) return letters.substring( 0, split ) + " " + letters.substring( split ) + match[2];
        }
    }
    return text;
}

/** Runs of ink-free columns inside a box, as pixels from its left edge. */
const blankColumns = ( io: ICardScanIO, box: ICardScanRect ): { start: number, end: number }[] => {
    const pixels = io.pixels( box );
    const threshold = acesSpecialOrderOtsu( pixels, box.width, box.height );
    const inked: boolean[] = [];
    for( let x = 0; x < box.width; x++ ) {
        let any = false;
        for( let y = 0; y < box.height && !any; y++ ) any = brightness( pixels, y * box.width + x ) < threshold;
        inked.push( any );
    }
    const first = inked.indexOf( true ), last = inked.lastIndexOf( true );
    return first < 0 ? [] : runs( inked.slice( first, last + 1 ).map( ( value ) => !value ), 1 ).map( ( run ) => ( { start: run.start + first, end: run.end + first } ) );
}

/** Marks that are never an icon: rules, specks and the panel's edge. */
const isStray = ( word: string ): boolean => /^[|=~_°'`‘’.,:;!—–-]+$/.test( word );

/**
 * A line's text with its icons as tokens: a mark whose own box (or the space just before the next word, or just after
 * the line's last word) shows blue, red or green is ▲, ▼ or the moved check; any other mark is named from its shape,
 * waits for the card's other icons (memory), or stays "[?]" for placeAcesSpecialOrderIcons. A plain mark opening the
 * line may be a bullet, which the caller decides.
 */
const lineText = ( line: ICardScanLine, io: ICardScanIO, panel: ICardScanRect | null = null, memory: IAcesSpecialOrderIconMemory | null = null, readLeft = panel ? panel.left : 0 ): { text: string, bullet: boolean } => {
    const height = Math.max( 1, line.bbox.y1 - line.bbox.y0 );
    const colourOf = ( x0: number, x1: number ) => x1 - x0 < height * 0.2 ? "" : colourToken( io.colours( clampRect( { left: x0, top: line.bbox.y0, width: x1 - x0, height: height }, io.width, io.height ) ) );
    const words = line.words.filter( ( word ) => word.text.trim() !== "" );
    const spaces = words.slice( 1 ).map( ( word, index ) => word.bbox.x0 - words[index].bbox.x1 ).filter( ( gap ) => gap > 0 ).sort( ( a, b ) => a - b );
    const wordSpace = spaces.length > 0 ? spaces[Math.floor( spaces.length / 2 )] : height * 0.3;
    const parts: string[] = [];
    let bullet = false;
    let previousEnd = line.bbox.x0;
    words.forEach( ( word, index ) => {
        const text = word.text.trim();
        if( isStray( text ) ) return;
        // A coloured icon can read as a digit or two ("2" for ▲); its own box shows the colour.
        const colouredShort = !/[A-Za-z]{2,}/.test( text ) && text.length <= 3 && colourOf( word.bbox.x0, word.bbox.x1 ) !== "";
        // A mark in the shading left of the panel is the card's edge or a bullet (found from the ink below), never an icon.
        if( panel && isMark( text ) && ( word.bbox.x0 + word.bbox.x1 ) / 2 < panel.left ) return;
        if( ( isMark( text ) || colouredShort ) && !/^[(),.:;"'!?-]+$/.test( text ) ) {
            const own = colourOf( word.bbox.x0, word.bbox.x1 );
            let open = /^\(/.test( text ) ? "(" : "", close = /\)[.,]?$/.test( text ) ? text.substring( text.lastIndexOf( ")" ) ) : "";
            // A round icon's ring can read as a pair of brackets: brackets really printed round an icon make its
            // box clearly wider than tall.
            if( open && close && word.bbox.x1 - word.bbox.x0 <= ( word.bbox.y1 - word.bbox.y0 ) * 1.12 ) {
                open = "";
                close = close.substring( 1 );
            }
            let shape = "";
            if( !own ) {
                const nextStart = index + 1 < words.length ? words[index + 1].bbox.x0 : word.bbox.x1 + height;
                const read = iconRead( io, word.bbox, line.bbox, height, previousEnd, nextStart );
                shape = read.token;
                if( read.signature && memory ) {
                    if( shape ) memory.known.push( { signature: read.signature, token: "[" + shape.substring( 2 ) } );
                    else if( parts.length > 0 ) {
                        memory.unknown.push( read.signature );
                        shape = "[?U" + ( memory.unknown.length - 1 ) + "]";
                    }
                }
            }
            if( parts.length === 0 && !own && !open && !shape ) bullet = true;
            parts.push( open + ( own || shape || "[?]" ) + close );
            previousEnd = word.bbox.x1;
            return;
        }
        // An icon OCR didn't see at all still shows its colour in the gap before the word.
        const gap = colourOf( Math.max( previousEnd, word.bbox.x0 - height * 1.3 ), word.bbox.x0 - height * 0.1 );
        if( gap && parts.length > 0 && !/^\(?\[/.test( parts[parts.length - 1] ) ) parts.push( gap );
        // A bullet OCR didn't see: a solid dark blob just left of the line's first word, inside the panel.
        if( parts.length === 0 && panel && bulletLeftOf( io, readLeft, word.bbox.x0, line.bbox.y0, height ) ) bullet = true;
        // A function word OCR ran into the word before it, where the print shows a space.
        let read = text;
        if( /^[A-Za-z]{4,}[.,:;]?$/.test( text ) ) {
            const box = clampRect( { left: word.bbox.x0, top: word.bbox.y0, width: word.bbox.x1 - word.bbox.x0, height: word.bbox.y1 - word.bbox.y0 }, io.width, io.height );
            if( box.width > 0 && box.height > 0 ) read = acesSpecialOrderSplitGlued( text, box.width, blankColumns( io, box ), wordSpace );
        }
        parts.push( read );
        previousEnd = word.bbox.x1;
    } );
    // A coloured icon after the line's last word, which OCR didn't see.
    if( parts.length > 0 && !/^\(?\[/.test( parts[parts.length - 1] ) ) {
        const end = panel ? panel.left + panel.width - 2 : io.width;
        const tail = colourOf( previousEnd + height * 0.1, Math.min( end, previousEnd + height * 1.4 ) );
        if( tail ) parts.push( tail );
    }
    return { text: tidyAcesSpecialOrderText( parts.join( " " ) ), bullet };
}

/**
 * A black icon's shape guess from its word box, padded a little; failing that from the ink it touches (OCR often boxes
 * only part of an icon), then with a threshold fitted to the photo, then unpadded.
 */
const iconRead = ( io: ICardScanIO, box: { x0: number, x1: number }, line: { y0: number, y1: number }, height: number, previousEnd: number, nextStart: number ): { token: string, signature: IAcesSpecialOrderIconSignature | null } => {
    const measure = ( x0: number, x1: number, otsu: boolean ) => {
        const rect = clampRect( { left: x0, top: line.y0, width: x1 - x0, height: height }, io.width, io.height );
        if( rect.width <= 0 || rect.height <= 0 ) return { token: "", signature: null };
        const pixels = io.pixels( rect );
        return acesSpecialOrderIconMeasure( pixels, rect.width, rect.height, otsu ? acesSpecialOrderOtsu( pixels, rect.width, rect.height ) : 115 );
    };
    const first = measure( box.x0 - height * 0.1, box.x1 + height * 0.1, false );
    if( first.token ) return first;
    // The ink the box touches: columns on either side that still hold ink, up to the neighbouring words.
    const left = Math.max( previousEnd + 1, box.x0 - height * 0.8 ), right = Math.min( nextStart - 1, box.x1 + height * 0.8 );
    const band = clampRect( { left: left, top: line.y0, width: Math.max( 1, right - left ), height: height }, io.width, io.height );
    const pixels = io.pixels( band );
    const inked = ( x: number ) => {
        for( let y = 0; y < band.height; y++ ) if( brightness( pixels, y * band.width + x ) < 115 ) return true;
        return false;
    };
    let x0 = Math.max( 0, Math.round( box.x0 - band.left ) ), x1 = Math.min( band.width - 1, Math.round( box.x1 - band.left ) );
    while( x0 > 0 && inked( x0 - 1 ) ) x0--;
    while( x1 < band.width - 1 && inked( x1 + 1 ) ) x1++;
    const pad = Math.max( 2, height * 0.05 );
    const grown = [ band.left + x0 - pad, band.left + x1 + 1 + pad ];
    let best = first;
    for( const [ from, to, otsu ] of [ [ grown[0], grown[1], false ], [ grown[0], grown[1], true ], [ box.x0, box.x1, true ] ] as [ number, number, boolean ][] ) {
        const read = measure( from, to, otsu );
        if( read.token ) return read;
        if( !best.signature && read.signature ) best = read;
    }
    return best;
}

/**
 * A bullet OCR didn't see: a short run of solidly dark columns just left of a line's first word, with paper on both
 * sides (not the card's dark edge), right of readLeft.
 */
const bulletLeftOf = ( io: ICardScanIO, readLeft: number, firstX: number, top: number, height: number ): boolean => {
    const left = Math.max( readLeft + 4, firstX - height * 2 ), right = firstX - height * 0.15;
    if( right - left < height * 0.3 ) return false;
    const rect = clampRect( { left, top: top + height * 0.2, width: right - left, height: height * 0.6 }, io.width, io.height );
    const pixels = io.pixels( rect );
    const solid: boolean[] = [];
    for( let x = 0; x < rect.width; x++ ) {
        let dark = 0;
        for( let y = 0; y < rect.height; y++ ) if( brightness( pixels, y * rect.width + x ) < 100 ) dark++;
        solid.push( dark > rect.height * 0.4 );
    }
    return runs( solid, Math.max( 2, Math.round( height * 0.25 ) ), 1 ).some( ( run ) => run.end - run.start <= height * 1.0 && run.start > 0 && run.end < solid.length );
}
/**
 * OCR lines as the card prints them, top to bottom: pieces of one row joined left to right, and lines far taller than
 * the rest (art read as text) dropped.
 */
const cardRows = ( lines: ICardScanLine[] ): ICardScanLine[] => {
    const kept = lines.filter( ( line ) => line.text.trim() !== "" && line.words.length > 0 );
    const heights = kept.map( ( line ) => line.bbox.y1 - line.bbox.y0 ).sort( ( a, b ) => a - b );
    const rowHeight = heights.length > 0 ? heights[Math.floor( heights.length / 2 )] : 0;
    const middle = ( line: ICardScanLine ) => ( line.bbox.y0 + line.bbox.y1 ) / 2;
    const rows: ICardScanLine[] = [];
    for( const line of kept.filter( ( entry ) => entry.bbox.y1 - entry.bbox.y0 <= rowHeight * 2 ).sort( ( a, b ) => middle( a ) - middle( b ) ) ) {
        const row = rows.find( ( entry ) => middle( line ) >= entry.bbox.y0 && middle( line ) <= entry.bbox.y1 && middle( entry ) >= line.bbox.y0 && middle( entry ) <= line.bbox.y1 );
        if( !row ) {
            rows.push( { ...line, words: line.words.slice() } );
            continue;
        }
        const pieces = [ row, { ...line } ].sort( ( a, b ) => a.bbox.x0 - b.bbox.x0 );
        row.text = pieces.map( ( piece ) => piece.text.trim() ).join( " " );
        row.words = pieces[0].words.concat( pieces[1].words );
        row.bbox = {
            x0: Math.min( row.bbox.x0, line.bbox.x0 ), y0: Math.min( row.bbox.y0, line.bbox.y0 ),
            x1: Math.max( row.bbox.x1, line.bbox.x1 ), y1: Math.max( row.bbox.y1, line.bbox.y1 ),
        };
    }
    return rows;
}

/** A panel line as the parsers take it: its text with icon tokens, where it starts, and how it opens. */
export interface IAcesSpecialOrderLine {
    text: string;
    /** Top and bottom, for the gaps between paragraphs. */
    top: number;
    bottom: number;
    /** It opens with a bullet. */
    bullet: boolean;
}

/** "1." or "2," opening a numbered item, and "0a." opening a filter to apply first ("Oa", "ob."). */
const itemNumber = /^\W{0,2}([1-9])\s*[.,:]\s*/;
export const acesSpecialOrderPreFilterLabel = /^\W{0,2}[0Oo]\s*([a-e])\s*[.,:]\s*/;

/**
 * Lines into items: a bullet, an item number or a gap wider than the line spacing opens a new item; any other line
 * carries on the item above. Bullets and numbers are dropped.
 */
export const joinAcesSpecialOrderItems = ( lines: IAcesSpecialOrderLine[], bullets = true ): string[] => {
    const spacings = lines.slice( 1 ).map( ( line, index ) => line.top - lines[index].top ).filter( ( gap ) => gap > 0 ).sort( ( a, b ) => a - b );
    const spacing = spacings.length > 0 ? spacings[Math.floor( spacings.length / 4 )] : Infinity;
    const items: string[] = [];
    let previous: IAcesSpecialOrderLine | null = null;
    let numberedCount = 0;
    for( const line of lines ) {
        let text = line.text.trim();
        if( !/[A-Za-z]{2,}/.test( text ) ) continue;
        // A stray mark ahead of an item number.
        text = text.replace( /^\[\?\]\s+(?=[1-9]\s*[.,:]|[0Oo]\s*[a-e]\s*[.,:])/, "" );
        const bullet = bullets && line.bullet;
        if( bullet ) text = text.replace( /^\[\?\]\s*/, "" );
        // An item number whose stop didn't read ("2 hop") counts when it is the next number.
        const bare = /^\W{0,2}([1-9])\s+(?=\S)/.exec( text );
        const numbered = itemNumber.exec( text ) || acesSpecialOrderPreFilterLabel.exec( text ) || ( bare && +bare[1] === numberedCount + 1 ? bare : null );
        if( numbered && /^\W{0,2}[1-9]/.test( numbered[0] ) ) numberedCount = +( /[1-9]/.exec( numbered[0] ) || [ "0" ] )[0];
        const gap = previous !== null && line.top - previous.top > spacing * 1.3;
        const body = numbered ? text.substring( numbered[0].length ) : text;
        if( items.length === 0 || bullet || numbered || gap ) items.push( body );
        else items[items.length - 1] += " " + body;
        previous = line;
    }
    return items.map( tidyAcesSpecialOrderText );
}

/** A heading as a rules line: "KITE RULES" to "Kite rules". */
const sentenceCase = ( text: string ): string => text.charAt( 0 ).toUpperCase() + text.substring( 1 ).toLowerCase();

export interface IAcesSpecialOrderPanel {
    column: IAcesBehaviorColumn | null;
    preFilters: string[];
    spotter: string[];
    /** Rules the panel adds: its heading, then each item. */
    rules: string[];
}

/** One right-panel row: its text (icons as tokens) and the colours across the panel's width. */
export interface IAcesSpecialOrderPanelRow extends IAcesSpecialOrderLine {
    colours: ICardScanColours;
}

const isZoneRow = ( text: string ): boolean => /^\W{0,3}(nearest|any)\W*$/i.test( text ) || /^\W*\d+\s*["”'’°]+\s*\)/.test( text );

/** A movement tab (the red J, yellow S): a row with a strong tag colour and no word. */
export const acesSpecialOrderTabOf = ( row: IAcesSpecialOrderPanelRow ): "jump" | "sprint" | null => {
    // Icon tokens are not words: OCR can take the tab's letter for an icon.
    if( /[A-Za-z]{3,}/.test( row.text.replace( /\[[^\]]*\]/g, "" ) ) ) return null;
    const tag = acesScanTagColour( row.colours );
    return tag === "red" ? "jump" : tag === "yellow" ? "sprint" : null;
}

/**
 * The right panel, from its heading and rows: filters labelled 0a, 0b ... to apply first; a behavior column (a zone
 * row or a movement tab before the numbered filters); a numbered list (the spotter list); or, failing all three, more
 * rules under the heading.
 */
export const parseAcesSpecialOrderPanel = ( heading: string, rows: IAcesSpecialOrderPanelRow[], objective: string = "" ): IAcesSpecialOrderPanel => {
    const rv: IAcesSpecialOrderPanel = { column: null, preFilters: [], spotter: [], rules: [] };
    const numberedList = rows.some( ( row ) => itemNumber.test( row.text.replace( /^\[\?\]\s+/, "" ) ) || acesSpecialOrderPreFilterLabel.test( row.text.replace( /^\[\?\]\s+/, "" ) ) );
    const items = ( list: IAcesSpecialOrderLine[] ) => joinAcesSpecialOrderItems( list, !numberedList ).map( ( item ) => balanceBrackets( placeAcesSpecialOrderIcons( item, objective ) ) );
    if( rows.some( ( row ) => acesSpecialOrderPreFilterLabel.test( row.text ) ) ) {
        const first = rows.findIndex( ( row ) => acesSpecialOrderPreFilterLabel.test( row.text ) );
        rv.preFilters = items( rows.slice( first ) );
        return rv;
    }
    const firstNumbered = rows.findIndex( ( row ) => itemNumber.test( row.text ) );
    const opening = rows.slice( 0, firstNumbered >= 0 ? firstNumbered : rows.length );
    const tabIndex = opening.findIndex( ( row ) => acesSpecialOrderTabOf( row ) !== null );
    if( firstNumbered >= 0 && ( tabIndex >= 0 || opening.some( ( row ) => isZoneRow( row.text ) ) ) ) {
        // The tab sets the movement; the rest of the opening rows (condition, zone) read as a behavior card's.
        const head = opening.filter( ( _, index ) => index !== tabIndex && opening[index].text.trim() !== "" );
        const column = parseAcesScanColumn( head.map( ( row ) => ( { text: row.text, colours: { red: 0, yellow: 0, blue: 0, green: 0 } } ) ) );
        column.moveType = tabIndex >= 0 ? acesSpecialOrderTabOf( opening[tabIndex] )! : "ground";
        column.altMoveType = null;
        column.altMoveWhen = "";
        // A tag with the app's fallback wording under a filter (altMoveWhen "if needed") is that filter's own
        // fallback movement: a yellow tag sprints, a red one jumps.
        const filterRows: IAcesSpecialOrderLine[] = [];
        for( const row of rows.slice( firstNumbered ) ) {
            const fallback = /^\W{0,3}(\S{0,3}?)\W{0,3}\s*(if\s*needed)\W*$/i.exec( row.text );
            if( fallback && filterRows.length > 0 ) {
                const tag = acesScanTagColour( row.colours );
                const token = tag === "yellow" || /^[S5$]$/i.test( fallback[1] ) ? "[sprint]" : tag === "red" || /^J$/i.test( fallback[1] ) ? "[jump]" : "[?]";
                const last = filterRows[filterRows.length - 1];
                filterRows[filterRows.length - 1] = { ...last, text: last.text + " (" + token + " if needed)", bottom: row.bottom };
                continue;
            }
            filterRows.push( row );
        }
        column.filters = items( filterRows );
        rv.column = column;
        return rv;
    }
    if( firstNumbered >= 0 ) {
        rv.spotter = items( rows.slice( firstNumbered ) );
        return rv;
    }
    const title = heading.replace( /[^A-Za-z ]/g, " " ).replace( /\s+/g, " " ).trim();
    rv.rules = [ ...( title ? [ sentenceCase( title ) ] : [] ), ...items( rows ) ];
    return rv;
}

/* ----- layout ----- */


interface IAcesSpecialOrderLayout {
    left: ICardScanRect;
    right: ICardScanRect;
    title: ICardScanRect;
    priority: ICardScanRect;
    footer: ICardScanRect;
}

const luminance = ( data: ArrayLike<number>, index: number ): number => 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];

/** Runs of true in a list, in order, bridging gaps of up to gap false entries (a line of print across a panel). */
const runs = ( flags: boolean[], minLength: number, gap = 0 ): { start: number, end: number }[] => {
    const rv: { start: number, end: number }[] = [];
    let start = -1, last = -1;
    flags.forEach( ( flag, index ) => {
        if( flag ) {
            if( start < 0 ) start = index;
            last = index;
        }
        if( start >= 0 && ( index - last > gap || index === flags.length - 1 ) ) {
            if( last + 1 - start >= minLength ) rv.push( { start, end: last + 1 } );
            start = -1;
        }
    } );
    return rv;
}

/**
 * The two light panels, from the photo's brightness: across the middle of the photo they are the two long light
 * runs, the rules panel the wider; down the rules panel, the light rows run from under the title band to the footer.
 */
const findLayout = ( io: ICardScanIO ): IAcesSpecialOrderLayout | null => {
    const step = 4;
    const band = clampRect( { left: 0, top: io.height * 0.45, width: io.width, height: io.height * 0.15 }, io.width, io.height );
    const pixels = io.pixels( band );
    const cell = 10;
    const columns: boolean[] = [];
    for( let x = 0; x + cell <= band.width; x += cell ) {
        let light = 0, count = 0;
        for( let y = 0; y < band.height; y += step ) for( let dx = 0; dx < cell; dx += 5 ) {
            if( luminance( pixels, ( y * band.width + x + dx ) * 4 ) > 140 ) light++;
            count++;
        }
        columns.push( light / count > 0.6 );
    }
    const wide = runs( columns, Math.round( io.width * 0.1 / cell ) );
    if( wide.length < 2 ) return null;
    const leftRun = wide.slice().sort( ( a, b ) => ( b.end - b.start ) - ( a.end - a.start ) )[0];
    const rightRun = wide.find( ( run ) => run.start >= leftRun.end );
    if( !rightRun || rightRun.end - rightRun.start > leftRun.end - leftRun.start ) return null;
    const leftX0 = leftRun.start * cell, leftX1 = leftRun.end * cell;
    const rightX0 = rightRun.start * cell, rightX1 = rightRun.end * cell;
    // Down the rules panel's middle half.
    const strip = clampRect( { left: leftX0 + ( leftX1 - leftX0 ) * 0.25, top: 0, width: ( leftX1 - leftX0 ) * 0.5, height: io.height }, io.width, io.height );
    const stripPixels = io.pixels( strip );
    const rows: boolean[] = [];
    for( let y = 0; y < strip.height; y += step ) {
        let light = 0, count = 0;
        for( let x = 0; x < strip.width; x += 5 ) {
            if( luminance( stripPixels, ( y * strip.width + x ) * 4 ) > 140 ) light++;
            count++;
        }
        rows.push( light / count > 0.5 );
    }
    const tall = runs( rows, Math.round( io.height * 0.3 / step ), 8 ).sort( ( a, b ) => ( b.end - b.start ) - ( a.end - a.start ) )[0];
    if( !tall ) return null;
    const top = tall.start * step, bottom = tall.end * step;
    const height = bottom - top;
    const rect = ( x0: number, y0: number, x1: number, y1: number ) => clampRect( { left: x0, top: y0, width: x1 - x0, height: y1 - y0 }, io.width, io.height );
    const leftWidth = leftX1 - leftX0;
    return {
        left: rect( leftX0, top, leftX1, bottom ),
        right: rect( rightX0, top, rightX1, bottom ),
        title: rect( leftX0 - leftWidth * 0.04, top - height * 0.27, rightX0, top - height * 0.01 ),
        priority: rect( rightX0, top - height * 0.27, rightX1 + ( rightX1 - rightX0 ) * 0.1, top - height * 0.01 ),
        footer: rect( leftX0 - leftWidth * 0.06, bottom - height * 0.01, leftX0 + leftWidth * 0.45, bottom + height * 0.1 ),
    };
}

/** The right panel's heading: the black bar across its top, white print on it. */
const headingBottom = ( io: ICardScanIO, panel: ICardScanRect ): number => {
    const strip = clampRect( { left: panel.left + panel.width * 0.1, top: panel.top, width: panel.width * 0.8, height: panel.height * 0.3 }, io.width, io.height );
    const pixels = io.pixels( strip );
    let last = -1;
    for( let y = 0; y < strip.height; y += 2 ) {
        let dark = 0, count = 0;
        for( let x = 0; x < strip.width; x += 5 ) {
            if( luminance( pixels, ( y * strip.width + x ) * 4 ) < 90 ) dark++;
            count++;
        }
        if( dark / count > 0.55 ) last = y;
        else if( last >= 0 && y - last > strip.height * 0.15 ) break;
    }
    return last >= 0 ? strip.top + last : panel.top;
}

/**
 * A minus before the priority's digits, from the white print's blobs: the digits are the tallest, and a minus is a
 * short wide bar just left of the first, about halfway up.
 */
export const acesSpecialOrderHasMinus = ( boxes: ICardScanBox[] ): boolean => {
    const tallest = Math.max( 0, ...boxes.map( ( box ) => box.y1 - box.y0 ) );
    const digits = boxes.filter( ( box ) => box.y1 - box.y0 >= tallest * 0.75 ).sort( ( a, b ) => a.x0 - b.x0 );
    if( digits.length < 3 || tallest < 8 ) return false;
    const first = digits[0];
    const middle = ( first.y0 + first.y1 ) / 2;
    return boxes.some( ( box ) => {
        const width = box.x1 - box.x0 + 1, height = box.y1 - box.y0 + 1;
        return box.x1 <= first.x0 + tallest * 0.1 && box.x1 >= first.x0 - tallest * 0.8 && width >= height * 1.5 && height <= tallest * 0.35
            && width >= tallest * 0.25 && Math.abs( ( box.y0 + box.y1 ) / 2 - middle ) <= tallest * 0.25;
    } );
}

/* ----- the whole scan ----- */

const linesIn = ( lines: ICardScanLine[] ): string => lines.map( ( line ) => line.text ).join( " " );

/** Special Orders print landscape; a scan that found the panels and the "Special Order" footer found the card. */
export const acesSpecialOrderScanOptions: ICardScanOptions<IAcesSpecialOrderScanResult> = { shape: "landscape", found: ( result ) => result.found };

export const scanAcesSpecialOrder = async ( io: ICardScanIO ): Promise<IAcesSpecialOrderScanResult> => {
    const result = emptyResult();
    const whole = await io.recognize( { left: 0, top: 0, width: io.width, height: io.height }, "plain" );
    const words = allWords( whole );
    // The other card kinds' own headings: a behavior card's three column names, a Command card's sections.
    const behavior = [ "AGGRESSIVE", "BALANCED", "CAUTIOUS" ].filter( ( name ) => words.some( ( word ) => fuzzyIs( word.text, name ) ) ).length >= 2;
    const command = [ "EMPLACEMENTS", "ARTILLERY", "STRATEGY", "ORDERS" ].filter( ( name ) => words.some( ( word ) => fuzzyIs( word.text, name ) ) ).length >= 2;
    // The layout and the footer read on their own come first, so a Special Order whose whole-photo read garbled
    // "Special" is still read; the other kinds' headings only name the card when that fails.
    const layout = findLayout( io );
    const footerText = layout ? linesIn( await io.recognize( layout.footer, "bright" ) ) : "";
    const named = ( text: string ) => /\bspec\w*\W+(or\w*|\w*der)\b/i.test( text ) || /\bspecial\b/i.test( text ) || /\border\s*\d/i.test( text );
    const footerNamed = named( footerText ) || ( !behavior && !command && named( linesIn( whole.filter( ( line ) => line.bbox.y0 > io.height * 0.75 ) ) ) );
    if( !layout || !footerNamed ) {
        if( behavior || command ) result.warnings.push( "This looks like " + ( behavior ? "a behavior card" : "a Command card" ) + ", not a Special Order: read it from " + ( behavior ? "a behavior card's" : "a Command card's" ) + " form." );
        else result.warnings.push( "Couldn't find the Special Order's panels and its \"Special Order\" footer. Take the photo straight on, with one card filling the frame." );
        return result;
    }
    result.found = true;

    result.cardNumber = parseAcesSpecialOrderCardNumber( footerText );
    for( const [ mode, scale ] of [ [ "dim", 1 ], [ "dim", 2 ], [ "plain", 1 ] ] as [ TCardScanMode, number ][] ) {
        if( !result.cardNumber ) result.cardNumber = parseAcesSpecialOrderCardNumber( linesIn( await io.recognize( layout.footer, mode, scale ) ) );
    }
    if( !result.cardNumber ) result.cardNumber = parseAcesSpecialOrderCardNumber( linesIn( whole.filter( ( line ) => line.bbox.y0 > io.height * 0.75 ) ) );

    // The name is the band's tallest print, white on the blue banner.
    const titleLines = cardRows( await io.recognize( layout.title, "bright" ) ).filter( ( line ) => /[A-Za-z]{3,}/.test( line.text ) );
    const tallest = titleLines.slice().sort( ( a, b ) => ( b.bbox.y1 - b.bbox.y0 ) - ( a.bbox.y1 - a.bbox.y0 ) )[0];
    const nameRead = tallest ? tallest.words.map( ( word ) => word.text.replace( /[^A-Za-z'-]/g, "" ) ).filter( ( word ) => word.length >= 2 ).join( " " ) : "";
    result.kind = acesSpecialOrderKindOf( nameRead );
    result.name = result.kind !== "other" ? kindName( result.kind ) : nameRead.toLowerCase().replace( /(^|\s)([a-z])/g, ( _, lead, letter ) => lead + letter.toUpperCase() );

    // White digits on gold ("-500") or black on white ("000"). OCR misreads big digits (5 as 3), so several reads
    // vote, as the behavior card reader does: the box as it is, then small sizes of its white print.
    const votes: { [digits: string]: number } = {};
    let minusRead = false, plusRead = false;
    const vote = ( text: string ) => {
        const read = parseAcesSpecialOrderPriority( text );
        if( read.priority === null ) return;
        const digits = String( Math.abs( read.priority ) ).padStart( 3, "0" );
        votes[digits] = ( votes[digits] || 0 ) + 1;
        if( read.priorityIsModifier && read.priority < 0 ) minusRead = true;
        if( read.priorityIsModifier && read.priority > 0 ) plusRead = true;
    };
    for( const mode of [ "bright", "dark" ] as TCardScanMode[] ) vote( linesIn( await io.recognize( layout.priority, mode, 1, true, "-+0123456789" ) ) );
    for( const mode of [ "digits", "dim-digits" ] as TCardScanMode[] ) for( const size of [ 30, 36, 42, 48 ] ) {
        vote( linesIn( await io.recognize( layout.priority, mode, Math.min( 1, size / ( layout.priority.height + cardScanMargin * 2 ) ) ) ) );
    }
    const ranked = Object.keys( votes ).sort( ( a, b ) => votes[b] - votes[a] );
    const best = ranked[0];
    // The objective orders print no priority: a stray number there needs at least two reads behind it.
    const objectiveKind = result.kind === "movement-objective" || result.kind === "destroy-objective";
    if( best !== undefined && !( objectiveKind && votes[best] < 2 ) ) {
        const minus = minusRead || acesSpecialOrderHasMinus( cardScanInkBoxes( io, layout.priority, "digits" ) );
        result.priority = minus ? -+best : +best;
        result.priorityIsModifier = minus || plusRead;
    }

    const objective = result.kind === "movement-objective" ? "[moveobj]" : result.kind === "destroy-objective" ? "[destroyobj]" : "";
    const memory = newAcesSpecialOrderIconMemory();
    // OCR reads a little left of a panel too: its print (a line's first letter, a bullet) can start in the shading at
    // its left edge, where the brightness is under the panel's mark.
    const panelLines = async ( rect: ICardScanRect, blanks = false, widen = 0 ): Promise<IAcesSpecialOrderPanelRow[]> => {
        const lineColours = ( top: number, bottom: number ) => io.colours( clampRect( { left: rect.left, top: top, width: rect.width, height: Math.max( 1, bottom - top ) }, io.width, io.height ) );
        const read = async ( area: ICardScanRect ) => {
            const lines = cardRows( await io.recognize( area, "panel" ) );
            return { lines, rows: lines.map( ( line ) => ( {
                ...lineText( line, io, rect, memory, area.left ), top: line.bbox.y0, bottom: line.bbox.y1, colours: lineColours( line.bbox.y0, line.bbox.y1 ),
            } ) ) };
        };
        let margin = rect;
        const memoryAt = { known: memory.known.length, unknown: memory.unknown.length };
        let first = await read( rect );
        // A row whose print starts right at the crop's left edge was cut: read again with a margin.
        if( widen > 0 && first.lines.some( ( line ) => line.bbox.x0 - rect.left < ( line.bbox.y1 - line.bbox.y0 ) * 0.25 ) ) {
            memory.known.length = memoryAt.known;
            memory.unknown.length = memoryAt.unknown;
            margin = clampRect( { ...rect, left: rect.left - rect.width * widen, width: rect.width * ( 1 + widen ) }, io.width, io.height );
            first = await read( margin );
        }
        const rows: IAcesSpecialOrderPanelRow[] = first.rows;
        if( rows.length === 0 ) return rows;
        const heights = rows.map( ( row ) => row.bottom - row.top ).sort( ( a, b ) => a - b );
        const rowHeight = heights[Math.floor( heights.length / 2 )];
        // OCR can drop a panel's last line (the panel's lower edge read with it as art): read the last row and the
        // space for one more under it again, short of the edge, and keep a new row with words.
        const last = rows[rows.length - 1];
        const panelBottom = rect.top + rect.height;
        if( panelBottom - last.bottom > rowHeight * 1.2 ) {
            const top = last.top - rowHeight * 0.2;
            const strip = clampRect( { left: margin.left, top: top, width: margin.width * 0.95, height: Math.min( panelBottom, last.bottom + rowHeight * 1.6 ) - top }, io.width, io.height );
            const more = ( await read( strip ) ).rows.filter( ( row ) => /[A-Za-z]{2,}/.test( row.text ) && row.top > last.bottom - rowHeight * 0.3 );
            rows.push( ...more );
        }
        if( !blanks ) return rows;
        // A row OCR gave nothing for, such as a movement tab, still shows its colour in the gap it leaves.
        const rv: IAcesSpecialOrderPanelRow[] = [];
        let previous = rect.top;
        for( const row of rows ) {
            if( row.top - previous > rowHeight * 1.6 ) {
                const top = previous + ( row.top - previous - rowHeight ) / 2;
                rv.push( { text: "", bullet: false, top: top, bottom: top + rowHeight, colours: lineColours( top, top + rowHeight ) } );
            }
            rv.push( row );
            previous = row.bottom;
        }
        return rv;
    };
    result.rules = joinAcesSpecialOrderItems( await panelLines( layout.left, false, 0.05 ) ).map( ( item ) => balanceBrackets( placeAcesSpecialOrderIcons( item, objective ) ) );

    const split = headingBottom( io, layout.right );
    const headingRect = clampRect( { ...layout.right, height: split - layout.right.top + 4 }, io.width, io.height );
    const heading = split > layout.right.top ? linesIn( await io.recognize( headingRect, "bright" ) ) : "";
    const body = clampRect( { ...layout.right, top: split + 4, height: layout.right.top + layout.right.height - split - 4 }, io.width, io.height );
    const panel = parseAcesSpecialOrderPanel( heading, await panelLines( body, true ), objective );
    result.column = panel.column;
    result.preFilters = panel.preFilters;
    result.spotter = panel.spotter;
    result.rules.push( ...panel.rules );
    // Icons the shapes couldn't name, matched with the ones they named on this card.
    const resolve = ( list: string[] ) => list.map( ( text ) => resolveAcesSpecialOrderIcons( text, memory ) );
    result.rules = resolve( result.rules );
    result.preFilters = resolve( result.preFilters );
    result.spotter = resolve( result.spotter );
    if( result.column ) {
        result.column.filters = resolve( result.column.filters );
        result.column.condition = resolve( [ result.column.condition ] )[0];
    }

    if( !result.name ) result.warnings.push( "Card name not read." );
    if( !result.cardNumber ) result.warnings.push( "Card number (e.g. 2/5) not read." );
    if( result.kind !== "movement-objective" && result.kind !== "destroy-objective" && result.priority === null ) result.warnings.push( "Priority number not read." );
    const unknown = JSON.stringify( result ).split( "[?]" ).length - 1;
    if( unknown > 0 ) result.warnings.push( unknown + " icon" + ( unknown > 1 ? "s" : "" ) + " couldn't be placed and show as [?]." );
    result.warnings.push( "Check every line against the card: OCR can misread words, and only the coloured icons (▲ highest, ▼ lowest, the moved check) are read from their colour." );
    return result;
}

/**
 * Puts a scan onto a Special Order draft: what was read replaces the draft's fields, and a field the scan didn't read
 * (no priority, no column, an empty list, kind "other") keeps what the player typed. Nothing changes when the card
 * wasn't found.
 */
export const applyAcesSpecialOrderScan = ( order: IAcesSpecialOrder | null, scan: IAcesSpecialOrderScanResult ): IAcesSpecialOrder => {
    const rv: IAcesSpecialOrder = order ? JSON.parse( JSON.stringify( order ) ) : newAcesSpecialOrder();
    if( !scan.found ) return rv;
    if( scan.name ) rv.name = scan.name;
    if( scan.kind !== "other" ) rv.kind = scan.kind;
    if( scan.cardNumber ) rv.cardNumber = scan.cardNumber;
    if( scan.priority !== null ) {
        rv.priority = scan.priority;
        rv.priorityIsModifier = scan.priorityIsModifier;
    }
    if( scan.rules.length > 0 ) rv.rules = scan.rules;
    if( scan.column ) rv.column = scan.column;
    if( scan.preFilters.length > 0 ) rv.preFilters = scan.preFilters;
    if( scan.spotter.length > 0 ) rv.spotter = scan.spotter;
    return JSON.parse( JSON.stringify( rv ) );
}
