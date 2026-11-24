/**
 * Battle armor Battle Value and cost step definitions (#599, the battle armor round): where each step comes from.
 *
 * BV2: Calculating Battle Armor BV, TM p.310 (worked Purifier and Grenadier pp.310-311), the Defensive Factors Table
 * with its detachable-pack footnote, the Defensive Factor Modifier Table and the Battle Armor Unit Size Modifier Table
 * on p.316, the weapon Battle Values of pp.317-318 with TM errata v6.0 p.34 (Battle Armor Equipment), TO:AUE p.192
 * (Angel ECM, armor, boosters, detachable weapon packs) and pp.195, 197 (mine dispensers), TW p.220 (body-mounted missile
 * launchers). BV1: the CBT Companion pp.187-190, the only battle armor Battle Value formula in print; BMR p.142 and
 * BMR(R) p.155 print a table of stock suits only. Cost: TM pp.281-282 (structure), 285-286 (final cost formula and the
 * trooper training cost), TO:AUE p.225, IO:AE p.180, BMR(R) p.150 (fixed prices of stock suits). Read on 2026-11-23, the
 * Companion pages on the page images (written back to the library's extracts). What each page says is in the plan's
 * "Readings": docs/superpowers/plans/2026-11-23-battle-armor-bundle-and-cited-bv.md. Change a citation only after
 * reading the page.
 */
import { getBattleValueEdition } from "./battle-value";
import { CalcStepDefs, CalcStepStatus, ICalcCitation, ICalcStepDef } from "./calc-steps";

const DEFENSIVE = "Defensive Battle Rating";
const OFFENSIVE = "Offensive Battle Rating";
const FINAL = "Final Battle Value";

const at = (source: string, page: string): ICalcCitation => ({ source, page });
const step = (section: string, cites: ICalcCitation[], status: CalcStepStatus = "cited", note?: string): ICalcStepDef =>
    note ? { section, cites, status, note } : { section, cites, status };
const provisional = (section: string, cites: ICalcCitation[], note: string): ICalcStepDef => step(section, cites, "provisional", note);

const ARM_ONLY_NOTE = "TM p.310 prints \"all direct-fire weapons\" for Swarm attacks. Only arm-mounted weapons fire in a Swarm attack (TW p.220), and those alone are counted (NGCFells ruling, 2026-10-08; MegaMek does the same).";
const BURDENED_NOTE = "TW p.220: Inner Sphere battle armor with body-mounted missile launchers cannot make anti-'Mech attacks until it jettisons them. TM p.310 counts the term when the unit \"can perform Swarm Attacks\", and the launchers can be jettisoned at any time, so the term stays (owner call 1, 2026-11-23). MegaMek leaves it out, and the Master Unit List does for a few suits.";
const APDS_NOTE = "IO:AE p.85 prints no Battle Value for the battle armor APDS. NGCFells counts it in the Defensive Battle Rating at 7, the one value that gives the Aegis Point Defense Suit the 179 (35 a suit) XTRO: Republic III prints; MegaMek's value is 7 too.";
const SQUAD_SUPPORT_NOTE = "The squad support weapon's Battle Value is divided by the troopers, as TM p.310 says. It is not added again to the Anti-'Mech attacks (NGCFells ruling, 2026-10-08).";
const CLAMP_NOTE = "Magnetic clamps are counted at Battle Value 1 under Other Equipment on every suit that carries them, as TM errata v6.0 p.34 and the Companion p.190 list them (apart from the battle claw with magnets, 3); TW p.228 makes them a riding aid (owner call 6, 2026-11-23). The Master Unit List leaves them out of a few suits.";
const SIZE_NOTE = "TM p.310 and the worked Grenadier print \"63 x 5.2 = 325.832\"; the suit's 62.66 (fractions kept, as p.310 says) x 5.2 = 325.832.";
const AVERAGE_NOTE = "The rules value one suit and multiply. Where troopers carry different equipment, the troopers' average is used, as MegaMek does.";
const UNIT_SIZE_NOTE = "The Battle Armor Unit Size Modifier Table (TM p.316) has no row for this number of troopers: 1 is used.";

