// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newAcesCardLibrary } from "../../../../data/aces-cards";
import { IAcesScanResult } from "../../../../classes/aces-card-scan";
import { IAcesCommandScanResult } from "../../../../classes/aces-command-card-scan";
import { IAppGlobals } from "../../../app-router";
import { AppSettings } from "../../../classes/app_settings";
import AcesLibraryPage from "./library";

const scanResult: { current: IAcesScanResult } = { current: null as unknown as IAcesScanResult };

vi.mock( "../../../../classes/card-scan-browser", () => ( {
    scanCardPhoto: vi.fn( async () => scanResult.current ),
} ) );

vi.mock( "../../../../dataSaves", async ( original ) => ( {
    ...( await original<typeof import( "../../../../dataSaves" )>() ),
    getAcesCardLibrary: vi.fn( async () => newAcesCardLibrary() ),
    saveAcesCardLibrary: vi.fn( async () => undefined ),
} ) );

afterEach( cleanup );

beforeEach( () => {
    URL.createObjectURL = vi.fn( () => "blob:photo" );
    URL.revokeObjectURL = vi.fn();
    scanResult.current = {
        side: "combat", deck: "Brawler", deckId: "brawler", cardNumber: "3/6", priority: 253, columns: [],
        combat: {
            zoneRings: [ 24 ], zoneKeyword: "",
            filters: [ { text: "Hit target's Rear" }, { text: "[yellow] command list", color: "yellow" } ],
            overheat: [],
            indirectIfNoLOS: false,
        },
        warnings: [ "Check the priority number: OCR can mix up 1 and 7 in the card's font." ],
    } as IAcesScanResult;
} );

const appGlobals = {
    appSettings: new AppSettings( null ),
    makeDocumentTitle: vi.fn(),
    openConfirmDialog: vi.fn(),
    showMobile: false,
    siteAlerts: { activeAlerts: [] },
} as unknown as IAppGlobals;

const openNewCard = async () => {
    const view = render( <MemoryRouter><AcesLibraryPage appGlobals={appGlobals} /></MemoryRouter> );
    fireEvent.click( await screen.findByText( "New" ) );
    return view;
}

const choosePhoto = async ( container: HTMLElement ) => {
    const input = container.querySelector( ".aces-scan input[type=file]" ) as HTMLInputElement;
    await act( async () => {
        fireEvent.change( input, { target: { files: [ new File( [ "photo" ], "card.jpg", { type: "image/jpeg" } ) ] } } );
    } );
}

// For players who find the cards' small print hard to read: a photo is read into the form, to be checked, not trusted.
describe( "Aces card scan in the library", () => {
    it( "fills the form from a photo and shows the photo and warnings beside it", async () => {
        const { container } = await openNewCard();
        await choosePhoto( container );
        expect( ( container.querySelector( "input[placeholder='Brawler']" ) as HTMLInputElement ).value ).toBe( "Brawler" );
        expect( container.querySelector( ".aces-scan-result strong" )!.textContent ).toBe( "Combat side" );
        expect( screen.getByText( /OCR can mix up 1 and 7/ ) ).toBeTruthy();
        expect( ( container.querySelector( ".aces-scan-photo" ) as HTMLImageElement ).src ).toContain( "blob:photo" );
        expect( screen.getByText( "The card reader isn't perfect." ) ).toBeTruthy();
    } );

    it( "won't save a scanned card until it's been checked", async () => {
        const { container } = await openNewCard();
        await choosePhoto( container );
        const save = screen.getByText( "Save" ) as HTMLButtonElement;
        expect( save.disabled ).toBe( true );
        fireEvent.click( screen.getByLabelText( /checked the form against my photos/ ) );
        expect( save.disabled ).toBe( false );
    } );

    it( "leaves the form alone when the photo can't be read", async () => {
        scanResult.current = { side: null, deck: "", deckId: "", cardNumber: "", priority: null, columns: [], combat: null, warnings: [ "Couldn't find the Aggressive / Balanced / Cautious headers or TARGET." ] };
        const { container } = await openNewCard();
        await choosePhoto( container );
        expect( ( container.querySelector( "input[placeholder='Brawler']" ) as HTMLInputElement ).value ).toBe( "" );
        expect( screen.getByText( /Couldn't find the Aggressive/ ) ).toBeTruthy();
        expect( ( screen.getByText( "Save" ) as HTMLButtonElement ).disabled ).toBe( false );
    } );
} );

const commandScan = ( found: boolean ): IAcesCommandScanResult => ( {
    found, side: found ? "orders" : null, deck: found ? "Test Deck" : "", faction: found ? "Clan Nowhere" : "", letter: found ? "B" : "", cardNumber: found ? "7/10" : "",
    orders: found ? [ { phase: "initiative", text: "Add 1 to your test roll.", token: null, tokenRank: [], behavior: null, filter: "" } ] : [],
    red: found ? [ { text: "[highest] PV", stat: "pv", direction: "highest" } ] : [], yellow: [], blue: [],
    supportOrders: "", emplacementZoneRings: [], emplacements: [], artillery: [], bsp: [], strategy: [],
    warnings: found ? [ "Check every line against the card." ] : [ "This looks like a behavior card, not a Command card: read it from a behavior card's form." ],
} as IAcesCommandScanResult );

const openNewCommandCard = async () => {
    const view = render( <MemoryRouter><AcesLibraryPage appGlobals={appGlobals} /></MemoryRouter> );
    fireEvent.click( await screen.findByText( /^Command cards/ ) );
    fireEvent.click( screen.getByText( "New" ) );
    return view;
}

describe( "Aces Command card scan in the library", () => {
    it( "reads a Command card photo into its form, through the same note and check as a behavior card", async () => {
        scanResult.current = commandScan( true ) as unknown as IAcesScanResult;
        const { container } = await openNewCommandCard();
        expect( screen.getByText( "The card reader isn't perfect." ) ).toBeTruthy();
        await choosePhoto( container );
        expect( ( container.querySelector( "input[placeholder='Star Captain']" ) as HTMLInputElement ).value ).toBe( "Test Deck" );
        expect( ( container.querySelector( "input[placeholder='A']" ) as HTMLInputElement ).value ).toBe( "B" );
        expect( container.querySelector( ".aces-scan-result strong" )!.textContent ).toBe( "Orders side" );
        const save = screen.getByText( "Save" ) as HTMLButtonElement;
        expect( save.disabled ).toBe( true );
        fireEvent.click( screen.getByLabelText( /checked the form against my photos/ ) );
        expect( save.disabled ).toBe( false );
    } );

    it( "leaves a Command card alone when the photo is another kind of card", async () => {
        scanResult.current = commandScan( false ) as unknown as IAcesScanResult;
        const { container } = await openNewCommandCard();
        await choosePhoto( container );
        expect( ( container.querySelector( "input[placeholder='Star Captain']" ) as HTMLInputElement ).value ).toBe( "" );
        expect( screen.getByText( /looks like a behavior card/ ) ).toBeTruthy();
        expect( ( screen.getByText( "Save" ) as HTMLButtonElement ).disabled ).toBe( false );
    } );
} );
