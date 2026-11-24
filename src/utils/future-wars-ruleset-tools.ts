import { getFutureWarsPlayRules } from "../data/future-wars-play-rules";

/**
 * Best of Future Wars (#172), Chunk E: the numbers behind the five play-rule rulesets' tools in roster play, as plain
 * functions `BattleMech`, the to-hit and the play panel read. Pages are the printed pages of *The Best of Future Wars,
 * Volume One* (1991); the rules summaries and full tables are in `src/data/future-wars-play-rules.ts`.
 */

export const FW_OPPORTUNITY_FIRE = "fw-opportunity-fire";
export const FW_STRATEGIC_MOVEMENT = "fw-strategic-movement";
export const FW_MORALE = "fw-morale";
export const FW_WEAPON_MALFUNCTIONS = "fw-weapon-malfunctions";
export const FW_LONG_RANGE_WARS = "fw-long-range-wars";
// The original printings (#172, printing alternates): each refuses its Best of Future Wars twin above.
export const FW_MORALE_17 = "fw-morale-17";
export const FW_WEAPON_MALFUNCTIONS_9 = "fw-weapon-malfunctions-9";
export const FW_LONG_RANGE_WARS_12 = "fw-long-range-wars-12";
/** The equipment rules as the original issues printed them (Power Booster, Inferno Gauss, LR Flamer, PDS, Swing Fire). */
export const FW_EQUIPMENT_FIRST_PRINTINGS = "fw-equipment-first-printings";

/** Which printing a Future Wars rule follows: the 1991 reprint, or the issue it first appeared in. */
export type FutureWarsPrinting = "best-of" | "original";
export type FutureWarsPrintedRule = "morale" | "malfunctions" | "longRangeWars";

export const FUTURE_WARS_PRINTING_IDS: Record<FutureWarsPrintedRule, Record<FutureWarsPrinting, string>> = {
    morale: { "best-of": FW_MORALE, original: FW_MORALE_17 },
    malfunctions: { "best-of": FW_WEAPON_MALFUNCTIONS, original: FW_WEAPON_MALFUNCTIONS_9 },
    longRangeWars: { "best-of": FW_LONG_RANGE_WARS, original: FW_LONG_RANGE_WARS_12 },
};

/** A table row's text, read from the rules summary so the two never drift apart. */
const rowText = (rulesetId: string, titleStart: string, label: string): string => {
    const table = getFutureWarsPlayRules(rulesetId)?.tables.find((entry) => entry.title.startsWith(titleStart));
    return table?.rows.find(([key]) => key === label)?.[1] ?? "";
};

// --- Strategic Movement, pp.18-19.

/** Walking and running MP doubled. */
export function getStrategicMovementMP(walk: number, run: number): { walk: number; run: number } {
    return { walk: walk * 2, run: run * 2 };
}

/**
 * Heat for a Strategic Movement move: 2, plus 1 a walking MP or 2 a running MP beyond the unit's normal MP (the
 * article's Atlas, 3 / 5, runs 10 for 12 heat; Chunk D's ruling on "every MP used").
 */
export function getStrategicMovementHeat(mode: "w" | "r", mp: number, walk: number, run: number): number {
    return mode === "w" ? 2 + Math.max(0, mp - walk) : 2 + 2 * Math.max(0, mp - run);
}

// --- Opportunity Fire, p.17.

export type OpportunityFireBand = "short" | "medium" | "long";
export type OpportunityFireTargetMove = "walked" | "ran" | "jumped";

const OPPORTUNITY_FIRE_BASE: Record<OpportunityFireBand, number> = { short: 6, medium: 8, long: 10 };
const OPPORTUNITY_FIRE_TARGET: Record<OpportunityFireTargetMove, number> = { walked: 0, ran: 1, jumped: 2 };
/** The firer moved this turn. */
export const OPPORTUNITY_FIRE_FIRER_MOVED = 2;
/** The firer's other weapons in the Weapon Attack Phase. */
export const OPPORTUNITY_FIRE_OTHER_WEAPONS = 1;

