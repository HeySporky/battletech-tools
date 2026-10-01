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

export const mechClanEquipmentMisc: IEquipmentItem[] = [
    {
        name: "Clan Active Probe",
        altNames: ["Active Probe (Clan)"],
        tag: "clan-active-probe",
        altTags: ["active-probe-clan"],
        prototype: 2830,
        sort: "active, probe",
        category: "Miscellaneous Equipment",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2832,
        extinct: null,
        reintroduced: null,
        battleValue: 12,
        battleValueDefensive: true,
        heat: 0,
        weight: 1,
        range: {
            min: 0,
            short: 0,
            medium: 0,
            long: 0
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
        shotsPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ECM",
            "SENS"
        ],
        techRating: "e",
        book: "TM",
        page: 204,
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
        name: "ECM Suite (Clan)", 
        altNames: ["Clan ECM Suite"],
        tag: "clan-ecm-system",
        altTags: ["ecm-system-clan"],
        prototype: 2830,
        sort: "ecm, system, clan",
        category: "Miscellaneous Equipment",
        damage: 0,
        notes: "",
        damageAero: 0,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2832,
        extinct: null,
        reintroduced: null,
        battleValue: 61,
        battleValueDefensive: true,
        heat: 0,
        weight: 1,
        range: {
            min: 0,
            short: 0,
            medium: 0,
            long: 0
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
        shotsPerTon: 0,
        minAmmoTons: 1,
        explosive: false,
        weaponType: [
            "ECM",
            "SENS"
        ],
        techRating: "e",
        book: "TM",
        page: 213,
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
    { isAmmo: false, name: "TAG (Clan)", altNames: ["Clan TAG", "Clan Target Acquisition Gear"], tag: "clan-tag", altTags: [], catalog: "clan", sort: "equipment, tag, clan", category: "Miscellaneous Equipment", alternateName: "TAG", damage: 0, notes: "Target Acquisition Gear: designates a target for homing artillery and semi-guided munitions; deals no damage.", damageAero: 0, accuracyModifier: 0, cbills: 50000, introduced: 2830, extinct: null, reintroduced: null, prototype: 2828, battleValue: 0, heat: 0, weight: 1, range: { min: 0, short: 5, medium: 9, long: 15 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TM", page: 238, alphaStrike: { specialAbility: ["TAG"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, heatAero: 0 },
    { isAmmo: false, name: "Light TAG (Clan)", altNames: ["Clan Light TAG"], tag: "clan-light-tag", altTags: ["light-tag"], catalog: "clan", sort: "equipment, tag, light, clan", category: "Miscellaneous Equipment", alternateName: "Light TAG", damage: 0, notes: "Target Acquisition Gear: designates a target for homing artillery and semi-guided munitions; deals no damage.", damageAero: 0, accuracyModifier: 0, cbills: 40000, introduced: 3054, extinct: null, reintroduced: null, prototype: 3051, battleValue: 0, heat: 0, weight: 0.5, range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TM", page: 238, alphaStrike: { specialAbility: ["LTAG"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, heatAero: 0 },
    { isEquipment: true, isAmmo: false, name: "Light Active Probe (Clan)", altNames: ["Clan Light Active Probe"], tag: "clan-light-active-probe", altTags: [], catalog: "clan", sort: "equipment, probe, light, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 50000, introduced: 2900, extinct: null, reintroduced: null, prototype: 2890, battleValue: 7, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 0.5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TM", page: 204, alphaStrike: { specialAbility: ["LPRB"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "Angel ECM Suite (Clan)", altNames: ["Clan Angel ECM"], tag: "clan-angel-ecm", altTags: [], catalog: "clan", sort: "equipment, ecm, angel, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 750000, introduced: 3080, extinct: null, reintroduced: null, prototype: 3058, battleValue: 100, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 2, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TO:AUE", page: 91, alphaStrike: { specialAbility: ["AECM"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "Watchdog CEWS (Clan)", altNames: ["Watchdog Composite Electronic Warfare System", "Watchdog"], tag: "clan-watchdog-cews", altTags: [], catalog: "clan", sort: "equipment, ecm, watchdog, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 500000, prototype: 3059, introduced: 3080, extinct: null, reintroduced: null, battleValue: 68, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 1.5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TO:AUE", page: 90, alphaStrike: { specialAbility: ["WAT"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "CASE II (Clan)", altNames: ["Clan CASE II"], tag: "clan-case-ii", altTags: [], catalog: "clan", sort: "case ii, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 175000, prototype: 3062, introduced: 3082, extinct: null, reintroduced: null, battleValue: 0, heat: 0, heatAero: 0, weight: 0.5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TO:AUE", page: 111, alphaStrike: { specialAbility: ["CASEII"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "A-Pod (Clan)", altNames: ["Clan Anti-Personnel Pod"], tag: "clan-a-pod", altTags: [], catalog: "clan", sort: "equipment, pod, a-pod, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "One-shot anti-infantry pod.", damageAero: 0, accuracyModifier: 0, cbills: 1500, introduced: 2850, extinct: null, reintroduced: null, prototype: 2845, battleValue: 1, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 0.5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "b", book: "TM", page: 205, alphaStrike: { specialAbility: ["AMP"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "MechWarrior Aquatic Survival System (Clan)", altNames: ["Clan MASS"], tag: "clan-mass", altTags: [], catalog: "clan", sort: "equipment, mass, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "Mounted in the head.", damageAero: 0, accuracyModifier: 0, cbills: 4000, introduced: 3083, extinct: null, reintroduced: null, prototype: 3062, battleValue: 9, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 1.5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "d", book: "TO:AUE", page: 137, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "HarJel System (Clan)", altNames: ["Clan HarJel"], tag: "clan-harjel", altTags: [], catalog: "clan", sort: "equipment, harjel, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "Seals armor breaches in its location.", damageAero: 0, accuracyModifier: 0, cbills: 120000, introduced: 3115, extinct: null, reintroduced: null, prototype: 3059, battleValue: 0, heat: 0, heatAero: 0, weight: 1, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "e", book: "TO:AUE", page: 100, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "MASC (Clan)", altNames: ["Clan MASC"], tag: "clan-masc", altTags: [], catalog: "clan", sort: "equipment, masc, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "Run MP = walk MP x 2 when engaged; roll for failure each turn used.", damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 2827, extinct: null, reintroduced: null, prototype: 2820, battleValue: 0, heat: 0, heatAero: 0, weight: 0, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TM", page: 232, alphaStrike: { specialAbility: ["MASC"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, variableSize: true, variableFormula: "masc-clan" },
    { isEquipment: true, isAmmo: false, name: "Targeting Computer (Clan)", altNames: ["Clan Targeting Computer"], tag: "clan-targeting-computer", altTags: [], catalog: "clan", sort: "equipment, targeting computer, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "Sized by direct-fire weapon tonnage; -1 to-hit and aimed shots for those weapons.", damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 2860, extinct: null, reintroduced: null, prototype: 2850, battleValue: 0, heat: 0, heatAero: 0, weight: 0, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TM", page: 238, alphaStrike: { specialAbility: ["TC"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, variableSize: true, variableFormula: "targeting-computer-clan" },
    { isEquipment: true, isAmmo: false, name: "Claw (Clan)", altNames: ["Clan Claw"], tag: "clan-melee-claw", altTags: [], catalog: "clan", sort: "melee, claw, clan", category: "Melee", alternateName: "", damage: 0, notes: "Replaces the hand actuator.", damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 3090, extinct: null, reintroduced: null, battleValue: 0, heat: 0, heatAero: 0, weight: 0, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "b", book: "TO:AUE", page: 101, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, variableSize: true, variableFormula: "claw", isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Partial Wing (Clan)", altNames: ["Clan Partial Wing"], tag: "clan-partial-wing", altTags: [], catalog: "clan", sort: "equipment, partial wing, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "3 slots in each side torso. Standard atmosphere: +2 jump MP (up to 55 t) or +1, and +3 heat capacity; wing jump MP generates no heat.", damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 3085, extinct: null, reintroduced: null, prototype: 3067, battleValue: 0, heat: 0, heatAero: 0, weight: 0, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 6, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TO:AUE", page: 105, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, variableSize: true, variableFormula: "partial-wing-clan", spreadSlots: true },
    { isEquipment: true, isAmmo: false, name: "Actuator Enhancement System (Arm, Clan)", altNames: ["Clan AES (Arm)"], tag: "clan-aes-arm", altTags: [], catalog: "clan", sort: "equipment, aes, arm, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "One per arm; not with MASC or TSM.", damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 3108, extinct: null, reintroduced: null, prototype: 3070, battleValue: 0, heat: 0, heatAero: 0, weight: 0, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "e", book: "TO:AUE", page: 91, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, variableSize: true, variableFormula: "aes-arm" },
    { isEquipment: true, isAmmo: false, name: "Actuator Enhancement System (Leg, Clan)", altNames: ["Clan AES (Leg)"], tag: "clan-aes-leg", altTags: [], catalog: "clan", sort: "equipment, aes, leg, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "One in every leg; not with MASC or TSM.", damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 3108, extinct: null, reintroduced: null, prototype: 3070, battleValue: 0, heat: 0, heatAero: 0, weight: 0, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "e", book: "TO:AUE", page: 91, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, variableSize: true, variableFormula: "aes-leg" },
    { isEquipment: true, isAmmo: false, name: "Talons (Clan)", altNames: ["Talons"], tag: "clan-talons", altTags: [], catalog: "clan", sort: "melee, talons, clan", category: "Melee", alternateName: "", damage: 0, notes: "Fills the foot slots of every leg; kicks deal 50% more damage.", damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 3087, extinct: null, reintroduced: null, prototype: 3072, battleValue: 0, heat: 0, heatAero: 0, weight: 0, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "e", book: "TO:AUE", page: 103, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, variableSize: true, variableFormula: "talons", spreadSlots: true, isMelee: true },
    { isEquipment: true, isAmmo: false, name: "Nova CEWS (Clan)", altNames: ["Nova Combined Electronic Warfare System"], tag: "clan-nova-cews", altTags: [], catalog: "clan", sort: "equipment, ecm, nova, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "", damageAero: 0, accuracyModifier: 0, cbills: 1110000, introduced: null, extinct: 3085, reintroduced: null, prototype: 3065, battleValue: 68, battleValueDefensive: true, heat: 2, heatAero: 0, weight: 1.5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "IO:AE", page: 60, alphaStrike: { specialAbility: ["NOVA"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "ProtoMech Myomer Booster", altNames: ["Myomer Booster"], tag: "clan-protomech-myomer-booster", altTags: [], catalog: "clan", sort: "equipment, myomer booster, protomech, clan", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "ProtoMech only. Weighs 25 kg per ProtoMech ton, one per ProtoMech, uses no slots and is not in the inventory (TM p.85). Cost 1,000 x engine rating x booster tons (TM p.279). Rules TW p.137. BV unresolved.", damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 3068, extinct: null, reintroduced: null, prototype: 3066, battleValue: 0, heat: 0, heatAero: 0, weight: 0, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: -1, protomech: 1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "f", book: "TM", page: 232, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] } },
    { isEquipment: true, isAmmo: false, name: "Laser Insulator (Clan)", altNames: [], tag: "clan-laser-insulator", altTags: ["laser-insulator"], sort: "equipment, laser insulator", category: "Miscellaneous Equipment", alternateName: "", damage: 0, notes: "Experimental: mounted with a laser, reduces its heat.", damageAero: 0, accuracyModifier: 0, cbills: 3000, introduced: null, extinct: null, reintroduced: null, prototype: 2575, battleValue: 0, heat: 0, heatAero: 0, weight: 0.5, range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 }, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "e", book: "TO:AUE", page: 134, alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] }, catalog: "clan" },
    {
        isAmmo: false,
        isEquipment: true,
        isModularArmor: true,
        name: "Modular Armor (Clan)",
        tag: "clan-modular-armor",
        altNames: ["Modular Armor Pack (Clan)"],
        sort: "armor, modular",
        category: "Miscellaneous Equipment",
        notes: "One pack per location. Protects its mounted location with 10 armor points before standard armor; torso packs protect only the selected facing.",
        cbills: 10000,
        prototype: 3074,
        introduced: 3096,
        extinct: null,
        reintroduced: null,
        battleValue: 0,
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [],
        techRating: "e",
        book: "TO:AUE",
        page: 93,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] },
        additionalArmor: 10,
        currentAdditionalArmor: 10,
        catalog: "clan"
    },
];
