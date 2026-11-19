# Shared game settings, round 2: the block in the 'Mech builder (#324) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One shared `GameSettingsBlock` (Special Rulesets, Edition, Rules Level, Tech Base, Era) with the Special Rulesets pop-up, wired into the 'Mech builder's step 1 in place of its own edition, level, era and tech controls, with the settings stored on each 'Mech design.

**Architecture:** Round 1's resolver (`src/data/game-settings.ts`) already gives the options per step and the downward reset. This round adds the edition's tech bases and a stale-value check to it, gives `BattleMech` its own rules level and rulesets (falling back to the app-wide `mechRulesFilter` for old saves and new designs), builds one presentational component that every builder will reuse in round 3, and switches every 'Mech builder read of `appSettings.mechRulesFilter` to the design's level.

**Tech Stack:** React 19 + TypeScript, react-bootstrap `Modal` through `StandardModal`, Vitest (+ happy-dom, Testing Library), Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-10-26-shared-game-settings-design.md` (calls 1-11). Round 1 plan: `docs/superpowers/plans/2026-10-26-shared-game-settings-round-1.md`.

## Global Constraints

- Order on the page: Special Rulesets, Edition, Rules Level, Tech Base, Era. A change never moves a step above the one edited.
- Special Rulesets: yes/no, default **No**, with the description "Optional and homebrew rules that change how the game plays or how units are built. Leave this off for standard BattleTech." Yes opens the pop-up; a "Choose rulesets" button beside it reopens it.
- The pop-up reuses `StandardModal`. A ruleset that clashes with a ticked one is disabled and names the ruleset it clashes with.
- Moves are reported in one line under the block, built from `describeGameSettingMove` (e.g. "Era moved to Clan Invasion"), joined with "; ".
- A stored value the lists no longer offer is kept and shown, with the warning "not offered under the ticked rulesets" (call 9). Loading a design never changes a value (call 2).
- Editions marked `noEras` hide the Era step (call 6).
- Select labels stay "Rules Edition:", "Rules Level:", "Technology Base:", "Era:" so existing e2e locators keep working.
- No new per-builder selectors; round 3 plugs the same component into the other eight builders (memory: reuse shared components).

## Builder's calls (record in the spec under "Calls made by the designer", round 2)

12. Editing the rules level in the block sets the design's level **and** the app-wide `mechRulesFilter`, so the last level used is the default for the next new design and for the roster searches (call 1).
13. The block shows the rules level through `getShownRulesLevel` as today and never flags it; only Edition, Tech Base and Era carry the call-9 warning.
14. The edition decides the tech bases offered (`getEditionTechBases`, moved out of `BattleMech.getAvailableTechOptions`), so Battledroids still offers Inner Sphere only.

## Review Focus

1. An old save (no `rulesLevel`, no `rulesets`) loads and shows the app-wide level, and loading writes nothing: pinned in Task 2.
2. Switching to Battledroids and back still restores the design exactly (the edition return path re-imports the old save, which must not wipe the new level or rulesets): pinned in Task 2.
3. Ticking the no-Clans ruleset on a Clan 'Mech moves Tech Base to Inner Sphere and its era down, with the notice: pinned in Task 3.
4. Choosing "No" clears every ticked ruleset and widens the lists again with no moves: pinned in Task 3.
5. A Battledroids printed droid's lock note and "Edit this droid" follow the design's level, not the app-wide one: pinned in Task 4.

---

### Task 1: Edition tech bases and stale steps in the resolver

**Files:**
- Modify: `src/data/game-settings.ts`
- Modify: `src/classes/battlemech.ts:6196-6211` (`getAvailableTechOptions` delegates)
- Test: `src/data/game-settings.test.ts`

**Interfaces:**
- Produces: `getEditionTechBases(editionTag: string): string[]` (tech option tags, `btTechOptions` order); `getStaleGameSettingSteps(settings: IGameSettings, unitType: RulesEditionUnitType): GameSettingStep[]` (subset of `"edition" | "techBase" | "era"`, in step order).

- [ ] **Step 1: Write the failing tests** in the existing `describe`:

```ts
it("offers only the edition's own tech bases", () => {
    expect(getEditionTechBases(DEFAULT_RULES_EDITION)).toEqual(btTechOptions.map((option) => option.tag));
    expect(getEditionTechBases("battledroids")).toEqual(["is"]);
    expect(getGameSettingOptions({ ...base, edition: "battledroids" }, "mech").techBases).toEqual(["is"]);
});

