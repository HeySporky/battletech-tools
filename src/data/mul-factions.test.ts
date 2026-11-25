import { describe, expect, it } from "vitest";
import { getMULFactionIDs, getMULFactionLabels } from "../utils/mulUtilities";
import { loadMULListItems } from "./mul-list-items";
import { MUL_FACTIONS } from "./mul-factions";

describe("MUL 2.0 faction list", () => {
    it("has one entry per id and name", () => {
        expect(new Set(MUL_FACTIONS.map((faction) => faction.id)).size).toBe(MUL_FACTIONS.length);
        expect(new Set(MUL_FACTIONS.map((faction) => faction.name)).size).toBe(MUL_FACTIONS.length);
    });

    it("names every faction id the bundled availability data uses", async () => {
        const known = new Set(getMULFactionIDs());
        const used = new Set<number>();
        for (const unit of await loadMULListItems()) {
            for (const entry of unit.Availability ?? []) {
                for (const factionId of entry.FactionIds) used.add(factionId);
            }
        }
        expect(used.size).toBeGreaterThan(0);
        expect([...used].filter((factionId) => !known.has(factionId))).toEqual([]);
    }, 30_000);

    it("uses the MUL 2.0 numbering, which differs from MUL 1.0 from 37 on", () => {
        expect(getMULFactionLabels(34)).toBe("Mercenary");
        expect(getMULFactionLabels(37)).toBe("Pirates");
        expect(getMULFactionLabels(40)).toBe("Republic of the Sphere");
        expect(getMULFactionLabels(48)).toBe("Wolf's Dragoons");
        expect(getMULFactionLabels(76)).toBe("ilClan Wolf");
        expect(getMULFactionLabels(190)).toBe("Jade Falcon Remnant");
        expect(getMULFactionLabels(42)).toBe("");
    });
});
