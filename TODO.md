# Product Roadmap

This roadmap describes the work required to grow Jeff's BattleTech Tools from a
BattleMech creator into a broader BattleTech construction and record-management
tool. Items are ordered by dependency, not by product marketing priority.

## Bug Hunt: BattleMech Construction Steps

- [x] Step 1: Fix unit-type display in the right TRO-style block.
  - [x] Tripod is displayed as a Quad. The shared TRO HTML renderer now uses
    the Tripod anatomy and includes the center leg; a regression test verifies
    that Tripods render Center Leg without Quad front/rear leg labels.
  - [x] LAM is displayed as a Quad. The shared TRO HTML renderer now uses the
    Biped/LAM anatomy.
  - [x] Add the requested Rules Level selector so custom equipment can be
    enabled. The selector is present in Step 1 and updates the app settings.
- [x] Step 2: Verify engine availability by era in the Select Engine Type
  field. Availability now checks overlap with the selected era, including
  introductions and Inner Sphere reintroductions during that era. Clan
  technology ignores Inner Sphere extinction dates because retained Clan
  technology may remain available even when obsolete. A regression test covers
  a 20-ton Inner Sphere Star League mech and verifies Standard, XL, ICE, Fuel
  Cell, and Fission are all available.
- [x] Step 4: Fix armor allocation displays in the middle block.
  - [x] Tripod was rendered with the Biped diagram; Step 4 now uses the
    dedicated Tripod armor diagram with the center leg. The Center Leg
    selector is positioned between LL and RL, and the Tripod SVG fills its
    layout box without vertical letterboxing.
  - [x] LAM uses the Biped branch and remains displayed with Biped anatomy.
  - [x] Tripod cockpit and center-leg rules are now represented by the shared
    model; Tripods retain their dedicated armor/internal layouts.
- [x] Step 5: Add an Equipment Catalog selector for All Available, Inner
  Sphere, Clan, and Custom equipment. Catalog provenance is attached by the
  shared BattleMech availability query.
- [ ] Step 6: Fix equipment allocation locations and critical slots.
  - [x] Tripod displays its Center Leg section and critical slots in Step 6.
  - [x] Quad and QuadVee front-leg headers now use their actual front-leg
    critical arrays, so equipment can be allocated there.
  - [x] Tripod uses the Biped-style arm/leg layout plus its Center Leg, which
    matches its anatomy.
  - LAM has the correct base display but is missing critical allocations for
    landing gear, conversion equipment, and other LAM-specific equipment;
    [x] the model now pre-fills the six mandated avionics/landing-gear slots
    and filters prohibited equipment.
  - [x] QuadVee uses Quad anatomy and all four legs reserve their two
    conversion/motive slots; fixed dual-cockpit criticals are also modeled.
  - [x] Add the QuadVee Tracked/Wheeled chassis selection and persist it in
    BattleMech records for later motive-system rules.

### LAM/QuadVee Rules Progress

- [x] LAM jump capability is constrained to 1-3 MP, with Standard Jump Jets
  and a Standard Gyro enforced by the model.
- [x] LAM avionics and landing gear occupy the six mandated critical slots.
- [x] LAM-prohibited equipment is filtered and blocked from allocation.
- [x] QuadVee legs reserve two critical slots each for conversion/motive gear.
- [x] Add QuadVee's fixed 10% conversion/motive tonnage and 4-ton dual cockpit
  accounting.
- [x] Add the QuadVee dual-cockpit Head/Center Torso critical placement.
- [x] Add the shared Tracked versus Wheeled QuadVee Cruise MP calculation;
  Wheeled vehicle mode receives +1 Cruise MP and Tracked does not.
- [x] Add validated transformation-mode state and persistence. LAMs support
  Mech/AirMech/Aerospace; QuadVees support Mech/Vehicle; ordinary BattleMechs
  remain Mech-only.
- [x] Add shared mode capability queries for jump-jet use, physical attacks,
  operational height, and QuadVee motive behavior.
- [x] Connect the motive calculation to transformed Vehicle-mode movement and
  motive-damage resolution in roster/play combat; damaged QuadVee conversion
  gear now reduces Vehicle-mode Cruise MP to 0.
