# A Time of War Weapon Converter for Infantry Weapons Implementation Plan (#228)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** #228 asked to "add custom weapons"; the Léitíng-23 carbine is in (`src/data/infantry-weapons.ts` ~347-354). Both readings of the open question get built: a converter where a player enters any A Time of War personal weapon and gets a Total Warfare infantry weapon (saved as local custom content), and any further weapons linked on the issue converted and bundled the same way. The other A Time of War ammunition loads become selectable when converting.

**Architecture:** The conversion the carbine used (AToW Companion pp.169-171 with errata v1.1: damage, base range, crew, cost and reloads from the AToW stats; BV from the TechManual table rule that reproduces 208 of its 212 rows) moves into one function `convertAToWWeapon(stats, load)` in `src/data/infantry-weapons.ts` (beside the carbine, no new file), and the carbine's test checks that function reproduces its record. The Equipment Editor (`src/ui/pages/equipment-editor.tsx`) gets an "A Time of War weapon" form that calls it and saves the record through the local custom content path (`src/data/custom-content-local.ts`), offered where the carbine is (platoon primary/secondary, BA anti-personnel mount, building light weapons, Support Vehicle light weapons) at Custom Homebrew.

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** #228 and its comment (the carbine conversion; the two readings). Rules: `C:/repo/ResourceLibrary/text/AToWC-CGL-2021-V11Dated20210606.txt` pp.169-171 and `AToW-CGL-2022-V30Dated20220606.txt` (the personal weapon tables and the ammunition loads); TechManual infantry weapon table for the BV rule.

## Global Constraints

- Converted weapons are Custom Homebrew (6); a unit carrying one is raised to 6 (as the carbine).
- Extract first; page images for the conversion tables if the extract is in doubt, written back whole.
- Ammunition loads: Total Warfare infantry carry one damage per weapon, so a converted weapon takes one load at a time (the player picks it in the form; each load is its own record), never several.
- Every unit type the carbine is offered on (memory every-edition-every-rule); every edition the infantry rules ride.
- AS: a converted weapon changes the platoon's damage, so the platoon's AS conversion follows from the existing infantry conversion (no new AS rule).
- Condense and extend: no new source files; tests extend `src/classes/infantry-platoon.test.ts` and `src/ui/pages/equipment-editor.test.tsx`.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Which reading of "add custom weapons".** Recommended: both (the converter, and any weapons posted on the issue bundled), since open issues get built.
2. **A converted weapon's BV when the table rule cannot reach it** (the 4 of 212 TechManual rows it misses show the edge cases). Recommended: the table rule always, labelled "converted, BV by the table rule".

## Usual checklist

| Item | Task |
|---|---|
| Records (converted weapons; one per load) | 1, 2 |
| Construction (offered on the four mounts) | 2 |
| Record sheet (the weapon name and damage on the platoon, BA, building and SV sheets) | 2 |
| Classic play (platoon damage) | 2 |
| Alpha Strike (follows from the platoon conversion) | 2 |
| TRO (the weapon line in the platoon TRO) | 2 |
| Credits (the weapon's source as the player enters it; the carbine as now) | 2 |
| News, review, check, deploy, issue comments | 3 |

## Review Focus

- `convertAToWWeapon` on the carbine's stats reproduces its record exactly (damage 0.28, range 0, crew 1, cost 450, reload 5 for 6 shots, BV 0.26).
- A load with an AP or damage-type change converts by the Companion's rule for that load, not the standard load's.

---

### Task 1: The conversion as a function

**Files:** `src/data/infantry-weapons.ts` (`convertAToWWeapon`), test `src/classes/infantry-platoon.test.ts`.

- [ ] Failing test: the carbine's AToW stats through `convertAToWWeapon` equal the bundled record; three TechManual weapons with known AToW stats convert to their printed TW values.
- [ ] Run `npx vitest run --project unit src/classes/infantry-platoon.test.ts`, FAIL. Implement. Run, PASS. Commit `Infantry weapons: the A Time of War conversion is one function (#228)`.

### Task 2: The converter form, the loads, and posted weapons

**Files:** `src/ui/pages/equipment-editor.tsx` (the form), `src/data/custom-content-local.ts` (save), `src/data/infantry-weapons.ts` (each load's rule from the Companion). Test: `equipment-editor.test.tsx`, `infantry-platoon.test.ts`.

- [ ] Read the Companion's ammunition load rules; list the 13 loads and their conversion effect in the ledger `.superpowers/sdd/2026-11-22-atow-converter/progress.md`.
- [ ] Failing tests: entering the carbine's stats in the form saves a weapon a platoon can pick; each load converts by its rule; the saved weapon appears on the four mounts at level 6 and prints on each sheet.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Equipment Editor: enter an A Time of War weapon and get its infantry weapon (#228)`.
- [ ] Any weapons posted on #228: convert with the function, bundle beside the carbine with credit, one commit each.

### Task 3: Checklist, review and ship

- [ ] **News:** a bullet for the converter.
- [ ] **Check:** `npm run check`.
- [ ] **Review:** astech Sonnet review of the loads.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #228 in NGCFells' voice; close it; give the URL.

## Models

Sonnet throughout.
