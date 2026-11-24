/**
 * Conventional infantry Battle Value and cost step definitions (#599, the infantry round): where each step comes from.
 *
 * BV2: Calculating Conventional Infantry BV, TM p.309 (worked Anti-'Mech Jump platoon p.310), the Defensive Factors
 * Table p.315 (skill table p.314), the Conventional Infantry Weapons BV Table p.319; TO:AUE p.191 (Advanced Infantry:
 * armor kit and mount damage divisors x 1.5, the Defensive Factor addendum for beasts and sneak suits, field guns and
 * disposable weapons) and p.193 (Unit Type Modifiers addendum: specialized infantry and XCT troops). BV1: the Infantry
 * Battle Values tables, BMR p.142 (with the errata that cuts its LRM lines) and BMR(R) p.155, and the Level 3 tables
 * of Maximum Tech p.93 in each Master Rules edition's printing. Cost: TM pp.276, 282 with the weapon cost table
 * pp.298-301, Maximum Tech p.40 for Narc and TAG, and TO:AUE p.225 for beasts, mechanized VTOL and specialized
 * infantry. Read on 2026-11-23 on the page images (written back to the library's extracts). What each page says is in
 * .superpowers/sdd/2026-11-23-infantry-bundle-and-cited-bv/progress.md, "Readings". Change a citation only after
 * reading the page.
 */
import { getBattleValueEdition } from "./battle-value";
import { CalcStepDefs, CalcStepStatus, ICalcCitation, ICalcStepDef } from "./calc-steps";
import type { IInfantryWeapon } from "./infantry-weapons";

const DEFENSIVE = "Defensive Battle Rating";
const OFFENSIVE = "Offensive Battle Rating";
const FINAL = "Final Battle Value";

const at = (source: string, page: string): ICalcCitation => ({ source, page });
const step = (section: string, cites: ICalcCitation[], status: CalcStepStatus = "cited", note?: string): ICalcStepDef =>
    note ? { section, cites, status, note } : { section, cites, status };
const provisional = (section: string, cites: ICalcCitation[], note: string): ICalcStepDef => step(section, cites, "provisional", note);
const missing = (section: string, cites: ICalcCitation[], note: string): ICalcStepDef => step(section, cites, "source-missing", note);

const BEAST_ANTI_MECH_NOTE = "The Creature Size Table (TO:AUE p.107) bars Swarm attacks from a Very Large creature, and the platoon's weapons are added again for its Leg attacks; NGCFells follows the table. The text of p.108 differs: \"For units using Very Large creatures (roughly the size of a Terran elephant), the unit may not engage in Leg Attacks.\"";
const BEAST_DIVISOR_NOTE = "An unarmored rider counts the divisor 1 of Clothing, Fatigues/Civilian/Non-Armored (p.129), so even a Large creature (divisor 1.0) adds to the sum. In play the armor's and the creature's divisors divide the damage one after the other (p.108: \"in the same fashion as infantry armor\").";
const AMMO_CAP_NOTE = "TO:AUE p.191 adds the ammunition's BV. NGCFells holds it to the guns' BV, as for any unit's ammunition (TM p.317). Owner call.";
const INFERRED_NOTE = "The Conventional Infantry Weapons BV Table (TM p.319) has no row for this weapon, and its source prints no Battle Value. The figure is inferred, as the weapon's record says.";
const ARCHAIC_NOTE = "TM p.309 adds the Battle Value of all the weapons again for Anti-'Mech attacks. NGCFells leaves archaic weapons (blades, bows) out, as they do nothing to a 'Mech; the MUL and MegaMek rate them so too.";
const DISPOSABLE_NOTE ="Not modeled: a platoon has no disposable weapon of its own (the file field is refused on import), so the step is never recorded.";

