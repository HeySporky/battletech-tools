import type { Campaign } from "../../classes/campaign/campaign";
import { ICampaignEdition } from "../../classes/campaign/campaign-types";
import {
    clampInt,
    ICampaignRoll,
    isQuality,
    Quality,
    QUALITIES,
    rangeLookup,
    RangeTable,
    unitSideId,
} from "../../classes/campaign/unit-campaign";
import { generateUUID } from "../../utils/generateUUID";

/*
 * Mercenary's Handbook (FASA 1616, 1987; FanPro 2005 reprint). Every figure read from the 1987 scan's page images;
 * the reprint prints the same tables, and its misprints follow the original ("Cacre Duty", p.45). Built: Cost of Living
 * (pp.36-40), Creating Contracts (pp.41-45) and the Basic Campaign System (pp.47-50). The Advanced Campaign System
 * (pp.51-53+), hirelings, profit sharing, mutiny and the supply pipeline are left to the gamemaster for now.
 */

export const MH1987_ID = "mh-1987";
const BOOK = "Mercenary's Handbook (1987)";
const CURRENCY = "C-bills";

type SalaryRow = "mechwarrior" | "pilot" | "infantry" | "armor" | "artillery" | "aircraft" | "scout" | "support" | "dropship" | "jumpship";

/** Mercenary Salaries (p.37), Green / Regular / Veteran / Elite. Infantry, armor and artillery are per 7-man squad; ships per crew. */
export const MH1987_SALARIES: Record<SalaryRow, [number, number, number, number]> = {
    mechwarrior: [400, 600, 1000, 2000],
    pilot: [400, 600, 1000, 2000],
    infantry: [1050, 1750, 3500, 7000],
    armor: [1000, 1750, 2500, 5000],
    artillery: [1050, 1750, 3500, 7000],
    aircraft: [250, 400, 900, 1500],
    scout: [150, 300, 600, 1200],
    support: [200, 400, 750, 1500],
    dropship: [3000, 5000, 7500, 12000],
    jumpship: [3500, 6000, 10000, 15000],
};

interface IMh1987Type {
    name: string;
    salary: SalaryRow;
    /** Maintenance Cost Table (p.38), support points a month, new / salvaged. */
    maintenance: [number, number];
    /** Reputation Table (p.36) points for the squad type. */
    reputation: number;
    /** Ships are crews, not squads: no supplies, reputation, morale or pay per squad. */
    ship?: boolean;
    /** An Elite pilot of this type generates 1 support point (p.38). */
    elitePilot?: boolean;
}

const t = ( name: string, salary: SalaryRow, n: number, s: number, reputation = 0, extra: Partial<IMh1987Type> = {} ): IMh1987Type =>
    ( { name, salary, maintenance: [n, s], reputation, ...extra } );
const ship = ( name: string, salary: SalaryRow, n: number, s: number ): IMh1987Type => t( name, salary, n, s, 0, { ship: true } );

export const MH1987_TYPES = {
    "light-mech": t( "Light 'Mech", "mechwarrior", 15, 30, 1, { elitePilot: true } ),
    "medium-mech": t( "Medium 'Mech", "mechwarrior", 25, 63, 2, { elitePilot: true } ),
    "heavy-mech": t( "Heavy 'Mech", "mechwarrior", 35, 123, 3, { elitePilot: true } ),
    "assault-mech": t( "Assault 'Mech", "mechwarrior", 45, 225, 4, { elitePilot: true } ),
    "light-lam": t( "Light LAM", "mechwarrior", 25, 50, 3, { elitePilot: true } ),
    "medium-lam": t( "Medium LAM", "mechwarrior", 35, 123, 3, { elitePilot: true } ),
    "aerospace": t( "AeroSpace Fighter", "pilot", 12, 40, 2, { elitePilot: true } ),
    "infantry": t( "Infantry", "infantry", 1, 1 ),
    "jump-infantry": t( "Jump Infantry", "infantry", 2, 2 ),
    "motorized-infantry": t( "Motorized Infantry", "infantry", 2, 2 ),
    // The table prints "Airmobile +4": read as infantry (1) plus 4.
    "airmobile-infantry": t( "Airmobile Infantry", "infantry", 5, 5 ),
    "light-armor": t( "Light Armor", "armor", 7, 7 ),
    "heavy-armor": t( "Heavy Armor", "armor", 13, 13 ),
    "artillery": t( "Artillery", "artillery", 1, 1 ),
    "aircraft": t( "Aircraft", "aircraft", 5, 5 ),
    "scout": t( "Scout", "scout", 1, 1 ),
    "support": t( "Support (Tech)", "support", 0, 0 ),
    "leopard": ship( "Leopard Class DropShip", "dropship", 60, 120 ),
    "union": ship( "Union Class DropShip", "dropship", 70, 140 ),
    "overlord": ship( "Overlord Class DropShip", "dropship", 80, 160 ),
    "fury": ship( "Fury Class DropShip", "dropship", 40, 80 ),
    "gazelle": ship( "Gazelle Class DropShip", "dropship", 50, 100 ),
    "seeker": ship( "Seeker Class DropShip", "dropship", 65, 130 ),
    "triumph": ship( "Triumph Class DropShip", "dropship", 80, 160 ),
    "condor": ship( "Condor Class DropShip", "dropship", 75, 150 ),
    "excalibur": ship( "Excalibur Class DropShip", "dropship", 100, 200 ),
    "scout-js": ship( "Scout Class JumpShip", "jumpship", 75, 150 ),
    "invader": ship( "Invader Class JumpShip", "jumpship", 85, 170 ),
    "monolith": ship( "Monolith Class JumpShip", "jumpship", 100, 200 ),
    "star-lord": ship( "Star Lord Class JumpShip", "jumpship", 90, 180 ),
    "merchant": ship( "Merchant Class JumpShip", "jumpship", 80, 160 ),
} satisfies Record<string, IMh1987Type>;

