/**
 * Support Vehicle Battle Value step definitions (#599, #600, the Support Vehicle round): the Combat Vehicle steps
 * (calc-steps-vehicle.ts) with the Support Vehicle steps read and cited, and the steps only a Support Vehicle takes.
 *
 * BV2: Calculating Vehicle BV, TM pp.307-308, the CellCo Ranger worked on p.308 (BV 53), the Unit Type Modifiers and
 * the Offensive BV Adjustment (fire control) tables on p.316; TO:AUE p.193 (chassis modifiers), p.190 (rail), p.161
 * and p.194 (vehicular jump jets). Read on 2026-11-23, the TechManual in its 2020 Corrected Fourth Printing. What each
 * page says is in docs/superpowers/plans/2026-11-23-support-vehicles-bundle-and-cited-bv.md. No Master Rules book
 * has Support Vehicles, so there is no Support Vehicle BV1. Change a citation only after reading the page.
 */
import { CalcStepDefs, CalcStepStatus, ICalcCitation, ICalcStepDef } from "./calc-steps";
import { VEHICLE_BV2_STEPS } from "./calc-steps-vehicle";

const DEFENSIVE = "Defensive Battle Rating";
const OFFENSIVE = "Offensive Battle Rating";

const at = (source: string, page: string): ICalcCitation => ({ source, page });
const step = (section: string, cites: ICalcCitation[], status: CalcStepStatus = "cited", note?: string): ICalcStepDef =>
    note ? { section, cites, status, note } : { section, cites, status };
const provisional = (section: string, cites: ICalcCitation[], note: string): ICalcStepDef => step(section, cites, "provisional", note);

export const SUPPORT_VEHICLE_BV2_STEPS: CalcStepDefs = {
    ...VEHICLE_BV2_STEPS,
    // Armor points x 2.5 x BAR / 10 (TM p.307). The CellCo Ranger example (p.308) prints 38 x 0.7 = 26.6 and leaves out
    // the x 2.5; NGCFells rules that a misprint and keeps the rule text, which gives the Ranger 53.
    "cv.bv2.def.armor.support": step(DEFENSIVE, [at("tm", "307"), at("tm", "308")], "cited",
        "The CellCo Ranger example (TM p.308) leaves out the x 2.5 on armor (38 x 0.7 = 26.6); NGCFells reads that as a misprint and keeps the rule text's x 2.5."),
    // Heavy weapons and their ammunition x the fire control's adjustment: none 0.8, Basic 0.9, Advanced 1 (p.316);
    // light and medium weapons are not adjusted.
    "cv.bv2.off.firecontrol": step(OFFENSIVE, [at("tm", "307"), at("tm", "316")]),
    // Dune Buggy and Environmental Sealing on a Support Vehicle add the +0.1 TO:AUE p.193 gives the Combat Vehicle
    // modifications of those names: the Dromedary's printed 341 (TRO 3075 p.294) and the Burro II's 247 come out only so.
    "sv.bv2.def.chassis": provisional(DEFENSIVE, [at("toaue", "193")],
        "TO:AUE p.193 names these modifiers for Combat Vehicles. Support Vehicles take them too: the printed Battle Values of the Dromedary (TRO 3075 p.294) and the HMRV DeConAid Trailer (Record Sheets: 3075 Unabridged, The Cutting Edge), and the MUL's Burro II, come out only with them. Not beside an Armored Motive System: the Shackleton AESV's printed 298 (Interstellar Players 3 p.112) carries only that one's +0.1 (NGCFells, inferred)."),
};

const COST = "C-bill cost";

/**
 * Support Vehicle cost (#599, #600): Support Vehicle Structural Costs, TM p.280 (chassis x the chassis modifiers, engine
 * x its type, armor by the point, then x the Structural Tech Rating; heat sinks, turret, pintles, power amplifiers);
 * transport bays, TM p.239 as revised by errata; weapons and equipment, TM p.282, with fire control a share of the
 * weapons' cost (p.293); the Final Unit Cost Formulas, TM p.285 (x 1 + tonnage / the motive divisor, x 1.25 OmniVehicle).
 * The Advanced Support Vehicles have no Tech Rating multiplier (TO:AUE p.229). Read on 2026-11-23.
 */
export const SUPPORT_VEHICLE_COST_STEPS: CalcStepDefs = {
    "sv.cost.chassis": step(COST, [at("tm", "280")]),
    "sv.cost.engine": step(COST, [at("tm", "280")]),
    "sv.cost.armor": step(COST, [at("tm", "280")]),
    "sv.cost.tech-rating": step(COST, [at("tm", "280"), at("toaue", "229")]),
    "sv.cost.heat-sinks": step(COST, [at("tm", "280")]),
    "sv.cost.turret": step(COST, [at("tm", "280")]),
    // Vehicular jump jets and the Armored Motive System at their Combat Vehicle prices, which name no other for a Support Vehicle.
    "sv.cost.jump-jets": provisional(COST, [at("toaue", "223")], "TO:AUE p.223 prices vehicular jump jets for Combat Vehicles (200 x tonnage x Jump MP squared); no Support Vehicle price is printed, so the same is used (NGCFells, inferred)."),
    "sv.cost.chassis-mod": provisional(COST, [at("toaue", "219")], "TO:AUE p.219 prices the Armored Motive System at 100,000 a ton; the Combat Vehicle price is used for a Support Vehicle (NGCFells, inferred)."),
    "sv.cost.pintle": step(COST, [at("tm", "280"), at("tm", "281")]),
    "sv.cost.bays": step(COST, [at("tm", "239")]),
    "sv.cost.power-amplifiers": step(COST, [at("tm", "280")]),
    "sv.cost.equipment": step(COST, [at("tm", "282")]),
    "sv.cost.fire-control": step(COST, [at("tm", "293")]),
    "sv.cost.subtotal": step(COST, [at("tm", "285")]),
    "sv.cost.multiplier": step(COST, [at("tm", "285")]),
    "sv.cost.omni": step(COST, [at("tm", "285")]),
    "sv.cost.final": step(COST, [at("tm", "285")]),
};