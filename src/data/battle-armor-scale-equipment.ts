/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All lore, stats, and intellectual property belong strictly to Catalyst Game Labs,
 * Topps, and their respective rights holders.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 *
 * Vehicle-Mounted Battle Armor Equipment: BattleTech Adventures: Ghosts of Obeedah pp.53-54
 * (Experimental; introduced about 3095 by the Word of Blake). Battle armor weapons may be mounted on
 * 'Mechs, vehicles and other non-infantry units. Such a unit "uses the Fractional Accounting
 * construction option by default" (p.54).
 */

import { IEquipmentItem } from "./data-interfaces";

/** "Introduced: ca. 3095 (Word of Blake)" (Ghosts of Obeedah p.53). */
const INTRODUCED = 3095;
const BOOK = "Ghosts of Obeedah";
const PAGE = 54;

type TechBase = "is" | "clan";
type Kind = "energy" | "ballistic";

interface IBattleArmorWeaponRow {
    techBase: TechBase;
    name: string;
    kind: Kind;
    damage: number | [number, number, number];
    /** Short, medium and long range in hexes; 0 where the table prints a dash. */
    range: [number, number, number];
    /** Weight on a battle armor suit, in kilograms. */
    kg: number;
    /** Weight of one shot, in kilograms (the "Ammo Weight" column). */
    kgPerShot: number;
    battleValue: number;
    cbills: number;
    /** Where the weapon's own figures are printed. */
    source: string;
    /** Alpha Strike damage at short, medium and long range (ASC pp.105-113). */
    alphaStrike: [number, number, number];
    accuracyModifier?: number | [number, number, number];
    weaponType: string[];
    alphaStrikeSpecial?: string;
}

const row = (techBase: TechBase, name: string, kind: Kind, damage: number | [number, number, number], range: [number, number, number],
    kg: number, kgPerShot: number, battleValue: number, cbills: number, source: string, alphaStrike: [number, number, number],
    weaponType: string[], extra: Partial<IBattleArmorWeaponRow> = {}): IBattleArmorWeaponRow =>
    ({ techBase, name, kind, damage, range, kg, kgPerShot, battleValue, cbills, source, alphaStrike, weaponType, ...extra });

const TM_IS = "TM p.346";
const TM_IS_2 = "TM p.347";
const TM_CLAN = "TM p.348";

// Rows both Battle Armor Equipment Tables print with the same figures. "AI" marks the weapons the tables star as
// anti-infantry; the other type codes are the weapon's class.
const sharedRows = (techBase: TechBase): IBattleArmorWeaponRow[] => {
    const tm = techBase === "is" ? TM_IS : TM_CLAN;
    return [
        row(techBase, "Heavy Grenade Launcher", "ballistic", 1, [1, 2, 3], 100, 0.25, 2, 4500, tm, [0.1, 0, 0], ["DB", "AI"]),
        row(techBase, "Light Machine Gun", "ballistic", 1, [2, 4, 6], 75, 0.1, 5, 5000, tm, [0.1, 0.1, 0], ["DB", "AI"]),
        row(techBase, "Machine Gun", "ballistic", 2, [1, 2, 3], 100, 0.1, 5, 5000, tm, [0.2, 0, 0], ["DB", "AI"]),
        row(techBase, "Heavy Machine Gun", "ballistic", 3, [1, 2, 0], 150, 0.1, 6, 7500, tm, [0.3, 0, 0], ["DB", "AI"]),
        row(techBase, "Light Recoilless Rifle", "ballistic", 2, [2, 4, 6], 175, 1, 12, 1000, tm, [0.2, 0.2, 0], ["DB", "AI"]),
        row(techBase, "Medium Recoilless Rifle", "ballistic", 3, [2, 4, 6], 250, 2, 19, 3000, tm, [0.3, 0.3, 0], ["DB", "AI"]),
        row(techBase, "Heavy Recoilless Rifle", "ballistic", 3, [3, 5, 7], 325, 4, 22, 5000, tm, [0.3, 0.3, 0], ["DB", "AI"]),
        row(techBase, "Flamer", "energy", 2, [1, 2, 3], 150, 0.5, 5, 7500, tm, [0.2, 0, 0], ["DE", "AI"]),
        row(techBase, "Heavy Flamer", "energy", 4, [2, 3, 4], 350, 1, 15, 11250, "TO:AUE p.124", [0.4, 0.4, 0], ["DE", "AI"]),
        row(techBase, "Small Laser", "energy", 3, [1, 2, 3], 200, 0.16, 9, 11250, tm, [0.3, 0, 0], ["DE"]),
        row(techBase, "Light TAG", "energy", 0, [3, 6, 9], 35, 0.08, 0, 40000, techBase === "is" ? TM_IS_2 : TM_CLAN, [0, 0, 0], [], { alphaStrikeSpecial: "LTAG" }),
    ];
};

