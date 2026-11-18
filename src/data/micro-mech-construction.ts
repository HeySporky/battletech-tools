/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs,
* Topps, and their respective rights holders.
*
* This open-source utility is a non-commercial fan project designed purely for
* tabletop gameplay assistance. Content processed by this file is not intended
* to challenge any copyright or trademark status, and this data is explicitly
* excluded from the software's underlying license (GNU GPLv3).
*
* Micro-Mechs (#173) are fan-made, Custom Homebrew. Two texts are offered as versions:
* - "6.1.0.2": "Micro-Mechs", version 6.1.0.2 (ResourceLibrary/Custom/text/Micro-Mechs6-1-0-2.raw.txt),
*   CONSTRUCTION section and the two record sheets.
* - "solarmech-2019": Solarmech, "Micro-Mechs for BattleTech, Part 1", DeviantArt, Apr 29, 2019
*   (ResourceLibrary/scrapes/deviantart/solarmech-micro-mechs-part-1-795743489.txt), CONSTRUCTION section.
*/

export type MicroMechVersion = "6.1.0.2" | "solarmech-2019";
export type MicroMechLayout = "biped" | "quad";
/** "fll" / "frl" are a quad's front legs; on a quad "ll" / "rl" are its rear legs. */
export type MicroMechLocation = "head" | "torso" | "torsoRear" | "la" | "ra" | "ll" | "rl" | "fll" | "frl";
/** The engines the builder offers. The 2019 text also names industrial fusion, industrial ICE and fuel cell (not built yet). */
export type MicroMechEngineKind = "fusion" | "ice";
export type MicroMechArmorType = "standard" | "industrial";

export const MICRO_MECH_MIN_TONS = 10;
export const MICRO_MECH_MAX_TONS = 19;
export const MICRO_MECH_DEFAULT_VERSION: MicroMechVersion = "6.1.0.2";
export const MICRO_MECH_VERSIONS: MicroMechVersion[] = ["6.1.0.2", "solarmech-2019"];
/** Both texts: "The Cockpit weighs 1500 kilograms this includes all the support systems" / "The Cockpit is 1.5 tons". */
export const MICRO_MECH_COCKPIT_KG = 1500;
/** Both texts: "Each 62.5kgs is 1 point of armor" / "Each quarter ton is 4 armor points". */
export const MICRO_MECH_ARMOR_KG_PER_POINT = 62.5;
/** The 3 points of cockpit armor (the pilot dies when all three are gone), in the rules section of both texts. */
export const MICRO_MECH_COCKPIT_ARMOR = 3;
export const MICRO_MECH_QUARTER_TON_KG = 250;

export const MICRO_MECH_CREDIT = "Micro-Mechs by Solarmech. This version (6.1.0.2) was revised by an unnamed editor with Discord, who wrote the Battle Value, cost and conversion appendices.";
export const MICRO_MECH_BORROWED_NOTE = "Equipment, cost and Battle Value from version 6.1.0.2; the author's own tables are not published.";

/** Internal structure points by tonnage (both texts print the same points). */
export interface IMicroMechStructureRow {
    tons: number;
    head: number;
    torso: number;
    arm: number;
    leg: number;
}

export const microMechStructureTable: IMicroMechStructureRow[] = [
    { tons: 10, head: 2, torso: 10, arm: 2, leg: 3 },
    { tons: 11, head: 2, torso: 11, arm: 2, leg: 3 },
    { tons: 12, head: 2, torso: 11, arm: 2, leg: 3 },
    { tons: 13, head: 2, torso: 12, arm: 2, leg: 3 },
    { tons: 14, head: 2, torso: 13, arm: 2, leg: 4 },
    { tons: 15, head: 2, torso: 13, arm: 2, leg: 4 },
    { tons: 16, head: 2, torso: 14, arm: 3, leg: 4 },
    { tons: 17, head: 2, torso: 15, arm: 3, leg: 4 },
    { tons: 18, head: 2, torso: 15, arm: 3, leg: 4 },
    { tons: 19, head: 2, torso: 16, arm: 3, leg: 4 },
];

export const getMicroMechStructureRow = (tons: number): IMicroMechStructureRow =>
    microMechStructureTable.find((row) => row.tons === tons) ?? microMechStructureTable[0];

/** A location's critical slots and the fixed items in them, from the record sheets (biped and quad). */
export interface IMicroMechSlotLayout {
    slots: number;
    fixed: string[];
}

export const MICRO_MECH_UPPER_ARM = "Upper Arm Actuator Group";
export const MICRO_MECH_LOWER_ARM = "Lower Arm Actuator Group";
export const MICRO_MECH_UPPER_LEG = "Upper Leg Actuator Group";
export const MICRO_MECH_LOWER_LEG = "Lower Leg Actuator Group";

/**
 * Slots by location. The arm's Lower Arm Actuator Group is optional and is added by the class when fitted: the biped
 * sheet prints only the upper group, and "Only the lower arm actuator may be removed". The rear torso is an armor
 * location with no slots.
 */
export const MICRO_MECH_SLOTS: Record<MicroMechLocation, IMicroMechSlotLayout> = {
    head: { slots: 2, fixed: ["Sensors"] },
    torso: { slots: 12, fixed: ["Life Support", "Cockpit", "Engine", "Engine", "Engine", "Gyro", "Gyro"] },
    torsoRear: { slots: 0, fixed: [] },
    la: { slots: 3, fixed: [MICRO_MECH_UPPER_ARM] },
    ra: { slots: 3, fixed: [MICRO_MECH_UPPER_ARM] },
    ll: { slots: 3, fixed: [MICRO_MECH_UPPER_LEG, MICRO_MECH_LOWER_LEG] },
    rl: { slots: 3, fixed: [MICRO_MECH_UPPER_LEG, MICRO_MECH_LOWER_LEG] },
    fll: { slots: 3, fixed: [MICRO_MECH_UPPER_LEG, MICRO_MECH_LOWER_LEG] },
    frl: { slots: 3, fixed: [MICRO_MECH_UPPER_LEG, MICRO_MECH_LOWER_LEG] },
};

export const MICRO_MECH_LOCATIONS: Record<MicroMechLayout, MicroMechLocation[]> = {
    biped: ["head", "torso", "torsoRear", "la", "ra", "ll", "rl"],
    quad: ["head", "torso", "torsoRear", "fll", "frl", "ll", "rl"],
};

export const MICRO_MECH_LOCATION_NAMES: Record<MicroMechLayout, Record<MicroMechLocation, string>> = {
    biped: { head: "Head", torso: "Torso", torsoRear: "Torso (Rear)", la: "Left Arm", ra: "Right Arm", ll: "Left Leg", rl: "Right Leg", fll: "Left Front Leg", frl: "Right Front Leg" },
    quad: { head: "Head", torso: "Torso", torsoRear: "Torso (Rear)", la: "Left Arm", ra: "Right Arm", ll: "Left Rear Leg", rl: "Right Rear Leg", fll: "Left Front Leg", frl: "Right Front Leg" },
};

const ceilTo = (kg: number, step: number): number => Math.ceil(kg / step - 1e-9) * step;
export const ceilToQuarterTonKg = (kg: number): number => ceilTo(kg, MICRO_MECH_QUARTER_TON_KG);

/**
 * Every rule that differs between the two texts. The class reads these fields; it never tests the version itself.
 * Each row was read in both texts on 2026-11-13 (plan "Versions" table; ledger, Chunk A).
 */
export interface IMicroMechVersionRules {
    version: MicroMechVersion;
    name: string;
    source: string;
    layouts: MicroMechLayout[];
    /** Internal structure weight for the tonnage, in kilograms. */
    structureKg: (tons: number) => number;
    /** Engines the text names. */
    engineKinds: string[];
    /** Fusion shielding: the table weight times this, rounded up to the quarter ton. */
    fusionShielding: number;
    /** "twice-fusion": twice this version's fusion engine (6.1.0.2). "mech-ice": the BattleMech ICE weight, unshielded (2019, which states no ICE weight). */
    iceWeight: "twice-fusion" | "mech-ice";
    jumpJetKg: number;
    heatSinkKg: number;
    /** Extra heat sinks the engine may carry; null where the text states no limit. */
    maxExtraHeatSinks: number | null;
    /** Free heat sinks of a fusion engine of this rating (an ICE has none in either text). */
    freeHeatSinks: (rating: number) => number;
    /** "per-10-tons": 1 ton per 10 tons of energy weapons or part. "ten-percent": 10 percent of their weight, up to the quarter ton. */
    powerAmplifiers: "per-10-tons" | "ten-percent";
    armorTypes: MicroMechArmorType[];
    /** Head armor maximum per point of head structure (other locations: 2). */
    headArmorPerStructure: number;
    weaponLocations: "any" | "not-head-or-legs";
    ammoLocations: "any" | "torso";
    /**
     * Part-ton shots. "table": the 6.1.0.2 table's 250 / 500 / 750 kg columns. "fraction-of-ton": the per-ton shots
     * times the fraction, fractions dropped (2019: "SRM-2 .75 tons of ammunition would be 37 rounds").
     */
    ammoShots: "table" | "fraction-of-ton";
    /**
     * What one ammunition slot (up to 1,000 kg) may hold. "weapon-class": any ammunition for one weapon (6.1.0.2's
     * LB-5X example, which the plan follows where its LB-2X example says otherwise). "ammo-type": one ammunition type
     * (2019, which prints only the LB-2X example).
     */
    ammoSlots: "weapon-class" | "ammo-type";
    techBase: string;
    /** Engines that may be sealed for vacuum. */
    vacuumEngines: string[];
    /** Play: the share of damage past the torso structure that reaches the cockpit. */
    torsoOverflowToCockpit: number;
    /** Play: a destroyed gyro. */
    gyroHit: string;
    /**
     * Play: does the -1 agility bonus on Piloting Skill Rolls stay after a gyro hit? 6.1.0.2: "The +1 bonus for
     * piloting is lost and all piloting rolls are at -4". 2019: "all piloting rolls are at +4" (the bonus not named).
     */
    gyroHitKeepsAgilityBonus: boolean;
    /** Play: a Lower Leg Actuator hit also calls for a Piloting Skill Roll whenever the unit runs (2019 only). */
    lowerLegHitRunRoll: boolean;
    /** Play: swamps. */
    swamp: string;
    /** Play: a neurohelmet. */
    neurohelmet: string | null;
    /** Play: an ICE in water. */
    iceInWater: string;
    /** The version whose equipment table, cost and Battle Value this one uses, when it has none of its own. */
    borrowsTablesFrom: MicroMechVersion | null;
}

export const MICRO_MECH_VERSION_RULES: Record<MicroMechVersion, IMicroMechVersionRules> = {
    "6.1.0.2": {
        version: "6.1.0.2",
        name: "Micro-Mechs 6.1.0.2 (revised, with Discord's appendices)",
        source: "\"Micro-Mechs\", version 6.1.0.2, Construction",
        layouts: ["biped", "quad"],
        // "A Micro-Mech's internal structure takes up 10 percent of the unit's weight" (table: 11 tons = 1100 kg).
        structureKg: (tons) => tons * 100,
        engineKinds: ["fusion", "ice"],
        fusionShielding: 1.25,
        iceWeight: "twice-fusion",
        jumpJetKg: 125,
        heatSinkKg: 125,
        maxExtraHeatSinks: 10,
        // NGCFells's ruling 5 (2026-11-13): "divide the engine rating by 10 and round down all fractions".
        freeHeatSinks: (rating) => Math.floor(rating / 10),
        powerAmplifiers: "per-10-tons",
        armorTypes: ["standard"],
        headArmorPerStructure: 2,
        weaponLocations: "any",
        ammoLocations: "any",
        ammoShots: "table",
        ammoSlots: "weapon-class",
        techBase: "is",
        vacuumEngines: ["fusion"],
        torsoOverflowToCockpit: 0.5,
        gyroHit: "The +1 piloting bonus is lost and all Piloting Skill Rolls are at -4 (read: 4 worse); no running or jumping.",
        gyroHitKeepsAgilityBonus: false,
        lowerLegHitRunRoll: false,
        swamp: "Cannot get stuck.",
        neurohelmet: null,
        iceInWater: "An ICE engine floods (destroyed) after two consecutive turns submerged at depth 1 or more, sealed or not.",
        borrowsTablesFrom: null,
    },
    "solarmech-2019": {
        version: "solarmech-2019",
        name: "Solarmech's 2019 post (Micro-Mechs for BattleTech, Part 1)",
        source: "Solarmech, \"Micro-Mechs for BattleTech, Part 1\" (2019), Construction",
        layouts: ["biped"],
        // "10 percent of the unit's weight, rounding all fractions up to the nearest quarter ton" (table: 11 tons = 1.25).
        structureKg: (tons) => ceilToQuarterTonKg(tons * 100),
        engineKinds: ["fusion", "ice", "industrial fusion", "industrial ice", "fuel cell"],
        fusionShielding: 1.5,
        iceWeight: "mech-ice",
        jumpJetKg: 500,
        heatSinkKg: 500,
        maxExtraHeatSinks: null,
        // "divide the engine rating by 25 and round down all fractions a minimum of three free heat sinks".
        freeHeatSinks: (rating) => Math.max(3, Math.floor(rating / 25)),
        powerAmplifiers: "ten-percent",
        armorTypes: ["standard", "industrial"],
        headArmorPerStructure: 3,
        weaponLocations: "not-head-or-legs",
        ammoLocations: "torso",
        ammoShots: "fraction-of-ton",
        ammoSlots: "ammo-type",
        techBase: "is",
        vacuumEngines: ["fusion", "fuel cell"],
        torsoOverflowToCockpit: 1,
        gyroHit: "All Piloting Skill Rolls are at +4; no running or jumping.",
        gyroHitKeepsAgilityBonus: true,
        lowerLegHitRunRoll: true,
        swamp: "Can get stuck, with a -2 bonus (the post: \"a + 2 bonus\") on the Piloting Skill Roll.",
        neurohelmet: "Optional: a further -1 on Piloting Skill Rolls.",
        iceInWater: "An ICE engine is destroyed at depth 1 or more unless a snorkel is deployed; with one, safe to depth 2.",
        borrowsTablesFrom: "6.1.0.2",
    },
};

export const isMicroMechVersion = (value: unknown): value is MicroMechVersion =>
    typeof value === "string" && (MICRO_MECH_VERSIONS as string[]).includes(value);
