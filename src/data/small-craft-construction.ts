// Small Craft construction data (TechManual pp.180-197). The transport bay, quarters and escape system tables
// are the ones DropShips use as well.

import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

export type SmallCraftShape = "aerodyne" | "spheroid";
export const SMALL_CRAFT_SHAPES: { tag: SmallCraftShape; name: string }[] = [
    { tag: "aerodyne", name: "Aerodyne" },
    { tag: "spheroid", name: "Spheroid" },
];

/** Small Craft weigh 100 to 200 tons, in 5-ton steps (TM p.184). */
export const SMALL_CRAFT_MIN_TONNAGE = 100;
export const SMALL_CRAFT_MAX_TONNAGE = 200;
export const SMALL_CRAFT_TONNAGE_STEP = 5;

/** Engine weight = tonnage x Safe Thrust x this, rounded up to the half ton (Aerospace Unit Engine Table, TM p.185). */
export const SMALL_CRAFT_ENGINE_FACTOR: Record<"is" | "clan", number> = { is: 0.065, clan: 0.061 };
/** Fuel points a ton, and the fuel a day at 1 G under strategic movement (Aerospace Fuel Table, TM p.186). */
export const SMALL_CRAFT_FUEL_POINTS_PER_TON = 80;
export const SMALL_CRAFT_STRATEGIC_FUEL_TONS_PER_DAY = 1.84;
/** Tanks and pumps add 2 percent of the fuel's weight, rounded up to the half ton (TM p.186). */
export const SMALL_CRAFT_FUEL_PUMP_FACTOR = 0.02;
/** Structural Integrity runs from Maximum Thrust to 30 times it (TM p.187). */
export const SMALL_CRAFT_MAX_SI_FACTOR = 30;
/** Structural Integrity weighs SI x tonnage / this, rounded up to the half ton (Structural Integrity Table, TM p.187). */
export const SMALL_CRAFT_SI_DIVISOR: Record<SmallCraftShape, number> = { aerodyne: 200, spheroid: 500 };
/** Controls weigh tonnage x 0.0075, rounded up to the half ton (Aerospace Control Systems Table, TM p.189). */
export const SMALL_CRAFT_CONTROLS_FACTOR = 0.0075;
/** Base crew of a Small Craft, before gunners (TM p.189). */
export const SMALL_CRAFT_BASE_CREW = 3;
/** One gunner for every six weapons, rounded up (Aerospace Unit Crew Needs, TM p.189). */
export const SMALL_CRAFT_WEAPONS_PER_GUNNER = 6;
/** The most armor, in tons, is Structural Integrity x this (Aerospace Unit Maximum Armor Levels Table, TM p.191). */
export const SMALL_CRAFT_MAX_ARMOR_TONS_PER_SI: Record<SmallCraftShape, number> = { aerodyne: 4.5, spheroid: 3.6 };
/** Weapons an arc holds before extra fire control is needed (TM p.196). */
export const SMALL_CRAFT_WEAPONS_PER_ARC = 12;
/** Every ammunition-fed weapon needs this many turns of fire (TM p.194). */
export const SMALL_CRAFT_MIN_TURNS_OF_FIRE = 10;
/** Bay doors: no more than 2 on an aerodyne Small Craft, 4 on a spheroid (TM p.196). */
export const SMALL_CRAFT_MAX_BAY_DOORS: Record<SmallCraftShape, number> = { aerodyne: 2, spheroid: 4 };
export const BAY_DOOR_COST = 1000;

export type SmallCraftFacing = "nose" | "left" | "right" | "aft";
export const SMALL_CRAFT_FACINGS: SmallCraftFacing[] = ["nose", "left", "right", "aft"];
/** The armor facings are wings on an aerodyne craft and sides on a spheroid (TM p.191). */
export const getSmallCraftFacingName = (facing: SmallCraftFacing, shape: SmallCraftShape): string => {
    if (facing === "nose") return "Nose";
    if (facing === "aft") return "Aft";
    return `${facing === "left" ? "Left" : "Right"} ${shape === "aerodyne" ? "Wing" : "Side"}`;
};

