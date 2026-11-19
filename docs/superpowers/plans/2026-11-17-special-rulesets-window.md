# Special Rulesets Window Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Special Rulesets window into a grouped, searchable checklist with an explicit eligibility model and a per-ruleset "More info" view, before Chunks G, H, K, K2 and COIL-alt add some 20 more rulesets.

**Architecture:** The registry (`src/data/special-rulesets.ts`) gains display fields (summary, category, source tag, publication, author) and two explicit relations (`excludes`, `requires`) next to the existing `changes` clash. One pure function, `getRulesetBlock`, gives every "why not" with its reason text. Every caller uses it: the window, the settings block toggle and the MUL search filters. The window is split into a list (filters, category groups, rows) and a detail view shown in the same modal.

**Tech Stack:** React 18 function components, react-bootstrap `StandardModal`, Vitest + Testing Library (happy-dom), TypeScript.

**Spec:** Owner decisions of 2026-11-17, recorded in `JBTToolsSupportFiles/handoff.md` (top two blocks) and restated in "Design" below. Issue #324 (Special Rulesets), #172 (Future Wars).

## Design (owner-approved 2026-11-17)

1. A list with a checkbox per ruleset, **grouped by category** (Construction, Play, Campaign & Economics, Setting). Each group folds and its header says "n of m ticked".
2. A **row** shows: checkbox + name, a **source tag** (e.g. "FW #14", "r/battletech"), a **one-line summary**, a **More info** button, and the reason in red when the ruleset is unavailable.
3. **Eligibility:** rulesets that share a `changes` key clash, as today. On top of that there are optional explicit `excludes` (works in both directions) and `requires`. A disabled row always says why. Power Armor's refusal of Flint's construction stays a `mechConstruction` clash, now shown with its reason ("both change 'Mech construction").
4. **More info** swaps the window's content to a detail view: full description, tables, source, author, category, what it changes, what it cannot be used with, what it needs, a Tick/Untick button and "← Back to list". Going back keeps the search text, the filters and the scroll position. No stacked modal, no route.
5. **Filters:** all four. Text search (name, summary, description, source, tag, publication, author), a source (publication) dropdown, "Hide unavailable" (off by default) and "Show ticked only".

## Global Constraints

- The outer control stays as it is: the "Special Rulesets:" No/Yes select and the "Choose rulesets" button. Props of `SpecialRulesetsStep` (`rulesets`, `unitType?`, `notice`, `onToggle(ids)`) do not change, so `game-settings-block.tsx` and `mul-search-filters.tsx` need no edits to their call.
- Each checkbox's accessible name is exactly `ruleset.name`. Its `aria-describedby` points at `ruleset-about-<id>`, an element holding the summary and the reason. Existing tests find checkboxes this way.
- Reason copy, exact:
  - clash: `Clashes with <name> (both change <change label>)`
  - excludes, either direction: `Cannot be used with <name>`
  - requires: `Needs <name>`
  - a ticked requirement: `Needed by <name>`
  - unit type: `<UNIT_TYPE_PLURALS[type]> do not exist under this ruleset`
- Category labels and order: `construction` "Construction", `play` "Play", `campaign` "Campaign & Economics", `setting` "Setting".
- `summary`: one line, no line break, at most 120 characters, our own words (memory card-text-rule-scope: never a whole card or rule text).
- Vitest from PowerShell (`npx vitest run --project unit <path>`). From Bash use `env -u CLAUDECODE npx vitest ...`. No Bash heredocs.
- Work in a worktree `C:/repo/btt-rulesets-window` on branch `rulesets-window` off `beta`, with node_modules as a junction to battletech-tools-master's, as in earlier chunks.

## Review Focus

1. **A ticked ruleset that is now ineligible.** A saved unit from before a new `excludes` was added must load unchanged. Both rows stay ticked and show the reason as a warning; the checkboxes stay enabled so the player can untick. Nothing is dropped silently. (Task 2 test, Task 4 test.)
2. **Unticking a requirement while its dependant is ticked.** It is refused with "Needed by <name>", in the window, in `applyGameSettingChange` and in `changeMULSearchFilters`, which drops a dependant whose requirement is missing and reports `Needs <name>`. (Task 2.)
3. **Search typed with a straight apostrophe against curly text, or the other way round** ("'Mech" vs "’Mech"), and mixed case. Both match. Several words must all match. (Task 3.)
4. **Filters that hide everything:** "Show ticked only" with nothing ticked, or a search with no hits. The list shows "No rulesets match." and a "Clear filters" button. Group headers keep counting ticked rulesets that the filter hides. (Tasks 3, 4.)
5. **Closing the window from the detail view and opening it again** opens on the list, not the old detail. On Back, focus returns to that row's More info button. (Task 5.)

