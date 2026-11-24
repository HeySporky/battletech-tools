# Catalog consolidation and complete canon coverage

Date: 2026-10-24. Status: design, awaiting the user's approval.
Builds on `2026-10-21-catalogs-editions-design.md` (one file per category, `editions`, `apocryphalIn`, what a builder
offers). That design's rules still hold; this one extends them to every catalog and fills the coverage gaps.

## Why

The user wants the catalogs to be the complete, correct list of everything that can be given to a unit or to a member
of a unit, for every unit type, with each record saying its tech base, the editions it is canon in, and where it went
apocryphal, without a second copy of the record anywhere. Today:

- Weapons, ammunition and misc equipment (`equipment-*.ts`, `ammo.ts`) already share one record shape with `techBase`,
  `editions`, `editionStats` and `apocryphalIn`. Some IS/Clan pairs are the same item entered twice (the tube-artillery
  and Arrow IV munitions in `ammo.ts`), and twins have drifted apart in BV before (#34).
- The 'Mech component catalogs (armor, engine, gyro, cockpit, myomer, internal structure, heat sink, jump jet) have
  `editions` but mostly no `techBase`.
- The infantry, battle armor, aerospace armor and vehicle catalogs have `techBase` but no `editions`. Support vehicle
  armor, vehicle motive types and support vehicle light weapons have neither.
- Actuators have no catalog (they exist only as rules logic). Personal gear (A Time of War) has no catalog at all.
- Coverage has gaps nobody has listed. The Armored Motive System (TO:AUE pp.94-95, errata v7.0) had to be added by
  hand recently.

## User rulings (2026-10-24)

1. **Different items stay separate records.** When the IS and Clan versions differ in any stat (the ER Large Lasers;
   the machine guns, which differ at least in weight), they stay two records. No per-tech-base arrays inside a record.
2. **Only true twins merge.** A pair merges into one record only when every stat is the same apart from tech base.
3. **Canon early, dropped later, one record.** A record canon in older editions and dropped later lists the older
   editions in `editions` and is apocryphal in the later ones (by `apocryphalIn`, or by coming after its last
   edition, rule 2 of the 2026-10-21 design). It is never copied into an apocryphal catalog.
4. **Everything, for every unit type.** Engines and types, armor and types, structure and types, gyros and types,
   cockpits and types, myomer and types, actuators and types, and all equipment for all units, including all
   infantry equipment and personal gear: anything that can be given to a unit or a member of one.
5. **Inventory, then authority.** MegaMek's source (`C:\repo\megamek`) is the inventory of what exists. Every stat and
   citation is confirmed from the library books.
6. **All books.** Check every rulebook, and the sourcebooks, so nothing is missed, and to fill each record's
   `editions`.
7. **Editions by publication date.** A book belongs to the edition current when it was published: a book published
   between two editions belongs to the older one. Use the month as well as the year where the book prints it (the
   credits page's printing line); otherwise the year.
8. **Separate IS and Clan dates, not two records.** When a pair differs only in its dates, it is one record with
   per-tech-base dates. The existing `clanDates` pattern (below) is reviewed and extended for this.
9. **The pre-Total Warfare expansions count as editions** for their unit types: CityTech, AeroTech, BattleTroops,
   ClanTroops, CityTech 2, AeroTech 2, AeroTech 2 Revised. Without them the vehicle, aerospace and infantry canon of
   1986-2005 would be lost. A sourcebook item for those unit types goes in the expansion current at its publication.
10. **Personal gear is in scope where it can logically be given to a unit** (weapons, for example), with conversions
    where needed. Its standing: see §5.
11. **BV1 and BV2 by edition** (2026-10-24). The tool computes BV2. An edition that uses BV1 shows BV1: the items'
    BV1 values and the BV1 unit formula, so a game under that edition shows the total its own rulebook gives, not a
    BV2 number that differs for no visible reason. See §7.

## Goals

- Every catalog record of every kind carries the same standing core: `tag`, `name`, `techBase`, `editions`,
  `editionStats` (where earlier editions printed different stats), `apocryphalIn`, rules level, book and page.
- True IS/Clan twins are merged; nothing else is.
- Every canon item in any rulebook or sourcebook is present, with `editions` filled from the books.
- Actuators and personal gear have catalogs.
- Custom Homebrew and Munchkin content sits in `<category>-custom.ts` and `<category>-munchkin.ts` per category.
- All tests pass and no unit's BV moves, except where a book check proves the old value wrong (that is a bug fix with
  its own RED test and page cite).

## Non-goals

- No new construction or play rules. A new record that needs rules the app doesn't have yet is entered as data and
  hidden from pickers until its rules exist; the gap goes on an origin issue.
- No change to MegaMek or SSW export beyond resolving merged tags.
- No map, no RPG character system. Personal gear is catalog data, given to infantry and crews only where the app
  already models them.

## Anti-goals (a failure even if it works)

- A stat, edition or page written from MegaMek or memory. MegaMek says an item exists; the book says what it is.
- A saved unit or exported file that no longer loads. Every retired tag stays as an `altTags` alias.
- Merging two records that differ in any stat (rulings 1-2).
- Merging the primitive prototype ammunition into the standard records. Their BVs are deliberately IO:AE p.189's (AC/2
  4, AC/5 7, AC/10 12, AC/20 17, Long Tom 35, LRM 4/8/13/16, SRM 1/3/4).