/** An opportunity shot's to-hit: 6 / 8 / 10 at Gunnery 4 (NGCFells's: another skill moves it by the difference). */
export function getOpportunityFireToHit(shot: { gunnery: number; band: OpportunityFireBand; targetMove: OpportunityFireTargetMove; firerMoved: boolean; other: number }): number {
    return OPPORTUNITY_FIRE_BASE[shot.band] + (shot.gunnery - 4) + OPPORTUNITY_FIRE_TARGET[shot.targetMove]
        + (shot.firerMoved ? OPPORTUNITY_FIRE_FIRER_MOVED : 0) + shot.other;
}

// --- Morale, pp.22-26 ('Mechs; vehicles and infantry are not on the 'Mech play page).

export const MORALE_CLASSES = ["Militia", "Green", "Regular", "Veteran", "Elite", "Crack"] as const;
const MORALE_BASE = [7, 7, 6, 6, 5, 5];
const MECH_MORALE_CLASS_MODIFIER = [-2, -1, 0, 1, 2, 3];

export type MoraleStatus = "disorganized" | "broken" | "routed";
const MECH_MORALE_STATUS_MODIFIER: Record<MoraleStatus, number> = { disorganized: -1, broken: -2, routed: -3 };

/** FW #17 p.38: "If disorganized +1, If broken +2, If routed +3" to the check number; the reprint drops it. */
const ORIGINAL_MORALE_STATUS_ADJUSTMENT: Record<MoraleStatus, number> = { disorganized: 1, broken: 2, routed: 3 };

/** The class's number to pass a check (p.24); under the FW #17 printing a shaken unit's number rises by 1 / 2 / 3. */
export function getMoraleBase(classIndex: number, status?: MoraleStatus, printing: FutureWarsPrinting = "best-of"): number {
    const base = MORALE_BASE[Math.max(0, Math.min(MORALE_BASE.length - 1, classIndex))];
    return base + (printing === "original" && status ? ORIGINAL_MORALE_STATUS_ADJUSTMENT[status] : 0);
}

/** 2D6 equal to the class's number or more passes (Chunk D ruling). */
export function isMoralePass(classIndex: number, roll: number, status?: MoraleStatus, printing: FutureWarsPrinting = "best-of"): boolean {
    return roll >= getMoraleBase(classIndex, status, printing);
}

/** The modifiers the 'Mech carries into the results roll: its class, its status, earlier Carry On results, and the rest. */
export function getMechMoraleModifier(classIndex: number, status: MoraleStatus | undefined, laterRollModifier: number, other: number): number {
    return MECH_MORALE_CLASS_MODIFIER[Math.max(0, Math.min(MECH_MORALE_CLASS_MODIFIER.length - 1, classIndex))]
        + (status ? MECH_MORALE_STATUS_MODIFIER[status] : 0) + laterRollModifier + other;
}

export interface IMoraleResult {
    /** The row on the results table. */
    label: string;
    text: string;
    status?: MoraleStatus;
    turns?: number;
    /** Firing: a to-hit modifier, or "none" when the unit may not fire. */
    fire?: number | "none";
    /** Steps down the morale scale, for the rest of the game. */
    scaleDrop?: number;
    /** Added to later rolls on this table. */
    laterRollModifier?: number;
    /** Every friendly unit within 10 hexes and in LOS checks morale. */
    friendsCheck?: boolean;
    /** FW #17: the status lasts until the unit is off the board (no count of turns). */
    untilOffBoard?: true;
    /** FW #17 row 13: steps up the morale scale, for the rest of the game. */
    scaleRise?: number;
}

