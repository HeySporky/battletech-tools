# Canonical Format, Provenance, Import Review and Unit Domains Implementation Plan (#100, #101, #102, #105, #106, #107, #108)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every design saves and exports as one documented, versioned JSON record (schema 2) with provenance; every importer shows a review screen before saving; the unit classes share a small domain interface and registry.

**Architecture:** Extend `src/data/canonical-record.ts` from BattleMech-only v1 to all domains at v2 with a migration chain. Provenance rides in the record's `source`. One `ImportReview` component sits between file choice and Save in the SSW, MTF and BLK import boxes. A registry file, `src/data/unit-domains.ts`, maps each domain to its route, sheets, importers, equipment space key and capabilities; each unit class implements `IUnitDomain` with thin getters.

**Tech Stack:** TypeScript, React class components, Vitest (PowerShell), a JSON Schema generated from types in a test.

**Spec:** `docs/superpowers/specs/2026-11-22-canonical-format-design.md` (the OWNER CALLS there are planned to their recommended answers).

## Global Constraints

- `record` is each domain's existing export, verbatim. No domain export shape changes in this plan.
- Old saves and old export files load forever: bare v0 exports, BattleMech v1 records, and the creators' raw save arrays.
- Local storage is migrated in memory on load and written only when the player saves.
- Provenance keeps the file's base name only, never a path.
- Condense and extend: new files are `src/data/unit-domains.ts` (no registry exists), `src/ui/components/import-review.tsx` (no shared review exists), `docs/canonical-format.md` and `docs/canonical-format.schema.json`, each with tests beside them. Everything else extends existing files.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.
- Never change a bundled design's BV or sheet: `src/data/bundled-mechs.test.ts` and the BV survey (`bv-survey.generator.test.ts`) stay unchanged.

## Usual checklist

| Item | Task |
|---|---|
| Records, construction, play, Alpha Strike | not touched (format work) |
| TRO: provenance line on the TRO page and sheet footer | 4 |
| Record sheet | none (the sheet already prints the design credit) |
| Credits | none |
| News, review, check, deploy, issue comments | 8 |

## Review Focus

- A BattleMech v1 export from before this change, a raw save array from `battlmech-exports.json`, and a v2 file all load into the same design.
- A v2 file with an unknown `unitDomain` or a newer `schemaVersion`: a clear message ("made by a newer version"), nothing saved, no crash.
- A file name with a folder path (`C:\Users\...\Atlas.ssw`) is stored as `Atlas.ssw`.
- An import with zero warnings still shows the review (parsed fields and provenance), and Save works with one click.
- `IUnitDomain` getters on every class return the same values the creators show today (snapshot per sample design).

---

### Task 1: Schema 2 and the migration chain

**Files:** Modify `src/data/canonical-record.ts`; test `src/data/canonical-record.test.ts`.

**Interfaces (produces):**
- `CANONICAL_RECORD_SCHEMA_VERSION = 2`, `type CanonicalUnitDomain = "battlemech" | "industrialmech" | "vehicle" | "support-vehicle" | "aerospace-fighter" | "conventional-fighter" | "small-craft" | "dropship" | "capital-ship" | "infantry" | "battle-armor" | "protomech" | "building" | "micro-mech" | "walker" | "battledroid"`.
- `interface ICanonicalSourceMetadata { format?: "ssw" | "mtf" | "blk" | "hmp" | "hmv" | "tdb" | "jbt"; fileName?: string; sourceBook?: string; importedAt?: string; importer?: string; warnings?: string[]; answers?: Record<string, unknown> }`
- `interface ICanonicalRecordV2<T> { format: "jbt-design"; schemaVersion: 2; unitDomain: CanonicalUnitDomain; ruleset: string; rulesEdition?: string; rulesLevel?: number; rulesets?: string[]; source?: ICanonicalSourceMetadata; record: T }`
- `toCanonicalRecord<T>(domain, record: T, settings: { rulesEdition?; rulesLevel?; rulesets? }, source?): ICanonicalRecordV2<T>`
- `migrateCanonical(input: unknown, expected?: CanonicalUnitDomain): { record: ICanonicalRecordV2<unknown> } | { error: string }` (v0 bare export, v1 BattleMech, v2)
- `baseFileName(path: string): string`
- `parseBattleMechRecordJSON` keeps its signature and goes through `migrateCanonical`.

