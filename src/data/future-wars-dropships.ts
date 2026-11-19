/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 * Any original, fan-made content or custom homebrew data processed by this tool
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 */

/**
 * The four Future Wars DropShip construction methods (#172, plan 2026-11-19-future-wars-dropships.md), each a Special
 * Ruleset that replaces the TechManual's DropShip construction. Every table and rule is read from the page images (the
 * library's extracts were corrected from them, 2026-11-19):
 *
 * - Mark Stock, "Dropship Construction", Future Wars #16 (1990) p.32; reprinted unchanged in rules in The Best of
 *   Future Wars, Volume One (1991) p.7.
 * - Erik Eid, "Deluxe Dropship Construction", Future Wars #25 (1991) pp.6-7 (based on Stock's).
 * - Mike Reese, "More Drop Ship Construction" and "BattleTech Drop Ship Construction", Future Wars #36 (1993) pp.14-18,
 *   sample sheets pp.19-21.
 * - Doug Houseman, "Designing a Dropship" (written 1991), Future Wars #36 (1993) pp.22-23.
 *
 * Future Wars #36 prints no year: it reviews BattleSpace (FASA, 1993) and carries art signed September 1992.
 *
 * Stock's article says to "look in DS/JS" for four values. NGCFells (2026-11-19): "Lets do the work for them. Set up
 * formulae based on weight, type, etc." The formulae below are fitted to every DropShip in DropShips and JumpShips
 * (FASA 1619, 1988), whose table is kept here with its pages; they are NGCFells's extrapolation, Inspired by Stock.
 */

export type FwDropShipMethod = "stock" | "eid" | "reese" | "houseman";
export type FwDropShipShape = "aerodyne" | "spheroid";

export const FW_DROPSHIP_RULESET_IDS: Record<FwDropShipMethod, string> = {
    stock: "fw-dropships-stock",
    eid: "fw-dropships-eid",
    reese: "fw-dropships-reese",
    houseman: "fw-dropships-houseman",
};

export const FW_DROPSHIP_SOURCES: Record<FwDropShipMethod, string> = {
    stock: "Mark Stock, 'Dropship Construction', Future Wars #16 (1990), p.32; reprinted in The Best of Future Wars, Volume One (1991), p.7",
    eid: "Erik Eid, 'Deluxe Dropship Construction', Future Wars #25 (1991), pp.6-7",
    reese: "Mike Reese, 'More Drop Ship Construction' and 'BattleTech Drop Ship Construction', Future Wars #36 (1993), pp.14-21",
    houseman: "Doug Houseman, 'Designing a Dropship' (written 1991), Future Wars #36 (1993), pp.22-23",
};

/** The method a set of ticked rulesets selects, or undefined for the TechManual's rules. */
export function getFwDropShipMethod(rulesets: readonly string[]): FwDropShipMethod | undefined {
    return (Object.keys(FW_DROPSHIP_RULESET_IDS) as FwDropShipMethod[]).find((method) => rulesets.includes(FW_DROPSHIP_RULESET_IDS[method]));
}

// Tables -------------------------------------------------------------------------------------------------------------

/** A step table: the first band whose `max` (inclusive) is at or above the value. */
export interface IFwBand { max: number; value: number }

export function lookupFwBand(bands: readonly IFwBand[], x: number): number {
    return (bands.find((band) => x <= band.max) ?? bands[bands.length - 1]).value;
}

/** Eid's Chart A, Thrust Points per Ton, by DropShip tonnage (FW #25 p.7). It stops at 100,000 tons. */
export const EID_CHART_A: IFwBand[] = [
    { max: 1900, value: 10 }, { max: 2900, value: 8 }, { max: 20000, value: 6 }, { max: 50000, value: 4 }, { max: 100000, value: 2 },
];
/** Eid's Chart B, Division Factor, by engine tonnage (FW #25 p.7); Reese prints the same chart (FW #36 p.18). */
export const EID_CHART_B: IFwBand[] = [
    { max: 700, value: 10 }, { max: 850, value: 11 }, { max: 1000, value: 12 }, { max: 1250, value: 13 }, { max: 1450, value: 14 },
    { max: 1700, value: 15 }, { max: 2000, value: 16 }, { max: 2350, value: 18 }, { max: 2750, value: 21 }, { max: 3200, value: 24 },
    { max: 3700, value: 29 }, { max: 4300, value: 34 }, { max: 5000, value: 40 }, { max: 5800, value: 47 }, { max: 6700, value: 55 },
    { max: 7700, value: 64 }, { max: 8800, value: 74 }, { max: 10000, value: 85 }, { max: 11300, value: 97 }, { max: Infinity, value: 110 },
];
/** Eid's Chart C, Aerodyne Armor Points per Ton (FW #25 p.7). */
export const EID_CHART_C: IFwBand[] = [
    { max: 6000, value: 16 }, { max: 9500, value: 14 }, { max: 22500, value: 12 }, { max: 40000, value: 10 }, { max: 70000, value: 8 },
    { max: Infinity, value: 6 },
];
/** Eid's Chart D, Spheroid Armor Points per Ton (FW #25 p.7). */
export const EID_CHART_D: IFwBand[] = [
    { max: 12500, value: 16 }, { max: 20000, value: 14 }, { max: 35000, value: 12 }, { max: 50000, value: 10 }, { max: 65000, value: 8 },
    { max: Infinity, value: 6 },
];
/** Reese's Chart A (FW #36 p.18): Eid's, from 101 tons, with 100 points a ton to 500 tons and 1 above 100,000. */
export const REESE_CHART_A: IFwBand[] = [
    { max: 500, value: 100 }, { max: 1900, value: 10 }, { max: 2900, value: 8 }, { max: 20000, value: 6 }, { max: 50000, value: 4 },
    { max: 100000, value: 2 }, { max: Infinity, value: 1 },
];
/** Reese's Chart C (FW #36 p.18): Eid's to 70,000 tons, then 6, 4, 2 and 1. */
export const REESE_CHART_C: IFwBand[] = [
    { max: 6000, value: 16 }, { max: 9500, value: 14 }, { max: 22500, value: 12 }, { max: 40000, value: 10 }, { max: 70000, value: 8 },
    { max: 80000, value: 6 }, { max: 90000, value: 4 }, { max: 100000, value: 2 }, { max: Infinity, value: 1 },
];
/** Reese's Chart D (FW #36 p.18): Eid's to 65,000 tons, then 6, 4, 2 and 1. */
export const REESE_CHART_D: IFwBand[] = [
    { max: 12500, value: 16 }, { max: 20000, value: 14 }, { max: 35000, value: 12 }, { max: 50000, value: 10 }, { max: 65000, value: 8 },
    { max: 100000, value: 6 }, { max: 200000, value: 4 }, { max: 300000, value: 2 }, { max: Infinity, value: 1 },
];
/** Houseman's armor values, points a ton by size (FW #36 p.22). */
export const HOUSEMAN_ARMOR: IFwBand[] = [
    { max: 1000, value: 16 }, { max: 5000, value: 12 }, { max: 20000, value: 8 }, { max: 100000, value: 4 }, { max: Infinity, value: 2 },
];

