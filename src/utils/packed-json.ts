// Lists of objects stored as tables (#241 and the MUL lists): the keys once, then a row of values per object, so a
// file of thousands of records does not repeat every key in every record. tools/mul-sync/pack-json.mjs writes the
// same format for the weekly MUL sync.

const TABLE_KEYS = "$k";
const TABLE_ROWS = "$v";
// The cell value for a field an object does not have: null, unless the table holds a real null, then the first of
// the others its values never use.
const TABLE_ABSENT = "$a";
const ABSENT_MARKERS: unknown[] = [null, "$-", "$--", "$---"];

// A field whose value is an object in every record that has it (a MUL record's Role) is split into a column per key
// of its own ("Role.Name"), the fields named in "$o".
const TABLE_OBJECTS = "$o";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === "object" && !Array.isArray(value) && !(TABLE_KEYS in value);

/** The records with each object field split into one field per key, and the fields split. */
function flatten(items: Record<string, unknown>[]): { items: Record<string, unknown>[]; objects: string[] } {
    const keys = [...new Set(items.flatMap((item) => Object.keys(item)))];
    const objects = keys.filter((key) => !key.includes(".") && items.every((item) => !(key in item)
        || isPlainObject(item[key]) && Object.keys(item[key]).length > 0 && Object.keys(item[key]).every((inner) => !inner.includes("."))));
    if (objects.length === 0) return { items, objects };
    return {
        objects,
        items: items.map((item) => Object.fromEntries(Object.entries(item).flatMap(([key, field]) => objects.includes(key)
            ? Object.entries(field as object).map(([inner, innerField]) => [key + "." + inner, innerField]) : [[key, field]]))),
    };
}

/** A list of two or more objects becomes a table, here and in every list inside it. */
export function tabulate(value: unknown): unknown {
    if (Array.isArray(value)) {
        const tabulated = value.map(tabulate);
        if (tabulated.length < 2 || !tabulated.every(isPlainObject)) return tabulated;
        const { items, objects } = flatten(tabulated as Record<string, unknown>[]);
        // A field set to undefined is left out, as JSON leaves it out of a plain object.
        const defined = (item: unknown) => Object.entries(item as object).filter(([, field]) => field !== undefined);
        const keys = [...new Set(items.flatMap((item) => defined(item).map(([key]) => key)))];
        const values = new Set(items.flatMap((item) => defined(item).map(([, field]) => field as unknown)));
        const absent = ABSENT_MARKERS.find((marker) => !values.has(marker));
        if (absent === undefined) return tabulated;
        return {
            [TABLE_KEYS]: keys,
            ...(objects.length > 0 ? { [TABLE_OBJECTS]: objects } : {}),
            ...(absent === null ? {} : { [TABLE_ABSENT]: absent }),
            [TABLE_ROWS]: items.map((item) => keys.map((key) => (item as Record<string, unknown>)[key] !== undefined ? (item as Record<string, unknown>)[key] : absent)),
        };
    }
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, tabulate(item)]));
    return value;
}

/** The value tabulate was given. A plain list or object passes through, so files in the old form still read. */
export function untabulate(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(untabulate);
    if (value && typeof value === "object") {
        const table = value as Record<string, unknown>;
        if (Array.isArray(table[TABLE_KEYS]) && Array.isArray(table[TABLE_ROWS])) {
            const keys = table[TABLE_KEYS] as string[];
            const absent = TABLE_ABSENT in table ? table[TABLE_ABSENT] : null;
            const objects = (table[TABLE_OBJECTS] ?? []) as string[];
            return (table[TABLE_ROWS] as unknown[][]).map((row) => {
                const record: Record<string, unknown> = {};
                keys.forEach((key, index) => {
                    if (row[index] === absent) return;
                    const dot = key.indexOf(".");
                    if (dot > 0 && objects.includes(key.slice(0, dot))) {
                        const outer = key.slice(0, dot);
                        record[outer] = { ...(record[outer] as object | undefined), [key.slice(dot + 1)]: untabulate(row[index]) };
                    } else {
                        record[key] = untabulate(row[index]);
                    }
                });
                return record;
            });
        }
        return Object.fromEntries(Object.entries(table).map(([key, item]) => [key, untabulate(item)]));
    }
    return value;
}

/** A tabulated list as file text, one row a line so a change to one record is a one-line diff. */
export function stringifyTable(records: unknown[]): string {
    const table = tabulate(records);
    if (Array.isArray(table)) return JSON.stringify(table) + "\n";
    const { [TABLE_ROWS]: rows, ...head } = table as Record<string, unknown>;
    const opening = JSON.stringify(head).slice(0, -1);
    return `${opening},"${TABLE_ROWS}":[\n${(rows as unknown[]).map((row) => JSON.stringify(row)).join(",\n")}\n]}\n`;
}
