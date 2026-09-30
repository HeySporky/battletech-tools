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

describe("Alpha Strike unit Armor and Structure setters", () => {
    // Armor and Structure are separate values on an Alpha Strike unit (ASCE p.25); each setter changes only its own.
    it("setStructure changes structure and leaves armor alone", () => {
        const unit = new AlphaStrikeUnit();
        unit.armor = 4;
        unit.structure = 3;
        unit.setStructure(7);
        expect(unit.structure).toBe(7);
        expect(unit.armor).toBe(4);
    });

    it("setArmor changes armor and leaves structure alone", () => {
        const unit = new AlphaStrikeUnit();
        unit.armor = 4;
        unit.structure = 3;
        unit.setArmor(6);
        expect(unit.armor).toBe(6);
        expect(unit.structure).toBe(3);
    });
});
