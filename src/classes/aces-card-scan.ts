import {
    acesStandardOverheatRows,
    IAcesBehaviorColumn,
    IAcesCard,
    newAcesBehaviorColumn,
    newAcesCard,
    parseAcesOverheatLine,
    parseAcesPriorityLine,
    TAcesColor,
    TAcesMoveType,
} from "../data/aces-cards";
import { acesCombatFilterPhrases, acesConditionPhrases, acesMovementFilterPhrases } from "../data/aces-card-phrases";
import { acesDecks } from "../data/aces-rules";
import { ICardScanBox, ICardScanColours, ICardScanIO, ICardScanLine, ICardScanOptions, ICardScanRect, ICardScanWord, TCardScanMode, cardScanInkBoxes, cardScanMargin } from "./card-scan-io";

/*
 * Reads an Aces behavior card from a photo of the players' own card, for those who find the small print hard to
 * read or type in. Text comes from OCR; the icons don't OCR, so they come from pixel colour (the RED / YELLOW /
 * BLUE tags, the green moved check, the red J and yellow S tabs) and from the card wording around them ("no ?
 * enemies" is always the not-moved icon). An icon that can't be placed is left as a visible "[?]" for the player
 * to fix: the result is a draft for review in the card editor, never saved unchecked.
 *
 * The OCR engine and the image are reached through ICardScanIO (card-scan-io.ts).
 */

export type TAcesScanSide = "movement" | "combat";

export interface IAcesScanResult {
    side: TAcesScanSide | null;
    deck: string;
    deckId: IAcesCard["deckId"];
    cardNumber: string;
    priority: number | null;
    columns: IAcesBehaviorColumn[];
    combat: IAcesCard["combat"] | null;
    /** What the player should check by hand. */
    warnings: string[];
}

const tagThreshold = 0.03;
const checkThreshold = 0.01;

/** The Command list tag in a region, if any. */
export const acesScanTagColour = ( colours: ICardScanColours ): TAcesColor | null => {
    const ranked = ( [ "red", "yellow", "blue" ] as TAcesColor[] ).sort( ( a, b ) => colours[b] - colours[a] );
    return colours[ranked[0]] >= tagThreshold ? ranked[0] : null;
}

/* ----- layout ----- */

/** A printed header word, which the cards set in capitals (so "target" in a filter line is no match). */
export const fuzzyIs = ( text: string, target: string ): boolean => {
    const letters = text.replace( /[^A-Za-z]/g, "" );
    if( letters.replace( /[^A-Z]/g, "" ).length < letters.length * 0.6 ) return false;
    const word = letters.toUpperCase();
    if( word.length < 4 ) return false;
    if( word.includes( target.substring( 0, 5 ) ) || word.includes( target.substring( target.length - 5 ) ) ) return true;
    return editDistance( word, target ) <= 2;
}

const editDistance = ( a: string, b: string ): number => {
    const row = Array.from( { length: b.length + 1 }, ( _, index ) => index );
    for( let i = 1; i <= a.length; i++ ) {
        let previous = row[0];
        row[0] = i;
        for( let j = 1; j <= b.length; j++ ) {
            const current = row[j];
            row[j] = Math.min( row[j] + 1, row[j - 1] + 1, previous + ( a[i - 1] === b[j - 1] ? 0 : 1 ) );
            previous = current;
        }
    }
    return row[b.length];
}

export const allWords = ( lines: ICardScanLine[] ): ICardScanWord[] => lines.reduce( ( rv, line ) => rv.concat( line.words ), [] as ICardScanWord[] );

export interface IAcesScanLayout {
    side: TAcesScanSide;
    header: ICardScanRect;
    footer: ICardScanRect;
    /** Movement: Aggressive, Balanced, Cautious. Combat: the TARGET column. */
    columns: ICardScanRect[];
    /** Combat: the OV rows. */
    overheat: ICardScanRect | null;
}

export const clampRect = ( rect: ICardScanRect, width: number, height: number ): ICardScanRect => {
    const left = Math.max( 0, Math.round( rect.left ) );
    const top = Math.max( 0, Math.round( rect.top ) );
    return {
        left: left,
        top: top,
        width: Math.max( 1, Math.min( width - left, Math.round( rect.width ) ) ),
        height: Math.max( 1, Math.min( height - top, Math.round( rect.height ) ) ),
    };
}

/** Finds the card's regions from a first OCR pass over the whole photo: the column headers or TARGET, and the footer. */
export const findAcesCardLayout = ( lines: ICardScanLine[], width: number, height: number ): IAcesScanLayout | null => {
    const words = allWords( lines );
    const footerWord = words.filter( ( word ) => /BATTLETECH|ACES|Topps|Rights/i.test( word.text ) && word.bbox.y0 > height * 0.6 )
        .sort( ( a, b ) => a.bbox.y0 - b.bbox.y0 )[0];
    const footerTop = footerWord ? footerWord.bbox.y0 - ( footerWord.bbox.y1 - footerWord.bbox.y0 ) * 0.4 : height * 0.92;

    const names = [ "AGGRESSIVE", "BALANCED", "CAUTIOUS" ];
    const headers = names.map( ( name ) => words.find( ( word ) => fuzzyIs( word.text, name ) ) || null );
    const found = headers.filter( ( word ) => word !== null ) as ICardScanWord[];
    if( found.length >= 2 ) {
        const centres = headers.map( ( word ) => word ? ( word.bbox.x0 + word.bbox.x1 ) / 2 : null );
        // A header read in part ("ANCED" for BALANCED) has its centre off to one side; the middle column always sits
        // halfway between the outer two.
        if( centres[0] !== null && centres[2] !== null ) centres[1] = ( centres[0] + centres[2] ) / 2;
        // Columns are evenly spaced; fill one missing header from the other two.
        const known = centres.map( ( centre, index ) => ( { centre, index } ) ).filter( ( entry ) => entry.centre !== null ) as { centre: number, index: number }[];
        const step = ( known[known.length - 1].centre - known[0].centre ) / ( known[known.length - 1].index - known[0].index );
        const filled = centres.map( ( centre, index ) => centre !== null ? centre : known[0].centre + ( index - known[0].index ) * step );
        const headerBottom = Math.max( ...found.map( ( word ) => word.bbox.y1 ) );
        const headerTop = Math.min( ...found.map( ( word ) => word.bbox.y0 ) );
        const rowHeight = headerBottom - headerTop;
        const columns = filled.map( ( centre ) => clampRect( {
            left: centre - step / 2,
            top: headerBottom + rowHeight * 0.3,
            width: step,
            height: footerTop - headerBottom - rowHeight * 0.3,
        }, width, height ) );
        const cardLeft = Math.max( 0, filled[0] - step * 0.62 );
        return {
            side: "movement",
            header: clampRect( { left: cardLeft, top: 0, width: width - cardLeft, height: headerTop - rowHeight * 0.4 }, width, height ),
            footer: clampRect( { left: cardLeft, top: footerTop, width: step * 1.2, height: height - footerTop }, width, height ),
            columns: columns,
            overheat: null,
        };
    }

    let target: ICardScanWord | undefined = words.filter( ( word ) => fuzzyIs( word.text, "TARGET" ) ).sort( ( a, b ) => a.bbox.y0 - b.bbox.y0 )[0];
    // TARGET is thin type over art and sometimes unread; the red COMBAT under the title still marks the side,
    // and TARGET then sits where it does on every combat card of a photo that fills the frame.
    if( !target && words.some( ( word ) => fuzzyIs( word.text, "COMBAT" ) && word.bbox.y0 < height * 0.3 ) )
        target = { text: "TARGET", bbox: { x0: width * 0.155, y0: height * 0.215, x1: width * 0.305, y1: height * 0.243 } };
    if( !target ) return null;
    const rowHeight = target.bbox.y1 - target.bbox.y0;
    // TARGET's widely spaced capitals run about six times their height; part of the word ("TARG") reads narrower.
    const wordWidth = Math.max( target.bbox.x1 - target.bbox.x0, rowHeight * 6 );
    const boxLeft = target.bbox.x0 - wordWidth * 0.9;
    const boxWidth = wordWidth * 2.4;
    const tnWords = words.filter( ( word ) => /^TN\d+/i.test( word.text ) && word.bbox.y0 > target.bbox.y1 );
    const overheatTop = tnWords.length > 0 ? Math.min( ...tnWords.map( ( word ) => word.bbox.y0 ) ) - rowHeight * 0.5 : target.bbox.y1 + ( footerTop - target.bbox.y1 ) * 0.62;
    return {
        side: "combat",
        header: clampRect( { left: boxLeft - wordWidth * 0.2, top: 0, width: width - boxLeft, height: target.bbox.y0 - rowHeight * 0.4 }, width, height ),
        footer: clampRect( { left: boxLeft - wordWidth * 0.2, top: footerTop, width: boxWidth * 1.4, height: height - footerTop }, width, height ),
        columns: [ clampRect( { left: boxLeft, top: target.bbox.y1 + rowHeight * 0.3, width: boxWidth, height: overheatTop - target.bbox.y1 - rowHeight * 0.3 }, width, height ) ],
        overheat: clampRect( { left: boxLeft + boxWidth * 0.25, top: overheatTop, width: width - boxLeft - boxWidth * 0.25, height: footerTop - overheatTop }, width, height ),
    };
}