const MECH_MORALE_RESULTS: Record<string, Omit<IMoraleResult, "label" | "text">> = {
    "-5": { status: "routed", turns: 3, fire: "none", friendsCheck: true },
    "-4": { status: "routed", turns: 2, fire: "none" },
    "-3": { status: "routed", turns: 1, fire: "none" },
    "-2": { status: "broken", turns: 4, fire: "none" },
    "-1": { status: "broken", turns: 3, fire: "none" },
    "0": { status: "broken", turns: 2, fire: "none" },
    "1": { status: "broken", turns: 3, fire: "none" },
    "2": { status: "broken", turns: 2, fire: "none" },
    "3": { status: "broken", turns: 1, fire: "none" },
    "4": { status: "disorganized", turns: 2, fire: 5 },
    "5": { status: "disorganized", turns: 1, fire: 3 },
    "6": { status: "disorganized", turns: 1, fire: 2 },
    "7": { status: "disorganized", turns: 1, fire: 1 },
    "8": { scaleDrop: 2 },
    "9": { scaleDrop: 1 },
    "10": { laterRollModifier: -2 },
    "11": { laterRollModifier: -1 },
    "12": { laterRollModifier: 1 },
    "13": { laterRollModifier: 2 },
    "14+": {},
};

/** FW #17 p.38's rows where they differ: the routs last until off the board ("Rout ... takes the units off the board", p.40); a 13 is +1 on the morale scale. */
const ORIGINAL_MECH_MORALE_RESULTS: Record<string, Omit<IMoraleResult, "label" | "text">> = {
    "-5": { status: "routed", untilOffBoard: true, fire: "none", friendsCheck: true },
    "-4": { status: "routed", untilOffBoard: true, fire: "none" },
    "-3": { status: "routed", untilOffBoard: true, fire: "none" },
    "13": { scaleRise: 1 },
};

/** The 'Mech results row for a total (2D6 + modifiers); -5 or less is the "-5" row, 14 or more "14+". */
export function getMechMoraleResult(total: number, printing: FutureWarsPrinting = "best-of"): IMoraleResult {
    const label = total <= -5 ? "-5" : total >= 14 ? "14+" : String(total);
    const numbers = (printing === "original" ? ORIGINAL_MECH_MORALE_RESULTS[label] : undefined) ?? MECH_MORALE_RESULTS[label];
    return { label, text: rowText(FUTURE_WARS_PRINTING_IDS.morale[printing], "'Mech results", label), ...numbers };
}

// --- Weapon Malfunctions, p.29.

export type MalfunctionTable = "flamer" | "missile" | "ac" | "laser";

export const MALFUNCTION_DICE: Record<MalfunctionTable, { label: string; min: number; max: number }> = {
    flamer: { label: "1D6", min: 1, max: 6 },
    missile: { label: "2D6", min: 2, max: 12 },
    ac: { label: "2D6", min: 2, max: 12 },
    laser: { label: "3D6", min: 3, max: 18 },
};

const MALFUNCTION_TABLE_TITLES: Record<MalfunctionTable, string> = { flamer: "Flamers", missile: "Missiles", ac: "Autocannons", laser: "Lasers" };

/**
 * Which malfunction table a weapon rolls on (Chunk D ruling): flamers, lasers (pulse lasers too), missile launchers
 * (Streak and the rest; not anti-missile systems), autocannons and machine guns. Any other weapon has none.
 */
export function getMalfunctionTable(weapon: { name: string; category: string; tag: string }): MalfunctionTable | undefined {
    const name = weapon.name;
    if (/flamer/i.test(name)) return "flamer";
    if (/laser/i.test(name)) return "laser";
    if (/anti-missile|(^|-)ams(-|$)/i.test(name) || /(^|-)ams(-|$)/.test(weapon.tag)) return undefined;
    if (weapon.category === "Missile Weapons") return "missile";
    if (/autocannon|(^|[^a-z])ac([^a-z]|$)|machine gun/i.test(name)) return "ac";
    return undefined;
}

export interface IMalfunctionEffect {
    text: string;
    toHit: number;
    heat: number;
    /** The weapon may not fire. */
    out: boolean;
    /** A jam a roll can clear (the text says how); otherwise out of action until repaired. */
    clearable?: boolean;
    noEffect?: boolean;
}

