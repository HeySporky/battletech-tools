import { describe, expect, it } from "vitest";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";
import { DEFAULT_RULES_EDITION, getIntroducedInEdition, getRulesEditions, isInRulesEdition } from "./rules-editions";

// `introducedInEdition` is reserved for a future "play with this edition's rules" selector. Until records are
// checked against the older rulebooks, every record belongs to the one edition the catalogs cite.
describe("Rules editions", () => {
    it("lists editions oldest first, with unique tags, and includes the default", () => {
        const editions = getRulesEditions();
        expect(editions.map(edition => edition.year)).toEqual([...editions.map(edition => edition.year)].sort((a, b) => a - b));
        expect(new Set(editions.map(edition => edition.tag)).size).toBe(editions.length);
        expect(editions.some(edition => edition.tag === DEFAULT_RULES_EDITION)).toBe(true);
    });

    it("treats a record with no edition as part of the default edition", () => {
        expect(getIntroducedInEdition({})).toBe(DEFAULT_RULES_EDITION);
        expect(isInRulesEdition({})).toBe(true);
    });

    // CRB p.247 lists the core rulebooks before Total Warfare: BattleTech Manual (1987), BattleTech Compendium
    // (1990), BattleTech Compendium: The Rules of Warfare (1994), BattleTech Master Rules (1998) and Master
    // Rules: Revised Edition (2001), and dates the Second Edition box set to 1985.
    it("lists the core rulebook line with the years the Core Rulebook gives (CRB p.247)", () => {
        const years = Object.fromEntries(getRulesEditions().map(edition => [edition.tag, edition.year]));
        expect(years).toMatchObject({
            "battletech-2nd-edition": 1985,
            "battletech-manual": 1987,
            "battletech-compendium": 1990,
            "compendium-rules-of-warfare": 1994,
            "master-rules": 1998,
            "master-rules-revised": 2001,
        });
        expect(getRulesEditions()[0].tag).toBe("battledroids");
    });

    it("includes an untagged record in Total Warfare and later, and in nothing earlier", () => {
        expect(isInRulesEdition({}, "core-rulebook")).toBe(true);
        expect(isInRulesEdition({}, "master-rules-revised")).toBe(false);
        expect(isInRulesEdition({ introducedInEdition: "battledroids" }, "battletech-manual")).toBe(true);
        expect(isInRulesEdition({ introducedInEdition: "core-rulebook" })).toBe(false);
    });

    it("never matches an edition that is not in the list", () => {
        expect(isInRulesEdition({ introducedInEdition: "no-such-edition" })).toBe(false);
        expect(isInRulesEdition({}, "no-such-edition")).toBe(false);
    });

    it("every bundled equipment record names a listed edition or none", () => {
        const tags = getRulesEditions().map(edition => edition.tag);
        const unknown = getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment)
            .filter(item => item.introducedInEdition !== undefined && !tags.includes(item.introducedInEdition))
            .map(item => item.tag);
        expect(unknown).toEqual([]);
    });
});
