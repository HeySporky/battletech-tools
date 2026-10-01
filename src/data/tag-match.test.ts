import { describe, expect, it } from "vitest";
import { findByTag, matchesTag } from "./tag-match";
import { getVehicleMotiveType } from "./vehicle-motive-types";
import { isOmniFixedOnly } from "./equipment-registry";
import Vehicle from "../classes/vehicle";

// Every record keeps its historical tags in altTags, so old saves and cross-references still resolve.
describe("Tag lookups use altTags", () => {
    const records = [
        { tag: "new-name", altTags: ["old-name"] },
        { tag: "old-name-2" },
    ];

    it("matches the current tag or any alternate tag, and nothing else", () => {
        expect(matchesTag(records[0], "new-name")).toBe(true);
        expect(matchesTag(records[0], "old-name")).toBe(true);
        expect(matchesTag(records[0], "other")).toBe(false);
        expect(matchesTag(records[0], "")).toBe(false);
        expect(matchesTag(records[0], 5)).toBe(false);
        expect(matchesTag({ tag: "x", altTags: "x" as never }, "y")).toBe(false);
        expect(matchesTag(null, "new-name")).toBe(false);
    });

    it("finds by alternate tag, preferring a record whose current tag matches", () => {
        expect(findByTag(records, "old-name")).toBe(records[0]);
        expect(findByTag([{ tag: "a", altTags: ["b"] }, { tag: "b" }], "b")?.tag).toBe("b");
        expect(findByTag(records, undefined)).toBeUndefined();
    });

    it("resolves motive types and Omni-fixed equipment through alternate tags", () => {
        expect(getVehicleMotiveType("hover").tag).toBe("hover");
        expect(isOmniFixedOnly({ tag: "renamed-masc", altTags: ["masc"] } as never)).toBe(true);
    });

    it("keeps equipment saved under an old tag when a vehicle is imported (N2)", () => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag("prototype-gauss-rifle-3038");
        expect(vehicle.getEquipmentList().map((item) => item.tag)).toEqual(["prototype-gauss-rifle"]);

        const save = JSON.parse(vehicle.exportJSON());
        save.equipment[0].tag = "prototype-gauss-rifle-3038";
        const copy = new Vehicle(JSON.stringify(save));
        expect(copy.getEquipmentList().map((item) => item.tag)).toEqual(["prototype-gauss-rifle"]);
        expect(copy.getImportIssues()).toEqual([]);
    });
});
