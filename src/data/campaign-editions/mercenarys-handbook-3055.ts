import type { Campaign } from "../../classes/campaign/campaign";
import { ICampaignEdition } from "../../classes/campaign/campaign-types";
import { clampInt, isQuality, Quality, rangeLookup, RangeTable, unitSideId } from "../../classes/campaign/unit-campaign";
import { generateUUID } from "../../utils/generateUUID";

/*
 * Mercenary's Handbook 3055 (FASA 1670, 1993). Every figure read from the scan's page images: pay (p.89), maintenance
 * (pp.86-88), the Dragoons Rating (p.100), contracts (pp.102-108) and the Combatant Templates (pp.112-114). Printed
 * misprints kept as read: the Periphery Job Table's 2-3 / 3-6 rows overlap at 3 (a 3 reads the first row) and the
 * corporation pay roll is 2D6 but prints "1-3" for its first row. Pure tables and functions only.
 */

export const MH3055_ID = "mh-3055";

export type Mh3055Position =
    "mechwarrior" | "aerospace" | "armor" | "infantry" | "scout" | "artillery" | "technician" | "engineer" | "mechanic" |
    "medic" | "specialist" | "c3" | "administration";

/** Salary Table (p.89), C-bills per person every two weeks (a year is 26 paydays). */
export const MH3055_SALARIES: Record<Mh3055Position, number> = {
    mechwarrior: 500, aerospace: 500, armor: 300, infantry: 250, scout: 375, artillery: 300, technician: 320,
    engineer: 320, mechanic: 270, medic: 320, specialist: 320, c3: 240, administration: 640,
};

/** Experience multipliers on salary (p.89). */
export const MH3055_EXPERIENCE: Record<Quality, number> = { green: 1, regular: 1.5, veteran: 2, elite: 3 };

/** Anti-'Mech troops are paid twice again (p.89). */
const ANTI_MECH_PAY = 2;

/** The positions that generate Support Points (Ruling 6: every support position, by grade). */
export const MH3055_SUPPORT_POSITIONS: Mh3055Position[] = ["technician", "engineer", "mechanic", "medic", "specialist", "c3", "administration"];

/** Support Points a week per support person by grade (p.114). */
export const MH3055_SUPPORT_POINTS: Record<Quality, number> = { green: 675, regular: 1630, veteran: 2810, elite: 3095 };

export interface IMh3055Person {
    id: string;
    position: Mh3055Position;
    quality: Quality;
    count: number;
    antiMech: boolean;
}

export type Mh3055TemplateGroup = "mech" | "vehicle" | "aerospace" | "infantry" | "specialist" | "artillery" | "other";

export interface IMh3055Template {
    name: string;
    group: Mh3055TemplateGroup;
    /** Template cost in C-bills, before the quality multiplier. */
    cost: number;
    /** Support Required, Support Points a week. */
    support: number;
}

const tpl = ( name: string, group: Mh3055TemplateGroup, cost: number, support: number ): IMh3055Template =>
    ( { name, group, cost, support } );

