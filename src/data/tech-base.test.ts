import { describe, expect, it } from "vitest";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";

// Catalog rework (project decision, 2026-10-06): catalogs are being regrouped by category, with Inner Sphere, Clan
// and universal entries in the same file. A record can then no longer take its tech base from the file it is in,
// so every record states it, and the registry reads it from the record (tech-lists.test.ts keeps the lists).
describe("Equipment tech base", () => {
    const definitions = getEquipmentCatalogDefinitions();

    it("is stated on every bundled equipment and ammunition record", () => {
        const missing = definitions.flatMap(definition => definition.equipment
            .filter(item => !["is", "clan", "universal"].includes(item.techBase as string))
            .map(item => `${definition.id}: ${item.tag}`));
        expect(missing).toEqual([]);
    });

    it("covers every catalog", () => {
        expect(definitions.length).toBeGreaterThan(0);
        expect(definitions.every(definition => definition.equipment.length > 0 || definition.custom)).toBe(true);
    });
});
