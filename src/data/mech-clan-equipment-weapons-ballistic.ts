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

export const mechClanEquipmentBallistic: IEquipmentItem[] = [
    {
        name: "Clan LB 5-X AC",
        tag: "clan-autocannon-lbx-5",
        altNames: ["LB 5-X AC"],
        sort: "lb, 5-x, ac",
        category: "Ballistic Weapons",
        damage: 5,
        damageAero: 5,
        accuracyModifier: 0,
        cbills: 250000,
        introduced: 2826,
        extinct: 0,
        reintroduced: 0,
        prototype: 2824,
        battleValue: 93,
        heat: 1,
        weight: 7,
        range: { min: 3, short: 8, medium: 15, long: 24 },
        space: { battlemech: 4, protomech: 1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 20,
        ammoBattleValue: 12,
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
    },
    { name: "Clan LB 2-X AC", tag: "clan-autocannon-lbx-2", altNames: ["LB 2-X AC"], sort: "lb, 2-x, ac", category: "Ballistic Weapons", damage: 2, notes: "", damageAero: 2, accuracyModifier: 0, cbills: 150000, introduced: 2826, extinct: 0, reintroduced: 0, prototype: 2824, battleValue: 47, heat: 1, heatAero: 1, weight: 5, range: { min: 4, short: 10, medium: 20, long: 30 }, space: { battlemech: 3, protomech: 1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 45, ammoBattleValue: 6, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "e", book: "TM", page: 287, alphaStrike: { heat: 1, rangeShort: 0.069, rangeMedium: 0.105, rangeLong: 0.105, rangeExtreme: 0.105, tc: true, notes: ["flak"] }, rangeAero: "e" },
    { name: "Clan LB 10-X AC", tag: "clan-autocannon-lbx-10", altNames: ["LB 10-X AC"], sort: "lb, 10-x, ac", category: "Ballistic Weapons", damage: 10, notes: "", damageAero: 10, accuracyModifier: 0, cbills: 400000, introduced: 2826, extinct: 0, reintroduced: 0, prototype: 2824, battleValue: 148, heat: 2, heatAero: 2, weight: 10, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 5, protomech: 1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 10, ammoBattleValue: 19, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "e", book: "TM", page: 287, alphaStrike: { heat: 2, rangeShort: 0.63, rangeMedium: 0.63, rangeLong: 0.63, rangeExtreme: 0, tc: true, notes: ["flak"] }, rangeAero: "m" },
    { name: "Clan LB 20-X AC", tag: "clan-autocannon-lbx-20", altNames: ["LB 20-X AC"], sort: "lb, 20-x, ac", category: "Ballistic Weapons", damage: 20, notes: "", damageAero: 20, accuracyModifier: 0, cbills: 600000, introduced: 2826, extinct: 0, reintroduced: 0, prototype: 2824, battleValue: 237, heat: 6, heatAero: 6, weight: 12, range: { min: 0, short: 4, medium: 8, long: 12 }, space: { battlemech: 9, protomech: -1, combatVehicle: 1, supportVehicle: 9, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 5, ammoBattleValue: 30, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "e", book: "TM", page: 287, alphaStrike: { heat: 6, rangeShort: 1.26, rangeMedium: 1.26, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["flak"] }, rangeAero: "s" },
    { name: "Clan Rotary AC/2", tag: "clan-autocannon-rac-2", altNames: ["Rotary AC/2"], ammoTypes: ["ammo-clan-rotary-ac-2-standard"], sort: "clan rotary ac/2", category: "Ballistic Weapons", damage: 2, notes: "Clan Rotary Autocannon; Clan C variant has reduced weight and increased critical space.", damageAero: 2, accuracyModifier: 0, cbills: 175000, introduced: 3073, extinct: 0, reintroduced: 0, battleValue: 161, heat: 1, heatAero: 1, weight: 8, range: { min: 0, short: 8, medium: 17, long: 25 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 45, ammoBattleValue: 20, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.8, rangeMedium: 0.8, rangeLong: 0.8, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion", "Clan C variant"] }, catalog: "clan" },
    { name: "Clan Rotary AC/5", tag: "clan-autocannon-rac-5", altNames: ["Rotary AC/5"], ammoTypes: ["ammo-clan-rotary-ac-5-standard"], sort: "clan rotary ac/5", category: "Ballistic Weapons", damage: 5, notes: "Clan Rotary Autocannon; Clan C variant has reduced weight.", damageAero: 5, accuracyModifier: 0, cbills: 275000, introduced: 3073, extinct: 0, reintroduced: 0, battleValue: 345, heat: 1, heatAero: 1, weight: 10, range: { min: 0, short: 7, medium: 14, long: 21 }, space: { battlemech: 8, protomech: -1, combatVehicle: 1, supportVehicle: 6, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 20, ammoBattleValue: 43, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 2, rangeMedium: 2, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion", "Clan C variant"] }, catalog: "clan" },
    { name: "Clan Ultra AC/2", tag: "clan-autocannon-uac-2", altNames: ["Ultra AC/2"], ammoTypes: ["ammo-clan-ultra-ac-2-standard"], sort: "clan ultra ac/2", category: "Ballistic Weapons", damage: 2, notes: "Clan Ultra Autocannon; Clan C variant has reduced weight and critical space.", damageAero: 2, accuracyModifier: 0, cbills: 120000, introduced: 2827, extinct: 0, reintroduced: 0, prototype: 2825, battleValue: 62, heat: 1, heatAero: 1, weight: 5, range: { min: 2, short: 9, medium: 18, long: 27 }, space: { battlemech: 2, protomech: 1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 45, ammoBattleValue: 8, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 2, rangeShort: 0.225, rangeMedium: 0.3, rangeLong: 0.3, rangeExtreme: 0.3, tc: true, notes: ["Provisional workbook conversion", "Clan C variant"] }, catalog: "clan" },
    { name: "Clan Ultra AC/5", tag: "clan-autocannon-uac-5", altNames: ["Ultra AC/5"], ammoTypes: ["ammo-clan-ultra-ac-5-standard"], sort: "clan ultra ac/5", category: "Ballistic Weapons", damage: 5, notes: "Clan Ultra Autocannon; workbook conversion provisional.", damageAero: 5, accuracyModifier: 0, cbills: 200000, introduced: 2827, extinct: 0, reintroduced: 0, prototype: 2825, battleValue: 122, heat: 1, heatAero: 1, weight: 7, range: { min: 0, short: 7, medium: 14, long: 21 }, space: { battlemech: 3, protomech: 1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 20, ammoBattleValue: 15, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 2, rangeShort: 0.623, rangeMedium: 0.75, rangeLong: 0.75, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Clan Ultra AC/10", tag: "clan-autocannon-uac-10", altNames: ["Ultra AC/10"], ammoTypes: ["ammo-clan-ultra-ac-10-standard"], sort: "clan ultra ac/10", category: "Ballistic Weapons", damage: 10, notes: "Clan Ultra Autocannon; workbook conversion provisional.", damageAero: 10, accuracyModifier: 0, cbills: 320000, introduced: 2827, extinct: 0, reintroduced: 0, prototype: 2825, battleValue: 210, heat: 3, heatAero: 10, weight: 10, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 4, protomech: 1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 10, ammoBattleValue: 26, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 6, rangeShort: 1.5, rangeMedium: 1.5, rangeLong: 1.5, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Clan Ultra AC/20", tag: "clan-autocannon-uac-20", altNames: ["Ultra AC/20"], ammoTypes: ["ammo-clan-ultra-ac-20-standard"], sort: "clan ultra ac/20", category: "Ballistic Weapons", damage: 20, notes: "Clan Ultra AC/20; workbook conversion provisional.", damageAero: 20, accuracyModifier: 0, cbills: 480000, introduced: 2827, extinct: 0, reintroduced: 0, prototype: 2825, battleValue: 335, heat: 7, heatAero: 7, weight: 12, range: { min: 0, short: 4, medium: 8, long: 12 }, space: { battlemech: 8, protomech: -1, combatVehicle: 1, supportVehicle: 8, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 5, ammoBattleValue: 42, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 14, rangeShort: 3, rangeMedium: 3, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Hyper-Assault Gauss (HAG) 20", tag: "hyper-assault-gauss-20", altNames: ["Hyper Assault Gauss 20"], ammoTypes: ["ammo-clan-hag-20-standard"], sort: "hyper-assault gauss 20", category: "Ballistic Weapons", damage: 20, notes: "Clan-only HAG; workbook conversion provisional.", damageAero: 20, accuracyModifier: 0, cbills: 400000, introduced: 3062, extinct: 0, reintroduced: 0, battleValue: 267, heat: 4, heatAero: 4, weight: 10, ammoBattleValue: 33, range: { min: 2, short: 8, medium: 16, long: 24 }, space: { battlemech: 6, protomech: 1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 6, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 4, rangeShort: 1.328, rangeMedium: 1.2, rangeLong: 1.2, rangeExtreme: 0, tc: true, notes: ["Flak", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Hyper-Assault Gauss (HAG) 30", tag: "hyper-assault-gauss-30", altNames: ["Hyper Assault Gauss 30"], ammoTypes: ["ammo-clan-hag-30-standard"], sort: "hyper-assault gauss 30", category: "Ballistic Weapons", damage: 30, notes: "Clan-only HAG; workbook conversion provisional.", damageAero: 30, accuracyModifier: 0, cbills: 500000, introduced: 3062, extinct: 0, reintroduced: 0, battleValue: 401, heat: 6, heatAero: 6, weight: 13, ammoBattleValue: 50, range: { min: 2, short: 8, medium: 16, long: 24 }, space: { battlemech: 8, protomech: -1, combatVehicle: 1, supportVehicle: 6, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 4, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 6, rangeShort: 1.992, rangeMedium: 1.8, rangeLong: 1.8, rangeExtreme: 0, tc: true, notes: ["Flak", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Hyper-Assault Gauss (HAG) 40", tag: "hyper-assault-gauss-40", altNames: ["Hyper Assault Gauss 40"], ammoTypes: ["ammo-clan-hag-40-standard"], sort: "hyper-assault gauss 40", category: "Ballistic Weapons", damage: 40, notes: "Clan-only HAG; workbook conversion provisional.", damageAero: 40, accuracyModifier: 0, cbills: 600000, introduced: 3062, extinct: 0, reintroduced: 0, battleValue: 535, heat: 8, heatAero: 8, weight: 16, ammoBattleValue: 67, range: { min: 2, short: 8, medium: 16, long: 24 }, space: { battlemech: 10, protomech: -1, combatVehicle: 1, supportVehicle: 8, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 3, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 8, rangeShort: 2.656, rangeMedium: 2.4, rangeLong: 2.4, rangeExtreme: 0, tc: true, notes: ["Flak", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "ProtoMech Autocannon/2", tag: "protomech-autocannon-2", ammoTypes: ["ammo-clan-protomech-ac-2-standard"], sort: "protomech autocannon 2", category: "Ballistic Weapons", damage: 2, notes: "Clan-only ProtoMech autocannon; workbook conversion provisional.", damageAero: 2, accuracyModifier: 0, cbills: 95000, introduced: 3070, extinct: 0, reintroduced: 0, battleValue: 34, heat: 1, heatAero: 1, weight: 3.5, ammoBattleValue: 4, range: { min: 0, short: 7, medium: 14, long: 20 }, space: { battlemech: -1, protomech: 1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 40, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.2, rangeMedium: 0.2, rangeLong: 0.2, rangeExtreme: 0, tc: true, notes: ["AC", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "ProtoMech Autocannon/4", tag: "protomech-autocannon-4", ammoTypes: ["ammo-clan-protomech-ac-4-standard"], sort: "protomech autocannon 4", category: "Ballistic Weapons", damage: 4, notes: "Clan-only ProtoMech autocannon; workbook conversion provisional.", damageAero: 4, accuracyModifier: 0, cbills: 133000, introduced: 3070, extinct: 0, reintroduced: 0, battleValue: 49, heat: 1, heatAero: 1, weight: 4.5, ammoBattleValue: 6, range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: -1, protomech: 1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 20, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.4, rangeMedium: 0.4, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["AC", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "ProtoMech Autocannon/8", tag: "protomech-autocannon-8", ammoTypes: ["ammo-clan-protomech-ac-8-standard"], sort: "protomech autocannon 8", category: "Ballistic Weapons", damage: 8, notes: "Clan-only ProtoMech autocannon; workbook conversion provisional.", damageAero: 8, accuracyModifier: 0, cbills: 175000, introduced: 3070, extinct: 0, reintroduced: 0, battleValue: 66, heat: 2, heatAero: 2, weight: 5.5, ammoBattleValue: 8, range: { min: 0, short: 3, medium: 7, long: 10 }, space: { battlemech: -1, protomech: 2, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 10, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 2, rangeShort: 0.8, rangeMedium: 0.8, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["AC", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "AP Gauss Rifle", tag: "ap-gauss-rifle", ammoTypes: ["ammo-clan-ap-gauss-rifle-standard"], sort: "ap gauss rifle", category: "Ballistic Weapons", damage: 0, notes: "Clan-only anti-infantry Gauss weapon; workbook Alpha Strike values are provisional.", damageAero: 0, accuracyModifier: 0, cbills: 8500, introduced: 3069, extinct: 0, reintroduced: 0, prototype: 3065, battleValue: 21, heat: 1, weight: 0.5, ammoBattleValue: 3, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 40, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.3, rangeMedium: 0.3, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Anti-Infantry", "Clan Only", "Provisional workbook conversion"] }, heatAero: 1, rangeAero: "s", catalog: "clan" },
    {
        name: "Autocannon/2 (Clan, Star League)",
        alternateName: "ac/2",
        tag: "clan-sl-autocannon-standard-a",
        ammoTypes: ["ammo-ac-2-standard"],
        catalog: "clan",
        altNames: [],
        sort: "Autocannon/a",
        category: "Ballistic Weapons",
        damage: 2,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 75000,
        introduced: 2300,
        extinct: 2850,
        reintroduced: 0,
        prototype: 2290,
        battleValue: 37,
        heat: 1,
        weight: 6,
        range: {
            min: 4,
            short: 8,
            medium: 16,
            long: 24
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
        shotsPerTon: 45,
        ammoBattleValue: 5,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "DB",
            "S"
        ],
        techRating: "c",
        book: "TM",
        page: 208,
        alphaStrike: {
            heat: 1,
            rangeShort: 0.132,
            rangeMedium: 0.2,
            rangeLong: 0.2,
            rangeExtreme: 0.2,
            tc: true,
            notes: [
                "ac"
            ]
        },
        heatAero: 1,
        rangeAero: "l"
    },
    {
        name: "Autocannon/5 (Clan, Star League)",
        alternateName: "ac/5",
        tag: "clan-sl-autocannon-standard-b",
        ammoTypes: ["ammo-ac-5-standard"],
        catalog: "clan",
        altNames: [],
        sort: "Autocannon/b",
        category: "Ballistic Weapons",
        damage: 5,
        damageAero: 5,
        accuracyModifier: 0,
        cbills: 125000,
        introduced: 2250,
        extinct: 2850,
        reintroduced: 0,
        prototype: 2240,
        battleValue: 70,
        heat: 1,
        weight: 8,
        range: {
            min: 3,
            short: 6,
            medium: 12,
            long: 18
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
        shotsPerTon: 20,
        ammoBattleValue: 9,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DB",
            "S"
        ],
        techRating: "c",
        book: "TM",
        page: 208,
        alphaStrike: {
            heat: 1,
            rangeShort: 0.375,
            rangeMedium: 0.5,
            rangeLong: 0.5,
            rangeExtreme: 0,
            tc: true,
            notes: [
                "ac"
            ]
        },
        heatAero: 1,
        rangeAero: "m"
    },
    {
        name: "Autocannon/10 (Clan, Star League)",
        alternateName: "ac/10",
        tag: "clan-sl-autocannon-standard-c",
        ammoTypes: ["ammo-ac-10-standard"],
        catalog: "clan",
        altNames: [],
        sort: "Autocannon/c",
        category: "Ballistic Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2460,
        extinct: 2850,
        reintroduced: 0,
        prototype: 2443,
        battleValue: 123,
        heat: 3,
        weight: 12,
        range: {
            min: 0,
            short: 5,
            medium: 10,
            long: 15
        },
        space: {
            battlemech: 7,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 7,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        shotsPerTon: 10,
        ammoBattleValue: 15,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DB",
            "S"
        ],
        techRating: "c",
        book: "TM",
        page: 208,
        alphaStrike: {
            heat: 3,
            rangeShort: 1,
            rangeMedium: 1,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: [
                "ac"
            ]
        },
        heatAero: 3,
        rangeAero: "m"
    },
    {
        name: "Autocannon/20 (Clan, Star League)",
        alternateName: "ac/20",
        tag: "clan-sl-autocannon-standard-d",
        ammoTypes: ["ammo-ac-20-standard"],
        catalog: "clan",
        altNames: [],
        sort: "Autocannon/d",
        category: "Ballistic Weapons",
        damage: 20,
        damageAero: 20,
        accuracyModifier: 0,
        cbills: 300000,
        introduced: 2500,
        extinct: 2850,
        reintroduced: 0,
        prototype: 2488,
        battleValue: 178,
        heat: 7,
        weight: 14,
        range: {
            min: 0,
            short: 3,
            medium: 6,
            long: 9
        },
        space: {
            battlemech: 10,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 10,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        shotsPerTon: 5,
        ammoBattleValue: 22,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DB",
            "S"
        ],
        techRating: "c",
        book: "TM",
        page: 208,
        alphaStrike: {
            heat: 7,
            rangeShort: 2,
            rangeMedium: 2,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: true,
            notes: [
                "ac"
            ]
        },
        heatAero: 7,
        rangeAero: "s"
    },
    {
        name: "Machine Gun (Clan, Star League)",
        tag: "clan-sl-machine-gun",
        ammoTypes: ["ammo-machine-gun-standard"],
        catalog: "clan",
        altNames: [],
        sort: "machine gun",
        category: "Ballistic Weapons",
        damage: 2,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 5000,
        introduced: 1950,
        extinct: 2826,
        reintroduced: 0,
        battleValue: 5,
        heat: 0,
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
        shotsPerTon: 200,
        ammoBattleValue: 1,
        minAmmoTons: 0.5,
        explosive: false,
        weaponType: [
            "DB",
            "AI"
        ],
        techRating: "b",
        book: "TM",
        page: 227,
        alphaStrike: {
            heat: 0,
            rangeShort: 0.2,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: [
                "Point Defense"
            ]
        },
        heatAero: 0,
        rangeAero: "s"
    },
    {
        name: "Machine Gun (Clan)",
        tag: "clan-machine-gun",
        altNames: ["Machine Gun"],
        ammoTypes: ["ammo-machine-gun-standard"],
        catalog: "clan",
        sort: "machine gun, clan",
        category: "Ballistic Weapons",
        damage: 2,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 5000,
        introduced: 2825,
        extinct: 0,
        reintroduced: 0,
        prototype: 2821,
        battleValue: 5,
        heat: 0,
        weight: 0.25,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 3
        },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 200,
        ammoBattleValue: 1,
        minAmmoTons: 0.5,
        explosive: false,
        weaponType: [
            "DB",
            "AI"
        ],
        techRating: "c",
        book: "TM",
        page: 228,
        alphaStrike: {
            heat: 0,
            rangeShort: 0.2,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: [
                "Point Defense"
            ]
        },
        heatAero: 0,
        rangeAero: "s"
    },
    {
        name: "Light Machine Gun (Clan)",
        tag: "clan-light-machine-gun",
        altNames: ["Light Machine Gun"],
        ammoTypes: ["ammo-clan-light-machine-gun-standard"],
        catalog: "clan",
        sort: "machine gun, light, clan",
        category: "Ballistic Weapons",
        damage: 1,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 5000,
        introduced: 3060,
        extinct: 0,
        reintroduced: 0,
        prototype: 3055,
        battleValue: 5,
        heat: 0,
        weight: 0.25,
        range: {
            min: 0,
            short: 2,
            medium: 4,
            long: 6
        },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 200,
        ammoBattleValue: 1,
        minAmmoTons: 0.5,
        explosive: false,
        weaponType: [
            "DB",
            "AI"
        ],
        techRating: "b",
        book: "TM",
        page: 228,
        alphaStrike: {
            heat: 0,
            rangeShort: 0.1,
            rangeMedium: 0.1,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: [
                "Point Defense"
            ]
        },
        heatAero: 0,
        rangeAero: "s"
    },
    {
        name: "Heavy Machine Gun (Clan)",
        tag: "clan-heavy-machine-gun",
        altNames: ["Heavy Machine Gun"],
        ammoTypes: ["ammo-clan-heavy-machine-gun-standard"],
        catalog: "clan",
        sort: "machine gun, heavy, clan",
        category: "Ballistic Weapons",
        damage: 3,
        damageAero: 3,
        accuracyModifier: 0,
        cbills: 7500,
        introduced: 3059,
        extinct: 0,
        reintroduced: 0,
        prototype: 3054,
        battleValue: 6,
        heat: 0,
        weight: 0.5,
        range: { min: 0, short: 1, medium: 2, long: 2 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 100,
        ammoBattleValue: 1,
        minAmmoTons: 0.5,
        explosive: false,
        weaponType: [
            "DB",
            "AI"
        ],
        techRating: "b",
        book: "TM",
        page: 228,
        alphaStrike: {
            heat: 0,
            rangeShort: 0.3,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: [
                "Point Defense"
            ]
        },
        heatAero: 0,
        rangeAero: "s"
    },
    {
        name: "Gauss Rifle (Clan)",
        tag: "clan-gauss-rifle",
        altNames: ["Gauss Rifle"],
        ammoTypes: ["ammo-clan-gauss-rifle-standard"],
        catalog: "clan",
        sort: "gauss rifle, clan",
        category: "Ballistic Weapons",
        damage: 15,
        damageAero: 15,
        accuracyModifier: 0,
        cbills: 300000,
        introduced: 2828,
        extinct: 0,
        reintroduced: 0,
        prototype: 2822,
        battleValue: 320,
        heat: 1,
        weight: 12,
        range: {
            min: 2,
            short: 7,
            medium: 15,
            long: 22
        },
        space: { battlemech: 6, protomech: 1, combatVehicle: 1, supportVehicle: 6, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 8,
        ammoBattleValue: 40,
        minAmmoTons: 1,
        gauss: true,
        weaponType: [
            "DB"
        ],
        techRating: "f",
        book: "TM",
        page: 219,
        alphaStrike: {
            heat: 1,
            rangeShort: 1.245,
            rangeMedium: 1.5,
            rangeLong: 1.5,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 1,
        rangeAero: "l",
        explosive: true
    },
    { name: "Improved Autocannon/2", alternateName: "iAC/2", tag: "clan-improved-ac-2", ammoTypes: ["ammo-clan-improved-ac-2-standard"], catalog: "clan", altNames: ["Clan Improved Autocannon/2"], sort: "Autocannon/a improved", category: "Ballistic Weapons", damage: 2, damageAero: 2, accuracyModifier: 0, cbills: 75000, introduced: 2815, extinct: 2833, reintroduced: 3080, battleValue: 37, heat: 1, weight: 5, range: { min: 4, short: 8, medium: 16, long: 24 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 45, ammoBattleValue: 5, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "c", book: "IO", page: 96, alphaStrike: { heat: 1, rangeShort: 0.132, rangeMedium: 0.2, rangeLong: 0.2, rangeExtreme: 0.2, tc: true, notes: ["ac"] }, heatAero: 1, rangeAero: "l", altTags: [], notes: "Early Clan improved weapon (Interstellar Operations); obsolete by the Invasion, reissued in the Escorpion Imperio from 3080." },
    { name: "Improved Autocannon/5", alternateName: "iAC/5", tag: "clan-improved-ac-5", ammoTypes: ["ammo-clan-improved-ac-5-standard"], catalog: "clan", altNames: ["Clan Improved Autocannon/5"], sort: "Autocannon/b improved", category: "Ballistic Weapons", damage: 5, damageAero: 5, accuracyModifier: 0, cbills: 125000, introduced: 2815, extinct: 2833, reintroduced: 3080, battleValue: 70, heat: 1, weight: 7, range: { min: 3, short: 6, medium: 12, long: 18 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 20, ammoBattleValue: 9, minAmmoTons: 0, explosive: false, weaponType: ["DB", "S"], techRating: "c", book: "IO", page: 96, alphaStrike: { heat: 1, rangeShort: 0.375, rangeMedium: 0.5, rangeLong: 0.5, rangeExtreme: 0, tc: true, notes: ["ac"] }, heatAero: 1, rangeAero: "m", altTags: [], notes: "Early Clan improved weapon (Interstellar Operations); obsolete by the Invasion, reissued in the Escorpion Imperio from 3080." },
    { name: "Improved Autocannon/10", alternateName: "iAC/10", tag: "clan-improved-ac-10", ammoTypes: ["ammo-clan-improved-ac-10-standard"], catalog: "clan", altNames: ["Clan Improved Autocannon/10"], sort: "Autocannon/c improved", category: "Ballistic Weapons", damage: 10, damageAero: 10, accuracyModifier: 0, cbills: 200000, introduced: 2815, extinct: 2833, reintroduced: 3080, battleValue: 123, heat: 3, weight: 11, range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 6, protomech: -1, combatVehicle: 1, supportVehicle: 7, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 10, ammoBattleValue: 15, minAmmoTons: 0, explosive: false, weaponType: ["DB", "S"], techRating: "c", book: "IO", page: 96, alphaStrike: { heat: 3, rangeShort: 1, rangeMedium: 1, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["ac"] }, heatAero: 3, rangeAero: "m", altTags: [], notes: "Early Clan improved weapon (Interstellar Operations); obsolete by the Invasion, reissued in the Escorpion Imperio from 3080." },
    { name: "Improved Autocannon/20", alternateName: "iAC/20", tag: "clan-improved-ac-20", ammoTypes: ["ammo-clan-improved-ac-20-standard"], catalog: "clan", altNames: ["Clan Improved Autocannon/20"], sort: "Autocannon/d improved", category: "Ballistic Weapons", damage: 20, damageAero: 20, accuracyModifier: 0, cbills: 300000, introduced: 2815, extinct: 2833, reintroduced: 3080, battleValue: 178, heat: 7, weight: 13, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 9, protomech: -1, combatVehicle: 1, supportVehicle: 10, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 5, ammoBattleValue: 22, minAmmoTons: 0, explosive: false, weaponType: ["DB", "S"], techRating: "c", book: "IO", page: 96, alphaStrike: { heat: 7, rangeShort: 2, rangeMedium: 2, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["ac"] }, heatAero: 7, rangeAero: "s", altTags: [], notes: "Early Clan improved weapon (Interstellar Operations); obsolete by the Invasion, reissued in the Escorpion Imperio from 3080." },
    { name: "Improved Gauss Rifle", tag: "clan-improved-gauss-rifle", ammoTypes: ["ammo-clan-improved-gauss-rifle-standard"], catalog: "clan", sort: "gauss rifle, clan improved", category: "Ballistic Weapons", damage: 15, damageAero: 15, accuracyModifier: 0, cbills: 300000, introduced: 2821, extinct: 2837, reintroduced: 3080, prototype: 2818, battleValue: 320, heat: 1, weight: 13, range: { min: 2, short: 7, medium: 15, long: 22 }, space: { battlemech: 6, protomech: -1, combatVehicle: 1, supportVehicle: 6, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 8, ammoBattleValue: 40, minAmmoTons: 1, weaponType: ["DB"], techRating: "f", book: "IO", page: null, alphaStrike: { heat: 1, rangeShort: 1.245, rangeMedium: 1.5, rangeLong: 1.5, rangeExtreme: 0, tc: true, notes: [] }, heatAero: 1, rangeAero: "l", explosive: true, altNames: ["Clan Improved Gauss Rifle"], altTags: [], alternateName: "iGauss", notes: "Early Clan improved weapon (Interstellar Operations); obsolete by the Invasion, reissued in the Escorpion Imperio from 3080.", gauss: true },
    { isAmmo: false, name: "Anti-Missile System (Clan)", altNames: ["Clan AMS", "Anti-Missile System"], tag: "clan-ams", altTags: ["clan-anti-missile-system"], catalog: "clan", sort: "equipment, ams, clan", category: "Ballistic Weapons", alternateName: "AMS", damage: 0, notes: "Anti-Missile System: reduces incoming missile hits; its BV and ammo BV count toward the defensive rating.", damageAero: 0, accuracyModifier: 0, cbills: 100000, introduced: 2831, extinct: 0, reintroduced: 0, prototype: 2824, battleValue: 32, heat: 1, weight: 0.5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-ams-standard"], shotsPerTon: 24, ammoBattleValue: 22, minAmmoTons: 1, explosive: false, weaponType: ["AMS"], techRating: "f", book: "TM", page: 204, alphaStrike: { specialAbility: ["AMS"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, heatAero: 1, battleValueDefensive: true },
    { isAmmo: false, name: "Machine Gun Array (Clan)", altNames: ["Clan MG Array", "MGA", "MG Array (2 Machine Gun)", "MG Array (3 Machine Gun)", "MG Array (4 Machine Gun)"], tag: "clan-machine-gun-array", altTags: [], catalog: "clan", sort: "machine gun, clan, array", category: "Ballistic Weapons", alternateName: "MGA", damage: 2, notes: "Machine gun array: links two to four machine guns of its type in the same location and fires them as one cluster weapon.", damageAero: 2, accuracyModifier: 0, cbills: 1250, introduced: 3069, extinct: 0, reintroduced: 0, battleValue: 0, heat: 0, weight: 0.25, range: { min: 0, short: 1, medium: 2, long: 3 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DB", "AI"], techRating: "e", book: "TM", page: 228, alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional: array damage is carried by its linked machine guns"] }, heatAero: 0, linkedWeaponTags: ["clan-machine-gun"] },
    { isAmmo: false, name: "Light Machine Gun Array (Clan)", altNames: ["Clan Light MG Array", "Light MGA", "MG Array (2 Light Machine Gun)", "MG Array (3 Light Machine Gun)", "MG Array (4 Light Machine Gun)"], tag: "clan-light-machine-gun-array", altTags: [], catalog: "clan", sort: "machine gun, light, clan, array", category: "Ballistic Weapons", alternateName: "Light MGA", damage: 1, notes: "Machine gun array: links two to four machine guns of its type in the same location and fires them as one cluster weapon.", damageAero: 2, accuracyModifier: 0, cbills: 1250, introduced: 3069, extinct: 0, reintroduced: 0, battleValue: 0, heat: 0, weight: 0.25, range: { min: 0, short: 2, medium: 4, long: 6 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DB", "AI"], techRating: "e", book: "TM", page: 228, alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional: array damage is carried by its linked machine guns"] }, heatAero: 0, linkedWeaponTags: ["clan-light-machine-gun"] },
    { isAmmo: false, name: "Heavy Machine Gun Array (Clan)", altNames: ["Clan Heavy MG Array", "Heavy MGA", "MG Array (2 Heavy Machine Gun)", "MG Array (3 Heavy Machine Gun)", "MG Array (4 Heavy Machine Gun)"], tag: "clan-heavy-machine-gun-array", altTags: [], catalog: "clan", sort: "machine gun, heavy, clan, array", category: "Ballistic Weapons", alternateName: "Heavy MGA", damage: 3, notes: "Machine gun array: links two to four machine guns of its type in the same location and fires them as one cluster weapon.", damageAero: 3, accuracyModifier: 0, cbills: 1250, introduced: 3069, extinct: 0, reintroduced: 0, battleValue: 0, heat: 0, weight: 0.25, range: { min: 0, short: 1, medium: 2, long: 2 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DB", "AI"], techRating: "e", book: "TM", page: 228, alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional: array damage is carried by its linked machine guns"] }, heatAero: 0, linkedWeaponTags: ["clan-heavy-machine-gun"] },
    { isAmmo: false, name: "Prototype LB 2-X AC (Clan)", altNames: ["Prototype LB 2-X Autocannon"], tag: "clan-prototype-lb-2-x-ac", altTags: [], catalog: "clan", sort: "lb, 2-x, ac, prototype", category: "Ballistic Weapons", alternateName: "", damage: 2, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 2, accuracyModifier: 0, cbills: 150000, introduced: null, extinct: 2826, reintroduced: 0, battleValue: 42, heat: 1, weight: 6, range: { min: 4, short: 9, medium: 18, long: 27 }, space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-lb-2x-standard"], shotsPerTon: 45, ammoBattleValue: 6, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "f", book: "IO", page: null, alphaStrike: { heat: 1, rangeShort: 0.069, rangeMedium: 0.105, rangeLong: 0.105, rangeExtreme: 0.105, tc: true, notes: ["flak", "Provisional: copied from the production weapon"] }, heatAero: 1, prototype: 2820, rangeAero: "e" },
    { isAmmo: false, name: "Prototype LB 5-X AC (Clan)", altNames: ["Prototype LB 5-X Autocannon"], tag: "clan-prototype-lb-5-x-ac", altTags: [], catalog: "clan", sort: "lb, 5-x, ac, prototype", category: "Ballistic Weapons", alternateName: "", damage: 5, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 5, accuracyModifier: 0, cbills: 250000, introduced: null, extinct: 2825, reintroduced: 0, battleValue: 83, heat: 1, weight: 8, range: { min: 3, short: 7, medium: 14, long: 21 }, space: { battlemech: 6, protomech: -1, combatVehicle: 1, supportVehicle: 6, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-lb-5x-standard"], shotsPerTon: 20, ammoBattleValue: 12, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "f", book: "IO", page: null, alphaStrike: { heat: 1, rangeShort: 0.6, rangeMedium: 0.6, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional: copied from the production weapon"] }, heatAero: 1, prototype: 2820, rangeAero: "m" },
    { isAmmo: false, name: "Prototype LB 20-X AC (Clan)", altNames: ["Prototype LB 20-X Autocannon"], tag: "clan-prototype-lb-20-x-ac", altTags: [], catalog: "clan", sort: "lb, 20-x, ac, prototype", category: "Ballistic Weapons", alternateName: "", damage: 20, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 20, accuracyModifier: 0, cbills: 600000, introduced: null, extinct: 2826, reintroduced: 0, battleValue: 237, heat: 6, weight: 14, range: { min: 0, short: 4, medium: 8, long: 12 }, space: { battlemech: 12, protomech: -1, combatVehicle: 1, supportVehicle: 12, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-lb-20x-standard"], shotsPerTon: 5, ammoBattleValue: 30, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "f", book: "IO", page: null, alphaStrike: { heat: 6, rangeShort: 1.26, rangeMedium: 1.26, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["flak", "Provisional: copied from the production weapon"] }, heatAero: 6, prototype: 2820, rangeAero: "s" },
    { isAmmo: false, name: "Prototype Ultra AC/2 (Clan)", altNames: ["Prototype Ultra Autocannon/2"], tag: "clan-prototype-ultra-ac-2", altTags: [], catalog: "clan", sort: "clan ultra ac/2, prototype", category: "Ballistic Weapons", alternateName: "", damage: 2, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 2, accuracyModifier: 0, cbills: 120000, introduced: null, extinct: 2827, reintroduced: 0, battleValue: 56, heat: 1, weight: 7, range: { min: 3, short: 8, medium: 17, long: 25 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-ultra-ac-2-standard"], shotsPerTon: 45, ammoBattleValue: 8, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "IO", page: null, alphaStrike: { heat: 2, rangeShort: 0.225, rangeMedium: 0.3, rangeLong: 0.3, rangeExtreme: 0.3, tc: true, notes: ["Provisional workbook conversion"] }, heatAero: 1, prototype: 2820 },
    { isAmmo: false, name: "Prototype Ultra AC/10 (Clan)", altNames: ["Prototype Ultra Autocannon/10", "Ultra AC/10 CP"], tag: "clan-prototype-ultra-ac-10", altTags: [], catalog: "clan", sort: "clan ultra ac/10, prototype", category: "Ballistic Weapons", alternateName: "", damage: 10, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 10, accuracyModifier: 0, cbills: 320000, introduced: null, extinct: 2825, reintroduced: 0, battleValue: 210, heat: 4, weight: 13, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 8, protomech: -1, combatVehicle: 1, supportVehicle: 8, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-ultra-ac-10-standard"], shotsPerTon: 10, ammoBattleValue: 26, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "IO", page: null, alphaStrike: { heat: 8, rangeShort: 1.5, rangeMedium: 1.5, rangeLong: 1.5, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion"] }, heatAero: 4, prototype: 2820 },
    { isAmmo: false, name: "Prototype Ultra AC/20 (Clan)", altNames: ["Prototype Ultra Autocannon/20"], tag: "clan-prototype-ultra-ac-20", altTags: [], catalog: "clan", sort: "clan ultra ac/20, prototype", category: "Ballistic Weapons", alternateName: "", damage: 20, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 20, accuracyModifier: 0, cbills: 480000, introduced: null, extinct: 2825, reintroduced: 0, battleValue: 281, heat: 8, weight: 15, range: { min: 0, short: 3, medium: 7, long: 10 }, space: { battlemech: 11, protomech: -1, combatVehicle: 1, supportVehicle: 11, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-clan-ultra-ac-20-standard"], shotsPerTon: 5, ammoBattleValue: 42, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "IO", page: null, alphaStrike: { heat: 16, rangeShort: 3, rangeMedium: 3, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional workbook conversion"] }, heatAero: 8, prototype: 2820 },
];
