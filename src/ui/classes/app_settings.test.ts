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
