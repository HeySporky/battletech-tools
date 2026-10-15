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
 * Smart Robotic Control System (SRCS), IO:AE pp.134-135: a unit that fights on its own, with no crew at the
 * controls. "Introduced: Early spaceflight"; Advanced rules. Only the basic SRCS and its "Improved" grade are
 * here; the shielded aerospace SRCS, the SDS (Caspar) and Caspar II systems are not built yet.
 */
export type RoboticControlTag = "none" | "srcs" | "srcs-improved";

export type RoboticUnitType = "industrialmech" | "battlemech" | "combat-vehicle" | "support-vehicle" | "conventional-fighter"
    | "aerospace-fighter" | "small-craft" | "dropship" | "jumpship" | "space-station";

export interface IRoboticControlSystem {
    tag: RoboticControlTag;
    name: string;
}

export const ROBOTIC_CONTROL_SYSTEMS: IRoboticControlSystem[] = [
    { tag: "none", name: "None (crewed)" },
    { tag: "srcs", name: "Smart Robotic Control System" },
    { tag: "srcs-improved", name: "Smart Robotic Control System (Improved)" },
];

/** "Rules Level: Advanced" (IO:AE p.134). */
export const SRCS_RULES_LEVEL = 3;

/** "multiply its final BV by 0.85 to reflect its robotic controls" (IO:AE p.187). */
export const SRCS_BATTLE_VALUE_MULTIPLIER = 0.85;

// Smart Robotic Control Systems Table (IO:AE p.135): Gunnery, Piloting/Driving and mass as a share of the unit.
// JumpShips take their share of the mass left after the K-F drive.
const SRCS_TABLE: Record<RoboticUnitType, { gunnery: number; piloting: number; massFraction: number }> = {
    "industrialmech": { gunnery: 7, piloting: 9, massFraction: 0.05 },
    "battlemech": { gunnery: 5, piloting: 9, massFraction: 0.05 },
    "combat-vehicle": { gunnery: 5, piloting: 6, massFraction: 0.05 },
    "support-vehicle": { gunnery: 6, piloting: 6, massFraction: 0.05 },
    "conventional-fighter": { gunnery: 5, piloting: 6, massFraction: 0.05 },
    "aerospace-fighter": { gunnery: 5, piloting: 6, massFraction: 0.05 },
    "small-craft": { gunnery: 5, piloting: 6, massFraction: 0.05 },
    "dropship": { gunnery: 5, piloting: 6, massFraction: 0.07 },
    "jumpship": { gunnery: 5, piloting: 6, massFraction: 0.10 },
    "space-station": { gunnery: 5, piloting: 6, massFraction: 0.07 },
};

// "Improved": -1 to each Skill for another 2 percent of the unit's mass, or 1 ton under 10 tons; one improvement at
// most, for BattleMechs, Combat Vehicles, Aerospace Fighters, Small Craft, DropShips, JumpShips and Space Stations.
const IMPROVABLE: RoboticUnitType[] = ["battlemech", "combat-vehicle", "aerospace-fighter", "small-craft", "dropship", "jumpship", "space-station"];

export function getRoboticControlSystem(tag: string | undefined): IRoboticControlSystem {
    return ROBOTIC_CONTROL_SYSTEMS.find((system) => system.tag === tag) ?? ROBOTIC_CONTROL_SYSTEMS[0];
}

/** Robotic control systems a unit type can mount: the Improved grade only where the table allows it. */
export function getRoboticControlSystemsFor(unitType: RoboticUnitType): IRoboticControlSystem[] {
    return ROBOTIC_CONTROL_SYSTEMS.filter((system) => system.tag !== "srcs-improved" || IMPROVABLE.includes(unitType));
}

/** The Gunnery and Piloting/Driving Skills the SRCS gives the unit; null for a crewed unit. */
export function getRoboticSkills(unitType: RoboticUnitType, tag: RoboticControlTag): { gunnery: number; piloting: number } | null {
    if (tag === "none") return null;
    const row = SRCS_TABLE[unitType];
    const improvement = tag === "srcs-improved" && IMPROVABLE.includes(unitType) ? 1 : 0;
    return { gunnery: row.gunnery - improvement, piloting: row.piloting - improvement };
}

/**
 * Mass of the SRCS on top of the unit's own cockpit or controls (IO:AE p.135): none under 10 tons (1 ton for the
 * Improved grade), otherwise the table's share of the unit's mass, plus 2 percent for the Improved grade, "rounded
 * up to the nearest .5 tons" by `round`.
 */
export function getRoboticControlWeight(unitType: RoboticUnitType, tag: RoboticControlTag, tonnage: number,
    round: (weight: number) => number): number {
    if (tag === "none") return 0;
    const improved = tag === "srcs-improved" && IMPROVABLE.includes(unitType);
    if (tonnage < 10) return improved ? 1 : 0;
    return round(tonnage * (SRCS_TABLE[unitType].massFraction + (improved ? 0.02 : 0)));
}

/** "5,000+(10,000xIT)", IT being the SRCS's own tonnage (Additional Alternate Era Weapons and Equipment Table, IO:AE p.215). */
export function getRoboticControlCost(tag: RoboticControlTag, weight: number): number {
    return tag === "none" ? 0 : 5000 + 10000 * weight;
}