const rows: IBattleArmorWeaponRow[] = [
    // Inner Sphere Battle Armor Equipment Table (TM pp.346-347)
    row("is", "David Light Gauss Rifle", "ballistic", 1, [3, 5, 8], 100, 0.75, 7, 22500, TM_IS, [0.1, 0.1, 0], ["DB"]),
    row("is", "King David Light Gauss Rifle", "ballistic", 1, [3, 6, 9], 275, 0.75, 7, 30000, TM_IS, [0.1, 0.1, 0], ["DB"]),
    row("is", "Magshot Gauss Rifle", "ballistic", 2, [3, 6, 9], 175, 0.5, 15, 10500, TM_IS, [0.2, 0.2, 0], ["DB"]),
    row("is", "Grand Mauler Gauss Rifle", "ballistic", 1, [2, 4, 5], 125, 1, 6, 8000, TM_IS, [0.1, 0.1, 0], ["DB"]),
    row("is", "Tsunami Gauss Rifle", "ballistic", 1, [2, 4, 5], 125, 1, 6, 9500, TM_IS, [0.1, 0.1, 0], ["DB"]),
    row("is", "Micro Grenade Launcher", "ballistic", 1, [1, 2, 0], 75, 0.25, 1, 1950, TM_IS, [0.1, 0, 0], ["DB", "AI"]),
    row("is", "ER Small Laser", "energy", 3, [2, 4, 5], 350, 0.25, 17, 11250, TM_IS, [0.3, 0.3, 0], ["DE"]),
    row("is", "ER Medium Laser", "energy", 5, [4, 8, 12], 800, 0.25, 62, 80000, TM_IS, [0.5, 0.5, 0], ["DE"]),
    row("is", "Medium Laser", "energy", 5, [3, 6, 9], 500, 0.5, 46, 40000, TM_IS, [0.5, 0.5, 0], ["DE"]),
    row("is", "Small Pulse Laser", "energy", 3, [1, 2, 3], 400, 0.35, 12, 16000, TM_IS, [0.33, 0, 0], ["P"], { accuracyModifier: -2 }),
    row("is", "Medium Pulse Laser", "energy", 6, [2, 4, 6], 800, 0.41, 48, 60000, TM_IS_2, [0.66, 0.66, 0], ["P"], { accuracyModifier: -2 }),
    row("is", "Support PPC", "energy", 2, [2, 5, 7], 250, 0.33, 14, 14000, TM_IS_2, [0.2, 0.2, 0], ["DE"]),
    row("is", "Plasma Rifle (Man-Portable)", "energy", 2, [2, 4, 6], 300, 1.5, 12, 28000, TM_IS_2, [0.2, 0.2, 0], ["DE"]),
    row("is", "Firedrake Support Needler", "ballistic", 1, [1, 2, 3], 50, 0.16, 2, 1500, TM_IS_2, [0.1, 0, 0], ["DB", "AI"]),
    row("is", "Small Variable Speed Pulse Laser", "energy", [5, 4, 3], [2, 4, 6], 500, 0.33, 22, 60000, "TO:AUE p.133", [0.575, 0.315, 0], ["P"], { accuracyModifier: [-3, -2, -1] }),
    row("is", "Medium Variable Speed Pulse Laser", "energy", [9, 7, 5], [2, 5, 9], 900, 0.38, 56, 200000, "TO:AUE p.133", [1.035, 0.525, 0], ["P"], { accuracyModifier: [-3, -2, -1] }),
    ...sharedRows("is"),

    // Clan Battle Armor Equipment Table (TM p.348)
    row("clan", "AP Gauss Rifle", "ballistic", 3, [3, 6, 9], 200, 1.25, 21, 10000, TM_CLAN, [0.3, 0.3, 0], ["DB", "AI"]),
    // The table prints the Bearhunter's range as "-0/1/2".
    row("clan", "Bearhunter Superheavy AC", "ballistic", 3, [0, 1, 2], 150, 1.5, 4, 11250, TM_CLAN, [0.3, 0, 0], ["DB", "AI"]),
    row("clan", "ER Micro Laser", "energy", 2, [1, 2, 4], 150, 0.16, 7, 10000, TM_CLAN, [0.2, 0, 0], ["DE"]),
    row("clan", "ER Small Laser", "energy", 5, [2, 4, 6], 350, 0.25, 31, 11250, TM_CLAN, [0.5, 0.5, 0], ["DE"]),
    row("clan", "ER Medium Laser", "energy", 7, [5, 10, 15], 800, 0.25, 108, 80000, TM_CLAN, [0.7, 0.7, 0], ["DE"]),
    row("clan", "Micro Pulse Laser", "energy", 3, [1, 2, 3], 160, 0.29, 12, 12500, TM_CLAN, [0.33, 0, 0], ["P"], { accuracyModifier: -2 }),
    row("clan", "Small Pulse Laser", "energy", 3, [2, 4, 6], 400, 0.35, 24, 16000, TM_CLAN, [0.33, 0.33, 0], ["P"], { accuracyModifier: -2 }),
    row("clan", "Medium Pulse Laser", "energy", 7, [4, 8, 12], 800, 0.41, 111, 60000, TM_CLAN, [0.77, 0.77, 0], ["P"], { accuracyModifier: -2 }),
    row("clan", "Heavy Small Laser", "energy", 6, [1, 2, 3], 500, 0.25, 15, 20000, TM_CLAN, [0.57, 0, 0], ["DE"], { accuracyModifier: 1 }),
    row("clan", "Heavy Medium Laser", "energy", 10, [3, 6, 9], 1000, 0.25, 76, 100000, TM_CLAN, [0.95, 0.95, 0], ["DE"], { accuracyModifier: 1 }),
    row("clan", "Support PPC", "energy", 2, [2, 5, 7], 240, 0.35, 14, 14000, TM_CLAN, [0.2, 0.2, 0], ["DE"]),
    row("clan", "LB-X Autocannon", "ballistic", 4, [2, 5, 8], 400, 4, 20, 70000, "TO:AUE p.98", [0.315, 0.315, 0], ["DB", "C", "F"], { accuracyModifier: -1 }),
    row("clan", "ER Small Pulse Laser", "energy", 5, [2, 4, 6], 550, 0.41, 36, 30000, "TO:AUE p.132", [0.525, 0.525, 0], ["P"], { accuracyModifier: -1 }),
    row("clan", "ER Medium Pulse Laser", "energy", 7, [5, 9, 14], 800, 0.45, 117, 150000, "TO:AUE p.132", [0.735, 0.735, 0], ["P"], { accuracyModifier: -1 }),
    ...sharedRows("clan"),
];

