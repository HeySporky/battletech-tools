
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

import { FutureWarsWeightClass, getFutureWarsWeightClass } from "./future-wars-construction";

// Clell Flint's four-legged 'Mechs, "walkers" (#172): a unit type of their own (owner ruling 2, 2026-11-13). Read on
// the page images of both printings: Future Wars #11, "Rules for Building 4 Legged Mechs in BattleTech", pp.25-27,
// and The Best of Future Wars, Volume One (1991), "Optional Rules for Building Walkers", printed pp.36-38 (PDF 45-47).
// Every rule that differs between the printings is a field of WALKER_EDITION_RULES (owner ruling 3: editions).
// Plan: docs/superpowers/plans/2026-11-13-future-wars-walkers.md.

export type WalkerEdition = "future-wars-11" | "best-of-1991";
export const WALKER_EDITIONS: readonly WalkerEdition[] = ["best-of-1991", "future-wars-11"];
/** The Best-of is the text of record (owner ruling 3). A save with no edition was made under it. */
export const WALKER_DEFAULT_EDITION: WalkerEdition = "best-of-1991";

export const isWalkerEdition = (value: unknown): value is WalkerEdition => (WALKER_EDITIONS as readonly unknown[]).includes(value);

export interface IWalkerEditionRules {
    tag: WalkerEdition;
    name: string;
    /** Where the walker rules are printed, for the credit. */
    source: string;
    /** Base to-hit of the center torso's anti-infantry weapons, as printed (#11: a slashed zero; Best-of: 8). */
    antiInfantryBaseToHit: number;
    /** Variant slots of an assault walker's control section (#11: 16; Best-of: 14). */
    assaultControlSlots: number;
    /** #11's rule for an immobilized walker standing on every leg; the Best-of does not print it. */
    immobilizedKnockOver: string | null;
    /** The firing arcs: #11 prints a hex diagram (p.27); the Best-of points to a sheet it does not reprint. */
    firingArcs: string;
}

export const WALKER_EDITION_RULES: Record<WalkerEdition, IWalkerEditionRules> = {
    "future-wars-11": {
        tag: "future-wars-11",
        name: "Future Wars #11",
        source: "Clell Flint, 'Rules for Building 4 Legged Mechs in BattleTech', Future Wars #11, pp.25-27",
        antiInfantryBaseToHit: 0,
        assaultControlSlots: 16,
        immobilizedKnockOver: "A walker immobilized with at least one structure point in each leg, and not knocked over when it was immobilized, "
            + "can be knocked over only by another 'Mech pushing it, until one leg loses all its structure (Future Wars #11, p.26).",
        firingArcs: "Six arcs, one to a hex face, clockwise: front, right front, right rear, rear, left rear, left front (Future Wars #11, "
            + "p.25); the diagram on p.27 marks the front, side, rear and turret arcs.",
    },
    "best-of-1991": {
        tag: "best-of-1991",
        name: "The Best of Future Wars, Volume One (1991)",
        source: "Clell Flint, 'Optional Rules for Building Walkers', The Best of Future Wars, Volume One (1991), pp.36-38",
        antiInfantryBaseToHit: 8,
        assaultControlSlots: 14,
        immobilizedKnockOver: null,
        firingArcs: "The Best of Future Wars refers to a firing arc sheet it does not reprint (p.36); the arcs of Future Wars #11 (p.27) "
            + "are used (ours).",
    },
};

/** "Walker rules by Clell Flint, ..." naming the edition in use (plan, Global Constraints). */
export function getWalkerCredit(edition: WalkerEdition): string {
    return `Walker rules by Clell Flint, Future Wars #11; reprinted in The Best of Future Wars, Volume One (1991). `
        + `Built under the ${WALKER_EDITION_RULES[edition].name} printing.`;
}

/**
 * The ten locations. Best-of p.36 lists nine in its text and leaves out the rear torso, but its slot chart ("Lt/Rt/Fr/Rr
 * Torso", p.37) and its hit table ("Fr/(Rr) Torso") have one, as #11 has. The rear torso is `rrt`, never `rt`.
 */
export type WalkerLocation = "rfl" | "rrl" | "lfl" | "lrl" | "ft" | "rrt" | "rt" | "lt" | "ct" | "cs";
export const WALKER_LOCATIONS: readonly WalkerLocation[] = ["cs", "ft", "lt", "ct", "rt", "rrt", "lfl", "rfl", "lrl", "rrl"];
export const WALKER_LEGS: readonly WalkerLocation[] = ["lfl", "rfl", "lrl", "rrl"];
export const WALKER_OUTER_TORSOS: readonly WalkerLocation[] = ["ft", "lt", "rt", "rrt"];
export const WALKER_LOCATION_NAMES: Record<WalkerLocation, string> = {
    cs: "Control Section", ft: "Front Torso", lt: "Left Torso", ct: "Center Torso", rt: "Right Torso", rrt: "Rear Torso",
    lfl: "Left Front Leg", rfl: "Right Front Leg", lrl: "Left Rear Leg", rrl: "Right Rear Leg",
};
export const isWalkerLocation = (value: unknown): value is WalkerLocation => (WALKER_LOCATIONS as readonly unknown[]).includes(value);

