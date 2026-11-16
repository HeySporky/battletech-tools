import { describe, expect, it } from "vitest";
import {
    acesEdgeCardForName,
    acesDeckIdFromName,
    acesLines,
    acesTextToPlain,
    formatAcesCommandOrderLine,
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
    newAcesEdgeCard,
    normalizeAcesEdgeCard,
    validateAcesEdgeCard,
    newAcesCardLibrary,
    newAcesScenario,
    normalizeAcesCardLibrary,
    normalizeAcesPriorityRule,
    parseAcesText,
    validateAcesCard,
    validateAcesCommandCard,
    validateAcesScenario,
} from "./aces-cards";
import { acesSampleEdgeCard, acesSampleBattleROMReview, acesSampleBrawler383, acesSampleSniper475, acesSampleStarCaptainB, getAcesSampleLibrary } from "./aces-card-samples";

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

    it("loads the line-of-sight target filters, off for cards saved before them (#591)", () => {
        const library = getAcesSampleLibrary();
        const saved = JSON.parse( JSON.stringify( library ) );
        delete saved.cards[0].aggressive.targetInLOS;
        delete saved.cards[0].aggressive.targetNoLOS;
        saved.cards[0].balanced.targetInLOS = true;
        saved.cards[0].cautious.targetNoLOS = true;
        const loaded = normalizeAcesCardLibrary( saved );
        expect( loaded.cards[0].aggressive.targetInLOS ).toBe( false );
        expect( loaded.cards[0].aggressive.targetNoLOS ).toBe( false );
        expect( loaded.cards[0].balanced.targetInLOS ).toBe( true );
        expect( loaded.cards[0].cautious.targetNoLOS ).toBe( true );
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

describe("Aces Edge cards", () => {
    it("loads an old library without edgeCards as an empty list", () => {
        const old = JSON.parse( JSON.stringify( getAcesSampleLibrary() ) );
        delete old.edgeCards;
        expect( normalizeAcesCardLibrary( old ).edgeCards ).toEqual( [] );
        expect( newAcesCardLibrary().edgeCards ).toEqual( [] );
    });

    it("merges Edge cards by id", () => {
        const base = newAcesCardLibrary();
        base.edgeCards = [ { ...newAcesEdgeCard(), id: "kite", name: "Kite Day" } ];
        const incoming = newAcesCardLibrary();
        incoming.edgeCards = [ { ...newAcesEdgeCard(), id: "kite", name: "Kite Night" }, { ...newAcesEdgeCard(), id: "pot", name: "Teapot" } ];
        const merged = mergeAcesCardLibrary( base, incoming );
        expect( merged.edgeCards.map( ( card ) => card.name ) ).toEqual( [ "Kite Night", "Teapot" ] );
    });

    it("flags an empty name and an out-of-range cost", () => {
        expect( validateAcesEdgeCard( newAcesEdgeCard() ) ).toContain( "Name is missing." );
        const card = { ...newAcesEdgeCard(), name: "Kite Day" };
        expect( validateAcesEdgeCard( card ) ).toEqual( [] );
        expect( validateAcesEdgeCard( { ...card, cost: 0 } ) ).toEqual( [] );
        expect( validateAcesEdgeCard( { ...card, cost: 9 } ) ).toEqual( [] );
        expect( validateAcesEdgeCard( { ...card, cost: 10 } ).length ).toBe( 1 );
        expect( validateAcesEdgeCard( { ...card, cost: -1 } ).length ).toBe( 1 );
        expect( validateAcesEdgeCard( { ...card, cost: 2.5 } ).length ).toBe( 1 );
    });

    it("normalizes odd records and round-trips", () => {
        expect( normalizeAcesEdgeCard( null ) ).toBeNull();
        expect( normalizeAcesEdgeCard( { name: 7 } ) ).toBeNull();
        const card = normalizeAcesEdgeCard( { name: "Teapot", phase: "bogus", trigger: "bogus", cost: "3", text: "A teapot whistles." } )!;
        expect( card.phase ).toBe( "any" );
        expect( card.trigger ).toBe( "none" );
        expect( card.cost ).toBe( 3 );
        expect( card.id ).not.toBe( "" );
        expect( normalizeAcesEdgeCard( JSON.parse( JSON.stringify( card ) ) ) ).toEqual( card );
    });

    it("ships one sample of ours, marked not official", () => {
        const library = getAcesSampleLibrary();
        expect( library.edgeCards.length ).toBe( 1 );
        expect( library.edgeCards[0] ).toEqual( acesSampleEdgeCard );
        expect( acesSampleEdgeCard.sample ).toBe( true );
        expect( acesSampleEdgeCard.notes ).toContain( "NOT OFFICIAL" );
        expect( validateAcesEdgeCard( acesSampleEdgeCard ) ).toEqual( [] );
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
        expect( parseAcesPriorityLine( "[highest] Starting Armor" ) ).toEqual( { text: "[highest] Starting Armor", stat: "armor-start", direction: "highest" } );
        expect( parseAcesPriorityLine( "[lowest] Starting Structure" ).stat ).toBe( "structure-start" );
        expect( parseAcesPriorityLine( "[highest] [M] damage" ) ).toMatchObject( { stat: "damage-m", direction: "highest" } );
        expect( parseAcesPriorityLine( "[highest] [S] damage" ).stat ).toBe( "damage-s" );
        expect( parseAcesPriorityLine( "no Armor" ) ).toEqual( { text: "no Armor", noArmor: true } );
        expect( normalizeAcesPriorityRule( { text: "no Armor", noArmor: true } )?.noArmor ).toBe( true );
        expect( parseAcesPriorityLine( "Hit target's Rear" ).stat ).toBeUndefined();
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

    it("keeps an order's movement filter, phase-less orders and 'Maintain this strategy' (#602)", () => {
        const filterLine = "movement | When your crippled units use Forced Withdrawal, add the following movement filter | 0. cover vs [highest] enemies";
        const order = parseAcesCommandOrderLine( filterLine )!;
        expect( order.behavior ).toBeNull();
        expect( order.filter ).toBe( "0. cover vs [highest] enemies" );
        expect( formatAcesCommandOrderLine( order ) ).toBe( filterLine );
        expect( parseAcesCommandOrderLine( "movement | All units use Aggressive | aggressive" )!.filter ).toBe( "" );
        const plain = parseAcesCommandOrderLine( "For the rest of the sortie, all units are in Forced Withdrawal" )!;
        expect( plain.phase ).toBe( "any" );
        expect( plain.text ).toBe( "For the rest of the sortie, all units are in Forced Withdrawal" );
        expect( formatAcesCommandOrderLine( plain ) ).toBe( "any | For the rest of the sortie, all units are in Forced Withdrawal" );
        const maintain = parseAcesStrategyLine( "Maintain this strategy" )!;
        expect( maintain.auto ).toBe( "maintain" );
        expect( validateAcesCommandCard( { ...acesSampleStarCaptainB, strategy: [ maintain ] } ) ).toEqual( [] );
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

describe( "acesEdgeCardForName", () => {
    const card = newAcesEdgeCard();
    card.name = "Kite Day";
    it( "matches ignoring case, edge spaces and inner space runs", () => {
        expect( acesEdgeCardForName( [ card ], "kite day " ) ).toBe( card );
        expect( acesEdgeCardForName( [ card ], "KITE   DAY" ) ).toBe( card );
    } );
    it( "returns nothing for other or blank names", () => {
        expect( acesEdgeCardForName( [ card ], "Teapot Luck" ) ).toBeUndefined();
        expect( acesEdgeCardForName( [ card ], "  " ) ).toBeUndefined();
    } );
} );
