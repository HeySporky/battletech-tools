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
