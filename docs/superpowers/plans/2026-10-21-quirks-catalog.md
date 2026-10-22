# Quirks, part 1: catalog, quirks on units, builder and record sheet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every quirk-capable unit can carry official and custom design quirks (unit, location and weapon quirks),
picked in its builder under the selected edition and level, kept in saves, and printed on its record sheet.

**Architecture:** A quirk catalog in `src/data` shaped like the equipment catalogs (records with `editions`, levels,
`custom?: true`, sources), a registry that answers "is this quirk offered here", a small `QuirkList` value class each
unit class holds and saves, one shared React picker used on each builder's summary page, and one shared formatter the
record sheets print from.

**Tech Stack:** Vite + React 18 + TypeScript + Vitest. Commands from the repo root: `npm test`, `npm run typecheck`,
`npm run lint`.

**Spec:** `docs/superpowers/specs/2026-10-21-quirks-design.md` (approved 2026-10-21). This plan is the first of four
in the spec's delivery order. Later plans: (2) importers and canon quirk assignments (BMM pp.90-95, TROs); (3) play
effects, Classic and Alpha Strike; (4) T&T and comms systems and the Lost Issues article.

## Global Constraints

- Never invent a stat, date, citation, page number or quirk. Every record cites `book` and `page`; data entry reads
  CO pp.225-234 and BMM pp.82-89 from the PDFs (`C:/repo/JBTIICRework/rulebooks/`), not the text extracts, which are
  garbled on those pages.
- No rules text is copied into the app. A record's `summary` is one or two sentences in our own words, with the
  citation; the library's README forbids including its text.
- No MegaMek code or data copied (GPL).
- Quirks are not shown on the Alpha Strike card (spec ruling 2). This plan changes no AS file.
- Installed things are never filtered: a quirk on a unit that the selected edition or level does not offer stays on
  the unit and is listed as a warning, as equipment is (catalogs plan, Review Focus 1).
- Unit types: 'Mech, vehicle, fighter, small craft (with DropShips), capital ship and battle armor. ProtoMechs,
  infantry and buildings get no quirks: CO's quirk tables have no column for them (ruling for the ledger).
- Not in this plan: the record fields `effects` and `alphaStrike` (plan 3) and the importers (plan 2). `IQuirk`
  leaves them out; plan 3 adds them as optional fields.
- 4-space indentation, LF line endings; the data-file disclaimer header that the other `src/data` catalogs carry.
- Commit per task; never push, never `npm run deploy-prod`, never commit `*_DEV/`, `.claude`, `.superpowers/`.

## Review Focus

1. A weapon carrying a weapon quirk is removed, or an OmniMech switches configuration: the quirk stays in the save,
   is not printed, and the builder lists it as "not installed" — no crash, no orphan line on the sheet. (Task 3, Task 6)
2. A save from before this plan (no `quirks` field) loads with no quirks and re-saves with no `quirks` key at all.
   (Task 3)
3. Switching an existing design to Battledroids (or any pre-Total Warfare edition below the Apocryphal level) hides
   quirks in the picker but keeps the unit's quirks, with a warning per quirk. (Task 4)
4. Battle Computer and Command 'Mech on one unit: the picker refuses the second ("no 'Mech may have both", CO p.225).
   (Task 2, Task 4)
5. The same unit-level quirk added twice is refused; the same weapon quirk on two different weapons is allowed and
   costed twice (CO p.225: "the cost for each must be paid"). (Task 3)

---

### Task 1: Quirk types and registry

**Files:**
- Create: `src/data/quirk-interfaces.ts`, `src/data/quirk-registry.ts`, `src/data/quirks.ts` (empty `quirks` array
  and header), `src/data/quirks-custom.ts` (empty `customQuirks` array and header)
- Test: `src/data/quirk-registry.test.ts`

