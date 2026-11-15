import {
    acesStats,
    IAcesCommandCard,
    IAcesCommandOrder,
    IAcesPriorityRule,
    IAcesStrategyRow,
    newAcesCommandCard,
    parseAcesCommandOrderLine,
    parseAcesPriorityLine,
    parseAcesStrategyLine,
    TAcesOrderPhase,
} from "../data/aces-cards";
import { acesScanTagColour, allWords, clampRect, editDistance, fuzzyIs, parseAcesScanFooter, parseZone } from "./aces-card-scan";
import { ICardScanIO, ICardScanLine, ICardScanOptions, ICardScanRect, ICardScanWord, TCardScanMode } from "./card-scan-io";
import { getMULFactionIDs, getMULFactionLabels } from "../utils/mulUtilities";

/*
 * Reads an Aces Command card from a photo of the players' own card, as the behavior card reader does (aces-card-scan.ts):
 * text from OCR, the ▲ / ▼ icons from their colour (blue ▲ highest, red ▼ lowest), and the result is a draft the
 * player checks against the card before saving.
 *
 * Each card prints two sides, both under the same title band (deck, faction, letter box) and over the same footer
 * (card number). The orders side has the ORDERS panel and the RED / YELLOW / BLUE lists, found by the colours of their
 * header bars. The support side has the support orders, the EMPLACEMENTS / ARTILLERY / BSP CARDS lists and the strategy
 * decisions, found by those printed headers.
 */

export type TAcesCommandScanSide = "orders" | "support";

export interface IAcesCommandScanResult {
    found: boolean;
    side: TAcesCommandScanSide | null;
    deck: string;
    faction: string;
    letter: string;
    cardNumber: string;
    orders: IAcesCommandOrder[];
    red: IAcesPriorityRule[];
    yellow: IAcesPriorityRule[];
    blue: IAcesPriorityRule[];
    supportOrders: string;
    emplacementZoneRings: number[];
    emplacements: IAcesPriorityRule[];
    artillery: IAcesPriorityRule[];
    bsp: IAcesPriorityRule[];
    strategy: IAcesStrategyRow[];
    /** What the player should check by hand. */
    warnings: string[];
}

const emptyResult = (): IAcesCommandScanResult => ( {
    found: false, side: null, deck: "", faction: "", letter: "", cardNumber: "", orders: [], red: [], yellow: [], blue: [],
    supportOrders: "", emplacementZoneRings: [], emplacements: [], artillery: [], bsp: [], strategy: [], warnings: [],
} );

/* ----- layout ----- */

interface IAcesCommandLayout {
    side: TAcesCommandScanSide;
    title: ICardScanRect;
    /** The letter, and the whole box round it to fall back on. */
    letter: ICardScanRect;
    letterBox: ICardScanRect;
    footer: ICardScanRect;
    /** Orders side: the ORDERS panel. Support side: the support orders. */
    text: ICardScanRect;
    /** RED, YELLOW, BLUE or EMPLACEMENTS, ARTILLERY, BSP CARDS. */
    columns: ICardScanRect[];
    /** Support side: the strategy decisions. */
    strategy: ICardScanRect | null;
}

interface IAcesColourRun { left: number, right: number }

/** The longest run of cells in one colour along a row; the bar's white heading ("RED") can break it for a cell or two. */
const longestRun = ( cells: ( string | null )[], colour: string ): { start: number, end: number } | null => {
    let best: { start: number, end: number } | null = null;
    let start = -1, last = -1;
    for( let index = 0; index <= cells.length; index++ ) {
        if( index < cells.length && cells[index] === colour ) {
            if( start < 0 ) start = index;
            last = index;
            continue;
        }
        if( start >= 0 && index < cells.length && index - last <= 3 && cells[index] === null ) continue;
        if( start >= 0 && ( !best || last + 1 - start > best.end - best.start ) ) best = { start, end: last + 1 };
        start = -1;
    }
    return best;
}

/**
 * The RED / YELLOW / BLUE header bars: the topmost rows of the photo with a long run of red, then (usually) yellow,
 * then blue, left to right. The list icons are far too small to make a run. The gold YELLOW bar can fall short of
 * the yellow cut, so it's taken as the space between the other two when it doesn't show.
 */
