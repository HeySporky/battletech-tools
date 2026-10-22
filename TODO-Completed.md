# Completed Work

Everything finished on Jeff's BattleTech Tools, newest first. `TODO.md` holds only open work; when an item
there is done and verified, move it to the top of this file.

- **Completed roadmap items** are the checked-off entries moved out of `TODO.md`, grouped by the roadmap
  section they came from.
- **Commit history** lists every non-merge commit on `master` by month, back to the first commit on
  2016-02-19: date, short hash, subject and author.

## Completed roadmap items

### Moved from `TODO.md` on 2026-10-18 (91 items)

Grouped by the roadmap section they came from (with the open item they sat under, if any); sections and
items newest first by the dates in their text.

#### JBTIICRework review (2026-10-06) / Rules editions (`src/data/rules-editions.ts`, branch `feature/rules-editions-list`)

- [x] Skill multipliers by rules edition (2026-10-07): `skill-multipliers.ts` is keyed by edition and says
  which unit types read the 5 column. Master Rules p.144 and Master Rules, Revised p.158 share one table
  (skills 0-7; infantry and, in the Revised Edition, ProtoMechs use the 5 column); Total Warfare uses the
  TechManual's p.315 table as printed from 2020 on and repeated in the 2024 Battle Value pages (Gunnery 0 /
  Piloting 0 = 2.42), which the Core Rulebook p.222 also prints; editions before Master Rules have no Battle
  Value system. The app had carried the 2017 "BV 2.1" revision (2.80) cut off at Piloting 5, so skill-adjusted
  Battle Values of 'Mechs, vehicles and fighters change (Gunnery 3 / Piloting 4: 1.38 before, 1.32 now). The
  2007 first printing's table (3.68) is noted in the file, not selectable. Nothing chooses an edition yet:
  every unit takes an optional edition and defaults to Total Warfare until the edition selector is built.
  BattleTech Compendium: The Rules of Warfare (1994), added to the library since, has no Battle Value
  system (checked in its OCR text, 2026-10-17).
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
- [x] The rules edition selector, BattleMechs (2026-10-08): Step 1 of the Mech Creator has a Rules Edition
  control listing the nine earlier editions, Total Warfare (the default) and the Core Rulebook. The edition is
  saved with the design (`rulesEdition`, absent for Total Warfare, so old saves load unchanged). Under an
  earlier edition the creator offers only that rulebook's chassis types, tonnages, components and equipment,
  with the weight, heat, damage, ranges, critical slots and price it prints; eras still apply, and since
  2026-10-16 the edition's own rules levels do (below). Edition-only rules applied: Battledroids jump jets at 0.5 tons a point at any weight (BD p.24);
  every heat sink on the critical chart in Battledroids and the Second Edition (BD p.25); the edition's own
  Engine Table (Battledroids' 6.5-ton 170). Changing edition restats mounted equipment and removes nothing;
  Step 1 lists what the new edition does not include.
- [x] Rules levels by edition, Battledroids (2026-10-16). Every creator's Step 1 is Rules Edition, then Rules
  Level (`RulesLevelSelect`), and the level list is the edition's own: Basic, Advanced and Expert Battledroids
  (BD pp.1, 7, 14; levels 0, 1 and 2) plus Apocryphal, Custom Homebrew and Munchkin. A stored level the
  edition does not list shows as the next one up without being rewritten. Construction starts at Expert
  (`constructionLevel`, "the information needed to design and build new classes of droids", BD p.14): at
  Basic the Mech Creator offers only the printed droids, read-only; at Advanced a droid can be edited after a
  warning that this moves the design to Expert. The printed droids (`battledroids-mechs.ts`, built by
  `printed-droid.ts`, saved as `printedDroid`): the ten listings of BD pp.16-17, and at the Apocryphal level
  the SPI-5R Spider (*Game News* #3, May 1985) and the 1984 TCI kit-back sheets (GOL-1H, WLV-3Nb/3Nc,
  GRF-2N, SHD-3H, THN-8T, BTL-5R), whose four-legged Goliath brings the quad layout into Battledroids at
  Apocryphal only (`apocryphalIn`). At Custom Homebrew, the user's conversions for four Ral Partha
  Battledroids miniatures (FLE-15 Flea, FS9-H Firestarter, BKX-7K Battleaxe, LCT-1V Locust), corrected to
  the book's rules. Every correction and every sheet that does not add up is in the droid's notes.
- [x] Battledroids follow-ups (2026-10-16). The GOL-1H's center torso items that its slots cannot hold are mounted
  in the figurine's turret, as the sheet prints them (`turret`, Step 6 lists them apart). Replacing a design in
  any creator (Start Over, loading a save, a file or MegaMek import, the Droid picker) first offers to save it,
  unless it is blank or already saved as it stands. Under an earlier edition a field the rulebook leaves one
  choice for is hidden (`EditionChoice`), as are eras under Battledroids (`noEras`) and OmniMechs before
  TR:3050 (`noOmniMechs`); Primitive 'Mechs and Fractional Accounting are offered under Total Warfare and
  later only, and turned off by a switch to an earlier edition. The rules edition decides: switching straight
  back to the edition a design just left, with nothing changed since, brings back the design it had there
  (`rulesEditionReturn`), so a Battledroids Griffin keeps its Jumping MP 6 through Total Warfare and back.
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
- [x] Battledroids, the rest of play (2026-10-08). The Basic game (BD pp.3-6): the ten droids' statistics,
  the Range, Armor Penetration and Damage Effects tables, and a panel that works a shot out and rolls it
  (`battledroids-basic-game.ts`). For a 'Mech built under Battledroids: a critical hit roll in the critical
  hit dialog (7 or more, the line picked by the dice and marked, BD p.18), and a helper with the Heat
  Scale's effects at its heat, physical attack damage, Piloting Skill Rolls and falls (BD pp.11-15). The
  reference panel gained the optional woods and fire rules (BD p.21). For every edition: the Heat Scale's
  fire modifier is now in the to-hit numbers (+1 at 8, +2 at 13, +3 at 17, +4 at 24).
- [x] Battledroids, left to the players by the user's choice (2026-10-08): the effects of a critical hit once marked (MP, to-hit and heat
  changes from destroyed actuators, sensors, engine and heat sinks), ammunition explosions, the Heat Scale's
  MP loss, shutdown and avoid rolls (shown by the helper, not applied), and line of sight.
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
  Readings to confirm: (1) the box has 24 'Mech designs (p.5); the 20 the rulebook's scenarios name are
  listed, the Assassin without a model code, and the missing four are noted on the edition. The box's
  'Mech sheets scan has since been added to the library (see "Wanted for the library" below) and names
  all 24; (2) the contents page puts Equipment
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
- [x] Battledroids, readings: (1) a jeep "can withstand 5 points of damage" and "any
  hit that does more than 5 damage points kills" it (BD p.22): entered as destroyed by the sixth point,
  however the points arrive; (2) "every tank has ... 5 points of turret armor", though the Scorpion and the
  Hunter have no turret: all three track turret armor, as printed; (3) no modifier for a second target,
  because the weapon attack rules name none.
- [x] Battledroids, more readings: (4) the Basic Game Statistics table and the
  worked example on the same page disagree (Crusader Armor 10 against 13, Warhammer medium Damage 16
  against 15, BD p.6): the table is entered; (5) the Armor Penetration Table starts at Armor Value 5, and a
  Stinger or Wasp hit from behind has 4 or 3: the 5 column is used and the panel says so; (6) falling damage
  rounds a tonnage that is not a multiple of 10 up, as a punch does (BD p.15 is silent).

- [x] Builders for the Manual's units that had none ('Mechs, LAMs and every vehicle type already build),
  all done 2026-10-07:
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

#### JBTIICRework review (2026-10-06) / Reference library, after the 2026-10-06 sort

- [x] Tesseract language data (2026-10-17): eng, osd, spa, deu, pol, por, jpn, rus, ita and fra are in
  `~/tessdata`, which `ocr_ollama.py` uses. `ocr_queue.py` now ranks `languages/pl` and `languages/pt`;
  the queue holds 57 files (about 2,900 pages), started 2026-10-17 (log
  `text/_ocr_run_2026-10-17.log`; offsets, catalog and search index rebuild after it).

#### BattleMech construction and play gaps / Canon equipment pass: still owed (branch `feature/canon-equipment-pass`, ledger `tools/canon-pass-ledger.md`)

- [x] Re-cite the LAM and QuadVee comments in `battlemech.ts` that still gave IO (2016) pages to IO:AE,
  checking each page (2026-10-17; also the tests and the LAM Bomb Bay and Fuel Tank records). IO pp.106-196
  sit 6 pages earlier in IO:AE. The RISC Emergency Coolant System's "+4" was cited to IO p.91 (the TSEMP
  page); it is "+4 to unit Heat Efficiency" in the IO:AE p.190 BV table. Other IO (2016) citations remain
  (TSEMP, Freezers and others in `ssw-canon-pending-names.ts`).

#### Check the data against the sourcebooks

- [x] Re-check the "(original single-volume TO)" page references against TO:AR and TO:AUE (2026-10-17, from
  the library text and contents pages). The original-TO pages were right; their new homes: building
  construction TO pp.128-131 = TO:AR pp.126-129; mobile structures TO p.259 = TO:AUE p.75; Booby Trap TO:AUE
  p.108; Chaff Pod TO p.299 = TO:AUE p.110; Collapsible Command Module TO:AUE p.112; Drone (Remote) Systems
  TO:AUE p.116; Artemis V TO p.283 = TO:AUE p.95; Apollo TO:AUE p.143; Mobile HPG TO:AUE p.142 (table
  p.220); Recon Camera TO:AUE p.148; 'Mech turrets TO:AUE p.159; cruise missiles TO:AUE pp.96-97 (table
  p.216; each missile's damage is the number in its name, the text layer runs the columns together).
- [x] Sources found 2026-10-17 (the catalog already carried the right values; notes updated):
  - Improved SRM 2/4/6 BV 28/52/79, ammo 4/7/10 (IO:AE p.189). MegaMek's 39 for the iSRM 4 is wrong.
  - The Improved PPC and improved autocannons do not explode: they "perform in the same fashion" as their
    standard versions (IO:AE p.90); the 20-point explosion there is the improved Gauss rifle's.
  - I-OS launchers have one row for every type (IO:AE p.40, read from the page image): prototype 3056 (DC),
    production ~3081 (DC), common 3085, Clan prototype 3058 (CNC). SRM/Streak SRM/SRT I-OS match the LRM's.
  - Arrow IV: IS 8, Clan 9 mapsheets (TO:AR p.149, Artillery Ranges Table).
  - Conversion weights: LAM 10%, bimodal LAM 15% (IO:AE p.108), QuadVee 10% (IO:AE p.128).
  - Primitive engine dates: the Primitive BattleMech row, prototype 2439 (TH), production 2443 (TH), common
    2470 (IO:AE p.44, page image), which the code already uses.

#### BattleMech construction and play gaps / Equipment still missing or unwired

- [x] FrankenMechs (CO pp.213-214), Experimental (XTRO:Royal Fantasy p.8): a donor tonnage, structure type and
  name per location; structure points, armor limits and weight (5/15/25/10% shares, rounded up) from the donors;
  endo steel slots per location (Internal Structure Distribution Table, CO p.212); legs at least as heavy, +1/+2
  Piloting Skill Roll modifier; lighter jump jets kept at reduced MP with heat per jet; no OmniMech, no mechanized
  battle armor, standard myomer with MASC; hybrid structure BV and cost by location. Checked against the CO worked
  example and the Schwerer Gustav (XTRO:Mercenaries p.7). Patchwork armor and FrankenMech structure slots now
  re-roll on a critical hit. User rulings (2026-10-14): the +2 leg modifier replaces the +1; a four-legged 'Mech's
  front legs use the table's leg row; hybrid structure is priced by weight share.
- [x] FrankenVehicles (Custom Homebrew, the user's rule 2026-10-14): a turret from a vehicle no heavier than the
  chassis, with its donor's structure points; +1 Driving Skill Rolls only when the loaded turret is heavier than
  the chassis's original; +1 to hit for turret weapons fired by a gunner in the chassis, none when the commander
  in the turret fires; a turret linkage roll (2D6, locks on 10+, my number, not the user's) whenever the turret
  takes damage; not an OmniVehicle. Support Vehicles follow with task 6.
- [x] FrankenProtos (Custom Homebrew, the user's rule 2026-10-14): head, arms and legs from other ProtoMechs of the
  same chassis, with their donors' structure and armor limits; structure weight by share (head 5%, torso 55%,
  arms 10% each, legs 20% or 40% for four); legs at least as heavy; Ultraheavy parts on an Ultraheavy only.
- [x] Battle armor weapons on 'Mechs, Combat Vehicles, fighters, Small Craft and ProtoMechs (Ghosts of Obeedah
  pp.53-54), Short range on aerospace units, power cells on conventional fighters. Fractional Accounting comes on
  "by default" with the first battle armor item and may be turned off (user ruling 2026-10-14: the book's own Hi-Scout
  and Cherubs are built with half-ton rounding); battle armor ammunition stays by the kilogram either way. Non-weapon battle armor
  equipment too (p.54): standard weight, 1 slot, no mobility, fuel, power or life support gear; stealth and C3 noted
  as working only at 3 tons or less (p.55), with no Alpha Strike special; no Battle Value (none printed, TM p.317).
  DropChutes, magnetic clamps and Mission Equipment are left out as a reading (the book names none of them; the user
  agreed, 2026-10-14). The Taser, Pop-Up Mine, Bomb Rack and Tube Artillery too (not missile weapons): one-shot,
  BA table BV, rules in their notes; Tube Artillery shells by the 15 kg shot (Ghosts of Obeedah p.54 over the TO:AUE
  1-ton lots). No Alpha Strike specials for them off battle armor (ASC gives only BA codes). Magnetic sole
  plates are built into every 'Mech and suit (Explorer Corps (FASA) p.86, a game rule; user ruling 2026-10-14 over
  SO p.154's background remark): no item. Custom Homebrew Improved Magnetic Grapples (level 6): one per foot, 0.5 t,
  1 slot, 25,000 C-bills, -1 to rolls to stay on a hull. Still owed: hull-walking play (boarding, Control Rolls,
  Explorer Corps pp.85-86; Northwind Highlanders p.39) once space play exists. Still
  owed: the 2D6 shock roll in play, power cells required on non-fusion Combat Vehicles, and the 3-ton test applied
  per unit (a ProtoMech or ultralight of 3 tons or less should keep the stealth and C3 effects).
- [x] The book's published units rebuilt from their record sheets, as regression tests (2026-10-14): the five
  Automata (BV 369, 270, 825, 109, 109), the Cherub Invictus (507) and Comminus (695), the Hi-Scout Armored Automata
  Carrier (60.0 t) and the SwiftStar drone (30 t). Flagged, not entered: the Cherub Dominus prints BV 517 where the
  rules give 537 (as if its Support PPCs were 12 BV, TM p.317 says 14, or it took a -15 penalty it has nothing for);
  the Labor Automata weigh 1,560 kg built from their sheets, not the "500kg underweight" of p.51. The app has no
  library of published designs outside the MUL, so these are tests only.
- [x] Smart Robotic Control System, basic and Improved (IO:AE pp.134-135, 187, 215), Advanced, on Combat Vehicles and
  fighters: the table's share of the unit's mass rounded up to the half ton (none under 10 tons, 1 ton to improve),
  the table's Skills, 5,000 + 10,000 C-bills a ton, and final BV x 0.85 (user ruling 2026-10-14: the Ghosts of
  Obeedah sheets leave the 0.85 out, Hi-Scout 527 and SwiftStar 529, where the rule gives 448 and 450). Still owed:
  the SRCS on 'Mechs, IndustrialMechs, Small Craft, Support Vehicles and the large units; the shielded aerospace
  SRCS, SDS (Caspar) and Caspar II systems; the robotic play rules (Aggression levels, the separate -4 Initiative,
  shutdown after a jump, IO:AE pp.128-135). The Microcopter and Tankette drones wait for Support Vehicles.
- [x] Patchwork Armor on Combat Vehicles and fighters (TO:AUE pp.188-189; IO:AE p.82): an armor type per location
  or arc at the Advanced rules level, each weighed by the point and rounded up to the half ton, taking the table's
  right-hand column of item slots (vehicles) or weapon slots in the arc (fighters); BV, cost and the Alpha Strike
  armor value per location (ASC errata v1.6). Vehicle and fighter record sheets name each location's armor.
  Combat Vehicles now also count the item slots their armor takes (TM p.105; TO:AUE p.93, which prints Hardened as
  1; IO:AE pp.66, 82).
- [x] FrankenMech donor slots: a location keeps its structure's slots from the donor's design ("retained from the
  donor design", CO p.213), with the table as the fallback; Inner Sphere and Clan endo steel side by side on Mixed
  Tech. Checked against the MegaMek files and XTRO weights for Anastasia and Drizella (XTRO:Royal Fantasy, 3.5 t
  each) and the Ninjabolt's two right-leg slots. Published exception: XTRO:Boondocks prints the Ninjabolt's
  structure as 7 t, which is each location rounded up on its own; the rule (CO p.213, SO p.190) rounds the sum:
  6 t. MegaMek's file also gives its right leg a 90-ton donor, but the XTRO's donor is a 65-ton Tempest and it
  prints 65-ton leg structure.
- [x] Fractional Accounting (TO:AUE pp.188-189), an Experimental option on 'Mechs, Combat Vehicles, fighters
  (aerospace and conventional) and Small Craft: engine multipliers, armor by the point, ammunition by the shot,
  rounded up to the kilogram. Fuel stays in half-ton lots (TM p.186). ProtoMechs are already built in kilograms.
  Still owed: Support Vehicles.
- [x] Automata (Ghosts of Obeedah pp.51-53) in the Battle Armor Creator, Experimental: Clan chassis weight on any
  technology base, the Core's Gunnery 4 / Anti-'Mech 5, Anti-Personnel with basic manipulators, ca. 3090, and the
  Disruption Effects Table and self-destruct rolls in play. The book gives no cost or BV change.

#### New unit domains / Support Vehicles

- [x] MegaMek `.blk` import for SupportTank, LargeSupportTank and SupportVTOL (`importSupportVehicleBlk`) and
  FixedWingSupport (`importFixedWingSupportBlk`), with import panels in the Vehicle and Fighter Creators and a
  half-ton machine gun ammunition checkbox. Fuel Points in fixed-wing files become tons at the half ton (TM
  p.129), noted when the count changes. A local run over the 258 MegaMek samples (2026-10-14): 92 of 225 ground
  and VTOL files and 21 of 33 fixed-wing files import as legal designs. Most of the rest come from the file,
  not the import: 80 files save 0 tons of fuel for an engine that needs it (TM p.128), 38 have no armor in a
  location an Armored, Amphibious, Sealed or Submersible chassis must armor, 9 fixed-wing files are overweight.
- [x] Ground, VTOL and naval Support Vehicle construction (TM pp.116-139 with errata v8.0, 2024), as a
  Support Vehicle mode of the Vehicle Creator: Small (to the kilogram), Medium and Large sizes; Structural,
  engine and armor Tech Ratings and the Overall Tech Rating; the chassis modifications and their limits;
  the seven Support Vehicle engines with minimum weights and fuel range; BAR 2-10 armor (catalog
  `support-vehicle-armor.ts`, now used); fire control; minimum crew, gunners and officers; slots; the
  legality checks; Battle Value (armor x BAR / 10, fire control x 0.8 / 0.9); cost; Alpha Strike (armor x
  BAR / 10, BAR, AFC, BFC; ASC p.95); record sheet. Checked against the Simca, Swiftran, Hesiod and
  CellCo Ranger examples. Errata v8.0 applied where the 6th printing still differs: a Support Vehicle
  Engine Rating (Cruising MP x tonnage, at most 500).
- [x] Support Vehicles in play (TW pp.206-207): fire control to-hit (+2 none, +1 basic), penetrating critical
  hits when one hit beats the BAR (-1 Armored, immune with Armored and BAR 10), +2 to armor-piercing
  critical rolls under BAR 10. Large Ground Support Vehicles use the Superheavy hit location table, which
  matches TW p.206 row for row.
- [x] Transport bays on Combat and Support Vehicles (TM p.239 as revised by errata v8.0; shared with Small Craft):
  cargo, infantry, battle armor and unit cubicles with doors; 1 slot a bay, 1 a container, 1 for all infantry
  bays of a type; cost; Alpha Strike CT/CK, IT, AT, MT, PT, ST, VTM, VTH and MFB (as MegaMek assigns them); door
  limits (TM p.209). The Simca's cargo bay and rear door now price to the book.
- [x] Communications Equipment (1-ton records, one slot for the set on vehicles, +1 crew a ton on Support
  Vehicles, at most 15; MHQ and RCN in Alpha Strike as MegaMek assigns them) and the Support Vehicle ejection
  seat (Small Support Vehicles and VTOLs; counts as a seat), TM pp.131, 212-213; IO:AE pp.34, 39.
- [x] Light and Medium (infantry) weapons on Small Support Vehicles with extra clips, pintle mounts (5 percent,
  to the kilogram; not naval), gunners by Crew value or facing (TM pp.131, 136-137, 234). Their Battle Value is
  the infantry weapon's (TM gives no other; MegaMek uses it). No Alpha Strike value: no cited conversion.
- [x] Extended Fuel Tanks on Combat Vehicles with an ICE or fuel cell (10 percent of the engine, ammo-bin
  explosion 40 a ton); not on Support Vehicles (TM p.244 as rewritten by errata v8.0 names IndustrialMechs and
  Combat Vehicles only).
- [x] Tractors and Trailers in play (TW p.205): Cruising MP lost to towed weight, naval Tractors pull 5 times
  their weight, an unhitched engineless Trailer is immobile. Large Support Vehicles ignore the multiple-targets
  modifier (TW p.206).
- [x] Infantry Bay slots (reading): errata v8.0's Crew Systems Space Table says 1 slot per 30 men, its rewritten
  Transport Bays rule (marked "This ruling has changed") 1 slot per distinct bay and one for all infantry bays of
  a type; the Transport Bays rule is followed.
- [x] Rail and Large Naval Support Vehicles (TO:AUE pp.16-71): rail motive type (Support Vehicles only), Small to
  Large rail units, External Power Pickup, External and MagLev engines, rail Movement Factor; Large Naval
  Vessels to 100,000 tons with templates, up to 9 turrets, 30 + tons / 2,000 structure, 35 + tons / 100 slots;
  the advanced armor table (p.69), crew (p.66) and costs (p.229, no Tech Rating multiplier); Alpha Strike sizes
  by the ASC Size Class Table (p.92; Support Vehicles had used Combat Vehicle sizes) with LG/VLG/SLG. Play: rail
  towing table, Large Naval hit table, template to-hit, crew boxes, engine check 8+, ammunition by location,
  turrets lost without the vessel. Checked against the Adelante and Jormungand. Readings: TO:AUE prints
  Environmental Sealing at C and Steam at E as 2.8; the newer TechManual errata's B and 2.6 are used.
- [x] Airship (Small, Medium and Large), Fixed-Wing and Satellite Support Vehicles as a Support Vehicle mode of
  the Fighter Creator (`support-aircraft.ts`; TM pp.116-139; TO:AUE pp.16, 32-33, 52-71; TW pp.204-207).

#### New unit domains / Small Craft

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

#### New unit domains / ProtoMechs

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
- [x] ProtoMech armor, fractional mass and Electric Discharge ProtoMech Armor (IO:AE pp.58-59, 190): 75 kg a
  point, one torso item less, 32 Battle Value as a weapon, 1,250 C-bills a point. "UltraProto Standard"
  is the readouts' name for the standard armor of Ultraheavy ProtoMechs (The Wars of Reaving p.212; TRO:
  Prototypes p.90); it has no rules of its own, and those units use the same armor on a larger table.
