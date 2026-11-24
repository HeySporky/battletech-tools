# Canonical design format, provenance, import review and unit domains (#100, #101, #102, #105, #106, #107, #108)

## Intent

One documented, versioned JSON format for every saved and exported design, whatever unit type and whatever file it came from. Importers (SSW, MTF, BLK, HMP, TDB) and exporters are adapters around it. Imported designs keep where they came from. A player sees what an import read, what it dropped and what it guessed before saving. Under it, the unit classes share one small domain interface, so routes, legality, sheets and importers stop asking BattleMech-only questions.

## What exists (2026-11-22)

- `src/data/canonical-record.ts`: schema version 1, BattleMech only. `ICanonicalRecord<T> { schemaVersion: 1; unitDomain: "battlemech" | "vehicle" | "aerospace" | "infantry"; ruleset; source?: { format?, fileName?, sourceBook?, warnings? }; record }`. `BattleMech.exportCanonical()` (`battlemech.ts:10207`) writes it; `parseBattleMechRecordJSON` reads either form and migrates legacy quad front legs. Nothing else uses it, and the creators' Export buttons write the raw save arrays (`mech-creator/home.tsx:305`, "battlmech-exports.json").
- Every unit class has its own `I<Unit>Export` and `import()`; the shared pieces are `UnitGameSettings` (`unit-game-settings.ts`), `TechnicalReadout` and the rules edition.
- The SSW import already analyzes then accepts with the importer's answers (`sswImportSession.ts`, #76). BLK files go through `importBlkUnit` (`blk-unit-import.ts`), MTF through `importBattleMechMtf` (`battlemech-mtf.ts:479`).

## Design

1. **Schema version 2, every domain.** `ICanonicalRecord` gains the domains the app builds: `battlemech | industrialmech | vehicle | support-vehicle | aerospace-fighter | conventional-fighter | small-craft | dropship | capital-ship | infantry | battle-armor | protomech | building | micro-mech | walker | battledroid`. Fields: `format: "jbt-design"` (a fixed marker so a file is recognised without its extension), `schemaVersion: 2`, `unitDomain`, `ruleset` ("classic-battletech" today), `rulesEdition`, `rulesLevel`, `rulesets`, `source?` (below), `record` (the domain's own export, unchanged). Version 1 files keep loading (BattleMech, migrated to 2 on read).
2. **Migrations are a chain.** `migrateCanonical(input): ICanonicalRecordV2` runs v0 (a bare legacy export, detected per domain) to v1 to v2, each step a pure function with a test of a real old save. Saved designs in local storage are migrated on load, never rewritten until the player saves.
3. **Documented.** `docs/canonical-format.md` describes every top-level field, the domain list, the migration rules, and links each domain's export interface. A JSON Schema (`docs/canonical-format.schema.json`) is generated from the TypeScript types by a test that fails when they drift.
4. **Provenance (#101)** in `source`: `format` (ssw, mtf, blk, hmp, hmv, tdb, jbt), `fileName` (the base name only, never a path), `sourceBook` (from the file's source line where it has one), `importedAt` (ISO date), `importer` (the app version), `warnings` (the importer's issues, verbatim), `answers` (the SSW clarification answers, when any). Bundled designs already carry their own credit; they get `source` at build time too.
5. **Import review screen (#102).** One shared component, `ImportReview`, used by the SSW, MTF and BLK import boxes: the parsed fields (name, model, tonnage, tech base, era, BV, cost), unmapped items and why, warnings, the provenance block, and a "Show the record" toggle with the final canonical JSON. Save stays where it is today; the review sits between "file chosen" and "Save". The SSW questions (#76) show inside it.
6. **Unit domains (#106, #107, #108).** `src/data/unit-domains.ts` holds the registry: for each domain, its route, its creator's page key, its sheet layouts, the importers that accept it, the equipment `space` key it uses (`battlemech`, `combatVehicle`, `supportVehicle`, ...), and a capability set (`hasCriticalSlots`, `hasQuirks`, `hasAlphaStrikeCard`, `hasOmni`, `hasPlay`). A `IUnitDomain` interface (shared concepts: identity, era, faction, tech base, movement summary, armor/structure summary, equipment list, crew, rules level and edition, source attribution, notes) is implemented by each unit class through thin getters; no construction code moves for that.
7. **BattleMech behind the interface (#108)** is the last step and moves only behaviour already pinned by tests: name/model/tonnage/tech/era/equipment summary getters, then the export/import envelope. The BV survey and the bundled-design tests must not move.

## Non-goals

- No change to any domain's own export shape (`record` is today's export, verbatim).
- No split of `battlemech.ts` beyond what step 7 says. A deeper split is its own plan when a need appears.
- Alpha Strike groups and campaign saves keep their own formats.

## OWNER CALLS (the plan is written to the recommended answer)

1. **File extension (#100 asks the group).** Recommended: keep `.json`, with `"format": "jbt-design"` inside, so any JSON tool opens it and the app recognises it by content. A dedicated extension (for example `.jbtd`) can be added later as an alias without a format change.
2. **What the creators' Export button writes.** Recommended: an array of v2 records (one per saved design) in `jbt-designs.json`; Import reads v2, v1 and the old raw arrays.
3. **File names in provenance.** Recommended: base name only, never the folder path (privacy).
4. **Review screen for bundled builds.** Recommended: no; it is for player imports. The build reports stay the review for bundled designs.

## Checklist

TRO: provenance line ("Imported from <file> (<format>)") on the TRO page and TRO sheet footer. Record sheet: none (the sheet already prints the design's source credit). Play: none. Alpha Strike: none. Credits: none. News: one bullet per shipped part. Issue comments on #100-#102 and #105-#108 in NGCFells' voice.
