# Rules Levels by Edition: Battledroids Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every creator shows Rules Edition then Rules Level. Under Battledroids the level list is the book's own
(Basic / Advanced / Expert plus Apocryphal, Custom Homebrew, Munchkin), and the Mech Creator lets the player pick
from the droids that were printed, building only where the edition's construction rules allow it.

**Architecture:** Edition data (`rules-editions.ts`) gains a level list and a construction level, read by a shared
`RulesLevelSelect` component that every creator places under `RulesEditionSelect`. The printed droids are compact
descriptors (`battledroids-mechs.ts`) that a builder (`printed-droid.ts`) turns into a `BattleMech` under the
Battledroids edition. The Mech Creator shows a droid picker, and locks the later steps when construction is not
allowed.

**Tech Stack:** TypeScript, React 18, Vite, Vitest (`npm test`), Playwright (`npx playwright test --workers=2`).

**Spec:** `docs/superpowers/specs/2026-10-15-rules-edition-levels-battledroids-design.md`

## Global Constraints

- Branch `feature/battledroids-rules-levels` from `master`. Commit per task; never push unless the user asks.
- Every stat is entered as printed, with book/source and page. Obvious misprints are corrected with a note saying
  what was printed; anything else stays as printed and is flagged (`astech-rules.md` 2). Never from memory, Sarna
  prose or Ollama output pasted unchecked.
- Rules levels: 0 Beginners, 1 Introductory, 2 Standard, 3 Advanced, 4 Experimental, 5 Apocryphal, 6 Custom
  Homebrew, 7 Munchkin (`rules-level-options.ts` constants). Each level includes every level below it.
- Battledroids levels: Basic Battledroids = 0, Advanced Battledroids = 1, Expert Battledroids = 2; construction
  from 2.
- The rules level stays one app-wide setting, `appSettings.mechRulesFilter`. Old saves and stored settings load
  unchanged.
- Tests sit beside their source (`*.test.ts`), name the rule and cite the page. Match the surrounding file's style
  (4-space indentation, its comment density).
- Baseline before starting: run `npm test`, `npx tsc --noEmit -p tsconfig.json` and `npm run lint`, and record the
  counts; report new failures apart from old ones.

## Review Focus

1. A stored rules level the edition does not list (3 under Battledroids, 0 under Total Warfare if Beginners is ever
   dropped): the control shows the lowest listed level above it, and the stored setting is not rewritten until the
   player picks one. Test in Task 1.
2. Switching edition with a printed droid loaded (Battledroids to Total Warfare and back): the design keeps its
   `printedDroid` id, and the lock applies only under Battledroids. Test in Task 4.
3. An old Battledroids save with no `printedDroid` field, opened at Basic: it is a built design, so it is shown
   read-only with the note that building needs Expert, and nothing in it is changed. Test in Task 4.
4. The Goliath under Battledroids below Apocryphal: not in the picker, and loading its saved design lists the quad
   layout under "Not in this rules edition". Test in Task 2.
5. Raising the level after the Advanced warning, then cancelling: cancel leaves the level and the design exactly as
   they were. e2e in Task 5.

---

### Task 1: Each edition's rules levels and construction level

**Files:**
- Modify: `src/data/rules-editions.ts` (interface at lines 55-93, Battledroids entry at 96-124, helpers at the end)
- Test: `src/data/rules-editions.test.ts`

**Interfaces:**
- Produces:
  - `interface IRulesEditionLevel { id: number; name: string; book: string; page: number }`
  - `IRulesEdition.levels?: IRulesEditionLevel[]` (canon levels only; 5-7 are added by the helper)
  - `IRulesEdition.constructionLevel?: number` (absent = construction at every level)
  - `getRulesLevelOptionsForEdition(editionTag: string | undefined): IRulesLevelOption[]`: the edition's canon
    levels with their own names and ids, then ids 5, 6, 7 from `btRulesLevelOptions`. An edition with no `levels`
    returns `getRulesLevelOptions()` unchanged.
  - `getShownRulesLevel(editionTag: string | undefined, storedLevel: number): number`: `storedLevel` when listed,
    else the lowest listed id above it, else the highest listed id.
  - `editionAllowsConstruction(editionTag: string | undefined, rulesLevel: number): boolean`

- [ ] **Step 1: Write the failing tests**

