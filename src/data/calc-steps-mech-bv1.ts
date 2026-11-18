/**
 * 'Mech Battle Value 1 step definitions, by BV1 edition (#599): where each step of the calculation comes from.
 *
 * Every entry was read on the page it cites, on 2026-11-10 and 2026-11-11; what each page says and how the code
 * compares is in docs/superpowers/plans/2026-11-10-cited-bv-ledger.md. The two editions print the same procedure;
 * each table cites its own book, and its own printing of Maximum Tech for Level 3. A step the edition's book does not
 * print (a Light engine or Stealth armor under the 1998 Master Rules) is `provisional` there, so one calculation
 * serves both. Change a citation only after reading
 * the page.
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

const CLAN_XL_NOTE = "The rules text gives x 0.75 for an XL engine and does not name the Clan XL. The book's worked example, a Goshawk with a Clan XL engine, multiplies its internal structure by 1.125. NGCFells follows the example.";
const UNLISTED_NOTE = "This edition's equipment tables print no Battle Value for the item. NGCFells uses its current (BV2) figure so the item is not worth nothing.";

/**
 * Maximum Tech's Level 3 steps (pp.90-92). The FASA printing (`mt`) and the FanPro Revised (`mt-revised`) print these
 * rules on the same pages; each Master Rules edition cites the printing written for it.
 */
const levelThree = (source: string): CalcStepDefs => ({
    "bv1.l3.item": step(OFFENSIVE, [at(source, "90")]),
    "bv1.l3.item.artemis-v": step(OFFENSIVE, [at(source, "90")]),
    "bv1.l3.ammo.special": step(OFFENSIVE, [at(source, "91")]),
    "bv1.l3.def.armor.hardened": step(DEFENSIVE, [at(source, "90-91")]),
    "bv1.l3.def.engine": step(DEFENSIVE, [at(source, "91")]),
    "bv1.l3.def.structure-type": step(DEFENSIVE, [at(source, "92")]),
    "bv1.l3.def.gyro": step(DEFENSIVE, [at(source, "92")]),
    "bv1.l3.def.command-console": step(DEFENSIVE, [at(source, "91")]),
    "bv1.l3.def.enhanced-imaging": step(DEFENSIVE, [at(source, "91")]),
    "bv1.l3.def.component-armor": step(DEFENSIVE, [at(source, "92")]),
    "bv1.l3.def.torso-cockpit": step(DEFENSIVE, [at(source, "91")]),
    "bv1.l3.def.case-ii": step(DEFENSIVE, [at(source, "92")]),
    "bv1.l3.def.coolant-pod": step(DEFENSIVE, [at(source, "92")]),
    "bv1.l3.def.factor.supercharger": step(DEFENSIVE, [at(source, "91")]),
    "bv1.l3.def.factor.null-signature": step(DEFENSIVE, [at(source, "92")]),
    "bv1.l3.def.factor.armless": step(DEFENSIVE, [at(source, "92")]),
    "bv1.l3.off.multi-trac": step(OFFENSIVE, [at(source, "91")]),
    "bv1.l3.off.targeting.variable-range": step(OFFENSIVE, [at(source, "91")]),
    "bv1.l3.off.targeting.enhanced-imaging": step(OFFENSIVE, [at(source, "91")]),
    "bv1.l3.off.speed.supercharger": step(OFFENSIVE, [at(source, "91")]),
    "bv1.l3.final.jump-pack": step(FINAL, [at(source, "92")]),
});

/** BattleTech Master Rules (FASA, 1998) pp.139-145, with the FanPro errata p.12; Level 3 from Maximum Tech (FASA) pp.90-92. */
const MASTER_RULES: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating ----
    "bv1.def.armor": step(DEFENSIVE, [at("bmr", "139")]),
    "bv1.def.structure": step(DEFENSIVE, [at("bmr", "139")]),
    "bv1.def.structure.clan-xl": provisional(DEFENSIVE, [at("bmr", "139"), at("bmr", "145")], CLAN_XL_NOTE),
    "bv1.def.structure.light-engine": provisional(DEFENSIVE, [at("bmrr", "152")],
        "The 1998 Master Rules have no Light engine. NGCFells uses the Revised Edition's multiplier, 1.125."),
    "bv1.def.tonnage": step(DEFENSIVE, [at("bmr", "139")]),
    "bv1.def.equipment": step(DEFENSIVE, [at("bmr", "139"), at("bmr", "142-144")]),
    // The errata rewrites the arm line: only CASE in the next location inward excuses ammunition in an arm.
    "bv1.def.explosive": step(DEFENSIVE, [at("bmr", "139-140"), at("bmr-errata", "12")]),
    "bv1.def.heat": step(DEFENSIVE, [at("bmr", "140")]),
    "bv1.def.heat.stealth": provisional(DEFENSIVE, [at("bmrr", "154")],
        "The 1998 Master Rules have no Stealth armor. NGCFells uses the Revised Edition's rule: 10 more heat."),
    "bv1.def.subtotal": step(DEFENSIVE, [at("bmr", "139")]),
    // The Defensive Movement Factors table (p.140) reads the Target Movement Modifier rows of the Attack Modifiers Table (p.32).
    "bv1.def.factor": step(DEFENSIVE, [at("bmr", "140"), at("bmr", "32")]),
    "bv1.def.rating": step(DEFENSIVE, [at("bmr", "140")]),

    // ---- Step 2: Offensive Battle Rating ----
    "bv1.off.weapon": step(OFFENSIVE, [at("bmr", "140"), at("bmr", "142-144")]),
    "bv1.off.weapon.unlisted": provisional(OFFENSIVE, [at("bmr", "142-144"), at("mt", "90")], UNLISTED_NOTE),
    "bv1.off.targeting-computer": step(OFFENSIVE, [at("bmr", "140"), at("bmr", "144")]),
    "bv1.off.ammo": step(OFFENSIVE, [at("bmr", "140"), at("bmr", "142-144")]),
    "bv1.off.base": step(OFFENSIVE, [at("bmr", "140")]),
    "bv1.off.heat": step(OFFENSIVE, [at("bmr", "140-141"), at("bmr-errata", "12")]),
    "bv1.off.speed": step(OFFENSIVE, [at("bmr", "140-141"), at("bmr-errata", "12")]),
    "bv1.off.speed.stealth": provisional(OFFENSIVE, [at("bmrr", "154")],
        "The 1998 Master Rules have no Stealth armor. NGCFells uses the Revised Edition's rule: 0.2 added to the Speed Factor."),
    "bv1.off.rating": step(OFFENSIVE, [at("bmr", "141")]),

    // ---- Step 3: Final Battle Value ----
    "bv1.final.round": step(FINAL, [at("bmr", "139"), at("bmr", "141")]),

    ...levelThree("mt"),
};

