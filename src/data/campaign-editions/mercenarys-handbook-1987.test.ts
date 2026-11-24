import { describe, expect, it } from "vitest";
import { Campaign } from "../../classes/campaign/campaign";
import { fixedRolls } from "../../classes/campaign/unit-campaign";
import {
    IMh1987Line,
    MH1987_EDITION,
    MH1987_EMPLOYER_POSITION,
    mh1987ContractTerms,
    mh1987EnemyResistance,
    mh1987MissionCategory,
    mh1987MonthlyCosts,
    mh1987Morale,
    mh1987Negotiate,
    mh1987NegotiationPool,
    mh1987Outcome,
    mh1987ReadState,
    mh1987Reputation,
    mh1987ResolveMonth,
    mh1987EndContract,
    mh1987SignContract,
    MH1987_OUTCOMES,
    MH1987_SALARIES,
    MH1987_TYPES,
} from "./mercenarys-handbook-1987";

const line = ( type: IMh1987Line["type"], quality: IMh1987Line["quality"], count: number, extra: Partial<IMh1987Line> = {} ): IMh1987Line =>
    ( { id: type + quality + count, type, quality, condition: "new", count, company: "Company 1", ...extra } );

describe( "Mercenary's Handbook (1987): Cost of Living, pp.36-40", () => {
    it( "pins the Mercenary Salaries (p.37)", () => {
        expect( MH1987_SALARIES.mechwarrior ).toEqual( [400, 600, 1000, 2000] );
        expect( MH1987_SALARIES.infantry ).toEqual( [1050, 1750, 3500, 7000] );
        expect( MH1987_SALARIES.armor ).toEqual( [1000, 1750, 2500, 5000] );
        expect( MH1987_SALARIES.aircraft ).toEqual( [250, 400, 900, 1500] );
        expect( MH1987_SALARIES.scout ).toEqual( [150, 300, 600, 1200] );
        expect( MH1987_SALARIES.support ).toEqual( [200, 400, 750, 1500] );
        expect( MH1987_SALARIES.dropship ).toEqual( [3000, 5000, 7500, 12000] );
        expect( MH1987_SALARIES.jumpship ).toEqual( [3500, 6000, 10000, 15000] );
    } );

    it( "pins the Maintenance Cost Table (p.38)", () => {
        expect( MH1987_TYPES["heavy-mech"].maintenance ).toEqual( [35, 123] );
        expect( MH1987_TYPES["assault-mech"].maintenance ).toEqual( [45, 225] );
        expect( MH1987_TYPES["medium-lam"].maintenance ).toEqual( [35, 123] );
        expect( MH1987_TYPES.aerospace.maintenance ).toEqual( [12, 40] );
        expect( MH1987_TYPES.union.maintenance ).toEqual( [70, 140] );
        expect( MH1987_TYPES.excalibur.maintenance ).toEqual( [100, 200] );
        expect( MH1987_TYPES["star-lord"].maintenance ).toEqual( [90, 180] );
        expect( MH1987_TYPES["heavy-armor"].maintenance ).toEqual( [13, 13] );
        expect( MH1987_TYPES.support.maintenance ).toEqual( [0, 0] );
    } );

    it( "adds up a month: salaries, 500 supplies a squad, overhead on both, maintenance less support at 5,000 a point", () => {
        const costs = mh1987MonthlyCosts( {
            overheadPct: 15,
            roster: [
                line( "heavy-mech", "elite", 2 ), // 2 x 2,000; 2 x 35 SP; elite pilots make 1 SP each
                line( "light-mech", "green", 1, { condition: "salvaged" } ), // 400; 30 SP
                line( "support", "veteran", 1 ), // 750; makes 20 SP
                line( "union", "regular", 1 ), // 5,000 crew; 70 SP; not a squad
            ],
        } );
        expect( costs.salaries ).toBe( 4000 + 400 + 750 + 5000 );
        expect( costs.squads ).toBe( 4 );
        expect( costs.supplies ).toBe( 2000 );
        expect( costs.overhead ).toBe( Math.round( 0.15 * ( 10150 + 2000 ) ) );
        expect( costs.maintenanceSP ).toBe( 70 + 30 + 70 );
        expect( costs.supportSP ).toBe( 20 + 2 );
        expect( costs.maintenanceCost ).toBe( ( 170 - 22 ) * 5000 );
        expect( costs.total ).toBe( costs.salaries + costs.supplies + costs.overhead + costs.maintenanceCost );
    } );

    it( "destroyed equipment needs no maintenance; airmobile infantry is infantry plus 4", () => {
        const costs = mh1987MonthlyCosts( { overheadPct: 15, roster: [
            line( "assault-mech", "regular", 1, { condition: "destroyed" } ),
            line( "airmobile-infantry", "regular", 2 ),
        ] } );
        expect( costs.maintenanceSP ).toBe( 2 * 5 );
    } );

    it( "a destroyed line keeps its people (salary, supplies, morale) but makes no SP, earns no reputation and is not hired (p.38, p.50)", () => {
        const roster = [
            line( "heavy-mech", "elite", 2, { condition: "destroyed" } ),
            line( "support", "veteran", 1, { condition: "destroyed" } ),
            line( "medium-mech", "regular", 3 ),
        ];
        const costs = mh1987MonthlyCosts( { overheadPct: 15, roster } );
        expect( costs.salaries ).toBe( 2 * 2000 + 750 + 3 * 600 );
        expect( costs.squads ).toBe( 6 );
        expect( costs.supplies ).toBe( 6 * 500 );
        expect( costs.supportSP ).toBe( 0 );
        expect( costs.fieldSquads ).toBe( 3 );
        expect( mh1987Reputation( roster ) ).toBe( 1 ); // 3 medium x 2 = 6 -> 1; the destroyed heavies add nothing
        expect( mh1987Morale( { roster, overheadPct: 15, moraleMod: 0 } ).level ).toBe( Math.round( ( 2 * 4 + 3 + 3 * 2 ) / 6 * 100 ) / 100 );
        const c = new Campaign();
        c.editionId = "mh-1987";
        c.addSide( "Gray Wolves", "attacker" );
        const contract = mh1987SignContract( c, { ...mh1987ReadState( null ), roster }, {
            mission: "garrison",
            terms: { months: 1, ratePerSquadWeek: 1000, guarantee: "completion", command: "liaison", transportModifier: 0,
                supplyModifier: 0, salvage: "merc-claims" },
            advancePct: 0, transportFee: 0, roll: fixedRolls( [] ),
        } );
        expect( contract.squads ).toBe( 3 );
        expect( contract.total ).toBe( 1000 * 4 * 3 );
    } );

    it( "reputation: each company's points over 12, rounded up, summed (p.36)", () => {
        const roster = [
            line( "heavy-mech", "veteran", 4 ), // (3 + 1) x 4 = 16
            line( "light-mech", "regular", 8 ), // 1 x 8 = 8 -> 24 / 12 = 2
            line( "assault-mech", "elite", 1, { company: "Company 2" } ), // 4 + 2 = 6 -> 1
        ];
        expect( mh1987Reputation( roster ) ).toBe( 3 );
    } );

    it( "morale: squads' levels averaged, banded, moved by overhead (p.36, p.39, p.50)", () => {
        const roster = [line( "medium-mech", "elite", 1 ), line( "medium-mech", "green", 1 )];
        expect( mh1987Morale( { roster, overheadPct: 15, moraleMod: 0 } ) ).toEqual( { level: 2.5, label: "Regular" } );
        expect( mh1987Morale( { roster, overheadPct: 5, moraleMod: 0 } ).level ).toBe( 0.5 );
        expect( mh1987Morale( { roster, overheadPct: 20, moraleMod: 1 } ) ).toEqual( { level: 4.5, label: "Elite" } );
        expect( mh1987Morale( { roster: [line( "infantry", "green", 3 )], overheadPct: 15, moraleMod: 0 } ).label ).toBe( "Green" );
    } );
} );