export const INFANTRY_BV2_STEPS: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating (TM p.309; TO:AUE p.191) ----
    // Troopers x 1.5.
    "ci.bv2.def.troopers": step(DEFENSIVE, [at("tm", "309")]),
    // With an armor kit or a mount: the sum of the damage divisors x 1.5 instead (armor p.129, mounts p.107).
    "ci.bv2.def.divisor": step(DEFENSIVE, [at("toaue", "191"), at("toaue", "129")]),
    "ci.bv2.def.divisor.beast": step(DEFENSIVE, [at("toaue", "191"), at("toaue", "129"), at("toaue", "107")], "cited", BEAST_DIVISOR_NOTE),
    // Augmentation that adds to the damage divisor (dermal armor +1).
    "ci.bv2.def.divisor.implant": step(DEFENSIVE, [at("toaue", "191"), at("ioae", "74")]),
    // The Defensive Factor from the highest target modifier, jump included (Defensive Factors Table p.315).
    "ci.bv2.def.factor": step(DEFENSIVE, [at("tm", "309"), at("tm", "315")]),
    // Addendum: DEST +0.2, Sneak Camo +0.2, Sneak IR +0.2, Sneak ECM +0.1, cumulative.
    // Dermal camouflage's +3 when standing still and powered flight wings' VTOL movement, when higher than the ground modifier.
    "ci.bv2.def.factor.implant": step(DEFENSIVE, [at("tm", "315"), at("ioae", "184-185")]),
    // VTOL movement (a mechanized VTOL platoon, a branth): the "Jumped/Airborne (non-aerospace units)" +1 (TW p.117), which
    // the Defensive Factors Table counts as "any VTOL movement modifier" (TM p.315).
    "ci.bv2.def.factor.vtol": step(DEFENSIVE, [at("tm", "315"), at("tw", "117")]),
    // The pheromone gas effuser's 0.05 a trooper, added before the Defensive Factor.
    "ci.bv2.def.augmentation": step(DEFENSIVE, [at("ioae", "184")]),
    "ci.bv2.def.factor.stealth": step(DEFENSIVE, [at("toaue", "191")]),
    // Addendum: Very Large -0.1, Monstrous -0.2.
    "ci.bv2.def.factor.beast": step(DEFENSIVE, [at("toaue", "191")]),
    "ci.bv2.def.rating": step(DEFENSIVE, [at("tm", "309"), at("toaue", "191")]),

    // ---- Step 2: Offensive Battle Rating (TM p.309; TO:AUE p.191) ----
    // Each trooper's weapon and each support weapon at its Conventional Infantry Weapons BV (p.319).
    "ci.bv2.off.primary": step(OFFENSIVE, [at("tm", "309"), at("tm", "319")]),
    "ci.bv2.off.secondary": step(OFFENSIVE, [at("tm", "309"), at("tm", "319")]),
    // A weapon the p.319 table does not print, whose Battle Value its record infers (the weapon's notes say how).
    "ci.bv2.off.primary.inferred": provisional(OFFENSIVE, [at("tm", "309"), at("tm", "319")], INFERRED_NOTE),
    "ci.bv2.off.secondary.inferred": provisional(OFFENSIVE, [at("tm", "309"), at("tm", "319")], INFERRED_NOTE),
    // A platoon that can make anti-'Mech attacks adds its weapons again.
    "ci.bv2.off.anti-mech": step(OFFENSIVE, [at("tm", "309")]),
    // The same for a platoon on Very Large creatures, whose Leg attacks the table allows and the text of p.108 bars.
    "ci.bv2.off.anti-mech.beast": step(OFFENSIVE, [at("tm", "309"), at("toaue", "107"), at("toaue", "108")], "cited", BEAST_ANTI_MECH_NOTE),
    // The same, archaic weapons left out (NGCFells ruling).
    "ci.bv2.off.anti-mech.archaic": provisional(OFFENSIVE, [at("tm", "309")], ARCHAIC_NOTE),
    // Grappler lines and climbing claws multiply the Anti-'Mech Battle Rating by 1.2.
    "ci.bv2.off.anti-mech.tool": step(OFFENSIVE, [at("ioae", "191")]),
    // The same with archaic weapons left out (the ruling above).
    "ci.bv2.off.anti-mech.tool.archaic": provisional(OFFENSIVE, [at("tm", "309"), at("ioae", "191")], ARCHAIC_NOTE),
    // Gas effusers, triple-strength myomer, suicide implants, the tail and prosthetic weapons add to the weapons.
    "ci.bv2.off.augmentation": step(OFFENSIVE, [at("ioae", "184-186")]),
    // Field guns and field artillery with their ammunition, at the vehicle weapons' BV (pp.317-318).
    "ci.bv2.off.field-guns": step(OFFENSIVE, [at("toaue", "191"), at("tm", "317-318")]),
    "ci.bv2.off.field-guns.ammo": provisional(OFFENSIVE, [at("toaue", "191"), at("tm", "317-318")], AMMO_CAP_NOTE),
    // Disposable weapons x 0.2. Never recorded: a platoon has no disposable weapon of its own (MegaMek's disposableWeapon
    // file field is refused on import), and the table weapons marked 1-D carry their own printed BV.
    "ci.bv2.off.disposable": step(OFFENSIVE, [at("toaue", "191")], "cited", DISPOSABLE_NOTE),
    // The fastest movement mode against the Speed Factor Table.
    // A move-or-fire foot platoon (TM p.151) reads 0 MP: the table's 0 Ground MP unit (TW p.213).
    "ci.bv2.off.speed": step(OFFENSIVE, [at("tm", "309"), at("tm", "316"), at("tm", "151"), at("tw", "213")]),
    "ci.bv2.off.rating": step(OFFENSIVE, [at("tm", "309")]),

    // ---- Step 3: Final Battle Value (TM p.309; TO:AUE pp.191, 193) ----
    "ci.bv2.final.sum": step(FINAL, [at("tm", "309")]),
    // Unit Type Modifiers addendum: Combat Engineers +0.1, Marines +0.3, Mountain Troops +0.2, Paratroops +0.1,
    // SCUBA +0.1, XCT troops +0.1, added to a base of 1.
    "ci.bv2.final.type-modifier": step(FINAL, [at("toaue", "191"), at("toaue", "193")]),
    // The implants that change the skills the multiplier is found from (IO:AE pp.184, 191), used after this value.
    "ci.bv2.final.skill": step(FINAL, [at("ioae", "184"), at("ioae", "191")]),
    "ci.bv2.final.round": step(FINAL, [at("tm", "309")]),
};

