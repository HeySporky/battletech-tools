import { describe, expect, it } from "vitest";
import { IASMULUnit } from "../classes/alpha-strike-unit";
import { btSpecialRulesets, ISpecialRuleset } from "../data/special-rulesets";
import { getMULEraAliases, getMULEraIDs } from "./mulUtilities";
import { changeMULSearchFilters, filterMULByRulesets, isMULEraOffered, isMULTechOffered, isMULTypeOffered, newMULSearchFilters } from "./mulSearchFilters";
import { testSpecialRuleset } from "../test-support/rulesets";

const NO_CLANS = "sample-no-clans";
const aliasId = (name: string) => getMULEraAliases().find((alias) => alias.label.startsWith(name))!.id;
const unit = (techId: number, typeId: number, bfType = "") => ({ Technology: { Id: techId }, Type: { Id: typeId }, BFType: bfType }) as unknown as IASMULUnit;
// A ruleset of the test's own, taken out again after it.
const withRuleset = (ruleset: Partial<ISpecialRuleset>, run: () => void) => {
    btSpecialRulesets.push(testSpecialRuleset({ id: "test-ruleset", name: "Test", changes: ["test"], ...ruleset }));
    try {
        run();
    } finally {
        btSpecialRulesets.splice(btSpecialRulesets.findIndex((entry) => entry.id === "test-ruleset"), 1);
    }
};

describe("MUL search rulesets (#324 round 4)", () => {
    it("offers every tech, type and era with no rulesets", () => {
        expect(["", "inner sphere", "clan"].every((tech) => isMULTechOffered(tech, []))).toBe(true);
        expect([0, 18, 23, 1701].every((type) => isMULTypeOffered(type, []))).toBe(true);
        expect([...getMULEraIDs(), ...getMULEraAliases().map((alias) => alias.id)].every((era) => isMULEraOffered(era, "", []))).toBe(true);
    });

    it("no-Clans removes Clan tech, the ProtoMech type and the Clan era aliases", () => {
        expect(isMULTechOffered("clan", [NO_CLANS])).toBe(false);
        expect(isMULTechOffered("inner sphere", [NO_CLANS])).toBe(true);
        expect(isMULTypeOffered(23, [NO_CLANS])).toBe(false);
        expect(isMULTypeOffered(18, [NO_CLANS])).toBe(true);
        expect(getMULEraAliases().some((alias) => isMULEraOffered(alias.id, "", [NO_CLANS]))).toBe(false);
        expect(getMULEraIDs().every((era) => isMULEraOffered(era, "", [NO_CLANS]))).toBe(true);
    });

    it("Clan tech offers no Age of War or Star League", () => {
        expect(isMULEraOffered(1, "clan", [])).toBe(false);
        expect(isMULEraOffered(10, "clan", [])).toBe(false);
        expect(isMULEraOffered(11, "clan", [])).toBe(true);
        expect(isMULEraOffered(13, "clan", [])).toBe(true);
    });

    it("Inner Sphere tech offers no Clan era aliases", () => {
        expect(isMULEraOffered(aliasId("Clan Golden Years"), "inner sphere", [])).toBe(false);
    });

    it("ticking no-Clans moves Tech, Type and Era with notices", () => {
        const start = newMULSearchFilters({ tech: "clan", type: 23, era: aliasId("Clan Golden Years") });
        const { filters, moves } = changeMULSearchFilters(start, { rulesets: [NO_CLANS] });
        expect(filters).toMatchObject({ rulesets: [NO_CLANS], tech: "", type: 0, era: 11 });
        expect(moves).toEqual(["Tech moved to All", "Type moved to All", "Era moved to Early Succession War"]);
    });

    it("picking Clan tech moves Star League to Early Succession War", () => {
        const { filters, moves } = changeMULSearchFilters(newMULSearchFilters({ era: 10 }), { tech: "clan" });
        expect(filters.era).toBe(11);
        expect(moves).toEqual(["Era moved to Early Succession War"]);
    });

    it("an unknown ruleset id is dropped", () => {
        expect(changeMULSearchFilters(newMULSearchFilters(), { rulesets: [NO_CLANS, "unknown-ruleset"] }).filters.rulesets).toEqual([NO_CLANS]);
    });

    it("a ruleset that clashes with one already ticked is dropped and named", () => {
        btSpecialRulesets.push(testSpecialRuleset({ id: "test-clash", name: "Test clash", changes: ["techBases"] }));
        try {
            const { filters, moves } = changeMULSearchFilters(newMULSearchFilters({ rulesets: [NO_CLANS] }), { rulesets: [NO_CLANS, "test-clash"] });
            expect(filters.rulesets).toEqual([NO_CLANS]);
            expect(moves).toEqual(["Clashes with Sample: The Clans never existed (alternate universe)"]);
        } finally {
            btSpecialRulesets.splice(btSpecialRulesets.findIndex((ruleset) => ruleset.id === "test-clash"), 1);
        }
    });

    it("unticking does not move values back", () => {
        const ticked = changeMULSearchFilters(newMULSearchFilters({ tech: "clan", type: 23 }), { rulesets: [NO_CLANS] }).filters;
        const { filters, moves } = changeMULSearchFilters(ticked, { rulesets: [] });
        expect(filters).toMatchObject({ rulesets: [], tech: "", type: 0 });
        expect(moves).toEqual([]);
    });

    it("leaves the edited step itself alone and reports no move for it", () => {
        const { filters, moves } = changeMULSearchFilters(newMULSearchFilters({ rulesets: [NO_CLANS] }), { era: 10 });
        expect(filters.era).toBe(10);
        expect(moves).toEqual([]);
    });

    it("filterMULByRulesets drops Clan, Mixed and ProtoMech units, keeps Inner Sphere and Primitive", () => {
        const units = [unit(1, 18), unit(2, 18), unit(3, 19), unit(57, 18), unit(1, 23)];
        expect(filterMULByRulesets(units, [NO_CLANS])).toEqual([units[0], units[3]]);
        expect(filterMULByRulesets(units, [])).toEqual(units);
    });

    it("knows the MUL's Primitive units (id 4) are Inner Sphere technology", () => {
        withRuleset({ removesTechBases: ["is"] }, () => {
            expect(filterMULByRulesets([unit(4, 18), unit(57, 18), unit(2, 18)], ["test-ruleset"])).toEqual([unit(2, 18)]);
        });
    });

    it("sorts the MUL's aerospace (type 17) into fighters, small craft and capital ships", () => {
        withRuleset({ removesUnitTypes: ["capital-ship"] }, () => {
            const kept = filterMULByRulesets([unit(1, 17, "AF"), unit(1, 17, "DS"), unit(1, 17, "WS")], ["test-ruleset"]);
            expect(kept.map((entry) => entry.BFType)).toEqual(["AF", "DS"]);
        });
    });

    it("treats a missing Tech filter as All", () => {
        expect(isMULTechOffered(null as never, [NO_CLANS])).toBe(true);
        expect(isMULEraOffered(13, undefined as never, [NO_CLANS])).toBe(true);
    });
});
