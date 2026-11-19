import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL, MUNCHKIN_RULES_LEVEL } from "../data/rules-level-options";

/**
 * Where a unit stands, beside its rules level: canon (on the Master Unit List or MUL 1.0, or on an official record
 * sheet), licensed but not canon, fan-made, or fan-made with no claim to balance. A fan-made unit keeps its rules level (a Standard-level ArtVee is
 * still Standard), so an event that takes only official units can leave it out by standing (#241).
 */
export type UnitStanding = "canon" | "apocryphal" | "custom" | "munchkin";

export const UNIT_STANDINGS: Record<UnitStanding, { label: string; description: string }> = {
    canon: { label: "Canon", description: "on the Master Unit List or MUL 1.0, or on a FASA, FanPro or Catalyst record sheet" },
    apocryphal: { label: "Apocryphal", description: "licensed but not canon, such as video game units or Dark Age clix units with no Classic record sheet" },
    custom: { label: "Fan-made", description: "fan-made or homebrew, whatever its rules level, meant to be balanced" },
    munchkin: { label: "Munchkin", description: "fan-made with no claim to balance" },
};

/** Every standing, canon first. */
export const UNIT_STANDING_ORDER: UnitStanding[] = ["canon", "apocryphal", "custom", "munchkin"];

/** A saved standing selection with the unknown values dropped, in order; null when nothing valid is left. */
export function normalizeStandingSelection(value: unknown): UnitStanding[] | null {
    if (!Array.isArray(value)) return null;
    const kept = UNIT_STANDING_ORDER.filter((standing) => value.includes(standing));
    return kept.length > 0 ? kept : null;
}

/** The standing a rules level gives (Apocryphal 5, Custom Homebrew 6, Munchkin 7), else canon. */
export function getRulesLevelStanding(rulesLevel: number): UnitStanding {
    if (rulesLevel >= MUNCHKIN_RULES_LEVEL) return "munchkin";
    if (rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL) return "custom";
    if (rulesLevel >= APOCRYPHAL_RULES_LEVEL) return "apocryphal";
    return "canon";
}

/** A Master Unit List record's standing: the MUL's own lists are canon, our custom list is fan-made unless it says otherwise. */
export function getMULRecordStanding(unit: Pick<IASMULUnit, "MulSource" | "CustomInfo">): UnitStanding {
    return unit.CustomInfo?.standing ?? (unit.MulSource === "custom" || unit.CustomInfo ? "custom" : "canon");
}

/** Of two standings, the further from canon. */
export function worseStanding(a: UnitStanding, b: UnitStanding): UnitStanding {
    return UNIT_STANDING_ORDER.indexOf(a) >= UNIT_STANDING_ORDER.indexOf(b) ? a : b;
}