/** Combatant Templates (pp.112-114): cost and Support Required. */
export const MH3055_TEMPLATES: Record<string, IMh3055Template> = {
    "light-mech": tpl( "Light 'Mech", "mech", 1670000, 130 ),
    "medium-mech": tpl( "Medium 'Mech", "mech", 3500000, 250 ),
    "heavy-mech": tpl( "Heavy 'Mech", "mech", 6260000, 375 ),
    "assault-mech": tpl( "Assault 'Mech", "mech", 8120000, 500 ),
    "light-wheeled": tpl( "Light Wheeled Vehicle", "vehicle", 250000, 100 ),
    "medium-wheeled": tpl( "Medium Wheeled Vehicle", "vehicle", 1000000, 300 ),
    "heavy-wheeled": tpl( "Heavy Wheeled Vehicle", "vehicle", 1500000, 500 ),
    "light-tracked": tpl( "Light Tracked Vehicle", "vehicle", 370000, 110 ),
    "medium-tracked": tpl( "Medium Tracked Vehicle", "vehicle", 1825000, 350 ),
    "heavy-tracked": tpl( "Heavy Tracked Vehicle", "vehicle", 3000000, 615 ),
    "light-hover": tpl( "Light Hover Vehicle", "vehicle", 180000, 85 ),
    "medium-hover": tpl( "Medium Hover Vehicle", "vehicle", 765000, 260 ),
    "heavy-hover": tpl( "Heavy Hover Vehicle", "vehicle", 1400000, 400 ),
    "light-aerospace": tpl( "Light Aerospace Fighter", "aerospace", 1750000, 190 ),
    "medium-aerospace": tpl( "Medium Aerospace Fighter", "aerospace", 2500000, 390 ),
    "heavy-aerospace": tpl( "Heavy Aerospace Fighter", "aerospace", 5350000, 900 ),
    "foot-rifle": tpl( "Foot Rifle Squad", "infantry", 45000, 17 ),
    "foot-flamer": tpl( "Foot Flamer Squad", "infantry", 54000, 20 ),
    "foot-mg": tpl( "Foot Machine Gun Squad", "infantry", 63000, 25 ),
    "foot-laser": tpl( "Foot Laser Squad", "infantry", 72000, 27 ),
    "foot-srm": tpl( "Foot SRM Squad", "infantry", 81000, 30 ),
    "motorized-rifle": tpl( "Motorized Rifle Squad", "infantry", 80800, 26 ),
    "motorized-flamer": tpl( "Motorized Flamer Squad", "infantry", 90900, 32 ),
    "motorized-mg": tpl( "Motorized Machine Gun Squad", "infantry", 101000, 35 ),
    "motorized-laser": tpl( "Motorized Laser Squad", "infantry", 111100, 37 ),
    "motorized-srm": tpl( "Motorized SRM Squad", "infantry", 121200, 42 ),
    "jump-rifle": tpl( "Jump Rifle Squad", "infantry", 129800, 37 ),
    "jump-flamer": tpl( "Jump Flamer Squad", "infantry", 141600, 42 ),
    "jump-mg": tpl( "Jump Machine Gun Squad", "infantry", 153400, 45 ),
    "jump-laser": tpl( "Jump Laser Squad", "infantry", 165200, 50 ),
    "jump-srm": tpl( "Jump SRM Squad", "infantry", 177000, 52 ),
    "anti-mech": tpl( "Anti-'Mech Squad", "specialist", 285000, 88 ),
    "battle-suits": tpl( "Battle Suits", "specialist", 1437500, 160 ),
    "security": tpl( "Security Squad", "specialist", 25500, 37 ),
    "scout": tpl( "Scout Squad", "specialist", 34000, 52 ),
    "thumper": tpl( "Thumper Artillery", "artillery", 1500000, 400 ),
    "sniper": tpl( "Sniper Artillery", "artillery", 2000000, 435 ),
    "long-tom": tpl( "Long Tom Artillery", "artillery", 2500000, 520 ),
    "arrow-iv": tpl( "Arrow IV Artillery", "artillery", 2000000, 350 ),
    "conventional-fighter": tpl( "Conventional Fighter", "other", 735000, 190 ),
    "vtol": tpl( "VTOL", "other", 500000, 180 ),
    "naval": tpl( "Naval Vessel", "other", 1000000, 300 ),
    "hydrofoil": tpl( "Hydrofoil", "other", 350000, 175 ),
    "submarine": tpl( "Submarine", "other", 4000000, 675 ),
};

export interface IMh3055Unit {
    id: string;
    template: string;
    quality: Quality;
    count: number;
}

/** Biweekly payroll (p.89): salary x experience, anti-'Mech troops x2 more, per person. */
export function mh3055Payroll( people: IMh3055Person[] ): number {
    return people.reduce( ( sum, p ) =>
        sum + p.count * MH3055_SALARIES[p.position] * MH3055_EXPERIENCE[p.quality] * ( p.antiMech ? ANTI_MECH_PAY : 1 ), 0 );
}

/** Weekly maintenance in Support Points: the templates' Support Required (p.86 basic rule, Ruling 1). */
export function mh3055Maintenance( units: IMh3055Unit[] ): number {
    return units.reduce( ( sum, u ) => sum + u.count * ( MH3055_TEMPLATES[u.template]?.support ?? 0 ), 0 );
}

/** Support Points a week the support personnel generate (p.114, Ruling 6); combat troops make none. */
export function mh3055SupportPoints( people: IMh3055Person[] ): number {
    return people.reduce( ( sum, p ) =>
        sum + ( MH3055_SUPPORT_POSITIONS.includes( p.position ) ? p.count * MH3055_SUPPORT_POINTS[p.quality] : 0 ), 0 );
}

/** Overhead (p.88): 5% of the contract, spread over its weeks (4 a month, Ruling 7), each week. */
export function mh3055WeeklyOverhead( contractTotal: number, months: number ): number {
    if( months <= 0 ) return 0;
    return contractTotal * 0.05 / ( months * 4 );
}

// ---------------------------------------------------------------- Dragoons Rating (p.100)

export type Mh3055Rating = "A" | "B" | "C" | "D";

export interface IMh3055RatingInputs {
    completed: number;
    uncompleted: number;
    losses: number;
    breaches: number;
    /** Support available as a percentage of maintenance required. */
    supportPct: number;
    /** Transport capacity as a percentage of the unit's needs. */
    transportPct: number;
    jumpShip: boolean;
    leadership: number;
    experience: Quality;
    /** Technicians as a percentage of the requirement. */
    techPct: number;
}

