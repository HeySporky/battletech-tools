import { describe, expect, it } from "vitest";
import { getEngineTableMaker } from "./engine-makers";

// The Engine Table names a maker for every rating: BD p.23 ("Name"), BT2 p.37 ("Manufacturer").
describe("Engine Table makers", () => {
    it("names a maker for all 79 ratings in Battledroids and BattleTech, Second Edition", () => {
        for (const edition of ["battledroids", "battletech-2nd-edition"]) {
            for (let rating = 10; rating <= 400; rating += 5) {
                expect(getEngineTableMaker(edition, rating), `${edition} ${rating}`).toMatch(/^[A-Z]/);
            }
        }
    });

    it("matches the page: the worked example's Pitban 240 and the record listings' engines", () => {
        expect(getEngineTableMaker("battledroids", 240)).toBe("Pitban");
        expect(getEngineTableMaker("battledroids", 10)).toBe("Omni");
        expect(getEngineTableMaker("battledroids", 400)).toBe("LTV");
        // BT2 p.37 record listings: MAD-3R "300 Vlar", TDR-5S "260 Magna".
        expect(getEngineTableMaker("battletech-2nd-edition", 300)).toBe("Vlar");
        expect(getEngineTableMaker("battletech-2nd-edition", 260)).toBe("Magna");
    });

    it("corrects the Nisson misprint: BD at 195, BT2 at 195 and 200", () => {
        expect(getEngineTableMaker("battledroids", 195)).toBe("Nissan");
        expect(getEngineTableMaker("battletech-2nd-edition", 195)).toBe("Nissan");
        expect(getEngineTableMaker("battletech-2nd-edition", 200)).toBe("Nissan");
    });

    // BTM p.88, BTC p.114, BT3 p.44, CRoW p.103, BT4 p.41 print one table of their own.
    const laterEditions = ["battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition"];

    it("names a maker for all 79 ratings in the BattleTech Manual through the Fourth Edition", () => {
        for (const edition of laterEditions) {
            for (let rating = 10; rating <= 400; rating += 5) {
                expect(getEngineTableMaker(edition, rating), `${edition} ${rating}`).toMatch(/^[A-Z]/);
            }
        }
    });

    it("follows the later table where it differs from the 1984 one: 125-155 move up a row", () => {
        const later = [125, 130, 135, 140, 145, 150, 155].map((rating) => getEngineTableMaker("battletech-manual", rating));
        expect(later).toEqual(["Vlar", "Magna", "Hermes", "Leenex", "Omni", "GM", "GM"]);
        const first = [125, 130, 135, 140, 145, 150, 155].map((rating) => getEngineTableMaker("battledroids", rating));
        expect(first).toEqual(["Nissan", "Vlar", "Magna", "Hermes", "Leenex", "Omni", "Nissan"]);
        for (const edition of laterEditions) {
            expect(getEngineTableMaker(edition, 130), edition).toBe("Magna");
            // The later books print "Core Tek"; the 1984 and 1985 books "CoreTek".
            expect(getEngineTableMaker(edition, 215), edition).toBe("Core Tek");
            // BT3 prints VOX at 280; the others "Vox", the same maker.
            expect(getEngineTableMaker(edition, 280), edition).toBe("VOX");
            expect(getEngineTableMaker(edition, 240), edition).toBe("Pitban");
        }
        expect(getEngineTableMaker("battledroids", 215)).toBe("CoreTek");
    });

    it("names none off the table or for an edition whose table names no makers", () => {
        expect(getEngineTableMaker("battledroids", 405)).toBeUndefined();
        expect(getEngineTableMaker("battledroids", 0)).toBeUndefined();
        // The Master Rules tables (MR p.111, MRR p.117) give tonnages only.
        expect(getEngineTableMaker("master-rules", 240)).toBeUndefined();
        expect(getEngineTableMaker("master-rules-revised", 240)).toBeUndefined();
        expect(getEngineTableMaker("total-warfare", 240)).toBeUndefined();
        expect(getEngineTableMaker(undefined, 240)).toBeUndefined();
    });
});
