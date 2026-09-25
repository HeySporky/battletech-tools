import type { IASMULUnit } from "../classes/alpha-strike-unit";

type MULChunkEntry = Partial<IASMULUnit> & {
    Id?: number;
    Name?: string;
    Class?: string;
    Variant?: string;
};

// Recursive so it also picks up ./mul/live/*.json (weekly sync output from tools/mul-sync).
const mulChunkModules = import.meta.glob("./mul/**/*.json", {
    eager: false,
    import: "default",
}) as Record<string, () => Promise<unknown>>;

let cachedMULListItems: IASMULUnit[] | null = null;
let pendingMULListItems: Promise<IASMULUnit[]> | null = null;

function isMULListEntry(item: unknown): item is IASMULUnit {
    if (!item || typeof item !== "object") {
        return false;
    }

    const record = item as Record<string, unknown>;
    return typeof record.Id === "number" && typeof record.Name === "string" && typeof record.Class === "string";
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
                    return entries.filter(isMULListEntry);
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
