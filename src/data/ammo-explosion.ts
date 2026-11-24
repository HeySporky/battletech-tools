import { getBattleArmorScaleExplosionDamage } from "./battle-armor-scale-equipment";
import { IEquipmentItem } from "./data-interfaces";
import { DEFAULT_RULES_EDITION, RulesEditionUnitType } from "./rules-editions";

/** What protects the exploding location: nothing, CASE (or Clan CASE) or CASE II. */
export type AmmoExplosionProtection = "none" | "case" | "case-ii";

/** How an edition explodes one unit type's ammunition. Fields are added only where the books differ. */
export interface IAmmoExplosionRules {
    /**
     * What explodes: the bin hit, every bin in the location hit, all the ammunition of the weapon whose ammunition
     * explodes from heat, or all the ammunition aboard (in a building, all in the hex).
     */
    scope: "bin" | "location" | "weapon" | "all";
    /** A critical hit on ammunition does nothing; only heat explodes it. */
    heatOnly?: boolean;
    /** The explosion destroys the unit outright; with CASE it blows out the rear armor and the crew survive. */
    destroysUnit?: boolean;
    /** With this protection the unit takes one shot's damage, and the rest of the ammunition is lost. */
    oneShot?: AmmoExplosionProtection[];
    /** Damage to the MechWarrior or pilot, which CASE and CASE II do not prevent; 0 for none. */
    pilotDamage: number;
    /** The damage is divided by this, by protection, rounding down. */
    damageDivisor?: Partial<Record<AmmoExplosionProtection, number>>;
    /** The least damage left after the divisor (aerospace: 1, TW p.161). */
    minDamage?: number;
    /** The most damage reaching internal structure (or SI), by protection; the unit vents the rest. */
    cap?: Partial<Record<AmmoExplosionProtection, number>>;
    /**
     * Where damage over the cap goes, by protection, if the 'Mech location it stops in survives: up to this many points
     * of its armor (a torso's rear armor), "all" its armor, or "half" a limb's or the head's original armor, rounding
     * up (a torso's rear armor takes the excess). Without an entry the excess is lost.
     */
    excessToArmor?: Partial<Record<AmmoExplosionProtection, number | "all" | "half">>;
    cite: string;
}

export interface IAmmoExplosion {
    rules: IAmmoExplosionRules;
    /** Shots left times one shot's Damage Value. */
    baseDamage: number;
    /** What reaches internal structure (or SI) after the divisor and cap. */
    damage: number;
    log: string[];
}

/**
 * Every edition's ammunition explosion rules, by edition tag then unit type. An edition with no record for a
 * unit type plays by Total Warfare's; a unit type with no Total Warfare record has no ruling and never explodes.
 */
