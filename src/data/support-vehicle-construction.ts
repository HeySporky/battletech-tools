// Support Vehicle construction data (TechManual pp.116-139, with TechManual errata v8.0, 2024): ground, VTOL and
// naval Support Vehicles, and the advanced Rail and Large Naval Support Vehicles of Tactical Operations: Advanced
// Units & Equipment (pp.52-71). Airship, Fixed-Wing and Satellite Support Vehicles share these tables but use
// aerospace rules: the fighter builder makes them (aerospace-fighter.ts).

export type SupportVehicleTechRating = "a" | "b" | "c" | "d" | "e" | "f";
export const SUPPORT_VEHICLE_TECH_RATINGS: SupportVehicleTechRating[] = ["a", "b", "c", "d", "e", "f"];

export type SupportVehicleSize = "small" | "medium" | "large";
/** The Support Vehicle motive types built here; the hydrofoil and submarine motive types are naval ones. */
export type SupportVehicleMotive = "wheeled" | "tracked" | "hover" | "vtol" | "wige" | "naval" | "rail" | "fixed-wing" | "airship" | "satellite";
/** The Support Vehicles that fly by aerospace rules (TM p.119; TO:AUE p.55). */
export type SupportAircraftMotive = Extract<SupportVehicleMotive, "fixed-wing" | "airship" | "satellite">;
export const SUPPORT_AIRCRAFT_MOTIVES: { tag: SupportAircraftMotive; name: string }[] = [
    { tag: "fixed-wing", name: "Fixed-Wing Support Vehicle" },
    { tag: "airship", name: "Airship Support Vehicle" },
    { tag: "satellite", name: "Satellite Support Vehicle" },
];

/** Small Support Vehicles weigh 100 to 4,999 kg and are built to the kilogram (TM p.120). */
export const SUPPORT_VEHICLE_MIN_TONNAGE = 0.1;
export const SUPPORT_VEHICLE_SMALL_LIMIT = 5;

/** The Vehicle motive type tags that are Support Vehicle motive types, and the motive each one is built as. */
export const SUPPORT_VEHICLE_MOTIVES: Record<string, SupportVehicleMotive> = {
    wheeled: "wheeled",
    tracked: "tracked",
    hover: "hover",
    vtol: "vtol",
    wige: "wige",
    "naval-surface": "naval",
    hydrofoil: "naval",
    "naval-sub": "naval",
    rail: "rail",
};

export interface ISupportVehicleWeightClass {
    motive: SupportVehicleMotive;
    size: SupportVehicleSize;
    maxTons: number;
    minTechRating: SupportVehicleTechRating;
    /** Availability by era, the table's "Base Availability Rating". */
    availability: string;
    baseChassisValue: number;
    baseEngineValue: number;
    /** An advanced Support Vehicle (TO:AUE pp.52-71): Advanced rules, its own armor, crew and cost tables. */
    advanced?: boolean;
}

/**
 * Master Support Vehicle Weight Table (TM p.120, the 6th printing's corrected Minimum Tech/Base Availability
 * column), with the Rail and Large Naval rows of the Advanced Support Vehicle Weight Table (TO:AUE p.57). A
 * hydrofoil tops out at 100 tons (TM p.118).
 */
