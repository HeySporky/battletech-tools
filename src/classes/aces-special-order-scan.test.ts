import { describe, expect, it } from "vitest";
import { newAcesSpecialOrder } from "../data/aces-cards";
import {
    acesSpecialOrderIconShape,
    acesSpecialOrderKindOf,
    acesSpecialOrderScanOptions,
    applyAcesSpecialOrderScan,
    IAcesSpecialOrderPanelRow,
    joinAcesSpecialOrderItems,
    parseAcesSpecialOrderCardNumber,
    parseAcesSpecialOrderPanel,
    parseAcesSpecialOrderPriority,
    placeAcesSpecialOrderIcons,
    scanAcesSpecialOrder,
} from "./aces-special-order-scan";
import { ICardScanColours, ICardScanIO, ICardScanLine, ICardScanRect, TCardScanMode } from "./card-scan-io";

// Synthetic cards: every sentence below is made up for the tests (teapots, kites, umbrellas), laid out the way a
// Special Order card prints: name and priority in the band at the top, a rules panel left, a narrower panel right.

const noColour: ICardScanColours = { red: 0, yellow: 0, blue: 0, green: 0 };

const row = ( text: string, top: number, colours: Partial<ICardScanColours> = {}, bullet = false ): IAcesSpecialOrderPanelRow => ( {
    text, top, bottom: top + 30, bullet, colours: { ...noColour, ...colours },
} );

describe( "Special Order header fields", () => {
    it( "reads a leading minus as a modifier and 000 as an absolute priority", () => {
        // The app keeps the printed sign (aces-cards.ts: -500 is a modifier), as the Forced Withdrawal sample does.
        expect( parseAcesSpecialOrderPriority( "-500" ) ).toEqual( { priority: -500, priorityIsModifier: true } );
        expect( parseAcesSpecialOrderPriority( "000" ) ).toEqual( { priority: 0, priorityIsModifier: false } );
        expect( parseAcesSpecialOrderPriority( "OO0" ) ).toEqual( { priority: 0, priorityIsModifier: false } );
        expect( parseAcesSpecialOrderPriority( "8" ) ).toEqual( { priority: null, priorityIsModifier: false } );
    } );

    it( "takes the kind from the name, allowing a slip, and other for any other name", () => {
        expect( acesSpecialOrderKindOf( "Fleeing" ) ).toBe( "fleeing" );
        expect( acesSpecialOrderKindOf( "FLEEMG" ) ).toBe( "fleeing" );
        expect( acesSpecialOrderKindOf( "FORCED WITHDRAWL" ) ).toBe( "forced-withdrawal" );
        expect( acesSpecialOrderKindOf( "Teapot Parade" ) ).toBe( "other" );
        expect( acesSpecialOrderKindOf( "" ) ).toBe( "other" );
    } );

    it( "reads the card number from the footer, with or without its slash", () => {
        expect( parseAcesSpecialOrderCardNumber( "Special Order 3/5" ) ).toBe( "3/5" );
        expect( parseAcesSpecialOrderCardNumber( "Speci Or 45" ) ).toBe( "4/5" );
        expect( parseAcesSpecialOrderCardNumber( "Special Order 2l5" ) ).toBe( "2/5" );
        expect( parseAcesSpecialOrderCardNumber( "nothing here" ) ).toBe( "" );
    } );
} );

