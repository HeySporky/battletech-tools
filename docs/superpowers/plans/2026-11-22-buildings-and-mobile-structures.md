# Buildings: Play Rules Still Owed, and Mobile Structures Implementation Plan (#153, #154)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (#153) Buildings play fully: Light and Medium weapon criticals, burst/flame/AA effects applied, capital weapons in play, Castles Brian collapse and fire, Expanded CF and collapse splash and domino, attacks from inside, building weapon fire, hangar movement, liquid storage fuel in play, elevators and doors, basements, the PCMT generator, and the crew-table items. (#154) Mobile Structures, designed in the Building Creator from TO:AUE "Designing Mobile Structures" and played.

**Architecture:** `src/classes/building.ts` already models classifications, Castles Brian scale, elevators, liquid storage and hangars for construction (its header cites TO:AR pp.112-115 and "the Mobile Structure mounting rules those pages refer to"). Play rules join the building play view in `src/ui/pages/classic-battletech/roster/` and a per-rule helper in `building.ts`. Mobile Structures become a Building type (`structureType: "static" | "mobile"`): they share the armor, heat sink and weapon rules (as the issue says) and add type, CF, internal weight capacity, power and motive systems.

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues. Rules: TO:AR (advanced buildings, pp.112-139; `TacticalOperationsAdvancedRules-CGL-2020-Corrected4thPrinting.txt`), TO:AUE "Designing Mobile Structures" p.75 and Mobile Structures play p.33 on (`Tactical-Operations-Advanced-Units-and-Equipment-Corrected-7th-Printing-2024.txt`, index near line 123), the original TO (2008) pp.165-172 and 259 for the older printing (`Tactical-Operations-original-single-volume-2008.txt`).

## Global Constraints

- Extract first; page image only when in doubt, written back whole into every printing's extract and `_corrected_pages.md`.
- Every edition: buildings in play exist from BattleTech Compendium on (BMR, BMR(R) building rules are simpler); each rule's data names the editions whose books print it, and play under an older edition uses that edition's building rules (read BMR(R) "Buildings" first).
- Map-dependent rules (splash, domino, adjacency, hangar entry) take the building's shape as an input the player sets (hex layout by count and arrangement on the building's play card), since play has no map. OWNER CALL 1.
- Condense and extend: no new source files except tests where none exist. Building play helpers in `building.ts`; play UI in the existing building play component (grep `Building` in `src/ui/pages/classic-battletech/roster/*Play*.tsx`); Mobile Structure construction in `building.ts` and the Building Creator pages.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Building shape for splash and domino.** Recommended: the play card gets a small hex-layout editor (rows of hexes, which hex holds which level count) saved with the game, so splash and domino can name the adjacent hexes; with no layout set, those rules show as reminders only.
2. **Mobile Structures home.** Recommended: in the Building Creator as a structure type, not a new creator: same armor, heat sinks and weapons, new motive and power steps. They are canon (TO:AUE), so no TRO - JBT Unit Types readout; each design gets the normal TRO page.

## Usual checklist

| Item | Task |
|---|---|
| Records (Mobile Structure motive and power systems, crew-table items: flight decks, helipads, mobile field bases, modular linkage) | 5, 6 |
| Construction | 5, 6 |
| Record sheet (Mobile Structure sheet, TO:AUE p.11 "Structure Record Sheet") | 6 |
| Classic play | 1-4, 7 |
| Alpha Strike | Mobile Structures: ASCE / ASC rules for them if printed (read first); otherwise a stated reason in the conversion guard; buildings' AS card is in `2026-11-22-alpha-strike-more-unit-types.md` |
| TRO | 6 (Mobile Structure TRO page) |
| Credits | none (canon) |
| News, review, check, deploy, issue comments | 8 |

## Review Focus

- Collapse with units inside: each unit takes the damage and falls as TO:AR says, and a unit on the roof falls with it.
- A Castles Brian hex: capital-scale CF and armor; standard weapons do 1/10 damage, as now; the open-space collapse uses the location table.
- Fire spreading inside a building and liquid-storage leaks: they stop when the storage is empty.
- A Mobile Structure moving with units aboard: units move with it; a stacked ground Mobile Structure follows TO:AUE stacking.
- Old building saves: load unchanged, with `structureType: "static"`.

---

### Task 1: Light and Medium weapon criticals, burst, flame and AA effects (#153)

