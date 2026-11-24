// The mordel.net unit list: the shipped chunks (tools/mordel-sync/build-mordel-list.mjs), plus rows this device
// fetched since with the user's key, less units mordel.net no longer has.
import { fetchMordelIds, fetchMordelListSince, IMordelCallOptions } from "../utils/mordel/mordel-api";
import { getMordelServer } from "../utils/mordel/mordel-key";
import { IMordelListRow, MORDEL_TYPES, mordelKeyOf } from "../utils/mordel/mordel-types";
import { untabulate } from "../utils/packed-json";

export const MORDEL_TOP_UP_STORAGE = "mordelListTopUp";
export const MORDEL_HIDDEN_STORAGE = "mordelHiddenUnits";
/** Rows a device keeps from its top-ups. */
export const TOP_UP_KEEP = 10000;
/** How often the panel tops the list up: once a day. */
export const TOP_UP_EVERY_MS = 24 * 60 * 60 * 1000;

interface ITopUp { since: number; rows: IMordelListRow[]; checked?: number; cursor?: string; sweepTime?: number }

type ChunkLoaders = Record<string, () => Promise<unknown>>;
// Shipped with mordel.net's agreement (2026-11-07). Each chunk loads only when the list is first searched.
const chunks = import.meta.glob("./mordel/mordel_*.json", { eager: false, import: "default" }) as ChunkLoaders;

/** False when this build has no shipped list: search then finds only units this device topped up. */
export const mordelListShipped = (): boolean => Object.keys(chunks).length > 0;

let shipped: Promise<IMordelListRow[]> | null = null;

const readStorage = <T>(key: string, fallback: T): T => {
    try {
        const text = localStorage.getItem(key);
        return text ? JSON.parse(text) as T : fallback;
    } catch {
        return fallback;
    }
};

const writeStorage = (key: string, value: unknown): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Full or blocked storage: the list still works from the shipped rows.
    }
};

const stampOf = (row: IMordelListRow): number => row.updated ?? row.created ?? 0;

function loadShipped(): Promise<IMordelListRow[]> {
    shipped ??= Promise.all(Object.values(chunks).map(async (load) => untabulate(await load()) as IMordelListRow[]))
        .then((lists) => lists.flat());
    return shipped;
}

const topUpOf = (): ITopUp | null => {
    const saved = readStorage<ITopUp | null>(MORDEL_TOP_UP_STORAGE, null);
    return saved && Array.isArray(saved.rows) && typeof saved.since === "number" ? saved : null;
};

const hiddenKeys = (): string[] => {
    const saved = readStorage<unknown>(MORDEL_HIDDEN_STORAGE, []);
    return Array.isArray(saved) ? saved.filter((key): key is string => typeof key === "string") : [];
};

/** A sandbox answer hides a unit only while the sandbox is chosen: its keys carry the server's name. */
const hiddenKeyOf = (key: string): string => (getMordelServer() === "sandbox" ? `sandbox:${key}` : key);

/** Rows by "type/id", the newest change winning. */
function merge(...lists: IMordelListRow[][]): Map<string, IMordelListRow> {
    const byKey = new Map<string, IMordelListRow>();
    for (const row of lists.flat()) {
        const key = mordelKeyOf(row);
        const previous = byKey.get(key);
        if (!previous || stampOf(row) >= stampOf(previous)) byKey.set(key, row);
    }
    return byKey;
}

