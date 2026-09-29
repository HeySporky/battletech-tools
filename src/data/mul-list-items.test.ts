import { describe, expect, it } from "vitest";
import { getMULSourcesForSelection, loadMULListItems } from "./mul-list-items";

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

    it("expands each selection to a superset of the previous one", () => {
        expect(getMULSourcesForSelection("mul2")).toEqual(["mul2"]);
        expect(getMULSourcesForSelection("mul2+mul1")).toEqual(["mul2", "mul1"]);
    });
});
