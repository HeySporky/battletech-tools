import { describe, expect, it } from "vitest";
import { btSpecialRulesets } from "../data/special-rulesets";
import { EMPTY_RULESET_FILTER, filterRulesets, getRulesetPublications, groupRulesets, IRulesetListFilter, isRulesetFilterActive } from "./ruleset-list";

/** The Special Rulesets window's search, filters and groups (#324, window refactor Task 3). */
const FLINT = ["best-of-future-wars-construction", "future-wars-11-construction"];
const ids = (filter: Partial<IRulesetListFilter>, ticked: string[] = []) =>
    filterRulesets(btSpecialRulesets, { ...EMPTY_RULESET_FILTER, ...filter }, ticked).map((ruleset) => ruleset.id);

describe("ruleset list", () => {
    it("matches every word, any case, either apostrophe", () => {
        expect(ids({ query: "’mech CONSTRUCTION" })).toEqual(expect.arrayContaining(FLINT));
        expect(ids({ query: "'mech flint" })).toEqual(FLINT);
        expect(ids({ query: "‘Mech   flint" })).toEqual(FLINT);
    });

    it("searches author and tag", () => {
        expect(ids({ query: "Bruanning" })).toEqual(["fw-weapon-malfunctions", "fw-weapon-malfunctions-9"]);
        expect(ids({ query: "FW #14" })).toEqual(["fw-power-armor", "fw-equipment-first-printings"]);
    });

    it("filters by publication", () => {
        expect(ids({ publication: "r/battletech" })).toEqual(["tandem-charge-srm-house-rule"]);
    });

    it("hides unavailable but never a ticked one", () => {
        const shown = ids({ hideUnavailable: true }, ["fw-power-armor"]);
        expect(shown).toContain("fw-power-armor");
        for (const id of FLINT) expect(shown).not.toContain(id);
    });

    it("shows ticked only", () => {
        expect(ids({ tickedOnly: true })).toEqual([]);
        expect(ids({ tickedOnly: true }, ["fw-morale"])).toEqual(["fw-morale"]);
    });

    it("groups in category order and counts hidden ticked rulesets", () => {
        const ticked = ["fw-morale"];
        const shown = filterRulesets(btSpecialRulesets, { ...EMPTY_RULESET_FILTER, query: "Flint" }, ticked);
        expect(groupRulesets(btSpecialRulesets, shown, ticked).map((group) => group.category)).toEqual(["construction"]);
        const all = groupRulesets(btSpecialRulesets, btSpecialRulesets, ticked);
        expect(all.map((group) => group.category)).toEqual(["construction", "play", "setting"]);
        expect(all.find((group) => group.category === "play")).toMatchObject({ label: "Play", ticked: 1, total: 10 });
        expect(all[0]).toMatchObject({ label: "Construction", ticked: 0, total: 7 });
    });

    it("lists the publications, sorted", () => {
        expect(getRulesetPublications(btSpecialRulesets)).toEqual(["Future Wars", "r/battletech", "Samples"]);
    });

    it("knows when a filter is active", () => {
        expect(isRulesetFilterActive(EMPTY_RULESET_FILTER)).toBe(false);
        expect(isRulesetFilterActive({ ...EMPTY_RULESET_FILTER, query: "  " })).toBe(false);
        expect(isRulesetFilterActive({ ...EMPTY_RULESET_FILTER, tickedOnly: true })).toBe(true);
    });
});
