import { IEquipmentItem } from "./data-interfaces";

/** Aerospace range brackets in order: Short, Medium, Long, Extreme (TW p.303). */
export const AEROSPACE_RANGE_BRACKETS = ["s", "m", "l", "e"] as const;

/**
 * A weapon's standard-scale Attack Value at each aerospace range bracket (SRV, MRV, LRV, ERV), as the record sheets
 * list them (TW p.30). A weapon with per-bracket values (damage.aeroShort and so on) uses those; otherwise its aerospace
 * damage applies out to its aerospace range and is 0 beyond it. Null when the record has damage but no aerospace range,
 * so the sheet can show it as unknown instead of guessing.
 */
export function getAerospaceDamageByBracket(item: IEquipmentItem): [number, number, number, number] | null {
    if (item.damage && typeof item.damage === "object") {
        return [item.damage.aeroShort ?? 0, item.damage.aeroMedium ?? 0, item.damage.aeroLong ?? 0, 0];
    }
    const damage = item.damageAero ?? 0;
    if (damage <= 0) return [0, 0, 0, 0];
    const reach = AEROSPACE_RANGE_BRACKETS.indexOf((item.rangeAero ?? "") as typeof AEROSPACE_RANGE_BRACKETS[number]);
    if (reach < 0) return null;
    return [0, 1, 2, 3].map((bracket) => (bracket <= reach ? damage : 0)) as [number, number, number, number];
}

/** Capital-scale value of standard-scale damage: a tenth, rounded normally (SO:AA p.9). */
export function toCapitalScale(standard: number): number {
    return Math.round(standard / 10);
}

/**
 * The aerospace fighter and Small Craft Heat Scale, printed on their record sheets (TM pp.336-339) for the rules on
 * TW p.161: random movement at 5, 10, 15, 20 and 25; ammunition explosion at 19, 23 and 28; pilot damage at 21 and 27.
 */
export const AEROSPACE_HEAT_SCALE: { heat: number; effect: string }[] = [
    { heat: 30, effect: "Shutdown" },
    { heat: 28, effect: "Ammo Exp. avoid on 8+" },
    { heat: 27, effect: "Pilot Damage, avoid on 9+" },
    { heat: 26, effect: "Shutdown, avoid on 10+" },
    { heat: 25, effect: "Random Movement, avoid on 10+" },
    { heat: 24, effect: "+4 Modifier to Fire" },
    { heat: 23, effect: "Ammo Exp. avoid on 6+" },
    { heat: 22, effect: "Shutdown, avoid on 8+" },
    { heat: 21, effect: "Pilot Damage, avoid on 6+" },
    { heat: 20, effect: "Random Movement, avoid on 8+" },
    { heat: 19, effect: "Ammo Exp. avoid on 4+" },
    { heat: 18, effect: "Shutdown, avoid on 6+" },
    { heat: 17, effect: "+3 Modifier to Fire" },
    { heat: 15, effect: "Random Movement, avoid on 7+" },
    { heat: 14, effect: "Shutdown, avoid on 4+" },
    { heat: 13, effect: "+2 Modifier to Fire" },
    { heat: 10, effect: "Random Movement, avoid on 6+" },
    { heat: 8, effect: "+1 Modifier to Fire" },
    { heat: 5, effect: "Random Movement, avoid on 5+" },
];

/** Pilot (or crew) hits: the consciousness number and modifier printed for each (TM p.336; SO:AA p.10). */
export const AEROSPACE_PILOT_HITS: { hit: number; consciousness: string; modifier: string }[] = [
    { hit: 1, consciousness: "3", modifier: "+1" },
    { hit: 2, consciousness: "5", modifier: "+2" },
    { hit: 3, consciousness: "7", modifier: "+3" },
    { hit: 4, consciousness: "10", modifier: "+4" },
    { hit: 5, consciousness: "11", modifier: "+5" },
    { hit: 6, consciousness: "Dead", modifier: "" },
];