describe( "Mercenary's Handbook (1987): Creating Contracts, pp.41-45", () => {
    it( "pins the Employer Position Table (p.41)", () => {
        expect( MH1987_EMPLOYER_POSITION ).toEqual( { 2: 5, 3: 15, 4: 25, 5: 35, 6: 75, 7: 95, 8: 85, 9: 55, 10: 45, 11: 45, 12: 55 } );
    } );

    it( "reads the Mission Table (p.42), 96-100 being Retainer again", () => {
        expect( mh1987MissionCategory( 0 ) ).toBe( "retainer" );
        expect( mh1987MissionCategory( 6 ) ).toBe( "minor-raid" );
        expect( mh1987MissionCategory( 35 ) ).toBe( "territorial" );
        expect( mh1987MissionCategory( 55 ) ).toBe( "combat" );
        expect( mh1987MissionCategory( 70 ) ).toBe( "invasion" );
        expect( mh1987MissionCategory( 80 ) ).toBe( "major-raid" );
        expect( mh1987MissionCategory( 95 ) ).toBe( "static-defense" );
        expect( mh1987MissionCategory( 96 ) ).toBe( "retainer" );
    } );

    it( "pool = reputation + 10 x negotiator Diplomacy - 10 x agent Diplomacy (p.41)", () => {
        expect( mh1987NegotiationPool( 6, 3, 2 ) ).toBe( 16 );
        expect( mh1987NegotiationPool( 1, 0, 5 ) ).toBe( 0 );
    } );

    it( "negotiates in order: a higher player number adds points, points lower the employer, the higher stands", () => {
        const result = mh1987Negotiate( {
            employer: { salvage: 20, remuneration: 75, length: 95 },
            player: { salvage: 30, remuneration: 0, length: 0 },
            pool: 50,
            order: ["salvage", "remuneration", "length"],
        } );
        expect( result.final ).toEqual( { salvage: 30, remuneration: 15, length: 95 } );
        expect( result.steps.map( ( s ) => [s.gained, s.spent] ) ).toEqual( [[10, 0], [0, 60], [0, 0]] );
        expect( result.poolLeft ).toBe( 0 );
    } );

    it( "turns final numbers into terms with the Mission Modification (pp.42-45)", () => {
        const terms = mh1987ContractTerms(
            { length: 61, remuneration: 21, guarantee: 41, command: 21, transport: 6, supply: 16, salvage: 71 },
            "objective-raid",
        );
        expect( terms ).toEqual( {
            months: 1, // 6 months - 6, never below 1
            ratePerSquadWeek: 17500 * 1.75,
            guarantee: "comstar",
            command: "independent", // 21 - 50
            transportModifier: 2.5,
            supplyModifier: 1,
            salvage: "employer-compensation",
        } );
        const garrison = mh1987ContractTerms(
            { length: 0, remuneration: 100, guarantee: 0, command: 100, transport: 100, supply: 100, salvage: 0 },
            "garrison",
        );
        expect( garrison ).toMatchObject( { months: 18, ratePerSquadWeek: 1250, guarantee: "prior", command: "house",
            transportModifier: 0, supplyModifier: 0, salvage: "merc-claims" } );
    } );
} );

