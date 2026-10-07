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

// Battledroids p.20, Weapons Table: the fourteen weapons of the first edition, as printed. Each row is
// [tag, heat, minimum, short, medium, long, tons, critical spaces, shots per ton (0 = no ammo)]; damage is checked
// for the weapons that print a number (missiles do damage per missile).
//
// The seven missile launchers printed lower heat in Battledroids than they have had since (LRM 1/2/4/6 against
// 2/4/5/6, SRM 0/1/2 against 2/3/4). `heatSince` holds today's value for those. The tag says the weapon first
// appeared in that edition, not that its numbers are unchanged; an edition selector needs these differences.
describe("Rules editions: Battledroids weapons (Battledroids p.20, Weapons Table)", () => {
    const table: [string, number, number, number, number, number, number, number, number][] = [
        ["small-laser", 1, 0, 1, 2, 3, 0.5, 1, 0],
        ["medium-laser", 3, 0, 3, 6, 9, 1, 1, 0],
        ["large-laser", 8, 0, 5, 10, 15, 5, 2, 0],
        ["standard-ppc", 10, 3, 6, 12, 18, 7, 3, 0],
        ["lrm-5", 1, 6, 7, 14, 21, 2, 1, 24],
        ["lrm-10", 2, 6, 7, 14, 21, 5, 2, 12],
        ["lrm-15", 4, 6, 7, 14, 21, 7, 3, 8],
        ["lrm-20", 6, 6, 7, 14, 21, 10, 5, 6],
        ["srm-2", 0, 0, 3, 6, 9, 1, 1, 50],
        ["srm-4", 1, 0, 3, 6, 9, 2, 1, 25],
        ["srm-6", 2, 0, 3, 6, 9, 3, 2, 15],
        ["autocannon-standard-b", 1, 3, 6, 12, 18, 8, 4, 20],
        ["machine-gun", 0, 0, 1, 2, 3, 0.5, 1, 200],
        ["standard-flamer", 3, 0, 1, 2, 3, 1, 1, 0],
    ];
    const heatSince: Record<string, number> = {
        "lrm-5": 2, "lrm-10": 4, "lrm-15": 5, "srm-2": 2, "srm-4": 3, "srm-6": 4,
    };
    const damage: Record<string, number> = {
        "small-laser": 3, "medium-laser": 5, "large-laser": 8, "standard-ppc": 10,
        "autocannon-standard-b": 5, "machine-gun": 2, "standard-flamer": 2,
    };
    const records = getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment);

    it("tags exactly the fourteen weapons in the table", () => {
        const tagged = records.filter(item => item.introducedInEdition === "battledroids").map(item => item.tag).sort();
        expect(tagged).toEqual(table.map(row => row[0]).sort());
    });

    it.each(table)("%s matches the Battledroids table, heat changes aside", (tag, heat, min, short, medium, long, tons, spaces, shots) => {
        const item = records.find(record => record.tag === tag && record.introducedInEdition === "battledroids")!;
        expect(item).toBeDefined();
        expect([item.range.min, item.range.short, item.range.medium, item.range.long, item.weight,
            item.space.battlemech, item.shotsPerTon ?? 0]).toEqual([min, short, medium, long, tons, spaces, shots]);
        expect(item.heat).toBe(heatSince[tag] ?? heat);
        if (tag in damage) {
            expect(item.damage).toBe(damage[tag]);
        }
    });
});
