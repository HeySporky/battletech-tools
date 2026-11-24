/*
 * Reading a photo of a printed Alpha Strike unit card: the title, PV, stats, damage, OV, pips and specials are read
 * into a draft, and the draft is looked up on the Master Unit List. All printings share one layout: the title and
 * PV across the top, then panels down the left (stats, damage, heat, pips, specials) whose number and height vary by
 * unit type, so the panels' rows are found from the pixels and each is told apart by what it says.
 */
import { ASMULRoles } from "../data/alpha-stike-mul-roles";
import { IASMULUnit } from "./alpha-strike-unit";
import { cardScanRows, ICardScanIO, ICardScanRect, TCardScanMode } from "./card-scan-io";

/** Alpha Strike unit type codes, as printed after TP:. */
const asTypes = [ "BM", "IM", "PM", "CV", "SV", "MS", "BA", "CI", "AF", "CF", "SC", "DS", "DA", "SS", "JS", "WS" ];

/** The OCR text of one row of the card's left panels, with re-reads of the parts that trip OCR in a whole row. */
export interface IAlphaStrikeScanRow {
    text: string;
    /** The row right of the damage panel's sideways DAMAGE label; read when the row has no "label:" in it. */
    cropped: string;
    /** The OV box at the row's left, clear of the heat scale beside it; read when the row has no "label:" in it. */
    ovBox: string;
}

export interface IAlphaStrikeScanReading {
    /** Title rows top to bottom: the model (or "(STANDARD)") then the chassis. */
    title: string[];
    pv: string;
    rows: IAlphaStrikeScanRow[];
    /** Each body row's pips. */
    pips: { white: number, red: number }[];
}

/** What a unit card says. Every field is text, as the player checks and edits it; empty is unread. */
export interface IAlphaStrikeScanResult {
    chassis: string;
    model: string;
    pv: string;
    type: string;
    size: string;
    tmm: string;
    move: string;
    role: string;
    short: string;
    medium: string;
    long: string;
    extreme: string;
    overheat: string;
    armor: string;
    structure: string;
    specials: string;
}

export type TAlphaStrikeScanField = keyof IAlphaStrikeScanResult;

export const alphaStrikeScanFields: { field: TAlphaStrikeScanField, label: string }[] = [
    { field: "chassis", label: "Name" },
    { field: "model", label: "Model" },
    { field: "pv", label: "PV" },
    { field: "type", label: "Type" },
    { field: "size", label: "Size" },
    { field: "tmm", label: "TMM" },
    { field: "move", label: "Move" },
    { field: "role", label: "Role" },
    { field: "short", label: "Short" },
    { field: "medium", label: "Medium" },
    { field: "long", label: "Long" },
    { field: "extreme", label: "Extreme" },
    { field: "overheat", label: "OV" },
    { field: "armor", label: "Armor" },
    { field: "structure", label: "Structure" },
    { field: "specials", label: "Special" },
];

/**
 * Armor and structure pips in a region: runs of white (armor) or red (structure) fill along a scanline, a dark
 * outline each side, about a circle's width across and as tall as wide. The most found on any one scanline counts.
 */
