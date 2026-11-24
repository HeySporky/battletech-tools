# Edition-aware Battle Value (BV1 / BV2)

User goal (2026-11-03): BV follows the rules edition the players select, at least BV1 (Master Rules era) and BV2
(TechManual on). Every unit type uses the newest ruling for its scheme, errata included, cited by book and page.
Math must be solid: review every relevant book and errata, cover every modifier, use lookup tables.

## Rulings (user, 2026-11-03)

1. Display: BV1 edition → `1,234 (BV2: 1,456)`. Edition with no BV system → `— (BV2: 1,456)`. BV2 edition → `1,456`.
2. Skill: the BV1 figure uses that edition's skill table (Master Rules p.144 / MR Revised p.158); the BV2 figure in
   parentheses uses the TechManual table (p.315).
3. The roster is in scope: it picks the edition being played through the shared #324 block and shows BV the same way.
4. Unit-type order is my call: 'Mech, vehicle, aero (fighter, small craft, capital), infantry, battle armor, ProtoMech.
5. Standing rules: condense, reuse, extend. **No new files except one that all BV moves into.**

## Design

### One file: `src/data/battle-value.ts` (all BV moves here)

- `skill-multipliers.ts` is folded in (tables and `getSkillMultiplier` unchanged), then deleted: net zero files.
- **`BV_RULES`**: lookup table keyed by edition tag, then unit type. Each record: `scheme: "none" | "bv1" | "bv2"`,
  `source` (book + page, errata noted) and the per-step values that differ between schemes (armor factor, structure
  factor, gyro factor, ammo penalty, TMM/defensive-factor table, speed-factor table or formula, heat rule, tonnage
  term, …; exact fields come from Round 0). Pre-TW expansions (AT2/AT2R, CT2, …) resolve through
  `getEditionAtPublication`, so aero under MR Revised reads AT2R.
- **`getBattleValueRules(edition, unitType)`**: the record, falling back to the newest scheme at or before the edition.
- **Shared step helpers** lifted out of the classes (speed factor, defensive factor, heat-adjusted weapon ordering,
  explosive-ammo penalty, rounding), each taking the record, so BV1 and BV2 run the same code with different
  table values. No second copy of any `_calcBattleValue`.
- **`formatBattleValue(unit, edition, skills?)`**: the one display string for every UI spot (ruling 1-2).
- Equipment BV1 values: extend `IEditionStats` with `battleValue` (and `ammoBattleValue` where printed) in the
  existing catalog records, cited per edition. Lookups go through one `getItemBattleValue(item, edition)` here.

### Classes

- Infantry's `_battleValueMethods` pattern becomes the shared shape: every class gets
  `getBattleValue(edition = this._rulesEdition)` and `getBattleValueLog(edition)`, delegating to `battle-value.ts`.
  Existing callers keep working with no argument.
- Each class's calculation moves into `battle-value.ts` as it is made edition aware (one unit type per round), reading
  the unit through its public getters. The class keeps a one-line wrapper. Net lines should go down.
- The MUL comparison and the bundle report stay BV2.

### UI

- Every BV display (status bars, summaries, record sheets, roster tables, print; ~35 files) calls
  `formatBattleValue`. Sheets print the selected edition's BV with the BV2 note.
- Roster: add the shared game-settings block (Edition only needed, `hiddenSteps` for the rest), stored on the roster;
  totals and per-unit BV use that edition. Filtering units by edition availability stays in #590 step 2 (not here).

## Rounds (TDD; commit, push, deploy, ff master, comment after each)

0. **Research, no code.** For each edition × unit type: scheme and newest ruling, from the JBTIICRework library
   (`library_search.py`, all three extracts, then the page image with `render_page.py`; fix garbled pages).
   Books: BMR (1998), BMRr (2001), CBT box set (2002), Maximum Tech (Level 3 BV1), CBT Companion, AT2 / AT2R, CT2,
   BattleTroops / ClanTroops if they print BV, FanPro errata; TM (2007), BV2.1 (2017), TM corrected (2020), BV v4.1
   (2024), TO / TO:AUE, IO / IO:AE, SO / SO:AA, CRB. Output: the `BV_RULES` field list with every modifier, each BV1
   vs BV2 difference per step, and the worked examples printed in each book (these become the tests). Also
   audit our BV2 math against v4.1 for any missing modifier.
1. **Skeleton.** Create `battle-value.ts`, fold in skill multipliers, `BV_RULES` records from Round 0,
   `getBattleValueRules`, `formatBattleValue`; every class gets `getBattleValue(edition)` (BV2 path unchanged, BV
   survey identical); every UI spot uses the formatter; roster edition picker. BV1 editions show the BV2 value until
   their unit type's round lands (flagged in the log).
2. **'Mech BV1.** Move the 'Mech calculation in, parameterize the differing steps, add BV1 equipment values.
   Tests: every BMR/BMRr worked example plus TRO BV1 figures.
   Round 1 also fixes the segment 4 BV2 gaps: #608 (B-Pod), #609 (encumbered infantry column), the `aerotech-2`
   "capital-ship" bug (segment 2), the six untested v4.1 examples, and force-level TAG / C3 / external-stores BV in
   the roster (per-edition `forceBonuses`).
