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
 * Basic Battledroids (Battledroids, FASA 1984, pp.3-6, cited as BD): the introductory game, in which each of the
 * ten printed droids has one Armor Value and one Damage Value for each range, and a hit is settled on the Armor
 * Penetration and Damage Effects tables. It has no record sheets, heat or construction, so a droid designed in
 * the creator has no Basic game statistics: only the ten below do. Every figure is as the pages print it.
 */

export type BattledroidsBasicRange = "contact" | "short" | "medium" | "long";

export interface IBattledroidsBasicDroid {
    name: string;
    move: number;
    /** Jump movement points; 0 where the table prints a dash. */
    jump: number;
    armor: number;
    /** Damage Value by range; 0 where the table prints a dash (no attack at that range). */
    damage: Record<BattledroidsBasicRange, number>;
}

// Basic Game Statistics, BD p.6. The worked example on the same page gives the Crusader an Armor Value of 13 and
// the Warhammer a Damage Value of 15 at medium range; the table prints 10 and 16, and the table is what is entered.
export const battledroidsBasicDroids: IBattledroidsBasicDroid[] = [
    { name: "Stinger", move: 6, jump: 6, armor: 5, damage: { contact: 3, short: 6, medium: 5, long: 0 } },
    { name: "Wasp", move: 6, jump: 6, armor: 5, damage: { contact: 3, short: 6, medium: 5, long: 0 } },
    { name: "Shadow Hawk", move: 5, jump: 3, armor: 9, damage: { contact: 7, short: 7, medium: 9, long: 6 } },
    { name: "Phoenix Hawk", move: 6, jump: 6, armor: 8, damage: { contact: 7, short: 11, medium: 10, long: 6 } },
    { name: "Griffin", move: 5, jump: 6, armor: 8, damage: { contact: 7, short: 7, medium: 9, long: 9 } },
    { name: "Archer", move: 4, jump: 0, armor: 11, damage: { contact: 8, short: 7, medium: 15, long: 12 } },
    { name: "Crusader", move: 4, jump: 0, armor: 10, damage: { contact: 8, short: 11, medium: 16, long: 10 } },
    { name: "Warhammer", move: 4, jump: 0, armor: 9, damage: { contact: 8, short: 16, medium: 16, long: 11 } },
    { name: "Rifleman", move: 4, jump: 0, armor: 7, damage: { contact: 7, short: 14, medium: 14, long: 14 } },
    { name: "Marauder", move: 4, jump: 0, armor: 10, damage: { contact: 9, short: 16, medium: 16, long: 12 } },
];

/** Range Table, BD p.5: 1 hex contact, 2-3 short, 4-10 medium, 11-21 long. Undefined beyond 21 hexes. */
export function getBattledroidsBasicRange(hexes: number): BattledroidsBasicRange | undefined {
    if (hexes < 1 || hexes > 21) return undefined;
    if (hexes === 1) return "contact";
    if (hexes <= 3) return "short";
    return hexes <= 10 ? "medium" : "long";
}

export type BattledroidsBasicAttackerMove = "stationary" | "walked" | "ran" | "jumped";

export interface IBattledroidsBasicShot {
    range: BattledroidsBasicRange;
    attackerMove: BattledroidsBasicAttackerMove;
    /** Hexes the target moved, and whether it jumped. */
    targetHexesMoved: number;
    targetJumped: boolean;
    /** Light woods hexes between the two droids, and the woods the target stands in. */
    lightWoodsBetween: number;
    targetInLightWoods: boolean;
    targetInHeavyWoods: boolean;
}

/**
 * Modified To-Hit Number of a Basic game shot (BD p.5): 4 at contact range and 6 at the others, plus the
 * Movement Modifiers Table and the woods. 13 or more is an automatic miss.
 */
