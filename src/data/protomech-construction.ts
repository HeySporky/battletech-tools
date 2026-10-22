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

// ProtoMech construction tables: TechManual pp.80-89 (2 to 9 tons, bipeds) and Interstellar Operations: Alternate
// Eras pp.93-96 (Ultraheavy, Quad and Glider ProtoMechs). Weights are in kilograms. Cockpits, heat sinks, jump jets
// and structures are in protomech-components.ts; weapons come from the equipment catalogs (`space.protomech`).

export type ProtoMechChassis = "biped" | "quad" | "glider";
export type ProtoMechLocation = "head" | "torso" | "la" | "ra" | "legs" | "mainGun";
/** Locations that can carry weapons and equipment. */
export type ProtoMechMountLocation = "torso" | "la" | "ra" | "mainGun";

export const PROTOMECH_MIN_TONS = 2;
export const PROTOMECH_MAX_STANDARD_TONS = 9;
export const PROTOMECH_MAX_TONS = 15;
/** Standard ProtoMechs are tournament legal; Ultraheavy, Quad and Glider ProtoMechs are Advanced (IO:AE p.93). */
export const PROTOMECH_RULES_LEVEL = 2;
export const PROTOMECH_ADVANCED_RULES_LEVEL = 3;
export const PROTOMECH_EXPERIMENTAL_RULES_LEVEL = 4;

export const PROTOMECH_ARMOR_KG = 50;
export const PROTOMECH_EDP_ARMOR_KG = 75;
export const PROTOMECH_HEAT_SINK_KG = 250;
/** Engine Ratings of 39 or less weigh 25 kg a point; higher ratings use the Master Engine Table (TM p.83). */
export const PROTOMECH_SMALL_ENGINE_KG = 25;
export const PROTOMECH_SMALL_ENGINE_MAX_RATING = 39;
export const PROTOMECH_MAX_ENGINE_RATING = 400;
/** A Glider needs 4 WiGE MP to take off; a Quad must have a Running MP of 3 or more (IO:AE p.96). */
export const PROTOMECH_GLIDER_MIN_FLANK = 4;
export const PROTOMECH_QUAD_MIN_RUN = 3;

export const PROTOMECH_CHASSIS: { tag: ProtoMechChassis; name: string; rulesLevel: number; introduced: number | null; book: string; page: number }[] = [
    { tag: "biped", name: "Biped", rulesLevel: PROTOMECH_RULES_LEVEL, introduced: 3060, book: "TM", page: 80 },
    { tag: "quad", name: "Quad", rulesLevel: PROTOMECH_ADVANCED_RULES_LEVEL, introduced: 3083, book: "IO:AE", page: 93 },
    { tag: "glider", name: "Glider", rulesLevel: PROTOMECH_ADVANCED_RULES_LEVEL, introduced: 3084, book: "IO:AE", page: 93 },
];
/** Ultraheavy ProtoMechs (10 to 15 tons) date from 3083 (IO:AE p.93). */
export const PROTOMECH_ULTRAHEAVY_INTRODUCED = 3083;

export const PROTOMECH_LOCATION_NAMES: Record<ProtoMechLocation, string> = {
    head: "Head",
    torso: "Torso",
    la: "Left Arm",
    ra: "Right Arm",
    legs: "Legs",
    mainGun: "Main Gun",
};

/** Internal structure points and the most armor a location can carry. */
export interface IProtoMechLocationPoints {
    structure: number;
    maxArmor: number;
}

export interface IProtoMechStructureRow {
    tons: number;
    head: IProtoMechLocationPoints;
    torso: IProtoMechLocationPoints;
    /** Each arm; Quads have none. */
    arm: IProtoMechLocationPoints;
    /** Both legs of a biped or Glider, as one location. */
    legs: IProtoMechLocationPoints;
    /** All four legs of a Quad, as one location. */
    quadLegs: IProtoMechLocationPoints;
    mainGun: IProtoMechLocationPoints;
}

const p = (structure: number, maxArmor: number): IProtoMechLocationPoints => ({ structure, maxArmor });

