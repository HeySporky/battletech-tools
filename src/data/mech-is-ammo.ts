import { IEquipmentItem } from "./data-interfaces";

/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
*/
export const mechISAmmo: IEquipmentItem[] = [
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (LRM Semi-Guided)",
        altNames: ["Semi-Guided LRM Ammo", "LRM SG Ammo", "SG LRM Ammo"],
        tag: "ammo-lrm-semi-guided",
        sort: "ammo, lrm, semi-guided",
        category: "Ammunition",
        cbills: 90000,
        introduced: 3057,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 120,
        explosive: true,
        techRating: "e",
        book: "TW",
        page: 142,
        alphaStrike: { specialAbility: ["LRM#/#/#/#/#", "IF#"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }
    }
];