export const SUPPORT_VEHICLE_WEIGHT_CLASSES: ISupportVehicleWeightClass[] = [
    { motive: "hover", size: "small", maxTons: 4.999, minTechRating: "c", availability: "A-B-A", baseChassisValue: 0.20, baseEngineValue: 0.0025 },
    { motive: "hover", size: "medium", maxTons: 50, minTechRating: "c", availability: "A-B-A", baseChassisValue: 0.25, baseEngineValue: 0.004 },
    { motive: "hover", size: "large", maxTons: 100, minTechRating: "c", availability: "B-C-B", baseChassisValue: 0.30, baseEngineValue: 0.008 },
    { motive: "naval", size: "small", maxTons: 4.999, minTechRating: "a", availability: "C-D-C", baseChassisValue: 0.12, baseEngineValue: 0.004 },
    { motive: "naval", size: "medium", maxTons: 300, minTechRating: "a", availability: "C-D-C", baseChassisValue: 0.15, baseEngineValue: 0.007 },
    { motive: "naval", size: "large", maxTons: 100000, minTechRating: "b", availability: "C-E-D", baseChassisValue: 0.17, baseEngineValue: 0.009, advanced: true },
    { motive: "rail", size: "small", maxTons: 4.999, minTechRating: "a", availability: "C-C-C", baseChassisValue: 0.15, baseEngineValue: 0.003, advanced: true },
    { motive: "rail", size: "medium", maxTons: 300, minTechRating: "a", availability: "C-C-C", baseChassisValue: 0.20, baseEngineValue: 0.004, advanced: true },
    { motive: "rail", size: "large", maxTons: 600, minTechRating: "a", availability: "C-D-D", baseChassisValue: 0.30, baseEngineValue: 0.005, advanced: true },
    { motive: "airship", size: "small", maxTons: 4.999, minTechRating: "a", availability: "C-D-C", baseChassisValue: 0.20, baseEngineValue: 0.004 },
    { motive: "airship", size: "medium", maxTons: 300, minTechRating: "b", availability: "D-E-D", baseChassisValue: 0.25, baseEngineValue: 0.008 },
    { motive: "airship", size: "large", maxTons: 1000, minTechRating: "c", availability: "D-E-D", baseChassisValue: 0.30, baseEngineValue: 0.012, advanced: true },
    { motive: "fixed-wing", size: "small", maxTons: 4.999, minTechRating: "b", availability: "C-D-C", baseChassisValue: 0.08, baseEngineValue: 0.005 },
    { motive: "fixed-wing", size: "medium", maxTons: 100, minTechRating: "b", availability: "C-D-C", baseChassisValue: 0.10, baseEngineValue: 0.010 },
    { motive: "fixed-wing", size: "large", maxTons: 200, minTechRating: "b", availability: "D-E-D", baseChassisValue: 0.15, baseEngineValue: 0.015 },
    // A Satellite's engine weight is fixed: its Base Engine Value of 0.10 always meets a Movement Factor of 1 (TO:AUE p.57).
    { motive: "satellite", size: "small", maxTons: 4.999, minTechRating: "c", availability: "C-D-C", baseChassisValue: 0.08, baseEngineValue: 0.10, advanced: true },
    { motive: "satellite", size: "medium", maxTons: 100, minTechRating: "c", availability: "C-D-D", baseChassisValue: 0.12, baseEngineValue: 0.10, advanced: true },
    { motive: "satellite", size: "large", maxTons: 300, minTechRating: "c", availability: "D-E-D", baseChassisValue: 0.16, baseEngineValue: 0.10, advanced: true },
    { motive: "tracked", size: "small", maxTons: 4.999, minTechRating: "b", availability: "B-C-B", baseChassisValue: 0.13, baseEngineValue: 0.006 },
    { motive: "tracked", size: "medium", maxTons: 100, minTechRating: "b", availability: "B-C-B", baseChassisValue: 0.15, baseEngineValue: 0.013 },
    { motive: "tracked", size: "large", maxTons: 200, minTechRating: "b", availability: "C-D-C", baseChassisValue: 0.25, baseEngineValue: 0.025 },
    { motive: "vtol", size: "small", maxTons: 4.999, minTechRating: "c", availability: "C-D-C", baseChassisValue: 0.20, baseEngineValue: 0.002 },
    { motive: "vtol", size: "medium", maxTons: 30, minTechRating: "c", availability: "C-D-C", baseChassisValue: 0.25, baseEngineValue: 0.0025 },
    { motive: "vtol", size: "large", maxTons: 60, minTechRating: "c", availability: "D-E-D", baseChassisValue: 0.30, baseEngineValue: 0.004 },
    { motive: "wheeled", size: "small", maxTons: 4.999, minTechRating: "a", availability: "A-A-A", baseChassisValue: 0.12, baseEngineValue: 0.0025 },
    { motive: "wheeled", size: "medium", maxTons: 80, minTechRating: "a", availability: "A-B-A", baseChassisValue: 0.15, baseEngineValue: 0.0075 },
    { motive: "wheeled", size: "large", maxTons: 160, minTechRating: "a", availability: "B-C-B", baseChassisValue: 0.18, baseEngineValue: 0.015 },
    { motive: "wige", size: "small", maxTons: 4.999, minTechRating: "c", availability: "B-C-B", baseChassisValue: 0.12, baseEngineValue: 0.003 },
    { motive: "wige", size: "medium", maxTons: 80, minTechRating: "c", availability: "B-C-B", baseChassisValue: 0.15, baseEngineValue: 0.005 },
    { motive: "wige", size: "large", maxTons: 240, minTechRating: "c", availability: "C-D-C", baseChassisValue: 0.17, baseEngineValue: 0.006 },
];

/** The size class a Support Vehicle of this motive and weight falls in, or null when it is too heavy. */
export function getSupportVehicleWeightClass(motive: SupportVehicleMotive, tons: number): ISupportVehicleWeightClass | null {
    return SUPPORT_VEHICLE_WEIGHT_CLASSES.find((row) => row.motive === motive && tons <= row.maxTons) ?? null;
}

