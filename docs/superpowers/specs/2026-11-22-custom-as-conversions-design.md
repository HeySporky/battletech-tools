# Alpha Strike for Every Custom and Munchkin Record (#647): Design

Status: APPROVED by NGCFells 2026-11-22 (designed on Opus 5.5), including the inferred-level ruling below. Issue #647.

## The rule this enforces

Every record at Custom Homebrew (6) or Munchkin (7), and every canon record still marked "Unresolved: Alpha Strike conversion not yet looked up", ends up with one of two things:

- **A conversion:** special codes, damage, or an Alpha Strike munition. Our conversions carry an "Ours (NGCFells, 2026-11-22, #647): ..." note that names the nearest canon special and credits the item's author.
- **A stated reason, from a fixed list** (`alphaStrike.noConversion`):

| Reason key | Meaning | Used for |
|---|---|---|
| `standard-ammunition` | Standard rounds; the weapon's own block carries the damage | Standard ammo of custom weapons |
| `feeds-special` | It supplies another item's special and has no code of its own | Smoker fuel; NPC charges |
| `carried-by-linked-weapons` | The weapons it links carry the damage | Small and Medium Laser Arrays |
| `carried-by-weapon` | The weapon's block already carries the effect | LB 15-X cluster (the weapon's Flak) |
| `explosive-component-only` | The Companion counts it only as an explosive component (ASC, ENE) | M-Pod, B-Pod |
| `no-alpha-strike-rule` | No Alpha Strike rule covers what it does | Magnetic grapples (hull walking), Vehicular Grenade Launcher (fragmentation vs conventional infantry only) |
| `no-alpha-strike-munition` | ASCE Alternate Munitions (pp.142-146) has no such round and the canon equivalent has none either | Caseless, MG AP/incendiary/tracer, flamer acid, Narc-capable |

The note "Custom equipment: no Alpha Strike conversion" (or "effect") is removed everywhere.

**Rules level (NGCFells, 2026-11-22).** There are two cases:
- **Custom Homebrew and Munchkin items:** our codes are `ESpecialAbilityType.Custom`. They show only at levels 6-7 (`allowsAlphaStrikeAbilityCode`) and put any card that carries them at level 6.
- **Canon and Apocryphal items that no book converts:** the conversion stays at the item's own level. Its block carries `alphaStrike.inferred: true` and a note `Inferred (NGCFells, 2026-11-22, #647): no book converts it; extrapolated from <canon basis>`. An inferred block's codes are not gated, and they do not raise the card's level.

This covers the CRB plasma rifles, the Hailstorm (HAIL at Apocryphal 5) and the canon Chaff Pod. The Chaff Pod's CHF1 moves from level 6 to its own level 4, with an inferred note. Book values (the Companion, its errata, ASCE) need no inferred note.

## Canon lookups (book values, all levels)

| Record | Alpha Strike | Source |
|---|---|---|
| BattleMech Taser | heat 6, 0.1 short, `MTAS1` (summed per unit) | ASC errata v1.6 (insert under Direct-Fire Ballistic); ASCE p.90 |
| MRM 10/20/30/40 + Apollo | 0.6/0.6, 1.2/1.2, 1.8/1.8, 2.4/2.4 (S/M) | ASC MRM table, right of the slash (the book misprints "24" for 2.4) |
| Coolant Pod | −1 heat dissipation per pod in the Alpha Strike heat sum | ASC heat table ("Coolant Pod −1**") |
| Recon Camera | `RCN` | ASC RCN conversion |
| Light / Heavy Plasma Rifle (CRB) | 0.4/0.4/0.4 heat 4; 1.2/1.2/0 heat 12; both "Heat" (HT). **Inferred**, at their canon level | No book converts them. Extrapolated by the ASC's damage procedure (expected damage ÷ 10 by bracket), as derived-alpha-strike.ts does; "Heat" follows the ASC Plasma Rifle row |
| Chaff Pod (TO:AUE, level 4) | `CHF1`, **inferred**, now at level 4 (was gated to 6-7) | No book converts it. Extrapolated as the CHF# cloud (#642). The Chaff Pod 2.0 (custom) keeps CHF4 at levels 6-7. |
| M-Pod, B-Pod | `explosive-component-only` | ASC ENE list |
| Vehicular Grenade Launcher | `no-alpha-strike-rule` | ASC and ASCE are silent |