**Interfaces:**
- Produces, in `quirk-interfaces.ts`:
  - `type QuirkUnitType = "mech" | "vehicle" | "battle-armor" | "fighter-small-craft" | "dropship" | "large-craft"`
    — the six columns of CO's quirk tables; their footnotes (IndustrialMech/OmniMech under "mech", support vehicles
    under "vehicle", fixed-wing support and airships under "fighter-small-craft", satellites under "large-craft").
  - `type QuirkAttach = "unit" | "location" | "weapon"`.
  - `interface IQuirkSource { book: string; page: number }`.
  - `interface IQuirkCost { points?: number; choices?: number[]; per?: { points: number; damage: number; scope: "weapon" | "unit" }; zeroDamagePoints?: number }`
    — exactly one of `points`, `choices` (Rugged 1 or 2, EM Interference 1 or 2) or `per` (Accurate Weapon: 1 per 5,
    weapon; Anti-Aircraft Targeting: 1 per 7, unit); `zeroDamagePoints` for "a weapon that deals 0 damage costs 2".
  - `interface IQuirk { tag: string; name: string; altNames: string[]; kind: "positive" | "negative"; cost: IQuirkCost; unitTypes: QuirkUnitType[]; restrictions?: string; attaches: QuirkAttach; parameter?: { kind: "range-band" | "value" | "locations"; options?: string[] }; excludes?: string[]; summary: string; sources: IQuirkSource[]; editions: string[]; editionLevels?: { [editionTag: string]: number }; rulesLevel: number; apocryphalIn?: { [editionTag: string]: unknown }; custom?: true }`.
  - `interface IAssignedQuirk { tag: string; parameter?: string | number; location?: string; equipmentUuid?: string; fromYear?: number; toYear?: number }`.
- Produces, in `quirk-registry.ts`:
  - `getQuirks(): IQuirk[]` — official, then `customQuirks`, then local drafts (Task 5).
  - `getQuirk(tag: string): IQuirk | undefined` — by `tag`, then by `altNames` (case-insensitive).
  - `getQuirkOfferIssue(quirk: IQuirk, unitType: QuirkUnitType, editionTag: string, rulesLevel: number): "unit-type" | "edition" | "level" | null`
    — "unit-type" first; then `getRecordOfferIssue` from `rules-editions.ts`; custom quirks are floored at
    `CUSTOM_HOMEBREW_RULES_LEVEL` like custom equipment (`getEquipmentOfferIssue` in `equipment-registry.ts`).
  - `getQuirkPoints(quirk: IQuirk, assigned: IAssignedQuirk, maxDamage: number): number` — signed: positive quirks
    positive, negative quirks negative.
  - `setLocalCustomQuirks(quirks: IQuirk[]): void`.

