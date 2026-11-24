# Aerospace Leftovers: Fighter Altitude and Air-to-Ground, Small Craft, Stations, SDS, Capital Weapon Editions Implementation Plan (#137, #145, #148, #149, #150, #151, #152)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish what the aerospace issues still owe: fighters fly at altitude and velocity on the ground map and attack ground targets (#137); the Small Craft gaps (#145); station cost check and repair bays (#148); a station's jump sail with energy storage batteries (#149); the SDS (Caspar) drone control system (#150); capital weapons per rules edition (#151); and a Custom Homebrew price for capital fire control (#152).

**Architecture:** Fighter play state joins the existing fighter play code (`src/classes/aerospace-fighter.ts`, tests in `fighter-play.test.ts`) as altitude, velocity and the turn's thrust, with the per-edition rules in a data table, the way `ewar-play.ts` keeps per-edition rules. Air-to-ground attacks reuse the to-hit helpers. Station, sail and SDS work extends `src/classes/capital-ship.ts` and `src/data/advanced-aerospace-construction.ts`. Capital weapon editions extend `src/data/capital-weapons.ts` / `sub-capital-weapons.ts` (`ICapitalWeapon` already has `introducedInEdition` and `editionStats`; only one record uses them).

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues; the book pages named in each task.

## Rules (extract first; the files are in `C:/repo/ResourceLibrary/text`)

- Fighters on ground maps: TW "High-Altitude Movement" p.79, "Low-Altitude Movement" p.80, "Matching Mapsheets to Low-Altitude Hexes" p.91, "Air-to-Ground Attacks" p.242 on (strike p.245, strafing, bombing, dive bombing) in `TotalWarfare-CGL-2021-Corrected9thPrinting.txt`. Older editions: AeroTech (1986, `AeroTech-FASA-1609-1986-scan.txt`, a scan: use its `.ocr.txt` where the `.txt` is a stub), BattleSpace (1993), AeroTech 2 and Revised (`AeroTech-2-FASA-1718-scan.txt`, `AeroTech2Revised-FanPro-35011-2004.txt`), BMR(R) aerospace chapter if it has one. Each edition's rules go in the data table, as printed.
- Repair facilities: TO:AUE "Standard Repair Facilities (Pressurized/Unpressurized)" (`Tactical-Operations-Advanced-Units-and-Equipment-Corrected-7th-Printing-2024.txt` near line 9252; issue cites p.146).
- Jump sail and energy storage batteries: SO:AA p.136 (`StrategicOperationsAdvancedAerospaceRules-CGL-2021-Corrected3rdPrinting.txt` near line 5756).
- SDS: IO:AE "SDS (Caspar) Drone Control System" p.134, "Caspar II Advanced Smart Robotic Control System" p.137, "SDS Self-Destruct System" p.141, "SLDF SDS Jammer System" p.142 (`InterstellarOperationsAlternateEras-CGL-2021-Corrected2ndPrinting.txt`, index near line 256, table near 2450); Historical: Liberation of Terra I p.159 for the lore.
- Capital weapons: BattleSpace (1993), AeroTech 2 (2000) and Revised (2004) weapon tables.

## Global Constraints

