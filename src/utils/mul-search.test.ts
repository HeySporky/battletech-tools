import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit } from "../classes/alpha-strike-unit";
import { loadMULListItems } from "../data/mul-list-items";
import { getMULASSearchResults, searchBundledMUL } from "../utils";
import { newMULSearchFilters } from "./mulSearchFilters";

// Bundled MUL 2.0 records (masterunitlist.battletech.com) take their Rules level from the legacy record they
// replaced (#48).
describe("Bundled MUL 2.0 search and cards", () => {
    it("finds a 'Mech by name and model at its Rules level, and not at another", async () => {
        const isAtlas = (unit: { Name: string; Variant: string | null }) => unit.Name === "Atlas" && unit.Variant === "AS7-D";
        expect((await getMULASSearchResults("Atlas AS7-D", "intro+standard", "", "", 0, 0, [], true)).some(isAtlas)).toBe(true);
        expect((await getMULASSearchResults("Atlas AS7-D", "advanced", "", "", 0, 0, [], true)).some(isAtlas)).toBe(false);
    }, 30_000);

    it("filters by special ability code, with exclusions", async () => {
        const results = await getMULASSearchResults("", "", "", "", 0, 0, [], true, false, null, ["ECM", "!IF"]);
        expect(results.length).toBeGreaterThan(100);
        for (const unit of results) {
            const codes = (unit.BFAbilities ?? "").split(",").map((ability) => ability.trim());
            expect(codes).toContain("ECM");
            expect(codes.some((ability) => /^IF\s?[\d*]/.test(ability))).toBe(false);
        }
    }, 30_000);

    // Classic Roster MUL search (Ideas #84): the same filters over the bundled copy, with no live-search alert.
    it("searches the bundled copy with name, type, era and faction filters together", async () => {
        const ilClan = 257;
        const mercenary = 34;
        const results = await searchBundledMUL(newMULSearchFilters({ term: "Atlas", type: 18, era: ilClan, factions: [mercenary] }));
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((unit) => unit.Name.includes("Atlas") && unit.Type?.Id === 18)).toBe(true);
        expect(results.every((unit) => unit.Availability?.some((entry) => entry.EraId === ilClan))).toBe(true);
        const sameAsAlphaStrike = await getMULASSearchResults("Atlas", "", "", "", ilClan, 18, [mercenary], true);
        expect(results.map((unit) => unit.Id).sort()).toEqual(sameAsAlphaStrike.map((unit) => unit.Id).sort());
    }, 30_000);

    it("leaves out the Clan units and ProtoMechs a ticked ruleset removes (#324)", async () => {
        const all = await searchBundledMUL(newMULSearchFilters({ term: "Timber Wolf", type: 0 }));
        expect(all.some((unit) => unit.Technology?.Id === 2)).toBe(true);
        expect(await searchBundledMUL(newMULSearchFilters({ term: "Timber Wolf", type: 0, rulesets: ["sample-no-clans"] }))).toEqual([]);
        expect((await searchBundledMUL(newMULSearchFilters({ type: 23 }))).length).toBeGreaterThan(0);
        expect(await searchBundledMUL(newMULSearchFilters({ type: 23, rulesets: ["sample-no-clans"] }))).toEqual([]);
    }, 30_000);

    it("does not match an ability code inside a longer code", async () => {
        const results = await getMULASSearchResults("a:ECM", "", "", "", 0, 0, [], true);
        expect(results.every((unit) => (unit.BFAbilities ?? "").split(",").some((ability) => ability.trim() === "ECM"))).toBe(true);
    }, 30_000);

    // Issue #119: Era ilClan + Mercenary listed only the units introduced in the ilClan era.
    it("filters by the eras and factions a unit is available to, not its introduction era", async () => {
        const ilClan = 257;
        const mercenary = 34;
        const inEra = await getMULASSearchResults("", "", "", "", ilClan, 0, [], true);
        expect(inEra.length).toBeGreaterThan(1000);
        expect(inEra.every((unit) => unit.Availability?.some((entry) => entry.EraId === ilClan))).toBe(true);
        expect(inEra.some((unit) => unit.EraId !== ilClan)).toBe(true);

        const mercs = await getMULASSearchResults("", "", "", "", ilClan, 0, [mercenary], true);
        expect(mercs.length).toBeGreaterThan(1000);
        expect(mercs.length).toBeLessThan(inEra.length);
        expect(mercs.every((unit) => unit.Availability?.some((entry) =>
            entry.EraId === ilClan && entry.FactionIds.includes(mercenary)))).toBe(true);
    }, 30_000);

    it("reads MUL 2.0 faction ids as the MUL 1.0 ids the faction picker uses", async () => {
        const pirates = 38;
        const ids = new Set((await loadMULListItems()).flatMap((unit) =>
            (unit.Availability ?? []).flatMap((entry) => entry.FactionIds)));
        expect(ids.has(pirates)).toBe(true);
        // MUL 2.0's own Pirates id is 37, which MUL 1.0 never used.
        expect(ids.has(37)).toBe(false);
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
