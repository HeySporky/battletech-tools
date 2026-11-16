import { describe, expect, it } from "vitest";
import { newAcesEdgeCard } from "../data/aces-cards";
import {
    acesEdgeCardScanOptions,
    acesEdgePanelRows,
    acesEdgePhaseOf,
    acesEdgeSlashAt,
    acesEdgeTriggerOf,
    applyAcesEdgeScan,
    IAcesEdgeScanResult,
    joinAcesEdgeRows,
    parseAcesEdgeCardNumber,
    parseAcesEdgeCategory,
    parseAcesEdgeCost,
    placeAcesEdgeSlash,
    scanAcesEdgeCard,
    splitAcesEdgeCondition,
    voteAcesEdgeWords,
} from "./aces-edge-card-scan";
import { ICardScanColours, ICardScanIO, ICardScanLine, ICardScanRect, TCardScanMode } from "./card-scan-io";

// Synthetic cards: every sentence below is made up for the tests (teapots, kites, umbrellas), laid out the way an
// Edge card prints: art at the top, the name and category on a dark band, a light panel with a bold condition ending
// in ":" and the card text, and the card number at the bottom left.

describe( "Edge card fields", () => {
    it( "reads the cost from the first Spend N Edge", () => {
        expect( parseAcesEdgeCost( "Spend 2 Edge to paint a kite. This costs 3 Edge on Sundays." ) ).toBe( 2 );
        expect( parseAcesEdgeCost( "Spend up to 3 Edge to pour that many teapots." ) ).toBe( 3 );
        expect( parseAcesEdgeCost( "Spend l Edge to fly a kite." ) ).toBe( 1 );
        expect( parseAcesEdgeCost( "Pour the tea." ) ).toBeNull();
    } );

    it( "splits the condition off at its colon", () => {
        expect( splitAcesEdgeCondition( "When flying a kite: Spend 1 Edge to fly it higher." ) )
            .toEqual( { condition: "When flying a kite:", text: "Spend 1 Edge to fly it higher." } );
        expect( splitAcesEdgeCondition( "When pouring tea (including green tea): Spend 1 Edge." ) )
            .toEqual( { condition: "When pouring tea (including green tea):", text: "Spend 1 Edge." } );
        // No colon: no condition can be told apart, so all of it is the text.
        expect( splitAcesEdgeCondition( "Spend 1 Edge to fly a kite." ) ).toEqual( { condition: "", text: "Spend 1 Edge to fly a kite." } );
    } );

    it( "reads the card number, with the slash misread", () => {
        expect( parseAcesEdgeCardNumber( "A 7/12 BATTLETECH ACES" ) ).toBe( "7/12" );
        expect( parseAcesEdgeCardNumber( "4 11 /12 BATTLETECH" ) ).toBe( "11/12" );
        expect( parseAcesEdgeCardNumber( "A 3112 BATTLETECH" ) ).toBe( "3/12" );
        // The icon before the number read as a digit.
        expect( parseAcesEdgeCardNumber( "42/12" ) ).toBe( "2/12" );
        expect( parseAcesEdgeCardNumber( "411/12" ) ).toBe( "11/12" );
        expect( parseAcesEdgeCardNumber( "7 A312" ) ).toBe( "3/12" );
        // No slash read at all.
        expect( parseAcesEdgeCardNumber( "7 A 412" ) ).toBe( "4/12" );
        expect( parseAcesEdgeCardNumber( "BATTLETECH ACES" ) ).toBe( "" );
        expect( parseAcesEdgeCardNumber( "©2025 The Company" ) ).toBe( "" );
    } );

    it( "finds the slash among the number's glyphs and mends a read that lost it", () => {
        // Light print on a dark footer: "#" grey-white, "g" green (the icon), anything else dark.
        const light = ( rows: string[] ) => {
            const pixels: number[] = [];
            for( const line of rows ) for( const char of line ) pixels.push( ...( char === "#" ? [ 220, 220, 220, 255 ] : char === "g" ? [ 60, 200, 40, 255 ] : [ 20, 20, 20, 255 ] ) );
            return { pixels, width: rows[0].length, height: rows.length };
        };
        // g, 1, 1, /, 1, 7: the 7 leans like the slash but its top row is as wide as itself.
        const number = light( [
            "..................................",
            ".g....#...#.......#...#...#####...",
            ".g....#...#......#....#.......#...",
            "ggg...#...#......#....#......#....",
            "ggg...#...#.....#.....#......#....",
            "ggg...#...#....#......#.....#.....",
            "ggg...#...#....#......#.....#.....",
            "ggg...#...#...#.......#....#......",
            "ggg...#...#..#........#....#......",
            "..................................",
        ] );
        const at = acesEdgeSlashAt( number.pixels, number.width, number.height );
        expect( at ).toEqual( { glyphs: 5, slash: 2, feet: [ false, false, false, false, false ] } );
        expect( placeAcesEdgeSlash( "A 11117", at! ) ).toBe( "11/17" );
        expect( placeAcesEdgeSlash( "/1117", at! ) ).toBe( "11/17" );
        expect( placeAcesEdgeSlash( "17", at! ) ).toBe( "" );
        // A glyph for glyph read only stands when the slash read as a stroke (a 1 or a 7): a 6 there means the
        // slash was lost and an icon read as a digit before the number.
        expect( placeAcesEdgeSlash( "11717", at! ) ).toBe( "11/17" );
        expect( placeAcesEdgeSlash( "7612", { glyphs: 4, slash: 1 } ) ).toBe( "" );
        expect( placeAcesEdgeSlash( "612", { glyphs: 4, slash: 1 } ) ).toBe( "6/12" );
        // 7, /, 1, 2: the 2 has a foot, so a 7 read there is a 2; the first 7 stays.
        const seven = light( [
            "...........................",
            "...#####......#...#...####.",
            ".......#.....#....#......#.",
            "......#.....#.....#......#.",
            "......#.....#.....#.....#..",
            ".....#.....#......#....#...",
            ".....#.....#......#...#....",
            "....#.....#.......#...####.",
            "...........................",
        ] );
        const sevenAt = acesEdgeSlashAt( seven.pixels, seven.width, seven.height );
        expect( sevenAt ).toEqual( { glyphs: 4, slash: 1, feet: [ false, false, false, true ] } );
        expect( placeAcesEdgeSlash( "7117", sevenAt! ) ).toBe( "7/12" );
        expect( placeAcesEdgeSlash( "717", sevenAt! ) ).toBe( "7/12" );
        // No glyph leans and stays narrow: no slash.
        const plain = light( [ "........", ".#..#...", ".#..#...", ".#..#...", ".#..#...", "........" ] );
        expect( acesEdgeSlashAt( plain.pixels, plain.width, plain.height ) ).toBeNull();
    } );

    it( "keeps a unit type limit with the category", () => {
        expect( parseAcesEdgeCategory( "KITES" ) ).toBe( "KITES" );
        expect( parseAcesEdgeCategory( "TEA PARTY BM / CV ONLY" ) ).toBe( "TEA PARTY, BM / CV ONLY" );
        expect( parseAcesEdgeCategory( "KITES BM ONLY" ) ).toBe( "KITES, BM ONLY" );
        expect( parseAcesEdgeCategory( "KITES — BM/CV ONLY." ) ).toBe( "KITES, BM / CV ONLY" );
        // A code one character off snaps to the commonest unit type it could be.
        expect( parseAcesEdgeCategory( "KITES 5M / GV ONLY" ) ).toBe( "KITES, BM / CV ONLY" );
        expect( parseAcesEdgeCategory( "KITES AND TEA" ) ).toBe( "KITES AND TEA" );
    } );

    it( "gives the phase from the condition, then the category, then the text", () => {
        expect( acesEdgePhaseOf( "KITES", "During the End Phase:", "" ) ).toBe( "end" );
        expect( acesEdgePhaseOf( "KITES", "At the start of the Initiative Phase:", "" ) ).toBe( "initiative" );
        expect( acesEdgePhaseOf( "KITES", "When attacking a teapot, if you used kite movement:", "" ) ).toBe( "combat" );
        expect( acesEdgePhaseOf( "KITES", "When using kite movement:", "" ) ).toBe( "movement" );
        expect( acesEdgePhaseOf( "MOVEMENT", "When a kite lands:", "" ) ).toBe( "movement" );
        expect( acesEdgePhaseOf( "MELEE", "When a kite lands:", "" ) ).toBe( "combat" );
        expect( acesEdgePhaseOf( "KITES", "When a kite lands:", "Spend 1 Edge to fly again this Movement Phase." ) ).toBe( "movement" );
        expect( acesEdgePhaseOf( "KITES", "When a kite lands:", "Spend 1 Edge to fly again." ) ).toBe( "any" );
    } );

    it( "gives the trigger from the condition's words", () => {
        expect( acesEdgeTriggerOf( "When a kite swoops on a teapot from the rear:" ) ).toBe( "enemy-rear" );
        expect( acesEdgeTriggerOf( "When a teapot suffers a critical hit:" ) ).toBe( "critical-hit" );
        expect( acesEdgeTriggerOf( "When you take damage from a falling kite:" ) ).toBe( "damaged" );
        expect( acesEdgeTriggerOf( "When a friendly teapot takes damage:" ) ).toBe( "damaged" );
        expect( acesEdgeTriggerOf( "When you are attacked by a kite:" ) ).toBe( "attacked" );
        expect( acesEdgeTriggerOf( "After rolling for an attack, if you used kite movement:" ) ).toBe( "attacking" );
        expect( acesEdgeTriggerOf( "When using kite movement:" ) ).toBe( "moving" );
        expect( acesEdgeTriggerOf( "At the start of the Combat Phase:" ) ).toBe( "none" );
        expect( acesEdgeTriggerOf( "When pouring tea:" ) ).toBe( "other" );
        expect( acesEdgeTriggerOf( "" ) ).toBe( "none" );
    } );

    it( "votes word by word among reads of one line", () => {
        expect( voteAcesEdgeWords( [ "TEAPOOT KITE", "TEAPOT KITE", "TEAPOT KIITE" ] ) ).toBe( "TEAPOT KITE" );
        // Ties go to the first read; a read with another word count doesn't vote.
        expect( voteAcesEdgeWords( [ "TEAPOT", "TEAPOOT" ] ) ).toBe( "TEAPOT" );
        expect( voteAcesEdgeWords( [ "TEAPOOT KITE", "TEA POT KITE", "TEAPOT KITE" ] ) ).toBe( "TEAPOOT KITE" );
        expect( voteAcesEdgeWords( [ "", "TEAPOT" ] ) ).toBe( "TEAPOT" );
        expect( voteAcesEdgeWords( [ "", "" ] ) ).toBe( "" );
    } );

    it( "joins the panel rows, mending a line broken at a hyphen", () => {
        expect( joinAcesEdgeRows( [ "When pouring self-", "made tea: Spend 1", "Edge to pour twice ." ] ) ).toBe( "When pouring self-made tea: Spend 1 Edge to pour twice." );
        // The "to" of the cards' "Spend N Edge to" formula read as "10".
        expect( joinAcesEdgeRows( [ "Spend 1 Edge 10 fly a kite.", "Fold 10 kites." ] ) ).toBe( "Spend 1 Edge to fly a kite. Fold 10 kites." );
        // The inch mark stays as read: the card prints a curly quote.
        expect( joinAcesEdgeRows( [ "A kite within 2” of", "a teapot ( or two )." ] ) ).toBe( "A kite within 2” of a teapot (or two)." );
    } );
} );

