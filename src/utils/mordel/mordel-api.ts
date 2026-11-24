// The app's calls to mordel.net with the user's own key. The client is the CLI sync's (tools/mordel-sync), without a
// User-Agent (browsers can't set one) and without its long waits: a user pulls one unit at a time.
import { readLocalStorage, writeLocalStorage } from "../../dataSavesStorage";
import { createClient, listUnits, MordelAuthError, MordelHttpError } from "../../../tools/mordel-sync/mordel-client.mjs";
import { getMordelKey, markMordelKeyRejected, mordelBaseUrl, MORDEL_DETAIL_CACHE_STORAGE } from "./mordel-key";
import { IMordelDetail, IMordelListRow, mordelKeyOf, MordelType } from "./mordel-types";

/** No key is saved, or mordel.net refused it (401). */
export class MordelKeyError extends Error {
    constructor(public reason: "missing" | "rejected") {
        super(reason === "missing" ? "No mordel.net API key is saved. Add yours in Settings."
            : "mordel.net refused the saved API key. It may have been revoked: add a new one in Settings.");
        this.name = "MordelKeyError";
    }
}

export const UNREACHABLE_MESSAGE = "Could not reach mordel.net. You may be offline, or mordel.net may be down.";

/** mordel.net could not be reached, or was busy. */
export class MordelUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MordelUnavailableError";
    }
}

const DETAIL_CACHE = MORDEL_DETAIL_CACHE_STORAGE;
export const DETAIL_CACHE_SIZE = 50;
/** Rows a list top-up keeps; beyond this the shipped list waits for the next release. */
export const TOP_UP_LIMIT = 2000;

export type FetchImpl = (url: string, init: { headers: Record<string, string> }) => Promise<Response>;

export interface IMordelCallOptions {
    fetchImpl?: FetchImpl;
    /** The key to use instead of the saved one (the settings page's Test button). */
    key?: string;
    base?: string;
}

const client = (options: IMordelCallOptions = {}) => {
    const key = options.key ?? getMordelKey();
    if (!key) throw new MordelKeyError("missing");
    return createClient({
        base: options.base ?? mordelBaseUrl(),
        key,
        fetchImpl: options.fetchImpl ?? ((url, init) => fetch(url, init)),
        // 120 points per 60 s: a list page costs 1, so 500 ms between pages stays well under. A 429 waits for the
        // server's Retry-After once; a 503 (site release) is shown at once.
        pauseMs: 500,
        retries: 1,
        retryBusy: false,
    });
};

/** Runs a call, turning the client's and the browser's errors into the two the app shows. */
async function call<T>(work: () => Promise<T>, savedKey: boolean): Promise<T> {
    try {
        return await work();
    } catch (error) {
        if (error instanceof MordelKeyError) throw error;
        if (error instanceof MordelAuthError) {
            if (savedKey) markMordelKeyRejected();
            throw new MordelKeyError("rejected");
        }
        if (error instanceof MordelHttpError) {
            const status = (error as MordelHttpError & { status: number }).status;
            throw new MordelUnavailableError(status === 503 || status === 429
                ? "mordel.net is busy right now. Try again in a minute."
                : `mordel.net could not answer (${status}).`);
        }
        // fetch rejects with a TypeError when the network is down or the server cannot be reached.
        throw new MordelUnavailableError(UNREACHABLE_MESSAGE);
    }
}

/** "ok" when mordel.net accepts the key. */
export async function testMordelKey(key: string, options: IMordelCallOptions = {}): Promise<"ok" | "rejected" | "unavailable"> {
    try {
        // GET /key costs one point, returns no data, and still answers during a site release (when /units gives 503).
        const answer = await call(() => client({ ...options, key }).get("/key") as Promise<{ status?: string } | null>, key.trim() === getMordelKey());
        if (answer?.status !== "OK") return "unavailable";
        return "ok";
    } catch (error) {
        return error instanceof MordelKeyError ? "rejected" : "unavailable";
    }
}

interface ICacheEntry { key: string; stamp: number; unit: IMordelDetail }

const readCache = (): ICacheEntry[] => {
    try {
        const parsed = JSON.parse(readLocalStorage(DETAIL_CACHE) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.key === "string" && entry.unit) : [];
    } catch {
        return [];
    }
};

const stampOf = (unit: { updated?: number | null; created?: number | null }): number => unit.updated ?? unit.created ?? 0;

