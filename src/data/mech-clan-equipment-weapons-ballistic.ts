import { IEquipmentItem } from "./data-interfaces";
/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
*/
export const mechClanEquipmentBallistic: IEquipmentItem[] = [
    {
        isAmmo: true,
        name: "Ammo (Clan LB 5-X AC)",
        tag: "ammo-clan-autocannon-lbx-5",
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
        tag: "clan-autocannon-lbx-5",
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
    },
    { isAmmo: true, name: "Ammo (Clan LB 2-X AC)", tag: "ammo-clan-autocannon-lbx-2", sort: "ammo, clan, lb, 2-x, ac", category: "Ammunition", damage: 0, notes: "Clan LB-X autocannon ammunition.", damageAero: 0, accuracyModifier: 0, cbills: 5000, introduced: 2823, extinct: 0, reintroduced: 0, battleValue: 6, heat: 0, heatAero: 0, weight: 1, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 45, minAmmoTons: 1, explosive: true, weaponType: ["DB", "S"], techRating: "e", book: "TM", page: 284, alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isAmmo: true, name: "Ammo (Clan LB 10-X AC)", tag: "ammo-clan-autocannon-lbx-10", sort: "ammo, clan, lb, 10-x, ac", category: "Ammunition", damage: 0, notes: "Clan LB-X autocannon ammunition.", damageAero: 0, accuracyModifier: 0, cbills: 5000, introduced: 2823, extinct: 0, reintroduced: 0, battleValue: 19, heat: 0, heatAero: 0, weight: 1, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 10, minAmmoTons: 1, explosive: true, weaponType: ["DB", "S"], techRating: "e", book: "TM", page: 284, alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isAmmo: true, name: "Ammo (Clan LB 20-X AC)", tag: "ammo-clan-autocannon-lbx-20", sort: "ammo, clan, lb, 20-x, ac", category: "Ammunition", damage: 0, notes: "Clan LB-X autocannon ammunition.", damageAero: 0, accuracyModifier: 0, cbills: 5000, introduced: 2823, extinct: 0, reintroduced: 0, battleValue: 30, heat: 0, heatAero: 0, weight: 1, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 5, minAmmoTons: 1, explosive: true, weaponType: ["DB", "S"], techRating: "e", book: "TM", page: 284, alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { name: "Clan LB 2-X AC", tag: "clan-autocannon-lbx-2", sort: "lb, 2-x, ac", category: "Ballistic Weapons", damage: 2, notes: "", damageAero: 2, accuracyModifier: 0, cbills: 150000, introduced: 2823, extinct: 0, reintroduced: 0, battleValue: 47, heat: 1, heatAero: 1, weight: 5, range: { min: 4, short: 10, medium: 20, long: 30 }, space: { battlemech: 3, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 45, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "e", book: "TM", page: 287, alphaStrike: { heat: 1, rangeShort: 0.069, rangeMedium: 0.105, rangeLong: 0.105, rangeExtreme: 0.105, tc: true, notes: ["flak"] }, rangeAero: "e" },
    { name: "Clan LB 10-X AC", tag: "clan-autocannon-lbx-10", sort: "lb, 10-x, ac", category: "Ballistic Weapons", damage: 10, notes: "", damageAero: 10, accuracyModifier: 0, cbills: 400000, introduced: 2823, extinct: 0, reintroduced: 0, battleValue: 148, heat: 2, heatAero: 2, weight: 10, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 10, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "e", book: "TM", page: 287, alphaStrike: { heat: 2, rangeShort: 0.63, rangeMedium: 0.63, rangeLong: 0.63, rangeExtreme: 0, tc: true, notes: ["flak"] }, rangeAero: "m" },
    { name: "Clan LB 20-X AC", tag: "clan-autocannon-lbx-20", sort: "lb, 20-x, ac", category: "Ballistic Weapons", damage: 20, notes: "", damageAero: 20, accuracyModifier: 0, cbills: 600000, introduced: 2823, extinct: 0, reintroduced: 0, battleValue: 237, heat: 6, heatAero: 6, weight: 12, range: { min: 0, short: 4, medium: 8, long: 12 }, space: { battlemech: 9, protomech: -1, combatVehicle: 1, supportVehicle: 9, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 5, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "e", book: "TM", page: 287, alphaStrike: { heat: 6, rangeShort: 1.26, rangeMedium: 1.26, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["flak"] }, rangeAero: "s" },
    { name: "Clan Rotary AC/2", tag: "clan-autocannon-rac-2", sort: "clan rotary ac/2", category: "Ballistic Weapons", damage: 2, notes: "Clan Rotary Autocannon; Clan C variant has reduced weight and increased critical space.", damageAero: 2, accuracyModifier: 0, cbills: 175000, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 161, heat: 1, heatAero: 1, weight: 7, range: { min: 0, short: 8, medium: 17, long: 25 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.8, rangeMedium: 0.8, rangeLong: 0.8, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion", "Clan C variant"] }, catalog: "clan" },
    { name: "Clan Rotary AC/5", tag: "clan-autocannon-rac-5", sort: "clan rotary ac/5", category: "Ballistic Weapons", damage: 5, notes: "Clan Rotary Autocannon; Clan C variant has reduced weight.", damageAero: 5, accuracyModifier: 0, cbills: 275000, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 345, heat: 1, heatAero: 1, weight: 9, range: { min: 0, short: 7, medium: 14, long: 21 }, space: { battlemech: 6, protomech: -1, combatVehicle: 1, supportVehicle: 6, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 2, rangeMedium: 2, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion", "Clan C variant"] }, catalog: "clan" },
    { name: "Clan Ultra AC/2", tag: "clan-autocannon-uac-2", sort: "clan ultra ac/2", category: "Ballistic Weapons", damage: 2, notes: "Clan Ultra Autocannon; Clan C variant has reduced weight and critical space.", damageAero: 2, accuracyModifier: 0, cbills: 120000, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 62, heat: 1, heatAero: 1, weight: 5, range: { min: 0, short: 9, medium: 18, long: 27 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.225, rangeMedium: 0.3, rangeLong: 0.3, rangeExtreme: 0.3, tc: true, notes: ["Provisional workbook conversion", "Clan C variant"] }, catalog: "clan" },
    { name: "Clan Ultra AC/5", tag: "clan-autocannon-uac-5", sort: "clan ultra ac/5", category: "Ballistic Weapons", damage: 5, notes: "Clan Ultra Autocannon; workbook conversion provisional.", damageAero: 5, accuracyModifier: 0, cbills: 200000, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 122, heat: 1, heatAero: 1, weight: 7, range: { min: 0, short: 7, medium: 14, long: 21 }, space: { battlemech: 3, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.623, rangeMedium: 0.75, rangeLong: 0.75, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Clan Ultra AC/10", tag: "clan-autocannon-uac-10", sort: "clan ultra ac/10", category: "Ballistic Weapons", damage: 10, notes: "Clan Ultra Autocannon; workbook conversion provisional.", damageAero: 10, accuracyModifier: 0, cbills: 320000, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 210, heat: 10, heatAero: 10, weight: 10, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 1.5, rangeMedium: 1.5, rangeLong: 1.5, rangeExtreme: 0, tc: true, notes: ["Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Clan Ultra AC/20", tag: "clan-autocannon-uac-20", sort: "clan ultra ac/20", category: "Ballistic Weapons", damage: 20, notes: "Clan Ultra AC/20; workbook conversion provisional.", damageAero: 20, accuracyModifier: 0, cbills: 480000, introduced: 3050, extinct: 0, reintroduced: 0, battleValue: 335, heat: 7, heatAero: 7, weight: 12, range: { min: 0, short: 4, medium: 8, long: 12 }, space: { battlemech: 8, protomech: -1, combatVehicle: 1, supportVehicle: 8, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 7, rangeShort: 3, rangeMedium: 3, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Hyper-Assault Gauss (HAG) 20", tag: "hyper-assault-gauss-20", sort: "hyper-assault gauss 20", category: "Ballistic Weapons", damage: 20, notes: "Clan-only HAG; workbook conversion provisional.", damageAero: 20, accuracyModifier: 0, cbills: 400000, introduced: 3050, extinct: 0, reintroduced: 0, battleValue: 300, heat: 4, heatAero: 4, weight: 10, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 4, rangeShort: 1.328, rangeMedium: 1.2, rangeLong: 1.2, rangeExtreme: 0, tc: true, notes: ["Flak", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Hyper-Assault Gauss (HAG) 30", tag: "hyper-assault-gauss-30", sort: "hyper-assault gauss 30", category: "Ballistic Weapons", damage: 30, notes: "Clan-only HAG; workbook conversion provisional.", damageAero: 30, accuracyModifier: 0, cbills: 600000, introduced: 3050, extinct: 0, reintroduced: 0, battleValue: 450, heat: 6, heatAero: 6, weight: 15, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 6, protomech: -1, combatVehicle: 1, supportVehicle: 6, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 6, rangeShort: 1.992, rangeMedium: 1.8, rangeLong: 1.8, rangeExtreme: 0, tc: true, notes: ["Flak", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Hyper-Assault Gauss (HAG) 40", tag: "hyper-assault-gauss-40", sort: "hyper-assault gauss 40", category: "Ballistic Weapons", damage: 40, notes: "Clan-only HAG; workbook conversion provisional.", damageAero: 40, accuracyModifier: 0, cbills: 800000, introduced: 3050, extinct: 0, reintroduced: 0, battleValue: 600, heat: 8, heatAero: 8, weight: 20, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 8, protomech: -1, combatVehicle: 1, supportVehicle: 8, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 8, rangeShort: 2.656, rangeMedium: 2.4, rangeLong: 2.4, rangeExtreme: 0, tc: true, notes: ["Flak", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "Nail Gun/Rivet Gun (C)", tag: "nail-rivet-gun-clan", sort: "nail gun/rivet gun (c)", category: "Ballistic Weapons", damage: 0, notes: "Clan-manufactured industrial support weapon; identical to the universal Nail Gun/Rivet Gun.", damageAero: 0, accuracyModifier: 0, cbills: 10000, introduced: 0, extinct: 0, reintroduced: 0, battleValue: 5, heat: 0, heatAero: 0, weight: 0.5, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 0, rangeShort: 0.05, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Clan C variant", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "ProtoMech Autocannon/2", tag: "protomech-autocannon-2", sort: "protomech autocannon 2", category: "Ballistic Weapons", damage: 2, notes: "Clan-only ProtoMech autocannon; workbook conversion provisional.", damageAero: 2, accuracyModifier: 0, cbills: 100000, introduced: 3050, extinct: 0, reintroduced: 0, battleValue: 40, heat: 1, heatAero: 1, weight: 2, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: -1, protomech: 1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.2, rangeMedium: 0.2, rangeLong: 0.2, rangeExtreme: 0, tc: true, notes: ["AC", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "ProtoMech Autocannon/4", tag: "protomech-autocannon-4", sort: "protomech autocannon 4", category: "Ballistic Weapons", damage: 4, notes: "Clan-only ProtoMech autocannon; workbook conversion provisional.", damageAero: 4, accuracyModifier: 0, cbills: 150000, introduced: 3050, extinct: 0, reintroduced: 0, battleValue: 80, heat: 1, heatAero: 1, weight: 4, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: -1, protomech: 1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.4, rangeMedium: 0.4, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["AC", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "ProtoMech Autocannon/8", tag: "protomech-autocannon-8", sort: "protomech autocannon 8", category: "Ballistic Weapons", damage: 8, notes: "Clan-only ProtoMech autocannon; workbook conversion provisional.", damageAero: 8, accuracyModifier: 0, cbills: 250000, introduced: 3050, extinct: 0, reintroduced: 0, battleValue: 160, heat: 2, heatAero: 2, weight: 8, range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: -1, protomech: 2, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 2, rangeShort: 0.8, rangeMedium: 0.8, rangeLong: 0, rangeExtreme: 0, tc: true, notes: ["AC", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" },
    { name: "AP Gauss Rifle", tag: "ap-gauss-rifle", sort: "ap gauss rifle", category: "Ballistic Weapons", damage: 0, notes: "Clan-only anti-infantry Gauss weapon; workbook Alpha Strike values are provisional.", damageAero: 0, accuracyModifier: 0, cbills: 150000, introduced: 3058, extinct: 0, reintroduced: 0, battleValue: 30, heat: 1, weight: 2, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoPerTon: 0, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "f", book: "TO", page: 0, alphaStrike: { heat: 1, rangeShort: 0.3, rangeMedium: 0.3, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Anti-Infantry", "Clan Only", "Provisional workbook conversion"] }, catalog: "clan" }
];
