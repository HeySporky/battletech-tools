# Future Wars: DropShip Construction, Four Methods (#172)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan. One task per
> session or several, each ending green with a commit; steps use checkbox (`- [ ]`) syntax. Model: Opus 5.5.

**Goal.** Each of the four *Future Wars* DropShip construction methods becomes its own Special Ruleset on the DropShip
creator, so a player can build a DropShip by Stock's, Stock + Eid's, Reese's or Houseman's rules instead of the
TechManual's. NGCFells 2026-11-17 (Q1): "I want them all."

**Source of every rule below:** the ledger section "Future Wars Chunk G" in
`.superpowers/sdd/2026-11-12-custom-homebrew-batch/progress.md` (local), read from the page images:

| Ruleset | Article | Credit |
|---|---|---|
| `fw-dropships-stock` | Mark Stock, "Dropship Construction" | *Future Wars* #16 (1990) p.32; reprinted in *The Best of Future Wars, Volume One* (1991) p.7 |
| `fw-dropships-eid` | Erik Eid, "Deluxe Dropship Construction" (based on Stock's) | *Future Wars* #25 pp.6-7 |
| `fw-dropships-reese` | Mike Reese, "More Drop Ship Construction" / "BattleTech Drop Ship Construction" | *Future Wars* #36 pp.14-21 |
| `fw-dropships-houseman` | Doug Houseman, "Designing a Dropship" (written 1991) | *Future Wars* #36 pp.22-23 |

The Best-of reprint of Stock's article prints the same rules (reworded intro; step 8's "17 and up" printed "17 to
25", inside the original's own 10-25 range), so Stock has one ruleset, not a printing twin (memory: reprint vs
original). Year of FW #25 and #36: read each issue's cover or masthead in Task 1 (not yet read).

**What the canon test showed** (ledger table): none of the four rebuilds the canon Leopard, Union or Overlord at
its canon tonnage. Stock + Eid comes closest (Leopard 88 t over, Union 268 t, Overlord 1,146 t); Reese's 20-30
burn-days of fuel add thousands of tons (his own Union came to 8,437 t); Houseman's percentages overshoot most. The
methods are built **as their authors wrote them**, not tuned to canon; the readout prints the table and says so.

## Questions for NGCFells (one message; tasks that depend on an answer say so)

1. **Stock's "look in DS/JS" steps** (thrust points a ton, burn-day consumption, crew count, armor points a ton). (a)
   A table of every DropShip in *DropShips and JumpShips* (type, tonnage, those four values), the creator using the
   ship of the same type nearest in tonnage, as Stock wrote; or (b) the player types each value. Recommendation: (a),
   with the chosen ship named on the sheet.
