import { describe, expect, it } from "vitest";
import { acesSampleBattleROMReview, acesSampleSniper475, getAcesSampleLibrary } from "../data/aces-card-samples";
import { AcesGame } from "./aces-game";
import AlphaStrikeForce from "./alpha-strike-force";
import { AlphaStrikeUnit } from "./alpha-strike-unit";

const makeUnit = ( name: string, role: string, pv: number, moveType: string = "" ): AlphaStrikeUnit => {
    const unit = new AlphaStrikeUnit();
    unit.name = name;
    unit.class = name;
    unit.role = role;
    unit.type = "BM";
    unit.size = 2;
    unit.armor = 4;
    unit.structure = 4;
    unit.basePoints = pv;
    unit.currentPoints = pv;
    unit.move = [ { move: 8, currentMove: 8, type: moveType } ];
    unit.damage = { short: 3, medium: 3, long: 1, extreme: 0, shortMinimal: false, mediumMinimal: false, longMinimal: false, extremeMinimal: false };
    unit.calcCurrentValues();
    return unit;
}

const byName = ( game: AcesGame, name: string ): AlphaStrikeUnit => {
    return game.getAutomatedUnits().find( ( unit ) => unit.name === name )!;
}

const makeGame = ( units: AlphaStrikeUnit[] ): AcesGame => {
    const force = new AlphaStrikeForce();
    for( const unit of units ) {
        force.addToGroup( unit, 0 );
    }
    const game = new AcesGame();
    game.setAutomatedForce( force );
    return game;
}

describe("Aces game tracker", () => {
    it("copies the automated force with new unit ids and suggests decks by role (Aces p.10)", () => {
        const brawler = makeUnit( "Thunderbolt", "Brawler", 38 );
        const game = makeGame( [ brawler, makeUnit( "Jenner", "Striker", 25 ) ] );
        const units = game.getAutomatedUnits();
        expect( units.length ).toBe( 2 );
        expect( units.some( ( unit ) => unit.uuid === brawler.uuid ) ).toBe( false );
        const decks = units.map( ( unit ) => game.getUnitState( unit.uuid ).deckId ).sort();
        expect( decks ).toEqual( [ "brawler", "striker" ] );
    });

    it("splits one Brawler deck between two Brawlers and reshuffles after three cards (Aces pp.19, 38)", () => {
        const game = makeGame( [ makeUnit( "A", "Brawler", 30 ), makeUnit( "B", "Brawler", 32 ) ] );
        const a = byName( game, "A" );
        const b = byName( game, "B" );
        expect( game.getUnitState( a.uuid ).cardsInDeck ).toBe( 3 );
        expect( game.getUnitState( b.uuid ).cardsInDeck ).toBe( 3 );
        expect( game.cycleCard( a.uuid ) ).toBe( false );
        expect( game.cycleCard( a.uuid ) ).toBe( false );
        expect( game.cycleCard( a.uuid ) ).toBe( true );
        expect( game.getUnitState( a.uuid ).cardsCycled ).toBe( 0 );

        // With two Brawler decks owned, each unit keeps a full six-card deck.
        game.decksOwned["brawler"] = 2;
        game.dealDeck( "brawler" );
        expect( game.getUnitState( a.uuid ).cardsInDeck ).toBe( 6 );
    });

    it("orders movement by priority with Forced Withdrawal and tokens, and discards tokens after moving", () => {
        const game = makeGame( [ makeUnit( "A", "Brawler", 30 ), makeUnit( "B", "Sniper", 32 ), makeUnit( "C", "Scout", 20 ) ] );
        const a = byName( game, "A" );
        const b = byName( game, "B" );
        const c = byName( game, "C" );
        game.getUnitState( a.uuid ).movePriority = 383;
        game.getUnitState( b.uuid ).movePriority = 625;
        game.getUnitState( b.uuid ).forcedWithdrawal = true;
        game.getUnitState( c.uuid ).movePriority = 93;
        expect( game.assignToken( c.uuid, "move-last" ) ).toBe( true );
        expect( game.assignToken( b.uuid, "move-first" ) ).toBe( false );
        expect( game.getMovementQueue().map( ( unit ) => unit.name ) ).toEqual( [ "B", "A", "C" ] );

        game.markMoved( c.uuid );
        expect( game.getUnitState( c.uuid ).token ).toBe( null );
        expect( game.getMovementQueue().map( ( unit ) => unit.name ) ).toEqual( [ "B", "A" ] );
    });

    it("builds the front-loaded move order from the Initiative result (Aces p.6)", () => {
        const game = makeGame( [ makeUnit( "A", "Brawler", 30 ), makeUnit( "B", "Brawler", 30 ), makeUnit( "C", "Scout", 20 ) ] );
        game.playerUnitsAbleToMove = 7;
        game.setInitiativeWinner( "player" );
        const order = game.getMoveOrder();
        expect( order[0] ).toEqual( [ { side: "automated", count: 1 }, { side: "player", count: 3 } ] );
    });

    it("applies the campaign Initiative penalties (Aces p.32)", () => {
        const game = makeGame( [ makeUnit( "A", "Brawler", 30 ) ] );
        game.campaignId = "campaign";
        game.setInitiativeWinner( "automated" );
        game.nextTurn();
        expect( game.getInitiativeModifiers( "automated" ).map( ( mod ) => mod.value ) ).toEqual( [ -2 ] );
        expect( game.getInitiativeModifiers( "player" ) ).toEqual( [] );
        game.automatedCommanderUUID = game.getAutomatedUnits()[0].uuid;
        game.getAutomatedUnits()[0].currentStructure = [ true, true, true, true ];
        expect( game.isAutomatedCommanderDestroyed() ).toBe( true );
    });

    it("puts crippled units under Forced Withdrawal in the End Phase when the sortie uses it (Aces pp.16, 32)", () => {
        const game = makeGame( [ makeUnit( "A", "Brawler", 30 ) ] );
        game.forcedWithdrawal = true;
        const unit = game.getAutomatedUnits()[0];
        unit.currentArmor = [ true, true, true, true ];
        unit.currentStructure = [ true, true, false, false ];
        const crippled = game.checkCrippled();
        expect( crippled.length ).toBe( 1 );
        expect( game.getUnitState( unit.uuid ).forcedWithdrawal ).toBe( true );
    });

    it("round-trips through export and import", () => {
        const game = makeGame( [ makeUnit( "A", "Brawler", 30 ) ] );
        const id = game.getAutomatedUnits()[0].uuid;
        game.getUnitState( id ).movePriority = 213;
        game.scenario.scenarioId = 3;
        const restored = new AcesGame( JSON.parse( JSON.stringify( game.export() ) ) );
        expect( restored.getAutomatedUnits()[0].uuid ).toBe( id );
        expect( restored.getUnitState( id ).movePriority ).toBe( 213 );
        expect( restored.getUnitState( id ).deckId ).toBe( "brawler" );
        expect( restored.scenario.scenarioId ).toBe( 3 );
        // Old or partial saves still load.
        const partial = new AcesGame( { version: 1 } as never );
        expect( partial.phase ).toBe( "initiative" );
    });
});

