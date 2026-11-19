import type { IASMULUnit, MULSource } from "../classes/alpha-strike-unit";
import { getLocalCustomMULUnits, saveLocalCustomMULUnits } from "./custom-mul-local";
import { reconcileLocalCustomMUL } from "./custom-mul";
import { correctMULBattleValue } from "./mul-bv-corrections";
import { untabulate } from "../utils/packed-json";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*/

type MULChunkEntry = Partial<IASMULUnit> & {
    Id?: number;
    Name?: string;
    Class?: string;
    Variant?: string;
};

// Which bundled lists the user wants searched: any of them, ticked one by one, never none.
export type MULSourceSelection = MULSource[];

export const DEFAULT_MUL_SOURCE_SELECTION: MULSourceSelection = ["mul2"];

export const MUL_SOURCE_OPTIONS: { value: MULSource; label: string; description: string }[] = [
    {
        value: "mul2",
        label: "MUL 2.0 (live)",
        description: "Units on the current Master Unit List (masterunitlist.battletech.com).",
    },
    {
        value: "mul1",
        label: "MUL 1.0 leftovers",
        description: "Legacy MUL 1.0 records that the current MUL no longer lists.",
    },
    {
        value: "custom",
        label: "Custom units",
        description: "Non-canonical units, such as the ArtVees: the shared curated list plus any saved in this browser.",
    },
];

export const MUL_SOURCE_LABELS: Record<MULSource, string> = {
    mul2: "MUL 2.0",
    mul1: "MUL 1.0",
    custom: "Custom",
};

const MUL_SOURCE_ORDER: MULSource[] = MUL_SOURCE_OPTIONS.map((option) => option.value);

/**
 * Reads a saved list choice: an array of sources, or the "mul2+mul1+custom" strings saved before the lists became
 * checkboxes. Returns the sources in a fixed order, or null when nothing valid is left.
 */
export function normalizeMULSourceSelection(value: unknown): MULSourceSelection | null {
    const parts: unknown[] = Array.isArray(value) ? value : typeof value === "string" ? value.split("+") : [];
    const sources = MUL_SOURCE_ORDER.filter((source) => parts.includes(source));
    return sources.length > 0 ? sources : null;
}

const LEGACY_TYPE_ID_BY_NAME: Record<string, number> = {
    BattleMech: 18,
    "Combat Vehicle": 19,
    OmniVehicle: 19,
    "Fighter Craft": 17,
    "Aerospace Craft": 17,
    "Battle Armor": 22,
    Infantry: 21,
    ProtoMech: 23,
    IndustrialMech: 20,
    "Support Vehicle": 24,
    "Advanced Support": 24,
};

const LEGACY_ERA_ID_BY_LIVE_ID: Record<number, number> = {
    2: 10, 3: 11, 4: 13, 5: 14, 6: 15, 7: 16,
    8: 247, 10: 254, 11: 255, 12: 256, 13: 257,
};

// MUL 2.0 renumbered its factions from id 37 up (the site's /data/factions.json, read 2026-09-30); the legacy
// ids in getMULFactionLabels() are MUL 1.0's. Pairs match on the exact faction name. Factions with no single
// legacy id (a merged list, or new since MUL 1.0) take MUL_LIVE_ONLY_FACTION_OFFSET + their live id.
export const MUL_LIVE_ONLY_FACTION_OFFSET = 1000;

const LEGACY_FACTION_ID_BY_LIVE_ID: Record<number, number> = {
    37: 38, 38: 39, 39: 40, 40: 41, 43: 44, 45: 46, 46: 47, 47: 48, 48: 49,
    53: 59, 54: 60, 55: 67, 56: 72, 57: 74, 58: 75, 59: 76, 60: 77, 61: 78, 62: 80,
    63: 82, 64: 83, 65: 84, 67: 86, 68: 87, 70: 89, 73: 91, 74: 94, 75: 95,
    79: 100, 80: 101, 81: 102, 82: 104, 83: 105,
};

// Rim Worlds Republic (legacy splits it into Home Guard 42 / Terran Corps 88), Star League (First) (legacy
// Royal 43 / Regular 45 / General 90 / SLDF 111), ilClan Wolf and Jade Falcon Remnant.
const LIVE_ONLY_FACTION_IDS = [41, 44, 76, 190];

export function getLegacyMULFactionID(liveID: number): number {
    if (liveID in LEGACY_FACTION_ID_BY_LIVE_ID) {
        return LEGACY_FACTION_ID_BY_LIVE_ID[liveID];
    }
    if (LIVE_ONLY_FACTION_IDS.includes(liveID)) {
        return MUL_LIVE_ONLY_FACTION_OFFSET + liveID;
    }
    return liveID;
}

