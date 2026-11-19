# Shared Game Settings, Round 1 (data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pure data and logic for the shared settings block (#324). This round adds the Special Rulesets registry with the
sample "no Clans" alternate universe, the settings type, the options each step offers, the downward reset that
reports what moved, and the conflict check. There is no UI yet.

**Architecture:** Two new data modules sit beside the existing `rules-editions.ts` and `era-options.ts` and reuse them.
`special-rulesets.ts` holds the ruleset records and the conflict check. `game-settings.ts` holds the settings type, the
per-step option lists, and the change function. Everything is pure functions over plain objects, so rounds 2-4 can
use them from any builder or roster.

**Tech Stack:** TypeScript, Vitest (`--project unit`).

**Spec:** `docs/superpowers/specs/2026-10-26-shared-game-settings-design.md`

## Global Constraints

- Step order: Special Rulesets → Edition → Rules Level → Tech Base → Era. A change resets only later steps.
- Special Rulesets default: none ticked ("No").
- Clan and Mixed tech start at Clan Founding Years, and there is no Clan in the Star League. The existing
  `era-options.ts` data already enforces this. Do not change that data.
- Sample ruleset: id `sample-no-clans`, name "Sample: The Clans never existed (alternate universe)". It removes the
  tech bases `clan`, `mclan` and `mis`, has `changes: ["techBases"]`, and sets no edition or rules-level limit.
- Loading never changes a value. Only `changeGameSetting` moves values.
- Tech base tags are the existing ones: `is`, `clan`, `mis`, `mclan`.

## Review Focus

1. A stored value the lists no longer offer, such as an old save with a Clan tech base while the no-Clans ruleset is
   ticked. Reading the options must leave it alone. Only an edit moves it. Pinned in Task 2.
2. Unticking a ruleset must not move anything that is still valid. Pinned in Task 2.
3. An edition marked `noEras`: the era list is empty, and the stored era is kept, not reset. Pinned in Task 2.
4. Ticking a ruleset that conflicts with one already ticked: the change is refused, with the clashing ruleset named.
   Pinned in Tasks 1 and 2.
5. A chain of resets, for example a tech base change that also moves the era: every move is reported, in step order.
   Pinned in Task 2.

---

### Task 1: Special Rulesets registry and conflict check

**Files:**
- Create: `src/data/special-rulesets.ts`
- Test: `src/data/special-rulesets.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GameSettingStep = "edition" | "rulesLevel" | "techBase" | "era";
  export interface ISpecialRuleset {
      id: string; name: string; description: string;
      source: { title: string; url?: string };
      minEdition?: string;            // edition tag; earlier editions are not offered
      minRulesLevel?: number;
      removesTechBases?: string[];
      removesEras?: string[];         // era tags
      changes: string[];              // what it changes; overlapping lists conflict
  }
  export const btSpecialRulesets: ISpecialRuleset[];
  export function getSpecialRulesets(): ISpecialRuleset[];
  export function findSpecialRuleset(id: string): ISpecialRuleset | undefined;
  /** The ticked ruleset that clashes with `candidateId` (shares a `changes` entry), or undefined. */
  export function getRulesetConflict(tickedIds: string[], candidateId: string): ISpecialRuleset | undefined;
  ```

- [ ] **Step 1: Write the failing tests** in `special-rulesets.test.ts`:
  - `"ships the sample no-Clans universe"`: `findSpecialRuleset("sample-no-clans")` has the name above,
    `removesTechBases` equal to `["clan", "mclan", "mis"]`, and `changes` equal to `["techBases"]`.
  - `"finds a clash on a shared change, and none with itself or unrelated rulesets"`: push a temporary record
    `{ id: "test-heat", changes: ["heat"], ... }` and one `{ id: "test-techs", changes: ["techBases"], ... }` onto
    `btSpecialRulesets`, and remove both in `afterEach`. Then
    `getRulesetConflict(["sample-no-clans"], "test-techs")?.id` is `"sample-no-clans"`,
    `getRulesetConflict(["sample-no-clans"], "test-heat")` is `undefined`, and
    `getRulesetConflict(["sample-no-clans"], "sample-no-clans")` is `undefined`.
- [ ] **Step 2:** Run `npx vitest run --project unit src/data/special-rulesets.test.ts`. Expected: FAIL (the module
  is missing).
