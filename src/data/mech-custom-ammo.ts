import { IEquipmentItem } from "./data-interfaces";

export const mechCustomAmmo: IEquipmentItem[] = [
    {
        isAmmo: true, name: "Ammo (Reloading Rocket Launcher)", altNames: ["Rocket Launcher Ammo", "RRL Ammo"], tag: "ammo-rocket-launcher", altTags: ["ammo-rl"], sort: "ammo, rocket launcher", category: "Ammunition",
        cbills: 45000, introduced: 3067, extinct: 0, reintroduced: 0, battleValue: 0, heat: 0, heatAero: 0, weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 240, explosive: true, techRating: "e", book: "TO", page: 0,
        alphaStrike: { specialAbility: ["MSL"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }
    }
];