describe( "Special Order panels", () => {
    it( "starts a new rules line at each bullet, item number or paragraph gap", () => {
        const lines = [
            row( "Every teapot here is painted green and", 100 ),
            row( "kept on the top shelf:", 140 ),
            row( "Spouts: point them at the window.", 180, {}, true ),
            row( "Lids: never lost.", 220, {}, true ),
            row( "1. Fill the kettle and", 260 ),
            row( "wait for the whistle.", 300 ),
            row( "Bring a spare umbrella.", 380 ),
        ];
        expect( joinAcesSpecialOrderItems( lines ) ).toEqual( [
            "Every teapot here is painted green and kept on the top shelf:",
            "Spouts: point them at the window.",
            "Lids: never lost.",
            "Fill the kettle and wait for the whistle.",
            "Bring a spare umbrella.",
        ] );
    } );

    it( "places an icon from the objective named before it, or the icon word after it", () => {
        expect( placeAcesSpecialOrderIcons( "Paint the Movement Objective ([?] sticker) blue." ) ).toBe( "Paint the Movement Objective ([moveobj] sticker) blue." );
        expect( placeAcesSpecialOrderIcons( "Skip Movement and Destroy Objectives ([?] and [?] stickers)." ) ).toBe( "Skip Movement and Destroy Objectives ([moveobj] and [destroyobj] stickers)." );
        expect( placeAcesSpecialOrderIcons( "hold a [?] standstill pose" ) ).toBe( "hold a [standstill] standstill pose" );
        expect( placeAcesSpecialOrderIcons( "polish [?] objective", "[moveobj]" ) ).toBe( "polish [moveobj] objective" );
        expect( placeAcesSpecialOrderIcons( "juggle [?] marbles" ) ).toBe( "juggle [?] marbles" );
    } );

    it( "reads a behavior column: condition, zone, the movement tab's colour and a filter's own fallback", () => {
        const panel = parseAcesSpecialOrderPanel( "TEST HEADING", [
            row( "If this kite is tangled", 100 ),
            row( "© nearest", 150 ),
            row( "", 200, { red: 0.2 } ),
            row( "1. hop across the meadow", 250 ),
            row( "( If needed)", 290, { yellow: 0.1 } ),
            row( "2. wave at [highest] clouds", 330 ),
        ] );
        expect( panel.column ).not.toBeNull();
        expect( panel.column!.condition ).toBe( "If this kite is tangled" );
        expect( panel.column!.zoneKeyword ).toBe( "nearest" );
        expect( panel.column!.targetSelect ).toBe( "" );
        expect( panel.column!.moveType ).toBe( "jump" );
        expect( panel.column!.filters ).toEqual( [ "hop across the meadow ([sprint] if needed)", "wave at [highest] clouds" ] );
        expect( panel.preFilters ).toEqual( [] );
        expect( panel.rules ).toEqual( [] );
    } );

    it( "reads filters labelled 0a, 0b ... as filters applied first", () => {
        const panel = parseAcesSpecialOrderPanel( "TEST HEADING", [
            row( "0a. count the marbles", 100 ),
            row( "Ob. if the jar is empty", 140 ),
            row( "fetch more marbles", 180 ),
            row( "oc. close the jar", 220 ),
        ] );
        expect( panel.preFilters ).toEqual( [ "count the marbles", "if the jar is empty fetch more marbles", "close the jar" ] );
        expect( panel.column ).toBeNull();
    } );

    it( "reads a numbered list with no zone or tab as the spotter list, and bullets as more rules under the heading", () => {
        const spotter = parseAcesSpecialOrderPanel( "PICK A HELPER", [
            row( "1. owns a ladder", 100 ),
            row( "2. deals [lowest] jokes", 140 ),
            row( "Nobody helps on a rainy day.", 220 ),
        ] );
        expect( spotter.spotter ).toEqual( [ "owns a ladder", "deals [lowest] jokes", "Nobody helps on a rainy day." ] );
        const stats = parseAcesSpecialOrderPanel( "PANTRY LIST", [
            row( "flour: two bags.", 100, {}, true ),
            row( "sugar: one jar.", 140, {}, true ),
        ] );
        expect( stats.rules ).toEqual( [ "Pantry list", "flour: two bags.", "sugar: one jar." ] );
    } );
} );

/* ----- whole scans on a fake photo ----- */

const width = 2000, height = 1500;
const charWidth = 15, lineHeight = 30;

interface IPlaced { text: string, x: number, y: number, modes?: TCardScanMode[] }

const placedLine = ( placed: IPlaced ): ICardScanLine => {
    let x = placed.x;
    const words = placed.text.split( " " ).map( ( word ) => {
        const rv = { text: word, bbox: { x0: x, y0: placed.y, x1: x + word.length * charWidth, y1: placed.y + lineHeight } };
        x = rv.bbox.x1 + charWidth;
        return rv;
    } );
    return { text: placed.text, bbox: { x0: placed.x, y0: placed.y, x1: words[words.length - 1].bbox.x1, y1: placed.y + lineHeight }, words: words };
}