export const BATTLE_ARMOR_BV2_STEPS: CalcStepDefs = {
    "ba.bv2.suit": step(FINAL, [at("tm", "310")]),
    // ---- Step 1: Defensive Battle Rating (TM p.310) ----
    // Total armor points x 2.5 (3.5 fire-resistant; TO:AUE p.192 adds laser-reflective and reactive) + 1.
    "ba.bv2.def.armor": step(DEFENSIVE, [at("tm", "310")]),
    "ba.bv2.def.armor.special": step(DEFENSIVE, [at("tm", "310"), at("toaue", "192")]),
    // +1 for each of improved sensors, active probe and ECM; Angel ECM adds 2 (TO:AUE p.192).
    "ba.bv2.def.equipment": step(DEFENSIVE, [at("tm", "310")]),
    "ba.bv2.def.apds": provisional(DEFENSIVE, [at("ioae", "85")], APDS_NOTE),
    // The Defensive Factors Table (p.316): the highest target movement modifier, +0.1 for battle armor, and the Defensive
    // Factor Modifier Table (stealth armor, camo system). A detachable weapon pack uses the best modifier (p.316 footnote).
    "ba.bv2.def.factor": step(DEFENSIVE, [at("tm", "310"), at("tm", "316")]),
    "ba.bv2.def.rating": step(DEFENSIVE, [at("tm", "310")]),

    // ---- Step 2: Offensive Battle Rating (TM p.310) ----
    "ba.bv2.off.direct": step(OFFENSIVE, [at("tm", "310"), at("tm", "317-318"), at("tm-errata-6.0", "34")]),
    "ba.bv2.off.missiles": step(OFFENSIVE, [at("tm", "310"), at("tm", "317-318"), at("tm-errata-6.0", "34")]),
    "ba.bv2.off.anti-mech": provisional(OFFENSIVE, [at("tm", "310"), at("tw", "220")], ARM_ONLY_NOTE),
    "ba.bv2.off.anti-mech.burdened": provisional(OFFENSIVE, [at("tm", "310"), at("tw", "220")], BURDENED_NOTE),
    "ba.bv2.off.anti-personnel": step(OFFENSIVE, [at("tm", "310"), at("tm", "319")]),
    "ba.bv2.off.support": provisional(OFFENSIVE, [at("tm", "310")], SQUAD_SUPPORT_NOTE),
    "ba.bv2.off.other": step(OFFENSIVE, [at("tm", "310"), at("tm", "317-318"), at("tm-errata-6.0", "34")]),
    "ba.bv2.off.other.clamps": provisional(OFFENSIVE, [at("tm", "310"), at("tm-errata-6.0", "34"), at("tw", "228")], CLAMP_NOTE),
    // A mine dispenser is a 10-point minefield of the mines it lays (TO:AUE p.195; Minefield BV Table p.197).
    "ba.bv2.off.mines": step(OFFENSIVE, [at("tm", "310"), at("toaue", "195"), at("toaue", "197")]),
    "ba.bv2.off.weapons": step(OFFENSIVE, [at("tm", "310")]),
    // The Speed Factor Table (p.316) at the movement mode with the highest rate; boosters count (TO:AUE p.192).
    "ba.bv2.off.speed": step(OFFENSIVE, [at("tm", "310"), at("tm", "316"), at("toaue", "192")]),
    "ba.bv2.off.rating": step(OFFENSIVE, [at("tm", "310")]),

    // ---- Step 3: Final Battle Value (TM p.310) ----
    "ba.bv2.final.suit": step(FINAL, [at("tm", "310")]),
    "ba.bv2.final.average": provisional(FINAL, [at("tm", "310")], AVERAGE_NOTE),
    "ba.bv2.final.size": step(FINAL, [at("tm", "310"), at("tm", "316")], "cited", SIZE_NOTE),
    "ba.bv2.final.size.unlisted": provisional(FINAL, [at("tm", "316")], UNIT_SIZE_NOTE),
};

// ---------------------------------------------------------------------------------------------------------------
// BV1: the CBT Companion pp.187-190 (the Battle Value rules for battle armor the Master Rules never printed).
// ---------------------------------------------------------------------------------------------------------------

