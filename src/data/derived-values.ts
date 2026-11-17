import { ammoCatalog } from "./ammo";
import { IDamagePerRange, IEquipmentItem } from "./data-interfaces";
import { equipmentBallistic } from "./equipment-ballistic";
import { equipmentEnergy } from "./equipment-energy";
import { equipmentMisc } from "./equipment-misc";
import { equipmentMissile } from "./equipment-missile";

/*
 * Derived Battle Value and cost for fan equipment whose author gave none (Custom Homebrew, Apocryphal and Munchkin items).
 * The methods are ours, not a published table. Each is checked against canon weapons in derived-values.test.ts, which prints
 * how far the method runs from the printed figure, and each is written up in the "Homebrew and Apocryphal Equipment"
 * readout (docs/lore/homebrew-equipment-tro.md) so that others can use it. BV1 (Master Rules) prints nothing for these
 * items, so a BV1 total reads the same figure through the catalog fallback (battle-value.ts, rateBattleValue1).
 */

/** Battle Value of a direct-fire weapon per point of damage-hex (damage summed over the hexes it reaches): PPC .98, lasers 1.0 to 1.07. */
export const BV_PER_DAMAGE_HEX = 1;
/** C-Bills per Battle Value point: the median of the canon energy weapons at rules level 3 and below (1,310; quartiles 912 and 1,786). */
export const COST_PER_BV = 1310;
/** A one-shot launcher is worth a fifth of its reloadable twin (canon SRM 2/4/6 OS: 4/8/12 against 21/39/59). */
export const ONE_SHOT_FRACTION = 0.2;
/** A ton of ballistic ammunition is worth an eighth of its weapon's Battle Value (canon AC, LB-X and Ultra: .122 to .135). */
export const AMMO_BV_PER_WEAPON_BV = 0.125;
/** C-Bills per Battle Value point of ammunition, the median of the canon AC, LB-X and Ultra standard rounds (200 to 900). */
export const AMMO_COST_PER_BV = 450;
/** Battle Value per point of physical weapon damage: the median of the canon hatchet, sword, mace, lance and claw (TM p.303). */
export const MELEE_BV_PER_DAMAGE = 1.275;

const canonLists: IEquipmentItem[][] = [equipmentBallistic, equipmentMissile, equipmentEnergy, equipmentMisc, ammoCatalog];

/** A canon record by tag; an error if the catalog does not hold it (so a rename cannot silently change a derived figure). */
export function canonRecord(tag: string): IEquipmentItem {
    for (const list of canonLists) {
        const found = list.find((item) => item.tag === tag);
        if (found) return found;
    }
    throw new Error(`derived-values: canon record ${tag} not found`);
}

/** Damage summed over every hex the weapon reaches, hexes 1 to its long range, each band at its own damage. */
/** Damage by range band; only the three ground bands are read. */
export type BandDamage = Pick<Partial<IDamagePerRange>, "short" | "medium" | "long">;

export function damageHexes(damage: number | BandDamage, range: { short: number; medium: number; long: number }): number {
    if (typeof damage === "number") return damage * range.long;
    return (damage.short ?? 0) * range.short + (damage.medium ?? 0) * (range.medium - range.short) + (damage.long ?? 0) * (range.long - range.medium);
}

/** Battle Value of a direct-fire weapon: its damage over its reach. */
export const directFireBattleValue = (damage: number | BandDamage, range: { short: number; medium: number; long: number }): number =>
    Math.round(BV_PER_DAMAGE_HEX * damageHexes(damage, range));

/** Cost from Battle Value, to the nearest 1,000 C-Bills. */
export const costFromBattleValue = (battleValue: number): number => Math.round(battleValue * COST_PER_BV / 1000) * 1000;

/** Ammunition cost a ton from its Battle Value, to the nearest 500 C-Bills. */
export const ammoCostFromBattleValue = (ammoBattleValue: number): number => Math.round(ammoBattleValue * AMMO_COST_PER_BV / 500) * 500;

/** Ammunition Battle Value a ton from the weapon's. */
export const ammoBattleValueFromWeapon = (weaponBattleValue: number): number => Math.round(weaponBattleValue * AMMO_BV_PER_WEAPON_BV);

/** Battle Value of a physical weapon from its damage. */
export const meleeBattleValue = (damage: number): number => Math.round(damage * MELEE_BV_PER_DAMAGE);

/** A one-shot launcher's Battle Value from its reloadable twin's. */
export const oneShotBattleValue = (reloadableBattleValue: number): number => Math.round(reloadableBattleValue * ONE_SHOT_FRACTION);

/** A value at `size` on the straight line through the canon points `low` and `high` (each [size, value]). */
export function interpolate(low: [number, number], high: [number, number], size: number): number {
    return low[1] + (high[1] - low[1]) * (size - low[0]) / (high[0] - low[0]);
}

/** A value at `size` beyond the last two canon points (each [size, value]), on the line through them. */
export const extrapolate = (previous: [number, number], last: [number, number], size: number): number => interpolate(previous, last, size);

/** Fusion Lance: damage in the first hex, by engine rating (u/Magical_Savior's revision: 10 plus 5 per 100 or part, 15 to 30). */
export const fusionLanceDamage = (engineRating: number): number => Math.min(30, 10 + 5 * Math.max(1, Math.ceil(engineRating / 100)));

/** Fusion Lance: damage in hex 1, 2 and 3, each 5 less than the one before. */
export const fusionLanceHexDamage = (engineRating: number): number[] => {
    const first = fusionLanceDamage(engineRating);
    return [first, first - 5, first - 10].map((damage) => Math.max(0, damage));
};

/** Fusion Lance Battle Value: its damage over its three hexes, as any direct-fire weapon's. */
export const fusionLanceBattleValue = (engineRating: number): number =>
    Math.round(BV_PER_DAMAGE_HEX * fusionLanceHexDamage(engineRating).reduce((sum, damage) => sum + damage, 0));

/** The words for a derived figure, for a record's notes. */
export const derivedNote = (text: string): string => `Derived, not given by the author: ${text}`;
