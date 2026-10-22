# Catalogs by Category, with Editions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every official catalog record lists the editions it was canon in, the builders hide whatever the selected edition and rules level do not offer, and the equipment catalogs become one file per category.

**Architecture:** Three pure functions in `rules-editions.ts` (`getRecordEditions`, `getRecordLevelInEdition`, `getRecordOfferIssue`) decide a record's standing, and `equipment-registry.ts` wraps them for equipment with the existing level floors. Every builder calls the wrappers in place of `isEquipmentWithinRulesLevel` / `isInRulesEdition`. The data then gets explicit `editions` lists generated from today's derivation, and the tech-base files merge into category files.

**Tech Stack:** Vite + React 18 class components + TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-21-catalogs-editions-design.md`

## Global Constraints

- 4-space indentation; match the surrounding code's naming and comment density.
- `npm test`, `npm run typecheck` and `npm run lint` (0 errors) pass after every commit. Baseline on `beta`: 113 files, 2160 passed, 1 skipped.
- No stat in any record changes. `editionStats` values are untouched.
- Never write a level, edition, date or citation from memory, from MegaMek or from OCR text alone.
- Every tag and `altTags` value keeps resolving. Saved units must load unchanged.
- Installed equipment is never removed by the new filter: hiding applies to pickers only.
- MegaMek/SSW exports stay canon-only. No MegaMek code copied.
- Work on `beta`, in the contributor's worktree from `astech_ic.py`. Never push. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A save holding an item the new filter hides (an Advanced weapon loaded at Standard) still loads with the item installed and its BV counted. Test in Task 3.
2. Lowering the rules level on an open design keeps the installed items and lists them as warnings with the reason. Test in Task 3.
3. Custom Homebrew content under an earlier edition (Battledroids at level 6) is still offered, since custom content has no editions. Test in Task 2.
4. A record with an empty `editions` and an `apocryphalIn` entry is offered only in the listed editions at level 5 and up. Test in Task 2.
5. Switching tech base after the merge still lists only that tech base's records (IS design shows no Clan records). Test in Task 5.

---

### Task 1: The FanPro boundary (PM task, Claude)

**Files:**
- Modify: `src/data/rules-editions.ts` (after `DEFAULT_RULES_EDITION`)
- Test: `src/data/rules-editions.test.ts`

**Interfaces:**
- Produces: `export const FANPRO_FIRST_EDITION: string`, a tag from `btRulesEditions`.

- [ ] **Step 1:** Read the credits pages of `master-rules-revised` (2001) and `classic-battletech-box-set` (2002), and of `master-rules` (1998) for contrast, with `py -3.11 C:/repo/JBTIICRework/library_search.py "<title> credits" --books`, then confirm against the page images. The boundary is the first edition in `btRulesEditions` whose credits page names FanPro as publisher.
- [ ] **Step 2:** Write the failing test `FANPRO_FIRST_EDITION is a listed edition`: `expect(btRulesEditions.some(e => e.tag === FANPRO_FIRST_EDITION)).toBe(true)`.
- [ ] **Step 3:** Add the constant with a comment quoting the credits line and its book and page. Run `npx vitest run src/data/rules-editions.test.ts`: PASS.
- [ ] **Step 4:** Commit `rules editions: FanPro boundary from the credits pages`.

### Task 2: Edition standing functions

**Files:**
- Modify: `src/data/data-interfaces.ts` (`IEditionHistory` ~line 76; `IEquipmentItem` ~line 248)
- Modify: `src/data/rules-editions.ts` (`IEditionRecord` type, line 467; `isInRulesEdition`, line 483)
- Modify: `src/data/equipment-registry.ts` (beside `isEquipmentWithinRulesLevel`, line 264)
- Test: `src/data/rules-editions.test.ts`, `src/data/equipment-registry.test.ts`

**Interfaces:**
- Produces, in `data-interfaces.ts`, on both `IEditionHistory` and `IEquipmentItem`:
  - `editions?: string[]`: every edition the record is canon in, empty when never canon. Optional in the type, required on official records by the test in Task 4.
  - `editionLevels?: { [editionTag: string]: number }`
  - `apocryphalIn` is added to `IEquipmentItem` with the type `IEditionHistory` already gives it.
- Produces, in `rules-editions.ts` (`IEditionRecord` gains `editions`, `editionLevels` and `rulesLevel?: number`):
  - `getRecordEditions(record: IEditionRecord): string[]`. Returns `record.editions` when present. Otherwise it derives, in `btRulesEditions` order: `[]` when `rulesLevel >= APOCRYPHAL_RULES_LEVEL`; else the earlier editions that are `editionStats` keys, then every edition from `DEFAULT_RULES_EDITION` on whose order is at least that of `getIntroducedInEdition(record)`.
  - `getRecordLevelInEdition(record: IEditionRecord, editionTag: string): number`. Returns `editionLevels[editionTag]` when set. Otherwise 0 for an earlier edition (`isEarlierRulesEdition`), and `rulesLevel ?? 0` from Total Warfare on.
  - `getRecordOfferIssue(record: IEditionRecord, editionTag: string, rulesLevel: number): "edition" | "level" | null`. Null means offered.
  - `isOfferedInEdition(record, editionTag, rulesLevel): boolean`, which is `getRecordOfferIssue(...) === null`.
  - `isInRulesEdition` keeps its signature. Its body becomes: with no `rulesLevel`, `getRecordEditions(record).includes(editionTag)`; with one, `getRecordOfferIssue(record, editionTag, rulesLevel) !== "edition"`.
- Produces, in `equipment-registry.ts`:
  - `getEquipmentOfferIssue(item: IEquipmentItem, editionTag: string, rulesLevel: number): "edition" | "level" | null`. Custom content (`getEquipmentRulesLevel(item) >= CUSTOM_HOMEBREW_RULES_LEVEL`) returns `"level"` when that level is above `rulesLevel`, and null otherwise, in every edition. Other records use `getRecordOfferIssue`, with the canon level raised to `getEquipmentRulesLevel(item)` (the Experimental floor).
  - `isEquipmentOffered(item, editionTag, rulesLevel): boolean`.

`getRecordOfferIssue` decides, given `eds = getRecordEditions(record)`, E = `editionTag`, L = `rulesLevel`:

```
E unknown                                  -> "edition"
E in eds                                   -> levelIn(E) <= L ? null : "level"
L < APOCRYPHAL_RULES_LEVEL                 -> "edition"
record.apocryphalIn has E                  -> null
eds empty                                  -> record.apocryphalIn ? "edition" : (order(E) >= order(DEFAULT) ? null : "edition")
order(E) > order(last of eds)              -> null      (dropped: apocryphal, spec rule 2)
otherwise                                  -> "edition" (not yet canon, or a gap)
```

- [ ] **Step 1: Write the failing tests** in `rules-editions.test.ts`, on synthetic records:
  - `derives editions from today's rules`: `{ introducedInEdition: "total-warfare" }` gives `["total-warfare", "battlemech-manual", "core-rulebook"]`. `{ editionStats: { battledroids: {...}, "battletech-manual": null } }` gives `["battledroids", "battletech-manual", "total-warfare", "battlemech-manual", "core-rulebook"]`. `{ rulesLevel: 5 }` gives `[]`.
  - `canon level hides above the selected level`: `{ rulesLevel: 3 }` under `total-warfare` gives `"level"` at 2 and null at 3.
  - `earlier editions ignore the Total Warfare level until graded`: `{ rulesLevel: 3, editionStats: { battledroids: {...} } }` under `battledroids` at 0 gives null. With `editionLevels: { battledroids: 2 }`, it gives `"level"` at 1.
  - `dropped records are apocryphal later`: `{ editions: ["battledroids"] }` under `total-warfare` gives `"edition"` at 4 and null at 5.
  - `not yet canon stays hidden`: `{ editions: ["core-rulebook"] }` under `total-warfare` gives `"edition"` at 5.
  - `apocryphalIn only where listed`: `{ editions: [], apocryphalIn: { battledroids: {...} } }` gives null under `battledroids` at 5, `"edition"` there at 4, and `"edition"` under `total-warfare` at 5.
  - `never-canon with no source is apocryphal from Total Warfare on`: `{ editions: [] }` gives null under `total-warfare` at 5 and `"edition"` under `battledroids` at 5.

  In `equipment-registry.test.ts`:
  - `custom content is offered in every edition at its level`: an item with `catalog: "custom"` gives null under `battledroids` at 6 and `"level"` at 5.
  - `prototype-only items need Experimental`: `{ introduced: null, prototype: 3050, rulesLevel: 2 }` gives `"level"` under `total-warfare` at 3 and null at 4.
  - `the new filter only adds level hiding` (the equivalence test): for every record in `getEquipmentCatalogDefinitions()`, every edition in `btRulesEditions`, and every L from 0 to 7, take `old = isInRulesEditionOld(r, E, L) && isEquipmentWithinRulesLevel(r, L)`, where `isInRulesEditionOld` is today's body, copied into the test file as a fixture. Skip custom content (`getEquipmentRulesLevel(r) >= CUSTOM_HOMEBREW_RULES_LEVEL`), which the new rule deliberately offers in every edition. For every other record, assert `isEquipmentOffered(r, E, L)` implies `old`. Where `old && !isEquipmentOffered`, assert the issue is `"level"`.
