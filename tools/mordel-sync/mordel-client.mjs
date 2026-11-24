// HTTP client for the mordel.net API (/api/v1). No network code runs on import, so the tests can drive it with a fake fetch.
// The key goes only in the X-API-Key header, never in a URL, a log line or a saved file.

export class MordelAuthError extends Error {
    constructor(message) {
        super(message);
        this.name = "MordelAuthError";
    }
}

export class MordelHttpError extends Error {
    constructor(status, message) {
        super(`mordel.net answered ${status}: ${message}`);
        this.name = "MordelHttpError";
        this.status = status;
    }
}

/** The key from MORDEL_API_KEY, else from the git-ignored env file's MORDEL_API_KEY= line; null when neither has one. */
export function readApiKey({ env = {}, envFileText = "" }) {
    if (env.MORDEL_API_KEY) return env.MORDEL_API_KEY.trim();
    const match = envFileText.match(/^\s*MORDEL_API_KEY\s*=\s*(['"]?)([^'"\r\n]+?)\1\s*$/m);
    return match ? match[2] : null;
}

const RETRY_PAUSE_MS = 30_000;
/** The longest wait the client honours from a Retry-After header, in seconds. */
const MAX_RETRY_AFTER_S = 60;

/** Milliseconds to wait before retrying a 429: the server's Retry-After (seconds), else the longer pause. */
function retryDelay(response, attempt) {
    const seconds = Number(response.headers?.get?.("Retry-After"));
    return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, MAX_RETRY_AFTER_S) * 1000 : RETRY_PAUSE_MS * (attempt + 1);
}

/**
 * get(path) gives the parsed JSON body, or null for 404. 401 throws MordelAuthError (stop the run); 503 and 429 are
 * retried after a longer pause; anything else throws MordelHttpError with the server's message.
 * A browser cannot set User-Agent: leave userAgent out there and the header is not sent.
 * @param {{ base: string, key: string, userAgent?: string,
 *   fetchImpl?: (url: string, init: { headers: Record<string, string> }) => Promise<Response>,
 *   pauseMs?: number, sleep?: (ms: number) => Promise<void>, retries?: number, retryBusy?: boolean }} options
 * A 429 waits for the server's Retry-After (up to a minute); a 503 (a site release) waits a longer pause unless
 * `retryBusy` is false, which an interactive caller sets so the user is told at once.
 */
export function createClient({ base, key, userAgent, fetchImpl = fetch, pauseMs = 1000, sleep, retries = 2, retryBusy = true }) {
    const wait = sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    let sent = 0;

    async function get(path) {
        let delay = 0;
        for (let attempt = 0; ; attempt++) {
            if (attempt > 0) await wait(delay);
            else if (sent > 0) await wait(pauseMs);
            sent++;
            const response = await fetchImpl(base + path, {
                headers: { "X-API-Key": key, ...(userAgent ? { "User-Agent": userAgent } : {}), Accept: "application/json" },
            });
            const text = await response.text();
            let body;
            try {
                body = text ? JSON.parse(text) : null;
            } catch {
                body = null;
            }
            if (response.ok) {
                if (body === null) throw new MordelHttpError(response.status, "the answer was not JSON");
                return body;
            }
            const message = body?.message ?? response.statusText ?? "no message";
            if (response.status === 401) throw new MordelAuthError(`mordel.net refused the key (401): ${message}`);
            // 404 is "no such unit" only when the API says so in JSON: a wrong address ("Endpoint not found") or a
            // server without the API at all is an error, not an absent unit.
            if (response.status === 404 && body?.status === "Error" && !/endpoint/i.test(message)) return null;
            if ((response.status === 429 || (response.status === 503 && retryBusy)) && attempt < retries) {
                delay = response.status === 429 ? retryDelay(response, attempt) : RETRY_PAUSE_MS * (attempt + 1);
                continue;
            }
            throw new MordelHttpError(response.status, message);
        }
    }

    return { get };
}

/**
 * Pages of /units, following next_cursor. Each page: { units, serverTime, nextCursor, count }.
 * `owner: "me"` lists the key owner's own units at every privacy level; `cursor` carries on from an earlier page.
 * @param {{ get: (path: string) => Promise<any> }} client
 * @param {{ updatedSince?: number, limit?: number, type?: string, owner?: string, cursor?: string | null }} [options]
 */
export async function* listUnits(client, { updatedSince, limit = 1000, type, owner, cursor: startCursor = null } = {}) {
    let cursor = startCursor;
    do {
        const params = new URLSearchParams({ limit: String(limit) });
        if (updatedSince != null) params.set("updated_since", String(updatedSince));
        if (type) params.set("type", type);
        if (owner) params.set("owner", owner);
        if (cursor) params.set("cursor", cursor);
        const page = await client.get(`/units?${params}`);
        if (!page) return;
        cursor = page.next_cursor ?? null;
        yield { units: page.units ?? [], serverTime: page.server_time, nextCursor: cursor, count: page.count };
    } while (cursor);
}