export type Mh1987SquadType = keyof typeof MH1987_TYPES;
export const MH1987_TYPE_IDS = Object.keys( MH1987_TYPES ) as Mh1987SquadType[];

export type Mh1987Condition = "new" | "salvaged" | "destroyed";

export interface IMh1987Line {
    id: string;
    type: Mh1987SquadType;
    quality: Quality;
    condition: Mh1987Condition;
    count: number;
    /** Reputation is counted company by company (p.36). */
    company: string;
}

/** A support squad's monthly support points by quality (p.38). */
const SUPPORT_POINTS = [5, 10, 20, 30];
/** One support point is 5,000 C-bills of labor, parts and equipment (p.38). */
export const MH1987_CBILLS_PER_SP = 5000;
/** One month's consumable supplies per squad (p.39). */
export const MH1987_SUPPLIES_PER_SQUAD = 500;

export type Mh1987Overhead = 5 | 10 | 15 | 20;
const OVERHEADS: Mh1987Overhead[] = [5, 10, 15, 20];

export interface IMh1987MonthlyCosts {
    salaries: number;
    squads: number;
    supplies: number;
    overhead: number;
    maintenanceSP: number;
    supportSP: number;
    maintenanceCost: number;
    total: number;
    /** Squads with working equipment: the ones an employer hires (a destroyed squad's people stay, p.50). */
    fieldSquads: number;
}

const qualityIndex = ( q: Quality ): number => QUALITIES.indexOf( q );

/** Salaries, supplies, overhead (on salaries + supplies, p.39) and maintenance beyond the support squads' points. */
export const mh1987MonthlyCosts = ( state: { roster: IMh1987Line[]; overheadPct: Mh1987Overhead } ): IMh1987MonthlyCosts => {
    let salaries = 0, squads = 0, fieldSquads = 0, maintenanceSP = 0, supportSP = 0;
    for( const line of state.roster ) {
        const type: IMh1987Type = MH1987_TYPES[line.type];
        const q = qualityIndex( line.quality );
        // A destroyed line's people stay on the books (a MechWarrior becomes Dispossessed, p.50): salary and supplies.
        salaries += line.count * MH1987_SALARIES[type.salary][q];
        if( !type.ship ) squads += line.count;
        // Its equipment is "useless" and needs no maintenance (p.38): no upkeep, no repair work, not hired.
        if( line.condition === "destroyed" ) continue;
        if( !type.ship ) fieldSquads += line.count;
        maintenanceSP += line.count * type.maintenance[line.condition === "new" ? 0 : 1];
        if( line.type === "support" ) supportSP += line.count * SUPPORT_POINTS[q];
        if( type.elitePilot && line.quality === "elite" ) supportSP += line.count;
    }
    const supplies = squads * MH1987_SUPPLIES_PER_SQUAD;
    const overhead = Math.round( ( state.overheadPct / 100 ) * ( salaries + supplies ) );
    const maintenanceCost = Math.max( 0, maintenanceSP - supportSP ) * MH1987_CBILLS_PER_SP;
    return { salaries, squads, supplies, overhead, maintenanceSP, supportSP, maintenanceCost,
        total: salaries + supplies + overhead + maintenanceCost, fieldSquads };
}

/** Reputation (p.36): each company's points (type + Veteran 1 / Elite 2) over 12, rounded up, summed. */
export const mh1987Reputation = ( roster: IMh1987Line[] ): number => {
    const byCompany = new Map<string, number>();
    for( const line of roster ) {
        const type: IMh1987Type = MH1987_TYPES[line.type];
        // The Reputation Table counts 'Mechs and fighters; a destroyed squad has none left (Ruling, NGCFells's reading).
        if( type.ship || line.condition === "destroyed" ) continue;
        const points = type.reputation + ( line.quality === "veteran" ? 1 : line.quality === "elite" ? 2 : 0 );
        byCompany.set( line.company, ( byCompany.get( line.company ) ?? 0 ) + points * line.count );
    }
    let total = 0;
    for( const points of byCompany.values() ) total += Math.ceil( points / 12 );
    return total;
}

