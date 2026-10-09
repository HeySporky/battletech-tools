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

import { BattleArmorTechBase } from "./battle-armor-construction";

// The Inner Sphere and Clan Battle Armor Equipment Tables (TechManual pp.346-348), with each item's Battle Value
// (TM pp.317-318) and price (TM pp.296-298). The same item is a separate record for each technology base, since
// weight, range and damage differ.

export type BattleArmorEquipmentKind = "weapon" | "missile" | "equipment";

export interface IBattleArmorEquipment {
    tag: string;
    name: string;
    techBase: BattleArmorTechBase;
    kind: BattleArmorEquipmentKind;
    group: string;
    /** As printed: a number, "1/msl", or "NA". */
    damage: string;
    /** Minimum / short / medium / long, as printed. */
    range: string;
    /** Kilograms; for a missile launcher, the unloaded launcher. */
    kg: number;
    slots: number;
    /** One-shot launcher: the bracketed weight and slots. "always" for rocket launchers and pop-up mines. */
    oneShot?: { kg: number; slots: number } | "always";
    /** Missile tubes, for the per-tube price. */
    tubes?: number;
    /** Kilograms for each shot (missiles) or magazine round, and the shots in the magazine built into the weapon. */
    ammoKg?: number;
    magazine?: number;
    /** Battle Value of the item, of its one-shot version, and of a ton of its ammunition. */
    bv: number;
    bvOneShot?: number;
    ammoBVPerTon?: number;
    /** Adds 1 to the Defensive Battle Rating (improved sensors, active probe, ECM; TM p.310). */
    defensive?: boolean;
    /** Added to the Defensive Factor (camo system, TM p.316). */
    defensiveFactorBonus?: number;
    /** C-bills, or C-bills a tube for a missile launcher; null where the price list has no row. */
    cost: number | null;
    /** Printed "Ref" page of the item's rules in the TechManual. */
    page: number;
    /** At most this many on a suit. */
    max?: number;
    /** May not go in a modular, turret or squad support mount (TM p.171). */
    noMount?: boolean;
    /** Body only (jump booster, partial wing). */
    bodyOnly?: boolean;
    /** The weight is chosen by the designer (mission equipment). */
    variableWeight?: boolean;
    /** Adds this to the suit's Jumping MP. */
    jumpBonus?: number;
    notes?: string;
    /** Book the item's rules are in; the TechManual when absent. */
    book?: "TM" | "TO:AUE";
    /** Rules level: 2 Standard (the default), 3 Advanced, 4 Experimental. */
    rulesLevel?: number;
    /** Added to the Defensive Battle Rating in place of 1 (Angel ECM, TO:AUE p.192). */
    defensiveValue?: number;
    /** Ground MP added: to PA(L), Light and Medium suits, and to Heavy and Assault suits (TO:AUE pp.98-99). */
    groundBonus?: { light: number; heavy: number };
    /** A mechanical jump booster: weighs and costs by the suit's jump jets and gives 1 Jumping MP of its own. */
    mechanicalJumpBooster?: boolean;
    /** Its slots may be spread over the suit like armor slots. */
    spreadSlots?: boolean;
    /** Priced by the MP it provides. */
    costPerMP?: number;
    /** A mine dispenser: its Battle Value is that of a 10-point minefield of the mines it carries (TO:AUE p.195). */
    mineDispenser?: boolean;
    /** Armor types it may not be combined with. */
    barsArmor?: string[];
    /** When the item entered service (IO:AE pp.46-47). */
    dates?: IBattleArmorDates;
    /** Alpha Strike damage of one item at Short, Medium and Long range (ASC pp.105-113). */
    alphaStrike?: IBattleArmorAlphaStrikeDamage;
    /** Alpha Strike special ability the item gives the unit (ASC pp.117-133). */
    alphaStrikeSpecial?: string;
}

export type BattleArmorYear = number | "PS" | "ES";

/** Production date, with the prototype, extinction and recovery dates where the table gives them. */
export interface IBattleArmorDates {
    prototype?: number;
    /** Pre-spaceflight, early spaceflight or a year; null where the table has no row. */
    introduced: BattleArmorYear | null;
    extinct?: number;
    reintroduced?: number;
}

export interface IBattleArmorAlphaStrikeDamage {
    short: number;
    medium: number;
    long: number;
    /** Heat Values at Short, Medium and Long range (Heat-Generating Weaponry Table, ASC p.125). */
    heat?: [number, number, number];
    indirect?: boolean;
    flak?: boolean;
}

/**
 * Is something with these dates in service, or in prototype, at some point between the two years? Unknown dates
 * bar nothing. An item whose production date falls after its extinction date is back in service from then on.
 */
export const isBattleArmorDateAvailable = (dates: IBattleArmorDates | undefined, yearStart: number, yearEnd: number | null): boolean => {
    if (!dates) return true;
    if (dates.introduced === null && dates.prototype === undefined) return true;
    const end = yearEnd ?? Number.POSITIVE_INFINITY;
    const production = typeof dates.introduced === "number" ? dates.introduced : dates.introduced === null ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    const first = Math.min(production, dates.prototype ?? Number.POSITIVE_INFINITY);
    if (first > end) return false;
    if (dates.extinct !== undefined && dates.extinct <= yearStart) {
        const back = dates.reintroduced ?? (production > dates.extinct && Number.isFinite(production) ? production : undefined);
        if (back === undefined || back > end) return false;
    }
    return true;
};