- [x] Combat movement dialog now exposes LAM/QuadVee transformation modes and
  prevents QuadVee Vehicle mode from selecting Jump.
- [x] Correct Quad/QuadVee combat-sheet front-leg IS labels.
- [x] Effective movement now applies a 25% penalty per destroyed leg while
  preserving QuadVee Vehicle-mode motive movement.
- [x] Tripod cockpit, superheavy gyro scaling, no-Omni restriction, prohibited
  physical weapon filter, and one-leg stability behavior are model-enforced.
- [x] Add model-level QuadVee Vehicle-mode gyro redundancy and motive-damage
  queries for combat-play resolution.
- [x] Refactor the generated Quad combat SVG front-leg damage path: the shared
  model now exposes front-leg structure data through the legacy diagram fields
  and remaps generated `la`/`ra` clicks to `fll`/`frl`.
- [x] Add model-level LAM/QuadVee transformed-mode gameplay capabilities:
  mode-specific physical attacks, AirMech attacker modifier, vehicle height,
  hull-down eligibility, jump restrictions, gyro redundancy, and motive damage.
- [x] Add model-level Tripod combat capabilities: 360-degree torso twist,
  -1 PSR modifier, secondary-target modifier exemption, one-leg stability,
  multi-pilot cockpit, and superheavy gyro scaling.
- [x] Trace the shared three-block construction-step layout. Every step page
  has step-selection controls in the left block, user inputs in the middle
  block, and a TRO-style display of the current input in the right block.
  - [x] Determine why the right block does not show the Tripod center leg and
    instead renders Quad information. Each step calls the shared
    `makeTROHTML()` renderer; its previous binary Biped-versus-Quad branch was
    replaced with Biped/LAM, Tripod, and Quad/QuadVee anatomy branches.
    If Quad labels still appear after this fix, the running page is using stale
    build output or a saved record whose `mechType` is not `tripod`.

## Architecture Direction

- [ ] Define a versioned canonical record schema shared by all unit domains.
  - Keep JSON as the canonical persisted format for now.
  - Add a top-level schema version, source metadata, unit domain, and ruleset.
  - Keep importers and exporters as adapters around the canonical model.
  - Do not make the UI or saved files depend directly on SSW, MTF, BLK, HMP, or
    other vendor-specific formats.
- [ ] Split shared concepts from domain-specific concepts.
  - Shared: identity, era, faction, technology base, movement, armor, structure,
    equipment, crew/pilot, rules level, source attribution, and notes.
  - BattleMech: actuators, gyro, engine, heat sinks, internal structure,
    critical slots, armor locations, and Mech construction rules.
  - Vehicle: motive type, vehicle locations, turret, motive systems, crew,
    suspension, and vehicle construction rules.
  - Aerospace: thrust, fuel, heat, aerospace locations, atmospheric/orbital
    movement, and aerospace construction rules.
  - Infantry: squad/platoon organization, personnel, armor, weapons, transport,
    and infantry-specific movement and damage rules.
- [ ] Introduce a unit-domain registry and capability matrix so UI routes,
  equipment legality, record sheets, and importers can select behavior by domain
  instead of checking BattleMech-specific fields throughout the application.
- [ ] Preserve backward compatibility for existing BattleMech JSON exports while
  migrating them into the versioned canonical schema.

## Phase 1: Canonical Equipment

### Current Status

- [x] Versioned canonical BattleMech record envelope and legacy migration
  helpers are implemented and tested.
- [x] Universal catalog support is implemented. An item is universal only
  when Inner Sphere and Clan records have identical name, weight, BattleMech
  slots, damage, and range values.
- [x] Source inventory auditor, local Astech staging worker, and fail-closed
  Ollama guardrails are implemented. Model output cannot write catalog files.
- [x] MegaMek IS/Clan subtree inventory is available as a secondary identity
  and tech-base cross-check. Java weapon class bodies are intentionally not
  treated as authoritative numeric catalog data.
- [x] Alpha Strike lookup staging is available for definite catalog candidates;
  source-backed results remain review-only until their complete mappings are
  independently verified.
- [x] Catalog structural completeness and duplicate-tag tests are implemented.
- [ ] Canonical catalog population is still in progress. Scraped profiles that
  are incomplete, apocryphal, domain-specific, conflicting, or unverified
  remain in review staging and are not promoted automatically.