/** Item slots: 5 + tonnage / 10, rounded down (TM p.120); over 300 tons, 35 + tonnage / 100 (TO:AUE p.56). */
export function getSupportVehicleItemSlots(tons: number): number {
    return tons > 300 ? 35 + Math.floor(tons / 100) : 5 + Math.floor(tons / 10);
}

/** Support Vehicle Structure Table: Tech Rating multipliers (TM p.122). */
export const SUPPORT_VEHICLE_TECH_RATING_MULTIPLIER: Record<SupportVehicleTechRating, number> = {
    a: 1.6, b: 1.3, c: 1.15, d: 1.0, e: 0.85, f: 0.66,
};

/** Final structural cost multiplier by Structural Tech Rating (Support Vehicle Structural Costs, TM p.280). */
export const SUPPORT_VEHICLE_COST_TECH_MULTIPLIER: Record<SupportVehicleTechRating, number> = {
    a: 0.5, b: 0.75, c: 1.0, d: 1.25, e: 1.5, f: 2.0,
};

export interface ISupportVehicleChassisModification {
    tag: string;
    name: string;
    minTechRating: SupportVehicleTechRating;
    /** Multiplies the structure weight (Chassis Modifications Table, TM p.122). */
    multiplier: number;
    /** Multiplies the chassis cost (TM p.280). */
    costMultiplier: number;
    availability: string;
    /** Motive types that may take it; every motive when absent. */
    motives?: SupportVehicleMotive[];
    /** Small Support Vehicles only. */
    smallOnly?: boolean;
    /** Naval Support Vehicles of up to this weight only. */
    maxTons?: number;
    /** Modifications it may not be combined with. */
    excludes?: string[];
    /** What it does, from the Chassis Modification Descriptions (TM p.123). */
    description: string;
}

/**
 * Chassis Modifications Table (TM p.122; errata v8.0 sets Environmental Sealing's minimum Tech Rating to B) and
 * the chassis cost multipliers and availability (TM p.280), with the Advanced Support Vehicle Chassis
 * Modifications Table (TO:AUE p.59): Rail units may take the Amphibious, Tractor and Trailer modifications and
 * the External Power Pickup. TO:AUE prints Environmental Sealing at C; the newer TechManual errata's B is used.
 * Prop, STOL and VSTOL are for Fixed-Wing Support Vehicles; Airships may not take the Armored modification.
 */
