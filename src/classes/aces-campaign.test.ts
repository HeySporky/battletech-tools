import { describe, expect, it } from "vitest";
import {
    AcesCampaign,
    AcesNamedPilot,
    calculateAcesSortieLedger,
    getAcesExistingForceWarchest,
    getAcesOmniReconfigureCost,
    getAcesPilotShares,
    getAcesPilotSPToNext,
    getAcesPlayerForcePVPercent,
    getAcesPurchaseCost,
    getAcesRepairCost,
    getAcesSalePrice,
    getAcesSortiePVLimit,
    IAcesRosterUnit,
    passesAcesSalvageCheck,
    resolveAcesCrew,
    validateAcesStartingForce,
} from "./aces-campaign";
import { acesPilotSkillThresholds } from "../data/aces-rules";

const rosterUnit = ( name: string, chassis: string, variant: string, type: string, pv: number ): IAcesRosterUnit => ( {
    id: name,
    chassis: chassis,
    variant: variant,
    name: name,
    type: type,
    size: 2,
    pv: pv,
    omni: false,
    enhancedNoAmmo: false,
    status: "active",
    mulID: 0,
    notes: "",
} );

describe("Aces campaign difficulty (Aces pp.28-29)", () => {
    it("reproduces Chris's example: Rookie +20% with 3,500 SP -10% fields 250 x 110% = 275 PV", () => {
        const percent = getAcesPlayerForcePVPercent( "rookie", true, 3500 );
        expect( percent ).toBe( 110 );
        expect( getAcesSortiePVLimit( 250, percent ) ).toBe( 275 );
    });

    it("reproduces Heather and Josh: 3,300 SP is the first bracket, 90% on Standard", () => {
        expect( getAcesPlayerForcePVPercent( "standard", true, 3300 ) ).toBe( 90 );
        expect( getAcesPlayerForcePVPercent( "standard", true, 3000 ) ).toBe( 100 );
        expect( getAcesPlayerForcePVPercent( "legendary", true, 12001 ) ).toBe( 30 );
        // A new force doesn't use the existing-force brackets.
        expect( getAcesPlayerForcePVPercent( "veteran", false, 9999 ) ).toBe( 90 );
    });

    it("tops an existing warchest up to 400 SP and converts 5 unspent PV to 200 SP (Aces p.29)", () => {
        expect( getAcesExistingForceWarchest( 230, 395 ) ).toBe( 600 );
    });
});

describe("Aces force creation (Aces p.26)", () => {
    it("needs 8 units within 400 PV", () => {
        const units = [ rosterUnit( "A", "Atlas", "AS7-D", "BM", 52 ) ];
        const issues = validateAcesStartingForce( units, false );
        expect( issues.some( ( issue ) => issue.message.indexOf( "at least 8" ) > -1 ) ).toBe( true );
    });

    it("allows two Warhammers but only one WHM-6R, and two identical Maxims (advanced)", () => {
        const base = [
            rosterUnit( "1", "Locust", "LCT-1V", "BM", 18 ),
            rosterUnit( "2", "Wasp", "WSP-1A", "BM", 18 ),
            rosterUnit( "3", "Stinger", "STG-3R", "BM", 18 ),
            rosterUnit( "4", "Commando", "COM-2D", "BM", 20 ),
            rosterUnit( "5", "Maxim Heavy Hover Transport", "(Standard)", "CV", 29 ),
            rosterUnit( "6", "Maxim Heavy Hover Transport", "(Standard)", "CV", 29 ),
        ];
        const ok = validateAcesStartingForce( [
            ...base,
            rosterUnit( "7", "Warhammer", "WHM-6R", "BM", 32 ),
            rosterUnit( "8", "Warhammer", "WHM-7A", "BM", 33 ),
        ], true );
        expect( ok ).toEqual( [] );
        const sameVariant = validateAcesStartingForce( [
            ...base,
            rosterUnit( "7", "Warhammer", "WHM-6R", "BM", 32 ),
            rosterUnit( "8", "Warhammer", "WHM-6R", "BM", 32 ),
        ], true );
        expect( sameVariant.length ).toBe( 1 );
        const threeMaxims = validateAcesStartingForce( [
            ...base,
            rosterUnit( "7", "Maxim Heavy Hover Transport", "(Standard)", "CV", 29 ),
            rosterUnit( "8", "Warhammer", "WHM-6R", "BM", 32 ),
        ], true );
        expect( threeMaxims.length ).toBe( 1 );
        const aerospace = validateAcesStartingForce( [ ...base, rosterUnit( "7", "Sparrowhawk", "SPR-H5", "AF", 20 ), rosterUnit( "8", "Wasp", "WSP-1D", "BM", 18 ) ], true );
        expect( aerospace.length ).toBe( 1 );
    });

    it("prices OMNI reconfiguration, purchases and sales (Aces pp.31, 36)", () => {
        expect( getAcesOmniReconfigureCost( 3, 50, 45 ) ).toBe( 15 );
        expect( getAcesOmniReconfigureCost( 3, 50, 53 ) ).toBe( 120 );
        expect( getAcesPurchaseCost( 28 ) ).toBe( 1120 );
        expect( getAcesSalePrice( 28 ) ).toBe( 560 );
    });
});