/** BattleTech Master Rules, Revised Edition pp.152-159; Level 3 from Maximum Tech, Revised pp.90-92. */
const MASTER_RULES_REVISED: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating ----
    "bv1.def.armor": step(DEFENSIVE, [at("bmrr", "152")]),
    "bv1.def.structure": step(DEFENSIVE, [at("bmrr", "152")]),
    "bv1.def.structure.clan-xl": provisional(DEFENSIVE, [at("bmrr", "152"), at("bmrr", "159")], CLAN_XL_NOTE),
    "bv1.def.structure.light-engine": step(DEFENSIVE, [at("bmrr", "152")]),
    "bv1.def.tonnage": step(DEFENSIVE, [at("bmrr", "152")]),
    "bv1.def.equipment": step(DEFENSIVE, [at("bmrr", "152"), at("bmrr", "156-158")]),
    "bv1.def.explosive": step(DEFENSIVE, [at("bmrr", "152-153")]),
    "bv1.def.heat": step(DEFENSIVE, [at("bmrr", "153")]),
    "bv1.def.heat.stealth": step(DEFENSIVE, [at("bmrr", "154")]),
    "bv1.def.subtotal": step(DEFENSIVE, [at("bmrr", "152")]),
    // The Defensive Movement Factors table (p.153) reads the Target Movement Modifier rows of the Attack Modifiers Table (p.33).
    "bv1.def.factor": step(DEFENSIVE, [at("bmrr", "153"), at("bmrr", "33")]),
    "bv1.def.rating": step(DEFENSIVE, [at("bmrr", "153")]),

    // ---- Step 2: Offensive Battle Rating ----
    "bv1.off.weapon": step(OFFENSIVE, [at("bmrr", "153"), at("bmrr", "156-158")]),
    "bv1.off.weapon.unlisted": provisional(OFFENSIVE, [at("bmrr", "156-158"), at("mt-revised", "90")], UNLISTED_NOTE),
    "bv1.off.targeting-computer": step(OFFENSIVE, [at("bmrr", "153"), at("bmrr", "158")]),
    "bv1.off.ammo": step(OFFENSIVE, [at("bmrr", "153"), at("bmrr", "156-158")]),
    "bv1.off.base": step(OFFENSIVE, [at("bmrr", "153")]),
    "bv1.off.heat": step(OFFENSIVE, [at("bmrr", "153-154")]),
    "bv1.off.speed": step(OFFENSIVE, [at("bmrr", "153-154")]),
    "bv1.off.speed.stealth": step(OFFENSIVE, [at("bmrr", "154")]),
    "bv1.off.rating": step(OFFENSIVE, [at("bmrr", "154")]),

    // ---- Step 3: Final Battle Value ----
    "bv1.final.round": step(FINAL, [at("bmrr", "152"), at("bmrr", "154")]),

    ...levelThree("mt-revised"),
};

/**
 * The one step of an edition older than the Battle Value system. Battle Value first appears in the BattleTech Master
 * Rules (1998), whose Battle Value System section opens on p.139.
 */
export const NO_BATTLE_VALUE_STEPS: CalcStepDefs = {
    "none.no-battle-value": step("Battle Value", [at("bmr", "139")]),
};

/** 'Mech BV1 step definitions by BV1 edition tag. */
export const MECH_BV1_STEPS: Record<string, CalcStepDefs> = {
    "master-rules": MASTER_RULES,
    "master-rules-revised": MASTER_RULES_REVISED,
};

/**
 * The BV1 step definitions `edition` reads: the newest BV1 edition at or before it (the Classic BattleTech box set
 * reads the Revised Master Rules). An edition with no BV1 table reads the Revised Master Rules' too.
 */
export const getMechBv1Steps = (edition: string): CalcStepDefs =>
    MECH_BV1_STEPS[getBattleValueEdition(edition)] ?? MASTER_RULES_REVISED;
