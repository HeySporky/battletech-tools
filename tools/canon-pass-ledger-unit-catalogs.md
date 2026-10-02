# Canon equipment pass: unit-domain catalogs ledger

Companion to `canon-pass-ledger.md`, for the catalogs of units the builders do not construct yet (large craft,
aerospace, Support Vehicles, ProtoMechs, battle armor). Same columns and status words: **added** (new record),
**verified**, **fixed**, **flagged** (needs a source or a decision; not changed).

Book abbreviations follow the newest printing: TM = TechManual 6th printing (2021), TO:AUE = Tactical Operations:
Advanced Units & Equipment, IO:AE = Interstellar Operations: Alternate Eras, SO = Strategic Operations.
Pages are printed pages.

## Batch 49: capital and sub-capital weapon catalogs

Two new literal-array catalogs, `src/data/capital-weapons.ts` (27 records) and `src/data/sub-capital-weapons.ts` (10 records), typed by a new `ICapitalWeapon` interface. They are **not** registered in the equipment registry, so no 'Mech or vehicle builder can offer them; a test pins that and checks that no tag collides with 'Mech equipment.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| NAC/10, /20, /25, /30, /35, /40 | capital-weapons | **added** (6) | TO:AUE p.143 (rules), pp.220-221 (tables), p.196 (BV) | TO:AUE v7.0: none | Both tech bases, D, 2,000 to 4,500 tons. JumpShips, WarShips, space stations, mobile structures |
| Light / Medium / Heavy N-Gauss | same | **added** (3) | TO:AUE p.145; same tables | none | E. "do not cause additional explosive damage if hit" |
| NL35, NL45, NL55 | same | **added** (3) | TO:AUE p.145 | none | D |
| Light / Medium / Heavy N-PPC | same | **added** (3) | TO:AUE p.146 | none | D |
| Killer Whale, White Shark, Barracuda, AR-10 Launcher | same | **added** (4) | TM p.210 (rules), p.342 (table), pp.292, 296 (cost), p.318 (BV) | TM v8.0: availability D-X-D, introduced 2305 (AR-10 2550), Tech Rating F -> D; all already in the printing on file | Both tech bases, E. The AR-10 fires the other three and has no values of its own |
| Kraken-T, Killer Whale-T, White Shark-T, Barracuda-T | same | **added** (4) | same | none | Inner Sphere, F |
| Screen Launcher | same | **added** | TM p.237; same tables | TM v8.0: Tech Rating F -> E (table p.342) | Inner Sphere, F; BV 160 / 20 each count toward the Defensive Battle Rating |
| Light / Medium / Heavy Mass Driver | same | **added** (3) | TO:AUE p.135; tables pp.220-221; BV p.196 | none | Inner Sphere, D, Experimental. WarShips and space stations only, +2 to hit, 30,000 to 100,000 tons |
| Light / Medium / Heavy SCC | sub-capital-weapons | **added** (3) | TO:AUE p.155; tables pp.222-223; BV p.196 | none | E. Support vehicle slots 30 / 50 / 60; one slot on DropShips and larger |
| SCL/1, SCL/2, SCL/3 | same | **added** (3) | TO:AUE p.155 | none | Support vehicle slots 20 / 26 / 32 |
| Piranha, Stingray, Swordfish, Manta Ray | same | **added** (4) | TO:AUE p.156 | none | Support vehicle slots 18 / 25 / 30 / 38 |

Conventions:

- **Damage** is stored in capital-scale points. TO:AUE prints both ("20 (2-C)"); TechManual prints only the standard-scale figure for capital missiles (Killer Whale 40), which is stored as 4.
- **Dates and availability** follow the IO:AE advancement table (p.33), the newest source: for example Naval Autocannons E-X-E-E, extinct ~2950, reintroduced 3051. Early Spaceflight is 2100. IO:AE dates the weapons by family, so TO:AUE's per-size years are not kept where they differ (NAC/20 2197, NAC/40 2202, Heavy N-Gauss 2449, NL55 2307, Light / Medium N-PPC 2358).
- **Tech base** follows IO:AE: sub-capital cannons and lasers are "All" with "Clan Intro: 3091", missiles "Clan Intro: 3073", carried as `clanDates`. TO:AUE's rules boxes still say Inner Sphere for the cannons and lasers.
- **Rules level:** 2 for the TechManual items, 3 Advanced, 4 Experimental (Mass Drivers).