```ts
describe("rules levels by edition", () => {
    it("lists Battledroids' own three game levels, then the non-canon levels (BD: Basic, Advanced, Expert Battledroids)", () => {
        expect(getRulesLevelOptionsForEdition("battledroids").map((o) => [o.id, o.name])).toEqual([
            [0, "Basic Battledroids"], [1, "Advanced Battledroids"], [2, "Expert Battledroids"],
            [5, "Apocryphal"], [6, "Custom Homebrew"], [7, "Munchkin"],
        ]);
    });
    it("keeps Total Warfare's list as it was", () => {
        expect(getRulesLevelOptionsForEdition("total-warfare")).toEqual(getRulesLevelOptions());
    });
    it("shows the lowest listed level above a stored level the edition does not list", () => {
        expect(getShownRulesLevel("battledroids", 3)).toBe(5);
        expect(getShownRulesLevel("battledroids", 1)).toBe(1);
        expect(getShownRulesLevel("battledroids", 9)).toBe(7);
    });
    it("allows construction from Expert Battledroids up (the Expert rules design new droids)", () => {
        expect(editionAllowsConstruction("battledroids", 0)).toBe(false);
        expect(editionAllowsConstruction("battledroids", 1)).toBe(false);
        expect(editionAllowsConstruction("battledroids", 2)).toBe(true);
        expect(editionAllowsConstruction("battledroids", 5)).toBe(true);
        expect(editionAllowsConstruction("total-warfare", 0)).toBe(true);
    });
});
```

- [ ] **Step 2: Run** `npx vitest run src/data/rules-editions.test.ts`. Expected: FAIL, the helpers are not exported.

- [ ] **Step 3: Implement** the interface fields and the three helpers. On the Battledroids entry add `levels` with
  the three names above and `constructionLevel: 2`. Each level's `page` is the printed page read off the PDF page
  image (`rulebooks-legacy/Battledroids - A Game of Armored Combat (FASA 1984).pdf`, PDF pages 2, 8 and 15 open
  the Basic, Advanced and Expert sections; the INDEX offset is unverified, so read the printed number). Comment
  the Expert entry with the line "the information needed to design and build new classes of droids".

- [ ] **Step 4: Run** the test file. Expected: PASS.

- [ ] **Step 5: Commit** `git commit -m "Rules editions: Battledroids' own rules levels and the level its construction rules start at"`

### Task 2: What an edition allows only at the Apocryphal level

**Files:**
- Modify: `src/data/rules-editions.ts` (`isInRulesEdition`, `IEditionRecord`), `src/data/mech-type-options.ts`
  (the `quad` entry), `src/classes/battlemech.ts` (`isInRulesEdition` at 5618, `getRulesEditionIssues` at 5725)
- Modify: `src/ui/pages/classic-battletech/mech-creator/step1.tsx` (the Mech Type filter)
- Test: `src/data/rules-editions.test.ts`, `src/classes/battlemech-rules-edition.test.ts`

**Interfaces:**
- Produces:
  - `IEditionRecord.apocryphalIn?: Record<string, { source: string; notes: string }>`
  - `isInRulesEdition(record: IEditionRecord, editionTag?: string, rulesLevel?: number): boolean`: true as before,
    or when `rulesLevel >= APOCRYPHAL_RULES_LEVEL` and `editionTag` is a key of `apocryphalIn`
  - `BattleMech.isInRulesEdition(record, rulesLevel?: number)` and `BattleMech.getRulesEditionIssues(rulesLevel?: number)`
    pass the level through

- [ ] **Step 1: Write the failing tests**: the quad layout is not in Battledroids at level 2 and is at level 5,
  sourced to the Goliath sheet. The Goliath design's `getRulesEditionIssues(2)` names the quad layout, and
  `getRulesEditionIssues(5)` does not.
- [ ] **Step 2: Run** both test files. Expected: FAIL.
- [ ] **Step 3: Implement** the field and parameter. On `quad` add `apocryphalIn: { battledroids: { source: "TCI kit back, GOL-1H Goliath (FASA 1984)", notes: "<the sheet's Special Rules, verbatim>" } }`.
  The Step 1 Mech Type filter passes `appSettings.mechRulesFilter`.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Rules editions: records an edition allows only at the Apocryphal level; the TCI Goliath's four-legged layout"`

### Task 3: The printed droids as data, and building one

**Files:**
- Create: `src/data/battledroids-mechs.ts`, `src/classes/printed-droid.ts`, `src/classes/printed-droid.test.ts`
- Modify: `src/classes/battlemech.ts` (`IBattleMechExport.printedDroid?: string`, getter/setter, export/import)