- A BV change that no book page explains.

## Design

### 1. One standing core for every catalog

A shared interface (`ICatalogStanding`, built from `IEditionHistory`) that every catalog record type extends:
`IEquipmentItem`, the 'Mech component types, `IInfantryWeapon`, infantry armor, battle armor equipment and armor,
aerospace armor, support vehicle armor, motive types, chassis modifications, and the new actuator and personal gear
records. Fields: `tag`, `name`, `techBase` (`"is" | "clan" | "universal"`), `editions`, `editionStats`,
`apocryphalIn`, `rulesLevel` / `editionLevels`, `book`, `page`, `altTags`.

- Tags are unique within each tech base (my call, round 1): an IS and a Clan twin may share an old tag, because
  lookups search the unit's own tech base first. Different catalogs may share a tag (`standard` armor and engine), so
  the check is per catalog plus across all equipment catalogs together.
- One catalog-wide test lists every catalog through a single registry and checks: unique tags as above,
  every retired tag still resolves, `editions` present and made of known edition tags, `editionStats` keys in
  `editions`, `techBase` present.
- The "what a builder offers" filter of the 2026-10-21 design reads this core, so it works the same for a laser, an
  engine, a vest or an actuator.

### 2. Merging true twins

- **Dates per tech base.** The component catalogs already carry the Inner Sphere (or universal) dates on the record
  and an optional `clanDates: ITechDates` that overrides them for Clan units (`mech-engine-types.ts`,
  `mech-armor-types.ts`, `mech-cockpit-types.ts`, `mech-internal-structure-types.ts`, `mech-heat-sink-types.ts`,
  `mech-jump-jet-types.ts`, `battle-armor-armor-types.ts`, `sub-capital-weapons.ts`; read by `_techDatesAvailability`
  in `battlemech.ts` and `aerospace-fighter.ts`, and in `battle-armor.ts`). Round 1 reviews that pattern and puts
  `clanDates` on the standing core, so `IEquipmentItem` and every catalog have it, with one shared date filter instead
  of the per-class copies. If tech rating or availability ratings also differ by tech base, they go in the same block.
- **What counts as a twin.** A pair merges when every stat matches apart from the tech base, dates and per-tech-base
  ratings. Weight, slots, damage, range, heat, BV, cost and ammunition per ton must all match.
- A script compares every IS/Clan pair (same name with the tech-base prefix stripped, or the same MegaMek item) field
  by field and writes the matching pairs to a review list. Claude checks each against the book before merging.
- A merged record gets `techBase: "universal"` (an existing value, so mixed-tech handling doesn't change), the IS
  dates on the record and the Clan dates in `clanDates` where they differ, the earlier tag as its tag, and the other
  tag in `altTags`. SSW and MegaMek export pick the IS or Clan name from the unit's tech base.
- Pairs that differ in a real stat (the machine guns' weight, the ER lasers, the primitive ammunition) are listed in
  the review file as kept apart, with the stat that differs, so the next pass doesn't reopen them.

### 3. Editions by publication date

- Each book in the library gets an edition by its publication date, to the month where the credits page prints one:
  the latest edition (or expansion, ruling 9) covering the item's unit type whose date is no later than the book's
  (ruling 7). Example: TO:AUE (2021) falls after BattleMech Manual (2017) and before the Core Rulebook (2026).
- The expansions in `btRulesExpansions` become valid `editions` tags for their unit types, and the catalog-wide test
  and the builder filter accept them. Editions and expansions get a publication month where the book prints one.
- The edition must cover the record's unit type (`unitTypes` in `rules-editions.ts`). BattleMech Manual and the Core
  Rulebook cover 'Mechs only, so for a vehicle item from a 2021 book the current edition is Total Warfare.
- `editions` stays one list per record. A builder offers a record only under an edition that covers the builder's own
  unit type, so a medium laser canon in the 1987 BattleTech Manual is not offered to a vehicle under it. (My call.)
- A record stays canon in each later edition covering its unit type until a book or errata drops it. From then on it
  is apocryphal (ruling 3, and "errata-removed rules go Apocryphal").
- The mapping (book → edition) is written once to a reviewed table in the library repo's text folder (never
  committed there), and the catalog scripts read it.

### 4. Coverage audit

1. **Inventory:** extract MegaMek's equipment, armor, engine, structure, gyro, cockpit, myomer, actuator, infantry
   weapon and armor kit lists (names and internal names only, no code copied) into a checklist.
2. **Books:** sweep every rulebook and sourcebook extract, including Technical Readouts and BattleTechnology (canon
   for the editions current at publication, apocryphal from FanPro on); record sheets are a cross-check only (my
   call). Sweep in `C:\repo\JBTIICRework\text` (`.txt`, `.raw.txt`,
   `.ocr.txt`) for equipment tables and new-item rules. This adds to the checklist what MegaMek lacks (as with the
   Armored Motive System) and gives each item its first book and the books that reprint or drop it.
3. **Match:** every checklist item maps to a catalog record or is marked missing. Missing items are entered from the
   page image, family by family.
4. Garbled pages found on the way are corrected and logged in `_corrected_pages.md`.

### 5. New catalogs

- **Actuators:** shoulder, upper arm, lower arm, hand, hip, upper leg, lower leg, foot, and the variants the books
  define (industrial, primitive, Battledroids-era, quad legs, the TO:AUE actuator enhancement and similar), with
  weight, slots, cost and standing. The construction code reads them instead of its hard-coded values; this must not
  move BV.
- **Personal gear:** the RPGs' gear that can logically be given to a unit or a member of one (weapons, armor,
  equipment), from MechWarrior 1st-3rd Editions, A Time of War and their companions, in the standing core with the
  stats those books give. They are linked to the infantry weapon and armor records where the TechManual tables already
  cover the same item, and not merged, since the two games give different stats.
