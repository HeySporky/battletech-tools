import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit } from "../classes/alpha-strike-unit";
import { loadMULListItems } from "../data/mul-list-items";
import { getMULASSearchResults } from "../utils";

// Bundled MUL 2.0 records (masterunitlist.battletech.com) have no Rules, BFThreshold or ImageUrl fields.
describe("Bundled MUL 2.0 search and cards", () => {
    it("finds a 'Mech by name and model with a Rules level selected", async () => {
        const results = await getMULASSearchResults("Atlas AS7-D", "standard", "", "", 0, 0, [], true);
        expect(results.some((unit) => unit.Name === "Atlas" && unit.Variant === "AS7-D")).toBe(true);
    }, 30_000);

    it("builds an Alpha Strike card with the full name, PV and no armor threshold", async () => {
        const atlas = (await loadMULListItems()).find((unit) => unit.Name === "Atlas" && unit.Variant === "AS7-D")!;
        const card = new AlphaStrikeUnit();
        card.importMUL(atlas);

        expect(card.name).toBe("Atlas AS7-D");
        // The printed card shows chassis and model on separate lines.
        expect(card.class).toBe("Atlas");
        expect(card.variant).toBe("AS7-D");
        expect(card.basePoints).toBe(52);
        expect(card.threshold).toBe(0);
        expect(card.move[0].move).toBeGreaterThan(0);
    }, 30_000);
});

// The Era filter matches the eras a unit is available in (its Availability list), not only the era it
// was introduced in. Only four bundled units were introduced in the ilClan era (id 257).
describe("Bundled MUL search: Era filter", () => {
    const ILCLAN = 257;

    it("finds units available in the ilClan era that were introduced earlier", async () => {
        const results = await getMULASSearchResults("Atlas", "", "", "", ILCLAN, 0, [], true);
        expect(results.length).toBeGreaterThan(1);
        expect(results.some((unit) => unit.EraId !== ILCLAN)).toBe(true);
        expect(results.every((unit) => unit.Availability?.some((entry) => entry.EraId === ILCLAN))).toBe(true);
    }, 30_000);

    it("returns more than the four units introduced in the ilClan era", async () => {
        const results = await getMULASSearchResults("", "", "", "", ILCLAN, 0, [], true, true);
        expect(results.length).toBeGreaterThan(1000);
    }, 30_000);

    it("leaves out units that are not available in the selected era", async () => {
        // The Black Knight BL-6-KNT is available from the Early Succession War on, not in the Star League era (10).
        const results = await getMULASSearchResults("Black Knight", "", "", "", 10, 0, [], true);
        expect(results.some((unit) => unit.MulUnitKey === "000RM4HYJ9")).toBe(false);
    }, 30_000);
});

// Faction ids are MUL 2.0 ids (src/data/mul-factions.ts). Several selected factions combine with OR.
describe("Bundled MUL search: Faction filter", () => {
    const ILCLAN = 257;
    const MERCENARY = 34;
    const PIRATES = 37;
    const REPUBLIC_OF_THE_SPHERE = 40;

    const availableTo = (unit: { Availability?: { EraId: number; FactionIds: number[] }[] }, factions: number[], era = 0) =>
        (unit.Availability ?? []).some((entry) =>
            (!era || entry.EraId === era) && entry.FactionIds.some((factionId) => factions.includes(factionId)));

    it("finds Mercenary units in the ilClan era (issue #119)", async () => {
        const results = await getMULASSearchResults("", "", "", "", ILCLAN, 0, [MERCENARY], true, true);
        expect(results.length).toBeGreaterThan(100);
        expect(results.every((unit) => availableTo(unit, [MERCENARY], ILCLAN))).toBe(true);
    }, 30_000);

    it("narrows the results to the selected faction", async () => {
        const all = await getMULASSearchResults("", "", "", "", ILCLAN, 0, [], true, true);
        const pirates = await getMULASSearchResults("", "", "", "", ILCLAN, 0, [PIRATES], true, true);
        expect(pirates.length).toBeGreaterThan(0);
        expect(pirates.length).toBeLessThan(all.length);
        expect(pirates.every((unit) => availableTo(unit, [PIRATES], ILCLAN))).toBe(true);
    }, 30_000);

    it("combines several factions with OR", async () => {
        const pirates = await getMULASSearchResults("", "", "", "", ILCLAN, 0, [PIRATES], true, true);
        const republic = await getMULASSearchResults("", "", "", "", ILCLAN, 0, [REPUBLIC_OF_THE_SPHERE], true, true);
        const either = await getMULASSearchResults("", "", "", "", ILCLAN, 0, [PIRATES, REPUBLIC_OF_THE_SPHERE], true, true);
        expect(either.length).toBeGreaterThanOrEqual(Math.max(pirates.length, republic.length));
        expect(either.every((unit) => availableTo(unit, [PIRATES, REPUBLIC_OF_THE_SPHERE], ILCLAN))).toBe(true);
    }, 30_000);

    it("matches a faction in any era when no era is selected", async () => {
        const results = await getMULASSearchResults("", "", "", "", 0, 0, [PIRATES], true, true);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((unit) => availableTo(unit, [PIRATES]))).toBe(true);
    }, 30_000);
});
