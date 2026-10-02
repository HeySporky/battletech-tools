import { ISupportVehicleArmor } from "./data-interfaces";

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
 * Support Vehicle armor by Barrier Armor Rating (TechManual p.206; weight table p.134; cost p.280).
 * Weight is in kilograms per armor point and depends on the armor's Tech Rating.
 * Dates follow the IO:AE advancement table (p.29); Pre-Spaceflight is stored as 1950 and
 * Early Spaceflight as 2100.
 */
export const supportVehicleArmor: ISupportVehicleArmor[] = [
    { name: "Support Vehicle Armor (BAR 2)", tag: "sv-bar-2", bar: 2, kgPerPoint: { a: 40, b: 25, c: 16, d: 13, e: 12, f: 11 }, armoredChassisRatings: [], ferroFibrousSlotRatings: [], costPerPoint: 50, techRating: "a", availability: "A-A-A-A", prototype: 1950, introduced: 1950, extinct: null, reintroduced: null, book: "TM", page: 206, notes: "Always available." },
    { name: "Support Vehicle Armor (BAR 3)", tag: "sv-bar-3", bar: 3, kgPerPoint: { a: 60, b: 38, c: 24, d: 19, e: 17, f: 16 }, armoredChassisRatings: ["a"], ferroFibrousSlotRatings: [], costPerPoint: 100, techRating: "a", availability: "A-A-A-A", prototype: 1950, introduced: 1950, extinct: null, reintroduced: null, book: "TM", page: 206, notes: "Always available. At Tech Rating A the Armored chassis modification is required." },
    { name: "Support Vehicle Armor (BAR 4)", tag: "sv-bar-4", bar: 4, kgPerPoint: { a: null, b: 50, c: 32, d: 26, e: 23, f: 21 }, armoredChassisRatings: [], ferroFibrousSlotRatings: [], costPerPoint: 150, techRating: "b", availability: "B-B-A-A", prototype: 1950, introduced: 1950, extinct: null, reintroduced: null, book: "TM", page: 206, notes: "Always available." },
    { name: "Support Vehicle Armor (BAR 5)", tag: "sv-bar-5", bar: 5, kgPerPoint: { a: null, b: 63, c: 40, d: 32, e: 28, f: 26 }, armoredChassisRatings: ["b"], ferroFibrousSlotRatings: [], costPerPoint: 200, techRating: "b", availability: "B-B-B-A", prototype: 2100, introduced: 2100, extinct: null, reintroduced: null, book: "TM", page: 206, notes: "Always available. At Tech Rating B the Armored chassis modification is required." },
    { name: "Support Vehicle Armor (BAR 6)", tag: "sv-bar-6", bar: 6, kgPerPoint: { a: null, b: null, c: 48, d: 38, e: 34, f: 32 }, armoredChassisRatings: [], ferroFibrousSlotRatings: [], costPerPoint: 250, techRating: "c", availability: "C-B-B-A", prototype: 2100, introduced: 2100, extinct: null, reintroduced: null, book: "TM", page: 206, notes: "Always available." },
    { name: "Support Vehicle Armor (BAR 7)", tag: "sv-bar-7", bar: 7, kgPerPoint: { a: null, b: null, c: 56, d: 45, e: 40, f: 37 }, armoredChassisRatings: ["c"], ferroFibrousSlotRatings: [], costPerPoint: 300, techRating: "c", availability: "C-B-B-B", prototype: 2250, introduced: 2300, extinct: null, reintroduced: null, book: "TM", page: 206, notes: "At Tech Rating C the Armored chassis modification is required." },
    { name: "Support Vehicle Armor (BAR 8)", tag: "sv-bar-8", bar: 8, kgPerPoint: { a: null, b: null, c: null, d: 51, e: 45, f: 42 }, armoredChassisRatings: ["d"], ferroFibrousSlotRatings: [], costPerPoint: 400, techRating: "d", availability: "C-C-B-B", prototype: 2425, introduced: 2435, extinct: null, reintroduced: null, book: "TM", page: 206, notes: "At Tech Rating D the Armored chassis modification is required." },
    { name: "Support Vehicle Armor (BAR 9)", tag: "sv-bar-9", bar: 9, kgPerPoint: { a: null, b: null, c: null, d: 57, e: 51, f: 47 }, armoredChassisRatings: ["d", "e"], ferroFibrousSlotRatings: [], costPerPoint: 500, techRating: "d", availability: "C-C-C-B", prototype: 2440, introduced: 2450, extinct: null, reintroduced: null, book: "TM", page: 206, notes: "At Tech Ratings D and E the Armored chassis modification is required." },
    { name: "Support Vehicle Armor (BAR 10)", tag: "sv-bar-10", bar: 10, kgPerPoint: { a: null, b: null, c: null, d: 63, e: 56, f: 52 }, armoredChassisRatings: ["d", "e", "f"], ferroFibrousSlotRatings: ["e", "f"], costPerPoint: 625, techRating: "d", availability: "D-D-D-C", prototype: 2460, introduced: 2470, extinct: null, reintroduced: null, book: "TM", page: 206, notes: "The equivalent of Combat Vehicle armor. The Armored chassis modification is always required. At Tech Ratings E and F it takes the slot space of Inner Sphere and Clan Ferro-Fibrous armor respectively." },
];

/**
 * Weight of `points` of armor at a Barrier Armor Rating and armor Tech Rating: kilograms, and tons
 * rounded up to the half ton (Support Vehicles of 5 tons and over; Small Support Vehicles use the
 * kilograms unrounded). Null when that rating cannot produce the armor.
 */
export function getSupportVehicleArmorWeight(bar: number, techRating: "a" | "b" | "c" | "d" | "e" | "f", points: number): { kg: number; tons: number } | null {
    const kgPerPoint = supportVehicleArmor.find(armor => armor.bar === bar)?.kgPerPoint[techRating];
    if (!kgPerPoint) return null;
    const kg = kgPerPoint * points;
    return { kg, tons: Math.ceil(kg / 500) / 2 };
}