/** Morale Level bands (p.36). */
const moraleLabel = ( level: number ): string => level >= 3.5 ? "Elite" : level > 2.75 ? "Veteran" : level > 1.75 ? "Regular" : "Green";

/** Squads' Morale Levels averaged (Green 1 ... Elite 4), then overhead (5% -2, 10% -1, 20% +1) and campaign changes. */
export const mh1987Morale = ( state: { roster: IMh1987Line[]; overheadPct: Mh1987Overhead; moraleMod: number } ): { level: number; label: string } => {
    let sum = 0, squads = 0;
    for( const line of state.roster ) {
        if( ( MH1987_TYPES[line.type] as IMh1987Type ).ship ) continue;
        sum += ( qualityIndex( line.quality ) + 1 ) * line.count;
        squads += line.count;
    }
    const base = squads ? sum / squads : 1;
    const overhead = { 5: -2, 10: -1, 15: 0, 20: 1 }[state.overheadPct];
    const level = Math.round( ( base + overhead + state.moraleMod ) * 100 ) / 100;
    return { level, label: moraleLabel( level ) };
}

// ---- Creating Contracts (pp.41-45) ----

/** Employer Position Table (p.41), by 2D6. */
export const MH1987_EMPLOYER_POSITION: Record<number, number> = { 2: 5, 3: 15, 4: 25, 5: 35, 6: 75, 7: 95, 8: 85, 9: 55, 10: 45, 11: 45, 12: 55 };

export type Mh1987Area = "length" | "remuneration" | "guarantee" | "command" | "transport" | "supply" | "salvage";
export const MH1987_AREAS: Mh1987Area[] = ["length", "remuneration", "guarantee", "command", "transport", "supply", "salvage"];
export const MH1987_AREA_LABELS: Record<Mh1987Area, string> = {
    length: "Length of Service", remuneration: "Remuneration", guarantee: "Guarantees", command: "Command Rights",
    transport: "Transport Fees", supply: "Supply Fees", salvage: "Salvage Rights",
};

export type Mh1987MissionCategory = "retainer" | "minor-raid" | "territorial" | "combat" | "invasion" | "major-raid" | "static-defense";
const MISSION_TABLE: RangeTable<Mh1987MissionCategory> = [
    [5, "retainer"], [15, "minor-raid"], [35, "territorial"], [55, "combat"], [70, "invasion"], [80, "major-raid"],
    [95, "static-defense"], [100, "retainer"],
];
export const mh1987MissionCategory = ( n: number ): Mh1987MissionCategory => rangeLookup( MISSION_TABLE, n );

export type Mh1987Mission = "cadre" | "garrison" | "security" | "riot" | "siege" | "relief" | "planetary-assault" | "offensive"
    | "defensive" | "recon-raid" | "objective-raid" | "diversionary-raid" | "guerrilla" | "retainer";

/** The missions in each category (p.42). */
export const MH1987_CATEGORY_MISSIONS: Record<Mh1987MissionCategory, Mh1987Mission[]> = {
    "retainer": ["retainer"],
    "minor-raid": ["recon-raid", "objective-raid"],
    "territorial": ["riot", "siege"],
    "combat": ["offensive", "defensive"],
    "invasion": ["planetary-assault", "relief"],
    "major-raid": ["diversionary-raid", "guerrilla"],
    "static-defense": ["garrison", "cadre", "security"],
};

export const MH1987_MISSION_LABELS: Record<Mh1987Mission, string> = {
    "cadre": "Cadre Duty", "garrison": "Garrison Duty", "security": "Security Duty", "riot": "Riot Duty",
    "siege": "Siege Campaign", "relief": "Relief Duty", "planetary-assault": "Planetary Assault",
    "offensive": "Offensive Campaign", "defensive": "Defensive Campaign", "recon-raid": "Recon Raid",
    "objective-raid": "Objective Raid", "diversionary-raid": "Diversionary Raid", "guerrilla": "Guerrilla Warfare",
    "retainer": "Retainer",
};

export type Mh1987Guarantee = "prior" | "advance-completion" | "minor-intermediary" | "comstar" | "completion";
export type Mh1987Command = "independent" | "mercenary" | "liaison" | "house" | "integrated";
export type Mh1987Salvage = "merc-claims" | "payment-in-kind" | "prize-court-grant" | "prize-court-kind" | "employer-compensation" | "employer-claims";

