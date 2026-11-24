// @vitest-environment happy-dom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Campaign } from "../../../../classes/campaign/campaign";
import { ICampaignExport } from "../../../../classes/campaign/campaign-types";
import { IAppGlobals } from "../../../app-router";
import { AppSettings } from "../../../classes/app_settings";
import { useCampaign } from "./campaign-store";

const store: { campaigns: ICampaignExport[] } = { campaigns: [] };

vi.mock( "../../../../dataSaves", async ( original ) => ( {
    ...( await original<typeof import( "../../../../dataSaves" )>() ),
    getCampaigns: vi.fn( async () => store.campaigns ),
    saveCampaigns: vi.fn( ( _settings: unknown, value: ICampaignExport[] ) => { store.campaigns = value; } ),
} ) );

const appGlobals = { appSettings: new AppSettings( null ) } as unknown as IAppGlobals;

describe( "useCampaign", () => {
    it( "an update made after an await does not undo a change made in the meantime", async () => {
        const c = new Campaign();
        c.id = "c1";
        c.name = "Start";
        store.campaigns = [ c.export() ];
        const { result } = renderHook( () => useCampaign( appGlobals, "c1" ) );
        await waitFor( () => expect( result.current.loaded ).toBe( true ) );
        // An async handler holds the update from this render while it awaits.
        const heldUpdate = result.current.update;
        act( () => result.current.update( ( next ) => next.advance() ) );
        act( () => heldUpdate( ( next ) => { next.name = "Renamed"; } ) );
        expect( store.campaigns[0].name ).toBe( "Renamed" );
        expect( store.campaigns[0].step ).toBe( 1 );
        expect( result.current.campaign?.step ).toBe( 1 );
    } );
} );
