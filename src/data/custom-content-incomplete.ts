// Tags of the custom drafts registered in this browser whose stats are not all entered yet, with their names.
// Kept apart from custom-content-local.ts so the unit classes can read it without importing the registries.
// (BV, heat and cost of a design that uses one are not reliable: unknown stats count as 0.)

let incomplete = new Map<string, string>();
let estimatedFields = new Map<string, { name: string; fields: string[] }>();

export function setIncompleteCustomContent(entries: { tag: string; name: string; estimated?: string[] }[]): void {
    incomplete = new Map(entries.map((entry) => [entry.tag, entry.name]));
    estimatedFields = new Map(entries.filter((entry) => (entry.estimated ?? []).length > 0).map((entry) => [entry.tag, { name: entry.name, fields: entry.estimated! }]));
}

const FIELD_WORDS: Record<string, string> = { weight: "tons", "space.battlemech": "slots", techBase: "tech base" };

/** The estimated fields of the drafts whose tags appear in `text`, as "Name: tons (estimated), slots (estimated)". */
export function findEstimatedCustomFields(text: string): string[] {
    const lines: string[] = [];
    for (const [tag, entry] of estimatedFields) {
        if (!text.includes(JSON.stringify(tag))) continue;
        lines.push(`${entry.name}: ${entry.fields.map((field) => `${FIELD_WORDS[field] ?? field} (estimated)`).join(", ")}`);
    }
    return lines;
}

/** The incomplete drafts whose tags appear in `text` (a design's export), by name. */
export function findIncompleteCustomContent(text: string): string[] {
    const names: string[] = [];
    for (const [tag, name] of incomplete) {
        if (text.includes(JSON.stringify(tag)) && !names.includes(name)) names.push(name);
    }
    return names;
}

export function hasIncompleteCustomContent(): boolean {
    return incomplete.size > 0;
}
