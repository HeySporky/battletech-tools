import type { CustomContentKind, ICustomContentDraft, ICustomContentSource, ISSWUnresolvedItem } from "../data/custom-content-types";
import { CANON_COMPONENT_TEMPLATES, CUSTOM_COMPONENT_CATALOGS } from "../data/custom-component-registry";
import { getEquipmentCatalogById } from "../data/equipment-registry";
import { isSSWCanonPending } from "../data/ssw/ssw-canon-pending-names";
import { ammoSlug, buildCustomTag, PROVISIONAL_SUBMITTER, slugifyName } from "./customTags";

// Turns the items an SSW import could not resolve into custom content drafts: one per kind, faction and name,
// with what the file says (name, tons, an estimated slot count) and every other stat unknown (null).

export interface IDraftSourceEntry {
    item: ISSWUnresolvedItem;
    slots: number;
    design: string;
    source: ICustomContentSource;
    /** The file's text, kept with the draft for the PR's evidence branch. */
    xml?: string;
}

/** SSW stores only an item's first slot: count free slots from there to the next occupied one. */
export function estimateSlots(start: number, occupancy: boolean[]): number {
    if (start < 0 || start >= occupancy.length) return 1;
    let end = start + 1;
    while (end < occupancy.length && !occupancy[end]) end++;
    return end - start;
}

export function targetCatalogFor(kind: CustomContentKind, sswType: string): string {
    if (kind === "ammunition") return "mech-custom-ammo";
    if (kind !== "equipment") return CUSTOM_COMPONENT_CATALOGS[kind].id;
    switch (sswType) {
        case "energy": return "mech-custom-equipment-weapons-energy";
        case "ballistic": return "mech-custom-equipment-weapons-ballistic";
        case "missile": return "mech-custom-equipment-weapons-missile";
        default: return "mech-custom-equipment-weapons-misc";
    }
}

const unknownValues = (value: unknown): unknown => {
    if (value === null || typeof value === "number") return null;
    if (typeof value === "string") return "";
    if (typeof value === "boolean") return false;
    if (Array.isArray(value)) return [];
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, unknownValues(entry)]));
};

/** The target catalog's first entry (canon's first record for an empty component catalog), every value unknown. */
export function blankTemplate(kind: CustomContentKind, targetCatalogId: string): Record<string, unknown> {
    const first = kind === "equipment" || kind === "ammunition"
        ? getEquipmentCatalogById(targetCatalogId)?.[0]
        : CANON_COMPONENT_TEMPLATES[kind];
    return unknownValues(JSON.parse(JSON.stringify(first ?? {}))) as Record<string, unknown>;
}

export const REQUIRED_FIELDS: Record<CustomContentKind, string[]> = {
    equipment: ["weight", "space.battlemech", "battleValue", "cbills", "introduced"],
    ammunition: ["weight", "roundsPerTon", "battleValue", "cbills", "introduced"],
    armor: ["armorMultiplier.is", "armorMultiplier.clan", "costMultiplier", "introduced"],
    structure: ["crits.is", "crits.clan", "cost", "introduced"],
    engine: ["costMultiplier", "introduced"],
    gyro: ["weight_multiplier", "criticals", "costMultiplier", "introduced"],
    heatSink: ["dissipation", "cost", "introduced"],
    jumpJet: ["weight_multiplier.light", "weight_multiplier.medium", "weight_multiplier.heavy", "criticals", "costMultiplier", "introduced"],
    myomer: ["criticals", "costPerTon", "bvWeightMultiplier", "introduced"],
};
const WEAPON_FIELDS = ["damage", "heat", "range.short", "range.medium", "range.long"];

const valueAt = (record: Record<string, unknown>, path: string): unknown =>
    path.split(".").reduce<unknown>((value, key) => (value as Record<string, unknown> | null)?.[key], record);