/**
 * Houseman's integrity table (FW #36 p.22) prints rows 1-8; every row is n x (3% of mass, 10 internal structure, 20
 * maximum armor, 1 g). NGCFells (2026-11-19): "Extended it, label as mine, go out as large as needed to cover all
 * dropships of whatever size." Rows past 8 are NGCFells's extension, Inspired by Houseman.
 */
export interface IHousemanIntegrityRow { integrity: number; percentOfMass: number; internalStructure: number; maxArmor: number; acceleration: number; extended: boolean }
export const HOUSEMAN_PRINTED_INTEGRITY_ROWS = 8;
export function getHousemanIntegrity(integrity: number): IHousemanIntegrityRow {
    return {
        integrity,
        percentOfMass: 3 * integrity,
        internalStructure: 10 * integrity,
        maxArmor: 20 * integrity,
        acceleration: integrity,
        extended: integrity > HOUSEMAN_PRINTED_INTEGRITY_ROWS,
    };
}

/** Houseman's docking system (FW #36 p.23): by size, then 100 tons for each further 5,000 tons. */
export function getHousemanDockingTons(tonnage: number): number {
    if (tonnage <= 100) return 0;
    if (tonnage <= 400) return 25;
    if (tonnage <= 1000) return 50;
    if (tonnage <= 5000) return 100;
    if (tonnage <= 10000) return 200;
    if (tonnage <= 15000) return 300;
    return 300 + 100 * Math.ceil((tonnage - 15000) / 5000);
}

/** Houseman's living quarters, tons for each (FW #36 p.23). */
export const HOUSEMAN_QUARTERS = {
    permanentCrew: 5, smallCraftPilot: 5, crewLounge: 10,
    firstClass: 5, secondClass: 3, steerage: 1, royalty: 25, passengerLounge: 1, observationArea: 5,
    commandOfficer: 5, mechOrAeroPilot: 2, tech: 1, infantry: 0.5, jumpInfantry: 1, elemental: 2, gym: 10, warRoom: 20,
    infantrySimulator: 10, mechSimulatorPerLance: 5, elementalSimulatorPerStar: 5,
} as const;
export type HousemanQuartersTag = keyof typeof HOUSEMAN_QUARTERS;

// DropShips and JumpShips --------------------------------------------------------------------------------------------

/** One DropShip of DropShips and JumpShips (FASA 1619, 1988), read from the page images. */
export interface IDsJsDropShip {
    name: string;
    /** Printed page of its data block. */
    page: number;
    shape: FwDropShipShape;
    tonnage: number;
    thrust: number;
    structuralIntegrity: number;
    engine: number;
    /** Thrust points a ton of fuel; null where the page prints none (the Intruder). */
    thrustPointsPerTon: number | null;
    fuelTons: number | null;
    burnDay: number;
    crew: number;
    bridge: number;
    armorPointsPerTon: number;
}

