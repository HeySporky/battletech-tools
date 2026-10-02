# Product Roadmap

Open work for growing Jeff's BattleTech Tools from a BattleMech and vehicle creator into a full BattleTech
construction, import/export and record-management tool. Sections are in priority order: fix what ships
first, then make imports reliable, then check the data against the books, then add unit domains.
Items finished in the current pass are checked off; older completed work is in the git history.

Local references (git-ignored, never imported by shipped code):

- `_KNOWLEDGE_DEV/rulebooks/`: the rulebook library, 38 PDFs with text extracts (TW, TM, TO:AR, TO:AUE,
  SO:AA, IO, IO:AE, IO:BF, CO, ASCE, AS, ASC, the Core Rulebook, box sets and errata). `INDEX.md` there lists
  editions, page offsets (printed page = PDF page - offset) and which errata applies to which printing.
  - [x] The two scanned Aces books (rulebook, Scouring Sands campaign book) OCR'd into `text/*.ocr.txt`
    (`ocr_rulebooks.py`, Tesseract 5.4); body text reads well, flowcharts and icons don't.
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

- [x] `tools/mul-sync/browser-state.json` (masterunitlist.battletech.com session cookies, including
  `cf_clearance`) is untracked and git-ignored, and the weekly sync no longer commits it; CI runs start
  without saved cookies. Merged 2026-09-30.
- [x] Purge the old copies of `browser-state.json` from the history: rewritten and force-pushed on
  2026-09-30 (`master`, `CustomMUL`, `vehicle-motive-types`; unrelated branches kept their commit IDs). The
  cookies were anonymous (`_I_`, `cf_clearance`) and can't be revoked; they expire by 2027-09.
- [ ] Ask GitHub Support to drop the cached views of the old commits and the fork PR #8 ref (a "Remove
  sensitive data" request listing the old commit IDs).
