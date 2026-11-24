# ProtoMechs: bundled MUL designs (#600 round 5) and cited Battle Value and cost (#599), with the BattleMech leftovers

Specs: `docs/superpowers/specs/2026-10-25-bundled-mul-designs-design.md` (round 4, ProtoMechs) and
`docs/superpowers/specs/2026-11-10-cited-bv-and-cost-design.md` (Order of work). Reading ledger:
`docs/superpowers/plans/2026-11-10-cited-bv-ledger.md` (the "ProtoMechs" part). Progress ledger:
`.superpowers/sdd/2026-11-23-protomechs-bundle-and-cited-bv/progress.md`.

Order (NGCFells 2026-11-22): per unit type, both issues together; fighters, infantry, battle armor and Combat Vehicles went first,
ProtoMechs are this round, with the BattleMech leftovers of #600 and #599.

Ruling for the round (NGCFells 2026-11-23): every gap against the Master Unit List is our bug until it matches, unless a cited rule shows the
list wrong (then a mul-suspect verdict with the page). Where the books are silent, the reading closest to the list is taken, marked inferred,
and listed for NGCFells to review. Nothing stops for an owner call.

## Audit (2026-11-23)

Before: 64 designs kept, 22 files left out (15 BV differs from the MUL, 7 with no MUL entry). MegaMek 0.51.01's own calculator was run
on all 86 files (`BvAll`/`BvProbe` over `unit_files/protomeks`) beside ours and the list's.

| Group | Files | Cause | Outcome |
|---|---|---|---|
| No MUL entry | 7 | The list files the WoR Ultraheavy ProtoMechs under the chassis name alone (Boggart, Boggart 2, Hobgoblin, Hobgoblin 2, Sprite, Sprite 2, Sprite 3). | Matched by name (`MEGAMEK_MUL_IDS`). Five equal the list; Boggart 2 (490, list 497) and Hobgoblin 2 (302, 305) become BV differences. |
| Svartalfa Ultra | 1 | TRO: Prototypes p.91 prints 65 armor points (legs 14, main gun 7); MegaMek's file has 64. | Corrected to the book (`blk-design-corrections.ts`), 540 = the list. Kept. |
| LRM 3 at the first printing's 35 / 5 a ton | 4 | Centaur 192, Basilisk 319, Procyon 3 163, Triton 2 274: the 2007 TechManual and BMR(R) p.155 print the ProtoMech LRM 3 at 35 and 5; the corrected TechManual prints 34 and 4 (p.318). Patching the table closes all four and moves no other design. | mul-suspect, TM p.318 corrected printings. |
| Myomer booster | 3 | TM p.306 adds 1 to the Speed Factor's MP; the list rates Siren 4 and Centaur 4 at the boosted Running MP and Basilisk (Quad) B at neither. | mul-suspect, TM p.306. |
| ProtoMech AC/2 ammunition | 1 | Minotaur 4: the list leaves out the AC/2's ammunition (TO:AUE p.196 prints 4 a ton). | mul-suspect, TO:AUE p.196 and TM p.306. |
| Magnetic Clamp System | 4 | IO:AE p.190 prints its BV as 1; Procyon Z and Roc Z equal the list with it at 0, Centaur Z and Minotaur Z stay 2 and 4 above. | mul-suspect, IO:AE p.190. |
| Unexplained, MegaMek agrees with ours | 4 | Orc 2, Triton 4, Boggart 2, Hobgoblin 2. | mul-suspect, "MegaMek agrees". Listed as rulings. |

After: 70 kept, 16 left out, every one a BV difference with a verdict. Alpha Strike is unaffected (no BV in the conversion).

## Global constraints

- The rule for the math (spec): every step read on its page; the book's worked examples are tests; a step is `cited`, `provisional` with a note,
  or `source-missing`; no tuning to hit the list; misses are shown, not hidden.
- Extract first, page image only when the extract is garbled; every page image read goes back whole into every printing's extract and
  `_corrected_pages.md`, pushed (only those ResourceLibrary files).
- Every edition, every rule: BV1 under the Master Rules, Revised Edition (the first edition with ProtoMechs), BV2 under Total Warfare,
  no Battle Value before them. Removed items stay apocryphal.
- Test-first; condense and extend (existing files: `protomech.ts`, `protomech-construction.ts`, `calc-breakdown.tsx`, `bv-verdicts.ts`,
  `blk-design-corrections.ts`, `bundled-units-build.ts`). One new file for the step tables (`calc-steps-protomech.ts`).
- Commits, comments and news in NGCFells's voice; no co-author or assistant lines anywhere.

## Tasks