const slug = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * "The weight of the weapon must be rounded up to the nearest multiple of 250 kilograms (0.25 tons)
 * before installation" (Ghosts of Obeedah p.54).
 */
export function getBattleArmorScaleWeight(kg: number): number {
    return Math.ceil(kg / 250 - 1e-9) * 0.25;
}

/**
 * Heat for one firing: 1 point for every 250 kg of an energy weapon's mounted weight, 1 point for every
 * 500 kg of any other weapon's (Ghosts of Obeedah p.54). A part of 500 kg gives no heat.
 */
export function getBattleArmorScaleHeat(kind: Kind, mountedWeight: number): number {
    return Math.floor(mountedWeight / (kind === "energy" ? 0.25 : 0.5) + 1e-9);
}

/**
 * Damage of exploding battle armor munitions: "20 points of damage per quarter-ton of remaining ammo",
 * whatever the weapon (Ghosts of Obeedah p.54). In proportion for part of a quarter-ton, rounded up.
 */
export function getBattleArmorScaleExplosionDamage(tons: number): number {
    return tons > 0 ? Math.ceil(tons * 80 - 1e-6) : 0;
}

const SPACE = { battlemech: 1, protomech: 1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 };
const SHOCK_NOTE = "On a unit of 5 tons or more, damage to its location disables it on a 2D6 roll of 2.";

