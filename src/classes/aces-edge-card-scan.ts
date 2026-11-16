import { IAcesEdgeCard, newAcesEdgeCard, TAcesEdgePhase, TAcesEdgeTrigger } from "../data/aces-cards";
import { allWords, clampRect, fuzzyIs } from "./aces-card-scan";
import { acesScanBlankColumns, acesScanCardRows, acesSpecialOrderOtsu, acesSpecialOrderSplitGlued } from "./aces-special-order-scan";
import { cardScanInkBoxes, cardScanRows, ICardScanIO, ICardScanLine, ICardScanOptions, ICardScanRect, TCardScanMode } from "./card-scan-io";

/*
 * Reads an Aces Edge card from a photo of the player's own card, as the other Aces card readers do
 * (aces-card-scan.ts, aces-command-card-scan.ts, aces-special-order-scan.ts): text from OCR, and the result is a
 * draft the player checks against the card before saving.
 *
 * The card prints portrait: art at the top, then a dark band with the name over its category (and any unit type
 * limit, "BM ONLY"), then a light panel holding a bold condition ending in ":" and the card's text, and under the
 * panel a footer whose left end holds the card number ("n/12"). The cost is the first "Spend N Edge"; the phase and
 * the trigger come from the words of the condition and the category (the app's own TAcesEdgePhase and
 * TAcesEdgeTrigger lists).
 */

export interface IAcesEdgeScanResult {
    found: boolean;
    name: string;
    category: string;
    cardNumber: string;
    condition: string;
    text: string;
    cost: number | null;
    phase: TAcesEdgePhase;
    trigger: TAcesEdgeTrigger;
    /** What the player should check by hand. */
    warnings: string[];
}

const emptyResult = (): IAcesEdgeScanResult => ( {
    found: false, name: "", category: "", cardNumber: "", condition: "", text: "", cost: null, phase: "any", trigger: "none", warnings: [],
} );

/* ----- fields from the text ----- */

/** The cost: the number in the first "Spend N Edge" ("Spend up to N Edge"); null when the text has none. */
export const parseAcesEdgeCost = ( text: string ): number | null => {
    const match = /\bspend\s+(?:up\s+to\s+)?([0-9lI|!O])\s+edge\b/i.exec( text );
    if( !match ) return null;
    const digit = match[1].replace( /[lI|!]/, "1" ).replace( "O", "0" );
    return +digit;
}

/** The bold condition is everything up to the first colon; with no colon, all of it is the card's text. */
export const splitAcesEdgeCondition = ( text: string ): { condition: string, text: string } => {
    const at = text.indexOf( ":" );
    if( at < 0 ) return { condition: "", text: text.trim() };
    return { condition: text.substring( 0, at + 1 ).trim(), text: text.substring( at + 1 ).trim() };
}

/**
 * The card number at the footer's left end, "7/12". The slash can read as a 1, l or I ("3112" is 3/12): the
 * number is then split where it leaves a card number no bigger than the deck, of one or two digits each.
 */
export const parseAcesEdgeCardNumber = ( text: string ): string => {
    // The icon before the number can read as one more digit ("42/12" for 2/12): the last digits that fit win.
    const plain = /(?<!\d)(\d{1,3})\s*\/\s*(\d{1,2})(?!\d)/.exec( text );
    if( plain ) for( const left of [ plain[1].slice( -2 ), plain[1].slice( -1 ) ] ) {
        if( +left >= 1 && +left <= +plain[2] && plain[2][0] !== "0" ) return +left + "/" + +plain[2];
    }
    // No slash read: a digit run split where the slash read as a 1 (or l, I), else where it didn't read at all,
    // first as read and then without a leading character (the icon before the number).
    const fits = ( left: string, right: string ) => /^\d{1,2}$/.test( left ) && /^[1-9]\d?$/.test( right ) && +left >= 1 && +left <= +right;
    for( const word of text.split( /\s+/ ) ) {
        // Not the copyright year.
        if( /©/.test( word ) ) continue;
        const run = /[0-9lI|]{3,6}$/.exec( word.replace( /\W+$/, "" ) );
        if( !run || !/\d/.test( run[0] ) ) continue;
        for( const chars of [ run[0], run[0].substring( 1 ) ] ) {
            for( let at = 1; at < chars.length - 1; at++ ) {
                if( /[1lI|]/.test( chars[at] ) && fits( chars.substring( 0, at ), chars.substring( at + 1 ) ) ) return +chars.substring( 0, at ) + "/" + +chars.substring( at + 1 );
            }
            for( let at = 1; at < chars.length; at++ ) {
                if( fits( chars.substring( 0, at ), chars.substring( at ) ) ) return +chars.substring( 0, at ) + "/" + +chars.substring( at );
            }
        }
    }
    return "";
}

/**
 * Several reads of one line, word by word: each word the one most reads agree on, ties to the earlier read. Reads
 * with another number of words than the first don't vote; a blank first read gives way to the next.
 */
