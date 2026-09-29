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
- [x] Step 6: Fix equipment allocation locations and critical slots.
  - [x] Tripod displays its Center Leg section and critical slots in Step 6.
  - [x] Quad and QuadVee front-leg headers now use their actual front-leg
    critical arrays, so equipment can be allocated there.
  - [x] Tripod uses the Biped-style arm/leg layout plus its Center Leg, which
    matches its anatomy.
  - [x] LAM has the correct base display and the model pre-fills the six
    mandated avionics/landing-gear slots and filters prohibited equipment.
    Conversion equipment occupies no critical slots; its weight (10% of
    tonnage, rounded up) is now in the weight breakdown. Optional LAM
    equipment (fuel tanks, bomb bays) is tracked below.
  - [x] QuadVee uses Quad anatomy and all four legs reserve their two
    conversion/motive slots; fixed dual-cockpit criticals are also modeled.
  - [x] Add the QuadVee Tracked/Wheeled chassis selection and persist it in
    BattleMech records for later motive-system rules.

### LAM/QuadVee Rules Progress

- [x] LAM jump capability: Standard Jump Jets are enforced by the model. The
  1-3 MP clamp and Standard-only gyro were replaced; see below.
- [x] LAM avionics and landing gear occupy the six mandated critical slots.
- [x] LAM-prohibited equipment is filtered and blocked from allocation.
- [x] LAM conversion equipment weight: 10% of tonnage rounded up to a whole
  ton; QuadVee conversion weight now rounds up the same way (a 55-ton unit
  carries 6 tons, not 5.5). Cited as IO p.113 (LAM) / p.134 (QuadVee) via
  MegaMek's TestMek; verify against the book.
- [x] LAM construction limits: no slot-occupying armor or structure (Endo
  Steel, ferro-fibrous, etc.), no Hardened armor, Standard or Compact fusion
  engines only, and no OmniMech construction (IO p.114, confirmed 2026-09-28).
  Enforced in setters, availability lists, and on conversion of an existing
  design.
- [x] LAM Jump MP and gyros (IO p.114, confirmed 2026-09-28): at least 3 Jump
  MP (the old 1-3 clamp is gone), the usual walking-MP cap applies, and a
  violation is reported when Walk MP is below 3. Standard, Compact, and
  Heavy-Duty gyros are allowed; others fall back to Standard.
- [x] LAM jump jet type limit lifted (user decision 2026-09-28; MegaMek has
  none). Improved jump jets raise the Jump MP cap to Run MP as usual.
- [x] Bimodal LAM type selection (Step 1, saved as `lamType`): no AirMech mode
  (play-mode button hidden), conversion equipment 15% of tonnage, conversion
  cost 65%, standard BV math without AirMech terms (IO via MegaMek).
- [x] LAMs keep upper and lower arm actuators in both arms (hands optional;
  IO via MegaMek TestMek). The Omni-LAM also keeps its hands.
- [x] LAM Bomb Bay and Fuel Tank in `mech-universal-equipment.ts`, LAM-only
  through the new `chassisTypes` field, checked 2026-09-28 against
  Interstellar Operations (2016 PDF from the temp.2000webdesign.com index):
  - Bomb Bay: 1 t, 1 slot, 5,000 C-bills, tech rating B, at most 20, left or
    right torso only (IO pp.114, 220-221; our record had rating D and allowed
    the CT). Dates 2680 prototype / 2684 production (LAM row, IO p.50).
  - Fuel Tank: 1 t, 1 slot, 200 C-bills, 80 fuel points each on top of the
    free engine ton (IO pp.114, 221). Introduced "ES"; 2100 is MegaMek's
    placeholder year for that era. "Explosive" stays unset (no IO rule).
  - BV: each Bomb Bay and Fuel Tank slot is -15 like explosive ammo, with
    CASE rules applying (IO pp.192, 196). Previously -1 and 0.
  - Cost: bays and tanks count as equipment before the conversion cost
    (IO p.186); loaded bombs add no cost.