type EffectNumbers = Partial<Omit<IMalfunctionEffect, "text">>;
const MALFUNCTION_EFFECTS: Record<MalfunctionTable, Record<number, EffectNumbers>> = {
    flamer: { 3: { heat: 2 }, 5: { toHit: 2, heat: 2 } },
    missile: { 4: { out: true, clearable: true }, 6: { out: true, clearable: true }, 8: { out: true, clearable: true }, 9: { toHit: 2 }, 10: { toHit: 1 }, 11: { heat: 2 } },
    // 4, casing fails to clear: fires at +1 and +1 heat a turn fired, growing; the first turn's numbers are applied (NGCFells's).
    ac: { 3: { out: true, clearable: true }, 4: { toHit: 1, heat: 1 }, 5: { heat: 1 }, 6: { out: true, clearable: true }, 9: { toHit: 2 }, 10: { toHit: 1 }, 11: { out: true, clearable: false }, 12: { out: true, clearable: false } },
    // 18, total burn-through: out of action as a burned-out laser is (NGCFells's).
    laser: { 6: { heat: 1 }, 7: { heat: 2 }, 9: { toHit: 1, heat: 2 }, 10: { toHit: 1, heat: 3 }, 11: { toHit: 2, heat: 2 }, 13: { heat: 4 }, 14: { toHit: 2, heat: 3 }, 15: { toHit: 3, heat: 5 }, 16: { toHit: 5, heat: 5 }, 17: { out: true, clearable: false }, 18: { out: true, clearable: false } },
};

/**
 * FW #9 pp.10-11's rows where they differ: flamer 5 is not printed (NGCFells ruled 2026-11-17: no effect); autocannon
 * 11 can still fire (its "roll twice on 2, 3 or 4" is left to the players); laser 16 is +2 to-hit, +5 heat.
 */
const ORIGINAL_MALFUNCTION_EFFECTS: Partial<Record<MalfunctionTable, Record<number, EffectNumbers>>> = {
    flamer: { 5: {} },
    ac: { 11: {} },
    laser: { 16: { toHit: 2, heat: 5 } },
};

/** What a malfunction roll does to the weapon, with the table's text. */
export function getMalfunctionEffect(table: MalfunctionTable, roll: number, printing: FutureWarsPrinting = "best-of"): IMalfunctionEffect {
    const text = rowText(FUTURE_WARS_PRINTING_IDS.malfunctions[printing], MALFUNCTION_TABLE_TITLES[table], String(roll));
    const numbers = (printing === "original" ? ORIGINAL_MALFUNCTION_EFFECTS[table]?.[roll] : undefined) ?? MALFUNCTION_EFFECTS[table][roll] ?? {};
    return { text, toHit: 0, heat: 0, out: false, ...numbers, noEffect: text.startsWith("No effect") };
}

// --- The Long Range Wars, pp.55-56.

/** Extended range 2 x long (base 10), extreme 2 x extended (base 13): +6 and +9 over Gunnery, as 10 and 13 at Gunnery 4 (NGCFells's). */
export function getLongRangeWarsBand(range: number, long: number): { band: "extended" | "extreme"; modifier: number } | undefined {
    if (long <= 0 || range <= long) return undefined;
    if (range <= long * 2) return { band: "extended", modifier: 6 };
    if (range <= long * 4) return { band: "extreme", modifier: 9 };
    return undefined;
}

/** The firer's own movement at extended and extreme range: walked +2, ran +3, jumped +5. */
export function getLongRangeWarsFirerModifier(movementMode: string): number {
    return movementMode === "w" ? 2 : movementMode === "r" ? 3 : movementMode === "j" ? 5 : 0;
}

/**
 * The target movement modifier at extended and extreme range, from the standard one the target dialog holds: 7-9
 * hexes (standard +3) is +4, 10 or more (+4 and up) is +5; 6 hexes or less keeps the standard modifier (NGCFells's: the
 * article prints nothing for it).
 */
export function getLongRangeWarsTargetModifier(standard: number): number {
    return standard <= 2 ? standard : standard === 3 ? 4 : 5;
}