- [ ] **Step 3:** Implement the module. Copy the repo's data-file disclaimer header from `era-options.ts`. The sample
  description is: "A sample alternate universe in which the Clans never formed: no Clan or Mixed tech. A placeholder
  until real rulesets are added." The source is `{ title: "Sample ruleset (#324)" }`.
- [ ] **Step 4:** Run the test again. Expected: PASS.
- [ ] **Step 5:** Commit: `Special Rulesets registry with the sample no-Clans universe (#324 round 1)`.

### Task 2: Settings type, per-step options and the downward reset

**Files:**
- Modify: `src/data/era-options.ts`. Export `fitTechToBases(techTag: string, bases: string[]): string`, using the
  existing `TECH_FALLBACKS` order, and make `fitTechToEra` call it with `era.techBases`. Behaviour is unchanged.
- Create: `src/data/game-settings.ts`
- Test: `src/data/game-settings.test.ts`

**Interfaces:**
- Consumes: Task 1's `GameSettingStep`, `findSpecialRuleset` and `getRulesetConflict`. Also
  `getSelectableRulesEditions`, `getRulesEdition` (`.noEras`), `getRulesLevelOptionsForEdition` and `btRulesEditions`
  (the array order is chronological) from `rules-editions.ts`, and `getErasForTech`, `getClosestEraForTech`,
  `findEraByTag` and `fitTechToBases` from `era-options.ts`.
- Produces:
  ```ts
  export interface IGameSettings { rulesets: string[]; edition: string; rulesLevel: number; techBase: string; era: string; }
  export interface IGameSettingOptions {
      editions: IRulesEdition[]; rulesLevels: IRulesLevelOption[]; techBases: string[]; eras: IEras[]; // eras [] when the edition has noEras
  }
  export interface IGameSettingMove { step: GameSettingStep; from: string | number; to: string | number; }
  export function getGameSettingOptions(settings: IGameSettings, unitType: RulesEditionUnitType): IGameSettingOptions;
  export type GameSettingChange =
      | { step: "rulesets"; toggle: string }
      | { step: GameSettingStep; value: string | number };
  export function changeGameSetting(settings: IGameSettings, change: GameSettingChange, unitType: RulesEditionUnitType):
      { settings: IGameSettings; moves: IGameSettingMove[]; refused?: ISpecialRuleset };
  /** "Era moved to Clan Invasion", "Tech Base moved to Inner Sphere", using the edition, level and era names. */
  export function describeGameSettingMove(move: IGameSettingMove): string;
  ```

Behaviour that the signatures leave open:
- Options: the editions are `getSelectableRulesEditions(unitType)`, minus any edition earlier than the latest
  `minEdition` among the ticked rulesets. The rules levels are `getRulesLevelOptionsForEdition(edition)`, minus any
  level below the highest `minRulesLevel`. The tech bases are `["is", "clan", "mis", "mclan"]`, minus every ticked
  `removesTechBases`. The eras are `getErasForTech(techBase)`, minus every ticked `removesEras`, or `[]` when the
  edition has `noEras`.
- `changeGameSetting` returns a new object and never mutates its input. Toggling a ruleset that has a conflict
  returns the input unchanged, with `refused` set to the clashing ruleset. After the change, each later step is
  checked in order against its new options. If its value is not offered, it moves:
  - Edition: to the first offered edition.
  - Rules level: to the first offered level at or above the current one, else the last offered level.
  - Tech base: to `fitTechToBases(current, offered)`.
  - Era: to `getClosestEraForTech(era, techBase)`. If a ruleset removes that era, it moves instead to the offered era
    nearest by `yearStart`.

  The era step is skipped when its list is empty (`noEras`). Each move is pushed to `moves` in step order.

- [ ] **Step 1: Write the failing tests** in `game-settings.test.ts`, starting from
  `base = { rulesets: [], edition: DEFAULT_RULES_EDITION, rulesLevel: 1, techBase: "clan", era: "clan-invasion" }`
  (look up the real Clan Invasion era tag in `era-options.ts`):
  - `"offers no Clan or Mixed tech once the no-Clans universe is ticked, and moves the tech base and era down"`:
    toggling `sample-no-clans` gives `settings.techBase` equal to `"is"` and `moves.map(m => m.step)` equal to
    `["techBase"]` (the era stays because Clan Invasion is open to IS). `getGameSettingOptions(...).techBases` equals
    `["is"]`.
  - `"never moves a step above the one changed"`: changing `techBase` to `"is"` leaves `edition` and `rulesLevel`
    as they were.
  - `"reports a chain of moves in step order"`: start at `{ techBase: "is", era: "star-league" }` (the real tag),
    change `techBase` to `"clan"`, and expect `moves` to equal
    `[{ step: "era", from: "star-league", to: <the Clan era the closest-era rule picks> }]`. Then
    `describeGameSettingMove(moves[0])` starts with `"Era moved to "`.
  - `"leaves a stored value alone until an edit"`: with `{ ...base, rulesets: ["sample-no-clans"] }`, calling
    `getGameSettingOptions` leaves `techBase` as `"clan"`. Deep-equal it before and after.
  - `"unticking a ruleset moves nothing still valid"`: toggle `sample-no-clans` on, then off. The second result's
    `moves` is `[]`.
  - `"hides eras under an edition without them and keeps the stored era"`: pick an edition with `noEras: true` from
    `btRulesEditions` that the unit type `"mech"` can select. Changing `edition` to it gives `eras` equal to `[]`, the
    era unchanged, and no `"era"` move.
  - `"refuses a ruleset that clashes with one already ticked"`: with a temporary `test-techs` record (as in Task 1),
    toggling it on top of `sample-no-clans` returns `refused?.id === "sample-no-clans"` and settings equal to the
    input.
  - Keep the existing `era-options` tests green. They pin `fitTechToEra`.
- [ ] **Step 2:** Run `npx vitest run --project unit src/data/game-settings.test.ts`. Expected: FAIL (the module is
  missing).
- [ ] **Step 3:** Add `fitTechToBases` to `era-options.ts`, then implement `game-settings.ts` with the disclaimer
  header and the behaviour above. Tech base labels for `describeGameSettingMove` come from the existing tech options
  data (grep `tech-options.ts` for the tag-to-name list).
- [ ] **Step 4:** Run `npx vitest run --project unit src/data/game-settings.test.ts src/data/era-options*.test.ts`.
  Expected: PASS.
- [ ] **Step 5:** Run the full checks: `npx vitest run --project unit --reporter=dot`, `npx tsc --noEmit -p .`, then
  `npx eslint` on the changed files. Expected: all green.
- [ ] **Step 6:** Commit: `Shared game settings: options per step, downward reset with moves reported (#324 round 1)`.

### Ship (standing practice, memory small-rounds)

- [ ] `git push origin beta`. Skip `git deploy-beta`, since this round has no user-visible change.
- [ ] Comment on #324 that round 1 (data) is done and link the spec. Leave the issue open (memory
  ideas-open-until-content).
- [ ] Stop and report. Round 2 (the shared component and the rulesets window in the 'Mech builder) gets its own plan.