/* ----- header and footer ----- */

/** Deck name and priority from the card's title band, e.g. "MISSILE BOAT 132". */
export const parseAcesScanHeader = ( text: string ): { deck: string, deckId: IAcesCard["deckId"], priority: number | null } => {
    const flat = text.replace( /[[\]|]/g, " " ).replace( /\s+/g, " " ).trim();
    const priorities = flat.match( /\b\d{3}\b/g );
    const priority = priorities ? +priorities[priorities.length - 1] : null;
    const upper = flat.toUpperCase();
    // Longest name first, so "SCOUT (HOVER)" isn't read as "SCOUT".
    const decks = acesDecks.slice().sort( ( a, b ) => b.name.length - a.name.length );
    const deck = decks.find( ( entry ) => upper.includes( entry.name.toUpperCase() ) )
        || decks.find( ( entry ) => upper.includes( entry.role.toUpperCase() ) );
    if( deck ) {
        const variant = new RegExp( deck.role.toUpperCase().replace( /[()]/g, "\\$&" ) + "\\s*\\(([A-Z]+)\\)" ).exec( upper );
        const name = variant && !deck.name.includes( "(" ) ? deck.role + " (" + titleCase( variant[1] ) + ")" : deck.name;
        const exact = acesDecks.find( ( entry ) => entry.name.toLowerCase() === name.toLowerCase() );
        return { deck: name, deckId: exact ? exact.id : deck.id, priority: priority };
    }
    // A letter or two misread ("WHSSILE BOAT", "SZBUT (HOVER)"): the deck name the text holds with fewest edits.
    const letters = upper.replace( /[^A-Z() ]/g, " " ).replace( /\s+/g, " " ).trim();
    const near = acesDecks.map( ( entry ) => ( { entry, edits: editsWithin( letters, entry.name.toUpperCase() ) } ) )
        .filter( ( match ) => match.edits <= Math.max( 1, Math.floor( match.entry.name.length * 0.3 ) ) )
        .sort( ( a, b ) => a.edits / a.entry.name.length - b.edits / b.entry.name.length || b.entry.name.length - a.entry.name.length )[0];
    if( near ) return { deck: near.entry.name, deckId: near.entry.id, priority: priority };
    const words = flat.replace( /\b\d+\b/g, "" ).replace( /[^A-Za-z() ]/g, "" ).trim();
    return { deck: titleCase( words ), deckId: "", priority: priority };
}

/** Fewest edits that turn some stretch of text into pattern (approximate substring match). */
const editsWithin = ( text: string, pattern: string ): number => {
    let row = Array.from( { length: pattern.length + 1 }, ( _, index ) => index );
    let best = row[pattern.length];
    for( let i = 1; i <= text.length; i++ ) {
        const next = [ 0 ];
        for( let j = 1; j <= pattern.length; j++ ) next[j] = Math.min( row[j] + 1, next[j - 1] + 1, row[j - 1] + ( text[i - 1] === pattern[j - 1] ? 0 : 1 ) );
        row = next;
        best = Math.min( best, row[pattern.length] );
    }
    return best;
}

