# Data Checks and Catalog Follow-ups Implementation Plan (#130, #132, #133, #181, #184, #185, #214, #216, #217)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the catalog's open data checks: a sourcebook validation tool (#130), the munitions with no IO data (#132), the inventory against the current rulebooks (#133), one ammo/prototype/composite field read everywhere (#181), the Alpha Strike workbook blocks 13-20 and its source gaps (#184, #185), the custom records' tech base (#214), the catalog-per-category audit (#216) and manufacturers (#217).

**Architecture:** Two dev tools (Python under `tools/`, never shipped): a validator that compares every catalog record with the ResourceLibrary extracts, and the existing inventory audit widened to the current books. Data fixes go straight into the owning catalog files (the literal-object rule: no generated supplemental imports). The app side changes only where a calculation still reads a legacy field.

**Tech Stack:** Python 3.11 (tools), TypeScript, Vitest (PowerShell).

**Spec:** the issues; `docs/superpowers/specs/2026-10-24-catalog-consolidation-design.md` (rulings 1-3: different items stay separate, true twins merge, canon-early-dropped-later is one record); `tools/alpha-strike-workbook-review-blocks.md` (blocks 13-20, findings F1-F12, the 2026-09-28 decisions).

## Global Constraints

- The library text now lives in `C:/repo/ResourceLibrary/text` (the issues name the older `C:/repo/JBTIICRework`): extract first, page image only when the extract is missing, garbled or in doubt, written back WHOLE into every printing's extract and `_corrected_pages.md`, then pushed.
- Tools report; they never write catalog files. Every catalog change is a reviewed commit with its book and page.
- Removed items stay apocryphal (never deleted); a book offering an item for an edition makes it available there.
- Ours only at levels 6-7; an inferred AS conversion of a canon item stays at its level with `alphaStrike.inferred: true`.
- Never grep `src/data/equipment-*.ts` without `| cut -c1-200`. Kept bundled designs' BV must not move (bundle tests).
- Condense and extend: the validator is `tools/validate_catalog_sources.py` (new: no tool compares against the book text today; `tools/audit_equipment_sources.py` compares against scraped profiles and is extended, not replaced, for #133). Tests: `tools/test_validate_catalog_sources.py` beside it, and the existing `src/data/*.test.ts` for app changes.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **#184 open findings** (awaiting since 2026-09-28):
   - F3 Clan Prototype LB 5-X: take the workbook row (the catalog value is a bad copy). Recommended: yes.
   - F5 ATM notation: recommended: per-weapon fractions, as every other weapon record carries, since the converter sums per-weapon values; checked against three MUL ATM units' cards before applying.
   - Rest of F4 and F12: recommended: take the workbook value only where it matches the MUL card of at least two units carrying the weapon; otherwise keep ours with a note giving both numbers.
   - The "Proposed: Clan Only" rows: recommended: approve as proposed (each is a Clan-only item in TM/TO tables), after the validator (Task 1) confirms the tech base from the book.
   - Clan UAC/5 short 0.623 vs 0.75 and Clan UAC/20 TC: same MUL-card test as F12.
2. **#216 file split.** The later consolidation design keeps one file per category with `editions`, `apocryphalIn` and `rulesLevel` on each record, and custom/Munchkin in their own `*-custom.ts` files. Recommended: the rules-level split is done by those fields, not by more files; Task 7 audits that every record states its level and every custom record lives in a custom file, then #216 closes on that evidence.
3. **#217 manufacturers.** Recommended: an optional `manufacturers: { name: string; book: string; page: number }[]` on catalog records, harvested only from printed TRO "Armament" and component lines (never invented), and a per-design make from its own TRO text where printed. The sheet option "Show makes" prints the design's own make, else nothing.

## Usual checklist

| Item | Task |
|---|---|
| Records (data fixes, new editions/apocryphal marks, manufacturers) | 2, 3, 5, 6, 8 |
| Construction / record sheet / play | 4 (cost and sheet read the right fields), 8 (makes on the sheet) |
| Alpha Strike | 5, 6 |
| TRO | 8 (makes on the TRO line) |
| Credits | none |
| News, review, check, deploy, issue comments | 9 |

## Review Focus

- The validator never calls a mismatch a pass: a record whose book is not local is "unchecked", not "ok".
- An IS/Clan pair merged by mistake: the consolidation rule says merge only when every stat but tech base is equal; the merge test must compare every field.
- Ammo with `roundsPerTon` and a legacy `shots` field disagreeing: the cost, sheet and AS all read `roundsPerTon`.
- Alpha Strike values changed in Task 5: no MUL-matched unit's card moves further from its MUL card (the AS MUL-match tests).

---

### Task 1: Sourcebook validation tool (#130)

**Files:** Create `tools/validate_catalog_sources.py`, `tools/test_validate_catalog_sources.py`. Input: a JSON dump of every catalog record (add a tiny vitest dumper `src/data/catalog-dump.generator.test.ts`, skipped unless `CATALOG_DUMP=1`, writing `node_modules/.cache/catalog-dump.json`, following `bv-survey.generator.test.ts`).

- [ ] For each record with `book` and `page`: find the book's extract(s) by the book key (a table in the tool maps "TM", "TO:AUE", "IO:AE", "TW", "BMM", "MT", "BMR(R)" ... to `ResourceLibrary/text` file names), find the record's name on that page (page markers in the extracts), and compare weight, slots, damage, heat, ranges, BV, cost, tech rating and dates against the printed table row. Report mismatches with book and page; books not local are listed as unchecked.
- [ ] Failing pytest first: a fixture extract with a two-row table and three records (one match, one mismatch on heat, one unchecked book) gives exactly those three results.
- [ ] Run `py -3.11 -m pytest tools/test_validate_catalog_sources.py`. FAIL, then implement, PASS.
- [ ] Run it on the real catalogs; save the report to the ledger `.superpowers/sdd/2026-11-22-data-checks/progress.md` (not committed). Commit `Dev tools: validate catalog records against the rulebook text (#130)`.

### Task 2: Munitions with no IO data (#132)

Records: LRM Incendiary, SRM Tear Gas, SRT Harpoon, Vehicle/Heavy Flamer Inferno and Water; tags `ammo-long-tom-ap`, `ammo-sniper-ap`, `ammo-thumper-ap`.

**Files:** `src/data/ammo.ts` (or the ammo catalog that holds each; grep the tags), test `src/data/ammo.test.ts` (or the nearest existing ammo test).

- [ ] Search every edition's book for each round: Maximum Tech, BMR(R), Tactical Handbook, TO, TO:AUE, IO, IO:AE (`grep -n -i "incendiary" C:/repo/ResourceLibrary/text/MaximumTech-FASA-1700-1999-Corrected2ndPrinting.txt` and the same per book). Record each hit (book, page, stats) in the ledger.
- [ ] Failing tests: each round lists the editions whose books print it, with `editionStats` as printed there, and is apocryphal after its last printing; a historical tag with no canon round anywhere is marked `rulesLevel` Apocryphal (5) with a note "no canon round found in <books searched>".
- [ ] Run, FAIL. Fix the records. Run, PASS. Commit `Ammunition: editions for the munitions IO does not print (#132)`.

### Task 3: Inventory against the current rulebooks (#133)

**Files:** Extend `tools/audit_equipment_sources.py` (a `--books` mode reading the TM pp.341-352, TO:AUE pp.215-230, IO:AE pp.210-220 cost and availability tables from the extracts) and write its report to the ledger.

- [ ] List: missing (in a table, no record), duplicate (two records, every stat equal but tech base: candidates for the twin merge), renamed (same stats, different name: add `altNames`), obsolete (record with no book anywhere: apocryphal check), and domain legality (one record per item, with `space` per unit type).
- [ ] Each "missing" item becomes a record in its category file (one commit per category, book and page cited, AS conversion or reason); each true twin merges per ruling 2 with the old tag kept in `altTags`.
- [ ] Commit per category `Catalog: <category> against the current rulebooks (#133)`.

### Task 4: Ammo, prototype and composite fields read everywhere (#181)

**Files:** Find the readers with `grep -rn "\.shots\b\|ammoPerTon\|\.prototype\b\|composite" src/classes src/utils src/ui | cut -c1-160` and fix each in place: cost (`getCost` paths in the unit classes), the record sheet ammo lines (`src/ui/components/svg/`), and the AS conversion (`src/utils/calculateAlphaStrikeValue.ts`, `convertTabletopWeaponToAlphaStrike.ts`). Test: `src/data/equipment-registry.test.ts` plus the area tests.

- [ ] Failing tests: an ammo record with `roundsPerTon: 6` and a legacy `shots: 10` shows 6 on the sheet, costs by 6, and converts by 6; a weapon with `prototype` set shows "(prototype)" and its prototype cost multiplier before its production year (TO:AUE / IO:AE prototype rules, extract first); a composite record (grep `composite` in `data-interfaces.ts`) costs and converts as the sum of its parts.
- [ ] Run, FAIL. Fix each reader. Run, PASS; BV survey unchanged. Commit `Equipment: cost, sheet and Alpha Strike read roundsPerTon, prototype and composite records (#181)`.

### Task 5: Alpha Strike workbook blocks 13-20 (#184)

**Files:** `tools/alpha-strike-workbook-review-blocks.md` (record each decision), the owning catalogs (`equipment-ballistic.ts`, `equipment-energy.ts`, `equipment-missile.ts`), test `src/data/alpha-strike-conversion-guard.test.ts` and the AS MUL-match tests (grep `MUL` in `src/classes/battlemech-alpha*.test.ts`).

- [ ] Apply OWNER CALL 1 row by row: record the classification (`IS`, `Clan`, `Universal`, `Both (Stats Differ)`) in the blocks file first, then the catalog value, each with "Provisional workbook conversion" where the value came from the workbook.
- [ ] Failing tests for each changed value (pin the new numbers), then edit, then run the AS tests: no MUL-matched card moves away from its MUL value.
- [ ] Commit per block `Alpha Strike: workbook block <n> classified and promoted (#184)`.

### Task 6: Alpha Strike workbook source gaps (#185)

- [ ] For each gap (weights and slots absent from workbook rows, Clan alternate-ammo variants, torpedo `-T` ammunition, numeric TOR profiles): find the Classic record's book values (Task 1 validator) and convert by the Alpha Strike Companion's rules (`AlphaStrikeCompanion-CGL-2022-V16Dated20221206.txt`, the Converting chapter) instead of the workbook. Torpedo profiles: TOR# per ASC.
- [ ] Failing tests pinning each converted value, edit, run, commit `Alpha Strike: close the workbook source gaps (#185)`.

### Task 7: Custom tech base and the per-category audit (#214, #216)

**Files:** the `*-custom.ts` catalogs; test `src/data/custom-completeness.test.ts`.

- [ ] List the custom records whose `techBase` was set from tag and name (grep the catalog-rework commit `bda20367a`'s note, or every custom record with `techBase` and no tech-base sentence in `notes`). For each, read its source (the post or fanzine named in `notes`) and set IS, Clan or universal with a note citing it.
- [ ] Failing tests: every custom record's notes say where its tech base comes from; every record in the app's catalogs has a `rulesLevel` or an edition level; no record with `rulesLevel` 6 or 7 is in a non-custom file; no canon record is in a custom file.
- [ ] Run, FAIL. Fix. Run, PASS. Commit `Catalog: custom records' tech base reviewed; rules levels audited (#214, #216)`.

### Task 8: Manufacturers (#217)

**Files:** `src/data/data-interfaces.ts` (`manufacturers?`), the catalogs (harvest), `src/classes/technical-readout.ts` (a design's per-item make from its TRO), the sheet option (grep the sheet options panel for an existing checkbox such as quirks), the TRO line. Test: `src/data/equipment-registry.test.ts`, the sheet test for 'Mechs.

- [ ] Harvest: a tool `tools/harvest_manufacturers.py` reads TRO extracts' "Armament:" and component lines, matches item names to records, and lists `{ record tag, make, book, page }` for review in the ledger. Only reviewed rows go in.
- [ ] Failing tests: a record with makes exposes them; the sheet with "Show makes" on prints the design's own make for an item that has one and nothing for one that does not; off by default.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Catalog: manufacturers from the TROs, on records and sheets (#217)`.

### Task 9: Checklist, review and ship

- [ ] **News:** bullets for the AS value fixes and the "Show makes" sheet option.
- [ ] **Check:** `npm run check`; BV survey and AS MUL-match unchanged except the intended values.
- [ ] **Review:** astech Opus review of Tasks 2-6 (rules data). Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on each issue in NGCFells' voice; close the finished ones; give the URLs.

## Models

Tasks 1, 3, 8 tools: Sonnet. Tasks 2, 5, 6 rules data: Opus (astech). Tasks 4, 7: Sonnet.