/**
 * Firing arcs (TM p.195). An aerodyne craft has Nose, the two Wings and Aft, and may turn wing weapons to face
 * the rear; a spheroid has Nose, Fore-Left, Fore-Right, Aft-Left, Aft-Right and Aft. Both come to the same six
 * mounts: the two rearward ones sit on the left and right armor facings.
 */
export type SmallCraftArc = "nose" | "left" | "right" | "leftAft" | "rightAft" | "aft";
export const SMALL_CRAFT_ARCS: SmallCraftArc[] = ["nose", "left", "right", "leftAft", "rightAft", "aft"];
export const SMALL_CRAFT_ARC_FACING: Record<SmallCraftArc, SmallCraftFacing> = {
    nose: "nose", left: "left", right: "right", leftAft: "left", rightAft: "right", aft: "aft",
};
/** The arc on the other side, for the rule that side weapons match (TM p.195). */
export const SMALL_CRAFT_OPPOSITE_ARC: Partial<Record<SmallCraftArc, SmallCraftArc>> = {
    left: "right", right: "left", leftAft: "rightAft", rightAft: "leftAft",
};
export const getSmallCraftArcName = (arc: SmallCraftArc, shape: SmallCraftShape): string => {
    const names: Record<SmallCraftShape, Record<SmallCraftArc, string>> = {
        aerodyne: { nose: "Nose", left: "Left Wing", right: "Right Wing", leftAft: "Left Wing (Rear)", rightAft: "Right Wing (Rear)", aft: "Aft" },
        spheroid: { nose: "Nose", left: "Fore-Left", right: "Fore-Right", leftAft: "Aft-Left", rightAft: "Aft-Right", aft: "Aft" },
    };
    return names[shape][arc];
};

/**
 * Quarters (Quarters/Seating Table, TM p.236), one person each. A Small Craft or DropShip pays for its quarters
 * through life support, not by the room (TM p.284).
 */
export interface IQuartersType {
    tag: "firstClass" | "secondClass" | "crew" | "steerage";
    name: string;
    tons: number;
}
export const quartersTypes: IQuartersType[] = [
    { tag: "firstClass", name: "Officer / 1st Class", tons: 10 },
    { tag: "secondClass", name: "2nd Class", tons: 7 },
    { tag: "crew", name: "Crew", tons: 7 },
    { tag: "steerage", name: "Steerage", tons: 5 },
];
export type QuartersTag = IQuartersType["tag"];

/**
 * Transport bays (Transport Bay table, TM p.239; prices TM pp.294-295). A cargo bay is bought by the ton; the
 * others by the bay or cubicle. Every bay but an infantry one needs a door (TM p.196).
 */
