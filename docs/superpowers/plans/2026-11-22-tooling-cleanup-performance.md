# Tooling, Cleanup and Performance Implementation Plan (#210, #211, #220)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A file-state audit that removes what nothing uses (#210); drop the `typescript-7` alias once typescript-eslint allows it (#211); and the measured performance items: MUL chunk loads, hot-path clones, the `src/utils.ts` split, `appGlobals` re-renders, Bootstrap CSS trim and `process.env.PUBLIC_URL` (#220).

**Architecture:** No behaviour change anywhere. Every removal is proven unused (a tool report plus a green `npm run check`), every performance change is measured before and after with the same script, and nothing ships that does not improve its number.

**Tech Stack:** Node, knip (dev-only, run through `npx`, not added to `package.json` unless the owner says so), Vite, Vitest, Playwright (the e2e suite).

**Spec:** the issues. Facts on 2026-11-22: `package.json` has `"typescript": "~6.0.3"`, `"typescript-7": "npm:typescript@^7.0.2"`, `"typescript-eslint": "^8.71.0"`; `src/utils.ts` is 1,242 lines; 144 `JSON.parse(JSON.stringify(` clones and 214 `process.env.PUBLIC_URL` uses in `src`; MUL data in `src/data/mul/{live,mul1,custom}`.

## Global Constraints

- License files are never cleanup candidates: `LICENSE` (GPLv3) and `LICENSE-MIT` stay, pinned by `src/license-files.test.ts`; add any new license or notice file to that test.
- A file referenced by `package.json`, a workflow, the docs or another tracked file stays. Generated reports and staging files are kept only if something reads them; otherwise they are regenerated on demand and removed from git.
- One area per commit, `npm run check` green before each (from PowerShell; the known load-sensitive timeouts pass alone).
- Performance: measure first (Task 3), and record the before/after numbers in each commit message.
- Vitest: `npx vitest run --project unit <path>`. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **knip as a dependency?** Recommended: no; run it with `npx knip@<pinned version>` from the audit script, so `package.json` does not grow.
2. **Bootstrap trim.** Recommended: import only the Bootstrap SCSS partials the app uses (measured by a purge report), keep `react-bootstrap`; if the saving is under 20 KB gzipped, skip it.

## Usual checklist

Records, construction, record sheet, play, Alpha Strike, TRO, credits: none (no content change). News: one bullet only if a user-visible speed-up lands. Review, check, deploy, issue comments: Task 6.

## Review Focus

- A "dead" export that a test or a dynamic `import.meta.glob` uses: never removed (the glob patterns in `vite.config.mts` and `src/data/bundled-*.ts` are checked by hand).
- Clone replacements: `structuredClone` keeps `Date`s and nested arrays the way the old JSON clone flattened them; where the old code relied on JSON's flattening (Dates to strings), keep the JSON clone and comment why.
- `utils.ts` split: every old import path still works (re-exports) until the last caller moves.

---

### Task 1: File-state audit (#210)

- [ ] Write `scripts/file-audit.mjs` (dev only, run with `node scripts/file-audit.mjs`): lists tracked files under `tools/`, `scripts/`, `command-line-scripts/`, `src/bin/` that no `package.json` script, workflow (`.github/workflows/*.yml`), doc or tracked source mentions; lists `tools/*-report.json`, `tools/*-staging.jsonl`, `tools/equipment-inventory-*` and whether anything reads them; runs `npx knip@<version> --reporter json` for unused files, exports and dependencies.
- [ ] Review the report in the ledger `.superpowers/sdd/2026-11-22-tooling/progress.md`; remove in small commits (`Cleanup: <area> (#210)`), each with `npm run check` green.

### Task 2: Drop the typescript-7 alias (#211), when unblocked

- [ ] Check: `npm view typescript-eslint peerDependencies` and the typescript-eslint release notes. Unblocked when its `typescript` range includes 7.x (it was `>=4.8.4 <6.1.0` on 2026-10-26) and TypeScript 7 ships its JS API.
- [ ] If still blocked: comment the check's result on #211 and stop.
- [ ] If unblocked: set `"typescript": "^7.x"`, remove `"typescript-7"`, remove the fallback in `scripts/typecheck.mjs`, run `npm install`, `npm run check`. Commit `Tooling: TypeScript 7 is the only typescript (#211)`.

### Task 3: Measure (#220)

- [ ] Write `scripts/perf-measure.mjs`: production build sizes per chunk (from `vite build` output), a Playwright run that records the number and total time of MUL chunk requests on the Classic MUL search and the AS roster add page, and React Profiler render counts for the home, creator and roster pages under one `appGlobals` change. Save the baseline in the ledger.

### Task 4: The measured changes (#220)

- [ ] 3.4 MUL chunk loads: only if Task 3 shows the 44 loads cost more than 300 ms on a cold load, batch them (one request per list, or a prefetch on idle); else record "not worth it" and skip.
- [ ] 3.5 Hot-path clones: replace `JSON.parse(JSON.stringify(...))` with `structuredClone` or no clone where a profile shows it in a hot path (render, BV, conversion loops), one file per commit, with that file's tests.
- [ ] 3.6 `src/utils.ts` split: move groups of functions into `src/utils/<topic>.ts` files (the folder exists), re-exporting from `utils.ts`; then move callers; then drop the re-exports.
- [ ] 3.7 `appGlobals` re-renders: where Task 3's counts show whole-tree renders, pass narrower props or memoize; tests pin that a change to one save list does not re-render an unrelated page.
- [ ] 3.8 Bootstrap CSS (OWNER CALL 2).
- [ ] 3.9 `process.env.PUBLIC_URL`: replace with `import.meta.env.BASE_URL` through one helper (`src/utils/base-url.ts` only if no helper exists; grep `PUBLIC_URL` defines in `vite.config.mts`), keeping the define until the last use is gone.
- [ ] Each: re-run Task 3's script; commit `Performance: <item>, <before> to <after> (#220)`.

### Task 5: Close-out numbers

- [ ] Final Task 3 run; the numbers go in the #220 comment.

### Task 6: Review and ship

- [ ] **Check:** `npm run check` and the Chromium e2e suite.
- [ ] **Review:** one Sonnet review of the removals, one Opus review of the `utils.ts` split.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #210, #211 (status or done), #220 in NGCFells' voice; close the finished ones; give the URLs.

## Models

Sonnet throughout; Haiku for Task 2's check.
