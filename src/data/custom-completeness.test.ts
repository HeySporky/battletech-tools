import { describe, expect, it } from "vitest";
import { DERIVATION_RULES } from "./derived-custom-values";
import { getEquipmentCatalogDefinitions, getEquipmentRulesLevel } from "./equipment-registry";
import { IEquipmentItem } from "./data-interfaces";
import { mechCustomArmorTypes } from "./mech-custom-armor-types";
import { mechCustomEngineTypes } from "./mech-custom-engine-types";
import { APOCRYPHAL_RULES_LEVEL } from "./rules-level-options";

// The guard for "are we missing anything": every Custom Homebrew, Apocryphal and Munchkin item has its source note, lore, rules, dates, tech rating,
// Battle Value, cost, rules level and (for a weapon) Alpha Strike values, or a stated reason it has none. A new fan item that lacks one fails here.

const fan = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment.map((item) => ({ item, custom: !!definition.custom, id: definition.id })))
    .filter(({ item, custom }) => custom || (item.rulesLevel ?? 1) >= APOCRYPHAL_RULES_LEVEL);

/** Weapons the Alpha Strike conversion does not cover, as derived-alpha-strike.ts says. */
const NO_ALPHA_STRIKE = /lrm|lrt|mortar|array|taser|\bams\b|-ams|pds|artillery|combo|smoker|buckler|chaff|hailstorm/i;
const isWeapon = (item: IEquipmentItem) => !item.isAmmo && ((typeof item.damage === "number" ? item.damage > 0 : !!item.damage) || (item.damageClusters ?? 0) > 0) && item.range.long > 0;
const zeroBattleValueIsRight = (item: IEquipmentItem) => {
    const rule = DERIVATION_RULES[item.tag];
    return !!rule && (rule.kind === "no-battle-value" || rule.kind === "copy-of");
};

describe("custom, Apocryphal and Munchkin equipment is complete", () => {
    it("covers a good part of the catalog", () => {
        expect(fan.length).toBeGreaterThan(200);
    });

    it("every item has notes, lore and rules", () => {
        const missing = fan.filter(({ item }) => !item.notes || !item.lore || !item.rules).map(({ item }) => `${item.tag} [${item.notes ? "" : "notes "}${item.lore ? "" : "lore "}${item.rules ? "" : "rules"}]`);
        expect(missing).toEqual([]);
    });

    it("every item is at Apocryphal level or above, in the record and as the registry grades it", () => {
        const low = fan.filter(({ item }) => (item.rulesLevel ?? 0) < APOCRYPHAL_RULES_LEVEL || getEquipmentRulesLevel(item) < APOCRYPHAL_RULES_LEVEL).map(({ item }) => item.tag);
        expect(low).toEqual([]);
    });

    it("every item has an introduction date (or, for a prototype that never went into production, a prototype date) and a tech rating", () => {
        const missing = fan.filter(({ item }) => ((item.introduced === null || item.introduced === undefined) && !item.prototype) || !item.techRating || item.techRating === "x").map(({ item }) => item.tag);
        expect(missing).toEqual([]);
    });

    it("every item has a Battle Value and a cost, or a stated reason for a 0", () => {
        const noBattleValue = fan.filter(({ item }) => !item.battleValue && !zeroBattleValueIsRight(item)).map(({ item }) => item.tag);
        expect(noBattleValue).toEqual([]);
        const noCost = fan.filter(({ item }) => !item.cbills).map(({ item }) => item.tag);
        expect(noCost).toEqual([]);
    });

    it("the custom engine and armor records have notes, lore, rules, a date and a rules level", () => {
        for (const record of [...mechCustomEngineTypes, ...mechCustomArmorTypes]) {
            expect(record.notes, record.tag).toBeTruthy();
            expect(record.lore, record.tag).toBeTruthy();
            expect(record.rules, record.tag).toBeTruthy();
            expect(record.introduced, record.tag).toBeGreaterThan(0);
            expect(record.rulesLevel, record.tag).toBeGreaterThanOrEqual(APOCRYPHAL_RULES_LEVEL);
        }
    });

    it("every weapon in the conversion's scope has Alpha Strike values", () => {
        const missing = fan.filter(({ item }) => isWeapon(item) && !item.battleValueDefensive && !NO_ALPHA_STRIKE.test(`${item.tag} ${item.name}`))
            .filter(({ item }) => !item.alphaStrike || (!item.alphaStrike.rangeShort && !item.alphaStrike.rangeMedium && !item.alphaStrike.rangeLong && !item.alphaStrike.rangeExtreme)).map(({ item }) => item.tag);
        expect(missing).toEqual([]);
    });
});
