# #76 Leftovers: RISC Pulse Module Alpha Strike and the SSW Import Clarification Step

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, NGCFells' standing choice) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the last two real items of #76: an Alpha Strike conversion for the six RISC Laser Pulse Module lasers, and the "ask the importer" clarification step before an SSW import is accepted.

**Architecture:** The pulse module is a data fix in `equipment-energy.ts`, checked against the MUL. The clarification step splits `runSSWImportSession` into an analyze pass, which finds the unknown items and their best guesses, and an accept pass, which takes the answers and builds the drafts from them. `ssw-file-import.tsx` shows one question form per unknown item and keeps Save disabled until every required answer is given.

**Tech Stack:** TypeScript, React class components, Vitest (run from PowerShell).

**Spec:** the approved design of 2026-09-30, quoted verbatim from the retired TODO.md (`git show eb5b8e1d7^:TODO.md`, line 129): "before an SSW import is accepted, ask the importer about each new unknown item (tech base IS/Clan, tons, slots; optional damage/heat/ranges and a source note), each with 'I don't know'. Best guesses: design's tech base, the slot estimate, the tonnage gap split across unknown-weight items, all marked estimated. Accept stays disabled until every required answer is given. Split the session into analyze and accept-with-answers." Discussion: https://github.com/ngcfells/battletech-tools/discussions/54

## Already done (verified 2026-11-22; tick these on #76)

- SSW importer: merged (f14432736); `ssw-canon-pending-names.ts` is down to its last entries.
- Ferro-Aluminum note: back in `mech-armor-types.ts:489-493`.
- Source search and play rules for the custom catalogs: guarded by `src/data/custom-completeness.test.ts` (notes, lore, rules, dates, BV, cost, AS).
- Alpha Strike "unresolved" conversions: none left except the six pulse-module lasers (Task 1).
- `tools/spec-c-sources-staging.jsonl`: retired with the local tooling (66850b1ac). Nothing to review.
- Cockpit callout: added to HeySporky/battletech-tools#122's description on 2026-11-22 (upstream `master` puts these cockpits in `ct`, `battlemech.ts:3494-3496`).

## Global Constraints

- Rules: check the ResourceLibrary extract first. Pull a page image only if the extract is missing, garbled or in doubt. Every page image pulled goes back whole into every printing's extract and `_corrected_pages.md`, then gets pushed.
- No apostrophes in Bash commands or heredocs: write scripts with Write first. Run vitest from PowerShell.
- An "I don't know" answer is a valid answer. It keeps the best guess and marks the field estimated.
- Required answers: tech base, tons and slots, for every kind that has weight and slots. Damage, heat, ranges and the source note are optional.

## Review Focus

- A batch where two files share one unknown item: one question, answered once, applied to both designs.
- A design with no tonnage gap (unknown items weigh 0 by subtraction): the tons guess is 0, marked estimated, not NaN.
- An unknown item already drafted by an earlier import: no question is asked again. It is a known draft.
- Reopening the page after answering but before saving: answers are lost and the session starts again (no half-saved drafts).
- Cockpit and canon-pending items are never asked about (they are skipped today in `buildDrafts`).

---

### Task 1: RISC Laser Pulse Module Alpha Strike values

**Files:**
- Modify: `src/data/equipment-energy.ts:2152-2157` (the six `*-risc-pulse-module` records)
- Test: `src/data/alpha-strike-custom-647.test.ts` (extend; it already guards unresolved notes)

The rule: IO:AE p.197 (Corrected 2nd printing; extract `InterstellarOperationsAlternateEras-CGL-2021-Corrected2ndPrinting.txt` line 14444): "these effects are factored into the heat and damage values provided by the modified weapon." Game rules, IO:AE p.87: pulse mode keeps damage and range, -2 to-hit, +2 heat.

