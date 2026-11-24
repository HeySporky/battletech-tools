import { describe, expect, it } from "vitest";
// The mordel.net sync (Scott's /api/v1), kept apart from the CLI so it can be tested without the network.
import { createClient, listUnits, MordelAuthError, readApiKey } from "../../tools/mordel-sync/mordel-client.mjs";
import { applyDetail, applyList, detailFile, findRemoved, markRemoved, planDetails, stampOf, unitKey } from "../../tools/mordel-sync/mordel-store.mjs";
import { runSync } from "../../tools/mordel-sync/mordel-run.mjs";

// Shaped like the API's list rows; made-up units, no member designs.
const row = (type: string, id: number, created: number, updated: number | null = null) => ({
    unit_type: type === "bm" ? "BattleMech" : "Combat Vehicle",
    unit_type_short: type,
    id,
    name: `Test Unit ${id}`,
    canon: true,
    created,
    updated,
});

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function fakeFetch(answers: Response[]) {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const fetchImpl = async (url: string, init: { headers: Record<string, string> }) => {
        calls.push({ url, headers: init.headers });
        const next = answers.shift();
        if (!next) throw new Error("no more answers");
        return next;
    };
    return { calls, fetchImpl };
}

const client = (answers: Response[], extra = {}) => {
    const fake = fakeFetch(answers);
    const pauses: number[] = [];
    const c = createClient({
        base: "https://sandbox.example/api/v1",
        key: "test-key",
        userAgent: "test-agent/1.0",
        fetchImpl: fake.fetchImpl,
        pauseMs: 1000,
        sleep: async (ms: number) => void pauses.push(ms),
        ...extra,
    });
    return { c, calls: fake.calls, pauses };
};

describe("mordel sync: API key", () => {
    it("takes the environment variable first", () => {
        expect(readApiKey({ env: { MORDEL_API_KEY: "from-env" }, envFileText: "MORDEL_API_KEY=from-file" })).toBe("from-env");
    });

    it("reads the git-ignored env file, quoted or not", () => {
        expect(readApiKey({ env: {}, envFileText: "# key\nMORDEL_API_KEY='abc123'\n" })).toBe("abc123");
        expect(readApiKey({ env: {}, envFileText: "MORDEL_API_KEY=xyz" })).toBe("xyz");
    });

    it("gives null when there is no key", () => {
        expect(readApiKey({ env: {}, envFileText: "" })).toBeNull();
    });
});

describe("mordel sync: requests", () => {
    it("sends the key only in the X-API-Key header, with a real User-Agent", async () => {
        const { c, calls } = client([json({ status: "OK", unit: row("bm", 474, 1) })]);
        await c.get("/units/bm/474");
        expect(calls[0].url).toBe("https://sandbox.example/api/v1/units/bm/474");
        expect(calls[0].url).not.toContain("test-key");
        expect(calls[0].headers["X-API-Key"]).toBe("test-key");
        expect(calls[0].headers["User-Agent"]).toBe("test-agent/1.0");
    });

    it("sends no User-Agent when none is given, as a browser must", async () => {
        const { c, calls } = client([json({ status: "OK" })], { userAgent: undefined });
        await c.get("/ping");
        expect("User-Agent" in calls[0].headers).toBe(false);
        expect(calls[0].headers["X-API-Key"]).toBe("test-key");
    });

    it("pauses before every request after the first", async () => {
        const { c, pauses } = client([json({ status: "OK" }), json({ status: "OK" })]);
        await c.get("/ping");
        await c.get("/ping");
        expect(pauses).toEqual([1000]);
    });

    it("stops the run on 401", async () => {
        const { c } = client([json({ status: "Error", message: "Invalid API key" }, 401)]);
        await expect(c.get("/units/bm/474")).rejects.toBeInstanceOf(MordelAuthError);
    });

    it("gives null for a unit that is gone (404)", async () => {
        const { c } = client([json({ status: "Error", message: "Unit not found" }, 404)]);
        expect(await c.get("/units/bm/999")).toBeNull();
    });

    it("retries 503 and 429 after a longer pause, then succeeds", async () => {
        const { c, pauses } = client([json({ status: "Error", message: "busy" }, 503), json({ status: "Error" }, 429), json({ status: "OK", n: 1 })]);
        expect(await c.get("/ping")).toEqual({ status: "OK", n: 1 });
        expect(pauses.length).toBe(2);
        expect(pauses.every((ms) => ms >= 30_000)).toBe(true);
    });

    it("gives up after the retries are spent", async () => {
        const { c } = client([json({}, 503), json({}, 503), json({}, 503), json({}, 503)], { retries: 3 });
        await expect(c.get("/ping")).rejects.toThrow(/503/);
    });

    it("reports 400 with the server's message", async () => {
        const { c } = client([json({ status: "Error", message: "Unknown query parameter: x" }, 400)]);
        await expect(c.get("/units/bm/474")).rejects.toThrow(/Unknown query parameter: x/);
    });
});

