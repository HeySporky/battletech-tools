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
        battleValueDefensive: true,
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
        shotsPerTon: 0,
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
        battleValueDefensive: true,
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
        shotsPerTon: 0,
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
    },
    { isAmmo: false, name: "TAG (Clan)", altNames: ["Clan TAG", "Clan Target Acquisition Gear"], tag: "clan-tag", altTags: [], catalog: "clan", sort: "equipment, tag, clan", category: "Miscellaneous Equipment", alternateName: "TAG", damage: 0, notes: "Target Acquisition Gear: designates a target for homing artillery and semi-guided munitions; deals no damage.", damageAero: 0, accuracyModifier: 0, cbills: 50000, introduced: 2830, extinct: 0, reintroduced: 0, prototype: 2828, battleValue: 0, heat: 0, weight: 1, range: { min: 0, short: 5, medium: 9, long: 15 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TM", page: 238, alphaStrike: { specialAbility: ["TAG"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, heatAero: 0 },
    { isAmmo: false, name: "Light TAG (Clan)", altNames: ["Clan Light TAG"], tag: "clan-light-tag", altTags: ["light-tag"], catalog: "clan", sort: "equipment, tag, light, clan", category: "Miscellaneous Equipment", alternateName: "Light TAG", damage: 0, notes: "Target Acquisition Gear: designates a target for homing artillery and semi-guided munitions; deals no damage.", damageAero: 0, accuracyModifier: 0, cbills: 40000, introduced: 3054, extinct: 0, reintroduced: 0, prototype: 3051, battleValue: 0, heat: 0, weight: 0.5, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TM", page: 238, alphaStrike: { specialAbility: ["LTAG"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, heatAero: 0 },
];