it("flags a stored tech base the ticked rulesets no longer offer, and nothing else", () => {
    const stale = { ...base, rulesets: ["sample-no-clans"] };
    expect(getStaleGameSettingSteps(stale, "mech")).toEqual(["techBase"]);
    expect(getStaleGameSettingSteps(base, "mech")).toEqual([]);
});
```

Check the Battledroids edition tag in `src/data/rules-editions.ts` first and use it.

- [ ] **Step 2: Run** `npx vitest run --project unit src/data/game-settings.test.ts` — expected FAIL (not exported).
- [ ] **Step 3: Implement.** Move the body of `BattleMech.getAvailableTechOptions` (the `isEarlierRulesEdition` / Clan catalog / `mixedTech` test) into `getEditionTechBases`, returning tags; `getAvailableTechOptions` becomes `btTechOptions.filter((option) => getEditionTechBases(this._rulesEdition).includes(option.tag))`, keeping its doc comment on the new function. `getGameSettingOptions` filters `techBases` by it as well as by the rulesets. `getStaleGameSettingSteps` reports a step whose stored value is not in its list (Era only when the list is not empty).
- [ ] **Step 4: Run** the same file, then `npx vitest run --project unit src/classes` — expected PASS.
- [ ] **Step 5: Commit** "Shared game settings: edition tech bases and stale steps in the resolver (#324 round 2)".

### Task 2: Per-design rules level and rulesets on BattleMech

**Files:**
- Modify: `src/classes/battlemech.ts` (fields near line 438, `IBattleMechExport` near 278, `reset`, `export` near 8185, `importJSON` near 8529)
- Test: `src/classes/battlemech-game-settings.test.ts` (create)

**Interfaces:**
- Consumes: `IGameSettings` from `src/data/game-settings.ts`.
- Produces on `BattleMech`: `getRulesLevel(fallback: number): number`; `getRulesets(): string[]`; `getGameSettings(fallbackLevel: number): IGameSettings`; `applyGameSettings(settings: IGameSettings): void`. Export fields `rulesLevel?: number`, `rulesets?: string[]` (omitted when unset or empty).

- [ ] **Step 1: Write the failing tests:**

```ts
it("an old save has no level of its own: it shows the app-wide one and loading writes nothing", () => {
    const mech = new BattleMech(JSON.stringify(new BattleMech().export()));
    expect(mech.getRulesLevel(3)).toBe(3);
    expect(mech.export().rulesLevel).toBeUndefined();
    expect(mech.export().rulesets).toBeUndefined();
});

it("keeps its level and rulesets through a save", () => {
    const mech = new BattleMech();
    mech.applyGameSettings({ ...mech.getGameSettings(2), rulesLevel: 4, rulesets: ["sample-no-clans"] });
    const loaded = new BattleMech(JSON.stringify(mech.export()));
    expect(loaded.getRulesLevel(2)).toBe(4);
    expect(loaded.getRulesets()).toEqual(["sample-no-clans"]);
});

it("applies edition, tech base and era in that order", () => {
    const mech = new BattleMech();
    mech.applyGameSettings({ ...mech.getGameSettings(2), techBase: "clan", era: "clan-inv" });
    expect(mech.getTech().tag).toBe("clan");
    expect(mech.getEra().tag).toBe("clan-inv");
});