describe( "Edge card panel rows", () => {
    const word = ( text: string, x0: number, y0: number, x1: number, y1: number ) => ( { text, bbox: { x0, y0, x1, y1 } } );
    const line = ( ...words: ReturnType<typeof word>[] ): ICardScanLine => ( {
        text: words.map( ( entry ) => entry.text ).join( " " ), words,
        bbox: { x0: Math.min( ...words.map( ( entry ) => entry.bbox.x0 ) ), y0: Math.min( ...words.map( ( entry ) => entry.bbox.y0 ) ), x1: Math.max( ...words.map( ( entry ) => entry.bbox.x1 ) ), y1: Math.max( ...words.map( ( entry ) => entry.bbox.y1 ) ) },
    } );
    const box: ICardScanRect = { left: 100, top: 100, width: 1000, height: 800 };

    it( "drops the panel's edges, flat marks and texture under the text", () => {
        const rows = acesEdgePanelRows( [
            line( word( "I", 120, 105, 700, 120 ) ),
            // A single letter far wider than it is tall is a rule, not a letter, even when it stands as tall as the text.
            line( word( "I", 130, 120, 330, 165 ) ),
            line( word( "Kites", 150, 150, 300, 210 ), word( "fly", 320, 150, 400, 210 ), word( "i", 1080, 140, 1090, 210 ) ),
            line( word( "high.", 150, 230, 300, 290 ), word( ":", 1085, 230, 1095, 290 ) ),
            line( word( "ni", 600, 800, 640, 815 ), word( "faci", 650, 790, 700, 850 ) ),
        ], box );
        expect( rows.map( ( row ) => row.text ) ).toEqual( [ "Kites fly", "high." ] );
    } );
} );

