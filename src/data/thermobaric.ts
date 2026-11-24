import { matchesTag } from "./tag-match";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs,
* Topps, and their respective rights holders.
*
* This open-source utility is a non-commercial fan project designed purely for
* tabletop gameplay assistance. Content processed by this file is not intended
* to challenge any copyright or trademark status, and this data is explicitly
* excluded from the software's underlying license (GNU GPLv3).
*/

/**
 * Thermobaric weapons: the fuel-air munitions of Interstellar Operations: Alternate Eras p.159 (#611). Damage runs from the point
 * of impact outward, one value for each hex of radius and one for the center (the Fuel-Air Munitions Table); the BattleForce
 * figure is the Alternate Era Equipment Table's (p.204).
 */
export interface IFuelAirMunition {
    /** The catalog tags of the ammunition records (bomb, Arrow IV missile, artillery shell, cannon shell). */
    tags: string[];
    name: string;
    /** Damage at the point of impact, then each ring out to the radius. */
    damage: number[];
    radius: number;
    /** BattleForce damage, an area-effect (A) value delivered through the artillery or bomb special ability. */
    battleForce: number;
}

export const FUEL_AIR_MUNITIONS: IFuelAirMunition[] = [
    { tags: ["ammo-bomb-fuel-air-small"], name: "Fuel-Air Bomb (Small)", damage: [20, 10, 5], radius: 2, battleForce: 20 },
    { tags: ["ammo-bomb-fuel-air-large"], name: "Fuel-Air Bomb (Large)", damage: [30, 20, 10, 5], radius: 3, battleForce: 30 },
    { tags: ["ammo-arrow-iv-fae"], name: "Fuel-Air Missile (Arrow IV)", damage: [20, 10, 5], radius: 2, battleForce: 20 },
    { tags: ["ammo-thumper-fae", "ammo-thumper-cannon-fae"], name: "Fuel-Air Shell (Thumper, Thumper Cannon)", damage: [10, 5], radius: 1, battleForce: 10 },
    { tags: ["ammo-sniper-fae", "ammo-sniper-cannon-fae"], name: "Fuel-Air Shell (Sniper, Sniper Cannon)", damage: [20, 10, 5], radius: 2, battleForce: 20 },
    { tags: ["ammo-long-tom-fae", "ammo-long-tom-cannon-fae"], name: "Fuel-Air Shell (Long Tom, Long Tom Cannon)", damage: [30, 20, 10, 5], radius: 3, battleForce: 30 },
];

/** The play rules of every fuel-air munition, as the catalog records carry them (IO:AE p.159). */
export const FUEL_AIR_RULES_TEXT =
    "Area effect, delivered by the weapon or bomb that carries it. Atmosphere: no effect in Very Thin, Trace or Vacuum atmosphere or in space; "
    + "damage is halved (rounding up) in a Thin atmosphere. Infantry in the area take twice the damage, doubled again in clear or open terrain, "
    + "and must also roll 2D6 and add their distance in hexes from the point of impact: on 9 or less (conventional infantry) or under 7 (battle armor) "
    + "the rest of the unit is destroyed; fire-resistant armor does not help. A light building, or a unit with a BAR under 10, takes 1.5 times the damage "
    + "(rounding up); a Castle Brian or armored building halves the blast first (rounding down). Fire: as an intentional fire (TO:AR pp.41-42) "
    + "against 7+. No extra heat unless the unit or its hex is set ablaze.";

/** The Alpha Strike and BattleForce handling of every fuel-air munition (IO:AE p.204). */
export const fuelAirAlphaStrikeNote = (munition: IFuelAirMunition): string =>
    `BattleForce (IO:AE p.204): ${munition.battleForce}A, delivered through the artillery or bomb special ability; no effect below a Thin atmosphere, damage halved in Thin, `
    + "multiplied by 1.5 (rounding up) against infantry or an element with BAR. The Alpha Strike card carries the weapon, not the munition (stated, not converted).";

export type FuelAirAtmosphere = "standard" | "thin" | "very-thin" | "trace" | "vacuum" | "space";

/** The munition a catalog ammunition tag names, by tag or an earlier tag. */
export const getFuelAirMunition = (tag: string): IFuelAirMunition | undefined =>
    FUEL_AIR_MUNITIONS.find((munition) => munition.tags.some((candidate) => candidate === tag || matchesTag({ tag: candidate }, tag)));

/** The damage at the point of impact and each ring under `atmosphere` (IO:AE p.159). */
export const getFuelAirDamage = (tag: string, atmosphere: FuelAirAtmosphere): number[] => {
    const munition = getFuelAirMunition(tag);
    if (!munition) return [];
    if (atmosphere === "standard") return [...munition.damage];
    if (atmosphere === "thin") return munition.damage.map((value) => Math.ceil(value / 2));
    return munition.damage.map(() => 0);
};

/** Infantry take twice the damage, doubled again in clear or open terrain. */
export const getFuelAirInfantryDamage = (damage: number, clearOrOpen: boolean): number => damage * (clearOrOpen ? 4 : 2);

/** Infantry's extra roll: 2D6 plus the hex distance from the point of impact destroys the rest of the unit on 9 or less (conventional) or under 7 (battle armor). */
export const isFuelAirInfantryDestroyed = (roll: number, distance: number, type: "conventional" | "battle-armor"): boolean =>
    type === "conventional" ? roll + distance <= 9 : roll + distance < 7;

/** The blast against buildings and low-BAR units: halved (rounding down) for a Castle Brian or armored building first, then 1.5 times (rounding up) for a light building or BAR under 10. */
export const getFuelAirBlastDamage = (damage: number, target: { lightBuildingOrLowBar?: boolean; castleBrianOrArmored?: boolean }): number => {
    let result = damage;
    if (target.castleBrianOrArmored) result = Math.floor(result / 2);
    if (target.lightBuildingOrLowBar) result = Math.ceil(result * 1.5);
    return result;
};