const inside = ( x: number, y: number, rect: ICardScanRect ) => x >= rect.left && x < rect.left + rect.width && y >= rect.top && y < rect.top + rect.height;

// The two light panels on a dark card, and the black heading bar across the right panel's top.
const leftPanel: ICardScanRect = { left: 100, top: 420, width: 1050, height: 910 };
const rightPanel: ICardScanRect = { left: 1220, top: 420, width: 580, height: 910 };
const headingBar: ICardScanRect = { left: 1220, top: 420, width: 580, height: 100 };

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
            const light = panels && ( inside( px, py, leftPanel ) || inside( px, py, rightPanel ) ) && !inside( px, py, headingBar );
            const index = ( y * rect.width + x ) * 4;
            rv[index] = rv[index + 1] = rv[index + 2] = light ? 230 : 20;
            rv[index + 3] = 255;
        }
        return rv;
    },
} );

const cardLines: IPlaced[] = [
    { text: "TEAPOT PARADE", x: 200, y: 260, modes: [ "bright", "plain" ] },
    { text: "-500", x: 1500, y: 300, modes: [ "bright" ] },
    { text: "Special Order 2/5", x: 120, y: 1345, modes: [ "bright", "plain" ] },
    { text: "Every teapot here is", x: 160, y: 460, modes: [ "panel" ] },
    { text: "painted green.", x: 160, y: 500, modes: [ "panel" ] },
    { text: "Bring a spare umbrella.", x: 160, y: 600, modes: [ "panel" ] },
    { text: "PICK A HELPER", x: 1300, y: 450, modes: [ "bright" ] },
    { text: "1. owns a ladder", x: 1250, y: 560, modes: [ "panel" ] },
    { text: "2. tells good jokes", x: 1250, y: 600, modes: [ "panel" ] },
];

/** A small RGBA picture: "#" is black ink, anything else white. */
const picture = ( rows: string[] ): { pixels: number[], width: number, height: number } => {
    const width = rows[0].length, height = rows.length;
    const pixels: number[] = [];
    for( const line of rows ) for( const char of line ) {
        const value = char === "#" ? 0 : 255;
        pixels.push( value, value, value, 255 );
    }
    return { pixels, width, height };
};

describe( "Special Order icon shapes", () => {
    const shape = ( rows: string[] ): string => {
        const { pixels, width, height } = picture( rows );
        return acesSpecialOrderIconShape( pixels, width, height );
    };

    it( "tells icons apart by their holes and parts", () => {
        expect( shape( [
            "........",
            ".######.",
            ".#....#.",
            ".#....#.",
            ".#....#.",
            ".#....#.",
            ".######.",
            "........",
        ] ) ).toBe( "[?standstill]" );
        expect( shape( [
            "........",
            ".######.",
            ".#....#.",
            ".#.##.#.",
            ".#.##.#.",
            ".#....#.",
            ".######.",
            "........",
        ] ) ).toBe( "[?range]" );
        expect( shape( [
            "................",
            ".##############.",
            ".#............#.",
            ".#............#.",
            ".##############.",
            "................",
        ] ) ).toBe( "[?los]" );
        expect( shape( [
            "...........",
            ".#########.",
            ".#...#...#.",
            ".#...#...#.",
            ".#########.",
            "...........",
        ] ) ).toBe( "[?nolos]" );
        expect( shape( [
            "...........",
            ".#########.",
            ".#...#...#.",
            ".#########.",
            ".#...#...#.",
            ".#########.",
            "...........",
        ] ) ).toBe( "[?moveobj]" );
        expect( shape( [
            "............",
            ".####..####.",
            ".####..####.",
            ".####..####.",
            ".####..####.",
            "............",
        ] ) ).toBe( "[?closer]" );
        expect( shape( [
            "......",
            ".####.",
            ".####.",
            ".####.",
            "......",
        ] ) ).toBe( "" );
    } );

    it( "lets a shape guess fill an icon the words don't place", () => {
        expect( placeAcesSpecialOrderIcons( "juggle [?closer] marbles" ) ).toBe( "juggle [closer] marbles" );
        expect( placeAcesSpecialOrderIcons( "juggle [?] marbles" ) ).toBe( "juggle [?] marbles" );
    } );
} );

