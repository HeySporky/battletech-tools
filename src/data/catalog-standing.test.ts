import { describe, expect, it } from "vitest";
import { getAllCatalogs } from "./catalog-registry";
import type { ICatalogStanding } from "./data-interfaces";
import { servesTechBase } from "./equipment-registry";
import { isKnownEditionTag } from "./rules-editions";

// Every catalog carries the same standing (design 2026-10-24-catalog-consolidation §1).
const catalogs = getAllCatalogs();
const label = (id: string, record: ICatalogStanding) => `${id}: ${record.tag}`;
// An IS and a Clan record may share an old tag: lookups search the unit's own tech base first (getEquipmentListByTech).
const tagsOf = (record: ICatalogStanding) => [record.tag, ...(record.altTags ?? [])].map((tag) => `${record.techBase ?? ""}:${tag}`);
const duplicates = (tags: string[]) => tags.filter((tag, index) => tags.indexOf(tag) !== index);

describe("catalog standing", () => {
    it("every catalog record has a tag and a name", () => {
        const failures = catalogs.flatMap(({ id, records }) => records
            .filter((record) => typeof record.tag !== "string" || !record.tag || typeof record.name !== "string" || !record.name)
            .map((record) => label(id, record)));
        expect(failures).toEqual([]);
    });

    it("tags are unique within each catalog and tech base, counting altTags", () => {
        const failures = catalogs.flatMap(({ id, records }) => duplicates(records.flatMap(tagsOf)).map((tag) => `${id}: ${tag}`));
        expect(failures).toEqual([]);
    });

    it("tags are unique across the equipment catalogs within each tech base, counting altTags", () => {
        const tags = catalogs.filter(({ equipment }) => equipment).flatMap(({ records }) => records.flatMap(tagsOf));
        expect(duplicates(tags)).toEqual([]);
    });

    it("every edition tag is known", () => {
        const failures = catalogs.flatMap(({ id, records }) => records.filter((record) => [
            ...(record.editions ?? []), ...Object.keys(record.editionStats ?? {}), ...Object.keys(record.apocryphalIn ?? {}),
            ...Object.keys(record.editionLevels ?? {}),
        ].some((tag) => !isKnownEditionTag(tag))).map((record) => label(id, record)));
        expect(failures).toEqual([]);
    });

    it("uses null, not 0, for a date a record lacks", () => {
        const zero = (dates: object | undefined) => ["prototype", "introduced", "extinct", "reintroduced"]
            .some((key) => (dates as Record<string, unknown> | undefined)?.[key] === 0);
        const failures = catalogs.flatMap(({ id, records }) => records
            .filter((record) => zero(record) || zero(record.clanDates))
            .map((record) => label(id, record)));
        expect(failures).toEqual([]);
    });

    it("clanDates sit only on Inner Sphere or universal records", () => {
        const failures = catalogs.flatMap(({ id, records }) => records
            .filter((record) => record.techBase === "clan" && record.clanDates)
            .map((record) => label(id, record)));
        expect(failures).toEqual([]);
    });

    it("every catalog lists editions and tech base", () => {
        const failures = catalogs.filter(({ custom }) => !custom)
            .flatMap(({ id, records }) => records
                .filter((record) => (record.rulesLevel ?? 0) < 6)
                .filter((record) => !Array.isArray(record.editions) || !record.techBase)
                .map((record) => label(id, record)));
        expect(failures).toEqual([]);
    });

    it("a universal record serves both sides, a one-sided record only its own or mixed tech", () => {
        expect(["is", "clan", "mis", "mclan"].map((tech) => servesTechBase("universal", tech))).toEqual([true, true, true, true]);
        expect(["is", "clan", "mis", "mclan"].map((tech) => servesTechBase("clan", tech))).toEqual([false, true, true, true]);
        expect(["is", "clan", "mis", "mclan"].map((tech) => servesTechBase("is", tech))).toEqual([true, false, true, true]);
    });
});
