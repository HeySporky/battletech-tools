import { describe, expect, it } from "vitest";
import { filterMULRecords } from "../utils";
import { buildClassicDesignIndex, findClassicDesign, getDesignMULRecord, getDesignsOffMUL, getMULIdKey, getMULMatchKeys, getMULAerospaceClass, getSSWRulesLevel, isMULCapitalShip, isMULLargeAerospaceCraft } from "./classicMULMatch";
import { newMULSearchFilters } from "./mulSearchFilters";

// #614: a saved design carries its own rules level, so the Search Rules filter narrows it like a bundled one.
describe("getSSWRulesLevel", () => {
    const record = (level: number) => getDesignMULRecord({ name: "Goshawk", model: "EI", tons: 35, bv: 0, tech: "Clan", typeId: 18, rulesLevel: getSSWRulesLevel(level) }, "k");

    it("turns the app's Introductory 1 to Experimental 4 into the MUL Rules names", () => {
        expect([1, 2, 3, 4].map((level) => record(level).Rules)).toEqual(["Introductory", "Standard", "Advanced", "Experimental"]);
    });

    it("leaves an ungraded or off-scale level unset, so every Rules choice keeps it", () => {
        expect([0, 5, 6, 7].map((level) => record(level).Rules)).toEqual(["", "", "", ""]);
        expect(filterMULRecords([record(4)], newMULSearchFilters({ rules: "experimental" }))).toHaveLength(1);
        expect(filterMULRecords([record(4)], newMULSearchFilters({ rules: "standard" }))).toHaveLength(0);
    });
});

describe("getMULMatchKeys", () => {
    it("drops quotes, parentheses and HTML entities so MUL and Skunk Werks spellings meet", () => {
        expect(getMULMatchKeys("Catapult", 'CPLT-C1 (Jenny) "Butterbee"')).toEqual(["catapult cplt-c1 jenny butterbee"]);
        expect(getMULMatchKeys("Catapult", "CPLT-C1 (Jenny) &quot;Butterbee&quot;")).toEqual(["catapult cplt-c1 jenny butterbee"]);
        expect(getMULMatchKeys("Stalker", "STK-3F (Jamison)")).toEqual(getMULMatchKeys("Stalker", "STK-3F Jamison"));
    });

    // MegaMek's "Mk I" and 'Warthog' are the MUL's "Mk. I" and "Warthog" (#241).
    it("reads a nickname in single quotes as one in double quotes, and an abbreviation's period as none", () => {
        expect(getMULMatchKeys("Bandit Hovercraft", "'Warthog'")).toEqual(getMULMatchKeys("Bandit Hovercraft", '"Warthog"'));
        expect(getMULMatchKeys("Vedette Medium Tank", "'Doris' Delight'")).toEqual(getMULMatchKeys("Vedette Medium Tank", '"Doris\' Delight"'));
        expect(getMULMatchKeys("Alacorn Heavy Tank", "Mk I")).toEqual(getMULMatchKeys("Alacorn Heavy Tank", "Mk. I"));
        expect(getMULMatchKeys("Hunchback", "HBK-4G")).toEqual(["hunchback hbk-4g"]);
        expect(getMULMatchKeys("Gauss Carrier", "O'Bannon 2.5")).toEqual(["gauss carrier o'bannon 2.5"]);
    });

    it("gives a key for each name of a chassis with an alternate name in parentheses", () => {
        expect(getMULMatchKeys("Mad Cat (Timber Wolf)", "Prime")).toEqual([
            "mad cat timber wolf prime",
            "mad cat prime",
            "timber wolf prime",
        ]);
    });

    it("does not take a configuration word in parentheses for a name", () => {
        // "Koshi (Standard) 2" and "Black Hawk (Standard) 2" are two 'Mechs, not one under the name "Standard".
        expect(getMULMatchKeys("Koshi (Standard)", "2")).toEqual(["koshi standard 2", "koshi 2"]);
        expect(getMULMatchKeys("Hunchback IIC (Omni)", "A")).toEqual(["hunchback iic omni a", "hunchback iic a"]);
    });
});