/**
 * The ProtoMech Structure and Armor Table (TM p.82) and its expanded form (IO:AE p.96). The expanded table prints
 * an arm armor limit of 4 for 3 to 5 tons; that is a misprint: TechManual prints 2, and the table's own Armor
 * Factor column (17, 22 and 24 without a main gun) only adds up with 2.
 */
export const protoMechStructureTable: IProtoMechStructureRow[] = [
    { tons: 2, head: p(1, 3), torso: p(2, 4), arm: p(1, 2), legs: p(2, 4), quadLegs: p(4, 8), mainGun: p(1, 3) },
    { tons: 3, head: p(1, 3), torso: p(3, 6), arm: p(1, 2), legs: p(2, 4), quadLegs: p(4, 8), mainGun: p(1, 3) },
    { tons: 4, head: p(1, 4), torso: p(4, 8), arm: p(1, 2), legs: p(3, 6), quadLegs: p(5, 10), mainGun: p(1, 3) },
    { tons: 5, head: p(1, 4), torso: p(5, 10), arm: p(1, 2), legs: p(3, 6), quadLegs: p(5, 10), mainGun: p(1, 3) },
    { tons: 6, head: p(2, 5), torso: p(6, 12), arm: p(2, 4), legs: p(4, 8), quadLegs: p(8, 16), mainGun: p(1, 3) },
    { tons: 7, head: p(2, 5), torso: p(7, 14), arm: p(2, 4), legs: p(4, 8), quadLegs: p(8, 16), mainGun: p(1, 3) },
    { tons: 8, head: p(2, 6), torso: p(8, 16), arm: p(2, 4), legs: p(5, 10), quadLegs: p(9, 18), mainGun: p(1, 3) },
    { tons: 9, head: p(2, 6), torso: p(9, 18), arm: p(2, 4), legs: p(5, 10), quadLegs: p(9, 18), mainGun: p(1, 3) },
    { tons: 10, head: p(3, 7), torso: p(10, 20), arm: p(3, 6), legs: p(6, 12), quadLegs: p(12, 24), mainGun: p(2, 6) },
    { tons: 11, head: p(3, 7), torso: p(11, 22), arm: p(3, 6), legs: p(6, 12), quadLegs: p(12, 24), mainGun: p(2, 6) },
    { tons: 12, head: p(3, 8), torso: p(12, 24), arm: p(3, 6), legs: p(7, 14), quadLegs: p(13, 26), mainGun: p(2, 6) },
    { tons: 13, head: p(3, 8), torso: p(13, 26), arm: p(3, 6), legs: p(7, 14), quadLegs: p(13, 26), mainGun: p(2, 6) },
    { tons: 14, head: p(4, 9), torso: p(14, 28), arm: p(4, 6), legs: p(8, 16), quadLegs: p(14, 28), mainGun: p(2, 6) },
    { tons: 15, head: p(4, 9), torso: p(15, 30), arm: p(4, 6), legs: p(8, 16), quadLegs: p(14, 28), mainGun: p(2, 6) },
];

export const getProtoMechStructureRow = (tons: number): IProtoMechStructureRow =>
    protoMechStructureTable.find((row) => row.tons === tons) ?? protoMechStructureTable[0];

/** Items a location may carry and their combined weight; `maxKg` null is unlimited. Ammunition counts for neither. */
export interface IProtoMechLocationLimit {
    items: number;
    maxKg: number | null;
}

/** The Expanded ProtoMech Location Restrictions Table (IO:AE p.96; the Standard (Biped) column is TM p.87). */
export const getProtoMechLocationLimit = (chassis: ProtoMechChassis, tons: number, location: ProtoMechMountLocation): IProtoMechLocationLimit => {
    const ultra = tons > PROTOMECH_MAX_STANDARD_TONS;
    const quad = chassis === "quad";
    if (location === "torso") {
        if (quad) return ultra ? { items: 6, maxKg: 8000 } : { items: 4, maxKg: 5000 };
        return ultra ? { items: 3, maxKg: 4000 } : { items: 2, maxKg: 2000 };
    }
    if (location === "mainGun") return { items: quad && ultra ? 2 : 1, maxKg: null };
    if (quad) return { items: 0, maxKg: 0 };
    return { items: 1, maxKg: ultra ? 1000 : 500 };
};

