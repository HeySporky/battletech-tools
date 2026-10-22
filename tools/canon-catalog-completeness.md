# Canon catalog completeness ledger

Queue task 10 (2026-10-15): make the canon equipment catalogs complete. This ledger lists what is still missing and
tracks each batch until it is added. Pages marked *lead* come from the cross-check and must be read in the book
before a record is written.

## Method

1. Every catalog record at runtime (2,945 records with a name: all `src/data` modules, helper-built records included)
   was dumped and matched against two lists:
   - MegaMek's equipment identities (name, lookup names, tech base, rules level): 1,965 items, with unofficial items
     dropped. Reference only (rules §2, item 5); no code copied.
   - The cost and availability tables of TO:AUE (pp.215-230), IO and IO:AE (pp.210-220) and TM (pp.341-352).
2. Unmatched names were then searched by keyword across all of `src` (catalogs, classes and pages), because
   construction options (chassis mods, turrets, LAM/QuadVee conversion, superheavy parts) live in the builders
   rather than in catalogs, and many names differ only in word order.
3. What remains is below. TM's tables showed no gaps (the canon pass covered them).

Not gaps (checked):
- ProtoMech AC/2, AC/4 and AC/8 are in the catalog as "ProtoMech Autocannon/N".
- ProtoMech and battle armor launchers of any size are built by the ProtoMech tube model and `battle-armor-equipment.ts`.
- One-shot launchers are records ("(OS)", "(I-OS)").
- BAR 2-10 armor is in `support-vehicle-armor.ts`.
- The RISC Repeating TSEMP is in the catalog.
- B-Pod, M-Pod, Coolant and Chaff Pods, HarJel II/III, the Collapsible Command Module and Communications Equipment
  are in the catalog, so TODO.md's older "no catalog record yet" list is out of date.
- Prototype Double Heat Sinks, Freezers and Prototype Ferro-Fibrous are in the catalog.

## Batch A: weapons and fire control

| Item | Tech | Source | Status |
|---|---|---|---|
| Cruise Missile/50, /70, /90, /120 and ammo | IS | TO:AUE p.97 | **done** (A1) |
| Artemis V FCS and Artemis V launchers | Clan | TO:AUE p.95 | **done** (A2) |
| Prototype Artemis IV FCS | IS | IO:AE pp.64-65, 183 | **done** (A3) |
| Light Plasma Rifle, Heavy Plasma Rifle and ammo | IS | CRB pp.189, 248 | **done** (A4) |
| Light Blazer | IS | BattleTech: Gothic *lead* | deferred: needs a Gothic rules edition (task 11) |
| Prototype Rocket Launcher pod (bomb) | IS/Clan | IO:AE p.67 | not a record: IO:AE lets fighters carry the existing prototype rocket launchers as external ordnance (TW p.246) but prints no pod row; a bomb-builder rule, deferred |
| Thunder Active-IV (Arrow IV), Bola pods, Thunder Active and Vibrabomb bombs | IS | TO:AUE pp.169, 172, 180, 227 | **done** (A5). Thunder-Vibrabomb LRMs were already in (spelled "Vibrabomb") |
| Retro-Streak SRMs, Shoot-and-Sit Narc missiles | IS | IO:AE pp.126-127 | **done** (A5) |
| Fluid gun munitions: Coolant, Corrosive, Flame-Retardant Foam, Inferno Fuel, Oil Slick, Paint/Obscurant | IS/Clan | TO:AUE pp.173-175, 227 | **done** (A5); the standard round is Water |
| Dragon's Breath MCM launch system | IS | IO:AE pp.142-143, 190, 215 | **done** (A6) |

## Batch B: electronics, control and drone systems

