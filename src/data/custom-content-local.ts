import type { IEquipmentItem } from "./data-interfaces";
import type { ICustomContentDraft } from "./custom-content-types";
import { CUSTOM_COMPONENT_KINDS, setLocalCustomComponents } from "./custom-component-registry";
import { setLocalCustomEquipment } from "./equipment-registry";
import type { IQuirk, QuirkAttach, QuirkUnitType } from "./quirk-interfaces";
import { setLocalCustomQuirks } from "./quirk-registry";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { resetImportedEquipmentIndex } from "../utils/importedEquipment";
import { missingFields } from "../utils/sswDraftBuilder";
import { setIncompleteCustomContent } from "./custom-content-incomplete";

// Custom content drafts saved in this browser only, made from imported designs. They are registered with the
// equipment (and component) registries so designs that use them load; they can later be proposed for the
// shared custom catalogs.
const LOCAL_CUSTOM_CONTENT_STORAGE_KEY = "localCustomContent";
// The source .ssw text of the drafts, by SHA-256, for the evidence branch of a submission. Stored once per file,
// apart from the drafts: a file that makes several drafts would otherwise be stored once in each.
const LOCAL_CUSTOM_CONTENT_EVIDENCE_KEY = "localCustomContentEvidence";
const DATE_FIELDS = new Set(["introduced", "extinct", "reintroduced", "prototype"]);

const DRAFT_KINDS = new Set<string>(["equipment", "ammunition", "quirk", ...CUSTOM_COMPONENT_KINDS]);

// Stats the construction and Battle Value maths read as numbers. In a stored record each is a number, null
// (unknown) or absent; `damage` and `criticals` may instead be an object of such values.
const NUMERIC_FIELDS = ["weight", "heat", "heatAero", "cbills", "battleValue", "battleValueDefensive", "criticals",
    "damage", "damageAero", "roundsPerTon", "shotsPerTon", "rulesLevel", "introduced", "extinct", "reintroduced"];

const isStat = (value: unknown, nested: boolean = true): boolean => {
    if (value === null || typeof value === "undefined") return true;
    if (typeof value === "number") return Number.isFinite(value);
    return nested && typeof value === "object" && !Array.isArray(value)
        && Object.values(value as Record<string, unknown>).every((entry) => isStat(entry, false));
};

// The quirk registry reads these on every lookup and offer.
const isWellFormedQuirk = (record: Record<string, unknown>): boolean =>
    (record.kind === "positive" || record.kind === "negative") && !!record.cost && typeof record.cost === "object"
    && ["altNames", "unitTypes", "attaches", "editions", "sources"].every((field) => Array.isArray(record[field]))
    && typeof record.summary === "string";

// Storage is user-editable: one malformed entry must not break startup or every later lookup, so drop it.
const isWellFormedDraft = (value: unknown): value is ICustomContentDraft => {
    const draft = value as ICustomContentDraft | null;
    return !!draft && typeof draft === "object" && typeof draft.id === "string" && DRAFT_KINDS.has(draft.kind)
        && !!draft.record && typeof draft.record === "object" && !Array.isArray(draft.record)
        && typeof draft.record.name === "string" && typeof draft.record.tag === "string"
        && NUMERIC_FIELDS.every((field) => isStat(draft.record[field]))
        && (draft.kind !== "quirk" || isWellFormedQuirk(draft.record))
        && Array.isArray(draft.sourceFiles);
};

export interface ICustomQuirkFields {
    name: string;
    kind: "positive" | "negative";
    /** The quirk's value as a plain number; the kind gives its sign. */
    points: number;
    attaches: QuirkAttach[];
    unitTypes: QuirkUnitType[];
    summary: string;
}

/** The tag a custom quirk of this name gets: "quirk-custom-" and the name in kebab case. */
export const customQuirkTag = (name: string): string =>
    "quirk-custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** A custom quirk as a draft saved in this browser, offered in every edition from the custom rules level up. */
export function buildCustomQuirkDraft(id: string, fields: ICustomQuirkFields): ICustomContentDraft {
    const record: IQuirk = {
        tag: customQuirkTag(fields.name),
        name: fields.name.trim(),
        altNames: [],
        kind: fields.kind,
        cost: { points: Math.abs(fields.points) },
        unitTypes: [...fields.unitTypes],
        attaches: [...fields.attaches],
        summary: fields.summary.trim(),
        sources: [],
        editions: [],
        rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        custom: true,
    };
    return {
        id, kind: "quirk", faction: "universal", targetCatalogId: "quirks-custom",
        record: record as unknown as Record<string, unknown>,
        status: "complete", slotsEstimated: false, sourceFiles: [], sourceNote: "",
    };
}

