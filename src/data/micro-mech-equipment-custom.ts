/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs,
* Topps, and their respective rights holders. Any original, fan-made content
* processed by this file remains the property of its creators, credited below.
*
* This open-source utility is a non-commercial fan project designed purely for
* tabletop gameplay assistance. Content processed by this file is not intended
* to challenge any copyright or trademark status, and this data is explicitly
* excluded from the software's underlying license (GNU GPLv3).
*
* Micro-Mechs (#173), Custom Homebrew: the "MicroMech Weapons and Equipment Table" and the "Ammunition Shots Per
* Quarter Ton" table of "Micro-Mechs" 6.1.0.2 (ResourceLibrary/Custom/text/Micro-Mechs6-1-0-2.raw.txt, lines
* 274-515), one record per row, every value as printed. The table prints no ranges or dates ("See item description
* in the BattleTech Master Rules"): `canonTag` names the JBT catalog record for the same weapon, read for range and date
* only, and `range` holds a range read in another book where the JBT catalog has none or differs (NGCFells's ruling 6).
* Solarmech's 2019 post has no equipment table: under that version these records are borrowed (MICRO_MECH_BORROWED_NOTE).
* These records are not in the equipment registry: only a Micro-Mech mounts them.
*/

import { MICRO_MECH_CREDIT } from "./micro-mech-construction";
import { findUnitCatalogRecord } from "./equipment-lookup";

export type MicroMechItemKind = "energy" | "ballistic" | "missile" | "equipment";
export type MicroMechAmmoType = "standard" | "cluster";

export interface IMicroMechRange {
    min: number;
    short: number;
    medium: number;
    long: number;
    extreme?: number;
}

export interface IMicroMechAmmo {
    /** "cluster" only for the LB-X rows, which print a cluster line under the standard one. */
    type: MicroMechAmmoType;
    /** Shots in 250, 500, 750 and 1,000 kg, as the table prints them. */
    shotsPerQuarterTon: [number, number, number, number];
    costPerTon: number;
    bvPerTon: number;
}

export interface IMicroMechItem {
    tag: string;
    name: string;
    /** The table's section: a weapon is any row outside "Equipment". */
    kind: MicroMechItemKind;
    heat: number;
    /** A number, or the table's text ("1/Hit", "2/Hit", "*", "10+Heat"). */
    damage: number | string;
    weightKg: number;
    slots: number;
    cost: number;
    /** null where the table prints a letter note instead (A to D). */
    battleValue: number | null;
    bvNote?: string;
    /** Tube launchers ("Missile Launchers ... mount missiles in groups of tubes"): the family and the tube count. */
    family?: string;
    tubes?: number;
    /** The JBT catalog record for the same weapon, for range and date only. */
    canonTag?: string;
    /** The range came from the launcher family's record, not a record of this size. */
    rangeExtrapolated?: boolean;
    /** A range read in a book (rangeSource), used instead of the canonTag record's. */
    range?: IMicroMechRange;
    rangeSource?: string;
    oneShot?: boolean;
    ammo?: IMicroMechAmmo[];
    notes: string;
}

const note = (text: string): string => [text, MICRO_MECH_CREDIT].filter(Boolean).join(" ");

/** The items the document bans ("cannot make use of AMS, Hatchets, MASC, Swords and Triple Strength Myomer"); none has a row. */
export const MICRO_MECH_BANNED_ITEMS = ["AMS", "Hatchet", "MASC", "Sword", "Triple Strength Myomer"];

export const microMechItems: IMicroMechItem[] = [
    { tag: "micro-er-laser-large", name: "ER Laser, Large", kind: "energy", heat: 12, damage: 8, weightKg: 5000, slots: 2, cost: 200000, battleValue: 163, canonTag: "er-large-laser", notes: note("") },
    { tag: "micro-er-laser-medium", name: "ER Laser, Medium", kind: "energy", heat: 5, damage: 5, weightKg: 1000, slots: 1, cost: 80000, battleValue: 62, canonTag: "er-medium-laser", notes: note("") },
    { tag: "micro-er-laser-small", name: "ER Laser, Small", kind: "energy", heat: 2, damage: 3, weightKg: 500, slots: 1, cost: 11250, battleValue: 17, canonTag: "er-small-laser", notes: note("") },
    { tag: "micro-er-ppc", name: "ER PPC", kind: "energy", heat: 15, damage: 15, weightKg: 7000, slots: 3, cost: 300000, battleValue: 229, canonTag: "er-ppc", notes: note("") },
    { tag: "micro-flamer", name: "Flamer", kind: "energy", heat: 3, damage: 2, weightKg: 1000, slots: 1, cost: 7500, battleValue: 6, canonTag: "standard-flamer", notes: note("") },
    { tag: "micro-laser-large", name: "Laser, Large", kind: "energy", heat: 8, damage: 8, weightKg: 5000, slots: 2, cost: 100000, battleValue: 124, canonTag: "large-laser", notes: note("") },
    { tag: "micro-laser-medium", name: "Laser, Medium", kind: "energy", heat: 3, damage: 5, weightKg: 1000, slots: 1, cost: 40000, battleValue: 46, canonTag: "medium-laser", notes: note("") },
    { tag: "micro-laser-small", name: "Laser, Small", kind: "energy", heat: 1, damage: 3, weightKg: 500, slots: 1, cost: 11250, battleValue: 9, canonTag: "small-laser", notes: note("") },
    { tag: "micro-ppc", name: "PPC", kind: "energy", heat: 10, damage: 10, weightKg: 7000, slots: 3, cost: 200000, battleValue: 176, canonTag: "standard-ppc", notes: note("") },
    { tag: "micro-pulse-laser-large", name: "Pulse Laser, Large", kind: "energy", heat: 10, damage: 9, weightKg: 7000, slots: 2, cost: 175000, battleValue: 119, canonTag: "large-pulse-laser", notes: note("") },
    { tag: "micro-pulse-laser-medium", name: "Pulse Laser, Medium", kind: "energy", heat: 4, damage: 6, weightKg: 2000, slots: 1, cost: 60000, battleValue: 48, canonTag: "medium-pulse-laser", notes: note("") },
    { tag: "micro-pulse-laser-small", name: "Pulse Laser, Small", kind: "energy", heat: 2, damage: 3, weightKg: 1000, slots: 1, cost: 16000, battleValue: 12, canonTag: "small-pulse-laser", notes: note("") },
    { tag: "micro-x-pulse-laser-large", name: "X-Pulse Laser, Large", kind: "energy", heat: 14, damage: 9, weightKg: 7000, slots: 2, cost: 275000, battleValue: 178, canonTag: "large-x-pulse-laser", notes: note("") },
    { tag: "micro-x-pulse-laser-medium", name: "X-Pulse Laser, Medium", kind: "energy", heat: 6, damage: 6, weightKg: 2000, slots: 1, cost: 110000, battleValue: 71, canonTag: "medium-x-pulse-laser", notes: note("") },
    { tag: "micro-x-pulse-laser-small", name: "X-Pulse Laser, Small", kind: "energy", heat: 3, damage: 3, weightKg: 1000, slots: 1, cost: 31000, battleValue: 21, canonTag: "small-x-pulse-laser", notes: note("") },
    { tag: "micro-autocannon-2", name: "Autocannon/2", kind: "ballistic", heat: 0, damage: 2, weightKg: 6000, slots: 1, cost: 75000, battleValue: 37, canonTag: "autocannon-standard-a", ammo: [{"type": "standard", "shotsPerQuarterTon": [11, 22, 33, 45], "costPerTon": 1000, "bvPerTon": 5}], notes: note("") },
    { tag: "micro-autocannon-5", name: "Autocannon/5", kind: "ballistic", heat: 0, damage: 5, weightKg: 8000, slots: 4, cost: 125000, battleValue: 70, canonTag: "autocannon-standard-b", ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 4500, "bvPerTon": 9}], notes: note("") },
    { tag: "micro-caseless-ac-2", name: "Caseless AC/2", kind: "ballistic", heat: 0, damage: 2, weightKg: 6000, slots: 1, cost: 75000, battleValue: 37, canonTag: "autocannon-standard-a", ammo: [{"type": "standard", "shotsPerQuarterTon": [17, 34, 50, 67], "costPerTon": 6000, "bvPerTon": 5}], notes: note("Maximum Tech treats caseless as ammunition for the standard autocannon; range from the Autocannon/2, which the Tactical Handbook's Caseless AC/2 row also prints (4 / 8 / 16 / 24).") },
    { tag: "micro-caseless-ac-5", name: "Caseless AC/5", kind: "ballistic", heat: 0, damage: 2, weightKg: 8000, slots: 4, cost: 150000, battleValue: 70, canonTag: "autocannon-standard-b", ammo: [{"type": "standard", "shotsPerQuarterTon": [8, 15, 23, 30], "costPerTon": 15000, "bvPerTon": 9}], notes: note("Damage printed as 2 (the Tactical Handbook's Caseless AC/5 does 5); kept as printed. Range from the Autocannon/5, which the Tactical Handbook's row also prints (3 / 6 / 12 / 18).") },
    { tag: "micro-flamer-vehicle", name: "Flamer, Vehicle", kind: "ballistic", heat: 0, damage: 2, weightKg: 500, slots: 1, cost: 7500, battleValue: 5, canonTag: "vehicle-flamer", ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 1000, "bvPerTon": 1}], notes: note("") },
    { tag: "micro-flamer-heavy", name: "Flamer, Heavy", kind: "ballistic", heat: 0, damage: 4, weightKg: 1000, slots: 1, cost: 20000, battleValue: 20, canonTag: "heavy-flamer", range: {"min": 0, "short": 2, "medium": 4, "long": 6, "extreme": 8}, rangeSource: "Maximum Tech (FASA 1700), Inner Sphere Level 3 Weapons and Equipment table; the document takes Maximum Tech's version where it and the Tactical Handbook both list a weapon. The JBT catalog record holds the later 2/3/4", ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 5, 8, 10], "costPerTon": 2000, "bvPerTon": 3}], notes: note("") },
    { tag: "micro-hv-ac-2", name: "HV AC/2", kind: "ballistic", heat: 0, damage: 2, weightKg: 8000, slots: 4, cost: 80000, battleValue: 48, canonTag: "is-hvac-2", ammo: [{"type": "standard", "shotsPerQuarterTon": [8, 15, 23, 30], "costPerTon": 7500, "bvPerTon": 6}], notes: note("Range agrees with the Tactical Handbook's HV AC/2 (3 / 10 / 20 / 35); the date is the JBT catalog record's.") },
    { tag: "micro-lac-2", name: "LAC/2", kind: "ballistic", heat: 0, damage: 2, weightKg: 4000, slots: 1, cost: 100000, battleValue: 30, canonTag: "autocannon-light-2", ammo: [{"type": "standard", "shotsPerQuarterTon": [11, 22, 33, 45], "costPerTon": 2000, "bvPerTon": 3}], notes: note("") },
    { tag: "micro-lac-5", name: "LAC/5", kind: "ballistic", heat: 0, damage: 5, weightKg: 5000, slots: 2, cost: 125000, battleValue: 62, canonTag: "autocannon-light-5", ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 5000, "bvPerTon": 5}], notes: note("") },
    { tag: "micro-lb-2x-ac", name: "LB-2X AC", kind: "ballistic", heat: 0, damage: 2, weightKg: 6000, slots: 4, cost: 150000, battleValue: 42, canonTag: "autocannon-lbx-2", ammo: [{"type": "standard", "shotsPerQuarterTon": [11, 22, 33, 45], "costPerTon": 2000, "bvPerTon": 5}, {"type": "cluster", "shotsPerQuarterTon": [11, 22, 33, 45], "costPerTon": 3300, "bvPerTon": 5}], notes: note("") },
    { tag: "micro-lb-5x-ac", name: "LB-5X AC", kind: "ballistic", heat: 0, damage: 5, weightKg: 8000, slots: 5, cost: 200000, battleValue: 83, canonTag: "autocannon-lbx-5", ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 9000, "bvPerTon": 10}, {"type": "cluster", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 15000, "bvPerTon": 10}], notes: note("") },
    { tag: "micro-machine-gun", name: "Machine Gun", kind: "ballistic", heat: 0, damage: 2, weightKg: 500, slots: 1, cost: 5000, battleValue: 5, canonTag: "machine-gun", ammo: [{"type": "standard", "shotsPerQuarterTon": [50, 100, 150, 200], "costPerTon": 1000, "bvPerTon": 1}], notes: note("") },
    { tag: "micro-recoilless-rifle-light", name: "Recoilless Rifle (Light)", kind: "ballistic", heat: 0, damage: 2, weightKg: 175, slots: 1, cost: 1000, battleValue: 12, range: {"min": 0, "short": 2, "medium": 4, "long": 6}, rangeSource: "Combat Equipment (FanPro 35017), RPG Support Weapon Conversion Table, p.111", ammo: [{"type": "standard", "shotsPerQuarterTon": [25, 50, 75, 100], "costPerTon": 400, "bvPerTon": 2}], notes: note("") },
    { tag: "micro-recoilless-rifle-medium", name: "Recoilless Rifle (Medium)", kind: "ballistic", heat: 0, damage: 3, weightKg: 250, slots: 1, cost: 3000, battleValue: 19, range: {"min": 0, "short": 2, "medium": 4, "long": 6}, rangeSource: "Combat Equipment (FanPro 35017), RPG Support Weapon Conversion Table, p.111", ammo: [{"type": "standard", "shotsPerQuarterTon": [12, 25, 37, 50], "costPerTon": 600, "bvPerTon": 2}], notes: note("") },
    { tag: "micro-recoilless-rifle-heavy", name: "Recoilless Rifle (Heavy)", kind: "ballistic", heat: 0, damage: 3, weightKg: 325, slots: 1, cost: 5000, battleValue: 22, range: {"min": 0, "short": 3, "medium": 5, "long": 7}, rangeSource: "Combat Equipment (FanPro 35017), RPG Support Weapon Conversion Table, p.111", ammo: [{"type": "standard", "shotsPerQuarterTon": [6, 12, 18, 25], "costPerTon": 800, "bvPerTon": 3}], notes: note("") },
    { tag: "micro-rotary-ac-2", name: "Rotary AC/2", kind: "ballistic", heat: 0, damage: 2, weightKg: 8000, slots: 3, cost: 175000, battleValue: 118, canonTag: "rotary-ac-2", ammo: [{"type": "standard", "shotsPerQuarterTon": [11, 22, 33, 45], "costPerTon": 3000, "bvPerTon": 15}], notes: note("") },
    { tag: "micro-ultra-ac-2", name: "Ultra AC/2", kind: "ballistic", heat: 0, damage: 2, weightKg: 7000, slots: 3, cost: 120000, battleValue: 56, canonTag: "autocannon-ultra-a", ammo: [{"type": "standard", "shotsPerQuarterTon": [11, 22, 33, 45], "costPerTon": 1000, "bvPerTon": 7}], notes: note("") },
    { tag: "micro-ultra-ac-5", name: "Ultra AC/5", kind: "ballistic", heat: 0, damage: 5, weightKg: 9000, slots: 5, cost: 200000, battleValue: 113, canonTag: "autocannon-ultra-b", ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 9000, "bvPerTon": 14}], notes: note("") },
    { tag: "micro-elrm-1", name: "ELRM 1", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 900, slots: 1, cost: 22700, battleValue: 19, family: "elrm", tubes: 1, canonTag: "extended-lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [23, 45, 68, 90], "costPerTon": 90000, "bvPerTon": 2}], notes: note("No book prints an ELRM 1; range and date extrapolated by NGCFells from its launcher family (extended-lrm-5).") },
    { tag: "micro-elrm-2", name: "ELRM 2", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 1800, slots: 1, cost: 45400, battleValue: 26, family: "elrm", tubes: 2, canonTag: "extended-lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [11, 22, 33, 45], "costPerTon": 90000, "bvPerTon": 3}], notes: note("No book prints an ELRM 2; range and date extrapolated by NGCFells from its launcher family (extended-lrm-5).") },
    { tag: "micro-elrm-3", name: "ELRM 3", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 2700, slots: 1, cost: 68100, battleValue: 37, family: "elrm", tubes: 3, canonTag: "extended-lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [8, 15, 23, 30], "costPerTon": 90000, "bvPerTon": 5}], notes: note("No book prints an ELRM 3; range and date extrapolated by NGCFells from its launcher family (extended-lrm-5).") },
    { tag: "micro-elrm-4", name: "ELRM 4", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 3600, slots: 1, cost: 90800, battleValue: 49, family: "elrm", tubes: 4, canonTag: "extended-lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [6, 12, 18, 23], "costPerTon": 90000, "bvPerTon": 6}], notes: note("No book prints an ELRM 4; range and date extrapolated by NGCFells from its launcher family (extended-lrm-5).") },
    { tag: "micro-elrm-5", name: "ELRM 5", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 4500, slots: 1, cost: 113500, battleValue: 59, family: "elrm", tubes: 5, canonTag: "extended-lrm-5", ammo: [{"type": "standard", "shotsPerQuarterTon": [6, 9, 12, 18], "costPerTon": 90000, "bvPerTon": 7}], notes: note("") },
    { tag: "micro-elrm-6", name: "ELRM 6", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 5400, slots: 2, cost: 136200, battleValue: 74, family: "elrm", tubes: 6, canonTag: "extended-lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 8, 11, 15], "costPerTon": 90000, "bvPerTon": 9}], notes: note("No book prints an ELRM 6; range and date extrapolated by NGCFells from its launcher family (extended-lrm-5).") },
    { tag: "micro-elrm-7", name: "ELRM 7", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 6300, slots: 2, cost: 158900, battleValue: 83, family: "elrm", tubes: 7, canonTag: "extended-lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 7, 10, 13], "costPerTon": 90000, "bvPerTon": 10}], notes: note("No book prints an ELRM 7; range and date extrapolated by NGCFells from its launcher family (extended-lrm-5).") },
    { tag: "micro-elrm-8", name: "ELRM 8", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 7200, slots: 2, cost: 181600, battleValue: 94, family: "elrm", tubes: 8, canonTag: "extended-lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 6, 8, 11], "costPerTon": 90000, "bvPerTon": 11}], notes: note("No book prints an ELRM 8; range and date extrapolated by NGCFells from its launcher family (extended-lrm-5).") },
    { tag: "micro-elrm-9", name: "ELRM 9", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 8100, slots: 2, cost: 204300, battleValue: 102, family: "elrm", tubes: 9, canonTag: "extended-lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 5, 8, 10], "costPerTon": 90000, "bvPerTon": 13}], notes: note("No book prints an ELRM 9; range and date extrapolated by NGCFells from its launcher family (extended-lrm-5).") },
    { tag: "micro-elrm-10", name: "ELRM 10", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 9000, slots: 2, cost: 227000, battleValue: 117, family: "elrm", tubes: 10, canonTag: "extended-lrm-10", ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 5, 7, 9], "costPerTon": 90000, "bvPerTon": 15}], notes: note("") },
    { tag: "micro-improved-narc-launcher", name: "Improved Narc Launcher", kind: "missile", heat: 0, damage: "*", weightKg: 5000, slots: 3, cost: 250000, battleValue: 75, canonTag: "inarc", ammo: [{"type": "standard", "shotsPerQuarterTon": [1, 2, 3, 4], "costPerTon": 7500, "bvPerTon": 15}], notes: note("") },
    { tag: "micro-grenade-launcher", name: "Grenade Launcher", kind: "missile", heat: 0, damage: 1, weightKg: 100, slots: 1, cost: 3000, battleValue: 2, range: {"min": 0, "short": 1, "medium": 2, "long": 3}, rangeSource: "Combat Equipment (FanPro 35017), RPG Support Weapon Conversion Table, p.111, Heavy Grenade Launcher (the Tunnel Rat's \"Thumper class Heavy Grenade Launcher\"). Maximum Tech's 'Mech Grenade Launcher (0.5 t, fires into three adjacent hexes) is a different weapon", ammo: [{"type": "standard", "shotsPerQuarterTon": [6, 12, 18, 24], "costPerTon": 400, "bvPerTon": 1}], notes: note("") },
    { tag: "micro-mech-mortar-1", name: "'Mech Mortar 1", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 2000, slots: 1, cost: 30000, battleValue: 22, family: "mech-mortar", tubes: 1, canonTag: "mech-mortar-1", ammo: [{"type": "standard", "shotsPerQuarterTon": [6, 12, 18, 24], "costPerTon": 30000, "bvPerTon": 3}], notes: note("") },
    { tag: "micro-mech-mortar-2", name: "'Mech Mortar 2", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 5000, slots: 2, cost: 100000, battleValue: 31, family: "mech-mortar", tubes: 2, canonTag: "mech-mortar-2", ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 6, 9, 12], "costPerTon": 30000, "bvPerTon": 4}], notes: note("") },
    { tag: "micro-mortar-light", name: "Mortar (Light)", kind: "missile", heat: 0, damage: 3, weightKg: 300, slots: 1, cost: 1400, battleValue: 9, range: {"min": 1, "short": 1, "medium": 2, "long": 3}, rangeSource: "Combat Equipment (FanPro 35017), RPG Support Weapon Conversion Table, p.111 (\"Min. Range 1\")", ammo: [{"type": "standard", "shotsPerQuarterTon": [25, 50, 75, 100], "costPerTon": 600, "bvPerTon": 1}], notes: note("") },
    { tag: "micro-mortar-heavy", name: "Mortar (Heavy)", kind: "missile", heat: 0, damage: 3, weightKg: 300, slots: 2, cost: 1800, battleValue: 17, range: {"min": 2, "short": 2, "medium": 4, "long": 6}, rangeSource: "Combat Equipment (FanPro 35017), RPG Support Weapon Conversion Table, p.111 (\"Min. Range 2\")", ammo: [{"type": "standard", "shotsPerQuarterTon": [6, 12, 18, 24], "costPerTon": 800, "bvPerTon": 2}], notes: note("") },
    { tag: "micro-lrm-1", name: "LRM 1", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 400, slots: 1, cost: 11100, battleValue: 14, family: "lrm", tubes: 1, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [30, 60, 90, 120], "costPerTon": 30000, "bvPerTon": 2}], notes: note("No book prints an LRM 1; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-2", name: "LRM 2", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 800, slots: 1, cost: 22200, battleValue: 20, family: "lrm", tubes: 2, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [15, 30, 45, 60], "costPerTon": 30000, "bvPerTon": 2}], notes: note("No book prints an LRM 2; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-3", name: "LRM 3", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 1200, slots: 1, cost: 33300, battleValue: 29, family: "lrm", tubes: 3, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [10, 20, 30, 40], "costPerTon": 30000, "bvPerTon": 4}], notes: note("No book prints an LRM 3; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-4", name: "LRM 4", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 1600, slots: 1, cost: 44400, battleValue: 38, family: "lrm", tubes: 4, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [8, 15, 23, 30], "costPerTon": 30000, "bvPerTon": 5}], notes: note("No book prints an LRM 4; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-5", name: "LRM 5", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 2000, slots: 1, cost: 55500, battleValue: 45, family: "lrm", tubes: 5, canonTag: "lrm-5", ammo: [{"type": "standard", "shotsPerQuarterTon": [6, 12, 18, 24], "costPerTon": 30000, "bvPerTon": 6}], notes: note("") },
    { tag: "micro-lrm-6", name: "LRM 6", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 2400, slots: 2, cost: 66600, battleValue: 57, family: "lrm", tubes: 6, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 30000, "bvPerTon": 7}], notes: note("No book prints an LRM 6; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-7", name: "LRM 7", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 2800, slots: 2, cost: 77700, battleValue: 63, family: "lrm", tubes: 7, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 9, 15, 17], "costPerTon": 30000, "bvPerTon": 8}], notes: note("No book prints an LRM 7; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-8", name: "LRM 8", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 3200, slots: 2, cost: 88800, battleValue: 72, family: "lrm", tubes: 8, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 8, 11, 15], "costPerTon": 30000, "bvPerTon": 9}], notes: note("No book prints an LRM 8; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-9", name: "LRM 9", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 3600, slots: 2, cost: 99900, battleValue: 78, family: "lrm", tubes: 9, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 7, 10, 13], "costPerTon": 30000, "bvPerTon": 10}], notes: note("No book prints an LRM 9; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-10", name: "LRM 10", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 4000, slots: 2, cost: 111000, battleValue: 90, family: "lrm", tubes: 10, canonTag: "lrm-10", ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 6, 9, 12], "costPerTon": 30000, "bvPerTon": 11}], notes: note("") },
    { tag: "micro-lrm-11", name: "LRM 11", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 4400, slots: 3, cost: 122100, battleValue: 99, family: "lrm", tubes: 11, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 6, 8, 10], "costPerTon": 30000, "bvPerTon": 12}], notes: note("No book prints an LRM 11; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-12", name: "LRM 12", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 4800, slots: 3, cost: 133200, battleValue: 116, family: "lrm", tubes: 12, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 5, 8, 10], "costPerTon": 30000, "bvPerTon": 14}], notes: note("No book prints an LRM 12; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-13", name: "LRM 13", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 5200, slots: 3, cost: 144300, battleValue: 118, family: "lrm", tubes: 13, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [2, 5, 8, 10], "costPerTon": 30000, "bvPerTon": 15}], notes: note("No book prints an LRM 13; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-14", name: "LRM 14", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 5600, slots: 3, cost: 155400, battleValue: 127, family: "lrm", tubes: 14, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [2, 4, 6, 9], "costPerTon": 30000, "bvPerTon": 16}], notes: note("No book prints an LRM 14; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-15", name: "LRM 15", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 6000, slots: 3, cost: 166500, battleValue: 136, family: "lrm", tubes: 15, canonTag: "lrm-15", ammo: [{"type": "standard", "shotsPerQuarterTon": [2, 4, 6, 9], "costPerTon": 30000, "bvPerTon": 17}], notes: note("") },
    { tag: "micro-lrm-16", name: "LRM 16", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 6400, slots: 4, cost: 177600, battleValue: 145, family: "lrm", tubes: 16, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [2, 4, 6, 8], "costPerTon": 30000, "bvPerTon": 18}], notes: note("No book prints an LRM 16; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-17", name: "LRM 17", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 6800, slots: 4, cost: 188700, battleValue: 154, family: "lrm", tubes: 17, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [2, 4, 6, 8], "costPerTon": 30000, "bvPerTon": 19}], notes: note("No book prints an LRM 17; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-18", name: "LRM 18", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 7200, slots: 4, cost: 199800, battleValue: 163, family: "lrm", tubes: 18, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [2, 4, 5, 7], "costPerTon": 30000, "bvPerTon": 20}], notes: note("No book prints an LRM 18; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-19", name: "LRM 19", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 7600, slots: 4, cost: 210900, battleValue: 172, family: "lrm", tubes: 19, canonTag: "lrm-5", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [2, 3, 5, 6], "costPerTon": 30000, "bvPerTon": 22}], notes: note("No book prints an LRM 19; range and date extrapolated by NGCFells from its launcher family (lrm-5).") },
    { tag: "micro-lrm-20", name: "LRM 20", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 8000, slots: 4, cost: 222000, battleValue: 181, family: "lrm", tubes: 20, canonTag: "lrm-20", ammo: [{"type": "standard", "shotsPerQuarterTon": [2, 3, 5, 6], "costPerTon": 30000, "bvPerTon": 23}], notes: note("") },
    { tag: "micro-mrm-1", name: "MRM 1", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 400, slots: 1, cost: 7500, battleValue: 9, family: "mrm", tubes: 1, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [60, 120, 180, 240], "costPerTon": 5000, "bvPerTon": 1}], notes: note("No book prints an MRM 1; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-2", name: "MRM 2", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 800, slots: 1, cost: 15000, battleValue: 13, family: "mrm", tubes: 2, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [30, 60, 90, 120], "costPerTon": 5000, "bvPerTon": 2}], notes: note("No book prints an MRM 2; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-3", name: "MRM 3", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 1200, slots: 1, cost: 22500, battleValue: 18, family: "mrm", tubes: 3, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [20, 40, 60, 80], "costPerTon": 5000, "bvPerTon": 2}], notes: note("No book prints an MRM 3; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-4", name: "MRM 4", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 1600, slots: 1, cost: 30000, battleValue: 23, family: "mrm", tubes: 4, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [15, 30, 45, 60], "costPerTon": 5000, "bvPerTon": 3}], notes: note("No book prints an MRM 4; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-5", name: "MRM 5", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 2000, slots: 1, cost: 37500, battleValue: 28, family: "mrm", tubes: 5, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [12, 24, 36, 48], "costPerTon": 5000, "bvPerTon": 4}], notes: note("No book prints an MRM 5; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-6", name: "MRM 6", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 2400, slots: 1, cost: 45000, battleValue: 35, family: "mrm", tubes: 6, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [10, 20, 30, 40], "costPerTon": 5000, "bvPerTon": 4}], notes: note("No book prints an MRM 6; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-7", name: "MRM 7", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 2800, slots: 1, cost: 52500, battleValue: 39, family: "mrm", tubes: 7, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [9, 17, 26, 34], "costPerTon": 5000, "bvPerTon": 5}], notes: note("No book prints an MRM 7; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-8", name: "MRM 8", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 3200, slots: 1, cost: 60000, battleValue: 45, family: "mrm", tubes: 8, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [8, 15, 23, 30], "costPerTon": 5000, "bvPerTon": 6}], notes: note("No book prints an MRM 8; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-9", name: "MRM 9", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 3600, slots: 1, cost: 67500, battleValue: 48, family: "mrm", tubes: 9, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [7, 14, 20, 27], "costPerTon": 5000, "bvPerTon": 6}], notes: note("No book prints an MRM 9; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-10", name: "MRM 10", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 4000, slots: 1, cost: 75000, battleValue: 56, family: "mrm", tubes: 10, canonTag: "mrm-10", ammo: [{"type": "standard", "shotsPerQuarterTon": [6, 12, 18, 24], "costPerTon": 5000, "bvPerTon": 7}], notes: note("") },
    { tag: "micro-mrm-11", name: "MRM 11", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 4400, slots: 2, cost: 82500, battleValue: 62, family: "mrm", tubes: 11, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [6, 11, 17, 22], "costPerTon": 5000, "bvPerTon": 8}], notes: note("No book prints an MRM 11; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-12", name: "MRM 12", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 4800, slots: 2, cost: 90000, battleValue: 72, family: "mrm", tubes: 12, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 5000, "bvPerTon": 9}], notes: note("No book prints an MRM 12; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-13", name: "MRM 13", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 5200, slots: 2, cost: 97500, battleValue: 73, family: "mrm", tubes: 13, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 14, 19], "costPerTon": 5000, "bvPerTon": 9}], notes: note("No book prints an MRM 13; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-14", name: "MRM 14", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 5600, slots: 2, cost: 105000, battleValue: 78, family: "mrm", tubes: 14, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 9, 13, 17], "costPerTon": 5000, "bvPerTon": 10}], notes: note("No book prints an MRM 14; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-15", name: "MRM 15", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 6000, slots: 2, cost: 112500, battleValue: 84, family: "mrm", tubes: 15, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 8, 12, 16], "costPerTon": 5000, "bvPerTon": 10}], notes: note("No book prints an MRM 15; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-16", name: "MRM 16", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 6400, slots: 2, cost: 120000, battleValue: 90, family: "mrm", tubes: 16, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 8, 11, 15], "costPerTon": 5000, "bvPerTon": 11}], notes: note("No book prints an MRM 16; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-17", name: "MRM 17", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 6800, slots: 2, cost: 127500, battleValue: 95, family: "mrm", tubes: 17, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 7, 11, 14], "costPerTon": 5000, "bvPerTon": 12}], notes: note("No book prints an MRM 17; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-18", name: "MRM 18", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 7200, slots: 2, cost: 135000, battleValue: 101, family: "mrm", tubes: 18, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 7, 10, 13], "costPerTon": 5000, "bvPerTon": 13}], notes: note("No book prints an MRM 18; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-19", name: "MRM 19", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 7600, slots: 2, cost: 142500, battleValue: 106, family: "mrm", tubes: 19, canonTag: "mrm-10", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 7, 10, 13], "costPerTon": 5000, "bvPerTon": 13}], notes: note("No book prints an MRM 19; range and date extrapolated by NGCFells from its launcher family (mrm-10).") },
    { tag: "micro-mrm-20", name: "MRM 20", kind: "missile", heat: 0, damage: "1/Hit", weightKg: 8000, slots: 2, cost: 150000, battleValue: 112, family: "mrm", tubes: 20, canonTag: "mrm-20", ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 6, 9, 12], "costPerTon": 5000, "bvPerTon": 14}], notes: note("") },
    { tag: "micro-srm-1", name: "SRM 1", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 500, slots: 1, cost: 12500, battleValue: 15, family: "srm", tubes: 1, canonTag: "srm-2", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [25, 50, 75, 100], "costPerTon": 27000, "bvPerTon": 2}], notes: note("No book prints an SRM 1; range and date extrapolated by NGCFells from its launcher family (srm-2).") },
    { tag: "micro-srm-2", name: "SRM 2", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 1000, slots: 1, cost: 25000, battleValue: 21, family: "srm", tubes: 2, canonTag: "srm-2", ammo: [{"type": "standard", "shotsPerQuarterTon": [13, 25, 38, 50], "costPerTon": 27000, "bvPerTon": 3}], notes: note("") },
    { tag: "micro-srm-3", name: "SRM 3", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 1500, slots: 1, cost: 37500, battleValue: 30, family: "srm", tubes: 3, canonTag: "srm-2", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [9, 17, 25, 33], "costPerTon": 27000, "bvPerTon": 4}], notes: note("No book prints an SRM 3; range and date extrapolated by NGCFells from its launcher family (srm-2).") },
    { tag: "micro-srm-4", name: "SRM 4", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 2000, slots: 2, cost: 50000, battleValue: 39, family: "srm", tubes: 4, canonTag: "srm-4", ammo: [{"type": "standard", "shotsPerQuarterTon": [7, 13, 19, 25], "costPerTon": 27000, "bvPerTon": 5}], notes: note("") },
    { tag: "micro-srm-5", name: "SRM 5", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 2500, slots: 2, cost: 62500, battleValue: 47, family: "srm", tubes: 5, canonTag: "srm-2", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 27000, "bvPerTon": 6}], notes: note("No book prints an SRM 5; range and date extrapolated by NGCFells from its launcher family (srm-2).") },
    { tag: "micro-srm-6", name: "SRM 6", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 3000, slots: 2, cost: 75000, battleValue: 59, family: "srm", tubes: 6, canonTag: "srm-6", ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 8, 12, 15], "costPerTon": 27000, "bvPerTon": 7}], notes: note("") },
    { tag: "micro-streak-srm-1", name: "Streak SRM 1", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 750, slots: 1, cost: 18750, battleValue: 15, family: "streak-srm", tubes: 1, canonTag: "streak-srm-2", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [25, 50, 75, 100], "costPerTon": 54000, "bvPerTon": 2}], notes: note("No book prints an Streak SRM 1; range and date extrapolated by NGCFells from its launcher family (streak-srm-2).") },
    { tag: "micro-streak-srm-2", name: "Streak SRM 2", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 1500, slots: 1, cost: 37500, battleValue: 30, family: "streak-srm", tubes: 2, canonTag: "streak-srm-2", ammo: [{"type": "standard", "shotsPerQuarterTon": [13, 25, 38, 50], "costPerTon": 54000, "bvPerTon": 4}], notes: note("") },
    { tag: "micro-streak-srm-3", name: "Streak SRM 3", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 2250, slots: 1, cost: 56250, battleValue: 44, family: "streak-srm", tubes: 3, canonTag: "streak-srm-2", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [9, 17, 25, 33], "costPerTon": 54000, "bvPerTon": 6}], notes: note("No book prints an Streak SRM 3; range and date extrapolated by NGCFells from its launcher family (streak-srm-2).") },
    { tag: "micro-streak-srm-4", name: "Streak SRM 4", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 3000, slots: 2, cost: 75000, battleValue: 59, family: "streak-srm", tubes: 4, canonTag: "streak-srm-4", ammo: [{"type": "standard", "shotsPerQuarterTon": [7, 13, 19, 25], "costPerTon": 54000, "bvPerTon": 7}], notes: note("") },
    { tag: "micro-streak-srm-5", name: "Streak SRM 5", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 3750, slots: 2, cost: 93750, battleValue: 74, family: "streak-srm", tubes: 5, canonTag: "streak-srm-2", rangeExtrapolated: true, ammo: [{"type": "standard", "shotsPerQuarterTon": [5, 10, 15, 20], "costPerTon": 54000, "bvPerTon": 9}], notes: note("No book prints an Streak SRM 5; range and date extrapolated by NGCFells from its launcher family (streak-srm-2).") },
    { tag: "micro-streak-srm-6", name: "Streak SRM 6", kind: "missile", heat: 0, damage: "2/Hit", weightKg: 4500, slots: 2, cost: 112500, battleValue: 89, family: "streak-srm", tubes: 6, canonTag: "streak-srm-6", ammo: [{"type": "standard", "shotsPerQuarterTon": [4, 8, 12, 15], "costPerTon": 54000, "bvPerTon": 11}], notes: note("") },
    { tag: "micro-narc-missile-beacon", name: "Narc Missile Beacon", kind: "missile", heat: 0, damage: "*", weightKg: 3000, slots: 2, cost: 100000, battleValue: 30, canonTag: "narc", ammo: [{"type": "standard", "shotsPerQuarterTon": [1, 3, 4, 6], "costPerTon": 6000, "bvPerTon": 0}], notes: note("") },
    { tag: "micro-rocket-launcher-10", name: "Rocket Launcher 10", kind: "missile", heat: 0, damage: 10, weightKg: 500, slots: 1, cost: 15000, battleValue: 18, canonTag: "rocket-launcher-10", oneShot: true, notes: note("One shot: the ammunition table prints no shots for it.") },
    { tag: "micro-rocket-launcher-15", name: "Rocket Launcher 15", kind: "missile", heat: 0, damage: 15, weightKg: 1000, slots: 2, cost: 30000, battleValue: 23, canonTag: "rocket-launcher-15", oneShot: true, notes: note("One shot: the ammunition table prints no shots for it.") },
    { tag: "micro-rocket-launcher-20", name: "Rocket Launcher 20", kind: "missile", heat: 0, damage: 20, weightKg: 1500, slots: 3, cost: 45000, battleValue: 24, canonTag: "rocket-launcher-20", oneShot: true, notes: note("One shot: the ammunition table prints no shots for it.") },
    { tag: "micro-thunderbolt-5", name: "Thunderbolt 5", kind: "missile", heat: 0, damage: 5, weightKg: 3000, slots: 1, cost: 50000, battleValue: 64, canonTag: "thunderbolt-5", ammo: [{"type": "standard", "shotsPerQuarterTon": [3, 6, 9, 12], "costPerTon": 50000, "bvPerTon": 8}], notes: note("") },
    { tag: "micro-thunderbolt-10", name: "Thunderbolt 10", kind: "missile", heat: 0, damage: 10, weightKg: 7000, slots: 2, cost: 175000, battleValue: 127, canonTag: "thunderbolt-10", ammo: [{"type": "standard", "shotsPerQuarterTon": [1, 3, 4, 6], "costPerTon": 50000, "bvPerTon": 16}], notes: note("") },
    { tag: "micro-thunderbolt-os-unbound", name: "Thunderbolt OS (Unbound)", kind: "missile", heat: 0, damage: "10+Heat", weightKg: 1000, slots: 1, cost: 250000, battleValue: 40, canonTag: "thunderbolt-10-os", rangeExtrapolated: true, oneShot: true, notes: note("No book read prints this weapon. Range extrapolated by NGCFells from the Thunderbolt family (Thunderbolt 10 OS); the document's BattleForce 2 appendix lists it as Medium Range.") },
    { tag: "micro-angel-ecm", name: "Angel ECM", kind: "equipment", heat: 0, damage: 0, weightKg: 2000, slots: 2, cost: 750000, battleValue: 100, canonTag: "angel-ecm", notes: note("") },
    { tag: "micro-artemis-iv-fcs", name: "Artemis IV FCS", kind: "equipment", heat: 0, damage: 0, weightKg: 1000, slots: 1, cost: 100000, battleValue: null, bvNote: "Increase by 20 percent the BV of any missile launcher equipped with Artemis IV; not its ammunition.", notes: note("Battle Value: increase by 20 percent the BV of a missile launcher fitted with Artemis IV (not its ammunition).") },
    { tag: "micro-beagle-active-probe", name: "Beagle Active Probe", kind: "equipment", heat: 0, damage: 0, weightKg: 1500, slots: 2, cost: 200000, battleValue: 10, canonTag: "beagle-active-probe", notes: note("") },
    { tag: "micro-bloodhound-active-probe", name: "Bloodhound Active Probe", kind: "equipment", heat: 0, damage: 0, weightKg: 2000, slots: 3, cost: 500000, battleValue: 25, canonTag: "bloodhound-active-probe", notes: note("") },
    { tag: "micro-case", name: "CASE", kind: "equipment", heat: 0, damage: 0, weightKg: 500, slots: 1, cost: 50000, battleValue: null, bvNote: "Used in the Defensive Battle Rating; no BV of its own.", canonTag: "case", notes: note("") },
    { tag: "micro-case-ii", name: "CASE II", kind: "equipment", heat: 0, damage: 0, weightKg: 1000, slots: 1, cost: 175000, battleValue: null, bvNote: "Used in the Defensive Battle Rating; no BV of its own.", canonTag: "case-ii", notes: note("") },
    { tag: "micro-c3-master-computer", name: "C3 Master Computer", kind: "equipment", heat: 0, damage: 0, weightKg: 5000, slots: 5, cost: 1500000, battleValue: null, bvNote: "See p.157, BMR Revised.", canonTag: "c3-computer-master", notes: note("") },
    { tag: "micro-c3-slave", name: "C3 Slave", kind: "equipment", heat: 0, damage: 0, weightKg: 1000, slots: 1, cost: 250000, battleValue: null, bvNote: "See p.157, BMR Revised.", canonTag: "c3-computer-slave", notes: note("") },
    { tag: "micro-c3i-computer", name: "C3i Computer", kind: "equipment", heat: 0, damage: 0, weightKg: 2500, slots: 2, cost: 750000, battleValue: null, bvNote: "See p.157, BMR Revised.", canonTag: "c3i-computer", notes: note("") },
    { tag: "micro-guardian-ecm-suite", name: "Guardian ECM Suite", kind: "equipment", heat: 0, damage: 0, weightKg: 1500, slots: 2, cost: 200000, battleValue: 61, canonTag: "ecm-suite", notes: note("") },
    { tag: "micro-target-acquisition-gear-tag", name: "Target Acquisition Gear (TAG)", kind: "equipment", heat: 0, damage: 0, weightKg: 1000, slots: 1, cost: 50000, battleValue: null, bvNote: "See p.158, BMR Revised.", canonTag: "is-tag", notes: note("") },
];