const SERVICE_LENGTH: RangeTable<number> = [[10, 12], [20, 11], [30, 10], [40, 9], [50, 8], [60, 7], [70, 6], [80, 5], [85, 4], [90, 3], [95, 2], [100, 1]];
const REMUNERATION: RangeTable<number> = [[10, 25000], [20, 20000], [30, 17500], [60, 12000], [80, 10000], [90, 5000], [100, 2500]];
const GUARANTEE: RangeTable<Mh1987Guarantee> = [[5, "prior"], [20, "advance-completion"], [40, "minor-intermediary"], [80, "comstar"], [100, "completion"]];
const COMMAND: RangeTable<Mh1987Command> = [[5, "independent"], [20, "mercenary"], [60, "liaison"], [80, "house"], [100, "integrated"]];
const TRANSPORT: RangeTable<number> = [[5, 3], [15, 2.5], [30, 2], [50, 1.5], [80, 1], [90, 0.5], [100, 0]];
const SUPPLY: RangeTable<number> = [[5, 1.5], [15, 1.25], [30, 1], [50, 0.75], [80, 0.5], [90, 0.25], [100, 0]];
const SALVAGE: RangeTable<Mh1987Salvage> = [[10, "merc-claims"], [30, "payment-in-kind"], [50, "prize-court-grant"], [70, "prize-court-kind"],
    [85, "employer-compensation"], [100, "employer-claims"]];

export const MH1987_GUARANTEE_LABELS: Record<Mh1987Guarantee, string> = {
    "prior": "Prior Payment", "advance-completion": "Advance/Completion", "minor-intermediary": "Minor Intermediary",
    "comstar": "ComStar Intermediary", "completion": "Payment on Completion",
};
export const MH1987_COMMAND_LABELS: Record<Mh1987Command, string> = {
    "independent": "Independent Command", "mercenary": "Mercenary Command", "liaison": "Liaison Officer",
    "house": "House Command", "integrated": "Integrated Command",
};
export const MH1987_SALVAGE_LABELS: Record<Mh1987Salvage, string> = {
    "merc-claims": "Merc Claims", "payment-in-kind": "Payment in Kind", "prize-court-grant": "Prize Court/Outright Grant",
    "prize-court-kind": "Prize Court/Payment in Kind", "employer-compensation": "Employer Compensation", "employer-claims": "Employer Claims",
};

/** Mission Modification Table (p.45): months added, command points taken off, pay multiplier. */
const MISSION_MODIFICATION: Record<Mh1987Mission, [number, number, number]> = {
    "cadre": [8, -20, 0.5], "garrison": [6, -20, 0.5], "security": [4, -20, 0.75], "riot": [3, 0, 0.75], "siege": [3, 0, 1],
    "relief": [-3, 0, 1.25], "planetary-assault": [-6, 0, 1.5], "offensive": [0, 0, 1], "defensive": [0, 0, 1],
    "recon-raid": [-6, -50, 1.5], "objective-raid": [-6, -50, 1.75], "diversionary-raid": [-3, -30, 2],
    "guerrilla": [6, -60, 1.75], "retainer": [12, 0, 1],
};

/** Pool = reputation + 10 x the negotiator's Diplomacy - 10 x the agent's (p.41); never below 0. */
export const mh1987NegotiationPool = ( reputation: number, negotiatorDiplomacy: number, agentDiplomacy: number ): number =>
    Math.max( 0, reputation + 10 * negotiatorDiplomacy - 10 * agentDiplomacy );

export interface IMh1987NegotiationStep { area: Mh1987Area; employer: number; player: number; gained: number; spent: number; final: number }

/**
 * Settles the areas in the players' order (p.41): a player number above the employer's adds the difference to the pool
 * and stands; otherwise points lower the employer's number down to the player's at most; the higher number stands.
 */
export const mh1987Negotiate = ( input: { employer: Partial<Record<Mh1987Area, number>>; player: Partial<Record<Mh1987Area, number>>;
    pool: number; order: Mh1987Area[] } ): { final: Partial<Record<Mh1987Area, number>>; poolLeft: number; steps: IMh1987NegotiationStep[] } => {
    let pool = input.pool;
    const final: Partial<Record<Mh1987Area, number>> = {};
    const steps: IMh1987NegotiationStep[] = [];
    for( const area of input.order ) {
        const employer = input.employer[area] ?? 0;
        const player = input.player[area] ?? 0;
        let gained = 0, spent = 0, settled: number;
        if( player >= employer ) {
            gained = player - employer;
            pool += gained;
            settled = player;
        } else {
            spent = Math.min( pool, employer - player );
            pool -= spent;
            settled = employer - spent;
        }
        final[area] = settled;
        steps.push( { area, employer, player, gained, spent, final: settled } );
    }
    return { final, poolLeft: pool, steps };
}

export interface IMh1987Terms {
    months: number;
    ratePerSquadWeek: number;
    guarantee: Mh1987Guarantee;
    command: Mh1987Command;
    transportModifier: number;
    supplyModifier: number;
    salvage: Mh1987Salvage;
}

