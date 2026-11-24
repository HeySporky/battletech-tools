/**
 * Combat Vehicle Battle Value and cost step definitions (#599, the Combat Vehicle round): where each step comes from.
 *
 * BV2: Calculating Vehicle BV, TM pp.307-308 (worked Hephaestus Prime and CellCo Ranger p.308), with the Defensive
 * Factors, Unit Type Modifiers, Offensive BV Adjustment and Speed Factor tables on p.316 and the equipment tables on
 * pp.317-318; TO:AUE pp.190-194 (rail, large naval vessels, armor type modifiers, chassis modifications, drone
 * systems, vehicular jump jets); IO:AE pp.185 and 187. Read on 2026-11-23 (the TechManual in the extract of its 2020
 * Corrected Fourth and 2021 Sixth Printings). What each page says is in docs/superpowers/plans/2026-11-10-cited-bv-ledger.md,
 * "Combat Vehicles". Support Vehicle-only steps are provisional until the Support Vehicle round. Change a citation
 * only after reading the page.
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

const SUPPORT_NOTE = "A Support Vehicle rule: its steps wait for the Support Vehicle round and are read there.";

export const VEHICLE_BV2_STEPS: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating (TM p.307) ----
    "cv.bv2.def.armor": step(DEFENSIVE, [at("tm", "307"), at("toaue", "192")]),
    // Support Vehicle armor x BAR / 10. TM p.308's CellCo Ranger example leaves out the x 2.5 (38 x 0.7 = 26.6); the rule text and MegaMek keep it.
    "cv.bv2.def.armor.support": provisional(DEFENSIVE, [at("tm", "307"), at("tm", "308")],
        `${SUPPORT_NOTE} The CellCo Ranger example (TM p.308) leaves out the x 2.5 on armor (38 x 0.7 = 26.6); NGCFells reads that as a misprint and keeps the rule text's x 2.5.`),
    "cv.bv2.def.armor.patchwork": provisional(DEFENSIVE, [at("tm", "307"), at("toaue", "189"), at("toaue", "192")],
        "Each location's points count at its own armor type's modifier (TO:AUE p.192 table); no page states the per-location reading for a vehicle."),
    "cv.bv2.def.armor.modular": provisional(DEFENSIVE, [at("tm", "307"), at("toaue", "93")],
        "Each modular armor pack adds armor points (TO:AUE p.93); they are counted at 2.5 a point with no armor type modifier, as the MUL and MegaMek count them. No page that says so for vehicles was read."),
    "cv.bv2.def.structure": step(DEFENSIVE, [at("tm", "307")]),
    "cv.bv2.def.structure.reinforced": provisional(DEFENSIVE, [at("tm", "307")],
        "Reinforced structure counts double, as a 'Mech's does; no vehicle page was read for it."),
    // Anti-missile systems, ECM, probes and the other dagger items (pp.317-318), ammunition for the AMS up to the system's own BV.
    "cv.bv2.def.equipment": step(DEFENSIVE, [at("tm", "307"), at("tm", "317-318")]),
    "cv.bv2.def.equipment.mast": provisional(DEFENSIVE, [at("toaue", "194")],
        "Each item in a VTOL Mast Mount costs 10 BV more (the record cites TO:AUE p.194); the page was not read for the Battle Value reading."),
    "cv.bv2.def.equipment.ams-ammo": step(DEFENSIVE, [at("tm", "307")]),
    "cv.bv2.def.subtotal": step(DEFENSIVE, [at("tm", "307")]),
    // x the Unit Type Modifier (p.316: surface, hydrofoil and submarine units are Naval; Rail 0.6, TO:AUE p.190).
    "cv.bv2.def.type": step(DEFENSIVE, [at("tm", "307"), at("tm", "316")]),
    "cv.bv2.def.type.rail": step(DEFENSIVE, [at("tm", "316"), at("toaue", "190")]),
    // Combat Vehicle chassis modifications add to the Unit Type Modifier (TO:AUE p.193).
    "cv.bv2.def.chassis": step(DEFENSIVE, [at("toaue", "193")]),
    // x the Defensive Factor: the highest potential target modifier (TM p.316 table and footnote). The step adds
    // TO:AUE p.194 when the vehicle jumps (vehicular jump jets use jump movement like a 'Mech), TO:AUE p.192 for stealth
    // armor (the 'Mech's modifier) and TW p.199 for a WiGE (+1 against an airborne WiGE).
    "cv.bv2.def.factor": step(DEFENSIVE, [at("tm", "307"), at("tm", "316")]),
    "cv.bv2.def.rating": step(DEFENSIVE, [at("tm", "307"), at("tm", "316")], "cited"),

    // ---- Step 2: Offensive Battle Rating (TM pp.307-308) ----
    // A weapon's BV from the tables (a launcher with Artemis IV x 1.2, a linked targeting computer x 1.25); the rear arc
    // counts half unless it is the stronger, then the front does (TM p.307).
    "cv.bv2.off.weapon": step(OFFENSIVE, [at("tm", "307"), at("tm", "317-318")]),
    "cv.bv2.off.weapon.rear": step(OFFENSIVE, [at("tm", "307"), at("tm", "317-318")]),
    // Turret weapons by printing: the current text (TM 2007 and 6th printing, BV v4.1) counts them in no arc, in full;
    // the 3rd and 4th printings (BV v4.0 and 2.1) treat them as facing forward (owner call 4, the printing alternate).
    "cv.bv2.off.weapon.turret": step(OFFENSIVE, [at("tm", "307"), at("tm", "317-318")]),
    "cv.bv2.off.weapon.turret.forward": step(OFFENSIVE, [at("tm", "307"), at("tm", "317-318")]),
    "cv.bv2.off.weapon.side": provisional(OFFENSIVE, [at("tm", "307"), at("tm", "317-318")],
        "TM p.307 names only the front, rear and turret arcs. Side-arc weapons count in full, as the MUL counts them (Sea Skimmer Hydrofoil, BV 288)."),
    "cv.bv2.off.weapon.mga": step(OFFENSIVE, [at("tm", "228"), at("tm", "317-318")]),
    "cv.bv2.off.weapon.grenade": provisional(OFFENSIVE, [at("tm", "317-318")],
        "The vehicular grenade launcher is rated as a weapon in its arc; no table row was read for it."),
    "cv.bv2.off.equipment": provisional(OFFENSIVE, [at("tm", "317-318")],
        "Other equipment with a Battle Value (industrial tools, mine dispensers) adds in full, as the MUL and MegaMek count it; no page says so."),
    "cv.bv2.off.drone": step(OFFENSIVE, [at("toaue", "193")]),
    "cv.bv2.off.ammo": step(OFFENSIVE, [at("tm", "307"), at("tm", "317-318")]),
    "cv.bv2.off.ammo.cap": step(OFFENSIVE, [at("tm", "307")]),
    // Support Vehicle heavy weapons and their ammunition x the fire control's adjustment (p.316).
    "cv.bv2.off.firecontrol": provisional(OFFENSIVE, [at("tm", "307"), at("tm", "316")], SUPPORT_NOTE),
    "cv.bv2.off.weight": step(OFFENSIVE, [at("tm", "307")]),
    "cv.bv2.off.base": step(OFFENSIVE, [at("tm", "307")]),
    // Flanking MP against the Speed Factor Table (p.316); an unmotorized trailer's Flanking MP is 1 (p.308).
    "cv.bv2.off.speed": step(OFFENSIVE, [at("tm", "308"), at("tm", "316")]),
    "cv.bv2.off.speed.rail": step(OFFENSIVE, [at("tm", "316"), at("toaue", "190")]),
    "cv.bv2.off.rating": step(OFFENSIVE, [at("tm", "308")]),

    // ---- Step 3: Final Battle Value (TM p.308) ----
    "cv.bv2.final.sum": step(FINAL, [at("tm", "308")]),
    "cv.bv2.final.robotic": step(FINAL, [at("ioae", "187")]),
    "cv.bv2.final.drone": step(FINAL, [at("toaue", "193")]),
    "cv.bv2.final.round": step(FINAL, [at("tm", "308")]),
};

const UNLISTED_NOTE = "This edition's equipment tables print no Battle Value for the item. NGCFells uses its current (BV2) figure so the item is not worth nothing.";
const BOOSTED_NOTE = "Maximum Tech counts a supercharger or jet booster in the Defensive Movement Factor and adds 1 to the Speed Factor MP \"in the same manner as for MASC\" (p.91).";

/**
 * Combat Vehicle BV1 (#599), by edition: BattleTech Master Rules (FASA, 1998) pp.141-142 with the FanPro errata p.12
 * (Internal Structure divided by 2, the sign missing on the 1998 page), Vehicle Type Modifiers on p.141 and the
 * Defensive Movement Factors and Speed Factor tables on p.140; BMR(R) pp.154-155 with its tables on p.153. Each Master
 * Rules edition cites its own printing of Maximum Tech (pp.90-92, the Level 3 vehicle rules). Read on 2026-11-23 on the
 * page images (written back to the library's extracts); no book prints a vehicle BV1 example.
 */
