# Shared game settings, round 4: Alpha Strike creator and both roster MUL searches — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Alpha Strike unit creator opens with the shared settings block (Special Rulesets and Rules Level), and the Alpha Strike and Classic roster MUL searches gain the Special Rulesets step, whose ticked rulesets trim the Tech, Type and Era lists and the results.

**Architecture:** The Special Rulesets step (yes/no, "Choose rulesets", the pop-up) moves out of `GameSettingsBlock` into its own component, used by the block and by the shared `MULSearchFilters`. MUL search logic (which tech, type and era values a ruleset leaves, the downward fit, the result filter) is pure code in `src/utils/mulSearchFilters.ts`. The block gains a `hiddenSteps` prop so the AS creator shows only the steps it has (call 6).

**Tech Stack:** React 19 + TypeScript, Vitest (`--project unit`, jsdom + Testing Library), Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-10-26-shared-game-settings-design.md` (calls 1, 6, 8, 18 apply here).

## Global Constraints

- User rulings 2026-10-26 (this session):
  - MUL searches: "Rulesets on top". The Special Rulesets step (same yes/no + pop-up) goes at the top of the shared MUL filters. Ticked rulesets trim the Tech, Type and Era lists and leave matching units out of the results. Rules/Tech/Era stay MUL filters with "All", in the order Rulesets → Rules → Tech → Era. Picking a tech moves an era that has no such tech to the nearest one that does, with the notice line. There is no Edition step.
  - AS creator: Special Rulesets and Rules Level only (one AS edition, no tech base or era). The block goes first. Under no-Clans the ProtoMech type is disabled with the reason, and ticking the ruleset on a ProtoMech card is refused. Rulesets are saved on the custom unit.
- Call 18: the searches leave out every unit type a ticked ruleset removes.
- Roster print guards (`alpha-strike/roster/print.tsx`, Classic roster print) keep the app-wide level (call 1). No change there.
- Reuse shared components (memory): no second copy of the rulesets window.
- Copy: the disabled ProtoMech option's reason reuses the block's wording: "ProtoMechs do not exist under <ruleset name>."
- Never commit `handoff.md`.
- Verify: `npx vitest run --project unit --reporter=dot`, `npx tsc --noEmit -p .`, `npx eslint <changed files>`.

## Review Focus

1. A stored search with Tech "Clan", or a Clan era alias, or Type ProtoMech, then ticking no-Clans: each moves (Tech → All, Era → nearest offered, Type → All) and the notice says so. Pinned in Task 2.
2. Unticking the ruleset again restores the lists, but does not restore the moved values (nothing moves upward). Pinned in Task 2.
3. Old app settings with no `rulesets` in `cbtMULSearch`, and no `alphaStrikeSearchRulesets`, load as `[]`; a non-array is dropped. Pinned in Task 2.
4. An AS save from before this round (no `rulesets`) loads with none, and exports without the key. A MUL card's `rulesLevel` stays `undefined` (not forced to a number by the block). Pinned in Task 4.
5. The AS online search path (live MUL) is also filtered, not only the bundled path. Pinned in Task 3 (filter applied in `_AddUnitsPage` after `getMULASSearchResults`).

---

### Task 1: Special Rulesets step as its own component; `hiddenSteps` on the block

**Files:**
- Create: `src/ui/components/special-rulesets-step.tsx`
- Modify: `src/ui/components/game-settings-block.tsx`
- Test: `src/ui/components/game-settings-block.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export default function SpecialRulesetsStep(props: {
      rulesets: string[];
      /** The unit type being built; a ruleset that removes it is disabled. Left out by the searches. */
      unitType?: RulesEditionUnitType;
      /** Shown inside the window as well, since the caller's own notice sits behind it. */
      notice: string;
      onToggle: (ids: string[]) => void;   // ids to toggle, in order ("No" toggles every ticked one)
  }): JSX.Element
  ```
  It holds `windowOpen` state, renders the yes/no select, "Choose rulesets" button, the description paragraph and the `StandardModal` with one checkbox per ruleset (clash and removes-this-type reasons), exactly as the block does today.
- `GameSettingsBlock` gains `hiddenSteps?: Array<"edition" | "techBase" | "era">`. A hidden step is not rendered, has no stale note, and its moves are left out of the notice.

- [ ] **Step 1: Write the failing tests** in `game-settings-block.test.tsx`:
  - `hides the steps it is told to hide`: render with `hiddenSteps={["edition", "techBase", "era"]}`, unitType `"mech"`; assert no "Edition"/"Technology Base:"/"Era:" labels, "Rules Level" present, "Special Rulesets:" present.
  - `says nothing about a hidden step that moved`: settings with `era: ""` and those hidden steps; change the rules level; assert the status line, if any, does not contain "Era moved".
- [ ] **Step 2: Run** `npx vitest run --project unit src/ui/components/game-settings-block.test.tsx` — the two new tests FAIL, the old ones pass.
- [ ] **Step 3: Extract `SpecialRulesetsStep`** and use it in the block (`onToggle` maps to `change(...ids.map(toggle))`); add `hiddenSteps`.
- [ ] **Step 4: Run** the same file — all PASS.
- [ ] **Step 5: Commit** "Settings block: the Special Rulesets step as its own component; hidden steps (#324 round 4)".

### Task 2: MUL search ruleset logic and stored rulesets

**Files:**
- Modify: `src/utils/mulSearchFilters.ts`, `src/utils.ts` (`searchBundledMUL`), `src/ui/classes/app_settings.ts`
- Test: create `src/utils/mulSearchFilters.test.ts`

**Interfaces:**
- `IMULSearchFilters` gains `rulesets: string[]` (default `[]` in `newMULSearchFilters`).
- Produces, in `mulSearchFilters.ts`:
  ```ts
  /** MUL Tech filter values and the btTechOptions tags each stands for. */
  export const MUL_TECH_BASES: Record<string, string[]>;      // "inner sphere": ["is"], clan: ["clan"], mixed: ["mis", "mclan"]
  export function isMULTechOffered(tech: string, rulesets: string[]): boolean;   // "" (All) always
  export function isMULTypeOffered(typeId: number, rulesets: string[]): boolean;  // 0 (All) always
  export function isMULEraOffered(eraId: number, tech: string, rulesets: string[]): boolean; // 0 (All) always
  export function changeMULSearchFilters(filters: IMULSearchFilters, changes: Partial<IMULSearchFilters>): { filters: IMULSearchFilters; moves: string[] };
  export function filterMULByRulesets(units: IASMULUnit[], rulesets: string[]): IASMULUnit[];
  ```
- Mappings (decided here):
  - MUL type → unit type: 18, 20 → mech; 19, 24 → vehicle; 21 → infantry; 22 → battle-armor; 23 → protomech; 17, 1701, 1702 → fighter; 1703, 1704 → small-craft; 1705–1707 → capital-ship. An unmapped id is always offered.
  - MUL `Technology.Id` → tags: 1 → is, 2 → clan, 3 → mis + mclan; 57 (Primitive) → is. A unit is left out when all its tags are removed, or its `Type.Id` maps to a removed unit type.
  - Era offered: a Clan era alias (id ≥ 1000) stands for its btEra; a MUL era stands for every btEra whose years overlap it. Offered when one of those btEras is not in any ruleset's `removesEras` and offers a tag in (Tech's tags, or every tag when Tech is All) minus the removed tech bases.
- `changeMULSearchFilters` applies `changes`; a `rulesets` change is a list, checked with `getRulesetConflict` (a clashing id is dropped and the move list says "Clashes with <name>"). Then, in order, fits Tech (→ "" ), Type (→ 0), Era (→ the offered MUL era nearest by `yearStart` to the old one's start; an alias's start is its btEra's), skipping a step the change itself set. Each move adds "Tech moved to All", "Type moved to All", "Era moved to <label>" (MUL label, or the alias label).
- `searchBundledMUL` applies `filterMULByRulesets(…, filters.rulesets)`.
- App settings: `cbtMULSearch` import keeps `rulesets` (string array, else `[]`); new flat `alphaStrikeSearchRulesets: string[] = []`, imported the same way and exported.

- [ ] **Step 1: Write the failing tests** in `mulSearchFilters.test.ts` (ruleset id: read it from `getSpecialRulesets()[0].id`, the no-Clans sample):
  - `offers every tech, type and era with no rulesets`.
  - `no-Clans removes Clan tech, the ProtoMech type and the Clan era aliases`: `isMULTechOffered("clan", [noClans])` false, `"inner sphere"` true; `isMULTypeOffered(23, …)` false, `18` true; every `getMULEraAliases()` id not offered with Tech All.
  - `Clan tech offers no Age of War or Star League`: `isMULEraOffered(1, "clan", [])` false, `10` false, `11` true, `13` true.
  - `ticking no-Clans moves Tech, Type and Era with notices`: filters `{ tech: "clan", type: 23, era: <Clan Golden Years alias id> }` + `{ rulesets: [noClans] }` → tech "", type 0, era 11 (2781 and 2901 are both 60 years from 2841; a tie goes to the earlier), moves `["Tech moved to All", "Type moved to All", "Era moved to Early Succession War"]`.
  - `picking Clan tech moves Star League to Early Succession War`.
  - `unticking does not move values back`.
  - `filterMULByRulesets drops Clan, Mixed and ProtoMech units, keeps Inner Sphere and Primitive`.
  - In `src/ui/classes/app_settings` test (or a new `app_settings.test.ts` beside it if none): `old cbtMULSearch with no rulesets loads []`, `a non-array rulesets is dropped`, `alphaStrikeSearchRulesets round-trips`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/utils/mulSearchFilters.test.ts` — FAIL (functions not defined).
