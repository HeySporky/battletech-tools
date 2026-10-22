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

import { ITechDates } from "./data-interfaces";
import { roundUpHalfTon } from "./variable-equipment";

/**
 * Combat Vehicle chassis modifications (TO:AUE pp.114-115; construction rules p.114, costs p.219, BV p.193). All are
 * Advanced, both technology bases, introduced circa 2470. Support Vehicles have their own list
 * (support-vehicle-construction.ts).
 */
export type CombatVehicleChassisModificationTag = "flotation-hull" | "limited-amphibious" | "fully-amphibious" | "dune-buggy" | "environmental-sealing" | "armored-motive";

export interface ICombatVehicleChassisModification {
    tag: CombatVehicleChassisModificationTag;
    name: string;
    /** Motive types that may take it. */
    motives: string[];
    /** Weight as the vehicle's tonnage divided by this, rounded up to the half ton; absent = no weight. */
    weightDivisor?: number;
    /** Weight as the vehicle's tonnage times this fraction, rounded up to the half ton; used when there is no weightDivisor. */
    weightFraction?: { is: number; clan: number };
    /** Offered only when these dates allow it in the vehicle's era and rules level (Experimental allows the prototype year). */
    dates?: { is: ITechDates; clan: ITechDates };
    /** C-bills added before the tonnage cost multiplier. */
    cost?: (tonnage: number, weight: number) => number;
    /** Multiplier on the vehicle's final cost ("1.25xTC"). */
    totalCostMultiplier?: number;
    /** Added to the motive type's defensive BV modifier (TO:AUE p.193). */
    bvTypeModifier: number;
    excludes?: CombatVehicleChassisModificationTag[];
    techRating: string;
    availability: string;
    introduced: number;
    rulesLevel: number;
    book: string;
    page: number;
    description: string;
}

export const COMBAT_VEHICLE_CHASSIS_MODIFICATIONS: ICombatVehicleChassisModification[] = [
    {
        tag: "flotation-hull", name: "Flotation Hull", motives: ["hover", "vtol", "wige"], totalCostMultiplier: 1.25, bvTypeModifier: 0.1,
        techRating: "b", availability: "B-B-B", introduced: 2470, rulesLevel: 3, book: "TO:AUE", page: 114,
        description: "Lands on and takes off from water as if it were clear terrain; afloat it is a displacement-hull naval vessel and sinks only if a non-turret location is breached.",
    },
    {
        tag: "limited-amphibious", name: "Limited Amphibious", motives: ["wheeled", "tracked"], weightDivisor: 25, cost: (_tonnage, weight) => 10000 * weight, bvTypeModifier: 0.1,
        excludes: ["fully-amphibious"], techRating: "b", availability: "B-B-B", introduced: 2470, rulesLevel: 3, book: "TO:AUE", page: 114,
        description: "Crosses water of any depth at 2 MP a hex, at most 2 MP afloat, always Flanking; enters and leaves water only from an adjacent hex.",
    },
    {
        tag: "fully-amphibious", name: "Fully Amphibious", motives: ["wheeled", "tracked"], weightDivisor: 10, cost: (_tonnage, weight) => 10000 * weight, bvTypeModifier: 0.2,
        excludes: ["limited-amphibious"], techRating: "b", availability: "B-B-B", introduced: 2470, rulesLevel: 3, book: "TO:AUE", page: 115,
        description: "Keeps its full Cruising and Flanking MP on water, at 2 MP a hex of any depth.",
    },
    {
        tag: "dune-buggy", name: "Dune Buggy", motives: ["wheeled"], cost: (tonnage) => 10 * tonnage * tonnage, bvTypeModifier: 0.1,
        techRating: "b", availability: "B-B-B", introduced: 2470, rulesLevel: 3, book: "TO:AUE", page: 115,
        description: "Crosses sand at 1 MP a hex, but loses 1 Cruising MP (Flanking recalculated).",
    },
    {
        // Built into submarines (TO:AUE p.114), so not offered to them.
        tag: "environmental-sealing", name: "Environmental (Vacuum) Sealing", motives: ["tracked", "wheeled", "hover", "vtol", "wige", "naval-surface", "hydrofoil"],
        weightDivisor: 10, totalCostMultiplier: 1.25, bvTypeModifier: 0.1,
        techRating: "b", availability: "C-D-C", introduced: 2470, rulesLevel: 3, book: "TO:AUE", page: 115,
        description: "Works in toxic atmospheres, and in vacuum with a fission, fusion or fuel cell engine; destroyed when a location loses all armor or a hull breach (10+ on 2D6 whenever damaged) occurs.",
    },
    {
        // Prototype-only in both tech bases (TO:AUE p.217: IS 3071P, Clan 3057P); Inner Sphere E/X-X-F, Clan F/X-X-F.
        tag: "armored-motive", name: "Armored Motive System", motives: ["tracked", "wheeled", "hover", "hydrofoil", "naval-surface", "naval-sub", "wige"],
        weightFraction: { is: 0.15, clan: 0.10 }, cost: (_tonnage, weight) => 100000 * weight, bvTypeModifier: 0.1,
        dates: {
            is: { prototype: 3071, introduced: null, extinct: null, reintroduced: null },
            clan: { prototype: 3057, introduced: null, extinct: null, reintroduced: null },
        },
        techRating: "e", availability: "X-X-F", introduced: 3057, rulesLevel: 4, book: "TO:AUE", page: 94,
        description: "Applies an additional -2 to every roll on the Motive System Damage Table (a result of 2 or less is no effect); Inner Sphere 15% of the vehicle's weight, Clan 10% (rating F for Clan), rounded up to the half ton; not pod-mountable (errata v7.0).",
    },
];

export function findCombatVehicleChassisModification(tag: string): ICombatVehicleChassisModification | undefined {
    return COMBAT_VEHICLE_CHASSIS_MODIFICATIONS.find((mod) => mod.tag === tag);
}

/** Weight of a chassis modification on a vehicle of this tonnage (TO:AUE p.114). */
export function getCombatVehicleChassisModificationWeight(mod: ICombatVehicleChassisModification, tonnage: number, techBase: "is" | "clan" = "is"): number {
    if (mod.weightDivisor) return roundUpHalfTon(tonnage / mod.weightDivisor);
    return mod.weightFraction ? roundUpHalfTon(tonnage * mod.weightFraction[techBase]) : 0;
}
