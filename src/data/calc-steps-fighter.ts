/**
 * Fighter Battle Value and cost step definitions (#599, the fighter round): where each step comes from.
 *
 * BV2: Calculating Aerospace BV, TM pp.311-313 (worked TRB-D36 Thunderbird p.313), with the Unit Type Modifiers and
 * Speed Factor tables on p.316 and external stores on p.315; the drone operating system on TO:AUE p.193 and the Smart
 * Robotic Control System on IO:AE p.187. Read on 2026-11-22 (the TechManual in the extract of its 2020 Corrected
 * Fourth Printing). What each page says is in docs/superpowers/plans/2026-11-10-cited-bv-ledger.md,
 * "Fighters". Support Vehicle aircraft (Fixed-Wing, Airship, Satellite) are the Support Vehicle round's. Change a
 * citation only after reading the page.
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

export const FIGHTER_BV2_STEPS: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating (TM p.311) ----
    "af.bv2.def.armor": step(DEFENSIVE, [at("tm", "311")]),
    "af.bv2.def.armor.modular": provisional(DEFENSIVE, [at("tm", "311"), at("toaue", "93")],
        "Each modular armor pack adds 10 armor points (TO:AUE p.93); they are counted at 2.5 a point with the armor, as a vehicle's are and as MegaMek and the MUL count them. No page that says so for fighters was read."),
    "af.bv2.def.structure": step(DEFENSIVE, [at("tm", "311")]),
    // Screen launchers, anti-missile systems and ECM, their ammunition up to the system's own BV (dagger items, pp.317-318).
    "af.bv2.def.equipment": step(DEFENSIVE, [at("tm", "311"), at("tm", "317-318")]),
    "af.bv2.def.equipment.ams-ammo": step(DEFENSIVE, [at("tm", "311")]),
    // 15 per type of explosive ammunition, 1 per Gauss weapon, on an Inner Sphere fighter without CASE.
    "af.bv2.def.explosive": step(DEFENSIVE, [at("tm", "311")]),
    // The table treats an HVAC, M-Pod, B-Pod, Chaff Pod and the other marked items as Gauss weapons (TO:AUE p.195).
    "af.bv2.def.gauss": step(DEFENSIVE, [at("tm", "311"), at("toaue", "195")]),
    "af.bv2.def.clan-case": step(DEFENSIVE, [at("tm", "311")]),
    "af.bv2.def.floor": step(DEFENSIVE, [at("tm", "311")]),
    "af.bv2.def.subtotal": step(DEFENSIVE, [at("tm", "311")]),
    // x the Unit Type Modifier: Aerospace Fighter 1.2, Conventional Fighter 1.1.
    "af.bv2.def.rating": step(DEFENSIVE, [at("tm", "311"), at("tm", "316")]),

    // ---- Step 2: Offensive Battle Rating (TM pp.311-313) ----
    // Each weapon's BV from the tables (a launcher with Artemis IV x 1.2), a linked targeting computer x 1.25, the
    // weaker of the forward-firing (nose and wings) and aft groups (by unmodified BV) half; past the Heat
    // Efficiency, half again. The page compares "nose-mounted" weapons and halves "the forward-firing" ones: a
    // fighter's wing weapons fire forward, so they join the nose, as the MUL and MegaMek have it (ledger A8).
    "af.bv2.off.weapon": step(OFFENSIVE, [at("tm", "312"), at("tm", "317-318")]),
    // Ammunition at its BV, capped at the unmodified BV of all the weapons of the model it feeds.
    "af.bv2.off.ammo": step(OFFENSIVE, [at("tm", "312"), at("tm", "317-318")]),
    "af.bv2.off.ammo.cap": step(OFFENSIVE, [at("tm", "312")]),
    "af.bv2.off.equipment": step(OFFENSIVE, [at("tm", "312")]),
    // Heat Efficiency: 6 + heat sink capacity for an aerospace fighter.
    "af.bv2.off.heat.efficiency": step(OFFENSIVE, [at("tm", "312")]),
    // Every offensive weapon's heat, aft ones too: Ultra x 2, rotary x 6, Streak half, one-shot a quarter.
    "af.bv2.off.heat.weapons": step(OFFENSIVE, [at("tm", "312")]),
    // The heat rule names aerospace fighters, Small Craft and DropShips; a conventional fighter tracks none.
    "af.bv2.off.heat.conventional": step(OFFENSIVE, [at("tm", "312")]),
    "af.bv2.off.weapons.total": step(OFFENSIVE, [at("tm", "312")]),
    // Maximum Thrust against the Speed Factor Table.
    "af.bv2.off.speed": step(OFFENSIVE, [at("tm", "313"), at("tm", "316")]),
    "af.bv2.off.rating": step(OFFENSIVE, [at("tm", "313")]),

    // ---- Step 3: Final Battle Value (TM p.313) ----
    "af.bv2.final.sum": step(FINAL, [at("tm", "313")]),
    "af.bv2.final.robotic": step(FINAL, [at("ioae", "187")]),
    "af.bv2.final.drone": step(FINAL, [at("toaue", "193")]),
    "af.bv2.final.equipment": provisional(FINAL, [],
        "This item's record multiplies the final Battle Value, and its rule has not yet been read on the page."),
    "af.bv2.final.round": step(FINAL, [at("tm", "311"), at("tm", "313")]),
    // Bombs and other external stores join the BV before skill, in the force (TM p.315), not the fighter's own BV.
    "af.bv2.final.stores": step(FINAL, [at("tm", "315")]),
};

const UNLISTED_NOTE = "This edition's equipment tables print no Battle Value for the item. NGCFells uses its current (BV2) figure so the item is not worth nothing.";
const HEAT_NOTE = "AeroTech 2 names the maximum potential Heat Points but not how they are counted. NGCFells adds every weapon's heat, aft ones too since they count at full value, as the aerospace weapon tables give it (an Ultra autocannon's is already its full rate), and deducts only heat over the heat sink capacity.";
const HEAT_SINKS_NOTE = "The formula reads \"Total heat sinks\", while the condition above it and the BattleMech rule it comes from use the heat sink capacity. NGCFells uses the capacity: the same for single heat sinks, twice the count for double ones.";
const FLOOR_NOTE = "AeroTech 2 sets no floor for the subtractions. NGCFells stops them at 1, as the BattleMech rule the procedure follows does.";
const TC_NOTE = "AeroTech 2 adds equipment at its Battle Value; the Master Rules give a targeting computer's as 20 percent of the weapons it links. NGCFells uses that, with aft weapons at full value as AeroTech 2 counts them.";

/**
 * Fighter BV1 under a Battle Value 1 edition (#599): AeroTech 2 (FASA, 2000) pp.53-54 under the 1998 Master Rules, with
 * that book's equipment tables (pp.142-144) and Speed Factor Table (p.140); AeroTech 2, Revised (FanPro, 2004) p.81
 * under the Revised Edition, with its tables (pp.156-158) and Speed Factor Table (p.153). Both print the same
 * procedure; AT2R p.65 adds that Clan units come with CASE. Each Master Rules edition's printing of Maximum Tech gives
 * the Level 3 items (p.90). Read on 2026-11-22 on the page images (written back to the library's extracts).
 */