/** Alpha Strike codes for the equipment rows whose catalog record lists none of its own. */
const MICRO_MECH_EQUIPMENT_ABILITIES: Record<string, string[]> = {
    "micro-guardian-ecm-suite": ["ECM"],
    "micro-c3-master-computer": ["C3M"],
    "micro-c3-slave": ["C3S"],
    "micro-case": ["CASE"],
};

export const findMicroMechItem = (tag: unknown): IMicroMechItem | undefined =>
    typeof tag === "string" ? microMechItems.find((item) => item.tag === tag) : undefined;

export const isMicroMechWeapon = (item: IMicroMechItem): boolean => item.kind !== "equipment";

/** Shots in a lot: the table's column for each part ton, its 1,000 kg column for each whole ton. */
export const getMicroMechAmmoShots = (ammo: IMicroMechAmmo, kg: number, rule: "table" | "fraction-of-ton" = "table"): number => {
    if (kg <= 0) return 0;
    const perTon = ammo.shotsPerQuarterTon[3];
    const tons = Math.floor(kg / 1000);
    const part = Math.round((kg - tons * 1000) / 250);
    if (rule === "fraction-of-ton") return tons * perTon + Math.floor(perTon * part / 4);
    return tons * perTon + (part > 0 ? ammo.shotsPerQuarterTon[part - 1] : 0);
};

