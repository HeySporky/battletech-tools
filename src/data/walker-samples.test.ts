import { describe, expect, it } from "vitest";
import Walker from "../classes/walker";
import { getWalkerSamples } from "./walker-samples";

const load = (id: string): Walker => {
    const sample = getWalkerSamples().find((entry) => entry.id === id);
    if (!sample) throw new Error(id);
    const walker = new Walker();
    walker.import(JSON.parse(JSON.stringify(sample.save)));
    return walker;
};

describe("sample walkers (Custom Homebrew, ours)", () => {
    it("lists three walkers: a light, a heavy with a turret and an assault under the variant slots", () => {
        expect(getWalkerSamples().map((sample) => sample.name)).toEqual(["Harrowhound HRH-1", "Ironback IBK-2T", "Steppe Titan STN-5V"]);
        expect(load("harrowhound-hrh-1").getTons()).toBeLessThan(40);
        expect(load("ironback-ibk-2t").getTurretWeight()).toBeGreaterThan(0);
        expect(load("steppe-titan-stn-5v").usesVariantSlots()).toBe(true);
    });

    it.each(["harrowhound-hrh-1", "ironback-ibk-2t", "steppe-titan-stn-5v"])("%s is legal, at its full weight, and says it is ours", (id) => {
        const walker = load(id);
        expect(walker.getIssues()).toEqual([]);
        expect(walker.getRemainingWeight()).toBeGreaterThanOrEqual(0);
        expect(walker.getRemainingWeight()).toBeLessThan(0.5);
        expect(walker.tro.getText("notes")).toContain("NOT OFFICIAL");
    });
});
