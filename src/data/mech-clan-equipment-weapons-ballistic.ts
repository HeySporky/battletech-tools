import { IEquipmentItem } from "./data-interfaces";

/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
*/
export const mechClanEquipmentBallistic: IEquipmentItem[] = [
    {
        isAmmo: true,
        name: "Ammo (Clan LB 5-X AC)",
        tag: "ammo-clan-lb-5x-ac",
        sort: "ammo, clan, lb, 5-x, ac",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 5000,
        introduced: 2900,
        extinct: null,
        reintroduced: null,
        battleValue: 16,
        heat: 0,
        weight: 1,
        range: {
            min: 0,
            short: 6,
            medium: 12,
            long: 18
        },
        space: {
            battlemech: 1,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 1,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        ammoPerTon: 45,
        minAmmoTons: 1,
        explosive: true,
        weaponType: [
            "DB",
            "S"
        ],
        techRating: "e",
        book: "TM",
        page: 284,
        alphaStrike: {
            heat: 0,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: []
        },
        heatAero: 0
    },
    {
        name: "Clan LB 5-X AC",
        tag: "clan-lb-5x-ac",
        sort: "lb, 5-x, ac",
        category: "Ballistic Weapons",
        damage: 5,
        damageAero: 5,
        accuracyModifier: 0,
        cbills: 150000,
        introduced: 2900,
        extinct: null,
        reintroduced: null,
        battleValue: 138,
        heat: 1,
        weight: 4,
        range: {
            min: 0,
            short: 6,
            medium: 12,
            long: 18
        },
        space: {
            battlemech: 2,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 2,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        ammoPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "DB",
            "S"
        ],
        techRating: "e",
        book: "TM",
        page: 287,
        alphaStrike: {
            heat: 1,
            rangeShort: 0.6,
            rangeMedium: 0.6,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: []
        },
        heatAero: 1,
        rangeAero: "m"
    }
];
