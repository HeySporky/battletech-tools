import { IEquipmentItem } from "./data-interfaces";

/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
*/
export const mechClanEquipmentMissile: IEquipmentItem[] = [
    {
        isAmmo: true,
        name: "Ammo (Clan LRM-20)",
        tag: "ammo-clan-lrm-20",
        sort: "ammo, clan, lrm, 20",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 2000,
        introduced: 2900,
        extinct: null,
        reintroduced: null,
        battleValue: 10,
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
        ammoPerTon: 24,
        minAmmoTons: 1,
        explosive: true,
        weaponType: [
            "M"
        ],
        techRating: "e",
        book: "TM",
        page: 279,
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
        name: "Clan LRM-20",
        tag: "clan-lrm-20",
        sort: "lrm, 20",
        category: "Missile Weapons",
        damage: 5,
        damageAero: 5,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2900,
        extinct: null,
        reintroduced: null,
        battleValue: 150,
        heat: 4,
        weight: 5,
        range: {
            min: 0,
            short: 7,
            medium: 14,
            long: 21
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
            "M"
        ],
        techRating: "e",
        book: "TM",
        page: 280,
        alphaStrike: {
            heat: 4,
            rangeShort: 0.75,
            rangeMedium: 0.75,
            rangeLong: 0.75,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 4,
        rangeAero: "m"
    }
];
