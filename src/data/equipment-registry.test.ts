import { describe, expect, it } from "vitest";
import { calculateShotsPerTon, equipmentMatchesIdentifier, getAlphaStrikeEquipmentAbilityCodes, getAlphaStrikeEquipmentDisplayAbilityCodes, getCompatibleAmmo, getEquipmentCatalogDefinitions, getEquipmentCatalogSummaries, getEquipmentListByTech, getEquipmentListForChassis, getEquipmentMaximumRangeInHexes } from "./equipment-registry";
import { mechUniversalEquipment } from "./mech-universal-equipment";
import { mechUniversalAmmo } from "./mech-universal-ammo";
import { mechCustomAmmo } from "./mech-custom-ammo";
import { mechClanAmmo } from "./mech-clan-ammo";

describe("equipment catalog provenance", () => {
    it("resolves equipment aliases and preserves artillery map-sheet range", () => {
        const thumper = mechUniversalEquipment.find(item => item.tag === "thumper-artillery")!;

        expect(equipmentMatchesIdentifier(thumper, "Thumper")).toBe(true);
        expect(equipmentMatchesIdentifier(thumper, "thumper-artillery")).toBe(true);
        expect(getEquipmentMaximumRangeInHexes(thumper)).toBe(357);
    });

    it("prefers explicit Alpha Strike specials over weapon type codes", () => {
        const thumper = mechUniversalEquipment.find(item => item.tag === "thumper-artillery")!;

        expect(getAlphaStrikeEquipmentAbilityCodes(thumper)).toEqual(["ARTTH"]);
        expect(getAlphaStrikeEquipmentDisplayAbilityCodes(thumper)).toEqual(["ARTTH 1"]);
        expect(thumper.alphaStrike.damageAoE).toBe(1);
    });

    it("links launchers to consolidated ammo types and calculates shots per ton", () => {
        const launcher = mechUniversalEquipment.find(item => item.tag === "rocket-launcher-20")!;
        const ammo = mechCustomAmmo.find(item => item.tag === "ammo-rocket-launcher")!;

        expect(calculateShotsPerTon(ammo.ammoPerTon!, 20)).toBe(12);
        expect(getCompatibleAmmo({ ...launcher, ammoTypes: ["ammo-rocket-launcher"] }, ammo)).toBe(true);
        expect(launcher.ammoPerTon).toBe(0);
    });

    it("keeps LRM special munitions distinct when weapons declare their supported ammunition", () => {
        const standardLrmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-lrm")!;
        const swarmILrmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-lrm-swarm-i")!;
        const lrmLauncher = { ...mechUniversalEquipment[0], ammoTypes: ["ammo-lrm", "ammo-lrm-swarm-i"] };

        expect(getCompatibleAmmo(lrmLauncher, standardLrmAmmo)).toBe(true);
        expect(getCompatibleAmmo(lrmLauncher, swarmILrmAmmo)).toBe(true);
        expect(getCompatibleAmmo({ ...lrmLauncher, ammoTypes: ["ammo-lrm"] }, swarmILrmAmmo)).toBe(false);
    });

    it("links ATM and iATM launchers to their supported ammunition profiles", () => {
        const clanItems = getEquipmentListByTech("clan");
        const atm6 = clanItems.find(item => item.tag === "atm-6")!;
        const iatm6 = clanItems.find(item => item.tag === "iatm-6")!;
        const standardAtm = mechClanAmmo.find(item => item.tag === "ammo-atm-standard")!;
        const extendedRangeAtm = mechClanAmmo.find(item => item.tag === "ammo-atm-er")!;
        const highExplosiveAtm = mechClanAmmo.find(item => item.tag === "ammo-atm-he")!;
        const infernoIatm = mechClanAmmo.find(item => item.tag === "ammo-iatm-inferno")!;
        const magPulseIatm = mechClanAmmo.find(item => item.tag === "ammo-iatm-mag-pulse")!;

        expect(atm6.ammoPerShot).toBe(6);
        expect([standardAtm, extendedRangeAtm, highExplosiveAtm].every(ammo => getCompatibleAmmo(atm6, ammo))).toBe(true);
        expect(getCompatibleAmmo(atm6, infernoIatm)).toBe(false);
        expect(iatm6.ammoPerShot).toBe(6);
        expect([standardAtm, extendedRangeAtm, highExplosiveAtm, infernoIatm, magPulseIatm]
            .every(ammo => getCompatibleAmmo(iatm6, ammo))).toBe(true);
    });

    it("defines filename-owned universal equipment and ammo catalogs", () => {
        const universal = getEquipmentCatalogDefinitions().find(catalog => catalog.id === "mech-universal-equipment");

        expect(universal?.id).toBe("mech-universal-equipment");
        expect(universal?.equipment).toEqual(mechUniversalEquipment);
        expect(new Set(universal?.equipment.map(item => item.tag)).size).toBe(universal?.equipment.length);
        expect(mechUniversalEquipment.every(item => item.catalog === undefined)).toBe(true);
        expect(mechUniversalAmmo.length).toBeGreaterThan(0);
        expect(mechUniversalAmmo.every(item => item.isAmmo)).toBe(true);
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.id === "mech-universal-ammo")?.equipment).toEqual(mechUniversalAmmo);
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.id === "mech-custom-ammo")?.equipment).toEqual(mechCustomAmmo);
    });

    it("includes universal equipment once in every tech-base list", () => {
        const isItems = getEquipmentListByTech("is");
        const clanItems = getEquipmentListByTech("clan");
        const mixedItems = getEquipmentListByTech("mis");
        const universalTags = getEquipmentCatalogDefinitions()
            .filter(catalog => catalog.techBase === "universal")
            .flatMap(catalog => catalog.equipment)
            .map(item => item.tag);

        for (const tag of universalTags) {
            expect(isItems.filter(item => item.tag === tag)).toHaveLength(1);
            expect(clanItems.filter(item => item.tag === tag)).toHaveLength(1);
            expect(mixedItems.filter(item => item.tag === tag)).toHaveLength(1);
        }
    });

    it("includes custom ammunition only when custom content is requested", () => {
        expect(getEquipmentListByTech("is").some(item => item.tag === "ammo-rocket-launcher")).toBe(false);
        expect(getEquipmentListByTech("is", true).filter(item => item.tag === "ammo-rocket-launcher")).toHaveLength(1);
    });

    it("adds chassis-tech, custom, and universal ammunition for custom-rule machines", () => {
        const innerSphere = getEquipmentListForChassis("is", true);
        const clan = getEquipmentListForChassis("clan", true);
        const mixed = getEquipmentListForChassis("mis", true);

        expect(innerSphere.some(item => item.tag === "ammo-rocket-launcher")).toBe(true);
        expect(innerSphere.some(item => item.tag === "ammo-atm-standard")).toBe(false);
        expect(clan.some(item => item.tag === "ammo-atm-standard")).toBe(true);
        expect(clan.some(item => item.tag === "ammo-rocket-launcher")).toBe(true);
        expect(mixed.some(item => item.tag === "ammo-atm-standard")).toBe(true);
        expect(mixed.some(item => item.tag === "ammo-rocket-launcher")).toBe(true);
        expect(mixed.some(item => item.tag === "ammo-lrm")).toBe(true);
    });

    it("does not infer universal ownership from other catalogs", () => {
        expect(mechUniversalEquipment.some(item => item.tag === "vehicle-flamer")).toBe(false);
        expect(mechUniversalEquipment.some(item => item.tag === "ppc-capacitor")).toBe(false);
    });

    it("keeps every registered item structurally complete", () => {
        for (const definition of getEquipmentCatalogDefinitions()) {
            for (const item of definition.equipment) {
                expect(item.name.length, `${definition.id} ${item.tag} name`).toBeGreaterThan(0);
                expect(item.tag.length, `${definition.id} ${item.name} tag`).toBeGreaterThan(0);
                expect(item.category.length, `${definition.id} ${item.tag} category`).toBeGreaterThan(0);
                expect(item.book.length, `${definition.id} ${item.tag} source book`).toBeGreaterThan(0);
                expect(item.range.short, `${definition.id} ${item.tag} short range`).toEqual(expect.any(Number));
                expect(item.range.medium, `${definition.id} ${item.tag} medium range`).toEqual(expect.any(Number));
                expect(item.range.long, `${definition.id} ${item.tag} long range`).toEqual(expect.any(Number));
                expect(item.space.battlemech, `${definition.id} ${item.tag} BattleMech slots`).toEqual(expect.any(Number));
                expect(item.alphaStrike.heat, `${definition.id} ${item.tag} Alpha Strike heat`).toEqual(expect.any(Number));
            }
        }
    });

    it("keeps tags unique within each registered source catalog", () => {
        for (const definition of getEquipmentCatalogDefinitions()) {
            const tags = definition.equipment.map(item => item.tag);
            expect(new Set(tags).size, definition.id).toBe(tags.length);
        }
    });

    it("exposes catalog completeness summaries without duplicate tags", () => {
        for (const summary of getEquipmentCatalogSummaries()) {
            expect(summary.itemCount).toBeGreaterThan(0);
            expect(summary.duplicateTags, summary.catalogId).toEqual([]);
            expect(summary.missingSourceCount, summary.catalogId).toBe(0);
            expect(summary.ammoCount + summary.weaponCount).toBeLessThanOrEqual(summary.itemCount);
        }
    });

    it("includes the promoted canon missile families in their tech catalogs", () => {
        const isTags = new Set(getEquipmentListByTech("is").map(item => item.tag));
        const clanTags = new Set(getEquipmentListByTech("clan").map(item => item.tag));
        const isTagsToRequire = [
            "extended-lrm-5", "extended-lrm-10", "extended-lrm-15", "extended-lrm-20",
            "mml-3", "mml-5", "mml-7", "mml-9",
            "mrm-10", "mrm-20", "mrm-30", "mrm-40",
            "rocket-launcher-10", "rocket-launcher-15", "rocket-launcher-20",
            "thunderbolt-5", "thunderbolt-10", "thunderbolt-15", "thunderbolt-20"
        ];
        const clanTagsToRequire = ["streak-lrm-5", "streak-lrm-10", "streak-lrm-15", "streak-lrm-20"];

        expect(isTagsToRequire.every(tag => isTags.has(tag))).toBe(true);
        expect(clanTagsToRequire.every(tag => clanTags.has(tag))).toBe(true);
        expect(getEquipmentListByTech("is").filter(item => item.tag === "mrm-10")[0].alphaStrike.rangeShort).toBe(0.57);
        expect(getEquipmentListByTech("clan").filter(item => item.tag === "streak-lrm-20")[0].notes).toContain("workbook");
        expect(getEquipmentListByTech("is").filter(item => item.tag === "vehicle-flamer")).toHaveLength(1);
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.techBase === "universal")?.equipment.some(item => item.tag === "vehicle-flamer")).toBe(false);
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.techBase === "universal")?.equipment.find(item => item.tag === "rocket-launcher-20")?.weight).toBe(1.5);
        expect(getEquipmentListByTech("is").filter(item => item.tag === "rocket-launcher-20")).toHaveLength(1);
        expect(getEquipmentListByTech("clan").find(item => item.tag === "clan-srm-2-artemis-iv")?.weight).toBe(1.5);
        expect(getEquipmentListByTech("clan").find(item => item.tag === "clan-srm-6-artemis-iv")?.space.battlemech).toBe(2);
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.techBase === "universal")?.equipment.find(item => item.tag === "ppc-capacitor")).toBeUndefined();
    });

    it("covers the requested Clan missile families without Clan MRMs", () => {
        const clanTags = new Set(getEquipmentListByTech("clan").map(item => item.tag));
        const requiredTags = [
            "clan-lrm-5", "clan-lrm-10", "clan-lrm-15", "clan-lrm-20",
            "clan-lrm-5-artemis-iv", "clan-lrm-10-artemis-iv", "clan-lrm-15-artemis-iv", "clan-lrm-20-artemis-iv",
            "streak-lrm-5", "streak-lrm-10", "streak-lrm-15", "streak-lrm-20",
            "clan-srm-2", "clan-srm-4", "clan-srm-6",
            "clan-srm-2-artemis-iv", "clan-srm-4-artemis-iv", "clan-srm-6-artemis-iv",
            "clan-streak-srm-2", "clan-streak-srm-4", "clan-streak-srm-6",
            "atm-3", "atm-6", "atm-9", "atm-12", "iatm-3", "iatm-6", "iatm-9", "iatm-12",
            "clan-lrm-5-os", "clan-lrm-10-os", "clan-lrm-15-os", "clan-lrm-20-os",
            "clan-srm-2-os", "clan-srm-4-os", "clan-srm-6-os",
            "clan-lrt-5", "clan-lrt-10", "clan-lrt-15", "clan-lrt-20",
            "clan-srt-2", "clan-srt-4", "clan-srt-6",
            "clan-lrt-5-os", "clan-lrt-10-os", "clan-lrt-15-os", "clan-lrt-20-os",
            "clan-srt-2-os", "clan-srt-4-os", "clan-srt-6-os"
        ];

        expect(requiredTags.every(tag => clanTags.has(tag))).toBe(true);
            const hasClanMrmOrMrt = Array.from(clanTags).some(tag =>
                tag.startsWith("mrm-")
                || tag.startsWith("clan-mrm-")
                || tag.startsWith("clan-mrt-")
                || tag.startsWith("mrt-")
            );
            expect(hasClanMrmOrMrt).toBe(false);
    });

        it("uses the supplied Alpha Strike ATM and iATM cards", () => {
            const clanItems = getEquipmentListByTech("clan");
            const profile = (tag: string) => clanItems.find(item => item.tag === tag)!.alphaStrike;

            expect([profile("atm-3").rangeShort, profile("atm-3").rangeMedium, profile("atm-3").rangeLong]).toEqual([1, 1, 1]);
            expect([profile("atm-6").rangeShort, profile("atm-6").rangeMedium, profile("atm-6").rangeLong]).toEqual([2, 1, 1]);
            expect([profile("atm-9").rangeShort, profile("atm-9").rangeMedium, profile("atm-9").rangeLong]).toEqual([3, 2, 1]);
            expect([profile("atm-12").rangeShort, profile("atm-12").rangeMedium, profile("atm-12").rangeLong]).toEqual([4, 2, 1]);
            expect(profile("atm-3").notes).toContain("Direct Fire");
            expect(profile("iatm-3").notes).toContain("IF 1");
            expect([profile("iatm-6").rangeShort, profile("iatm-6").rangeMedium, profile("iatm-6").rangeLong]).toEqual([3, 2, 1]);
            expect([profile("iatm-9").rangeShort, profile("iatm-9").rangeMedium, profile("iatm-9").rangeLong]).toEqual([4, 3, 2]);
            expect([profile("iatm-12").rangeShort, profile("iatm-12").rangeMedium, profile("iatm-12").rangeLong]).toEqual([5, 4, 2]);
            expect(profile("iatm-12").notes).toContain("0 heat on miss");
        });

        it("includes the classified Block 11 records in the correct catalogs", () => {
            const isTags = new Set(getEquipmentListByTech("is").map(item => item.tag));
            const clanTags = new Set(getEquipmentListByTech("clan").map(item => item.tag));

            expect(["primitive-prototype-lrm-15", "primitive-prototype-lrm-20", "primitive-prototype-srm-2", "primitive-prototype-srm-4"]
                .every(tag => isTags.has(tag))).toBe(true);
            expect(clanTags.has("ap-gauss-rifle")).toBe(true);
            expect(isTags.has("ap-gauss-rifle")).toBe(false);
        });

        it("includes the classified Block 12 Clan ballistic records", () => {
            const isItems = getEquipmentListByTech("is");
            const clanItems = getEquipmentListByTech("clan");
            const clanItem = (tag: string) => clanItems.find(item => item.tag === tag)!;

            expect(["hyper-assault-gauss-20", "hyper-assault-gauss-30", "hyper-assault-gauss-40", "protomech-autocannon-2", "protomech-autocannon-4", "protomech-autocannon-8"]
                .every(tag => clanItems.some(item => item.tag === tag))).toBe(true);
            expect(clanItem("hyper-assault-gauss-20").alphaStrike.rangeShort).toBe(1.328);
            expect(clanItem("hyper-assault-gauss-40").weight).toBe(20);
            expect(clanItem("protomech-autocannon-8").space.protomech).toBe(2);
            expect(clanItem("clan-autocannon-rac-2").weight).toBe(7);
            expect(clanItem("clan-autocannon-rac-5").space.battlemech).toBe(6);
            expect(clanItem("clan-autocannon-uac-2").space.battlemech).toBe(2);
            expect(clanItem("nail-gun").weight).toBe(0.5);
            expect(isItems.find(item => item.tag === "nail-gun")?.space.battlemech).toBe(1);
        });
});