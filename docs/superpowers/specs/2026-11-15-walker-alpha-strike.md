# Walker Alpha Strike ruleset (#172, Walkers plan Chunk G)

**Status: answered by the owner 2026-11-15; built in Chunk G.** The answers: (1) a type of its own, `WK` (`IWK` for
an industrial walker), priced and played on the 'Mech lines; (2) one damage line with `TUR` and `REAR`, as Alpha Strike
does for a unit of this size (arc cards are for very large units); (3) `AIF#` with the to-hit of the printing the walker
is built under; (4a) structure follows the walker's own ten locations: the 'Mech table value scaled by the walker's
structure points against a biped's; (4b) the Companion's four-legged rules, not Flint's 3-point Piloting bonus.

This ruleset is ours. Clell Flint's walker rules (*Future Wars* #11, pp.25-27; *The Best of Future Wars, Volume
One*, pp.36-38) are for the board game only, and no book converts a walker. Every card made by it is marked NOT
OFFICIAL and credits Flint ("Inspired by" for an industrial walker, which is ours). Each rule below is marked with
where it comes from:

- **[Flint]** his walker rules, either printing; the two differ on one point used here (section 4).
- **[AS]** the Alpha Strike conversion rules: Alpha Strike Companion (ASC), conversion chapter pp.91-141, with
  errata v1.6 and the Converting Heat errata v1.3 (2025); play rules from ASC p.40 (four-legged 'Mechs) and Alpha Strike:
  Commander's Edition (AS:CE).
- **[Ours]** a call of ours, where neither says anything or the two differ.

## Read

- ASC: Size (p.92), Move (pp.92-94), armor (p.95), structure and the 'Mech Structure Conversion Table (pp.97-98),
  which weapons count (p.99: a 'Mech's weapons not marked rear; a vehicle's front, side and turret weapons),
  weapon values (pp.99-101), heat and Overheat (pp.115-116), special abilities (pp.116-133: BFC, REAR, TUR),
  Point Value (pp.138-141). Four-Legged (Quad) 'Mechs, p.40: no Climbing, no External Cargo, the 90-degree Fore
  arc, -2 on Control Rolls.
- AS:CE: the quad firing arc (attack arcs section; the same text as ASC p.40), the quad -2 for skids and -1 for
  bog-down, turret and rear attacks. Read in the text extract; page numbers to be confirmed on the page at build.
- Code: `BattleMech.calcAlphaStrike()` and `calculateAlphaStrikeValue()` (the 'Mech conversion; it types every
  'Mech "BM"), `MicroMech.getAlphaStrikeStats()` / `getAlphaStrikeUnit()` (the pattern to follow),
  `Vehicle.getAlphaStrikeStats()` (how `TUR(...)` and `REAR` are written), `calculateGroundPointValue()`,
  `alpha-strike-mech-structure.ts`; on the walker `getWalkerWalkMP`, `WALKER_LOCATION_ARCS`,
  `getWeaponPlayLines`, `getEditionRules().antiInfantryBaseToHit`.

## 1. The card

| Stat | Rule | From |
|---|---|---|
| Type | **WK**; **IWK** for an industrial walker (owner, 2026-11-15: a type of its own). Flint calls it a "4 Legged Mech": wherever Alpha Strike asks the type (the critical hit column, the Heat Scale, the Point Value lines), `WK` reads as `BM` and `IWK` as `IM`. The walker's own rules ride on the `WLK` ability. | Ours |
| Size | By tonnage, the 'Mech rows: under 40 tons 1, 40-55 2, 60-75 3, 80-100 4 (ASC p.92). | AS |
| Move | 2 inches for each Walking MP **on four legs** (the biped figure x 1.25, Flint's rounding); jump as a 'Mech: `10"j`, or `10"/6"j` when the two differ (ASC pp.92-93). MASC or a Supercharger: the four-legged Walking MP x 1.25, both x 1.5, rounded normally, before the x 2; no effect on the jump (ASC p.93). | AS on Flint's figure |
| TMM | From the non-jumping Move, the standard table; `JMPS#` / `JMPW#` when the jump differs. | AS |
| Armor | The armor points of all ten locations / 30, rounded normally (ASC p.95). The rear torso is a location of its own, so it counts as a 'Mech's rear armor does. | AS |
| Structure | The 'Mech Structure Conversion Table by tonnage and engine type (ASC p.98), **scaled by the walker's own structure** (owner, 2026-11-15): the table value x the walker's structure points (Flint's table, ten locations) / a biped 'Mech's at that tonnage (TM p.47, eight locations), rounded normally, at least 1. At 50 tons 90 / 83: 4 stays 4. At 60 tons and over a walker has 11 to 18 percent more structure and nearly always gains 1 (100 tons, standard engine: 8 becomes 9); a compact engine at 90 tons and over gains 2. Under 45 tons a walker has less than a biped (15 points against 19 at 10 tons), but no table value drops. | AS; Ours for the scaling |
| Overheat | As a 'Mech (Converting Heat errata v1.3): section 2. | AS |
| Damage S/M/L | Section 2. | AS, Ours for the walker's arcs |
| Specials | Section 3. | AS, Ours |
| Point Value | Section 5. | AS |
| Role | None. | Ours |
| Tech | Inner Sphere or Clan, as the design. | as the class |

## 2. Damage

The Companion's method for a 'Mech (ASC pp.99-101, 115-116), with the app's catalog values for each weapon. What is
new is deciding which of a walker's weapons count where. Flint gives a walker four firing arcs and a turret (#11
p.27); a card has one damage line and the `TUR` and `REAR` abilities. So:

| Where the weapon is | On the card | From |
|---|---|---|
| Front torso, left torso, right torso, the four legs, control section | The damage line. | Ours, on the Companion's vehicle rule ("front and side locations ... are counted as forward firing", ASC p.99) |
| Turret | The damage line, and again in `TUR(#/#/#)` with the turret's own `AC` / `SRM` / `LRM` / `IF` values, as a vehicle's turret (ASC p.133). | AS |
| Rear torso | `REAR#/#/#` only, rounded normally, not adjusted for heat (ASC p.129). | AS |
| Center torso (machine guns, small lasers, flamers) | `AIF#` only (section 4). They cannot fire at an ordinary target, so they add nothing to the damage line and give no `HT`. | Ours |

- **Heat.** The Companion's Converting Heat errata v1.3 (CGL 2025; it supersedes ASC pp.115-116), through the
  shared routine `src/utils/alphaStrikeHeat.ts` that the 'Mech conversion uses too. Movement heat: 2 for walking (none
  for an industrial walker that cannot jump), or a point a Jumping MP, at least 3; improved jets half, rounded up, at
  least 3; an XXL engine 6 without jump jets, 2 a Jumping MP with them (at least 6), 1 a Jumping MP with improved
  jets (at least 3). Weapon heat: the forward and turret weapons; the rear torso's instead when it is greater. Every
  AMS +1, a Clan Laser AMS +5, an Inner Sphere Laser AMS +7. Rocket and one-shot launchers add none. Every subtotal is
  rounded up to the tenth; when the sinks dissipate less than the output - 4 the unrounded subtotal is scaled by
  dissipation / (output - 4) and rounded up to the tenth. Final values round up; more than 0 and under 0.5 is 0*.
  Overheat: the Medium value before less after (Short if there is no Medium), at most 4. `OVL` is checked with the
  Long output (weapons with no Long damage left out); with OVL the Long value is scaled with the full output, without
  it the Long value is not scaled. `OVL` is printed only when Overheat is above 0 (ours: it does nothing otherwise).
  The damage abilities (`LRM`, `SRM`, `AC`, `IF`, `FLK`, `HT`) and `TUR` are scaled by the same factors and rounded
  normally; `REAR` and `AIF` are not. Center-torso weapons add no heat. [AS; Ours for the center torso, TUR, REAR,
  and printing OVL]
- **The same card as a 'Mech.** A walker and a biped 'Mech carrying the same weapons and heat sinks, with nothing in
  the walker's rear or center torso, get the same damage, hot or cool, since both use the shared routine (the 'Mech's
  old heat step was fixed at the same time); a test pins this. [Ours]
