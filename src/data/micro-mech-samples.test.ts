import { describe, expect, it } from "vitest";
import MicroMech from "../classes/micro-mech";
import { MICRO_MECH_PRINTED_FIGURES } from "./calc-steps-micro-mech";
import { MICRO_MECH_SAMPLES } from "./micro-mech-samples";

const load = (id: string): MicroMech => {
    const sample = MICRO_MECH_SAMPLES.find((each) => each.id === id);
    if (!sample) throw new Error(`no sample ${id}`);
    return new MicroMech(JSON.stringify(sample.save));
};

describe("the Micro-Mech sample designs (6.1.0.2)", () => {
    it("offers the document's four, with unique ids and uuids", () => {
        expect(MICRO_MECH_SAMPLES.map((sample) => sample.id)).toEqual(["storm-stm-3x", "tunnel-rat-tnr-1x", "hillman-hmn-2x", "slayer-sl-x4"]);
        expect(new Set(MICRO_MECH_SAMPLES.map((sample) => sample.save.uuid)).size).toBe(4);
    });

    it.each(MICRO_MECH_PRINTED_FIGURES.map((printed, index) => [printed, MICRO_MECH_SAMPLES[index]] as const))("%j loads clean and weighs what the document prints", (printed, sample) => {
        const micro = load(sample.id);
        expect(micro.getImportIssues()).toEqual([]);
        expect(micro.getIssues()).toEqual([]);
        expect(micro.getName()).toBe(printed.name);
        expect(micro.getTons()).toBe(printed.tons);
        expect(micro.getWeight()).toBe(printed.weightKg);
        expect(micro.getPrintedFigures()).toEqual(printed);
        expect(micro.tro.getText("notes")).toContain("NOT OFFICIAL");
        expect(micro.tro.getText("notes")).toContain(sample.differences);
    });

    it.each([
        ["storm-stm-3x", 695853, 223],
        ["tunnel-rat-tnr-1x", 990510, 309],
        ["hillman-hmn-2x", 852898, 339],
        ["slayer-sl-x4", 1073387, 531],
    ])("%s comes to the cost and Battle Value the app builds", (id, cost, battleValue) => {
        const micro = load(id);
        expect(micro.getCBillCost()).toBe(cost);
        expect(micro.getBattleValue("master-rules-revised")).toBe(battleValue);
    });
});
