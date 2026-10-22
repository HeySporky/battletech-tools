import { getAerospaceDamageByBracket } from "./aerospace-record-sheet";
import { ICapitalWeapon, IEquipmentItem } from "./data-interfaces";
import { getEquipmentSubtype } from "./equipment-subtypes";

/**
 * Weapon bays: Small Craft, DropShips and the larger craft group an arc's weapons of one class into bays fired as a
 * single weapon, the bay's heat and damage at each range being the sum of its weapons' (TM pp.194-195; TW p.234;
 * SO:AA p.142). A bay holds at most 70 capital (700 standard) damage; past that the class needs another bay.
 */
export const WEAPON_BAY_MAX_CAPITAL_DAMAGE = 70;

/** A weapon bay as the record sheet lists it (TM p.199; SO:AA p.146). */
export interface IWeaponBay {
    /** The weapon class. */
    name: string;
    /** Capital weapons: values are capital scale; otherwise standard scale. */
    capital: boolean;
    /** Capital-scale damage, for the 70-point bay limit. */
    damage: number;
    heat: number;
    weapons: number;
    weaponNames: string[];
    /** Attack Values at Short, Medium, Long and Extreme; null when a weapon's are unknown. */
    values: [number, number, number, number] | null;
}

/** One weapon on its way into a bay. */
export interface IWeaponBayWeapon {
    bayClass: string;
    capital: boolean;
    name: string;
    /** Capital-scale damage. */
    damage: number;
    heat: number;
    values: [number, number, number, number] | null;
}

/** A standard-scale weapon: its class is the weapon family, its damage counted at a tenth for the bay limit. */
export const standardBayWeapon = (item: IEquipmentItem): IWeaponBayWeapon => ({
    bayClass: getEquipmentSubtype(item) ?? item.category,
    capital: false,
    name: item.name,
    damage: (item.damageAero ?? 0) / 10,
    heat: item.heatAero ?? item.heat ?? 0,
    values: getAerospaceDamageByBracket(item),
});

/** A capital weapon: its class is its category, its damage the same at every bracket it reaches. */
export const capitalBayWeapon = (weapon: ICapitalWeapon, heat: number): IWeaponBayWeapon => {
    const reach = weapon.range ? ["short", "medium", "long", "extreme"].indexOf(weapon.range) : -1;
    const values = weapon.damage === null || reach < 0 ? null
        : [0, 1, 2, 3].map((bracket) => (bracket <= reach ? weapon.damage as number : 0)) as [number, number, number, number];
    return { bayClass: weapon.category, capital: true, name: weapon.name, damage: weapon.damage ?? 0, heat, values };
};

/**
 * Groups weapons into bays by class, in as few bays as the damage cap allows. The rules let a designer split bays
 * further; this fills the emptiest bay first, splitting the damage as evenly as it can (TM p.195), as SO:AA's McKenna
 * example does.
 */
export const groupWeaponBays = (weapons: IWeaponBayWeapon[], maxCapitalDamage: number = WEAPON_BAY_MAX_CAPITAL_DAMAGE): IWeaponBay[] => {
    const groups = new Map<string, { capital: boolean; weapons: IWeaponBayWeapon[] }>();
    for (const weapon of weapons) {
        const group = groups.get(weapon.bayClass) ?? { capital: weapon.capital, weapons: [] };
        group.weapons.push(weapon);
        groups.set(weapon.bayClass, group);
    }
    const bays: IWeaponBay[] = [];
    for (const [bayClass, group] of groups) {
        const total = group.weapons.reduce((sum, weapon) => sum + weapon.damage, 0);
        const count = Math.max(1, Math.ceil(total / maxCapitalDamage - 1e-9));
        const newBay = (): IWeaponBay => ({ name: bayClass, capital: group.capital, damage: 0, heat: 0, weapons: 0, weaponNames: [], values: [0, 0, 0, 0] });
        const classBays = Array.from({ length: count }, newBay);
        for (const weapon of [...group.weapons].sort((a, b) => b.damage - a.damage)) {
            let bay = classBays.reduce((low, entry) => (entry.damage < low.damage ? entry : low), classBays[0]);
            if (bay.weapons > 0 && bay.damage + weapon.damage > maxCapitalDamage + 1e-9) {
                bay = newBay();
                classBays.push(bay);
            }
            bay.damage += weapon.damage;
            bay.heat += weapon.heat;
            bay.weapons++;
            bay.weaponNames.push(weapon.name);
            bay.values = bay.values && weapon.values ? bay.values.map((value, index) => value + (weapon.values as number[])[index]) as [number, number, number, number] : null;
        }
        bays.push(...classBays);
    }
    return bays;
};
