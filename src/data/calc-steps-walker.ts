/**
 * Walker cost and Battle Value step definitions (#172, Custom Homebrew): where each step comes from.
 *
 * Clell Flint's Walkers ("Walkers", Future Wars #11 and The Best of Future Wars, 1991) print no cost and no Battle
 * Value: the article was written before either system reached its present form. Ours are the BattleMech's rules run
 * over a walker's ten locations (owner ruling 2026-11-13), so every step here is `provisional`. Each one keeps the
 * pages of the BattleMech step it follows (the #599 tables: calc-steps-mech-cost.ts, calc-steps-mech-bv2.ts,
 * calc-steps-mech-bv1.ts) and says how that step reads a walker. Nothing here is published by anyone.
 */
import { CalcStepDefs, ICalcCitation, ICalcStepDef } from "./calc-steps";
import { MECH_COST_STEPS } from "./calc-steps-mech-cost";
import { MECH_BV2_STEPS } from "./calc-steps-mech-bv2";
import { getMechBv1Steps } from "./calc-steps-mech-bv1";

/** The note every Walker Battle Value step opens with. */
export const WALKER_BV_NOTE = "Battle Value by the BattleMech rules applied to a Future Wars Walker; not published.";
/** The note every Walker cost step opens with. */
export const WALKER_COST_NOTE = "Cost by the BattleMech rules applied to a Future Wars Walker; not published.";

const at = (source: string, page: string): ICalcCitation => ({ source, page });

/**
 * A table of BattleMech steps as Walker steps: each id prefixed with "walker.", its section and pages kept, its status
 * provisional, its note the opening line, then how the step reads a walker (`how`), then the BattleMech step's own note.
 */
const derive = (defs: CalcStepDefs, opening: string, how: Record<string, string>): CalcStepDefs => {
    const derived: CalcStepDefs = {};
    for (const id of Object.keys(how)) {
        if (!Object.prototype.hasOwnProperty.call(defs, id)) throw new Error(`No BattleMech step to derive from: ${id}`);
    }
    for (const [id, def] of Object.entries(defs)) {
        const note = [opening, how[id], def.note].filter((part): part is string => !!part).join(" ");
        derived[`walker.${id}`] = { section: def.section, cites: [...def.cites], status: "provisional", note };
    }
    return derived;
};
const ours = (section: string, cites: ICalcCitation[], opening: string, note: string): ICalcStepDef =>
    ({ section, cites, status: "provisional", note: `${opening} ${note}` });

// ---- Cost: the BattleMech Costs Table (TechManual pp.274-285) ---------------------------------------------------

const COST_HOW: Record<string, string> = {
    "cost.cockpit": "The control section holds the cockpit, priced as a BattleMech's (an industrial walker's as an IndustrialMech's). Flint's 2, 3 and 4-ton cockpits under the construction variant cost the same.",
    "cost.life-support": "One life support system in the control section. The variant's extra life support slot adds nothing: the table prices the system, not its slots.",
    "cost.sensors": "One sensor system in the control section, by the walker's tonnage. The variant's extra sensor slot adds nothing.",
    "cost.musculature": "Standard myomer by the walker's tonnage; a walker has no other kind.",
    "cost.structure": "By the walker's tonnage, not its ten locations: standard structure, or industrial structure for an industrial walker.",
    "cost.actuators": "Four legs, as a four-legged BattleMech: an upper leg, lower leg and foot actuator in each. The table prices no hip.",
    "cost.engine": "The engine is rated on the two-legged Walking MP (Flint: \"as you would for a two legged mech\"), so its cost is a BattleMech's of that rating and tonnage.",
    "cost.gyro": "The BattleMech gyro for the engine rating.",
    "cost.jump-jets": "Jets squared by the walker's tonnage, as on a BattleMech.",
    "cost.heat-sinks": "As on a BattleMech: single heat sinks beyond the free ones, every double heat sink.",
    "cost.power-amplifiers": "For an industrial walker with an ICE or fuel cell engine, as on an IndustrialMech.",
    "cost.armor": "Standard armor by the tons carried over all ten locations.",
    "cost.equipment": "Each mounted item at its BattleMech price, wherever it sits; a split item is priced once.",
    "cost.ammo": "Ammunition is left out of the cost, as for a BattleMech, and shown as a loaded cost.",
    "cost.subtotal": "The sum of the rows above.",
    "cost.tonnage-multiplier": "1 + tonnage / 100 as a BattleMech; 1 + tonnage / 400 for an industrial walker, as an IndustrialMech.",
    "cost.final": "Rounded to the whole C-bill as the BattleMech's.",
    "cost.final.loaded": "The cost with a full load of the ammunition mounted.",
};

