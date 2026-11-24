# Support Vehicles, Patchwork Armor and IndustrialMech Leftovers Implementation Plan (#157, #158, #166, #169, #179)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Support Vehicle equipment the catalog lacks (#157); Patchwork armor, BV and Alpha Strike checks, and naval and rail play for Support Vehicles (#158); the rest of Patchwork armor (#166); the IndustrialMech play leftovers (#169); and the Armored Motive System on Support Vehicles (#179).

**Architecture:** All of this extends `src/classes/vehicle.ts` (Combat and Support Vehicles share the class; `isSupportVehicle()` ~830), its catalogs (`src/data/equipment-misc.ts`, `combat-vehicle-chassis-modifications.ts`, the Support Vehicle chassis modification data), the vehicle BLK reader (`vehicle-blk.ts`) and the vehicle play view. IndustrialMech play extends `battlemech.ts` and the 'Mech play view.

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues. Rules (all in `C:/repo/ResourceLibrary/text`): TM Support Vehicle construction (`TechManual-CGL-2024-V80Dated20240822.txt` and the corrected printings), TO:AUE pp.94-95 Armored Motive Systems ("available only to Combat and Support Vehicles that have a Tracked, Wheeled, Hover, Hydrofoil, Naval (including submarine), or WiGE motive system", `Tactical-Operations-Advanced-Units-and-Equipment-Corrected-7th-Printing-2024.txt` near line 5900), TW p.52 (water), p.59 (ICE stalling), TM p.68 (fuel use), TO:AR for naval sinking, grounding, boarding and rail rules.

## Global Constraints

