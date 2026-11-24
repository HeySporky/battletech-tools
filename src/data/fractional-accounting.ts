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
 * Fractional Accounting, an advanced construction option: Tactical Operations: Advanced Units &
 * Equipment pp.188-189. Weights the standard rules round to the half ton keep their fractions and are
 * rounded up to the kilogram instead; "experimental-level unit design" (p.188).
 */

/** Fractional Engine Multipliers (TO:AUE p.188): times the standard fusion engine weight of the same rating. */
const fractionalEngineMultipliers: Record<string, number> = {
    "standard": 1.0,
    "compact": 1.5,
    "light": 0.75,
    "xl": 0.5,
    "clan_xl": 0.5,
    "xxl": 0.333,
    "clan_xxl": 0.333,
    "ice": 2.0,
    "cell": 1.2,
    "fission": 1.75,
};

/** "Fusion engines may not be constructed lighter than 0.25 tons and fission engines may not be built lighter than 5 tons" (TO:AUE p.188). */
const FUSION_ENGINE_TAGS = ["standard", "compact", "light", "xl", "clan_xl", "xxl", "clan_xxl"];
const FUSION_ENGINE_MINIMUM_WEIGHT = 0.25;
const FISSION_ENGINE_MINIMUM_WEIGHT = 5;

/**
 * Fractional Armor Table (TO:AUE p.188), tons per point, by armor tag. Armor types the table does not
 * list (they were published later, or are not on it) are not here: see getFractionalArmorTonsPerPoint.
 */
export const fractionalArmorTonsPerPoint: Record<string, { is: number, clan: number }> = {
    "standard": { is: 0.0625, clan: 0.0625 },
    "stealth-basic": { is: 0.0625, clan: 0.0625 },
    "light-ferro-fibrous": { is: 0.0590, clan: 0.0590 },
    "ferro-fibrous": { is: 0.0558, clan: 0.0521 },
    "heavy-ferro-fibrous": { is: 0.0504, clan: 0.0504 },
    "commercial": { is: 0.0417, clan: 0.0417 },
    "ferro-lamellor": { is: 0.0714, clan: 0.0714 },
    "hardened": { is: 0.1250, clan: 0.1250 },
    "laser-reflective": { is: 0.0625, clan: 0.0625 },
    "reactive": { is: 0.0625, clan: 0.0625 },
};

/**
 * The Fractional Armor Table row for each aerospace armor: the table lists ground armor names, and each of these
 * is that armor's aerospace form (TM p.192). The printed rows equal one ton divided by the aerospace points per ton.
 */
const fractionalAerospaceArmorRows: Record<string, string> = {
    "aerospace-standard": "standard",
    "light-ferro-aluminum": "light-ferro-fibrous",
    "ferro-aluminum": "ferro-fibrous",
    "clan-ferro-aluminum": "ferro-fibrous",
    "heavy-ferro-aluminum": "heavy-ferro-fibrous",
};

/** "Round any figures up to the nearest kilogram (0.001 tons)" (TO:AUE p.188). */
export function roundUpToKilogram(weight: number): number {
    if (!(weight > 0)) return 0;
    return Math.ceil(weight * 1000 - 1e-6) / 1000;
}

/**
 * Engine weight under Fractional Accounting: the standard fusion weight for the rating times the engine
 * type's multiplier, not rounded to the half ton. Null for an engine type the table does not list, which
 * keeps its standard weight.
 *
 * `shieldingMultiplier` is the unit's own engine multiplier, applied after the engine minimum and before
 * the one rounding up to the kilogram (1.5 for a Combat Vehicle's fusion or fission engine).
 */
export function getFractionalEngineWeight(engineTypeTag: string, standardFusionWeight: number, shieldingMultiplier: number = 1): number | null {
    const multiplier = fractionalEngineMultipliers[engineTypeTag];
    if (multiplier === undefined || !(standardFusionWeight > 0)) return null;
    let weight = standardFusionWeight * multiplier;
    if (FUSION_ENGINE_TAGS.includes(engineTypeTag)) weight = Math.max(weight, FUSION_ENGINE_MINIMUM_WEIGHT);
    if (engineTypeTag === "fission") weight = Math.max(weight, FISSION_ENGINE_MINIMUM_WEIGHT);
    return roundUpToKilogram(weight * shieldingMultiplier);
}

/**
 * Tons per point of armor under Fractional Accounting. The printed table value where there is one;
 * for an armor type the table does not list, one ton divided by the type's points per ton (derived,
 * not printed).
 */
export function getFractionalArmorTonsPerPoint(armorTag: string, techBase: "is" | "clan", pointsPerTon: number): number {
    const printed = fractionalArmorTonsPerPoint[armorTag]?.[techBase];
    if (printed) return printed;
    return pointsPerTon > 0 ? 1 / pointsPerTon : 0.0625;
}

/** As above for an aerospace armor (fighters and Small Craft), read from the row of its ground form. */
export function getFractionalAerospaceArmorTonsPerPoint(armorTag: string, techBase: "is" | "clan", pointsPerTon: number): number {
    return getFractionalArmorTonsPerPoint(fractionalAerospaceArmorRows[armorTag] ?? armorTag, techBase, pointsPerTon);
}