export const formatBattleArmorDates = (dates: IBattleArmorDates | undefined): string => {
    if (!dates || (dates.introduced === null && dates.prototype === undefined)) return "no date listed";
    const parts: string[] = [];
    if (dates.introduced !== null) parts.push(dates.introduced === "PS" ? "pre-spaceflight" : dates.introduced === "ES" ? "early spaceflight" : `${dates.introduced}`);
    if (dates.prototype !== undefined) parts.push(`prototype ${dates.prototype}`);
    if (dates.extinct !== undefined) parts.push(`extinct ${dates.extinct}`);
    if (dates.reintroduced !== undefined) parts.push(`recovered ${dates.reintroduced}`);
    return parts.join(", ");
};

const slug = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const weapon = (techBase: BattleArmorTechBase, group: string, name: string, damage: string, range: string, kg: number, slots: number,
    ammoKg: number, magazine: number, bv: number, cost: number, page: number, notes?: string): IBattleArmorEquipment =>
    ({ tag: `${techBase}-${slug(name)}`, name, techBase, kind: "weapon", group, damage, range, kg, slots, ammoKg, magazine, bv, cost, page, ...(notes ? { notes } : {}) });

const launcher = (techBase: BattleArmorTechBase, family: string, tubes: number, damage: string, range: string, kg: number, osKg: number,
    slots: number, osSlots: number, ammoKg: number, bv: number, bvOneShot: number, ammoBVPerTon: number, cost: number): IBattleArmorEquipment =>
    ({ tag: `${techBase}-${slug(family)}-${tubes}`, name: `${family} ${tubes}`, techBase, kind: "missile", group: "Missile Launchers", damage, range,
        kg, slots, oneShot: { kg: osKg, slots: osSlots }, tubes, ammoKg, bv, bvOneShot, ammoBVPerTon, cost, page: 261 });

const rocket = (tubes: number, kg: number, slots: number, bv: number): IBattleArmorEquipment =>
    ({ tag: `is-rocket-launcher-${tubes}`, name: `Rocket Launcher ${tubes}`, techBase: "is", kind: "missile", group: "Missile Launchers", damage: "1/msl",
        range: "-/3/7/12", kg, slots, oneShot: "always", tubes, bv, cost: 1500, page: 261 });

const item = (techBase: BattleArmorTechBase, name: string, range: string, kg: number, slots: number, cost: number | null, page: number,
    extra: Partial<IBattleArmorEquipment> = {}): IBattleArmorEquipment =>
    ({ tag: `${techBase}-${slug(name)}`, name, techBase, kind: "equipment", group: "Other Equipment", damage: "NA", range, kg, slots, bv: 0, cost, page, ...extra });

const LRM_IS = "6/7/14/21";
const LRM_CLAN = "-/7/14/21";
const SRM = "-/3/6/9";
const MRM = "-/3/8/15";
const ASRM = "-/4/8/12";

const ADVANCED: Partial<IBattleArmorEquipment> = { book: "TO:AUE", rulesLevel: 3 };
const EXPERIMENTAL: Partial<IBattleArmorEquipment> = { book: "TO:AUE", rulesLevel: 4 };
const DROPCHUTE: Partial<IBattleArmorEquipment> = { noMount: true, max: 1 };

/** Items both tables carry with the same figures apart from those passed in. */
const sharedEquipment = (techBase: BattleArmorTechBase): IBattleArmorEquipment[] => [
    item(techBase, "Cutting Torch", "PHYS", 5, 1, 1000, 254),
    item(techBase, "Extended Life Support", "NA", 25, 1, 10000, 254, { noMount: true }),
    item(techBase, "Fuel Tank", "NA", 50, 1, 500, techBase === "is" ? 256 : 255),
    item(techBase, "Jump Booster", "NA", 125, 2, 75000, 257, { noMount: true, bodyOnly: true, max: 1, jumpBonus: 1 }),
    item(techBase, "Laser Microphone", "-/-/-/34", 5, 1, 750, 258),
    item(techBase, "Mission Equipment", "NA", 0, 1, 0, 262, { noMount: true, max: 1, variableWeight: true }),
    item(techBase, "Parafoil", "NA", 35, 1, 3000, 266),
    item(techBase, "Power Pack", "NA", 25, 1, 1000, 268),
    item(techBase, "Remote Sensor Dispenser", "NA", 40, 1, 7500, 268, { magazine: 6 }),
    item(techBase, "Searchlight", "-/-/-/9", 5, 1, 500, 269),
    item(techBase, "Shotgun Microphone", "-/-/-/3", 5, 1, 750, 269),
    item(techBase, "Space Operations Adaptation", "NA", 100, 1, 50000, 269, { noMount: true, max: 1 }),
    // Tactical Operations: Advanced Units & Equipment (pp.224-225; Battle Values pp.192-197)
    { ...weapon(techBase, "Flamers", "Heavy Flamer", "4", "-/2/3/4", 350, 2, 1, 10, 15, 11250, 124), ...ADVANCED },
    item(techBase, "Angel ECM", "-/-/-/2", techBase === "is" ? 250 : 150, 3, 750000, 91, { ...EXPERIMENTAL, defensive: true, defensiveValue: 2 }),
    item(techBase, "Mine Dispenser", "NA", 50, 2, 20000, 137, { ...ADVANCED, magazine: 2, mineDispenser: true, notes: "2 shots of one kind of mine, chosen before play; a minefield it lays does 10 damage. One trooper of the unit may lay mines in a turn, and each trooper may carry a different kind (TO:AUE p.137)." }),
    item(techBase, "DropChute (Standard)", "NA", 200, 0, 1000, 161, { ...ADVANCED, ...DROPCHUTE }),
    item(techBase, "DropChute (Camouflage)", "NA", 200, 0, 3000, 161, { ...ADVANCED, ...DROPCHUTE }),
    item(techBase, "DropChute (Stealth)", "NA", 225, 0, 5000, 161, { ...ADVANCED, ...DROPCHUTE }),
    item(techBase, "DropChute (Standard, Reusable)", "NA", 250, 1, 2000, 161, { ...ADVANCED, ...DROPCHUTE, bodyOnly: true }),
    item(techBase, "DropChute (Camouflage, Reusable)", "NA", 250, 1, 6000, 161, { ...ADVANCED, ...DROPCHUTE, bodyOnly: true }),
    item(techBase, "DropChute (Stealth, Reusable)", "NA", 275, 1, 10000, 161, { ...ADVANCED, ...DROPCHUTE, bodyOnly: true }),
    { ...weapon(techBase, "Special Weapons", "Light TAG", "NA", "-/3/6/9", 35, 1, 0.08, 60, 0, 40000, 270), notes: "Battle Value only when friendly units carry homing or semi-guided munitions (TM p.315)." },
];