/** Final negotiation numbers read on each table, then the Mission Modification (length never below 1 month). */
export const mh1987ContractTerms = ( final: Record<Mh1987Area, number>, mission: Mh1987Mission ): IMh1987Terms => {
    const [months, command, pay] = MISSION_MODIFICATION[mission];
    return {
        months: Math.max( 1, rangeLookup( SERVICE_LENGTH, final.length ) + months ),
        ratePerSquadWeek: rangeLookup( REMUNERATION, final.remuneration ) * pay,
        guarantee: rangeLookup( GUARANTEE, final.guarantee ),
        command: rangeLookup( COMMAND, Math.max( 0, final.command + command ) ),
        transportModifier: rangeLookup( TRANSPORT, final.transport ),
        supplyModifier: rangeLookup( SUPPLY, final.supply ),
        salvage: rangeLookup( SALVAGE, final.salvage ),
    };
}

/** Prize Court Table (p.44), 2D6 -> percent of value awarded to the mercs. */
export const MH1987_PRIZE_COURT: Record<number, number> = { 2: 5, 3: 10, 4: 15, 5: 20, 6: 25, 7: 30, 8: 40, 9: 50, 10: 60, 11: 70, 12: 80 };
/** Salvage Value Table (p.44), 2D6 -> [Merc Award, Employer Award]. */
export const MH1987_SALVAGE_VALUE: Record<number, [number, number]> = {
    2: [3, 1.5], 3: [2.75, 1.25], 4: [2.5, 1], 5: [2.25, 1], 6: [2, 0.9], 7: [1.75, 0.8], 8: [1.5, 0.7], 9: [1.25, 0.6],
    10: [1, 0.5], 11: [1, 0.5], 12: [0.75, 0.4],
};

// ---- Basic Campaign System (pp.47-50) ----

export type Mh1987Force = "N" | "L" | "M" | "H" | "A";
export type Mh1987OutcomeCode = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q";

/** Enemy Resistance Table (p.47), 2D6 2..12. */
const RESISTANCE: Record<Exclude<Mh1987Mission, "retainer">, string> = {
    "cadre": "AHMLLNLLMHA", "garrison": "AHMLNNNLMHA", "security": "AHMNLLLNMHA", "offensive": "HAMMALHMMAH",
    "defensive": "AAHHMLMHHAA", "planetary-assault": "HHLMMAMMLHH", "relief": "AHLMMHMMLHA", "riot": "HHLLNMNLLHH",
    "recon-raid": "AALMLHLMLAA", "objective-raid": "AAHMLHLMHAA", "diversionary-raid": "AALMHAHMLAA",
    "siege": "HHLMMLMMLHH", "guerrilla": "HLNMLNLMNLH",
};

/** Each mission's outcome table (pp.48-49): enemy force -> outcome codes for 2D6 2..12. */
const OUTCOMES: Record<Exclude<Mh1987Mission, "retainer">, Partial<Record<Mh1987Force, string>>> = {
    "cadre": { N: "NMMLJIHEEED", L: "NMMMKIEEEED", M: "OMMMKIEEEEC", H: "NNMMKIEEEDD", A: "ONMMKIEEEDC" },
    "garrison": { N: "MMMMMIEEEEE", L: "NMMMJIHEEED", M: "OMMKJIHGEEC", H: "ONMLKIGFEDC", A: "PNLKJIHGFDB" },
    "security": { N: "MMMMKIGEEEE", L: "MMMLJIHFEEE", M: "NMMKJIHGEED", H: "OMMLKIGFEEC", A: "PNMMLIFEEDB" },
    "offensive": { L: "PNMMKIGEEDB", M: "QONMLIFEDCA", H: "QPONMIEDCBA", A: "QQPOMIECBAA" },
    "defensive": { L: "ONMMKIFEEDC", M: "PONMLIEEDCB", H: "PONMMIEEDCB", A: "QPONMHEDCBA" },
    "planetary-assault": { L: "QQPONIDCBAA", M: "QPONMIEDCBA", H: "QPPNMIEDBBA", A: "QQPNMIEDBAA" },
    "recon-raid": { L: "NLJIEEEDCBA", M: "ONMMKIGEDCA", H: "QONMLKIGEDB", A: "QPONNMLIGEC" },
    "objective-raid": { L: "NMLKIFDCBAA", M: "NMMLKHEDCBA", H: "ONMLKIGEDCB", A: "PONMLKIGEDC" },
    "diversionary-raid": { L: "NMLKJHFEDCB", M: "NMMLKJGEDCB", H: "QPNMLKJHEDC", A: "QPONMLKJFED" },
    "relief": { L: "ONMKIGEDCBA", M: "PONMJIHEDCB", H: "PNMMJIHEEDB", A: "QPONMKIGEED" },
    "riot": { N: "MLJIHGEEEED", L: "NMMLJHGEEED", M: "ONMMLKHFEED", H: "PONMMLKHFED" },
    "siege": { L: "MKJIGFEDCBA", M: "ONMLKIGFDCB", H: "PONMLKIHFEC" },
    "guerrilla": { N: "ONMJHEEEDCB", L: "PONMJHEEDCB", M: "QPONMJHEDCB", H: "QQPONMJHEDB" },
};