describe("Aces Named Pilots (Aces pp.27, 29, 35)", () => {
    it("reads the pilot card thresholds: Harlan's 120 SP gives 3 Edge tokens, 100 in abilities gives 1", () => {
        const harlan = new AcesNamedPilot();
        expect( harlan.allocate( "edgeTokens", 120 ) ).toBe( true );
        expect( harlan.allocate( "edgeAbilities", 30 ) ).toBe( true );
        expect( harlan.allocate( "skill", 1 ) ).toBe( false );
        expect( harlan.skill ).toBe( 4 );
        expect( harlan.edgeTokens ).toBe( 3 );
        expect( harlan.edgeAbilityCount ).toBe( 0 );
        harlan.unallocatedSP += 70;
        harlan.allocate( "edgeAbilities", 70 );
        expect( harlan.totalSP ).toBe( 220 );
        expect( harlan.edgeAbilityCount ).toBe( 1 );
    });

    it("Gus needs another 250 SP for Skill 3 after putting 150 in Skill", () => {
        expect( getAcesPilotSPToNext( acesPilotSkillThresholds, 150 ) ).toBe( 250 );
        expect( getAcesPilotSPToNext( acesPilotSkillThresholds, 3400 ) ).toBe( null );
    });

    it("splits shares: 80 each for participants, 40 for the pilot who sat out (Aces p.36)", () => {
        const shares = getAcesPilotShares( 860, 80, [
            { id: "harlan", status: "participated" },
            { id: "gus", status: "participated" },
            { id: "checkers", status: "participated" },
            { id: "jabal", status: "absent" },
        ] );
        expect( shares ).toEqual( { harlan: 80, gus: 80, checkers: 80, jabal: 40 } );
    });

    it("reproduces the p.35 example: 410 SP, 70 max, one wounded pilot sits out on 35", () => {
        const shares = getAcesPilotShares( 410, 70, [
            { id: "tommy", status: "participated" },
            { id: "b", status: "participated" },
            { id: "c", status: "participated" },
            { id: "wounded", status: "absent" },
        ] );
        expect( shares.tommy ).toBe( 70 );
        expect( shares.wounded ).toBe( 35 );
        expect( 410 - 70 * 3 - 35 ).toBe( 165 );
    });

    it("splits short earnings evenly, absent pilots at half, killed pilots at nothing", () => {
        const shares = getAcesPilotShares( 100, 80, [
            { id: "a", status: "participated" },
            { id: "b", status: "absent" },
            { id: "c", status: "killed" },
        ] );
        expect( shares.a ).toBe( 66 );
        expect( shares.b ).toBe( 33 );
        expect( shares.c ).toBe( 0 );
        expect( getAcesPilotShares( -50, 80, [ { id: "a", status: "participated" } ] ).a ).toBe( 0 );
    });
});