---

### Task 1: Registry display fields and labels

**Files:**
- Modify: `src/data/special-rulesets.ts` (interface at :33-51, the 10 entries at :65-171)
- Modify: `src/test-support/builders.ts` (add a ruleset builder)
- Modify (use the builder): `src/data/special-rulesets.test.ts:5`, `src/data/game-settings.test.ts:75,122`, `src/data/future-wars-play-rules.test.ts:49`, `src/ui/components/game-settings-block.test.tsx:67,108,115`, `src/utils/mulSearchFilters.test.ts:12,65`
- Test: `src/data/special-rulesets.test.ts`

**Interfaces:**
- Produces:
  - `type RulesetCategory = "construction" | "play" | "campaign" | "setting"`
  - `RULESET_CATEGORIES: { id: RulesetCategory; label: string }[]` (order as in Global Constraints)
  - `CHANGE_LABELS: Record<string, string>`: `mechConstruction` "'Mech construction", `firePhase` "the fire phase", `movementModes` "movement modes", `morale` "morale", `weaponFailure` "weapon failures", `weaponRanges` "weapon ranges", `tandemChargeSrm` "Tandem-Charge SRM ammunition", `techBases` "the tech bases"
  - `ISpecialRuleset` gains the required `summary: string` and `category: RulesetCategory`, and the optional `excludes?: string[]` and `requires?: string[]`. `source` becomes `{ title: string; url?: string; publication: string; tag: string; author?: string }`.
  - `testSpecialRuleset(overrides: Partial<ISpecialRuleset> & { id: string }): ISpecialRuleset` in `src/test-support/builders.ts`. Defaults: `name` = id, `summary` "test", `description` "", `category` "play", `source` `{ title: "test", publication: "Test", tag: "test" }`, `changes` [].

