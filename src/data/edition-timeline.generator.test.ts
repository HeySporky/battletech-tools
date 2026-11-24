import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { ALL_RULES_EDITION_UNIT_TYPES, getEditionTimeline } from "./rules-editions";

// The edition timeline for tools/book_editions.py (design 2026-10-24-catalog-consolidation §3), so the book → edition
// table reads the same timeline the app does. Run with EDITION_TIMELINE_OUT=<file.json>; skipped otherwise.
const OUT = process.env.EDITION_TIMELINE_OUT;

it.skipIf(!OUT)("writes the edition timeline", () => {
    writeFileSync(OUT!, JSON.stringify({ unitTypes: ALL_RULES_EDITION_UNIT_TYPES, timeline: getEditionTimeline() }, null, 2));
});
