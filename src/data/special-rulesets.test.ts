import { afterEach, describe, expect, it } from "vitest";
import { isKnownEditionTag } from "./rules-editions";
import { testSpecialRuleset } from "../test-support/rulesets";
import { btSpecialRulesets, CHANGE_LABELS, findSpecialRuleset, getRulesetBlock, getRulesetConflict, getRulesetCredits, getRulesetRelations, getRulesetsAttribution, ISpecialRuleset, orderForUntick, RULESET_CATEGORIES } from "./special-rulesets";

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
    describe("eligibility (window refactor)", () => {
        const ids = ["test-a", "test-b", "test-c", "test-d", "test-techs"];
        afterEach(() => {
            for (const id of ids) {
                const index = btSpecialRulesets.findIndex((ruleset) => ruleset.id === id);
                if (index >= 0) btSpecialRulesets.splice(index, 1);
            }
        });
        const pushPairs = () => btSpecialRulesets.push(
            testSpecialRuleset({ id: "test-a", name: "A", changes: ["a"], excludes: ["test-b"] }),
            testSpecialRuleset({ id: "test-b", name: "B", changes: ["b"] }),
            testSpecialRuleset({ id: "test-c", name: "C", changes: ["c"] }),
            testSpecialRuleset({ id: "test-d", name: "D", changes: ["d"], requires: ["test-c"] }),
        );

        it("explains a clash with the change's label", () => {
            btSpecialRulesets.push(testRuleset("test-techs", ["techBases"]));
            const block = getRulesetBlock(["sample-no-clans"], "test-techs");
            expect(block?.kind).toBe("clash");
            expect(block?.reason).toBe("Clashes with Sample: The Clans never existed (alternate universe) (both change the tech bases)");
        });

        it("refuses an exclusion from either side", () => {
            pushPairs();
            expect(getRulesetBlock(["test-a"], "test-b")).toMatchObject({ kind: "excluded", reason: "Cannot be used with A" });
            expect(getRulesetBlock(["test-b"], "test-a")).toMatchObject({ kind: "excluded", reason: "Cannot be used with B" });
            expect(getRulesetConflict(["test-b"], "test-a")?.id).toBe("test-b");
        });

        it("needs a missing requirement", () => {
            pushPairs();
            expect(getRulesetBlock([], "test-d")).toMatchObject({ kind: "needs", reason: "Needs C" });
            expect(getRulesetBlock(["test-c"], "test-d")).toBeUndefined();
        });

        it("will not untick a requirement in use", () => {
            pushPairs();
            expect(getRulesetBlock(["test-c", "test-d"], "test-c")).toMatchObject({ kind: "neededBy", reason: "Needed by D" });
            expect(getRulesetBlock(["test-c"], "test-c")).toBeUndefined();
        });

        it("warns, without refusing, on a saved pair that no longer fits", () => {
            pushPairs();
            expect(getRulesetBlock(["test-a", "test-b"], "test-a")).toMatchObject({ kind: "excluded", reason: "Cannot be used with B" });
        });

        it("warns, without refusing, on a saved ruleset whose requirement is not ticked", () => {
            pushPairs();
            expect(getRulesetBlock(["test-d"], "test-d")).toMatchObject({ kind: "needs", reason: "Needs C" });
        });

        it("orders ids for unticking with dependants before what they need", () => {
            pushPairs();
            expect(orderForUntick(["test-c", "test-d", "test-a"])).toEqual(["test-d", "test-c", "test-a"]);
            expect(orderForUntick(["test-d", "test-c"])).toEqual(["test-d", "test-c"]);
        });

        it("names the unit type first", () => {
            expect(getRulesetBlock([], "sample-no-clans", "protomech")).toMatchObject({ kind: "unitType", reason: "ProtoMechs do not exist under this ruleset" });
        });

        it("keeps Power Armor and Flint's construction apart, with the reason", () => {
            expect(getRulesetBlock(["fw-power-armor"], "future-wars-11-construction")!.reason)
                .toBe("Clashes with Future Wars: Power Armor (both change 'Mech construction)");
        });

        it("lists a ruleset's relations", () => {
            pushPairs();
            expect(getRulesetRelations("test-b").excludes.map((ruleset) => ruleset.id)).toEqual(["test-a"]);
            expect(getRulesetRelations("test-c").requiredBy.map((ruleset) => ruleset.id)).toEqual(["test-d"]);
            expect(getRulesetRelations("test-d").requires.map((ruleset) => ruleset.id)).toEqual(["test-c"]);
            expect(getRulesetRelations("fw-power-armor").clashesWith.map((ruleset) => ruleset.id))
                .toEqual(["best-of-future-wars-construction", "future-wars-11-construction"]);
        });
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