- [ ] Failing tests: v1 BattleMech fixture migrates to v2 with the same `record`; a bare `IBattleMechExport` migrates (domain from `mechType`/`industrial` fields); a v2 record round-trips; `schemaVersion: 3` returns `{ error: "made by a newer version" }`; an unknown domain errors; `baseFileName("C:\\a\\b\\Atlas.ssw") === "Atlas.ssw"` and the same for `/`; the legacy quad migration still passes (existing tests).
- [ ] Run `npx vitest run --project unit src/data/canonical-record.test.ts`. Expected: FAIL.
- [ ] Implement. Run, PASS. Commit `Canonical format: schema 2 for every domain, with migrations (#105)`.

### Task 2: Every class writes and reads the record

**Files:** Modify `src/classes/battlemech.ts` (`exportCanonical` at ~10207 calls `toCanonicalRecord`), and add `exportCanonical(source?)` plus an `importCanonical(input)` path to `vehicle.ts`, `aerospace-fighter.ts`, `small-craft.ts`, `capital-ship.ts`, `infantry-platoon.ts`, `battle-armor.ts`, `protomech.ts`, `building.ts`, `micro-mech.ts`, `walker.ts`, `battledroids-unit.ts`. Test: one round-trip test per class in its existing `<class>.test.ts`.

- [ ] Failing tests: for one sample design of each class, `importCanonical(exportCanonical())` gives an export deep-equal to the original `export()`; a bare old export passed to `importCanonical` loads the same way.
- [ ] Run each class test. FAIL. Implement (each class: `exportCanonical` wraps `this.export(true)` with its domain and `this.gameSettings`; `importCanonical` runs `migrateCanonical` then `this.import(record)`). Run, PASS.
- [ ] Commit `Canonical format: every unit type exports and imports the record (#105)`.

### Task 3: Export and import buttons use it; the documentation

