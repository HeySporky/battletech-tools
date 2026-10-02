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

## Batch 9a: misc equipment, Inner Sphere and Clan catalogs

All 48 Inner Sphere and 20 Clan records were compared with the IO:AE pp.29–39 Universal Technology Advancement Table. `page` is the page of the item's rules box. Every `extinct: 0` / `reintroduced: 0` became `null`. Rows below are the records where something other than that changed, plus flags; the other records matched.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Modular Armor | mech-is-equipment-weapons-misc | fixed | TO:AUE p.93 | none | cost 15,000 → 10,000 per ton (TO:AUE p.217, as MegaMek). Dates 3070 → 3072p / ~3096. Was "TO 281". Flag: tech base is Both (Clan prototype 3074) but there is no Clan record |
| Improved C3 Computer | mech-is-equipment-weapons-misc | fixed | TM p.209 | none | `introduced` 3052 was the prototype year; now ~3052p / 3062, extinct 3085. Was "TW 133" |
| Targeting Computer [IS] | mech-is-equipment-weapons-misc | fixed | TM p.238 | none | production 3061 → 3062 |
| CASE [IS] | mech-is-equipment-weapons-misc | fixed | TM p.210 | none | prototype 2452 added |
| CASE II [IS] / [Clan] | both | fixed | TO:AUE p.111 | none | `introduced` held the prototype year. IS 3064p / ~3082; Clan 3062p / ~3082 |
| C3 Boosted System (Master, Slave) | mech-is-equipment-weapons-misc | fixed | TO:AUE p.110 | none | prototype 3073 → 3071 |
| C3 Emergency Master | mech-is-equipment-weapons-misc | fixed | TO:AUE p.110 | none | was "TO 298" |
| Electronic Warfare (EW) Equipment | mech-is-equipment-weapons-misc | fixed | TO:AUE p.123 | none | was "TO", no page; ~3020p / 3025, extinct 3046 |
| Flail | mech-is-equipment-weapons-misc | fixed | TO:AUE p.101 | none | `introduced` held the prototype year; now 3057p / 3079 |
| Mace | mech-is-equipment-weapons-misc | fixed | TO:AUE p.102 | none | now 3061p / 3079 |
| Claws [IS] | mech-is-equipment-weapons-misc | fixed | TO:AUE p.101 | none | now ~3050p / 3060 |
| Claws [Clan] | mech-clan-equipment-weapons-misc | verified (flag) | TO:AUE p.101 | none | IO:AE p.32 prints 3090 as the Clan *prototype* and no Clan production year. The record keeps 3090 as the Clan introduction, as MegaMek does. For the user |
| Vibroblade (Large) | mech-is-equipment-weapons-misc | fixed | TO:AUE p.104 | none | prototype 3065 → 3066 |
| 'Mech Mechanical Jump Boosters | mech-is-equipment-weapons-misc | fixed | TO:AUE p.105 | none | now ~3060p / 3083 |
| Partial Wing [IS] | mech-is-equipment-weapons-misc | fixed | TO:AUE p.105 | none | IS prototype 3067 → 3074 (3067 is the Clan prototype) |
| Watchdog CEWS | mech-clan-equipment-weapons-misc | fixed | TO:AUE p.90 | none | now 3059p / 3080 |
| MASS [IS] / [Clan] | both | fixed | TO:AUE p.137 | none | was "TO 325"; IS 3048p / ~3083, Clan prototype 3062 |
| Blue Shield PFD | mech-is-equipment-weapons-misc | fixed | TO:AUE p.108 | none | was "TO 296"; 3053 prototype only |
| Radical Heat Sink System | mech-is-equipment-weapons-misc | fixed | IO:AE p.83 | none | prototype 3095 → ~3115 (was cited to FM:3145 p.247; IO:AE is newer); production 3122 |
| RISC Emergency Coolant System | mech-is-equipment-weapons-misc | fixed | IO:AE p.86 | none | extinct 3140 added; 3136 prototype only |
| Nova CEWS | mech-clan-equipment-weapons-misc | fixed | IO:AE p.60 | none | was cited to The Wars of Reaving p.203; IO:AE is newer; ~3065 prototype, extinct 3085 |
| Prototype TAG, Beagle, Guardian ECM, CASE-P, Remote Sensor Dispenser | mech-is-equipment-weapons-misc | fixed | IO:AE pp.65–67 | none | were "IO", no page |
| A-Pod [IS] / [Clan] | both | fixed | TM p.205 | none | page 204 → 205 (rules box); IS introduction 3055, Clan ~2845p / ~2850 |
| Retractable Blade | mech-is-equipment-weapons-misc | fixed | TM p.237 | none | page 236 → 237 (rules box) |
| HarJel [IS] | mech-is-equipment-weapons-misc | verified | TO:AUE p.100 | none | IS prototype 3067 is from the TO:AUE p.100 entry; IO:AE prints only the IS introduction, 3115 |
| AES [IS] | mech-is-equipment-weapons-misc | verified | TO:AUE p.91 | none | prototype 3070 (mercenary), IS production 3109, Clan 3108 |

**Missing from the misc catalogs (found in IO:AE pp.29–39; queued for Batch 9c):** Light Active Probe [IS] (TM p.204), Light TAG [IS] (TM p.238), B-Pods (TM p.205), M-Pod (TO:AUE p.143), Coolant Pod (TO:AUE p.116), C3 Remote Sensor Launcher (TO:AUE p.111), Chaff Pod (TO:AUE p.111), Collapsible Command Module (TO:AUE p.113), Full-Head Ejection System (TO:AUE p.122), MRM Apollo FCS (TO:AUE p.143), RISC Heat Sink Override Kit, RISC Viral Jammers and Laser Pulse Module (IO:AE pp.86–88), HarJel II / III (IO:AE p.82), 'Mech Taser, TSEMP, and the industrial and support equipment not yet in the universal catalog. Clan CASE has no record (the builder treats it as built in). Items that need construction support first (Armored Components, 'Mech turrets, booby traps) are noted for the roadmap, not added as plain records.

A regression test (`Batch 9a misc equipment catalogs`) pins dates and sources for all 68 records.

## Batch 9b: misc equipment, universal catalog

All 35 records compared with the IO:AE pp.29–42 advancement table. Every `extinct: 0` / `reintroduced: 0` became `null`. `introduced: 1950` is kept as the catalog's stand-in for IO "PS" / "ES" (pre- and early spaceflight, always available): IO prints no year for those items.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Artillery Cannons (Thumper, Sniper, Long Tom) | mech-universal-equipment | fixed (flag) | TO:AUE p.97 | none | prototype 3032 → 3012; 3032 is the Clan prototype (IO:AE p.31; TO:AUE p.217 "3012P / 3032P"). Production 3079. Proposed: Both (dates differ); one universal record cannot carry the Clan prototype year |
| 'Mech Mortars 1 / 2 / 4 / 8 | mech-universal-equipment | fixed (flag) | TO:AUE p.136 | none | were "TO 0". ~2526p / 2531. IO:AE p.40 has separate rows: IS extinct 2819, recovered 3043; Clan ~2835p / 2840. Proposed: Both (dates differ) → split into IS and Clan records in the weapons batch (tags and ammo links change) |
| Laser Insulator | mech-universal-equipment | fixed (flag) | TO:AUE p.134 | none | was "TO 322", reintroduced 3073 (unsourced). TO:AUE p.134: introduced 2575, extinct 2820, "Reintroduced: N/A"; IO:AE p.38: prototype 2575, Ext 2820 for the Inner Sphere only. The Clans never lost it; a universal record cannot say that. Proposed: Both (dates differ) |
| Nail/Rivet Gun | mech-universal-equipment | fixed | TM p.246 | none | was "TO 0"; ~2309p / ~2310 |
| Thumper, Sniper, Long Tom artillery | mech-universal-equipment | fixed | TO:AUE p.96 | none | were "TO 96"; Thumper and Sniper pre-spaceflight, Long Tom 2445p / 2500 |
| Fluid Gun | mech-universal-equipment | fixed | TO:AUE p.125 | none | was "TO 313"; pre-spaceflight |
| Chainsaw | mech-universal-equipment | fixed | TM p.242 | none | page 241 → 242 (rules box) |
| Vehicle Flamer | mech-universal-equipment | verified (flag) | TM p.218 | none | IO:AE p.35 points to "124, TO:AUE", but that page covers the ER and Heavy Flamers; the Vehicle Flamer rules are in the TM p.218 Flamer entry |
| Backhoe, Bridgelayers, Combine, Dual Saw, Pile Driver, Lift Hoist, Mining Drill, Rock Cutter, Wrecking Ball, Searchlight | mech-universal-equipment | verified | TM pp.237–249 | none | pre-spaceflight |
| Salvage Arm, Spot Welder, Tracks, Environmental Sealing, Remote Sensor Dispenser, Supercharger | mech-universal-equipment | verified | TM / TO:AUE | none | dates match |
| LAM Bomb Bay, LAM Fuel Tank | mech-universal-equipment | verified (re-cite owed) | IO p.114 / p.221 | none | still cited to IO (2016); IO:AE has the same material on pp.108, 214–215; part of the LAM re-cite |

A regression test (`Batch 9b universal equipment catalog`) pins dates and sources for all 35 records.

## Batch 10a: energy weapons, Inner Sphere and Clan catalogs

All 46 Inner Sphere and 39 Clan records compared with the IO:AE pp.29–40 advancement table. Every `extinct: 0` / `reintroduced: 0` became `null`. TechManual pages now point at the rules box: LASER p.226, PPC p.234, PLASMA p.235, FLAMER p.218. Rows below are the records where dates or sources changed, plus flags.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| X-Pulse Lasers (S/M/L) | mech-is-equipment-weapons-energy | fixed | TO:AUE p.133 | none | `introduced` 3057 was the prototype year; now 3057p / 3078. Was "TO 321" |
| Binary Laser (Blazer) Cannon | mech-is-equipment-weapons-energy | fixed | TO:AUE p.131 | none | `introduced` 2812 was the prototype year; now 2812p / 3077. Was "TO 319" |
| Laser AMS [IS] / [Clan] | both | fixed | TO:AUE p.134 | none | were cited to TM p.202 with the prototype year as production. IS 3059p / ~3079; Clan 3048p / ~3079 |
| ER Pulse Lasers (S/M/L) | mech-clan-equipment-weapons-energy | fixed | TO:AUE p.132 | none | now 3057p / 3082 (was `introduced` 3057) |
| Chemical Lasers (S/M/L) | mech-clan-equipment-weapons-energy | fixed | TO:AUE p.132 | none | now 3059p / 3083 (was `introduced` 3059) |
| Improved Heavy Lasers (S/M/L) | mech-clan-equipment-weapons-energy | fixed | TO:AUE p.133 | none | now 3069p / 3079 (was `introduced` 3069) |
| Heavy Lasers (S/M/L) | mech-clan-equipment-weapons-energy | fixed | TM p.226 | none | production 3058 → 3059 |
| Heavy Flamer [Clan] | mech-clan-equipment-weapons-energy | fixed | TO:AUE p.124 | none | 3068 was the Inner Sphere introduction; Clan is ~3065p / 3067 |
| ER Flamer [Clan] | mech-clan-equipment-weapons-energy | fixed | TO:AUE p.124 | none | prototype ~3065 added; production 3067 |
| ER Flamer, Heavy Flamer [IS] | mech-is-equipment-weapons-energy | fixed | TO:AUE p.124 | none | were "TO 312"; IS introductions 3070 and 3068 |
| Snub-Nose PPC | mech-is-equipment-weapons-energy | fixed | TM p.234 | none | prototype 2695 → ~2779 |
| Enhanced PPC | mech-clan-equipment-weapons-energy | fixed | IO:AE p.90 | none | ~2822p / 2823, extinct 2828 → 2831, reintroduced 3080 added. Was "IO 189" |
| PPC + Capacitor combinations (5) | mech-is-equipment-weapons-energy | fixed (derived) | TO:AUE p.149 | none | PPC Capacitor is 3060p / 3081 (IO:AE p.40). The combined records held 3060 / 3067 as production; now production 3081 and prototype = the later of the capacitor's and the PPC's prototype year (Snub-Nose: its 3067 recovery). Derived, not printed |
| Centurion Weapon System | mech-is-equipment-weapons-energy | fixed | IO:AE p.79 | none | ~2762 prototype only, extinct 2770 (was `introduced` 2762, "IO 85") |
| RISC Hyper Laser | mech-is-equipment-weapons-energy | fixed | IO:AE p.87 | none | 3134 prototype only, extinct 3141 (was `introduced` 3134, page 0) |
| Re-Engineered Lasers (S/M/L) | mech-is-equipment-weapons-energy | fixed | IO:AE p.83 | none | Large was cited to FM:3145 p.243; IO:AE is newer |
| Primitive Prototype Small / Medium / Large Laser, PPC | mech-is-equipment-weapons-energy | fixed (flag) | IO:AE p.112 | none | were "TO 0", 2300–2470. Prototype Dates for Basic Weapons Table: lasers 2290, large laser 2306, PPC 2439; each ends when the standard weapon enters production. Flag: that table prints large laser production 2310 and PPC prototype 2439, the p.37/p.40 advancement table 2316 and ~2440. The prototype record ends in 2316 so there is no gap |
| Prototype ER Large Laser, pulse laser prototypes, recovered Medium Pulse Laser, Clan prototype ER lasers | both | fixed | IO:AE pp.67, 91, 97 | none | were "IO", no page |
| Improved PPC, Improved Large Laser, Improved Large Pulse Laser | mech-clan-equipment-weapons-energy | verified (flag) | IO:AE pp.89–90 | none | dates follow the p.37/p.40 advancement table. Flag: the p.89 text prints "Introduced: 2818 (Improved Large Laser), 2820 (Improved Large Pulse Laser)" against ~2815 and 2818 in the table |
| ER PPC (Clan, Star League) | mech-clan-equipment-weapons-energy | fixed (flag) | TM p.234 | none | extinct 2860 → null. IO:AE p.40 marks the ER PPC extinction with "*": Inner Sphere only, never lost in Clan space. For the user: this leaves the Star League ER PPC selectable by Clan designs in every era |
| **Enhanced ER Large Laser** | mech-clan-equipment-weapons-energy | **unsourced (flag)** | "IO 189" | none | not found in IO (2016) or IO:AE: both list only the Improved Large Laser, Improved Large Pulse Laser, Improved PPC and Enhanced PPC. Record left as it was. For the user. Proposed: move to custom or remove |

A regression test (`Batch 10a energy weapon catalogs`) pins dates and sources for all 85 records.

