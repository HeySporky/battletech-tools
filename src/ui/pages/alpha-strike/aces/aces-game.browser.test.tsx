import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AcesGame } from "../../../../classes/aces-game";
import { IAcesUnitStats } from "../../../../classes/aces-engine";
import AlphaStrikeForce from "../../../../classes/alpha-strike-force";
import { AlphaStrikeUnit } from "../../../../classes/alpha-strike-unit";
import { acesSampleMechWarriorC, acesSampleSniper475, getAcesSampleLibrary } from "../../../../data/aces-card-samples";
import { getAcesCardLibrary, getAcesGame, saveAcesCardLibrary, saveAcesGame } from "../../../../dataSaves";
import { AppSettings } from "../../../classes/app_settings";
import AcesCardReader from "./_card-reader";

// Runs in real browsers (`npm run test:browser`): the game is played, saved to the browser's own storage and read
// back, and the card reader is driven through the page like a player would.
afterEach( () => {
    cleanup();
    localStorage.removeItem( "acesGame" );
    localStorage.removeItem( "acesCardLibrary" );
} );

const makeUnit = ( name: string, role: string, pv: number ): AlphaStrikeUnit => {
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
    unit.move = [ { move: 8, currentMove: 8, type: "" } ];
    unit.damage = { short: 3, medium: 3, long: 1, extreme: 0, shortMinimal: false, mediumMinimal: false, longMinimal: false, extremeMinimal: false };
    unit.calcCurrentValues();
    return unit;
}

const stats = ( armor: number ): IAcesUnitStats => ( {
    "armor": armor, "structure": 2, "armor-lost": 0, "structure-lost": 0, "tmm": 2, "pv": 20, "mv": 12,
    "damage-s": 2, "damage-m": 2, "damage-l": 0, "size": 1, "heat": 0,
} );

// Every export stamps its own lastUpdated time, at each level of the force; those differ between two exports.
const withoutTimestamps = ( value: unknown ): unknown => JSON.parse( JSON.stringify( value, ( key, item ) => key === "lastUpdated" ? undefined : item ) );

const wait = () => new Promise( ( resolve ) => setTimeout( resolve, 20 ) );

describe("Aces game in a real browser", () => {
    it("plays a turn from the card library, saves, reloads and continues the same dice (Aces pp.6, 19)", async () => {
        const appSettings = new AppSettings( null );
        saveAcesCardLibrary( appSettings, getAcesSampleLibrary() );
        const library = await getAcesCardLibrary( appSettings );
        expect( library.cards.length ).toBe( getAcesSampleLibrary().cards.length );

        const force = new AlphaStrikeForce();
        force.addToGroup( makeUnit( "Pouncer", "Sniper", 30 ), 0 );
        force.addToGroup( makeUnit( "Thunderbolt", "Brawler", 38 ), 0 );
        const game = new AcesGame();
        game.setAutomatedForce( force );
        game.rng = { seed: 4242, calls: 0 };
        game.setDeckPoolsFromLibrary( library );

        const pouncer = game.getAutomatedUnits().find( ( unit ) => unit.name === "Pouncer" )!;
        expect( game.getTopCard( pouncer.uuid, library )!.id ).toBe( acesSampleSniper475.id );
        expect( game.getUnitState( pouncer.uuid ).movePriority ).toBe( acesSampleSniper475.movePriority );

        game.rollInitiative();
        game.nextPhase();
        expect( game.phase ).toBe( "movement" );
        for( const unit of game.getMovementQueue() ) game.markMoved( unit.uuid );
        game.nextPhase();
        expect( game.phase ).toBe( "combat" );
        for( const unit of game.getCombatQueue() ) game.cycleCard( unit.uuid );
        game.nextPhase();
        game.nextPhase();
        expect( game.turn ).toBe( 2 );

        saveAcesGame( appSettings, game.export() );
        await wait();
        const data = await getAcesGame( appSettings );
        expect( data ).not.toBeNull();
        const reloaded = new AcesGame( data );
        expect( withoutTimestamps( reloaded.export() ) ).toEqual( withoutTimestamps( game.export() ) );
        expect( reloaded.roll2D6() ).toBe( game.roll2D6() );
        expect( reloaded.log.some( ( entry ) => entry.indexOf( "Initiative roll" ) > -1 ) ).toBe( true );
    });

    it("reads card 475 with the players: attacked-by-ally is judged, then the Locust is the target (Aces SS p.7)", async () => {
        const logged: string[] = [];
        render(
            <AcesCardReader
                phase="combat"
                card={acesSampleSniper475}
                commandCard={acesSampleMechWarriorC}
                unit={{ name: "Pouncer", isBattleMech: true, canJump: true, canIndirectFire: false, ovRating: 1, currentHeat: 0, fireControlHits: 0 }}
                enemies={[ { id: "locust", name: "Locust", stats: stats( 2 ) }, { id: "phawk", name: "Phoenix Hawk", stats: stats( 4 ) } ]}
                resetKey="t"
                onLog={( message ) => logged.push( message )}
            />,
        );
        fireEvent.change( screen.getByLabelText( "Distance to Locust" ), { target: { value: "14" } } );
        fireEvent.change( screen.getByLabelText( "Distance to Phoenix Hawk" ), { target: { value: "16" } } );
        fireEvent.change( screen.getByLabelText( "Target Number against Locust" ), { target: { value: "10" } } );
        fireEvent.change( screen.getByLabelText( "Target Number against Phoenix Hawk" ), { target: { value: "10" } } );

        const question = screen.getByText( "Which of these match:" ).closest( ".aces-reader-question" )!;
        expect( question.textContent ).toContain( "Attacked by ally this turn" );
        fireEvent.click( screen.getByText( "Answer" ) );

        expect( screen.getByText( "Target: Locust" ) ).toBeTruthy();
        fireEvent.change( screen.getByLabelText( "Damage at this range:" ), { target: { value: "2" } } );
        expect( screen.getByText( "Attack, no OV" ) ).toBeTruthy();
        fireEvent.click( screen.getByText( "Log attack, cycle card" ) );
        expect( logged.length ).toBe( 1 );
        expect( logged[0] ).toContain( "Locust" );
    });
});