const vehicleBv1 = (book: "bmr" | "bmrr"): CalcStepDefs => {
    const first = at(book, book === "bmr" ? "141" : "154");
    const second = at(book, book === "bmr" ? "142" : "155");
    const speed = at(book, book === "bmr" ? "140" : "153");
    const errata = book === "bmr" ? [at("bmr-errata", "12")] : [];
    const shares = book === "bmr" ? [first, at("bmr", "143")] : [first, at("bmrr", "121")];
    const maxTech = book === "bmr" ? "mt" : "mt-revised";
    return {
        // ---- Step 1: Defensive Battle Rating ----
        "cv.bv1.def.armor": step(DEFENSIVE, [first]),
        // Internal Structure divided by 2, turret and rotor included (the 1998 page's sign is missing; the errata and BMR(R) print it).
        "cv.bv1.def.structure": step(DEFENSIVE, [first, ...errata]),
        "cv.bv1.def.equipment": step(DEFENSIVE, [first]),
        "cv.bv1.def.equipment.unlisted": provisional(DEFENSIVE, [first], UNLISTED_NOTE),
        "cv.bv1.def.subtotal": step(DEFENSIVE, [first]),
        // x the Vehicle Type Modifier: Tracked 0.8, Wheeled 0.7, Hover 0.6, Naval 0.5, VTOL 0.4 (surface vessels, hydrofoils and submarines are Naval).
        "cv.bv1.def.type": step(DEFENSIVE, [first]),
        // A WiGE: no BV1 book has one; its type modifier is taken as Hover's.
        "cv.bv1.def.type.wige": provisional(DEFENSIVE, [first],
            "No Battle Value 1 book prints a WiGE. NGCFells uses the Hover modifier, 0.6, as the nearest lift-borne type."),
        // x the Defensive Movement Factor: the highest potential Target Movement Modifier, VTOL bonus included, on the table.
        "cv.bv1.def.movement": step(DEFENSIVE, [first, speed]),
        "cv.bv1.def.rating": step(DEFENSIVE, [first]),
        "cv.bv1.l3.def.armor.hardened": step(DEFENSIVE, [at(maxTech, "90-91")]),
        "cv.bv1.l3.def.chassis": step(DEFENSIVE, [at(maxTech, "92")]),
        "cv.bv1.l3.def.rig": step(DEFENSIVE, [at(maxTech, "92")]),
        "cv.bv1.l3.def.item": step(DEFENSIVE, [at(maxTech, "92")]),
        "cv.bv1.l3.def.movement": provisional(DEFENSIVE, [at(maxTech, "91-92")], BOOSTED_NOTE),
        "cv.bv1.l3.def.bridge": step(DEFENSIVE, [at(maxTech, "92")]),

        // ---- Step 2: Offensive Battle Rating ----
        "cv.bv1.off.weapon": step(OFFENSIVE, [first]),
        "cv.bv1.off.weapon.unlisted": provisional(OFFENSIVE, [first], UNLISTED_NOTE),
        // Rear-mounted weapons count half, unless they outweigh the other arcs: then the rear is the front.
        "cv.bv1.off.weapon.rear": step(OFFENSIVE, [first, second]),
        // A targeting computer, C3 computer or slave: a share of the weapons it links.
        "cv.bv1.off.targeting-computer": step(OFFENSIVE, shares),
        "cv.bv1.off.ammo": step(OFFENSIVE, [first]),
        "cv.bv1.l3.off.item": step(OFFENSIVE, [at(maxTech, "90-92")]),
        "cv.bv1.l3.off.ammo.special": step(OFFENSIVE, [at(maxTech, "91")]),
        "cv.bv1.l3.off.multi-trac": step(OFFENSIVE, [at(maxTech, "91")]),
        "cv.bv1.l3.off.targeting.variable-range": step(OFFENSIVE, [at(maxTech, "91")]),
        "cv.bv1.l3.off.crew": step(OFFENSIVE, [at(maxTech, "92")]),
        "cv.bv1.off.base": step(OFFENSIVE, [first]),
        // Speed Factor MP: Flanking MP + VTOL MP (BMR p.142, BMR(R) p.155), on the Speed Factor Table.
        "cv.bv1.off.speed": step(OFFENSIVE, [second, speed, ...errata]),
        // "+ VTOL MP" read as the Flanking MP counted twice for a VTOL, the only reading that fits Maximum Tech's Sprint and Yellow Jacket BVs.
        "cv.bv1.off.speed.vtol": provisional(OFFENSIVE, [second],
            "The page adds \"VTOL MP\" to the Flanking MP without saying what it is. NGCFells counts a VTOL's Flanking MP twice: the only reading that fits Maximum Tech's Sprint and Yellow Jacket Battle Values."),
        "cv.bv1.l3.off.speed.jump": step(OFFENSIVE, [at(maxTech, "92")]),
        "cv.bv1.l3.off.speed.booster": provisional(OFFENSIVE, [at(maxTech, "91")], BOOSTED_NOTE),
        "cv.bv1.off.rating": step(OFFENSIVE, [second]),

        // ---- Step 3: Final BV, the sum rounded ----
        "cv.bv1.final.round": step(FINAL, [second]),
    };
};

