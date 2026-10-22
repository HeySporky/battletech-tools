import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { generateUUID } from "../utils/generateUUID";

// Curated non-canonical units live in src/data/mul/custom/custom-units.json (the shared list). The
// developer-menu Custom MUL Editor (/custom-mul-editor) saves new entries in the browser first
// (custom-mul-local.ts) and proposes them for the shared list with a pull request. Records use the same shape as MUL 2.0 records so the
// search, filters, and AlphaStrikeUnit.importMUL() treat them identically.

export const CUSTOM_MUL_FILE_PATH = "src/data/mul/custom/custom-units.json";
export const CUSTOM_MUL_ID_START = 900000;
export const CUSTOM_MUL_KEY_PREFIX = "CUSTOM-";

export const CUSTOM_UNIT_TYPES: { name: string; typeId: number; bfType: string }[] = [
    { name: "BattleMech", typeId: 18, bfType: "BM" },
    { name: "IndustrialMech", typeId: 20, bfType: "IM" },
    { name: "ProtoMech", typeId: 23, bfType: "PM" },
    { name: "Combat Vehicle", typeId: 19, bfType: "CV" },
    { name: "OmniVehicle", typeId: 19, bfType: "CV" },
    { name: "Support Vehicle", typeId: 24, bfType: "SV" },
    { name: "Battle Armor", typeId: 22, bfType: "BA" },
    { name: "Infantry", typeId: 21, bfType: "CI" },
    { name: "Fighter Craft", typeId: 17, bfType: "AF" },
    { name: "Aerospace Craft", typeId: 17, bfType: "AF" },
];

export const CUSTOM_TECHNOLOGIES: { name: string; id: number }[] = [
    { name: "Inner Sphere", id: 1 },
    { name: "Clan", id: 2 },
    { name: "Mixed", id: 3 },
    { name: "Primitive", id: 57 },
];

export const CUSTOM_RULES_LEVELS = ["Introductory", "Standard", "Advanced", "Experimental"];

// Everything the form edits, as strings so partially-typed input round-trips unchanged.
export interface ICustomMULForm {
    name: string;
    variant: string;
    unitType: string;
    technology: string;
    rules: string;
    role: string;
    eraId: string;
    dateIntroduced: string;
    tonnage: string;
    battleValue: string;
    pointValue: string;
    size: string;
    move: string;
    tmm: string;
    armor: string;
    structure: string;
    threshold: string;
    damageShort: string;
    damageMedium: string;
    damageLong: string;
    damageExtreme: string;
    overheat: string;
    abilities: string;
    author: string;
    source: string;
    notes: string;
}

export function emptyCustomMULForm(): ICustomMULForm {
    return {
        name: "",
        variant: "",
        unitType: "BattleMech",
        technology: "Inner Sphere",
        rules: "Standard",
        role: "None",
        eraId: "0",
        dateIntroduced: "",
        tonnage: "",
        battleValue: "0",
        pointValue: "",
        size: "",
        move: "",
        tmm: "",
        armor: "",
        structure: "",
        threshold: "0",
        damageShort: "0",
        damageMedium: "0",
        damageLong: "0",
        damageExtreme: "0",
        overheat: "0",
        abilities: "",
        author: "",
        source: "",
        notes: "",
    };
}

function damageText(value: number, minimal: boolean | undefined): string {
    return minimal ? "0*" : String(value ?? 0);
}

export function customMULRecordToForm(record: IASMULUnit): ICustomMULForm {
    return {
        name: record.Name ?? "",
        variant: record.Variant ?? "",
        unitType: record.Class ?? "BattleMech",
        technology: record.Technology?.Name ?? "Inner Sphere",
        rules: record.Rules ?? "Standard",
        role: record.Role?.Name ?? "None",
        eraId: String(record.EraId ?? 0),
        dateIntroduced: record.DateIntroduced ?? "",
        tonnage: String(record.Tonnage ?? ""),
        battleValue: String(record.BattleValue ?? 0),
        pointValue: String(record.BFPointValue ?? ""),
        size: String(record.BFSize ?? ""),
        move: record.BFMove ?? "",
        tmm: String(record.BFTMM ?? ""),
        armor: String(record.BFArmor ?? ""),
        structure: String(record.BFStructure ?? ""),
        threshold: String(record.BFThreshold ?? 0),
        damageShort: damageText(record.BFDamageShort, record.BFDamageShortMin),
        damageMedium: damageText(record.BFDamageMedium, record.BFDamageMediumMin),
        damageLong: damageText(record.BFDamageLong, record.BFDamageLongMin),
        damageExtreme: damageText(record.BFDamageExtreme, record.BFDamageExtremeMin),
        overheat: String(record.BFOverheat ?? 0),
        abilities: record.BFAbilities ?? "",
        author: record.CustomInfo?.author ?? "",
        source: record.CustomInfo?.source ?? "",
        notes: record.CustomInfo?.notes ?? "",
    };
}