export const WALKER_COST_STEPS: CalcStepDefs = {
    ...derive(MECH_COST_STEPS, WALKER_COST_NOTE, COST_HOW),
    // Both turret rows were read (2026-11-14). Flint's turret is a mechanism of fixed weight in the control section.
    "walker.cost.turret": ours("Structure and Systems", [at("toaue", "223"), at("tm", "279")], WALKER_COST_NOTE,
        "Flint's turret mechanism is priced at 7,500 C-bills for each ton of the mechanism (owner ruling 2026-11-14): midway between a BattleMech turret's 10,000 C-bills a ton and a combat vehicle turret's 5,000."),
};

// ---- Battle Value 2: the TechManual BattleMech procedure (pp.302-304) --------------------------------------------

const BV2_HOW: Record<string, string> = {
    "bv2.def.armor": "The armor points of all ten locations; a walker has no rear armor and only standard armor.",
    "bv2.def.structure": "The structure points of all ten locations from Flint's table; an industrial walker's count half, as industrial structure.",
    "bv2.def.engine": "The engine modifier as a BattleMech's.",
    "bv2.def.gyro": "The walker's tonnage, as a BattleMech's gyro.",
    "bv2.def.equipment": "Defensive equipment in any location.",
    "bv2.def.equipment.ams-ammo": "Anti-missile ammunition in any location, capped as a BattleMech's.",
    "bv2.def.explosive.ammo": "By location. The center torso, the control section (the head) and the four legs always cost. The front, rear, left and right torsos are read as a BattleMech's side torsos: CASE there (built in on a Clan walker) spares the slot, except in the left and right torso when the engine fills three or more slots of each. CASE II spares its own location, and in the center torso the four torsos that pass damage into it.",
    "bv2.def.explosive.component": "As explosive ammunition, by location; an item split between two locations counts its slots in each.",
    "bv2.def.explosive.protected": "A slot spared by CASE or CASE II, as the rule above reads the walker's locations.",
    "bv2.def.tmm": "From the walker's own Running MP (the four-legged Walking MP x 1.5; MASC or a Supercharger engaged) and its Jumping MP. The x 1.25 of four legs counts only through that movement.",
    "bv2.def.factor": "No bonus for a walker's +3 piloting modifier: the procedure rates movement, not piloting.",
    "bv2.off.ammo": "Each bin feeds the first mounted weapon that fires it.",
    "bv2.off.heat.efficiency": "Movement heat as a BattleMech's: running 2 (6 with an XXL engine) or the jump, whichever is higher; none for an ICE industrial walker.",
    "bv2.off.weapon": "Every weapon counts in full: a walker's weapons have no rear mounting. A center-torso weapon, which fires only at infantry and vehicles in the walker's own hex, also counts in full.",
    "bv2.off.weapon.turret": "A turret weapon counts in the front arc, in full: a walker has no rear-mounted weapons to outweigh the front ones.",
    "bv2.off.weapon.overheat": "The heat steps as a BattleMech's.",
    "bv2.off.tonnage": "The walker's tonnage.",
    "bv2.off.speed": "Running MP plus half the Jumping MP, from the walker's own movement.",
    "bv2.off.industrial": "An industrial walker without Advanced Fire Control, as an IndustrialMech.",
    "bv2.final.round": "Rounded as a BattleMech's.",
};

export const WALKER_BV2_STEPS: CalcStepDefs = derive(MECH_BV2_STEPS, WALKER_BV_NOTE, BV2_HOW);

// ---- Battle Value 1: the Master Rules BattleMech procedure --------------------------------------------------------

const BV1_HOW: Record<string, string> = {
    "bv1.def.armor": "The armor points of all ten locations.",
    "bv1.def.structure": "The structure points of all ten locations from Flint's table. The Master Rules have no IndustrialMech: an industrial walker is rated as any other.",
    "bv1.def.tonnage": "The walker's tonnage.",
    "bv1.def.explosive": "By the ton. The center torso, the control section and the legs always cost; the front, rear, left and right torsos are read as side torsos, spared by CASE (built in on a Clan walker). With an Inner Sphere XL engine every location costs.",
    "bv1.def.heat": "Every weapon fired with the hotter of running and jumping; a walker has no rear weapons to leave out.",
    "bv1.def.factor": "From the walker's own Running and Jumping MP; no bonus for the +3 piloting modifier.",
    "bv1.off.weapon": "Every weapon counts in full: no rear mounting, and a center-torso weapon counts in full.",
    "bv1.off.ammo": "Each bin feeds the first mounted weapon that fires it.",
    "bv1.off.speed": "The walker's Running MP plus its Jumping MP.",
    "bv1.final.round": "Rounded as a BattleMech's.",
};

const WALKER_BV1_STEPS = new Map<CalcStepDefs, CalcStepDefs>();

/** The Walker's BV1 steps under `edition`: the BattleMech's for that edition (getMechBv1Steps), each provisional. */
export const getWalkerBv1Steps = (edition: string): CalcStepDefs => {
    const mech = getMechBv1Steps(edition);
    let steps = WALKER_BV1_STEPS.get(mech);
    if (!steps) {
        steps = derive(mech, WALKER_BV_NOTE, BV1_HOW);
        WALKER_BV1_STEPS.set(mech, steps);
    }
    return steps;
};
