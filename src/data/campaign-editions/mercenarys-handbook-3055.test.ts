import { describe, expect, it } from "vitest";
import { Campaign } from "../../classes/campaign/campaign";
import { findCampaignEdition } from "./index";
import {
    IMh3055Person,
    IMh3055RatingInputs,
    IMh3055Signing,
    IMh3055Unit,
    MH3055_EDITION,
    mh3055ReadState,
    mh3055EndContract,
    mh3055SignContract,
    MH3055_EXPERIENCE,
    MH3055_MISSIONS,
    MH3055_SALARIES,
    MH3055_TEMPLATES,
    mh3055BattleLoss,
    mh3055ContractHearing,
    mh3055ContractOffers,
    mh3055ContractPay,
    mh3055DragoonsRating,
    mh3055EmployerMultiplier,
    mh3055EmployerRoll,
    mh3055JobRoll,
    mh3055JobTable,
    mh3055Maintenance,
    mh3055MinorPowerRoll,
    mh3055Payroll,
    mh3055RatingBand,
    mh3055Salvage,
    mh3055StraightSupport,
    mh3055SupportPoints,
    mh3055Transport,
    mh3055WeeklyOverhead,
} from "./mercenarys-handbook-3055";

const p = ( position: IMh3055Person["position"], quality: IMh3055Person["quality"], count: number, antiMech = false ): IMh3055Person =>
    ( { id: position + quality + count, position, quality, count, antiMech } );

/** The Crimson Crusaders (p.89), salaries per person, infantry squads of 7. */
const CRUSADERS: IMh3055Person[] = [
    p( "mechwarrior", "regular", 8 ), p( "mechwarrior", "veteran", 4 ),
    p( "armor", "veteran", 16 ),
    p( "infantry", "green", 84 ),
    p( "technician", "green", 2 ), p( "technician", "regular", 3 ), p( "technician", "veteran", 1 ),
    p( "mechanic", "regular", 2 ), p( "mechanic", "veteran", 1 ),
    p( "medic", "green", 2 ), p( "medic", "regular", 1 ), p( "medic", "veteran", 1 ),
    p( "c3", "regular", 1 ), p( "c3", "veteran", 1 ),
    p( "specialist", "green", 2 ),
    p( "administration", "regular", 1 ),
];

