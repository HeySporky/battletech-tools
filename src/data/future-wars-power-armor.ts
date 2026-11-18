
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

import { ICockpitType } from "./data-interfaces";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

// Bill Swisher, "Power Armor: The Poor Man's Battlemech" (#172). First printed in Future Wars #14 p.39 (1989); the
// library's scan of that issue lacks printed pp.39-42, so the rules are read from the reprint, The Best of Future Wars,
// Volume One (1991), pp.14-16, on the page images. The three sample suits on Future Wars #14 pp.43-45 are standard FASA
// 'Mech sheets filled in by hand; they fix what the text leaves open (six lines a location, the pilot's four boxes).
// Plan: docs/superpowers/plans/2026-11-17-future-wars-power-armor.md.

export const FW_POWER_ARMOR_RULESET = "fw-power-armor";

/** "5, 10 and 15 ton" suits (Best-of p.16). Ours: no other weight. */
export const POWER_ARMOR_TONNAGES = [5, 10, 15] as const;

export function isPowerArmorTonnage(tons: number): boolean {
    return (POWER_ARMOR_TONNAGES as readonly number[]).includes(tons);
}

/**
 * Critical slots of each location: "they have 3 per arm, 6 per side torso, 2 per leg, and none in the center torso"
 * (Best-of p.16) counts the FREE slots; the sheets print six lines a location and twelve in the center torso, the rest filled by the
 * actuators, engine, gyro and pilot. So the location sizes are six, and twelve in the center torso.
 */
const POWER_ARMOR_SLOTS: Record<string, number> = {
    hd: 6, head: 6,
    ct: 12, centertorso: 12,
    lt: 6, rt: 6, lefttorso: 6, righttorso: 6,
    la: 6, ra: 6, leftarm: 6, rightarm: 6,
    ll: 6, rl: 6, leftleg: 6, rightleg: 6,
};

/** Critical slots of a suit's location, or undefined for a tonnage the rules do not build or a location a biped lacks. */
export function getPowerArmorSlots(tons: number, location: string): number | undefined {
    if (!isPowerArmorTonnage(tons)) return undefined;
    return POWER_ARMOR_SLOTS[(location || "").trim().toLowerCase()];
}

/**
 * The 5-ton suit's internal structure (Best-of p.16): Battledroids' 5-ton row (BD p.24, H3) with the head cut to 1:
 * "Since the head only has 1structure point it can only hold 2 points of armor". 10 and 15 tons use the edition's table.
 */
export const POWER_ARMOR_FIVE_TON_STRUCTURE = { head: 1, ct: 3, torso: 2, arm: 1, leg: 1 } as const;

/**
 * "Suits do not require a cockpit. Instead they need a 1/2 ton waldo system. Cost: 50,000 C-Bills" (Best-of p.16).
 * Every sheet writes "Pilot" in head slots 3-4 and center torso slots 11-12 and keeps the printed Life Support and
 * Sensors boxes. Ours: a cockpit record outside the canon cockpit catalog; its dates are the article's history
 * (Tharkan prototype 2963; Defiance Industries, Hesperus II, December 3027); never extinct.
 */
export const POWER_ARMOR_WALDO: ICockpitType = {
    name: "Power Armor Waldo System",
    tag: "power-armor-waldo",
    weight: 0.5,
    cost: 50000,
    rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
    techBase: "is",
    constructionStatus: "implemented",
    book: "Best of Future Wars",
    page: 16,
    notes: "Replaces the cockpit of a Power Armor suit: the pilot wears the suit. Bill Swisher, 'Power Armor: The Poor Man's Battlemech', "
        + "Future Wars #14 (1989), p.39; reprinted in The Best of Future Wars, Volume One (1991), p.16. Slots from the sample sheets, "
        + "Future Wars #14 pp.43-45 (NGCFells's: placed as the sheets show).",
    prototype: 2963,
    introduced: 3027,
    extinct: null,
    reintroduced: null,
};

/** Head slots (0-based) and center torso slots of the pilot, as every FW #14 sheet writes them. */
export const POWER_ARMOR_PILOT_SLOTS = { head: 2, centerTorso: 10, size: 2 } as const;