describe("mordel sync: list pages", () => {
    it("follows next_cursor and passes updated_since and limit", async () => {
        const { c, calls } = client([
            json({ status: "OK", count: 2, next_cursor: "bm-2", server_time: 500, units: [row("bm", 1, 10), row("bm", 2, 20)] }),
            json({ status: "OK", count: 1, next_cursor: null, server_time: 501, units: [row("cv", 1, 30)] }),
        ]);
        const pages = [];
        for await (const page of listUnits(c, { updatedSince: 100, limit: 2 })) pages.push(page);
        expect(pages.map((p) => p.units.length)).toEqual([2, 1]);
        expect(pages[0].serverTime).toBe(500);
        expect(calls[0].url).toBe("https://sandbox.example/api/v1/units?limit=2&updated_since=100");
        expect(calls[1].url).toBe("https://sandbox.example/api/v1/units?limit=2&updated_since=100&cursor=bm-2");
    });

    it("lists everything when there is no updated_since", async () => {
        const { c, calls } = client([json({ status: "OK", next_cursor: null, server_time: 1, units: [] })]);
        for await (const _ of listUnits(c, {})) void _;
        expect(calls[0].url).toBe("https://sandbox.example/api/v1/units?limit=1000");
    });
});

describe("mordel sync: store", () => {
    it("keys units by type and id", () => {
        expect(unitKey(row("cv", 4411, 1))).toBe("cv/4411");
    });

    it("stamps a never-edited unit by its created time", () => {
        expect(stampOf(row("bm", 1, 10))).toBe(10);
        expect(stampOf(row("bm", 1, 10, 99))).toBe(99);
    });

    it("plans details for new and changed units only, oldest first, capped", () => {
        let store = { units: {} };
        store = applyList(store, [row("bm", 1, 10), row("bm", 2, 20), row("bm", 3, 30)]);
        store = applyDetail(store, "bm/2", { ...row("bm", 2, 20), equipment: [] });
        store = applyList(store, [row("bm", 3, 30, 300), row("bm", 4, 5)]);
        const plan = planDetails(store, 2);
        expect(plan.todo).toEqual(["bm/4", "bm/1"]);
        expect(plan.waiting).toBe(1); // bm/3 next run
    });

    it("keeps a detail until the unit changes again", () => {
        let store = applyList({ units: {} }, [row("bm", 7, 10)]);
        store = applyDetail(store, "bm/7", { ...row("bm", 7, 10), equipment: [] });
        expect(planDetails(store, 10).todo).toEqual([]);
        store = applyList(store, [row("bm", 7, 10, 50)]);
        expect(planDetails(store, 10).todo).toEqual(["bm/7"]);
    });

    it("finds units a full list no longer has, and marks them removed without deleting", () => {
        let store = applyList({ units: {} }, [row("bm", 1, 10), row("bm", 2, 20)]);
        const gone = findRemoved(store, new Set(["bm/1"]));
        expect(gone).toEqual(["bm/2"]);
        store = markRemoved(store, gone, 1234);
        expect(store.units["bm/2"].removed).toBe(1234);
        expect(planDetails(store, 10).todo).toEqual(["bm/1"]);
    });

    it("brings a removed unit back when it is listed again", () => {
        let store = applyList({ units: {} }, [row("bm", 2, 20)]);
        store = markRemoved(store, ["bm/2"], 1234);
        store = applyList(store, [row("bm", 2, 20)]);
        expect(store.units["bm/2"].removed).toBeUndefined();
    });
});