const canonRecord = (item: IMicroMechItem) => item.canonTag
    ? findUnitCatalogRecord("is", item.canonTag) ?? findUnitCatalogRecord("universal", item.canonTag)
    : undefined;

/** The weapon's range: the book read for it (`range`), else the JBT catalog record's (`canonTag`); null for equipment with none. */
export const getMicroMechItemRange = (item: IMicroMechItem): IMicroMechRange | null => {
    if (item.range) return item.range;
    const record = canonRecord(item);
    if (!record?.range) return null;
    const { min, short, medium, long, extreme } = record.range as IMicroMechRange;
    return { min: min ?? 0, short, medium, long, ...(extreme ? { extreme } : {}) };
};

/** The weapon's introduction date from the JBT catalog record; null where we have none (no date limit applies to it). */
export const getMicroMechItemIntroduced = (item: IMicroMechItem): number | null => {
    const record = canonRecord(item);
    return typeof record?.introduced === "number" ? record.introduced : null;
};

/** The JBT catalog's Battle Value 2 figures for a table row, for the provisional BV2 (NGCFells's ruling 2). */
export interface IMicroMechBattleValue2 {
    /** The item's BV2: the JBT catalog's for the same item, else the document's own figure; 0 where the table prints a letter note. */
    battleValue: number;
    /** False where no book prints a BV2 for the item (an odd tube count, a recoilless rifle) and the document's figure is kept. */
    fromCatalog: boolean;
    /** Ammunition BV2 per ton, with the same fallback. */
    ammoPerTon: number;
    ammoFromCatalog: boolean;
    /** The catalog marks the item defensive (ECM, active probes). */
    defensive: boolean;
}

