# Bundled MUL designs: a record sheet for every Master Unit List unit we have a file for

Status: approved 2026-10-25 with the user's rulings on source priority and attribution (items 3 and 6).

## Intent

The Classic Roster's Master Unit List search can show a record sheet (View, TRO, Add) only when it finds a design for
the unit. Today that means the user's own saved designs, the 508 bundled Skunk Werks 'Mechs (rules levels 0-2 only),
and the ArtVee samples. Most MUL entries have no sheet. We already hold source files for most of them: 3,358 SSW
files, MegaMek's 4,295 MTF and 6,723 BLK files. The user wants them converted into our own designs, kept as small
as possible, and shipped (user, 2026-10-25).

## What exists (measured 2026-10-25)

| MUL type | Entries | Source on hand | Importer |
| --- | --- | --- | --- |
| BattleMech, IndustrialMech | 4,250 | SSW 3,358; MTF 4,295 | SSW yes; MTF no |
| Battle Armor | 1,199 | BLK | yes |
| Combat Vehicle, OmniVehicle | 1,248 | BLK | no |
| Fighter, Aerospace Craft | 1,012 | BLK | Small Craft and DropShips yes; fighters no |
| Support Vehicle | 446 | BLK | yes |
| Infantry | 441 | BLK | no |
| ProtoMech | 86 | BLK | yes |

The SSW survey: all 3,358 files import. 3,173 match the file's own BV. 3,037 match a MUL 'Mech entry, and 2,912 of
those match the MUL's BV. Import costs about 46 ms a design, so a full library can never be parsed at launch.

Our saved-design JSON is about 10 KB a 'Mech (34 MB for the SSW library). Most of that is the crit table, which is
held twice (`allocation` and each equipment item's placement), plus in-play state (armor and structure bubbles,
to-hit blocks, pilot) and UUIDs. The bundled SSW XML today is 2.1 MB for 508 designs and is parsed at every launch.

## Goals

- A View/TRO/Add result for every MUL entry we have a file for that converts with a correct BV.
- A smaller footprint than today, even with about ten times the designs.
- Nothing parsed at launch: designs load when the user searches.
- Converted once, at build time, by a dev script. The app never ships the raw SSW, MTF or BLK files.

## Non-goals

- No new search or sheet UI. The MUL search dialog, its View/TRO/Add buttons and the existing sheets are reused.
- No hand fixes to individual designs. A design that does not convert cleanly is left out and listed in the
  script's report.

## Design

1. **Compact design format, one codec for every unit type.** A design's export with everything a fresh unit of that
   type would export anyway removed: in-play state, UUIDs, timestamps, defaults, and anything rebuilt on load (the
   duplicate crit table, cost, BV, Alpha Strike values). Loading merges it back onto a fresh unit's export and
   imports that through the existing `importJSON`. Expected size: about 1 KB a 'Mech before gzip.
2. **Build script** (`src/bin/`, run by hand like the existing SSW converter). It reads the source folders, imports
   each file with our importers, matches it to a MUL entry by chassis and model (`getMULMatchKeys`), and keeps it
   when our BV equals the MUL's BV, or the file's own BV where the MUL has none. It writes one data file per unit
   type, plus a report of everything left out and why.
3. **Source priority (user ruling 2026-10-25).** SSW first. MegaMekLab files (MTF, BLK) are used only when no SSW
   file exists for the unit. When an SSW file exists but does not convert cleanly, the unit is left out and reported;
   the script does not fall back to the MegaMek file.
4. **Loading.** Each type's file is a separate chunk, fetched the first time the MUL search needs that type. Only
   the design picked for View/TRO/Add is imported.
5. **Replaces `sswMechs.ts`.** The 2.1 MB XML bundle and the import-at-launch loop go away. The Mech Creator's
   bundled-designs list reads the new 'Mech file. This also covers the open performance issue about parsing every
   bundled 'Mech at launch.
6. **Provenance and attribution (user ruling 2026-10-25).** Each design records its source: `ssw`, `megamek`, or
   `verified` (checked by us against its printed TRO). SSW-sourced files carry the SSW notice, as `sswMechs.ts` does
   today. MegaMek-sourced designs carry the MegaMek credit and its CC BY-NC-SA 4.0 notice, on the design and on the
   About page. When a design is verified against its TRO, its source becomes `verified` and the MegaMek credit and
   license notice are removed from it, since the data is then our own transcription. The About page notice goes when
   no `megamek` design is left.

## Rounds (one per round, ship and report after each)

