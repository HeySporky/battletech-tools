/**
 * Micro-Mech cost and Battle Value step definitions (#173, Custom Homebrew): where each step comes from.
 *
 * A Micro-Mech is fan-made. Its cost and Battle Value rules are the appendices of "Micro-Mechs" 6.1.0.2 (PDF pages
 * 11 and 12), which change rows of the BattleMech rules in the BattleTech Master Rules, Revised Edition: the cost
 * table on p.149 and the Battle Value procedure on pp.152-154. Both were read on 2026-11-13; the document's page
 * numbers fit the FanPro printing. The equipment figures are the document's own tables (PDF pages 7 to 11).
 *
 * `cited` here means the step follows the document or the Master Rules page as read. Every Battle Value is still
 * provisional as a whole: no official Battle Value exists for a fan-made unit (MicroMech.isBattleValueProvisional).
 * The BV2 table is NGCFells's (NGCFells's ruling 2, 2026-11-13): the document's changes run over the TechManual procedure. Each
 * of its steps is `provisional` and says what we did. Change a citation only after reading the page.
 */
import { CalcStepDefs, CalcStepStatus, ICalcCitation, ICalcStepDef } from "./calc-steps";

const STRUCTURE = "Structure and Systems";
const EQUIPMENT = "Equipment";
const FINAL_COST = "Final Cost";
const DEFENSIVE = "Defensive Battle Rating";
const OFFENSIVE = "Offensive Battle Rating";
const FINAL = "Final Battle Value";

const DOC = "micro-mechs-6.1.0.2";
const at = (source: string, page: string): ICalcCitation => ({ source, page });
const step = (section: string, cites: ICalcCitation[], status: CalcStepStatus = "cited", note?: string): ICalcStepDef =>
    note ? { section, cites, status, note } : { section, cites, status };
const provisional = (section: string, cites: ICalcCitation[], note: string): ICalcStepDef => step(section, cites, "provisional", note);

const BORROWED = "Solarmech's 2019 post prints no cost or Battle Value rules. This design uses those of version 6.1.0.2 with its own 2019 weights; joining the two is NGCFells's choice.";
const PRINTED = "The document's readout of this sample design prints this figure. The worked figure follows the rules text and is not adjusted to match.";

export const MICRO_MECH_COST_STEPS: CalcStepDefs = {
    // ---- The rows the document changes (appendix "Micro-Mech Costs") ----
    "mm.cost.cockpit": step(STRUCTURE, [at(DOC, "11")]),
    "mm.cost.life-support": step(STRUCTURE, [at(DOC, "11")]),
    "mm.cost.sensors": step(STRUCTURE, [at(DOC, "11")]),
    "mm.cost.actuators": step(STRUCTURE, [at(DOC, "11")]),
    "mm.cost.engine.ice": step(STRUCTURE, [at(DOC, "11")]),
    "mm.cost.jump-jets": step(STRUCTURE, [at(DOC, "11")]),
    "mm.cost.sealing": step(STRUCTURE, [at(DOC, "11")]),
    // ---- The rows it leaves as the BattleMech's (BattleMech Costs Table) ----
    "mm.cost.musculature": step(STRUCTURE, [at("bmrr", "149")]),
    "mm.cost.structure": step(STRUCTURE, [at("bmrr", "149")]),
    "mm.cost.engine": step(STRUCTURE, [at("bmrr", "149")]),
    "mm.cost.gyro": step(STRUCTURE, [at("bmrr", "149")]),
    "mm.cost.armor": step(STRUCTURE, [at("bmrr", "149")]),
    "mm.cost.heat-sinks": provisional(STRUCTURE, [at("bmrr", "149")],
        "The BattleMech table prices each heat sink over 10. A Micro-Mech's engine gives fewer than 10 free, and the document does not change the row. NGCFells follows the table as written: only heat sinks beyond the tenth cost anything."),
    "mm.cost.power-amplifiers": provisional(STRUCTURE, [at("tm", "278")],
        "Neither the document nor the Master Rules cost table prices power amplifiers. NGCFells uses the TechManual's price, 20,000 C-bills a ton."),

    // ---- Weapons and equipment (the document's tables) ----
    "mm.cost.equipment": step(EQUIPMENT, [at(DOC, "7-9")]),
    "mm.cost.ammo": provisional(EQUIPMENT, [at(DOC, "9-11")],
        "The document's sample designs count the ammunition they carry in their Total Cost, so we do too (NGCFells's ruling, 2026-11-13), at the table's cost per ton for the weight carried. Special munitions are not offered yet."),
    "mm.cost.subtotal": step(EQUIPMENT, [at("bmrr", "149")]),

    // ---- Final cost ----
    "mm.cost.multiplier": step(FINAL_COST, [at("bmrr", "149")]),
    "mm.cost.final": provisional(FINAL_COST, [at(DOC, "16, 20, 22")],
        "Neither text says how to round. Rounding each fraction up to the whole C-bill gives the printed cost of the three sound sample designs exactly (Storm 695,853; Hillman 852,898; Slayer 1,073,387), so NGCFells rounds up (NGCFells's ruling, 2026-11-13)."),
    "mm.cost.printed": provisional(FINAL_COST, [at(DOC, "16-22")], PRINTED),
    "mm.cost.borrowed": provisional(FINAL_COST, [], BORROWED),
};

