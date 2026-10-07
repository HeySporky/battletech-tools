import { describe, expect, it } from "vitest";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";
import { DEFAULT_RULES_EDITION, getIntroducedInEdition, getRulesEditions, isInRulesEdition } from "./rules-editions";

// `introducedInEdition` is reserved for a future "play with this edition's rules" selector. Until older editions
// are added from their rulebooks, every record belongs to the one edition the catalogs cite.
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