- [x] Bombs in the ammo catalogs (MegaMek BombType; TW/TM/TO:AU&E/IO:AE pages
  cited there): universal HE (the `-standard` round), Cluster, Inferno,
  Torpedo, Fuel-Air S/L, and AAA. IS and Clan are split for Laser-Guided, TAG
  pod, Arrow IV, Arrow IV Homing, Thunder, and AS. IS only: ASEW, LAA, and
  the Rocket Launcher pod. Bombs carry `bombBaySlots`, are never listed as
  mountable, and are gated by rules level (Advanced ammo = 3). Step 5 has a
  LAM bomb loadout. Bombs load only into side-torso bays, and a multi-slot
  bomb must fit in one location (bays in one location combine: IO errata as
  quoted by a moderator, bg.battletech.com forums topic 84643; errata document
  not downloaded). Loaded bombs add no weight: "their weight is largely
  accounted for during the unit's construction" (IO p.110). The loadout is
  saved as `bombLoadout`.
  - [ ] Loaded bomb BV is added after rounding, like external stores
    (via MegaMek; provisional). IO's LAM BV rules (p.192) don't mention bomb
    BV; check TM's aerospace external-stores BV rule.
  - [ ] Not included: the Alamo nuclear missile (optional nuclear rules) and
    the prototype rocket pod (Experimental).
  - [x] IO p.192 LAM BV checked 2026-09-28: TMM on AirMech Flank MP +1
    airborne (standard LAMs; bimodal use the 'Mech TMM), heat capacity +9
    instead of +6, AirMech flank heat = MP / 3 rounded (IO p.113), speed factor
    = Run MP + half AirMech Flank MP. Our code already matched; the test
    reproduces the book's Phoenix Hawk LAM numbers (TMM +6, heat efficiency 13,
    speed factor 3.00). LAM BV is no longer flagged provisional, except with
    bombs loaded or on the Custom Omni-LAM; LAM PV stays provisional.
    - Bimodal LAMs keep the 'Mech +6 heat: IO doesn't say, and the +3 comes
      from AirMech mode's partial-wing bonus (IO p.113). MegaMek reads it the
      same way.
    - [ ] Averaged pilot skills ('Mech + aerospace, rounded normally; IO p.192,
      TM p.314 variable skills): we store only one skill pair, so there is
      nothing to average yet. Needs separate LAM aerospace skills.
  - [ ] Alpha Strike conversion for LAMs (LAM movement and specials) is not
    implemented, so LAM PV is marked provisional.
- [x] Remaining LAM limits (IO p.114, confirmed 2026-09-28), reported in
  Step 6 via `getChassisEquipmentViolations()`:
  - no equipment split across locations (except avionics and landing gear);
  - spreadable equipment in a single location;
  - more than 20 Bomb Bays, and bays outside the side torsos.

  Blocked in the equipment list: artillery, heavy and improved heavy Gauss
  (need a Piloting skill), supercharger, partial wings, mechanical jump
  boosters, backhoes, bridge-layers, combines, dumpers, and Chameleon LPS.
  IO p.114 allows physical attack weapons, so the older TRO:3085-era bans on
  hatchets, swords, claws, maces, shields, MML, rotary ACs, Artemis, and
  plasma rifles no longer apply to LAMs (they still apply to Tripods, from a
  list whose source I have not re-checked).

  Cockpit limits (no torso-mounted, multi-slot, or primitive cockpit) need no
  code: the model has only the standard and small head cockpits.
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

### Custom Homebrew Chassis Rules (rules level 5 only)