export interface IMh1987Outcome { result: "win" | "uncompleted" | "loss"; reputation: number; danger: number; salvaged: number; destroyed: number; plunder: number }

const o = ( result: IMh1987Outcome["result"], reputation: number, danger: number, salvaged: number, destroyed: number, plunder: number ): IMh1987Outcome =>
    ( { result, reputation, danger, salvaged, destroyed, plunder } );

/** Outcome Description Table (p.49). */
export const MH1987_OUTCOMES: Record<Mh1987OutcomeCode, IMh1987Outcome> = {
    A: o( "win", 6, 5, 6, 5, 10 ), B: o( "win", 5, 5, 6, 5, 10 ), C: o( "win", 4, 5, 6, 5, 9 ), D: o( "win", 3, 6, 7, 6, 9 ),
    E: o( "win", 2, 6, 7, 6, 8 ), F: o( "uncompleted", 1, 6, 7, 6, 7 ), G: o( "uncompleted", 0, 7, 8, 7, 7 ),
    H: o( "uncompleted", 0, 7, 8, 7, 6 ), I: o( "uncompleted", 0, 7, 8, 7, 6 ), J: o( "uncompleted", 0, 7, 8, 7, 5 ),
    K: o( "uncompleted", 0, 7, 8, 7, 5 ), L: o( "uncompleted", -1, 8, 9, 8, 5 ), M: o( "loss", -2, 8, 9, 8, 4 ),
    N: o( "loss", -3, 8, 9, 8, 4 ), O: o( "loss", -4, 9, 10, 9, 4 ), P: o( "loss", -5, 9, 10, 9, 4 ), Q: o( "loss", -6, 9, 10, 9, 4 ),
};

export type Mh1987CampaignMission = Exclude<Mh1987Mission, "retainer">;

const slot = ( roll: number ): number => Math.min( 10, Math.max( 0, roll - 2 ) );

export const mh1987EnemyResistance = ( mission: Mh1987CampaignMission, roll: number ): Mh1987Force =>
    RESISTANCE[mission][slot( roll )] as Mh1987Force;

/** The outcome code; a force the mission's table has no row for reads the nearest row the table prints. */
export const mh1987Outcome = ( mission: Mh1987CampaignMission, force: Mh1987Force, roll: number ): Mh1987OutcomeCode => {
    const table = OUTCOMES[mission];
    const order: Mh1987Force[] = ["N", "L", "M", "H", "A"];
    let row = table[force];
    for( let i = order.indexOf( force ); !row && i >= 0; i-- ) row = table[order[i]];
    for( let i = order.indexOf( force ); !row && i < order.length; i++ ) row = table[order[i]];
    return row![slot( roll )] as Mh1987OutcomeCode;
}

export interface IMh1987CompanyResult { company: string; salvagedSquads: number; destroyedSquads: number; plunder: number }

export interface IMh1987Month {
    resistanceRoll: number;
    resistance: Mh1987Force;
    outcomeRoll: number;
    code: Mh1987OutcomeCode;
    outcome: IMh1987Outcome;
    reputationChange: number;
    moraleChange: number;
    companies: IMh1987CompanyResult[];
    plunder: number;
}

/**
 * One month of the Basic Campaign System at company level: resistance, outcome, then each company rolls Salvaged and
 * Destroyed (2D6 + morale, under the number loses 1D6 squads; Unit Size Modifier 1) and Plunder (2D6 - morale, at or
 * under the number takes 2D6 x 10,000). Reputation changes by the outcome's number for each company (p.50).
 */
export const mh1987ResolveMonth = ( mission: Mh1987CampaignMission, morale: number, companies: string[], roll: ICampaignRoll ): IMh1987Month => {
    const resistanceRoll = roll.twoD6();
    const resistance = mh1987EnemyResistance( mission, resistanceRoll );
    const outcomeRoll = roll.twoD6();
    const code = mh1987Outcome( mission, resistance, outcomeRoll );
    const outcome = MH1987_OUTCOMES[code];
    const results = companies.map( ( company ): IMh1987CompanyResult => {
        const salvagedSquads = roll.twoD6() + morale < outcome.salvaged ? roll.d6() : 0;
        const destroyedSquads = roll.twoD6() + morale < outcome.destroyed ? roll.d6() : 0;
        const plunder = roll.twoD6() - morale <= outcome.plunder ? roll.twoD6() * 10000 : 0;
        return { company, salvagedSquads, destroyedSquads, plunder };
    } );
    return {
        resistanceRoll, resistance, outcomeRoll, code, outcome,
        reputationChange: outcome.reputation * companies.length,
        moraleChange: outcome.result === "win" ? 1 : outcome.result === "loss" ? -1 : 0,
        companies: results,
        plunder: results.reduce( ( sum, r ) => sum + r.plunder, 0 ),
    };
}