/**
 * The document's Battle Value: the Master Rules (Revised) BattleMech procedure with the document's changes. Used
 * under both BV1 editions; the document names the Revised Edition's pages.
 */
export const MICRO_MECH_BV1_STEPS: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating ----
    "mm.bv1.def.armor": step(DEFENSIVE, [at("bmrr", "152")]),
    "mm.bv1.def.structure": step(DEFENSIVE, [at("bmrr", "152")]),
    "mm.bv1.def.tonnage": step(DEFENSIVE, [at(DOC, "12"), at("bmrr", "152")]),
    "mm.bv1.def.equipment": step(DEFENSIVE, [at("bmrr", "152"), at(DOC, "7-9")]),
    "mm.bv1.def.explosive": step(DEFENSIVE, [at(DOC, "12")]),
    "mm.bv1.def.explosive.head": provisional(DEFENSIVE, [at(DOC, "12"), at("bmrr", "152-153")],
        "The document names the torso, the legs and the arms. Ammunition in the head is counted as ammunition in the torso or legs, as the BattleMech rule groups the head with them."),
    "mm.bv1.def.no-heat": step(DEFENSIVE, [at(DOC, "12")]),
    "mm.bv1.def.subtotal": step(DEFENSIVE, [at("bmrr", "152")]),
    "mm.bv1.def.factor": step(DEFENSIVE, [at("bmrr", "153"), at("bmrr", "33"), at(DOC, "12")]),
    "mm.bv1.def.rating": step(DEFENSIVE, [at("bmrr", "153")]),

    // ---- Step 2: Offensive Battle Rating ----
    "mm.bv1.off.weapon": step(OFFENSIVE, [at("bmrr", "153"), at(DOC, "7-9")]),
    "mm.bv1.off.weapon.artemis": provisional(OFFENSIVE, [at(DOC, "9")],
        "The table's note adds 20 percent to a missile launcher equipped with Artemis IV. A Micro-Mech's Artemis IV is a separate item: each one is read as fitted to one LRM or SRM launcher, in the order they were mounted."),
    "mm.bv1.off.equipment": step(OFFENSIVE, [at("bmrr", "153"), at(DOC, "7-9")]),
    "mm.bv1.off.force": provisional(OFFENSIVE, [at(DOC, "9"), at("bmrr", "157-158")],
        "The table gives this item no Battle Value of its own and points to the Master Rules, where its value is worked out for the force it fights in. Nothing is added here."),
    "mm.bv1.off.ammo": step(OFFENSIVE, [at(DOC, "12"), at(DOC, "9-11")]),
    "mm.bv1.off.base": step(OFFENSIVE, [at("bmrr", "153")]),
    "mm.bv1.off.no-heat": step(OFFENSIVE, [at(DOC, "12")]),
    "mm.bv1.off.speed": step(OFFENSIVE, [at("bmrr", "153-154")]),
    "mm.bv1.off.rating": step(OFFENSIVE, [at("bmrr", "154")]),

    // ---- Step 3: Final Battle Value ----
    "mm.bv1.final.round": step(FINAL, [at("bmrr", "154")]),
    "mm.bv1.final.printed": provisional(FINAL, [at(DOC, "16-22")], PRINTED),
    "mm.bv1.final.borrowed": provisional(FINAL, [], BORROWED),
};

const OURS = "This Battle Value 2 is NGCFells's, not the document's (NGCFells's ruling, 2026-11-13). ";

