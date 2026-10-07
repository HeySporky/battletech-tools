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
  construction rules. Upstream issue #113, fix in PR #114 (branch `fix/internal-structure-table`). Merge it
  into our master when the user says.
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
  - [ ] Next: Compendium (1990). Then Third Edition (1992), Fourth Edition (1996), Master Rules (1998), Master
    Rules Revised (2001), in that order.
  - [ ] Not in the library: BattleTech Compendium: The Rules of Warfare (1994).
  - [ ] Model the Core Rulebook's changes to the Total Warfare rules (CRB p.247 describes their scope).
  - [ ] The selector itself: filter by `isInRulesEdition`, read stats through `getEditionStats`, and decide how
    edition-only rules apply (Battledroids: jump jets 0.5 tons at any weight, every heat sink takes a critical
    box, 5-ton chassis).
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
