import type { IASMULUnit } from "../classes/alpha-strike-unit";

type MULChunkEntry = Partial<IASMULUnit> & {
    Id?: number;
    Name?: string;
    Class?: string;
    Variant?: string;
};

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

const mulChunkModules = {
    ...import.meta.glob("./mul/*.json", { eager: false, import: "default" }),
    ...import.meta.glob("./mul/live/**/*.json", { eager: false, import: "default" }),
} as Record<string, () => Promise<unknown>>;

let cachedMULListItems: IASMULUnit[] | null = null;
let pendingMULListItems: Promise<IASMULUnit[]> | null = null;

function isMULListEntry(item: unknown): item is IASMULUnit {
    if (!item || typeof item !== "object") {
        return false;
    }

    const record = item as Record<string, unknown>;
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

export let mulListItems: IASMULUnit[] = [];

export async function loadMULListItems(): Promise<IASMULUnit[]> {
    if (cachedMULListItems) {
        return cachedMULListItems;
    }

    if (pendingMULListItems) {
        return pendingMULListItems;
    }

    pendingMULListItems = (async () => {
        const chunkResults = await Promise.all(
            Object.entries(mulChunkModules).map(async ([path, loader]) => {
                try {
                    const chunkData = await loader();
                    const entries = Array.isArray(chunkData) ? chunkData : [];
                    return entries.filter(isMULListEntry).map(normalizeLiveEntry);
                } catch (error) {
                    console.warn(`Unable to read MUL chunk ${path}:`, error);
                    return [] as IASMULUnit[];
                }
            })
        );

        const uniqueItems = chunkResults
            .flat()
            .filter((item, index, records) =>
                records.findIndex((candidate) =>
                    candidate.Id === item.Id &&
                    candidate.Name === item.Name &&
                    candidate.Class === item.Class &&
                    candidate.Variant === item.Variant
                ) === index
            );

        cachedMULListItems = uniqueItems;
        mulListItems = uniqueItems;
        return uniqueItems;
    })();

    return pendingMULListItems;
}
