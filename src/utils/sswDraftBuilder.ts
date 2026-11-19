import type { CustomContentKind, ICustomContentDraft, ICustomContentSource, ISSWUnresolvedItem } from "../data/custom-content-types";
import { CANON_COMPONENT_TEMPLATES, CUSTOM_COMPONENT_CATALOGS } from "../data/custom-component-registry";
import { getEquipmentCatalogById } from "../data/equipment-registry";
import { isSSWCanonPending } from "../data/ssw/ssw-canon-pending-names";
import { ammoSlug, buildCustomTag, PROVISIONAL_SUBMITTER, slugifyName } from "./customTags";
import { generateUUID } from "./generateUUID";

// Turns the items an SSW import could not resolve into custom content drafts: one per kind, faction and name,
// with what the file says (name, tons, an estimated slot count) and every other stat unknown (null).

export interface IDraftSourceEntry {
    item: ISSWUnresolvedItem;
    slots: number;
    /** The slot count is the file's own (a split item's counts), not an estimate. */
    slotsExact?: boolean;
    design: string;
    source: ICustomContentSource;
}

/** SSW stores only an item's first slot: count free slots from there to the next occupied one. */
export function estimateSlots(start: number, occupancy: boolean[]): number {
    if (start < 0 || start >= occupancy.length) return 1;
    let end = start + 1;
    while (end < occupancy.length && !occupancy[end]) end++;
    return end - start;
}

/**
 * An unresolved item's slots. A split item has SSW's slot count for each location; any other item has only its
 * first slot, so the count is estimated (estimateSlots) and the user confirms it.
 */
export function estimateItemSlots(item: ISSWUnresolvedItem, occupancyFor: (location: string) => boolean[]): { slots: number; exact: boolean } {
    const splits = item.splitLocations ?? [];
    if (splits.length > 0 && splits.every((split) => split.number > 0)) {
        return { slots: splits.reduce((sum, split) => sum + split.number, 0), exact: true };
    }
    if (splits.length > 0) {
        return { slots: splits.reduce((sum, split) => sum + (split.number > 0 ? split.number : estimateSlots(split.index, occupancyFor(split.location))), 0), exact: false };
    }
    return { slots: estimateSlots(item.slotIndex, occupancyFor(item.location)), exact: false };
}

/** A new draft id; crypto.randomUUID only exists on a secure origin (https or localhost), so LAN dev over http falls back. */
export function newDraftId(): string {
    return typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : generateUUID();
}

export function targetCatalogFor(kind: CustomContentKind, sswType: string): string {
    if (kind === "ammunition") return "ammo-custom";
    if (kind === "quirk") return "quirks-custom";
    if (kind !== "equipment") return CUSTOM_COMPONENT_CATALOGS[kind].id;
    switch (sswType) {
        case "energy": return "energy-custom";
        case "ballistic": return "ballistic-custom";
        case "missile": return "missile-custom";
        default: return "misc-custom";
    }
}

const unknownValues = (value: unknown): unknown => {
    if (value === null || typeof value === "number") return null;
    if (typeof value === "string") return "";
    if (typeof value === "boolean") return false;
    if (Array.isArray(value)) return [];
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, unknownValues(entry)]));
};

// The misc and ammo custom files open with code-built Future Wars and ArtVee records; drafts keep the template they
// had before the custom files were merged by category.
const TEMPLATE_TAGS: Record<string, string> = { "misc-custom": "custom-null-signature-system", "ammo-custom": "ammo-ac-15-standard" };

/** The target catalog's template entry (canon's first record for an empty component catalog), every value unknown. */
export function blankTemplate(kind: CustomContentKind, targetCatalogId: string): Record<string, unknown> {
    const catalog = getEquipmentCatalogById(targetCatalogId);
    const first = kind === "quirk" ? {}
        : kind === "equipment" || kind === "ammunition"
            ? catalog?.find((item) => item.tag === TEMPLATE_TAGS[targetCatalogId]) ?? catalog?.[0]
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
    quirk: ["name", "summary"],
};
const WEAPON_FIELDS = ["damage", "heat", "range.short", "range.medium", "range.long"];

const valueAt = (record: Record<string, unknown>, path: string): unknown =>
    path.split(".").reduce<unknown>((value, key) => (value as Record<string, unknown> | null)?.[key], record);

export function missingFields(draft: ICustomContentDraft): string[] {
    // Drafts saved before the custom files were split by category name the old misc catalog.
    const isWeapon = draft.kind === "equipment" && !["misc-custom", "mech-custom-equipment-weapons-misc"].includes(draft.targetCatalogId);
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

// A source is one file's content: two files with the same name but different text are two sources.
const addSource = (draft: ICustomContentDraft, entry: IDraftSourceEntry): void => {
    const existing = draft.sourceFiles.find((source) => source.fileName === entry.source.fileName && source.sha256 === entry.source.sha256);
    if (!existing) {
        draft.sourceFiles.push({ ...entry.source, designs: [entry.design] });
    } else if (!existing.designs.includes(entry.design)) {
        existing.designs.push(entry.design);
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
    if (isAmmo) {
        record.isAmmo = true;
        record.isSpecialAmmo = !String(record.tag).endsWith("-standard");
        // "Ammo (Widget Launcher)" feeds the weapon named "Widget Launcher": its per-weapon ammo tag (ammo-<weapon
        // tag>) is how a weapon finds ammo that names it (getWeaponAmmoFamilies).
        const weaponName = entry.item.name.replace(/^ammo\s*\((.*)\)$/i, "$1");
        const weaponTag = buildCustomTag({ submitter: PROVISIONAL_SUBMITTER, faction: entry.item.faction, slug: slugifyName(weaponName), isAmmo: false });
        record.altTags = [`ammo-${weaponTag}`];
    }
    if (entry.item.tons !== null && "weight" in record) record.weight = entry.item.tons;
    if (kind === "equipment" && record.space && typeof record.space === "object") {
        (record.space as Record<string, unknown>).battlemech = entry.slots;
    }
    record.notes = `Placeholder drafted from the SSW import of ${entry.design}; stats not yet entered.`;
    return {
        id, kind, faction: entry.item.faction, targetCatalogId, record, status: "draft",
        slotsEstimated: kind === "equipment" && !entry.slotsExact, sourceFiles: [], sourceNote: "",
    };
};

export function buildDrafts(
    entries: IDraftSourceEntry[],
    existing: ICustomContentDraft[],
    newId: () => string = newDraftId,
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
