# MegaMek Import Gaps and Every Export Implementation Plan (#103, #117, #118, #119, #120, #122, #123, #155)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the MegaMek import gaps the build reports list, give players an MTF import box, add BLK readers for capital ships and gun emplacements, and write every export: SSW (`.ssw`, v3), MTF and BLK.

**Architecture:** Missing items become catalog records (or `altNames` on records we already have), one item family per task, each proven by the bundled build report shrinking. Readers stay where they are (`battlemech-mtf.ts`, `vehicle-blk.ts`, `battle-armor-blk.ts`, `small-craft-blk.ts`, `protomech-blk.ts`, registered in `BLK_READERS` in `blk-unit-import.ts`). Writers are new pure functions beside each reader, each tested by a round trip through its own reader over the whole sample corpus (a dev audit, since the samples stay in `WorkingData_DEV`).

**Tech Stack:** TypeScript, Vitest (PowerShell), the bundled build (`npm run build:bundled`).

**Spec:** the issues, and the bundled-designs design `docs/superpowers/specs/2026-10-25-bundled-mul-designs-design.md` (rulings: SSW first, a design ships only on a BV match, MegaMek credit until book-checked).

## What is already done (verified 2026-11-22; tick on the issues)

- #118: MTF import of bipeds, quads, tripods, LAMs (Standard and Bimodal), QuadVees, OmniMechs, FrankenMeks (`battlemech-mtf.ts:165-187`), superheavies, the Command Console. 3,705 'Mechs bundled.
- #119: one BLK reader for vehicles, support vehicles, fixed-wing support, battle armor, ProtoMechs, small craft and DropShips (`blk-unit-import.ts:36`).
- #103: most catalog records already carry MegaMek names in `altNames` ("MegaMek's equipment names are on the catalog records", `battlemech-mtf.ts:3`); 150 records in `equipment-*.ts` still have none.

## Out of scope here (other streams)