const findColourBand = ( io: ICardScanIO ): { top: number, bottom: number, runs: IAcesColourRun[] } | null => {
    const cells = 50;
    const cellWidth = io.width / cells;
    const step = Math.max( 1, Math.round( io.height / 150 ) );
    const minRun = 4;
    let found: { top: number, bottom: number, runs: IAcesColourRun[][] } | null = null;
    for( let y = Math.round( io.height * 0.15 ); y < io.height * 0.9; y += step ) {
        const row = Array.from( { length: cells }, ( _, index ) => {
            const colours = io.colours( { left: Math.round( index * cellWidth ), top: y, width: Math.max( 1, Math.round( cellWidth ) ), height: step } );
            const ranked = ( [ "red", "yellow", "blue" ] as const ).slice().sort( ( a, b ) => colours[b] - colours[a] );
            return colours[ranked[0]] >= 0.35 ? ranked[0] : null;
        } );
        const red = longestRun( row, "red" );
        const yellow = longestRun( row, "yellow" );
        const blue = longestRun( row, "blue" );
        const isBand = !!red && !!blue && red.end - red.start >= minRun && blue.end - blue.start >= minRun && blue.start > red.end + minRun
            && ( !yellow || yellow.end - yellow.start < minRun || ( yellow.start >= red.end - 1 && yellow.end <= blue.start + 1 ) );
        if( isBand && red && blue ) {
            const middle = yellow && yellow.end - yellow.start >= minRun ? yellow : { start: red.end + 1, end: blue.start - 1 };
            const runs = [ red, middle, blue ].map( ( run ) => ( { left: run.start * cellWidth, right: run.end * cellWidth } ) );
            if( !found ) found = { top: y, bottom: y + step, runs: [ runs ] };
            else if( y <= found.bottom + step ) {
                found.bottom = y + step;
                found.runs.push( runs );
            }
        } else if( found ) break;
    }
    if( !found ) return null;
    const rows = found.runs;
    const runs = [ 0, 1, 2 ].map( ( index ) => ( {
        left: Math.min( ...rows.map( ( row ) => row[index].left ) ),
        right: Math.max( ...rows.map( ( row ) => row[index].right ) ),
    } ) );
    return { top: found.top, bottom: found.bottom, runs };
}

/** The orders side's regions, measured from the header bars (u is the card's width across the three lists). */
const ordersLayout = ( io: ICardScanIO, band: { top: number, bottom: number, runs: IAcesColourRun[] } ): IAcesCommandLayout => {
    const left = band.runs[0].left;
    const right = band.runs[2].right;
    const u = right - left;
    const rect = ( x0: number, y0: number, x1: number, y1: number ) => clampRect( { left: x0, top: y0, width: x1 - x0, height: y1 - y0 }, io.width, io.height );
    // A photo tilted back stretches the card's lower half, so the lists' crop runs on to the footer; the footer line
    // has no list item in it.
    const listBottom = band.top + u * 0.63;
    const splits = [ left - u * 0.02, ( band.runs[0].right + band.runs[1].left ) / 2, ( band.runs[1].right + band.runs[2].left ) / 2, right + u * 0.02 ];
    return {
        side: "orders",
        title: rect( left - u * 0.03, band.top - u * 0.82, left + u * 0.56, band.top - u * 0.615 ),
        letter: rect( left + u * 0.815, band.top - u * 0.74, left + u * 0.935, band.top - u * 0.615 ),
        letterBox: rect( left + u * 0.78, band.top - u * 0.82, right + u * 0.02, band.top - u * 0.58 ),
        footer: rect( left - u * 0.05, band.top + u * 0.54, left + u * 0.2, band.top + u * 0.7 ),
        text: rect( left + u * 0.48, band.top - u * 0.585, right + u * 0.01, band.top - u * 0.01 ),
        columns: [ 0, 1, 2 ].map( ( index ) => rect( splits[index], band.bottom + u * 0.005, splits[index + 1], listBottom ) ),
        strategy: null,
    };
}

