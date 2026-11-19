# ArtVee (Artillery Vehicle): design

Date: 2026-10-20. Rules level: **Custom Homebrew (6)**. Nothing here is canon except the canon items called out in
"Canon prerequisites". Replaces the "Siege Tank" item in `TODO.md` (Custom Homebrew section).

## Intent

A tracked tank that transforms the way a LAM does, between **Vehicle Mode** (it moves and fires an autocannon) and
**Siege Mode** (immobile, firing real artillery). The idea comes from the StarCraft siege tank; it was put forward by kris (helvedes heste) [SLDF] on the Star League
Discord server (a BattleTech group) and brought to BattleTech terms by the user. The name is **ArtVee**, short for Artillery Vehicle, patterned on QuadVee. Some powers
call them **MAPs** (Mobile Artillery Platforms); the record sheet and builder text mention that alias.

The ArtVee is meant to be strongly defended once it is set up: heavy armor, protected tracks, and secondary weapons
against infantry and fast raiders.

## Goals

- Build ArtVees in the Combat Vehicle creator at rules level 6 and above, with construction validation.
- Rate them with a single blended BV, the way LAMs are rated.
- Show both modes on the tabletop record sheet and on one Alpha Strike card.
- Play them: mode flag, transformation turn and switching between the gun's two profiles.
- Verify the canon artillery pieces (Thumper, Sniper, Long Tom: they already exist) and add the Armored Motive System
  at its canon level.
- Add the two *Future Wars* smoke devices as custom equipment.

## Non-goals and anti-goals

- **No Siege Mode to-hit bonus.** The quirks system (next TODO item) will cover stable-platform effects.
- Custom records must never appear in canon lists, canon validation or canon BV/PV math.
- No ArtVee on any motive type other than Tracked.
- Never call this canon. BattleTech has no canon "bimodal vehicle" chassis.
- **No MegaMek or SSW export of an ArtVee, or of any unit with custom equipment.** MegaMek is a canon-only utility
  and will not accept custom equipment (user, 2026-10-20). Today the app only imports vehicle BLK files, so this is
  a guard: any MegaMek/SSW writer must refuse a unit with custom content and say why. The app's own JSON save keeps
  everything (mode flag, combo gun, both ammo bins, conversion equipment) and must round-trip it.
- **Armored Motive in the Support Vehicle creator is a follow-up**, not part of this project (my call). Support
  Vehicles use a separate multiplier-based chassis-modification system (`support-vehicle-construction.ts`); add a
  TODO item for it.

## Canon prerequisites (canon levels, all units)

1. **Thumper, Sniper and Long Tom artillery** (TO:AUE p.96): verify and clean up, not add. The three pieces
   already exist in `src/data/mech-universal-equipment.ts` (`thumper-artillery`, `sniper-artillery`,
   `long-tom-artillery`) with standard ammunition in `mech-universal-ammo.ts` (`ammo-thumper-standard`,
   `ammo-sniper-standard`, `ammo-long-tom-standard`). The cleanup (Task 1) sets the Thumper's heat to 6 and removes
   two stray alternate names (the Sniper carried "Flamer (Vehicle)", the Long Tom carried "ISSniper"). Figures from
   the TO:AUE tables (raw extract lines 22550-22552, 22639-22641, BV lines 19067-19069); the heat column is checked
   against the Heavy Weapons and Equipment Combat Data table (printed p.215, which cites p.96 for the rules).

   | Piece | Heat | Damage | Range | Shots/t | Weight | Cost / ammo per ton | BV / ammo BV |
   | --- | --- | --- | --- | --- | --- | --- | --- |
   | Thumper | 6 | 15 | 21 mapsheets | 20 | 15 t | 187,500 / 4,500 | 43 / 5 |
   | Sniper | 10 | 20 | 18 mapsheets | 10 | 20 t | 300,000 / 6,000 | 85 / 11 |
   | Long Tom | 20 | 25 | 30 mapsheets | 5 | 30 t | 450,000 / 10,000 | 368 / 46 |

   The second BV list (Long Tom 560 / ammo 46, Sniper 96 / 11, Thumper 48 / 5, lines 19300-19302) is the Clan
   Weapons and Equipment BV Table [Addendum] (cont.), TO:AUE p.197, so those are the Clan versions' BVs (checked on
   the page image 2026-10-21; the IS rows are p.195; errata v7.0 changes neither). The Clan combo guns use them; the
   app's canon artillery records still carry one (IS) BV.

   Game rules: Indirect Artillery (TO:AR p.147), Direct-Fire Artillery (TO:AR p.153), Counter-Battery Fire (TO:AR
   p.154). Check whether standard artillery ammunition already exists in the ammo catalogs (Copperhead and FASCAM
   records do).