const VEHICLE_BV1_BMR = vehicleBv1("bmr");
const VEHICLE_BV1_BMRR = vehicleBv1("bmrr");

/** The Combat Vehicle BV1 steps of `edition`: the 1998 Master Rules' under that edition, the Revised Edition's otherwise. */
export const getVehicleBv1Steps = (edition: string): CalcStepDefs =>
    getBattleValueEdition(edition) === "master-rules" ? VEHICLE_BV1_BMR : VEHICLE_BV1_BMRR;

const COST_STRUCTURE = "Structure and Systems";
const COST_EQUIPMENT = "Equipment";
const COST_FINAL = "Final Cost";
const RECORD_NOTE = "This price comes from the JBT equipment records. Its row in the cost tables was not re-read for this breakdown.";

/**
 * Combat Vehicle C-bill cost (#599): TechManual p.279 (Combat Vehicle Costs and Availability), weapons and equipment on
 * p.282, the worked Hephaestus on pp.283-285 with the Final Cost Formulas on p.285; TO:AUE pp.219, 221 and 223 for the
 * chassis modifications, drone systems, superchargers and the turrets and jump jets it adds; TM pp.210 and 292 for Clan
 * CASE. Read on 2026-11-23. Under the 1998 Master Rules and the Revised Edition the rows read BMR p.137 and BMR(R) p.150
 * (getVehicleCostSteps).
 */