- A weapon whose ammunition is not carried counts nothing; few shots as the Companion (ASC p.101). [AS; the first
  as the Micro-Mech ruling]
- "If the unit can deliver more damage to its rear arc than its front, use the rear arc weapons" (ASC p.99) is
  **not** applied: a walker's rear torso is one location among seven that carry weapons. [Ours]

## 3. Special abilities

**From the equipment and the damage, as the Companion has them [AS]:** `AC`, `FLK`, `LRM`, `SRM`, `IF#`, `HT`,
`ENE` (no explosive item), `CASE`, `CASEII`, `ECM`, `AECM`, `PRB`, `BH`, `RCN`, `TAG`, `C3` codes, `SNARC`, `INARC`,
`AMS`, `TSM`, `JMPS#`, `JMPW#`, `OVL`, `REAR#/#/#`, `TUR(...)`, and the others the 'Mech conversion writes from the
catalog. No `MEL` (a walker has no arms and takes no hand-held weapon).

**An industrial walker [AS, on our industrial walker]:** type `IWK` (priced as `IM`); `BFC` unless it has Advanced Fire Control;
`EE` with an internal combustion engine, `FC` with a fuel cell; `SEAL` with environmental sealing. (The app's 'Mech
conversion does not yet write these for an IndustrialMech; the walker will, and the Point Value procedure already
prices `IM`.)

