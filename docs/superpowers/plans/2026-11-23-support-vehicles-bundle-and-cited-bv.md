# Support Vehicles: bundled MUL designs (#600, the files left out) and cited Battle Value and cost (#599)

Specs: `docs/superpowers/specs/2026-10-25-bundled-mul-designs-design.md` (round 4, Support Vehicles) and
`docs/superpowers/specs/2026-11-10-cited-bv-and-cost-design.md` (Order of work: Support Vehicles after the Combat
Vehicles). Progress ledger, with the probes: `.superpowers/sdd/2026-11-23-support-vehicles-bundle-and-cited-bv/progress.md`.

Worktree `C:/repo/btt-sv`, branch `sv-round` (from `bv-gaps` at 2d588f9ba), with `cv-steps` merged in twice (the
Combat Vehicle step names: `VEHICLE_BV2_STEPS`, `getVehicleBv1Steps`, `VEHICLE_COST_STEPS`, `getCostBreakdown`,
`VehicleCalcBreakdown`). The Support Vehicle steps live in their own files so the branches merge cleanly.

## Result

| | Before | After |
|---|---|---|
| Support Vehicle files | 225 | 225 |
| Kept in the bundle | 97 | 183 |
| Left out | 128 (47 no MUL, 41 BV differs, 40 import gaps) | 42 (41 BV differs, 1 illegal by the book) |
| Matched to a MUL BV | 33 (the floor) | 41 (floor raised) |
| MegaMek custom records (no MUL entry) | 0 | 54 |

Every one of the 41 left-out differs has a verdict in `src/data/bv-verdicts.ts` except the Buffalo Drone Bomb (269
against the list's 270, open: no reading found for the last point).

## Rulings, each with its page

Import (closing the 40 import gaps):

1. Handheld searchlight: 5 kg, 500 C-bills, no slot, no BV (TM p.237; the 4th printing's table rows, pp.293, 344).
2. Dumper: 5 percent of the cargo it dumps, 5,000 C-bills, 1 slot (TM p.243). A dumper whose block lists no cargo
   dumps all the unit's cargo (inferred: the file does not say which cargo).
3. A Support Vehicle infantry weapon's `SIZE` is the clips carried, the first standard (MegaMek BLKFile; TM p.136).
4. Wire-Guided Missile Launcher (AToW Companion p.195): its BV 5.52 is inferred (1.08 damage x 5.11, the infantry
   weapon BV formula); marked `battleValueInferred`.
5. Man-portable TAG (IO:AE p.52): weight 20 kg and cost 40,000 inferred from MegaMek (the page gives no table row).
6. Hydrofoil: the file's cruise MP is the base, before x 1.25 (TM p.123; the Silverback Coastal Cutter 6 gives 8).
7. Chin turret on a support VTOL (TO:AUE p.160, Experimental, "Available To: CV, SV").
8. Armored Motive System on a Support Vehicle (TO:AUE p.94, "Available only to Combat and Support Vehicles"), with
   its +0.1 type modifier (TO:AUE p.193) and 100,000 a ton (TO:AUE p.219).
9. Vehicular jump jets on a Support Vehicle (TO:AUE p.161, Experimental; TM p.131 forbids them at Standard), priced at
   the Combat Vehicle 200 x tonnage x Jump MP squared (TO:AUE p.223, inferred: no Support Vehicle price is printed).
10. Ammunition carried with no gun aboard (the Buffalo Drone Bomb's 900 machine gun rounds) adds no BV (inferred:
    TM p.307 rates ammunition only with its weapon).
11. An infantry bay's size is the count of bays (MegaMek InfantryBay); battle armor bays by the file's flags.

Battle Value:

12. Support Vehicle armor x 2.5 x BAR / 10 (TM p.307). The CellCo Ranger example (TM p.308) leaves out the x 2.5;
    NGCFells ruled that a misprint (owner call 3). Now `cited`.
13. Heavy weapons and their ammunition x the fire control adjustment: none 0.8, Basic 0.9, Advanced 1 (TM p.316).
    Now `cited`.
14. Dune Buggy and Environmental Sealing on a Support Vehicle add +0.1 to the type modifier, as TO:AUE p.193 gives the
    Combat Vehicle modifications of those names (inferred, step `sv.bv2.def.chassis`). The printed Dromedary (TRO 3075
    p.294, 341), the HMRV DeConAid Trailer (Record Sheets: 3075 Unabridged, The Cutting Edge, 296) and the MUL's
    Burro II (247) come out only so. Not beside an Armored Motive System: the Shackleton AESV prints 298
    (Interstellar Players 3 p.112), which carries only the Armored Motive System's +0.1.
15. A rail trailer (no engine, Cruise MP 0) rates at MP 1, as any unmotorized trailer (TM p.308, with TO:AUE p.190's
    Cruise MP for rail). The TGV railcars and the Flatbed Railcar now equal MegaMek.
16. Primitive Prototype AC/20 ammunition is 17 BV a ton (IO:AE p.189); the Sturmblitz's 710 stands (MUL 732).
17. The Bulldozer's 10 is defensive only (TM p.317, the dagger); the list counts it again (Büffel VII and VIII, +10;
    Oppie O-65 and O-66, +7.7 at Speed Factor 0.77).
18. No Master Rules edition has Support Vehicles: no Support Vehicle BV1, and the breakdown offers Total Warfare alone.

Book corrections (`src/data/blk-design-corrections.ts`):

19. Buffalo Drone Bomb: BAR 5 (XTRO: Succession Wars p.12); the file gives standard armor.
20. HMRV Salvage Bed: BAR 8 (TRO 3075 p.63, "Armor Factor (BAR 8): 244"); now 606, the list's.

Supercharger (a touch point with cv-steps, which sized it for every vehicle):

22. A tenth of the engine's weight, rounded up to the half ton for units of 5 tons and over and to the kilogram under
    5 tons (TO:AUE p.156); the Death Trike's 190 kg engine takes 19 kg, not half a ton.
23. A Support Vehicle's supercharger costs 10,000 a ton of engine, not a point of rating (inferred: MegaMek's reading;
    the TO:AUE p.157 cost row is garbled in the extract). The Death Trike costs 6,312 (MegaMek 6,291), not 64,575.