## Batch 10b: ballistic weapons, Inner Sphere and Clan catalogs

All 45 Inner Sphere and 41 Clan records compared with the IO:AE pp.29–38 advancement table. Every `extinct: 0` / `reintroduced: 0` became `null`. TechManual pages now point at the rules box: AUTOCANNON p.208 (standard, LB-X, Ultra, Rotary, Light), GAUSS RIFLE p.219, MACHINE GUN p.228, ANTI-MISSILE SYSTEM p.204. Rows below are the records where dates or sources changed, plus flags.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Clan Rotary AC/2, /5 | mech-clan-equipment-weapons-ballistic | fixed | TO:AUE p.98 | none | `introduced` 3073 was the prototype year; now 3073p / 3104. Was "TO 0" |
| Hyper-Assault Gauss 20 / 30 / 40 | mech-clan-equipment-weapons-ballistic | fixed | TM p.219 | none | now ~3062p / 3068 (was `introduced` 3062, "TO 0") |
| ProtoMech AC/2, /4, /8 | mech-clan-equipment-weapons-ballistic | fixed | TO:AUE p.98 | none | now ~3070p / 3073 (was `introduced` 3070, "TO 0") |
| Improved Heavy Gauss Rifle | mech-is-equipment-weapons-ballistic | fixed | TO:AUE p.126 | none | now 3065p / 3081 (was `introduced` 3065, "TO 313") |
| Silver Bullet Gauss Rifle | mech-is-equipment-weapons-ballistic | fixed | TO:AUE p.127 | none | now 3051p / 3080 (was `introduced` 3051, "TO 314") |
| MagShot Gauss Rifle | mech-is-equipment-weapons-ballistic | fixed | TO:AUE p.126 | none | was "TO 314"; ~3059p / 3072 |
| Light / Medium / Heavy Rifle (Cannon) | mech-is-equipment-weapons-ballistic | fixed | TO:AUE p.150 | none | were "TO 0" with no extinction. Pre-spaceflight; extinct ~2825, recovered ~3084 for all factions (IO:AE p.32) |
| HVAC/2, /5, /10 | mech-is-equipment-weapons-ballistic | fixed | TO:AUE p.97 | none | were "TO 285"; 3059p / 3079 |
| Clan LB-X ACs | mech-clan-equipment-weapons-ballistic | fixed | TM p.208 | none | page 287 → 208 |
| Clan Ultra ACs, AP Gauss Rifle | mech-clan-equipment-weapons-ballistic | fixed | TM pp.208, 219 | none | were "TO 0" |
| Primitive Prototype AC/2, /5, /10, /20 | mech-is-equipment-weapons-ballistic | fixed (flag) | IO:AE p.112 | none | were "TO 0", 2300–2460 for all four. Prototype Dates for Basic Weapons Table: 2290, 2240, 2443, 2490; each ends at standard production (2300, 2250, 2460, 2500). Flag: the p.32 advancement table prints 2488 for the AC/20 prototype |
| Prototype LB 10-X AC | mech-is-equipment-weapons-ballistic | fixed | IO:AE p.66 | none | 2590 prototype until production 2595; recovered prototype 3030 (IO:AE p.98; was 3035, the recovery production year). Was "TO 0" |
| Prototype Gauss Rifle | mech-is-equipment-weapons-ballistic | fixed | IO:AE p.66 | none | 2587 prototype until 2590; recovered prototype 3038 (IO:AE p.97). Was "TO 0" |
| Prototype Ultra AC/5 | mech-is-equipment-weapons-ballistic | fixed | IO:AE p.98 | none | recovered prototype 3029 until production 3035. Was "TO 0" |
| Improved Autocannons, Improved Gauss Rifle | mech-clan-equipment-weapons-ballistic | fixed | IO:AE p.90 | none | were "IO 96" / no page |
| Clan prototype LB-X and Ultra ACs | mech-clan-equipment-weapons-ballistic | fixed (flag) | IO:AE pp.91–92 | none | were "IO", no page. End years follow the pp.91–92 text (LB 5-X 2825, LB 2-X / 20-X 2826; Ultra 10 / 20 2825, Ultra 2 2827). Flag: the p.32 advancement table gives one production year per family (LB-X ~2826, Ultra ~2827), which the production records use |
| RISC Advanced Point Defense System | mech-is-equipment-weapons-ballistic | fixed | IO:AE p.85 | none | was "IO 91"; 3134p / 3137 |
| Heavy Gauss Rifle | mech-is-equipment-weapons-ballistic | fixed | TM p.219 | none | page 218 → 219 |

A regression test (`Batch 10b ballistic weapon catalogs`) pins dates and sources for all 86 records.

## Batch 10c: missile launchers and artillery, Inner Sphere and Clan catalogs

All 118 Inner Sphere and 110 Clan missile records and the 3 Arrow IV records compared with the IO:AE pp.31–40 advancement table. Every `extinct: 0` / `reintroduced: 0` became `null`. TechManual pages now point at the rules box: MISSILE p.231, NARC/INARC p.233, ARTEMIS IV p.207 (launcher-plus-Artemis records). Rows below are the records where dates or sources changed, plus flags.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| SRT 2 / 4 / 6 | mech-is-equipment-weapons-missiles | fixed | TM p.231 | none | carried the one-shot launcher dates (2665 / 2676). Torpedo launchers are 2370p / 2380 (IO:AE p.40), as the LRTs already were |
| Extended LRM 5–20 | mech-is-equipment-weapons-missiles | fixed | TO:AUE p.139 | none | `introduced` 3054 was the prototype year; now 3054p / 3078. Were "TO 0" |
| Enhanced LRM (NLRM) 5–20, with and without Artemis IV | mech-is-equipment-weapons-missiles | fixed | TO:AUE p.139 | none | now 3058p / 3082 (was `introduced` 3058, "TO 0") |
| Thunderbolt 5–20 | mech-is-equipment-weapons-missiles | fixed | TO:AUE p.159 | none | prototype 3052 added; production 3072. Were "TO 0" |
| Thunderbolt (OS) / (I-OS) | mech-is-equipment-weapons-missiles | fixed | TO:AUE pp.159, 139 | none | were cited to "BMM 103", a book not in the library. I-OS: 3056p / ~3081 (was 3072) |
| MML 3–9, with and without Artemis IV | mech-is-equipment-weapons-missiles | fixed | TM pp.231, 207 | none | now ~3067p / 3068 (was `introduced` 3067, "TO 0") |
| MRM 10–40, Rocket Launchers 10–20 | mech-is-equipment-weapons-missiles | fixed | TM p.231 | none | were "TO 0"; dates matched |
| SRM (OS), SRT (OS) | mech-is-equipment-weapons-missiles | fixed | TM p.231 | none | one-shot launchers went extinct 2800, recovered 3030 (IO:AE p.40); these had no extinction while the LRM (OS) records did |
| SRM / SRT / Streak SRM (I-OS) | mech-is-equipment-weapons-missiles | fixed | TO:AUE p.139 | none | `introduced` 3056 was the prototype year; now 3056p / ~3081 |
| Primitive Prototype LRM 15 / 20, SRM 2 / 4 | mech-is-equipment-weapons-missiles | fixed | IO:AE p.112 | none | were "TO 0", `introduced` 2300, no end. LRMs 2295 until 2300; SRMs 2365 until 2370 |
| Prototype Rocket Launchers | mech-is-equipment-weapons-missiles | fixed | IO:AE p.67 | none | Early Spaceflight until standard production in 3064; were "IO 73" with no end year |
| Prototype Narc | mech-is-equipment-weapons-missiles | fixed | IO:AE p.67 | none | was "IO", no page |
| Prototype Arrow IV | mech-is-equipment-weapons-artillery | fixed | IO:AE p.64 | none | 2593 until production 2600 (was 2613, and a 3044 "reintroduction" IO:AE does not list). Was "IO 70" |
| Arrow IV [IS] / [Clan] | artillery catalogs | fixed | TO:AUE p.96 | none | were "TO 96"; dates matched |
| Streak LRM 5–20 | mech-clan-equipment-weapons-missile | fixed | TO:AUE p.139 | none | now 3057p / ~3079 (was `introduced` 3057, "TO 0") |
| iATM 3–12 | mech-clan-equipment-weapons-missile | fixed | IO:AE p.60 | none | were "IO 65"; ~3054p / 3070 |
| Clan LRM / SRM / Streak SRM, LRT / SRT | mech-clan-equipment-weapons-missile | fixed | TM p.231 | none | were "TM 280" or "TO 0"; Clan SRT (OS) prototype 2665 → 2820 |
| Clan SRM / SRT / Streak SRM (I-OS) | mech-clan-equipment-weapons-missile | fixed | TO:AUE p.139 | none | now 3058p / ~3081 (Clan prototype 3058) |
| LRM (Clan, Star League, OS) | mech-clan-equipment-weapons-missile | fixed | TM p.231 | none | Clan extinction 2830 added, matching the other Star League LRM copies |
| Improved LRMs / SRMs | mech-clan-equipment-weapons-missile | fixed | IO:AE p.90 | none | were "IO", no page |
| Clan prototype Streak SRM 4 / 6 | mech-clan-equipment-weapons-missile | fixed (flag) | IO:AE p.91 | none | were "IO", no page. End year 2826 follows the p.91 text; the p.40 advancement table prints ~2822 for Clan Streak production, which the production records use |
| **Enhanced Clan LRM 10** | mech-clan-equipment-weapons-missile | **unsourced (flag)** | "IO 189" | none | not found in IO (2016) or IO:AE, which list only the Improved LRMs. Record left as it was. For the user. Proposed: move to custom or remove |

**Derived dates.** One-shot, I-OS and Artemis IV records combine two published items. Each takes the later prototype and production year of its parts, and the earlier extinction and later recovery; nothing is printed for the combination itself.

A regression test (`Batch 10c missile and artillery catalogs`) pins dates and sources for all 231 records.

## Batch 11: jump jets

Dates are from the IO:AE p.29 Universal Technology Advancement Table.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Standard Jump Jets | mech-jump-jet-types.ts | verified | TM p.225 | none | 2464p / 2471 |
| Improved Jump Jets | mech-jump-jet-types.ts | fixed (flag) | TM p.225 | none | was IS 3067p / 3068 and Clan 3060p / 3068. IO:AE p.29: Clan Wolf-in-Exile ~3060 prototype, 3069 production; Inner Sphere introduction 3070, no Inner Sphere prototype in the table. Flag: IO:AE p.97 has a separate "Prototype Improved Jump Jets (IJJ-P)" item (Federated Suns, 3022) with its own rules; it is not catalogued |
| UMU | mech-jump-jet-types.ts | fixed | TO:AUE p.107 | none | Inner Sphere production 3066. Clan: 3061 was stored as production; it is the Goliath Scorpion prototype, and the Clan introduction is 3072 |
| ProtoMech Jump Jets, Extended Jump Jets (XJJ), ProtoMech UMUs | – | gap | TM p.225, IO:AE p.59, IO:AE p.95 | none | ProtoMech only; ProtoMech batch |
| Jump Pack / 'Mech Drop Pack | – | gap | TO:AUE p.105 | none | ~2430p / 2457; not in any catalog; misc batch |
| Vehicular Jump Jets | – | gap | TO:AUE p.161 | none | 2650p, extinct 2840, recovered ~3083; vehicle batch |

Every jump jet now carries `book`/`page` (new optional `IJumpJet` fields), and the legacy `0` dates changed to `null`. A regression test (`Batch 11 jump jet catalog`) pins the dates and sources.

## Batch 9c: misc equipment added from the books (part 1)

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| B-Pod | mech-universal-equipment | added | TM p.205 | none | Proposed: Universal. The Inner Sphere (TM p.342) and Clan (p.343) table rows are identical: 1 ton, 1 slot, one-shot. 2,500 C-bills (p.291); BV 2, defensive, treated as a Gauss weapon for explosive penalties (pp.317–318). ~3065p / 3068 for both tech bases (IO:AE p.34) |
| M-Pod | mech-is-equipment-weapons-misc | added | TO:AUE p.143 | none | IS only; 1 ton, 1 slot; 6,000 C-bills (p.221); BV 5, defensive, explosive (p.195); cluster columns 15 / 10 / 5 at 1 / 2 / 3 hexes, -1 to hit. ~3060p / 3064 (IO:AE p.34). Catalogued as equipment, like the A-Pod; firing it in play mode is not modelled |
| Chaff Pod | mech-is-equipment-weapons-misc | added | TO:AUE p.111 | none | IS only; Experimental; 1 ton, 1 slot; 2,000 C-bills (p.219); BV 19, defensive, explosive (p.195). 3069p / 3079 (IO:AE p.39) |

All three carry `alphaStrike.notes: ["Unresolved: …"]`: no Alpha Strike conversion was looked up, and none is invented.

**Considered and not added:**

| item | why |
|---|---|
| Light Active Probe [IS], Light TAG [IS] | IO:AE pp.34–35 list Inner Sphere rows citing TM pp.204 and 238, but the TM 6th-printing Inner Sphere equipment table (p.342) has no 'Mech-scale line for either: only the Clan table (p.343) and the battle armor tables do. No weight or slot source, so not added. For the user |
| Coolant Pod | TO:AUE p.116. Its BV works by raising heat sink capacity (p.193), which the BV code does not do; a plain record would compute a wrong BV. Roadmap |
| MRM Apollo FCS | TO:AUE p.143. The catalog models fire-control systems as combined launcher records (as with Artemis IV), so this means MRM + Apollo records with their own BV; weapons follow-up |
| C3 Remote Sensor Launcher, Collapsible Command Module, Full-Head Ejection System | TO:AUE pp.111, 113, 122. Stats are in hand (cost table p.219); each needs rules support (ammo, crew, ejection) before it is more than a label. Roadmap |
| HarJel II / III, RISC Heat Sink Override Kit, Viral Jammers, Laser Pulse Module | IO:AE pp.82–88. Per-location or per-weapon items; need construction support |

A regression test (`Batch 9c pods added from TechManual and TO:AUE`) pins the three records and mounts the B-Pod on both tech bases.

## Batch 12a: ammunition catalogs, placeholder dates and book abbreviations

Mechanical pass over `mech-is-ammo.ts` (158 records), `mech-clan-ammo.ts` (105) and `mech-universal-ammo.ts` (71). No introduction year, extinction year or page number was changed.

