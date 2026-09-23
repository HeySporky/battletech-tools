import { IEquipmentItem } from "./data-interfaces";
import { mechUniversalAmmo } from "./mech-universal-ammo";

function hasUniversalMetrics(item: IEquipmentItem, counterpart: IEquipmentItem): boolean {
    return item.name === counterpart.name
        && item.weight === counterpart.weight
        && item.space.battlemech === counterpart.space.battlemech
        && JSON.stringify(item.damage) === JSON.stringify(counterpart.damage)
        && JSON.stringify(item.range) === JSON.stringify(counterpart.range);
}

export const mechUniversalEquipment: IEquipmentItem[] = [
    { isAmmo: false, name: "Heavy Rifle", altNames: [], tag: "heavy-rifle", altTags: [], sort: "heavy rifle", category: "Ballistic Weapons", damage: 9, notes: "Universal experimental rifle; workbook conversion provisional.", damageAero: 9, accuracyModifier: 0, cbills: 90000, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 91, heat: 4, heatAero: 4, weight: 8, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 4, rangeShort: 0.747, rangeMedium: 0.9, rangeLong: 0.9, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion"] }, rangeAero: "", },
    { isAmmo: false, name: "Nail Gun", altNames: ["Rivet Gun"], tag: "nail-gun", altTags: ["rivet-gun"], sort: "nail gun/rivet gun", category: "Ballistic Weapons", damage: 0, notes: "Universal industrial weapon; workbook conversion provisional.", damageAero: 0, accuracyModifier: 0, cbills: 10000, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 5, heat: 0, heatAero: 0, weight: 0.5, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 0, rangeShort: 0.05, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional workbook conversion"] }, rangeAero: "", },
    { isAmmo: false, name: "Light Rifle", altNames: [], tag: "light-rifle", altTags: [], sort: "light rifle", category: "Ballistic Weapons", damage: 3, notes: "Universal experimental rifle; workbook conversion provisional.", damageAero: 3, accuracyModifier: 0, cbills: 37750, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 21, heat: 1, heatAero: 1, weight: 3, range: { min: 0, short: 4, medium: 8, long: 12 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.3, rangeMedium: 0.3, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion"] }, rangeAero: "", },
    { isAmmo: false, name: "Medium Rifle", altNames: [], tag: "medium-rifle", altTags: [], sort: "medium rifle", category: "Ballistic Weapons", damage: 6, notes: "Universal experimental rifle; workbook conversion provisional.", damageAero: 6, accuracyModifier: 0, cbills: 75500, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 51, heat: 2, heatAero: 2, weight: 5, range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 3, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 2, rangeShort: 0.552, rangeMedium: 0.6, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion"] }, rangeAero: "", },
    { 
        isAmmo: false, 
        name: "Rocket Launcher 10", 
        altNames: ["Rocket-Launcher 10"], 
        tag: "rocket-launcher-10", 
        altTags: [], 
        sort: "missile, rocket launcher 10", 
        category: "Missile Weapons", 
        damage: 0, 
        notes: "Universal one-shot launcher; workbook Alpha Strike values are provisional.", 
        damageAero: 2, 
        accuracyModifier: 0, 
        cbills: 15000, 
        cbillsOneShot: 0, 
        introduced: 3067, 
        extinct: 0, 
        reintroduced: 0, 
        battleValue: 12, 
        heat: 3, 
        heatAero: 3, 
        weight: 0.5, 
        range: { min: 0, short: 3, medium: 7, long: 12 }, 
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, 
        ammoPerTon: 0, 
        minAmmoTons: 1, 
        explosive: false, 
        weaponType: ["MS"], 
        techRating: "e", 
        book: "TO", 
        page: 0, 
        alphaStrike: { heat: 0, rangeShort: 0.06, rangeMedium: 0.06, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional workbook conversion"] }, 
        damageClusters: 10, 
        damagePerCluster: 1, 
        isOneShot: true, 
        rangeAero: "m" 
    },
    { 
        isAmmo: false, 
        name: "Rocket Launcher 15", 
        altNames: ["Rocket-Launcher 15"], 
        tag: "rocket-launcher-15", 
        altTags: [], 
        sort: "missile, rocket launcher 15", 
        category: "Missile Weapons", 
        damage: 0, 
        notes: "Universal one-shot launcher; workbook Alpha Strike values are provisional.", 
        damageAero: 2, 
        accuracyModifier: 0, 
        cbills: 30000, 
        cbillsOneShot: 0, 
        introduced: 3067, 
        extinct: 0, 
        reintroduced: 0, 
        battleValue: 18, 
        heat: 4, 
        heatAero: 4, 
        weight: 1, 
        range: { min: 0, short: 3, medium: 7, long: 12 }, 
        space: { battlemech: 2, protomech: -1, combatVehicle: 2, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, 
        ammoPerTon: 0, 
        minAmmoTons: 1, 
        explosive: false, 
        weaponType: ["MS"], 
        techRating: "e", 
        book: "TO", 
        page: 0, 
        alphaStrike: { heat: 0, rangeShort: 0.09, rangeMedium: 0.09, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional workbook conversion"] }, 
        damageClusters: 15, 
        damagePerCluster: 1, 
        isOneShot: true, 
        rangeAero: "m" 
    },
    { isAmmo: false, name: "Rocket Launcher 20", altNames: ["Rocket-Launcher 20"], tag: "rocket-launcher-20", altTags: [], sort: "missile, rocket launcher 20", category: "Missile Weapons", damage: 0, notes: "Universal one-shot launcher; workbook Alpha Strike values are provisional.", damageAero: 3, accuracyModifier: 0, cbills: 45000, cbillsOneShot: 0, introduced: 3067, extinct: 0, reintroduced: 0, battleValue: 24, heat: 5, heatAero: 5, weight: 1.5, range: { min: 0, short: 3, medium: 7, long: 12 }, space: { battlemech: 3, protomech: -1, combatVehicle: 3, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["MS"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 0, rangeShort: 0.12, rangeMedium: 0.12, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional workbook conversion"] }, damageClusters: 20, damagePerCluster: 1, isOneShot: true, rangeAero: "m" },
    { isAmmo: false, name: "Thumper Artillery Piece", altNames: ["Thumper"], tag: "thumper-artillery", altTags: [], sort: "artillery, thumper", category: "Artillery Weapons", weaponType: ["ART"], notes: "Indirect-fire tube artillery. Targets a physical map hex rather than a specific unit; damage resolves via area-burst radius templates across map sheets.", damage: 15, damageAero: 2, accuracyModifier: 0, cbills: 187500, introduced: 2348, /* Originally engineered as archaic field artillery during the Early Age of War */ extinct: 0, reintroduced: 0, battleValue: 43, heat: 5, weight: 15, range: { min: 0, short: 0, medium: 0, long: 0, extreme: 0, maxMapSheets: 21 }, space: { battlemech: 15, protomech: -1, combatVehicle: 1, supportVehicle: 15, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 20, minAmmoTons: 1, explosive: false, techRating: "b", book: "TO", page: 96, alphaStrike: { specialAbility: ["ARTTH"], damageAoE: 1, heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Bypasses brackets via the ARTTH trait to place a 1-point AoE strike anywhere on the board."] }, heatAero: 5, rangeAero: "s" /* Short-range tactical mapping for atmosphere/low-altitude strike rules */ },
];

const universalEquipmentTags = new Set([
    ...mechUniversalEquipment.map(item => item.tag),
    ...mechUniversalAmmo.map(item => item.tag),
]);

export function isUniversalEquipment(item: IEquipmentItem): boolean {
    return item.catalog === "universal" || universalEquipmentTags.has(item.tag);
}

export function hasUniversalEquipmentMetrics(item: IEquipmentItem, counterpart: IEquipmentItem): boolean {
    return hasUniversalMetrics(item, counterpart);
}