/** Every DropShip in DS&JS, smallest first; the Leopard CV repeats the Leopard's figures and is left out. */
export const DSJS_DROPSHIPS: IDsJsDropShip[] = [
    { name: "Avenger", page: 45, shape: "aerodyne", tonnage: 1400, thrust: 7, structuralIntegrity: 12, engine: 580, thrustPointsPerTon: 10, fuelTons: 160, burnDay: 1.84, crew: 15, bridge: 12, armorPointsPerTon: 16 },
    { name: "Leopard", page: 39, shape: "aerodyne", tonnage: 1720, thrust: 4, structuralIntegrity: 7, engine: 360, thrustPointsPerTon: 10, fuelTons: 123, burnDay: 1.84, crew: 9, bridge: 13, armorPointsPerTon: 16 },
    { name: "Fury", page: 27, shape: "aerodyne", tonnage: 1850, thrust: 4, structuralIntegrity: 7, engine: 400, thrustPointsPerTon: 10, fuelTons: 140, burnDay: 1.65, crew: 8, bridge: 15, armorPointsPerTon: 16 },
    { name: "Gazelle", page: 29, shape: "aerodyne", tonnage: 1903, thrust: 4, structuralIntegrity: 8, engine: 410, thrustPointsPerTon: 9, fuelTons: 137, burnDay: 1.84, crew: 10, bridge: 15, armorPointsPerTon: 16 },
    { name: "Intruder", page: 49, shape: "spheroid", tonnage: 3000, thrust: 4, structuralIntegrity: 10, engine: 770, thrustPointsPerTon: null, fuelTons: null, burnDay: 1.84, crew: 30, bridge: 23, armorPointsPerTon: 16 },
    { name: "Union", page: 41, shape: "spheroid", tonnage: 3500, thrust: 3, structuralIntegrity: 11, engine: 630, thrustPointsPerTon: 6, fuelTons: 209, burnDay: 2.82, crew: 14, bridge: 27, armorPointsPerTon: 16 },
    { name: "Buccaneer", page: 57, shape: "aerodyne", tonnage: 3500, thrust: 3, structuralIntegrity: 8, engine: 630, thrustPointsPerTon: 6, fuelTons: 160, burnDay: 2.82, crew: 12, bridge: 27, armorPointsPerTon: 16 },
    { name: "Seeker", page: 31, shape: "spheroid", tonnage: 3700, thrust: 5, structuralIntegrity: 10, engine: 1190, thrustPointsPerTon: 6, fuelTons: 215, burnDay: 1.84, crew: 20, bridge: 26, armorPointsPerTon: 16 },
    { name: "Condor", page: 35, shape: "aerodyne", tonnage: 4500, thrust: 3, structuralIntegrity: 9, engine: 850, thrustPointsPerTon: 6, fuelTons: 208, burnDay: 1.84, crew: 24, bridge: 34, armorPointsPerTon: 16 },
    { name: "Achilles", page: 47, shape: "aerodyne", tonnage: 4500, thrust: 8, structuralIntegrity: 16, engine: 2390, thrustPointsPerTon: 6, fuelTons: 300, burnDay: 1.84, crew: 30, bridge: 34, armorPointsPerTon: 16 },
    { name: "Monarch", page: 61, shape: "aerodyne", tonnage: 5000, thrust: 3, structuralIntegrity: 6, engine: 940, thrustPointsPerTon: 5, fuelTons: 112, burnDay: 3.37, crew: 34, bridge: 38, armorPointsPerTon: 16 },
    { name: "Triumph", page: 33, shape: "aerodyne", tonnage: 5600, thrust: 3, structuralIntegrity: 11, engine: 1070, thrustPointsPerTon: 5, fuelTons: 250, burnDay: 1.84, crew: 15, bridge: 26, armorPointsPerTon: 16 },
    { name: "Fortress", page: 51, shape: "spheroid", tonnage: 6000, thrust: 3, structuralIntegrity: 13, engine: 1150, thrustPointsPerTon: 6, fuelTons: 400, burnDay: 1.84, crew: 42, bridge: 45, armorPointsPerTon: 16 },
    { name: "Overlord", page: 43, shape: "spheroid", tonnage: 9700, thrust: 3, structuralIntegrity: 18, engine: 1890, thrustPointsPerTon: 6, fuelTons: 306, burnDay: 1.84, crew: 43, bridge: 82, armorPointsPerTon: 16 },
    { name: "Vengeance", page: 55, shape: "aerodyne", tonnage: 10000, thrust: 4, structuralIntegrity: 7, engine: 1930, thrustPointsPerTon: 4, fuelTons: 500, burnDay: 1.84, crew: 9, bridge: 75, armorPointsPerTon: 12 },
    { name: "Mule", page: 59, shape: "spheroid", tonnage: 11200, thrust: 3, structuralIntegrity: 10, engine: 2080, thrustPointsPerTon: 4, fuelTons: 319, burnDay: 4.22, crew: 20, bridge: 84, armorPointsPerTon: 12 },
    { name: "Excalibur", page: 37, shape: "spheroid", tonnage: 16000, thrust: 3, structuralIntegrity: 9, engine: 3150, thrustPointsPerTon: 6, fuelTons: 300, burnDay: 1.84, crew: 24, bridge: 120, armorPointsPerTon: 14 },
    { name: "Mammoth", page: 63, shape: "spheroid", tonnage: 52000, thrust: 3, structuralIntegrity: 20, engine: 10150, thrustPointsPerTon: 2, fuelTons: 420, burnDay: 8.37, crew: 35, bridge: 390, armorPointsPerTon: 8 },
    { name: "Behemoth", page: 65, shape: "spheroid", tonnage: 100000, thrust: 2, structuralIntegrity: 30, engine: 13290, thrustPointsPerTon: 2, fuelTons: 600, burnDay: 8.83, crew: 50, bridge: 750, armorPointsPerTon: 6 },
];

// Stock's "look in DS/JS", as formulae (NGCFells's extrapolation, Inspired by Stock) ----------------------------------

/**
 * Thrust points a ton of fuel by tonnage, as DS&JS prints them: 10 under 2,000 tons, 6 under 10,000, 4 under 50,000,
 * 2 above (wrong by 1 for the Gazelle, Monarch and Triumph, by 2 for the Excalibur; mean error 0.26). Shape makes no
 * difference in the table.
 */
export function stockThrustPointsPerTon(tonnage: number): number {
    if (tonnage < 2000) return 10;
    if (tonnage < 10000) return 6;
    if (tonnage < 50000) return 4;
    return 2;
}

/**
 * Tons of fuel a burn-day: 1.84 to 16,000 tons (as most of DS&JS), then straight through the Mammoth (52,000 t, 8.37)
 * and the Behemoth (100,000 t, 8.83) and on at that slope. DS&JS's own exceptions (Fury 1.65, Union and Buccaneer 2.82,
 * Monarch 3.37, Mule 4.22) follow no rule the table shows. Rounded to 0.01.
 */
export function stockBurnDay(tonnage: number): number {
    let value: number;
    if (tonnage <= 16000) value = 1.84;
    else if (tonnage <= 52000) value = 1.84 + (8.37 - 1.84) * (tonnage - 16000) / 36000;
    else value = 8.37 + (8.83 - 8.37) * (tonnage - 52000) / 48000;
    return Math.round(value * 100) / 100;
}

/**
 * Crew by tonnage: 1.2378 x tonnage^0.3211, rounded (a power law through all of DS&JS; it is the loosest of the fits,
 * mean error 8, because a liner like the Monarch or a carrier like the Vengeance is crewed for its role, not its size).
 */
export function stockCrew(tonnage: number): number {
    return Math.max(1, Math.round(1.2378 * Math.pow(tonnage, 0.3211)));
}

/**
 * Armor points a ton: 16 under 10,000 tons (all of DS&JS), then 259.49 x tonnage^-0.3225, rounded, at most 16
 * (Vengeance 13 for 12, Mule 13 for 12, Excalibur 11 for 14, Mammoth 8, Behemoth 6).
 */
export function stockArmorPointsPerTon(tonnage: number): number {
    if (tonnage < 10000) return 16;
    return Math.max(1, Math.min(16, Math.round(259.49 * Math.pow(tonnage, -0.3225))));
}

/**
 * Stock's bridge weighs 1 to 10 times the crew "depending on bridge complexity". The multiplier DS&JS shows grows with
 * size: 0.00675 x tonnage^0.6661, to 0.1, kept within Stock's 1 to 10.
 */
