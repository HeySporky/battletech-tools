import { describe, expect, it } from "vitest";
import { loadBundledMechDesign, loadBundledMechIndex } from "../data/bundled-mechs";
import { ICalcBreakdown, ICalcStep, formatCitations, renderCalcStepsTable } from "../data/calc-steps";
import { MECH_COST_STEPS } from "../data/calc-steps-mech-cost";
import { BattleMech } from "./battlemech";

// 'Mech cost as cited steps (#599). The Mongoose is the TechManual's own worked cost example (pp.275, 282, 285): every
// number below is one the book prints. If one fails, check the page image, then fix the calculation.

const stock = async (name: string, model: string): Promise<BattleMech> => {
    const header = (await loadBundledMechIndex()).find((entry) => entry.name === name && entry.model === model);
    if (!header) throw new Error(`${name} ${model} is not bundled`);
    return loadBundledMechDesign(header);
};
const steps = (breakdown: ICalcBreakdown, id: string): ICalcStep[] => breakdown.steps.filter((step) => step.id === id);
const last = (breakdown: ICalcBreakdown, id: string): ICalcStep => {
    const found = steps(breakdown, id);
    if (found.length === 0) throw new Error(`No step ${id}`);
    return found[found.length - 1];
};
const sum = (breakdown: ICalcBreakdown, id: string): number => steps(breakdown, id).reduce((total, step) => total + (step.value ?? NaN), 0);

describe("TechManual's worked cost example: MON-66 Mongoose (TM pp.275, 282, 285)", () => {
    it("matches the book at every printed step", async () => {
        const breakdown = (await stock("Mongoose", "MON-66")).getCostBreakdown();
        expect(breakdown).toMatchObject({ kind: "cost" });
        expect(last(breakdown, "cost.cockpit").value).toBe(200000);
        expect(last(breakdown, "cost.life-support").value).toBe(50000);
        expect(last(breakdown, "cost.sensors").value).toBe(50000);
        expect(last(breakdown, "cost.musculature").value).toBe(50000);
        expect(last(breakdown, "cost.structure").value).toBe(40000);
        // Two full sets of arm actuators 11,500 and two of leg actuators 17,500.
        expect(sum(breakdown, "cost.actuators")).toBe(29000);
        // The book keeps the fraction: no cost is rounded before the end (TM p.274).
        expect(last(breakdown, "cost.engine").value).toBeCloseTo(333333.333, 3);
        expect(last(breakdown, "cost.gyro").value).toBe(600000);
        expect(steps(breakdown, "cost.jump-jets")).toHaveLength(0);
        expect(sum(breakdown, "cost.heat-sinks")).toBe(0);
        expect(last(breakdown, "cost.armor").value).toBe(100000);
        // Beagle active probe 200,000, three medium lasers 120,000, a small laser 11,250.
        expect(sum(breakdown, "cost.equipment")).toBe(331250);
        expect(last(breakdown, "cost.subtotal").value).toBeCloseTo(1783583.333, 3);
        expect(last(breakdown, "cost.tonnage-multiplier").value).toBe(1.25);
        expect(last(breakdown, "cost.final").value).toBe(2229479);
        expect(breakdown.result).toBe(2229479);
    });
});

describe("'Mech cost breakdown", () => {
    it("gives every step of a stock 'Mech a definition, a label and finite numbers, and ends on the cost", async () => {
        const mech = await stock("Atlas", "AS7-D");
        const breakdown = mech.getCostBreakdown();
        expect(breakdown.steps.length).toBeGreaterThan(15);
        for (const step of breakdown.steps) {
            expect(MECH_COST_STEPS[step.id], step.id).toBeDefined();
            expect(step.label.trim(), step.id).not.toBe("");
            if (step.value !== undefined) expect(Number.isFinite(step.value), step.id).toBe(true);
        }
        expect(breakdown.result).toBe(mech.getCBillCostNumeric());
        expect(last(breakdown, "cost.final").value).toBe(mech.getCBillCostNumeric());
        // The Atlas carries ammunition: the loaded cost is its own step.
        expect(last(breakdown, "cost.final.loaded").value).toBe(mech.getCBillCostNumeric(true));
        expect(sum(breakdown, "cost.ammo")).toBe(mech.getCBillCostNumeric(true) - mech.getCBillCostNumeric());
    });

    it("names the design's edition, and says so when an older edition's cost follows the current rules", async () => {
        const mech = await stock("Atlas", "AS7-D");
        expect(mech.getCostBreakdown().edition).toBe(mech.getRulesEdition());
        expect(steps(mech.getCostBreakdown(), "cost.rules-edition")).toHaveLength(0);
        mech.setRulesEdition("master-rules");
        expect(steps(mech.getCostBreakdown(), "cost.rules-edition")).toHaveLength(1);
        expect(mech.getCostBreakdown().edition).toBe("master-rules");
    });

    it("breaks down a bare 'Mech without NaN", () => {
        const breakdown = new BattleMech().getCostBreakdown();
        for (const step of breakdown.steps) if (step.value !== undefined) expect(Number.isFinite(step.value), step.id).toBe(true);
        expect(Number.isFinite(breakdown.result as number)).toBe(true);
    });

    it("renders calcLogCBill as the cost table of the same steps, with each step's citation", async () => {
        const mech = await stock("Atlas", "AS7-D");
        const breakdown = mech.getCostBreakdown();
        expect(mech.calcLogCBill).toBe(renderCalcStepsTable(breakdown.steps));
        expect(mech.calcLogCBill).toContain("class=\"cbill-cost\"");
        for (const step of breakdown.steps) {
            if (step.cites.length > 0) expect(mech.calcLogCBill, step.id).toContain(formatCitations(step.cites));
        }
    });

    it("keeps markup in an equipment name out of the rendered table", async () => {
        const mech = await stock("Atlas", "AS7-D");
        mech.getInstalledEquipment().find((item) => item.cbills > 0)!.name = "<img src=x onerror=alert(1)>";
        const html = renderCalcStepsTable(mech.getCostBreakdown().steps);
        expect(html).not.toContain("<img");
        expect(html).toContain("&lt;img");
    });
});

describe("renderCalcStepsTable", () => {
    const row = (overrides: Partial<ICalcStep>): ICalcStep => ({ id: "cost.sensors", section: "Structure and Systems", cites: [{ source: "tm", page: "277" }], status: "cited", label: "Sensors", ...overrides });

    it("prints the label, the arithmetic, the value with thousands separators and the citation", () => {
        const html = renderCalcStepsTable([row({ detail: "2,000 x 25 tons", value: 50000 })]);
        expect(html).toContain("<table class=\"cbill-cost\">");
        expect(html).toContain("Sensors");
        expect(html).toContain("2,000 x 25 tons");
        expect(html).toContain("50,000");
        expect(html).toContain("TM p.277");
    });

    it("gives each section a heading row and marks a provisional step with its note", () => {
        const html = renderCalcStepsTable([row({}), row({ id: "cost.final", section: "Final Cost", status: "provisional", note: "Two rounding rules.", label: "Final cost", value: 1234567.5, emphasis: true })]);
        expect(html).toContain("<strong>Structure and Systems</strong>");
        expect(html).toContain("<strong>Final Cost</strong>");
        expect(html).toContain("provisional: Two rounding rules.");
        expect(html).toContain("1,234,567.5");
    });
});
