import { IEditionHistory } from "./data-interfaces";

/**
 * The unit types quirks are graded for: the six columns of Campaign Operations' quirk tables (CO p.228 on).
 * Their footnotes fold IndustrialMechs and OmniMechs into "mech", support vehicles into "vehicle", fixed-wing support
 * vehicles and airships into "fighter-small-craft", and satellites into "large-craft". ProtoMechs, infantry and
 * buildings have no column and take no quirks.
 */
export type QuirkUnitType = "mech" | "vehicle" | "battle-armor" | "fighter-small-craft" | "dropship" | "large-craft";

/** What a quirk is assigned to: the whole unit, one location, or one mounted weapon. */
export type QuirkAttach = "unit" | "location" | "weapon";

export interface IQuirkSource {
    book: string;
    page: number;
}

/**
 * A quirk's point cost, as printed. Exactly one of `points`, `choices`, `per`, `byAttach` or `fromParameter`:
 *   - `points`: a fixed cost;
 *   - `choices`: the costs the player picks from (Rugged 1 or 2), or, for a quirk whose `parameter` lists options,
 *     the cost of each option in the same order (Improved Targeting by range band);
 *   - `per`: points per so much damage "or fraction thereof", of the weapon or of all the unit's weapons;
 *   - `byAttach`: a cost for each thing the quirk can be attached to (EM Interference: 1 on a weapon, 2 on the unit);
 *   - `fromParameter`: the assigned numeric parameter is the cost (Weak Head Armor: the armor points lost).
 * `zeroDamagePoints` is the cost of a `per` quirk on a weapon that deals no damage.
 */
export interface IQuirkCost {
    points?: number;
    choices?: number[];
    per?: { points: number; damage: number; scope: "weapon" | "unit" };
    zeroDamagePoints?: number;
    byAttach?: { [attach in QuirkAttach]?: number };
    fromParameter?: true;
}

/** The locations a quirk may go on: Barrel Fist and Battlefists by the arm's actuators (CO p.225). */
export type QuirkLocationRule = "arm-without-hand" | "arm-with-hand" | "torso";

/** A location a builder offers quirks, with what location rules read. */
export interface IQuirkLocation {
    tag: string;
    label: string;
    /** An arm, not a quad's front leg. */
    arm?: boolean;
    torso?: boolean;
    lowerArm?: boolean;
    hand?: boolean;
}

export interface IQuirk {
    tag: string;
    name: string;
    /** Other spellings used by the books, SSW and MegaMek; lookups match these too. */
    altNames: string[];
    kind: "positive" | "negative";
    cost: IQuirkCost;
    unitTypes: QuirkUnitType[];
    /** The footnote restrictions as printed (VTOL only, quads only...), shown to the player, not enforced. */
    restrictions?: string;
    /** What the quirk may be attached to, in the order the builder offers them. */
    attaches: QuirkAttach[];
    parameter?: { kind: "range-band" | "value" | "locations"; options?: string[] };
    /** The locations it may go on; on the whole unit it needs at least one of them. */
    locationRule?: QuirkLocationRule;
    /** Cost choices only a quad 'Mech may take (the 3-point Directional Torso Mount is a turret, CO p.226). */
    quadOnlyChoices?: number[];
    /** Assigned at most once per unit, whatever it is attached to (Battlefists is paid once, CO p.225). */
    once?: true;
    /** Tags of quirks a unit may not carry with this one. */
    excludes?: string[];
    /** One or two sentences in our own words; never the rulebook's text. */
    summary: string;
    sources: IQuirkSource[];
    editions: string[];
    editionLevels?: { [editionTag: string]: number };
    rulesLevel: number;
    apocryphalIn?: IEditionHistory["apocryphalIn"];
    custom?: true;
}

/** A quirk on a unit, as saved. It is attached to `equipmentUuid` when set, else to `location` when set, else to the unit. */
export interface IAssignedQuirk {
    tag: string;
    parameter?: string | number;
    location?: string;
    equipmentUuid?: string;
    /** The years the assignment applies, inclusive; either end may be open. */
    fromYear?: number;
    toYear?: number;
}

/** What a unit offers quirks to attach to, and the damage its quirk costs are priced from. */
export interface IQuirkTargets {
    locations: IQuirkLocation[];
    weapons: { uuid: string; label: string; maxDamage: number }[];
    /** The maximum damage of all the unit's non-physical weapons together, for unit-wide damage costs. */
    unitMaxDamage: number;
    /** A quad 'Mech (QuadVees included), for the quad-only cost choices. */
    quad?: boolean;
}