export const voteAcesEdgeWords = ( reads: string[] ): string => {
    const lists = reads.map( ( read ) => read.split( /\s+/ ).filter( ( word ) => word !== "" ) ).filter( ( list ) => list.length > 0 );
    if( lists.length === 0 ) return "";
    const voters = lists.filter( ( list ) => list.length === lists[0].length );
    return lists[0].map( ( _word, index ) => {
        const counts = new Map<string, number>();
        for( const list of voters ) counts.set( list[index], ( counts.get( list[index] ) || 0 ) + 1 );
        let best = lists[0][index];
        counts.forEach( ( count, word ) => { if( count > ( counts.get( best ) || 0 ) ) best = word; } );
        return best;
    } ).join( " " );
}

/** The card number's printed glyphs: how many, which is the slash, and which have a foot (see acesEdgeSlashAt). */
export interface IAcesEdgeGlyphs {
    glyphs: number;
    slash: number;
    feet?: boolean[];
}

/**
 * Where the slash falls among the card number's printed glyphs, from the light print's blobs (RGBA pixels of the
 * number's place): grey-white blobs left to right, coloured ones (the icon) and specks left out. The slash is the
 * blob that leans (its rows' ink runs left as it goes down) and is narrow on every row; a 7 or a 4 leans too but
 * has a row as wide as itself. Null when no blob is a slash.
 */
export const acesEdgeSlashAt = ( pixels: ArrayLike<number>, width: number, height: number ): IAcesEdgeGlyphs | null => {
    if( width <= 0 || height <= 0 ) return null;
    const threshold = acesSpecialOrderOtsu( pixels, width, height );
    const value = ( index: number ) => Math.max( pixels[index * 4], pixels[index * 4 + 1], pixels[index * 4 + 2] );
    const ink = new Uint8Array( width * height );
    for( let index = 0; index < width * height; index++ ) ink[index] = value( index ) >= threshold ? 1 : 0;
    const seen = new Uint8Array( width * height );
    const blobs: { x0: number, x1: number, y0: number, y1: number, cells: number[], colour: number }[] = [];
    for( let start = 0; start < ink.length; start++ ) {
        if( !ink[start] || seen[start] ) continue;
        const cells = [ start ];
        seen[start] = 1;
        for( let at = 0; at < cells.length; at++ ) {
            const x = cells[at] % width, y = Math.floor( cells[at] / width );
            for( let dy = -1; dy <= 1; dy++ ) for( let dx = -1; dx <= 1; dx++ ) {
                const nx = x + dx, ny = y + dy;
                if( nx < 0 || ny < 0 || nx >= width || ny >= height ) continue;
                const next = ny * width + nx;
                if( ink[next] && !seen[next] ) { seen[next] = 1; cells.push( next ); }
            }
        }
        const xs = cells.map( ( cell ) => cell % width ), ys = cells.map( ( cell ) => Math.floor( cell / width ) );
        // How coloured the blob is: the mean spread of its channels over its brightest.
        const colour = cells.reduce( ( sum, cell ) => {
            const r = pixels[cell * 4], g = pixels[cell * 4 + 1], b = pixels[cell * 4 + 2];
            const max = Math.max( r, g, b );
            return sum + ( max > 0 ? ( max - Math.min( r, g, b ) ) / max : 0 );
        }, 0 ) / cells.length;
        blobs.push( { x0: Math.min( ...xs ), x1: Math.max( ...xs ), y0: Math.min( ...ys ), y1: Math.max( ...ys ), cells, colour } );
    }
    const tallest = Math.max( 0, ...blobs.filter( ( blob ) => blob.colour < 0.3 ).map( ( blob ) => blob.y1 - blob.y0 + 1 ) );
    const glyphs = blobs.filter( ( blob ) => blob.colour < 0.3 && blob.y1 - blob.y0 + 1 >= tallest * 0.6 && blob.y0 > 0 && blob.y1 < height - 1 ).sort( ( a, b ) => a.x0 - b.x0 );
    const slash = glyphs.findIndex( ( blob ) => {
        const tall = blob.y1 - blob.y0 + 1, wide = blob.x1 - blob.x0 + 1;
        const rows = new Map<number, number[]>();
        for( const cell of blob.cells ) {
            const y = Math.floor( cell / width );
            const row = rows.get( y ) || [];
            row.push( cell % width );
            rows.set( y, row );
        }
        let widest = 0;
        const top: number[] = [], bottom: number[] = [];
        rows.forEach( ( xs, y ) => {
            widest = Math.max( widest, Math.max( ...xs ) - Math.min( ...xs ) + 1 );
            const centre = xs.reduce( ( sum, x ) => sum + x, 0 ) / xs.length;
            if( y < blob.y0 + tall * 0.25 ) top.push( centre );
            if( y > blob.y1 - tall * 0.25 ) bottom.push( centre );
        } );
        const mean = ( list: number[] ) => list.reduce( ( sum, x ) => sum + x, 0 ) / Math.max( 1, list.length );
        return wide >= tall * 0.25 && mean( top ) - mean( bottom ) >= wide * 0.4 && widest <= wide * 0.6;
    } );
    // A glyph with a foot: a row near its bottom nearly as wide as the glyph (a 2 has one, a 7 never does).
    const feet = glyphs.map( ( blob ) => {
        const tall = blob.y1 - blob.y0 + 1, wide = blob.x1 - blob.x0 + 1;
        const rows = new Map<number, { x0: number, x1: number }>();
        for( const cell of blob.cells ) {
            const y = Math.floor( cell / width ), x = cell % width;
            if( y < blob.y1 - tall * 0.2 ) continue;
            const row = rows.get( y ) || { x0: x, x1: x };
            rows.set( y, { x0: Math.min( row.x0, x ), x1: Math.max( row.x1, x ) } );
        }
        let widest = 0;
        rows.forEach( ( row ) => { widest = Math.max( widest, row.x1 - row.x0 + 1 ); } );
        return wide >= tall * 0.25 && widest >= wide * 0.75;
    } );
    return slash > 0 && slash < glyphs.length - 1 ? { glyphs: glyphs.length, slash, feet } : null;
}

