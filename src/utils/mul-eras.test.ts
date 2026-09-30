import { describe, expect, it } from "vitest";
import { getMULEraAliases, getMULEraIDs, getMULEraLabel, mulEras, resolveMULEraFilter } from "./mulUtilities";

describe("Master Unit List eras", () => {
    it("keeps the MUL's own Age of War start (2005), not the Classic 2300", () => {
        expect(mulEras.find((era) => era.id === 1)).toMatchObject({ label: "Age of War", yearStart: 2005 });
        expect(getMULEraIDs()[0]).toBe(1);
    });

    it("passes MUL era IDs through unchanged", () => {
        for (const id of getMULEraIDs()) {
            expect(resolveMULEraFilter(id)).toBe(id);
        }
        expect(resolveMULEraFilter(0)).toBe(0);
    });

    it("searches each Clan era under the MUL era holding most of its years", () => {
        const byLabel = Object.fromEntries(getMULEraAliases().map((alias) => [alias.label.split(" (")[0], alias]));
        // Founding Years 2800-2840: Early Succession War (2781-2900).
        expect(resolveMULEraFilter(byLabel["Clan Founding Years"].id)).toBe(11);
        // Golden Years 2841-3049: mostly Late Succession War - LosTech (2901-3019).
        expect(resolveMULEraFilter(byLabel["Clan Golden Years"].id)).toBe(255);
        // Post-Reaving 3086-3150: mostly Late Republic (3101-3130).
        expect(resolveMULEraFilter(byLabel["Clan Post-Reaving"].id)).toBe(254);
    });

    it("never collides an alias with a MUL era ID", () => {
        const mulIds = new Set(getMULEraIDs());
        for (const alias of getMULEraAliases()) {
            expect(mulIds.has(alias.id)).toBe(false);
            expect(getMULEraLabel(alias.id)).toBe(alias.label);
        }
    });
});
