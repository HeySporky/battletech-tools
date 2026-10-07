import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { getRulesLevelFromMULRules } from "../classes/alpha-strike-unit";
import type { IEquipmentItem } from "./data-interfaces";
import {
    APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL, EXPERIMENTAL_RULES_LEVEL, MUNCHKIN_RULES_LEVEL,
    getEquipmentListByTech, getEquipmentRulesLevel, isEquipmentWithinRulesLevel,
} from "./equipment-registry";
import { getTonnageBoundsForMechType } from "./mech-tonnages";
import { getRulesLevelOptions } from "./rules-level-options";

// Rules levels (project decision, 2026-10-06): 0-4 are canon, as the rulebooks grade them; 5 is Apocryphal
// (licensed but not canon); 6 is Custom Homebrew (fan-made and balanced); 7 is Munchkin (fan-made and not).
// Each level includes everything below it.
describe("Rules levels", () => {
    const item = (extra: Partial<IEquipmentItem>): IEquipmentItem => ({ tag: "test-item", name: "Test Item", ...extra }) as IEquipmentItem;

    it("run from Beginners (0) to Munchkin (7), in order", () => {
        expect(getRulesLevelOptions().map(option => [option.id, option.tag])).toEqual([
            [0, "beginner"], [1, "intro"], [2, "std"], [3, "adv"], [4, "exp"],
            [5, "apocryphal"], [6, "custom"], [7, "munchkin"],
        ]);
        expect([EXPERIMENTAL_RULES_LEVEL, APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL, MUNCHKIN_RULES_LEVEL]).toEqual([4, 5, 6, 7]);
    });

    it("put custom content at Custom Homebrew, and keep an item's own higher or lower non-canon level", () => {
        expect(getEquipmentRulesLevel(item({ catalog: "custom" }))).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(getEquipmentRulesLevel(item({ book: "Custom" }))).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(getEquipmentRulesLevel(item({ catalog: "custom", rulesLevel: MUNCHKIN_RULES_LEVEL }))).toBe(MUNCHKIN_RULES_LEVEL);
        expect(getEquipmentRulesLevel(item({ catalog: "is", rulesLevel: APOCRYPHAL_RULES_LEVEL }))).toBe(APOCRYPHAL_RULES_LEVEL);
        expect(getEquipmentRulesLevel(item({ catalog: "is", rulesLevel: 3 }))).toBe(3);
    });

    it("no bundled custom record is still graded at the old Custom level of 5", () => {
        const custom = getEquipmentListByTech("is", true).filter(record => record.catalog === "custom" || record.book === "Custom");
        expect(custom.length).toBeGreaterThan(0);
        expect(custom.filter(record => record.rulesLevel === APOCRYPHAL_RULES_LEVEL).map(record => record.tag)).toEqual([]);
    });

    it("hide Apocryphal, Custom and Munchkin items below their own level; canon items are never hidden by level", () => {
        const apocryphal = item({ catalog: "is", rulesLevel: APOCRYPHAL_RULES_LEVEL });
        const custom = item({ catalog: "custom" });
        const munchkin = item({ catalog: "custom", rulesLevel: MUNCHKIN_RULES_LEVEL });
        const experimental = item({ catalog: "is", rulesLevel: EXPERIMENTAL_RULES_LEVEL });

        const visibleAt = (level: number) => [experimental, apocryphal, custom, munchkin].map(record => isEquipmentWithinRulesLevel(record, level));
        expect(visibleAt(2)).toEqual([true, false, false, false]);
        expect(visibleAt(APOCRYPHAL_RULES_LEVEL)).toEqual([true, true, false, false]);
        expect(visibleAt(CUSTOM_HOMEBREW_RULES_LEVEL)).toEqual([true, true, true, false]);
        expect(visibleAt(MUNCHKIN_RULES_LEVEL)).toEqual([true, true, true, true]);
    });

    it("offer custom equipment in the 'Mech builder at Custom Homebrew and Munchkin, not at Apocryphal", () => {
        const mech = new BattleMech();
        const customCount = (level: number) => mech.getAvailableEquipment(level >= CUSTOM_HOMEBREW_RULES_LEVEL, level)
            .filter(record => record.catalog === "custom").length;
        expect(customCount(APOCRYPHAL_RULES_LEVEL)).toBe(0);
        expect(customCount(CUSTOM_HOMEBREW_RULES_LEVEL)).toBeGreaterThan(0);
        expect(customCount(MUNCHKIN_RULES_LEVEL)).toBe(customCount(CUSTOM_HOMEBREW_RULES_LEVEL));
    });

    it("lift the tonnage limits at Custom Homebrew and Munchkin only", () => {
        expect(getTonnageBoundsForMechType("lam", APOCRYPHAL_RULES_LEVEL)).toEqual({ min: 20, max: 55 });
        expect(getTonnageBoundsForMechType("lam", CUSTOM_HOMEBREW_RULES_LEVEL)).toEqual({ min: 10, max: 200 });
        expect(getTonnageBoundsForMechType("lam", MUNCHKIN_RULES_LEVEL)).toEqual({ min: 10, max: 200 });
    });

    it("read the Master Unit List's \"Unofficial\" as Apocryphal", () => {
        expect(getRulesLevelFromMULRules("Unofficial")).toBe(APOCRYPHAL_RULES_LEVEL);
    });
});