| change | scope | notes |
|---|---|---|
| `extinct: 0` / `reintroduced: 0` → `null` | 549 fields in the three ammo catalogs | 0 meant "never"; the canon catalogs now hold no `0` date anywhere |
| `book: "TO:AU&E"` → `"TO:AUE"` | 31 ammo records | one spelling per book |
| `book: "IO_AE"` / `"IO-AE"` → `"IO:AE"` | 9 ammo records, 2 myomer records | one spelling per book |

Two new tests in `equipment-registry.test.ts` pin both rules. One older assertion that expected `extinct` 0 on Inner Sphere AC/20 ammo now expects `null`.

**Still owed for ammunition (Batch 12b):** the introduction, extinction and recovery years have not been compared with the IO:AE pp.53–56 ammunition rows, and about 90 records still cite the original Tactical Operations ("TO 141", "TO 184", "TO 352" …) or Total Warfare pages that predate the TO:AUE split. Known mismatches seen while listing them: `long-tom-cannon-fae` and its Sniper / Thumper siblings have `page: 0`; several standard rounds carry the weapon's prototype-era year (Clan Rotary AC ammo 3073, ProtoMech AC ammo 3070, Chemical Laser ammo 3059) now that their weapons have moved to the production year in Batch 10.

## Batch 12b: standard ammunition follows its launcher

Rule applied to all 106 standard rounds (48 Inner Sphere, 45 Clan, 13 universal): a standard round takes the prototype, production, extinction and recovery years and the rules page of the earliest launcher in its catalog that fires it. Where several launchers share a round and any of them never went extinct, the round never went extinct. The IO:AE pp.53–56 ammunition rows override that where they print something different.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Enhanced LRM ammo | mech-is-ammo | fixed | TO:AUE p.139 | none | 3058 was the launcher's prototype year; now 3058p / 3082. Was "TO 0" |
| Extended LRM ammo | mech-is-ammo | fixed | TO:AUE p.139 | none | now 3054p / 3078 |
| Improved Heavy Gauss ammo | mech-is-ammo | fixed | TO:AUE p.126 | none | now 3065p / 3081. Was "TO 313" |
| Silver Bullet Gauss ammo | mech-is-ammo | fixed | TO:AUE p.127 | none | 3081 → 3051p / 3080. Was "TO 314" |
| Rifle (Cannon) shells | mech-is-ammo | fixed | TO:AUE p.150 | none | extinct ~2900, recovered ~3084 (IO:AE p.53; the rifles themselves: ~2825) |
| Streak LRM ammo | mech-clan-ammo | fixed | TO:AUE p.139 | none | now 3057p / ~3079 |
| Clan Rotary AC ammo | mech-clan-ammo | fixed | TO:AUE p.98 | none | now 3073p / 3104 |
| ProtoMech AC ammo | mech-clan-ammo | fixed | TO:AUE p.98 | none | now ~3070p / 3073 |
| Chemical Laser ammo | mech-clan-ammo | fixed (flag) | TO:AUE p.132 | none | now 3059p / 3085. Flag: IO:AE p.54 prints 3085 for the ammunition and p.37 prints 3083 for the lasers |
| Narc beacon ammo [Clan] | mech-clan-ammo | fixed | TM p.233 | none | 2818 → ~2820p / 2828 (IO:AE p.56 "Clan Intro: 2828"). Was "TW 141" |
| Arrow IV ammo [Clan] | mech-clan-ammo | fixed | TO:AUE p.96 | none | 2600 (with a 2593 prototype) was the Star League launcher; the Clan launcher is 2844, no prototype |
| Artillery cannon shells | mech-universal-ammo | fixed | TO:AUE p.97 | none | prototype 3032 → 3012, as the cannons. Were "TO 404" |
| Mortar ammo [IS] / [Clan] | both | verified | TO:AUE p.136 | none | IS ~2526p / 2531, extinct 2819, recovered 3043; Clan ~2835p / 2840. The ammo is already split by tech base; the mortars themselves are still one universal record (Batch 9b flag) |
| the other standard rounds | all three | fixed (pages) | launcher page | none | about 60 page references moved from Total Warfare, original Tactical Operations or older TechManual pages to the launcher's rules page |

A regression test (`Batch 12b standard ammunition follows its launcher`) pins all 106 records.

**Still owed (Batch 12c):** the 228 special munitions. Their dates and pages have not been compared with the IO:AE pp.53–56 rows. Seen while listing them: Arrow IV Inferno-IV is dated 3083 against 3053p / 3055 in IO:AE p.53; Arrow IV Smoke has extinction 2830 against 2840; several munitions that IO:AE lists as Inner Sphere only (ADA, Inferno-IV, Laser-Inhibiting Arrow) sit in the universal ammo catalog.

## Batch 13: records without a canon source move to custom

User decision (2026-10-01): "Unsourced Clan... Move to custom if no canon source found... We will do a search on everything in that later to cite as best we can."

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Enhanced ER Large Laser (`enhanced_er_large_laser`) | mech-clan-equipment-weapons-energy → mech-custom-equipment-weapons-energy | moved to custom | none found | none | The record cited "IO p.189". Neither Interstellar Operations (2016) nor IO: Alternate Eras lists it; IO:AE pp.89–90 has an Improved Large Laser and an Enhanced PPC, which are separate records. Tag and statistics unchanged; `catalog: "custom"`, `book: "Custom"`, `page: null`, `rulesLevel: 5` |
| Enhanced Clan LRM 10 (`enhanced_clan_lrm_10`) | mech-clan-equipment-weapons-missile → mech-custom-equipment-weapons-missile | moved to custom | none found | none | Same citation, same result. IO:AE p.90 has Improved LRMs (5/10/15/20), which are separate records. Tag and statistics unchanged |

Both tags are unchanged, so saved designs that mount them still load. A regression test (`Batch 13 records without a canon source`) pins the move.

**Owed:** a source search for everything in the custom catalogs, to cite what can be cited (user, same message).

## Batch 14: errata search, prototype weapon statistics, Superheavy gyro

### Errata search (user: "Conflicts in IOAE... Look for an errata to see if the clears that")

The current official errata sheets were fetched from the battletech.com files (the live links return HTTP 500; the Internet Archive capture of 27 July 2025 was used) into `_KNOWLEDGE_DEV/rulebooks/errata-2025/` (git-ignored), with text extracts:

| book | errata | date |
|---|---|---|
| Interstellar Operations (2016) | v1.21 | 8 June 2021 |
| IO: Alternate Eras | v3.01 | 17 January 2023 |
| IO: BattleForce | v3.0 | 17 January 2023 |
| TechManual | v8.0 | 22 August 2024 |
| TechManual Battle Value tables | v4.1 | n/a |
| TechManual infantry tables | v4.1 | n/a |
| Tactical Operations: Advanced Units & Equipment | v7.0 | 23 September 2023 |
| Tactical Operations: Advanced Rules | v7.0 | 23 September 2023 |
| Total Warfare | v11.01 | 17 September 2023 |
| Strategic Operations: Advanced Aerospace Rules | v5.0 | 15 November 2024 |
| Campaign Operations | v5.0 | 22 August 2024 |
| BattleMech Manual | v7.01 | 17 September 2023 |

These are newer than the 2019 sheets the library held. The local IO:AE PDF is the third corrected printing (January 2023), so the v3.01 corrections are already in its text.

**Result for the six same-book conflicts: neither IO v1.21 nor IO:AE v3.01 rules on any of them.** They stay as recorded (catalog follows MegaMek, flagged for the user): armor BV modifiers p.185 vs p.190; primitive cockpit cost p.117 vs p.215; Heat-Dissipating Clan year p.81 vs pp.29 and 215; Improved Large Laser / Large Pulse Laser years p.89 vs p.37; Clan claws 3090; prototype dates table p.112 vs the advancement table.

What the two sheets do change, checked against the code:

| errata entry | status | notes |
|---|---|---|
| Superheavy gyro weight: "Engine Rating by 100 (rounding up) … multiplying the result by 2" (IO v1.21, p.162; IO:AE p.156 text) | **fixed (rules bug)** | `battlemech.ts` used rating / 50 rounded up. Differs whenever the rating is not a multiple of 100: rating 350 is 8 tons, not 7. MegaMek agrees with the errata. Flag: the IO:AE p.217 cost table still prints "ER÷50" |
| Superheavy BV: "treat a Superheavy 'Mech's gyro as a standard Gyro" (IO v1.21, p.193; IO:AE p.187) | **fixed (rules bug)** | a Superheavy with the Heavy Duty Gyro selected was given the 1.0 gyro BV modifier; now 0.5 |
| Prototype Ultra AC/5: 9 tons, 6 slots (IO v1.21, p.219) | fixed | catalog had 5 slots (below) |
| Prototype pulse lasers work with a targeting computer (IO v1.21, p.216) | verified | already `tc: true` |
| Medium Re-Engineered Laser aero heat 6 (IO v1.21, p.220) | verified | |
| LAMs need both lower arm actuators (IO:AE v3.01, p.108) | verified | already enforced |
| Dead-Fire ammunition BV (IO:AE v3.01, p.190): LRM-5 9, LRM-10 17, LRM-15 26, LRM-20 35, SRM-2 4, SRM-4 7, SRM-6 10 | owed (Batch 12c) | to check with the other special munitions |
| Narc beacon recovery 3035 (FW), Apollo common 3097, Tandem-Charge 3062 (IO v1.21, pp.41, 46, 61) | owed (Batch 12c / misc) | the IO:AE table already carries these; listed so they are compared |
| Prototype Improved Jump Jets entry (IO v1.21, p.103) | gap | already listed as missing equipment |

### Prototype weapon statistics

Earlier batches checked dates and pages for these records. This batch checks tonnage, slots, cost, heat, range, shots per ton, BV and ammunition BV against the IO:AE tables: game data pp.210, 212; construction data pp.211, 213; Battle Value p.189. The rule on p.112 is that primitive prototypes keep "weight, cost, and critical space… identical to their standard versions"; several records did not.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Primitive Prototype AC/2 | mech-is-equipment-weapons-ballistic | fixed | IO:AE pp.112, 189, 210–211 | none | was a copy of the AC/5: 8 t / 4 slots / 100,000 → 6 t / 1 slot / 75,000. Range 0/8/17/25 → 4/8/16/24. BV 40 → 37. Had no ammunition: now fires AC/2 rounds, 34 shots per ton, ammo BV 4. Tech rating E → C |
| Primitive Prototype AC/5 | same | fixed | same | none | cost 150,000 → 125,000; range 0/6/13/20 → 3/6/12/18; BV 75 → 70; 15 shots, ammo BV 7 |
| Primitive Prototype AC/10 | same | fixed | same | none | cost 250,000 → 200,000; BV 140 → 123; 8 shots, ammo BV 12 |
| Primitive Prototype AC/20 | same | fixed | same | none | slots 8 → 10; cost 400,000 → 300,000; range 3/7/10 → 3/6/9; BV 240 → 178; 4 shots, ammo BV 17 |
| Primitive Prototype Small Laser | mech-is-equipment-weapons-energy | fixed | same | none | cost 10,000 → 11,250; range 2/4/6 → 1/2/3; BV 18 → 9 |
| Primitive Prototype Medium Laser | same | fixed | same | none | cost 20,000 → 40,000 |
| Primitive Prototype Large Laser | same | fixed | same | none | range 3/6/9 → 5/10/15 |
| Primitive Prototype PPC | same | fixed | same | none | cost 140,000 → 200,000; range 0/3/6/9 → 3/6/12/18 (minimum 3); tech rating D |
| Primitive Prototype LRM 15 / 20 | mech-is-equipment-weapons-missiles | fixed (flag) | same | none | BV 136 / 181 → 132 / 168; ammo BV 17 / 23 → 13 / 16; shots 8 / 6 → 6 / 5 |
| Primitive Prototype SRM 2 / 4 | same | fixed (flag) | same | none | BV 21 / 39 → 10 / 21; ammo BV 3 / 5 → 1 / 3; shots 50 / 25 → 38 / 19 |
| Primitive Prototype LRM 5, LRM 10, SRM 6 | same | **added** | same | none | LRM 5: 2 t, 1 slot, 30,000, BV 38, 18 shots, ammo BV 4. LRM 10: 5 t, 2 slots, 100,000, BV 78, 9 shots, ammo BV 8. SRM 6: 3 t, 2 slots, 80,000, BV 41, 11 shots, ammo BV 4. Dates from the p.112 table (2295 / 2365, superseded 2300 / 2370). Alpha Strike values are the standard launcher's, marked provisional |
| Prototype LB 10-X Autocannon | mech-is-equipment-weapons-ballistic | fixed | IO:AE pp.66, 189, 211 | none | slots 6 → 7 ("occupying 1 additional critical slot", p.66); cost 400,000 → 1,600,000; ammo BV 19 → 15. The recovered prototype of 3030 costs 2,000,000 (p.213): one record covers both, the note says so |
| Prototype Gauss Rifle | same | fixed | IO:AE pp.66, 211 | none | cost 300,000 → 1,200,000 |
| Prototype Ultra Autocannon/5 | same | fixed | IO:AE pp.98, 213 | IO v1.21 p.219 | slots 5 → 6; cost 200,000 → 1,000,000 |
| Improved SRM 2 / 4 / 6 [Clan] | mech-clan-equipment-weapons-missile | fixed (flag) | IO:AE pp.90, 189, 213 | none | cost 10,000 / 60,000 / 80,000 → 15,000 / 90,000 / 120,000; Improved SRM 4 BV 39 → 52 |
| Prototype Streak SRM 4 / 6 [Clan] | same | fixed | IO:AE pp.91, 189, 213 | none | SRM 4 cost 60,000 → 90,000; ammo BV 10 / 15 → 7 / 11 |
| Prototype LB 2-X / 5-X, Prototype Ultra AC/2 / AC/20 [Clan] | mech-clan-equipment-weapons-ballistic | fixed | IO:AE p.189 | none | ammo BV 6 / 12 / 8 / 42 → 5 / 10 / 7 / 35 |
| Enhanced PPC [Clan] | mech-clan-equipment-weapons-energy | fixed (name) | IO:AE p.90 | none | the book calls it Enhanced PPC; the record was named "Enhanced ER PPC" (kept as an alternate name; tag unchanged) |
| Nova CEWS | mech-clan-equipment-weapons-misc | fixed | IO:AE p.213 | none | cost 1,100,000 → 1,110,000 |
| ER PPC (Clan, Star League) | mech-clan-equipment-weapons-energy | note added | TM p.234; IO:AE p.40 | none | user decision: stays never-extinct in Clan space; the note records that the original tool listed 2860 because the Clan ER PPC had replaced it |

**Flags (same-book conflicts, catalog follows MegaMek):**

