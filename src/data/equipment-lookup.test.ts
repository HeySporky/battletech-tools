import { afterEach, describe, expect, it } from "vitest";
import { IEquipmentItem } from "./data-interfaces";
import { copyCatalogRecord, findUnitCatalogRecord, getUnitCatalogRecords } from "./equipment-lookup";
import { getBattleArmorScaleRecordsByTech, getEquipmentRecordsByTech, setLocalCustomEquipment } from "./equipment-registry";
import { findByTag } from "./tag-match";

// One catalog lookup shared by every unit class (#87): the unit's own catalog, then the other tech base's
// (a saved unit keeps equipment since moved), then battle armor scale items, each searched before the next.

const draft = (tag: string, altTags?: string[]): IEquipmentItem => ({ ...getEquipmentRecordsByTech("is")[0], tag, altTags, name: tag });

describe("The shared unit catalog lookup", () => {
    afterEach(() => setLocalCustomEquipment([]));

    it("finds what the unit's own catalog has, without copying it", () => {
        const own = findByTag(getEquipmentRecordsByTech("is", true), "medium-laser");
        expect(own).toBeDefined();
        expect(findUnitCatalogRecord("is", "medium-laser")).toBe(own);
    });

    it("looks in the other tech base only when asked, and in battle armor scale items only when asked", () => {
        const clanOnly = getEquipmentRecordsByTech("clan").find((item) => !findByTag(getEquipmentRecordsByTech("is", true), item.tag)) as IEquipmentItem;
        expect(findUnitCatalogRecord("is", clanOnly.tag, { otherTechBase: false })).toBeUndefined();
        expect(findUnitCatalogRecord("is", clanOnly.tag)?.tag).toBe(clanOnly.tag);
        const battleArmorOnly = getBattleArmorScaleRecordsByTech("is")[0];
        expect(findUnitCatalogRecord("is", battleArmorOnly.tag)).toBeUndefined();
        expect(findUnitCatalogRecord("is", battleArmorOnly.tag, { battleArmorScale: true })).toBe(battleArmorOnly);
    });

    it("prefers a current tag to an alternate tag, and a catalog record to a battle armor scale item", () => {
        setLocalCustomEquipment([draft("lookup-test-old", ["lookup-test-new"]), draft("lookup-test-new")]);
        expect(findUnitCatalogRecord("is", "lookup-test-new")?.tag).toBe("lookup-test-new");
        const battleArmor = getBattleArmorScaleRecordsByTech("is")[0];
        setLocalCustomEquipment([draft("lookup-test-renamed", [battleArmor.tag])]);
        expect(findUnitCatalogRecord("is", battleArmor.tag, { battleArmorScale: true })?.tag).toBe("lookup-test-renamed");
    });

    it("sees custom equipment drafted in this browser as soon as it changes", () => {
        expect(findUnitCatalogRecord("is", "lookup-test-draft")).toBeUndefined();
        setLocalCustomEquipment([draft("lookup-test-draft")]);
        expect(findUnitCatalogRecord("is", "lookup-test-draft")?.tag).toBe("lookup-test-draft");
        expect(findUnitCatalogRecord("is", "lookup-test-draft", { includeCustom: false })).toBeUndefined();
        expect(getUnitCatalogRecords("is").some((item) => item.tag === "lookup-test-draft")).toBe(true);
        setLocalCustomEquipment([]);
        expect(findUnitCatalogRecord("is", "lookup-test-draft")).toBeUndefined();
    });

    it("lists the records in lookup order", () => {
        const records = getUnitCatalogRecords("clan", { battleArmorScale: true });
        expect(records[0]).toBe(getEquipmentRecordsByTech("clan", true)[0]);
        expect(records[records.length - 1]).toBe(getBattleArmorScaleRecordsByTech("clan").slice(-1)[0]);
    });

    it("mounts a copy that shares nothing with the catalog", () => {
        const record = findUnitCatalogRecord("is", "medium-laser") as IEquipmentItem;
        const copy = copyCatalogRecord(record);
        expect(copy).toEqual(record);
        expect(copy).not.toBe(record);
        const nested = Object.entries(record).filter(([, value]) => value !== null && typeof value === "object");
        expect(nested.length).toBeGreaterThan(0);
        for (const [key, value] of nested) expect((copy as unknown as Record<string, unknown>)[key]).not.toBe(value);
    });

    it("never matches an empty or non-string tag", () => {
        expect(findUnitCatalogRecord("is", "")).toBeUndefined();
        expect(findUnitCatalogRecord("is", 7)).toBeUndefined();
    });
});