describe("findClassicDesign", () => {
    const unit = (Name: string, Variant: string) => ({ Name, Variant });

    it("finds a design under either name of the chassis", () => {
        const index = buildClassicDesignIndex([{ chassis: "Timber Wolf", model: "Prime", design: "tw" }]);
        expect(findClassicDesign(unit("Mad Cat (Timber Wolf)", "Prime"), index)).toBe("tw");
    });

    it("prefers the entry given first, so saved designs win over bundled ones", () => {
        const index = buildClassicDesignIndex([
            { chassis: "Atlas", model: "AS7-D", design: "saved" },
            { chassis: "Atlas", model: "AS7-D", design: "bundled" },
        ]);
        expect(findClassicDesign(unit("Atlas", "AS7-D"), index)).toBe("saved");
    });

    it("returns null when no design matches", () => {
        const index = buildClassicDesignIndex([{ chassis: "Atlas", model: "AS7-D", design: "a" }]);
        expect(findClassicDesign(unit("Atlas", "AS7-K"), index)).toBeNull();
    });

    // #241: a bundled design checked against a MUL record that spells it another way is that record's design, listed
    // once beside it rather than again off the MUL.
    it("finds a design by the MUL record it was checked against, and does not list it off the MUL", () => {
        const entries = [{ chassis: "Centurion", model: "CN9-YLW \"Yen Lo Wang\"", design: "ylw", mulId: 103752 }];
        const index = buildClassicDesignIndex(entries);
        expect(findClassicDesign({ ...unit("Centurion", "CN9-YLW \"Yen-lo-wang\""), Id: 103752 }, index)).toBe("ylw");
        const mulKeys = new Set([...getMULMatchKeys("Centurion", "CN9-YLW \"Yen-lo-wang\""), getMULIdKey(103752)]);
        expect(getDesignsOffMUL(entries, index, (key) => mulKeys.has(key))).toEqual([]);
    });
});

describe("isMULLargeAerospaceCraft", () => {
    const unit = (type: { Id: number; Name: string }, tonnage: number, unitType?: string) => ({
        Type: { ...type, Image: null, SortOrder: 0 },
        Tonnage: tonnage,
        ...(unitType ? { Mul1Page: { Fields: { "Unit Type": unitType } } } : {}),
    }) as unknown as Parameters<typeof isMULLargeAerospaceCraft>[0];
    it("tells the live MUL's Aerospace Craft from its Fighter Craft", () => {
        expect(isMULLargeAerospaceCraft(unit({ Id: 17, Name: "Aerospace Craft" }, 200))).toBe(true);
        expect(isMULLargeAerospaceCraft(unit({ Id: 17, Name: "Aerospace Craft" }, 0))).toBe(true);
        expect(isMULLargeAerospaceCraft(unit({ Id: 17, Name: "Fighter Craft" }, 100))).toBe(false);
    });
    it("reads the older MUL's Unit Type, else the tonnage", () => {
        expect(isMULLargeAerospaceCraft(unit({ Id: 17, Name: "Aerospace" }, 0, "Aerospace - Small Craft"))).toBe(true);
        expect(isMULLargeAerospaceCraft(unit({ Id: 17, Name: "Aerospace" }, 50, "Aerospace - Aerospace Fighter"))).toBe(false);
        expect(isMULLargeAerospaceCraft(unit({ Id: 17, Name: "Aerospace" }, 3500))).toBe(true);
        expect(isMULLargeAerospaceCraft(unit({ Id: 17, Name: "Aerospace" }, 75))).toBe(false);
    });
    it("is never true outside type 17", () => {
        expect(isMULLargeAerospaceCraft(unit({ Id: 18, Name: "BattleMech" }, 200))).toBe(false);
    });
});

