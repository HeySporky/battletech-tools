import { IAerospaceArmorType } from "./data-interfaces";

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
 * Armor for fighters, small craft, DropShips (TechManual pp.191-192, standard scale) and for
 * JumpShips, WarShips and space stations (Strategic Operations p.140, capital scale).
 * Points per ton depend on the unit, its tonnage and its tech base, which the 'Mech armor
 * catalog cannot express, so these live in their own catalog. Dates follow IO:AE pp.29-30.
 */

/** DropShip points per ton by hull shape and tonnage band (TM p.192): [clan, is] multiples of the standard figures. */
const dropShipRows = (clan: (number | null)[], is: (number | null)[]) => [
    { unit: "spheroid-dropship" as const, minTons: 200, maxTons: 12499, clan: clan[0], is: is[0] },
    { unit: "aerodyne-dropship" as const, minTons: 200, maxTons: 5999, clan: clan[0], is: is[0] },
    { unit: "spheroid-dropship" as const, minTons: 12500, maxTons: 19999, clan: clan[1], is: is[1] },
    { unit: "aerodyne-dropship" as const, minTons: 6000, maxTons: 9499, clan: clan[1], is: is[1] },
    { unit: "spheroid-dropship" as const, minTons: 20000, maxTons: 34999, clan: clan[2], is: is[2] },
    { unit: "aerodyne-dropship" as const, minTons: 9500, maxTons: 12499, clan: clan[2], is: is[2] },
    { unit: "spheroid-dropship" as const, minTons: 35000, maxTons: 49999, clan: clan[3], is: is[3] },
    { unit: "aerodyne-dropship" as const, minTons: 12500, maxTons: 17499, clan: clan[3], is: is[3] },
    { unit: "spheroid-dropship" as const, minTons: 50000, maxTons: 64999, clan: clan[4], is: is[4] },
    { unit: "aerodyne-dropship" as const, minTons: 17500, maxTons: 24999, clan: clan[4], is: is[4] },
    { unit: "spheroid-dropship" as const, minTons: 65000, maxTons: 100000, clan: clan[5], is: is[5] },
    { unit: "aerodyne-dropship" as const, minTons: 25000, maxTons: 35000, clan: clan[5], is: is[5] },
];

const none: null[] = [null, null, null, null, null, null];

/** JumpShip, WarShip and space station points per ton by tonnage band (SO p.140): capital-scale points. */
const advancedRows = (is: number[], clan: number[]) => [
    { unit: "advanced-aerospace" as const, minTons: 2000, maxTons: 149999, clan: clan[0], is: is[0] },
    { unit: "advanced-aerospace" as const, minTons: 150000, maxTons: 249999, clan: clan[1], is: is[1] },
    { unit: "advanced-aerospace" as const, minTons: 250000, maxTons: 2500000, clan: clan[2], is: is[2] },
];