const PROPORTIONAL_NOTE = "The table prices a standard platoon. The Master Rules tell to adjust the table's BV proportionally for units of nonstandard size, in words written for battle armor; NGCFells applies it to platoons the same way.";
const MECHANIZED_NOTE = "Neither the Master Rules nor Maximum Tech print a Battle Value for mechanized infantry. NGCFells shows no BV1 for it.";
const SPECIALTY_NOTE = "Maximum Tech prints no line or unit equipment row for marines, mountain troops, XCT troops, paramedics, TAG troops or foot and jump combat engineers (p.93 has motorized engineers, paratroops, submersible infantry and TAG equipment). NGCFells keeps the platoon's weapon line for them; the TAG +1 is the TAG equipment row.";
const MAP_NOTE = "The BMR table names platoon types by weapon (rifle, machine gun, flamer, laser, SRM, LRM); the TechManual builds them as rifle troopers with that support weapon as the secondary. NGCFells reads the support weapon as the platoon type: a secondary of the machine gun, flamer, SRM, LRM or laser class gives the row; with no secondary, or one outside those classes, the primary does (a laser or pulse laser is a laser, a flamer a flamer, any other rifle that is not a Gauss weapon a rifle). Sneak, Camo is the camouflage sneak suit, Sneak, ECM the ECM suit, and encumbering armor the heavy armor.";
const MOTIVE_NOTE = "The table lists foot, jump and motorized platoons, and Maximum Tech adds submersible foot infantry. A motorized or mechanized SCUBA, VTOL or beast-mounted platoon has no BV1 in the book.";
const UNLISTED_NOTE = "This edition's weapon tables print no Battle Value for the gun. NGCFells uses its current (BV2) figure so the gun is not worth nothing.";
const WEAPON_CLASS_NOTE = "The table lists rifle, machine gun, flamer, laser, SRM and LRM platoons only. A platoon armed otherwise has no BV1 in the book.";

/**
 * Infantry BV1 under a Battle Value 1 edition: the platoon's line on the Infantry Battle Values table (BMR p.142 under
 * the 1998 Master Rules, whose LRM lines the errata cuts; BMR(R) p.155 under the Revised Edition), the Level 3 table
 * and unit equipment of Maximum Tech p.93 (both printings), the LRM Infantry table on the same page. Both editions give
 * the same numbers.
 */
