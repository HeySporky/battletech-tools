import { IBattleArmorArmorType } from "./data-interfaces";

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
 * Battle armor armor (TechManual pp.169, 252-253, cost p.281, BV p.316; TO:AUE pp.93-94 and 225 for
 * Laser Reflective and Reactive armor). Weight is in kilograms per armor point and differs by tech
 * base; `null` means that tech base cannot use the armor. Dates follow IO:AE p.30.
 */
export const battleArmorArmorTypes: IBattleArmorArmorType[] = [
    { name: "Standard (Basic)", tag: "ba-standard", techBase: "both", kgPerPoint: { clan: 25, is: 50 }, slots: 0, special: "None", defensiveFactorBonus: 0, costPerPoint: 10000, techRating: "e", availability: "F-F-E-D", prototype: 2680, introduced: 2868, extinct: null, reintroduced: null, book: "TM", page: 252, notes: "Production date is the Clan one (Clan Wolf); Inner Sphere prototype 3050 (IO:AE p.30)." },
    { name: "Standard (Advanced)", tag: "ba-standard-advanced", techBase: "is", kgPerPoint: { clan: null, is: 40 }, slots: 5, special: "None", defensiveFactorBonus: 0, costPerPoint: 12500, techRating: "e", availability: "X-X-F-E", prototype: null, introduced: 3057, extinct: null, reintroduced: null, book: "TM", page: 252, notes: "" },
    { name: "Standard (Prototype)", tag: "ba-standard-prototype", techBase: "is", kgPerPoint: { clan: null, is: 100 }, slots: 4, special: "None", defensiveFactorBonus: 0, costPerPoint: 10000, techRating: "e", availability: "X-X-F", prototype: 3050, introduced: null, extinct: null, reintroduced: null, book: "TM", page: 252, notes: "The Inner Sphere prototype of Standard armor (\"IS Prototype: 3050\", IO:AE p.30), which has no row of its own in the advancement table; availability is the TM cost table's (p.281)." },
    { name: "Stealth (Basic)", tag: "ba-stealth-basic", techBase: "both", kgPerPoint: { clan: 30, is: 55 }, slots: 3, special: "Range Modifiers (0/+1/+2); Invisible to Probes", defensiveFactorBonus: 0.2, costPerPoint: 12000, techRating: "e", availability: "F-F-E-D", prototype: 2700, introduced: 2710, extinct: 2770, reintroduced: 3052, book: "TM", page: 252, notes: "TM gives it to both tech bases (p.253); IO:AE p.30 lists it as Inner Sphere." },
    { name: "Stealth (Improved)", tag: "ba-stealth-improved", techBase: "both", kgPerPoint: { clan: 35, is: 60 }, slots: 5, special: "Range Modifiers (+1/+2/+3); Invisible to Probes", defensiveFactorBonus: 0.3, costPerPoint: 20000, techRating: "e", availability: "X-X-F-E", prototype: 3055, introduced: 3057, extinct: null, reintroduced: null, clanDates: { introduced: 3058, extinct: null, reintroduced: null }, book: "TM", page: 252, notes: "" },
    { name: "Stealth (Prototype)", tag: "ba-stealth-prototype", techBase: "is", kgPerPoint: { clan: null, is: 100 }, slots: 4, special: "Range Modifiers (0/+1/+2); Invisible to Probes", defensiveFactorBonus: 0.2, costPerPoint: 50000, techRating: "e", availability: "X-X-F-X", prototype: 3050, introduced: 3052, extinct: 3055, reintroduced: null, book: "TM", page: 252, notes: "" },
    { name: "Stealth (Standard)", tag: "ba-stealth-standard", techBase: "both", kgPerPoint: { clan: 35, is: 60 }, slots: 4, special: "Range Modifiers (+1/+1/+2); Invisible to Probes", defensiveFactorBonus: 0.2, costPerPoint: 15000, techRating: "e", availability: "F-X-E-D", prototype: 2710, introduced: 2720, extinct: 2770, reintroduced: 3053, book: "TM", page: 252, notes: "" },
    { name: "Fire Resistant", tag: "ba-fire-resistant", techBase: "clan", kgPerPoint: { clan: 30, is: null }, slots: 5, special: "Suit ignores damage by heat-causing weapons", defensiveFactorBonus: 0, costPerPoint: 10000, techRating: "f", availability: "X-X-F-E", prototype: 3052, introduced: 3058, extinct: null, reintroduced: null, book: "TM", page: 253, notes: "Battle Value: see TM p.310." },
    { name: "Mimetic", tag: "ba-mimetic", techBase: "is", kgPerPoint: { clan: null, is: 50 }, slots: 7, special: "Movement Modifiers (+3/+2/+1/0)", defensiveFactorBonus: 0.3, costPerPoint: 15000, techRating: "e", availability: "X-X-F-E", prototype: 3058, introduced: 3061, extinct: null, reintroduced: null, book: "TM", page: 253, notes: "" },
    { name: "Laser Reflective (Reflec/Glazed)", tag: "ba-laser-reflective", techBase: "both", kgPerPoint: { clan: 30, is: 55 }, slots: 7, special: "Half damage (round down) from energy weapons", defensiveFactorBonus: 0, costPerPoint: 37000, techRating: "f", availability: "X-X-F-E", prototype: 3074, introduced: 3089, extinct: null, reintroduced: null, book: "TO:AUE", page: 93, notes: "\"Battle armor-grade Laser Reflective Armor conveys all of the bonuses but features none of the drawbacks.\" Battle Value as Fire Resistant armor (TO:AUE p.192). Weight and slots TO:AUE p.93; cost p.225." },
    { name: "Reactive (Blazer)", tag: "ba-reactive", techBase: "both", kgPerPoint: { clan: 35, is: 60 }, slots: 7, special: "Half damage (round down) from missiles, mortars, and artillery", defensiveFactorBonus: 0, costPerPoint: 37000, techRating: "f", availability: "X-X-F-E", prototype: 3075, introduced: 3093, extinct: null, reintroduced: null, book: "TO:AUE", page: 94, notes: "\"Battle armor-grade Reactive Armor conveys all of the bonuses but features none of the drawbacks.\" Battle Value as Fire Resistant armor (TO:AUE p.192). Weight and slots TO:AUE p.93; cost p.225." },
];

/** Most armor points a suit may carry, by weight class (TM p.169). */
export const battleArmorMaximumArmor: Record<"pa-l" | "light" | "medium" | "heavy" | "assault", number> = {
    "pa-l": 2,
    light: 6,
    medium: 10,
    heavy: 14,
    assault: 18,
};