export const SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS: ISupportVehicleChassisModification[] = [
    { tag: "amphibious", name: "Amphibious", minTechRating: "c", multiplier: 1.75, costMultiplier: 1.25, availability: "C-D-C", motives: ["wheeled", "tracked", "vtol", "wige", "rail", "fixed-wing", "airship"], excludes: ["dune-buggy", "snowmobile"], description: "May cross or land on water of any depth, afloat on the surface." },
    { tag: "armored", name: "Armored", minTechRating: "a", multiplier: 1.5, costMultiplier: 2.0, availability: "C-E-D", motives: ["wheeled", "tracked", "hover", "vtol", "wige", "naval", "rail", "fixed-wing", "satellite"], excludes: ["ultra-light"], description: "May mount the heavier armor marked with an asterisk on the Support Vehicle Armor Table." },
    { tag: "bicycle", name: "Bicycle", minTechRating: "a", multiplier: 0.75, costMultiplier: 0.75, availability: "A-A-A", motives: ["wheeled", "hover"], smallOnly: true, excludes: ["monocycle"], description: "May enter Light Woods even where the motive type otherwise cannot." },
    { tag: "convertible", name: "Convertible", minTechRating: "a", multiplier: 1.1, costMultiplier: 1.1, availability: "A-A-A", motives: ["wheeled", "tracked", "hover"], description: "May not mount a turret. A hit in the Turret location while the top is open is a Crew Killed result." },
    { tag: "dune-buggy", name: "Dune Buggy", minTechRating: "b", multiplier: 1.5, costMultiplier: 1.25, availability: "C-D-C", motives: ["wheeled"], excludes: ["snowmobile", "amphibious", "off-road"], description: "Moves normally only on Sand; elsewhere -1 Cruising MP and no Flank MP." },
    { tag: "environmental-sealing", name: "Environmental Sealing", minTechRating: "b", multiplier: 2, costMultiplier: 1.75, availability: "B-D-C", description: "Fission-, fusion- and electric-engined units operate normally in vacuum or underwater unless breached." },
    { tag: "external-power-pickup", name: "External Power Pickup", minTechRating: "b", multiplier: 1.1, costMultiplier: 1.1, availability: "C-C-C", motives: ["rail"], description: "Draws electricity through the rails in place of an on-board engine; not with a MagLev engine (TO:AUE p.59)." },
    { tag: "hydrofoil", name: "Hydrofoil", minTechRating: "b", multiplier: 1.7, costMultiplier: 1.1, availability: "C-D-C", motives: ["naval"], maxTons: 100, description: "Operates as a hydrofoil: base Cruising MP x 1.25, rounded normally." },
    { tag: "monocycle", name: "Monocycle", minTechRating: "b", multiplier: 0.5, costMultiplier: 1.3, availability: "D-D-D", motives: ["wheeled", "hover"], smallOnly: true, excludes: ["bicycle"], description: "May enter Light Woods even where the motive type otherwise cannot." },
    { tag: "off-road", name: "Off-Road", minTechRating: "b", multiplier: 1.5, costMultiplier: 1.2, availability: "B-C-B", motives: ["wheeled"], excludes: ["dune-buggy", "snowmobile"], description: "Operates normally on and off Paved terrain; still immobile in prohibited terrain." },
    { tag: "omni", name: "Omni", minTechRating: "e", multiplier: 1, costMultiplier: 1.0, availability: "X-X-E", description: "May be built as an OmniVehicle (but not use the Mechanized Infantry rules)." },
    { tag: "prop", name: "Prop", minTechRating: "b", multiplier: 1.2, costMultiplier: 0.75, availability: "B-C-B", motives: ["fixed-wing"], description: "Propeller-driven: may use electric engines; no higher than atmospheric row 1, 1 hex a turn on the high-altitude map, out of control at Velocity 8+." },
    { tag: "snowmobile", name: "Snowmobile", minTechRating: "b", multiplier: 1.75, costMultiplier: 1.3, availability: "D-E-D", motives: ["wheeled", "tracked"], excludes: ["dune-buggy", "amphibious", "off-road"], description: "Moves normally only on Snow or Ice; elsewhere -1 Cruising MP and no Flank MP." },
    { tag: "stol", name: "STOL", minTechRating: "c", multiplier: 1.5, costMultiplier: 1.5, availability: "B-C-B", motives: ["fixed-wing"], description: "Lands and takes off in 300 meters (10 hexes) of runway." },
    { tag: "submersible", name: "Submersible", minTechRating: "b", multiplier: 1.8, costMultiplier: 3.5, availability: "C-D-C", motives: ["naval"], description: "May operate as a submarine." },
    { tag: "tractor", name: "Tractor", minTechRating: "a", multiplier: 1.2, costMultiplier: 1.1, availability: "A-A-A", motives: ["wheeled", "tracked", "naval", "rail"], description: "May tow other units: ground units up to its own mass, naval and rail units up to 5 times it." },
    { tag: "trailer", name: "Trailer", minTechRating: "a", multiplier: 0.8, costMultiplier: 0.75, availability: "A-A-A", motives: ["wheeled", "tracked", "rail"], description: "Needs no engine; moves when towed by a Tractor." },
    { tag: "vstol", name: "VSTOL", minTechRating: "c", multiplier: 2, costMultiplier: 2.0, availability: "C-D-C", motives: ["fixed-wing"], description: "Operates as STOL, or takes off and lands vertically." },
    { tag: "ultra-light", name: "Ultra-Light", minTechRating: "d", multiplier: 0.5, costMultiplier: 1.5, availability: "C-E-D", smallOnly: true, excludes: ["armored"], description: "May not mount armor better than BAR 5." },
];

export function getSupportVehicleChassisModification(tag: string): ISupportVehicleChassisModification | undefined {
    return SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.find((mod) => mod.tag === tag);
}

/** The chassis modification a Vehicle motive type implies: hydrofoils and submarines are naval Support Vehicles with one. */
export const SUPPORT_VEHICLE_MOTIVE_MODIFICATION: Record<string, string> = { hydrofoil: "hydrofoil", "naval-sub": "submersible" };

export type SupportVehicleEngineTag = "steam" | "ice" | "external" | "battery" | "fuel-cell" | "solar" | "maglev" | "fission" | "fusion" | "none";

export interface ISupportVehicleEngine {
    tag: SupportVehicleEngineTag;
    name: string;
    /** Engine Weight Multiplier by Tech Rating; null where the engine cannot be made (TM p.127). */
    multiplier: Record<SupportVehicleTechRating, number | null>;
    /** Fuel weight, as a percentage of the engine's weight, per 100 km of range; null for engines that need no fuel. */
    fuelPercentPer100Km: number | null;
    /** Multiplies the engine cost (TM p.280). */
    costMultiplier: number;
    techRating: SupportVehicleTechRating;
    availability: string;
    /** Motive types that may not use it (Base Support Vehicle Engine Compatibilities Table, TM p.127; TO:AUE p.62). */
    incompatible: SupportVehicleMotive[];
    /** The chassis modification it needs: an External engine draws power through the External Power Pickup (TO:AUE p.62). */
    requiresModification?: string;
}