/**
 * Kilograms a shot, from the ProtoMech Ammunition Weight Table (TM p.88), by the weapon's catalog tag. Missiles are
 * listed by missile in `protoMechMissiles`. A weapon the table leaves out uses 1,000 kg divided by its shots a ton.
 */
export const protoMechAmmoKgPerShot: Record<string, number> = {
    "clan-ams": 40,
    "ap-gauss-rifle": 25,
    "clan-heavy-machine-gun": 10,
    "clan-light-machine-gun": 5,
    "clan-machine-gun": 5,
    "clan-narc": 150,
    "clan-autocannon-uac-2": 20,
    "clan-autocannon-uac-5": 50,
    "clan-autocannon-uac-10": 100,
    "clan-autocannon-lbx-2": 20,
    "clan-autocannon-lbx-5": 50,
    "clan-autocannon-lbx-10": 100,
    "clan-gauss-rifle": 125,
    "hyper-assault-gauss-20": 166.66,
    "vehicle-flamer": 50,
    "plasma-cannon": 100,
};

export type ProtoMechMissileFamily = "lrm" | "srm" | "streak-srm" | "streak-lrm";

/**
 * A missile launcher built from single tubes (TM p.88; Streak LRM, TO:AUE p.139 and its equipment table). `bv` and
 * `ammoBV` are the launcher's Battle Value and its ammunition's Battle Value for a full ton, by number of tubes,
 * from the Clan table (TM p.318; Streak LRM, TO:AUE p.199). A launcher costs `costPerTube` a tube, except at the
 * standard rack sizes of `standardCost`, which cost what the standard launcher does (TM p.283 and its footnote).
 */
export interface IProtoMechMissile {
    family: ProtoMechMissileFamily;
    name: string;
    /** The catalog launcher whose ranges, damage and ammunition family the tubes share. */
    catalogTag: string;
    kgPerTube: number;
    kgPerMissile: number;
    maxTubes: number;
    costPerTube: number;
    standardCost: Record<number, number>;
    rulesLevel: number;
    /** Prototype year where the tubes are newer than the launcher they are built from. */
    prototype?: number;
    bv: number[];
    ammoBV: number[];
    book: string;
    page: number;
}

export const protoMechMissiles: IProtoMechMissile[] = [
    {
        family: "lrm", name: "LRM", catalogTag: "clan-lrm-5", kgPerTube: 200, kgPerMissile: 8.33, maxTubes: 20, costPerTube: 10000, standardCost: { 5: 30000 }, rulesLevel: 2,
        bv: [17, 24, 34, 46, 55, 69, 76, 88, 94, 109, 126, 141, 145, 159, 164, 180, 185, 199, 203, 220],
        ammoBV: [2, 3, 4, 6, 7, 9, 10, 11, 12, 14, 16, 18, 19, 20, 21, 23, 24, 25, 26, 27],
        book: "TM", page: 88,
    },
    {
        family: "srm", name: "SRM", catalogTag: "clan-srm-2", kgPerTube: 250, kgPerMissile: 10, maxTubes: 6, costPerTube: 10000, standardCost: { 2: 10000, 4: 60000, 6: 80000 }, rulesLevel: 2,
        bv: [15, 21, 30, 39, 47, 59],
        ammoBV: [2, 3, 4, 5, 6, 7],
        book: "TM", page: 88,
    },
    {
        family: "streak-srm", name: "Streak SRM", catalogTag: "clan-streak-srm-2", kgPerTube: 500, kgPerMissile: 10, maxTubes: 6, costPerTube: 15000, standardCost: { 2: 15000, 4: 90000, 6: 120000 }, rulesLevel: 2,
        bv: [20, 40, 59, 79, 99, 118],
        ammoBV: [3, 5, 7, 10, 13, 15],
        book: "TM", page: 88,
    },
    {
        family: "streak-lrm", name: "Streak LRM", catalogTag: "streak-lrm-5", kgPerTube: 400, kgPerMissile: 8.33, maxTubes: 20, costPerTube: 15000, standardCost: {}, rulesLevel: 4, prototype: 3065,
        bv: [17, 34, 51, 68, 86, 103, 120, 137, 155, 173, 190, 207, 224, 241, 259, 276, 293, 310, 327, 345],
        ammoBV: [2, 4, 7, 9, 11, 13, 15, 17, 19, 22, 24, 26, 28, 30, 32, 35, 37, 39, 41, 43],
        book: "TO:AUE", page: 139,
    },
];

