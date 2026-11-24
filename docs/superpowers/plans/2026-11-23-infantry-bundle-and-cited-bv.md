# Conventional infantry: bundled MUL designs (#600 round 4c) and cited Battle Value and cost (#599)

Specs: `docs/superpowers/specs/2026-10-25-bundled-mul-designs-design.md` (round 4, conventional infantry) and
`docs/superpowers/specs/2026-11-10-cited-bv-and-cost-design.md` (Order of work, step 8). Reading ledger:
`docs/superpowers/plans/2026-11-10-cited-bv-ledger.md` (Task 6 adds an "Infantry" part). Progress ledger:
`.superpowers/sdd/2026-11-23-infantry-bundle-and-cited-bv/progress.md`.

Order (NGCFells 2026-11-22): per unit type, both issues together; fighters were first (shipped 2026-11-23), infantry
second.

## Audit (2026-11-23)

- MegaMek holds 1,820 infantry BLK files (`unit_files/infantry`), 487 with a `mul id`. The MUL lists 441 infantry.
- There is no infantry BLK reader. `InfantryPlatoon` covers foot, motorized, jump and the three mechanized motives,
  the faction kits and TO:AUE armor (most already carry MegaMek's names in `altNames`), primary and secondary
  weapons, the anti-'Mech kit, Narc and TAG field gear, and BV2 and cost as text logs.
- What the files use that we do not model:
  - **field guns** in 616 files (the `Field Guns Equipment` block: autocannons of every kind, Gauss, rifles,
    artillery such as Thumper and Sniper, with their ammo), TO:AUE pp.122-123 (construction summary) and the Field
    Guns/Field Artillery entry (TO:AUE p.190);
  - **beast mounts** in 89 files (`Beast:<creature>`, 12 creatures), TO:AUE p.107;
  - **specializations** in 127 files (`specialization` bit mask), Specialized Infantry, TO:AUE (index p.255 in the
    extract);
  - **augmentation** in 15 files (`dermal_armor`, `tsm_implant` and others: Manei Domini implants, source to find);
  - motives `Motorized SCUBA`, `Submarine`, `Microcopter` (5 files), TO:AUE;
  - `encumberingarmor`, `armordivisor`, `spacesuit` and the `sneak*` flags: custom armor written as flags.
- 32 weapon names are MegaMek's own (`InfantryAssaultRifle` in 1,034 files, `InfantryHeavySRM`, `InfantryLRM`,
  `InfantryFederatedBarrettM61A`, the `Infantry...Inferno` rounds, `AA Weapon (Mk. 2, Man-Portable)`, ...); they need
  `altNames` on our weapons, each checked against the weapon's own table row, never guessed.
- Battle Value: BV2 is entered (TM / BV v4.1 "Calculating Conventional Infantry BV", worked Anti-'Mech Jump platoon on
  BV v4.1 p.310). BV1 is pending in both Master Rules editions (BMR p.142 table and FanPro errata p.12; BMR(R)
  pp.155-156 table; Maximum Tech p.93 for Level 3).
- Cost: `_calcCost` follows TM pp.276, 282 (plus MT p.40 for Narc and TAG). Field guns, beasts and specializations add
  their own costs (TO:AUE).

## Global constraints

- The rule for the math (spec): every step read on its page; the book's worked examples are tests; a step is `cited`,
  `provisional` with a note, or `source-missing`; no tuning to hit the MUL; misses are shown, not hidden.
- Extract first, page image only when the extract is missing, garbled or in doubt; every page image read goes back
  whole into every printing's extract and `_corrected_pages.md`, pushed.
- Every edition, every rule: anything a file uses that we do not model is built in this round (Tasks 2-4), not left
  as a gap. Removed items stay apocryphal.
- Test-first; condense and extend (existing files: `vehicle-blk.ts`, `blk-unit-import.ts`, `bundled-units*.ts`,
  `infantry-platoon.ts`, `infantry-weapons.ts`, `infantry-armor.ts`, `infantry-platoon.test.ts`,
  `calc-breakdown.tsx`, `bv-accuracy.tsx`, `bv-verdicts.ts`). New file only for the step definitions
  (`src/data/calc-steps-infantry.ts`, like `calc-steps-fighter.ts`).
- Commits, comments and news in NGCFells's voice; no co-author or assistant lines anywhere.
- Usual checklist: TRO (bundled designs carry their file's readout; the MUL search TRO view), record sheet (field
  guns and beasts on the infantry sheet), Classic play (field guns fire as their vehicle weapons with crew loss;
  beasts' to-hit and damage; specializations' effects), Alpha Strike (field guns and beasts in the infantry
  conversion; the custom AS rule applies only at levels 6-7), credits (the About page MegaMek notice names
  infantry), TRO Unit Types (beast-mounted infantry gets its line), news bullet, check, review, deploy, issue
  comments.