/**
 * Support Vehicle Engine Weight Multipliers and Fuel Weight Percentage Table (TM p.127, with errata v8.0: Steam
 * at E is 2.6 and ICE at B is 3.0) and the engine costs (TM p.280). External and MagLev engines are for Rail
 * Support Vehicles (TO:AUE pp.62, 229; TO:AUE still prints Steam at E as 2.8, and the newer TechManual errata is
 * used). External, battery, fuel cell and solar are electric. "None" is a Trailer's: it needs no engine (TM
 * p.126).
 */
export const SUPPORT_VEHICLE_ENGINES: ISupportVehicleEngine[] = [
    { tag: "steam", name: "Steam", multiplier: { a: 4.0, b: 3.5, c: 3.0, d: 2.8, e: 2.6, f: 2.5 }, fuelPercentPer100Km: 3, costMultiplier: 0.8, techRating: "a", availability: "A-A-A", incompatible: ["hover", "vtol", "wige", "fixed-wing", "satellite"] },
    { tag: "ice", name: "Internal Combustion (ICE)", multiplier: { a: null, b: 3.0, c: 2.0, d: 1.5, e: 1.3, f: 1.0 }, fuelPercentPer100Km: 1, costMultiplier: 1.0, techRating: "b", availability: "A-A-A", incompatible: ["satellite"] },
    { tag: "external", name: "Electric (External)", multiplier: { a: null, b: 1.4, c: 1.0, d: 0.8, e: 0.7, f: 0.6 }, fuelPercentPer100Km: null, costMultiplier: 1.0, techRating: "b", availability: "C-C-C", incompatible: ["wheeled", "tracked", "hover", "vtol", "wige", "naval", "fixed-wing", "airship", "satellite"], requiresModification: "external-power-pickup" },
    { tag: "battery", name: "Electric (Battery)", multiplier: { a: null, b: null, c: 1.5, d: 1.2, e: 1.0, f: 0.8 }, fuelPercentPer100Km: 5, costMultiplier: 1.2, techRating: "c", availability: "A-B-A", incompatible: [] },
    { tag: "fuel-cell", name: "Electric (Fuel Cell)", multiplier: { a: null, b: null, c: 1.2, d: 1.0, e: 0.9, f: 0.7 }, fuelPercentPer100Km: 1.5, costMultiplier: 1.4, techRating: "c", availability: "B-C-C", incompatible: [] },
    { tag: "solar", name: "Electric (Solar)", multiplier: { a: null, b: null, c: 5.0, d: 4.5, e: 4.0, f: 3.5 }, fuelPercentPer100Km: null, costMultiplier: 1.6, techRating: "c", availability: "C-D-C", incompatible: ["hover", "vtol"] },
    { tag: "maglev", name: "MagLev", multiplier: { a: null, b: null, c: 0.8, d: 0.7, e: 0.6, f: 0.5 }, fuelPercentPer100Km: null, costMultiplier: 2.5, techRating: "c", availability: "D-F-E", incompatible: ["wheeled", "tracked", "hover", "vtol", "wige", "naval", "fixed-wing", "airship", "satellite"] },
    { tag: "fission", name: "Fission", multiplier: { a: null, b: null, c: 1.75, d: 1.5, e: 1.4, f: 1.3 }, fuelPercentPer100Km: null, costMultiplier: 3.0, techRating: "c", availability: "E-E-D", incompatible: [] },
    { tag: "fusion", name: "Fusion", multiplier: { a: null, b: null, c: 1.5, d: 1.0, e: 0.75, f: 0.5 }, fuelPercentPer100Km: null, costMultiplier: 2.0, techRating: "c", availability: "C-E-D", incompatible: [] },
    { tag: "none", name: "None (Trailer)", multiplier: { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 }, fuelPercentPer100Km: null, costMultiplier: 0, techRating: "a", availability: "A-A-A", incompatible: ["fixed-wing", "airship", "satellite"] },
];

export function getSupportVehicleEngine(tag: string): ISupportVehicleEngine | undefined {
    return SUPPORT_VEHICLE_ENGINES.find((engine) => engine.tag === tag);
}

/** ICEs running on alcohol or natural gas need 1.25 percent of the engine's weight per 100 km (TM p.127). */
export const SUPPORT_VEHICLE_ALTERNATIVE_FUEL_PERCENT = 1.25;