export function stockBridgeMultiplier(tonnage: number): number {
    return Math.max(1, Math.min(10, Math.round(0.00675 * Math.pow(tonnage, 0.6661) * 10) / 10));
}

/**
 * Stock's heat-sink divisor, 10 to 25, "smaller engines 10 to 12, medium 13 to 16, larger 17 and up". The article
 * draws no line between sizes: the divisor runs from 10 for the smallest DS&JS engine (the Leopard's, 360 t) to 25 for
 * the largest (the Behemoth's, 13,290 t) on a log scale, rounded, so small is under about 660 t and large over about 1,720 t.
 */
export function stockHeatSinkDivisor(engineTons: number): number {
    if (engineTons <= 0) return 10;
    return Math.max(10, Math.min(25, Math.round(10 + 15 * Math.log(engineTons / 360) / Math.log(13290 / 360))));
}

// The design -------------------------------------------------------------------------------------------------------

/** What a DropShip asks of every method; each reads the parts it has rules for. */
export interface IFwDropShipDesign {
    tonnage: number;
    shape: FwDropShipShape;
    /** Safe thrust; overthrust is 1.5 x, rounded up. */
    thrust: number;
    structuralIntegrity: number;
    /** Stock and Eid: tons the builder carries. Reese and Houseman work from days. */
    fuelTons: number;
    /** Reese (20 to 30) and Houseman: days of fuel. */
    fuelDays: number;
    armorPoints: number;
    /** Armor bought by the ton instead, as the builder does: the points are then the tons x the method's points a ton. */
    armorTons?: number;
    addedHeatSinks: number;
    weaponTons: number;
    ammoTons: number;
    weaponCount: number;
    mechCubicles: number;
    fighterCubicles: number;
    smallCraftCubicles: number;
    mechDoors: number;
    fighterDoors: number;
    cargoDoors: number;
    heavyVehicles: number;
    lightVehicles: number;
    /** Crew members below officer. */
    crew: number;
    /** Officers (Eid's "high-ranking crew"). */
    officers: number;
    passengers: number;
    firstClassPassengers: number;
    footInfantry: number;
    jumpInfantry: number;
    motorizedInfantry: number;
    /** Reese: Clan technology (XL engine at half weight, half the tonnage for Chart A, double heat sinks, "a +2 bonus to hit"). */
    clan?: boolean;
    /** Reese: the engine weight is split among this many engines, each armored. */
    engines?: number;
    /** Eid: ferro-aluminum armor limits cubicle doors to five and cargo doors to ten. */
    ferroAluminum?: boolean;
    stock?: IStockChoices;
    eid?: { burnDay?: number };
    houseman?: IHousemanChoices;
}

/** The builder may set any of Stock's looked-up values; left unset, the formulae above fill them. */
export interface IStockChoices {
    bridgeMultiplier?: number;
    heatSinkDivisor?: number;
    crew?: number;
    thrustPointsPerTon?: number;
    burnDay?: number;
    armorPointsPerTon?: number;
}

export interface IHousemanChoices {
    /** Tail landing (aerodyne) or retractable legs (spheroid): 15% instead of 10%. */
    heavyLanding?: boolean;
    hyperpulseGenerator?: boolean;
    secondComputer?: boolean;
    /** Independent fire control, 1 ton a weapon. */
    fireControl?: boolean;
    /** Heaviest 'Mech, fighter, small craft and vehicle carried (default 100, 100, 200, 100). */
    maxMechTons?: number;
    maxFighterTons?: number;
    maxSmallCraftTons?: number;
    maxHeavyVehicleTons?: number;
    maxLightVehicleTons?: number;
    launchTubes?: number;
    assaultRampLanes?: number;
    dropCapsules?: number;
    /** Quarters beyond the crew, passengers and infantry the design already counts. */
    extraQuarters?: Partial<Record<HousemanQuartersTag, number>>;
    /** Cargo handling: 12% of the cargo. */
    cargoHandling?: boolean;
    /** Watches for "per shift" crew; default 3. */
    shifts?: number;
}

/** A line of the weight breakdown; the weapons and ammunition lines are tagged so a builder can list the items instead. */
export interface IFwWeightLine { label: string; tons: number; note?: string; kind?: "weapons" | "ammo" | "weaponMounts" }

export interface IFwDropShipResult {
    method: FwDropShipMethod;
    lines: IFwWeightLine[];
    /** Every line added up. */
    totalTons: number;
    /** What is left for cargo (Houseman: what is left, divided by his 110%). */
    cargoTons: number;
    engineTons: number;
    structureTons: number;
    bridgeTons: number;
    thrustPointsPerTon: number | null;
    burnDay: number | null;
    fuelTons: number;
    armorPointsPerTon: number;
    armorTons: number;
    armorPoints: number;
    freeHeatSinks: number;
    crew: number;
    issues: string[];
}

export function getOverthrust(thrust: number): number { return Math.ceil(thrust * 1.5); }

const round2 = (value: number): number => Math.round(value * 100) / 100;
const sum = (lines: IFwWeightLine[]): number => round2(lines.reduce((total, line) => total + line.tons, 0));
const line = (label: string, tons: number, note?: string): IFwWeightLine => (note ? { label, tons, note } : { label, tons });
const tagged = (kind: IFwWeightLine["kind"], label: string, tons: number): IFwWeightLine => ({ label, tons, kind });

/** The armor's tons and points: from the tons when the design gives them, else from the points (rounded the method's way). */
function armorOf(design: IFwDropShipDesign, pointsPerTon: number, round: (value: number) => number): { tons: number; points: number } {
    if (design.armorTons !== undefined) return { tons: design.armorTons, points: Math.floor(design.armorTons * pointsPerTon + 1e-9) };
    return { tons: round(design.armorPoints / pointsPerTon), points: design.armorPoints };
}

function finish(method: FwDropShipMethod, design: IFwDropShipDesign, lines: IFwWeightLine[], rest: Omit<IFwDropShipResult, "method" | "lines" | "totalTons" | "cargoTons">, cargoShare = 1): IFwDropShipResult {
    const kept = lines.filter((entry) => entry.tons !== 0 || entry.note);
    const totalTons = sum(kept);
    const cargoTons = round2(Math.max(0, design.tonnage - totalTons) / cargoShare);
    const issues = [...rest.issues];
    if (totalTons > design.tonnage) issues.push(`The parts weigh ${totalTons.toLocaleString("en-US")} tons, over the ${design.tonnage.toLocaleString("en-US")}-ton hull.`);
    return { method, lines: kept, totalTons, cargoTons, ...rest, issues };
}

