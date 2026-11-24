# Fighters: bundled MUL designs (#600 round 4b) and cited Battle Value and cost (#599)

Specs: `docs/superpowers/specs/2026-10-25-bundled-mul-designs-design.md` (round 4b) and
`docs/superpowers/specs/2026-11-10-cited-bv-and-cost-design.md` (Order of work, step 8). Reading ledger:
`docs/superpowers/plans/2026-11-10-cited-bv-ledger.md` (a "Fighters" part is added by Task 4). Progress ledger:
`.superpowers/sdd/2026-11-22-fighters-bundle-and-cited-bv/progress.md`.

Order (NGCFells 2026-11-22): per unit type, both issues together; fighters first.

## Global constraints

- The rule for the math (spec): every step read on its page; the book's worked examples are tests; a step is `cited`,
  `provisional` with a note, or `source-missing`; no tuning to hit the MUL; misses are shown, not hidden.
- Extract first, page image only when the extract is missing, garbled or in doubt; every page image read goes back whole
  into every printing's extract and `_corrected_pages.md`, pushed (done for this round: TM p.283 in four printings,
  AT2 pp.46, 53-54, AT2R pp.65, 81, 123; ResourceLibrary 92aba568b and the follow-up commit).
- Test-first; condense and extend (existing files: `vehicle-blk.ts`, `blk-unit-import.ts`, `bundled-units*.ts`,
  `aerospace-fighter.ts`, `fighter-values.test.ts`, `calc-breakdown.tsx`, `bv-accuracy.tsx`, `bv-verdicts.ts`). New
  file only for the fighter step definitions (`src/data/calc-steps-fighter.ts`, like `calc-steps-micro-mech.ts`).
- Commits, comments and news in NGCFells's voice; no co-author or assistant lines anywhere.
- Usual checklist: TRO (bundled designs carry their file's readout; Task 2 checks the MUL search TRO view), record
  sheet (Task 2 checks a bundled fighter's sheet opens), Classic play (unchanged: fighters already play), Alpha Strike
  (bundled fighters convert as saved fighters do; Task 2 checks a card), credits (the About page MegaMek notice names
  fighters, Task 2), news bullet (Task 9), check, review, deploy, issue comments (Task 9).

## Tasks

### Task 1: MegaMek fighter files import (#600 round 4b)
- `importFighterBlk` in `vehicle-blk.ts` beside `importFixedWingSupportBlk`, sharing its equipment and quirk code:
  UnitType `AeroSpaceFighter` and `ConvFighter`; tech base, era, tonnage, engine (BLK codes 0 standard fusion, 1 ICE,
  2 XL / Clan XL, 3 XXL, 5 light, 6 compact... as `COMBAT_ENGINES`), Safe Thrust, VSTOL, heat sinks and type, fuel
  points, armor type and the four arc values, Nose / Left Wing / Right Wing / Aft / Fuselage / Wings blocks, ammo, CASE,
  targeting computer, OmniFighter pods, quirks, readout. Anything this builder lacks (small or primitive cockpit,
  primitive armor and engines) is an issue, so the file is left out and reported.
- `BLK_READERS` kind `fighters`; the fighter creator's import accepts `fighters` and `fixed-wing-support`.
- Tests: `src/classes/blk-unit-import.test.ts` (a Clan fighter with Artemis and CASE, a conventional fighter with
  VSTOL, an OmniFighter, an unsupported cockpit reported).

### Task 2: the bundled fighters
- `BundledType` `fighters` (class `AerospaceFighter`), `BLK_KINDS.fighters` (MUL type 17, not a large craft), the
  Classic MUL search's fighter kind gets `bundledTypes: ["fighters"]`, the About page notice.
- `npm run build:bundled -- units`; check the report; the size cap test.
- Look at it: a bundled fighter opens from the MUL search (View, TRO, Add) and its Alpha Strike card.

### Task 3: accuracy data for every bundled type
- `buildBundledAccuracy` takes the unit type; the units build writes `<type>-accuracy.json` for each type
  (matched, differs with both numbers, not checked); the Battle Value Accuracy page loads every type's file;
  `<TYPE>_MATCHED_FLOOR` per type in `bv-verdicts.ts`; stale-verdict and floor tests per type.

### Task 4: fighter BV2 as cited steps
- `src/data/calc-steps-fighter.ts`: `FIGHTER_BV2_STEPS` read on TM pp.311-313 (procedure, Thunderbird), p.316 (unit
  type modifiers, Speed Factor Table), p.315 (external stores), TO:AUE p.193 (drone operating system), IO:AE p.187
  (Smart Robotic Control System). Support Vehicles (Fixed-Wing, Airship, Satellite) are the Support Vehicle round.
- `_calcBattleValue` records steps; `getBattleValueBreakdown(edition)`; the log renders from the steps.
- Fix, test-first: the drone operating system (weapons x 0.8, final x 0.95, TO:AUE p.193) is not applied today.
- The Thunderbird checked at every number TM p.313 prints.

### Task 5: fighter BV1 (AeroTech 2 and AeroTech 2 Revised) as cited steps
- `FIGHTER_BV1_STEPS` per edition (AT2 pp.53-54 under master-rules, AT2R p.81 under master-rules-revised), with BMR
  p.140 / BMR(R) p.153 Speed Factor and the edition's own item BVs; Clan CASE (AT2R p.65). Mark the AT2 and AT2R
  records entered (no longer pending).
- A hand-worked example as a test, step by step.

### Task 6: fighter cost as cited steps
- `FIGHTER_COST_STEPS` read on TM p.283 (table, image), p.285 (final formula), p.277, p.284, p.286 ('Mechbuster).
- The 'Mechbuster checked at every number the book prints.

### Task 7: the breakdown view for fighters
- `FighterCalcBreakdown` in `calc-breakdown.tsx`; fighter creator summary, the roster's fighter view and the MUL
  search TRO view; MUL BV beside ours for a bundled fighter.

### Task 8: the fighter queue
- Group the misses in `fighters-accuracy.json`, fix root causes test-first with citations, write verdicts.

### Task 9: close the round
- News bullet, `npm run check`, one Opus whole-branch review, fixes test-first, push beta, `git deploy-beta`, comments
  on #600 and #599 in NGCFells's voice, handoff.
