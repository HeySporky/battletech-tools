# Cited Battle Value and Cost, 'Mechs: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every 'Mech opens to a step-by-step Battle Value and C-bill cost breakdown, per rules edition, each step
citing the page it was checked on, with a public record of where our BV and the Master Unit List (MUL) differ.

**Architecture:** A step-definition table per calculation holds each step's section, citations and status; it is
written by whoever read the page. The calculation emits steps by id into a trace, so the breakdown is the
calculation. The old HTML logs are rendered from the trace. The bundle build writes its MUL comparison as data; a
hand-kept verdict file and a page show it.

**Tech Stack:** TypeScript, React (class and function components, as the page being edited uses), Vitest
(`--project unit`), SCSS. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-10-cited-bv-and-cost-design.md`. Read it first. This plan covers its
rounds 1 to 7 for 'Mechs. Each later unit type gets its own plan on the same model.

## Global Constraints

- **Read the page.** No citation, constant or rounding rule is written from memory. Each is read in
  `C:/repo/ResourceLibrary` (`python library_search.py "<query>" --canon`, `python library_search.py --page <extract> <pdf page>`,
  `python render_page.py` for the page image when the hit is marked OCR or the numbers sit in a table). The page cited
  is the page read.
- **No tuning to hit the MUL.** A number changes only because a cited rule says so.
- **No miss is hidden.** Nothing is dropped from the accuracy record to improve a count.
- **One set of math.** No second description of a calculation beside the calculation.
- Step status is one of `cited`, `provisional` (with a note saying what was chosen and why), `source-missing`.
- A missing source stops that step only: add it to "Sources to ask the owner for" in the ledger and carry on.
- The MUL's BV is a BV2 number: compare only under the current BV2 edition (`total-warfare` line of `BV_RULES`).
- battletech-tools is public: no rulebook text beyond short step labels, no art, no MegaMek, SSW or mordel.net
  numbers. Citations are plain text, never links to book content.
- `upstream/*` is never touched. The mordel list and mirror are not read.
- Saved designs, exports and record sheets do not change, except where a cited fix changes a number. A fix that
  would lower the bundle's match count, or change a printed record sheet value for a kept design, stops for the owner.
- Models: rules reading and anything that decides a number is done by the session's own model (the strongest
  available). Mechanical conversion of log lines to `trace.add` calls: a Claude subagent on `sonnet`. One `opus`
  whole-branch review (Task 12). The `astech` agent is not used.
- Work on branch `beta` in the worktree `C:/repo/battletech-tools-master` (fast-forward it to `master` first). A
  round ends: `npm run check`, commit, `git push origin beta`, `git deploy-beta`, fast-forward `master`, push, comment
  on #599 with what changed and every changed number with its citation. Production deploy is the owner's call.
- Bash tool: a heredoc whose body has an apostrophe is blocked by a hook; write the file with the Write tool.

## Review Focus

1. **An edition with no Battle Value** (Battledroids to the Compendium): the breakdown returns `result: null` and one
   cited step saying BV does not exist in that edition; the view says so and does not show 0. (Task 5)
2. **An unknown or expansion edition tag** passed to a breakdown: it reads the default edition's rules, as
   `getBattleValueRules` does, and never throws. (Task 3)
3. **Equipment or unit names with `<`, `&` or quotes** (custom designs): escaped in the rendered log and shown
   literally in the view. (Tasks 1 and 8)
4. **A bare design** (no weapons, no armor, no jump jets, or a design mid-build with unallocated items): every step
   is finite, no `NaN` or `Infinity` in a step or the result. (Task 3)
5. **A verdict whose unit now matches, or whose key no longer exists**: the test names the stale key; the page
   ignores it without crashing. (Task 10)

## File Structure

| File | Responsibility |
|---|---|
| `src/data/calc-sources.ts` (new) | The registry of books, printings and errata documents a citation may name. |
| `src/data/calc-steps.ts` (new) | Step, definition, breakdown types; `CalcTrace`; citation formatting; HTML rendering. |
| `src/data/calc-steps-mech-bv2.ts` (new) | Step definitions for 'Mech BV2 (TechManual and later books). |
| `src/data/calc-steps-mech-bv1.ts` (new) | Step definitions for 'Mech BV1, per BV1 edition. |
| `src/data/calc-steps-mech-cost.ts` (new) | Step definitions for 'Mech cost. |
| `docs/superpowers/plans/2026-11-10-cited-bv-ledger.md` (new) | The reading ledger: per step id, what was read, where, when, and findings. Prose, our words. |
| `src/classes/battlemech.ts` | `_calcBattleValue`, `_calcBattleValue1`, `_calcCBillCost` emit steps; new breakdown getters; old log getters render. |
| `src/classes/battlemech-bv-examples.test.ts` (new) | The books' worked examples, step by step. |
| `src/ui/components/calc-breakdown.tsx`, `.scss`, `.test.tsx` (new) | The shared breakdown view. |
| `src/data/bundled-mechs-build.ts` | Also writes `src/data/bundled/mechs-accuracy.json`. |
| `src/data/bv-verdicts.ts` (new) | Hand-kept verdicts, keyed by MUL id. |
| `src/ui/pages/classic-battletech/bv-accuracy.tsx`, `.test.tsx` (new) | The public accuracy page. |

---

### Task 1: Step model, sources registry, renderer

**Files:**
- Create: `src/data/calc-sources.ts`, `src/data/calc-steps.ts`
- Test: `src/data/calc-steps.test.ts`

**Interfaces:**
- Produces:

```ts
// calc-sources.ts
export interface ICalcSource { short: string; title: string; printing: string; errataOf?: string }
export const CALC_SOURCES: Record<string, ICalcSource>;   // key = source id, e.g. "tm", "tm-errata-8.0"

// calc-steps.ts
export type CalcStepStatus = "cited" | "provisional" | "source-missing";
export type CalcKind = "battle-value" | "cost";
export interface ICalcCitation { source: string; page: string }            // source is a CALC_SOURCES key
export interface ICalcStepDef { section: string; cites: ICalcCitation[]; status: CalcStepStatus; note?: string }
export type CalcStepDefs = Record<string, ICalcStepDef>;
export interface ICalcStep extends ICalcStepDef {
    id: string;            // the definition's key; repeats for per-item steps
    label: string;         // plain text, unescaped
    detail?: string;       // the arithmetic as shown, plain text
    value?: number;        // this step's result
    total?: number;        // running total after this step, where useful
    emphasis?: boolean;    // a section subtotal or the final line
}
export interface ICalcBreakdown { kind: CalcKind; edition: string; scheme?: "none" | "bv1" | "bv2"; steps: ICalcStep[]; result: number | null }
export interface ICalcStepInput { label: string; detail?: string; value?: number; total?: number; emphasis?: boolean; cites?: ICalcCitation[] }
export class CalcTrace {
    constructor(defs: CalcStepDefs);
    add(id: string, step: ICalcStepInput): void;   // unknown id: throws Error(`No step definition: ${id}`)
    readonly steps: ICalcStep[];
}
export const formatCitation: (cite: ICalcCitation) => string;       // "TM p.302", "TM errata v8.0 p.14"
export const formatCitations: (cites: ICalcCitation[]) => string;   // joined with "; "
export const renderCalcStepsHtml: (steps: ICalcStep[]) => string;   // escaped; a <strong> heading per section change
export const findCalcDefProblems: (defs: CalcStepDefs) => string[]; // human-readable problems, [] when clean
```

`step.cites` given to `add` are appended to the definition's cites (for a per-item value from another book).
`findCalcDefProblems` reports: a cite whose `source` is not in `CALC_SOURCES`; an empty `page`; `cited` with no
cites; `provisional` or `source-missing` with no `note`.

- [ ] **Step 1: Seed `CALC_SOURCES` from the library index.** Read `C:/repo/ResourceLibrary/INDEX.md` (the hand-written
  book and errata tables). Add one entry per document the BV2 work will cite, with the printing exactly as the INDEX
  gives it: TechManual corrected sixth printing (`tm`), TechManual errata v8.0 (`tm-errata-8.0`), Battle Value tables
  v4.1 (`tm-bv-tables-4.1`), BV 2.1 revision 2017 (`tm-bv-2.1`), Total Warfare eleventh printing (`tw`) and errata
  v11.01, TO:AUE and errata v7.0, IO:AE and errata v3.01. `short` is the abbreviation the app already prints (TM, TW,
  TO:AUE, IO:AE). Later tasks add their own.
- [ ] **Step 2: Write the failing tests** in `src/data/calc-steps.test.ts`:

```ts
const defs: CalcStepDefs = {
    "armor": { section: "Defensive Battle Rating", cites: [{ source: "tm", page: "302" }], status: "cited" },
    "guess": { section: "Final", cites: [], status: "provisional", note: "The rule is silent; we round normally." },
};
it("adds a step with its definition's section, cites and status", () => {
    const trace = new CalcTrace(defs);
    trace.add("armor", { label: "Armor", detail: "152 x 2.5", value: 380 });
    expect(trace.steps[0]).toMatchObject({ id: "armor", section: "Defensive Battle Rating", status: "cited", value: 380, cites: [{ source: "tm", page: "302" }] });
});
it("appends a step's own cites to the definition's", () => { /* add with cites:[{source:"ioae",page:"189"}] -> 2 cites, definition unchanged */ });
it("throws on an unknown step id", () => { expect(() => new CalcTrace(defs).add("nope", { label: "x" })).toThrow("No step definition: nope"); });
it("formats citations", () => {
    expect(formatCitation({ source: "tm", page: "302" })).toBe("TM p.302");
    expect(formatCitation({ source: "tm-errata-8.0", page: "14" })).toBe("TM errata v8.0 p.14");
    expect(formatCitation({ source: "tm", page: "302-304" })).toBe("TM pp.302-304");
});
it("escapes labels and details in the rendered HTML", () => { /* label '<b>&"' -> contains "&lt;b&gt;&amp;&quot;", not "<b>" */ });
it("marks provisional and source-missing steps in the rendered HTML", () => { /* contains "(provisional: The rule is silent; we round normally.)" */ });
it("reports definition problems", () => {
    expect(findCalcDefProblems({ a: { section: "S", cites: [{ source: "nope", page: "1" }], status: "cited" }, b: { section: "S", cites: [], status: "cited" }, c: { section: "S", cites: [], status: "provisional" } })).toHaveLength(3);
});
it("every source has a short name, title and printing", () => { /* over CALC_SOURCES */ });
```

- [ ] **Step 3: Run** `npx vitest run --project unit src/data/calc-steps.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 4: Implement** both files to the interfaces above. `short` for an errata source is written in full in
  the registry (`"TM errata v8.0"`). A page containing `-` or `,` prints `pp.`.
