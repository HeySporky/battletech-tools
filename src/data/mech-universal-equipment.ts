import { IEquipmentItem } from "./data-interfaces";
import { mechUniversalAmmo } from "./mech-universal-ammo";

function hasUniversalMetrics(item: IEquipmentItem, counterpart: IEquipmentItem): boolean {
    return item.name === counterpart.name
        && item.weight === counterpart.weight
        && item.space.battlemech === counterpart.space.battlemech
        && JSON.stringify(item.damage) === JSON.stringify(counterpart.damage)
        && JSON.stringify(item.range) === JSON.stringify(counterpart.range);
}

export const mechUniversalEquipment: IEquipmentItem[] = [
    { isAmmo: false, name: "Nail Gun", altNames: ["Rivet Gun", "Nail Gun/Rivet Gun (C)"], tag: "nail-gun", ammoTypes: ["ammo-nail-rivet-gun-standard"], altTags: ["rivet-gun", "nail-rivet-gun-clan"], sort: "nail gun/rivet gun", category: "Ballistic Weapons", damage: 0, notes: "Universal industrial weapon; workbook conversion provisional.", damageAero: 0, accuracyModifier: 0, cbills: 10000, introduced: 2310, extinct: 0, reintroduced: 0, prototype: 2309, battleValue: 5, heat: 0, heatAero: 0, weight: 0.5, ammoBattleValue: 1, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 300, minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e", book: "TO", page: 0, alphaStrike: { heat: 0, rangeShort: 0.05, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Provisional workbook conversion"] }, rangeAero: "", },
    { isAmmo: false, name: "Thumper Artillery Piece", altNames: ["Thumper"], tag: "thumper-artillery", altTags: [], sort: "artillery, thumper", category: "Artillery Weapons", weaponType: ["ART"], notes: "Indirect-fire tube artillery. Targets a physical map hex rather than a specific unit; damage resolves via area-burst radius templates across map sheets.", damage: 15, damageAero: 2, accuracyModifier: 0, cbills: 187500, introduced: 1950, /* Originally engineered as archaic field artillery during the Early Age of War */ extinct: 0, reintroduced: 0, battleValue: 43, heat: 5, weight: 15, range: { min: 0, short: 0, medium: 0, long: 0, extreme: 0, maxMapSheets: 21 }, space: { battlemech: 15, protomech: -1, combatVehicle: 1, supportVehicle: 15, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 20, ammoBattleValue: 5, minAmmoTons: 1, explosive: false, techRating: "b", book: "TO", page: 96, alphaStrike: { specialAbility: ["ARTTH"], damageAoE: 1, heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Bypasses brackets via the ARTTH trait to place a 1-point AoE strike anywhere on the board."] }, heatAero: 5, rangeAero: "s" /* Short-range tactical mapping for atmosphere/low-altitude strike rules */ },
    {
        name: "Long Tom",
        tag: "long-tom-artillery",
        altNames: [],
        altTags: [],
        sort: "artillery, long tom",
        category: "Artillery Weapons",
        notes: "Indirect-fire tube artillery. Targets a map hex rather than a unit; damage falls off with distance from the point of impact and is not represented by the standard short/medium/long damage bands.",
        damage: 25,
        damageAero: 25,
        accuracyModifier: 0,
        cbills: 450000,
        introduced: 2500,
        extinct: 0,
        reintroduced: 0,
        prototype: 2445,
        battleValue: 368,
        heat: 20,
        weight: 30,
        range: { min: 0, short: 0, medium: 0, long: 0, extreme: 0, maxMapSheets: 30 },
        space: {
            battlemech: 30,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 15,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        shotsPerTon: 5,
        ammoBattleValue: 46,
        ammoTypes: ["ammo-long-tom-standard"],
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
        tag: "sniper-artillery",
        altNames: [],
        altTags: [],
        sort: "artillery, sniper",
        category: "Artillery Weapons",
        notes: "Indirect-fire tube artillery. Targets a map hex rather than a unit; damage falls off with distance from the point of impact and is not represented by the standard short/medium/long damage bands.",
        damage: 20,
        damageAero: 20,
        accuracyModifier: 0,
        cbills: 300000,
        introduced: 1950,
        extinct: 0,
        reintroduced: 0,
        battleValue: 85,
        heat: 10,
        weight: 20,
        range: { min: 0, short: 0, medium: 0, long: 0, extreme: 0, maxMapSheets: 18 },
        space: {
            battlemech: 20,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 10,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        shotsPerTon: 10,
        ammoBattleValue: 11,
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
        isAmmo: false,
        name: "Vehicle Flamer",
        tag: "vehicle-flamer",
        altNames: ["Vehicle Flamer (Clan)"],
        altTags: ["vehicle-flamer-clan"],
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
        shotsPerTon: 20,
        ammoBattleValue: 1,
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
        book: "TO",
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
        book: "TO",
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
        book: "TO",
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
    },
    { isAmmo: false, name: "Fluid Gun", altNames: ["Clan Fluid Gun"], tag: "fluid-gun", altTags: [], sort: "equipment, fluid gun", category: "Ballistic Weapons", alternateName: "Fluid Gun", damage: 0, notes: "Sprays water, coolant or other fluids; deals no standard damage.", damageAero: 0, accuracyModifier: 0, cbills: 35000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 6, heat: 0, weight: 2, range: { min: 0, short: 1, medium: 2, long: 3 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, ammoTypes: ["ammo-fluid-gun-standard"], shotsPerTon: 20, ammoBattleValue: 1, minAmmoTons: 1, explosive: false, weaponType: [], techRating: "b", book: "TO", page: 313, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, heatAero: 0 },
    { isEquipment: true, isAmmo: false, name: "Supercharger", altNames: [], tag: "supercharger", altTags: [], sort: "equipment, supercharger", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "Mounted next to the engine; boosts run MP like MASC.", damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 0, heat: 0, heatAero: 0, weight: 0, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "TO:AUE", page: 157, alphaStrike: { specialAbility: ["MASC"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, variableSize: true, variableFormula: "supercharger" },
    { isEquipment: true, isAmmo: false, name: "Backhoe", altNames: [], tag: "backhoe", altTags: [], sort: "industrial, backhoe", category: "Melee", alternateName: "", damage: 6, notes: "Industrial equipment; damage per TM industrial melee rules.", damageAero: 0, accuracyModifier: 0, cbills: 50000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 8, heat: 0, heatAero: 0, weight: 5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 6, protomech: -1, combatVehicle: 1, supportVehicle: 6, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "b", book: "TM", page: 241, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Bridge Layer (Light)", altNames: [], tag: "bridge-layer-light", altTags: [], sort: "industrial, bridge layer, light", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 40000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 5, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 1, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "b", book: "TM", page: 242, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "Bridge Layer (Medium)", altNames: [], tag: "bridge-layer-medium", altTags: [], sort: "industrial, bridge layer, medium", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 75000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 10, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 2, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "TM", page: 242, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "Bridge Layer (Heavy)", altNames: [], tag: "bridge-layer-heavy", altTags: [], sort: "industrial, bridge layer, heavy", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 100000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 20, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 6, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 12, protomech: -1, combatVehicle: 1, supportVehicle: 12, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "TM", page: 242, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "Chainsaw", altNames: [], tag: "chainsaw", altTags: [], sort: "industrial, chainsaw", category: "Melee", alternateName: "", damage: 5, notes: "Industrial equipment; damage per TM industrial melee rules.", damageAero: 0, accuracyModifier: 0, cbills: 100000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 7, heat: 0, heatAero: 0, weight: 5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "b", book: "TM", page: 241, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Combine", altNames: [], tag: "combine", altTags: [], sort: "industrial, combine", category: "Melee", alternateName: "", damage: 3, notes: "Industrial equipment; damage per TM industrial melee rules.", damageAero: 0, accuracyModifier: 0, cbills: 75000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 5, heat: 0, heatAero: 0, weight: 2.5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "b", book: "TM", page: 243, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Dual Saw", altNames: [], tag: "dual-saw", altTags: [], sort: "industrial, dual saw", category: "Melee", alternateName: "", damage: 7, notes: "Industrial equipment; damage per TM industrial melee rules.", damageAero: 0, accuracyModifier: 0, cbills: 100000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 9, heat: 0, heatAero: 0, weight: 7, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 7, protomech: -1, combatVehicle: 1, supportVehicle: 7, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "TM", page: 243, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Heavy-Duty Pile Driver", altNames: ["Pile Driver"], tag: "pile-driver", altTags: [], sort: "industrial, pile driver", category: "Melee", alternateName: "", damage: 10, notes: "Industrial equipment; damage per TM industrial melee rules.", damageAero: 0, accuracyModifier: 0, cbills: 100000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 5, heat: 0, heatAero: 0, weight: 10, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 8, protomech: -1, combatVehicle: 1, supportVehicle: 8, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "TM", page: 244, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Lift Hoist", altNames: ["Arresting Hoist", "Lift Hoist/Arresting Hoist"], tag: "lift-hoist", altTags: [], sort: "industrial, lift hoist", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 50000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 0, heat: 0, heatAero: 0, weight: 3, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 3, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "a", book: "TM", page: 245, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "Mining Drill", altNames: [], tag: "mining-drill", altTags: [], sort: "industrial, mining drill", category: "Melee", alternateName: "", damage: 4, notes: "Industrial equipment; damage per TM industrial melee rules.", damageAero: 0, accuracyModifier: 0, cbills: 10000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 6, heat: 0, heatAero: 0, weight: 3, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "TM", page: 246, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Rock Cutter", altNames: [], tag: "rock-cutter", altTags: [], sort: "industrial, rock cutter", category: "Melee", alternateName: "", damage: 5, notes: "Industrial equipment; damage per TM industrial melee rules.", damageAero: 0, accuracyModifier: 0, cbills: 100000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 6, heat: 0, heatAero: 0, weight: 5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "TM", page: 247, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Salvage Arm", altNames: [], tag: "salvage-arm", altTags: [], sort: "industrial, salvage arm", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 50000, introduced: 2415, extinct: 0, reintroduced: 0, prototype: 2400, battleValue: 0, heat: 0, heatAero: 0, weight: 3, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "d", book: "TM", page: 248, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "Spot Welder", altNames: [], tag: "spot-welder", altTags: [], sort: "industrial, spot welder", category: "Melee", alternateName: "", damage: 5, notes: "Industrial equipment; damage per TM industrial melee rules.", damageAero: 0, accuracyModifier: 0, cbills: 75000, introduced: 2320, extinct: 0, reintroduced: 0, prototype: 2312, battleValue: 5, heat: 2, heatAero: 0, weight: 2, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "TM", page: 248, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Wrecking Ball", altNames: [], tag: "wrecking-ball", altTags: [], sort: "industrial, wrecking ball", category: "Melee", alternateName: "", damage: 8, notes: "Industrial equipment; damage per TM industrial melee rules.", damageAero: 0, accuracyModifier: 0, cbills: 110000, introduced: 1950, extinct: 0, reintroduced: 0, battleValue: 8, heat: 0, heatAero: 0, weight: 4, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "a", book: "TM", page: 249, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, isMelee: true },
];

const universalEquipmentTags = new Set([
    ...mechUniversalEquipment.map(item => item.tag),
    ...mechUniversalAmmo.map(item => item.tag),
]);

export function isUniversalEquipment(item: IEquipmentItem): boolean {
    return item.catalog === "universal" || universalEquipmentTags.has(item.tag);
}

export function hasUniversalEquipmentMetrics(item: IEquipmentItem, counterpart: IEquipmentItem): boolean {
    return hasUniversalMetrics(item, counterpart);
}