describe("Aces after-sortie steps (Aces pp.33-37)", () => {
    it("uses the Salvage Check targets and the crew table", () => {
        // Example: Warhammer 3 = truly destroyed, Locust 7 = ok, Maxim 6 = ok.
        expect( passesAcesSalvageCheck( "BM", 3 ) ).toBe( false );
        expect( passesAcesSalvageCheck( "BM", 7 ) ).toBe( true );
        expect( passesAcesSalvageCheck( "CV", 6 ) ).toBe( true );
        expect( passesAcesSalvageCheck( "BA", 7 ) ).toBe( false );
        expect( passesAcesSalvageCheck( "CI", 10 ) ).toBe( true );
        expect( passesAcesSalvageCheck( "AF", 12 ) ).toBe( null );
        // Crew: Warhammer 8 ok, Gus 5 wounded, Maxim 6 wounded.
        expect( resolveAcesCrew( 8 ) ).toBe( "unscathed" );
        expect( resolveAcesCrew( 5 ) ).toBe( "wounded" );
        expect( resolveAcesCrew( 3 ) ).toBe( "killed" );
        expect( resolveAcesCrew( null, true ) ).toBe( "killed" );
        expect( resolveAcesCrew( 12, false, true ) ).toBe( "wounded" );
    });

    it("halves Size for non-'Mechs without rounding: a crippled Size 3 tank costs 90 SP (Aces p.34)", () => {
        expect( getAcesRepairCost( "CV", 3, "crippled" ) ).toBe( 90 );
        expect( getAcesRepairCost( "BM", 3, "crippled" ) ).toBe( 180 );
    });

    it("reproduces the After Sortie Steps example ledger: 1,800 - 940 = 860 (Aces pp.36-37)", () => {
        const ledger = calculateAcesSortieLedger( {
            primaryObjectiveSP: 1200,
            otherObjectivesSP: 600,
            spPercent: 100,
            reconnaissanceSP: 100,
            waypointSP: 0,
            unitsToRearm: 5,
            woundedOrKilledCrews: 2,
            newNamedPilots: 0,
            destroyedSize: 2,
            crippledSize: 3,
            structureOrCriticalSize: 2,
            armorOnlySize: 4,
        } );
        expect( ledger.totalIncome ).toBe( 1800 );
        expect( ledger.rearming ).toBe( 100 );
        expect( ledger.personnelWounded ).toBe( 200 );
        expect( ledger.repairsDestroyed + ledger.repairsCrippled + ledger.repairsStructure + ledger.repairsArmor ).toBe( 540 );
        expect( ledger.totalExpenses ).toBe( 940 );
        expect( ledger.earnings ).toBe( 860 );
    });

    it("logs the example sortie: 400 + 860 - 280 - 0 = 980 SP, MVP bonus outside the warchest", () => {
        const campaign = new AcesCampaign();
        campaign.startingWarchest = 400;
        const names = [ "Harlan", "Gus", "Checkers", "Jabal" ];
        campaign.pilots = names.map( ( name ) => {
            const pilot = new AcesNamedPilot();
            pilot.id = name;
            pilot.callsign = name;
            pilot.unallocatedSP = 0;
            pilot.skillSP = 150;
            return pilot;
        } );
        const record = campaign.recordSortie( {
            datePlayed: "today",
            number: "01",
            name: "Example Sortie Name",
            win: true,
            ledgerInput: null,
            earnings: 860,
            purchases: 0,
            sales: 0,
            keywords: [ "EXAMPLE" ],
            mvpPilotId: "Gus",
            notes: "",
        }, 80, { Harlan: "participated", Gus: "participated", Checkers: "participated", Jabal: "absent" }, [ "Gus" ] );
        expect( record.namedPilotSP ).toBe( 280 );
        expect( record.warchestBalance ).toBe( 980 );
        expect( campaign.warchest ).toBe( 980 );
        expect( campaign.keywords ).toEqual( [ "EXAMPLE" ] );
        const gus = campaign.pilots[1];
        expect( gus.unallocatedSP ).toBe( 100 );
        expect( gus.mvpCount ).toBe( 1 );
        expect( gus.wounded ).toBe( true );
        expect( campaign.pilots[3].unallocatedSP ).toBe( 40 );

        const restored = new AcesCampaign( JSON.parse( JSON.stringify( campaign.export() ) ) );
        expect( restored.warchest ).toBe( 980 );
        expect( restored.pilots[1].totalSP ).toBe( 250 );
    });

    it("logs a failed sortie with no income, casualties or keywords (Aces p.32)", () => {
        const campaign = new AcesCampaign();
        campaign.startingWarchest = 400;
        const pilot = new AcesNamedPilot();
        pilot.id = "p";
        campaign.pilots = [ pilot ];
        const record = campaign.recordSortie( {
            datePlayed: "", number: "02", name: "", win: false, ledgerInput: null, earnings: 500,
            purchases: 0, sales: 0, keywords: [ "NOPE" ], mvpPilotId: "p", notes: "",
        }, 80, { p: "killed" } );
        expect( record.warchestBalance ).toBe( 400 );
        expect( pilot.killed ).toBe( false );
        expect( campaign.keywords ).toEqual( [] );
    });
});
