import { describe, expect, it } from "vitest";
import {
    alphaStrikeScanDifferences, alphaStrikeScanRecord, countAlphaStrikeScanPips, findAlphaStrikeCardBounds, IAlphaStrikeScanReading,
    IAlphaStrikeScanResult, isAlphaStrikeScanRead, matchAlphaStrikeScan, parseAlphaStrikeScan,
} from "./alpha-strike-card-scan";
import { IASMULUnit } from "./alpha-strike-unit";
import { ICardScanIO, ICardScanRect } from "./card-scan-io";

// Reading fixtures are real tesseract output from photos of printed unit cards.

const row = ( text: string, cropped = "", ovBox = "" ) => ( { text, cropped, ovBox } );

/** Pips per row: none, but for the rows given. */
const pipsAt = ( count: number, rows: Record<number, { white: number, red: number }> = {} ) => Array.from( { length: count }, ( _, index ) => rows[index] || { white: 0, red: 0 } );

const thug: IAlphaStrikeScanReading = {
    title: [ "THG-10E oo", "THUG" ], pv: "39",
    rows: [
        row( "BE = i ~~", "[UREA ee ~", "FE —" ),
        row( "BM SZ:4 TMM:1 MV:8”" ),
        row( "Z10LE: Brawler SKILL:" ),
        row( "JT ee Sad ~", "TT Co am cirri erm mer ~", "rs te ne" ),
        row( "g 3 3 2", "3 3 2", "$s 3" ),
        row( "VALINE HEAT SCALE BiNE c J ‘ON", "VUE HEAT SCALE SINE c J oN", "ov:1 1" ),
        row( "‘A-O0000000 |B", ": 00000000 |B", "‘A: O00!" ),
        row( "5: 000000@ y |" ),
        row( "3 /IPECIAL: SRM1/1 EB" ),
    ],
    // A white pip in the stats row above the damage, as art can make, is not armor.
    pips: pipsAt( 9, { 1: { white: 1, red: 0 }, 6: { white: 8, red: 0 }, 7: { white: 0, red: 6 } } ),
};

const firestarter: IAlphaStrikeScanReading = {
    title: [ "Fsg-H", "FIRESTARTER i" ], pv: "19",
    rows: [
        row( "TBM SZ:1 TMM:2  MVi12ti" ),
        row( "S1JLE:Scout SKILL: |" ),
        row( "EB 2 1 0", "2 1 0 ;", "8 2" ),
        row( "ov:0 EENEVTE (1 EEE: |" ),
        row( "A:O00 | |" ),
        row( "A HPECIAL: HT1/-/-, REARO* /-/- Bo" ),
    ],
    pips: pipsAt( 6, { 4: { white: 3, red: 0 }, 5: { white: 0, red: 3 } } ),
};

const quickdraw: IAlphaStrikeScanReading = {
    title: [ "QKD-46G", "OUICKDRAW  :~ +" ], pv: "30",
    rows: [
        row( "TBM SZ:3 TMM:2 MV:10”i" ),
        row( "L=~1JLE: Skirmisher SKILL:" ),
        row( "& 2 3 1", "{ 2 3 1", "| & 2" ),
        row( "", "V: 0 (1 Ee |", "ovo |" ),
        row( "SPECIAL: IF1, REAR1/1/- BE" ),
    ],
    pips: pipsAt( 5 ),
};

/** The back of a support card. */
const notAUnit: IAlphaStrikeScanReading = {
    title: [ "", "", "" ], pv: "",
    rows: [ row( "B50 PTE ho ARR ARR at" ), row( "A - v ‘8", "NN ~" ), row( "EES Ek WI FER 0 0§E", "wos de wf ¥rEm BE 0", "JS" ) ],
    pips: pipsAt( 3, { 2: { white: 0, red: 1 } } ),
};

const mul = ( extra: Partial<IASMULUnit> ): IASMULUnit => ( {
    Name: "", Variant: "", BFType: "BM", BFSize: 0, BFTMM: 0, BFMove: "", Role: { Id: 0, Name: "None", Image: "", SortOrder: 0 },
    BFDamageShort: 0, BFDamageMedium: 0, BFDamageLong: 0, BFDamageExtreme: 0, BFOverheat: 0, BFArmor: 0, BFStructure: 0,
    BFAbilities: "", BFPointValue: 0, ...extra,
} as unknown as IASMULUnit );

const role = ( name: string ) => ( { Id: 0, Name: name, Image: "", SortOrder: 0 } );