const infantryBv1 = (revised: boolean): CalcStepDefs => {
    const table = revised ? at("bmrr", "155") : at("bmr", "142");
    const sizeText = revised ? at("bmrr", "156") : at("bmr", "142");
    const maxTech = at(revised ? "mt-revised" : "mt", "93");
    const lrmCut = revised ? [table] : [table, at("bmr-errata", "142")];
    return {
        "ci.bv1.table": step(FINAL, [table]),
        "ci.bv1.table.lrm": step(FINAL, [...lrmCut, maxTech]),
        "ci.bv1.table.level3": step(FINAL, [maxTech]),
        "ci.bv1.size": provisional(FINAL, [sizeText], PROPORTIONAL_NOTE),
        // Unit equipment: sneak suits, ECM suits, heavy armor, Narc per launcher, paratroops, submersible, TAG.
        "ci.bv1.equipment": step(FINAL, [maxTech]),
        // Submersible infantry are foot infantry equipped to operate underwater (Maximum Tech p.42): the foot line, +1.
        "ci.bv1.submersible": step(FINAL, [at(revised ? "mt-revised" : "mt", "42"), maxTech]),
        // A specialty the book has no line for: the weapon line kept.
        "ci.bv1.specialty": provisional(FINAL, [maxTech], SPECIALTY_NOTE),
        // Field guns: each gun's BV from the weapon tables, ammunition not counted.
        "ci.bv1.field-guns": step(FINAL, [maxTech, revised ? at("bmrr", "156-158") : at("bmr", "143-144")]),
        "ci.bv1.field-guns.unlisted": provisional(FINAL, [maxTech, revised ? at("bmrr", "156-158") : at("bmr", "143-144")], UNLISTED_NOTE),
        "ci.bv1.map": provisional(FINAL, [table, maxTech], MAP_NOTE),
        "ci.bv1.mechanized": missing(FINAL, [table, maxTech], MECHANIZED_NOTE),
        "ci.bv1.motive": missing(FINAL, [table, maxTech], MOTIVE_NOTE),
        "ci.bv1.weapon-class": missing(FINAL, [table, maxTech], WEAPON_CLASS_NOTE),
        "ci.bv1.final.round": step(FINAL, [table]),
    };
};

const INFANTRY_BV1_BMR = infantryBv1(false);
const INFANTRY_BV1_BMRR = infantryBv1(true);

/** The infantry BV1 steps of `edition`: the 1998 Master Rules' under that edition, the Revised Edition's otherwise. */
export const getInfantryBv1Steps = (edition: string): CalcStepDefs =>
    getBattleValueEdition(edition) === "master-rules" ? INFANTRY_BV1_BMR : INFANTRY_BV1_BMRR;

/**
 * The Infantry Battle Values tables as data: [BV, anti-'Mech trained BV] by motive and weapon class. BMR p.142 and
 * BMR(R) p.155 print the same rows except the LRM lines, which the BMR errata cuts and Maximum Tech p.93 puts on its
 * LRM Infantry table (no anti-'Mech column; the BMR printed the same figure in both). Read on the page images.
 */
export type InfantryBv1Weapon = "flamer" | "laser" | "lrm" | "machine-gun" | "rifle" | "srm";
export const INFANTRY_BV1_TABLE: Record<"foot" | "jump" | "motorized", Record<InfantryBv1Weapon, [number, number]>> = {
    foot: { flamer: [28, 41], laser: [37, 60], lrm: [56, 56], "machine-gun": [31, 47], rifle: [23, 32], srm: [60, 60] },
    jump: { flamer: [32, 51], laser: [41, 71], lrm: [87, 87], "machine-gun": [37, 62], rifle: [29, 46], srm: [71, 71] },
    motorized: { flamer: [35, 54], laser: [42, 70], lrm: [75, 75], "machine-gun": [39, 63], rifle: [28, 42], srm: [70, 70] },
};
/** The Master Rules' standard platoon: 28 troopers, 21 for a jump platoon (BMR(R) p.152: "the twenty-one men in a jump platoon"). */
export const INFANTRY_BV1_STANDARD_SIZE: Record<"foot" | "jump" | "motorized", number> = { foot: 28, jump: 21, motorized: 28 };

/** The table value for a platoon of `motive` armed with `weapon`, anti-'Mech trained or not. */
export const getInfantryBv1Line = (motive: "foot" | "jump" | "motorized", weapon: InfantryBv1Weapon, antiMech: boolean): number =>
    INFANTRY_BV1_TABLE[motive][weapon][antiMech ? 1 : 0];

/**
 * Which of the table's six weapon classes a weapon belongs to, null for any other (ci.bv1.map, provisional): by name for lasers, flamers,
 * machine guns, SRM and LRM launchers, and any other rifle that is not a Gauss weapon for the rifle class.
 */
export const getInfantryBv1Class = (weapon: Pick<IInfantryWeapon, "name" | "category">): InfantryBv1Weapon | null => {
    const name = weapon.name;
    if (/laser/i.test(name)) return "laser";
    if (/flamer/i.test(name)) return "flamer";
    if (/\bmachine gun/i.test(name)) return "machine-gun";
    if (/\bSRM\b/.test(name)) return "srm";
    if (/\bLRM\b/.test(name)) return "lrm";
    if (weapon.category === "rifle" && !/gauss/i.test(name)) return "rifle";
    return null;
};