const fighterBv1 = (book: "at2" | "at2r"): CalcStepDefs => {
    // AT2 prints step 1 and the base weapon rating on p.53, the rest on p.54; AT2R prints all of it on p.81.
    const first = at(book, book === "at2" ? "53" : "81");
    const second = at(book, book === "at2" ? "54" : "81");
    const tables = book === "at2" ? at("bmr", "142-144") : at("bmrr", "156-158");
    const speed = book === "at2" ? at("bmr", "140") : at("bmrr", "153");
    const mechRule = book === "at2" ? at("bmr", "139-140") : at("bmrr", "152-153");
    const maxTech = book === "at2" ? "mt" : "mt-revised";
    return {
        // ---- Step 1: Defensive Battle Rating ----
        "af.bv1.def.armor": step(DEFENSIVE, [first]),
        "af.bv1.def.structure": step(DEFENSIVE, [first]),
        "af.bv1.def.fuel": step(DEFENSIVE, [first]),
        // Anti-missile systems with their ammunition, ECM suites and screen launchers.
        "af.bv1.def.equipment": step(DEFENSIVE, [first, tables]),
        "af.bv1.def.explosive": step(DEFENSIVE, [first]),
        "af.bv1.def.explosive.case": step(DEFENSIVE, [first]),
        "af.bv1.def.clan-case": book === "at2r" ? step(DEFENSIVE, [at("at2r", "65"), first])
            : provisional(DEFENSIVE, [first, at("at2r", "65")], "AeroTech 2 does not say a Clan fighter has CASE. NGCFells follows the Revised Edition, which fits Clan units with it automatically (AT2R p.65)."),
        "af.bv1.def.heat": provisional(DEFENSIVE, [first], HEAT_NOTE),
        "af.bv1.def.floor": provisional(DEFENSIVE, [first, mechRule], FLOOR_NOTE),
        "af.bv1.def.subtotal": step(DEFENSIVE, [first]),
        // x the unit class multiplier: aerospace fighter 1.2, conventional fighter 1.1.
        "af.bv1.def.rating": step(DEFENSIVE, [first]),

        // ---- Step 2: Offensive Battle Rating ----
        // Every weapon and offensive item at the edition's Battle Value; aft-mounted ones at full value.
        "af.bv1.off.weapon": step(OFFENSIVE, [first, tables]),
        "af.bv1.off.weapon.unlisted": provisional(OFFENSIVE, [tables, at(maxTech, "90")], UNLISTED_NOTE),
        "af.bv1.l3.item": step(OFFENSIVE, [at(maxTech, "90")]),
        "af.bv1.l3.ammo.special": step(OFFENSIVE, [at(maxTech, "91")]),
        "af.bv1.off.targeting-computer": provisional(OFFENSIVE, [first, book === "at2" ? at("bmr", "140") : at("bmrr", "153")], TC_NOTE),
        "af.bv1.off.ammo": step(OFFENSIVE, [first, tables]),
        "af.bv1.off.ammo.cap": step(OFFENSIVE, [first]),
        "af.bv1.off.base": step(OFFENSIVE, [first]),
        // Over the heat sink capacity: X = capacity x base / maximum heat, Y = (base - X) / 2, X + Y.
        "af.bv1.off.heat": provisional(OFFENSIVE, [first, second], HEAT_SINKS_NOTE),
        // The Bombing Battle Rating: the fighter's tonnage.
        "af.bv1.off.bombing": step(OFFENSIVE, [second]),
        // Maximum Thrust against the Master Rules' Speed Factor Table.
        "af.bv1.off.speed": step(OFFENSIVE, [second, speed]),
        "af.bv1.off.rating": step(OFFENSIVE, [second]),

        // ---- Step 3: Final BV, the sum rounded ----
        "af.bv1.final.round": step(FINAL, [second]),
    };
};