## Tasks

### Task 1: the infantry BLK reader (#600 round 4c)
- `importInfantryBlk` in `vehicle-blk.ts` beside the others: name and model, year, tech base and level, motion type,
  squad size and count, primary, secondary and `secondn`, the `Troopers Equipment` armor kit and `AntiMekGear`, the
  armor flags (`encumberingarmor`, `armordivisor`, `spacesuit`, `sneak*`), role, quirks, readout (overview, notes,
  source). Anything this reader cannot carry over is an import issue, so the file is left out and reported.
- `altNames` for the 32 MegaMek weapon names, each checked against its row in the infantry weapons table.
- `BLK_READERS` kind `infantry`; the infantry creator's import accepts it.
- Tests: `blk-unit-import.test.ts` (a foot platoon with a secondary weapon, a jump platoon with the anti-'Mech kit,
  a mechanized platoon with a faction kit, a sneak suit, an unsupported item reported).

### Task 2: field guns and field artillery
- Read TO:AUE pp.122-123, p.190 and the BV and cost pages they point to. Model field guns on `InfantryPlatoon`
  (vehicular weapon tags plus ammo, crew per gun, transport weight, one facing), with export and import, the
  creator UI, the record sheet, Classic play (fire, crew loss) and the Alpha Strike conversion.
- The reader takes `Field Guns Equipment`.

### Task 3: beast-mounted infantry
- Read TO:AUE p.107 (the creature table). The 12 creatures in the files and every other creature on the table, as a
  motive: MP, creatures per platoon, attacker to-hit, weight, cost; creator, sheet, play, Alpha Strike, the TRO Unit
  Types line.

### Task 4: specialized infantry, augmentation and the rare motives
- Specialized Infantry (TO:AUE): every type on the table, read from the bit mask in the file.
- Augmentation: find the source; build it, or mark the step `source-missing` and list the book for the owner.
- Motorized SCUBA, Submarine, Microcopter (TO:AUE).

### Task 5: the bundled infantry
- `BundledType` `infantry`, `BLK_KINDS.infantry` (MUL type 21, check), the Classic MUL search's infantry kind
  gets `bundledTypes: ["infantry"]`, the About page notice.
- `npm run build:bundled -- units`; the report; the size cap test; `infantry-accuracy.json` and an
  `INFANTRY` floor in `MATCHED_FLOORS`.
- Look at it: a bundled platoon opens from the MUL search (View, TRO, Add) and its Alpha Strike card.

### Task 6: infantry BV2 as cited steps
- `INFANTRY_BV2_STEPS` read on the BV v4.1 infantry section (Steps 1-3, Defensive Factors Table p.315, weapons BV
  table p.319, skill table p.314), TO:AUE p.191 (armor kit divisor x 1.5), the stealth defensive factors, field
  guns, beasts and specializations as their pages say.
- `_calcBattleValue` records steps; `getBattleValueBreakdown(edition)`; the log renders from the steps.
- The worked Anti-'Mech Jump platoon (BV v4.1 p.310) checked at every number it prints.

### Task 7: infantry BV1 as cited steps
- BMR p.142 table (and FanPro errata p.12) under `master-rules`; BMR(R) pp.155-156 table and Maximum Tech p.93
  (Level 3) under `master-rules-revised`. Mark both entered once read; the tables' rows as data.

### Task 8: infantry cost as cited steps
- `INFANTRY_COST_STEPS` read on TM pp.276, 282 and the weapon cost table pp.298-301, MT p.40, and the TO:AUE cost
  lines for armor kits, field guns, beasts and specializations. A worked example as a test if a book prints one.

### Task 9: the breakdown view for infantry
- `InfantryCalcBreakdown` in `calc-breakdown.tsx` (the shared `CalcBreakdownToggle`); the infantry creator summary
  and the add-units viewer; MUL BV beside ours for a bundled platoon.

### Task 10: the infantry queue
- Group the misses in `infantry-accuracy.json`, fix root causes test-first with citations, write verdicts (MegaMek's
  calculator run on the same files is the check, as in the fighter round).

### Task 11: close the round
- News bullet, `npm run check`, one Opus whole-branch review, fixes test-first, fetch and merge origin/beta, push
  beta, `git deploy-beta`, comments on #600 and #599 in NGCFells's voice, handoff.
