/**
 * ProtoMech Battle Value and cost step definitions (#599, the ProtoMech round): where each step comes from.
 *
 * BV2: Calculating ProtoMech BV, TM p.306 (worked Delphyne-2, p.307), with the Defensive Factors, Defensive Factor
 * Modifier and Speed Factor tables on p.316 and the equipment tables on pp.317-318; ProtoMech weapons and equipment from
 * TO:AUE pp.196-197 and IO:AE p.190. BV1: BMR(R) pp.154-156, which print the vehicle procedure and "Calculating ProtoMech
 * BV" with its own missile table, read with TRO 3060 (FanPro) p.195, which repeats those changes and prints the BV of
 * its eight ProtoMechs under them. Cost: TM pp.279, 282, 285 and IO:AE p.215. Read on 2026-11-23 (the TechManual in the
 * extract of its 2020 Corrected Fourth Printing). What each page says is in
 * docs/superpowers/plans/2026-11-10-cited-bv-ledger.md, "ProtoMechs". Change a citation only after reading the page.
 */
import { CalcStepDefs, CalcStepStatus, ICalcCitation, ICalcStepDef } from "./calc-steps";

const DEFENSIVE = "Defensive Battle Rating";
const OFFENSIVE = "Offensive Battle Rating";
const FINAL = "Final Battle Value";
const STRUCTURAL = "Structural cost";
const EQUIPMENT = "Weapons and equipment";
const TOTAL = "Total";

const at = (source: string, page: string): ICalcCitation => ({ source, page });
const step = (section: string, cites: ICalcCitation[], status: CalcStepStatus = "cited", note?: string): ICalcStepDef =>
    note ? { section, cites, status, note } : { section, cites, status };
const provisional = (section: string, cites: ICalcCitation[], note: string): ICalcStepDef => step(section, cites, "provisional", note);

const BOOSTER_NOTE = "TM p.306 adds 1 to the Speed Factor's MP for a myomer booster and counts the booster's boosted Running MP (twice the Walking MP, TM p.85) only toward the Defensive Factor; that is what is done here. The Master Unit List and MegaMek use the boosted Running MP for the Speed Factor of some designs (Siren 4, Centaur 4) and none for another (Basilisk (Quad) B).";
const REAR_NOTE = "TM p.306 does not mention rear-firing weapons. A ProtoMech's torso weapons may be mounted to the rear, and the BattleMech rule (TM p.303: the weaker arc counts half) is applied, as MegaMek does.";
const QUAD_MELEE_NOTE = "IO:AE p.190 prints 'Dmg x 1.25' without saying which damage. NGCFells (2026-11-02) ruled the whole Frenzy damage with the system's added 2 a 5 tons, and the printed BV 258 of the Basilisk (Quad) (WoR p.210) is reached only that way.";