- [ ] **Step 1: Write the failing invariant tests** in `special-rulesets.test.ts`, as a new `describe("registry fields (window refactor)")`:
  - `it("gives every ruleset a one-line summary of at most 120 characters")`: for each ruleset, `summary.length` is between 1 and 120, and the summary has no `\n`.
  - `it("files every ruleset under a known category")`: `RULESET_CATEGORIES.map(c => c.id)` contains `category`.
  - `it("labels every change key")`: `CHANGE_LABELS[key]` is defined for every key in every `changes`.
  - `it("names only listed rulesets in excludes and requires, never itself")`: every id resolves with `findSpecialRuleset`, and none equals the ruleset's own id.
  - `it("never requires a ruleset it clashes with or excludes")`: no `requires` id shares a `changes` key with the ruleset or is in its `excludes`.
  - `it("tags the shipped rulesets by publication")`: `findSpecialRuleset("future-wars-11-construction")!.source` matches `{ publication: "Future Wars", tag: "FW #11", author: "Clell Flint" }`, and `tandem-charge-srm-house-rule` matches `{ publication: "r/battletech", tag: "r/battletech", author: "u/Magical_Savior" }`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/data/special-rulesets.test.ts`. Expected: FAIL (TypeScript: unknown fields / undefined).
- [ ] **Step 3: Implement.** Add the types, constants and builder. Fill the 10 entries:

  | id | category | publication | tag | author |
  |---|---|---|---|---|
  | best-of-future-wars-construction | construction | Future Wars | Best of FW | Clell Flint |
  | future-wars-11-construction | construction | Future Wars | FW #11 | Clell Flint |
  | fw-power-armor | construction | Future Wars | FW #14 | Bill Swisher |
  | fw-opportunity-fire | play | Future Wars | Best of FW | Charles J. Tomaszewski |
  | fw-strategic-movement | play | Future Wars | Best of FW | Herb Barents |
  | fw-morale | play | Future Wars | Best of FW | Herb Barents |
  | fw-weapon-malfunctions | play | Future Wars | Best of FW | Karl Bruanning |
  | fw-long-range-wars | play | Future Wars | Best of FW | Herb Barents |
  | tandem-charge-srm-house-rule | play | r/battletech | r/battletech | u/Magical_Savior |
  | sample-no-clans | setting | Samples | Sample | (none) |

  Write each `summary` in our words from the entry's own description; for the Future Wars play rulesets the existing short descriptions may be shortened to fit. Move the existing test helpers to `testSpecialRuleset` so tsc stays clean.
- [ ] **Step 4: Run** the same file, then `npm run typecheck`. Expected: PASS, no type errors.
- [ ] **Step 5: Commit** `Special Rulesets: summary, category, source tag and author on every ruleset (#324)`.

### Task 2: One eligibility model

**Files:**
- Modify: `src/data/special-rulesets.ts` (beside `getRulesetConflict`, :221)
- Modify: `src/data/game-settings.ts:166-181` (toggle), `src/utils/mulSearchFilters.ts:113-123`
- Modify: `src/ui/components/game-settings-block.tsx:48-49` (show `block.reason`)
- Test: `src/data/special-rulesets.test.ts`, `src/data/game-settings.test.ts`, `src/utils/mulSearchFilters.test.ts`

**Interfaces:**
- Consumes: Task 1's fields, `CHANGE_LABELS`, `testSpecialRuleset`.
- Produces:
  - `type RulesetBlockKind = "clash" | "excluded" | "needs" | "neededBy" | "unitType"`
  - `interface IRulesetBlock { kind: RulesetBlockKind; by?: ISpecialRuleset; reason: string }`
  - `getRulesetBlock(tickedIds: readonly string[], id: string, unitType?: RulesEditionUnitType): IRulesetBlock | undefined`. For an **unticked** id the checks run in this order: unitType, excluded, clash, needs (the first missing requirement). For a **ticked** id: neededBy (a ticked ruleset that requires it), then excluded and clash against the *other* ticked ids, as warnings.
  - `getRulesetRelations(id: string): { clashesWith: ISpecialRuleset[]; excludes: ISpecialRuleset[]; requires: ISpecialRuleset[]; requiredBy: ISpecialRuleset[] }`. `excludes` merges both directions; `clashesWith` is rulesets sharing a `changes` key, minus those already in `excludes`.
  - `getRulesetConflict` keeps its signature and also returns an `excludes` match in either direction, so its five existing callers in tests keep passing.
  - `applyGameSettingChange` result gains `block?: IRulesetBlock`, set whenever `refused` is. The old `refused` / `removesUnitType` stay.

- [ ] **Step 1: Write failing tests** (push test rulesets with `testSpecialRuleset`; clean them up in `afterEach` as the file does now):
  - `getRulesetBlock`: `it("explains a clash with the change's label")`: `getRulesetBlock(["sample-no-clans"], "test-techs")` (test-techs `changes: ["techBases"]`) gives `reason` `"Clashes with Sample: The Clans never existed (alternate universe) (both change the tech bases)"`. `it("refuses an exclusion from either side")`: A `excludes: ["B"]`, so `getRulesetBlock(["A"], "B")` and `getRulesetBlock(["B"], "A")` both give `kind` "excluded" and `reason` "Cannot be used with A" / "... B". `it("needs a missing requirement")`: `getRulesetBlock([], "D")` with `D.requires = ["C"]` gives `"Needs C"`. With `["C"]` it gives undefined. `it("will not untick a requirement in use")`: `getRulesetBlock(["C","D"], "C")` gives kind "neededBy", `"Needed by D"`. `it("warns, without refusing, on a saved pair that no longer fits")`: `getRulesetBlock(["A","B"], "A")` gives kind "excluded". `it("names the unit type first")`: `getRulesetBlock([], "sample-no-clans", "protomech")` gives `"ProtoMechs do not exist under this ruleset"`.
  - `it("keeps Power Armor and Flint's construction apart, with the reason")`: `getRulesetBlock(["fw-power-armor"], "future-wars-11-construction")!.reason` is `"Clashes with Future Wars: Power Armor (both change 'Mech construction)"`.
  - `game-settings.test.ts`: `it("refuses a ruleset whose requirement is not ticked, and the untick of a requirement in use")`: the result keeps `settings` unchanged, with `block.kind` "needs" / "neededBy".
  - `mulSearchFilters.test.ts`: `it("drops a ruleset whose requirement is missing, saying so")`: `changeMULSearchFilters(f, { rulesets: ["D"] })` gives `rulesets: []` and `moves` containing `"Needs C"`. `["D","C"]` (requirement listed after) keeps both.
- [ ] **Step 2: Run** the three files. Expected: FAIL (`getRulesetBlock` not exported).
- [ ] **Step 3: Implement** the functions above. In `changeMULSearchFilters`, keep the clash pass, then drop rulesets with missing requirements until nothing changes, pushing `"Needs " + name` once each. In `applyGameSettingChange`, an untick goes through `getRulesetBlock` (neededBy refuses it) and a tick uses the unticked order. In `game-settings-block.tsx`, print `result.block.reason` when it is present, keeping today's two lines as the fallback.
- [ ] **Step 4: Run** the three files plus `src/ui/components/game-settings-block.test.tsx` and `src/classes/battlemech-future-wars.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `Special Rulesets: one eligibility model with excludes, requires and reasons (#324)`.

### Task 3: List filtering and grouping (pure)

**Files:**
- Create: `src/utils/ruleset-list.ts`
- Test: `src/utils/ruleset-list.test.ts`

**Interfaces:**
- Consumes: `getRulesetBlock`, `RULESET_CATEGORIES`.
- Produces:
  - `interface IRulesetListFilter { query: string; publication: string /* "" = all */; hideUnavailable: boolean; tickedOnly: boolean }`
  - `EMPTY_RULESET_FILTER: IRulesetListFilter` (`""`, `""`, false, false)
  - `isRulesetFilterActive(filter: IRulesetListFilter): boolean`
  - `filterRulesets(rulesets: readonly ISpecialRuleset[], filter: IRulesetListFilter, tickedIds: readonly string[], unitType?: RulesEditionUnitType): ISpecialRuleset[]`
  - `groupRulesets(all: readonly ISpecialRuleset[], shown: readonly ISpecialRuleset[], tickedIds: readonly string[]): { category: RulesetCategory; label: string; rulesets: ISpecialRuleset[]; ticked: number; total: number }[]`. Groups come in `RULESET_CATEGORIES` order; a group with nothing shown is left out; `ticked`/`total` count *all* rulesets of the category, not only the shown ones.
  - `getRulesetPublications(rulesets: readonly ISpecialRuleset[]): string[]` (distinct, sorted)

- [ ] **Step 1: Write failing tests** against the shipped registry: `it("matches every word, any case, either apostrophe")`: query `"’mech CONSTRUCTION"` includes both Flint rulesets; `"'mech flint"` gives exactly the two Flint ones. `it("searches author and tag")`: `"Bruanning"` gives `["fw-weapon-malfunctions"]`; `"FW #14"` gives `["fw-power-armor"]`. `it("filters by publication")`: `"r/battletech"` gives the Tandem Charge ruleset only. `it("hides unavailable but never a ticked one")`: with `["fw-power-armor"]` ticked and `hideUnavailable`, both Flint rulesets are gone and Power Armor stays. `it("shows ticked only")`: with nothing ticked the result is `[]`. `it("groups in category order and counts hidden ticked rulesets")`: with `["fw-morale"]` ticked and the query "Flint", the groups are `[construction]` only, and the play group would count 1 ticked if it were shown: assert by grouping `all` with an empty filter, giving `play.ticked === 1, play.total === 6`. `getRulesetPublications` gives `["Future Wars", "r/battletech", "Samples"]` (`localeCompare` order).
- [ ] **Step 2: Run** `npx vitest run --project unit src/utils/ruleset-list.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement.** Normalise text by lowercasing and turning `‘ ’ ʼ` into `'`. Split the query on whitespace; every term must occur in the haystack (name, summary, description, source title, tag, publication, author).
- [ ] **Step 4: Run** it. Expected: PASS.
- [ ] **Step 5: Commit** `Special Rulesets: search, filter and group the ruleset list (#324)`.

### Task 4: The list view

**Files:**
- Create: `src/ui/components/special-rulesets/ruleset-list.tsx`
- Modify: `src/ui/components/special-rulesets-step.tsx` (window body becomes the list; holds filter state)
- Test: create `src/ui/components/special-rulesets-step.test.tsx`; modify `src/ui/components/future-wars-rules-reference.test.tsx:29-37` (the tables are no longer folded under each row; that test moves to Task 5)

**Interfaces:**
- Consumes: Task 3's functions, `getRulesetBlock`.
- Produces: `RulesetList(props: { tickedIds: string[]; unitType?: RulesEditionUnitType; filter: IRulesetListFilter; onFilter: (f: IRulesetListFilter) => void; openGroups: Partial<Record<RulesetCategory, boolean>>; onGroupToggle: (c: RulesetCategory, open: boolean) => void; onToggle: (ids: string[]) => void; onMoreInfo: (id: string, button: HTMLButtonElement) => void }): JSX.Element`

Layout, top to bottom: the filter bar (search input labelled "Search rulesets", a select labelled "Source" with "All sources" + publications, and the checkboxes "Hide unavailable" and "Show ticked only"); then one `<details>` per group, with the summary `<label> (<ticked> of <total> ticked)`; then the rows. A group is open when `openGroups[c]` says so; otherwise it is open when it has a ticked ruleset, a filter is active, or the registry has 12 rulesets or fewer. Groups use `<details>`, so a folded group's checkboxes stay in the DOM: existing tests that tick by label keep working. A row's checkbox is disabled when it is unticked and blocked, or ticked and `neededBy`. The reason appears in `color-red` inside `ruleset-about-<id>`. The More info button has `aria-label="More info: <name>"`. When nothing is shown: `No rulesets match.` and a "Clear filters" button that sets `EMPTY_RULESET_FILTER`.

- [ ] **Step 1: Write failing tests** in `special-rulesets-step.test.tsx` (open the window as the Future Wars reference test does: change "Special Rulesets:" to "yes"):
  - `it("groups the rulesets by category with ticked counts")`: the group summaries read "Construction (1 of 3 ticked)" with `rulesets={["fw-power-armor"]}` and "Play (0 of 6 ticked)".
  - `it("shows tag and summary on a row, the full description only in More info")`: the row contains `"FW #14"` and the Power Armor summary, and does not contain its description's sentence "No weapons in the head or center torso.".
  - `it("disables a clashing ruleset and says why")`: with `["fw-power-armor"]`, the "Future Wars: Alternate 'Mech construction (Future Wars #11 printing)" checkbox is disabled, and its `aria-describedby` text contains "both change 'Mech construction".
  - `it("keeps a saved pair that no longer fits ticked, warned and untickable")`: push test rulesets A `excludes: ["B"]` and B, both ticked. Both checkboxes are checked and enabled, and both show "Cannot be used with".
  - `it("filters by search, source and the two toggles, and offers Clear filters")`: typing "Bruanning" leaves one checkbox. "Show ticked only" with nothing ticked shows "No rulesets match.". Clear filters brings all 10 back.
  - `it("calls onToggle with the ruleset id")`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/ui/components/special-rulesets-step.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** `RulesetList` and replace the window body. `SpecialRulesetsStep` holds `filter` and `openGroups` in `useState`; they last while the component is mounted.
- [ ] **Step 4: Run** this file plus `game-settings-block.test.tsx`, `mul-search-filters.test.tsx`, `src/ui/pages/alpha-strike/unit-creator/home.test.tsx` and `src/ui/pages/classic-battletech/mech-creator/step-power-armor.test.tsx`. Expected: PASS. Fix selectors in old tests only where they relied on the removed inline description, never by weakening what they assert.
- [ ] **Step 5: Commit** `Special Rulesets: grouped checklist with tags, summaries and filters (#324)`.

### Task 5: The More info view

**Files:**
- Create: `src/ui/components/special-rulesets/ruleset-detail.tsx`
- Modify: `src/ui/components/special-rulesets-step.tsx`
- Test: `src/ui/components/special-rulesets-step.test.tsx`, `src/ui/components/future-wars-rules-reference.test.tsx`

**Interfaces:**
- Consumes: `getRulesetBlock`, `getRulesetRelations`, `CHANGE_LABELS`, `RULESET_CATEGORIES`, `FutureWarsRulesReference` (rendered with `open`).
- Produces: `RulesetDetail(props: { id: string; tickedIds: string[]; unitType?: RulesEditionUnitType; onToggle: (ids: string[]) => void; onBack: () => void }): JSX.Element`

Content, in order:
- a "← Back to list" button (focused on mount)
- the name as `h4`
- `Category: <label> · Source: <tag>`
- the full description
- `FutureWarsRulesReference` open (it renders nothing for the other rulesets)
- "Source: <title>" (linked when there is a `url`) and "Author: <author>" when there is one
- "Changes: <labels joined by ', '>"
- the lines "Cannot be used with: ..." (clashesWith + excludes), "Needs: ..." and "Needed by: ..." when non-empty
- the reason in red when blocked
- a Tick/Untick button (`Tick this ruleset` / `Untick this ruleset`), disabled under the same rule as the row's checkbox

`SpecialRulesetsStep` holds `detailId`. While it is set, the list stays mounted inside a `hidden` wrapper, so filters and group state survive. Before switching, store the `.modal-body`'s `scrollTop` (find it with `button.closest(".modal-body")`). On Back, restore it in a `useLayoutEffect` and focus the row's More info button. Closing the modal clears `detailId`.

- [ ] **Step 1: Write failing tests:**
  - `it("opens More info in the same window and comes back to the same list")`: type "Barents", click "More info: Future Wars: Morale". The window shows "Author: Herb Barents" and the morale table titles (`getFutureWarsPlayRules("fw-morale")!.tables[0].title`), and no checkbox list is visible (`hidden`). Click "← Back to list": the search box still holds "Barents" and focus is on that More info button.
  - `it("ticks and unticks from More info, refusing what the list refuses")`: Power Armor ticked, open Flint #11. The Tick button is disabled and the text contains "Clashes with Future Wars: Power Armor".
  - `it("lists what a ruleset cannot be used with")`: Power Armor's detail shows "Cannot be used with:" naming both Flint printings.
  - `it("reopens on the list after closing from More info")`.
  - In `future-wars-rules-reference.test.tsx`, replace the "folded under each play ruleset" test with `it("shows each play ruleset's tables open in More info")`.
- [ ] **Step 2: Run** both files. Expected: FAIL.
- [ ] **Step 3: Implement** `RulesetDetail` and the view switch.
- [ ] **Step 4: Run** both files. Expected: PASS.
- [ ] **Step 5: Commit** `Special Rulesets: More info view with tables, source, author and relations (#324)`.

### Task 6: Check, play, ship

**Files:**
- Modify: `src/ui/pages/home.tsx` (the "November 17th, 2026" entry, or a new dated entry if the date has moved on; home.test allows one entry a date)
- Modify: `JBTToolsSupportFiles/handoff.md`

- [ ] **Step 1:** Run `npm run check`. Expected: typecheck, lint (no new warnings in touched files), unit, data and build all pass.
- [ ] **Step 2:** In Chromium (Playwright), on the 'Mech Creator step 1 and on the MUL search:
  - open the window and tick Power Armor; Flint's two rulesets grey out with the reason
  - search "’mech", then "Show ticked only", then Clear filters
  - open More info on Morale, scroll the list first, go back: the scroll and the search are kept
  - check phone width (375 px): no horizontal scroll in the modal
  - no console errors
  Screenshot each.
- [ ] **Step 3:** News: one bullet, "The Special Rulesets window is now a grouped checklist with search, filters and a More info page for each ruleset; a greyed-out ruleset says why." Run `npx vitest run --project unit src/ui/pages/home.test.tsx`. Expected: PASS.
- [ ] **Step 4:** Commit `Special Rulesets window: news (#324)`. Then, under the standing permission: fast-forward beta, push, `git deploy-beta`, remove the worktree and branch.
- [ ] **Step 5:** Handoff: state, commits, and the next item (Power Armor Chunk D, which brings the Alpha Strike proposal to the owner first). Note for later chunks: a new ruleset sets `summary`, `category`, `source.publication/tag/author`, `changes` (add its label to `CHANGE_LABELS`), and `excludes` / `requires` where needed. DropShips use `changes: ["dropshipConstruction"]`, Economics `["economics"]`, and the COIL alternates `["coilRules"]` (the default COIL rules stay on the equipment; an alternate's detail view says "Replaces our COIL rules").