- **An RPG edition track.** The RPG editions (MechWarrior 1st, 2nd, 3rd, A Time of War) are added to
  `rules-editions.ts` as their own track; RPG books map onto it by publication date, as ruling 7 does for the
  tabletop.
- **Standing of RPG items on the tabletop** (my recommendation, for the user to confirm): canon in the RPG track
  (same universe, same publisher). On the tabletop, canon where a tabletop book prints it (as the TechManual infantry
  tables do for many A Time of War weapons). An item we convert to tabletop stats ourselves is apocryphal on the
  tabletop, because the numbers are ours, not the publisher's; the record names the conversion used.

### 6. Custom and Munchkin

- `<category>-custom.ts` and `<category>-munchkin.ts` for each category. The seven `mech-custom-*-types.ts` files
  fold into them. Munchkin files are created only where Munchkin content exists or the user adds some.

### 7. BV1 for the editions that use it

- Each edition says which Battle Value system it uses (`battleValueVersion: 1 | 2` on `IRulesEdition`, absent where
  `noBattleValue`). From the code today: the Master Rules (1998), Master Rules Revised (2001) and the Classic
  BattleTech box set (2002) have Battle Value and predate the TechManual's BV2 (2007, under Total Warfare by ruling 7),
  so they are BV1; Total Warfare on is BV2. Each edition's version is confirmed from its rulebook's page before it is
  set.
- Item values: `battleValue` (with `battleValueDefensive` where the BV1 tables split it) goes on `IEditionStats`, so
  an item's BV1 lives in its `editionStats` entry for the BV1 editions, entered from those editions' tables.
- Unit formula: the BV1 calculation from the Master Rules (and the BV1 rules for the other unit types where those
  editions or their expansions print them), as its own module beside the BV2 code, chosen by the selected edition's
  `battleValueVersion`. BV2 code is untouched.
- Sheets, lists, Alpha Strike conversion and exports label which BV they show. Under a BV1 edition the sheet shows the
  BV1 total; MegaMek/SSW export keeps BV2 (their format's).
- Sources: the BV1 editions' own pages (Master Rules BV section and tables, `render_page.py`), MegaMek as a
  cross-check only.

## Order of work (one round per item, each committed, pushed and deployed)

1. Standing core, `clanDates` review and shared date filter, expansions as edition tags, and the catalog-wide test
   (no data changes, no BV moves).
2. Twin merge, weapons and ammunition.
3. 'Mech components onto the core (add `techBase`; check `editions`).
4. Vehicle, support vehicle, aerospace, ProtoMech catalogs onto the core.
5. Battle armor and conventional infantry catalogs onto the core.
6. Book → edition table; coverage checklist from MegaMek plus the book sweep.
7. Fill gaps, one family per round (weapons, ammo, misc, each component family, vehicle, aero, BA, infantry).
8. Actuator catalog.
9. Personal gear catalog.
10. Custom / Munchkin file layout.
11. BV1 (§7): edition versions, item BV1 values, the BV1 unit formula, labels. It needs only round 1, so it may run
    after round 2 if the user prefers.

## Constraints

- Vite + React 18 class components + TypeScript, Vitest; 4-space indentation. After each round:
  `npx vitest run --project unit`, `npx tsc --noEmit -p .`, `npx eslint <changed files>`.
- BV survey before and after each data round (every canon unit's BV, diffed); any move needs a page-cited reason.
- Work on `beta`; commit, `git push origin beta`, `git deploy-beta`, ff master. Never push upstream. Never commit in
  `C:\repo\JBTIICRework`.
- The local model is paused, so Claude (or a Sonnet subagent) writes the code; Claude reviews every diff and settles
  every value against the page image (`render_page.py`).

## Left to the builder

- Interface and registry names, and where the catalog-wide test lives.
- Script names and whether they're kept in `tools/`.
- The order of families inside round 7.
