import { describe, expect, it } from "vitest";
import { acesCombatFilterPhrases, acesConditionPhrases, acesMovementFilterPhrases } from "../data/aces-card-phrases";
import { acesSampleBrawler383 } from "../data/aces-card-samples";
import {
    acesScanOnesAndSevens, acesScanTagColour, applyAcesScanToCard, findAcesCardLayout, matchAcesPhrase, parseAcesScanColumn, parseAcesScanCombat, parseAcesScanFooter,
    parseAcesScanHeader, restoreAcesScanIcons, scanAcesCard, tidyAcesScanLines,
} from "./aces-card-scan";
import {
    cardScanBinarize, cardScanColoursFromPixels, cardScanMargin, cardScanRotate, cardScanSkew, cardScanTurn, ICardScanColours, ICardScanImage, ICardScanIO, ICardScanLine, ICardScanRect,
    scanWithTurns,
} from "./card-scan-io";

// Line fixtures are real tesseract output from photos of the printed cards.

const none: ICardScanColours = { red: 0, yellow: 0, blue: 0, green: 0 };
const plain = ( text: string ) => ( { text: text, colours: none } );

/** An OCR line at whole-image coordinates, one word per space. */
const line = ( text: string, x0: number, y0: number, x1: number, y1: number ): ICardScanLine => {
    const parts = text.split( " " );
    const step = ( x1 - x0 ) / parts.length;
    return {
        text: text,
        bbox: { x0, y0, x1, y1 },
        words: parts.map( ( part, index ) => ( { text: part, bbox: { x0: x0 + step * index, y0, x1: x0 + step * ( index + 1 ), y1 } } ) ),
    };
}

const pixels = ( count: number, rgb: [ number, number, number ] ): number[] => {
    const rv: number[] = [];
    for( let index = 0; index < count; index++ ) rv.push( rgb[0], rgb[1], rgb[2], 255 );
    return rv;
}

describe( "Aces card scan: header and footer", () => {
    it( "matches the deck and keeps a variant", () => {
        expect( parseAcesScanHeader( "\"MISSILE BOAT" ) ).toEqual( { deck: "Missile Boat", deckId: "missile-boat", priority: null } );
        const hover = parseAcesScanHeader( "| SCOUT (HOVER) 737" );
        expect( hover.deck ).toBe( "Scout (Hover)" );
        expect( hover.deckId ).toBe( "scout-hover" );
        expect( hover.priority ).toBe( 737 );
    } );

    it( "reads the card number from the footer", () => {
        expect( parseAcesScanFooter( "3/6 Scout (Hover) B TTLETE(" ) ).toBe( "3/6" );
        expect( parseAcesScanFooter( "BATTLETECH" ) ).toBe( "" );
    } );
} );

