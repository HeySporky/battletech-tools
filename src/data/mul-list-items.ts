import type { IASMULUnit, MULSource } from "../classes/alpha-strike-unit";

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

// Which bundled lists the user wants searched. Each option is a superset of the one before it.
export type MULSourceSelection = "mul2" | "mul2+mul1";

export const DEFAULT_MUL_SOURCE_SELECTION: MULSourceSelection = "mul2";

export const MUL_SOURCE_SELECTIONS: { value: MULSourceSelection; label: string; description: string }[] = [
    {
        value: "mul2",
        label: "MUL 2.0",
        description: "Only units on the current Master Unit List (masterunitlist.battletech.com).",
    },
    {
        value: "mul2+mul1",
        label: "MUL 2.0 + MUL 1.0 leftovers",
        description: "Adds legacy MUL 1.0 records that the current MUL no longer lists.",
    },
];

export const MUL_SOURCE_LABELS: Record<MULSource, string> = {
    mul2: "MUL 2.0",
    mul1: "MUL 1.0",
};

export function isMULSourceSelection(value: unknown): value is MULSourceSelection {
    return MUL_SOURCE_SELECTIONS.some((option) => option.value === value);
}

export function getMULSourcesForSelection(selection: MULSourceSelection): MULSource[] {
    switch (selection) {
        case "mul2+mul1":
            return ["mul2", "mul1"];
        default:
            return ["mul2"];
    }
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

type ChunkLoaders = Record<string, () => Promise<unknown>>;

const mulChunkModulesBySource: Record<MULSource, ChunkLoaders> = {
    mul2: import.meta.glob("./mul/live/*.json", { eager: false, import: "default" }) as ChunkLoaders,
    mul1: import.meta.glob("./mul/mul1/*.json", { eager: false, import: "default" }) as ChunkLoaders,
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
    if (!item.MulUnitKey || (typeof item.Role !== "string" && item.Type)) {
        return item;
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
                    const chunkData = await loader();
                    const entries = Array.isArray(chunkData) ? chunkData : [];
                    return entries
                        .filter(isMULListEntry)
                        .map((entry) => ({ ...normalizeLiveEntry(entry), MulSource: source }));
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
    const lists = await Promise.all(getMULSourcesForSelection(selection).map(loadMULSource));

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