- [ ] **Step 3: Implement** the functions, the field, `searchBundledMUL` and the app settings.
- [ ] **Step 4: Run** the new tests and `src/utils/mul-search.test.ts` — PASS.
- [ ] **Step 5: Commit** "MUL searches: rulesets trim the Tech, Type and Era lists and the results (#324 round 4)".

### Task 3: The rulesets step in the shared MUL filters; both rosters wired

**Files:**
- Modify: `src/ui/components/mul-search-filters.tsx`, `src/ui/pages/alpha-strike/roster/_AddUnitsPage.tsx`, `src/ui/pages/classic-battletech/roster/_addMechDialog.tsx` (only if its type-17 mapping needs the rulesets passed through; it passes `filters` whole to `searchBundledMUL`)
- Test: create `src/ui/components/mul-search-filters.test.tsx`

**Interfaces:**
- Consumes: `SpecialRulesetsStep` (Task 1); `changeMULSearchFilters`, `isMUL*Offered`, `filterMULByRulesets` (Task 2).
- `MULSearchFilters` keeps its props. Its `change` goes through `changeMULSearchFilters`; it keeps `notice` state (`{ text, made }` like the block) and shows it with `role="status"` under the rulesets step. The Tech, Type, Era option lists (Clan eras optgroup too) show only offered values; the Clan eras optgroup is left out when empty.
- AS roster: `getSearchFilters` / `updateSearchFilters` carry `rulesets` ↔ `alphaStrikeSearchRulesets`; the results of `getMULASSearchResults` go through `filterMULByRulesets(data, settings.alphaStrikeSearchRulesets)` before sorting.

