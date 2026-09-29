import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit } from "../classes/alpha-strike-unit";
import { loadMULListItems } from "../data/mul-list-items";
import { getMULASSearchResults } from "../utils";

// Bundled MUL 2.0 records (masterunitlist.battletech.com) have no Rules, BFThreshold or ImageUrl fields.
describe("Bundled MUL 2.0 search and cards", () => {
    it("finds a 'Mech by name and model with a Rules level selected", async () => {
        const results = await getMULASSearchResults("Atlas AS7-D", "standard", "", "", 0, 0, [], true);
        expect(results.some((unit) => unit.Name === "Atlas" && unit.Variant === "AS7-D")).toBe(true);
    }, 30_000);

    it("builds an Alpha Strike card with the full name, PV and no armor threshold", async () => {
        const atlas = (await loadMULListItems()).find((unit) => unit.Name === "Atlas" && unit.Variant === "AS7-D")!;
        const card = new AlphaStrikeUnit();
        card.importMUL(atlas);

        expect(card.name).toBe("Atlas AS7-D");
        // The printed card shows chassis and model on separate lines.
        expect(card.class).toBe("Atlas");
        expect(card.variant).toBe("AS7-D");
        expect(card.basePoints).toBe(52);
        expect(card.threshold).toBe(0);
        expect(card.move[0].move).toBeGreaterThan(0);
    }, 30_000);
});
