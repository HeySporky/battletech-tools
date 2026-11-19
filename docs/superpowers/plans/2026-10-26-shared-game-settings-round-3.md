# Shared game settings, round 3: the other eight Classic builders (#324) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Vehicle, Fighter, Small Craft, Capital Ship, Battle Armor, ProtoMech, Infantry and Building builders use the shared `GameSettingsBlock` as their first step, each design keeps its own rules level and rulesets, every builder read of `appSettings.mechRulesFilter` follows the design, and the old per-builder edition, level, tech and era controls are deleted.

**Architecture:** One shared store (`UnitGameSettings`) and one adapter pair (`getUnitGameSettings` / `applyUnitGameSettings`) serve all eight classes, instead of eight copies of BattleMech's round 2 code. One wrapper component (`UnitGameSettingsBlock`) does the block-to-design wiring and the call-12 default for every builder; each builder only saves its unit and does its own follow-up (vehicle tonnage clamp). The resolver learns each unit type's own tech bases and earliest era, so call 6 (hide steps a type lacks) falls out of the option lists.

**Tech Stack:** React 19 + TypeScript, Vitest (+ happy-dom, Testing Library), Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-10-26-shared-game-settings-design.md` (calls 1-15). Round 2 plan: `docs/superpowers/plans/2026-10-26-shared-game-settings-round-2.md`.

## Global Constraints

- Order on the page: Special Rulesets, Edition, Rules Level, Tech Base, Era, first in each builder's step 1. A change never moves a step above the one edited.
- Loading a design never changes a value; an old save (no `rulesLevel`, no `rulesets`) shows the app-wide `mechRulesFilter` and exports neither field (calls 1-2).
- Picking a rules level sets the design's level **and** `appSettings.mechRulesFilter` (call 12); a level the block fitted does not touch the app-wide one.
- Select labels stay "Rules Edition:", "Rules Level:", "Technology Base:", "Era:". The old "Vehicle Era:" label and the `ba-era`, `ba-tech-base`, `pm-era` test ids go; e2e specs move to the block's labels.
- No new per-builder selectors (memory: reuse shared components). Roster MUL searches and Alpha Strike are round 4; leave `roster/` and `alpha-strike/` reads of `mechRulesFilter` alone.

## Builder's calls (record in the spec under "Calls made by the designer", round 3)

16. **Each unit type has its own tech bases and earliest era.** Battle Armor and Infantry build Inner Sphere or Clan; a ProtoMech is Clan only, from the eras that reach 3055 (as `ProtoMech.getAvailableEras` does today). The resolver filters by these, so a step with one choice is hidden (call 6) and ProtoMech shows no Tech Base step.
17. **Battle Armor's Mixed technology stays a construction option** below the block (its own Advanced gate, TO:AUE p.189), not a fifth tech base: the suit's tech base is its chassis's. An era change still turns Mixed off in an era without it, as `chooseEraByTechBase` does today.
18. **A removed single tech base is flagged, not moved.** Under the no-Clans ruleset a ProtoMech has no tech base on offer: the step appears with the call-9 warning and the design keeps "Clan" until the ruleset is unticked.
19. **A sample loaded in place of the design keeps the design's level and rulesets** (ArtVee samples), as call 12 does for printed droids.

## Review Focus

1. An old save of each of the eight types loads with the app-wide level and exports no `rulesLevel`/`rulesets`: pinned in Task 2 (table test).
2. A Mixed-tech Battle Armor moved to an era without Mixed Tech loses Mixed, and its Tech Base step offers only Inner Sphere and Clan: pinned in Task 2 and Task 1.
3. A ProtoMech with the no-Clans ruleset ticked keeps "Clan", shows the warning, and its era list still starts at 3055: pinned in Task 1 and Task 3.
4. A vehicle's level change still clamps tonnage at the **design's** level (support vehicle sizes): pinned in Task 4.
5. Later builder pages (equipment, armor, summary print guard) follow the design's level when it differs from the app-wide one: pinned by Task 3's `unitRulesLevel` test plus the grep gate in Tasks 4-6.

---

### Task 1: Unit-type tech bases and earliest era in the resolver

**Files:**
- Modify: `src/data/game-settings.ts` (`getGameSettingOptions`)
- Modify: `src/classes/protomech.ts:789` (`getAvailableEras` delegates)
- Test: `src/data/game-settings.test.ts`

**Interfaces:**
- Produces: `getUnitTypeTechBases(unitType: RulesEditionUnitType): string[] | undefined` (undefined = no limit) and `getUnitTypeEras(unitType: RulesEditionUnitType, techTag: string): IEras[]` (= `getErasForTech(techTag)` minus eras ending before the type's first year). Data: `{ "battle-armor": ["is", "clan"], infantry: ["is", "clan"], protomech: ["clan"] }`; first year `{ protomech: 3055 }`.

- [ ] **Step 1: Write the failing tests** in the existing `describe`:

```ts
it("offers a unit type only its own tech bases", () => {
    const settings = { ...base, techBase: "is" };
    expect(getGameSettingOptions(settings, "battle-armor").techBases).toEqual(["is", "clan"]);
    expect(getGameSettingOptions(settings, "infantry").techBases).toEqual(["is", "clan"]);
    expect(getGameSettingOptions({ ...base, techBase: "clan" }, "protomech").techBases).toEqual(["clan"]);
    expect(getGameSettingOptions(settings, "vehicle").techBases).toEqual(btTechOptions.map((option) => option.tag));
});

