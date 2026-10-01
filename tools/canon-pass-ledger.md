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
| Superheavy Gyro | battlemech.ts (tonnage > 100) | fixed | IO p.162 | none | weight ceil(rating/50), now 2 CT slots (was 4); dates ~2905 (FW) / 2940 (FW) per IO p.48; **cost provisional**: priced at Heavy-Duty rate, unverified |
| No Gyro (gyroless) | – | gap | IO p.116 (construction), BV note in IO BV section | – | only with the Machina Domini interface cockpit; gyro slots become empty; implement in the cockpit batch |

All gyro dates (prototype/production, tech base) checked against the IO Tech Progression table, IO p.48. Unknown `extinct`/`reintroduced` changed from legacy `0` to `null` (`_itemIsAvailable` treats both as "none").

## Batch 3: myomer

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Standard musculature | mech-myomer-types.ts | fixed | TM p.277 (cost) | none | dates 2300p / 2350 per IO p.48 (was 0); extinct/reintroduced → null |
| Triple-Strength Myomer | mech-myomer-types.ts | verified | TM p.304 (BV ×1.5) | none | 3028p / 3050; extinct/reintroduced → null |
| Industrial TSM | mech-myomer-types.ts | verified | TM p.70 (12 slots), TM p.304 (BV ×1.15) | none | 3035p / 3045; extinct/reintroduced → null |
| Prototype TSM | mech-myomer-types.ts | verified | IO:AE p.98 | none | reintroduced → null |
| Super-Cooled Myomer | mech-myomer-types.ts | fixed (added) | IO:AE p.88; slots p.215, cost p.179, BV p.185 | none | RISC experimental, IS; 3132p, extinct 3140, no production year |
| MASC (IS) | mech-is-equipment-weapons-misc | fixed | TM p.232 (was 225) | none | – |
| MASC (Clan) | mech-clan-equipment-weapons-misc | fixed | TM p.232 (was 225) | none | extinct/reintroduced → null |
| Actuator Enhancement System (IS arm/leg) | mech-is-equipment-weapons-misc | fixed | – | none | IS production 3109 per IO p.48 (was 3108); extinct/reintroduced → null |
| Actuator Enhancement System (Clan arm/leg) | mech-clan-equipment-weapons-misc | fixed | – | none | Clan production 3108 per IO p.48 (was 3109); extinct/reintroduced → null |
| ProtoMech Myomer Booster | mech-clan-equipment-weapons-misc | fixed (added) | TM p.232; weight/slots TM p.85; cost TM p.279; rules TW p.137 | none | ProtoMech only (`space.battlemech` -1); 3066p / 3068; BV unresolved (0 placeholder, flagged) |
| Supercharger | mech-universal-equipment | fixed | TO:AUE p.157 | none | production 3078 per IO (was 1950); TO:AUE lists an early-spaceflight prototype, year unpublished, so prototype left as is |
| Superheavy musculature | – | gap | IO p.162 | none | not a separate myomer type; superheavy 'Mechs cannot use MASC, TSM, AES or Superchargers (IO p.162). Not enforced in battlemech.ts yet: validation gap, queued for the superheavy batch |

The ProtoMech booster's `battleValue: 0` and `cbills: 0` are placeholders: the BV is unresolved and the cost is a formula. Both are flagged for the ProtoMech batch.

## Batch 4: engines

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| Standard Fusion | mech-engine-types.ts | verified (flag) | TM p.214 | none | IO p.44 gives prototype/production "ES", common ~2300; kept `introduced` 2300 (IO common date), since ES has no year |
| Extralight (XL) Fusion [IS] | mech-engine-types.ts | verified | TM p.214 | none | 2556p / 2579, extinct 2865, reintroduced 3035 per IO p.44 |
| Extralight (XL) Fusion [Clan] | mech-engine-types.ts | verified | TM p.214 | none | ~2824p / 2827 per IO p.44 |
| Light Fusion | mech-engine-types.ts | verified | TM p.214 | none | IS only; ~3055p / 3062 per IO p.44 |
| Compact Fusion | mech-engine-types.ts | fixed | TM p.214 | none | IS only; dates now ~3065p / 3068 per IO p.44 |
| XXL Fusion [IS] | mech-engine-types.ts | fixed | TO:AUE p.120 | none | production ~3110 per IO p.44 |
| XXL Fusion [Clan] | mech-engine-types.ts | fixed | TO:AUE p.120 | none | ~2954p / ~3084 per IO p.44 |
| ICE | mech-engine-types.ts | verified (flag) | TM p.215 | none | IO p.44 gives "ES" (early spaceflight); kept `introduced` 1950, no year published |
| Fuel Cell | mech-engine-types.ts | verified | TM p.215 | none | ~2300p / 2470 per IO p.44 |
| Fission | mech-engine-types.ts | verified | TM p.215 | none | 2470p / 2882 per IO p.44 |
| Primitive Fusion | mech-engine-types.ts | fixed | IO p.123 | none | 2439p / 2443, extinct 2520 per IO p.50 (primitive 'Mech); the unsourced 3070 reintroduction was removed |
| Large engines (LSF, LICE, LLF, LXL, LXXL) | – | gap | IO p.44 (cites original TO pp.307–309; TO:AUE page not yet checked) | none | ratings above 400; not in the catalog; 'Mech legality unverified, queued for the superheavy batch |

All engines now carry `book`/`page` (new optional `IEngineType` fields). Every legacy `extinct: 0` / `reintroduced: 0` changed to `null`. A regression test (`Batch 4 engine catalog`) pins the dates and sources.
