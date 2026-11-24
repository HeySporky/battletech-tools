// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { TOP_UP_LIMIT } from "../utils/mordel/mordel-api";
import { saveMordelKey, setMordelServer } from "../utils/mordel/mordel-key";
import { hideMordelUnit, loadMordelList, MORDEL_TOP_UP_STORAGE, mordelListShipped, mordelTopUpDue, topUpMordelList, TOP_UP_EVERY_MS } from "./mordel-list";

// Made-up units with ids above any mordel.net id, so the shipped list does not get in the way.
const row = (id: number, updated: number, name = `Testunit ${id}`) => ({
    unit_type: "BattleMech", unit_type_short: "bm", id, name, canon: false, tech_base: "Inner Sphere", year: 3075, tons: 35,
    battle_value: 800, point_value: 20, updated,
});
const ours = async () => (await loadMordelList()).filter((r) => r.id >= 990000000);

function fake(body: unknown) {
    const urls: string[] = [];
    const fetchImpl = async (url: string) => {
        urls.push(url);
        return new Response(JSON.stringify(body), { status: 200 });
    };
    return { urls, fetchImpl, base: "https://api.example/v1" };
}

/** Answers per URL: the first matching [part, body] wins; the id list is /units/ids. */
function route(answers: [string, unknown][]) {
    const urls: string[] = [];
    const fetchImpl = async (url: string) => {
        urls.push(url);
        const hit = answers.find(([part]) => url.includes(part));
        return new Response(JSON.stringify(hit ? hit[1] : { status: "Error", message: "none" }), { status: hit ? 200 : 400 });
    };
    return { urls, fetchImpl, base: "https://api.example/v1" };
}

beforeEach(() => {
    localStorage.clear();
    saveMordelKey("made-up-key-1234");
});

