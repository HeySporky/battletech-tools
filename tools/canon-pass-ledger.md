# Canon equipment pass: ledger

One row per item checked. Status: **added** (new record), **verified** (record matches the book), **fixed** (record
corrected), **flagged** (needs a source or a decision; not changed).

Book abbreviations follow the newest printing: TM = TechManual 6th printing (2021), TO:AUE = Tactical Operations:
Advanced Units & Equipment, IO = Interstellar Operations (2016), SO:AA = Strategic Operations: Advanced Aerospace.
Pages are printed pages.

## Batch 1: UI category labels

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| C3 Computer (Slave) | mech-is-equipment-weapons-misc | fixed | – | – | category "Misc Equipment" → "Miscellaneous Equipment" |
| C3 Computer (Master) | mech-is-equipment-weapons-misc | fixed | – | – | same relabel |
| ECM Suite | mech-is-equipment-weapons-misc | fixed | – | – | same relabel |
| CASE | mech-is-equipment-weapons-misc | fixed | – | – | same relabel |
| C3 Boosted System (Master) | mech-is-equipment-weapons-misc | fixed | – | – | same relabel; legacy `extinct: 0, reintroduced: 0` left for the TO:AUE batch |
| Prototype TAG | mech-is-equipment-weapons-misc | flagged | – | – | `page: null`, `reintroduced: 0`; check in the IO batch |

## Batch 2: gyros

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Standard Gyro | mech-gyro-types.ts | verified | TM p.219 (table TM p.50) | none | ×1, 4 slots; IO dates 2300p / 2350 |
| Extra-light (XL) Gyro | mech-gyro-types.ts | verified | TM p.220 (table TM p.50) | none | ×0.5, 6 slots; IS only; 3055p / 3067 |
| Compact Gyro | mech-gyro-types.ts | verified | TM p.219 (table TM p.50) | none | ×1.5, 2 slots; IS only; 3055p / 3068 |
| Heavy-Duty Gyro | mech-gyro-types.ts | verified | TM p.219 (table TM p.50) | none | ×2, 4 slots; IS only; 3055p / 3067 |
| Superheavy Gyro | battlemech.ts (tonnage > 100) | fixed | IO:AE p.156 | none | weight ceil(rating/50), now 2 CT slots (was 4); dates ~2905 (FW) / 2940 (FW) per IO:AE p.42; **cost provisional**: priced at Heavy-Duty rate, unverified |
| No Gyro (gyroless) | – | gap | IO:AE p.110 (construction), BV IO:AE p.187 | – | only with the Machina Domini interface cockpit; gyro slots become empty; implement in the cockpit batch |

All gyro dates (prototype/production, tech base) checked against the IO Tech Progression table, IO:AE p.42. Unknown `extinct`/`reintroduced` changed from legacy `0` to `null` (`_itemIsAvailable` treats both as "none").

## Batch 3: myomer

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Standard musculature | mech-myomer-types.ts | fixed | TM p.277 (cost) | none | dates 2300p / 2350 per IO:AE p.42 (was 0); extinct/reintroduced → null |
| Triple-Strength Myomer | mech-myomer-types.ts | verified | TM p.304 (BV ×1.5) | none | 3028p / 3050; extinct/reintroduced → null |
| Industrial TSM | mech-myomer-types.ts | verified | TM p.70 (12 slots), TM p.304 (BV ×1.15) | none | 3035p / 3045; extinct/reintroduced → null |
| Prototype TSM | mech-myomer-types.ts | verified | IO:AE p.98 | none | reintroduced → null |
| Super-Cooled Myomer | mech-myomer-types.ts | fixed (added) | IO:AE p.88; slots p.215, cost p.179, BV p.185 | none | RISC experimental, IS; 3132p, extinct 3140, no production year |
| MASC (IS) | mech-is-equipment-weapons-misc | fixed | TM p.232 (was 225) | none | – |
| MASC (Clan) | mech-clan-equipment-weapons-misc | fixed | TM p.232 (was 225) | none | extinct/reintroduced → null |
| Actuator Enhancement System (IS arm/leg) | mech-is-equipment-weapons-misc | fixed | – | none | IS production 3109 per IO:AE p.42 (was 3108); extinct/reintroduced → null |
| Actuator Enhancement System (Clan arm/leg) | mech-clan-equipment-weapons-misc | fixed | – | none | Clan production 3108 per IO:AE p.42 (was 3109); extinct/reintroduced → null |
| ProtoMech Myomer Booster | mech-clan-equipment-weapons-misc | fixed (added) | TM p.232; weight/slots TM p.85; cost TM p.279; rules TW p.137 | none | ProtoMech only (`space.battlemech` -1); 3066p / 3068; BV unresolved (0 placeholder, flagged) |
| Supercharger | mech-universal-equipment | fixed | TO:AUE p.157 | none | production ~3078 per IO:AE p.29 (was 1950); TO:AUE lists an early-spaceflight prototype, year unpublished, so prototype left as is |
| Superheavy musculature | – | gap | IO:AE p.156 | none | not a separate myomer type; superheavy 'Mechs cannot use MASC, TSM, AES or Superchargers (IO:AE p.156). Not enforced in battlemech.ts yet: validation gap, queued for the superheavy batch |