### Task 1: the audit and the fixes (done)
- MegaMek calculator on all 86 files; the table above. Fixes: the seven name matches; the Svartalfa Ultra armor.

### Task 2: ProtoMech BV2 as cited steps (done)
- `PROTOMECH_BV2_STEPS` read on TM p.306 (worked Delphyne-2 p.307), the tables of p.316, the equipment tables of pp.317-318, TO:AUE pp.196-197
  and IO:AE p.190. `_calcBattleValue` records the steps; the log is rendered from them. The Delphyne-2 (316) is a test at every figure.
  Provisional steps: the myomer booster's +1 (with the note on the list's reading), the quad melee system, rear weapons, a Glider's defensive factor.

### Task 3: ProtoMech BV1 as cited steps (done)
- BMR(R) pp.153-156: armor + structure / 2 + tonnage + defensive equipment, x the Defensive Movement Factor + 0.1; the weapons with the
  ProtoMech Missile Weapons BV table (`PROTOMECH_BV1_MISSILES`), x the Speed Factor of Running + Jumping MP. TRO 3060 (FanPro) p.195 prints
  the same changes and the BV1 of its eight ProtoMechs (28, 52, 98, 140, 139, 284, 213, 367): all reproduced, tests. Entered for
  `master-rules-revised`; the 1998 Master Rules and the older editions show no Battle Value (no ProtoMechs).

### Task 4: ProtoMech cost as cited steps (done)
- `PROTOMECH_COST_STEPS`: TM p.279 structural rows, IO:AE p.215 Ultraheavy, Quad and Glider rows, TM p.282 tube pricing, TM p.285 final
  multiplier. Prices not read stay "from our records" and provisional.

### Task 5: the breakdown view (done)
- `ProtoMechCalcBreakdown` in `calc-breakdown.tsx` (the shared `CalcBreakdownToggle`); the creator summary and the add-units viewer; the MUL BV
  beside ours for a bundled ProtoMech under BV2.

### Task 6: verdicts, the bundle and the report (done)
- 16 verdicts in `src/data/bv-verdicts.ts`; `MATCHED_FLOORS.protomechs` 70; units-only rebuild (`npm run build:bundled -- units`);
  the bundled-units test pinned at 70 designs.

### Task 7: BattleMech leftovers of #600 and #599 (done)
- The "7 MegaMek BV gaps" (#600): four were fixed in 31d7d90bf; the three where ours stands (Air Car, Brunel Dump Truck (LRM), Interdictor Pocket
  WarShip) now have `megamek-differs` verdicts with their pages (the audit file `megamek-bv-audit.md` was deleted with the Mech accuracy record).
- Off-list MegaMek 'Mechs (Gothic, RISC, Videogame): MegaMek's calculator on all 134 of the custom list's 'Mechs: 125 equal ours. Of the 9 that
  differed: the four RISC designs (BattleAxe BKX-RISC, Emperor EMP-6X, Malice MAL-Y-SH-RISC, Savage Wolf RISC) lacked the RISC Heat Sink Override
  Kit, which MegaMek lists in a header line; imported now, x 1.01 (IO:AE p.190), all four equal. The four Light Blazer designs (Firestarter FS9-HB 746
  against 754, Marauder MAD-3H 1,388 against 1,396, King Crab KGC-0KP 1,891 against 1,893, Phoenix Hawk 'Hammer Hawk' 1,075 against 1,080) differ by
  the Light Blazer's BV, derived at 63 because Gothic p.93 prints none (MegaMek 65): verdicts, ours stands, inferred. The Hobbled Scarecrow
  (1,431 against 1,433): B-Pods as Gauss weapons (TM p.317), verdict.
- The Gothic Deluxe Record Sheets (CGL 2025) print a Battle Value for each Gothic design (FS9-HB 1,067, MAD-3H 1,735, KGC-0KP 1,986): a Gothic
  system's figure, not BV2 (the UrbanMech UM-R60 prints 504 against the list's 187). It belongs to the Gothic edition's plan.

### Task 8: the checklist
- TRO: bundled ProtoMechs carry their file's readout (the BLK reader's TRO fields); the five Ultraheavy designs and the corrected Svartalfa are
  in the bundle, so the roster's MUL search TRO view reads them. Record sheet: unchanged (BV and cost come from the same methods). Play:
  unchanged. Alpha Strike: unaffected (a test of the Delphyne-2 conversion still passes). Credits: the About page notice already names ProtoMechs.
  News: a bullet in the November 23rd entry of `src/ui/pages/home.tsx`.
- `npm run check`; the library write-back of the pages read on images; the deploy and the issue comments are NGCFells's.
