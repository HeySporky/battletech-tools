# Future Wars Printing Alternates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wherever a *Future Wars* original printing and *The Best of Future Wars* (1991) reprint differ in a rule, the
player chooses the printing: each such rule becomes a pair of mutually exclusive Special Rulesets, as Clell Flint's two
construction printings already are.

**Architecture:** Each existing Best-of play ruleset keeps its id (saved units load unchanged) and is renamed "(Best
of Future Wars printing)"; a twin with a new id carries the original printing and shares its `changes` key, so the
registry's clash rule keeps them apart. The play engine takes a `FutureWarsPrinting` argument everywhere a number
differs; tables for the originals are the Best-of tables with the differing rows replaced. Equipment differences go in
one ruleset, "equipment as first printed"; unticked, the equipment plays as the reprint (as COIL-alt will).

**Tech Stack:** TypeScript, React, Vitest (`npx vitest run --project unit` in PowerShell; Bash needs `env -u CLAUDECODE`).

**Spec:** NGCFells 2026-11-17: "mark them as alternates like we do for some of the other things in our rule sets. That
way we can have someone play the original if they want it, or they can play the one from best of"; obvious reprint
misprints follow the original without a ruleset (memory `reprint-vs-original`). Differences: Chunk R ledger in
`.superpowers/sdd/2026-11-12-custom-homebrew-batch/progress.md`; originals read from the page images (FW #9 PDF pp.14-15,
FW #12 PDF pp.12-13, FW #14 PDF p.34, FW #17 PDF pp.39-42; extracts in ResourceLibrary `text/`).

## Global Constraints

- New rulesets: `minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL`, `category: "play"`, `publication: "Future Wars"`,
  `summary` <= 120 characters, a `CHANGE_LABELS` entry for any new `changes` key.
- Names: "Future Wars: Morale (Best of Future Wars printing)" / "Future Wars: Morale (Future Wars #17 printing)"; the
  same pattern for Weapon Malfunctions (#9) and The Long Range Wars (#12). Opportunity Fire and Strategic Movement are
  unchanged (the printings agree).
- Source titles: the twin cites only the original, from `FUTURE_WARS_PLAY_SOURCES` (e.g. "Herb Barents, 'Stand I Say!!!
  Morale in BattleTech', *Future Wars* #17 (1990), pp.36-40"); tags "FW #17", "FW #9", "FW #12".
- Table `page` labels for originals: "FW #17 p.38" style (printed pages: Morale 36-40, Malfunctions 10-11, LRW 12-13).
- User-facing text names NGCFells as decider; a reading NGCFells has not made says "NGCFells to rule".
- Defaults stay the reprint: every new `printing` parameter defaults to `"best-of"`.

## Review Focus

- A saved unit with `fw-morale` ticked loads and plays exactly as before (ids unchanged).
- Ticking the #17 Morale twin while `fw-morale` is ticked is refused as a clash (shared `morale`), both directions.
- A routed 'Mech under the #17 printing stays routed through End Phases (no count-down) until untouched by a new result.
- The play panel shows the Morale / Malfunctions / LRW tools for either printing, reading that printing's tables.
- Power Booster under the original printing never auto-burns-out on a fourth turn running (2 still burns out the system).

---

### Task 1: Registry twins and original tables

**Files:**
- Modify: `src/data/special-rulesets.ts` (rename three, add four rulesets, `CHANGE_LABELS.futureWarsEquipment`)
- Modify: `src/data/future-wars-play-rules.ts` (ids, sources, original tables)
- Modify: `src/utils/future-wars-ruleset-tools.ts` (id constants, `FutureWarsPrinting`, `FUTURE_WARS_PRINTING_IDS`)
- Test: `src/data/future-wars-play-rules.test.ts`, `src/data/special-rulesets.test.ts`

**Interfaces:**
- Produces (in `future-wars-ruleset-tools.ts`): `FW_MORALE_17 = "fw-morale-17"`, `FW_WEAPON_MALFUNCTIONS_9 =
  "fw-weapon-malfunctions-9"`, `FW_LONG_RANGE_WARS_12 = "fw-long-range-wars-12"`, `FW_EQUIPMENT_FIRST_PRINTINGS =
  "fw-equipment-first-printings"`; `type FutureWarsPrinting = "best-of" | "original"`; `type FutureWarsPrintedRule =
  "morale" | "malfunctions" | "longRangeWars"`; `FUTURE_WARS_PRINTING_IDS: Record<FutureWarsPrintedRule,
  Record<FutureWarsPrinting, string>>`.
- `FUTURE_WARS_PLAY_RULESET_IDS` gains the three twin ids (so `getFutureWarsPlayRules(id)` serves them).

- [ ] **Step 1: Failing tests.** `special-rulesets.test.ts`: for each pair, `getRulesetBlock([best], twin)?.kind ===
  "clash"` and the reverse; twin `source.tag` is "FW #17" / "FW #9" / "FW #12"; best-of names end "(Best of Future Wars
  printing)". `future-wars-play-rules.test.ts`: original tables hold the original rows, e.g.
  `row("fw-morale-17", "'Mech results", "13") === "Carry on; enraged: up 1 on the morale scale"`,
  `row("fw-morale-17", "Morale check", "Disorganized / broken / routed")` is "+1 / +2 / +3 to the class's number",
  `row("fw-morale-17", "Infantry modifiers", "Every fourth trooper lost") === "-3"`,
  `row("fw-weapon-malfunctions-9", "Lasers", "16") === "+2 to-hit, +5 heat when used"`,
  `row("fw-weapon-malfunctions-9", "Flamers", "5")` contains "the original prints no row 5",
  the #12 "Modifiers at extended and extreme range" "Ranging" row has no "6 hexes", and its "Option: eight-sided dice"
  table has a row "Weapon Malfunctions" = "A malfunction on a to-hit roll of 2 or 3".
- [ ] **Step 2: Run; expect FAIL** (`npx vitest run --project unit src/data/future-wars-play-rules.test.ts src/data/special-rulesets.test.ts`).
- [ ] **Step 3: Implement.** Original tables = Best-of tables with these rows changed (build them with a helper
  `withRows(tables, title, rows)`; titles and other rows shared):
  - Morale #17: "Morale check" adds row ["Disorganized / broken / routed", "+1 / +2 / +3 to the class's number"];
    "When a 'Mech checks" "Damage spread" -> ["Internal damage spread", "Once three locations have internal damage, every
    time it takes damage"]; results "-5" "Routed until off the board; leaves the battle as soon as it can; no fighting of
    any kind; every friendly unit within 10 hexes and in LOS checks morale", "-4" "Routed until off the board; leaves
    the battle as soon as it can; no fighting", "-3" "Routed until off the board; leaves the battle as soon as it can;
    no firing; physical attacks in defense only, at +8", "13" as in the test; infantry "Every fourth trooper lost" "-3";
    summary: "Results last one turn unless the table says otherwise; a rout lasts until the unit is off the board".
    Page labels "FW #17 p.38" (check), "p.37" (when), "p.38" (results, 'Mech
    modifiers), "p.39" (vehicles), "p.40" (infantry).
  - Malfunctions #9: Flamers "5" -> "No effect (the original prints no row 5; NGCFells to rule)"; Missiles "8" ->
    "... with no firing or jumping, clear it"; Autocannons "3" adds "; it blows up if fired while jammed", "4" ends
    "after 5 turns of firing it stays jammed until repaired at base", "6" "Ammo jam: a Piloting Skill Roll at +1 and a
    Gunnery Skill Roll clear it", "11" "Casing partly jams the ejector: it cannot be cleared; it can still fire, but on a
    to-hit roll of 2, 3 or 4 roll twice on this table"; Lasers "16" as in the test, "17" "Burned out: it can no longer
    be used". Pages "FW #9 p.10" / "p.11".
  - LRW #12: "Ranging" -> "-1 for each turn in a row the same 'Mech fires at the target"; summary drops "that stays
    still or moves 6 hexes or less"; eight-sided table adds the Weapon Malfunctions row. Pages "FW #12 p.12" / "p.13".
- [ ] **Step 4: Run; expect PASS.** Then the whole `src/data` and `src/utils` projects.
- [ ] **Step 5: Commit** `Custom Homebrew: Future Wars printing alternates in the registry (#172)`.

### Task 2: Morale and malfunctions by printing

**Files:**
- Modify: `src/utils/future-wars-ruleset-tools.ts`, `src/classes/battlemech.ts` (~6384-6545)
- Test: `src/utils/future-wars-ruleset-tools.test.ts`, `src/classes/battlemech-best-of-future-wars-play.test.ts`

**Interfaces:**
- Consumes: Task 1 ids and types.
- Produces: `getMoraleBase(classIndex, status?: MoraleStatus, printing: FutureWarsPrinting = "best-of"): number`
  (original adds 1 / 2 / 3); `isMoralePass(classIndex, roll, status?, printing?)`; `getMechMoraleResult(total, printing
  = "best-of")` with `IMoraleResult.untilOffBoard?: true` (#17 rows -5, -4, -3; no `turns`) and `scaleRise?: number`
  (#17 row 13: 1); `getMalfunctionEffect(table, roll, printing = "best-of")` (#9: laser 16 `{toHit: 2, heat: 5}`, ac 11
  `{}` not out, flamer 5 no effect); `BattleMech.getFutureWarsPrinting(rule: FutureWarsPrintedRule): FutureWarsPrinting
  | undefined`; `getFutureWarsPlayRulesets()` lists twin ids in the slot of their Best-of ids.

- [ ] **Step 1: Failing tests.** Tools: `getMoraleBase(2, "broken", "original") === 8`, `getMoraleBase(2, "broken") ===
  6`; `getMechMoraleResult(-4, "original")` has `untilOffBoard: true`, `turns: undefined`; `getMechMoraleResult(13,
  "original").scaleRise === 1`; `getMalfunctionEffect("laser", 16, "original")` toHit 2 heat 5;
  `getMalfunctionEffect("ac", 11, "original").out === false`. BattleMech (with `fw-morale-17` ticked): a broken
  Regular passes on 8, fails on 7; a -4 result keeps `status` after three `endTurn`s; a 13 raises Regular to Veteran
  (classIndex 3, at most 5).
- [ ] **Step 2: Run; expect FAIL.**
- [ ] **Step 3: Implement.** BattleMech reads the printing with `getFutureWarsPrinting`; every
  `hasFutureWarsRuleset(FW_MORALE | FW_WEAPON_MALFUNCTIONS | FW_LONG_RANGE_WARS)` call (battlemech.ts, utils.ts:1023,
  the roster panel) becomes `getFutureWarsPrinting(...) !== undefined`; status gains `untilOffBoard`, which the End
  Phase count-down skips; `rollMorale` passes the status to `isMoralePass`; messages cite "FW #17 p.38" / "FW #9 p.11"
  under the original.
- [ ] **Step 4: Run; expect PASS** (tools, battlemech FW tests, `src/utils.test*` to-hit).
- [ ] **Step 5: Commit** `Custom Homebrew: play the original Future Wars Morale and Weapon Malfunctions (#172)`.

### Task 3: Equipment as first printed

**Files:**
- Modify: `src/data/special-rulesets.ts` (ruleset `fw-equipment-first-printings`, `changes: ["futureWarsEquipment"]`,
  label "Future Wars equipment rules"), `src/utils/future-wars-play.ts`, `src/classes/battlemech.ts`,
  `src/ui/pages/classic-battletech/roster/_futureWarsPlay.tsx` (reminders)
- Test: `src/utils/future-wars-play.test.ts`, `src/classes/battlemech-best-of-future-wars-play.test.ts`

**Interfaces:**
- Produces: `getPowerBoosterRoll(turnInARow, roll, printing = "best-of")` (original: 2 or less burns out the system;
  fails on 5 / 9 / 11 or less for turns 1 / 2 / 3 and later; no fourth-turn burnout; the later-turn reading is
  "NGCFells to rule"); `getInfernoGaussAmmoCrit(shellsLeft, hasCASE, printing = "best-of"): { heat: number; damage:
  number }` (best-of: heat 30/20 + shells, damage 0; original: heat 30/20, damage = shells); `getLRFlamerAmmoHit(roundsLeft):
  { damage: number; heat: number }` = 2 and 3 a round; `getPDSHeat(printing)` 1 / 0.

- [ ] **Step 1: Failing tests.** `getPowerBoosterRoll(4, 7, "original") === "failed"`, `(4, 12, "original") ===
  "boosted"`, `(4, 12) === "system-burned-out"`; `getInfernoGaussAmmoCrit(8, false, "original")` = {heat 30, damage 8};
  `getLRFlamerAmmoHit(5)` = {damage 10, heat 15}. BattleMech with the ruleset ticked: a PDS's heat is 0 in
  `getWeaponHeat()` and in BV2's heat trace; an Inferno bin hit with 8 shells adds 30 pending heat and 8 damage to the
  location; a LR Flamer fuel hit with 5 rounds does 10 damage (CASE as for any explosion) and 15 pending heat.
- [ ] **Step 2: Run; expect FAIL.**
- [ ] **Step 3: Implement.** PDS heat: one getter `BattleMech._futureWarsItemHeat(item)` used where weapon heat is
  summed (`getWeaponHeat`, `getActiveWeaponHeat`, BV2 heat at ~1454 and ~1845, record-sheet heat); the item records stay
  as they are. Inferno and LR Flamer ammo: branch in the critical-hit ammo path (~7420), damage through the same step
  the generic explosion uses. Swing Fire: reminder text adds the original's three rules ("swinging takes a turn; on
  AeroTech maps it fires into the front or rear arc; a critical hit on its own slot stops the swing") with no engine
  change. Reminders cite "FW #14 p.46" etc. when the ruleset is ticked.
- [ ] **Step 4: Run; expect PASS.**
- [ ] **Step 5: Commit** `Custom Homebrew: Future Wars equipment as first printed (#172)`.

### Task 4: Panel, notes, readout, ship

**Files:**
- Modify: `src/ui/pages/classic-battletech/roster/_futureWarsRulesetTools.tsx` (panel map ~275: twin ids map to the same
  bodies, titles "Morale (FW #17)"), equipment `notes` in `ammo-custom.ts`, `ballistic-custom.ts`,
  `best-of-future-wars-conversions.ts` ("NGCFells to rule" lines become "the original's rule is the 'equipment as first
  printed' ruleset"), `docs/lore/best-of-future-wars-tro.md` (a closing "Two printings" section listing what each
  alternate changes), `src/ui/pages/home.tsx` (Nov 17 news bullet), plan `2026-11-17-future-wars-originals.md` (Chunk
  R2 ticked).
- Test: `src/ui/pages/classic-battletech/roster/_futureWarsRulesetTools.test.tsx`, `tro-jbt.test.tsx`

- [ ] **Step 1: Failing tests.** Panel: a 'Mech with `fw-morale-17` shows the Morale tools and its check box reads
  "8" for a broken Regular; with `fw-weapon-malfunctions-9`, recording laser 16 shows "+2 to-hit". Readout contains
  "Future Wars: Morale (Future Wars #17 printing)".
- [ ] **Step 2: Run; expect FAIL.**
- [ ] **Step 3: Implement** the panel map, notes and readout section.
- [ ] **Step 4: `npm run check`** (PowerShell): 0 errors, all tests pass, build OK. Chromium: tick each twin in the
  Special Rulesets window (clash shown), open roster play, run one morale check under #17.
- [ ] **Step 5: Commit** `Custom Homebrew: choose the Future Wars printing in play (#172)`, push beta, `git deploy-beta`,
  ledger "Chunk R2" in the progress file, handoff block (opens with the FIRST: memory/rules/guidelines line).
