# Alpha Strike Rules Editions and Selector (#646) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Alpha Strike force picks its rules edition (2013 *Alpha Strike* or the *Commander's Edition*) and a rules level. Play, pilot abilities, formations, E-War and the unit list then follow that edition and level. The 2013 book is entered whole and marked `complete`.

**Architecture:** The edition record (`IAlphaStrikeEdition` in `src/data/rules-editions.ts`) gains its printings, its game levels, its construction level and a small `playRules` block. `AlphaStrikeForce` saves the edition and level and passes the edition to its units, as it already does with `quirksInPlay`. `AlphaStrikeUnit.calcCurrentValues` reads three flags. The pilot-ability and formation data gain per-edition source and cost. The roster's existing search and converters are gated by the force's level.

**Tech Stack:** TypeScript, React 18, Vitest (PowerShell only).

**Spec:** Issue #646 (body as agreed by NGCFells 2026-11-21) plus the audit below, which was done on Opus 5.5 on 2026-11-22 from the ResourceLibrary extracts. No page image was pulled. Earlier plan: `2026-11-21-ewar-phase-5.md` (it added `AlphaStrikeForce.rulesEdition` and the E-War edition flags).

## Audit (2026-11-22): what differs between the editions

The sources, all in ResourceLibrary `text/`:
- **2013 book:** `Alpha-Strike.txt` (1st printing 2013), `AlphaStrike-CGL-2015-Corrected2ndPrinting.txt`, and the errata `AlphaStrike-CGL-2017-V23.txt`, `-V231…`, `-2018-V24…`, `-2019-V25Dated20190918.txt`, plus `Alpha-Strike-2018-06-06-v2-4-Second-Printing.txt`. v2.5 is the final errata ("superseded by Alpha Strike: Commander's Edition"). Its page numbers are those of the 1st printing.
- **ASCE:** `AlphaStrikeCommandersEdition-CGL-2019-1stPrinting.txt`, `-2020-Corrected2ndPrinting`, `-2021-Corrected3rdPrinting`, `-2022-Corrected5thPrinting`, and `Alpha-Strike-Commander-s-Edition.txt` (the 2024 printing). The errata are `Alpha-Strike-Commanders-Edition-v6-0-PRE.txt`, `BattleTechRulebookAlphaStrikeCommandersEditionErrata-CGL-2024-V70.txt` and `-2025-V702.txt`. **v7.0 and v7.0.2 are newer than the v6.0 the issue lists**, so both are added.
- **Companion and Quick-Start Rules:** `Alpha-Strike-Companion.txt` (ASC, 2014) with errata v1.1 to v1.6, `AlphaStrikeQuickStartRules-CGL-2015.txt`, and `Alpha-Strike-Box-Set-Quick-Start-Rulebook-3rd-Print-12-29a.txt`.

The rule is that each edition plays by its latest printing plus its final errata. Under that rule, the 2013 book (2015 printing + v2.5) and ASCE (2024 + v7.0.2) differ on the following points the app plays.

