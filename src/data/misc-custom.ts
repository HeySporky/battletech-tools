import { IEquipmentItem } from "./data-interfaces";
import { applyDerivedValues } from "./derived-custom-values";
import { futureWarsBoosterItems } from "./best-of-future-wars-conversions";

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
 * Custom Homebrew miscellaneous equipment. The first two records, the Smoker and the Buckler, are from the fan
 * magazine Future Wars #32 and appear in no published rulebook.
 *
 * The magazine predates BV2 and printed dates, so cost, Battle Value, dates, tech rating and the Smoker's 'Mech slots
 * are taken from the nearest canon device (user ruling 2026-10-21: the tech has always been around and was never
 * lost). Each record's notes name its analog. Vehicle slots are 1 each (the magazine gives the Buckler's "1 Critical").
 */

const derived = (analog: string) => `Not printed in Future Wars #32: cost, Battle Value, dates, tech rating${analog}.`;

export const miscCustom: IEquipmentItem[] = applyDerivedValues([
    // Pleiades Mechworks (u/PleiadesMechworks, r/NormalBattletech, #641).
    {
        name: "Blue Saviour Dispersion Field (Pleiades Mechworks)", altNames: ["Blue Saviour", "Blue Saviour Dispersion Field"], tag: "custom-blue-saviour", techBase: "is", catalog: "custom", sort: "equipment, blue saviour", category: "Miscellaneous Equipment",
        notes: "Custom Homebrew by u/PleiadesMechworks (r/NormalBattletech, Pleiades Mechworks equipment post). 5 tons; one slot in every location, the head included, 'Mechs only. A prototype of 3151 whose development the Pleiades War halted; "
            + "only the Taurian Defense Forces ever held one. Switched on or off in the End Phase of any turn. While it is on: 7 heat a turn; damage from every non-capital energy weapon, incoming and outgoing, is halved (rounded down, at least 1), infantry particle weapons included; "
            + "missiles are treated as if the unit had an anti-missile system (TW p.129); the unit counts as inside a hostile ECM field (TW p.134) that ECCM cannot negate; a Null-Signature System or Stealth Armor gives no stealth benefit; the unit cannot be hidden (TW p.259). "
            + "Autocannon and Gauss are not affected. With Laser Reflective Armor, halve for the Blue Saviour and round down, then halve again for the armor and round down (Heavy PPC 15 to 7 to 3). "
            + "Failure: the first 6 turns it is on in a scenario (not necessarily in a row) are safe; after that, roll 2D6 at the start of each turn it is on against a target of 2 plus 1 for each turn on after the sixth; a roll less than the target fails it for the rest of the scenario. "
            + "A critical hit on one of its slots while it is on explodes for 5 points in that location (CASE contains it as for ammunition) and kills it for the scenario; later hits do nothing. All the post's. "
            + "Ours: 1,000,000 C-bills and tech rating E, as the canon Blue Shield Particle Field Damper (TO:AUE p.108), and its Battle Value rule (0 of its own; +0.2 to the armor and structure type modifiers, TO:AUE pp.192-194); "
            + "Marked explosive, as the canon Blue Shield is: it counts as explosive equipment for Battle Value outside CASE (as ammunition does) and for Alpha Strike's ENE. "
            + "No production date, since it never left prototype. The play effect of its missile and ECM clauses arrives with the electronic warfare rules in roster play.",
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 1000000, prototype: 3151, introduced: null, extinct: null, reintroduced: null, battleValue: 0, heat: 0, heatAero: 0, weight: 5,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 8, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: true, weaponType: [], techRating: "e", book: "https://www.reddit.com/r/NormalBattletech/", page: 0, rulesLevel: 6, isEquipment: true, isAmmo: false,
        spreadLocations: "all", spreadSlots: true,
        rules: "Switch it on or off in the End Phase. On: 7 heat a turn; non-capital energy damage in or out is halved (round down, minimum 1); missiles are treated as met by an anti-missile system; the unit is in a hostile ECM field it cannot negate; no stealth benefit; it cannot be hidden. "
            + "After 6 turns on, roll 2D6 at the start of each turn on: a roll below 2 plus 1 per turn after the sixth fails it for the scenario. A critical hit on one of its slots while on: 5 points of explosion in that location, and it is dead for the scenario.",
        lore: "Pleiades Mechworks' answer to the energy weapon: a field that bleeds the power out of every beam crossing it, friend or foe. The Taurian Defense Forces fielded the prototype in 3151 before the Pleiades War ended the program.",
        alphaStrike: { specialAbility: ["BSF0/0/0/0"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-22, #647): BSF#/#/#/#, the field as one AMS against missiles and a half-effect shield against energy, the nearest canon specials being AMS and ECM (Blue Saviour Dispersion Field: u/PleiadesMechworks). The card replaces the placeholder with the unit's damage with every energy weapon's share halved"] }
    },
    {
        name: "\"Personal\" ECM Suite (Pleiades Mechworks)", altNames: ["Personal ECM Suite", "Personal ECM"], tag: "custom-personal-ecm", techBase: "is", catalog: "custom", sort: "equipment, ecm suite, personal", category: "Miscellaneous Equipment",
        notes: "Custom Homebrew by u/PleiadesMechworks (r/NormalBattletech, Pleiades Mechworks equipment post). The same ECM capabilities as a Guardian ECM Suite, but only in the hex of the unit that mounts it; "
            + "no ECCM mode (advanced rules). It does not count as an ECM suite for equipment that needs one, such as Stealth Armor. 0.5 tons, 1 slot, 200,000 C-bills, defensive Battle Value 20 (all the post's). "
            + "Ours: dated 2720, the year of the Nighthawk battle armor ECM it is built from, and rated E as the Guardian ECM Suite. In roster play it projects its own hex only, and Alpha Strike play treats it as LECM.",
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 200000, introduced: 2720, prototype: 2718, extinct: null, reintroduced: null, battleValue: 20, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 0.5,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "x", book: "https://www.reddit.com/r/NormalBattletech/", page: 0, rulesLevel: 6, isEquipment: true, isAmmo: false,
        rules: "Works as a Guardian ECM Suite, but only in the hex of the unit that mounts it, and with no ECCM mode. It is not an ECM suite for Stealth Armor or anything else that requires one.",
        lore: "Pleiades Mechworks could not yet build battle armor, so it took the ECM suite of the Nighthawk battle armor (2720) and fitted it to a 'Mech to cover its own hex alone.",
        alphaStrike: { specialAbility: ["LECM"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-21): LECM, a 2-inch bubble (its own hex, one hex being 2 inches) with no ECCM mode (ASCE pp.78, 161); the ASC v1.6 battle-armor-only LECM rule is for canon gear"] }
    },
    {
        name: "Smoker", tag: "custom-smoker", techBase: "universal", catalog: "custom", sort: "equipment, smoker", category: "Custom Equipment",
        notes: "Smoke generator. While it runs, the 'Mech leaves a trail of smoke behind and around its movement path, reducing visibility. "
            + "Each ton of fuel (ammo-custom-smoker-fuel) provides 50 hexes of level 2 smoke. It generates three heat points every turn it is used. "
            + "A hit to the fuel results in a small fire, doing 5 points of damage and generating 10 points of heat (Future Wars #32, 'New Toys for Techs', printed p.9). "
            + derived(" and 'Mech slots are the Vehicle Flamer's (TM p.218), a fuel-fed projector of the same weight: 7,500 C-bills, BV 5 (counted as defensive, it lays smoke), introduced 1950, never extinct, tech B, 1 slot"),
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 7500, introduced: 1950, extinct: null, reintroduced: null,
        battleValue: 5, battleValueDefensive: true, heat: 3, heatAero: 3, weight: 0.5,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        ammoTypes: ["ammo-custom-smoker-fuel"], shotsPerTon: 50, minAmmoTons: 1, explosive: false, weaponType: [], techRating: "b", book: "Future Wars #32", page: 9, rulesLevel: 6,
        alphaStrike: { specialAbility: ["SMKT"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-22, #647): SMKT, a smoke lane along the path, the nearest canon rule being the smoke munitions of ASCE p.146; no heat (3 Classic heat is under the threshold for 1 Alpha Strike heat) (Smoker: Future Wars #32)"] }
    },
    {
        name: "Buckler Smoke Dispenser", tag: "custom-buckler-smoke-dispenser", techBase: "universal", catalog: "custom", sort: "equipment, buckler smoke dispenser", category: "Custom Equipment",
        notes: "The BSD smoke screen blocks line of sight to all attacks. 10 shots (integral), no range. Generates smoke as per the rules in the Compendium, in the unit's own hex. "
            + "The unit must remain stationary in the turn it activates, and the smoke takes effect immediately after the Movement Phase in which it is declared. "
            + "It cannot be mounted on VTOLs (Future Wars #32, 'Gargoyle Industries', printed p.17). "
            + derived(" are the Vehicular Grenade Launcher's (TO:AUE p.127), a launcher of the same weight, slots and heat: 10,000 C-bills, BV 15 (counted as defensive), introduced 2100, never extinct, tech C"),
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 10000, introduced: 2100, extinct: null, reintroduced: null,
        battleValue: 15, battleValueDefensive: true, heat: 1, heatAero: 1, weight: 0.5,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        excludedMotives: ["vtol"],
        shotsPerTon: 10, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "Future Wars #32", page: 17, rulesLevel: 6,
        alphaStrike: { specialAbility: ["SMKB10"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-22, #647): SMKB#, ten uses a dispenser, summed over the unit; smoke as the ASCE smoke munitions (p.146), the nearest canon rule (Buckler Smoke Dispenser: Gargoyle Industries, Future Wars #32)"] }
    },
    {
        name: "Null-Signature System (Fan Design)", tag: "custom-null-signature-system", techBase: "universal", sort: "null-signature, system", category: "Custom Equipment", notes: "Unverified placeholder for a fan-designed stealth and sensor-disruption system.",
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 2630, prototype: 2615, extinct: 2790, reintroduced: 3110, battleValue: 0, heat: 0, heatAero: 0, weight: 2, // Dates of the canon Null-Signature System (IO p.45).
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "x", book: "Fan Design", page: 0, rulesLevel: 6,
        alphaStrike: { specialAbility: ["STL"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-21): STL, as the canon Null-Signature System converts (ASC p.126, ASCE p.79); the design itself is unverified"] }
    },
    {
        // Custom Homebrew, designed at the user's request (2026-10-14) as an improved version of the magnetic plates
        // every 'Mech and battle armor suit already has in its soles: "Magnetic plates built into the soles of 'Mech
        // and battle-armor feet enable a landed 'Mech or battle-armor unit to walk" on a hull, to which it is
        // "magnetically affixed" (Explorer Corps (FASA) p.86); see also "magnetic clamps attached to the 'Mech's foot
        // assemblies" (Historical: War of 3039 p.34) and Northwind Highlanders (FASA) p.39. Strategic Operations p.154,
        // a background section, calls magnetic feet "decidedly not standard"; the user ruled them built in.
        // Weight and cost are scaled from the ProtoMech Magnetic Clamp System (1,000 kg for a 10-ton ProtoMech,
        // 25,000 C-bills, IO:AE p.60) and the battle armor magnetic clamps (TM p.259). Dates are those of the Taurian
        // space operations adaptation, which put stronger electromagnets in a suit's soles for hull work (TM p.269).
        name: "Improved Magnetic Grapples (Custom)", tag: "custom-mech-improved-magnetic-grapples", techBase: "universal", sort: "equipment, magnetic grapples, improved", category: "Custom Equipment",
        notes: "One in each foot (each leg location), 1 slot each; works only with a working grapple in every foot. Every 'Mech already walks "
            + "on a hull on the magnetic plates in its soles (Explorer Corps p.86); with these, each roll to stay attached to a hull, station or "
            + "other metal surface in zero or low gravity (the Control Roll of Explorer Corps p.86, or the Piloting Skill Roll after damage of "
            + "Northwind Highlanders p.39) is made at -1. Jumping still leaves the hull. No effect anywhere else.",
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 25000, introduced: 3011, extinct: null, reintroduced: null,
        battleValue: 0, heat: 0, heatAero: 0, weight: 0.5,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        allowedLocations: ["ll", "rl", "cl", "fll", "frl"], onePerLocationGroup: "custom-mech-improved-magnetic-grapples", maxPerUnit: 4,
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "d", book: "Custom", page: 0, rulesLevel: 6,
        alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["No Alpha Strike rule covers hull walking on a hull with magnetic grapples"], noConversion: "no-alpha-strike-rule" }
    },
    // Solaris7 forum ideas (#301, 'LosTech custom weapons', April 2020), each Custom Homebrew on its nearest canon device.
    {
        name: "'Mech Periscope", tag: "custom-mech-periscope", techBase: "universal", catalog: "custom", altNames: ["Mech Periscope", "Sensor Mast"], sort: "equipment, periscope", category: "Custom Equipment",
        notes: "Custom Homebrew from the Solaris7 forum ('LosTech custom weapons', April 2020): Thunder's sensor mast, 1 ton and 1 slot, so a 'Mech can see over "
            + "cover and spot for its own indirect fire; Thunder and Prince preferred it to a drone. Works as the VTOL Mast Mount does (TO:AUE p.162): the 'Mech "
            + "spots and traces line of sight for spotting as if 1 level higher than it stands; it cannot make direct-fire attacks from the mast. One a unit. "
            + "Not printed in the thread: cost, dates, tech rating and BV 0 are the VTOL Mast Mount's.",
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 50000, introduced: 1950, extinct: null, reintroduced: null,
        battleValue: 0, heat: 0, heatAero: 0, weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        maxPerUnit: 1, shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "c", book: "http://solaris7.com/thread/lostech-custom-weapons/", page: 0, rulesLevel: 6,
        alphaStrike: { specialAbility: ["PSC"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-22, #647): PSC, line of sight traced as if 1 inch higher, the nearest canon special being the spotting rules of IF (Periscope: Thunder, Solaris7)"] }
    },
    {
        name: "Chaff Pod 2.0", tag: "custom-chaff-pod-2", techBase: "is", catalog: "custom", sort: "equipment, pod, chaff, 2.0", category: "Custom Equipment",
        notes: "Custom Homebrew by Prince, Solaris7 forum ('LosTech custom weapons', April 2020): the Chaff Pod crossed with the Vehicular Grenade Launcher, a "
            + "single SRM-style tube, still 1 ton. Holds 4 pods (the low end of Prince's 4-5); each does what a Chaff Pod does (light smoke, an ECM bubble and "
            + "anti-missile cover for one turn, TO:AUE p.111) in the unit's hex or one adjacent hex, so it can block line of sight. An unfired pod explodes "
            + "for 3 points a pod if the launcher takes a critical hit. Not printed in the thread: 1 slot, dates and tech rating are the Chaff Pod's; BV 76 and "
            + "8,000 C-bills are its 19 and 2,000 for each of the 4 pods.",
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 8000, prototype: 3069, introduced: 3079, extinct: null, reintroduced: null,
        battleValue: 76, battleValueDefensive: true, heat: 0, heatAero: 0, weight: 1,
        range: { min: 0, short: 1, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: true, weaponType: [], techRating: "c", book: "http://solaris7.com/thread/lostech-custom-weapons/", page: 0, rulesLevel: 6,
        alphaStrike: { specialAbility: ["CHF4"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-21): CHF4, its 4 pods, each the Chaff Pod's cloud (CHF#); it may center the cloud on a point within 2 inches of the unit (one adjacent hex)"] }
    },
    {
        name: "Modular C3", tag: "custom-modular-c3", techBase: "is", catalog: "custom", sort: "equipment, c3, modular", category: "Custom Equipment",
        notes: "Custom Homebrew by Prince, Solaris7 forum ('LosTech custom weapons', April 2020): an outgrowth of the Improved C3 Computer, like an Inner Sphere "
            + "Nova CEWS without its ECM. The 1-ton base, a C3 slave's weight, shares targeting with 1 other unit; each half ton more adds another, up to 11 "
            + "(6 tons, a 12-unit network). Every unit in the network mounts one. Links need line of sight and are named at the start of each Initiative "
            + "Phase, so the network can change who it connects to; otherwise as the Improved C3 Computer (BMR(R) p.135). Network BV applies to the whole force. "
            + "Not printed in the thread: 1 slot a ton or fraction (as a cargo bay), 250,000 C-bills a ton (the C3 slave's), and the Improved C3's dates and tech rating.",
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 250000, prototype: 3052, introduced: 3062, extinct: null, reintroduced: null,
        battleValue: 0, heat: 0, heatAero: 0, weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        variableSize: true, variableFormula: "modular-c3", sizeLabel: "Linked units", sizeMax: 11, size: 1,
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "e", book: "http://solaris7.com/thread/lostech-custom-weapons/", page: 0, rulesLevel: 6,
        alphaStrike: { specialAbility: ["C3I"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-21): C3I, as an outgrowth of the Improved C3 Computer; its network keeps C3I's six-unit limit (ASCE p.82)"] }
    },
    {
        name: "Pile Bunker", tag: "custom-pile-bunker", techBase: "universal", catalog: "custom", sort: "equipment, pile bunker", category: "Custom Equipment",
        notes: "Homebrew melee weapon by u/FweeCom (https://www.reddit.com/r/battletech/comments/1dak8pu/homebrew_equipment_pile_bunker/), who calls the numbers tentative. "
            + "An explosive charge drives a spike out at force. Five tons, five slots, 15 damage on a hit, and the target makes a Piloting roll with a +1 modifier. "
            + "It is a little harder to hit with (+1), builds 2 heat from the charge, and fires three times to the ton of ammunition (ammo-custom-pile-bunker-standard); "
            + "a hit on that ammunition does 5 damage a shot. Inspired by: u/FweeCom. "
            + "Not given by the author, so NGCFells's: the dates are those of the Heavy-Duty Pile Driver (1950, never extinct), the nearest canon melee tool. "
            + "Cost and Battle Value are not given.",
        damage: 15, damageAero: 0, accuracyModifier: 1, cbills: 0, introduced: 1950, extinct: null, reintroduced: null,
        battleValue: 0, heat: 2, heatAero: 0, weight: 5,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 5, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        ammoTypes: ["ammo-custom-pile-bunker-standard"], shotsPerTon: 3, minAmmoTons: 1, explosive: false, weaponType: [], techRating: "x", book: "Reddit u/FweeCom", page: 0, rulesLevel: 6,
        alphaStrike: { specialAbility: ["MEL"], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-22, #647): MEL, as the Companion gives it to canon melee weapons (Lance, Hatchet, Sword), the nearest canon special (Pile Bunker: u/FweeCom)"] }
    },
    // The Best of Future Wars (1991) p.28: Power Boosters for the legs and the jump jets (#172).
    ...futureWarsBoosterItems(),
]);
