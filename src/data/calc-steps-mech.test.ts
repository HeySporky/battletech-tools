import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { findCalcDefProblems } from "./calc-steps";
import { MECH_BV1_STEPS, getMechBv1Steps } from "./calc-steps-mech-bv1";
import { MECH_BV2_STEPS, MECH_BV2_WEAPON_CITES } from "./calc-steps-mech-bv2";
import { MECH_COST_KINDS, MECH_COST_STEPS, getMechCostStep } from "./calc-steps-mech-cost";
import { CALC_SOURCES } from "./calc-sources";
import { mechArmorTypes } from "./mech-armor-types";

const ledger = fs.readFileSync(path.join(__dirname, "../../docs/superpowers/plans/2026-11-10-cited-bv-ledger.md"), "utf8");

describe("'Mech BV2 step definitions", () => {
    it("are clean: every citation names a known source and page, and every uncited step says why", () => {
        expect(findCalcDefProblems(MECH_BV2_STEPS)).toEqual([]);
    });

    it("have ids prefixed bv2. and one of the three sections", () => {
        const sections = ["Defensive Battle Rating", "Offensive Battle Rating", "Final Battle Value"];
        for (const [id, def] of Object.entries(MECH_BV2_STEPS)) {
            expect(id.startsWith("bv2."), id).toBe(true);
            expect(sections, id).toContain(def.section);
        }
    });

    it("cover the core TechManual steps", () => {
        for (const id of ["bv2.def.armor", "bv2.def.structure", "bv2.def.engine", "bv2.def.gyro", "bv2.def.equipment", "bv2.def.explosive.ammo",
            "bv2.def.factor", "bv2.off.heat.efficiency", "bv2.off.weapon", "bv2.off.ammo", "bv2.off.tonnage", "bv2.off.speed", "bv2.final.cockpit", "bv2.final.round"]) {
            expect(MECH_BV2_STEPS[id], id).toBeDefined();
        }
    });

    it("price the Dark Age armors from IO:AE p.190, as the MUL and record sheets do (NGCFells's ruling 2026-11-10)", () => {
        // p.185 prints 1.05 and 1.2; with those, all 30 bundled designs with these armors left their MUL/file BV.
        const multiplier = (tag: string) => mechArmorTypes.find(armor => armor.tag === tag)?.bvMultiplier ?? 1;
        expect(["anti-penetrative-ablation", "heat-dissipating", "impact-resistant", "ballistic-reinforced"].map(multiplier))
            .toEqual([1.2, 1.1, 1, 1.5]);
    });

    it("are each listed in the reading ledger", () => {
        for (const id of Object.keys(MECH_BV2_STEPS)) expect(ledger, id).toContain("`" + id + "`");
    });

    it("name a document for every source-missing step, and the ledger lists it for NGCFells", () => {
        for (const [id, def] of Object.entries(MECH_BV2_STEPS)) {
            if (def.status !== "source-missing") continue;
            expect(ledger, id).toContain(def.note!);
        }
    });

    it("weapon modifier citations name known sources", () => {
        for (const [name, cite] of Object.entries(MECH_BV2_WEAPON_CITES)) {
            expect(CALC_SOURCES[cite.source], name).toBeDefined();
            expect(cite.page.trim(), name).not.toBe("");
        }
    });
});