3. Vehicle. 4. Fighter, small craft, capital ship (AT2/AT2R). 5. Infantry, battle armor, ProtoMech.
6. **Infantry specializations (#610).** TO:AUE advanced infantry: Combat Engineers, Marines, Mountain, Paratroops,
   SCUBA, XCT; construction plus BV (damage divisors × 1.5, unit type add-ons p.193), and settle the TM v8.0
   "Motorized: 1.0" row.

Gap rule (user, 2026-11-03): every gap found goes into this plan, or into a new bug or enhancement issue.

After each round: BV survey (`bv-survey.generator.test.ts`) shows BV2 unchanged, `npm run build:bundled` report diff
clean, then test, lint, typecheck one after another.

## Round 0 findings

### Segment 1: 'Mech BV1 (done 2026-11-03; every page below checked on the page image)

**Sources and which edition reads which.**
- `master-rules`: BMR (FASA 1707) pp.139-145, plus the FanPro BMR errata (as of 10/01/2004) p.12, which is keyed
  to BMR pages. The errata adds speed rows 0 and 1, the "(Inner Sphere 'Mechs with standard engines)" scope on the
  two CASE lines, the ÷ in the heat formula, and the vehicle "Internal Structure ÷ 2". With it, BMR = BMR(R) minus
  the Light engine and Stealth lines.
- `master-rules-revised`: BMR(R) pp.152-159 (equipment tables pp.156-158, skill table p.158). Maximum Tech
  (FanPro printing; it cites BMR pp.152-159, so it belongs to this edition) adds Level 3 BV1, pp.90-93. The
  library's two Max Tech scans print the same text.
- `classic-battletech-box-set`: its rulebook (library has the 2005 printing) has no BV system, only a "BV:" box
  on the record sheet. It reads BMR(R) (no record of its own; `getBattleValueRules` falls back).
- CBT Companion (FanPro 10975) pp.187-191 is battle armor BV1 only: segment 3.
- No other FanPro BV1 errata in the library (errata/ and errata-2025/ searched).

**BV1 'Mech formula vs our BV2, step by step.** Fractions kept to the end, then round to nearest (BMR(R) p.152).

| Step | BV1 (BMR pp.139-141, BMR(R) pp.152-154) | BV2 (TM) | `BV_RULES` field |
|---|---|---|---|
| Armor | Armor Factor × 2 | × 2.5 (× armor type) | `armorFactor` |
| Structure | IS × 1.5; × 0.75 IS XL; × 1.125 Light (BMR(R) only) and Clan XL. Same products as BV2 | same | none |
| Gyro | none | tonnage × 0.5 / 1 | `gyro: false` |
| Tonnage | **added to the defensive sum** | weight term in the offensive step | `tonnageIn: "defensive" \| "offensive"` |
| Defensive gear | AMS (+ammo), A-Pods, ECM. Active probe is **offensive** | probes defensive | `defensiveItems` list |
| Explosive ammo | −20 per **ton** (Gauss rifle = 1 ton). Clan: CT, legs, head. IS XL: anywhere. IS standard/Light: CT, legs, head, or no CASE in its location; arm: no CASE in the arm or next location inward. Floor 1 | −15 per slot, −1 per Gauss slot | `explosivePerTon: 20` |
| Heat (defensive) | −(max heat − sink capacity) × 5 when positive | none | `heatPenaltyDefensive: 5` |
| Max heat | all weapons fired + run or full jump, whichever is hotter; Ultra × 2, Streak ½, rear-firing ignored; Stealth +10 (BMR(R)) | per-weapon order | `heatRule: "bv1" \| "bv2"` |
| DMF | 1 + TMM/10 (table +0..+5). TMM from the edition's table (BMR(R) p.33: 0-2 0, 3-4 +1, 5-6 +2, 7-9 +3, 10+ +4, jumped +1 more), MASC/TSM movement counted | 1 + TMM/10, TW TMM table | `tmmTable` (edition) |
| Rear weapons | half BV; if rear total beats every other arc, front and rear swap | same idea, per location | none |
| Ammo | full BV, no excessive-ammo cap | capped at weapon BV | `ammoCap: false` |
| Targeting computer | +20% of linked weapons (rear halved, no ammo) | +25% | `targetingComputer: 0.2` |
| Artemis IV | +20% of the launcher, not its ammo | same | none |
| Offensive heat | if max heat > sink capacity: X = capacity × base ÷ max heat; Y = (base − X) ÷ 2; base = X + Y (whole base incl. ammo and TC) | per-weapon halving | `heatRule` |
| Speed MP | **Run + full Jump** (+1 MASC or TSM) | Run + ½ Jump (rounded up) | `speedJump: 1 \| 0.5` |
| Speed factor | round2(((MP − 5)/10 + 1)^1.2), table 0..25 (BMR rows from 2; errata adds 0, 1). Stealth +0.2 to the **speed factor** (BMR(R)) | same curve; stealth on DMF | `stealth: "speed" \| "defense"` |
| TSM | only the +1 MP above | ×1.5 weight | via `tonnageIn` |
| Final | Def + Off, round; then skill (BMR p.144 / BMR(R) p.158, already in `skill-multipliers.ts`) | + cockpit etc. | none |
| Force level | Arrow IV homing + TAG in the force: +200; C3 network: +35% of the unit's weapons (no ammo, defensive, artillery; rear halved) on each networked unit | C3 by force | `forceBonuses` |

"Total Heat Sinks" in the X formula is the sink capacity: the Goshawk example uses 22 for both steps, and the
Goshawk carries 11 double heat sinks [22] (TRO 3055, OCR pdf 122).

**Maximum Tech Level 3 'Mech BV1 (pp.90-92).** Hardened armor × 4 (and −1 Run MP for DMF and speed); patchwork
doubles only the hardened points; other special armor normal. Engine IS-multiplier table: Large 1.125, Clan XXL
0.75, Clan Large XL 0.75, Clan Large XXL 0.5, IS XXL 0.5, IS Large XL 0.75, IS Large XXL 0.375. HD gyro +30
defensive. Torso cockpit + CT armor (front + rear) × 2 defensive, modified Piloting for skill; compact cockpit
modified Piloting. Enhanced imaging +5% weapons (stacks with TC), −25 defensive, raised Piloting. Command console
+25 defensive and +200 per side (not with Mobile HQ). Supercharger: as MASC (+1 speed MP, DMF uses boosted MP).
VRTS +10% like a TC. Multi-Trac II: rear weapons full. Null signature +0.5 DMF and its heat. Component armor +5 per
slot. Reinforced IS × 2, composite ÷ 2. Armless 'Mech +0.1 DMF. Coolant pod +1 sink capacity. CASE II: 5 per ton.
Jump pack: MP × 5 added to final. Hand-held weapon: own BV (weapons + ammo + armor × 2) added to final. Satellite
uplink +200 per side. Special ammo: BV multiplier table (AP 6, caseless 1, LB-X cluster .75, flechette 0.5, tracer 1,
flare .05, frag 0.5, heat-seeking 1, incendiary LRM 1, semi-guided 6 with friendly TAG, smoke 1, Swarm-I 1.5).
Equipment BV1 values: BMR pp.142-144, BMR(R) pp.156-158, Max Tech p.90 (round 2 enters them per edition).

**Worked example (test for round 2).** Goshawk, BMR p.145 = BMR(R) p.159: armor 173 × 2 = 346, IS 91 × 1.125,
55 t, (30 − 22) × 5 = 40, TMM +3 → 602.3875; LPL 265 + 3 MPL 333 + TC 119.6 + 4 MG 20 + ½ t 0.5 + 2 Streak SRM-2 80 +
1 t 5 = 823.1; heat X 603.6066667, Y 109.7466667 → 713.3533334; MP 9 + 6 = 15 → 2.30 → 1,640.72667; **BV 2,243**.
The example uses armor 173; TRO 3055 prints 182, so the test builds the example's own inputs. More tests: the Max
Tech (Revised) unit BV tables, pp.94 on (BMR(R)-era 'Mech, vehicle, BA, Proto BV1).

**Open point for round 2.** The BMR errata rewords the arm line ("not protected by CASE in the next location
inward"); BMR(R) says "in its location or next location inward". Read both as "no CASE in the arm or the torso
inward" unless a Max Tech BV figure shows otherwise.

Library text fixed: Max Tech Revised pp.90-92 (Grenade Launcher 1, LB-X cluster .75; logged in
`text/_corrected_pages.md`).

### Segment 2: aero BV1 (done 2026-11-03; every page below checked on the page image)

**Sources.** AT2 (FASA 1718) pp.53-54 and AT2R (FanPro 35011) p.81 print the **same** BV1 text; only the BMR
page cites differ (AT2: BMR pp.139-45, speed table p.140; AT2R: BMR(R) p.152, speed table p.153). So
`aerotech-2` reads BMR equipment BVs and `aerotech-2-revised` reads BMR(R)'s, with one shared step record. The
capital weapon BV table (AT2 p.54 = AT2R p.82) is the same in both. The bomb BVs (HE 12, cluster 13, LG 20,
inferno 16, mines 17, Arrow IV 1/5 BMR, fuel pod 5) are in AT2 errata 1.2 (FAQ, Costs) and printed in AT2R p.82.
The errata has no other BV change. AT2 prints no worked example; AT2R pp.83-84 do (below). BV lists: AT2 p.74 on,
AT2R "Revised Battle Value Tables" p.122 on (pdf 132-138), one list per edition.

**Aero BV1 vs our BV2, step by step** (fighter = aerospace or conventional; large = DropShip, JumpShip, WarShip,
station; small craft follow "large" except where marked).

| Step | BV1 (AT2 pp.53-54 = AT2R p.81) | BV2 (ours: TM pp.302-313, SO:AA pp.148-149) | `BV_RULES` field |
|---|---|---|---|
| Armor | × 2 fighters, small craft, DropShips; × 20 JumpShips, WarShips, stations | × 2.5; capital × 25 | `armorFactor` per class |
| Structure | SI × 1.5; × 15 for JumpShip, WarShip, station | SI × 2; × 20 | `siFactor` per class |
| Fuel | **+ tons of fuel** (defensive) | none | `fuelInDefensive` |
| Defensive gear | AMS (+ ammo), ECM, screen launchers | AMS (+ capped ammo) etc. | `defensiveItems` |
| Explosive ammo (fighters only) | −20 per ton without CASE, −10 per ton with CASE | −15 per type, −1 per Gauss, IS without CASE | `explosivePerTon: 20`, `explosiveCasePerTon: 10` |
| Heat (defensive, fighters only) | −(max heat − sink capacity) × 5 | none | `heatPenaltyDefensive: 5` (shared with 'Mech) |
| Class multiplier | aerospace fighter 1.2, conventional 1.1, WarShip/DropShip/small craft 1.0, JumpShip/station 0.8 | 1.2 / 1.1 / 1.0; capital 0.75 / 0.8 / 0.7 | `classMultiplier` |
| Weapon arcs | **aft weapons full value**; no arc rule | weaker of nose/aft × 0.5; capital arc table | `arcRule: "none" \| "bv2"` |
| Ammo | capped at the weapon's BV | same | none |
| Artemis IV | + 0.2 × launcher BV (separate line, AT2R p.84) | +20% | none |
| Offensive heat | if max heat > sinks: X = sinks × base ÷ max heat; Y = (base − X) ÷ 2 fighters, **÷ 10 non-fighters**; AR10 counts 20 heat | per-weapon halving over 6 + sinks; capital per arc | `heatRule: "bv1"`, `heatYDivisor` per class |
| Bombing | **+ tonnage** (fighters only) | none (external stores left out) | `bombingTonnage` |
| Speed factor | 'Mech speed-factor table: fighters Max Thrust, large craft **Safe Thrust** | Max Thrust; JumpShip 1, station 0 | `speedThrust: "max" \| "safe"` |
| Large-vessel modifier | non-fighters: subtotal ÷ (1 + subtotal ÷ 1,000,000) | none | `largeVesselDivisor` |
| Final | round to nearest; fighters stop at Def + Off | round (× SRCS) | none |

No skill table is printed; "in much the same way as" BMR, so the BMR / BMR(R) skill table applies (already in
`skill-multipliers.ts`). JumpShips and stations have Safe Thrust 0: the speed table's row 0 exists only from the
BMR errata (see segment 1), so AT2 reads it with the errata.

**Worked examples (tests for round 2).** Both check against the AT2R lists (pdf 133 EST-O 2,519; pdf 137 Mjolnir
179,781).
- Eisensturm EST-O (AT2R p.83): armor 349 × 2 = 698, SI 9 × 1.5 = 13.5, fuel 5, −4 t × 20 = −80, heat 2 × 5 = −10 →
  626.5 × 1.2 = 751.8. Weapons 2 ML 92 + 2 Gauss 642 + 4 t 148 + 2 LL 248 = 1,130; X = 22 × 1,130 ÷ 24 = 1,035.8333,
  Y = 47.0834 → 1,082.9167 + 95 t = 1,177.9167 × 1.50 (Max Thrust 9) = 1,766.875; **BV 2,519**.
- Mjolnir (AT2R pp.83-84): armor 2,884 × 20 + SI 140 × 15 + fuel 2,376 = 62,156 × 1. Base 387,048 (incl. Artemis
  0.2 × 944 SRM + 0.2 × 2,896 LRM); X = 2,638 × 387,048 ÷ 6,576 = 155,266.5182, Y ÷ 10 = 23,178.1482 →
  178,444.6664 × 0.88 (Safe Thrust 4) = 157,031.3064; 219,187.3064 ÷ 1.21918731 = **179,781**.
  As with the Goshawk, the tests build the examples' own inputs.

**Open points for round 2.**
1. The Eisensturm subtracts 4 t × 20 for its **Gauss ammo** and nothing for the two Gauss rifles. BMR(R) does the
   reverse for 'Mechs (Gauss rifle = 1 ton, ammo not explosive). The printed list agrees with the example (2,519),
   so for aero BV1 read Gauss ammo as explosive and the rifles as not, unless the user rules otherwise.
2. The p.83 label "Vessel Modifier (WarShip = 1.2)" on a fighter is a misprint for the aerospace fighter 1.2.
3. The Mjolnir's Artemis covers 944 ÷ 59 = 16 of its 20 SRM-6s (and 16 LRM-20s). Take that as printed.

**Bug found (fix in round 1, not this research segment).** `src/data/rules-editions.ts:743-745`: `aerotech-2`
lists only `["fighter", "small-craft"]` and AT2R's comment says it "Adds JumpShips and WarShips". AT2 already has
DropShip, JumpShip and WarShip construction (contents, pdf 2) and BV (p.53), so `aerotech-2` needs
`"capital-ship"` and the AT2R comment needs correcting.

### Segment 3: vehicle, ProtoMech, infantry, battle armor BV1 (done 2026-11-03; every page below checked on the page image)

**Sources.** Vehicle: BMR pp.141-142 = BMR(R) pp.154-155 (same text; BMR prints "Internal Structure + 2", the
FanPro errata p.12 makes it ÷ 2). ProtoMech: BMR(R) pp.155-156 only (BMR has no ProtoMech BV). Infantry and battle
armor: a **fixed lookup table**, no formula: BMR p.142 (errata cuts the three infantry LRM rows) and BMR(R) p.155
(adds Sylph, Undine, Fa Shih, Fenrir, Infiltrator Mk. II, Purifier). Max Tech pp.92-93: Level 3 vehicle gear,
Level 3 infantry table (and the LRM infantry rows back as Level 3), structure BV1. CBT Companion (FanPro 10975)
pp.187-191: a battle armor BV1 **formula** citing BMR(R) pp.156-158, so it is newer than and replaces the BMR(R)
battle armor rows for `master-rules-revised` (newest wins; the BMR(R) table stays beside it as the source variant).
BattleTroops and ClanTroops print no BV. The library's BMR(R) p.155 extract was garbled; rewritten from the image
and logged.

**Vehicle BV1 vs our BV2.**

| Step | BV1 (BMR p.141 = BMR(R) p.154) | BV2 (ours, TM p.316 on) | `BV_RULES` field |
|---|---|---|---|
| Armor | Armor Factor × 1 | × 2.5 (× armor type) | `armorFactor` (shared with 'Mech: 2 / 2.5) |
| Structure | IS ÷ 2 (turret, rotor included) | × 1.5 | `structureFactor` |
| Defensive gear | AMS (+ammo), ECM | AMS etc. | `defensiveItems` |
| Explosive ammo | none | yes | `explosivePerTon: 0` |
| Type modifier | Tracked 0.8, Wheeled 0.7, Hover 0.6, Naval 0.5, VTOL 0.4 | 0.9 / 0.8 / 0.7 / 0.6 / 0.7 | `vehicleTypeModifier` table |
| DMF | 1 + TMM/10 from the 'Mech table (p.153/p.140), VTOL bonus counted | same idea, TW TMM | `tmmTable` |
| Weapons | rear ½; rear-swap rule; ammo full value; TC / C3 % of linked weapons | ammo capped | `ammoCap: false` |
| Tonnage | none | + tonnage ÷ 2 offensive | `tonnageIn: "none"` |
| Speed MP | Flank MP + VTOL MP (a VTOL counts Flank twice, see 3-1); Max Tech: + full Jump MP | Flank + ½ Jump | `speedJump: 1` |
| Final | Def + Off, round; BMR / BMR(R) skill table | same | none |

Max Tech p.92 Level 3 vehicle values: additional crew +2 each (weapon rating); bridgelayer +5 / 10 / 20 (after
DMF); bulldozer +10, minesweeper +30, coolant system +15 each (base defensive); amphibious +0.1, dune buggy or
snowmobile +0.05 **to the type modifier** (our TW chassis records give dune buggy +0.1: round 3 adds per-edition
`bvTypeModifier`); mast mount +10 (weapon rating); field HQ +100 / mobile HQ +200 once per side after the total;
trailers: each BV'd separately with the rig's MP, then summed.

**ProtoMech BV1** (BMR(R) p.156): the vehicle rules, plus tonnage added to the defensive sum, no type modifier, DMF
+0.1. Non-standard launchers from the ProtoMech Missile Weapons BV table (p.155, LRM 1-19, SRM 1/3/5, Streak 1/3/5).
Ammo = kg ÷ 1,000 × per-ton ammo BV, fractions kept. The Centaur example prints "1.2 (0.2 × 5 = 1)": obvious
misprint, the value is 1.

**Infantry BV1.** Table lookup by motive (foot / jump / motorized) × weapon (flamer, laser, MG, rifle, SRM), plain
and anti-'Mech trained columns; adjust proportionally for nonstandard size (BMR p.142 = BMR(R) p.156). Max Tech
p.93: motorized engineers 42 / 63; add-ons camo sneak suits, ECM suits, Narc (per launcher), paratroops,
submersible, TAG +1 each; heavy armor +14 (plain only); field guns + each weapon's BV (no ammo); squads = platoon ÷
squads, round up. Our `infantry-platoon.ts` `_battleValueMethods` is already keyed by edition: BV1 becomes one more
entry (a table read, not a formula). `BV_RULES` field: `scheme: "table"` plus an `infantryTable` keyed by edition.

**Battle armor BV1** (CBT Companion pp.187-191), per suit:
- Defensive: armor points without the trooper's 1 × 2 (fire resistant × 3) + 1.5, +1 with ECM; × DMF = 1 + TMM/10
  (+0..+7), TMM from the best movement (jump, enhanced movement) plus stealth (camo, basic, prototype, standard +2;
  improved, mimetic +3; both stack). Not the +1 to-hit for battle armor.
- Offensive: direct-fire weapons, + anti-'Mech (if swarm-capable: direct-fire again + claws / magnets), + missiles
  (SRM, ASRM, MRM, Corean FarShot LRM) from the BA missile table with ammo by kg, + other equipment (component table
  p.190); anti-personnel weapons only when no other offensive weapon; squad support weapon ÷ troopers. × speed
  factor of the single best movement mode (table 1-12 = the 'Mech curve; no Jump + Ground sum).
- Final: per suit, round (0.5 up), × suits (4 IS, 5 Clan). Skill: own table, Gunnery only, 0-7 → 1.80, 1.60,
  1.40, 1.20, 1.00, 0.90, 0.80, 0.70 (p.191). TAG + Arrow IV homing +200 as for 'Mechs.
- BV2 differs throughout (ours: armor × 2.5, TM BA steps); the step helpers take `armorFactor`, `trooperArmor: false`,
  `armorAdd: 1.5`, `speedRule: "best-mode"`, `perSuitRound: true`, `skillTable: "ba-gunnery"`.

**Structure BV1** (Max Tech p.93), per hex: (armor + CF + defensive gear) ÷ 2; offensive = (weapons + ammo + gear,
non-turret weapons ½) × 0.44; round per hex, sum. Only for armed or occupied buildings.

**Worked examples (tests for round 5).** Clan Elemental Point (CBT Companion pp.188-189): 10 × 2 + 1.5 = 21.5 × 1.2
(jump 3, TMM +2) = 25.80; small laser 9 + swarm 9 + SRM-2 21 + 40 kg × 3 ÷ 1,000 = 0.12 → 39.12 × 0.77 = 30.1224;
55.9224 → 56 × 5 = **280**; Elite (Gunnery 1) × 1.60 = **448**. The page prints ".077" and "30.1124": obvious
misprints (the sum 55.9224 uses 30.1224). Vehicle and ProtoMech: no worked example printed; test against the Max
Tech BV tables (pp.94 on: BA p.94, then vehicles, ProtoMechs).

**Open points for round 5.**
1. BMR(R)'s table prints the Clan standard Point (small laser) at 279; the Companion's formula gives 280. For
   `master-rules-revised` the Companion wins; the 279 stays beside it as the printed source variant.
2. The Companion's speed table stops at 12 and its DMF table at +7; above that, read the 'Mech curve and 1 + TMM/10.

### Segment 4: BV2 audit (done 2026-11-03; pages marked * checked on the page image)

**Sources, newest first.** BV v4.1 (`errata-2025/100_TechManual-Battle-Value-v4.1.pdf`, replaces TM pp.302-314;
TM errata v8.0, 2024-08-22, says so) > TM errata v8.0 (tables pp.315-319) > TM corrected printings (2020/2021) >
BV v4.0 > BV2.1 (2017) > TM 2007. TO:AUE pp.190-197 + errata v7.0 (2023), IO:AE pp.186-190 + errata v3.01 (2023),
SO:AA p.149 (Unit Type Modifiers), CRB p.220 (force adjustments) and p.222 (skill table). The TW, TO:AR, CO and
SO:AA errata change no BV.

**What changed between the BV documents** (word diff of the three extracts):
- BV2.1 → v4.0: the skill table (G0/P0 3.68 in 2007 → 2.80 in BV2.1 → 2.42 from v4.0/TM 2020). Ours is the 2.42
  table already; CRB p.222 is the same.
- v4.0 → v4.1 (vehicles only): turret weapons sit outside every arc at full BV (v4.0: "treated as facing forwards");
  rear halving works by front/rear **arc**, not by "torso-, leg- and head-mounted" weapons. Ours already does both
  (`vehicle.ts:3101-3105`).

**Checked and matching ours** (no change): Piranha 589/71 (TO:AUE v7.0); HVAC Gauss-like with one slot (TO:AUE
v7.0, Q); chaff pod and M-Pod Gauss-like; Dead-Fire per-launcher ammo BVs (IO:AE v3.01, `ammo.ts:5371, 5401`); TM
v8.0 BA rows (Magshot 15, Tsunami 6, King David 7, recoilless rifles 12/19/22, Clan ASRM-1 to 6, SRM-5 47/9/6, MRM-40
OS 45); the Clan LRM-1 to 20 table (`protomech-construction.ts:180-181`); Laser AMS 45 defensive; BA detachable
missile packs don't hide jump MP (TM v8.0 Defensive Factors footnote: "use the best modifier"); kitless foot
infantry read Anti-'Mech 8. TO:AUE pp.192-194 items (mechanical jump boosters, myomer booster, partial wing, UMU,
Blue Shield, AES, Angel ECM BA, armored components, armor/engine/structure modifier tables, CASE II, Chameleon,
chassis modifications, coolant pod, drone OS, laser insulator, null/void signature, patchwork, PPC capacitor,
shields, supercharger, turrets, vehicular jump jets, VTOL jet booster, mast mount, minefields) and IO:AE pp.186-190
(LAM, QuadVee, SRCS, superheavy, primitive/prototype, Early Clan, expanded ProtoMechs; the IS ProtoMech interface
"does not modify" BV) all have a cited BV step. v4.1 worked examples that already have a test: Delphyne-2, Ranger,
Hephaestus, Purifier, Thunderbird.

**Gaps (BV2 bugs for round 1).**
1. **B-Pod** (TM errata v8.0 p.35* item 8, 6th printing): "Treat as Gauss weapon when calculating defensive battle
   rating." Ours sets `explosiveBattleValueSlots: 0` (`equipment-misc.ts:670`), and its note in
   `data-interfaces.ts:405-409` says no book marks it. Fix: drop the 0 (1 slot, −1 where unprotected), rewrite the
   note with the v8.0 cite, then check the bundle report for B-Pod units (expect −1 per pod).
2. **Encumbering-armor infantry** (BV v4.1 p.23*: every non-mechanized platoon without a kit has Anti-'Mech 8, "which
   cannot be improved"): `infantry-platoon.ts:708` sends a non-mechanized platoon in encumbering armor down the
   "mechanized-infantry" path, so its skill multiplier reads the 5 column. It should read column 8.
3. **Force-level BV adjustments** are missing everywhere except BA's Alpha Strike C3: TAG (each ton of semi-guided
   LRM ammo in the force, half if the TAG is rear-only; v4.1 p.23*), C3 (TM: +5% of the network's total BV to each
   member; CRB p.220: +10% for two units, +5% per extra unit, cap +40%, Boosted +5% over the cap; BMR: +35% of
   weapons), external stores (added before skill). These belong in the roster work (ruling 3) as per-edition
   `BV_RULES` `forceBonuses`.
4. Six v4.1 examples have no test yet: MON-66 Mongoose 758, TDR-10SE Thunderbolt 2,008, WI-DM DemolitionMech 380,
   Grenadier squad (63 per suit, × 5.2 for four), anti-'Mech jump platoon 168, Dragau II 14,243. Add them as tests in
   round 1, built from the examples' own inputs.

Tracking: gap 1 = #608, gap 2 = #609 (bugs, fixed in round 1); gaps 3-4 are round 1 work in this plan.

Round 1 segment 1 DONE (141327116, 2026-11-03): #608, #609 and the `aerotech-2` capital-ship bug are fixed and
closed. B-Pod designs off the MUL went from 15 of 22 to 2. Three MUL values leave the pod penalty out and are
reported on #608 (newest rule wins): TDR-9Nr 1632/1635, Scarecrow UCU-F4 1472/1475, Minsk 2 (SSW) 2361/2363.

Round 1 segment 2 DONE (2026-11-03): gap 4 closed, no BV2 bug found. The jump platoon (168,
`infantry-platoon.test.ts`) and the Grenadier (326, `battle-armor.test.ts`) already had tests, so segment 4's list
was wrong about those two. New tests, built from each example's own inputs: Mongoose 758, Thunderbolt 2,008 and
DemolitionMech 380 (`battlemech.test.ts`), Dragau II 14,243 (`dropship.test.ts`, BLK text). All pass with no code
change. The MegaMek TR:3085S Dragau II (bundled at 14,591 = MUL) has 1,379 armor points and 12 t of LRM ammo per
wing; the TM example has 1,372 and 6 t, so the two are different printings, not a gap.

Round 1 segment 3 DONE (2026-11-03): the skeleton. `skill-multipliers.ts` is now `src/data/battle-value.ts` (git mv,
tables unchanged; its test is `battle-value.test.ts`). New there: `BV_RULES` (edition → unit type → `scheme`, `source`,
`pending`), `getBattleValueRules` (an unlisted edition reads the newest listed one before it: box set → BMR(R), BMM
and CRB → TW; before BMR → "none"), `getBattleValueFor` (the shared form of infantry's old `_battleValueMethods`:
runs `bv1` once a unit type's BV1 record drops `pending`, else `bv2`) and `formatBattleValue(unit, unitType,
edition)`. A pending BV1 shows "— (BV2: x)", never a BV1 figure. Every class has `getBattleValue(edition =
this._rulesEdition)`, and `getBattleValueLog(edition)` where it had a log getter (the 'Mech keeps `calcLogBV`).
Infantry's `getBattleValueEdition` is gone. Buildings get no record yet (no class has a BV). Skills in the formatter
are left to segment 4, where the UI calls show what is needed. BV2 unchanged: bundle report identical, 3823 tests.
Each unit type's round: add its BV1 method to `getBattleValueFor`'s call and drop `pending` from its records.

Round 1 segment 4a DONE (2026-11-03): UI formatter and roster edition. Skills: `formatBattleValue(battleValue,
unitType | unitType[], edition)` takes a function `(edition) => number`, so base and skill-adjusted BV share it; every
adjusted getter (`getPilotAdjustedBattleValue` / `getSkillAdjustedBattleValue(edition)`) multiplies
`getBattleValue(edition)` by the table from `getBattleValueSkillEdition(edition, unitType)`: the edition's own (or the
newest before it) once its BV1 is entered, TM's otherwise (ruling 2). So a Master Rules unit now reads the TM table
while its BV1 is pending (three tests that pinned the BMR table on a BV2 base were changed). `editionHasBattleValue`
moved here and reads `BV_RULES`; the seven `noBattleValue` edition flags are gone. Every sheet, creator summary,
status bar and roster table uses the formatter (aero sheets through `aerospaceSheetBattleValue`). Roster:
`BattleMechForce.rulesEdition` (saved only when not the default; unknown → default), picked with the #324 block's
`RulesEditionSelect`; group `getTotalBattleValue(edition)` (was `getTotaBV2`; the force's unused duplicate is gone),
`getBattleValueUnitTypes`, `getBattleValueText(edition)`; a total shows a BV1 figure only once every unit type in it
has one. Left as BV2 on purpose: the add-unit dialog and the saved-'Mech list (labelled BV2, stored values).

Segment 4b, split in three (gap 3). Research (2026-11-03; v4.1 p.23 digital text, TO:AUE p.198* and CRB p.220*
page images checked): v4.1 order is TAG, C3, external stores, then skill. TAG: each unit with TAG, Light TAG or a C3
master adds the BV of each ton of semi-guided LRM ammo in the force (the ammo BV of the right-size LRM launcher),
half if its only such item is rear-mounted. TO:AUE p.198 [Addendum] adds Arrow IV homing, Copperhead and semi-guided
mortar ammo, "multiple times if it carries multiple instances of TAG", and boosted C3 at 7% (mixed networks: each
member by its own C3 type). CRB p.220 lists C3 only: +10% to each unit of a two-unit network, +5% per extra unit,
cap +40% (8+ units), boosted +5% flat over the cap, C3i like standard; rounded normally at the end.
- 4b-1 DONE (2026-11-03): `BV_FORCE_RULES` / `getBattleValueForceRules(edition)` in `battle-value.ts` (a separate
  table, since force rules are per edition, not per unit type; `total-warfare` and `core-rulebook` records, nothing
  before TM). External stores wired: `AerospaceFighter.getPilotAdjustedBattleValue` adds each store's catalog BV x
  count before skill; base BV (MUL comparison) unchanged. CRB has no external stores rule, so none there.
- 4b-2 DONE (2026-11-03): TAG. Rulings (user): (a) take both, v4.1 and the TO:AUE addendum (extra ammo types, one
  bonus per TAG carried); (b) air-launched Arrow IV homing bombs count, each bomb at its own BV. `getBattleValueTagShare`
  in `battle-value.ts` gives `{ times, ammo }` (times = designators, x0.5 when all rear/aft; ammo via
  `getAmmoBattleValuePerTon`, so semi-guided LRM ammo takes its launcher's). 'Mech, vehicle, fighter and small craft
  have `getBattleValueTagShare(edition)`; `getPilotAdjustedBattleValue(edition, forceBonus)` adds it before skill;
  group `getTotalBattleValue(edition, force)`, the force and roster group rows pass the force's groups.
  Gap (left for later): battle armor Light TAG, ProtoMechs and capital ships take no TAG share yet (per-trooper count
  for BA is not ruled).
- 4b-3 DONE (2026-11-03): C3 networks. `BattleMechForce.c3Networks` (unit UUID → network name, saved only for units
  still in the force), `setC3Network`; a "C3 network" picker (A-H, `C3NetworkField` in `_vehicleGroupTable.tsx`) on
  'Mech and vehicle roster rows with a C3 system. `getBattleValueC3Type` / `getBattleValueC3Share` in
  `battle-value.ts`: C3 master, slave, emergency master and C3i are standard, boosted master/slave boosted. TM: each
  member adds 5% (boosted 7%) of the network's TAG-adjusted total; CRB: 10% of its own BV for two units, +5% per
  extra, cap 40%, boosted +5% flat. Group `getTotalBattleValue(edition, force, c3Networks)`; added before skill
  after TAG. A network of one adds nothing.
  Gaps (left for later): no network checks (C3i mixed with master/slave, size limits 12 / C3i 6, a master needed);
  Nova CEWS and naval C3 are not counted as networks (no BV network rule found yet); BA and ProtoMech C3 not offered.
- BV1 force rules (BMR C3 +35% of weapons, etc.) come with round 2.

Notes for round 2 ('Mech BV1): `_setPilotAdjustedBattleValue` caches with `_battleValue` (the BV2), so once 'Mech BV1
lands the cache must use the BV1 base for a BV1-edition 'Mech; the 'Mech summary note ("uses BV1, which is not
entered yet") and step 1's "Battle Value ... still follow the current rules" text must change then too.

Round 2 ('Mech BV1), split in four:
- 2-1 DONE (2026-11-03, 4dbde273d): equipment BV1. BMR pp.142-144 and BMR(R) pp.156-158 (page images checked) print
  the same figure on every shared row; BMR(R) adds Heavy Gauss, Rotary ACs, Rocket Launchers, Improved C3, iNarc and
  ATM. `IEditionStats.battleValue` / `ammoBattleValue` (ammo per ton sits on the weapon, as the book prints it) in
  144 records' `master-rules` / `master-rules-revised` stats; one-shot rows = the slash figure (always round(BV / 5));
  Artemis IV launchers x1.2 (note B). `getItemBattleValue(item, edition, field)` reads them, catalog BV2 otherwise.
  Not put in `getEquipmentForEdition`'s copy, so a BMR-built 'Mech's BV2 figure keeps BV2 values. Torpedoes take
  the missile launcher of their range, LRT = LRM, SRT = SRM, one-shot too (user ruling; 796ba1636). Hatchet/sword:
  damage formula, same as BV2. TAG/C3/CASE/MASC/TSM/Artemis/TC: notes A-E, no BV of their own.
  IS Ultra AC/10 253/29 (both books; Clan 211/26, TM 210/26) CONFIRMED, not a misprint (user asked for a sheet):
  Enforcer III ENF-6M (TRO 3060 1998 and Max Tech p.103: 1,427) and Black Watch BKW-7R (Max Tech p.101: 1,831; the
  TRO printed 1,855) work out exactly with it; 210/26 gives 1,334. Controls: Enforcer ENF-4R 895 and ENF-5D 1,039.
  Max Tech's list follows the BMR(R) formula to the point, so its BVs are good 2-2/2-3 tests.
  For 2-2: the XL structure factor REPLACES the x1.5 (IS XL: IS points x 0.75; Clan XL / Light: x 1.125, as the
  Goshawk's 91 x 1.125), and Streak heat is halved in max heat (Goshawk 30 = 10 + 12 + 4/2 + jump 6).
  Back-solve script (scratchpad, not kept): readings varied, only the printed one fits.
- 2-2 DONE (2026-11-03): `BattleMech._calcBattleValue1(edition, log?)` (BMR(R) pp.152-154 re-read from the extract;
  TMM table p.25 = TW's capped at +4, jumped +1), cached per edition in `_battleValue1`; both 'Mech records entered
  (`bv1(source, true)`). Under a BV1 edition the log shows the BV1 steps first, then BV2; the pilot-adjusted cache
  uses the edition's base. `battle-value.ts`: `getBattleValueEdition` (box set reads BMR(R)'s tables),
  `getPrintedItemBattleValue`, `getSpeedFactor` (shared with BV2). Unprinted items log their BV2 figure.
  Tests: Goshawk 2,243 (BMR, BMR(R), box set), Enforcer ENF-4R 895, Enforcer III ENF-6M 1,427 (TRO loadouts);
  a local MegaMek-file check also gives ENF-5D 1,039 and BKW-7R 1,831 = Max Tech. BV2 and the bundle unchanged.
  Taken early from 2-3: a Supercharger adds +1 speed MP like MASC (Max Tech p.91).
  Gaps (book silent, left as printed heat until a Max Tech figure says otherwise): Rotary AC and one-shot heat in
  maximum potential heat; Level 3 engines (XXL, Large) read x1.5 structure and CASE II counts as nothing until 2-3.
- 2-3 DONE (2026-11-03): Max Tech pp.90-92 (page image p.91 checked: AP x6, LB-X cluster .75 as printed). `MAX_TECH`
  (`IBattleValueLevelThree`) rides on the BMR(R) 'Mech record as `levelThree` (BMR keeps none): p.90 item table (IS/Clan,
  one-shot slash figures, Artemis V = launcher x 1.3) read by `getPrintedItemBattleValue(item, edition, field, clan)`;
  special ammo by tag pattern (`getAmmoBattleValueMultiplier`); engine table by (large) engine tag. `_calcBattleValue1`:
  reinforced x2 / composite /2, hardened x4 (patchwork per location), HD gyro +30, command console +25, component armor
  +5/slot, torso cockpit + CT armor x2, CASE II = CASE and 5/ton, coolant pod +1 capacity, null signature +0.5 DMF;
  small / torso cockpit read Piloting +1 (max 7) for skill. Max Tech's lists print no Level 3 'Mech, so the tests are
  hand-worked deltas on the ENF-6M / ENF-4R (an XXL also doubles jump heat: 1,299).
  Gaps, to be built FIRST, before 2-4 (user, 2026-11-03; "Round 2b: Level 3 content", plan then build, each item usable in the builder before its BV steps; hand-held
  weapons stay with enhancement #611): enhanced imaging (+5% weapons, -25,
  Piloting -1), VRTS (+10%), Multi-Trac II (rear full), jump pack (MP x 5 to final), armless 'Mechs (+0.1 DMF), flare
  LRM ammo (x .05). Force-level for 2-4: satellite uplink and command console +200 per side, semi-guided LRM x6 with a
  friendly TAG. Still book-silent: Rotary AC and one-shot heat in max heat.
- 2-4 DONE (2026-11-04): `master-rules` and `master-rules-revised` records in `BV_FORCE_RULES` (box set reads the
  Revised one). `homingTag`: +200 once on each unit with homing Arrow IV or a designator, once the force has both
  (BMR pp.143-144 note A; the BMR(R) p.157 note A adds the C3 master; bombs do not count, the note says "Arrow IV
  system"). `getBattleValueTagBonus` picks TM's or BV1's rule. C3 `kind: "weapons"`: 35% of `getBattleValueC3Part`
  weapons (Energy, Ballistic, Missile categories; no ammo, defensive gear, artillery; rear halved; result rounded),
  only in a complete network (master + slave, or two C3i: `isBattleValueC3Complete`). Both go on the unit's final BV,
  which skill then multiplies (Max Tech p.91: "applying skill modifiers to the final BV").
  Level 3 (`MAX_TECH`): semi-guided LRM x6 only with real TAG on the side (`tagged` ammo row, p.91 footnote; a C3 master
  does not count), worked by re-running `_calcBattleValue1` with `tagged` so heat and speed apply; command console +200
  once per side, after skill, in `BattleMechForce.getBattleValueText` only (a group row leaves it out: "does not apply
  to any particular vehicle").
  Book-silent calls (added to #621): "fighting group" reads as the force, like TAG and C3 in 4b; the +200 and 35% go
  before skill; two masters and no slave count as incomplete; the rear swap of the unit's own BV is not applied to the
  35% ("use half the BV ratings of rear-mounted weapons").
  Gaps: satellite uplink and field / mobile HQ have no catalog item, so their per-side BV waits on those items
  (#622); vehicle semi-guided x6 comes with vehicle BV1 (round 3); BA TAG +200 (CBT Companion p.190) with BA BV1.

- 3-1 DONE (2026-11-04): vehicle BV1, data and BV. `Vehicle._calcBattleValue1(edition, log?, tagged)` (BMR(R) pp.154-155;
  Max Tech pp.90-92), no cache (it reads the live vehicle); both vehicle records entered, `levelThree: MAX_TECH` on
  `master-rules-revised`. Shared with the 'Mech: `getBattleValue1Rater`, `getBattleValue1Ammo`, `isBattleValue1Defensive`;
  `getBattleValueTagShare` takes `taggedGain`, so vehicle semi-guided x6 and the 'Mech's run one path. Table:
  `BV1_VEHICLE_TYPE_MODIFIERS`; Level 3 in `MAX_TECH.vehicleItems` / `vehicleChassis` / `vehicleCrew`.
  Max Tech's "General Rules" (p.90, "all types of units") also reach vehicles: Hardened armor, supercharger and jet
  boosters, variable-range targeting, Multi-Trac II, special ammo. Its p.90 line "If a specific rule is not addressed,
  players may assume the item has no significant impact on BV" settles the other chassis modifications at 0.
  **"Flanking MP + VTOL MP" counts a VTOL's Flank MP twice**: Sprint (Laser Variant) back-solves to MP 40 and Yellow
  Jacket (Ammo) to MP 18. A plain Flank MP misses them by 172 and 525.
  Survey: Max Tech's vehicle table (scan pp.97, 99-100; 106 rows parsed; pp.96, 98 are column-split in the extract, so
  not parsed), against the nearest MegaMek design of that name and tonnage: 54 exact, 35 within 5, 15 further off, 2
  with no match. Back-solved, Rommel and Schrek fit 184 and 120 armor points against the MegaMek files' 176 and 112,
  so at least those two gaps are in the design data, not the formula; the Max Tech era sheets were not checked.
  OPEN: **VTOL Defensive Movement Factor.** The book says to include the VTOL bonus (BMR(R) p.154; p.55 gives VTOLs
  the jumping modifier) and its table runs to +5, so it is built as +1. Yet VTOL rows come out 1-4 BV above the printed
  figures. Dropping the +1 fits Ferret (both), Warrior H-8 and Yellow Jacket (Ammo) but not Ripper or Hawk Moth;
  leaving the rotor out of the structure fits Ripper and Hawk Moth but not the others. No single reading fits all, and
  the small gaps may be sheet data. On #621 for review.
  Book-silent calls (added to #621): WiGE reads as Hover (0.6); a motive not in the table reads Naval (0.5);
  Hardened armor doubles (the text's x 4 is the 'Mech's x 2 doubled); Limited Amphibious counts as amphibious +0.1;
  a jet booster takes the supercharger's +1 Speed Factor MP, as the heading names both; reinforced structure gets no
  bonus (Max Tech gives it to 'Mechs only); Support Vehicles use the same steps with no BAR adjustment; a trailer keeps
  BV2's Flank MP 1; modular armor counts as armor; robotic and drone multipliers are left out of BV1.
  Gaps: #624 (minesweeper, vehicle coolant system, additional crew and snowmobile on Combat Vehicles, trailer rig MP,
  Level 3 items not offered under BV1 editions). `bv-survey.generator.test.ts` now covers combat vehicles and takes
  `BV_SURVEY_EDITIONS` for BV1 columns.
  BV survey before and after, 6,400 units, default + `master-rules` + `master-rules-revised` columns: BV2 unchanged for
  every unit type, 'Mech BV1 unchanged; only vehicle BV1 moved (1,442 of 1,451 vehicle files). Done in 96c2c72b4.
  Left for 3-2: an e2e that shows a vehicle's BV1 in the UI (`e2e/vehicle-roster.spec.ts` passes but reads no BV1 text).

## Round 2b: Level 3 content (before 2-4; user, 2026-11-03)

Part 1 (this plan) done 2026-11-03; part 2 builds one segment per session, easiest first. Each segment ships the item
usable in the 'Mech creator FIRST (add/remove, placement, validation, weight/cost/level/era per edition, save/load,
sheet, TRO), then its BV1 + BV2 steps and import names, test first for both; a browser check (Playwright or `run`)
before done; then news, commit, push, deploy-beta, ff master, handoff + clear. No new files.

**Sources (page images checked where marked \*).** Maximum Tech Revised (FanPro 35013), printed page = pdf - 1; the
1st printing's text agrees on every figure used here. Max Tech prints no dates for any of the six.
- Max Tech p.58: a 'Mech mounts only ONE targeting and tracking system; none affects physical attacks; no weight or
  space unless noted; a targeting computer (and a C3 computer, p.59) counts as one, so none combines with them.
- p.59\*: Long-Range (S+1/M+2/L+3), Short-Range (S-1/M+2/L+5), Variable-Range (pick long/short/normal in the End
  Phase; 0.5 t, 1 head slot; a crit locks the last setting), Anti-Aircraft (-2 vs airborne, +1 vs ground), Multi-Trac
  (no secondary-target modifier, any arc, +1 outside the front arc), Multi-Trac II (as Multi-Trac without the +1;
  0.5 t, 1 head slot; a crit removes its benefits only).
- pp.60-61: EI (Clan): implants + computer; on/off in the End Phase; on: Piloting -1 (not BA), woods/smoke reduced
  (light woods any number = +1, heavy/smoke +1 per hex), no night modifier, aimed shots as a TC at +6 (+2 with a TC);
  feedback: 1 pilot damage per structure-damaging attack unless 2D6 >= 7; a Sensors crit kills EI. p.60: a 'Mech takes
  only ONE cockpit system (command console, EI, small, torso-mounted).
- pp.62-63: armless 'Mechs (Level 3; Level 2 keeps arms with shoulder + upper arm only): no armor or equipment in the
  arms, arm hits do nothing and do not transfer; most physical attacks impossible; standing up +4 Piloting.
- pp.80-81: jump pack: one per 'Mech, any weight; MP from the BMR Jump Jet Weight Table (pack tons / jet weight per MP:
  4 t = 8 MP at 10-55 t, 4 at 60-85, 2 at 90-100), capped at Walking MP; no heat; fuel for 2 full jumps (total hexes <=
  MP x 2), dropped when empty; strapped on as unprotected cargo (BMR p.77), destroyed by any rear torso hit.
- p.87\* costs: Enhanced Imaging Display cockpit 400,000 (standard 200,000); Sensors: VRTS tonnage x 10,000, Multi-Trac
  II tonnage x 5,000 (standard x 2,000); jump pack 20,000 a ton; armless: no arm actuators bought.
- p.118\* master table: jump pack Level 3, heat 0, no slot; (VRTS / Multi-Trac II are Level 3 by the book's title).
- p.91\* BV1: VRTS +10% weapons like a TC; Multi-Trac II: rear weapons at full value and in the heat; EI: Piloting -1
  for skill, +5% weapons like a TC (with a TC +25%), -25 from the base Defensive Battle Rating; flare missile ammo x .05.
  p.92: jump pack MP not counted as jump MP, add MP x 5 to the final BV; armless +0.1 DMF (not for 'Mechs only drawn
  without arms).
- BMR p.130 / BMR(R) p.141: flare LRMs are LEVEL 2 (standard LRM launchers; fired at a hex, -4 immobile, scatter on a
  miss; light the hex and 3 hexes round it from next turn for launcher size / 5 turns; no night +2 there). BMR(R)
  p.151\* and BMR p.138\*: "normal" ammo cost (the "2 x" read earlier was the Fragmentation row of a garbled extract).
- TM 2007 p.295\*: Flare (LRM) x 1 / x 1, (E-X-E), 2377 (FS), extinct 2790, back 3054 (FW); p.345\*: damage 0, IS /
  Clan, tech rating C, ref p.230 (the "2400 LC, x 2, X-X-E" read earlier was the Harpoon row); REMOVED by TM errata (v4.1 p.18, v6.0 p.35: "Remove the
  Flare LRMs and Incendiary LRMs entries"), so apocryphal from TW on, like `ammo-lrm-incendiary`.
- TO:AUE p.105: 'Mech jump pack / drop pack, Advanced, PM/BM/IM, D/C-D-C; half-ton steps to 20 t; MP per pack ton by
  unit weight (1-5 t: 10, 6-19: 5, 20-59: 2, 60-89: 1, 90-100: 0.5), x pack tons, round up, capped at Walking MP; fuel
  points per pack ton (20/16/12/8/6), 1 per Jump MP; no heat; rear torso hit destroys it (ProtoMech: rear-arc torso
  hit); combat drop use (SO pp.22-26). Cost 20,000 x pack tons (TO:AUE cost table, pdf 219). IO:AE p.29: ~2430 (TH)
  prototype, 2457 production, extinct 2840, back 3083 (CHH); Clan prototype 2839.
- IO:AE p.69: EI interface: Clan 'Mech / BA cockpit, 0 t, 0 slots, cost "see pp.178-183" (none printed); benefits ONLY
  with an implanted pilot: Piloting -1 (physical and anti-'Mech checks too), woods/jungle/smoke -1 per hex (min +1), no
  darkness modifiers, aimed shots as a TC at +2 more (-1 with a TC), same feedback / sensor rules; 1-hex active probe
  even off or unimplanted. p.190: interface BV 0. p.184: EI implants = -1 Piloting AND -1 Gunnery for the skill
  multiplier, only in a unit with the interface.
- TW era: VRTS, Multi-Trac and Anti-Aircraft live on only as design quirks (`quirk-variable-range-targeting`,
  `quirk-multi-trac`, `quirk-anti-aircraft-targeting`; CO pp.225-230, BMM pp.82-86, no BV); Multi-Trac II, the
  Max Tech EI cockpit price, armless 'Mechs and flare LRMs have no TW form. MegaMek: "EI Interface" only (no jump pack:
  a TODO; no flare LRM, VRTS, Multi-Trac II, armless).

**What exists.** `enhanced-imaging-interface` (mech-cockpit-types.ts, deferred, TW editions, IO:AE p.69, 1.5M MegaMek
cost flagged); targeting quirks in quirks.ts; `ammo-lrm-incendiary` (the edition-record pattern for a removed munition);
`allowedLocations: ["hd"]`; the command-console add-on pattern (`_commandConsole`, `canMountCommandConsole`,
`getCommandConsoleOption`, feature export/import); `getEditionJumpJetWeight` (+ `weightByTonnage`); `getBVJumpSpeed`;
`_calcBattleValue1`'s TC term, `movementFactor`, `defensiveGear`, `arc()` and `maxHeat` filters, the Level 3 skill
read (small / torso cockpit); `getAmmoBattleValueMultiplier` (MAX_TECH.ammo). Not there: any Max Tech record offered
under BMR(R) (every Level 3 item today is offered under TW only; 2-3's tests build under TW and read BV1), a jump pack,
VRTS / Multi-Trac II, armless 'Mechs, flare LRM ammo, pilot implants.

**Shared groundwork (first Level 3 segment, 2b-2).** Max Tech is Level 3 of BMR(R), no new edition tag: a record joins
with `editions` + `editionLevels: { "master-rules-revised": 3 }` + `editionStats["master-rules-revised"]` (book
"MaxTech", page, weight/cost/notes). Check that `getRecordOfferIssue` offers it at Advanced (3) and hides it below.
The wider gap (the other Max Tech items; ProtoMech jump pack; BA EI implants) is enhancement #612, not this round.

**Rulings (user, 2026-11-03): R1 cockpit alone under BMR(R), implants under TW; R2 no cargo MP penalty; R3 BV2
ignores the pack, logged as book-silent; R4 no arm structure, AND the sheet drops the arms entirely (no boxes, no
outline), on tripods as well (armless is offered for tripod chassis too; tripods exist from TW on, where armless is
apocryphal, so an armless tripod is built at the Apocryphal level). R5, R6: the proposals below, accepted by the user.** The questions as asked:
- R1 EI under Max Tech: does the EI cockpit alone earn the benefits and BV1 steps, or only with an implanted pilot (as
  IO:AE)? Proposed: BMR(R) Level 3 = the cockpit system alone (Max Tech prices and values the 'Mech's system; p.61
  lists the benefits "when the EI system is on"); TW = interface + pilot implants (IO:AE pp.69, 184).
- R2 jump pack weight and cargo penalty: external cargo, so not part of the design tonnage (any weight up to the
  'Mech's tonnage, BMR(R) p.77; TO:AUE max 20 t). Does the cargo MP penalty (-3 Walk or half, over a quarter half)
  apply? Proposed: no (the pack's own rules replace the cargo hit rule and cap MP at Walk; "most of" the cargo rules).
- R3 jump pack BV2: no source (TO:AUE, BV v4.0/v4.1, IO:AE, MegaMek silent). Proposed: BV2 ignores the pack (not an
  installed component), logged as book-silent; BV1 takes Max Tech's MP x 5.
- R4 armless arm structure: Max Tech says the arms are "technically not present". Proposed: no arm structure points
  (not on the sheet, not in BV1 structure); structure weight still by the tonnage table (Max Tech changes none).
- R5 VRTS / Multi-Trac II dates: none printed. Proposed: no dates (offered by edition + level alone, like the edition's
  other undated records), apocryphal from TW on (dropped; the quirks replace VRTS and Multi-Trac).
- R6 Proposed: the same picker also lists Long-Range, Short-Range, Anti-Aircraft and Multi-Trac (0 t, 0 slots, no BV,
  p.59), since "one system only" needs the whole list; 4 more rows in one table.

**Segments.**
- 2b-1 Flare LRM ammo (Level 2 in BMR/BMR(R); apocryphal TW). DONE ff98ebac0. Bugs found after it: BUG 1 (Level 1 /
  Introductory offered Level 2 gear, in BMR, BMR(R) and TW) DONE d75038f83; parts grading follow-up #613; BUG 2 (TW
  add dialog lists no LRM ammo for a mounted LRM 5 until "Show all ammunition") open, see handoff.
  Builder: `ammo-lrm-flare` beside `ammo-lrm-incendiary` (same shape; editions master-rules, master-rules-revised,
  total-warfare with `apocryphalIn` per TM errata v4.1 p.18; editionStats BMR p.130 / BMR(R) p.141 + price p.151 x 2,
  TM 2007 p.230/p.295 2400 LC). Standard LRM launchers only, full tons (BMR(R) p.141); sheet ammo line "LRM Flare";
  play: no damage, illumination note (the roster has no night/lighting model: say so in the sheet note, no new rule).
  BV1: MAX_TECH.ammo `[/-lrm-flare$/, 0.05]` (Level 3 only; BMR keeps x 1). BV2: standard LRM ammo BV (TM 2007 prints
  no change; apocryphal in TW). Import: none (MegaMek has no flare LRM).
  Tests: catalog "offers flare LRM ammo under BMR and BMR(R), apocryphal under TW"; cost "prices flare LRM ammo at 2 x
  standard (BMR(R) p.151)"; BV "multiplies flare LRM ammo BV by .05 under BMR(R) Level 3 (Max Tech p.91), x 1 under BMR".
  DONE 2026-11-03: `ammo-lrm-flare` (editionLevels 2 in both, apocryphalIn TW/BMM/CRB citing TM errata v4.1 p.18;
  price "normal" = 30,000 in BMR p.138, BMR(R) p.151 and TM 2007 p.295, so the cost test checks x 1, not x 2); MAX_TECH
  ammo `/-lrm-flare$/` x .05 (ENF-4R + LRM 5: 913 standard, 906 flare under BMR(R); equal under BMR); e2e "offers flare
  LRM ammo by edition and rules level". Gaps logged: (a) every other BMR / BMR(R) Level 2 record is ungraded (no
  `editionLevels`), so BMR Introductory offers Level 2 gear; flare is the only graded one. (b) Under TW, the add dialog
  listed no LRM ammo for a mounted LRM 5 until "Show all ammunition" was ticked (seen in the e2e run, not chased).
- 2b-2 Targeting and tracking systems: VRTS + Multi-Trac II (+ R6's four), plus the shared groundwork.
  Builder: equipment records in equipment-misc.ts (VRTS / Multi-Trac II: 0.5 t, 1 slot, `allowedLocations: ["hd"]`;
  the others 0 t, 0 slots), BMR(R) Level 3 only, apocryphal TW. One-per-'Mech and not with a TC or C3 (Max Tech
  pp.58-59): extend the existing exclusivity check (find the TC/C3 one, no new mechanism), violation cites p.58. Cost:
  sensors upgrade = tonnage x 8,000 (VRTS) / x 3,000 (Multi-Trac II) over the standard x 2,000 (p.87), as a
  variable-equipment.ts formula. Sheet: head slot + a range-mode box for VRTS; TRO line. Play: VRTS mode picker in the
  roster (End Phase, long/short/normal; range modifiers p.59), Multi-Trac rules as notes where the roster has no
  multi-target model. Under TW the record is apocryphal; MTF/SSW import of the quirks unchanged.
  BV1: TC term `computerBV` grows a factor: TC 0.2 + VRTS 0.1 (+ EI 0.05 in 2b-3), same weapon set; Multi-Trac II:
  `arc()` returns 1 for rear weapons and `maxHeat` stops filtering rear weapons. BV2: none (0 BV; quirks carry no BV).
  Tests: "offers VRTS and Multi-Trac II under BMR(R) Advanced only, head only"; "flags two targeting systems, or one
  with a targeting computer (Max Tech p.58)"; "prices VRTS sensors at tonnage x 10,000 (p.87)"; BV "adds 10% of the
  weapons for VRTS (ENF-6M hand-worked)"; "counts rear weapons whole for Multi-Trac II (hand-worked rear-laser 'Mech)".
  DONE 2026-11-03: six records in equipment-misc.ts (`targeting-long-range`, `-short-range`, `-variable-range`,
  `-anti-aircraft`, `-multi-trac`, `-multi-trac-ii`; editions BMR(R), editionLevels 3, apocryphalIn TW/BMM/CRB, no
  dates per R5, universal tech base), `maxPerUnit` 1 in group "targeting-system" (add dialog blocks a second one) +
  `_systemConflictViolations` vs TC / C3 citing Max Tech p.58. Cost: variable formulas `variable-range-targeting` /
  `multi-trac-ii` carry the sensors difference (t x 8,000 / x 3,000). New `targetingSystem` field (ranges, airborne,
  offFrontArc, variableRange) read by `getTargetToHitFromWeapon` via `BattleMech.getTargetingSystem()`; saved
  `targetingRangeSetting` + a picker in the roster Target dialog; Airborne box shown for anti-aircraft too. BV1: TC
  share + 0.1 VRTS; Multi-Trac II counts rear weapons whole and in max heat (ENF-6M + VRTS 1,510; + rear ML 1,471 ->
  1,447 with MT II). Fixed on the way: front-arc secondary target labelled "In Rear Arc (+1)"; dialog said -1 / -2.
  Gaps (not built, logged here): VRTS / Multi-Trac II critical-hit effects in play (lock setting / lose benefits) are
  not modelled; the record sheet has no VRTS setting box (the head slot shows); a primary target in a side arc cannot
  be marked (the model has front / rear only), so Multi-Trac's +1 reads the rear-arc flag.
- 2b-3 Enhanced imaging (after R1).
  Builder: make `enhanced-imaging-interface` implemented as a cockpit add-on like the command console (`_enhancedImaging`
  flag, `getEnhancedImagingOption`, feature `enhanced_imaging`), Clan tech base only. Editions: BMR(R) Level 3
  (editionStats MaxTech p.87: cockpit 400,000, i.e. +200,000; one cockpit system only, p.60: not with small, torso or
  command console) and TW (IO:AE p.69, any Clan cockpit, cost as now, flagged). Pilot: `IPilot.eiImplants` (Pilot class
  + roster pilot editor + save/load), only meaningful with the interface. Sheet: "EI" cockpit note, on/off box and
  feedback reminder; TRO line. Play (roster): EI on/off in the End Phase; Piloting -1; woods/smoke/darkness to-hit; aimed
  shot modifiers; feedback roll prompt on structure damage; sensors crit disables. 1-hex active probe (IO:AE) noted.
  BV1: skill reads Piloting -1 (beside the small/torso cockpit read), `computerBV` factor +0.05, `defensiveGear` -25.
  BV2: interface 0; implants -1 Piloting and -1 Gunnery for skill (IO:AE p.184), in `_setPilotAdjustedBattleValue`.
  Import: MTF/SSW "EI Interface" / "Enhanced Imaging Interface" (MegaMek lookup names) to the flag.
  Tests: "offers the EI cockpit to Clan 'Mechs under BMR(R) Level 3 and TW, not with small/torso/console under BMR(R)";
  "prices the EI display at 400,000 under BMR(R)"; BV1 "EI: -25 defensive, +5% weapons, Piloting -1 (hand-worked)";
  BV2 "EI implants read 1 better Gunnery and Piloting only with the interface (IO:AE p.184)"; import "reads EI Interface".
  Split in two (smaller chunks): 2b-3a builder + BV1 + import, 2b-3b pilot implants + BV2 + play + sheet.
  2b-3a DONE 2026-11-03: `enhanced-imaging-interface` implemented (editions + BMR(R), editionLevels 3, introducedInEdition
  BMR(R), editionStats MaxTech p.60 "Enhanced Imaging" cbills 200,000; altNames "EI Interface" / "EIInterface").
  `_enhancedImaging` + `canMountEnhancedImaging` (clan / mclan; under an earlier edition only a standard cockpit without
  a console) / `getEnhancedImagingOption` / `hasEnhancedImaging` / `setEnhancedImaging`; `_cockpitAddOnOption` now shared
  with the console (its redundant level check dropped). Feature `enhanced_imaging`; cost line, both TRO listings,
  edition-issue check, required level. Step 2 checkbox sits OUTSIDE the cockpit `EditionChoice` (hidden under BMR(R),
  one cockpit option). MTF `nocrit:EIInterface` -> SSW-shaped `enhancedimaging="TRUE"` (our attribute, not Skunk Werks').
  BV1: computer share +0.05, defensive -25, `_getBattleValuePiloting(edition)` (small/torso +1, EI -1), now also used by
  `getPilotAdjustedBattleValue(edition, bonus)`, which ignored the cockpit read before. Goshawk + EI 2,270 / 4/5 -> 2,384.
  Fixed on the way: `getRequiredRulesLevel` returned 0 for every pre-TW edition; BMR / BMR(R) are graded since BUG 1, so
  only the box sets return 0, and a record's `editionLevels` for the design's edition wins (BMR(R) VRTS design = 3).
  e2e "offers Enhanced Imaging to Clan 'Mechs under BMR(R) Advanced" (Chromium) passes.
  2b-3b split again (smaller chunks): 2b-3b implants + BV2, 2b-3c play + sheet.
  2b-3b DONE 2026-11-03: `IPilot.eiImplants` (optional, old saves load false; Pilot import/export), `setPilotEIImplants`,
  roster pilot-editor box (shown when the 'Mech has EI or the pilot already has implants). `_getBattleValuePiloting` is
  now `_getBattleValueSkills(edition)` -> [gunnery, piloting]: non-Level-3 editions read both 1 better with implants AND
  the interface (IO:AE p.184, text checked; floor 0); BMR(R) Level 3 keeps the cockpit read (Max Tech has no implants).
  Test in the Goshawk BV1 test; e2e "EI implants raise the roster's adjusted BV under TW" passes. Bug #614: the unit
  search "Search Rules" filter (mul-search-filters.tsx) offers no Experimental option (shown only under "All").
  Implants are on the shared Pilot class but only 'Mechs read them (vehicles / fighters have no EI interface; BA / Proto
  EI implants are #612).
  2b-3c split in three (smaller chunks): 2b-3c1 switch + Piloting + feedback, 2b-3c2 to-hit, 2b-3c3 sheet.
  2b-3c1 DONE 2026-11-03: `BattleMech.enhancedImagingOff` (saved only when true) + `isEnhancedImagingActive()`: mounted,
  switched on, no sensor hit, and under TW a pilot with implants (IO:AE p.69; Max Tech p.62 reads the interface alone).
  `getPilotingSkillModifier` -1 while active. `takeDamage` returns a feedback line (criticalEffects) whenever internal
  structure is damaged while active (Max Tech: 7+ or 1 pilot damage; IO:AE adds the consciousness roll); the play
  damage log prints result lines. Roster Target dialog: "Enhanced Imaging on (set in the End Phase)" box beside the
  VRTS setting, Cancel restores it, TW text notes the 1-hex active probe (on or off, sensors unhit). Unit test in
  battlemech-command-console.test.ts; the "EI implants" e2e now also flips the switch in play. Gap found: bug #615,
  `sensorHits()` counts head slots only, so a torso-mounted cockpit's sensor hits (and EI's shut-down) are missed.
  2b-3c2 LEFT (to-hit): 'Mech play has NO terrain or aimed-shot inputs today (the Target dialog takes one "other
  modifiers" number; no TC aimed shots either). Add per-target woods / jungle / smoke hex counts (light, heavy) and a
  darkness modifier to `ITargetToHit`, read in `getTargetToHitFromWeapon` (utils.ts) beside the heat line; EI active:
  TW -1 per hex, min +1 per hex, darkness ignored (IO:AE p.69); Max Tech: any light woods +1 total, heavy / smoke +1 per
  hex, night ignored (p.62). Aimed shots: TC (TW p.143) plus EI: TW +2 more, -1 instead with a TC (IO:AE p.69); Max
  Tech +6 alone, +2 with a TC (p.62). Cite the base terrain / darkness values per edition from the books.
  Also (gap found in #615): 'Mech play adds NO sensor-hit to-hit modifier today. TW p.128: one hit +2 (cite per
  edition). Torso-Mounted Cockpit (TO:AUE p.113): +2 first hit, +4 second; both in the head also +4 to physical
  attacks and Piloting; third hit no weapon attacks and +4 Piloting. #615 DONE: `sensorHits()` reads head + CT,
  `areSensorsDestroyed()` at 3 for the torso cockpit, sheet shows a third Sensor Hits box.
  2b-3c2 split in two (smaller chunks): 2b-3c2a sensors + terrain + darkness, 2b-3c2b aimed shots.
  2b-3c2a DONE 2026-11-03: `ITargetToHit.lightWoodsHexes` / `heavyWoodsHexes` / `darkness` (optional, old saves 0),
  read in `getTargetToHitFromWeapon` through the shared `systemModifier` (now also used for fire control and heat, and
  it skips a 0): woods / jungle / smoke +1 light, +2 heavy a hex in every edition (BD p.10; TW p.117); EI active: TW
  1 less a hex, at least +1, darkness ignored (IO:AE p.69, text checked); Max Tech any light +1 in all, heavy +1 a
  hex, night ignored (p.62, OCR checked). Darkness is the scenario's number (TO:AR / Max Tech tables not entered).
  `getSensorToHitModifier()`: +2 at the first hit (BD p.18; TW p.117), +4 at a torso cockpit's second (TO:AUE p.113),
  0 once sensors are out; `sensorHits(locations)`; `getPilotingSkillModifier` +4 for a blind torso cockpit (3 hits, or
  2 both in the head). Target dialog: shared `updateTargetNumber` (replaced `updateTargetOtherMods`) and
  `renderTargetTerrain` inputs per target. Tests: torso-cockpit + EI to-hit unit tests; the "EI implants" e2e sets
  heavy woods. Gap (not modelled, no physical-attack to-hit in play): torso cockpit both-head +4 to physical attacks.
  2b-3c2b DONE 2026-11-03: `ITargetToHit.immobile` / `aimedLocation`; `IEditionPlayRules.immobileTargetModifier`
  (BD 0: no immobile rule, no aimed shots; else -4). `getTargetToHitFromWeapon`: immobile -4, aimed at it any weapon but
  missile / LB-X cluster / HAG, the head +3 in place of -4 (TW p.110, image checked; BMR(R) pp.24-26). BUG FIXED on the
  way: play never applied the TC -1 (now for `isTargetingComputerWeapon`, lost by LB-X cluster). Aimed at an active
  target: TC +3 in place of -1, never the head or a pulse weapon (TW p.143; BMR(R) p.148: a miss misses entirely, in
  the select's title); EI alone TW +5, Max Tech +6; both +2 (IO:AE p.69; Max Tech p.61, image checked: printed p.61 =
  pdf 62, so the old "p.62" EI cites were corrected). Target dialog: `renderTargetConditions` (was
  `renderTargetTerrain`) adds the Immobile box and Aimed Shot select; `updateTargetFlag` (was `updateTargetAirborne`).
  Test in battlemech-command-console.test.ts; "EI implants" e2e aims and ticks Immobile. Gaps (not modelled): rapid-fire
  weapons firing more than one shot cannot aim (shots fired are not tracked); BTC / BTC:RoW TC-aimed hit rules not read;
  the aimed location is per target, not per weapon.
  2b-3c3 DONE 2026-11-03: Warrior Data box (battlemech-svg.tsx), left of Piloting / Gunnery: "EI", an On box and the
  feedback reminder, shown with the interface mounted. Blank on paper; in play marked while `isEnhancedImagingActive()`
  (the switch stays in the Target dialog). `getEnhancedImagingFeedback()` is the one wording for the sheet and the
  `takeDamage` line. Tests in armored-components-record-sheet.test.tsx; "EI implants" e2e checks the sheet in play.
  2b-3 is complete.
- 2b-4 Armless 'Mechs (after R4).
  Builder: `_armless` flag on biped AND tripod 'Mechs (R4; not quad / LAM / QuadVee), BMR(R) Level 3 (TW: apocryphal,
  so tripods reach it at the Apocryphal level), chassis step option; arms take no armor, no structure, no slots, no
  actuators; arm equipment refused with a p.62 violation; cost drops the arm actuators (p.87); save as feature
  `armless`. Sheet (biped and tripod layouts): arms removed entirely, no armor/structure boxes, no outline, no crit
  blocks; TRO "Armless".
  Play: arm hits do nothing (no transfer); punches / clubs / arm weapons gone; stand-up +4 Piloting (p.63).
  BV1: `movementFactor` +0.1 (p.92); structure per R4. BV2: none (no TW rule; BV2 of an armless design reads it as
  built). Import: none.
  Tests: "armless biped and tripod: no arm armor, structure, slots or actuator cost"; sheet "draws no arms when armless"; "refuses arm equipment (Max Tech p.62)"; BV "adds 0.1 to
  the DMF (Max Tech p.92)"; save/load round trip.
  2b-4a DONE 2026-11-03 (aa693b338): `armlessMechOption` record (mech-type-options.ts), `canBeArmless()`,
  `getArmlessOption()`, `isArmless()`, `setArmless()`; step 1 checkbox (`data-testid="armless"`); structure, armor, slots,
  actuators, cost, patchwork, quirk targets, spread items (slot count as with arms), arm-equipment violation, move refusal,
  required level (3; Apocryphal under TW), BV1 +0.1 DMF, TRO line, save feature `armless`. One arm actuator loop now serves
  biped, LAM and tripod. Tests in battlemech-rules-edition.test.ts; e2e "offers armless 'Mechs".
  2b-4b DONE 2026-11-03 (03a4d214f), 2b-4 complete: sheet (`ArmlessClip` in biped-armor-diagram.tsx cuts the arms from the
  armor, structure and transfer outlines, tripods pass it through; arm labels and crit blocks gone; note from
  `armlessMechOption.notes`), play (`_isArmlessArm()`: `takeDamage` and `rollCriticalHit` return `ARMLESS_HIT`, no damage, no
  transfer; no arm tables in the critical dialog). Tests in battlemech-rules-edition.test.ts and
  armored-components-record-sheet.test.tsx; e2e "plays an armless 'Mech".
  Bug #616 fixed and closed in the same commit: arm actuators upper 100, lower 50, hand 80, no shoulder, only mounted ones.
  Index rebuilt, cost only, 3548 designs fell. 7 of 34 printed costs match exactly, none did before; the other 27 differ
  for other reasons, not yet looked at.
  Gaps: Level 2 armless (p.62), FrankenMech arm donors and the flag surviving a quad round trip are enhancement #617.
  The roster has no physical attack or stand-up step, so those rules are the sheet note only (as with flare LRMs). The
  aimed-shot list still offers arms: its target is not tied to a unit, so it cannot know.
  Timeouts: full unit runs drop a few tests at the 5s and 30s limits, a different set each run (Ares superheavy tripods,
  Dire Wolf SSW, Skunk Werks roster, online listeners). Ares takes 1s alone and the others pass alone: load, not logic.
- 2b-5 Jump pack (after R2, R3). Two sessions, like 2b-4: 2b-5a data, builder, cost, BV1, save, TRO; 2b-5b sheet, play, e2e.
  Builder: movement step "Jump pack (tons)", 0 = none, one per 'Mech; record in mech-jump-jet-types.ts with editions
  BMR(R) Level 3 (MaxTech pp.80-81, MP = tons / `getEditionJumpJetWeight(standard, edition, tonnage)`, 20,000 a ton)
  and TW Advanced (TO:AUE p.105 table, half-ton steps, max 20 t, MP round up, fuel points; IO:AE p.29 dates); MP capped
  at Walking MP; no slots; weight per R2. Save/load `jumpPackTons`. Sheet: Jumping MP shown as the pack's MP with a
  "Jump pack: N t, fuel X" line (Max Tech: hexes = MP x 2; TO:AUE: fuel points); TRO line. Play: fuel tracking, no
  heat, dropped when empty, destroyed by a rear torso hit.
  BV1: `getBVJumpSpeed` leaves the pack out; final BV + pack MP x 5 (p.92). BV2 per R3. Import: none (MegaMek TODO).
  Tests: "gives a 4-ton pack 8 / 4 / 2 MP by weight class under BMR(R) (Max Tech p.81)"; "TO:AUE: 6 t on 55 t, Walk 6
  = 6 MP, 72 fuel (TO:AUE p.105)"; "caps pack MP at Walking MP"; BV1 "adds pack MP x 5 to the final BV, no jump in the
  speed factor"; cost "20,000 a ton".
  2b-5a DONE 2026-11-04: `mechJumpPack` record (mech-jump-jet-types.ts; kept out of `mechJumpJetTypes` so it is not a jet
  type), `packByTonnage` / `maxPackTons` on IJumpJet; `canCarryJumpPack()`, `getJumpPackOption()`, `getMaxJumpPackTons()`,
  `get/setJumpPackTons()`, `getJumpPackMP(edition)`, `getJumpPackFuel()`; step 2 select (`data-testid="jump-pack-tons"`);
  cost, BV1 (final + MP x 5), required level, edition issue, TRO row, save `jumpPackTons`. Tests in
  battlemech-rules-edition.test.ts; e2e "offers a jump pack". Page images read: Max Tech pp.80, 81, 86, 92, 118.
  Found while reading the sources (not in the entry above):
  - Slots: Max Tech pp.85-86 print Crit. 4* ("see special rules"), both printings; the entry (pp.80-81) gives none, cargo
    takes none (BMR(R) p.77), the p.118 master table prints a dash, TO:AUE says not installed. Built with no slots; the
    printed 4* is in the record's notes. User ruling 2026-11-04: no slots is correct. Other calls await review in #621.
  - LAMs may not carry one: IO:AE p.108. Applied from TW on; earlier editions are silent, so BMR(R) LAMs may.
  - Clan dates: IO:AE gives Clan prototype 2839, "Ret: 3083 (CHH)", so `clanDates` is 2839 / 3083. The shared Star League
    carry-over still offers it to Clan designs before 3083.
  - Book-silent calls: BMR(R) drops part of a jet's weight (1.5 t at 60 t = 1 MP; TO:AUE rounds up); half-ton steps under
    BMR(R) too; priced with the equipment, so the tonnage multiplier applies (Max Tech p.87 sends prices through BMR
    pp.136-138); a pack is allowed beside jump jets (both books only describe ground-bound 'Mechs).
  2b-5b must also cover: dropping cargo costs 1 MP (BMR(R) pp.77-78); TO:AUE jettison on empty or destroyed; a combat drop
  burns all fuel (TO:AUE p.105); a pack beside jets on the sheet; whether TO:AUE's "jump boosters (mechanical or otherwise)"
  bars a pack with partial wings (p.104).
  2b-5b DONE 2026-11-04: play state `jumpPackJumping`, `jumpPackFuelUsed`, `jumpPackLost` (saved, left out of a design
  export); `getJumpPackSpeed()` (play MP: jump modifiers, capped by fuel), `getJumpPackFuelLeft()`, `getJumpPackFuelText()`,
  `dropJumpPack()`, `getJumpingText()`, `getJumpPackNote()`. Pack jumps make no heat; fuel is spent in `turnReset` (the move
  can be reset until then), one per Jump MP or hex; an empty pack drops. A rear torso hit destroys it (not an ammo
  explosion). Sheet: Jumping MP and a two-line note (`jump-pack-note`). Set Movement dialog: use-pack box (locked on with
  no jets), Drop the pack (1 MP). The dialog now also reloads the turn's Jumping MP on reopening (it reset to 0).
  Page images read: Max Tech pp.80-81, TO:AUE p.105; text read: BMR(R) pp.77-78, TW p.261.
  Calls: a jump of 1-2 hexes left at 0 MP spends no fuel; the player enters the MP. Combat drop: sheet note only, as the
  roster has no drop step (the Drop button covers the jettison). TW's dumped-cargo roll (p.261) is not modelled: a dropped
  pack is gone for the game. Partial wings: TO:AUE p.104 bars "jump boosters (mechanical or otherwise)"; a pack is not
  named, so it stays allowed, and the wing bonus applies to pack MP like jets. Jets and pack cannot both be used in a
  turn (one box); no book says so for packs. TW p.261 bars jumping with cargo and adds MP penalties: the pack is the
  stated exception to the first, and ruling R2 waives the second.
  USER RULINGS 2026-11-04 (#621) replace the calls above: a pack is only for a 'Mech without integrated jump jets
  (TO:AUE p.105), every edition, so never beside jets, on a LAM or with partial wings. `canCarryJumpPack()` holds the
  bar; the `jumpPackJumping` flag and use-pack box are gone, as a jump on a pack-carrier is always a pack jump.

**Rulings (user, 2026-11-03).**
1. **Mechanized infantry skill column: ours stands (5 column).** v4.1 p.12* (= TM p.309) says Anti-'Mech is "fixed at
   8" for mechanized and kitless units; v4.1 p.23* (= TM p.315) says mechanized infantry "use the 5 column". The
   user asked for the likelier intent. The 2007 first printing had only "mechanized infantry can only adjust their
   Gunnery Skill Rating". p.23 keeps that rule in the Skill Ratings section and gives the 8 only to non-mechanized
   kitless units in a separate paragraph; p.12 is a one-line reminder that lumps the two together. Record p.12 as
   the conflicting text in the edition record's notes.
2. **"Motorized: 1.0"** (TM errata v8.0, 8th printing, Unit Type Modifiers Table p.316): left for the infantry
   specialization build-out (#610, round 6 below). TO:AUE p.191 multiplies advanced infantry by that table, whose
   addendum (p.193) gives infantry only add-ons (Combat Engineers +0.1, Marines +0.3, Mountain +0.2, Paratroops
   +0.1, SCUBA +0.1, XCT +0.1), so the row likely gives infantry a 1.0 base; the user suggests it may mean mechanized.
3. Gear we don't build yet (no BV step to miss): 'Mech handheld weapons (TO:AUE p.193), thermobaric weapons,
   prosthetic limbs (IO:AE p.186): enhancement #611.

## Left to the builder

- Exact `BV_RULES` field names (after Round 0).
- Whether a step that no book varies stays inline (yes: only a step that differs gets a record field).