/**
 * Rounds a Support Vehicle component's weight, in tons: up to the kilogram for a Small Support Vehicle, up to the
 * half ton from 5 tons (TM p.123, "rounded up" per errata v8.0). The small allowance stops floating-point noise
 * from pushing an exact result up a step.
 */
export function roundSupportVehicleWeight(tons: number, small: boolean): number {
    const epsilon = 1e-9;
    if (small) return Math.ceil(tons * 1000 - epsilon) / 1000;
    return Math.ceil(tons * 2 - epsilon) / 2;
}

/** Structure Weight = Base Chassis Value x Tech Rating Multiplier x each modification's multiplier x weight (TM p.122). */
export function getSupportVehicleStructureWeight(weightClass: ISupportVehicleWeightClass, techRating: SupportVehicleTechRating, modifications: string[], tons: number): number {
    const modifier = modifications.reduce((product, tag) => product * (getSupportVehicleChassisModification(tag)?.multiplier ?? 1), 1);
    return roundSupportVehicleWeight(weightClass.baseChassisValue * SUPPORT_VEHICLE_TECH_RATING_MULTIPLIER[techRating] * modifier * tons, weightClass.size === "small");
}

/**
 * Movement Factor = 4 + Cruising MP (or Safe Thrust) squared (Support Vehicle Base Movement Formulae, TM p.127); a
 * Rail Support Vehicle's is 4 + (Cruising MP - 2) squared, a Satellite's 1 (TO:AUE p.62).
 */
export function getSupportVehicleMovementFactor(cruiseMP: number, motive?: SupportVehicleMotive): number {
    if (motive === "satellite") return 1;
    const mp = motive === "rail" ? cruiseMP - 2 : cruiseMP;
    return 4 + mp * mp;
}

/**
 * Engine Weight = Base Engine Value x Movement Factor x Engine Weight Multiplier x weight, then raised to the
 * minimum: 5 tons for fission and Tech Rating C fusion, 0.25 tons for D+ fusion, 20 percent of a hovercraft's
 * weight (TM p.126, errata v8.0). Null when the engine cannot be made at that Tech Rating.
 */
export function getSupportVehicleEngineWeight(weightClass: ISupportVehicleWeightClass, engine: ISupportVehicleEngine, techRating: SupportVehicleTechRating, cruiseMP: number, tons: number): number | null {
    const multiplier = engine.multiplier[techRating];
    if (multiplier === null) return null;
    if (engine.tag === "none") return 0;
    const small = weightClass.size === "small";
    let weight = roundSupportVehicleWeight(weightClass.baseEngineValue * getSupportVehicleMovementFactor(cruiseMP, weightClass.motive) * multiplier * tons, small);
    if (engine.tag === "fission" || (engine.tag === "fusion" && techRating === "c")) weight = Math.max(weight, 5);
    else if (engine.tag === "fusion") weight = Math.max(weight, 0.25);
    if (weightClass.motive === "hover") weight = Math.max(weight, roundSupportVehicleWeight(tons * 0.2, small));
    return weight;
}

/** Operating range in kilometers for this much fuel, rounded down (TM p.128); null for an engine without fuel. */
export function getSupportVehicleRangeKm(engine: ISupportVehicleEngine, engineTons: number, fuelTons: number, alternativeFuel: boolean): number | null {
    const percent = engine.tag === "ice" && alternativeFuel ? SUPPORT_VEHICLE_ALTERNATIVE_FUEL_PERCENT : engine.fuelPercentPer100Km;
    if (percent === null || engineTons <= 0) return null;
    // Work in kilograms so the percentages divide exactly (Simca: 42 kg / 497 kg = 8.45 percent = 845 km).
    const share = (Math.round(fuelTons * 1000) * 100) / Math.round(engineTons * 1000);
    return Math.floor(share / percent * 100 + 1e-9);
}

/**
 * Total Max Armor Factor = 4 + this x tonnage, rounded down (Support Vehicle Armor Table, TM p.134, errata v8.0;
 * Rail, TO:AUE p.69).
 */
export const SUPPORT_VEHICLE_ARMOR_PER_TON: Record<SupportVehicleMotive, number> = {
    naval: 0.334, wige: 0.5, hover: 1, vtol: 1, tracked: 2, wheeled: 2, rail: 0.5, airship: 0.334, "fixed-wing": 1, satellite: 0.5,
};

/** A Large Naval Vessel's or Large Airship's maximum armor is 89 + 0.05 x tonnage, rounded down (TO:AUE p.69). */
export function getSupportVehicleMaxArmor(motive: SupportVehicleMotive, tons: number): number {
    if ((motive === "naval" || motive === "airship") && tons > 300) return Math.floor(89 + 0.05 * tons + 1e-9);
    return Math.floor(4 + SUPPORT_VEHICLE_ARMOR_PER_TON[motive] * tons + 1e-9);
}

