import { IEquipmentItem } from "./data-interfaces";

export const mechCustomEquipmentEnergy: IEquipmentItem[] = [
    {
        name: "Disruptor (MekTek)", tag: "custom-disruptor", sort: "disruptor", category: "Custom Equipment", notes: "Unverified placeholder associated with MekTek Issue 2.",
        damage: 10, damageAero: 10, accuracyModifier: 0, cbills: 0, introduced: 0, extinct: null, reintroduced: null, battleValue: 0, heat: 8, heatAero: 8, weight: 6,
        range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE", "E"], techRating: "x", book: "MekTek", page: 0, rulesLevel: 5,
        alphaStrike: { heat: 8, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    }
];