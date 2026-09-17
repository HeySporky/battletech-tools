import { IEquipmentItem } from "./data-interfaces";

export const mechCustomEquipmentBallistic: IEquipmentItem[] = [
    {
        name: "AC/15 (Solaris7)", tag: "custom-ac-15", sort: "ac, 15", category: "Custom Equipment", notes: "Unverified placeholder based on the Kronos Battle Systems 'Class 15 autocannons' homebrew rules (Solaris7 forum thread, archived).",
        damage: 15, damageAero: 15, accuracyModifier: 0, cbills: 0, introduced: 0, extinct: null, reintroduced: null, battleValue: 0, heat: 5, heatAero: 5, weight: 13,
        range: { min: 3, short: 5, medium: 10, long: 15 }, space: { battlemech: 9, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 5, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "x", book: "Solaris7", page: 0, rulesLevel: 5,
        alphaStrike: { heat: 5, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    }
];