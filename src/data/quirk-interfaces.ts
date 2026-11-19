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

export type QuirkRangeBand = "short" | "medium" | "long";

/**
 * What a quirk does in play, from the page its record cites. Play applies an effect where the app works out that
 * number (to-hit, heat, Initiative) and lists the rest on the unit's play panel. Phrases (`when`, `of`, `trigger`,
 * `outcome`, `note`) are in our own words.
 *   - `to-hit`: the unit's own attacks; `rangeBand: "parameter"` takes the band the quirk was assigned with; `attack`
 *     is "weapon" when absent; `attackerRanOrFlanked` only after running or flanking (Stabilized Weapon).
 *   - `to-hit-against`: attacks made on the unit.
 *   - `initiative`: the side's Initiative; a side takes its largest, never the sum (CO p.225).
 *   - `heat-generated`: the unit's heat built up each turn, never below zero (Combat Computer).
 *   - `weapon-heat`: heat of the quirk's weapon when fired, never below `minimum`.
 *   - `roll`: a modifier to a roll the app does not make (Piloting, Control, repair...).
 *   - `triggered-roll`: a 2D6 roll for `target`+ after `trigger`.
 *   - `multiplier`: a time, value or rate multiplied.
 *   - `damage`: how damage to or by the unit changes.
 */
export type QuirkEffect =
    | {
        type: "to-hit"; modifier: number; scope: "unit" | "weapon" | "location"; rangeBand?: QuirkRangeBand | "parameter";
        vsAirborne?: true; attack?: "weapon" | "punch" | "arm-physical" | "physical"; attackerRanOrFlanked?: true;
    }
    | { type: "to-hit-against"; modifier: number; when: string }
    | { type: "initiative"; modifier: number }
    | { type: "heat-generated"; modifier: number }
    | { type: "weapon-heat"; modifier: number; minimum?: number }
    | { type: "roll"; roll: string; modifier: number; when?: string }
    | { type: "triggered-roll"; target: number; trigger: string; outcome: string }
    | { type: "multiplier"; of: string; value: number }
    | { type: "damage"; note: string };

/** A quirk as the Alpha Strike Companion has it (pp.59-67): only these quirks act in Alpha Strike play (ASC p.59). */
export interface IQuirkAlphaStrike {
    /** Quirk points; one per range band for Improved and Poor Targeting, "variable" when priced by damage. */
    cost: number | number[] | "variable";
    page: number;
    /** Empty when the Companion's rule is not one the app applies. */
    effects: QuirkEffect[];
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
    /** Only on a weapon or bay that makes heat (Improved Cooling Jacket; user ruling 2026-10-22). */
    heatOnly?: boolean;
    /** Cost choices only a quad 'Mech may take (the 3-point Directional Torso Mount is a turret, CO p.226). */
    quadOnlyChoices?: number[];
    /** Assigned at most once per unit, whatever it is attached to (Battlefists is paid once, CO p.225). */
    once?: true;
    /** Tags of quirks a unit may not carry with this one. */
    excludes?: string[];
    /** One or two sentences in our own words; never the rulebook's text. */
    summary: string;
    sources: IQuirkSource[];
    /** What it does in play; absent or empty means "not yet applied in play". */
    effects?: QuirkEffect[];
    /** Present only when the Alpha Strike Companion lists the quirk. */
    alphaStrike?: IQuirkAlphaStrike;
    editions: string[];
    editionLevels?: { [editionTag: string]: number };
    rulesLevel: number;
    apocryphalIn?: IEditionHistory["apocryphalIn"];
    custom?: true;
}

/**
 * A quirk on a unit, as saved. It is attached to the weapon bay of `bayUuids` when set, else to `equipmentUuid`, else
 * to `location`, else to the unit.
 */
export interface IAssignedQuirk {
    tag: string;
    /** The ids of the bay's weapons when assigned: a bay quirk goes on all of them, paid once (CO p.225). */
    bayUuids?: string[];
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
    weapons: { uuid: string; label: string; maxDamage: number; heat?: number }[];
    /** The maximum damage of all the unit's non-physical weapons together, for unit-wide damage costs. */
    unitMaxDamage: number;
    /**
     * Weapon bays, on craft that fire them: each bay is one weapon target, priced from its largest Attack Value
     * (CO p.225). Their weapons are not listed in `weapons`.
     */
    bays?: { uuids: string[]; label: string; maxDamage: number; heat?: number }[];
    /** A quad 'Mech (QuadVees included), for the quad-only cost choices. */
    quad?: boolean;
}
