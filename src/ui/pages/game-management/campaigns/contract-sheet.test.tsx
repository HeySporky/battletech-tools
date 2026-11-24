// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Campaign } from "../../../../classes/campaign/campaign";
import { ICampaignExport } from "../../../../classes/campaign/campaign-types";
import { CONTRACT_SHEET_ROWS } from "../../../../classes/campaign/contract-sheet";
import { IAppGlobals } from "../../../app-router";
import { AppSettings } from "../../../classes/app_settings";
import CampaignsRouter from "./_router";

const store: { campaigns: ICampaignExport[] } = { campaigns: [] };

vi.mock( "../../../../dataSaves", async ( original ) => ( {
    ...( await original<typeof import( "../../../../dataSaves" )>() ),
    getCampaigns: vi.fn( async () => store.campaigns ),
    saveCampaigns: vi.fn( ( _settings: unknown, value: ICampaignExport[] ) => { store.campaigns = value; } ),
    getCurrentCBTForce: vi.fn( async () => null ),
    getCurrentASForce: vi.fn( async () => null ),
} ) );

afterEach( cleanup );

const appGlobals = {
    appSettings: new AppSettings( null ),
    makeDocumentTitle: vi.fn(),
    openConfirmDialog: vi.fn( ( _t: string, _m: string, _y: string, _n: string, yes: () => void ) => yes() ),
    showMobile: false,
    siteAlerts: { activeAlerts: [], addAlert: vi.fn() },
} as unknown as IAppGlobals;

const open = ( path: string ) => render(
    <MemoryRouter initialEntries={[ "/game-management/campaigns" + path ]}>
        <Routes>
            <Route path="/game-management/campaigns/*" element={<CampaignsRouter appGlobals={appGlobals} />} />
        </Routes>
    </MemoryRouter>,
);

const saved = (): Campaign => {
    const c = new Campaign();
    c.id = "c1";
    c.name = "Henshin Tigers";
    c.addSide( "Henshin Tigers", "attacker" );
    store.campaigns = [ c.export() ];
    return c;
};

const sheets = () => store.campaigns[0].contractSheets ?? [];

