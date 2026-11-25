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
describe("AppSettings Alpha Strike faction filter", () => {
    it("drops faction selections saved with MUL 1.0 ids", () => {
        // 38 was Pirates in MUL 1.0 but is Raven Alliance in MUL 2.0.
        const settings = new AppSettings({ alphaStrikeSearchFactions: [38] } as never);
        expect(settings.alphaStrikeSearchFactions).toEqual([]);
    });

    it("keeps faction selections saved with MUL 2.0 ids and saves the numbering with them", () => {
        const settings = new AppSettings({ alphaStrikeSearchFactions: [37], alphaStrikeSearchFactionIds: "mul2" } as never);
        expect(settings.alphaStrikeSearchFactions).toEqual([37]);
        expect(settings.export()).toMatchObject({ alphaStrikeSearchFactions: [37], alphaStrikeSearchFactionIds: "mul2" });
    });
});