- [ ] **Step 1: Find the factor.** Read how the Alpha Strike Companion's conversion treats a weapon's to-hit modifier (extract `Alpha-Strike-Companion.txt`, the Converting chapter). Then list every MUL unit carrying a pulse module (`src/data/mul/`, search the MegaMek files for `PulseModule`) and compare its MUL damage with the plain laser's. Record the factor, the page and the MUL check in the record notes.
- [ ] **Step 2: Write the failing test** `it("the RISC pulse module lasers have their converted damage and heat, not an unresolved note")`. For each of the six tags: there's no `Unresolved` note, `heat` = plain laser AS heat for pulse-mode heat (+2), and `rangeShort`/`rangeMedium`/`rangeLong` = the plain laser value times the Step 1 factor.
- [ ] **Step 3: Run** `npx vitest run src/data/alpha-strike-custom-647.test.ts`. Expected: FAIL.
- [ ] **Step 4: Set the six records' `alphaStrike` values** and replace the note with the cited one.
- [ ] **Step 5: Run** the test, then `npx vitest run src/data src/classes/battlemech-alpha*`. Expected: PASS, and no MUL-match test moves the wrong way.
- [ ] **Step 6: Commit** `Alpha Strike: RISC Laser Pulse Module lasers convert (IO:AE p.197) (#76)`.

### Task 2: Analyze pass with best guesses

**Files:**
- Modify: `src/utils/sswImportSession.ts`, `src/utils/sswDraftBuilder.ts`
- Test: `src/utils/sswImportSession.test.ts`, `src/utils/sswDraftBuilder.test.ts`

**Interfaces:**
- Produces:
  - `interface ISSWImportQuestion { key: string; kind: CustomContentKind; name: string; designs: string[]; guess: ISSWImportAnswer; required: ("techBase" | "tons" | "slots")[]; }`. `key` is `${kind}|${faction}|${name.toLowerCase()}`, the same identity `draftMatches` uses.
  - `interface ISSWImportAnswer { techBase: "is" | "clan" | null; tons: number | null; slots: number | null; damage?: number | null; heat?: number | null; range?: { short: number; medium: number; long: number } | null; sourceNote?: string; unknown: { techBase: boolean; tons: boolean; slots: boolean }; }`
  - `analyzeSSWImport(files: ISSWImportFile[], existingDrafts: ICustomContentDraft[]): Promise<{ results: ISSWImportResult[]; questions: ISSWImportQuestion[] }>`. This is the first half of today's `runSSWImportSession`, and it saves nothing.
  - `guessTonnage(gapTons: number, unknownWeightCount: number): number`. Splits the gap evenly, rounded to 0.5 t, never below 0.
- Consumes: `estimateItemSlots`, `draftMatches`, `isSSWCanonPending` (existing).

- [ ] **Step 1: Write the failing tests:**
  - `analyzeSSWImport` on one test file with two unknown items gives two questions. Guesses: the design's tech base, the slot estimate, and `guessTonnage(gap, 2)` for each. Every `unknown` flag is false and `required` is `["techBase","tons","slots"]` for equipment.
  - Two files sharing one unknown item give one question with both designs.
  - An item matching an existing draft gives no question.
  - Cockpit and canon-pending items give no question.
  - `guessTonnage(3, 2) === 1.5`, `guessTonnage(1, 3) === 0.5`, `guessTonnage(0, 2) === 0`, `guessTonnage(-1, 1) === 0`.
  - Nothing is saved: the `save` spy is never called.