export const findProtoMechMissile = (family: string | undefined): IProtoMechMissile | undefined =>
    protoMechMissiles.find((missile) => missile.family === family);

/** The tag a tube launcher is mounted under: "pm-lrm", "pm-srm", "pm-streak-srm", "pm-streak-lrm". */
export const PROTOMECH_MISSILE_TAG_PREFIX = "pm-";
export const getProtoMechMissileByTag = (tag: string): IProtoMechMissile | undefined =>
    tag.startsWith(PROTOMECH_MISSILE_TAG_PREFIX) ? findProtoMechMissile(tag.slice(PROTOMECH_MISSILE_TAG_PREFIX.length)) : undefined;

/** Catalog launchers the tube launchers stand in for; they are not offered beside them. */
export const PROTOMECH_FIXED_LAUNCHER_PATTERN = /^(clan-lrm-|clan-srm-|clan-streak-srm-|streak-lrm-)\d+$/;

/**
 * Equipment only a ProtoMech mounts that the equipment catalogs do not carry. `kg` is fixed, or found from the
 * ProtoMech's tonnage (see `getProtoMechEquipmentKg`).
 */
export interface IProtoMechEquipment {
    tag: string;
    name: string;
    /** Locations it may be mounted in. */
    locations: ProtoMechMountLocation[];
    /** Chassis types that may mount it. */
    chassis: ProtoMechChassis[];
    kg: number | "magnetic-clamp" | "partial-wing";
    bv: number | "melee" | "quad-melee";
    /** Counts toward the Defensive Battle Rating. */
    defensive?: boolean;
    cost: number | "partial-wing";
    /** Shots carried as part of the item, which cannot be added to. */
    fixedShots?: number;
    /** The catalog weapon whose ranges and damage it uses on the record sheet. */
    catalogTag?: string;
    rulesLevel: number;
    introduced: number | null;
    prototype: number | null;
    book: string;
    page: number;
    notes: string;
}

