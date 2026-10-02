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
 *
 * Statistics sourced from Tactical Operations: Advanced Units & Equipment (TO:AUE) via the
 * MegaMek open-source project's weapon/ammo definitions, which mirror the published rulebooks.
 */

export const mechClanEquipmentArtillery: IEquipmentItem[] = [
    {
        name: "Arrow IV System (Clan)",
        altNames: ["Clan Arrow IV"],
        tag: "clan-arrow-iv-system",
        // Old tag shared with the IS record; kept so existing Clan saves resolve
        altTags: ["arrow-iv-system"],
        sort: "artillery, arrow iv, clan",
        category: "Artillery Weapons",
        notes: "Missile-based artillery. Fires as indirect area-saturation artillery across map sheets, or pairs with Target Acquisition Gear (TAG) for precision-guided homing strikes against specific hexes.",
        damage: 20,
        damageAero: 20,
        accuracyModifier: 0,
        cbills: 450000,
        introduced: 2844,
        extinct: null,
        reintroduced: null,
        battleValue: 240,
        heat: 10,
        weight: 12,
        range: {
            min: 0,
            maxMapSheets: 9, // Artillery scales across full map sheets rather than immediate hexes
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        },
        space: {
            battlemech: 12,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 6,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        shotsPerTon: 5,
        ammoBattleValue: 30,
        ammoTypes: ["ammo-clan-arrow-iv-standard"],
        minAmmoTons: 1,
        explosive: false,
        weaponType: ["ART","M"],
        techRating: "f",
        book: "TO:AUE",
        page: 96,
        alphaStrike: {
            specialAbility: ["ARTA4", "A4H"],
            damageAoE: 2,
            heat: 10,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: ["Bypasses brackets via the ARTA4 trait to place a 2-point AoE strike anywhere on the board."]
        },
        heatAero: 10,
        rangeAero: "s" // Short-range payload designation for low-altitude striking/bombing rules
    },
    {
        name: "Long Tom Cannon (Clan)",
        tag: "clan-long-tom-cannon",
        altNames: ["Long Tom Artillery Cannon (Clan)"],
        altTags: ["long-tom-cannon"],
        sort: "artillery, cannon, long tom",
        category: "Artillery Weapons",
        notes: "Direct-fire artillery cannon; unlike tube artillery it targets a unit directly instead of a map hex.",
        damage: 20,
        damageAero: 20,
        accuracyModifier: 0,
        cbills: 650000,
        introduced: 3079,
        extinct: null,
        reintroduced: null,
        prototype: 3032,
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
        heatAero: 20,
        catalog: "clan",
        ammoTypes: ["ammo-long-tom-cannon-standard"]
    },
    {
        name: "Sniper Cannon (Clan)",
        tag: "clan-sniper-cannon",
        altNames: ["Sniper Artillery Cannon (Clan)"],
        altTags: ["sniper-cannon"],
        sort: "artillery, cannon, sniper",
        category: "Artillery Weapons",
        notes: "Direct-fire artillery cannon; unlike tube artillery it targets a unit directly instead of a map hex.",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 475000,
        introduced: 3079,
        extinct: null,
        reintroduced: null,
        prototype: 3032,
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
        heatAero: 10,
        catalog: "clan",
        ammoTypes: ["ammo-sniper-cannon-standard"]
    },
    {
        name: "Thumper Cannon (Clan)",
        tag: "clan-thumper-cannon",
        altNames: ["Thumper Artillery Cannon (Clan)"],
        altTags: ["thumper-cannon"],
        sort: "artillery, cannon, thumper",
        category: "Artillery Weapons",
        notes: "Direct-fire artillery cannon; unlike tube artillery it targets a unit directly instead of a map hex.",
        damage: 5,
        damageAero: 5,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 3079,
        extinct: null,
        reintroduced: null,
        prototype: 3032,
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
        heatAero: 5,
        catalog: "clan",
        ammoTypes: ["ammo-thumper-cannon-standard"]
    },
];
