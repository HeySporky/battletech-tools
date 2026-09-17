import { IEquipmentItem } from "./data-interfaces";

export const mechCustomEquipmentMissile: IEquipmentItem[] = [
    {
        name: "SRM-8 (Solaris7)", tag: "custom-srm-8", sort: "srm, 8", category: "Custom Equipment", notes: "Unverified placeholder based on the Kronos Battle Systems 'SRM 8 and SRM 10 launchers' homebrew rules (Solaris7 forum thread, archived).",
        damage: 2, damageClusters: 8, damagePerCluster: 2, damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 0, extinct: null, reintroduced: null, battleValue: 0, heat: 3, heatAero: 3, weight: 4,
        range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 12, minAmmoTons: 1, explosive: false, weaponType: ["M"], techRating: "x", book: "Solaris7", page: 0, rulesLevel: 5,
        alphaStrike: { heat: 3, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    }
];