const equipmentRows: IBattleArmorEquipment[] = [
    // Inner Sphere Battle Armor Equipment Table (TM pp.346-347)
    weapon("is", "Gauss Weapons", "David Light Gauss Rifle", "1", "-/3/5/8", 100, 1, 0.75, 20, 7, 22500, 255),
    weapon("is", "Gauss Weapons", "King David Light Gauss Rifle", "1", "-/3/6/9", 275, 2, 0.75, 20, 7, 30000, 255),
    weapon("is", "Gauss Weapons", "Magshot Gauss Rifle", "2", "-/3/6/9", 175, 3, 0.5, 10, 15, 10500, 255),
    weapon("is", "Gauss Weapons", "Grand Mauler Gauss Rifle", "1", "-/2/4/5", 125, 2, 1, 5, 6, 8000, 255),
    weapon("is", "Gauss Weapons", "Tsunami Gauss Rifle", "1", "-/2/4/5", 125, 2, 1, 5, 6, 9500, 255),
    weapon("is", "Grenade Launchers", "Micro Grenade Launcher", "1", "-/1/2/-", 75, 1, 0.25, 20, 1, 1950, 256),
    weapon("is", "Grenade Launchers", "Heavy Grenade Launcher", "1", "-/1/2/3", 100, 1, 0.25, 20, 2, 4500, 256),
    weapon("is", "Machine Guns", "Light Machine Gun", "1", "-/2/4/6", 75, 1, 0.1, 50, 5, 5000, 258),
    weapon("is", "Machine Guns", "Machine Gun", "2", "-/1/2/3", 100, 1, 0.1, 50, 5, 5000, 258),
    weapon("is", "Machine Guns", "Heavy Machine Gun", "3", "-/1/2/-", 150, 1, 0.1, 50, 6, 7500, 258),
    weapon("is", "Mortars", "Light Mortar", "3", "1/1/2/3", 300, 2, 2, 20, 9, 2100, 262),
    weapon("is", "Mortars", "Heavy Mortar", "3", "2/2/4/6", 400, 2, 4, 20, 17, 7500, 262),
    weapon("is", "Recoilless Rifles", "Light Recoilless Rifle", "2", "-/2/4/6", 175, 2, 1, 20, 12, 1000, 268),
    weapon("is", "Recoilless Rifles", "Medium Recoilless Rifle", "3", "-/2/4/6", 250, 2, 2, 20, 19, 3000, 268),
    weapon("is", "Recoilless Rifles", "Heavy Recoilless Rifle", "3", "-/3/5/7", 325, 3, 4, 20, 22, 5000, 268),
    weapon("is", "Flamers", "Flamer (BA)", "2", "-/1/2/3", 150, 1, 0.5, 10, 5, 7500, 255),
    weapon("is", "Lasers", "ER Small Laser", "3", "-/2/4/5", 350, 2, 0.25, 20, 17, 11250, 258),
    weapon("is", "Lasers", "ER Medium Laser", "5", "-/4/8/12", 800, 3, 0.25, 20, 62, 80000, 258),
    weapon("is", "Lasers", "Small Laser", "3", "-/1/2/3", 200, 1, 0.16, 30, 9, 11250, 258),
    weapon("is", "Lasers", "Medium Laser", "5", "-/3/6/9", 500, 3, 0.5, 30, 46, 40000, 258),
    weapon("is", "Lasers", "Small Pulse Laser", "3", "-/1/2/3", 400, 1, 0.35, 14, 12, 16000, 258),
    weapon("is", "Lasers", "Medium Pulse Laser", "6", "-/2/4/6", 800, 3, 0.41, 12, 48, 60000, 258),
    weapon("is", "PPCs", "Support PPC", "2", "-/2/5/7", 250, 2, 0.33, 15, 14, 14000, 267),
    weapon("is", "Plasma Weapons", "Plasma Rifle (Man-Portable)", "2", "-/2/4/6", 300, 2, 1.5, 20, 12, 28000, 267),
    weapon("is", "Needlers", "Firedrake Support Needler", "1", "-/1/2/3", 50, 1, 0.16, 30, 2, 1500, 266),
    launcher("is", "LRM", 1, "1/msl", LRM_IS, 60, 40, 2, 3, 8.3, 14, 3, 2, 6000),
    launcher("is", "LRM", 2, "1/msl", LRM_IS, 120, 80, 2, 3, 16.6, 20, 4, 3, 6000),
    launcher("is", "LRM", 3, "1/msl", LRM_IS, 180, 120, 3, 4, 25, 29, 6, 4, 6000),
    launcher("is", "LRM", 4, "1/msl", LRM_IS, 240, 160, 3, 5, 33.3, 38, 8, 5, 6000),
    launcher("is", "LRM", 5, "1/msl", LRM_IS, 300, 200, 4, 5, 41.5, 45, 9, 6, 6000),
    launcher("is", "SRM", 1, "2/msl", SRM, 60, 50, 1, 2, 10, 15, 3, 2, 5000),
    launcher("is", "SRM", 2, "2/msl", SRM, 120, 75, 2, 2, 20, 21, 4, 3, 5000),
    launcher("is", "SRM", 3, "2/msl", SRM, 180, 125, 2, 2, 30, 30, 6, 4, 5000),
    launcher("is", "SRM", 4, "2/msl", SRM, 240, 150, 2, 3, 40, 39, 8, 5, 5000),
    launcher("is", "SRM", 5, "2/msl", SRM, 300, 175, 3, 3, 50, 47, 9, 6, 5000),
    launcher("is", "SRM", 6, "2/msl", SRM, 360, 200, 3, 4, 60, 59, 12, 7, 5000),
    launcher("is", "MRM", 1, "1/msl", MRM, 60, 50, 1, 2, 5, 9, 2, 1, 5000),
    launcher("is", "MRM", 2, "1/msl", MRM, 120, 100, 2, 2, 10, 13, 3, 2, 5000),
    launcher("is", "MRM", 3, "1/msl", MRM, 180, 150, 2, 3, 15, 18, 4, 2, 5000),
    launcher("is", "MRM", 4, "1/msl", MRM, 240, 200, 3, 3, 20, 23, 5, 3, 5000),
    launcher("is", "MRM", 5, "1/msl", MRM, 300, 250, 3, 4, 25, 28, 6, 4, 5000),
    rocket(1, 25, 2, 2),
    rocket(2, 50, 2, 3),
    rocket(3, 75, 3, 4),
    rocket(4, 100, 3, 5),
    rocket(5, 125, 4, 6),
    { ...weapon("is", "Special Weapons", "Compact Narc", "0", "-/2/4/5", 150, 1, 10, 1, 16, 50000, 263), kind: "missile", oneShot: undefined, ammoBVPerTon: 0, magazine: undefined },
    { ...weapon("is", "Special Weapons", "Pop-Up Mine", "4", "-/-/-/0", 200, 1, 0, 1, 6, 2500, 267), kind: "missile", oneShot: "always", ammoKg: undefined },
    item("is", "Active Probe", "-/-/-/4", 250, 2, 50000, 252, { defensive: true }),
    item("is", "Camo System", "NA", 200, 2, 200000, 253, { noMount: true, max: 1, defensiveFactorBonus: 0.2 }),
    item("is", "ECM Suite", "-/-/-/0", 100, 1, 50000, 254, { defensive: true }),
    item("is", "Heat Sensor", "-/9/18/27", 20, 1, 15000, 255),
    item("is", "Improved Sensors", "-/-/-/2", 65, 1, 35000, 257, { defensive: true, max: 1 }),
    item("is", "Magnetic Clamps", "NA", 30, 2, 2500, 259, { noMount: true, max: 1, bv: 1 }),
    item("is", "Partial Wing", "NA", 200, 1, 50000, 266, { bodyOnly: true, max: 1, jumpBonus: 1 }),
    { ...weapon("is", "Lasers", "Small Variable Speed Pulse Laser", "5/4/3", "-/2/4/6", 500, 2, 0.33, 15, 22, 60000, 133, "To-hit modifier -3/-2/-1 and damage 5/4/3 at Short/Medium/Long range."), ...ADVANCED },
    { ...weapon("is", "Lasers", "Medium Variable Speed Pulse Laser", "9/7/5", "-/2/5/9", 900, 4, 0.38, 13, 56, 200000, 133, "To-hit modifier -3/-2/-1 and damage 9/7/5 at Short/Medium/Long range."), ...ADVANCED },
    { ...weapon("is", "Special Weapons", "Taser", "1", "-/1/2/3", 300, 3, 0, 1, 15, 10000, 158, "+1 to-hit modifier; one shot."), ...ADVANCED, ammoKg: undefined },
    { ...weapon("is", "Special Weapons", "Tube Artillery", "3/1 (R1)", "2 boards", 500, 4, 15, 2, 27, 200000, 96), ...EXPERIMENTAL, kind: "missile", magazine: undefined, ammoBVPerTon: 4, bodyOnly: true, noMount: true,
        notes: "Shots are bought like missiles, 15 kg each. Damage is multiplied by the troopers firing (TO:AUE p.96)." },
    item("is", "Mechanical Jump Booster", "NA", 0, 0, 0, 98, { ...EXPERIMENTAL, noMount: true, bodyOnly: true, max: 1, mechanicalJumpBooster: true,
        notes: "Weighs twice, and costs the same as, one Jumping MP of the suit's weight class; 1 Jumping MP of its own and +1 Ground MP." }),
    item("is", "C3 System", "NA", 250, 1, 62500, 109, { ...EXPERIMENTAL, max: 1, noMount: true }),
    item("is", "Improved C3 System", "NA", 350, 1, 125000, 109, { ...EXPERIMENTAL, max: 1, noMount: true }),
    ...sharedEquipment("is"),

    // Clan Battle Armor Equipment Table (TM p.348)
    weapon("clan", "Gauss Weapons", "AP Gauss Rifle", "3", "-/3/6/9", 200, 2, 1.25, 20, 21, 10000, 255),
    weapon("clan", "Grenade Launchers", "Heavy Grenade Launcher", "1", "-/1/2/3", 100, 1, 0.25, 20, 2, 4500, 256),
    weapon("clan", "Machine Guns", "Light Machine Gun", "1", "-/2/4/6", 75, 1, 0.1, 50, 5, 5000, 258),
    weapon("clan", "Machine Guns", "Machine Gun", "2", "-/1/2/3", 100, 1, 0.1, 50, 5, 5000, 258),
    weapon("clan", "Machine Guns", "Heavy Machine Gun", "3", "-/1/2/-", 150, 1, 0.1, 50, 6, 7500, 258),
    weapon("clan", "Machine Guns", "Bearhunter Superheavy AC", "3", "-/0/1/2", 150, 2, 1.5, 20, 4, 11250, 258, "The table prints the range as \"-0/1/2\"."),
    weapon("clan", "Recoilless Rifles", "Light Recoilless Rifle", "2", "-/2/4/6", 175, 2, 1, 20, 12, 1000, 268),
    weapon("clan", "Recoilless Rifles", "Medium Recoilless Rifle", "3", "-/2/4/6", 250, 2, 2, 20, 19, 3000, 268),
    weapon("clan", "Recoilless Rifles", "Heavy Recoilless Rifle", "3", "-/3/5/7", 325, 3, 4, 20, 22, 5000, 268),
    weapon("clan", "Flamers", "Flamer (BA)", "2", "-/1/2/3", 150, 1, 0.5, 10, 5, 7500, 255),
    weapon("clan", "Lasers", "ER Micro Laser", "2", "-/1/2/4", 150, 1, 0.16, 30, 7, 10000, 258),
    weapon("clan", "Lasers", "ER Small Laser", "5", "-/2/4/6", 350, 2, 0.25, 20, 31, 11250, 258),
    weapon("clan", "Lasers", "ER Medium Laser", "7", "-/5/10/15", 800, 3, 0.25, 20, 108, 80000, 258),
    weapon("clan", "Lasers", "Small Laser", "3", "-/1/2/3", 200, 1, 0.16, 30, 9, 11250, 258),
    weapon("clan", "Lasers", "Micro Pulse Laser", "3", "-/1/2/3", 160, 1, 0.29, 17, 12, 12500, 258),
    weapon("clan", "Lasers", "Small Pulse Laser", "3", "-/2/4/6", 400, 1, 0.35, 14, 24, 16000, 258),
    weapon("clan", "Lasers", "Medium Pulse Laser", "7", "-/4/8/12", 800, 3, 0.41, 12, 111, 60000, 258),
    weapon("clan", "Lasers", "Heavy Small Laser", "6", "-/1/2/3", 500, 3, 0.25, 20, 15, 20000, 258),
    weapon("clan", "Lasers", "Heavy Medium Laser", "10", "-/3/6/9", 1000, 4, 0.25, 20, 76, 100000, 258),
    weapon("clan", "PPCs", "Support PPC", "2", "-/2/5/7", 240, 2, 0.35, 14, 14, 14000, 267),
    launcher("clan", "LRM", 1, "1/msl", LRM_CLAN, 35, 25, 2, 2, 8.3, 17, 3, 2, 6000),
    launcher("clan", "LRM", 2, "1/msl", LRM_CLAN, 70, 50, 2, 2, 16.6, 24, 5, 3, 6000),
    launcher("clan", "LRM", 3, "1/msl", LRM_CLAN, 105, 75, 3, 3, 25, 34, 7, 4, 6000),
    launcher("clan", "LRM", 4, "1/msl", LRM_CLAN, 140, 100, 3, 3, 33.3, 46, 9, 6, 6000),
    launcher("clan", "LRM", 5, "1/msl", LRM_CLAN, 175, 125, 3, 4, 41.5, 55, 11, 7, 6000),
    launcher("clan", "SRM", 1, "2/msl", SRM, 35, 20, 1, 2, 10, 15, 3, 2, 5000),
    launcher("clan", "SRM", 2, "2/msl", SRM, 70, 40, 2, 2, 20, 21, 4, 3, 5000),
    launcher("clan", "SRM", 3, "2/msl", SRM, 105, 60, 2, 2, 30, 30, 6, 4, 5000),
    launcher("clan", "SRM", 4, "2/msl", SRM, 140, 80, 2, 3, 40, 39, 8, 5, 5000),
    launcher("clan", "SRM", 5, "2/msl", SRM, 175, 100, 3, 3, 50, 47, 9, 6, 5000),
    launcher("clan", "SRM", 6, "2/msl", SRM, 210, 120, 3, 4, 60, 59, 12, 7, 5000),
    launcher("clan", "Advanced SRM", 1, "2/msl", ASRM, 60, 35, 2, 3, 10, 15, 3, 2, 15000),
    launcher("clan", "Advanced SRM", 2, "2/msl", ASRM, 90, 70, 2, 3, 20, 30, 6, 4, 15000),
    launcher("clan", "Advanced SRM", 3, "2/msl", ASRM, 120, 105, 3, 4, 30, 45, 9, 6, 15000),
    launcher("clan", "Advanced SRM", 4, "2/msl", ASRM, 150, 135, 3, 4, 40, 60, 12, 8, 15000),
    launcher("clan", "Advanced SRM", 5, "2/msl", ASRM, 180, 165, 4, 5, 50, 75, 15, 10, 15000),
    launcher("clan", "Advanced SRM", 6, "2/msl", ASRM, 210, 195, 4, 5, 60, 90, 18, 12, 15000),
    { ...weapon("clan", "Special Weapons", "Compact Narc", "0", "-/2/4/5", 150, 1, 10, 1, 16, 50000, 263), kind: "missile", ammoBVPerTon: 0, magazine: undefined },
    { ...weapon("clan", "Special Weapons", "Bomb Rack", "2", "-/-/-/-", 100, 2, 0, 1, 11, 30000, 253), oneShot: "always", ammoKg: undefined, magazine: undefined, notes: "A one-shot weapon for battle armor with VTOL movement; counted with direct-fire weapons in the Battle Value (TM p.310)." },
    item("clan", "Active Probe", "-/-/-/5", 150, 2, 50000, 252, { defensive: true }),
    item("clan", "ECM Suite", "-/-/-/0", 75, 1, 50000, 254, { defensive: true }),
    { ...weapon("clan", "Autocannons", "LB-X Autocannon", "4", "-/2/5/8", 400, 2, 4, 10, 20, 70000, 98, "-1 to-hit modifier; cluster and flak."), ...ADVANCED },
    { ...weapon("clan", "Lasers", "ER Small Pulse Laser", "5", "-/2/4/6", 550, 2, 0.41, 12, 36, 30000, 132, "-1 to-hit modifier."), ...EXPERIMENTAL },
    { ...weapon("clan", "Lasers", "ER Medium Pulse Laser", "7", "-/5/9/14", 800, 4, 0.45, 11, 117, 150000, 132, "-1 to-hit modifier."), ...EXPERIMENTAL },
    item("clan", "Myomer Booster", "NA", 250, 3, 0, 99, { ...EXPERIMENTAL, noMount: true, max: 1, spreadSlots: true, groundBonus: { light: 2, heavy: 1 }, costPerMP: 75000,
        barsArmor: ["ba-stealth-basic", "ba-stealth-standard", "ba-stealth-improved", "ba-stealth-prototype", "ba-mimetic"],
        notes: "+2 Ground MP on PA(L), Light and Medium suits, +1 on Heavy and Assault suits; Leg and Swarm attacks do 2 more damage for each active trooper (TO:AUE pp.98-99)." }),
    item("clan", "HarJel", "NA", 0, 0, null, 256, { noMount: true, max: 1, notes: "The price list has no row for HarJel on battle armor." }),
    item("clan", "Heat Sensor", "-/11/23/34", 20, 1, 15000, 256),
    item("clan", "Improved Sensors", "-/-/-/3", 45, 1, 35000, 257, { defensive: true, max: 1 }),
    ...sharedEquipment("clan"),
];