- [x] Omni-LAM (fan rule: Kronos Battle Systems, "Construction Rules Update
  KBS-3066-07-07-TRO3067 / Chassis Type: Omni-LAM", Inner Sphere, Tech Level 3;
  <https://drive.google.com/file/d/0B5bLPOivte0vdXllN2Y3MUhhNGM/view>). Canon
  LAMs stay non-Omni; `canBeOmniMech(rulesLevel)` opens Omni only for Inner
  Sphere/Mixed IS LAMs at Custom Homebrew. Enforced: arm lower/hand actuators
  are fixed (restriction 3), cost x1.75. Reported in Steps 1 and 6: left/right
  equipment weight balance (restriction 1) and equal left/right base-chassis
  slots (restriction 2). Dropping below rules level 5 or switching to a Clan
  tech base turns Omni off.
  - [x] Balance confirmed by the user (2026-09-28): equal equipment tonnage in
    LA+LT+LL vs RA+RT+RL (head/CT are centerline).
  - [x] Restriction 2 now compares left/right **pod space** (slots not used by
    chassis systems or fixed equipment) using the OmniMech base-chassis model.
  - [x] "Uses LAM battle values": the provisional LAM BV math below applies.
  - [x] Cost: x1.75 replaces the x1.25 OmniMech multiplier; LAM conversion
    equipment cost still applies.

### OmniMech Base Chassis

- [x] Installed equipment carries `omniFixed` (saved in exports). Step 5 has a
  Fixed column, a pod-space summary (slots and tons), and "Strip Pods" to start
  a new configuration from the base chassis. `getOmniPodSpace()` defines the
  model line; turning Omni off clears the flags.
- [x] OmniMech configurations (user decision 2026-09-28: all configurations
  in one design, with a picker):
  - Step 5 has New (empty pods), Copy (current pods), Rename, Delete, and an
    active-configuration picker, plus a per-configuration table of pod tons,
    BV, and cost.
  - Each configuration stores its pod items, their critical slots, and its
    LAM bombs.
  - The saved `equipment` is always the active configuration, so older
    saves and other readers keep working. `omniConfigurations` and
    `activeOmniConfiguration` are added alongside it.
  - Turning Omni off keeps only the active configuration.
  - [x] Show the configuration name on record sheets and in the roster
    (e.g. "Prime"), and let a roster add a specific configuration.
    `getName()` appends the active configuration when a design has two or
    more (skipped if the model/name already ends with it). The roster's Add
    dialog lists one row per configuration (`cloneOmniConfiguration`).
- [x] Fixed-only equipment (MegaMek `omniFixedOnly`, TM/TO:AUE/IO:AE;
  provisional) is always on the base chassis and cannot be pod-mounted or
  stripped:
  - MASC, Partial Wing, AES;
  - Null Signature, Void Signature, and Chameleon LPS;
  - Blue Shield, RISC Emergency Coolant, Tracks, and Environmental Sealing.

  The list is `OMNI_FIXED_ONLY_TAGS` in `equipment-registry.ts`. Engine,
  gyro, cockpit, structure, armor, and myomer (TSM) are chassis systems and
  are already outside pod space.
  - [ ] Heat sinks and jump jets are counts in our model, not equipment, so
    pod-mounted heat sinks and jump jets (legal per TM) cannot be modeled yet.
  - [ ] HarJel II/III, Drone OS, SRCS, and Mobile HPG are fixed-only too,
    but they are not in our catalogs. Sources found 2026-09-28:
    - HarJel II/III: IO pp.88-89 (rules; BattleMechs only; standard,
      heavy industrial, or ferro-fibrous armor only; one per location; no
      mixing II and III), p.191 BV (-1 per slot, armor x1.1/x1.2 in
      protected locations), pp.220-221 (Clan, F/X-X-X-F, 3136 / 3139,
      240,000 / 360,000 C-bills, 1 / 2 slots). The tonnage is shown as "2*" /
      "3*", and I couldn't find that footnote in the PDF text.
    - SRCS: IO p.140; IO p.221 gives cost 5,000 + (10,000 x IT), variable
      weight; BV x0.85 of final (p.196).
    - Drone (Remote) OS: TO pp.305-306. Mobile HPG: TO p.330. Not checked.

### Rules Levels and Printing

- [x] Chassis types carry a rules level (IO p.50 via MegaMek; verify against
  the book): Biped/Quad 0, Tripod and QuadVee Advanced (3), LAM Experimental
  (4). Ultra-light and Superheavy tonnage is Advanced; prototype-only
  equipment is Experimental; custom equipment and the Omni-LAM are Custom
  Homebrew (5). `getRequiredRulesLevel()` combines these.
- [x] Step 1 lists only chassis legal at the selected rules level (plus the
  current one) and warns when the design needs a higher level.
- [x] Mech record-sheet and Alpha Strike card print pages stamp "Rules Level:
  X - not tournament legal" above Standard, and ask for confirmation before
  printing a unit above the selected rules level.
- [x] Classic roster, Alpha Strike roster, and vehicle record sheet printing
  use the same guard and stamp (`ui/components/rules-level-print.tsx`). Alpha
  Strike units take their rules level from the MUL "Rules" field (saved as
  `rulesLevel`); Vehicles report Superheavy (>100 t) as Advanced plus their
  equipment's rules levels (`getEquipmentRulesLevel`).
- [x] Alpha Strike units from the mech creator (`calcAlphaStrike`) carry the
  design's `getRequiredRulesLevel()`. That now includes loaded bombs. Units
  built in the AS unit creator have a Rules Level picker. They default to
  Custom Homebrew, since a hand-built card is not a published MUL card.

### Provisional BV and Cost (verify against the books)

- [x] LAM BV (IO via MegaMek; IO p.192 cited for the TMM): running TMM uses
  AirMech Flank MP (Jump MP x 3 x 1.5, rounded up) +1 airborne; +3 heat
  efficiency; movement heat = AirMech Flank MP / 3; speed factor uses Run MP +
  AirMech Flank MP / 2. `isBattleValueProvisional()` is true for LAMs and the
  print stamp notes "provisional BV/PV". QuadVee and Tripod BV use the
  standard math (MegaMek has no QuadVee-specific BV).
- [x] Cost multipliers and base values (MegaMek's TM/TO:AUE/IO values;
  provisional): OmniMech x1.25; LAM conversion equipment 75% of (internal
  structure + equipment); QuadVee 50%; cockpits Tripod 400,000 / Superheavy
  Tripod 500,000 / QuadVee 375,000 / Superheavy 300,000; Tripod structure
  x1.2; Superheavy actuators x2, standard myomer 12,000/ton, and the
  Superheavy structure table (4,000 / 16,000 Endo / 1,600 Composite / 6,400
  Endo-Composite / 3,000 Industrial).
- [x] Superheavy gyro costs 500,000 (the Heavy-Duty rate) per ton of its
  doubled weight. Engines rated above 400 (large engines, which Superheavy
  designs use) were already x2. IndustrialMechs (Industrial internal
  structure) use a 1 + tonnage / 400 multiplier (TM / IO via MegaMek
  MekCostCalculator; provisional).

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
  - Blocks 13-20: proposed classifications and findings F1-F12 recorded in the
    ledger (2026-09-27); awaiting approval before any promotion.
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
- [x] Consider an optional prototype-year field: `introduced` uses the IO
  production year, so experimental prototypes (e.g. artillery cannons
  3012/3032, Bombast 3064) are not available before production. (Superseded
  by the `prototype` year item below.)
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
- [x] Legacy data: base launchers' `battleValueOneShot` values are stale (e.g.
  LRM 10 shows 9; the OS record has 18) and unused by the builder; Clan Arrow IV
  stores range as `maxMapSheets` while IS Arrow IV uses short/medium/long.
  (Removed the placeholder field from 46 records; the (OS) records carry the
  one-shot BV. IS and Prototype Arrow IV now use `maxMapSheets: 8`, moved from
  `long: 8`; verify 8/9 map sheets against TO when the book is in hand.)
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
- [x] Misc equipment batch 2 (18 records): Partial Wing (IS/Clan), Mechanical
  Jump Boosters, Tracks, Environmental Sealing, AES arm/leg (IS/Clan), Talons,
  Blue Shield, Radical Heat Sink System, RISC Emergency Coolant System, Nova
  CEWS, Remote Sensor Dispenser (+ prototype), mounted Searchlight, Laser
  Insulator; UMUs as a jump jet type.
