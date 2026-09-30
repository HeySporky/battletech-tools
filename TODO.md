# Product Roadmap

Open work for growing Jeff's BattleTech Tools from a BattleMech and vehicle creator into a full BattleTech
construction, import/export and record-management tool. Sections are in priority order: fix what ships
first, then make imports reliable, then check the data against the books, then add unit domains.
Completed work is in the git history, not here.

Local references (git-ignored, never imported by shipped code):

- `_KNOWLEDGE_DEV/rulebooks/`: text extracts of TechManual, Total Warfare, Tactical Operations (original
  single volume) and Interstellar Operations (2016, with PDF). IO printed page = PDF page - 2.
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

- [ ] `tools/mul-sync/browser-state.json` (session cookies, including `cf_clearance`) is now untracked and
  ignored on master, and the weekly sync no longer commits it (ngcfells/battletech-tools#7). The `MUL` branch
  is retired. Still to decide: whether to purge the old copies from the history.
- [ ] Report the SSW ammunition bug upstream (issue + PR). The ammunition catalog rename (`Ammo (SRM-6)` ->
  `SRM - Standard Ammo`, upstream #75) broke name matching in the SSW importer: 413 of the 512 bundled
  'Mechs lost their ammunition on import, on upstream's live site too. Fixed here by the SSW name resolver
  (`src/utils/sswEquipmentNames.ts`).
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
- [ ] One equipment-name bridge for every format. MegaMek's equipment classes list each item's internal
  name and lookup names (the names MTF, BLK, HMP and older SSW files use); `name_changes.txt` in the MegaMek
  data maps renamed units. Generate the mapping as a reviewed data file rather than matching names by hand.
- [ ] Bulk import audits as dev tools (not tests, since the fixtures stay in `_DEV`): run every sample file
  of a format through its importer and report crashes, unknown equipment, unplaced criticals, and BV/cost
  against the value stored in the file.

### Solaris Skunk Werks (`.ssw`)

The SSW audit (every design in `WorkingData_DEV/SSWdata` through `importSSWXML`) found the importer handled
only the bundled 3039/3050 Inner Sphere set. Fixed in this pass: Clan items (the `(CL)` prefix), Clan designs'
unprefixed items (looked up in the IS list), and ammunition names (resolved through the launcher they
feed).

Audit on 2026-09-29, the 2,846 designs outside the bundled set: 1,780 of the 2,610 BattleMechs import with no
errors (433 before these fixes), 828 still drop some equipment (155 distinct names), 358 leave criticals
unplaced, 2 change on a JSON save/load, and 350 match SSW's BV exactly (805 within 2%). Of the 512 bundled
designs, 44 still report errors (421 before).

- [ ] Unplaced criticals: jump jets (822 across the designs), heat sinks (251), ferro-fibrous (128),
  ER lasers, ECM, C3i. Compare the SSW placements with our allocation (the earlier list of 12 bundled
  designs: ANH-3A, AWS-10KM, CTF-5D, CGR-KMZ, CLNT-6S, FS9-B, JR7-C2, CRK-5003-CJ, PNT-14S, WTH-3, WTH-K,
  "Grinner" Wolfhound IIC).
- [ ] Ammunition names the resolver can't place yet, by munition wording: MML (`Ammo (MML-5 (SRM))`,
  `(LRM)`, `(LRM Artemis IV Capable)`), ATM (`(ER)`, `(HE)`), Narc/iNarc `(Homing)`, Arrow IV `(Homing)` /
  `(Non-Homing)`, ELRM, Hyper-Assault Gauss, Silver Bullet Gauss, iGauss, ProtoMech AC.
- [ ] Equipment names with no catalog match: Hyper Assault Gauss 20/30/40 (naming), Variable Speed Pulse
  Lasers, Re-engineered (R-e) lasers, Coolant Pod, Claws, B-Pod, M-Pod, Laser Anti-Missile System, C3
  Boosted Computer (Slave), Modular Armor, `ER PPC + PPC Capacitor` combos, MG Arrays (`MG Array (3 Machine
  Gun)`), Electronic Warfare Equipment, Collapsible Command Module, prototype `CP` weapons, ProtoMech ACs on
  'Mechs, Arrow IV Missile. Some need catalog records (see section 6), the rest only names.
- [ ] The audit harness was a throwaway test; add it as a dev tool (`tools/`) so it can be rerun.
- [ ] IndustrialMechs and Primitive BattleMechs/IndustrialMechs are skipped entirely (234 designs):
  `importSSWXML` only accepts `mech_type` "BattleMech".
- [ ] Two OmniMech files fail to parse (`Summoner (Thor)`, `Puma (Adder)` with `model=""`:
  "readTagExp returned undefined").
- [ ] OmniMech configurations: SSW stores every loadout in one file; import them as our OmniMech
  configurations instead of only the base loadout.
- [ ] Runtime importer: import any `.ssw` file from the UI (not only the bundled `sswMechs.ts` generated at
  build time), with the import review screen.
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
- [ ] Books still needed locally for that check: Tactical Operations: Advanced Units & Equipment and
  Advanced Rules (our text is the original single-volume TO), Interstellar Operations: Alpha Strike
  Edition, Strategic Operations, the current aerospace construction rules, Campaign Operations, and the
  Alpha Strike Commander's Edition. Record which edition each extract is.
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

## 8. Runtime and tooling

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
