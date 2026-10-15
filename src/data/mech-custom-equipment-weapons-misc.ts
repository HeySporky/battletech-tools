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

export const mechCustomEquipmentMisc: IEquipmentItem[] = [
    {
        name: "Null-Signature System (Fan Design)", tag: "custom-null-signature-system", sort: "null-signature, system", category: "Custom Equipment", notes: "Unverified placeholder for a fan-designed stealth and sensor-disruption system.",
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
        name: "Improved Magnetic Grapples (Custom)", tag: "custom-mech-improved-magnetic-grapples", sort: "equipment, magnetic grapples, improved", category: "Custom Equipment",
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
    }
];