2. **Armored Motive System** (TO:AUE pp.94-95, errata TO:AUE v7.0 2023-09-23). It is available to every Combat
   Vehicle and Support Vehicle with Tracked, Wheeled, Hover, Hydrofoil, Naval or WiGE motive, not only ArtVees.
   - Weight: IS 15%, Clan 10% of total weight. Errata: round quarter-ton values up to the half ton; it uses no
     weapon space and cannot be pod-mounted.
   - Game rule: −2 on Motive System Damage Table rolls. A result of 2 or less has no effect.
   - BV: +0.1 to the motive type modifier (TO:AUE p.193).
   - Experimental. IS prototype 3071 (Free Worlds League), Clan prototype 3057 (Hell's Horses). The TO v3.02 and
     v3.03 errata give latest intro dates "3071P/NA" (IS) and "NA/3057P" (Clan).
   - Cost: the TO:AUE p.218 cost table is scrambled in the text extract. Read it from the page image.
   - Alpha Strike: `ARS` already exists (ASCE p.76).
   - The existing `ICombatVehicleChassisModification` type takes weight as `tonnage / weightDivisor`, and 15% is not
     a divisor, so the type needs a weight-fraction field.
3. **AS special `ART%-#`** already exists. The ArtVee uses ARTTH, ARTSN and ARTLT.

## The combo gun (custom)

There are three weapons, one for each artillery piece. Each is **one physical weapon with two fire profiles**. A
collapsible barrel and a second breech drop in for Vehicle Mode, because the artillery tube can't fire until it is
deployed.

| Gun | Siege Mode profile | Vehicle Mode profile | Vehicle Mode range (min/S/M/L) |
| --- | --- | --- | --- |
| Thumper combo | Thumper artillery, canon | AC/5: 5 damage, 1 heat | 3 / 7 / 14 / 21 |
| Sniper combo | Sniper artillery, canon | AC/10: 10 damage, 3 heat | – / 6 / 12 / 18 |
| Long Tom combo | Long Tom artillery, canon | AC/20: 20 damage, 7 heat | – / 4 / 8 / 12 |

- **Range:** the longer barrel adds +1/+2/+3 hexes to the AC's short, medium and long ranges, the same step as
  Medium Laser to ER Medium Laser. Damage, heat and minimum range stay the AC's own.
- **Profile by mode:** Vehicle Mode fires only the AC profile, Siege Mode only the artillery profile. On the turn
  of a transformation no weapon fires, the combo gun's either profile included.
- **Weight, slots, cost:** those of the artillery piece (15 / 20 / 30 t). It takes 1 vehicle item slot, and
  must be in the turret. The breech and barrel are paid for by the conversion equipment.
- **Ammunition:** separate bins. Artillery ammo (the piece's canon munitions) feeds the Siege Mode profile, and the
  matching AC's ammo feeds the Vehicle Mode profile. Builder's call: whether AC special munitions are allowed.
- **Weapon BV:** Vehicle Mode profile BV = the AC's canon BV × 1.33 (the ER-to-standard laser ratio), rounded:
  AC/5 70 → **93**, AC/10 123 → **164**, AC/20 178 → **237**. The gun counts **once** in the blended BV, at the
  higher of its two profiles, the tube BV taken for the gun's tech base: Thumper combo 93 (IS and Clan), Sniper
  combo 164 (IS and Clan), Long Tom combo 368 (IS) and 560 (Clan). Ammo BV is each bin's canon
  value.
- **Tech:** IS and Clan, with the ArtVee dates below.

## ArtVee conversion equipment (custom)

- **Weight:** 10% of the vehicle's tonnage, rounded up to the half ton. The precedents are LAM conversion
  equipment at 10% (IO:AE p.108), bimodal LAM at 15%, and QuadVee at 10% (IO:AE p.128).
- **Slots:** 2 body item slots and 1 turret item slot (the turret slot holds the breech and the collapsible
  barrel). The 2/1 split is my call; the user said "most in the body, one in the turret".
- **Cost:** QuadVee precedent (IO:AE p.181). Add (cost of all weapons, equipment and structure) × 0.5 before the
  final cost multiplier. "Structure" is the whole structural cost, ammunition left out, as the book's worked example
  reads ("structural, weapon, and equipment costs"; user ruling 2026-10-26, which also applies to LAMs and QuadVees).
- **Critical hits (my call):** the conversion equipment sits in the vehicle's equipment pool and can be picked by
  a critical result that destroys equipment. Destroyed, it strands the ArtVee in its current mode. Stranded in
  Vehicle Mode, the artillery profile can never fire; stranded in Siege Mode, the tank cannot move.

## Construction rules (ArtVee option in the Combat Vehicle creator)

- **Rules level 6+ only.** The creator offers an "ArtVee (transforming)" option; below level 6 it is hidden.
- **Tracked only.**
- **Engine:** XL or XXL fusion, IS or Clan, whichever the tech base allows (XXL on Combat Vehicles: TO:AUE
  pp.120-121; the app already counts vehicle XXL item slots). The XXL frees tonnage for extra weapons. The usual
  ×1.5 vehicle fusion shielding applies.
- **Minimum movement:** 4/6 for Thumper and Sniper ArtVees, 3/5 for Long Tom ArtVees. The engine has to be big
  enough to power everything while the tank is static.
- **Exactly one combo gun, in a turret.** It fixes the variant (Light = Thumper, Medium = Sniper, Heavy = Long Tom).
- **Armored Motive System: recommended, not required.** The builder shows a recommendation when it is absent. If
  it is mounted, its own tech base and intro dates apply (so a Star League ArtVee can't take it).
- **Armor:** "pretty hefty" is design guidance. My call: the builder shows a warning (not an error) below 50% of
  the vehicle's maximum armor.
- **Tonnage:** no fixed minimum; the construction math decides. Standard tracked limits (up to 100 t) for now.
  Superheavy ArtVees are allowed in principle but pinned as a later TODO; the user wants to get familiar with
  superheavy vehicles before committing (2026-10-20). Until then the builder doesn't offer them.
- **Other weapons and equipment** are mounted and fire normally in both modes. The conversion does not change how
  they are mounted.

Fit check (IS XL engine, 1 t of each ammo, no other weapons; armor as % of maximum; "AM" = Armored Motive):

| Variant | Lightest that fits | Best with IS AM | Best with Clan AM | Without AM |
| --- | --- | --- | --- | --- |
| Thumper 4/6 | about 40 t | 70 t: 64% | 70 t: 84% | 100% from 55 t |
| Sniper 4/6 | 40 t (no AM) | 70 t: 33% | 70–80 t: 52% | 70–80 t: 92% |
| Long Tom 3/5 | 55 t (no AM) | 100 t: 43% (fits from 75 t) | 100 t: 63% | 100% at 100 t |

## Battle Value: blended, as for LAMs (IO:AE p.185)

One BV for the unit, computed as a Combat Vehicle with these changes, following the LAM method:

- **Defensive movement modifier:** from Vehicle Mode (Siege Mode is 0 MP).
- **Speed factor:** Vehicle Mode running MP plus half of Siege Mode's MP (0), so effectively Vehicle Mode running
  MP. The LAM precedent is 'Mech running MP + half AirMech flank MP.
- **Combo gun:** counted once at its higher profile BV (see above).
- Armored Motive adds +0.1 to the motive type modifier when mounted.
- Custom BV: never feeds canon unit math.

## Era and dates

| Line | Dates | Armored Motive |
| --- | --- | --- |
| SLDF "Star League pattern" | prototype 2690, production 2700; Inner Sphere extinct 2865 | not available yet |
| Clan | kept from the Exodus, never lost | available from 3057 (Hell's Horses) |
| Inner Sphere | reintroduced 3071 (Free Worlds League / IrTech); "MAP" is a common Inner Sphere name | available from 3071 |

These are the dates of the ArtVee conversion equipment and combo guns. The rest of a design follows its
components' own dates: an IS XL engine is lost 2865 and returns 3035; Clan XL arrives 2827; XXL is IS proto 3055 /
3110 and Clan proto 2954 / 3084. Story: the SLDF fielded ArtVees alongside its LAMs. The Inner Sphere lost them in
the Succession Wars, the Clans kept them, Hell's Horses fitted them with Armored Motive, and IrTech copied that
design in 3071.

## Play mode

- **Mode flag** on the unit: Vehicle or Siege. Both appear on the record sheet with the current mode marked.
- **Transformation (LAM timing):** declared in the Movement Phase, before the unit moves (it can't start after
  moving). User ruling 2026-10-21: the transformation is the unit's only action that turn. It can't move and no
  weapon fires (the stationary 0 target and attacker movement modifiers apply; it is stationary, not immobile). The new
  Mode takes effect at the end of the turn, and the next turn moves and fires normally in it.
  A declared transformation can be cancelled before the unit acts that turn (an app convenience for a misclick).
- **Siege Mode:** 0/0 MP, the turret turns freely through 360°, and the combo gun fires its artillery profile with
  the full artillery rules. Siege Mode is not "immobile" for the −4 immobile-target modifier (my call); its target
  movement modifier is that of a unit that did not move.
- **Vehicle Mode:** normal tracked movement and turret, AC profile.
- Armored Motive, when mounted: −2 on Motive System Damage rolls.

## Record sheet and Alpha Strike

- **Tabletop record sheet:** both mode lines (MP: "4/6 Vehicle, 0/0 Siege"), the combo gun with both profiles,
  both ammo bins, conversion equipment in its slots, "ArtVee (MAP)" in the type line.
- **One Alpha Strike card** showing both modes. Movement shows Vehicle Mode with a Siege 0" note. S/M/L damage
  comes from Vehicle Mode weapons, and the Siege Mode artillery shows as `ARTTH-1` / `ARTSN-1` / `ARTLT-1`, marked
  Siege Mode only. `ARS` is added if Armored Motive is mounted. PV comes from the computed conversion, which stays
  marked provisional (custom unit).

## Smoke devices (custom, from *Future Wars* #32)

The library has no canon smoke generator; canon smoke comes from Smoke Mortar rounds (TO:AUE), Smoke LRMs, Smoke
Arrow IV and artillery smoke rounds. *Future Wars* #32
(`JBTIICRework/magazines/Future Wars/Future Wars Magazine Issue 032 - Future Wars Magazine.pdf`, an OCR scan; check
numbers on the page images) has two devices. They are general custom equipment, not ArtVee-only:

- **Smoker** (PDF p.11): 0.5 t. One ton of fuel gives 50 hexes of level-2 smoke along and around the movement
  path. 3 heat per turn of use. A fuel hit starts a small fire: 5 damage, 10 heat.
- **Buckler Smoke Dispenser** (PDF p.19): 0.5 t, 1 slot, 1 heat, 10 integral shots. It puts smoke in the unit's own
  hex (smoke per the Compendium rules). The unit must stay stationary the turn it activates it, and the smoke takes
  effect right after the Movement Phase. It cannot be mounted on VTOLs.

The heat figures matter only for 'Mechs (Combat Vehicles track no heat for these).

Cost, BV, dates and tech rating follow the 2026-10-21 analog ruling, taken from the nearest canon devices. None of the
three is ever extinct, because the user ruled the tech was always around and never lost.

- **Smoker** = Vehicle Flamer values: 7,500 C-bills, BV 5 (defensive), 1950, tech B, 1 'Mech slot.
- **Smoker fuel** = Vehicle Flamer / Fluid Gun obscurant ammunition: 1,000 a ton, BV 1, 1950, tech B.
- **Buckler Smoke Dispenser** = Vehicular Grenade Launcher: 10,000 C-bills, BV 15 (defensive), 2100, tech C.

## Where the data goes

The catalogs are moving from `mech-{is,clan,universal,custom}-*` to one file per category and rules level,
`<category>-canon.ts` / `-apocryphal.ts` / `-custom.ts` / `-munchkin.ts` (TODO.md, "Catalog rework"; step 1 is done,
commit c959dbc8, so every record carries `techBase`). New records go straight into the new layout:

- `artillery-custom.ts`: the three combo guns.
- `misc-custom.ts` (or whatever name the rework gives that category): Smoker and Buckler Smoke Dispenser.
- `combat-vehicle-chassis-modifications-custom.ts`: ArtVee conversion equipment.
- Canon artillery pieces: already in `mech-universal-equipment.ts` and `mech-universal-ammo.ts` (cleaned up in Task 1;
  moved later by the rework).
- Armored Motive System: `combat-vehicle-chassis-modifications.ts` (canon).

Register the new files in `equipment-registry.ts`, gated by rules level 6 (`tag: "custom"`). The local Astech rules
(`.claude/rules/astech-rules.md` §4) still say custom content goes "only in `mech-custom-*`"; that line needs
updating to the new layout (local file, not committed).

## Sample designs

The initial examples **ship with the app** as custom units (user, 2026-10-20), with both Inner Sphere and Clan
examples. For each variant, Light (Thumper), Medium (Sniper) and Heavy (Long Tom), there are three patterns (my
call on the set):

- **SLDF / Star League pattern** (IS tech, `star-league` era): heavier armor.
- **Clan pattern** (Clan tech, `clan-inv` era): Clan XL, Clan weapons.
- **Inner Sphere "MAP" pattern** (IS tech, `jihad` era): lean.

User ruling 2026-10-21: the samples use **production technology only**. Armored Motive (prototype only in TO:AUE)
and XXL engines are therefore left off, and the samples show the "Armored Motive recommended" warning where the era
offers it. Clan standard AC ammunition is extinct from 2850, so the Clan combo guns feed their Vehicle Mode from custom
"ArtVee AC/N Breech Ammo (Clan)" (canon IS standard AC ammo stats, ArtVee dates).

Secondary weapons come from the user's list: machine guns, small/medium pulse lasers, mortars, grenade launchers,
flamers, searchlights and the smoke devices, each only where its own tech base and dates allow. Each design passes
the construction rules above.

Names (user-requested, chosen 2026-10-21; none is used by a unit in the app's MUL data):

| Gun | SLDF | Clan | MAP |
| --- | --- | --- | --- |
| Thumper | Falconet FLC-1 | Pangolin PNG-C | Springald SPR-1M |
| Sniper | Saker SKR-1 | Archerfish ARF-C | Perrier PER-1M |
| Long Tom | Culverin CLV-1 | Glyptodon GLY-C | Tormentum TRM-1M |

They ship as `src/data/artvee-samples.ts` (`getArtVeeSamples(rulesLevel)`), offered by a "Sample ArtVees" picker in
the Combat Vehicle creator at rules level 6 and above, rather than in the custom MUL list.

## Left to the builder

- Record shapes for a two-profile weapon (a `profiles` object keyed by mode is the obvious one), and how the
  vehicle model stores the mode flag.
- Whether AC special munitions are allowed in the Vehicle Mode profile.
- The exact warning texts.
- Tech rating and availability codes for the custom items (model them on LAM conversion equipment).
- How the play-mode UI presents transformation.
- Tests: rules-driven tests next to the source, naming the rule (TO:AUE, IO:AE pages above, or "ArtVee design
  2026-10-20" for custom rules).