**Alpha Strike play for MTAS (canon, ASCE p.90):** on a Taser hit, roll 2D6: −2 against a BattleMech, +2 against battle armor. On 8+ the target shuts down for 1 turn; otherwise it takes interference, +1 to its attack and Control rolls for 1 turn. Conventional infantry, DropShips, LG, VLG, SLG and ABA units are immune. The effect wears off in the End Phase of the turn after the hit.

## Weapons that lost their damage

- **Swing Fire racks (all, LRM/LRT and SRM/SRT):** copy the base rack's canon Alpha Strike block, values and keywords ("LRM", "Indirect Fire", "SRM"). Today the SRMs get a derived block without the SRM keyword, and the LRMs get nothing. The +1 to-hit has no Alpha Strike effect: the Companion's to-hit bonus applies only to negative modifiers. Note: ours.
- **EII PDS:** `AMS` plus its machine-gun damage, 0.4 short, heat 1. It is a gun and an anti-missile system. Ours, Mike Reese.
- **The Penitrator:** expected damage ÷ 10, with the short bracket cut by its minimum range of 8 (×1/3). That gives 0.15 / 0.35 / 0.25 / 0.25 (1d8 4.5, 1d6 3.5, 1d4 2.5; the 36-hex reach reaches Extreme), heat 0. The critical check on every hit has no Alpha Strike form. Ours, Herb Barents.
- **ER Improved Narc:** `INARC`, as the iNarc. Its 27-hex reach is not modeled (the INARC attack keeps its book range). The note becomes ours, Thunder and Lycaon.
- **Pile Bunker (u/FweeCom):** `MEL`. These are melee weapons, and the Companion gives MEL to canon melee weapons (Lance, Hatchet, Sword). Ours.
- **Laser Arrays:** `carried-by-linked-weapons`. A test proves that a 'Mech with an array and three Medium Lasers gets the three lasers' damage on its card.

## Our new specials (levels 6-7 only)

Each special gets an entry in `CONST_AS_SPECIAL_ABILITIES` (type Custom, source "JBT conversion ... (Custom Homebrew, NOT OFFICIAL)") with this text, a TRO line, and play.

