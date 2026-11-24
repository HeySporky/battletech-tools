import { describe, expect, it } from "vitest";
// The weekly MUL sync's lookup tables (#32, #33), kept apart from the script so they can be tested.
import { bfTypeOf, fillFromLegacy, legacyFillByLiveKey, legacyEraIdOf, subTypeIdOfSummaryHash, takeThreshold } from "../../tools/mul-sync/mul-mappings.mjs";

describe("MUL sync: Alpha Strike unit type from the live type and sub-type", () => {
    it("gives each large aerospace craft its own type, not the fighter's AF", () => {
        expect(bfTypeOf("Aerospace Craft", 46)).toBe("DS"); // Spheroid DropShip
        expect(bfTypeOf("Aerospace Craft", 14)).toBe("DA"); // Aerodyne DropShip
        expect(bfTypeOf("Aerospace Craft", 26)).toBe("SC"); // Small Craft
        expect(bfTypeOf("Aerospace Craft", 33)).toBe("JS"); // JumpShip
        expect(bfTypeOf("Aerospace Craft", 29)).toBe("WS"); // WarShip
        expect(bfTypeOf("Aerospace Craft", 31)).toBe("SS"); // Space Station
    });

    it("tells conventional fighters from aerospace fighters", () => {
        expect(bfTypeOf("Fighter Craft", 5)).toBe("CF");
        expect(bfTypeOf("Fighter Craft", 1)).toBe("AF");
        expect(bfTypeOf("Fighter Craft", 18)).toBe("AF"); // OmniFighter
    });

    it("keeps the type-wide value for the other types", () => {
        expect(bfTypeOf("BattleMech", 4)).toBe("BM");
        expect(bfTypeOf("Combat Vehicle", 22)).toBe("CV");
        expect(bfTypeOf("Support Vehicle", 51)).toBe("SV");
        expect(bfTypeOf("Battle Armor", 3)).toBe("BA");
        expect(bfTypeOf("Advanced Support", 30)).toBe("SV"); // Large Naval Support
        expect(bfTypeOf("Unknown", undefined)).toBeNull();
    });

    it("types mobile structures MS and buildings CV, never the conventional fighter's CF", () => {
        expect(bfTypeOf("Advanced Support", 35)).toBe("MS");
        expect(bfTypeOf("Buildings", 38)).toBe("CV"); // Fortress
        expect(bfTypeOf("Buildings", 37)).toBe("CV"); // Gun Emplacement
    });

    it("reads the sub-type back out of a stored record's summary hash", () => {
        expect(subTypeIdOfSummaryHash('["Overlord","(Vehicle)",10,46,1,1,9700,69,0,2775,2,[],1]')).toBe(46);
        expect(subTypeIdOfSummaryHash("not json")).toBeUndefined();
    });
});

describe("MUL sync: live era ids to the app's era ids", () => {
    it("maps every live era by name", () => {
        expect(legacyEraIdOf(1)).toBe(1); // Age of War
        expect(legacyEraIdOf(2)).toBe(10); // Star League
        expect(legacyEraIdOf(4)).toBe(13); // Clan Invasion
        expect(legacyEraIdOf(8)).toBe(247); // Civil War
        expect(legacyEraIdOf(10)).toBe(254); // Late Republic
        expect(legacyEraIdOf(13)).toBe(257); // ilClan
    });

    it("gives no era for an id the live site has never used, instead of passing it through", () => {
        expect(legacyEraIdOf(9)).toBeUndefined();
        expect(legacyEraIdOf(undefined)).toBeUndefined();
    });
});

// MUL 2.0 records arrived without BFThreshold, Rules or ImageUrl (#48).
describe("MUL sync: armor threshold", () => {
    it("moves the live site's TH ability into BFThreshold, as the old MUL stored it", () => {
        const record: Record<string, unknown> = { BFAbilities: "TH 3,BOMB 2,FUEL 20,REAR 2/2/-,SPC,VSTOL" };
        expect(takeThreshold(record)).toBe(true);
        expect(record).toEqual({ BFAbilities: "BOMB 2,FUEL 20,REAR 2/2/-,SPC,VSTOL", BFThreshold: 3 });
    });

    it("gives a unit with no TH a threshold of 0, and leaves a done record alone", () => {
        const mech: Record<string, unknown> = { BFAbilities: "ENE" };
        expect(takeThreshold(mech)).toBe(true);
        expect(mech).toEqual({ BFAbilities: "ENE", BFThreshold: 0 });
        expect(takeThreshold(mech)).toBe(false);
        const onlyThreshold: Record<string, unknown> = { BFAbilities: "TH 1" };
        takeThreshold(onlyThreshold);
        expect(onlyThreshold).toEqual({ BFAbilities: "", BFThreshold: 1 });
    });
});

describe("MUL sync: rules level, TRO and image from the replaced legacy record", () => {
    const archive = [
        { replacedBy: "KEY1", record: { Rules: null, TRO: "", ImageUrl: "" } },
        { replacedBy: "KEY1", record: { Rules: "Unknown", TRO: "TR:3039", ImageUrl: "https://i.ibb.co/x/a.png" } },
        { replacedBy: "KEY1", record: { Rules: "Advanced", TRO: "TR:3050", ImageUrl: "https://i.ibb.co/x/b.png" } },
        { replacedBy: "KEY2", record: { Rules: "Standard" } },
        { record: { Rules: "Standard" } },
    ];

    it("takes each field from the first legacy copy that has it, skipping an Unknown rules level", () => {
        const fills = legacyFillByLiveKey(archive);
        expect(fills.get("KEY1")).toEqual({ Rules: "Advanced", TRO: "TR:3039", ImageUrl: "https://i.ibb.co/x/a.png" });
        expect(fills.get("KEY2")).toEqual({ Rules: "Standard" });
        expect(fills.size).toBe(2);
    });

    it("fills only what the live record lacks", () => {
        const record: Record<string, unknown> = { ImageUrl: "https://masterunitlist.battletech.com/point-backs/unit-art/x.webp" };
        expect(fillFromLegacy(record, { Rules: "Advanced", TRO: "TR:3039", ImageUrl: "https://i.ibb.co/x/a.png" })).toBe(true);
        expect(record).toEqual({ Rules: "Advanced", TRO: "TR:3039", ImageUrl: "https://masterunitlist.battletech.com/point-backs/unit-art/x.webp" });
        expect(fillFromLegacy(record, { Rules: "Standard" })).toBe(false);
        expect(fillFromLegacy(record, undefined)).toBe(false);
    });
});
