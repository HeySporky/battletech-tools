// Small Craft construction data (TechManual pp.180-197). The transport bay, quarters and escape system tables
// are the ones DropShips use as well.

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
    /** The tech base that fields this bay; absent for both. */
    tech?: "is" | "clan";
    /** Bay personnel, who need no quarters (TM p.239). */
    personnel?: number;
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
    { tag: "battle-armor-is", name: "Battle Armor Bay (4 troopers)", tonsEach: 8, capacity: "4 battle armor troopers", cost: 15000, costPerTon: true, infantry: true, tech: "is", personnel: 6 },
    { tag: "battle-armor-clan", name: "Battle Armor Bay (5 troopers)", tonsEach: 10, capacity: "5 battle armor troopers", cost: 15000, costPerTon: true, infantry: true, tech: "clan", personnel: 6 },
    { tag: "battle-armor-is-6", name: "Battle Armor Bay (6 troopers)", tonsEach: 12, capacity: "6 battle armor troopers", cost: 15000, costPerTon: true, infantry: true, tech: "is", personnel: 6 },
    { tag: "protomech", name: "ProtoMech Cubicles (5)", tonsEach: 50, capacity: "5 ProtoMechs", cost: 10000, tech: "clan", personnel: 6 },
    { tag: "vehicle-light", name: "Vehicle Cubicle, Light", tonsEach: 50, capacity: "1 vehicle of up to 50 tons", cost: 10000, personnel: 5 },
    { tag: "vehicle-heavy", name: "Vehicle Cubicle, Heavy", tonsEach: 100, capacity: "1 vehicle of up to 100 tons", cost: 10000, personnel: 8 },
    { tag: "mech", name: "'Mech Cubicle", tonsEach: 150, capacity: "1 BattleMech or IndustrialMech", cost: 20000, personnel: 2 },
    { tag: "fighter", name: "Fighter Cubicle", tonsEach: 150, capacity: "1 fighter of up to 100 tons", cost: 20000, personnel: 2 },
    { tag: "vehicle-superheavy", name: "Vehicle Cubicle, Superheavy", tonsEach: 200, capacity: "1 vehicle of up to 200 tons", cost: 20000, personnel: 15 },
    { tag: "small-craft", name: "Small Craft Cubicle", tonsEach: 200, capacity: "1 Small Craft of up to 200 tons", cost: 20000, personnel: 5 },
];
export const findTransportBayType = (tag: string): ITransportBayType | undefined => transportBayTypes.find((type) => type.tag === tag);

/** Aerospace escape pods and lifeboats: 7 tons and 5,000 C-bills each, seven people (TM pp.216, 227; prices in the TM cost tables). */
export const ESCAPE_SYSTEM_TONS = 7;
export const ESCAPE_SYSTEM_COST = 5000;
export const ESCAPE_SYSTEM_CAPACITY = 7;

export const roundUpToHalfTon = (tons: number): number => Math.ceil(tons * 2 - 1e-9) / 2;

export const getSmallCraftEngineWeight = (tonnage: number, safeThrust: number, techBase: "is" | "clan"): number =>
    roundUpToHalfTon(tonnage * safeThrust * SMALL_CRAFT_ENGINE_FACTOR[techBase]);

export const getSmallCraftStructureWeight = (tonnage: number, structuralIntegrity: number, shape: SmallCraftShape): number =>
    roundUpToHalfTon(structuralIntegrity * tonnage / SMALL_CRAFT_SI_DIVISOR[shape]);

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
export const getSmallCraftFireControlWeight = (weaponCount: number, weaponTons: number): number =>
    weaponCount > SMALL_CRAFT_WEAPONS_PER_ARC ? roundUpToHalfTon(Math.floor(weaponCount / SMALL_CRAFT_WEAPONS_PER_ARC) * 0.1 * weaponTons) : 0;
