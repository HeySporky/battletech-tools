import { IEquipmentItem } from "./data-interfaces";

/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
* Statistics sourced from Tactical Operations: Advanced Units & Equipment (TO:AUE) via the
* MegaMek open-source project's weapon/ammo definitions, which mirror the published rulebooks.
*/
export const mechClanEquipmentArtillery: IEquipmentItem[] = [
    {
        name: "Arrow IV System (Clan)",
        altNames: ["Clan Arrow IV"],
        tag: "arrow-iv-system",
        altTags: [],
        sort: "artillery, arrow iv, clan",
        category: "Artillery Weapons",
        notes: "Missile-based artillery. Fires as indirect area-saturation artillery across map sheets, or pairs with Target Acquisition Gear (TAG) for precision-guided homing strikes against specific hexes.",
        damage: 20,
        damageAero: 20,
        accuracyModifier: 0,
        cbills: 450000,
        introduced: 2844,
        extinct: 0,
        reintroduced: 0,
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
        book: "TO",
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
