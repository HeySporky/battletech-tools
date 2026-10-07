/**
 * Advanced building classifications and types (Tactical Operations: Advanced Rules pp.112-115), the Power
 * Generators Table (TO:AR p.132) and the structure costs (TO:AR p.208). Literal records, as printed.
 *
 * Castles Brian are left out: they use capital-scale Construction Factors and their own complex rules
 * (TO:AR p.139), which the creator does not build.
 */

export type BuildingClassificationTag = "tent" | "hangar" | "standard" | "fence" | "wall" | "bridge" | "gun-emplacement" | "fortress";
export type BuildingTypeTag = "none" | "light" | "medium" | "heavy" | "hardened" | "rail";

export interface IBuildingType {
    tag: BuildingTypeTag;
    name: string;
    minCF: number;
    maxCF: number;
    /** Most hexes the building may cover; null where the table sets no limit (walls, fences, bridges). */
    maxHexes: number | null;
    /** Most levels of height; null where the table gives none (bridges). */
    maxLevels: number | null;
    /** Extra MP to enter a hex; null where units cannot enter ("NA"). */
    mpCost: number | null;
    /** Piloting/Driving Skill Roll modifier; null where the table gives none. */
    pilotingModifier: number | null;
}

/** How much equipment a hex carries: CF x levels, a hangar's tripled and capped figure, or nothing (TO:AR p.127). */
export type BuildingCapacityRule = "cf-levels" | "hangar" | "none";
/** Heavy weapon tonnage a hex may mount: none, CF / 3 rounded down, or CF / 10 for each level (TO:AR p.129). */
export type BuildingHeavyWeaponRule = "none" | "cf-third" | "cf-tenth-per-level";

export interface IBuildingClassification {
    tag: BuildingClassificationTag;
    name: string;
    description: string;
    types: IBuildingType[];
    /** True where armor may be installed, to a maximum of CF x 1 points a hex (TO:AR pp.113, 128). */
    armor: boolean;
    capacity: BuildingCapacityRule;
    heavyWeapons: BuildingHeavyWeaponRule;
    /** True where Light and Medium (infantry) weapons may be mounted, 6 a hex for each level (TO:AR p.129). */
    lightWeapons: boolean;
    /** True where a power generator may be installed and the hexes count toward its weight (TO:AR p.132). */
    powered: boolean;
    /** Damage Scaling: multiplier for damage to the building, and for damage passed to units inside. */
    damageToBuilding: number;
    damageToUnits: number;
    /** Structure cost in C-bills for each point of CF, per hex and per level (TO:AR p.208). */
    costPerCF: number;
    /** Size is counted in hexsides, not hexes (walls and fences). */
    perHexside: boolean;
    /** The structure cost counts one level whatever the height (bridges). */
    singleLevelCost: boolean;
    page: number;
}

