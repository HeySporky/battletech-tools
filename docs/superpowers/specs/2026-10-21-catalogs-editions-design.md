# Catalogs by category, with the editions each record is canon in

Date: 2026-10-21. Status: design, awaiting the user's approval.

## Why

The equipment catalogs are split by tech base (`mech-is-*`, `mech-clan-*`, `mech-universal-*`) and say only loosely
where a record stands in each rules edition. The user wants to pick an edition and a rules level and see exactly what
that edition offered at that level, nothing more. They also want to see, for any record, which editions it was canon
in, if any. This comes before the quirks (step 3) and the last ArtVee pieces (step 4), because both depend on knowing
a record's standing in each edition.

## User rulings (2026-10-21)

1. **One file per category (option B).** Canon and apocryphal records live together in one official catalog file per
   category, with Inner Sphere, Clan and universal records side by side. The rules level is a field on the record,
   not a file.
2. **A valid-editions array.** Each record lists every edition it was canon in. A record that was never canon has an
   empty list.
3. **Hide what isn't selectable.** "If it is not selectable in that edition at that rules level it gets hidden."
4. **Dropped items become apocryphal.** "Equipment and options from older rules editions that disappear move to
   apocryphal for later editions."
5. **BattleTechnology** (and other FASA-era licensed material) is plain canon in the editions current when the issue
   was published, and apocryphal from FanPro's takeover on.

## Goals

- One official catalog file per category: energy, ballistic, missile, artillery, misc (electronics stays in misc as it
  is today), ammunition. The component catalogs (armor, engine, gyro, cockpit, heat sink, internal structure, jump
  jet, myomer, 'Mech type, tonnage) already have one file per category and keep it.
- Every official record carries `editions`, and the builders read a record's standing in an edition from it.
- A rules level for each edition a record is in, graded as that edition's books grade it.
- The equipment pickers in every builder ('Mech, vehicle, fighter, small craft, capital ship, ProtoMech, building,
  battle armor), and the component pickers (armor, engine, gyro, cockpit, heat sink, structure, jump jet, myomer,
  'Mech type), hide what the selected edition and level do not offer. Ruling 4 says "equipment and options", so
  components are covered.

## Non-goals

- No new stats. This work moves records and adds standing data; `editionStats` values are untouched.
- No quirks (step 3), no ArtVee work (step 4).
- No change to Custom Homebrew (6) or Munchkin (7) content beyond where it is stored. It never has editions.
- No change to MegaMek or SSW export rules: they stay canon-only.

## Anti-goals (a failure even if it works)

- Any level, edition or source written from memory, from MegaMek, or from OCR text alone. The project rule stands:
  editions and levels are entered from the books' page images.
- Breaking a save. A saved unit's equipment tags must still resolve after the move (`altTags` is kept).
- A design that loses installed equipment because it is now hidden from the picker.

## Design

### 1. Files

- New official files, one per category: `equipment-energy.ts`, `equipment-ballistic.ts`, `equipment-missile.ts`,
  `equipment-artillery.ts`, `equipment-misc.ts`, `ammo.ts`. Each exports one array.
- Custom and Munchkin records stay apart, in `<category>-custom.ts` and `<category>-munchkin.ts`, following the
  `artillery-custom.ts`, `ammo-custom.ts` and `misc-custom.ts` already there. The remaining `mech-custom-*` files move
  into them the same way.
- Each record says its own tech base (`techBase`: `"is"`, `"clan"` or `"universal"`, which `IEquipmentItem` already
  has). The registry's `IEquipmentCatalogDefinition.techBase` goes. Code that reads the catalog's tech base reads the
  record's instead: `getEquipmentListByTech`, and `battlemech.ts` around lines 5756 and 11733.
- Checked 2026-10-21: no tag is in more than one of the IS, Clan and universal files of a category, so merging
  creates no collisions. A test keeps tags unique across all catalogs.
- Catalog ids are not stored in saves or exports. Only the equipment editor (`equipment-editor.tsx`) lists catalogs
  by id, and it gets the new ids. Old ids are not kept as aliases.
- One category moves per commit. The legacy file is deleted in the same commit, every tag and `altTags` value is kept,
  and the full suite stays green. A test checks that every tag the old catalogs held still resolves.

### 2. `editions`

```ts
/** Every rules edition (tags from rules-editions.ts) whose rules include this record as canon. Empty: never canon. */
editions: string[];
```

- It goes on `IEditionHistory` and on `IEquipmentItem`, so equipment and component records share it.
- It is required on every official record. A test fails on a record without it, and on an unknown tag.
- **Migration keeps today's behaviour.** The migration is checked by a test that runs the old and new filters over every
  record, edition and level and expects the same answers, apart from the hiding ruling 3 adds. A script writes each record's first `editions` list from what the code works
  out now: the `editionStats` keys for the earlier editions, plus `total-warfare` and every later edition from the
  record's `introducedInEdition` on. Corrections, such as an item a later edition dropped, come afterwards in their
  own reviewed commits, each citing its page.
- **Never-canon records** get `editions: []`. These are official records whose `rulesLevel` is 5 or more (today only
  the licensed Light Blazer, `light-blazer`, now in `equipment-energy.ts`) and component records that are only in
  `apocryphalIn`. Custom and Munchkin records have no `editions`. (Corrected 2026-10-21: the four-legged layout in
  `mech-type-options.ts`, once given here as never canon, is canon from the BattleTech Compendium on, per its
  `editionStats`, and apocryphal only in Battledroids, through the GOL-1H kit sheet.)
- **Consistency test.** Every `editionStats` key is in `editions`. Every earlier edition in `editions` has an
  `editionStats` key, because an earlier edition's stats come from that table. `introducedInEdition` stays as a
  checked field, so the migration only adds data. A test makes it equal to the first entry of `editions` in edition
  order, and absent or `total-warfare` when that entry is Total Warfare.
- `isInRulesEdition` reads `editions` and no longer derives editions from the edition list's order.

### 3. Rules level per edition

```ts
/** The record's rules level (0-4) in each edition of `editions`, as that edition's books grade it. */
editionLevels?: { [editionTag: string]: number };
```

- An edition missing from `editionLevels` uses the record's `rulesLevel` (0 when absent), as today. The migration
  writes no `editionLevels`. Each edition's levels are added only when that edition's table is settled. Until then,
  earlier editions keep today's behaviour.
- `getEquipmentRulesLevel`'s floors stay on top of the edition level: Experimental for a prototype-only record
  (`introduced: null` with a `prototype` year), and Custom Homebrew or Munchkin for custom content.
- The levels are the tool's ids 0-4. An edition with its own level names (Battledroids, BattleTech Manual, Master
  Rules) maps them through the `levels` table it already has in `rules-editions.ts`.
- **Sources.** Total Warfare onward: the tech progression tables in Interstellar Operations: Alternate Eras. Earlier
  editions: their own rulebooks' level rules (for example the Master Rules' Level 1 and Level 2). MegaMek is a
  cross-check only, never a source, and none of its code is copied.
