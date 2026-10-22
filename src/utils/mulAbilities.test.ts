import { describe, expect, it } from "vitest";
import { countAbilityCodes, getAbilityBaseCode, unitHasAbility } from "./mulAbilities";

describe("getAbilityBaseCode", () => {
    it("strips the value from an ability, spaced or not", () => {
        expect(getAbilityBaseCode("IF 1")).toBe("IF");
        expect(getAbilityBaseCode("IF0*")).toBe("IF");
        expect(getAbilityBaseCode("LRM 1/2/2")).toBe("LRM");
        expect(getAbilityBaseCode("AC0*/1/1)")).toBe("AC");
        expect(getAbilityBaseCode("ARTAIS-1")).toBe("ARTAIS");
        expect(getAbilityBaseCode("ARTAIS -2")).toBe("ARTAIS");
        expect(getAbilityBaseCode("TUR (2/2/2")).toBe("TUR");
        expect(getAbilityBaseCode("BIM (3a)")).toBe("BIM");
        expect(getAbilityBaseCode("MTAS1)")).toBe("MTAS");
    });

    it("keeps digits that are part of the code", () => {
        expect(getAbilityBaseCode("C3M")).toBe("C3M");
        expect(getAbilityBaseCode("C3BSM 2")).toBe("C3BSM");
        expect(getAbilityBaseCode("C3")).toBe("C3");
    });

    it("keeps hyphenated codes", () => {
        expect(getAbilityBaseCode("I-TSM")).toBe("I-TSM");
        expect(getAbilityBaseCode("TSEMP-O 1")).toBe("TSEMP-O");
    });

    it("ignores role names and placeholders mixed into the ability list", () => {
        expect(getAbilityBaseCode("Brawler")).toBeNull();
        expect(getAbilityBaseCode("Fast Dogfighter")).toBeNull();
        expect(getAbilityBaseCode("None")).toBeNull();
        expect(getAbilityBaseCode("0*")).toBeNull();
        expect(getAbilityBaseCode("")).toBeNull();
    });
});

describe("unitHasAbility", () => {
    it("matches a code exactly, not as a substring of another code", () => {
        expect(unitHasAbility("ECM, TAG", "ECM")).toBe(true);
        expect(unitHasAbility("LECM, LTAG", "ECM")).toBe(false);
        expect(unitHasAbility("AECM", "ECM")).toBe(false);
        expect(unitHasAbility("CASEII", "CASE")).toBe(false);
    });

    it("matches a code with any value, or only the value asked for", () => {
        expect(unitHasAbility("ENE, IF 2", "IF")).toBe(true);
        expect(unitHasAbility("ENE, IF 2", "IF2")).toBe(true);
        expect(unitHasAbility("ENE, IF 2", "IF 2")).toBe(true);
        expect(unitHasAbility("ENE, IF1", "IF2")).toBe(false);
    });

    it("finds abilities inside a turret", () => {
        expect(unitHasAbility("TUR (2/2/2, IF1)", "IF")).toBe(true);
    });

    it("ignores case in the query", () => {
        expect(unitHasAbility("ECM", "ecm")).toBe(true);
    });

    it("handles units with no abilities", () => {
        expect(unitHasAbility("", "ECM")).toBe(false);
        expect(unitHasAbility(undefined, "ECM")).toBe(false);
    });
});

describe("countAbilityCodes", () => {
    it("counts each code once per unit, most common first", () => {
        const counts = countAbilityCodes([
            { BFAbilities: "ECM, IF1, IF 2" },
            { BFAbilities: "IF 1, Brawler" },
            { BFAbilities: "" },
        ]);
        expect(counts).toEqual([
            { code: "IF", count: 2 },
            { code: "ECM", count: 1 },
        ]);
    });
});