it("a switch to Battledroids and back restores the design and keeps the new level", () => {
    const mech = new BattleMech();
    const before = JSON.stringify({ ...mech.export(), rulesLevel: undefined });
    mech.applyGameSettings({ ...mech.getGameSettings(2), edition: "<battledroids tag>", rulesLevel: 0 });
    mech.applyGameSettings({ ...mech.getGameSettings(2), edition: DEFAULT_RULES_EDITION, rulesLevel: 1 });
    expect(mech.getRulesLevel(2)).toBe(1);
    expect(JSON.stringify({ ...mech.export(), rulesLevel: undefined })).toBe(before);
});
```

Use real Battledroids rules level ids from `getRulesLevelOptionsForEdition`.

- [ ] **Step 2: Run** `npx vitest run --project unit src/classes/battlemech-game-settings.test.ts` — expected FAIL.
- [ ] **Step 3: Implement.** `_rulesLevel: number | undefined` and `_rulesets: string[]`, cleared in `reset`. `applyGameSettings` calls `setRulesEdition` (when it differs), then `setTech`, then `setEra` (each only when it differs), and sets level and rulesets **last**, because the edition return path re-imports the old save. `getGameSettings` reads the five values, the level through `getRulesLevel(fallbackLevel)`.
- [ ] **Step 4: Run** the new file and `npx vitest run --project unit src/classes` — expected PASS.
- [ ] **Step 5: Commit** "BattleMech keeps its own rules level and rulesets (#324 round 2)".

### Task 3: GameSettingsBlock and the Special Rulesets window

**Files:**
- Create: `src/ui/components/game-settings-block.tsx`
- Modify: `src/ui/components/rules-edition-select.tsx` (optional `editions?: IRulesEdition[]` prop, default `getSelectableRulesEditions(unitType)`), `src/ui/components/rules-level-select.tsx` (optional `options?: IRulesLevelOption[]`, default `getRulesLevelOptionsForEdition(editionTag)`)
- Test: `src/ui/components/game-settings-block.test.tsx` (create; `// @vitest-environment happy-dom`, as `available-equipment.test.tsx`)

**Interfaces:**
- Consumes: `getGameSettingOptions`, `changeGameSetting`, `describeGameSettingMove`, `getStaleGameSettingSteps` (Task 1); `getSpecialRulesets`, `getRulesetConflict`.
- Produces: `export default function GameSettingsBlock(props: { unitType: RulesEditionUnitType; settings: IGameSettings; onChange: (settings: IGameSettings) => void }): JSX.Element`. The block runs `changeGameSetting` itself, passes the result's settings up, and keeps the last moves (or a refusal) in its own state for the notice line. The parent passes the design's settings back in.