const on = (introduced: BattleArmorYear | null, prototype?: number, extinct?: number, reintroduced?: number): IBattleArmorDates => ({
    introduced,
    ...(prototype !== undefined ? { prototype } : {}),
    ...(extinct !== undefined ? { extinct } : {}),
    ...(reintroduced !== undefined ? { reintroduced } : {}),
});

// Universal Technology Advancement Table, "Battle Armor Tech" and "Battle Armor Weapons" (IO:AE pp.46-47): the
// Production date, and the "IS Intro" or "Clan Intro" date for the technology base that came to the item later.
// Circa dates are entered as the year. The first row a tag matches is used.
const DATE_ROWS: [RegExp, IBattleArmorDates][] = [
    [/^clan-active-probe$/, on(2900, 2898)],
    [/^is-active-probe$/, on(3050)],
    [/-angel-ecm$/, on(3080, 3058)],
    [/^clan-bomb-rack$/, on(3060, 3055)],
    [/^is-camo-system$/, on(2800, 2790)],
    [/-cutting-torch$/, on("ES")],
    [/^is-ecm-suite$/, on(2720, 2718, 2766, 3057)],
    [/^clan-ecm-suite$/, on(2720, 2718)],
    [/-extended-life-support$/, on(2715, 2712)],
    [/^is-fuel-tank$/, on(2744, 2740, 2781, 3051)],
    [/^clan-fuel-tank$/, on(2744, 2740)],
    [/^clan-harjel$/, on(2840, 2838)],
    [/^clan-heat-sensor$/, on(2880, 2879)],
    [/^is-heat-sensor$/, on(3050)],
    [/^clan-improved-sensors$/, on(2890, 2887)],
    [/^is-improved-sensors$/, on(3051)],
    [/-laser-microphone$/, on("ES")],
    [/-(parafoil|power-pack|searchlight|shotgun-microphone)$/, on("PS")],
    [/-remote-sensor-dispenser$/, on(3050, 2700)],
    [/^clan-space-operations-adaptation$/, on(2895, 2890)],
    [/^is-space-operations-adaptation$/, on(3011)],
    [/^is-jump-booster$/, on(3051, 3050)],
    [/^clan-jump-booster$/, on(3062)],
    [/^is-magnetic-clamps$/, on(3062, 3057)],
    [/^is-mechanical-jump-booster$/, on(3084, 3070)],
    [/^clan-myomer-booster$/, on(3085, 3072)],
    [/^is-partial-wing$/, on(3053, 3051)],
    [/^clan-dropchute-stealth/, on(2880, 2878)],
    [/^clan-dropchute-(standard|camouflage)-reusable$/, on(2876, 2874)],
    [/^clan-dropchute-/, on(2875, 2874)],
    [/^is-dropchute-stealth/, on(3054)],
    [/^is-dropchute-(standard|camouflage)-reusable$/, on(3053)],
    [/^is-dropchute-/, on(3051)],
    [/^is-c3-system$/, on(3095, 3073)],
    [/^is-improved-c3-system$/, on(3095, 3063, 3085)],
    [/^clan-flamer-ba$/, on(2868, 2865)],
    [/^is-flamer-ba$/, on(3050)],
    [/-heavy-flamer$/, on(3073, 3070)],
    [/^clan-ap-gauss-rifle$/, on(3069, 3066)],
    [/^is-grand-mauler-gauss-rifle$/, on(3059, 3055)],
    [/^is-tsunami-gauss-rifle$/, on(3056, 3054)],
    [/^is-magshot-gauss-rifle$/, on(3059, 3057)],
    [/^is-(king-)?david-light-gauss-rifle$/, on(3063, 3058)],
    [/^is-micro-grenade-launcher$/, on("ES")],
    [/^clan-heavy-grenade-launcher$/, on(2900, 2880)],
    [/^is-heavy-grenade-launcher$/, on(3050)],
    [/^is-(small|medium)-laser$/, on(3050, 3050)],
    [/^is-er-(small|medium)-laser$/, on(3058, 3055)],
    [/^is-(small|medium)-pulse-laser$/, on(3060, 3057)],
    [/^is-(small|medium)-variable-speed-pulse-laser$/, on(3072, 3070)],
    [/^clan-small-laser$/, on(2868, 2865)],
    [/^clan-heavy-(small|medium)-laser$/, on(3059, 3057)],
    [/^clan-er-(small|medium)-laser$/, on(2875, 2872)],
    [/^clan-er-micro-laser$/, on(3060, 3055)],
    [/^clan-(small|medium)-pulse-laser$/, on(2872, 2870)],
    [/^clan-micro-pulse-laser$/, on(3060, 3055)],
    [/^clan-er-(small|medium)-pulse-laser$/, on(3082, 3057)],
    [/^clan-lb-x-autocannon$/, on(3085, 3075)],
    [/^clan-light-machine-gun$/, on(3060, 3055)],
    [/^is-light-machine-gun$/, on(3068)],
    [/^clan-machine-gun$/, on(2868)],
    [/^is-machine-gun$/, on(3050)],
    [/^clan-heavy-machine-gun$/, on(3059, 3055)],
    [/^is-heavy-machine-gun$/, on(3068)],
    [/^clan-bearhunter-superheavy-ac$/, on(3062, 3060)],
    [/^is-lrm-/, on(3057, 3055)],
    [/^is-srm-/, on(3050, 3050)],
    [/^is-mrm-/, on(3060, 3058)],
    [/^is-rocket-launcher-/, on(3050, 3050)],
    [/^clan-lrm-/, on(3060, 3058)],
    [/^clan-srm-/, on(2868, 2865)],
    [/^clan-advanced-srm-/, on(3056, 3052)],
    [/^is-(light|heavy)-mortar$/, on(3057, 3054)],
    [/^clan-compact-narc$/, on(2875, 2870)],
    [/^is-compact-narc$/, on(3060)],
    [/^is-firedrake-support-needler$/, on(3060, 3058)],
    [/^is-support-ppc$/, on(3053, 3051)],
    [/^clan-support-ppc$/, on(2950)],
    [/^is-plasma-rifle-man-portable$/, on(3065, 3063)],
    [/^is-pop-up-mine$/, on(3050)],
    [/^is-(light|medium|heavy)-recoilless-rifle$/, on(3054, 3052)],
    [/^clan-(light|medium|heavy)-recoilless-rifle$/, on(3062)],
    [/^is-light-tag$/, on(3053, 3051)],
    [/^clan-light-tag$/, on(3054)],
    [/^is-tube-artillery$/, on(3075, 3070)],
    [/^is-taser$/, on(3067, 3060)],
    [/-mine-dispenser$/, on(3062, 3057)],
];