const RATING_EXPERIENCE: Record<Quality, number> = { green: 5, regular: 10, veteran: 20, elite: 40 };

/** 5 points per full 10% above the floor; nothing at or under it. */
const per10Over = ( pct: number, floor: number ): number => Math.max( 0, Math.floor( ( pct - floor ) / 10 ) ) * 5;

export function mh3055RatingBand( points: number ): Mh3055Rating {
    if( points <= 45 ) return "D";
    if( points <= 85 ) return "C";
    if( points <= 120 ) return "B";
    return "A";
}

export function mh3055DragoonsRating( r: IMh3055RatingInputs ): { points: number; rating: Mh3055Rating } {
    const points =
        5 * r.completed
        - 25 * r.uncompleted
        - 10 * r.losses
        - 25 * r.breaches
        + per10Over( r.supportPct, 60 )
        + per10Over( r.transportPct, 50 )
        + ( r.jumpShip ? 10 : 0 )
        + 4 * Math.max( 0, r.leadership )
        + RATING_EXPERIENCE[r.experience]
        + per10Over( r.techPct, 30 );
    return { points, rating: mh3055RatingBand( points ) };
}

/** Contract Offers modifier and pay multiplier by rating (pp.102, 105). */
export const MH3055_RATING_OFFER: Record<Mh3055Rating, number> = { D: 1, C: 2, B: 3, A: 5 };
export const MH3055_RATING_PAY: Record<Mh3055Rating, number> = { D: 2.1, C: 2.4, B: 2.7, A: 3 };

// ---------------------------------------------------------------- Contracts (pp.102-108)

/** Contract Offers (p.102): 2D6 + rating modifier. */
export function mh3055ContractOffers( roll: number, rating: Mh3055Rating ): number {
    return rangeLookup( [[3, 0], [5, 1], [9, 2], [12, 3], [Infinity, 4]], roll + MH3055_RATING_OFFER[rating] );
}

export type Mh3055House = "capellan" | "fwl" | "combine" | "fedcom";
export type Mh3055MinorPower = "canopus" | "outworlds" | "rasalhague" | "corporation" | "st-ives" | "taurian" | "minor-periphery";
export type Mh3055Employer = Mh3055House | Mh3055MinorPower | "mercenary";

export const MH3055_EMPLOYER_NAMES: Record<Mh3055Employer, string> = {
    capellan: "Capellan Confederation",
    fwl: "Free Worlds League",
    combine: "Draconis Combine",
    fedcom: "Federated Commonwealth",
    canopus: "Magistracy of Canopus",
    outworlds: "Outworlds Alliance",
    rasalhague: "Free Rasalhague Republic",
    corporation: "Corporation",
    "st-ives": "St. Ives Compact",
    taurian: "Taurian Concordat",
    "minor-periphery": "Minor Periphery state",
    mercenary: "Mercenary unit",
};

/** Employer Table (p.102), 2D6. "minor-power" sends the roll to the Minor Power Table. */
export function mh3055EmployerRoll( roll: number ): Mh3055House | "minor-power" | "mercenary" {
    return rangeLookup<Mh3055House | "minor-power" | "mercenary">(
        [[3, "capellan"], [5, "fwl"], [6, "combine"], [9, "fedcom"], [11, "minor-power"], [12, "mercenary"]], roll );
}

/** Minor Power Table (p.102), 2D6. */
export function mh3055MinorPowerRoll( roll: number ): Mh3055MinorPower {
    return rangeLookup<Mh3055MinorPower>(
        [[3, "canopus"], [5, "outworlds"], [7, "rasalhague"], [8, "corporation"], [9, "st-ives"], [11, "taurian"], [12, "minor-periphery"]], roll );
}

/** Corporations (p.102), 2D6 from 2. */
export const MH3055_CORPORATIONS = [
    "Nashan Diversified", "Irian BattleMechs Unlimited", "Federated Boeing", "Aldis Industries", "TharHes Industries",
    "Ceres Metals", "Kali-Yama", "Independence", "EarthWerks Inc.", "Kallon Industries", "Alphard Trading Corp.",
];

/** Minor Periphery states (p.102), 1D6 from 1. */
export const MH3055_MINOR_PERIPHERY = [
    "Marion Hegemony (Alphard)", "Lothian League (Lothario)", "Illyrian Palatinate", "Circinus Federation (Circinus)",
    "Rim Collection", "Mica Majority",
];

/** Mercenary employers (p.102), 2D6 upper bounds. */
export const MH3055_MERCENARY_EMPLOYERS: RangeTable<string> = [
    [2, "Gray Death Legion"], [3, "21st Centauri Lancers"], [5, "Kell Hounds"], [6, "Northwind Highlanders"],
    [7, "Eridani Light Horse"], [9, "Wolf's Dragoons"], [11, "McCarron's Armored Cavalry"], [12, "Snord's Irregulars"],
];

