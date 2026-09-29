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