/* ----- whole scans on a fake photo ----- */

const width = 1500, height = 2000;
const charWidth = 15, lineHeight = 30;
const noColour: ICardScanColours = { red: 0, yellow: 0, blue: 0, green: 0 };

interface IPlaced { text: string, x: number, y: number, modes?: TCardScanMode[], tall?: number }

const placedLine = ( placed: IPlaced ): ICardScanLine => {
    let x = placed.x;
    const tall = placed.tall || lineHeight;
    const words = placed.text.split( " " ).map( ( word ) => {
        const rv = { text: word, bbox: { x0: x, y0: placed.y, x1: x + word.length * charWidth, y1: placed.y + tall } };
        x = rv.bbox.x1 + charWidth;
        return rv;
    } );
    return { text: placed.text, bbox: { x0: placed.x, y0: placed.y, x1: words[words.length - 1].bbox.x1, y1: placed.y + tall }, words: words };
}

const inside = ( x: number, y: number, rect: ICardScanRect ) => x >= rect.left && x < rect.left + rect.width && y >= rect.top && y < rect.top + rect.height;

// The light text panel on a dark card, with the dark name band above it and brighter art above that.
const panel: ICardScanRect = { left: 200, top: 1100, width: 1100, height: 520 };
const art: ICardScanRect = { left: 200, top: 200, width: 1100, height: 650 };