/**
 * A card number read with the slash lost or read as a digit, mended from where acesEdgeSlashAt saw it: the read's
 * last run of digits (and 1-like marks) has a character for every glyph, or one fewer.
 */
export const placeAcesEdgeSlash = ( read: string, at: IAcesEdgeGlyphs ): string => {
    const runs = read.replace( /[lI|]/g, "1" ).match( /\d+/g ) || [];
    const run = runs.length > 0 ? runs[runs.length - 1] : "";
    // A 7 read on a glyph with a foot is a 2 whose thin bottom stroke didn't read.
    const glyphOf = ( index: number ) => run.length === at.glyphs || index < at.slash ? index : index + 1;
    const digits = run.split( "" ).map( ( char, index ) => char === "7" && at.feet && at.feet[glyphOf( index )] ? "2" : char ).join( "" );
    let left = "", right = "";
    // A character for every glyph: the slash read as a stroke (a 1 or a 7). Any other digit there means the slash
    // was lost and something before the number (the icon) read as a digit.
    if( digits.length === at.glyphs && /[17]/.test( digits[at.slash] ) ) {
        left = digits.substring( 0, at.slash );
        right = digits.substring( at.slash + 1 );
    } else if( digits.length === at.glyphs - 1 ) {
        left = digits.substring( 0, at.slash );
        right = digits.substring( at.slash );
    }
    return left && right && right[0] !== "0" && +left >= 1 && +left <= +right ? +left + "/" + +right : "";
}

/**
 * The category line: the category, then any unit type limit ("BM / CV ONLY"): the two-character codes (and slashes)
 * just before a closing ONLY. They are kept together as "KITES, BM / CV ONLY". When a code there isn't surely a unit
 * type, the limit is left unread (limitUnread) rather than guessed, and only the category is given.
 */