**Interfaces:**
- Produces:
  - `interface IPrintedDroid { id: string; model: string; name: string; rulesLevel: number; source: string; page?: number; kit?: string; inferred?: boolean; mechType: "biped" | "quad"; tonnage: number; engineRating: number; walk: number; jump: number; heatSinks: number; armor: { head: number; centerTorso: number; centerTorsoRear: number; sideTorso: number; sideTorsoRear: number; arm: number; leg: number }; printedArmorFactor: number; equipment: { tag: string; location: string; rear?: boolean }[]; notes: string[] }`
    (`printedArmorFactor` holds the sheet's total even where the locations disagree; `notes` holds every correction
    and flag from the spec, as sentences)
  - `battledroidsPrintedDroids: IPrintedDroid[]` and `getPrintedDroids(rulesLevel: number): IPrintedDroid[]` (droids
    at or below the level)
  - `buildPrintedDroid(droid: IPrintedDroid): BattleMech`: a new BattleMech with `setRulesEdition("battledroids")`,
    `setType`, `setTonnage`, `setWalkSpeed`, `setJumpSpeed`, `setAdditionalHeatSinks(heatSinks - 10)`, the armor
    setters at `battlemech.ts:7841-7944`, `addEquipmentFromTag` per item (list `"equipment"`), `setPrintedDroid(id)`
  - `BattleMech.getPrintedDroid(): string | undefined`, `BattleMech.setPrintedDroid(id: string | undefined): void`