export function getBattledroidsBasicToHit(shot: IBattledroidsBasicShot): number {
    const attacker = { stationary: 0, walked: 1, ran: 2, jumped: 3 }[shot.attackerMove];
    const moved = Math.max(0, shot.targetHexesMoved);
    const target = (moved >= 7 ? 3 : moved >= 5 ? 2 : moved >= 3 ? 1 : 0) + (shot.targetJumped ? 1 : 0);
    const terrain = Math.max(0, shot.lightWoodsBetween) + (shot.targetInLightWoods ? 1 : 0) + (shot.targetInHeavyWoods ? 2 : 0);
    return (shot.range === "contact" ? 4 : 6) + attacker + target + terrain;
}

export type BattledroidsBasicFacing = "front" | "rear-side" | "rear";

/** Armor Value against an attack: 1 less through a rear side hexside, 2 less through the rear hexside (BD p.6). */
export function getBattledroidsBasicArmorValue(armor: number, facing: BattledroidsBasicFacing): number {
    return armor - (facing === "rear" ? 2 : facing === "rear-side" ? 1 : 0);
}

// Armor Penetration Table, BD p.6: rows are Damage Values 3 to 16, columns the target's Armor Values 5 to 13.
const ARMOR_PENETRATION: number[][] = [
    [8, 8, 9, 9, 10, 10, 10, 11, 11],
    [7, 8, 8, 9, 9, 10, 10, 10, 11],
    [7, 7, 8, 8, 9, 9, 10, 10, 10],
    [6, 7, 7, 8, 8, 9, 9, 10, 10],
    [6, 6, 7, 7, 8, 8, 9, 9, 10],
    [5, 6, 6, 7, 7, 8, 8, 9, 9],
    [5, 5, 6, 6, 7, 7, 8, 8, 9],
    [4, 5, 5, 6, 6, 7, 7, 8, 8],
    [4, 4, 5, 5, 6, 6, 7, 7, 8],
    [3, 4, 4, 5, 5, 6, 6, 7, 7],
    [3, 3, 4, 4, 5, 5, 6, 6, 7],
    [3, 3, 3, 4, 4, 5, 5, 6, 6],
    [3, 3, 3, 3, 4, 4, 5, 5, 6],
    [3, 3, 3, 3, 3, 4, 4, 5, 5],
];
export const BATTLEDROIDS_BASIC_MIN_ARMOR_COLUMN = 5;

/**
 * The Damage Number: the least two-dice roll that penetrates. Undefined where the table has no entry: a Damage
 * Value under 3 or over 16, or an Armor Value over 13. The table's lowest column is Armor Value 5, and a Stinger
 * or Wasp hit from behind has 4 or 3: `belowTable` is then true and the number is the 5 column's, the nearest the
 * book prints.
 */
export function getBattledroidsBasicDamageNumber(damageValue: number, armorValue: number): { number: number; belowTable: boolean } | undefined {
    const row = ARMOR_PENETRATION[damageValue - 3];
    if (!row || armorValue > 13) return undefined;
    const belowTable = armorValue < BATTLEDROIDS_BASIC_MIN_ARMOR_COLUMN;
    return { number: row[Math.max(0, armorValue - BATTLEDROIDS_BASIC_MIN_ARMOR_COLUMN)], belowTable };
}

/** Damage Effects Table, BD p.6, by the two-dice roll. */
export function getBattledroidsBasicDamageEffect(roll: number): string {
    if (roll <= 4 || roll >= 10) return "Battledroid destroyed.";
    switch (roll) {
        case 5: return "Weapons destroyed: attacks at contact range only. If rolled again, reroll.";
        case 6: return "Battledroid cannot move or fire for 2 turns.";
        case 7: return "Battledroid cannot move or fire for 1 turn.";
        case 8: return "Battledroid cannot move or fire for 2 turns.";
        default: return "Battledroid's MP reduced to half (rounding down). If rolled again, the droid is immobilized and cannot move or change its facing. If rolled again, reroll.";
    }
}
