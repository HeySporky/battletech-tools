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

];
