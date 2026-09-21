import type { IBattleMechExport } from "../classes/battlemech";

export const CANONICAL_RECORD_SCHEMA_VERSION = 1 as const;

export type CanonicalUnitDomain =
    | "battlemech"
    | "vehicle"
    | "aerospace"
    | "infantry";

export interface ICanonicalSourceMetadata {
    format?: string;
    fileName?: string;
    sourceBook?: string;
    warnings?: string[];
}

export interface ICanonicalRecord<TRecord> {
    schemaVersion: typeof CANONICAL_RECORD_SCHEMA_VERSION;
    unitDomain: CanonicalUnitDomain;
    ruleset: string;
    source?: ICanonicalSourceMetadata;
    record: TRecord;
}

export type ICanonicalBattleMechRecord = ICanonicalRecord<IBattleMechExport> & {
    unitDomain: "battlemech";
};

export function toCanonicalBattleMechRecord(
    record: IBattleMechExport,
    source?: ICanonicalSourceMetadata,
): ICanonicalBattleMechRecord {
    return {
        schemaVersion: CANONICAL_RECORD_SCHEMA_VERSION,
        unitDomain: "battlemech",
        ruleset: "classic-battletech",
        source,
        record: structuredClone(record),
    };
}

export function migrateBattleMechRecord(
    input: IBattleMechExport | ICanonicalBattleMechRecord,
): IBattleMechExport {
    if (isCanonicalBattleMechRecord(input)) {
        return normalizeBattleMechRecord(input.record);
    }

    return normalizeBattleMechRecord(input);
}

export function parseBattleMechRecordJSON(
    jsonString: string,
): IBattleMechExport {
    const parsed: unknown = JSON.parse(jsonString);

    if (!isRecord(parsed)) {
        throw new Error("BattleMech record must be a JSON object");
    }

    return migrateBattleMechRecord(parsed as unknown as IBattleMechExport | ICanonicalBattleMechRecord);
}

function isCanonicalBattleMechRecord(
    input: IBattleMechExport | ICanonicalBattleMechRecord,
): input is ICanonicalBattleMechRecord {
    return isRecord(input)
        && input.schemaVersion === CANONICAL_RECORD_SCHEMA_VERSION
        && input.unitDomain === "battlemech"
        && "record" in input;
}

function isRecord(input: unknown): input is Record<string, unknown> {
    return typeof input === "object" && input !== null && !Array.isArray(input);
}

function normalizeBattleMechRecord(
    input: IBattleMechExport,
): IBattleMechExport {
    const record = structuredClone(input);

    if (typeof record.lastUpdated === "string") {
        record.lastUpdated = new Date(record.lastUpdated);
    }

    return record;
}