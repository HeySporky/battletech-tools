# Product Roadmap

This roadmap describes the work required to grow Jeff's BattleTech Tools from a
BattleMech creator into a broader BattleTech construction and record-management
tool. Items are ordered by dependency, not by product marketing priority.

## Bug Hunt: BattleMech Construction Steps

- [x] Step 1: Fix unit-type display in the right TRO-style block.
  - [x] Tripod is displayed as a Quad. The shared TRO HTML renderer now uses
    the Tripod anatomy and includes the center leg.
  - [x] LAM is displayed as a Quad. The shared TRO HTML renderer now uses the
    Biped/LAM anatomy.
  - [x] Add the requested Rules Level selector so custom equipment can be
    enabled. The selector is present in Step 1 and updates the app settings.
- [ ] Step 2: Verify engine availability by era in the Select Engine Type
  field. Engine introduction, extinction, and reintroduction dates do not
  always produce the expected options.
- [ ] Step 4: Fix armor allocation displays in the middle block.
  - Tripod is displayed as a Quad; determine whether the Tripod SVG needs to be
    updated for this view.
  - LAM should be displayed as a Biped but is displayed as a Quad.
- [ ] Step 5: Add a way to identify which equipment catalog is available:
  Inner Sphere, Clan, or Custom.
- [ ] Step 6: Fix equipment allocation locations and critical slots.
  - Tripod does not display its center leg, so its critical slots cannot be
    allocated.
  - Quad displays Left Front Leg and Right Front Leg headers without the
    critical slots needed to allocate equipment there.
  - Tripod is displayed as a Biped.
  - LAM has the correct base display but is missing critical allocations for
    landing gear, conversion equipment, and other LAM-specific equipment.
  - QuadVee is displayed as a Biped instead of a Quad and is missing its
    conversion equipment and other required criticals.
- [x] Trace the shared three-block construction-step layout. Every step page
  has step-selection controls in the left block, user inputs in the middle
  block, and a TRO-style display of the current input in the right block.
  - [x] Determine why the right block does not show the Tripod center leg and
    instead renders Quad information. Each step calls the shared
    `makeTROHTML()` renderer; its previous binary Biped-versus-Quad branch was
    replaced with Biped/LAM, Tripod, and Quad/QuadVee anatomy branches.

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

- [ ] Inventory all current equipment lists against the current rulebooks and
  identify missing, duplicate, renamed, and obsolete entries.
- [ ] Populate complete canon equipment catalogs before adding every unit domain.
  - Inner Sphere and Clan weapons.
  - Ballistic, energy, missile, ammunition, physical, electronics, armor,
    engines, gyros, heat sinks, cockpits, movement systems, and support gear.
  - Equipment shared by Mechs, vehicles, aerospace, DropShips, WarShips, and
    infantry should be represented once with domain legality metadata.
- [ ] Add equipment metadata: domain legality, tech base, rules level, era,
  weight/cost rules, critical-slot rules, ammunition compatibility, and sources.
- [ ] Add catalog completeness tests and duplicate-tag/name tests.

## Phase 2: Conventional Vehicles

- [ ] Define the vehicle domain model and vehicle location/damage schema.
- [ ] Build the vehicle construction editor and record sheet.
- [ ] Implement vehicle categories:
  - Hover.
  - Tracked.
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

- [ ] Create the canonical schema/interfaces and version migration helpers.
- [ ] Add a domain-neutral equipment catalog metadata model.
- [ ] Write the equipment inventory/completeness report and close catalog gaps.
- [ ] Extract BattleMech construction logic behind the first domain interface
  without changing existing BattleMech behavior.
- [ ] Prototype one vehicle category end to end, recommended order: tracked,
  hover, wheeled, VTOL, WiGE, submarine, surface naval.
- [ ] Add a decision record for Small Craft placement and current AeroTech rules
  version before beginning capital aerospace work.