/**
 * A unit's full detail: from the cache when it is as new as `stamp` (the list's updated or created time), else from
 * mordel.net. With no stamp (a pasted link) it is always pulled fresh, the cached copy serving only when mordel.net
 * cannot be reached. Null when mordel.net has no such unit, or not one this key may see. The cache is kept per server.
 */
export async function fetchMordelDetail(type: MordelType, id: number, stamp: number | null = null, options: IMordelCallOptions = {}): Promise<IMordelDetail | null> {
    const server = options.base ?? mordelBaseUrl();
    const key = `${server} ${type}/${id}`;
    const cached = readCache().find((entry) => entry.key === key);
    if (cached && stamp !== null && cached.stamp >= stamp) return cached.unit;
    let answer: { unit?: IMordelDetail } | null;
    try {
        answer = await call(() => client(options).get(`/units/${type}/${id}`), options.key === undefined) as { unit?: IMordelDetail } | null;
    } catch (error) {
        if (cached && error instanceof MordelUnavailableError) return cached.unit;
        throw error;
    }
    const unit = answer?.unit ?? null;
    const rest = readCache().filter((entry) => entry.key !== key);
    const kept = unit ? [{ key: `${server} ${mordelKeyOf(unit)}`, stamp: stampOf(unit), unit }, ...rest] : rest;
    writeLocalStorage(DETAIL_CACHE, JSON.stringify(kept.slice(0, DETAIL_CACHE_SIZE)));
    return unit;
}

/**
 * The list rows created or changed since `since` (seconds). mordel.net pages by type and then id, not by time, so a
 * sweep that reaches TOP_UP_LIMIT stops with `nextCursor`: pass it back as `cursor` to carry on. `serverTime` is the
 * first page's, taken before the units were read, so it is the safe time for the next sweep (the caller keeps the
 * sweep's own first time when it resumes from a cursor).
 */
export async function fetchMordelListSince(since: number, options: IMordelCallOptions = {}, cursor: string | null = null): Promise<{ rows: IMordelListRow[]; serverTime: number | null; nextCursor: string | null }> {
    return call(async () => {
        const rows: IMordelListRow[] = [];
        let serverTime: number | null = null;
        let nextCursor: string | null = null;
        for await (const page of listUnits(client(options), { updatedSince: since, limit: 1000, cursor })) {
            rows.push(...page.units as IMordelListRow[]);
            serverTime ??= page.serverTime ?? null;
            nextCursor = page.nextCursor ?? null;
            if (rows.length >= TOP_UP_LIMIT) break;
        }
        return { rows, serverTime, nextCursor };
    }, options.key === undefined);
}

/** The key owner's own designs (GET /units?owner=me): every privacy level, private ones included. */
export async function fetchMyMordelUnits(options: IMordelCallOptions = {}): Promise<IMordelListRow[]> {
    return call(async () => {
        const rows: IMordelListRow[] = [];
        for await (const page of listUnits(client(options), { owner: "me", limit: 1000 })) rows.push(...page.units as IMordelListRow[]);
        return rows;
    }, options.key === undefined);
}

/** Every public unit id mordel.net lists (GET /units/ids, 2 points), by type: how removals are found. */
export async function fetchMordelIds(options: IMordelCallOptions = {}): Promise<Partial<Record<MordelType, number[]>> | null> {
    return call(async () => {
        const answer = await client(options).get("/units/ids") as { ids?: Partial<Record<MordelType, number[]>> } | null;
        return answer?.ids && typeof answer.ids === "object" ? answer.ids : null;
    }, options.key === undefined);
}

/** "bm/23454", "https://mordel.net/tro.php?a=vt&ut=bm&id=23454" or a /units/bm/23454 link, as a type and id. */
export function parseMordelUnitRef(text: string): { type: MordelType; id: number } | null {
    const trimmed = text.trim();
    const pair = /^(bm|cv|im|pm)\s*[/ ]\s*(\d+)$/i.exec(trimmed)
        ?? /\/units\/(bm|cv|im|pm)\/(\d+)/i.exec(trimmed);
    if (pair) return { type: pair[1].toLowerCase() as MordelType, id: +pair[2] };
    try {
        const url = new URL(trimmed);
        const type = url.searchParams.get("ut")?.toLowerCase();
        const id = Number(url.searchParams.get("id"));
        if (type && /^(bm|cv|im|pm)$/.test(type) && Number.isInteger(id) && id > 0) return { type: type as MordelType, id };
    } catch {
        // Not a link.
    }
    return null;
}
