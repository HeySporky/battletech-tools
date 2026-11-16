import { IEquipmentItem } from "./data-interfaces";
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

export const miscCustom: IEquipmentItem[] = [
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
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike effect"] }
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
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike effect"] }
    },
    {
        name: "Null-Signature System (Fan Design)", tag: "custom-null-signature-system", techBase: "universal", sort: "null-signature, system", category: "Custom Equipment", notes: "Unverified placeholder for a fan-designed stealth and sensor-disruption system.",
        damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 0, introduced: 2630, prototype: 2615, extinct: 2790, reintroduced: 3110, battleValue: 0, heat: 0, heatAero: 0, weight: 2, // Dates of the canon Null-Signature System (IO p.45).
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "x", book: "Fan Design", page: 0, rulesLevel: 6,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
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
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike effect outside hull scenarios"] }
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
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
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
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
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
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
    },
    {
        name: "Pile Bunker", tag: "custom-pile-bunker", techBase: "universal", catalog: "custom", sort: "equipment, pile bunker", category: "Custom Equipment",
        notes: "Homebrew melee weapon by u/FweeCom (https://www.reddit.com/r/battletech/comments/1dak8pu/homebrew_equipment_pile_bunker/), who calls the numbers tentative. "
            + "An explosive charge drives a spike out at force. Five tons, five slots, 15 damage on a hit, and the target makes a Piloting roll with a +1 modifier. "
            + "It is a little harder to hit with (+1), builds 2 heat from the charge, and fires three times to the ton of ammunition (ammo-custom-pile-bunker-standard); "
            + "a hit on that ammunition does 5 damage a shot. Inspired by: u/FweeCom. "
            + "Not given by the author, so ours: the dates are those of the Heavy-Duty Pile Driver (1950, never extinct), the nearest canon melee tool. "
            + "Cost and Battle Value are not given and stay 0 (unverified), so a 'Mech's Battle Value and cost leave this weapon out.",
        damage: 15, damageAero: 0, accuracyModifier: 1, cbills: 0, introduced: 1950, extinct: null, reintroduced: null,
        battleValue: 0, heat: 2, heatAero: 0, weight: 5,
        range: { min: 0, short: 0, medium: 0, long: 0 }, space: { battlemech: 5, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        ammoTypes: ["ammo-custom-pile-bunker-standard"], shotsPerTon: 3, minAmmoTons: 1, explosive: false, weaponType: [], techRating: "x", book: "Reddit u/FweeCom", page: 0, rulesLevel: 6,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    },
    // The Best of Future Wars (1991) p.28: Power Boosters for the legs and the jump jets (#172).
    ...futureWarsBoosterItems(),
];
