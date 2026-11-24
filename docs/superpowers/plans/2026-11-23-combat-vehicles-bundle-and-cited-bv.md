# Combat Vehicles: bundled MUL designs (#600, the files left out) and cited Battle Value and cost (#599)

Specs: `docs/superpowers/specs/2026-10-25-bundled-mul-designs-design.md` (round 4, Combat Vehicles) and
`docs/superpowers/specs/2026-11-10-cited-bv-and-cost-design.md` (Order of work, step 8: Combat Vehicles are first of
the remaining types). Reading ledger: `docs/superpowers/plans/2026-11-10-cited-bv-ledger.md` (Task 6 adds a "Combat
Vehicles" part). Progress ledger, with the full audit and the probes:
`.superpowers/sdd/2026-11-23-combat-vehicles-bundle-and-cited-bv/progress.md`.

Worktree `C:/repo/btt-beasts`, branch `cv-round` (from `bv-gaps` at 5dd83a736). Order (NGCFells 2026-11-22): per unit
type, both issues together; fighters and infantry are done, Combat Vehicles next.

## Audit (2026-11-23, summary; numbers and file lists in the progress ledger)

- 1,451 MegaMek files in `unit_files/vehicles`; 1,217 are Combat Vehicles (the other 234 are Support Vehicles, their
  own round). The bundle keeps 1,066 (1,033 matched to a MUL BV, 33 with no MUL entry filed as MegaMek custom records)
  and leaves out 151: 113 BV differs, 38 import gaps. No verdict exists for any vehicle.
- MegaMek's calculator on the same files: 1,157 of the 1,179 clean files give our BV. Of the 113 differs, 110 give
  MegaMek's value (the list is the odd one out); 3 differ from both (two gun trailers and the Partisan Hull Defense).
  19 files match the MUL where MegaMek does not, which confirms rulings already in the code.
- BV differs by cause: WiGE from the older books 12 (every WiGE from TR:3145 and later matches); naval 8; Marsden MBT II
  family 3; Daimyo HQ 3; environmental sealing 2; large single cases 16; small (5 or less) 21; the rest about 46;
  differs from MegaMek too 3 (trailers: TM p.308 gives an unmotorized trailer Flanking MP 1).
- Import gaps (38): super-heavy VTOLs given six facings 8; sponson weapons marked "(ST)" with no sponson line 6;
  engineless trailers (engine code 8) 6; Minesweeper 4; Smart Robotic Control System line 3; Clan heavy ferro-fibrous
  2; vehicle Cockpit Command Console 2; Mobile Field Base 2; `ISC3Sensors` 2; `CLImpAmmoSRM6` 1; Off-Road chassis on a
  Combat Vehicle 1; Armored Chassis and Advanced Fire Control on a Combat Vehicle 1. Closing them should add about 24
  matches.
- Silent import losses found through cost: communications equipment always 1 ton (30 files), MASH always one theater
  (6), the drone carrier control system always one size.
- Cost (#599): ours includes ammunition; TM p.282 leaves it out (the 'Mech and fighter rounds already do). Without
  ammunition, 887 of 1,179 clean files equal MegaMek's cost; the 292 others split into Clan CASE (MegaMek charges
  50,000 a CASE, 161), OmniVehicle fixed turret (53), supercharger and VTOL jet booster priced 0 (31), communications
  size (30), AP Gauss price (27), Clan LRM + Artemis IV records (16; ours 390,000 for a Clan LRM 15 + Artemis IV),
  vehicular jump jets (10; ours follows TO:AUE p.223, MegaMek prices none), and smaller groups.
- No vehicle step file exists. The vehicle creator prints the old HTML logs; the add-units viewer shows a vehicle's
  record sheet with no breakdown.

## Global constraints

- The rule for the math (spec): every step read on its page; the book's worked examples are tests; a step is `cited`,
  `provisional` with a note, or `source-missing`; no tuning to hit the MUL; misses are shown, not hidden. MegaMek is a
  cross-check, never the authority.
- Model use (spec, owner 2026-11-10): rules reading and anything that decides a number is done on the strongest model
  (Opus: Task 0, and any reading a task finds it needs); building from the readings is Sonnet; one Opus whole-branch
  review in Task 11, as an Opus `astech` review (NGCFells 2026-11-23 took the "no astech" line out of the #599
  process).
- Extract first, page image only when the extract is missing, garbled or in doubt; every page image read goes back
  whole into every printing's extract (.txt and .raw.txt, each printing from its own PDF) and
  `ResourceLibrary/text/_corrected_pages.md`; commit in ResourceLibrary, keep line endings, do not push.
- Every edition, every rule: anything a file uses that we do not model is built in this round (Tasks 1-4), not left
  as a gap. Removed items stay apocryphal. A book offering an item for an edition makes it available there.
- Test-first; condense and extend (existing files: `src/classes/vehicle.ts`, `vehicle-blk.ts`, `blk-unit-import.ts`,
  `blk-unit-import.test.ts`, `vehicle.test.ts`, `vehicle-blk.test.ts`, `src/data/bundled-units*.ts`,
  `src/data/equipment-misc.ts`, `src/data/ammo.ts`, `src/ui/components/calc-breakdown.tsx`,
  `src/ui/components/vehicle-record-sheet.tsx`, `src/data/bv-verdicts.ts`). New file only for the step definitions:
  `src/data/calc-steps-vehicle.ts` (like `calc-steps-fighter.ts`).
- Vitest from PowerShell: `npx vitest run --project unit <path>`. Never grep `src/data/equipment-*.ts` without piping
  through `cut -c1-200`. No apostrophes in Bash heredocs (write scripts with Write).
- Commits, comments and news in NGCFells's voice, first person, plain; no co-author or assistant lines anywhere.
- The probes in `src/zz-local/veh-*.test.ts` and the ledger's `probes/` are local and git-ignored: never commit them.
- Usual checklist: records (Tasks 1, 4), construction (Tasks 2-4), record sheet (Tasks 2-4: super-heavy VTOL facings,
  trailers, the new items), Classic play (Tasks 2-4: hit locations, towing, minesweeping, field repair, command
  console initiative), Alpha Strike (Tasks 2-4: MSW and MFB specials, trailers; our own conversions only at levels 6-7,
  inferred ones noted), TRO (bundled designs carry their file's readout; the MUL search TRO view, Task 9), TRO Unit
  Types (Task 2: a "Super-Heavy Combat Vehicles" document), credits (the About page MegaMek notice already names Combat
  Vehicles: check), news (Task 11), check, review, deploy, issue comments (Task 11).

## Owner calls (NGCFells ruled 2026-11-23; the Task 0 readings that settle them are in the progress ledger)

1. **Ammunition out of vehicle cost. Ruled: yes.** TM p.282: a unit's cost does not include its ammunition. Leave it
   out and show a loaded cost beside it, as every other unit type does (every bundled vehicle's cost changes; the
   bundle is rebuilt in Task 5).
2. **Clan built-in CASE. Ruled: if any book prices CASE for any unit type, bill it as other units are billed; free
   only if no book does. Read: billed.** TM p.210: units with a Clan internal structure "are presumed to incorporate
   CASE automatically in all locations that store ammunition or explosive equipment". TM p.292 (all four printings):
   "CASE 50,000 (C-F-D) 2476 (TH) / 2825 (CCY)", one row for both tech bases with the Clan introduction date. No page
   makes the built-in CASE free in C-bills (AT2R p.65 says "no cost in mass" only; the TM cost chapter never names
   CASE). So a Clan vehicle pays 50,000 for each location its presumed CASE covers (Task 8; MegaMek charges the same,
   161 files). The 'Mech and fighter costs leave Clan CASE free today: the same ruling reaches them (ledger finding for
   their queue, not this round's code).
3. **Support Vehicles in the shared vehicle code. Ruled: as recommended.** The Support Vehicle-only lines (BAR, fire
   control, the Support Vehicle cost) are `provisional` steps noted "the Support Vehicle round", and the breakdown
   view is hidden for Support Vehicles until that round.
4. **The turret rule changed by printing. Ruled: edition aware, no silent single reading.** TM 2007 (FanPro), the 6th
   printing and BV v4.1: turret weapons are in no arc and always count in full. TM 3rd (2013) and 4th (2020)
   printings, BV v4.0 and BV 2.1 (2017): "always treated as facing forwards". Our rules editions are not per printing
   and nothing selects a printing for BV today, so Task 6 adds a printing alternate for this rule (on the pattern of
   the Future Wars printing alternates, #172): default the current text (TM 6th printing, BV v4.1), the alternate the
   3rd/4th printing and BV v4.0 / 2.1 wording; each BV2 rules edition (total-warfare, battlemech-manual,
   core-rulebook) defaults to the current text, the breakdown names the printing its turret step follows, and the
   choice is saved with the unit.
5. **WiGE in the older books (12 differs). Ruled: confirm, then verdicts. Confirmed:** TW p.199 (WiGE Combat
   Vehicles, To-Hit Modifiers): "Apply an additional +1 target movement modifier when making attacks against airborne
   WiGEs." With TM p.308 ("highest potential target modifier") and the p.316 footnote, a WiGE's Defensive Factor takes
   the +1. Task 10 gives the 12 `mul-suspect` verdicts citing TW p.199 and TM pp.308, 316, noting that the newer books'
   WiGE match.
6. **Files that break the rules. Ruled: as recommended.** Jeep (`ISOffRoadChassis`, a Support Vehicle chassis mod,
   on a Combat Vehicle; no MUL BV), Nike Tank (Armored Chassis and Advanced Fire Control on a Combat Vehicle; MUL 688,
   ours and MegaMek 723), Huitzilopochtli 'Huey' (AAA) and Eldingar (Streak) (heavy ferro-fibrous at a Clan tech level):
   check the printed TRO where the library has it, import as printed with a note and the "illegal as printed" flag
   (`BLK_ILLEGAL_AS_PRINTED`): the Jeep and Nike as Combat Vehicles carrying the Support Vehicle item, the two Clan
   files with the Inner Sphere heavy ferro-fibrous on a mixed chassis.
7. **Older editions' vehicle cost. Ruled: one provisional cost under every edition if BMR/BMR(R) print no vehicle
   cost rule. Read: they print one.** BMR (FASA 1998) p.137 and BMR(R) p.150 print a Vehicle Costs Table with TM
   p.279's formulas for what they cover (Standard, XL and ICE engines, BMR(R) adds Light; structure, controls, heat
   sinks, Standard and Ferro-Fibrous armor, power amplifiers, turret, lift/dive, rotors; the same seven cost
   multipliers; equipment at the edition's own unloaded prices). So under master-rules and master-rules-revised the
   vehicle cost steps cite those pages; only what they do not print (Compact engine, Light in BMR 1998, the newer
   armor types, chassis modifications, jump jets) stays `provisional` with the current price.
8. **Super-heavy VTOLs in the TRO Unit Types page. Ruled: yes.** One new document, "Super-Heavy Combat Vehicles"
   (`docs/lore/super-heavy-vehicles-tro.md`, listed in `tro-jbt.tsx`), covering every super-heavy motive type from
   TO:AUE p.190.

## Tasks

### Task 0: the readings still open (Opus; before the builder starts Tasks 6-8)

Read in the extracts first; page image only if garbled, and write it back (constraints). Record each reading in the
progress ledger under "Readings" with what the page says.

- BV1: BMR (1998) pp.141-142 and the FanPro errata p.12; BMR(R) pp.154-155 (p.154 read in the audit); Maximum Tech
  1999 and Revised pp.90-92 (Level 3 vehicle rules). Check `_calcBattleValue1` line by line against them, including
  the VTOL "Flanking MP twice" reading and the WiGE-as-Hover type modifier (no book has WiGE: `provisional`).
- BV2: TM p.317-318 table daggers for vehicle defensive gear; TO:AUE pp.192-194 (armor type modifiers, chassis mods,
  drone systems, vehicular jump jets); TO:AUE BV addendum tables (7th printing pp.195-197) for the Minesweeper, Mobile
  Field Base and vehicle Cockpit Command Console BVs; TW's WiGE movement (owner call 5).
- Cost: TM p.210 and the CASE cost row (owner call 2); TM weapon and equipment cost tables for AP Gauss, Clan LRM 10/15/20,
  Artemis IV, the Clan targeting computer, MASH (per theater), Remote Sensor Dispenser, Communications Equipment, the
  trailer hitch; Watchdog CEWS (its book); TM p.108 and p.279 for the OmniVehicle fixed turret's cost; the supercharger and
  VTOL jet booster rules (our records cite TO:AUE pp.157 and 162; the 7th printing's combat data table points to
  pp.155-156) beside the p.223 cost row; heat sinks with a fusion engine (TM p.279 "over
  10") against the 10 files that differ.
- Construction: TO:AUE p.190 super-heavy VTOLs (facings, structure per location = tonnage / 10, rotor), TM's trailer
  rules (the TechManual pages the extract finds at indices 99-105) and TO:AUE p.190 ("other than those built as
  trailers, ... at least 1 Cruise MP"); TO:AUE p.138 (Minesweeper), p.142 (Mobile Field Base), the vehicle Cockpit
  Command Console (the p.218 combat data table's reference column gives p.112), p.159-160 (sponson, chin and dual turrets,
  whether an AMS may go in a sponson).
- Older cost (owner call 7): BMR and BMR(R) vehicle construction chapters.

**Done 2026-11-23** (readings, quotes and printings in the progress ledger, "Task 0 readings"; page images written
back to ResourceLibrary 9148c139e: BMR pp.137 and 141, TO:AUE p.195 in the 7th and BattleTech- printings). What the
readings settle for the later tasks:

- BV1 (Task 7): BMR p.141 "Internal Structure ÷ 2" (the sign is missing on the 1998 page; errata p.12 and BMR(R)
  p.154 print it), Vehicle Type Modifiers 0.8 / 0.7 / 0.6 / 0.5 / 0.4, TMM table 0 to +5 (p.140), Speed Factor
  "Flanking MP + VTOL MP" (p.142, BMR(R) p.155): the code matches every line. The VTOL Flank-MP-twice reading stays
  `provisional` (ledger ruling). Maximum Tech p.92 adds three vehicle items the code lacks: Minesweeper +30 base
  Defensive Battle Rating (after Task 4), vehicle Coolant System +15 each, snowmobile +0.05 type modifier (each where
  we model the item); Mobile HQ (per side) and the combined trailer rig MP are not modelled (note them).
- BV2 (Tasks 4, 6): Minesweeper 30, defensive (TO:AUE p.195 Inner Sphere, p.197 Clan); no BV row for the Mobile Field
  Base (p.142: "no effect during combat") or the Cockpit Command Console: both 0, `provisional` "no row on TO:AUE
  pp.195-197". TM pp.317-318 dagger list in the ledger. TW p.199 WiGE +1 (owner call 5). TM p.308's unmotorized
  trailer clause is in the 3rd and 6th printings, not the 2007 printing.
- Cost (Task 8): TM p.290 AP Gauss 10,000, p.293 Remote Sensor Dispenser 30,000, TO:AUE p.217 Watchdog 600,000 (ours
  right, MegaMek differs); p.291 LRM 15 175,000 one row for both tech bases + Artemis IV 100,000 (our Clan LRM +
  Artemis records are wrong); p.293 MASH 35,000 core + 10,000 an added theater (ours wrong); p.292 communications
  10,000 a ton (p.284 Dixon); p.292 CASE 50,000 (owner call 2: Clan built-in CASE billed); p.279 heat sinks over 10
  with fusion; pp.107-108 turret tons (OmniVehicle fixed at the base chassis, p.99 Hephaestus); TO:AUE pp.157 and 162
  (supercharger, jet booster) are the right rules pages in the 7th printing; no hitch cost anywhere (0).
- Construction (Tasks 1-4): an AMS may go in a sponson (TO:AUE p.158: "all Sponson-mounted weapons and equipment");
  super-heavy structure per location is tonnage / 10 rounded up for every super-heavy, the VTOL rotor included, and
  non-naval super-heavy structure weighs 20 percent (TO:AUE p.190); trailers need no engine, control systems or crew
  unless they run on their own or use heavy weapons alone (TM pp.99, 101, 103), carry their own heat sinks for energy
  weapons (p.104) and the hitch is p.98 (our record says p.101: fix it); the Minesweeper goes front or rear (front-side
  / rear-side on large vehicles), land type on Wheeled or Tracked, maritime on displacement, hydrofoil or submarine
  (TO:AUE p.138); the Mobile Field Base goes in any Combat Vehicle (p.142); the Cockpit Command Console sits with the
  primary cockpit (the vehicle's body) (p.112).
- The infantry round's TO:AUE pages (calc-steps-infantry.ts, the reading ledger) match the printed labels; the "one
  lower" note came from the library log's 1-based chunk numbers. Nothing to fix.

### Task 1: reader fixes and silent losses (#600)

Files: `src/classes/vehicle-blk.ts`, `src/data/ammo.ts`, tests in `src/classes/blk-unit-import.test.ts`.

1. Failing tests first, one per case, each from a real MegaMek file's lines:
   - a side weapon written `Medium Laser(ST)` with no `SponsonTurret` line goes in its side's sponson and fits the
     sponsons (Galleon GAL-105 lines);
   - `SmartRoboticControlSystem` in the body sets the vehicle's Smart Robotic Control System (Swift Guardian lines);
   - `ISC3Sensors` loads as C3 Remote Sensors ammunition; `CLImpAmmoSRM6` as Improved SRM ammunition for an Improved SRM 6;
   - `ISCommsGear:SIZE:7.0` (or however the file writes it; read the Mobile HQ file) gives 7 tons and 70,000 C-bills;
   - a MASH with theaters (MIT23 MASH Vehicle) gives its theater count;
   - a Drone Carrier Control System sized for 5 drones (Hi-Scout Drone Carrier) gives its size.
2. Make each pass: infer sponsons from "(ST)" as MegaMek does (an AMS in a sponson only if Task 0 finds the page allows
   it; otherwise an import issue); map the SRCS line to `setRoboticControl`; add the two `altNames` (check each
   against its record's row before adding); read the size fields; report anything the reader still cannot carry.
3. Run the vehicle tests and `src/data/bundled-units.test.ts`; commit ("Combat Vehicle imports: ...", #600).

### Task 2: super-heavy VTOLs keep four facings and a rotor (#600)

TO:AUE p.190: "All Super-Heavy Combat Vehicles apart from VTOLs use the Super-Heavy Vehicle Hit Locations Table, and
must apply armor and structure to 6 facings".

1. Failing tests in `src/classes/vehicle.test.ts`: a 55-ton VTOL is super-heavy and its locations are front, left,
   right, rear, rotor (and turret / chin turret when fitted); its structure per location is tonnage / 10 rounded up
   (Task 0 confirms the rotor); the Kamakiri file imports with no issue and BV 1,378 (MUL and MegaMek).
2. Fix `getLocations` and every super-heavy branch that assumes six facings for a VTOL (armor allocation, structure,
   the record sheet `vehicle-record-sheet.tsx`, play hit locations already skip VTOLs: keep a test on it, Alpha Strike
   armor and structure from the right locations).
3. TRO Unit Types: write `docs/lore/super-heavy-vehicles-tro.md` (owner call 8) and list it in `tro-jbt.tsx`.
4. Commit (#600).

### Task 3: engineless trailers and ammunition carriages (#600)

1. Read the trailer rules (Task 0). Failing tests: the J-27 Ordnance Transport (Trailer) imports with engine "none",
   Cruise MP 0, no control systems if the page says so (MegaMek charges none; ours 5,000 today), BV 44 (MUL); an
   LT-MOB-25F (Ammunition Carriage) carries its Long Tom ammunition with no Long Tom and BV 148 (MUL); the BV uses
   Flanking MP 1 for an unmotorized trailer (TM p.308; check Gun Trailer (Mjolnir) 502 and (Siege) 248 against the MUL).
2. Build it: an engine type "none" for Combat Vehicle trailers (record in the engine data with its book and page),
   trailer construction (hitch, no Cruise MP), ammunition a unit carries for another (cargo ammunition: weight and
   cost, explosive in play, BV as the page says, else `provisional`), the record sheet (no engine, "Trailer"), play
   (towing as the existing hitch rules; no movement of its own), Alpha Strike (a trailer's move 0, as the ASC says,
   or inferred and noted).
3. Commit (#600).

### Task 4: Minesweeper, Mobile Field Base, vehicle Cockpit Command Console (#600)

Records in `src/data/equipment-misc.ts` with book and page (TO:AUE 7th printing: Minesweeper p.221 row 40,000, 3 t,
rules p.138; Mobile Field Base p.221 row 150,000, 20 t, rules p.142; Cockpit Command Console p.219 row 500,000, 3 t),
`altNames` `ISMineSweeper`, `ISMobileFieldBase`, `ISTankCockpitCommandConsole`, their BVs from the TO:AUE table read
in Task 0, availability by edition (Total Warfare and later; earlier only where a book offers them).

1. Failing tests: each record's numbers; each file imports clean (Bardiche (Minesweeper), Glaive (MFB), Fury CX-17)
   and gives the MUL's BV where it has one (Bardiche (Minesweeper) 1,198, Scorpion (Minesweeper) 452).
2. Construction (minesweeper front or rear, land or maritime by motive type, TO:AUE p.138; slots and weight), record sheet line, Classic play (minesweeping as
   the page says; field repair; the console's initiative bonus as the page says), Alpha Strike (MSW, MFB; the console
   as the ASC says), TRO rows.
3. Owner call 6 files (Jeep, Nike Tank, the two Clan heavy ferro files) as decided.
4. Commit (#600).

### Task 5: rebuild the bundle, accuracy, floor (#600)

1. `npm run build:bundled -- units`; read `vehicles-report.md`: the import-gap list should be down to the owner call 6
   files, if any; check the kept count rose (expect about +24).
2. `vehicles-accuracy.json` rewritten by the build; raise `MATCHED_FLOORS.vehicles` in `src/data/bv-verdicts.ts` to the
   new matched count; `npx vitest run --project unit src/data/bv-verdicts.test.ts src/data/bundled-units.test.ts`.
3. Look at it: a bundled super-heavy VTOL and a trailer open from the MUL search (View, TRO, Add) and convert to Alpha
   Strike.
4. Commit (#600).

### Task 6: Combat Vehicle BV2 as cited steps (#599)

1. `src/data/calc-steps-vehicle.ts`: `VEHICLE_BV2_STEPS` read on TM pp.307-308 (procedure, Hephaestus and CellCo
   worked), p.316 (Defensive Factors with its footnote, Unit Type Modifiers, Offensive BV Adjustment, Speed Factor),
   pp.317-318 (dagger defensive gear); TO:AUE p.190 (rail), p.191 (large naval), p.192 (armor type modifiers,
   vehicular stealth), p.193 (chassis mods, drone operating system x 0.8 weapons and x 0.95 final), p.194 (vehicular
   jump jets); IO:AE p.187 (SRCS); the machine gun array (TM p.228) and the VTOL mast mount (as
   its record cites). Steps
   with no page (the side arcs counted in full, the vehicular grenade launcher in its arc, equipment with a BV added
   in full) are `provisional` with the note the code comment gives now. Support Vehicle-only steps per owner call 3.
   The turret step is printing aware (owner call 4): a failing test first that a turret weapon counts in full and in
   no arc by default (TM 6th printing p.307, BV v4.1) and in the forward arc under the 3rd/4th printing alternate (TM
   3rd and 4th printings p.307, BV v4.0, BV 2.1), each step citing its own printing.
2. Failing tests first: the Hephaestus Prime at every number TM p.308 prints (335.5, x 0.7 = 234.85, x 1.4 = 328.79;
   237 x 1.89 = 447.93; 776.72, BV 777); the CellCo Ranger (53) through the Support Vehicle steps; every step id the
   calculation emits exists in the table (as `calc-steps-mech.test.ts`).
3. `_calcBattleValue` records steps; `getBattleValueBreakdown(edition)`; the log renders from the steps
   (`renderCalcStepsHtml`), as the fighter does. Drop the "(provisional)" tail once the steps carry their own status.
4. Commit (#599).

### Task 7: Combat Vehicle BV1 as cited steps (#599)

1. `VEHICLE_BV1_STEPS` per edition: master-rules (BMR pp.141-142, errata p.12, Maximum Tech FASA pp.90-92) and
   master-rules-revised (BMR(R) pp.154-155, Maximum Tech Revised pp.90-92), each step as Task 0 read it.
2. A hand-worked example as a test, step by step (no book prints a vehicle BV1 example: work one 'Mech-free design,
   e.g. a tracked tank with a rear weapon and a turret, under both editions, and a VTOL for the doubled Flanking MP).
3. `_calcBattleValue1` records steps; the BV1 log renders from them. Commit (#599).

### Task 8: Combat Vehicle cost as cited steps and the cost fixes (#599)

1. Failing tests first: the Hephaestus base configuration 1,255,000 and Primary 1,995,000 (TM pp.283-285) at every
   printed number; ammunition left out and a loaded cost shown (owner call 1); supercharger 10,000 x engine rating
   and VTOL jet booster 10,000 x engine rating (TO:AUE p.223; Scapha (Primary) supercharger 2,650,000); drone
   operating system 5,000 + 10,000 x its tons; drone carrier control system 10,000 x its tons; communications 10,000
   a ton (TM p.284); then each price Task 0 settles (Clan LRM + Artemis IV, AP Gauss, MASH, Remote Sensor Dispenser,
   Watchdog, Clan CASE per owner call 2, the OmniVehicle fixed turret, the trailer's control systems).
2. `VEHICLE_COST_STEPS` read on TM p.279 (table), p.282 (equipment and ammunition), p.285 (final formula, rounding as
   the 'Mech Finding 22), TO:AUE pp.219, 221, 223 (images read in the audit), p.190 (super-heavy structure x 2 tons);
   rows not re-read stay `provisional` (the 'Mech cost round's `READ_ROWS` pattern). Under master-rules and
   master-rules-revised the rows cite BMR p.137 and BMR(R) p.150 (owner call 7); what those pages do not print stays
   `provisional` there. `_calcCost` records steps; `getCostBreakdown(edition)`.
3. Fix the catalog prices the readings correct (each record keeps its book and page per edition). Commit (#599).

### Task 9: the breakdown view for vehicles (#599)

1. `VehicleCalcBreakdown` in `calc-breakdown.tsx` (the shared `CalcBreakdownToggle`, the edition switch with
   `FIGHTER_BREAKDOWN_EDITIONS`' editions as vehicles have them); failing test in `calc-breakdown.test.tsx` first.
2. Use it in the vehicle creator summary (in place of the raw logs), the roster add-units viewer (a `VehicleSheet` like
   `FighterSheet`: the record sheet and the breakdown, MUL BV beside ours for a bundled design), and the MUL search TRO
   view. Hidden for Support Vehicles (owner call 3).
3. Commit (#599).

### Task 10: the vehicle queue (#599)

1. Rerun the probes (`src/zz-local/veh-all.test.ts`, `probes/VehAll.java`, `probes/join.js`) after Tasks 1-8.
2. Work the groups in the ledger: A (WiGE, owner call 5), I (trailers: Flanking MP 1), D (Daimyo, after the
   communications fix), E (sealing), B (naval), C (Marsden), F (large single cases, one at a time with
   `VehReport bv <file>` beside ours), G (small). Fix root causes test-first with citations; every fix lands in the
   ledger's Combat Vehicles findings (V1, V2, ...).
3. Verdicts in `bv-verdicts.ts` for every differ that stays: `mul-suspect` with cites where MegaMek gives our value
   (a shared `VEHICLE_MEGAMEK_AGREES` note and `VEHICLE_BV_CITES` = TM pp.307-308, as infantry), `our-bug` with an issue
   number where we are wrong and cannot fix it now. List the open ones in the ledger.
4. Commit (#599).

### Task 11: close the round

1. News bullet in `src/ui/pages/home.tsx` (NGCFells's voice: the left-out vehicles that now ship, and the vehicle
   breakdown), the "Combat Vehicles" part of the reading ledger complete.
2. `npm run check`; one Opus `astech` whole-branch review (rules first, then code); fixes test-first.
3. Fetch and merge `origin/beta`, push `beta`, `git deploy-beta` (only when NGCFells says to push; this plan's author
   does not push or merge).
4. Comments on #600 and #599 in NGCFells's voice (first person, casual; give the issue URLs), the handoff.