### Alpha Strike Workbook Review Handoff

- [x] Workbook review Blocks 1-12 are classified and the approved records have
  been promoted into literal owning catalogs. The Block 12 promotion includes
  Clan HAG 20/30/40, Clan ProtoMech AC/2/4/8, Clan RAC/UAC variants, and the
  universal/Clan Nail Gun cleanup.
- [ ] Review and classify the remaining workbook rows in
  `tools/alpha-strike-workbook-review-blocks.md`, then promote only after
  source and tech-base decisions are recorded there.
  - [ ] Block 13, rows 121-130: Ultra AC/5/10/20 (C), Improved AC/2/5/10/20,
    Improved Gauss Rifle, and Prototype LB 2-X/5-X Autocannons.
  - [ ] Block 14, rows 131-140: Prototype LB 20-X, Prototype UAC/2/10/20,
    Chemical Lasers, and ER Pulse Lasers.
  - [ ] Block 15, rows 141-150: Vehicle Flamer (C), Improved Heavy Lasers,
    Prototype ER Lasers, Improved Lasers/Pulse Laser, Improved PPC, and
    Enhanced PPC.
  - [ ] Blocks 16-17, rows 151-170: ER PPC (C), ATM variants, Clan LRM
    Artemis IV/V variants, Clan 'Mech Mortars, and Clan SRM Artemis IV/V
    variants.
  - [ ] Block 18, rows 171-180: remaining Clan SRM variants, Clan Streak
    LRMs, ProtoMech Streak LRM, Fusillade Launcher, and Improved LRM 5.
  - [ ] Block 19, rows 181-190: Improved LRM 5/10/15/20 with standard and
    Artemis IV profiles, plus Improved SRM 2/4.
  - [ ] Block 20, rows 191-199: Improved SRM 4/6, Prototype Streak SRMs, and
    Improved ATM 3/6/9/12.
- [ ] For each block, use the source rows in
  `tools/alpha-strike-workbook-data.json` and record `IS`, `Clan`,
  `Universal`, or `Both (Stats Differ)` in the review ledger before editing
  `src/data/mech-is-equipment-weapons-*.ts`,
  `src/data/mech-clan-equipment-weapons-*.ts`, or
  `src/data/mech-universal-equipment.ts`.
- [ ] Resolve remaining provisional/source gaps separately from classification:
  physical weights and slots absent from workbook rows, Clan alternate-ammo
  variants, specialized torpedo `-T` ammunition, and numeric TOR profiles.
- [x] Normalize all ammo catalogs to the template format: `roundsPerTon` on
  ammo, `shotsPerTon` (published counts) on weapons, ammo families,
  `-standard` tags with IS/Clan prefixes, historical tags kept in `altTags`,
  and bins that count shots for the launcher they feed.
- [x] Tech-base reorganization (IO tech-progression windows): universal only
  when IS and Clan windows are identical; otherwise split into IS and Clan
  records. Star League weapons the Clans fielded until replaced have Clan
  copies with Clan extinction dates (ACs/lasers ~2850, LRM 2830, SRM 2836,
  MG 2826, PPC 2825, SL ER PPC 2860, SL Streak SRM 2 2845).
- [x] Add missing canonical ammunition: Streak SRM (IS/Clan), Streak LRM,
  Extended LRM, Clan LB-X cluster, Arrow IV IS FASCAM/Clan smoke/Vibrabomb-IV,
  artillery Flechette/Illumination/Smoke, Long Tom Davy Crockett-M.
- [x] Every ammunition record feeds a weapon on its own side (test-enforced);
  added IS Narc/iNarc/LRT/SRT and Clan Narc/MG/LMG/HMG/Gauss/Heavy Flamer/Flamer.
- [x] ProtoMech mountability: weapons follow TM rules (IS and Star League
  copies -1); ammunition is -1 unless a ProtoMech-mountable weapon fires it
  (test-enforced).