export interface ITransportBayType {
    tag: string;
    name: string;
    /** Tons for one bay or cubicle; null for cargo, bought by the ton. */
    tonsEach: number | null;
    /** What one bay or cubicle (or one ton of cargo space) holds. */
    capacity: string;
    /** Usable share of a cargo bay's weight. */
    cargoFactor?: number;
    /** C-bills for a bay or cubicle, or for a ton where costPerTon is set. */
    cost: number;
    costPerTon?: boolean;
    infantry?: boolean;
    /** Battle armor bays: infantry, but they still want a door (TM p.196, SO:AA p.144). */
    battleArmor?: boolean;
    /** The tech base that fields this bay; absent for both. */
    tech?: "is" | "clan";
    /** Bay personnel, who need no quarters (TM p.239). */
    personnel?: number;
    /** A bay from outside the rulebooks: the rules level a design that carries it needs. */
    rulesLevel?: number;
}
export const transportBayTypes: ITransportBayType[] = [
    { tag: "cargo", name: "Cargo, Standard", tonsEach: null, capacity: "1 ton of bulk cargo", cargoFactor: 1, cost: 0, costPerTon: true },
    { tag: "cargo-liquid", name: "Cargo, Liquid", tonsEach: null, capacity: "0.91 tons of fluid", cargoFactor: 0.91, cost: 100, costPerTon: true },
    { tag: "cargo-insulated", name: "Cargo, Insulated", tonsEach: null, capacity: "0.87 tons of cargo", cargoFactor: 0.87, cost: 250, costPerTon: true },
    { tag: "cargo-refrigerated", name: "Cargo, Refrigerated", tonsEach: null, capacity: "0.87 tons of cargo", cargoFactor: 0.87, cost: 200, costPerTon: true },
    { tag: "cargo-livestock", name: "Cargo, Livestock", tonsEach: null, capacity: "0.83 tons of animals", cargoFactor: 0.83, cost: 2500, costPerTon: true },
    { tag: "cargo-container", name: "Cargo, Container", tonsEach: 10, capacity: "1 container of 10 tons", cost: 0 },
    { tag: "infantry-compartment", name: "Infantry Compartment", tonsEach: null, capacity: "1 ton of infantry or battle armor", cost: 0, costPerTon: true, infantry: true },
    { tag: "infantry-foot", name: "Infantry Bay, Foot", tonsEach: 5, capacity: "30 foot troopers", cost: 15000, costPerTon: true, infantry: true, personnel: 30 },
    { tag: "infantry-jump", name: "Infantry Bay, Jump", tonsEach: 6, capacity: "30 jump troopers", cost: 15000, costPerTon: true, infantry: true, personnel: 30 },
    { tag: "infantry-motorized", name: "Infantry Bay, Motorized", tonsEach: 7, capacity: "30 motorized troopers", cost: 15000, costPerTon: true, infantry: true, personnel: 30 },
    { tag: "infantry-mechanized", name: "Infantry Bay, Mechanized", tonsEach: 8, capacity: "7 mechanized troopers", cost: 15000, costPerTon: true, infantry: true, personnel: 7 },
    { tag: "battle-armor-is", name: "Battle Armor Bay (4 troopers)", tonsEach: 8, capacity: "4 battle armor troopers", cost: 15000, costPerTon: true, infantry: true, battleArmor: true, tech: "is", personnel: 6 },
    { tag: "battle-armor-clan", name: "Battle Armor Bay (5 troopers)", tonsEach: 10, capacity: "5 battle armor troopers", cost: 15000, costPerTon: true, infantry: true, battleArmor: true, tech: "clan", personnel: 6 },
    { tag: "battle-armor-is-6", name: "Battle Armor Bay (6 troopers)", tonsEach: 12, capacity: "6 battle armor troopers", cost: 15000, costPerTon: true, infantry: true, battleArmor: true, tech: "is", personnel: 6 },
    { tag: "protomech", name: "ProtoMech Cubicles (5)", tonsEach: 50, capacity: "5 ProtoMechs", cost: 10000, tech: "clan", personnel: 6 },
    { tag: "vehicle-light", name: "Vehicle Cubicle, Light", tonsEach: 50, capacity: "1 vehicle of up to 50 tons", cost: 10000, personnel: 5 },
    { tag: "vehicle-heavy", name: "Vehicle Cubicle, Heavy", tonsEach: 100, capacity: "1 vehicle of up to 100 tons", cost: 10000, personnel: 8 },
    { tag: "mech", name: "'Mech Cubicle", tonsEach: 150, capacity: "1 BattleMech or IndustrialMech", cost: 20000, personnel: 2 },
    { tag: "fighter", name: "Fighter Cubicle", tonsEach: 150, capacity: "1 fighter of up to 100 tons", cost: 20000, personnel: 2 },
    { tag: "vehicle-superheavy", name: "Vehicle Cubicle, Superheavy", tonsEach: 200, capacity: "1 vehicle of up to 200 tons", cost: 20000, personnel: 15 },
    { tag: "small-craft", name: "Small Craft Cubicle", tonsEach: 200, capacity: "1 Small Craft of up to 200 tons", cost: 20000, personnel: 5 },
    // Micro-Mechs 6.1.0.2, AeroTech 2 supplement (Custom Homebrew, #173): 75 tons, 15,000 C-bills, basic repair and
    // quarters for the Micro-Mechwarrior and a technician (taken as 2 bay personnel, as the 'Mech cubicle's).
    // In an emergency two Micro-Mechs fit a 'Mech cubicle; no BattleMech fits this bay.
    { tag: "micro-mech", name: "Micro-Mech Bay", tonsEach: 75, capacity: "1 Micro-Mech of up to 19 tons", cost: 15000, personnel: 2, rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL },
];
/** The rules level a set of bays needs: the highest of their own levels (0 for the rulebook bays). */
export const getTransportBaysRulesLevel = (bays: { tag: string }[]): number =>
    bays.reduce((level, bay) => Math.max(level, findTransportBayType(bay.tag)?.rulesLevel ?? 0), 0);