describe( "Mercenary's Handbook (3055): pay and support, pp.85-89, 112-114", () => {
    it( "pins the biweekly Salary Table and the experience multipliers (p.89)", () => {
        expect( MH3055_SALARIES ).toEqual( {
            mechwarrior: 500, aerospace: 500, armor: 300, infantry: 250, scout: 375, artillery: 300, technician: 320,
            engineer: 320, mechanic: 270, medic: 320, specialist: 320, c3: 240, administration: 640,
        } );
        expect( MH3055_EXPERIENCE ).toEqual( { green: 1, regular: 1.5, veteran: 2, elite: 3 } );
    } );

    it( "adds up the Crimson Crusaders' biweekly payroll to 48,870 (p.89)", () => {
        expect( mh3055Payroll( CRUSADERS ) ).toBe( 48870 );
    } );

    it( "pays anti-'Mech troops twice again (p.89)", () => {
        expect( mh3055Payroll( [p( "infantry", "veteran", 7, true )] ) ).toBe( 7 * 250 * 2 * 2 );
    } );

    it( "pins Combatant Templates' cost and Support Required (pp.112-114)", () => {
        expect( MH3055_TEMPLATES["heavy-mech"] ).toMatchObject( { cost: 6260000, support: 375 } );
        expect( MH3055_TEMPLATES["heavy-tracked"] ).toMatchObject( { cost: 3000000, support: 615 } );
        expect( MH3055_TEMPLATES["assault-mech"] ).toMatchObject( { cost: 8120000, support: 500 } );
        expect( MH3055_TEMPLATES["heavy-aerospace"] ).toMatchObject( { cost: 5350000, support: 900 } );
        expect( MH3055_TEMPLATES["battle-suits"] ).toMatchObject( { cost: 1437500, support: 160 } );
        expect( MH3055_TEMPLATES["long-tom"] ).toMatchObject( { cost: 2500000, support: 520 } );
        expect( MH3055_TEMPLATES["submarine"] ).toMatchObject( { cost: 4000000, support: 675 } );
    } );

    it( "weekly maintenance is the templates' Support Required (Ruling 1): the Crusaders' motorized squads 104 + 336 (p.86)", () => {
        expect( mh3055Maintenance( [
            { id: "a", template: "motorized-rifle", quality: "green", count: 4 },
            { id: "b", template: "motorized-srm", quality: "regular", count: 8 },
        ] ) ).toBe( 104 + 336 );
    } );

    it( "support personnel make 675 / 1,630 / 2,810 / 3,095 SP a week by grade; combat troops make none (p.114, Ruling 6)", () => {
        expect( mh3055SupportPoints( [p( "technician", "green", 2 ), p( "medic", "elite", 1 ), p( "administration", "veteran", 1 ),
            p( "mechwarrior", "elite", 4 )] ) ).toBe( 2 * 675 + 3095 + 2810 );
    } );

    it( "overhead is 5% of the contract a week, over 4 weeks a month (p.88, Ruling 7)", () => {
        expect( mh3055WeeklyOverhead( 1200000, 3 ) ).toBe( 1200000 * 0.05 / 12 );
        expect( mh3055WeeklyOverhead( 1200000, 0 ) ).toBe( 0 );
    } );
} );

describe( "Mercenary's Handbook (3055): Dragoons Rating, p.100", () => {
    it( "adds and subtracts the rating points", () => {
        const rating = mh3055DragoonsRating( {
            completed: 3, // 15
            uncompleted: 0,
            losses: 1, // -10
            breaches: 0,
            supportPct: 85, // 2 x 10% over 60 -> 10
            transportPct: 70, // 2 x 10% over 50 -> 10
            jumpShip: true, // 10
            leadership: 3, // 12
            experience: "regular", // 10
            techPct: 55, // 2 x 10% over 30 -> 10
        } );
        expect( rating ).toEqual( { points: 67, rating: "C" } );
    } );

    it( "takes 25 a breach and 25 an uncompleted mission; nothing for shares at or under the floor", () => {
        expect( mh3055DragoonsRating( { completed: 0, uncompleted: 1, losses: 0, breaches: 1, supportPct: 60, transportPct: 40,
            jumpShip: false, leadership: -2, experience: "elite", techPct: 30 } ).points ).toBe( 40 - 50 );
    } );

    it( "bands: 0-45 D, 46-85 C, 86-120 B, 121+ A", () => {
        expect( [-10, 45, 46, 85, 86, 120, 121].map( mh3055RatingBand ) ).toEqual( ["D", "D", "C", "C", "B", "B", "A"] );
    } );
} );