- [x] A4: IO date audit of every weapon and ammo record (composites use
  launcher ∩ Artemis IV / PPC Capacitor windows), TM/TO stat corrections for
  103 weapons and 84 ammo records, duplicate records merged (IS Ultra/Rotary
  workbook copies, duplicate prototypes), PPC Capacitor records rebuilt,
  Thunderbolts fire a single missile, artillery cannons universal (3079), and
  49 missing canonical munitions added (LRM/SRM/Enhanced LRM/Thunderbolt
  munitions, artillery Fuel-Air, Rotary AC Caseless, ELRM Artemis).
- [ ] Apocryphal hunt: `enhanced_er_ppc`, `enhanced_er_large_laser`, and
  `enhanced_clan_lrm_10` do not match IO's Clan Enhanced PPC / Improved Large
  Laser / Improved LRM statistics; Clan LRM Mag-Pulse ammo has no Clan IO
  window. Decide canon mapping or move to custom.
- [x] Clan "Improved" weapons from IO (Improved AC/2-20, Gauss, LRM 5-20,
  SRM 2-6, Large Pulse, Large Laser, PPC; 2812-2837, reintroduced 3080) with
  their own ammunition (iAC per calibre, iLRM/iSRM families, iGauss); Improved
  Heavy lasers (TO:AUE p.133, explosive). Pages other than the iAC (IO p.96)
  are `page: null` until verified.
- [ ] Verify Improved SRM 4 BV: MegaMek lists 39 (same as the SRM 4) while the
  iSRM 2/6 run a third above their SRMs (28/79); record notes the doubt.
- [ ] Verify whether Improved PPC and Improved AC/20 explode when critically hit
  (MegaMek flags them; no canon source in hand), and whether HAG and AP Gauss
  rifles explode like Gauss rifles (not flagged here).
- [ ] Records with no IO munition data, kept as-is: LRM Incendiary, SRM Tear
  Gas, SRT Harpoon, Vehicle/Heavy Flamer Inferno and Water. Historical tags
  ammo-long-tom-ap, ammo-sniper-ap, ammo-thumper-ap have no canon round.
- [ ] Consider an optional prototype-year field: `introduced` uses the IO
  production year, so experimental prototypes (e.g. artillery cannons
  3012/3032, Bombast 3064) are not available before production.
- [x] Optional `prototype` year on weapons and ammunition (374 records);
  shown in construction only at Experimental/Custom rules level, marked
  "(Prototype)". Equipment extinction now always applies (records carry
  side-specific IS/Clan dates).
- [x] Thunderbolt special munitions moved to custom (no canon source; Sarna:
  no Artemis/Narc). Historical ammo-*-ap artillery tags alias the canon
  Flechette rounds.
- [x] Canon inventory, weapons: 147 'Mech weapons added. 87 one-shot (OS,
  TM p.229-232) and improved one-shot (I-OS, TO:AUE p.139) launchers as full
  records (`isOneShot`, no ammo bins; BV = 1/5 of the standard launcher); Clan
  Improved weapons; AMS (IS/Clan) + ammo, TAG, Light TAG; Clan ER Flamer; Clan
  chemical lasers + ammo; MG Arrays (IS/Clan); HVAC/2-10 + ammo; RISC APDS +
  ammo; Fluid Gun (universal) + ammo; C3 Boosted Master; 21 IO prototypes
  (prototype-only: `introduced: null` + `prototype`, Experimental rules only).
- [x] Weapon wiring: defensive equipment (`battleValueDefensive`: AMS, APDS,
  Laser AMS, ECM, active probes) and AMS ammo now count in the defensive BV (AMS
  ammo capped at AMS BV) and are excluded from offensive BV/heat; explosive
  components (Gauss, Improved Heavy lasers) cost -1 BV per slot and explosive
  ammo -15 (Gauss rifles were charged both, -16/slot); MG Array BV = 0.67 x
  linked MGs in its location (`linkedWeaponTags`); one-shots never take canon
  ammo (custom reload ammo still can).
- [x] Ammo wiring gaps fixed: 30 weapons had no ammo BV (IS AC/5-20, Gauss
  family, MGs, Rotary/Ultra/LB ACs, Plasma Cannon); HAG 20/30/40, ProtoMech
  AC/2-8, AP Gauss, Light/Medium/Heavy Rifle, Nail/Rivet Gun had no ammo records
  at all; Prototype LB 10-X/Gauss/UAC-5 could not load ammo.
