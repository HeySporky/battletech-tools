import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit, IASMULUnit } from "../classes/alpha-strike-unit";
import {
    buildCustomMULRecord,
    customMULRecordToForm,
    CUSTOM_MUL_ID_START,
    CUSTOM_MUL_KEY_PREFIX,
    emptyCustomMULForm,
    ICustomMULForm,
    mergeCustomMULEntries,
    mulIdentity,
    nextCustomMULId,
    serializeCustomMULRecords,
    validateCustomMULForm,
} from "./custom-mul";
import bundledCustoms from "./mul/custom/custom-units.json";

function validForm(overrides: Partial<ICustomMULForm> = {}): ICustomMULForm {
    return {
        ...emptyCustomMULForm(),
        name: "Vindicator Custom",
        variant: "VND-X",
        tonnage: "45",
        pointValue: "28",
        size: "2",
        move: "8\"j",
        tmm: "2",
        armor: "5",
        structure: "4",
        damageShort: "2",
        damageMedium: "2",
        damageLong: "0*",
        overheat: "1",
        abilities: "ENE, IF1",
        author: "Test Designer",
        ...overrides,
    };
}

const identity = { id: CUSTOM_MUL_ID_START + 1, key: `${CUSTOM_MUL_KEY_PREFIX}TEST000001`, createdAt: "2026-09-28T00:00:00.000Z" };

describe("custom MUL entries", () => {
    it("accepts a complete form and builds a record the Alpha Strike card importer understands", () => {
        const form = validForm();
        expect(validateCustomMULForm(form, { customRecords: [] })).toEqual([]);

        const record = buildCustomMULRecord(form, identity, "2026-09-28T01:00:00.000Z");
        expect(record).toMatchObject({
            Id: CUSTOM_MUL_ID_START + 1,
            MulUnitKey: identity.key,
            Name: "Vindicator Custom",
            Variant: "VND-X",
            Class: "BattleMech",
            BFType: "BM",
            Type: { Id: 18, Name: "BattleMech" },
            BFDamageLong: 0,
            BFDamageLongMin: true,
            BFAbilities: "ENE,IF1",
            CustomInfo: { author: "Test Designer", updatedAt: "2026-09-28T01:00:00.000Z" },
        });

        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        expect(unit.name).toBe("Vindicator Custom VND-X");
        expect(unit.basePoints).toBe(28);
        expect(unit.damage).toMatchObject({ short: 2, medium: 2, long: 0, longMinimal: true });
        expect(unit.abilities).toEqual(["ENE", "IF1"]);
    });

    it("round-trips a record through the edit form", () => {
        const record = buildCustomMULRecord(validForm(), identity);
        expect(buildCustomMULRecord(customMULRecordToForm(record), identity, record.CustomInfo!.updatedAt)).toEqual(record);
    });

    it("reports missing and malformed stats", () => {
        const errors = validateCustomMULForm(
            validForm({ name: "", author: "", pointValue: "0", size: "7", move: "fast", damageShort: "2*" }),
            { customRecords: [] },
        );
        expect(errors).toEqual(expect.arrayContaining([
            "Name is required.",
            "Author / designer is required so the entry can be attributed.",
            "Point Value must be a whole number from 1 to 1000.",
            "Size must be a whole number from 1 to 4.",
            "Move must look like 8\", 8\"/6\"j, 10\"j or 5a.",
            "Short damage must be a whole number or 0* (minimal damage).",
        ]));
    });

    it("rejects duplicates of other customs and of canonical MUL 2.0 units, but not the record being edited", () => {
        const existing = buildCustomMULRecord(validForm(), identity);
        const context = { customRecords: [existing], canonicalIdentities: new Set([mulIdentity("Atlas", "AS7-D")]) };

        expect(validateCustomMULForm(validForm(), context)).toContain('A custom unit named "Vindicator Custom VND-X" already exists.');
        expect(validateCustomMULForm(validForm(), { ...context, editingKey: identity.key })).toEqual([]);
        expect(validateCustomMULForm(validForm({ name: "Atlas", variant: "AS7-D" }), context)).toContain(
            "That name and variant is a canonical unit on the current MUL; customs are for non-canonical units only.",
        );
    });

    it("allocates ids above the custom range and serializes deterministically", () => {
        expect(nextCustomMULId([])).toBe(CUSTOM_MUL_ID_START + 1);
        const b = buildCustomMULRecord(validForm({ name: "Beta" }), { ...identity, id: 900007 });
        const a = { ...buildCustomMULRecord(validForm({ name: "Alpha" }), identity), MulSource: "custom" as const };
        expect(nextCustomMULId([a, b])).toBe(900008);

        const parsed = JSON.parse(serializeCustomMULRecords([b, a]));
        expect(parsed.map((record: IASMULUnit) => record.Name)).toEqual(["Alpha", "Beta"]);
        expect(parsed[0]).not.toHaveProperty("MulSource");
    });

    it("merges submitted entries into the shared list's current contents", () => {
        const theirs = buildCustomMULRecord(validForm({ name: "Theirs" }), { ...identity, key: "CUSTOM-THEIRS0001" });
        const current = serializeCustomMULRecords([theirs]);

        // A local entry created before `theirs` was merged, holding the same Id: it gets the next free Id.
        const mine = {
            ...buildCustomMULRecord(validForm({ name: "Mine" }), { ...identity, key: "CUSTOM-MINE000001" }),
            MulSource: "custom" as const,
        };
        mine.CustomInfo = { ...mine.CustomInfo!, local: true, pullRequestUrl: "https://example.test/pr/1" };

        const merged: IASMULUnit[] = JSON.parse(mergeCustomMULEntries(current, [mine]));
        expect(merged.map((record) => [record.Name, record.Id])).toEqual([["Mine", CUSTOM_MUL_ID_START + 2], ["Theirs", CUSTOM_MUL_ID_START + 1]]);
        expect(merged[0].CustomInfo).not.toHaveProperty("local");
        expect(merged[0].CustomInfo).not.toHaveProperty("pullRequestUrl");
        expect(merged[0]).not.toHaveProperty("MulSource");

        // Re-submitting an edit replaces the entry in place and keeps its shared Id.
        const edited = buildCustomMULRecord(validForm({ name: "Mine", pointValue: "30" }), { ...identity, key: "CUSTOM-MINE000001" });
        const remerged: IASMULUnit[] = JSON.parse(mergeCustomMULEntries(JSON.stringify(merged), [edited]));
        expect(remerged).toHaveLength(2);
        expect(remerged[0]).toMatchObject({ Name: "Mine", BFPointValue: 30, Id: CUSTOM_MUL_ID_START + 2 });

        // A missing file (first submission) starts a new list.
        expect(JSON.parse(mergeCustomMULEntries(null, [edited]))).toHaveLength(1);
    });

    it("keeps every bundled custom entry valid and unique", () => {
        const records = bundledCustoms as unknown as IASMULUnit[];
        for (const record of records) {
            expect(record.MulUnitKey?.startsWith(CUSTOM_MUL_KEY_PREFIX)).toBe(true);
            expect(record.Id).toBeGreaterThan(CUSTOM_MUL_ID_START);
            expect(record.CustomInfo).not.toHaveProperty("local");
            expect(record.CustomInfo).not.toHaveProperty("pullRequestUrl");
            expect(validateCustomMULForm(customMULRecordToForm(record), { customRecords: records, editingKey: record.MulUnitKey })).toEqual([]);
        }
        expect(new Set(records.map((record) => record.Id)).size).toBe(records.length);
        expect(new Set(records.map((record) => record.MulUnitKey)).size).toBe(records.length);
    });
});
