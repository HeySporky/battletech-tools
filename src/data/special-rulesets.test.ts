import { afterEach, describe, expect, it } from "vitest";
import { isKnownEditionTag } from "./rules-editions";
import { testSpecialRuleset } from "../test-support/rulesets";
import { btSpecialRulesets, CHANGE_LABELS, findSpecialRuleset, getRulesetConflict, getRulesetCredits, getRulesetsAttribution, ISpecialRuleset, RULESET_CATEGORIES } from "./special-rulesets";

const testRuleset = (id: string, changes: string[]): ISpecialRuleset => testSpecialRuleset({ id, changes });

describe("Special Rulesets (#324)", () => {
    afterEach(() => {
        for (const id of ["test-heat", "test-techs", "test-linked"]) {
            const index = btSpecialRulesets.findIndex((ruleset) => ruleset.id === id);
            if (index >= 0) {
                btSpecialRulesets.splice(index, 1);
            }
        }
    });

    it("ships the sample no-Clans universe", () => {
        const sample = findSpecialRuleset("sample-no-clans")!;
        expect(sample.name).toBe("Sample: The Clans never existed (alternate universe)");
        expect(sample.removesTechBases).toEqual(["clan", "mclan", "mis"]);
        expect(sample.changes).toEqual(["techBases"]);
    });

    it("finds a clash on a shared change, and none with itself or unrelated rulesets", () => {
        btSpecialRulesets.push(testRuleset("test-heat", ["heat"]), testRuleset("test-techs", ["techBases"]));
        expect(getRulesetConflict(["sample-no-clans"], "test-techs")?.id).toBe("sample-no-clans");
        expect(getRulesetConflict(["sample-no-clans"], "test-heat")).toBeUndefined();
        expect(getRulesetConflict(["sample-no-clans"], "sample-no-clans")).toBeUndefined();
    });
    describe("registry fields (window refactor)", () => {
        it("gives every ruleset a one-line summary of at most 120 characters", () => {
            for (const ruleset of btSpecialRulesets) {
                expect(ruleset.summary.length, ruleset.id).toBeGreaterThan(0);
                expect(ruleset.summary.length, ruleset.id).toBeLessThanOrEqual(120);
                expect(ruleset.summary, ruleset.id).not.toMatch(/\n/);
            }
        });

        it("files every ruleset under a known category", () => {
            const known = RULESET_CATEGORIES.map((category) => category.id);
            expect(known).toEqual(["construction", "play", "campaign", "setting"]);
            for (const ruleset of btSpecialRulesets) {
                expect(known, ruleset.id).toContain(ruleset.category);
            }
        });

        it("labels every change key", () => {
            for (const ruleset of btSpecialRulesets) {
                for (const change of ruleset.changes) {
                    expect(CHANGE_LABELS[change], `${ruleset.id}: ${change}`).toBeTruthy();
                }
            }
        });

        it("names only listed rulesets in excludes and requires, never itself", () => {
            for (const ruleset of btSpecialRulesets) {
                for (const id of [...(ruleset.excludes ?? []), ...(ruleset.requires ?? [])]) {
                    expect(findSpecialRuleset(id), `${ruleset.id} -> ${id}`).toBeDefined();
                    expect(id, ruleset.id).not.toBe(ruleset.id);
                }
            }
        });

        it("never requires a ruleset it clashes with or excludes", () => {
            for (const ruleset of btSpecialRulesets) {
                for (const id of ruleset.requires ?? []) {
                    const required = findSpecialRuleset(id)!;
                    expect(required.changes.some((change) => ruleset.changes.includes(change)), `${ruleset.id} -> ${id}`).toBe(false);
                    expect(ruleset.excludes ?? [], ruleset.id).not.toContain(id);
                }
            }
        });

        it("tags the shipped rulesets by publication", () => {
            expect(findSpecialRuleset("future-wars-11-construction")!.source).toMatchObject({ publication: "Future Wars", tag: "FW #11", author: "Clell Flint" });
            expect(findSpecialRuleset("tandem-charge-srm-house-rule")!.source).toMatchObject({ publication: "r/battletech", tag: "r/battletech", author: "u/Magical_Savior" });
        });
    });

    it("names only editions that exist as a minimum edition", () => {
        for (const ruleset of btSpecialRulesets.filter((item) => item.minEdition)) {
            expect(isKnownEditionTag(ruleset.minEdition!), ruleset.id).toBe(true);
        }
    });

    describe("attribution (round 5)", () => {
        it("prints nothing when no rulesets are in use", () => {
            expect(getRulesetsAttribution([])).toBeUndefined();
            expect(getRulesetCredits([])).toEqual([]);
        });

        it("names each ruleset with its source, as the spec's example", () => {
            expect(getRulesetsAttribution(["sample-no-clans"])).toBe("Special Rulesets: Sample: The Clans never existed (alternate universe), Sample ruleset (#324)");
        });

        it("puts a source link after its title, and joins rulesets with semicolons", () => {
            btSpecialRulesets.push({ ...testRuleset("test-linked", ["heat"]), name: "Linked", source: { title: "Fan PDF", url: "https://example.com/rules", publication: "Fan PDF", tag: "PDF" } });
            expect(getRulesetsAttribution(["sample-no-clans", "test-linked"])).toBe(
                "Special Rulesets: Sample: The Clans never existed (alternate universe), Sample ruleset (#324); Linked, Fan PDF (https://example.com/rules)");
            expect(getRulesetCredits(["test-linked"])).toEqual([{ name: "Linked", source: { title: "Fan PDF", url: "https://example.com/rules" } }]);
        });

        it("still prints a ruleset that is no longer listed, by its id", () => {
            expect(getRulesetsAttribution(["gone"])).toBe("Special Rulesets: gone (ruleset no longer listed)");
            expect(getRulesetCredits(["gone"])).toEqual([{ name: "gone (ruleset no longer listed)" }]);
        });
    });
});
