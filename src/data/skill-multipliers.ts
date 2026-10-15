import { DEFAULT_RULES_EDITION, btRulesEditions } from "./rules-editions";

/**
 * Battle Value skill multipliers, by rules edition. Every table here is indexed [Gunnery][Piloting]: rows are the
 * Gunnery Skill, columns the Piloting, Driving or Anti-'Mech Skill.
 *
 * - Battledroids to BattleTech, Fourth Edition (1984-1996) have no Battle Value system and so no table.
 *   BattleTech Compendium: The Rules of Warfare (1994) is not in the library and has not been checked.
 * - Master Rules (1998, p.144) and Master Rules, Revised Edition (2001, p.158) print the same table for skills
 *   0 to 7.
 * - Total Warfare's table is the TechManual's (p.315). It has been printed three ways: the 2007 first printing
 *   (Gunnery 0 / Piloting 0 = 3.68), the Battle Value 2.1 revision of 2017 (2.80) and the corrected printings
 *   from 2020 on (2.42), which the replacement Battle Value pages v4.1 (2024) repeat. The newest is used.
 * - The Core Rulebook (2026, p.222) prints the TechManual's current table.
 */

/** How a unit type reads the table: which skill is its column, and which unit types are held to one column. */
export type SkillMultiplierUnitType =
    | "mech"
    | "vehicle"
    | "fighter"
    | "protomech"
    | "battle-armor"
    /** Foot, motorized and jump infantry: the column is the Anti-'Mech Skill. */
    | "infantry"
    | "mechanized-infantry";

export interface IEditionSkillMultipliers {
    /** Where the table is printed. */
    source: string;
    /** [Gunnery][Piloting / Driving / Anti-'Mech]. */
    table: number[][];
    /** Unit types that have no second skill in this edition and read the 5 column. */
    fixedColumnUnitTypes: SkillMultiplierUnitType[];
}

/** The column used by a unit type with no Piloting or Anti-'Mech Skill of its own. */
export const SKILL_MULTIPLIER_FIXED_COLUMN = 5;

// BV Skill Multipliers, BattleTech Master Rules p.144 and Master Rules, Revised Edition p.158.
const MASTER_RULES_TABLE: number[][] = [
    //            PILOTING: 0     1     2     3     4     5     6     7
    /* Gunnery 0 */        [2.05, 2.00, 1.95, 1.90, 1.85, 1.80, 1.75, 1.70],
    /* Gunnery 1 */        [1.85, 1.80, 1.75, 1.70, 1.65, 1.60, 1.55, 1.50],
    /* Gunnery 2 */        [1.65, 1.60, 1.55, 1.50, 1.45, 1.40, 1.35, 1.30],
    /* Gunnery 3 */        [1.45, 1.40, 1.35, 1.30, 1.25, 1.20, 1.15, 1.10],
    /* Gunnery 4 */        [1.25, 1.20, 1.15, 1.10, 1.05, 1.00, 0.95, 0.90],
    /* Gunnery 5 */        [1.15, 1.10, 1.05, 1.00, 0.95, 0.90, 0.85, 0.80],
    /* Gunnery 6 */        [1.05, 1.00, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70],
    /* Gunnery 7 */        [0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60],
];

