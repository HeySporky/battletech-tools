import { describe, expect, it } from "vitest";
import {
    acesDeckIdFromName,
    acesLines,
    acesTextToPlain,
    formatAcesDeckOrderLine,
    formatAcesObjectiveLine,
    formatAcesPriorityLine,
    formatAcesScenarioUnitLine,
    parseAcesCommandOrderLine,
    parseAcesDeckOrderLine,
    parseAcesObjectiveLine,
    parseAcesOverheatLine,
    parseAcesPriorityLine,
    parseAcesScenarioUnitLine,
    parseAcesSpecialRuleLine,
    parseAcesStrategyLine,
    parseAcesWaypointLine,
    parseAcesZone,
    mergeAcesCardLibrary,
    newAcesCard,
    newAcesCardLibrary,
    newAcesScenario,
    normalizeAcesCardLibrary,
    parseAcesText,
    validateAcesCard,
    validateAcesCommandCard,
    validateAcesScenario,
} from "./aces-cards";
import { acesSampleBattleROMReview, acesSampleBrawler383, acesSampleSniper475, acesSampleStarCaptainB, getAcesSampleLibrary } from "./aces-card-samples";

describe("Aces card text", () => {
    it("splits icon tokens out of printed text", () => {
        const segments = parseAcesText( "in [lowest] enemy [range]" );
        expect( segments.filter( ( segment ) => segment.kind === "icon" ).map( ( segment ) => segment.value ) ).toEqual( [ "lowest", "range" ] );
        expect( acesTextToPlain( "cover vs [highest] enemies" ) ).toBe( "cover vs ▲ enemies" );
    });

    it("leaves unknown brackets as plain text", () => {
        const segments = parseAcesText( "see [p.12]" );
        expect( segments.every( ( segment ) => segment.kind === "text" ) ).toBe( true );
    });
});

describe("Aces card library", () => {
    it("ships one cited sample of each record type (Aces pp.8, 16-20; Aces SS pp.4-7)", () => {
        const library = getAcesSampleLibrary();
        expect( library.cards.length ).toBeGreaterThan( 0 );
        expect( library.commandCards.length ).toBeGreaterThan( 0 );
        expect( library.specialOrders.length ).toBeGreaterThan( 0 );
        expect( library.scenarios.length ).toBeGreaterThan( 0 );
        const all = [ ...library.cards, ...library.commandCards, ...library.specialOrders, ...library.scenarios ];
        for( const record of all ) {
            expect( record.sample ).toBe( true );
            expect( record.source ).not.toBeNull();
            expect( record.source!.page ).toBeGreaterThan( 0 );
        }
    });

    it("validates the samples as usable", () => {
        const library = getAcesSampleLibrary();
        for( const card of library.cards ) expect( validateAcesCard( card ) ).toEqual( [] );
        for( const card of library.commandCards ) expect( validateAcesCommandCard( card ) ).toEqual( [] );
        for( const scenario of library.scenarios ) expect( validateAcesScenario( scenario ) ).toEqual( [] );
    });

    it("reports what a blank card is missing", () => {
        expect( validateAcesCard( newAcesCard() ).length ).toBeGreaterThan( 0 );
        expect( validateAcesScenario( newAcesScenario() ).length ).toBeGreaterThan( 0 );
    });

    it("round-trips through JSON and drops junk", () => {
        const library = getAcesSampleLibrary();
        const copy = normalizeAcesCardLibrary( JSON.parse( JSON.stringify( library ) ) );
        expect( copy ).toEqual( library );
        const junk = normalizeAcesCardLibrary( { cards: [ null, 7, "x" ], scenarios: "nope" } );
        expect( junk.cards ).toEqual( [] );
        expect( junk.scenarios ).toEqual( [] );
        expect( normalizeAcesCardLibrary( undefined ) ).toEqual( newAcesCardLibrary() );
    });

    it("merges imports by id, replacing matches", () => {
        const base = getAcesSampleLibrary();
        const incoming = newAcesCardLibrary();
        const edited = { ...JSON.parse( JSON.stringify( acesSampleSniper475 ) ), notes: "edited" };
        const added = { ...newAcesCard(), id: "my-card", deck: "Sniper", movePriority: 535, combatPriority: 535 };
        incoming.cards = [ edited, added ];
        incoming.scenarios = [ { ...acesSampleBattleROMReview, name: "Renamed" } ];
        const merged = mergeAcesCardLibrary( base, incoming );
        expect( merged.cards.length ).toBe( base.cards.length + 1 );
        expect( merged.cards.find( ( card ) => card.id === acesSampleSniper475.id )!.notes ).toBe( "edited" );
        expect( merged.scenarios.length ).toBe( 1 );
        expect( merged.scenarios[0].name ).toBe( "Renamed" );
    });

    it("keeps the tutorial deck order as printed (Aces SS p.5)", () => {
        expect( acesSampleBattleROMReview.deckOrder[1].cards ).toEqual( [ "475", "535", "265", "625", "785", "345" ] );
        expect( acesSampleBattleROMReview.turnLimit ).toBe( 5 );
    });
});