- [ ] **Step 2:** Run `npx vitest run src/data/rules-editions.test.ts src/data/equipment-registry.test.ts`: the new tests FAIL (functions not defined).
- [ ] **Step 3:** Implement the interfaces above.
- [ ] **Step 4:** Run the two files, then `npm test` and `npm run typecheck`: all PASS.
- [ ] **Step 5:** Commit `rules editions: a record's editions, level per edition, and why it is not offered`.

### Task 3: Builders hide what is not offered

**Files:**
- Modify:
  - `src/classes/battlemech.ts`: lines 1955, 4521, 4533, 5660, 5806-5830, 6525, 9279, 9424, 9439, 9454, 10037, 10376, 10399.
  - `src/classes/vehicle.ts:2786`, `small-craft.ts:863`, `capital-ship.ts:573`, `building.ts:697`, `building.ts:1350`.
  - `src/classes/aerospace-fighter.ts:1296`, `1408` and `1560`.
  - `src/ui/pages/classic-battletech/mech-creator/step1.tsx:329`.
- Modify: `src/data/equipment-registry.ts`: delete `isEquipmentWithinRulesLevel` once nothing calls it.
- Test: `src/classes/battlemech.test.ts`, `src/classes/vehicle.test.ts`

**Interfaces:**
- Consumes: Task 2's `isEquipmentOffered`, `getEquipmentOfferIssue`, `isOfferedInEdition` and `getRecordOfferIssue`.
- Produces: `BattleMech.isOffered(record, rulesLevel: number): boolean`, a wrapper using `this._rulesEdition`, beside `isInRulesEdition` (line 5660).