// ---- Edition state and hooks ----

export interface IMh1987Contract {
    id: string;
    mission: Mh1987Mission;
    terms: IMh1987Terms;
    squads: number;
    startStep: number;
    total: number;
    paid: number;
    completed: boolean;
    /** The month last resolved with the Basic Campaign System; a month resolves once. */
    resolvedStep?: number;
}

export interface IMh1987State {
    sideId: string | null;
    roster: IMh1987Line[];
    overheadPct: Mh1987Overhead;
    moraleMod: number;
    reputationMod: number;
    contract: IMh1987Contract | null;
}

const isObj = ( v: unknown ): v is Record<string, any> => typeof v === "object" && v !== null && !Array.isArray( v );
const MAX_LINES = 500;

const readTerms = ( t: unknown ): IMh1987Terms | null => {
    if( !isObj( t ) || !( t.guarantee in MH1987_GUARANTEE_LABELS ) || !( t.command in MH1987_COMMAND_LABELS ) || !( t.salvage in MH1987_SALVAGE_LABELS ) ) return null;
    return { months: clampInt( t.months, 1, 600, 1 ), ratePerSquadWeek: Math.max( 0, Number( t.ratePerSquadWeek ) || 0 ),
        guarantee: t.guarantee, command: t.command, transportModifier: Math.max( 0, Number( t.transportModifier ) || 0 ),
        supplyModifier: Math.max( 0, Number( t.supplyModifier ) || 0 ), salvage: t.salvage };
}

/** The edition state from a saved campaign, malformed parts dropped or defaulted. */
export const mh1987ReadState = ( raw: unknown ): IMh1987State => {
    const s = isObj( raw ) ? raw : {};
    const roster: IMh1987Line[] = [];
    for( const l of Array.isArray( s.roster ) ? s.roster : [] ) {
        if( roster.length >= MAX_LINES ) break;
        if( !isObj( l ) || typeof l.id !== "string" || !( l.type in MH1987_TYPES ) || !isQuality( l.quality ) ) continue;
        roster.push( { id: l.id, type: l.type, quality: l.quality,
            condition: l.condition === "salvaged" || l.condition === "destroyed" ? l.condition : "new",
            count: clampInt( l.count, 0, 10000, 0 ), company: typeof l.company === "string" && l.company ? l.company : "Company 1" } );
    }
    let contract: IMh1987Contract | null = null;
    const c = s.contract;
    const terms = isObj( c ) ? readTerms( c.terms ) : null;
    if( isObj( c ) && terms && typeof c.id === "string" && c.mission in MISSION_MODIFICATION ) {
        contract = { id: c.id, mission: c.mission, terms, squads: clampInt( c.squads, 0, 100000, 0 ),
            startStep: clampInt( c.startStep, 0, 1e6, 0 ), total: Math.max( 0, Number( c.total ) || 0 ),
            paid: Math.max( 0, Number( c.paid ) || 0 ), completed: c.completed === true };
        if( Number.isInteger( c.resolvedStep ) ) contract.resolvedStep = c.resolvedStep;
    }
    return {
        sideId: typeof s.sideId === "string" ? s.sideId : null,
        roster,
        overheadPct: OVERHEADS.includes( s.overheadPct ) ? s.overheadPct : 15,
        moraleMod: clampInt( s.moraleMod, -100, 100, 0 ),
        reputationMod: clampInt( s.reputationMod, -10000, 10000, 0 ),
        contract,
    };
}

const post = ( c: Campaign, sideId: string, amount: number, reason: string, rule: string ): void => {
    const rounded = Math.round( amount );
    if( rounded === 0 ) return;
    c.addLedger( { sideId, step: c.step, amount: rounded, currency: CURRENCY, reason, rule } );
}

export interface IMh1987Signing {
    mission: Mh1987Mission;
    terms: IMh1987Terms;
    /** Advance/Completion and ComStar: the percent drawn now (ComStar allows up to 25). */
    advancePct: number;
    /** What hiring transport would cost; the employer pays it times the Transport Reimbursement modifier. */
    transportFee: number;
    roll: ICampaignRoll;
}

