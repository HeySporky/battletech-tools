# Product Roadmap

Open work for growing Jeff's BattleTech Tools from a BattleMech and vehicle creator into a full BattleTech
construction, import/export and record-management tool. Sections are in priority order: fix what ships
first, then make imports reliable, then check the data against the books, then add unit domains.
Finished items are moved to `TODO-Completed.md`, which also lists the commit history.

Local references (git-ignored, never imported by shipped code):

- `_KNOWLEDGE_DEV/rulebooks/`: the reference library, about 870 files sorted into folders on 2026-10-06:
  `rulebooks/` (current Catalyst line, BMM, Core Rulebook, box sets), `rulebooks-legacy/` (Battledroids, BattleTech
  2nd/3rd Edition, Compendium, Master Rules, Maximum Tech, CityTech, AeroTech, BattleSpace and the FanPro printings),
  `alpha-strike/`, `errata/` and `errata-2025/`, `rpg/`, `technical-readouts/` (TROs, XTROs, Recognition Guides),
  `record-sheets/`, `sourcebooks/`, `maps-and-art/`, `apocryphal/` (BattleTechnology and licensed game material),
  `magazines/mechforce/`, `fan-made/`, `languages/de/` and `languages/es/`, `fiction/`, `Custom/`. Text extracts are
  flat in `text/`. `INDEX.md` there has the editions, page offsets (printed page = PDF page - offset), errata
  applicability and a generated catalog of every file; `_reorg-2026-10-06.json` records each rename and the 97
  duplicates removed.
- `WorkingData_DEV/SSWdata/`: Solaris Skunk Werks designs (3,358 `.ssw`, shallow clone of
  Solaris-Skunk-Werks/SSW-Master).
- `WorkingData_DEV/mmlData/mekfiles/`: MegaMek unit files (4,312 `.mtf`, 6,723 `.blk`) for every unit type,
  including `advancedbuildings` and `ge`. Licensed CC BY-NC-SA 4.0.
- `WorkingData_DEV/HMPdata/`: HeavyMetal Pro/Vee files (2,963 `.hmp`, 515 `.hmv`).
- `WorkingData_DEV/TDBdata/`: The Drawing Board files (630 binary `.dbm`).
- `WorkingData_DEV/format-references/megamek/`: MegaMek loaders used as format references: `HmpFile`,
  `HmvFile`, `TdbFile` (from tag v0.49.19, since removed from MegaMek), and current `MtfFile`, `BLKFile`,
  `BLKMekFile`. GPL: read them for the file layout; don't copy code.

## 1. Fix what ships

- [skipping ] Ask GitHub Support to drop the cached views of the old commits and the fork PR #8 ref (a "Remove
  sensitive data" request listing the old commit IDs).
- [ ] BV differs from SSW's BV2 figure: after the import fixes, 350 of 2,610 non-bundled designs match
  exactly and 805 within 2%. Work through the differences by cause (unplaced criticals and unknown
  equipment first, since they skew BV).
- [ ] MUL 2.0 records have no BFThreshold, Rules or ImageUrl: aerospace cards lack their armor threshold and
  MUL 2.0 units have no rules level. Extend `tools/mul-sync/sync-mul.mjs` to collect them.
- [ ] Custom MUL entries (`mul2+mul1+custom` source, Custom MUL Editor) exist only in this fork. Decide
  whether to offer them upstream as their own PR.

## 2. Import and export adapters

Imports convert into the canonical JSON model; exports convert back out. Every adapter needs round-trip
tests (source file -> canonical -> exported file -> canonical, with no loss), and the canonical model must
keep whatever a format needs to be written back faithfully: critical-slot order and indexes, manufacturer
and fluff text, quirks, source/book fields, and per-format IDs (MUL id, SSW solaris7id, MegaMek UUID).

### Shared

- [ ] Make the canonical JSON format versioned, documented, and stable enough to be the app's long-term
  interchange format. Decide as group whether we should use a dedicated extension or stick with json.
- [ ] Keep provenance on imported records: source file, source format, source book, and conversion warnings.
- [ ] Import review screen: parsed fields, unmapped fields, warnings, provenance, and the final canonical
  record before saving.
- [ ] Add MegaMek's names to the records' `altNames`: its equipment classes list each item's internal name
  and lookup names (the names MTF, BLK, HMP and older SSW files use). Review them as data; `name_changes.txt`
  in the MegaMek data maps renamed units.
- [ ] Bulk import audits as dev tools (not tests, since the fixtures stay in `_DEV`): run every sample file
  of a format through its importer and report crashes, unknown equipment, unplaced criticals, and BV/cost
  against the value stored in the file.

### Solaris Skunk Werks (`.ssw`)

The SSW audit (every design in `WorkingData_DEV/SSWdata` through `importSSWXML`) found the importer handled
only the bundled 3039/3050 Inner Sphere set. Fixed: Clan items (the `(CL)` prefix), Clan designs' unprefixed
items, Mixed Tech designs, the `(T)` turret prefix, and every SSW spelling added to the records' `altNames`.

Audit on 2026-09-30, all 3,864 files (bundled and `WorkingData_DEV`): 3,727 designs resolve every item (1,290
before the `altNames` rework). 43 names remain, all listed below. Of the bundled designs, only Electronic
Warfare Equipment, Collapsible Command Module and Communications Equipment are left; a test pins that list.

Audit on 2026-09-29, the 2,846 designs outside the bundled set: 1,780 of the 2,610 BattleMechs import with no
errors (433 before these fixes), 828 still drop some equipment (155 distinct names), 358 leave criticals
unplaced, 2 change on a JSON save/load, and 350 match SSW's BV exactly (805 within 2%). Of the 512 bundled
designs, 44 still report errors (421 before).

- [ ] Unplaced criticals: jump jets (822 across the designs), heat sinks (251), ferro-fibrous (128),
  ER lasers, ECM, C3i. Compare the SSW placements with our allocation (the earlier list of 12 bundled
  designs: ANH-3A, AWS-10KM, CTF-5D, CGR-KMZ, CLNT-6S, FS9-B, JR7-C2, CRK-5003-CJ, PNT-14S, WTH-3, WTH-K,
  "Grinner" Wolfhound IIC).
- [ ] Chassis component names with no record yet (they report an import error): Primitive Structure,
  Primitive Industrial Structure, Primitive I.C.E./Fuel-Cell engines, Industrial Armor, Ablation Armor,
  Prototype Improved Jump Jet, Primitive Prototype Jump Jet, No Gyro, and every cockpit but Standard and Small.
- [ ] Canon equipment with no catalog record yet (needs TO:AUE/TM stats before adding): B-Pod, M-Pod,
  Coolant Pod, Chaff Pod, BattleMech Taser and ammo, TSEMP / TSEMP One-Shot, HarJel II/III, ProtoMech AC/2,
  AC/4, AC/8 weapons (their ammo exists), Collapsible Command Module, Communications Equipment, Electronic
  Warfare Equipment, Drone Operating System, Vehicular Grenade Launcher, Cargo (Standard/Liquid), C3 Remote
  Sensor Launcher and ammo.
- [ ] Adapter cases: `X (Insulated)` is a laser plus the Laser Insulator (TO:AUE); "Extra Double Heat Sink
  (Freezers)" placed as equipment; Clan `ER PPC + PPC Capacitor` exists only as a custom record.
- [ ] SSW data quirks, one design each: an Inner Sphere design with an unprefixed `Streak SRM-6 CP` (Highlander
  HGN-732 Colleen); `(IS) Enhanced ER PPC` outside Mixed designs (IO p. 95: Clan tech).
- [ ] Import clarification step (approved design 2026-09-30): before an SSW import is accepted, ask the importer
  about each new unknown item (tech base IS/Clan, tons, slots; optional damage/heat/ranges and a source note),
  each with "I don't know". Best guesses: design's tech base, the slot estimate, the tonnage gap split across
  unknown-weight items, all marked estimated. Accept stays disabled until every required answer is given.
  Split the session into analyze and accept-with-answers.
- [ ] IndustrialMechs and Primitive BattleMechs/IndustrialMechs are skipped entirely (234 designs):
  `importSSWXML` only accepts `mech_type` "BattleMech".
- [ ] Two OmniMech files fail to parse (`Summoner (Thor)`, `Puma (Adder)` with `model=""`:
  "readTagExp returned undefined").
- [ ] OmniMech configurations: SSW stores every loadout in one file; import them as our OmniMech
  configurations instead of only the base loadout.
- [ ] Drafts have no editor page yet (phase A2), so their stats can't be entered in the UI. Until then a
  draft's placeholder has unknown (0 at runtime) weight, damage, heat and BV.
- [ ] Custom chassis components (seven `mech-custom-*-types.ts` catalogs) resolve on import but don't appear in
  the construction steps' selection lists yet.
- [ ] Custom cockpit catalog: unknown cockpits are reported (`kind: "cockpit"`) but never drafted.
- [ ] SSW import follow-ups from the 2026-09-30 branch review (lower confidence, not fixed yet):
  slot estimates ignore `splitLocations`; "incomplete custom stats" is flagged only on the review screen, not
  in the Mech Creator or the saved record; two files with the same name overwrite each other's evidence XML but
  keep the first hash; every draft stores whole source files, so big batches can hit the storage quota; ammo
  drafts don't feed their weapon draft (`getAllAmmo` excludes local drafts); `crypto.subtle`/`randomUUID` need
  a secure origin (LAN dev over http).
- [ ] Custom content PR submission (phase A2 of the same plan, deferred 2026-09-30): catalog merge serializer,
  multi-file GitHub PR with a never-merged evidence branch, submission orchestrator, drafts editor page
  (plan Tasks 9, 10, 11, 13). Until then, copy a local draft's record into the custom catalog by hand.
- [ ] SSW export: write `.ssw` XML (SSW save file version 3) from a BattleMech.

### MegaMek / MegaMekLab (`.mtf`, `.blk`)

- [ ] MTF parser (BattleMechs, IndustrialMechs, LAMs, QuadVees, Tripods) into the canonical model, using the
  equipment-name bridge. Reference: MegaMek `MtfFile`. 4,312 samples.
- [ ] BLK parser shared by every other domain (the block reader `blk-file.ts` and the battle armor mapping landed
  2026-10-08), one mapping per unit type as each domain lands: vehicles and
  support vehicles, battle armor, infantry, ProtoMechs, fighters, small craft, DropShips, JumpShips,
  WarShips, space stations, gun emplacements and buildings. Reference: MegaMek `BLKFile` and the
  `BLK*File` loaders. 6,723 samples.
- [ ] MTF and BLK export.
- [ ] Licensing: the MegaMek data is CC BY-NC-SA 4.0. Importing a user's own files is fine; bundling any
  MegaMek unit data in the app needs a decision first (as the SSW data carries its own notice today).

### HeavyMetal Pro / HeavyMetal Vee (`.hmp`, `.hmv`)

- [ ] HMP reader (binary, `V5.00` header): port the field layout documented by MegaMek's `HmpFile` (a Java
  port of Hmpread) into a TypeScript reader. 2,963 samples; `Mech.lst` files list the designs per folder.
  The `hmp_dumper.py` in `HMPdata/hmpFiles/ClanCustoms` is only a raw byte scanner.
- [ ] HMV reader for vehicles (`HmvFile`). 515 samples.
- [ ] HMP/HMV export: write the binary format once the reader round-trips every sample byte for byte.

### The Drawing Board (`.dbm`)

- [ ] The 630 samples are TDB's binary `.dbm` format ("Drawing Board Mech" header, fixed-width records).
  MegaMek's `TdbFile` reads only TDB's XML export, so the binary layout has to be worked out from the
  samples; `TdbFile` still documents the field meanings. Support the XML export as well.
- [ ] TDB export, once the reader is verified.

### Other tools

- [ ] The Mech Factory and The Vehicle Factory: find sample files and any format documentation before
  committing time.

## 3. Check the data against the sourcebooks

- [ ] Sourcebook validation tool (`tools/`, dev only): check every catalog table entry against the rulebook
  text in `_KNOWLEDGE_DEV/rulebooks` and report mismatches with book and page. Cover weapons, ammunition,
  equipment, engines, gyros, cockpits, structure, armor, heat sinks, jump jets and myomer: weight, slots,
  damage, heat, ranges, BV, cost, tech rating and dates. Records whose book isn't local are listed as
  unchecked, not passed.
- [ ] Books still missing from the library: BattleMech Manual, A Time of War, Interstellar Operations: Alpha
  Strike Edition. The Aces rulebook and Aces: Scouring Sands are scans that need OCR before the tool can
  read them.
- [ ] Re-check the "(original single-volume TO)" page references in this file (building construction TO
  pp. 128-131, mobile structures TO p. 259, and the Sarna leads) against TO:AR and TO:AUE, now that both
  are local.
