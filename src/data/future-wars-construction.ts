
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

// Clell Flint, "Alternate Rules for Building Mechs in BattleTech" (#172, "Compact 'Mechs"): the number of critical
// slots in each location, the head, the cockpit, the engine's and the gyro's slots all go by the 'Mech's weight
// class. Read on the page images of The Best of Future Wars, Volume One (1991), printed pp.35-36; the first printing,
// Future Wars #11 p.24, prints the same tables for two-legged 'Mechs. Flint's four-legged walkers are a unit type of
// their own (docs/superpowers/plans/2026-11-13-future-wars-walkers.md).

/** The two printings, as two Special Rulesets with the same rules (owner ruling 3, 2026-11-13). Best-of first. */
export const FUTURE_WARS_CONSTRUCTION_RULESETS = ["best-of-future-wars-construction", "future-wars-11-construction"] as const;

export type FutureWarsWeightClass = "light" | "medium" | "heavy" | "assault";

export interface IFutureWarsWeightClass {
    tag: FutureWarsWeightClass;
    name: string;
    /** Heaviest tonnage of the class, as printed ("Light Mechs (0-35 tons)"). */
    maxTons: number;
    /** Critical slots in each location (Best-of p.35). */
    slots: { head: number; arm: number; leg: number; sideTorso: number; centerTorso: number };
    /** Internal structure of the head (Best-of p.35). Head armor is at most twice this. */
    headStructure: number;
}

export const FUTURE_WARS_WEIGHT_CLASSES: readonly IFutureWarsWeightClass[] = [
    { tag: "light", name: "Light", maxTons: 35, slots: { head: 5, arm: 6, leg: 7, sideTorso: 7, centerTorso: 11 }, headStructure: 3 },
    { tag: "medium", name: "Medium", maxTons: 55, slots: { head: 6, arm: 8, leg: 10, sideTorso: 10, centerTorso: 14 }, headStructure: 4 },
    { tag: "heavy", name: "Heavy", maxTons: 75, slots: { head: 7, arm: 10, leg: 12, sideTorso: 12, centerTorso: 18 }, headStructure: 5 },
    { tag: "assault", name: "Assault", maxTons: 100, slots: { head: 8, arm: 12, leg: 16, sideTorso: 16, centerTorso: 20 }, headStructure: 6 },
];

/** The class of a 'Mech of this tonnage; over 100 tons there is none (Flint's tables stop at 100). */
export function getFutureWarsWeightClass(tons: number): IFutureWarsWeightClass | undefined {
    if (!(tons > 0) || tons > 100) return undefined;
    return FUTURE_WARS_WEIGHT_CLASSES.find((weightClass) => tons <= weightClass.maxTons);
}

/** Location tags and critical table names to the row of the slot table. */
const LOCATION_ROWS: Record<string, keyof IFutureWarsWeightClass["slots"]> = {
    hd: "head", head: "head",
    ct: "centerTorso", centertorso: "centerTorso",
    lt: "sideTorso", rt: "sideTorso", lefttorso: "sideTorso", righttorso: "sideTorso",
    la: "arm", ra: "arm", leftarm: "arm", rightarm: "arm",
    ll: "leg", rl: "leg", leftleg: "leg", rightleg: "leg",
};

/** Critical slots of a two-legged 'Mech's location at this tonnage, or undefined for a location the table lacks. */
export function getFutureWarsSlots(tons: number, location: string): number | undefined {
    const weightClass = getFutureWarsWeightClass(tons);
    const row = LOCATION_ROWS[(location || "").trim().toLowerCase()];
    return weightClass && row ? weightClass.slots[row] : undefined;
}

/**
 * Center torso slots of an engine of this weight (Best-of p.36): 0.5-4.0 tons 4, 4.5-6.0 5, 6.5-9.0 6, 9.5-12.0 7,
 * 12.5-16.0 8, 16.5-30.0 9, 30.5 and up 10. The printed bands step by the half ton; a weight between them (Fractional
 * Accounting) takes the band it does not exceed (ours). No engine, no slots.
 */
export function getFutureWarsEngineSlots(engineTons: number): number {
    if (!(engineTons > 0)) return 0;
    const bands: [number, number][] = [[4, 4], [6, 5], [9, 6], [12, 7], [16, 8], [30, 9]];
    return bands.find(([upTo]) => engineTons <= upTo)?.[1] ?? 10;
}

/** "Gyroscopes take up one critical space per ton" (Best-of p.36); a part ton takes a whole slot (ours). */
export function getFutureWarsGyroSlots(gyroTons: number): number {
    return gyroTons > 0 ? Math.ceil(gyroTons) : 0;
}

export interface IFutureWarsCockpit {
    tons: number;
    /** Head slots of the cockpit itself. */
    slots: number;
    /** Head slots of its life support, whose weight is in the cockpit's. */
    lifeSupportSlots: number;
    /** Who it seats, as the article says. */
    seats: string;
}

/**
 * The cockpit (Best-of p.35): a light 'Mech's is 2 tons, 1 slot and 1 life support slot, pilot only; a medium's and
 * most heavies' 3 tons, 1 slot, 1 life support, with room to squeeze in a passenger; an assault's and a few
 * heavies' 4 tons, 2 slots and 2 life support, for a pilot, a gunner and, in an emergency, a passenger. `large`
 * picks the 4-ton cockpit for a heavy 'Mech and is ignored for the other classes.
 */
export function getFutureWarsCockpit(tons: number, large: boolean = false): IFutureWarsCockpit | undefined {
    const weightClass = getFutureWarsWeightClass(tons);
    if (!weightClass) return undefined;
    if (weightClass.tag === "light") return { tons: 2, slots: 1, lifeSupportSlots: 1, seats: "pilot only" };
    if (weightClass.tag === "assault" || (weightClass.tag === "heavy" && large)) {
        return { tons: 4, slots: 2, lifeSupportSlots: 2, seats: "pilot, gunner and an emergency passenger" };
    }
    return { tons: 3, slots: 1, lifeSupportSlots: 1, seats: "pilot and a passenger" };
}

/** Sensors take two head slots on every 'Mech (Best-of p.35). */
export const FUTURE_WARS_SENSOR_SLOTS = 2;
/** Special or additional sensors, and extra life support: one more slot and half a ton each (Best-of p.35). */
export const FUTURE_WARS_EXTRA_SLOT_TONS = 0.5;
