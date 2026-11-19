import { describe, expect, it } from "vitest";
import { loadBundledMechDesign, loadBundledMechIndex } from "../data/bundled-mechs";
import { ICalcBreakdown, ICalcStep, renderCalcStepsHtml } from "../data/calc-steps";
import { MECH_BV2_STEPS } from "../data/calc-steps-mech-bv2";
import { DEFAULT_RULES_EDITION } from "../data/rules-editions";
import { BattleMech } from "./battlemech";

// The rulebooks' own worked Battle Value examples, checked step by step (#599). Every number below is one the book
// prints; the page and the full list are in docs/superpowers/plans/2026-11-10-cited-bv-ledger.md. If one of these
// fails, the book is the authority: check the page image, then fix the calculation, never the expectation.

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
const values = (breakdown: ICalcBreakdown, ...ids: string[]): number[] => breakdown.steps.filter((step) => ids.includes(step.id)).map((step) => step.value ?? NaN);

describe("TechManual's worked BV example: MON-66 Mongoose (TM p.304)", () => {
    it("matches the book at every printed step", async () => {
        const breakdown = (await stock("Mongoose", "MON-66")).getBattleValueBreakdown(DEFAULT_RULES_EDITION);
        expect(breakdown).toMatchObject({ kind: "battle-value", scheme: "bv2" });
        expect(last(breakdown, "bv2.def.armor").value).toBe(222.5);
        expect(last(breakdown, "bv2.def.structure").value).toBe(64.5);
        expect(last(breakdown, "bv2.def.engine").value).toBe(64.5);
        expect(last(breakdown, "bv2.def.gyro").value).toBe(12.5);
        expect(values(breakdown, "bv2.def.equipment")).toEqual([10]);
        expect(last(breakdown, "bv2.def.subtotal").value).toBe(309.5);
        expect(last(breakdown, "bv2.def.factor").value).toBe(1.4);
        expect(last(breakdown, "bv2.def.rating").value).toBeCloseTo(433.3, 6);
        expect(last(breakdown, "bv2.off.heat.efficiency").value).toBe(14);
        expect(last(breakdown, "bv2.off.heat.weapons").value).toBe(10);
        expect(values(breakdown, "bv2.off.weapon")).toEqual([46, 46, 46, 9]);
        expect(steps(breakdown, "bv2.off.weapon.overheat")).toHaveLength(0);
        expect(last(breakdown, "bv2.off.tonnage").value).toBe(25);
        expect(last(breakdown, "bv2.off.tonnage").total).toBe(172);
        expect(last(breakdown, "bv2.off.speed").value).toBe(1.89);
        expect(last(breakdown, "bv2.off.rating").value).toBeCloseTo(325.08, 6);
        expect(last(breakdown, "bv2.final.sum").value).toBeCloseTo(758.38, 6);
        expect(last(breakdown, "bv2.final.round").value).toBe(758);
        expect(breakdown.result).toBe(758);
    });
});

describe("TechManual's worked BV example: TDR-10SE Thunderbolt (BV chapter v4.1)", () => {
    it("matches the book at every printed step", async () => {
        const breakdown = (await stock("Thunderbolt", "TDR-10SE")).getBattleValueBreakdown(DEFAULT_RULES_EDITION);
        expect(last(breakdown, "bv2.def.armor").value).toBe(500);
        expect(last(breakdown, "bv2.def.structure").value).toBe(156);
        expect(last(breakdown, "bv2.def.gyro").value).toBe(32.5);
        expect(values(breakdown, "bv2.def.equipment")).toEqual([61]);
        // One ton of LRM 10 ammunition in the left torso, no CASE: 15 points.
        expect(values(breakdown, "bv2.def.explosive.ammo")).toEqual([-15]);
        expect(last(breakdown, "bv2.def.subtotal").value).toBe(734.5);
        expect(last(breakdown, "bv2.def.factor").value).toBe(1.3);
        expect(last(breakdown, "bv2.def.rating").value).toBeCloseTo(954.85, 6);
        expect(values(breakdown, "bv2.off.ammo")).toEqual([11]);
        expect(last(breakdown, "bv2.off.heat.efficiency").value).toBe(26);
        expect(last(breakdown, "bv2.off.heat.weapons").value).toBe(34);
        // ER PPC, LRM 10, two ER medium lasers in full; the third at half once the heat runs out.
        expect(values(breakdown, "bv2.off.weapon", "bv2.off.weapon.overheat")).toEqual([286.25, 90, 77.5, 77.5, 38.75]);
        expect(values(breakdown, "bv2.off.weapon.overheat")).toEqual([38.75]);
        expect(last(breakdown, "bv2.off.tonnage").total).toBe(646);
        expect(last(breakdown, "bv2.off.speed").value).toBe(1.63);
        expect(last(breakdown, "bv2.off.rating").value).toBeCloseTo(1052.98, 6);
        expect(last(breakdown, "bv2.final.sum").value).toBeCloseTo(2007.83, 6);
        expect(breakdown.result).toBe(2008);
    });
});