- [x] ProtoMech-only weapons: Streak LRM by the tube (TO:AUE p.139, 400 kg a tube, Battle Values from its
  table) and the Fusillade launcher (IO:AE p.59: 1.5 tons with its two ATM 3 rounds, Battle Value 11).

#### New unit domains / Battle Armor

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
- [x] OmniVehicles (2026-10-08): a vehicle can be built as an Omni (TM p.97): the flag and each item's
  pod-mounted mark are saved with the design, the cost is x 1.25 (TM p.285), the equipment step has a Pod
  column and shows the pod space, and the summary, record sheet and roster say "Omni". As a carrier of
  mechanized battle armor an OmniVehicle needs no magnetic clamps on the squad and loses no MP; a standard
  vehicle does. OmniFighters and OmniMechs already had this; canon LAMs may not be Omnis (TRO:3085
  pp.286-288) and the fan-made Omni-LAM stays at the Custom Homebrew level.
  Not built for vehicles: named alternate configurations of one chassis (OmniMechs have them; OmniFighters
  and OmniVehicles only mark pods), and the import of the Omni flag from MegaMek or SSW vehicle files.

#### New unit domains / Buildings, Gun Emplacements and Mobile Structures

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

#### BattleMech construction and play gaps / IndustrialMechs and Primitive 'Mechs

- [x] 'Mech play rolls the Determining Critical Hits Table (TW p.124) in every location: lines rolled again when
  empty, already hit or unable to take a hit (armor and structure slots, CASE; CASE II and CASE-P via MegaMek).
  IndustrialMechs +2, a modified 13 as 12, 14 or more four torso hits or the head or limb blown off; Primitive
  BattleMechs +2 (13 or more as 12), Primitive IndustrialMechs +4 (IO:AE p.114; read as replacing TW's +2, not adding
  to it). The IndustrialMech End Phase damage check after a fall or physical attack (TW pp.68, 144): +1 a level
  fallen above 1, as the book says (MegaMek adds every level), location from the Front/Rear column. An
  IndustrialMech's sensors go after one hit (TW p.128). ICE and fuel cell IndustrialMechs make no walking or running
  heat (TW p.158).
- [x] Non-Fusion BattleMechs (TO:AUE p.120): ICE, fuel cell and fission engines on a BattleMech are Experimental and
  offered only at that rules level; they make movement heat as BattleMechs.

#### New unit domains / JumpShips, WarShips and Space Stations

- [x] JumpShip, WarShip and station Battle Value (SO:AA pp.148-149): matches MegaMek on the Vincent Mk 39 (15,822),
  Explorer (428) and Merchant (503). Older TROs print different values (TRO:3057R Vincent 20,427, TRO:3026R Explorer
  424) under the pre-SO rules. Reading flagged: p.149 halves the adjacent arc when it and the front pass the heat
  capacity together; MegaMek checks the front alone. Capital missiles and the Screen Launcher now mount on JumpShips,
  WarShips and stations (SO:AA p.141: anything a DropShip may mount).
