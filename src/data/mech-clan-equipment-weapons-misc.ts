import { IEquipmentItem } from "./data-interfaces";

/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
*/
export const mechClanEquipmentMisc: IEquipmentItem[] = [
    {
        name: "Clan Active Probe",
        tag: "clan-active-probe",
        sort: "active, probe",
        category: "Miscellaneous Equipment",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 75000,
        introduced: 2900,
        extinct: null,
        reintroduced: null,
        battleValue: 40,
        heat: 0,
        weight: 1,
        range: {
            min: 0,
            short: 0,
            medium: 0,
            long: 0
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
        ammoPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ECM",
            "SENS"
        ],
        techRating: "e",
        book: "TM",
        page: 306,
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
        name: "Clan ECM Suite",
        tag: "clan-ecm-system",
        sort: "ecm, system",
        category: "Miscellaneous Equipment",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 150000,
        introduced: 2900,
        extinct: null,
        reintroduced: null,
        battleValue: 75,
        heat: 0,
        weight: 1.5,
        range: {
            min: 0,
            short: 0,
            medium: 0,
            long: 0
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
        ammoPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ECM",
            "SENS"
        ],
        techRating: "e",
        book: "TM",
        page: 313,
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
    }
];
