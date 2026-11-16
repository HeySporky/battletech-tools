#!/usr/bin/env node
// Safety net for condensing the unit tests.
//
//   node scripts/test-audit/test-audit.mjs baseline   run the suite, save coverage + assertion counts as the baseline
//   node scripts/test-audit/test-audit.mjs compare    run the suite again and fail if anything was lost
//   node scripts/test-audit/test-audit.mjs compare --no-run   compare the last run without re-running
//
// "Lost" means any of:
//   - a source file covers fewer lines, statements, branches or functions than at baseline
//   - the suite makes fewer expect() calls at runtime than at baseline
//   - a test fails
// Baseline and last run live in .test-audit/ (git-ignored). Per-test-file assertion changes are printed so a reviewer
// can see where calls moved when files are merged.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const auditDir = join(root, ".test-audit");
const mode = process.argv[2];
const noRun = process.argv.includes("--no-run");
if (mode !== "baseline" && mode !== "compare") {
    console.error("usage: test-audit.mjs baseline|compare [--no-run]");
    process.exit(2);
}

function run(outName) {
    const out = join(auditDir, outName);
    const countsDir = join(out, "counts");
    rmSync(out, { recursive: true, force: true });
    mkdirSync(countsDir, { recursive: true });
    const started = Date.now();
    const result = spawnSync(
        "npx",
        [
            "vitest", "run", "--project", "unit", "--project", "data", "--coverage",
            "--coverage.reporter=json-summary", `--coverage.reportsDirectory=${join(out, "coverage")}`,
            "--reporter=json", `--outputFile=${join(out, "results.json")}`,
        ],
        { stdio: ["ignore", "inherit", "inherit"], shell: true, env: { ...process.env, TEST_AUDIT_DIR: countsDir } },
    );
    const seconds = Math.round((Date.now() - started) / 1000);
    writeFileSync(join(out, "meta.json"), JSON.stringify({ seconds, exit: result.status }));
    return out;
}

function load(dir) {
    const results = JSON.parse(readFileSync(join(dir, "results.json"), "utf8"));
    const coverageRaw = JSON.parse(readFileSync(join(dir, "coverage", "coverage-summary.json"), "utf8"));
    const coverage = {};
    for (const [file, summary] of Object.entries(coverageRaw)) {
        if (file === "total") continue;
        coverage[relative(root, file).replace(/\\/g, "/")] = summary;
    }
    const assertions = {};
    for (const name of readdirSync(join(dir, "counts"))) {
        const { file, counts } = JSON.parse(readFileSync(join(dir, "counts", name), "utf8"));
        assertions[file] = Object.values(counts).reduce((a, b) => a + b, 0);
    }
    const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
    return {
        tests: { total: results.numTotalTests, passed: results.numPassedTests, failed: results.numFailedTests,
            skipped: results.numPendingTests + (results.numTodoTests ?? 0) },
        files: results.testResults.length, coverage, assertions, meta,
    };
}

function totalAssertions(a) {
    return Object.values(a).reduce((x, y) => x + y, 0);
}

function testLines() {
    let files = 0, lines = 0;
    (function walk(d) {
        for (const e of readdirSync(d, { withFileTypes: true })) {
            const p = join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (/\.test\.tsx?$/.test(e.name)) { files++; lines += readFileSync(p, "utf8").split("\n").length; }
        }
    })(join(root, "src"));
    return { files, lines };
}

function describe(label, s, t = testLines()) {
    console.log(`${label}: ${s.tests.passed} passed / ${s.tests.failed} failed / ${s.tests.skipped} skipped, `
        + `${s.files} test files, ${t.lines} test lines, ${totalAssertions(s.assertions)} expect() calls, `
        + `${s.meta.seconds}s`);
}

mkdirSync(auditDir, { recursive: true });
if (mode === "baseline") {
    const dir = run("baseline");
    const s = load(dir);
    describe("Baseline", s);
    writeFileSync(join(dir, "lines.json"), JSON.stringify(testLines()));
    process.exit(s.tests.failed ? 1 : 0);
}

if (!existsSync(join(auditDir, "baseline", "results.json"))) {
    console.error("No baseline. Run `node scripts/test-audit/test-audit.mjs baseline` on the unchanged branch first.");
    process.exit(2);
}
const base = load(join(auditDir, "baseline"));
const now = load(noRun ? join(auditDir, "current") : run("current"));
const baseLines = JSON.parse(readFileSync(join(auditDir, "baseline", "lines.json"), "utf8"));
describe("Baseline", base, baseLines);
describe("Current ", now);

const problems = [];
if (now.tests.failed) problems.push(`${now.tests.failed} failing test(s)`);

const metrics = ["lines", "statements", "branches", "functions"];
for (const [file, b] of Object.entries(base.coverage)) {
    const c = now.coverage[file];
    if (!c) { problems.push(`coverage: ${file} no longer measured`); continue; }
    for (const m of metrics) {
        if (c[m].covered < b[m].covered) {
            problems.push(`coverage: ${file} ${m} ${b[m].covered} -> ${c[m].covered} covered`);
        }
    }
}

const baseTotal = totalAssertions(base.assertions);
const nowTotal = totalAssertions(now.assertions);
if (nowTotal < baseTotal) problems.push(`assertions: ${baseTotal} -> ${nowTotal} expect() calls`);

const changed = new Set([...Object.keys(base.assertions), ...Object.keys(now.assertions)]);
const moves = [];
for (const file of changed) {
    const b = base.assertions[file] ?? 0, c = now.assertions[file] ?? 0;
    if (b !== c) moves.push(`  ${c - b > 0 ? "+" : ""}${c - b}\t${file}${c === 0 ? " (gone)" : b === 0 ? " (new)" : ""}`);
}
if (moves.length) console.log(`\nexpect() calls moved, per test file:\n${moves.sort().join("\n")}`);

if (problems.length) {
    console.log(`\nFAIL: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
    process.exit(1);
}
console.log("\nOK: no test failures, no coverage lost, no expect() calls lost.");
