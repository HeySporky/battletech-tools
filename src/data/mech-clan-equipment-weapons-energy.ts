import { IEquipmentItem } from "./data-interfaces";

/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
*/
export const mechClanEquipmentEnergy: IEquipmentItem[] = [
    {
        isAmmo: true,
        name: "Ammo (Plasma Cannon)",
        tag: "ammo-plasma-cannon",
        sort: "ammo-plasma, clan, cannon",
        category: "Energy Weapons",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 0,
        introduced: 3069,
        extinct: 0,
        reintroduced: 0,
        battleValue: 21,
        heat: 0,
        weight: 3,
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
        ammoPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "e",
        book: "TM",
        page: 234,
        alphaStrike: {
            heat: 18,
            rangeShort: 1.52,
            rangeMedium: 1.52,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 0
    },
    {
        isAmmo: true,
        name: "Ammo (Clan Vehicle Flamer)",
        tag: "ammo-clan-vehicle-flamer",
        sort: "ammo, clan, flamer, vehicle",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 1000,
        introduced: 1950,
        extinct: 0,
        reintroduced: 0,
        battleValue: 1,
        heat: 0,
        weight: 1,
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
        ammoPerTon: 20,
        minAmmoTons: 1,
        explosive: true,
        weaponType: [
            "X"
        ],
        techRating: "b",
        book: "TM",
        page: 218,
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
        isAmmo: false,
        name: "Enhanced ER PPC",
        tag: "enhanced_er_ppc",
        sort: "clan, ppc, enhanced, er, 3",
        category: "Energy Weapons",
        damage: 12,
        damageAero: 12,
        accuracyModifier: 0,
        cbills: 300000,
        introduced: 2823,
        extinct: 2828,
        reintroduced: 0,
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
        ammoPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "IO",
        page: 189,
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
        rangeAero: "e"
    },
    {
        isAmmo: false,
        name: "Enhanced ER Large Laser",
        tag: "enhanced_er_large_laser",
        sort: "laser, enhanced er large",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2823,
        extinct: 2828,
        reintroduced: 0,
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
        ammoPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "IO",
        page: 189,
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
        introduced: 2820,
        extinct: 0,
        reintroduced: 0,
        battleValue: 248,
        heat: 12,
        weight: 4,
        range: {
            min: 0,
            short: 8,
            medium: 15,
            long: 25
        },
        space: {
            battlemech: 2,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 1,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        ammoPerTon: 0,
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
        introduced: 3057,
        extinct: 0,
        reintroduced: 0,
        battleValue: 271,
        heat: 13,
        weight: 6,
        range: {
            min: 0,
            short: 7,
            medium: 15,
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
        ammoPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "f",
        book: "TO",
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
        introduced: 3058,
        extinct: 0,
        reintroduced: 0,
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
        ammoPerTon: 0,
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
        introduced: 3057,
        extinct: 0,
        reintroduced: 0,
        battleValue: 117,
        heat: 6,
        weight: 2,
        range: {
            min: 0,
            short: 5,
            medium: 9,
            long: 14
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
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "f",
        book: "TO",
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
        extinct: 0,
        reintroduced: 0,
        battleValue: 7,
        heat: 1,
        weight: 0.25,
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
        ammoPerTon: 0,
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
        introduced: 2820,
        extinct: 0,
        reintroduced: 0,
        battleValue: 412,
        heat: 15,
        weight: 6,
        range: {
            min: 0,
            short: 7,
            medium: 14,
            long: 23
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
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "TM",
        page: 233,
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
        damage: 3,
        damageAero: 3,
        accuracyModifier: 0,
        cbills: 11250,
        introduced: 3058,
        extinct: 0,
        reintroduced: 0,
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
        ammoPerTon: 0,
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
        cbills: 350000,
        introduced: 3057,
        extinct: 0,
        reintroduced: 0,
        battleValue: 47,
        heat: 3,
        weight: 1,
        range: {
            min: 0,
            short: 2,
            medium: 4,
            long: 6
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
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "f",
        book: "TO",
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
        name: "Flamer (Clan)",
        tag: "standard-flamer-clan",
        category: "Energy Weapons",
        sort: "flamer, clan, 1",
        damage: 2,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 7500,
        introduced: 2025,
        extinct: 0,
        reintroduced: 0,
        battleValue: 6,
        heat: 3,
        weight: 1,
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
        ammoPerTon: 0,
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
        extinct: 0,
        reintroduced: 0,
        battleValue: 244,
        heat: 18,
        weight: 6,
        range: {
            min: 0,
            short: 5,
            medium: 10,
            long: 15
        },
        space: {
            battlemech: 2,
            protomech: 1,
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
        extinct: 0,
        reintroduced: 0,
        battleValue: 76,
        heat: 7,
        weight: 2,
        range: {
            min: 0,
            short: 3,
            medium: 6,
            long: 9
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
        ammoPerTon: 0,
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
        extinct: 0,
        reintroduced: 0,
        battleValue: 15,
        heat: 3,
        weight: 1,
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
        ammoPerTon: 0,
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
        name: "Large Laser (Clan)",
        tag: "clan-large-laser",
        sort: "laser, clan, 2, large",
        category: "Energy Weapons",
        damage: 8,
        damageAero: 8,
        accuracyModifier: 0,
        cbills: 100000,
        introduced: 2815,
        extinct: 2850,
        reintroduced: 0,
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
        ammoPerTon: 0,
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
        introduced: 2826,
        extinct: 0,
        reintroduced: 0,
        battleValue: 265,
        heat: 10,
        weight: 6,
        range: {
            min: 0,
            short: 6,
            medium: 14,
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
        ammoPerTon: 0,
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
        cbills: 150000,
        introduced: 3048, // Prototyped right before the initial Clan Invasion
        extinct: 0,
        reintroduced: 0,
        battleValue: 53,
        heat: 7, // Trades a higher thermal spikes signature for weight optimization
        weight: 1,
        range: {
            min: 0,
            short: 0,
            medium: 0,
            long: 0
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
        ammoPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "AMS"
        ],
        techRating: "f",
        book: "TM",
        page: 202,
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
        name: "Medium Laser (Clan)",
        tag: "medium-laser-clan",
        sort: "laser, clan, medium, 1",
        category: "Energy Weapons",
        damage: 5,
        damageAero: 5,
        accuracyModifier: 0,
        cbills: 40000,
        introduced: 2815, // Resumed Clan localized manufacturing date
        extinct: 2850,    // Hard extinction date in Clan Space logs
        reintroduced: 0,
        battleValue: 46,
        heat: 3,
        weight: 1,
        range: {
            min: 0,
            short: 3,
            medium: 6,
            long: 9
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
        ammoPerTon: 0,
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
        introduced: 2826,
        extinct: 0,
        reintroduced: 0,
        battleValue: 111,
        heat: 4,
        weight: 2,
        range: {
            min: 0,
            short: 4,
            medium: 8,
            long: 12
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
        extinct: 0,
        reintroduced: 0,
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
        ammoPerTon: 0,
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
        name: "PPC (Clan)",
        tag: "clan-standard-ppc",
        sort: "ppc, 3, standard, clan",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2815, // Adjusted to match Clan localized manufacturing resumption
        extinct: 2850,    // Hard extinction date in Clan Space logs
        reintroduced: 0,
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
        ammoPerTon: 0,
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
        extinct: 0,
        reintroduced: 0,
        battleValue: 170,
        heat: 7,
        weight: 3,
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
        ammoPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "P"
        ],
        techRating: "e",
        book: "TM",
        page: 234,
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
        name: "Small Laser (Clan)",
        tag: "small-laser-clan",
        sort: "laser, clan, 1, small",
        category: "Energy Weapons",
        damage: 3,
        damageAero: 3,
        accuracyModifier: 0,
        cbills: 11250,
        introduced: 2815, // Resumed Clan localized manufacturing date
        extinct: 2850,    // Hard extinction date in Clan Space logs
        reintroduced: 0,
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
        ammoPerTon: 0,
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
        introduced: 2609,
        extinct: 2950,
        reintroduced: 3037,
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
        ammoPerTon: 0,
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
        name: "Vehicle Flamer (Clan)",
        tag: "vehicle-flamer-clan",
        category: "Energy Weapons",
        sort: "flamer, vehicle",
        damage: 2,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 7500,
        introduced: 1950,
        extinct: 0,
        reintroduced: 0,
        battleValue: 5,
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
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 1,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        ammoPerTon: 20,
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
    }
]