export const countAlphaStrikeScanPips = ( io: ICardScanIO, rect: ICardScanRect, cardWidth: number ): { white: number, red: number } => {
    const data = io.pixels( rect );
    const rv = { white: 0, red: 0 };
    const minWidth = Math.round( cardWidth * 0.008 ), maxWidth = Math.round( cardWidth * 0.04 );
    // Armor pips print white, but a photo's white can be as dim as the panel; what tells a pip from the panel is
    // its round outline, so any light fill counts.
    const kind = ( x: number, y: number ): "dark" | "white" | "red" | "other" => {
        const index = ( y * rect.width + x ) * 4;
        const r = data[index], g = data[index + 1], b = data[index + 2];
        if( Math.max( r, g, b ) < 90 ) return "dark";
        if( r > 140 && g < 90 && b < 90 ) return "red";
        if( Math.min( r, g, b ) > 150 && Math.max( r, g, b ) - Math.min( r, g, b ) < 50 ) return "white";
        return "other";
    }
    // From the middle of a fill run, the outline is about as far up and down as across.
    const round = ( x: number, y: number, width: number ): boolean => {
        let up = 0, down = 0;
        while( y - up - 1 >= 0 && kind( x, y - up - 1 ) !== "dark" ) up++;
        while( y + down + 1 < rect.height && kind( x, y + down + 1 ) !== "dark" ) down++;
        const tall = up + down + 1;
        return tall > width * 0.7 && tall < width * 1.4 && Math.abs( up - down ) < width * 0.3;
    }
    // Pips print side by side, a little more than a pip's width apart; fills further apart are something else.
    const chain = ( starts: number[], width: number ): number => {
        let longest = 0, run = 0;
        starts.forEach( ( start, index ) => {
            run = index > 0 && start - starts[index - 1] <= width * 2.5 ? run + 1 : 1;
            longest = Math.max( longest, run );
        } );
        return longest;
    }
    for( let y = 0; y < rect.height; y += 2 ) {
        const found = { white: [] as number[], red: [] as number[] };
        let widest = 0;
        let x = 0;
        while( x < rect.width ) {
            if( kind( x, y ) !== "dark" ) { x++; continue; }
            while( x < rect.width && kind( x, y ) === "dark" ) x++;
            // From the outline's inner edge to the next dark pixel.
            const start = x;
            const counts = { white: 0, red: 0, other: 0 };
            for( ; x < rect.width; x++ ) {
                const here = kind( x, y );
                if( here === "dark" ) break;
                counts[here]++;
            }
            const width = x - start;
            if( x >= rect.width || width < minWidth || width > maxWidth || !round( start + Math.floor( width / 2 ), y, width ) ) continue;
            widest = Math.max( widest, width );
            if( counts.white > width * 0.6 ) found.white.push( start );
            else if( counts.red > width * 0.6 ) found.red.push( start );
        }
        rv.white = Math.max( rv.white, chain( found.white, widest ) );
        rv.red = Math.max( rv.red, chain( found.red, widest ) );
    }
    return rv;
}

/**
 * The card within the photo. A unit card has a black border; a photo with a lighter background round it is cropped
 * to where the border starts, three lines across each side and the middle one taken. Where nothing light lies
 * outside the border (the card fills the frame, or sits on something dark), that side stays at the photo's edge.
 */
export const findAlphaStrikeCardBounds = ( io: ICardScanIO ): ICardScanRect => {
    const edge = ( line: ArrayLike<number>, length: number, fromEnd: boolean ): number => {
        const reach = Math.round( length * 0.15 );
        let run = 0, light = false;
        for( let step = 0; step < reach; step++ ) {
            const index = ( fromEnd ? length - 1 - step : step ) * 4;
            const dark = Math.max( line[index], line[index + 1], line[index + 2] ) < 90;
            if( !dark ) { light = true; run = 0; continue; }
            run++;
            if( run >= 6 ) return light ? step - 5 : 0;
        }
        return 0;
    }
    const middle = ( values: number[] ) => values.sort( ( a, b ) => a - b )[1];
    const rows = [ 0.3, 0.5, 0.7 ].map( ( share ) => io.pixels( { left: 0, top: Math.round( io.height * share ), width: io.width, height: 1 } ) );
    const columns = [ 0.3, 0.5, 0.7 ].map( ( share ) => io.pixels( { left: Math.round( io.width * share ), top: 0, width: 1, height: io.height } ) );
    const left = middle( rows.map( ( row ) => edge( row, io.width, false ) ) );
    const right = middle( rows.map( ( row ) => edge( row, io.width, true ) ) );
    const top = middle( columns.map( ( column ) => edge( column, io.height, false ) ) );
    const bottom = middle( columns.map( ( column ) => edge( column, io.height, true ) ) );
    return { left: left, top: top, width: io.width - left - right, height: io.height - top - bottom };
}