export const AMMO_EXPLOSION_RULES: Record<string, Partial<Record<RulesEditionUnitType, IAmmoExplosionRules>>> = {
    "total-warfare": {
        // CASE vents what is left after the location (TW p.125); CASE II lets 1 point through (TO:AUE p.111).
        mech: { scope: "bin", pilotDamage: 2, cap: { "case-ii": 1 }, excessToArmor: { "case-ii": "half" }, cite: "TW p.125, TO:AUE p.111" },
        vehicle: { scope: "all", pilotDamage: 0, cite: "TW p.194" },
        building: { scope: "all", pilotDamage: 0, damageDivisor: { case: 10 }, cite: "TO:AR p.118" },
        // CASE II reduces a fighter's explosion to 1 point (TO:AUE p.111); small craft cannot mount it.
        fighter: { scope: "bin", pilotDamage: 1, damageDivisor: { none: 10, case: 20 }, minDamage: 1, cap: { "case-ii": 1 }, cite: "TW p.161, TO:AUE p.111" },
        "small-craft": { scope: "bin", pilotDamage: 1, damageDivisor: { none: 10 }, minDamage: 1, cite: "TW p.161" },
        // No protomech record: its crits never hit ammunition (TW p.186, BMR p.55) and it vents heat like a vehicle (TM p.86).
    },
    "core-rulebook": {
        // Excess over the cap blows out armor (CRB pp.96-97, 207); the MechWarrior takes 1 hit (CRB p.107).
        mech: {
            scope: "bin", pilotDamage: 1, cap: { none: 20, case: 10, "case-ii": 1 }, excessToArmor: { none: "all", case: 10, "case-ii": 10 },
            cite: "CRB pp.96, 107",
        },
    },
    // Earlier editions, each checked on the page image. CASE vents as in TW: the excess the earlier books send to
    // the armor of the destroyed location changes nothing (BTC p.118, BTC:RoW p.115). No book before TW gives
    // infantry, battle armor (BTr, CTr) or buildings an ammunition explosion.
    battledroids: {
        // A critical hit on ammunition has no effect; heat explodes the most destructive rack (BD pp.13, 18-19).
        mech: { scope: "bin", pilotDamage: 2, heatOnly: true, cite: "BD pp.13, 19" },
    },
    "battletech-2nd-edition": {
        mech: { scope: "location", pilotDamage: 2, cite: "BT2 p.25" },
    },
    "battletech-manual": {
        mech: { scope: "location", pilotDamage: 2, cite: "BTM p.24" },
        // "Ammo/Plant Hit (vehicle explodes)" on the 1D6 critical hit table, as in every book before TW.
        vehicle: { scope: "all", pilotDamage: 0, destroysUnit: true, cite: "BTM p.34" },
        // Heat explodes all of the most destructive ammunition type at full force. Conventional fighter pilots
        // take no damage (BTM p.53, BTC p.78); the tool does not tell them apart.
        fighter: { scope: "weapon", pilotDamage: 1, cite: "BTM pp.53, 71" },
    },
    "battletech-compendium": {
        mech: { scope: "location", pilotDamage: 2, cite: "BTC p.30" },
        vehicle: { scope: "all", pilotDamage: 0, destroysUnit: true, cite: "BTC p.42" },
        fighter: { scope: "weapon", pilotDamage: 1, cite: "BTC pp.78, 100" },
    },
    "battletech-3rd-edition": {
        mech: { scope: "location", pilotDamage: 2, cite: "BT3 p.29" },
    },
    "compendium-rules-of-warfare": {
        mech: { scope: "location", pilotDamage: 2, cite: "BTC:RoW p.43" },
        vehicle: { scope: "all", pilotDamage: 0, destroysUnit: true, cite: "BTC:RoW p.63" },
    },
    "battletech-4th-edition": {
        mech: { scope: "location", pilotDamage: 2, cite: "BT4 p.24" },
    },
    "master-rules": {
        mech: { scope: "bin", pilotDamage: 2, cite: "BMR p.36" },
        vehicle: { scope: "all", pilotDamage: 0, destroysUnit: true, cite: "BMR p.126" },
    },
    "master-rules-revised": {
        mech: { scope: "bin", pilotDamage: 2, cite: "BMR(R) p.37" },
        vehicle: { scope: "all", pilotDamage: 0, destroysUnit: true, cite: "BMR(R) p.58" },
    },
    "classic-battletech-box-set": {
        mech: { scope: "bin", pilotDamage: 2, cite: "CBT p.30" },
    },
    citytech: {
        vehicle: { scope: "all", pilotDamage: 0, destroysUnit: true, cite: "CT p.30" },
    },
    "citytech-2nd-edition": {
        vehicle: { scope: "all", pilotDamage: 0, destroysUnit: true, cite: "CT2 p.44" },
    },
    aerotech: {
        // The 1986 book has no small craft.
        fighter: { scope: "weapon", pilotDamage: 1, cite: "AT pp.6, 26" },
    },
    // Heat only. The full damage reaches the SI, and a fighter's CASE lets one shot through. AT2R's optional
    // ammunition critical hits are not built.
    "aerotech-2": {
        fighter: { scope: "bin", pilotDamage: 1, oneShot: ["case"], cite: "AT2 p.13" },
        "small-craft": { scope: "bin", pilotDamage: 1, cite: "AT2 p.13" },
    },
    "aerotech-2-revised": {
        fighter: { scope: "bin", pilotDamage: 1, oneShot: ["case"], cite: "AT2R p.21" },
        "small-craft": { scope: "bin", pilotDamage: 1, cite: "AT2R p.21" },
    },
};

export function getAmmoExplosionRules(editionTag: string | undefined, unitType: RulesEditionUnitType): IAmmoExplosionRules | undefined {
    return AMMO_EXPLOSION_RULES[editionTag ?? DEFAULT_RULES_EDITION]?.[unitType] ?? AMMO_EXPLOSION_RULES[DEFAULT_RULES_EDITION][unitType];
}

/** The Damage Value of one shot, counting every missile (TW p.125). */
export function getAmmoDamagePerShot(weapon: IEquipmentItem): number {
    if (weapon.damageClusters && weapon.damagePerCluster) return weapon.damageClusters * weapon.damagePerCluster;
    if (typeof weapon.damage === "number") return weapon.damage;
    return weapon.damage?.short ?? 0;
}

/** One shot's explosion damage from `bin` fired by `weapon`: the bin's own figure where its source sets one, else the weapon's. */
export function getBinDamagePerShot(bin: IEquipmentItem, weapon: IEquipmentItem): number {
    return bin.explosionDamagePerShot ?? getAmmoDamagePerShot(weapon);
}

/**
 * An ammunition explosion of `bins`: each explosive bin's shots left times one shot's Damage Value. A bin with no
 * weapon aboard to fire it cannot be valued and is left out. Battle-armor-scale ammunition does 20 a quarter-ton left
 * (Ghosts of Obeedah p.54) and an extended fuel tank 40 a ton (TM p.244). Undefined when the edition has no ruling
 * for the unit type. The unit applies the damage to its own locations.
 */