**`WLK`, "Walker" [Ours]:** one ability on every walker card. The card prints the code; the text is shown under the
card, in the print legend and in the special abilities reference.

| WLK rule | Alpha Strike effect | From |
|---|---|---|
| Four legs | The rules for a four-legged 'Mech: -2 on Control Rolls (skids), -1 on bog-down checks, no Climbing, no External Cargo. | AS (ASC p.40, AS:CE). Flint's +3 Piloting bonus is the same idea; the Companion's figure is used |
| Firing arc | The damage line is fired into the 90-degree Fore arc of a four-legged 'Mech; `REAR` into the rear arc; `TUR` all round. | AS |
| Kicks only | A standard physical attack (damage equal to Size) and a charge; Death From Above if it jumps. No melee weapon. | Flint (no punches; kicks in any direction), AS |
| Belly guns | The `AIF#` attack, section 4. | Flint |
| Legs | No leg is tracked. The 'Mech column's MP Hit stands for a lost leg. | Ours |

Rules of Flint's with no effect at this scale, left out: the leg-by-leg movement table (biped with one leg out,
crawl with two), actuator hits, the hit location table and its six attack directions, #11's rule that an
immobilized walker cannot be knocked over, the variant slot counts.

## 4. `AIF#`, "Anti-Infantry Fire" [Ours, from Flint]

