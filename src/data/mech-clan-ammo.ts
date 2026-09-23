import { IEquipmentItem } from "./data-interfaces";

/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
*/
export const mechClanAmmo: IEquipmentItem[] = [
    {
        isAmmo: true,
        isSpecialAmmo: false,




        name: "Ammo (Arrow IV Non-Homing) - Clan",
        altNames: ["Clan Arrow IV Ammo", "Clan Arrow IV Non-Homing Missile", "c-Arrow IV Ammo"],
        tag: "ammo-arrow-iv-non-homing-clan",
        sort: "ammo, arrow iv, non-homing, clan",
        category: "Ammunition",
        cbills: 10000,
        introduced: 2844,
        extinct: 0,
        reintroduced: 0,
        battleValue: 30,




        name: "Ammo (Arrow IV Standard) - Clan",
        altNames: ["Clan Arrow IV Non-Homing Ammo", "Clan Arrow IV HE Ammo"],
        tag: "ammo-clan-arrow-iv-standard",
        sort: "ammo, artillery, arrow iv standard, clan",
        category: "Ammunition",
        cbills: 10000,
        introduced: 2593,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,




        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 5,
        explosive: true,
        techRating: "e",




        book: "TO:AU&E",
        page: 166,
        alphaStrike: { specialAbility: ["ARTAC-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Clan variant unguided area-of-effect artillery missile payload."] }




        book: "TW",
        page: 141,
        alphaStrike: { specialAbility: ["ART-AIV"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Deals standard area-effect artillery splash"] }




    },
    {
        isAmmo: true,
        isSpecialAmmo: true,



        name: "Ammo (Arrow IV Homing) - Clan",
        altNames: ["Arrow IV Guided Missile", "Arrow IV TAG Missile", "Homing Arrow Ammo"],
        tag: "ammo-arrow-iv-homing-clan",
        sort: "ammo, arrow iv, homing, clan",
        category: "Ammunition",
        cbills: 15000,
        introduced: 2600,
        extinct: 0,
        reintroduced: 0,
        battleValue: 44,



        name: "Ammo (Arrow IV Cluster) - Clan",
        altNames: ["Clan Arrow IV Cluster Ammo"],
        tag: "ammo-clan-arrow-iv-cluster",
        sort: "ammo, artillery, arrow iv cluster, clan",
        category: "Ammunition",
        cbills: 15000,
        introduced: 2594,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,



        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 5,
        explosive: true,
        techRating: "e",



        book: "TO:AU&E",
        page: 166,
        alphaStrike: { specialAbility: ["ARTAIS-1", "ARTAC-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires an active TAG laser designation. Automatically impacts the painted target for concentrated pinpoint damage rather than full area-of-effect spread."] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Arrow IV FASCAM)",
        altNames: ["FASCAM Arrow Missile", "Arrow IV Minefield Ammo - Clan"],
        tag: "ammo-arrow-iv-fascam",
        sort: "ammo, arrow iv, fascam",
        category: "Ammunition",
        cbills: 20000,
        introduced: 2621,
        extinct: 0,
        reintroduced: 0,
        battleValue: 30,




        book: "TO",
        page: 166,
        alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Deploys high-density submunitions across target hex"] }
    },

    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Arrow IV Homing) - Clan",
        altNames: ["Clan Arrow IV TAG Ammo", "Clan Arrow Homing Missile"],
        tag: "ammo-clan-arrow-iv-homing",
        sort: "ammo, artillery, arrow iv homing, clan",
        category: "Ammunition",
        cbills: 15000,
        introduced: 2593,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,




        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },




        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 5,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 166,
        alphaStrike: { specialAbility: ["ARTAIS-1", "ARTAC-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Deploys a dense, instantly-armed 20-point conventional scatterable landmine field layout over the target area code impact."] }




        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 5,
        explosive: true,
        techRating: "e",
        book: "TW",
        page: 141,
        alphaStrike: { specialAbility: ["AIVH"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires successful friendly TAG lock target painted"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Arrow IV Illumination) - Clan",
        altNames: ["Arrow IV Lit Ammo", "Flare Arrow IV"],
        tag: "ammo-clan-arrow-iv-illumination",
        sort: "ammo, artillery, arrow iv illumination, clan",
        category: "Ammunition",
        cbills: 5000,
        introduced: 2615,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 5,
        explosive: false,
        techRating: "c",
        book: "TO",
        page: 167,
        alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Negates nighttime/low-visibility hit penalties in affected zones"] }




    },
    {
        isAmmo: true,
        isSpecialAmmo: false,
        name: "Ammo (ATM Standard)",
        altNames: ["ATM Standard Ammo", "ATM ER Ammo", "Ammo ATM ER"],
        tag: "ammo-atm-standard",
        sort: "ammo, atm, standard",
        category: "Ammunition",
        cbills: 35000,
        introduced: 3054,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 4, short: 5, medium: 10, long: 15 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 60,
        explosive: true,
        techRating: "f",
        book: "TM",
        page: 229,
        ammoProfile: { damagePerMissile: 2, range: { min: 4, short: 5, medium: 10, long: 15 }, alphaStrikeDamage: { short: 2, medium: 2, long: 2, extreme: 0 } },
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Standard ATM damage profile"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: false,
        name: "Ammo (ATM Extended Range)",
        altNames: ["ATM ER Ammo", "ER ATM Ammo"],
        tag: "ammo-atm-er",
        sort: "ammo, atm, er",
        category: "Ammunition",
        cbills: 60000,
        introduced: 3054,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 9, medium: 18, long: 27 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 60,
        explosive: true,
        techRating: "f",
        book: "TM",
        page: 229,
        ammoProfile: { damagePerMissile: 1, range: { min: 0, short: 9, medium: 18, long: 27 }, alphaStrikeDamage: { short: 1, medium: 1, long: 1, extreme: 1 } },
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Extended Range profile"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: false,
        name: "Ammo (ATM High Explosive)",
        altNames: ["ATM HE Ammo", "HE ATM Ammo"],
        tag: "ammo-atm-he",
        sort: "ammo, atm, he",
        category: "Ammunition",
        cbills: 60000,
        introduced: 3054,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 3, medium: 6, long: 9 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 60,
        explosive: true,
        techRating: "f",
        book: "TM",
        page: 229,
        ammoProfile: { damagePerMissile: 3, range: { min: 0, short: 3, medium: 6, long: 9 }, alphaStrikeDamage: { short: 3, medium: 3, long: 0, extreme: 0 } },
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["High Explosive close-range profile"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (iATM Improved Inferno)",
        altNames: ["iATM Inferno Ammo", "Improved Inferno Ammo", "Inferno iATM Ammo"],
        tag: "ammo-iatm-inferno",
        sort: "ammo, iatm, inferno",
        category: "Ammunition",
        cbills: 95000,
        introduced: 3070,
        extinct: 3080,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 4, short: 5, medium: 10, long: 15 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 60,
        explosive: true,
        techRating: "f",
        book: "TO",
        page: 141,
        alphaStrike: { specialAbility: ["iATM#/#/#/#", "HT2#"], heat: 0, rangeShort: 2, rangeMedium: 2, rangeLong: 2, rangeExtreme: 0, tc: false, notes: ["Utilizes standard ATM range brackets. Inflicts high thermal spikes."] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (iATM Improved Magnetic-Pulse)",
        altNames: ["iATM Mag-Pulse Ammo", "Improved Mag-Pulse Ammo", "iATM EMP Ammo"],
        tag: "ammo-iatm-mag-pulse",
        sort: "ammo, iatm, magnetic-pulse",
        category: "Ammunition",
        cbills: 120000,
        introduced: 3070,
        extinct: 3080,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 3, medium: 6, long: 9 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 60,
        explosive: true,
        techRating: "f",
        book: "TO",
        page: 141,
        alphaStrike: { specialAbility: ["iATM#/#/#/#"], heat: 0, rangeShort: 3, rangeMedium: 3, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Utilizes High Explosive range brackets. Disrupts target heat tracking systems."] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (LRM Artemis IV) - Clan",
        altNames: ["Clan Artemis IV LRM Ammo", "LRM Artemis Ammo Clan"],
        tag: "ammo-lrm-clan-artemis-iv",
        sort: "ammo, lrm, artemis iv, clan",
        category: "Ammunition",
        cbills: 60000,
        introduced: 2598,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0, // Assigned per launcher or calculating total BV variant adjustments
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 120, // Standard overall block tracking, individual sizes vary in data tracking setups
        explosive: true,
        techRating: "e",
        book: "TW",
        page: 141,
        alphaStrike: { specialAbility: ["ARTIV"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires Artemis IV capable launcher"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (LRM Artemis V)",
        altNames: ["Artemis V LRM Ammo", "LRM Artemis V Ammo"],
        tag: "ammo-lrm-artemis-v",
        sort: "ammo, lrm, artemis v, clan",
        category: "Ammunition",
        cbills: 60000, // Matches special Artemis target ammunition profiles
        introduced: 3061,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0, 
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 120, 
        explosive: true,
        techRating: "f", // Advanced Clan Tech base
        book: "TO",
        page: 95,
        alphaStrike: { specialAbility: ["ARTV"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires Artemis V capable launcher"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (LRM Mag-Pulse)",
        altNames: ["Mag-Pulse LRM Ammo", "LRM Magnetic-Pulse Ammo", "EMP LRM Ammo"],
        tag: "ammo-lrm-mag-pulse",
        sort: "ammo, lrm, magnetic-pulse, clan, mag, emp",
        category: "Ammunition",
        cbills: 150000,
        introduced: 3056,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 120,
        explosive: true,
        techRating: "f",
        book: "TO",
        page: 141,
        alphaStrike: { specialAbility: ["LRM#/#/#/#", "IF#", "HT1#"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,




        name: "Ammo (LRM Thunder)",
        altNames: ["Thunder LRM Ammo", "LRM FASCAM Ammo", "FASCAM Ammo"],
        tag: "ammo-lrm-thunder",
        sort: "ammo, lrm, thunder",
        category: "Ammunition",
        cbills: 125000,
        introduced: 2621,




        name: "Ammo (LRM Narc-Capable) - Clan",
        altNames: ["Clan Narc LRM Ammo", "Clan Narc-Capable LRM Ammo"],
        tag: "ammo-clan-lrm-narc",
        sort: "ammo, lrm, narc, clan",
        category: "Ammunition",
        cbills: 60000,
        introduced: 2597,




        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 120,
        explosive: true,



        techRating: "e",
        book: "TO",
        page: 185,
        alphaStrike: { specialAbility: ["LRM#/#/#/#", "IF#", "MEL#"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }




        techRating: "d",
        book: "TW",
        page: 141,
        alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Gains cluster modifiers when fired at Narc beacon targets"] }



    },
    {
        isAmmo: true,
        isSpecialAmmo: true,





        name: "Ammo (Long Tom Cluster)",
        altNames: ["Long Tom Submunition Ammunition", "Cluster Artillery Shells"],
        tag: "ammo-long-tom-cluster",
        sort: "ammo, long tom, cluster",
        category: "Ammunition",
        cbills: 15000,
        introduced: 2600,
        extinct: 0,
        reintroduced: 0,
        battleValue: 46,




        name: "Ammo (LRM Swarm) - Clan",
        altNames: ["Standard Clan Swarm LRM Ammo", "Clan Swarm LRM Ammo"],
        tag: "ammo-lrm-swarm-clan",
        sort: "ammo, lrm, swarm, clan",
        category: "Ammunition",
        cbills: 60000, // Twice the cost of standard LRM ammunition
        introduced: 2621,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,



        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },



        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 5,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 165,
        alphaStrike: { specialAbility: ["ARTLT-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Bursters in mid-air to scatter submunitions, striking multiple adjacent ground elements while mitigating cover benefits."] }








        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 120,
        explosive: true,
        techRating: "d",
        book: "TW",
        page: 141,
        alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Salvo splashes onto any target in the same/adjacent hexes on a miss"] }



    },
    {
        isAmmo: true,
        isSpecialAmmo: true,




        name: "Ammo (Long Tom Copperhead)",
        altNames: ["Long Tom Guided Artillery Ammo", "Long Tom Homing Ammo", "Copperhead Shells"],
        tag: "ammo-long-tom-copperhead",
        sort: "ammo, long tom, copperhead",
        category: "Ammunition",
        cbills: 30000,
        introduced: 2645,
        extinct: 0,
        reintroduced: 0,
        battleValue: 32,




        name: "Ammo (LRT Artemis IV) - Clan",
        altNames: ["Clan Artemis IV LRT Ammo", "Clan Long Range Torpedo Artemis Ammo"],
        tag: "ammo-lrt-artemis-iv-clan",
        sort: "ammo, torpedo, lrt, artemis iv, clan",
        category: "Ammunition",
        cbills: 60000, // Double standard LRT payload tracking
        introduced: 2598,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,




        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },




        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 5,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 165,
        alphaStrike: { specialAbility: ["ARTLT-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires active TAG target to lock on and home into a single ground unit."] }





        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 0, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 120,
        explosive: true,
        techRating: "e",
        book: "TM",
        page: 207,
        alphaStrike: { specialAbility: ["ARTIV"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires Artemis IV capable LRT launcher framework"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Long Tom Thunder)",
        altNames: ["Long Tom FASCAM Ammunition", "Long Tom Minefield Ammo", "Thunder Artillery Shells"],
        tag: "ammo-long-tom-thunder",
        sort: "ammo, long tom, thunder",
        category: "Ammunition",
        cbills: 20000,
        introduced: 2621,
        extinct: 0,
        reintroduced: 0,
        battleValue: 46,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 5,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 169,
        alphaStrike: { specialAbility: ["ARTLT-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Deploys a standard 25-point density minefield onto the target hex layout upon impact."] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Sniper Cluster)",
        altNames: ["Sniper Submunition Ammunition", "Cluster Sniper Shells"],
        tag: "ammo-sniper-cluster",
        sort: "ammo, sniper, cluster",
        category: "Ammunition",
        cbills: 9000,
        introduced: 2600,
        extinct: 0,
        reintroduced: 0,
        battleValue: 23,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 10,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 165,
        alphaStrike: { specialAbility: ["ARTSN-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Drops cluster munitions over target hex layout upon impact."] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (LRT Artemis V)",
        altNames: ["Artemis V LRT Ammo", "Clan Artemis V LRT Ammo"],
        tag: "ammo-lrt-artemis-v",
        sort: "ammo, torpedo, lrt, artemis v",
        category: "Ammunition",
        cbills: 150000, // Clan advanced infrastructure multiplier
        introduced: 3061,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 0, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 120,
        explosive: true,
        techRating: "f",
        book: "TO",
        page: 95,
        alphaStrike: { specialAbility: ["ARTV"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires Advanced Clan Artemis V LRT launcher installation"] }
    },
    {

        


    }, 
    {
        isAmmo: true,
        isSpecialAmmo: false,
        name: "Ammo (Narc Homing) - Clan",
        altNames: ["Clan Narc Homing Pod", "Standard Clan Narc Ammo"],
        tag: "ammo-clan-narc-homing",
        sort: "ammo, beacon, narc homing, clan",
        category: "Ammunition",
        cbills: 10000,
        introduced: 2587,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 6,
        explosive: false, // Inactive transmitter payload; completely non-explosive in bins
        techRating: "d",
        book: "TW",
        page: 141,
        alphaStrike: { specialAbility: ["SNARC"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Latches to target to give friendly Narc-guided missiles a +2 Cluster Hit bonus"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Sniper Copperhead)",
        altNames: ["Sniper Guided Artillery Ammo", "Sniper Homing Ammo", "Sniper Copperhead Shells"],
        tag: "ammo-sniper-copperhead",
        sort: "ammo, sniper, copperhead",
        category: "Ammunition",
        cbills: 18000,
        introduced: 2645,
        extinct: 0,
        reintroduced: 0,
        battleValue: 16,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 10,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 165,
        alphaStrike: { specialAbility: ["ARTSN-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires active TAG target to lock on and home into a single ground unit."] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (SRM Artemis IV) - Clan",
        altNames: ["Clan Artemis IV SRM Ammo", "SRM Artemis Ammo Clan"],
        tag: "ammo-clan-srm-artemis-iv",
        sort: "ammo, srm, artemis iv, clan",
        category: "Ammunition",
        cbills: 54000,
        introduced: 2598,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 100,
        explosive: true,
        techRating: "e",
        book: "TW",
        page: 141,
        alphaStrike: { specialAbility: ["ARTIV"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires Artemis IV capable SRM launcher"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Sniper Thunder)",
        altNames: ["Sniper FASCAM Ammunition", "Sniper Minefield Ammo", "Thunder Sniper Shells"],
        tag: "ammo-sniper-thunder",
        sort: "ammo, sniper, thunder",
        category: "Ammunition",
        cbills: 12000,
        introduced: 2621,
        extinct: 0,
        reintroduced: 0,
        battleValue: 23,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech:-1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 10,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 169,
        alphaStrike: { specialAbility: ["ARTSN-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Deploys a standard 15-point density minefield onto the target hex layout upon impact."] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (SRM Artemis V)",
        altNames: ["Artemis V SRM Ammo", "Artemis V SRM Ammo"],
        tag: "ammo-srm-artemis-v",
        sort: "ammo, srm, artemis v",
        category: "Ammunition",
        cbills: 54000,
        introduced: 3061,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 100,
        explosive: true,
        techRating: "f",
        book: "TO",
        page: 95,
        alphaStrike: { specialAbility: ["ARTV"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires Artemis V capable SRM launcher"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Thumper Copperhead)",
        altNames: ["Thumper Guided Artillery Ammo", "Thumper Homing Ammo", "Thumper Copperhead Shells"],
        tag: "ammo-thumper-copperhead",
        sort: "ammo, thumper, copperhead",
        category: "Ammunition",
        cbills: 12000,
        introduced: 2645,
        extinct: 0,
        reintroduced: 0,
        battleValue: 8,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 20,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 165,
        alphaStrike: { specialAbility: ["ARTTH-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires active TAG target to lock on and home into a single ground unit."] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (SRM Fragmentation) - Clan",
        altNames: ["Clan Frag SRM Ammo", "Clan Anti-Infantry SRM Ammo"],
        tag: "ammo-clan-srm-frag",
        sort: "ammo, srm, fragmentation, clan",
        category: "Ammunition",
        cbills: 27000,
        introduced: 2368,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 100,
        explosive: true,
        techRating: "c",
        book: "TO",
        page: 184,
        alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Deals burst damage to conventional infantry, minimal damage to armor"] }
    },    
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (SRM Narc-Capable) - Clan",
        altNames: ["Clan Narc SRM Ammo", "Clan Narc-Capable SRM Ammo"],
        tag: "ammo-clan-srm-narc",
        sort: "ammo, srm, narc, clan",
        category: "Ammunition",
        cbills: 54000, // Twice the cost of standard SRM tracking arrays
        introduced: 2597,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 100,
        explosive: true,
        techRating: "d",
        book: "TW",
        page: 141,
        alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Gains logic bonuses when attacking a Narc-tagged target"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Thumper Cluster)",
        altNames: ["Thumper Submunition Ammunition", "Cluster Thumper Shells"],
        tag: "ammo-thumper-cluster",
        sort: "ammo, thumper, cluster",
        category: "Ammunition",
        cbills: 6000,
        introduced: 2600,
        extinct: 0,
        reintroduced: 0,
        battleValue: 12,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 20,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 165,
        alphaStrike: { specialAbility: ["ARTTH-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Deploys submunitions over a tight spread pattern to reliably tag targets and circumvent physical cover."] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (SRT Artemis IV) - Clan",
        altNames: ["Clan Artemis IV SRT Ammo", "Short Range Torpedo Artemis Ammo Clan"],
        tag: "ammo-srt-artemis-iv-clan",
        sort: "ammo, torpedo, srt, artemis iv, clan",
        category: "Ammunition",
        cbills: 54000,
        introduced: 2598,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 0, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 100,
        explosive: true,
        techRating: "e",
        book: "TM",
        page: 207,
        alphaStrike: { specialAbility: ["ARTIV"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires Artemis IV capable SRT launcher framework"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (SRT Artemis V)",
        altNames: ["Artemis V SRT Ammo", "SRT Artemis V Ammo"],
        tag: "ammo-srt-artemis-v",
        sort: "ammo, torpedo, srt, artemis v, clan",
        category: "Ammunition",
        cbills: 135000,
        introduced: 3061,
        extinct: 0,
        reintroduced: 0,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 0, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 100,
        explosive: true,
        techRating: "f",
        book: "TO",
        page: 95,
        alphaStrike: { specialAbility: ["ARTV"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Requires Advanced Clan Artemis V SRT launcher installation"] }
    },
    {
        isAmmo: true,
        isSpecialAmmo: true,
        name: "Ammo (Thumper Thunder)",
        altNames: ["Thumper FASCAM Ammunition", "Thumper Minefield Ammo", "Thunder Thumper Shells"],
        tag: "ammo-thumper-thunder",
        sort: "ammo, thumper, thunder",
        category: "Ammunition",
        cbills: 8000,
        introduced: 2621,
        extinct: 0,
        reintroduced: 0,
        battleValue: 12,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        ammoPerTon: 20,
        explosive: true,
        techRating: "e",
        book: "TO:AU&E",
        page: 169,
        alphaStrike: { specialAbility: ["ARTTH-1"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Deploys a standard 5-point density minefield onto the target hex layout upon impact."] }
    },
];