- [x] Wiring and UI: spread equipment places one slot at a time
  (`spreadSlots`: signature systems, wings, boosters, tracks, sealing, talons,
  Blue Shield); size picker for Mechanical Jump Boosters (`sizeLabel`, saved as
  `size`); equipment picker shows variable items sized for the 'Mech; heat
  sink count limited by Compact weight and type notes shown; step 2 labels UMU
  MP; TRO lists booster and UMU MP. Movement: medium/large shields -1 walk,
  medium -1 jump, large no jump; partial wing jump bonus (no heat) and +3 heat
  capacity; booster MP counts for BV; UMUs 1 heat. BV: AES weight factor,
  Null Signature/Chameleon +0.2, Void Signature TMM rule, RISC ECS +4 heat.
- [ ] Misc equipment still unsourced or needing more wiring: EI Interface, DNI,
  drone OS/console, SRCS, IndustrialMech ejection seat, recon camera, sprayer,
  buzzsaw, fluid suction, ladder, vehicular mine dispenser, booby trap,
  cargo/liquid storage, chaff pod, comms equipment, collapsible command module,
  HarJel II/III, paramedic gear, ground-mobile HPG, RISC viral jammers / laser
  pulse module / super-cooled myomer, DIC, LAM bomb bay/fuel, QuadVee wheels,
  turrets (need a turret-mount toggle), dumpers, Ram Plate. Placement rules for
  spread items (one per location, side torsos, legs) are not enforced yet;
  hand-actuator requirements and Claw replacing the hand are not enforced;
  tracked movement mode not modelled in play.
