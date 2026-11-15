import { describe, expect, it } from "vitest";
import { newAcesCommandCard } from "../data/aces-cards";
import { acesCommandCardScanOptions, applyAcesCommandScan, scanAcesCommandCard, snapAcesFaction } from "./aces-command-card-scan";
import { ICardScanColours, ICardScanIO, ICardScanLine, ICardScanRect, TCardScanMode } from "./card-scan-io";

// Synthetic cards: the text below is made up for the tests, laid out the way a Command card prints it.

const width = 2000, height = 2667;
const charWidth = 15, lineHeight = 30;

interface IPlaced { text: string, x: number, y: number, modes?: TCardScanMode[] }
interface IPatch { rect: ICardScanRect, colour: "red" | "yellow" | "blue" }

/** An OCR line at whole-image coordinates, each word as wide as its letters. */
const placedLine = ( placed: IPlaced ): ICardScanLine => {
    let x = placed.x;
    const words = placed.text.split( " " ).map( ( word ) => {
        const rv = { text: word, bbox: { x0: x, y0: placed.y, x1: x + word.length * charWidth, y1: placed.y + lineHeight } };
        x = rv.bbox.x1 + charWidth;
        return rv;
    } );
    return { text: placed.text, bbox: { x0: placed.x, y0: placed.y, x1: words[words.length - 1].bbox.x1, y1: placed.y + lineHeight }, words: words };
}

/** A photo as the reader sees it: OCR returns the lines whose middle falls in the region; colours come from patches. */
const fakeCard = ( lines: IPlaced[], patches: IPatch[] ): ICardScanIO => ( {
    width, height,
    recognize: async ( rect, mode ) => lines.filter( ( placed ) => {
        if( placed.modes && !placed.modes.includes( mode ) ) return false;
        const line = placedLine( placed );
        const x = ( line.bbox.x0 + line.bbox.x1 ) / 2, y = ( line.bbox.y0 + line.bbox.y1 ) / 2;
        return x >= rect.left && x < rect.left + rect.width && y >= rect.top && y < rect.top + rect.height;
    } ).map( placedLine ),
    colours: ( rect ) => {
        const rv: ICardScanColours = { red: 0, yellow: 0, blue: 0, green: 0 };
        for( const patch of patches ) {
            const w = Math.min( rect.left + rect.width, patch.rect.left + patch.rect.width ) - Math.max( rect.left, patch.rect.left );
            const h = Math.min( rect.top + rect.height, patch.rect.top + patch.rect.height ) - Math.max( rect.top, patch.rect.top );
            if( w > 0 && h > 0 ) rv[patch.colour] += w * h / ( rect.width * rect.height );
        }
        return rv;
    },
    pixels: () => [],
} );

/** A small icon just before the word that starts at x. */
const icon = ( colour: "red" | "blue", x: number, y: number ): IPatch => ( { rect: { left: x - 14, top: y + 3, width: 12, height: 24 }, colour } );

// The RED / YELLOW / BLUE header band.
const band: IPatch[] = [
    { rect: { left: 200, top: 1380, width: 480, height: 110 }, colour: "red" },
    { rect: { left: 720, top: 1380, width: 480, height: 110 }, colour: "yellow" },
    { rect: { left: 1240, top: 1380, width: 480, height: 110 }, colour: "blue" },
];

const header: IPlaced[] = [
    { text: "TEST DECK", x: 230, y: 300 },
    { text: "CLAN NOWHERE", x: 230, y: 360 },
    { text: "B", x: 1560, y: 330, modes: [ "bright" ] },
    { text: "7/10", x: 230, y: 2340, modes: [ "bright" ] },
];

// "1. ▲M damage", "2. ▲starting / Armor", "3. ▼TMM" in the red column; the order "Initiative Phase:" with its text.
const frontLines: IPlaced[] = [
    ...header,
    { text: "Initiative Phase:", x: 960, y: 560, modes: [ "panel" ] },
    { text: "Wave a flag, then the", x: 960, y: 610, modes: [ "panel" ] },
    { text: "MOVE FIRST token goes to", x: 960, y: 660, modes: [ "panel" ] },
    { text: "the test unit with ( PV).", x: 960, y: 710, modes: [ "panel" ] },
    { text: "1. M damage", x: 220, y: 1560, modes: [ "panel" ] },
    { text: "2. starting", x: 220, y: 1620, modes: [ "panel" ] },
    { text: "Armor", x: 230, y: 1665, modes: [ "panel" ] },
    { text: "3. TMM", x: 220, y: 1720, modes: [ "panel" ] },
    { text: "1. @ Objective", x: 740, y: 1560, modes: [ "panel" ] },
    { text: "2. MV", x: 740, y: 1620, modes: [ "panel" ] },
    { text: "1. PV", x: 1260, y: 1560, modes: [ "panel" ] },
];
const frontPatches: IPatch[] = [
    ...band,
    icon( "blue", 1275, 710 ),
    icon( "blue", 265, 1560 ), icon( "blue", 265, 1620 ), icon( "red", 265, 1720 ),
    icon( "red", 785, 1620 ), icon( "blue", 1305, 1560 ),
];