- [ ] **Step 1: Write the failing tests** (render with a `useState` wrapper so changes flow back in):
  - `"shows the steps in order: Special Rulesets, Rules Edition, Rules Level, Technology Base, Era"` — label order from `screen.getAllByText` positions or `container.textContent.indexOf`.
  - `"Special Rulesets defaults to No and Yes opens the window"` — select value `"no"`; choose `"yes"` → dialog titled "Special Rulesets" with a checkbox "Sample: The Clans never existed (alternate universe)" and its description.
  - `"ticking the no-Clans universe on a Clan design moves Tech Base and reports it"` — start `{ techBase: "clan", era: "clan-inv" }`; tick; expect `Technology Base:` options to be `["Inner Sphere"]` and text `/Technology Base moved to Inner Sphere/`.
  - `"No clears the rulesets with no moves"` — start ticked; choose `"no"`; `onChange` last called with `rulesets: []`; no "moved" text.
  - `"a clashing ruleset is disabled and names the one it clashes with"` — push a test ruleset `changes: ["techBases"]` into `btSpecialRulesets` (remove in `afterEach`, as round 1's test does); with the sample ticked its checkbox is disabled and the text contains `Clashes with Sample: The Clans never existed`.
  - `"a stored value the lists do not offer is kept and flagged"` — `{ rulesets: ["sample-no-clans"], techBase: "clan" }`: select value stays `clan`, text `/not offered under the ticked rulesets/`.
  - `"an edition without eras hides the Era step"` — Battledroids edition: no `Era:` label.
- [ ] **Step 2: Run** `npx vitest run --project unit src/ui/components/game-settings-block.test.tsx` — expected FAIL.
- [ ] **Step 3: Implement.** A Yes/No select labelled "Special Rulesets:" with the description beside it; Yes shows while the window is open or any ruleset is ticked; No toggles each ticked ruleset off. "Choose rulesets" button when Yes. `StandardModal` with `show`, `title="Special Rulesets"`, `onClose`, a large `className`; one `InputCheckbox` (or plain checkbox with label) per ruleset with its description and source title. Edition and level through the extended `RulesEditionSelect` / `RulesLevelSelect`; tech and era as plain selects; a stale stored value is added as its own option and the warning shown under the select. Era description under the era select, as step 1 shows it today.
- [ ] **Step 4: Run** the test file, then `npx eslint src/ui/components/game-settings-block.tsx src/ui/components/rules-edition-select.tsx src/ui/components/rules-level-select.tsx` — expected PASS, clean.
- [ ] **Step 5: Commit** "GameSettingsBlock and the Special Rulesets window (#324 round 2)".

### Task 4: Wire the block into the 'Mech builder

**Files:**
- Modify: `src/ui/pages/classic-battletech/mech-creator/step1.tsx` (replace lines 266-287 and 349-366; handlers `updateTech`, `updateRulesLevel`, `updateRulesEdition`, `updateEra` become one `updateGameSettings`)
- Modify: `src/ui/components/design-lock.tsx` (new `mechRulesLevel`; `confirmEditPrintedDroid` raises the design's level)
- Modify: every `appSettings.mechRulesFilter` read in `src/ui/pages/classic-battletech/mech-creator/` (`step1`-`step5`, `summary`)
- Modify, if the 'Mech summary's print guard reads the global level: `src/ui/components/printable-page.tsx` (optional `rulesLevel` prop, default the global)
- Test: `src/ui/components/design-lock.test.tsx` (create), e2e specs that touch step 1

**Interfaces:**
- Consumes: Task 2's `BattleMech` methods, Task 3's `GameSettingsBlock`.
- Produces: `export function mechRulesLevel(appGlobals: IAppGlobals): number` in `design-lock.tsx` — `currentBattleMech?.getRulesLevel(appSettings.mechRulesFilter) ?? appSettings.mechRulesFilter`.

- [ ] **Step 1: Write the failing test** `design-lock.test.tsx`: an unmodified printed droid at the design's Battledroids play level (app-wide level at the construction level) gets a lock note; after `window.confirm` is stubbed true, `confirmEditPrintedDroid` raises the **design's** level to the construction level and `getDesignLockNote` returns null.
- [ ] **Step 2: Run** it — expected FAIL.
- [ ] **Step 3: Implement.** `mechRulesLevel` and the design-lock changes; replace each mech-creator `appSettings.mechRulesFilter` read with `mechRulesLevel(this.props.appGlobals)`. In step 1, `updateGameSettings(settings)`: `applyGameSettings`, clamp tonnage at the new level, `settleRulesEditionSwitch()`, set `appSettings.mechRulesFilter` when the level changed (call 12) and save both. Render `<GameSettingsBlock unitType="mech" settings={mech.getGameSettings(appSettings.mechRulesFilter)} onChange={this.updateGameSettings} />` first in the section; the edition notes, issues and droid picker stay below it. Remove the now-unused imports (`RulesEditionSelect`, `RulesLevelSelect`, `chooseEra`, `getEraChoices`, `getTechChoices`, `EditionChoice` if unused).
- [ ] **Step 4: Run** the new test, `npx vitest run --project unit`, `npx tsc --noEmit -p .`, `npx eslint` on the changed files — expected PASS, clean.
- [ ] **Step 5: e2e.** `grep -rln "Mech Era" e2e` and update to `Era:`; kill any stale `vite preview` on 4173, then `npx playwright test e2e/mech-rules-edition.spec.ts e2e/mech-tro.spec.ts e2e/battledroids-roster.spec.ts e2e/mech-frankenmech.spec.ts e2e/mech-primitive.spec.ts e2e/fractional-accounting.spec.ts e2e/artvee.spec.ts e2e/unit-rules-edition.spec.ts` — expected PASS. Fix locators that relied on the old order.
- [ ] **Step 6: Commit** "'Mech builder: the shared game settings block replaces its own edition, level, tech and era controls (#324 round 2)".

### Task 5: Ship

- [ ] Record calls 12-14 in the spec; tick round 2 there.
- [ ] Final review of the branch diff (superpowers:requesting-code-review); fix every finding, minors included, test-first.
- [ ] Commit, `git push origin beta`, `git deploy-beta`; fast-forward `master` in `C:/repo/battletech-tools` and push; progress comment on #324 (`-R ngcfells/battletech-tools`) — round 2 done, round 3 next.
- [ ] Update memory `shared-game-settings.md` and the handoff for round 3, then stop.