export const protoMechEquipment: IProtoMechEquipment[] = [
    {
        tag: "protomech-magnetic-clamp", name: "Magnetic Clamp System", locations: ["torso"], chassis: ["biped"], kg: "magnetic-clamp", bv: 1, cost: 25000,
        rulesLevel: 3, introduced: 3075, prototype: null, book: "IO:AE", page: 60,
        notes: "250 kg under 6 tons, 500 kg from 6 to 9 tons, 1,000 kg at 10 tons or more; one torso slot. Not for Quad or Glider ProtoMechs. A BattleMech may carry two ProtoMechs so equipped (one if it weighs over 9 tons). Battle Value and cost: IO:AE pp.190, 213.",
    },
    {
        tag: "protomech-melee-weapon", name: "ProtoMech Melee Weapon", locations: ["la", "ra"], chassis: ["biped", "glider"], kg: 500, bv: "melee", cost: 50000,
        rulesLevel: 4, introduced: null, prototype: 3067, book: "TO:AUE", page: 149,
        notes: "Half a ton, one arm slot; one melee weapon a ProtoMech. Adds 1 point to a Frenzy attack for every 5 tons of the ProtoMech or part of that. Battle Value: the added damage x 1.25 (TO:AUE p.199).",
    },
    {
        tag: "protomech-quad-melee-system", name: "ProtoMech Quad Melee Weapon System", locations: ["torso"], chassis: ["quad"], kg: 1000, bv: "quad-melee", cost: 70000,
        rulesLevel: 3, introduced: 3072, prototype: null, book: "IO:AE", page: 61,
        notes: "1 ton, torso of a Quad ProtoMech only. Adds 2 points to a Frenzy attack for every 5 tons of the ProtoMech or part of that. Battle Value: the added damage x 1.25 (IO:AE p.190).",
    },
    {
        tag: "protomech-fusillade", name: "Fusillade Launcher", locations: ["torso", "la", "ra", "mainGun"], chassis: ["biped", "quad", "glider"], kg: 1500, bv: 11, cost: 100000,
        fixedShots: 2, catalogTag: "atm-3",
        rulesLevel: 4, introduced: null, prototype: 3072, book: "IO:AE", page: 59,
        notes: "1.5 tons with its two ATM 3 rounds, which cannot be added to; needs no heat sinks. Rolls on the 3 column of the Cluster Hits Table with +2 for its built-in Artemis IV. Battle Value and cost: IO:AE pp.190, 213.",
    },
    {
        tag: "protomech-partial-wing", name: "ProtoMech Partial Wing", locations: ["torso"], chassis: ["biped", "quad"], kg: "partial-wing", bv: 0, cost: "partial-wing",
        rulesLevel: 4, introduced: null, prototype: 3070, book: "TO:AUE", page: 105,
        notes: "20 percent of the ProtoMech's weight, one torso slot. Adds 2 Jumping MP in a standard atmosphere (TO:AUE p.107), which may pass the usual limit. Cost 50,000 x its tonnage (TO:AUE p.210).",
    },
];

export const findProtoMechEquipment = (tag: string): IProtoMechEquipment | undefined =>
    protoMechEquipment.find((item) => item.tag === tag);

export const getProtoMechEquipmentKg = (item: IProtoMechEquipment, tons: number): number => {
    if (item.kg === "magnetic-clamp") return tons < 6 ? 250 : tons <= PROTOMECH_MAX_STANDARD_TONS ? 500 : 1000;
    if (item.kg === "partial-wing") return tons * 200;
    return item.kg;
};

/** The ProtoMech Myomer Booster: 25 kg a ton of ProtoMech; Running MP becomes twice the Walking MP (TM p.85). */
export const PROTOMECH_MYOMER_BOOSTER = { tag: "clan-protomech-myomer-booster", kgPerTon: 25, rulesLevel: 2, book: "TM", page: 85 };
/** ProtoMech UMUs weigh what jump jets do and replace them (TO:AUE p.107); cost 200 x tonnage x UMUs squared (TO:AUE p.212). */
export const PROTOMECH_UMU = { rulesLevel: 4, introduced: null as number | null, prototype: 3061, costFactor: 200, book: "TO:AUE", page: 107 };
/** The Inner Sphere ProtoMech Interface: a cockpit of the same weight that makes the unit Mixed Technology (IO:AE p.96). */
export const PROTOMECH_INTERFACE_COCKPIT = { rulesLevel: 4, introduced: 3071, cost: 1000000, book: "IO:AE", page: 96 };

/** Structural costs (TM p.279); the cockpit, structure, jump jet and heat sink prices are in protomech-components.ts. */
export const PROTOMECH_COSTS = {
    lifeSupport: 75000,
    sensorsPerTon: 2000,
    musculaturePerTon: 2000,
    armActuatorPerTon: 180,
    legActuatorsPerTon: 540,
    armorPerPoint: 625,
    edpArmorPerPoint: 1250,
};

/** Frenzy attack damage before melee equipment: 1 point for every 5 tons or part of that, 3 for an Ultraheavy (TW p.187; IO:AE p.95). */
export const getProtoMechFrenzyDamage = (tons: number): number => (tons > PROTOMECH_MAX_STANDARD_TONS ? 3 : Math.ceil(tons / 5));