export const VEHICLE_COST_STEPS: CalcStepDefs = {
    // ---- Structure and systems (TM p.279) ----
    // The engine type's rate x rating x tonnage / 75 (a large engine at its own record's rate, TO:AUE p.219).
    "cv.cost.engine": step(COST_STRUCTURE, [at("tm", "279")]),
    // An engine the older Vehicle Costs Tables do not price: the same row, read on TM p.279 alone.
    "cv.cost.engine.light": step(COST_STRUCTURE, [at("tm", "279")]),
    "cv.cost.engine.later": step(COST_STRUCTURE, [at("tm", "279")]),
    "cv.cost.armor": step(COST_STRUCTURE, [at("tm", "279")]),
    "cv.cost.armor.later": step(COST_STRUCTURE, [at("tm", "279")]),
    "cv.cost.armor.patchwork": provisional(COST_STRUCTURE, [at("tm", "279"), at("toaue", "189")],
        "Each location's armor is priced at its own type's cost per ton. The page that prices patchwork armor was not re-read for this breakdown."),
    "cv.cost.structure": step(COST_STRUCTURE, [at("tm", "279")]),
    "cv.cost.control": step(COST_STRUCTURE, [at("tm", "279")]),
    "cv.cost.robotic": provisional(COST_STRUCTURE, [at("ioae", "215")],
        "Only the Smart Robotic Control System's row (5,000 + 10,000 x its tonnage) was read. The other robotic control prices come from the JBT records."),
    "cv.cost.power-amplifiers": step(COST_STRUCTURE, [at("tm", "279")]),
    // 2,000 each over the 10 a fusion engine supplies, each one otherwise.
    "cv.cost.heat-sinks": step(COST_STRUCTURE, [at("tm", "279")]),
    // 5,000 x the turret's tons; an OmniVehicle's is fixed at the base chassis (TM pp.99, 108).
    "cv.cost.turret": step(COST_STRUCTURE, [at("tm", "279"), at("tm", "108")]),
    // A sponson turret pair 4,000 x its tons (TO:AUE p.223).
    "cv.cost.sponson": step(COST_STRUCTURE, [at("toaue", "223")]),
    "cv.cost.lift": step(COST_STRUCTURE, [at("tm", "279")]),
    "cv.cost.rotor": step(COST_STRUCTURE, [at("tm", "279")]),
    // Vehicle Jump Jet cost = 200 x tons x Jump MP squared (TO:AUE p.223 footnote).
    "cv.cost.jump-jets": step(COST_STRUCTURE, [at("toaue", "223")]),
    "cv.cost.chassis": step(COST_STRUCTURE, [at("toaue", "219"), at("toaue", "221")]),
    "cv.cost.bays": provisional(COST_STRUCTURE, [], RECORD_NOTE),

    // ---- Weapons and equipment (TM p.282) ----
    "cv.cost.equipment": provisional(COST_EQUIPMENT, [at("tm", "282")],
        "The rule is read: every weapon and item adds its listed cost. The price of each item comes from the JBT equipment records; the items' table rows were not re-read for this breakdown."),
    // Supercharger and VTOL jet booster 10,000 x engine rating, a drone operating system 5,000 + 10,000 x its tons, a drone carrier control system 10,000 x its tons.
    "cv.cost.equipment.formula": step(COST_EQUIPMENT, [at("toaue", "219"), at("toaue", "223")]),
    // 10,000 a ton (TM p.292; the worked Dixon on p.284).
    "cv.cost.equipment.communications": step(COST_EQUIPMENT, [at("tm", "292"), at("tm", "284")]),
    "cv.cost.ammo": provisional(COST_EQUIPMENT, [at("tm", "282")],
        "The rule is read: ammunition need not be bought to find a unit's cost, so it is left out of the cost and shown only in the loaded cost. Each ton's price comes from the JBT equipment records."),
    // A Clan structure presumes CASE where it stores ammunition or explosive equipment (TM p.210); the one CASE row, 50,000, covers both tech bases (TM p.292).
    "cv.cost.clan-case": step(COST_EQUIPMENT, [at("tm", "210"), at("tm", "292")]),
    "cv.cost.subtotal": step(COST_EQUIPMENT, [at("tm", "282"), at("tm", "285")]),

    // ---- Final cost (TM p.285) ----
    "cv.cost.omni": step(COST_FINAL, [at("tm", "285")]),
    // Flotation Hull and Environmental Sealing x 1.25 the total cost (TO:AUE p.219).
    "cv.cost.chassis-multiplier": step(COST_FINAL, [at("toaue", "219")]),
    // Tracked 100, Wheeled 200, Hover 50, VTOL 30, Surface Naval 200, Hydrofoil 75, Submarine 50, WiGE 25: 1 + tonnage / divisor.
    "cv.cost.multiplier": step(COST_FINAL, [at("tm", "285")]),
    "cv.cost.final": provisional(COST_FINAL, [at("tm", "274"), at("tm", "285")],
        "The book gives two rounding rules. Its text says to round up to the nearest hundredth of a C-bill once the final multipliers are applied (p.274); its worked examples round to the whole C-bill. NGCFells rounds to the nearest whole C-bill."),
    "cv.cost.final.loaded": provisional(COST_FINAL, [at("tm", "282")],
        "The loaded cost adds the ammunition carried to the final cost. The book does not define a loaded cost; it only says ammunition need not be bought."),
};

