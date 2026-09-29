import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit, getRulesLevelFromMULRules } from "./alpha-strike-unit";

describe("Alpha Strike unit rules level", () => {
    // MUL "Rules" values drive the roster print guard (Standard = tournament play).
    it("maps MUL Rules values to rules-level ids", () => {
        expect(getRulesLevelFromMULRules("Introductory")).toBe(1);
        expect(getRulesLevelFromMULRules("Standard")).toBe(2);
        expect(getRulesLevelFromMULRules("Advanced")).toBe(3);
        expect(getRulesLevelFromMULRules("Experimental")).toBe(4);
        expect(getRulesLevelFromMULRules(undefined)).toBeUndefined();
    });

    it("keeps the rules level through export and import", () => {
        const unit = new AlphaStrikeUnit();
        unit.rulesLevel = 3;
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        const restored = new AlphaStrikeUnit();
        restored.importUnit(unit.export());
        expect(restored.rulesLevel).toBe(3);
    });
});
