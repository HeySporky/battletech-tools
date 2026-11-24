# HeavyMetal, The Drawing Board, The Mech Factory and Bulk Import Audits Implementation Plan (#104, #124, #125, #126, #127, #128, #129)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read and write the other design tools' files: HeavyMetal Pro (`.hmp`, 2,963 samples), HeavyMetal Vee (`.hmv`, 515), The Drawing Board (`.dbm` binary, 630 samples, plus its XML export), and find out what The Mech Factory and The Vehicle Factory save. Give every format a dev-only bulk audit that runs the whole sample set through its importer.

**Architecture:** Each binary reader is a pure TypeScript function over a `Uint8Array` that produces the same intermediate the MTF reader feeds (an SSW XML string for 'Mechs through `convertMtfToSSW`'s output shape, a BLK block map for vehicles), so the existing builders, BV and checks do the rest. Writers come after each reader round-trips every sample byte for byte. Audits are skipped tests that only run where `C:/repo/battletech-tools/WorkingData_DEV` exists.

**Tech Stack:** TypeScript (`DataView` over `Uint8Array`), Vitest (PowerShell).

**Spec:** the issues. Field meanings: `C:/repo/battletech-tools/WorkingData_DEV/format-references/megamek/HmpFile.java` (2,126 lines), `HmvFile.java` (1,327), `TdbFile.java` (812, XML only). Samples: `WorkingData_DEV/HMPdata/hmpFiles/*` (with `Mech.lst` listings per folder), `WorkingData_DEV/TDBdata/*` (`.dbm`, header "Drawing Board Mech").

## Global Constraints