export type Mh3055Mission =
    "garrison" | "cadre" | "recon" | "retainer" | "pirate-hunting" | "objective-raid" | "planetary-assault" |
    "diversionary" | "extraction" | "relief" | "defensive" | "riot" | "security" | "guerrilla";

export const MH3055_MISSION_NAMES: Record<Mh3055Mission, string> = {
    garrison: "Garrison Duty", cadre: "Cadre Duty", recon: "Recon Raid", retainer: "Retainer", "pirate-hunting": "Pirate Hunting",
    "objective-raid": "Objective Raid", "planetary-assault": "Planetary Assault", diversionary: "Diversionary Raid",
    extraction: "Extraction Raid", relief: "Relief Duty", defensive: "Defensive Campaign", riot: "Riot Duty",
    security: "Security Duty", guerrilla: "Guerrilla Warfare",
};

/** Mission pay multipliers and minimum lengths in months (pp.104-105); an objective raid's 2 is its maximum. */
export const MH3055_MISSIONS: Record<Mh3055Mission, { multiplier: number; minMonths: number }> = {
    garrison: { multiplier: 0.9, minMonths: 12 },
    cadre: { multiplier: 0.75, minMonths: 12 },
    recon: { multiplier: 1.4, minMonths: 1 },
    retainer: { multiplier: 1.3, minMonths: 24 },
    "pirate-hunting": { multiplier: 1, minMonths: 2 },
    "objective-raid": { multiplier: 1.6, minMonths: 2 },
    "planetary-assault": { multiplier: 1.5, minMonths: 4 },
    diversionary: { multiplier: 1.8, minMonths: 1 },
    extraction: { multiplier: 1.4, minMonths: 3 },
    relief: { multiplier: 1.3, minMonths: 2 },
    defensive: { multiplier: 1.5, minMonths: 3 },
    riot: { multiplier: 1, minMonths: 3 },
    security: { multiplier: 1.3, minMonths: 4 },
    guerrilla: { multiplier: 2.1, minMonths: 6 },
};

/** Fighting the Clans doubles the mission multiplier (p.105). */
const VS_CLANS = 2;

export type Mh3055Target = "clans" | "successor-state" | "periphery";

export interface IMh3055Job {
    /** One mission, or a choice of two ("garrison or cadre"); empty when the roll sends you to the Special table. */
    missions: Mh3055Mission[];
    target?: Mh3055Target;
    /** The unit supports another mercenary unit's assault. */
    supporting?: boolean;
    /** Roll again on the Special Job Table. */
    special?: boolean;
}

export type Mh3055JobTable = "house-fwl-cc" | "house-dc-fc" | "corporation" | "periphery" | "mercenary" | "special";

const job = ( missions: Mh3055Mission[], extra: Omit<IMh3055Job, "missions"> = {} ): IMh3055Job => ( { missions, ...extra } );
const SPECIAL: IMh3055Job = { missions: [], special: true };

/** Job Tables (pp.103-104), 2D6 upper bounds. */
const JOB_TABLES: Record<Mh3055JobTable, RangeTable<IMh3055Job>> = {
    "house-fwl-cc": [
        [3, job( ["garrison", "cadre"] )], [4, job( ["defensive"] )], [7, job( ["pirate-hunting"] )],
        [9, job( ["objective-raid"] )], [11, job( ["planetary-assault"] )], [12, SPECIAL],
    ],
    "house-dc-fc": [
        [3, job( ["garrison"] )], [5, job( ["objective-raid"], { target: "successor-state" } )], [6, job( ["cadre"] )],
        [8, job( ["objective-raid"], { target: "clans" } )], [9, job( ["planetary-assault"], { target: "clans" } )],
        [10, job( ["defensive"] )], [11, job( ["pirate-hunting"] )], [12, SPECIAL],
    ],
    corporation: [
        [4, job( ["security"] )], [7, job( ["objective-raid"], { target: "clans" } )], [10, job( ["extraction"], { target: "clans" } )],
        [11, job( ["objective-raid"], { target: "periphery" } )], [12, job( ["cadre"] )],
    ],
    // Printed 2-3 and 3-6: a 3 reads the first row.
    periphery: [
        [3, job( ["objective-raid"] )], [6, job( ["planetary-assault"] )], [9, job( ["garrison"] )], [11, job( ["riot"] )],
        [12, job( ["security"] )],
    ],
    mercenary: [
        [3, job( ["defensive"] )], [8, job( ["planetary-assault"], { supporting: true } )], [10, job( ["objective-raid"] )],
        [12, job( ["relief"] )],
    ],
    special: [
        [3, job( ["recon"] )], [4, job( ["security"] )], [5, job( ["diversionary"] )], [7, job( ["relief"] )],
        [9, job( ["extraction"] )], [11, job( ["riot"] )], [12, job( ["guerrilla"] )],
    ],
};