/** Internal structure per location: tonnage / 10, rounded up; a Large Naval Vessel's is 30 + tonnage / 2,000 (TM p.123; TO:AUE p.60). */
export function getSupportVehicleStructurePoints(motive: SupportVehicleMotive, tons: number): number {
    if (motive === "naval" && tons > 300) return 30 + Math.ceil(tons / 2000 - 1e-9);
    return Math.ceil(tons / 10 - 1e-9);
}

export interface ILargeVesselTemplate {
    template: "A" | "B" | "C" | "D" | "E";
    /** Hexes of length: also the most turrets a Large Naval Vessel may mount (TO:AUE p.60). */
    hexes: number;
    maxAirshipTons: number;
    maxNavalTons: number;
    levelsAbove: number;
    levelsBelow: number;
    /** Added to attacks against the vessel, or a grounded airship (TO:AUE pp.25, 32). */
    attackerToHit: number;
    /** Depths a sinking vessel goes down each turn (TO:AUE p.27). */
    sinkingDepthsPerTurn: number;
}

/** Airship and Large Vessel Template Table (TO:AUE p.57) and Large Naval Vessel Sinking Rate Table (p.27). */
export const LARGE_VESSEL_TEMPLATES: ILargeVesselTemplate[] = [
    { template: "A", hexes: 1, maxAirshipTons: 500, maxNavalTons: 500, levelsAbove: 0, levelsBelow: 1, attackerToHit: 0, sinkingDepthsPerTurn: 5 },
    { template: "B", hexes: 3, maxAirshipTons: 600, maxNavalTons: 6000, levelsAbove: 1, levelsBelow: 1, attackerToHit: -1, sinkingDepthsPerTurn: 4 },
    { template: "C", hexes: 5, maxAirshipTons: 750, maxNavalTons: 12000, levelsAbove: 1, levelsBelow: 2, attackerToHit: -2, sinkingDepthsPerTurn: 3 },
    { template: "D", hexes: 7, maxAirshipTons: 900, maxNavalTons: 30000, levelsAbove: 2, levelsBelow: 2, attackerToHit: -3, sinkingDepthsPerTurn: 2 },
    { template: "E", hexes: 9, maxAirshipTons: 1000, maxNavalTons: 100000, levelsAbove: 3, levelsBelow: 3, attackerToHit: -4, sinkingDepthsPerTurn: 1 },
];

export function getLargeVesselTemplate(kind: "airship" | "naval", tons: number): ILargeVesselTemplate {
    return LARGE_VESSEL_TEMPLATES.find((row) => tons <= (kind === "airship" ? row.maxAirshipTons : row.maxNavalTons)) ?? LARGE_VESSEL_TEMPLATES[LARGE_VESSEL_TEMPLATES.length - 1];
}

/** Chassis modifications that require at least 1 armor point in every location (TM p.134). */
export const SUPPORT_VEHICLE_ARMOR_REQUIRED_MODIFICATIONS = ["armored", "amphibious", "environmental-sealing", "submersible"];

/** The best BAR an Ultra-Light chassis may mount (TM p.123). */
export const ULTRA_LIGHT_MAX_BAR = 5;

/**
 * Base crew minimum (Support Vehicle Minimum Crew Table, TM p.131): Medium airships and naval vessels 4; a Large Naval
 * Vessel needs 3 + 1 per 5,000 tons and a Large Airship 3 + 1 per 500, rounded up (TO:AUE p.66). A Trailer without an
 * engine and an unmanned Satellite need none.
 */
export function getSupportVehicleBaseCrew(motive: SupportVehicleMotive, size: SupportVehicleSize, engineless: boolean, tons: number = 0): number {
    if (engineless) return 0;
    if (size === "small") return 1;
    if (motive === "naval" && size === "large") return 3 + Math.ceil(tons / 5000 - 1e-9);
    if (motive === "airship" && size === "large") return 3 + Math.ceil(tons / 500 - 1e-9);
    if (size === "large") return 3;
    return motive === "naval" || motive === "airship" ? 4 : 2;
}

export type SupportVehicleFireControl = "none" | "basic" | "advanced";