- [ ] Weapons still missing (need sources or construction support): M-Pod,
  B-Pod (no stats in hand); BattleMech Taser (book unknown); TSEMP Cannon /
  One-Shot / Repeating; Cruise Missiles 50-120 (TO pp.284-285, with the
  artillery pass); C3 Remote Sensor Launcher; Light/Heavy Plasma Rifle, Light
  Blazer, Kinslaughter H ER PPC, Enhanced LRT, Rocket Launcher 1-5, Clan LRM 1
  (no canon source found yet).
- [ ] Play-mode support for the new weapons: MG Array cluster fire, AMS
  interception with ammo use, TAG designation, chemical laser ammo use, HVAC.
- [ ] Legacy data: base launchers' `battleValueOneShot` values are stale (e.g.
  LRM 10 shows 9; the OS record has 18) and unused by the builder; Clan Arrow IV
  stores range as `maxMapSheets` while IS Arrow IV uses short/medium/long.
- [ ] Verify IS SRM/Streak SRM/SRT I-OS dates: MegaMek gives production 3056,
  whereas LRM/MRM/Narc I-OS are prototype 3056, production 3081.
- [x] Misc equipment batch 1 (56 records): Beagle/Bloodhound/Clan Light probes,
  Angel/Watchdog/Guardian-prototype ECM, C3i, C3 Boosted Slave, C3 Emergency
  Master, CASE-P, CASE II (IS/Clan), A-Pods, MASS, HarJel, Null/Void signature,
  Chameleon LPS, MASC (IS/Clan), Supercharger, Targeting Computer (IS/Clan),
  Chain Whip, Flail, Shields, Spikes, Vibroblades, Mace, Lance, Claw,
  Retractable Blade, and the TM industrial tools. Defensive BV per TM p.302
  (ECM, probes, A-Pods, MASS, bridge layers, spikes, shields).
- [x] Variable-size equipment via `variableFormula` (`src/data/variable-equipment.ts`):
  Hatchet, Sword (now half-ton rounding), Retractable Blade, Mace, Lance, Claw,
  Spikes, MASC, Supercharger, Targeting Computer. TC weapons x1.25 BV; MASC and
  Supercharger boost BV running MP; physical weapon BV x2 with TSM.
- [x] Myomer picker (Standard, TSM, Industrial TSM, Prototype TSM): spread slots,
  cost per ton, BV weight factor (x1.5 / x1.15), saved as `myomer_type`.
- [x] Existing misc record fixes: Clan Active Probe (TM p.204: 200,000, BV 12,
  was 75,000/40), Clan ECM (TM p.213: 1 t, BV 61, was 1.5 t/75), Guardian ECM and
  C3 dates, EW Equipment BV 39 (defensive) and dates.
- [ ] Misc equipment batch 2 (no rulebook ref in the index yet; source each via
  Sarna): EI Interface, DNI, drone OS/console, SRCS, IndustrialMech ejection
  seat, recon camera, remote sensor dispenser, sprayer, Radical Heat Sink
  System, buzzsaw, fluid suction, ladder, laser insulator, vehicular mine
  dispenser, Blue Shield, booby trap, cargo/liquid storage, chaff pod, comms
  equipment, collapsible command module, HarJel II/III, paramedic gear,
  searchlights, ground-mobile HPG, RISC items, Nova CEWS, DIC, LAM bomb bay/fuel.
- [ ] Misc equipment needing spread/location wiring: Partial Wing, Mechanical
  Jump Boosters, UMU, Tracks, QuadVee Wheels, Environmental Sealing, AES (BV
  x1.1/arm, x1.2 legs), turrets, Talons, dumpers, Ram Plate, Blue Shield.
- [ ] Artemis V and Apollo launcher combos (Artemis IV exists as combined
  launcher records); large/medium shields reduce walk MP by 1 (TO:AUE).
- [x] Engine audit vs TM/TO/IO: weight table regenerated from the TM p.49
  standard column (12 wrong values, incl. 100, 390, 425-460) and the type
  multipliers; ICE/Fuel Cell 6 CT slots; Fission IS-only, 7,500 C-bills, IO
  dates; IO production/prototype years for all types; Compact engines no longer
  reset to Standard by the crit allocator; Large engines (>400): x2 cost, +2 CT
  slots, no Compact; engines honor the Experimental prototype rule.
