import { afterEach, describe, expect, it } from "vitest";
import { CAMPAIGN_EDITIONS } from "../../data/campaign-editions";
import { MH1987_EDITION } from "../../data/campaign-editions/mercenarys-handbook-1987";
import { MH3055_EDITION } from "../../data/campaign-editions/mercenarys-handbook-3055";
import { getRulesetBlock, findSpecialRuleset } from "../../data/special-rulesets";
import { Campaign } from "./campaign";
import { CAMPAIGN_RULE_HOOKS } from "./campaign-rules";

const economyCampaign = ( rulesetIds: string[] = ["fw-economics"] ): Campaign => {
    const c = new Campaign();
    c.rulesetIds = rulesetIds;
    const held = c.addSide( "Defenders", "defender" );
    c.addSide( "Raiders", "attacker" );
    c.planet = {
        systemId: null, name: "Testworld", customDotTypes: [], customCombinations: [],
        areas: [ { id: "a1", name: "Farms", terrain: "plains", controllerSideId: held.id, comboOverride: null,
            dots: [ { id: "d1", type: "food", destroyed: false }, { id: "d2", type: "food", destroyed: false }, { id: "d3", type: "processing", destroyed: false } ] } ],
    };
    return c;
};

describe( "Campaign rule hooks", () => {
    // Put the real registry back after each test that adds a test edition.
    const registered = [ ...CAMPAIGN_EDITIONS ];
    afterEach( () => { CAMPAIGN_EDITIONS.splice( 0, CAMPAIGN_EDITIONS.length, ...registered ); } );

    it( "has a step hook for Economics only", () => {
        expect( typeof CAMPAIGN_RULE_HOOKS["fw-economics"].onStep ).toBe( "function" );
        expect( CAMPAIGN_RULE_HOOKS["fw-economic-damage"]?.onStep ).toBeUndefined();
    } );

    it( "pays on months 3, 6 and 9 only", () => {
        const c = economyCampaign();
        c.advance( 9 );
        const paydays = c.ledger.filter( ( e ) => e.rule === "fw-economics" );
        expect( paydays.map( ( e ) => e.step ) ).toEqual( [3, 6, 9] );
        expect( paydays.every( ( e ) => e.amount === 6000000 ) ).toBe( true );
        expect( c.balance( c.sides[0].id ) ).toBe( 18000000 );
        expect( c.log.filter( ( l ) => l.text.startsWith( "Payday" ) ) ).toHaveLength( 3 );
    } );

    it( "pays each step once when advanced one month at a time", () => {
        const c = economyCampaign();
        for( let i = 0; i < 6; i++ ) c.advance();
        expect( c.ledger.map( ( e ) => e.step ) ).toEqual( [3, 6] );
    } );

    it( "no payday without the ruleset ticked", () => {
        const c = economyCampaign( [] );
        c.advance( 6 );
        expect( c.ledger ).toEqual( [] );
    } );

    it( "no payday on a sortie edition", () => {
        CAMPAIGN_EDITIONS.push( { id: "test-sortie", name: "Test", source: { title: "", publication: "", pages: "" }, kind: "unit", currency: "SP", timeStep: "sortie" } );
        const c = economyCampaign();
        c.editionId = "test-sortie";
        c.advance( 6 );
        expect( c.ledger ).toEqual( [] );
    } );

    it( "pays the GM's own combinations at payday", () => {
        const c = economyCampaign();
        c.planet!.customCombinations = [ { id: "gm", name: "Granary", needs: { food: 2, processing: 1 }, multiplier: 3 } ];
        c.advance( 3 );
        // 9,000,000 (triple 3 dots) beats the printed 6,000,000.
        expect( c.ledger[0].amount ).toBe( 9000000 );
    } );

    it( "a side with no paying areas gets no entry", () => {
        const c = economyCampaign();
        c.advance( 3 );
        expect( c.ledger.map( ( e ) => e.sideId ) ).toEqual( [c.sides[0].id] );
    } );

    it.each( [MH1987_EDITION, MH3055_EDITION] )( "the payday counts in the $id edition's balance", ( edition ) => {
        CAMPAIGN_EDITIONS.push( { ...edition, onStep: undefined } );
        const c = economyCampaign();
        c.editionId = edition.id;
        c.advance( 3 );
        expect( c.ledger.map( ( e ) => e.currency ) ).toEqual( [c.currency] );
        expect( c.balance( c.sides[0].id ) ).toBe( 6000000 );
    } );

    it( "C-bills without an edition", () => {
        const c = economyCampaign();
        c.advance( 3 );
        expect( c.currency ).toBe( "C-bills" );
        expect( c.ledger[0].currency ).toBe( "C-bills" );
    } );

    it( "runs the edition's own step hook", () => {
        const seen: number[] = [];
        CAMPAIGN_EDITIONS.push( { id: "test-month", name: "Test", source: { title: "", publication: "", pages: "" }, kind: "unit", currency: "C-bills", timeStep: "month", onStep: ( c ) => { seen.push( c.step ); } } );
        const c = economyCampaign( [] );
        c.editionId = "test-month";
        c.advance( 2 );
        expect( seen ).toEqual( [1, 2] );
    } );
} );

describe( "The Economics rulesets", () => {
    it( "economics says the merge was NGCFells's decision", () => {
        const r = findSpecialRuleset( "fw-economics" )!;
        expect( r.category ).toBe( "campaign" );
        expect( r.changes ).toEqual( ["planetEconomics"] );
        expect( r.source.author ).toBe( "Herb Barents" );
        expect( r.description ).toContain( "Both printings merged into one ruleset by NGCFells's decision." );
        expect( r.summary.length ).toBeLessThanOrEqual( 120 );
    } );

    it( "economic damage needs economics and credits NGCFells", () => {
        const r = findSpecialRuleset( "fw-economic-damage" )!;
        expect( r.requires ).toEqual( ["fw-economics"] );
        expect( r.description ).toContain( "Inspired by Herb Barents, Future Wars #5" );
        expect( r.description ).toContain( "NGCFells" );
        expect( getRulesetBlock( [], "fw-economic-damage" ) ).toMatchObject( { kind: "needs" } );
        expect( getRulesetBlock( ["fw-economics"], "fw-economic-damage" ) ).toBeUndefined();
    } );
} );