Flags:

- **Ammunition units.** TO:AUE's BV table marks only the sub-capital missiles "Per shot, not per ton", so the Naval Autocannon, Naval Gauss, Mass Driver and SCC ammunition values are recorded per ton. MegaMek applies the same numbers per shot. The cost column ("Item / Ammo Cost") names no unit at all: recorded per shot, as MegaMek does; the other reading is per ton. Both units are fields on the record (`cbillsPer`, `battleValuePer`), so either can be corrected without touching the numbers.
- **Tech Rating of capital missiles, two current sources.** TechManual (table p.342, as corrected by errata v8.0) rates the capital missile launchers, the AR-10 and the tele-operated launchers D and the Screen Launcher E. The IO:AE advancement table (p.33) rates the launchers and the AR-10 E and the tele-operated launchers and Screen Launcher F. The records follow IO:AE, as the rest of this pass does for ratings and dates. Say if TechManual should win here.
- **Large-craft slot columns for capital missiles.** TechManual's table stops at DropShips (Screen Launcher: Small Craft and DropShips). JumpShip, WarShip, space station and mobile structure columns are `null`, not guessed. Strategic Operations should supply them.
- **Not yet in the catalogs:** the non-teleoperated Kraken (TM names only the Kraken-T), capital missile special munitions and nuclear warheads, Naval C3, Naval Comm-Scanner Suites, Naval Tug Adaptor, repair facilities, bay and fire-control rules. Clan-only capital items: none are printed in these tables.
- N-PPC page: TO:AUE's own table says 146; IO:AE's reference column says 145.

Regression tests: `src/data/capital-weapons.test.ts` (6 tests).

## Batch 51: aerospace, large-craft and Support Vehicle armor catalogs

Two new catalogs for units that have no builder yet. Neither is read by the 'Mech or vehicle builders.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Standard Armor (Aerospace) | aerospace-armor-types | **added** | TM p.205; points per ton p.192; cost p.283 | TM v8.0: none | Fighters 16 points per ton; small craft and DropShips by tech base and, for DropShips, hull shape and tonnage band (Clan 20 down to 7, Inner Sphere 16 down to 6). IO:AE p.30: All/D, C-C-C-B, ~2460 / 2470 |
| Light Ferro-Aluminum, Ferro-Aluminum, Ferro-Aluminum (Clan), Heavy Ferro-Aluminum | same | **added** (4) | TM pp.191-192, 205, 283 | none | 16.96 / 17.92 / 19.2 / 19.84 points per ton on fighters, with the DropShip bands; fighter weapon slots 1 (aft), 2 (1 each wing), 2, 4 (1 each arc); 15,000 / 20,000 / 20,000 / 25,000 C-bills per ton. Dates as the matching Ferro-Fibrous armor (IO:AE p.29) |
| Primitive Aerospace Fighter Armor | same | **added** | IO:AE p.119; cost pp.181, 215; dates p.29 | v3.01: none | "identical to that used by Primitive BattleMechs": 16 x 0.67 points per ton, BAR 10; 5,000 C-bills per ton; IS/C, B-C-B-B, Early Spaceflight prototype, production ~2300 |
| Standard Armor (Capital), Improved Ferro-Aluminum, Ferro-Carbide, Lamellor Ferro-Carbide | same | **added** (4) | SO p.140 (points per ton), p.146 (cost) | SO:AAR v5.0: none found | Capital-scale points per ton for JumpShips, WarShips and space stations, in three tonnage bands, Inner Sphere / Clan. 10,000 / 50,000 / 75,000 / 100,000 C-bills per ton. Dates IO:AE p.30 |
| Support Vehicle Armor BAR 2 to BAR 10 | support-vehicle-armor | **added** (9) | TM p.206; weight table p.134; cost p.280 | none | Kilograms per point by Tech Rating A-F, where the Armored chassis modification is required, BAR 10's Ferro-Fibrous slot space at E and F, C-bills per point (50 to 625). Dates and availability IO:AE p.29 |

Helpers: `getAerospaceArmorPointsPerTon(tag, unit, techBase, tons)` and `getSupportVehicleArmorWeight(bar, techRating, points)` (the TM p.134 example, 92 points of BAR 6 at rating D = 3,496 kg = 3.5 tons, is a test).

Flags:

- **Table order.** The TM table is headed "(Clan/Inner Sphere)": the first figure of each pair is the Clan one (small craft standard armor 20 / 16). The SO table is headed "[Inner Sphere/Clan]".
- **Strategic Operations printing.** The page numbers are those of the Strategic Operations text on file (and IO:AE cites "140, SO"). The newer *Strategic Operations: Advanced Aerospace Rules* printing is not on file as text, so its page numbers are not given.
- **Capital armor dates.** The SO cost table prints 2350 / 2370 / 2615; IO:AE (newer) gives production 2520 / 2570 / 2615 with prototypes ~2500 / ~2550 / ~2600, extinct 2950, recovered 3052 / 3055 / 3055. IO:AE is used. IO:AE has no row for capital standard armor: SO's 2300 and three-era availability (B-B-B) are kept for it.
- **Duplicate record.** `mech-armor-types.ts` still holds a "Ferro-Aluminum Armor" record flagged for fighters, small craft and DropShips with no points-per-ton table. It is left in place (a test pins it) with a note pointing here; one of the two should go when an aerospace builder is written.
- Ferro-Lamellor, Reactive, Reflective and the Dark Age armors on aerospace units (TO:AUE, IO:AE) are not in this catalog yet; neither is Primitive small craft / large craft armor (IO:AE p.118 onward).
- Support Vehicle armor is "Always Available" for BAR 2 to 6 (IO:AE footnote); the Primitive vehicle BAR rows of IO:AE p.39 (TM p.121 dates) are not carried separately.

Regression tests: `src/data/aerospace-armor-types.test.ts` (6), `src/data/support-vehicle-armor.test.ts` (5).

## Batch 52: ProtoMech component catalog

New catalog `src/data/protomech-components.ts` (9 records, `IProtoMechComponent`), for a ProtoMech builder that does not exist yet. Weights are in kilograms, as ProtoMech construction is.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| ProtoMech Cockpit | protomech-components | **added** | TM p.85; cost p.279; dates IO:AE p.33 | TM v8.0: none | 500 kg, 500,000 C-bills, no Weapons Inventory slot. Clan/F, X-X-E-D, ~3055 / 3060 |
| Ultraheavy ProtoMech Cockpit | same | **added** | IO:AE p.95; table p.215 | v3.01: none | "ProtoMechs over 9 tons must assign 750 kilograms to their cockpit systems"; 800,000 C-bills; 3083 |
| ProtoMech Heat Sink | same | **added** | TM p.86; cost p.279; dates IO:AE p.36 | none | 250 kg, 2,000 C-bills each, single only, none free with the engine |
| ProtoMech Jump Jets | same | **added** | TM p.84 (weight table); cost p.279; IO:AE p.95 (Ultraheavy); dates p.29 | none | 50 kg per Jumping MP at 2-5 tons, 100 kg at 6-9, 150 kg for Ultraheavy; cost 200 x jets squared x tonnage |
| Extended Jump Jet (XJJ) System | same | **added** | IO:AE p.59; cost pp.178, 213 | none | Twice the jump jet weight (100 / 200 / 300 kg); Jump MP up to Running MP; cost tonnage x 500 x Jump MP squared; ~3071 / 3075 |
| ProtoMech, Ultraheavy, Quadruped and Glider Structure | same | **added** (4) | TM p.82; IO:AE p.95, table p.215; dates p.42 | none | All 10 percent of the ProtoMech's weight; 400 / 400 / 500 / 600 C-bills per ton; Ultraheavy and Quad 3083, Glider 3084 |

Helper: `getProtoMechJumpJetWeightKg(tag, tons, jumpMP)` (the TM p.84 example, 5 Jumping MP on a 6-ton ProtoMech = 500 kg, is a test).

Flags:

- **Availability codes.** The IO:AE cost table (p.215) gives the expanded ProtoMech components three eras ("X-X-D"); the advancement table has no rows for them. Recorded as printed. The XJJ is F/X-X-F on the cost table and XXFD on the advancement table: the advancement table is used.
- **Not in this catalog:** the engine (standard fusion, 25 kg per rating point below 40), musculature and actuator costs, the ProtoMech UMU (TO:AUE p.107, IO:AE p.95: variable weight, cost by footnote, not yet read), the Inner Sphere ProtoMech Interface (IO:AE p.96), the structure-point and location-limit tables, and the Magnetic Clamp System. The Myomer Booster, Partial Wing, Melee Weapon and Quad Melee System are equipment records already.

Regression tests: `src/data/protomech-components.test.ts` (5).