const strike = (short: number, medium: number = 0, long: number = 0, extra: Partial<IBattleArmorAlphaStrikeDamage> = {}): IBattleArmorAlphaStrikeDamage =>
    ({ short, medium, long, ...extra });
const bySize = (tag: string, values: IBattleArmorAlphaStrikeDamage[]): IBattleArmorAlphaStrikeDamage | undefined =>
    values[Number(tag.slice(tag.lastIndexOf("-") + 1)) - 1];
const sm = (value: number): IBattleArmorAlphaStrikeDamage => strike(value, value);
const INDIRECT = { indirect: true };

// Alpha Strike Weapon Conversion Tables: Additional Inner Sphere and Clan Battle Armor Weapons (ASC pp.112-113),
// and the Standard Weapons tables (ASC pp.105-111) for the weapons a suit shares with larger units.
const ALPHA_STRIKE_ROWS: [RegExp, (tag: string) => IBattleArmorAlphaStrikeDamage | undefined][] = [
    [/^is-firedrake-support-needler$/, () => strike(0.1)],
    [/^is-(king-)?david-light-gauss-rifle$/, () => sm(0.1)],
    [/^is-(grand-mauler|tsunami)-gauss-rifle$/, () => sm(0.1)],
    [/^is-magshot-gauss-rifle$/, () => sm(0.2)],
    [/-(micro|heavy)-grenade-launcher$/, () => strike(0.1)],
    [/^is-light-mortar$/, () => strike(0.276, 0, 0, INDIRECT)],
    [/^is-heavy-mortar$/, () => strike(0.249, 0, 0, INDIRECT)],
    [/-light-recoilless-rifle$/, () => sm(0.2)],
    [/-(medium|heavy)-recoilless-rifle$/, () => sm(0.3)],
    [/-flamer-ba$/, () => strike(0.2, 0, 0, { heat: [2, 0, 0] })],
    [/-heavy-flamer$/, () => strike(0.4, 0.4, 0, { heat: [4, 0, 0] })],
    [/^is-plasma-rifle-man-portable$/, () => strike(0.2, 0.2, 0, { heat: [3, 3, 0] })],
    [/-support-ppc$/, () => sm(0.2)],
    [/^is-medium-variable-speed-pulse-laser$/, () => strike(1.035, 0.525)],
    [/^is-small-variable-speed-pulse-laser$/, () => strike(0.575, 0.315)],
    [/^is-lrm-/, (tag) => bySize(tag, [strike(0.05, 0.1, 0.1, INDIRECT), strike(0.05, 0.1, 0.1, INDIRECT), strike(0.1, 0.2, 0.2, INDIRECT), strike(0.15, 0.3, 0.3, INDIRECT), strike(0.15, 0.3, 0.3, INDIRECT)])],
    [/^is-mrm-/, (tag) => bySize(tag, [sm(0.095), sm(0.095), sm(0.19), sm(0.285), sm(0.285)])],
    [/^is-rocket-launcher-/, (tag) => bySize(tag, [sm(0.01), sm(0.01), sm(0.19), sm(0.29), sm(0.29)])],
    [/-srm-\d$/, (tag) => tag.includes("advanced")
        ? bySize(tag, [sm(0.2), sm(0.4), sm(0.4), sm(0.6), sm(0.6), sm(0.8)])
        : bySize(tag, [sm(0.2), sm(0.2), sm(0.4), sm(0.6), sm(0.6), sm(0.8)])],
    [/^clan-lrm-/, (tag) => bySize(tag, [strike(0.1, 0.1, 0.1, INDIRECT), strike(0.1, 0.1, 0.1, INDIRECT), strike(0.2, 0.2, 0.2, INDIRECT), strike(0.3, 0.3, 0.3, INDIRECT), strike(0.3, 0.3, 0.3, INDIRECT)])],
    [/^clan-lb-x-autocannon$/, () => strike(0.315, 0.315, 0, { flak: true })],
    [/^clan-bearhunter-superheavy-ac$/, () => strike(0.3)],
    [/^clan-er-medium-pulse-laser$/, () => sm(0.735)],
    [/^clan-er-small-pulse-laser$/, () => sm(0.525)],
    // Standard Weapons tables.
    [/^is-er-small-laser$/, () => sm(0.3)],
    [/^is-er-medium-laser$/, () => sm(0.5)],
    [/-small-laser$/, (tag) => tag === "clan-heavy-small-laser" ? strike(0.57) : tag === "clan-er-small-laser" ? sm(0.5) : strike(0.3)],
    [/^is-medium-laser$/, () => sm(0.5)],
    [/^is-small-pulse-laser$/, () => strike(0.33)],
    [/^is-medium-pulse-laser$/, () => sm(0.66)],
    [/^clan-er-medium-laser$/, () => sm(0.7)],
    [/^clan-er-micro-laser$/, () => strike(0.2)],
    [/^clan-heavy-medium-laser$/, () => sm(0.95)],
    [/^clan-medium-pulse-laser$/, () => sm(0.77)],
    [/^clan-small-pulse-laser$/, () => sm(0.33)],
    [/^clan-micro-pulse-laser$/, () => strike(0.33)],
    [/^clan-ap-gauss-rifle$/, () => sm(0.3)],
    [/-light-machine-gun$/, () => sm(0.1)],
    [/-heavy-machine-gun$/, () => strike(0.3)],
    [/-machine-gun$/, () => strike(0.2)],
];

