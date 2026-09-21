import { IEquipmentItem } from "./data-interfaces";

export const mechCustomEquipmentEnergy: IEquipmentItem[] = [
    {
       name: "COIL-L",
        tag: "coil_l",
        sort: "laser, coil large",
        category: "Energy Weapons",
        damage: 35,
        damageAero: 35,
        accuracyModifier: 0,
        cbills: 360000,
        introduced: 3025,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 70,
        weight: 8,
        range: {
            min: 90,
            short: 180,
            medium: 315,
            long: 450
        },
        space: {
            battlemech: 4,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 4,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        ammoPerTon: 0,
        minAmmoTons: 0,
        explosive: true,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "HM",
        page: 0,
        alphaStrike: {
            heat: 14,
            rangeShort: 3.5,
            rangeMedium: 3.5,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: ["Explosive, Unverified custom equipment"]
        },
        heatAero: 70
    },
    {
        name: "COIL-M",
        tag: "coil_m",
        sort: "laser, coil medium",
        category: "Energy Weapons",
        damage: 25,
        damageAero: 25,
        accuracyModifier: 0,
        cbills: 220000,
        introduced: 3025,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 40,
        weight: 4,
        range: {
            min: 0,
            short: 90,
            medium: 180,
            long: 270
        },
        space: {
            battlemech: 3,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 3,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        ammoPerTon: 0,
        minAmmoTons: 0,
        explosive: true,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "HM",
        page: 0,
        alphaStrike: {
            heat: 8,
            rangeShort: 2.5,
            rangeMedium: 2.5,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: ["Explosive, Unverified custom equipment"]
        },
        heatAero: 40
    },
    {
        name: "COIL-S",
        tag: "coil_s",
        sort: "laser, coil small",
        category: "Energy Weapons",
        damage: 15,
        damageAero: 15,
        accuracyModifier: 0,
        cbills: 110000,
        introduced: 3025,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 30,
        weight: 2,
        range: {
            min: 0,
            short: 30,
            medium: 60,
            long: 90
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
        minAmmoTons: 0,
        explosive: true,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "HM",
        page: 0,
        alphaStrike: {
            heat: 6,
            rangeShort: 1.5,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: ["Explosive, Unverified custom equipment"]
        },
        heatAero: 30
    },
    {
        name: "Disruptor (MekTek)", tag: "custom-disruptor", sort: "disruptor", category: "Custom Equipment", notes: "Unverified placeholder associated with MekTek Issue 2.",
        damage: 10, damageAero: 10, accuracyModifier: 0, cbills: 0, introduced: 0, extinct: null, reintroduced: null, battleValue: 0, heat: 8, heatAero: 8, weight: 6,
        range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE", "E"], techRating: "x", book: "MekTek", page: 0, rulesLevel: 5,
        alphaStrike: { heat: 8, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    }
];