describe("'Mech cost step definitions", () => {
    it("are clean: every citation names a known source and page, and every uncited step says why", () => {
        expect(findCalcDefProblems(MECH_COST_STEPS)).toEqual([]);
    });

    it("have ids prefixed cost. and one of the three sections", () => {
        const sections = ["Structure and Systems", "Equipment", "Final Cost"];
        for (const [id, def] of Object.entries(MECH_COST_STEPS)) {
            expect(id.startsWith("cost."), id).toBe(true);
            expect(sections, id).toContain(def.section);
        }
    });

    it("cover the TechManual's structural cost lines", () => {
        for (const id of ["cost.cockpit", "cost.life-support", "cost.sensors", "cost.musculature", "cost.structure", "cost.actuators", "cost.engine", "cost.gyro",
            "cost.jump-jets", "cost.heat-sinks", "cost.armor", "cost.equipment", "cost.ammo", "cost.omni", "cost.tonnage-multiplier", "cost.final"]) {
            expect(MECH_COST_STEPS[id], id).toBeDefined();
        }
    });

    it("are each listed in the reading ledger", () => {
        for (const id of Object.keys(MECH_COST_STEPS)) expect(ledger, id).toContain("`" + id + "`");
    });

    it("gives a component whose price row was read its cited step, with the page of a row outside the TechManual", () => {
        expect(getMechCostStep("cockpit", "standard")).toEqual({ id: "cost.cockpit" });
        expect(getMechCostStep("cockpit", "torso-mounted")).toEqual({ id: "cost.cockpit", cites: [{ source: "toaue", page: "219" }] });
        expect(getMechCostStep("armor", "ballistic-reinforced")).toEqual({ id: "cost.armor", cites: [{ source: "ioae", page: "215" }] });
    });

    it("gives a component whose price row was not re-read the provisional record step", () => {
        expect(getMechCostStep("cockpit", "interface")).toEqual({ id: "cost.cockpit.record" });
        expect(getMechCostStep("structure", "reinforced")).toEqual({ id: "cost.structure.record" });
        for (const kind of MECH_COST_KINDS) {
            const def = MECH_COST_STEPS[getMechCostStep(kind, "no-such-tag").id];
            expect(def.status, kind).toBe("provisional");
        }
    });
});

describe("'Mech BV1 step definitions", () => {
    const editions = ["master-rules", "master-rules-revised"];

    it("has one table for each BV1 edition", () => {
        expect(Object.keys(MECH_BV1_STEPS).sort()).toEqual(editions);
    });

    it.each(editions)("%s: every citation names a known source and page, and every uncited step says why", (edition) => {
        expect(findCalcDefProblems(MECH_BV1_STEPS[edition])).toEqual([]);
    });

    it.each(editions)("%s: ids are prefixed bv1. and sit in one of the three sections", (edition) => {
        const sections = ["Defensive Battle Rating", "Offensive Battle Rating", "Final Battle Value"];
        for (const [id, def] of Object.entries(MECH_BV1_STEPS[edition])) {
            expect(id.startsWith("bv1."), id).toBe(true);
            expect(sections, id).toContain(def.section);
        }
    });

    it("the two tables have the same step ids, so one calculation serves both", () => {
        expect(Object.keys(MECH_BV1_STEPS["master-rules"]).sort()).toEqual(Object.keys(MECH_BV1_STEPS["master-rules-revised"]).sort());
    });

    it("each table carries Level 3 steps (bv1.l3.) cited to its own Maximum Tech printing", () => {
        const levelThree = (edition: string) => Object.entries(MECH_BV1_STEPS[edition]).filter(([id]) => id.startsWith("bv1.l3."));
        expect(levelThree("master-rules-revised").length).toBeGreaterThan(0);
        expect(levelThree("master-rules").map(([id]) => id).sort()).toEqual(levelThree("master-rules-revised").map(([id]) => id).sort());
        for (const [id, def] of levelThree("master-rules")) expect(def.cites.map(cite => cite.source), id).toEqual(["mt"]);
        for (const [id, def] of levelThree("master-rules-revised")) expect(def.cites.map(cite => cite.source), id).toEqual(["mt-revised"]);
    });

    it("an edition reads the newest BV1 edition at or before it", () => {
        expect(getMechBv1Steps("classic-battletech-box-set")).toBe(MECH_BV1_STEPS["master-rules-revised"]);
        expect(getMechBv1Steps("master-rules")).toBe(MECH_BV1_STEPS["master-rules"]);
    });

    it("are each listed in the reading ledger", () => {
        for (const edition of editions) for (const id of Object.keys(MECH_BV1_STEPS[edition])) expect(ledger, id).toContain("`" + id + "`");
    });
});