/** The engine types both older Vehicle Costs Tables price (Standard Fusion, XL, ICE); the Revised Edition adds Light. */
export const OLDER_COST_ENGINES = ["standard", "xl", "ice"];
/** The armor types the older Vehicle Costs Tables price (Standard, Ferro-Fibrous). */
export const OLDER_COST_ARMOR = ["standard", "ferro-fibrous"];

/** The steps the older Vehicle Costs Tables print a row for. */
const OLDER_COST_ROWS = ["cv.cost.engine", "cv.cost.armor", "cv.cost.structure", "cv.cost.control", "cv.cost.power-amplifiers",
    "cv.cost.heat-sinks", "cv.cost.turret", "cv.cost.lift", "cv.cost.rotor", "cv.cost.multiplier"];

const olderCost = (book: "bmr" | "bmrr"): CalcStepDefs => {
    const page = book === "bmr" ? "137" : "150";
    const name = book === "bmr" ? "BMR" : "BMR(R)";
    const defs: CalcStepDefs = {};
    for (const [id, def] of Object.entries(VEHICLE_COST_STEPS)) {
        if (OLDER_COST_ROWS.includes(id) || (id === "cv.cost.engine.light" && book === "bmrr")) defs[id] = step(def.section, [at(book, page)]);
        else if (id === "cv.cost.equipment") defs[id] = provisional(def.section, [at(book, page)], `${name} p.${page} sends the price to its Weapons and Equipment Prices tables. ${def.note ?? ""}`.trim());
        else if (def.status === "cited") defs[id] = provisional(def.section, def.cites, `${name} p.${page}'s Vehicle Costs Table prints no row for this. NGCFells prices it by the current rules (the cites), as owner call 7 rules.`);
        else defs[id] = def;
    }
    return defs;
};
const VEHICLE_COST_BMR = olderCost("bmr");
const VEHICLE_COST_BMRR = olderCost("bmrr");

/** The Combat Vehicle cost steps of `edition`: BMR p.137 and BMR(R) p.150 under the two Master Rules editions, TM p.279 otherwise. */
export const getVehicleCostSteps = (edition: string): CalcStepDefs => {
    const printed = getBattleValueEdition(edition);
    return printed === "master-rules" ? VEHICLE_COST_BMR : printed === "master-rules-revised" ? VEHICLE_COST_BMRR : VEHICLE_COST_STEPS;
};
