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

export const mechClanEquipmentEnergy: IEquipmentItem[] = [
    {
        isAmmo: false,
        name: "Enhanced PPC",
        tag: "enhanced_er_ppc",
        sort: "clan, ppc, enhanced, er, 3",
        category: "Energy Weapons",
        damage: 12,
        damageAero: 12,
        accuracyModifier: 0,
        cbills: 300000,
        prototype: 2822,
        introduced: 2823,
        extinct: 2831,
        reintroduced: 3080,
        battleValue: 329,
        heat: 15,
        weight: 7,
        range: {
            min: 0,
            short: 7,
            medium: 14,
            long: 23
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
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "IO:AE",
        page: 90,
        alphaStrike: {
            heat: 15,
            rangeShort: 1.2,
            rangeMedium: 1.2,
            rangeLong: 1.2,
            rangeExtreme: 1.2,
            tc: true,
            notes: []
        },
        heatAero: 15,
        rangeAero: "e",
        altNames: ["Enhanced ER PPC"]
    },
    {
        isAmmo: false,
        name: "ER Large Laser (Clan)",
        tag: "clan-er-large-laser",
        sort: "laser, er, clan, 2, large",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2825,
        extinct: null,
        reintroduced: null,
        prototype: 2820,
        battleValue: 248,
        heat: 12,
        weight: 4,
        range: {
            min: 0,
            short: 8,
            medium: 15,
            long: 25
        },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 12,
            rangeShort: 1,
            rangeMedium: 1,
            rangeLong: 1,
            rangeExtreme: 1,
            tc: true,
            notes: []
        },
        heatAero: 12,
        rangeAero: "e"
    },
    {
        isAmmo: false,
        name: "ER Large Pulse Laser",
        tag: "er_large_pulse_laser",
        sort: "laser, er large pulse",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: -1,
        cbills: 400000,
        prototype: 3057,
        introduced: 3082,
        extinct: null,
        reintroduced: null,
        battleValue: 272,
        heat: 13,
        weight: 6,
        range: {
            min: 0,
            short: 7,
            medium: 15,
            long: 23
        },
        space: { battlemech: 3, protomech: 1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "f",
        book: "TO:AUE",
        page: 132,
        alphaStrike: {
            heat: 13,
            rangeShort: 1.0,
            rangeMedium: 1.0,
            rangeLong: 1.0,
            rangeExtreme: 1.0,
            tc: true,
            notes: []
        },
        heatAero: 13,
        rangeAero: "e"
    },
    {
        isAmmo: false,
        name: "ER Medium Laser (Clan)",
        tag: "er-medium-laser-clan",
        sort: "laser, er, clan, 2, medium",
        category: "Energy Weapons",
        damage: 7,
        damageAero: 7,
        accuracyModifier: 0,
        cbills: 80000,
        introduced: 2824,
        extinct: null,
        reintroduced: null,
        prototype: 2822,
        battleValue: 108,
        heat: 5,
        weight: 1,
        range: {
            min: 0,
            short: 5,
            medium: 10,
            long: 15
        },
        space: {
            battlemech: 1,
            protomech: 1,
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
            "DE"
        ],
        techRating: "f",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 5,
            rangeShort: 0.7,
            rangeMedium: 0.7,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 5,
        rangeAero: "m"
    },
    {
        isAmmo: false,
        name: "ER Medium Pulse Laser",
        tag: "er_medium_pulse_laser",
        sort: "laser, er medium pulse",
        category: "Energy Weapons",
        damage: 7,
        damageAero: 7,
        accuracyModifier: -1,
        cbills: 150000,
        prototype: 3057,
        introduced: 3082,
        extinct: null,
        reintroduced: null,
        battleValue: 117,
        heat: 6,
        weight: 2,
        range: {
            min: 0,
            short: 5,
            medium: 9,
            long: 14
        },
        space: { battlemech: 2, protomech: 1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "f",
        book: "TO:AUE",
        page: 132,
        alphaStrike: {
            heat: 6,
            rangeShort: 0.7,
            rangeMedium: 0.7,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 6
    },
    {
        isAmmo: false,
        name: "ER Micro Laser",
        tag: "er-micro-laser",
        sort: "laser, er, 1, micro",
        category: "Energy Weapons",
        damage: 2,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 10000,
        introduced: 3060,
        extinct: null,
        reintroduced: null,
        prototype: 3059,
        battleValue: 7,
        heat: 1,
        weight: 0.25,
        range: { min: 0, short: 1, medium: 2, long: 4 },
        space: {
            battlemech: 1,
            protomech: 1,
            combatVehicle: 1,
            supportVehicle: 1,
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
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 1,
            rangeShort: 0.2,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 1,
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "ER PPC (Clan)",
        tag: "er-ppc-clan",
        sort: "ppc, er, clan",
        category: "Energy Weapons",
        damage: 15,
        damageAero: 15,
        accuracyModifier: 0,
        cbills: 300000,
        introduced: 2826,
        extinct: null,
        reintroduced: null,
        prototype: 2823,
        battleValue: 412,
        heat: 15,
        weight: 6,
        range: {
            min: 0,
            short: 7,
            medium: 14,
            long: 23
        },
        space: { battlemech: 2, protomech: 1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "TM",
        page: 234,
        alphaStrike: {
            heat: 15,
            rangeShort: 1.5,
            rangeMedium: 1.5,
            rangeLong: 1.5,
            rangeExtreme: 1.5,
            tc: true,
            notes: []
        },
        heatAero: 15,
        rangeAero: "e"
    },
    {
        isAmmo: false,
        name: "ER Small Laser (Clan)",
        tag: "er-small-laser-clan",
        sort: "laser, er, clan, 1, small",
        category: "Energy Weapons",
        damage: 5,
        damageAero: 3,
        accuracyModifier: 0,
        cbills: 11250,
        introduced: 2825,
        extinct: null,
        reintroduced: null,
        prototype: 2822,
        battleValue: 31,
        heat: 2,
        weight: 0.5,
        range: {
            min: 0,
            short: 2,
            medium: 4,
            long: 6
        },
        space: {
            battlemech: 1,
            protomech: 1,
            combatVehicle: 1,
            supportVehicle: 1,
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
        techRating: "e",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 2,
            rangeShort: 0.5,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 2,
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "ER Small Pulse Laser",
        tag: "er_small_pulse_laser",
        sort: "laser, er, small, pulse, clan, 1",
        category: "Energy Weapons",
        damage: 5,
        damageAero: 5,
        accuracyModifier: -1,
        cbills: 30000,
        prototype: 3057,
        introduced: 3082,
        extinct: null,
        reintroduced: null,
        battleValue: 36,
        heat: 3,
        weight: 1.5,
        range: {
            min: 0,
            short: 2,
            medium: 4,
            long: 6
        },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "f",
        book: "TO:AUE",
        page: 132,
        alphaStrike: {
            heat: 3,
            rangeShort: 0.5,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 3,
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "Flamer (Clan, Star League)",
        tag: "standard-flamer-clan",
        // "Flamer (Clan)" is the production Clan flamer (clan-flamer); saves resolve this record by tag
        altNames: [],
        category: "Energy Weapons",
        sort: "flamer, clan, 1",
        damage: 2,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 7500,
        introduced: 1950,
        extinct: 2830,
        reintroduced: null,
        battleValue: 6,
        heat: 3,
        weight: 1,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 3
        },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "DE",
            "H"
        ],
        techRating: "b",
        book: "TM",
        page: 218,
        alphaStrike: {
            heat: 3,
            rangeShort: 0.2,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: [
                "Heat",
                "Point Defense"
            ]
        },
        heatAero: 3,
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "Heavy Large Laser",
        tag: "large-heavy-laser",
        sort: "laser, heavy, 3, large, clan",
        category: "Energy Weapons",
        damage: 16,
        damageAero: 16,
        accuracyModifier: 1,
        cbills: 250000,
        introduced: 3059,
        extinct: null,
        reintroduced: null,
        prototype: 3057,
        battleValue: 244,
        heat: 18,
        weight: 4,
        range: {
            min: 0,
            short: 5,
            medium: 10,
            long: 15
        },
        space: { battlemech: 3, protomech: 1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "f",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 18,
            rangeShort: 1.52, // (16/10 = 1.6. 1.6 * .95 for +1 penalty to hit = 1.52)
            rangeMedium: 1.52,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 18,
        rangeAero: "m"
    },
    {
        isAmmo: false,
        name: "Heavy Medium Laser",
        tag: "medium-heavy-laser",
        sort: "laser, heavy, 2, medium, clan",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 1,
        cbills: 100000,
        introduced: 3059,
        extinct: null,
        reintroduced: null,
        prototype: 3057,
        battleValue: 76,
        heat: 7,
        weight: 1,
        range: {
            min: 0,
            short: 3,
            medium: 6,
            long: 9
        },
        space: { battlemech: 2, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 7,
            rangeShort: 0.95,
            rangeMedium: 0.95,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 7,
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "Heavy Small Laser",
        tag: "small-heavy-laser",
        sort: "laser, heavy, 1, small, clan",
        category: "Energy Weapons",
        damage: 6,
        damageAero: 6,
        accuracyModifier: 1,
        cbills: 20000,
        introduced: 3059,
        extinct: null,
        reintroduced: null,
        prototype: 3057,
        battleValue: 15,
        heat: 3,
        weight: 0.5,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 3
        },
        space: {
            battlemech: 1,
            protomech: 1,
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
            "DE"
        ],
        techRating: "e",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 3,
            rangeShort: 0.57,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: [
                "Point Defense"
            ]
        },
        heatAero: 3,
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "Large Laser (Clan, Star League)",
        tag: "clan-large-laser",
        altNames: ["Large Laser (Clan)"],
        sort: "laser, clan, 2, large",
        category: "Energy Weapons",
        damage: 8,
        damageAero: 8,
        accuracyModifier: 0,
        cbills: 100000,
        introduced: 2316,
        extinct: 2850,
        reintroduced: null,
        prototype: 2306,
        battleValue: 123,
        heat: 8,
        weight: 5,
        range: {
            min: 0,
            short: 5,
            medium: 10,
            long: 15
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
        techRating: "c",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 8,
            rangeShort: 0.8,
            rangeMedium: 0.8,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 8,
        rangeAero: "m"
    },
    {
        isAmmo: false,
        name: "Large Pulse Laser (Clan)",
        tag: "clan_large-pulse-laser",
        sort: "laser, clan, 2, pulse, large",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: -2,
        cbills: 175000,
        introduced: 2824,
        extinct: null,
        reintroduced: null,
        prototype: 2820,
        battleValue: 265,
        heat: 10,
        weight: 6,
        range: {
            min: 0,
            short: 6,
            medium: 14,
            long: 20
        },
        space: { battlemech: 2, protomech: 1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "f",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 10,
            rangeShort: 1.0,
            rangeMedium: 1.0,
            rangeLong: 1.0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 10,
        rangeAero: "l"
    },
    {
        isAmmo: false,
        name: "Laser AMS (Clan)",
        tag: "clan-laser-ams",
        sort: "equipment, ams laser, clan",
        category: "Energy Weapons",
        damage: 0,
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 225000,
        prototype: 3048,
        introduced: 3079, // Prototyped right before the initial Clan Invasion
        extinct: null,
        reintroduced: null,
        battleValue: 45,
        battleValueDefensive: true,
        heat: 5, // Trades a higher thermal spikes signature for weight optimization
        weight: 1,
        range: {
            min: 0,
            short: 0,
            medium: 0,
            long: 0
        },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "AMS"
        ],
        techRating: "f",
        book: "TO:AUE",
        page: 134,
        alphaStrike: {
            heat: 7,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: ["AMS"]
        },
        heatAero: 7,
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "Medium Laser (Clan, Star League)",
        tag: "medium-laser-clan",
        altNames: ["Medium Laser (Clan)"],
        sort: "laser, clan, medium, 1",
        category: "Energy Weapons",
        damage: 5,
        damageAero: 5,
        accuracyModifier: 0,
        cbills: 40000,
        introduced: 2300, // Resumed Clan localized manufacturing date
        extinct: 2850,    // Hard extinction date in Clan Space logs
        reintroduced: null,
        prototype: 2290,
        battleValue: 46,
        heat: 3,
        weight: 1,
        range: {
            min: 0,
            short: 3,
            medium: 6,
            long: 9
        },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "c",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 3,
            rangeShort: 0.5,
            rangeMedium: 0.5,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 3,
        rangeAero: "m"
    },
    {
        isAmmo: false,
        name: "Medium Pulse Laser (Clan)",
        tag: "clan_medium-pulse-laser",
        sort: "laser, clan, 1, pulse, medium",
        category: "Energy Weapons",
        damage: 7,
        damageAero: 7,
        accuracyModifier: -2,
        cbills: 60000,
        introduced: 2827,
        extinct: null,
        reintroduced: null,
        prototype: 2825,
        battleValue: 111,
        heat: 4,
        weight: 2,
        range: {
            min: 0,
            short: 4,
            medium: 8,
            long: 12
        },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "f",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 4,
            rangeShort: 0.7,
            rangeMedium: 0.7,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 4,
        rangeAero: "m"
    },
    {
        isAmmo: false,
        name: "Micro Pulse Laser",
        tag: "micro-pulse-laser",
        sort: "laser, pulse, 1, micro",
        category: "Energy Weapons",
        damage: 3,
        damageAero: 3,
        accuracyModifier: -2,
        cbills: 12500,
        introduced: 3060,
        extinct: null,
        reintroduced: null,
        prototype: 3059,
        battleValue: 12,
        heat: 1,
        weight: 0.5,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 3
        },
        space: {
            battlemech: 1,
            protomech: 1,
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
            "P",
            "AI"
        ],
        techRating: "f",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 1,
            rangeShort: 0.33,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: [
                "Point Defense"
            ]
        },
        heatAero: 1,
        rangeAero: "s"
    },
    {
        name: "PPC (Clan, Star League)",
        tag: "clan-standard-ppc",
        altNames: ["PPC (Clan)"],
        sort: "ppc, 3, standard, clan",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2460, // Adjusted to match Clan localized manufacturing resumption
        extinct: 2825,    // Hard extinction date in Clan Space logs
        reintroduced: null,
        prototype: 2440,
        battleValue: 176,
        heat: 10,
        weight: 7,
        range: {
            min: 3,
            short: 6,
            medium: 12,
            long: 18
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
        minAmmoTons: 0, // Adjusted to 0 for pure energy weapon mapping
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "d",
        book: "TM",
        page: 234,
        alphaStrike: {
            heat: 10,
            rangeShort: 0.75,
            rangeMedium: 1,
            rangeLong: 1,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 10,
        rangeAero: "m"
    },
    {
        isAmmo: false,
        name: "Plasma Cannon",
        tag: "plasma-cannon",
        sort: "plasma, cannon",
        category: "Energy Weapons",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 320000,
        introduced: 3069,
        extinct: null,
        reintroduced: null,
        prototype: 3068,
        battleValue: 170,
        heat: 7,
        weight: 3,
        range: {
            min: 0,
            short: 6,
            medium: 12,
            long: 18
        },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 10,
        ammoBattleValue: 21,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "e",
        book: "TM",
        page: 235,
        alphaStrike: {
            heat: 18,
            rangeShort: 1.52,
            rangeMedium: 1.52,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 7,
        rangeAero: "m"
    },
    {
        isAmmo: false,
        name: "Small Laser (Clan, Star League)",
        tag: "small-laser-clan",
        altNames: ["Small Laser (Clan)"],
        sort: "laser, clan, 1, small",
        category: "Energy Weapons",
        damage: 3,
        damageAero: 3,
        accuracyModifier: 0,
        cbills: 11250,
        introduced: 2300, // Resumed Clan localized manufacturing date
        extinct: 2850,    // Hard extinction date in Clan Space logs
        reintroduced: null,
        prototype: 2290,
        battleValue: 9,
        heat: 1,
        weight: 0.5,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 3
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
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "c",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 1,
            rangeShort: 0.3,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 1,
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "Small Pulse Laser (Clan)",
        tag: "clan-small-pulse-laser",
        sort: "clan, laser, pulse, 1, small",
        category: "Energy Weapons",
        damage: 3,
        damageAero: 3,
        accuracyModifier: -2,
        cbills: 16000,
        introduced: 2829,
        extinct: null,
        reintroduced: null,
        prototype: 2825,
        battleValue: 24,
        heat: 2,
        weight: 1,
        range: {
            min: 0,
            short: 2,
            medium: 4,
            long: 6
        },
        space: {
            battlemech: 1,
            protomech: 1,
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
            "P",
            "AI"
        ],
        techRating: "f",
        book: "TM",
        page: 226,
        alphaStrike: {
            heat: 2,
            rangeShort: 0.33,
            rangeMedium: 0.33,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: [
                ""
            ]
        },
        heatAero: 2,
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "ER PPC (Clan, Star League)",
        tag: "clan-sl-er-ppc",
        catalog: "clan",
        altNames: [],
        sort: "ppc, er",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 300000,
        introduced: 2751,
        extinct: null,
        reintroduced: null,
        prototype: 2740,
        battleValue: 229,
        heat: 15,
        weight: 7,
        range: {
            min: 0,
            short: 7,
            medium: 14,
            long: 23
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
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "e",
        book: "TM",
        page: 234,
        alphaStrike: {
            heat: 15,
            rangeShort: 1,
            rangeMedium: 1,
            rangeLong: 1,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 15,
        rangeAero: "l",
        notes: "Never extinct in Clan space: the ER PPC extinction in IO:AE p.40 applies to the Inner Sphere only. The original tool listed it as extinct in 2860 because the better Clan ER PPC had replaced it in service by then."
    },
    {
        isAmmo: false,
        name: "Heavy Flamer (Clan)",
        tag: "clan-heavy-flamer",
        ammoTypes: ["ammo-clan-heavy-flamer-standard"],
        catalog: "clan",
        category: "Energy Weapons",
        sort: "flamer, heavy, clan",
        damage: 4,
        damageAero: 4,
        accuracyModifier: 0,
        cbills: 11250,
        prototype: 3065,
        introduced: 3067,
        extinct: null,
        reintroduced: null,
        battleValue: 15,
        heat: 5,
        weight: 1.5,
        range: {
            min: 0,
            short: 2,
            medium: 3,
            long: 4
        },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 10,
        ammoBattleValue: 2,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "DE",
            "H"
        ],
        techRating: "c",
        book: "TO:AUE",
        page: 124,
        alphaStrike: {
            heat: 5,
            rangeShort: 0.4,
            rangeMedium: 0.4,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: [
                "Heat"
            ]
        },
        heatAero: 5
    },
    {
        isAmmo: false,
        name: "Flamer (Clan)",
        tag: "clan-flamer",
        catalog: "clan",
        category: "Energy Weapons",
        sort: "flamer, clan",
        damage: 2,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 7500,
        introduced: 2827,
        extinct: null,
        reintroduced: null,
        prototype: 2820,
        battleValue: 6,
        heat: 3,
        weight: 0.5,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 3
        },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "DE",
            "H"
        ],
        techRating: "c",
        book: "TM",
        page: 218,
        alphaStrike: {
            heat: 3,
            rangeShort: 0.2,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: [
                "Heat",
                "Point Defense"
            ]
        },
        heatAero: 3,
        rangeAero: "s"
    },
    { name: "Improved PPC", tag: "clan-improved-ppc", altNames: ["Clan Improved PPC"], sort: "ppc, 3, standard, clan improved", category: "Energy Weapons", damage: 10, damageAero: 10, accuracyModifier: 0, cbills: 200000, introduced: 2820, extinct: 2832, reintroduced: 3080, prototype: 2819, battleValue: 176, heat: 10, weight: 6, range: { min: 3, short: 6, medium: 12, long: 18 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE"], techRating: "d", book: "IO:AE", page: 90, alphaStrike: { heat: 10, rangeShort: 0.75, rangeMedium: 1, rangeLong: 1, rangeExtreme: 0, tc: true, notes: [] }, heatAero: 10, rangeAero: "m", altTags: [], alternateName: "iPPC", catalog: "clan", notes: "Early Clan improved weapon (Interstellar Operations); obsolete by the Invasion, reissued in the Escorpion Imperio from 3080." },
    { isAmmo: false, name: "Improved Large Pulse Laser", tag: "clan-improved-large-pulse-laser", sort: "laser, pulse, 2, large improved", category: "Energy Weapons", damage: 9, damageAero: 9, accuracyModifier: -2, cbills: 175000, introduced: 2818, extinct: 2826, reintroduced: 3080, prototype: 2815, battleValue: 119, heat: 10, weight: 6, range: { min: 0, short: 3, medium: 7, long: 10 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["P"], techRating: "e", book: "IO:AE", page: 89, alphaStrike: { heat: 10, rangeShort: 0.99, rangeMedium: 0.99, rangeLong: 0, rangeExtreme: 0, tc: true, notes: [] }, heatAero: 10, rangeAero: "m", altNames: ["Clan Improved Large Pulse Laser"], altTags: [], alternateName: "iLPL", catalog: "clan", notes: "Early Clan improved weapon (Interstellar Operations); obsolete by the Invasion, reissued in the Escorpion Imperio from 3080." },
    { isAmmo: false, name: "Improved Large Laser", tag: "clan-improved-large-laser", altNames: ["Clan Improved Large Laser"], sort: "laser, clan, 2, large improved", category: "Energy Weapons", damage: 8, damageAero: 8, accuracyModifier: 0, cbills: 100000, introduced: 2815, extinct: 2830, reintroduced: 3080, prototype: 2812, battleValue: 123, heat: 8, weight: 4, range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE"], techRating: "c", book: "IO:AE", page: 89, alphaStrike: { heat: 8, rangeShort: 0.8, rangeMedium: 0.8, rangeLong: 0, rangeExtreme: 0, tc: true, notes: [] }, heatAero: 8, rangeAero: "m", altTags: [], alternateName: "iLL", catalog: "clan", notes: "Early Clan improved weapon (Interstellar Operations); obsolete by the Invasion, reissued in the Escorpion Imperio from 3080." },
    { isAmmo: false, name: "Improved Heavy Large Laser", tag: "clan-improved-heavy-large-laser", sort: "laser, heavy, 3, large, clan improved", category: "Energy Weapons", damage: 16, damageAero: 16, accuracyModifier: 1, cbills: 350000, prototype: 3069, introduced: 3079, extinct: null, reintroduced: null, battleValue: 296, heat: 18, weight: 4, range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 3, protomech: 1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 1, explosive: true, weaponType: ["P"], techRating: "f", book: "TO:AUE", page: 133, alphaStrike: { heat: 18, rangeShort: 1.52, rangeMedium: 1.52, rangeLong: 0, rangeExtreme: 0, tc: true, notes: [] }, heatAero: 18, rangeAero: "m", altNames: ["Clan Improved Heavy Large Laser"], altTags: [], alternateName: "iHLL", catalog: "clan", notes: "Improved heavy laser: explodes like a Gauss rifle when critically hit." },
    { isAmmo: false, name: "Improved Heavy Medium Laser", tag: "clan-improved-heavy-medium-laser", sort: "laser, heavy, 2, medium, clan improved", category: "Energy Weapons", damage: 10, damageAero: 10, accuracyModifier: 1, cbills: 150000, prototype: 3069, introduced: 3079, extinct: null, reintroduced: null, battleValue: 93, heat: 7, weight: 1, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 2, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 1, explosive: true, weaponType: ["DE"], techRating: "f", book: "TO:AUE", page: 133, alphaStrike: { heat: 7, rangeShort: 0.95, rangeMedium: 0.95, rangeLong: 0, rangeExtreme: 0, tc: true, notes: [] }, heatAero: 7, rangeAero: "s", altNames: ["Clan Improved Heavy Medium Laser"], altTags: [], alternateName: "iHML", catalog: "clan", notes: "Improved heavy laser: explodes like a Gauss rifle when critically hit." },
    { isAmmo: false, name: "Improved Heavy Small Laser", tag: "clan-improved-heavy-small-laser", sort: "laser, heavy, 1, small, clan improved", category: "Energy Weapons", damage: 6, damageAero: 6, accuracyModifier: 1, cbills: 30000, prototype: 3069, introduced: 3079, extinct: null, reintroduced: null, battleValue: 19, heat: 3, weight: 0.5, range: { min: 0, short: 1, medium: 2, long: 3 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 1, explosive: true, weaponType: ["DE"], techRating: "e", book: "TO:AUE", page: 133, alphaStrike: { heat: 3, rangeShort: 0.57, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["Point Defense"] }, heatAero: 3, rangeAero: "s", altNames: ["Clan Improved Heavy Small Laser"], altTags: [], alternateName: "iHSL", catalog: "clan", notes: "Improved heavy laser: explodes like a Gauss rifle when critically hit." },
    { isAmmo: false, name: "ER Flamer (Clan)", altNames: ["Clan ER Flamer"], tag: "clan-er-flamer", altTags: [], catalog: "clan", sort: "flamer, er, clan", category: "Energy Weapons", alternateName: "ER Flamer", damage: 2, notes: "", damageAero: 2, accuracyModifier: 0, cbills: 15000, prototype: 3065, introduced: 3067, extinct: null, reintroduced: null, battleValue: 16, heat: 4, weight: 1, range: { min: 0, short: 3, medium: 5, long: 7 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE", "H"], techRating: "d", book: "TO:AUE", page: 124, alphaStrike: { heat: 4, rangeShort: 0.2, rangeMedium: 0.2, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Heat"] }, heatAero: 4 },
    { isAmmo: false, name: "Large Chemical Laser", altNames: ["Clan Large Chemical Laser"], tag: "clan-large-chemical-laser", altTags: [], catalog: "clan", sort: "laser, chemical, large", category: "Energy Weapons", alternateName: "Large Chem Laser", damage: 8, notes: "Chemical laser: fires from explosive ammunition instead of drawing heavy power.", damageAero: 8, accuracyModifier: 0, cbills: 75000, prototype: 3059, introduced: 3083, extinct: null, reintroduced: null, battleValue: 99, heat: 6, weight: 5, range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 2, protomech: 1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-large-chemical-laser-standard"], shotsPerTon: 10, ammoBattleValue: 12, minAmmoTons: 1, explosive: false, weaponType: ["DE"], techRating: "e", book: "TO:AUE", page: 132, alphaStrike: { heat: 6, rangeShort: 0.8, rangeMedium: 0.8, rangeLong: 0, rangeExtreme: 0, tc: true, notes: [] }, heatAero: 6, rangeAero: "m" },
    { isAmmo: false, name: "Medium Chemical Laser", altNames: ["Clan Medium Chemical Laser"], tag: "clan-medium-chemical-laser", altTags: [], catalog: "clan", sort: "laser, chemical, medium", category: "Energy Weapons", alternateName: "Medium Chem Laser", damage: 5, notes: "Chemical laser: fires from explosive ammunition instead of drawing heavy power.", damageAero: 5, accuracyModifier: 0, cbills: 30000, prototype: 3059, introduced: 3083, extinct: null, reintroduced: null, battleValue: 37, heat: 2, weight: 1, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-medium-chemical-laser-standard"], shotsPerTon: 30, ammoBattleValue: 5, minAmmoTons: 1, explosive: false, weaponType: ["DE"], techRating: "e", book: "TO:AUE", page: 132, alphaStrike: { heat: 2, rangeShort: 0.5, rangeMedium: 0.5, rangeLong: 0, rangeExtreme: 0, tc: true, notes: [] }, heatAero: 2, rangeAero: "m" },
    { isAmmo: false, name: "Small Chemical Laser", altNames: ["Clan Small Chemical Laser"], tag: "clan-small-chemical-laser", altTags: [], catalog: "clan", sort: "laser, chemical, small", category: "Energy Weapons", alternateName: "Small Chem Laser", damage: 3, notes: "Chemical laser: fires from explosive ammunition instead of drawing heavy power.", damageAero: 3, accuracyModifier: 0, cbills: 10000, prototype: 3059, introduced: 3083, extinct: null, reintroduced: null, battleValue: 7, heat: 1, weight: 0.5, range: { min: 0, short: 1, medium: 2, long: 3 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-small-chemical-laser-standard"], shotsPerTon: 60, ammoBattleValue: 1, minAmmoTons: 1, explosive: false, weaponType: ["DE"], techRating: "e", book: "TO:AUE", page: 132, alphaStrike: { heat: 1, rangeShort: 0.3, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: true, notes: [] }, heatAero: 1, rangeAero: "s" },
    { isAmmo: false, name: "Prototype ER Medium Laser (Clan)", altNames: ["Prototype ER Medium Laser (CP)"], tag: "clan-prototype-er-medium-laser", altTags: [], catalog: "clan", sort: "laser, er, clan, 2, medium, prototype", category: "Energy Weapons", alternateName: "", damage: 5, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 7, accuracyModifier: 0, cbills: 80000, introduced: null, extinct: 2824, reintroduced: null, battleValue: 62, heat: 5, weight: 1.5, range: { min: 0, short: 4, medium: 8, long: 12 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE"], techRating: "e", book: "IO:AE", page: 91, alphaStrike: { heat: 5, rangeShort: 0.7, rangeMedium: 0.7, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["Provisional: copied from the production weapon"] }, heatAero: 5, prototype: 2819, rangeAero: "m" },
    { isAmmo: false, name: "Prototype ER Small Laser (Clan)", altNames: ["Prototype ER Small Laser (CP)"], tag: "clan-prototype-er-small-laser", altTags: [], catalog: "clan", sort: "laser, er, clan, 1, small, prototype", category: "Energy Weapons", alternateName: "", damage: 3, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 3, accuracyModifier: 0, cbills: 11250, introduced: null, extinct: 2825, reintroduced: null, battleValue: 17, heat: 2, weight: 0.5, range: { min: 0, short: 2, medium: 4, long: 5 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE"], techRating: "e", book: "IO:AE", page: 91, alphaStrike: { heat: 2, rangeShort: 0.5, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["Provisional: copied from the production weapon"] }, heatAero: 2, prototype: 2819, rangeAero: "s" },
]