// BV Skill Multiplier Table, TechManual p.315 (corrected printings from 2020; Battle Value pages v4.1, 2024) and
// Core Rulebook p.222.
const TECH_MANUAL_TABLE: number[][] = [
    //   PILOTING / ANTI-'MECH: 0     1     2     3     4     5     6     7     8
    /* Gunnery 0 */            [2.42, 2.31, 2.21, 2.10, 1.93, 1.75, 1.68, 1.59, 1.50],
    /* Gunnery 1 */            [2.21, 2.11, 2.02, 1.92, 1.76, 1.60, 1.54, 1.46, 1.38],
    /* Gunnery 2 */            [1.93, 1.85, 1.76, 1.68, 1.54, 1.40, 1.35, 1.28, 1.21],
    /* Gunnery 3 */            [1.66, 1.58, 1.51, 1.44, 1.32, 1.20, 1.16, 1.10, 1.04],
    /* Gunnery 4 */            [1.38, 1.32, 1.26, 1.20, 1.10, 1.00, 0.95, 0.90, 0.85],
    /* Gunnery 5 */            [1.31, 1.19, 1.13, 1.08, 0.99, 0.90, 0.86, 0.81, 0.77],
    /* Gunnery 6 */            [1.24, 1.12, 1.07, 1.02, 0.94, 0.85, 0.81, 0.77, 0.72],
    /* Gunnery 7 */            [1.17, 1.06, 1.01, 0.96, 0.88, 0.80, 0.76, 0.72, 0.68],
    /* Gunnery 8 */            [1.10, 0.99, 0.95, 0.90, 0.83, 0.75, 0.71, 0.68, 0.64],
];

/**
 * The table each rules edition uses, by edition tag. An edition that is not listed has no Battle Value skill
 * multipliers: its units' Battle Values are not adjusted for skill.
 */
export const SKILL_MULTIPLIERS_BY_EDITION: Record<string, IEditionSkillMultipliers> = {
    "master-rules": {
        source: "BattleTech Master Rules p.144",
        table: MASTER_RULES_TABLE,
        // "Infantry units have no Piloting Skill; simply use the 5 column of the table."
        fixedColumnUnitTypes: ["infantry", "mechanized-infantry", "battle-armor"],
    },
    "master-rules-revised": {
        source: "BattleTech Master Rules, Revised Edition p.158",
        table: MASTER_RULES_TABLE,
        // As Master Rules, and: "Because ProtoMech pilots have no Piloting Skill ... use the 5 column".
        fixedColumnUnitTypes: ["infantry", "mechanized-infantry", "battle-armor", "protomech"],
    },
    "total-warfare": {
        source: "TechManual p.315",
        table: TECH_MANUAL_TABLE,
        // ProtoMechs have no Piloting Skill; mechanized infantry adjust Gunnery only (TM p.314). Other infantry and
        // battle armor use their Anti-'Mech Skill as the column.
        fixedColumnUnitTypes: ["protomech", "mechanized-infantry"],
    },
    "core-rulebook": {
        source: "BattleTech Core Rulebook p.222",
        table: TECH_MANUAL_TABLE,
        fixedColumnUnitTypes: ["protomech", "mechanized-infantry"],
    },
};

/** The edition's table and how it is read, or null when the edition has no Battle Value skill multipliers. */
export const getEditionSkillMultipliers = (edition: string = DEFAULT_RULES_EDITION): IEditionSkillMultipliers | null => {
    return Object.prototype.hasOwnProperty.call(SKILL_MULTIPLIERS_BY_EDITION, edition) ? SKILL_MULTIPLIERS_BY_EDITION[edition] : null;
};

/** Editions, oldest first, that adjust Battle Value for skill. */
export const getEditionsWithSkillMultipliers = (): string[] =>
    btRulesEditions.map((edition) => edition.tag).filter((tag) => getEditionSkillMultipliers(tag) !== null);

/**
 * The Battle Value multiplier for a unit's skills under one rules edition. `piloting` is the unit's Piloting,
 * Driving or Anti-'Mech Skill; it is ignored for a unit type the edition holds to the 5 column. Null when the
 * edition has no table, or a skill lies outside it.
 */
export const getSkillMultiplier = (
    gunnery: number,
    piloting: number,
    unitType: SkillMultiplierUnitType = "mech",
    edition: string = DEFAULT_RULES_EDITION,
): number | null => {
    const multipliers = getEditionSkillMultipliers(edition);
    if (!multipliers) return null;
    const column = multipliers.fixedColumnUnitTypes.includes(unitType) ? SKILL_MULTIPLIER_FIXED_COLUMN : piloting;
    return multipliers.table[gunnery]?.[column] ?? null;
};
