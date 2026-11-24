# LAM Leftovers: Bomb BV, the Alamo and the Prototype Rocket Pod, Aerospace Pilot Skills Implementation Plan (#159, #160, #161)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Settle LAM loaded-bomb BV (#159), add the Alamo nuclear missile and the prototype rocket pod to LAM bomb loads (#160), and give LAM and PAM pilots separate aerospace skills with the averaged-skill BV (#161; NGCFells: "Also applies to PAMs").

**Architecture:** `Pilot` (`src/classes/pilot.ts`) gains optional `aeroPiloting` and `aeroGunnery`; old saves leave them out and LAMs then use the 'Mech skills for both (today's behaviour). BV reads the average (IO p.192, TM p.314) through `getPilotAdjustedBattleValue` (`battlemech.ts` ~2468). Bombs are the LAM bomb loadout (`_bombLoadout`, `getBombLoadoutSlots()`).

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues. Rules: IO:AE LAM rules pp.100-108 and LAM BV p.186 (`InterstellarOperationsAlternateEras-CGL-2021-Corrected2ndPrinting.txt`, index near line 170), nuclear weapons pp.163-168 (Std. Nuclear Weapon Type II/Alamo, table near line 4350 and 11949), prototype rocket launchers (game rules near line 5087, BV table near 13895; take the page number from the extract's page marker), and the LAM bomb list for the prototype rocket pod (LAM rules pages); TM p.314-315 (skills, external stores); IO p.192; the BV errata `100-TechManual-Battle-Value-v4-1.txt`.

## Global Constraints

- Extract first; page image only when in doubt, written back whole.
- Every edition LAMs exist in (BattleTech Compendium, BMR, BMR(R) Max Tech LAM rules where printed, TW-era IO/IO:AE): skills and bombs follow each edition's book.
- The Alamo is under the optional nuclear rules: offered only when the force or design turns on "Nuclear weapons (IO:AE p.163)" (a Special Ruleset style switch, OWNER CALL 2), and at the rules level IO:AE gives it.
- Condense and extend: no new files. Tests extend the LAM test files (grep `isLAM` in `src/classes/*.test.ts`; `battlemech-airmech-play.test.ts` and the LAM BV tests), `src/classes/pilot.ts` has no test file: add `src/classes/pilot.test.ts` only if none exists.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **#159 bomb BV.** IO:AE p.186 counts each bomb bay and fuel slot as explosive (-15) and is silent on loaded bombs; TM p.315 adds external stores to the base BV before skill. Recommended: keep the TM reading, mark it "inferred: IO:AE is silent; TM p.315's external-stores rule applied" in the BV log, and stop calling the BV provisional for it (memory: inferred conversions stay at the item's level, noted). If the BV errata v4.1 or a MUL LAM with bombs says otherwise, that wins (Task 1 checks).
2. **Nuclear weapons switch (#160).** Recommended: a Special Ruleset entry "Nuclear Weapons (IO:AE)" in the shared game settings (`src/data/special-rulesets.ts`), off by default; the Alamo is offered only with it on.

## Usual checklist

| Item | Task |
|---|---|
| Records (Alamo, prototype rocket pod as LAM bombs) | 2 |
| Construction (bomb loadout) | 2 |
| Record sheet (bombs; second skill pair in the warrior box) | 2, 3 |
| Classic play (Alamo detonation per IO:AE; rocket pod fire; aero skills in Fighter mode) | 2, 3 |
| Alpha Strike (bombs BOMB#; skills) | 2 (BOMB# count), 3 (AS skill: the AS conversion uses the 'Mech gunnery, noted) |
| TRO | 2 |
| Credits | none (canon) |
| News, review, check, deploy, issue comments | 4 |

## Review Focus

- A LAM save with no aero skills: BV and play exactly as today.
- Averaging "rounded normally" (IO p.192): a 'Mech gunnery 4 and aero gunnery 3 average 3.5; pin the result only after reading the book's rounding words (a half may round up or toward the better skill).
- A PAM (always AirMech, `isPermanentAirMech()`): aero skills apply when airborne in AirMech, as the PAM rules say.
- The Alamo off: never offered, and a design carrying one opens with a note, not silently stripped.

---

### Task 1: Loaded bomb BV (#159)

**Files:** `src/classes/battlemech.ts` (the bomb BV step near ~1739 and `isBattleValueProvisional()` ~8612). Test: the LAM BV test.

- [ ] Read IO:AE p.186, TM p.315 and the BV v4.1 errata for LAM bombs; search the MUL bundle for a LAM whose MUL BV includes bombs.
- [ ] Failing test: a LAM with 5 HE bombs adds their BV before skill (TM p.315), the BV log says "inferred", and `isBattleValueProvisional()` is false for a standard LAM with bombs (still true for Omni-LAM, VTOLAM, PAM).
- [ ] Run, FAIL. Implement. Run, PASS; BV survey unchanged for LAMs without bombs. Commit `LAMs: loaded bomb BV settled (TM p.315, inferred for LAMs) (#159)`.

### Task 2: Alamo and prototype rocket pod (#160)

**Files:** the LAM bomb catalog (grep `_findBomb` in `battlemech.ts` for its source file), `src/data/special-rulesets.ts` (the nuclear switch), LAM play (bomb drop), the sheet bomb lines. Test: the LAM bomb tests.

- [ ] Read IO:AE's LAM bomb list (pp.100-108), the Alamo entry (pp.163-168), and the prototype rocket pod (Experimental). Failing tests: the rocket pod is offered at Experimental with its bomb-slot count; the Alamo only with the nuclear switch and its rules level; both on the sheet and TRO; the Alamo's detonation in play applies IO:AE's blast rings as a play-card action (no map).
- [ ] Run, FAIL. Implement. Run, PASS. Commit `LAMs: the Alamo nuclear missile and the prototype rocket pod (#160)`.

### Task 3: Separate aerospace skills (#161)

**Files:** `src/classes/pilot.ts` (`aeroPiloting?`, `aeroGunnery?` in `IPilot`; clamp like the others), `battlemech.ts` (`getPilotAdjustedBattleValue` averages for LAMs and PAMs; Fighter mode and airborne AirMech play use the aero skills), the pilot editor in the 'Mech creator and roster (grep `gunnery` in the pilot dialog), the record sheet warrior box (a second skill pair for LAMs). Test: `pilot.test.ts` (new only if absent), the LAM play test.

- [ ] Failing tests: a LAM pilot 4/5 'Mech and 3/4 aero gets the averaged skill BV multiplier per IO p.192 / TM p.314; Fighter mode attacks use aero gunnery; an old save loads with no aero skills and uses the 'Mech pair; a PAM airborne uses the aero pair.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `LAMs and PAMs: separate aerospace pilot skills (#161)`.

### Task 4: Checklist, review and ship

- [ ] **News:** bullets for each.
- [ ] **Check:** `npm run check`.
- [ ] **Review:** astech Opus review. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #159, #160, #161 in NGCFells' voice; close when done; give the URLs.

## Models

Sonnet for all tasks; Opus review.