- [ ] Items waiting on a source (fold into the tool's report as it lands):
  - Improved SRM 4 BV: MegaMek lists 39 (same as the SRM 4) while the iSRM 2/6 run a third above their SRMs.
  - Whether the Improved PPC and Improved AC/20 explode when critically hit (MegaMek flags them).
  - IS SRM/Streak SRM/SRT I-OS dates: MegaMek gives production 3056, while LRM/MRM/Narc I-OS are prototype
    3056, production 3081.
  - Arrow IV range: `maxMapSheets: 8`; check 8 or 9 against TO.
  - LAM, QuadVee and Tripod values cited "via MegaMek" (conversion weights, IO p.113/134; chassis rules
    levels, IO p.50; cost multipliers; Superheavy costs; the Tripod prohibited-equipment list).
  - Naval vehicles over 300 t use MegaMek's suspension formula, unverified.
  - Artillery Thunder/FASCAM ammo BV against the rack-size formulas; IndustrialMech armor (Industrial,
    Heavy Industrial, Commercial); primitive fusion engine dates.
- [ ] Apocryphal hunt: `enhanced_er_ppc`, `enhanced_er_large_laser` and `enhanced_clan_lrm_10` don't match
  IO's Clan Enhanced PPC / Improved Large Laser / Improved LRM statistics; Clan LRM Mag-Pulse ammo has no
  Clan IO window. Decide the canon mapping or move them to custom.
- [ ] Records with no IO munition data, kept as-is: LRM Incendiary, SRM Tear Gas, SRT Harpoon, Vehicle/Heavy
  Flamer Inferno and Water. Historical tags ammo-long-tom-ap, ammo-sniper-ap and ammo-thumper-ap have no
  canon round.
- [ ] Inventory all equipment lists against the current rulebooks and identify missing, duplicate, renamed
  and obsolete entries. Equipment shared by 'Mechs, vehicles, aerospace, DropShips, WarShips and infantry
  is represented once, with domain legality metadata.

## 4. Unit domain architecture (before the new domains)

- [ ] Define a versioned canonical record schema shared by all unit domains: schema version, source
  metadata, unit domain and ruleset. Importers and exporters stay adapters around it; the UI and saved
  files never depend directly on SSW, MTF, BLK, HMP or other vendor formats.
- [ ] Split shared concepts (identity, era, faction, tech base, movement, armor, structure, equipment,
  crew, rules level, source attribution, notes) from domain-specific ones (BattleMech, vehicle, aerospace,
  capital, infantry, battle armor, ProtoMech, building).
- [ ] Unit-domain registry and capability matrix, so routes, equipment legality, record sheets and
  importers select behavior by domain instead of checking BattleMech-specific fields.
- [ ] Extract BattleMech construction logic behind the first domain interface without changing BattleMech
  behavior; keep existing BattleMech JSON exports loading.

## 5. New unit domains

Each domain gets: construction model and rules, an editor, a record sheet, BV and cost, Alpha Strike
conversion, roster/play support, MTF/BLK import from the MegaMek samples, and browser tests. Order: most
played first, then by dependency.

### Battle Armor

- [x] Suit construction (2026-10-08): Battle Armor Creator under TechManual pp.160-173 (`battle-armor.ts`,
  `battle-armor-construction.ts`, `battle-armor-equipment.ts`). Technology base, weight class (PA(L) to Assault),
  humanoid or quad, Clan exoskeletons on an Inner Sphere chassis weight; Ground MP, jump jets, VTOL and UMU
  systems, jump booster and partial wing; manipulators with modular equipment adaptors and cargo lifter capacity;
  armor by the point with its weapon slots; both Battle Armor Equipment Tables (TM pp.346-348) mounted by
  location against the slot and weapon limits; missile shots at a slot for every 4, one-shot and detachable
  launchers; standard modular mounts, anti-personnel mounts carrying Standard infantry weapons, a quad's standard
  or configurable turret, the squad support weapon; the Capabilities Table (Swarm, Leg, Mechanized). Reproduces
  the book's Tunnel Rat, Sylph, Purifier and Fenrir.
- [x] Squad setup, Battle Value, cost, record sheet (2026-10-08): 1-6 troopers with the Formations Table for
  reference; Battle Value (TM pp.310-311, 316: Purifier Level I 466, Grenadier squad 326); cost (TM pp.276,
  281, 296-298: Purifier structure 425,000); saves, backup, a record sheet with a row of armor circles for each
  trooper.
  Readings to confirm: (1) TM p.165 allows UMUs on a Clan exoskeleton with an Inner Sphere chassis weight and
  p.270 forbids them; the construction step is followed and the summary says so. (2) Armor slots are taken from
  whatever slots are free on the suit, not placed by location. (3) The Battle Value adds every direct-fire
  weapon again for a suit that can Swarm, as p.310 prints, though only arm-mounted weapons fire in a Swarm
  attack. (4) The bomb rack is counted with direct-fire weapons, as it is not in p.310's list of missile
  weapons. (5) Every missile launcher is priced by the tube (TM p.297), a one-shot launcher at half. (6) HarJel
  has no row in the battle armor price list and is left unpriced. (7) The book prices a suit; the squad is
  priced as suits x troopers, with the squad support weapon bought once. (8) An armored glove with a basic
  manipulator meets none of the Capabilities Table's lines, so that pair makes no Anti-'Mech attacks.
- [x] Tactical Operations equipment (2026-10-08): the battle armor items of TO:AUE pp.224-225 at their Advanced
  or Experimental level, with Battle Values from pp.192-197: heavy flamer, Angel ECM, mine dispenser,
  DropChutes, small and medium VSP lasers, ER pulse lasers, LB-X autocannon, taser, tube artillery, C3 and
  C3i, mechanical jump booster, myomer booster, detachable weapon packs.
- [x] Introduction dates and an era (2026-10-08): chassis, manipulators, motive systems, mounts and every
  item of equipment dated from the Universal Technology Advancement Table (IO:AE pp.45-47); the suit is built
  in an era, which filters what is offered and reports what the era did not have. A prototype date counts.
- [x] Alternate loadouts (2026-10-08): named loadouts refit standard modular weapon mounts, configurable turret
  mounts and modular equipment adaptors; each is checked like the base design and has its own weight, Battle
  Value, cost, record sheet and Alpha Strike card.
- [x] Roster groups and play mode (2026-10-08): saved suits join a Classic BattleTech roster group as squads in
  a chosen loadout; play mode tracks damage by trooper, resolves attacks on the squad (TW p.219, with the
  armor types' damage rules), gives Leg and Swarm attack numbers (TW pp.220-221), jettisons detachable packs,
  and seats a squad on one of the force's 'Mechs or vehicles as mechanized battle armor with hits on the
  carrier rolled for the troopers there (TW pp.226-227). Roster print marks the damage.
- [x] Alpha Strike conversion (2026-10-08): ASC pp.92-141, offered in the Alpha Strike roster's unit picker and
  as a printable card. Checked against the 951 Master Unit List battle armor cards the importer could build:
  Move 926, Armor 950, damage 837, special abilities 879, Point Value 788 the same.
- [x] MegaMek `.blk` import (2026-10-08): `blk-file.ts` reads the block layout for any unit type;
  `battle-armor-blk.ts` maps battle armor. Of the 1,188 sample files, 1,010 import with nothing left off and
  1,139 come out legal.
  Readings to confirm: (9) The Battle Value adds the weapon in an anti-personnel mount, as TM p.310 says; the
  Master Unit List's values leave it out, so every imported suit with a rifle in its mount is 1 to 2% over
  the published figure. Of the 729 compared suits without such a weapon, 603 match the published Battle Value
  exactly; the other 126 are a few points off and were not run down. (10) Alpha Strike: battle armor in
  reactive or reflective armor gets the special ability without ASC p.97's 0.75 armor multiplier, as all but
  one published card does. (11) The Point Value follows the published cards, not ASC p.139 to the letter: no
  rounding of the Offensive Value, Defense Factor steps of 0.1 and 0.25, mimetic and camo systems as a
  movement modifier of 3 and 2. (12) ASC p.102 adds 1 or 2 damage for vibro-claws and its tables give battle
  armor mortars Short range only; the published cards add nothing for claws and rate mortars at Medium range.
  The book is followed, so those suits differ from their cards. (13) BOMB has no value in ASC's factor
  tables and adds nothing to the Point Value. (14) One-shot launchers take more slots than standard ones, as
  TM pp.346-348 print in brackets (the bracket includes the missile's slot); the published Undine comes out
  one body slot over. (15) A squad support weapon's Alpha Strike damage is added once, not times the Troop
  Factor. (16) With several troopers on a hit location of a carrier, each is rolled for in turn and damage left
  over from one passes to the next roll. (17) The Clan Battle Armor Equipment Table (TM p.348) lists no
  mortars, though IO:AE p.47 gives mortars a Clan introduction date; none are offered to Clan suits.
- [x] Mixed-technology suits (2026-10-08): a chassis of one technology base with armor and equipment of
  either (TO:AUE p.189), as an Advanced option in the eras from the Clan Invasion on. Each item keeps its own
  table's figures and dates; the armor is taken from either base at that base's weight. The importer reads the
  147 mixed sample files this way (the armor's base from the file's `armor_tech` level): 142 come out legal.
- [x] Equipment carried by one trooper (2026-10-08): any item can be given to one trooper. Each trooper's suit
  is checked on its own, the weight shown is the heaviest trooper's, the item is lost with its trooper in play
  and its Alpha Strike damage is counted once. The importer treats what every trooper lists as the squad's.
- [x] Mine dispenser Battle Value (2026-10-08): that of a 10-point minefield of the mines carried (TO:AUE
  p.195; Minefield BV Table p.197), with the kind of mine chosen for each dispenser (TO:AUE p.137).
- [x] The carrier's side of mechanized transport (2026-10-08): `battle-armor-transport.ts` works out the
  occupied locations of a 'Mech or vehicle. The 'Mech's weapon dialog and the vehicle play panel block the
  weapons there (a weapon spread over locations is blocked if any is occupied), and say who rides, the MP
  lost by a unit that is not an Omni, the ban on VTOL, WiGE and Jumping MP for vehicles and on dumping
  ammunition, and when more than one unit rides (TW pp.226-227).
  After these the importer brings in 1,173 of the 1,188 sample files with nothing left off and 1,171 come out
  legal. Of the 1,087 compared with their Master Unit List cards: Move 1,058, Armor 1,086, damage 954,
  special abilities 980, Point Value 882 the same; Battle Value 674 of the 834 with no anti-personnel weapon.
  Readings to confirm: (18) The books give no construction or Battle Value rule for a squad whose troopers
  are equipped differently (the Kage's support trooper, TRO:3058U p.16). MegaMek is followed: each suit must
  be legal on its own and the squad's Battle Value is the average of the troopers' suits times the unit size
  modifier. The Master Unit List's Kage [ECM] is 113; this gives 107, and 113 with the ECM on every trooper.
  (19) A name MegaMek uses for both tables (its "CLBA" machine guns, flamers, recoilless rifles, mortars) is
  read on the chassis' technology base in a mixed suit. (20) TW p.227 bars "no vehicle" from VTOL, WiGE or
  Jumping MP while carrying battle armor; it is applied to vehicles only, not to a carrying 'Mech's jump.
  (21) A 'Mech that is not an Omni is told of its lost Walking MP; the MP is not taken off the 'Mech's sheet.
- [x] Battle armor readings 1-21 ruled on by the user (2026-10-08). Confirmed as built: 1 (UMUs on a Clan
  exoskeleton: the suits come from underwater mining rigs), 2, 4 (a bomb rack is nearer a ballistic weapon than
  a missile), 5-8, 12, 13 (BOMB has no value of its own, so none is added), 15, 16, 18-21. Changed:
  (3) Anti-'Mech Battle Value adds arm-mounted direct-fire weapons only, though TM p.310 prints "all
  direct-fire weapons": only those fire in a Swarm attack (TW p.220). (9) The anti-personnel mount's weapon
  stays in the Battle Value; the Master Unit List leaves it out and can be wrong. (10, 11) The Alpha Strike
  Companion errata v1.2 (2018) is the newer source and prints what the cards do: no armor multiplier for
  reactive or reflective armor, no rounding of the Offensive Value, minimal damage worth half a point,
  Movement Factor of Move / 8, Defense Factor steps of 0.1 and 0.25, stealth +1, MAS / LMAS as a movement
  modifier, DIR to the nearest half, Agile, C3 as 5% of the subtotal (not a 1.1 multiplier), tube artillery
  1 damage at 6 points, vibro-claws 0.1 each, no Indirect Fire for mortars. (14) The published Undine is
  allowed its one body slot over, as a note (`BATTLE_ARMOR_PUBLISHED_EXCEPTIONS`). (17) Mortars are offered to
  Clan suits from 3065 (IO:AE p.47, "All") with the Inner Sphere table's figures, as TM p.348 prints none.
  After these: 1,174 of 1,188 sample files legal; of 1,087 cards, damage 1,033, Point Value 984, Battle Value
  705 of the 834 with no anti-personnel weapon.
  Brawler (user ruling, 2026-10-09): battle armor does not take the Brawler reduction of ASC p.141. ASC errata
  v1.4 and v1.6 (added to the library 2026-10-08) print the reduction with no exception for battle armor, so
  leaving it out rests on MegaMek (units with CAR 8 or less, or MEC, are left out) and the cards: with it 453
  cards match, without it 984. The errata does not change the "VTOL or WiGE Vehicle" +1 either; it is given to
  battle armor with VTOL movement, as MegaMek and the cards do.
- [x] OmniVehicles (2026-10-08): a vehicle can be built as an Omni (TM p.97): the flag and each item's
  pod-mounted mark are saved with the design, the cost is x 1.25 (TM p.285), the equipment step has a Pod
  column and shows the pod space, and the summary, record sheet and roster say "Omni". As a carrier of
  mechanized battle armor an OmniVehicle needs no magnetic clamps on the squad and loses no MP; a standard
  vehicle does. OmniFighters and OmniMechs already had this; canon LAMs may not be Omnis (TRO:3085
  pp.286-288) and the fan-made Omni-LAM stays at the Custom Homebrew level.
  Not built for vehicles: named alternate configurations of one chassis (OmniMechs have them; OmniFighters
  and OmniVehicles only mark pods), and the import of the Omni flag from MegaMek or SSW vehicle files.
- [ ] Battle armor still owed: `.blk` export (left off for now at the user's word, 2026-10-08).

### Conventional Infantry

- [ ] Platoon construction (TechManual): motive type (foot, jump, motorized, mechanized
  tracked/wheeled/hover/VTOL, beast-mounted), primary and secondary weapons, armor kits, field guns and
  artillery, specializations (paratroops, anti-'Mech training, marines and others).
- [ ] Damage by trooper count, infantry damage tables, record sheet, BV, cost, Alpha Strike conversion, and
  transport capacity checks against vehicles and aerospace bays.

### Aerospace and Conventional Fighters

- [ ] Aerospace fighter construction: thrust, fuel, structural integrity, heat, aerospace armor locations
  (nose, wings, aft), weapon arcs, bombs and external stores.
- [ ] Conventional fighter construction (its own engine and fuel rules).
- [ ] Atmospheric/orbital movement, aerospace criticals, and air-to-air/air-to-ground record sheets.
- [ ] BV, cost, Alpha Strike conversion (armor threshold, aerospace specials) and aerospace validation
  tests. Also unlocks the LAM items under section 6 (Aerospace-mode skills, Alpha Strike LAMs).

### ProtoMechs

- [x] ProtoMech construction model and editor (2026-10-09): `protomech.ts`, `protomech-construction.ts`,
  `protomech-blk.ts`, the ProtoMech Creator (chassis, equipment, summary, record sheet, Alpha Strike card),
  saves and backups, Points in the Classic roster (group table, play panel, print) and saved designs offered
  to Alpha Strike forces. Standard ProtoMechs (TM pp.80-89) and Ultraheavy, Quad and Glider ProtoMechs (IO:AE
  pp.93-96), built in kilograms: tube missile launchers, ammunition by the shot, heat sinks for energy
  weapons, jump jets, extended jump jets, UMUs, myomer booster, magnetic clamps, melee systems, partial wing,
  Fusillade launcher. Battle Value (TM pp.306-307) and cost (TM pp.279-285) reproduce the book's Delphyne-2
  (316 BV; 741,700 + 80,000 C-bills x 1.09). Of MegaMek's 86 sample files, 85 import with nothing left off
  and 85 are legal; 70 come to their exact tonnage. Of the 76 with Master Unit List cards: Battle Value 62,
  Alpha Strike armor 76, move 73, damage 73, abilities 75, Point Value 73.
- [x] ProtoMech armor, fractional mass and Electric Discharge ProtoMech Armor (IO:AE pp.58-59, 190): 75 kg a
  point, one torso item less, 32 Battle Value as a weapon, 1,250 C-bills a point. "UltraProto Standard"
  is the readouts' name for the standard armor of Ultraheavy ProtoMechs (The Wars of Reaving p.212; TRO:
  Prototypes p.90); it has no rules of its own, and those units use the same armor on a larger table.
- [x] ProtoMech-only weapons: Streak LRM by the tube (TO:AUE p.139, 400 kg a tube, Battle Values from its
  table) and the Fusillade launcher (IO:AE p.59: 1.5 tons with its two ATM 3 rounds, Battle Value 11).
- [x] ProtoMech readings, approved by the user as written (2026-10-09). Each is built as stated and noted in the code:
  1. Plasma cannon: TechManual's equipment table gives it no ProtoMech column (NA), but its ProtoMech
     Ammunition Weight Table lists it (TM p.88) and the Boggart mounts one (The Wars of Reaving p.211). Entered
     as ProtoMech-mountable, as MegaMek has it.
  2. Myomer booster and Battle Value: TM p.306 adds 1 to the speed factor's MP. The Master Unit List uses the
     boosted Running MP (Siren 4: 88 against our 84; Centaur 4: 228 against 214). Built by the book.
  3. Chemical laser ammunition: TO:AUE p.131 says 1,000 / shots a ton, rounded up to the kilogram. Rounding
     each shot gives 34 kg; the published Svartalfa Ultra weighs 15 shots at 500 kg (TRO: Prototypes p.91), so
     the load is rounded, as TM p.88 does for other ammunition.
  4. Published designs outside the rules: the Svartalfa Ultra prints 7 armor on a main gun whose limit is 6
     (IO:AE p.96); the Svartalfa 3 file is 100 kg over; the Gorgon 6 file mounts an Inner Sphere Angel ECM,
     which a Clan-only ProtoMech cannot (it is left off on import and reported). The Svartalfa Ultra's armor
     is now allowed as a published exception; the other two are not, having no printed sheet in the library.
  5. IO:AE p.96 prints an arm armor limit of 4 for 3 to 5 tons; TM p.82 prints 2 and the table's own Armor
     Factor column only adds up with 2. Entered as 2 (obvious misprint).
  6. Master Unit List Battle Values that differ and were left: LRM 3 carriers come out 1 to 2 lower here
     (TM and MegaMek both value the launcher at 34), magnetic clamp carriers 1 higher (IO:AE p.190 gives the
     clamp 1), and the ProtoMech AC/2's ammunition is not counted on the Minotaur 4's card.
  7. Alpha Strike: the cards do not apply the fewer-than-ten-shots reduction (ASC p.101, errata v1.6) to the
     Procyon 2, Procyon 4 and Minotaur-P2, and give a Glider one Move value where ASC p.124 gives two
     (2"/8"g). Built by the book. A Glider takes the "VTOL or WiGE Vehicle" +1 in its Defense Factor, as the
     cards do. The myomer booster moves as MASC does (x 1.25), which the Companion does not say outright.
  8. Catalog corrections made from the Companion's Clan table (ASC pp.109-110): LB 5-X, Ultra AC/2 and /5,
     ER small laser, ER PPC (no Extreme value), the three ER pulse lasers, large and medium pulse lasers, the
     three improved heavy lasers, and the plasma cannon (no damage, heat 7); the Clan active probe now gives PRB.
- [x] ProtoMech follow-ups (2026-10-09). Machine gun arrays: offered, linking two to four machine guns of
  one size class mounted anywhere on the ProtoMech (TM p.228), worth 0.67 of the linked guns (TM p.318, note
  F). Special missile munitions: chosen per launcher and weighed by the missile at the munition's multiplier
  (TO:AUE p.173), taken as the standard round's missiles a ton over the munition's; no Artemis missiles, as
  ProtoMechs may not install Artemis (TM p.206). Flamers: the ER flamer is fusion-fed and needs heat sinks,
  the heavy and vehicle flamers are ammunition-fed and need none (TO:AUE pp.124-125 give no other rule).
  Published exceptions (`PROTOMECH_PUBLISHED_EXCEPTIONS`): the Svartalfa Ultra's 7 points of main gun armor
  (TRO: Prototypes p.91), which brings it to its printed 14 tons and Battle Value of 540.
- [x] Gorgon 6 (user ruling, 2026-10-09): tried with the Clan ECM suite, which leaves it a ton light, so its
  Inner Sphere Angel ECM is entered as printed, on the Angel ECM Suite (Clan) record (the same 2 tons); the
  import says so. It then weighs exactly 8 tons, with Battle Value 355 and an Alpha Strike card that match the
  Master Unit List. All 86 sample files now import with nothing left off.
- [x] Builders checked in the UI (2026-10-09, `e2e/unit-builders.spec.ts`): infantry, battle armor, ProtoMechs,
  aerospace fighters and conventional fighters are each on the Classic BattleTech page and menu and turn a
  new design into a record sheet and an Alpha Strike card; buildings into a record sheet. A roster group
  takes the saved designs of all of them.
- [ ] Found in that check: buildings have no Alpha Strike card, and saved buildings and saved vehicles are not
  offered to an Alpha Strike force. (ASCE says advanced buildings have their own unit card; the rules for
  it have not been read yet.)
- [ ] ProtoMechs, left for the MegaMek import and export run (user, 2026-10-09): `.blk` export; the
  Svartalfa 3 file, 100 kg over, with no printed sheet to check.

### Small Craft

- [x] Small Craft construction model and editor (2026-10-09). Decided: Small Craft have their own class and
  editor, not a fighter subtype. Nearly every construction step is their own (engine by formula, bought
  Structural Integrity, armor by the ton, crew, quarters and bays), and DropShips build on the same steps.
  `small-craft.ts`, `small-craft-construction.ts` (with the transport bay, quarters and escape system tables
  DropShips will use), `small-craft-hit-tables.ts`, `small-craft-blk.ts`, the Small Craft Creator (hull,
  armor and heat sinks, weapons by arc, crew and bays, summary, record sheet, Alpha Strike card), saves and
  backups, and Small Craft in the Classic roster (group table, play panel, print). Aerodyne and spheroid
  craft of 100 to 200 tons (TM pp.180-197); Battle Value (TM pp.311-313); cost (TM pp.283-285); hits and
  critical hits (TW pp.237-240); heat as a fighter (TW p.161). The book's Astrolux comes out step for step.
  Of MegaMek's 39 sample files, 2 are 5-ton pods and are refused; of the other 37, all 37 load legal, 29
  with nothing left off and 22 at their exact tonnage (the rest are lighter: older readouts, primitive
  craft, or equipment not in the catalog). Of 17 with a Battle Value on their Master Unit List card, 6 match
  exactly and 7 more are within 2 percent.
- [ ] Small Craft readings for the user to rule on (2026-10-09). Each is built as stated and noted in the code:
  1. Free armor from the structure: the rule gives the Structural Integrity "per facing" (TM p.191); the
     Astrolux example pools the points and shares them out freely (TM p.192). Built as the example: a pool.
  2. Free heat sinks: the table gives engine tons / 60 (aerodyne) or the square root of engine tons x 1.6
     (spheroid) (TM p.193), and the Astrolux gets 1 (TM p.194); a sentence on p.195 speaks of Small Craft's
     "initial 10 free sinks". Built by the table and the example.
  3. Bay doors: "transport bays for any unit type other than infantry" need a door (TM p.196). Read as unit
     bays; a cargo bay carries no unit and needs none (many published craft have doorless cargo bays).
  4. Ten turns of fire (TM p.194) is not asked of anti-missile systems, which fire only at incoming
     missiles (the published Oo-Suzumebachi carries 48 rounds for 6 systems).
  5. Battle Value, rear-firing weapons (TM p.312): on an aerodyne craft the wing weapons turned to the rear
     count as rear-firing with the aft ones; a spheroid's aft-side arcs are "not considered", as the book
     says. The Master Unit List agrees on the first; on some cards (the three Aquarius Escorts, exactly) it
     leaves out the 15 points for each type of explosive ammunition, on others it applies them. Built by
     the book.
  6. Battle Value heat of rapid-fire weapons: the x 2 (Ultra) and x 6 (rotary) apply to the heat of one
     shot, not to the aerospace heat value, which is already a full burst. The fighter class multiplies the
     aerospace value; it should be checked the same way (no rotary-armed fighter is in its tests).
  7. Prices: quarters are not charged (the Nekohono'o example, TM p.284: "part of the life support costs"),
     though the equipment table prices them. Battle armor bays are charged 15,000 a ton as the table has it;
     the same example calls them free. Same-book conflict, to be ruled on.
  8. A Clan craft takes the Clan engine factor (TM p.184). MegaMek's files mark Clan Small Craft
     `clan_engine false`; the flag is read only for a Mixed Tech craft.
  9. MegaMek's crew count takes in the troops carried in bays; on import the crew is whoever has quarters.
  10. Alpha Strike: converted as a large aerospace unit with four firing arcs (ASC pp.101-102), heat worked
      over all weapons (ASC pp.115-116). Armor, structure, Threshold and Move match the published cards.
      The Point Value follows ASC p.144 with errata v1.6 and is marked provisional: published unarmed Small
      Craft run 4 points higher than the formula gives (Astrolux 16 against 12, S-7A Bus 16 against 12),
      and the source of that 4 has not been found. VSTOL is given to aerodyne craft only; LG and SPC to all.
- [ ] Small Craft still owed: the Alpha Strike roster cannot take them (its cards have no firing arcs;
  DropShips will need the same card); primitive Small Craft (IO:AE; 5 sample files); the hyperspectral
  imager, space mine dispenser and booby trap are not in the catalog; a `.blk` export (with the MegaMek
  run); the two 5-ton sample "Small Craft" (Escape Pod, Life Boat) are not buildable units.
- [ ] Found while building Small Craft: the weekly Master Unit List sync files every "Aerospace Craft"
  (Small Craft, DropShips, JumpShips, WarShips, stations) as type AF and does not read their firing arcs,
  so those bundled cards show no damage; the catalog gives the Clan Rotary AC/2 and AC/5 an aerospace heat
  of 1 where the Inner Sphere ones have 6; CASE is marked as not mountable on Small Craft (`smallCraft: -1`),
  to be checked against TM p.210.

### DropShips

- [ ] DropShip construction and record data: spheroid/aerodyne hulls, bays and doors, weapon bays by arc,
  crew and quarters, drives and fuel, capital-scale damage.

### JumpShips, WarShips and Space Stations

- [ ] JumpShip construction: K-F drive, jump sail, docking collars, grav decks, lithium-fusion batteries.
- [ ] WarShip construction with capital weapons, bays, arcs and naval armor. Confirm the current
  capital-ship construction rules (edition) before starting.
- [ ] Space stations (MegaMek `spacestation` samples).
- [ ] Capital-scale record sheets; keep capital aerospace a separate domain from fighters while reusing
  the shared equipment and source models.

### Buildings, Gun Emplacements and Mobile Structures

- [x] Advanced building construction (TO:AR pp.126-131; the original Tactical Operations pp. 128-131): the
  Building Creator, 2026-10-07. Steps 1 to 4 for every classification but Castles Brian. See "Gun emplacement /
  building" under Rules editions for what it covers and what is still owed.
- [x] Buildings in play (2026-10-07): saved buildings join a Classic BattleTech roster group, with a Gunnery
  skill for their gunners, a play panel and a record sheet that marks the damage. Each hex tracks its Armor
  Factor and Construction Factor. An attack is scaled by the classification (TO:AR p.124, a checkbox, on by
  default), marks armor off first and then the CF (p.128), skips the armor when made from inside (p.119), and
  calls for a roll on the Advanced Building Critical Hits Table when it reaches the CF and is above the hex's
  Damage Threshold, the CF at the start of the turn / 10 rounded up (p.118). The table is resolved from the
  players' dice or the app's: weapon malfunction and destruction (a Gauss rifle explodes), gunners stunned and
  killed, turret jam and lock (a second jam locks), ammunition explosion into the CF (a tenth with CASE) and
  other equipment. Ammunition is counted by the shot. The panel shows what a hex absorbs for a unit inside and
  the damage to a unit entering it (pp.117, 124-125), and halves a hex's CF when a neighbor collapses (p.121).
  Rulings (user, 2026-10-07): (1) Battle Value stays empty for buildings for now; MegaMek's gun emplacement
  method (`GunEmplacementBVCalculator`) is not followed yet. (2) The Damage Threshold is compared with the
  damage after scaling. (3) The CF works as internal structure does on a 'Mech: damage past the last of the
  armor carries on to it. (4) An ammunition or Gauss explosion goes to the CF unscaled; CASE cuts it to a
  tenth, which the book already gives buildings (TO:AR p.118), so no custom rule was needed. (5) A critical
  hit roll is never read above 12.
- [x] Building modifications and fittings (2026-10-07, TO:AR pp.131-139, costs p.208): environmental sealing
  with the Sealed Building Breach Table in play; heavy metal superstructure (a quarter of the capacity);
  high and low ceilings; underground and underwater buildings (half size underground, sealed and no deeper
  than the CF under water, breach rolls); tunnels; large doors; industrial elevators; liquid fuel and
  chemical storage (0.91 tons a ton); automated weapons (no gunners, Gunnery 5); crew for field kitchens,
  MASH theaters and communications equipment (p.130); other buildings' hexes on the generator; the structure
  cost multipliers and fitting prices. In play: the Advanced Building Movement Table added to each hex's MP
  cost, Piloting modifier and to-hit modifier (p.117), ceilings and superstructure in the damage to a unit
  entering, and the generator going out with any hex.
  Rulings (user, 2026-10-07): all four of the items that follow stand as built; adding damage up over a
  phase is left to the table, and a generator that keeps running at part strength after losing a hex would
  be a custom rule, for later. As first raised: (1) a subsurface building rolls for a breach when one hit
  does 10 points to the CF; the
  book says 10 points "in any phase", which the app does not add up. (2) Underground, a breach collapses the
  hex; in a sealed surface or underwater building it marks every item inside lost ("all unprotected personnel
  and equipment"). (3) The generator is spread over every hex, so losing any hex puts it out. (4) Every hex
  counts as a Generator hex on the movement table for the same reason. (5) The book's own example (p.117)
  gives a Medium building a heavy metal superstructure, which its construction rule (p.135) allows only from
  Heavy up; construction follows p.135.
- [x] Light and Medium (infantry) weapons on buildings (2026-10-07). Data pass: every record in
  `infantry-weapons.ts` now carries the weapon's weight, clip weight, shots and bursts (TM pp.349-352) and its
  ammunition price and energy-cell mark (TM pp.298-301); all 212 rows matched. Buildings: hangars, standard
  buildings and walls mount them, 6 a hex for each level (TO:AR p.129); Standard weapons are Light, Support
  weapons Medium (TM p.136); one free clip and extra whole clips; no heat sinks or amplifiers (TM pp.136-137);
  one gunner each (TO:AR p.130); fixed, pintle or turret mounts (TO:AUE p.83); damage rounded to the nearest
  point and ranges from the Base Range (TM p.136); prices; creator, record sheet and play panel with shots.
  Rulings (user, 2026-10-07): (1) the Mobile Structure pintle rule stands for buildings, cost included;
  (2) weights stay to the kilogram, as weight matters to a building only as a load on its structure.
  (3) Melee weapons are offered only at the Custom Homebrew level, as traps and the like. (4) A weapon needs
  the crew the infantry table gives it; only Heavy weapons can be automated (TO:AR p.131), so no Light or
  Medium weapon goes uncrewed. (5) The 200 C-bill power cell price stands; an energy-cell weapon is wired
  into the building's power and uses its cells only when the power is out. (6) Inferno clips cost half, as
  SRM inferno ammunition does against standard (13,500 against 27,000 C-bills a ton). As first raised: (1) TO:AR names pintles on buildings only in passing, so the Mobile Structure rule is
  used: 5 percent of the weapons, to the kilogram, 1,000 C-bills a ton (TO:AUE p.83, TM p.280). (2) Weights
  are kept to the kilogram; on Medium and Large Support Vehicles small items are totalled and rounded up to
  the half ton (TM p.137), and TO:AR says nothing for buildings. (3) The table's melee weapons are not
  offered: TM p.136 names only Standard and Support weapons. (4) A building gives each weapon one gunner
  (TO:AR p.130) where a Support Vehicle uses the table's Crew value (TM p.137): the Support PPC has a crew
  of 5. (5) An energy-cell weapon with extra clips pays 200 C-bills once for its power cells (TM p.301
  footnote); the free clip costs nothing. (6) Inferno rounds have no row in the cost table and take the
  weapon's ammunition price. (7) The Mandrake hold-out Gauss pistol and the hold-out needler pistol have a
  clip in the statistics table and the single-use footnote in the cost table; entered with the clip and no
  ammunition price. (8) The two-shot SRM launcher's inferno row prints "30.0 k"; read as 30 kg.
- [x] Castles Brian buildings (2026-10-07). The classification, with its Heavy and Hardened rows (TO:AR
  p.113): capital-scale CF carrying 10 tons a point for each level (p.127); armor to CF x 2, the standard points
  divided by 10 and rounded down (pp.113, 128); Heavy weapon tonnage on the undivided CF for each level (p.129);
  sealed by default at no cost, full size underground, ceilings and large doors (pp.116, 135-136, 138);
  open-space construction, 600 tons at most and nothing on the roof, cost x2.5 (pp.137, 208); 1,000,000
  C-bills a point of CF with the CF x 10 in the final multiplier (p.208). In play: a unit's total damage
  divided by 10 and rounded to the nearest point (user ruling: the p.125 example over the p.124 text's 20), the
  single-hit threshold for 10 points to units inside, damage the building does x10, and a breach that takes
  only the hex hit (pp.124-125, 134). Readings to confirm: (1) the armor maximum "CF x 2" is taken in
  capital-scale points; (2) "do not divide their CF" for weapons is taken on the capital-scale figure (CF x
  levels tons, not CF x 10 x levels); (3) built-in sealing does not apply the x1.5 cost multiplier; (4) the
  600-ton open-space limit is taken for the whole building, not each hex; (5) an elevator lifts up to CF x 10
  tons; (6) the underwater depth limit and the Unspecified Equipment price use the CF as printed; (7) a
  sealed Castles Brian rolls for a breach when a hit does more than 10 standard points, which is 2 or more
  capital-scale points; (8) the book's Command Tower has "50 capital points, or 32 tons" of armor, and 32
  tons work out to 51 (512 / 10).
- [x] Capital and sub-capital weapons on fortresses and Castles Brian (2026-10-07). One capital weapon that is
  not a missile launcher in a hex and any number of launchers; 10 percent more weight for fire control and a
  fusion or fission generator for anything but a launcher; a weapon's weight shared evenly with named neighbor
  hexes; no turret or pintle in a hex that holds one or a share; an upward arc only; 7 gunners each, never
  automated (TO:AR pp.129-131; TO:AUE p.83). Mass Drivers are not offered (TO:AUE p.135). Custom rule (user,
  2026-10-07): capital weapons in the hexes next to an ammunition bunker share it, at the Custom Homebrew
  level. Readings, all confirmed by the user 2026-10-07; adjacency (8) is enforced on the map in play:
  (1) capital weapons do not count against the hex's Heavy weapon tonnage, only its weight capacity; (2) the
  fusion or fission rule and the 10 percent cover sub-capital cannons and lasers as well; (3) the Screen
  Launcher counts as a missile launcher; (4) capital lasers and PPCs need heat sinks, as other energy weapons
  do, and add nothing to the generator's weight, which counts Heavy energy weapons; (5) fire control has no
  price; (6) the 10-shot minimum for launchers is a DropShip rule, shown as a note and not enforced; (7)
  ammunition sits in the weapon's own hex; (8) adjacency of shared hexes is not checked: the building has no
  map.
- [x] Capital and sub-capital catalogs checked line by line against TO:AUE pp.196, 220-223, TM pp.210, 237,
  294-296, 318, 342 and IO:AE p.33 (2026-10-07). Corrected: TO:AUE ammunition is priced by the ton, not the
  shot (table note, p.223); the AR-10 fires standard missiles only (TM p.342). Rules levels are as printed
  and now tested for every record. Open: TO:AUE p.221 prints a year for each weapon that differs from the
  IO:AE family dates in six places (NAC/20 2197, NAC/40 2202, Heavy N-Gauss 2449, NL55 2307, Light and Medium
  N-PPC 2358); TechManual p.342 rates the capital missiles D and the Screen Launcher E where IO:AE has E and
  F; TO:AUE p.223 lists sub-capital cannons and lasers as Inner Sphere only where IO:AE gives the Clans them
  from 3091 (user ruling 2026-10-07: IO:AE). These books are one rules edition, so the newest is followed and
  the others' values are kept on each record in `sourceVariants`.
- [ ] Capital weapons by rules edition (user, 2026-10-07: where editions disagree, each edition's values are
  listed so the selected edition shows its own). `ICapitalWeapon` takes `introducedInEdition` and
  `editionStats`; BattleSpace (1993), AeroTech 2 (2000) and its Revised Edition (2004) are not entered yet.
- [ ] Custom rule to propose: a price for capital fire control (the books give none; the user wants everything
  priced under custom rules). Needs a figure the user approves.
- [ ] Buildings, still owed:
  - Light and Medium weapons in play: the critical hit table's weapon results pick only Heavy weapons, and
    burst, flame and anti-aircraft effects are shown as letters, not applied.
  - Capital weapons in play: ammunition used, critical hits on them, and fire at aerospace units; the record
    sheet lists them and nothing more.
  - Castles Brian open-space collapse effects by location, and the fire modifiers for Castles Brian hexes
    (TO:AR pp.42, 137).
  - The Expanded Construction Factor rules (a CF for each level, top-down collapse, total collapse), collapse
    splash damage and the domino effect (TO:AR pp.119-124); splash and adjacency need the building's shape on
    the map.
  - Attacks on equipment from inside (p.119); weapon fire by the building with to-hit numbers; hangar movement
    reductions, which depend on the moving unit's height (p.117); fuel type, leaks and explosions for liquid
    storage in play (pp.132-134); elevator position and door state in play; semi-subsurface buildings and
    basements as one design (p.138); the PCMT-fed generator; flight decks, helipads, mobile field bases and
    modular linkage on the crew table, which are not in the equipment lists.
- [ ] Buildings in Alpha Strike: ASCE pp.137-139 has no conversion from a constructed building. An armed
  building's damage is chosen by the players, up to its Alpha Strike CF for each emplacement, with armor up
  to the CF. Nothing is built.
- [ ] Mobile Structures (Designing Mobile Structures, TO p. 259): type, Construction Factor, internal weight
  capacity, power and motive systems. Static buildings share its armor, heat sink and weapon rules.
- [ ] Gun emplacements: construction is in the Building Creator (2026-10-07). Still owed: the BLK import of
  the 106 `advancedbuildings` and the `ge` folder in the MegaMek samples.

### Support Vehicles

- [ ] Support vehicle construction (TechManual; large support vehicles and airships in TO), reusing the
  Combat Vehicle model: structural and armor tech ratings, chassis modifications, fixed-wing and airship
  types. MegaMek `battlefieldsupport` samples.
- [ ] Support vehicle construction rules for each motive type (requested 2026-10-01): wheeled, tracked,
  hover, VTOL, WiGE, naval, airship, fixed-wing and rail each need their own weight limits, chassis and
  engine multipliers and legal equipment (TM support vehicle construction; large vehicles in TO:AUE).
  Check every motive type against the book rather than reusing the Combat Vehicle numbers. Related:
  Support Vehicle Armor BAR 2-10 is missing from the armor catalog (canon pass ledger, Batch 6).

## 6. BattleMech construction and play gaps

### LAMs

- [ ] Loaded bomb BV is added after rounding, like external stores (via MegaMek; provisional). IO's LAM BV
  rules (p.192) don't mention bomb BV; check TM's aerospace external-stores BV rule.
- [ ] Not included: the Alamo nuclear missile (optional nuclear rules) and the prototype rocket pod
  (Experimental).
- [ ] Averaged pilot skills ('Mech + aerospace, rounded normally; IO p.192, TM p.314): we store one skill
  pair, so a LAM needs separate aerospace skills first.
- [ ] Alpha Strike conversion for LAMs (LAM movement and specials); LAM PV is marked provisional until then.

### OmniMechs

- [ ] Pod-mounted heat sinks and jump jets (legal per TM) can't be modeled: they are counts in our model,
  not equipment.
- [ ] HarJel II/III, Drone OS, SRCS and Mobile HPG are fixed-only but missing from the catalogs. Sources:
  HarJel II/III IO pp.88-89 (rules), p.191 (BV), pp.220-221 (Clan, F/X-X-X-F, 3136/3139, 240,000/360,000
  C-bills, 1/2 slots; the "2*"/"3*" tonnage footnote not found yet); SRCS IO p.140, cost p.221, BV x0.85
  (p.196); Drone (Remote) OS TO pp.305-306; Mobile HPG TO p.330.

### Equipment still missing or unwired

- [ ] Weapons still missing (need sources or construction support): M-Pod, B-Pod (no stats in hand);
  BattleMech Taser (book unknown); TSEMP Cannon / One-Shot / Repeating; Cruise Missiles 50-120 (TO
  pp.284-285, with the artillery pass); C3 Remote Sensor Launcher; Light/Heavy Plasma Rifle, Light Blazer,
  Kinslaughter H ER PPC, Enhanced LRT, Rocket Launcher 1-5, Clan LRM 1 (no canon source found yet).
- [ ] Artemis V and Apollo launcher combos (Artemis IV exists as combined launcher records). Then the Clan
  LRM/SRM + Artemis V records from workbook rows 157/159/161/163 (LRM 5/10/15/20: heat 2/4/5/6,
  0.42/0.84/1.26/1.68 at S/M/L) and 169/171/173 (SRM 2/4/6: heat 2/3/4, 0.42/0.84/1.05 at S/M). Alpha Strike
  values stay "Provisional workbook conversion"; Classic stats need the TO source.
- [ ] Misc equipment still unsourced or unwired: EI Interface, DNI, drone OS/console, SRCS, IndustrialMech
  ejection seat, recon camera, sprayer, buzzsaw, fluid suction, ladder, vehicular mine dispenser, booby
  trap, cargo/liquid storage, chaff pod, comms equipment, collapsible command module, HarJel II/III,
  paramedic gear, ground-mobile HPG, RISC viral jammers / laser pulse module / super-cooled myomer, DIC,
  QuadVee wheels, turrets (needs a turret-mount toggle), dumpers, Ram Plate. Leads from the Sarna pass
  (review-only, `tools/misc-equipment-sources-staging.jsonl`; Sarna "TO" pages may be the pre-split book):
  Drone OS/Carrier Control TO p.305, Recon Camera TO p.337, Sprayer TM p.248, Fluid Suction TM p.248, Liquid
  Storage TM p.239, Comms Equipment TM p.212, Paramedic TM p.233, Booby Trap TO p.297, Chaff Pod TO p.299,
  Collapsible Command Module TO p.301, BattleMech Turret TO p.347, Artemis V TO p.283, Apollo TO p.331, DNI
  Unbound p.66, Buzzsaw Unbound p.70, RISC Laser Pulse Module IO p.93, Super-Cooled Myomer IO p.94, Ram Plate
  OTP: Hanseatic Crusade p.30.
- [ ] Placement rules not enforced yet: spread items (one per location, side torsos, legs), hand-actuator
  requirements, Claw replacing the hand.
- [ ] Patchwork armor still owed: Combat Vehicles, Support Vehicles and fighters; SSW/MTF import; armor
  types on the record sheet (none printed today).
- [ ] Fractional Accounting (TO:AUE p.188): the switch is in step 1 but locked
  (`BattleMech.FRACTIONAL_ACCOUNTING_AVAILABLE = false`). Building it means engine multipliers, armor by the
  point, ammunition by the shot, all rounded up to the kilogram; then turn the switch on.
- [ ] Clans' pre-2825 use of Star League Ferro-Fibrous isn't modeled.

### IndustrialMechs and Primitive 'Mechs

Chassis types the Mech Creator builds (checked 2026-10-02): Biped, Quad, Tripod, LAM, QuadVee (Mech Type);
Ultralight and Superheavy (tonnage); OmniMech and Primitive (checkboxes); IndustrialMech (Industrial structure).

- [ ] IndustrialMechs still owed: Extended Fuel Tanks on Combat Vehicles (vehicle builder cannot size
  variable equipment); critical hit roll modifiers (the 'Mech play mode does not roll for critical hits).
  The builder still offers ICE and fuel cell engines to BattleMechs.
- [ ] Primitive 'Mechs still owed: critical hit roll modifiers (+2 / +4, IO:AE p.114) once the 'Mech play
  mode rolls for critical hits.
- [ ] Alpha Strike specials on builder cards (already on upstream master, every unit): a weapon with no
  `alphaStrike.specialAbility` falls back to its TechManual weapon type codes (`getAlphaStrikeEquipmentAbilityCodes`
  in `equipment-registry.ts`), so cards print "DB", "DE", "S"; and `alphaStrike.notes` are pushed into the
  specials, so "PROVISIONAL WORKBOOK CONVERSION" prints too (`calcAlphaStrike`). Fix on its own branch.
- [ ] Then lift the SSW import skip for these designs (section 2, 234 designs): `importSSWXML` only accepts
  `mech_type` "BattleMech".

### Canon equipment pass: still owed (branch `feature/canon-equipment-pass`, ledger `tools/canon-pass-ledger.md`)

Status 2026-10-09: upstream draft PR #115 (branch `bundle/unit-builders-and-catalogs`) offers the whole fork as one
bundle: every open PR except #92 and #97, plus the unit builders, rules levels and rules editions. It leaves out
`.claude/` and the local Ollama worker tools. Update it (merge this branch, drop those files again) as work lands.

- [ ] From the review of #115 (fleetfootmike, 2026-10-09), still open:
  - Scope, for the user to decide: `building.ts` ships a full in-play combat engine; the Custom MUL editor
    (`custom-mul.ts`, `/custom-mul-editor`) is in the bundle though it is not in the feature list. Keep both in
    #115, or split them out.
  - `tools/mul-sync/sync-mul.mjs`: the live-to-legacy era id table has no entry for ids 1 and 9. 494 bundled
    records carry era id 1 unmapped. Which legacy era each is has to come from the site's era list.
  - Reported as already on upstream master, not fixed here: Alpha Strike value adds Medium damage twice and
    uses ground movement for jump-heavy units; restored favourite groups are not saved; three ammunition Battle
    Values out of step with their Clan twins (IS LB 5-X cluster, IS Thumper Copperhead, IS Arrow IV Homing);
    the roster footer counts only 'Mechs.
  - The 'Mech armor, engine, gyro and other option lists still mark availability on the shared tables (as
    upstream does); vehicles now mark copies. A 'Mech viewed after another 'Mech can still show the other's marks.
  - Kept as the book prints them, against the review: Firedrake needler range 1 and Dragonsbane pulse laser
    range 3 (TM infantry tables v4.1); ProtoMech Extended Jump Jets at Standard ("Tournament Legal", IO:AE p.59).

Status 2026-10-02: rebased on upstream master (after #85), split into seven branches and opened upstream
in HeySporky/battletech-tools. All of it is merged into local `master` together with the SSW runtime import.

| PR | branch | state |
|---|---|---|
| #98 | `canon-pass/1-components` | ready |
| #99 | `canon-pass/2-equipment-weapons-ammo` | draft, on #98 |
| #100 | `canon-pass/3-audits-splits-bv` | draft, on #99 |
| #101 | `canon-pass/4-superheavy-bv-slots` | draft, on #100 |
| #102 | `canon-pass/5-new-equipment` | draft, on #101 |
| #103 | `canon-pass/6-industrialmechs-builder-rules` | draft, on #102 |
| #104 | `canon-pass/unit-domain-catalogs` (ledger `tools/canon-pass-ledger-unit-catalogs.md`) | ready, independent |
| #105 | `canon-pass/7-industrial-primitive-mechs` | draft, on #103 |
| #106 | `patchwork-armor` | draft, on #105 |
| #107 | `industrialmech-sealing-fuel` | draft, on #105 |
| #108 | `primitive-retrotech` | draft, on #105 |
| #109 | `industrialmech-to-hit` | draft, on #105 |

- [ ] As each part merges upstream, rebase the next branch on upstream master and mark it ready.
- [ ] #91 and #94 (Clan eras) touch the same catalogs; whichever set merges second needs a rebase. The
  merge into local master shows where they differ: the canon pass values were kept (Clan 'Mech Mortar
  dates and weights, Clan artillery cannon production 3079 with one universal shell record, Inner Sphere
  Laser Insulator never reintroduced, Inner Sphere mortar munitions following the launcher).
- [ ] SSW importer PR: not opened. Rebase `feature/ssw-runtime-import` on upstream master, rerun the corpus
  audit against the full catalog and shrink `ssw-canon-pending-names.ts` first.
- [ ] After both PR sets merge, restore the Ferro-Aluminum note dropped from `mech-armor-types.ts` in the split.
- [ ] `ammo-is-*` records moved out of the universal catalog list the old tag twice and their own tag in
  `altTags` (harmless; tidy up).

- [ ] Same-book conflicts: the errata were checked (IO v1.21, IO:AE v3.01; Batch 14) and rule on none
  of them, so the catalog still follows MegaMek and each is flagged in the ledger: IO:AE armor BV
  modifiers p.185 vs p.190; primitive cockpit cost p.117 vs p.215; Heat-Dissipating Clan year p.81 vs
  pp.29, 215; Improved Large Laser / Pulse Laser years p.89 vs p.37; Clan claws (3090 as a prototype,
  no production year); primitive prototype missile shots per ton and SRM range (p.112 text vs p.210
  table); TO:AUE p.219 large engine dates vs IO:AE p.38.
- [ ] Domain catalogs. Done (Batches 49-54): `capital-weapons.ts` and `sub-capital-weapons.ts` (never
  'Mech-legal), `aerospace-armor-types.ts` (fighter, DropShip and capital armor), `support-vehicle-armor.ts`
  (BAR 2-10), `protomech-components.ts`, `battle-armor-armor-types.ts`, IndustrialMech armor (Industrial,
  Commercial), and 26 industrial items of TM pp.344-345. Still owed: battle armor chassis, motive systems,
  manipulators and weapons; ProtoMech UMU, engine and structure-point tables; capital missile large-craft
  slot columns (Strategic Operations), Naval C3 and other large-craft systems; the variable-size industrial
  items (Communications Equipment, Dumper, Extended Fuel Tanks, Ladder, Pintle Mount, Power Amplifiers,
  transport bays); Primitive small and large craft armor.
- [ ] Still owed before the PRs: missile `damageAero` convention, Nail Gun range dash, source search for
  the custom catalogs, Alpha Strike conversions marked unresolved, play-rule items, the import
  "ask the importer" step, review of `tools/spec-c-sources-staging.jsonl`. The equipment PRs are open
  (#98-#104); these items go in follow-up PRs.
- [ ] Re-cite the LAM and QuadVee comments in `battlemech.ts` that still give IO (2016) pages (pp.105-196)
  to IO:AE, checking each page.
- [ ] Alpha Strike conversions for the pods added in Batch 9c (B-Pod, M-Pod, Chaff Pod) are marked
  unresolved.
- [ ] Vehicles have no era check on engine types, so large engine dates (Batch 16) apply to 'Mechs only.
- [ ] Missile launcher `damageAero` holds 3 for every LRM size (the tables give 3 / 6 / 9 / 12). Check
  how the aerospace code reads it before changing the catalog.
- [ ] The Nail/Rivet Gun has no medium or long range bracket (TM p.344); the record stores 0 and the
  record sheet prints 1/0/0. Print a dash for a missing bracket.
- [ ] Cockpit slots (Batch 24): Tripod, superheavy and QuadVee cockpits now sit in the head only, per the
  IO:AE record sheets. The center torso slot was in upstream too: call it out in the equipment PR.
- [ ] Battle Value (Batches 26, 27): explosive penalty by location, CASE II, floor of 1, weapon order by
  Modified BV. Owed: IndustrialMech Offensive Battle Rating x0.9 without Advanced Fire Control (TM p.304)
  needs a fire control choice (TM p.69); prototype CASE is not counted as CASE; `hasXLEngine()` answers
  true for Light and Clan XL engines and drives the "wrecked" check in play tracking.
- [ ] TM equipment limits not modeled: torso-only weapons (Heavy Gauss), one industrial item per location.

### Cockpits

- [ ] Cockpit selector (found in the canon pass, Batch 8): `mech-cockpit-types.ts` on
  `feature/canon-equipment-pass` catalogues 15 'Mech cockpits, but the builder only mounts Standard,
  Small and the chassis cockpits. Still to wire: Torso-Mounted (2 CT slots, life support in the side
  torsos, BV x0.95 with doubled CT armor, TO:AUE pp.112-113, 193), Command Console (add-on, 3 tons),
  Interface / Machina Domini (gyro optional, IO:AE p.110), DNI modification, IndustrialMech and primitive
  cockpits. Saved designs store only `sm_cockpit`; a cockpit tag needs a schema bump.
- [ ] Enforce cockpit dates by era (Small Cockpit is offered in every era; IS 3067, Clan 3080).

### Custom Homebrew

- [ ] Compact 'Mechs under the Custom Homebrew rules level (requested 2026-10-01). Source: the *Best of
  Future Wars* fanzine. The fanzine is in `_KNOWLEDGE_DEV/custom/`
  and read before any design work; nothing is to be reconstructed from memory. Lead: 12 HeavyMetal Pro
  files in `WorkingData_DEV/HMPdata/hmpFiles/FutureWars`. Goes in `mech-custom-*` only, gated by
  `tag: "custom"`, never in canon lists or canon BV/PV math.  **Note there is other stuff inside this source that should be brought in as well.
- [ ] Micro Mechs under the Custom Homebrew rules level. Source: Micro Mechs in `_KNOWLEDGE_DEV/custom/`
- [ ] Hexa and Octapeds. under the Custom homebrew rules level. Source: https://www.reddit.com/r/battletech/comments/fb5ufe/eight_and_sixlegged_mech_thoughts/
- [ ] Permenant Air Mechs (PAMs): Source: https://www.battletech.com/forums/index.php/topic,44833.0.html  **Note: there is a lot of other good stuff to pull out of that thread as well... we want it all.
- [ ] https://lostech.miraheze.org/  Lots of good custom stuff here... The detargeting computer as an example.
- [ ] https://battletechfanon.fandom.com/wiki/Category:Weapons  More stuff to add.

### Calculations and play

- [ ] Cost, record sheet and Alpha Strike conversion should consume `roundsPerTon`/`shotsPerTon`,
  `prototype` and composite records.
- [ ] Play mode for the newer weapons and armor: MG Array cluster fire, AMS interception with ammo use, TAG
  designation, chemical laser ammo use, HVAC; Reactive, Reflective, Hardened and Heat-Dissipating armor
  effects; tracked movement mode.
- [ ] 'Mech ammunition explosions: total the damage of the ammunition carried (the vehicle version exists).

## 7. Alpha Strike workbook review (waiting on classification decisions)

- [ ] Classify the remaining rows in `tools/alpha-strike-workbook-review-blocks.md` and promote only after
  the source and tech-base decisions are recorded there. Blocks 13-20 have proposed classifications and
  findings F1-F12 in the ledger (2026-09-27), awaiting approval:
  - Block 13, rows 121-130: Ultra AC/5/10/20 (C), Improved AC/2/5/10/20, Improved Gauss Rifle, and
    Prototype LB 2-X/5-X Autocannons.
  - Block 14, rows 131-140: Prototype LB 20-X, Prototype UAC/2/10/20, Chemical Lasers, and ER Pulse Lasers.
  - Block 15, rows 141-150: Vehicle Flamer (C), Improved Heavy Lasers, Prototype ER Lasers, Improved
    Lasers/Pulse Laser, Improved PPC, and Enhanced PPC.
  - Blocks 16-17, rows 151-170: ER PPC (C), ATM variants, Clan LRM Artemis IV/V variants, Clan 'Mech
    Mortars, and Clan SRM Artemis IV/V variants.
  - Block 18, rows 171-180: remaining Clan SRM variants, Clan Streak LRMs, ProtoMech Streak LRM, Fusillade
    Launcher, and Improved LRM 5.
  - Block 19, rows 181-190: Improved LRM 5/10/15/20 with standard and Artemis IV profiles, plus Improved
    SRM 2/4.
  - Block 20, rows 191-199: Improved SRM 4/6, Prototype Streak SRMs, and Improved ATM 3/6/9/12.
- [ ] For each block, use the source rows in `tools/alpha-strike-workbook-data.json` and record `IS`,
  `Clan`, `Universal` or `Both (Stats Differ)` in the ledger before editing the catalog files.
- [ ] Resolve the remaining provisional/source gaps separately from classification: physical weights and
  slots absent from workbook rows, Clan alternate-ammo variants, specialized torpedo `-T` ammunition, and
  numeric TOR profiles.
- [ ] Keep the literal-object rule: promote approved records directly into their owning catalog files; no
  generated supplemental imports.

## 8. Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns)

BattleTech: Aces (Catalyst/Lynnvander, 2025) has three parts. First, an automated opponent for Alpha Strike, driven
by per-unit Aces decks and a Commander deck. Second, a branching narrative campaign with Named Pilots, Edge and a
Support Point (SP) economy. Third, extra Alpha Strike rules for vehicles, infantry and emplacements (*Aces* p.2).
Goal: all of it playable from the Alpha Strike section. Sources: `text/Battletech-Aces-RuleBook.ocr.txt` (cite
*Aces* p.N, printed page = PDF page - 1) and `text/battletech-aces-scouring-sands-campaign-books.ocr.txt` (cite
*Aces SS* p.N, offset 0). Both are OCR text, so check every table and number against the PDF page image before
encoding it. The Golden Rules section (*Aces* p.10) did not OCR at all.

What the app has today: one player force (`currentASForce`; its `turn`/`phase` fields are unused), damage, heat,
critical-hit and vehicle-motive tracking, SPAs, MUL roles, and the match-play scenario generator. What it lacks: an
opposing force, initiative, a target-number calculator, any game or campaign state, and any knowledge of where
units stand on the table.

**Status 2026-09-30: merged to master from `AS-Aces` (3946f1d1) and offered upstream as a PR.** Players enter
their own cards and sorties in the Card Library (`/alpha-strike/aces/library`); one cited sample of each record
type ships. The card reader walks each unit's top card; decks deal from the library with a seeded RNG.
- Model: `src/data/aces-rules.ts` (cited tables), `src/classes/aces-helpers.ts` (to-hit, crippled, front-loaded
  order, activation order, deck split and suggestion, Initiative), `aces-game.ts` (automated-force tracker) and
  `aces-campaign.ts` (difficulty, force checks, Named Pilots, ledger, sortie log). 45 tests.
- Persistence: `dataSaves.ts` keys `acesGame` and `acesCampaigns`, both included in the full backup.
- UI: `/alpha-strike/aces` (home, game, campaign, rules) and a tile on the AS home.
- `AlphaStrikeUnitSVG` gained `onChange`, so in-play damage on the automated units saves to the Aces game instead
  of the roster.
- Card engine: `src/data/aces-cards.ts` (schema, typed-line parsers, validation, library merge),
  `aces-card-samples.ts` (cited samples), `src/classes/aces-engine.ts` (behavior, targets, filters, OV, physical,
  support, tokens, strategy, crits, seeded dice). UI: `library.tsx`, `_card-reader.tsx`, `print.tsx`.
- Still open: emplacement unit entry, Waypoint scan/escape edges, Edge spends, SS abilities, campaign printables.

### Decisions before any code

- [ ] **Source gaps.** The card data needs the physical cards or an official PDF; neither is local. Aces cites the
  Alpha Strike Quick-Start Rules (AS:QSR), which aren't local either, so map each AS:QSR reference to its ASCE
  page. Other Aces boxes beyond Scouring Sands: none local; check battletech.com before scoping them.

### A. Game state and unit queries (`src/classes/`)

- [ ] Per-unit turn state: movement mode used and the TMM it produced (the "movement dice", *Aces* p.15),
  moved/attacked flags, Move First/Last tokens, Forced Withdrawal and Fleeing flags, escaped, mounted-on-transport,
  Force Commander, Named Pilot link, Edge tokens left, and destroyed-by-ammo (needed for salvage).
- [ ] A stable stat-query API for the engine: current and starting MV, TMM (with the battle armor +1, STL and heat
  effects, *Aces* p.9), armor, armor lost, starting armor, structure, damage per range, OV, PV and Size. The
  engine reads these, never the UI.

### B. Additional Alpha Strike rules (*Aces* pp.3-6, *Aces SS* pp.18-19)

- [ ] Combat vehicles (p.4). *Partial:* the motive and critical-hit tables roll and mark the unit card under the
  `aces` ruleset; heat-as-damage and Charge-only are still the player's job. Motive table (+1 for hover and wheeled; check it against the existing motive
  tracking), the Aces vehicle critical hit table under the `aces` ruleset, heat applied as damage, Charge as the
  only physical attack, TUR#. Ground vehicle movement costs as a reference table.
- [ ] Infantry (p.5). *Partial:* the to-hit modifiers and transport (IT/CAR, OMNI+MEC mount, dismount at half MV,
  carried units destroyed with an IT transport) are done; the OMNI 1D6 5-6 hit split is not. 360-degree arc, no rear, no AMM, battle armor +1 TN, critical hit is always a Weapon Hit, and
  Anti-'Mech attacks (+1 TN; +3 more for conventional infantry; +3 against a target carrying battle armor; a
  critical check on any damage). Transport: IT#/CAR#, MEC/OMNI mount (2") and dismount (half MV); the transport
  can't Sprint the turn it loads. Attacks on transports (*Aces* p.6): carried units die with an IT transport; on
  an OMNI, battle armor takes the hit on 1D6 5-6, per attack roll.
- [ ] Emplacements (p.6). *Partial:* the to-hit modifiers, the crippled-at-0 check, and the game-tracker flag
  (no deck, no FW) are done; there is no unit entry yet. Immobile (-4), -1 when attacking or spotting, critical hits always a Weapon Hit,
  crippled at 0 damage, no Forced Withdrawal. Needs an emplacement unit entry (probably a custom-MUL-style record;
  check the MUL first).
- [ ] Scouring Sands abilities (*Aces SS* p.19): ECM (12"), FLK, JMPS#, SRCH, TAG, TUR#, alternate munitions.
  Compare each with `alpha-strike-special-abilities.ts` (ASCE wording) and add Aces notes where they differ. Probe
  scan ranges (4" base, LPRB 8", PRB 12", BH 16") apply only to Waypoints (*Aces* p.24).

### C. Automated opponent engine (*Aces* pp.7-21, 38-40)

- [ ] Extras. *Partial:* the non-campaign difficulty PV helper is on the game setup page. Automated allies inside the player's force (p.38); non-campaign difficulty (80%/120% PV, skill ±1
  without recalculating PV, p.38); a quick-reference panel of icons and keywords (back cover, p.40).
- [ ] OPFOR builder in the roster. *Partial:* the automated force is loaded from the current roster or a
  favorite group, with an overridable deck, the Command deck name and card letter, and the commander unit.
  Objectives are not done. build the automated force from the MUL like the player force, assign decks (role
  default, overridable), choose the Commander deck and starting card, designate the commander unit, and define
  objectives.

### D. Campaign rules (*Aces* pp.23-37)

- [ ] Sortie setup checklist (pp.30-31): record the log entry, briefing by entry ID, Reconnaissance SP, play-area
  and Waypoint setup.
  - Player force: PV cap after difficulty. OMNI reconfiguration costs Size x5 SP, or the PV difference x40 SP if
    the new variant costs more. Named Pilots assigned by type, wounded pilots excluded, force commander chosen.
  - Then the OPFOR and special rules.
- [ ] Playing a sortie (p.32). *Partial:* the -2 Initiative modifiers and the End Phase order are in the tracker;
  Waypoints and escape edges are not.
  - Initiative: the last winner takes -2; a force whose commander is destroyed takes -2.
  - Escape edges.
  - Strict End Phase order: sortie rules, damage, heat, objectives, strategy, turn track and Waypoints.
  - Waypoint reveal and scan (p.24).
  - Edge spends: +1 pip once per Combat Phase (a raised 12 doesn't cause a critical hit), reroll motive, reroll a
    critical hit, and Edge abilities (p.24).
- [ ] Printables generated by the app: Campaign Log, Player Force Roster, Sortie Log and Named Pilot card, in our
  own layout, not copies of the official sheets.

### E. Scouring Sands content (*Aces SS*)

- [ ] Unit availability list for Apolakkia (*Aces SS* p.20). *Partial:* encoded and shown on the rules page; check SP = PV x40. Terrain legend CF values and the
  river and canyon rules (*Aces SS* p.18).
- [ ] Box OPFOR units (Bane 3, Marauder IIC, Thunderbolt IIC, Summoner H, Rifleman C2, Howler, Locust IIC 4, Fulcrum
  Heavy Hover Tank): check that our MUL data has them and that PV and specials match the box cards.

### F. UI in the Alpha Strike section

- [ ] Reuse the in-play unit cards and damage tracking for both sides. *Partial:* the automated side uses them;
  the player side uses the roster's in-play view. Show the automated units' priority,
  behavior, target and tokens next to their cards.
- [ ] Phone-first and offline, like the rest of the PWA: no network calls, and the RNG and state persist across
  reloads.

### G. Verification

- [ ] One regression test per rule, named for the rule with its *Aces* page, using the book's worked examples:
  IF p.3; Determine Behavior and Identify Target pp.11-13; Forced Withdrawal priority 625 - 500 = 125, p.16;
  Destroy Objective TMM -4, p.17; BSP ordering p.21; plus the campaign examples above.

## 9. Runtime and tooling

- [ ] File-state and cleanup audit: check that every tracked file is used or documented, and remove the rest.
  - Source: unused modules, exports and dead code in `src/` (a tool such as knip reports unused files,
    exports and dependencies).
  - Scripts: everything in `tools/`, `scripts/`, `command-line-scripts/` and `src/bin/` is referenced by
    `package.json`, a workflow or the docs, or it goes. (`tools/mul-sync/ensure-chromium-windows.mjs`, an
    unwired Windows-runner workaround, was removed on 2026-09-30.)
  - Committed outputs: generated reports and staging files (`tools/*-report.json`, `tools/*-staging.jsonl`,
    `tools/equipment-inventory-*`) are either still read by something or regenerated on demand instead of
    committed.
  - License files are never cleanup candidates: `LICENSE` (GPLv3) and `LICENSE-MIT` (the original Jeff's
    BattleTech Tools license, verbatim) stay tracked, and `src/license-files.test.ts` pins their content so any
    change fails CI until it is deliberately approved. Add any new license or notice file to that test.
  - `package.json` dependencies nothing imports.

- [ ] Drop the `typescript-7` alias and make TS 7 the only `typescript` once typescript-eslint supports
  TS >= 6.1 and TS 7 ships the JS API (or an Android binary); then remove the fallback in
  `scripts/typecheck.mjs`.
- [ ] Turn `prefer-const` (~790 hits) and `no-var` (~20) back on after their own `eslint --fix` commit
  (`npx eslint . --fix --rule 'prefer-const: error' --rule 'no-var: error'`).
- [ ] Add lint back to `npm run check` and make the CI lint job blocking once the backlog below is empty.

## 10. JBTIICRework review (2026-10-06)

`C:\repo\JBTIICRework` is a Gemini AI Studio export of master at `0a1f061e`. It is reference only: port by hand,
never copy its `package.json`, lockfiles, Vite config, `.gitignore`, `tsconfig.json` or `index.html`. Its
`errors.md` was checked item by item.

Local e2e note: with Playwright's bundled Chromium and more than about 4 workers, every test times out on the
maintainer's Windows machine. The `vite preview` process blocks for 19-38 s inside the native close of a TCP
socket (CPU profile), which points at a network filter driver, not the app: Firefox and
`PLAYWRIGHT_CHANNEL=msedge` pass at 13 workers and GitHub CI passes. Run `--workers=4` or the Edge channel locally.

Open:
- [ ] Upstream draft PRs waiting on review: #110 (`fix/storage-quota-handling`) and #112
  (`perf/lazy-ssw-corpus`, which now carries the AppRouter cleanup too; #111 was closed into it).
- [ ] Read the sources added to `_KNOWLEDGE_DEV/rulebooks/` on 2026-10-06 for rules and options the tool lacks:
  the BattleMech Manual (7th printing), Ghosts of Obeedah, The Wars of Reaving and Supplemental, the 31 XTROs
  (experimental equipment), and the quick-start rulebooks. Log each gap under the section it belongs to.
- [ ] Reference library, after the 2026-10-06 sort:
  - [ ] About 205 files (42,000 pages) are scans with no text layer. OCR of the 21 scanned `rulebooks-legacy/` books
    was started 2026-10-06; next the 20 scanned Technical Readouts, then `rpg/` and `sourcebooks/` as needed.
    Check OCR against the page image before citing a stat block.
  - [ ] Identify the files whose names say "title unconfirmed" or "title truncated" (about 60, mostly fan and
    foreign-language magazines, plus a few FASA/FanPro scans) and rename them.
  - [ ] Install Tesseract German and Spanish data before OCRing `languages/de/` or `languages/es/` scans.
- [ ] Internal structure bug (found 2026-10-07): 25 tons had 5 leg points (6), and 55/60/65 tons had 17/19/20 center
  torso points (18/20/21), against TM p.47. Confirmed in four printings; the 2026 Core Rulebook has no
  construction rules. Upstream issue #113, fix in PR #114 (branch `fix/internal-structure-table`). Merged into
  `feature/rules-editions-list` 2026-10-09; not yet in our master.
- [ ] Rules editions (`src/data/rules-editions.ts`, branch `feature/rules-editions-list`). Eleven editions are
  listed, Battledroids 1984 to the Core Rulebook 2026, the Third and Fourth Edition box sets included. Each record
  an earlier edition includes carries `editionStats`: one key per edition, the stats as printed, or `null` when
  unchanged from the previous edition that lists it. Work one edition at a time, whole, from page images (never
  OCR text), then stop for review.
  - [x] Battledroids (2026-10-07): 14 weapons, 4 ammunition types, engine, gyro, cockpit, heat sink, jump jets,
    armor, internal structure, biped, tonnages 10-100; ten 'Mechs and five other units named on the edition.
  - [x] Second Edition (2026-10-07): the same 45 records. Changed: missile launcher heat (today's values), the
    170 engine (6.0 tons), jump jets (0.5/1/2 tons by tonnage, one box each), structure table from 10 tons.
    Fourteen 'Mechs and the Chameleon trainer named on the edition; no vehicle or infantry rules.
  - [x] BattleTech Manual (2026-10-07): the 45 earlier records plus 23 new: AC/2, AC/10, AC/20 and their
    ammunition, Long Tom, Sniper and Thumper with standard and smoke rounds, vehicle flamer and fuel, Inferno SRMs,
    searchlight, fighter bombs, the LAM layout, the ICE (vehicles only). Changed: prices added (BTM p.86), integral
    engine heat sinks, structure table printed correctly. No 'Mech listings; vehicles, infantry, fighters and
    buildings named on the edition. Kept as printed and flagged: LRM 15-pack at 2 critical locations, vehicle
    flamer at 5 tons, Thumper outranging the Sniper. Engine, gyro and cockpit boxes could not be read off the
    record sheet thumbnail (BTM p.7), so those stay inherited.
  - [ ] Builders for the Manual's units that had none ('Mechs, LAMs and every vehicle type already build):
    - [x] Aerospace Fighter (2026-10-07): `aerospace-fighter.ts` and the Fighter Creator (chassis, armor, equipment,
      summary, saves, backup). TechManual rules; reproduces the Sabutai example (TM pp.184-197). Not built: BV,
      cost, OmniFighter pods, external stores loads, record sheet, Alpha Strike conversion, roster and play mode
      (all done later the same day, see below).
    - [x] Conventional Fighter (2026-10-07): a fighter type in the same class and Fighter Creator. 5-50 tons, turbine
      or standard fusion (x1.5 weight), controls 10%, armor tonnage x 1, 160 fuel points a ton, single heat sinks
      for energy weapons, power amplifiers, VSTOL. Reproduces the 'Mechbuster example (TM pp.184-196). Same gaps as
      the aerospace fighter.
    - [x] Fighters finished out (2026-10-07): Battle Value (TM pp.302-304, Thunderbird example 1,932), cost (TM
      pp.283-285, 'Mechbuster example), OmniFighter pods, external stores (TW p.247), record sheet, Alpha Strike
      conversion and card (Thunderbird matches its MUL card), roster, play mode with hit locations, Damage
      Thresholds and critical hits (TW pp.237-240), roster print. VSTOL on an aerospace fighter is an optional
      rule from the Advanced level: TM p.190 allows it in the rule text and denies it in the Sabutai example.
      Later the same day: Artemis IV launchers count 20% more in the Battle Value (TM p.303); play mode tracks
      heat through the Heat Phase (TW p.161) and holds weapon critical hits for the choosing player; Alpha Strike
      PNT and FLK specials (ASC pp.121, 128; the SPR-H5 Sparrowhawk matches its MUL card); saved fighters are in
      the Alpha Strike roster's unit picker. LRM/SRM/AC/IF specials are not given to fighters, as on MUL cards.
      Open: heat Avoid numbers are read off the record sheet (the Heat Scale itself is not in the tool); the
      catalog's "+ Artemis IV" launcher records carry a Battle Value that is not the plain launcher x 1.2
      (LRM 20: 189 against 217.2), which the 'Mech and vehicle calculations still use.
    - [x] Conventional infantry platoon (2026-10-07): Infantry Creator under TechManual pp.144-155. Motive
      types, the Formations Table by affiliation, oversized platoons split into sub-platoons, primary and
      secondary weapons (all 212 rows of the weapons table, pp.349-352, with Battle Values from p.319 and prices
      from pp.298-301), range modifiers, damage by troopers remaining, special features, Anti-'Mech kits,
      transport weight, Battle Value (TM p.309, the 168 example), cost (TM p.276, the 3,167,838 example), saves,
      backup and a record sheet. The book's tables match the revised infantry tables v4.1 (June 2021).
      Open, for a ruling: (1) settled 2026-10-07, see "Skill multipliers by rules edition" below. (2) TM p.151 works a platoon with 2 support
      machine guns per squad to -2 in its own hex (heavy burst -1, crew +1) but p.153 writes -1 for the same
      platoon, leaving the burst out; the creator follows p.151 and the Classifications Table. (3) The p.152
      text gives the crew modifier to weapons with a crew "of more than 2"; the Crew Table (p.149) and both
      examples give it at 2, which the creator follows. (4) Glenn's LRM example (p.152) uses 0.19 damage, the
      table's inferno row; the standard missile is 0.48. (5) Seven weapons have no row in the cost table
      (vibro-mace, four thrown weapons, both Pequod harpoons): their cost is left unknown. (6) With a secondary
      weapon the book does not say how to price the platoon; each trooper is priced by their own weapon, as
      MegaMek does.
    - [x] Infantry finished out (2026-10-07): platoons join roster groups and play mode, tracked by sub-platoon,
      with attacks resolved by Total Warfare pp.215-217 (the Non-Infantry Weapon Damage Against Infantry Table,
      burst-fire and infantry damage point for point, Clear terrain and mechanized doubling) and printed with
      losses blacked out; Alpha Strike conversion (ASC pp.92-103, Point Value as MegaMek works it out; matches
      the MUL's Motorized, Mechanized Hover, Taurian Foot and Clan Mechanized Hover cards), printable and in the
      Alpha Strike roster's unit picker; weapon introduction, extinction and reintroduction years from the cost
      table (TM pp.298-301) with an era on the platoon; infantry armor (TO:AUE pp.129-130, 191: 47 rows, damage
      divisor, encumbrance, vacuum, stealth, cost), Advanced rules.
      Rulings (user, 2026-10-07): damage modifiers apply in the order the books list them (Clear terrain TW
      p.216, mechanized TW p.217, armor divisor TO:AUE p.129); a platoon whose armor keeps it from Anti-'Mech
      attacks gets no weight, cost or skill from its kits until the armor comes off, and reads the 5 column;
      armor cost before the multipliers stands; Battle Value stays the book's (TM p.309) and is looked up by
      rules edition (`getBattleValue(edition)`), so each edition's own method can be added as it is entered;
      the MUL is the source of truth for published cards, and the converter is for unpublished designs.
      Discrepancies noted: the MUL's Foot Platoon (LRM) card shows Armor 1 where 28 troopers convert to 2; MUL
      Battle Values for infantry do not follow TM p.309 (Motorized Platoon, Rifle, Energy: 86 on the MUL, 108
      by the book). Also: an oversized formation converts to Alpha Strike as its first sub-platoon; the Stetta
      auto-pistol's date row is misprinted (TM p.301) and 3010 is taken as its Inner Sphere introduction.
      Not built yet: field guns and field artillery, beast-mounted infantry, specialized infantry (combat
      engineers, marines, paratroops and the rest) and disposable weapons, all Tactical Operations; battle armor,
      which is a unit type of its own.
  - [x] Skill multipliers by rules edition (2026-10-07): `skill-multipliers.ts` is keyed by edition and says
    which unit types read the 5 column. Master Rules p.144 and Master Rules, Revised p.158 share one table
    (skills 0-7; infantry and, in the Revised Edition, ProtoMechs use the 5 column); Total Warfare uses the
    TechManual's p.315 table as printed from 2020 on and repeated in the 2024 Battle Value pages (Gunnery 0 /
    Piloting 0 = 2.42), which the Core Rulebook p.222 also prints; editions before Master Rules have no Battle
    Value system. The app had carried the 2017 "BV 2.1" revision (2.80) cut off at Piloting 5, so skill-adjusted
    Battle Values of 'Mechs, vehicles and fighters change (Gunnery 3 / Piloting 4: 1.38 before, 1.32 now). The
    2007 first printing's table (3.68) is noted in the file, not selectable. Nothing chooses an edition yet:
    every unit takes an optional edition and defaults to Total Warfare until the edition selector is built.
    Not checked: BattleTech Compendium: The Rules of Warfare (1994), added to the library since.
    - [x] Gun emplacement / building (2026-10-07): Building Creator under Tactical Operations: Advanced Rules
      pp.126-131. Classifications and types from the table on p.113 (gun emplacement, fortress, standard, hangar,
      wall, fence, bridge, tent), Construction Factor, size in hexes and levels, internal weight capacity (CF x
      levels; hangars tripled to 600 tons for every 4 levels), armor in full tons (16 points a ton Inner Sphere,
      20 Clan, to CF x 1), Heavy weapons placed hex by hex against the per-hex limit (gun emplacement CF / 3,
      fortress CF / 10 a level), rooftop turrets, heat sinks, power amplifiers, the Power Generators Table
      (p.132), unspecified equipment, minimum gunners and officers (p.130), cost (p.208), saves, backup and a
      record sheet with Armor Factor and CF circles for each hex. Reproduces the book's Kenyon, Tara and Ryana
      examples (pp.128-131).
      Rulings (user, 2026-10-07) on the five items that follow: (1) use the last prices published, the
      TechManual's; (2) and (5) stand as built; (3) a building handles heat as a vehicle does, so its heat sinks
      cover every energy weapon whatever the generator, with none free (TO:AUE p.83); (4) no amplifier for a
      weapon that fires ammunition or for any flamer. As first raised: (1) the cost table (p.208) prices no
      turrets, power amplifiers or heat sinks for
      buildings; the creator charges their TechManual prices (pp.279-280). (2) TO:AR p.129 calls a weapon Heavy
      from 0.25 tons, TO:AUE p.82 from half a ton for Mobile Structures; the building page is followed. (3) With
      a fusion or fission generator the creator asks for no heat sinks and no amplifiers, its reading of TO:AUE
      p.83 ("Mobile Structures without a Fission or Fusion power system must incorporate enough heat sinks").
      (4) Flamers and chemical lasers are left out of the power amplifier weight, as on vehicles; the building
      text says only "energy weapons". (5) A fortress's CF / 10 limit is not rounded; the book gives no rounding.
      The roster, play mode, structural modifications and fittings were added the same day: see "Buildings in
      play", "Building modifications and fittings" and "Buildings, still owed" under Buildings, Gun Emplacements
      and Mobile Structures.
      The Manual's own method (BTM pp.39-40, 83-84, 86: CF 1-150, 1-4 levels, 1-3 hexes, structure of levels x
      hexes x CF / 10 tons, walls of CF / 3 tons, turret armor at 16 points a ton, a power plant rated by energy
      weapon tonnage, the Gun Emplacement Damage Table and the Installation Cost Chart) was read from the page
      images and is not built: it waits for the edition selector, like every other edition's construction rules.
  - [x] BattleTech Compendium (2026-10-07): the Manual's 68 records plus 129 new, read from the page images
    (weapons tables BTC pp.115-116, Advanced Equipment pp.117-122, price list p.129). New: the Clan weapons and
    equipment table (ER and pulse lasers, ER PPC, Gauss rifle, LB-X and Ultra autocannon, Clan LRMs and SRMs,
    Streak SRMs, Narc, Arrow IV, TAG, anti-missile system, active probe, A-Pod, ECM, MASC, targeting computer)
    and the Inner Sphere's 2750 technology (ER large laser, ER PPC, pulse lasers, Gauss rifle, LB 10-X, Ultra
    AC/5, Streak SRM-2, Narc, Arrow IV, TAG, anti-missile system, Beagle, CASE, C3 master and slave, Guardian,
    MASC, hatchet); their ammunition with prices, LB-X cluster, Arrow IV homing, Swarm and Thunder LRMs, Artemis
    missiles; Endo Steel, Ferro-Fibrous and Ferro-Aluminum armor, XL engines, double heat sinks, Triple Strength
    Myomer; the four-legged layout (optional rules, p.56). Changed from the Manual: LRM-15 back to 3 critical
    slots, Vehicle Flamer 0.5 tons with a critical slot, LAMs capped at 55 tons, searchlights on vehicles, smoke
    rounds in the price list. Unchanged: engine and structure tables, cockpit, gyro, standard heat sinks, jump
    jets, standard armor, the lasers, PPC, flamer, machine gun and the Manual's ammunition prices. No 'Mech
    listings; vehicles, infantry, BattleArmor points, fighters, DropShips, JumpShips, OmniMechs, OmniFighters
    and installations named on the edition.
    Corrected as obvious misprints (errata recorded): the Inner Sphere table prints the Beagle Active Probe and
    Artemis IV FCS rows one column to the right; entered as 1.5 tons / 2 slots (range 4) and 1 ton / 1 slot.
    Readings to confirm: (1) the catalogs have no Artemis IV record of its own, so the system's row is added to
    each "launcher + Artemis IV" record (launcher + 1 ton, + 1 slot, + 100,000); (2) single-shot launchers are
    entered for LRMs and SRMs only (standard launcher + 0.5 tons, half price), with no critical slots because
    none are printed; single-shot Streak, Narc and Artemis launchers are allowed by the text but not entered;
    (3) "2 x normal" ammunition is entered as 60,000 (LRM) and 54,000 (SRM) a ton; (4) the Smoke Round price
    row reads "= Conventional" and no figure is entered; (5) the Clan Active Probe and Clan ECM Suite have no
    price row of their own (only "Beagle" and "Guardian" are priced) and are left unpriced; (6) Clan CASE has
    no catalog record and is listed under the edition's `notModelled`; (7) the Clan Arrow IV FASCAM round is
    entered with no shots or price, since none are printed; (8) the Thumper still outranges the Sniper (14
    mapsheets to 12) on three tables, kept as printed; (9) "AC/20 type weapons" may split their critical slots
    between adjacent locations (p.113), read as covering the Clan LB 20-X and Ultra AC/20. Engine, gyro and cockpit boxes on the record sheet were
    not re-read and stay inherited. The Compendium's own construction rules for vehicles, installations and
    fighters (pp.123-127) and its cost formulas (pp.128-131) were read and are not built: they wait for the
    edition selector.
  - [x] BattleTech, Third Edition (FASA 1604, 1992), complete: read from the page images of the box set's
    rulebook (BattleMech Design pp.41-43, Fusion Engine Table and Inner Sphere Weapons Table p.44, the reference
    card, the training scenarios pp.36-39) and its record sheets. An introductory game with the 3025 weapons
    only: flamer, three lasers, PPC, Autocannon/2 to /20, machine gun, LRM-5 to -20, SRM-2 to -6, their
    ammunition, single heat sinks; engine and structure tables, cockpit, gyro, jump jets, armor, the two-legged
    layout and tonnages 10-100 unchanged. Every weapon row matches the Compendium's; the rulebook prints no
    prices, so each weapon, ammunition and the heat sink has its own entry without one. Fourteen 'Mechs;
    no other units; clubs listed as not modelled.
    Readings to confirm: (1) the fourteen filled record sheets in the library's scan are footed "Copyright
    1996", a later printing than the 1992 rulebook and blank sheet; the rulebook names the same fourteen by
    chassis (pp.36-39), and the model codes (LCT-1V, PXH-1 and so on) are taken from those sheets; (2) the
    sheets print a Cost for each 'Mech, not entered, as the rulebook has no prices; (3) records the edition
    does not print (prices) are left out of its entries, not inherited from the Compendium.
  - [x] BattleTech, Fourth Edition (FASA, 1996), complete: read from the page images of the box set's rulebook
    (Construction pp.40-44, Weapons and Equipment Table p.45, Equipment p.46, scenarios pp.35-39). The Third
    Edition's seventeen weapons, row for row, with three additions: the hatchet (tonnage / 5 damage, tonnage /
    15 tons and slots), the Flamer (Vehicle) (0.5 tons, 1 slot, 20 shots) and single-shot LRM and SRM launchers
    (launcher + 0.5 tons). Engine and structure tables, cockpit, gyro, jump jets, armor, layout and tonnages
    unchanged; no prices; BattleMechs only.
    Readings to confirm: (1) the box has 24 'Mech designs (p.5) but its record sheet book and Introduction to
    BattleTech book are not in the library; the 20 the rulebook's scenarios name are listed, the Assassin
    without a model code, and the missing four are noted on the edition; (2) the contents page puts Equipment
    on p.47, the section is printed on p.46 and is cited so; (3) single-shot launchers have no table row, so no
    critical slots are entered; (4) the Flamer (Vehicle) sits under Ballistic Weapons on the 'Mech table and is
    entered on the existing vehicle flamer record.
  - [x] BattleTech Master Rules (FASA 1707, 1998), complete: read from the page images (Construction
    pp.109-120, Weapons and Equipment Tables pp.115-117, Equipment pp.122-135, Costs pp.136-138, Artillery
    pp.68-71, special cases pp.75-81). 286 entries: 263 records in the edition, 95 of them new to it. New against
    the Compendium: Inner Sphere ER medium and small lasers, Light Gauss, LB 2-X/5-X/20-X, Ultra AC/2, /10 and
    /20, MRMs, Streak SRM 4 and 6, the sword and A-Pods; Clan heavy lasers, ER micro and micro pulse lasers,
    heavy and light machine guns, Light TAG and the Light Active Probe; torpedo launchers; single-shot MRM,
    Narc, Streak and torpedo launchers; fragmentation, incendiary, semi-guided, Swarm-I and Narc-capable
    missiles and Narc explosive pods. Gone with the aerospace rules: bombs, Ferro-Aluminum armor, Land-Air
    BattleMechs; BattleMechs now start at 20 tons. Prices are back (one list for both technology bases, p.138).
    Readings to confirm: (1) ferro-fibrous rounding is printed two ways ("up on .5" pp.113, 119; ".5 down"
    p.127); both are recorded, neither chosen; (2) the Clan Heavy Machine Gun prints a dash under Long range,
    entered as a long range of 0 with a note; (3) torpedo launchers and ammunition have no table or price rows,
    so they carry the matching LRM/SRM figures and no price (p.130); (4) single-shot launchers again have no
    critical slots printed; Streak single-shot launchers are entered under "any type of missile weapon" (p.129);
    (5) no records exist for Flare LRMs, Clan CASE or Clan Narc explosive pods, so those are noted on the
    edition; (6) the internal structure entry repeats the table for 20 to 100 tons so the edition has its own.
  - [x] BattleTech Master Rules, Revised Edition (FanPro 35000, 2001), complete. The PDF is born digital: the
    Weapons and Equipment Tables (pp.121-123) and the cost tables (pp.149-151) were read from the page images,
    the prose (Construction pp.115-129, Equipment pp.130-148, Artillery pp.73-77) from its typeset text. 331
    entries: 308 records in the edition, 45 of them new to it; every Master Rules record is kept and every old
    table row and price is reprinted unchanged (test-enforced). New: Heavy Gauss Rifle, Rotary AC/2 and /5,
    Improved Narc Launcher and its five pods, Rocket Launchers 10/15/20, Improved C3 Computer, the Inner Sphere
    targeting computer, ATM 3/6/9/12 with ER and HE loads, armor-piercing, flechette and precision autocannon
    ammunition, Thunder-Augmented/-Inferno/-Vibrabomb/-Active LRMs, Arrow IV Inferno-IV and Vibrabomb-IV rounds
    and Inner Sphere FASCAM, light engines and stealth armor. ProtoMechs and a Battle Value System are new to
    the book and are noted on the edition, not modelled.
    Readings to confirm: (1) the Heavy Gauss Rifle prints "25/20/10*" and the text says only that damage drops
    with range; entered as 25 with the short/medium/long reading in the note; (2) single-shot launchers are now
    a closed list (SRMs, MRMs, LRMs, Narc, torpedoes; p.140): Streak single-shot launchers are kept, as SRMs,
    with a note; (3) Inner Sphere Arrow IV FASCAM is entered on the strength of p.76 ("Inner Sphere units may
    use any of the munitions"), though pp.132 and 144 still call FASCAM a Clan round; (4) ATM ER and HE loads
    have no price of their own (one ATM ammunition price, p.151), so they carry none; (5) rocket launchers
    carry no ammunition, and the price list's Ammo Cost is noted as the reload price; (6) no records exist for
    incendiary autocannon ammunition, Flare LRMs, Clan CASE or Clan Narc explosive pods; (7) ferro-fibrous
    rounding is still printed two ways (pp.119, 128 against p.137); (8) battle armor names on the edition are
    the Infantry Costs Table's fifteen, three more than the rules sections describe.
  - [x] BattleTech Compendium: The Rules of Warfare (FASA, 1994), complete: read from the page images of the
    third printing (September 1995), a scan with no text layer. 232 entries: the Weapons and Equipment Tables
    (pp.104-106), prices (pp.123-124), Equipment (pp.112-122), Construction (pp.99-109), Artillery (pp.77-80)
    and Aerospace Support (pp.70-75). Every weapon row and price matches the 1990 Compendium's. Ferro-Aluminum
    armor and Land-Air BattleMechs are gone with the AeroTech rules (p.7); BattleMechs still run from 10 to
    100 tons (p.100). Torpedo launchers (p.121) and Narc-equipped missiles (p.119) first appear here, so 22
    records now start in this edition instead of the Master Rules (six more, the single-shot Streak and Narc
    launchers, start in the 1990 Compendium); the cluster, mine, Arrow IV and TAG ordnance of aerospace support fighters (p.73) starts here too.
    Eight Technical Readout BattleMechs (pp.125-132) are listed on the edition.
    User rulings (2026-10-08): (1) Narc-equipped ammunition costs twice the standard ton, as p.119 says; (2)
    torpedoes take the matching launcher's figures: the only difference is air against water; (3) the Clan
    Active Probe and ECM Suite take the Inner Sphere price (200,000): no errata for this book is in the
    library, and the list prices every shared item once for both technology bases, so the markup is nil; (4)
    the Vehicle Flamer (7,500) and its ammunition (1,000) take MegaMek's prices, which the Master Rules later
    print; (5) the single-shot Streak and Narc launchers are entered, with the discrepancy between "double the
    base cost of the launcher" (p.120) and "Half normal" (p.124) noted and no price; (6) bombs stay one
    record a kind: high-explosive, cluster, inferno, mines, Arrow IV, homing Arrow IV and TAG pod each carry
    the edition; (7) the homing Arrow IV round uses the system's 5 shots a ton; (8) the printing is noted on
    the edition.
    The same single-shot passage is in the 1990 Compendium (BTC p.121), so the six single-shot Streak and Narc
    launchers are entered there as well and start in that edition (user ruling, 2026-10-08); a single-shot
    Narc launcher carries 1 pod.
  - [x] The rules edition selector, BattleMechs (2026-10-08): Step 1 of the Mech Creator has a Rules Edition
    control listing the nine earlier editions, Total Warfare (the default) and the Core Rulebook. The edition is
    saved with the design (`rulesEdition`, absent for Total Warfare, so old saves load unchanged). Under an
    earlier edition the creator offers only that rulebook's chassis types, tonnages, components and equipment,
    with the weight, heat, damage, ranges, critical slots and price it prints; rules levels do not apply, eras
    still do. Edition-only rules applied: Battledroids jump jets at 0.5 tons a point at any weight (BD p.24);
    every heat sink on the critical chart in Battledroids and the Second Edition (BD p.25); the edition's own
    Engine Table (Battledroids' 6.5-ton 170). Changing edition restats mounted equipment and removes nothing;
    Step 1 lists what the new edition does not include.
  - [x] Battledroids construction in full (2026-10-08). The 5-ton chassis (BD p.23: 0.5 tons of structure,
    a 10-rated engine, so Walking MP starts at 2; Step 2 now lists Walking MP up to the engine table's limit).
    Internal structure boxes come from the edition's own table, for every earlier edition (BD p.24).
    Jump jets take no critical box in Battledroids (BD p.25). Printing asks for no rules level under an
    earlier edition. Editions are flagged `noBattleValue` (all seven before the Master Rules) and `noPrices`
    (Battledroids, Second, Third and Fourth Editions): Step 1 and the summary say so, the BV2 figure is shown
    for comparison, and the record sheet prints "Not in this edition" for the cost. The least ammunition an
    edition asks for is checked (`ammoTonsFor`: a ton for each launcher or ballistic weapon, BD p.25; a ton
    for each class from the Third Edition on, read as each group of weapons sharing ammunition) and shown in
    Steps 1 and 5.
  - [x] Battledroids in play (2026-10-08). The tanks, jeeps and infantry squads of Expert Battledroids (BD
    pp.22-23) are seven fixed designs (`battledroids-units.ts`, `BattledroidsUnit`): added to a roster group
    from a list, with a play panel (movement points, shots, hits located on the Tank Hit Locations table by
    the players' dice or the app's), a record sheet and a place in the printed roster. A 'Mech built under
    Battledroids plays by its rules where play mode works something out (`playRules` on the edition): heat for
    moving (walk 0, run 1, 1 a hex jumped, BD p.12), the Movement Modifiers Table ending at +3 (BD p.5), no
    modifier for a second target. The play screen carries the Advanced and Expert tables as a reference panel
    (`battledroids-rules.ts`). Fixed for every edition: the minimum range modifier was one short ([minimum] -
    [range] + 1, TW p.118), and a target's Other Mods can now be negative.
  - [x] Battledroids readings (1) to (6) below: confirmed by the user 2026-10-08. What play mode leaves to the
    players stays with them, with the rules in the reference panel (Heat Scale, Ammunition Explosions, Line
    Of Sight And Firing Arcs, Critical Hits).
  - [x] Battledroids, readings: (1) a jeep "can withstand 5 points of damage" and "any
    hit that does more than 5 damage points kills" it (BD p.22): entered as destroyed by the sixth point,
    however the points arrive; (2) "every tank has ... 5 points of turret armor", though the Scorpion and the
    Hunter have no turret: all three track turret armor, as printed; (3) no modifier for a second target,
    because the weapon attack rules name none.
  - [x] Battledroids, the rest of play (2026-10-08). The Basic game (BD pp.3-6): the ten droids' statistics,
    the Range, Armor Penetration and Damage Effects tables, and a panel that works a shot out and rolls it
    (`battledroids-basic-game.ts`). For a 'Mech built under Battledroids: a critical hit roll in the critical
    hit dialog (7 or more, the line picked by the dice and marked, BD p.18), and a helper with the Heat
    Scale's effects at its heat, physical attack damage, Piloting Skill Rolls and falls (BD pp.11-15). The
    reference panel gained the optional woods and fire rules (BD p.21). For every edition: the Heat Scale's
    fire modifier is now in the to-hit numbers (+1 at 8, +2 at 13, +3 at 17, +4 at 24).
  - [x] Battledroids, more readings: (4) the Basic Game Statistics table and the
    worked example on the same page disagree (Crusader Armor 10 against 13, Warhammer medium Damage 16
    against 15, BD p.6): the table is entered; (5) the Armor Penetration Table starts at Armor Value 5, and a
    Stinger or Wasp hit from behind has 4 or 3: the 5 column is used and the panel says so; (6) falling damage
    rounds a tonnage that is not a multiple of 10 up, as a punch does (BD p.15 is silent).
  - [x] Battledroids, left to the players by the user's choice (2026-10-08): the effects of a critical hit once marked (MP, to-hit and heat
    changes from destroyed actuators, sensors, engine and heat sinks), ammunition explosions, the Heat Scale's
    MP loss, shutdown and avoid rolls (shown by the helper, not applied), and line of sight.
  - [ ] Rules edition selector, still to do: (1) the Master Rules' own Battle Value system and each edition's
    cost rules are not built, so the editions that have them still show the current rules' figures; (2) the
    Internal Combustion Engine is offered to BattleMechs under the editions that list it, though the
    BattleTech Manual gives it to vehicles only (BTM pp.78-84); (3) play mode follows an edition's own rules
    for Battledroids only, and the other creators (vehicles, fighters, infantry, buildings) do not read the
    edition; (4) the missile damage per missile and
    shots per ton an edition prints are not applied (none differs from the catalog today).
  - [ ] Wanted for the library: the Fourth Edition record sheet book and Introduction to BattleTech book; a
    1992 printing of the Third Edition's record sheet book (the scan's sheets are dated 1996).
  - [ ] Model the Core Rulebook's changes to the Total Warfare rules (CRB p.247 describes their scope).
- [ ] `refactor/catalog-by-category`: step 1 done, every equipment record states
  `techBase` (commit c959dbc8). Review the 62 custom records, whose tech base was set from tag and name. Next:
  move records into `<category>-canon.ts` / `-apocryphal.ts` / `-custom.ts` / `-munchkin.ts`, one category per
  commit, registry and tests following; then the component catalogs (engines, structure, armor, cockpits).
- [ ] 1.6 `security/sanitizer-hardening`: decided 2026-10-06: keep the strict whitelist on the normal path and run
  DOMPurify only on the reviewed `raw` sites. JBTIICRework's DOMPurify swap drops the strict tag
  whitelist on the non-raw path and breaks `security-guards.test.ts`.
- [ ] Catalog rework: one catalog per category (Energy, Ballistic, Missile, Melee incl. Shields, Electronics,
  Engines, Structure, Myomer, Armor, Cockpits, ...) holding IS, Clan and universal entries, split by rules level:
  0-4 canon, 5 Apocryphal, 6 Custom Homebrew (balanced), 7 Munchkin (cheese). Custom moves from 5 to 6.
- [ ] Manufacturers: an entry-level array on every catalog record, shown on the tabletop record sheet when the
  user turns the option on. Brand data needs a source per entry.
- [ ] 3.2 The background import still parses all 512 bundled 'Mechs on every launch; precompile them to
  lightweight descriptors or parse on demand.
- [ ] 1.5 Remove the CRA `serviceWorker.ts` boilerplate or replace it with `vite-plugin-pwa`.
- [ ] 3.4 Measure before batching the 44 MUL chunk loads; 3.5 replace hot-path `JSON.parse(JSON.stringify())`
  clones; 3.6 split `src/utils.ts`; 3.7 `appGlobals` re-renders; 3.8 trim the Bootstrap CSS; 3.9 replace
  `process.env.PUBLIC_URL`.

Not doing:
- 1.2 Firebase data loss: not reachable. The storage selector in Settings is commented out and
  `storageLocation` is never read from saved settings.
- 2.1, 2.3, 2.6: caused by, or specific to, the AI Studio export.
- 3.10 Removing `jdgAnalytics.ts`: Jeff's attribution stays.
- JBTIICRework's `src/classes/battlemech/` and `src/classes/vehicle/` folders: copies nothing calls, with types
  that have already drifted (6 type errors). Do the extraction in section 4 instead.
