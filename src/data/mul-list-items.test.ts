import { describe, expect, it } from "vitest";
import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { getMULSourcesForSelection, loadMULListItems, stripRoleFromAbilities } from "./mul-list-items";

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

// MUL 2.0 records end BFAbilities with the unit's role, which is not a special ability.
describe("MUL 2.0 abilities", () => {
    it("removes the trailing role from the bundled abilities", async () => {
        const items = await loadMULListItems();
        const atlas = items.find((item) => item.Name === "Atlas" && item.Variant === "AS7-D")!;
        expect(atlas.Role.Name).toBe("Juggernaut");
        expect(atlas.BFAbilities).toBe("AC 2/2/-,IF 1,LRM 1/1/1,REAR 1/1/-");

        const endsWithRole = items.filter((item) =>
            item.BFAbilities && item.BFAbilities.split(",").pop()!.trim() === item.Role?.Name);
        expect(endsWithRole.map((item) => `${item.Name} ${item.Variant}`)).toEqual([]);
    }, 30_000);

    it("leaves no abilities when the role was the only entry, and keeps abilities that are not the role", () => {
        const unit = (abilities: string, role: string) =>
            ({ BFAbilities: abilities, Role: { Id: 0, Name: role, Image: null, SortOrder: 0 } }) as unknown as IASMULUnit;
        expect(stripRoleFromAbilities(unit("None", "None")).BFAbilities).toBeNull();
        expect(stripRoleFromAbilities(unit("TH 2,None", "None")).BFAbilities).toBe("TH 2");
        expect(stripRoleFromAbilities(unit("ENE,CASE", "Striker")).BFAbilities).toBe("ENE,CASE");
    });
});