- [x] Report the SSW ammunition bug upstream. The ammunition catalog rename (`Ammo (SRM-6)` ->
  `SRM - Standard Ammo`, upstream #75) broke name matching in the SSW importer: 413 of the 512 bundled
  'Mechs lost their ammunition on import, on upstream's live site too. Upstream PR #91 (open), reworked on
  2026-09-30 to resolve names through the catalog records' `altNames` (`src/utils/importedEquipment.ts`).
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
  interchange format.
- [ ] Keep provenance on imported records: source file, source format, source book, and conversion warnings.
- [ ] Import review screen: parsed fields, unmapped fields, warnings, provenance, and the final canonical
  record before saving.
- [x] One equipment-name lookup for every format: `findImportedEquipment(name, faction, mixedTech)` in
  `src/utils/importedEquipment.ts`. It checks the faction catalog and the universal catalog by own name/tag,
  then the universal catalog, faction catalog, other faction (Mixed Tech only) and custom catalogs by
  `alternateName`/`altNames`/`altTags`. A format's spellings go on the records, never as name rewriting.
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
- [x] Ammunition names: MML, ATM ER/HE, Narc/iNarc, Arrow IV, ELRM, Hyper-Assault Gauss, Silver Bullet
  Gauss, iGauss, ProtoMech AC, torpedo and the rest now resolve through `altNames`.
- [x] Equipment names: HAG, VSP and R-e lasers, Claws, C3 Boosted, MG Arrays, `CP` prototypes, Arrow IV
  Missile, Clan TM names, (iOS) launchers, Clan Streak LRM.
- [x] Chassis components (2026-09-30): the importer matched SSW's engine and gyro names against our display
  names, fell back to Standard, never read `<structure>` or `<cockpit>`, and mapped armor, heat sinks and jump
  jets by substring. 254 of the 512 bundled designs imported with a Standard engine, gyro or structure (XL and
  Light engines, Endo-Steel, XL/Heavy-Duty gyros). SSW spellings are now `altNames` on the component records;
  SSW's `techbase` attribute picks the Inner Sphere or Clan XL/XXL engine; structure criticals are placed;
  Small Cockpits import; unknown names go into `sswImportErrors`.
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
- [x] The audit harness was a throwaway test; add it as a dev tool so it can be rerun. Done 2026-09-30:
  `src/utils/ssw-corpus-audit.test.ts`, skipped unless `SSW_AUDIT_DIR` is set. Run:
  `SSW_AUDIT_DIR=WorkingData_DEV/SSWdata SSW_AUDIT_OUT=<file> npx vitest run --project unit src/utils/ssw-corpus-audit.test.ts`.
  First run: 3110 BattleMech designs, 2961 with nothing unresolved, 2 parse failures (`model=""` on
  Summoner (Thor) and Puma (Adder)), 38 distinct unresolved names; 246 Primitive/Industrial designs skipped.
- [x] Approve the canon-pending SSW names table, then fill `src/data/ssw/ssw-canon-pending-names.ts`. Approved
  2026-09-30: 36 names, each with book and page; removing an entry is part of adding its catalog record.
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
- [x] Runtime importer: import any `.ssw` file from the UI (not only the bundled `sswMechs.ts` generated at
  build time), with the import review screen. Phase A1 of
  `docs/superpowers/plans/2026-09-30-ssw-runtime-import-custom-content.md`, done 2026-09-30: Mech Creator >
  Imports > "Import your own .ssw files". Unknown items become placeholder drafts saved in this browser
  (`custom-content-local.ts`), and saved designs keep them through a reload.
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
- [ ] BLK parser shared by every other domain, one mapping per unit type as each domain lands: vehicles and
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

- [ ] Suit construction (TechManual): chassis (weight class, PA(L) to Assault, body type), motive systems
  (ground, jump, VTOL, UMU), manipulators, armor bought in points per trooper and kilograms (with stealth
  and mimetic effects), weapons and equipment mounted by location with slot limits, modular weapon
  mounts, anti-'Mech and anti-personnel mounts.
- [ ] Squad/Point setup: trooper count (IS squads of 4-6, Clan Points of 5), per-trooper damage tracking,
  and configurations where troopers differ.
- [ ] Battle Armor record sheet, BV, cost, Alpha Strike conversion; roster/play with swarm and leg attacks
  and mechanized (OmniMech/vehicle) transport. 1,189 BLK samples.

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

- [ ] ProtoMech construction model and editor. Ammunition whose `space.protomech` is `1` uses fractional,
  shot-based tonnage accounting rather than a one-ton bin and consumes no BattleMech-style critical slots;
  the builder allocates shots per mounted weapon and derives mass from the compatible ammunition.
- [ ] ProtoMech armor, including fractional mass, UltraProto armor and Electric Discharge ProtoMech Armor
  (needs a source), kept out of BattleMech armor accounting.
- [ ] ProtoMech-only weapons once their Classic stats are sourced: ProtoMech Streak LRM (per tube;
  workbook heat 1, 0.1/0.1/0.1 per tube) and Fusillade Launcher (workbook heat 0, 0.45/0.3, IATM). Every
  non-ProtoMech `space` slot -1 (test-guarded).

### Small Craft

- [ ] Small Craft as an Aerospace subtype first (decide and record it); split it into its own editor only
  when its transport, crew and capital-scale rules need one. Bays, doors, crew and passengers,
  spheroid/aerodyne.

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

- [ ] Advanced building construction (Tactical Operations pp. 128-131, original edition; map to the current
  Tactical Operations: Advanced Rules pages): Step 1 superstructure (tech base, classification, structure
  type, size and height, Construction Factor), Step 2 armor, Step 3 weapons, heat sinks, equipment and
  control systems (capacity depends on classification and CF), Step 4 record sheet (Structure Record
  Sheet). Advanced Building Classifications, armored buildings and expanded CF rules for play.
- [ ] Mobile Structures (Designing Mobile Structures, TO p. 259): type, Construction Factor, internal weight
  capacity, power and motive systems. Static buildings share its armor, heat sink and weapon rules.
- [ ] Gun emplacements. 106 `advancedbuildings` and the `ge` folder in the MegaMek samples.

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
- [ ] Patchwork armor: per-location armor with each location's own tech base, points per ton, criticals,
  cost and rules-level validation. Don't expose the placeholder aggregate profile until then.
- [ ] Clans' pre-2825 use of Star League Ferro-Fibrous isn't modeled.
- [ ] Colossal 'Mechs: construction and rules (source needed).

### IndustrialMechs and Primitive 'Mechs

- [ ] Make IndustrialMechs buildable (requested 2026-10-01): a chassis choice that gates Industrial /
  Commercial / Heavy Industrial armor (TM p.72, p.206), Industrial structure, IndustrialMech cockpits and
  fire control, engine choices, and the IndustrialMech cost and BV rules. Today only the Industrial
  structure exists; Commercial armor is in the catalog but is not offered to any 'Mech.
- [ ] Make Primitive BattleMechs and Primitive IndustrialMechs buildable (requested 2026-10-01): engine
  rating x1.2, Primitive armor (x0.67), primitive cockpit, and the era window 2439-2520 (IO:AE pp.115-118,
  p.44). The primitive engine and armor records exist; the construction mode does not.
- [ ] Then lift the SSW import skip for these designs (section 2, 234 designs).

### Canon equipment pass: still owed (branch `feature/canon-equipment-pass`, ledger `tools/canon-pass-ledger.md`)

- [x] Special munitions (Batches 12c, 12d, 20, 23): all records dated and cited from IO:AE pp.53-56;
  21 Inner Sphere munitions moved out of the universal ammo catalog; Dead-Fire BV per launcher; the four
  Rotary AC Caseless rounds moved to the custom catalog (TO:AUE p.164). Open: no ProtoMech AC specialty
  rounds exist, though IO:AE p.53 lists them for the PAC.
- [x] Split by tech base (Batch 15): 'Mech Mortars, Artillery Cannons and the Laser Insulator are now
  separate Inner Sphere and Clan records; Modular Armor has a Clan record. The Clan records keep the old
  universal tag in `altTags` so saved designs load.
- [x] Unsourced Clan records (Batch 13): Enhanced ER Large Laser and Enhanced Clan LRM 10 moved to the
  custom catalogs. Still owed: a source search for everything in the custom catalogs, to cite what can
  be cited.
- [ ] Same-book conflicts: the errata were checked (IO v1.21, IO:AE v3.01; Batch 14) and rule on none
  of them, so the catalog still follows MegaMek and each is flagged in the ledger: IO:AE armor BV
  modifiers p.185 vs p.190; primitive cockpit cost p.117 vs p.215; Heat-Dissipating Clan year p.81 vs
  pp.29, 215; Improved Large Laser / Pulse Laser years p.89 vs p.37; Clan claws (3090 as a prototype,
  no production year); primitive prototype missile shots per ton and SRM range (p.112 text vs p.210
  table); TO:AUE p.219 large engine dates vs IO:AE p.38.
- [x] Misc equipment that needed rules support (Batches 37-48): Coolant Pod, RISC Heat Sink Override Kit,
  Prototype Improved Jump Jets, engine requirements for TSEMP and Taser, one Viral Jammer, the cockpit
  selector with IndustrialMech Advanced Fire Control (plain cockpit is the default, as in the book),
  HarJel II / III with their armor BV rule, RISC Laser Pulse Module (six laser records), MRM Apollo FCS
  (and MRM to-hit +1), C3 Remote Sensor Launcher, Collapsible Command Module, Full-Head Ejection System,
  IndustrialMech Ejection Seat, Superheavy IndustrialMech Cockpit and superheavy engine limits.
  Not builder items: the Jump Pack / Drop Pack is external cargo (TO:AUE pp.104-105). Light Active Probe
  [IS] and Light TAG [IS] have no 'Mech-scale stats in the TM Inner Sphere table.
  Open: the cockpit select in step 2 has not been exercised in a browser; Torso-Mounted Cockpit and
  Command Console are not selectable (the Full-Head Ejection System must exclude them when they are).
- [x] Superheavy 'Mechs (IO:AE pp.154-157): large engines (Batch 16), gyro weight and BV (14), equipment
  bans (21), structure table and types (22), half-size critical space (24), Inner Sphere tech base only
  (25), Long Tom on superheavies (29), two tons of ammunition per slot (30). The SHP-4X Omega example
  builds exactly and is a regression test. Not modeled: the superheavy critical hit rules in play (p.154).
- [ ] Domain catalogs. Done (Batches 49-54): `capital-weapons.ts` and `sub-capital-weapons.ts` (never
  'Mech-legal), `aerospace-armor-types.ts` (fighter, DropShip and capital armor), `support-vehicle-armor.ts`
  (BAR 2-10), `protomech-components.ts`, `battle-armor-armor-types.ts`, IndustrialMech armor (Industrial,
  Commercial), and 26 industrial items of TM pp.344-345. Still owed: battle armor chassis, motive systems,
  manipulators and weapons; ProtoMech UMU, engine and structure-point tables; capital missile large-craft
  slot columns (Strategic Operations), Naval C3 and other large-craft systems; the variable-size industrial
  items (Communications Equipment, Dumper, Extended Fuel Tanks, Ladder, Pintle Mount, Power Amplifiers,
  transport bays); Primitive small and large craft armor.
- [x] Placement limits (Batch 55): torso-only, arm-only and one-per-location rules of TM pp.210-249 and the
  Artemis IV all-launchers rule. Not checked: actuator removal for industrial tools and hatchets, vehicle
  placement rules, Artemis V / prototype Artemis.
- [x] The vehicle builder no longer offers equipment with no combat vehicle slot value (Batch 54).
- [ ] For the user to rule on (ledger flags): Tech Rating of capital missiles (TechManual D / E against
  IO:AE E / F; IO:AE used); capital ammunition cost and BV units (per shot or per ton); Dark Age armors on
  IndustrialMechs under Experimental Mixed-Tech rules (not offered); C3 Remote Sensor pods recorded as
  explosive (MegaMek: not); HarJel II / III -1 per slot not removed by CASE (MegaMek: removed).
- [ ] Still owed before the PRs: missile `damageAero` convention, Nail Gun range dash, source search for
  the custom catalogs, Alpha Strike conversions marked unresolved, play-rule items, the import
  "ask the importer" step, review of `tools/spec-c-sources-staging.jsonl`; then prepare (not open) the
  upstream equipment PR and the SSW audit PR.
- [ ] Re-cite the LAM and QuadVee comments in `battlemech.ts` that still give IO (2016) pages (pp.105-196)
  to IO:AE, checking each page.
- [ ] Alpha Strike conversions for the pods added in Batch 9c (B-Pod, M-Pod, Chaff Pod) are marked
  unresolved.
- [x] Newer errata, 'Mech catalogs: TechManual v8.0 and BV sheet v4.1 (Batches 26-28), TO:AUE v7.0 and the
  two IO sheets (14, 17), Total Warfare v11.01 (30), TO:AR v7.0 and SO:AAR v5.0 (34). The TechManual sheets
  for vehicle, ProtoMech, infantry and aerospace BV go with the domain catalogs.
- [x] Statistics audits: IO:AE prototype tables (Batch 14), TechManual tables (Batch 18), TO:AUE tables
  (Batch 19). Not covered: rows the name matcher could not pair (ProtoMech and battle armor weapons,
  capital weapons, industrial items priced per ton) and the special munition statistics (damage,
  rounds per ton, cost).
- [x] `_calcBattleValue` sorted `_equipmentList` in place; it now sorts a copy (Batch 27). The lazy
  refresh after a critical slot move is no longer needed for that reason and can be made direct.
- [ ] Vehicles have no era check on engine types, so large engine dates (Batch 16) apply to 'Mechs only.
- [x] Physical weapon to-hit modifiers (Batch 32, TW p.146 and TO:AUE p.216); one Supercharger per unit
  (Batch 21). Owed: play tracking adds the modifier to a Gunnery roll; physical attacks use Piloting.
- [x] Missing records (Batches 31, 34-36): Vehicular Grenade Launcher, Recon Camera, Primitive Prototype
  Long Tom and torpedo launchers, TSEMP Cannon / One-Shot / RISC Repeating, RISC Viral Jammers, BattleMech
  Taser and ammunition. The Clan ER PPC with Capacitor moved from custom to canon (IO:AE pp.40, 190, 197),
  reversing the 2026-09-28 classification: confirm.
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
- [x] Unit slot columns (Batches 28, 29, 33): ProtoMech, vehicle and aerospace slots follow the TM and
  TO:AUE tables; ProtoMech AC/8 set to the book's 1. Flag: Clan A-Pod prints NA for vehicles on TM p.343
  against 1 on the Inner Sphere row. No records exist for the Support Vehicle items of TM pp.344-345.
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
  Future Wars* fanzine. The fanzine is not in `_KNOWLEDGE_DEV/` yet, so the rules still have to be found
  and read before any design work; nothing is to be reconstructed from memory. Lead: 12 HeavyMetal Pro
  files in `WorkingData_DEV/HMPdata/hmpFiles/FutureWars`. Goes in `mech-custom-*` only, gated by
  `tag: "custom"`, never in canon lists or canon BV/PV math.

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

- [x] **Card content and IP.** None of the card contents is in the rulebook text: 66 Aces cards, 10 Command, 5
  Special Order, 12 Edge Ability, 8 Named Pilot and 12 Asset cards (*Aces SS* p.3). The same goes for the sortie
  story and Waypoint text. Options: (a) ship transcribed card data under the existing data disclaimer, as we do
  for SPAs; (b) a companion mode that shows only structure and procedure, with the player entering the card ID
  from their own box (e.g. Brawler 383) and the card text staying local; (c) a mix: ship the mechanics, never the
  story or Waypoint text. Recommendation: (c). Card mechanics are a local-only data file until approved, and story
  text is referenced by entry ID ("read 02-E") and never reproduced. This decision also settles whether the
  feature is offered upstream.
  *Decided (2026-09-30):* (b) plus one cited sample of each record type. Players type or import their own cards
  and sorties; more official content can be added later if the maintainers want it.
- [ ] **Source gaps.** The card data needs the physical cards or an official PDF; neither is local. Aces cites the
  Alpha Strike Quick-Start Rules (AS:QSR), which aren't local either, so map each AS:QSR reference to its ASCE
  page. Other Aces boxes beyond Scouring Sands: none local; check battletech.com before scoping them.
- [x] **Named Pilot SP threshold table.** Read off the pilot card images on the PDF pages (*Aces* pp.27, 29):
  - Skill 3/2/1/0 at 400/900/1,900/3,400 SP.
  - Edge tokens 1-10 at 0/60/120/200/300/420/560/720/900/1,100 SP.
  - Edge abilities 0-5 at 0/60/180/360/600/900 SP.

  The examples on *Aces* pp.35-36 test it. Encoded in `aces-rules.ts`.
- [x] **Rules variant per game.** Done: `AcesGame.ruleset`, switch on the game setup page. Aces changes several ASCE rules: its own vehicle critical hit table (*Aces* p.4
  says so), infantry and emplacement critical hits are always a Weapon Hit, the "front-loaded" unequal-numbers
  rule, and the campaign's -2 Initiative carry-over. Store a ruleset (`asce` / `aces`) on each game so in-play
  applies the matching table. ASCE stays the default outside Aces games.

### A. Game state and unit queries (`src/classes/`)

- [x] Two-sided game model. `AcesGame` (export v2) holds the automated force (a copy), turn, phase, Initiative
  winner, tokens, commanders, per-unit Aces state, turn limit, Waypoints, objectives, seeded RNG and the log. It is
  versioned and included in backups. The player force stays in `currentASForce`. Original plan: It holds the player force and the automated force, plus the
  turn, phase, Initiative winner, token side, turn track with Waypoints, objectives (Movement/Destroy), and the
  force commanders. It must be versioned, exported and included in the `dataSaves.ts` backups, and existing
  `currentASForce` saves must still load.
- [ ] Per-unit turn state: movement mode used and the TMM it produced (the "movement dice", *Aces* p.15),
  moved/attacked flags, Move First/Last tokens, Forced Withdrawal and Fleeing flags, escaped, mounted-on-transport,
  Force Commander, Named Pilot link, Edge tokens left, and destroyed-by-ammo (needed for salvage).
- [ ] A stable stat-query API for the engine: current and starting MV, TMM (with the battle armor +1, STL and heat
  effects, *Aces* p.9), armor, armor lost, starting armor, structure, damage per range, OV, PV and Size. The
  engine reads these, never the UI.
- [x] Crippled/Forced Withdrawal test (`getAcesCrippledReasons`; Special Order card criteria, *Aces* p.8; ASCE for the canonical wording).
- [x] Alpha Strike to-hit (target number) calculator (`calculateAcesToHit`, UI `_to-hit-calculator.tsx`). Before this, nothing like it existed, and the engine needs it: targets
  at TN 13+ are ignored and the OV rows compare against TN (*Aces* pp.18-19). Modifiers: skill, range, attacker
  and target movement, terrain and cover, IF and spotter, battle armor +1, emplacements, AM, heat and Fire Control
  hits.

### B. Additional Alpha Strike rules (*Aces* pp.3-6, *Aces SS* pp.18-19)

- [x] Indirect Fire (IF#) in the to-hit calculator, with the p.3 example as a test. The judgment calls stay with
  the player. Spotter eligibility (didn't Sprint, hasn't attacked, has LOS, within 42"), modifiers,
  +1 to both attacks when the spotter also fires, one target per spotter, IF0* minimal damage, no OV, and Weapon
  Hits reduce IF. The worked example on *Aces* p.3 (TN 8) becomes a regression test.
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
- [x] "Front-loaded" unequal numbers (p.6), `getAcesFrontLoadedMoveOrder`; tested against the Erin/Ben example: a move-order helper that skips units which can't move (immobile, shut
  down, emplacements, transported infantry). Test it against the 8-vs-5 example.
- [ ] Scouring Sands abilities (*Aces SS* p.19): ECM (12"), FLK, JMPS#, SRCH, TAG, TUR#, alternate munitions.
  Compare each with `alpha-strike-special-abilities.ts` (ASCE wording) and add Aces notes where they differ. Probe
  scan ranges (4" base, LPRB 8", PRB 12", BH 16") apply only to Waypoints (*Aces* p.24).

### C. Automated opponent engine (*Aces* pp.7-21, 38-40)

- [x] Card schema (`src/data/aces-*.ts` if the IP decision allows shipping it; otherwise local-only data).
  - Aces card: deck, role, subtype (Infantry, Hover, JMPS), set icon, card ID, and separate movement and combat
    priorities.
  - Each card has three behavior columns (Aggressive, Balanced, default Cautious), and each column has a condition,
    target Zones or a keyword, filters (can attack after moving, has moved), a color list, a movement mode and
    ranked movement filters.
  - The combat side has Zones, filters and OV rows.
  - Command card: letter A-E, orders by phase, Red/Yellow/Blue priority lists, support orders, emplacement,
    artillery and BSP priorities, and strategy rows leading to the next letter.
  - Special Orders: Forced Withdrawal, Fleeing, Movement Objective (filters 0a-0c), Destroy Objective (default
    stats), Indirect Attacks.
  - Encode conditions and filters as a typed predicate vocabulary (the icon and keyword set, *Aces* pp.9, 40)
    rather than free text, so the engine can evaluate what it can.
- [x] Assisted-resolution design. The app doesn't know the table (positions, LOS, range, cover, arcs), so each
  activation is a step-by-step prompt:
  - The engine settles everything that stat values decide: ideal-color ranking and tie-breaks, OV use, priority
    order, card cycling, command-card changes.
  - It asks the player only the geometric questions, e.g. "Is the ideal Blue (Timber Wolf) within 12" and has it
    moved?" or "Which enemies are within 16"?".
  - When the filters don't settle a choice, it shows the Golden Rule (*Aces* p.14) and hands the choice to the
    player. It never guesses.
- [x] Decks (*Aces* pp.10, 19, 38-39). *Partial:* the default deck by role and subtype, splitting with extras set
  aside, card cycle counting and reshuffle notices are done. The seeded RNG and merged/custom decks are not.
  - Default deck from the unit's role: map `ASMULRoles` to the Aces decks. Subtype by movement type: hover or
    wheeled to the Hover decks, JMPS to Skirmisher (JMPS), infantry to Ambusher (Infantry) (*Aces SS* p.20; *Aces*
    p.39).
  - Deck handling: six-card decks; even splitting with extras set aside; reshuffle the combined cards; merged and
    custom decks.
  - Card cycle: flip after moving, tuck after combat, reshuffle when the top card shows its combat side.
  - A seeded RNG stored with the game, so a reloaded game continues the same way.
- [x] Initiative phase (p.10). *Partial:* the player enters priorities, and tokens override them at 000/1000
  with the holders restricted as p.8 says. The Command-card orders are not automated. Reveal the movement priorities, apply the Command orders (Move First = 000, Move
  Last = 1000, with the units that can't hold a token), then roll or enter both Initiative rolls.
- [x] Movement phase (pp.11-17): activation order. *Partial:* the activation queue (priority, PV ties, FW -500)
  and the front-loaded move order are shown in the tracker. The per-card behavior, target and movement steps are
  still read off the cards.
  - Lowest unmoved priority goes first; ties go to the lowest PV, then the player chooses. Forced Withdrawal adds
    -500. Interleave this with the unequal-numbers helper so the app tells the player when to move their own
    units.
  - Steps: check orders, determine behavior (columns left to right), identify the target (nearest Zone, filters,
    color tie-breaks), filter the movement (none/one/many locations), standstill rules and the 1" nudge, jump "if
    needed", facing checklist, flip the card, record mode and TMM.
  - Also: No Targets in Play, and Movement/Destroy objectives.
- [x] Combat phase (pp.18-20):
  - Units attack in combat-priority order. Target selection skips TN 13+ and destroyed units, and falls back to
    the closest unit.
  - OV decision: never cause a shutdown; no attack at 0 MV from heat; maximum OV if the unit is destroyed this
    phase; non-'Mechs ignore OV.
  - Physical attacks only under the conditions on p.20.
  - Indirect Attacks special order at priority 000: target from the BSP filters, spotter selection, and the
    spotter holds fire when that helps.
  - Then emplacements, artillery (ASCE rules) and Battlefield Support cards, ordered by TN, then damage, and gated
    by the support orders.
- [x] End phase (p.21; campaign order p.32): strategy decision rows pick the next Command card; mark Forced
  Withdrawal.
- [ ] Extras. *Partial:* the non-campaign difficulty PV helper is on the game setup page. Automated allies inside the player's force (p.38); non-campaign difficulty (80%/120% PV, skill ±1
  without recalculating PV, p.38); a quick-reference panel of icons and keywords (back cover, p.40).
- [ ] OPFOR builder in the roster. *Partial:* the automated force is loaded from the current roster or a
  favorite group, with an overridable deck, the Command deck name and card letter, and the commander unit.
  Objectives are not done. build the automated force from the MUL like the player force, assign decks (role
  default, overridable), choose the Commander deck and starting card, designate the commander unit, and define
  objectives.

### D. Campaign rules (*Aces* pp.23-37)

- [x] Campaign save model (`AcesCampaign`, versioned, included in backups):
  - Campaign-level: difficulty, Warchest SP, story keywords (including numbered keywords), sortie history, next
    sortie.
  - Player force roster: PV at Skill 4, wounded, memorial.
  - Named Pilots: callsign, type BM/CV/BA, Skill, Edge, number of Edge abilities, total SP, SP in the three
    allocation columns, MVP count, wounded, abilities learned, campaigns and sorties played.
- [x] Force creation checks (`validateAcesStartingForce`). The MUL era/faction search is not done. 400 PV, at least 8 units, Skill 4.
  - Advanced mode uses the MUL search with the campaign's era and faction (Scouring Sands: Mercenary, ilClan era,
    *Aces SS* p.21).
  - Only BM/BA/CV/CI types. At most two 'Mechs per chassis, never the same variant; at most two identical units of
    any other type.
  - Unspent PV converts to SP at 40 SP per PV.
- [x] Named Pilots (pp.27-28): 2-6 pilots, 150 SP each to allocate, type-locked; hire a replacement for 150 SP.
  Thresholds are sourced (see above).
- [x] Difficulty (p.28): Rookie to Legendary, PV% and SP%. Existing forces add a pilot-SP bracket modifier (p.29);
  the percentages add. Test with the p.29 example: 250 PV at +20% - 10% gives 275 PV.
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
- [x] After-sortie ledger (pp.33-36), in order. Built as the campaign page's sortie form and helpers:
  - Game-end Waypoints, then outcome keywords.
  - Casualties:
    - Salvage roll: 4+ BM, 6+ CV, 8+ BA, 10+ CI.
    - Automatically truly destroyed: an ammo critical hit without CASE, a crash, or an emplacement.
    - Crew roll: 2-3 killed, 4-6 wounded, 7+ unscathed. A Crew Killed or Unit Destroyed critical hit kills the
      crew; Crew Stunned wounds it.
  - Income: objectives x the difficulty SP%.
  - Expenses:
    - Reconnaissance and Waypoints.
    - Rearming: 20 SP per unit, except ENE units and truly destroyed units.
    - Personnel: 100 SP per wounded crew or pilot, 150 SP per new pilot.
    - Repairs: Size x100 destroyed, x60 crippled, x40 structure damage or critical hits, x20 armor only. Non-'Mechs
      count half their Size, and nothing is rounded.
  - Earnings and debt.
  - Pilot shares: the outcome's per-pilot cap; absent pilots get half; KIA get nothing; wounded get a full share.
    MVP gets +20 SP.
  - Purchases at PV x40, sales at PV x20.
  - Next-sortie choice.
  - Regression tests: the p.36 walkthrough (1,800 - 940 = 860 SP; 280 SP to pilots; 980 SP balance) and the p.34
    crippled Size 3 tank (1.5 x 60 = 90 SP).
- [ ] Printables generated by the app: Campaign Log, Player Force Roster, Sortie Log and Named Pilot card, in our
  own layout, not copies of the official sheets.

### E. Scouring Sands content (*Aces SS*)

- [x] Sortie index (00-BattleROM Review, 00-Training Simulator, 01-21) within the IP decision. Done as a page
  index on the rules page (`acesScouringSandsSorties`); full sortie records are player-entered. For each sortie:
  number, name, PV cap, OPFOR (unit, skill, deck, reserve), Command deck and starting card, objectives and SP,
  turn limit, Waypoint placement, and branch choices. Story, Waypoint and outcome text is referenced by entry ID
  only.
- [x] The guided tutorial's stacked deck order (e.g. Brawler 383, 253, 643, 213, 093, 513; *Aces SS* p.5), as a
  scripted first game.
- [ ] Unit availability list for Apolakkia (*Aces SS* p.20). *Partial:* encoded and shown on the rules page; check SP = PV x40. Terrain legend CF values and the
  river and canyon rules (*Aces SS* p.18).
- [ ] Box OPFOR units (Bane 3, Marauder IIC, Thunderbolt IIC, Summoner H, Rifleman C2, Howler, Locust IIC 4, Fulcrum
  Heavy Hover Tank): check that our MUL data has them and that PV and specials match the box cards.

### F. UI in the Alpha Strike section

- [x] Routes under `/alpha-strike/aces/`: an overview page, a solo/co-op game (setup, then the turn wizard), and
  campaigns (list, log, roster, pilots, sortie flow, after-sortie ledger). Add a tile on the Alpha Strike home.
  Domain logic stays in `src/classes` and `src/data`; pages only render and ask questions.
- [ ] Reuse the in-play unit cards and damage tracking for both sides. *Partial:* the automated side uses them;
  the player side uses the roster's in-play view. Show the automated units' priority,
  behavior, target and tokens next to their cards.
- [ ] Phone-first and offline, like the rest of the PWA: no network calls, and the RNG and state persist across
  reloads.

### G. Verification

- [ ] One regression test per rule, named for the rule with its *Aces* page, using the book's worked examples:
  IF p.3; Determine Behavior and Identify Target pp.11-13; Forced Withdrawal priority 625 - 500 = 125, p.16;
  Destroy Objective TMM -4, p.17; BSP ordering p.21; plus the campaign examples above.
- [x] Browser test: set up a small Aces game and play one full turn (initiative, both sides moving, combat, end
  phase), then save, reload and continue.
- [x] Backward compatibility: old AS force saves and backups load unchanged; the new game and campaign records
  round-trip.

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
- [ ] Lint backlog (`npm run lint`, 9 errors, all in fork tooling):
  - `tools/live_mul_browser_probe.mjs`: unused `findChunkEntry` (L38) and `saveChunkIfNeeded` (L65);
    `document` / `HTMLAnchorElement` not defined (L109, L110, L121, L130; browser-context code needs
    browser globals).
  - `tools/mul-sync/sync-mul.mjs`: no `cause` on a rethrown error (L256, `preserve-caught-error`);
    `document` not defined (L403, L409).