- [x] BV fixes: IS XL engine structure modifier x0.5 (was x0.75); family ammo
  grouped under the weapon it feeds (was silently dropped); per-launcher ammo BV
  (`ammoBattleValue` on 146 weapons) and munition multipliers
  (`battleValueMultiplier`, 32 munitions).
- [x] Alpha Strike structure from the ASC p.98 table (IS XL tag bug fixed; the
  hand-built maps were wrong for XL/Light/XXL); reinforced structure x2.
- [x] Gyros, heat sinks, jump jets, internal structure: IO dates with per-tech
  `clanDates`; XL/Compact/HD gyros IS-only; era-aware heat sink and structure
  pickers; structure costs per TM (Endo 1,600, Reinforced 6,400, Endo-Composite
  3,200, Industrial 300). Vehicles: x1.5 fusion/fission shielding.
- [x] Armor audit (TM p.205-206, TO:AUE pp.92-94, IO:AE pp.80-81): IO production
  vs prototype dates (Hardened 3081, Reflective 3080, Reactive 3081,
  Ferro-Lamellor 3109, Ballistic-Reinforced 3131), per-tech `clanDates` (Clan
  Ferro-Fibrous 2825), Reactive 14/7 slots and 30,000, Ferro-Lamellor 35,000,
  Ballistic-Reinforced IS-only x0.75 and 25,000, Primitive x0.67 and 2290;
  added Ferro-Fibrous Prototype, Heat-Dissipating, Impact-Resistant,
  Anti-Penetrative Ablation; armor BV modifiers (`bvMultiplier`: Hardened 2,
  Reactive/Reflective/Ballistic-Reinforced 1.5, Ferro-Lamellor/APA 1.2,
  Heat-Dissipating 1.1); Mimetic marked battle-armor only (FM:ComStar p.147).
  Armor picker honors the rules level and shows prototypes.
- [x] Structure: Composite (TO:AUE p.154, IS-only); weights now round up to the
  half ton with correct factors (Industrial 20%, Composite 5%, tripods x1.1);
  structure BV modifiers (Industrial/Composite 0.5, Reinforced 2, was only
  Industrial); structure changes now recalculate the unit.
- [x] Gyro weight rounds to the half ton (XL 250 = 1.5 t, was 2); unknown gyro
  names no longer reset the engine.
- [x] Heat sinks: Laser (Clan, TO:AUE p.129), Double Heat Sink Prototype
  (IO:AE p.65) and Freezers (IO:AE p.96, prototype-only); BV heat pool, cost
  and names come from the heat sink record (`dissipation`, `freeSinks`).
- [x] Jump jets: type picker (Improved JJ), jump MP capped at walk (run for
  Improved), saved as `jump_jet_type`; BV movement heat = max(running, jumping)
  with XXL (run 6, jump 2/MP min 6) and Improved JJ (half MP) rules.
- [x] Large engines (rating > 400) offered only at the Experimental rules level.
- [x] Vehicle suspension factor (Hover/Wheeled/VTOL/WiGE/Naval) subtracted from
  the engine rating. Naval over 300 t uses MegaMek's formula, unverified.
- [x] Minefield munition BV (Thunder, Augmented, Active, Vibrabomb, Inferno,
  FASCAM; TO:AUE pp.185, 197-198) via `minefieldBattleValue`; munitions with
  fewer rounds per ton than their family's standard round now get
  proportionally fewer shots (Thunder-Augmented LRM 20: 3, was 6).
- [x] Compact heat sinks (TO:AUE p.128): 1.5 t each, two per slot, engine holds
  floor(rating/25) x 2.
- [ ] Construction gaps still open:
  primitive fusion engine dates unsourced; special armor play effects
  (Reactive/Reflective damage, Hardened, Heat-Dissipating) not modelled in play;
  Clans' pre-2825 use of Star League Ferro-Fibrous not modelled; artillery
  Thunder/FASCAM ammo BV not checked against the rack-size formulas;
  IndustrialMech armor (Industrial/Heavy Industrial/Commercial) not audited.
