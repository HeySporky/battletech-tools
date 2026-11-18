import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { CONST_AS_SPECIAL_ABILITIES, ESpecialAbilityType, POWER_ARMOR_AS_ABILITY_TEXT } from "../data/alpha-strike-special-abilities";
import { FW_POWER_ARMOR_RULESET, POWER_ARMOR_AS_ABILITY } from "../data/future-wars-power-armor";
import { calculateGroundPointValue } from "../utils/alphaStrikeGroundPointValue";
import { buildMech } from "../test-support/builders";

/**
 * Power Armor plan, Chunk D (#172): Battle Value, cost and the Alpha Strike card of a suit. The figures are checked by
 * hand against TechManual's cost and BV2 procedures and the Alpha Strike Companion's Point Value (errata v1.6).
 */

/** IPA-4: the owner's 5-ton suit (ours), saved from the creator; Chunk E makes it a sample. */
const ipa4 = (): BattleMech => {
    const mech = new BattleMech();
    expect(mech.importJSON(readFileSync(new URL("../data/__fixtures__/power-armor-ipa-4.json", import.meta.url), "utf8"))).toBeTruthy();
    return mech;
};

describe("A suit's cost (call 6: the edition's rules, the waldo for the cockpit)", () => {
    it("prices IPA-4 at 184,065 C-bills: 175,300 x 1.05, with the waldo's 50,000 in place of a cockpit's 200,000", () => {
        const mech = ipa4();
        const breakdown = mech.getCostBreakdown();
        expect(breakdown.result).toBe(184065);
        expect(breakdown.steps.find(step => step.label === "Power Armor Waldo System")?.value).toBe(50000);
        expect(breakdown.steps.some(step => step.label === "Cockpit")).toBe(false);
        expect(breakdown.notes?.join(" ")).toMatch(/Bill Swisher's Power Armor rules/);
    });
});

describe("A suit's Battle Value (BV2)", () => {
    it("counts the +1 to hit a suit as +1 TMM: IPA-4 is 80.5 x 1.4 + 34.5 = 147", () => {
        const mech = ipa4();
        expect(mech.getBattleValue()).toBe(147);
        const steps = mech.getBattleValueBreakdown().steps;
        expect(steps.find(step => /Power Armor/.test(step.label))?.value).toBe(0.1);
        expect(mech.getBattleValueBreakdown().notes?.join(" ")).toMatch(/\+1 to hit .* Defensive Factor/);
    });

    it("leaves a 'Mech without the ruleset as today", () => {
        const plain = buildMech({ type: "biped", tonnage: 10, walk: 6, homebrew: [] });
        expect(plain.getBattleValueBreakdown().steps.some(step => /Power Armor/.test(step.label))).toBe(false);
        expect(plain.getBattleValueBreakdown().notes).toBeUndefined();
    });
});

describe("A suit's Alpha Strike card (owner ruling 2026-11-17)", () => {
    it("is a BattleMech card of Size 1 with the PWA special ability", () => {
        const mech = ipa4();
        const unit = mech.calcAlphaStrike();
        expect(unit.type).toBe("BM");
        expect(unit.size).toBe(1);
        expect(unit.abilities).toEqual(expect.arrayContaining(["ENE", POWER_ARMOR_AS_ABILITY]));
        expect([unit.armor, unit.structure]).toEqual([1, 1]);
    });

    it("prices the +1 to hit as +1 TMM in the defense factor: IPA-4 is 9 PV, not 7", () => {
        expect(ipa4().calcAlphaStrike().basePoints).toBe(9);
    });

    it("adds +1 to the defense modifier for PWA, as STL does", () => {
        const card = (specials: string[]) => calculateGroundPointValue({
            type: "BM", size: 1, moves: [{ inches: 12, mode: "" }], jump: 0,
            short: { damage: 1, minimal: false }, medium: { damage: 0, minimal: false }, long: { damage: 0, minimal: false },
            overheat: 0, armor: 1, structure: 1, specials,
        });
        expect(card(["ENE"]).pointValue).toBe(7);
        expect(card(["ENE", "PWA"]).pointValue).toBe(9);
        expect(card(["ENE", "PWA"]).log.join(" ")).toMatch(/x 1\.75/);
    });

    it("gives no PWA to a 'Mech without the ruleset", () => {
        const plain = buildMech({ type: "biped", tonnage: 10, walk: 6, homebrew: [] });
        expect(plain.calcAlphaStrike().abilities).not.toContain(POWER_ARMOR_AS_ABILITY);
        expect(buildMech({ type: "biped", tonnage: 10, walk: 6, homebrew: [FW_POWER_ARMOR_RULESET] }).calcAlphaStrike().abilities).toContain(POWER_ARMOR_AS_ABILITY);
    });

    it("explains PWA as a Custom Homebrew ability", () => {
        const ability = CONST_AS_SPECIAL_ABILITIES.find(entry => entry.tag === POWER_ARMOR_AS_ABILITY);
        expect(ability?.type).toBe(ESpecialAbilityType.Custom);
        expect(ability?.summary).toBe(POWER_ARMOR_AS_ABILITY_TEXT);
        expect(POWER_ARMOR_AS_ABILITY_TEXT.join(" ")).toMatch(/\+1 to hit/);
        expect(POWER_ARMOR_AS_ABILITY_TEXT.join(" ")).toMatch(/1 inch \(1 level\) tall/);
    });
});
