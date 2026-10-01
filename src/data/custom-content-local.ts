import type { IEquipmentItem } from "./data-interfaces";
import type { ICustomContentDraft } from "./custom-content-types";
import { CUSTOM_COMPONENT_KINDS, setLocalCustomComponents } from "./custom-component-registry";
import { setLocalCustomEquipment } from "./equipment-registry";
import { resetImportedEquipmentIndex } from "../utils/importedEquipment";

// Custom content drafts saved in this browser only, made from imported designs. They are registered with the
// equipment (and component) registries so designs that use them load; they can later be proposed for the
// shared custom catalogs.
const LOCAL_CUSTOM_CONTENT_STORAGE_KEY = "localCustomContent";
const DATE_FIELDS = new Set(["introduced", "extinct", "reintroduced", "prototype"]);

export function getLocalCustomContentDrafts(): ICustomContentDraft[] {
    try {
        if (typeof localStorage === "undefined") {
            return [];
        }
        const parsed = JSON.parse(localStorage.getItem(LOCAL_CUSTOM_CONTENT_STORAGE_KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Returns false when storage is unavailable (private mode, quota), so callers can warn the user. The drafts are
// registered either way, so the current session can use them.
export function saveLocalCustomContentDrafts(drafts: ICustomContentDraft[]): boolean {
    registerLocalCustomContent(drafts);
    try {
        localStorage.setItem(LOCAL_CUSTOM_CONTENT_STORAGE_KEY, JSON.stringify(drafts));
        return true;
    } catch {
        return false;
    }
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
    resetImportedEquipmentIndex();
}
