// Light and Medium (infantry) weapons on Small Support Vehicles (TM p.136): Light weapons are the Standard ones on
// the Conventional Infantry Weapons table, Medium weapons the Support ones (TM pp.349-352). A mounted weapon is
// an equipment entry built from the infantry weapon record, so the vehicle's weapon lists, Battle Value and play
// treat it like any other weapon.

import { IEquipmentItem } from "./data-interfaces";
import { findInfantryWeapon, IInfantryWeapon, infantryWeapons } from "./infantry-weapons";

/** Tag prefix of a mounted Light or Medium weapon: the infantry weapon's own tag follows it. */
export const SV_LIGHT_WEAPON_TAG_PREFIX = "sv-light-weapon-";
/** Most extra clips one weapon may carry; far above any real design. */
export const SV_LIGHT_WEAPON_MAX_CLIPS = 1000;
/** A pintle weighs 5 percent of what it carries, ammunition excluded, rounded up to the kilogram (TM pp.137, 234). */
export const PINTLE_WEIGHT_FACTOR = 0.05;

/** Light (Standard) and Medium (Support) weapons; melee weapons are neither. */
export function isSupportVehicleLightWeapon(weapon: IInfantryWeapon): boolean {
    return weapon.type === "standard" || weapon.type === "support";
}

export const SUPPORT_VEHICLE_LIGHT_WEAPONS: IInfantryWeapon[] = infantryWeapons.filter(isSupportVehicleLightWeapon);

/** Damage in BattleTech play: each weapon fires alone, so its damage is rounded normally, .5 up (TM p.136). */
export function getLightWeaponDamage(weapon: IInfantryWeapon): number {
    return Math.floor(weapon.damage + 0.5);
}

/** Short, Medium and Long Range: the Base Range, twice it and three times it; a Base Range of 0 gives 0/1/2 (TM p.136). */
export function getLightWeaponRanges(weapon: IInfantryWeapon): { short: number; medium: number; long: number } {
    if (weapon.baseRange <= 0) return { short: 0, medium: 1, long: 2 };
    return { short: weapon.baseRange, medium: weapon.baseRange * 2, long: weapon.baseRange * 3 };
}

/** The Aerospace range bracket a Long Range falls in: up to 9 Short, 10-19 Medium, 20-24 Long, 25+ Extreme (TM p.136). */
export function getLightWeaponAerospaceRange(weapon: IInfantryWeapon): "Short" | "Medium" | "Long" | "Extreme" {
    const long = getLightWeaponRanges(weapon).long;
    if (long <= 9) return "Short";
    if (long <= 19) return "Medium";
    if (long <= 24) return "Long";
    return "Extreme";
}

/**
 * Tons: the weapon with its free clip, plus each extra clip, from the table's kilograms (TM pp.136, 149). An
 * energy weapon's clip is its power pack.
 */
export function getLightWeaponTons(weapon: IInfantryWeapon, extraClips: number): number {
    return (weapon.weight + (weapon.ammoWeight ?? 0) * extraClips) / 1000;
}

/** The infantry weapon a mounted entry was built from, or null when the tag is not a Light or Medium weapon. */
export function findSupportVehicleLightWeapon(tag: string): IInfantryWeapon | null {
    if (!tag.startsWith(SV_LIGHT_WEAPON_TAG_PREFIX)) return null;
    const weapon = findInfantryWeapon(tag.slice(SV_LIGHT_WEAPON_TAG_PREFIX.length));
    return weapon && isSupportVehicleLightWeapon(weapon) ? weapon : null;
}

/**
 * An equipment entry for a Light or Medium weapon with this many extra clips (`size`). It takes 1 item slot with
 * its ammunition, needs no heat sinks or power amplifiers (TM p.136) and has the weapon's infantry Battle Value
 * (TM p.319; the TechManual gives no other value for it, and MegaMek uses this one).
 */
export function buildSupportVehicleLightWeapon(weapon: IInfantryWeapon, extraClips: number = 0): IEquipmentItem {
    const clips = Math.max(0, Math.min(SV_LIGHT_WEAPON_MAX_CLIPS, Math.floor(Number.isFinite(extraClips) ? extraClips : 0)));
    const ranges = getLightWeaponRanges(weapon);
    const medium = weapon.type === "support";
    const introduced = typeof weapon.introducedIS === "number" ? weapon.introducedIS
        : typeof weapon.introducedClan === "number" ? weapon.introducedClan
            : weapon.introducedIS === "ES" || weapon.introducedClan === "ES" ? 2100 : 1950;
    return {
        isEquipment: false,
        isAmmo: false,
        name: `${weapon.name} (${medium ? "Medium" : "Light"} Weapon)`,
        altNames: [],
        tag: `${SV_LIGHT_WEAPON_TAG_PREFIX}${weapon.tag}`,
        altTags: [],
        sort: `light weapon, ${weapon.name.toLowerCase()}`,
        category: "Infantry Weapons",
        alternateName: "",
        damage: getLightWeaponDamage(weapon),
        damageAero: getLightWeaponDamage(weapon),
        notes: `${medium ? "Medium" : "Light"} weapon: base damage ${weapon.damage}, crew ${weapon.crew}, ${weapon.shots ?? "no"} shots a clip; ${clips} extra clip${clips === 1 ? "" : "s"} (TM pp.136, 349-352).`,
        accuracyModifier: 0,
        cbills: (weapon.cost ?? 0) + (weapon.ammoCost ?? 0) * clips,
        introduced,
        extinct: weapon.extinctIS,
        reintroduced: weapon.reintroducedIS,
        battleValue: weapon.battleValue,
        heat: 0,
        heatAero: 0,
        weight: getLightWeaponTons(weapon, clips),
        range: { min: 0, short: ranges.short, medium: ranges.medium, long: ranges.long },
        space: { battlemech: -1, protomech: -1, combatVehicle: -1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [],
        techRating: weapon.techRating.toLowerCase(),
        book: "TM",
        page: 136,
        // A Custom Homebrew weapon keeps its level, so the vehicle's rules level takes it in.
        ...(weapon.rulesLevel !== undefined ? { rulesLevel: weapon.rulesLevel } : {}),
        size: clips,
        sizeLabel: "Extra clips",
        sizeMax: SV_LIGHT_WEAPON_MAX_CLIPS,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Light or Medium weapon: no Alpha Strike conversion is given"] },
    } as IEquipmentItem;
}