const FIGHTER_BV1_AT2 = fighterBv1("at2");
const FIGHTER_BV1_AT2R = fighterBv1("at2r");

/** The fighter BV1 steps of `edition`: AeroTech 2's under the 1998 Master Rules, the Revised Edition's otherwise. */
export const getFighterBv1Steps = (edition: string): CalcStepDefs =>
    getBattleValueEdition(edition) === "master-rules" ? FIGHTER_BV1_AT2 : FIGHTER_BV1_AT2R;

const STRUCTURE = "Structure and Systems";
const EQUIPMENT = "Equipment";
const FINAL_COST = "Final Cost";

/**
 * Fighter cost (#599): the Aerospace Unit Structural Costs table, TM p.283 (read on the page image, all four printings
 * in the library), the weapons and equipment rule on p.282 and the Final Cost Formulas on p.285; the laser 'Mechbuster
 * worked on pp.277, 284 and 286. A Support Vehicle aircraft is priced by the Support Vehicle rules (that round).
 */
export const FIGHTER_COST_STEPS: CalcStepDefs = {
    // ---- Structural costs (TM p.283) ----
    "af.cost.cockpit": step(STRUCTURE, [at("tm", "283")]),
    "af.cost.life-support": step(STRUCTURE, [at("tm", "283")]),
    "af.cost.sensors": step(STRUCTURE, [at("tm", "283")]),
    // A conventional fighter's controls: 4,000 a ton.
    "af.cost.avionics": step(STRUCTURE, [at("tm", "283"), at("tm", "277")]),
    "af.cost.vstol": step(STRUCTURE, [at("tm", "283")]),
    // 5,000 + 10,000 x the system's tons (IO:AE p.215 table).
    "af.cost.robotic": step(STRUCTURE, [at("ioae", "215")]),
    // 50,000 a point for an aerospace fighter, 4,000 for a conventional one.
    "af.cost.structure": step(STRUCTURE, [at("tm", "283")]),
    "af.cost.thruster": step(STRUCTURE, [at("tm", "283")]),
    "af.cost.landing-gear": step(STRUCTURE, [at("tm", "283")]),
    // The engine type's rate x rating x tonnage / 75.
    "af.cost.engine": step(STRUCTURE, [at("tm", "283")]),
    "af.cost.fuel": step(STRUCTURE, [at("tm", "283")]),
    "af.cost.armor": step(STRUCTURE, [at("tm", "283")]),
    "af.cost.armor.patchwork": provisional(STRUCTURE, [at("tm", "283"), at("toaue", "189")],
        "Each arc's armor is priced at its own type's cost per ton. The page that prices patchwork armor was not re-read for this breakdown."),
    // Single 2,000, double 6,000, for every heat sink.
    "af.cost.heat-sinks": step(STRUCTURE, [at("tm", "283")]),
    "af.cost.power-amplifiers": step(STRUCTURE, [at("tm", "283")]),
    "af.cost.structure.total": step(STRUCTURE, [at("tm", "283"), at("tm", "284")]),

    // ---- Weapons and equipment (TM p.282) ----
    "af.cost.equipment": provisional(EQUIPMENT, [at("tm", "282")],
        "The rule is read: every weapon and item adds its listed cost. The price of each item comes from the JBT equipment records; the items' table rows were not re-read for this breakdown."),
    "af.cost.ammo": provisional(EQUIPMENT, [at("tm", "282")],
        "The rule is read: ammunition need not be bought to find a unit's cost, so it is left out of the cost and shown only in the loaded cost. Each ton's price comes from the JBT equipment records."),
    // A Clan structure presumes CASE where it stores ammunition or explosive equipment (TM p.210); the one CASE row, 50,000, covers both tech bases (TM p.292).
    "af.cost.clan-case": step(EQUIPMENT, [at("tm", "210"), at("tm", "292")]),
    "af.cost.subtotal": step(EQUIPMENT, [at("tm", "282"), at("tm", "284")]),

    // ---- Final cost (TM p.285) ----
    "af.cost.omni": step(FINAL_COST, [at("tm", "285")]),
    "af.cost.tonnage-multiplier": step(FINAL_COST, [at("tm", "285")]),
    "af.cost.final": provisional(FINAL_COST, [at("tm", "274"), at("tm", "285")],
        "The book gives two rounding rules. Its text says to round up to the nearest hundredth of a C-bill once the final multipliers are applied (p.274); its worked 'Mechbuster rounds 572,041.666 up to the whole C-bill (p.285) and its 'Mech examples round down. NGCFells rounds to the nearest whole C-bill, which gives the 'Mechbuster's printed 572,042."),
    "af.cost.final.loaded": provisional(FINAL_COST, [at("tm", "282")],
        "The loaded cost adds the ammunition carried to the final cost. The book does not define a loaded cost; it only says ammunition need not be bought."),
};

/** Where each modifier inside a fighter weapon's Modified BV comes from: added to that weapon's step when it applies. */
export const FIGHTER_BV2_WEAPON_CITES = {
    targetingComputer: at("tm", "312"),
    machineGunArray: at("tm", "317"),
    droneOperatingSystem: at("toaue", "193"),
} satisfies Record<string, ICalcCitation>;