2. **The Pioneer's engine.** Its sheet prints 990 t; Stock's own step 3 gives 780 t for 3,900 t at thrust 3 (Stock
   said the editor cut and reworded the article, FW #21). As a sample: as printed with a note, or rebuilt to the rule?
   Recommendation: rebuilt to the rule, with the printed 990 t in the notes.
3. **Houseman's integrity table stops at 8** (24% of mass); the canon Union has SI 11 and the Overlord 18. Extend it
   at 3% a point ("Inspired by", NGCFells's extrapolation), or cap integrity at 8 under his rules? Recommendation:
   extend, labelled.
4. **Reese's tonnage from a model's volume** (shapes in cm at 1/285, x 23.1 x 0.07). Build the volume calculator into
   the creator, or let the player type the tonnage and quote the method in the notes? Recommendation: a small
   calculator (box, cylinder, cone, sphere, wing triangle) that fills the tonnage; typing stays allowed.
5. **Samples.** Bring in Stock's Pioneer (models A, B, C) and Reese's UNION-12, THUNDERWOLF and GOLIATH-R? Reese's
   UNION-12 is "First Introduced 3008, EII Industries, UR System", which ties to Ellena Industries (FW #24).
   Recommendation: yes, read every value from the sheets; a sheet that breaks its own rules is a finding, not a fix.
6. **Values.** Battle Value and cost by the edition's rules on the design as built (as for Flint's 'Mechs), with Eid's
   cost rule (new: the builder's choice; salvaged 40%; destroyed half of salvaged) shown as a note under his ruleset?
   Recommendation: yes.

### NGCFells's answers (2026-11-19)

1. "Lets do the work for them. Set up formulae based on weight, type, etc." Stock's "look in DS/JS" values (thrust
   points a ton, burn-day consumption, crew, armor points a ton) come from **formulae fitted to every DropShip in
   DS&JS** by tonnage and type (aerodyne / spheroid), not a nearest-ship lookup and not typed. Each formula is
   NGCFells's extrapolation ("Inspired by"), printed with the DS&JS table it was fitted to and its fit error. The
   player may still override a value (the sheet then says "set by the builder").
2. "Stick to the rule and put the 990 in notes." The Pioneer sample is built to Stock's rule (engine 780 t); its
   notes say the sheet prints 990 t.
3. "Extended it, label as mine, go out as large as needed to cover all dropships of whatever size." Houseman's
   integrity table becomes its rule with no cap: per point 3% of mass, 10 internal structure, 20 maximum armor, 1 g of
   acceleration. Rows past 8 are labelled NGCFells's extension ("Inspired by" Houseman). It runs past the highest SI
   of any DS&JS DropShip; a build whose percentages pass 100% of mass is an issue, not a cap.
4. "Yes, calc with typing allowed too." Reese's volume calculator (box, cylinder, cone, sphere, wing triangle, at
   1/285: cm3 x 23.1 x 0.07) fills the tonnage; the tonnage field stays typeable.
5. "Yes, all of those plus any we build to verify the math." Samples: Pioneer A, B, C (FW #16), UNION-12,
   THUNDERWOLF, GOLIATH-R (FW #36), plus the canon verification builds (Leopard, Union, Overlord under each method),
   all read from the corrected extracts (ResourceLibrary 6ccff7bda, d2953fb4e).
6. "Yes." BV and cost by the edition's rules on the design as built; Eid's cost rule as a note under his ruleset.

Sheet facts read since the plan was written (page images, extracts corrected): the Pioneer sheet's First Introduced
is 2989 (the hand's 9 looks like a 7; compare its "Brigadier 3900 QUAD" drive), consumption 2.98 t/day; the
THUNDERWOLF is 404 t, thrust 2/3, SI 3, four 12.75 t engines, 100 TP/t, first introduced 3015 EII Industries; the
GOLIATH-R 23,413 t, 3/5, SI 5, first introduced 2705 (Norton 40 series drive), 2,630 t conversion gear.

## Global constraints

- Every ruleset: `summary` (at most 120 characters), `category: "construction"`, `source` (title with the original
  issue, year and page; `publication: "Future Wars"`; `tag`: "FW #16", "FW #25", "FW #36"; `author`),
  `minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL`, `changes: ["dropshipConstruction"]` (one method at a time), and a
  `CHANGE_LABELS` entry `dropshipConstruction: "DropShip construction"`. Eid's ruleset is standalone (it includes
  Stock's steps; no `requires`).
- A method applies only to a DropShip (`isDropShip()`), not a Small Craft, and not a Primitive DropShip (refused with
  an issue: the Primitive rules are the TechManual's). The TechManual path stays byte-for-byte as it is: a regression
  test builds every bundled DropShip and compares its weights before and after.
- Where we fill a gap (a band the author left open, a choice he left to the builder), the note says "Inspired by" and
  names NGCFells as the one who decided (memories: homebrew credit, credit NGCFells). Never "ours" or "the app".
- Numbers in tests come from the pages (ledger), not from the code under test. Vitest runs in PowerShell only.
- Non-canon: such a DropShip is refused by the MegaMek/SSW exporters (existing rule), saved in the app's JSON.

## Task 1: Rulesets and tables

**Files:** `src/data/future-wars-dropships.ts` (new), `src/data/special-rulesets.ts`, tests beside them.

- [ ] Read the covers of FW #25 and #36 for their years; fill the four `source.title`s.
- [ ] The four rulesets and the `CHANGE_LABELS` entry. Test: ticking any two is a clash ("both change DropShip
  construction"); each is offered only at Custom Homebrew.
- [ ] Tables as literal arrays, each with its page in a comment: Eid Charts A-D (FW #25 p.7); Reese's extended Charts
  A, C, D and Chart B (FW #36 p.18); Houseman's integrity, armor, docking and quarters tables (FW #36 pp.22-23).
  Test every row against the ledger.
- [ ] Q1: the DS&JS DropShip table (type, tonnage, thrust, thrust points a ton, burn-day, crew, armor points a ton,
  bridge) parsed from the corrected extract, each row with its page; the fitted formulae beside it with their error
  per ship, labelled NGCFells's extrapolation. Test: each formula against the table within its stated error.
- [ ] Q3: Houseman's integrity rule uncapped (rows 1-8 his, past 8 NGCFells's), tested at 1, 8, 11 and 18.

## Task 2: The four methods as pure functions

**Files:** `src/data/future-wars-dropships.ts`, `src/data/future-wars-dropships.test.ts`.

One function per method taking the design's inputs (tonnage, shape, thrust, SI, fuel tons, bays, doors, quarters,
people, vehicles, weapons tonnage, the method's own choices) and returning weighed lines plus issues.

- [ ] Stock: engine `t / (15 / thrust)`; SI `si x t / 100`; bridge 1-10 x crew (player's multiplier); engine heat
  sinks `engine / divisor`, divisor 10-25 chosen in the band for small (10-12), medium (13-16) or large (17-25)
  engines (the size bands are not defined in the article: NGCFells to name them, else the player picks the divisor);
  cubicles 150 t; 'Mech, fighter and cargo doors 5 t each; vehicles 100 / 50; people 5 / 10 / 2 / 3 / 3 / 5.
- [ ] Eid: engine `t / (16 / thrust)`; overthrust 1.5 x; SI above overthrust; Chart A; burn-day 1.84 under 15,000 t,
  else the player's figure up to about 9; bridge `t x 0.0075`; free sinks `floor(engine / Chart B)`; Charts C/D;
  cubicles 150 t, doors weightless, at most 8 (5 with ferro-aluminum), cargo doors unlimited (10 with ferro-aluminum);
  people 5 / 10, infantry +2 / +3; minimum crew 2 pilots, 4 engineers, 3 second engineers; the advanced-tech list as
  issues (no C3, no TSM, no MASC, no Endo II, no targeting computer, no AP pods, no Thunder; CASE a ton of ammo).
- [ ] Reese: as Eid, plus SI from overthrust to 3 x overthrust; fuel `days x 1,440 / Chart A`, days 20-30; bridge at
  most 25 t; extended charts; vehicle bays 100 t (over 50 t) / 50 t (two small in a 100 t bay); people 5 / 10 / 7 / 8;
  at most 8 combat doors, cargo doors counted; Clan: XL engine half weight, half the ship's weight for Chart A, double
  heat sinks, Clan weapons +2 to hit (a sheet note); several engines, each armored.
- [ ] Houseman: SI 3% of mass a point; hull 5% / 10%; internal power 2%; thrusters 3 t a thrust point a 100 t (thrust
  at most integrity, six g crew limit as a warning); fuel 3 t a thrust point a day (player's days); landing 10% / 15%;
  comms 3% (+ hyperpulse 100 t, second computer 5 t, fire control 1 t a weapon, each optional); docking by table;
  quarters table; weapons x1.5; bays and doors by his percentages; cargo 110%; cargo handling 12%; ammo magazine
  200%; drop capsules 25%; launch tubes 200 t; recycling 1%; the 25% limit on c+g+h+j+k+l+m+n+o as an issue.
- [ ] Tests: the ledger's canon table (Leopard, Union, Overlord under each method, assumptions as in the ledger);
  Reese's worked UNION-12 (22,860 t: engine 4,286, SI 2,515, fuel 10,800, bridge 25, 126 free sinks, 53 t armor) and
  his book Union (8,437 t); Houseman's Leopard thrusters (17 x 3 = 51 t a point, 204 t at thrust 4).

## Task 3: SmallCraft integration

**Files:** `src/classes/small-craft.ts`, `src/classes/small-craft-future-wars-dropships.test.ts` (new).

- [ ] `getDropShipConstructionMethod()`: the ticked method, or undefined (DropShip only, not Primitive).
- [ ] Route through it, as the Primitive path does today (`getEngineWeight` line ~531): engine, structure, fuel
  points a ton and burn-day, controls (bridge), free heat sinks, armor points a ton (no SI bonus armor: the TechManual's
  `getBonusArmorPoints` is 0 under a method), bays, doors, quarters, and the method's extra lines (Houseman's hull,
  landing, comms, docking, power, recycling, cargo handling). TechManual-only weights (fuel pumps, fire control,
  gunners) are 0 under a method unless the author has them.
- [ ] Issues from Task 2 appear in the creator's issue list; save and load keep the ruleset and the method's choices
  (new optional fields on `ISmallCraftExport`; absent = TechManual).
- [ ] Regression: every bundled DropShip weighs the same as before with no ruleset ticked.

## Task 4: Creator, sheet and play

**Files:** `src/ui/pages/classic-battletech/small-craft-creator/{chassis,armor,crew,summary,record-sheet}.tsx`,
`src/ui/components/svg/dropship-record-sheet-svg.tsx`.

- [ ] Chassis step: the method's choices (Stock bridge multiplier and divisor; Eid / Reese burn-day; Reese days and,
  if Q4, the volume calculator; Houseman landing type, fuel days, optional comms items, docking).
- [ ] Summary: the weight breakdown in the method's own lines, the ruleset named at the top.
- [ ] Record sheet: a short rules box naming the method and its source; fire factors per arc (Compendium rule as Eid
  and Reese print it: sum of maximum damage / 10, rounding up at .6, +1 per +4 of to-hit bonus) under Stock, Eid and
  Reese. Play is unchanged (the methods change construction only).
- [ ] Checked in Chromium (dev server): build a 3,500 t spheroid under each method, switch between them, reload.

## Task 5: Values, samples, readout, news

- [ ] Values per Q6 (breakdown notes say which rules were used).
- [ ] If Q5: the six sample designs from the sheets (`src/data/future-wars-dropship-samples.ts`), each with its
  issue and page, era from its sheet (Pioneer prototype and introduction 2989, Brigadier Corporation; UNION-12 3008,
  EII Industries, UR; GOLIATH-R 2705; THUNDERWOLF from its sheet), and a test reading each back.
- [ ] TRO - JBT: a "DropShip construction" page in the Best of Future Wars readout (`docs/lore/`), filed under Other
  (DropShips are a CGL unit type): the four methods, credits with the original issue and page, the canon test table,
  and the samples. Test that its numbers match the tables. Link the original scans only where a real URL exists.
- [ ] News line; `npm run check`; commit `Custom Homebrew: Future Wars DropShip construction, four methods (#172)`;
  ff beta, push, deploy beta; ledger; handoff.
