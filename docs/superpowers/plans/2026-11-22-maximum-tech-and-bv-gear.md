# Maximum Tech in BMR and BMR(R), Gear BV Prices but Nobody Builds, Side Bonuses, Combat Drops Implementation Plan (#611, #612, #617, #622, #624, #628)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Maximum Tech (Level 3) content under BMR (1998) and BMR(R) (#612: every remaining record, the ProtoMech jump pack, battle armor EI implants); build the gear the books give BV for but no creator makes (#611: 'Mech handheld weapons, thermobaric weapons, prosthetic limbs); Level 2 armless 'Mechs and FrankenMech arm donors (#617); the satellite uplink and field/mobile HQ with their Initiative and per-side BV (#622); the Level 3 vehicle items BV1 prices (#624); and a combat drop step in play (#628).

**Architecture:** Edition records: each item gains `editions` entries `master-rules` / `master-rules-revised`, `editionLevels: { ...: 3 }` and `editionStats` from Maximum Tech (the Round 2b mechanism in `docs/superpowers/plans/2026-11-03-edition-aware-bv.md`). BV1 Level 3 rules live in `MAX_TECH` / `MAX_TECH_FASA` in `src/data/battle-value.ts` (~51-82); `MAX_TECH.vehicleItems` / `vehicleChassis` take the new tags. Side bonuses fold into the one force-level line that already adds the command console's +200 (`BattleMechForce.getBattleValueText`, `src/classes/battlemech-force.ts`). The combat drop is a new step in the 'Mech play view replacing `getJumpPackNote()`'s note.

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues and their comments (#612 has the round-by-round progress); owner ruling 2026-11-20 (memory book-offers-item-for-edition): Maximum Tech items join BMR (1998) and BMR(R), each at Level 3 with the stats Maximum Tech prints; the E-War items are already entered under #642.

## Rules (extract first; `C:/repo/ResourceLibrary/text`)

- Maximum Tech: `MaximumTech-FASA-1700-1999-Corrected2ndPrinting.txt` (construction pp.84-88 tables, p.118 master table; BV pp.90-92; satellite uplink p.59; field/mobile HQ p.70; jump packs pp.80-81; armless p.62). The FASA first printing for BMR (1998) where it differs (`MAX_TECH_FASA`).
- TO:AUE p.105 (jump pack, combat drop, ProtoMech jump pack), p.193 (handheld weapon BV).
- IO:AE: EI implants pp.69, 184; thermobaric weapons (BV p.186); prosthetic limbs and Enhancement BV Modifiers (p.186).
- TM pp.308, 317 (trailers under BV2).

## Global Constraints

- Extract first; page image only when in doubt, written back whole into every printing's extract and `_corrected_pages.md`.
- Every edition the item or rule exists in; removed items stay apocryphal; a book offering an item for an edition makes it available there.
- BV2 numbers never move (BV survey); BV1 numbers move only where a rule lands.
- Condense and extend: no new source files except a test file where none exists. Tests extend `battlemech-rules-edition.test.ts`, `battlemech-bv1-*.test.ts`, `battle-value.test.ts`, `protomech.test.ts`, `battle-armor.test.ts`, `battlemech-frankenmech.test.ts`, `vehicle.test.ts`, `battlemech-force*.test.ts`.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs. Never grep `src/data/equipment-*.ts` without `| cut -c1-200`.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Side bonus stacking (#622, MT p.91):** one uplink or mobile HQ per side; the command console's +200 stacks with an uplink but not with a mobile HQ. Recommended: as the book says, decided in the single side-bonus line, with the log naming which bonus won.
2. **Handheld weapons (#611):** Recommended: a handheld weapon is its own small design (TO:AUE p.193: weapons + ammo + armor x 2 BV), built in the 'Mech creator's equipment step as a "Handheld weapon" item with its own armor, carried in a hand actuator; its BV is added to the carrying 'Mech's final BV.
3. **Trailer BV1 (#624):** "Calculate the BV for the tractor and each trailer separately, using the MP of the combined rig". Recommended: the roster gets a "rig" link (tractor plus trailers in the same group); BV1 then uses the rig's MP for each; without a link a trailer reads Flank 1 as now.

## Usual checklist

| Item | Task |
|---|---|
| Records (Max Tech editions; handheld weapons; thermobaric; prosthetics; uplink; HQ comms; vehicle coolant system; minesweeper) | 1, 3, 4, 5 |
| Construction | 1-5 |
| Record sheet | 2 (Level 2 armless arms), 3, 4 (uplink switch box), 6 (drop) |
| Classic play | 4 (uplink toggle effects), 6 (combat drop) |
| Alpha Strike | each record's conversion or reason; handheld weapons per ASC if printed |
| TRO | each item on its TRO line |
| Credits | none (canon) |
| News, review, check, deploy, issue comments | 7 |

## Review Focus

- A BMR(R) 'Mech that mounts a Level 3 item at Advanced (3): offered, priced with Max Tech's cost, BV1 by Max Tech pp.90-92; the same design under TW uses TW values.
- Level 2 armless: shoulder and upper arm stay with armor and structure, nothing else mounts there, and the flag no longer survives a quad round trip.
- A side with an uplink switched off in the End Phase: no +2 Initiative next turn, no -1 to its attacks.
- Combat drop with a jump pack: all fuel burns and the pack drops as each edition says; a 'Mech with jump jets cannot use the pack for a drop.

---

### Task 1: The rest of Maximum Tech in BMR and BMR(R) (#612)

- [ ] **Step 1:** Write a dev audit (a test file skipped unless `MAXTECH_AUDIT=1`) listing every record Maximum Tech prints (from the p.118 master table in the extract) and whether it carries `master-rules` / `master-rules-revised`. Ledger: `.superpowers/sdd/2026-11-22-maximum-tech/progress.md`.
- [ ] **Step 2:** For each missing record, one family per commit (missiles, ballistics, energy, equipment, components, munitions): failing test that it is offered under BMR(R) Level 3 with Max Tech's weight, slots and cost; edition fields from the page; run, PASS; BV1 checked where Max Tech prices it. Commit `Maximum Tech: <family> under BMR and BMR(R) (#612)`.
- [ ] **Step 3:** ProtoMech jump pack (TO:AUE p.105): failing tests in `protomech.test.ts` (offered, weight, MP, fuel, sheet); implement in `protomech.ts`. Commit `ProtoMechs: jump pack (#612)`.
- [ ] **Step 4:** Battle armor EI implants (IO:AE pp.69, 184): benefits and BV in `battle-armor.ts`; failing tests first. Commit `Battle armor: EI implants (#612)`.

### Task 2: Level 2 armless and FrankenMech arm donors (#617)

**Files:** `src/classes/battlemech.ts` (`isArmless()`; a Level 2 armless mode: arms keep armor, structure, shoulder and upper arm and hold nothing else; FrankenMech checks refuse an arm donor on an armless 'Mech; the armless flag clears when the chassis becomes a quad and stays cleared after switching back). Test: `battlemech-rules-edition.test.ts`, `battlemech-frankenmech.test.ts`.

- [ ] Failing tests for each of the three bullets; run, FAIL; implement; run, PASS. Commit `Armless 'Mechs: Level 2 arms, FrankenMech donors, quad round trip (#617)`.

### Task 3: Gear BV prices but nobody builds (#611)

- [x] 'Mech handheld weapons (OWNER CALL 2; TO:AUE p.193 and the construction rules where TO:AUE gives them): failing tests for construction, BV added to the carrier's final BV, sheet line, drop/pick-up in play. Implement. Commit `'Mech handheld weapons (TO:AUE p.193) (#611)`.
- [x] Thermobaric weapons (IO:AE): records (each weapon and ammo), BV p.186, play effects as printed. Commit `Thermobaric weapons (IO:AE) (#611)`.
- [x] Prosthetic limbs and Enhancement BV Modifiers (IO:AE p.186): on conventional infantry and pilots as IO:AE allows; failing tests; implement. Commit `Prosthetic limbs and their BV (IO:AE p.186) (#611)`.

### Task 4: Satellite uplink and field/mobile HQ (#622)

**Files:** `src/data/equipment-misc.ts` (Enhanced Satellite Uplink, a Level 3 benefit of a 'Mech's communications system, MT p.59; Communications Equipment on vehicles at 10,000 a ton: 3-6 t field HQ, 7+ t mobile HQ, MT p.70), `battlemech-force.ts` (the single side-bonus line: uplink 200, field HQ 100, mobile HQ 200, command console 200, with OWNER CALL 1's stacking; Initiative +2 / +1 / +2, non-cumulative), the 'Mech play view (uplink on/off in the End Phase; while on: no spotting for or using spotters for indirect LRM or artillery fire, no C3, +1 to attacks and Piloting rolls). Test: `battlemech-force*.test.ts`, `battlemech-command-console.test.ts`.

- [ ] Failing tests for each rule; run, FAIL; implement; run, PASS. Commit `Satellite uplink and field/mobile HQ: Initiative and side BV (Maximum Tech pp.59, 70, 91-92) (#622)`.

### Task 5: Level 3 vehicle items BV1 prices (#624)

- [ ] Minesweeper (+30 to base Defensive Battle Rating) and Vehicle coolant system (+15 each): catalog records if the Support Vehicle plan has not added them (check), with Max Tech editions; add tags to `MAX_TECH.vehicleItems`.
- [ ] Additional crew on Combat Vehicles (+2 each to Base Weapon Battle Rating) and Snowmobile (+0.05 to the Vehicle Type Modifier): fields on Combat Vehicles under BMR(R) Level 3 (`vehicle.ts`), in `MAX_TECH.vehicleChassis`.
- [x] Trailers (OWNER CALL 3): the rig link in the roster group and BV1 with the rig's MP.
- [x] Chassis modifications and bulldozer under BV1 editions: check each against Max Tech's construction rules; offer where the book allows.
- [x] One failing test per bullet first; commits `Vehicles under BMR(R): <item> (#624)`.

### Task 6: Combat drop step (#628)

**Files:** the 'Mech play view (a "Combat drop" action, with each edition's rules in data: TO:AUE p.105 and Maximum Tech pp.80-81), `battlemech.ts` (spend the pack's fuel and drop it as the edition says; `getJumpPackNote()` loses its combat-drop sheet note). Test: `battlemech-rules-edition.test.ts`.

- [ ] Failing tests: under TW a pack lets a 'Mech without integral jump jets (or a Vehicular Drop Chute) drop, burning all its fuel; under BMR(R) Max Tech's rule; a 'Mech with jump jets is refused; the sheet note no longer says "combat drop is a note". Run, FAIL. Implement. Run, PASS. Commit `Play: combat drop with jump packs, every edition (#628)`.

### Task 7: Checklist, review and ship

- [ ] **News:** bullets per family.
- [ ] **Check:** `npm run check`; BV survey (BV2) unchanged.
- [ ] **Review:** astech Opus review (rules per edition). Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #611, #612, #617, #622, #624, #628 in NGCFells' voice; close the finished ones; give the URLs.

## Models

Task 1 records: Sonnet. Tasks 2-6: Opus (rules in the big classes). Review: Opus.