- [ ] **Step 1: Write the failing tests** in `mul-search-filters.test.tsx` (render with `newMULSearchFilters({ tech: "clan", type: 23 })` and a spy `onChange`):
  - `shows the Special Rulesets step first`: the first label in the fieldset is "Special Rulesets:".
  - `ticking no-Clans calls onChange with Tech and Type moved, and says so`: choose Yes, tick the sample in the window; `onChange` last call has `rulesets: [id]`, `tech: ""`, `type: 0`; rerender with those filters; status text contains "Tech moved to All".
  - `under no-Clans the lists offer no Clan tech, ProtoMech type or Clan eras`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/ui/components/mul-search-filters.test.tsx` — FAIL.
- [ ] **Step 3: Implement** the component change and wire the AS roster.
- [ ] **Step 4: Run** the new test, `src/ui/pages/alpha-strike/roster/home.test.tsx` and the Classic roster tests (`npx vitest run --project unit src/ui/pages/classic-battletech/roster`) — PASS.
- [ ] **Step 5: Commit** "Both roster MUL searches: Special Rulesets on top (#324 round 4)".

### Task 4: Alpha Strike creator: the block first, rulesets on the custom unit

**Files:**
- Modify: `src/classes/alpha-strike-unit.ts`, `src/ui/pages/alpha-strike/unit-creator/home.tsx`
- Test: `src/classes/alpha-strike-unit.test.ts`; create `src/ui/pages/alpha-strike/unit-creator/home.test.tsx`

**Interfaces:**
- `AlphaStrikeUnit` gains `public rulesets: string[] = []`; `IAlphaStrikeUnitExport.rulesets?: string[]`, exported only when non-empty, imported as a string array (else `[]`).
- In `home.tsx`:
  ```ts
  /** The Classic unit type an Alpha Strike card type stands for, for the rulesets (call 18). */
  export const AS_CREATOR_UNIT_TYPES: Record<string, RulesEditionUnitType> = { BM: "mech", PM: "protomech", CV: "vehicle", AS: "fighter" };
  ```
  The page renders `GameSettingsBlock` first in the form, with `hiddenSteps={["edition", "techBase", "era"]}`, `unitType={AS_CREATOR_UNIT_TYPES[unit.type] ?? "mech"}` and settings `{ rulesets: unit.rulesets, edition: DEFAULT_RULES_EDITION, rulesLevel: unit.rulesLevel ?? CUSTOM_HOMEBREW_RULES_LEVEL, techBase: "is", era: "" }`. `onChange` sets `unit.rulesLevel` and `unit.rulesets`, then saves. It does not call `rememberRulesLevel` (builder's call: a hand-built card defaults to Custom Homebrew, so the Classic default is not touched). The old Rules Level select and `setRulesLevel` are deleted.
- The Type select's ProtoMech option is `disabled` when `getRulesetRemovingUnitType(unit.rulesets, "protomech")` is set, with `title` "ProtoMechs do not exist under <name>."

- [ ] **Step 1: Write the failing tests**:
  - `alpha-strike-unit.test.ts`: `rulesets round-trip and are left out when empty`; `an older save loads with no rulesets and rulesLevel stays undefined`.
  - `unit-creator/home.test.tsx` (stub `appGlobals` as the AS roster `home.test.tsx` does; clear `localStorage`): `the settings block comes first, with no Edition, Tech Base or Era`; `on a ProtoMech card the no-Clans box is disabled`; `with no-Clans ticked the ProtoMech type is disabled`; `picking a rules level saves it on the card` (read back `localStorage.editing_as_unit`).
- [ ] **Step 2: Run** both files — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** both files — PASS. Then the whole unit suite, `tsc`, and eslint on every changed file.
- [ ] **Step 5: Commit** "Alpha Strike unit creator: the shared settings block first; rulesets on the card (#324 round 4)".

### Task 5: Spec, check in the app, ship

**Files:**
- Modify: `docs/superpowers/specs/2026-10-26-shared-game-settings-design.md`

- [ ] **Step 1:** Add calls 20-23 and mark round 4 done:
  20. The MUL searches have no Edition step and keep the MUL's own Rules, Tech and Era values with "All" (user ruling); ticked rulesets trim those lists and the results.
  21. A search Tech pick moves an Era with no such tech to the nearest offered era by start year (ties go earlier), with the notice line; Type and Tech move to All.
  22. The AS creator shows Special Rulesets and Rules Level only (user ruling); its card type stands for a Classic unit type, so no-Clans disables ProtoMech cards.
  23. The AS creator's level does not become the app-wide default: a hand-built card starts at Custom Homebrew.
- [ ] **Step 2:** Check in the running app (run skill): AS creator, AS roster Add Units, Classic roster add dialog: tick no-Clans, see the lists trim and results drop Clan units.
- [ ] **Step 3:** Full e2e: `npx playwright test --project=chromium --reporter=dot`. Rerun any AVG "Loading..." stalls serially (memory `e2e-stalls-avg-web-shield.md`).
- [ ] **Step 4:** Final review (one fresh Opus reviewer on the branch diff); fix every finding, minors included.
- [ ] **Step 5:** Ship: commit, `git push origin beta`, `git deploy-beta`, ff `master` in `C:/repo/battletech-tools` and push, progress comment on #324. Update memory `shared-game-settings.md`, write a fresh handoff, stop.