- Extract first; page image only when in doubt, written back whole.
- Every edition the item or rule exists in; removed items stay apocryphal.
- Item records an import needs may already be added by `2026-11-22-megamek-import-export.md` Task 4 (it adds records for import only and points here for play). Check before adding; never two records for one item.
- No kept bundled design's BV may change (`bundled-units.test.ts`); Support Vehicles bundled at a MUL or MegaMek BV match must stay matched.
- Condense and extend: no new source files. Tests extend `vehicle-support-equipment.test.ts`, `vehicle-support-advanced.test.ts`, `vehicle-armored-motive.test.ts`, `vehicle-patchwork-armor.test.ts`, `vehicle-play.test.ts`, `battlemech-industrial-play.test.ts`, `battlemech-patchwork-armor.test.ts`.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Naval and rail map rules (#158).** Play has no map. Recommended: sinking, running aground, boarding, derailing and collisions become play-card actions with their rolls and results (the player says "ran aground" / "collided with X"), as the water landing rules did (`water-landing-play.ts`).
2. **BV checks with BV 0 on the live MUL (#158).** Recommended: check against MegaMek's BV (`src/data/megamek-bv.json`, as #241's no-BV round did) and the printed record sheets where we have them; list mismatches in `support-vehicles-report.md`.

## Usual checklist

| Item | Task |
|---|---|
| Records with notes, dates, BV, cost | 2 |
| Construction | 2, 3, 5 |
| Record sheet | 3 (Patchwork armor types on the 'Mech sheet; SV sheet lines for new items) |
| Classic play | 4, 6 |
| Alpha Strike | 2 (each item's conversion or reason), 5 (ARS on Support Vehicles: the ARS special already comes from `armored-motive`, `vehicle.ts:4005`) |
| TRO | 2, 5 (TRO lines for the new items) |
| Credits | none (canon) |
| News, review, check, deploy, issue comments | 7 |

## Review Focus

- A Small Support Vehicle (under 5 t) buying items by the kilogram: weights round as TM says for its size class.
- Patchwork armor on a Support Vehicle with the Armored Chassis modification: BAR per location, cost and BV per location.
- Fractional Accounting on vehicles and fighters with Patchwork armor: kilogram rounding per location (#166).
- An ICE IndustrialMech failing a Piloting roll: stalls, and restarts as TW p.59 says; a fuel-cell or fusion one never stalls.
- A tripod's legs on the Front/Rear column for the End Phase water check (#169).

---

### Task 1: What is already done

- [ ] For each line of #157, #158, #166, #169 and #179, grep the code and tests and mark it done or open in the ledger `.superpowers/sdd/2026-11-22-support-vehicle-leftovers/progress.md` (examples: extended fuel tanks on vehicles exist at `vehicle.ts` ~3716; Patchwork on vehicles has `vehicle-patchwork-armor.test.ts`; check whether Support Vehicles may take it). Tick the done lines on the issues in the final comment. Skip done lines in the tasks below.

### Task 2: Support Vehicle equipment the catalog lacks (#157)

Items: Handheld Searchlight (44 files), Vehicular Mine Dispenser (22), Minesweeper, Vehicle Jump Jets, Ladder, Mobile Field Base, Drone Operating System, infrared / high-resolution / hyperspectral imagers, Refueling Drogue, Medium VSP Laser, light and heavy torpedoes, primitive autocannon ammunition, vehicle flamer and heavy/medium rifle ammunition, half-ton MG ammo; the troopspace, infantry, battle armor and light vehicle bays on vehicles and aircraft; MegaMek's internal names for light weapons ("InfantryAssaultRifle", "InfantrySRMLight").

**Files:** `src/data/equipment-misc.ts` (and the ammo and weapon catalogs for the ammo and weapons), `src/classes/vehicle.ts` (bays; variable-size items), `src/classes/vehicle-blk.ts` (the light weapon names: add them as `altNames` on the infantry weapon records instead of matching by display name). Test: `vehicle-support-equipment.test.ts`, `vehicle-blk.test.ts`.

- [ ] For each item, in report-count order: read its page (TM / TO:AUE / IO:AE), failing test (offered on the right vehicles at its level, weight, slots, cost, BV), add the record (AS conversion or reason), run, PASS; rebuild `npm run build:bundled -- units` and note the support-vehicles report delta. One commit per family: `Support Vehicles: <family> (#157)`.

### Task 3: Patchwork armor leftovers (#158, #166)

**Files:** `src/classes/vehicle.ts` (Patchwork on Support Vehicles with the Armored Chassis modification; era checks per location with an issues list), `src/classes/aerospace-fighter.ts` and `vehicle.ts` (Fractional Accounting kilogram rounding per location), `src/classes/battlemech-mtf.ts` and the SSW importer (Patchwork import: MTF writes armor type per location; SSW has no Patchwork sample, so build the format from SSW's source if the format references hold it, else MTF only), the 'Mech record sheet (armor type per location on the armor diagram). Test: the patchwork test files.

- [ ] Failing tests per bullet; implement; run, PASS. Commits `Patchwork armor: Support Vehicles (#166)`, `Patchwork armor: Fractional Accounting per location (#166)`, `Patchwork armor: MTF import and the 'Mech sheet (#166)`, `Patchwork armor: era checks per vehicle location (#166)`.

### Task 4: Support Vehicle BV and Alpha Strike checks; naval and rail play (#158)

- [ ] BV: a dev audit over the bundled Support Vehicles against MegaMek BV and any printed sheet (OWNER CALL 2); fix our math test-first for each rule-level cause found (cite the TM page); list the rest.
- [ ] AS: compare our Support Vehicle cards with MUL cards where the MUL has them; fix test-first.
- [ ] Play (OWNER CALL 1): failing tests for Large Naval sinking, running aground, boarding, rail derailing and collisions as play-card actions with their rolls (TO:AR, read first). Implement in the vehicle play view and a helper in `vehicle.ts`. Commit `Support Vehicles: naval and rail play (#158)`.

### Task 5: Armored Motive System on Support Vehicles (#179)

**Files:** the Support Vehicle chassis modification list (grep `chassisModification` with `support` in `src/data/`), `vehicle.ts` (`getAvailableChassisModifications` offers `armored-motive` to Support Vehicles with the allowed motives; Support Vehicle chassis mods are multiplier-based, so its weight rule follows the TO:AUE text for Support Vehicles). Test: `vehicle-armored-motive.test.ts`.

- [ ] Read TO:AUE pp.94-95 for the Support Vehicle form (weight as a percentage of the vehicle's weight, the BAR, and any multiplier). Failing tests: offered on a wheeled, tracked, hover, hydrofoil, naval or WiGE Support Vehicle; refused on VTOL, airship, rail, satellite; weight, cost and the -2 motive roll modifier and BV +0.1 as printed; the ARS special on its AS card. Run, FAIL. Implement. Run, PASS. Commit `Support Vehicles: Armored Motive System (#179)`.

### Task 6: IndustrialMech play leftovers (#169)

**Files:** `src/classes/battlemech.ts`, the 'Mech play view; `vehicle.ts` for Extended Fuel Tanks on Combat Vehicles if Task 1 finds them missing. Test: `battlemech-industrial-play.test.ts`.

- [ ] Failing tests: an ICE engine stalls on a failed Piloting Skill Roll (TW p.59) and restarts per its rule; water depth effects (TW p.52) for an IndustrialMech without environmental sealing; fuel consumption (TM p.68) counts down per turn of movement and stops the 'Mech when empty; a tripod's three legs use the Front/Rear column for the End Phase water check.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `IndustrialMechs: ICE stalling, water, fuel use and tripod legs in play (#169)`.

### Task 7: Checklist, review and ship

- [ ] **News:** bullets per family.
- [ ] **Check:** `npm run check`; `npm run build:bundled -- units` report deltas.
- [ ] **Review:** astech Opus review. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #157, #158, #166, #169, #179 in NGCFells' voice; close the finished ones; give the URLs.

## Models

Tasks 1-2: Sonnet. Tasks 3-6: Sonnet with an Opus review for the play rules.