- The Java files are read for field meanings only; our code is written fresh (no copied code).
- Imported designs are the player's own (no bundling here). Many HMP folders are fan sets (FutureWars, BattleTechnology, MechForce); bundling them as custom designs is a separate decision (OWNER CALL 2).
- A reader never throws on a bad file: it returns `{ unit: null, issues: [...] }`. Files are size-capped like `MAX_BLK_FILE_LENGTH`.
- Condense and extend: one new source file per format family, `src/utils/heavymetal-file.ts` (HMP and HMV share the layout style) and `src/utils/drawing-board-file.ts`, with tests beside them. The import boxes extend `src/ui/components/blk-import-section.tsx` (renamed in place to accept more extensions) and the 'Mech imports page.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Writers before a perfect reader?** The issues say export waits until the reader round-trips every sample byte for byte. Recommended: keep that rule; the writer task starts only when the audit shows 100% byte-identical round trips (except files the audit lists as damaged).
2. **Bundle the fan HMP sets?** Recommended: not in this plan. Open a follow-up issue listing each folder and its count; each set comes in later as custom designs at the level its equipment sets, credited to its author.
3. **The Mech Factory and The Vehicle Factory (#129).** The only lead found so far: the online Mech Factory at battletech.doknet.hu (mentioned in #274's thread). Recommended: Task 7 is a survey only; a reader is planned once a sample and a format description are in hand.

## Usual checklist

| Item | Task |
|---|---|
| Records, construction, play, Alpha Strike, record sheet | none new (imports reuse the builders) |
| TRO | provenance line from the canonical-format plan (format `hmp`, `hmv`, `tdb`) |
| Credits | the readme line naming Hmpread and its authors as the format's documenters |
| News, review, check, deploy, issue comments | 8 |

## Review Focus

- A truncated or zero-length file: `{ unit: null, issues: ["The file ends early ..."] }`, never an exception or an endless loop.
- HMP string fields with a length prefix larger than the file: refused, not read past the end.
- HMP `V5.00` versus older headers: older versions either read or refuse with "HeavyMetal Pro version X is not read yet".
- TDB numbers are little-endian doubles where the header shows `@` bytes (0x40...); a wrong endianness shows as absurd tonnages, so the audit checks tonnage range.

---

### Task 1: Bulk audit harness (#104)

**Files:** Create `src/data/import-audits.audit.test.ts` with one `describe` per format (SSW, MTF, BLK now; HMP, HMV, TDB added by later tasks), skipped when `WorkingData_DEV` is missing. Output: `node_modules/.cache/import-audits/<format>.md` (not committed).

- [ ] For each sample: crash (caught), unknown equipment, unplaced criticals, our BV and cost against the file's stored BV and cost where the format stores them (SSW, HMP do; MTF/BLK do not), and against the MUL where the name matches (`classicMULMatch.ts`).
- [ ] Failing test first: the harness on a 3-file temp folder reports one crash, one unknown item and one BV mismatch, from fixtures written to a temp dir.
- [ ] Run `npx vitest run --project unit src/data/import-audits.audit.test.ts`. FAIL, then PASS. Commit `Dev tools: bulk import audits for SSW, MTF and BLK (#104)`.

### Task 2: HMP reader, header and chassis (#124)

**Files:** Create `src/utils/heavymetal-file.ts` (`readHmp(bytes: Uint8Array): { file: IHmpFile | null; issues: string[] }`), `src/utils/heavymetal-file.test.ts`.

- [ ] **Step 1:** From `HmpFile.java`, write the field table (offset rules, types, the tech base / engine / armor / myomer code tables) into the ledger `.superpowers/sdd/2026-11-22-other-design-formats/progress.md`, in our own words.
- [ ] **Step 2:** Failing tests on three real samples copied as small fixtures into `src/utils/__fixtures__/hmp/` (pick public-domain-safe ones: our own test build saved in HMP is better; if none, a sample whose design is on the MUL so only numbers are involved): name, model, tonnage, tech base, engine rating and type, walk/jump MP, armor type and per-location points, internal structure type.
- [ ] **Step 3:** Run, FAIL. Implement. Run, PASS. Commit `HeavyMetal Pro: read the header and chassis (#124)`.

### Task 3: HMP equipment, criticals and the import (#124)

**Files:** Modify `src/utils/heavymetal-file.ts` (equipment table, critical slots per location, ammo), add `importBattleMechHmp(bytes)` in `src/classes/battlemech-mtf.ts` beside `importBattleMechMtf` (it builds the same SSW XML intermediate). Add `.hmp` to the 'Mech imports page. Test: `heavymetal-file.test.ts`, `battlemech-mtf.test.ts`.

- [ ] Failing tests: the three fixtures import with every item placed and the file's BV matched; the audit (Task 1, HMP block) runs over all 2,963 samples.
- [ ] Run, FAIL. Implement. Run, PASS; record the audit numbers in the commit. Commit `HeavyMetal Pro: import 'Mechs (#124)`.

### Task 4: HMV reader and vehicle import (#125)

**Files:** Modify `src/utils/heavymetal-file.ts` (`readHmv`), add `importVehicleHmv(bytes)` in `src/classes/vehicle-blk.ts` (builds the BLK block map the vehicle reader takes). Add `.hmv` to the vehicle creator's import box. Test: same files, 515-sample audit.

- [ ] Same loop as Task 3. Commit `HeavyMetal Vee: import vehicles (#125)`.

### Task 5: The Drawing Board, binary and XML (#127)

**Files:** Create `src/utils/drawing-board-file.ts` (`readTdbBinary(bytes)`, `readTdbXml(text)`), import through the 'Mech imports page. Test: `drawing-board-file.test.ts`, the TDB audit.

- [ ] **Step 1:** Work out the binary layout from the 630 samples: a script in the session scratchpad dumps each record's fixed-width fields next to the design's known values (the samples are TRO designs, e.g. `SMP-1L Sample.dbm` and the Black Knight BL6-KNT), so each field is identified by matching. Write the layout into the ledger, citing the sample that proved each field. Use `TdbFile.java` for field meanings.
- [ ] **Step 2:** Failing tests: the Black Knight BL6-KNT binary sample reads as 75 t, its MP and armor; an XML export fixture (write one by hand from `TdbFile.java`'s element list) reads the same design.
- [ ] **Step 3:** Run, FAIL. Implement. Run, PASS, then the 630-sample audit. Commit `The Drawing Board: read .dbm files and the XML export (#127)`.

### Task 6: Writers, once round trips are perfect (#126, #128)

**Files:** `writeHmp`, `writeHmv` in `heavymetal-file.ts`; `writeTdbBinary` in `drawing-board-file.ts`; export buttons on the 'Mech and vehicle creator homes. Test: the audits assert byte-for-byte round trips.

- [ ] Start only when Tasks 3-5's audits show every sample round-tripping (per OWNER CALL 1). Failing test: `writeHmp(readHmp(x).file)` equals `x` for every sample; then a design built in the creator exports and re-imports with the same BV.
- [ ] Commit `HeavyMetal and Drawing Board: export (#126, #128)`.

### Task 7: The Mech Factory and The Vehicle Factory survey (#129)

- [ ] Search the library index (`py -3.11 C:/repo/ResourceLibrary/library_search.py "Mech Factory" --books` and the same for "Vehicle Factory") and `C:/repo/ResourceLibrary/scrapes/_index.md` for samples or a format description; check the doknet.hu Mech Factory page (an online tool: does it export a file, and in what form?).
- [ ] Post the findings on #129 in NGCFells' voice: what exists, sample counts, whether it is readable. If a format is found, append a reader task to this plan; if not, the comment lists what is needed (one saved file per tool, and the tool's version).

### Task 8: Checklist, review and ship

- [ ] **News:** bullets "Import HeavyMetal Pro and HeavyMetal Vee files" and "Import The Drawing Board files" as each lands.
- [ ] **Check:** `npm run check`.
- [ ] **Review:** one Sonnet review per reader (bounds checks), one Opus whole-branch review at the end.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #104, #124-#129 in NGCFells' voice; close the finished ones; give NGCFells the URLs.

## Models

Task 1: Sonnet. Tasks 2-5 (binary layout work): Opus for the layout reading, Sonnet for the tests and records. Task 7: Haiku.
