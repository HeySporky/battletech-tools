import { describe, expect, it } from "vitest";
import { AppSettings } from "./app_settings";

describe("AppSettings MUL search cache", () => {
    it("does not restore or persist deployment-backed search results", () => {
        const staleUnit = { Id: 1, Name: "Stale Unit" };
        const settings = new AppSettings({
            alphasStrikeCachedSearchResults: [staleUnit],
        } as never);

        expect(settings.alphasStrikeCachedSearchResults).toEqual([]);

        settings.alphasStrikeCachedSearchResults = [staleUnit] as never;
        expect(settings.export()).not.toHaveProperty("alphasStrikeCachedSearchResults");
    });
});
describe("AppSettings special ability filter", () => {
    it("persists the selected abilities and ignores anything that is not a string", () => {
        const settings = new AppSettings({ alphaStrikeSearchAbilities: ["ECM", "!IF", 3] } as never);
        expect(settings.alphaStrikeSearchAbilities).toEqual(["ECM", "!IF"]);
        expect(settings.export().alphaStrikeSearchAbilities).toEqual(["ECM", "!IF"]);
    });

    it("defaults to no ability filter for older saved settings", () => {
        expect(new AppSettings({} as never).alphaStrikeSearchAbilities).toEqual([]);
    });
});
describe("AppSettings MUL search rulesets (#324 round 4)", () => {
    it("an older Classic search with no rulesets loads none", () => {
        expect(new AppSettings({ cbtMULSearch: { term: "atlas" } } as never).cbtMULSearch.rulesets).toEqual([]);
    });

    it("a Classic search's rulesets that are not a list of strings are dropped", () => {
        expect(new AppSettings({ cbtMULSearch: { rulesets: "sample-no-clans" } } as never).cbtMULSearch.rulesets).toEqual([]);
        expect(new AppSettings({ cbtMULSearch: { rulesets: ["sample-no-clans", 3] } } as never).cbtMULSearch.rulesets).toEqual(["sample-no-clans"]);
    });

    it("a stored Alpha Strike Tech filter that is not text loads as All", () => {
        expect(new AppSettings({ alphaStrikeSearchTech: null } as never).alphaStrikeSearchTech).toBe("");
    });

    it("the Alpha Strike search's rulesets round-trip and default to none", () => {
        expect(new AppSettings({} as never).alphaStrikeSearchRulesets).toEqual([]);
        const settings = new AppSettings({ alphaStrikeSearchRulesets: ["sample-no-clans", 3] } as never);
        expect(settings.alphaStrikeSearchRulesets).toEqual(["sample-no-clans"]);
        expect(settings.export().alphaStrikeSearchRulesets).toEqual(["sample-no-clans"]);
    });
});