const HANDHELD_NOTE = "TO:AUE p.193 prints the handheld weapon BV for a BattleMech carrier; the same figure is used for a ProtoMech (inferred), which TO:AUE p.128 lets carry one.";
export const PROTOMECH_BV2_STEPS: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating (TM p.306) ----
    "pm.bv2.def.armor": step(DEFENSIVE, [at("tm", "306")]),
    "pm.bv2.def.structure": step(DEFENSIVE, [at("tm", "306")]),
    // Active probes, anti-missile systems (their ammunition up to the systems' own BV) and ECM suites: the dagger items.
    "pm.bv2.def.equipment": step(DEFENSIVE, [at("tm", "306"), at("tm", "317-318")]),
    "pm.bv2.def.equipment.ams-ammo": step(DEFENSIVE, [at("tm", "306")]),
    "pm.bv2.def.subtotal": step(DEFENSIVE, [at("tm", "306")]),
    // The highest target modifier (running, jumping +1, a booster's boosted run) against the Defensive Factors Table, + 0.1.
    "pm.bv2.def.factor": step(DEFENSIVE, [at("tm", "306"), at("tm", "316")]),
    "pm.bv2.def.factor.glider": provisional(DEFENSIVE, [at("tm", "306"), at("ioae", "190")],
        "IO:AE p.190 says a Glider ProtoMech's Speed Factor uses its WiGE Flank MP and is silent on its Defensive Factor. The WiGE flank movement's target modifier is taken with +1 for a WiGE unit, as the Master Unit List and MegaMek have it."),
    "pm.bv2.def.rating": step(DEFENSIVE, [at("tm", "306")]),

    // ---- Step 2: Offensive Battle Rating (TM p.306) ----
    "pm.bv2.off.weapon": step(OFFENSIVE, [at("tm", "306"), at("tm", "317-318")]),
    // A launcher built from tubes (TM p.88), at the Clan table's figure for its size (TM p.318; Streak LRM, TO:AUE p.197).
    "pm.bv2.off.weapon.missile": step(OFFENSIVE, [at("tm", "306"), at("tm", "318")]),
    // The ProtoMech weapons the TechManual's tables leave out: AC/2, AC/4, AC/8, melee weapon (TO:AUE pp.196-197).
    "pm.bv2.off.weapon.protomech": step(OFFENSIVE, [at("tm", "306"), at("toaue", "196-197")]),
    // The Wars of Reaving items (IO:AE p.190): magnetic clamp 1, Fusillade 11, improved heavy lasers, Extended Jump Jet System.
    "pm.bv2.off.weapon.wor": step(OFFENSIVE, [at("tm", "306"), at("ioae", "190")]),
    "pm.bv2.off.weapon.melee": step(OFFENSIVE, [at("tm", "306"), at("toaue", "197")]),
    "pm.bv2.off.weapon.quad-melee": provisional(OFFENSIVE, [at("tm", "306"), at("ioae", "190")], QUAD_MELEE_NOTE),
    // An array is worth 0.67 of the machine guns it links, on top of the guns (TM p.318 note F; the BV of all the weapons on the array x 0.1 in TO:AUE p.197).
    "pm.bv2.off.weapon.mg-array": step(OFFENSIVE, [at("tm", "306"), at("tm", "318")]),
    "pm.bv2.off.weapon.rear": provisional(OFFENSIVE, [at("tm", "306"), at("tm", "303")], REAR_NOTE),
    // kg of ammunition / 1,000 x the BV of a ton; never more than the weapon's own BV.
    "pm.bv2.off.ammo": step(OFFENSIVE, [at("tm", "306"), at("tm", "317-318")]),
    "pm.bv2.off.ammo.cap": step(OFFENSIVE, [at("tm", "306")]),
    "pm.bv2.off.edp": step(OFFENSIVE, [at("ioae", "190")]),
    "pm.bv2.off.weapons.total": step(OFFENSIVE, [at("tm", "306")]),
    // Running MP + half the Jumping MP (rounded up), + 1 for a booster; a Glider's WiGE Flank MP; the Speed Factor Table.
    "pm.bv2.off.speed": provisional(OFFENSIVE, [at("tm", "306"), at("tm", "316")], BOOSTER_NOTE),
    "pm.bv2.off.speed.plain": step(OFFENSIVE, [at("tm", "306"), at("tm", "316")]),
    "pm.bv2.off.speed.glider": step(OFFENSIVE, [at("tm", "306"), at("ioae", "190")]),
    "pm.bv2.off.rating": step(OFFENSIVE, [at("tm", "306")]),

    // ---- Step 3: Final Battle Value (TM p.306) ----
    "pm.bv2.final.sum": step(FINAL, [at("tm", "306")]),
    "pm.bv2.final.handheld": provisional(FINAL, [at("toaue", "193"), at("toaue", "128")], HANDHELD_NOTE),
    "pm.bv2.final.with-handheld": provisional(FINAL, [at("toaue", "193"), at("toaue", "128")], HANDHELD_NOTE),
};

const BMRR_PM_BV = "BMR(R) p.155 prints \"Calculating ProtoMech BV\" as the vehicle procedure with three changes, and TRO 3060 (FanPro) p.195 prints the same changes.";
const BMRR_JUMP_NOTE = "BMR(R) p.154 gives a vehicle's Speed Factor as Flanking MP + VTOL MP and names no ProtoMech change, so a ProtoMech's Jumping MP is read as a BattleMech's: Running MP + Jumping MP, as the TRO 3060 (FanPro) Battle Values need (a Centaur's 140 has no jump to show it). A ProtoMech's Defensive Movement Factor takes the jump bonus the same way.";
const BMRR_PM_WEAPON_NOTE = "BMR(R) prints no Battle Value for this ProtoMech-only weapon. NGCFells uses its current (BV2) figure so it is not worth nothing.";
const BMRR_SRM5_NOTE = "BMR(R) p.155 prints SRM 5 as 58 with 8 an ton of ammunition; TRO 3060 (FanPro) p.195 prints 47 and 6, and TM errata v2.2 (p.318) corrects the same figure to 47 and 6. The corrected figure is used.";