/** Special abilities an item gives its unit (ASC pp.117-133). */
const ALPHA_STRIKE_SPECIALS: [RegExp, string][] = [
    [/-active-probe$/, "LPRB"],
    [/-angel-ecm$/, "AECM"],
    [/-ecm-suite$/, "LECM"],
    [/-light-tag$/, "LTAG"],
    [/-compact-narc$/, "CNARC"],
    [/-camo-system$/, "LMAS"],
    [/-mine-dispenser$/, "MDS"],
    [/-parafoil$/, "PAR"],
    [/-space-operations-adaptation$/, "SOA"],
    [/-taser$/, "BTAS"],
    [/-bomb-rack$/, "BOMB"],
    [/-magnetic-clamps$/, "XMEC"],
    [/-tube-artillery$/, "ART-BA"],
    [/-remote-sensor-dispenser$/, "RSD"],
    [/-searchlight$/, "SRCH"],
    [/^is-c3-system$/, "C3S,MHQ1"],
    [/^is-improved-c3-system$/, "C3I,MHQ2"],
];

export const battleArmorEquipment: IBattleArmorEquipment[] = equipmentRows.map((entry) => {
    const dates = DATE_ROWS.find(([pattern]) => pattern.test(entry.tag))?.[1];
    const alphaStrike = ALPHA_STRIKE_ROWS.find(([pattern]) => pattern.test(entry.tag))?.[1](entry.tag);
    const alphaStrikeSpecial = ALPHA_STRIKE_SPECIALS.find(([pattern]) => pattern.test(entry.tag))?.[1];
    return { ...entry, ...(dates ? { dates } : {}), ...(alphaStrike ? { alphaStrike } : {}), ...(alphaStrikeSpecial ? { alphaStrikeSpecial } : {}) };
});