// "Name Variant", lower-cased and whitespace-collapsed: how duplicates are detected across lists.
export function mulIdentity(name: string | null | undefined, variant: string | null | undefined): string {
    return `${name ?? ""} ${variant ?? ""}`.trim().replace(/\s+/g, " ").toLowerCase();
}

const INTEGER = /^-?\d+$/;
const DAMAGE = /^(\d+|0\*)$/;
// One or more movement modes separated by "/", e.g. 8", 8"/6"j, 10"j, 5a, 12"g/6"j
const MOVE = /^\d+"?[a-z]*(\/\d+"?[a-z]*)*$/i;

function parseDamage(text: string): { value: number; minimal: boolean } {
    const trimmed = text.trim();
    return trimmed === "0*" ? { value: 0, minimal: true } : { value: Number(trimmed), minimal: false };
}

export interface ICustomMULValidationContext {
    // Other custom records (the one being edited is excluded by MulUnitKey).
    customRecords: IASMULUnit[];
    // mulIdentity() of every MUL 2.0 unit; canonical units must not be re-entered as customs.
    canonicalIdentities?: Set<string>;
    editingKey?: string;
}

export function validateCustomMULForm(form: ICustomMULForm, context: ICustomMULValidationContext): string[] {
    const errors: string[] = [];
    const requireInt = (label: string, value: string, min: number, max: number) => {
        const trimmed = value.trim();
        if (!INTEGER.test(trimmed) || +trimmed < min || +trimmed > max) {
            errors.push(`${label} must be a whole number from ${min} to ${max}.`);
        }
    };

    if (!form.name.trim()) {
        errors.push("Name is required.");
    }
    if (!CUSTOM_UNIT_TYPES.some((type) => type.name === form.unitType)) {
        errors.push("Choose a unit type.");
    }
    if (!CUSTOM_TECHNOLOGIES.some((tech) => tech.name === form.technology)) {
        errors.push("Choose a technology base.");
    }
    if (!form.author.trim()) {
        errors.push("Author / designer is required so the entry can be attributed.");
    }

    const tonnage = form.tonnage.trim();
    if (!tonnage || isNaN(+tonnage) || +tonnage < 0) {
        errors.push("Tonnage must be a number of 0 or more.");
    }
    if (form.dateIntroduced.trim() && !INTEGER.test(form.dateIntroduced.trim())) {
        errors.push("Intro year must be a year, e.g. 3067.");
    }
    requireInt("Battle Value", form.battleValue || "0", 0, 1_000_000);
    requireInt("Point Value", form.pointValue, 1, 1000);
    requireInt("Size", form.size, 1, 4);
    requireInt("TMM", form.tmm, 0, 5);
    requireInt("Armor", form.armor, 0, 200);
    requireInt("Structure", form.structure, 1, 200);
    requireInt("Threshold", form.threshold || "0", 0, 50);
    requireInt("Overheat", form.overheat || "0", 0, 10);

    if (!MOVE.test(form.move.trim())) {
        errors.push("Move must look like 8\", 8\"/6\"j, 10\"j or 5a.");
    }

    const damageFields: [string, string][] = [
        ["Short damage", form.damageShort],
        ["Medium damage", form.damageMedium],
        ["Long damage", form.damageLong],
        ["Extreme damage", form.damageExtreme],
    ];
    for (const [label, value] of damageFields) {
        if (!DAMAGE.test(value.trim())) {
            errors.push(`${label} must be a whole number or 0* (minimal damage).`);
        }
    }

    const identity = mulIdentity(form.name, form.variant);
    if (form.name.trim()) {
        const clash = context.customRecords.find(
            (record) => record.MulUnitKey !== context.editingKey && mulIdentity(record.Name, record.Variant) === identity
        );
        if (clash) {
            errors.push(`A custom unit named "${`${form.name.trim()} ${form.variant.trim()}`.trim()}" already exists.`);
        }
        if (context.canonicalIdentities?.has(identity)) {
            errors.push("That name and variant is a canonical unit on the current MUL; customs are for non-canonical units only.");
        }
    }

    return errors;
}

export function nextCustomMULId(records: IASMULUnit[]): number {
    return Math.max(CUSTOM_MUL_ID_START, ...records.map((record) => record.Id ?? 0)) + 1;
}