const fakePhoto = ( lines: IPlaced[], panels = true ): ICardScanIO => ( {
    width, height,
    recognize: async ( rect, mode ) => lines.filter( ( placed ) => {
        if( placed.modes && !placed.modes.includes( mode ) ) return false;
        const line = placedLine( placed );
        return inside( ( line.bbox.x0 + line.bbox.x1 ) / 2, ( line.bbox.y0 + line.bbox.y1 ) / 2, rect );
    } ).map( placedLine ),
    colours: () => ( { ...noColour } ),
    pixels: ( rect ) => {
        const rv = new Uint8ClampedArray( rect.width * rect.height * 4 );
        for( let y = 0; y < rect.height; y++ ) for( let x = 0; x < rect.width; x++ ) {
            const px = rect.left + x, py = rect.top + y;
            const level = panels && inside( px, py, panel ) ? 230 : inside( px, py, art ) ? 120 : 20;
            const index = ( y * rect.width + x ) * 4;
            rv[index] = rv[index + 1] = rv[index + 2] = level;
            rv[index + 3] = 255;
        }
        return rv;
    },
} );

const cardLines: IPlaced[] = [
    { text: "TEAPOT", x: 260, y: 900, tall: 60, modes: [ "bright", "dim", "plain" ] },
    { text: "KITES BM / CV ONLY", x: 260, y: 1000, modes: [ "bright", "dim", "plain" ] },
    { text: "When pouring tea for a", x: 260, y: 1140, modes: [ "panel", "plain" ] },
    { text: "kite: Spend 2 Edge to", x: 260, y: 1190, modes: [ "panel", "plain" ] },
    { text: "pour this Movement Phase.", x: 260, y: 1240, modes: [ "panel", "plain" ] },
    { text: "A 7/12 BATTLETECH ACES", x: 230, y: 1700, modes: [ "bright", "dim", "plain" ] },
];

