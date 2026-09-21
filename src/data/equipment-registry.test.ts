import { describe, expect, it } from "vitest";
import { mechClanEquipmentArtillery } from "./mech-clan-equipment-weapons-artillery";
import { mechISEquipmentArtillery } from "./mech-is-equipment-weapons-artillery";
import { getEquipmentCatalogDefinitions, getEquipmentCatalogSummaries, getEquipmentListByTech } from "./equipment-registry";
import { hasUniversalEquipmentMetrics, mechUniversalEquipment } from "./mech-universal-equipment";

describe("equipment catalog provenance", () => {
    it("defines a single universal catalog for shared artillery equipment", () => {
        const universal = getEquipmentCatalogDefinitions().find(catalog => catalog.techBase === "universal");

        expect(universal?.id).toBe("mech-universal-equipment");
        expect(universal?.equipment).toEqual(mechUniversalEquipment);
        expect(new Set(universal?.equipment.map(item => item.tag)).size).toBe(universal?.equipment.length);
        expect(mechUniversalEquipment
            .filter(item => mechISEquipmentArtillery.some(candidate => candidate.tag === item.tag))
            .every(item => {
            const isItem = mechISEquipmentArtillery.find(candidate => candidate.tag === item.tag);
            const clanItem = mechClanEquipmentArtillery.find(candidate => candidate.tag === item.tag);
            return isItem && clanItem
                && hasUniversalEquipmentMetrics(isItem, clanItem);
            })).toBe(true);
    });

    it("includes universal equipment once in every tech-base list", () => {
        const isItems = getEquipmentListByTech("is");
        const clanItems = getEquipmentListByTech("clan");
        const mixedItems = getEquipmentListByTech("mis");
        const universalTags = getEquipmentCatalogDefinitions()
            .find(catalog => catalog.techBase === "universal")!
            .equipment
            .map(item => item.tag);

        for (const tag of universalTags) {
            expect(isItems.filter(item => item.tag === tag)).toHaveLength(1);
            expect(clanItems.filter(item => item.tag === tag)).toHaveLength(1);
            expect(mixedItems.filter(item => item.tag === tag)).toHaveLength(1);
        }
    });

    it("reports duplicate tags only when their ownership is universal", () => {
        const occurrences = new Map<string, string[]>();

        for (const item of mechISEquipmentArtillery) {
            const owners = occurrences.get(item.tag) ?? [];
            owners.push("is");
            occurrences.set(item.tag, owners);
        }
        for (const item of mechClanEquipmentArtillery) {
            const owners = occurrences.get(item.tag) ?? [];
            owners.push("clan");
            occurrences.set(item.tag, owners);
        }

        const nonUniversalDuplicates = Array.from(occurrences.entries())
            .filter(([, owners]) => new Set(owners).size > 1)
            .filter(([tag]) => !mechUniversalEquipment.some(item => item.tag === tag));

        for (const [tag] of nonUniversalDuplicates) {
            const isItem = mechISEquipmentArtillery.find(item => item.tag === tag);
            const clanItem = mechClanEquipmentArtillery.find(item => item.tag === tag);

            expect(isItem).toBeDefined();
            expect(clanItem).toBeDefined();
            expect(hasUniversalEquipmentMetrics(isItem!, clanItem!)).toBe(false);
        }
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
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.techBase === "universal")?.equipment.some(item => item.tag === "vehicle-flamer")).toBe(true);
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
            expect(clanItem("nail-rivet-gun").weight).toBe(0.5);
            expect(isItems.find(item => item.tag === "nail-rivet-gun")?.space.battlemech).toBe(1);
        });
});