const BMR_NOTE = "The 1998 Master Rules print only a table of stock suits (BMR p.142). The Companion's formula (pp.187-190, written for the Revised Edition) is used for it too, as the only battle armor Battle Value formula in print (owner call 7, 2026-11-23).";
const TABLE_NOTE = "The Companion's weapon and equipment Battle Values (pp.189-190) do not list this item. The Revised Master Rules' tables (pp.156-158) do not list it either, or were not matched item by item: its Total Warfare Battle Value (BV2) is used.";
const BV1_AP_NOTE = "The Companion (p.188) adds anti-personnel weapons only when the unit has no weapon of its own to fire. Their values are the TechManual's Conventional Infantry Weapons BV Table (p.319); the Companion's Anti-Personnel Weapons Table (p.190) prints values for some of the same weapons (rifle 0.25, machine gun 0.75, laser 1.5) and was not matched value by value.";
const BV1_SPEED_NOTE = "The Companion's Speed Factor Table (p.188) reads the highest movement mode in MP, 1 to 12; a movement above 12 uses the last row.";
const BV1_ROUND_NOTE = "The Companion (p.189) rounds the suit's Battle Value to a whole number and then multiplies by the suits in the unit (Elemental: 55.9224 rounds to 56, x 5 = 280). Its worked example prints \"30.1124\" for 39.12 x 0.77, which is 30.1224; the total 55.9224 is right.";

/** BV1 steps of `edition`: the Revised Edition's cited on the Companion, the 1998 Master Rules' provisional on the same pages. */
const battleArmorBv1 = (revised: boolean): CalcStepDefs => {
    const companion = (pages: string): ICalcCitation[] => [at("cbt-companion", pages)];
    const status = (section: string, pages: string): ICalcStepDef => revised ? step(section, companion(pages)) : provisional(section, companion(pages), BMR_NOTE);
    return {
        "ba.bv1.suit": status(FINAL, "187-190"),
        "ba.bv1.def.armor": status(DEFENSIVE, "187"),
        "ba.bv1.def.armor.special": provisional(DEFENSIVE, [...companion("187"), at("toaue", "192")], "The Companion gives only Fire Resistant armor the higher Battle Value (3, all other armor 2). Laser-reflective and reactive armor did not exist; TO:AUE p.192 counts them at the fire-resistant value, as BV2 does."),
        "ba.bv1.def.ecm": provisional(DEFENSIVE, companion("187"), "The Companion adds 1 if the suit mounts ECM, once. Angel ECM's 2 and the advanced point defense system's 7 are carried over from BV2 (TO:AUE p.192; IO:AE p.85)."),
        // 1.0 + 0.1 for each point of the highest Target Movement Modifier (jump included), with the Stealth Modifier Table's +2 or +3 added to it.
        "ba.bv1.def.factor": status(DEFENSIVE, "187-188"),
        "ba.bv1.def.rating": status(DEFENSIVE, "187-188"),
        "ba.bv1.off.direct": status(OFFENSIVE, "188-190"),
        "ba.bv1.off.anti-mech": provisional(OFFENSIVE, companion("188"), "The Companion adds \"all direct-fire weapons\" for a unit that can Swarm. Only arm-mounted weapons fire in a Swarm attack (TW p.220), and those alone are counted (NGCFells ruling, 2026-10-08)."),
        "ba.bv1.off.missiles": status(OFFENSIVE, "188-189"),
        "ba.bv1.off.anti-personnel": provisional(OFFENSIVE, companion("188, 190"), BV1_AP_NOTE),
        "ba.bv1.off.support": status(OFFENSIVE, "188"),
        "ba.bv1.off.other": status(OFFENSIVE, "188, 190"),
        "ba.bv1.off.unlisted": provisional(OFFENSIVE, [...companion("188, 190"), at("bmrr", "156-158")], TABLE_NOTE),
        "ba.bv1.off.weapons": status(OFFENSIVE, "188"),
        "ba.bv1.off.speed": provisional(OFFENSIVE, companion("188"), BV1_SPEED_NOTE),
        "ba.bv1.off.rating": status(OFFENSIVE, "188"),
        "ba.bv1.final.suit": provisional(FINAL, companion("189"), BV1_ROUND_NOTE),
        "ba.bv1.final.squad": status(FINAL, "189"),
    };
};

const BATTLE_ARMOR_BV1_BMR = battleArmorBv1(false);
const BATTLE_ARMOR_BV1_BMRR = battleArmorBv1(true);

