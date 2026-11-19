import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { mechCustomEngineTypes } from "./mech-custom-engine-types";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

// Mini Engine (#249): u/VanillaPhysics, r/battletech post 1nk9g3e. Standard engine slots, light engine weight,
// XXL engine heat; destroyed after two hits, the first counting as two.

const makeMech = (engineTag: string, tonnage = 50, walk = 4): BattleMech => {
    const mech = new BattleMech();
    // An era with the light engine in production, whose dates the Mini Engine takes.
    mech.setEra("civil-war");
    mech.setTonnage(tonnage);
    mech.setWalkSpeed(walk);
    mech.setEngineType(engineTag);
    return mech;
};

const engineSlots = (mech: BattleMech): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const [location, slots] of Object.entries(mech.getCriticals())) {
        const count = (slots as ({ tag?: string } | null)[]).filter((slot) => slot?.tag === "engine").length;
        if (count > 0) counts[location] = count;
    }
    return counts;
};

describe("Mini Engine (#249)", () => {
    it("is a Custom Homebrew engine record crediting u/VanillaPhysics and linking the post", () => {
        const record = mechCustomEngineTypes.find((engine) => engine.tag === "mini-engine");
        expect(record).toBeDefined();
        expect(record!.name).toBe("Mini Engine");
        expect(record!.rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(record!.notes).toContain("u/VanillaPhysics");
        expect(record!.notes).toContain("https://www.reddit.com/r/battletech/comments/1nk9g3e/");
        expect(record!.notes).toContain("Inspired by");
    });

    it("standard engine slots, light engine weight, XXL engine heat", () => {
        const standard = makeMech("standard"), light = makeMech("light"), xxl = makeMech("xxl"), mini = makeMech("mini-engine");
        expect(mini.getEngineType().tag).toBe("mini-engine");
        expect(mini.getEngineWeight()).toBe(light.getEngineWeight());
        expect(mini.getEngineWeight()).toBeLessThan(standard.getEngineWeight() ?? 0);
        expect(engineSlots(mini)).toEqual(engineSlots(standard));
        expect(mini.getMaxMovementHeat()).toBe(xxl.getMaxMovementHeat());
        expect(mini.getMaxMovementHeat()).toBeGreaterThan(standard.getMaxMovementHeat());
        expect(mini.getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("XXL heat while jumping too", () => {
        const xxl = makeMech("xxl"), mini = makeMech("mini-engine");
        xxl.setJumpSpeed(4);
        mini.setJumpSpeed(4);
        expect(mini.getMaxMovementHeat()).toBe(xxl.getMaxMovementHeat());
    });

    it("offered only at the Custom Homebrew rules level", () => {
        const mech = makeMech("standard");
        const offered = (level: number) => mech.getAvailableEngines(level).find((engine) => engine.tag === "mini-engine")?.available;
        expect(offered(CUSTOM_HOMEBREW_RULES_LEVEL)).toBe(true);
        expect(offered(4)).not.toBe(true);
    });

    it("not offered above a rating of 400 or on a superheavy, and refused there with a message", () => {
        const large = makeMech("standard", 100, 5);
        expect(large.getAvailableEngines(CUSTOM_HOMEBREW_RULES_LEVEL).find((engine) => engine.tag === "mini-engine")?.available).not.toBe(true);
        const superheavy = makeMech("standard", 120, 3);
        expect(superheavy.getAvailableEngines(CUSTOM_HOMEBREW_RULES_LEVEL).find((engine) => engine.tag === "mini-engine")?.available).not.toBe(true);

        const mini = makeMech("mini-engine", 100, 4);
        expect(mini.getEngineType().tag).toBe("mini-engine");
        mini.setWalkSpeed(5);
        expect(mini.getChassisEquipmentViolations().some((text) => text.includes("Mini Engine"))).toBe(true);
    });

    it("in play the first engine hit counts as two: +10 heat a turn, and the second hit destroys it", () => {
        // Heat Point Table (TW p.159): first engine hit +5 a turn, second +10 in all. An XXL engine has no rule of
        // its own for engine-hit heat (TO:AUE p.121), so the Mini Engine follows the table with its first hit marked twice.
        const engineSlot = (mech: BattleMech, nth: number) =>
            mech.getCriticals().centerTorso.map((slot, index) => (slot?.tag === "engine" ? index : -1)).filter((index) => index >= 0)[nth];
        const mini = makeMech("mini-engine"), standard = makeMech("standard");
        const quietHeat = mini.getTurnHeatDifference(), standardQuietHeat = standard.getTurnHeatDifference();

        mini.toggleCritical("ct", engineSlot(mini, 0));
        standard.toggleCritical("ct", engineSlot(standard, 0));
        expect(mini.engineHits()).toBe(2);
        expect(standard.engineHits()).toBe(1);
        expect(mini.getEngineHitHeat()).toBe(10);
        expect(standard.getEngineHitHeat()).toBe(5);
        expect(mini.getTurnHeatDifference() - quietHeat).toBe(10);
        expect(standard.getTurnHeatDifference() - standardQuietHeat).toBe(5);
        expect(mini.isDestroyed()).toBe(false);

        mini.toggleCritical("ct", engineSlot(mini, 1));
        standard.toggleCritical("ct", engineSlot(standard, 1));
        expect(mini.engineHits()).toBe(3);
        expect(mini.isDestroyed()).toBe(true);
        expect(standard.getEngineHitHeat()).toBe(10);
        expect(standard.isDestroyed()).toBe(false);
    });

    it("play mode: XXL movement heat for XXL and Mini Engines (TO:AUE p.121)", () => {
        for (const tag of ["xxl", "mini-engine"]) {
            const mech = makeMech(tag);
            mech.setJumpSpeed(4);
            const heat = (mode: string, jumped = 0) => {
                mech.currentMovementMode = mode;
                mech.currentTargetJumpingMP = jumped;
                return mech.getActiveMoveHeat();
            };
            expect([heat(""), heat("n"), heat("w"), heat("r"), heat("j", 2), heat("j", 4)], tag).toEqual([2, 2, 4, 6, 6, 8]);
        }
        const standard = makeMech("standard");
        standard.currentMovementMode = "";
        expect(standard.getActiveMoveHeat()).toBe(0);
        standard.currentMovementMode = "r";
        expect(standard.getActiveMoveHeat()).toBe(2);
    });

    it("battle value treats it as a standard engine (engine modifier 1.0)", () => {
        const standard = makeMech("standard"), mini = makeMech("mini-engine");
        const engineStep = (mech: BattleMech) => JSON.stringify(mech.getBattleValueBreakdown("total-warfare")).match(/Engine modifier \(([^)]*)\)[^}]*?"detail":"([^"]*)"/);
        expect(engineStep(mini)?.[2]).toMatch(/x 1$/);
        expect(engineStep(standard)?.[2]).toMatch(/x 1$/);
    });
});