| Item | Tech | Source | Status |
|---|---|---|---|
| Damage Interrupt Circuit | IS | IO:AE pp.62, 180, 213 | **done** (B1) |
| Enhanced Imaging Interface | Clan | IO:AE p.69 | **done** (B1) |
| BattleMech Neural Interface Unit (IS, Clan) | IS/Clan | IO:AE p.110, table p.213 | not unit equipment: built into the Machina Domini pilot's interface suit (0.1 t, 650,000); goes with the personal items under "Needs a scope ruling" |
| SLDF Advanced Neurohelmet | IS | IO:AE pp.62-63, 211 | **done** (B1); also the Virtual Reality Piloting Pod (IO:AE p.63) |
| Drone (Remote) Operating System, Drone Carrier Control System | IS/Clan | TO:AUE pp.117-118, 219 | **done** (B2) |
| Remote Drone Command Console | IS | IO:AE p.84, table p.215 | **done** (B3) |
| SRCS (standard, improved), Shielded Aerospace SRCS (3 grades), SDS (Caspar) Drone Control, Caspar II Advanced SRCS | IS/Clan | IO:AE pp.134-139, table p.215 | SRCS and Improved SRCS are built (`robotic-control-systems.ts`, vehicles and fighters). The rest are for Small Craft, DropShips, WarShips and stations, whose builders have no robotic control yet: builder work for the capital branch (tasks 7-9) |
| ATAC, DTAC, Advanced Robotic Transport System | IS/Clan | IO:AE pp.139-143, table p.215 | deferred with the large-craft robotics (DS/WS/SS control units) |
| SDS Self-Destruct System, SLDF SDS Jammer | IS | IO:AE p.142, table p.215 | deferred with the large-craft robotics (drone-only; the jammer is a 30,000-ton WarShip system) |
| Naval C3 | IS | TO:AUE p.144, table p.221 | deferred: a DropShip/JumpShip/WarShip/station system sized by the ship (100,000 x item tons); capital branch |
| Satellite imagers (Hi-Res, Hyperspectral, Infrared) | IS/Clan | TO:AUE p.151, table p.223 | **done** (B3) |
| Mobile HPG, Ground-Mobile HPG | IS/Clan | TO:AUE p.143, table p.221 | **done** (B3) |

## Batch C: vehicle, 'Mech and craft construction options

| Item | Source | Status |
|---|---|---|
| Combat Vehicle chassis mods: Flotation Hull, Limited and Fully Amphibious, Environmental (Vacuum) Sealing, Dune Buggy | TO:AUE pp.114-115, 193, 219 | **done** (C1) |
| BattleMech turrets (Shoulder, Head, Quad) | TO:AUE p.159 *lead*, table p.223 | missing |
| VTOL Jet Booster, VTOL Mast Mount | TO:AUE p.162 *lead*, table p.223 | missing |
| Vehicular DropChutes (Standard, Camouflage, Stealth, Reusable) | TO:AUE p.161 *lead*, table p.223 | missing (battle armor ones exist) |
| Combat Vehicle Escape Pod | TO:AUE p.121 *lead*, table p.219 | check: an escape pod record exists for craft |
| Handheld Weapon | TO:AUE table p.219 | missing |
| Jump Pack / Drop Pack (infantry) | TO:AUE table p.217 | missing |
| Small Aerospace Cockpit | TO:AUE table p.219 | missing |
| Energy Storage Battery, Light Sail, Naval Tug Adaptor, Naval Comm-Scanner Suite (Small, Large), PCMT | TO:AUE pp.118-149 *lead*, tables pp.219-223 | missing |
| Sub-Compact K-F Drive, Word of Blake Super-Jump Drive, Space Station K-F Adapter, Modular Space Stations, DropShuttle Bays | TO:AUE table p.223; IO:AE tables pp.211-213 | missing |
| RISC Advanced Point Defense System (standard, battlesuit) | IO:AE table p.215 | check: an APDS record exists |
| Prototype Endo Steel structure, Prototype XL engine | IO:AE table p.211 | missing |
| Industrial: Buzzsaw, Ladder, Dumper, Mine dispensers (vehicular, space), Searchlight (handheld), Ram Plate | TM pp.243, 245; TO:AUE pp.137-138 | open. Dumper and Ladder (TM) are variable-weight; the vehicular (0.5 t, 20,000) and space (10 t, 15,000) mine dispensers need mine-type ammunition (2 per ton) and minefield BV. Buzzsaw and Ram Plate: no TM or TO:AUE row found, check MegaMek's source |