/** The battle armor BV1 steps of `edition`: the 1998 Master Rules' (provisional) under that edition, the Revised Edition's otherwise. */
export const getBattleArmorBv1Steps = (edition: string): CalcStepDefs =>
    getBattleValueEdition(edition) === "master-rules" ? BATTLE_ARMOR_BV1_BMR : BATTLE_ARMOR_BV1_BMRR;

/** The Companion's Speed Factor Table (p.188): the highest movement in MP, 1 to 12. */
export const BATTLE_ARMOR_BV1_SPEED_FACTORS: number[] = [0.54, 0.65, 0.77, 0.88, 1.0, 1.12, 1.24, 1.37, 1.5, 1.63, 1.76, 1.89];

/** The Companion's Battle Armor Missile Weapons BV Table (p.189): [launcher BV, ammunition BV for 1,000 kg, one-shot BV], by size; null where it prints a dash. */
type MissileRow = [number, number | null, number | null];
export const BATTLE_ARMOR_BV1_MISSILES: Record<string, MissileRow[]> = {
    "clan-advanced-srm": [[15, 2, 2], [30, 4, 4], [45, 6, 6], [60, 8, 8], [75, 10, 10], [90, 12, 12]],
    "is-lrm": [[14, 1, 4], [19, 2, 5], [26, 4, 7], [38, 5, 8], [45, 6, 9]],
    "clan-lrm": [[17, 2, 4], [25, 3, 6], [35, 5, 9], [46, 6, 10], [55, 7, 11]],
    "is-mrm": [[11, 1, 3], [13, 2, 4], [18, 2, 6], [25, 3, 7], [30, 3, 9]],
    "is-rocket-launcher": [[3, null, null], [4, null, null], [5, null, null], [7, null, null], [8, null, null]],
    "is-srm": [[15, 2, 2], [21, 3, 4], [30, 4, 6], [39, 5, 8], [49, 7, 10], [59, 7, 12]],
    "clan-srm": [[15, 2, 2], [21, 3, 4], [30, 4, 6], [39, 5, 8], [49, 7, 10], [59, 7, 12]],
};

/** The Companion's Battle Armor Component BV Table (p.190), by catalog tag; a [BV] each. Improved sensors and active probes: IS, Clan. */
export const BATTLE_ARMOR_BV1_COMPONENTS: Record<string, number> = {
    "is-magnetic-clamps": 1, "clan-bomb-rack": 11, "is-remote-sensor-dispenser": 5, "clan-remote-sensor-dispenser": 7,
    "is-pop-up-mine": 6, "is-support-ppc": 14, "clan-support-ppc": 14, "is-magshot-gauss-rifle": 15, "is-tsunami-gauss-rifle": 6, "is-grand-mauler-gauss-rifle": 6,
    "is-light-recoilless-rifle": 12, "is-medium-recoilless-rifle": 19, "is-heavy-recoilless-rifle": 22, "clan-light-recoilless-rifle": 12, "clan-medium-recoilless-rifle": 19, "clan-heavy-recoilless-rifle": 22,
    "is-light-mortar": 9, "is-heavy-mortar": 17, "clan-light-mortar": 9, "clan-heavy-mortar": 17,
    "is-micro-grenade-launcher": 1, "is-heavy-grenade-launcher": 2, "clan-heavy-grenade-launcher": 2, "is-compact-narc": 1, "clan-compact-narc": 1,
    "is-improved-sensors": 1, "clan-improved-sensors": 2, "is-active-probe": 2, "clan-active-probe": 3,
};
/** Mine dispensers, 5 each (10 mines per dispenser); the battle claw with magnets, 3 (p.190). */
export const BATTLE_ARMOR_BV1_MINE_DISPENSER = 5;

/**
 * BMR p.142 / BMR(R) p.155 Infantry Battle Values: the battle armor rows, a Point of 5 (Clan) or a squad of 4 (Inner Sphere), as printed:
 * [unit, troopers, BV] (BMR(R) adds the Sylph, Undine, Fa Shih, Fenrir and Infiltrator Mk. II rows). Used as tests that show misses.
 */