- [ ] **Step 1: Write the failing tests** in `printed-droid.test.ts`, one `it` per droid (every droid's `notes`
  checked), including:
  - SPI-5R Spider (*Game News* #3, May 1985, pp.12-13): Apocryphal, 30 tons, armor 64, four medium lasers.
  - GOL-1H Goliath: quad, armor 296, `getCurrentTonnage()` reported as built, with any difference from 80 in its notes.
  - GRF-2N Griffin: head 8 (sheet prints 7, corrected), 13 heat sinks, `getCurrentTonnage()` = 56, notes say a ton
    over as printed.
  - SHD-3H Shadow Hawk: head 9 (blank on the sheet, corrected), MG in the head.
  - WLV-3Nb and WLV-3Nc: locations as printed (sum 156), `printedArmorFactor` 168, flagged.
  - THN-8T Thunderbolt: two medium lasers in the left torso as printed (user ruling 2026-10-16), the 3 critical boxes noted.
  - BTL-5R BattleMaster: two machine guns in the left arm, the single critical box noted.
  - The two inferred kits (SHD-2H stats on the Jakt-type kit, GRF-1N stats on the plain Soltic H8 kit): `inferred`, Apocryphal.
  - A round trip: `buildPrintedDroid(x).export()` re-imported keeps `getPrintedDroid()`.
  - `getPrintedDroids(1)` lists only the book droids (none in Task 3 yet: assert it is empty), `getPrintedDroids(5)` lists all Task 3 droids.
- [ ] **Step 2: Run** `npx vitest run src/classes/printed-droid.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**. The spec's table (item 7) and Spider figures (item 6) are the data. Equipment tags:
  `standard-ppc`, `large-laser`, `medium-laser`, `small-laser`, `standard-flamer`, `machine-gun`,
  `autocannon-standard-b`, `lrm-5`/`-10`/`-15`/`-20`, `srm-2`/`-4`/`-6`, `ammo-is-ac-5-standard`,
  `ammo-lrm-standard`, `ammo-machine-gun-standard`, `ammo-srm-standard`. Jump jets are not equipment items: they
  come from `setJumpSpeed`. Each ammunition line on a sheet is one ton (one bin) per critical box printed.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Printed Battledroids droids: the Spider and the TCI kit backs, built under the edition's rules"`

### Task 4: The ten droids of the box set

**Files:**
- Modify: `src/data/battledroids-mechs.ts`, `src/classes/printed-droid.test.ts`, `src/data/rules-editions.ts`
  (the `mechs` list), `src/data/rules-editions.test.ts` (line 151 expects 10)

**Interfaces:** Consumes Task 3's `IPrintedDroid` and `buildPrintedDroid`.

- [ ] **Step 1: Read the record listings** (BD pp.16-17) from `text/Battledroids-A-Game-of-Armored-Combat-FASA-1984.raw.txt`
  and check every number against the page images; `glm-ocr` through Ollama may give the first read. Known from
  Sarna's summary, to confirm on the page: STG-3R and WSP-1A a ton overweight, CRD-3R half a ton under, RFL-3N an
  oversized VOX 260 and no medium lasers. Each goes in `notes` as printed.
- [ ] **Step 2: Write the failing tests**: one `it` per droid for tonnage, armor by location and weapon list, plus
  `getPrintedDroids(0)` and `getPrintedDroids(1)` returning exactly the ten, and the edition's `mechs` matching
  the ten book models with the Apocryphal droids not in it.
- [ ] **Step 3: Run** the tests. Expected: FAIL.
- [ ] **Step 4: Add the ten** at `rulesLevel: 0`, `source: "BD"`, `page` 16 or 17.
- [ ] **Step 5: Add the tests for Review Focus 2 and 3**: switching a loaded droid to Total Warfare and back
  keeps `getPrintedDroid()`; a Battledroids save without `printedDroid` imports unchanged.
- [ ] **Step 6: Run** the tests. Expected: PASS.
- [ ] **Step 7: Commit** `git commit -m "Printed Battledroids droids: the ten record listings of the box set (BD pp.16-17)"`

### Task 5: Rules Level under Rules Edition in every creator, and the droid picker

**Files:**
- Create: `src/ui/components/rules-level-select.tsx`
- Modify: Step 1 of every creator: `mech-creator/step1.tsx`, `vehicle-creator/step1.tsx:464`,
  `fighter-creator/chassis.tsx:100`, `small-craft-creator/chassis.tsx:113`, `infantry-creator/platoon.tsx:89`,
  `battle-armor-creator/chassis.tsx:97`, `protomech-creator/chassis.tsx:78`, `building-creator/structure.tsx:73`
  (all under `src/ui/pages/classic-battletech/`)
- Modify: `mech-creator/step2.tsx` to `step6.tsx`: wrap each step's form in `<fieldset disabled={locked}>`
- Test: `e2e/unit-rules-edition.spec.ts`, `e2e/mech-rules-edition.spec.ts`

**Interfaces:**
- Consumes: Task 1's helpers, Task 3's `getPrintedDroids` and `buildPrintedDroid`.
- Produces: `RulesLevelSelect(props: { editionTag: string; value: number; onChange: (level: number) => void }): JSX.Element`,
  rendering `getRulesLevelOptionsForEdition` with the value `getShownRulesLevel(editionTag, value)`.

- [ ] **Step 1: Write the failing e2e tests**:
  - Every creator's first two Step 1 controls are named "Rules Edition" and "Rules Level".
  - Mech Creator, Battledroids, Basic Battledroids: a "Droid" select lists the ten book droids. Choosing the
    Griffin loads GRF-1N; Steps 2-6 are disabled, with the note "Basic Battledroids plays the printed droids only."
  - Advanced Battledroids: the steps show an "Edit this droid" button. Its confirm says that editing moves the
    design to Expert Battledroids. Accepting sets Rules Level to Expert and enables the steps; cancelling changes
    nothing (Review Focus 5).
  - Apocryphal: the Droid list adds the Spider and the TCI droids, with "(inferred)" on the two inferred kits.
    The chassis fields stay available.
- [ ] **Step 2: Run** `npx playwright test e2e/unit-rules-edition.spec.ts e2e/mech-rules-edition.spec.ts --workers=2`. Expected: FAIL.
- [ ] **Step 3: Implement**. `locked` = the design is under an edition where `!editionAllowsConstruction(edition, level)`.
  Under a locked level, Step 1 shows the Droid select in place of the chassis fields. Remove the Step 1 text that
  says rules levels do not apply under an earlier edition. Under an earlier edition, the Mech Type filter keeps
  `isInRulesEdition(option, level)` from Task 2. The Advanced confirm uses `window.confirm`.
- [ ] **Step 4: Run** the e2e specs and `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Every creator: Rules Level under Rules Edition, with each edition's own levels; Battledroids droid picker"`

### Task 6: Roadmap and verification

**Files:**
- Modify: `TODO.md` (the "Rules edition selector, still to do" item and the Battledroids lines near 1379-1436)

- [ ] **Step 1: Update TODO.md**. Record what was done. Add open items: the other editions' level lists, the two
  kit sheets still to find (Jakt-type Shadow Hawk, plain Soltic H8 Griffin), and the TCI BattleTech sets
  (Scorpion, Locust, Ostroc Mk II, TCI Hunter) for the Second Edition pass.
- [ ] **Step 2: Run** `npm test`, `npx tsc --noEmit -p tsconfig.json`, `npm run lint`,
  `npx playwright test --workers=2`. Expected: no new failures against the baseline.
- [ ] **Step 3: Commit** `git commit -m "TODO: rules levels by edition, Battledroids done; what the next editions owe"`