- [x] Custom Homebrew (rules level 6) monitor: a WarShip with no K-F drive or sail; a keel of half the structure's weight,
  double base crew, carried on one docking collar per 100,000 tons. Canon has the SLDF's monitors (XTRO: Boondoggles p.19,
  project AMPHITRITE, 2683) but no construction rules, so these figures are ours. Still to do: play rules for collar
  transport (Boondoggles' Newgrange was damaged carrying one) and campaign maintenance at x3.
- [x] JumpShip, WarShip and station Alpha Strike card (ASC pp.91-117, 144, errata v1.6; `large-craft-alpha-strike.ts`):
  Size, Thrust or 0.2k, capital armor x 0.33, Structure, Threshold, STD/CAP/SCAP/MSL damage by arc from the ASC p.114
  table, transport and crew specials, large-craft PV. Explorer reproduces its card (PV 12); the Vincent Mk 39 matches its
  card's armor, Threshold, Size, Thrust and Structure. Flagged: (1) ASC p.103 joins a WarShip's fore-sides to the Front,
  the 2021 cards split them half to the broadsides; (2) p.95 rounds the Threshold up, the cards round normally (Aegis 16
  where the rule gives 17); (3) the p.95 Agamemnon example leaves out the division by 4 arcs (rule, MegaMek, card agree on
  it); (4) p.103 gives stations six arcs, the cards and MegaMek four; (5) Vincent PV 110 here, 107 on the card, gap not
  found; (6) PNT is one value for the ship, MegaMek splits it by arc. Some JumpShip cards print Thrust "2" for 0.2k.
  Still to do: MFB from repair bays, offensive special ability factors (MegaMek adds them on a forum ruling).
- [x] JumpShip, WarShip and station play (TW pp.237-240; SO:AA pp.82-83): vessels join roster groups (up to 50) with a
  crew and skill-adjusted BV, and play mode resolves a hit from the SO:AA p.83 table (Above/Below on the Side column of a
  random side, as TW p.238 does for DropShips): standard-scale damage / 10, armor by facing, Damage Threshold, excess to
  SI halved and rounded down (TW p.238; MegaMek rounds normally), critical checks at 8+ and capital missiles' own numbers,
  weapon bay hits with the 1D6 chooser, K-F drive (integrity -1, 0 = cannot jump), grav decks, collars, doors, cargo,
  engine / CIC / sensor / crew / thruster tracks, and zero net heat per fired arc. Print adds the vessel's record sheet
  without damage marks (the sheet has none yet).
- [x] Capital-scale record sheets (SO:AA pp.9-11, Step 6 p.146): data block, inventory by weapon bay with capital-scale
  Attack Values (standard in parentheses), armor and SI as capital-scale squares with Damage Thresholds, K-F drive and
  sail integrity, collars, crew hits, critical damage, heat per arc, Velocity Record (not stations). Same-book conflict
  flagged: p.9 lists capital first, p.146's example standard first; p.9 and MegaMekLab followed. The fighter and Small
  Craft sheets now follow TM pp.336-339 too: SRV/MRV/LRV/ERV per weapon, pilot hits with consciousness numbers, labelled
  critical boxes, the Heat Scale (not conventional fighters) and the Velocity Record. The sheets print the Medium bracket
  as "6-12", an obvious misprint for 7-12. Three experimental rifles have no aerospace range in the catalog and show "?".
  Still to do: the Fighter Squadron sheet (SO:AA p.9) and the conventional fighter's Fighter Return Table block.

#### New unit domains / DropShips

- [x] DropShip construction (TM pp.184-196) in the Small Craft class and creator (`craftType: "dropShip"`,
  a military flag): 200-35,000 t aerodyne or 200-100,000 t spheroid in 100-ton steps; fuel points and
  civilian/military burn by weight; controls x 0.0075; base crew 3 or 4 + 1 per 5,000 t; military free heat
  sinks; 7 + 1 per 50,000 t bay doors; DropShip armor tables; cost with gunnery control by armed arc, docking
  collar, fuel with pumps and x 28 / x 36 (TM p.285). The Arcadia and Nekohono'o worked examples are tests,
  the Nekohono'o cost included. Old saves load as Small Craft.
- [x] DropShip Battle Value by arc (TM p.312): Front at full value, the higher adjacent arc as Left Side, the
  other as Right Side, the three left as Rear at x 0.25; no CASE penalty. Flagged readings: (1) step 7 prints
  Right Side x 0.5 or x 0.25 as the book has it; (2) hull ammunition goes to the arcs of the weapons it feeds by
  their BV; (3) ties take the first arc from the nose; (4) capital ammunition is capped per launcher model.
- [x] Capital missile launchers on DropShips only (TM p.210), Screen Launchers (TM p.237) and sub-capital
  weapons (TO:AUE, rules level 3) from `capital-weapons.ts` / `sub-capital-weapons.ts`: weight with missiles,
  cost, one gunner per capital missile launcher, the 10-shot minimum enforced, an AR-10 loading the three
  standard missiles (heat of the hottest one carried, a reading), BV in its arc. Creator panel and e2e.
- [x] MegaMek DropShip `.blk` import (`small-craft-blk.ts`): weapon bays "(B)", rear "(R)", shot counts after the
  colon, capital and sub-capital lines, bay personnel kept out of the crew (TM p.239). The catalog learned 57
  MegaMek internal names through `altNames`.

### Moved from `TODO.md` on 2026-10-06 (66 items)

Sections are in roadmap order; the newest section is last in the roadmap, so it is listed first here.

#### JBTIICRework review (2026-10-06)

- [x] Rules levels 5 Apocryphal, 6 Custom Homebrew, 7 Munchkin, with constants replacing every hard-coded 5
  (`feature/rules-levels-expanded`, merged 2026-10-07).
- [x] `introducedInEdition` reserved on catalog records, with `src/data/rules-editions.ts`
  (`feature/rules-editions`, merged 2026-10-07).
- [x] 1.1 A failed `localStorage` write is reported with an "Unable to Save" alert (`fix/storage-quota-handling`,
  branched from `upstream/master`).
- [x] 1.3 / 1.4 AppRouter removes its online/offline listeners and import timer on unmount
  (`fix/app-router-cleanup`, from `upstream/master`).
- [x] 3.1 The bundled SSW 'Mechs load as their own chunk; entry bundle 2,483 kB to 333 kB
  (`perf/lazy-ssw-corpus`; upstream PR #112 carries this and the cleanup together).
- [x] `.ssw` file import refuses more than 200 files or a file over 5 MB (`fix/ssw-import-limits`, fork only:
  the importer is not upstream yet).
- [x] 2.4 / 2.5 Lint backlog and phantom `tsconfig.json` entries (`chore/tooling-lint-backlog`).
- [x] 3.3 The 18 MB replaced-legacy archive moved to `tools/mul-sync/archive/`
  (`chore/move-mul-legacy-archive`); the same path change is on upstream PR #92.

#### Runtime and tooling

- [x] Lint backlog cleared (2026-10-06): `npm run lint` reports 0 errors. The two unused helpers in
  `tools/live_mul_browser_probe.mjs` were removed, the rethrow in `tools/mul-sync/sync-mul.mjs` carries its
  `cause`, and those two Playwright scripts get browser globals in `eslint.config.mjs`. The phantom
  `tools/append_chunker.js` / `tools/range_chunker.js` entries are gone from `tsconfig.json`.

#### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / G. Verification

- [x] Browser test: set up a small Aces game and play one full turn (initiative, both sides moving, combat, end
  phase), then save, reload and continue.
- [x] Backward compatibility: old AS force saves and backups load unchanged; the new game and campaign records
  round-trip.

#### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / F. UI in the Alpha Strike section

- [x] Routes under `/alpha-strike/aces/`: an overview page, a solo/co-op game (setup, then the turn wizard), and
  campaigns (list, log, roster, pilots, sortie flow, after-sortie ledger). Add a tile on the Alpha Strike home.
  Domain logic stays in `src/classes` and `src/data`; pages only render and ask questions.

#### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / E. Scouring Sands content (*Aces SS*)

- [x] Sortie index (00-BattleROM Review, 00-Training Simulator, 01-21) within the IP decision. Done as a page
  index on the rules page (`acesScouringSandsSorties`); full sortie records are player-entered. For each sortie:
  number, name, PV cap, OPFOR (unit, skill, deck, reserve), Command deck and starting card, objectives and SP,
  turn limit, Waypoint placement, and branch choices. Story, Waypoint and outcome text is referenced by entry ID
  only.
- [x] The guided tutorial's stacked deck order (e.g. Brawler 383, 253, 643, 213, 093, 513; *Aces SS* p.5), as a
  scripted first game.

#### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / D. Campaign rules (*Aces* pp.23-37)

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

#### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / C. Automated opponent engine (*Aces* pp.7-21, 38-40)

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

#### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / B. Additional Alpha Strike rules (*Aces* pp.3-6, *Aces SS* pp.18-19)

- [x] Indirect Fire (IF#) in the to-hit calculator, with the p.3 example as a test. The judgment calls stay with
  the player. Spotter eligibility (didn't Sprint, hasn't attacked, has LOS, within 42"), modifiers,
  +1 to both attacks when the spotter also fires, one target per spotter, IF0* minimal damage, no OV, and Weapon
  Hits reduce IF. The worked example on *Aces* p.3 (TN 8) becomes a regression test.
- [x] "Front-loaded" unequal numbers (p.6), `getAcesFrontLoadedMoveOrder`; tested against the Erin/Ben example: a move-order helper that skips units which can't move (immobile, shut
  down, emplacements, transported infantry). Test it against the 8-vs-5 example.

#### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / A. Game state and unit queries (`src/classes/`)

- [x] Two-sided game model. `AcesGame` (export v2) holds the automated force (a copy), turn, phase, Initiative
  winner, tokens, commanders, per-unit Aces state, turn limit, Waypoints, objectives, seeded RNG and the log. It is
  versioned and included in backups. The player force stays in `currentASForce`. Original plan: It holds the player force and the automated force, plus the
  turn, phase, Initiative winner, token side, turn track with Waypoints, objectives (Movement/Destroy), and the
  force commanders. It must be versioned, exported and included in the `dataSaves.ts` backups, and existing
  `currentASForce` saves must still load.
- [x] Crippled/Forced Withdrawal test (`getAcesCrippledReasons`; Special Order card criteria, *Aces* p.8; ASCE for the canonical wording).
- [x] Alpha Strike to-hit (target number) calculator (`calculateAcesToHit`, UI `_to-hit-calculator.tsx`). Before this, nothing like it existed, and the engine needs it: targets
  at TN 13+ are ignored and the OV rows compare against TN (*Aces* pp.18-19). Modifiers: skill, range, attacker
  and target movement, terrain and cover, IF and spotter, battle armor +1, emplacements, AM, heat and Fire Control
  hits.

#### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / Decisions before any code

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
- [x] **Named Pilot SP threshold table.** Read off the pilot card images on the PDF pages (*Aces* pp.27, 29):
  - Skill 3/2/1/0 at 400/900/1,900/3,400 SP.
  - Edge tokens 1-10 at 0/60/120/200/300/420/560/720/900/1,100 SP.
  - Edge abilities 0-5 at 0/60/180/360/600/900 SP.

  The examples on *Aces* pp.35-36 test it. Encoded in `aces-rules.ts`.
- [x] **Rules variant per game.** Done: `AcesGame.ruleset`, switch on the game setup page. Aces changes several ASCE rules: its own vehicle critical hit table (*Aces* p.4
  says so), infantry and emplacement critical hits are always a Weapon Hit, the "front-loaded" unequal-numbers
  rule, and the campaign's -2 Initiative carry-over. Store a ruleset (`asce` / `aces`) on each game so in-play
  applies the matching table. ASCE stays the default outside Aces games.

#### BattleMech construction and play gaps / Canon equipment pass: still owed (branch `feature/canon-equipment-pass`, ledger `tools/canon-pass-ledger.md`)

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
- [x] Placement limits (Batch 55): torso-only, arm-only and one-per-location rules of TM pp.210-249 and the
  Artemis IV all-launchers rule. Not checked: actuator removal for industrial tools and hatchets, vehicle
  placement rules, Artemis V / prototype Artemis.
- [x] The vehicle builder no longer offers equipment with no combat vehicle slot value (Batch 54).
- [x] Rulings of 2026-10-01 (in both ledgers): capital missile Tech Rating and capital ammunition units
  approved as recorded; always go with the book, so C3 Remote Sensor pods stay explosive and HarJel II / III
  keep the -1 per slot that CASE does not remove.
- [x] Dark Age armors on IndustrialMechs under the Experimental rules level (4): done in Batch 58 (#105).
- [x] Newer errata, 'Mech catalogs: TechManual v8.0 and BV sheet v4.1 (Batches 26-28), TO:AUE v7.0 and the
  two IO sheets (14, 17), Total Warfare v11.01 (30), TO:AR v7.0 and SO:AAR v5.0 (34). The TechManual sheets
  for vehicle, ProtoMech, infantry and aerospace BV go with the domain catalogs.
- [x] Statistics audits: IO:AE prototype tables (Batch 14), TechManual tables (Batch 18), TO:AUE tables
  (Batch 19). Not covered: rows the name matcher could not pair (ProtoMech and battle armor weapons,
  capital weapons, industrial items priced per ton) and the special munition statistics (damage,
  rounds per ton, cost).
- [x] `_calcBattleValue` sorted `_equipmentList` in place; it now sorts a copy (Batch 27). The lazy
  refresh after a critical slot move is no longer needed for that reason and can be made direct.
- [x] Physical weapon to-hit modifiers (Batch 32, TW p.146 and TO:AUE p.216); one Supercharger per unit
  (Batch 21). Owed: play tracking adds the modifier to a Gunnery roll; physical attacks use Piloting.
- [x] Missing records (Batches 31, 34-36): Vehicular Grenade Launcher, Recon Camera, Primitive Prototype
  Long Tom and torpedo launchers, TSEMP Cannon / One-Shot / RISC Repeating, RISC Viral Jammers, BattleMech
  Taser and ammunition. The Clan ER PPC with Capacitor moved from custom to canon (IO:AE pp.40, 190, 197),
  reversing the 2026-09-28 classification; confirmed by the user.
- [x] Unit slot columns (Batches 28, 29, 33): ProtoMech, vehicle and aerospace slots follow the TM and
  TO:AUE tables; ProtoMech AC/8 set to the book's 1. Flag: Clan A-Pod prints NA for vehicles on TM p.343
  against 1 on the Inner Sphere row. No records exist for the Support Vehicle items of TM pp.344-345.

#### BattleMech construction and play gaps / IndustrialMechs and Primitive 'Mechs

- [x] IndustrialMechs (Batches 41, 42, 50, 56; upstream #103 and #105): cockpit and Advanced Fire Control,
  armor, engines (standard fusion, ICE, fuel cell, fission), standard gyro, single heat sinks, standard jump
  jets on fusion or fission only, no MASC or TSM, Industrial TSM, weight-free heat sinks by engine type,
  power amplifiers (TM pp.68-72). Checked against the book's CattleMaster, Buster and Uni.
- [x] Primitive BattleMechs and IndustrialMechs (Batch 57; upstream #105): the "Is a Primitive 'Mech"
  checkbox in step 1; engine rating x1.2, Primitive cockpit, Primitive or Commercial armor (IO:AE
  pp.116-118). Checked against the book's Mackie.
- [x] Dark Age armors on IndustrialMechs (Batch 58; upstream #105): mixed tech base at the Experimental
  rules level (IO:AE p.82).
- [x] Environmental Sealing (IndustrialMechs only, full-ton rounding) and Extended Fuel Tanks (Batch 60;
  upstream #107). Fire control to-hit in play: IndustrialMech +1 without Advanced Fire Control, Primitive
  IndustrialMech cockpit +2 / +1 (Batch 62; upstream #109).
- [x] RetroTech label (Batch 61; upstream #108): a Primitive 'Mech with anything introduced after 2500, or
  non-standard jump jets, is RetroTech; readouts print "Construction: ...". No hard pre-2501 limit: RetroTech
  may carry any era's equipment (IO:AE p.116).
- [x] Primitive record sheet, TRO and Alpha Strike card checked by eye (2026-10-02) with the book's Mackie
  (IO:AE pp.117-118): tonnage, engine 360 / 33 t, gyro, cockpit, 17 sinks (3 outside the engine), 214 armor
  points by location, structure, Primitive Prototype PPC at 15 heat, Experimental rules level (prototype
  equipment is Experimental, IO:AE p.112). The Alpha Strike card shows the specials problem below.

#### BattleMech construction and play gaps / Equipment still missing or unwired

- [x] Patchwork armor for 'Mechs (Batch 59; upstream #106): an armor type per location, weight rounded up
  to the half ton per location, per-location slots, BV and cost; the book's Griffin example (TO:AUE
  pp.188-189, 194; IO:AE p.82).
- [x] Colossal 'Mechs: IO:AE p.80 names the superheavy tripods "Colossals"; they build as a Tripod above 100
  tons (Batches 21-30).

#### Import and export adapters / Solaris Skunk Werks (`.ssw`)

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
- [x] The audit harness was a throwaway test; add it as a dev tool so it can be rerun. Done 2026-09-30:
  `src/utils/ssw-corpus-audit.test.ts`, skipped unless `SSW_AUDIT_DIR` is set. Run:
  `SSW_AUDIT_DIR=WorkingData_DEV/SSWdata SSW_AUDIT_OUT=<file> npx vitest run --project unit src/utils/ssw-corpus-audit.test.ts`.
  First run: 3110 BattleMech designs, 2961 with nothing unresolved, 2 parse failures (`model=""` on
  Summoner (Thor) and Puma (Adder)), 38 distinct unresolved names; 246 Primitive/Industrial designs skipped.
- [x] Approve the canon-pending SSW names table, then fill `src/data/ssw/ssw-canon-pending-names.ts`. Approved
  2026-09-30: 36 names, each with book and page; removing an entry is part of adding its catalog record.
- [x] Runtime importer: import any `.ssw` file from the UI (not only the bundled `sswMechs.ts` generated at
  build time), with the import review screen. Phase A1 of
  `docs/superpowers/plans/2026-09-30-ssw-runtime-import-custom-content.md`, done 2026-09-30: Mech Creator >
  Imports > "Import your own .ssw files". Unknown items become placeholder drafts saved in this browser
  (`custom-content-local.ts`), and saved designs keep them through a reload.

#### Import and export adapters / Shared

- [x] One equipment-name lookup for every format: `findImportedEquipment(name, faction, mixedTech)` in
  `src/utils/importedEquipment.ts`. It checks the faction catalog and the universal catalog by own name/tag,
  then the universal catalog, faction catalog, other faction (Mixed Tech only) and custom catalogs by
  `alternateName`/`altNames`/`altTags`. A format's spellings go on the records, never as name rewriting.

#### Fix what ships

- [x] `tools/mul-sync/browser-state.json` (masterunitlist.battletech.com session cookies, including
  `cf_clearance`) is untracked and git-ignored, and the weekly sync no longer commits it; CI runs start
  without saved cookies. Merged 2026-09-30.
- [x] Purge the old copies of `browser-state.json` from the history: rewritten and force-pushed on
  2026-09-30 (`master`, `CustomMUL`, `vehicle-motive-types`; unrelated branches kept their commit IDs). The
  cookies were anonymous (`_I_`, `cf_clearance`) and can't be revoked; they expire by 2027-09.
- [x] Report the SSW ammunition bug upstream. The ammunition catalog rename (`Ammo (SRM-6)` ->
  `SRM - Standard Ammo`, upstream #75) broke name matching in the SSW importer: 413 of the 512 bundled
  'Mechs lost their ammunition on import, on upstream's live site too. Upstream PR #91 (open), reworked on
  2026-09-30 to resolve names through the catalog records' `altNames` (`src/utils/importedEquipment.ts`).

#### Roadmap introduction

- [x] The two scanned Aces books (rulebook, Scouring Sands campaign book) OCR'd into `text/*.ocr.txt`
  (`ocr_rulebooks.py`, Tesseract 5.4); body text reads well, flowcharts and icons don't.

## Commit history

1113 commits, newest first (by author date).

### 2026-10

- 2026-10-06 `f159341d` TODO: upstream PRs #110-#112, archive move merged, local e2e note (ngcfells)
- 2026-10-06 `e4180838` MUL sync workflow: only add the archive folder once it exists (ngcfells)
- 2026-10-06 `88fd556c` TODO: JBTIICRework review, what was ported and what is open (ngcfells)
- 2026-10-06 `626ce020` MUL sync: keep the replaced-legacy archive with the tool, not under src/ (ngcfells)
- 2026-10-06 `fe45e4df` Tooling: clear the lint backlog and drop two phantom tsconfig entries (ngcfells)
- 2026-10-06 `2b4f03b0` SSW file import: refuse oversized batches before reading them (ngcfells)
- 2026-10-06 `32c8dc92` Load the bundled SSW 'Mechs as their own chunk instead of in the entry bundle (ngcfells)
- 2026-10-06 `9a0daf1e` AppRouter: remove its window listeners and import timer on unmount (ngcfells)
- 2026-10-06 `79dc0d15` Saves: report a failed localStorage write instead of losing it silently (ngcfells)
- 2026-10-02 `0a1f061e` more customs in the TODO (ngcfells)
- 2026-10-02 `0de0ce1d` updates to TODO... more will be added later. (ngcfells)
- 2026-10-02 `6cb0ef19` TODO: everything open from the IndustrialMech/Primitive/Patchwork work and the branch merges (ngcfells)
- 2026-10-02 `8994285a` getting up to date (ngcfells)
- 2026-10-02 `650c3984` Alpha Strike: keep TechManual weapon type codes and catalog notes off the card (WIP, full suite not yet run) (ngcfells)
- 2026-10-02 `c2efbc00` Master: repair the merged IndustrialMech tests and ledger spacing; TODO for #107-#109 (ngcfells)
- 2026-10-02 `e97c663a` Batch 62: IndustrialMech fire control in play (ngcfells)
- 2026-10-02 `3c668fe4` Batch 61: RetroTech (ngcfells)
- 2026-10-02 `24f18eea` Batch 60: Environmental Sealing and Extended Fuel Tanks for IndustrialMechs (ngcfells)
- 2026-10-02 `a1615f06` TODO: Primitive sheet checked against the Mackie; Alpha Strike specials problem noted (ngcfells)
- 2026-10-02 `5de0aaa2` TODO: Patchwork Armor done (#106); Fractional Accounting switch locked until built (ngcfells)
- 2026-10-02 `6ce71329` Batch 59: Patchwork Armor (ngcfells)
- 2026-10-02 `ba290e76` TODO: IndustrialMech limits, Primitive 'Mechs and Dark Age armors done (#105); chassis types checked (ngcfells)
- 2026-10-02 `d052ff74` Ledger: heat sinks on import (Batch 56) (ngcfells)
- 2026-10-02 `392957f6` Imports: subtract the engine's free heat sinks, not ten, from a file's heat sink total (ngcfells)
- 2026-10-02 `33591e77` Batches 56-58: IndustrialMech limits, Primitive 'Mechs, Dark Age armors on IndustrialMechs (ngcfells)
- 2026-10-02 `3266b94c` TODO: canon pass PRs #98-#104, rulings of 2026-10-01, merge into master (ngcfells)
- 2026-10-01 `c04456a5` Ledger: capital missile rating and ammunition units approved as recorded (ngcfells)
- 2026-10-01 `248dba27` Batch 53: battle armor armor catalog (ngcfells)
- 2026-10-01 `386325a0` Batch 52: ProtoMech component catalog (ngcfells)
- 2026-10-01 `41db219b` Batch 51: aerospace, large-craft and Support Vehicle armor catalogs (ngcfells)
- 2026-10-01 `38023935` Batch 49: capital and sub-capital weapon catalogs (ngcfells)
- 2026-10-01 `b1e29ed5` Ledger: rulings of 2026-10-01 (ngcfells)
- 2026-10-01 `660d0e69` Batch 55: placement limits and the Artemis IV all-launchers rule (ngcfells)
- 2026-10-01 `1cd3aaf5` Batch 54: industrial equipment for vehicles; fix vehicle equipment filter (ngcfells)
- 2026-10-01 `7490fe3a` Batch 50: IndustrialMech armor (TM pp.72, 205, 278, 315) (ngcfells)
- 2026-10-01 `f014b50e` Batches 47-48: command module, ejection systems, superheavy IndustrialMechs (ngcfells)
- 2026-10-01 `e05daa66` Batch 46: C3 Remote Sensor Launcher (TO:AUE pp.110, 195, 216-217) (ngcfells)
- 2026-10-01 `c91d0d78` Batches 44-45: RISC Laser Pulse Module and MRM Apollo FCS (ngcfells)
- 2026-10-01 `ec4f543a` Batch 43: HarJel II and III repair systems (IO:AE pp.82-83, 185, 215) (ngcfells)
- 2026-10-01 `c8a9355c` Batch 42: IndustrialMechs default to the plain cockpit (TM p.69) (ngcfells)
- 2026-10-01 `52a66472` Batch 41: cockpit selector and IndustrialMech Advanced Fire Control (TM pp.69, 211, 304) (ngcfells)
- 2026-10-01 `4bd4a253` Batch 40: Prototype Improved Jump Jets (IO:AE p.97) (ngcfells)
- 2026-10-01 `73f2967f` Batch 39: RISC Heat Sink Override Kit (IO:AE pp.86, 190) (ngcfells)
- 2026-10-01 `90615f7e` Batch 38: Coolant Pod with its Battle Value rule (TO:AUE pp.116, 193) (ngcfells)
- 2026-10-01 `bd7d1482` Batch 37: enforce engine requirements and one Viral Jammer per unit (ngcfells)
- 2026-10-01 `3e303d2a` Batch 36: BattleMech Taser and its ammunition (TO:AUE pp.157-158) (ngcfells)
- 2026-10-01 `b58d0e26` Batch 35: TSEMP weapons and RISC Viral Jammers (IO:AE pp.84-88) (ngcfells)
- 2026-10-01 `55e3f248` Batch 34: Primitive Prototype Long Tom and torpedo launchers; Clan ER PPC capacitor is canon (ngcfells)
- 2026-10-01 `b83bc382` Batch 33: ProtoMech AC/8 takes one ProtoMech slot (TO:AUE p.217) (ngcfells)
- 2026-10-01 `79407678` Batch 32: physical weapon to-hit modifiers (TW p.146, TO:AUE p.216) (ngcfells)
- 2026-10-01 `8a6e9249` Batch 31: Vehicular Grenade Launcher and Recon Camera (TO:AUE pp.127, 150) (ngcfells)
- 2026-10-01 `2ddc465d` Batch 30: Superheavy ammunition shares critical slots (IO:AE p.157) (ngcfells)
- 2026-10-01 `5582337e` Batch 29: TO:AUE unit slot columns and Long Tom on 'Mechs (TO:AUE pp.217-223) (ngcfells)
- 2026-10-01 `912aa8af` Batch 28: TechManual errata v8.0 check and unit slot columns (TM pp.341-345) (ngcfells)
- 2026-10-01 `c77b5584` Batch 27: Weapon Battle Rating order (TM p.303) (ngcfells)
- 2026-10-01 `4242384c` Batch 26: explosive ammunition BV penalty by location (TM p.302, TO:AUE p.193) (ngcfells)
- 2026-10-01 `f5bf8dc8` Batch 25: Superheavy 'Mechs are Inner Sphere tech base only (IO:AE p.154) (ngcfells)
- 2026-10-01 `aaec96a6` Batch 24: Superheavy critical space and cockpit slots (IO:AE pp.155-157) (ngcfells)
- 2026-10-01 `90f847b5` Batch 23: Rotary AC Caseless rounds move to the custom catalog (ngcfells)
- 2026-10-01 `96bc48f6` Batch 22: Superheavy 'Mech structure table and structure types (IO:AE p.155) (ngcfells)
- 2026-10-01 `e83683d6` Batch 21: Superheavy 'Mech equipment limits (IO:AE p.156) (ngcfells)
- 2026-10-01 `853dae4d` Batch 20: Dead-Fire ammunition BV per launcher (IO:AE p.190, errata v3.01) (ngcfells)
- 2026-10-01 `985d6cf8` Batch 12d: Inner Sphere munitions leave the universal ammo catalog (ngcfells)
- 2026-10-01 `e177b108` Batch 12c: special munitions dated and cited from IO:AE pp.53-56 (ngcfells)
- 2026-10-01 `bec84d6b` Batch 19: TO:AUE table audit of statistics (ngcfells)
- 2026-10-01 `d35e9c0e` Batch 18: TechManual table audit of BV, statistics, tech ratings and costs (ngcfells)
- 2026-10-01 `e3acc6dc` Batch 17: explosive weapons in Battle Value (TO:AUE errata v7.0) (ngcfells)
- 2026-10-01 `c7e21701` Batch 16: large engines as records in the engine types file (ngcfells)
- 2026-10-01 `af7cff60` Batch 15: split 'Mech Mortars, Artillery Cannons and Laser Insulator by tech base (ngcfells)
- 2026-10-01 `43caafe8` Batch 14: prototype weapon statistics, Superheavy gyro weight and BV (ngcfells)
- 2026-10-01 `8bb205ef` Batch 13: move Enhanced ER Large Laser and Enhanced Clan LRM 10 to custom (ngcfells)
- 2026-10-01 `498cbc28` Batch 12b: standard ammunition takes its launcher's dates and rules page (ngcfells)
- 2026-10-01 `09a2e8b0` Batch 12a: ammunition — null for never-extinct dates, one spelling per rulebook (ngcfells)
- 2026-10-01 `e5f4ee57` Batch 9c: add B-Pod (universal), M-Pod and Chaff Pod from TM and TO:AUE (ngcfells)
- 2026-10-01 `11830c45` Batch 11: jump jets — IO:AE dates for Improved Jump Jets and Clan UMUs, sources (ngcfells)
- 2026-10-01 `d8648179` Batch 10c: missiles and artillery — IO:AE dates, torpedo and one-shot fixes, pages (ngcfells)
- 2026-10-01 `434214b3` Batch 10b: ballistic weapons — IO:AE dates, prototype/production split, pages (ngcfells)
- 2026-10-01 `1c9b112a` Batch 10a: energy weapons — IO:AE dates, prototype/production split, pages (ngcfells)
- 2026-10-01 `59facc60` Batch 9b: universal equipment — IO:AE dates and pages, artillery cannon prototype (ngcfells)
- 2026-10-01 `ea7c28fb` Batch 9a: IS and Clan misc equipment — IO:AE dates, pages, Modular Armor cost (ngcfells)
- 2026-10-01 `a783584f` Batch 8: cockpit catalog; superheavy tripod cockpit is 5 tons (IO:AE p.156) (ngcfells)
- 2026-10-01 `07027e3d` Batch 7: heat sinks — TM p.220 date for singles, IO:AE cites, null for unknown (ngcfells)
- 2026-10-01 `a3376f79` Batch 6b: Vehicular Stealth and EDP armor; BattleMech Stealth off vehicles (ngcfells)
- 2026-10-01 `bcf70d5c` Re-cite Batches 2-5 dates to IO:AE (newest publication); fix Supercharger page (ngcfells)
- 2026-10-01 `f9693da8` Batch 6: armor — sources, IO:AE dates, unit types, null for unknown (ngcfells)
- 2026-10-01 `b0c82853` Batch 5: internal structure — sources, IO dates, null for unknown (ngcfells)
- 2026-10-01 `a3babf8a` Tests: explicit time limit for the 1,000-vehicle restore test (ngcfells)
- 2026-10-01 `d6409c23` TODO: canon equipment pass status through Batch 55 (ngcfells)
- 2026-10-01 `19ac018b` TODO: Batches 37-41 (ngcfells)
- 2026-10-01 `871b9d6d` TODO: Batches 33-36 (ProtoMech AC, missing records, errata done) (ngcfells)
- 2026-10-01 `23a0822d` TODO: Batches 31-32 (two missing records, physical weapon to-hit modifiers) (ngcfells)
- 2026-10-01 `c08de147` TODO: superheavy rules done through Batch 30 (ngcfells)
- 2026-10-01 `b05b1749` TODO: canon equipment pass status after Batches 23-29 (ngcfells)
- 2026-10-01 `78e5dd11` TODO: superheavy critical slots still owed; Batches 21-22 done (ngcfells)
- 2026-10-01 `273edd46` TODO: canon pass progress (Batches 19, 12c, 12d, 20) (ngcfells)
- 2026-10-01 `2a572030` TODO: canon pass progress (Batches 13-18) and newly owed items (ngcfells)
- 2026-10-01 `ff5b320e` Vehicles: complete Combat Vehicle rules, import hardening and security guard rails (#85) (ngcfells)
- 2026-10-01 `b260bf38` TODO: items still owed from the canon equipment pass (ngcfells)
- 2026-10-01 `6c960578` TODO: cockpit selector and cockpit era gating (ngcfells)
- 2026-10-01 `06ca9dc9` TODO: support vehicle motive types, IndustrialMech / Primitive 'Mech builds, Compact 'Mechs (custom) (ngcfells)

### 2026-09

- 2026-09-30 `330a1ff6` Batch 4: engines — sources, IO dates, null for unknown extinct/reintroduced (ngcfells)
- 2026-09-30 `8bd32b14` Batch 3: myomer — sources, IO dates, Super-Cooled Myomer, ProtoMech Myomer Booster (ngcfells)
- 2026-09-30 `e3d0413e` Batch 2: gyros — sources, IO dates, superheavy gyro weight/slots (ngcfells)
- 2026-09-30 `3285e27d` Equipment: one "Miscellaneous Equipment" category label (ngcfells)
- 2026-09-30 `298bee23` SSW: approved canon-pending names (never drafted as custom) (ngcfells)
- 2026-09-30 `78d653cb` SSW import: fixes from the branch review (ngcfells)
- 2026-09-30 `b4458aa1` SSW runtime import: e2e test and TODO (ngcfells)
- 2026-09-30 `82cd0a46` Mech Creator: import .ssw files from disk with a review screen (ngcfells)
- 2026-09-30 `b9ec47d1` SSW: batch import session with drafts and re-import (ngcfells)
- 2026-09-30 `da9a34cf` SSW: build custom content drafts from unresolved items (ngcfells)
- 2026-09-30 `cd64ce84` SSW: canon-pending names list (empty until reviewed) (ngcfells)
- 2026-09-30 `5c215d8a` SSW: corpus audit dev tool (env-gated) (ngcfells)
- 2026-09-30 `2eeacb8b` SSW import: report unresolved items and components; critical slot occupancy (ngcfells)
- 2026-09-30 `b0b3df9c` Custom components: seven custom catalogs, a tiered registry, setters and rules level (ngcfells)
- 2026-09-30 `40f76c15` Test: give the backup restore cap test the 20 s it asserts (ngcfells)
- 2026-09-30 `4a7031d6` Custom content: local draft store, registered with the equipment lookups (ngcfells)
- 2026-09-30 `141fd558` Custom content: shared types and submitter-tagged custom tags (ngcfells)
- 2026-09-30 `f01ab6ca` BattleMech: restore custom equipment from a save (canon first) (ngcfells)
- 2026-09-30 `6b41d9b4` Plan: build phase A1 now, defer PR submission (A2) (ngcfells)
- 2026-09-30 `700d843f` Plan: runtime SSW import and custom content submission (ngcfells)
- 2026-09-30 `5f15de27` Spec A: registry test matches the gating rule (ngcfells)
- 2026-09-30 `9e13ee67` Spec A: estimated slot counts, canon-pending guard, component gating (ngcfells)
- 2026-09-30 `834ef8f2` SSW import: read the engine, gyro, structure, cockpit, armor, heat sinks and jump jets correctly (ngcfells)
- 2026-09-30 `da55991b` Spec: runtime SSW import, custom content intake and PR submission (ngcfells)
- 2026-09-30 `3ab01f06` AlphaStrikeUnit.setStructure(): set structure, not armor (ngcfells)
- 2026-09-30 `01c4d497` TODO: BattleTech Aces plan, with the AS-Aces work ticked off (ngcfells)
- 2026-09-30 `3946f1d1` Aces: card library, card reader, rules switch and sortie play (ngcfells)
- 2026-09-30 `eec58df2` Alpha Strike: BattleTech Aces companion (game tracker, campaigns, rules) (ngcfells)
- 2026-09-30 `a0eb5008` cleanup on mds for me (ngcfells)
- 2026-09-30 `7a225188` cleanup on mds for me (ngcfells)
- 2026-09-30 `f0f7aa8d` SSW import: set the era from the design year (ngcfells)
- 2026-09-30 `92cc23ba` Clan eras, Star League carry-over, IO date fixes and MUL faction ids (ngcfells)
- 2026-09-30 `f6b71e5d` TODO: browser-state.json purged from the history (ngcfells)
- 2026-09-30 `c8f3844e` TODO: import resolver rework, Aces OCR, remaining SSW gaps (ngcfells)
- 2026-09-30 `1f902395` Import: resolve equipment through catalog altNames, not name rewriting (ngcfells)
- 2026-09-30 `40f03dbd` TODO: point to the rulebook library; update the missing-books list (ngcfells)
- 2026-09-30 `216eb35e` Minor security fix: pin the license files' content in a test (ngcfells)
- 2026-09-30 `fbc32cb6` Guard the license files: pin their content in a blocking test (ngcfells)
- 2026-09-30 `02ce8f54` Remove unused tools/mul-sync/ensure-chromium-windows.mjs; TODO: file-state cleanup audit (ngcfells)
- 2026-09-30 `47324799` Weekly MUL sync: keep the bundled Master Unit List current (ngcfells)
- 2026-09-30 `84063f2c` TODO: the MUL branch is retired; only the history purge is left (ngcfells)
- 2026-09-30 `faa8deaf` MUL sync workflow: run against master instead of the retired MUL branch (ngcfells)
- 2026-09-30 `e3187ae3` MUL sync: stop committing browser session cookies (ngcfells)
- 2026-09-30 `0d050103` Test: bundled SSW 'Mechs import their ammunition (Atlas AS7-D) (ngcfells)
- 2026-09-29 `2c848142` SSW import: resolve SSW equipment names, Clan and Mixed designs (ngcfells)
- 2026-09-29 `9e21b1f4` TODO: clear completed work, add the import/export and unit-domain plan, prioritize (ngcfells)
- 2026-09-29 `e2b4ae2e` SSW import: resolve SSW equipment names, Clan and Mixed designs (ngcfells)
- 2026-09-29 `631c43b5` Remove JSX type imports duplicated by the branch merges (ngcfells)
- 2026-09-29 `128ee251` Alpha Strike ability filter: keep edits clear of the pagination change (ngcfells)
- 2026-09-29 `9df57518` Alpha Strike search: filter units by special ability (ngcfells)
- 2026-09-29 `47118484` Alpha Strike search: page the results so a whole-MUL search can't lock the page (ngcfells)
- 2026-09-29 `2d7b8f8d` Vehicles: validate imports end to end, match tags through altTags, TO:AUE rules levels (ngcfells)
- 2026-09-29 `59cb4823` Vehicles: explosive weapons, armor-piercing criticals, skid and jump rolls, sponson turrets (ngcfells)
- 2026-09-29 `9a744389` Security: validate imported vehicles, escape calculation logs, add guard rails (ngcfells)
- 2026-09-29 `9062f21c` Deploy scripts: pass --dotfiles so .nojekyll gets pushed (#84) (HeySporky)
- 2026-09-29 `7f92cece` Add .nojekyll to disable GitHub Pages Jekyll filtering (Kingler)
- 2026-09-29 `dfaa76a6` Vehicles: ammunition explosions, firing arcs, hull integrity, crashes and Super-Heavy hit locations (ngcfells)
- 2026-09-29 `6a070695` Vehicles: Total Warfare hit location, critical hit and motive damage tables (ngcfells)
- 2026-09-29 `8943cd96` Vehicles: Total Warfare hit location, critical hit and motive damage tables (ngcfells)
- 2026-09-29 `8f2140b9` Vehicles: Total Warfare hit location, critical hit and motive damage tables (ngcfells)
- 2026-09-29 `dc8e810e` [retrospective, do not merge] Security fixes already shipped to master — documentation + review (#82) (HeySporky)
- 2026-09-29 `7e01b14f` Security: harden TRO HTML, SVG image URLs and alert links (Kingler)
- 2026-09-29 `4734b5d5` Security: escape calc-log HTML and clarify GitHub token storage (Kingler)
- 2026-09-29 `b77bf1fc` Vehicles: every motive type, full construction, BV/cost, Alpha Strike and roster play (ngcfells)
- 2026-09-29 `d840447f` Vehicle Creator: Combat Vehicle construction, saves and record sheet (Tracked) (ngcfells)
- 2026-09-29 `d17342de` LAMs: construction limits, bombs and fuel, Battle Value, cost and play modes (ngcfells)
- 2026-09-29 `db0f2a88` Tripods: center leg location, construction, record sheet and play rules (ngcfells)
- 2026-09-29 `288e8163` QuadVees: construction, cost, record sheet and play-mode transformation (ngcfells)
- 2026-09-29 `2f2838db` Quads: front-leg hits, criticals, record sheet armor and older saves (ngcfells)
- 2026-09-29 `4d849310` Mech Creator, equipment editor, roster and print UI for the new model (ngcfells)
- 2026-09-29 `50930c58` Alpha Strike abilities: book and page for every special and pilot ability (ngcfells)
- 2026-09-29 `bb2e79df` BattleMech: build, BV, cost and criticals on the equipment registry (ngcfells)
- 2026-09-29 `514b07c9` Construction components: engines, gyros, structure, armor, heat sinks, jump jets, myomer (ngcfells)
- 2026-09-29 `0acbd958` Equipment: canonical IS / Clan / Universal / Custom catalogs and a registry (ngcfells)
- 2026-09-29 `5fe3fdaa` Alpha Strike: search the bundled Master Unit List and build cards from it (#81) (ngcfells)
- 2026-09-29 `94de3719` License: replace the unfilled MIT template with GPLv3 to match the codebase (#74) (ngcfells)
- 2026-09-29 `df9605a0` Modernize tooling: Vite 8, Node 26, React 19, TypeScript 7, tests and CI (#73) (ngcfells)
- 2026-09-29 `8822ab6f` Fix setEngine: clear the engine when no engine has the requested rating (#72) (ngcfells)
- 2026-09-29 `98a25155` Fix BV Speed Factor for units above 25 MP (TechManual p. 316) (#70) (ngcfells)
- 2026-09-29 `248342d9` Vehicles: every motive type, full construction, BV/cost, Alpha Strike and roster play (ngcfells)
- 2026-09-29 `7add075d` Vehicles: Classic roster play mode (ngcfells)
- 2026-09-29 `27894622` Vehicles: Alpha Strike conversion, printable card, troop space (ngcfells)
- 2026-09-29 `5155233e` Vehicles: Battle Value and C-Bill cost (ngcfells)
- 2026-09-29 `1327559a` Vehicles: crew, heat sinks, power amplifiers, dual turrets, Superheavy locations, jump jets, item slots (ngcfells)
- 2026-09-29 `3c2916b3` Vehicle Creator: Wheeled, Hover, VTOL, WiGE and naval vehicles (ngcfells)
- 2026-09-29 `4cff835f` TODO: record the upstream PR stack and the bugs fixed while splitting it (ngcfells)
- 2026-09-29 `25c7cd20` MUL 2.0 cards: chassis name, armor threshold and the Rules filter (ngcfells)
- 2026-09-29 `22580783` Alpha Strike: search the bundled Master Unit List and build cards from it (ngcfells)
- 2026-09-29 `7c374ff2` Vehicle Creator: Combat Vehicle construction, saves and record sheet (Tracked) (ngcfells)
- 2026-09-29 `ef910c9b` LAMs: construction limits, bombs and fuel, Battle Value, cost and play modes (ngcfells)
- 2026-09-29 `e87a1fd1` Tripods: center leg location, construction, record sheet and play rules (ngcfells)
- 2026-09-29 `231faa05` QuadVees: construction, cost, record sheet and play-mode transformation (ngcfells)
- 2026-09-29 `9b0c9a9a` Quads: front-leg hits, criticals, record sheet armor and older saves (ngcfells)
- 2026-09-29 `352fd2f7` Mech Creator, equipment editor, roster and print UI for the new model (ngcfells)
- 2026-09-29 `cd0c7b95` Alpha Strike abilities: book and page for every special and pilot ability (ngcfells)
- 2026-09-29 `8f06fd5b` BattleMech: build, BV, cost and criticals on the equipment registry (ngcfells)
- 2026-09-29 `6b09927a` Construction components: engines, gyros, structure, armor, heat sinks, jump jets, myomer (ngcfells)
- 2026-09-29 `7b38585d` Equipment: canonical IS / Clan / Universal / Custom catalogs and a registry (ngcfells)
- 2026-09-29 `903e29da` License: replace the unfilled MIT template with GPLv3 to match the codebase (ngcfells)
- 2026-09-29 `4118cad9` Tripods: show the Center Leg in the play-mode Critical Hits dialog (ngcfells)
- 2026-09-29 `8204a3f9` Quads: front-leg hits, criticals, record sheet armor and older saves (ngcfells)
- 2026-09-29 `095ed985` Play mode: let Bipeds, Quads and Tripods jump again (ngcfells)
- 2026-09-29 `0ab2bd04` License: replace the unfilled MIT template with GPLv3 to match the codebase (ngcfells)
- 2026-09-29 `aa662d8c` Data README: point to the GPLv3 LICENSE, not LICENSE-MIT (ngcfells)
- 2026-09-29 `6159d538` Stop tracking local-only .claude agent and rules files (ngcfells)
- 2026-09-29 `d3cfae01` Remove the nightly wip-sync-branch merge; the branch is retired (ngcfells)
- 2026-09-29 `26c25a8d` Adopt the modernize-tooling README; fix CustomMUL imports for React Router 8 (ngcfells)
- 2026-09-29 `7461874a` Fix setEngine: clear the engine when no engine has the requested rating (ngcfells)
- 2026-09-29 `1ead6439` README: setup for every platform, npm scripts, deploying, tests and CI (ngcfells)
- 2026-09-29 `3f6beda6` Tests: assert upstream behaviour; E2E fails on any page error (ngcfells)
- 2026-09-29 `69bf84b5` SVG text: replace invalid textAnchor values with "start" (ngcfells)
- 2026-09-29 `53e321a0` tsconfig: target ES2017 (TypeScript 7 removed ES5) (ngcfells)
- 2026-09-29 `c25ad002` Scope JSX types to the react module (types-react-codemod scoped-jsx) (ngcfells)
- 2026-09-28 `621532f3` E2E: allow 15 s for assertions on CPU-heavy cold starts (ngcfells)
- 2026-09-28 `b1550abf` Upgrade React Router 7.18 -> 8.4; raise Node 22 floor to 22.22 (ngcfells)
- 2026-09-28 `8e42fd92` Add CI: OS x Node matrix, browser-mode tests, and Playwright E2E (ngcfells)
- 2026-09-28 `a6f7a058` Anchor build/work/old/boneyard ignore rules to the repository root (ngcfells)
- 2026-09-28 `4549680a` Migrate Sass off deprecated @import and global color functions (ngcfells)
- 2026-09-28 `3d1a64e7` Add test harness: Vitest 5 (unit + browser mode) and Playwright E2E (ngcfells)
- 2026-09-28 `90d556e5` Upgrade runtime deps to latest: React 19.3, React Router 7.18, fast-xml-parser 5 (ngcfells)
- 2026-09-28 `44b90eda` Update build/lint toolchain to latest; add TypeScript 7 typecheck; commit lockfile (ngcfells)
- 2026-09-28 `d3176430` Replace react-game-icons with react-icons/gi; drop unused and deprecated deps (ngcfells)
- 2026-09-28 `9569f653` Finish ESM conversion for Vite: drop remaining require() and process.env.NODE_ENV (ngcfells)
- 2026-09-28 `6346ed29` Pin Node 26 baseline, accept Node 22.12+/24, and track package-lock.json (ngcfells)
- 2026-09-28 `1eb31249` Update MUL sync and nightly workflows to current actions and Node 26 (ngcfells)
- 2026-09-28 `bfc631b0` Skip allocation-table entries for armor with fixed critical locations (ngcfells)
- 2026-09-28 `cda23fb1` TODO: markdownlint-clean table separator in the lint backlog (ngcfells)
- 2026-09-28 `1c303794` TODO: record the allocation and startup fixes and two open SSW import issues (ngcfells)
- 2026-09-28 `4a5b7abf` Import bundled SSW mechs in time slices instead of one blocking loop (ngcfells)
- 2026-09-28 `a8b4d81d` Fix critical allocation: fall back to tag + rear when the UUID does not match (ngcfells)
- 2026-09-28 `07bb6afa` E2E: allow 15 s for assertions on CPU-heavy cold starts (ngcfells)
- 2026-09-28 `a9506f07` Fix ATM/iATM launchers not matching any ammunition after the tag rename (ngcfells)
- 2026-09-28 `410992b2` Make master typecheck clean; restore code commented out by 179803d2 (ngcfells)
- 2026-09-28 `f5e56c1d` Upgrade React Router 7.18 -> 8.4; raise Node 22 floor to 22.22 (ngcfells)
- 2026-09-28 `4f8a77de` Remove duplicated setEngine(0) regression test (ngcfells)
- 2026-09-28 `062581ac` Update TODO: modernization status, engine bugs, regenerated lint backlog (ngcfells)
- 2026-09-28 `dfe3676c` Restore README and GPLv3 licensing; document setup for every platform (ngcfells)
- 2026-09-28 `2030e97f` Add CI: OS x Node matrix, browser-mode tests, and Playwright E2E (ngcfells)
- 2026-09-28 `585deb34` Anchor build/work/old/boneyard ignore rules to the repository root (ngcfells)
- 2026-09-28 `af3c87ad` Fix BV Speed Factor crash on odd Jump MP; use the canonical formula (ngcfells)
- 2026-09-28 `f913ab37` Fix setEngine(0): clear the engine instead of logging an error (ngcfells)
- 2026-09-28 `529ac751` Fix BV Speed Factor for units above 25 MP (TechManual p. 316) (ngcfells)
- 2026-09-28 `8df3a8a7` Migrate Sass off deprecated @import and global color functions (ngcfells)
- 2026-09-28 `77122140` Add test harness: Vitest 5 (unit + browser mode) and Playwright E2E (ngcfells)
- 2026-09-28 `d0593adb` Upgrade runtime deps to latest: React 19.3, React Router 7.18, fast-xml-parser 5 (ngcfells)
- 2026-09-28 `8fe0e3fb` Scope JSX types to the react module (types-react-codemod scoped-jsx) (ngcfells)
- 2026-09-28 `57b2037f` Update build/lint toolchain to latest; add TypeScript 7 typecheck; commit lockfile (ngcfells)
- 2026-09-28 `c7096ec9` Replace react-game-icons with react-icons/gi; drop unused and deprecated deps (ngcfells)
- 2026-09-28 `f2355680` Finish ESM conversion for Vite: drop remaining require() and process.env.NODE_ENV (ngcfells)
- 2026-09-28 `7f196729` Pin Node 26 baseline, accept Node 22.12+/24, and track package-lock.json (ngcfells)
- 2026-09-28 `dae65af2` Add custom MUL entries with local save and pull-request submission (ngcfells)
- 2026-09-28 `1be20e1e` Reconcile MUL 1.0 data against MUL 2.0 and add a MUL source selector (ngcfells)
- 2026-09-28 `9b8b2d31` clean up (ngcfells)
- 2026-09-28 `5a185b7f` LAM work (ngcfells)
- 2026-09-28 `d54a9038` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-28 `af1b4b3a` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-28 `a843903e` Update top-menu.tsx adding vehicle to menu (ngcfells)
- 2026-09-28 `5fa1d7ef` Update era-options.ts (ngcfells)
- 2026-09-28 `6cefaa46` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-28 `999e7865` Burning down the TODO (ngcfells)
- 2026-09-28 `143ab2a9` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-28 `f0418cc9` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-28 `15421a3b` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-27 `94d9e029` prepping a new session (ngcfells)
- 2026-09-27 `09a20575` update disclaimers. (ngcfells)
- 2026-09-27 `86ca34e0` updating license on all branches (ngcfells)
- 2026-09-27 `b0308c42` Add updated LICENSE and LICENSE-MIT files from wip-sync-branch (ngcfells)
- 2026-09-27 `0b35a80d` Update README.md from upstream master (ngcfells)
- 2026-09-27 `fc9d8f9e` Updating license to be correct based on verbiage and honoring the original license file. Some fixes in files (ngcfells)
- 2026-09-27 `9f38570d` Upgraded to Claude and am getting everything in... (ngcfells)
- 2026-09-27 `41005640` Misc equipment batch 1, Compact heat sinks, myomer and variable-size gear (ngcfells)
- 2026-09-27 `df6a6c29` Canon catalog audit: ammo model, engines, weapons inventory, internals (ngcfells)
- 2026-09-27 `7c2ef90f` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-27 `fd4b1c8e` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-27 `3259fbd4` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-27 `dd47774b` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-27 `61f4f4df` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-26 `2675da3b` some customs and more ammo (ngcfells)
- 2026-09-26 `3611cd74` Sync tools/mul-sync and mul weekly sync workflow (ngcfells)
- 2026-09-26 `8e42ea51` Sync tools/mul-sync and mul weekly sync workflow (ngcfells)
- 2026-09-26 `cebf3c17` Enhance detail scraping and archiving process. Did we get something this run or not? Stop relying only on the artifacts to tell... (ngcfells)
- 2026-09-26 `0733c17b` Update max_detail default value and description (ngcfells)
- 2026-09-26 `61a4d780` add to gitignore for MUL cookies and updates to the workflow (ngcfells)
- 2026-09-26 `ffde051d` more scrape fixes with Cloudflare resolvers (ngcfells)
- 2026-09-26 `0e9a99c4` fix for Cliudflare html response as opposed to JSON... (ngcfells)
- 2026-09-26 `8d9ac13e` ammo work (ngcfells)
- 2026-09-26 `0dbef823` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-26 `3477f478` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-26 `eda7c0f3` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-26 `61c51a30` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-26 `3773d3b2` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-25 `628d5b93` a few more ammo mods... more to come (ngcfells)
- 2026-09-25 `748b4d13` Preserve MUL sync output and rebase before push (ngcfells)
- 2026-09-25 `c0ee82b8` Compose custom-rule ammo from chassis tech and universal catalogs (ngcfells)
- 2026-09-25 `9c6ceb57` Fix centralized ammo array and ATM compatibility tags (ngcfells)
- 2026-09-25 `8e834297` Centralize embedded weapon ammunition in universal catalog (ngcfells)
- 2026-09-25 `993a2c90` Refresh persisted MUL query when search modal opens (ngcfells)
- 2026-09-25 `b74be152` Normalize live MUL records to roster metadata schema (ngcfells)
- 2026-09-25 `46bc5243` Prefer fresh bundled MUL data over persisted search cache (ngcfells)
- 2026-09-25 `d55f92a5` Retire self-hosted runner option from MUL sync workflow (ngcfells)
- 2026-09-25 `41f8f5cd` Retire self-hosted runner option from MUL sync workflow (ngcfells)
- 2026-09-25 `e571b643` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-25 `fcc81f52` Archive legacy records only against fully populated MUL entries and commit archive output (ngcfells)
- 2026-09-25 `465bb35e` Archive legacy records only against fully populated MUL entries and commit archive output (ngcfells)
- 2026-09-25 `0d481204` Consolidate .gitignore and untrack build and local-only artifacts (ngcfells)
- 2026-09-25 `55f9ca97` Consolidate .gitignore and untrack build and local-only artifacts (ngcfells)
- 2026-09-25 `1bd5ca85` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-25 `33b7cfab` Allow MUL loader test time for full live dataset (ngcfells)
- 2026-09-25 `575ef9c9` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-25 `ec242bb7` Match legacy Class and Variant fields to live name and model (ngcfells)
- 2026-09-25 `8b80d128` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-25 `f62c8c07` Archive legacy records only on exact name and model matches (ngcfells)
- 2026-09-25 `993833fc` Stop tracking node_modules on wip branch (ngcfells)
- 2026-09-25 `6682bb8e` Stop tracking node_modules and remove committed dependency fixtures (ngcfells)
- 2026-09-25 `70b0eb0c` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-25 `dfdab56e` Set detail sync batch default to 700 for six-hour runtime headroom (ngcfells)
- 2026-09-25 `aca9d628` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-25 `a40561cd` Use PowerShell for Windows self-hosted sync push step (ngcfells)
- 2026-09-25 `b10d9816` Fix Windows PATH for Git Bash push step; commit first real detail-scrape data (30 units, faction availability for all 8711) (ngcfells)
- 2026-09-25 `bbe3c84d` Use full Chromium build via channel:chromium; headless-shell was getting Cloudflare-blocked (ngcfells)
- 2026-09-25 `95f7f209` Work around playwright-core downloader timeouts on Windows self-hosted runner (ngcfells)
- 2026-09-25 `45d4b201` Fix Windows self-hosted runner picking WSL bash stub instead of Git Bash (ngcfells)
- 2026-09-25 `85bf2d4c` Support optional self-hosted runner for manual backfill runs (ngcfells)
- 2026-09-25 `2a52c73c` Fetch index files sequentially with pacing instead of bursting Promise.all (ngcfells)
- 2026-09-25 `e50eba2d` Capture faction/era availability from the live index (bulk fetch, no per-unit scraping) (ngcfells)
- 2026-09-25 `3ed871d8` Wait for stats grid to render before scraping detail; retry 28 falsely-marked entries (ngcfells)
- 2026-09-25 `f5385981` Weekly MUL sync from masterunitlist.battletech.com (github-actions[bot])
- 2026-09-25 `c001040a` Preserve partial progress on abort; add cooldown-and-retry before giving up on repeated blocks (ngcfells)
- 2026-09-24 `c6aef9d7` Add configurable batch size input and concurrency guard for manual backfill runs (ngcfells)
- 2026-09-24 `1cd7aa32` Classify 403/429 on data endpoints as Cloudflare blocks with retry/backoff (ngcfells)
- 2026-09-24 `7a80d94c` Distinguish Cloudflare blocks from real failures; Node 24; safer git push diagnostics (ngcfells)
- 2026-09-24 `c02b7fb6` gitignore mod (ngcfells)
- 2026-09-24 `7183b40c` Add weekly MUL sync workflow (ngcfells)
- 2026-09-24 `7b66cd2a` space linting (ngcfells)
- 2026-09-24 `8375282b` more mul (ngcfells)
- 2026-09-24 `2636a10c` break out mul list into chunks (ngcfells)
- 2026-09-24 `47e2abfa` Update mech-clan-ammo.ts (ngcfells)
- 2026-09-24 `dbccd70a` Update mech-clan-equipment-weapons-ballistic.ts (ngcfells)
- 2026-09-23 `06eec422` just a deploy (ngcfells)
- 2026-09-23 `579b35a9` More Ammo... mostly cleanup this time... But still more to come... Ballisitcs next. (ngcfells)
- 2026-09-23 `0b48e2a7` deploy change... thought .gitignore has this... will need to look at my rules later and figure out why this is popping... shouldnt be (ngcfells)
- 2026-09-23 `c102623c` Big Missile Push (ngcfells)
- 2026-09-23 `ab99f60c` Armor updates (ngcfells)
- 2026-09-23 `749d5178` Add nightly wip sync workflow (ngcfells)
- 2026-09-23 `711d4aba` Remove nested battletech-tools directory (ngcfells)
- 2026-09-23 `aefbaa24` more ammo... there will be lots more ammo... (ngcfells)
- 2026-09-23 `e751560d` Update ignore rules after merge (ngcfells)
- 2026-09-23 `44ce5158` about update (ngcfells)
- 2026-09-23 `f245e03e` ATMs wired in. Ammo cleanup and rework, some bugs cleaned in UI - Still in Alpha (ngcfells)
- 2026-09-22 `ffb16178` Populate battle armor Alpha Strike stats (ngcfells)
- 2026-09-22 `fffe15f0` Add battle armor to offline MUL cache (ngcfells)
- 2026-09-22 `0431a507` Add offline MUL JSON fallback (ngcfells)
- 2026-09-22 `896c96f4` Update mech-clan-equipment-weapons-artillery.ts (ngcfells)
- 2026-09-22 `bab2d94d` iconchange (ngcfells)
- 2026-09-22 `97dea5c4` removed stray nested folder set that was not needed. (ngcfells)
- 2026-09-21 `51af98df` Add remaining working and conversion files (ngcfells)
- 2026-09-21 `39d39699` 10k up (ngcfells)
- 2026-09-21 `092fb85f` We can now add tracked vehicles... alpha for bugs (ngcfells)
- 2026-09-21 `dd3a744a` Build enforcement for ultralights and colossals (ngcfells)
- 2026-09-20 `42f56c3e` big push for weapons... clean up needed. (ngcfells)
- 2026-09-19 `3455b568` turning the red off. (ngcfells)
- 2026-09-19 `ab973dfa` cleaning up my helpers (ngcfells)
- 2026-09-18 `f68ed3d8` adding in weaps and cleaning up 0s in the MUL (ngcfells)
- 2026-09-18 `b416c5eb` Added ability to search our offline MUL just like the original except for faction availability as that was not tracked in the JSON... if that feature is needed we will need to generate the information and add to the array and then build that search option. (ngcfells)
- 2026-09-18 `a332a5ba` Got the MUL list populated from a JSON pull of the MUL... but does not have AS stats for the mechs... will need to work on getting that in too... (ngcfells)
- 2026-09-18 `2e940f7c` push up and pul ldown (ngcfells)
- 2026-09-18 `f71ee807` Finalize LAM QuadVee and Tripod play rules (ngcfells)
- 2026-09-18 `0e672e56` css? (ngcfells)
- 2026-09-18 `f7de1ee3` Making it red... are we stale or do we see the change. (ngcfells)
- 2026-09-18 `113aee56` tests (ngcfells)
- 2026-09-18 `a72698ba` Step 6? (ngcfells)
- 2026-09-18 `4648db5d` Steps 1 and 2, no go. Step 4? (ngcfells)
- 2026-09-18 `e2740639` Step 2 Engines? (ngcfells)
- 2026-09-18 `14054dfc` Step 1 fixes? (ngcfells)
- 2026-09-18 `aa59cf4e` updating READMEs (ngcfells)
- 2026-09-18 `c1a6831b` TODO refreshed with new feature development. (ngcfells)
- 2026-09-18 `7a1296c3` Clean remaining ESLint warnings (ngcfells)
- 2026-09-18 `725306ef` Code split application routes (ngcfells)
- 2026-09-18 `bd1195dc` Set up Vitest catalog tests (ngcfells)
- 2026-09-18 `afae0732` Hopefully getting all the step pages rendering correctly... autotest comes clean need to do in browser test manually. Removed all old require references and converted imports to ESM. (ngcfells)
- 2026-09-18 `179803d2` ESLint Error/Warning cleanup. gitignore updates. (ngcfells)
- 2026-09-18 `c022a33a` Create pentaHexa.md (ngcfells)
- 2026-09-18 `543fc425` Restore MUL list export (ngcfells)
- 2026-09-18 `8c9f0716` Update to AlphaStrike 7.02 Looking into AlphaStrike Aces... (ngcfells)
- 2026-09-18 `b3b772a0` Update alpha-strike-special-abilities.ts pt 1 (ngcfells)
- 2026-09-18 `f543da4d` merge of MUL JSON... now to go get the rest of the data somewhere... (ngcfells)
- 2026-09-17 `f6439fc1` Remove react-scripts/Jest/CRA remnants, drop Node engines pin, move to TypeScript 6.0.3 (widest current support), add flat ESLint config, fix vite preview base-path bug, clean up env type files (ngcfells)
- 2026-09-17 `ce516901` Vite scaffold: add vite.config.mts, root index.html, PUBLIC_URL shim; keep CRA scripts as build:cra fallback during migration (ngcfells)
- 2026-09-17 `4a58f1b1` organizing... (ngcfells)
- 2026-09-17 `1e8589a5` cleaning (ngcfells)
- 2026-09-17 `a87dd71c` partial break in JSON. (ngcfells)
- 2026-09-17 `5954493c` local build... need to add some .gitignores going forward. (ngcfells)
- 2026-09-17 `942b97d1` Fix mech creator chassis layouts and rules level selection (ngcfells)
- 2026-09-17 `f515d2cf` Migration to Vite, Node 24, TS 6, added quick SVG for Tripod. Created lint to do list of errors found across rest of codebase (ngcfells)
- 2026-09-17 `fa78ef7c` Add interactive Tripod center leg record sheet support (ngcfells)
- 2026-09-17 `77c04e15` Fix LAM incorrectly routing to Quad diagrams; add Tripod Center Leg readout stopgap; document missing Tripod artwork in TODO.md (ngcfells)
- 2026-09-17 `8bc1abc3` Add TODO.md tracking migration status and the full 191-item lint backlog (ngcfells)
- 2026-09-17 `0f39e4c0` Remove react-scripts/Jest/CRA remnants, drop Node engines pin, move to TypeScript 6.0.3 (widest current support), add flat ESLint config, fix vite preview base-path bug, clean up env type files (ngcfells)
- 2026-09-17 `7ddd8569` Vite scaffold: add vite.config.mts, root index.html, PUBLIC_URL shim; keep CRA scripts as build:cra fallback during migration (ngcfells)
- 2026-09-17 `f52473b9` MUL scrape from Archive.org as fallback... pending JSON from users. (ngcfells)
- 2026-09-17 `b310a13e` Addequip updates and addition of GitHub CORS to it so people can do a PR for their equipment. Would go in Customs as hopefully we will have all canon soon. (ngcfells)
- 2026-09-17 `9701ac4a` MUL fallback pending future changes. (ngcfells)
- 2026-09-17 `89942d7d` ESLint clean up, addition of Clan Weapon file placeholders (ngcfells)
- 2026-09-17 `ae223ebf` Some AI assisted fixes... closely monitored... Will be audited fully before a PR submitted. (ngcfells)
- 2026-09-17 `15697893` tons of leg work (ngcfells)
- 2026-09-16 `08e1bee0` BV updates... C-Bill cost updates (ongoing). initial wiring of Level 5. (ngcfells)
- 2026-09-15 `4d83bb80` fixes to battlemech.ts (ngcfells)
- 2026-09-15 `f5bd5d0f` fixes to internal structure that were missed. (ngcfells)
- 2026-09-15 `5c29f701` Remove duplicate Colossal mech tonnage entry (ngcfells)
- 2026-09-15 `8daaa0db` Adjust mech tonnages for Assault and Colossal types (ngcfells)
- 2026-09-15 `7f4c458d` Fixes to all of the old code so it works in newer react. (ngcfells)
- 2026-09-15 `906a83dd` Update mech-internal-structure-types.ts (ngcfells)
- 2026-09-15 `8a93a8e3` Update data-interfaces.ts (ngcfells)
- 2026-09-15 `74664c33` Update mech-internal-structure-types.ts (ngcfells)
- 2026-09-15 `b28c925f` Update mech-jump-jet-types.ts (ngcfells)
- 2026-09-15 `6b1c1fbd` Update rules-level-options.ts (ngcfells)
- 2026-09-15 `6c85e1a0` Update tech-options.ts (ngcfells)
- 2026-09-15 `94232020` Update mech-type-options.ts (ngcfells)
- 2026-09-15 `bc2be522` Update mech-tonnages.ts (ngcfells)
- 2026-09-15 `85aa1d97` Update era-options.ts (ngcfells)
- 2026-09-15 `310d8423` Delete README.md (ngcfells)
- 2026-09-15 `1d5ef5d8` Update README.md (ngcfells)
- 2026-09-15 `a4245d95` Update mech-engine-options.ts (ngcfells)
- 2026-09-15 `b9319ec6` Update mech-engine-types.ts (ngcfells)

### 2025-07

- 2025-07-29 `1d6d588a` Fix collapsed favorites persistence using UUID instead of index (HeySporky)
- 2025-07-29 `b807cc76` Add collapsible favorites in Alpha Strike roster (HeySporky)
- 2025-07-26 `7fae8094` Add enhanced Alpha Strike search features (HeySporky)

### 2025-06

- 2025-06-13 `2558be4a` Implement Engine hit effects for vehicles, movement, TMM and damage are halved, rounding down. (Chris Bury)

### 2025-05

- 2025-05-09 `4d4135d2` Require 3 units to have a formation (HeySporky)
- 2025-05-09 `c37b93e1` Move Base PV display so it doesn't overlap (HeySporky)
- 2025-05-01 `d295e212` Fix loading issue (hesto2)

### 2025-04

- 2025-04-30 `06c07037` Add infantry formations (hesto2)
- 2025-04-25 `6c7d12ca` Update style of print cards to match MUL (James Mingardi-Elliott)
- 2025-04-23 `828cce92` Fixing formation bonus formatting issues (HeySporky)
- 2025-04-23 `a6529301` Bugfix for random abilities with whitespace (HeySporky)
- 2025-04-18 `bd9abdce` Print mode improvements (James Mingardi-Elliott)
- 2025-04-15 `7cf35ed8` Update alpha-strike-unit.ts (HeySporky)
- 2025-04-14 `6d2d520b` Fix importMUL damage instantiation issues. (HeySporky)
- 2025-04-14 `488c1e13` New lance tweaks, Patch Notes (HeySporky)
- 2025-04-14 `e32b2840` Update home.tsx (HeySporky)
- 2025-04-14 `6af4b140` Fix Artillery Lance. Require 3 units for a formation. (HeySporky)
- 2025-04-14 `299b58b2` Match Play Intro State Fix (HeySporky)
- 2025-04-14 `a45670a6` Ignore all results but latest search (HeySporky)
- 2025-04-14 `d6e10ef8` Split off print mode changes from my overhaul branch (James Mingardi-Elliott)
- 2025-04-11 `ab77b93b` Removed checks for specific abilities to generalise the ability updates. (Chris Bury)
- 2025-04-11 `2f462fed` Resolved Turrets having NaN at the end and missing the final ). (Chris Bury)
- 2025-04-11 `1784084f` Simplified update_damage (and renamed it in JS style) and greatly simplified the logic for updating ability damage (removed special casing for shorter values, as the array is already the right length). (Chris Bury)
- 2025-04-11 `b8d3720e` Fixed issue with delayed refresh of abilities. (Chris Bury)
- 2025-04-02 `78edaf92` Adding multiple search options (HeySporky)

### 2025-03

- 2025-03-27 `ae211093` PV and Damage Search (HeySporky)
- 2025-03-24 `f07f5dbd` Implemented Ability updating when weapon criticals have occured, and simpllified damage updates when weapon criticals occur. (Chris Bury)
- 2025-03-20 `7b8895fa` Update home.tsx (HeySporky)
- 2025-03-19 `26148765` Saving Work In Progress (HeySporky)
- 2025-03-17 `b852a72f` Fixing overflow of damage to structure not counting properly. (HeySporky)
- 2025-03-11 `36292494` Update alpha-strike-unit.ts (HeySporky)

### 2025-02

- 2025-02-15 `38c85028` Add rest of Mercs packs, 2nd SL, re-order for clarity (Mike Whitaker)
- 2025-02-15 `a716a5b8` add Horde, Berserker, Anti-'Mech (Mike Whitaker)
- 2025-02-12 `0df80aab` Fixed the import backup to individually check and create round data if it doesn't exist (James Mingardi-Elliott)
- 2025-02-07 `66622302` Confirm dialog for end turn (James Mingardi-Elliott)
- 2025-02-06 `6e5c2289` Initial commit of round damage and heat staging (James Mingardi-Elliott)
- 2025-02-04 `b5b9f6c4` Add more column options to in-play view (James Mingardi-Elliott)

### 2025-01

- 2025-01-28 `0d79d8dc` Multiple Formation Bonus Fixes (HeySporky)
- 2025-01-12 `5b27ade9` Fix LM III BH Marauder (Mike Whitaker)
- 2025-01-12 `09b2d2f6` display Role in roster (Mike Whitaker)
- 2025-01-12 `853ce133` Add first batch of Mercenaries Lances (Mike Whitaker)
- 2025-01-09 `26974d22` import MUL class field into AlphaStrikeUnit, implement order lance (FleetfootMike)
- 2025-01-08 `7d69236c` Update alpha-strike-special-abilities.ts (OftKilted)
- 2025-01-08 `d167a4aa` Update JMPW and JMPS descriptions in alpha-strike-special-abilities.ts (OftKilted)
- 2025-01-08 `786c152c` right ID for Striker role: (FleetfootMike)
- 2025-01-08 `fd2423f8` various formation bonus fixes (FleetfootMike)
- 2025-01-08 `bcd152b1` Fix for capture the flag (HeySporky)

### 2024-12

- 2024-12-28 `6a71f747` Update alpha-strike-mp-scenarios.ts (HeySporky)
- 2024-12-26 `594d3733` Patch notes (HeySporky)
- 2024-12-24 `47dde719` Hide Intro saved in app setings. Maps stack properly with description (Michael Spork Evans)
- 2024-12-24 `da291eeb` Alpha Strike Match Play Beta Beta (Michael Spork Evans)
- 2024-12-24 `5712aa83` Trim whitespace (Michael Spork Evans)
- 2024-12-24 `69ff0234` Patch notes (Michael Spork Evans)
- 2024-12-24 `2e22ac70` Patch notes (Michael Spork Evans)
- 2024-12-24 `3c07fb98` Match Play WIP (Michael Spork Evans)
- 2024-12-23 `63a42542` make the MUL search look for exact unit name for forcepacks (FleetfootMike)
- 2024-12-23 `33334b5b` fix intro+standard+advanced to not include experimental, should we ever need it (FleetfootMike)
- 2024-12-23 `b5ad217a` remove rules: info, add ComStar, Proliferation Cycle, Urbies and Legendary I (FleetfootMike)
- 2024-12-23 `c5b6751d` Fixing Jeff's name (HeySporky)
- 2024-12-23 `ee0d17ff` tabs to spaces, because meh... (FleetfootMike)
- 2024-12-23 `5cb6561c` allow for advanced+experimental to support newer forcepacks (FleetfootMike)
- 2024-12-23 `f7a821df` fix args to getMULASSearchResults (FleetfootMike)
- 2024-12-23 `ec0abd72` add mech data for merc unit forcepack (FleetfootMike)
- 2024-12-22 `2f245581` Updating Discord Links (HeySporky)
- 2024-12-22 `1d03d165` Game Management WIP (HeySporky)
- 2024-12-18 `0a2b23d8` Match Play WIP (HeySporky)
- 2024-12-18 `2d8f9a45` Game Management section added. Match Play Deployments WIP (HeySporky)
- 2024-12-17 `3d6d37d6` Analytics back off (Michael Spork Evans)
- 2024-12-17 `7f4158ae` Testing Analytics (Michael Spork Evans)
- 2024-12-17 `7e154081` About Page (HeySporky)
- 2024-12-16 `78f4af1d` Link updates (Michael Spork Evans)
- 2024-12-16 `e4f5585d` Fix new formations not showing in empty list (HeySporky)
- 2024-12-15 `523a0d36` Tukayyid Formation Bonuses. Bug fix for formation bonuses when adding ForcePack (Michael Spork Evans)
- 2024-12-15 `1d004dfc` addlogo images at 512x512 and 256x256 (FleetfootMike)
- 2024-12-14 `30a5a998` Hotfix - External Links (HeySporky)
- 2024-12-14 `5262f973` Updating package.json with production deployment script (HeySporky)
- 2024-12-14 `2adb3939` Readme update (HeySporky)
- 2024-12-14 `ead897db` Text and logo updates, Rifle Lance Fix (HeySporky)
- 2024-12-13 `6ada298b` Development spork (#4) (HeySporky)
- 2024-12-13 `148c4a3c` Bug Fixes (HeySporky)
- 2024-12-13 `ef438868` Development spork (#3) (HeySporky)
- 2024-12-13 `6550846e` Beta Faction Filtering (HeySporky)
- 2024-12-13 `e052c91e` WIP: Faction Menu Items (HeySporky)
- 2024-12-12 `6353bf01` Fixing my own damn bug (#2) (HeySporky)
- 2024-12-12 `b49f09d7` Fixing my own damn bug (HeySporky)
- 2024-12-12 `b5b4ec8b` Typo Fix (HeySporky)
- 2024-12-12 `dc6d930f` SPA Fixes (#1) (HeySporky)
- 2024-12-12 `c394a2b1` Update README.md (HeySporky)
- 2024-12-12 `d5f8058c` Davion Formations + ReadMes (HeySporky)
- 2024-12-12 `dfa6d364` Reverting tests (HeySporky)
- 2024-12-12 `3ca1a9eb` Build Test - Red Font (HeySporky)
- 2024-12-12 `d560573c` Testing repo changes (Michael "Spork" Evans)

### 2024-04

- 2024-04-14 `d13f586f` Removed extraneous .vscode dircrory (Jeffrey Gordon)
- 2024-04-14 `be58bbf6` Possible fix for #41 (Jeffrey Gordon)
- 2024-04-14 `e5c4e52a` Fixes #44 (Jeffrey Gordon)

### 2024-03

- 2024-03-10 `2bcfb0a8` Pull request and node package updates (Jeffrey Gordon)

### 2024-02

- 2024-02-12 `fad79834` Fix for ForcePack addition (cam-smith)
- 2024-02-12 `13d3f123` Fix for wrong Elemental Squad Size (cam-smith)
- 2024-02-12 `f218575c` Checkin of fix for ForcePack Lists (cam-smith)

### 2023-08

- 2023-08-29 `a749af6f` Versioning for PR#39 (Jeffrey Gordon)
- 2023-08-29 `69747ad5` fix table colors; fix mobile scrolling issues (1VinceP)
- 2023-08-29 `7dbed614` Versioned app for PR (Jeffrey Gordon)
- 2023-08-16 `e8d56cbf` tidy up comments (1VinceP)
- 2023-08-16 `c7bcb325` add MV to all notes (1VinceP)
- 2023-08-16 `5ab20d52` add MV to notes (1VinceP)
- 2023-08-16 `7e999156` add sorting for AS search (1VinceP)
- 2023-08-16 `e96989b9` fix mobile formatting for alpha strike roster (1VinceP)

### 2023-07

- 2023-07-23 `a495a586` News update (Jeffrey Gordon)
- 2023-07-23 `7e86ccb3` News update (Jeffrey Gordon)
- 2023-07-17 `c626cf3e` Update LICENSE (Jeffrey D. Gordon)
- 2023-07-04 `5c8f85d5` Added missing SPAs and resolved a couple of typos. (Stewart Webb)

### 2023-06

- 2023-06-26 `0d477f21` Fixed SVG Card for Pilot Ability List (Jeffrey Gordon)
- 2023-06-26 `9f55db5f` This should fix #35 for advanced pilot special abilities (Jeffrey Gordon)
- 2023-06-26 `b4ae785d` This should fix #35 for advanced pilot special abilities (Jeffrey Gordon)

### 2023-04

- 2023-04-13 `e859b354` Fix for #30 (Jeffrey Gordon)
- 2023-04-13 `58915564` Fix for #30 (Jeffrey Gordon)

### 2023-03

- 2023-03-26 `1e12dd9b` Fixes #29 (Jeffrey Gordon)
- 2023-03-26 `a0333510` Initial AS Unit Creator layout (Jeffrey Gordon)
- 2023-03-26 `dc4d7899` Start of AS unit editor... refactoring and cleanup of internal AS Class (Jeffrey Gordon)
- 2023-03-22 `fdb6d434` Added some more Optional Special Rules (Jeffrey Gordon)
- 2023-03-22 `79f3877b` Added code for ground unit only sprinting. Added some more Optional Special Rules (Jeffrey Gordon)
- 2023-03-22 `7acc50ee` Start of Optional Abilities (Jeffrey Gordon)
- 2023-03-21 `98a5d76d` Page numbers for abilities (Jeffrey Gordon)
- 2023-03-21 `5af01b61` Added base special abilities for in-play references (Jeffrey Gordon)
- 2023-03-21 `62ef8cf3` Start of clickable AS Special Abilities (Jeffrey Gordon)
- 2023-03-20 `3c988c9c` Search results cleanup (Jeffrey Gordon)
- 2023-03-19 `9b64dd9a` Loosened MUL search, added role filter (Jeffrey Gordon)
- 2023-03-19 `370d84a5` Possible fix for #25 (Jeffrey Gordon)
- 2023-03-19 `95f26aa2` Possible fix for #28 (Jeffrey Gordon)
- 2023-03-19 `70bb3282` Possible fix for #28 (Jeffrey Gordon)
- 2023-03-17 `9a2863d3` Minor printig note (Jeffrey Gordon)
- 2023-03-12 `b4259e32` Fixes #24 - Now has a button to switch between normal and 'bad eyes' printing (Jeffrey Gordon)
- 2023-03-12 `751251b5` Fixes #24 - Now has a button to switch between normal and 'bad eyes' printing (Jeffrey Gordon)
- 2023-03-11 `52533897` itsy teeny weenie card margin change for 2nd page cutoff of top of 2nd page cards on my printer (#HTMLPrintingSucks) (Jeffrey Gordon)
- 2023-03-11 `be0d626e` Printing changes to help us old men see the text when playing with printed sheets (Jeffrey Gordon)
- 2023-03-06 `993b634d` 2000+ wide screens will show mechs 5 wide in Play Mode (Jeffrey Gordon)
- 2023-03-06 `0aa50354` 2000+ wide screens will show mechs 6 wide in Play Mode (Jeffrey Gordon)
- 2023-03-04 `e31f4124` Minor in play change (Jeffrey Gordon)

### 2023-02

- 2023-02-28 `391dd46d` Made in-play cards smaller on larger screen (Jeffrey Gordon)
- 2023-02-20 `5da8d2b7` Added sprint to AS card (Jeffrey Gordon)
- 2023-02-20 `2accc3e4` Added sprint to AS card (Jeffrey Gordon)

### 2023-01

- 2023-01-22 `5dcefa98` Removed rust project in preparation of rewrite (Jeffrey Gordon)
- 2023-01-22 `cc1d2d0b` Sync (Jeffrey Gordon)

### 2022-10

- 2022-10-18 `27f1fa60` MUL error reporting (Jeffrey Gordon)
- 2022-10-02 `ae0947be` Minor regression (Jeffrey Gordon)
- 2022-10-02 `c7599467` Switch to storage.session from localStorage to attempt to have data sync across signed in browser syncing (Jeffrey Gordon)
- 2022-10-01 `4a83c5b0` version increment (Jeffrey Gordon)
- 2022-10-01 `59ddb992` Fixes #20 :) (Jeffrey Gordon)

### 2022-07

- 2022-07-18 `50ab9d2c` AS Min damages from MUL (Jeffrey Gordon)

### 2022-06

- 2022-06-24 `c25fc77e` More Rust WASM floundering (Jeffrey Gordon)
- 2022-06-15 `55ec4c1b` WASM bindings to new structs (Jeffrey Gordon)
- 2022-06-15 `3bec9298` Start of alpha strike rust structure conversions (Jeffrey Gordon)
- 2022-06-15 `d709d764` rust library .wasm testing; updates to root init for react 18 (Jeffrey Gordon)
- 2022-06-08 `3b4f589b` News update (Jeffrey Gordon)
- 2022-06-07 `9218f9e8` Added clickable pilot abilities in AS in-play - colored pilot ability green for easier visibiliy in AS SVG (Jeffrey Gordon)
- 2022-06-07 `d8d5939a` Beginning of AS Pilot Ability selection (Jeffrey Gordon)
- 2022-06-03 `85aee3b9` Fixed TS build errors for deployment (Jeffrey D. Gordon)
- 2022-06-03 `a3e8686f` node package updates and ts fixes from updates (Jeffrey D. Gordon)

### 2022-05

- 2022-05-26 `0ed2712c` Added AS clickable print page on Mech Creator Summary (Jeffrey Gordon)
- 2022-05-26 `3010c350` More AS PV Calculation work (Jeffrey Gordon)
- 2022-05-20 `4caf9bfb` ForcePack navigator online check (Jeffrey Gordon)
- 2022-05-14 `8b578b37` Start of Ammo Select/Count for CBT In Play Roster (Jeffrey Gordon)
- 2022-05-13 `f6a9eddb` More accurate Inner Sphere searches for Quick Force Pack add - adding first of data if no filtered matches are found. (Jeffrey Gordon)
- 2022-05-13 `78976c00` More accurate Inner Sphere searches for Quick Force Pack adds (Jeffrey Gordon)
- 2022-05-13 `fc259e8c` More accurate Clan searches for Quick Force Pack adds (Jeffrey Gordon)
- 2022-05-13 `11b109e5` Fixes #17 (Jeffrey Gordon)
- 2022-05-12 `9e30de81` Fixes  #16 changed Eras to AvailableEras as per the quickcount MUL query (Jeffrey Gordon)
- 2022-05-12 `60f8c516` Change of era query (Jeffrey Gordon)
- 2022-05-12 `15648be1` Dev status update (Jeffrey Gordon)
- 2022-05-12 `d5970090` ForcePack adds - sorting and filtering out (standard) for Second line Clan Mechs (Jeffrey Gordon)
- 2022-05-10 `ff58b51b` Default Clan ForceBoxes to 3 Skill (Jeffrey Gordon)
- 2022-05-10 `e273031b` 1st attempt at a quick-add for CGL ForcePacks for Alpha Strike builder (Jeffrey Gordon)
- 2022-05-09 `77d28fbc` Support for very long special rules on AS SVG Card (Jeffrey Gordon)
- 2022-05-09 `ecdc1cd9` Support for very long special rules on AS SVG Card (Jeffrey Gordon)
- 2022-05-09 `7ac4260d` Support for very long special rules on AS SVG Card (Jeffrey Gordon)
- 2022-05-03 `b1ff3f52` More steps to AS PV accuracy (Jeffrey Gordon)
- 2022-05-03 `c34f3fe7` Re-added BM Unit Size factor in AS Calculation (Jeffrey Gordon)
- 2022-05-02 `7e771772` More AS PV work, up to 20% accuracy on Intro mechs (Jeffrey Gordon)
- 2022-05-02 `e52f134f` More (but not much more) accurate AS value calculations (Jeffrey Gordon)
- 2022-05-01 `17f1d223` Minimal AS Damage indicator typo fix - we're not using it yet until we can get the data from MUL (Jeffrey Gordon)
- 2022-05-01 `a8300503` Fixed AS JMPS/JMPW calculations (Jeffrey Gordon)
- 2022-05-01 `97898309` Rear arc shot verification better explanations on no shots/modifiers (Jeffrey Gordon)

### 2022-04

- 2022-04-30 `759ff4d3` Secondary Target checkboxes (Jeffrey Gordon)
- 2022-04-30 `6bc04087` Added filtering on CBT Roster Import (Jeffrey Gordon)
- 2022-04-30 `fafc8a99` Added filtering on Mech Creator SSW Import (Jeffrey Gordon)
- 2022-04-29 `dad76412` Dumb pilot import bug (Jeffrey Gordon)
- 2022-04-29 `ac15bd3f` Stealth Armor imports (Jeffrey Gordon)
- 2022-04-28 `4803aedf` Work on sanity test page for grabbing and caching the MUL values of mechs to try to get the CBT creator's AS Value correct... quite a few UI fixes here and there (Jeffrey Gordon)
- 2022-04-28 `23718f2b` More work on CBT In Play (Jeffrey Gordon)
- 2022-04-27 `e95d9760` package version (Jeffrey Gordon)
- 2022-04-27 `7bb041f5` Change URL of main Alpha Strike to go straight to Roster since there's really only one option right now (Jeffrey Gordon)
- 2022-04-26 `82fa49b8` Placeholders for AS MUL minimum damage notation (Jeffrey Gordon)
- 2022-04-26 `19920c75` Fixed Motive Critical Hits on Alpha Strike Vehcles. Jump TMM now includes jump bonus again. Changed AS add screen to be eras instead of year on the drop down. (Jeffrey Gordon)
- 2022-04-25 `81e0e8f8` Max armor dropdown fix (Jeffrey Gordon)
- 2022-04-25 `336d5ae3` SSW Gyro Set (Jeffrey Gordon)
- 2022-04-25 `8a0cef9e` Hatchet imports, and other variable sized equipment (Jeffrey Gordon)
- 2022-04-25 `83a6b602` Reversion (Jeffrey Gordon)
- 2022-04-25 `0abdfaf7` Split items 8 or more crits only (Jeffrey Gordon)
- 2022-04-25 `528a6a99` Cleanup of moving criticals around (Jeffrey Gordon)
- 2022-04-25 `851b1b73` News update (Jeffrey Gordon)
- 2022-04-25 `6b60ec60` FINALLY got split allocations working and importing. Only import errors for Intro rules are hatchets (Jeffrey Gordon)
- 2022-04-25 `fe08577f` minor fixes of hex ranges as per 68 if AS:CE (Jeffrey Gordon)
- 2022-04-25 `8e1efcf4` More frustration with split crit locations, but I added a 'hex mode' for alpha strike cards (Jeffrey Gordon)
- 2022-04-16 `61f1c8bd` Fixed quad moveCritical location translations (Jeffrey Gordon)
- 2022-04-16 `b75252c9` Expanding out to fix errors on Standard and Experimental rules (Jeffrey Gordon)
- 2022-04-16 `0bfec930` 3050 IS mechs added (Jeffrey Gordon)
- 2022-04-16 `65683f14` News (Jeffrey Gordon)
- 2022-04-16 `e96cce08` Added news (Jeffrey Gordon)
- 2022-04-16 `d63ec334` BV2 and CBill Sanity Checks are 100% for TRO3039 (Jeffrey Gordon)
- 2022-04-15 `e2202129` More BV and Cbill calculations and SSW import fixes (Jeffrey Gordon)
- 2022-04-15 `576b518f` Added view summary on sanity test page (Jeffrey Gordon)
- 2022-04-15 `013ad756` package.json versioning (Jeffrey Gordon)
- 2022-04-15 `0261159b` Added an all-in-one admin/preview page for SSW discrepency checking (Jeffrey Gordon)
- 2022-04-15 `3d6b69fa` Armor allocation calc fix (Warhammer 6D caught this one). (Jeffrey Gordon)
- 2022-04-15 `b76ea4b7` Selecting of half ton for MG ammo on Step 5 (Jeffrey Gordon)
- 2022-04-15 `9561f25c` Fixed half ton ammo on SSW import (Jeffrey Gordon)
- 2022-04-15 `dd4dbe32` Fixed heat type conversion possible problem (some heats were strings and were concatenating instead of adding) (Jeffrey Gordon)
- 2022-04-15 `51213166` Added GPL exception o sswMech.ts (Jeffrey Gordon)
- 2022-04-15 `655bf68a` Minor fixes for imports - spot checking. Quite a few 1 c-bill possible rounding errors (Jeffrey Gordon)
- 2022-04-15 `764d2ced` Added SSW INtro Mech data, allowing for easy import on Imports mostly for CBill/BV2 tests (Jeffrey Gordon)
- 2022-04-14 `f41e5441` Fixed armor count for SSW importer (Jeffrey Gordon)
- 2022-04-14 `f2754d9d` typo on improved jjs (Jeffrey Gordon)
- 2022-04-14 `5207f191` Added jump jets to SSW importer (Jeffrey Gordon)
- 2022-04-14 `7e3f8390` Moved TRO importer to Imports (Jeffrey Gordon)
- 2022-04-14 `8955c187` Saved Mech JSON size optimizations (Jeffrey Gordon)
- 2022-04-14 `24f654b0` Saved Mech JSON size optimizations (Jeffrey Gordon)
- 2022-04-14 `9d709304` SSW Heat sink set type fix (Jeffrey Gordon)
- 2022-04-14 `b8df739a` Fixed CBill Costs on AS7-D (hopefully fixes all ',echs with ammo), BV2 calcualtes with SSW, but TRO is different (Jeffrey Gordon)
- 2022-04-14 `562a2775` Imports for all? (Jeffrey Gordon)
- 2022-04-14 `b5b9ee60` Heavy infiltration to the SSW XML importer - Got Atlases and Archers importing. On to Jump-capable mechs (Jeffrey Gordon)
- 2022-04-13 `9640686c` Quick rename just in case there are CBT abilities I'm not aware of yet (Jeffrey Gordon)
- 2022-04-13 `a8d1335e` Alpha Strike Ability and Pilot Groundwork (Jeffrey Gordon)
- 2022-04-13 `d8fb3afe` Updated in-play message for damage (Jeffrey Gordon)
- 2022-04-13 `1f1d7a40` Start of critical hits (Jeffrey Gordon)
- 2022-04-12 `9c957bea` UI color cleanups (Jeffrey Gordon)
- 2022-04-12 `d5b11524` Better Wrecked graphic on CBT (Jeffrey Gordon)
- 2022-04-12 `316dea20` Wrecked snarks (Jeffrey Gordon)
- 2022-04-12 `77e6e711` Wrecked CBT markers (Jeffrey Gordon)
- 2022-04-12 `71f426e0` Start of Damage Taking functionality on CBT BattleMechs (Jeffrey Gordon)
- 2022-04-12 `0a406add` Fixed some step 5 weirdness due to indexed references - using UUID to remove and toggle rear now (Jeffrey Gordon)
- 2022-04-12 `9c171859` Blue base on BT Logo in header (Jeffrey Gordon)
- 2022-04-12 `b52698a2` Blue streak on logo to differentiate this app from others (Jeffrey Gordon)
- 2022-04-11 `1dbc4daa` End of day commit (Jeffrey Gordon)
- 2022-04-11 `c49b9116` Work on Take Damage Screen (Jeffrey Gordon)
- 2022-04-09 `87d7e61a` Added heat summary below weapon/target selection (Jeffrey Gordon)
- 2022-04-09 `39e6a684` Fixed clicky function on CBT Target Selection In Play on SVG (Jeffrey Gordon)
- 2022-04-09 `b5842437` Changed CBT rosters sidebar selection Movement Indicators to look and work like standard Movement Dice on the table (Jeffrey Gordon)
- 2022-04-09 `0efe9b9d` Removed in Play Variables from Favorite Groups (Jeffrey Gordon)
- 2022-04-09 `13f5c239` Added home page about blirbs (Jeffrey Gordon)
- 2022-04-08 `b5ff729e` Target and Weapon selection in Modal (easier to select a Target on smaller screens) (Jeffrey Gordon)
- 2022-04-08 `9db01e47` SEO verifcation tags (Jeffrey Gordon)
- 2022-04-08 `ea7631d0` Minor cosmetic change in cluster hits (Jeffrey Gordon)
- 2022-04-08 `d2c4fc33` Resolve Fire enhancements and Clustering resolving dialog (Jeffrey Gordon)
- 2022-04-08 `c45d537c` Start of Resolve Fire screen (Jeffrey Gordon)
- 2022-04-08 `944f3088` Armor circle clicks, turn reset, hasn't moved in turn notification (Jeffrey Gordon)
- 2022-04-07 `439124ba` Quick Button target and movement selection in sidebar (Jeffrey Gordon)
- 2022-04-07 `968c53ba` Cleaned up console.log for preview deploy (Jeffrey Gordon)
- 2022-04-07 `3f61ba78` Weapon accurace modifiers in GATOR (Jeffrey Gordon)
- 2022-04-07 `7f6254ac` Turn/Phase area refinements (Jeffrey Gordon)
- 2022-04-07 `fa0ad35a` Turn/Phase counter (Jeffrey Gordon)
- 2022-04-07 `34f1d073` CBT Minimum ranges GATOR (Jeffrey Gordon)
- 2022-04-07 `7c923661` Minor refinements to CBT targets and gators (Jeffrey Gordon)
- 2022-04-07 `70cea519` CBT In Play Target selection, per weapon cycling through targets, GATOR per weapon (Jeffrey Gordon)
- 2022-04-06 `0b1cf158` OV TMM mods (Jeffrey Gordon)
- 2022-04-06 `98eb5ca7` AS Feedback via Discord (Jeffrey Gordon)
- 2022-04-06 `3a0a4439` Fixed bug where CBT favorites wouldn't load if AS favorites is empty (Jeffrey Gordon)
- 2022-04-06 `19966b99` Fixes to Favorite Saves (Jeffrey Gordon)
- 2022-04-06 `97a113a6` Fix to move penalties on MP hits (Jeffrey Gordon)
- 2022-04-06 `1f286d21` Fix to TMM penalties on MP hits (Jeffrey Gordon)
- 2022-04-05 `fd72c24d` UUID Fix for multiple of same unit (Jeffrey Gordon)
- 2022-04-05 `a63f1317` CBT in play movement modifer refinements (Jeffrey Gordon)
- 2022-04-05 `3cafa653` CBT In-Play Mech Movement Selection (Jeffrey Gordon)
- 2022-04-05 `f715f7b3` The very beginnings of the CBT in-play section (Jeffrey Gordon)
- 2022-04-05 `7a2afc0f` Minor labeling fixes (Jeffrey Gordon)
- 2022-04-05 `0bfcdc5e` app version increment (Jeffrey Gordon)
- 2022-04-05 `58a3cb7a` Bugfix as per Discord feedback from Valik: Removed Jump from TMM, removed +1 heat auto-add from engine hit, it's per shot, not a minimum heat. Removed Engine hits affecting to-hits, as that's not in the AS Commander's Edition list of effects for that hit. (Jeffrey Gordon)
- 2022-04-03 `88f8a238` Artemis IV LRM and SRMs and CASE (Jeffrey Gordon)
- 2022-04-03 `d7e6e410` Fixed anchor ts warning in print menu, added updated news (Jeffrey Gordon)
- 2022-04-03 `928271ab` Added tons and tech to CBT roster tables and fotce stats (Jeffrey Gordon)
- 2022-04-03 `a9d0738d` Added tons and tech to CBT roster tables and fotce stats (Jeffrey Gordon)
- 2022-04-03 `771d1846` Minor fix on Pilot Skill to recalculate BV immediately on set (Jeffrey Gordon)
- 2022-04-03 `c021fa73` CBT Roster Print page done (already?) (Jeffrey Gordon)
- 2022-04-03 `915dbb1d` Quick rename of CBT Force and Groups before I regret it and folks actually start using that part of the app (Jeffrey Gordon)
- 2022-04-03 `e3d924f1` Updated WIP message on CBt roster (Jeffrey Gordon)
- 2022-04-03 `97cda21c` Updated homepage news (Jeffrey Gordon)
- 2022-04-03 `1a6dfd6b` FaTrash button consistency and BM Roster Backups and Restores (Jeffrey Gordon)
- 2022-04-03 `8f8fcf25` Signficant work om CBT roster (Jeffrey Gordon)
- 2022-04-02 `0697949b` added comment to ease the minds of folks seeing the session id (Jeffrey Gordon)
- 2022-04-02 `786550f6` analytics session id (Jeffrey Gordon)
- 2022-04-02 `94ef4552` PWA manifest goodness (Jeffrey Gordon)
- 2022-04-02 `40583f27` PWA icons (Jeffrey Gordon)
- 2022-04-02 `c3b77a9e` PWA icons (Jeffrey Gordon)
- 2022-04-02 `225aff9f` PWA Manifest name fix (Jeffrey Gordon)
- 2022-04-02 `80d7970b` Added public/private to remaining classes, might not be accurate, but it's a start (Jeffrey Gordon)
- 2022-04-02 `792a3572` Updated readme (Jeffrey Gordon)
- 2022-04-02 `de18f67d` Updated readme (Jeffrey Gordon)
- 2022-04-02 `ab9c6a83` Moderate refactoring to private/public on battlemech class object (Jeffrey Gordon)
- 2022-04-02 `a6f139a7` Standardized Equipment Sorting across the board (Jeffrey Gordon)
- 2022-04-02 `89fa9b4b` Added copyright notice on bottom of 'mech sheet (Jeffrey Gordon)
- 2022-04-02 `ef0e3f8b` Added Rotary ACs (Jeffrey Gordon)

### 2022-03

- 2022-03-20 `1ff01a43` Start of CBT Roster UI (Jeffrey Gordon)
- 2022-03-20 `6cd343cb` Start of BattleTech roster data structures (Jeffrey Gordon)
- 2022-03-20 `8aee411a` Menu structuring standardization (Jeffrey Gordon)
- 2022-03-19 `f2999337` Transition to react-icons (Jeffrey Gordon)
- 2022-03-19 `5e8ce486` Advanced Menu Options (Jeffrey Gordon)
- 2022-03-19 `8b9a7983` Pilot Skill Adjustment Clarifications (Jeffrey Gordon)
- 2022-03-18 `35f832cf` BattleMech creator AS Ammo calc fix (Jeffrey Gordon)
- 2022-03-18 `5c87ee62` Fixed next/previous steps in mech creator (Jeffrey Gordon)
- 2022-03-16 `0f763b0f` Cleaned up Analytics Calls (Jeffrey Gordon)
- 2022-03-16 `b8877632` Shortened GATOR labels for future target info popup button (Jeffrey Gordon)
- 2022-03-16 `bb625cca` Minor navigation fixes, versioned package.json (Jeffrey Gordon)
- 2022-03-16 `af8e68e8` Starting more organized URL tree structure (Jeffrey Gordon)
- 2022-03-16 `190c94da` GATOR placeholders (Jeffrey Gordon)
- 2022-03-15 `351f0dde` Added personal non-blocking analytics to see usage and popularity of functions (Jeffrey Gordon)
- 2022-03-15 `38304349` Safety checks for blank uuids (Jeffrey Gordon)
- 2022-03-15 `85d0602e` Start of adding Custom Created Mechs into Alpha Strike Forces (Jeffrey Gordon)
- 2022-03-14 `a1ee2dda` Versioning for PWA caches (Jeffrey Gordon)
- 2022-03-14 `e111c33d` Bonehead Developer Fixes (Jeffrey Gordon)
- 2022-03-14 `b291f735` Versioning for PWA caches (Jeffrey Gordon)
- 2022-03-14 `d4111972` Safari fix for AS Print Cards (Jeffrey Gordon)
- 2022-03-13 `990a894c` Saving of AS value in BattleMech saves (Jeffrey Gordon)
- 2022-03-13 `37cfaa5d` Fixed BM Installed Equipment UI bug (Jeffrey Gordon)
- 2022-03-13 `e581e412` Added news item, fixed type in Mobile menu url (Jeffrey Gordon)
- 2022-03-13 `f9558866` Forgot to version (Jeffrey Gordon)
- 2022-03-13 `0ca3247f` Backup and Restore (Jeffrey Gordon)
- 2022-03-13 `6ea0f662` Movng of DataSaves to centralized storage functions (Jeffrey Gordon)
- 2022-03-12 `35d8bec7` Added version to About page (Jeffrey Gordon)
- 2022-03-12 `ce1a0b8a` Versioning and added wrecked tag in Current Force (Jeffrey Gordon)
- 2022-03-12 `25692486` Added a little damaged warning tag on the current force list (Jeffrey Gordon)
- 2022-03-12 `0521144e` Added a reset button to bring groups back to full strength quickly and easily for a new game (Jeffrey Gordon)
- 2022-03-11 `503daa7b` Added offline detection for MUL searching (Jeffrey Gordon)
- 2022-03-11 `89895c03` Alpha Strike Group Labels (Jeffrey Gordon)
- 2022-03-11 `439df512` Very subtle change to under-stats (Jeffrey Gordon)
- 2022-03-11 `fb5a2931` Alpha Strike interface cleanup (Jeffrey Gordon)
- 2022-03-11 `29efc8ec` Minor UI cleaning before I get hot and heavy entering in equipment again (Jeffrey Gordon)

### 2022-02

- 2022-02-24 `86bb1288` Fixed last TS warning (Jeffrey Gordon)
- 2022-02-24 `d37f38ff` Removal of almost all TS warnings - crazy random function in generateUUID remains (Jeffrey Gordon)
- 2022-02-24 `a2532896` Made the retro interface a little easier to navigate - most items to interact with have a hint of white (Jeffrey Gordon)
- 2022-02-23 `798b8496` null exception (Jeffrey Gordon)
- 2022-02-23 `63ddf9c1` More data in AS searches (Jeffrey Gordon)
- 2022-02-23 `83362e78` Import/Export AS Groups (Jeffrey Gordon)
- 2022-02-23 `77d99da1` Category name for new items fix (Jeffrey Gordon)
- 2022-02-23 `3d6b9606` More TRO import fixes, added some experimental equipment while testing imports (Jeffrey Gordon)
- 2022-02-23 `045d843f` IS Intro Missile Weapons (Jeffrey Gordon)
- 2022-02-23 `2e419051` Damage Clustering, no heat for ammo (Jeffrey Gordon)
- 2022-02-23 `6a266f2c` Added CBills, and ammo display (Jeffrey Gordon)
- 2022-02-23 `ea54c497` Bah! New date typo (Jeffrey Gordon)
- 2022-02-23 `b199eb06` More Equipment Editing Work (Jeffrey Gordon)
- 2022-02-23 `2681c0ab` Text Sections Compponent (Jeffrey Gordon)
- 2022-02-23 `80f631c6` News update and AS Roster Printing - Huzzah (Jeffrey Gordon)
- 2022-02-22 `47b1fd08` Safari doesn't support regex lookbehind 😠 (Jeffrey D. Gordon)
- 2022-02-21 `ed757092` Beginnings of Equipment edit form (Jeffrey D. Gordon)
- 2022-02-21 `e69eab7f` Work on equipment editor, minor fix of equipment import for TRO (Jeffrey D. Gordon)
- 2022-02-20 `bfbd27ae` More work on TRO import (Jeffrey Gordon)
- 2022-02-20 `02458333` Beginnings of TRO parser (Jeffrey Gordon)
- 2022-02-20 `2dc2241a` Removal of old, camel case directory (Jeffrey D. Gordon)
- 2022-02-20 `9b46f31a` Removal of old, camel case directory (Jeffrey D. Gordon)
- 2022-02-20 `149e5380` Removal of old, camel case directory (Jeffrey D. Gordon)
- 2022-02-20 `b12ca173` Case Insensitivity in mac drives me crazy (Jeffrey Gordon)
- 2022-02-20 `335c6bd8` Filename refactoring (Jeffrey Gordon)
- 2022-02-20 `040b91da` Update to react6 (Jeffrey Gordon)

### 2021-10

- 2021-10-07 `33a253e5` Added year drop down on mech search for AS forces (Jeffrey D. Gordon)
- 2021-10-03 `96830649` Allow for adding non-era items, marking the 'mech 'Anachronistic' (Jeffrey Gordon)
- 2021-10-01 `95f0dd3d` Removed Gauthic as I'm dropping that moniker (Jeffrey D. Gordon)

### 2021-09

- 2021-09-30 `3ce23e0f` Package Versioning (Jeffrey Gordon)
- 2021-09-30 `393c537c` Added system hit circles to mech record sheet (Jeffrey Gordon)
- 2021-09-26 `4f6d7def` Forgot the versioning (Jeffrey Gordon)
- 2021-09-26 `36997b7e` Fixed mobile menu bug (Jeffrey Gordon)

### 2021-05

- 2021-05-24 `678734bd` Prod deploy (Jeffrey D. Gordon)
- 2021-05-24 `d767825d` Updated Twitter Links (Jeffrey D. Gordon)

### 2021-01

- 2021-01-10 `fca5d9ee` Added filter to equipment add screen (Jeffrey Gordon)
- 2021-01-01 `2da744d5` A little layout fixes and some TS warning removals (Jeffrey Gordon)
- 2021-01-01 `b9353781` Moved AS bonus text in play to top to help remind players (Jeffrey Gordon)
- 2021-01-01 `c1399737` Export/Import Battlemech saves (Jeffrey Gordon)
- 2021-01-01 `c5488e62` Versioning package.json (Jeffrey Gordon)
- 2021-01-01 `af6dad78` Fixed C-Bill display on save list (Jeffrey Gordon)
- 2021-01-01 `3eb8e6ba` Added support for localStorage battlemech saving and loading, removed react class bindings. Exports/Imports of BattleMechs and BattleMech saves coming soon. (Jeffrey Gordon)

### 2020-12

- 2020-12-04 `ebe23fea` Added group points summary in AS creator (Jeffrey D. Gordon)
- 2020-12-04 `cb8e52d1` Added ranges in AS damage (Jeffrey D. Gordon)

### 2020-11

- 2020-11-18 `ddf0b627` Updated node packages (Jeffrey D. Gordon)
- 2020-11-18 `c7fbf784` Sync (Jeffrey D. Gordon)
- 2020-11-18 `55d0b7f6` Sync (Jeffrey D. Gordon)
- 2020-11-18 `860fe828` Sync (Jeffrey D. Gordon)

### 2020-01

- 2020-01-03 `c0842d63` fixes for shutdown heat bugs(minus tmm etc.) (cam smith)
- 2020-01-03 `67168ba5` first pass of mech formation bonuses (cam smith)
- 2020-01-03 `590cee3a` POC of formation bonus (cam smith)
- 2020-01-02 `24c1fdb6` gitignore for mac files (cam smith)
- 2020-01-02 `c981b926` fixed display of Threshold Value on AS Card (cam smith)
- 2020-01-02 `225dcf59` fixed display of Extreme Damage on AS card (cam smith)
- 2020-01-02 `18ec73a0` found typo in code that loads extreme damage (cam smith)

### 2019-08

- 2019-08-14 `9ab655ea` Updated npm packages (Jeffrey D. Gordon)
- 2019-08-13 `853de9f7` Completion of basic biped armor (Jeffrey D. Gordon)
- 2019-08-13 `2b3d67f7` Last of Quad Armor (Jeffrey D. Gordon)
- 2019-08-13 `76cbbf40` Quad front armor (Jeffrey D. Gordon)
- 2019-08-13 `41e4e956` Event fixes (Jeffrey D. Gordon)
- 2019-08-13 `42519a85` Internal Structure Damage Dots (Jeffrey D. Gordon)
- 2019-08-05 `982c68a1` Retro theme (I have issues) (Jeffrey D. Gordon)
- 2019-08-05 `ce2b37b2` Renamed monochrome to desaturated (Jeffrey D. Gordon)
- 2019-08-05 `2bc04494` Turns out that saturation filter was messing with layout, manually desaturating colors (Jeffrey D. Gordon)
- 2019-08-05 `2e503e24` Cross-browser UI fixes (Jeffrey D. Gordon)
- 2019-08-05 `7e49d214` Armor Allocation Help, monochrome mode (Jeffrey D. Gordon)
- 2019-08-05 `7ded521b` Heat Sink Dots, beginning of in play BM hooks (Jeffrey D. Gordon)
- 2019-08-04 `678e6ad3` Armor/IS Record Sheet Start (Jeffrey D. Gordon)
- 2019-08-04 `1375d9c0` Minor fixes to record sheet, added no equipment installed message (Jeffrey D. Gordon)
- 2019-08-04 `15701350` Record Sheet equipment list (Jeffrey D. Gordon)
- 2019-08-04 `e8fb6e80` Work on Record Sheet Crit Table section (Jeffrey D. Gordon)
- 2019-08-03 `30c08a1c` Further record sheet layout (Jeffrey D. Gordon)

### 2019-07

- 2019-07-28 `5c609f3b` More BattleMech SVG Work (Jeffrey D. Gordon)
- 2019-07-28 `d1f6ef61` The very start of the BM SVG Record Sheet (Jeffrey D. Gordon)
- 2019-07-28 `41bad1a1` Show work calcs on Summary page (Jeffrey D. Gordon)
- 2019-07-28 `f42ee8b0` Start of Summary pages, still likely lots of bugs (Jeffrey D. Gordon)
- 2019-07-27 `09947f7f` Rest of UI pages converted to UIPages (Jeffrey Gordon)
- 2019-07-27 `8238b906` Removed work dir, noone needs to worry about that (Jeffrey Gordon)
- 2019-07-27 `6e3d7b0d` Updated headers of Data files (Jeffrey Gordon)
- 2019-07-27 `a90ae668` Changed license in about page (Jeffrey Gordon)
- 2019-07-27 `56289dc8` Start of UI compontentilization, should have been done from the get-go (Jeffrey Gordon)
- 2019-07-25 `96d36135` GPL License (Jeffrey D. Gordon)
- 2019-07-25 `46c6eda7` Arm Actuator selection (Jeffrey D. Gordon)
- 2019-07-25 `34dad803` More moving crit bugfixes (Jeffrey D. Gordon)
- 2019-07-25 `a836c10d` Jump Jet allocation denial to LA, RA, and HD (Jeffrey D. Gordon)
- 2019-07-25 `289ad151` Step 6 (Jeffrey D. Gordon)
- 2019-07-25 `770b0c75` Very basic ste5 functionality.... UI needs a LOT of refinement (Jeffrey D. Gordon)
- 2019-07-24 `2d101615` Updated DevStatus page (Jeffrey D. Gordon)
- 2019-07-24 `68ecb969` Updated DevStatus page (Jeffrey D. Gordon)
- 2019-07-24 `cfd54453` Quad Armor Allocation (Jeffrey D. Gordon)
- 2019-07-24 `66f988a1` Damage Transfer Diagram (Jeffrey D. Gordon)
- 2019-07-24 `1de6a87e` IS and Rear Armor SVG diagrams (Jeffrey D. Gordon)
- 2019-07-24 `c175a4d5` Step 4 - minor cleanups (Jeffrey D. Gordon)
- 2019-07-24 `5a31b7c7` Step 4 (Jeffrey D. Gordon)
- 2019-07-24 `6d03f7d6` Step 3 complete (Jeffrey D. Gordon)
- 2019-07-24 `409655db` Mech Creator Status Bar (Jeffrey D. Gordon)
- 2019-07-24 `9f549423` Heading off some code reuse cleanup at the pass (Jeffrey D. Gordon)
- 2019-07-24 `18987fe6` Step 2 Complete (Jeffrey D. Gordon)
- 2019-07-23 `c3de9989` Final redirect fix (Jeffrey D. Gordon)
- 2019-07-23 `1f562037` Possible fix for 404.html subpaths (Jeffrey D. Gordon)
- 2019-07-23 `bccc04e2` Step 1 of Battlemech UI (Jeffrey D. Gordon)
- 2019-07-23 `48e79106` Mech Builder Scaffolding (Jeffrey D. Gordon)
- 2019-07-23 `0191bae4` More linter cleanups (and likely preemprive bugfixes) (Jeffrey D. Gordon)
- 2019-07-23 `a00f0ac7` Some linting cleanups (lots more to fix\!) and initial instanciation of new Battlemech object to React (Jeffrey D. Gordon)
- 2019-07-23 `5c84ced4` Initial JS to TS conversion of 'Mech class (Jeffrey D. Gordon)
- 2019-07-23 `05144ec3` Inital Data conversion to Typescript consts and interfaces (Jeffrey D. Gordon)
- 2019-07-23 `dc989be5` Development Status Page (Jeffrey D. Gordon)
- 2019-07-23 `47ba25f5` Some UI Tweaks for smaller devices, more title hints on links and buttons (Jeffrey D. Gordon)
- 2019-07-23 `a11a2ec5` AS Favorite Units (Jeffrey D. Gordon)
- 2019-07-22 `5cf22a61` More minor cleanups (Jeffrey D. Gordon)
- 2019-07-22 `10a5a99f` Some UI cleanups (Jeffrey D. Gordon)
- 2019-07-22 `8cbdd007` Activated Play mode buttons (Jeffrey D. Gordon)
- 2019-07-22 `ba70ef69` Added TakeDamage function and heat (Jeffrey D. Gordon)
- 2019-07-22 `3b133e1d` Work on in-play events for Alpha Strike (Jeffrey D. Gordon)
- 2019-07-22 `2b5e8766` Start of Alpha Strike In-Play Page (Jeffrey D. Gordon)
- 2019-07-22 `59a9423d` Adding to groups drop down, moving between groups (Jeffrey D. Gordon)
- 2019-07-22 `3241f829` More Alpha Strike Force Editing (Jeffrey D. Gordon)
- 2019-07-22 `7aa44767` AS Mech Editing (Jeffrey D. Gordon)
- 2019-07-21 `2b7bc3b0` JS to TS cleanups (Jeffrey D. Gordon)
- 2019-07-21 `6b98ea87` Removed build directory (Jeffrey D. Gordon)
- 2019-07-21 `dac06ea4` Start of AS SVG work (Jeffrey D. Gordon)
- 2019-07-21 `d2d45008` Start of AS SVG work (Jeffrey D. Gordon)
- 2019-07-21 `5ebe399a` Start of AS SVG work (Jeffrey D. Gordon)
- 2019-07-19 `4f6556d1` Fixed url typo (Jeffrey Gordon)
- 2019-07-18 `e43a9cef` GH Pages (Jeffrey D. Gordon)
- 2019-07-18 `38bab8fa` Moved UI only class into UI (Jeffrey D. Gordon)
- 2019-07-18 `e7365f98` Mobile Menu (Jeffrey D. Gordon)
- 2019-07-18 `192d51c0` Mech Creator and Alpha Strike Roster scaffolding (Jeffrey D. Gordon)
- 2019-07-18 `541a753e` About Page (Jeffrey D. Gordon)
- 2019-07-18 `110c15e8` Updated Readme (Jeffrey D. Gordon)
- 2019-07-18 `ee7fb2fa` Updated Readme (Jeffrey D. Gordon)
- 2019-07-18 `ed561729` Alerts (Jeffrey D. Gordon)
- 2019-07-18 `34105945` Favicons (Jeffrey D. Gordon)
- 2019-07-18 `dcd33879` Moer styling overrides (Jeffrey D. Gordon)
- 2019-07-18 `1a1626c3` More scaffolding (Jeffrey D. Gordon)
- 2019-07-18 `f0b12c30` Initial Framework (Jeffrey D. Gordon)

### 2018-07

- 2018-07-02 `1fd261c0` Still trying to fix gl hosted (Jeffrey D. Gordon)
- 2018-07-02 `3868ba2f` GL Page Hosting Test 1 (Jeffrey D. Gordon)

### 2017-06

- 2017-06-11 `3ed0686e` Add Ultra ACs (Brent Ezell)
- 2017-06-01 `4560c946` Added clan energy weapons (VLS1 Backup)
- 2017-06-01 `37c5f027` Fixed some Clan BV calc bugs (VLS1 Backup)

### 2017-04

- 2017-04-29 `dcecae03` Add LB-X autocannons (Brent Ezell)
- 2017-04-12 `2ae25835` Recompilation, fixed README (VLS1 Backup)

### 2017-03

- 2017-03-19 `c762803b` Add the rest of the IS Gauss weapons.  All we need for the Fafnir is the ECM suite. (Brent Ezell)
- 2017-03-18 `e50c40c1` Closes #47 (VLS1 Backup)
- 2017-03-17 `4d48e9cf` Updated top buffer to save space on play view (VLS1 Backup)
- 2017-03-17 `6c291334` Added 'smaller view' for larger devices on AS play view (VLS1 Backup)
- 2017-03-16 `517cd9a3` Minor fix of variable weight equipment and remaining tons (VLS1 Backup)
- 2017-03-15 `8bd4517b` Fixed gaping ImportJSON bug on Welcome (VLS1 Backup)
- 2017-03-15 `ec6dca73` Minor Alpha Strike calculation adjustments (VLS1 Backup)
- 2017-03-15 `5b9ff08a` Added Melee category and variable equipment size properties. Hatchetman BV and costs correspond to MUL. Closes #46 (VLS1 Backup)
- 2017-03-15 `b4580d1f` Set up default to use the minified script.js - devs use the debug.html for ease of debugging (VLS1 Backup)
- 2017-03-15 `aba3b909` Fixes display part of #45. I don't think rear weapon BV is still calculating right (VLS1 Backup)
- 2017-03-15 `24a8bf3d` Quad Damage Chars and bubbles. Closes #43 (VLS1 Backup)
- 2017-03-14 `4507852a` Dip my toe back in on the Gauss rifle, include gauss tag for #32 (Brent Ezell)
- 2017-03-11 `41fad9f2` Initial work on quad damage bubbles, added angularitics.map because I don't like 404s, and fixes for manifest cache 404 (VLS1 Backup)
- 2017-03-10 `a01e1be0` Quad Damage Labels and Diagrams (VLS1 Backup)
- 2017-03-10 `250e8550` Added message on Step5 for user to add a missile or ballistic weapon to add availale ammo (VLS1 Backup)
- 2017-03-10 `e0708e71` Fixed discrepency (ammo is not included in cbi cost of mech) - Closes #12 (VLS1 Backup)
- 2017-03-10 `3b7fdc50` Initial CBill Cost (VLS1 Backup)
- 2017-03-10 `074d4d05` Initial CBill Cost (VLS1 Backup)
- 2017-03-10 `dd028c7c` Initial CBill Cost (VLS1 Backup)
- 2017-03-10 `3e1a2841` Closes #41, fixes issue on plain.html for analytics (VLS1 Backup)
- 2017-03-09 `b952b2e5` JS Compilation (VLS1 Backup)
- 2017-03-09 `76c4e3d6` #30 - added angularlytics to track page nav and 1 event, weapon add (Steven Molen)
- 2017-03-09 `fdc0acaf` Readded function that was breaking the credits page (VLS1 Backup)
- 2017-03-09 `4643b30a` YUGE refactoring of clasMech.js to allow for true private variables. Adding prototypes deny access to constructed private variables (VLS1 Backup)
- 2017-03-09 `17bb8b2c` Removed ancient experimental code (VLS1 Backup)
- 2017-03-09 `86337049` More Work on #36 (VLS1 Backup)
- 2017-03-09 `25a4fbfb` Initial Work on #36 (VLS1 Backup)
- 2017-03-09 `8cbc3280` Updated BV parenthetical label (VLS1 Backup)
- 2017-03-09 `fe3242d3` Updated BV parenthetical label (VLS1 Backup)
- 2017-03-09 `e0ae642c` Minor BV Adjustments - fixed type in IS equipment (AC5 is BV 70, not 75 - this killed me for 15 minutes until I did a side by side of BV calc with SSW). (VLS1 Backup)
- 2017-03-09 `fe8403ab` Fixed energy efficient mech BV costs (VLS1 Backup)
- 2017-03-09 `29e554bd` Initial Completion of BattleValue - PXH-1 matches upscreen grunt! (VLS1 Backup)
- 2017-03-09 `29cf36a4` sync (VLS1 Backup)
- 2017-03-08 `c6630196` Cordova App fixes (Jeffrey D. Gordon)
- 2017-03-08 `8d58d046` Cordova App fixes (Jeffrey D. Gordon)
- 2017-03-08 `6d1141f7` Removed manifest caching on debug (VLS1 Backup)
- 2017-03-08 `4ed0ace0` Added debug.html and debug-plain.html plus hooks for debug mode in summary and print screens to go back to proper templates. Closes #39 (VLS1 Backup)
- 2017-03-08 `988284c7` Fixed mechType typo when refactoring of variable names occured yesterday. This broke the Mech Type dropdown on step 1 - easy fix (VLS1 Backup)
- 2017-03-08 `637ce027` Turned off manifest cache for development (VLS1 Backup)
- 2017-03-08 `7545cd9f` Turned off manifest cache for development (VLS1 Backup)
- 2017-03-08 `e5620f2b` Turned off manifest cache for development (VLS1 Backup)
- 2017-03-08 `cadc5f7e` Fixed typos and urls in latest manifest, some fontawesome files needed cache breaker and wrong ubuntu font was specified (VLS1 Backup)
- 2017-03-08 `7a95ff0d` Last of initial Manifest Cache thinning (VLS1 Backup)
- 2017-03-08 `d5222b3e` Thinned out cache payload (VLS1 Backup)
- 2017-03-08 `f9b25f5c` Enabled Manifest Caching. Once this version is 'pinned to home screen' it becomes a 1st class citizen on iPad and maybe Android devices and should work offline (VLS1 Backup)
- 2017-03-07 `fe124b28` Forgot to reference on plain.html and cordova.html (VLS1 Backup)
- 2017-03-07 `84705776` Moved foundation, fonts, external JS to local for eventual move to a self-contained app (VLS1 Backup)
- 2017-03-07 `261dc68d` Added Clear Search to Alpha Strike Builder (VLS1 Backup)
- 2017-03-07 `228130c1` Closes #34 (VLS1 Backup)
- 2017-03-07 `1b2a2ccd` IE11 Printing Fixes (VLS1 Backup)
- 2017-03-07 `3ffe195a` Record Sheet - Highlighted rollable items for clarification of valid crits (VLS1 Backup)
- 2017-03-07 `d5a0e184` Fixed Heat Sink type on Record Sheet (VLS1 Backup)
- 2017-03-07 `fd50775b` Added ammo counts to weapons and equipment and added to crit table (VLS1 Backup)
- 2017-03-07 `4253a81c` Removed Ammo Per Ton numbers on IS weapons, renamed ammo from spelled out AutoCannon/ to AC/ so that it fits in crit slots (VLS1 Backup)
- 2017-03-07 `d0bd67b7` Safari still trying to print header, while others had no problems with removing header inprint.css (VLS1 Backup)
- 2017-03-07 `b38dd3b1` Safari still trying to print header, while others had no problems with removing header inprint.css (VLS1 Backup)
- 2017-03-07 `7a564dc5` Strange compilation didn't compile classMech.js that had bugs (VLS1 Backup)
- 2017-03-07 `ebf969b3` Fixed print.css reference (VLS1 Backup)
- 2017-03-07 `2a2b208a` Re-enabled minifying of js, closes #33 (VLS1 Backup)
- 2017-03-07 `b6354951` Re-enabled minifying of js, closes #33 (VLS1 Backup)
- 2017-03-06 `22921ebb` Versioned up pages, removed all dev-note messages for in-progress screenshots (VLS1 Backup)
- 2017-03-06 `8f4012bb` Made all 'roll again' entries in crits to be in parentsis (VLS1 Backup)
- 2017-03-06 `556ecb69` Re-phrased TRO and renamed armor and is types so that they'd fit properpy on critical area (VLS1 Backup)
- 2017-03-06 `d571ee68` Updated TROs to name types of armor and Internal Structures (VLS1 Backup)
- 2017-03-06 `9e7e4934` Closes #31 (VLS1 Backup)
- 2017-03-06 `7fa4851c` Forgot to 'Armor Type' to the language file (VLS1 Backup)
- 2017-03-06 `509839be` Removed extraneous files, renamed project in index.html (VLS1 Backup)
- 2017-03-06 `c57bf35d` Heat Sink Dropdown, and starting simplification of HS calcs because of it. Closes #24 (VLS1 Backup)
- 2017-03-06 `921821ec` Removed uglify from grunt calls, this project isn't using minidifed script.min.js (VLS1 Backup)
- 2017-03-06 `3db4f791` Armor Type Selection (VLS1 Backup)
- 2017-03-05 `fbbf4bc2` Hack up a solution to #28; this may stand some refactoring to a more elegant solution (Brent Ezell)
- 2017-03-05 `7de2449f` Integrate light and standard autocannons (Brent Ezell)
- 2017-03-03 `cf5ea742` Fixed border on record sheet grouping on last item (VLS1 Backup)
- 2017-03-03 `53423f1c` AS Recalculate AS PV with skill level set (VLS1 Backup)
- 2017-03-03 `f5031ac1` Added AS custom name to summary (VLS1 Backup)
- 2017-03-02 `3858a250` Added customization of mechwarrior and AS card role on summary screen (VLS1 Backup)
- 2017-03-02 `17c9bf01` Update to Crit Grouping (prettify) (VLS1 Backup)
- 2017-03-02 `07821fe3` Fixed word wrapping in era (VLS1 Backup)
- 2017-03-02 `07441244` Tiny spacing and font adjustments in RS (VLS1 Backup)
- 2017-03-02 `cabd9e17` Record Sheet crit chart (VLS1 Backup)
- 2017-03-02 `83f7ec46` Internal Structure bubbles and labels (VLS1 Backup)
- 2017-03-02 `ea03ada8` Heat Sink and Heat Sink Effect tables (VLS1 Backup)
- 2017-03-02 `d1f37097` Initial completion of armor bubbles on record sheet (VLS1 Backup)
- 2017-03-01 `96f1e812` Added Print CSS file for older Safari (VLS1 Backup)
- 2017-03-01 `92d8faeb` Added TRO printing (VLS1 Backup)
- 2017-03-01 `e8596ab2` Added TRO printing (VLS1 Backup)
- 2017-03-01 `226c0fab` Standalone App Printing fixes (VLS1 Backup)
- 2017-03-01 `a2f84742` Fixed minor mobile svg bug (VLS1 Backup)
- 2017-03-01 `2d871dfe` Fixed minor mobile svg bug (VLS1 Backup)
- 2017-03-01 `45a3dac0` Forgot new html file (VLS1 Backup)
- 2017-03-01 `32b1bb68` Some work arounds for Edge printing/viewing rosters (VLS1 Backup)

### 2017-02

- 2017-02-28 `21865bfb` Some Record Sheet cleanup to spacing and to the weapons and equipment (VLS1 Backup)
- 2017-02-28 `92097915` Bubble beginnings (head and center torso) (VLS1 Backup)
- 2017-02-28 `968e3602` Adjustment of mech armor svg (was cutting off half of bottom of feet line) (VLS1 Backup)
- 2017-02-28 `3776febd` RecordSheet Layout (VLS1 Backup)
- 2017-02-27 `a0f9d98f` Minor bugfixes to standalone links (VLS1 Backup)
- 2017-02-27 `f4384d93` Radded statandalone PDF links (VLS1 Backup)
- 2017-02-27 `c4456036` Radded statandalone PDF links (VLS1 Backup)
- 2017-02-27 `cf1615f8` Readded simplified PDF creation (VLS1 Backup)
- 2017-02-27 `da7422b1` Removed jspdf and pdfkit references, added logo to AS card (VLS1 Backup)
- 2017-02-27 `7c91d0d8` Vectorized BT logo (VLS1 Backup)
- 2017-02-27 `bd682fb5` Rearranging Exports items. Added Record sheet previews to Summary page. (VLS1 Backup)
- 2017-02-26 `6841bbca` Resolves #21 (Brent Ezell)
- 2017-02-25 `c0e8a611` Updated column sizes. Closes #25 (VLS1 Backup)
- 2017-02-24 `0f8b6f59` Removed null text from specials (VLS1 Backup)
- 2017-02-24 `01652327` Fixed typo in AS Card (VLS1 Backup)
- 2017-02-24 `3e4e2117` Conversion from HTML to SVG for Alpha Strike Cards (VLS1 Backup)
- 2017-02-24 `8cdd6b93` Conversion from HTML to SVG for Alpha Strike Cards (VLS1 Backup)
- 2017-02-24 `fdf975bd` Update armor type dates per IO (Brent Ezell)
- 2017-02-24 `ea1e7c94` Refactor engines, gyros, and equipment to use getItemAvailability() (Brent Ezell)
- 2017-02-24 `6e9c701c` Add eras, fix the engine and gyro dates.  Concept works but need to externalize era check logic. (Brent Ezell)
- 2017-02-24 `05da6432` Intro should be &lt;= (Brent Ezell)
- 2017-02-24 `09d1e8c9` Resolves #20 (no era changes yet) (Brent Ezell)
- 2017-02-24 `7f9c986e` Grunt updated files (Brent Ezell)
- 2017-02-24 `c96ab6e1` Finish out TM/TO energy weapons (Brent Ezell)
- 2017-02-23 `69859b58` updated personal bio with more accurate start year (VLS1 Backup)
- 2017-02-23 `82a8c54b` Removed Jump Jets from the top lines (VLS1 Backup)
- 2017-02-23 `3c98a712` Removed Jump Jets from the top lines (VLS1 Backup)
- 2017-02-23 `c70e5623` Put flamer in (didn't commit that somehow), fix LXPL dates (Brent Ezell)
- 2017-02-23 `0da5eff7` Fixed equipment search (VLS1 Backup)
- 2017-02-23 `c5ea07bb` Fixed some sorting issues in the eqequipment (VLS1 Backup)
- 2017-02-23 `ccb947a8` Added code to autoswitch era to Clan Invasion if Clan tech is selected (VLS1 Backup)
- 2017-02-23 `0d1072f1` Added code to autoswitch era to Clan Invasion if Clan tech is selected (VLS1 Backup)
- 2017-02-23 `7f0b692c` Updated App Version (VLS1 Backup)
- 2017-02-23 `c78b2432` Added JJs to PDF Tro (VLS1 Backup)
- 2017-02-23 `f230cd45` Quick bugfix on a function call on Gyro Selection: (VLS1 Backup)
- 2017-02-23 `609225f4` Initial work on clan dropdowns and calculations (VLS1 Backup)
- 2017-02-23 `e1b86891` Engine and Gyro options (VLS1 Backup)
- 2017-02-23 `2505ad7c` Added MoonSword22 to README and credits.html - feel free to expand on that :) (VLS1 Backup)
- 2017-02-23 `da6ea2d2` Added MoonSword22 to README and credits.html - feel free to expand on that :) (VLS1 Backup)
- 2017-02-23 `bf4d4b84` Data License Exceptions (VLS1 Backup)
- 2017-02-23 `2553e0a6` Data License Exceptions (VLS1 Backup)
- 2017-02-23 `ec6002d9` Data License Exceptions (VLS1 Backup)
- 2017-02-23 `a8252064` Closes #14 (VLS1 Backup)
- 2017-02-23 `cf48d1bc` Add explosive and missing damage_aero key, vee flamer ammo (Brent Ezell)
- 2017-02-22 `177a5c8f` Added an AppVersion in the Credits page to help mitigate and verify GitHub hosting slowness of page updates (VLS1 Backup)
- 2017-02-22 `badf2dcf` Label Change (VLS1 Backup)
- 2017-02-22 `116ea88d` Trying to bust iOS safari caches :/ (VLS1 Backup)
- 2017-02-22 `c1b22daa` Trying to bust iOS safari caches :/ (VLS1 Backup)
- 2017-02-22 `748a00ff` Trying to bust iOS safari caches :/ (VLS1 Backup)
- 2017-02-22 `578716a1` Actually Fixes #16 (although I said I won't fix it, it was bothering me) (VLS1 Backup)
- 2017-02-22 `35a96948` Actually Fixes #16 (although I said I won't fix it, it was bothering me) (VLS1 Backup)
- 2017-02-21 `98c1507e` Windows Pin to Start TIle color change (VLS1 Backup)
- 2017-02-21 `7eef6bb4` Windows Pin to Start TIle color change (VLS1 Backup)
- 2017-02-21 `6ee95b3f` Added a button to show alternative imports (VLS1 Backup)
- 2017-02-21 `23dd9c1f` Added ability to past JSON imports (VLS1 Backup)
- 2017-02-21 `0ed7354a` Minor data check update for settings (VLS1 Backup)
- 2017-02-21 `f084ebcd` Dang, I killed HeatSink Allocations - fixed (VLS1 Backup)
- 2017-02-21 `557ad6fb` Started work on equipment upgrades for future, and for current c-bill/bv costing (VLS1 Backup)
- 2017-02-21 `38d2e109` Added import/exporting of saved data (VLS1 Backup)
- 2017-02-21 `8b41d998` Rear allocation and other critical allocation bug squashing. Fixed UI bug for selected items too (VLS1 Backup)
- 2017-02-21 `f0564783` Added unallocated Jump Jets to TRO (VLS1 Backup)
- 2017-02-21 `4b868a47` Column mislablel (VLS1 Backup)
- 2017-02-21 `ece40baa` Fixes #17. Also adds some allocation requirement checks for rear-facing weapons and jump jet locations (VLS1 Backup)
- 2017-02-21 `8d8cc999` Image was not square.... grr (VLS1 Backup)
- 2017-02-21 `a7de747d` Added updated favicons (VLS1 Backup)
- 2017-02-21 `76653ec8` Updated credits to other projects (VLS1 Backup)
- 2017-02-21 `1e829a5a` Updated credits to other projects (VLS1 Backup)
- 2017-02-20 `1f6ed62d` Quick fix for a first-time user on status bar reading undefined for heat status variables (VLS1 Backup)
- 2017-02-20 `23b8b57d` Added some FA UI elements to various buttons (VLS1 Backup)
- 2017-02-20 `8ff51960` Tentatively completes #7 (VLS1 Backup)
- 2017-02-20 `0553c2a9` Fixes #8. I liked it saving as a PDF instead of opening in a new window better (VLS1 Backup)
- 2017-02-20 `7970b891` Fixes #15 (VLS1 Backup)
- 2017-02-20 `bf6676c3` Found typo in link for 'Next Step' on BM Welcome Page (VLS1 Backup)
- 2017-02-20 `e7ed82bf` Fixed minor bug introduced in #4 (VLS1 Backup)
- 2017-02-20 `9f95b268` Merged IS equipment from moonsword22's work :) (VLS1 Backup)
- 2017-02-20 `a8bec508` Fixes #5 (VLS1 Backup)
- 2017-02-20 `c7b44c08` Fixes #10 (VLS1 Backup)
- 2017-02-20 `ea41100d` Fixes issue #10 (VLS1 Backup)
- 2017-02-20 `a10e836d` Fixes #4, Fixes #9 (VLS1 Backup)
- 2017-02-20 `6ac3c9cc` Fixes issue #9, Fixes issue #4 (VLS1 Backup)
- 2017-02-20 `f0b1aed0` Fixes #1, Fixes #2 (VLS1 Backup)
- 2017-02-20 `91e0269c` Fixes issues #1 #2 (VLS1 Backup)
- 2017-02-19 `f92b2f75` Add PPCs, plasma rifle, vehicle flamer (Brent Ezell)
- 2017-02-18 `ccadcb89` AS calculation start (VLS1 Backup)
- 2017-02-18 `72ecf24d` Add pulse laser family, blazer (Brent Ezell)
- 2017-02-18 `2843bc21` Add accuracy_modifier and weapon_type keys, reformat book key (Brent Ezell)
- 2017-02-16 `3c3fb06f` Add ER lasers (Brent Ezell)
- 2017-02-16 `6deb2c2a` Add reintroduced and book keys, set dates and other values per TM and IO (Brent Ezell)
- 2017-02-16 `7897da7c` Fix of shortcut icons for new home (VLS1 Backup)
- 2017-02-16 `1f44bf7d` Updated to SSL version of MUL (VLS1 Backup)
- 2017-02-16 `05928045` Quick UI color fix (VLS1 Backup)
- 2017-02-16 `e55a7810` Quick UI color fix (VLS1 Backup)
- 2017-02-16 `edbfd275` Typo bugfixes to head allocation (VLS1 Backup)
- 2017-02-16 `5828f175` Initial removal of DND crit allocations and new click then click that's compatible with all devices (VLS1 Backup)
- 2017-02-16 `5317c69b` Added note to not submit issues on BM creator (VLS1 Backup)
- 2017-02-16 `e99495f0` Added link to issues in dev note and credits (VLS1 Backup)
- 2017-02-16 `519b1e2b` Updated License (VLS1 Backup)
- 2017-02-16 `51b2b27e` AS now works thanks to skyhigh's latest fix on the MUL (VLS1 Backup)
- 2017-02-15 `71268bb3` Thanks to Skyhigh adding from favorites now works as intended - yay! (VLS1 Backup)
- 2017-02-08 `37150074` Alpha Strike initial development nearly done - waiting on API question (VLS1 Backup)
- 2017-02-08 `0d78c357` AS Card Styling (VLS1 Backup)
- 2017-02-08 `2d83580d` Rewrote Movement Imports - now handles multiple movement types. Also wrote in support for Vehicle Cards and crits (VLS1 Backup)
- 2017-02-07 `2fdecdc2` Added start of favorite groups in AS builder (VLS1 Backup)
- 2017-02-07 `68e8aaac` Some dev notes and more UI tweaks (VLS1 Backup)
- 2017-02-07 `41630f1c` Translation updates, removal of robots.txt from repo for live pushing, added cordova.html for future cordova app base (VLS1 Backup)
- 2017-02-07 `4826129b` Fixed bug in skill selection after transfer over from merge (VLS1 Backup)
- 2017-02-07 `83d0e1ea` Merging and styling complete - some bugfixes in AS in-play (heat) fixed too (VLS1 Backup)
- 2017-02-07 `5309a6e0` Merged Alpha Strike tools, added global header, etc (VLS1 Backup)

### 2016-03

- 2016-03-13 `20566df8` Renamed a few files, updated README (VLS1 Backup)
- 2016-03-04 `feb57c7d` Fixed quad critical slots (VLS1 Backup)
- 2016-03-04 `23988fae` Fixed quad critical slots (VLS1 Backup)
- 2016-03-03 `c5608eb5` Added dev notes (VLS1 Backup)
- 2016-03-02 `dd3dd033` Added favicons (VLS1 Backup)
- 2016-03-01 `3f3f9284` More PDF work, added dev notes (VLS1 Backup)
- 2016-03-01 `3ebd0ec8` Added JSPDF for future features (VLS1 Backup)
- 2016-03-01 `17d767c5` I can make a Phoenix Hawk! (VLS1 Backup)

### 2016-02

- 2016-02-29 `1400b35e` First alpha level code for cdrag and drop ritical  placement is complete (VLS1 Backup)
- 2016-02-22 `f17268cb` Step 5 logic complete (VLS1 Backup)
- 2016-02-20 `ce47f8cb` steps 1-4 (VLS1 Backup)
- 2016-02-19 `e9a8742e` Steps 1-3 should be 3039 complete (VLS1 Backup)
