/**
 * 'Mech C-bill cost step definitions (#599): where each step of the calculation comes from.
 *
 * Every entry was read on the page it cites, on 2026-11-11; what each page says and how the code compares is in
 * docs/superpowers/plans/2026-11-10-cited-bv-ledger.md. The cost follows the current rules (TechManual pp.274-285,
 * with Tactical Operations: Advanced Units & Equipment and Interstellar Operations: Alternate Eras for the gear they
 * add) under every rules edition. A component's price is `cited` only where its own table row was read: the
 * READ_ROWS lists below. Any other component reads the `.record` step, which says its price is from the JBT records.
 * Change a citation only after reading the page.
 */
import { CalcStepDefs, CalcStepStatus, ICalcCitation, ICalcStepDef } from "./calc-steps";

const STRUCTURE = "Structure and Systems";
const EQUIPMENT = "Equipment";
const FINAL = "Final Cost";

const at = (source: string, page: string): ICalcCitation => ({ source, page });
const step = (section: string, cites: ICalcCitation[], status: CalcStepStatus = "cited", note?: string): ICalcStepDef =>
    note ? { section, cites, status, note } : { section, cites, status };
const provisional = (section: string, cites: ICalcCitation[], note: string): ICalcStepDef => step(section, cites, "provisional", note);

const RECORD_NOTE = "This price comes from the JBT equipment records. Its row in the cost tables was not re-read for this breakdown.";

export const MECH_COST_STEPS: CalcStepDefs = {
    // ---- Structure and systems (TM tables pp.277-278) ----
    "cost.cockpit": step(STRUCTURE, [at("tm", "277")]),
    "cost.cockpit.record": provisional(STRUCTURE, [], RECORD_NOTE),
    "cost.cockpit.primitive": provisional(STRUCTURE, [at("ioae", "117"), at("ioae", "215")],
        "The book prints two prices. Its rules text says a primitive cockpit costs what the standard one does (p.117: 200,000; 100,000 for the industrial one); its table prints 100,000 and 50,000 (p.215). NGCFells follows the rules text."),
    "cost.cockpit.command-console": step(STRUCTURE, [at("toaue", "219")]),
    "cost.cockpit.enhanced-imaging": provisional(STRUCTURE, [], RECORD_NOTE),
    "cost.cockpit.robotic": provisional(STRUCTURE, [at("ioae", "215")],
        "Only the Smart Robotic Control System's row was read (5,000 + 10,000 x its tonnage). The other robotic control prices come from the JBT records."),
    "cost.life-support": step(STRUCTURE, [at("tm", "277")]),
    "cost.sensors": step(STRUCTURE, [at("tm", "277")]),
    "cost.musculature": step(STRUCTURE, [at("tm", "277")]),
    "cost.musculature.record": provisional(STRUCTURE, [], RECORD_NOTE),
    "cost.musculature.primitive": step(STRUCTURE, [at("ioae", "215")]),
    "cost.musculature.superheavy": step(STRUCTURE, [at("ioae", "217")]),
    "cost.structure": step(STRUCTURE, [at("tm", "278")]),
    "cost.structure.record": provisional(STRUCTURE, [], RECORD_NOTE),
    "cost.structure.superheavy": step(STRUCTURE, [at("ioae", "217")]),
    "cost.structure.tripod": step(STRUCTURE, [at("ioae", "217")]),
    "cost.structure.frankenmech": provisional(STRUCTURE, [],
        "No rule prices a 'Mech of mixed internal structure types. Each location is read as its weight share of the structure, at its own type's cost per ton of 'Mech."),
    // Each actuator mounted (TM p.278); the shoulders and hips are not priced.
    "cost.actuators": step(STRUCTURE, [at("tm", "278")]),
    "cost.actuators.superheavy": step(STRUCTURE, [at("ioae", "217")]),
    // (Multiplier x Engine Rating x Unit Tonnage) / 75 (TM p.278; large and XXL engines TO:AUE p.219).
    "cost.engine": step(STRUCTURE, [at("tm", "278")]),
    "cost.engine.record": provisional(STRUCTURE, [], RECORD_NOTE),
    "cost.gyro": step(STRUCTURE, [at("tm", "278")]),
    "cost.gyro.record": provisional(STRUCTURE, [], RECORD_NOTE),
    "cost.gyro.superheavy": step(STRUCTURE, [at("ioae", "217")]),
    "cost.jump-jets": step(STRUCTURE, [at("tm", "278")]),
    "cost.jump-jets.record": provisional(STRUCTURE, [], RECORD_NOTE),
    "cost.jump-pack": step(STRUCTURE, [at("toaue", "217")]),
    "cost.handheld": step(STRUCTURE, [at("mt", "87"), at("toaue", "219")]),
    "cost.heat-sinks": step(STRUCTURE, [at("tm", "278")]),
    "cost.heat-sinks.record": provisional(STRUCTURE, [], RECORD_NOTE),
    "cost.power-amplifiers": step(STRUCTURE, [at("tm", "278")]),
    "cost.armor": step(STRUCTURE, [at("tm", "278")]),
    "cost.armor.record": provisional(STRUCTURE, [], RECORD_NOTE),
    "cost.armor.patchwork": provisional(STRUCTURE, [],
        "Each location's armor is priced at its own type's cost per ton. The page that prices patchwork armor was not re-read for this breakdown."),

    // ---- Weapons and equipment (TM p.282) ----
    "cost.equipment": provisional(EQUIPMENT, [at("tm", "282")],
        "The rule is read: every weapon and item adds its listed cost. The price of each item comes from the JBT equipment records; the items' table rows were not re-read for this breakdown."),
    "cost.ammo": provisional(EQUIPMENT, [at("tm", "282")],
        "The rule is read: ammunition need not be bought to find a unit's cost, so it is left out of the cost and shown only in the loaded cost. Each ton's price comes from the JBT equipment records."),
    "cost.armored-components": step(EQUIPMENT, [at("toaue", "217")]),
    // A Clan structure presumes CASE where it stores ammunition or explosive equipment (TM p.210); the one CASE row, 50,000, covers both tech bases (TM p.292).
    "cost.clan-case": step(EQUIPMENT, [at("tm", "210"), at("tm", "292")]),
    "cost.quadvee-motive": step(EQUIPMENT, [at("ioae", "215"), at("tm", "278")]),
    "cost.conversion": provisional(EQUIPMENT, [at("ioae", "215"), at("ioae", "218")],
        "The table prices LAM and QuadVee conversion gear as a share of \"WSC\", which its notes define as the cost of the unit's weapons, equipment and internal structure. NGCFells takes the share of the whole cost so far, as the book's worked examples do (NGCFells's ruling 2026-10-26)."),
    "cost.conversion.homebrew": provisional(EQUIPMENT, [],
        "A fan rule, not a rulebook one: the VTOL LAM is priced at the bimodal LAM's share."),
    "cost.subtotal": step(EQUIPMENT, [at("tm", "282")]),

    // ---- Final cost (TM p.285) ----
    "cost.omni": step(FINAL, [at("tm", "285")]),
    "cost.omni.homebrew": provisional(FINAL, [],
        "A fan rule, not a rulebook one: an Omni-LAM costs 1.75 times a normal 'Mech in place of the OmniMech's 1.25."),
    "cost.tonnage-multiplier": step(FINAL, [at("tm", "285")]),
    "cost.final": provisional(FINAL, [at("tm", "274"), at("tm", "285")],
        "The book gives two rounding rules. Its text says to round up to the nearest hundredth of a C-bill once the final multipliers are applied (p.274). Its worked examples round down to the whole C-bill (p.285). NGCFells rounds to the nearest whole C-bill."),
    "cost.final.loaded": provisional(FINAL, [at("tm", "282")],
        "The loaded cost adds the ammunition carried to the final cost. The book does not define a loaded cost; it only says ammunition need not be bought."),
    "cost.rules-edition": provisional(FINAL, [],
        "The cost is worked out with the current rules (TechManual) under every rules edition. The cost rules of the editions before Total Warfare are not modelled yet."),
};