// The MUL gives every large craft the same type and Alpha Strike type (AF), so the JumpShips, WarShips and stations
// are told from the Small Craft and DropShips by their Alpha Strike move, else by name and tonnage.
describe("isMULCapitalShip", () => {
    const craft = (name: string, tonnage: number, move?: string, typeName = "Aerospace Craft") => ({
        Name: name, Tonnage: tonnage, BFMove: move, Type: { Id: 17, Name: typeName, Image: null, SortOrder: 0 },
    }) as unknown as Parameters<typeof isMULCapitalShip>[0];
    it("reads a spheroid or aerodyne move as a Small Craft or DropShip", () => {
        expect(isMULCapitalShip(craft("Union", 3600, "3p"))).toBe(false);
        expect(isMULCapitalShip(craft("Leopard", 1900, "4a"))).toBe(false);
        expect(isMULCapitalShip(craft("Mammoth", 52000, "3p"))).toBe(false);
        expect(isMULCapitalShip(craft("Castrum Pocket Warship", 100000, "3p"))).toBe(false);
    });
    it("reads station-keeping or a bare thrust as a capital ship", () => {
        expect(isMULCapitalShip(craft("Magellan JumpShip", 175000, "0.2k"))).toBe(true);
        expect(isMULCapitalShip(craft("BattleSat System Defense Station", 2000, "0.2k"))).toBe(true);
        expect(isMULCapitalShip(craft("Essex Destroyer", 620000, "3"))).toBe(true);
        expect(isMULCapitalShip(craft("Tatsumaki Destroyer", 0, "4"))).toBe(true);
    });
    it("falls back on the name, then a tonnage over the 100,000-ton DropShip limit", () => {
        expect(isMULCapitalShip(craft("Clipper JumpShip", 0, "�"))).toBe(true);
        expect(isMULCapitalShip(craft("Small Pressurized Yard", 2500, "�"))).toBe(true);
        expect(isMULCapitalShip(craft("Yamato Battleship", 0))).toBe(true);
        expect(isMULCapitalShip(craft("Capital Drone", 480000, "�"))).toBe(true);
        expect(isMULCapitalShip(craft("Landing Craft", 150, "�"))).toBe(false);
        expect(isMULCapitalShip(craft("Overlord", 11600, "�"))).toBe(false);
    });
    it("knows the capital ships whose names give no class (astech ruling, 2026-10-23)", () => {
        // Bug-Eye: the smallest WarShip class built (IE:ISP3); its bare thrust already says so.
        expect(isMULCapitalShip(craft("Bug-Eye Surveillance Ship", 6100, "5"))).toBe(true);
        expect(isMULCapitalShip(craft("Monitor", 0, "—"))).toBe(true); // XTRO: Boondoggles p.19
        expect(isMULCapitalShip(craft("Leviathan Prime", 0, "—"))).toBe(true); // The Wars of Reaving p.40
        expect(isMULCapitalShip(craft("Bright Star Auto Scout", 60000, "—"))).toBe(true); // XTRO: Boondoggles p.16
        expect(isMULCapitalShip({ ...craft("Spider", 0, "—"), Variant: "Construction Station" } as never)).toBe(true);
        // Stat-less records: the only canon craft of these names are the Scout JumpShip and the League Destroyer.
        expect(isMULCapitalShip(craft("Scout", 0, "—"))).toBe(true);
        expect(isMULCapitalShip(craft("League", 0, "—"))).toBe(true);
        // DropShips and Small Craft with like names stay put.
        expect(isMULCapitalShip(craft("Stork", 0, "—"))).toBe(false); // Handbook: House Marik p.134
        expect(isMULCapitalShip(craft("Argo", 97000, "—"))).toBe(false);
        expect(isMULCapitalShip(craft("Titan Monitor", 15000, "5a"))).toBe(false);
        expect(isMULCapitalShip(craft("Scout Shuttle", 150, "—"))).toBe(false);
    });
    it("is never true for fighters or other types", () => {
        expect(isMULCapitalShip(craft("Goth", 60, "5", "Fighter Craft"))).toBe(false);
        expect(isMULCapitalShip({ ...craft("Atlas", 100, "3"), Type: { Id: 18, Name: "BattleMech" } } as never)).toBe(false);
    });
});

// Issue 322: each MUL aerospace kind gets its own Type filter.
describe("getMULAerospaceClass", () => {
    const craft = (Name: string, Tonnage: number, BFType: string | null, typeName = "Aerospace") =>
        ({ Name, Tonnage, BFType, Type: { Id: 17, Name: typeName, Image: "", SortOrder: 0 } }) as Parameters<typeof getMULAerospaceClass>[0];

    it("reads the Alpha Strike type, aerodyne DropShips counted as DropShips", () => {
        expect(["AF", "CF", "SC", "DS", "DA", "JS", "WS", "SS"].map((bfType) => getMULAerospaceClass(craft("X", 50, bfType))))
            .toEqual(["AF", "CF", "SC", "DS", "DS", "JS", "WS", "SS"]);
    });

    it("falls back on tonnage and name where the MUL has no Alpha Strike stats", () => {
        expect(getMULAerospaceClass(craft("Stuka", 100, null))).toBe("AF");
        expect(getMULAerospaceClass(craft("Conventional Fighter", 20, null))).toBe("CF");
        expect(getMULAerospaceClass(craft("Gunboat", 180, null))).toBe("SC");
        expect(getMULAerospaceClass(craft("Union", 3500, null))).toBe("DS");
        expect(getMULAerospaceClass(craft("Merchant JumpShip", 150000, null))).toBe("JS");
        expect(getMULAerospaceClass(craft("Crucible Station", 0, null, "Aerospace Craft"))).toBe("SS");
        expect(getMULAerospaceClass(craft("Aegis Heavy Cruiser", 750000, null))).toBe("WS");
        expect(getMULAerospaceClass({ ...craft("Atlas", 100, "BM"), Type: { Id: 18, Name: "BattleMech", Image: "", SortOrder: 0 } })).toBeNull();
    });
});