- [ ] **Step 5: Run** the same command. Expected: PASS.
- [ ] **Step 6: Commit** `feat(bv): step and citation model for cited breakdowns (#599)`.

### Task 2: 'Mech BV2 step definitions, read on the page

Done by the session's own model. This task decides what the app will claim; nothing in it is delegated.

**Files:**
- Create: `src/data/calc-steps-mech-bv2.ts`, `docs/superpowers/plans/2026-11-10-cited-bv-ledger.md`
- Test: `src/data/calc-steps-mech.test.ts`

**Interfaces:**
- Consumes: `CalcStepDefs`, `findCalcDefProblems`, `CALC_SOURCES` (Task 1).
- Produces: `export const MECH_BV2_STEPS: CalcStepDefs;` with ids prefixed `bv2.` (`bv2.def.armor`, `bv2.def.structure`,
  `bv2.def.gyro`, `bv2.def.equipment`, `bv2.def.explosive`, `bv2.def.factor`, `bv2.off.heat`, `bv2.off.weapon`,
  `bv2.off.ammo`, `bv2.off.equipment`, `bv2.off.tonnage`, `bv2.off.speed`, `bv2.final.cockpit`, `bv2.final.multiplier`,
  `bv2.final.round`, and one id for every other distinct rule the code applies). Sections: `"Defensive Battle Rating"`,
  `"Offensive Battle Rating"`, `"Final Battle Value"`.