Rules for the call sites:
- **Equipment lists** (every `isEquipmentWithinRulesLevel(item, offeredLevel)`): use `isEquipmentOffered(item, <the unit's rules edition>, offeredLevel)`. In `getAvailableEquipment`, the separate `this.isInRulesEdition(record)` check at 10399 folds into it.
- **Component pickers** (cockpit, myomer, jump jet, engine, gyro, structure, heat sink, armor): replace `this.isInRulesEdition(x)` with `this.isOffered(x, rulesLevel)`. The mandatory-component exceptions already there (`mandatory ||`, standard myomer) stay.
- **step1.tsx 'Mech type list**: use `currentBattleMech.isOffered(option, shownLevel)` for every edition. The current-type exception stays.
- **Issue lines**: `getRulesEditionIssues` loses its early return for Total Warfare and later. Its `check` reports a record only when the issue is `"edition"`, as `Kind: name (not in <edition name>)`. Level issues stay with the existing rules-level warnings. In `building.ts:1350` and `aerospace-fighter.ts:1560`, the message follows the issue: `is not in the selected rules edition.` for `"edition"`, and the existing `is above the selected rules level.` for `"level"`.
- **Installed items** are never filtered out of `_equipmentList` or reset by these changes.

- [ ] **Step 1: Write the failing tests.**
  - `battlemech.test.ts`, `hides an Experimental weapon below Experimental`: a Clan-tech 'Mech in `total-warfare`, with the era year 3085 or later so `clan-lrm-5-artemis-v` (rulesLevel 4, introduced 3085) is in production. `getAvailableEquipment(false, 3)` has no item tagged `clan-lrm-5-artemis-v`, and `getAvailableEquipment(false, 4)` has one.
  - `battlemech.test.ts`, `keeps a hidden item installed` (Review Focus 1 and 2): install `clan-lrm-5-artemis-v` at level 4, export and re-import the save, and query at level 3. The item is still in the equipment list and the BV equals the BV at level 4.
  - `vehicle.test.ts`, `vehicle pickers hide above the level`: the same item is absent from the vehicle's available equipment at 3 and present at 4.
- [ ] **Step 2:** Run those test files: the new tests FAIL.
- [ ] **Step 3:** Change the call sites as listed. Delete `isEquipmentWithinRulesLevel` and its export.
- [ ] **Step 4:** Run `npm test`, `npm run typecheck` and `npm run lint`. All pass. Existing tests that relied on canon items being listed above the level are updated only where the new rule is the cause. The report lists every such test with a one-line reason.
- [ ] **Step 5:** Commit `builders: hide what the selected edition and rules level do not offer`.