/**
 * A row's BV2 figures. Only a row whose `canonTag` names the same item is read from the catalog: a tube count whose
 * range was extrapolated from its launcher family has no BV2 figure anywhere.
 */
export const getMicroMechItemBattleValue2 = (item: IMicroMechItem): IMicroMechBattleValue2 => {
    const record = item.rangeExtrapolated ? undefined : canonRecord(item);
    const fromCatalog = typeof record?.battleValue === "number";
    const ammoFromCatalog = typeof record?.ammoBattleValue === "number";
    return {
        battleValue: item.battleValue === null ? 0 : fromCatalog ? record!.battleValue! : item.battleValue,
        fromCatalog: fromCatalog || item.battleValue === null,
        ammoPerTon: ammoFromCatalog ? record!.ammoBattleValue! : item.ammo?.[0]?.bvPerTon ?? 0,
        ammoFromCatalog,
        defensive: canonRecord(item)?.battleValueDefensive === true,
    };
};

// Alpha Strike (our ruleset: docs/superpowers/specs/2026-11-14-micro-mech-alpha-strike.md, section 2) -------------------

/** The Cluster Hits Table at a roll of 7, by tube count (TW p.116; the sizes it does not print are interpolated by us). */
const CLUSTER_HITS_ON_7: number[] = [0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12];
/** The same table at a roll of 9, for a launcher with Artemis IV. */
const CLUSTER_HITS_ON_9: number[] = [0, 1, 2, 2, 3, 4, 5, 6, 6, 7, 8, 9, 10, 10, 11, 12, 13, 14, 14, 15, 16];
/** The tube count of the catalog record a launcher family's odd sizes are read from. */
const FAMILY_RECORD_TUBES: Record<string, number> = { lrm: 5, elrm: 5, mrm: 10, srm: 2, "streak-srm": 2 };
/** Rows whose printed damage differs from the catalog weapon they borrow a range from: the share of its value they keep. */
const ALPHA_STRIKE_DAMAGE_SHARE: Record<string, number> = { "micro-caseless-ac-5": 2 / 5 };
/** Heat Values at short, medium and long range (Heat-Generating Weaponry Table, ASC p.124). */
const ALPHA_STRIKE_HEAT: Record<string, number[]> = {
    "micro-flamer": [2, 0, 0],
    "micro-flamer-vehicle": [2, 0, 0],
    "micro-flamer-heavy": [4, 0, 0],
};