describe( "Mercenary's Handbook (3055): Contracts, pp.102-108", () => {
    it( "Contract Offers: 2D6 + D 1 / C 2 / B 3 / A 5 (p.102)", () => {
        expect( mh3055ContractOffers( 2, "D" ) ).toBe( 0 );
        expect( mh3055ContractOffers( 3, "C" ) ).toBe( 1 );
        expect( mh3055ContractOffers( 6, "B" ) ).toBe( 2 );
        expect( mh3055ContractOffers( 7, "A" ) ).toBe( 3 );
        expect( mh3055ContractOffers( 12, "A" ) ).toBe( 4 );
    } );

    it( "reads the employer and minor power tables (p.102)", () => {
        expect( [2, 3, 4, 5, 6, 7, 9, 10, 11, 12].map( mh3055EmployerRoll ) ).toEqual(
            ["capellan", "capellan", "fwl", "fwl", "combine", "fedcom", "fedcom", "minor-power", "minor-power", "mercenary"] );
        expect( [3, 5, 7, 8, 9, 11, 12].map( mh3055MinorPowerRoll ) ).toEqual(
            ["canopus", "outworlds", "rasalhague", "corporation", "st-ives", "taurian", "minor-periphery"] );
    } );

    it( "sends each employer to its job table; Rasalhague and St. Ives are fixed (Ruling 5)", () => {
        expect( mh3055JobTable( "fwl" ) ).toBe( "house-fwl-cc" );
        expect( mh3055JobTable( "fedcom" ) ).toBe( "house-dc-fc" );
        expect( mh3055JobTable( "taurian" ) ).toBe( "periphery" );
        expect( mh3055JobRoll( "rasalhague", 2 ) ).toEqual( { missions: ["objective-raid"], target: "clans" } );
        expect( mh3055JobRoll( "st-ives", 12 ) ).toEqual( { missions: ["garrison", "cadre"] } );
    } );

    it( "reads the job tables (pp.103-104); the Periphery's printed 2-3 / 3-6 overlap reads 3 on the first row", () => {
        expect( mh3055JobRoll( "capellan", 3 ) ).toEqual( { missions: ["garrison", "cadre"] } );
        expect( mh3055JobRoll( "combine", 8 ) ).toEqual( { missions: ["objective-raid"], target: "clans" } );
        expect( mh3055JobRoll( "fedcom", 5 ) ).toEqual( { missions: ["objective-raid"], target: "successor-state" } );
        expect( mh3055JobRoll( "fedcom", 12 ) ).toEqual( { missions: [], special: true } );
        expect( mh3055JobRoll( "corporation", 10 ) ).toEqual( { missions: ["extraction"], target: "clans" } );
        expect( mh3055JobRoll( "canopus", 3 ) ).toEqual( { missions: ["objective-raid"] } );
        expect( mh3055JobRoll( "canopus", 4 ) ).toEqual( { missions: ["planetary-assault"] } );
        expect( mh3055JobRoll( "mercenary", 8 ) ).toEqual( { missions: ["planetary-assault"], supporting: true } );
        expect( mh3055JobRoll( "special", 12 ) ).toEqual( { missions: ["guerrilla"] } );
    } );

    it( "pins mission multipliers and minimum months (pp.104-105)", () => {
        expect( MH3055_MISSIONS.guerrilla ).toEqual( { multiplier: 2.1, minMonths: 6 } );
        expect( MH3055_MISSIONS.cadre ).toEqual( { multiplier: 0.75, minMonths: 12 } );
        expect( MH3055_MISSIONS.retainer ).toEqual( { multiplier: 1.3, minMonths: 24 } );
        expect( MH3055_MISSIONS["objective-raid"] ).toEqual( { multiplier: 1.6, minMonths: 2 } );
    } );

    it( "employer multipliers; a corporation rolls 2D6: 2-3 x1, 4-5 x1.4, 6+ x1.75 (p.105)", () => {
        expect( mh3055EmployerMultiplier( "capellan" ) ).toBe( 2 );
        expect( mh3055EmployerMultiplier( "combine" ) ).toBe( 1.5 );
        expect( mh3055EmployerMultiplier( "st-ives" ) ).toBe( 1 );
        expect( [2, 3, 4, 5, 6, 12].map( ( r ) => mh3055EmployerMultiplier( "corporation", r ) ) ).toEqual( [1, 1, 1.4, 1.4, 1.75, 1.75] );
    } );

    it( "payment = monthly salaries (2 paydays, Ruling 7) x rating x employer x mission (Clans x2) x months (p.105-106)", () => {
        const pay = mh3055ContractPay( { biweeklyPayroll: 48870, rating: "B", employerMultiplier: 1.3, mission: "garrison",
            vsClans: false, months: 12, bonuses: 0 } );
        expect( pay.monthly ).toBeCloseTo( 48870 * 2 * 2.7 * 1.3 * 0.9 );
        expect( pay.total ).toBeCloseTo( pay.monthly * 12 );
        const clans = mh3055ContractPay( { biweeklyPayroll: 1000, rating: "D", employerMultiplier: 1, mission: "objective-raid",
            vsClans: true, months: 2, bonuses: 500 } );
        expect( clans.monthly ).toBeCloseTo( 1000 * 2 * 2.1 * 1.6 * 2 + 500 );
        expect( clans.total ).toBeCloseTo( clans.monthly * 2 );
    } );

    it( "Straight Support and Battle Loss: 2D6 +1 B or C, +2 A, +3 Marik (p.107)", () => {
        expect( mh3055StraightSupport( 3, "D", "combine" ) ).toBe( 50 );
        expect( mh3055StraightSupport( 6, "C", "combine" ) ).toBe( 60 );
        expect( mh3055StraightSupport( 9, "A", "fwl" ) ).toBe( 100 );
        expect( mh3055StraightSupport( 2, "D", "fedcom" ) ).toBe( 50 );
        expect( mh3055BattleLoss( 10, "D", "fedcom" ) ).toBe( 25 );
        expect( mh3055BattleLoss( 12, "A", "fedcom" ) ).toBe( 50 );
    } );

    it( "transport compensation by 1D6 (p.107)", () => {
        expect( [1, 2, 3, 4, 5, 6].map( ( r ) => mh3055Transport( r, "ships" ) ) ).toEqual( [12, 18, 23, 27, 30, 32] );
        expect( [1, 6].map( ( r ) => mh3055Transport( r, "commercial" ) ) ).toEqual( [30, 40] );
    } );

    it( "salvage: 2D6 +5 Combine or Rasalhague, -3 vs the Clans; 2-7 none, 8-11 exchange, 12-14 full (p.108)", () => {
        expect( mh3055Salvage( 7, "fedcom", false ) ).toBe( "none" );
        expect( mh3055Salvage( 8, "fedcom", false ) ).toBe( "exchange" );
        expect( mh3055Salvage( 7, "combine", false ) ).toBe( "full" );
        expect( mh3055Salvage( 10, "fedcom", true ) ).toBe( "none" );
        expect( mh3055Salvage( 12, "rasalhague", false ) ).toBe( "full" );
    } );

    it( "Contract Hearing: 2D6 + the gamemaster's modifiers (p.110)", () => {
        expect( mh3055ContractHearing( 2 ) ).toEqual( { fine: 20000, banMonths: 1, disbanded: false } );
        expect( mh3055ContractHearing( 9 ) ).toEqual( { fine: 25000, banMonths: 3, disbanded: false } );
        expect( mh3055ContractHearing( 23 ) ).toEqual( { fine: 1500000, banMonths: 60, disbanded: false } );
        expect( mh3055ContractHearing( 24 ) ).toEqual( { fine: 4000000, banMonths: 0, disbanded: true } );
    } );
} );