1. Codec, build script and every SSW 'Mech. `sswMechs.ts` is retired, and the corpus tests move to the new file.
2. BLK units with importers we already have: battle armor, ProtoMechs, Support Vehicles, Small Craft and DropShips.
3. MTF import ('Mech MTF issue) and the 'Mechs SSW does not cover.
4. BLK import for combat vehicles, then fighters, then conventional infantry. Each one is its own round, and each
   closes part of the MegaMek BLK issue.

## Tests

- **Round trip:** every bundled design, decoded and imported, gives the same BV, tonnage, cost and crit table as
  the direct import it was made from. This is a corpus test, sharded like `ssw-corpus-*.test.ts`.
- **Search:** a unit from each new file appears in the MUL search with View working (component test, per type).
- **Size:** each data file's size is pinned, so a growing file is a deliberate change.

## Left to the builder

The exact field list the codec drops, the data file paths and names, and the report format.

## Builder's calls (round 1, 2026-10-25)

- **Codec** (`src/utils/bundled-designs.ts`): the unit's export without in-play state, minus every top-level field
  equal to a blank unit's, minus BV, cost, Alpha Strike value, UUID and timestamp, minus empty fields inside list
  entries, with UUIDs shortened to `#n`. A 'Mech's crit table entry for an installed item keeps only its place
  (uuid, location, slot, rear, size, and crits where a split item's differ). Heat sinks and other entries with no
  equipment item keep every field: dropping them lost crit table entries. About 2.9 KB a 'Mech before gzip, not the
  1 KB first guessed.
- **Files**: `src/data/bundled/mechs-index.json` (one header a line: name, model, tons, BV, cost, rules level, year,
  tech, MUL id, source) and `src/data/bundled/mechs/<n>.json`, 150 designs a chunk, each fetched on first use. The
  report is `src/data/bundled/mechs-report.md`.
- **Build**: an env-gated vitest writer (`WRITE_BUNDLED_MECHS=1`), like the ArtVee MUL writer, since it needs Vite's
  module resolution. Replaced 2026-10-27 by `npm run build:bundled`: `scripts/bundled-build.mjs` bundles
  `src/data/bundled-build-runner.ts` with Vite and runs each file's import and checks on worker threads, cached per
  file (32 min to 3.5 min cold, 16 s warm). It also runs the old corpus checks (engine, gyro and structure names, failed crit placements,
  import errors), which leave a file out instead of failing a test.
- **OmniMechs** are left out in round 1: the SSW import reads only the base loadout, not the configurations, so every
  OmniMech fails its BV check. The SSW OmniMech issue (#112) brings them in; the header and index already carry
  configurations for when it does.
- **Tests**: the build checks every design's round trip in full (BV, cost, tonnage, crit table). The standing test
  loads every 10th design and compares BV, cost and tonnage with its header, since a full load is about 140 ms a
  design. Loading is that slow because each setter in `import` runs a full recalculation.
- **Retired with `sswMechs.ts`**: the old converter (`src/bin/convert-ssw-to-bttools.ts`), the SSW corpus shards, and
  the developer-menu SSW Sanity Check page, whose BV and cost comparison the build report now does for every file.

## Builder's calls (round 2, 2026-10-25)

- **Layout**: every type is `src/data/bundled/<type>-index.json` plus `<type>/<n>.json`, read through one loader
  (`src/data/bundled-units.ts`). The types are `battle-armor`, `protomechs`, `small-craft` (Small Craft and
  DropShips) and `support-vehicles` (ground and VTOL). Fixed-wing Support Vehicles wait for the fighter round: none
  matched the MUL's BV.
- **Build**: `WRITE_BUNDLED_UNITS=1 npx vitest run src/data/bundled-units.test.ts`. It takes about a minute.
- **What a file must pass to be kept**:
  - the import carries the whole file over, with no issues reported;
  - our BV equals the MUL's (MegaMek files hold no BV of their own, so a file with no MUL entry is left out);
  - the design survives the compact format, with the same BV, the same cost and an identical re-compacted design.
- **MUL ids (user, 2026-10-25)**: every bundled design that matches a MUL entry carries that entry's id, whether the
  entry is live, MUL 1.0 or one of our custom entries. A MegaMek file's `mul id` is MUL 1.0's. Only our MUL 1.0
  leftover entries still carry those ids, so a file links to one of them by id; every other file is matched by name.
- **Duplicates**: a design is a duplicate only when its full name repeats. A battle armor name ends in its squad
  size ("(Sqd4)"), which the alternate-name keys read as a second chassis name.
- **Battle armor BV fix**: an assault rifle (auto-rifle) in an anti-personnel mount adds no BV. The MUL values all
  181 suits carrying one this way without it, and MegaMek does the same after a rules forum answer. With this fix,
  820 of 1,188 battle armor files match the MUL.
- **Results**:

  | Type | Kept | Files |
  | --- | --- | --- |
  | Battle armor | 820 | 1,188 |
  | ProtoMechs | 62 | 86 |
  | Small Craft and DropShips | 30 | 248 |
  | Support Vehicles | 5 | 225 |

  Most of what is left out has no MUL entry, or a BV the importers do not reach yet. Support Vehicle chassis mods,
  fire control and many named items are among the causes. The per-file reasons are in each `<type>-report.md`.
- **Size**: about 4.7 MB raw and about 420 KB gzipped, most of it TRO text.
- **Stable rebuilds**: both builds seed `Math.random` from each file's name, and the codec shortens UUIDs that carry
  a suffix (a crit slot's `uuid:7`). A rebuild from the same files is byte-identical, so its diff shows only the
  designs that changed.

## Builder's calls (round 3, 2026-10-26)

- **SSW OmniMechs (#112, folded in by the user 2026-10-26)**: an SSW file's every `<loadout>` becomes one of our
  configurations, the first one active. Each loadout is imported as the base loadout plus its own items: the base
  loadout's equipment is marked fixed, the loadout's goes in pods. SSW repeats the base loadout's CASE in every
  loadout, so an item at the same name and slot as a base item is taken once. A loadout's heat sinks and jump jets
  give the total but list only the pod ones' slots, so the base loadout's slots are added. A loadout without heat
  sinks, jump jets or actuators keeps the base loadout's.
- **Configurations carry more than pods**: SSW loadouts vary the heat sinks, jump jets, lower arm and hand
  actuators and Clan CASE (the Dire Wolf Prime has 22 double heat sinks, the B 15, the C 3 jump jets). A stored
  configuration now keeps them (`IOmniConfiguration.chassis`), with the heat sink and jump jet slots. In the editor
  these are now set per configuration too. Saves from before this have no `chassis` and keep the chassis values.
- **A configuration's BV**: an OmniMech keeps each configuration whose BV matches the MUL's, or the loadout's own
  BV in the file where the MUL has no entry. The others are dropped one by one and listed in the report
  ("configuration BV differs from the MUL"). The design is left out only when no configuration passes.
- **MegaMek 'Mechs**: after the SSW files, the build reads MegaMek's `.mtf` files. A file whose 'Mech an SSW design
  already covers (by name, or by MUL id) is a duplicate. SSW comes first, but a 'Mech whose SSW file failed may still
  come from MegaMek. A MegaMek file has no BV of its own, so it is kept only on a MUL BV match: by its `mul id`
  (MUL 1.0's ids) when that entry has a BV, else by name. MegaMek OmniMechs keep one file per configuration, so each
  is its own design; MegaMek's `(OMNIPOD)` items go in pods, the rest is fixed.
- **Converter fixes**: an engine without a tech marker is the design's own tech base (the build's chassis check
  read 1,037 such engines as wrong); Talons, one item spread over every leg, are listed once, as SSW does.
- **Catalog**: the Clan SRT and LRT records gained SSW's spellings ("SRT-6", "LRT-20"); the U Dire Wolf's Clan
  SRT-6 had resolved to the Inner Sphere record.
- **Compact format**: an OmniMech's active configuration is not stored a second time; it is the design's own
  equipment and is stored again when the design is saved.
- **Notice**: the index notice credits both Skunk Werks and MegaMek (`BUNDLED_MECHS_NOTICE`); the MegaMek credit
  moved to `bundled-mechs-build.ts`, and `bundled-units-build.ts` re-exports it unchanged.
- **Results**: 3,549 'Mechs kept (2,859 before): 2,947 from Skunk Werks, 84 of them OmniMechs with their
  configurations, and 602 from MegaMek. The commonest reasons left in `mechs-report.md`: LAMs, Heavy Industrial
  armor, the Cockpit Command Console, Narc-capable and special Arrow IV ammunition, HarJel III, supercooled
  myomer, prototype jump jets and the Clan ER flamer.
- **Size**: 18.7 MB raw and 1.8 MB gzipped (0.9 MB before), most of the growth MegaMek's TRO text. The chunks
  load as they are needed; the test's cap is 19.5 MB.