/** CASE, 50,000 C-bills, one row for both tech bases (TM p.292): what a Clan structure presumed CASE is billed per location (TM p.210). */
export const CLAN_CASE_COST = 50000;

/** The component kinds whose price is one row of a cost table. */
export const MECH_COST_KINDS = ["cockpit", "musculature", "structure", "engine", "gyro", "jump-jets", "heat-sinks", "armor"] as const;
export type MechCostKind = typeof MECH_COST_KINDS[number];

const TM: ICalcCitation[] = [];
/**
 * The component rows read on the page, by record tag. An empty list: the row is in the TechManual table the kind's step
 * already cites (pp.277-278); otherwise the page of the book that prices it.
 */
const READ_ROWS: Record<MechCostKind, Record<string, ICalcCitation[]>> = {
    cockpit: {
        "standard": TM, "small": TM, "industrial": TM, "industrial-advanced-fire-control": TM,
        "torso-mounted": [at("toaue", "219")], "quadvee": [at("ioae", "215")], "tripod": [at("ioae", "217")], "superheavy-tripod": [at("ioae", "217")],
    },
    musculature: { "standard": TM, "tsm": TM, "industrial-tsm": TM, "risc-super-cooled-myomer": [at("ioae", "215")] },
    structure: { "standard": TM, "endo-steel": TM, "industrial": TM },
    engine: {
        "standard": TM, "light": TM, "xl": TM, "clan_xl": TM, "compact": TM, "ice": TM, "cell": TM, "fission": TM,
        "xxl": [at("toaue", "219")], "clan_xxl": [at("toaue", "219")], "large": [at("toaue", "219")],
    },
    gyro: { "standard": TM, "compact": TM, "heavy-duty": TM, "xl": TM },
    "jump-jets": { "standard": TM, "improved": TM },
    "heat-sinks": { "single": TM, "double": TM },
    armor: {
        "standard": TM, "ferro-fibrous": TM, "light-ferro-fibrous": TM, "heavy-ferro-fibrous": TM, "stealth-basic": TM, "commercial": TM, "industrial": TM,
        "hardened": [at("toaue", "217")],
        "anti-penetrative-ablation": [at("ioae", "215")], "heat-dissipating": [at("ioae", "215")], "impact-resistant": [at("ioae", "215")], "ballistic-reinforced": [at("ioae", "215")],
    },
};

/**
 * The step a component's price belongs to: the kind's cited step when its table row was read (with the page, for a row
 * outside the TechManual), else the kind's `.record` step. A large engine reads the "large" row whatever its type.
 */
export const getMechCostStep = (kind: MechCostKind, tag: string): { id: string; cites?: ICalcCitation[] } => {
    // The book prices the primitive cockpits two ways: its own provisional step.
    if (kind === "cockpit" && tag.startsWith("primitive")) return { id: "cost.cockpit.primitive" };
    const cites = Object.prototype.hasOwnProperty.call(READ_ROWS[kind], tag) ? READ_ROWS[kind][tag] : undefined;
    if (!cites) return { id: `cost.${kind}.record` };
    return cites.length > 0 ? { id: `cost.${kind}`, cites } : { id: `cost.${kind}` };
};
