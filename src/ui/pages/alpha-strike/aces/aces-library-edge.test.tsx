// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IAcesCardLibrary, newAcesCardLibrary } from "../../../../data/aces-cards";
import { IAppGlobals } from "../../../app-router";
import { AppSettings } from "../../../classes/app_settings";
import AcesLibraryPage from "./library";

const saved: { current: IAcesCardLibrary | null } = { current: null };

vi.mock( "../../../../dataSaves", async ( original ) => ( {
    ...( await original<typeof import( "../../../../dataSaves" )>() ),
    getAcesCardLibrary: vi.fn( async () => newAcesCardLibrary() ),
    saveAcesCardLibrary: vi.fn( ( _settings: unknown, library: IAcesCardLibrary ) => { saved.current = library; } ),
} ) );

afterEach( cleanup );

const appGlobals = {
    appSettings: new AppSettings( null ),
    makeDocumentTitle: vi.fn(),
    openConfirmDialog: vi.fn(),
    showMobile: false,
    siteAlerts: { activeAlerts: [] },
} as unknown as IAppGlobals;

describe( "Edge cards in the Aces card library", () => {
    it( "adds an Edge card with a name, cost, phase and text, and saves it with the library", async () => {
        render( <MemoryRouter><AcesLibraryPage appGlobals={appGlobals} /></MemoryRouter> );
        fireEvent.click( await screen.findByText( /Edge cards \(0\)/ ) );
        fireEvent.click( screen.getByText( "New" ) );
        expect( screen.getByText( "Name is missing." ) ).toBeTruthy();
        fireEvent.change( screen.getByLabelText( "Name" ), { target: { value: "Kite Day" } } );
        fireEvent.change( screen.getByLabelText( "Cost" ), { target: { value: "2" } } );
        fireEvent.change( screen.getByLabelText( "Phase" ), { target: { value: "movement" } } );
        fireEvent.change( screen.getByLabelText( "Card text" ), { target: { value: "A kite hums over a teapot." } } );
        fireEvent.click( screen.getByText( "Save" ) );
        expect( saved.current!.edgeCards.length ).toBe( 1 );
        const card = saved.current!.edgeCards[0];
        expect( card.name ).toBe( "Kite Day" );
        expect( card.cost ).toBe( 2 );
        expect( card.phase ).toBe( "movement" );
        expect( card.text ).toBe( "A kite hums over a teapot." );
        expect( screen.getByText( /Edge cards \(1\)/ ) ).toBeTruthy();
    } );

    it( "loads the sample Edge card, marked not official", async () => {
        render( <MemoryRouter><AcesLibraryPage appGlobals={appGlobals} /></MemoryRouter> );
        fireEvent.click( await screen.findByText( "Load samples" ) );
        fireEvent.click( screen.getByText( /Edge cards \(1\)/ ) );
        fireEvent.click( screen.getByText( "Edit" ) );
        expect( ( screen.getByLabelText( "Notes" ) as HTMLInputElement ).value ).toContain( "NOT OFFICIAL" );
    } );
} );