## Needs a scope ruling

These are canon but not unit equipment, or they belong to an optional rule set:
- IO:AE MechWarrior augmentations: about 30 implants, prosthetics and Belter packages (table p.217).
- Weapons of mass destruction (IO:AE tables pp.217-218): chemical, biological and nuclear weapons, including the
  Alamo.
- Infantry weapons the cross-check takes from *Shrapnel* (about 130) and the *A Time of War Companion* (15). The
  catalog follows the TM and TO:AUE infantry tables.
- *A Time of War* personal kits (MechWarrior, pilot and tanker kits) and the TO:AUE infantry armor kits.

## Done

### A1. Cruise Missiles (2026-10-15)

- `cruise-missile-50` / `-70` / `-90` / `-120` (IS artillery) and their ammo. Sources:
  - Rules: TO:AUE p.97.
  - Combat and construction tables: TO:AUE pp.216-217.
  - BV: TO:AUE p.195 (601 / 1,031 / 1,530 / 2,281).
  - Dates: IO:AE p.31 (prototype 3065 FS, production 3095 FS, X-X-F-E).
  - Alpha Strike: ASCE p.201 (ART-CM5 / 7 / 9 / 12).
- Rules level Experimental (TO:AUE p.97). Not on 'Mechs or fighters. Support Vehicle slots 25 / 35 / 45 / 60.
- Ammo is "1/25" (1/35, 1/45, 1/60) per ton: one missile weighs 25 to 60 tons. The record is one missile, its weight
  that tonnage, with BV and cost per ton.
- **Flag:** the tables' ammo BV (75 / 129 / 191 / 285) and cost (20,000 / 50,000 / 90,000 / 140,000) are read as
  per missile, as MegaMek does; read per ton they would be out of all proportion to the launcher.
- Test: `vehicle.test.ts`, one 25-ton missile per bin.

### A2. Artemis V (2026-10-15)

- 14 launchers: Clan LRM 5-20, SRM 2-6, LRT 5-20 and SRT 2-6 "+ Artemis V".
- Build: +1.5 tons, +2 'Mech and Support Vehicle slots, +250,000 C-bills (TO:AUE p.217); BV ×1.3, unrounded
  (TO:AUE p.197 note J).
- Play and Alpha Strike:
  - Aerospace attack value is the Cluster Hits roll of 10 (TO:AUE p.95; TW p.33).
  - Alpha Strike damage from ASC p.110 (0.42 / 0.84 / 1.26 / 1.68; SRM 0.42 / 0.84 / 1.05).
- Dates: IO:AE (prototype 3061, production 3085). Rules level Experimental.
- Builder:
  - Every applicable launcher must carry it, and it cannot be mixed with Artemis IV (TO:AUE p.94). Enforced in the
    'Mech builder through the shared `ARTEMIS_FIRE_CONTROL` / `isArtemisCapableLauncher`.
  - IndustrialMechs need Advanced Fire Control for it.
  - BV ×1.3 in the fighter, Small Craft and capital ship builders (`getArtemisLauncherBattleValue`).
  - BLK `CLArtemisV` maps to it.

### Fixes found on the way

- **Artemis IV launcher BV.** Every "+ Artemis IV" record (IS, Clan, Clan Star League, MML, Enhanced LRM; 29
  records) carried the plain launcher's BV plus 8. TM p.303 says ×1.2, and the worked example on TM p.318 keeps it
  unrounded (136 × 1.2 = 163.2). Now plain × 1.2.