describe( "Special Order scan", () => {
    it( "reads the name, priority, card number, rules and the right panel's list", async () => {
        const scan = await scanAcesSpecialOrder( fakePhoto( cardLines ) );
        expect( scan.found ).toBe( true );
        expect( acesSpecialOrderScanOptions.shape ).toBe( "landscape" );
        expect( acesSpecialOrderScanOptions.found( scan ) ).toBe( true );
        expect( scan.name ).toBe( "Teapot Parade" );
        expect( scan.kind ).toBe( "other" );
        expect( scan.cardNumber ).toBe( "2/5" );
        expect( scan.priority ).toBe( -500 );
        expect( scan.priorityIsModifier ).toBe( true );
        expect( scan.rules ).toEqual( [ "Every teapot here is painted green.", "Bring a spare umbrella." ] );
        expect( scan.spotter ).toEqual( [ "owns a ladder", "tells good jokes" ] );
        expect( scan.column ).toBeNull();
    } );

    it( "returns nothing for a wrong card: a behavior card's photo is not a Special Order", async () => {
        const scan = await scanAcesSpecialOrder( fakePhoto( [
            { text: "AGGRESSIVE BALANCED CAUTIOUS", x: 200, y: 300 },
            { text: "Special Order 2/5", x: 120, y: 1345 },
        ] ) );
        expect( scan.found ).toBe( false );
        expect( scan.warnings ).toHaveLength( 1 );
        expect( scan.warnings[0] ).toMatch( /behavior card/ );
        expect( scan.name ).toBe( "" );
        expect( scan.cardNumber ).toBe( "" );
        expect( scan.priority ).toBeNull();
        expect( scan.rules ).toEqual( [] );
        const order = { ...newAcesSpecialOrder(), name: "Kept" };
        expect( applyAcesSpecialOrderScan( order, scan ) ).toEqual( order );
    } );

    it( "returns nothing for a wrong card: a Command card's photo is not a Special Order", async () => {
        const scan = await scanAcesSpecialOrder( fakePhoto( [ { text: "EMPLACEMENTS ARTILLERY BSP CARDS", x: 200, y: 700 }, { text: "STRATEGY DECISIONS", x: 200, y: 1000 } ] ) );
        expect( scan.found ).toBe( false );
        expect( scan.warnings ).toHaveLength( 1 );
        expect( scan.warnings[0] ).toMatch( /Command card/ );
    } );

    it( "doesn't find a card with no panels or no Special Order footer", async () => {
        expect( ( await scanAcesSpecialOrder( fakePhoto( cardLines, false ) ) ).found ).toBe( false );
        expect( ( await scanAcesSpecialOrder( fakePhoto( cardLines.filter( ( line ) => !/Special/.test( line.text ) ) ) ) ).found ).toBe( false );
    } );

    it( "puts a scan onto a draft", () => {
        const scan = {
            found: true, name: "Teapot Parade", kind: "other" as const, cardNumber: "2/5", priority: 0, priorityIsModifier: false,
            rules: [ "Bring a spare umbrella." ], column: null, preFilters: [ "count the marbles" ], spotter: [], warnings: [],
        };
        const order = applyAcesSpecialOrderScan( { ...newAcesSpecialOrder(), notes: "mine" }, scan );
        expect( order.name ).toBe( "Teapot Parade" );
        expect( order.cardNumber ).toBe( "2/5" );
        expect( order.priority ).toBe( 0 );
        expect( order.rules ).toEqual( [ "Bring a spare umbrella." ] );
        expect( order.preFilters ).toEqual( [ "count the marbles" ] );
        expect( order.notes ).toBe( "mine" );
    } );
} );
