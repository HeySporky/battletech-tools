// The table format of src/utils/packed-json.ts, for the MUL sync, which runs as plain Node and cannot import the
// TypeScript. src/utils/packed-json.test.ts checks this writes what the app's own writer does.

const ABSENT_MARKERS = [null, "$-", "$--", "$---"];

const isPlainObject = (value) => !!value && typeof value === "object" && !Array.isArray(value) && !("$k" in value);

/** The records with each object field split into one field per key ("Role.Name"), and the fields split. */
function flatten(items) {
    const keys = [...new Set(items.flatMap((item) => Object.keys(item)))];
    const objects = keys.filter((key) => !key.includes(".") && items.every((item) => !(key in item)
        || isPlainObject(item[key]) && Object.keys(item[key]).length > 0 && Object.keys(item[key]).every((inner) => !inner.includes("."))));
    if (objects.length === 0) return { items, objects };
    return {
        objects,
        items: items.map((item) => Object.fromEntries(Object.entries(item).flatMap(([key, field]) => objects.includes(key)
            ? Object.entries(field).map(([inner, innerField]) => [key + "." + inner, innerField]) : [[key, field]]))),
    };
}

/** A list of two or more objects becomes a table, here and in every list inside it. */
export function tabulate(value) {
    if (Array.isArray(value)) {
        const tabulated = value.map(tabulate);
        if (tabulated.length < 2 || !tabulated.every(isPlainObject)) return tabulated;
        const { items, objects } = flatten(tabulated);
        const keys = [...new Set(items.flatMap((item) => Object.keys(item)))];
        const values = new Set(items.flatMap((item) => Object.values(item)));
        const absent = ABSENT_MARKERS.find((marker) => !values.has(marker));
        if (absent === undefined) return tabulated;
        return {
            $k: keys,
            ...(objects.length > 0 ? { $o: objects } : {}),
            ...(absent === null ? {} : { $a: absent }),
            $v: items.map((item) => keys.map((key) => key in item ? item[key] : absent)),
        };
    }
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, tabulate(item)]));
    return value;
}

/** A tabulated list as file text, one row a line so a change to one record is a one-line diff. */
export function stringifyTable(records) {
    const table = tabulate(records);
    if (Array.isArray(table)) return JSON.stringify(table) + "\n";
    const { $v: rows, ...head } = table;
    return `${JSON.stringify(head).slice(0, -1)},"$v":[\n${rows.map((row) => JSON.stringify(row)).join(",\n")}\n]}\n`;
}