describe( "Mercenary's Handbook (1987): Basic Campaign System, pp.47-50", () => {
    it( "pins Enemy Resistance (p.47)", () => {
        expect( [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map( ( r ) => mh1987EnemyResistance( "garrison", r ) ).join( "" ) ).toBe( "AHMLNNNLMHA" );
        expect( [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map( ( r ) => mh1987EnemyResistance( "offensive", r ) ).join( "" ) ).toBe( "HAMMALHMMAH" );
        expect( [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map( ( r ) => mh1987EnemyResistance( "guerrilla", r ) ).join( "" ) ).toBe( "HLNMLNLMNLH" );
    } );

    it( "pins outcome table rows (pp.48-49)", () => {
        const row = ( mission: Parameters<typeof mh1987Outcome>[0], force: Parameters<typeof mh1987Outcome>[1] ) =>
            [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map( ( r ) => mh1987Outcome( mission, force, r ) ).join( "" );
        expect( row( "offensive", "H" ) ).toBe( "QPONMIEDCBA" );
        expect( row( "garrison", "A" ) ).toBe( "PNLKJIHGFDB" );
        expect( row( "cadre", "N" ) ).toBe( "NMMLJIHEEED" );
        expect( row( "planetary-assault", "H" ) ).toBe( "QPPNMIEDBBA" );
        expect( row( "recon-raid", "A" ) ).toBe( "QPONNMLIGEC" );
        expect( row( "objective-raid", "L" ) ).toBe( "NMLKIFDCBAA" );
        expect( row( "diversionary-raid", "A" ) ).toBe( "QPONMLKJFED" );
        expect( row( "relief", "M" ) ).toBe( "PONMJIHEDCB" );
        expect( row( "riot", "H" ) ).toBe( "PONMMLKHFED" );
        expect( row( "siege", "L" ) ).toBe( "MKJIGFEDCBA" );
        expect( row( "guerrilla", "N" ) ).toBe( "ONMJHEEEDCB" );
        expect( row( "security", "A" ) ).toBe( "PNMMLIFEEDB" );
        expect( row( "defensive", "A" ) ).toBe( "QPONMHEDCBA" );
    } );

    it( "pins the Outcome Description Table (p.49)", () => {
        expect( MH1987_OUTCOMES.A ).toEqual( { result: "win", reputation: 6, danger: 5, salvaged: 6, destroyed: 5, plunder: 10 } );
        expect( MH1987_OUTCOMES.F ).toEqual( { result: "uncompleted", reputation: 1, danger: 6, salvaged: 7, destroyed: 6, plunder: 7 } );
        expect( MH1987_OUTCOMES.L ).toEqual( { result: "uncompleted", reputation: -1, danger: 8, salvaged: 9, destroyed: 8, plunder: 5 } );
        expect( MH1987_OUTCOMES.Q ).toEqual( { result: "loss", reputation: -6, danger: 9, salvaged: 10, destroyed: 9, plunder: 4 } );
    } );

    it( "resolves a month company by company: reputation per company, morale +1 on a win, plunder and losses by roll", () => {
        // resistance 7 -> N (garrison); outcome 9 on None -> E (win, +2, salvaged 7, destroyed 6, plunder 8)
        // company 1: salvaged roll 4 + morale 2 = 6 < 7 -> d6 3 squads; destroyed 5 + 2 = 7 ok; plunder 6 - 2 = 4 <= 8 -> 2D6 10 x 10,000
        // company 2: salvaged 6 + 2 ok; destroyed 2 + 2 = 4 < 6 -> d6 1; plunder 12 - 2 = 10 > 8 none
        const month = mh1987ResolveMonth( "garrison", 2, ["Company 1", "Company 2"], fixedRolls( [7, 9, 4, 3, 5, 6, 10, 6, 2, 1, 12] ) );
        expect( month.resistance ).toBe( "N" );
        expect( month.code ).toBe( "E" );
        expect( month.reputationChange ).toBe( 4 );
        expect( month.moraleChange ).toBe( 1 );
        expect( month.companies ).toEqual( [
            { company: "Company 1", salvagedSquads: 3, destroyedSquads: 0, plunder: 100000 },
            { company: "Company 2", salvagedSquads: 0, destroyedSquads: 1, plunder: 0 },
        ] );
        expect( month.plunder ).toBe( 100000 );
    } );
} );

describe( "Mercenary's Handbook (1987) edition hooks", () => {
    const campaign = (): Campaign => {
        const c = new Campaign();
        c.editionId = "mh-1987";
        const side = c.addSide( "Gray Death", "other" );
        c.editionState = { sideId: side.id, overheadPct: 15, moraleMod: 0, reputationMod: 0, contract: null,
            roster: [line( "medium-mech", "regular", 4 ), line( "support", "regular", 1 )] };
        return c;
    };

    it( "is a unit edition paid in C-bills by the month", () => {
        expect( MH1987_EDITION ).toMatchObject( { id: "mh-1987", kind: "unit", currency: "C-bills", timeStep: "month" } );
        expect( campaign().edition?.id ).toBe( "mh-1987" );
    } );

    it( "posts the month's salaries, supplies, overhead and maintenance as separate entries", () => {
        const c = campaign();
        c.advance();
        const side = c.sides[0].id;
        const reasons = c.ledger.map( ( e ) => [e.reason, e.amount] );
        expect( reasons ).toEqual( [
            ["Salaries", -( 4 * 600 + 400 )],
            ["Supplies", -( 5 * 500 )],
            ["Overhead (15%)", -Math.round( 0.15 * ( 2800 + 2500 ) )],
            ["Maintenance not covered by support (90 SP)", -( 4 * 25 - 10 ) * 5000],
        ] );
        expect( c.ledger.every( ( e ) => e.sideId === side && e.currency === "C-bills" && e.step === 1 ) ).toBe( true );
    } );

    it( "signs a ComStar contract: 25% advance now, the rest less 5% when it ends, supply fee monthly", () => {
        const c = campaign();
        const state = mh1987ReadState( c.editionState );
        mh1987SignContract( c, state, {
            mission: "objective-raid",
            terms: { months: 2, ratePerSquadWeek: 10000, guarantee: "comstar", command: "liaison", transportModifier: 1,
                supplyModifier: 0.5, salvage: "merc-claims" },
            advancePct: 25, transportFee: 100000, roll: fixedRolls( [] ),
        } );
        const total = 10000 * 4 * 5 * 2; // rate x 4 weeks x 5 squads x 2 months
        expect( c.ledger.map( ( e ) => [e.reason, e.amount] ) ).toEqual( [
            ["Contract advance (25%)", total * 0.25],
            ["Transport hired", -100000],
            ["Transport reimbursement (x1)", 100000],
        ] );
        c.ledger = [];
        c.advance( 2 );
        const pay = c.ledger.filter( ( e ) => e.amount > 0 ).map( ( e ) => [e.step, e.reason, e.amount] );
        expect( pay ).toEqual( [
            [1, "Supply fee", 0.5 * 500 * 5],
            [2, "Supply fee", 0.5 * 500 * 5],
            [2, "Contract completed: balance less ComStar's 5% fee", total * 0.75 - total * 0.05],
        ] );
        expect( mh1987ReadState( c.editionState ).contract?.completed ).toBe( true );
    } );

    // Review M8: a contract ended early keeps what was paid; ComStar makes a unit it judges failed repay its advance
    // (p.43 ComStar Intermediary). The other guarantees leave the money where it is (NGCFells's reading).
    it( "ends a contract early: the rest is not paid; a ComStar advance is repaid when ComStar judges it failed", () => {
        const signed = ( guarantee: "comstar" | "advance-completion" ) => {
            const c = campaign();
            mh1987SignContract( c, mh1987ReadState( c.editionState ), {
                mission: "objective-raid",
                terms: { months: 2, ratePerSquadWeek: 10000, guarantee, command: "liaison", transportModifier: 1,
                    supplyModifier: 0.5, salvage: "merc-claims" },
                advancePct: 25, transportFee: 0, roll: fixedRolls( [] ),
            } );
            c.ledger = [];
            return c;
        };
        const advance = 10000 * 4 * 5 * 2 * 0.25;

        const failed = signed( "comstar" );
        mh1987EndContract( failed, { judgedFailed: true } );
        expect( mh1987ReadState( failed.editionState ).contract ).toBeNull();
        expect( failed.ledger.map( ( e ) => [e.reason, e.amount, e.rule] ) ).toEqual( [
            ["Advance repaid: ComStar judged the contract unfulfilled", -advance, "Mercenary's Handbook (1987) p.43"],
        ] );
        expect( failed.log[failed.log.length - 1].text ).toBe( "Contract ended early: Objective Raid; ComStar judged it unfulfilled and the advance is repaid" );

        const ended = signed( "comstar" );
        mh1987EndContract( ended, { judgedFailed: false } );
        expect( ended.ledger ).toEqual( [] );
        expect( ended.log[ended.log.length - 1].text ).toBe( "Contract ended early: Objective Raid; what was paid is kept, the rest is not paid" );

        // Only ComStar can make a unit repay (p.18: the smaller intermediaries cannot).
        const privately = signed( "advance-completion" );
        mh1987EndContract( privately, { judgedFailed: true } );
        expect( privately.ledger ).toEqual( [] );
        privately.advance();
        expect( privately.ledger.some( ( e ) => e.reason.startsWith( "Contract completed" ) || e.reason === "Supply fee" ) ).toBe( false );
    } );

    it( "posts no 0 C-bill line when an amount rounds to nothing", () => {
        const c = campaign();
        const state = mh1987ReadState( c.editionState );
        mh1987SignContract( c, state, {
            mission: "objective-raid",
            terms: { months: 2, ratePerSquadWeek: 10000, guarantee: "comstar", command: "liaison", transportModifier: 0.5,
                supplyModifier: 0.5, salvage: "merc-claims" },
            advancePct: 25, transportFee: 0.6, roll: fixedRolls( [] ),
        } );
        expect( c.ledger.some( ( e ) => e.amount === 0 ) ).toBe( false );
    } );

    it( "a Minor Intermediary advance is 2D6 - 2 percent", () => {
        const c = campaign();
        mh1987SignContract( c, mh1987ReadState( c.editionState ), {
            mission: "garrison",
            terms: { months: 12, ratePerSquadWeek: 1000, guarantee: "minor-intermediary", command: "house", transportModifier: 0,
                supplyModifier: 0, salvage: "employer-claims" },
            advancePct: 25, transportFee: 0, roll: fixedRolls( [9] ),
        } );
        expect( c.ledger.map( ( e ) => [e.reason, e.amount] ) ).toEqual( [["Contract advance (7%)", 1000 * 4 * 5 * 12 * 0.07]] );
    } );

    it( "reads a damaged edition state without throwing", () => {
        expect( mh1987ReadState( null ).roster ).toEqual( [] );
        const state = mh1987ReadState( { roster: [{ id: "x", type: "nope", quality: "green", count: 1 }, { id: "y", type: "scout", quality: "elite", count: -3 }], overheadPct: 7 } );
        expect( state.roster.map( ( l ) => [l.type, l.count] ) ).toEqual( [["scout", 0]] );
        expect( state.overheadPct ).toBe( 15 );
    } );
} );