/** Ruling 5: no table prints Rasalhague's or St. Ives's jobs. */
const FIXED_JOBS: Partial<Record<Mh3055Employer, IMh3055Job>> = {
    rasalhague: job( ["objective-raid"], { target: "clans" } ),
    "st-ives": job( ["garrison", "cadre"] ),
};

/** The Job Table an employer rolls on, or null for the two with a fixed job (Ruling 5). */
export function mh3055JobTable( employer: Mh3055Employer ): Mh3055JobTable | null {
    switch( employer ) {
        case "capellan": case "fwl": return "house-fwl-cc";
        case "combine": case "fedcom": return "house-dc-fc";
        case "corporation": return "corporation";
        case "mercenary": return "mercenary";
        case "rasalhague": case "st-ives": return null;
        default: return "periphery";
    }
}

export function mh3055JobRoll( employer: Mh3055Employer | "special", roll: number ): IMh3055Job {
    const fixed = employer === "special" ? undefined : FIXED_JOBS[employer];
    const table = employer === "special" ? "special" : mh3055JobTable( employer );
    const found = fixed ?? rangeLookup( JOB_TABLES[table ?? "special"], roll );
    return { ...found, missions: [...found.missions] };
}

/** Employer pay multipliers (p.105); a corporation rolls 2D6 (printed "1-3" for its first row). */
export function mh3055EmployerMultiplier( employer: Mh3055Employer, corporationRoll?: number ): number {
    switch( employer ) {
        case "fedcom": return 1.3;
        case "rasalhague": return 1.1;
        case "combine": return 1.5;
        case "capellan": return 2;
        case "fwl": return 1.6;
        case "corporation": return rangeLookup( [[3, 1], [5, 1.4], [Infinity, 1.75]], corporationRoll ?? 2 );
        default: return 1;
    }
}

export interface IMh3055PayInputs {
    biweeklyPayroll: number;
    rating: Mh3055Rating;
    employerMultiplier: number;
    mission: Mh3055Mission;
    vsClans: boolean;
    months: number;
    /** Bonuses added to each month's payment. */
    bonuses: number;
}

/** Payment (pp.105-106): monthly salaries (2 paydays, Ruling 7) x rating x employer x mission (Clans x2), plus bonuses, x months. */
export function mh3055ContractPay( c: IMh3055PayInputs ): { monthly: number; total: number } {
    const monthly = c.biweeklyPayroll * 2 * MH3055_RATING_PAY[c.rating] * c.employerMultiplier
        * MH3055_MISSIONS[c.mission].multiplier * ( c.vsClans ? VS_CLANS : 1 ) + c.bonuses;
    return { monthly, total: monthly * c.months };
}

/** Support roll modifier (p.107): +1 B or C, +2 A, +3 Free Worlds League; they add. */
const supportModifier = ( rating: Mh3055Rating, employer: Mh3055Employer ): number =>
    ( rating === "A" ? 2 : rating === "B" || rating === "C" ? 1 : 0 ) + ( employer === "fwl" ? 3 : 0 );

/** Straight Support percentage (p.107). */
export function mh3055StraightSupport( roll: number, rating: Mh3055Rating, employer: Mh3055Employer ): number {
    return rangeLookup( [[3, 50], [5, 55], [7, 60], [9, 65], [10, 70], [11, 75], [12, 85], [13, 90], [Infinity, 100]],
        roll + supportModifier( rating, employer ) );
}

/** Battle Loss compensation percentage (p.107). */
export function mh3055BattleLoss( roll: number, rating: Mh3055Rating, employer: Mh3055Employer ): number {
    return rangeLookup( [[3, 5], [5, 10], [7, 15], [9, 20], [10, 25], [11, 30], [12, 35], [13, 40], [Infinity, 50]],
        roll + supportModifier( rating, employer ) );
}

const TRANSPORT = {
    ships: [12, 18, 23, 27, 30, 32],
    commercial: [30, 33, 35, 37, 39, 40],
};

/** Transport compensation percentage by 1D6 (p.107): the unit's own DropShips/JumpShips, or commercial passage. */
export function mh3055Transport( d6: number, kind: "ships" | "commercial" ): number {
    return TRANSPORT[kind][Math.min( 6, Math.max( 1, Math.round( d6 ) ) ) - 1];
}

export type Mh3055Salvage = "none" | "exchange" | "full";

