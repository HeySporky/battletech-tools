import { IEquipmentItem } from "./data-interfaces";

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
 * All official lore, trademarks, and intellectual property belong strictly to 
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders. 
 * Any original, fan-made content or custom homebrew data processed by this tool 
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for 
 * tabletop gameplay assistance. Content processed by this file is not intended 
 * to challenge any copyright or trademark status, and this data is explicitly 
 * excluded from the software's underlying license (GNU GPLv3).
 */

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
        shotsPerTon: 0,
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
        shotsPerTon: 0,
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
        shotsPerTon: 0,
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
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE", "E"], techRating: "x", book: "MekTek", page: 0, rulesLevel: 5,
        alphaStrike: { heat: 8, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    },
    {
        // Non-canon: IO does not allow a PPC Capacitor on Clan PPCs (user decision 2026-09-28).
        // Built as the Clan ER PPC plus the capacitor's +1 t / +1 slot / +150,000 C-bills
        // (the IS ER PPC to ER PPC w/ Capacitor difference); Alpha Strike from the workbook (C) row.
        name: "ER PPC w/ Capacitor (Clan)", tag: "clan-er-ppc-capacitor", altNames: ["ER PPC w/ Capacitor (C)"], altTags: [], catalog: "custom",
        sort: "ppc, er, capacitor, clan", category: "Energy Weapons",
        notes: "Custom homebrew, not canon: IO rules out PPC Capacitors on Clan PPCs. Charged shot adds +5 damage and +5 heat as the IS version. BV copied from the Clan ER PPC; the capacitor's BV is not computed.",
        damage: 15, damageAero: 15, accuracyModifier: 0, cbills: 450000, introduced: null, extinct: null, reintroduced: null, battleValue: 412, heat: 15, heatAero: 15, weight: 7,
        range: { min: 0, short: 7, medium: 14, long: 23 }, space: { battlemech: 3, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE"], techRating: "f", book: "Custom", page: 0, rulesLevel: 5,
        alphaStrike: { heat: 15, rangeShort: 1, rangeMedium: 1, rangeLong: 1, rangeExtreme: 0, tc: true, notes: ["Custom homebrew", "Provisional workbook conversion"] },
        rangeAero: "e"
    },
    {
        isAmmo: false,
        name: "Enhanced ER Large Laser",
        tag: "enhanced_er_large_laser",
        catalog: "custom",
        notes: "No canon source found: the original tool cited IO p.189, but neither Interstellar Operations (2016) nor IO: Alternate Eras lists a Clan \"Enhanced ER Large Laser\". Kept as Custom Homebrew with its old tag and statistics until a source is found.",
        sort: "laser, enhanced er large",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2823,
        extinct: 2828,
        reintroduced: null,
        battleValue: 222,
        heat: 12,
        weight: 4,
        range: {
            min: 0,
            short: 6,
            medium: 12,
            long: 20
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
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "Custom",
        page: null,
        rulesLevel: 5,
        alphaStrike: {
            heat: 12,
            rangeShort: 1.0,
            rangeMedium: 1.0,
            rangeLong: 1.0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 12,
        rangeAero: "l"
    }
];