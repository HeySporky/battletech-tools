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

/** The printed priority, "-500" (a modifier) or "000"; null when the box holds no three-digit number. */
export const parseAcesSpecialOrderPriority = ( text: string ): { priority: number | null, priorityIsModifier: boolean } => {
    const match = /([-–—~]?)\s*(\d{3})(?!\d)/.exec( text.replace( /[Oo]/g, "0" ) );
    if( !match ) return { priority: null, priorityIsModifier: false };
    const modifier = match[1] !== "";
    const value = +match[2];
    return { priority: modifier ? -value : value, priorityIsModifier: modifier };
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
 * Places the unread icons ("[?]") of a line from the words round them: an icon named just before it ("Movement
 * Objective (⊗ token)", "Movement and Destroy Objectives (⊗ and ⊕ tokens)") or just after it ("■ standstill"), and
 * the cards' fixed phrases for no line of sight ("⊘ all enemies", "have ⊘ to any enemy").
 */
export const placeAcesSpecialOrderIcons = ( text: string, objective: string = "" ): string => {
    const words = text.split( " " );
    // The objectives the line names, in order: "Movement Objective", "Movement and Destroy Objectives".
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
        // In brackets after the objectives' names, "(⊗ and ⊕ tokens)".
        const opened = icon[1] === "(" || /\($/.test( previous );
        if( nextNamed < named.length && ( opened || ( previous === "and" && nextNamed > 0 ) ) ) return place( named[nextNamed++] );
        const next = letters( words[index + 1] || "" );
        const own = tokenMeanings.find( ( meaning ) => next.length >= 4 && meaning.words === next );
        if( own ) return place( own.token );
        if( /^(all enemies|to any enemy|any enemy)\b/.test( after ) ) return place( "[nolos]" );
        // An icon before "objective" on a card for that objective.
        if( objective && /^objective/.test( after ) ) return place( objective );
        // Failing the words, the icon's shape (acesSpecialOrderIconShape).
        return place( icon[2] ? "[" + icon[2] + "]" : "[?]" );
    } ).join( " " );
}

/** OCR slips in plain card text. */
const tidyText = ( text: string ): string => text
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
const balanceBrackets = ( text: string ): string => {
    const open: number[] = [];
    const drop = new Set<number>();
    // Closing brackets just after an icon that matched an opening one: if a later bracket has no partner, the
    // icon's was OCR's ("(⊗) and ⊕ tokens)" is "(⊗ and ⊕ tokens)").
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
/** Share of a region's pixels dark enough to be print. */
const darkShare = ( io: ICardScanIO, rect: ICardScanRect ): number => {
    const pixels = io.pixels( rect );
    const count = Math.floor( pixels.length / 4 );
    let dark = 0;
    for( let index = 0; index < count; index++ ) if( Math.max( pixels[index * 4], pixels[index * 4 + 1], pixels[index * 4 + 2] ) < 100 ) dark++;
    return count > 0 ? dark / count : 0;
}

/**
 * A black icon's likely token from its shape, as a hint for placeAcesSpecialOrderIcons ("[?closer]"), which the words
 * round it can overrule: the ink's solid parts and the holes in them. ›‹ is two solid arrowheads side by side; ⊗ a
 * ring cut into four or more holes; ⊘ an eye cut by its slash into two or three; with one hole, a wide shape is the
 * eye 👁, a round one with a dot in it the ⌖, and one without a dot the hand of ■ standstill. A solid blob (a bullet)
 * or anything else gives no hint.
 */
export const acesSpecialOrderIconShape = ( pixels: ArrayLike<number>, width: number, height: number ): string => {
    const ink = new Uint8Array( width * height );
    for( let index = 0; index < width * height; index++ ) ink[index] = Math.max( pixels[index * 4], pixels[index * 4 + 1], pixels[index * 4 + 2] ) < 115 ? 1 : 0;
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
    if( blobs.length === 0 || blobs[0].size < width * height * 0.05 ) return "";
    const main = blobs[0];
    const big = blobs.filter( ( blob ) => blob.size >= main.size * 0.4 );
    const holes = parts.filter( ( part ) => part.value === 0 && !part.edge && part.size >= main.size * 0.02
        && part.x0 >= main.x0 && part.x1 <= main.x1 && part.y0 >= main.y0 && part.y1 <= main.y1 );
    if( big.length === 2 && holes.length === 0 ) {
        const [ a, b ] = big.slice().sort( ( p, q ) => p.x0 - q.x0 );
        const overlap = Math.min( a.y1, b.y1 ) - Math.max( a.y0, b.y0 );
        if( b.x0 >= a.x1 - 2 && overlap > ( a.y1 - a.y0 ) * 0.6 ) return "[?closer]";
    }
    if( big.length !== 1 ) return "";
    if( holes.length >= 4 ) return "[?moveobj]";
    if( holes.length >= 2 ) return "[?nolos]";
    if( holes.length === 1 ) {
        const wide = ( main.x1 - main.x0 + 1 ) / ( main.y1 - main.y0 + 1 );
        if( wide >= 1.35 ) return "[?los]";
        const hole = holes[0];
        const dot = blobs.some( ( blob ) => blob !== main && blob.x0 >= hole.x0 && blob.x1 <= hole.x1 && blob.y0 >= hole.y0 && blob.y1 <= hole.y1 );
        return dot ? "[?range]" : "[?standstill]";
    }
    return "";
}

/** Marks that are never an icon: rules, specks and the panel's edge. */
const isStray = ( word: string ): boolean => /^[|=~_°'`‘’.,:;!—–-]+$/.test( word );

/**
 * A line's text with its icons as tokens: a mark whose own box (or the space just before the next word) shows blue,
 * red or green is ▲, ▼ or the moved check; any other mark is an icon left as "[?]" for placeAcesSpecialOrderIcons.
 * A plain mark opening the line may be a bullet, which the caller decides.
 */
const lineText = ( line: ICardScanLine, io: ICardScanIO, panel: ICardScanRect | null = null ): { text: string, bullet: boolean } => {
    const height = Math.max( 1, line.bbox.y1 - line.bbox.y0 );
    const colourOf = ( x0: number, x1: number ) => x1 - x0 < height * 0.2 ? "" : colourToken( io.colours( clampRect( { left: x0, top: line.bbox.y0, width: x1 - x0, height: height }, io.width, io.height ) ) );
    const parts: string[] = [];
    let bullet = false;
    let previousEnd = line.bbox.x0;
    for( const word of line.words ) {
        const text = word.text.trim();
        if( text === "" || isStray( text ) ) continue;
        // A coloured icon can read as a digit or two ("2" for ▲); its own box shows the colour.
        const colouredShort = !/[A-Za-z]{2,}/.test( text ) && text.length <= 3 && colourOf( word.bbox.x0, word.bbox.x1 ) !== "";
        if( ( isMark( text ) || colouredShort ) && !/^[(),.:;"'!?-]+$/.test( text ) ) {
            const own = colourOf( word.bbox.x0, word.bbox.x1 );
            const open = /^\(/.test( text ) ? "(" : "", close = /\)[.,]?$/.test( text ) ? text.substring( text.lastIndexOf( ")" ) ) : "";
            let shape = "";
            if( !own ) {
                const box = clampRect( { left: word.bbox.x0 - height * 0.1, top: line.bbox.y0, width: word.bbox.x1 - word.bbox.x0 + height * 0.2, height: height }, io.width, io.height );
                shape = acesSpecialOrderIconShape( io.pixels( box ), box.width, box.height );
            }
            if( parts.length === 0 && !own && !open && !shape ) bullet = true;
            parts.push( open + ( own || shape || "[?]" ) + close );
            previousEnd = word.bbox.x1;
            continue;
        }
        // An icon OCR didn't see at all still shows its colour in the gap before the word.
        const gap = colourOf( Math.max( previousEnd, word.bbox.x0 - height * 1.3 ), word.bbox.x0 - height * 0.1 );
        if( gap && parts.length > 0 && !/^\(?\[/.test( parts[parts.length - 1] ) ) parts.push( gap );
        // A bullet OCR didn't see: a solid dark blob just left of the line's first word, inside the panel.
        if( parts.length === 0 && panel ) {
            const left = Math.max( panel.left + 4, word.bbox.x0 - height * 1.2 ), right = word.bbox.x0 - height * 0.15;
            if( right - left > height * 0.5 && darkShare( io, clampRect( { left, top: line.bbox.y0 + height * 0.2, width: right - left, height: height * 0.6 }, io.width, io.height ) ) > 0.25 ) bullet = true;
        }
        parts.push( text );
        previousEnd = word.bbox.x1;
    }
    return { text: tidyText( parts.join( " " ) ), bullet };
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
const preFilterLabel = /^\W{0,2}[0Oo]\s*([a-e])\s*[.,:]\s*/;

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
        // An item number whose stop didn't read ("2 escape") counts when it is the next number.
        const bare = /^\W{0,2}([1-9])\s+(?=\S)/.exec( text );
        const numbered = itemNumber.exec( text ) || preFilterLabel.exec( text ) || ( bare && +bare[1] === numberedCount + 1 ? bare : null );
        if( numbered && /^\W{0,2}[1-9]/.test( numbered[0] ) ) numberedCount = +( /[1-9]/.exec( numbered[0] ) || [ "0" ] )[0];
        const gap = previous !== null && line.top - previous.top > spacing * 1.3;
        const body = numbered ? text.substring( numbered[0].length ) : text;
        if( items.length === 0 || bullet || numbered || gap ) items.push( body );
        else items[items.length - 1] += " " + body;
        previous = line;
    }
    return items.map( tidyText );
}

/** "DEFAULT STATS" as a rules line, "Default stats". */
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
const tabOf = ( row: IAcesSpecialOrderPanelRow ): "jump" | "sprint" | null => {
    if( /[A-Za-z]{3,}/.test( row.text ) ) return null;
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
    const numberedList = rows.some( ( row ) => itemNumber.test( row.text.replace( /^\[\?\]\s+/, "" ) ) || preFilterLabel.test( row.text.replace( /^\[\?\]\s+/, "" ) ) );
    const items = ( list: IAcesSpecialOrderLine[] ) => joinAcesSpecialOrderItems( list, !numberedList ).map( ( item ) => balanceBrackets( placeAcesSpecialOrderIcons( item, objective ) ) );
    if( rows.some( ( row ) => preFilterLabel.test( row.text ) ) ) {
        const first = rows.findIndex( ( row ) => preFilterLabel.test( row.text ) );
        rv.preFilters = items( rows.slice( first ) );
        return rv;
    }
    const firstNumbered = rows.findIndex( ( row ) => itemNumber.test( row.text ) );
    const opening = rows.slice( 0, firstNumbered >= 0 ? firstNumbered : rows.length );
    const tabIndex = opening.findIndex( ( row ) => tabOf( row ) !== null );
    if( firstNumbered >= 0 && ( tabIndex >= 0 || opening.some( ( row ) => isZoneRow( row.text ) ) ) ) {
        // The tab sets the movement; the rest of the opening rows (condition, zone) read as a behavior card's.
        const head = opening.filter( ( _, index ) => index !== tabIndex && opening[index].text.trim() !== "" );
        const column = parseAcesScanColumn( head.map( ( row ) => ( { text: row.text, colours: { red: 0, yellow: 0, blue: 0, green: 0 } } ) ) );
        column.moveType = tabIndex >= 0 ? tabOf( opening[tabIndex] )! : "ground";
        column.altMoveType = null;
        column.altMoveWhen = "";
        // "(S if needed)" under a filter is that filter's own fallback movement.
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
const hasMinus = ( boxes: ICardScanBox[] ): boolean => {
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
    const behavior = [ "AGGRESSIVE", "BALANCED", "CAUTIOUS" ].filter( ( name ) => words.some( ( word ) => fuzzyIs( word.text, name ) ) ).length >= 2
        || ( words.some( ( word ) => fuzzyIs( word.text, "TARGET" ) ) && words.some( ( word ) => fuzzyIs( word.text, "COMBAT" ) ) && !words.some( ( word ) => /^spec/i.test( word.text ) ) );
    const command = [ "EMPLACEMENTS", "ARTILLERY", "STRATEGY", "ORDERS" ].filter( ( name ) => words.some( ( word ) => fuzzyIs( word.text, name ) ) ).length >= 2;
    if( behavior || command ) {
        result.warnings.push( "This looks like " + ( behavior ? "a behavior card" : "a Command card" ) + ", not a Special Order: read it from " + ( behavior ? "a behavior card's" : "a Command card's" ) + " form." );
        return result;
    }
    const layout = findLayout( io );
    const footerText = layout ? linesIn( await io.recognize( layout.footer, "bright" ) ) : "";
    const named = ( text: string ) => /\bspec\w*\W+(or\w*|\w*der)\b/i.test( text ) || /\bspecial\b/i.test( text ) || /\border\s*\d/i.test( text );
    if( !layout || !( named( footerText ) || named( linesIn( whole.filter( ( line ) => line.bbox.y0 > io.height * 0.75 ) ) ) ) ) {
        result.warnings.push( "Couldn't find the Special Order's panels and its \"Special Order\" footer. Take the photo straight on, with one card filling the frame." );
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
    let signRead = false;
    const vote = ( text: string ) => {
        const read = parseAcesSpecialOrderPriority( text );
        if( read.priority === null ) return;
        const digits = String( Math.abs( read.priority ) ).padStart( 3, "0" );
        votes[digits] = ( votes[digits] || 0 ) + 1;
        if( read.priorityIsModifier ) signRead = true;
    };
    for( const mode of [ "bright", "dark" ] as TCardScanMode[] ) vote( linesIn( await io.recognize( layout.priority, mode, 1, true, "-0123456789" ) ) );
    for( const mode of [ "digits", "dim-digits" ] as TCardScanMode[] ) for( const size of [ 30, 36, 42, 48 ] ) {
        vote( linesIn( await io.recognize( layout.priority, mode, Math.min( 1, size / ( layout.priority.height + cardScanMargin * 2 ) ) ) ) );
    }
    const best = Object.keys( votes ).sort( ( a, b ) => votes[b] - votes[a] )[0];
    if( best !== undefined ) {
        const modifier = signRead || hasMinus( cardScanInkBoxes( io, layout.priority, "digits" ) );
        result.priority = modifier ? -+best : +best;
        result.priorityIsModifier = modifier;
    }

    const objective = result.kind === "movement-objective" ? "[moveobj]" : result.kind === "destroy-objective" ? "[destroyobj]" : "";
    const panelLines = async ( rect: ICardScanRect, blanks = false ): Promise<IAcesSpecialOrderPanelRow[]> => {
        const lineColours = ( top: number, bottom: number ) => io.colours( clampRect( { left: rect.left, top: top, width: rect.width, height: Math.max( 1, bottom - top ) }, io.width, io.height ) );
        const rows: IAcesSpecialOrderPanelRow[] = cardRows( await io.recognize( rect, "panel" ) ).map( ( line ) => ( {
            ...lineText( line, io, rect ), top: line.bbox.y0, bottom: line.bbox.y1, colours: lineColours( line.bbox.y0, line.bbox.y1 ),
        } ) );
        if( !blanks || rows.length === 0 ) return rows;
        // A row OCR gave nothing for, such as a movement tab, still shows its colour in the gap it leaves.
        const heights = rows.map( ( row ) => row.bottom - row.top ).sort( ( a, b ) => a - b );
        const rowHeight = heights[Math.floor( heights.length / 2 )];
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
    result.rules = joinAcesSpecialOrderItems( await panelLines( layout.left ) ).map( ( item ) => balanceBrackets( placeAcesSpecialOrderIcons( item, objective ) ) );

    const split = headingBottom( io, layout.right );
    const headingRect = clampRect( { ...layout.right, height: split - layout.right.top + 4 }, io.width, io.height );
    const heading = split > layout.right.top ? linesIn( await io.recognize( headingRect, "bright" ) ) : "";
    const body = clampRect( { ...layout.right, top: split + 4, height: layout.right.top + layout.right.height - split - 4 }, io.width, io.height );
    const panel = parseAcesSpecialOrderPanel( heading, await panelLines( body, true ), objective );
    result.column = panel.column;
    result.preFilters = panel.preFilters;
    result.spotter = panel.spotter;
    result.rules.push( ...panel.rules );

    if( !result.name ) result.warnings.push( "Card name not read." );
    if( !result.cardNumber ) result.warnings.push( "Card number (e.g. 2/5) not read." );
    if( result.kind !== "movement-objective" && result.kind !== "destroy-objective" && result.priority === null ) result.warnings.push( "Priority number not read." );
    const unknown = JSON.stringify( result ).split( "[?]" ).length - 1;
    if( unknown > 0 ) result.warnings.push( unknown + " icon" + ( unknown > 1 ? "s" : "" ) + " couldn't be placed and show as [?]." );
    result.warnings.push( "Check every line against the card: OCR can misread words, and only the coloured icons (▲ highest, ▼ lowest, the moved check) are read from their colour." );
    return result;
}

/** Puts a scan onto a Special Order draft: what was read replaces the draft's fields; nothing changes when the card wasn't found. */
export const applyAcesSpecialOrderScan = ( order: IAcesSpecialOrder | null, scan: IAcesSpecialOrderScanResult ): IAcesSpecialOrder => {
    const rv: IAcesSpecialOrder = order ? JSON.parse( JSON.stringify( order ) ) : newAcesSpecialOrder();
    if( !scan.found ) return rv;
    if( scan.name ) rv.name = scan.name;
    rv.kind = scan.kind;
    if( scan.cardNumber ) rv.cardNumber = scan.cardNumber;
    rv.priority = scan.priority;
    rv.priorityIsModifier = scan.priorityIsModifier;
    if( scan.rules.length > 0 ) rv.rules = scan.rules;
    rv.column = scan.column;
    rv.preFilters = scan.preFilters;
    rv.spotter = scan.spotter;
    return JSON.parse( JSON.stringify( rv ) );
}