const titleCase = ( text: string ): string => text.toLowerCase().replace( /(^|[\s(])([a-z])/g, ( _, lead, letter ) => lead + letter.toUpperCase() );

/** Card number from the footer, "2/6 Missile Boat". */
export const parseAcesScanFooter = ( text: string ): string => {
    // Decks run to ten cards ("2/10").
    const match = /(\d{1,2})\s*\/\s*(\d{1,2})/.exec( text )
        // The slash can read as a 1 or l, before the deck name: "416 Scout (Hover)" is 4/6.
        || /\b([1-9])[1lI|\\]([1-9])\s+(?=[A-Z])/.exec( text );
    return match && +match[1] <= +match[2] ? match[1] + "/" + match[2] : "";
}

/* ----- card text ----- */

const plainWord = /^[("']?[A-Za-z][A-Za-z'’-]*[A-Za-z][.,:;)"'’]*$/;
const inchWord = /^\(?\d+(\.\d+)?["”'’°]*\)?[.,:;]?$/;
const tokenWord = /^\[[a-z?]+\]$/i;
const ownWords = [ "a", "vs" ];

const isJunk = ( word: string ): boolean => {
    if( ownWords.includes( word ) ) return false;
    return !plainWord.test( word ) && !inchWord.test( word ) && !tokenWord.test( word );
}

/** OCR slips that the card vocabulary makes certain: "0ccupy", "n0", "enemiesin". */
const fixWords = ( text: string ): string => {
    const digitFor: { [letter: string]: string } = { G: "6", O: "0", o: "0", S: "5", B: "8", I: "1", l: "1", Z: "2" };
    return text
        // A two-digit TN is 10 to 12, so its first digit is 1 however it reads ("TNTO").
        .replace( /\bTN\s*([0-9GOoSBIlZT]{1,2})\b/g, ( _, value: string ) => "TN" + value.split( "" ).map( ( letter, index ) => value.length === 2 && index === 0 ? "1" : digitFor[letter] || letter ).join( "" ) )
        .replace( /^(\W*)[Il1|]?f\s?(there|the)\b/, "$1If $2" )
        .replace( /^(\W*)[Ii][tl]\s+(there are)\b/, "$1If $2" )
        .replace( /\b[Il1]f(there|the|needed)\b/g, "If $1" )
        .replace( /\b1f\b/g, "If" )
        .replace( /andunitcan/g, "and unit can" )
        .replace( /behindit\b/g, "behind it" )
        .replace( /targethasnocover/g, "target has no cover" )
        .replace( /\b0(?=[a-z])/g, "o" )
        .replace( /(?<=[a-z])0\b/g, "o" )
        .replace( /enemiesin\b/gi, "enemies in" )
        .replace( /\b[a-z]?n[eo]mies\b/g, "enemies" )
        .replace( /\b[a-z]?n[eo]my\b/g, "enemy" )
        .replace( /onlytotarget/gi, "only to target" )
        .replace( /\bthis tum\b/g, "this turn" )
        // "COVer", "cOver vs", "covervs": the cards print it lower case, or capitalised to open a line.
        .replace( /\b([cC][oO0][vV]{1,2}[eE][rR])(vs)?\b/g, ( word: string, cover: string, vs: string | undefined ) => ( /^(cover|Cover)$/.test( cover ) ? cover : "cover" ) + ( vs ? " vs" : "" ) )
        .replace( /\bAmor\b/g, "Armor" )
        .replace( /\b[no]ther\b/g, "other" )
        .replace( /([^A-Za-z0-9\s[\]()"'’.,]+)([A-Za-z]{2,})/g, "$1 $2" )
        .replace( /[”“]/g, "\"" )
        .replace( /°/g, "\"" );
}

/**
 * Card text with the unreadable icons put back as tokens, from the wording around them (the icon set is small and
 * each phrase on the cards takes the same icon). Anything else becomes "[?]".
 */
export const restoreAcesScanIcons = ( text: string, hints: { colour?: TAcesColor | null, moved?: boolean } = {} ): string => {
    // "no ✖ enemies" often reads "10 ✖ enemies".
    const words = fixWords( text ).replace( /^(1?0|n0)\s+(?=(\S+\s+)?enem)/, "no " ).split( /\s+/ ).filter( ( word ) => word !== "" );
    // One junk run is one icon (an entry starting "\u0000", followed by what OCR read for it, which hints at its
    // shape). A bare number with no inch mark is an icon misread, except as a count ("in 2").
    const isIcon = ( word: string | undefined ) => word !== undefined && word.startsWith( "\u0000" );
    const merged: string[] = [];
    words.forEach( ( word, index ) => {
        const bareNumber = /^\d+$/.test( word ) && !/^(in|to|than|up|of)$/i.test( words[index - 1] || "" );
        // An icon between "no ... enemies" can read as a short capital word ("no EJ enemies").
        const iconWord = /^[A-Z]{1,3}$/.test( word ) && /^(no|vs|any|in)$/i.test( words[index - 1] || "" ) && /^enem/i.test( words[index + 1] || "" );
        // The ▲ and ▼ icons read as a capital glued to the next word: "Aother enemies", "Yenemy".
        const glued = /^([AVYW])(other|enemy|enemies)$/.exec( word );
        if( glued ) { merged.push( "\u0000" + glued[1], glued[2] ); return; }
        const junk = isJunk( word ) || bareNumber || iconWord;
        if( junk && isIcon( merged[merged.length - 1] ) ) { merged[merged.length - 1] += word; return; }
        merged.push( junk ? "\u0000" + word : word );
    } );
    // The cards never print these phrases without their icon; coloured icons drop out with the background. "has ⊘
    // any enemy" has its icon before "any", not after.
    for( let index = merged.length - 1; index > 0; index-- ) {
        const word = merged[index - 1].toLowerCase();
        const next = merged[index].toLowerCase();
        if( /^(no|vs|any|in)$/.test( word ) && /^(enemies|enemy|other)$/.test( next ) && !( word === "any" && isIcon( merged[index - 2] ) ) ) merged.splice( index, 0, "\u0000" );
        else if( word === "ideal" && !isIcon( next ) ) merged.splice( index, 0, "\u0000" );
    }
    // "in ▼ enemy ⌖": the attack-range icon ends the line.
    if( merged.length >= 2 && merged[merged.length - 1].toLowerCase() === "enemy" && isIcon( merged[merged.length - 3] ) && ( merged[merged.length - 4] || "" ).toLowerCase() === "in" ) merged.push( "\u0000" );
    let colour = hints.colour || null;
    let moved = !!hints.moved;
    const rv = merged.map( ( word, index ) => {
        if( !isIcon( word ) ) return word;
        const read = word.substring( 1 );
        const before = ( merged[index - 1] || "" ).toLowerCase();
        const after = merged.slice( index + 1, index + 4 ).join( " " ).toLowerCase();
        if( /^(enemies|enemy)\b/.test( after ) ) {
            if( before === "no" ) return "[notmoved]";
            if( before === "any" ) {
                if( colour ) { const token = "[" + colour + "]"; colour = null; return token; }
                moved = false;
                return "[moved]";
            }
            if( before === "in" ) return "[lowest]";
            if( before === "vs" || before === "more" ) return "[highest]";
        }
        if( /^other enemies/.test( after ) ) return "[highest]";
        if( /^all enemies/.test( after ) || /^any enemy/.test( after ) ) return "[nolos]";
        // ▲ reads as A, ▼ as V, Y or W.
        if( /^armor/.test( after ) ) return /^[VYW]/.test( read ) ? "[lowest]" : /^[A4]/.test( read ) ? "[highest]" : "[?]";
        if( /^(only to )?target/.test( after ) ) {
            if( inchWord.test( before ) ) return "[spacing]";
            if( /^only/.test( after ) ) return "[los]";
            // The closer icon is two arrowheads ("»{", "p<", ")¢"); the eye is round ("©", "®", "O®").
            if( /^[©®@oO0Q]+$/.test( read ) ) return "[los]";
            return "[closer]";
        }
        if( before === "enemy" && after === "" ) return "[range]";
        if( before === "ideal" && colour ) { const token = "[" + colour + "]"; colour = null; return token; }
        if( ( before === "is" || before === "are" ) && moved ) { moved = false; return "[moved]"; }
        // Stray marks where the cards print no icon: before "no", before a distance, or ahead of the opening "If".
        if( /^(no|if)$/i.test( merged[index + 1] || "" ) || inchWord.test( merged[index + 1] || "" ) ) return "";
        return "[?]";
    } );
    let joined = rv.filter( ( word ) => word !== "" ).join( " " ).replace( /\s+([,.:;)])/g, "$1" ).trim();
    // "If the ideal ◇ is ✔ and unit can move behind it", with "is ✔" read as one short scrap ("ba") or not at all.
    if( hints.moved ) joined = joined.replace( /(\bideal \[\w+\]) (?:(?!is\b)\S{1,3} )?(?=and unit)/, "$1 is [moved] " );
    return joined;
}

/** Column-edge noise: rule-like stray characters or a lone "i" at either end of a line (icons are kept). */
const trimEdges = ( text: string ): string => {
    return text
        .replace( /^(\s*([|=~‘'`_\-.,:;]{1,2}|i)\s+)+/, "" )
        .replace( /(\s+([|=~‘'`_\-.,:;]{1,2}|i))+\s*$/, "" )
        .replace( /^[|=~‘'`_\-.,:;"“]+\s*/, "" )
        .trim();
}

/** Items OCR ran together on one line, "1. Hit target's Rear 2. Armor lost", split at each item number. */
const splitItems = ( lines: string[] ): string[] => lines.reduce( ( rv, line ) => rv.concat( line.split( /\s+(?=[1-9]\.\s?[A-Za-z[])/ ) ), [] as string[] );

/**
 * A line that carries on the item above it rather than starting a new one: the cards wrap only after "vs" (before
 * "▲ other enemies") or a sprint condition's comma (before "⊘ all enemies").
 */
const continues = ( previous: string, line: string ): boolean => /(\bvs|,)\W{0,3}$/i.test( previous ) || /^\W{0,3}\S{0,2}\s*(other enemies|all enemies)\b/i.test( line );

const numbered = /^\W{0,3}(\d)\s*(?:[.,:]\s*|\s+(?=[A-Za-z[])|(?=[a-z]))/;
const zoneLine = /\d+\s*["”'’°]+\s*\)/;

/**
 * Zone rings from a line of only numbers, inch marks and brackets, which OCR sometimes runs together: "©1624)" is
 * 16" and 24". Rings are 6" to 48" and print closest first, so a run of digits splits into rising rings; a ring's
 * lost '")' can read as a 7 or 1 ("©6724\"" is 6" and 24").
 */
const gluedRings = ( text: string ): number[] | null => {
    if( /[A-Za-z]{2,}/.test( text ) || !/\d/.test( text ) || !/[)"”'’°]/.test( text ) ) return null;
    // The split of a run into rising rings, with as few misread marks as there must be.
    // The rings known so far are all even inches, so an even split wins; an odd ring is still taken if nothing even fits.
    const split = ( run: string, after: number, marks: number, even: boolean ): number[] | null => {
        if( run === "" ) return [];
        for( const size of [ 2, 1 ] ) {
            const ring = +run.substring( 0, size );
            if( run.length < size || ring < 6 || ring > 48 || ( even && ring % 2 !== 0 ) || ring <= after ) continue;
            const rest = run.substring( size );
            const plain = split( rest, ring, marks, even );
            if( plain ) return [ ring, ...plain ];
            const marked = marks > 0 && /^[71]/.test( rest ) ? split( rest.substring( 1 ), ring, marks - 1, even ) : null;
            if( marked ) return [ ring, ...marked ];
        }
        return null;
    }
    const rv: number[] = [];
    for( const run of text.match( /\d+/g ) || [] ) {
        let rings: number[] | null = null;
        for( const even of [ true, false ] ) for( let marks = 0; marks <= 2 && !rings; marks++ ) rings = split( run, rv.length > 0 ? rv[rv.length - 1] : 0, marks, even );
        if( !rings ) return null;
        rv.push( ...rings );
    }
    return rv.length > 0 ? rv : null;
}

export const parseZone = ( text: string ): { zoneRings: number[], zoneKeyword: "" | "nearest" | "any" } => {
    // A ring line is only numbers and marks, so once one ring reads cleanly the others count even where OCR lost the inch mark ("6') 24)").
    const marked = /\d+(?=\s*["”'’°]+\s*\))/.test( text ) && !/[A-Za-z]{2,}/.test( text );
    // A number that is no ring is two glued together, or one with its mark misread ("67\")" is 6" and a 7 for '")').
    const rings = ( text.match( marked ? /\d+/g : /\d+(?=\s*["”'’°]+\s*\))/g ) || [] )
        .reduce( ( rv, run ) => rv.concat( gluedRings( run + ")" ) || [] ), [] as number[] );
    // Rings print closest first; a number before a larger one's end is the zone icon misread ("46) 24") 30")").
    while( rings.length > 1 && rings[0] >= rings[1] ) rings.shift();
    if( rings.length > 0 ) return { zoneRings: rings, zoneKeyword: "" };
    const glued = gluedRings( text );
    if( glued ) return { zoneRings: glued, zoneKeyword: "" };
    if( /\bany\b/i.test( text ) ) return { zoneRings: [], zoneKeyword: "any" };
    return { zoneRings: [], zoneKeyword: "nearest" };
}

const isZoneLine = ( text: string ): boolean => zoneLine.test( text ) || gluedRings( text ) !== null || /^\W*(nearest|any)\W*$/i.test( text );

/**
 * Numbered lines with their wrapped continuations joined. Every other line is an item of its own, whether its number
 * read or not ("4" for a ▲, "ain" for "4. in"), and lines with no words are dropped.
 */
const joinNumbered = ( lines: string[] ): string[] => {
    const rv: string[] = [];
    for( const line of splitItems( lines ) ) {
        if( rv.length > 0 && continues( rv[rv.length - 1], line ) ) {
            rv[rv.length - 1] += " " + line;
            continue;
        }
        const match = numbered.exec( line );
        const text = ( match ? line.substring( match[0].length ) : line ).replace( /^a(?=in\b)/, "" );
        if( /[A-Za-z]{2,}/.test( text ) ) rv.push( text );
    }
    return rv;
}

const isNumberedStart = ( text: string ): boolean => {
    const match = numbered.exec( text );
    return !!match && match[1] === "1";
}

/** One behavior column from its OCR lines, top to bottom, with the icon colours of each line. */
export const parseAcesScanColumn = ( lines: { text: string, colours: ICardScanColours }[], warnings: string[] = [] ): IAcesBehaviorColumn => {
    const column = newAcesBehaviorColumn();
    // Blank rows (all icons, no OCR text) are kept when they show a tag or a check.
    const texts = lines.map( ( line ) => ( { text: trimEdges( line.text ), colours: line.colours } ) )
        .filter( ( line ) => line.text !== "" || acesScanTagColour( line.colours ) !== null || line.colours.green >= checkThreshold );
    // Art or the header's edge read above the condition: the condition opens with "If" on the next line.
    if( texts.length > 1 && !/\bI[fl]|\bif/.test( texts[0].text ) && /^\W{0,2}[Il1|]?f\s?the/.test( texts[1].text ) ) texts.shift();
    // The alternative movement reads "(S if there are no ...)" or "(J if needed)"; a condition opens with "If".
    const isMoveRow = ( text: string ) => /if\s*needed|standstill/i.test( text ) || ( /if\s*there/i.test( text ) && !/^\W{0,2}If\b/.test( text ) );
    const zoneIndex = texts.findIndex( ( line ) => isZoneLine( line.text ) );
    // Without a zone row the condition runs from an opening "If" to the first row that can't be part of it.
    let conditionEnd = zoneIndex;
    if( zoneIndex < 0 ) {
        conditionEnd = 0;
        if( texts.length > 0 && /^\W{0,2}If/i.test( texts[0].text ) ) {
            conditionEnd = texts.findIndex( ( line, index ) => index > 0 && ( line.text === "" || isMoveRow( line.text ) || isNumberedStart( line.text ) ) );
            if( conditionEnd < 0 ) conditionEnd = texts.length;
        }
    }
    const middleStart = zoneIndex >= 0 ? zoneIndex + 1 : conditionEnd;
    const firstNumbered = texts.findIndex( ( line, index ) => index >= middleStart && isNumberedStart( line.text ) );

    // The condition wraps, so its icons are restored over the whole text.
    const conditionLines = texts.slice( 0, Math.max( 0, conditionEnd ) );
    const conditionColour = conditionLines.map( ( line ) => acesScanTagColour( line.colours ) ).find( ( colour ) => colour ) || null;
    column.condition = restoreAcesScanIcons( conditionLines.map( ( line ) => line.text ).join( " " ), {
        colour: conditionColour,
        moved: conditionLines.some( ( line ) => line.colours.green >= checkThreshold ),
    } );
    // The top line, hard against the header, can go unread; "is ✔ and unit can move behind it" only ever follows it.
    if( /^is\b.*\bbehind it$/.test( column.condition ) ) column.condition = "If the ideal [" + ( conditionColour || "?" ) + "] " + column.condition;

    if( zoneIndex >= 0 ) {
        const zone = parseZone( texts[zoneIndex].text );
        column.zoneRings = zone.zoneRings;
        column.zoneKeyword = zone.zoneKeyword;
    }

    const middle = texts.slice( middleStart, firstNumbered >= 0 ? firstNumbered : texts.length );
    let moveRow = 0;
    if( middle.length > 0 && !isMoveRow( middle[0].text ) ) {
        const first = middle[0];
        const colour = acesScanTagColour( first.colours );
        const hasNearest = /nearest/i.test( first.text );
        const moved = first.colours.green >= checkThreshold;
        // A target row shows a list tag, "nearest" or the moved check; otherwise it's the plain G movement row.
        if( colour || hasNearest || moved ) {
            column.targetSelect = colour || ( hasNearest ? "nearest" : "" );
            column.targetMoved = moved;
            moveRow = 1;
        }
    }
    const moveText = fixWords( middle.slice( moveRow ).map( ( line ) => line.text ).join( " " ) );
    const moveColours = middle[moveRow] ? middle[moveRow].colours : null;
    if( /standstill/i.test( moveText ) ) {
        column.moveType = "standstill";
    } else {
        const when = /(if (needed|there)[^]*)$/i.exec( moveText );
        if( when ) {
            const lead = moveText.substring( 0, when.index );
            const letter = /\b([SJ])\b/.exec( lead.toUpperCase().replace( /[^A-Z]/g, " " ) );
            let alt: TAcesMoveType = "jump";
            if( letter ) alt = letter[1] === "S" ? "sprint" : "jump";
            else if( moveColours ) alt = moveColours.yellow > moveColours.red ? "sprint" : "jump";
            column.altMoveType = alt;
            column.altMoveWhen = fixWords( when[1] ).replace( /\)\s*\W*$/, "" ).replace( /\s+/g, " " ).trim();
        }
    }

    // Card art under a short column reads as lines of capitals; every filter uses a word from the cards' small set.
    // A list ending "vs" lost its last line under the photo's edge. "▲ other enemies" is the usual ending, so it's
    // filled in, but "vs target" also prints, so the player is asked to check.
    column.filters = joinNumbered( texts.slice( firstNumbered >= 0 ? firstNumbered : texts.length ).map( ( line ) => line.text ) )
        .map( ( line, index, lines ) => {
            if( index < lines.length - 1 || !/\bvs\W*$/.test( line ) ) return line;
            const guessed = line.replace( /\W*$/, "" ) + " [highest] other enemies";
            warnings.push( "The last line of \"" + guessed + "\" was cut off and guessed: check it against the card." );
            return guessed;
        } )
        .map( ( line ) => restoreAcesScanIcons( line ) )
        // A filter is never a bare "target": its icon went unread.
        .map( ( line ) => /^\W*target\W*$/i.test( line ) ? "[?] target" : line )
        .filter( ( line ) => /target|enem|all(y|ies)|cover|woods|sprint|behind|armor|damage|heat|terrain|building|water|elevation|hill/i.test( line ) )
        // Each line set to the nearest printed filter, its numbers kept from the photo.
        .map( ( line ) => matchAcesPhrase( line, acesMovementFilterPhrases ) );
    if( column.condition ) column.condition = matchAcesPhrase( column.condition, acesConditionPhrases, conditionColour );
    return column;
}

/**
 * The combat side: zone and numbered target filters from the TARGET column, OV rows from the band below. Each target
 * line may carry the list-tag colour read from its pixels; otherRead is the text of another pass over the photo.
 */
export const parseAcesScanCombat = ( targetLines: string[], overheatLines: string[], tags: ( TAcesColor | null )[] = [], otherRead = "" ): IAcesCard["combat"] => {
    // "If there are no enemies in [los]: use indirect fire special order card" is a reminder, not a target filter,
    // and can wrap onto a second line.
    const reminder = ( text: string ) => /no\s+enem|indirect|special\s+order/i.test( text );
    const indirectIfNoLOS = [ ...targetLines, ...overheatLines ].some( ( text ) => /indirect|special\s+order/i.test( text ) );
    overheatLines = overheatLines.filter( ( text ) => !reminder( text ) );
    const lines = targetLines.map( ( text, index ) => ( { text: trimEdges( text ), tag: tags[index] || null } ) ).filter( ( line ) => line.text !== "" && !reminder( line.text ) );
    const zone = lines.find( ( line ) => isZoneLine( line.text ) );
    // Items as joinNumbered makes them, but the panel holds nothing else, so text before any number is item 1, and a
    // "command list" line is always its own item: its number often goes unread beside the tag.
    const items: { text: string, tag: TAcesColor | null }[] = [];
    const split = lines.filter( ( line ) => line !== zone ).reduce( ( rv, line ) => rv.concat( splitItems( [ line.text ] ).map( ( text ) => ( { text, tag: line.tag } ) ) ), [] as typeof lines );
    // A piece with no word in it is a stray mark (or a tag whose word didn't read, which the tag colour stands for).
    for( const line of split.filter( ( piece, index ) => /[A-Za-z]{2,}/.test( piece.text ) || ( piece.tag && index === split.length - 1 ) ) ) {
        const match = numbered.exec( line.text );
        if( match && +match[1] === items.length + 1 ) items.push( { text: line.text.substring( match[0].length ), tag: line.tag } );
        else if( /\bcommand\s+list\b/i.test( line.text ) || items.length === 0 ) items.push( { text: line.text.replace( /^\W*\d?\W*/, "" ), tag: line.tag } );
        else if( items.length > 0 ) items[items.length - 1].text += " " + line.text;
    }
    const filters = items.map( ( item ) => {
        // "RED command list": the white-on-colour tag word never survives, so the colour comes from the pixels.
        // No target filter ends in an icon but "in ▼ enemy ⌖", so an unplaced one at the end is a stray mark.
        let restored = restoreAcesScanIcons( item.text ).replace( /\s*\[\?\]$/, "" ).replace( /^(\[\?\]\s*)?(\S{1,3}\s+)?(command\s+)?list$/i, "[?] command list" );
        if( item.tag && /^\[\?\]\s*command list$/i.test( restored ) ) restored = "[" + item.tag + "] command list";
        // "▲ Armor lost": the blue ▲ often reads as nothing at all, but its colour shows (red would be ▼); the cards
        // never print "Armor lost" without one.
        // Failing that, another read of the photo may have caught the icon as a letter ("A Armor lost").
        if( /^(\[\?\]\s*)?Armor lost$/i.test( restored ) ) {
            const seen = /\b([AVYW])\s*Armor lost/.exec( otherRead );
            const icon = item.tag === "blue" ? "[highest]" : item.tag === "red" ? "[lowest]" : seen ? ( seen[1] === "A" ? "[highest]" : "[lowest]" ) : "[?]";
            restored = icon + " Armor lost";
        }
        // Set to the nearest printed line, but only with every icon read: the phrase would fill an unread one in.
        if( !/\[\?\]/.test( restored ) ) restored = matchAcesPhrase( restored, acesCombatFilterPhrases, item.tag );
        return parseAcesPriorityLine( restored );
    } );
    // OV rows can wrap; each one starts "If TN".
    const rows: string[] = [];
    for( const line of overheatLines.map( trimEdges ) ) {
        if( /^\W*If\s*TN/i.test( line ) || rows.length === 0 ) rows.push( line.replace( /^\W*/, "" ) );
        else rows[rows.length - 1] += " " + line;
    }
    let overheat = rows.map( ( row ) => parseAcesOverheatLine( fixWords( row ).replace( /\s+/g, " " ) ) )
        .filter( ( row ) => row !== null ) as IAcesCard["combat"]["overheat"];
    // Every card prints the same three OV rows but for four numbers: each row's TN and the second row's OV limit
    // (Rekikire). The rows are built from those, so OCR's garbled words cost nothing: the TNs follow "TN" and the
    // limit sits in "up to N OV". Failing those, exactly four numbers in the text are taken in order. A third TN
    // that won't read is left 0 for the player to fix (the scan warns of it).
    const ovText = fixWords( overheatLines.join( " " ) ).replace( /(\d)[0O]\s*V\b/g, "$1 OV" );
    const tns = ( ovText.match( /\bTN\d{1,2}\b/g ) || [] ).map( ( tn ) => +tn.substring( 2 ) );
    const limit = /\bup\s*to\s*([0-9IlOoSZ])\s*O?V/i.exec( ovText );
    const numbers = ( ovText.match( /\d+/g ) || [] ).map( Number );
    if( tns.length >= 2 && tns.length <= 3 && limit ) {
        const digitFor: { [letter: string]: string } = { I: "1", l: "1", O: "0", o: "0", S: "5", Z: "2" };
        const ovLimit = +( digitFor[limit[1]] || limit[1] );
        overheat = acesStandardOverheatRows( tns[0], tns[1], ovLimit, tns.length === 3 ? tns[2] : 0 );
    } else if( /TN/i.test( ovText ) && numbers.length === 4 ) overheat = acesStandardOverheatRows( numbers[0], numbers[1], numbers[2], numbers[3] );
    return { ...( zone ? parseZone( zone.text ) : { zoneRings: [], zoneKeyword: "" as const } ), filters: filters, overheat: overheat, indirectIfNoLOS: indirectIfNoLOS };
}

/**
 * Lines as the card prints them: noise (low confidence, the copyright footer) dropped, and pieces of one printed
 * row that OCR split, such as an item number and its text, joined left to right.
 */
export const tidyAcesScanLines = ( lines: ICardScanLine[] ): ICardScanLine[] => {
    // Card art read as text comes back as one tall line; printed rows are all about the same height.
    const heights = lines.map( ( line ) => line.bbox.y1 - line.bbox.y0 ).sort( ( a, b ) => a - b );
    const rowHeight = heights.length > 0 ? heights[Math.floor( heights.length / 2 )] : 0;
    // The copyright's year has four digits; a zone row's ◎ also reads as "©", before a ring ("© 20\")").
    const kept = lines.filter( ( line ) => line.text.trim() !== ""
        && line.bbox.y1 - line.bbox.y0 <= rowHeight * 2.5
        && !/Topps|Company|Rights Reserved|©\s*20\d\d/i.test( line.text ) );
    const rows: ICardScanLine[] = [];
    for( const line of kept.slice().sort( ( a, b ) => a.bbox.y0 - b.bbox.y0 ) ) {
        const row = rows.find( ( entry ) => {
            const overlap = Math.min( entry.bbox.y1, line.bbox.y1 ) - Math.max( entry.bbox.y0, line.bbox.y0 );
            return overlap > 0.5 * Math.min( entry.bbox.y1 - entry.bbox.y0, line.bbox.y1 - line.bbox.y0 );
        } );
        if( !row ) {
            rows.push( { ...line, words: line.words.slice() } );
            continue;
        }
        const pieces = [ row, line ].sort( ( a, b ) => a.bbox.x0 - b.bbox.x0 );
        row.text = pieces.map( ( piece ) => piece.text.trim() ).join( " " );
        row.words = pieces[0].words.concat( pieces[1].words );
        row.bbox = {
            x0: Math.min( row.bbox.x0, line.bbox.x0 ), y0: Math.min( row.bbox.y0, line.bbox.y0 ),
            x1: Math.max( row.bbox.x1, line.bbox.x1 ), y1: Math.max( row.bbox.y1, line.bbox.y1 ),
        };
    }
    return rows;
}

/**
 * The priority number's 1s and 7s told apart by shape, which OCR can't do in the card's font: a 7 is as wide as the
 * other digits (about 0.6 of its height), a 1 a narrow stroke. The digits are the three tallest blobs of white ink;
 * if three don't stand out the reading is kept.
 */
export const acesScanOnesAndSevens = ( digits: string, boxes: ICardScanBox[] ): string => {
    const highest = Math.max( 0, ...boxes.map( ( box ) => box.y1 - box.y0 ) );
    // A photo can break a 7's bar from its stem, so pieces that overlap side to side are one glyph.
    const pieces: ICardScanBox[] = [];
    for( const box of boxes.filter( ( box ) => box.y1 - box.y0 >= highest * 0.25 ).sort( ( a, b ) => a.x0 - b.x0 ) ) {
        const last = pieces[pieces.length - 1];
        if( last && box.x0 < last.x1 ) pieces[pieces.length - 1] = { x0: last.x0, y0: Math.min( last.y0, box.y0 ), x1: Math.max( last.x1, box.x1 ), y1: Math.max( last.y1, box.y1 ) };
        else pieces.push( box );
    }
    const tallest = Math.max( 0, ...pieces.map( ( box ) => box.y1 - box.y0 ) );
    const glyphs = pieces.filter( ( box ) => box.y1 - box.y0 >= tallest * 0.75 );    if( glyphs.length !== digits.length ) return digits;
    return digits.split( "" ).map( ( digit, index ) => {
        if( digit !== "1" && digit !== "7" ) return digit;
        const box = glyphs[index];
        return ( box.x1 - box.x0 ) / ( box.y1 - box.y0 ) > 0.45 ? "7" : "1";
    } ).join( "" );
}

/* ----- the cards' own phrases ----- */

const phraseColours = [ "blue", "red", "yellow" ];

/** Words, numbers and [icon] tokens, without case or punctuation. */
const phraseTokens = ( text: string ): string[] => ( text.toLowerCase().match( /\[[^\]]*\]|\{[nc]\}|\d+|[a-z']+/g ) || [] );

/**
 * The card phrase a read line is nearest to, with its {n} and {c} slots filled from the words they line up with;
 * the line as read when no phrase is near enough, when two are equally near, or when a number slot lines up with no
 * number (the number is the one part a phrase can't supply).
 */
export const matchAcesPhrase = ( text: string, phrases: string[], colour: string | null = null ): string => {
    const read = phraseTokens( text );
    if( read.length === 0 ) return text;
    const costOf = ( slot: string, word: string ): number => {
        if( slot === "{n}" ) return /^\d+$/.test( word ) ? 0 : 1;
        if( slot === "[{c}]" ) return phraseColours.includes( word.replace( /[[\]]/g, "" ) ) || word === "[?]" ? 0 : 1;
        // An icon OCR couldn't place is half a match for any icon.
        if( /^\[/.test( slot ) && word === "[?]" ) return 0.5;
        if( slot === word ) return 0;
        if( /^[[{]/.test( slot ) || /^\[/.test( word ) ) return 1;
        // A misread word costs by its wrong letters, so "behlnd" is nearly "behind".
        const row = Array.from( { length: word.length + 1 }, ( _, j ) => j );
        for( let i = 1; i <= slot.length; i++ ) {
            let diagonal = row[0];
            row[0] = i;
            for( let j = 1; j <= word.length; j++ ) {
                const above = row[j];
                row[j] = Math.min( above + 1, row[j - 1] + 1, diagonal + ( slot[i - 1] === word[j - 1] ? 0 : 1 ) );
                diagonal = above;
            }
        }
        return Math.min( 1, row[word.length] / Math.max( slot.length, word.length ) * 2 );
    };
    const scored = phrases.map( ( phrase ) => {
        const want = phraseTokens( phrase.replace( /\[\{c\}\]/g, "[{c}]" ) );
        // Word-level edit distance, kept whole for the alignment.
        const d: number[][] = Array.from( { length: want.length + 1 }, ( _, i ) => Array.from( { length: read.length + 1 }, ( __, j ) => i + j ) );
        for( let i = 1; i <= want.length; i++ ) for( let j = 1; j <= read.length; j++ ) {
            d[i][j] = Math.min( d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costOf( want[i - 1], read[j - 1] ) );
        }
        const fills: string[] = [];
        for( let i = want.length, j = read.length; i > 0; ) {
            if( j > 0 && d[i][j] === d[i - 1][j - 1] + costOf( want[i - 1], read[j - 1] ) ) {
                if( /^(\{n\}|\[\{c\}\])$/.test( want[i - 1] ) ) fills.unshift( costOf( want[i - 1], read[j - 1] ) === 0 ? read[j - 1] : "" );
                i--; j--;
            } else if( j > 0 && d[i][j] === d[i][j - 1] + 1 ) j--;
            else {
                if( /^(\{n\}|\[\{c\}\])$/.test( want[i - 1] ) ) fills.unshift( "" );
                i--;
            }
        }
        return { phrase, fills, score: 1 - d[want.length][read.length] / Math.max( want.length, read.length ) };
    } ).sort( ( a, b ) => b.score - a.score );
    const best = scored[0];
    if( !best || best.score < 0.7 || ( scored[1] && scored[1].score === best.score ) ) return text;
    let at = 0;
    let missing = false;
    const filled = best.phrase.replace( /\{n\}|\[\{c\}\]/g, ( slot ) => {
        const fill = best.fills[at++] || "";
        if( slot === "{n}" ) {
            if( !fill ) missing = true;
            return fill;
        }
        const named = fill.replace( /[[\]]/g, "" );
        return "[" + ( phraseColours.includes( named ) ? named : colour || "?" ) + "]";
    } );
    return missing ? text : filled;
}

/* ----- the whole scan ----- */

const linesIn = ( lines: ICardScanLine[] ): string => lines.map( ( line ) => line.text ).join( " " );

/** A column's line with the colours of its full column width, so tags left or right of the OCR text count. */
const columnLineRect = ( line: ICardScanLine, column: ICardScanRect ): ICardScanRect => ( {
    left: column.left,
    top: line.bbox.y0,
    width: column.width,
    height: Math.max( 1, line.bbox.y1 - line.bbox.y0 ),
} );

/**
 * Empty rows for the gaps between OCR lines a printed row could fill. A target row such as "⌖ ✔ YELLOW" is all
 * icons and often gives OCR nothing, but its colours still tell the list and the moved check.
 */
const withBlankRows = ( lines: ICardScanLine[], column: ICardScanRect ): ICardScanLine[] => {
    if( lines.length === 0 ) return lines;
    const heights = lines.map( ( line ) => line.bbox.y1 - line.bbox.y0 ).sort( ( a, b ) => a - b );
    const rowHeight = heights[Math.floor( heights.length / 2 )];
    const rv: ICardScanLine[] = [];
    let previous = column.top;
    for( const line of lines ) {
        if( line.bbox.y0 - previous > rowHeight * 1.6 ) {
            const top = previous + ( line.bbox.y0 - previous - rowHeight ) / 2;
            rv.push( { text: "", words: [], bbox: { x0: column.left, y0: top, x1: column.left + column.width, y1: top + rowHeight } } );
        }
        rv.push( line );
        previous = line.bbox.y1;
    }
    return rv;
}

/** Behavior cards print landscape; a scan that found the column headers or TARGET found the card. */
export const acesCardScanOptions: ICardScanOptions<IAcesScanResult> = { shape: "landscape", found: ( result ) => result.side !== null };

export const scanAcesCard = async ( io: ICardScanIO ): Promise<IAcesScanResult> => {
    const result: IAcesScanResult = {
        side: null, deck: "", deckId: "", cardNumber: "", priority: null, columns: [], combat: null, warnings: [],
    };
    const everything = { left: 0, top: 0, width: io.width, height: io.height };
    let whole = await io.recognize( everything, "plain" );
    let layout = findAcesCardLayout( whole, io.width, io.height );
    // The column headers are white on black and can be lost in a glare; read only the bright text and look again.
    if( !layout ) {
        whole = whole.concat( await io.recognize( everything, "bright" ) );
        layout = findAcesCardLayout( whole, io.width, io.height );
    }
    if( !layout ) {
        result.warnings.push( "Couldn't find the Aggressive / Balanced / Cautious headers or TARGET. Take the photo straight on, with one card filling the frame." );
        return result;
    }
    result.side = layout.side;

    // The title sits left in the band and the priority number right.
    const titleRect = clampRect( { ...layout.header, width: layout.header.width * 0.62 }, io.width, io.height );
    const numberRect = clampRect( { ...layout.header, left: layout.header.left + layout.header.width * 0.66, width: layout.header.width * 0.34 }, io.width, io.height );
    const header = parseAcesScanHeader( linesIn( await io.recognize( titleRect, "bright" ) ) );
    // OCR misreads very large digits, and the narrow 1 against 7 in this font; small sizes read best, so a few are
    // tried and the most common three-digit reading wins. A darker photo's white digits read grey, so failing that
    // the cut is set from the number's own brightness.
    const votes: { [value: string]: number } = {};
    let numberMode: TCardScanMode = "digits";
    for( const mode of [ "digits", "dim-digits" ] as const ) {
        if( Object.keys( votes ).length > 0 ) break;
        numberMode = mode;
        for( const height of [ 30, 34, 38, 42 ] ) {
            const digits = linesIn( await io.recognize( numberRect, mode, Math.min( 1, height / ( numberRect.height + cardScanMargin * 2 ) ) ) ).replace( /\D/g, "" );
            if( digits.length === 3 ) votes[digits] = ( votes[digits] || 0 ) + 1;
        }
    }
    let best = Object.keys( votes ).sort( ( a, b ) => votes[b] - votes[a] )[0];
    if( best !== undefined && /[17]/.test( best ) ) best = acesScanOnesAndSevens( best, cardScanInkBoxes( io, numberRect, numberMode ) );
    // The first pass over the whole photo often reads what the close crops miss: the title, the big number at the
    // top right, and "4/6 Missile Boat" at the bottom left.
    const top = whole.filter( ( line ) => line.bbox.y1 < io.height * 0.4 );
    const bottom = whole.filter( ( line ) => line.bbox.y0 > io.height * 0.6 );
    const footerText = linesIn( await io.recognize( layout.footer, "bright" ) );
    const named = [ header, parseAcesScanHeader( linesIn( top ).replace( /\b\d+\b/g, "" ) ), parseAcesScanHeader( linesIn( bottom ).replace( /\d\s*\/\s*\d|©\s*\d+/g, "" ) ), parseAcesScanHeader( footerText.replace( /\d\s*\/\s*\d/g, "" ) ) ]
        .find( ( entry ) => entry.deckId ) || header;
    result.deck = named.deck;
    result.deckId = named.deckId;
    const wholeNumber = top.reduce( ( rv, line ) => rv.concat( line.words.filter( ( word ) => word.bbox.x0 > io.width * 0.55 && /^\(?\d{3}\)?$/.test( word.text ) ) ), [] as ICardScanWord[] )
        .map( ( word ) => +word.text.replace( /\D/g, "" ) )[0];
    result.priority = best !== undefined ? +best : header.priority !== null ? header.priority : wholeNumber !== undefined ? wholeNumber : null;
    result.cardNumber = parseAcesScanFooter( footerText ) || parseAcesScanFooter( linesIn( bottom ).replace( /©\s*\d+/g, "" ) );
    // The footer prints light grey, under the bright cut in a dim photo; glare on the logo beside it would set the
    // dim cut too high, so only its left half is read.
    if( !result.cardNumber ) {
        const left = { ...layout.footer, width: Math.round( layout.footer.width * 0.5 ) };
        for( const scale of [ 1, 2 ] ) {
            if( !result.cardNumber ) result.cardNumber = parseAcesScanFooter( linesIn( await io.recognize( left, "dim", scale ) ) );
        }
    }
    result.warnings.push( result.priority === null ? "Priority number not read." : "Check the priority number: OCR can mix up 1 and 7 in the card's font." );
    if( !result.deck ) result.warnings.push( "Deck name not read." );
    if( !result.cardNumber ) result.warnings.push( "Card number (e.g. 2/6) not read." );

    if( layout.side === "movement" ) {
        for( const rect of layout.columns ) {
            const lines = tidyAcesScanLines( await io.recognize( rect, "panel" ) );
            result.columns.push( parseAcesScanColumn( withBlankRows( lines, rect ).map( ( line ) => ( { text: line.text, colours: io.colours( columnLineRect( line, rect ) ) } ) ), result.warnings ) );
        }
        result.warnings.push( "The black target icons (⌖ in attack range, 👁 in line of sight, ⊘ out of line of sight) aren't read: tick them by hand." );
    } else {
        const targetLines = tidyAcesScanLines( await io.recognize( layout.columns[0], "panel" ) );
        const overheatLines = layout.overheat ? tidyAcesScanLines( await io.recognize( layout.overheat, "dark" ) ) : [];
        // The tag sits at the line's start; the panel's right edge meets the red card art.
        const panel = layout.columns[0];
        const tagBand = { ...panel, left: panel.left + panel.width * 0.08, width: panel.width * 0.6 };
        const tags = targetLines.map( ( line ) => acesScanTagColour( io.colours( columnLineRect( line, tagBand ) ) ) );
        result.combat = parseAcesScanCombat( targetLines.map( ( line ) => line.text ), overheatLines.map( ( line ) => line.text ), tags, linesIn( whole ) );
        // A TN that didn't read (shown as under 2) gets one closer read of each OV row on its own.
        const badTN = ( combat: IAcesCard["combat"] ) => combat.overheat.some( ( row ) => ( row.tnAtMost !== null && row.tnAtMost < 2 ) || ( row.tnAtLeast !== null && row.tnAtLeast < 2 ) );
        if( layout.overheat && badTN( result.combat ) ) {
            const band = layout.overheat;
            const rows: string[] = [];
            for( let row = 0; row < 3; row++ ) {
                rows.push( linesIn( await io.recognize( { ...band, top: Math.round( band.top + band.height * row / 3 ), height: Math.round( band.height / 3 ) }, "dark", 2 ) ) );
            }
            const closer = parseAcesScanCombat( targetLines.map( ( line ) => line.text ), rows, tags, linesIn( whole ) );
            if( closer.overheat.length >= result.combat.overheat.length && !badTN( closer ) ) result.combat.overheat = closer.overheat;
        }
        // The indirect fire box sits over the art, outside both crops; the whole-photo pass reads it well.
        if( /indirect\s*fire|special\s*order/i.test( linesIn( whole ) ) ) result.combat.indirectIfNoLOS = true;
        // Some decks (Scout (Hover)) print no OV rows at all.
        if( result.combat.overheat.length === 0 && /\bTN\s*\d|\bOV\b/.test( linesIn( whole ) + " " + linesIn( overheatLines ) ) ) result.warnings.push( "No OV rows read." );
        // No roll needs less than 2, so a TN under that is a misread digit (often 9 or 6 read as 0).
        if( badTN( result.combat ) )
            result.warnings.push( "Check the TN numbers in the OV rows: one didn't read as a real target number." );
    }
    const unknown = JSON.stringify( result ).split( "[?]" ).length - 1;
    if( unknown > 0 ) result.warnings.push( unknown + " icon" + ( unknown > 1 ? "s" : "" ) + " couldn't be placed and show as [?]." );
    return result;
}

/** Puts a scan onto a card draft: a movement side fills the three columns, a combat side the combat block. */
export const applyAcesScanToCard = ( card: IAcesCard | null, scan: IAcesScanResult ): IAcesCard => {
    const rv: IAcesCard = card ? JSON.parse( JSON.stringify( card ) ) : newAcesCard();
    if( scan.deck && !rv.deck ) {
        rv.deck = scan.deck;
        rv.deckId = scan.deckId;
    }
    if( scan.cardNumber && !rv.cardNumber ) rv.cardNumber = scan.cardNumber;
    if( scan.side === "movement" && scan.columns.length === 3 ) {
        rv.aggressive = scan.columns[0];
        rv.balanced = scan.columns[1];
        rv.cautious = scan.columns[2];
        rv.movePriority = scan.priority;
    }
    if( scan.side === "combat" && scan.combat ) {
        rv.combat = scan.combat;
        rv.combatPriority = scan.priority;
    }
    return rv;
}