const thugMUL = mul( { Name: "Thug", Variant: "THG-10E", BFSize: 4, BFTMM: 1, BFMove: "8\"", Role: role( "Brawler" ), BFDamageShort: 3, BFDamageMedium: 3, BFDamageLong: 2, BFOverheat: 1, BFArmor: 8, BFStructure: 6, BFAbilities: "SRM 1/1", BFPointValue: 39 } );
const firestarterH = mul( { Name: "Firestarter", Variant: "FS9-H", BFSize: 1, BFTMM: 2, BFMove: "12\"j", Role: role( "Scout" ), BFDamageShort: 2, BFDamageMedium: 1, BFArmor: 3, BFStructure: 3, BFAbilities: "HT 1/-/-,REAR 0*/-/-", BFPointValue: 20 } );
const firestarterK = mul( { ...firestarterH, Variant: "FS9-K", BFAbilities: "ENE,REAR 0*/-/-" } );

describe( "Alpha Strike card scan: parsing", () => {
    it( "reads every value of a Thug", () => {
        expect( parseAlphaStrikeScan( thug ) ).toEqual( {
            chassis: "Thug", model: "THG-10E", pv: "39", type: "BM", size: "4", tmm: "1", move: "8\"", role: "Brawler",
            short: "3", medium: "3", long: "2", extreme: "", overheat: "1", armor: "8", structure: "6", specials: "SRM 1/1",
        } );
    } );

    it( "mends a spaced-apart special and an O for 0", () => {
        const scan = parseAlphaStrikeScan( firestarter );
        expect( scan.specials ).toBe( "HT 1/-/-, REAR 0*/-/-" );
        expect( [ scan.short, scan.medium, scan.long, scan.overheat ] ).toEqual( [ "2", "1", "0", "0" ] );
    } );

    it( "reads a jump move that OCR printed as i", () => {
        const scan = parseAlphaStrikeScan( quickdraw );
        expect( scan.move ).toBe( "10\"j" );
        expect( scan.role ).toBe( "Skirmisher" );
        expect( scan.specials ).toBe( "IF 1, REAR 1/1/-" );
        expect( scan.overheat ).toBe( "0" );
    } );

    it( "reads a 4 that OCR printed as q in the damage row", () => {
        const scan = parseAlphaStrikeScan( { ...thug, rows: [ row( "BM SZ:3 TMM:2 MV:10\"j" ), row( "3 q 3", "3 q 3" ) ] } );
        expect( [ scan.short, scan.medium, scan.long ] ).toEqual( [ "3", "4", "3" ] );
    } );

    it( "reads the dash a card prints for no specials as none", () => {
        expect( parseAlphaStrikeScan( { ...thug, rows: [ row( "BM SZ:4 TMM:1 MV:8”" ), row( "PECIAL: I" ) ] } ).specials ).toBe( "" );
    } );

    it( "takes (STANDARD) as no model", () => {
        expect( parseAlphaStrikeScan( { ...thug, title: [ "(STANDARD)", "LOCUST" ] } ).model ).toBe( "" );
    } );

    it( "doesn't take a card back as a unit card", () => {
        expect( isAlphaStrikeScanRead( parseAlphaStrikeScan( notAUnit ) ) ).toBe( false );
        expect( isAlphaStrikeScanRead( parseAlphaStrikeScan( thug ) ) ).toBe( true );
    } );
} );

describe( "Alpha Strike card scan: the MUL", () => {
    it( "offers the MUL unit when every value agrees", () => {
        const match = matchAlphaStrikeScan( parseAlphaStrikeScan( thug ), [ firestarterH, thugMUL ] );
        expect( match.status ).toBe( "matched" );
        expect( match.unit ).toBe( thugMUL );
    } );

    it( "shows a printing that differs from the MUL as a conflict", () => {
        const match = matchAlphaStrikeScan( parseAlphaStrikeScan( { ...thug, pv: "41" } ), [ thugMUL ] );
        expect( match.status ).toBe( "conflict" );
        expect( match.differences ).toEqual( [ { field: "pv", label: "PV", card: "41", mul: "39" } ] );
    } );

    it( "takes the nearest model when OCR garbles a letter", () => {
        // FSG-H is one letter from FS9-H and two from FS9-K.
        const match = matchAlphaStrikeScan( parseAlphaStrikeScan( firestarter ), [ firestarterK, firestarterH ] );
        expect( match.unit ).toBe( firestarterH );
        // Its move (MVi12ti) didn't read, so only the PV is compared and differs.
        expect( match.differences.map( ( difference ) => difference.field ) ).toEqual( [ "pv" ] );
    } );

    it( "leaves a unit the MUL doesn't list unmatched", () => {
        const scan = parseAlphaStrikeScan( { ...thug, title: [ "DRG-9D", "DRAGON FIRE" ] } );
        expect( matchAlphaStrikeScan( scan, [ thugMUL, firestarterH ] ).status ).toBe( "unmatched" );
        expect( matchAlphaStrikeScan( parseAlphaStrikeScan( notAUnit ), [ thugMUL ] ).status ).toBe( "unmatched" );
    } );

    it( "doesn't compare values that weren't read, but always compares specials", () => {
        const scan: IAlphaStrikeScanResult = { ...parseAlphaStrikeScan( thug ), pv: "", armor: "", specials: "" };
        expect( alphaStrikeScanDifferences( scan, thugMUL ) ).toEqual( [ { field: "specials", label: "Special", card: "", mul: "SRM 1/1" } ] );
    } );

    it( "makes a record of the card as printed, on the MUL's or alone", () => {
        const scan = { ...parseAlphaStrikeScan( thug ), pv: "41", short: "0*" };
        const printed = alphaStrikeScanRecord( scan, thugMUL );
        expect( printed.BFPointValue ).toBe( 41 );
        expect( printed.BFDamageShort ).toBe( 0 );
        expect( printed.BFDamageShortMin ).toBe( true );
        expect( printed.Role.Name ).toBe( "Brawler" );
        expect( thugMUL.BFPointValue ).toBe( 39 );
        const alone = alphaStrikeScanRecord( { ...scan, model: "" } );
        expect( alone.Name ).toBe( "Thug" );
        expect( alone.Variant ).toBeNull();
        expect( alone.BFAbilities ).toBe( "SRM 1/1" );
        expect( alone.BFArmor ).toBe( 8 );
    } );
} );