export const SUPPORT_VEHICLE_FIRE_CONTROL: Record<SupportVehicleFireControl, {
    name: string;
    /** Share of the heavy and medium weapons' weight (TM p.217). */
    weightFactor: number;
    /** Share of the weapons' cost (TM p.293). */
    costFactor: number;
    /** To-hit modifier for the Support Vehicle's weapons (TM p.131). */
    toHit: number;
    /** Offensive BV Adjustment Table (TM p.316). */
    bvMultiplier: number;
    /** Tons of weapons a gunner handles on a Medium or Large Support Vehicle (TM p.131). */
    tonsPerGunner: number;
}> = {
    none: { name: "None", weightFactor: 0, costFactor: 0, toHit: 2, bvMultiplier: 0.8, tonsPerGunner: 2 },
    basic: { name: "Basic Fire Control", weightFactor: 0.05, costFactor: 0.05, toHit: 1, bvMultiplier: 0.9, tonsPerGunner: 3 },
    advanced: { name: "Advanced Fire Control", weightFactor: 0.1, costFactor: 0.1, toHit: 0, bvMultiplier: 1.0, tonsPerGunner: 4 },
};

/**
 * Gunners for a Medium or Large Support Vehicle: total weapon tonnage divided by the fire control's tons per
 * gunner, rounded up; with advanced fire control a Tech E chassis divides by 5 and a Tech F chassis by 6 (TM p.131).
 */
export function getSupportVehicleGunners(fireControl: SupportVehicleFireControl, structuralTechRating: SupportVehicleTechRating, weaponTons: number): number {
    if (weaponTons <= 0) return 0;
    let tonsPerGunner = SUPPORT_VEHICLE_FIRE_CONTROL[fireControl].tonsPerGunner;
    if (fireControl === "advanced" && structuralTechRating === "e") tonsPerGunner = 5;
    if (fireControl === "advanced" && structuralTechRating === "f") tonsPerGunner = 6;
    return Math.ceil(weaponTons / tonsPerGunner - 1e-9);
}

/** Officers: none for up to 3 non-officer crew, otherwise one per 6, rounded up (TM p.131). */
export function getSupportVehicleOfficers(nonOfficerCrew: number): number {
    return nonOfficerCrew <= 3 ? 0 : Math.ceil(nonOfficerCrew / 6);
}

/** Chassis, engine and armor costs (Support Vehicle Structural Costs and Availability, TM p.280). */
export const SUPPORT_VEHICLE_CHASSIS_COST_PER_TON = 2500;
export const SUPPORT_VEHICLE_ENGINE_COST_PER_TON = 5000;
export const SUPPORT_VEHICLE_HEAT_SINK_COST = 2000;
export const SUPPORT_VEHICLE_TURRET_COST_PER_TON = 5000;
export const SUPPORT_VEHICLE_POWER_AMPLIFIER_COST_PER_TON = 20000;

/**
 * Final Unit Cost Formulas Table: (structure + equipment) x (1 + tonnage / this) (TM p.285); Rail 250 (TO:AUE
 * p.229). A Large Naval Vessel's is 100,000, the same as the TechManual's naval figure.
 */
export const SUPPORT_VEHICLE_COST_TONNAGE_DIVISOR: Record<SupportVehicleMotive, number> = {
    tracked: 100, wheeled: 200, hover: 50, vtol: 30, naval: 100000, wige: 25, rail: 250, airship: 10000, "fixed-wing": 50, satellite: 75,
};

/**
 * Kilograms per Fuel Point for an Airship or Fixed-Wing Support Vehicle, by size class and the engine's Tech Rating
 * (Airship/Fixed Wing Support Vehicle Fuel Table, TM p.128); Large Airships have their own row (TO:AUE p.63).
 */
export const SUPPORT_AIRCRAFT_FUEL_KG_PER_POINT: Record<"small" | "medium" | "large" | "largeAirship", Record<SupportVehicleTechRating, number>> = {
    small: { a: 50, b: 30, c: 23, d: 15, e: 13, f: 10 },
    medium: { a: 63, b: 38, c: 25, d: 20, e: 18, f: 15 },
    large: { a: 83, b: 50, c: 35, d: 28, e: 23, f: 20 },
    largeAirship: { a: 63, b: 38, c: 27, d: 21, e: 18, f: 15 },
};

/** A Satellite's station-keeping fuel, tons a burn day: fusion 0.005, fission and electric 0.043 (TO:AUE p.63). */
export const SATELLITE_FUEL_TONS_PER_BURN_DAY = { fusion: 0.005, other: 0.043 };

/** BV Unit Type Modifiers (TM p.316; Satellites TO:AUE p.190). */
export const SUPPORT_AIRCRAFT_BV_TYPE_MODIFIER: Record<SupportAircraftMotive, number> = { airship: 0.7, "fixed-wing": 1.0, satellite: 0.7 };

/** Alpha Strike movement codes (ASC p.94): i airship, a fixed-wing, k satellite. */
export const SUPPORT_AIRCRAFT_AS_MOVE: Record<SupportAircraftMotive, string> = { airship: "i", "fixed-wing": "a", satellite: "k" };
