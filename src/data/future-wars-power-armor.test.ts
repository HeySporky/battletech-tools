import { describe, expect, it } from "vitest";
import {
    FW_POWER_ARMOR_RULESET, POWER_ARMOR_BUILDING_EFFECTS, POWER_ARMOR_FIVE_TON_STRUCTURE, POWER_ARMOR_FIVE_TON_WEAPONS,
    POWER_ARMOR_TONNAGES, POWER_ARMOR_WALDO, getPowerArmorShieldingWeight, getPowerArmorSlots, isPowerArmorTonnage,
    needsPowerArmorShielding, getPowerArmorBuildingRow, getPowerArmorSheetRules,
} from "./future-wars-power-armor";
import { findSpecialRuleset, getRulesetConflict } from "./special-rulesets";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

/**
 * Power Armor plan, Chunk A (#172): Bill Swisher's "Power Armor: The Poor Man's Battlemech" (Future Wars #14 p.39;
 * The Best of Future Wars, Volume One, pp.14-16) and the sample sheets of Future Wars #14 pp.43-45.
 */
describe("Power Armor tables (Best-of pp.14-16, Future Wars #14 pp.43-45)", () => {
    it("builds 5-, 10- and 15-ton suits only", () => {
        expect([...POWER_ARMOR_TONNAGES]).toEqual([5, 10, 15]);
        expect([5, 10, 15].map(isPowerArmorTonnage)).toEqual([true, true, true]);
        expect([0, 7.5, 20, 25].map(isPowerArmorTonnage)).toEqual([false, false, false, false]);
    });

    it("has six slots in every location but the center torso's twelve (the sheets' six lines a location)", () => {
        for (const tons of [5, 10, 15]) {
            expect(["hd", "la", "ra", "lt", "rt", "ll", "rl"].map(loc => getPowerArmorSlots(tons, loc))).toEqual([6, 6, 6, 6, 6, 6, 6]);
            expect(getPowerArmorSlots(tons, "ct")).toBe(12);
            expect(getPowerArmorSlots(tons, "centerTorso")).toBe(12);
            expect(getPowerArmorSlots(tons, "rightArm")).toBe(6);
        }
        expect(getPowerArmorSlots(20, "hd")).toBeUndefined();
        expect(getPowerArmorSlots(10, "fll")).toBeUndefined();
    });

    it("gives the 5-ton suit its own structure: H1 CT3 ST2 A1 L1", () => {
        expect(POWER_ARMOR_FIVE_TON_STRUCTURE).toEqual({ head: 1, ct: 3, torso: 2, arm: 1, leg: 1 });
    });

    it("replaces the cockpit with a 0.5-ton, 50,000 C-bill waldo system in head slots 3-4 and center torso slots 11-12", () => {
        expect(POWER_ARMOR_WALDO.tag).toBe("power-armor-waldo");
        expect(POWER_ARMOR_WALDO.weight).toBe(0.5);
        expect(POWER_ARMOR_WALDO.cost).toBe(50000);
        expect(POWER_ARMOR_WALDO.prototype).toBe(2963);
        expect(POWER_ARMOR_WALDO.introduced).toBe(3027);
        expect(POWER_ARMOR_WALDO.rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("arms a 5-ton suit with flamers, machine guns and small lasers only", () => {
        expect([...POWER_ARMOR_FIVE_TON_WEAPONS]).toEqual(["standard-flamer", "vehicle-flamer", "machine-gun", "small-laser"]);
    });

    it("shields a 5-ton suit's fusion engine with half its weight, rounded up to the half ton", () => {
        expect([0.5, 1, 1.5, 2, 3.5].map(getPowerArmorShieldingWeight)).toEqual([0.5, 0.5, 1, 1, 2]);
        expect(getPowerArmorShieldingWeight(0)).toBe(0);
        expect(["standard", "light", "xl", "clan_xl", "compact", "xxl", "clan_xxl"].every(needsPowerArmorShielding)).toBe(true);
        expect(["ice", "cell", "fission", "primitive"].some(needsPowerArmorShielding)).toBe(false);
    });

    it("prints the Building Effects Table (MP / pilot modifier) by tonnage", () => {
        expect(POWER_ARMOR_BUILDING_EFFECTS).toEqual({
            5: { light: [1, 0], medium: [2, 0], heavy: [2, 1], hardened: [3, 2] },
            10: { light: [1, 0], medium: [2, 1], heavy: [3, 2], hardened: [4, 3] },
            15: { light: [2, 0], medium: [3, 1], heavy: [4, 2], hardened: [5, 4] },
        });
    });

    it("gives the sheet one row of the Building Effects Table, the suit's own", () => {
        expect(getPowerArmorBuildingRow(5)).toEqual([
            { building: "Light", mp: 1, pilot: 0 }, { building: "Medium", mp: 2, pilot: 0 },
            { building: "Heavy", mp: 2, pilot: 1 }, { building: "Hardened", mp: 3, pilot: 2 },
        ]);
        expect(getPowerArmorBuildingRow(15).map(cell => `${cell.mp}/${cell.pilot}`)).toEqual(["2/0", "3/1", "4/2", "5/4"]);
        expect(getPowerArmorBuildingRow(20)).toEqual([]);
    });

    it("prints the play rules on the sheet, the no-gyro pilot rule on a 5-ton suit only", () => {
        const ten = getPowerArmorSheetRules(10);
        expect(ten[0]).toMatch(/^\+1 to hit this suit/);
        expect(ten.join(" ")).toMatch(/Pilot critical in the center torso: 1D6 hits/);
        expect(ten.join(" ")).toMatch(/1D3 hits/);
        expect(ten.join(" ")).not.toMatch(/No gyro/);
        expect(getPowerArmorSheetRules(5).at(-1)).toMatch(/^No gyro: Piloting 3 or better; 4, \+2 to every Piloting Skill Roll/);
    });
});

describe("The Power Armor ruleset", () => {
    it("is registered at Custom Homebrew, credits the original and the reprint, and changes 'Mech construction", () => {
        const ruleset = findSpecialRuleset(FW_POWER_ARMOR_RULESET)!;
        expect(ruleset).toBeDefined();
        expect(ruleset.minRulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(ruleset.changes).toEqual(["mechConstruction"]);
        expect(ruleset.source.title).toMatch(/^Bill Swisher, 'Power Armor: The Poor Man's Battlemech', Future Wars #14 \(1989\), p\.39; reprinted in The Best of Future Wars, Volume One \(1991\), pp\.14-16/);
        expect(ruleset.description).toMatch(/Bill Swisher/);
    });

    it("cannot sit with Clell Flint's construction rules", () => {
        expect(getRulesetConflict(["best-of-future-wars-construction"], FW_POWER_ARMOR_RULESET)?.id).toBe("best-of-future-wars-construction");
        expect(getRulesetConflict([FW_POWER_ARMOR_RULESET], "future-wars-11-construction")?.id).toBe(FW_POWER_ARMOR_RULESET);
        expect(getRulesetConflict(["fw-morale"], FW_POWER_ARMOR_RULESET)).toBeUndefined();
    });
});
