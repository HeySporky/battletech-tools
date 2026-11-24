// One sync run: list what changed (or everything, weekly, to notice removals), then fetch a capped batch of details.
// The caller loads and saves the store and writes the detail files; this module only talks to the client.
import { listUnits, MordelAuthError } from "./mordel-client.mjs";
import { applyDetail, applyList, findRemoved, markRemoved, planDetails, unitKey } from "./mordel-store.mjs";

export const FULL_LIST_EVERY = 7 * 86_400; // seconds

export async function runSync({ client, store, now, maxDetail, dryRun = false, forceFull = false, writeDetail, log = () => {} }) {
    const full = forceFull || store.lastServerTime == null || store.lastFull == null || now - store.lastFull >= FULL_LIST_EVERY;
    let s = store;
    let listed = 0;
    let serverTime = null;
    const seen = new Set();
    const result = (extra) => ({ full, listed, removed: [], fetched: 0, planned: 0, waiting: 0, ...extra, store: s });

    try {
        for await (const page of listUnits(client, full ? {} : { updatedSince: store.lastServerTime })) {
            // The first page's time is the safe one: a unit changed while later pages load is listed again next run.
            serverTime ??= page.serverTime;
            s = applyList(s, page.units);
            for (const u of page.units) seen.add(unitKey(u));
            listed += page.units.length;
            log(`listed ${listed}`);
        }
    } catch (error) {
        // The list did not finish: keep the rows merged so far, but not the list time, so the next run lists again.
        if (error instanceof MordelAuthError) return result({ stopped: "auth", error });
        return result({ stopped: "error", error });
    }

    const removed = full ? findRemoved(s, seen) : [];
    s = markRemoved(s, removed, now);
    s = { ...s, lastServerTime: serverTime ?? s.lastServerTime, lastFull: full ? now : s.lastFull };

    const plan = planDetails(s, maxDetail);
    if (dryRun) return result({ removed, planned: plan.todo.length, waiting: plan.waiting });

    let fetched = 0;
    let stopped;
    let failure;
    for (const key of plan.todo) {
        const [type, id] = key.split("/");
        let answer;
        try {
            answer = await client.get(`/units/${encodeURIComponent(type)}/${encodeURIComponent(id)}`);
        } catch (error) {
            stopped = error instanceof MordelAuthError ? "auth" : "error";
            failure = error;
            break;
        }
        if (!answer?.unit) {
            s = markRemoved(s, [key], now);
            continue;
        }
        await writeDetail(key, answer.unit);
        s = applyDetail(s, key, answer.unit);
        fetched++;
    }
    const waiting = planDetails(s, 0).waiting;
    return result({ removed, fetched, planned: plan.todo.length, waiting, ...(stopped ? { stopped, error: failure } : {}) });
}