export function newCustomMULKey(): string {
    return CUSTOM_MUL_KEY_PREFIX + generateUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

// Builds a full MUL-shaped record. Call validateCustomMULForm() first; this assumes valid input.
export function buildCustomMULRecord(
    form: ICustomMULForm,
    identity: { id: number; key: string; createdAt: string },
    now: string = new Date().toISOString(),
): IASMULUnit {
    const unitType = CUSTOM_UNIT_TYPES.find((type) => type.name === form.unitType) ?? CUSTOM_UNIT_TYPES[0];
    const technology = CUSTOM_TECHNOLOGIES.find((tech) => tech.name === form.technology) ?? CUSTOM_TECHNOLOGIES[0];
    const short = parseDamage(form.damageShort);
    const medium = parseDamage(form.damageMedium);
    const long = parseDamage(form.damageLong);
    const extreme = parseDamage(form.damageExtreme);
    const tonnage = +form.tonnage.trim();

    return {
        Id: identity.id,
        MulUnitKey: identity.key,
        Name: form.name.trim(),
        Variant: form.variant.trim() || null,
        Class: unitType.name,
        GroupName: null,
        FormatedTonnage: String(tonnage),
        Tonnage: tonnage,
        BattleValue: +(form.battleValue.trim() || 0),
        Cost: 0,
        DateIntroduced: form.dateIntroduced.trim(),
        EraIcon: "",
        EraId: +(form.eraId || 0),
        EraStart: 0,
        ImageUrl: "",
        IsFeatured: false,
        IsPublished: true,
        RS: "",
        RSId: 0,
        Release: 0,
        Rules: form.rules,
        Skill: 4,
        TRO: "",
        TROId: 0,
        Role: { Id: 0, Name: form.role.trim() || "None", Image: null, SortOrder: 0 },
        Technology: { Id: technology.id, Name: technology.name, Image: null, SortOrder: 0 },
        Type: { Id: unitType.typeId, Name: unitType.name, Image: null, SortOrder: 0 },
        BFType: unitType.bfType,
        BFSize: +form.size.trim(),
        BFMove: form.move.trim(),
        BFTMM: +form.tmm.trim(),
        BFArmor: +form.armor.trim(),
        BFStructure: +form.structure.trim(),
        BFThreshold: +(form.threshold.trim() || 0),
        BFPointValue: +form.pointValue.trim(),
        BFOverheat: +(form.overheat.trim() || 0),
        BFDamageShort: short.value,
        BFDamageMedium: medium.value,
        BFDamageLong: long.value,
        BFDamageExtreme: extreme.value,
        BFDamageShortMin: short.minimal,
        BFDamageMediumMin: medium.minimal,
        BFDamageLongMin: long.minimal,
        BFDamageExtremeMin: extreme.minimal,
        BFAbilities: form.abilities.split(",").map((ability) => ability.trim()).filter(Boolean).join(",") || null,
        CustomInfo: {
            author: form.author.trim(),
            source: form.source.trim(),
            notes: form.notes.trim(),
            createdAt: identity.createdAt,
            updatedAt: now,
        },
    } as IASMULUnit;
}

// The shared-list form of a record: loader and browser-only fields removed.
export function toSharedCustomMULRecord(record: IASMULUnit): IASMULUnit {
    const shared: IASMULUnit = { ...record };
    delete shared.MulSource;
    if (shared.CustomInfo) {
        shared.CustomInfo = { ...shared.CustomInfo };
        delete shared.CustomInfo.local;
        delete shared.CustomInfo.pullRequestUrl;
    }
    return shared;
}

// Stable, review-friendly file contents: sorted by name/variant, loader/browser-only fields stripped.
export function serializeCustomMULRecords(records: IASMULUnit[]): string {
    const sorted = records
        .map(toSharedCustomMULRecord)
        .sort((a, b) => mulIdentity(a.Name, a.Variant).localeCompare(mulIdentity(b.Name, b.Variant)));
    return `${JSON.stringify(sorted, null, 2)}\n`;
}

// Adds or replaces (by MulUnitKey) `entries` in the shared list's current file text. An entry whose
// Id is already used by a different unit (someone else's entry merged since this one was created)
// gets the next free Id. Returns the new file text.
export function mergeCustomMULEntries(currentFileText: string | null, entries: IASMULUnit[]): string {
    const parsed = currentFileText ? JSON.parse(currentFileText) : [];
    const records: IASMULUnit[] = Array.isArray(parsed) ? parsed : [];

    for (const entry of entries.map(toSharedCustomMULRecord)) {
        const index = records.findIndex((record) => record.MulUnitKey === entry.MulUnitKey);
        if (index > -1) {
            records[index] = { ...entry, Id: records[index].Id };
            continue;
        }
        const idTaken = records.some((record) => record.Id === entry.Id);
        records.push(idTaken ? { ...entry, Id: nextCustomMULId(records) } : entry);
    }

    return serializeCustomMULRecords(records);
}