export function getLocalCustomContentDrafts(): ICustomContentDraft[] {
    try {
        if (typeof localStorage === "undefined") {
            return [];
        }
        const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_CUSTOM_CONTENT_STORAGE_KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter(isWellFormedDraft) : [];
    } catch {
        return [];
    }
}

// Returns false when storage is unavailable (private mode, quota), so callers can warn the user. The drafts are
// registered either way, so the current session can use them. Source text a draft carries from before the
// evidence store (sourceXml) moves there.
export function saveLocalCustomContentDrafts(drafts: ICustomContentDraft[]): boolean {
    registerLocalCustomContent(drafts);
    const legacy: Record<string, string> = {};
    const stored = drafts.map((draft) => {
        if (!draft.sourceXml) return draft;
        for (const source of draft.sourceFiles) {
            const xml = draft.sourceXml[source.fileName];
            if (xml !== undefined && source.sha256) legacy[source.sha256] = xml;
        }
        const rest = { ...draft };
        delete rest.sourceXml;
        return rest;
    });
    if (Object.keys(legacy).length > 0) saveLocalCustomContentEvidence(legacy, stored);
    try {
        localStorage.setItem(LOCAL_CUSTOM_CONTENT_STORAGE_KEY, JSON.stringify(stored));
        return true;
    } catch {
        return false;
    }
}

export function getLocalCustomContentEvidence(): Record<string, string> {
    try {
        if (typeof localStorage === "undefined") return {};
        const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_CUSTOM_CONTENT_EVIDENCE_KEY) ?? "{}");
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
        return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).filter(([, xml]) => typeof xml === "string")) as Record<string, string>;
    } catch {
        return {};
    }
}

/**
 * Adds source text by SHA-256 to the evidence store, keeping only files some draft still names. Returns false
 * when storage refuses it (private mode, quota); the drafts themselves are unaffected.
 */
export function saveLocalCustomContentEvidence(evidence: Record<string, string>, drafts: ICustomContentDraft[]): boolean {
    const used = new Set(drafts.flatMap((draft) => draft.sourceFiles.map((source) => source.sha256)));
    const merged = Object.fromEntries(Object.entries({ ...getLocalCustomContentEvidence(), ...evidence }).filter(([sha]) => used.has(sha)));
    try {
        localStorage.setItem(LOCAL_CUSTOM_CONTENT_EVIDENCE_KEY, JSON.stringify(merged));
        return true;
    } catch {
        return false;
    }
}

/** A draft whose stats are not all entered: BV, heat and cost of a design using it are not reliable. */
export function isIncompleteDraft(draft: ICustomContentDraft): boolean {
    return draft.kind !== "quirk" && (draft.status !== "complete" || missingFields(draft).length > 0);
}

/** A copy the construction code can use: unknown (null) stats become 0; unknown dates stay null. */
export function toRuntimeRecord<T>(record: Record<string, unknown>): T {
    const convert = (value: unknown, key: string): unknown => {
        if (value === null) return DATE_FIELDS.has(key) ? null : 0;
        if (Array.isArray(value)) return value.map((entry) => convert(entry, key));
        if (typeof value === "object") {
            return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, convert(v, k)]));
        }
        return value;
    };
    return convert(record, "") as T;
}

export function registerLocalCustomContent(drafts: ICustomContentDraft[] = getLocalCustomContentDrafts()): void {
    setLocalCustomEquipment(drafts
        .filter((draft) => draft.kind === "equipment" || draft.kind === "ammunition")
        .map((draft) => toRuntimeRecord<IEquipmentItem>(draft.record)));
    for (const kind of CUSTOM_COMPONENT_KINDS) {
        setLocalCustomComponents(kind, drafts
            .filter((draft) => draft.kind === kind)
            .map((draft) => toRuntimeRecord(draft.record)));
    }
    setLocalCustomQuirks(drafts.filter((draft) => draft.kind === "quirk").map((draft) => draft.record as unknown as IQuirk));
    setIncompleteCustomContent(drafts.filter(isIncompleteDraft).map((draft) => ({ tag: String(draft.record.tag), name: String(draft.record.name) })));
    resetImportedEquipmentIndex();
}