it("a ProtoMech's eras start in 3055 and the no-Clans universe flags its tech base without moving it", () => {
    const proto = { ...base, techBase: "clan", era: getUnitTypeEras("protomech", "clan")[0].tag };
    expect(getGameSettingOptions(proto, "protomech").eras.every((era) => (era.yearEnd ?? Infinity) >= 3055)).toBe(true);
    const result = changeGameSetting(proto, { step: "rulesets", toggle: "sample-no-clans" }, "protomech");
    expect(result.settings.techBase).toBe("clan");
    expect(result.moves).toEqual([]);
    expect(getStaleGameSettingSteps(result.settings, "protomech")).toEqual(["techBase"]);
});
```

- [ ] **Step 2: Run** `npx vitest run --project unit src/data/game-settings.test.ts` — expected FAIL (not exported).
- [ ] **Step 3: Implement.** `getGameSettingOptions` intersects `techBases` with `getUnitTypeTechBases(unitType)` (when defined) and builds `eras` from `getUnitTypeEras(unitType, settings.techBase)`. `fitTechToBases` already returns the stored tag for an empty list, so call 18 needs no move code. `ProtoMech.getAvailableEras()` returns `getUnitTypeEras("protomech", "clan")`.
- [ ] **Step 4: Run** the same file and `npx vitest run --project unit src/classes/protomech` — expected PASS.
- [ ] **Step 5: Commit** "Shared game settings: each unit type's tech bases and earliest era (#324 round 3)".

### Task 2: One game settings store for the eight classes

**Files:**
- Create: `src/classes/unit-game-settings.ts`
- Modify: `src/classes/vehicle.ts`, `aerospace-fighter.ts`, `small-craft.ts`, `capital-ship.ts`, `battle-armor.ts`, `protomech.ts`, `infantry-platoon.ts`, `building.ts` (a field, two tech accessors, `chooseEra`, export and import)
- Test: `src/classes/unit-game-settings.test.ts` (create)

**Interfaces:**
- Consumes: `IGameSettings` (`src/data/game-settings.ts`); `chooseEra`, `chooseEraByTechBase` (`src/data/era-choice.ts`).
- Produces:
  - `class UnitGameSettings { getRulesLevel(fallback: number): number; getRulesets(): string[]; set(rulesLevel: number, rulesets: string[]): void; export(): { rulesLevel?: number; rulesets?: string[] }; import(raw: { rulesLevel?: unknown; rulesets?: unknown }): void }` — `export()` omits unset level and empty rulesets; `import` clears what the raw save lacks.
  - `interface IGameSettingsUnit { readonly gameSettings: UnitGameSettings; getRulesEdition(): string; setRulesEdition(tag: string): unknown; getTechTag(): string; setTechTag(tag: string): unknown; getEra(): { tag: string }; chooseEra(tag: string): void }`
  - `getUnitGameSettings(unit: IGameSettingsUnit, fallbackLevel: number): IGameSettings`
  - `applyUnitGameSettings(unit: IGameSettingsUnit, settings: IGameSettings): void` — edition, then tech, then era (each only when it differs), then level and rulesets.
  - `keepUnitGameSettings(from: IGameSettingsUnit | undefined | null, next: IGameSettingsUnit, fallbackLevel: number): void` (call 19).
  - Each class: `public readonly gameSettings = new UnitGameSettings()`; `getTechTag`/`setTechTag` = `getTech().tag`/`setTech` (vehicle, fighter, small craft, capital ship, building), `getTechBase()`/`setTechBase(tag === "clan" ? "clan" : "is")` (battle armor, infantry), `"clan"`/no-op (protomech); `chooseEra(tag)` = today's builder call: `chooseEra(this, tag)` (the five), `chooseEraByTechBase(this, tag)` (battle armor, infantry), `this.setEra(tag)` (protomech). Export spreads `...this.gameSettings.export()` next to `rulesEdition`; import calls `this.gameSettings.import(raw)`.

- [ ] **Step 1: Write the failing tests.** One `describe.each` over the eight classes, `{ name, make: (json?: string) => IGameSettingsUnit & { export(): Record<string, unknown> }, unitType }` (every one of the eight constructors takes the save as a JSON string, so `make = (json = "") => new Vehicle(json)` etc.):

```ts
it("an old save shows the app-wide level and exports no settings", () => {
    const unit = make(JSON.stringify(make().export()));
    expect(getUnitGameSettings(unit, 3).rulesLevel).toBe(3);
    expect(unit.export().rulesLevel).toBeUndefined();
    expect(unit.export().rulesets).toBeUndefined();
});