### Task 4: Every official record carries `editions` and `techBase`

**Files:**
- Create: `tools/write-editions.test.ts`, a generator that runs only when `WRITE_EDITIONS=1` is set, and is skipped otherwise.
- Create: `tools/write_editions.py`
- Modify: every official equipment and component data file (`mech-is-*`, `mech-clan-*`, `mech-universal-*`, `mech-armor-types.ts`, `mech-engine-types.ts`, `mech-gyro-types.ts`, `mech-cockpit-types.ts`, `mech-heat-sink-types.ts`, `mech-internal-structure-types.ts`, `mech-jump-jet-types.ts`, `mech-myomer-types.ts`, `mech-type-options.ts`, `mech-tonnages.ts`)
- Test: `src/data/catalog-editions.test.ts`

**Interfaces:**
- Consumes: `getRecordEditions` (Task 2).

- [ ] **Step 1: Write the failing test** `catalog-editions.test.ts`:
  - `every official record lists its editions`: for every non-custom record in the equipment catalogs and the component arrays, `Array.isArray(record.editions)`, and every entry is a `btRulesEditions` tag.
  - `editions agree with editionStats`: every `editionStats` key is in `editions`, and every earlier edition in `editions` is an `editionStats` key.
  - `introducedInEdition is the first edition`: when `editions` is non-empty, its first entry in edition order is `introducedInEdition ?? "total-warfare"`.
  - `every equipment record says its tech base`: every official equipment record's `techBase` is `"is"`, `"clan"` or `"universal"`. Whether it matches its old file is checked by the generator output, and kept by Task 5's snapshot.
