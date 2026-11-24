import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { allowsAlphaStrikeAbilityCode } from "../data/equipment-registry";
import { isCustomAlphaStrikeAbilityCode } from "../data/alpha-strike-special-abilities";
import { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL, EXPERIMENTAL_RULES_LEVEL, STANDARD_RULES_LEVEL } from "../data/rules-level-options";

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 * Any original, fan-made content or custom homebrew data processed by this tool
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 */

// #647 Task 4: our new specials (ITAS, BSF, NPC, HAIL, PSC, SMKT, SMKB, PBR, PBJ) and how a card carries them.
const mech = (level: number, ...tags: string[]) => {
    const unit = new BattleMech();
    unit.setTonnage(50);
    unit.applyGameSettings({ ...unit.getGameSettings(level), rulesLevel: level });
    tags.forEach((tag, index) => unit.addEquipmentFromTag(tag, "is", index % 2 ? "lt" : "rt", false, null, "", false, [], undefined, undefined, -1, "", true));
    return unit;
};

describe("#647 our specials are Custom codes", () => {
    it("recognizes each code as ours", () => {
        for (const code of ["ITAS1", "BSF3/3/1/0", "NPC", "HAIL", "PSC", "SMKT", "SMKB10", "PBR", "PBJ"]) {
            expect(isCustomAlphaStrikeAbilityCode(code), code).toBe(true);
        }
    });
    it("gates them to levels 6-7", () => {
        expect(allowsAlphaStrikeAbilityCode("NPC", 4)).toBe(false);
        expect(allowsAlphaStrikeAbilityCode("NPC", 6)).toBe(true);
    });
});

describe("#647 cards carrying our specials", () => {
    it("an Improved 'Mech Taser on a standard design shows ITAS1 and makes the card level 6", () => {
        const card = mech(STANDARD_RULES_LEVEL, "custom-improved-mech-taser").calcAlphaStrike();
        expect(card.abilities).toContain("ITAS1");
        expect(card.rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });
    it("two Buckler dispensers sum to SMKB20", () => {
        expect(mech(CUSTOM_HOMEBREW_RULES_LEVEL, "custom-buckler-smoke-dispenser", "custom-buckler-smoke-dispenser").calcAlphaStrike().abilities).toContain("SMKB20");
    });
    it("a Blue Saviour on ballistic weapons only gets BSF equal to its standard damage", () => {
        const unit = mech(CUSTOM_HOMEBREW_RULES_LEVEL, "autocannon-10", "custom-blue-saviour");
        const card = unit.calcAlphaStrike();
        const d = card.damage;
        expect(card.abilities).toContain(`BSF${d.short}/${d.medium}/${d.long}/${d.extreme}`);
    });
    it("a Blue Saviour on lasers only halves every bracket", () => {
        const unit = mech(CUSTOM_HOMEBREW_RULES_LEVEL, "medium-laser", "medium-laser", "medium-laser", "medium-laser", "custom-blue-saviour");
        const card = unit.calcAlphaStrike();
        const d = card.damage;
        const half = (value: number) => Math.round(value / 2);
        expect(card.abilities).toContain(`BSF${half(d.short)}/${half(d.medium)}/${half(d.long)}/${half(d.extreme)}`);
    });
    it("Hailstorm shows HAIL at its own level and does not raise the card", () => {
        const record = mech(APOCRYPHAL_RULES_LEVEL, "hailstorm-artillery").calcAlphaStrike();
        expect(record.abilities).toContain("HAIL");
        expect(record.rulesLevel).toBe(APOCRYPHAL_RULES_LEVEL);
    });
    it("a level 4 design never shows a custom code of an item that is not on it", () => {
        const card = mech(EXPERIMENTAL_RULES_LEVEL).calcAlphaStrike();
        expect(card.abilities.some((code) => isCustomAlphaStrikeAbilityCode(code))).toBe(false);
    });
});
