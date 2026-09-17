import { IEquipmentItem } from "./data-interfaces";

export const mechCustomEquipmentMisc: IEquipmentItem[] = [
    {
        name: "Null-Signature System (Fan Design)", tag: "custom-null-signature-system", sort: "null-signature, system", category: "Custom Equipment", notes: "Unverified placeholder for a fan-designed stealth and sensor-disruption system.",
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 0, extinct: null, reintroduced: null, battleValue: 0, heat: 0, heatAero: 0, weight: 2,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "x", book: "Fan Design", page: 0, rulesLevel: 5,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    }
];