- [ ] **Step 2:** Run it: FAIL.
- [ ] **Step 3:** The generator test writes `.superpowers/ic/editions.json` (`{ tag: { editions, techBase, file } }`) from `getRecordEditions(record)` while no record has `editions` yet. `write_editions.py` inserts `editions: [...]` (and `techBase: "<x>"` where missing) right after each record's `tag: "<tag>",` in the file it names. Tags are unique (checked 2026-10-21), so each insertion has one target. It writes inline for one-line records and on its own line for multi-line ones, matching the record's layout.
- [ ] **Step 4:** Run `WRITE_EDITIONS=1 npx vitest run tools/write-editions.test.ts`, then `py -3.11 tools/write_editions.py .superpowers/ic/editions.json`. Then run `npm test` (including Task 2's equivalence test, which must still pass) and `npm run typecheck`: PASS.
- [ ] **Step 5:** Commit `catalogs: write each record's editions and tech base`. The two tools stay in `tools/` for later records.

### Task 5: Registry reads the record's tech base

**Files:**
- Modify: `src/data/equipment-registry.ts` (`IEquipmentCatalogDefinition`, line 30; `getCatalogByTech`, line 95)
- Modify: `src/classes/battlemech.ts:5756`
- Test: `src/data/equipment-registry.test.ts`

**Interfaces:**
- Produces: `IEquipmentCatalogDefinition` without `techBase`, with `custom?: true` on the custom catalogs. `getCatalogByTech(techBase)` returns the custom catalogs' records (plus local custom equipment) for `"custom"`, and otherwise the official records whose `techBase === techBase`. `battlemech.ts:5756` tests `item.techBase === "clan"` over all records.

- [ ] **Step 1:** Write the failing test `an IS list holds no Clan records` (Review Focus 5): `getEquipmentListByTech("is")` has no record with `techBase === "clan"`, and `getEquipmentListByTech("clan")` none with `"is"`. Also assert that `getEquipmentListByTech(x)`'s tags for `"is"`, `"clan"`, `"universal"` and `"custom"` equal a snapshot taken before the change. The test builds the snapshot from the current code in Step 1 and commits it as `src/data/__fixtures__/tech-lists.json`.
- [ ] **Step 2:** Run: the tech-base test fails to compile once `techBase` is removed from the definition type. Make that change.
- [ ] **Step 3:** Implement. Run `npm test` and `npm run typecheck`: PASS, the snapshot unchanged.
- [ ] **Step 4:** Commit `equipment registry: tech base from the record, not the catalog file`.

### Task 6: Merge one category per commit (six commits)

**Files, one row per commit, in this order:**

| Commit | New file and export | Merges (deleted in the same commit) |
|---|---|---|
| 6a | `src/data/equipment-energy.ts`, `equipmentEnergy` | `mech-is-equipment-weapons-energy.ts`, `mech-clan-equipment-weapons-energy.ts` |
| 6b | `src/data/equipment-ballistic.ts`, `equipmentBallistic` | `mech-is-equipment-weapons-ballistic.ts`, `mech-clan-equipment-weapons-ballistic.ts` |
| 6c | `src/data/equipment-missile.ts`, `equipmentMissile` | `mech-is-equipment-weapons-missiles.ts`, `mech-clan-equipment-weapons-missile.ts` |
| 6d | `src/data/equipment-misc.ts`, `equipmentMisc` | `mech-is-equipment-weapons-misc.ts`, `mech-clan-equipment-weapons-misc.ts` |
| 6e | `src/data/equipment-artillery.ts`, `equipmentArtillery` | `mech-is-equipment-weapons-artillery.ts`, `mech-clan-equipment-weapons-artillery.ts`, `mech-universal-equipment.ts` |
| 6f | `src/data/ammo.ts`, `ammoCatalog` | `mech-is-ammo.ts`, `mech-clan-ammo.ts`, `mech-universal-ammo.ts` |

**Interfaces:**
- Consumes: Task 5's definition shape. Each new file gets one registry definition with `id` equal to its basename. Every import of an old export (grep the old export name across `src/` and `tools/`) moves to the new one.

- [ ] **Step 1 (each commit):** Records are copied byte for byte: IS records first, then Clan, then universal, each in its old order. The file header comment merges the old ones.
- [ ] **Step 2 (each commit):** Run `npm test` (the Task 5 snapshot and Task 2 equivalence test must pass unchanged), `npm run typecheck` and `npm run lint`: PASS.
- [ ] **Step 3 (each commit):** Commit `catalogs: one <category> file for every tech base`.

### Task 7: Custom equipment files by category

**Files:**
- Create: `src/data/energy-custom.ts` (`energyCustom`), `src/data/ballistic-custom.ts` (`ballisticCustom`), `src/data/missile-custom.ts` (`missileCustom`)
- Modify: `src/data/misc-custom.ts`, `src/data/ammo-custom.ts`: their records are appended after the existing ones.
- Delete: `mech-custom-equipment-weapons-energy.ts`, `-ballistic.ts`, `-missile.ts`, `-misc.ts`, `mech-custom-ammo.ts`
- Registry and imports follow, as in Task 6. The component custom files (`mech-custom-armor-types.ts` and the others) are untouched.

- [ ] **Step 1:** Move the records byte for byte. Run `npm test` (the snapshot passes), `npm run typecheck` and `npm run lint`.
- [ ] **Step 2:** Commit `catalogs: custom equipment files by category`.

### Task 8: Show the editions in the equipment editor

**Files:**
- Modify: `src/ui/pages/equipment-editor.tsx`
- Test: `src/ui/pages/equipment-editor.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `getRecordEditions`, `getRecordLevelInEdition`, `getRulesEdition(tag).name`, `getRulesLevelOptionsForEdition(tag)`.
- Produces: `formatRecordEditions(record): string` (exported from the editor file), giving `"<edition name> (<level name>)"` joined by `"; "`, or `"Never canon"` when empty.

- [ ] **Step 1:** Write the failing test: for `{ editions: ["total-warfare"], rulesLevel: 3 }`, `formatRecordEditions` returns `"Total Warfare (Advanced)"`. For `{ editions: [] }`, it returns `"Never canon"`.
- [ ] **Step 2:** Implement, and show the string as a column beside each record in the editor's list.
- [ ] **Step 3:** Run the test, `npm run typecheck` and `npm run lint`: PASS.
- [ ] **Step 4:** Commit `equipment editor: show each record's editions`.

### Task 9: Documentation (PM task, Claude)

- [ ] **Step 1:** Rewrite the header comment of `rules-editions.ts` (lines 21-43) so `editions` is the source of an edition's contents and `editionStats` holds only its stats. Update the `IEditionHistory` comment to match.
- [ ] **Step 2:** In the spec, correct section 2's example: the four-legged GOL-1H record is canon from Total Warfare on and apocryphal in Battledroids, not never-canon.
- [ ] **Step 3:** Commit `rules editions: document editions as the source of an edition's contents`.

## Follow-on (not this plan)

Each edition's `editionLevels`, entered as spec section 3 says: candidates extracted by the local model, disagreements with MegaMek flagged by a script, and every value settled by Claude against the page image. One plan per edition table, starting with IO:AE for Total Warfare onward.
