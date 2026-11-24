# Alpha Strike: Buildings, Saved Vehicles and Craft, Capital Weapons and LAMs Implementation Plan (#138, #139, #141, #142)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every unit type the app builds can join an Alpha Strike force: saved vehicles, buildings (with the ASCE advanced-building card and its emplacements), Small Craft, DropShips and capital ships. DropShips and Small Craft count their capital and sub-capital weapons in the conversion and in play. LAMs get their conversion (LAM movement and the LAM / BIM specials), so their PV stops being provisional.

**Architecture:** The Add Units page (`src/ui/pages/alpha-strike/roster/_AddUnitsPage.tsx`) already lists saved 'Mechs, fighters, infantry, battle armor, ProtoMechs, Micro-Mechs and walkers (lines ~548-1007), each through its class's Alpha Strike conversion. Vehicles, buildings, small craft and capital ships get the same table. The building card is a new branch of the AS card for unit type `BD` (ASCE p.137 on). Capital weapons fold into `SmallCraft.getAlphaStrikeStats()` (`small-craft.ts:2155`) by arc, as `CapitalShip.getAlphaStrikeStats()` already does for large craft. The LAM conversion lives in `battlemech.ts`'s AS path, beside `isPointValueProvisional()` (~8620).

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues; the rules below.

## Rules (extract first)