Flint lets a walker's center torso carry only machine guns, small lasers and flamers, firing only at infantry and
vehicles in the walker's own hex, at short range, at -2, from a base to-hit number that the two printings give
differently (0 in #11, 8 in the Best-of; plan Editions row).

- **Value.** The center-torso weapons' Short values added, rounded normally; under 0.5 is `AIF0*`. No center-torso
  weapon, no code.
- **The attack.** In addition to its other attacks, a walker may make one `AIF` attack on an infantry (CI, BA) or
  vehicle (CV, SV) unit in base contact, in any direction. It does `#` damage. It is not a physical attack and
  needs no arc.
- **To-hit.** Flint's base replaces the pilot's Skill: the target number is **6** under the Best-of printing
  (8 - 2) or **-2** under #11 (0 - 2, which all but always hits), plus the target's Target Movement Modifier and the
  other usual modifiers; no range modifier. The card's text names the printing in use.
- **Heat.** None from it. A flamer here does not give `HT`.

## 5. Point Value

The ground procedure (ASC pp.138-141, errata v1.6) through the shared `calculateGroundPointValue()`, on the `BM`
lines, or the `IM` lines for an industrial walker (structure halved, Offensive Value x 0.8 without `AFC` or `BFC`,
x 0.9 with `BFC`). `TUR` and `REAR` are priced as that procedure prices them for any ground unit (nothing of their
own). `WLK` and `AIF#` are worth nothing: the narrow arc and the stability pull opposite ways, and `AIF` reaches
only a unit in base contact. [AS; Ours for `WLK` and `AIF`]

## 6. A worked walker (by hand; the build's tests will pin it)

50 tons, standard fusion, biped Walking MP 4, 12 single heat sinks, 152 armor points, Best-of printing. Turret:
Large Laser. Front torso: 2 Medium Lasers. Rear torso: 1 Medium Laser. Center torso: 2 Machine Guns (ammunition in
a torso).

| Stat | Sum | Card |
|---|---|---|
| Size | 50 tons | 2 |
| Move | 4 x 1.25 = 5 Walking MP on four legs; x 2 | 10", TMM 2 |
| Armor | 152 / 30 = 5.07 | 5 |
| Structure | 50 tons, standard engine: 4 x 90 / 83 = 4.34 | 4 |
| Damage | Large Laser 0.8 / 0.8 / 0 + 2 Medium Lasers 1.0 / 1.0 / 0 = 1.8 / 1.8 / 0 | 2/2/- |
| Overheat | 2 (move) + 8 + 6 = 16, less 4 = 12, against 12 sinks | 0 |
| Specials | Turret 0.8 / 0.8 / 0; rear 0.5 / 0.5 / 0; center torso 0.4 | AIF0*, REAR1/1/-, TUR(1/1/-), WLK |
| Point Value | Offensive 2 + 2 x 2 + 0 + 1 (half Size) = 7. Defensive 10 / 8 + (5 x 2 + 4) x 1.2 = 1.25 + 17 = 18.25. Agile (2 - 1) x 2 = 2 | 27 |

## Questions for the owner (answered 2026-11-15; see Status)

Answers: 1 a type of its own (`WK`, `IWK`); 2 what Alpha Strike uses, which is the one damage line proposed; 3 by
edition, as proposed; 4 structure scaled to the walker's locations, and the Companion's four-legged rules.

1. **Type code.** `BM` / `IM` with the `WLK` ability (proposed), or a type of its own as the Micro-Mech's `MM`
   (say `WK`)? A type of its own would need the 'Mech lines named again wherever Alpha Strike asks the type.
2. **Side weapons on the damage line.** Proposed: everything but the rear and center torso counts on the one
   damage line, as a vehicle's side weapons do, fired into the Fore arc. The other way is a card with four arcs
   and a turret, as a Large support vehicle's: truer to Flint's arc diagram, but a much busier card and a
   different way to play it.
3. **`AIF#`**: the code, the base-contact attack, and keeping the two printings' to-hit (target number 6 against
   -2).
4. **Structure from the 'Mech table** with nothing added for the two extra locations, and **Flint's +3 read as the
   Companion's -2** for four legs.

## Calls that were ours

1. Type `WK` / `IWK` (the owner's), one `WLK` ability.
2. Move from the four-legged Walking MP (the figure the walker plays with).
3. Which locations count on the damage line; `REAR` for the rear torso only; the rear-heavier rule not applied.
4. Center-torso weapons off the damage line and off the heat, as `AIF#`; `AIF` to-hit from Flint's base number.
5. Structure from the 'Mech table, scaled by the walker's structure points against a biped's (the owner's).
6. The Companion's four-legged rules in place of Flint's Piloting bonus; no leg tracking.
7. The industrial specials (`IM`, `BFC`, `EE`, `FC`, `SEAL`) written for a walker though the app's 'Mech conversion
   does not yet write them.
8. `WLK` and `AIF#` cost nothing in the Point Value.

## Build (after the answer; plan Chunk G)

Built 2026-11-15, except the TRO entry (there is no TRO - JBT: Walkers page yet; left for Chunk H) and a look at
the card in a browser. The ledger lists the rulings.

Tests first, pinning the worked walker and the walker-against-biped check. `getAlphaStrikeStats()` and
`getAlphaStrikeUnit()` on `Walker`; `print-as.tsx` in the walker creator and an Alpha Strike block on the summary;
the card marked NOT OFFICIAL with `MulSource` set; `WLK` and `AIF#` texts in the special abilities reference; saved
walkers on the Alpha Strike roster's add page beside the other custom units; the Alpha Strike rules in the walker's
TRO entry. No change to `BattleMech`.
