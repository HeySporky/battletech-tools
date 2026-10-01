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
        book: "TO:AUE",
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
    { isAmmo: false, name: "Prototype Arrow IV", altNames: ["Prototype Arrow IV"], tag: "prototype-arrow-iv", altTags: [], catalog: "is", sort: "artillery, arrow iv, prototype", category: "Artillery Weapons", alternateName: "", damage: 20, notes: "IO prototype: Experimental rules only; prototype reliability rules apply.", damageAero: 20, accuracyModifier: 0, cbills: 1800000, introduced: null, extinct: 2600, reintroduced: null, battleValue: 240, heat: 10, weight: 16, range: { min: 0, short: 0, medium: 0, long: 0, maxMapSheets: 8 }, space: { battlemech: 16, protomech: -1, combatVehicle: 1, supportVehicle: 16, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-is-arrow-iv-standard"], shotsPerTon: 5, ammoBattleValue: 30, minAmmoTons: 1, explosive: false, weaponType: ["ART", "M"], techRating: "e", book: "IO:AE", page: 64, alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 2, rangeExtreme: 2, tc: false, notes: ["artillery", "Provisional: copied from the production weapon"] }, heatAero: 10, prototype: 2593 },
];