Left out by the book:

21. HTE Micro-Copter: 40 kg, under the Small VTOL floor of 100 kg (TM p.120). Left out, illegal as printed.

Cost (#599), `SUPPORT_VEHICLE_COST_STEPS` (`sv.cost.*`): Support Vehicle Structural Costs TM p.280 (chassis x the
chassis modifiers, engine x type, armor by the point, x the Structural Tech Rating; heat sinks, turret, pintles, power
amplifiers), transport bays TM p.239 (errata), equipment TM p.282, fire control TM p.293, the Final Unit Cost Formulas
TM p.285. The Advanced Support Vehicles have no Tech Rating multiplier (TO:AUE p.229).

## For NGCFells to review (inferred readings)

- Ruling 14: the Combat Vehicle chassis modifiers on Support Vehicles, and the Shackleton exception.
- Ruling 2: a dumper with no cargo named dumps all the unit's cargo.
- Ruling 4: the Wire-Guided Missile Launcher's BV.
- Ruling 5: the man-portable TAG's weight and cost from MegaMek.
- Ruling 9: Support Vehicle jump jets at the Combat Vehicle price.
- Ruling 10: gunless ammunition at BV 0.
- Ruling 23: the Support Vehicle supercharger price (read the TO:AUE p.157 cost row on the page image to settle it).
- The verdicts that say "no printed rule reproduces the list": the TRO: Irregulars small Support Vehicles, the
  primitives and the rest where ours equals MegaMek's.

## Checklist

- Records: searchlight (handheld), dumper, wire-guided missile launcher, man-portable TAG; design corrections.
- Construction: dumper sizing, chin turret, armored motive and jump jets on a Support Vehicle (step 1 select).
- Sheet and play: the new items use the existing Support Vehicle sheet and play rows (no new play rule).
- Alpha Strike: the items carry no damage; jump jets give the j move through the existing conversion.
- TRO: the items print through the existing equipment list.
- Credits: none new (book rules).
- News: the November 23rd, 2026 entry in `src/ui/pages/home.tsx`.