export const BUILDING_CLASSIFICATIONS: IBuildingClassification[] = [
    {
        tag: "gun-emplacement",
        name: "Gun Emplacement",
        description: "A single-hex weapons platform. Units other than infantry cannot enter it; it is attacked as a stationary vehicle and tracks damage as a building.",
        types: [
            { tag: "light", name: "Light", minCF: 1, maxCF: 15, maxHexes: 1, maxLevels: 1, mpCost: null, pilotingModifier: null },
            { tag: "medium", name: "Medium", minCF: 16, maxCF: 40, maxHexes: 1, maxLevels: 1, mpCost: null, pilotingModifier: null },
            { tag: "heavy", name: "Heavy", minCF: 41, maxCF: 90, maxHexes: 1, maxLevels: 1, mpCost: null, pilotingModifier: null },
            { tag: "hardened", name: "Hardened", minCF: 91, maxCF: 150, maxHexes: 1, maxLevels: 1, mpCost: null, pilotingModifier: null },
        ],
        armor: true,
        capacity: "cf-levels",
        heavyWeapons: "cf-third",
        lightWeapons: false,
        powered: true,
        damageToBuilding: 0.5,
        damageToUnits: 2,
        costPerCF: 20000,
        perHexside: false,
        singleLevelCost: false,
        page: 115,
    },
    {
        tag: "fortress",
        name: "Fortress",
        description: "A heavy military building: a bunker, guard tower or installation.",
        types: [
            { tag: "medium", name: "Medium", minCF: 16, maxCF: 40, maxHexes: 12, maxLevels: 15, mpCost: 3, pilotingModifier: 2 },
            { tag: "heavy", name: "Heavy", minCF: 41, maxCF: 90, maxHexes: 15, maxLevels: 20, mpCost: 4, pilotingModifier: 3 },
            { tag: "hardened", name: "Hardened", minCF: 91, maxCF: 150, maxHexes: 20, maxLevels: 30, mpCost: 5, pilotingModifier: 4 },
        ],
        armor: true,
        capacity: "cf-levels",
        heavyWeapons: "cf-tenth-per-level",
        lightWeapons: false,
        powered: true,
        damageToBuilding: 0.5,
        damageToUnits: 2,
        costPerCF: 20000,
        perHexside: false,
        singleLevelCost: false,
        page: 115,
    },
    {
        tag: "standard",
        name: "Standard Building",
        description: "A building as in Total Warfare: homes, offices and other mostly civilian structures. There is no Hardened type.",
        types: [
            { tag: "light", name: "Light", minCF: 1, maxCF: 15, maxHexes: 6, maxLevels: 5, mpCost: 1, pilotingModifier: 0 },
            { tag: "medium", name: "Medium", minCF: 16, maxCF: 40, maxHexes: 8, maxLevels: 8, mpCost: 2, pilotingModifier: 1 },
            { tag: "heavy", name: "Heavy", minCF: 41, maxCF: 90, maxHexes: 10, maxLevels: 10, mpCost: 3, pilotingModifier: 2 },
        ],
        armor: false,
        capacity: "cf-levels",
        heavyWeapons: "none",
        lightWeapons: true,
        powered: true,
        damageToBuilding: 1,
        damageToUnits: 1,
        costPerCF: 10000,
        perHexside: false,
        singleLevelCost: false,
        page: 114,
    },
    {
        tag: "hangar",
        name: "Hangar",
        description: "A wide-open interior for 'Mechs, aircraft and other large equipment; most warehouses are hangars too.",
        types: [
            { tag: "light", name: "Light", minCF: 1, maxCF: 8, maxHexes: 10, maxLevels: 7, mpCost: 0, pilotingModifier: 0 },
            { tag: "medium", name: "Medium", minCF: 9, maxCF: 16, maxHexes: 14, maxLevels: 10, mpCost: 1, pilotingModifier: 0 },
            { tag: "heavy", name: "Heavy", minCF: 17, maxCF: 45, maxHexes: 18, maxLevels: 13, mpCost: 2, pilotingModifier: 1 },
            { tag: "hardened", name: "Hardened", minCF: 46, maxCF: 75, maxHexes: 20, maxLevels: 14, mpCost: 3, pilotingModifier: 3 },
        ],
        armor: false,
        capacity: "hangar",
        heavyWeapons: "none",
        lightWeapons: true,
        powered: true,
        damageToBuilding: 1,
        damageToUnits: 0.5,
        costPerCF: 8000,
        perHexside: false,
        singleLevelCost: false,
        page: 114,
    },
    {
        tag: "wall",
        name: "Wall",
        description: "A stand-alone structure along hexsides, each hexside tracked on its own.",
        types: [
            { tag: "light", name: "Light", minCF: 1, maxCF: 15, maxHexes: null, maxLevels: 4, mpCost: 1, pilotingModifier: 0 },
            { tag: "medium", name: "Medium", minCF: 16, maxCF: 40, maxHexes: null, maxLevels: 6, mpCost: 2, pilotingModifier: 0 },
            { tag: "heavy", name: "Heavy", minCF: 41, maxCF: 90, maxHexes: null, maxLevels: 8, mpCost: 3, pilotingModifier: 1 },
            { tag: "hardened", name: "Hardened", minCF: 91, maxCF: 150, maxHexes: null, maxLevels: 10, mpCost: 4, pilotingModifier: 3 },
        ],
        armor: true,
        capacity: "cf-levels",
        heavyWeapons: "none",
        lightWeapons: true,
        powered: false,
        damageToBuilding: 1,
        damageToUnits: 0.5,
        costPerCF: 5000,
        perHexside: true,
        singleLevelCost: false,
        page: 114,
    },
    {
        tag: "fence",
        name: "Fence",
        description: "The lightest wall: an obstacle only to conventional infantry on Ground MP. It supports no weight.",
        types: [
            { tag: "none", name: "Fence", minCF: 1, maxCF: 1, maxHexes: null, maxLevels: 3, mpCost: 1, pilotingModifier: null },
        ],
        armor: false,
        capacity: "none",
        heavyWeapons: "none",
        lightWeapons: false,
        powered: false,
        damageToBuilding: 1,
        damageToUnits: 0,
        costPerCF: 800,
        perHexside: true,
        singleLevelCost: false,
        page: 114,
    },
    {
        tag: "bridge",
        name: "Bridge",
        description: "A special wall with a road or rail line along it. Units move over a bridge, never through it.",
        types: [
            { tag: "light", name: "Light", minCF: 1, maxCF: 15, maxHexes: null, maxLevels: null, mpCost: null, pilotingModifier: null },
            { tag: "medium", name: "Medium", minCF: 16, maxCF: 40, maxHexes: null, maxLevels: null, mpCost: null, pilotingModifier: null },
            { tag: "heavy", name: "Heavy", minCF: 41, maxCF: 90, maxHexes: null, maxLevels: null, mpCost: null, pilotingModifier: null },
            { tag: "hardened", name: "Hardened", minCF: 91, maxCF: 150, maxHexes: null, maxLevels: null, mpCost: null, pilotingModifier: null },
            { tag: "rail", name: "Rail", minCF: 151, maxCF: 650, maxHexes: null, maxLevels: null, mpCost: null, pilotingModifier: null },
        ],
        armor: false,
        capacity: "none",
        heavyWeapons: "none",
        lightWeapons: false,
        powered: false,
        damageToBuilding: 1,
        damageToUnits: 1,
        costPerCF: 12000,
        perHexside: false,
        singleLevelCost: true,
        page: 114,
    },
    {
        tag: "tent",
        name: "Tent",
        description: "A non-permanent structure. Any unit of 5 tons or more destroys it by entering.",
        types: [
            { tag: "none", name: "Tent", minCF: 1, maxCF: 2, maxHexes: 1, maxLevels: 1, mpCost: 0, pilotingModifier: null },
        ],
        armor: false,
        capacity: "none",
        heavyWeapons: "none",
        lightWeapons: false,
        powered: false,
        damageToBuilding: 1,
        damageToUnits: 0,
        costPerCF: 1000,
        perHexside: false,
        singleLevelCost: false,
        page: 114,
    },
];