describe( "Aces Command card scan: orders side", () => {
    it( "reads the colour lists, the order and the card's header", async () => {
        const scan = await scanAcesCommandCard( fakeCard( frontLines, frontPatches ) );
        expect( scan.found ).toBe( true );
        expect( scan.red.map( ( rule ) => ( { stat: rule.stat, direction: rule.direction } ) ) ).toEqual( [
            { stat: "damage-m", direction: "highest" },
            { stat: "armor-start", direction: "highest" },
            { stat: "tmm", direction: "lowest" },
        ] );
        expect( scan.red.map( ( rule ) => rule.text ) ).toEqual( [ "[highest] [M] damage", "[highest] Starting Armor", "[lowest] TMM" ] );
        expect( scan.yellow.map( ( rule ) => rule.text ) ).toEqual( [ "[destroyobj] Objective", "[lowest] MV" ] );
        expect( scan.yellow[0].objective ).toBe( true );
        expect( scan.blue.map( ( rule ) => rule.text ) ).toEqual( [ "[highest] PV" ] );
        expect( scan.orders.length ).toBe( 1 );
        expect( scan.orders[0].phase ).toBe( "initiative" );
        expect( scan.orders[0].text ).toBe( "Wave a flag, then the MOVE FIRST token goes to the test unit with ([highest] PV)." );
        expect( scan.orders[0].token ).toBe( "move-first" );
        expect( scan.deck ).toBe( "Test Deck" );
        expect( scan.faction ).toBe( "Clan Nowhere" );
        expect( scan.letter ).toBe( "B" );
        expect( scan.cardNumber ).toBe( "7/10" );
    } );

    it( "splits orders at each phase heading and keeps an order's movement filter apart", async () => {
        const lines: IPlaced[] = [
            ...header,
            { text: "Hum a tune quietly,", x: 960, y: 560, modes: [ "panel" ] },
            { text: "then stop.", x: 960, y: 610, modes: [ "panel" ] },
            { text: "Movement Phase:", x: 960, y: 660, modes: [ "panel" ] },
            { text: "Test units pick this:", x: 960, y: 710, modes: [ "panel" ] },
            { text: "0. puddles near tests", x: 960, y: 760, modes: [ "panel" ] },
            { text: "1. PV", x: 220, y: 1560, modes: [ "panel" ] },
        ];
        const scan = await scanAcesCommandCard( fakeCard( lines, [ ...band, icon( "blue", 1200, 760 ), icon( "blue", 265, 1560 ) ] ) );
        expect( scan.orders.map( ( order ) => [ order.phase, order.text, order.filter ] ) ).toEqual( [
            [ "any", "Hum a tune quietly, then stop.", "" ],
            [ "movement", "Test units pick this:", "0. puddles near [highest] tests" ],
        ] );
    } );
} );