it("keeps its level and rulesets through a save", () => {
    const unit = make();
    applyUnitGameSettings(unit, { ...getUnitGameSettings(unit, 2), rulesLevel: 4, rulesets: ["sample-no-clans"] });
    const loaded = make(JSON.stringify(unit.export()));
    expect(getUnitGameSettings(loaded, 2)).toMatchObject({ rulesLevel: 4, rulesets: ["sample-no-clans"] });
});
```

  Plus, outside the table:
  - `"a vehicle applies tech base then era"` — `{ techBase: "clan", era: "clan-inv" }` → `getTech().tag === "clan"`, `getEra().tag === "clan-inv"`.
  - `"a Mixed-tech suit loses Mixed in an era without it"` — BattleArmor with `setMixedTech(true)` in an era offering Mixed; apply an Inner Sphere era without `mis` → `isMixedTech()` false, `getTechTag()` `"is"`.
  - `"keepUnitGameSettings carries the level and rulesets onto a loaded sample"` — from a vehicle at level 4 with the sample ruleset, onto a fresh vehicle → same level and rulesets.
- [ ] **Step 2: Run** `npx vitest run --project unit src/classes/unit-game-settings.test.ts` — expected FAIL.
- [ ] **Step 3: Implement** `unit-game-settings.ts` and the per-class members listed above.
- [ ] **Step 4: Run** the new file and `npx vitest run --project unit src/classes` — expected PASS (existing save round-trip tests must still match: the new fields are omitted when unset).
- [ ] **Step 5: Commit** "The eight Classic unit classes keep their own rules level and rulesets (#324 round 3)".

### Task 3: The block hides a one-choice tech base; the unit wrapper

**Files:**
- Modify: `src/ui/components/game-settings-block.tsx`
- Modify: `src/ui/pages/classic-battletech/mech-creator/step1.tsx` (`updateGameSettings` uses `rememberRulesLevel`)
- Test: `src/ui/components/game-settings-block.test.tsx`

**Interfaces:**
- Consumes: Task 1's options, Task 2's `IGameSettingsUnit`, `getUnitGameSettings`, `applyUnitGameSettings`.
- Produces (exported from `game-settings-block.tsx`):
  - `unitRulesLevel(unit: IGameSettingsUnit | undefined | null, appSettings: { mechRulesFilter: number }): number`
  - `rememberRulesLevel(appGlobals: IAppGlobals, settings: IGameSettings, step: GameSettingStep | "rulesets"): void` — call 12: on `step === "rulesLevel"` sets and saves `mechRulesFilter`.
  - `UnitGameSettingsBlock(props: { unitType: RulesEditionUnitType; unit: IGameSettingsUnit; appGlobals: IAppGlobals; onChange: (step: GameSettingStep | "rulesets") => void }): JSX.Element` — renders `GameSettingsBlock` with `getUnitGameSettings(unit, mechRulesFilter)`; on change runs `applyUnitGameSettings`, `rememberRulesLevel`, then `props.onChange(step)` (the builder clamps and saves).

- [ ] **Step 1: Write the failing tests:**
  - `"a ProtoMech has no Technology Base step"` — `unitType="protomech"`, `techBase: "clan"`: no `Technology Base:` text.
  - `"a ProtoMech under the no-Clans universe shows its tech base with the warning"` — rulesets ticked: `Technology Base:` present, text matches `/not offered under the ticked rulesets/`.
  - `"a suit offers Inner Sphere and Clan only"` — `unitType="battle-armor"`: tech options `["Inner Sphere", "Clan"]`.
  - `"unitRulesLevel prefers the design's own level"` — unit with `gameSettings.set(4, [])`, app-wide 2 → 4; `undefined` unit → 2; unit with no level → 2.
  - `"UnitGameSettingsBlock applies a picked level to the design and the app-wide default"` — stub `appGlobals` (`appSettings`, `saveAppSettings: vi.fn()`), a `Vehicle`; pick a level → unit level and `mechRulesFilter` both updated, `onChange` called with `"rulesLevel"`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/ui/components/game-settings-block.test.tsx` — expected FAIL.