/** Salvage Rights (p.108): 2D6 +5 Combine or Rasalhague, -3 against the Clans. */
export function mh3055Salvage( roll: number, employer: Mh3055Employer, vsClans: boolean ): Mh3055Salvage {
    const modified = roll + ( employer === "combine" || employer === "rasalhague" ? 5 : 0 ) - ( vsClans ? 3 : 0 );
    return rangeLookup<Mh3055Salvage>( [[7, "none"], [11, "exchange"], [Infinity, "full"]], modified );
}

export interface IMh3055Hearing {
    fine: number;
    banMonths: number;
    disbanded: boolean;
}

/** Contract Hearing (p.110): 2D6 plus the gamemaster's modifiers. 24+ disbands the unit (ban months 0). */
export function mh3055ContractHearing( roll: number ): IMh3055Hearing {
    return { ...rangeLookup<IMh3055Hearing>( [
        [5, { fine: 20000, banMonths: 1, disbanded: false }],
        [9, { fine: 25000, banMonths: 3, disbanded: false }],
        [12, { fine: 75000, banMonths: 6, disbanded: false }],
        [15, { fine: 125000, banMonths: 12, disbanded: false }],
        [18, { fine: 200000, banMonths: 18, disbanded: false }],
        [20, { fine: 500000, banMonths: 24, disbanded: false }],
        [22, { fine: 900000, banMonths: 36, disbanded: false }],
        [23, { fine: 1500000, banMonths: 60, disbanded: false }],
        [Infinity, { fine: 4000000, banMonths: 0, disbanded: true }],
    ], roll ) };
}

// ---------------------------------------------------------------- Edition state and hooks

const BOOK = "Mercenary's Handbook 3055";
const CURRENCY = "C-bills";
/** The Bonding Commission's handling fee on a draw before the mission, and the extra 2% to take it all up front (p.106). */
const HANDLING_FEE = 0.05;
const UP_FRONT_FEE = 0.07;
const MAX_ADVANCE_PCT = 25;

export interface IMh3055Contract {
    id: string;
    employer: Mh3055Employer;
    mission: Mh3055Mission;
    vsClans: boolean;
    months: number;
    startStep: number;
    total: number;
    /** What the unit has drawn so far, before fees. */
    drawn: number;
    completed: boolean;
}

export interface IMh3055State {
    sideId: string | null;
    roster: IMh3055Unit[];
    personnel: IMh3055Person[];
    rating: IMh3055RatingInputs;
    contract: IMh3055Contract | null;
}

const isObj = ( v: unknown ): v is Record<string, any> => typeof v === "object" && v !== null && !Array.isArray( v );
const MAX_LINES = 500;
const DEFAULT_RATING: IMh3055RatingInputs = { completed: 0, uncompleted: 0, losses: 0, breaches: 0, supportPct: 0,
    transportPct: 0, jumpShip: false, leadership: 0, experience: "regular", techPct: 0 };

const readRating = ( raw: unknown ): IMh3055RatingInputs => {
    const r = isObj( raw ) ? raw : {};
    const n = ( v: unknown, max: number ): number => clampInt( v, 0, max, 0 );
    return {
        completed: n( r.completed, 10000 ), uncompleted: n( r.uncompleted, 10000 ), losses: n( r.losses, 10000 ),
        breaches: n( r.breaches, 10000 ), supportPct: n( r.supportPct, 1000 ), transportPct: n( r.transportPct, 1000 ),
        jumpShip: r.jumpShip === true, leadership: n( r.leadership, 100 ),
        experience: isQuality( r.experience ) ? r.experience : DEFAULT_RATING.experience, techPct: n( r.techPct, 1000 ),
    };
}

/** The edition state from a saved campaign, malformed parts dropped or defaulted. */
export const mh3055ReadState = ( raw: unknown ): IMh3055State => {
    const s = isObj( raw ) ? raw : {};
    const roster: IMh3055Unit[] = [];
    for( const l of Array.isArray( s.roster ) ? s.roster : [] ) {
        if( roster.length >= MAX_LINES ) break;
        if( !isObj( l ) || typeof l.id !== "string" || !( l.template in MH3055_TEMPLATES ) || !isQuality( l.quality ) ) continue;
        roster.push( { id: l.id, template: l.template, quality: l.quality, count: clampInt( l.count, 0, 10000, 0 ) } );
    }
    const personnel: IMh3055Person[] = [];
    for( const l of Array.isArray( s.personnel ) ? s.personnel : [] ) {
        if( personnel.length >= MAX_LINES ) break;
        if( !isObj( l ) || typeof l.id !== "string" || !( l.position in MH3055_SALARIES ) || !isQuality( l.quality ) ) continue;
        personnel.push( { id: l.id, position: l.position, quality: l.quality, count: clampInt( l.count, 0, 100000, 0 ),
            antiMech: l.antiMech === true } );
    }
    let contract: IMh3055Contract | null = null;
    const c = s.contract;
    if( isObj( c ) && typeof c.id === "string" && c.employer in MH3055_EMPLOYER_NAMES && c.mission in MH3055_MISSIONS ) {
        contract = { id: c.id, employer: c.employer, mission: c.mission, vsClans: c.vsClans === true,
            months: clampInt( c.months, 1, 600, 1 ), startStep: clampInt( c.startStep, 0, 1e6, 0 ),
            total: Math.max( 0, Number( c.total ) || 0 ), drawn: Math.max( 0, Number( c.drawn ) || 0 ),
            completed: c.completed === true };
    }
    return { sideId: typeof s.sideId === "string" ? s.sideId : null, roster, personnel, rating: readRating( s.rating ), contract };
}

