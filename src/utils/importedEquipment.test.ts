import { describe, expect, it } from "vitest";
import { IEquipmentItem } from "../data/data-interfaces";
import { getEquipmentCatalogDefinitions, getEquipmentTier } from "../data/equipment-registry";
import { findCatalogMatches, findImportedEquipment } from "./importedEquipment";

describe("findImportedEquipment", () => {
    it("matches a record by its own name or tag before any alias", () => {
        expect(findImportedEquipment("Medium Laser", "is")?.item.tag).toBe("medium-laser");
        expect(findImportedEquipment("medium-laser", "is")?.catalog).toBe("is");
    });

    it("reads SSW's Narc-capable SRM ammo on a Clan design as the Clan round (Stormcrow, Summoner, Warhawk)", () => {
        for (const size of [2, 4, 6]) {
            const match = findImportedEquipment(`Ammo (SRM-${size} (Narc Capable))`, "clan");
            expect(match?.item.tag).toBe("ammo-clan-srm-narc");
            expect(match?.catalog).toBe("clan");
        }
        expect(findImportedEquipment("Ammo (SRM-4 (Narc Capable))", "is")?.item.tag).toBe("ammo-is-srm-narc");
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

    it("keeps MegaMek's Clan 'Mech Mortar on the Clan record when the other faction is searched too", () => {
        // The Clan launcher takes fewer slots (TO:AUE p.221); a MegaMek file's item is always looked up this way.
        for (const size of [1, 2, 4, 8]) {
            expect(findImportedEquipment(`Clan Mech Mortar-${size}`, "clan", true)?.item.tag).toBe(`clan-mech-mortar-${size}`);
            expect(findImportedEquipment(`IS Mech Mortar-${size}`, "is", true)?.item.tag).toBe(`mech-mortar-${size}`);
        }
    });

    it("returns null for a name no catalog lists", () => {
        expect(findImportedEquipment("Not A Real Weapon", "is", true)).toBeNull();
    });

    it("finds a record by any of its identifiers, case-insensitively", () => {
        expect(findCatalogMatches("lrm 10", "is")[0]?.tag).toBe("lrm-10");
        expect(findCatalogMatches("Rivet Gun", "universal")[0]?.tag).toBe("nail-gun");
        expect(findCatalogMatches("Rivet Gun", "universal", true)).toEqual([]);
    });

    it("last of all, reads MegaMek's run-together names: letters and digits only, without the IS or Clan prefix", () => {
        expect(findImportedEquipment("CLLargeChemicalLaser", "clan")?.item.tag).toBe("clan-large-chemical-laser");
        expect(findImportedEquipment("IS Mech Mortar-8", "is")?.item.tag).toBe("mech-mortar-8");
        expect(findImportedEquipment("Clan Mech Mortar-8", "clan")?.item.tag).toBe("clan-mech-mortar-8");
        expect(findImportedEquipment("CLHeavyFlamer", "clan")?.item.tag).toMatch(/heavy-flamer/);
        // Never across the faction line for a design of one tech base.
        expect(findImportedEquipment("CLLargeChemicalLaser", "is")).toBeNull();
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
                        duplicates.push(`${definition.id}: "${identifier}" (${other}, ${item.tag})`);
                    }
                    seen.set(key, item.tag);
                }
            }
        }
        expect(duplicates).toEqual([]);
    });

    // An alias naming another record (the Clan Rotary AC/5 once answered to "CLUltraAC2", MegaMek's Clan Ultra
    // AC/2) can only mislead: the own-name pass finds that record first, so the alias is wrong or dead.
    // IS and Clan records share a file but sit in separate lookup tiers, where a Clan record may answer to the IS name.
    it("never lists another record's name or tag in the same tier as an alias", () => {
        const misleading: string[] = [];
        for (const definition of getEquipmentCatalogDefinitions()) {
            const primary = new Map<string, string>();
            const tierKey = (item: IEquipmentItem, identifier: string) => `${getEquipmentTier(definition, item)}|${identifier.toLowerCase()}`;
            for (const item of definition.equipment) {
                primary.set(tierKey(item, item.name), item.tag);
                primary.set(tierKey(item, item.tag), item.tag);
            }
            for (const item of definition.equipment) {
                for (const alias of item.altNames ?? []) {
                    const owner = primary.get(tierKey(item, alias));
                    if (owner !== undefined && owner !== item.tag) {
                        misleading.push(`${definition.id}: ${item.tag} lists "${alias}", the ${owner} record's own name`);
                    }
                }
            }
        }
        expect(misleading).toEqual([]);
    });

    it("never gives two records in the same tier the same alias", () => {
        const shared: string[] = [];
        for (const definition of getEquipmentCatalogDefinitions()) {
            const owners = new Map<string, string>();
            for (const item of definition.equipment) {
                for (const alias of new Set((item.altNames ?? []).map((name) => name.toLowerCase()))) {
                    const key = `${getEquipmentTier(definition, item)}|${alias}`;
                    const other = owners.get(key);
                    if (other !== undefined && other !== item.tag) {
                        shared.push(`${definition.id}: "${alias}" (${other}, ${item.tag})`);
                    }
                    owners.set(key, item.tag);
                }
            }
        }
        expect(shared).toEqual([]);
    });

    it("finds MegaMek's Clan Ultra AC/2 as the Clan Ultra AC/2", () => {
        expect(findImportedEquipment("CLUltraAC2", "clan")?.item.tag).toBe("clan-autocannon-uac-2");
        expect(findImportedEquipment("CLRotaryAC5", "clan")?.item.tag).toBe("clan-autocannon-rac-5");
        expect(findImportedEquipment("CLRotaryAC2", "clan")?.item.tag).toBe("clan-autocannon-rac-2");
        // The Clan LB-X, Ultra AC and HAG rows each answered to the next size up's MegaMek name.
        for (const [name, tag] of [
            ["CLLBXAC2", "clan-autocannon-lbx-2"], ["CLLBXAC5", "clan-autocannon-lbx-5"],
            ["CLLBXAC10", "clan-autocannon-lbx-10"], ["CLLBXAC20", "clan-autocannon-lbx-20"],
            ["CLUltraAC5", "clan-autocannon-uac-5"], ["CLUltraAC10", "clan-autocannon-uac-10"],
            ["CLUltraAC20", "clan-autocannon-uac-20"],
        ]) {
            expect(findImportedEquipment(name, "clan")?.item.tag, name).toBe(tag);
        }
        for (const size of [20, 30, 40]) {
            expect(findImportedEquipment(`CLHAG${size}`, "clan")?.item.name, `CLHAG${size}`).toBe(`Hyper-Assault Gauss (HAG) ${size}`);
        }
    });
});