- [ ] **Step 1: Inventory the rules the code applies.** Read `_calcBattleValue` (`src/classes/battlemech.ts:895-1560`)
  end to end. List every distinct rule: each constant, multiplier, cap, rounding and special case (armor types,
  modular and ferro-lamellor armor, torso-mounted cockpit, structure types, engine modifiers, gyro types, defensive
  equipment and the AMS ammo cap, armored components, explosive penalties per tech base and CASE, HarJel, TMM table,
  stealth and camouflage modifiers, LAM, heat efficiency, weapon ordering, rear and arm-flip weapons, linked equipment
  (Artemis, Apollo, targeting computer, capacitor), ammo cap, offensive equipment, tonnage and TSM, industrial 'Mech
  modifiers, speed factor, cockpit modifiers, final multipliers, rounding, LAM bombs). Give each a step id. Reuse the
  pages already recorded in `docs/superpowers/plans/2026-11-03-edition-aware-bv.md` "Segment 4: BV2 audit" as leads.
- [ ] **Step 2: Read each rule on its page** (TM pp.302-304 and 315 as printed in the sixth printing; then TM errata
  v8.0, Battle Value tables v4.1 and the BV 2.1 revision for anything they change; TO:AUE and IO:AE for the gear they
  add, with their errata). For each step id write a ledger row: source id, page, what the page says in our own words,
  whether the code agrees, the date, and "page image checked" where a table or OCR page was involved. Disagreements
  between code and page are **findings**: list them under "Findings" with both sides; do not fix them here.
- [ ] **Step 3: Record the book's worked examples.** Find every worked BV example on those pages (the running
  example unit and any sidebar). For each, record in the ledger the unit, each intermediate number the book prints,
  and the final BV, with the page. If the book's example disagrees with its rules text or errata, record that as a
  finding; the errata wins.
- [ ] **Step 4: Write the failing test** in `src/data/calc-steps-mech.test.ts`:

```ts
it("'Mech BV2 step definitions are clean", () => { expect(findCalcDefProblems(MECH_BV2_STEPS)).toEqual([]); });
it("'Mech BV2 step ids are prefixed bv2.", () => { /* every key starts with "bv2." */ });
it("no 'Mech BV2 step is source-missing without the ledger naming the source", () => {
    // every source-missing def's note names a document; the ledger file contains that document's name
});
```