function toWeapon(entry: IBattleArmorWeaponRow): IEquipmentItem {
    const weight = getBattleArmorScaleWeight(entry.kg);
    const heat = getBattleArmorScaleHeat(entry.kind, weight);
    const tag = `ba-${entry.techBase}-${slug(entry.name)}`;
    const damage = typeof entry.damage === "number"
        ? entry.damage
        : { short: entry.damage[0], medium: entry.damage[1], long: entry.damage[2], aeroShort: entry.damage[0], aeroMedium: 0, aeroLong: 0 };
    const accuracy = Array.isArray(entry.accuracyModifier)
        ? { short: entry.accuracyModifier[0], medium: entry.accuracyModifier[1], long: entry.accuracyModifier[2] }
        : entry.accuracyModifier ?? 0;
    const hasRange = entry.range.some((value) => value > 0);
    return {
        name: `BA-${entry.name}`,
        tag,
        sort: `ba ${entry.name.toLowerCase()}`,
        category: entry.kind === "energy" ? "Energy Weapons" : "Ballistic Weapons",
        catalog: entry.techBase,
        battleArmorScale: true,
        rulesLevel: 4,
        damage,
        damageAero: typeof entry.damage === "number" ? entry.damage : entry.damage[0],
        accuracyModifier: accuracy,
        cbills: entry.cbills,
        introduced: INTRODUCED,
        extinct: 0,
        reintroduced: 0,
        battleValue: entry.battleValue,
        heat,
        heatAero: heat,
        weight,
        range: { min: 0, short: entry.range[0], medium: entry.range[1], long: entry.range[2] },
        // "All battle armor equipment with a range value greater than 0 receive a range value of Short" on aerospace units.
        rangeAero: hasRange ? "s" : "",
        space: { ...SPACE },
        // Ballistic weapons need ammunition; an energy weapon may be fed from power cells instead of heat sinks.
        // The battle armor rows of the Battle Value tables print 0 or a dash for these weapons' ammunition (TM pp.317-318).
        ...(entry.kind === "ballistic" ? { ammoTypes: [`ammo-${tag}`], shotsPerTon: 1000 / entry.kgPerShot, ammoBattleValue: 0 } : {}),
        explosive: false,
        weaponType: entry.weaponType,
        techRating: "e",
        book: BOOK,
        page: PAGE,
        notes: `${entry.kg} kg on a suit (${entry.source}). ${SHOCK_NOTE}`,
        alphaStrike: {
            ...(entry.alphaStrikeSpecial ? { specialAbility: [entry.alphaStrikeSpecial] } : {}),
            heat,
            rangeShort: entry.alphaStrike[0],
            rangeMedium: entry.alphaStrike[1],
            rangeLong: entry.alphaStrike[2],
            rangeExtreme: 0,
            tc: false,
            notes: [],
        },
    };
}

function toAmmo(entry: IBattleArmorWeaponRow): IEquipmentItem {
    const weaponTag = `ba-${entry.techBase}-${slug(entry.name)}`;
    return {
        isAmmo: true,
        isSpecialAmmo: false,
        name: `BA-${entry.name} Ammo`,
        tag: `ammo-${weaponTag}`,
        sort: `ammo, ba ${entry.name.toLowerCase()}`,
        category: "Ammunition",
        catalog: entry.techBase,
        battleArmorScale: true,
        rulesLevel: 4,
        kgPerShot: entry.kgPerShot,
        feedsWeaponTag: weaponTag,
        // The book prices no ammunition for these weapons and the TechManual gives them no ammunition Battle Value.
        cbills: 0,
        battleValue: 0,
        introduced: INTRODUCED,
        extinct: 0,
        reintroduced: 0,
        heat: 0,
        heatAero: 0,
        // A quarter-ton bin to start with; it is then bought by the shot.
        weight: 0.25,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { ...SPACE },
        roundsPerTon: Math.floor(1000 / entry.kgPerShot + 1e-6),
        explosive: true,
        techRating: "e",
        book: BOOK,
        page: PAGE,
        notes: `${entry.kgPerShot} kg a shot (${entry.source}). Explodes for 20 points per quarter-ton left.`
            + (entry.kind === "energy" ? " Power cells: a weapon fed from them needs no heat sinks on a vehicle." : ""),
        alphaStrike: { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] },
    };
}

const battleArmorScaleEquipment: IEquipmentItem[] = rows.flatMap((entry) => [toWeapon(entry), toAmmo(entry)]);

/** Battle armor weapons, and their ammunition, that a unit of the given technology base may mount. */
export function getBattleArmorScaleEquipment(techBase: TechBase): IEquipmentItem[] {
    return battleArmorScaleEquipment.filter((item) => item.catalog === techBase);
}
