import { describe, expect, it } from "vitest";
import { formatRecordEditions, getCatalogHeading, getEditorCatalogId } from "./equipment-editor";

describe("formatRecordEditions", () => {
    it("names each edition with the record's rules level in it", () => {
        expect(formatRecordEditions({ editions: ["total-warfare"], rulesLevel: 3 })).toBe("Total Warfare (Advanced)");
    });

    it("says a record with no editions was never canon", () => {
        expect(formatRecordEditions({ editions: [] })).toBe("Never canon");
    });
});

describe("equipment editor catalogs", () => {
    // Final review finding: an id remembered from before the catalogs merged kept the deleted file's name.
    it("opens the default catalog when the remembered one no longer exists", () => {
        expect(getEditorCatalogId("mech-is-equipment-weapons-ballistic")).toBe("equipment-ballistic");
        expect(getEditorCatalogId(undefined)).toBe("equipment-ballistic");
        expect(getEditorCatalogId("ammo")).toBe("ammo");
    });

    it("heads each catalog with its registry category and tech base", () => {
        expect(getCatalogHeading("equipment-missile")).toEqual({ techBase: "Inner Sphere, Clan and Universal", category: "Missile Weapons" });
        expect(getCatalogHeading("ammo-custom")).toEqual({ techBase: "Custom", category: "Ammunition" });
    });
});