| Topic | 2013 (2015 printing + v2.5) | ASCE (2024 + v7.0.2) | App today |
|---|---|---|---|
| Heat and TMM | Heat takes 2" of ground Move per level and adds +level to-hit. The TMM stays the card's (v2.5 ⑤ "Ground Movement: the unit uses the TMM listed on its unit card"). | Same, plus "Subtract 1 from the unit's TMM at Heat Level 2 or higher" (ASCE p.53). | Always takes −1 (ASCE). |
| Weapon Hit | Each damage value −1, "to a minimum of 0" (2015 p.41). | −1, "1 is reduced to 0*, and 0* is reduced to 0" (ASCE p.50). | Steps through 0* (ASCE). |
| Vehicle Engine Hit | The first hit halves Move and damage (2015 p.41). | It halves Move, TMM and damage (ASCE p.50). | Halves TMM (ASCE). |
| 'Mech Engine Hit heat | 1 heat "any time it fires its weapons" (2015 p.41). | 1 heat "in the End Phase if it made any weapon attacks" (ASCE p.50). | Not automated. Only the card note text differs. |
| PV for skill | The 1st printing used multipliers (0.68 to 2.63). The 2015 printing and the errata use the Low-Skill/High-Skill step tables. Its reference page p.167 still prints the old multiplier table, which is a leftover. | The same step tables (ASCE p.29). | Step tables. They are right for both; note the 1st-printing difference only. |
| MP Hit | Lose half the Move and TMM, rounding normally, minimum 2"/1 (v2.5 ⑤). | Halve, rounding down, minimum 2"/1 (ASCE p.50). | **The same result for every value.** A rounded-up loss leaves the rounded-down remainder. No change. |
| Motive damage, TMM table, standstill, jumping +2 attacker, natural-12 critical | v2.5 ⑤ brings these into line with ASCE. | ASCE pp.44, 51. | Same. No change. |
| Pilot abilities (SPA), command abilities (SCA), formations | The book prints none. The *Alpha Strike Companion* (2014, a supplement to this book) prints them. By the book-offers-item rule, the 2013 edition offers the ASC list at ASC costs and pages. | ASCE pp.92-109 (SPA), 102+ (SCA), 117-125 (formation types). | All are sourced to ASCE. |
| E-War | Done in #642 Phase 5. STL does not jam its own unit, and the C3EM does not burn out the slave. NC3, NOVA, JAM, RAMS, DJ, HJ and TSEMP come from ASC pp.38-39. | `stealthJamsOwnEcm`, `c3EmergencyBurnsSlave`. | Already by edition. |
| Game levels | Introductory Alpha Strike pp.10-21 ('Mechs only), Standard pp.22-61, Advanced Options pp.62+ (2015 contents). The QSR (2015) calls itself Introductory. | No introductory chapter. The core rules run pp.22-109 and Optional Rules start at p.136. The box-set QSR is the entry rule set. | No levels in Alpha Strike. |

The 2013 Introductory chapter and the 2015 QSR still need a text compare. Task 1 runs it, and the result decides whether level 0 and level 1 are one rule set listed twice (the issue's mapping) or two.

## Global Constraints

- **Editions:** `alpha-strike` (2013) and `alpha-strike-commanders-edition` (default). `DEFAULT_ALPHA_STRIKE_EDITION` is unchanged. An old save with no `rulesEdition` loads as ASCE. An unknown tag also loads as ASCE (already the case, `alpha-strike-force.ts:321`).
- **Latest printing:** each edition plays by its latest printing plus final errata. A difference between printings is recorded in the edition's `printings` notes, never played.
- **Carry-forward, 2013 → ASCE:** an SPA, SCA, formation or special the 2013 edition offers (ASC included) and ASCE drops stays offered under ASCE, marked apocryphal (level 5), and plays by the ASC text (memory removed-items-stay-apocryphal). Something ASCE adds is not offered under 2013.
- **Mapping (agreed):** 2013 level 0 = the 2015 QSR, level 1 = Introductory Alpha Strike (pp.10-21). ASCE levels 0 and 1 = the box-set QSR. Both editions: 2 Standard = the core rules, 3 Advanced = the optional or advanced rules, then Apocryphal 5, Custom Homebrew 6 and Munchkin 7 as in Classic (`getRulesLevelOptionsForEdition`). Level 4 Experimental is kept for MUL "Experimental" units.
- **No building below level 2** (`constructionLevel: 2`). At levels 0 and 1: no Alpha Strike unit creator, no conversion of a saved Classic design, and only BattleMechs whose MUL rules level is at or below the force's level.
- **Our rules only at levels 6-7** (memory our-rules-only-at-levels-6-7): unchanged by this plan.
- **Condense and extend:** no new source file. Data goes in `rules-editions.ts`, `alpha-strike-pilot-abilities.ts` and `formation-bonuses.ts`. Class logic goes in `alpha-strike-unit.ts` and `alpha-strike-force.ts`. UI goes in the roster's `home.tsx`, `in-play.tsx`, `_AddUnitsPage.tsx` and `_showAlphaStrikeUnit.tsx`, and in `components/rules-edition-select.tsx`. Tests join the existing test files beside each.
- **Extract first:** a page image only where the extract is garbled or in doubt. Every image pulled goes back WHOLE into every printing's extract and `_corrected_pages.md`, pushed. The ASC SPA table (`Alpha-Strike-Companion.txt` ~3015-3170) has its columns interleaved: read the per-ability entries that follow it, not the table.
- Vitest: `npx vitest run --project unit <path>` in PowerShell. Run `npm run check` before deploy. Bash heredocs with an apostrophe are blocked: write scripts with Write. Commits end with the session model's `Co-Authored-By` line.

## Calls for NGCFells (ANSWERED 2026-11-22: 1 source only, 2 yes, 3 yes; build as recommended)

1. **Is the Companion its own edition?** Recommended: **no**. ASC is a supplement to the 2013 book (its own text, and v2.5 points to it), so it is a source the 2013 edition draws on, as the E-War entries already do (`book: "ASC"`). It is not a third selector entry.
2. **Heat and TMM under 2013.** Recommended: under 2013, heat lowers ground Move only, and the card TMM stands. v2.5 ⑤ ties the TMM to the card, and only ASCE prints the −1 at heat 2+. (The Introductory chapter's own note says the TMM "will be different" with less Move, but that is the Introductory level, which uses the same card.)
3. **The force's rules level.** Recommended: a new per-force field, `AlphaStrikeForce.rulesLevel`, chosen beside the edition. It is unset (no limit, as today) for old saves and new forces until the player picks one. Setting it never removes units already in the force; they show a warning badge instead.

## Review Focus

1. A save from before this plan (no `rulesEdition`, no `rulesLevel`): every card shows the same numbers as today. Task 4 pins this with a round-trip test on a unit with heat 2, a weapon hit and a vehicle engine hit.
2. Switching the edition mid-game: every unit's current values are recalculated at once, with no stale TMM. Task 4 tests this.
3. A pilot keeps an ASCE-only SPA when the force switches to 2013: the SPA is kept, marked "not in Alpha Strike (2013)", and its points still count. Nothing is deleted. Task 3 tests this.
4. A force at level 0/1 that already holds a vehicle or a Standard-rules 'Mech: the unit stays, with a "not at this level" badge, and print stamps the higher level. Task 5 tests this.
5. A 0* damage value under 2013 after a weapon hit becomes 0 (no attack), not 0*. A 1 becomes 0, not 0*. Task 2 tests both.

---

### Task 1: Edition data: printings, levels, play rules, the 2013 book marked complete

**Files:**
- Modify: `src/data/rules-editions.ts` (`IAlphaStrikeEdition`, `asRulesEditions`, `getSelectableAlphaStrikeEditions`, new helpers next to them)
- Test: `src/data/rules-editions.test.ts`

**Interfaces:**
- Produces:
  - `IAlphaStrikeEdition.printings: { name: string; year: number; extract: string; errata?: boolean; note?: string }[]`
  - `IAlphaStrikeEdition.levels: IRulesEditionLevel[]`
  - `IAlphaStrikeEdition.constructionLevel: number`
  - `IAlphaStrikeEdition.playRules: { heatLowersTmm: boolean; weaponHitToMinimal: boolean; vehicleEngineHitHalvesTmm: boolean }`
  - `getAlphaStrikeEdition(tag: string | undefined): IAlphaStrikeEdition` (unknown tag → default)
  - `getAlphaStrikeRulesLevelOptions(tag: string | undefined): IRulesLevelOption[]`
  - `alphaStrikeEditionAllowsConstruction(tag: string | undefined, rulesLevel: number | undefined): boolean` (undefined level → true)

- [ ] **Step 1: Run the QSR compare.** Write `scratchpad/qsr-compare.py`, which normalises whitespace and diffs the rules text of `AlphaStrikeQuickStartRules-CGL-2015.txt` against `AlphaStrike-CGL-2015-Corrected2ndPrinting.txt` pp.10-21 (use the extract's page footers). Run the same diff for the box-set QSR against ASCE. Record each result in a code comment above the `levels` entries: "identical" or the list of rule differences. If the two 2013 texts differ in a rule, levels 0 and 1 stay two entries. If they do not, level 0 cites the QSR and notes it is the same rule set.
- [ ] **Step 2: Write the failing tests.**

```ts
it("offers both Alpha Strike editions", () => {
    expect(getSelectableAlphaStrikeEditions().map(e => e.tag)).toEqual(["alpha-strike", "alpha-strike-commanders-edition"]);
});
it("2013 plays heat without the TMM step, weapon hits to 0, vehicle engine hits keep TMM", () => {
    expect(getAlphaStrikeEdition("alpha-strike").playRules).toEqual({ heatLowersTmm: false, weaponHitToMinimal: false, vehicleEngineHitHalvesTmm: false });
    expect(getAlphaStrikeEdition("alpha-strike-commanders-edition").playRules).toEqual({ heatLowersTmm: true, weaponHitToMinimal: true, vehicleEngineHitHalvesTmm: true });
});
it("an unknown tag is the Commander's Edition", () => {
    expect(getAlphaStrikeEdition("nope").tag).toBe("alpha-strike-commanders-edition");
});
it("names the Alpha Strike levels and forbids building below Standard", () => {
    expect(getAlphaStrikeRulesLevelOptions("alpha-strike").map(o => o.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(getAlphaStrikeRulesLevelOptions("alpha-strike")[1].name).toBe("Introductory Alpha Strike");
    expect(alphaStrikeEditionAllowsConstruction("alpha-strike-commanders-edition", 1)).toBe(false);
    expect(alphaStrikeEditionAllowsConstruction("alpha-strike-commanders-edition", 2)).toBe(true);
    expect(alphaStrikeEditionAllowsConstruction("alpha-strike", undefined)).toBe(true);
});
it("lists every printing and errata the issue names, latest last", () => {
    expect(getAlphaStrikeEdition("alpha-strike").printings.map(p => p.name)).toEqual(
        ["1st printing", "Corrected 2nd printing", "Errata v2.3", "Errata v2.3.1", "Errata v2.4", "Errata v2.5"]);
    expect(getAlphaStrikeEdition("alpha-strike-commanders-edition").printings.map(p => p.name)).toEqual(
        ["1st printing", "Corrected 2nd printing", "Corrected 3rd printing", "Corrected 5th printing", "2024 printing", "Errata v6.0", "Errata v7.0", "Errata v7.0.2"]);
});
```

- [ ] **Step 3: Run them.** `npx vitest run --project unit src/data/rules-editions.test.ts` fails on the missing names.
- [ ] **Step 4: Implement.** Use the audit table for the values. `levels`:
  - 2013: `{0,"Alpha Strike Quick-Start Rules","ASQS",1}`, `{1,"Introductory Alpha Strike","AS",10}`, `{2,"Standard Alpha Strike","AS",22}`, `{3,"Advanced Options","AS",62}`, `{4,"Experimental","AS",62}`.
  - ASCE: `{0,"Quick-Start Rules","ASQSB",1}`, `{1,"Quick-Start Rules","ASQSB",1}`, `{2,"Standard","ASCE",22}`, `{3,"Optional Rules","ASCE",136}`, `{4,"Experimental","ASCE",136}`.
  - Add the `ASQS`/`ASQSB` book codes wherever the app maps book codes to titles (grep `"ASCE":` in `src/data`).
  - Set `complete: true` on 2013. In the `printings` notes, record the 1st printing's PV multiplier table and the leftover multiplier table on 2015 p.167.
  - `getSelectableAlphaStrikeEditions` already returns complete editions, so it needs no change.
- [ ] **Step 5: Run the tests.** They pass. Run the whole `rules-editions.test.ts` too, since the carry-forward tests iterate the editions.
- [ ] **Step 6: Commit.** `feat(as): Alpha Strike 2013 edition entered: printings, levels, play rules (#646)`

### Task 2: Unit play by edition

**Files:**
- Modify: `src/classes/alpha-strike-unit.ts` (`calcCurrentValues` ~1077-1720, `calculateDamage` ~1728)
- Test: `src/classes/alpha-strike-unit.test.ts`

**Interfaces:**
- Consumes: `getAlphaStrikeEdition(tag).playRules` (Task 1).
- Produces: `AlphaStrikeUnit.playEdition: string`, defaulting to `DEFAULT_ALPHA_STRIKE_EDITION`. It is not saved on the unit; the force sets it.

- [ ] **Step 1: Write the failing tests.** Each test builds a unit with the existing test helper, sets `playEdition`, and calls `calcCurrentValues()`.
  - `heat 2 takes 1 off the TMM under ASCE only`: a BM with Move 10" (TMM 2) at heat 2 gives `currentTMM` "1" under ASCE and "2" under `alpha-strike`.
  - `a weapon hit takes 1 to 0* under ASCE and to 0 under 2013`: damage 1/1/0* with one weapon hit gives `currentDamage.short` 0 with `shortMinimal` true under ASCE. Under 2013 it gives 0 with `shortMinimal` false, and the long 0* becomes 0 with `longMinimal` false under both.
  - `a vehicle engine hit halves TMM under ASCE only`: a CV with Move 12" (TMM 2) and one engine hit gives TMM "1" under ASCE and "2" under 2013. The Move is 6" under both.
  - `the default edition plays as today`: no `playEdition` set gives the same numbers as the ASCE cases.
- [ ] **Step 2: Run them.** `npx vitest run --project unit src/classes/alpha-strike-unit.test.ts` fails under 2013.
- [ ] **Step 3: Implement.** Read `const rules = getAlphaStrikeEdition(this.playEdition).playRules` once at the top of `calcCurrentValues`.
  - Guard the "−1 TMM at OV2 or OV3" block (~1650) with `rules.heatLowersTmm`. Fix its comment to cite ASCE p.53.
  - Guard the vehicle engine-hit TMM halving (~1600) with `rules.vehicleEngineHitHalvesTmm`.
  - Pass `rules.weaponHitToMinimal` into `calculateDamage`. When it is false, `damage - weaponHits` floors at 0 with `minimal` false, and an existing 0* with any weapon hit becomes 0 with `minimal` false.
- [ ] **Step 4: Run the tests.** They pass, along with the whole `src/classes` alpha-strike tests.
- [ ] **Step 5: Commit.** `feat(as): heat TMM, weapon hits and vehicle engine hits follow the force's edition (#646)`

### Task 3: Pilot abilities, command abilities and formations by edition

**Files:**
- Modify: `src/data/alpha-strike-pilot-abilities.ts` (`IASPilotAbility`, `CONST_AS_PILOT_ABILITIES`), `src/data/formation-bonuses.ts` (`IFormationBonus` and each class), the SCA data if the app has it (grep `Special Command`; if none, skip SCA)
- Modify: `src/classes/alpha-strike-unit.ts` (`getPilotAbilities`, `getTotalPilotAbilityPoints`), `src/ui/pages/alpha-strike/roster/_showAlphaStrikeUnit.tsx:141-200` (the three pickers), and the formation picker in `roster/home.tsx`
- Test: `src/data/alpha-strike-catalog.test.ts`, `src/classes/alpha-strike-unit.test.ts`

**Interfaces:**
- Produces:
  - `IASPilotAbility.editions?: { "alpha-strike"?: { cost: number; source: IAbilitySource } | null }`. Absent means the same cost under ASC. `null` means not in ASC (ASCE only). An entry means the ASC cost and page.
  - `IASPilotAbility.droppedByAsce?: boolean` for an ASC ability that ASCE dropped. It gets a record with the ASC source and is offered under ASCE as apocryphal.
  - `getPilotAbilityForEdition(ability: IASPilotAbility, editionTag: string): { cost: number; source: IAbilitySource; offered: boolean; apocryphal: boolean }`
  - `IFormationBonus.editions?: { "alpha-strike"?: { source: IAbilitySource } | null }`, plus `isFormationOffered(f: IFormationBonus, editionTag: string): boolean`

- [ ] **Step 1: Do the compare and record it as data.** Read every SPA entry in ASC (`Alpha-Strike-Companion.txt`, the per-ability text after the table at ~3015; use the errata v1.6 corrections) and in ASCE (pp.92-101, `Alpha-Strike-Commander-s-Edition.txt` ~6051-6260). For each of the 78 records, add its `editions["alpha-strike"]`. Add any ASC-only ability as a new record with `droppedByAsce: true`. Do the same for formation types (ASC force-building chapter against ASCE pp.117-125). Leave a one-line comment per record that differs, citing both pages.
- [ ] **Step 2: Write the failing tests.**
  - `every pilot ability says where the 2013 edition finds it`: each record has `editions?.["alpha-strike"] !== undefined` OR its ASC cost equals its ASCE cost (assert by listing the reviewed ids in a constant `ASC_SAME_AS_ASCE` that the compare fills in).
  - `an ASCE-only ability is not offered under 2013`: pick one the compare finds. `offered` is false under 2013 and true under ASCE.
  - `an ASC-only ability stays offered under ASCE as apocryphal`: if the compare finds one, `apocryphal` is true under ASCE. If it finds none, the test asserts that no record has `droppedByAsce`, with that reason in a comment.
  - `a kept ability not in the edition still counts its points`: a unit whose pilot has an ASCE-only SPA, with `playEdition` "alpha-strike". `getTotalPilotAbilityPoints()` is unchanged, and `getPilotAbilities()` marks it `notInEdition: true`.
- [ ] **Step 3: Run them.** They fail.
- [ ] **Step 4: Implement** the helpers and the data. The pickers list only `offered` abilities for the force's edition, with ASC costs under 2013, and show "(apocryphal)" after an apocryphal one. A held ability that is not offered stays selected, with the label "not in <edition name>". The formation picker filters with `isFormationOffered`.
- [ ] **Step 5: Run the tests.** They pass, along with `npm run test:data`.
- [ ] **Step 6: Commit.** `feat(as): pilot abilities and formations by edition, ASC for the 2013 book (#646)`

### Task 4: The selector, the force level, saves

**Files:**
- Modify: `src/ui/components/rules-edition-select.tsx`. Widen `editions` to `{ tag: string; name: string; year: number }[]` and add an optional `nameOf?: (tag: string) => string` for the stale label. Classic callers are unchanged.
- Modify: `src/classes/alpha-strike-force.ts`. Add `rulesLevel?: number` to `IASForceExport` and the class. Add `setRulesEdition(tag: string)`, which sets `playEdition` on every unit and calls `calcCurrentValues()`. Units are added at ~105 and imported at ~293, so set `unit.playEdition = this.rulesEdition` beside `quirksInPlay` in both places.
- Modify: `src/ui/pages/alpha-strike/roster/home.tsx`. Add the `RulesEditionSelect` (editions from `getSelectableAlphaStrikeEditions()`) and a `RulesLevelSelect` with `options={getAlphaStrikeRulesLevelOptions(edition)}` plus a "No limit" entry for unset, in the force settings next to "Use design quirks".
- Modify: `src/ui/pages/alpha-strike/roster/in-play.tsx`. Show a line with the edition and level ("Alpha Strike (2013), Standard Alpha Strike").
- Test: `src/classes/alpha-strike-force.test.ts`, `src/ui/pages/alpha-strike/roster/home.test.tsx`

- [ ] **Step 1: Write the failing tests.**
  - `an old save plays as before`: import a force JSON with no `rulesEdition`/`rulesLevel` holding a BM at heat 2 with a weapon hit and a CV with an engine hit. Every unit's `currentTMM`, `currentDamage` and `currentMove` equal the values computed before this plan (hard-code them from a run on the current code). The export has no `rulesEdition` and no `rulesLevel`.
  - `switching edition recalculates at once`: same force, `setRulesEdition("alpha-strike")`. The BM's `currentTMM` goes up by 1 with no other call. Switching back restores it.
  - `edition and level round-trip`: set both, export, and re-import gives the same values.
  - `the roster offers the 2013 edition`: render home and pick "Alpha Strike (2013)". The force's `rulesEdition` is `alpha-strike`.
- [ ] **Step 2: Run them.** They fail.
- [ ] **Step 3: Implement** as in Files.
- [ ] **Step 4: Run the tests.** They pass, along with the Classic `rules-edition-select` users (`npx vitest run --project unit src/ui/pages/classic-battletech`).
- [ ] **Step 5: Commit.** `feat(as): rules edition and rules level selector per Alpha Strike force (#646)`

### Task 5: Levels 0 and 1: load BattleMechs only, no building

**Files:**
- Modify: `src/utils/mulSearchFilters.ts`. Add `filterMULForAlphaStrikeLevel(units: IASMULUnit[], rulesLevel: number | undefined): IASMULUnit[]`. When the level is undefined or 2 or more, it returns the units unchanged. At 0 or 1 it keeps `BFType === "BM"` with `getRulesLevelFromMULRules(Rules) <= 1`. A MUL unit with no Rules value is left out at 0-1.
- Modify: `src/ui/pages/alpha-strike/roster/_AddUnitsPage.tsx`. Apply the filter after `filterMULByRulesets` (~197). Hide the saved-design converters (~663, 727, 791, 860, 930, 1000), the "Manage custom units" link (~310) and the creator link when `!alphaStrikeEditionAllowsConstruction(edition, level)`. Show the note "Levels 0 and 1 load BattleMechs only; building starts at Standard (level 2)." in their place.
- Modify: `src/ui/pages/alpha-strike/unit-creator/home.tsx`. When opened from a force below level 2, show the same note and no editor.
- Modify: `src/ui/pages/alpha-strike/roster/_CurrentForceList.tsx`. Add a "not at this level" badge on a unit whose type is not BM, or whose `rulesLevel` is above the force level.
- Test: `src/utils/mulSearchFilters.test.ts`, `src/ui/pages/alpha-strike/roster/_AddUnitsPage.test.tsx`

- [ ] **Step 1: Write the failing tests.**
  - `level 1 keeps Introductory BattleMechs only`: [BM Introductory, BM Standard, CV Introductory, BM with no Rules] → [BM Introductory].
  - `level 2 and no level keep everything`.
  - `the add-units page hides converters at level 0`: render with a force at level 0. No "Convert" buttons, and the note text is present.
  - `a unit above the force level stays, badged`: a force at level 1 holding a CV shows the badge, and the CV is still in `groups[0].members`.
- [ ] **Step 2: Run them.** They fail.
- [ ] **Step 3: Implement** as in Files.
- [ ] **Step 4: Run the tests.** They pass.
- [ ] **Step 5: Commit.** `feat(as): levels 0-1 load BattleMechs only, building starts at Standard (#646)`

### Task 6: Docs, review, check, ship

**Files:**
- Modify: `src/ui/pages/home.tsx` (the news entry), `docs/` wherever the Alpha Strike editions are described (grep "Commander's Edition" in `docs/`), and the issue body ticks.

- [ ] **Step 1: Write the news bullet.** "Alpha Strike forces pick their rules edition (the 2013 book or the Commander's Edition) and rules level. Play, pilot abilities and formations follow it, and levels 0-1 are the Quick-Start Rules, BattleMechs only."
- [ ] **Step 2: Run the astech whole-branch review on Opus.** Review this plan's diff against the audit table and Calls 1-3. Fix each Important finding test-first.
- [ ] **Step 3: Run `npm run check`.** Expected: typecheck, lint, unit, data and build all green. The two known load-sensitive tests (battlemech-ssw-omni Dire Wolf, campaigns contract-sheet) may time out in the full run; rerun them alone and record that they pass.
- [ ] **Step 4: Ship.** `git push origin bv-gaps:beta`, then `git deploy-beta` (expect "Published"). Comment on #646, in NGCFells's voice (first person, casual), with the commits, the audit table, the QSR compare result and the answers to Calls 1-3. Tick the issue body and close #646.