- [ ] Artemis V and Apollo launcher combos (Artemis IV exists as combined
  launcher records).
- [ ] After Artemis V is wired in, add the Clan LRM/SRM + Artemis V launcher
  records from workbook rows 157/159/161/163 (LRM 5/10/15/20: heat 2/4/5/6,
  0.42/0.84/1.26/1.68 at S/M/L) and 169/171/173 (SRM 2/4/6: heat 2/3/4,
  0.42/0.84/1.05 at S/M). Alpha Strike values stay "Provisional workbook
  conversion"; Classic stats need the TO source.
- [ ] Add the ProtoMech Streak LRM (per tube) and Fusillade Launcher as
  ProtoMech-only records (every non-ProtoMech `space` slot -1; test-guarded)
  once their Classic stats are sourced. Workbook: Streak LRM heat 1,
  0.1/0.1/0.1 per tube; Fusillade heat 0, 0.45/0.3, IATM.
- [ ] Misc sources, leads from the Ollama/Sarna pass (review-only, in
  \`tools/misc-equipment-sources-staging.jsonl\`; Sarna "TO" pages may be the
  pre-split Tactical Operations, so map them to TO:AR/TO:AUE before use):
  Drone OS/Carrier Control TO p.305, Recon Camera TO p.337, Sprayer TM p.248,
  Fluid Suction TM p.248, Liquid Storage TM p.239, Comms Equipment TM p.212,
  Paramedic TM p.233, Booby Trap TO p.297, Chaff Pod TO p.299, Collapsible
  Command Module TO p.301, BattleMech Turret TO p.347, Artemis V TO p.283,
  Apollo TO p.331, DNI Unbound p.66, Buzzsaw Unbound p.70, RISC Laser Pulse
  Module IO p.93, Super-Cooled Myomer IO p.94, Ram Plate OTP: Hanseatic Crusade
  p.30. Not found yet: IndustrialMech ejection seat, EI (check TW/IO), SRCS,
  ladder, vehicular mine dispenser, cargo, HarJel II, ground-mobile HPG, RISC
  viral jammer, LAM bomb bay/fuel, QuadVee wheels, dumper.
- [x] BUG: Step 4 "Best Guess" armor allocation leaves CT (R) blank instead of
  a number and puts 0 on CT. The remainder was dumped on the CT front, pushing
  CT front + rear past 2x structure (dropdown had no matching option), and
  skipped locations kept stale values. `allocateArmorSane` now clears first,
  allocates proportionally to each cap and round-robins leftovers without
  exceeding any cap; regression test sweeps Biped/Quad/Tripod/LAM.
- [x] Step 5 equipment picker: add subtype filters within each main category
  (Energy: Lasers/PPCs/Flamers...; Ballistic: ACs/Gauss/MGs...; Missile:
  LRM/SRM/ATM/MRM...), keeping "all of the category" available.
  (`src/data/equipment-subtypes.ts`; ammo is grouped by the weapon it feeds;
  Melee/Misc have no subtypes.)
- [x] Step 5 sorting: natural numeric sort (ATM 3 before ATM 12).
  (`sortEquipment` uses a numeric collator, name as tie-break.)
- [x] Re-run the duplicate audit across every catalog file (IS, Clan,
  universal, custom, ammo) for duplicate tags, names and altTags hiding in
  another file. (2026-09-27: IS and Clan Arrow IV shared `arrow-iv-system`, so
  Mixed Tech hid one; Clan is now `clan-arrow-iv-system` with the old tag in
  altTags. Removed wrong aliases: "Flamer (Clan)" on the SL flamer, ATM ER
  names on ATM Standard ammo, launcher names on iGauss/iLRM/iSRM ammo.
  `addEquipmentFromTag` now prefers an exact tag over aliases. The remaining
  ~176 cross-file hits are intended IS/Clan split aliases; prototypes share
  their production weapon's display `alternateName` by design. Tests guard
  cross-catalog tag uniqueness and same-side altTag shadowing.)
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
- [x] Implement remaining vehicle categories (2026-09-29, branch `vehicle-motive-types`): Wheeled, Hover,
  VTOL, WiGE, surface naval, hydrofoil and submarine, each with its tonnage limits, suspension factor,
  lift/dive equipment, record-sheet outline and Alpha Strike movement code; VTOL rotor (2 armor max) and
  Advanced chin turret; no Hardened armor on VTOL/hover/WiGE; 5% control systems for every vehicle;
  Superheavy structure x2 (non-naval); engine type, Cruise MP and heat sinks in Step 1. Values follow
  MegaMek (TestTank/Tank; book not in hand) and were checked against MUL vehicle tonnages and move codes.
- [ ] Vehicle heat sinks: count energy-weapon heat and the fusion engine's 10 free heat sinks (heat-neutral
  requirement), and power amplifiers (10% of energy weapon weight) for non-fusion engines.
- [ ] Superheavy vehicle locations (front-left/right, rear-left/right) and dual turrets (Advanced).
- [ ] Vehicular jump jets (hover, wheeled, tracked, WiGE only) once they are in the equipment catalog.
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

- [x] Upstream PR stack (2026-09-29, HeySporky/battletech-tools): #73 tooling, #74 License, #75 WeaponsNEquip,
  #76 Quads, #77 QuadVees, #78 Tripods, #79 LAMs, #80 Vehicles, #81 ASupdates (MUL). #75-#80 need #73 and #74;
  #81 needs #73. #81 supersedes #68.

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

## Runtime and tooling

- [x] Node 26 baseline (`.nvmrc` / `.node-version`); `engines` accepts `^22.22 || ^24 || >=26` (React Router 8 needs 22.22+, Vitest 5 needs 22.12+)
- [x] Commit `package-lock.json`; `npm ci` everywhere, `npm audit` at 0 vulnerabilities
- [x] Vite 8, React 19.3, React Router 8 (`react-router`), fast-xml-parser 5, ESLint 10, typescript-eslint 8.71
- [x] Dual-track TypeScript: `npm run typecheck` uses TS 7 (native) where a binary exists, TS 6.0.3 elsewhere
      (Android/Termux) and for ESLint
- [x] Sass: `@import` -> `@use`, `darken`/`lighten` -> `color.adjust` (no Dart Sass 3 deprecations left)
- [x] CI: ubuntu/windows/macos x Node 22/24/26, plus browser-mode and E2E jobs (`.github/workflows/ci.yml`)
- [ ] Drop the `typescript-7` alias and make TS 7 the only `typescript` once typescript-eslint supports TS >= 6.1
      and TS 7 ships the JS API (or an Android binary) - then remove the fallback in `scripts/typecheck.mjs`
- [ ] Turn `prefer-const` / `no-var` back on after an `eslint --fix` commit (see lint backlog)
- [ ] Add lint back to `npm run check` and make the CI lint job blocking once the backlog below is empty

## Engine bugs found by the new tests

- [x] BV Speed Factor crashed on odd Jump MP (fractional table index; 72 of 508 SSW mechs, and it truncated the
      background SSW import at startup). Fixed with the canonical TM p. 316 formula (MegaMek parity).
      Upstream has a different bug in the same function (wrong formula above 25 MP): branch
      `fix/speed-factor-above-25-mp`, to be offered to HeySporky as an issue + PR.
- [x] `setEngine(0)` logged an error and kept the old engine; 0 now clears it.
- [x] `_allocateCritical` matched by UUID only, so rebuilt items (heat sinks, ...) were never placed: 8,359 failed
      allocations / 4,314 unallocated components across the SSW import. Falls back to tag + rear now (upstream's rule).
- [x] Startup froze the UI for ~6 s (desktop) while importing every SSW mech in one loop; now imported in time slices.
      The same loop exists upstream - candidate for an upstream issue + PR.
- [ ] 50 components stay unallocated after SSW import across 12 mechs (42 jump jets; also heat-sink x3, plasma-rifle,
      heavy-ferro-fibrous, er-small-laser, c3-computer-slave, ecm-suite): ANH-3A Annihilator, AWS-10KM Awesome,
      CTF-5D Cataphract, CGR-KMZ Charger, CLNT-6S Clint, FS9-B Firestarter, JR7-C2 Jenner, CRK-5003-CJ Katana (Crockett),
      PNT-14S Panther, WTH-3 / WTH-K Whitworth, "Grinner" Wolfhound IIC. Compare their SSW placements with MegaMek.
- [ ] Firefly C: the SSW import drops the Clan SRM-2 launcher ("(CL) SRM-2") and maps its ammo to `ammo-srm-2`; a
      JSON save/load then drops that ammo too (not found in the Clan equipment list).
- [ ] BV differs from SSW's BV2 figure for many bundled mechs (221 of 508 exact) - reportedly addressed on the MUL
      branch; re-check `battlemech.test.ts` against SSW BV once that lands.
- [x] Play mode offered no Jump to Bipeds/Quads/Tripods (`canUseJumpJetsInCurrentMode` only allowed LAMs and QuadVees).
- [x] Quads after the front-leg location change: front-leg hits went to the side torso, front-leg criticals were missing
      from the Critical Hits dialog, the record sheet drew no front-leg armor circles, and older saves (front legs in the
      arm locations, as upstream stores them) lost that armor and those criticals. Migration in `canonical-record.ts`.
- [x] Tripods: the play-mode Critical Hits dialog had no center leg.
- [x] MUL 2.0 cards: printed "BATTLEMECH" as the chassis (Class is the unit type in MUL 2.0), showed "TH NaN"
      (no BFThreshold), and any Rules search filter hid every MUL 2.0 unit (no Rules field).
- [ ] MUL 2.0 records have no BFThreshold, Rules or ImageUrl: aerospace cards lack their armor threshold and MUL 2.0
      units have no rules level. Extend `tools/mul-sync/sync-mul.mjs` to collect them.
- [ ] `tools/mul-sync/browser-state.json` is committed with live masterunitlist.battletech.com session cookies
      (including `cf_clearance`). Decide whether the weekly sync needs it in git; if not, remove it from history and
      ignore it.

## Lint cleanup backlog (11 problems: 10 errors, 1 warnings)

Generated from `npm run lint` (ESLint 10 + typescript-eslint 8.71). CI runs lint as a non-blocking job and
`npm run check` leaves it out until this list is empty; then add lint back to both. Rule breakdown:

| Count | Rule |
| ----: | ---- |
| 6 | `no-undef` |
| 3 | `@typescript-eslint/no-unused-vars` |
| 1 | `preserve-caught-error` |
| 1 | `no-useless-assignment` |

`prefer-const` (~790 hits) and `no-var` (~20) are switched off in `eslint.config.mjs` for now; both are
auto-fixable (`npx eslint . --fix --rule 'prefer-const: error' --rule 'no-var: error'`) and deserve their own
reviewable commit before being turned back on.

None of these come from the modernization work - they are pre-existing code health items. File by file:

### src/data/mul-list-items.ts

- [ ] L3:6 `warning` **@typescript-eslint/no-unused-vars** - 'MULChunkEntry' is defined but never used.

### tools/live_mul_browser_probe.mjs

- [ ] L38:10 `error` **@typescript-eslint/no-unused-vars** - 'findChunkEntry' is defined but never used.
- [ ] L65:16 `error` **@typescript-eslint/no-unused-vars** - 'saveChunkIfNeeded' is defined but never used.
- [ ] L109:24 `error` **no-undef** - 'document' is not defined.
- [ ] L110:30 `error` **no-undef** - 'document' is not defined.
- [ ] L121:30 `error` **no-undef** - 'document' is not defined.
- [ ] L130:33 `error` **no-undef** - 'HTMLAnchorElement' is not defined.

### tools/mul-sync/sync-mul.mjs

- [ ] L216:17 `error` **preserve-caught-error** - There is no `cause` attached to the symptom error being thrown.
- [ ] L264:9 `error` **no-useless-assignment** - The value assigned to 'files' is not used in subsequent statements.
- [ ] L376:9 `error` **no-undef** - 'document' is not defined.
- [ ] L382:27 `error` **no-undef** - 'document' is not defined.