describe("Aces typed lines (library editor)", () => {
    it("reads target-list lines the way the samples store them (Aces p.8)", () => {
        for( const list of [ acesSampleStarCaptainB.red, acesSampleStarCaptainB.yellow, acesSampleStarCaptainB.blue, acesSampleSniper475.combat.filters ] ) {
            for( const rule of list ) {
                expect( parseAcesPriorityLine( formatAcesPriorityLine( rule ) ) ).toEqual( rule );
            }
        }
        expect( parseAcesPriorityLine( "? hidden line" ) ).toEqual( { text: "hidden line", unresolved: true } );
    });

    it("reads printed OV rows (Aces SS pp.6-7)", () => {
        for( const row of [ ...acesSampleSniper475.combat.overheat, ...acesSampleBrawler383.combat.overheat ] ) {
            expect( parseAcesOverheatLine( row.text ) ).toEqual( row );
        }
        expect( parseAcesOverheatLine( "Something without an action" ) ).toBeNull();
    });

    it("reads Zones, orders and strategy rows", () => {
        expect( parseAcesZone( "12\" 18\" 24\"" ) ).toEqual( { zoneRings: [ 12, 18, 24 ], zoneKeyword: "" } );
        expect( parseAcesZone( "Nearest" ) ).toEqual( { zoneRings: [], zoneKeyword: "nearest" } );
        const order = parseAcesCommandOrderLine( "initiative | " + acesSampleStarCaptainB.orders[0].text );
        expect( order ).toEqual( acesSampleStarCaptainB.orders[0] );
        expect( parseAcesCommandOrderLine( "movement | All units use Aggressive | aggressive" )!.behavior ).toBe( "aggressive" );
        for( const row of acesSampleStarCaptainB.strategy ) {
            expect( parseAcesStrategyLine( row.letter + " | " + row.text ) ).toEqual( row );
        }
        expect( acesLines( "a\n\n b \r\nc" ) ).toEqual( [ "a", "b", "c" ] );
    });

    it("reads sortie lines the way the tutorial sample stores them (Aces SS pp.4-5)", () => {
        const scenario = acesSampleBattleROMReview;
        for( const unit of [ ...scenario.playerUnits, ...scenario.opposingUnits ] ) {
            expect( parseAcesScenarioUnitLine( formatAcesScenarioUnitLine( unit ) ) ).toEqual( unit );
        }
        for( const objective of scenario.objectives ) {
            expect( parseAcesObjectiveLine( formatAcesObjectiveLine( objective ) ) ).toEqual( objective );
        }
        for( const order of scenario.deckOrder ) {
            expect( parseAcesDeckOrderLine( formatAcesDeckOrderLine( order ) ) ).toEqual( order );
        }
        expect( parseAcesWaypointLine( "3 | J | Reveal the token" ) ).toEqual( { turn: 3, label: "J", text: "Reveal the token" } );
        expect( parseAcesSpecialRuleLine( "setup | Night | Visibility is reduced" )!.phase ).toBe( "setup" );
        expect( acesDeckIdFromName( "Scout (Hover)" ) ).toBe( "scout-hover" );
        expect( acesDeckIdFromName( "Nonsense" ) ).toBe( "" );
    });
});