// Stock (FW #16 p.32) -------------------------------------------------------------------------------------------------

export function buildStockDropShip(design: IFwDropShipDesign): IFwDropShipResult {
    const t = design.tonnage;
    const choices = design.stock ?? {};
    const issues: string[] = [];
    const engineTons = round2(t / (15 / design.thrust));
    const structureTons = round2(design.structuralIntegrity * t / 100);
    const thrustPointsPerTon = choices.thrustPointsPerTon ?? stockThrustPointsPerTon(t);
    const burnDay = choices.burnDay ?? stockBurnDay(t);
    const crew = design.crew + design.officers;
    const multiplier = choices.bridgeMultiplier ?? stockBridgeMultiplier(t);
    if (multiplier < 1 || multiplier > 10) issues.push("Stock's bridge weighs 1 to 10 times the crew.");
    const bridgeTons = round2(multiplier * crew);
    const divisor = choices.heatSinkDivisor ?? stockHeatSinkDivisor(engineTons);
    if (divisor < 10 || divisor > 25) issues.push("Stock divides the engine by 10 to 25 for its heat sinks.");
    const freeHeatSinks = Math.floor(engineTons / divisor);
    const armorPointsPerTon = choices.armorPointsPerTon ?? stockArmorPointsPerTon(t);
    const { tons: armorTons, points: armorPoints } = armorOf(design, armorPointsPerTon, round2);
    const suggestedCrew = choices.crew ?? stockCrew(t);
    const infantry = design.footInfantry * 2 + (design.jumpInfantry + design.motorizedInfantry) * 3;
    const lines = [
        line(`Engine (thrust ${design.thrust})`, engineTons),
        line(`Structural Integrity (${design.structuralIntegrity})`, structureTons),
        line(`Fuel (${thrustPointsPerTon} thrust points a ton)`, design.fuelTons),
        line(`Bridge (${multiplier} x ${crew} crew)`, bridgeTons),
        line(`Heat Sinks (${freeHeatSinks} free, engine / ${divisor}; ${design.addedHeatSinks} added)`, design.addedHeatSinks),
        line(`Armor (${armorPoints} points at ${armorPointsPerTon} a ton)`, armorTons),
        tagged("weapons", "Weapons", design.weaponTons),
        tagged("ammo", "Ammunition", design.ammoTons),
        line(`Cubicles (${design.mechCubicles + design.fighterCubicles + design.smallCraftCubicles} at 150 tons)`, 150 * (design.mechCubicles + design.fighterCubicles + design.smallCraftCubicles)),
        line(`Doors (${design.mechDoors + design.fighterDoors + design.cargoDoors} at 5 tons)`, 5 * (design.mechDoors + design.fighterDoors + design.cargoDoors)),
        line(`Vehicles (${design.heavyVehicles} heavy, ${design.lightVehicles} light)`, 100 * design.heavyVehicles + 50 * design.lightVehicles),
        line(`Crew (${crew} at 5 tons)`, 5 * crew),
        line(`Passengers (${design.passengers} at 5 tons, ${design.firstClassPassengers} first class at 10)`, 5 * design.passengers + 10 * design.firstClassPassengers),
        line("Infantry (2 tons a trooper, 3 jump or motorized)", infantry),
    ];
    return finish("stock", design, lines, {
        engineTons, structureTons, bridgeTons, thrustPointsPerTon, burnDay, fuelTons: design.fuelTons,
        armorPointsPerTon, armorTons, armorPoints, freeHeatSinks, crew: suggestedCrew, issues,
    });
}

// Eid (FW #25 pp.6-7) ---------------------------------------------------------------------------------------------------

/** Eid's burn-day: 1.84 under 15,000 tons; above, the builder's figure (up to about 9 at 100,000 tons), else Stock's formula. */
export function eidBurnDay(tonnage: number, chosen?: number): number {
    if (tonnage < 15000) return 1.84;
    return chosen ?? stockBurnDay(tonnage);
}

export function buildEidDropShip(design: IFwDropShipDesign): IFwDropShipResult {
    const t = design.tonnage;
    const issues: string[] = [];
    const engineTons = round2(t / (16 / design.thrust));
    if (design.structuralIntegrity <= getOverthrust(design.thrust)) issues.push("Eid's Structural Integrity must be greater than the Overthrust.");
    const structureTons = round2(design.structuralIntegrity * t / 100);
    if (t > 100000) issues.push("Eid's Chart A stops at 100,000 tons.");
    const thrustPointsPerTon = lookupFwBand(EID_CHART_A, t);
    const burnDay = eidBurnDay(t, design.eid?.burnDay);
    const bridgeTons = round2(t * 0.0075);
    const divisor = lookupFwBand(EID_CHART_B, engineTons);
    const freeHeatSinks = Math.floor(engineTons / divisor);
    const armorPointsPerTon = lookupFwBand(design.shape === "aerodyne" ? EID_CHART_C : EID_CHART_D, t);
    const { tons: armorTons, points: armorPoints } = armorOf(design, armorPointsPerTon, round2);
    const cubicleDoors = design.mechDoors + design.fighterDoors;
    const doorLimit = design.ferroAluminum ? 5 : 8;
    if (cubicleDoors > doorLimit) issues.push(`Eid allows at most ${doorLimit} cubicle doors${design.ferroAluminum ? " with ferro-aluminum armor" : ""}.`);
    if (design.ferroAluminum && design.cargoDoors > 10) issues.push("Eid allows at most 10 cargo doors with ferro-aluminum armor.");
    const crew = design.crew + design.officers;
    if (crew < 9) issues.push("Eid's crew is at least two pilots, four engineers and three second engineers (9).");
    const cubicles = design.mechCubicles + design.fighterCubicles + design.smallCraftCubicles;
    const lines = [
        line(`Engine (thrust ${design.thrust})`, engineTons),
        line(`Structural Integrity (${design.structuralIntegrity})`, structureTons),
        line(`Fuel (${thrustPointsPerTon} thrust points a ton)`, design.fuelTons),
        line("Bridge (0.0075 of the tonnage)", bridgeTons),
        line(`Heat Sinks (${freeHeatSinks} free, engine / ${divisor}; ${design.addedHeatSinks} added)`, design.addedHeatSinks),
        line(`Armor (${armorPoints} points at ${armorPointsPerTon} a ton)`, armorTons),
        tagged("weapons", "Weapons", design.weaponTons),
        tagged("ammo", "Ammunition", design.ammoTons),
        line(`Cubicles (${cubicles} at 150 tons; doors weigh nothing)`, 150 * cubicles),
        line(`Vehicles (${design.heavyVehicles} heavy, ${design.lightVehicles} light)`, 100 * design.heavyVehicles + 50 * design.lightVehicles),
        line(`Crew (${design.crew} at 5 tons, ${design.officers} officers at 10)`, 5 * design.crew + 10 * design.officers),
        line(`Passengers (${design.passengers} at 5 tons, ${design.firstClassPassengers} first class at 10)`, 5 * design.passengers + 10 * design.firstClassPassengers),
        line("Infantry (7 tons a trooper, 8 jump or motorized)", 7 * design.footInfantry + 8 * (design.jumpInfantry + design.motorizedInfantry)),
    ];
    return finish("eid", design, lines, {
        engineTons, structureTons, bridgeTons, thrustPointsPerTon, burnDay, fuelTons: design.fuelTons,
        armorPointsPerTon, armorTons, armorPoints, freeHeatSinks, crew, issues,
    });
}

