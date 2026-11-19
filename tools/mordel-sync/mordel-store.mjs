// The local mirror's index: one entry per unit, keyed "type/id". Functions return a new store and never delete an entry:
// a unit mordel.net no longer lists is marked `removed` with the time it was noticed.

export const unitKey = (u) => `${u.unit_type_short}/${u.id}`;

/** When the unit last changed: `updated` is null on units never edited, so fall back to `created`. */
export const stampOf = (u) => u.updated ?? u.created;

/** Merge list rows. A listed unit is present, so any `removed` mark is cleared. */
export function applyList(store, rows) {
    const units = { ...store.units };
    for (const u of rows) {
        const key = unitKey(u);
        const previous = { ...units[key] };
        delete previous.removed;
        units[key] = { ...previous, type: u.unit_type_short, id: u.id, name: u.name, canon: u.canon, stamp: stampOf(u) };
    }
    return { ...store, units };
}

/** Record that the detail for this stamp is saved. */
export function applyDetail(store, key, detail) {
    const previous = store.units[key] ?? { type: detail.unit_type_short, id: detail.id, name: detail.name, stamp: stampOf(detail) };
    return { ...store, units: { ...store.units, [key]: { ...previous, detailStamp: stampOf(detail) } } };
}

/** Units whose detail is missing or older than the list says, oldest change first; `max` of them now, the rest wait. */
export function planDetails(store, max) {
    const due = Object.entries(store.units)
        .filter(([, e]) => e.removed == null && e.detailStamp !== e.stamp)
        .sort(([ka, a], [kb, b]) => a.stamp - b.stamp || (ka < kb ? -1 : 1))
        .map(([key]) => key);
    const todo = due.slice(0, Math.max(0, max));
    return { todo, waiting: due.length - todo.length };
}

/** Keys in the store (not yet marked removed) that a full list did not return. */
export function findRemoved(store, listedKeys) {
    return Object.keys(store.units)
        .filter((key) => !listedKeys.has(key) && store.units[key].removed == null)
        .sort();
}

/** Where a unit's detail is saved, as path parts under the mirror folder. The key comes from the API, so it is checked. */
export function detailFile(key) {
    const match = /^([a-z]{1,8})\/(\d{1,9})$/.exec(key);
    if (!match) throw new Error(`not a unit key: ${JSON.stringify(key)}`);
    return ["units", match[1], `${match[2]}.json`];
}

export function markRemoved(store, keys, time) {
    if (!keys.length) return store;
    const units = { ...store.units };
    for (const key of keys) if (units[key]) units[key] = { ...units[key], removed: time };
    return { ...store, units };
}
