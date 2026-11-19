// Tags of the custom drafts registered in this browser whose stats are not all entered yet, with their names.
// Kept apart from custom-content-local.ts so the unit classes can read it without importing the registries.
// (BV, heat and cost of a design that uses one are not reliable: unknown stats count as 0.)

let incomplete = new Map<string, string>();

export function setIncompleteCustomContent(entries: { tag: string; name: string }[]): void {
    incomplete = new Map(entries.map((entry) => [entry.tag, entry.name]));
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