export type MicroMechAlphaStrikeSource = "catalog" | "cluster" | "ours" | "none";

export interface IMicroMechAlphaStrikeValue {
    /** Damage at Short, Medium and Long range, before shots, one-shot and rounding. */
    damage: [number, number, number];
    /** "catalog": the Companion's value for the same weapon; "cluster": an odd tube count; "ours": damage / 10 by range. */
    source: MicroMechAlphaStrikeSource;
    /** Counts toward the LRM, SRM, AC and FLK abilities and Indirect Fire. */
    lrm: boolean; srm: boolean; ac: boolean; flak: boolean; indirect: boolean;
    /** Heat Values at each range, for the HT ability. */
    heat: number[];
    /** Special ability codes the item itself gives (ECM, PRB, TAG ...). */
    abilities: string[];
    /** Shots under which the value is multiplied by 0.75 (ASC p.101); 0 for a weapon with no ammunition. */
    fewShots: number;
}

/** A table row's Alpha Strike figures. `artemis`: the launcher has an Artemis IV FCS. */
export const getMicroMechItemAlphaStrike = (item: IMicroMechItem, artemis: boolean = false): IMicroMechAlphaStrikeValue => {
    const record = canonRecord(item);
    const notes = (record?.alphaStrike?.notes ?? []).map((note: string) => note.trim().toLowerCase());
    const result: IMicroMechAlphaStrikeValue = {
        damage: [0, 0, 0], source: "none",
        lrm: notes.includes("lrm"), srm: notes.includes("srm"), ac: notes.includes("ac"), flak: notes.includes("flak"),
        indirect: notes.includes("indirect fire"),
        heat: ALPHA_STRIKE_HEAT[item.tag] ?? [0, 0, 0],
        abilities: [],
        fewShots: !item.ammo ? 0 : /rotary/.test(item.tag) ? 60 : /ultra/.test(item.tag) ? 20 : 10,
    };
    if (!isMicroMechWeapon(item)) {
        const own = record?.alphaStrike?.specialAbility ?? [];
        result.abilities = own.length > 0 ? [...own] : MICRO_MECH_EQUIPMENT_ABILITIES[item.tag] ?? [];
        return result;
    }
    result.abilities = [...(record?.alphaStrike?.specialAbility ?? [])];
    const values = (source: typeof record): [number, number, number] =>
        [source?.alphaStrike?.rangeShort || 0, source?.alphaStrike?.rangeMedium || 0, source?.alphaStrike?.rangeLong || 0];
    if (item.family && item.tubes && item.rangeExtrapolated && record) {
        // An odd tube count: the family's value for one missile hit x the hits of this size at a roll of 7 (9 with Artemis IV).
        const familyTubes = FAMILY_RECORD_TUBES[item.family] ?? item.tubes;
        const streak = item.family.startsWith("streak");
        const familyHits = streak ? familyTubes : CLUSTER_HITS_ON_7[familyTubes];
        const hits = streak ? item.tubes : (artemis ? CLUSTER_HITS_ON_9 : CLUSTER_HITS_ON_7)[item.tubes] ?? item.tubes;
        result.damage = values(record).map((value) => value / familyHits * hits) as [number, number, number];
        result.source = "cluster";
    } else if (record?.alphaStrike) {
        const withArtemis = artemis && item.canonTag ? findUnitCatalogRecord("is", `${item.canonTag}-artemis-iv`) : undefined;
        const share = ALPHA_STRIKE_DAMAGE_SHARE[item.tag] ?? 1;
        result.damage = values(withArtemis ?? record).map((value) => value * share) as [number, number, number];
        result.source = "catalog";
    } else if (item.range && typeof item.damage === "number") {
        // No book converts this weapon: damage / 10 at each bracket its range reaches, halved at Short for a minimum range.
        const value = item.damage / 10;
        result.damage = [item.range.min > 0 ? value / 2 : value, item.range.long > 3 ? value : 0, item.range.long > 15 ? value : 0];
        result.source = "ours";
    }
    // "Other One-Shot Missile Weapons" x 0.1; a rocket launcher's table value already counts its one shot (ASC p.101).
    if (item.oneShot && !/rocket-launcher/.test(item.tag)) result.damage = result.damage.map((value) => value * 0.1) as [number, number, number];
    return result;
};