const post = ( c: Campaign, sideId: string, amount: number, reason: string, rule: string ): void => {
    const rounded = Math.round( amount );
    if( rounded === 0 ) return;
    c.addLedger( { sideId, step: c.step, amount: rounded, currency: CURRENCY, reason, rule } );
}

export interface IMh3055Signing {
    employer: Mh3055Employer;
    mission: Mh3055Mission;
    vsClans: boolean;
    months: number;
    /** From mh3055EmployerMultiplier (a corporation's depends on its roll). */
    employerMultiplier: number;
    /** Signing bonuses and perks added to each month's pay (p.106). */
    bonuses: number;
    /** Percent drawn before the mission, up to 25 (p.106). */
    advancePct: number;
    /** An A-rated unit takes the whole payment up front for 2% more (p.106); ignored for other ratings. */
    upFront: boolean;
}

/** A contract's length held to its mission (pp.104-105): an objective raid runs at most 2 months, the rest at least their minimum. */
export const mh3055ContractMonths = ( mission: Mh3055Mission, months: number ): number => {
    const asked = Math.max( 1, Math.round( Number.isFinite( months ) ? months : 1 ) );
    const limit = MH3055_MISSIONS[mission].minMonths;
    return mission === "objective-raid" ? Math.min( limit, asked ) : Math.max( limit, asked );
}

/** Records the contract and books what is drawn before the mission (Disbursing Payment, p.106). */
export const mh3055SignContract = ( c: Campaign, state: IMh3055State, signing: IMh3055Signing ): IMh3055Contract => {
    const sideId = unitSideId( c, state.sideId );
    const rating = mh3055DragoonsRating( state.rating ).rating;
    const months = mh3055ContractMonths( signing.mission, signing.months );
    const { total } = mh3055ContractPay( { biweeklyPayroll: mh3055Payroll( state.personnel ), rating,
        employerMultiplier: signing.employerMultiplier, mission: signing.mission, vsClans: signing.vsClans, months,
        bonuses: signing.bonuses } );
    const upFront = signing.upFront && rating === "A";
    const advancePct = upFront ? 100 : Math.min( MAX_ADVANCE_PCT, Math.max( 0, signing.advancePct ) );
    const advance = Math.round( total * advancePct / 100 );
    const contract: IMh3055Contract = { id: generateUUID(), employer: signing.employer, mission: signing.mission,
        vsClans: signing.vsClans, months, startStep: c.step, total, drawn: advance, completed: false };
    state.contract = contract;
    c.editionState = state;
    if( sideId && advance > 0 ) {
        const fee = upFront ? UP_FRONT_FEE : HANDLING_FEE;
        post( c, sideId, advance, upFront ? "Contract paid in full up front" : `Contract advance (${advancePct}%)`, `${BOOK} p.106` );
        post( c, sideId, -advance * fee, `Bonding Commission handling fee (${Math.round( fee * 100 )}%)`, `${BOOK} p.106` );
    }
    c.addLog( `Contract signed: ${MH3055_MISSION_NAMES[signing.mission]} for ${MH3055_EMPLOYER_NAMES[signing.employer]}` +
        `${signing.vsClans ? " against the Clans" : ""}, ${months} months, ${Math.round( total ).toLocaleString( "en-US" )} ${CURRENCY}` );
    return contract;
}

/** How a contract ends before its time (review M8). */
export type Mh3055ContractEnd = { kind: "lost" } | { kind: "uncompleted" } | { kind: "hearing"; guilty: boolean; roll: number };

/**
 * Ends the running contract early. The unit keeps what it has drawn and is paid nothing more (NGCFells's reading):
 * - lost: "a unit failing to complete a mission has lost", -10 rating points, and losing "suspends payment of the
 *   remainder" (pp.110-111);
 * - uncompleted: -25 rating points per uncompleted mission (p.100 step 7);
 * - a breach hearing terminates the contract (p.109); a guilty verdict rolls the Contract Hearing Table (2D6 plus the
 *   gamemaster's modifiers) for the fine and ban and costs 25 rating points (p.110).
 */
