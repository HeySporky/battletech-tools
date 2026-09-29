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

    migrateLegacyQuadFrontLegs(record);

    return record;
}

const LEGACY_QUAD_FRONT_LEGS: Record<string, string> = { la: "fll", ra: "frl" };

/**
 * Quads saved before front legs had their own locations kept the front legs in the arm
 * locations: armor in leftArm/rightArm, criticals, equipment and critical hits under "la"/"ra".
 * Those saves have no frontLeftLeg/frontRightLeg armor entry; move them to "fll"/"frl".
 */
function migrateLegacyQuadFrontLegs(record: IBattleMechExport): void {
    if (typeof record.mechType !== "string" || record.mechType.toLowerCase() !== "quad") {
        return;
    }
    const armor = record.armor_allocation as unknown as Record<string, number | undefined> | undefined;
    const hasFrontLegArmor = !!armor && ("frontLeftLeg" in armor || "frontRightLeg" in armor);
    const hasArmSlots = (record.allocation ?? []).some(slot => slot.loc === "la" || slot.loc === "ra");
    if (hasFrontLegArmor || (!armor && !hasArmSlots)) {
        return;
    }

    if (armor) {
        armor.frontLeftLeg = armor.leftArm ?? 0;
        armor.frontRightLeg = armor.rightArm ?? 0;
        armor.leftArm = 0;
        armor.rightArm = 0;
    }
    for (const slot of record.allocation ?? []) {
        if (slot.loc && LEGACY_QUAD_FRONT_LEGS[slot.loc]) slot.loc = LEGACY_QUAD_FRONT_LEGS[slot.loc];
    }
    for (const item of record.equipment ?? []) {
        if (item.loc && LEGACY_QUAD_FRONT_LEGS[item.loc]) item.loc = LEGACY_QUAD_FRONT_LEGS[item.loc];
        if (item.allocationLocation && LEGACY_QUAD_FRONT_LEGS[item.allocationLocation]) {
            item.allocationLocation = LEGACY_QUAD_FRONT_LEGS[item.allocationLocation];
        }
    }
    if (record.criticalDamage) {
        for (const [legacy, current] of Object.entries(LEGACY_QUAD_FRONT_LEGS)) {
            if (record.criticalDamage[legacy]) {
                record.criticalDamage[current] = record.criticalDamage[legacy];
                delete record.criticalDamage[legacy];
            }
        }
    }
    for (const bubbles of [record.armorBubbles, record.structureBubbles]) {
        const byLocation = bubbles as unknown as Record<string, boolean[] | undefined> | null | undefined;
        if (!byLocation) continue;
        if (byLocation.leftArm?.length) {
            byLocation.frontLeftLeg = byLocation.leftArm;
            byLocation.leftArm = [];
        }
        if (byLocation.rightArm?.length) {
            byLocation.frontRightLeg = byLocation.rightArm;
            byLocation.rightArm = [];
        }
    }
}