- **How it is entered.** The local model extracts candidate levels from the OCR text to a review file. A script
  compares them with MegaMek's levels and lists every disagreement and every record that has no candidate. Claude
  settles each one against the page image, and only the settled values go into the catalog, with the book and page
  in a comment beside the first record of each table.

### 4. What a builder offers

A record is **offered** under edition E at the selected level L when one of these holds:

1. **Canon:** E is in `editions` and the record's level in E (`editionLevels[E]`, else `rulesLevel`, else 0) is at
   most L.
2. **Apocryphal:** L is 5 or more, and either E is in the record's `apocryphalIn`, or E comes after the last edition
   in `editions` (ruling 4: dropped records become apocryphal; BattleTechnology's FASA-era records fall under this
   from the first FanPro-era edition, ruling 5).
3. **Custom/Munchkin:** the record is custom content and L is at least its level (6, or 7 for Munchkin), in any
   edition.

Anything else is **hidden** from that builder's pickers and lists (ruling 3). This replaces
`isEquipmentWithinRulesLevel`, which today hides only non-canon records.

- **Cases the rules settle** (my calls):
  - A never-canon record (`editions: []`) is offered at level 5 and up in the editions its `apocryphalIn` lists. With
    no `apocryphalIn`, it is offered from Total Warfare on, as today.
  - A record first canon in an edition *later* than E is hidden under E at every level. It did not exist yet, so it
    is not apocryphal there.
- **The year filter stays.** The era and introduction-year checks (`introduced`, `getEffectiveIntroduction`) still
  apply on top of this rule, unchanged.
- **Installed equipment is never removed** (my call: hiding is for the pickers, and taking parts off a saved design
  would lose the user's work). A design that already carries a hidden record keeps it: a save, an import, a printed
  unit, or a design whose edition or level the user lowered. The record still counts in tonnage, slots, BV and
  validation. It can still be removed, but not added again. The existing "above the selected level" warnings stay
  for these designs. The warning names the reason: not in the edition, or above the level.
- **The level a record shows** is its level under the selected edition: its canon level, or 5 when it is offered by
  rule 2.
- The catalog pages and the equipment editor show the `editions` list on each record, with the level in each.

### 5. Sources for the editions list

- **Rulebooks:** the edition's own rulebook is the authority for what that edition includes. The current
  `editionStats` entries were entered this way.
- **BattleTechnology and other FASA-era licensed material:** the editions current at the issue's publication date
  (the edition years in `rules-editions.ts`), in `editions` as canon. The issue and page go in the record's citation.
- **The FanPro boundary** is the first edition published under FanPro. It is the plan's first task. The tag is read
  from the books' credits pages and written down as a constant in `rules-editions.ts` with its citation. Step 3
  (quirks), the first BattleTechnology entry, depends on it.

## Constraints

- Vite + React 18 class components + TypeScript, Vitest; 4-space indentation; `npm test`, `npm run typecheck` and
  `npm run lint` clean after every commit.
- Work on `beta`. Commit only when the user asks for this step to be committed; never push to `upstream`.
- The local model (`astech-qwen3`, through `astech_ic.py`) writes the code and the moves. Claude writes the briefs,
  reviews every diff, and settles every level against the page.

## Left to the builder

- Function names for the new filter, and whether it lives in `rules-editions.ts` or `equipment-registry.ts`.
- The order the categories move in, and whether the migration script is kept in `tools/` or thrown away.
- How the catalog pages lay out the editions list.