export const mh3055EndContract = ( c: Campaign, end: Mh3055ContractEnd ): void => {
    const state = mh3055ReadState( c.editionState );
    const contract = state.contract;
    if( !contract || contract.completed ) return;
    const mission = MH3055_MISSION_NAMES[contract.mission];
    state.contract = null;
    if( end.kind === "lost" ) {
        state.rating = { ...state.rating, losses: state.rating.losses + 1 };
        c.addLog( `Contract lost: ${mission}; the rest of the pay is suspended (Dragoons Rating -10)` );
    } else if( end.kind === "uncompleted" ) {
        state.rating = { ...state.rating, uncompleted: state.rating.uncompleted + 1 };
        c.addLog( `Contract not completed: ${mission} (Dragoons Rating -25)` );
    } else if( !end.guilty ) {
        c.addLog( "Breach of contract hearing: cleared; the Commission terminated the contract" );
    } else {
        const hearing = mh3055ContractHearing( end.roll );
        const sideId = unitSideId( c, state.sideId );
        if( sideId ) post( c, sideId, -hearing.fine, "Breach of contract fine", `${BOOK} p.110` );
        state.rating = { ...state.rating, breaches: state.rating.breaches + 1 };
        const fine = `${hearing.fine.toLocaleString( "en-US" )} C-bill fine`;
        const penalty = hearing.disbanded ? `${fine}; the unit is disbanded, each member under a 5-year hiring ban`
            : `${fine} and a ${hearing.banMonths}-month hiring ban`;
        c.addLog( `Breach of contract hearing (roll ${end.roll}): guilty, ${penalty} (Dragoons Rating -25)` );
    }
    c.editionState = state;
};

/**
 * A month (Ruling 7): two paydays, four weeks of maintenance against the support staff's Support Points, and while a
 * contract runs, four weeks of overhead (p.88) and the month's draw by contract length (p.106): over six months the
 * balance over the months left; two to six months the month's upkeep (paydays and overhead); the rest at the end.
 */
const onStep = ( c: Campaign ): void => {
    const state = mh3055ReadState( c.editionState );
    const sideId = unitSideId( c, state.sideId );
    if( !sideId ) {
        c.addLog( `${BOOK}: no side to book the month to` );
        return;
    }
    const payroll = mh3055Payroll( state.personnel );
    post( c, sideId, -payroll, "Payday 1 of 2", `${BOOK} p.89` );
    post( c, sideId, -payroll, "Payday 2 of 2", `${BOOK} p.89` );
    const needed = mh3055Maintenance( state.roster );
    const generated = mh3055SupportPoints( state.personnel );
    if( needed > generated ) {
        const f = ( n: number ): string => n.toLocaleString( "en-US" );
        c.addLog( `Maintenance short ${f( needed - generated )} SP a week for 4 weeks (${f( needed )} needed, ${f( generated )} generated)` );
    }
    const contract = state.contract;
    if( !contract || contract.completed || c.step <= contract.startStep ) return;
    const overhead = mh3055WeeklyOverhead( contract.total, contract.months ) * 4;
    post( c, sideId, -overhead, "Overhead (4 weeks)", `${BOOK} p.88` );
    const month = c.step - contract.startStep;
    const remaining = Math.max( 0, contract.total - contract.drawn );
    if( month >= contract.months ) {
        post( c, sideId, remaining, "Contract completed: balance paid", `${BOOK} p.106` );
        contract.drawn = contract.total;
        contract.completed = true;
        // 5 Dragoons Rating points per completed mission (p.100 step 1).
        state.rating = { ...state.rating, completed: state.rating.completed + 1 };
        c.addLog( `Contract completed: ${MH3055_MISSION_NAMES[contract.mission]}` );
    } else {
        const monthsLeft = contract.months - month + 1;
        const draw = Math.round( contract.months > 6 ? remaining / monthsLeft : Math.min( remaining, payroll * 2 + overhead ) );
        post( c, sideId, draw, contract.months > 6 ? `Monthly draw (${month} of ${contract.months})` : "Upkeep draw", `${BOOK} p.106` );
        contract.drawn += draw;
    }
    c.editionState = state;
}

const rating = ( c: Campaign ): { value: number; label: string } => {
    const r = mh3055DragoonsRating( mh3055ReadState( c.editionState ).rating );
    return { value: r.points, label: `Dragoons Rating ${r.rating}` };
}

export const MH3055_EDITION: ICampaignEdition = {
    id: MH3055_ID,
    name: "Mercenary's Handbook 3055",
    source: { title: "Mercenary's Handbook 3055", publication: "FASA 1670, 1993", pages: "pp.85-114" },
    kind: "unit",
    currency: CURRENCY,
    timeStep: "month",
    onStep,
    rating,
}