| Code | Item | Rule |
|---|---|---|
| `ITAS#` | Improved 'Mech Taser (VoiceOfAN) | As MTAS#, with three differences. The −2 against a BattleMech does not apply. A hit adds 1 heat to a target that tracks heat. Against conventional infantry or battle armor it deals 1 damage instead of the Taser effect. Heat 6, 0.1 short. Summed per unit. |
| `BSF#/#/#/#` | Blue Saviour Dispersion Field (u/PleiadesMechworks) | Switch it on or off in the End Phase; it is 'Mech-only. While it is on: (a) the unit attacks with the BSF damage values. These are its standard damage with every energy weapon's share halved, computed when the card is converted. (b) An incoming attack the player marks as energy is halved (round down, minimum 1). An incoming missile attack (IF, SRM, LRM) takes −1, minimum 1, as an AMS gives; this does not stack with the unit's own AMS. (c) The unit counts as inside hostile ECM it cannot negate, and STL gives no benefit. (d) +1 heat in each End Phase it is on. (e) From the seventh turn on, roll 2D6 at the start of each turn; a roll below 2 + (turns on − 6) fails the field for the scenario. (f) Any critical hit while it is on deals +1 damage and kills the field for the scenario. |
| `NPC` | Nuclear Pulse Cannon (Prince, Munchkin) | A direct-fire artillery cannon attack under the ASCE Artillery Cannon rules, out to Long range. Damage is 4 to a 2" area of effect and 2 to units within 2" of that template's edge. AMS, RAMS and chaff do not reduce it. A target that tracks heat also takes +1 heat; any other target takes +1 damage. Firing adds 2 heat to the firer. This scales the Long Tom Cannon's 20 → ART-LTC 2 up to 35 → 4 and 18 → 2. |
| `HAIL` | Hailstorm Artillery (Apocryphal, MW5) | An artillery attack as ART-LT, damage 5/3 (the Long Tom's 20/10 → 3/1 scaled to 35 and 25), 6" area of effect. It takes the ART-LT munitions (Cluster, Copperhead, Flechette, Illumination, Smoke). **Inferred:** it stays at its own level, Apocryphal 5. The entry is type Custom, but the record's block is `inferred`, so the code is not gated and does not raise the card's level. |
| `PSC` | 'Mech Periscope (Thunder, Solaris7) | It traces line of sight for spotting and indirect fire as if 1" higher. It cannot attack from the periscope. |
| `SMKT` | Smoker (Future Wars #32) | Declared when it moves: light smoke fills a 2"-wide lane along its path until the End Phase of the next turn. No heat: 3 Classic heat a turn is below the threshold for 1 Alpha Strike heat (ours). The fuel (`feeds-special`) is assumed to last the scenario. |
| `SMKB#` | Buckler Smoke Dispenser (Gargoyle Industries, Future Wars #32) | # uses (10 a dispenser, summed). A unit that did not move this turn may, after the Movement Phase, fill a 2" area on itself with heavy smoke that blocks line of sight, until the End Phase of the next turn. Not on VTOLs. |
| `PBR` | Power Booster (Running) (Karl Sander) | Declared before it moves: +2" ground Move this turn and +1 heat in the End Phase. Failure roll each use, as in Classic: 2D6 ≤5 on the first turn in a row, ≤9 on the second, ≤11 on the third, and the fourth always fails. Failure leaves the booster dead for the scenario. On a natural 2 the unit also takes an MP Hit critical. |
| `PBJ` | Power Booster (Jump Jets) (Karl Sander) | Declared before it jumps: jump Move ×1.5 (round down to an even inch) and +1 heat. The failure roll is as PBR. On a natural 2 the unit also loses its jump Move for the scenario. |

The boosted weapons (PPC, lasers, Gatling Laser w/ Power Booster) already carry derived damage. Their boost has no Alpha Strike form: the weapon fires as the plain weapon. They get that note.

## Munitions

A new field, `alphaStrike.munition?: ASMunitionKey`, names the ASCE Alternate Munition a round plays as. The unit's existing special-ammo choice (`getAlphaStrikeSpecialAmmoTag`) selects it. The card prints the munition, and Alpha Strike play adds its to-hit modifier and effect line. A new data table, `src/data/alpha-strike-munitions.ts`, holds the ASCE p.146 rows: key, name, to-hit modifier, the specials it requires, the rule text and the page. Our munitions are rows marked `custom: true`, shown only at levels 6-7.

| Rounds | Munition |
|---|---|
| Canon AC Armor-Piercing, Flak, Flechette, Precision, Tracer (every AC size, light ACs included) | The ASCE rows of the same name (canon, all levels) |
| Canon LRM/SRM Heat-Seeking, Inferno, Magnetic Pulse, Semi-Guided, Smoke, Swarm, Tandem-Charge, Thunder, Mine Clearance | The ASCE rows of the same name |
| AC/12 AP, Precision, Flechette, Flak, Tracer (Pleiades) | The canon AC rows (the record says "as the canon AC/10 round") |
| AC/12 Caseless, Rotary AC Caseless | `no-alpha-strike-munition` |
| AC SABOT (Tomaszewski) | Armor Piercing (ours: the nearest canon round, a penetrator with a critical chance) |
| Boosted AC ammo (Pleiades) | `boosted` (ours): the AC special's attack may reach one bracket further, at the last bracket's AC damage, +1 heat |
| EMP missiles (VoiceOfAN), every launcher | `emp` (ours): standard damage; on a hit roll 2D6, and on 10+ a target that is not conventional infantry shuts down for the next turn. This follows the Classic per-location 11+, raised one point for a whole salvo. Needs LRM or SRM. |
| Thunderbolt Heat-Seeking, Semi-Guided, Thunder | The ASCE rows. They need the LRM special, which a Thunderbolt unit lacks, so they apply only when the unit has it. The card says so. |
| Thunderbolt Narc-Capable | `no-alpha-strike-munition` |
| Gauss VHE (Congdon) | `vhe` (ours): +1 damage per Gauss Rifle firing it, on a hit at Short or Medium range |
| Gauss Inferno (Liao) | `gauss-inferno` (ours): +1 heat to a target that tracks heat, this turn and the next |
| Hailstorm Cluster, Copperhead, Flechette, Illumination, Smoke | The ASCE artillery rows, under HAIL |
| Hailstorm Thunder, Fuel-Air | `no-alpha-strike-munition` (ASCE Thunder is ART-AIS/AC only; ASCE has no Fuel-Air) |
| MG AP, incendiary, tracer; Vehicle Flamer acid | `no-alpha-strike-munition` |
| Every standard round | `standard-ammunition` |

## Guard tests

- **Every record:** every level 6-7 record, and every record of any level whose notes say "not yet looked up", has specials, damage, a munition, or a `noConversion` reason. No record's notes say "no Alpha Strike conversion" or "no Alpha Strike effect".
- **Every TRO section:** every `## ` section of `docs/lore/homebrew-equipment-tro.md`, `best-of-future-wars-tro.md`, and `ammunition-tro.md` that names a level 6-7 record also contains "Alpha Strike".
