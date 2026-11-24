// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AlphaStrikeForce from "../../../../classes/alpha-strike-force";
import { AlphaStrikeUnit } from "../../../../classes/alpha-strike-unit";
import { IAppGlobals } from "../../../app-router";
import { AppSettings } from "../../../classes/app_settings";
import AcesPlayerForceCards, { applyAcesPlayerForceRound } from "./_player-force-cards";

afterEach( cleanup );

const makeUnit = ( name: string ): AlphaStrikeUnit => {
    const unit = new AlphaStrikeUnit();
    unit.name = name;
    unit.class = name;
    unit.type = "BM";
    unit.size = 2;
    unit.armor = 4;
    unit.structure = 4;
    unit.basePoints = 20;
    unit.currentPoints = 20;
    unit.move = [ { move: 8, currentMove: 8, type: "" } ];
    unit.damage = { short: 3, medium: 3, long: 1, extreme: 0, shortMinimal: false, mediumMinimal: false, longMinimal: false, extremeMinimal: false };
    unit.calcCurrentValues();
    return unit;
}

const makeForce = ( ...names: string[] ): AlphaStrikeForce => {
    const force = new AlphaStrikeForce();
    force.newGroup();
    force.groups[0].members.push( ...names.map( makeUnit ) );
    return force;
}

const appGlobals = ( force: AlphaStrikeForce | null ) => ( {
    appSettings: new AppSettings( null ),
    currentASForce: force,
    saveCurrentASForce: vi.fn(),
    openConfirmDialog: vi.fn(),
} as unknown as IAppGlobals );

const renderCards = ( globals: IAppGlobals ) => render( <MemoryRouter><AcesPlayerForceCards appGlobals={globals} /></MemoryRouter> );

// Rekikire: the players' own force is tracked on the Aces game page, no second tab with the roster needed.
describe("Aces player force cards", () => {
    it("shows a card for each unit of the current Alpha Strike roster", () => {
        const { container } = renderCards( appGlobals( makeForce( "Locust", "Phoenix Hawk" ) ) );
        expect( container.querySelectorAll( ".unit-card" ).length ).toBe( 2 );
    });

    it("saves the roster when heat is marked on a card", () => {
        const force = makeForce( "Locust" );
        const globals = appGlobals( force );
        const { container } = renderCards( globals );
        // The "2" box of the heat scale.
        fireEvent.click( container.querySelector( "text[x='415'][y='368']" )! );
        expect( force.groups[0].members[0].roundHeat ).toBe( 2 );
        expect( globals.saveCurrentASForce ).toHaveBeenCalledWith( force );
    });

    it("applies the marked heat at the End Phase and saves the roster", () => {
        const force = makeForce( "Locust" );
        const globals = appGlobals( force );
        force.groups[0].members[0].setHeat( 2 );
        applyAcesPlayerForceRound( globals );
        expect( force.groups[0].members[0].currentHeat ).toBe( 2 );
        expect( globals.saveCurrentASForce ).toHaveBeenCalledWith( force );
    });

    it("resets the whole force to full status after a confirm", () => {
        const force = makeForce( "Locust", "Phoenix Hawk" );
        const globals = appGlobals( force );
        for( const unit of force.groups[0].members ) {
            unit.setHeat( 3 );
            unit.takeDamage( 2 );
            unit.applyRound();
        }
        const { getByText } = renderCards( globals );
        fireEvent.click( getByText( "Reset your force" ) );
        expect( globals.openConfirmDialog ).toHaveBeenCalled();
        const confirm = ( globals.openConfirmDialog as ReturnType<typeof vi.fn> ).mock.calls[0][4] as () => void;
        confirm();
        for( const unit of force.groups[0].members ) {
            expect( unit.currentHeat ).toBe( 0 );
            expect( unit.currentArmor.every( ( hit ) => !hit ) ).toBe( true );
        }
        expect( globals.saveCurrentASForce ).toHaveBeenCalledWith( force );
    });

    it("points to the roster when there is no force", () => {
        renderCards( appGlobals( null ) );
        expect( screen.getByText( "Build it in the roster" ) ).toBeTruthy();
    });
});
