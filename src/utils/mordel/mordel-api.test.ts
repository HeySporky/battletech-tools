// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { AppSettings } from "../../ui/classes/app_settings";
import { getFullBackup } from "../../dataSaves";
import { DETAIL_CACHE_SIZE, fetchMordelDetail, fetchMordelIds, fetchMordelListSince, fetchMyMordelUnits, MordelKeyError, MordelUnavailableError, parseMordelUnitRef, testMordelKey } from "./mordel-api";
import { getMordelKey, isMordelKeyRejected, maskMordelKey, MORDEL_BASES, mordelBaseUrl, removeMordelKey, saveMordelKey } from "./mordel-key";

const KEY = "made-up-key-1234";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function fake(answer: (url: string) => Response | Promise<Response>) {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const fetchImpl = async (url: string, init: { headers: Record<string, string> }) => {
        calls.push({ url, headers: init.headers });
        return answer(url);
    };
    return { calls, fetchImpl, base: "https://api.example/v1" };
}

const unit = (id: number, updated: number | null = null) => ({ unit_type_short: "bm", id, name: `Test ${id}`, created: 10, updated });

beforeEach(() => {
    localStorage.clear();
    saveMordelKey(KEY);
});

describe("mordel key store", () => {
    it("keeps the key trimmed, masks it, and removes it", () => {
        saveMordelKey("  abcdefgh  ");
        expect(getMordelKey()).toBe("abcdefgh");
        expect(maskMordelKey("abcdefgh")).toBe("••••efgh");
        removeMordelKey();
        expect(getMordelKey()).toBeNull();
    });

    it("names the API address of each server", () => {
        expect(mordelBaseUrl("sandbox")).toBe(MORDEL_BASES.sandbox);
        expect(mordelBaseUrl("production")).toBe(MORDEL_BASES.production);
    });

    it("never puts the key in a backup", async () => {
        const backup = await getFullBackup(new AppSettings(null));
        expect(backup).not.toContain(KEY);
        expect(backup).not.toContain("mordelApiKey");
    });
});