- [ ] **Step 2: Run** `npx vitest run src/utils/sswImportSession.test.ts src/utils/sswDraftBuilder.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `analyzeSSWImport` and `guessTonnage`. The tonnage gap is `mech.getTonnage() - mech.getCurrentTonnage()` with no placeholders registered.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `SSW import: analyze pass with best guesses (#76)`.

### Task 3: Accept pass with answers

**Files:**
- Modify: `src/utils/sswImportSession.ts`, `src/utils/sswDraftBuilder.ts`
- Test: same files

**Interfaces:**
- Produces:
  - `acceptSSWImport(analysis: { results: ISSWImportResult[]; questions: ISSWImportQuestion[] }, answers: Record<string, ISSWImportAnswer>, options): Promise<{ results; drafts; saved; evidenceSaved }>`. `options` are today's `runSSWImportSession` options.
  - `missingAnswers(question: ISSWImportQuestion, answer: ISSWImportAnswer | undefined): string[]`. A required field is answered when it has a value, or when its `unknown` flag is true.
  - `buildDrafts(entries, existing, newId, answers?: Record<string, ISSWImportAnswer>)`. A new optional parameter: each new draft takes the answered faction, weight, `space.battlemech`, damage, heat, range and `sourceNote`. Every field answered "I don't know", or left at the guess, is listed in a new `ICustomContentDraft.estimated?: string[]` and shows in `missingFields` as `estimated:<field>`.
  - `runSSWImportSession` stays as `analyze` then `accept` with the guesses as the answers, so other callers and tests keep their behavior.

- [ ] **Step 1: Write the failing tests:**
  - `missingAnswers` returns `["tons"]` when tons is null and not unknown, and `[]` when `unknown.tons` is true.
  - `acceptSSWImport` with an answer of 2 t and 2 slots gives a draft with `weight: 2` and `space.battlemech: 2`. The re-imported design weighs its full tonnage.
  - An "I don't know" on tons keeps the guess and gives `estimated: ["weight"]`. `missingFields` includes `estimated:weight`.
  - `runSSWImportSession` results are unchanged on the existing fixtures (no new assertions; the old tests still pass).
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement** the accept pass and the `buildDrafts` answers parameter. Add `estimated?: string[]` to `ICustomContentDraft` in `src/data/custom-content-types.ts`.
- [ ] **Step 4: Run** `npx vitest run src/utils src/data/custom-content-local.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `SSW import: accept pass takes the importer's answers (#76)`.

### Task 4: The questions on the import page

**Files:**
- Modify: `src/ui/pages/classic-battletech/mech-creator/ssw-file-import.tsx`
- Test: `src/ui/pages/classic-battletech/mech-creator/ssw-file-import.test.tsx` (create if missing; happy-dom, MemoryRouter, as `top-menu.test.tsx` does)

- [ ] **Step 1: Write the failing tests:**
  - After choosing a file with one unknown item, a fieldset named after the item shows Tech base (Inner Sphere / Clan), Tons and Slots, filled with the guesses. Each has an "I don't know" checkbox. Damage, Heat, Ranges and Source note are optional.
  - "Save selected to my 'Mechs" is disabled while a required field is empty and not marked "I don't know".
  - Saving calls `acceptSSWImport` with the typed answers, and the saved design weighs the answered tons.
  - A file with no unknown items shows no questions and Save is enabled at once.
- [ ] **Step 2: Run** `npx vitest run src/ui/pages/classic-battletech/mech-creator/ssw-file-import.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.** On file choice, call `analyzeSSWImport` and keep `questions` and `answers` (seeded from the guesses) in state. Save calls `acceptSSWImport`, then today's save-selected path. Answers live only in state.
- [ ] **Step 4: Run** the test and `npx vitest run src/ui/pages/classic-battletech/mech-creator`. Expected: PASS.
- [ ] **Step 5: Commit** `SSW import: ask the importer about each unknown item (#76)`.

### Task 5: Checklist, review and ship

- [ ] **TRO / record sheet:** an estimated field shows "(estimated)" after its value on the custom item's TRO line, in `custom-content-incomplete.ts` wording. Test that it does.
- [ ] **Play / Alpha Strike:** none beyond Task 1. The drafts play as the custom records they already are.
- [ ] **Credits:** none (no new author content).
- [ ] **News:** one bullet in the newest entry of `src/ui/pages/home.tsx`: "SSW import asks about unknown items (issue #76)" and "RISC Laser Pulse Module lasers in Alpha Strike".
- [ ] **Check:** `npm run check` from PowerShell. Expected: green, except the known load-sensitive Dire Wolf omni timeout (passes alone).
- [ ] **Review:** one astech Opus whole-branch review. Fix Critical and Important findings test-first.
- [ ] **Ship:** `git push origin bv-gaps:beta`, `git deploy-beta` (expect "Published").
- [ ] **Issue:** tick every box on #76 and comment in NGCFells' voice listing what shipped (and the PR #122 callout). Close #76 and give NGCFells the comment URL.
