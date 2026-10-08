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
}

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
    { ...weapon(techBase, "Special Weapons", "Light TAG", "NA", "-/3/6/9", 35, 1, 0.08, 60, 0, 40000, 270), notes: "Battle Value only when friendly units carry homing or semi-guided munitions (TM p.315)." },
];

export const battleArmorEquipment: IBattleArmorEquipment[] = [
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
    item("clan", "HarJel", "NA", 0, 0, null, 256, { noMount: true, max: 1, notes: "The price list has no row for HarJel on battle armor." }),
    item("clan", "Heat Sensor", "-/11/23/34", 20, 1, 15000, 256),
    item("clan", "Improved Sensors", "-/-/-/3", 45, 1, 35000, 257, { defensive: true, max: 1 }),
    ...sharedEquipment("clan"),
];

export const findBattleArmorEquipment = (tag: string): IBattleArmorEquipment | null =>
    battleArmorEquipment.find((entry) => entry.tag === tag) ?? null;

export const getBattleArmorEquipmentFor = (techBase: BattleArmorTechBase): IBattleArmorEquipment[] =>
    battleArmorEquipment.filter((entry) => entry.techBase === techBase);