/** Critical Damage block of a fighter or Small Craft sheet: each track's boxes with their printed effects (TM p.336). */
export const AEROSPACE_FIGHTER_CRITICAL_BLOCK: { name: string; boxes: string[] }[] = [
    { name: "Avionics", boxes: ["+1", "+2", "+5"] },
    { name: "Engine", boxes: ["2", "4", "D"] },
    { name: "FCS", boxes: ["+2", "+4", "D"] },
    { name: "Sensors", boxes: ["+1", "+2", "+5"] },
    { name: "Gear", boxes: ["+5"] },
    { name: "Life Support", boxes: ["+2"] },
];

/** Critical Damage block of a JumpShip, WarShip or space station sheet (SO:AA pp.10-11). */
export const ADVANCED_AEROSPACE_CRITICAL_BLOCK: { name: string; boxes: string[] }[] = [
    { name: "Avionics", boxes: ["+1", "+2", "+5"] },
    { name: "Life Support", boxes: ["+2"] },
    { name: "CIC", boxes: ["+2", "+4", "D"] },
    { name: "Sensors", boxes: ["+1", "+2", "+5"] },
    { name: "Left Thrusters", boxes: ["+1", "+2", "+3", "D"] },
    { name: "Right Thrusters", boxes: ["+1", "+2", "+3", "D"] },
    { name: "Engine", boxes: ["-1", "-2", "-3", "-4", "-5", "D"] },
];

/** Crew hits on a JumpShip, WarShip or space station sheet: the modifier for each, the sixth incapacitating (SO:AA p.10). */
export const ADVANCED_AEROSPACE_CREW_HITS: string[] = ["+1", "+2", "+3", "+4", "+5", "Incp."];

/** Straight Movement on Ground Maps (aerodyne craft only), TW p. 92: the fewest hexes an aerodyne unit moves straight
 *  at each velocity on a ground map. Fixed-wing support vehicles move double the fighter figure (TW p. 84); Large
 *  Support Vehicles use the Small Craft column. Above velocity 12 a unit cannot fly on a ground map; one forced over
 *  12 stays at 12 and makes a Control Roll. */
export const GROUND_MAP_STRAIGHT_MOVEMENT: { velocity: number; fighter: number; smallCraft: number; dropShip: number }[] = [
    { velocity: 1, fighter: 8, smallCraft: 8, dropShip: 8 },
    { velocity: 2, fighter: 12, smallCraft: 14, dropShip: 16 },
    { velocity: 3, fighter: 16, smallCraft: 20, dropShip: 24 },
    { velocity: 4, fighter: 20, smallCraft: 26, dropShip: 32 },
    { velocity: 5, fighter: 24, smallCraft: 32, dropShip: 40 },
    { velocity: 6, fighter: 28, smallCraft: 38, dropShip: 48 },
    { velocity: 7, fighter: 32, smallCraft: 44, dropShip: 56 },
    { velocity: 8, fighter: 36, smallCraft: 50, dropShip: 64 },
    { velocity: 9, fighter: 40, smallCraft: 56, dropShip: 72 },
    { velocity: 10, fighter: 44, smallCraft: 62, dropShip: 80 },
    { velocity: 11, fighter: 48, smallCraft: 68, dropShip: 88 },
    { velocity: 12, fighter: 52, smallCraft: 74, dropShip: 96 },
];

/** The Fighter Return Table, as printed on the Total Warfare conventional fighter record sheet: how many turns a
 *  fighter that flies off a ground map takes to return, by safe thrust. */
export const FIGHTER_RETURN_TABLE: { safeThrust: string; turns: number }[] = [
    { safeThrust: "1-4", turns: 3 },
    { safeThrust: "5-8", turns: 2 },
    { safeThrust: "9-12", turns: 1 },
    { safeThrust: "13+", turns: 0 },
];