- Primitive prototype missile shots per ton. The p.112 rule is three-quarters of the standard load, rounding up; the p.210 table prints LRM 20: 4, SRM 2: 37, SRM 4: 18, SRM 6: 11, which rounds down. MegaMek uses 5, 38, 19 and 11, and so does the catalog.
- Primitive prototype SRM range. The p.210 table prints 0/4/8/12 for all three (the Improved SRM brackets from the rows below); the p.112 rule says all other data match the standard launcher. The catalog keeps 3/6/9, as MegaMek does.

**Where the catalog now differs from MegaMek because the book is explicit:** primitive prototype missile BV and ammo BV (MegaMek keeps the standard launcher's values), Improved SRM cost and the Improved SRM 4 BV (MegaMek: 10,000 / 60,000 / 80,000 and 39), Prototype Streak SRM 4 cost (MegaMek 60,000).

**Gaps seen:** Primitive Prototype Long Tom (BV 368, ammo BV 35, p.189) and the primitive prototype torpedo launchers have no records. Aerospace damage values on missile launchers hold 3 for every LRM size in the catalog (the book gives 3 / 6 / 9 / 12); that is a catalog-wide convention to review, not changed here.

Regression tests: `Batch 14 prototype weapon statistics`, `Batch 14 Star League ER PPC in Clan space`, and two Superheavy gyro tests in `BattleMech engine construction`.

## Batch 15: tech-base splits

User decision (2026-10-01): "Tech base splits, anytime you need to split or consolidate due to canon, do so." Classifications below are recorded as done under that standing permission.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| 'Mech Mortar 1 / 2 / 4 / 8 [IS] (`mech-mortar-N`) | mech-universal-equipment → mech-is-equipment-weapons-missiles | split | TO:AUE pp.136, 194, 221; IO:AE p.40 | TO:AUE v7.0: not yet compared | 2 / 5 / 7 / 10 tons, 1 / 2 / 3 / 5 slots. ~2526p / 2531, extinct 2819, recovered 3043. Ammo BV 1.2 / 2.4 / 3.6 / 7.2 → 1 / 2 / 3 / 6 (TO:AUE p.194). Tech rating E → B |
| 'Mech Mortar 1 / 2 / 4 / 8 [Clan] (`clan-mech-mortar-N`) | → mech-clan-equipment-weapons-missile | split (**stats were wrong for Clan designs**) | same | same | 1 / 2.5 / 3.5 / 5 tons, 1 / 1 / 2 / 3 slots (TO:AUE p.221): half the Inner Sphere weight. ~2835p / 2840, never extinct. The universal record gave Clan designs the Inner Sphere weight and slots |
| Long Tom / Sniper / Thumper Cannon [IS] | mech-universal-equipment → mech-is-equipment-weapons-artillery | split | TO:AUE p.97; IO:AE p.31 | same | 3012p / 3079, unchanged |
| Long Tom / Sniper / Thumper Cannon [Clan] (`clan-…-cannon`) | → mech-clan-equipment-weapons-artillery | split | same | same | Clan prototype 3032, production 3079; statistics identical. The universal record let Clan designs take the 3012 Lyran prototype |
| Laser Insulator [IS] | mech-universal-equipment → mech-is-equipment-weapons-misc | split | TO:AUE p.134; IO:AE p.38 | same | prototype 2575, no production; extinct 2820 |
| Laser Insulator [Clan] (`clan-laser-insulator`) | → mech-clan-equipment-weapons-misc | split | same | same | never extinct: IO:AE marks the 2820 extinction "*" (Inner Sphere only, p.57 key) |
| Modular Armor [Clan] (`clan-modular-armor`) | mech-clan-equipment-weapons-misc | **added** | TO:AUE p.93; IO:AE p.29 | same | Clan prototype 3074, production ~3096; statistics as the Inner Sphere record, which is unchanged |

**This reverses the 2026-09-28 decision to keep one universal 'Mech Mortar.** That decision rested on the two sides sharing the technology; TO:AUE p.221 prints different weights and slots for each, so one record cannot be right for both, and the universal rule (identical name, weight, slots, damage, ranges and dates) does not hold.

**Saved designs.** Each Clan record keeps the old universal tag in `altTags`, so a Clan design saved before the split loads the Clan record; an exact tag still beats an alias, so Inner Sphere and mixed-tech designs keep the Inner Sphere record. A saved Clan design with a 'Mech Mortar gets lighter on reload, which is the correction. Tests cover BattleMechs and vehicles.

**Three bugs found and fixed while testing that:**

- `battlemech.ts` `_restoreEquipmentItem` never looked in the custom catalog, so a saved design lost any Custom Homebrew equipment when reloaded (this would have included the two records moved to custom in Batch 13). Loading now includes the custom catalog; the lists a design *chooses* from are unchanged.
- `vehicle.ts` `addEquipmentFromTag` matched exact tags only and ignored `altTags`; it now falls back to an alias.
- `battlemech.ts` `moveCritical` enforced "one Modular Armor pack per location" by the literal tag `modular-armor`; it now uses the `isModularArmor` flag, so the Clan record obeys the same rule.

**Not split (checked):** the artillery cannon shells and standard mortar rounds are already per-side or universal as IO:AE lists them. ADA, Inferno-IV and Laser-Inhibiting Arrow rounds (Inner Sphere only, in the universal ammo catalog) are left for Batch 12c with the other special munitions.

Regression tests: `Batch 15 tech-base splits`, `Batch 15 saved designs keep custom-catalog equipment`, `Vehicle equipment saved before the Batch 15 tech-base splits`, and the rewritten mortar test in `equipment-registry.test.ts`.

## Batch 16: large engines

User (2026-10-01): "Large engines should be in the engine file, there are two... one for ratings one for types."

Before this batch a large engine was only "any type at a rating above 400": the code doubled the cost and added two center torso slots, and the base type's dates applied. The large engines are now records of their own in `mech-engine-types.ts` (`mechLargeEngineTypes`), and the ratings file (`mech-engine-options.ts`) holds only the columns that exist above 400.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Large Fusion (LSF) | mech-engine-types (`large-standard`) | **added** | TO:AUE p.119; IO:AE p.38 | TO:AUE v7.0: not yet compared | 2630p / ~3085. 8 center torso slots; cost multiplier 10,000 (TO:AUE p.219) |
| Large ICE (LIC) | `large-ice` | **added** | same | same | 2630p / ~3085. 8 CT; 2,500 |
| Large Light (LLF) | `large-light` | **added** | same | same | Inner Sphere. ~3064p / 3065. 8 CT + 2 per side; 30,000 |
| Large XL (LXL) [IS] | `large-xl` | **added** | same | same | ~2635p, lost 2822, prototyped again 3054, production ~3085. 8 CT + 3 per side; 40,000 |
| Large XL (LXL) [Clan] | `large-clan_xl` | **added** | same | same | ~2850p / ~3080. 8 CT + 2 per side; 40,000 |
| Large XXL (LXXL) [IS] | `large-xxl` | **added** | same | same | 3058p / 3130. 8 CT + 6 per side; 200,000 |
| Large XXL (LXXL) [Clan] | `large-clan_xxl` | **added** | same | same | 3055p / 3125. 8 CT + 4 per side; 200,000 |
| Ratings 405–500, ICE / standard / Light / XL / XXL weights | mech-engine-options | verified | TO:AUE p.120 | same | all 20 rows match the Large Engine Weight Table |
| Ratings 405–500, Fuel Cell and Fission weights | mech-engine-options | **removed** | TO:AUE p.120 | same | "but not as fuel cell, fission or compact fusion": the file carried computed weights for both |
| Primitive weights where the adjusted rating passes 400 (nominal 335–415) | mech-engine-options | **removed** | IO:AE p.117 | none | the adjusted rating is taken "from the Master Engine Table (see p. 49, TM)", which ends at 400; MegaMek also refuses large primitive engines |
| XXL Fusion [IS] and [Clan] | mech-engine-types | fixed (page) | TO:AUE p.121 | same | cited p.120 (the construction table); the rules box is on p.121 |

Behaviour that follows from the records:

- A 'Mech engine above rating 400 is offered by the large engine's dates, not the base type's. A Large Fusion engine is a prototype (Experimental level) until ~3085; before this batch any era with a Standard Fusion engine allowed it at the Experimental level.
- Cost, slots and the engine's name ("Large XL Fusion") come from the record. The results are the same as the old doubling and "+2" for every type that has a large form.
- Compact, Fuel Cell, Fission and Primitive engines are not offered above 400 ('Mechs), and vehicles with those engines stop at rating 400 even at the Experimental level.
- Vehicle cost: a large engine was priced at the base multiplier. It now uses the large record (twice the base).
- `_datesAvailability`: a record whose extinction is earlier than its production year (the Inner Sphere Large XL) is read as "prototype lost, then recovered"; production starts at `introduced`. No equipment record has that shape, so nothing else changes.

BV: TO:AUE p.193 gives large engines the same engine modifier as their base type (Large Light 0.75, Large XL IS 0.5, Clan 0.75, Large XXL IS 0.25, Clan 0.5), which is what the code does. Verified.

**Flags:**

- TO:AUE p.219 (cost table) prints different dates for the large engines (for example Large XL Inner Sphere "3045P / 2635X", Large XXL Clan "2970P"). IO:AE (2022) is the newer publication and is followed.
- Vehicles have no era check on engine types at all, so the large engine dates are enforced for 'Mechs only.

Regression tests: `Batch 16 large engines` (8 tests), `Vehicle large engines` (2 tests).

## Batch 17: TO:AUE errata v7.0 and explosive weapons in Battle Value

TO:AUE errata v7.0 (23 September 2023) was read in full. The local TO:AUE PDF is the corrected sixth printing (2022); the seventh-printing entries are the ones it lacks. The errata sheet marks which printing fixed each entry with a symbol the text extract drops, so every construction entry was checked against the local page text and the catalog.

| errata entry (TO:AUE v7.0) | status | notes |
|---|---|---|
| Modular Armor: one per *location*, not per slot (p.92) | verified | already enforced (Batch 15 moved the check from the tag to the `isModularArmor` flag) |
| HVAC footnote Q: "Treat weapon as a Gauss weapon with one critical slot for defensive BV purposes" (p.195) | **fixed** | HVAC/2, /5, /10 were not explosive at all. Now `explosive: true`, `explosiveBattleValueSlots: 1` |
| PPC + PPC Capacitor: "Treat as Gauss weapon…", "Explodes" (p.194) | **fixed** | below |
| Chaff Pod, M-Pod: explosive, defensive BV (p.195) | verified | set in Batch 9c |
| Improved Heavy Lasers: explosive (p.196) | verified | already `explosive: true` |
| Claws to-hit +1 (p.216); Flail +0, Lance +1 (pp.101–102) | not modelled | melee weapons carry no to-hit modifier in the catalog (Hatchet and Sword have none either). Owed with the other physical-weapon data |
| Supercharger: one per unit (p.156) | not enforced | owed (construction validation) |
| Armored Motive System weight rounding (p.94) | not modelled | the vehicle builder has no Armored Motive System |
| Thunderbolt launchers may be OS or I-OS (p.158) | verified | the one-shot records exist (see Batch 19) |
| Game-play entries (Reflective armor, Vibroblade, Partial Wing, artillery scatter, smoke, field guns, VSP aerospace ranges, Rifle damage) | n/a | no construction data |

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| PPC w/ Capacitor | mech-is-equipment-weapons-energy | fixed | TO:AUE pp.149, 194 | v7.0 footnotes | BV 176 → 264 |
| Heavy PPC w/ Capacitor | same | fixed | same | same | BV 317 → 370 |
| Light PPC w/ Capacitor | same | fixed | same | same | BV 88 → 132 |
| Snub-Nose PPC w/ Capacitor | same | fixed | same | same | BV 229 → 252 |
| ER PPC w/ Capacitor | same | fixed | same | same | BV 229 → 343 |

All five carried the plain PPC's Battle Value (the Snub-Nose one carried the ER PPC's) and were not explosive. Weight, slots and cost were already the PPC plus 1 ton, 1 slot and 150,000 (TO:AUE p.221).

**Two rules bugs in `battlemech.ts`, found while testing the above:**

- **Explosive components lost 1 BV per item, not per slot.** TechManual BV rules: "1 point per Gauss weapon critical space". Only the first slot of an item carries the item, and the loop counted slots that carried one. A Gauss Rifle outside CASE now costs 7 points of defensive rating, not 1; the same applies to every Gauss weapon, Improved Heavy Laser and PPC with Capacitor. An HVAC stays at 1 by its footnote.
- **Battle Value went stale after a critical slot move.** `moveCritical` did not recalculate, so placing ammunition or a Gauss Rifle, or moving it in or out of a CASE location, showed the old value until some other change or a reload. The value is now refreshed when next read. (It is not recalculated inside the move: the BV calculation sorts the equipment list in place, which breaks imports that place many items in a row. That in-place sort is worth removing; noted, not changed.)

Both change the Battle Value of existing designs that mount Gauss weapons outside CASE. The MUL comparison tests, if any design there has one, were unaffected (suite green).

Regression tests: `Batch 17 explosive weapons in Battle Value`, `Batch 17 Battle Value follows critical slot moves`.

**Still owed from the newer errata:** TechManual v8.0 (42 pages, corrections for the 2023 and 2024 printings that the local sixth printing lacks), the TechManual BV tables v4.1, Total Warfare v11.01, and TO:AR v7.0 have not been compared yet.

## Batch 18: TechManual table audit (statistics, not dates)

Batches 9–12 checked dates and pages for the TechManual equipment. This batch compares the game statistics with the TechManual tables in the local corrected sixth printing: Battle Value tables pp.317–318, Weapons and Equipment tables pp.341–344, cost tables pp.290–294.

| check | rows matched | result |
|---|---|---|
| Battle Value and ammunition BV (pp.317–318) | 124 | all match, except the Nail/Rivet Gun below |
| Heat, range, shots per ton, tonnage, 'Mech slots (pp.341–343) | 96 | all match |
| Tech rating (pp.341–343) | 96 | 32 differ, fixed below |
| C-bill cost (pp.290–294) | 94 | 4 differ, plus the Nail/Rivet Gun found by hand; fixed below |

Rows the name matcher could not pair (ProtoMech and battle armor weapons, capital missiles, bays, industrial items priced per ton) were not checked; HAG, AP Gauss, MagShot, A-Pod, B-Pod, Flamer and Improved Narc were checked by hand and match.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Nail/Rivet Gun | mech-universal-equipment | fixed | TM pp.246, 293, 317, 344 | TM v8.0: no change to these values | cost 10,000 → 7,000; BV 5 → 1; ammo BV 1 → 0; range 3/6/9 → 1 hex only. The old values were the Vehicle Flamer's. The table prints no medium or long bracket; the record stores 0 for both |
| Nail/Rivet Gun ammunition | mech-universal-ammo | fixed | TM p.317 | same | BV 1 → 0 |
| Mining Drill | mech-universal-equipment | fixed | TM p.293 | same | cost 10,000 → 100,000 |
| Remote Sensor Dispenser | mech-universal-equipment | fixed | TM p.293 | same | cost 51,000 → 30,000 |
| Wrecking Ball | mech-universal-equipment | fixed | TM p.294 | same | cost 110,000 → 80,000 |
| AP Gauss Rifle | mech-clan-equipment-weapons-ballistic | fixed (flag) | TM p.290 | same | cost 8,500 → 10,000. MegaMek uses 8,500; the TechManual row is explicit |
| Tech ratings, 16 Inner Sphere records | IS ballistic, energy, missiles | fixed | TM pp.341–342 | same | Light AC/2 and /5 E → D; Rotary AC/2 and /5 (none) → E; Flamer B → C; ER Large Laser C → E; MRM 10–40 E → C; Rocket Launcher 10–20 E → B; Streak SRM 2–6 C → E |
| Tech ratings, 16 Clan records | Clan ballistic, energy, missile | fixed | TM p.343 | same | LB-X and Ultra autocannons, LRM 5–20, ER Small Laser, Heavy Small Laser, Plasma Cannon E → F; Light Machine Gun B → F |

Regression test: `Batch 18 TechManual table audit`.

**Still owed:** the same statistics check for the TO:AUE tables (pp.216–226) and for the special munitions (Batch 12c); TechManual errata v8.0 entries for the 2023 and 2024 printings, which the local printing lacks, have only been searched for the items changed here.

## Batch 19: TO:AUE table audit (statistics)

The same check as Batch 18, against the TO:AUE tables in the local corrected sixth printing: game data pp.216, 218, 220, 222; construction data pp.217, 219, 221, 223; Battle Value pp.194–197. 125 rows paired by name and matched; 31 more construction rows were paired by hand and matched; the BV rows the matcher missed (Blazer, VSP lasers, Silver Bullet Gauss, ELRM, Arrow IV, artillery cannons, MagShot, Heavy Rifle) were checked by hand and match.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Thunderbolt 5 / 10 / 15 / 20, with their OS and I-OS forms (12 records) | mech-is-equipment-weapons-missiles | fixed | TO:AUE pp.159, 222–223 | v7.0: construction entry replaced ("can also be installed as OS or I-OS launchers"), values unchanged | 'Mech slots 2 / 3 / 5 / 7 → 1 / 2 / 3 / 5; minimum range 0 → 5. Vehicle slots were set to the 'Mech count; now 1 |
| ProtoMech AC/2 / AC/4 / AC/8 | mech-clan-equipment-weapons-ballistic | fixed | TO:AUE pp.98, 217 | none | marked as ProtoMech-only (`battlemech: -1`). The rules box reads "Available To: BM, IM, PM, CV, SV, AF, CF, SC…"; 'Mech slots 2 / 3 / 4, one vehicle slot. ProtoMech slots unchanged |
| Watchdog CEWS | mech-clan-equipment-weapons-misc | fixed | TO:AUE p.217 | none | cost 500,000 → 600,000 |
| Rotary AC/2, AC/5 [Clan]; Streak LRM 5–20 | Clan ballistic, missile | fixed | TO:AUE pp.217, 221 | none | tech rating E → F |

An older test used the ProtoMech AC/2 as its example of equipment a 'Mech cannot mount; it now uses the ProtoMech Myomer Booster and asserts the autocannon is offered.

**Correction to Batch 17:** one-shot and improved one-shot Thunderbolt records do exist (`thunderbolt-N-os`, `thunderbolt-N-ios`); the "gap" noted there was wrong.

**Not found in the catalog** (TO:AUE construction rows with no record): Vehicular Grenade Launcher, Recon Camera, BattleMech Taser, Coolant Pod, C3 Remote Sensor Launcher, Collapsible Command Module. All but the first two were already listed as missing.

Regression test: `Batch 19 TO:AUE table audit`.

## Batch 12c: special munitions

All 228 special munition records (110 Inner Sphere, 60 Clan, 58 universal) were dated and cited from the IO:AE ammunition rows (pp.53–56). Where IO:AE has no row, the TO:AUE or IO:AE rules header is used: Thunder (FASCAM) artillery and Arrow IV (TO:AUE p.169), Follow-the-Leader (TO:AUE p.180), Davy Crockett-M (IO:AE p.168), Fuel-Air (IO:AE p.159).

Rules applied:

- A munition cannot be older than the launcher that fires it: each record takes the later of the munition's and the launcher's prototype and production years.
- An extinction that IO:AE marks "*" applies to the Inner Sphere only; Clan records never go extinct. The Star League Arrow IV extinction does not apply to the Clan launcher of 2844.
- A launcher that appears after the munition was recovered never saw the extinction (Enhanced LRM rounds).
- Pre-Spaceflight is stored as 1950 and Early Spaceflight as 2100, as elsewhere.
- Page = the page of the munition's rules box in TO:AUE, which is the page IO:AE gives except for Inferno fuel (174), Water (175), Incendiary LRMs (182), Thunder LRMs (185) and Anti-Personnel mortar rounds (186), where the heading is on the page before.

390 fields changed in 175 records. About 100 records only had their citation moved off the original Tactical Operations ("TO 352", "TO 184"…) or Total Warfare pages; no ammunition record cites the original Tactical Operations any more. Date changes:

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Caseless AC rounds | mech-is-ammo | fixed | TO:AUE p.164 | none | 3056 was the prototype year; production 3079 |
| Arrow IV Smoke | mech-is-ammo | fixed | TO:AUE p.168 | none | extinct 2830 → 2840 |
| Arrow IV Inferno-IV | mech-universal-ammo | fixed | TO:AUE p.168 | none | 3083 → 3053p / 3055 |
| Thunder (FASCAM) Arrow IV and artillery shells | mech-is-ammo | fixed | TO:AUE p.169 | none | extinct 2770 → 2833 (header: "Extinct: 2833 (Inner Sphere)", recovered 3051) |
| Follow-the-Leader LRMs | mech-is-ammo, mech-clan-ammo | fixed | TO:AUE p.180 | none | 2750 / extinct 2770 / 3046 had no source. Header: "Prototype Design and Production: 3053 (Federated Commonwealth)"; no production. Now a 3053 prototype |
| Tandem-Charge SRMs | mech-is-ammo, mech-clan-ammo | fixed | TO:AUE p.184 | IO v1.21 (production 3062, FS) | 2757 / extinct 2784 / 3062 → 2757p / 3062 |
| Anti-Radiation missiles | all three | fixed | TO:AUE p.180 | none | prototype only: Inner Sphere 3066p, Clan 3057p; no production year |
| Dead-Fire, Listen-Kill, Acid | mech-universal-ammo, mech-is-ammo | fixed | IO:AE pp.125, 99; TO:AUE p.179 | IO:AE v3.01 (Dead-Fire BV: owed) | prototype only (3052p, 3037p extinct 3040, 3053p) |
| Laser-Guided Bomb | mech-is-ammo | fixed | TW p.247 | none | extinct 2835 → 2800, recovered 3035 → 3060 |
| Anti-Ship Missile | both | fixed | TO:AUE p.170 | none | 3072 → ~3075 (Clan 3076) |
| Rocket Launcher Pod | mech-is-ammo | fixed | TM p.229 | none | prototype 3055 → ~3060 |
| iNarc pods, Explosive Narc pod | mech-is-ammo, mech-universal-ammo | fixed | TM p.233 | none | prototype ~3054 added; page as the launcher |
| ATM ER / HE | mech-clan-ammo | fixed | TM p.231 | none | prototype ~3052 added; HE production 3053 → 3054 |
| iATM Improved Inferno / Magnetic Pulse | mech-clan-ammo | fixed | IO:AE p.61 | none | prototype ~3070, no production; Magnetic Pulse extinct 3080 |
| Artemis IV rounds [Clan] | mech-clan-ammo | fixed | TM p.207 | none | 2598 → 2818 ("Clan Intro: 2818") |
| Artemis V rounds | mech-clan-ammo | fixed | TO:AUE p.95 | none | 3061 was the prototype year; production 3085 |
| Arrow IV Cluster, Homing, Illumination, Smoke, FAE [Clan] | mech-clan-ammo | fixed | TO:AUE pp.166–168 | none | 2600 → 2844, as the Clan launcher |
| 'Mech Mortar special rounds [Clan] | mech-clan-ammo | fixed | TO:AUE pp.185–187 | none | Star League years → ~2835p / 2840, as the Clan launcher |
| Enhanced LRM and Extended LRM special rounds | mech-is-ammo | fixed | launcher | none | 3058 / 3054 were the launcher's prototype years; production 3082 / 3078 |
| LRM Incendiary, LRM Smoke, Heat-Seeking, Tear Gas, Harpoon | mech-universal-ammo | fixed | TO:AUE pp.181–184 | none | 2400 → 2341p / 2342; 2370 → 2341p / 2342; 2365p / 2370 → ~2390p / 2430 (LRM); 2350 → ~2370p / 2375; 2440 → ~2395p / 2400 |
| Coolant, Flechette and Illumination shells | mech-universal-ammo | fixed | TO:AUE pp.167, 173 | none | Early Spaceflight, stored as 2100 (were 1950); Long Tom Illumination 2505 |
| Davy Crockett-M (Long Tom) | mech-is-ammo | fixed | IO:AE p.168 | none | introduced 2480; no extinction is printed (was 2830 / 3044, the Arrow IV launcher's) |
| Artillery cannon Fuel-Air shells | mech-universal-ammo | fixed | IO:AE p.159 | none | page 0 → 159; prototype 3032 → 3012, as the cannons |

**Flags:**

- IO:AE prints "Ret: 2840; 3052" for Thunder LRMs (p.55), read as extinct 2840, recovered 3052.
- IO:AE lists these as Inner Sphere only, but the records sit in the universal ammo catalog, so Clan designs are offered them: Air-Defense Arrow, Inferno-IV, Laser-Inhibiting Arrow, Thunder Vibrabomb-IV, Anti-TSM, Dead-Fire, Listen-Kill, Mine Clearance, Semi-Guided, Swarm-I, the four Thunder variants, Semi-Guided mortar rounds, Explosive Narc pods, Acid SRMs. The Clan catalog also holds Magnetic Pulse, Follow-the-Leader and Tandem-Charge rounds that IO:AE and TO:AUE give to the Inner Sphere. Moving them is Batch 12d; each needs its TO:AUE tech base read first.
- Rotary AC Caseless rounds exist in both catalogs; IO:AE lists Caseless for "AC, LAC, PAC" only. Left as they are, dated to the later of the two.

Regression test: `Batch 12c special munitions` pins all 228 records.

## Batch 12d: munition tech bases

IO:AE pp.53–56 gives a tech base for every munition, and the TO:AUE rules boxes agree. Twenty-one Inner Sphere munitions sat in the universal ammo catalog, so pure Clan designs were offered them; two more had Clan copies. Done under the standing permission to split or consolidate where canon requires.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Arrow IV: Air-Defense Arrow, Inferno-IV, Laser-Inhibiting, Thunder Vibrabomb-IV | mech-universal-ammo → mech-is-ammo | moved | TO:AUE pp.165, 168, 169; IO:AE p.53 | none | "Tech Base: Inner Sphere" |
| LRM / SRM Anti-TSM, Dead-Fire, Listen-Kill | same | moved | IO:AE pp.98, 125, 99, 55–56 | none | Inner Sphere |
| LRM / SRM Mine Clearance; LRM Semi-Guided, Swarm-I | same | moved | TO:AUE pp.182, 183; TM p.231; IO:AE pp.55–56 | none | Inner Sphere (Swarm is "Both", Swarm-I Inner Sphere) |
| LRM Thunder-Active, -Augmented, -Inferno, -Vibrabomb | same | moved | TO:AUE p.185; IO:AE p.55 | none | Inner Sphere (plain Thunder is "Both" and stays split by side) |
| Semi-Guided mortar rounds, Explosive Narc pods, Acid SRMs | same | moved | TO:AUE pp.186, 179; IO:AE pp.55–56 | none | Inner Sphere |
| LRM Magnetic Pulse [Clan copy] | mech-clan-ammo → folded into `ammo-is-lrm-magnetic-pulse` | consolidated | TO:AUE p.182; IO:AE p.56 | none | "Tech Base: Inner Sphere". The Inner Sphere record keeps the Clan tags as aliases |
| SRM Tandem-Charge [Clan copy] | mech-clan-ammo → folded into `ammo-is-srm-tandem-charge` | consolidated | TO:AUE p.184; IO:AE p.55 | none | same |

Kept where they were: Follow-the-Leader (TO:AUE p.180 "Both"), Anti-Radiation (Clan prototype 3057), the iATM's own Improved Magnetic Pulse round (Clan).

**Tags.** Inner Sphere ammunition tags start with `ammo-is-` (registry test), so each moved record takes the prefix (`ammo-lrm-swarm-i` → `ammo-is-lrm-swarm-i`) and keeps its old tag in `altTags`. Sixteen of them were marked ProtoMech-mountable because Clan ProtoMech launchers fed them from the universal catalog; that is now off.

**Saved designs.**

- Inner Sphere and mixed-tech designs resolve the old tags through the alias.
- A pure Clan design saved with one of these rounds still loads it: loading now falls back to the other tech base's catalog ('Mechs and vehicles), on the same principle as Batch 15 (the filters limit what can be added, not what can be loaded). The design is no longer *offered* the round.
- The Alpha Strike special ammunition choice was stored by tag and compared exactly; it is now resolved through aliases, so a saved choice of Swarm-I survives the new tag.

Regression tests: two in `equipment-registry.test.ts` (catalog membership per tech base, the folded Clan copies), `Batch 12d saved designs keep equipment from the other tech base`, `Vehicle saved with equipment from the other tech base`, and the Alpha Strike special ammunition tests.

## Batch 20: Dead-Fire ammunition Battle Value

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| LRM Dead-Fire rounds | mech-is-ammo | fixed | IO:AE p.190 | IO:AE v3.01 (p.190, in the third printing) | BV per ton by launcher: LRM 5 / 10 / 15 / 20 = 9 / 17 / 26 / 35; MML 3 / 5 / 7 / 9 = 6 / 8 / 11 / 15. The record had no value of its own, so a Dead-Fire ton was priced as standard ammunition (6 / 11 / 17 / 23) |
| SRM Dead-Fire rounds | mech-is-ammo | fixed | same | same | SRM 2 / 4 / 6 = 4 / 7 / 10; MML 3 / 5 / 7 / 9 = 6 / 9 / 12 / 17 |

The values are not a single multiplier of the standard round, so the ammunition record carries them per launcher (`battleValueByLauncher`), read before the multiplier in `getAmmoBattleValuePerTon`. Regression test in `equipment-registry.test.ts`.

## Batch 21: Superheavy 'Mech equipment limits

IO:AE p.156: superheavy musculature "is incompatible with all forms of MASC, Triple-Strength Myomers, and the Actuator Enhancement System"; superheavy 'Mechs "cannot make use of Superchargers", "may not" use Modular Armor, and "may not mount jump jets, improved jump jets, jump boosters, or partial wings", nor underwater maneuvering units. The builder enforced none of this.

| rule | status | notes |
|---|---|---|
| No MASC, Supercharger, AES (arm or leg), Modular Armor, Mechanical Jump Boosters, Partial Wing | **fixed** | not offered above 100 tons (`SUPERHEAVY_PROHIBITED_TAGS`); a design that already mounts one reports it in `getChassisEquipmentViolations()` |
| No Triple-Strength Myomer (standard, Industrial, prototype) | **fixed** | not offered; a design made superheavy reverts to standard musculature |
| No jump jets, improved jump jets or UMUs | **fixed** | no jump jet type is offered, maximum Jump MP is 0, and Jump MP is cleared when a design becomes superheavy |
| One Supercharger per unit (TO:AUE p.156, errata v7.0) | **fixed** | `maxPerUnit: 1` on the Supercharger record, for every unit |
| No armored components (IO:AE p.156) | not modelled | the builder has no armored components |

Still owed for superheavy 'Mechs: the superheavy and tripod internal structure records (IO:AE p.217).

Regression test: `Batch 21 Superheavy 'Mech equipment limits` (6 tests).

## Batch 22: Superheavy 'Mech structure

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Superheavy 'Mech Structure Table, 105–200 tons | mech-internal-structure-types | fixed | IO:AE p.155 | IO v1.21, IO:AE v3.01: none for this table | four rows were wrong: 130 tons arm 22 → 21; 135 tons arm 23 → 22; 145 tons side torso and leg 30 → 31; 155 tons side torso and leg 32 → 33. The other sixteen rows match |
| Superheavy structure weight (standard 20%, endo-composite 15%, endo steel 10%) | battlemech.ts | verified | IO:AE p.155 | none | all twenty masses match the table |
| Structure types above 100 tons | battlemech.ts | **fixed** | IO:AE p.155 | none | "no other internal structure types are available": Reinforced and Composite were offered. Now standard, endo steel, endo-composite and industrial only; a design made superheavy reverts to standard |
| Tripod structure weight +10% | battlemech.ts | verified | IO:AE pp.155, 159 | none | 150-ton tripod: 33 tons |

**Owed, not started:** the superheavy critical slot rules (IO:AE pp.155–157). Each superheavy slot holds twice what a standard slot does, so endo steel takes 7 slots and endo-composite 4 (the builder allocates 14 and 7), and the engine takes half its usual slots, rounded up. The gyro (2 slots) and cockpit are already handled. This needs the slot model changed, so it is recorded here and on the roadmap rather than patched.

Regression tests: `Batch 22 Superheavy 'Mech structure`, `Batch 22 Superheavy 'Mech structure types`.

## Batch 23: Rotary AC Caseless rounds

Decision 2026-10-01: "Go with book on caseless." TO:AUE p.164 (corrected sixth printing) opens the autocannon munitions section with "Unless otherwise noted, all of the specialty munitions described here may only be employed by standard and light autocannons", and the Caseless box gives "Tech Base (Ratings): Inner Sphere". IO:AE p.53 lists Caseless for AC, LAC and PAC. Nothing lets a Rotary AC fire it, and the Clan copies had no tech base to stand on. Errata v7.0 does not change the section.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Rotary AC/2 and AC/5 Caseless Ammo (IS) | mech-is-ammo → mech-custom-ammo | moved to custom | none (TO:AUE p.164 excludes it) | none | Tags unchanged; `book: "Custom"`, `techRating: "x"`, prototype date dropped; cost, BV and rounds per ton untouched pending the custom catalog source search |
| Rotary AC/2 and AC/5 Caseless Ammo (C) | mech-clan-ammo → mech-custom-ammo | moved to custom | none | none | same |
| ProtoMech AC specialty rounds (Armor-Piercing, Caseless, Flak, Flechette, Tracer) | none | gap | IO:AE p.53 ("AC, LAC, PAC") | none | No records exist; only `ammo-clan-protomech-ac-N-standard`. TO:AUE p.164 says "standard and light autocannons" while IO:AE names the PAC, so the newer book adds it. Not added in this batch: statistics per PAC size need the TO:AUE cost and BV rules worked through |

Custom records are offered only when Custom equipment is switched on; a design saved with one still loads (loading always includes the custom catalogs, Batch 15).

Regression tests: `Batch 23 Rotary AC Caseless rounds` (registry) and `Batch 23 Rotary AC Caseless rounds are Custom` ('Mech). The four rows left the Batch 12c date table.

## Batch 24: superheavy critical space and cockpit slots

IO:AE pp.155–157 and the blank record sheets at the back of the book (third corrected printing). Errata v3.01 has nothing on these pages.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Superheavy engine slots | battlemech.ts | **fixed** | IO:AE p.156 | none | "half of those normally required ... (rounded up)", per location: standard 6 → 3; Inner Sphere XL 6+3+3 → 3+2+2 (the SHP-4X Omega example, p.157); light 3+1+1; compact 3 → 2; XXL 3+3+3. The center torso reads Engine ×3, Gyro ×2 as on the Superheavy 'Mech Record Sheet |
| Superheavy endo steel 7 slots, endo-composite 4 | battlemech.ts | **fixed** | IO:AE p.155 | none | the builder asked for 14 and 7 |
| Superheavy armor slots | battlemech.ts | **fixed** | IO:AE p.157 | none | "including those for armor": ferro-fibrous 14 → 7, light 7 → 4, heavy 21 → 11. Armor with fixed locations halves per location |
| Superheavy weapon and equipment slots | battlemech.ts | **fixed** | IO:AE p.157 | none | half, rounded up, no sharing: AC/10 7 → 4, and two of them take 8. The equipment picker and the record sheet equipment table show the superheavy figure |
| Superheavy heat sink slots | battlemech.ts | **fixed** | IO:AE p.157 | none | two singles or four compact sinks per slot, named with the count ("Heat Sinks (2)"); an Inner Sphere double takes 2 slots; a Clan double 1 |
| Superheavy designs saved with full-size slots | battlemech.ts | fixed | — | — | a saved allocation size is capped at what the item now takes, so old saves reload at half size instead of keeping 7-slot autocannons |
| Tripod cockpit slots | battlemech.ts | **fixed** | IO:AE p.159; Three-Legged 'Mech Record Sheet | none | the builder put a second cockpit slot in the center torso (two on a superheavy tripod). The record sheets show one head slot ("Tripod Cockpit", "Superheavy Tripod Cockpit") and p.159 says "all Tripod cockpits occupy the same number of critical slots" |
| Superheavy cockpit slots | battlemech.ts | **fixed** | IO:AE p.156; Superheavy 'Mech Record Sheet | none | one head slot, no center torso slot. The Omega example fills the center torso exactly (3 engine, 2 gyro, 4 Gauss, 1 ammo, 1 C3i, 1 CASE II), which leaves no room for one |
| QuadVee cockpit slots | battlemech.ts | **fixed** | IO:AE p.128; QuadVee Record Sheet | none | head slots 3 and 4 ("Cockpit (Pilot)", "Cockpit (Gunner)"), no center torso slot. A QuadVee saved with equipment in head slot 4 gets that item back in the unallocated list |

The center torso cockpit slot was in upstream too, so this goes in the equipment PR as a correction, with the record sheets as the source.

**Owed:** superheavy ammunition sharing. "Every critical slot of ammo placed in the torsos, arms, or legs ... may carry up to two slots of ammunition" of the same weapon type (p.157). Each ton still takes its own slot here, which is legal but wastes space: the Omega's center torso needs a shared Gauss slot to fit. It needs two items in one slot, which the slot model does not have yet. Also not done: the two-items-per-location allowance for industrial equipment and the Heavy Gauss arm mount (p.157), and the "Inner Sphere tech base only" rule for superheavy 'Mechs.

Regression tests: `Batch 24 cockpit critical slots`, `Batch 24 Superheavy 'Mech critical space`.

## Batch 25: superheavy tech base

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Superheavy 'Mechs, Inner Sphere tech base only | mech-tonnages.ts, battlemech.ts, step 1 | **fixed** | IO:AE p.154 | none | "available only to the Inner Sphere Tech Base under these rules. The Clans do not produce superheavy 'Mechs". A Clan or Mixed (Clan base) design is offered tonnages up to 100; switching a superheavy design to a Clan base brings it down to 100 tons, as changing the chassis type already does. A design loaded as Clan and superheavy reports the violation. Inner Sphere and Mixed (Inner Sphere base) are unaffected: p.157 expects Clan double heat sinks "if using Mixed-Tech rules". Custom Homebrew lifts the limit |
| Heavy Gauss Rifle in superheavy arms; two industrial items per location | — | nothing to do | IO:AE p.157 | none | the builder has no torso-only or one-per-location rules to lift. Those TM limits are themselves owed |

Regression tests: `Batch 25 Superheavy 'Mechs are Inner Sphere technology`.

## Batch 26: explosive ammunition penalty by location

Found while reading the TechManual Battle Value errata (v4.1) against the Battle Value code. The rule text is the same in the corrected sixth printing (TM p.302), so this is a code fault, not an erratum.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Leg ammunition, Inner Sphere 'Mech | battlemech.ts | **fixed** | TM p.302 | BV errata v4.1: same text | "15 points per critical space of explosive ammo in the center torso, legs or head, or not protected by CASE in its location". Leg ammunition was treated as protected when the side torso above it had CASE, including a quad's front legs and a tripod's center leg. Legs are now always penalised |
| Light engine | battlemech.ts | **fixed** | TM p.302 | same | "Inner Sphere 'Mech with Standard or Light engines" keep the CASE exemption. The code asked "does the engine have side torso slots", so a Light engine lost it. Now: three or more side torso slots (Inner Sphere XL, XXL) means every location is penalised; two (Light, Clan XL on a mixed design) counts as standard. The XXL and mixed Clan XL readings follow MegaMek; the book names only XL, Standard and Light |
| Arm ammunition, Inner Sphere XL engine | battlemech.ts | **fixed** | TM p.302 | same | "in any location ('Mech with Inner Sphere XL engine)": an arm was spared when its torso had CASE |
| CASE II | battlemech.ts | **fixed** | TO:AUE p.193 | TO:AUE v7.0: none | "No reduction ... for ammunition or Gauss weapons mounted in the same location as CASE II, or one location out per the Damage Transfer Diagram (excepting the legs)". CASE II was not recognised at all. It now covers its own location (any location, any engine, either tech base), a side torso's arm, and the side torsos from the center torso. **Flag:** MegaMek applies the "one location out" part to arms only; the book's wording also covers side torsos from a center torso CASE II, and the book is followed |
| Floor of 1 | battlemech.ts | **fixed** | TM p.302 | same | "These subtractions cannot drop the running total below 1" was not applied |
| Clan 'Mech: center torso, legs, head | battlemech.ts | verified | TM p.302 | same | unchanged |

Not changed, noted: prototype CASE (IO:AE) is not counted as CASE for Battle Value; `hasXLEngine()` still answers true for a Light engine and is used by the "wrecked" check in play tracking, where a Light or Clan XL 'Mech should survive losing one side torso; the footnote treating a Clan 'Mech built without CASE as Inner Sphere is not modeled.

Regression tests: `Batch 26 explosive ammunition penalty by location`.

## Batch 27: Weapon Battle Rating order

Same source as Batch 26: TM p.303, text unchanged by the Battle Value errata v4.1.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Tie between weapons of equal Modified BV | battlemech.ts | **fixed** | TM p.303, step 4 | same text | "choose the one that generates the least heat when fired". The sort took the hotter weapon first. PPC + Large Laser + AC/10 on ten single sinks: 422, was 360.5 |
| Order by Modified BV | battlemech.ts | **fixed** | TM p.303, step 4 | same text | the sort used the table BV, before the Targeting Computer multiplier. A Large Laser on a Targeting Computer (153.75) now goes ahead of an LRM 15 (136) |
| Forward-firing weapons on a rear-dominant design | battlemech.ts | **fixed** | TM p.303, Rear-Firing Weapons | same text | "halve the value of the forward-firing torso-, leg- and head-mounted weapons instead": they were never halved. Arm weapons are unaffected |
| Equipment list order | battlemech.ts | fixed | — | — | the calculation sorted the installed equipment list itself, so the list changed order whenever Battle Value was worked out (the cause of the Batch 17 import problem). It now sorts a copy; the installed list stays in its sort-key order. Closes the owed item |
| Heat multipliers (Ultra ×2, Rotary ×6, Streak ×½, one-shot ×¼), stealth +10 movement heat, TSM ×1.5 and Industrial TSM ×1.15, Small Cockpit ×0.95, AMS ammunition cap | battlemech.ts | verified | TM pp.302–304 | same text | read against the code; no change |

**Owed:** IndustrialMechs "unless equipped with Advanced Fire Control ... multiply their Offensive Battle Rating by 0.9" (TM p.304). The builder has no fire control choice (TM p.69), so the multiplier cannot be applied correctly yet.

Regression tests: `Batch 27 Weapon Battle Rating order`.

## Batch 28: TechManual errata v8.0 and the unit slot columns

**Errata v8.0 (22 August 2024, eighth printing).** The local PDF is the corrected sixth printing, and the printing markers are lost in the text extract, so every entry on the equipment, cost, Battle Value and table pages (pp.204–249, 290–296, 317–318, 341–346) was read and its explicit statements checked against the records.

| errata entry | result |
|---|---|
| p.341 LB 5-X range 3/7/14/21; p.343 Clan Ultra AC/5 7 tons; ER Micro Laser 1/2/4 | already correct |
| p.343 ProtoMech space 1 for Clan LB 10-X, Ultra AC/10, Gauss Rifle, HAG 20, ER Large Laser, Large Pulse Laser, Heavy Large Laser, ER PPC; NA for the Artemis launchers | already correct |
| p.343 ProtoMech space 1 for Flamer (Vehicle) | **fixed** (was not ProtoMech-mountable); its four munitions follow |
| p.317 MRM 40 BV 224 / 45 (one-shot) | already correct |
| p.294 AC/2 ammunition 1,000; p.295 Streak SRM 6 ammunition 54,000; p.292 Light Active Probe 50,000 | already correct |
| p.341 Large Laser Support Vehicle space 2; p.342 Targeting Computer Support Vehicle space 1 | already correct |
| p.344 Mining Drill Combat and Support Vehicle space 1 | **fixed** (Support Vehicle 4 → 1), which led to the table comparison below |
| pp.295, 345 Flare (LRM) and Incendiary (LRM) lines deleted | no Flare LRM record; Incendiary LRM is cited to TO:AUE p.182, where it now lives |
| pp.290–296 Introduced / Extinct / Reintroduced changes | not applied from this sheet: dates follow IO:AE (2022), as decided |
| pp.342–343 DropShip space NA for Beagle, Guardian ECM, Clan Active Probe and ECM Suite | **fixed** below |
| eighth-printing additions (p.123, 126, 132, 134 Support Vehicles; p.239 Transport Bays; pp.250, 253, 348 battle armor; p.316 Motorized) | nothing in the 'Mech catalogs; goes with the domain catalogs |
| p.343 ATM 6 / 9 / 12 aerospace damage 10 / 14 / 20 | not applied: missile `damageAero` is already owed as a whole |

**Unit slot columns.** The tables give the slots an item takes on each unit type (M, P, CV, SV, F, SC, DS). Only the 'Mech column had been audited (Batch 18). The other six were compared for every row of pp.341–345 that pairs with a record.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Industrial equipment, Support Vehicle slots | mech-universal-equipment | **fixed** | TM pp.344–345 | v8.0: Mining Drill | Backhoe, Chainsaw, Combine, Dual Saw, Heavy-Duty Pile Driver, Lift Hoist, Mining Drill, Rock Cutter and Wrecking Ball carried their 'Mech slot count in the Support Vehicle column; all take 1 |
| Salvage Arm | mech-universal-equipment | **fixed** | TM p.345 | none | 'Mech only: vehicle columns NA |
| Mining Drill, Nail/Rivet Gun tech rating | mech-universal-equipment | **fixed** | TM p.344; IO:AE p.36 | none | Mining Drill C → B, Nail/Rivet Gun E → C (both books agree) |
| Nail/Rivet Gun, Remote Sensor Dispenser, Searchlight aerospace columns | mech-universal-equipment | fixed | TM pp.344–345 | none | Nail Gun NA; Remote Sensor Dispenser 1 / 1 / 0; Searchlight 0 / 0 / 0 |
| Combat Vehicle slots of multi-slot launchers | IS and Clan missile catalogs | **fixed** | TM pp.342–343 | none | every item takes one Combat Vehicle slot. MRM 10/20/30/40, Rocket Launcher 15/20, MML 3/5/7/9, ATM 3/6/9/12, Clan LRM 10/15, Clan SRM 6 and Clan Streak SRM 6 carried 2 to 8, and the vehicle builder counts slots from this column. Heavy Machine Gun 0 → 1 |
| Support Vehicle slots | several | fixed | TM pp.341–343 | none | Light AC/5 2, Clan LB 5-X 4, Heavy Medium / Large Laser 2 / 3, HAG 20/30/40 6 / 8 / 10, ATM 6/9/12 3 / 4 / 5, Clan LRM 10/15/20 1 / 2 / 4, Clan SRM 6 1, MML + Artemis IV 3 / 4 / 5 / 6, Improved C3 1 |
| MASC on vehicles | IS and Clan misc | **fixed** | TM pp.342–343 | none | NA for every unit but the 'Mech; it was offered to vehicles |
| ProtoMech column | Clan catalogs | fixed | TM p.343 | v8.0 | Active Probe, ECM Suite and Machine Gun Array are ProtoMech-mountable (1); Plasma Cannon is not (NA), and its ammunition follows. Guardian ECM and the C3 Master / Slave had 0, which reads as "mountable, no slots": now NA |
| Aerospace columns | several | fixed | TM pp.342–343 | v8.0 | Beagle 1 / 1 / NA; Guardian ECM and Clan Active Probe / ECM Suite DropShip NA; Light Active Probe 1 / 1 / 0; Machine Gun Array DropShip 0; Targeting Computer fighter 0; C3 Master / Slave NA |

118 rows now match on all seven columns; the industrial rows match on slots, weight and tech rating.

Flags:

- **Flamer (Vehicle)** is one universal record. The Inner Sphere table prints ProtoMech NA and the Clan table 1; ProtoMechs are Clan units, so the record carries 1.
- **Clan A-Pod**: p.343 prints NA for both vehicle columns while the Inner Sphere row prints 1 and 1. Left at 1 and 1 pending a second source.
- Not paired with a record: capital missiles, Screen Launcher (capital catalogs, owed) and the one-shot Clan Narc launchers (not on the table).
- No records exist for Bulldozer, Dumper, Ladder, Fluid Suction Systems, Sprayers, Bridgelayers, Paramedic Equipment, Field Kitchen, MASH and the other Support Vehicle items on pp.344–345.

Regression tests: `Batch 28 Industrial Equipment Table`, `Batch 28 unit slot columns of the Weapons and Equipment Tables`; the registry test on ProtoMech-mountable ammunition covers the munitions.

## Batch 29: TO:AUE unit slot columns

The same check as Batch 28, against the Heavy Weapons and Equipment Construction Data tables (TO:AUE pp.217–223, corrected sixth printing; errata v7.0 changes none of these columns). The tables carry eleven columns (M P CV SV F SC DS JS WS SS MS); the records hold the first seven.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Combat Vehicle slots of multi-slot launchers | IS and Clan missile catalogs | **fixed** | TO:AUE p.221 | none | Enhanced LRM 15/20, Extended LRM 10/15/20 and Streak LRM 10/15/20 carried 3 to 8; all take 1 |
| Support Vehicle slots | several | fixed | TO:AUE pp.217–223 | none | Thumper 7 (was 15), Clan Rotary AC/5 8, Improved Heavy Medium / Large Laser 2 / 3, Enhanced LRM 10/15/20 4 / 6 / 9, Laser AMS (IS) 2, Fluid Gun 1, Light / Medium / Heavy Rifle 1 / 2 / 3; Modular Armor 1 |
| 'Mech-only items offered to vehicles | IS and Clan misc | **fixed** | TO:AUE pp.217–223 | none | CASE II, Null-Signature System and Void-Signature System print NA in both vehicle columns |
| Aerospace columns | several | fixed | TO:AUE pp.217–221 | none | 'Mech Mortars and Heavy Flamers NA; Bloodhound, Watchdog and Angel ECM 1 / 1 / 0; C3 Boosted Master NA; CASE II fighter 0; Modular Armor fighter 2; Long Tom fighter NA |
| ProtoMech column | Clan misc | fixed | TO:AUE p.217 | none | Watchdog CEWS and Clan Angel ECM are ProtoMech-mountable |
| Long Tom on 'Mechs | battlemech.ts | **fixed** | TO:AUE p.217; IO:AE p.157 | none | the table gives the Long Tom no 'Mech space; "a superheavy 'Mech can also mount artillery weapons ordinarily denied to standard-weight 'Mechs". The Long Tom is now offered to superheavy 'Mechs only, and a lighter design carrying one reports it. Sniper, Thumper, Arrow IV and the artillery cannons are unaffected |

**Proposed, not applied (needs your call):** ProtoMech AC/8, ProtoMech column. The table prints "1*" for all three ProtoMech ACs (the asterisk points to the Main Gun rule, p.98). The record holds 2, which is the value approved in the Block 12 workbook and pinned by its test. Left at 2.

Left as they are, with reasons:

- **Streak LRM, ProtoMech column.** The launcher rows print NA and a separate row gives "Streak LRM (ProtoMech, per tube)". There is no per-tube record, so the launcher records keep their ProtoMech flag and stand in for it; the munition stays ProtoMech-usable.
- **ER Flamer, Heavy Flamer, Angel ECM (Inner Sphere records).** Their rows are shared "IS/Clan" rows with ProtoMech 1. ProtoMechs are Clan units, so only the Clan records carry the flag.
- Rows with no record: Cruise Missiles, Laser-Reflective / Reactive / Ferro-Lamellor armor rows (armor catalog), Vehicular Grenade Launcher, Recon Camera, Taser, Coolant Pod, Handheld Weapons, the vehicle chassis modifications, the naval, sub-capital and large-craft items. Already on the owed list as missing records or domain catalogs.

Regression tests: `Batch 29 unit slot columns of the TO:AUE construction tables`, `Batch 29 Long Tom artillery on 'Mechs`.

## Batch 30: superheavy ammunition sharing; Total Warfare errata

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Two tons of ammunition in one superheavy slot | battlemech.ts | **fixed** | IO:AE p.157 | v3.01: none | "every critical slot of ammo placed in the torsos, arms, or legs ... may carry up to two slots of ammunition. ... Only ammunition of the same weapon type may be combined ... the different types (by ton) can be combined". Dropping a second ton on a slot that holds one ton for the same weapon now shares the slot; the slot is named for both ("... (x2)", or both round names). Not in the head, not with other equipment, not on a 'Mech of 100 tons or less, and never three. Saved designs keep the pairing; moving the first ton away leaves the second in place |
| Battle Value of a shared slot | battlemech.ts | verified (reading) | TM p.302 | none | "15 points per critical space of explosive ammo": a shared slot is one critical space and costs 15. The superheavy rules do not say otherwise |
| SHP-4X Omega (worked example) | — | verified | IO:AE pp.155–157 | none | built as the book allocates it: 150 tons exactly, nothing left unallocated, center torso full (3 engine, 2 gyro, 4 Gauss, 1 shared ammunition slot, Improved C3, CASE II). This is now a regression test for the whole superheavy slot model |

"Same weapon type" is read as the catalog's ammunition family (standard and special rounds of one weapon; LRM rounds of every launcher size are one family here, as the ammunition records are).

**Total Warfare errata v11.01** (17 September 2023), weapon tables pp.303–305 and the equipment rules: ATM 12 ammunition 5 per ton — already correct. The other table entries change aerospace attack values (Clan LB 2-X 2, ATM 6 10, Clan SRM 2 2/4) and type codes (B-Pod "X", "PB" for point-blank); the aerospace values wait on the `damageAero` item already owed, and the type codes are not stored. The remaining entries are game-play rules, outside the catalogs. TO:AR v7.0 and SO:AAR v5.0 are still to be read.

This closes the superheavy slot rules of IO:AE pp.154–157. Still owed there: nothing in construction; in play, the superheavy critical hit rules (p.154) are not modeled.

Regression tests: `Batch 30 Superheavy ammunition shares critical slots`.

## Batch 31: Vehicular Grenade Launcher and Recon Camera

Two of the records listed as missing. Both are identical for the Inner Sphere and the Clans, so they go in the universal catalog.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Vehicular Grenade Launcher | mech-universal-equipment | **added** | TO:AUE p.127 (rules); p.218 game data; p.219 construction; p.195 BV; IO:AE p.40 dates | TO:AUE v7.0: none | 10,000 C-bills, 0.5 tons, 1 slot on every unit type, 1 heat, range —/—/—/1, BV 15, tech rating C (D-E-F). One-shot (heat counts a quarter for BV), no explosion on a critical hit. Dates PS prototype / ES production (IO:AE p.40; TO:AUE says only "Pre-spaceflight") |
| Recon Camera | mech-universal-equipment | **added** | TO:AUE p.150 (rules); p.223 construction; IO:AE p.34 dates | none | 10,000 C-bills, 0.5 tons, 1 slot ('Mech, ProtoMech, vehicles, fighter, Small Craft; DropShip NA), no heat, no BV entry. Dates PS / PS |

Flags:

- **Recon Camera tech rating.** TO:AUE prints C/B-B-B in both the rules box (p.150) and the table (p.223); IO:AE p.34 prints "All/B". The record carries C, from the item's own rules, as the other tech ratings do.
- **Vehicular Grenade Launcher munitions** (TO:AUE p.175: fragmentation by default, chaff, incendiary, smoke) are a load-out choice inside the launcher and have no records. The record stores no damage figure: fragmentation only harms conventional infantry and low-BAR Support Vehicles.
- Alpha Strike conversions for both are marked unresolved.

Still missing from the same list: Primitive Prototype Long Tom and torpedo launchers (IO:AE pp.189, 210), Clan PPC Capacitor combinations.

Regression tests: `Batch 31 Vehicular Grenade Launcher and Recon Camera`.

## Batch 32: physical weapon to-hit modifiers

Every physical weapon stored a to-hit modifier of 0 (the Hatchet and Sword stored none).

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Hatchet −1, Sword −2, Retractable Blade −2 | IS ballistic / misc | **fixed** | TW p.146, Physical Weapon Attacks Table | TW v11.01: daggers on two damage values only | |
| Backhoe +1, Combine −2, Heavy-Duty Pile Driver +2, Mining Drill −1, Rock Cutter +1, Wrecking Ball +1 | mech-universal-equipment | **fixed** | TW p.146 | same | Chainsaw, Dual Saw and Spot Welder are +0 and were already right |
| Heavy-Duty Pile Driver damage | mech-universal-equipment | **fixed** | TW p.146; TM p.344 | none | 10 → 9 (both tables print 9; 10 is its tonnage) |
| Mace +1, Lance +1, Chain Whip −2, Vibroblades −2 | IS misc | **fixed** | TO:AUE p.216 | v7.0: Lance +1 and Flail +0 confirmed | Flail +0 already right |
| Claws +1 | IS and Clan misc | **fixed** | TO:AUE p.216 | v7.0: "Claws: Change the To-Hit Modifier from 0 to +1" | |
| Shields −2 / −3 / −4 | IS misc | **fixed** | TO:AUE pp.103, 216 | none | the Shield Bash modifier (Small / Medium / Large) |

Not modeled: the play-tracking to-hit calculation adds this modifier to a Gunnery-based roll. Physical attacks use the Piloting Skill (TW p.144), so the figure shown for a physical weapon in play is still not the canon target number.

Regression tests: `Batch 32 physical weapon to-hit modifiers`.

## Batch 33: ProtoMech AC/8 ProtoMech slots

Decision 2026-10-01: "Set to book on pm acs."

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| ProtoMech AC/8, ProtoMech column | mech-clan-equipment-weapons-ballistic | **fixed** | TO:AUE p.217 | v7.0: none | 2 -> 1. The table prints "1*" for the ProtoMech AC/2, AC/4 and AC/8; the asterisk is the Main Gun rule (p.98). This replaces the Block 12 workbook value of 2, and the two tests that pinned it now pin 1 |

## Batch 34: remaining missing records; TO:AR and SO:AAR errata

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Primitive Prototype Long Tom | mech-is-equipment-weapons-artillery | **added** | IO:AE p.112 (rules, dates); p.189 (BV) | v3.01: none | prototype 2445 until Long Tom production in 2500. "Weight, cost, and critical space ... identical to their standard versions": 30 tons, 450,000 C-bills, the Long Tom's slots. Three-quarters of the ammunition per ton, rounded up: 4 shots. BV 368, ammunition 35. Jams on a 2. Superheavy 'Mechs only, like the Long Tom |
| Primitive Prototype LRT 5 / 10 / 15 / 20, SRT 2 / 4 / 6 | mech-is-equipment-weapons-missiles | **added** | IO:AE p.112 | none | prototype 2370 until 2380 (Prototype Dates for Basic Weapons Table, "Torpedo Launchers (LRT/SRT)"). Fed by torpedo ammunition |
| ER PPC w/ Capacitor (Clan) | mech-custom-… → mech-clan-equipment-weapons-energy | **moved to canon** | IO:AE p.40 ("Clan Intro: 3101"), p.190 ("ER PPC + Capacitor (Clan) 548"), p.197 | none | see below |

**Derived, flagged:** IO:AE prints no table rows for the primitive prototype torpedo launchers. The rules name them only as the missile launchers' "torpedo equivalents", so each record carries its missile launcher's weight, cost, slots, heat, range, shots and Battle Value. That equivalence is how TM treats the standard LRT and SRT, but the BV figures are not printed for the torpedo forms.

**Clan ER PPC with Capacitor: a classification reversed.** On 2026-09-28 this was classed as non-canon ("IO does not allow a PPC Capacitor on Clan PPCs") and kept as a Custom record with the Clan ER PPC's BV. TO:AUE p.149 does say the capacitor fits "any Inner Sphere standard-scale PPC". IO:AE, the newer book, adds the Clan form in three places: the advancement table (p.40, "Clan Intro: 3101"), the Battle Value table (p.190, 548) and the conversion notes (p.197, "a PPC capacitor compatible with Clan-made ER PPCs occurred in the decades following the Jihad"). Under "newest publication wins" and "custom until a source is found" the record is now canon: Clan catalog, same tag, introduced 3101, BV 548 (was 412), 7 tons, 3 slots, 450,000 C-bills, explosive. Only the ER PPC: IO:AE names no other Clan PPC. Say so if you would rather keep it custom.

**Errata.** TO:AR v7.0: the only catalog entries are Flail +0 and Mace +1 (p.211), already stored (Batch 32). ProtoMech ACs may use rapid-fire mode (p.98) — a play rule. SO:AAR v5.0: all large-craft construction and play; nothing in the 'Mech catalogs. That completes the errata comparison for the 'Mech catalogs.

Regression tests: `Batch 34 Primitive Prototype Long Tom and torpedo launchers`, `Batch 34 Clan ER PPC with PPC Capacitor`.

## Batch 35: TSEMP weapons and RISC Viral Jammers

From the list of equipment the books give statistics for but the catalogs lacked. All Inner Sphere.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| TSEMP Cannon | mech-is-equipment-weapons-energy | **added** | IO:AE pp.84–85 (rules); p.214 game data; p.215 construction; p.190 BV; p.43 dates | v3.01: none | 800,000 C-bills, 6 tons, 5 slots, 10 heat, range 5/10/15, BV 488, rating E; ~3100 prototype / 3109 |
| TSEMP One-Shot | same | **added** | same | none | 500,000, 4 tons, 3 slots, 10 heat, BV 98; ~3090 / 3095 |
| RISC Repeating TSEMP Cannon | same | **added** | IO:AE p.88; pp.214–215; p.190; p.39 | none | 1,200,000, 8 tons, 7 slots, 10 heat, BV 600; prototype 3133, never in production, gone 3138 |
| RISC Viral Jammer (Decoy), (Homing Beacon) | mech-is-equipment-weapons-misc | **added** | IO:AE p.88; pp.214–215; p.190; p.39 | none | 990,000, 2.5 tons, 1 slot, 12 heat, reach 17 hexes, BV 284 (defensive), rating F; prototypes 3136 / 3137, gone 3142 |
| RISC Hyper Laser explosive | mech-is-equipment-weapons-energy | **fixed** | IO:AE p.87 | none | "will explode if it suffers a critical hit": was not marked explosive, so it took no Battle Value penalty |

The TSEMP weapons explode like Gauss weapons on a critical hit (10 points), so they are marked explosive and cost 1 BV a slot where unprotected, as the footnote on p.190 marks them.

Flags:

- **Viral Jammer prototype year.** The advancement table (p.39) prints 3136 for the Decoy and 3137 for the Homing Beacon; the construction table (p.215) prints 3135P for both. The records follow p.39, as the other dates do.
- **ProtoMech column.** The construction table gives all five items a ProtoMech slot of 1 and the rules list "PM" under Available to, so these Inner Sphere records carry it.
- Not enforced: one Viral Jammer "of any type" per unit (each type is limited to one; a design could still take one of each); TSEMP Cannons need a fusion or fission engine; the play rules (no firing in consecutive turns, the Effects Table, the jammer's own failure roll).
- Alpha Strike conversions are marked unresolved.

Still without records from the same list: Coolant Pod, MRM Apollo FCS, C3 Remote Sensor Launcher, Collapsible Command Module, Full-Head Ejection System, HarJel II / III, RISC Heat Sink Override Kit, Laser Pulse Module, 'Mech Taser, Jump Pack / Drop Pack, Prototype Improved Jump Jets. Each needs builder support beyond a record (heat capacity, linked launchers, armor repair, final BV multipliers).

Regression tests: `Batch 35 TSEMP weapons and RISC Viral Jammers`.

## Batch 36: BattleMech Taser

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| BattleMech Taser | mech-is-equipment-weapons-ballistic | **added** | TO:AUE pp.157-158 (rules); p.222 game data; p.223 construction; p.195 BV; IO:AE p.43 dates | TO:AUE v7.0: none | 200,000 C-bills, 4 tons, 3 slots ('Mech and Support Vehicle; 1 Combat Vehicle; no aerospace), 6 heat, 1 damage, range 1/2/4, +1 to hit, 5 shots a ton, BV 40, rating E. Explodes like a Gauss weapon (6 points). 3065 prototype / 3084 |
| BattleMech Taser ammunition | mech-is-ammo | **added** | TO:AUE p.158; p.223; p.195; IO:AE p.56 | none | 2,000 C-bills a ton, 5 shots, BV 5, explosive (6 points a shot) |

Flags:

- **Dates.** TO:AUE prints "3067 (Federated Suns [BattleMech Taser])" for the prototype and "N/A" for introduction, and 3067P in the table; IO:AE p.43 gives 3065 prototype and 3084 production. IO:AE is followed, as for every other date.
- Not enforced: the fusion engine requirement. The effects table and the 100-ton limit are play rules.
- Alpha Strike conversion marked unresolved.

Regression tests: `Batch 36 BattleMech Taser`.

## Batch 37: engine requirements and the one-jammer limit

Decision 2026-10-01: enforce the engine rulings for the TSEMP cannon and the Taser, and one Viral Jammer rather than one of each. The rules were re-read first.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| TSEMP Cannon | 'Mech and vehicle builders | **enforced** | IO:AE p.85 | v3.01: none | "can only be mounted and used by units powered by fusion or fission engine types". Not offered with an ICE or fuel cell engine; a design that changes engine afterwards reports it |
| RISC Repeating TSEMP Cannon | same | **enforced** | IO:AE p.88 | none | "only units powered by fusion or fission engine types may carry or use a repeating TSEMP" |
| TSEMP One-Shot | same | verified | IO:AE p.85 | none | "may be mounted on units powered by non-fusion engines": no engine limit |
| BattleMech Taser | same | **enforced** | TO:AUE p.158 | v7.0: none | "only units powered by a fusion engine can use BattleMech Tasers": fusion only, so a fission engine does not qualify. The book words this as use, not mounting; it is enforced at construction as decided |
| RISC Viral Jammers | same | **enforced** | IO:AE p.88 | none | "only one jammer of any type may be mounted on a single unit": mounting either type now closes off both; a design carrying one of each reports it |

How: two optional record fields, `requiresEngine` ("fusion" or "fusion-or-fission") and `maxPerUnitGroup` (records in a group count together against `maxPerUnit`), checked by both builders. Fusion engines are standard, XL, Light, Compact, XXL and Primitive in either tech base, with their large forms.

Not covered: the One-Shot on a non-fusion vehicle "will require heat sinks and power amplifiers as per the normal rules"; power amplifiers are not modeled for any energy weapon.

Regression tests: `Batch 37 engine requirements and the one-jammer limit` ('Mech), `Vehicle engine requirements and the one-jammer limit`.

## Batch 38: Coolant Pod

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Coolant Pod [IS] | mech-is-equipment-weapons-misc | **added** | TO:AUE p.116 (rules); p.219 construction; p.193 BV; IO:AE p.36 dates | v7.0: none | 50,000 C-bills, 1 ton, 1 slot; 'Mechs and aerospace fighters only ("Available To: BM, IM, AF"); rating D; prototype 3049, production ~3079. Explodes for 10 points when hit unused |
| Coolant Pod [Clan] | mech-clan-equipment-weapons-misc | **added** | same | none | same statistics; "Clan Intro: 3079", no prototype. Two records because the dates differ by side |
| Coolant Pod in Battle Value | battlemech.ts | **added** | TO:AUE p.193 | none | heat sink capacity + (heat sinks x pods / 5, rounded up), at most twice the number of heat sinks; 1 point off the defensive rating per pod slot (through the explosive-component rule, so CASE and CASE II apply as for Gauss weapons) |

Flag: TO:AUE's table prints 3049P / 3056P; IO:AE p.36 gives 3049 prototype, ~3079 production and a Clan introduction of 3079. IO:AE is followed.

Not modeled: triggering a pod in play (one a turn, once per battle).

Regression tests: `Batch 38 Coolant Pod`.

## Batch 39: RISC Heat Sink Override Kit

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| RISC Heat Sink Override Kit | mech-is-equipment-weapons-misc | **added** | IO:AE p.86 (rules); p.215 construction; p.190 BV; p.39 dates | v3.01: none | 500 C-bills; "can only be installed on a 'Mech, and occupies no weight or critical slots"; rating D; prototype 3134, gone 3139 |
| Final Battle Value x1.01 | battlemech.ts | **added** | IO:AE p.190 | none | "Multiply unit's final BV by 1.01", applied after the Small Cockpit multiplier and before rounding, once however many kits are listed |
| Equipment with no critical slots | battlemech.ts | added | IO:AE p.86 | none | the first record with 0 'Mech slots: it is carried in the equipment list ("must be noted among the unit's weapon list") and never enters the critical slot allocation |

The book sets no limit on the number of kits, so none is enforced; extra kits change nothing.

Regression tests: `Batch 39 RISC Heat Sink Override Kit`.

## Batch 40: Prototype Improved Jump Jets

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Prototype Improved Jump Jets | mech-jump-jet-types | **added** | IO:AE p.97 | v3.01: none | "identical construction rules as standard jump jets", so 0.5 / 1 / 2 tons and 1 slot a jet, but "a maximum Jump MP equal to the 'Mech's maximum Running MP". Heat "2 heat points per hex jumped, with a minimum cost of 6". Introduced 3022 (Federated Suns), standard production 3069: a prototype-only type for those years, Inner Sphere only, Experimental |

Flags:

- **Cost.** IO:AE prints no cost and no table row for this item. The record uses the standard jump jet rate (200 x tons x Jump MP squared), as MegaMek does.
- **Explosion.** A critical hit on a jet is "identical to a 10-point internal ammunition explosion". No Battle Value penalty is applied: neither IO:AE nor TM gives one for it.
- With an XXL engine the heat is doubled again, as for other jump jets (TO:AUE); the book does not address the pairing, which cannot occur in the item's years anyway.

Regression tests: `Batch 40 Prototype Improved Jump Jets`; the Batch 11 citation test now lists the new type.

## Batch 41: cockpit selector and IndustrialMech fire control

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Cockpit selector | battlemech.ts, step 2 | **added** | TM pp.52, 69, 211 | TM v8.0: none | `getAvailableCockpits()` / `setCockpitType()` and a Cockpit select under the gyro. Standard or Small for a BattleMech; the one mandatory cockpit for Tripods, QuadVees and superheavy 'Mechs; the two IndustrialMech cockpits for a 'Mech on industrial structure. The Small Cockpit could be set only by an import before |
| IndustrialMech Cockpit; with Advanced Fire Control | mech-cockpit-types | **implemented** (was deferred) | TM pp.69, 211; cost p.277 | none | 3 tons either way; 100,000 C-bills, or 200,000 with Advanced Fire Control ("doubles the cockpit's C-bill cost, but takes up no tonnage or critical space") |
| Offensive Battle Rating x0.9 | battlemech.ts | **added** | TM p.304 | BV errata v4.1: same text | "IndustrialMechs, unless equipped with Advanced Fire Control (see p. 69), multiply their Offensive Battle Rating by 0.9". Closes the item owed since Batch 27 |
| Equipment needing Advanced Fire Control | battlemech.ts | **enforced** | TM p.69 | none | without it "an IndustrialMech may not use ... Artemis IV, Beagle Active Probe (or its Clan equivalent), C3 or C3i units (including Master and Slave units) or Targeting Computers": not offered, and reported if already mounted |

**Default.** A design on industrial structure gets the Advanced Fire Control cockpit unless the plain one is chosen. That is how IndustrialMechs were priced and rated before the choice existed (the standard cockpit's 200,000 C-bills and no x0.9), so saved designs do not change. The book's own default is the plain cockpit: say if new designs should start there. Saved as the feature flag `no_afc`.

Not covered: the Ejection Seat (0.5 ton, 1 head slot), the +1 to-hit in play, Small / Torso-Mounted / Command Console cockpits beyond what was there, and the cockpit of a superheavy IndustrialMech (still the superheavy BattleMech cockpit). The UI select was type-checked but not exercised in a browser.

Regression tests: `Batch 41 cockpit selection and IndustrialMech fire control`.
