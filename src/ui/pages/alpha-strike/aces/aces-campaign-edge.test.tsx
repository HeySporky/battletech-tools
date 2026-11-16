// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AcesCampaign, AcesNamedPilot } from "../../../../classes/aces-campaign";
import { IAcesCardLibrary, newAcesCardLibrary, newAcesEdgeCard } from "../../../../data/aces-cards";
import { IAppGlobals } from "../../../app-router";
import { AppSettings } from "../../../classes/app_settings";
import { saveAcesCampaigns } from "../../../../dataSaves";
import AcesCampaignPage from "./campaign";

const state: { library: IAcesCardLibrary, campaign: AcesCampaign } = {
    library: newAcesCardLibrary(),
    campaign: new AcesCampaign(),
};

vi.mock( "../../../../dataSaves", async ( original ) => ( {
    ...( await original<typeof import( "../../../../dataSaves" )>() ),
    getAcesCardLibrary: vi.fn( async () => state.library ),
    getAcesCampaigns: vi.fn( async () => [ state.campaign.export() ] ),
    saveAcesCampaigns: vi.fn(),
} ) );

afterEach( cleanup );

const appGlobals = {
    appSettings: new AppSettings( null ),
    makeDocumentTitle: vi.fn(),
    openConfirmDialog: vi.fn(),
    showMobile: false,
    siteAlerts: { activeAlerts: [], addAlert: vi.fn() },
} as unknown as IAppGlobals;

const edgeCard = ( name: string, sample = false ) => {
    const card = newAcesEdgeCard();
    card.name = name;
    card.sample = sample;
    return card;
};

const pilotWith = ( edgeAbilities: string[], edgeAbilitySP: number ) => {
    const pilot = new AcesNamedPilot();
    pilot.callsign = "Teapot";
    pilot.edgeAbilitySP = edgeAbilitySP;
    pilot.edgeAbilities = edgeAbilities;
    state.campaign = new AcesCampaign();
    state.campaign.name = "Kite campaign";
    state.campaign.pilots = [ pilot ];
};

const open = async () => {
    render( <MemoryRouter><AcesCampaignPage appGlobals={appGlobals} /></MemoryRouter> );
    await screen.findByText( "Teapot" );
};

describe( "Named Pilots pick Edge abilities from entered Edge cards", () => {
    beforeEach( () => {
        state.library = newAcesCardLibrary();
        pilotWith( [], 60 );
    } );

    it( "offers entered Edge cards as checkboxes and ticking one stores its name", async () => {
        state.library.edgeCards = [ edgeCard( "Kite Day" ), edgeCard( "Teapot Luck" ) ];
        await open();
        const box = await screen.findByLabelText( "Kite Day" ) as HTMLInputElement;
        expect( screen.getByLabelText( "Teapot Luck" ) ).toBeTruthy();
        expect( screen.queryByPlaceholderText( "Edge abilities chosen" ) ).toBeNull();
        fireEvent.click( box );
        const calls = vi.mocked( saveAcesCampaigns ).mock.calls;
        const savedCampaigns = calls[calls.length - 1][1] as { pilots: { edgeAbilities: string[] }[] }[];
        expect( savedCampaigns[0].pilots[0].edgeAbilities ).toEqual( [ "Kite Day" ] );
        expect( ( screen.getByLabelText( "Kite Day" ) as HTMLInputElement ).checked ).toBe( true );
        expect( screen.queryByText( /more than/ ) ).toBeNull();
    } );

    it( "warns when more abilities are ticked than the pilot has", async () => {
        state.library.edgeCards = [ edgeCard( "Kite Day" ), edgeCard( "Teapot Luck" ) ];
        await open();
        fireEvent.click( await screen.findByLabelText( "Kite Day" ) );
        fireEvent.click( screen.getByLabelText( "Teapot Luck" ) );
        expect( screen.getByText( /2 Edge abilities picked, more than the 1 this pilot has/ ) ).toBeTruthy();
        fireEvent.click( screen.getByLabelText( "Teapot Luck" ) );
        expect( screen.queryByText( /more than/ ) ).toBeNull();
    } );

    it( "shows a saved name with no card in the free-text field beside the checkboxes, and keeps it", async () => {
        state.library.edgeCards = [ edgeCard( "Kite Day" ) ];
        pilotWith( [ "Old Kettle" ], 60 );
        await open();
        const field = await screen.findByPlaceholderText( "Other Edge abilities" ) as HTMLInputElement;
        expect( field.value ).toBe( "Old Kettle" );
        fireEvent.click( screen.getByLabelText( "Kite Day" ) );
        expect( ( screen.getByPlaceholderText( "Other Edge abilities" ) as HTMLInputElement ).value ).toBe( "Old Kettle" );
    } );

    it( "typing in the free-text field keeps ticked cards", async () => {
        state.library.edgeCards = [ edgeCard( "Kite Day" ) ];
        pilotWith( [ "Kite Day" ], 180 );
        await open();
        const field = await screen.findByPlaceholderText( "Other Edge abilities" ) as HTMLInputElement;
        fireEvent.change( field, { target: { value: "Brass Gull" } } );
        const calls = vi.mocked( saveAcesCampaigns ).mock.calls;
        const saved = ( calls[calls.length - 1][1] as { pilots: { edgeAbilities: string[] }[] }[] )[0].pilots[0].edgeAbilities;
        expect( saved ).toEqual( [ "Kite Day", "Brass Gull" ] );
        expect( ( screen.getByLabelText( "Kite Day" ) as HTMLInputElement ).checked ).toBe( true );
    } );

    it( "matches a saved name ignoring case and spaces, and does not list it as typed", async () => {
        state.library.edgeCards = [ edgeCard( "Kite Day" ), edgeCard( "Teapot Luck" ) ];
        pilotWith( [ "kite day ", "TEAPOT  LUCK" ], 180 );
        await open();
        expect( ( await screen.findByLabelText( "Kite Day" ) as HTMLInputElement ).checked ).toBe( true );
        expect( ( screen.getByLabelText( "Teapot Luck" ) as HTMLInputElement ).checked ).toBe( true );
        expect( ( screen.getByPlaceholderText( "Other Edge abilities" ) as HTMLInputElement ).value ).toBe( "" );
    } );

    it( "unticking removes the saved variant, and ticking does not duplicate it", async () => {
        state.library.edgeCards = [ edgeCard( "Kite Day" ) ];
        pilotWith( [ "kite day " ], 60 );
        await open();
        const lastSaved = () => {
            const calls = vi.mocked( saveAcesCampaigns ).mock.calls;
            return ( calls[calls.length - 1][1] as { pilots: { edgeAbilities: string[] }[] }[] )[0].pilots[0].edgeAbilities;
        };
        fireEvent.click( await screen.findByLabelText( "Kite Day" ) );
        expect( lastSaved() ).toEqual( [] );
        fireEvent.click( screen.getByLabelText( "Kite Day" ) );
        expect( lastSaved() ).toEqual( [ "Kite Day" ] );
    } );

    it( "keeps the free-text field when no Edge cards are entered", async () => {
        pilotWith( [ "Old Kettle" ], 60 );
        await open();
        const field = await screen.findByPlaceholderText( "Edge abilities chosen" ) as HTMLInputElement;
        expect( field.value ).toBe( "Old Kettle" );
    } );

    it( "counts sample Edge cards as entered cards", async () => {
        state.library.edgeCards = [ edgeCard( "Sample Kite", true ) ];
        await open();
        expect( await screen.findByLabelText( "Sample Kite" ) ).toBeTruthy();
    } );
} );
