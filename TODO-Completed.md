# Completed Work

Everything finished on Jeff's BattleTech Tools, newest first. `TODO.md` holds only open work; when an item
there is done and verified, move it to the top of this file.

- **Completed roadmap items** are the checked-off entries moved out of `TODO.md`, grouped by the roadmap
  section they came from.
- **Commit history** lists every non-merge commit on `master` by month, back to the first commit on
  2016-02-19: date, short hash, subject and author.

## Completed roadmap items

Moved from `TODO.md` on 2026-10-06 (66 items). Sections are in roadmap order; the newest section is last
in the roadmap, so it is listed first here.

### JBTIICRework review (2026-10-06)

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

### Runtime and tooling

- [x] Lint backlog cleared (2026-10-06): `npm run lint` reports 0 errors. The two unused helpers in
  `tools/live_mul_browser_probe.mjs` were removed, the rethrow in `tools/mul-sync/sync-mul.mjs` carries its
  `cause`, and those two Playwright scripts get browser globals in `eslint.config.mjs`. The phantom
  `tools/append_chunker.js` / `tools/range_chunker.js` entries are gone from `tsconfig.json`.

### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / G. Verification

- [x] Browser test: set up a small Aces game and play one full turn (initiative, both sides moving, combat, end
  phase), then save, reload and continue.
- [x] Backward compatibility: old AS force saves and backups load unchanged; the new game and campaign records
  round-trip.

### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / F. UI in the Alpha Strike section

- [x] Routes under `/alpha-strike/aces/`: an overview page, a solo/co-op game (setup, then the turn wizard), and
  campaigns (list, log, roster, pilots, sortie flow, after-sortie ledger). Add a tile on the Alpha Strike home.
  Domain logic stays in `src/classes` and `src/data`; pages only render and ask questions.

### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / E. Scouring Sands content (*Aces SS*)

- [x] Sortie index (00-BattleROM Review, 00-Training Simulator, 01-21) within the IP decision. Done as a page
  index on the rules page (`acesScouringSandsSorties`); full sortie records are player-entered. For each sortie:
  number, name, PV cap, OPFOR (unit, skill, deck, reserve), Command deck and starting card, objectives and SP,
  turn limit, Waypoint placement, and branch choices. Story, Waypoint and outcome text is referenced by entry ID
  only.
- [x] The guided tutorial's stacked deck order (e.g. Brawler 383, 253, 643, 213, 093, 513; *Aces SS* p.5), as a
  scripted first game.

### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / D. Campaign rules (*Aces* pp.23-37)

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

### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / C. Automated opponent engine (*Aces* pp.7-21, 38-40)

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

### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / B. Additional Alpha Strike rules (*Aces* pp.3-6, *Aces SS* pp.18-19)

- [x] Indirect Fire (IF#) in the to-hit calculator, with the p.3 example as a test. The judgment calls stay with
  the player. Spotter eligibility (didn't Sprint, hasn't attacked, has LOS, within 42"), modifiers,
  +1 to both attacks when the spotter also fires, one target per spotter, IF0* minimal damage, no OV, and Weapon
  Hits reduce IF. The worked example on *Aces* p.3 (TN 8) becomes a regression test.
- [x] "Front-loaded" unequal numbers (p.6), `getAcesFrontLoadedMoveOrder`; tested against the Erin/Ben example: a move-order helper that skips units which can't move (immobile, shut
  down, emplacements, transported infantry). Test it against the 8-vs-5 example.

### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / A. Game state and unit queries (`src/classes/`)

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

### Alpha Strike: BattleTech Aces (solo/co-op automated opponent and campaigns) / Decisions before any code

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

### BattleMech construction and play gaps / Canon equipment pass: still owed (branch `feature/canon-equipment-pass`, ledger `tools/canon-pass-ledger.md`)

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

### BattleMech construction and play gaps / IndustrialMechs and Primitive 'Mechs

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

### BattleMech construction and play gaps / Equipment still missing or unwired

- [x] Patchwork armor for 'Mechs (Batch 59; upstream #106): an armor type per location, weight rounded up
  to the half ton per location, per-location slots, BV and cost; the book's Griffin example (TO:AUE
  pp.188-189, 194; IO:AE p.82).
- [x] Colossal 'Mechs: IO:AE p.80 names the superheavy tripods "Colossals"; they build as a Tripod above 100
  tons (Batches 21-30).

### Import and export adapters / Solaris Skunk Werks (`.ssw`)

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

### Import and export adapters / Shared

- [x] One equipment-name lookup for every format: `findImportedEquipment(name, faction, mixedTech)` in
  `src/utils/importedEquipment.ts`. It checks the faction catalog and the universal catalog by own name/tag,
  then the universal catalog, faction catalog, other faction (Mixed Tech only) and custom catalogs by
  `alternateName`/`altNames`/`altTags`. A format's spellings go on the records, never as name rewriting.

### Fix what ships

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

### Roadmap introduction

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