/** A fake photo: a background colour, with rectangles painted over it. */
const photo = ( width: number, height: number, background: number[], paint: { rect: ICardScanRect, rgb: number[] }[] ): ICardScanIO => {
    const colourAt = ( x: number, y: number ) => {
        for( let index = paint.length - 1; index >= 0; index-- ) {
            const { rect, rgb } = paint[index];
            if( x >= rect.left && x < rect.left + rect.width && y >= rect.top && y < rect.top + rect.height ) return rgb;
        }
        return background;
    }
    const pixels = ( rect: ICardScanRect ) => {
        const rv: number[] = [];
        for( let y = rect.top; y < rect.top + rect.height; y++ ) for( let x = rect.left; x < rect.left + rect.width; x++ ) rv.push( ...colourAt( x, y ), 255 );
        return rv;
    }
    return { width, height, pixels, recognize: async () => [], colours: () => ( { red: 0, yellow: 0, blue: 0, green: 0 } ) };
}

const black = [ 20, 20, 20 ], white = [ 240, 240, 240 ], red = [ 200, 30, 30 ], grey = [ 128, 128, 128 ];

describe( "Alpha Strike card scan: pixels", () => {
    it( "finds a card's black border on a lighter background", () => {
        const io = photo( 200, 300, white, [ { rect: { left: 10, top: 20, width: 175, height: 265 }, rgb: black }, { rect: { left: 20, top: 30, width: 155, height: 245 }, rgb: grey } ] );
        expect( findAlphaStrikeCardBounds( io ) ).toEqual( { left: 10, top: 20, width: 175, height: 265 } );
    } );

    it( "keeps the photo's edge where the card fills the frame", () => {
        const io = photo( 200, 300, black, [ { rect: { left: 10, top: 10, width: 180, height: 280 }, rgb: grey } ] );
        expect( findAlphaStrikeCardBounds( io ) ).toEqual( { left: 0, top: 0, width: 200, height: 300 } );
    } );

    it( "counts round white and red pips, not long bars", () => {
        // Pips 16 px across in a 1000 px card: three white, two red, and a white bar that's too wide.
        const pip = ( left: number, rgb: number[] ) => [ { rect: { left: left, top: 10, width: 20, height: 20 }, rgb: black }, { rect: { left: left + 2, top: 12, width: 16, height: 16 }, rgb: rgb } ];
        const paint = [ ...pip( 10, white ), ...pip( 40, white ), ...pip( 70, white ), ...pip( 100, red ), ...pip( 130, red ),
            { rect: { left: 160, top: 10, width: 80, height: 20 }, rgb: black }, { rect: { left: 162, top: 12, width: 76, height: 16 }, rgb: white } ];
        const io = photo( 260, 40, grey, paint );
        expect( countAlphaStrikeScanPips( io, { left: 0, top: 0, width: 260, height: 40 }, 1000 ) ).toEqual( { white: 3, red: 2 } );
    } );

    it( "doesn't count round fills far apart as a row of pips", () => {
        const pip = ( left: number ) => [ { rect: { left: left, top: 10, width: 20, height: 20 }, rgb: black }, { rect: { left: left + 2, top: 12, width: 16, height: 16 }, rgb: white } ];
        const io = photo( 400, 40, grey, [ ...pip( 10 ), ...pip( 150 ), ...pip( 300 ) ] );
        expect( countAlphaStrikeScanPips( io, { left: 0, top: 0, width: 400, height: 40 }, 1000 ) ).toEqual( { white: 1, red: 0 } );
    } );
} );