/**
 * Eid's notes on advanced technology (FW #25 p.7), matched on an item's name: refused items and CASE's rule. Arrow IV
 * and Thunder LRMs he only questions, so they are allowed with a note. "MASO" is printed for MASC.
 */
export function getEidEquipmentIssues(itemNames: readonly string[], ammoTons: number, caseCount: number): string[] {
    const issues: string[] = [];
    const refused: [RegExp, string][] = [
        [/anti-personnel pod|\bA-Pod\b/i, "Eid: anti-personnel pods are Clan equipment, unavailable to the Inner Sphere."],
        [/\bC3\b|C³/i, "Eid: no C3 computer on a DropShip (its own computer networks are larger and more complicated)."],
        [/endo[- ]steel/i, "Eid: Endo-Steel structure is too bulky for a DropShip."],
        [/\bMASC\b/i, "Eid: MASC is for 'Mechs only."],
        [/targeting computer/i, "Eid: targeting computers are Clan equipment, unavailable to the Inner Sphere."],
        [/triple[- ]strength myomer|\bTSM\b/i, "Eid: Triple-Strength Myomer is for 'Mechs only."],
    ];
    for (const [pattern, text] of refused) if (itemNames.some((name) => pattern.test(name)) && !issues.includes(text)) issues.push(text);
    if (caseCount > 0 && caseCount < Math.ceil(ammoTons)) issues.push("Eid: CASE must be allocated for each ton of ammunition.");
    return issues;
}

// Reese (FW #36 pp.16-18) ------------------------------------------------------------------------------------------------

export function buildReeseDropShip(design: IFwDropShipDesign): IFwDropShipResult {
    const t = design.tonnage;
    const issues: string[] = [];
    const clan = design.clan === true;
    const overthrust = getOverthrust(design.thrust);
    // Reese rounds every line to the whole ton, as his worked examples do (FW #36 pp.17-18: 656, 385, 2,515, 53).
    const engineTons = Math.round(t / (16 / design.thrust) * (clan ? 0.5 : 1));
    if (design.structuralIntegrity < overthrust || design.structuralIntegrity > 3 * overthrust) issues.push(`Reese's Structural Integrity runs from the Overthrust (${overthrust}) to three times it (${3 * overthrust}).`);
    const structureTons = Math.round(design.structuralIntegrity * t / 100);
    if (t < 101) issues.push("Reese's Chart A starts at 101 tons.");
    const thrustPointsPerTon = lookupFwBand(REESE_CHART_A, clan ? t * 0.5 : t);
    const burnDay = round2(1440 / thrustPointsPerTon);
    if (design.fuelDays < 20 || design.fuelDays > 30) issues.push("Reese carries 20 to 30 days of fuel.");
    const fuelTons = Math.round(design.fuelDays * 1440 / thrustPointsPerTon);
    const bridgeTons = Math.min(25, Math.round(t * 0.0075));
    const divisor = lookupFwBand(EID_CHART_B, engineTons);
    const freeHeatSinks = Math.round(engineTons / divisor);
    const armorPointsPerTon = lookupFwBand(design.shape === "aerodyne" ? REESE_CHART_C : REESE_CHART_D, t);
    const { tons: armorTons, points: armorPoints } = armorOf(design, armorPointsPerTon, Math.round);
    const combatDoors = design.mechDoors + design.fighterDoors + design.cargoDoors;
    if (combatDoors > 8) issues.push("Reese: no more than eight doors for a combat drop, cargo doors counted.");
    const cubicles = design.mechCubicles + design.fighterCubicles + design.smallCraftCubicles;
    const engines = Math.max(1, design.engines ?? 1);
    const lines = [
        line(`Engine (thrust ${design.thrust}${engines > 1 ? `, ${engines} engines` : ""}${clan ? ", Clan XL" : ""})`, engineTons),
        line(`Structural Integrity (${design.structuralIntegrity})`, structureTons),
        line(`Fuel (${design.fuelDays} days at ${burnDay} tons, ${thrustPointsPerTon} thrust points a ton)`, fuelTons),
        line("Bridge (0.0075 of the tonnage, at most 25)", bridgeTons),
        line(`Heat Sinks (${freeHeatSinks} in the engine, / ${divisor}; ${design.addedHeatSinks} added)`, design.addedHeatSinks),
        line(`Armor (${armorPoints} points at ${armorPointsPerTon} a ton)`, armorTons),
        tagged("weapons", "Weapons", design.weaponTons),
        tagged("ammo", "Ammunition", design.ammoTons),
        line(`Cubicles (${cubicles} at 150 tons)`, 150 * cubicles),
        line(`Vehicle bays (${design.heavyVehicles} at 100 tons, ${design.lightVehicles} at 50)`, 100 * design.heavyVehicles + 50 * design.lightVehicles),
        line(`Crew (${design.crew} at 5 tons, ${design.officers} officers at 10)`, 5 * design.crew + 10 * design.officers),
        line(`Passengers (${design.passengers} at 5 tons, ${design.firstClassPassengers} first class at 10)`, 5 * design.passengers + 10 * design.firstClassPassengers),
        line("Infantry (7 tons a trooper, 8 jump or motorized)", 7 * design.footInfantry + 8 * (design.jumpInfantry + design.motorizedInfantry)),
    ];
    return finish("reese", design, lines, {
        engineTons, structureTons, bridgeTons, thrustPointsPerTon, burnDay, fuelTons,
        armorPointsPerTon, armorTons, armorPoints, freeHeatSinks, crew: design.crew + design.officers, issues,
    });
}