- [ ] Calculation engines to update for the new data model: cost, record
  sheet, and Alpha Strike conversion to consume roundsPerTon/shotsPerTon,
  prototype, and composite records.
- [ ] Keep the literal-object rule: do not add generated supplemental imports;
  promote approved records directly into their owning catalog files.
- [ ] Last validated catalog baseline: `npm test` passes 40 tests,
  `npm run lint` passes, and `git diff --check` passes after Block 12.

- [ ] Inventory all current equipment lists against the current rulebooks and
  identify missing, duplicate, renamed, and obsolete entries.
- [ ] Populate complete canon equipment catalogs before adding every unit domain.
  - Inner Sphere and Clan weapons.
  - Ballistic, energy, missile, ammunition, physical, electronics, armor,
    engines, gyros, heat sinks, cockpits, movement systems, and support gear.
  - Equipment shared by Mechs, vehicles, aerospace, DropShips, WarShips, and
    infantry should be represented once with domain legality metadata.
- [x] Add the domain-neutral equipment metadata contract for domain legality,
  tech base, rules level, source attribution, and ammunition compatibility.
  Legacy records remain incrementally migratable into this optional metadata.
- [x] Add catalog completeness tests and duplicate-tag/name tests.

## Phase 1b: Wire in construction mechanics and rules for Colossal Mechs

## Specialized Armor Construction

- [ ] Implement Patchwork Armor as per-location armor selection with each
  location's own technology base, points-per-ton, critical requirements, cost,
  and rules-level validation. Do not expose the placeholder aggregate profile
  until location-level accounting exists.
- [ ] Add a dedicated Battle Armor construction model. Battle Armor purchases
  armor by points per trooper and kilograms rather than BattleMech armor tons or
  critical slots; its stealth and mimetic profiles require separate effects.
- [ ] Add ProtoMech armor construction, including fractional mass and future
  source verification for UltraProto armor and Electric Discharge ProtoMech
  Armor. Keep these rules out of BattleMech armor accounting.

## Phase 2: Conventional Vehicles

- [x] Define the vehicle domain model and vehicle location/damage schema.
  (`src/classes/vehicle.ts`, `src/data/vehicle-motive-types.ts` - reuses the
  BattleMech engine/armor/heat sink/equipment catalogs. Internal Structure
  Table (1 pt/10 tons/location incl. turret) and armor caps (2x structure)
  are implemented; per-motive-type engine efficiency modifiers still TODO.)