- **Clan LRM minimum range.** The Clan LRM + Artemis IV records had an IS minimum range of 6; Clan LRMs have none.
  The Enhanced LRM + Artemis IV records had 6 where the launcher has 3.
- **SSW import dropped fire control.** SSW marks Artemis IV / V / Apollo once per design
  (`<baseloadout fcsa4="TRUE">`), and the importer ignored it.
  - The importer now swaps each applicable launcher for its fire-control record.
  - Bundled SSW 'Mechs with Artemis now match their Master Unit List BV: 29 of 33 exact (before: 0 of 33). The
    control group without Artemis matches 402 of 441.
  - Regression test: Commando COM-5S (557) and Shogun C (3,032).
  - Still off: Centurion CN9-D3 (−194), CN9-D4D (−167), Dervish DV-8D (−54) and Zeus ZEU-9T (−27). The differences
    are not Artemis; to look at.
- **Open:** the Alpha Strike values on the "+ Artemis IV" records are workbook values (Clan LRM 5: 0.2/0.4/0.4)
  where ASC p.110 prints 0.4 at every range for Artemis IV. Left for the Alpha Strike pass.
- **Open:** no LRT or SRT "+ Artemis IV" record exists, although Artemis IV works on torpedo launchers. Check TM
  before adding them.

### A3. Prototype Artemis IV (2026-10-15)

- 7 launchers: IS LRM 5-20 and SRM 2-6 "+ Prototype Artemis IV" (`-artemis-p`). +1 ton, +1 slot, +300,000 C-bills;
  BV x1.1 (IO:AE p.183). Aerospace attack value at Cluster roll 8; Alpha Strike from ASC pp.106-107.
- Prototype 2592, never produced, extinct 2598 (IO:AE p.65). Experimental. Fires Artemis IV ammo.
- Builder: same all-launchers rule as Artemis IV and V; may be fitted alongside Artemis IV, not alongside Artemis V.

### A4. Light and Heavy Plasma Rifles (2026-10-15)

- Core Rulebook p.189: Light (damage and heat 4, 6/12/18, 3 t, 2 slots, 20 shots) and Heavy (12, 4/8/12, 9 t, 3 slots,
  8 shots). Offered only under the `core-rulebook` edition (`introducedInEdition`).
- **Flag:** BV (112 / 246, ammo 14 / 31) and cost (260,000; ammo 30,000) follow MegaMek: CRB p.248 prints no BV.
  Alpha Strike values unresolved.

### A5. Alternate munitions (2026-10-15)

- IO:AE pp.126-127: Retro-Streak SRMs (Streak SRM family) and Shoot-and-Sit Narc missiles (Narc family), cost x1.1,
  Experimental. **Flags:** the summary table prints 3045P and 3046P where the tech progression and text give 3048 and
  3049 (same-book conflict; MegaMek has neither munition, so the progression is used). Retro-Streak adds 15 to
  Defensive BV instead of an ammo BV; not modeled yet.