/** OCR of a unit card photo, row by row. */
export const readAlphaStrikeCard = async ( io: ICardScanIO ): Promise<IAlphaStrikeScanReading> => {
    const card = findAlphaStrikeCardBounds( io );
    const w = card.width, h = card.height;
    const box = ( left: number, top: number, width: number, height: number ): ICardScanRect => ( { left: card.left + Math.round( left * w ), top: card.top + Math.round( top * h ), width: Math.round( width * w ), height: Math.round( height * h ) } );
    const text = async ( rect: ICardScanRect, mode: TCardScanMode, scale: number, charset = "" ) => ( await io.recognize( rect, mode, scale, true, charset ) ).map( ( line ) => line.text ).join( " " ).trim();
    const minHeight = Math.round( h * 0.008 );

    const title: string[] = [];
    for( const row of cardScanRows( io, box( 0, 0, 0.62, 0.22 ), "colour", minHeight ) ) {
        // The chassis is in lettering so heavy it's thinned to read, and long names run on under the PV.
        if( row.height > h * 0.07 ) title.push( await text( { ...row, width: card.left + Math.round( w * 0.82 ) - row.left }, "heavy", 0.3 ) );
        else title.push( await text( row, "colour", 1 ) );
    }

    const rows: IAlphaStrikeScanRow[] = [];
    const pips: { white: number, red: number }[] = [];
    const body = box( 0.02, 0.2, 0.6, 0.67 );
    for( const row of cardScanRows( io, body, "ink", minHeight, Math.round( h * 0.05 ) ) ) {
        const read: IAlphaStrikeScanRow = { text: await text( row, "ink", 1 ), cropped: "", ovBox: "" };
        if( !read.text.includes( ":" ) ) {
            const damageLeft = card.left + Math.round( w * 0.06 );
            read.cropped = await text( { ...row, left: damageLeft, width: row.left + row.width - damageLeft }, "ink", 1 );
            read.ovBox = await text( { ...row, width: Math.round( w * 0.15 ) }, "ink", 1 );
        }
        rows.push( read );
        pips.push( countAlphaStrikeScanPips( io, row, w ) );
    }

    return {
        title: title,
        // Half size: at full size OCR misreads the big bold digits (a 50 as 20).
        pv: await text( box( 0.8, 0, 0.17, 0.11 ), "red", 0.5, "0123456789" ),
        rows: rows,
        pips: pips,
    };
}

/**
 * A title row in capitals, without the words OCR adds at its end from the art behind it: no capital or digit, or
 * a scrap of a letter or two with lower case. Titles print in capitals, so other lower case is a misread capital.
 */
const tidyTitle = ( line: string ): string => {
    const words = line.split( /\s+/ ).filter( ( word ) => word );
    const junk = ( word: string ) => !/[A-Z0-9]/.test( word ) || ( word.length <= 2 && /[a-z]/.test( word ) );
    while( words.length > 0 && junk( words[words.length - 1] ) ) words.pop();
    return words.join( " " ).toUpperCase();
}

/** The SPECIAL: label, which OCR often garbles at its start against the panel's texture. */
const specialLabel = ( word: string ): boolean => {
    const letters = word.replace( /[^A-Za-z]/g, "" ).toUpperCase();
    return letters.length >= 4 && editDistance( letters, "SPECIAL" ) <= 3 && /[:;.-]$/.test( word );
}

/** Card capitals to the MUL's case: whole words of letters are capitalised, codes like MAD-3R and IS stay. */
const titleCase = ( line: string ): string => line.replace( /[A-Z]{3,}/g, ( word, offset: number ) => {
    const before = line.charAt( offset - 1 ), after = line.charAt( offset + word.length );
    if( /[0-9-]/.test( before ) || /[0-9-]/.test( after ) ) return word;
    return word.charAt( 0 ) + word.slice( 1 ).toLowerCase();
} );