/** Most hexsides or hexes the creator accepts where the table sets no limit. */
export const BUILDING_MAX_UNLIMITED_HEXES = 100;

/** A hangar hex holds at most 600 tons of equipment for every 4 levels of height, or fraction (TO:AR p.127). */
export const HANGAR_CAPACITY_PER_FOUR_LEVELS = 600;

/** Armor points a ton, per hex, by the building's technology base (TO:AR p.128). */
export const BUILDING_ARMOR_POINTS_PER_TON = { is: 16, clan: 20 };
/** Armor cost in C-bills a ton (TO:AR p.208). */
export const BUILDING_ARMOR_COST_PER_TON = { is: 10000, clan: 15000 };
/** Unspecified equipment costs 5,000 C-bills x CF for each hex (TO:AR p.208). */
export const BUILDING_UNSPECIFIED_EQUIPMENT_COST_PER_CF = 5000;

export interface IBuildingGenerator {
    tag: string;
    name: string;
    /** Generator Weight Multiplier (TO:AR p.132). */
    weightMultiplier: number;
    /** Daily fuel in tons for every five hexes powered; null where none is needed. */
    dailyFuel: number | null;
    /** C-bills a ton of generator (TO:AR p.208). */
    costPerTon: number;
    /** Fission and fusion generators need no power amplifiers and no heat sinks for energy weapons. */
    fusionOrFission: boolean;
    /** May not share the roof with turrets. */
    noRooftopEquipment: boolean;
    notes: string;
}

/**
 * The Power Generators Table (TO:AR p.132). The PCMT-fed external generator is left out: its minimum building
 * size depends on the transmitter, which the creator does not model.
 */
export const BUILDING_GENERATORS: IBuildingGenerator[] = [
    { tag: "fusion", name: "Fusion", weightMultiplier: 1, dailyFuel: null, costPerTon: 10000, fusionOrFission: true, noRooftopEquipment: false, notes: "" },
    { tag: "fission", name: "Fission", weightMultiplier: 1.5, dailyFuel: null, costPerTon: 15000, fusionOrFission: true, noRooftopEquipment: false, notes: "" },
    { tag: "ice-petrol", name: "Internal Combustion (Petrol, Natural Gas)", weightMultiplier: 1.5, dailyFuel: 1, costPerTon: 5000, fusionOrFission: false, noRooftopEquipment: false, notes: "Liquid-based fuel supply required" },
    { tag: "ice-coal", name: "Internal Combustion (Coal, Wood)", weightMultiplier: 2, dailyFuel: 2, costPerTon: 5000, fusionOrFission: false, noRooftopEquipment: false, notes: "Solid-based fuel supply required" },
    { tag: "fuel-cell", name: "Fuel Cell", weightMultiplier: 1, dailyFuel: 1.2, costPerTon: 7000, fusionOrFission: false, noRooftopEquipment: false, notes: "Liquid-based fuel supply required" },
    { tag: "steam", name: "Steam", weightMultiplier: 3, dailyFuel: 1.5, costPerTon: 4000, fusionOrFission: false, noRooftopEquipment: false, notes: "Liquid-based fuel supply required" },
    { tag: "solar", name: "Solar", weightMultiplier: 3, dailyFuel: null, costPerTon: 8000, fusionOrFission: false, noRooftopEquipment: true, notes: "May not mount other equipment on the rooftop" },
    { tag: "external", name: "External (Other)", weightMultiplier: 0.5, dailyFuel: null, costPerTon: 5000, fusionOrFission: false, noRooftopEquipment: false, notes: "Stores enough power to run for 1 hour for every 5 tons of equipment" },
];

export const findBuildingClassification = (tag: unknown): IBuildingClassification | undefined =>
    BUILDING_CLASSIFICATIONS.find((classification) => classification.tag === tag);

export const findBuildingGenerator = (tag: unknown): IBuildingGenerator | undefined =>
    BUILDING_GENERATORS.find((generator) => generator.tag === tag);