export const parseAcesEdgeCategoryLine = ( text: string ): { category: string, limitUnread: boolean } => {
    const tokens = text.replace( /[—–]/g, " " ).replace( /\//g, " / " ).split( /\s+/ ).filter( ( token ) => token !== "" );
    const words = ( list: string[] ) => list.map( ( token ) => token.replace( /[^A-Za-z'-]/g, "" ) ).filter( ( token ) => /[A-Za-z]{2,}/.test( token ) );
    const only = tokens.findIndex( ( token ) => /^[O0]NLY\W*$/i.test( token ) );
    if( only < 0 ) return { category: words( tokens ).join( " " ), limitUnread: false };
    // Back from ONLY over the code-shaped tokens: slashes and two characters.
    const codeShaped = ( token: string ) => token === "/" || token.replace( /[^A-Za-z0-9$]/g, "" ).length === 2;
    let limitAt = only;
    while( limitAt > 0 && codeShaped( tokens[limitAt - 1] ) ) limitAt--;
    const category = words( tokens.slice( 0, limitAt ) ).join( " " );
    const codes = tokens.slice( limitAt, only ).filter( ( token ) => token !== "/" );
    const types = codes.map( acesEdgeUnitType );
    if( codes.length === 0 || types.includes( "" ) ) return { category, limitUnread: true };
    const limit = types.join( " / " ) + " ONLY";
    return { category: category ? category + ", " + limit : limit, limitUnread: false };
}

/** The category line as one value (see parseAcesEdgeCategoryLine). */
export const parseAcesEdgeCategory = ( text: string ): string => parseAcesEdgeCategoryLine( text ).category;

/** Alpha Strike unit types. */
const unitTypes = [ "BM", "CV", "PM", "IM", "BA", "CI", "SV", "AF", "CF", "MS", "DS", "DA", "SC", "WS", "SS", "JS" ];

/** OCR slips in the band's white capitals: what a character read as could have been printed as. */
const ocrSlips: { [read: string]: string[] } = {
    "5": [ "S", "B" ], "8": [ "B" ], "3": [ "B" ], "$": [ "S" ], "G": [ "C" ], "6": [ "G", "C" ], "0": [ "O", "D" ],
    "1": [ "I" ], "L": [ "I" ], "|": [ "I" ], "U": [ "V" ],
};

/**
 * A two-character unit type code as read ("5M", "GV"): the code itself when it is an Alpha Strike unit type, else
 * the one unit type that named OCR slips (5 or 8 for B, G for C, ...) make of it; "" when none, or more than one.
 */
export const acesEdgeUnitType = ( token: string ): string => {
    const code = token.replace( /[^A-Za-z0-9$|]/g, "" ).toUpperCase();
    if( code.length !== 2 || !/[A-Z]/.test( code ) ) return "";
    if( unitTypes.includes( code ) ) return code;
    const options = ( char: string ) => [ char, ...( ocrSlips[char] || [] ) ];
    const found = new Set<string>();
    for( const first of options( code[0] ) ) for( const second of options( code[1] ) ) {
        if( unitTypes.includes( first + second ) ) found.add( first + second );
    }
    return found.size === 1 ? Array.from( found )[0] : "";
}

const phaseNamed = /\b(initiative|movement|combat|end)\s+phase\b/i;
// What a unit does in the Combat Phase. Damage, hits, targets and criticals aren't here: they don't fix a phase.
const combatWords = /\b(attack\w*|fir(e|es|ing)|shoot\w*|spott?\w*)\b/i;
const movementWords = /\b(mov(e|es|ed|ing|ement)|jump\w*|sprint\w*)\b/i;
const combatCategories = /\b(attack|melee|defen[cs]e|indirect|fire|physical|combat)\b/i;

/**
 * Whether the condition itself fixes the phase: it names a phase, or describes an attack or a move. When it doesn't,
 * acesEdgePhaseOf falls back on the category or the card's text, a weaker guess the scan flags.
 */
export const acesEdgePhaseFromCondition = ( condition: string ): boolean =>
    phaseNamed.test( condition ) || combatWords.test( condition ) || movementWords.test( condition );

/**
 * The phase the card is played in: a phase the condition names; else combat for a condition about attacking or
 * spotting, movement for one about moving; else what the category names; else a phase the card's text names;
 * else any.
 */
export const acesEdgePhaseOf = ( category: string, condition: string, text: string ): TAcesEdgePhase => {
    const named = phaseNamed.exec( condition );
    if( named ) return named[1].toLowerCase() as TAcesEdgePhase;
    if( combatWords.test( condition ) ) return "combat";
    if( movementWords.test( condition ) ) return "movement";
    if( /\bmovement\b/i.test( category ) ) return "movement";
    if( /\binitiative\b/i.test( category ) ) return "initiative";
    if( combatCategories.test( category ) ) return "combat";
    const inText = phaseNamed.exec( text );
    return inText ? inText[1].toLowerCase() as TAcesEdgePhase : "any";
}

/**
 * The trigger from the condition's words, first match winning: the rear, a critical hit, taking damage, being
 * attacked, attacking, moving. A condition that only names a point in a phase ("At the start of ... Phase") has no
 * trigger; any other condition is "other".
 */
export const acesEdgeTriggerOf = ( condition: string ): TAcesEdgeTrigger => {
    const text = condition.trim();
    if( text === "" ) return "none";
    if( /\brear\b/i.test( text ) ) return "enemy-rear";
    if( /\bcritical\b|\bcrits?\b/i.test( text ) ) return "critical-hit";
    if( /\b(take|takes|taking|took|receive|receives|suffer|suffers)\b[^:]*\bdamage\b|\bdamaged\b/i.test( text ) ) return "damaged";
    if( /\b(attacked|targeted)\b|\battacks?\s+(you|it)\b/i.test( text ) ) return "attacked";
    if( /\b(attack\w*|fir(e|es|ing)|shoot\w*)\b/i.test( text ) ) return "attacking";
    if( movementWords.test( text ) ) return "moving";
    if( /^(at\s+the\s+(start|end|beginning)\s+of|during|in)\s+the\s+\w+\s+phase\W*$/i.test( text ) ) return "none";
    return "other";
}

/** OCR slips in plain card text: spaces OCR puts inside brackets and before punctuation. */
const tidyText = ( text: string ): string => text
    .replace( /’/g, "'" )
    // The cards' own formula "Spend N Edge to ...": its "to" can read as "10".
    .replace( /\b(Edge)\s+[1lI]0(?=\s+[a-z])/g, "$1 to" )
    .replace( /\(\s+/g, "(" )
    .replace( /\s+([),.:;])/g, "$1" )
    .replace( /\s+/g, " " )
    .trim();

/** The panel's rows as one text: a row ending in a hyphen after a letter runs on into the next without a space. */
export const joinAcesEdgeRows = ( rows: string[] ): string => {
    let rv = "";
    for( const row of rows.map( ( entry ) => entry.trim() ).filter( ( entry ) => entry !== "" ) ) {
        rv = rv === "" ? row : /[A-Za-z]-$/.test( rv ) ? rv + row : rv + " " + row;
    }
    return tidyText( rv );
}

/* ----- layout ----- */

interface IAcesEdgeLayout {
    panel: ICardScanRect;
    band: ICardScanRect;
    footer: ICardScanRect;
}

const luminance = ( data: ArrayLike<number>, index: number ): number => 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];

/** Runs of true in a list, bridging gaps of up to gap false entries. */
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
 * The light text panel, from the photo's brightness: across the lower middle of the photo it is the long light run;
 * down its middle, the light rows round that height. The dark band above it holds the name and category, up to
 * where the art starts, and the footer is under it.
 */
const findLayout = ( io: ICardScanIO ): IAcesEdgeLayout | null => {
    const step = 4, cell = 10;
    const across = clampRect( { left: 0, top: io.height * 0.6, width: io.width, height: io.height * 0.1 }, io.width, io.height );
    const pixels = io.pixels( across );
    const columns: boolean[] = [];
    for( let x = 0; x + cell <= across.width; x += cell ) {
        let light = 0, count = 0;
        for( let y = 0; y < across.height; y += step ) for( let dx = 0; dx < cell; dx += 5 ) {
            if( luminance( pixels, ( y * across.width + x + dx ) * 4 ) > 140 ) light++;
            count++;
        }
        columns.push( light / count > 0.6 );
    }
    const wide = runs( columns, Math.round( io.width * 0.3 / cell ), 2 ).sort( ( a, b ) => ( b.end - b.start ) - ( a.end - a.start ) )[0];
    if( !wide ) return null;
    const x0 = wide.start * cell, x1 = wide.end * cell;
    const strip = clampRect( { left: x0 + ( x1 - x0 ) * 0.25, top: 0, width: ( x1 - x0 ) * 0.5, height: io.height }, io.width, io.height );
    const stripPixels = io.pixels( strip );
    const rowLight = ( y: number, cut: ( value: number ) => boolean ): number => {
        let hits = 0, count = 0;
        for( let x = 0; x < strip.width; x += 5 ) {
            if( cut( luminance( stripPixels, ( y * strip.width + x ) * 4 ) ) ) hits++;
            count++;
        }
        return hits / count;
    };
    const rows: boolean[] = [];
    for( let y = 0; y < strip.height; y += step ) rows.push( rowLight( y, ( value ) => value > 140 ) > 0.5 );
    const middle = across.top + across.height / 2;
    const tall = runs( rows, Math.round( io.height * 0.12 / step ), 12 ).find( ( run ) => run.start * step <= middle && run.end * step >= middle );
    if( !tall ) return null;
    const top = tall.start * step, bottom = tall.end * step;
    const height = bottom - top;
    // Up from the panel's top while the rows are black with white print and little between: the band, as far as
    // the art, whose colours are mostly middling.
    let bandTop = top;
    let artRun = 0;
    for( let y = top - step; y >= Math.max( 0, top - height * 0.6 ); y -= step ) {
        const middling = rowLight( y, ( value ) => value >= 70 && value <= 170 );
        if( middling < 0.2 && rowLight( y, ( value ) => value < 70 ) > 0.3 ) {
            bandTop = y;
            artRun = 0;
        } else if( ++artRun > 3 ) break;
    }
    if( top - bandTop < height * 0.15 ) bandTop = top - height * 0.4;
    const width = x1 - x0;
    const rect = ( left: number, rectTop: number, right: number, rectBottom: number ) => clampRect( { left, top: rectTop, width: right - left, height: rectBottom - rectTop }, io.width, io.height );
    return {
        panel: rect( x0, top, x1, bottom ),
        // The band's right end holds the Edge emblem, not print.
        band: rect( x0 - width * 0.03, bandTop, x0 + width * 0.72, top ),
        footer: rect( x0 - width * 0.1, bottom, x0 + width * 0.3, bottom + height * 0.45 ),
    };
}

/**
 * The card number's place in the footer: the logo is the row's tallest white print, and the number the smaller
 * print just left of it on the same row. Null when the footer shows no such row.
 */
const footerNumber = ( io: ICardScanIO, footer: ICardScanRect ): ICardScanRect | null => {
    const boxes = cardScanInkBoxes( io, footer, "dim" ).filter( ( box ) => box.y0 > 2 && box.y1 < footer.height - 3
        && box.x1 - box.x0 < footer.width * 0.25 && box.y1 - box.y0 < footer.height * 0.4 && box.y1 - box.y0 >= 6 );
    if( boxes.length === 0 ) return null;
    const tallest = Math.max( ...boxes.map( ( box ) => box.y1 - box.y0 ) );
    const logo = boxes.filter( ( box ) => box.y1 - box.y0 >= tallest * 0.8 ).sort( ( a, b ) => a.x0 - b.x0 );
    const first = logo[0];
    // Everything on the logo's row left of it; the icon before the number and the card's gold edge are too dim for
    // the white cuts.
    const right = first.x0 - tallest * 0.15;
    if( right < tallest ) return null;
    return clampRect( { left: footer.left, top: footer.top + first.y0 - tallest * 0.25, width: right, height: tallest * 1.5 }, io.width, io.height );
}

/* ----- the whole scan ----- */

const linesIn = ( lines: ICardScanLine[] ): string => lines.map( ( line ) => line.text ).join( " " );

/** Marks that are never print: rules, specks and the panel's edge. */
const isStray = ( word: string ): boolean => /^[|=~_°'`‘’.,:;!—–-]+$/.test( word );

/** Where the panel's rows start: the median left edge of their words that hold letters. */
const rowsLeft = ( lines: ICardScanLine[] ): number => {
    const starts = lines.map( ( line ) => line.words.find( ( word ) => /[A-Za-z]{2,}/.test( word.text ) ) ).filter( ( word ) => word ).map( ( word ) => word!.bbox.x0 ).sort( ( a, b ) => a - b );
    return starts.length > 0 ? starts[Math.floor( starts.length / 2 )] : -Infinity;
}

const median = ( values: number[] ): number => {
    const sorted = values.slice().sort( ( a, b ) => a - b );
    return sorted.length > 0 ? sorted[Math.floor( sorted.length / 2 )] : 0;
}

/**
 * The panel's OCR lines cleaned of what isn't print, as rows top to bottom: marks (rules, specks); words far flatter
 * than the text (the panel's top edge, texture at its foot); a lone letter wider than it is tall (a rule); a mark well clear of the words before it at the
 * panel's right edge (the panel's border); and every row after a gap of more than two rows' height, as the text is
 * one block from the top.
 */
export const acesEdgePanelRows = ( lines: ICardScanLine[], panel: ICardScanRect ): ICardScanLine[] => {
    const textHeight = median( allWords( lines ).filter( ( word ) => /[A-Za-z]{2,}/.test( word.text ) ).map( ( word ) => word.bbox.y1 - word.bbox.y0 ) );
    const cleaned: ICardScanLine[] = [];
    for( const line of lines ) {
        const words = line.words.filter( ( word, index ) => {
            const text = word.text.trim();
            if( text === "" || isStray( text ) ) return false;
            if( word.bbox.y1 - word.bbox.y0 < textHeight * 0.5 ) return false;
            // One letter wider than it is tall: a rule read as a letter.
            if( text.length === 1 && word.bbox.x1 - word.bbox.x0 > word.bbox.y1 - word.bbox.y0 ) return false;
            const previous = line.words[index - 1];
            const edgeMark = !/[A-Za-z]{2,}/.test( text ) && word.bbox.x0 > panel.left + panel.width * 0.9 && ( !previous || word.bbox.x0 - previous.bbox.x1 > textHeight * 1.5 );
            return !edgeMark;
        } );
        if( words.length === 0 ) continue;
        cleaned.push( {
            text: words.map( ( word ) => word.text.trim() ).join( " " ), words: words,
            bbox: {
                x0: Math.min( ...words.map( ( word ) => word.bbox.x0 ) ), y0: Math.min( ...words.map( ( word ) => word.bbox.y0 ) ),
                x1: Math.max( ...words.map( ( word ) => word.bbox.x1 ) ), y1: Math.max( ...words.map( ( word ) => word.bbox.y1 ) ),
            },
        } );
    }
    const rows = acesScanCardRows( cleaned ).filter( ( line ) => /[A-Za-z0-9]/.test( line.text ) );
    const rowHeight = median( rows.map( ( row ) => row.bbox.y1 - row.bbox.y0 ) );
    const end = rows.findIndex( ( row, index ) => index > 0 && row.bbox.y0 - rows[index - 1].bbox.y1 > rowHeight * 2 );
    return end > 0 ? rows.slice( 0, end ) : rows;
}

/** A row's words, with a short function word OCR ran into the word before it split off where the print shows a space. */
const rowText = ( line: ICardScanLine, io: ICardScanIO, margin = -Infinity ): string => {
    const height = Math.max( 1, line.bbox.y1 - line.bbox.y0 );
    // Anything wholly left of where the panel's rows start is the panel's edge; marks stuck to the front of a word
    // that starts well left of it are too.
    const words = line.words.filter( ( word ) => word.bbox.x1 > margin ).map( ( word ) => word.bbox.x0 < margin - height * 0.25 && /^[^A-Za-z0-9(]+[A-Za-z]/.test( word.text )
        ? { ...word, text: word.text.replace( /^[^A-Za-z0-9(]+/, "" ) } : word );
    const spaces = words.slice( 1 ).map( ( word, index ) => word.bbox.x0 - words[index].bbox.x1 ).filter( ( gap ) => gap > 0 ).sort( ( a, b ) => a - b );
    const wordSpace = spaces.length > 0 ? spaces[Math.floor( spaces.length / 2 )] : height * 0.3;
    return words.map( ( word ) => {
        const text = word.text.trim();
        if( !/^[A-Za-z]{4,}[.,:;]?$/.test( text ) ) return text;
        const box = clampRect( { left: word.bbox.x0, top: word.bbox.y0, width: word.bbox.x1 - word.bbox.x0, height: word.bbox.y1 - word.bbox.y0 }, io.width, io.height );
        return box.width > 0 && box.height > 0 ? acesSpecialOrderSplitGlued( text, box.width, acesScanBlankColumns( io, box ), wordSpace ) : text;
    } ).join( " " );
}

/** A name or category word as printed: capitals, with OCR's stray marks dropped. */
const bandWords = ( line: ICardScanLine ): string => line.words.map( ( word ) => word.text.replace( /[^A-Za-z0-9$'/-]/g, "" ) ).filter( ( word ) => word.length >= 2 || word === "/" ).join( " " );

/** Edge cards print portrait; a scan that found the light panel and a "Spend ... Edge" text found the card. */
export const acesEdgeCardScanOptions: ICardScanOptions<IAcesEdgeScanResult> = { shape: "portrait", found: ( result ) => result.found };

export const scanAcesEdgeCard = async ( io: ICardScanIO ): Promise<IAcesEdgeScanResult> => {
    const result = emptyResult();
    const whole = await io.recognize( { left: 0, top: 0, width: io.width, height: io.height }, "plain" );
    const words = allWords( whole );
    // The other card kinds' own headings: a behavior card's three column names, a Command card's sections, the
    // Special Orders' footer.
    const behavior = [ "AGGRESSIVE", "BALANCED", "CAUTIOUS" ].filter( ( name ) => words.some( ( word ) => fuzzyIs( word.text, name ) ) ).length >= 2;
    const command = [ "EMPLACEMENTS", "ARTILLERY", "STRATEGY", "ORDERS" ].filter( ( name ) => words.some( ( word ) => fuzzyIs( word.text, name ) ) ).length >= 2;
    const special = /\bspecial\s+order\b/i.test( linesIn( whole ) );
    const notFound = (): IAcesEdgeScanResult => {
        const other = behavior ? "a behavior card" : command ? "a Command card" : special ? "a Special Order" : "";
        result.warnings = [ other
            ? "This looks like " + other + ", not an Edge card: read it from " + other + "'s form."
            : "Couldn't find an Edge card's light text panel with its \"Spend ... Edge\" text. Take the photo straight on, with one card filling the frame." ];
        return result;
    };
    const layout = findLayout( io );
    if( !layout ) return notFound();

    const panelRows = acesEdgePanelRows( await io.recognize( layout.panel, "panel" ), layout.panel );
    const margin = rowsLeft( panelRows );
    const body = joinAcesEdgeRows( panelRows.map( ( line ) => rowText( line, io, margin ) ) );
    // Every Edge card spends Edge; the other kinds' panels never say so.
    if( !/\bedge\b/i.test( body ) || behavior || command ) return notFound();
    result.found = true;
    const split = splitAcesEdgeCondition( body );
    result.condition = split.condition;
    result.text = split.text;
    result.cost = parseAcesEdgeCost( body );

    // The name is the band's tallest print, the category the row under it. Each row of white print is read on its
    // own: read whole, the band's speckled edges can throw OCR's page layout.
    const bandRows = cardScanRows( io, layout.band, "bright", Math.max( 8, layout.band.height * 0.06 ) );
    const rowReads: { rect: ICardScanRect, line: ICardScanLine }[] = [];
    for( const row of bandRows ) {
        const lines = ( await io.recognize( row, "bright", 1, true ) ).filter( ( line ) => /[A-Za-z]{2,}/.test( line.text ) );
        if( lines.length > 0 ) rowReads.push( { rect: row, line: lines.sort( ( a, b ) => b.text.length - a.text.length )[0] } );
    }
    if( rowReads.length === 0 ) {
        for( const line of acesScanCardRows( await io.recognize( layout.band, "bright" ) ).filter( ( entry ) => /[A-Za-z]{2,}/.test( entry.text ) ) ) {
            rowReads.push( { rect: { left: line.bbox.x0, top: line.bbox.y0, width: line.bbox.x1 - line.bbox.x0, height: line.bbox.y1 - line.bbox.y0 }, line } );
        }
    }
    const nameRead = rowReads.filter( ( read ) => /[A-Z]{3,}/.test( bandWords( read.line ) ) ).sort( ( a, b ) => b.rect.height - a.rect.height )[0];
    if( nameRead ) {
        const nameOf = ( line: ICardScanLine | undefined ) => line ? bandWords( line ).replace( /[^A-Za-z' -]/g, "" ).replace( /\s+/g, " " ).trim() : "";
        // The big letters' edges can read as an extra letter: two more cuts of the row vote word by word.
        const names = [ nameOf( nameRead.line ) ];
        for( const [ mode, scale ] of [ [ "bright", 2 ], [ "dim", 2 ] ] as [ TCardScanMode, number ][] ) {
            names.push( nameOf( ( await io.recognize( nameRead.rect, mode, scale, true ) ).filter( ( line ) => /[A-Za-z]{2,}/.test( line.text ) ).sort( ( a, b ) => b.text.length - a.text.length )[0] ) );
        }
        result.name = voteAcesEdgeWords( names );
        const below = rowReads.filter( ( read ) => read.rect.top >= nameRead.rect.top + nameRead.rect.height * 0.7 ).sort( ( a, b ) => a.rect.top - b.rect.top )[0];
        if( below ) {
            const first = parseAcesEdgeCategoryLine( bandWords( below.line ) );
            let category = first.category;
            let limitUnread = first.limitUnread;
            // The unit type limit prints greyer than the category: a darker cut can find it.
            if( !/ONLY$/.test( category ) ) {
                const row = clampRect( { ...below.rect, left: layout.band.left, width: layout.band.width }, io.width, io.height );
                for( const [ mode, single ] of [ [ "dim", true ], [ "dim", false ] ] as [ TCardScanMode, boolean ][] ) {
                    const dim = ( await io.recognize( row, mode, 1, single ) ).filter( ( line ) => /[A-Za-z]{2,}/.test( line.text ) )[0];
                    const read = dim ? parseAcesEdgeCategoryLine( bandWords( dim ) ) : { category: "", limitUnread: false };
                    limitUnread = limitUnread || read.limitUnread;
                    if( /ONLY$/.test( read.category ) ) {
                        // The category word itself reads best in the white cut.
                        const word = category.split( "," )[0];
                        const limit = read.category.includes( ", " ) ? read.category.substring( read.category.indexOf( ", " ) + 2 ) : read.category;
                        category = word ? word + ", " + limit : read.category;
                        limitUnread = false;
                        break;
                    }
                }
            }
            if( limitUnread ) result.warnings.push( "The category's unit type limit (\"... ONLY\") couldn't be read for sure: type it in from the card." );
            result.category = category;
        }
    }

    // The number is small grey print just left of the logo's big white letters: read on its own, it reads far
    // better than with the footer round it.
    const numberRect = footerNumber( io, layout.footer );
    const reads: [ ICardScanRect, TCardScanMode, number, boolean, string ][] = [];
    // The photo as it is first: OCR's own threshold keeps the thin strokes of the grey print that the white cuts
    // can break (a 2 read as 7).
    if( numberRect ) for( const [ mode, scale ] of [ [ "plain", 1 ], [ "dim", 2 ], [ "dim", 3 ], [ "bright", 2 ] ] as [ TCardScanMode, number ][] ) {
        reads.push( [ numberRect, mode, scale, true, "0123456789/" ], [ numberRect, mode, scale, false, "" ] );
    }
    for( const mode of [ "bright", "dim", "plain" ] as TCardScanMode[] ) reads.push( [ layout.footer, mode, 1, false, "" ] );
    // OCR often loses the slash or reads it as a 1 ("112" for 1/12); the glyphs show where it is.
    const slashAt = numberRect ? acesEdgeSlashAt( io.pixels( numberRect ), numberRect.width, numberRect.height ) : null;
    const votes: { [number: string]: number } = {};
    for( const [ rect, mode, scale, single, charset ] of reads ) {
        let text = linesIn( await io.recognize( rect, mode, scale, single, charset ) );
        // The footer read whole: only what comes before the logo's lettering.
        if( rect === layout.footer ) text = text.split( /\s+/ ).slice( 0, Math.max( 0, text.split( /\s+/ ).findIndex( ( word ) => /[A-Za-z]{4,}/.test( word ) ) ) ).join( " " ) || text;
        const read = ( rect === numberRect && slashAt ? placeAcesEdgeSlash( text, slashAt ) : "" ) || parseAcesEdgeCardNumber( text );
        if( read ) votes[read] = ( votes[read] || 0 ) + 1;
        const best = Object.keys( votes ).sort( ( a, b ) => votes[b] - votes[a] )[0];
        if( best && votes[best] >= 2 ) break;
    }
    result.cardNumber = Object.keys( votes ).sort( ( a, b ) => votes[b] - votes[a] )[0] || "";

    result.phase = acesEdgePhaseOf( result.category, result.condition, result.text );
    result.trigger = acesEdgeTriggerOf( result.condition );
    if( result.phase !== "any" && !acesEdgePhaseFromCondition( result.condition ) ) {
        const from = acesEdgePhaseOf( result.category, "", "" ) === result.phase ? "category" : "text";
        result.warnings.push( "Phase guessed from the card's " + from + ", not its condition: check it." );
    }

    if( !result.name ) result.warnings.push( "Card name not read." );
    if( !result.cardNumber ) result.warnings.push( "Card number (e.g. 3/12) not read." );
    if( result.cost === null ) result.warnings.push( "Cost not read: no \"Spend N Edge\" found." );
    if( !result.condition ) result.warnings.push( "Condition not found: it is the bold opening that ends in a colon." );
    result.warnings.push( "Check every line against the card: OCR can misread words. The phase and trigger are guessed from the card's words." );
    return result;
}

/**
 * Puts a scan onto an Edge card draft: what was read replaces the draft's fields, and a field the scan didn't read
 * (blank, no cost, phase "any", trigger "none") keeps what the player typed. Nothing changes when the card wasn't
 * found.
 */
export const applyAcesEdgeScan = ( card: IAcesEdgeCard | null, scan: IAcesEdgeScanResult ): IAcesEdgeCard => {
    const rv: IAcesEdgeCard = card ? JSON.parse( JSON.stringify( card ) ) : newAcesEdgeCard();
    if( !scan.found ) return rv;
    if( scan.name ) rv.name = scan.name;
    if( scan.category ) rv.category = scan.category;
    if( scan.cardNumber ) rv.cardNumber = scan.cardNumber;
    if( scan.condition ) rv.condition = scan.condition;
    if( scan.text ) rv.text = scan.text;
    if( scan.cost !== null ) rv.cost = scan.cost;
    if( scan.phase !== "any" ) rv.phase = scan.phase;
    if( scan.trigger !== "none" ) rv.trigger = scan.trigger;
    return rv;
}