export function missingFields(draft: ICustomContentDraft): string[] {
    const isWeapon = draft.kind === "equipment" && draft.targetCatalogId !== "mech-custom-equipment-weapons-misc";
    const paths = [...REQUIRED_FIELDS[draft.kind], ...(isWeapon ? WEAPON_FIELDS : [])];
    const missing = paths.filter((path) => {
        const value = valueAt(draft.record, path);
        return value === null || value === undefined || value === "";
    });
    if (draft.slotsEstimated && draft.kind === "equipment") missing.push("slotsEstimated");
    if (draft.kind === "equipment") {
        // Domain legality is always an explicit choice: a slot count, or -1 for "cannot be mounted".
        for (const [key, value] of Object.entries((draft.record.space ?? {}) as Record<string, unknown>)) {
            if (value === null) missing.push(`space.${key}`);
        }
    }
    return missing;
}

export function draftMatches(draft: ICustomContentDraft, item: ISSWUnresolvedItem): boolean {
    const names = [draft.record.name, ...((draft.record.altNames as string[] | undefined) ?? [])]
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.trim().toLowerCase());
    const sameFaction = draft.faction === "universal" || draft.faction === item.faction;
    return draft.kind === item.kind && sameFaction && names.includes(item.name.trim().toLowerCase());
}

const addSource = (draft: ICustomContentDraft, entry: IDraftSourceEntry): void => {
    const existing = draft.sourceFiles.find((source) => source.fileName === entry.source.fileName);
    if (!existing) {
        draft.sourceFiles.push({ ...entry.source, designs: [entry.design] });
    } else if (!existing.designs.includes(entry.design)) {
        existing.designs.push(entry.design);
    }
    if (entry.xml !== undefined) {
        draft.sourceXml = { ...(draft.sourceXml ?? {}), [entry.source.fileName]: entry.xml };
    }
};

const newDraft = (entry: IDraftSourceEntry, id: string): ICustomContentDraft => {
    const kind = entry.item.kind as CustomContentKind;
    const targetCatalogId = targetCatalogFor(kind, entry.item.sswType);
    const record = blankTemplate(kind, targetCatalogId);
    const isAmmo = kind === "ammunition";
    record.name = entry.item.name;
    record.tag = buildCustomTag({
        submitter: PROVISIONAL_SUBMITTER, faction: entry.item.faction,
        slug: isAmmo ? ammoSlug(entry.item.name) : slugifyName(entry.item.name), isAmmo,
    });
    record.altNames = [entry.item.name];
    if ("altTags" in record) record.altTags = [];
    if ("book" in record || kind === "equipment" || isAmmo) record.book = "Custom";
    if ("page" in record) record.page = null;
    if (isAmmo) { record.isAmmo = true; record.isSpecialAmmo = false; }
    if (entry.item.tons !== null && "weight" in record) record.weight = entry.item.tons;
    if (kind === "equipment" && record.space && typeof record.space === "object") {
        (record.space as Record<string, unknown>).battlemech = entry.slots;
    }
    record.notes = `Placeholder drafted from the SSW import of ${entry.design}; stats not yet entered.`;
    return {
        id, kind, faction: entry.item.faction, targetCatalogId, record, status: "draft",
        slotsEstimated: kind === "equipment", sourceFiles: [], sourceNote: "",
    };
};

export function buildDrafts(
    entries: IDraftSourceEntry[],
    existing: ICustomContentDraft[],
    newId: () => string = () => crypto.randomUUID(),
): ICustomContentDraft[] {
    const drafts = existing.map((draft) => JSON.parse(JSON.stringify(draft)) as ICustomContentDraft);
    for (const entry of entries) {
        if (entry.item.kind === "cockpit" || isSSWCanonPending(entry.item.kind, entry.item.name)) continue;
        let draft = drafts.find((candidate) => draftMatches(candidate, entry.item));
        if (!draft) {
            draft = newDraft(entry, newId());
            drafts.push(draft);
        }
        addSource(draft, entry);
    }
    return drafts;
}
