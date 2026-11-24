import { describe, expect, it } from "vitest";
import { Campaign } from "./campaign";
import { CONTRACT_SHEET_MAX_ROWS, CONTRACT_SHEET_MAX_TEXT, CONTRACT_SHEET_ROWS, newContractSheet, pickContractSheet } from "./contract-sheet";
import { CONTRACT_FORMS, DEFAULT_CONTRACT_FORM_ID, documentFieldIds, findContractForm } from "./contract-sheet-versions";

describe( "contract sheets (#639)", () => {
    it( "a new sheet has the 23 printed ledger lines and the Draconis Reach form unless another is asked for", () => {
        expect( newContractSheet().rows ).toHaveLength( CONTRACT_SHEET_ROWS );
        expect( CONTRACT_SHEET_ROWS ).toBe( 23 );
        expect( newContractSheet().versionId ).toBe( DEFAULT_CONTRACT_FORM_ID );
        expect( newContractSheet( "", "fmm-worksheet" ).versionId ).toBe( "fmm-worksheet" );
        expect( newContractSheet( "", "no-such-form" ).versionId ).toBe( DEFAULT_CONTRACT_FORM_ID );
    } );

    it( "round-trips with the campaign; a save made before sheets has none", () => {
        const c = new Campaign();
        const sheet = newContractSheet( "Henshin Tigers", "hs-draconis-reach-mallorys-world" );
        sheet.basePay = { percent: "60", roll: "7" };
        sheet.rows[0].event = "Contract Accepted";
        sheet.checks = { defensive1: true, bpww: true };
        sheet.fields = { employer: "Draconis Combine" };
        c.contractSheets = [ sheet ];
        expect( new Campaign( c.export() ).contractSheets ).toEqual( [ sheet ] );

        const old = c.export();
        delete old.contractSheets;
        expect( new Campaign( old ).contractSheets ).toEqual( [] );
    } );

    it( "cleans a stored sheet: wrong types become blank, text and lines are capped, short ledgers are padded", () => {
        expect( pickContractSheet( { name: "no id" } ) ).toBeNull();
        const picked = pickContractSheet( {
            id: "s1", name: 5, contract: "x".repeat( CONTRACT_SHEET_MAX_TEXT + 10 ), basePay: "60",
            rows: [ { month: "1", event: { bad: true } } ],
            fields: { employer: "Kurita", "bad key!": "x", number: 5 }, checks: { a: true, b: "yes", c: false },
        } )!;
        expect( picked.versionId ).toBe( DEFAULT_CONTRACT_FORM_ID );
        expect( picked.name ).toBe( "" );
        expect( picked.contract ).toHaveLength( CONTRACT_SHEET_MAX_TEXT );
        expect( picked.basePay ).toEqual( { percent: "", roll: "" } );
        expect( picked.rows ).toHaveLength( CONTRACT_SHEET_ROWS );
        expect( picked.rows[0] ).toMatchObject( { month: "1", event: "" } );
        expect( picked.fields ).toEqual( { employer: "Kurita" } );
        expect( picked.checks ).toEqual( { a: true } );

        const long = pickContractSheet( { id: "s2", rows: Array.from( { length: CONTRACT_SHEET_MAX_ROWS + 50 }, () => ( {} ) ) } )!;
        expect( long.rows ).toHaveLength( CONTRACT_SHEET_MAX_ROWS );
    } );
} );

describe( "contract forms from the books", () => {
    it( "has every form the library prints, each with a source page", () => {
        expect( CONTRACT_FORMS.map( ( f ) => f.id ) ).toEqual( [
            "hs-draconis-reach", "hs-draconis-reach-mallorys-world", "hs-hinterlands", "hs-hinterlands-first", "mercenaries",
            "hs-employment", "mercenaries-employment", "mh1987-contract", "fmm-worksheet",
        ] );
        for( const form of CONTRACT_FORMS ) expect( form.source.pages ).not.toBe( "" );
        expect( findContractForm( "nonsense" ).id ).toBe( DEFAULT_CONTRACT_FORM_ID );
    } );

    it( "prints each record sheet's Common Costs/Pay as its book does", () => {
        const bonus = ( id: string ) => ( findContractForm( id ) as { commonCosts: { heading: string; lines: { label: string; value: string }[] }[] } )
            .commonCosts.find( ( g ) => g.heading === "Combat Bonus:" )!.lines.map( ( l ) => `${l.label} ${l.value}` );
        expect( bonus( "hs-draconis-reach" ) ).toEqual( [ "Broke Contract: 0", "Unsuccessful: 250 SP × Scale", "Success: 500 SP × Scale", "All Obj: 750 SP × Scale" ] );
        // Hot Spots: Hinterlands errata v2.41 replaced the first two entries.
        expect( bonus( "hs-hinterlands" ).slice( 0, 2 ) ).toEqual( [ "Broke Contract: 0", "Unsuccessful: 50% Base Pay" ] );
        expect( bonus( "hs-hinterlands-first" ).slice( 0, 2 ) ).toEqual( [ "No Obj/Lost Units: 0", "1+Obj: 50% Base Pay" ] );
        expect( bonus( "mercenaries" ) ).toEqual( bonus( "hs-hinterlands-first" ) );
        const mercs = findContractForm( "mercenaries" );
        expect( mercs.kind === "record" && mercs.commonCosts.at( -1 )!.lines[0] ).toEqual( { label: "Salvage Value:", value: "Ton × 10" } );
    } );

    it( "gives every blank and box in a contract or worksheet its own id", () => {
        for( const form of CONTRACT_FORMS ) {
            if( form.kind !== "document" ) continue;
            const { fields, checks } = documentFieldIds( form );
            const all = fields.concat( checks );
            expect( new Set( all ).size, form.id ).toBe( all.length );
            for( const id of form.labelFields ) expect( fields, form.id ).toContain( id );
        }
    } );
} );