- [ ] **Step 3: Implement.** The tech step's `EditionChoice` gets `hidden={options.techBases.length === 1 && !stale.includes("techBase")}`. Add the three exports. Mech step 1's call-12 lines become `rememberRulesLevel(this.props.appGlobals, settings, step)`.
- [ ] **Step 4: Run** the file, `npx vitest run --project unit src/ui/components`, `npx eslint` on the changed files — expected PASS, clean.
- [ ] **Step 5: Commit** "GameSettingsBlock: hide a one-choice tech base; UnitGameSettingsBlock for the other builders (#324 round 3)".

### Task 4: Vehicle builder

**Files:**
- Modify: `src/ui/pages/classic-battletech/vehicle-creator/step1.tsx` (lines 459-512 controls; `updateTech`, `updateEra`, `updateRulesLevel` go; `loadArtVeeSample` keeps settings)
- Modify: every `mechRulesFilter` read under `src/ui/pages/classic-battletech/vehicle-creator/` (`armor`, `summary`, `equipment-selection`, `_light-weapons`)
- Modify: e2e specs using "Vehicle Era" (`grep -rl "Vehicle Era" e2e`)
- Test: `src/ui/pages/classic-battletech/vehicle-creator/step1.test.tsx` (create, or extend an existing vehicle-creator test if one renders step 1)

**Interfaces:**
- Consumes: Task 3's `UnitGameSettingsBlock`, `unitRulesLevel`; Task 2's `keepUnitGameSettings`.

- [ ] **Step 1: Write the failing test** `"a level change clamps tonnage at the design's level, not the app-wide one"`: support vehicle at a tonnage only allowed above Standard, app-wide level high; pick Introductory in the block → tonnage clamped, `mechRulesFilter` now Introductory. And `"a sample ArtVee keeps the design's level and rulesets"` (call 19).
- [ ] **Step 2: Run** it — expected FAIL.
- [ ] **Step 3: Implement.** `<UnitGameSettingsBlock unitType="vehicle" unit={vehicle} appGlobals={...} onChange={() => { this.clampTonnage(vehicle, unitRulesLevel(vehicle, appSettings)); save }} />` first in the section; delete the edition, level, era and tech controls and handlers; `loadArtVeeSample` lists samples at the design's level and calls `keepUnitGameSettings` on the loaded vehicle; replace every vehicle-creator `appSettings.mechRulesFilter` read with `unitRulesLevel(this.props.appGlobals.currentVehicle, appSettings)`. Drop unused imports.
- [ ] **Step 4: Gate.** `grep -rn "mechRulesFilter" src/ui/pages/classic-battletech/vehicle-creator` shows only `unitRulesLevel(...)` arguments. Run the new test, `npx vitest run --project unit`, `npx tsc --noEmit -p .`, `npx eslint` on changed files — expected PASS, clean.
- [ ] **Step 5: e2e.** Replace "Vehicle Era" locators with the block's `Era:` label. Kill any stale `vite preview` on 4173, then `npx playwright test e2e/artvee.spec.ts e2e/fractional-accounting.spec.ts e2e/franken-vehicles-protos.spec.ts e2e/patchwork-armor-vehicles-fighters.spec.ts e2e/support-vehicle-categories.spec.ts e2e/unit-rules-edition.spec.ts e2e/robotic-control.spec.ts --project=chromium` — expected PASS. A "Loading..." timeout: rerun that spec serially before calling it a failure (AVG Web Shield, memory).
- [ ] **Step 6: Commit** "Vehicle builder: the shared game settings block (#324 round 3)".

### Task 5: Fighter, Small Craft and Capital Ship builders