- [ ] **Step 5: Run** `npx vitest run --project unit src/data/calc-steps-mech.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 6: Write `MECH_BV2_STEPS`** from the ledger: `cited` for a rule read and confirmed, `provisional` with
  its note where the books do not cover the case (the LAM bomb line is already marked provisional in code),
  `source-missing` where the library lacks the document. Add any new sources to `CALC_SOURCES`.
- [ ] **Step 7: Run** the same command. Expected: PASS.
- [ ] **Step 8: Commit** `feat(bv): 'Mech BV2 step definitions, read on the page (#599)`. Tell the owner now about any
  source-missing documents.

### Task 3: 'Mech BV2 emits steps

**Files:**
- Modify: `src/classes/battlemech.ts` (`_calcBattleValue` 895-1560; the `calcLogBV` getter near 12969; `_calcLogBV` field at 664)
- Create: `src/classes/battlemech-bv-examples.test.ts`
- Test: also `src/classes/battlemech.test.ts`, `battlemech-ssw-battle-value.test.ts`, `battlemech-ssw-canon-items.test.ts`, `battlemech-mtf.test.ts` (they read the log)

**Interfaces:**
- Consumes: `CalcTrace`, `ICalcBreakdown`, `renderCalcStepsHtml` (Task 1); `MECH_BV2_STEPS` (Task 2).
- Produces on `BattleMech`:
  - `public getBattleValueBreakdown(edition: string = this._rulesEdition): ICalcBreakdown` (in this task: the BV2
    steps for a BV2 edition; an unknown tag reads the default edition's; BV1 and no-BV editions arrive in Task 5).
  - `calcLogBV` returns `renderCalcStepsHtml(...)` of the same steps.

- [ ] **Step 1: Write the failing tests.**

In `battlemech-bv-examples.test.ts`, one `describe` per worked example recorded in the ledger (Task 2 step 3). Build
the unit as the book describes it, then for each number the book prints:

```ts
const step = (id: string) => breakdown.steps.filter((s) => s.id === id);
expect(step("bv2.def.armor").at(-1)?.value).toBe(/* the book's armor factor, from the ledger */);
// ... one assertion per printed intermediate ...
expect(breakdown.result).toBe(/* the book's final BV */);
```

In `battlemech.test.ts`:

```ts
it("every BV2 step of a stock 'Mech has a definition, a section and a finite value", () => {
    // a bundled Locust LCT-1V and an Atlas AS7-D: steps.length > 10; every value/total that is set is Number.isFinite
});
it("a bare 'Mech (no armor, no weapons, no jump jets) breaks down without NaN", () => { /* new BattleMech(), 20 tons */ });
it("the last step's total equals getBattleValue() and the breakdown's result", () => {});
it("an unknown edition tag reads the default edition's steps", () => { expect(() => mech.getBattleValueBreakdown("not-an-edition")).not.toThrow(); });
it("calcLogBV is the rendered steps", () => { expect(mech.calcLogBV).toBe(renderCalcStepsHtml(mech.getBattleValueBreakdown().steps)); });
it("a design name with markup is escaped in calcLogBV", () => {});
```

- [ ] **Step 2: Run** `npx vitest run --project unit src/classes/battlemech-bv-examples.test.ts src/classes/battlemech.test.ts`. Expected: FAIL, `getBattleValueBreakdown` is not a function.
- [ ] **Step 3: Convert** (a `sonnet` subagent may do this step; give it this task, Task 1's interfaces and the
  `MECH_BV2_STEPS` ids). In `_calcBattleValue`, create `const trace = new CalcTrace(MECH_BV2_STEPS)` and replace each
  `this._calcLogBV += ...` with a `trace.add(id, { label, detail, value, total })` using the id Task 2 assigned to that
  rule. Keep the arithmetic exactly as it is: this step changes no number. Store the steps on the instance and render
  `_calcLogBV` from them. Names go in as plain text (drop `_escapeLogText` at call sites; the renderer escapes).
- [ ] **Step 4: Update the existing tests that assert on log HTML** to assert on steps (`id`, `value`, `label`),
  keeping every number they check.
- [ ] **Step 5: Run** `npx vitest run --project unit src/classes`. Expected: PASS, except worked-example assertions
  that expose a real difference. For each of those: confirm the book's number against the page image, then fix the
  math test-first with the rule cited, and list the changed number for the round comment. If a fix would change a
  kept bundled design's BV, stop and report to the owner (Global Constraints).
- [ ] **Step 6: Round close** (Global Constraints): `npm run check`, commit
  `feat(bv): 'Mech BV2 as cited steps (#599)`, push, deploy beta, fast-forward master, comment on #599.

### Task 4: 'Mech BV1 step definitions, read on the page

Done by the session's own model.

**Files:**
- Create: `src/data/calc-steps-mech-bv1.ts`
- Modify: `docs/superpowers/plans/2026-11-10-cited-bv-ledger.md`, `src/data/calc-sources.ts`, `src/data/calc-steps-mech.test.ts`

**Interfaces:**
- Produces: `export const MECH_BV1_STEPS: Record<string, CalcStepDefs>;` keyed by BV1 edition tag (`"master-rules"`,
  `"master-rules-revised"`), step ids prefixed `bv1.`; Maximum Tech (Level 3) steps live in the
  `master-rules-revised` table with ids prefixed `bv1.l3.`. `export const getMechBv1Steps: (edition: string) => CalcStepDefs`
  resolves an edition through `getBattleValueEdition`.

- [ ] **Step 1: List the BV1 sources and their printings** from `ResourceLibrary/INDEX.md`: BattleTech Master Rules
  (pp.139-145) and the FanPro BMR errata, Master Rules Revised (pp.152-159), Maximum Tech (pp.90-92, revised edition).
  Add them to `CALC_SOURCES`. Any not held: report to the owner now, mark its steps `source-missing`, and do Tasks 6
  and 7 before Task 5.
- [ ] **Step 2: Inventory and read**, as Task 2 steps 1 to 3, for `_calcBattleValue1` (`battlemech.ts:1612-1808`) and
  the helpers it uses in `src/data/battle-value.ts` (`getBattleValue1Rater`, `getBattleValue1Ammo`, `MAX_TECH`). Reuse
  "Segment 1: 'Mech BV1" of the 2026-11-03 plan as leads. Record each book's worked BV1 example.
- [ ] **Step 3: Write the failing tests**: `findCalcDefProblems` is `[]` for each edition's table; every id starts
  `bv1.`; `getMechBv1Steps("classic-battletech-box-set")` returns the `master-rules-revised` table (the newest BV1
  edition at or before it).
- [ ] **Step 4: Run** `npx vitest run --project unit src/data/calc-steps-mech.test.ts`. Expected: FAIL.
- [ ] **Step 5: Write the tables.** Run again. Expected: PASS.
- [ ] **Step 6: Commit** `feat(bv): 'Mech BV1 step definitions, read on the page (#599)`.

### Task 5: 'Mech BV1 emits steps; editions without Battle Value

**Files:**
- Modify: `src/classes/battlemech.ts` (`_calcBattleValue1`, `getBattleValueBreakdown`, the block at 1553-1558 that prepends BV1 lines), `src/data/battle-value.ts` (`getBattleValue1Rater`'s `note` callback)
- Test: `src/classes/battlemech-bv-examples.test.ts`, `src/classes/battlemech.test.ts`

**Interfaces:**
- Consumes: `getMechBv1Steps` (Task 4), `editionHasBattleValue`, `getBattleValueFor` (`battle-value.ts`).
- Produces: `getBattleValueBreakdown(edition)` complete:
  - BV2 edition: `{ scheme: "bv2", steps: BV2 steps, result }`.
  - BV1 edition: `{ scheme: "bv1", steps: BV1 steps only, result }`. The "BV2 for comparison" text is no longer
    prepended; the view's edition switch replaces it.
  - No-BV edition: `{ scheme: "none", steps: [one step, id "none.no-battle-value"], result: null }`. Its definition
    cites where Battle Value first appears (read the page; it goes in `calc-steps-mech-bv1.ts` as
    `export const NO_BATTLE_VALUE_STEPS: CalcStepDefs`).
  - `_calcBattleValue1(edition, trace?: CalcTrace, tagged?)` replaces the `log?: string[]` parameter.
  - `calcLogBV` renders the design's own edition's breakdown.

- [ ] **Step 1: Write the failing tests**: one `describe` per BV1 worked example from the ledger, as Task 3; plus

```ts
it("a no-BV edition gives result null and one cited step", () => {
    const b = mech.getBattleValueBreakdown("battledroids");
    expect(b).toMatchObject({ scheme: "none", result: null });
    expect(b.steps).toHaveLength(1);
    expect(b.steps[0].cites.length).toBeGreaterThan(0);
});
it("a BV1 edition's breakdown holds only bv1 steps and ends on getBattleValue(edition)", () => {});
it("the same 'Mech breaks down under every edition in btRulesEditions without throwing", () => {});
```

- [ ] **Step 2: Run** the two test files. Expected: FAIL.
- [ ] **Step 3: Convert** `_calcBattleValue1` and the rater's notes to `trace.add` (a `sonnet` subagent may do this),
  then finish `getBattleValueBreakdown`. No number changes.
- [ ] **Step 4: Run** `npx vitest run --project unit src/classes src/data`. Expected: PASS; handle real differences as
  Task 3 step 5.
- [ ] **Step 5: Round close**, commit `feat(bv): 'Mech BV1 as cited steps; breakdown by edition (#599)`.

### Task 6: 'Mech cost step definitions, read on the page

Done by the session's own model.

**Files:**
- Create: `src/data/calc-steps-mech-cost.ts`
- Modify: the ledger, `src/data/calc-sources.ts`, `src/data/calc-steps-mech.test.ts`

**Interfaces:**
- Produces: `export const MECH_COST_STEPS: CalcStepDefs;` ids prefixed `cost.` (`cost.cockpit`, `cost.life-support`,
  `cost.sensors`, `cost.musculature`, `cost.structure`, `cost.actuators`, `cost.engine`, `cost.gyro`, `cost.jump-jets`,
  `cost.heat-sinks`, `cost.armor`, `cost.equipment`, `cost.ammo`, `cost.omni`, `cost.tonnage-multiplier`, `cost.final`,
  and one for every other rule the code applies). Sections: `"Structure and Systems"`, `"Equipment"`, `"Final Cost"`.

- [ ] **Step 1: Inventory** `_calcCBillCost` (`battlemech.ts:1820-2180`, 57 log lines) and note every place it
  branches on the rules edition (line 2138 does). **Step 2: Read** each on its page: the TechManual cost chapter
  (find the pages with `python library_search.py "BattleMech cost" --book TechManual --canon`), its errata, and
  TO:AUE and IO:AE for the gear they add; Maximum Tech p.87 where the code uses it. Record each book's worked cost
  example. For each step, write which edition's cost rules it applies. Where an older edition's cost rules differ and
  the code does not model that: status `provisional`, a note saying so, and a line under "Issues to file" in the ledger.
- [ ] **Step 3: Write the failing tests** (`findCalcDefProblems` is `[]`; ids start `cost.`). **Step 4: Run**, FAIL.
- [ ] **Step 5: Write the table.** Run. Expected: PASS.
- [ ] **Step 6: Commit** `feat(cost): 'Mech cost step definitions, read on the page (#599)`. File the issues listed.

### Task 7: 'Mech cost emits steps

**Files:**
- Modify: `src/classes/battlemech.ts` (`_calcCBillCost`; `calcLogCBill` near 12963; the TRO use at 2962)
- Test: `src/classes/battlemech-bv-examples.test.ts`, `src/classes/battlemech.test.ts`

**Interfaces:**
- Consumes: `MECH_COST_STEPS` (Task 6).
- Produces: `public getCostBreakdown(): ICalcBreakdown` (`kind: "cost"`, `edition` = the design's, `result` =
  `getCBillCostNumeric()`); `calcLogCBill` renders the steps as the same two-column table it prints today
  (`<table class="cbill-cost">`), through a second renderer `renderCalcStepsTable(steps): string` added to
  `calc-steps.ts` (label, value with thousands separators, citation in a third column).

- [ ] **Step 1: Write the failing tests**: the books' cost examples step by step; the last step's total equals
  `getCBillCostNumeric()`; a bare 'Mech has no `NaN`; `calcLogCBill` contains `class="cbill-cost"` and each step's
  citation text.
- [ ] **Step 2: Run**, FAIL. **Step 3: Convert** (a `sonnet` subagent may do this). No number changes.
- [ ] **Step 4: Run** `npx vitest run --project unit src/classes`. Expected: PASS; real differences as Task 3 step 5.
- [ ] **Step 5: Round close**, commit `feat(cost): 'Mech cost as cited steps (#599)`.

### Task 8: The breakdown view

**Files:**
- Create: `src/ui/components/calc-breakdown.tsx`, `calc-breakdown.scss`, `calc-breakdown.test.tsx`
- Modify: `src/ui/pages/classic-battletech/mech-creator/summary.tsx` (the two `SanitizedHTML` blocks at 254 and 269), `src/ui/components/mech-view-panel.tsx`

**Interfaces:**
- Consumes: `ICalcBreakdown`, `formatCitations` (Task 1); `getBattleValueBreakdown`, `getCostBreakdown` (Tasks 5, 7);
  `btRulesEditions`, `getRulesEdition` (`src/data/rules-editions.ts`).
- Produces:

```ts
export interface ICalcBreakdownProps {
    battleValue: (edition: string) => ICalcBreakdown;
    cost?: () => ICalcBreakdown;
    editions: string[];            // edition tags to offer, oldest first
    edition: string;               // the design's own edition: the starting choice
    mulBattleValue?: number;       // a bundled MUL design's BV, shown beside ours under a BV2 edition only
    accuracyHref?: string;         // link shown when mulBattleValue differs from ours
}
export default function CalcBreakdown(props: ICalcBreakdownProps): JSX.Element;
```

Layout, within the house style of the existing summary pages: an edition `<select>` labelled "Rules edition"; a
"Battle Value" section and a "Cost" section; steps grouped under their section heading as rows of label, arithmetic,
result, citation; `emphasis` rows bold; a `provisional` row carries the text "Provisional:" and its note, a
`source-missing` row "Source not yet in our library:" and its note; `scheme: "none"` shows the one step's label and
no number. At widths under 600px each step stacks (label and result on one line, arithmetic and citation below).
Print styles keep every row. All text is rendered as text, never as HTML.

- [ ] **Step 1: Write the failing tests** (`calc-breakdown.test.tsx`, Testing Library as `mech-view-panel.test.tsx` does):

```ts
it("shows each step's label, arithmetic, result and citation", () => {});
it("changing the edition select re-reads battleValue with that tag", () => {});
it("says the edition has no Battle Value when scheme is none, and shows no 0", () => {});
it("marks provisional and source-missing steps with their notes", () => {});
it("shows the MUL's BV beside ours only under a bv2 breakdown, and the accuracy link only when they differ", () => {});
it("renders a label with markup as text", () => { /* label "<img onerror=x>" appears as text; no img element */ });
```

- [ ] **Step 2: Run** `npx vitest run --project unit src/ui/components/calc-breakdown.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the component and styles. **Step 4: Run**, PASS.
- [ ] **Step 5: Use it** in the 'Mech creator summary (replacing both log blocks; `editions` = every `btRulesEditions`
  tag whose `unitTypes` include `mech` or are unset) and in `MechViewPanel` (collapsed by default under a "Battle
  Value and cost breakdown" disclosure; pass `mulBattleValue` when the panel's 'Mech is a bundled MUL design). Update
  `summary` and `mech-view-panel` tests that looked for the old blocks.
- [ ] **Step 6: Look at it.** Run the app (the `run` skill), open a stock 'Mech in the creator summary and from the
  roster's MUL search, at desktop and 390px widths, and under a BV2, a BV1 and a no-BV edition. Fix what reads badly.
- [ ] **Step 7: Round close**, commit `feat(bv): breakdown view with edition switch for 'Mechs (#599)`.

### Task 9: The bundle build writes the accuracy data

**Files:**
- Modify: `src/data/bundled-mechs-build.ts` (the two "BV differs" leaves at 325-327 and 556; `IBundledBuild` at 305; the writer at 604-620)
- Test: `src/data/bundled-mechs-build.test.ts`

**Interfaces:**
- Produces:

```ts
export interface IBundledMiss { mulId: number | null; name: string; config?: string; ours: number; mul: number; file: string }
export interface IBundledAccuracy {
    unitType: "mechs";
    matched: number;          // MUL entries with a kept design
    differs: IBundledMiss[];  // MUL entries with files, none matching; one row per MUL entry (and configuration)
    notChecked: { importFailed: number; noMulEntry: number };
}
// IBundledBuild gains: accuracy: IBundledAccuracy
```

  and the file `src/data/bundled/mechs-accuracy.json` (stable key order, one miss per line, sorted by name then
  config, so diffs stay readable). Duplicates and "different submodel" files are not units and are not counted. A MUL
  entry that has both a kept design and a differing file counts as matched only.

- [ ] **Step 1: Write the failing tests** using the build test's existing small fixtures: a file whose BV matches is
  in `matched`; a file whose BV differs gives one `differs` row with `ours`, `mul` and `mulId`; an OmniMech with one
  wrong configuration gives a row with `config`; an import failure and a no-MUL file land in `notChecked`; a MUL entry
  with one matching and one differing file is matched and not in `differs`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/data/bundled-mechs-build.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**: carry the structured miss alongside the existing `leave(...)` text, build `accuracy`, and
  write the JSON next to the report. The Markdown report stays.
- [ ] **Step 4: Run**, PASS. Then `npm run build:bundled` and check the totals in `mechs-accuracy.json` against
  `mechs-report.md` (200 "BV differs from the MUL" + 47 configuration + 1 every-configuration, less any MUL entry
  that also has a kept design). The bundle's kept designs must be unchanged (`git diff --stat src/data/bundled` shows
  only the new file).
- [ ] **Step 5: Commit** `feat(bv): bundle build records where 'Mech BV differs from the MUL (#599)`.

### Task 10: Verdicts, the accuracy page, MegaMek audit removed

**Files:**
- Create: `src/data/bv-verdicts.ts`, `src/data/bv-verdicts.test.ts`, `src/ui/pages/classic-battletech/bv-accuracy.tsx`, `bv-accuracy.test.tsx`
- Modify: `src/ui/pages/classic-battletech/_router.tsx` (route `battle-value-accuracy`), `src/ui/pages/classic-battletech/home.tsx` (a link beside the roster link at 83), `src/ui/components/mech-view-panel.tsx` (`accuracyHref`)
- Delete: `src/data/megamek-bv-audit.test.ts`, `src/data/bundled/megamek-bv-audit.md`, and the `MEGAMEK_AUDIT` code path they use (grep `MEGAMEK_AUDIT`)

**Interfaces:**
- Consumes: `IBundledAccuracy`, `IBundledMiss` (Task 9).
- Produces:

```ts
export type BvVerdict = "open" | "our-bug" | "import" | "mul-suspect";
export interface IBvVerdict { verdict: Exclude<BvVerdict, "open">; note: string; issue?: number; cites?: ICalcCitation[] }
export const BV_VERDICTS: Record<string, IBvVerdict>;                 // key from bvVerdictKey
export const bvVerdictKey: (miss: IBundledMiss) => string;            // "mul:<id>" or "mul:<id>:<config>"; "file:<path>" when mulId is null
export const getBvVerdict: (miss: IBundledMiss) => BvVerdict;         // "open" when no entry
```

  A `mul-suspect` entry must have `cites`; an `our-bug` entry must have `issue`.

  The page: title "Battle Value accuracy"; one paragraph saying what the record is (our math from the rulebooks and
  errata, compared with the Master Unit List; every difference is listed, including the ones that are our open bugs);
  a table per unit type of matched, differs and not yet checked, with the match percentage of matched + differs; then
  the list of differing units (name, configuration, our BV, MUL BV, difference, verdict, note, citations, issue link),
  filterable by verdict and searchable by name. The JSON loads lazily, as the bundled indexes do.

- [ ] **Step 1: Write the failing tests.**

```ts
// bv-verdicts.test.ts
it("every verdict's key is a unit that still differs", () => { /* stale keys are named in the failure message */ });
it("a mul-suspect verdict cites a rule; an our-bug verdict names an issue", () => {});
it("the 'Mech match count has not dropped", () => { expect(accuracy.matched).toBeGreaterThanOrEqual(MECH_MATCHED_FLOOR); });
// MECH_MATCHED_FLOOR is exported from bv-verdicts.ts, set to the count Task 9 wrote; a round that raises the count raises it.

// bv-accuracy.test.tsx
it("shows the per-type counts and percentage", () => {});
it("lists every differing unit with both numbers and its verdict", () => {});
it("filters by verdict", () => {});
it("ignores a verdict whose key matches no unit", () => {});
```

- [ ] **Step 2: Run** both files. Expected: FAIL.
- [ ] **Step 3: Implement** the verdict file (empty `BV_VERDICTS`), the page, the route and the links. **Step 4: Run**, PASS.
- [ ] **Step 5: Remove the MegaMek audit** and its report; `grep -r MEGAMEK src scripts docs/*.md` shows no live use.
- [ ] **Step 6: Look at it** in the running app at desktop and 390px widths.
- [ ] **Step 7: Round close**, commit `feat(bv): public Battle Value accuracy record for 'Mechs; MegaMek audit removed (#599)`.

### Task 11: Work the 'Mech queue

Root causes are read and decided by the session's own model. This task repeats per group until its exit condition.

**Files:**
- Create: `scripts/bv-miss-groups.mjs` (reads `mechs-accuracy.json` and the bundled sources; prints groups)
- Modify: `src/data/bv-verdicts.ts`, the ledger ("Queue" section), whatever the root cause touches

- [ ] **Step 1: Group the misses.** The script prints the differing units grouped by: sign and size of the difference
  as a fraction of the MUL BV; shared equipment tags found in every member's file but in few matching designs; chassis
  type (quad, tripod, LAM, industrial, OmniMech, superheavy); tech base. Record the groups in the ledger, largest first.
- [ ] **Step 2: For each group, largest first:**
  1. Pick two members. Open their breakdowns and find the step where the number looks wrong for that gear.
  2. Read that step's rule again on the page, with its errata. Decide: our bug, an import fault, or the MUL.
  3. **Our bug:** write a failing test that states the rule's number with its citation, fix, run
     `npx vitest run --project unit src/classes src/data`, then `npm run build:bundled`. The match count must rise
     and no kept design may change BV; otherwise stop for the owner.
  4. **Import fault:** fix the importer test-first if small; otherwise verdict `import` with a note and an issue.
  5. **The MUL:** verdict `mul-suspect` with the note, the cites, and the record sheet's number where the library
     holds the sheet (`python library_search.py "<unit name>" --folder record-sheets`).
  6. Raise `MECH_MATCHED_FLOOR`, update the step definition's cites if the reading added one, and close the round
     with the counts before and after in the commit message and the #599 comment.
- [ ] **Exit:** every differing 'Mech has a verdict other than `open`, or an issue that names what blocks it. Report
  the final table to the owner.

### Task 12: Whole-branch review and handoff

- [ ] **Step 1:** Dispatch one `opus` reviewer over the branch's diff since `6c5ae5637` with the spec and this plan.
  Ask it also to sample 20 step definitions across BV2, BV1 and cost and check each citation against the page in
  `C:/repo/ResourceLibrary`. Fix every finding, minors included.
- [ ] **Step 2:** `npm run check`; round close; update `C:/repo/JBTToolsSupportFiles/handoff.md` with the state, the
  counts, the sources still missing, and the next unit type (Combat Vehicles); comment on #599.