export const WALKER_MIN_TONS = 10;
export const WALKER_MAX_TONS = 100;
/** The structure table steps by 5 tons. */
export const WALKER_TON_STEP = 5;

export interface IWalkerStructureRow {
    tons: number;
    centerTorso: number;
    /** Front, rear, left and right torso. */
    otherTorso: number;
    leg: number;
    controlSection: number;
}

/** "Internal Structure For Walkers", Best-of p.37 (= #11 p.26), read on both page images. Weight: 10 percent of tonnage. */
export const walkerStructureTable: readonly IWalkerStructureRow[] = ([
    [10, 1, 2, 1, 2], [15, 2, 2, 2, 2], [20, 3, 3, 3, 3], [25, 4, 4, 4, 4], [30, 5, 5, 5, 5],
    [35, 6, 6, 6, 6], [40, 6, 7, 6, 7], [45, 7, 8, 7, 8], [50, 8, 10, 8, 10], [55, 9, 11, 9, 11],
    [60, 10, 12, 10, 12], [65, 10, 13, 10, 13], [70, 11, 14, 11, 14], [75, 12, 15, 12, 15], [80, 13, 15, 13, 15],
    [85, 14, 16, 14, 16], [90, 15, 17, 15, 17], [95, 16, 18, 16, 18], [100, 17, 19, 17, 19],
] as const).map(([tons, centerTorso, otherTorso, leg, controlSection]) => ({ tons, centerTorso, otherTorso, leg, controlSection }));

export function getWalkerStructureRow(tons: number): IWalkerStructureRow | undefined {
    return walkerStructureTable.find((row) => row.tons === tons);
}

/** Internal structure points of a location at this tonnage; 0 off the table. */
export function getWalkerStructure(location: WalkerLocation, tons: number): number {
    const row = getWalkerStructureRow(tons);
    if (!row) return 0;
    if (location === "ct") return row.centerTorso;
    if (location === "cs") return row.controlSection;
    return WALKER_LEGS.includes(location) ? row.leg : row.otherTorso;
}

/** Variant slot counts by class (Best-of pp.37-38; #11 p.27): leg, outer torso, center torso, control section. */
const VARIANT_SLOTS: Record<FutureWarsWeightClass, { leg: number; torso: number; centerTorso: number; control: number | "edition" }> = {
    light: { leg: 6, torso: 6, centerTorso: 8, control: 7 },
    medium: { leg: 8, torso: 8, centerTorso: 10, control: 8 },
    heavy: { leg: 10, torso: 10, centerTorso: 12, control: 12 },
    assault: { leg: 12, torso: 12, centerTorso: 14, control: "edition" },
};

/**
 * Critical slots of a location. Standard rules (Best-of p.37): one table of six for each leg and each outer torso, two
 * (12) for the center torso and the control section. `variant` (a Future Wars construction ruleset ticked): Flint's
 * counts by weight class, the assault control section by edition.
 */
export function getWalkerSlotCount(location: WalkerLocation, tons: number, variant: boolean, edition: WalkerEdition): number {
    const weightClass = variant ? getFutureWarsWeightClass(tons) : undefined;
    if (!weightClass) return location === "ct" || location === "cs" ? 12 : 6;
    const row = VARIANT_SLOTS[weightClass.tag];
    if (location === "ct") return row.centerTorso;
    if (location === "cs") return row.control === "edition" ? WALKER_EDITION_RULES[edition].assaultControlSlots : row.control;
    return WALKER_LEGS.includes(location) ? row.leg : row.torso;
}

export interface IWalkerTurret {
    slots: number;
    tons: number;
}

/** The turret mechanism (Best-of p.36): 2 slots and 3 tons by the standard rules; by class under the variant. */
export function getWalkerTurret(tons: number, variant: boolean): IWalkerTurret {
    const weightClass = variant ? getFutureWarsWeightClass(tons) : undefined;
    if (!weightClass) return { slots: 2, tons: 3 };
    return ({
        light: { slots: 1, tons: 2 },
        medium: { slots: 2, tons: 3 },
        heavy: { slots: 3, tons: 4.5 },
        assault: { slots: 4, tons: 6 },
    } as const)[weightClass.tag];
}

/**
 * Engines offered (ours, plan "Ours"): the fusion types of the 'Mech engine table, to rating 400. No ICE, fuel cell,
 * fission or primitive engine (no industrial walker in the first build), no large engine.
 */
export const WALKER_ENGINE_TYPES = ["standard", "xl", "clan_xl", "light", "compact", "xxl", "clan_xxl"] as const;
export type WalkerEngineType = typeof WALKER_ENGINE_TYPES[number];
/** Gyros offered: every 'Mech gyro but "none" (which serves the interface cockpit only). */
export const WALKER_GYRO_TYPES = ["standard", "xl", "compact", "heavy-duty"] as const;
export type WalkerGyroType = typeof WALKER_GYRO_TYPES[number];
export const WALKER_MAX_ENGINE_RATING = 400;