describe("mordel browser client", () => {
    it("sends the key only in the X-API-Key header, with no User-Agent", async () => {
        const f = fake(() => json({ status: "OK", unit: unit(1) }));
        await fetchMordelDetail("bm", 1, null, f);
        expect(f.calls[0].url).toBe("https://api.example/v1/units/bm/1");
        expect(f.calls[0].url).not.toContain(KEY);
        expect(f.calls[0].headers["X-API-Key"]).toBe(KEY);
        expect("User-Agent" in f.calls[0].headers).toBe(false);
    });

    it("asks for a key when none is saved", async () => {
        removeMordelKey();
        await expect(fetchMordelDetail("bm", 1, null, fake(() => json({})))).rejects.toThrow(MordelKeyError);
    });

    it("marks the saved key rejected on 401", async () => {
        const f = fake(() => json({ status: "Error", message: "Invalid API key" }, 401));
        await expect(fetchMordelDetail("bm", 1, null, f)).rejects.toMatchObject({ reason: "rejected" });
        expect(isMordelKeyRejected()).toBe(true);
        saveMordelKey("new-key-9999");
        expect(isMordelKeyRejected()).toBe(false);
    });

    it("reads a network or CORS failure as mordel.net being unreachable", async () => {
        const f = fake(() => { throw new TypeError("Failed to fetch"); });
        const error = await fetchMordelDetail("bm", 1, null, f).catch((e) => e);
        expect(error).toBeInstanceOf(MordelUnavailableError);
        expect(error.message).toMatch(/offline, or mordel.net may be down/);
        expect(error.message).not.toContain(KEY);
    });

    it("says busy on 503 without retrying for long", async () => {
        const f = fake(() => json({ message: "busy" }, 503));
        await expect(fetchMordelDetail("bm", 1, null, f)).rejects.toThrow(/busy/);
        expect(f.calls).toHaveLength(1);
    });

    it("gives null for a unit mordel.net does not have (404)", async () => {
        expect(await fetchMordelDetail("bm", 1, null, fake(() => json({ status: "Error", message: "Unit not found" }, 404)))).toBeNull();
    });

    it("serves the cached copy until the list has a newer one", async () => {
        const f = fake(() => json({ status: "OK", unit: unit(1, 100) }));
        await fetchMordelDetail("bm", 1, 100, f);
        await fetchMordelDetail("bm", 1, 100, f);
        expect(f.calls).toHaveLength(1);
        await fetchMordelDetail("bm", 1, 200, f);
        expect(f.calls).toHaveLength(2);
    });

    it(`keeps the newest ${DETAIL_CACHE_SIZE} details`, async () => {
        const f = fake((url) => json({ status: "OK", unit: unit(+url.split("/").pop()!) }));
        for (let id = 1; id <= DETAIL_CACHE_SIZE + 1; id++) await fetchMordelDetail("bm", id, 10, { ...f });
        const before = f.calls.length;
        await fetchMordelDetail("bm", DETAIL_CACHE_SIZE + 1, 10, f);
        expect(f.calls.length).toBe(before);
        await fetchMordelDetail("bm", 1, 10, f);
        expect(f.calls.length).toBe(before + 1);
    });

    it("pulls a pasted link fresh, and falls back to the cached copy only when mordel.net cannot be reached", async () => {
        let name = "First";
        let down = false;
        const f = fake(() => { if (down) throw new TypeError("Failed to fetch"); return json({ unit: { ...unit(1), name } }); });
        expect((await fetchMordelDetail("bm", 1, null, f))!.name).toBe("First");
        name = "Edited";
        expect((await fetchMordelDetail("bm", 1, null, f))!.name).toBe("Edited");
        down = true;
        expect((await fetchMordelDetail("bm", 1, null, f))!.name).toBe("Edited");
    });

    it("keeps the cache per server, and drops it with the key", async () => {
        const production = fake(() => json({ unit: { ...unit(1, 100), name: "Production" } }));
        const sandbox = { ...fake(() => json({ unit: { ...unit(1, 100), name: "Sandbox" } })), base: "https://sandbox.example/v1" };
        await fetchMordelDetail("bm", 1, 100, production);
        expect((await fetchMordelDetail("bm", 1, 100, sandbox))!.name).toBe("Sandbox");
        expect(localStorage.getItem("mordelDetailCache")).toContain("Production");
        saveMordelKey("another-key-5678");
        expect(localStorage.getItem("mordelDetailCache")).toBeNull();
        await fetchMordelDetail("bm", 1, 100, production);
        removeMordelKey();
        expect(localStorage.getItem("mordelDetailCache")).toBeNull();
    });

    it("marks the saved key rejected when a test of it is refused", async () => {
        expect(await testMordelKey(KEY, fake(() => json({}, 401)))).toBe("rejected");
        expect(isMordelKeyRejected()).toBe(true);
    });

    it("tests a key without saving or rejecting the saved one", async () => {
        expect(await testMordelKey("other", fake(() => json({ status: "OK", message: "API key is valid" })))).toBe("ok");
        expect(await testMordelKey("other", fake(() => json({}, 401)))).toBe("rejected");
        expect(isMordelKeyRejected()).toBe(false);
        expect(await testMordelKey("other", fake(() => { throw new TypeError("Failed to fetch"); }))).toBe("unavailable");
    });

    it("tests a key with GET /key, the one-point call", async () => {
        const f = fake(() => json({ status: "OK", message: "API key is valid", server_time: 5 }));
        expect(await testMordelKey("other", f)).toBe("ok");
        expect(f.calls.map((call) => call.url)).toEqual(["https://api.example/v1/key"]);
    });

    it("does not call a missing API a good key", async () => {
        const html = () => new Response("<html>Error 404</html>", { status: 404 });
        expect(await testMordelKey("other", fake(html))).toBe("unavailable");
        expect(await testMordelKey("other", fake(() => json({ status: "Error", message: "Endpoint not found" }, 404)))).toBe("unavailable");
    });

    it("tells a missing server from a missing unit", async () => {
        await expect(fetchMordelDetail("bm", 1, null, fake(() => new Response("<html>Error 404</html>", { status: 404 })))).rejects.toThrow(MordelUnavailableError);
        await expect(fetchMordelDetail("bm", 1, null, fake(() => json({ status: "Error", message: "Endpoint not found" }, 404)))).rejects.toThrow(MordelUnavailableError);
        expect(await fetchMordelDetail("bm", 1, null, fake(() => json({ status: "Error", message: "Unit not found" }, 404)))).toBeNull();
    });

    it("waits for Retry-After on a 429, then tries again", async () => {
        let answered = 0;
        const f = fake(() => answered++ === 0
            ? new Response(JSON.stringify({ status: "Error", message: "Rate limit exceeded. Try again in 1 seconds." }), { status: 429, headers: { "Retry-After": "1" } })
            : json({ status: "OK", unit: unit(1) }));
        const started = Date.now();
        expect((await fetchMordelDetail("bm", 1, null, f))!.id).toBe(1);
        expect(f.calls).toHaveLength(2);
        expect(Date.now() - started).toBeGreaterThanOrEqual(900);
    }, 10000);

    it("pages the list since a time, and keeps the first page's server time", async () => {
        const f = fake((url) => url.includes("cursor=") ? json({ units: [unit(2)], next_cursor: null, server_time: 50 })
            : json({ units: [unit(1)], next_cursor: "bm-1", server_time: 40 }));
        const { rows, serverTime, nextCursor } = await fetchMordelListSince(30, f);
        expect(rows.map((row) => row.id)).toEqual([1, 2]);
        expect(serverTime).toBe(40);
        expect(nextCursor).toBeNull();
        expect(f.calls[0].url).toContain("updated_since=30");
        expect(f.calls[1].url).toContain("cursor=bm-1");
    });

    it("carries on from a cursor", async () => {
        const f = fake(() => json({ units: [unit(9)], next_cursor: null, server_time: 60 }));
        await fetchMordelListSince(30, f, "bm-8");
        expect(f.calls[0].url).toContain("cursor=bm-8");
        expect(f.calls[0].url).toContain("updated_since=30");
    });

    it("lists my designs with owner=me, every page", async () => {
        const f = fake((url) => url.includes("cursor=") ? json({ units: [{ ...unit(8), privacy: "private" }], next_cursor: null })
            : json({ units: [unit(7)], next_cursor: "bm-7" }));
        const mine = await fetchMyMordelUnits(f);
        expect(mine.map((row) => row.id)).toEqual([7, 8]);
        expect(f.calls[0].url).toContain("owner=me");
        expect(f.calls[1].url).toContain("owner=me");
        expect(f.calls[0].url).not.toContain("/units/mine");
        expect(await fetchMyMordelUnits(fake(() => json({ units: [], next_cursor: null })))).toEqual([]);
    });

    it("reads the id list", async () => {
        const f = fake(() => json({ status: "OK", count: 3, ids: { bm: [1, 2], pm: [5] } }));
        expect(await fetchMordelIds(f)).toEqual({ bm: [1, 2], pm: [5] });
        expect(f.calls[0].url).toBe("https://api.example/v1/units/ids");
        expect(await fetchMordelIds(fake(() => json({ status: "OK" })))).toBeNull();
    });
});

describe("mordel unit references", () => {
    it("reads type/id, API links and site links", () => {
        expect(parseMordelUnitRef("bm/23454")).toEqual({ type: "bm", id: 23454 });
        expect(parseMordelUnitRef("https://sandbox.mordel.net/api/v1/units/cv/12")).toEqual({ type: "cv", id: 12 });
        expect(parseMordelUnitRef("https://mordel.net/tro.php?a=vt&ut=pm&id=9")).toEqual({ type: "pm", id: 9 });
        expect(parseMordelUnitRef("Atlas AS7-D")).toBeNull();
    });
});