export function getAmmoExplosion(
    editionTag: string | undefined,
    unitType: RulesEditionUnitType,
    bins: IEquipmentItem[],
    binWeapon: (bin: IEquipmentItem) => IEquipmentItem | undefined,
    shotsLeft: (bin: IEquipmentItem) => number,
    protection: AmmoExplosionProtection = "none",
): IAmmoExplosion | undefined {
    const rules = getAmmoExplosionRules(editionTag, unitType);
    if (!rules) return undefined;
    let baseDamage = 0;
    let shot = 0;
    for (const bin of bins) {
        if (bin.variableFormula === "extended-fuel-tank") baseDamage += 40 * bin.weight;
        const weapon = bin.isAmmo && bin.explosive ? binWeapon(bin) : undefined;
        if (!weapon) continue;
        const shots = Math.max(0, shotsLeft(bin));
        const perShot = getBinDamagePerShot(bin, weapon);
        if (shots > 0) shot = Math.max(shot, perShot);
        baseDamage += bin.battleArmorScale ? getBattleArmorScaleExplosionDamage(shots * (bin.kgPerShot ?? 0) / 1000) : shots * perShot;
    }
    return resolveExplosion(rules, unitType, baseDamage, shot, protection);
}

function resolveExplosion(rules: IAmmoExplosionRules, unitType: RulesEditionUnitType, baseDamage: number, shot: number, protection: AmmoExplosionProtection): IAmmoExplosion {
    let damage = rules.oneShot?.includes(protection) ? Math.min(shot, baseDamage) : baseDamage;
    const divisor = rules.damageDivisor?.[protection] ?? rules.damageDivisor?.none;
    if (divisor && damage > 0) damage = Math.max(rules.minDamage ?? 0, Math.floor(damage / divisor));
    damage = Math.min(damage, rules.cap?.[protection] ?? Infinity);
    const log = rules.pilotDamage > 0 ? [`The ${unitType === "mech" ? "MechWarrior" : "pilot"} takes ${rules.pilotDamage} damage (${rules.cite})`] : [];
    return { rules, baseDamage, damage, log };
}

/** An explosion of a fixed `baseDamage` (not from ammunition: the Blue Saviour's 5 points), by the edition's ammunition explosion rules. */
export function getFixedExplosion(editionTag: string | undefined, unitType: RulesEditionUnitType, baseDamage: number, protection: AmmoExplosionProtection = "none"): IAmmoExplosion | undefined {
    const rules = getAmmoExplosionRules(editionTag, unitType);
    return rules ? resolveExplosion(rules, unitType, baseDamage, baseDamage, protection) : undefined;
}

/**
 * A failed heat Avoid Roll's explosion (TW p.161): the bin with the most destructive ammunition per shot explodes,
 * and the rest of that weapon's ammunition is destroyed with no more damage, or explodes with it where the edition's
 * scope is "weapon" (AT p.26). `spent` is every bin lost. Gauss and
 * other inert ammunition never explode. Undefined when no explosive ammunition is left. The unit applies the damage
 * to its SI and the pilot damage to its pilot or crew.
 */
export function getHeatAmmoExplosion(
    editionTag: string | undefined,
    unitType: RulesEditionUnitType,
    bins: IEquipmentItem[],
    binWeapon: (bin: IEquipmentItem) => IEquipmentItem | undefined,
    shotsLeft: (bin: IEquipmentItem) => number,
    protection: AmmoExplosionProtection = "none",
): (IAmmoExplosion & { bin: IEquipmentItem; spent: IEquipmentItem[] }) | undefined {
    const live = bins.filter((bin) => bin.isAmmo && bin.explosive && shotsLeft(bin) > 0 && binWeapon(bin));
    const bin = live.reduce<IEquipmentItem | undefined>((best, item) => !best || getBinDamagePerShot(item, binWeapon(item)!) > getBinDamagePerShot(best, binWeapon(best)!) ? item : best, undefined);
    const spent = live.filter((item) => bin && binWeapon(item) === binWeapon(bin));
    const scope = getAmmoExplosionRules(editionTag, unitType)?.scope;
    const explosion = bin && getAmmoExplosion(editionTag, unitType, scope === "weapon" ? spent : [bin], binWeapon, shotsLeft, protection);
    if (!explosion) return undefined;
    const log = [`${scope === "weapon" ? spent.map((item) => item.name).join(", ") : bin!.name} explodes: ${explosion.damage} damage to the Structural Integrity (${explosion.rules.cite})`, ...explosion.log];
    if (explosion.rules.pilotDamage > 0) log.push("Make a Consciousness Roll (TW p.41)");
    return { ...explosion, log, bin: bin!, spent };
}