/** The support side's regions, from its printed headers (EMPLACEMENTS, ARTILLERY, BSP CARDS, STRATEGY, SUPPORT). */
const supportLayout = ( io: ICardScanIO, lines: ICardScanLine[] ): IAcesCommandLayout | null => {
    const words = allWords( lines );
    const find = ( target: string, near: number | null = null ) => words.filter( ( word ) => fuzzyIs( word.text, target ) && ( near === null || Math.abs( word.bbox.y0 - near ) < ( word.bbox.y1 - word.bbox.y0 ) * 3 ) )
        .sort( ( a, b ) => a.bbox.y0 - b.bbox.y0 )[0] || null;
    const anchor = find( "EMPLACEMENTS" ) || find( "ARTILLERY" ) || find( "BSPCARDS" );
    if( !anchor ) return null;
    const emplacements = find( "EMPLACEMENTS", anchor.bbox.y0 );
    const artillery = find( "ARTILLERY", anchor.bbox.y0 );
    let bsp: ICardScanWord | null = find( "BSPCARDS", anchor.bbox.y0 );
    // "BSP CARDS" as two words: the column starts at BSP.
    if( bsp && /^\W*CARDS\W*$/i.test( bsp.text ) ) {
        const cards = bsp;
        const before = words.filter( ( word ) => word.bbox.x1 <= cards.bbox.x0 && cards.bbox.x0 - word.bbox.x1 < ( cards.bbox.y1 - cards.bbox.y0 ) * 1.5 && Math.abs( word.bbox.y0 - cards.bbox.y0 ) < ( cards.bbox.y1 - cards.bbox.y0 ) );
        bsp = before.length > 0 ? { ...cards, bbox: { ...cards.bbox, x0: Math.min( ...before.map( ( word ) => word.bbox.x0 ) ) } } : { ...cards, bbox: { ...cards.bbox, x0: cards.bbox.x0 - ( cards.bbox.x1 - cards.bbox.x0 ) * 0.8 } };
    }
    const found = [ emplacements, artillery, bsp ];
    if( found.filter( ( word ) => word ).length < 2 ) return null;
    const known = found.map( ( word, index ) => ( { word, index } ) ).filter( ( entry ) => entry.word ) as { word: ICardScanWord, index: number }[];
    const first = known[0], last = known[known.length - 1];
    const step = ( last.word.bbox.x0 - first.word.bbox.x0 ) / ( last.index - first.index );
    const starts = [ 0, 1, 2 ].map( ( index ) => found[index] ? found[index]!.bbox.x0 : first.word.bbox.x0 + ( index - first.index ) * step );
    const top = Math.min( ...known.map( ( entry ) => entry.word.bbox.y0 ) );
    const bottom = Math.max( ...known.map( ( entry ) => entry.word.bbox.y1 ) );
    const u = step * 3;
    const left = starts[0] - step * 0.04;
    const right = starts[2] + step * 0.97;
    const rect = ( x0: number, y0: number, x1: number, y1: number ) => clampRect( { left: x0, top: y0, width: x1 - x0, height: y1 - y0 }, io.width, io.height );
    const strategy = find( "STRATEGY" ) || find( "DECISIONS" );
    const strategyTop = strategy && strategy.bbox.y0 > bottom ? strategy.bbox.y0 : top + u * 0.53;
    const strategyBottom = strategy && strategy.bbox.y0 > bottom ? strategy.bbox.y1 : top + u * 0.58;
    const footerTop = Math.max( strategyBottom + u * 0.1, top + u * 0.97 );
    const support = find( "SUPPORT" );
    const supportTop = support && support.bbox.y1 < top ? support.bbox.y1 + ( support.bbox.y1 - support.bbox.y0 ) * 0.3 : top - u * 0.17;
    return {
        side: "support",
        title: rect( left - u * 0.03, top - u * 0.42, left + u * 0.56, top - u * 0.235 ),
        letter: rect( left + u * 0.84, top - u * 0.355, left + u * 0.975, top - u * 0.24 ),
        letterBox: rect( left + u * 0.78, top - u * 0.42, right + u * 0.02, top - u * 0.2 ),
        footer: rect( left - u * 0.05, footerTop, left + u * 0.2, footerTop + u * 0.12 ),
        text: rect( left, supportTop, right, top - u * 0.02 ),
        columns: [ 0, 1, 2 ].map( ( index ) => rect( index === 0 ? left : starts[index] - step * 0.05, bottom + u * 0.01, index === 2 ? right : starts[index + 1] - step * 0.05, strategyTop - u * 0.01 ) ),
        strategy: rect( left, strategyBottom + u * 0.005, right, footerTop ),
    };
}

/* ----- text and icons ----- */

/** ▲ (blue) is the highest value, ▼ (red) the lowest. */
const iconToken = ( colour: string | null ): string => colour === "blue" ? "[highest]" : colour === "red" ? "[lowest]" : "";

/**
 * A line's text with the ▲ / ▼ icons put back from the colour just before each word. Panel OCR drops the coloured
 * icons, and with them any junk they read as; marks with no letter or digit are dropped too.
 */