describe("TechManual's worked BV example: WI-DM DemolitionMech (TM p.305)", () => {
    it("matches the book at every printed step", async () => {
        const breakdown = (await stock("DemolitionMech", "WI-DM")).getBattleValueBreakdown(DEFAULT_RULES_EDITION);
        expect(last(breakdown, "bv2.def.armor").value).toBe(212.5);
        expect(last(breakdown, "bv2.def.structure").value).toBe(43.5);
        expect(last(breakdown, "bv2.def.gyro").value).toBe(17.5);
        expect(steps(breakdown, "bv2.def.equipment")).toHaveLength(0);
        expect(last(breakdown, "bv2.def.subtotal").value).toBe(273.5);
        expect(last(breakdown, "bv2.def.factor").value).toBe(1.2);
        expect(last(breakdown, "bv2.def.rating").value).toBeCloseTo(328.2, 6);
        expect(last(breakdown, "bv2.off.heat.efficiency").value).toBe(5);
        // Small laser 9, wrecking ball 8, rock cutter 6; with the 35 tons, a weapon rating of 58.
        expect(values(breakdown, "bv2.off.weapon").sort((a, b) => b - a)).toEqual([9, 8, 6]);
        expect(last(breakdown, "bv2.off.tonnage").total).toBe(58);
        expect(last(breakdown, "bv2.off.speed").value).toBe(1);
        expect(last(breakdown, "bv2.off.rating").value).toBe(58);
        expect(last(breakdown, "bv2.off.industrial").value).toBeCloseTo(52.2, 6);
        expect(last(breakdown, "bv2.final.sum").value).toBeCloseTo(380.4, 6);
        expect(breakdown.result).toBe(380);
    });
});

describe("'Mech BV2 breakdown", () => {
    it("gives every step of a stock 'Mech a definition, a label and finite numbers", async () => {
        for (const [name, model] of [["Locust", "LCT-1V"], ["Atlas", "AS7-D"]]) {
            const breakdown = (await stock(name, model)).getBattleValueBreakdown();
            expect(breakdown.steps.length, model).toBeGreaterThan(15);
            for (const step of breakdown.steps) {
                expect(MECH_BV2_STEPS[step.id], step.id).toBeDefined();
                expect(step.label, step.id).toBeTruthy();
                if (step.value !== undefined) expect(Number.isFinite(step.value), `${model} ${step.id} value`).toBe(true);
                if (step.total !== undefined) expect(Number.isFinite(step.total), `${model} ${step.id} total`).toBe(true);
            }
        }
    });

    it("ends on the 'Mech's Battle Value", async () => {
        const atlas = await stock("Atlas", "AS7-D");
        const breakdown = atlas.getBattleValueBreakdown();
        expect(breakdown.result).toBe(1897);
        expect(breakdown.result).toBe(atlas.getBattleValue());
        expect(breakdown.steps[breakdown.steps.length - 1]).toMatchObject({ id: "bv2.final.round", value: 1897, emphasis: true });
    });

    it("breaks down a bare 'Mech (no armor, no weapons, no jump jets) without NaN", () => {
        const mech = new BattleMech();
        mech.setTonnage(20);
        const breakdown = mech.getBattleValueBreakdown();
        expect(breakdown.steps.length).toBeGreaterThan(5);
        for (const step of breakdown.steps) {
            if (step.value !== undefined) expect(Number.isFinite(step.value), step.id).toBe(true);
            if (step.total !== undefined) expect(Number.isFinite(step.total), step.id).toBe(true);
        }
        expect(Number.isFinite(breakdown.result as number)).toBe(true);
        expect(breakdown.result).toBe(mech.getBattleValue());
    });

    it("reads the default edition's steps for an unknown edition tag", async () => {
        const atlas = await stock("Atlas", "AS7-D");
        expect(() => atlas.getBattleValueBreakdown("not-an-edition")).not.toThrow();
        expect(atlas.getBattleValueBreakdown("not-an-edition").result).toBe(atlas.getBattleValueBreakdown(DEFAULT_RULES_EDITION).result);
    });

    it("renders calcLogBV from the same steps", async () => {
        const atlas = await stock("Atlas", "AS7-D");
        expect(atlas.calcLogBV).toBe(renderCalcStepsHtml(atlas.getBattleValueBreakdown().steps));
        expect(atlas.calcLogBV).toContain("TM p.302");
    });

    it("keeps markup in an equipment name out of the rendered log", async () => {
        const atlas = await stock("Atlas", "AS7-D");
        const weapon = atlas.getInstalledEquipment().find((item) => (item.battleValue ?? 0) > 0)!;
        weapon.name = "<img src=x onerror=alert(1)>";
        const html = renderCalcStepsHtml(atlas.getBattleValueBreakdown().steps);
        expect(html).not.toContain("<img");
        expect(html).toContain("&lt;img");
    });
});