- TO:AUE: Thunder Active-IV Arrow IV missiles (cost x3; BV taken as the standard round's 30, flagged), Bola Narc pods
  (2,000 C-bills, prototype only), Thunder Active and Thunder Vibrabomb bombs (36,000 / 24,000; BV 168 / 140, seven
  20-point minefields by the TO:AUE p.197 minefield table).
- TO:AUE pp.173-175: six fluid gun rounds; the standard Fluid Gun round is Water. Ammo BV 1 as the standard round.
- Test: `src/data/alternate-munitions.test.ts`.
- **Open:** Arrow IV munition BVs are inconsistent in the catalog: most special rounds carry 0, FASCAM 30, Vibrabomb-IV
  100. TO:AUE gives cost and shot multipliers only (p.227). Needs one ruling for all alternate munition BVs.
- **Open:** the standard (Water) Fluid Gun round is non-explosive, as TO:AUE p.175 says; the other rounds explode on a
  critical hit ("2 points of internal damage from exploding Fluid Gun ammo") and are marked explosive.

### A6. Dragon's Breath (2026-10-15)

- Word of Blake one-shot multi-capital-missile launcher, in the capital weapons catalog: 5,000 tons, 15,000,000
  C-bills, BV 1,076 (IO:AE p.190), WarShips and space stations only, no weapon slot ("0*", IO:AE p.215). Prototype 3077,
  extinct 3078, Experimental.
- The capital ship builder now treats a 0 slot value as mountable without a slot.
- Its Alpha Strike special (DB, IO:AE p.207) and its automated firing rules are not modeled.

### B1. Advanced pilot interfaces (2026-10-15)

- In the cockpit catalog (`mech-cockpit-types.ts`), deferred like the DNI modification (catalogued, not mounted yet):
  - Damage Interrupt Circuit: 150 C-bills per seat, prototype 3055, extinct 3060 (IO:AE pp.33, 62, 180).
  - SLDF Advanced Neurohelmet: 5,000 per pilot, 2755 / 2759, extinct 2770 (IO:AE pp.34, 62-63, 211).
  - Enhanced Imaging Interface (Clan): 1,500,000, 3040. **Flag:** IO:AE prints no cost for the interface; MegaMek's.
  - Virtual Reality Piloting Pod: a 3-ton torso-mounted cockpit, 1,250,000, prototype 3052, extinct 3055 (IO:AE
    pp.63-64). **Flag:** the BV text says x1.4 (p.183), the table a -2 Piloting / -1 Gunnery skill modifier (p.190).
- **Fix:** the DNI modification cost 500,000 (IO:AE table p.213); the rules text says 250,000 (p.62), as MegaMek does.
  Same-book conflict: 250,000, flagged.

### B2. Remote drone systems (2026-10-15)

- `drone-operating-system` and `drone-carrier-control-system` (universal), sized by new `variable-equipment.ts`
  formulas: the OS is 10% of the unit (half ton) plus 0.5 t of sensors, 5,000 + 10,000 x the 10% share; the carrier
  is 2 t + 0.5 t per drone, 10,000 a ton (TO:AUE pp.117, 219). **Flag:** "item tons" for the OS read as the 10% share.
- Sized in the vehicle, 'Mech, fighter, Small Craft and capital ship builders. The vehicle keeps the drone count
  (`setControlledDrones`, saved); the craft builders use 1 drone until a control is added.
- **Open:** the drone BV rule (weapons x0.8, final x0.95, TO:AUE p.193), the Crew 0 rule, and a drone-count control in
  the vehicle UI.

### B3. Flat-stat electronics (2026-10-15)

- Mobile HPG (50 t, 1,000,000,000) and Ground-Mobile HPG (12 t, 4,000,000,000), TO:AUE pp.143, 221.
- Hi-Res, Infrared (universal) and Hyperspectral (IS) satellite imagers, TO:AUE pp.151, 223.
- Remote Drone Command Console (IS, 2 t, 50,000, 3140), IO:AE pp.84, 215.
- None has a BV row in TO:AUE; BV 0.

### C1. Combat Vehicle chassis modifications (2026-10-15)

- `combat-vehicle-chassis-modifications.ts` and the vehicle builder (`setChassisModification`, saved): Flotation
  Hull (hover, VTOL, WiGE; cost x1.25), Limited and Fully Amphibious (tracked, wheeled; tonnage / 25 and / 10,
  10,000 a ton; one or the other), Dune Buggy (wheeled; 10 x tonnage squared; -1 Cruising MP), Environmental Sealing
  (not submarines, which have it; tonnage / 10; cost x1.25). BV type modifier +0.1 each, +0.2 for Fully Amphibious
  (TO:AUE p.193). Advanced.
- UI: checkboxes on the vehicle chassis step at the Advanced rules level. Tests in `vehicle.test.ts`.
- **Open:** the water movement rules in play, and the record sheet listing.