- BV mismatches in the reports ("BV differs from the MUL"): the #600/#599 per-unit-type stream owns them.
- Fighter, conventional fighter and conventional infantry BLK readers: #600 round 4b and its next rounds.
- Equipment the issues for Support Vehicles (#157) and misc gear (#165) build fully (play, sheet): this plan adds only what an import needs, and hands play to those plans (`2026-11-22-support-vehicle-leftovers.md`, `2026-11-22-equipment-wiring.md`).

## Global Constraints

- Coordinate with the #600/#599 stream: start each task from fresh `origin/beta`, rebuild with `npm run build:bundled`, and never change a kept design's BV or sheet. `src/data/bundled-mechs.test.ts` and `src/data/bundled-units.test.ts` must stay green; a kept-design diff stops the task for the owner.
- MegaMek files are read as data only; no MegaMek code is copied (the format references in `C:/repo/battletech-tools/WorkingData_DEV/format-references/megamek/*.java` document field meanings).
- A new catalog record cites its book and page (extract first; page image only when in doubt, written back whole).
- Every edition the item exists in (memory every-edition-every-rule), removed items stay apocryphal.
- Condense and extend: writers go in the reader's file (`battlemech-mtf.ts`, `vehicle-blk.ts`, ...), the SSW writer in `src/utils/sswUtils.ts`. Tests extend `battlemech-mtf.test.ts`, `vehicle-blk.test.ts`, `blk-unit-import.test.ts`.
- Never grep `src/data/equipment-*.ts` without `| cut -c1-200`.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Svartalfa 3 (#123), 100 kg over, no printed sheet.** Recommended: import it as the file has it, flag "100 kg over its tonnage in the MegaMek file; no printed sheet to check" on the design and in `protomechs-report.md`, and bundle it only if its BV matches the MUL. It stays out of the bundle otherwise, with that reason.
2. **Export fidelity.** Recommended: an export is "complete" when re-importing it through our own reader gives the same design and BV; byte-equality with a MegaMek or SSW save is not a goal. Items we hold that the target tool cannot express are written as a comment line (`#` in MTF/BLK, an XML comment in SSW) and listed to the player.
3. **Custom and Munchkin items in exports.** Recommended: written under their own names with a comment saying the target tool will not know them.

## Usual checklist

| Item | Task |
|---|---|
| Catalog records with notes, source, dates, BV, cost (new import items) | 1, 3, 4 |
| Construction | the items join the creators where their kind already is |
| Record sheet / play / Alpha Strike for the new items | handed to #157 and #165 plans; here each new record states its AS conversion or reason (conversion guard test) |
| TRO | the provenance line from the canonical-format plan |
| Credits | MegaMek credit already on MegaMek-sourced designs |
| News, review, check, deploy, issue comments | 9 |

## Review Focus

- A name added to `altNames` that collides with another record's name or altName (two matches): the lookup test fails loudly.
- Sponson turret items `(ST)` on a vehicle with no sponson turret chosen: placed in the sponson turret the import adds, never silently in the body.
- An exported MTF of an OmniMech writes every configuration's pods, and re-imports as the same configurations.
- A design using a Custom Homebrew item exports with the warning comment and is not refused.
- The bundled build reports' "kept" counts only go up.

---

### Task 1: MegaMek names in altNames (#103)

**Files:** Modify the `equipment-*.ts` catalogs and `mech-*-types.ts` component catalogs (altNames only). Test: `src/utils/importedEquipment.test.ts`.

- [ ] **Step 1:** Write a dev audit `src/data/megamek-names.audit.test.ts` (skipped when `WorkingData_DEV` is absent, like the other corpus audits; grep `WorkingData_DEV` in tests for the skip helper) that collects every equipment line from the 5,810 MTF and 7,100 BLK samples (strip `(R)`, `(T)`, `(ST)`, `(OMNIPOD)`, `:SIZE:`, `:OMNI` the way the readers do) and lists each name `findImportedEquipment` (`src/utils/importedEquipment.ts:112`) cannot match, with its file count.
- [ ] **Step 2:** For each unmatched name that is an item we already hold under another spelling, add the spelling to that record's `altNames`. Use `mmlData/mekfiles/name_changes.txt` for renamed units (the vehicle alias table in `vehicle-blk.ts` is the pattern).
- [ ] **Step 3:** Failing test in `importedEquipment.test.ts`: no two records share a name or altName (case-blind), and each name added in Step 2 resolves to its record.
- [ ] **Step 4:** Run, PASS after the additions. The audit's remaining list (items we do not hold) feeds Tasks 3 and 4. Commit `Catalog: MegaMek lookup names on the records (#103)`.

### Task 2: An MTF import box for players (#118)

**Files:** Modify `src/ui/pages/classic-battletech/mech-creator/imports.tsx` (beside the SSW import), reuse `importBattleMechMtf` (`battlemech-mtf.ts:479`). Test: `src/ui/pages/classic-battletech/mech-creator/mtf-file-import.test.tsx` (new; happy-dom, MemoryRouter, as `ssw-file-import.test.tsx` does).

- [ ] Failing tests: choosing a `.mtf` file shows the design's name, BV and the importer's issues; Save adds it to the player's 'Mechs; a file over the size limit is refused with a message; a non-MTF file is refused.
- [ ] Run, FAIL. Implement (accept `.mtf`, `text/plain`, max length as `MAX_BLK_FILE_LENGTH`). When the canonical-format plan has landed, route through `ImportReview`. Run, PASS. Commit `'Mech creator: import MegaMek .mtf files (#118)`.

### Task 3: 'Mech import gaps (#118)

The `mechs-report.md` "could not carry all of it over" lines, 2026-11-22, by count: Super-Cooled Myomer (21), HarJel III (16) and II (11), Clan Improved Gauss ammo (13), RISC Laser Pulse Module name (7), turret-mounted items (about 25 across weapons), compact heat sinks (4), Clan improved SRM-6 ammo (4), Dumper (7), Booby Trap (3), Thumper split slots (3), LB 10-X ammo names (6), PPC Capacitor pairing (2), C3 Sensors (2), Chain Drape Cape (2).

**Files:** Modify `src/classes/battlemech-mtf.ts`, the catalogs that own each item (`equipment-misc.ts`, `mech-myomer-types.ts` or its custom twin, `equipment-ballistic.ts` for ammo), `src/data/__fixtures__/tech-lists.json`. Test: `src/classes/battlemech-mtf.test.ts`.

- [ ] For each family, in this order (largest first): failing test with a minimal MTF that carries the item (and for turrets, an `(T)` item on a head or shoulder turret), expecting no issue and the right placement; run, FAIL; add the record (book and page from the extract) or the converter case; run, PASS; rebuild `npm run build:bundled -- mechs` and note the report delta in the commit message; commit `MTF import: <family> (#118)`.
- [ ] Super-Cooled Myomer and HarJel II/III are IO:AE / TO:AUE items; read them in `InterstellarOperationsAlternateEras-CGL-2021-Corrected2ndPrinting.txt` and `Tactical-Operations-Advanced-Units-and-Equipment-Corrected-7th-Printing-2024.txt` first.

### Task 4: Vehicle, support vehicle, battle armor and small craft import gaps (#119)

From `vehicles-report.md`, `support-vehicles-report.md`, `battle-armor-report.md`, `small-craft-report.md` (2026-11-22): Long Tom vehicle ammo (12), armor that does not fit the locations (8), engine type 8 (6), sponson turret `(ST)` mounts (about 20), Minesweeper (10), C3 Sensors (4), Smart Robotic Control System (3), Mobile Field Base (5), Tank Command Console (2), rifle ammo names, half-ton MG ammo (9), Handheld Searchlight (44), Vehicle Jump Jet (4), infantry/BA/light vehicle bays, light infantry weapon names with `:SIZE:` (about 20), BA heat sensor and APDS and NIU, naval comm scanner suites (8), the ASF bay `artsasfbay`, Caspar drone control (with #150), SDS self-destruct, ATAC.

**Files:** Modify `src/classes/vehicle-blk.ts`, `battle-armor-blk.ts`, `small-craft-blk.ts`, and the owning catalogs. Test: `src/classes/vehicle-blk.test.ts`, `src/classes/blk-unit-import.test.ts`.

- [ ] Same loop as Task 3, one family per commit `BLK import: <family> (#119)`. Engine type 8: read `BLKFile.java` for the code's meaning, then the TM/TO entry. Sponson turrets: TO:AUE sponson turret rules (extract first); the vehicle class must already model them (grep `sponson` in `vehicle.ts`; if absent, add the construction first, test-first, citing the page).
- [ ] Items whose play belongs to #157 or #165 get a record with `notes` naming the play rule as "not yet applied in play (#157)" and a stated Alpha Strike reason, so the conversion guard passes.

### Task 5: Capital ships and gun emplacements in BLK (#119, #155)

**Files:** Create readers inside `src/classes/capital-ship.ts` (`importCapitalShipBlk(text)`) and `src/classes/building.ts` (`importGunEmplacementBlk(text)`); register `"capital-ships"` (`jumpship`, `warship`, `spacestation`) and `"gun-emplacements"` (`gunemplacement`) in `BLK_READERS`; add `BlkImportSection` to the capital ship and Building creator homes. Test: `src/classes/capital-ship.test.ts`, `src/classes/building.test.ts`, `blk-unit-import.test.ts`.

- [ ] Failing tests: the MegaMek JumpShip, WarShip and station samples each import with their tonnage, K-F/sail, armor by arc and weapons by bay (#148's "check imports against the samples"); a `ge/` turret imports as a gun emplacement with its weapons and CF; the 106 `advancedbuildings/Migrated Gun Emplacements` files all import (dev audit, count reported).
- [ ] Run, FAIL. Implement. Run, PASS. Commit `BLK import: JumpShips, WarShips, stations and gun emplacements (#119, #155, #148)`.

### Task 6: SSW export (#117)

**Files:** Modify `src/utils/sswUtils.ts` (new `exportBattleMechSSW(mech: BattleMech): { xml: string; omitted: string[] }`, SSW save file version 3, the element names the importer reads); add an "Export .ssw" button on the 'Mech creator summary (grep `exportJSON` in `src/ui/pages/classic-battletech/mech-creator`). Test: `src/utils/sswUtils.test.ts` (create if missing) and a corpus audit `src/data/ssw-export.audit.test.ts`.

- [ ] Failing tests: the Atlas AS7-D and an OmniMech fixture from `src/data/ssw/sswTestFixtures.ts` export, re-import, and give the same `export()` and BV; quirks, T&T and comms names and the TRO text survive; a custom item is written with an XML comment and listed in `omitted`.
- [ ] Corpus audit (skipped without `WorkingData_DEV`): every bundled SSW-sourced design round-trips; report the failures.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `SSW export: write .ssw files (#117)`.

### Task 7: MTF export (#120)

**Files:** Modify `src/classes/battlemech-mtf.ts` (`exportBattleMechMtf(mech): { text: string; omitted: string[] }`), the creator button. Test: `battlemech-mtf.test.ts`, corpus audit `src/data/mtf-export.audit.test.ts`.

- [ ] Failing tests: biped, quad, tripod, LAM, QuadVee, OmniMech (every configuration), superheavy and FrankenMek fixtures round-trip through `importBattleMechMtf` with the same BV; MegaMek names are written from the first matching `altNames` entry that looks like a MegaMek internal name (no spaces, `IS`/`CL` prefix), else the display name.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `MTF export: write .mtf files (#120)`.

### Task 8: BLK export for every BLK type (#120, #122, #123)

**Files:** Add a writer beside each reader: `exportVehicleBlk` / `exportSupportVehicleBlk` (`vehicle-blk.ts`), `exportBattleArmorBlk` (`battle-armor-blk.ts`, #122), `exportProtoMechBlk` (`protomech-blk.ts`, #123), `exportSmallCraftBlk` (`small-craft-blk.ts`), `exportCapitalShipBlk` and `exportGunEmplacementBlk` (Task 5 files). A shared `writeBlkFile(blocks: Record<string, string[]>): string` in `src/utils/blk-file.ts`. Export buttons on each creator home. Test: each reader's test file, plus one corpus audit `src/data/blk-export.audit.test.ts`.

- [ ] Failing tests per type: a fixture round-trips with the same BV and `export()`; `writeBlkFile(parseBlkFile(x).blocks)` keeps every block.
- [ ] Svartalfa 3 (#123): import it, record the over-weight note per OWNER CALL 1, and pin the result in `protomech.test.ts`.
- [ ] Run, FAIL. Implement one type per commit `BLK export: <type> (#120, #122, #123)`. Run, PASS.

### Task 9: Checklist, review and ship

- [ ] **News:** bullets for the MTF import box and the exports ("Export .ssw / .mtf / .blk from every creator").
- [ ] **Check:** `npm run check`; `npm run build:bundled` report deltas in the commit messages.
- [ ] **Review:** one astech Opus whole-branch review (rules on the new records, BV unchanged on kept designs). Fix Critical and Important findings test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta` (expect "Published").
- [ ] **Issues:** comment on #103, #117, #118, #119, #120, #122, #123, #155 in NGCFells' voice; close the ones finished; give NGCFells the URLs.

## Models

Task 1, 3, 4 records: Sonnet. Task 2: Sonnet. Tasks 5-8 readers and writers: Sonnet, with an Opus check of the capital-ship reader. Review: Opus.
