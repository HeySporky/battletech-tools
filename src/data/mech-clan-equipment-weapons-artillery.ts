import { IEquipmentItem } from "./data-interfaces";

/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
* Statistics sourced from Tactical Operations: Advanced Units & Equipment (TO:AUE) via the
* MegaMek open-source project's weapon/ammo definitions, which mirror the published rulebooks.
*/
export const mechClanEquipmentArtillery: IEquipmentItem[] = [
    {
        isAmmo: true,
        name: "Ammo (Long Tom)",
        altNames: [],
        tag: "ammo-long-tom",
        altTags: [],
        sort: "ammo, artillery, long tom",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 10000,
        introduced: 2445,
        extinct: 0,
        reintroduced: 0,
        battleValue: 46,
        heat: 0,
        weight: 1,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 30
        },
        space: {
            battlemech: 1,
            protomech: -1, // Unless a Protomech specific weapon, no more than 1.5 tons and 2 slots. -1 means cannot be used.
            combatVehicle: 1,
            supportVehicle: 1,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        ammoPerTon: 5,
        minAmmoTons: 1,
        explosive: true,
        weaponType: [
            "ART"
        ],
        techRating: "b",
        book: "TO",
        page: 96,
        alphaStrike: {
            heat: 0,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: []
        },
        heatAero: 0,
        rangeAero: "" // s, m, l, e, or "" for null
    },
    {
        isAmmo: true,
        name: "Ammo (Sniper)",
        tag: "ammo-sniper-artillery",
        sort: "ammo, artillery, sniper",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 6000,
        introduced: 0,
        extinct: 0,
        reintroduced: 0,
        battleValue: 11,
        heat: 0,
        weight: 1,
        range: {
            min: 0,
            short: 1,
            medium: 2,
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
        ammoPerTon: 10,
        minAmmoTons: 1,
        explosive: true,
        weaponType: [
            "ART"
        ],
        techRating: "b",
        book: "TO",
        page: 96,
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
        isAmmo: true,
        name: "Ammo (Thumper)",
        altNames: [],
        tag: "ammo-thumper-artillery",
        altTags: [],
        sort: "ammo, artillery, thumper",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 4500,
        introduced: 0,
        extinct: 0,
        reintroduced: 0,
        battleValue: 5,
        heat: 0,
        weight: 1,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 21
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
            "ART"
        ],
        techRating: "b",
        book: "TO",
        page: 96,
        alphaStrike: {
            heat: 0,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: []
        },
        heatAero: 0,
        rangeAero: ""
    },
    {
        isAmmo: true,
        name: "Ammo (Arrow IV)",
        altNames: [],
        tag: "ammo-arrow-iv",
        altTags: [],
        sort: "ammo, artillery, arrow iv",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 10000,
        introduced: 2593,
        extinct: 0,
        reintroduced: 0,
        battleValue: 30,
        heat: 0,
        weight: 1,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 9
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
        ammoPerTon: 5,
        minAmmoTons: 1,
        explosive: true,
        weaponType: [
            "ART"
        ],
        techRating: "f",
        book: "TO",
        page: 96,
        alphaStrike: {
            heat: 0,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: []
        },
        heatAero: 0,
        rangeAero: ""
    },
    {
        isAmmo: true,
        name: "Ammo (Long Tom Cannon)",
        altNames: [],
        tag: "ammo-long-tom-cannon",
        sort: "ammo, cannon, artillery, long tom",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 20000,
        introduced: 3032,
        extinct: 0,
        reintroduced: 0,
        battleValue: 41,
        heat: 0,
        weight: 1,
        range: {
            min: 4,
            short: 6,
            medium: 13,
            long: 20,
            extreme: 30
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
        ammoPerTon: 5,
        minAmmoTons: 1,
        explosive: true,
        weaponType: [
            "ARTC"
        ],
        techRating: "b",
        book: "TO",
        page: 97,
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
        isAmmo: true,
        name: "Ammo (Sniper Cannon)",
        altNames: [],
        tag: "ammo-sniper-cannon",
        sort: "ammo, cannon, artillery, sniper",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 15000,
        introduced: 3032,
        extinct: 0,
        reintroduced: 0,
        battleValue: 10,
        heat: 0,
        weight: 1,
        range: {
            min: 2,
            short: 4,
            medium: 8,
            long: 12,
            extreme: 16
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
        ammoPerTon: 10,
        minAmmoTons: 1,
        explosive: true,
        weaponType: [
            "ARTC"
        ],
        techRating: "b",
        book: "TO",
        page: 97,
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
        isAmmo: true,
        name: "Ammo (Thumper Cannon)",
        altNames: [],
        tag: "ammo-thumper-cannon",
        sort: "ammo, cannon, artillery, thumper",
        category: "Ammunition",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 10000,
        introduced: 3032,
        extinct: 0,
        reintroduced: 0,
        battleValue: 5,
        heat: 0,
        weight: 1,
        range: {
            min: 3,
            short: 4,
            medium: 9,
            long: 14,
            extreme: 21
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
            "ARTC"
        ],
        techRating: "b",
        book: "TO",
        page: 97,
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
        ammoPerTon: 5,
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
    {
        name: "Long Tom",
        altNames: [],
        tag: "long-tom-artillery",
        sort: "artillery, long tom",
        category: "Artillery Weapons",
        notes: "Indirect-fire tube artillery. Targets a map hex rather than a unit; damage falls off with distance from the point of impact and is not represented by the standard short/medium/long damage bands.",
        damage: 25,
        damageAero: 25,
        accuracyModifier: 0,
        cbills: 450000,
        introduced: 2445,
        extinct: 0,
        reintroduced: 0,
        battleValue: 368,
        heat: 20,
        weight: 30,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 30
        },
        space: {
            battlemech: 30,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 15,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        ammoPerTon: 5,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ART"
        ],
        techRating: "b",
        book: "TO",
        page: 96,
        alphaStrike: {
            heat: 0,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 3,
            rangeExtreme: 3,
            tc: false,
            notes: [
                "artillery"
            ]
        },
        heatAero: 20
    },
    {
        name: "Sniper",
        altNames: [],
        tag: "sniper-artillery",
        sort: "artillery, sniper",
        category: "Artillery Weapons",
        notes: "Indirect-fire tube artillery. Targets a map hex rather than a unit; damage falls off with distance from the point of impact and is not represented by the standard short/medium/long damage bands.",
        damage: 20,
        damageAero: 20,
        accuracyModifier: 0,
        cbills: 300000,
        introduced: 0,
        extinct: 0,
        reintroduced: 0,
        battleValue: 85,
        heat: 10,
        weight: 20,
        range: {
            min: 0,
            short: 1,
            medium: 2,
            long: 18
        },
        space: {
            battlemech: 20,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 10,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        ammoPerTon: 10,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ART"
        ],
        techRating: "b",
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
    {
        name: "Long Tom Artillery Cannon",
        altNames: ["Long Tom Cannon"],
        tag: "long-tom-cannon",
        altTags: [],
        sort: "artillery, cannon, long tom",
        category: "Artillery Weapons",
        notes: "Direct-fire artillery cannon; targets a physical terrain hex instead of an enemy unit.",
        damage: 20,
        damageAero: 20,
        accuracyModifier: 0,
        cbills: 650000,
        introduced: 3032, // Lyran introduction was 3012; Clan prototyping began in 3032
        extinct: 0,
        reintroduced: 0,
        battleValue: 329,
        heat: 20,
        weight: 20,
        range: {
            min: 4,
            short: 6,
            medium: 13,
            long: 20,
            extreme: 26
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
        ammoPerTon: 5,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ARTC"
        ],
        techRating: "b",
        book: "TO",
        page: 97,
        alphaStrike: {
            specialAbility: ["ARTLTC"],
            damageAoE: 3,
            heat: 20,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: ["Bypasses brackets to deliver a 2-inch AoE explosion up to 40 inches."]
        },
        heatAero: 20,
        rangeAero: "l"
    },
    {
        name: "Sniper Artillery Cannon",
        altNames: ["Sniper Cannon"],
        tag: "sniper-cannon",
        altTags: [],
        sort: "artillery, cannon, sniper",
        category: "Artillery Weapons",
        notes: "Direct-fire artillery cannon; targets a physical terrain hex instead of an enemy unit.",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 475000,
        introduced: 3032, // Lyran introduction was 3012; Clan prototyping began in 3032
        extinct: 0,
        reintroduced: 0,
        battleValue: 77,
        heat: 10,
        weight: 15,
        range: {
            min: 0,
            short: 4,
            medium: 8,
            long: 12,
            extreme: 0
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
        ammoPerTon: 10,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ARTC"
        ],
        techRating: "b",
        book: "TO",
        page: 97,
        alphaStrike: {
            specialAbility: ["ARTSC"],
            damageAoE: 2,
            heat: 10,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: ["Bypasses brackets to deliver a 2-inch AoE explosion up to 34 inches."]
        },
        heatAero: 10,
        rangeAero: "m" // Official Aero range classification is Medium (reaches up to 12 hexes)
    },
    {
        name: "Thumper Artillery Cannon",
        altNames: ["Thumper Cannon"],
        tag: "thumper-cannon",
        altTags: [],
        sort: "artillery, cannon, thumper",
        category: "Artillery Weapons",
        notes: "Direct-fire artillery cannon; targets a physical terrain hex instead of an enemy unit.",
        damage: 5,
        damageAero: 5,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 3032, // Lyran introduction was 3012; Clan prototyping began in 3032
        extinct: 0,
        reintroduced: 0,
        battleValue: 41,
        heat: 5,
        weight: 10,
        range: {
            min: 0,
            short: 7,
            medium: 14,
            long: 21,
            extreme: 0
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
        ammoPerTon: 20,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ARTC"
        ],
        techRating: "b",
        book: "TO",
        page: 97,
        alphaStrike: {
            specialAbility: ["ARTTC"],
            damageAoE: 1,
            heat: 5,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 0,
            rangeExtreme: 0,
            tc: false,
            notes: ["Bypasses brackets to deliver a 2-inch AoE explosion up to 28 inches."]
        },
        heatAero: 5,
        rangeAero: "m" // Official Aero range classification is Medium (reaches up to 14 hexes)
    },
    {
        name: "Thumper Artillery Piece",
        altNames: ["Thumper"],
        tag: "thumper-artillery",
        altTags: [],
        sort: "artillery, thumper",
        category: "Artillery Weapons",
        weaponType: ["ART"],
        notes: "Indirect-fire tube artillery. Targets a physical map hex rather than a specific unit; damage resolves via area-burst radius templates across map sheets.",
        damage: 15,
        damageAero: 2,
        accuracyModifier: 0,
        cbills: 187500,
        introduced: 2348, // Originally engineered as archaic field artillery during the Early Age of War
        extinct: 0,
        reintroduced: 0,
        battleValue: 43,
        heat: 5,
        weight: 15,
        range: {
            min: 0,
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0,
            maxMapSheets: 21
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
        ammoPerTon: 20,
        minAmmoTons: 1,
        explosive: false,
        techRating: "b",
        book: "TO",
        page: 96,
        alphaStrike: {
            specialAbility: ["ARTTH"],
            damageAoE: 1,
            heat: 0,
            rangeShort: 0,
            rangeMedium: 0,
            rangeLong: 1,
            rangeExtreme: 1,
            tc: false,
            notes: ["Bypasses brackets via the ARTTH trait to place a 1-point AoE strike anywhere on the board."]
        },
        heatAero: 5,
        rangeAero: "s" // Short-range tactical mapping for atmosphere/low-altitude strike rules
    },
];