describe("Aces game: card library, sorties, dice and transport", () => {
    it("deals virtual piles from the card library and stacks the tutorial order (Aces SS p.5)", () => {
        const game = makeGame( [ makeUnit( "Pouncer", "Sniper", 40 ), makeUnit( "Timber Wolf", "Brawler", 73 ) ] );
        const library = getAcesSampleLibrary();
        const warnings = game.loadScenario( acesSampleBattleROMReview, library );
        const pouncer = byName( game, "Pouncer" );
        const state = game.getUnitState( pouncer.uuid );
        expect( state.deckId ).toBe( "sniper" );
        expect( game.getTopCard( pouncer.uuid, library )!.movePriority ).toBe( 475 );
        expect( state.movePriority ).toBe( 475 );
        expect( game.turnLimit ).toBe( 5 );
        expect( game.commandCard ).toBe( "C" );
        // Only one card of each deck ships as a sample; the rest must come from the players' own cards.
        expect( warnings.some( ( line ) => line.indexOf( "535" ) > -1 ) ).toBe( true );
    });

    it("cycles the top library card under the pile", () => {
        const game = makeGame( [ makeUnit( "Pouncer", "Sniper", 40 ) ] );
        const library = getAcesSampleLibrary();
        library.cards.push( { ...JSON.parse( JSON.stringify( acesSampleSniper475 ) ), id: "my-535", movePriority: 535, combatPriority: 535 } );
        game.setDeckPoolsFromLibrary( library );
        const pouncer = byName( game, "Pouncer" );
        game.stackDeck( pouncer.uuid, [ "475", "535" ], library );
        game.cycleCard( pouncer.uuid );
        expect( game.getTopCard( pouncer.uuid, library )!.movePriority ).toBe( 535 );
    });

    it("ends the sortie after the final turn or when the primary objective is complete (Aces p.32)", () => {
        const game = makeGame( [ makeUnit( "Pouncer", "Sniper", 40 ) ] );
        game.loadScenario( acesSampleBattleROMReview );
        expect( game.isSortieOver().over ).toBe( false );
        game.objectives[0].complete = true;
        expect( game.isSortieOver().over ).toBe( true );
        game.objectives[0].complete = false;
        game.turn = 6;
        expect( game.isSortieOver().reason ).toContain( "Final turn" );
    });

    it("rolls Initiative from the saved seed, so a reload rolls the same", () => {
        const game = makeGame( [ makeUnit( "A", "Brawler", 30 ) ] );
        game.rng = { seed: 99, calls: 0 };
        const copy = new AcesGame( JSON.parse( JSON.stringify( game.export() ) ) );
        expect( copy.rollInitiative() ).toEqual( game.rollInitiative() );
        expect( copy.rng ).toEqual( game.rng );
    });

    it("loads a version 1 save with the new fields defaulted", () => {
        const game = makeGame( [ makeUnit( "A", "Brawler", 30 ) ] );
        const data = JSON.parse( JSON.stringify( game.export() ) );
        data.version = 1;
        for( const key of [ "ruleset", "rng", "turnLimit", "waypoints", "objectives", "specialOrders", "deckPools" ] ) delete data[key];
        for( const state of data.unitStates ) {
            delete state.cardIds;
            delete state.transportedBy;
        }
        const loaded = new AcesGame( data );
        expect( loaded.ruleset ).toBe( "aces" );
        expect( loaded.turnLimit ).toBeNull();
        expect( loaded.unitStates[0].cardIds ).toEqual( [] );
        expect( loaded.unitStates[0].transportedBy ).toBe( "" );
    });

    it("mounts infantry by IT/CAR capacity and keeps passengers out of the move order (Aces pp.5-6)", () => {
        const apc = makeUnit( "APC", "Transport", 20 );
        apc.type = "CV";
        apc.abilities = [ "IT2" ];
        const squad1 = makeUnit( "Squad 1", "Ambusher", 10 );
        squad1.type = "CI";
        squad1.abilities = [ "CAR1" ];
        const squad2 = makeUnit( "Squad 2", "Ambusher", 10 );
        squad2.type = "CI";
        squad2.abilities = [ "CAR2" ];
        const game = makeGame( [ apc, squad1, squad2 ] );
        const transport = byName( game, "APC" );
        const first = byName( game, "Squad 1" );
        const second = byName( game, "Squad 2" );
        expect( game.mount( first.uuid, transport.uuid, true ).ok ).toBe( false );
        expect( game.mount( first.uuid, transport.uuid, false ).ok ).toBe( true );
        expect( game.mount( second.uuid, transport.uuid, false ).ok ).toBe( false );
        expect( game.getAutomatedUnitsAbleToMove() ).toBe( 2 );
        game.nextPhase();
        game.nextPhase();
        expect( game.getCombatQueue().some( ( unit ) => unit.uuid === first.uuid ) ).toBe( false );
        expect( game.dismount( first.uuid, false ).ok ).toBe( false );
        game.nextTurn();
        expect( game.dismount( first.uuid, true ).ok ).toBe( false );
        expect( game.dismount( first.uuid, false ).ok ).toBe( true );
    });

    it("battle armor with MEC rides one Omni unit and survives its destruction (Aces p.5)", () => {
        const omni = makeUnit( "Omni", "Brawler", 40 );
        omni.abilities = [ "OMNI" ];
        const ba = makeUnit( "Elementals", "Ambusher", 15 );
        ba.type = "BA";
        ba.abilities = [ "MEC" ];
        const game = makeGame( [ omni, ba ] );
        const carrier = byName( game, "Omni" );
        const rider = byName( game, "Elementals" );
        expect( game.mount( rider.uuid, carrier.uuid, false ).ok ).toBe( true );
        const lines = game.handleTransportDestroyed( carrier.uuid );
        expect( lines[0] ).toContain( "base contact" );
        expect( rider.isWrecked() ).toBe( false );
    });

    it("kills infantry carried inside a destroyed transport (Aces p.5)", () => {
        const apc = makeUnit( "APC", "Transport", 20 );
        apc.type = "CV";
        apc.abilities = [ "IT2" ];
        const squad = makeUnit( "Squad", "Ambusher", 10 );
        squad.type = "CI";
        squad.abilities = [ "CAR2" ];
        const game = makeGame( [ apc, squad ] );
        const inside = byName( game, "Squad" );
        game.mount( inside.uuid, byName( game, "APC" ).uuid, false );
        game.handleTransportDestroyed( byName( game, "APC" ).uuid );
        expect( inside.isWrecked() ).toBe( true );
    });
});