**Files:** `src/classes/building.ts` (the critical hit table's weapon results pick Light, Medium and Heavy weapons by the table; burst, flame and AA effects applied), the building play component. Test: `src/classes/building.test.ts`.

- [ ] Read TO:AR's building critical hit table and the effect letters (extract first); record in the ledger `.superpowers/sdd/2026-11-22-buildings/progress.md`.
- [ ] Failing tests: a weapon critical on a building with only Light weapons destroys a Light weapon; burst fire against infantry applies the burst damage; a flamer sets the hex burning; AA fire against an airborne unit uses its modifier.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Buildings in play: Light and Medium weapon criticals, burst, flame and AA (#153)`.

### Task 2: Capital weapons and building weapon fire (#153)

- [ ] Failing tests: a building's capital weapon spends its ammunition, takes critical hits, and fires at aerospace units with its to-hit; a building firing any weapon gets its to-hit number (gunnery of its crew, TO:AR); attacks on equipment from inside (p.119). Implement in `building.ts` and the play view. Commit `Buildings in play: capital weapons, weapon fire and attacks from inside (#153)`.

### Task 3: Collapse: Expanded CF, splash, domino, Castles Brian (#153)

- [ ] Implement OWNER CALL 1's layout on the play card first (saved in the play export).
- [ ] Failing tests: Expanded CF tracks a CF per level and collapses top-down, then total collapse (TO:AR pp.119-124); collapse splash damage hits the adjacent hexes from the layout; the domino effect rolls for each adjacent building; Castles Brian open-space collapse effects by location and its fire modifiers (TO:AR pp.42, 137).
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Buildings in play: expanded CF, collapse splash and domino, Castles Brian (#153)`.

### Task 4: Hangars, liquid storage, elevators and doors, basements, the PCMT generator (#153)

- [ ] Failing tests: hangar movement reductions by the moving unit's height (p.117); liquid storage fuel type, leaks and explosions (pp.132-134); elevator position and door state change in play and are saved; a semi-subsurface building and its basement are one design (p.138); a PCMT-fed generator powers the building as TO:AR says. Implement. Commit `Buildings in play: hangars, liquid storage, elevators, basements and generators (#153)`.

### Task 5: Crew-table items (#153)

- [ ] Add flight decks, helipads, mobile field bases and modular linkage to the building equipment list (records with book and page; AS reason), counted on the crew table. Failing test per item, implement, commit `Buildings: flight decks, helipads, mobile field bases and modular linkage (#153)`.

### Task 6: Mobile Structures: construction, sheet, TRO (#154)

**Files:** `src/classes/building.ts` (`structureType`, Mobile Structure type, CF, internal weight capacity, power plant, motive systems), the Building Creator pages (`src/ui/pages/classic-battletech/building-creator/`), the structure record sheet, the TRO. Test: `building.test.ts`, the building sheet test.

- [ ] **Step 1:** Read TO:AUE "Designing Mobile Structures" (p.75 in the 2020/2024 printings; p.259 in TO 2008) in full; write the steps, tables and limits into the ledger.
- [ ] **Step 2:** Failing tests: build a book example if TO prints one (else the simplest legal ground Mobile Structure) and pin its weight budget, CF, capacity, power and motive; illegal combinations give the book's messages; save and reload.
- [ ] **Step 3:** Run, FAIL. Implement. Run, PASS. Commit `Mobile Structures: construction (#154)`.
- [ ] **Step 4:** Sheet and TRO: failing tests that the sheet shows motive, CF per hex and the weapons, and the TRO lists them. Implement. Commit `Mobile Structures: record sheet and TRO (#154)`.

### Task 7: Mobile Structures in play (#154)

- [ ] Read TO:AUE pp.33-40 (movement, stacking, carrying units, destroying). Failing tests: movement per motive type; units aboard move with it; stacking of ground Mobile Structures; destruction. Implement in the building play view. Commit `Mobile Structures: play (#154)`.

### Task 8: Checklist, review and ship

- [ ] **News:** bullets for building play and Mobile Structures.
- [ ] **Check:** `npm run check`.
- [ ] **Review:** astech Opus review. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #153 and #154 in NGCFells' voice; close when done; give the URLs.

## Models

Tasks 1-5: Sonnet with Opus review. Tasks 6-7: Opus (new construction system).
