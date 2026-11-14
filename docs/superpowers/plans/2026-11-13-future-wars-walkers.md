# Future Wars Walkers Implementation Plan (#172)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan. The owner's
> execution method is **one chunk per session**, each ending with a commit, a ledger entry and a handoff, and the
> session is cleared before the next chunk. Do not run two chunks in one session. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A Walker (Clell Flint's four-legged 'Mech from *Future Wars*) can be built, saved, printed on its own
record sheet, added to a roster and played, with an Alpha Strike card, under the Custom Homebrew rules level, in
either edition of the rules.

**Architecture:** A unit type of its own (owner ruling 2, 2026-11-13), after the ProtoMech's and the Micro-Mech's
pattern: one class (`Walker`), one construction data file, its own creator pages, record sheet and play panel. It
does **not** subclass or modify `BattleMech`: a Walker has ten locations (four legs; front, rear, left, right and
center torso; a control section with an optional turret), its own structure table, hit table and firing arcs, and
`BattleMech` assumes a head and eight or fewer locations throughout. It reuses the 'Mech **data**: the engine table
(`mechEngineOptions`), gyro, cockpit, heat sink, jump jet and armor records, and the 'Mech equipment catalogs through
`equipment-registry.ts`, so every 'Mech item that makes sense on a Walker is offered (owner ruling 4) with its own
weight, slots, heat and Battle Value.

**Tech Stack:** TypeScript, React, Vitest. No new dependencies.

**Spec:** issue #172, owner rulings of 2026-11-13 (in `2026-11-13-compact-mechs.md`), and the source below. The batch
plan's Global Constraints apply.

**Source:** Clell Flint, in two editions (owner ruling 3: offered as editions):
- `future-wars-11`: *Future Wars* #11 (undated; about 1989-90), "Rules for Building 4 Legged Mechs in BattleTech",
  printed pp.25-27 = PDF 25-27 of `JBTIICRework/magazines/Future Wars/future_wars_11_Qyhm8x.pdf` (a typewriter
  scan: **zero is printed with a slash and looks like 8**; zoom in, `pdftoppm -r 250`). OCR text:
  `ResourceLibrary/text/future-wars-11-Qyhm8x.ocr.txt`, about lines 1460-1560 (its numbers are unreliable).
- `best-of-1991`: *The Best of Future Wars, Volume One* (1991), "Optional Rules for Building Walkers", printed
  pp.36-38 = PDF 45-47 of `Future Wars Magazine - Best of - Future Wars Magazine.pdf`. The default.

Both PDFs are Git LFS objects: in a cloud clone, `git lfs pull --include="<path>"` fetches one. Read every table on
the page image. The batch ledger's "Chunk 5" entry has the full rules summary.

## Editions

One class serves both; every difference is a field of `WALKER_EDITION_RULES`, never an `if (edition === ...)`.
Read each row on both pages before typing it (all were read on 2026-11-13).

| Rule | future-wars-11 | best-of-1991 |
|---|---|---|
| Anti-infantry center-torso weapons: base to-hit | 0 ("Ø", slashed zero) | 8 |
| Variant slots, assault control section | 16 | 14 |
| Immobilized walker, every leg with structure, not knocked down when immobilized | cannot be knocked over except by a 'Mech pushing it, until a leg's structure is gone | not printed |
| Firing arcs | six, by hex face, clockwise: front, right front, right rear, rear, left rear, left front; a hex diagram (p.27) marks F, RS, R, LS and T (turret) | "on the attached firing arc sheet" (not reprinted): use #11's diagram and say so |

Everything else (locations, structure table, turret, hit table, movement, criticals, placement, the other variant
slot counts) is the same in both.

## Rules (both editions; confirm each on the page)

