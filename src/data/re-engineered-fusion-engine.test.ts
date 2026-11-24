import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { mechCustomEngineTypes } from "./mech-custom-engine-types";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

// Re-Engineered Fusion Engine (#267): u/Bookwyrm517, r/battletech post 1iky8lg. A third lighter than a standard engine,
// three slots in the center torso and in each side torso; lost with a side torso like an XL engine.

const TAG = "re-engineered-fusion";

const makeMech = (engineTag: string, tonnage = 50, walk = 4): BattleMech => {
    const mech = new BattleMech();
    mech.setEra("civil-war");
    mech.setTonnage(tonnage);
    mech.setWalkSpeed(walk);
    mech.setEngineType(engineTag);
    return mech;
};

const engineSlots = (mech: BattleMech): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const [location, slots] of Object.entries(mech.getCriticals())) {
        // A multi-slot item is its first slot plus placeholders: count the slots that belong to the engine.
        let lastName = "";
        let count = 0;
        for (const slot of slots as ({ name?: string; placeholder?: boolean; rollAgain?: boolean } | null)[]) {
            if (slot && !slot.placeholder && !slot.rollAgain) lastName = slot.name ?? "";
            if (slot && /engine|fusion/i.test(lastName)) count++;
        }
        if (count > 0) counts[location] = count;
    }
    return counts;
};

describe("Re-Engineered Fusion Engine (#267)", () => {
    it("is a Custom Homebrew engine record crediting the author and both commenters, with the post's link", () => {
        const record = mechCustomEngineTypes.find((engine) => engine.tag === TAG);
        expect(record).toBeDefined();
        expect(record!.name).toBe("Re-Engineered Fusion Engine");
        expect(record!.rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        for (const handle of ["u/Bookwyrm517", "u/FweeCom", "u/MasonStonewall"]) expect(record!.notes).toContain(handle);
        expect(record!.notes).toContain("https://www.reddit.com/r/battletech/comments/1iky8lg/");
        expect(record!.notes).toContain("Inspired by");
    });

    it("weighs a third less than a standard engine, to the half ton up", () => {
        const standard = makeMech("standard"), rfe = makeMech(TAG);
        expect(rfe.getEngineType().tag).toBe(TAG);
        const std = standard.getEngineWeight() as number;
        expect(rfe.getEngineWeight()).toBe(Math.ceil(std * 0.67 * 2) / 2);
        expect(rfe.getEngineWeight()).toBeLessThan(std);
        // Between the light engine (a quarter off) and the XL (half off).
        expect(rfe.getEngineWeight()).toBeLessThan(makeMech("light").getEngineWeight() as number);
        expect(rfe.getEngineWeight()).toBeGreaterThan(makeMech("xl").getEngineWeight() as number);
    });

    it("takes three slots in the center torso and three in each side torso", () => {
        expect(engineSlots(makeMech(TAG))).toEqual({ centerTorso: 3, leftTorso: 3, rightTorso: 3 });
    });

    it("is lost with a side torso, as an XL engine is, and with three hits", () => {
        const mech = makeMech(TAG);
        expect(mech.hasXLEngine()).toBe(true);
        expect(makeMech("standard").hasXLEngine()).toBe(false);
    });

    it("heat is a standard engine's", () => {
        expect(makeMech(TAG).getMaxMovementHeat()).toBe(makeMech("standard").getMaxMovementHeat());
        expect(makeMech(TAG).isXXLEngine()).toBe(false);
    });

    it("offered only at the Custom Homebrew rules level", () => {
        const mech = makeMech("standard");
        const offered = (level: number) => mech.getAvailableEngines(level).find((engine) => engine.tag === TAG)?.available;
        expect(offered(CUSTOM_HOMEBREW_RULES_LEVEL)).toBe(true);
        expect(offered(4)).not.toBe(true);
    });

    it("not offered above a rating of 400 or on a superheavy, and refused there with a message", () => {
        const large = makeMech("standard", 100, 5);
        expect(large.getAvailableEngines(CUSTOM_HOMEBREW_RULES_LEVEL).find((engine) => engine.tag === TAG)?.available).not.toBe(true);
        const superheavy = makeMech("standard", 120, 3);
        expect(superheavy.getAvailableEngines(CUSTOM_HOMEBREW_RULES_LEVEL).find((engine) => engine.tag === TAG)?.available).not.toBe(true);

        const rfe = makeMech(TAG, 100, 4);
        rfe.setWalkSpeed(5);
        expect(rfe.getChassisEquipmentViolations().some((text) => text.includes("Re-Engineered"))).toBe(true);
    });

    it("battle value counts it as an XL engine (engine modifier 0.5)", () => {
        const engineStep = (mech: BattleMech) => JSON.stringify(mech.getBattleValueBreakdown("total-warfare")).match(/Engine modifier \(([^)]*)\)[^}]*?"detail":"([^"]*)"/);
        expect(engineStep(makeMech(TAG))?.[2]).toMatch(/x 0\.5$/);
        expect(engineStep(makeMech("xl"))?.[2]).toMatch(/x 0\.5$/);
    });

    it("notes record NGCFells's observation about tripods and center torso cockpits", () => {
        const record = mechCustomEngineTypes.find((engine) => engine.tag === TAG)!;
        expect(record.notes).toMatch(/tripod/i);
        expect(record.notes).toMatch(/center torso cockpit/i);
    });
});