type ChunkLoaders = Record<string, () => Promise<unknown>>;

const mulChunkModulesBySource: Record<MULSource, ChunkLoaders> = {
    mul2: import.meta.glob("./mul/live/*.json", { eager: false, import: "default" }) as ChunkLoaders,
    mul1: import.meta.glob("./mul/mul1/*.json", { eager: false, import: "default" }) as ChunkLoaders,
    custom: import.meta.glob("./mul/custom/*.json", { eager: false, import: "default" }) as ChunkLoaders,
};

const cachedBySource: Partial<Record<MULSource, Promise<IASMULUnit[]>>> = {};

function isMULListEntry(item: unknown): item is IASMULUnit {
    if (!item || typeof item !== "object") {
        return false;
    }

    const record = item as MULChunkEntry;
    return typeof record.Id === "number" && typeof record.Name === "string" && typeof record.Class === "string";
}

function normalizeLiveEntry(item: IASMULUnit): IASMULUnit {
    if (!item.MulUnitKey) {
        return item;
    }

    // The sync writes legacy era ids but live-site faction ids, so faction ids are always mapped here.
    if (typeof item.Role !== "string" && item.Type) {
        return {
            ...item,
            Availability: item.Availability?.map(entry => ({
                ...entry,
                FactionIds: entry.FactionIds.map(getLegacyMULFactionID),
            })),
        };
    }

    const roleName = typeof item.Role === "string" ? item.Role : item.Role?.Name ?? "None";
    return {
        ...item,
        Role: { Id: 0, Name: roleName, Image: null, SortOrder: 0 },
        Type: {
            Id: LEGACY_TYPE_ID_BY_NAME[item.Class] ?? 0,
            Name: item.Class,
            Image: null,
            SortOrder: 0,
        },
        EraId: LEGACY_ERA_ID_BY_LIVE_ID[item.EraId] ?? item.EraId,
        Availability: item.Availability?.map(entry => ({
            ...entry,
            EraId: LEGACY_ERA_ID_BY_LIVE_ID[entry.EraId] ?? entry.EraId,
            FactionIds: entry.FactionIds.map(getLegacyMULFactionID),
        })),
    };
}

export function getMULRecordKey(unit: IASMULUnit): string {
    return unit.MulUnitKey ?? `${unit.MulSource ?? "mul2"}\u001f${unit.Id}\u001f${unit.Name}\u001f${unit.Variant ?? ""}\u001f${unit.Class}`;
}

function loadMULSource(source: MULSource): Promise<IASMULUnit[]> {
    const cached = cachedBySource[source];
    if (cached) {
        return cached;
    }

    const pending = (async () => {
        const chunkResults = await Promise.all(
            Object.entries(mulChunkModulesBySource[source]).map(async ([path, loader]) => {
                try {
                    // A chunk is a table of records (packed-json.ts), or a plain list in files from before.
                    const chunkData = untabulate(await loader());
                    const entries = Array.isArray(chunkData) ? chunkData : [];
                    return entries
                        .filter(isMULListEntry)
                        .map((entry) => ({ ...normalizeLiveEntry(source === "mul2" ? correctMULBattleValue(entry) : entry), MulSource: source }));
                } catch (error) {
                    console.warn(`Unable to read MUL chunk ${path}:`, error);
                    return [] as IASMULUnit[];
                }
            })
        );
        return chunkResults.flat();
    })();

    cachedBySource[source] = pending;
    return pending;
}

export async function loadMULListItems(selection: MULSourceSelection = DEFAULT_MUL_SOURCE_SELECTION): Promise<IASMULUnit[]> {
    const sources = normalizeMULSourceSelection(selection) ?? DEFAULT_MUL_SOURCE_SELECTION;
    const lists = await Promise.all(sources.map(loadMULSource));

    // Read fresh on every call (never cached) so entries saved in the Custom MUL Editor show up at once.
    // They come before the shared list so a local edit of a shared entry wins for its author.
    // A local entry that duplicates a shared one is left out, and one whose Id a shared entry has since taken is
    // given the next free Id here and saved (#241).
    if (sources.includes("custom")) {
        const at = sources.indexOf("custom");
        const { records, shown, changed } = reconcileLocalCustomMUL(getLocalCustomMULUnits().filter(isMULListEntry), lists[at]);
        if (changed) saveLocalCustomMULUnits(records);
        lists.splice(at, 0, shown.map((entry) => ({ ...entry, MulSource: "custom" as const })));
    }

    const seen = new Set<string>();
    const uniqueItems: IASMULUnit[] = [];
    for (const item of lists.flat()) {
        const key = getMULRecordKey(item);
        if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
        }
    }
    return uniqueItems;
}