- [x] Build the vehicle construction editor and record sheet.
  (`src/ui/pages/classic-battletech/vehicle-creator/` has Step 1 Chassis,
  Step 2 Armor Allocation, Step 3 Equipment Selection, Step 4 Equipment
  Placement, a weights/Alpha Strike summary page, and a printable record
  sheet (`record-sheet.tsx` + `svg/tracked-vehicle-diagram-svg.tsx`), all
  wired into routing and save/load. The diagram is a hand-built schematic
  (no internet access was available to source official record sheet
  artwork) - front/left/right/rear/turret boxes with structure/armor pip
  bubbles reusing the shared `DamageCircleSVG` component. Not yet
  interactive/damage-trackable in Play mode like the 'Mech roster.)
- [x] Wire the Tracked category end to end: a "Your Saved Vehicles" roster on
  the vehicle-creator home page (New/Save As New/Load/Save Over/Delete),
  matching the 'Mech creator's list management, plus `vehicleSaves`/
  `saveVehicleSaves` in `app-router.tsx`/`dataSaves.ts` and inclusion in
  `IFullBackup`/`restoreFullBackup`. Tracked vehicles can now be built,
  saved, reloaded, and printed end to end.
- [ ] Implement remaining vehicle categories (construction math is generic
  across motive types already; each needs its own record-sheet diagram and
  category-specific rule verification):
  - Hover.
  - Wheeled.
  - VTOL.
  - WiGE.
  - Submarine.
  - Surface naval.
- [ ] Implement category-specific rules: motive systems, turret arcs, motive
  damage, flotation/submergence, VTOL crash behavior, and vehicle crews.
- [ ] Add Alpha Strike conversion for each vehicle category.
- [ ] Add browser tests covering creation, equipment legality, record rendering,
  and Alpha Strike output for every category.

## Phase 2b: ProtoMechs

- [ ] Define the ProtoMech construction model and editor. Ammunition whose
  `space.protomech` is `1` uses fractional, shot-based tonnage accounting rather
  than a one-ton bin, and must not consume BattleMech-style critical slots. The
  builder must let the user allocate the number of shots for each mounted weapon
  and derive mass from that weapon's compatible ammunition.

## Phase 3: Aerospace

- [ ] Define aerospace unit data and construction rules separately from ground
  vehicles.
- [ ] Add conventional fighters.
- [ ] Add aerospace fighters.
- [ ] Decide whether Small Craft belongs in the Aerospace editor as a subtype or
  requires a separate construction domain. Recommendation: start as an
  Aerospace subtype, then split only when its transport, crew, and capital-scale
  rules require a distinct editor.
- [ ] Add atmospheric/orbital movement, thrust, fuel, heat, aerospace criticals,
  and air-to-air/air-to-ground record layouts.
- [ ] Add Alpha Strike conversion and aerospace-specific validation tests.

## Phase 4: Capital Aerospace

- [ ] Define DropShip construction and record data.
- [ ] Define JumpShip construction and record data.
- [ ] Define WarShip construction and record data using the current AeroTech 2
  ruleset and verify the current rulebook/version before implementation.
- [ ] Model capital weapons, bays, arcs, docking/transport capacity, drives,
  crew, and capital-scale record sheets.
- [ ] Keep capital aerospace as a separate domain from tactical aerospace while
  reusing the shared canonical equipment and source models.

## Phase 5: Infantry

- [ ] Define infantry as a separate unit domain rather than forcing it into the
  BattleMech location model.
- [ ] Add infantry subtypes:
  - Conventional infantry.
  - Battle armor.
  - Jump infantry.
  - Mechanized infantry.
  - Beast-mounted infantry.
  - Paratroops and other transport-capable formations as rules capabilities.
- [ ] Model squads/platoons, personnel, weapons, armor, transport, movement,
  morale, and infantry-specific critical/damage rules.
- [ ] Add Alpha Strike infantry conversion and formation/transport validation.

## Import and Export Adapters

- [ ] Make the canonical JSON format versioned, documented, and stable enough to
  serve as the app's long-term interchange format.
- [ ] Keep vendor/source provenance on imported records, including source file,
  source format, source book, and conversion warnings.
- [ ] SSW: finish the importer as a real runtime adapter, not only the current
  build-time `sswMechs.ts` generator. Support BattleMechs first, then vehicle
  and aerospace records where source data is available.
- [ ] MML: parse `.mtf` and `.blk` files into an intermediate parser model, then
  convert into the canonical schema. Treat `.mtf` and `.blk` as separate parsers
  sharing common field normalization.
- [ ] HeavyMetal Pro: investigate the Hex Binary format and licensing/fixture
  availability before committing engineering time. Recommendation: defer until
  canonical schema and text-based adapters are stable; implement only if users
  can provide legally usable fixtures and the demand justifies maintenance.
- [ ] The Drawing Board: determine whether an official/text export exists before
  attempting a proprietary parser.
- [ ] The Mech Factory: investigate available export formats and terms before
  building an adapter.
- [ ] The Vehicle Factory: investigate available export formats and terms before
  building an adapter.
- [ ] Add an import review screen showing parsed fields, unmapped fields,
  warnings, source provenance, and the final canonical record before saving.
- [ ] Add round-trip tests: source fixture -> canonical JSON -> exported record.

## Immediate Next Steps

- [x] Create the canonical schema/interfaces and version migration helpers.
- [x] Add a domain-neutral equipment catalog metadata model.
- [x] Write the equipment inventory/completeness report. Canon population gaps
  remain explicitly listed there for source verification and promotion.
- [ ] Extract BattleMech construction logic behind the first domain interface
  without changing existing BattleMech behavior.
- [ ] Prototype one vehicle category end to end, recommended order: tracked,
  hover, wheeled, VTOL, WiGE, submarine, surface naval.
- [ ] Add a decision record for Small Craft placement and current AeroTech rules
  version before beginning capital aerospace work.