export const BATTLE_ARMOR_BV1_TABLE_ROWS: [string, number, number][] = [
    ["Clan Standard (Flamer)", 5, 245], ["Clan Standard (Machine Gun)", 5, 234], ["Clan Standard (Small Laser)", 5, 279],
    ["IS Standard (Flamer)", 4, 150], ["IS Standard (Machine Gun)", 4, 141], ["IS Standard (Small Laser)", 4, 177], ["IS Standard (SRM)", 4, 132],
];

// ---------------------------------------------------------------------------------------------------------------
// Cost
// ---------------------------------------------------------------------------------------------------------------

const COST = "Cost";
const TRAINING_NOTE = "The training cost goes by the suit's technology base at every edition (TM p.285; the Companion p.187 keys it by Tech Base): 150,000 Inner Sphere, 200,000 Clan. A mixed-technology suit goes by its chassis. A force fielding the suit with the other side's troopers pays the other rate (owner call 2, 2026-11-23).";
const PROSE_NOTE = "TM p.286 prints \"451,000\" for the Purifier's structure and equipment in its prose and 426,000 in the worked line: (426,000 + 150,000) x 6 = 3,456,000. The suit's 437,250 with the ER small laser prices the second worked line, 3,523,500.";
const STOCK_NOTE = "BMR(R) p.150 prices the stock suits at a fixed price per Point or squad. It is shown beside the built cost and does not replace it (owner call 8, 2026-11-23). It is shown under the 1998 Master Rules too: that book's own price table was not read for this.";

export const BATTLE_ARMOR_COST_STEPS: CalcStepDefs = {
    "ba.cost.suit": step(COST, [at("tm", "285")]),
    "ba.cost.chassis": step(COST, [at("tm", "281")]),
    "ba.cost.ground": step(COST, [at("tm", "281")]),
    "ba.cost.motive": step(COST, [at("tm", "281")]),
    "ba.cost.manipulator": step(COST, [at("tm", "281"), at("toaue", "225")]),
    "ba.cost.armor": step(COST, [at("tm", "281")]),
    "ba.cost.clan": step(COST, [at("tm", "281")]),
    "ba.cost.structure": step(COST, [at("tm", "281"), at("tm", "285")]),
    "ba.cost.equipment": step(COST, [at("tm", "296-298"), at("tm", "285"), at("toaue", "225")]),
    "ba.cost.unpriced": provisional(COST, [at("tm", "296-298")], "The TechManual's price list has no row for this item, so it adds no cost."),
    "ba.cost.training": step(COST, [at("tm", "285"), at("cbt-companion", "187")], "cited", TRAINING_NOTE),
    "ba.cost.implants": step(COST, [at("ioae", "184")]),
    "ba.cost.suit-total": step(COST, [at("tm", "285"), at("tm", "286")], "cited", PROSE_NOTE),
    "ba.cost.final": step(COST, [at("tm", "285"), at("tm", "286")]),
    "ba.cost.stock-price": provisional(COST, [at("bmrr", "150")], STOCK_NOTE),
};

/** BMR(R) p.150: the fixed prices of the stock suits, by chassis: [name pattern, troopers, C-bills a Point or squad]. */
export const BATTLE_ARMOR_BMRR_STOCK_PRICES: [RegExp, number, number][] = [
    [/^Elemental\b/i, 5, 3500000], [/^Gnome\b/i, 5, 5250000], [/^Salamander\b/i, 5, 3325000], [/^Sylph\b/i, 5, 3325000], [/^Undine\b/i, 5, 3500000],
    [/^IS Standard\b/i, 4, 2400000], [/^Achileus\b/i, 4, 1920000], [/^Cavalier\b/i, 4, 2400000], [/^Fa Shih\b/i, 4, 2250000], [/^Fenrir\b/i, 4, 3000000],
    [/^Gray Death (Light )?Scout\b/i, 4, 1650000], [/^Gray Death (Standard|Std)\b/i, 4, 2400000], [/^Infiltrator Mk\. II\b/i, 4, 2600000], [/^Infiltrator\b/i, 4, 1800000],
    [/^Kage\b/i, 4, 1850000], [/^Kanazuchi\b/i, 4, 3300000], [/^Longinus\b/i, 4, 2550000], [/^Raiden\b/i, 4, 2400000], [/^Purifier\b/i, 4, 2400000], [/^Sloth\b/i, 4, 1800000],
];