/** Minefield BV Table (TO:AUE p.197), for the land minefields a mine dispenser lays: Battle Value of a 10-point field. */
export interface IBattleArmorMineType {
    tag: string;
    name: string;
    /** Twice the table's "BV per 5 Points"; for EMP mines, its "BV per Hex". */
    bv: number;
}
export const battleArmorMineTypes: IBattleArmorMineType[] = [
    { tag: "standard", name: "Standard (conventional)", bv: 8 },
    { tag: "active", name: "Active", bv: 12 },
    { tag: "command-detonated", name: "Command-Detonated", bv: 12 },
    { tag: "emp", name: "EMP", bv: 45 },
    { tag: "inferno", name: "Inferno", bv: 10 },
    { tag: "vibrabomb", name: "Vibrabomb", bv: 10 },
];
export const findBattleArmorMineType = (tag: string | undefined): IBattleArmorMineType =>
    battleArmorMineTypes.find((entry) => entry.tag === tag) ?? battleArmorMineTypes[0];

export const findBattleArmorEquipment = (tag: string): IBattleArmorEquipment | null =>
    battleArmorEquipment.find((entry) => entry.tag === tag) ?? null;

export const getBattleArmorEquipmentFor = (techBase: BattleArmorTechBase): IBattleArmorEquipment[] =>
    battleArmorEquipment.filter((entry) => entry.techBase === techBase);