- [ ] **Step 1: Write the failing tests** in `quirk-registry.test.ts`, using two inline fixture records (not catalog
  data): `getQuirkOfferIssue` returns "unit-type" for a mech-only quirk on "vehicle"; null for a quirk with
  `editions: ["total-warfare"]`, `rulesLevel: 3` at ("total-warfare", 3); "level" at ("total-warfare", 2); "edition"
  at ("battledroids", 3); a `custom: true` quirk is "level" at 5 and null at 6. `getQuirk` finds by an `altNames`
  entry in another case. `getQuirkPoints`: `per: {points:1, damage:5}` on a weapon of 10 damage is 2, of 11 is 3 ("or
  fraction thereof"), of 0 is `zeroDamagePoints`; a negative quirk of 2 points is -2; `choices` uses the assigned
  `parameter`.
- [ ] **Step 2:** `npx vitest run src/data/quirk-registry.test.ts` — FAIL (module not found).
- [ ] **Step 3:** Implement the four files.
- [ ] **Step 4:** The test passes; `npm run typecheck` clean.
- [ ] **Step 5:** Commit `quirks: types and registry`.

### Task 2: Official quirk records

**Files:**
- Modify: `src/data/quirks.ts`
- Test: `src/data/quirks.test.ts`

**Interfaces:**
- Consumes: `IQuirk` (Task 1).
- Produces: `quirks: IQuirk[]` with tags `quirk-<kebab name>` (e.g. `quirk-command-mech`, `quirk-improved-targeting`).

Data rules, decided here:
- One record per quirk in CO's Positive Quirk Table (p.228) and Negative Quirk Table, plus BMM pp.82-89 quirks the
  CO tables lack. Improved Targeting is one record with `parameter: { kind: "range-band", options: ["short",
  "medium", "long"] }`; costs that differ by band use `choices` in the band order.
- `unitTypes` and `restrictions` from the CO table columns and footnotes as printed.
- `sources`: CO first, then BMM, then SO (2008) where the quirk appears there.
- `editions: ["total-warfare", "battlemech-manual", "core-rulebook"]` (spec ruling 10, Claude's call on the start).
  `rulesLevel: 3` (`ADVANCED_RULES_LEVEL`): SO and CO are advanced rulebooks. Ruling for the ledger: BMM prints
  quirks as special-case rules; the level stays 3 there until a BMM rules-level citation says otherwise.
- `excludes`: Battle Computer ↔ Command 'Mech (CO p.225). Others only where the books say so.
- `summary`: own words, one or two sentences.

- [ ] **Step 1: Write the failing tests:** every tag unique and `quirk-`-prefixed; every record has non-empty
  `unitTypes`, `sources`, `summary`, and exactly one cost form; every `excludes` tag resolves and is symmetric;
  `quirk-battle-computer` excludes `quirk-command-mech`; the set of `name`s equals a list in the test, written from the
  CO tables and BMM pp.82-89 during Step 3 (positive and negative counts asserted separately); spot checks from the
  page: Command 'Mech positive 2 points, mech only (CO p.225); Combat Computer 3 points (CO p.225); Accurate Weapon
  `per: {points: 1, damage: 5, scope: "weapon"}`, `zeroDamagePoints: 2` (CO p.225).
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Read CO pp.225-234 and BMM pp.82-89 from the PDFs with the Read tool's `pages` option; enter the
  records; write the name list into the test from the same pages.
- [ ] **Step 4:** Tests pass; typecheck clean.
- [ ] **Step 5:** Commit `quirks: official quirk records (CO, BMM, SO)`.

### Task 3: Quirks on units, in saves

**Files:**
- Create: `src/classes/quirk-list.ts`, test `src/classes/quirk-list.test.ts`
- Modify: `src/classes/battlemech.ts`, `vehicle.ts`, `aerospace-fighter.ts`, `small-craft.ts`, `capital-ship.ts`,
  `battle-armor.ts` (export interface, `export()`, import path, a `getQuirkUnitType()` method)
- Test: one round-trip case per class in its existing test file

**Interfaces:**
- Consumes: Task 1.
- Produces `class QuirkList`:
  - `getAll(): IAssignedQuirk[]` (copies), `add(q: IAssignedQuirk): string | null` (null on success, otherwise the
    reason: "duplicate", "excluded by <name>", "unknown quirk"), `remove(index: number): void`,
  - `export(): IAssignedQuirk[] | undefined` (undefined when empty), `import(data: unknown): void` (drops entries
    that are not objects with a string `tag`),
  - `getActive(installedUuids: string[], year: number | undefined): IAssignedQuirk[]` — leaves out weapon quirks
    whose `equipmentUuid` is not installed and assignments whose year range excludes `year`; `year` undefined
    keeps every assignment regardless of its range (the builder and record sheet pass undefined; play passes the
    game year in plan 3),
  - `getPointTotals(unitMaxDamage: number, weaponDamage: (uuid: string) => number): { positive: number; negative: number }`.
- Each class: `public quirks: QuirkList`, saved as `quirks?: IAssignedQuirk[]` in its export interface;
  `getQuirkUnitType(): QuirkUnitType` (small craft returns "dropship" for DropShips, "fighter-small-craft"
  otherwise; capital ship "large-craft"; fighter "fighter-small-craft").
- Duplicate rule: same `tag` + same `equipmentUuid` + same `location` is a duplicate.

- [ ] **Step 1: Write the failing tests:** `QuirkList` duplicate and exclusion refusals; the same weapon quirk on two
  uuids accepted (Review Focus 5); `getActive` drops a weapon quirk for a uuid not installed and keeps it in
  `getAll` (Review Focus 1); year range inclusive at both ends; `import(undefined)` gives an empty list and
  `export()` returns undefined (Review Focus 2). Per class: add a unit quirk and a weapon quirk on an installed
  weapon, `exportJSON` → new instance `importJSON` → same quirks and the weapon's uuid still matches.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement; confirm each class restores equipment `uuid` on import (fix the class if it
  regenerates it, with the round-trip test as the guard).
- [ ] **Step 4:** `npm test`, typecheck, lint clean.
- [ ] **Step 5:** Commit `quirks: quirks on units and in saves`.

### Task 4: The builder's quirk picker

**Files:**
- Create: `src/ui/components/quirk-picker.tsx`, test `src/ui/components/quirk-picker.test.tsx`
- Modify: the summary pages of the mech, vehicle, fighter, small craft, capital ship and battle armor creators
  (`src/ui/pages/classic-battletech/<unit>-creator/summary.tsx`)
- Modify: each of the six classes' `getRulesEditionIssues` (or its equivalent issue list) to add a line per quirk
  that `getQuirkOfferIssue` rejects

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces `QuirkPicker` props: `{ quirks: QuirkList; unitType: QuirkUnitType; editionTag: string; rulesLevel: number; locations: string[]; weapons: { uuid: string; label: string; maxDamage: number }[]; unitMaxDamage: number; onChange: () => void }`.
- Exported helper `getOfferedQuirks(unitType, editionTag, rulesLevel): IQuirk[]`, sorted positive first, then by
  name.

Behaviour: lists the unit's quirks (with "not installed" or "not offered in <edition>" notes), positive and negative
point totals and the books' advice to balance them (never blocking, spec goal); an add row with the quirk select
(offered quirks only), then the location, weapon or parameter control that the quirk's `attaches`/`parameter`
needs, and optional from/to years. Refusals from `QuirkList.add` are shown inline. Issue lines read
`Quirk: <name> (not in <edition name>)` and `Quirk: <name> (above the selected rules level)`, matching the equipment
lines' wording.

- [ ] **Step 1: Write the failing tests:** `getOfferedQuirks("mech", "battledroids", 3)` is empty and
  `("mech", "total-warfare", 3)` is not; render the picker with a QuirkList holding Command 'Mech under Battledroids
  — the quirk is listed with its "not offered" note and the select offers nothing (Review Focus 3); adding Battle
  Computer to a list with Command 'Mech shows the exclusion message (Review Focus 4); a mech under Battledroids
  with a quirk returns the `Quirk: ... (not in Battledroids)` issue line.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement the component, wire it into the six summary pages (rules level from
  `this.props.appGlobals.appSettings.mechRulesFilter`, which every builder shares; edition from the unit's
  `getRulesEdition()`), add the issue lines.
- [ ] **Step 4:** `npm test`, typecheck, lint clean; open the mech and vehicle builders in `npm run dev` and add and
  remove a quirk of each attach kind.
- [ ] **Step 5:** Commit `quirks: builder picker and edition issues`.

### Task 5: Custom quirks

**Files:**
- Modify: `src/data/custom-content-types.ts` (`CustomContentKind` gains `"quirk"`), `src/data/custom-content-local.ts`
  (`registerLocalCustomContent` sends quirk drafts to `setLocalCustomQuirks`), `src/ui/components/quirk-picker.tsx`
  (an "Add custom quirk" form)
- Test: `src/data/custom-content-local.test.ts`, `src/ui/components/quirk-picker.test.tsx`

Behaviour: the form takes name, kind, points (plain number), attaches, unit types and a summary; it saves a draft with
`kind: "quirk"`, `faction: "universal"`, `targetCatalogId: "quirks-custom"`, `record` an `IQuirk` with `custom: true`,
`tag` `quirk-custom-<kebab name>`, `editions: []`, `rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL`, `sources: []`, and
registers it. The picker offers it from level 6 up.

- [ ] **Step 1: Write the failing tests:** a quirk draft registers and `getQuirk` finds it; it is offered at level 6
  and not at 5; equipment drafts still register as before.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement. Check every `switch`/`Record` over `CustomContentKind` (typecheck lists them) and give
  `"quirk"` a case.
- [ ] **Step 4:** `npm test`, typecheck, lint clean.
- [ ] **Step 5:** Commit `quirks: custom quirks`.

### Task 6: Quirks on the record sheet

**Files:**
- Create: `src/utils/quirk-sheet-lines.ts`, test `src/utils/quirk-sheet-lines.test.ts`
- Modify: `src/ui/components/svg/battlemech-svg.tsx` (or `record-sheet-equipment-table.tsx`, whichever draws the
  weapons box), `vehicle-record-sheet.tsx`, `fighter-record-sheet.tsx`, `small-craft-record-sheet.tsx`,
  `capital-ship-record-sheet.tsx`, `battle-armor-record-sheet.tsx`

**Interfaces:**
- Produces `getQuirkSheetLines(active: IAssignedQuirk[], weaponLabel: (uuid: string) => string | undefined): { unit: string[]; weapons: { uuid: string; text: string }[] }`
  — unit lines like "Command 'Mech", "Improved Targeting (Long)", "Battlefists (LA)", "Rugged (1)"; weapon lines are
  the quirk names for each weapon. An assignment with a year range prints it: "(to 3024)", "(from 3050)",
  "(3025-3049)".

Behaviour: the unit's `quirks.getActive(installedUuids, year)` feeds it, so uninstalled weapons' quirks never print
(Review Focus 1). The 'Mech sheet prints the unit lines as a "Quirks:" line in the weapons box and each weapon's quirk
names under that weapon's row; the HTML sheets print a "Quirks" block and the weapon quirk names beside the weapon.
Nothing prints when there are no quirks. The AS card is untouched.

- [ ] **Step 1: Write the failing tests:** formatting of each parameter kind and of each year-range form; a weapon quirk whose uuid is not in the
  active list produces no line; an empty list produces no lines.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement and wire the six sheets.
- [ ] **Step 4:** `npm test`, typecheck, lint clean; print a 'Mech and a vehicle sheet in `npm run dev` with one quirk
  of each kind and check the layout does not overflow its box.
- [ ] **Step 5:** Commit `quirks: record sheet`.
