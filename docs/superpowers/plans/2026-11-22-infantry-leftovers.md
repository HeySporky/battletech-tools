# Conventional Infantry: Specializations and Their BV, Beast-Mounted Infantry, Field Guns and Artillery, Transport Checks Implementation Plan (#136, #610)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Infantry Creator builds the TO:AUE specialized platoons (Combat Engineers, Marines, Mountain Troops, Paratroops, SCUBA, XCT) with their BV (#610), beast-mounted platoons, field guns and field artillery, and checks a platoon against vehicle and aerospace bay capacity (#136).

**Architecture:** `src/classes/infantry-platoon.ts` (1,301 lines) holds motives (`INFANTRY_MOTIVE_TYPES`, TM p.145), weapons and BV (`_calcBattleValue` ~707, routed per edition by `getBattleValueFor(edition, "infantry", ...)` from `src/data/battle-value.ts`). Specializations and beasts become fields on the platoon with data tables beside the motive table; field guns are a mount list on the platoon; the BV gains the advanced-infantry step. The transport check reads the carrier's bays (`battle-armor-transport.ts` is the pattern for BA).

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues; the edition-aware BV plan `docs/superpowers/plans/2026-11-03-edition-aware-bv.md` (round 6 names #610: "construction plus BV (damage divisors x 1.5, unit type add-ons p.193), and settle the TM v8.0 'Motorized: 1.0' row").

## Rules (extract first; `C:/repo/ResourceLibrary/text`)

- TO:AUE (`Tactical-Operations-Advanced-Units-and-Equipment-Corrected-7th-Printing-2024.txt`): Beast-Mounted Infantry p.107 (construction near line 6675, the Sample Types Table), Field Guns/Field Artillery p.190 (index near line 215), the specialized infantry entries, Advanced Infantry BV p.191, the Unit Type Modifiers Table p.193 addendum (Combat Engineers +0.1, Marines +0.3, Mountain +0.2, Paratroops +0.1, SCUBA +0.1, XCT +0.1).
- TM errata v8.0 (`TechManual-CGL-2024-V80Dated20240822.txt`): "Motorized: 1.0" in the Unit Type Modifiers Table (p.316).
- Older editions: the BMR(R) and Maximum Tech infantry rules (Max Tech has specialized infantry under other names; read before deciding which editions get which specialization).

## Global Constraints

- Extract first; page image only when in doubt, written back whole.
- Every edition: each specialization and beast type carries the editions whose books print it; BV1 editions use their own BV step (BMR(R)/Max Tech) where printed, else the BV2 step does not apply (noted).
- No bundled infantry design's BV may change (the infantry bundle lands with the #600 stream; coordinate: if it has landed, `bundled-units.test.ts` must stay green).
- Condense and extend: no new source files. Tables go in `infantry-platoon.ts` beside `INFANTRY_MOTIVE_TYPES`; tests extend `src/classes/infantry-platoon.test.ts`.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **TM v8.0 "Motorized: 1.0".** Recommended: read it as the base row the add-ons sit on for every non-mechanized platoon (foot, motorized, jump all start at 1.0 and the specialization adds its value), since the errata lists it in the same table; mechanized keeps its own row. The BV log cites the errata line.
2. **Field guns crew.** Recommended: TO:AUE's crew counts reduce the platoon's armed troopers as printed; a platoon may mix field guns and personal weapons only as the book allows.

## Usual checklist

| Item | Task |
|---|---|
| Records (specializations, beast types, field guns and artillery) | 1, 2, 3 |
| Construction | 1, 2, 3 |
| Record sheet (specialization, beast, field gun lines; the beast to-hit note) | 1, 2, 3 |
| Classic play (beast to-hit modifier; field gun fire, crew losses; specialization effects such as SCUBA underwater, Paratroops drop, Mountain terrain, Engineers' abilities) | 1, 2, 3 |
| Alpha Strike (ASC conversion for specialized and beast-mounted infantry and field guns, specials as ASC gives them) | 4 |
| TRO | each on the infantry TRO line |
| Credits | none (canon) |
| News, review, check, deploy, issue comments | 5 |

## Review Focus

- A Marines platoon that is also mechanized: which BV row applies (mechanized, then +0.3).
- A beast-mounted platoon's movement and the attacker to-hit modifier from the Sample Types Table, and its Creatures/Platoon count.
- Field artillery on a platoon: indirect fire uses the artillery rules the roster already has (grep `artillery` play).
- Transport: a platoon that weighs more than a bay holds is refused, with the bay's capacity in the message.
- Old saves: no specialization, no beast, no guns; BV unchanged.

---

### Task 1: Specializations and their BV (#610)

**Files:** `src/classes/infantry-platoon.ts` (`InfantrySpecialization = "combat-engineers" | "marines" | "mountain" | "paratroops" | "scuba" | "xct"`, a table with name, book, page, editions, the BV add-on, cost and construction limits; `getSpecializations()`, `setSpecialization(tag, on, rulesLevel)`; the BV step: defensive = sum of damage divisors x 1.5 x Defensive Factor x troopers, then the Unit Type Modifiers row), `src/data/battle-value.ts` (the step in the infantry BV rules), the Infantry Creator step for it (grep `motive` in `src/ui/pages/classic-battletech/infantry-creator/`). Test: `infantry-platoon.test.ts`.

- [ ] **Step 1:** Read TO:AUE's specialized infantry entries and pp.191-193, and TM errata v8.0 p.316; write each rule into the ledger `.superpowers/sdd/2026-11-22-infantry-leftovers/progress.md`.
- [ ] **Step 2:** Failing tests: a foot Marines platoon of 28 with rifles has the BV the TO:AUE method gives (work the example in the ledger from the book's numbers, or use a book worked example if printed); each add-on multiplies as the table says; specializations outside their editions are not offered; each specialization's construction limit is enforced.
- [ ] **Step 3:** Run, FAIL. Implement. Run, PASS; BV survey unchanged for existing platoons. Commit `Infantry: specialized platoons and their BV (TO:AUE pp.191-193) (#610)`.

### Task 2: Beast-mounted infantry (#136)

- [ ] Read TO:AUE p.107 and the Sample Types Table. Failing tests: each beast type sets MP, squad and platoon size, creatures per platoon, the attacker to-hit modifier, weight and cost as printed; weapons follow standard construction with the book's exceptions; the sheet shows the beast and the to-hit note; play applies the to-hit modifier when the platoon is targeted. Implement (a `INFANTRY_BEAST_TYPES` table beside the motives). Commit `Infantry: beast-mounted platoons (TO:AUE p.107) (#136)`.

### Task 3: Field guns and field artillery (#136)

- [ ] Read TO:AUE p.190. Failing tests: a platoon can mount field guns (allowed weapons and tonnage per trooper count), its crew count, cost, BV and sheet lines; field artillery fires through the roster's artillery rules; losing troopers takes crews off the guns as printed. Implement. Commit `Infantry: field guns and field artillery (TO:AUE p.190) (#136)`.

### Task 4: Transport checks and Alpha Strike (#136, #610)

- [ ] Transport: failing tests that a platoon's weight and type are checked against a vehicle's or aerospace unit's infantry bay capacity (TM bays; `vehicle.ts` and `small-craft.ts` bay data), with the capacity in the message; implement in `infantry-platoon.ts` (`fitsBay(bay)`) and show it in the roster's transport step.
- [ ] Alpha Strike: read the ASC infantry conversion for specialized, beast-mounted and field-gun infantry; failing tests for each card; implement in the infantry AS conversion. Commit `Infantry: bay checks and Alpha Strike for the new kinds (#136, #610)`.

### Task 5: Checklist, review and ship

- [ ] **News:** bullets for each.
- [ ] **Check:** `npm run check`.
- [ ] **Review:** astech Opus review. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #136 and #610 in NGCFells' voice; close when done; give the URLs.

## Models

Task 1 (BV): Opus. Tasks 2-4: Sonnet, Opus review.