/** Reese's tonnage from a 1/285 model (FW #36 p.16): cubic centimeters x 23.1 = cubic meters, x 0.07 = tons. */
export type ReeseShape =
    | { kind: "box"; height: number; length: number; width: number }
    | { kind: "cylinder"; radius: number; height: number }
    | { kind: "cone"; radius: number; height: number }
    | { kind: "sphere"; diameter: number }
    | { kind: "triangle"; height: number; longestSide: number; thickness: number };

/**
 * Reese's Pi, as his rule prints it (FW #36 p.16): 3.145. His own UNION-12 (p.17) works with the true value (a 30 cm
 * sphere is 14,137 cubic centimeters, so 22,860 tons); by the rule it is 14,153 and 22,885 tons. The rule is kept, and
 * the tonnage field can always be typed.
 */
export const REESE_PI = 3.145;

export function getReeseShapeVolume(shape: ReeseShape): number {
    switch (shape.kind) {
        case "box": return shape.height * shape.length * shape.width;
        case "cylinder": return REESE_PI * shape.radius * shape.radius * shape.height;
        case "cone": return REESE_PI * shape.radius * shape.radius * shape.height / 3;
        case "sphere": return REESE_PI * Math.pow(shape.diameter, 3) / 6;
        case "triangle": return shape.height * shape.longestSide * shape.thickness / 4;
    }
}

/** Tons from the model's shapes, rounded to the ton as Reese prints them. */
export function getReeseModelTonnage(shapes: readonly ReeseShape[]): { cubicCentimeters: number; cubicMeters: number; tons: number } {
    const cubicCentimeters = shapes.reduce((total, shape) => total + getReeseShapeVolume(shape), 0);
    const cubicMeters = cubicCentimeters * 23.1;
    return { cubicCentimeters, cubicMeters, tons: Math.round(cubicMeters * 0.07) };
}

// Houseman (FW #36 pp.22-23) ----------------------------------------------------------------------------------------------

export function getHousemanMinimumCrew(design: IFwDropShipDesign): number {
    const shifts = Math.max(1, design.houseman?.shifts ?? 3);
    const cargoOfficers = Math.max(Math.ceil(design.mechCubicles / 12), 0);
    // 1 captain, 1 engineering officer; a pilot, a drive engineer and a fusion plant engineer a shift; 1 a small craft
    // bay; 4 a launch tube; 1 cargo officer per 12 'Mechs or 1,000 tons of cargo (the cargo part is left to the builder).
    return 2 + 3 * shifts + design.fighterCubicles + design.smallCraftCubicles + 4 * (design.houseman?.launchTubes ?? 0) + cargoOfficers;
}

