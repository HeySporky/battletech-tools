import { describe, expect, it } from "vitest";
import { Campaign, CAMPAIGN_MAX_EDITION_STATE } from "./campaign";
import { CAMPAIGN_EXPORT_VERSION, ICampaignExport } from "./campaign-types";
import { CAMPAIGN_EDITIONS } from "../../data/campaign-editions";

const fixture = (): ICampaignExport => ( {
    version: CAMPAIGN_EXPORT_VERSION,
    id: "c1",
    name: "Tharkad Raid",
    editionId: null,
    rulesetIds: ["fw-economics"],
    startDate: "3025-01-15",
    step: 2,
    sides: [
        { id: "a", name: "Lyran Commonwealth", role: "defender" },
        { id: "b", name: "Raiders", role: "attacker" },
    ],
    targets: [ { id: "t1", sideId: "b", systemId: "Tharkad", intent: "assault" } ],
    force: [],
    ledger: [ { id: "l1", sideId: "a", step: 1, amount: 5000000, currency: "C-bills", reason: "Payday", rule: "fw-economics" } ],
    log: [ { id: "g1", step: 1, text: "Month 1" } ],
    planet: {
        systemId: "Tharkad",
        name: "Tharkad",
        customDotTypes: [ { id: "spice", name: "Spice", value: 2000000, target: 8 } ],
        customCombinations: [ { id: "gm1", name: "Spice trade", needs: { spice: 1, processing: 1 }, multiplier: 3 } ],
        areas: [ {
            id: "ar1",
            name: "Tharkad City",
            terrain: "urban",
            controllerSideId: "a",
            dots: [ { id: "d1", type: "mining", destroyed: false }, { id: "d2", type: "refining", destroyed: true } ],
            comboOverride: null,
            seized: true,
            siteId: "site-1",
        } ],
    },
    editionState: null,
    contractSheets: [],
} );

describe( "Campaign", () => {
    it( "round-trips through export and import", () => {
        const data = fixture();
        const again = new Campaign();
        again.import( new Campaign( data ).export() );
        expect( again.export() ).toEqual( data );
    } );

    it( "balances each side's ledger in its currency", () => {
        const c = new Campaign();
        const a = c.addSide( "A", "attacker" );
        const b = c.addSide( "B", "defender" );
        c.addLedger( { sideId: a.id, step: 0, amount: 5000000, currency: "C-bills", reason: "Pay", rule: "" } );
        c.addLedger( { sideId: a.id, step: 0, amount: -1200000, currency: "C-bills", reason: "Repairs", rule: "" } );
        c.addLedger( { sideId: b.id, step: 0, amount: 3, currency: "SP", reason: "Sortie", rule: "" } );
        expect( c.balance( a.id ) ).toBe( 3800000 );
        expect( c.balance( b.id, "SP" ) ).toBe( 3 );
        expect( c.balance( b.id ) ).toBe( 0 );
    } );

    it( "refuses a non-object and skips malformed items", () => {
        const c = new Campaign();
        expect( () => c.import( "x" ) ).toThrow();
        expect( () => c.import( { name: "no id" } ) ).toThrow();
        const data: any = fixture();
        data.ledger.push( { id: "bad", step: 1, amount: 1, currency: "C-bills", reason: "", rule: "" } );
        data.sides.push( "nonsense" );
        c.import( data );
        expect( c.export().ledger.map( ( e ) => e.id ) ).toEqual( ["l1"] );
        expect( c.export().sides ).toHaveLength( 2 );
    } );

    it( "lists each ruleset once and refuses a newer save version", () => {
        const c = new Campaign();
        const data: any = fixture();
        data.rulesetIds = [ "fw-economics", "fw-economics", "fw-economic-damage" ];
        c.import( data );
        expect( c.rulesetIds ).toEqual( [ "fw-economics", "fw-economic-damage" ] );
        data.version = CAMPAIGN_EXPORT_VERSION + 1;
        expect( () => new Campaign().import( data ) ).toThrow( /newer/ );
    } );

    it( "refuses an edition state over the size cap", () => {
        const data: any = fixture();
        data.editionState = { roster: [ { notes: "x".repeat( CAMPAIGN_MAX_EDITION_STATE ) } ] };
        expect( () => new Campaign().import( data ) ).toThrow( /edition data is too large/ );
        data.editionState = { roster: [ { notes: "x".repeat( 1000 ) } ] };
        expect( new Campaign( data ).editionState ).toEqual( data.editionState );
    } );

    it( "records a battle: logs it, marks losses, sets who holds the area and runs the edition's hook", () => {
        const c = new Campaign( fixture() );
        c.force = [ { id: "u1", sideId: "b", kind: "battlemech", savedId: null, name: "Wolverine WVR-6R", cost: null, bv: null, pv: null, snapshot: null, status: "" } ];
        const seen: unknown[] = [];
        c.editionId = "test-battle";
        const registered = [ ...CAMPAIGN_EDITIONS ];
        CAMPAIGN_EDITIONS.push( { id: "test-battle", name: "Test", source: { title: "", publication: "", pages: "" }, kind: "unit",
            currency: "C-bills", timeStep: "month", afterBattle: ( _c, r ) => { seen.push( r ); } } );
        try {
            c.recordBattle( {
                areaId: "ar1",
                sides: [ { sideId: "a", size: "company", losses: [] }, { sideId: "b", size: "lance", losses: ["u1"] } ],
                heldBySideId: "b",
            } );
        } finally {
            CAMPAIGN_EDITIONS.splice( 0, CAMPAIGN_EDITIONS.length, ...registered );
        }
        expect( c.planet!.areas[0].controllerSideId ).toBe( "b" );
        expect( c.planet!.areas[0].seized ).toBe( true );
        expect( c.force[0].status ).toBe( "Lost in battle, month 2" );
        expect( c.log[c.log.length - 1].text ).toBe(
            "Battle at Tharkad City: Lyran Commonwealth (company) vs Raiders (lance, lost Wolverine WVR-6R); Raiders hold the ground" );
        expect( seen ).toHaveLength( 1 );
    } );

    it( "advances months and logs each", () => {
        const c = new Campaign();
        c.advance( 3 );
        expect( c.step ).toBe( 3 );
        expect( c.export().log.map( ( l ) => l.text ) ).toEqual( ["Month 1", "Month 2", "Month 3"] );
    } );

    it( "uses C-bills and months with no edition", () => {
        const c = new Campaign();
        expect( c.currency ).toBe( "C-bills" );
        expect( c.timeStep ).toBe( "month" );
    } );

    it( "counts the date in months", () => {
        const c = new Campaign();
        c.startDate = "3025-01-15";
        c.advance( 14 );
        expect( c.currentDate() ).toBe( "3026-03-15" );
    } );

    it( "caps imported arrays at 5,000 entries", () => {
        const data: any = fixture();
        data.log = Array.from( { length: 5003 }, ( _, i ) => ( { id: "g" + i, step: 0, text: "x" } ) );
        const c = new Campaign( data );
        expect( c.export().log ).toHaveLength( 5000 );
    } );
} );