export const aerospaceArmorTypes: IAerospaceArmorType[] = [
    {
        name: "Standard Armor (Aerospace)",
        tag: "aerospace-standard",
        techBase: "both",
        scale: "standard",
        pointsPerTon: [
            { unit: "conventional-fighter", minTons: null, maxTons: null, clan: 16, is: 16 },
            { unit: "aerospace-fighter", minTons: null, maxTons: null, clan: 16, is: 16 },
            { unit: "small-craft", minTons: null, maxTons: null, clan: 20, is: 16 },
            ...dropShipRows([20, 17, 14, 12, 10, 7], [16, 14, 12, 10, 8, 6]),
        ],
        fighterSlots: { is: 0, clan: 0, placement: "" },
        costMultiplier: 10000,
        techRating: "d",
        availability: "C-C-C-B",
        prototype: 2460,
        introduced: 2470,
        extinct: null,
        reintroduced: null,
        book: "TM",
        page: 205,
        notes: "Points per ton TM p.192; cost TM p.283 (10,000 C-bills per ton). Small craft also get free armor equal to their Structural Integrity on each facing.",
    },
    {
        name: "Light Ferro-Aluminum",
        tag: "light-ferro-aluminum",
        techBase: "is",
        scale: "standard",
        pointsPerTon: [
            { unit: "conventional-fighter", minTons: null, maxTons: null, clan: null, is: 16.96 },
            { unit: "aerospace-fighter", minTons: null, maxTons: null, clan: null, is: 16.96 },
            { unit: "small-craft", minTons: null, maxTons: null, clan: null, is: 16.96 },
            ...dropShipRows(none, [16.96, 14.84, 12.72, 10.6, 8.48, 6.36]),
        ],
        fighterSlots: { is: 1, clan: null, placement: "Aft" },
        costMultiplier: 15000,
        techRating: "e",
        availability: "X-X-E-D",
        prototype: 3055,
        introduced: 3067,
        extinct: null,
        reintroduced: null,
        book: "TM",
        page: 205,
        notes: "The aerospace form of Light Ferro-Fibrous armor. Points per ton and fighter slots TM p.192; cost TM p.283.",
    },
    {
        name: "Ferro-Aluminum",
        tag: "ferro-aluminum",
        techBase: "is",
        scale: "standard",
        pointsPerTon: [
            { unit: "conventional-fighter", minTons: null, maxTons: null, clan: null, is: 17.92 },
            { unit: "aerospace-fighter", minTons: null, maxTons: null, clan: null, is: 17.92 },
            { unit: "small-craft", minTons: null, maxTons: null, clan: null, is: 17.92 },
            ...dropShipRows(none, [17.92, 15.68, 13.44, 11.2, 8.96, 6.72]),
        ],
        fighterSlots: { is: 2, clan: null, placement: "1 each Wing" },
        costMultiplier: 20000,
        techRating: "e",
        availability: "D-F-D-C",
        prototype: 2557,
        introduced: 2571,
        extinct: 2810,
        reintroduced: 3040,
        book: "TM",
        page: 205,
        notes: "The aerospace form of Inner Sphere Ferro-Fibrous armor. Points per ton and fighter slots TM p.192; cost TM p.283.",
    },
    {
        name: "Ferro-Aluminum (Clan)",
        tag: "clan-ferro-aluminum",
        techBase: "clan",
        scale: "standard",
        pointsPerTon: [
            { unit: "conventional-fighter", minTons: null, maxTons: null, clan: 19.2, is: null },
            { unit: "aerospace-fighter", minTons: null, maxTons: null, clan: 19.2, is: null },
            { unit: "small-craft", minTons: null, maxTons: null, clan: 24, is: null },
            ...dropShipRows([24, 20.4, 16.8, 14.4, 12, 8.4], none),
        ],
        fighterSlots: { is: null, clan: 2, placement: "1 each Wing" },
        costMultiplier: 20000,
        techRating: "f",
        availability: "X-E-D-C",
        prototype: 2820,
        introduced: 2825,
        extinct: null,
        reintroduced: null,
        book: "TM",
        page: 205,
        notes: "The aerospace form of Clan Ferro-Fibrous armor. Points per ton and fighter slots TM p.192; cost TM p.283.",
    },
    {
        name: "Heavy Ferro-Aluminum",
        tag: "heavy-ferro-aluminum",
        techBase: "is",
        scale: "standard",
        pointsPerTon: [
            { unit: "conventional-fighter", minTons: null, maxTons: null, clan: null, is: 19.84 },
            { unit: "aerospace-fighter", minTons: null, maxTons: null, clan: null, is: 19.84 },
            { unit: "small-craft", minTons: null, maxTons: null, clan: null, is: 19.84 },
            ...dropShipRows(none, [19.84, 17.36, 14.88, 12.4, 9.92, 7.44]),
        ],
        fighterSlots: { is: 4, clan: null, placement: "1 each Arc" },
        costMultiplier: 25000,
        techRating: "e",
        availability: "X-X-E-D",
        prototype: 3056,
        introduced: 3069,
        extinct: null,
        reintroduced: null,
        book: "TM",
        page: 205,
        notes: "The aerospace form of Heavy Ferro-Fibrous armor. Points per ton and fighter slots TM p.192; cost TM p.283.",
    },
    {
        name: "Primitive Aerospace Fighter Armor",
        tag: "primitive-aerospace-fighter",
        techBase: "is",
        scale: "standard",
        pointsPerTon: [
            { unit: "aerospace-fighter", minTons: null, maxTons: null, clan: null, is: 16 * 0.67 },
        ],
        fighterSlots: { is: 0, clan: null, placement: "" },
        costMultiplier: 5000,
        techRating: "c",
        availability: "B-C-B-B",
        prototype: 2100,
        introduced: 2300,
        extinct: null,
        reintroduced: null,
        book: "IO:AE",
        page: 119,
        notes: "The only armor a Primitive aerospace fighter may use: \"identical to that used by Primitive BattleMechs\", BAR 10, 16 x 0.67 points per ton rounded down; at most tonnage x 8 points. Cost IO:AE pp.181, 215. Early Spaceflight is stored as 2100.",
    },
    {
        name: "Standard Armor (Capital)",
        tag: "capital-standard",
        techBase: "both",
        scale: "capital",
        pointsPerTon: advancedRows([0.8, 0.6, 0.4], [1.0, 0.7, 0.5]),
        fighterSlots: null,
        costMultiplier: 10000,
        techRating: "d",
        availability: "B-B-B",
        prototype: null,
        introduced: 2300,
        extinct: null,
        reintroduced: null,
        book: "SO",
        page: 140,
        notes: "Capital-scale points per ton for JumpShips, WarShips and space stations; each point equals 10 standard-scale points. Cost, rating, availability and year from the SO cost table (p.146), which gives three availability eras.",
    },
    {
        name: "Improved Ferro-Aluminum",
        tag: "improved-ferro-aluminum",
        techBase: "both",
        scale: "capital",
        pointsPerTon: advancedRows([1.0, 0.8, 0.6], [1.2, 0.9, 0.7]),
        fighterSlots: null,
        costMultiplier: 50000,
        techRating: "e",
        availability: "E-X-E-D",
        prototype: 2500,
        introduced: 2520,
        extinct: 2950,
        reintroduced: 3052,
        book: "SO",
        page: 140,
        notes: "Capital-scale armor for JumpShips, WarShips and space stations. Cost SO p.146; dates IO:AE p.30 (the SO cost table prints 2350).",
    },
    {
        name: "Ferro-Carbide",
        tag: "ferro-carbide",
        techBase: "both",
        scale: "capital",
        pointsPerTon: advancedRows([1.2, 1.0, 0.8], [1.4, 1.1, 0.9]),
        fighterSlots: null,
        costMultiplier: 75000,
        techRating: "e",
        availability: "E-F-E-D",
        prototype: 2550,
        introduced: 2570,
        extinct: 2950,
        reintroduced: 3055,
        book: "SO",
        page: 140,
        notes: "Capital-scale armor for JumpShips, WarShips and space stations. Cost SO p.146; dates IO:AE p.30 (the SO cost table prints 2370).",
    },
    {
        name: "Lamellor Ferro-Carbide",
        tag: "lamellor-ferro-carbide",
        techBase: "both",
        scale: "capital",
        pointsPerTon: advancedRows([1.4, 1.2, 1.0], [1.6, 1.3, 1.1]),
        fighterSlots: null,
        costMultiplier: 100000,
        techRating: "e",
        availability: "E-F-E-D",
        prototype: 2600,
        introduced: 2615,
        extinct: 2950,
        reintroduced: 3055,
        book: "SO",
        page: 140,
        notes: "Capital-scale armor for JumpShips, WarShips and space stations. Cost SO p.146; dates IO:AE p.30.",
    },
];

/**
 * Armor points per ton for a unit, or null when the armor is not available to that unit or tech base.
 * `tons` is needed for DropShips and for JumpShips, WarShips and stations ("advanced-aerospace").
 */
export function getAerospaceArmorPointsPerTon(
    armorTag: string,
    unit: IAerospaceArmorType["pointsPerTon"][number]["unit"],
    techBase: "is" | "clan",
    tons?: number,
): number | null {
    const armor = aerospaceArmorTypes.find(item => item.tag === armorTag);
    if (!armor) return null;
    const row = armor.pointsPerTon.find(entry => entry.unit === unit
        && (entry.minTons === null || (tons !== undefined && tons >= entry.minTons))
        && (entry.maxTons === null || (tons !== undefined && tons <= entry.maxTons)));
    return row ? row[techBase] : null;
}