export const findTransportBayType = (tag: string): ITransportBayType | undefined => transportBayTypes.find((type) => type.tag === tag);

/** Aerospace escape pods and lifeboats: 7 tons and 5,000 C-bills each, seven people (TM pp.216, 227; prices in the TM cost tables). */
export const ESCAPE_SYSTEM_TONS = 7;
export const ESCAPE_SYSTEM_COST = 5000;
export const ESCAPE_SYSTEM_CAPACITY = 7;

export const roundUpToHalfTon = (tons: number): number => Math.ceil(tons * 2 - 1e-9) / 2;

/** `round` is the half-ton rounding by default; Fractional Accounting passes a round up to the kilogram (TO:AUE p.188). */
export const getSmallCraftEngineWeight = (tonnage: number, safeThrust: number, techBase: "is" | "clan", round: (tons: number) => number = roundUpToHalfTon): number =>
    round(tonnage * safeThrust * SMALL_CRAFT_ENGINE_FACTOR[techBase]);

export const getSmallCraftStructureWeight = (tonnage: number, structuralIntegrity: number, shape: SmallCraftShape, round: (tons: number) => number = roundUpToHalfTon): number =>
    round(structuralIntegrity * tonnage / SMALL_CRAFT_SI_DIVISOR[shape]);

/**
 * Heat sinks that come free with the engine (Aerospace Unit Heat Sinks Table, TM p.193): engine tons / 60 on an
 * aerodyne Small Craft, the square root of engine tons x 1.6 on a spheroid, rounded down.
 */
export const getSmallCraftFreeHeatSinks = (engineTons: number, shape: SmallCraftShape): number =>
    Math.floor((shape === "aerodyne" ? engineTons / 60 : Math.sqrt(engineTons * 1.6)) + 1e-9);

/**
 * Extra fire control for an arc holding more than 12 weapons: the weapon count over 12, rounded down, times a
 * tenth of the arc's weapon tonnage, rounded up to the half ton (TM p.196).
 */
export const getSmallCraftFireControlWeight = (weaponCount: number, weaponTons: number, round: (tons: number) => number = roundUpToHalfTon): number =>
    weaponCount > SMALL_CRAFT_WEAPONS_PER_ARC ? round(Math.floor(weaponCount / SMALL_CRAFT_WEAPONS_PER_ARC) * 0.1 * weaponTons) : 0;

// DropShips (TechManual pp.180-197) build on the same steps; these are the values that differ from Small Craft.

/** A Small Craft or a DropShip: one class builds both. */
export type CraftType = "smallCraft" | "dropShip";