The ProtoMech booster's `battleValue: 0` and `cbills: 0` are placeholders: the BV is unresolved and the cost is a formula. Both are flagged for the ProtoMech batch.

## Batch 4: engines

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Standard Fusion | mech-engine-types.ts | verified (flag) | TM p.214 | none | IO:AE p.38 gives prototype/production "ES", common ~2300; kept `introduced` 2300 (IO common date), since ES has no year |
| Extralight (XL) Fusion [IS] | mech-engine-types.ts | verified | TM p.214 | none | 2556p / 2579, extinct 2865, reintroduced 3035 per IO:AE p.38 |
| Extralight (XL) Fusion [Clan] | mech-engine-types.ts | verified | TM p.214 | none | ~2824p / 2827 per IO:AE p.38 |
| Light Fusion | mech-engine-types.ts | verified | TM p.214 | none | IS only; ~3055p / 3062 per IO:AE p.38 |
| Compact Fusion | mech-engine-types.ts | fixed | TM p.214 | none | IS only; dates now ~3065p / 3068 per IO:AE p.38 |
| XXL Fusion [IS] | mech-engine-types.ts | fixed | TO:AUE p.120 | none | production ~3110 per IO:AE p.38 |
| XXL Fusion [Clan] | mech-engine-types.ts | fixed | TO:AUE p.120 | none | ~2954p / ~3084 per IO:AE p.38 |
| ICE | mech-engine-types.ts | verified (flag) | TM p.215 | none | IO:AE p.38 gives "ES" (early spaceflight); kept `introduced` 1950, no year published |
| Fuel Cell | mech-engine-types.ts | verified | TM p.215 | none | ~2300p / 2470 per IO:AE p.38 |
| Fission | mech-engine-types.ts | verified | TM p.215 | none | 2470p / 2882 per IO:AE p.38 |
| Primitive Fusion | mech-engine-types.ts | fixed | IO:AE p.117 | none | 2439p / 2443, extinct 2520 per IO:AE p.44 (primitive 'Mech); the unsourced 3070 reintroduction was removed |
| Large engines (LSF, LICE, LLF, LXL, LXXL) | – | gap | IO:AE p.38 (cites original TO pp.307–309; TO:AUE page not yet checked) | none | ratings above 400; not in the catalog; 'Mech legality unverified, queued for the superheavy batch |

All engines now carry `book`/`page` (new optional `IEngineType` fields). Every legacy `extinct: 0` / `reintroduced: 0` changed to `null`. A regression test (`Batch 4 engine catalog`) pins the dates and sources.

## Batch 5: internal structure

Dates are from IO:AE p.42 (Universal Technology Advancement Table).

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Standard | mech-internal-structure-types.ts | fixed | TM p.225 | none | 2430p / 2439 per IO:AE p.42 (was `introduced: 0`, "always available") |
| Endo-Steel [IS] | mech-internal-structure-types.ts | verified | TM p.224 | none | 2480p / 2487, extinct 2850, reintroduced 3035 |
| Endo-Steel [Clan] | mech-internal-structure-types.ts | verified | TM p.224 | none | 2825p / 2827; extinct/reintroduced → null |
| Composite | mech-internal-structure-types.ts | fixed | TO:AUE p.154 | none | IS only; 3061p / 3082 (was `introduced` 3061, the prototype year) |
| Endo-Composite | mech-internal-structure-types.ts | fixed | TO:AUE p.154 | none | IS 3067p / 3085. Clan prototype 3073; Clan production 3085 **inferred** from the "All" production column, no separate Clan year printed |
| Reinforced | mech-internal-structure-types.ts | fixed | TO:AUE p.155 | none | IS 3057p / 3084; Clan prototype 3065, production 3084 (shared "All" column) |
| Industrial | mech-internal-structure-types.ts | verified | TM p.224 | none | 2300p / 2350 |
| Superheavy structures (SH Standard, SH Endo-Steel, SH Endo-Composite, SH Industrial) | – | gap | IO:AE p.42 | none | not in catalog; queued for the superheavy batch |
| Tripod structure | – | gap | IO:AE p.42 | none | 2590p / 2602; tripods currently reuse the standard structure tables; queued for the superheavy batch |
| ProtoMech structure | – | n/a | TM p.225 | none | ProtoMech-only; not a 'Mech structure choice, not added |

Every structure now carries `book`/`page`, and every legacy `extinct: 0` / `reintroduced: 0` changed to `null`. Costs unchanged. A regression test (`Batch 5 internal structure catalog`) pins the dates and sources.

## Batch 6: armor

Dates are from the IO:AE pp.29–30 Universal Technology Advancement Table (Patchwork: p.45). IO:AE (©2016–2022) is newer than IO (2016), so it wins under the newest-publication rule (user, 2026-10-01). The armor rows are identical in both books except for the page references, which IO:AE updates to TO:AUE / IO:AE pages.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Standard | mech-armor-types.ts | verified | TM p.205 | none | ~2460p / 2470; 16 pts/ton (TM p.56); 10,000/ton (TM p.278) |
| Ferro-Fibrous [IS] | mech-armor-types.ts | verified | TM p.205 | none | 2557p / 2571, extinct 2810, reintroduced 3040; x1.12, 14 slots (TM p.56) |
| Ferro-Fibrous [Clan] | mech-armor-types.ts | verified | TM p.205 | none | ~2820p / ~2825; x1.2, 7 slots; extinct/reintroduced → null |
| Light Ferro-Fibrous | mech-armor-types.ts | verified | TM p.205 | none | IS only; ~3055p / 3067; x1.06, 7 slots; 15,000/ton |
| Heavy Ferro-Fibrous | mech-armor-types.ts | verified | TM p.205 | none | IS only; ~3056p / 3069; x1.24, 21 slots; 25,000/ton |
| Stealth | mech-armor-types.ts | verified (flag) | TM p.206 | none | IS only; ~3051p / 3063; 12 slots. TM p.206 lists it for BattleMechs only, but the record is still `combatVehicle: true`; fixed in Batch 6b together with Vehicular Stealth |
| Hardened | mech-armor-types.ts | verified | TO:AUE p.93 | none | 3047p / ~3081; Clan prototype 3061; 8 pts/ton, 0 slots; BM, IM, CV |
| Laser Reflective [IS / Clan] | mech-armor-types.ts | fixed | TO:AUE p.93 | none | IS 3058p / ~3080; Clan 3061p / ~3080; slots 10 / 5. Support vehicles added to unit types (BM, IM, CV, SV, BA, AF, CF) |
| Reactive [IS / Clan] | mech-armor-types.ts | fixed | TO:AUE p.94 | none | IS 3063p / ~3081; Clan 3065p / ~3081; slots 14 / 7. Support vehicles and aerospace fighters added to unit types |
| Ferro-Lamellor | mech-armor-types.ts | fixed | TO:AUE p.92 | none | Clan only; 3070p / 3109; 14 pts/ton, 12 slots. Small craft and DropShips removed (rules list BM, IM, CV, SV, AF, CF) |
| Modular | mech-armor-types.ts | fixed (flag) | TO:AUE p.93 | none | was `introduced` 3070, unsourced. Now 3072p / ~3096; Clan prototype 3074, production 3096 (shared "All" column). Flag: the record carries `armorMultiplier` 16 / Clan 0, but the table gives 10 points per ton and tech base Both. The record is equipment-mode; the selectable item is `modular-armor` in the misc catalog (misc batch) |
| Patchwork | mech-armor-types.ts | verified (flag) | TO:AUE p.189 | none | production 3075, common ~3080 (IO:AE p.45); no prototype year (PS). Flag: `costMultiplier` 12,000 is unsourced |
| Primitive | mech-armor-types.ts | fixed | IO:AE p.118 | none | was `introduced` 2290 (Commercial's prototype year). Now ~2430p / ~2439 ("Primitive 'Mech/Industrial Armor"); x0.67; 5,000/ton (IO:AE p.181). Vehicles removed: primitive combat vehicles use support vehicle armor (IO:AE p.115). Fighters removed: Primitive Aerospace Fighter Armor is a separate row with its own dates (IO:AE p.29, rules p.119) |
| Commercial | mech-armor-types.ts | fixed (flag) | TM p.205 | none | was 2400, 16 pts/ton, 1,200/ton, IS only. Now ~2290p / ~2300; 16 x 1.5 = 24 pts/ton, BAR 5 (TM p.72); 3,000/ton (TM p.278); BV modifier 0.5 (TM p.315); both tech bases (TM p.206). IndustrialMech only. Flag: the 'Mech builder does not offer it to IndustrialMechs yet |
| Ferro-Aluminum | mech-armor-types.ts | fixed (flag) | TM p.205 | none | was `introduced` 2650, unsourced. Same row as Ferro-Fibrous: 2557p / 2571, extinct 2810, reintroduced 3040; Clan ~2820p / ~2825. Flag: multipliers are stored as 1.12 / 1.2 without the 16 base, and small craft / DropShips are ticked although TM p.206 lists fighters only (aerospace batch) |
| ProtoMech Armor | mech-armor-types.ts | fixed | TM p.205 | none | ~3055p / 3060. Points per ton 22 → 20 (50 kg per point, TM p.86) |
| Mimetic (battle armor) | mech-armor-types.ts | fixed (flag) | TM p.253 | none | ~3058p / 3061; IS only. Flag: slots, cost (65,000) and multiplier are not battle armor values (battle armor batch) |
| Improved Stealth (battle armor) | mech-armor-types.ts | fixed (flag) | TM p.252 | none | ~3055p / 3057; Clan introduction 3058. Flag: cost 60,000 vs TM p.281 "Stealth, Improved 20,000" (battle armor batch) |
| Ferro-Fibrous Prototype | mech-armor-types.ts | fixed | IO:AE p.66 | none | 2557p; production is Ferro-Fibrous in 2571; recovered prototype 3034 (IO:AE p.97); 16 slots; 60,000/ton (IO:AE p.179). Was `book: "IO"`, `page: null` |
| Anti-Penetrative Ablation | mech-armor-types.ts | fixed | IO:AE p.80 | none | IS only; prototype 3100 → 3105; 3114; 12 pts/ton, 6 slots; 15,000/ton (IO:AE p.215); aerospace fighters added (BM, IM, CV, SV, AF, CF) |
| Ballistic-Reinforced | mech-armor-types.ts | fixed | IO:AE p.81 | none | IS only; 3120p / 3131; 12 pts/ton, 10 slots; 25,000/ton; support vehicles and aerospace fighters added |
| Heat-Dissipating | mech-armor-types.ts | fixed (flag) | IO:AE p.81 | none | prototype 3115 → 3111; 3123; Clan introduction 3126 with no Clan prototype published (was 3115). Vehicles removed (BM, IM only). Flag: the p.81 text says Clan Hell's Horses 3125; the p.29 table and the p.215 cost table both say 3126. Kept 3126 |
| Impact-Resistant | mech-armor-types.ts | fixed | IO:AE p.81 | none | IS only; prototype 3090 → ~3092; 3103; 14 pts/ton, 10 slots (rules on p.82); 20,000/ton. Vehicles removed (BM, IM only) |

**For the user: same-book conflict (publication date cannot settle it).** IO:AE prints two armor BV modifier tables. The Dark Age Armor Modifiers Table (p.185) gives ABA 1.2, Heat-Dissipating 1.05, Impact-Resistant 1, Ballistic-Reinforced 1.2. The Alternate Era Weapons and Equipment Battle Value Table (p.190) gives ABA 1.2, Heat-Dissipating 1.1, Ballistic-Reinforced 1.5. The catalog keeps the p.190 values, which MegaMek also uses. Proposed: leave as is unless errata says otherwise.

**Gaps (none of these are 'Mech-legal):**

| item | source | domain | queued for |
|---|---|---|---|
| Vehicular Stealth | TO:AUE p.94; 3067p / 3084 | combat/support vehicle, fighter | added in Batch 6b |
| ProtoMech Electric Discharge (EDP) Armor | IO:AE p.58; ~3071p, extinct 3085, 75 kg/point | ProtoMech | added in Batch 6b |
| Primitive Aerospace Fighter Armor | IO:AE p.119; ES / ~2300 | aerospace | aerospace batch |
| Aerospace Armor, Primitive Armor (small craft / large craft) | TM p.205, IO:AE p.118 | aerospace | aerospace batch |
| Improved Ferro-Aluminum, Ferro-Carbide, Lamellor Ferro-Carbide | SO:AA p.140 (per IO:AE p.30; page not yet checked) | large craft | capital batch |
| Support Vehicle Armor BAR 2–10 | TM p.206 | support vehicle | vehicle batch |
| Battle armor: Standard (Basic/Advanced), Stealth (Prototype/Basic/Standard), Fire Resistant, Reactive, Laser Reflective | TM pp.252–253, TO:AUE pp.92–94 | battle armor | battle armor batch |

Every armor now carries `book`/`page`, and every legacy `extinct: 0` / `reintroduced: 0` changed to `null`. `book: "IO_AE"` became `"IO:AE"` in this file; other catalogs still mix `IO_AE` / `IO-AE` / `IO:AE` and `TO:AU&E` / `TO:AUE` (normalise in a later cleanup). A regression test (`Batch 6 armor catalog`) pins dates, sources, and the corrected unit types.

**Re-cite check (done 2026-10-01):** Batches 2–5 originally cited IO (2016) page numbers for dates. All 99 gyro, engine, structure, myomer, cockpit and heat sink rows of the Universal Technology Advancement Table are identical in IO and IO:AE apart from the page-reference column, so no data changed. Citations moved to IO:AE: engines p.38 (was IO p.44), structure / gyro / musculature p.42 (was IO p.48), unit-type rows p.44 (was IO p.50), primitive engine rule p.117 (was IO p.123), superheavy gyro and musculature p.156 (was IO p.162). One wrong cite corrected: the Supercharger row is on IO:AE p.29 (IO p.35), not on the structure page. Still owed: the pre-existing LAM / QuadVee comments in `battlemech.ts` that cite IO pp.105–196 have not been re-checked against IO:AE.

## Batch 6b: vehicle and ProtoMech armor

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Stealth (BattleMech) | mech-armor-types.ts | fixed | TM p.206 | none | `combatVehicle` true → false: TM p.206 lists Stealth for BattleMechs only |
| Vehicular Stealth | mech-armor-types.ts | added | TO:AUE p.94 | none | IS only; 3067p / 3084 (IO:AE p.29); 16 pts/ton, 2 slots (TO:AUE p.92); 50,000/ton (TO:AUE p.217); CV, SV, AF, CF; not BattleMech-legal. Vehicles saved with `stealth-basic` now load as `vehicular-stealth` (`Vehicle.setArmorType`). Flag: the vehicle builder does not yet enforce the ECM requirement or the 10 heat |
| Electric Discharge ProtoMech (EDP) Armor | mech-armor-types.ts | added | IO:AE p.58 | none | Clan, ProtoMech only; ~3071 prototype, no production, extinct 3085 (IO:AE p.30); 75 kg/point (p.59); 1,250 C-bills per point (p.178), stored per ton; BV 32 as a weapon (p.190) |

A regression test (`Batch 6b vehicle and ProtoMech armor`) pins both new records, and `vehicle.test.ts` covers the legacy-save mapping.

## Batch 7: heat sinks

Dates are from the IO:AE p.36 Universal Technology Advancement Table. Page convention used in this pass: `page` is the page of the item's rules box (Rules Level / Available To / Tech Base); IO:AE's reference column points to the entry heading, which can be one page earlier.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Single | mech-heat-sink-types.ts | fixed | TM p.220 | none | was `introduced` 1950, unsourced, page 221. TM p.220: "Introduced: Circa 2022 (Western Alliance, Terra)"; IO:AE p.36 lists Early Spaceflight, always available. Now 2022, p.220 |
| Double [IS] | mech-heat-sink-types.ts | verified | TM p.221 | none | 2559p / 2567, extinct 2865, reintroduced 3040 |
| Double [Clan] | mech-heat-sink-types.ts | verified | TM p.221 | none | ~2825p / ~2827; extinct/reintroduced → null |
| Laser | mech-heat-sink-types.ts | verified | TO:AUE p.129 | none | Clan only; ~3040p / 3051; BattleMechs only; heading on p.128, rules box on p.129 |
| Compact | mech-heat-sink-types.ts | verified | TO:AUE p.128 | none | IS only; 3058p / 3079; BattleMechs only |
| Double (Prototype) | mech-heat-sink-types.ts | verified | IO:AE p.65 | none | 2559 prototype until production 2567; 18,000 C-bills (IO:AE p.211) |
| Double (Freezers) | mech-heat-sink-types.ts | verified | IO:AE p.96 | none | 3022 prototype until recovery 3040; 30,000 C-bills (IO:AE p.213) |
| ProtoMech Heat Sinks | – | gap | TM p.221 | none | Clan, ProtoMech only; ~3055p / 3060; not added: the heat sink list has no unit-type gate, so it would be offered to Clan 'Mechs. ProtoMech batch |
| Radical Heat Sink System | mech-is-equipment-weapons-misc.ts | queued | IO:AE p.83 | none | ~3115p / 3122; misc batch |
| Coolant Pod | – | queued | TO:AUE p.115 | none | 3049p / ~3079, Clan introduction 3079; misc batch |
| RISC Emergency Coolant System, RISC Heat Sink Override Kit | misc catalogs | queued | IO:AE p.86 | none | prototypes 3136 / 3134, extinct 3140 / 3139; misc batch |

Every legacy `extinct: 0` / `reintroduced: 0` changed to `null`; `book: "IO_AE"` became `"IO:AE"`. A regression test (`Batch 7 heat sink catalog`) pins the dates and sources.

## Batch 8: cockpits

There was no cockpit catalog: Standard and Small were hard-coded in `battlemech.ts`, and the chassis cockpits carried costs marked "provisional". New literal catalog `src/data/mech-cockpit-types.ts` (15 records). The builder now reads cockpit weight and cost from it. Dates are from the IO:AE pp.33–34 Universal Technology Advancement Table.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Superheavy Tripod 'Mech Cockpit | mech-cockpit-types.ts; battlemech.ts | **fixed (rules bug)** | IO:AE p.156 | none | the builder weighed it at 6 tons. IO:AE p.156 and p.159 both say 5 tons, as does the p.217 cost table and MegaMek. ~3130p / 3135; 500,000 (p.217). Flag: the p.217 cost table prints 2940 as its date; the p.33 advancement table is followed |
| Cockpit (BattleMech) | mech-cockpit-types.ts | added | TM p.211 | none | 3 tons; 200,000 (TM p.277); ~2468p / 2470. TM p.211 prints "circa 2300" for the 'Mech cockpit in general; IO:AE is newer and splits out the BattleMech cockpit |
| Small Cockpit | mech-cockpit-types.ts | added | TM p.211 | none | 2 tons; 175,000; final BV x0.95 (TM p.304); 3060p / 3067; Clan introduction 3080 |
| IndustrialMech Cockpit (with / without Advanced Fire Control) | mech-cockpit-types.ts | added (deferred) | TM p.211 | none | 3 tons; 100,000 without, 200,000 with (TM p.277); ~2469p / 2470. Not mounted by the builder yet |
| Primitive BattleMech Cockpit | mech-cockpit-types.ts | added (deferred, flag) | IO:AE p.117 | none | 5 tons; ~2430p / 2439, extinct 2520. Cost: see conflict below |
| Primitive IndustrialMech Cockpit | mech-cockpit-types.ts | added (deferred, flag) | IO:AE p.117 | none | 5 tons; ~2300p / 2350, extinct 2520. Cost: see conflict below |
| Torso-Mounted Cockpit | mech-cockpit-types.ts | added (deferred) | TO:AUE p.113 | none | 4 tons, 2 center torso slots (p.112); 750,000 (p.219); 3053p / ~3080, Clan prototype 3055; BV: center torso armor doubled, final BV x0.95 (p.193) |
| Cockpit Command Console | mech-cockpit-types.ts | added (deferred) | TO:AUE p.113 | none | add-on, 3 tons, 1 slot; 500,000 (p.219); ~2625p / 2631, Inner Sphere extinct ~2850, recovered ~3030; never lost by the Clans |
| BattleMech Interface Cockpit (Machina Domini) | mech-cockpit-types.ts | added (deferred, flag) | IO:AE p.110 | none | 4 tons, one extra cockpit slot, gyro optional; 1,500,000 (p.213); prototype only: IS ~3074, Clan ~3083. Flag: the p.213 cost table prints ~3078 for the IS prototype; the p.33 advancement table is followed |
| Direct Neural Interface Cockpit Modification | mech-cockpit-types.ts | added (deferred) | IO:AE p.62 | none | IS; add-on, no weight or slots; 500,000 (p.213); 3052p / 3055 |
| QuadVee Cockpit | mech-cockpit-types.ts | added | IO:AE p.128 | none | Clan; 4 tons, 2 head slots; 375,000 (p.215); ~3130p / 3135. Cost no longer "provisional" |
| Tripod 'Mech Cockpit | mech-cockpit-types.ts | added | IO:AE p.159 | none | IS; 4 tons; 400,000 (p.217); ~2590p / 2602. Cost no longer "provisional" |
| Superheavy BattleMech Cockpit | mech-cockpit-types.ts | added | IO:AE p.156 | none | IS; 4 tons; 300,000 (p.215); ~3060p / 3076. Cost no longer "provisional" |
| Superheavy IndustrialMech Cockpit | mech-cockpit-types.ts | added (deferred) | IO:AE p.156 | none | IS; 4 tons; 200,000 (p.215); ~2905p / 2940 |

**For the user: same-book conflict.** IO:AE p.117 says primitive cockpits are "identical in all ways to standard cockpits (including costs)" except for weighing 5 tons, which makes them 200,000 (BattleMech) and 100,000 (IndustrialMech). The IO:AE p.215 cost table prints 100,000 and 50,000. The catalog follows the p.117 text, which MegaMek also does. Proposed: leave as is unless errata says otherwise.

**Not wired yet (catalogued as `constructionStatus: "deferred"`):** Torso-Mounted, Command Console, Interface, DNI, and the IndustrialMech / primitive cockpits need a cockpit selector, slot layouts and their own rules (torso-mounted BV, gyroless Interface 'Mechs, command console initiative). The cockpit dates are not yet enforced by era either: Small Cockpit is offered in every era. Both go on the roadmap.

**Gaps (not 'Mech cockpits, not added):** ProtoMech Cockpit (TM p.211), Inner Sphere ProtoMech Interface (IO:AE p.96), Standard / Small / Primitive Aerospace Cockpits (TM p.211, TO:AUE p.112, IO:AE p.119), Drone and remote-control systems (TO:AUE pp.117–118, IO:AE p.84), Full-Head Ejection System (TO:AUE p.122; misc batch), Enhanced Imaging Interface (misc batch).

A regression test (`Batch 8 cockpit catalog`) pins the 5-ton fix, the catalog weights, costs, dates and sources.
