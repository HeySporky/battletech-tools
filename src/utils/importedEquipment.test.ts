import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { getEquipmentCatalogDefinitions } from "../data/equipment-registry";
import { sswMechs } from "../data/ssw/sswMechs";
import { findCatalogMatches, findImportedEquipment } from "./importedEquipment";

describe("findImportedEquipment", () => {
    it("matches a record by its own name or tag before any alias", () => {
        expect(findImportedEquipment("Medium Laser", "is")?.item.tag).toBe("medium-laser");
        expect(findImportedEquipment("medium-laser", "is")?.catalog).toBe("is");
    });

    it("matches another tool's spelling through altNames", () => {
        // SSW writes launcher sizes with a hyphen; the records list that spelling in altNames.
        expect(findImportedEquipment("LRM-10", "is")?.item.name).toBe("LRM 10");
        expect(findImportedEquipment("Ammo (SRM-6)", "is")?.item.isAmmo).toBe(true);
    });

    it("looks in the faction's catalog, so a Clan design's plain names mean Clan equipment", () => {
        const match = findImportedEquipment("LRM-10", "clan");
        expect(match?.catalog).toBe("clan");
        // Not the Star League (Clan-built) launcher that once carried the "LRM-10" alias.
        expect(match?.item.tag).toBe("clan-lrm-10");
        expect(findImportedEquipment("Streak LRM-10", "clan")?.item.tag).toBe("streak-lrm-10");
    });

    it("checks the universal catalog before the faction's aliases", () => {
        // Universal records are listed in the Clan files too; they resolve to the universal record.
        expect(findImportedEquipment("Fluid Gun", "clan")?.catalog).toBe("universal");
        expect(findImportedEquipment("Thumper", "clan")?.item.tag).toBe("thumper-artillery");
    });

    it("falls back to the other faction only for Mixed Tech designs", () => {
        // IO p. 95: the Enhanced ER PPC is Clan tech; SSW files some mixed designs' copies as Inner Sphere.
        expect(findImportedEquipment("Enhanced ER PPC", "is")).toBeNull();
        expect(findImportedEquipment("Enhanced ER PPC", "is", true)?.catalog).toBe("clan");
    });

    it("returns null for a name no catalog lists", () => {
        expect(findImportedEquipment("Not A Real Weapon", "is", true)).toBeNull();
    });

    it("finds a record by any of its identifiers, case-insensitively", () => {
        expect(findCatalogMatches("lrm 10", "is")[0]?.tag).toBe("lrm-10");
        expect(findCatalogMatches("Rivet Gun", "universal")[0]?.tag).toBe("nail-gun");
        expect(findCatalogMatches("Rivet Gun", "universal", true)).toEqual([]);
    });
});

describe("equipment catalogs", () => {
    // Within one catalog, an identifier must mean one record, or an import picks whichever is listed first.
    it("gives no two records in a catalog the same name or tag", () => {
        const duplicates: string[] = [];
        for (const definition of getEquipmentCatalogDefinitions()) {
            const seen = new Map<string, string>();
            for (const item of definition.equipment) {
                for (const identifier of [item.name, item.tag]) {
                    const key = identifier.toLowerCase();
                    const other = seen.get(key);
                    if (other !== undefined && other !== item.tag) {
                        duplicates.push(`${definition.techBase}: "${identifier}" (${other}, ${item.tag})`);
                    }
                    seen.set(key, item.tag);
                }
            }
        }
        expect(duplicates).toEqual([]);
    });
});

describe("SSW import", () => {
    // New spellings go in the records' altNames; this list only shrinks as missing canon records are added.
    it("resolves every item of the bundled SSW designs except known missing records", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
        const unresolved = new Set<string>();
        for (const xml of sswMechs) {
            const mech = new BattleMech();
            mech.importSSWXML(xml);
            for (const error of mech.sswImportErrors.filter((e) => e.startsWith("Cannot find"))) {
                unresolved.add(error);
            }
        }
        expect([...unresolved].sort()).toEqual([
            "Cannot find any equipment named: 'Collapsible Command Module (CCM)'",
            "Cannot find any equipment named: 'Communications Equipment'",
            "Cannot find any equipment named: 'Electronic Warfare Equipment'",
        ]);
        vi.restoreAllMocks();
    }, 120_000);
});