**Files:** Modify the Export/Import on each creator home (`src/ui/pages/classic-battletech/*-creator/home.tsx`; the 'Mech one at `mech-creator/home.tsx:300-306`) and `src/ui/pages/settings/backup-and-restore.tsx` (restore accepts v2 arrays). Create `docs/canonical-format.md`, `docs/canonical-format.schema.json`. Test: `src/data/canonical-record.test.ts` (schema drift test), the creators' existing home tests.

- [ ] Failing tests: the 'Mech Export link's JSON is an array of v2 records named `jbt-designs.json`; importing the old `battlmech-exports.json` shape still adds the designs; the schema file matches the types (generate with `typescript-json-schema`-free code: a small walker over a hand-kept field list in the test, so no new dependency); backup and restore keeps v2 designs.
- [ ] Run, FAIL. Implement. Write `docs/canonical-format.md` (fields, domains, migrations, versioning rule: additive changes keep the version, removals or meaning changes bump it). Run, PASS.
- [ ] Commit `Canonical format: exports write schema 2, documented (#100)`.

### Task 4: Provenance on imports, TRO line

**Files:** Modify `src/utils/sswImportSession.ts` (`acceptSSWImport` fills `source`), `src/classes/blk-unit-import.ts` (`importBlkUnit` returns `source`), `src/classes/battlemech-mtf.ts` (`importBattleMechMtf` returns `source`); each class keeps `source` in a new optional `provenance` field on `TechnicalReadout` (`technical-readout.ts`, exported as `tro.provenance`). Modify the TRO page and TRO sheet footer (grep `getProductionValue` in `src/ui/components`). Test: `src/utils/sswImportSession.test.ts`, `src/classes/blk-unit-import.test.ts`, `src/classes/technical-readout.test.ts`.

- [ ] Failing tests: an SSW import records `{ format: "ssw", fileName: "Atlas AS7-D.ssw", warnings: [...] , answers }`; a BLK import records `format: "blk"` and the BLK `source:` line as `sourceBook`; the TRO shows "Imported from Atlas AS7-D.ssw (SSW)"; a design made in the creator has no provenance line.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Imports keep provenance: file, format, book, warnings (#101)`.

### Task 5: The import review screen

**Files:** Create `src/ui/components/import-review.tsx` and `import-review.test.tsx`. Modify `src/ui/pages/classic-battletech/mech-creator/ssw-file-import.tsx` (the questions render inside it), `src/ui/components/blk-import-section.tsx` (every BLK creator uses it), and the MTF import box once the MegaMek plan adds it (`docs/superpowers/plans/2026-11-22-megamek-import-export.md`, Task 2).

**Interfaces:** `<ImportReview fields={{ name, model, tonnage, techBase, era, bv, cost }} unmapped={string[]} warnings={string[]} source={ICanonicalSourceMetadata} record={ICanonicalRecordV2} onSave onCancel>`.

- [ ] Failing tests: the review lists parsed fields, each unmapped item with its reason, the warnings, the provenance block; "Show the record" reveals the JSON; Save calls `onSave` once; a file with no warnings shows "No warnings"; the SSW questions still gate Save (existing `ssw-file-import.test.tsx` passes unchanged).
- [ ] Run, FAIL. Implement. Run the component test and `npx vitest run --project unit src/ui/pages/classic-battletech`. PASS.
- [ ] Commit `Imports: a review screen before saving (#102)`.

### Task 6: The domain registry and interface

**Files:** Create `src/data/unit-domains.ts`, `src/data/unit-domains.test.ts`. Modify each unit class (thin getters only).

**Interfaces:**
- `interface IUnitDomain { getDomain(): CanonicalUnitDomain; getName(): string; getModel(): string; getTonnage(): number; getTechBaseLabel(): string; getEraLabel(): string; getMovementSummary(): string; getArmorSummary(): { armor: number; structure: number }; getEquipmentSummary(): { name: string; location: string }[]; getCrewSummary(): string; getRulesLevel(): number; getRulesEdition(): string; getSourceAttribution(): string; getNotes(): string }`
- `interface IUnitDomainInfo { domain; route: string; sheetLayouts: string[]; importers: ("ssw"|"mtf"|"blk"|"hmp"|"hmv"|"tdb")[]; spaceKey: keyof IEquipmentSpace; capabilities: Set<"criticalSlots"|"quirks"|"alphaStrikeCard"|"omni"|"play">; }`
- `UNIT_DOMAINS: Record<CanonicalUnitDomain, IUnitDomainInfo>`, `getUnitDomainInfo(domain)`.

- [ ] Failing tests: every `CanonicalUnitDomain` has an entry; every `route` exists in the router (`src/ui/pages/classic-battletech/_router.tsx` or the app router; grep `path=`); every `spaceKey` is a key of the equipment `space` object; for one sample of each class, the `IUnitDomain` getters equal what its creator summary shows today (snapshot).
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Architecture: unit-domain registry and shared interface (#106, #107)`.

### Task 7: Callers select by domain; BattleMech behind the interface

**Files:** Replace BattleMech-only checks where the registry answers the question. Find them with `grep -rn "instanceof BattleMech\|mechType ===\|getMechType()" src/ui src/utils | cut -c1-160` and change only routing, legality (`space` key) and importer selection, one area per commit. In `battlemech.ts`, implement `IUnitDomain` and route `exportCanonical`/`importCanonical` through the shared envelope (#108).

- [ ] For each area: failing test that a non-'Mech unit takes the right path (for example the BLK import box offers only its creator's domains from `UNIT_DOMAINS[...].importers`), implement, run that area's tests, commit `Architecture: <area> selects by unit domain (#107)`.
- [ ] Last: `npx vitest run --project unit src/classes src/data` and the BV survey test. Expected: PASS, survey unchanged. Commit `Architecture: BattleMech behind the domain interface (#108)`.

### Task 8: Checklist, review and ship

- [ ] **News:** one bullet: "Designs now save and export in one documented format (with where an import came from), and every import shows what it read before you save."
- [ ] **Check:** `npm run check` from PowerShell. Expected: green except the known load-sensitive timeouts.
- [ ] **Review:** one Opus whole-branch review (architecture). Fix Critical and Important findings test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta` (expect "Published").
- [ ] **Issues:** comment on #100, #101, #102, #105, #106, #107, #108 in NGCFells' voice; close each with its evidence; give NGCFells the URLs.

## Models

Tasks 1-5: Sonnet. Tasks 6-7: Opus (cross-cutting refactor). Review: Opus.