describe( "Mercenary's Handbook (3055) edition hooks", () => {
    const u = ( template: string, count: number ): IMh3055Unit => ( { id: template + count, template, quality: "regular", count } );
    /** 10 points: D-rated. */
    const D_RATED: IMh3055RatingInputs = { completed: 0, uncompleted: 0, losses: 0, breaches: 0, supportPct: 0,
        transportPct: 0, jumpShip: false, leadership: 0, experience: "regular", techPct: 0 };
    /** 40 + 40 + 20 + 35 = 135 points: A-rated. */
    const A_RATED: IMh3055RatingInputs = { ...D_RATED, experience: "elite", leadership: 10, supportPct: 100, techPct: 100 };
    /** Biweekly payroll 4 x 750 + 480 = 3,480; support 1,630 SP a week against 1,000 SP of medium 'Mechs. */
    const campaign = ( roster: IMh3055Unit[] = [u( "medium-mech", 4 )], rating = D_RATED ): Campaign => {
        const c = new Campaign();
        c.editionId = "mh-3055";
        const side = c.addSide( "Black Thorns", "other" );
        c.editionState = { sideId: side.id, roster, rating, contract: null,
            personnel: [p( "mechwarrior", "regular", 4 ), p( "technician", "regular", 1 )] };
        return c;
    };
    const sign = ( c: Campaign, terms: Partial<IMh3055Signing> ) => mh3055SignContract( c, mh3055ReadState( c.editionState ), {
        employer: "mercenary", mission: "pirate-hunting", vsClans: false, months: 4, employerMultiplier: 1, bonuses: 0,
        advancePct: 0, upFront: false, ...terms,
    } );
    const pay = ( c: Campaign ) => c.ledger.filter( ( e ) => e.amount > 0 ).map( ( e ) => [e.step, e.reason, e.amount] );

    it( "is a unit edition paid in C-bills by the month, registered with the others", () => {
        expect( MH3055_EDITION ).toMatchObject( { id: "mh-3055", kind: "unit", currency: "C-bills", timeStep: "month" } );
        expect( findCampaignEdition( "mh-3055" ) ).toBe( MH3055_EDITION );
    } );

    it( "pays two biweekly paydays a month and posts no overhead without a contract (Ruling 7, p.88)", () => {
        const c = campaign();
        c.advance();
        expect( c.ledger.map( ( e ) => [e.step, e.reason, e.amount, e.currency] ) ).toEqual( [
            [1, "Payday 1 of 2", -3480, "C-bills"],
            [1, "Payday 2 of 2", -3480, "C-bills"],
        ] );
        expect( c.log.some( ( l ) => l.text.includes( "Maintenance short" ) ) ).toBe( false );
    } );

    it( "logs four weeks of maintenance the support staff cannot cover (pp.86-88)", () => {
        const c = campaign( [u( "heavy-mech", 6 )] );
        c.advance();
        expect( c.log.map( ( l ) => l.text ) ).toContain( "Maintenance short 620 SP a week for 4 weeks (2,250 needed, 1,630 generated)" );
    } );

    it( "rates the unit by the Dragoons Rating", () => {
        expect( MH3055_EDITION.rating?.( campaign() ) ).toEqual( { value: 10, label: "Dragoons Rating D" } );
        expect( MH3055_EDITION.rating?.( campaign( undefined, A_RATED ) ) ).toEqual( { value: 135, label: "Dragoons Rating A" } );
    } );

    it( "holds a contract to its mission's length: an objective raid at most 2 months, others at least their minimum (pp.104-105)", () => {
        expect( sign( campaign(), { mission: "objective-raid", months: 12 } ).months ).toBe( 2 );
        expect( sign( campaign(), { mission: "garrison", months: 3 } ).months ).toBe( 12 );
        expect( sign( campaign(), { mission: "recon", months: 5 } ).months ).toBe( 5 );
    } );

    it( "signs a 4-month contract: up to 25% before the mission less 5%, upkeep monthly, the rest at the end (p.106)", () => {
        const c = campaign();
        const contract = sign( c, { advancePct: 40 } );
        const total = 3480 * 2 * 2.1 * 4; // monthly salaries x D 2.1 x employer 1 x pirate hunting 1, 4 months
        expect( contract.total ).toBe( total );
        expect( c.ledger.map( ( e ) => [e.reason, e.amount] ) ).toEqual( [
            ["Contract advance (25%)", total * 0.25],
            ["Bonding Commission handling fee (5%)", -Math.round( total * 0.25 * 0.05 )],
        ] );
        c.ledger = [];
        c.advance( 4 );
        const overhead = total * 0.05 / 16 * 4;
        expect( c.ledger.filter( ( e ) => e.reason === "Overhead (4 weeks)" ).map( ( e ) => e.amount ) )
            .toEqual( [1, 2, 3, 4].map( () => -Math.round( overhead ) ) );
        const upkeep = Math.round( 3480 * 2 + overhead );
        expect( pay( c ) ).toEqual( [
            [1, "Upkeep draw", upkeep], [2, "Upkeep draw", upkeep], [3, "Upkeep draw", upkeep],
            [4, "Contract completed: balance paid", total * 0.75 - 3 * upkeep],
        ] );
        expect( mh3055ReadState( c.editionState ).contract?.completed ).toBe( true );
        c.ledger = [];
        c.advance();
        expect( c.ledger.map( ( e ) => e.reason ) ).toEqual( ["Payday 1 of 2", "Payday 2 of 2"] );
    } );

    // Review M8: a completed contract counts toward the Dragoons Rating (p.100 step 1: 5 points per completed mission).
    it( "a completed contract adds one to Contracts completed", () => {
        const c = campaign();
        sign( c, { months: 4 } );
        c.advance( 4 );
        expect( mh3055ReadState( c.editionState ).rating.completed ).toBe( 1 );
        c.advance();
        expect( mh3055ReadState( c.editionState ).rating.completed ).toBe( 1 );
    } );

    // Review M8: a contract can end before its time: lost (p.110), not completed (p.100 step 7) or by a breach hearing
    // (pp.109-110). The unit keeps what it has drawn; the rest is not paid.
    it( "ends a contract lost: a loss on the rating, the rest unpaid (p.110)", () => {
        const c = campaign();
        sign( c, { months: 4, advancePct: 25 } );
        c.ledger = [];
        mh3055EndContract( c, { kind: "lost" } );
        const state = mh3055ReadState( c.editionState );
        expect( state.contract ).toBeNull();
        expect( state.rating.losses ).toBe( 1 );
        expect( c.ledger ).toEqual( [] );
        expect( c.log[c.log.length - 1].text ).toBe( "Contract lost: Pirate Hunting; the rest of the pay is suspended (Dragoons Rating -10)" );
        c.advance();
        expect( c.ledger.map( ( e ) => e.reason ) ).toEqual( ["Payday 1 of 2", "Payday 2 of 2"] );
    } );

    it( "ends a contract not completed: an uncompleted mission on the rating (p.100)", () => {
        const c = campaign();
        sign( c, { months: 4 } );
        mh3055EndContract( c, { kind: "uncompleted" } );
        expect( mh3055ReadState( c.editionState ).rating.uncompleted ).toBe( 1 );
        expect( c.log[c.log.length - 1].text ).toBe( "Contract not completed: Pirate Hunting (Dragoons Rating -25)" );
    } );

    it( "a breach hearing ends the contract; guilty books the Contract Hearing fine and a breach (pp.109-110)", () => {
        const c = campaign();
        sign( c, { months: 4 } );
        c.ledger = [];
        mh3055EndContract( c, { kind: "hearing", guilty: true, roll: 7 } );
        const state = mh3055ReadState( c.editionState );
        expect( state.contract ).toBeNull();
        expect( state.rating.breaches ).toBe( 1 );
        expect( c.ledger.map( ( e ) => [e.reason, e.amount, e.rule] ) ).toEqual( [["Breach of contract fine", -25000, "Mercenary's Handbook 3055 p.110"]] );
        expect( c.log[c.log.length - 1].text ).toBe( "Breach of contract hearing (roll 7): guilty, 25,000 C-bill fine and a 3-month hiring ban (Dragoons Rating -25)" );

        const cleared = campaign();
        sign( cleared, { months: 4 } );
        cleared.ledger = [];
        mh3055EndContract( cleared, { kind: "hearing", guilty: false, roll: 0 } );
        expect( mh3055ReadState( cleared.editionState ).rating.breaches ).toBe( 0 );
        expect( cleared.ledger ).toEqual( [] );
        expect( cleared.log[cleared.log.length - 1].text ).toBe( "Breach of contract hearing: cleared; the Commission terminated the contract" );

        const disbanded = campaign();
        sign( disbanded, { months: 4 } );
        mh3055EndContract( disbanded, { kind: "hearing", guilty: true, roll: 24 } );
        expect( disbanded.log[disbanded.log.length - 1].text ).toBe(
            "Breach of contract hearing (roll 24): guilty, 4,000,000 C-bill fine; the unit is disbanded, each member under a 5-year hiring ban (Dragoons Rating -25)" );
    } );

    it( "a contract over six months draws the balance over the months left (p.106)", () => {
        const c = campaign();
        const total = sign( c, { months: 8 } ).total;
        expect( c.ledger ).toEqual( [] );
        c.advance( 8 );
        expect( pay( c ) ).toEqual( [
            ...[1, 2, 3, 4, 5, 6, 7].map( ( m ) => [m, `Monthly draw (${m} of 8)`, total / 8] ),
            [8, "Contract completed: balance paid", total / 8],
        ] );
    } );

    it( "an A-rated unit may take the whole payment up front for 2% more (p.106)", () => {
        const c = campaign( undefined, A_RATED );
        const total = sign( c, { months: 2, upFront: true } ).total;
        expect( total ).toBe( 3480 * 2 * 3 * 2 );
        expect( c.ledger.map( ( e ) => [e.reason, e.amount] ) ).toEqual( [
            ["Contract paid in full up front", total],
            ["Bonding Commission handling fee (7%)", -Math.round( total * 0.07 )],
        ] );
        c.ledger = [];
        c.advance( 2 );
        expect( pay( c ) ).toEqual( [] );
        expect( mh3055ReadState( c.editionState ).contract?.completed ).toBe( true );
    } );

    it( "only an A-rated unit is paid up front", () => {
        const c = campaign();
        sign( c, { upFront: true, advancePct: 10 } );
        expect( c.ledger.map( ( e ) => e.reason ) ).toEqual( ["Contract advance (10%)", "Bonding Commission handling fee (5%)"] );
    } );

    it( "prices the contract by employer, mission, the Clans and bonuses (pp.105-106)", () => {
        const c = campaign();
        const contract = sign( c, { employer: "combine", employerMultiplier: 1.5, mission: "objective-raid", vsClans: true, months: 2, bonuses: 1000 } );
        expect( contract.total ).toBeCloseTo( ( 3480 * 2 * 2.1 * 1.5 * 1.6 * 2 + 1000 ) * 2, 6 );
        expect( contract ).toMatchObject( { employer: "combine", mission: "objective-raid", vsClans: true, months: 2, startStep: 0 } );
    } );

    it( "reads a damaged edition state without throwing", () => {
        expect( mh3055ReadState( null ) ).toMatchObject( { sideId: null, roster: [], personnel: [], contract: null } );
        expect( mh3055ReadState( null ).rating ).toEqual( D_RATED );
        const state = mh3055ReadState( {
            roster: [{ id: "a", template: "nope", quality: "green", count: 1 }, { id: "b", template: "light-mech", quality: "elite", count: -2 }],
            personnel: [{ id: "x", position: "pilot", quality: "green", count: 1 }, { id: "y", position: "medic", quality: "veteran", count: 3, antiMech: "yes" }],
            rating: { completed: 3, experience: "legendary", leadership: "x" },
            contract: { id: "k", employer: "nowhere", mission: "garrison" },
        } );
        expect( state.roster.map( ( l ) => [l.template, l.count] ) ).toEqual( [["light-mech", 0]] );
        expect( state.personnel.map( ( l ) => [l.position, l.count, l.antiMech] ) ).toEqual( [["medic", 3, false]] );
        expect( state.rating ).toEqual( { ...D_RATED, completed: 3 } );
        expect( state.contract ).toBeNull();
    } );
} );