/** Maximum Tech p.93, Level 3 Infantry Battle Values Table: motorized engineers. */
export const INFANTRY_BV1_ENGINEERS: [number, number] = [42, 63];
/** Maximum Tech p.93 unit equipment: [BV, anti-'Mech trained BV]; null where the book prints a dash. */
export const INFANTRY_BV1_EQUIPMENT: Record<"sneak-suits" | "ecm-suits" | "heavy-armor" | "narc" | "paratroops" | "submersible" | "tag", [number, number | null]> = {
    "sneak-suits": [1, 1],
    "ecm-suits": [1, 1],
    "heavy-armor": [14, null],
    narc: [1, 1],
    paratroops: [1, 1],
    submersible: [1, 1],
    tag: [1, 1],
};

const COST = "Cost";
const NOT_REREAD = "The rule is the one the cost code has followed since the infantry creator was built; its page has not been re-read in this round.";

/**
 * Infantry cost (#599): TM p.276 (the conventional infantry cost formula) and p.282 (motive multipliers, anti-'Mech
 * training x 5), the weapon costs of pp.298-301, Maximum Tech p.40 (Narc launchers 10,000 each, TAG 50,000), TO:AUE
 * p.225 (beasts 5,000 x total tonnage; the "TC x" rows on the total unit cost, after field guns, beasts, augmentation,
 * Narc and TAG: microlite x 4, micro-copter x 4.5, Combat Engineers x 5, Marines x 3, Mountain Troops x 2, Paratroops
 * x 3, SCUBA x 2 or x 2.5 motorized, XCT x 1.5; paramedics 0.375 x the total per medic, added after the rest), field
 * guns at the vehicle weapon's cost.
 */
export const INFANTRY_COST_STEPS: CalcStepDefs = {
    // Base Trooper Cost = 2,000 x the square root of the weapon cost (p.282); worked: Darrell's laser rifles, 70,710.678 (p.276).
    "ci.cost.trooper": step(COST, [at("tm", "282"), at("tm", "276"), at("tm", "298-301")]),
    "ci.cost.tag-troopers": provisional(COST, [at("toaue", "225"), at("mt", "40")], "TO:AUE p.225 has no row for TAG Troops. Each is priced as a secondary-weapon trooper carrying a 50,000 C-bill TAG (Maximum Tech p.40), as NGCFells confirmed."),
    "ci.cost.secondary": provisional(COST, [at("tm", "276"), at("tm", "298-301")],
        "The book prices a platoon with one weapon type. Where a secondary weapon is carried, each trooper is priced by the weapon they fire, as MegaMek does."),
    "ci.cost.armor": provisional(COST, [at("toaue", "129")], NOT_REREAD),
    // Foot x 1.0, motorized x 1.6, jump x 2.6, mechanized hover, wheeled and tracked x 3.2.
    "ci.cost.motive": step(COST, [at("tm", "282")]),
    "ci.cost.motive.vtol": step(COST, [at("toaue", "225")]),
    "ci.cost.motive.scuba-mech": provisional(COST, [at("tm", "282"), at("toaue", "225")], "TO:AUE p.225 has no row for Mechanized SCUBA. The mechanized multiplier, x 3.2, is used, as MegaMek does and NGCFells confirmed."),
    // Each trooper's implants and limbs, added to the final cost; doubled where the faction does not field it, again where extinct.
    "ci.cost.augmentation": step(COST, [at("ioae", "71"), at("ioae", "179"), at("ioae", "217")]),
    "ci.cost.anti-mech": step(COST, [at("tm", "282")]),
    "ci.cost.specialization": step(COST, [at("toaue", "225")]),
    "ci.cost.narc": step(COST, [at("mt", "40")]),
    "ci.cost.tag": step(COST, [at("mt", "40")]),
    "ci.cost.field-guns": step(COST, [at("toaue", "225")]),
    "ci.cost.beast": step(COST, [at("toaue", "225")]),
    "ci.cost.paramedics": step(COST, [at("toaue", "225")]),
    // A fielded weapon the cost table does not price: no cost.
    "ci.cost.unpriced": missing(COST, [at("tm", "298-301")], "The cost table prints no price for the weapon, so the platoon has no cost."),
    // The platoon's total, rounded down (worked: 3,167,838.38 to 3,167,838, p.276).
    "ci.cost.final": step(COST, [at("tm", "276")]),
};