/** The whole list, sorted by name. */
export async function loadMordelList(): Promise<IMordelListRow[]> {
    const byKey = merge(await loadShipped(), topUpOf()?.rows ?? []);
    const hidden = new Set(hiddenKeys());
    for (const key of [...byKey.keys()]) if (hidden.has(hiddenKeyOf(key))) byKey.delete(key);
    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Leaves a unit out of the list on this device: mordel.net answered that it is gone. */
export function hideMordelUnit(key: string): void {
    const keys = hiddenKeys();
    const stored = hiddenKeyOf(key);
    if (!keys.includes(stored)) writeStorage(MORDEL_HIDDEN_STORAGE, [...keys, stored]);
}

/** True when the last top-up was a day ago or more, there was none, or a sweep is waiting to be finished. */
export function mordelTopUpDue(now: number = Date.now()): boolean {
    const saved = topUpOf();
    return !!saved?.cursor || now - (saved?.checked ?? 0) >= TOP_UP_EVERY_MS;
}

/**
 * Fetches the units changed since the shipped list (or the last top-up) and keeps them on this device, then drops the
 * units mordel.net no longer lists. mordel.net pages by type and id, not by time, so a sweep that is cut short at
 * TOP_UP_LIMIT saves its cursor and the sweep's own start time; the next top-up carries on from the cursor, and only a
 * finished sweep moves `since` on. Returns how many rows came back and whether the sweep is still unfinished.
 */
export async function topUpMordelList(options: IMordelCallOptions = {}, now: number = Date.now()): Promise<{ fetched: number; tooMany: boolean }> {
    const saved = topUpOf();
    const since = saved?.since ?? Math.max(0, ...(await loadShipped()).map(stampOf));
    const resumeFrom = saved?.cursor ?? null;
    const { rows, serverTime, nextCursor } = await fetchMordelListSince(since, options, resumeFrom);
    const tooMany = nextCursor !== null;
    // The first page's time is the safe one (taken before the units were read); a resumed sweep keeps its own.
    const sweepTime = resumeFrom ? saved?.sweepTime ?? serverTime : serverTime;
    const kept = [...merge(saved?.rows ?? [], rows).values()].sort((a, b) => stampOf(b) - stampOf(a)).slice(0, TOP_UP_KEEP);
    const next: ITopUp = tooMany
        ? { since, rows: kept, checked: now, cursor: nextCursor, ...(sweepTime != null ? { sweepTime } : {}) }
        : { since: sweepTime ?? Math.max(since, ...rows.map(stampOf)), rows: kept, checked: now };
    writeStorage(MORDEL_TOP_UP_STORAGE, next);
    if (!tooMany) await dropRemovedUnits(options);
    return { fetched: rows.length, tooMany };
}

/**
 * Units that deleted or went private stop appearing in /units, so the only way to see them go is the id list.
 * Anything this device knows that the list lacks is dropped from the top-up rows and hidden from the shipped ones;
 * anything hidden that is listed again comes back. Skipped when the answer is missing or looks wrong (empty, or
 * lacking most of what we know), so a bad answer cannot empty the list. Never fails the top-up.
 */
export async function dropRemovedUnits(options: IMordelCallOptions = {}): Promise<number> {
    let ids: Awaited<ReturnType<typeof fetchMordelIds>>;
    try {
        ids = await fetchMordelIds(options);
    } catch {
        return 0;
    }
    if (!ids) return 0;
    const listed = new Set<string>();
    for (const type of MORDEL_TYPES) for (const id of ids[type] ?? []) listed.add(`${type}/${id}`);
    const saved = topUpOf();
    const known = [...merge(await loadShipped(), saved?.rows ?? []).keys()];
    const present = known.filter((key) => listed.has(key)).length;
    if (!listed.size || present < known.length / 2) return 0;
    const gone = known.filter((key) => !listed.has(key));
    const goneHidden = new Set(gone.map(hiddenKeyOf));
    // A hidden unit that is listed again comes back (this server's entries only: the sandbox's carry a prefix).
    const sandbox = getMordelServer() === "sandbox";
    const stillHidden = hiddenKeys().filter((stored) => {
        const isSandboxEntry = stored.startsWith("sandbox:");
        if (isSandboxEntry !== sandbox) return true;
        return !listed.has(isSandboxEntry ? stored.slice("sandbox:".length) : stored);
    });
    writeStorage(MORDEL_HIDDEN_STORAGE, [...new Set([...stillHidden, ...goneHidden])]);
    if (saved) writeStorage(MORDEL_TOP_UP_STORAGE, { ...saved, rows: saved.rows.filter((row) => listed.has(mordelKeyOf(row))) });
    return gone.length;
}

/** For tests: forget the shipped rows read so far. */
export function resetMordelListCache(): void {
    shipped = null;
}