/**
 * "5 ton suits may only use flamers, MG's, and small lasers" (Best-of p.16). Ours: the weapons of the
 * article's era; later variants (ER, pulse, light and heavy machine guns) are refused.
 */
export const POWER_ARMOR_FIVE_TON_WEAPONS = ["standard-flamer", "vehicle-flamer", "machine-gun", "small-laser"] as const;

/** Fusion engines, which a 5-ton suit must shield "as per vehicle construction rules" (Best-of p.16). */
const SHIELDED_ENGINE_TAGS = ["standard", "light", "xl", "clan_xl", "compact", "xxl", "clan_xxl"];

export function needsPowerArmorShielding(engineTag: string): boolean {
    return SHIELDED_ENGINE_TAGS.includes(engineTag);
}

/** Shielding of half the engine's weight, rounded up to the half ton as vehicle shielding is (NGCFells's). */
export function getPowerArmorShieldingWeight(engineTons: number): number {
    return engineTons > 0 ? Math.ceil(engineTons) / 2 : 0;
}

export type PowerArmorBuildingClass = "light" | "medium" | "heavy" | "hardened";

/** Power Armor Building Effects Table (Best-of p.15): [MP to enter, pilot modifier] by suit tonnage and building. */
export const POWER_ARMOR_BUILDING_EFFECTS: Record<number, Record<PowerArmorBuildingClass, [number, number]>> = {
    5: { light: [1, 0], medium: [2, 0], heavy: [2, 1], hardened: [3, 2] },
    10: { light: [1, 0], medium: [2, 1], heavy: [3, 2], hardened: [4, 3] },
    15: { light: [2, 0], medium: [3, 1], heavy: [4, 2], hardened: [5, 4] },
};

const BUILDING_NAMES: Record<PowerArmorBuildingClass, string> = { light: "Light", medium: "Medium", heavy: "Heavy", hardened: "Hardened" };

/** The suit's own row of the Building Effects Table, for its sheet and roster play; empty for another tonnage. */
export function getPowerArmorBuildingRow(tons: number): { building: string; mp: number; pilot: number }[] {
    const row = POWER_ARMOR_BUILDING_EFFECTS[tons];
    if (!row) return [];
    return (Object.keys(BUILDING_NAMES) as PowerArmorBuildingClass[]).map(key => ({ building: BUILDING_NAMES[key], mp: row[key][0], pilot: row[key][1] }));
}

/**
 * The play rules in short, for the suit's sheet and the roster's Power Armor panel (Best-of pp.14-16, rules 1-12 and
 * the 5-ton pilot rule; our wording).
 */
export function getPowerArmorSheetRules(tons: number): string[] {
    const rules = [
        "+1 to hit this suit. A one-level target. Up to 14 suits a hex, 7 with one other unit.",
        "It punches, kicks and charges on its own level only, and may punch infantry in its hex while standing; "
            + "it clubs (a girder only) its own level or the one above.",
        "A 'Mech may kick it but not punch it on its level; 'Mech physical damage uses the ranged hit table, a DFA the punch table.",
        "Pilot: a head hit, 1 hit; head destroyed or Pilot critical in the head: killed; Pilot critical in the center torso: 1D6 hits; "
            + "ammo explosion: 1 hit, killed if it reaches the center torso; its own failed DFA: 1 hit and a Piloting Skill Roll against another.",
        "No ejection: unlatching takes a full turn with no moving or firing (a center torso hit meanwhile: 1D3 hits); "
            + "alive and conscious in the End Phase, the pilot may leave the suit.",
    ];
    if (tons === 5) rules.push("No gyro: Piloting 3 or better; 4, +2 to every Piloting Skill Roll; 5 or worse cannot pilot it.");
    return rules;
}

/**
 * PWA, Power Armor, on a suit's Alpha Strike card (NGCFells's ruling 2026-11-17: ours). The card is the converter's BattleMech
 * card; PWA carries the article's play rules, and the Point Value counts its +1 to hit as +1 TMM in the defense factor.
 */
export const POWER_ARMOR_AS_ABILITY = "PWA";

/** Cited under the rules on the sheet and in the panel. */
export const POWER_ARMOR_RULES_CITE = "Bill Swisher, The Best of Future Wars pp.14-16";
