// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Campaign } from "../../../../classes/campaign/campaign";
import { ICampaignExport } from "../../../../classes/campaign/campaign-types";
import { IAppGlobals } from "../../../app-router";
import { AppSettings } from "../../../classes/app_settings";
import { saveCampaigns } from "../../../../dataSaves";
import { getFewestJumps } from "../../../../data/star-systems/star-systems";
import { campaignDice } from "./campaign-store";
import CampaignsRouter from "./_router";

const store: { campaigns: ICampaignExport[] } = { campaigns: [] };

vi.mock( "../../../../dataSaves", async ( original ) => ( {
    ...( await original<typeof import( "../../../../dataSaves" )>() ),
    getCampaigns: vi.fn( async () => store.campaigns ),
    saveCampaigns: vi.fn( ( _settings: unknown, value: ICampaignExport[] ) => { store.campaigns = value; } ),
    getCurrentCBTForce: vi.fn( async () => null ),
    getCurrentASForce: vi.fn( async () => null ),
} ) );

vi.mock( "../../../../data/star-systems/star-systems", async ( original ) => {
    const actual = await original<typeof import( "../../../../data/star-systems/star-systems" )>();
    return {
    ...actual,
    getFewestJumps: vi.fn( actual.getFewestJumps ),
    loadStarSystemSites: vi.fn( async () => ( {
        sites: [ { id: "Tharkad-tharhes", systemId: "Tharkad", planet: "Tharkad", name: "Tharhes Industries", products: ["BattleMechs"], heavy: true, date: "3067-01-01", source: "Objectives: Lyran Alliance p.10" } ],
        garrisons: [ { systemId: "Tharkad", date: "3054-01-01", faction: "LA", units: ["Royal Guard"], source: "Objective Raids p.40" } ],
    } ) ),
    };
} );

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

/** A saved campaign on Tharkad in 3055, with the Economics rulesets ticked as asked. */
const saved = ( rulesetIds: string[] = ["fw-economics", "fw-economic-damage"], systemId = "Tharkad" ): Campaign => {
    const c = new Campaign();
    c.id = "c1";
    c.name = "Tharkad Defence";
    c.startDate = "3055-01-01";
    c.rulesetIds = rulesetIds;
    const held = c.addSide( "Lyrans", "defender" );
    c.addSide( "Raiders", "attacker" );
    c.planet = {
        systemId, name: "Tharkad", customDotTypes: [], customCombinations: [],
        areas: [ { id: "a1", name: "Bremen", terrain: "tundra", controllerSideId: held.id, comboOverride: null,
            dots: ["mining", "refining", "heavy-manufacturing", "oil", "processing"].map( ( type, i ) => ( { id: "d" + i, type, destroyed: false } ) ) } ],
    };
    store.campaigns = [ c.export() ];
    return c;
};