/** DropShips weigh 200 to 35,000 tons (aerodyne) or 100,000 (spheroid), in 100-ton steps (TM p.184). */
export const DROPSHIP_MIN_TONNAGE = 200;
export const DROPSHIP_MAX_TONNAGE: Record<SmallCraftShape, number> = { aerodyne: 35000, spheroid: 100000 };
export const DROPSHIP_TONNAGE_STEP = 100;

/** Fuel points a ton by DropShip weight (Aerospace Fuel Table, TM p.186): [lowest tonnage, points]. */
const DROPSHIP_FUEL_POINTS: [number, number][] = [
    [40000, 10], [20000, 20], [3000, 30], [1900, 40], [1200, 50], [800, 60], [400, 70], [0, 80],
];
export const getDropShipFuelPointsPerTon = (tonnage: number): number =>
    (DROPSHIP_FUEL_POINTS.find(([tons]) => tonnage >= tons) ?? [0, 80])[1];

/**
 * Tons of fuel a day at 1 G (Aerospace Fuel Table, TM p.186): 1.84 for a military DropShip of any weight; a
 * civilian one by its weight: [lowest tonnage, tons a day].
 */
const CIVILIAN_DROPSHIP_FUEL_PER_DAY: [number, number][] = [
    [70000, 8.83], [50000, 8.37], [40000, 7.71], [30000, 6.52], [20000, 5.19], [9000, 4.22], [4000, 3.37], [1000, 2.82], [0, 1.84],
];
export const getDropShipStrategicFuelPerDay = (tonnage: number, military: boolean): number =>
    military ? SMALL_CRAFT_STRATEGIC_FUEL_TONS_PER_DAY : (CIVILIAN_DROPSHIP_FUEL_PER_DAY.find(([tons]) => tonnage >= tons) ?? [0, 1.84])[1];

/** Controls: tonnage x 0.0075, rounded up to the whole ton for a DropShip (Aerospace Control Systems Table, TM p.189). */
export const getDropShipControlsWeight = (tonnage: number): number => Math.ceil(tonnage * SMALL_CRAFT_CONTROLS_FACTOR - 1e-9);

/** Base crew: 3 (civilian) or 4 (military), plus 1 for every 5,000 tons, rounded up (TM p.189). */
export const getDropShipBaseCrew = (tonnage: number, military: boolean): number =>
    (military ? 4 : 3) + Math.ceil(tonnage / 5000 - 1e-9);

/**
 * Free heat sinks, rounded down (Aerospace Unit Heat Sinks Table, TM p.193): a civilian DropShip as a Small Craft;
 * a military one engine tons / 20 (aerodyne) or the square root of engine tons x 6.8 (spheroid).
 */
export const getDropShipFreeHeatSinks = (engineTons: number, shape: SmallCraftShape, military: boolean): number =>
    military
        ? Math.floor((shape === "aerodyne" ? engineTons / 20 : Math.sqrt(engineTons * 6.8)) + 1e-9)
        : getSmallCraftFreeHeatSinks(engineTons, shape);