export const PROTOMECH_BV1_STEPS: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating (BMR(R) p.154, with the ProtoMech changes of p.155) ----
    "pm.bv1.def.armor": step(DEFENSIVE, [at("bmrr", "154")]),
    "pm.bv1.def.structure": step(DEFENSIVE, [at("bmrr", "154")]),
    "pm.bv1.def.tonnage": step(DEFENSIVE, [at("bmrr", "155"), at("tro-3060", "195")]),
    "pm.bv1.def.equipment": step(DEFENSIVE, [at("bmrr", "154")]),
    "pm.bv1.def.subtotal": step(DEFENSIVE, [at("bmrr", "154"), at("bmrr", "155")]),
    // The Defensive Movement Factors Table (p.153) + 0.1 for a ProtoMech; no Vehicle Type Modifier.
    "pm.bv1.def.factor": step(DEFENSIVE, [at("bmrr", "153"), at("bmrr", "155"), at("tro-3060", "195")]),
    "pm.bv1.def.rating": step(DEFENSIVE, [at("bmrr", "154")]),

    // ---- Step 2: Offensive Battle Rating (BMR(R) pp.154-156) ----
    "pm.bv1.off.weapon": step(OFFENSIVE, [at("bmrr", "154"), at("bmrr", "156-158")]),
    // A launcher of a non-standard number of tubes, from the ProtoMech Missile Weapons BV table.
    "pm.bv1.off.weapon.missile": step(OFFENSIVE, [at("bmrr", "155"), at("tro-3060", "195")]),
    "pm.bv1.off.weapon.srm5": provisional(OFFENSIVE, [at("bmrr", "155"), at("tro-3060", "195"), at("tm", "318")], BMRR_SRM5_NOTE),
    "pm.bv1.off.weapon.unlisted": provisional(OFFENSIVE, [at("bmrr", "154")], BMRR_PM_WEAPON_NOTE),
    "pm.bv1.off.weapon.rear": step(OFFENSIVE, [at("bmrr", "154")]),
    "pm.bv1.off.ammo": step(OFFENSIVE, [at("bmrr", "155"), at("tro-3060", "195")]),
    "pm.bv1.off.weapons.total": step(OFFENSIVE, [at("bmrr", "154")]),
    "pm.bv1.off.speed": provisional(OFFENSIVE, [at("bmrr", "154"), at("bmrr", "153")], BMRR_JUMP_NOTE),
    "pm.bv1.off.rating": step(OFFENSIVE, [at("bmrr", "154")]),

    // ---- Step 3: Final Battle Value (BMR(R) p.154) ----
    "pm.bv1.final.sum": provisional(FINAL, [at("bmrr", "154"), at("bmrr", "155")], BMRR_PM_BV),
};

const COST_RECORD_NOTE = "No book page was read for this price; it is from NGCFells's records.";

export const PROTOMECH_COST_STEPS: CalcStepDefs = {
    // ---- Structural costs (TM p.279) ----
    "pm.cost.cockpit": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.cockpit.ultraheavy": step(STRUCTURAL, [at("ioae", "215")]),
    "pm.cost.cockpit.interface": provisional(STRUCTURAL, [at("ioae", "190")], "The Inner Sphere ProtoMech Interface Cockpit has no price in the pages read; its price is from NGCFells's records."),
    "pm.cost.life-support": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.sensors": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.musculature": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.structure": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.structure.ultraheavy": step(STRUCTURAL, [at("ioae", "215")]),
    "pm.cost.structure.quad": step(STRUCTURAL, [at("ioae", "215")]),
    "pm.cost.structure.glider": step(STRUCTURAL, [at("ioae", "215")]),
    "pm.cost.actuators.arms": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.actuators.legs": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.engine": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.jump-jets": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.jump-jets.extended": provisional(STRUCTURAL, [at("tm", "279"), at("ioae", "215")], COST_RECORD_NOTE),
    "pm.cost.jump-jets.umu": provisional(STRUCTURAL, [at("tm", "279")], COST_RECORD_NOTE),
    "pm.cost.jump-pack": provisional(STRUCTURAL, [at("toaue", "210")], COST_RECORD_NOTE),
    "pm.cost.booster": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.heat-sinks": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.armor": step(STRUCTURAL, [at("tm", "279")]),
    "pm.cost.armor.edp": provisional(STRUCTURAL, [at("ioae", "190")], COST_RECORD_NOTE),
    "pm.cost.structural-total": step(STRUCTURAL, [at("tm", "279")]),
    // ---- Weapons and equipment (TM p.282; the equipment tables), without ammunition ----
    "pm.cost.weapons": step(EQUIPMENT, [at("tm", "282")]),
    "pm.cost.weapons.tubes": step(EQUIPMENT, [at("tm", "282")]),
    "pm.cost.weapons.record": provisional(EQUIPMENT, [at("tm", "282")], COST_RECORD_NOTE),
    "pm.cost.handheld": step(EQUIPMENT, [at("toaue", "219")]),
    // ---- Final cost (TM p.285): x (1 + tonnage / 100) ----
    "pm.cost.final": step(TOTAL, [at("tm", "285")]),
};