const lineWithIcons = ( line: ICardScanLine, io: ICardScanIO, panel: ICardScanRect ): string => {
    const height = Math.max( 1, line.bbox.y1 - line.bbox.y0 );
    // Not left of the panel: the portrait beside the ORDERS panel has reds in it.
    const colourIn = ( x0: number, x1: number ) => {
        const left = Math.max( x0, panel.left );
        return x1 - left < height * 0.2 ? "" : iconToken( acesScanTagColour( io.colours( clampRect( { left: left, top: line.bbox.y0, width: x1 - left, height: height }, io.width, io.height ) ) ) );
    };
    const parts: string[] = [];
    let iconBefore = false;
    for( const word of line.words ) {
        const cleaned = word.text.replace( /[^A-Za-z0-9()'’"”“,.:;!?/%-]/g, "" );
        // The icon itself read as a mark or a letter or two ("§", "A", "£2."): its own box shows the colour.
        if( !/[A-Za-z0-9]{3,}/.test( cleaned ) && !/^[SML]$/.test( cleaned ) && !/^(PV|MV|OV)\b/.test( cleaned ) ) {
            const own = word.text.trim().length <= 3 ? colourIn( word.bbox.x0, word.bbox.x1 ) : "";
            if( own ) {
                if( !iconBefore ) parts.push( own );
                iconBefore = true;
                continue;
            }
        }
        if( !/[A-Za-z0-9]/.test( cleaned ) ) {
            if( /^[()]+[.,]?$/.test( cleaned ) ) parts.push( cleaned );
            continue;
        }
        // An opening bracket glued to the word puts the icon inside the word's box.
        const lead = ( /^[^A-Za-z0-9]*/.exec( word.text ) || [ "" ] )[0].length;
        const token = iconBefore ? "" : colourIn( word.bbox.x0 - height * 0.8, word.bbox.x0 + height * ( 0.1 + lead * 0.5 ) );
        if( token ) parts.push( token );
        parts.push( cleaned );
        iconBefore = false;
    }
    // A panel's edge or a stray mark reads as a lone letter ("i", "l"); the cards print none but "a", and the S, M
    // or L of a damage value. A lone digit before a capitalised word ("3 Assign") is a stray mark too.
    const kept = parts.filter( ( part, index ) => {
        const bare = part.replace( /[^A-Za-z0-9]/g, "" );
        // A strategy row's letter, "B:".
        if( index === 0 && /^[A-J]\s*[:;.]$/.test( part ) ) return true;
        if( /^[A-Za-z]$/.test( bare ) && !/^\(?a$/.test( part ) ) return /^[SML]$/.test( bare ) && /^dam/i.test( parts[index + 1] || "" );
        if( /^\d$/.test( part ) && index === 0 && /^[A-Z][a-z]/.test( parts[1] || "" ) ) return false;
        return true;
    } );
    return tidyText( kept.join( " " ) );
}

/** OCR slips in plain card text. */
const tidyText = ( text: string ): string => text
    .replace( /\b([SML])(damage)\b/gi, "$1 $2" )
    .replace( /\bMv\b/g, "MV" )
    .replace( /\b([a-z]{3,})vs\b/g, "$1 vs" )
    .replace( /\b(the|a|of|your) \d\b(?! ?[/.,%])/g, "$1" )
    .replace( /\b[1t][0o](?= (your|the|its|a|any|move)\b)/g, "to" )
    .replace( /\b(1|jf|Jf)(?= (they|it|there|an|you|this)\b)/g, "If" )
    .replace( /\b(If|if)(you|there|they|this|an)\b/g, "$1 $2" )
    .replace( /\(\s+/g, "(" )
    .replace( /\s+([),.:;])/g, "$1" )
    .replace( /(?<=[a-z])0\b/g, "o" )
    .replace( /\b0(?=[a-z])/g, "o" )
    .replace( /’/g, "'" )
    .replace( /[”“]/g, "\"" )
    .replace( /\s+/g, " " )
    .trim();

const shortWords = [ "s", "m", "l", "a", "an", "as", "at", "by", "if", "in", "is", "it", "no", "of", "on", "or", "to", "up", "vs", "pv", "mv", "ov", "tmm" ];

/** A word that could be printed text: a known short word, or three letters or more with a vowel. */
const isRealWord = ( word: string ): boolean => {
    const plain = word.toLowerCase().replace( /[^a-z]/g, "" );
    if( shortWords.includes( plain ) || /^\[\w+\]$/.test( word ) ) return true;
    return plain.length >= 3 && /[aeiouy]/.test( plain ) && !/(.)\1\1/.test( plain );
}

/** Card art or a panel edge read as text: mostly words that are none. */
const isJunkLine = ( text: string ): boolean => {
    const words = text.split( /\s+/ ).filter( ( word ) => /[A-Za-z]/.test( word ) );
    if( words.length === 0 ) return true;
    return words.filter( isRealWord ).length < words.length * 0.6;
}

/**
 * OCR lines as the card prints them, top to bottom: pieces of one row joined left to right, and lines far taller than
 * the rest (art read as text) dropped. Only lines whose middles fall in each other are one row.
 */
const cardRows = ( lines: ICardScanLine[] ): ICardScanLine[] => {
    const kept = lines.filter( ( line ) => line.text.trim() !== "" && line.words.length > 0 );
    const heights = kept.map( ( line ) => line.bbox.y1 - line.bbox.y0 ).sort( ( a, b ) => a - b );
    const rowHeight = heights.length > 0 ? heights[Math.floor( heights.length / 2 )] : 0;
    const middle = ( line: ICardScanLine ) => ( line.bbox.y0 + line.bbox.y1 ) / 2;
    const rows: ICardScanLine[] = [];
    for( const line of kept.filter( ( entry ) => entry.bbox.y1 - entry.bbox.y0 <= rowHeight * 1.8 ).sort( ( a, b ) => middle( a ) - middle( b ) ) ) {
        const row = rows.find( ( entry ) => middle( line ) >= entry.bbox.y0 && middle( line ) <= entry.bbox.y1 && middle( entry ) >= line.bbox.y0 && middle( entry ) <= line.bbox.y1 );
        if( !row ) {
            rows.push( { ...line, words: line.words.slice() } );
            continue;
        }
        const pieces = [ { text: row.text, words: row.words, x0: row.bbox.x0 }, { text: line.text, words: line.words, x0: line.bbox.x0 } ].sort( ( a, b ) => a.x0 - b.x0 );
        row.text = pieces.map( ( piece ) => piece.text.trim() ).join( " " );
        row.words = pieces[0].words.concat( pieces[1].words );
        row.bbox = {
            x0: Math.min( row.bbox.x0, line.bbox.x0 ), y0: Math.min( row.bbox.y0, line.bbox.y0 ),
            x1: Math.max( row.bbox.x1, line.bbox.x1 ), y1: Math.max( row.bbox.y1, line.bbox.y1 ),
        };
    }
    return rows;
}

const letters = ( text: string ): string => text.toLowerCase().replace( /[^a-z]/g, "" );

/** The stats a list can rank by (aces-cards.ts), and the destroy objective. */
const listPhrases = [ ...acesStats.map( ( stat ) => stat.label ), "Objective" ];

/** The stat or objective a list line names, allowing a letter or two of OCR slips; null when it names neither. */
const nearestListPhrase = ( text: string ): string | null => {
    const phrase = nearestOf( letters( text ) );
    // An icon glued to its word reads as a capital: "AArmor", "VTMM".
    return phrase || ( /^[AVWYL]/.test( text ) ? nearestOf( letters( text.substring( 1 ) ) ) : null );
}

const nearestOf = ( read: string ): string | null => {
    if( read === "" ) return null;
    const scored = listPhrases.map( ( phrase ) => ( { phrase, edits: editDistance( read, letters( phrase ) ) } ) ).sort( ( a, b ) => a.edits - b.edits );
    const best = scored[0];
    const allowed = Math.max( 1, Math.floor( letters( best.phrase ).length * 0.25 ) );
    if( best.edits > allowed || ( scored[1] && scored[1].edits === best.edits ) ) return null;
    return best.phrase;
}

/** One list item: "[highest] PV", "[highest] [M] damage", "[destroyobj] Objective", or the words as read ("Rear"). */
const listRule = ( text: string, icon: string, warnings: string[] ): IAcesPriorityRule => {
    const all = text.replace( /[^A-Za-z0-9'’ ]/g, " " ).replace( /\s+/g, " " ).trim().split( " " );
    // Stray marks after the words (art at the column's edge) are dropped: the longest opening run that names a stat.
    let phrase: string | null = null;
    for( let count = all.length; count > 0 && !phrase; count-- ) phrase = nearestListPhrase( all.slice( 0, count ).join( " " ) );
    const words = all.filter( ( word, index ) => isRealWord( word ) || ( /^[SML]$/.test( word ) && /^dam/i.test( all[index + 1] || "" ) ) ).join( " " );
    if( phrase === "Objective" ) return parseAcesPriorityLine( "[destroyobj] Objective" );
    if( phrase ) {
        const label = phrase.replace( /^([SML]) damage$/, "[$1] damage" );
        if( !icon ) warnings.push( "The icon before \"" + phrase + "\" didn't read: [?] marks it." );
        return parseAcesPriorityLine( ( icon || "[?]" ) + " " + label );
    }
    return parseAcesPriorityLine( tidyText( ( icon ? icon + " " : "" ) + words ) );
}

/** A list item number as OCR reads it: "1.", "2", "a." (4) or a mark; the item's words follow. */
const isNumberWord = ( text: string ): boolean => !/[A-Za-z]{2,}/.test( text ) && ( /\d/.test( text ) || /^[^A-Za-z]*$/.test( text ) || /^\W*[a-zA-Z][.,:]\W*$/.test( text ) );

/**
 * A numbered list (RED / YELLOW / BLUE, EMPLACEMENTS / ARTILLERY / BSP CARDS), one rule per item. An item opens with
 * its number or its icon; a line with neither carries on the item above ("Structure / lost").
 */
const readList = ( lines: ICardScanLine[], column: ICardScanRect, io: ICardScanIO, warnings: string[] ): IAcesPriorityRule[] => {
    const items: { text: string, icon: string, bottom: number }[] = [];
    for( const line of lines ) {
        // A number glued to its item's word ("4./-.Size") is two words.
        const words = line.words.filter( ( word ) => word.text.trim() !== "" ).flatMap( ( word ) => {
            const glued = /^(\W*\d[\W\d]*)([A-Za-z].*)$/.exec( word.text );
            return glued ? [ { ...word, text: glued[1] }, { ...word, text: glued[2] } ] : [ word ];
        } );
        let start = 0;
        while( start < words.length && isNumberWord( words[start].text ) ) start++;
        // A ▲ or ▼ dark enough to read as text comes through as a lone A, V, W or Y.
        const iconLetter = start < words.length - 1 && /^[AVWY4]$/.test( words[start].text ) && /^[A-Za-z]{2,}/.test( words[start + 1].text );
        const textStart = iconLetter ? start + 1 : start;
        const kept = words.slice( textStart ).map( ( word ) => word.text )
            .filter( ( word, index, all ) => /[A-Za-z]{2,}/.test( word ) || ( /^[SML]$/.test( word ) && /^dam/i.test( all[index + 1] || "" ) ) );
        const rest = kept.join( " " );
        if( rest === "" ) continue;
        const height = Math.max( 1, line.bbox.y1 - line.bbox.y0 );
        const firstWord = words.slice( textStart ).find( ( word ) => /[A-Za-z]/.test( word.text ) ) || words[textStart];
        const iconRect = clampRect( { left: column.left, top: line.bbox.y0, width: firstWord.bbox.x0 + height * 0.3 - column.left, height: height }, io.width, io.height );
        const icon = iconToken( acesScanTagColour( io.colours( iconRect ) ) );
        const numbered = words.slice( 0, start ).some( ( word ) => /\d/.test( word.text ) );
        const last = items[items.length - 1];
        if( numbered || icon || ( !last && !isJunkLine( rest ) ) ) items.push( { text: rest, icon, bottom: line.bbox.y1 } );
        // A wrapped item's second line sits right under the first; anything else is art or the panel's edge.
        else if( last && line.bbox.y0 - last.bottom < height * 0.9 && kept.length <= 2 && !isJunkLine( rest ) ) {
            last.text += " " + rest;
            last.bottom = line.bbox.y1;
        }
    }
    return items.map( ( item ) => listRule( item.text, item.icon, warnings ) );
}

const phaseHeading = /^\W*(?:[|lI1]?n?itiative|Movement|Combat|End)\s*Phase\s*[:;.]?\s*/i;

const phaseOf = ( heading: string ): TAcesOrderPhase => {
    if( /itiative/i.test( heading ) ) return "initiative";
    if( /movement/i.test( heading ) ) return "movement";
    if( /combat/i.test( heading ) ) return "combat";
    return "end";
}

/**
 * The ORDERS panel: each phase heading ("Initiative Phase:") opens an order; text before any heading is an order for
 * any phase ("None."). A "0. ..." line is the movement filter the order adds.
 */
export const parseAcesCommandOrders = ( lines: string[] ): IAcesCommandOrder[] => {
    const orders: { phase: TAcesOrderPhase, text: string, filter: string }[] = [];
    for( const raw of lines ) {
        const line = raw.replace( /\|/g, " " ).trim();
        if( line === "" ) continue;
        const heading = phaseHeading.exec( line );
        const filter = /^\W{0,2}[0Oo]\s*[.,]\s*(?=\S)/.exec( line );
        if( heading ) {
            // Nothing but a stray mark after the heading ("Initiative Phase: 3") is no text yet.
            const after = line.substring( heading[0].length );
            orders.push( { phase: phaseOf( heading[0] ), text: /[A-Za-z]{2,}/.test( after ) ? after : "", filter: "" } );
        } else if( filter && orders.length > 0 ) {
            orders[orders.length - 1].filter = "0. " + line.substring( filter[0].length );
        } else if( orders.length === 0 ) {
            orders.push( { phase: "any", text: line, filter: "" } );
        } else {
            const last = orders[orders.length - 1];
            if( last.filter ) last.filter += " " + line;
            else last.text += " " + line;
        }
    }
    return orders.map( ( order ) => parseAcesCommandOrderLine( order.phase + " | " + tidyText( order.text ) + ( order.filter ? " | " + tidyText( order.filter ) : "" ) ) )
        .filter( ( order ) => order !== null ) as IAcesCommandOrder[];
}

/** Strategy decision rows, "B: If a test condition holds"; a row can wrap. */
export const parseAcesCommandStrategy = ( lines: string[] ): IAcesStrategyRow[] => {
    const rows: { letter: string, text: string }[] = [];
    for( const raw of lines ) {
        const line = raw.replace( /\|/g, " " ).trim();
        if( !/[A-Za-z]{2,}/.test( line ) ) continue;
        const letter = /^\W{0,2}([A-J])\s*[:;.]\s*/.exec( line );
        if( letter ) rows.push( { letter: letter[1], text: line.substring( letter[0].length ) } );
        else if( rows.length > 0 ) rows[rows.length - 1].text += " " + line;
        else rows.push( { letter: "", text: line } );
    }
    return rows.map( ( row ) => parseAcesStrategyLine( row.letter ? row.letter + " | " + tidyText( row.text ) : tidyText( row.text ) ) )
        .filter( ( row ) => row !== null ) as IAcesStrategyRow[];
}

/** Title-case words of two or more capitals from the title band ("CLAN JADE FALCON"), stray marks dropped. */
const titleWords = ( text: string ): string => text.replace( /[^A-Za-z ]/g, " " ).split( /\s+/ ).filter( ( word ) => word.length >= 2 )
    .map( ( word ) => word.charAt( 0 ).toUpperCase() + word.substring( 1 ).toLowerCase() ).join( " " );

const linesIn = ( lines: ICardScanLine[] ): string => lines.map( ( line ) => line.text ).join( " " );

/** The title band's lines, top to bottom, from the words inside it, each as title-case words. */
const titleLines = ( lines: ICardScanLine[], rect: ICardScanRect ): string[] => {
    const inside = ( word: ICardScanWord ) => {
        const x = ( word.bbox.x0 + word.bbox.x1 ) / 2, y = ( word.bbox.y0 + word.bbox.y1 ) / 2;
        return x >= rect.left && x < rect.left + rect.width && y >= rect.top && y < rect.top + rect.height;
    };
    return cardRows( lines ).map( ( line ) => titleWords( line.words.filter( ( word ) => inside( word ) && !/ORDER/i.test( word.text ) ).map( ( word ) => word.text ).join( " " ) ) )
        .filter( ( text ) => letters( text ).length >= 4 );
}

/**
 * Several reads of one line made into one: starting from the preferred read, each word is kept when another read has
 * it too, give or take a slip, and spelled as most reads spell it. Stray words that only one read has are dropped.
 */
const consensus = ( reads: string[], preference: number[] ): string => {
    const lists = reads.map( ( read ) => read.split( " " ).filter( ( word ) => word !== "" ) );
    const near = ( a: string, b: string ) => editDistance( a.toLowerCase(), b.toLowerCase() ) <= Math.max( 1, Math.floor( Math.max( a.length, b.length ) * 0.25 ) );
    for( const index of preference ) {
        const base = lists[index];
        const others = lists.filter( ( list, otherIndex ) => otherIndex !== index && list.length > 0 );
        if( base.length === 0 ) continue;
        if( others.length === 0 ) return base.join( " " );
        const kept = base.map( ( word ) => {
            const spellings = [ word, ...others.map( ( list ) => list.find( ( other ) => near( word, other ) ) ).filter( ( other ) => other !== undefined ) as string[] ];
            if( spellings.length < 2 ) return "";
            const count = ( spelling: string ) => spellings.filter( ( other ) => other.toLowerCase() === spelling.toLowerCase() ).length;
            return spellings.slice().sort( ( a, b ) => count( b ) - count( a ) )[0];
        } ).filter( ( word ) => word !== "" );
        if( kept.length > 0 ) return kept.join( " " );
    }
    for( const index of preference ) if( reads[index] ) return reads[index];
    return "";
}

/** The MUL's faction names, which the Command cards print as their faction. */
const factionNames = getMULFactionIDs().map( ( id ) => getMULFactionLabels( id ) ).filter( ( name ) => letters( name ).length >= 4 );

/**
 * A faction as read ("Cian Jade Falcon", "Clan Jade Falconn To") snapped to the MUL name it is a slip or two from,
 * stray words after it dropped; a read that is near no one name is kept as read.
 */
export const snapAcesFaction = ( read: string ): string => {
    const words = read.split( " " ).filter( ( word ) => word !== "" );
    let best: { name: string, edits: number } | null = null;
    let tie = false;
    for( let count = words.length; count > 0; count-- ) {
        const plain = letters( words.slice( 0, count ).join( "" ) );
        for( const name of factionNames ) {
            const edits = editDistance( plain, letters( name ) );
            if( edits > Math.max( 1, Math.floor( letters( name ).length * 0.2 ) ) ) continue;
            if( !best || edits < best.edits ) {
                best = { name, edits };
                tie = false;
            } else if( edits === best.edits && name !== best.name ) tie = true;
        }
    }
    return best && !tie ? best.name : read;
}

/**
 * Card number from the footer, "7/10". The slash can read as a 1 or 7, or not at all ("7710", "910"); the Command
 * decks print ten cards, so a number before "10" is taken as the card's.
 */
export const parseAcesCommandCardNumber = ( text: string ): string => {
    const plain = parseAcesScanFooter( text );
    if( plain ) return plain;
    const glued = /(?:^|[^\d])(10|[1-9])[17lI|\\]?10(?!\d)/.exec( text );
    return glued ? glued[1] + "/10" : "";
}

/* ----- the whole scan ----- */

/** Command cards print portrait; a scan that found either side's layout found the card. */
export const acesCommandCardScanOptions: ICardScanOptions<IAcesCommandScanResult> = { shape: "portrait", found: ( result ) => result.found };

export const scanAcesCommandCard = async ( io: ICardScanIO ): Promise<IAcesCommandScanResult> => {
    const result = emptyResult();
    const everything = { left: 0, top: 0, width: io.width, height: io.height };
    let whole: ICardScanLine[] | null = null;
    const wholeLines = async () => {
        if( !whole ) whole = await io.recognize( everything, "plain" );
        return whole;
    };
    const band = findColourBand( io );
    let layout: IAcesCommandLayout | null = band ? ordersLayout( io, band ) : null;
    if( !layout ) layout = supportLayout( io, await wholeLines() );
    if( !layout ) {
        const words = allWords( await wholeLines() );
        const behavior = [ "AGGRESSIVE", "BALANCED", "CAUTIOUS" ].filter( ( name ) => words.some( ( word ) => fuzzyIs( word.text, name ) ) ).length >= 2
            || ( words.some( ( word ) => fuzzyIs( word.text, "TARGET" ) ) && words.some( ( word ) => fuzzyIs( word.text, "COMBAT" ) ) );
        result.warnings.push( behavior
            ? "This looks like a behavior card, not a Command card: read it from a behavior card's form."
            : "Couldn't find the Command card's RED / YELLOW / BLUE lists or its EMPLACEMENTS / ARTILLERY / BSP CARDS headers. Take the photo straight on, with one card filling the frame." );
        return result;
    }
    result.found = true;
    result.side = layout.side;

    // The deck name (white) over the faction (green), read three ways: white text only, the crop as it is, and the
    // first pass over the whole photo. A reading two of them agree on wins; failing that, the read that suits each.
    const title = layout.title;
    const reads = [
        titleLines( await io.recognize( title, "bright" ), title ),
        titleLines( await io.recognize( title, "plain" ), title ),
        titleLines( await wholeLines(), title ),
    ];
    result.deck = consensus( reads.map( ( read ) => read[0] || "" ), [ 0, 1, 2 ] );
    result.faction = snapAcesFaction( consensus( reads.map( ( read ) => read[1] || "" ), [ 1, 2, 0 ] ) );

    result.cardNumber = parseAcesCommandCardNumber( linesIn( await io.recognize( layout.footer, "bright" ) ) );
    for( const scale of [ 1, 2 ] ) {
        if( !result.cardNumber ) result.cardNumber = parseAcesCommandCardNumber( linesIn( await io.recognize( layout.footer, "dim", scale ) ) );
    }
    // The crop as it is, wider and deeper, with the BATTLETECH logo beside the number: OCR finds the footer's line
    // more surely when the white panel's edge doesn't fill the crop.
    if( !result.cardNumber ) {
        const footer = layout.footer;
        const wide = clampRect( { left: footer.left, top: footer.top, width: footer.width * 2.5, height: footer.height * 1.6 }, io.width, io.height );
        result.cardNumber = parseAcesCommandCardNumber( linesIn( await io.recognize( wide, "plain" ) ) );
    }

    const readLines = async ( rect: ICardScanRect, mode: TCardScanMode = "panel" ) => cardRows( await io.recognize( rect, mode ) );
    // The support side's wide panels shade across the photo; their text reads best as plain dark print.
    const textMode: TCardScanMode = layout.side === "orders" ? "panel" : "dark";
    const readText = async ( rect: ICardScanRect ) => ( await readLines( rect, textMode ) ).map( ( line ) => lineWithIcons( line, io, rect ) ).filter( ( text ) => !isJunkLine( text ) );
    if( layout.side === "orders" ) {
        result.orders = parseAcesCommandOrders( await readText( layout.text ) );
        const lists: IAcesPriorityRule[][] = [];
        for( const column of layout.columns ) lists.push( readList( await readLines( column ), column, io, result.warnings ) );
        [ result.red, result.yellow, result.blue ] = lists;
        if( result.orders.length === 0 ) result.warnings.push( "No order read: type it in from the card." );
        [ "RED", "YELLOW", "BLUE" ].forEach( ( name, index ) => { if( lists[index].length === 0 ) result.warnings.push( "Nothing read in the " + name + " list." ); } );
    } else {
        result.supportOrders = tidyText( ( await readText( layout.text ) ).join( " " ) );
        const lists: IAcesPriorityRule[][] = [];
        for( const [ index, column ] of layout.columns.entries() ) {
            let lines = await readLines( column );
            // EMPLACEMENTS opens with its zone, "◎ 24\")".
            if( index === 0 ) {
                const zoneIndex = lines.findIndex( ( line ) => /\d/.test( line.text ) && /[)"”]/.test( line.text ) && !/[A-Za-z]{2,}/.test( line.text ) );
                if( zoneIndex >= 0 && zoneIndex < 2 ) {
                    result.emplacementZoneRings = parseZone( lines[zoneIndex].text ).zoneRings;
                    lines = lines.slice( zoneIndex + 1 );
                }
            }
            lists.push( readList( lines, column, io, result.warnings ) );
        }
        [ result.emplacements, result.artillery, result.bsp ] = lists;
        if( layout.strategy ) result.strategy = parseAcesCommandStrategy( await readText( layout.strategy ) );
        if( result.emplacementZoneRings.length === 0 ) result.warnings.push( "The emplacement zone didn't read." );
        if( result.strategy.length === 0 ) result.warnings.push( "No strategy decisions read." );
    }

    // The letter is white in its black box. Read last: a one-line read changes the OCR engine's page layout setting.
    for( const rect of [ layout.letter, layout.letterBox ] ) {
        if( result.letter ) break;
        const read = linesIn( await io.recognize( rect, "bright", 1, true, "ABCDEFGHIJ" ) ).replace( /[^A-J]/g, "" );
        if( read ) result.letter = read.charAt( 0 );
    }

    if( !result.cardNumber ) result.cardNumber = parseAcesCommandCardNumber( linesIn( ( await wholeLines() ).filter( ( line ) => line.bbox.y0 >= layout!.footer.top - layout!.footer.height ) ).replace( /©\s*\d+/g, "" ) );
    if( !result.deck ) result.warnings.push( "Deck name not read." );
    if( !result.letter ) result.warnings.push( "Card letter not read." );
    if( !result.cardNumber ) result.warnings.push( "Card number (e.g. 2/10) not read." );
    result.warnings.push( "Check every line against the card: OCR can misread words, and an icon (▲ highest, ▼ lowest) is read from its colour." );
    return result;
}

/** Puts a scan onto a Command card draft: the side read replaces that side; deck, faction and number fill in when blank. */
export const applyAcesCommandScan = ( card: IAcesCommandCard | null, scan: IAcesCommandScanResult ): IAcesCommandCard => {
    const rv: IAcesCommandCard = card ? JSON.parse( JSON.stringify( card ) ) : newAcesCommandCard();
    if( !scan.found ) return rv;
    if( scan.deck && !rv.deck ) rv.deck = scan.deck;
    if( scan.faction && !rv.faction ) rv.faction = scan.faction;
    if( scan.letter ) rv.letter = scan.letter;
    if( scan.cardNumber && !rv.cardNumber ) rv.cardNumber = scan.cardNumber;
    if( scan.side === "orders" ) {
        rv.orders = scan.orders;
        rv.red = scan.red;
        rv.yellow = scan.yellow;
        rv.blue = scan.blue;
    }
    if( scan.side === "support" ) {
        rv.supportOrders = scan.supportOrders;
        rv.supportOnlyIfStructure = /hit[^.]*structure/i.test( scan.supportOrders );
        rv.emplacementZoneRings = scan.emplacementZoneRings;
        rv.emplacements = scan.emplacements;
        rv.artillery = scan.artillery;
        rv.bsp = scan.bsp;
        rv.strategy = scan.strategy;
    }
    return JSON.parse( JSON.stringify( rv ) );
}