describe( "Mercenary Contract Record Sheets (#639)", () => {
    beforeEach( () => { store.campaigns = []; } );

    it( "is linked from the campaign page", async () => {
        saved();
        open( "/c1" );
        expect( ( await screen.findByRole( "link", { name: "Contract sheets" } ) ).getAttribute( "href" ) )
            .toBe( "/game-management/campaigns/c1/contract-sheet" );
    } );

    it( "makes a sheet with the printed lines, saves what is typed, and keeps it with the campaign", async () => {
        saved();
        open( "/c1/contract-sheet" );
        fireEvent.click( await screen.findByRole( "button", { name: "New sheet" } ) );
        await waitFor( () => expect( sheets() ).toHaveLength( 1 ) );
        expect( sheets()[0].rows ).toHaveLength( CONTRACT_SHEET_ROWS );

        fireEvent.change( screen.getByLabelText( "Name:" ), { target: { value: "Henshin Tigers" } } );
        fireEvent.change( screen.getByLabelText( "Contract:" ), { target: { value: "Esteros Disruption" } } );
        fireEvent.change( screen.getByLabelText( "Base Pay: percent" ), { target: { value: "60" } } );
        fireEvent.change( screen.getByLabelText( "Base Pay: roll" ), { target: { value: "7" } } );
        fireEvent.change( screen.getByLabelText( "Command:" ), { target: { value: "Liaison" } } );
        fireEvent.change( screen.getByLabelText( "Event, line 1" ), { target: { value: "Contract Accepted" } } );
        fireEvent.change( screen.getByLabelText( "Balance, line 1" ), { target: { value: "3,274" } } );

        await waitFor( () => expect( sheets()[0].rows[0].balance ).toBe( "3,274" ) );
        const sheet = sheets()[0];
        expect( sheet.name ).toBe( "Henshin Tigers" );
        expect( sheet.contract ).toBe( "Esteros Disruption" );
        expect( sheet.basePay ).toEqual( { percent: "60", roll: "7" } );
        expect( sheet.command.percent ).toBe( "Liaison" );
        expect( sheet.rows[0].event ).toBe( "Contract Accepted" );
        expect( screen.getByText( "1 of 23 lines used." ) ).toBeTruthy();
        expect( screen.getByText( "COMMON COSTS/PAY" ) ).toBeTruthy();
        expect( screen.getByText( "Rearm:" ) ).toBeTruthy();
    } );

    it( "prints the sheet, saving what was just typed first", async () => {
        saved();
        const print = vi.fn();
        window.print = print;
        open( "/c1/contract-sheet" );
        fireEvent.click( await screen.findByRole( "button", { name: "New sheet" } ) );
        fireEvent.change( await screen.findByLabelText( "Contract:" ), { target: { value: "Esteros Disruption" } } );
        fireEvent.click( screen.getByRole( "button", { name: "Print sheet" } ) );
        expect( print ).toHaveBeenCalledTimes( 1 );
        expect( sheets()[0].contract ).toBe( "Esteros Disruption" );
    } );

    it( "adds ledger lines and deletes a sheet", async () => {
        saved();
        open( "/c1/contract-sheet" );
        fireEvent.click( await screen.findByRole( "button", { name: "New sheet" } ) );
        fireEvent.click( await screen.findByRole( "button", { name: `Add ${CONTRACT_SHEET_ROWS} lines` } ) );
        await waitFor( () => expect( sheets()[0].rows ).toHaveLength( CONTRACT_SHEET_ROWS * 2 ) );
        fireEvent.click( screen.getByRole( "button", { name: "Delete sheet" } ) );
        await waitFor( () => expect( sheets() ).toHaveLength( 0 ) );
        expect( await screen.findByText( "No contract sheets yet." ) ).toBeTruthy();
    } );

    it( "makes a sheet from another book's form, fills in its blanks and boxes, and names it in the list", async () => {
        saved();
        open( "/c1/contract-sheet" );
        fireEvent.change( await screen.findByLabelText( "New sheet form" ), { target: { value: "hs-employment" } } );
        fireEvent.click( screen.getByRole( "button", { name: "New sheet" } ) );
        await waitFor( () => expect( sheets()[0]?.versionId ).toBe( "hs-employment" ) );
        expect( screen.getByText( "CONTRACT OF MERCENARY EMPLOYMENT" ) ).toBeTruthy();
        expect( screen.queryByRole( "button", { name: `Add ${CONTRACT_SHEET_ROWS} lines` } ) ).toBeNull();
        fireEvent.change( screen.getByLabelText( "Employer" ), { target: { value: "Draconis Combine" } } );
        fireEvent.change( screen.getByLabelText( "Command" ), { target: { value: "Henshin Tigers" } } );
        fireEvent.change( screen.getByLabelText( "Salvage percent" ), { target: { value: "50" } } );
        await waitFor( () => expect( sheets()[0].fields ).toEqual( { employer: "Draconis Combine", mercenary: "Henshin Tigers", salvagePercent: "50" } ) );

        fireEvent.change( screen.getByLabelText( "New sheet form" ), { target: { value: "fmm-worksheet" } } );
        fireEvent.click( screen.getByRole( "button", { name: "New sheet" } ) );
        await waitFor( () => expect( sheets() ).toHaveLength( 2 ) );
        fireEvent.click( screen.getByLabelText( "Hall mrbc" ) );
        fireEvent.change( screen.getByLabelText( "Base Pay Multiplier, Final Position" ), { target: { value: "1.5" } } );
        await waitFor( () => expect( sheets()[1].fields.payFinal ).toBe( "1.5" ) );
        expect( sheets()[1].checks ).toEqual( { hallMrbc: true } );

        const list = screen.getByLabelText( "Sheet" ) as HTMLSelectElement;
        expect( Array.from( list.options ).map( ( o ) => o.textContent ) ).toEqual( [
            "Henshin Tigers / Draconis Combine (Contract of Mercenary Employment)",
            "Sheet 2 (Mercenary Contract Worksheet)",
        ] );
    } );

    it( "ticks the Mallory's World boxes and keeps what was typed when the form changes", async () => {
        saved();
        open( "/c1/contract-sheet" );
        fireEvent.change( await screen.findByLabelText( "New sheet form" ), { target: { value: "hs-draconis-reach-mallorys-world" } } );
        fireEvent.click( screen.getByRole( "button", { name: "New sheet" } ) );
        expect( await screen.findByText( "LONELINESS ISLAND" ) ).toBeTruthy();
        fireEvent.click( screen.getByLabelText( "Defensive: box 2" ) );
        fireEvent.click( screen.getByLabelText( "Replacement ’Mech 5" ) );
        fireEvent.click( screen.getByLabelText( "BPWW: Purchase at +1D6 × 10%, +1 Replacement" ) );
        fireEvent.change( screen.getByLabelText( "Name:" ), { target: { value: "Battleaxe Co." } } );
        await waitFor( () => expect( sheets()[0].checks ).toEqual( { defensive2: true, replacement5: true, bpww: true } ) );

        fireEvent.change( screen.getByLabelText( "This sheet's form" ), { target: { value: "mercenaries" } } );
        await waitFor( () => expect( sheets()[0].versionId ).toBe( "mercenaries" ) );
        expect( screen.queryByText( "LONELINESS ISLAND" ) ).toBeNull();
        expect( screen.getByText( "Ton × 20" ) ).toBeTruthy();
        expect( ( screen.getByLabelText( "Name:" ) as HTMLInputElement ).value ).toBe( "Battleaxe Co." );
        expect( sheets()[0].checks.bpww ).toBe( true );
    } );
} );
