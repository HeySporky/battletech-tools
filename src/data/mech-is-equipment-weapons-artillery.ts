import { IEquipmentItem } from "./data-interfaces";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*
* Statistics sourced from Tactical Operations: Advanced Units & Equipment (TO:AUE) via the
* MegaMek open-source project's weapon/ammo definitions, which mirror the published rulebooks.
*/

export const mechISEquipmentArtillery: IEquipmentItem[] = [
    {
        name: "Arrow IV System",
        tag: "arrow-iv-system",
        sort: "artillery, arrow iv",
        category: "Artillery Weapons",
        notes: "Missile-based artillery. Can be fired as indirect-fire area-saturation artillery at a map hex, or (with homing ammo and forward spotters carrying Target Acquisition Gear) as precision-guided indirect fire against a specific unit.",
        damage: 20,
        damageAero: 20,
        accuracyModifier: 0,
        cbills: 450000,
        introduced: 2600,
        extinct: 2830,
        reintroduced: 3044,
        prototype: 2593,
        battleValue: 240,
        heat: 10,
        weight: 15,
        range: {
            min: 0,
            maxMapSheets: 8, // Artillery range is in map sheets (was stored as long: 8)
            short: 0,
            medium: 0,
            long: 0
        },
        space: {
            battlemech: 15,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 7,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        shotsPerTon: 5,
        ammoBattleValue: 30,
        ammoTypes: ["ammo-is-arrow-iv-standard"],
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ART",
            "M"
        ],
        techRating: "e",
        book: "TO",
        page: 96,
        alphaStrike: {
            heat: 0,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 2,
            rangeExtreme: 2,
            tc: false,
            notes: [
                "artillery"
            ]
        },
        heatAero: 10
    },
    { isAmmo: false, name: "Prototype Arrow IV", altNames: ["Prototype Arrow IV"], tag: "prototype-arrow-iv", altTags: [], catalog: "is", sort: "artillery, arrow iv, prototype", category: "Artillery Weapons", alternateName: "", damage: 20, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 20, accuracyModifier: 0, cbills: 1800000, introduced: null, extinct: 2613, reintroduced: 3044, battleValue: 240, heat: 10, weight: 16, range: { min: 0, short: 0, medium: 0, long: 0, maxMapSheets: 8 }, space: { battlemech: 16, protomech: -1, combatVehicle: 1, supportVehicle: 16, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-is-arrow-iv-standard"], shotsPerTon: 5, ammoBattleValue: 30, minAmmoTons: 1, explosive: false, weaponType: ["ART", "M"], techRating: "e", book: "IO", page: 70, alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 2, rangeExtreme: 2, tc: false, notes: ["artillery", "Provisional: copied from the production weapon"] }, heatAero: 10, prototype: 2593 },
    // Artillery cannon, Inner Sphere: prototype 3012, production 3079 (LC) (IO p.37; TO:AUE p.97).
    {
        name: "Long Tom Cannon",
        tag: "long-tom-cannon",
        altNames: ["Long Tom Artillery Cannon"],
        altTags: [],
        sort: "artillery, cannon, long tom",
        category: "Artillery Weapons",
        notes: "Direct-fire artillery cannon; unlike tube artillery it targets a unit directly instead of a map hex.",
        damage: 20,
        damageAero: 20,
        accuracyModifier: 0,
        cbills: 650000,
        introduced: 3079,
        extinct: 0,
        reintroduced: 0,
        prototype: 3012,
        battleValue: 329,
        heat: 20,
        weight: 20,
        range: {
            min: 4,
            short: 6,
            medium: 13,
            long: 20,
            extreme: 30
        },
        space: {
            battlemech: 15,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 15,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        shotsPerTon: 5,
        ammoBattleValue: 41,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ARTC"
        ],
        techRating: "b",
        book: "TO:AUE",
        page: 97,
        alphaStrike: {
            heat: 20,
            rangeShort: 1.32,
            rangeMedium: 3,
            rangeLong: 3,
            rangeExtreme: 0,
            tc: false,
            notes: []
        },
        heatAero: 20
    },
    // Artillery cannon, Inner Sphere: prototype 3012, production 3079 (LC) (IO p.37; TO:AUE p.97).
    {
        name: "Sniper Cannon",
        tag: "sniper-cannon",
        altNames: ["Sniper Artillery Cannon"],
        altTags: [],
        sort: "artillery, cannon, sniper",
        category: "Artillery Weapons",
        notes: "Direct-fire artillery cannon; unlike tube artillery it targets a unit directly instead of a map hex.",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 475000,
        introduced: 3079,
        extinct: 0,
        reintroduced: 0,
        prototype: 3012,
        battleValue: 77,
        heat: 10,
        weight: 15,
        range: {
            min: 2,
            short: 4,
            medium: 8,
            long: 12,
            extreme: 16
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
        shotsPerTon: 10,
        ammoBattleValue: 10,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ARTC"
        ],
        techRating: "b",
        book: "TO:AUE",
        page: 97,
        alphaStrike: {
            heat: 10,
            rangeShort: 0.83,
            rangeMedium: 1,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: []
        },
        heatAero: 10
    },
    // Artillery cannon, Inner Sphere: prototype 3012, production 3079 (LC) (IO p.37; TO:AUE p.97).
    {
        name: "Thumper Cannon",
        tag: "thumper-cannon",
        altNames: ["Thumper Artillery Cannon"],
        altTags: [],
        sort: "artillery, cannon, thumper",
        category: "Artillery Weapons",
        notes: "Direct-fire artillery cannon; unlike tube artillery it targets a unit directly instead of a map hex.",
        damage: 5,
        damageAero: 5,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 3079,
        extinct: 0,
        reintroduced: 0,
        prototype: 3012,
        battleValue: 41,
        heat: 5,
        weight: 10,
        range: {
            min: 3,
            short: 4,
            medium: 9,
            long: 14,
            extreme: 21
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
        shotsPerTon: 20,
        ammoBattleValue: 5,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ARTC"
        ],
        techRating: "b",
        book: "TO:AUE",
        page: 97,
        alphaStrike: {
            heat: 5,
            rangeShort: 0.375,
            rangeMedium: 0.5,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: []
        },
        heatAero: 5
    }
];