/** Our provisional BV2: the TechManual BattleMech procedure with each of the document's changes carried across. */
export const MICRO_MECH_BV2_STEPS: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating ----
    "mm.bv2.def.armor": provisional(DEFENSIVE, [at("tm", "302")], `${OURS}Armor as a BattleMech's: points x 2.5.`),
    "mm.bv2.def.structure": provisional(DEFENSIVE, [at("tm", "302")], `${OURS}Internal structure as a BattleMech's: points x 1.5.`),
    "mm.bv2.def.tonnage": provisional(DEFENSIVE, [at("tm", "302"), at(DOC, "12")],
        `${OURS}The document counts the Micro-Mech's tonnage in the defensive rating. Under BV2 the tonnage enters there through the gyro: tonnage x 0.5, the standard gyro's figure.`),
    "mm.bv2.def.equipment": provisional(DEFENSIVE, [at("tm", "302")],
        `${OURS}Defensive equipment (ECM and, under BV2, active probes) at the Battle Value the JBT catalog holds for the same item.`),
    "mm.bv2.def.explosive": provisional(DEFENSIVE, [at("tm", "302-303"), at(DOC, "12")],
        `${OURS}BV2 takes 15 points for each slot of explosive ammunition where Battle Value 1 took 20 a ton, and the document changes that 20 to 30, 30 and 20. NGCFells keeps the document's proportions, by weight: 22.5 points a ton in the torso, legs or head, or in an arm when the torso has no CASE; 15 a ton in an arm when the torso has CASE. CASE II excuses its location, as BV2 has it. A part ton counts its fraction.`),
    "mm.bv2.def.subtotal": provisional(DEFENSIVE, [at("tm", "302-303")], `${OURS}Additions less subtractions, never below 1.`),
    "mm.bv2.def.factor": provisional(DEFENSIVE, [at("tm", "303"), at("tm", "316"), at(DOC, "12")],
        `${OURS}The BattleMech's defensive factor, plus the 0.1 the document adds for a Micro-Mech.`),
    "mm.bv2.def.rating": provisional(DEFENSIVE, [at("tm", "303")], `${OURS}Running total x defensive factor.`),

    // ---- Step 2: Offensive Battle Rating ----
    "mm.bv2.off.weapon": provisional(OFFENSIVE, [at("tm", "303-304")],
        `${OURS}Each weapon at the BV2 figure the JBT catalog holds for the same weapon. A Micro-Mech makes no heat, so there is no heat efficiency limit: every weapon counts in full.`),
    "mm.bv2.off.weapon.document": provisional(OFFENSIVE, [at(DOC, "7-9")],
        `${OURS}No book prints a BV2 figure for this item, so it keeps the document's own figure.`),
    "mm.bv2.off.weapon.artemis": provisional(OFFENSIVE, [at("tm", "303"), at(DOC, "9")],
        `${OURS}Artemis IV adds 20 percent to its launcher, not to the ammunition. Each Artemis IV is read as fitted to one LRM or SRM launcher, in the order they were mounted.`),
    "mm.bv2.off.equipment": provisional(OFFENSIVE, [at("tm", "303-304")], `${OURS}Other equipment at the BV2 figure the JBT catalog holds for it.`),
    "mm.bv2.off.force": provisional(OFFENSIVE, [at("tm", "315")],
        `${OURS}C3 and TAG have no Battle Value of their own; their value is worked out for the force. Nothing is added here.`),
    "mm.bv2.off.ammo": provisional(OFFENSIVE, [at("tm", "303"), at(DOC, "12")],
        `${OURS}Ammunition at its BV2 figure per ton, times the weight carried, unrounded: the document's rule for a part ton. Where no book prints a BV2 figure the document's figure is kept.`),
    "mm.bv2.off.ammo.cap": provisional(OFFENSIVE, [at("tm", "303")],
        `${OURS}As for a BattleMech, a weapon's ammunition cannot be worth more than the weapons that fire it.`),
    "mm.bv2.off.ammo.total": provisional(OFFENSIVE, [at("tm", "303-304")], `${OURS}The ammunition counted is added to the weapon rating.`),
    "mm.bv2.off.tonnage": provisional(OFFENSIVE, [at("tm", "304")], `${OURS}The BattleMech procedure adds the unit's tonnage to the weapon rating.`),
    "mm.bv2.off.speed": provisional(OFFENSIVE, [at("tm", "304"), at("tm", "316")],
        `${OURS}Running MP plus half the Jumping MP, rounded up, on the Speed Factor Table.`),
    "mm.bv2.off.rating": provisional(OFFENSIVE, [at("tm", "304")], `${OURS}Weapon rating x speed factor.`),

    // ---- Step 3: Final Battle Value ----
    "mm.bv2.final.round": provisional(FINAL, [at("tm", "304")], `${OURS}Defensive plus offensive, rounded to the nearest whole number.`),
    "mm.bv2.final.borrowed": provisional(FINAL, [], BORROWED),
};

/**
 * What the document's readouts print for its four sample designs (PDF pages 16 to 22). Shown beside our figure when a
 * design has the sample's name, tonnage and weight. The Tunnel Rat's printed figures are corrupt in the document (its
 * mass prints as 90 tons).
 */
export interface IMicroMechPrintedFigures { name: string; tons: number; weightKg: number; cost: number; battleValue: number; corrupt?: true }
export const MICRO_MECH_PRINTED_FIGURES: IMicroMechPrintedFigures[] = [
    { name: "Storm STM-3X", tons: 11, weightKg: 10975, cost: 695853, battleValue: 217 },
    { name: "Tunnel Rat TNR-1X", tons: 13, weightKg: 12975, cost: 8993460, battleValue: 1117, corrupt: true },
    { name: "Hillman HMN-2X", tons: 15, weightKg: 14975, cost: 852898, battleValue: 352 },
    { name: "Slayer SL-X4", tons: 18, weightKg: 17925, cost: 1073387, battleValue: 531 },
];