// A fake API: list pages from `units`, details by key; `fail` maps a detail key to an HTTP status.
function fakeApi(units: ReturnType<typeof row>[], fail: Record<string, number> = {}, serverTime = 1000) {
    const urls: string[] = [];
    const fetchImpl = async (url: string) => {
        urls.push(url);
        const u = new URL(url);
        if (u.pathname.endsWith("/units")) {
            const since = Number(u.searchParams.get("updated_since") ?? -1);
            const rows = units.filter((r) => (r.updated ?? r.created) >= since);
            return json({ status: "OK", count: rows.length, next_cursor: null, server_time: serverTime, units: rows });
        }
        const [, type, id] = u.pathname.match(/\/units\/(\w+)\/(\d+)$/) ?? [];
        const key = `${type}/${id}`;
        if (fail[key]) return json({ status: "Error", message: "x" }, fail[key]);
        const unit = units.find((r) => unitKey(r) === key);
        return unit ? json({ status: "OK", unit: { ...unit, equipment: [] } }) : json({ status: "Error", message: "Unit not found" }, 404);
    };
    const c = createClient({ base: "https://sandbox.example/api/v1", key: "k", userAgent: "t", fetchImpl, pauseMs: 0, sleep: async () => {} });
    return { c, urls };
}

describe("mordel sync: a run", () => {
    const DAY = 86_400;

    it("first run: full list, then a capped batch of details", async () => {
        const { c } = fakeApi([row("bm", 1, 10), row("bm", 2, 20), row("cv", 3, 30)]);
        const saved: Record<string, unknown> = {};
        const result = await runSync({ client: c, store: { units: {} }, now: 2000, maxDetail: 2, writeDetail: (key: string, unit: unknown) => void (saved[key] = unit) });
        expect(result.full).toBe(true);
        expect(result.listed).toBe(3);
        expect(Object.keys(saved)).toEqual(["bm/1", "bm/2"]);
        expect(result.waiting).toBe(1);
        expect(result.store.lastServerTime).toBe(1000);
        expect(result.store.lastFull).toBe(2000);
    });

    it("later run: only units changed since the last list", async () => {
        const units = [row("bm", 1, 10), row("bm", 2, 20, 1500)];
        const { c, urls } = fakeApi(units, {}, 1600);
        const store = { units: {}, lastServerTime: 1000, lastFull: 2000 };
        const result = await runSync({ client: c, store, now: 2000 + DAY, maxDetail: 10, writeDetail: () => {} });
        expect(result.full).toBe(false);
        expect(urls[0]).toContain("updated_since=1000");
        expect(result.listed).toBe(1);
        expect(result.store.lastServerTime).toBe(1600);
    });

    it("does a full list again after a week, to find removals", async () => {
        const { c } = fakeApi([row("bm", 1, 10)]);
        let store = applyList({ units: {} }, [row("bm", 1, 10), row("bm", 9, 10)]);
        store = { ...store, lastServerTime: 1000, lastFull: 0 };
        const result = await runSync({ client: c, store, now: 8 * DAY, maxDetail: 0, writeDetail: () => {} });
        expect(result.full).toBe(true);
        expect(result.removed).toEqual(["bm/9"]);
        expect(result.store.units["bm/9"].removed).toBe(8 * DAY);
    });

    it("stops on 401 and keeps what it fetched", async () => {
        const { c } = fakeApi([row("bm", 1, 10), row("bm", 2, 20), row("bm", 3, 30)], { "bm/2": 401 });
        const saved: string[] = [];
        const result = await runSync({ client: c, store: { units: {} }, now: 2000, maxDetail: 10, writeDetail: (key: string) => void saved.push(key) });
        expect(result.stopped).toBe("auth");
        expect(saved).toEqual(["bm/1"]);
        expect(result.store.units["bm/1"].detailStamp).toBe(10);
        expect(result.store.units["bm/3"].detailStamp).toBeUndefined();
    });

    it("marks a unit removed when its detail is gone (404)", async () => {
        const { c } = fakeApi([row("bm", 1, 10)], { "bm/1": 404 });
        const result = await runSync({ client: c, store: { units: {} }, now: 2000, maxDetail: 10, writeDetail: () => {} });
        expect(result.store.units["bm/1"].removed).toBe(2000);
    });

    it("a dry run lists and plans but fetches no details", async () => {
        const { c, urls } = fakeApi([row("bm", 1, 10), row("bm", 2, 20)]);
        const result = await runSync({ client: c, store: { units: {} }, now: 2000, maxDetail: 10, dryRun: true, writeDetail: () => {} });
        expect(urls.length).toBe(1);
        expect(result.planned).toBe(2);
    });
});

describe("mordel sync: mirror paths", () => {
    it("puts a detail under units/<type>/<id>.json", () => {
        expect(detailFile("cv/4411")).toEqual(["units", "cv", "4411.json"]);
    });

    it("refuses a key that could leave the mirror folder", () => {
        for (const bad of ["../x/1", "bm/../../1", "bm/1/2", "BM/1", "bm/abc", ""]) expect(() => detailFile(bad)).toThrow();
    });
});