- Locations: right front leg, right rear leg, left front leg, left rear leg, front torso, rear torso, right torso,
  left torso, center torso, control section. (Best-of p.36's list leaves out the rear torso; its slot chart and hit
  table have one, as #11 has. Read in Chunk A.)
- Structure: 10 percent of tonnage. Points by tonnage 10 to 100 in 5-ton steps (center torso / other torsos / legs /
  control section), e.g. 10: 1/2/1/2; 50: 8/10/8/10; 100: 17/19/17/19 (full table on the page).
- Armor: at most 2 x structure in every location.
- Control section: cockpit, life support and sensors, placed as in a 'Mech head. Optional turret: standard rules
  2 slots, 3 t; variant (with the Flint construction ruleset) light 1 slot 2 t, medium 2 / 3, heavy 3 / 4.5,
  assault 4 / 6. Items listed below the turret mechanism on the slot chart are in the turret. The turret counts as
  the control section for damage.
- Engine and gyro in the center torso, as on a 'Mech. Legs placed as 'Mech legs.
- Center torso weapons: machine guns, small lasers and flamers only. They fire only at infantry and vehicles in the
  walker's hex, short range, -2 to hit (base: see Editions). The flamer does not hurt the walker unless the hex burns.
- Slot counts. Standard rules: each leg one table (6), each of the four outer torsos one table (6), the center
  torso and the control section two tables each (12). Variant (leg / outer torso / center torso / control): light
  0-35 t 6/6/8/7; medium 40-55 8/8/10/8; heavy 60-75 10/10/12/12; assault 80-100 12/12/14/(16 or 14).
- Movement: the biped Walking MP x 1.25, a fraction of .25 dropped and other fractions rounded up; Running from that.
  +3 piloting bonus with four working legs. One leg out (hip critical, structure gone, blown off): both bonuses lost,
  moves as a biped. Two out: crawl only. Three or more: no movement. Actuator hits come off the current base;
  hits on a destroyed leg do nothing (Flint says this also holds for bipeds; it is not applied to `BattleMech`).
- No punches. Kicks in any direction while all four legs are intact; none after a leg is lost.
- Hit location table (2D6; columns Right Front/(Rear), Front/(Rear), Left Front/(Rear)): copy it from the page.
  Infantry and vehicles in the hex use the Front/(Rear) column, front or rear at random, and a control hit is a
  center torso hit.

**Ours (the text is silent), labelled as ours in the notes and the ledger:**
- Jump jets: allowed, in legs and outer torsos, by the 'Mech rule (TechManual), since Flint neither allows nor bans them.
- Tonnage 10 to 100 (the structure table's range). No superheavy, no industrial, no OmniWalker in the first build.
- Engines that need side-torso slots (XL, XXL, Light, Clan XL) put them in the left and right torsos; a Compact
  engine and every gyro type are allowed. Torso-mounted, small and drone cockpits are not offered.
- Which arcs each location fires into beyond the text (front and rear torso: front and rear; left and right torso:
  the two arcs on their side), and how an attack's direction picks a column: the 'Mech attack-direction rule, with
  Flint's six arcs. Chunk F reads the #11 diagram and fixes this before code.
- Battle Value and cost: the 'Mech procedures (TechManual BV2; the BV1 editions where the user picks one) run over the
  walker's locations, marked **provisional** with a note "Battle Value by the BattleMech rules applied to a
  Future Wars Walker; not published". The 1.25 movement and the +3 piloting bonus count in the defensive factor
  through the movement they produce; no other walker step.

## Global Constraints

- Every Walker is Custom Homebrew. The creator is offered only at that level or above; a saved Walker opens and
  prints below it.
- Credit on the creator page, the record sheet and the TRO: "Walker rules by Clell Flint, *Future Wars* #11; reprinted
  in *The Best of Future Wars, Volume One* (1991)", naming the edition in use.
- No Walker is written to a MegaMek or Solaris Skunk Werks format. No kept bundled design may change.
- Failing test first. `npx vitest run --project unit src/classes src/data src/utils`, then `npm run check`.
- Commit and push (`beta` at home; the session branch in a cloud session). Ask before any deploy or news entry.

## Session protocol (every chunk)

As in the batch plan: read the handoff, this plan and the ledger; do the first chunk not marked done; test, commit,
push; append to the ledger what was built and every call that was ours; rewrite the top block of the handoff; stop.

**Order with the Compact 'Mech plan:** that plan's Chunk B (the construction ruleset) must be done before this plan's
Chunk A, which reads `usesFutureWarsConstruction` for the variant slot counts.

## Models

| Chunk | Work | Model |
|---|---|---|
| A | Construction core: class, locations, structure, armor, engine, gyro, control section, save format | Opus 5.5 |
| B | Equipment mounting, the center-torso limit, turret, heat sinks, jump jets, ammunition | Opus 5.5 |
| C | Cost and Battle Value (provisional) | Fable 5.2 |
| D | Creator pages, saves, menus | Sonnet 5.5 |
| E | Record sheet, print, roster, TRO | Sonnet 5.5 |
| F | Play mode: hit table, arcs, legs and movement, criticals | Opus 5.5 |
| G | Alpha Strike ruleset: design it, then the card | Fable 5.2 |
| H | Sample walkers, verify, report | Sonnet 5.5 |

## Review Focus

- A backup or roster holding a Walker opened by a build that predates the type: skipped with a message, not a failure.
- A Walker switched between editions: the assault control section 16 to 14 lists the items that no longer fit; none
  is deleted.
- A Walker built with the construction ruleset, opened after the ruleset was unticked: back to standard slot counts
  with issues, nothing deleted.
- A fourth weapon type in the center torso (a medium laser): refused with the rule's reason.
- Walking MP 3 x 1.25 = 3.75 (round up: 4), 5 x 1.25 = 6.25 (drop: 6), 6 x 1.25 = 7.5 (round up: 8): the rounding rule
  (only a fraction of .25 is dropped; corrected in Chunk A, the plan had 3.75 dropping to 3).
- A destroyed leg's actuator hit does not reduce movement a second time.

---

## Chunk A: Construction core

**Files:** Create `src/data/walker-construction.ts`, `src/classes/walker.ts`, `src/classes/walker.test.ts`. Modify
`src/data/rules-editions.ts` (`RulesEditionUnitType` gains `"walker"`, and `ALL_RULES_EDITION_UNIT_TYPES`) and
`src/data/special-rulesets.ts` (`UNIT_TYPE_PLURALS`).

**Interfaces (produces):**
- `WalkerEdition = "future-wars-11" | "best-of-1991"`, `WALKER_EDITION_RULES`, `WalkerLocation = "rfl" | "rrl" | "lfl" |
  "lrl" | "ft" | "rt" | "lt" | "rrt" | "ct" | "cs"` (rear torso `rrt`, so it never collides with right torso `rt`),
  `WALKER_MIN_TONS = 10`, `WALKER_MAX_TONS = 100`, `walkerStructureTable`, `getWalkerSlotCount(location, tons,
  variant, edition)`, `getWalkerTurret(tons, variant)`.
- `class Walker implements IGameSettingsUnit`, with the ProtoMech's method names where the meaning is the same
  (`getTons`, `setTons`, `getWalkMP`, `setWalkMP`, `getRunMP`, `getEngineRating`, `getEngineWeight`, `getStructure`,
  `getMaxArmor`, `getArmor`, `setArmor`, `getWeightLog`, `getWeight`, `getRemainingWeight`, `getIssues`,
  `getRequiredRulesLevel`, `export`, `import`, `exportJSON`, `importJSON`) plus `getEdition/setEdition`,
  `getWalkerWalkMP()` (the x 1.25 figure), `getEngineType/setEngineType`, `getGyroType/setGyroType`,
  `getCockpitWeight`, `hasTurret/setTurret`, `getSlots(location)`, `getFreeSlots(location)`, `usesVariantSlots()`.
- `IWalkerExport` and `normalizeWalkerExport(raw)`, after `normalizeProtoMechExport`.

- [x] **Step 1: Read** both editions' walker pages and the biped rules they lean on (Best-of pp.35-36, #11 p.24).
  Correct this plan and the ledger wherever the page differs.
- [x] **Step 2: Failing tests:** structure points for every row of the table (it.each); structure weight 10 percent;
  armor maximum 2 x structure everywhere; slot counts standard and variant, per class, per edition (the assault
  control section 16 / 14); the turret's slots and weight, standard and variant; engine rating = tonnage x the
  *biped* Walking MP, weight from `mechEngineOptions`; `getWalkerWalkMP` for 1 to 10 (the rounding rule); gyro weight
  and slots as on a 'Mech (variant: one slot a ton); the control section holds cockpit, life support and sensors
  (variant: by weight class, as the Compact plan's Chunk B places them in a head); tonnage 5 and 105 refused;
  required rules level Custom Homebrew; round trip; `normalizeWalkerExport` rejects junk and reports each clamp; a
  save with no `edition` loads as `best-of-1991`.
- [x] **Step 3: See them fail. Step 4: Implement**, no equipment yet. **Step 5:** unit tests, `npm run check`.
- [x] **Step 6:** Commit `Custom Homebrew: Future Wars Walker construction core (#172)`, push, ledger, handoff.

## Chunk B: Equipment, turret, heat sinks, jump jets, ammunition

**Files:** Modify `src/classes/walker.ts` (+ test).

**Interfaces (produces):** `getEquipment`, `addEquipment(tag, location, inTurret?)`, `removeEquipment`, `getHeatSinks`,
`setHeatSinks`, `getJumpJets/setJumpJets`, `getAmmo`, `getHeat()`, `getEquipmentOffer()` (the 'Mech catalogs at the
user's era, tech and level, minus what a Walker cannot mount).

- [ ] **Step 1:** List in the ledger which 'Mech item kinds are refused and why (owner ruling 4, "any equipment that
  makes sense"): hand- and arm-only items (hatchets, swords, claws, lower-arm items), LAM and QuadVee parts, a
  second cockpit, torso-mounted cockpit, triple-strength myomer only if its rules need arms (read TM). Everything else
  is offered.
- [ ] **Step 2: Failing tests:** a medium laser on a leg, the front torso and in the turret; a medium laser in the
  center torso refused with the rule; a machine gun, small laser and flamer accepted there and flagged
  anti-infantry only; turret items must be in the control section; engine-free heat sinks as on a 'Mech; jump jets
  in legs and outer torsos (ours); ammunition and CASE by the 'Mech rules; slots and weight never exceeded.
- [ ] **Step 3:** Implement, unit tests, `npm run check`.
- [ ] **Step 4:** Commit `Custom Homebrew: Walker equipment (#172)`, push, ledger, handoff.

## Chunk C: Cost and Battle Value (provisional)

**Files:** Create `src/data/calc-steps-walker.ts`; modify `src/classes/walker.ts` (+ test), `src/data/battle-value.ts`.

- [ ] **Step 1: Read** the 'Mech cost table (TechManual) and the BV2 procedure, using the #599 step tables
  (`calc-steps-mech-bv2.ts`, `calc-steps-mech-cost.ts`) for the pages; list in the ledger, one line each, how each step
  reads a Walker's ten locations (structure and armor totals; the turret's cost as a vehicle turret or a 'Mech
  turret: read both, pick, say which).
- [ ] **Step 2: Failing tests** pinning the steps on two hand-built walkers (a 25-ton light and an 80-ton assault),
  not a target number; every step `provisional`.
- [ ] **Step 3:** Implement `getCBillCost`, `getCostBreakdown`, `getBattleValue(edition?)`,
  `getBattleValueBreakdown(edition?)`, `isBattleValueProvisional(): true`; unit tests; `npm run check`.
- [ ] **Step 4:** Commit `Custom Homebrew: Walker cost and Battle Value (#172)`, push, ledger, handoff.

## Chunk D: Creator, saves, menus

**Files:** Create `src/ui/pages/classic-battletech/walker-creator/` (`_router.tsx`, `_statusBar.tsx`, `home.tsx`,
`chassis.tsx`, `equipment.tsx`, `criticals.tsx`, `summary.tsx`), after `protomech-creator/` and the 'Mech creator's
criticals page. Modify `src/dataSaves.ts` (`walkerSaves`, `currentWalker`, `MAX_WALKER_SAVES`, backup and restore),
`src/ui/app-router.tsx`, `src/ui/app-unit-classes.ts`, `src/ui/pages/classic-battletech/_router.tsx`,
`src/ui/pages/classic-battletech/home.tsx`, `src/ui/components/top-menu.tsx`, `src/ui/components/creator-side-menus.tsx`.
Follow every place `ProtoMech` is wired (`grep -n -i protomech` over those files). If the Micro-Mech plan's Chunk D
has landed, follow its wiring instead and share what it shares.

- [ ] **Step 1:** Failing tests: link absent below Custom Homebrew, present at it; a saved Walker opens at any level;
  a backup with `walkerSaves` restores; the edition is chosen first and shown with the credit.
- [ ] **Step 2:** Implement; run the app; build a 50-ton walker with a turret by hand.
- [ ] **Step 3:** Unit tests, `npm run check`, commit `Custom Homebrew: Walker creator (#172)`, push, ledger, handoff.

## Chunk E: Record sheet, print, roster, TRO

**Files:** Create `src/ui/components/svg/walker-record-sheet-svg.tsx` (+ test), `src/ui/components/walker-record-sheet.tsx`,
`walker-creator/record-sheet.tsx`, `roster/_walkerGroupTable.tsx`. Modify `src/classes/battlemech-group.ts`
(`walkers`), `roster/_addMechDialog.tsx`, `roster/_tableGroup.tsx`, `roster/print.tsx`, and the TRO page list
(`creator-tro-configs.tsx`).

The sheet: an armor diagram of the ten locations (top-down: four legs at the corners, the four outer torsos around the
center torso, the control section with its turret ring), structure boxes, the critical tables in sixes with die
numbers (the variant's 7-, 8-, 10-, 14- and 16-slot locations as the Compact plan's Chunk D prints them), the hit
location table, the firing arc diagram (#11 p.27, redrawn), the heat scale, Walk (with the x 1.25), Run and Jump,
the credit, the edition, and the NOT OFFICIAL mark.

- [ ] **Step 1:** Failing tests (the sheet renders in both editions and both slot systems; the roster total includes
  a Walker's BV; an older roster without `walkers` loads).
- [ ] **Step 2:** Implement; print a light and an assault walker and look at both.
- [ ] **Step 3:** Unit tests, `npm run check`, commit `Custom Homebrew: Walker record sheet and roster (#172)`, push,
  ledger, handoff.

## Chunk F: Play mode

**Files:** Modify `src/classes/walker.ts` (+ test), `roster/play.tsx`; create `roster/_walkerPlay.tsx` (+ test), after
`_protoMechPlay.tsx`.

**Interfaces (produces):** `getInPlay`, `resetInPlay`, `applyDamage(location, points, rear?)`, `rollHitLocation(
direction)`, `setSlotHit(location, slot, hit)`, `getWorkingLegs()`, `getPlayMovement()` (four legs: x 1.25 and the
current base; one out: biped; two: crawl; three: none), `getPilotingModifier()` (-3 with four legs, read the sign
convention the 'Mech play code uses), `canKick()`, `isDestroyed()`, and the edition's knock-over rule.

- [ ] **Step 1: Read** the play rules on both pages again; the #11 firing-arc diagram; write the arc and
  attack-direction mapping in the ledger, and the damage transfer order (ours, from the 'Mech rule: a leg to the
  adjacent outer torso, an outer torso to the center torso, the control section to the center torso; say so).
- [ ] **Step 2: Failing tests**, one per rule, the edition rows under both editions.
- [ ] **Step 3:** Implement with a play panel showing the boxes, working legs, movement, modifiers and the hit table.
- [ ] **Step 4:** Unit tests, `npm run check`; play a walker through two lost legs in the app.
- [ ] **Step 5:** Commit `Custom Homebrew: Walker play mode (#172)`, push, ledger, handoff.

## Chunk G: Alpha Strike ruleset (design, then build)

As the Micro-Mech plan's Chunk G: read the Alpha Strike conversion rules for BattleMechs (ASCE / ASC; cite the pages)
and how `BattleMech.getAlphaStrikeStats()` does it; write `docs/superpowers/specs/<date>-walker-alpha-strike.md`
(type code, size, Move with the x 1.25, armor and structure from the ten locations, damage bands, a TUR special for
the turret, a special for the anti-infantry center torso, Point Value), each rule marked "from the conversion rules"
or "ours"; **bring it to the owner in one message**; build only after the answer, the card marked NOT OFFICIAL.

## Chunk H: Samples, verify, report

- [ ] **Step 1:** `src/data/walker-samples.ts` after `pam-samples.ts`: three walkers of ours (light, heavy with a
  turret, assault under the variant slots), each labelled ours. Flint printed no designs; the fanzine's art insert
  (Best-of PDF 37-44) has no stats.
- [ ] **Step 2:** `npm run check`; no bundled design changed.
- [ ] **Step 3:** Comment on #172 with what is in. Ask the owner about shipping.