describe( "Aces Command card scan: support side", () => {
    const lines: IPlaced[] = [
        { text: "TEST DECK", x: 230, y: 200 },
        { text: "CLAN NOWHERE", x: 230, y: 260 },
        { text: "C", x: 1600, y: 230, modes: [ "bright" ] },
        { text: "SUPPORT ORDERS", x: 250, y: 470, modes: [ "plain" ] },
        { text: "Bake 3 test muffins.", x: 250, y: 540, modes: [ "dark" ] },
        { text: "EMPLACEMENTS", x: 230, y: 760, modes: [ "plain" ] },
        { text: "ARTILLERY", x: 770, y: 760, modes: [ "plain" ] },
        { text: "BSP CARDS", x: 1300, y: 760, modes: [ "plain" ] },
        { text: "@ 30\")", x: 240, y: 840, modes: [ "panel" ] },
        { text: "1. Rear", x: 240, y: 920, modes: [ "panel" ] },
        { text: "2. TMM", x: 240, y: 980, modes: [ "panel" ] },
        { text: "1. Structure", x: 780, y: 840, modes: [ "panel" ] },
        { text: "lost", x: 790, y: 885, modes: [ "panel" ] },
        { text: "2. PV", x: 780, y: 940, modes: [ "panel" ] },
        { text: "1. Size", x: 1310, y: 840, modes: [ "panel" ] },
        { text: "STRATEGY DECISIONS", x: 230, y: 1600, modes: [ "plain" ] },
        { text: "A: If the moon is out", x: 230, y: 1690, modes: [ "dark" ] },
        { text: "B: If the kettle has PV", x: 230, y: 1750, modes: [ "dark" ] },
        { text: "C: If a teapot is", x: 230, y: 1810, modes: [ "dark" ] },
        { text: "quite warm", x: 230, y: 1860, modes: [ "dark" ] },
        { text: "8/10", x: 230, y: 2340, modes: [ "bright" ] },
    ];
    const patches: IPatch[] = [
        icon( "red", 285, 980 ), icon( "blue", 825, 840 ), icon( "blue", 825, 940 ), icon( "red", 1355, 840 ),
        icon( "blue", 545, 1750 ),
    ];

    it( "reads support orders, the three lists and the strategy rows", async () => {
        const scan = await scanAcesCommandCard( fakeCard( lines, patches ) );
        expect( scan.found ).toBe( true );
        expect( scan.side ).toBe( "support" );
        expect( scan.orders ).toEqual( [] );
        expect( scan.red ).toEqual( [] );
        expect( scan.supportOrders ).toBe( "Bake 3 test muffins." );
        expect( scan.emplacementZoneRings ).toEqual( [ 30 ] );
        expect( scan.emplacements!.map( ( rule ) => rule.text ) ).toEqual( [ "Rear", "[lowest] TMM" ] );
        expect( scan.artillery!.map( ( rule ) => rule.text ) ).toEqual( [ "[highest] Structure lost", "[highest] PV" ] );
        expect( scan.bsp!.map( ( rule ) => rule.text ) ).toEqual( [ "[lowest] Size" ] );
        expect( scan.strategy!.map( ( row ) => row.letter + " " + row.text ) ).toEqual( [
            "A If the moon is out",
            "B If the kettle has [highest] PV",
            "C If a teapot is quite warm",
        ] );
        expect( scan.letter ).toBe( "C" );
        expect( scan.cardNumber ).toBe( "8/10" );

        const card = applyAcesCommandScan( null, scan );
        expect( card.supportOrders ).toBe( "Bake 3 test muffins." );
        expect( card.bsp[0].stat ).toBe( "size" );
        expect( card.strategy.length ).toBe( 3 );
    } );
} );

describe( "Aces Command card scan: not a Command card", () => {
    it( "returns found: false with a warning for a behavior card, and nothing half filled", async () => {
        const lines: IPlaced[] = [
            { text: "MISSILE BOAT 132", x: 200, y: 100 },
            { text: "AGGRESSIVE", x: 200, y: 600 },
            { text: "BALANCED", x: 800, y: 600 },
            { text: "CAUTIOUS", x: 1400, y: 600 },
            { text: "1. PV", x: 220, y: 1560 },
        ];
        const scan = await scanAcesCommandCard( fakeCard( lines, [ { rect: { left: 300, top: 900, width: 60, height: 40 }, colour: "red" } ] ) );
        expect( scan.found ).toBe( false );
        expect( scan.warnings.length ).toBe( 1 );
        expect( scan.warnings[0] ).toMatch( /behavior card/ );
        expect( [ scan.deck, scan.faction, scan.letter, scan.cardNumber ] ).toEqual( [ "", "", "", "" ] );
        expect( [ scan.orders, scan.red, scan.yellow, scan.blue ] ).toEqual( [ [], [], [], [] ] );
        expect( acesCommandCardScanOptions.found( scan ) ).toBe( false );
    } );

    it( "returns found: false for a photo with no card", async () => {
        const scan = await scanAcesCommandCard( fakeCard( [], [] ) );
        expect( scan.found ).toBe( false );
        expect( scan.warnings.length ).toBe( 1 );
    } );

    it( "puts an orders-side scan onto a card, keeping the other side", async () => {
        const scan = await scanAcesCommandCard( fakeCard( frontLines, frontPatches ) );
        const existing = { ...newAcesCommandCard(), deck: "Kept", supportOrders: "Kept too." };
        const card = applyAcesCommandScan( existing, scan );
        expect( card.deck ).toBe( "Kept" );
        expect( card.supportOrders ).toBe( "Kept too." );
        expect( card.letter ).toBe( "B" );
        expect( card.red.length ).toBe( 3 );
        expect( card.orders[0].phase ).toBe( "initiative" );
        expect( existing.red.length ).toBe( 0 );
    } );
} );

describe( "Aces Command card scan: faction", () => {
    it( "snaps a faction read with a slip or two to the MUL faction name, and keeps one it can't place", () => {
        expect( snapAcesFaction( "Cian Jade Falcon" ) ).toBe( "Clan Jade Falcon" );
        expect( snapAcesFaction( "Clan Jade Falconn To" ) ).toBe( "Clan Jade Falcon" );
        expect( snapAcesFaction( "Lyran Commonwealth" ) ).toBe( "Lyran Commonwealth" );
        expect( snapAcesFaction( "Made Up Raiders" ) ).toBe( "Made Up Raiders" );
        expect( snapAcesFaction( "" ) ).toBe( "" );
    } );
} );