describe( "Edge card scan", () => {
    it( "reads the band, the panel and the footer of a fake photo", async () => {
        const result = await scanAcesEdgeCard( fakePhoto( cardLines ) );
        expect( result.found ).toBe( true );
        expect( result.name ).toBe( "TEAPOT" );
        expect( result.category ).toBe( "KITES, BM / CV ONLY" );
        expect( result.cardNumber ).toBe( "7/12" );
        expect( result.condition ).toBe( "When pouring tea for a kite:" );
        expect( result.text ).toBe( "Spend 2 Edge to pour this Movement Phase." );
        expect( result.cost ).toBe( 2 );
        expect( result.phase ).toBe( "movement" );
        expect( result.trigger ).toBe( "other" );
        expect( acesEdgeCardScanOptions.shape ).toBe( "portrait" );
        expect( acesEdgeCardScanOptions.found( result ) ).toBe( true );
    } );

    it( "turns down a behavior card", async () => {
        const result = await scanAcesEdgeCard( fakePhoto( [
            { text: "AGGRESSIVE BALANCED CAUTIOUS", x: 260, y: 1150, modes: [ "plain", "panel" ] },
            { text: "1. nearest teapot", x: 260, y: 1200, modes: [ "plain", "panel" ] },
        ] ) );
        expect( result.found ).toBe( false );
        expect( result.warnings ).toHaveLength( 1 );
        expect( result.warnings[0] ).toMatch( /behavior card/ );
        expect( result.name ).toBe( "" );
    } );

    it( "turns down a card whose panel never mentions Edge", async () => {
        const result = await scanAcesEdgeCard( fakePhoto( [
            { text: "TEAPOT", x: 260, y: 900, tall: 60, modes: [ "bright", "plain" ] },
            { text: "Pour the tea for a kite.", x: 260, y: 1140, modes: [ "panel", "plain" ] },
        ] ) );
        expect( result.found ).toBe( false );
        expect( result.warnings[0] ).toMatch( /Edge card/ );
    } );

    it( "turns down a photo with no light panel", async () => {
        const result = await scanAcesEdgeCard( fakePhoto( cardLines, false ) );
        expect( result.found ).toBe( false );
        expect( result.text ).toBe( "" );
    } );
} );

describe( "Applying an Edge card scan", () => {
    const scan = ( found: boolean ): IAcesEdgeScanResult => ( {
        found, name: found ? "TEAPOT" : "", category: found ? "KITES" : "", cardNumber: found ? "7/12" : "", condition: found ? "When pouring tea:" : "",
        text: found ? "Spend 1 Edge to pour twice." : "", cost: found ? 1 : null, phase: found ? "combat" : "any", trigger: found ? "other" : "none", warnings: [],
    } );

    it( "fills a draft from a found scan and keeps the draft's id and notes", () => {
        const draft = { ...newAcesEdgeCard(), notes: "my kite notes" };
        const rv = applyAcesEdgeScan( draft, scan( true ) );
        expect( rv.id ).toBe( draft.id );
        expect( rv.notes ).toBe( "my kite notes" );
        expect( rv.name ).toBe( "TEAPOT" );
        expect( rv.cost ).toBe( 1 );
        expect( rv.phase ).toBe( "combat" );
        expect( rv.trigger ).toBe( "other" );
        expect( rv.text ).toBe( "Spend 1 Edge to pour twice." );
        expect( draft.name ).toBe( "" );
    } );

    it( "keeps what the player typed where the scan read nothing", () => {
        const draft = { ...newAcesEdgeCard(), name: "Kite", cost: 3, phase: "end" as const, trigger: "moving" as const, condition: "When it rains:" };
        const rv = applyAcesEdgeScan( draft, { ...scan( true ), name: "", cost: null, phase: "any", trigger: "none", condition: "" } );
        expect( rv.name ).toBe( "Kite" );
        expect( rv.cost ).toBe( 3 );
        expect( rv.phase ).toBe( "end" );
        expect( rv.trigger ).toBe( "moving" );
        expect( rv.condition ).toBe( "When it rains:" );
    } );

    it( "leaves the draft alone when the card wasn't found", () => {
        const draft = { ...newAcesEdgeCard(), name: "Kite" };
        expect( applyAcesEdgeScan( draft, scan( false ) ) ).toEqual( draft );
    } );
} );
