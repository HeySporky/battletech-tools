import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import {
    CANONICAL_RECORD_SCHEMA_VERSION,
    migrateBattleMechRecord,
    parseBattleMechRecordJSON,
    toCanonicalBattleMechRecord,
} from "./canonical-record";

describe("canonical BattleMech records", () => {
    it("wraps an existing export without changing its payload", () => {
        const mech = new BattleMech();
        const legacyRecord = mech.export(true);

        const canonicalRecord = toCanonicalBattleMechRecord(legacyRecord, {
            format: "battletech-tools",
        });

        expect(canonicalRecord.schemaVersion).toBe(CANONICAL_RECORD_SCHEMA_VERSION);
        expect(canonicalRecord.unitDomain).toBe("battlemech");
        expect(canonicalRecord.ruleset).toBe("classic-battletech");
        expect(canonicalRecord.record).toEqual(legacyRecord);
        expect(canonicalRecord.record).not.toBe(legacyRecord);
    });

    it("migrates both canonical and legacy JSON into the existing import shape", () => {
        const mech = new BattleMech();
        mech.setType("tripod");
        mech.setModel("Canonical Test");
        const legacyRecord = mech.export(true);
        const canonicalJSON = JSON.stringify(toCanonicalBattleMechRecord(legacyRecord));
        const legacyJSON = JSON.stringify(legacyRecord);

        expect(parseBattleMechRecordJSON(canonicalJSON)).toEqual(legacyRecord);
        expect(parseBattleMechRecordJSON(legacyJSON)).toEqual(legacyRecord);
        expect(migrateBattleMechRecord(toCanonicalBattleMechRecord(legacyRecord))).toEqual(legacyRecord);
    });

    it("lets BattleMech import and export use the canonical envelope", () => {
        const mech = new BattleMech();
        mech.setType("tripod");
        mech.setModel("Canonical Integration");

        const canonicalJSON = JSON.stringify(mech.exportCanonical(true));
        const restored = new BattleMech(canonicalJSON);

        expect(restored.getMechType().tag).toBe("tripod");
        expect(restored.model).toBe("Canonical Integration");
    });

    it("rejects non-object JSON instead of passing malformed data to BattleMech", () => {
        expect(() => parseBattleMechRecordJSON("null")).toThrow("must be a JSON object");
        expect(() => parseBattleMechRecordJSON("[]")).toThrow("must be a JSON object");
    });
});