export function buildHousemanDropShip(design: IFwDropShipDesign): IFwDropShipResult {
    const t = design.tonnage;
    const choices = design.houseman ?? {};
    const issues: string[] = [];
    const integrity = getHousemanIntegrity(design.structuralIntegrity);
    const pct = (share: number): number => round2(t * share);
    const structureTons = pct(integrity.percentOfMass / 100);
    const hull = pct(design.shape === "spheroid" ? 0.05 : 0.10);
    const power = pct(0.02);
    // "One point of thrust per 100 tons ... weighs 3 tons": a Leopard (1,720 t) is 17 x 3 = 51 tons a point.
    const engineTons = 3 * Math.floor(t / 100) * design.thrust;
    if (design.thrust > design.structuralIntegrity) issues.push("Houseman: thrust (in g) may not exceed structural integrity.");
    if (design.thrust > 6) issues.push("Houseman: six g is a normal crew maximum.");
    const fuelTons = 3 * design.thrust * design.fuelDays;
    const landing = pct(choices.heavyLanding ? 0.15 : 0.10);
    const comms = pct(0.03);
    const hpg = choices.hyperpulseGenerator ? 100 : 0;
    const secondComputer = choices.secondComputer ? 5 : 0;
    const fireControl = choices.fireControl ? design.weaponCount : 0;
    const docking = getHousemanDockingTons(t);
    const armorPointsPerTon = lookupFwBand(HOUSEMAN_ARMOR, t);
    const { tons: armorTons, points: armorPoints } = armorOf(design, armorPointsPerTon, round2);
    const q = HOUSEMAN_QUARTERS;
    const extra = choices.extraQuarters ?? {};
    const extraTons = (Object.keys(extra) as HousemanQuartersTag[]).reduce((total, tag) => total + (extra[tag] ?? 0) * q[tag], 0);
    const quarters = round2((design.crew + design.officers) * q.permanentCrew + design.firstClassPassengers * q.firstClass + design.passengers * q.secondClass
        + design.footInfantry * q.infantry + (design.jumpInfantry + design.motorizedInfantry) * q.jumpInfantry + extraTons);
    const weapons = round2(design.weaponTons * 1.5);
    const mechTons = choices.maxMechTons ?? 100;
    const mechBays = design.mechCubicles * 2 * mechTons;
    const smallCraftBays = design.fighterCubicles * 2 * (choices.maxFighterTons ?? 100) + design.smallCraftCubicles * 2 * (choices.maxSmallCraftTons ?? 200);
    const launchTubes = 200 * (choices.launchTubes ?? 0);
    const vehicles = round2(design.heavyVehicles * 1.5 * (choices.maxHeavyVehicleTons ?? 100) + design.lightVehicles * 1.5 * (choices.maxLightVehicleTons ?? 50));
    const doors = round2(0.2 * (design.mechDoors * mechTons + design.fighterDoors * (choices.maxFighterTons ?? 100) + design.cargoDoors * mechTons));
    const ramps = 40 * (choices.assaultRampLanes ?? 0);
    const magazine = round2(design.ammoTons * 2);
    const capsules = round2(0.25 * mechTons * (choices.dropCapsules ?? 0));
    const recycling = pct(0.01);
    const lines = [
        line(`Internal Structure (integrity ${design.structuralIntegrity}, ${integrity.percentOfMass}%)`, structureTons, integrity.extended ? "Integrity past 8: NGCFells's extension of Houseman's table." : undefined),
        line(`Hull (${design.shape === "spheroid" ? "5" : "10"}%)`, hull),
        line("Internal Power (2%)", power),
        line(`Thrusters (thrust ${design.thrust}, 3 tons a point a 100 tons)`, engineTons),
        line(`Fuel (${design.fuelDays} days at 3 tons a thrust point a day)`, fuelTons),
        line(`Landing System (${choices.heavyLanding ? "15" : "10"}%)`, landing),
        line("Communications and Controls (3%)", comms),
        line("Hyperpulse Generator", hpg),
        line("Second Computer", secondComputer),
        line("Independent Fire Control (1 ton a weapon)", fireControl),
        line("Docking System", docking),
        line(`Armor (${armorPoints} points at ${armorPointsPerTon} a ton)`, armorTons),
        line("Living Quarters", quarters),
        tagged("weapons", "Weapons", design.weaponTons),
        tagged("weaponMounts", "Weapon Shutters and Mounts (50% of the weapons)", round2(weapons - design.weaponTons)),
        tagged("ammo", "Ammunition", design.ammoTons),
        line("Ammo Magazine (200% of the ammunition)", magazine),
        line(`'Mech Bays (${design.mechCubicles}, 200% of a ${mechTons}-ton 'Mech)`, mechBays),
        line("Small Craft Bays (200% of the craft)", smallCraftBays),
        line("Launch Tubes", launchTubes),
        line("Vehicles (150% of the vehicle)", vehicles),
        line("Doors (20% of the largest item through)", doors),
        line("Assault Ramps (40 tons a lane)", ramps),
        line("Drop Capsules (25% of the 'Mech)", capsules),
        line("Recycling Systems (1%)", recycling),
        line(`Heat Sinks (${design.addedHeatSinks}, 1 ton each)`, design.addedHeatSinks, "Houseman has no heat-sink rule: NGCFells's call, a ton each and none free."),
    ];
    const limited = armorTons + landing + comms + hpg + secondComputer + fireControl + quarters + weapons + mechBays + smallCraftBays + launchTubes + recycling;
    if (limited >= 0.25 * t) issues.push(`Houseman: armor, landing, communications, quarters, weapons, bays, launch tubes and recycling must be less than 25% of the weight (${round2(limited).toLocaleString("en-US")} of ${round2(0.25 * t).toLocaleString("en-US")} tons).`);
    const minimumCrew = getHousemanMinimumCrew(design);
    if (design.crew + design.officers < minimumCrew) issues.push(`Houseman's typical crew for this ship is at least ${minimumCrew}.`);
    const result = finish("houseman", design, lines, {
        engineTons, structureTons, bridgeTons: comms, thrustPointsPerTon: null, burnDay: 3, fuelTons,
        armorPointsPerTon, armorTons, armorPoints, freeHeatSinks: 0, crew: design.crew + design.officers, issues,
    }, 1.1);
    if (choices.cargoHandling) {
        const handling = round2(result.cargoTons * 0.12);
        result.lines.push(line("Cargo Handling (12% of the cargo)", handling));
        result.totalTons = sum(result.lines);
        result.cargoTons = round2(Math.max(0, t - result.totalTons) / 1.1);
    }
    return result;
}

// Fire factors ---------------------------------------------------------------------------------------------------------

/** The methods whose sheets carry fire factors: Stock's "optional fire factors" (FW #16 p.32), Eid's and Reese's step. */
export const FW_FIRE_FACTOR_METHODS: FwDropShipMethod[] = ["stock", "eid", "reese"];

/**
 * A location's fire factors "as per The BattleTech Compendium": the maximum damage of all its weapons, divided by ten,
 * "rounding up at .6" (Eid, FW #25 p.6; Reese, FW #36 p.16). Stock names fire factors without a rule; his sheets use
 * the same one here.
 */
export function getFireFactor(totalMaxDamage: number): number {
    const tenths = totalMaxDamage / 10;
    const whole = Math.floor(tenths + 1e-9);
    return tenths - whole >= 0.6 - 1e-9 ? whole + 1 : whole;
}

/** Eid's bonus for advanced weapons (FW #25 p.6): +1 to hit for every +4 of to-hit bonus in the location. */
export function getEidFireFactorBonus(totalToHitBonus: number): number {
    return Math.max(0, Math.floor(totalToHitBonus / 4 + 1e-9));
}

export function buildFwDropShip(method: FwDropShipMethod, design: IFwDropShipDesign): IFwDropShipResult {
    switch (method) {
        case "stock": return buildStockDropShip(design);
        case "eid": return buildEidDropShip(design);
        case "reese": return buildReeseDropShip(design);
        case "houseman": return buildHousemanDropShip(design);
    }
}

/** A design with nothing chosen yet, for tests and samples to spread over. */
export function emptyFwDropShipDesign(tonnage: number, shape: FwDropShipShape): IFwDropShipDesign {
    return {
        tonnage, shape, thrust: 3, structuralIntegrity: 5, fuelTons: 0, fuelDays: 20, armorPoints: 0, addedHeatSinks: 0,
        weaponTons: 0, ammoTons: 0, weaponCount: 0, mechCubicles: 0, fighterCubicles: 0, smallCraftCubicles: 0,
        mechDoors: 0, fighterDoors: 0, cargoDoors: 0, heavyVehicles: 0, lightVehicles: 0, crew: 0, officers: 0,
        passengers: 0, firstClassPassengers: 0, footInfantry: 0, jumpInfantry: 0, motorizedInfantry: 0,
    };
}