describe("MegaMek's ISCASE", () => {
    // It was listed on the Guardian ECM Suite (#43).
    it("names CASE, not the Guardian ECM Suite", () => {
        expect(findImportedEquipment("ISCASE", "is")?.item.tag).toBe("case");
    });

    // Each sat one record off, as ISCASE did; MegaMek gives the weapon each internal name stands for (#47).
    it("names the weapon each MegaMek internal name stands for", () => {
        const expected: [string, "is" | "clan", string][] = [
            ["ISUltraAC2", "is", "autocannon-ultra-a"], ["ISUltraAC5", "is", "autocannon-ultra-b"],
            ["ISUltraAC10", "is", "autocannon-ultra-c"], ["ISUltraAC20", "is", "autocannon-ultra-d"],
            ["ISHeavyGaussRifle", "is", "gauss-rifle-heavy"], ["ISLBXAC20", "is", "autocannon-lbx-20"],
            ["ISLargeVSPLaser", "is", "large-vspl"], ["ISMediumVSPLaser", "is", "medium-vspl"], ["ISSmallVSPLaser", "is", "small-vspl"],
            ["ISLargeXPulseLaser", "is", "large-x-pulse-laser"], ["ISMediumXPulseLaser", "is", "medium-x-pulse-laser"],
            ["ISSmallXPulseLaser", "is", "small-x-pulse-laser"], ["RL15", "is", "rocket-launcher-15"],
            ["CLGaussRifle", "clan", "clan-gauss-rifle"], ["CLHeavyLargeLaser", "clan", "large-heavy-laser"],
            ["CLLaserAntiMissileSystem", "clan", "clan-laser-ams"], ["CLSRM2", "clan", "clan-srm-2"],
            ["CLStreakSRM6", "clan", "clan-streak-srm-6"], ["CLATM9", "clan", "atm-9"], ["CLMG", "clan", "clan-machine-gun"],
            // Primitive prototypes (IO:AE p.112).
            ["Autocannon/10 Primitive", "is", "primitive-prototype-ac-10"], ["Autocannon/2p", "is", "primitive-prototype-ac-2"],
            ["IS LRM-20 Primitive", "is", "primitive-prototype-lrm-20"], ["Particle Cannon Primitive", "is", "primitive-prototype-ppc"],
            ["IS Large Laser Prototype", "is", "primitive-prototype-large-laser"],
            ["ISMobileHPG", "is", "mobile-hpg"], ["ISHighResImager", "is", "hi-res-imager"], ["CLHighResImager", "clan", "hi-res-imager"],
            ["ISLRM20", "is", "lrm-20"], ["IS LRM-10", "is", "lrm-10"], ["ISSRM6", "is", "srm-6"], ["IS SRM 2", "is", "srm-2"],
            ["ISNarc Pods", "is", "ammo-is-narc-standard"], ["IS Ammo Narc", "is", "ammo-is-narc-standard"], ["CLNarc Pods", "clan", "ammo-clan-narc-standard"],
        ];
        expect(expected.map(([name, faction]) => [name, findImportedEquipment(name, faction)?.item.tag])).toEqual(expected.map(([name, , tag]) => [name, tag]));
    });

    it("reads MegaMek's Clan heavy machine gun array as the Clan array, which links Clan heavy machine guns", () => {
        for (const name of ["Clan Heavy Machine Gun Array", "CLHMGA"]) {
            expect([name, findImportedEquipment(name, "clan")?.item.tag]).toEqual([name, "clan-heavy-machine-gun-array"]);
            // The MegaMek file converter looks names up as for a mixed-tech design.
            expect([name, findImportedEquipment(name, "clan", true)?.item.tag]).toEqual([name, "clan-heavy-machine-gun-array"]);
        }
        expect(findImportedEquipment("ISHMGA", "is")?.item.tag).toBe("is-heavy-machine-gun-array");
    });
});