describe( "Campaign screens", () => {
    beforeEach( () => {
        store.campaigns = [];
        vi.mocked( saveCampaigns ).mockClear();
        vi.restoreAllMocks();
    } );

    it( "picks the campaign planet from a real system", async () => {
        open( "" );
        fireEvent.click( await screen.findByRole( "button", { name: "New campaign" } ) );
        fireEvent.change( screen.getByLabelText( "Star system" ), { target: { value: "Thark" } } );
        fireEvent.click( await screen.findByRole( "button", { name: "Tharkad" }, { timeout: 10000 } ) );
        const planet = await screen.findByLabelText( "Planet" ) as HTMLSelectElement;
        await waitFor( () => expect( Array.from( planet.options ).map( ( o ) => o.textContent ) ).toContain( "Tharkad" ) );
    } );

    it( "creates a campaign with a side and saves it", async () => {
        open( "" );
        fireEvent.click( await screen.findByRole( "button", { name: "New campaign" } ) );
        fireEvent.change( screen.getByLabelText( "Campaign name" ), { target: { value: "Operation Test" } } );
        fireEvent.change( screen.getByLabelText( "Planet name" ), { target: { value: "Freeworld" } } );
        fireEvent.change( screen.getByLabelText( "Side name" ), { target: { value: "Our Lance" } } );
        fireEvent.click( screen.getByRole( "button", { name: "Add side" } ) );
        fireEvent.click( screen.getByRole( "button", { name: "Create campaign" } ) );
        await waitFor( () => expect( store.campaigns.map( ( c ) => c.name ) ).toEqual( ["Operation Test"] ) );
        expect( store.campaigns[0].sides.map( ( s ) => s.name ) ).toEqual( ["Our Lance"] );
        expect( store.campaigns[0].planet?.name ).toBe( "Freeworld" );
    } );

    it( "advancing three months shows a payday in the controller's ledger", async () => {
        saved();
        open( "/c1" );
        const advance = await screen.findByRole( "button", { name: "Advance a month" } );
        fireEvent.click( advance ); fireEvent.click( advance ); fireEvent.click( advance );
        const ledger = await screen.findByTestId( "campaign-ledger-Lyrans" );
        await waitFor( () => expect( ledger.textContent ).toContain( "14,000,000" ) );
        expect( screen.getByTestId( "campaign-step" ).textContent ).toContain( "3" );
    } );

    it( "a target shows distance and jumps", async () => {
        saved( ["fw-economics"], "Terra" );
        open( "/c1" );
        const targets = await screen.findByTestId( "campaign-targets" );
        fireEvent.change( within( targets ).getByLabelText( "Target system" ), { target: { value: "Tharkad" } } );
        fireEvent.click( await within( targets ).findByRole( "button", { name: "Tharkad" }, { timeout: 10000 } ) );
        fireEvent.change( within( targets ).getByLabelText( "Intent" ), { target: { value: "assault" } } );
        fireEvent.click( within( targets ).getByRole( "button", { name: "Add target" } ) );
        const row = await within( targets ).findByTestId( "target-row-Tharkad" );
        expect( row.textContent ).toContain( "261.5" );
        expect( row.textContent ).toMatch( /\d+ jumps?/ );
        expect( row.textContent ).toContain( "assault" );
    } );

    it( "typing a unit's status does not search the jumps again", async () => {
        const c = saved( ["fw-economics"], "Terra" );
        c.targets = [ { id: "t1", sideId: c.sides[1].id, systemId: "Tharkad", intent: "assault" } ];
        c.force = [ { id: "u1", sideId: c.sides[0].id, kind: "battlemech", savedId: null, name: "Atlas AS7-D", cost: null, bv: null, pv: null, snapshot: null, status: "" } ];
        store.campaigns = [ c.export() ];
        open( "/c1" );
        const row = await screen.findByTestId( "target-row-Tharkad", {}, { timeout: 10000 } );
        await waitFor( () => expect( row.textContent ).toMatch( /\d+ jumps?/ ) );
        vi.mocked( getFewestJumps ).mockClear();
        fireEvent.change( screen.getByLabelText( "Status of Atlas AS7-D" ), { target: { value: "damaged" } } );
        await waitFor( () => expect( ( screen.getByLabelText( "Status of Atlas AS7-D" ) as HTMLInputElement ).value ).toBe( "damaged" ) );
        expect( vi.mocked( getFewestJumps ) ).not.toHaveBeenCalled();
    } );

    it( "lists a system's garrisons for the campaign's date", async () => {
        saved();
        open( "/c1" );
        expect( await screen.findByText( /Royal Guard/ ) ).toBeTruthy();
        // NGCFells 2026-11-20: the catalog is JBT's (vetted against the books); MegaMek Data stays credited as its base (CC BY-NC-SA).
        expect( screen.getByText( /JBT star system catalog, built by NGCFells on MegaMek Data \(CC BY-NC-SA 4\.0\)/ ) ).toBeTruthy();
    } );

    it( "the Systems section names no 'our' books", async () => {
        saved( ["fw-economics"], "Terra" );
        open( "/c1" );
        const credit = await screen.findByText( /MegaMek Data/ );
        expect( credit.closest( "section, .text-section, div" )!.parentElement!.textContent ).not.toMatch( /\bour\b/i );
        expect( screen.getAllByText( /None in the books checked so far/ ).length ).toBeGreaterThan( 0 );
    } );

    it( "names owners and garrison factions, says no date for sites, and logs each step once", async () => {
        saved();
        open( "/c1" );
        await screen.findByText( /Royal Guard/, {}, { timeout: 10000 } );
        // MegaMek Data: Tharkad is the Federated Commonwealth's in 3055; the 3054 garrison is named for its own date.
        await waitFor( () => expect( document.body.textContent ).toContain( "Owner on 3055-01-01: Federated Commonwealth." ), { timeout: 10000 } );
        expect( document.body.textContent ).toContain( "3054, Lyran Commonwealth: Royal Guard" );
        fireEvent.click( screen.getByRole( "button", { name: "Advance a month" } ) );
        await waitFor( () => expect( screen.getByTestId( "campaign-step" ).textContent ).toContain( "1" ) );
        expect( screen.queryByText( /month 1: Month 1/i ) ).toBeNull();
        expect( screen.getByText( "Month 1" ) ).toBeTruthy();
        store.campaigns[0].planet!.systemId = "Terra";
        cleanup();
        open( "/c1" );
        expect( await screen.findByText( "None in the books checked so far.", {}, { timeout: 10000 } ) ).toBeTruthy();
    } );

    it( "payday preview shows the grouping that pays most", async () => {
        saved();
        open( "/c1/planet" );
        const area = await screen.findByTestId( "area-a1" );
        expect( area.textContent ).toContain( "14,000,000" );
        expect( area.textContent ).toContain( "Oil, refining and processing" );
        // A GM grouping keeps only that combination; the rest are paid loose, so the option says "Only".
        const options = within( within( area ).getByLabelText( /Grouping/ ) ).getAllByRole( "option" ).map( ( o ) => o.textContent || "" );
        expect( options.slice( 1 ).every( ( t ) => t.startsWith( "Only " ) ) ).toBe( true );
    } );

    it( "the damage roller marks destroyed dots and logs them", async () => {
        saved();
        vi.spyOn( campaignDice, "roll2d6" ).mockReturnValue( 12 );
        open( "/c1/planet" );
        const area = await screen.findByTestId( "area-a1" );
        fireEvent.change( within( area ).getByLabelText( "Fight size" ), { target: { value: "company" } } );
        fireEvent.click( within( area ).getByRole( "button", { name: "Roll damage" } ) );
        await waitFor( () => expect( store.campaigns[0].planet!.areas[0].dots.every( ( d ) => d.destroyed ) ).toBe( true ) );
        expect( store.campaigns[0].log.some( ( l ) => l.text.includes( "Bremen" ) && l.text.includes( "destroyed" ) ) ).toBe( true );
    } );

    it( "a GM dot type may be worth 0, and removing one removes its dots and combinations", async () => {
        const c = saved();
        c.planet!.customDotTypes = [ { id: "gm-port", name: "Spaceport", value: 2000000, target: 8 } ];
        c.planet!.customCombinations = [ { id: "gm-hub", name: "Port hub", needs: { "gm-port": 1, oil: 1 }, multiplier: 2 } ];
        c.planet!.areas[0].dots.push( { id: "dp", type: "gm-port", destroyed: false } );
        c.planet!.areas[0].comboOverride = [ "gm-hub" ];
        store.campaigns = [ c.export() ];
        open( "/c1/planet" );
        fireEvent.change( await screen.findByLabelText( "Type name" ), { target: { value: "Shrine" } } );
        fireEvent.change( screen.getByLabelText( "Value" ), { target: { value: "0" } } );
        fireEvent.click( screen.getByRole( "button", { name: "Add dot type" } ) );
        await waitFor( () => expect( store.campaigns[0].planet!.customDotTypes.find( ( t ) => t.name === "Shrine" )?.value ).toBe( 0 ) );
        const port = screen.getByText( /^Spaceport:/ ).closest( "li" )!;
        fireEvent.click( within( port ).getByRole( "button", { name: "Remove" } ) );
        await waitFor( () => expect( store.campaigns[0].planet!.customDotTypes.map( ( t ) => t.name ) ).toEqual( ["Shrine"] ) );
        expect( store.campaigns[0].planet!.areas[0].dots.some( ( d ) => d.type === "gm-port" ) ).toBe( false );
        expect( store.campaigns[0].planet!.customCombinations ).toEqual( [] );
        expect( store.campaigns[0].planet!.areas[0].comboOverride ).toBeNull();
    } );

    it( "the planet page is hidden without Economics", async () => {
        saved( [] );
        open( "/c1" );
        await screen.findByRole( "button", { name: "Advance a month" } );
        expect( screen.queryByRole( "link", { name: "Planet economy" } ) ).toBeNull();
        cleanup();
        open( "/c1/planet" );
        expect( await screen.findByText( /Tick Future Wars: Economics/ ) ).toBeTruthy();
    } );

    it( "the Game Management section menu lists Campaigns", async () => {
        open( "" );
        const menu = await screen.findByRole( "navigation", { name: "Section menu" } );
        const link = within( menu ).getByRole( "link", { name: "Campaigns" } );
        expect( link.getAttribute( "href" ) ).toMatch( /\/game-management\/campaigns$/ );
        expect( link.className ).toContain( "current" );
    } );

    it( "the planet page links back to its own campaign", async () => {
        saved();
        open( "/c1/planet" );
        const back = await screen.findByRole( "link", { name: "Back to Tharkad Defence" } );
        expect( back.getAttribute( "href" ) ).toBe( "/game-management/campaigns/c1" );
        cleanup();
        open( "/nope/planet" );
        const list = await screen.findByRole( "link", { name: "Back to campaigns" } );
        expect( list.getAttribute( "href" ) ).toBe( "/game-management/campaigns" );
    } );

    it( "shows NOT OFFICIAL and NGCFells's merge note", async () => {
        saved();
        open( "/c1/planet" );
        await screen.findByTestId( "area-a1" );
        expect( screen.getAllByText( /NOT OFFICIAL/ ).length ).toBeGreaterThan( 0 );
        expect( screen.getByText( /Both printings merged into one ruleset by NGCFells's decision\./ ) ).toBeTruthy();
        expect( screen.getByText( /Inspired by Herb Barents, Future Wars #5/ ) ).toBeTruthy();
    } );

    it( "a new campaign can take the Mercenary's Handbook (1987) edition", async () => {
        open( "" );
        fireEvent.click( await screen.findByRole( "button", { name: "New campaign" } ) );
        fireEvent.change( screen.getByLabelText( "Edition" ), { target: { value: "mh-1987" } } );
        fireEvent.change( screen.getByLabelText( "Side name" ), { target: { value: "Our Battalion" } } );
        fireEvent.click( screen.getByRole( "button", { name: "Add side" } ) );
        fireEvent.click( screen.getByRole( "button", { name: "Create campaign" } ) );
        await waitFor( () => expect( store.campaigns.map( ( c ) => c.editionId ) ).toEqual( ["mh-1987"] ) );
    } );

    it( "the 1987 panel previews the month and books it on advance", async () => {
        const c = saved( [] );
        c.editionId = "mh-1987";
        store.campaigns = [ c.export() ];
        open( "/c1" );
        const panel = await screen.findByTestId( "edition-mh1987" );
        fireEvent.click( within( panel ).getByRole( "button", { name: "Add squads" } ) );
        const line = await within( panel ).findByTestId( "mh1987-line-0" );
        fireEvent.change( within( line ).getByLabelText( "Type" ), { target: { value: "heavy-mech" } } );
        fireEvent.change( within( line ).getByLabelText( "Count" ), { target: { value: "4" } } );
        // 4 Regular heavy 'Mechs: salaries 2,400, supplies 2,000, overhead 15% 660, maintenance 140 SP x 5,000.
        await waitFor( () => expect( within( panel ).getByTestId( "mh1987-costs" ).textContent ).toContain( "705,060" ) );
        fireEvent.click( screen.getByRole( "button", { name: "Advance a month" } ) );
        await waitFor( () => expect( screen.getByTestId( "campaign-ledger-Lyrans" ).textContent ).toContain( "Salaries" ) );
    } );

    it( "the 1987 panel negotiates, signs and resolves a month", async () => {
        const c = saved( [] );
        c.editionId = "mh-1987";
        c.editionState = { roster: [ { id: "l1", type: "heavy-mech", quality: "regular", condition: "new", count: 12, company: "Company 1" } ] };
        store.campaigns = [ c.export() ];
        vi.spyOn( campaignDice, "roll2d6" ).mockReturnValue( 7 );
        vi.spyOn( campaignDice, "roll1d6" ).mockReturnValue( 3 );
        open( "/c1" );
        const panel = await screen.findByTestId( "edition-mh1987" );
        fireEvent.change( within( panel ).getByLabelText( "Mission" ), { target: { value: "garrison" } } );
        fireEvent.click( within( panel ).getByRole( "button", { name: "Roll employer positions" } ) );
        fireEvent.click( within( panel ).getByRole( "button", { name: "Negotiate" } ) );
        fireEvent.click( await within( panel ).findByRole( "button", { name: "Sign contract" } ) );
        await waitFor( () => expect( store.campaigns[0].log.some( ( l ) => l.text.startsWith( "Contract signed: Garrison Duty" ) ) ).toBe( true ) );
        fireEvent.click( await within( panel ).findByRole( "button", { name: "Resolve month" } ) );
        // Garrison: resistance 7 reads N; the N row at 7 reads I (uncompleted).
        await waitFor( () => expect( store.campaigns[0].log.some( ( l ) => l.text.includes( "outcome I" ) ) ).toBe( true ) );
        // A month resolves once: a second click books nothing more.
        fireEvent.click( within( panel ).getByRole( "button", { name: "Resolve month" } ) );
        await new Promise( ( r ) => setTimeout( r, 50 ) );
        expect( store.campaigns[0].log.filter( ( l ) => l.text.includes( "outcome I" ) ) ).toHaveLength( 1 );
    } );

    // Review M8: a running contract can end early in either edition.
    it( "the 1987 panel ends a ComStar contract early, repaying the advance when ComStar judges it failed", async () => {
        const c = saved( [] );
        c.editionId = "mh-1987";
        c.editionState = {
            roster: [ { id: "l1", type: "heavy-mech", quality: "regular", condition: "new", count: 12, company: "Company 1" } ],
            contract: { id: "k1", mission: "objective-raid", squads: 3, startStep: 0, total: 400000, paid: 100000, completed: false,
                terms: { months: 2, ratePerSquadWeek: 10000, guarantee: "comstar", command: "liaison", transportModifier: 1, supplyModifier: 0.5, salvage: "merc-claims" } },
        };
        store.campaigns = [ c.export() ];
        open( "/c1" );
        const panel = await screen.findByTestId( "edition-mh1987" );
        fireEvent.click( within( panel ).getByLabelText( "ComStar judged it unfulfilled" ) );
        fireEvent.click( within( panel ).getByRole( "button", { name: "End contract early" } ) );
        await waitFor( () => expect( store.campaigns[0].ledger.map( ( e ) => [e.reason, e.amount] ) ).toEqual( [["Advance repaid: ComStar judged the contract unfulfilled", -100000]] ) );
        expect( await within( panel ).findByRole( "button", { name: "Negotiate" } ) ).toBeTruthy();
    } );

    it( "the 3055 panel ends a contract by a breach hearing, with the gamemaster's modifier", async () => {
        const c = saved( [] );
        c.editionId = "mh-3055";
        c.editionState = { roster: [], personnel: [],
            contract: { id: "k1", employer: "mercenary", mission: "pirate-hunting", vsClans: false, months: 4, startStep: 0, total: 100000, drawn: 0, completed: false } };
        store.campaigns = [ c.export() ];
        vi.spyOn( campaignDice, "roll2d6" ).mockReturnValue( 7 );
        open( "/c1" );
        const panel = await screen.findByTestId( "edition-mh3055" );
        fireEvent.change( within( panel ).getByLabelText( "How the contract ends" ), { target: { value: "guilty" } } );
        fireEvent.change( within( panel ).getByLabelText( "Hearing modifier" ), { target: { value: "3" } } );
        fireEvent.click( within( panel ).getByRole( "button", { name: "End contract" } ) );
        // 2D6 7 + 3 = 10: 75,000 C-bills and a 6-month ban (p.110).
        await waitFor( () => expect( store.campaigns[0].ledger.map( ( e ) => [e.reason, e.amount] ) ).toEqual( [["Breach of contract fine", -75000]] ) );
        expect( within( panel ).getByLabelText( "Contract breaches" ) ).toHaveProperty( "value", "1" );
        expect( store.campaigns[0].log.map( ( l ) => l.text ) ).toContain(
            "Breach of contract hearing (roll 10): guilty, 75,000 C-bill fine and a 6-month hiring ban (Dragoons Rating -25)" );
    } );

    it( "each Mercenary's Handbook panel lists NGCFells's readings of the book", async () => {
        const c = saved( [] );
        c.editionId = "mh-1987";
        store.campaigns = [ c.export() ];
        open( "/c1" );
        const old = ( await screen.findByTestId( "mh1987-readings" ) ).textContent || "";
        expect( old ).toContain( "NGCFells" );
        expect( old ).toContain( "Inspired by" );
        expect( old ).toContain( "a squad a week" );
        expect( old ).toContain( "5 SP" );
        expect( old ).toContain( "a destroyed squad keeps its people" );
        cleanup();
        c.editionId = "mh-3055";
        store.campaigns = [ c.export() ];
        open( "/c1" );
        const text = ( await screen.findByTestId( "mh3055-readings" ) ).textContent || "";
        expect( text ).toContain( "NGCFells" );
        expect( text ).toContain( "Inspired by" );
        expect( text ).toContain( "two paydays" );
        expect( text ).toContain( "7%" );
        expect( text ).toContain( "first draw" );
        expect( text ).toContain( "Upkeep draw" );
    } );

    it( "the GM adds a ledger entry by hand and removes it again", async () => {
        saved();
        open( "/c1" );
        const ledger = await screen.findByTestId( "campaign-ledger-Lyrans" );
        fireEvent.change( within( ledger ).getByLabelText( "Reason" ), { target: { value: "Repair bill" } } );
        fireEvent.change( within( ledger ).getByLabelText( "Amount" ), { target: { value: "-25000" } } );
        fireEvent.click( within( ledger ).getByRole( "button", { name: "Add entry" } ) );
        await waitFor( () => expect( store.campaigns[0].ledger.map( ( e ) => [e.reason, e.amount] ) ).toEqual( [["Repair bill", -25000]] ) );
        // A second entry with the same reason gets a Remove button of its own (re-review minor).
        fireEvent.change( within( ledger ).getByLabelText( "Reason" ), { target: { value: "Repair bill" } } );
        fireEvent.change( within( ledger ).getByLabelText( "Amount" ), { target: { value: "-5000" } } );
        fireEvent.click( within( ledger ).getByRole( "button", { name: "Add entry" } ) );
        await waitFor( () => expect( store.campaigns[0].ledger ).toHaveLength( 2 ) );
        fireEvent.click( await within( ledger ).findByRole( "button", { name: "Remove entry 2: Repair bill" } ) );
        await waitFor( () => expect( store.campaigns[0].ledger.map( ( e ) => [e.reason, e.amount] ) ).toEqual( [["Repair bill", -25000]] ) );
        fireEvent.click( await within( ledger ).findByRole( "button", { name: "Remove entry 1: Repair bill" } ) );
        await waitFor( () => expect( store.campaigns[0].ledger ).toEqual( [] ) );
    } );

    // Re-review minor: a stale second click on Resolve month books nothing and says so.
    it( "the 1987 panel does not claim a resolution it refused", async () => {
        const c = saved( [] );
        c.editionId = "mh-1987";
        c.editionState = {
            roster: [ { id: "l1", type: "heavy-mech", quality: "regular", condition: "new", count: 12, company: "Company 1" } ],
            contract: { id: "k1", mission: "garrison", squads: 3, startStep: 0, total: 400000, paid: 0, completed: false,
                terms: { months: 2, ratePerSquadWeek: 10000, guarantee: "prior", command: "liaison", transportModifier: 1, supplyModifier: 0.5, salvage: "merc-claims" } },
        };
        store.campaigns = [ c.export() ];
        vi.spyOn( campaignDice, "roll2d6" ).mockReturnValue( 7 );
        vi.spyOn( campaignDice, "roll1d6" ).mockReturnValue( 3 );
        open( "/c1" );
        const panel = await screen.findByTestId( "edition-mh1987" );
        // Another tab resolved this month after this page drew it.
        ( store.campaigns[0].editionState as { contract: { resolvedStep?: number } } ).contract.resolvedStep = 0;
        fireEvent.click( within( panel ).getByRole( "button", { name: "Resolve month" } ) );
        expect( await within( panel ).findByText( "This month was already resolved." ) ).toBeTruthy();
        expect( within( panel ).queryByText( /resistance/ ) ).toBeNull();
        expect( store.campaigns[0].log.some( ( l ) => l.text.includes( "resistance" ) ) ).toBe( false );
    } );

    // Re-review minor: a stored campaign the app cannot read is listed and explained, not a crash.
    it( "a stored campaign from a newer version is listed and explained instead of crashing the page", async () => {
        const c = saved( [] );
        store.campaigns = [ { ...c.export(), version: 99 } as unknown as ICampaignExport ];
        open( "" );
        expect( await screen.findByText( "Tharkad Defence" ) ).toBeTruthy();
        expect( screen.getByText( /Cannot be opened: This campaign was saved by a newer version of the app/ ) ).toBeTruthy();
        expect( screen.getByRole( "button", { name: "Delete" } ) ).toBeTruthy();
    } );

    it( "a stored campaign from a newer version shows why on its own page", async () => {
        const c = saved( [] );
        store.campaigns = [ { ...c.export(), version: 99 } as unknown as ICampaignExport ];
        open( "/c1" );
        expect( await screen.findByText( /This campaign cannot be opened: This campaign was saved by a newer version of the app/ ) ).toBeTruthy();
    } );

    // Review M4: a campaign's setup can change after it is made.
    it( "the Setup section renames the campaign and a side, adds a side and changes the start date", async () => {
        saved();
        open( "/c1" );
        const setup = await screen.findByTestId( "campaign-setup" );
        fireEvent.change( within( setup ).getByLabelText( "Campaign name" ), { target: { value: "Tharkad Holdout" } } );
        await waitFor( () => expect( store.campaigns[0].name ).toBe( "Tharkad Holdout" ) );
        fireEvent.change( within( setup ).getByLabelText( "Name of Raiders" ), { target: { value: "Jade Falcons" } } );
        await waitFor( () => expect( store.campaigns[0].sides.map( ( s ) => s.name ) ).toEqual( ["Lyrans", "Jade Falcons"] ) );
        fireEvent.change( within( setup ).getByLabelText( "Role of Lyrans" ), { target: { value: "other" } } );
        await waitFor( () => expect( store.campaigns[0].sides[0].role ).toBe( "other" ) );
        fireEvent.change( within( setup ).getByLabelText( "New side name" ), { target: { value: "ComStar" } } );
        fireEvent.click( within( setup ).getByRole( "button", { name: "Add side" } ) );
        await waitFor( () => expect( store.campaigns[0].sides.map( ( s ) => s.name ) ).toEqual( ["Lyrans", "Jade Falcons", "ComStar"] ) );
        // A date is taken only once it is a whole date.
        fireEvent.change( within( setup ).getByLabelText( "Start date" ), { target: { value: "3050-0" } } );
        fireEvent.change( within( setup ).getByLabelText( "Start date" ), { target: { value: "3050-06-01" } } );
        await waitFor( () => expect( store.campaigns[0].startDate ).toBe( "3050-06-01" ) );
        expect( screen.getByTestId( "campaign-step" ).textContent ).toContain( "3050-06-01" );
    } );

    it( "a campaign made with no planet gets one in Setup, and its planet page opens", async () => {
        const c = saved();
        c.planet = null;
        store.campaigns = [ c.export() ];
        open( "/c1" );
        const setup = await screen.findByTestId( "campaign-setup" );
        fireEvent.change( within( setup ).getByLabelText( "Planet name" ), { target: { value: "Freeworld" } } );
        await waitFor( () => expect( store.campaigns[0].planet ).toEqual( { systemId: null, name: "Freeworld", areas: [], customDotTypes: [], customCombinations: [] } ) );
        cleanup();
        open( "/c1/planet" );
        expect( await screen.findByText( "Freeworld", { exact: false } ) ).toBeTruthy();
        expect( screen.queryByText( "This campaign has no planet", { exact: false } ) ).toBeNull();
    } );

    it( "the planet page without a planet says where to set one", async () => {
        const c = saved();
        c.planet = null;
        store.campaigns = [ c.export() ];
        open( "/c1/planet" );
        expect( await screen.findByText( "This campaign has no planet yet: set one in Setup on the campaign page.", { exact: false } ) ).toBeTruthy();
    } );

    it( "Setup picks the planet from a star system", async () => {
        const c = saved();
        c.planet = null;
        store.campaigns = [ c.export() ];
        open( "/c1" );
        const setup = await screen.findByTestId( "campaign-setup" );
        fireEvent.change( within( setup ).getByLabelText( "Star system" ), { target: { value: "Thark" } } );
        fireEvent.click( await within( setup ).findByRole( "button", { name: "Tharkad" }, { timeout: 10000 } ) );
        await waitFor( () => expect( store.campaigns[0].planet?.systemId ).toBe( "Tharkad" ), { timeout: 10000 } );
        expect( store.campaigns[0].planet?.name ).toBe( "Tharkad" );
    } );

    // The spec's after-battle form (review M12): who fought and at what size, what each side lost, where, who holds it.
    it( "the after-battle form records a battle: losses, the area's new holder and a log line", async () => {
        const c = saved();
        const raiders = c.sides[1];
        c.force = [ { id: "u1", sideId: raiders.id, kind: "battlemech", savedId: null, name: "Wolverine WVR-6R", cost: null, bv: null, pv: null, snapshot: null, status: "" } ];
        store.campaigns = [ c.export() ];
        open( "/c1" );
        const form = await screen.findByTestId( "campaign-battle" );
        const record = within( form ).getByRole( "button", { name: "Record battle" } );
        expect( record ).toHaveProperty( "disabled", true );
        fireEvent.click( within( form ).getByLabelText( "Lyrans fought" ) );
        fireEvent.change( within( form ).getByLabelText( "Lyrans size" ), { target: { value: "company" } } );
        fireEvent.click( within( form ).getByLabelText( "Raiders fought" ) );
        fireEvent.click( within( form ).getByLabelText( "Lost Wolverine WVR-6R" ) );
        fireEvent.change( within( form ).getByLabelText( "Area" ), { target: { value: "a1" } } );
        fireEvent.change( within( form ).getByLabelText( "Held by" ), { target: { value: raiders.id } } );
        fireEvent.click( record );
        await waitFor( () => expect( store.campaigns[0].force[0].status ).toBe( "Lost in battle, month 0" ) );
        expect( store.campaigns[0].planet?.areas[0].controllerSideId ).toBe( raiders.id );
        expect( store.campaigns[0].log.map( ( l ) => l.text ) ).toContain(
            "Battle at Bremen: Lyrans (company) vs Raiders (lance, lost Wolverine WVR-6R); Raiders hold the ground" );
        // The form clears for the next battle.
        await waitFor( () => expect( within( form ).getByLabelText( "Lyrans fought" ) ).toHaveProperty( "checked", false ) );
    } );

    it( "the 3055 panel previews payroll and maintenance and books paydays on advance", async () => {
        const c = saved( [] );
        c.editionId = "mh-3055";
        store.campaigns = [ c.export() ];
        open( "/c1" );
        const panel = await screen.findByTestId( "edition-mh3055" );
        fireEvent.click( within( panel ).getByRole( "button", { name: "Add combatants" } ) );
        const unit = await within( panel ).findByTestId( "mh3055-unit-0" );
        fireEvent.change( within( unit ).getByLabelText( "Template" ), { target: { value: "heavy-mech" } } );
        fireEvent.change( within( unit ).getByLabelText( "Count" ), { target: { value: "4" } } );
        fireEvent.click( within( panel ).getByRole( "button", { name: "Add personnel" } ) );
        const person = await within( panel ).findByTestId( "mh3055-person-0" );
        fireEvent.change( within( person ).getByLabelText( "Count" ), { target: { value: "4" } } );
        // 4 Regular MechWarriors: 500 x 1.5 x 4 = 3,000 a payday; 4 heavy 'Mechs need 375 SP a week each.
        await waitFor( () => expect( within( panel ).getByTestId( "mh3055-costs" ).textContent ).toContain( "3,000" ) );
        expect( within( panel ).getByTestId( "mh3055-costs" ).textContent ).toContain( "1,500 SP" );
        // Regular experience alone is 10 points: Dragoons Rating D.
        expect( within( panel ).getByTestId( "mh3055-rating" ).textContent ).toContain( "D" );
        fireEvent.click( screen.getByRole( "button", { name: "Advance a month" } ) );
        await waitFor( () => expect( screen.getByTestId( "campaign-ledger-Lyrans" ).textContent ).toContain( "Payday 2 of 2" ) );
    } );

    it( "the 3055 panel rolls an employer and job and signs the contract", async () => {
        const c = saved( [] );
        c.editionId = "mh-3055";
        c.editionState = { personnel: [ { id: "p1", position: "mechwarrior", quality: "regular", count: 4, antiMech: false } ] };
        store.campaigns = [ c.export() ];
        vi.spyOn( campaignDice, "roll2d6" ).mockReturnValue( 7 );
        open( "/c1" );
        const panel = await screen.findByTestId( "edition-mh3055" );
        fireEvent.click( within( panel ).getByRole( "button", { name: "Roll employer" } ) );
        fireEvent.click( within( panel ).getByRole( "button", { name: "Roll job" } ) );
        // Employer 7 = Federated Commonwealth; its Job Table at 7 = Objective Raid against the Clans (2 months).
        // 3,000 x 2 paydays x 2.1 (D) x 1.3 (FedCom) x 1.6 (raid) x 2 (Clans) = 52,416 a month.
        await waitFor( () => expect( within( panel ).getByTestId( "mh3055-pay" ).textContent ).toContain( "104,832" ) );
        fireEvent.click( within( panel ).getByRole( "button", { name: "Sign contract" } ) );
        await waitFor( () => expect( store.campaigns[0].log.some( ( l ) =>
            l.text === "Contract signed: Objective Raid for Federated Commonwealth against the Clans, 2 months, 104,832 C-bills" ) ).toBe( true ) );
        expect( screen.getByTestId( "campaign-ledger-Lyrans" ).textContent ).toContain( "Contract advance (25%)" );
    } );

    it( "seeds dots from Objectives sites", async () => {
        saved();
        open( "/c1/planet" );
        fireEvent.click( await screen.findByRole( "button", { name: "Seed dots from Objectives" } ) );
        await waitFor( () => expect( store.campaigns[0].planet!.areas.map( ( a ) => a.name ) ).toContain( "Tharhes Industries" ) );
        const seeded = store.campaigns[0].planet!.areas.find( ( a ) => a.name === "Tharhes Industries" )!;
        expect( seeded.dots.map( ( d ) => d.type ) ).toEqual( ["heavy-manufacturing"] );
        expect( seeded.siteId ).toBe( "Tharkad-tharhes" );
    } );
} );