describe( "Aces card scan: icons from wording", () => {
    it( "keeps a lost command-list number from reading as \"no\"", () => {
        expect( restoreAcesScanIcons( "0 command list" ) ).not.toMatch( /^no\b/ );
    } );

    it( "mends OCR's mixed-case \"cover\"", () => {
        expect( restoreAcesScanIcons( "COVer vs enemies" ) ).toBe( "cover vs [highest] enemies" );
        expect( restoreAcesScanIcons( "covervs enemies" ) ).toBe( "cover vs [highest] enemies" );
        expect( restoreAcesScanIcons( "no Cover" ) ).toBe( "no Cover" );
    } );

    it( "reads \"10 ✖ enemies\" as no", () => {
        expect( restoreAcesScanIcons( "10 EJ enemies in 12\"" ) ).toMatch( /^no \[\S+\] enemies in 12"$/ );
    } );
} );

describe( "Aces card scan: card phrases", () => {
    it( "sets a garbled line to the nearest printed phrase, keeping its numbers and colour", () => {
        expect( matchAcesPhrase( "If there are any [?] enemies in 24\"", acesConditionPhrases ) ).toBe( "If there are any [moved] enemies in 24\"" );
        expect( matchAcesPhrase( "the ideal [?] is [moved] and unit can move behlnd it", acesConditionPhrases, "red" ) )
            .toBe( "If the ideal [red] is [moved] and unit can move behind it" );
        expect( matchAcesPhrase( "6\" [spacing] targat", acesMovementFilterPhrases ) ).toBe( "6\" [spacing] target" );
    } );
    it( "keeps the line as read when no phrase is near, two tie, or a number is missing", () => {
        expect( matchAcesPhrase( "something else entirely", acesMovementFilterPhrases ) ).toBe( "something else entirely" );
        expect( matchAcesPhrase( "[?] target", acesMovementFilterPhrases ) ).toBe( "[?] target" );
        expect( matchAcesPhrase( "If there are any [moved] enemies in", acesConditionPhrases ) ).toBe( "If there are any [moved] enemies in" );
    } );
    it( "knows the phrases of Rekikire's typed card library", () => {
        expect( matchAcesPhrase( "If this unit has more armar than the damage ratinq of any enemy in 30\"", acesConditionPhrases ) )
            .toBe( "If this unit has more armor than the damage rating of any enemy in 30\"" );
        expect( matchAcesPhrase( "If unit can rnove behind nearest [moved] enemy", acesConditionPhrases ) ).toBe( "If unit can move behind nearest [moved] enemy" );
        expect( matchAcesPhrase( "cover vs [highest] enemies (avoid watar)", acesMovementFilterPhrases ) ).toBe( "cover vs [highest] enemies (avoid water)" );
        expect( matchAcesPhrase( "onto highest elevatlon (use [jump] if needed)", acesMovementFilterPhrases ) ).toBe( "onto highest elevation (use [jump] if needed)" );
        expect( matchAcesPhrase( "Hit targets Raar", acesCombatFilterPhrases ) ).toBe( "Hit target's Rear" );
        expect( matchAcesPhrase( "Attacked by aliy this turn", acesCombatFilterPhrases ) ).toBe( "Attacked by ally this turn" );
    } );
    it( "has no two phrases that read the same", () => {
        const words = ( phrase: string ) => ( phrase.toLowerCase().match( /\[[^\]]*\]|\{[nc]\}|\d+|[a-z']+/g ) || [] ).join( " " );
        for( const list of [ acesConditionPhrases, acesMovementFilterPhrases, acesCombatFilterPhrases ] ) {
            expect( new Set( list.map( words ) ).size ).toBe( list.length );
        }
    } );
} );

describe( "Aces card scan: movement column", () => {
    it( "reads Missile Boat 1/6 Balanced", () => {
        const column = parseAcesScanColumn( [
            plain( "If there are more allies" ),
            plain( "than enemies in 18\"" ),
            plain( "12\") 18\") 24\")" ),
            // The target row prints only a YELLOW tag and the moved check, so OCR reads nothing there.
            { text: "", colours: { red: 0, yellow: 0.1, blue: 0, green: 0.05 } },
            plain( "1.0ccupy woods" ),
            plain( "2. »{ target" ),
            plain( "3.cover vs enemies" ),
        ] );
        expect( column.condition ).toBe( "If there are more allies than enemies in 18\"" );
        expect( column.zoneRings ).toEqual( [ 12, 18, 24 ] );
        expect( column.targetSelect ).toBe( "yellow" );
        expect( column.targetMoved ).toBe( true );
        expect( column.moveType ).toBe( "ground" );
        expect( column.filters ).toEqual( [ "occupy woods", "[closer] target", "cover vs [highest] enemies" ] );
    } );

    it( "reads Missile Boat 1/6 Cautious, with sprint", () => {
        const column = parseAcesScanColumn( [
            plain( "nearest" ),
            plain( "[6)([s)if there are no" ),
            plain( "enemies in 36\")" ),
            plain( "1. ¢ all enemies" ),
            plain( "2. »< target" ),
            plain( "3. occupy woods" ),
        ] );
        expect( column.condition ).toBe( "" );
        expect( column.zoneKeyword ).toBe( "nearest" );
        expect( column.altMoveType ).toBe( "sprint" );
        expect( column.altMoveWhen ).toBe( "if there are no enemies in 36\"" );
        expect( column.filters ).toEqual( [ "[nolos] all enemies", "[closer] target", "occupy woods" ] );
    } );
} );

// Rekikire's photos of Missile Boat and Scout (Hover) cards (IMG_0038 to IMG_0067), as tesseract read them.
describe( "Aces card scan: Rekikire's photos", () => {
    it( "reads \"has ⊘ any enemy\" with one icon, before \"any\"", () => {
        expect( restoreAcesScanIcons( "If there are any ©] enemies in 24\", and no E3 enemies in 12\", and this unit has €2 any enemy" ) )
            .toBe( "If there are any [moved] enemies in 24\", and no [notmoved] enemies in 12\", and this unit has [nolos] any enemy" );
    } );

    it( "drops stray marks where the cards print no icon", () => {
        expect( restoreAcesScanIcons( "If there are any £2 enemies in 24\" and ~~ no E3 enemies in ¢ 12\"" ) ).toBe( "If there are any [moved] enemies in 24\" and no [notmoved] enemies in 12\"" );
        expect( restoreAcesScanIcons( "~ fthere are any [yellow] enemies" ) ).toBe( "If there are any [yellow] enemies" );
    } );

    it( "mends run-together words", () => {
        expect( restoreAcesScanIcons( "Ifthe ideal is £2 and unit can move behind it", { colour: "red", moved: true } ) ).toBe( "If the ideal [red] is [moved] and unit can move behind it" );
        expect( restoreAcesScanIcons( "COvVervs enemies" ) ).toBe( "cover vs [highest] enemies" );
        expect( restoreAcesScanIcons( "Ifthe ideal ba and unit can move behind it", { colour: "yellow", moved: true } ) ).toBe( "If the ideal [yellow] is [moved] and unit can move behind it" );
    } );

    it( "tells the eye from the closer arrows by their shape", () => {
        expect( restoreAcesScanIcons( "© target" ) ).toBe( "[los] target" );
        expect( restoreAcesScanIcons( "O® target" ) ).toBe( "[los] target" );
        expect( restoreAcesScanIcons( "»{ target" ) ).toBe( "[closer] target" );
        expect( restoreAcesScanIcons( "p< target" ) ).toBe( "[closer] target" );
    } );

    it( "reads the ▲ and ▼ read as letters", () => {
        expect( restoreAcesScanIcons( "Aother enemies" ) ).toBe( "[highest] other enemies" );
        expect( restoreAcesScanIcons( "in Yenemy €" ) ).toBe( "in [lowest] enemy [range]" );
        expect( restoreAcesScanIcons( "A Armor lost" ) ).toBe( "[highest] Armor lost" );
    } );

    it( "starts a new filter at each printed item, number read or not", () => {
        // 042 Cautious: "4." unread; 062 Cautious: "4. in" read as "ain".
        const cautious = parseAcesScanColumn( [ "nearest", "[e)( if needed)", "1. ¥2 all enemies", "2.no €3 enemies in 16\"", "3. occupy woods", "»< target" ].map( plain ) );
        expect( cautious.filters ).toEqual( [ "[nolos] all enemies", "no [notmoved] enemies in 16\"", "occupy woods", "[closer] target" ] );
        const scout = parseAcesScanColumn( [ "nearest", "[©", "1. © target", "2.18\" £{) target", "3.target has no cover", "ain enemy €" ].map( plain ) );
        expect( scout.filters ).toEqual( [ "[los] target", "18\" [spacing] target", "target has no cover", "in [lowest] enemy [range]" ] );
        // 060 Aggressive: the ▲ before "other enemies" read as "4".
        const aggressive = parseAcesScanColumn( [ "1. behind target", "2.in enemy €", "3. intervening woods vs", "4 other enemies" ].map( plain ) );
        expect( aggressive.filters ).toEqual( [ "behind target", "in [lowest] enemy [range]", "intervening woods vs [highest] other enemies" ] );
    } );

    it( "joins a wrapped sprint filter", () => {
        const column = parseAcesScanColumn( [ "nearest", "[6)([s)if there are no", "enemies in 36\")", "1.1f sprinting, ¢2", "all enemies", "2.20\" £) target" ].map( plain ) );
        expect( column.filters ).toEqual( [ "If sprinting, [nolos] all enemies", "20\" [spacing] target" ] );
    } );

    it( "reads 058 Aggressive: its zone, and no stray OR in the condition", () => {
        const column = parseAcesScanColumn( [
            plain( "Ifthe ideal" ), { text: "is £2 and unit can", colours: { red: 0, yellow: 0.05, blue: 0, green: 0.05 } }, plain( ". move behind it" ),
            plain( "; © 20\") 24\")" ), { text: "OR", colours: { red: 0, yellow: 0.1, blue: 0, green: 0.05 } }, plain( "[© Ifneeded)" ),
            plain( "1. behind target" ),
        ] );
        expect( column.condition ).toBe( "If the ideal [yellow] is [moved] and unit can move behind it" );
        expect( column.zoneRings ).toEqual( [ 20, 24 ] );
        expect( column.targetSelect ).toBe( "yellow" );
        expect( column.targetMoved ).toBe( true );
        expect( column.altMoveType ).toBe( "jump" );
    } );

    it( "restores an unread top line, a lost \"is ✔\", and art read as filters", () => {
        const moved = { red: 0, yellow: 0, blue: 0.05, green: 0.05 };
        const top = parseAcesScanColumn( [ { text: "is 9 and unit can", colours: moved }, plain( "~ move behind it" ), plain( "20\") 30\")" ), plain( "1. behind target" ),
            plain( "3.intervening woods vs" ), plain( "« nther enemies" ), plain( "WY TIE. LF ¥ THE OW.) ed" ) ] );
        expect( top.condition ).toBe( "If the ideal [blue] is [moved] and unit can move behind it" );
        expect( top.filters ).toEqual( [ "behind target", "intervening woods vs [highest] other enemies" ] );
        expect( restoreAcesScanIcons( "If the ideal and unit can move behind it", { colour: "yellow", moved: true } ) ).toBe( "If the ideal [yellow] is [moved] and unit can move behind it" );
    } );

    it( "keeps a zone row whose ◎ reads as the copyright's ©", () => {
        const rows = tidyAcesScanLines( [
            line( "move behind it", 150, 634, 500, 686 ), line( ": © 20\") 24\")", 150, 700, 500, 750 ), line( "1. behind target", 150, 982, 500, 1033 ),
            line( "2.in enemy €", 150, 1058, 500, 1117 ), line( "3. intervening woods vs", 150, 1152, 500, 1203 ),
        ] );
        expect( rows.map( ( row ) => row.text ) ).toContain( ": © 20\") 24\")" );
    } );

    it( "skips art read above the condition, and the zone icon read as a ring", () => {
        const column = parseAcesScanColumn( [ "rr pRisy Wp", "Ifthe ideal", "is £2 and unit can", "move behind it", "46) © 24\") 30\")", "1.behind target" ].map( plain ) );
        expect( column.condition ).toMatch( /^If the ideal/ );
        expect( column.zoneRings ).toEqual( [ 24, 30 ] );
    } );

    it( "reads a misread inch mark glued to a ring as a mark, since rings are even", () => {
        const column = parseAcesScanColumn( [ "If the ideal", "is £2 and unit can", "move behind it", "67\") 24\")", "1.behind target" ].map( plain ) );
        expect( column.zoneRings ).toEqual( [ 6, 24 ] );
    } );

    it( "finishes a list cut off after vs, reads \"it there are\", and marks a bare target's lost icon", () => {
        const warnings: string[] = [];
        const column = parseAcesScanColumn( [ "it there are", "no enemies in", "© 24\") 30\")", "1. target", "2. intervening woods vs" ].map( plain ), warnings );
        expect( column.condition ).toMatch( /^If there are/ );
        expect( column.filters ).toEqual( [ "[?] target", "intervening woods vs [highest] other enemies" ] );
        expect( warnings.join( " " ) ).toMatch( /cut off and guessed/ );
    } );

    it( "still reads an odd ring when no even split fits, and two-digit card numbers", () => {
        const column = parseAcesScanColumn( [ "If the ideal", "is £2 and unit can", "move behind it", "15\") 21\")", "1.behind target" ].map( plain ) );
        expect( column.zoneRings ).toEqual( [ 15, 21 ] );
        expect( parseAcesScanFooter( "2/10 Striker" ) ).toBe( "2/10" );
        expect( parseAcesScanFooter( "A. 416 Scout (Hover)" ) ).toBe( "4/6" );
        expect( parseAcesScanFooter( "© 2025 The Topps" ) ).toBe( "" );
    } );

    it( "takes Armor lost's icon from another read of the photo when the colour is unknown", () => {
        expect( parseAcesScanCombat( [ "6\") 24\")", "1. Hit target's Rear", "2. Armor lost" ], [], [], "2. A Armor lost" ).filters[1].text ).toBe( "[highest] Armor lost" );
        expect( parseAcesScanCombat( [ "6\") 24\")", "1. Hit target's Rear", "2. Armor lost" ], [] ).filters[1].text ).toBe( "[?] Armor lost" );
    } );

    it( "sets a garbled target line to the nearest printed one", () => {
        const combat = parseAcesScanCombat( [ "6\") 24\")", "1. Hit targets Raar", "2. Attacked by aliy this turn" ], [] );
        expect( combat.filters.map( ( filter ) => filter.text ) ).toEqual( [ "Hit target's Rear", "Attacked by ally this turn" ] );
    } );

    it( "tells a 7 from a 1 by its width, with a 7's bar broken from its stem", () => {
        const box = ( x0: number, y0: number, w: number, h: number ) => ( { x0: x0, y0: y0, x1: x0 + w, y1: y0 + h } );
        const ink = [ box( 248, 0, 63, 125 ), box( 334, 0, 70, 127 ), box( 425, 0, 61, 45 ), box( 436, 40, 46, 87 ), box( 474, 3, 3, 0 ) ];
        expect( acesScanOnesAndSevens( "131", ink ) ).toBe( "737" );
        expect( acesScanOnesAndSevens( "717", [ box( 0, 0, 60, 120 ), box( 100, 0, 20, 120 ), box( 200, 0, 60, 120 ) ] ) ).toBe( "717" );
        expect( acesScanOnesAndSevens( "17", [ box( 0, 0, 60, 120 ) ] ) ).toBe( "17" );
    } );

    it( "matches a deck name with a letter or two misread", () => {
        expect( parseAcesScanHeader( "WHSSILE BOAT" ).deckId ).toBe( "missile-boat" );
        expect( parseAcesScanHeader( "+/1SSILE BOAT" ).deckId ).toBe( "missile-boat" );
        expect( parseAcesScanHeader( "-COUT (HOVER)" ) ).toEqual( { deck: "Scout (Hover)", deckId: "scout-hover", priority: null } );
        expect( parseAcesScanHeader( "SZBUT (HOVER)" ).deckId ).toBe( "scout-hover" );
        expect( parseAcesScanHeader( "~ 4UT (HOVER)" ).deckId ).toBe( "scout-hover" );
    } );

    it( "builds the OV rows from the TNs and the limit when other numbers creep in", () => {
        // 039: "OV" read as "2V", "TN10" as "TNTO".
        const combat = parseAcesScanCombat( [], [
            "If TN4 or less or if this unit is destroyed: Use maximum OV.",
            "If TNG or less and 2V might let unit hit target's structure: Use up to 1 OV.",
            "If TNTO or ice ss 2 unit has any heat: Don't attack.",
        ] );
        expect( combat.overheat.map( ( row ) => [ row.tnAtMost, row.tnAtLeast, row.ovLimit ] ) ).toEqual( [ [ 4, null, null ], [ 6, null, 1 ], [ null, 10, null ] ] );
    } );

    it( "splits target filters OCR ran together, and drops a trailing mark", () => {
        const combat = parseAcesScanCombat( [ "@6\") 24\")", "~ 1. Hit target's Rear 2. A Armor lost", "command list" ], [], [ null, null, "red" ] );
        expect( combat.filters.map( ( rule ) => rule.text ) ).toEqual( [ "Hit target's Rear", "[highest] Armor lost", "[red] command list" ] );
        const trailing = parseAcesScanCombat( [ "+ 1. Hit target's Rear ®", "2. Attacked by ally this turn" ], [] );
        expect( trailing.filters.map( ( rule ) => rule.text ) ).toEqual( [ "Hit target's Rear", "Attacked by ally this turn" ] );
    } );

    it( "takes the ▲ of \"Armor lost\" from its colour when OCR reads nothing", () => {
        const combat = parseAcesScanCombat( [ "1. Hit target's Rear", "2. Armor lost" ], [], [ null, "blue" ] );
        expect( combat.filters.map( ( rule ) => rule.text ) ).toEqual( [ "Hit target's Rear", "[highest] Armor lost" ] );
        expect( parseAcesScanCombat( [ "1. Armor lost" ], [] ).filters[0].text ).toBe( "[?] Armor lost" );
    } );
} );

describe( "Aces card scan: combat side", () => {
    const brawlerOverheat = [
        "If TNS or less or if this unit is destroyed: Use maximum OV.",
        "If TN7 or less and OV might let unit hit target's structure: Use up to 2 OV.",
        "If TN9 or more and this unit has any heat: Don't attack.",
    ];

    // Every card prints the same OV rows but for four numbers (Rekikire), so garbled words don't matter.
    it( "builds the standard OV rows from their four numbers, however the words read", () => {
        const combat = parseAcesScanCombat( [ "1. Hit target's Rear" ], [
            "lf TN5 or lass or if this umit is destroved: Use maximun OV,",
            "If TN7 or lees and OV migbt let unit hit",
            "targets structure: Use up to 20V.",
            "lf TN9 or more and tbis unit has any heaf: Dont attack.",
        ] );
        expect( combat.overheat.map( ( row ) => row.text ) ).toEqual( [
            "If TN5 or less or if this unit is destroyed: Use maximum OV.",
            "If TN7 or less and OV might let unit hit target's structure: Use up to 2 OV.",
            "If TN9 or more and this unit has any heat: Don't attack.",
        ] );
        expect( combat.overheat.map( ( row ) => [ row.tnAtMost, row.tnAtLeast, row.join, row.also, row.action, row.ovLimit ] ) ).toEqual( [
            [ 5, null, "or", "destroyed", "max", null ],
            [ 7, null, "and", "could-hit-structure", "up-to", 2 ],
            [ null, 9, "and", "has-heat", "no-attack", null ],
        ] );
    } );

    it( "reads the indirect fire reminder as a tick, not a target filter", () => {
        const combat = parseAcesScanCombat( [ "1. [lowest] Armor", "If there are no enemies in [?]: use indirect", "fire special order card" ], [] );
        expect( combat.indirectIfNoLOS ).toBe( true );
        expect( combat.filters.map( ( rule ) => rule.text ) ).toEqual( [ "[lowest] Armor" ] );
        expect( parseAcesScanCombat( [ "1. [lowest] Armor" ], [] ).indirectIfNoLOS ).toBe( false );
    } );

    it( "reads Brawler 3/6, whose command-list number reads as 0", () => {
        const combat = parseAcesScanCombat( [ "~ 1.Hit target's Rear", "2.0 command list" ], brawlerOverheat, [ null, "yellow" ] );
        expect( combat.filters.map( ( rule ) => rule.text ) ).toEqual( [ "Hit target's Rear", "[yellow] command list" ] );
        expect( combat.overheat.map( ( row ) => [ row.tnAtMost, row.tnAtLeast, row.action, row.ovLimit ] ) ).toEqual( [
            [ 5, null, "max", null ],
            [ 7, null, "up-to", 2 ],
            [ null, 9, "no-attack", null ],
        ] );
    } );

    it( "reads Scout (Hover) 3/6: a zone ring without its inch mark, an unnumbered command list", () => {
        // The first tag is the red rule under the zone, not a list.
        const combat = parseAcesScanCombat( [ "@6') 24)", "1. Hit ittarget's Rear", "+ command list" ], [], [ "red", null, "blue" ] );
        expect( combat.zoneRings ).toEqual( [ 6, 24 ] );
        expect( combat.filters.map( ( rule ) => rule.text ) ).toEqual( [ "Hit target's Rear", "[blue] command list" ] );
    } );

    it( "takes text before any number as the first filter", () => {
        const combat = parseAcesScanCombat( [ "Attacked by ally this tum", "2. command list" ], [], [ null, "red" ] );
        expect( combat.filters.map( ( rule ) => rule.text ) ).toEqual( [ "Attacked by ally this turn", "[red] command list" ] );
    } );
} );

describe( "Aces card scan: layout", () => {
    const width = 2084, height = 1500;

    it( "spaces the movement columns from the headers, filling a missing one", () => {
        const layout = findAcesCardLayout( [
            line( "AGGRESSIVE", 200, 322, 500, 366 ),
            // BALANCED unread
            line( "CAUTIOUS", 1550, 322, 1820, 366 ),
            line( "BATTLETECH ACES", 700, 1368, 1350, 1440 ),
        ], width, height )!;
        expect( layout.side ).toBe( "movement" );
        expect( layout.columns.length ).toBe( 3 );
        const centres = layout.columns.map( ( rect ) => rect.left + rect.width / 2 );
        expect( centres[1] ).toBeCloseTo( ( centres[0] + centres[2] ) / 2, -1 );
        expect( layout.columns[0].top ).toBeGreaterThan( 366 );
        expect( layout.columns[0].top + layout.columns[0].height ).toBeLessThanOrEqual( 1368 );
    } );

    it( "finds the combat side from COMBAT when TARGET is unread", () => {
        const layout = findAcesCardLayout( [
            line( "AMBUSHER (INFANTRY)", 90, 72, 900, 160 ),
            line( "COMBAT", 90, 180, 300, 240 ),
            line( "1. Anti-'Mech attack vs.", 110, 523, 700, 580 ),
        ], width, height )!;
        expect( layout.side ).toBe( "combat" );
        const panel = layout.columns[0];
        expect( panel.left ).toBeLessThan( 110 );
        expect( panel.left + panel.width ).toBeGreaterThan( 700 );
        expect( panel.top ).toBeLessThan( 523 );
    } );

    it( "takes lowercase \"target\" in a filter for no header", () => {
        expect( findAcesCardLayout( [ line( "1. Hit target's Rear", 110, 523, 700, 580 ) ], width, height ) ).toBeNull();
    } );
} );

describe( "Aces card scan: pixels", () => {
    it( "binarizes dark text and clears a panel's edge strip", () => {
        const width = 50, height = 20;
        const data: number[] = [];
        for( let y = 0; y < height; y++ ) {
            for( let x = 0; x < width; x++ ) {
                // A black border down the left, one black "letter" pixel in the middle, cream elsewhere.
                const ink = x < 2 || ( x === 25 && y === 10 );
                data.push( ...( ink ? [ 0, 0, 0, 255 ] : [ 240, 230, 200, 255 ] ) );
            }
        }
        const at = ( image: { data: Uint8ClampedArray, width: number }, x: number, y: number ) => image.data[( ( y + cardScanMargin ) * image.width + x + cardScanMargin ) * 4];
        const dark = cardScanBinarize( data, width, height, "dark" );
        expect( dark.width ).toBe( width + cardScanMargin * 2 );
        expect( at( dark, 0, 5 ) ).toBe( 0 );
        expect( at( dark, 25, 10 ) ).toBe( 0 );
        expect( at( dark, 10, 10 ) ).toBe( 255 );
        const panel = cardScanBinarize( data, width, height, "panel" );
        expect( at( panel, 0, 5 ) ).toBe( 255 );
        expect( at( panel, 25, 10 ) ).toBe( 0 );
    } );

    it( "tells tag colours from the card's gold", () => {
        expect( acesScanTagColour( cardScanColoursFromPixels( pixels( 100, [ 220, 30, 30 ] ) ) ) ).toBe( "red" );
        expect( acesScanTagColour( cardScanColoursFromPixels( pixels( 100, [ 20, 140, 190 ] ) ) ) ).toBe( "blue" );
        expect( acesScanTagColour( cardScanColoursFromPixels( pixels( 100, [ 250, 210, 10 ] ) ) ) ).toBe( "yellow" );
        // The gold condition boxes are less saturated than a YELLOW tag.
        expect( acesScanTagColour( cardScanColoursFromPixels( pixels( 100, [ 240, 190, 100 ] ) ) ) ).toBeNull();
        expect( cardScanColoursFromPixels( pixels( 100, [ 40, 180, 60 ] ) ).green ).toBe( 1 );
    } );

    it( "drops tall art lines and the copyright, and joins pieces of a row", () => {
        const lines = tidyAcesScanLines( [
            line( "1. Hit", 100, 500, 200, 540 ),
            line( "target's Rear", 210, 502, 400, 541 ),
            line( "2. command list", 100, 560, 400, 600 ),
            line( "= ii TBE & A fo", 100, 100, 700, 400 ),
            line( "©2025 The Topps Company", 1500, 1368, 1900, 1400 ),
        ] );
        expect( lines.map( ( entry ) => entry.text ) ).toEqual( [ "1. Hit target's Rear", "2. command list" ] );
    } );
} );

describe( "Aces card scan: whole card", () => {
    const width = 2084, height = 1500;
    const within = ( rect: ICardScanRect, y: number ) => y >= rect.top && y < rect.top + rect.height;

    // Brawler 3/6 combat, as the OCR reads its regions.
    const io: ICardScanIO = {
        width, height,
        recognize: async ( rect, mode ) => {
            if( mode === "plain" ) return [
                line( "BRAWLER", 90, 90, 500, 213 ),
                line( "COMBAT", 90, 190, 300, 240 ),
                line( "© TARGET", 230, 313, 640, 368 ),
                line( "PA, 3/6 Brawler BATTLETECH", 60, 1374, 1300, 1426 ),
            ];
            if( mode === "bright" ) return within( rect, 100 ) ? [ line( "BRAWLER", rect.left + 50, 90, rect.left + 500, 174 ) ] : [ line( "3/6 Brawler B TTLETE(", rect.left + 20, rect.top + 20, rect.left + 600, rect.top + 69 ) ];
            if( mode === "digits" ) return [ line( "253", rect.left + 100, 91, rect.left + 600, 238 ) ];
            if( mode === "panel" ) return [
                line( "~ 1.Hit target's Rear", rect.left + 60, rect.top + 156, rect.left + 500, rect.top + 216 ),
                line( "2.0 command list", rect.left + 60, rect.top + 251, rect.left + 500, rect.top + 313 ),
            ];
            return [
                line( "If TNS or less or if this unit is destroyed: Use maximum OV.", rect.left, rect.top + 104, rect.left + 1500, rect.top + 161 ),
                line( "If TN7 or less and OV might let unit hit target's structure: Use up to 2 OV.", rect.left, rect.top + 196, rect.left + 1500, rect.top + 253 ),
                line( "If TN9 or more and this unit has any heat: Don't attack.", rect.left, rect.top + 287, rect.left + 1500, rect.top + 344 ),
            ];
        },
        // The YELLOW tag sits on the command list row.
        colours: ( rect ) => rect.top > 600 && rect.top < 700 ? { ...none, yellow: 0.2 } : none,
        pixels: () => [],
    };

    it( "scans Brawler 3/6 combat and fills a card for review", async () => {
        const scan = await scanAcesCard( io );
        expect( scan.side ).toBe( "combat" );
        expect( scan.deckId ).toBe( "brawler" );
        expect( scan.priority ).toBe( 253 );
        expect( scan.cardNumber ).toBe( "3/6" );
        expect( scan.combat!.filters.map( ( rule ) => rule.text ) ).toEqual( [ "Hit target's Rear", "[yellow] command list" ] );
        expect( scan.combat!.overheat.length ).toBe( 3 );
        expect( scan.warnings.some( ( warning ) => /priority number/.test( warning ) ) ).toBe( true );

        const card = applyAcesScanToCard( null, scan );
        expect( card.deck ).toBe( "Brawler" );
        expect( card.combatPriority ).toBe( 253 );
        expect( card.combat.filters.length ).toBe( 2 );
        // A scan never overwrites what the card already says about its deck, and leaves the other side alone.
        const existing = applyAcesScanToCard( acesSampleBrawler383, scan );
        expect( existing.aggressive ).toEqual( acesSampleBrawler383.aggressive );
        expect( existing.combatPriority ).toBe( 253 );
    } );

    it( "warns of a TN no roll could need", async () => {
        const misread: ICardScanIO = {
            ...io,
            recognize: async ( rect, mode, scale ) => {
                const lines = await io.recognize( rect, mode, scale );
                return mode === "dark" ? lines.map( ( entry ) => ( { ...entry, text: entry.text.replace( "TN9", "TN0" ) } ) ) : lines;
            },
        };
        const scan = await scanAcesCard( misread );
        expect( scan.warnings.some( ( warning ) => /TN numbers/.test( warning ) ) ).toBe( true );
        expect( ( await scanAcesCard( io ) ).warnings.some( ( warning ) => /TN numbers/.test( warning ) ) ).toBe( false );
    } );

    it( "warns when it can't find the card's layout", async () => {
        const scan = await scanAcesCard( { ...io, recognize: async () => [] } );
        expect( scan.side ).toBeNull();
        expect( scan.warnings.length ).toBe( 1 );
    } );
} );

describe( "Card photo straightening", () => {
    // White with black text-like bars, sloping by the given degrees down to the right.
    const lines = ( degrees: number ) => {
        const width = 800, height = 600, data = new Uint8ClampedArray( width * height * 4 ).fill( 255 );
        const slope = Math.tan( degrees * Math.PI / 180 );
        for( let row = 100; row < 500; row += 40 ) for( let x = 100; x < 700; x++ ) for( let t = 0; t < 8; t++ ) {
            const y = Math.round( row + t + ( x - 400 ) * slope );
            if( ( x % 50 ) < 40 ) data.fill( 0, ( y * width + x ) * 4, ( y * width + x ) * 4 + 3 );
        }
        return { data, width, height };
    };
    it( "measures a slanted photo's slope and levels it", () => {
        for( const degrees of [ 4, -6.5 ] ) {
            const photo = lines( degrees );
            const skew = cardScanSkew( photo.data, photo.width, photo.height );
            expect( Math.abs( skew - degrees ) ).toBeLessThanOrEqual( 0.5 );
            const level = cardScanRotate( photo.data, photo.width, photo.height, skew );
            expect( Math.abs( cardScanSkew( level.data, level.width, level.height ) ) ).toBeLessThanOrEqual( 0.5 );
        }
    } );
    it( "leaves a level photo, and one with no lines, alone", () => {
        const level = lines( 0 );
        expect( cardScanSkew( level.data, level.width, level.height ) ).toBe( 0 );
        expect( cardScanSkew( new Uint8ClampedArray( 400 * 300 * 4 ).fill( 255 ), 400, 300 ) ).toBe( 0 );
    } );
} );

describe( "Card photo quarter-turn retry", () => {
    // A 4x2 card, upright, marked by its one bright top-left pixel.
    const upright = (): ICardScanImage => {
        const data = new Uint8ClampedArray( 4 * 2 * 4 ).fill( 0 );
        data[0] = 200;
        return { data, width: 4, height: 2 };
    };
    const turned = ( quarters: 1 | 2 | 3 ): ICardScanImage => {
        const card = upright();
        return cardScanTurn( card.data, card.width, card.height, quarters );
    };
    // A stand-in for a card reader: it finds the card only when the photo is landscape with the mark at the top left.
    const makeIO = ( image: ICardScanImage ): ICardScanIO => ( {
        width: image.width, height: image.height,
        recognize: async () => [],
        colours: () => none,
        pixels: ( rect ) => Array.from( image.data ).slice( ( rect.top * image.width + rect.left ) * 4, ( rect.top * image.width + rect.left + 1 ) * 4 ),
    } );
    const options = { shape: "landscape" as const, found: ( result: { found: boolean } ) => result.found };
    const run = async ( image: ICardScanImage, withOptions = true ) => {
        const calls: number[] = [];
        const scan = async ( io: ICardScanIO ) => {
            const found = io.width > io.height && io.pixels( { left: 0, top: 0, width: 1, height: 1 } )[0] === 200;
            calls.push( found ? 1 : 0 );
            return { found, width: io.width, height: io.height };
        };
        const result = await scanWithTurns( image, makeIO, scan, withOptions ? options : undefined );
        return { result, calls };
    };

    it( "reads an upright photo once", async () => {
        const { result, calls } = await run( upright() );
        expect( result.found ).toBe( true );
        expect( calls ).toEqual( [ 1 ] );
    } );

    it( "turns a sideways photo a quarter first, then the other way", async () => {
        // Turned three quarters: one more quarter puts it upright.
        const anticlockwise = await run( turned( 3 ) );
        expect( anticlockwise.result.found ).toBe( true );
        expect( anticlockwise.calls ).toEqual( [ 1 ] );
        // Turned one quarter: the first try is upside down, the second upright.
        const clockwise = await run( turned( 1 ) );
        expect( clockwise.result.found ).toBe( true );
        expect( clockwise.calls ).toEqual( [ 0, 1 ] );
    } );

    it( "turns an upside-down photo round", async () => {
        const { result, calls } = await run( turned( 2 ) );
        expect( result.found ).toBe( true );
        expect( calls ).toEqual( [ 0, 1 ] );
    } );

    it( "stops after three tries and returns the first", async () => {
        const blank: ICardScanImage = { data: new Uint8ClampedArray( 2 * 4 * 4 ), width: 2, height: 4 };
        const { result, calls } = await run( blank );
        expect( calls ).toEqual( [ 0, 0, 0 ] );
        // The first try was turned a quarter, to landscape.
        expect( [ result.width, result.height ] ).toEqual( [ 4, 2 ] );
    } );

    it( "reads once, as it is, with no options", async () => {
        const { result, calls } = await run( turned( 2 ), false );
        expect( result.found ).toBe( false );
        expect( calls ).toEqual( [ 0 ] );
    } );
} );