const parseMove = ( text: string ): string => {
    const moves: string[] = [];
    // OCR reads the "j after a move as %.
    for( const match of text.matchAll( /(\d+)\s*(?:["”“'’]{1,2}|%)([a-z]?)/g ) ) {
        // A printed j reads as i, too.
        const mode = match[0].includes( "%" ) && !match[2] ? "j" : match[2] === "i" ? "j" : match[2];
        moves.push( match[1] + "\"" + mode );
    }
    return moves.join( "/" );
}

const parseDamage = ( text: string ): string[] | null => {
    const words = text.split( /\s+/ ).filter( ( word ) => word && /[A-Za-z0-9*]/.test( word ) );
    // OCR reads a printed 0 as o, and the 4 of some printings as q.
    const values = words.map( ( word ) => word.replace( /^[oO]$/, "0" ).replace( /^[oO]\*$/, "0*" ).replace( /^q$/, "4" ) ).filter( ( word ) => /^(\d{1,2}|0\*)$/.test( word ) );
    if( values.length < 3 || values.length > 4 || values.length < words.length * 0.6 ) return null;
    return values;
}

/** The card's values from its OCR rows. */
export const parseAlphaStrikeScan = ( reading: IAlphaStrikeScanReading ): IAlphaStrikeScanResult => {
    const rv: IAlphaStrikeScanResult = {
        chassis: "", model: "", pv: "", type: "", size: "", tmm: "", move: "", role: "",
        short: "", medium: "", long: "", extreme: "", overheat: "", armor: "", structure: "", specials: "",
    };

    const title = reading.title.map( tidyTitle ).filter( ( line ) => line );
    if( title.length > 0 ) {
        rv.chassis = titleCase( title[title.length - 1] );
        const model = title.slice( 0, -1 ).join( " " );
        // A unit with no variant name prints "(STANDARD)".
        rv.model = /^\(?STANDARD\)?$/.test( model ) ? "" : titleCase( model );
    }
    rv.pv = ( reading.pv.match( /\d+/ ) || [ "" ] )[0];

    let damageDone = false, pipsFrom = 0;
    for( const [ index, row ] of reading.rows.entries() ) {
        const text = row.text;
        const size = text.match( /S[Z2zs]{1,2}\s*[:;.]?\s*\.?(\d)/ );
        if( size && !rv.size ) {
            rv.size = size[1];
            if( !damageDone ) pipsFrom = index + 1;
            const before = text.slice( 0, size.index );
            const types = asTypes.filter( ( type ) => before.includes( type ) );
            if( types.length > 0 ) rv.type = types.sort( ( a, b ) => before.lastIndexOf( b ) - before.lastIndexOf( a ) )[0];
            const tmm = text.slice( size.index ).match( /T[MVIN]{1,3}M?\s*[:;.]?\s*(\d)/ );
            if( tmm ) rv.tmm = tmm[1];
            const move = text.match( /M[Vv]\s*[:;.-]?\s*(.*)$/ );
            if( move ) rv.move = parseMove( move[1] );
            continue;
        }
        if( !rv.role && /SKILL|[O0]LE\s*:/.test( text ) ) {
            const role = ASMULRoles.find( ( role ) => role.Name !== "None" && text.toLowerCase().includes( role.Name.toLowerCase() ) );
            if( role ) rv.role = role.Name;
            continue;
        }
        const textWords = text.split( /\s+/ );
        const labelAt = textWords.slice( 0, 4 ).findIndex( specialLabel );
        if( labelAt >= 0 && !rv.specials ) {
            const words: string[] = [];
            // Abilities are split by commas, which OCR sometimes reads as full stops.
            // OCR spaces some numbers apart (REAR0* /-/-), and reads a 0 before a * as O.
            const list = textWords.slice( labelAt + 1 ).join( " " ).replace( /\s+\//g, "/" ).replace( /O(?=\*)/g, "0" );
            for( const entry of list.split( /[,.]/ ) ) {
                // An ability is two or more capitals, with numbers like 1/1/- after it; OCR's junk from the panel's
                // edge, and its reading of the dash a card prints for no abilities, aren't.
                const parts = entry.trim().split( /\s+/ );
                const kept: string[] = [];
                for( const part of parts ) {
                    const fits = kept.length === 0 ? /^[A-Z][A-Z0-9/\-*+#()]+$/.test( part ) : /^(\d{1,2}\*?|[\d\-*]{1,2}(\/[\d\-*]{1,2})+)$/.test( part );
                    if( !fits ) break;
                    kept.push( part );
                }
                if( kept.length > 0 ) words.push( kept.join( " " ).replace( /^([A-Z]{2,})(\d[\d/\-*]*)$/, "$1 $2" ) );
            }
            rv.specials = words.join( ", " );
            continue;
        }
        if( !damageDone ) {
            const damage = parseDamage( row.cropped ) || parseDamage( text );
            if( damage ) {
                [ rv.short, rv.medium, rv.long ] = damage;
                rv.extreme = damage[3] || "";
                damageDone = true;
                pipsFrom = index + 1;
                continue;
            }
        }
        if( !rv.overheat ) {
            const overheat = ( row.ovBox + " " + text ).match( /\bov\W{0,3}([0-9oO])/i );
            if( overheat ) rv.overheat = overheat[1].replace( /[oO]/, "0" );
        }
    }
    // Armor then structure, in the rows below the damage (or the stats, when the damage didn't read): white pips
    // above, art and heat boxes can look like pips.
    const below = reading.pips.slice( pipsFrom );
    const armorAt = below.reduce( ( most, pips, index ) => pips.white > below[most].white ? index : most, 0 );
    const armor = below.length > 0 ? below[armorAt].white : 0;
    const structure = below.slice( armorAt ).reduce( ( most, pips ) => Math.max( most, pips.red ), 0 );
    if( armor > 0 ) rv.armor = String( armor );
    if( structure > 0 ) rv.structure = String( structure );
    return rv;
}

export const scanAlphaStrikeCard = async ( io: ICardScanIO ): Promise<IAlphaStrikeScanResult> => parseAlphaStrikeScan( await readAlphaStrikeCard( io ) );

const damageValue = ( text: string ): number => parseInt( text, 10 ) || 0;

/** A MUL-shaped record of the card as read, for a unit the MUL doesn't list or a printing that differs from it. */
export const alphaStrikeScanRecord = ( scan: IAlphaStrikeScanResult, base: IASMULUnit | null = null ): IASMULUnit => {
    const role = ASMULRoles.find( ( role ) => role.Name === scan.role ) || ASMULRoles[0];
    const record: IASMULUnit = base ? JSON.parse( JSON.stringify( base ) ) : {
        FormatedTonnage: null, GroupName: null, BFThreshold: 0, BattleValue: 0, Class: "", Cost: 0, DateIntroduced: "",
        EraIcon: "", EraId: 0, EraStart: 0, Id: 0, ImageUrl: "", IsFeatured: false, IsPublished: false, RS: "", RSId: 0,
        Release: 0, Rules: "", Skill: 4, TRO: "", TROId: 0, Technology: { Id: 0, Name: "", Image: "", SortOrder: 0 },
        Tonnage: 0, Type: { Id: 0, Name: "", Image: "", SortOrder: 0 },
    } as unknown as IASMULUnit;
    record.Name = scan.chassis;
    record.Variant = scan.model || null;
    record.BFType = scan.type || null;
    record.BFSize = +scan.size || 0;
    record.BFTMM = +scan.tmm || 0;
    record.BFMove = scan.move;
    record.Role = role;
    record.BFDamageShort = damageValue( scan.short );
    record.BFDamageMedium = damageValue( scan.medium );
    record.BFDamageLong = damageValue( scan.long );
    record.BFDamageExtreme = damageValue( scan.extreme );
    record.BFDamageShortMin = scan.short === "0*";
    record.BFDamageMediumMin = scan.medium === "0*";
    record.BFDamageLongMin = scan.long === "0*";
    record.BFDamageExtremeMin = scan.extreme === "0*";
    record.BFOverheat = +scan.overheat || 0;
    record.BFArmor = +scan.armor || 0;
    record.BFStructure = +scan.structure || 0;
    record.BFAbilities = scan.specials;
    record.BFPointValue = +scan.pv || 0;
    // Read from a photo, so not the MUL's stats even when it started from them: its card says Not Official.
    record.MulSource = "custom";
    return record;
}

/** One value the card and the MUL record give differently. */
export interface IAlphaStrikeScanDifference {
    field: TAlphaStrikeScanField;
    label: string;
    card: string;
    mul: string;
}

export interface IAlphaStrikeScanMatch {
    /** matched: the MUL lists the card's unit and agrees with every value read. conflict: it lists the name, with
     * values that differ. unmatched: no MUL unit by that name. */
    status: "matched" | "conflict" | "unmatched";
    unit: IASMULUnit | null;
    differences: IAlphaStrikeScanDifference[];
}

const normal = ( text: string | null | undefined ): string => ( text || "" ).toUpperCase().replace( /[^A-Z0-9]/g, "" );
const normalModel = ( text: string | null | undefined ): string => normal( text ) === "STANDARD" ? "" : normal( text );
const normalMove = ( text: string ): string => text.replace( /[^0-9a-z/]/g, "" );
const normalSpecials = ( text: string | null ): string => ( text || "" ).split( "," ).map( normal ).filter( ( word ) => word ).sort().join( "," );
const mulDamage = ( value: number, minimal: boolean | undefined ): string => minimal ? "0*" : String( value || 0 );

/** The card's values against a MUL record's, for the values that were read. */
export const alphaStrikeScanDifferences = ( scan: IAlphaStrikeScanResult, unit: IASMULUnit ): IAlphaStrikeScanDifference[] => {
    const mul: Partial<Record<TAlphaStrikeScanField, string>> = {
        pv: String( unit.BFPointValue ),
        type: unit.BFType || "",
        size: String( unit.BFSize ),
        tmm: String( unit.BFTMM ),
        move: unit.BFMove,
        role: unit.Role ? unit.Role.Name : "",
        short: mulDamage( unit.BFDamageShort, unit.BFDamageShortMin ),
        medium: mulDamage( unit.BFDamageMedium, unit.BFDamageMediumMin ),
        long: mulDamage( unit.BFDamageLong, unit.BFDamageLongMin ),
        extreme: mulDamage( unit.BFDamageExtreme, unit.BFDamageExtremeMin ),
        overheat: String( unit.BFOverheat || 0 ),
        armor: String( unit.BFArmor ),
        structure: String( unit.BFStructure ),
        specials: unit.BFAbilities || "",
    };
    const rv: IAlphaStrikeScanDifference[] = [];
    for( const { field, label } of alphaStrikeScanFields ) {
        const theirs = mul[field];
        // Unread values aren't compared; a card prints no specials as a dash.
        if( theirs === undefined || ( !scan[field] && field !== "specials" ) ) continue;
        const same = field === "move" ? normalMove( scan.move ) === normalMove( theirs )
            : field === "specials" ? normalSpecials( scan.specials ) === normalSpecials( theirs )
            : field === "type" || field === "role" ? normal( scan[field] ) === normal( theirs )
            : scan[field] === theirs;
        if( !same ) rv.push( { field: field, label: label, card: scan[field], mul: theirs } );
    }
    return rv;
}

const editDistance = ( a: string, b: string ): number => {
    let previous = Array.from( { length: b.length + 1 }, ( _, index ) => index );
    for( let i = 1; i <= a.length; i++ ) {
        const current = [ i ];
        for( let j = 1; j <= b.length; j++ ) current.push( Math.min( previous[j] + 1, current[j - 1] + 1, previous[j - 1] + ( a[i - 1] === b[j - 1] ? 0 : 1 ) ) );
        previous = current;
    }
    return previous[b.length];
}

/** Whether the photo read as a unit card at all: a name and the stats line. */
export const isAlphaStrikeScanRead = ( scan: IAlphaStrikeScanResult ): boolean => normal( scan.chassis ).length >= 2 && ( !!scan.size || !!scan.type );

/**
 * The card on the MUL. A unit listed under the card's name and model is offered when its values agree, and shown
 * beside the card when they don't. OCR garbles some letters, so a name two letters off is treated the same way, and
 * a model further off counts when every value read agrees. Otherwise the card is unmatched: a custom, or a unit
 * the MUL doesn't list.
 */
export const matchAlphaStrikeScan = ( scan: IAlphaStrikeScanResult, units: IASMULUnit[] ): IAlphaStrikeScanMatch => {
    const unmatched: IAlphaStrikeScanMatch = { status: "unmatched", unit: null, differences: [] };
    if( !isAlphaStrikeScanRead( scan ) ) return unmatched;
    const chassis = normal( scan.chassis ), model = normalModel( scan.model );
    const best = ( candidates: IASMULUnit[] ) => candidates
        .map( ( unit ) => ( { unit: unit, differences: alphaStrikeScanDifferences( scan, unit ) } ) )
        .sort( ( a, b ) => a.differences.length - b.differences.length )[0];
    const offer = ( found: { unit: IASMULUnit, differences: IAlphaStrikeScanDifference[] } ): IAlphaStrikeScanMatch =>
        ( { status: found.differences.length === 0 ? "matched" : "conflict", unit: found.unit, differences: found.differences } );

    const named = best( units.filter( ( unit ) => normal( unit.Name ) === chassis && normalModel( unit.Variant ) === model ) );
    if( named ) return offer( named );

    // The nearest name first; of those as near, the one that agrees most.
    const wanted = chassis + model;
    const distances = units.map( ( unit ) => {
        const name = normal( unit.Name ) + normalModel( unit.Variant );
        return Math.abs( name.length - wanted.length ) <= 2 ? editDistance( name, wanted ) : Infinity;
    } );
    const nearest = distances.reduce( ( least, distance ) => Math.min( least, distance ), Infinity );
    if( nearest <= 2 ) return offer( best( units.filter( ( _, index ) => distances[index] === nearest ) ) );

    const sameChassis = best( units.filter( ( unit ) => editDistance( normal( unit.Name ), chassis ) <= 1 && editDistance( normalModel( unit.Variant ), model ) <= 3 ) );
    if( sameChassis && sameChassis.differences.length === 0 ) return offer( sameChassis );
    return unmatched;
}