/** Records the contract on the edition state and books what is paid on signing (Guarantee Table, p.42-43). */
export const mh1987SignContract = ( c: Campaign, state: IMh1987State, signing: IMh1987Signing ): IMh1987Contract => {
    const sideId = unitSideId( c, state.sideId );
    const squads = mh1987MonthlyCosts( state ).fieldSquads;
    const total = signing.terms.ratePerSquadWeek * 4 * squads * signing.terms.months;
    let advancePct = 0;
    switch( signing.terms.guarantee ) {
        case "prior": advancePct = 100; break;
        case "advance-completion": advancePct = Math.min( 100, Math.max( 0, signing.advancePct ) ); break;
        case "minor-intermediary": advancePct = Math.max( 0, signing.roll.twoD6() - 2 ); break;
        case "comstar": advancePct = Math.min( 25, Math.max( 0, signing.advancePct ) ); break;
        case "completion": advancePct = 0; break;
    }
    const advance = Math.round( total * advancePct / 100 );
    const contract: IMh1987Contract = { id: generateUUID(), mission: signing.mission, terms: signing.terms, squads,
        startStep: c.step, total, paid: advance, completed: false };
    state.contract = contract;
    c.editionState = state;
    if( sideId ) {
        post( c, sideId, advance, advancePct === 100 ? "Contract paid in full on signing" : `Contract advance (${advancePct}%)`, `${BOOK} pp.42-43` );
        post( c, sideId, -signing.transportFee, "Transport hired", `${BOOK} p.43` );
        post( c, sideId, signing.transportFee * signing.terms.transportModifier, `Transport reimbursement (x${signing.terms.transportModifier})`, `${BOOK} p.43` );
    }
    c.addLog( `Contract signed: ${MH1987_MISSION_LABELS[signing.mission]}, ${signing.terms.months} months, ${squads} squads, ${MH1987_GUARANTEE_LABELS[signing.terms.guarantee]}` );
    return contract;
}

/**
 * Ends the running contract early (review M8). What was paid is kept and the rest is not paid. Under the ComStar
 * Intermediary guarantee the unit's leader "pledges to repay the advance if ComStar judges that the unit failed to
 * fulfill contract conditions" (p.43); the smaller intermediaries "lack ComStar's ability to coerce anyone to pay back
 * stolen advances" and a private deal "depends upon the employer's integrity" (pp.18, 43), so only ComStar takes it
 * back (NGCFells's reading). Reputation is left to the gamemaster (ComStar "broadcasts its findings", p.18).
 */
export const mh1987EndContract = ( c: Campaign, end: { judgedFailed: boolean } ): void => {
    const state = mh1987ReadState( c.editionState );
    const contract = state.contract;
    if( !contract || contract.completed ) return;
    state.contract = null;
    c.editionState = state;
    const mission = MH1987_MISSION_LABELS[contract.mission];
    const sideId = unitSideId( c, state.sideId );
    if( end.judgedFailed && contract.terms.guarantee === "comstar" ) {
        if( sideId ) post( c, sideId, -contract.paid, "Advance repaid: ComStar judged the contract unfulfilled", `${BOOK} p.43` );
        c.addLog( `Contract ended early: ${mission}; ComStar judged it unfulfilled and the advance is repaid` );
    } else {
        c.addLog( `Contract ended early: ${mission}; what was paid is kept, the rest is not paid` );
    }
};

/** The month's costs; while a contract runs, its supply fee; when it ends, the balance by its guarantee. */
const onStep = ( c: Campaign ): void => {
    const state = mh1987ReadState( c.editionState );
    const sideId = unitSideId( c, state.sideId );
    if( !sideId ) {
        c.addLog( `${BOOK}: no side to book the month to` );
        return;
    }
    const costs = mh1987MonthlyCosts( state );
    post( c, sideId, -costs.salaries, "Salaries", `${BOOK} p.37` );
    post( c, sideId, -costs.supplies, "Supplies", `${BOOK} p.39` );
    post( c, sideId, -costs.overhead, `Overhead (${state.overheadPct}%)`, `${BOOK} p.39` );
    post( c, sideId, -costs.maintenanceCost, `Maintenance not covered by support (${Math.max( 0, costs.maintenanceSP - costs.supportSP )} SP)`, `${BOOK} p.38` );
    const contract = state.contract;
    if( contract && !contract.completed && c.step > contract.startStep ) {
        post( c, sideId, contract.terms.supplyModifier * MH1987_SUPPLIES_PER_SQUAD * contract.squads, "Supply fee", `${BOOK} p.44` );
        if( c.step >= contract.startStep + contract.terms.months ) {
            const balance = contract.total - contract.paid;
            if( contract.terms.guarantee === "comstar" ) {
                post( c, sideId, balance - contract.total * 0.05, "Contract completed: balance less ComStar's 5% fee", `${BOOK} p.43` );
            } else {
                post( c, sideId, balance, "Contract completed: balance paid", `${BOOK} pp.42-43` );
            }
            contract.paid = contract.total;
            contract.completed = true;
            c.addLog( `Contract completed: ${MH1987_MISSION_LABELS[contract.mission]}` );
            c.editionState = state;
        }
    }
}

export const MH1987_EDITION: ICampaignEdition = {
    id: MH1987_ID,
    name: "Mercenary's Handbook (1987)",
    source: { title: "Mercenary's Handbook", publication: "FASA 1616, 1987 (FanPro 2005 reprint)", pages: "pp.36-50" },
    kind: "unit",
    currency: CURRENCY,
    timeStep: "month",
    onStep,
}