**Files:**
- Modify: `fighter-creator/chassis.tsx`, `small-craft-creator/chassis.tsx`, `capital-ship-creator/chassis.tsx` (controls and `updateRulesLevel`; the capital ship's hand-made "Rules Level:" select over `getRulesLevelOptions()` goes too)
- Modify: every `mechRulesFilter` read under `fighter-creator/`, `small-craft-creator/`, `capital-ship-creator/` (status bars, `armor`, `crew`, `equipment`, `summary`)
- Modify: e2e specs that set these builders' era, tech or level (`e2e/fighter-creator.spec.ts`, `e2e/patchwork-armor-vehicles-fighters.spec.ts`, others found by grep)

**Interfaces:**
- Consumes: Task 3's `UnitGameSettingsBlock`, `unitRulesLevel`.

- [ ] **Step 1: Write the failing test** in an existing creator UI test (`src/ui/components/creator-tro-pages.test.tsx` renders creators; otherwise create `src/ui/pages/classic-battletech/aero-creators.test.tsx`): for each of the three, render step 1 and assert the label order "Special Rulesets:", "Rules Edition:", "Rules Level:", "Technology Base:", "Era:" and exactly one "Rules Level:" select.
- [ ] **Step 2: Run** it — expected FAIL.
- [ ] **Step 3: Implement.** Each builder renders `UnitGameSettingsBlock` first in step 1 with `onChange={() => save}`; delete the old controls and handlers; switch every read to `unitRulesLevel(current<Unit>, appSettings)`.
- [ ] **Step 4: Gate and run** as Task 4 Step 4, for the three folders.
- [ ] **Step 5: e2e** — fix locators, then `npx playwright test e2e/fighter-creator.spec.ts e2e/patchwork-armor-vehicles-fighters.spec.ts e2e/quirks-play.spec.ts e2e/unit-rules-edition.spec.ts --project=chromium` plus any other spec the grep found — expected PASS.
- [ ] **Step 6: Commit** "Fighter, Small Craft and Capital Ship builders: the shared game settings block (#324 round 3)".

### Task 6: Battle Armor, ProtoMech, Infantry and Building builders; delete the old helpers

**Files:**
- Modify: `battle-armor-creator/chassis.tsx` (Mixed checkbox stays, call 17), `protomech-creator/chassis.tsx`, `infantry-creator/platoon.tsx`, `building-creator/structure.tsx`
- Modify: every `mechRulesFilter` read under those four folders (`equipment`, `loadouts`, `summary`, `weapons`)
- Modify: `src/data/era-choice.ts` — delete `getEraChoices` / `getTechChoices` if no caller is left (`grep -rn` first; the BA Mixed gate may still use `getTechChoices`: keep what is used) and their tests
- Modify: e2e specs using `ba-era`, `ba-tech-base`, `pm-era` and these builders' level/era selects

**Interfaces:**
- Consumes: Task 3's `UnitGameSettingsBlock`, `unitRulesLevel`.

- [ ] **Step 1: Write the failing test** in the same file as Task 5's: the four builders show the block's labels in order; ProtoMech has no "Technology Base:"; Battle Armor's Tech Base offers Inner Sphere and Clan and still shows the Mixed technology checkbox at Advanced.
- [ ] **Step 2: Run** it — expected FAIL.
- [ ] **Step 3: Implement** as Task 5; then delete what has no caller left in `era-choice.ts`.
- [ ] **Step 4: Gate.** `grep -rn "mechRulesFilter" src/ui/pages/classic-battletech/*-creator` shows only `unitRulesLevel(...)` / `mechRulesLevel(...)` arguments; `grep -rln "RulesEditionSelect\|RulesLevelSelect" src/ui/pages` is empty. Run `npx vitest run --project unit`, `npx tsc --noEmit -p .`, `npx eslint` on changed files — expected PASS, clean.
- [ ] **Step 5: e2e** — replace the test-id locators with the block's labels; `npx playwright test e2e/battle-armor-creator.spec.ts e2e/battle-armor-roster.spec.ts e2e/protomech-creator.spec.ts e2e/franken-vehicles-protos.spec.ts e2e/infantry-creator.spec.ts e2e/building-creator.spec.ts e2e/building-roster.spec.ts e2e/unit-rules-edition.spec.ts --project=chromium` — expected PASS. Then the full `npx playwright test --project=chromium`.
- [ ] **Step 6: Commit** "Battle Armor, ProtoMech, Infantry and Building builders: the shared game settings block; old per-builder selectors gone (#324 round 3)".

### Task 7: Ship

- [ ] Record calls 16-19 in the spec; mark round 3 done there.
- [ ] Final review of the branch diff on Opus (superpowers:requesting-code-review); fix every finding, minors included, test-first.
- [ ] Commit, `git push origin beta`, `git deploy-beta`; fast-forward `master` in `C:/repo/battletech-tools` and push; progress comment on #324 (`-R ngcfells/battletech-tools`): round 3 done, round 4 (Alpha Strike creator and roster searches) next.
- [ ] Update memory `shared-game-settings.md` and the handoff for round 4, then stop.
