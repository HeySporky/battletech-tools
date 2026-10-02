import { IProtoMechComponent } from "./data-interfaces";

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

/**
 * ProtoMech cockpits, heat sinks, jump jets and internal structures (TechManual pp.82-86, cost p.279;
 * IO:AE pp.59 and 92-95 for the Extended Jump Jet System and Ultraheavy, Quad and Glider ProtoMechs,
 * cost p.215). ProtoMech weights are in kilograms. Dates follow the IO:AE advancement table.
 * ProtoMech armor is in mech-armor-types.ts; the Myomer Booster, Partial Wing and weapons are
 * equipment records.
 */
export const protoMechComponents: IProtoMechComponent[] = [
    { name: "ProtoMech Cockpit", tag: "protomech-cockpit", kind: "cockpit", techBase: "clan", weightKg: 500, minTons: 2, maxTons: 9, cost: { basis: "fixed", value: 500000 }, techRating: "f", availability: "X-X-E-D", prototype: 3055, introduced: 3060, extinct: null, reintroduced: null, book: "TM", page: 85, notes: "\"A ProtoMech's cockpit and control system weighs 500 kilograms\"; it takes no Weapons Inventory slot. Cost TM p.279; dates IO:AE p.33." },
    { name: "Ultraheavy ProtoMech Cockpit", tag: "protomech-ultraheavy-cockpit", kind: "cockpit", techBase: "clan", weightKg: 750, minTons: 10, maxTons: 15, cost: { basis: "fixed", value: 800000 }, techRating: "f", availability: "X-X-D", prototype: null, introduced: 3083, extinct: null, reintroduced: null, book: "IO:AE", page: 95, notes: "\"ProtoMechs over 9 tons must assign 750 kilograms to their cockpit systems\". Cost, rating and year from the IO:AE table (p.215), which gives three availability eras." },
    { name: "ProtoMech Heat Sink", tag: "protomech-heat-sink", kind: "heat-sink", techBase: "clan", weightKg: 250, minTons: 2, maxTons: 15, cost: { basis: "each", value: 2000 }, techRating: "f", availability: "X-X-E-E", prototype: 3055, introduced: 3060, extinct: null, reintroduced: null, book: "TM", page: 86, notes: "Works as a single heat sink; none come free with the engine, and they take no Weapons Inventory slot. There is no ProtoMech double heat sink, and other units cannot use these. Cost TM p.279; dates IO:AE p.36." },
    { name: "ProtoMech Jump Jets", tag: "protomech-jump-jets", kind: "jump-jet", techBase: "clan", weightKg: null, weightKgPerMP: [{ minTons: 2, maxTons: 5, kg: 50 }, { minTons: 6, maxTons: 9, kg: 100 }, { minTons: 10, maxTons: 15, kg: 150 }], minTons: 2, maxTons: 15, cost: { basis: "jump-squared-per-unit-ton", value: 200 }, techRating: "d", availability: "X-X-D-C", prototype: 3055, introduced: 3060, extinct: null, reintroduced: null, book: "TM", page: 84, notes: "Jump MP up to the Walking MP. Ultraheavy ProtoMechs: 150 kg per Jumping MP (IO:AE p.95). Glider ProtoMechs cannot mount jump jets. Cost 200 x (jump jets squared) x tonnage, TM p.279; dates IO:AE p.29." },
    { name: "Extended Jump Jet (XJJ) System", tag: "protomech-extended-jump-jets", kind: "jump-jet", techBase: "clan", jumpAsRun: true, weightKg: null, weightKgPerMP: [{ minTons: 2, maxTons: 5, kg: 100 }, { minTons: 6, maxTons: 9, kg: 200 }, { minTons: 10, maxTons: 15, kg: 300 }], minTons: 2, maxTons: 15, cost: { basis: "jump-squared-per-unit-ton", value: 500 }, techRating: "f", availability: "X-X-F-D", prototype: 3071, introduced: 3075, extinct: null, reintroduced: null, book: "IO:AE", page: 59, notes: "Twice the weight of standard ProtoMech jump jets; \"ProtoMechs may mount as many XJJs as they have Running MP\". Glider ProtoMechs cannot use them. Cost tonnage x 500 x Jump MP squared (IO:AE pp.178, 213)." },
    { name: "ProtoMech Structure", tag: "protomech-structure", kind: "structure", techBase: "clan", weightKg: null, weightFraction: 0.1, minTons: 2, maxTons: 9, cost: { basis: "per-unit-ton", value: 400 }, techRating: "d", availability: "X-X-C-D", prototype: 3055, introduced: 3060, extinct: null, reintroduced: null, book: "TM", page: 82, notes: "10 percent of the ProtoMech's weight (100 kg per ton). Cost TM p.279; dates IO:AE p.42." },
    { name: "Ultraheavy ProtoMech Structure", tag: "protomech-ultraheavy-structure", kind: "structure", techBase: "clan", weightKg: null, weightFraction: 0.1, minTons: 10, maxTons: 15, cost: { basis: "per-unit-ton", value: 400 }, techRating: "d", availability: "X-X-D", prototype: null, introduced: 3083, extinct: null, reintroduced: null, book: "IO:AE", page: 95, notes: "10 to 15 tons; structure table IO:AE p.95. Cost, rating and year from the IO:AE table (p.215)." },
    { name: "Quadruped ProtoMech Structure", tag: "protomech-quad-structure", kind: "structure", techBase: "clan", weightKg: null, weightFraction: 0.1, minTons: 2, maxTons: 15, cost: { basis: "per-unit-ton", value: 500 }, techRating: "d", availability: "X-X-E", prototype: null, introduced: 3083, extinct: null, reintroduced: null, book: "IO:AE", page: 95, notes: "No arms: the Legs (Quad, All) column replaces the arm and leg columns. Cost, rating and year from the IO:AE table (p.215)." },
    { name: "Glider ProtoMech Structure", tag: "protomech-glider-structure", kind: "structure", techBase: "clan", weightKg: null, weightFraction: 0.1, minTons: 2, maxTons: 15, cost: { basis: "per-unit-ton", value: 600 }, techRating: "f", availability: "X-X-E", prototype: null, introduced: 3084, extinct: null, reintroduced: null, book: "IO:AE", page: 95, notes: "Gliders may mount no jump jets, partial wings, UMUs or myomer boosters. Cost, rating and year from the IO:AE table (p.215)." },
];

/** Weight in kilograms of a ProtoMech jump jet system for the given tonnage and Jumping MP; null if not a jump jet or out of range. */
export function getProtoMechJumpJetWeightKg(tag: string, protoMechTons: number, jumpMP: number): number | null {
    const band = protoMechComponents.find(item => item.tag === tag)?.weightKgPerMP
        ?.find(entry => protoMechTons >= entry.minTons && protoMechTons <= entry.maxTons);
    return band ? band.kg * jumpMP : null;
}
