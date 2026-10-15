import { describe, expect, it } from "vitest";
import { getLegacyMULFactionID, getMULSourcesForSelection, loadMULListItems } from "./mul-list-items";
import { getMULFactionIDs, getMULFactionLabels } from "../utils/mulUtilities";

describe("MUL chunk loader", () => {
    it("serves only current MUL 2.0 records by default", async () => {
        const items = await loadMULListItems();

        expect(items.length).toBeGreaterThan(0);
        expect(items.every((item) => item.MulSource === "mul2" && item.MulUnitKey)).toBe(true);
        expect(items.some((item) => item.Name?.trim() === "AA Jump Infantry")).toBe(true);
        expect(items.some((item) => "Title" in item)).toBe(false);

        const blackKnight = items.find((item) => item.MulUnitKey === "000RM4HYJ9");
        expect(blackKnight?.Role.Name).toBe("Brawler");
        expect(blackKnight?.Type).toMatchObject({ Id: 18, Name: "BattleMech" });
        expect(blackKnight?.EraId).toBe(11);
    }, 30_000);

    it("adds MUL 1.0 leftovers only when selected, one record per legacy id", async () => {
        const items = await loadMULListItems("mul2+mul1");
        const legacy = items.filter((item) => item.MulSource === "mul1");

        expect(legacy.length).toBeGreaterThan(0);
        expect(legacy.some((item) => item.Id === 4800 && item.Name === "Pendragon PDG-2R")).toBe(true);
        expect(new Set(legacy.map((item) => item.Id)).size).toBe(legacy.length);
        expect(items.length).toBe((await loadMULListItems("mul2")).length + legacy.length);
    }, 30_000);

    // MUL 2.0 renumbered factions from id 37 up (masterunitlist.battletech.com /data/factions.json).
    it("maps MUL 2.0 faction ids to the legacy MUL 1.0 faction taxonomy", async () => {
        expect(getLegacyMULFactionID(37)).toBe(38); // Pirates
        expect(getLegacyMULFactionID(68)).toBe(87); // Terran Hegemony
        expect(getLegacyMULFactionID(74)).toBe(94); // Star League in Exile
        expect(getLegacyMULFactionID(20)).toBe(20); // Clan Smoke Jaguar, unchanged below 37
        expect(getMULFactionLabels(getLegacyMULFactionID(190))).toBe("Jade Falcon Remnant");

        const items = await loadMULListItems();
        const labelled = new Set(getMULFactionIDs());
        const unlabelled = new Set<number>();
        for (const item of items) {
            for (const entry of item.Availability ?? []) {
                entry.FactionIds.filter((id) => !labelled.has(id)).forEach((id) => unlabelled.add(id));
            }
        }
        expect([...unlabelled]).toEqual([]);

        // The site lists the Mackie MSK-7A for the Terran Hegemony (AoW, SL), Rim Worlds Republic (SL) and
        // Star League in Exile, Smoke Jaguar and Steel Viper (Early Succession War).
        const mackie = items.find((item) => item.Name === "Mackie" && item.Variant === "MSK-7A");
        const names = (mackie?.Availability ?? []).map((entry) => entry.FactionIds.map(getMULFactionLabels).sort());
        expect(names).toEqual([
            ["Terran Hegemony"],
            ["Rim Worlds Republic", "Terran Hegemony"],
            ["Clan Smoke Jaguar", "Clan Steel Viper", "Star League in Exile"],
        ]);
    }, 30_000);

    it("expands each selection to a superset of the previous one", () => {
        expect(getMULSourcesForSelection("mul2")).toEqual(["mul2"]);
        expect(getMULSourcesForSelection("mul2+mul1")).toEqual(["mul2", "mul1"]);
    });
});