- Extract first; the 1986 and 1993 scans are often stubs, so read the `.ocr.txt`, and pull a page image where the OCR is in doubt, written back WHOLE into every printing's extract and `_corrected_pages.md`.
- Every edition and every unit type a rule exists for (fighters, conventional fighters, Small Craft, DropShips, LAMs in Fighter mode, fixed-wing support vehicles for #137). Removed items stay apocryphal.
- Custom pricing (#152) exists only at Custom Homebrew (6) and Munchkin (7); canon levels keep "the books give no price".
- Condense and extend: per-edition fighter play rules go in a new pure module `src/utils/aero-ground-play.ts` (no existing module holds ground-map aerospace movement), with its test. Everything else extends existing files.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **#152 price for capital (expanded) fire control.** Recommended: 10,000 C-bills per ton of Expanded Fire Control (the TechManual's targeting computer rate per ton), only at Custom Homebrew and Munchkin, noted "Ours (NGCFells, 2026-11-22): the books price none". At canon levels the line stays at 0 with the note it has today.
2. **#145 the 5-ton Escape Pod and Life Boat samples.** Recommended: they are equipment carried by large craft (SO), not Small Craft; the Small Craft creator refuses them (as now) and the BLK reader imports them as a "Life Boat / Escape Pod" equipment line on the carrying ship when one names them, and reports the stand-alone file as "an escape pod, not a unit".
3. **#137 map scale.** Recommended: the roster tracks altitude and velocity per fighter and applies the to-hit, control-roll and attack rules; it does not draw the aerospace map (play mode has no map). The low-altitude hex mapping (TW p.91) is a reference table on the play page.

## Usual checklist

| Item | Task |
|---|---|
| Records (repair bays, sail batteries, SDS items, space mine dispenser, hyperspectral imager, booby trap play) | 2, 3, 4, 5 |
| Construction | 2, 3, 4, 5 |
| Record sheet | 1 (velocity/altitude boxes on the fighter sheet where the edition's sheet has them), 3, 4 (sail integrity line filled) |
| Classic play | 1, 2, 5 |
| Alpha Strike | 5 (SDS already has AS specials SDS-C, SDS jammer: wire the conversion); 2 (new items state their AS or reason) |
| TRO | each new item on its unit's TRO line (test per item) |
| Credits | none (canon) except #152's custom price note |
| News, review, check, deploy, issue comments | 8 |

## Review Focus

- A fighter at altitude 0 (landed) or in space: altitude rules do not apply; in space the space map rules stay as they are.
- Velocity above the edition's maximum or a failed control roll: the stall, crash and out-of-control results follow that edition's table.
- Bombing a hex with friendly units: they are hit like enemies (TW).
- A station with energy storage batteries and no sail: SO:AA p.136's jump rules (+2 modifier) apply.
- SDS WarShip drone over 800,000 t: refused with the IO:AE message; it still carries a K-F drive.
- Every capital weapon change: no bundled capital ship or DropShip BV moves under Total Warfare.

---

### Task 1: Fighters at altitude and velocity, and air-to-ground attacks (#137)

**Files:** Create `src/utils/aero-ground-play.ts` and its test. Modify `src/classes/aerospace-fighter.ts` (play state `altitude`, `velocity`, `thrustUsed`, `controlRollsFailed`, saved in the play export), the fighter play view in `src/ui/pages/classic-battletech/roster/` (grep `fighter` play component), and the fighter sheet where a box exists. Test: `src/classes/fighter-play.test.ts`.

**Interfaces:** `AERO_GROUND_RULES: Record<RulesEditionId, { maxAltitude: number; velocityToMove: (...); controlRollTriggers: string[]; attackTypes: ("strike"|"strafe"|"bomb"|"dive-bomb"|"altitude-bomb")[]; toHit: {...} }>`; `getAirToGroundToHit(attacker, attackType, edition): { modifier; labels }`; `applyVelocityChange(state, thrust, edition): state`.

- [ ] **Step 1:** Read each edition's pages (Rules above) and fill the table in the ledger `.superpowers/sdd/2026-11-22-aerospace-leftovers/progress.md` first.
- [ ] **Step 2:** Failing tests: TW: a fighter at altitude 5, velocity 6, spends thrust to change velocity and loses altitude per the rules; a strike attack gets its to-hit and the attack path; a strafing attack hits each hex along its path; a bomb drop uses the bombing table; an altitude change beyond limits forces a control roll. One test per older edition for the rule that differs from TW.
- [ ] **Step 3:** Run `npx vitest run --project unit src/utils/aero-ground-play.test.ts src/classes/fighter-play.test.ts`. FAIL. Implement. Run, PASS.
- [ ] **Step 4:** Commit `Fighters: altitude, velocity and air-to-ground attacks in play, every edition (#137)`.

### Task 2: Small Craft leftovers (#145)

**Files:** `src/data/equipment-misc.ts` (Hyperspectral Imager, Space Mine Dispenser; Booby Trap if the MegaMek plan has not added it yet), `src/classes/small-craft.ts` (offer them), small craft play (mine dispenser use, booby trap explosion), `src/classes/small-craft-blk.ts` (Escape Pod / Life Boat per OWNER CALL 2). Test: `src/classes/small-craft.test.ts`.

- [ ] Read each item's page (TO:AUE / IO:AE; extract first). Failing tests: each is offered on a Small Craft at its rules level with its weight, cost and BV; a mine dispenser in play lays a minefield marker and counts down its loads; booby trap detonation damage as printed; the 5-ton files report "an escape pod, not a unit".
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Small Craft: hyperspectral imager, space mine dispenser, booby trap, escape pods (#145)`.
- [ ] The AS roster part of #145 is in `2026-11-22-alpha-strike-more-unit-types.md` Task 1; the BLK export in `2026-11-22-megamek-import-export.md` Task 8.

### Task 3: Stations: cost check and repair bays (#148)

**Files:** `src/classes/capital-ship.ts`, `src/data/advanced-aerospace-construction.ts`, the capital ship sheet. Test: `src/classes/capital-ship.test.ts`.

- [ ] **Cost check:** find a published station with a printed cost (search the TRO 3057/3067 Revised and the Dark Age TROs for space stations: `grep -n -i "space station" C:/repo/ResourceLibrary/text/TRO*.txt | head`), build it, and pin its cost; fix the cost rules if it does not match, citing the page.
- [ ] **Repair bays:** read TO:AUE's repair facilities entry; failing tests that a pressurized and an unpressurized bay of a given size weigh, cost and add crew as printed and appear on the sheet and TRO; implement in the bays list.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Space stations: cost checked against <design>, repair bays (#148)`. (The sample import checks are in the MegaMek plan Task 5.)

### Task 4: Station jump sail with energy storage batteries (#149)

**Files:** `src/classes/capital-ship.ts` (a station may carry a jump sail; energy storage batteries' weight and cost; `getJumpSailIntegrity`), the sheet's Sail Integrity line (filled instead of blank), the TRO. Test: `capital-ship.test.ts`.

- [ ] Read SO:AA p.136; failing tests: a station with a sail of N tons gets its integrity on the sheet; batteries weigh and cost as printed; the K-F boom keeps only its cost multiplier (SO:AA p.139 gives it no weight, as today).
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Space stations: jump sail with energy storage batteries (#149)`.

### Task 5: SDS (Caspar) drone control (#150)

**Files:** `src/data/equipment-misc.ts` (or the large-craft systems catalog; grep `naval-c3` for where large-craft systems live), `src/classes/capital-ship.ts` (the percentage of the vessel's weight on top of the controls, quarters for half the minimum crew, the self-destruct, the 800,000 t drone limit, the K-F fail-safe note), small craft too where IO:AE allows; AS: wire `SDS-C` and the jammer specials already in `alpha-strike-special-abilities.ts` (~1306-1353) into the conversion. Test: `capital-ship.test.ts`, the AS special abilities test.

- [ ] Read IO:AE pp.134-142 (extract first). Failing tests for each rule above, and the AS card showing the SDS special. Run, FAIL. Implement. Run, PASS.
- [ ] Commit `Capital ships: SDS (Caspar) drone control, self-destruct and jammer (#150)`.

### Task 6: Capital weapons by edition (#151)

**Files:** `src/data/capital-weapons.ts`, `src/data/sub-capital-weapons.ts` (`introducedInEdition` and `editionStats` per record for BattleSpace, AeroTech 2, AeroTech 2 Revised). Test: the capital weapons test (grep `capital-weapons` in `src/data/*.test.ts`).

- [ ] Read each book's capital weapon table (OCR where the text is a stub). Failing tests: a Naval Laser 45 under each edition shows that edition's damage, heat, range and weight; a weapon an edition lacks is not offered there (or apocryphal after it was dropped). Run, FAIL. Enter the values. Run, PASS; no TW BV moves.
- [ ] Commit `Capital weapons: BattleSpace, AeroTech 2 and Revised values (#151)`.

### Task 7: Custom price for capital fire control (#152)

**Files:** `src/data/advanced-aerospace-construction.ts` (cost line "Expanded Fire Control" at 10,000 per ton at levels 6-7), `capital-ship.ts`, `small-craft.ts` if it carries expanded fire control. Test: `capital-ship.test.ts`.

- [ ] Failing tests: at level 6 a WarShip with 12 t of expanded fire control costs 120,000 more, with the "Ours" note; at level 4 the cost is unchanged. Run, FAIL. Implement. Run, PASS. Commit `Custom rule: a price for expanded fire control (#152)`.

### Task 8: Checklist, review and ship

- [ ] **News:** bullets for fighter altitude and air-to-ground play, the station sail and repair bays, SDS, capital weapons by edition, and the custom fire control price.
- [ ] **Check:** `npm run check`; BV survey unchanged.
- [ ] **Review:** astech Opus review (aerospace rules, every edition). Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #137, #145, #148, #149, #150, #151, #152 in NGCFells' voice; close the finished ones; give the URLs.

## Models

Task 1: Opus (multi-edition play rules). Tasks 2-7: Sonnet, Opus review.