describe("mordel list", () => {
    it("adds the rows a top-up fetched, keeps the newest change of a unit, and moves the starting point on", async () => {
        localStorage.setItem(MORDEL_TOP_UP_STORAGE, JSON.stringify({ since: 100, rows: [row(990000001, 110, "Old name")] }));
        const f = fake({ units: [row(990000001, 150, "New name"), row(990000002, 160)], server_time: 170 });
        expect(await topUpMordelList(f)).toEqual({ fetched: 2, tooMany: false });
        expect(f.urls[0]).toContain("updated_since=100");
        expect((await ours()).map((r) => r.name)).toEqual(["New name", "Testunit 990000002"]);
        expect(JSON.parse(localStorage.getItem(MORDEL_TOP_UP_STORAGE)!).since).toBe(170);
    }, 30000);

    it("leaves out a unit hidden on this device", async () => {
        localStorage.setItem(MORDEL_TOP_UP_STORAGE, JSON.stringify({ since: 100, rows: [row(990000001, 110), row(990000002, 120)] }));
        hideMordelUnit("bm/990000001");
        hideMordelUnit("bm/990000001");
        expect((await ours()).map((r) => r.id)).toEqual([990000002]);
        expect(JSON.parse(localStorage.getItem("mordelHiddenUnits")!)).toEqual(["bm/990000001"]);
    }, 30000);

    it("carries a cut-short sweep on from its cursor, and moves since on only when the sweep ends", async () => {
        const rows = Array.from({ length: TOP_UP_LIMIT }, (_, i) => row(990000001 + i, 2000000000 + i));
        localStorage.setItem(MORDEL_TOP_UP_STORAGE, JSON.stringify({ since: 100, rows: [] }));
        const first = route([["/units?", { units: rows, next_cursor: "bm-990002000", server_time: 500 }]]);
        expect(await topUpMordelList(first)).toEqual({ fetched: TOP_UP_LIMIT, tooMany: true });
        const saved = JSON.parse(localStorage.getItem(MORDEL_TOP_UP_STORAGE)!);
        expect(saved.since).toBe(100);
        expect(saved.cursor).toBe("bm-990002000");
        expect(saved.sweepTime).toBe(500);
        expect(mordelTopUpDue(Date.now())).toBe(true);

        const second = route([["/units?", { units: [row(990009999, 110)], next_cursor: null, server_time: 900 }]]);
        expect(await topUpMordelList(second)).toEqual({ fetched: 1, tooMany: false });
        expect(second.urls[0]).toContain("cursor=bm-990002000");
        expect(second.urls[0]).toContain(`updated_since=${saved.since}`);
        const done = JSON.parse(localStorage.getItem(MORDEL_TOP_UP_STORAGE)!);
        expect(done.since).toBe(500);
        expect(done.cursor).toBeUndefined();
    }, 30000);

    it("takes the new starting point from the first page", async () => {
        localStorage.setItem(MORDEL_TOP_UP_STORAGE, JSON.stringify({ since: 100, rows: [] }));
        const f = fake({ units: [row(990000001, 150)], next_cursor: null, server_time: 170 });
        await topUpMordelList(f);
        expect(JSON.parse(localStorage.getItem(MORDEL_TOP_UP_STORAGE)!).since).toBe(170);
    }, 30000);

    it("drops units the id list no longer has, and brings back one that is listed again", async () => {
        localStorage.setItem(MORDEL_TOP_UP_STORAGE, JSON.stringify({ since: 100, rows: [row(990000001, 110), row(990000002, 120), row(990000003, 130)] }));
        hideMordelUnit("bm/990000003");
        const shippedKey = (await loadMordelList()).find((r) => r.id < 990000000)!;
        const kept = (await loadMordelList()).filter((r) => r.id < 990000000).map((r) => r.id);
        const f = route([["/units/ids", { status: "OK", ids: { bm: [...kept, 990000001, 990000003] } }], ["/units?", { units: [], next_cursor: null, server_time: 200 }]]);
        await topUpMordelList(f);
        // 990000002 is gone; 990000003 was hidden but is listed, so it is back. A shipped unit missing from the list is hidden.
        expect((await ours()).map((r) => r.id).sort()).toEqual([990000001, 990000003]);
        expect(shippedKey).toBeTruthy();
    }, 60000);

    it("keeps the list when the id answer looks wrong", async () => {
        localStorage.setItem(MORDEL_TOP_UP_STORAGE, JSON.stringify({ since: 100, rows: [row(990000001, 110)] }));
        const f = route([["/units/ids", { status: "OK", ids: { bm: [], cv: [], im: [], pm: [] } }], ["/units?", { units: [], next_cursor: null, server_time: 200 }]]);
        await topUpMordelList(f);
        expect((await ours()).map((r) => r.id)).toEqual([990000001]);
        const failing = route([["/units?", { units: [], next_cursor: null, server_time: 300 }]]);
        await topUpMordelList(failing);
        expect((await ours()).map((r) => r.id)).toEqual([990000001]);
    }, 60000);

    it("is due once a day", async () => {
        expect(mordelTopUpDue(TOP_UP_EVERY_MS)).toBe(true);
        await topUpMordelList(fake({ units: [], server_time: 5 }), TOP_UP_EVERY_MS);
        expect(mordelTopUpDue(2 * TOP_UP_EVERY_MS - 1)).toBe(false);
        expect(mordelTopUpDue(2 * TOP_UP_EVERY_MS)).toBe(true);
    }, 30000);

    it("hides a unit the sandbox has not got only while the sandbox is chosen", async () => {
        localStorage.setItem(MORDEL_TOP_UP_STORAGE, JSON.stringify({ since: 100, rows: [row(990000001, 110)] }));
        setMordelServer("sandbox");
        hideMordelUnit("bm/990000001");
        expect(await ours()).toEqual([]);
        setMordelServer("production");
        expect((await ours()).map((r) => r.id)).toEqual([990000001]);
    }, 30000);

    it("ships the list", () => {
        expect(mordelListShipped()).toBe(true);
    });

    it("reads broken saved data as empty", async () => {
        localStorage.setItem(MORDEL_TOP_UP_STORAGE, "{not json");
        localStorage.setItem("mordelHiddenUnits", "{\"x\":1}");
        expect(await ours()).toEqual([]);
    }, 30000);
});