// Primitive Small Craft and DropShips (IO:AE pp.119-121): Inner Sphere craft built from 2100 to 2499.
export const PRIMITIVE_FIRST_YEAR = 2100;
export const PRIMITIVE_LAST_YEAR = 2499;
/** Armor, the free points too, is multiplied by this and rounded down (IO:AE pp.120-121). */
export const PRIMITIVE_ARMOR_FACTOR = 0.66;
/** Engine/Controls Weight Tables, by year of introduction: [last year, engine factor, fuel factor, controls factor]. */
const PRIMITIVE_FACTORS: Record<CraftType, [number, number, number, number][]> = {
    smallCraft: [[2150, 0.143, 2.2, 0.01575], [2200, 0.1235, 1.9, 0.01425], [2250, 0.1105, 1.7, 0.01275], [2299, 0.0975, 1.5, 0.01125], [2399, 0.091, 1.4, 0.00975], [2499, 0.078, 1.2, 0.00825]],
    dropShip: [[2150, 0.13, 2, 0.015], [2200, 0.117, 1.8, 0.0135], [2250, 0.104, 1.6, 0.012], [2299, 0.091, 1.4, 0.0105], [2350, 0.0845, 1.3, 0.00975], [2499, 0.0715, 1.1, 0.009]],
};
/** Engine weight = Base Movement Factor (tonnage x Safe Thrust) x engine; controls = tonnage x controls; fuel points a ton / fuel. */
export const getPrimitiveFactors = (craftType: CraftType, year: number): { engine: number; fuel: number; controls: number } => {
    const rows = PRIMITIVE_FACTORS[craftType];
    const [, engine, fuel, controls] = rows.find(([last]) => year <= last) ?? rows[rows.length - 1];
    return { engine, fuel, controls };
};
/** Primitive DropShip Maximum Weight Limit Table (IO:AE p.120): [last year, spheroid, aerodyne]. */
const PRIMITIVE_DROPSHIP_MAX_TONNAGE: [number, number, number][] = [
    [2129, 3000, 1000], [2149, 4000, 1500], [2164, 7000, 2500], [2174, 10000, 3500], [2199, 14000, 5000],
    [2249, 15000, 6000], [2299, 19000, 7000], [2349, 23000, 8000], [2424, 30000, 10000], [2499, 50000, 20000],
];
export const getPrimitiveDropShipMaxTonnage = (year: number, shape: SmallCraftShape): number => {
    const [, spheroid, aerodyne] = PRIMITIVE_DROPSHIP_MAX_TONNAGE.find(([last]) => year <= last) ?? PRIMITIVE_DROPSHIP_MAX_TONNAGE[PRIMITIVE_DROPSHIP_MAX_TONNAGE.length - 1];
    return shape === "spheroid" ? spheroid : aerodyne;
};
/** Primitive DropShip Heat Sinks Table (IO:AE p.121): engine tons / 75 (aerodyne) or the square root of engine tons x 1.3, rounded down. */
export const getPrimitiveDropShipFreeHeatSinks = (engineTons: number, shape: SmallCraftShape): number =>
    Math.floor((shape === "aerodyne" ? engineTons / 75 : Math.sqrt(engineTons * 1.3)) + 1e-9);
/** A Primitive DropShip over 5,000 tons cannot ride a Primitive JumpShip: it is interplanetary only (IO:AE p.120). */
export const PRIMITIVE_DROPSHIP_JUMP_TONNAGE = 5000;

/** Bay doors: 7 plus the weight / 50,000, rounded up (TM p.196). */
export const getDropShipMaxBayDoors = (tonnage: number): number => 7 + Math.ceil(tonnage / 50000 - 1e-9);

/** A DropShip's docking collar (TM p.284). */
export const DOCKING_COLLAR_COST = 10000;
/**
 * The K-F boom in a DropShip's docking collar (IO:AE p.113). A prototype boom (2458-2469) prices the collar at
 * 1,010,000 C-bills and adds +2 to the docking Control Roll; a DropShip with no boom cannot jump while docked.
 */
export type KFBoomType = "standard" | "prototype" | "none";
export const KF_BOOM_TYPES: { tag: KFBoomType; name: string; cost: number }[] = [
    { tag: "standard", name: "K-F Boom", cost: DOCKING_COLLAR_COST },
    { tag: "prototype", name: "Prototype K-F Boom", cost: 1010000 },
    { tag: "none", name: "No K-F Boom (pre-boom collar)", cost: DOCKING_COLLAR_COST },
];
/** Gunnery control systems, for each arc with weapons (Aerospace Units Structural Costs Table, TM p.284). */
export const GUNNERY_CONTROL_COST_PER_ARC = 10000;
/** Final cost multiplier (TM p.285). */
export const DROPSHIP_COST_MULTIPLIER: Record<SmallCraftShape, number> = { aerodyne: 36, spheroid: 28 };
