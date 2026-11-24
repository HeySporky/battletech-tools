// Loaded only when TEST_AUDIT_DIR is set (see scripts/test-audit/test-audit.mjs). Records how many expect() calls each
// test made at runtime, so condensing tests (it.each tables, shared helpers, merged files) can prove no assertion was
// lost: a table-driven rewrite makes the same number of expect() calls as the hand-written tests it replaces.
import { writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { afterAll, afterEach, expect } from "vitest";

const counts: Record<string, number> = {};
let testFile = "";

afterEach(() => {
    const state = expect.getState();
    testFile = state.testPath ?? testFile;
    const name = state.currentTestName ?? "(unnamed)";
    counts[name] = (counts[name] ?? 0) + state.assertionCalls;
});

afterAll(() => {
    const dir = process.env.TEST_AUDIT_DIR;
    if (!dir || !testFile) return;
    const file = relative(process.cwd(), testFile).replace(/\\/g, "/");
    writeFileSync(join(dir, `${file.replace(/[\\/:]/g, "__")}.json`), JSON.stringify({ file, counts }));
});