- Advanced buildings: Alpha Strike: Commander's Edition, "Advanced Buildings" p.137 on (`C:/repo/ResourceLibrary/text/AlphaStrikeCommandersEdition-CGL-2022-Corrected5thPrinting.txt` near lines 9131-9180: armed buildings, emplacements by wall or by building, artillery emplacements, attacks against building-mounted weapons) and p.170 ("Advanced buildings will have their own unit card", near line 4888). #141: ASCE gives no conversion from a constructed building; an armed building's damage is chosen by the players up to its AS CF per emplacement, with armor up to the CF.
- LAMs: Alpha Strike Companion p.43 (`Alpha-Strike-Companion.txt` near lines 2131-2242 for LAM (#g/#a) and BIM (#a); near 2571-2583 for the LAM play rules) and ASCE p.177 (near 5700). Check the ASC errata (`AlphaStrikeCompanion-CGL-2022-V16Dated20221206.txt`) for each line.
- Capital and sub-capital weapons on DropShips and Small Craft: Alpha Strike Companion large-craft conversion (CAP, SCAP, MSL by arc), the same rules the capital ship card already uses (`capital-ship.ts:1012`).

## Global Constraints

- Extract first; page image only when in doubt, written back whole into every printing's extract and `_corrected_pages.md`.
- Every edition: AS rules follow the AS editions plan already in `docs/superpowers/plans/2026-11-22-alpha-strike-editions.md`; this plan uses whatever edition switch that plan provides (grep `asEdition` or the plan's selector name once it lands) and cites each AS book.
- A converted value that a MUL card prints wins over our conversion for that unit (MUL cards are the target, as for 'Mechs).
- Condense and extend: no new files except a test where none exists. The building card is a branch in the existing AS card components (`src/ui/components/svg/alpha-strike-unit-svg.tsx`, `alpha-strike-print-unit.tsx`). Tests extend `src/ui/pages/alpha-strike/roster/_AddUnitsPage.test.tsx`, `src/classes/small-craft.test.ts`, `src/classes/building.test.ts`, `src/classes/battlemech-as-647.test.ts` (or the closest LAM AS test; grep `isPointValueProvisional`).
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Building damage per emplacement (#141).** ASCE leaves it to the players. Recommended: the card is filled from the constructed building as a default (its emplacement weapons converted with the standard per-weapon conversion, capped at the AS CF per emplacement, armor capped at the CF), and the roster lets players edit each emplacement's damage and the armor within those caps. The default is marked "converted from the design (players may change it, ASCE p.137)". Because it is an inferred conversion of canon rules, it stays at the building's own rules level with `inferred: true` (memory our-rules-only-at-levels-6-7).
2. **Custom LAM types (VTOLAM, PAM, Omni-LAM).** Recommended: they convert with the same LAM rules; their extra abilities, if any, get our specials at levels 6-7 only, and their PV stays provisional until their own rules are written.

## Usual checklist

| Item | Task |
|---|---|
| Records | none new |
| Construction | none |
| Record sheet | none (AS cards only) |
| Classic play | 3 (capital weapons fire, use ammo and take criticals in Small Craft/DropShip play) |
| Alpha Strike conversion and play | 1-4 |
| TRO | the AS card line in each unit's TRO page already reads the conversion; 4 adds the LAM specials there |
| Credits | none |
| News, review, check, deploy, issue comments | 5 |

## Review Focus

- A saved vehicle with a turret, an OmniVehicle and a trailer: each converts once (one card per configuration for omnis), never twice.
- A building with no weapons: a card with CF and armor only, no damage, and TMM 0 / immobile handling.
- A DropShip whose only weapons are capital: its standard damage is 0 and its CAP line carries the damage by arc; PV includes them.
- LAM in each mode: the card shows the ground MV, the AirMech `#g/#a` and the Fighter thrust; PV no longer says provisional for a standard LAM without bombs.
- Every MUL LAM card: our conversion matches it (test over the bundled LAMs with MUL ids).

---

### Task 1: Saved vehicles, buildings, Small Craft and capital ships in the AS force (#138)

**Files:** Modify `src/ui/pages/alpha-strike/roster/_AddUnitsPage.tsx` (four new tables after the walkers, from `vehicleSaves`, `buildingSaves`, `smallCraftSaves`, `capitalShipSaves`; same row shape as `as-walker-saves`). Check each class has an AS export (`Vehicle`: grep `getAlphaStrike` in `vehicle.ts`; `Building`: Task 2; `SmallCraft`/`CapitalShip`: `getAlphaStrikeStats`). Test: `_AddUnitsPage.test.tsx`.

- [ ] Failing tests: with one saved vehicle, building, small craft and capital ship, the page shows four tables (`as-vehicle-saves`, `as-building-saves`, `as-small-craft-saves`, `as-capital-ship-saves`); Add puts a unit in the force with the class's converted PV; at rules level 0-1 they are not shown (the existing `as-no-building-note` rule).
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Alpha Strike: saved vehicles, buildings, Small Craft and capital ships join forces (#138)`.

### Task 2: The advanced building card (#138, #141)

**Files:** Modify `src/classes/building.ts` (`getAlphaStrikeUnit(): AlphaStrikeUnit` with type `BD`, CF, armor, emplacements `{ name, wall?: "N"|"NE"|...; damage: { s, m, l, e }; artillery?: string }[]`, specials), `src/classes/alpha-strike-unit.ts` (emplacement list on the unit and in its export; edited values kept), the card components named above, and the roster's in-play view (the emplacement edit fields). Test: `src/classes/building.test.ts`, an AS card test (grep `alpha-strike-unit-svg` in tests).

- [ ] **Step 1:** Read ASCE pp.137-139 and p.170 in the extract; record the card fields, the CF conversion, the emplacement methods (by building, by wall), artillery emplacements and the attack rules in the ledger `.superpowers/sdd/2026-11-22-alpha-strike-more-unit-types/progress.md`.
- [ ] **Step 2:** Failing tests: a building with two emplacements gets a BD card with its CF and two emplacement damage lines, each capped at the CF; a wall-mounted emplacement shows its wall; editing an emplacement's damage above the CF is refused; an unarmed building has no damage line; the export round-trips the edited values.
- [ ] **Step 3:** Run, FAIL. Implement. Run, PASS. Commit `Alpha Strike: advanced building cards with emplacements (#138, #141)`.

### Task 3: Capital and sub-capital weapons on Small Craft and DropShips (#139)

**Files:** Modify `src/classes/small-craft.ts` (`getAlphaStrikeStats` adds CAP/SCAP/MSL damage by arc from `_capitalWeapons`, reusing the helpers `capital-ship.ts` uses; remove the note at ~1655), the small craft AS card (`src/ui/components/small-craft-as-card.tsx`), and small craft Classic play: capital weapon fire uses its ammunition, critical hits can hit it, and it can fire at aerospace units (grep the small craft play code: `src/ui/pages/classic-battletech/roster/` small craft play view). Test: `src/classes/small-craft.test.ts`.

- [ ] Failing tests: a DropShip with a Naval Laser in the nose shows its CAP damage in the nose arc; PV includes it; an MUL DropShip with capital weapons (pick one from `small-craft-index.json` whose MUL card has CAP) matches its card; in play, firing a capital missile spends a missile and a weapon critical disables the mount.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Small Craft and DropShips: capital weapons in Alpha Strike and in play (#139)`.

### Task 4: LAM conversion (#142)

**Files:** Modify `src/classes/battlemech.ts` (the AS conversion: LAM movement `#g/#a` per ASC p.43, the `LAM (#g/#a)` and `BIM (#a)` specials, Fighter-mode thrust; `isPointValueProvisional()` returns false for a standard LAM without bombs once converted), `src/data/alpha-strike-special-abilities.ts` (LAM and BIM entries if missing), the roster AS in-play mode switch (grep `AirMech` in `src/ui/pages/alpha-strike`). Test: the LAM AS test (create `src/classes/battlemech-lam-alpha-strike.test.ts` only if no LAM AS test exists).

- [ ] Failing tests: a Phoenix Hawk LAM PHX-HK2 (bundled, MUL id) converts to its MUL card's MV, specials and PV; a Bimodal LAM gets BIM; bombs still make PV provisional; a VTOLAM keeps provisional PV (OWNER CALL 2).
- [ ] Run, FAIL. Implement. Run, PASS; run the MUL-match test over every bundled LAM with a MUL id and list mismatches in the commit. Commit `Alpha Strike: LAM conversion (#142)`.

### Task 5: Checklist, review and ship

- [ ] **News:** bullets for the four new AS force tables, building cards, capital weapons on DropShips, LAM cards.
- [ ] **Check:** `npm run check`; AS MUL-match tests unchanged except LAMs improving.
- [ ] **Review:** astech Opus review (AS rules). Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #138, #139, #141, #142 in NGCFells' voice; close the finished ones; give the URLs. Also note on #140 and #143 that the large-craft card (#32) and the pod conversions (#647) already shipped, so they can close.

## Models

Task 1: Sonnet. Tasks 2-4: Opus (AS rules). Review: Opus.
