# Technical Readout: Community Homebrew and Apocryphal Equipment

Weapons and engines taken from posts on r/battletech and from the MechWarrior 5 video game, built into the catalog at the Custom Homebrew and Apocryphal rules levels. NOT OFFICIAL. Each entry credits the people whose idea it is; where a number is ours rather than theirs, the item's notes in the equipment list say so.

## How we derive Battle Value and cost

Most fan posts give a weapon's weight, slots, heat, damage and range and stop there. A weapon with no Battle Value or cost would drop out of a 'Mech's totals, so wherever an author gave none we derive one, and the item's notes say so. This page gives the method in full, with the check we ran against canon weapons, so that you can use it for your own creations and judge how far to trust it. The code is in `derived-values.ts`; the tests that run the checks below are in `derived-values.test.ts`.

**What the figures are.** Battle Value (BV) is the number the builder adds up for a weapon. The Master Rules (BV1) print no figure for these weapons, so a BV1 total falls back on the same number we derive (the catalog's own fallback). That is sound for direct-fire weapons: across the 163 catalog weapons that print a BV1, direct-fire BV1 and BV2 agree to within 2 points. They part ways on artillery (the Long Tom is 171 in BV1 and 368 in BV2) and on the Clan anti-missile system, and we derive neither. Cost is in C-Bills.

**The principle: price what the weapon does.** A weapon's Battle Value follows the damage it can deal over the hexes it can reach. We never copy a neighbour's number and scale it by weight; we work from the weapon's own damage and range, and we use a canon neighbour only to check the result or where the canon line already runs through the size we need.

**The methods:**

- **Direct-fire weapons (lasers, PPCs, flamers, gatling and cluster weapons):** BV = damage summed over every hex up to the long range. A flat 10 damage out to 18 hexes is 180. If damage falls in bands, each band counts at its own damage (the Snub-Nose PPC: 10 for 9 hexes, 8 for 4, 5 for 2 is 132). A cluster weapon counts its groups times their size. A weapon that rolls dice counts the average roll in each band.
- **Missile launchers of a size the canon stops short of (SRM, SRT and Streak SRM of 8 and 10 tubes):** carry the canon line on from its last two points. The canon SRM is 39 at 4 tubes and 59 at 6, so 8 tubes is 79 and 10 is 99. A one-shot launcher is a fifth of its reloadable twin.
- **Autocannon sizes between canon sizes (the 15-class):** the straight line between the canon 10 and 20 of the same family. The canon AC/10 is 123 and the AC/20 178, so the AC/15 is 151.
- **Physical weapons:** 1.275 BV a point of damage, the median of the canon hatchet, sword, mace, lance and claw.
- **Ammunition:** a ton is worth an eighth of its weapon's BV (the canon ratio runs .122 to .135). Special rounds carry their standard round's BV, as the canon special rounds do. Missile ammunition is 0, as in canon: its BV rides on the launcher.
- **Equipment that is not a weapon:** BV 0, as the canon C3 computer and MASC. The notes say so rather than leaving a bare 0.
- **Cost:** BV x 1,310 C-Bills, the median cost per BV point of the canon energy weapons, to the nearest 1,000. Where a canon neighbour exists (an anti-missile system, a null-signature system) we take its cost.

**Weapons with several modes are priced at their strongest mode.** The canon MML-5 is 45, the same as the LRM-5 and not the sum of its LRM and SRM figures; only one mode fires a turn. The canon ATM-3 carries one figure, 53, and its other loads are priced as ammunition. The Omni-Laser follows this: its Focus mode is the strongest, so Focus sets the BV.

**How far the method runs from canon.** Each line is checked in the test file:

| Check | Method says | Printed | Difference |
| --- | --- | --- | --- |
| PPC, 10 damage x 18 hexes | 180 | 176 | 2% high |
| ER PPC, 10 damage x 23 hexes | 230 | 229 | 0% |
| Large laser, 8 x 15 | 120 | 123 | 2% low |
| Medium laser, 5 x 9 | 45 | 46 | 2% low |
| Heavy PPC, 15 x 18 | 270 | 317 | 15% low |
| Snub-Nose PPC, 10 / 8 / 5 by band | 132 | 165 | 20% low |
| SRM 6, carried on from the 2 and the 4 | 57 | 59 | 3% low |
| Streak SRM 6, from the 2 and the 4 | 88 | 89 | 1% low |
| LRM 20, from the 5 and the 10 | 180 | 181 | 1% low |
| AC/5, between the 2 and the 10 | 69 | 70 | 1% low |
| LB 5-X, between the 2 and the 10 | 82 | 83 | 1% low |
| Ultra AC/5, between the 2 and the 10 | 114 | 112 | 2% high |

Plain lasers and PPCs come out within a few points of the printed figure. Weapons that hit hard for their reach (the Heavy PPC, the Snub-Nose) come out 15 to 20 per cent low, so a fan weapon like those will be rated a little under what a canon table would print. We have not added a correction: two weapons are too few to base one on, and a rule that overrates a weapon is worse than one that underrates it. Cost is looser than BV: the canon energy weapons run from 912 to 1,786 C-Bills a BV point (the middle half), so treat a derived cost as a starting figure.

**To use it for your own item:** work out the damage over reach (or pick the line your launcher or autocannon sits on), do the sum, round, put the sum in the item's notes, name the canon weapon you checked it against, credit whoever's idea it is, and say "Inspired by" where you extrapolated.

## Superheavy PPC

*u/FedditSuns, r/battletech, "Custom Weapon Feedback: Superheavy PPC".* A heavier cousin of the Heavy PPC, posted for feedback.

| Item | Value |
| --- | --- |
| **Rules level** | Custom Homebrew |
| **Weight** | 13 tons |
| **Slots** | 5 |
| **Damage** | 20 |
| **Heat** | 20 |
| **Range** | 3 minimum, 6 / 12 / 18 (aerospace: medium) |
| **Battle Value** | 422 (the author's) |
| **Cost** | 300,000 C-Bills (the author's) |

The post gives no tech base, dates or tech rating, so the record leaves the tech base open and the dates and rating unverified. Battle Value and cost are the author's. For a check: the method gives 20 damage x 18 hexes = 360, 15 per cent under his 422, the same shortfall as the canon Heavy PPC, which supports the 15 to 20 per cent warning above.

## Fusion Lance

*u/Magical_Savior, with a critique from u/sokttocs, r/battletech, "Weapon Idea - Fusion Lance".* A short, ruinous weapon that taps the engine itself.

| Item | Value |
| --- | --- |
| **Rules level** | Custom Homebrew |
| **Weight** | 4 tons |
| **Slots** | 2, only where there are Engine critical slots |
| **Heat** | 30 |
| **Range** | 3 hexes |
| **Damage** | 10 plus 5 for each 100 of engine rating or part of 100 (15 at least, 30 at most), less 5 for each hex after the first |
| **Battle Value** | By the 'Mech's engine: 30 for a rating of 100 or less, 60 for 250, 75 for 400 |
| **Cost** | By the same: 39,000, 79,000 and 98,000 C-Bills |

Each activation needs a Supercharger roll, and the roll stacks with a mounted Supercharger. A failed roll is a critical hit on the topmost engine slot, applied at once, and each engine hit takes 5 off the damage. It does full damage to infantry.

**How the figures are derived.** The lance's damage depends on the engine, so a single printed number would be wrong for every 'Mech but one. Its Battle Value is a formula the builder works out for each 'Mech: the damage in hex 1, hex 2 and hex 3, added up, as for any direct-fire weapon. On a 250-rated engine that is 25 + 20 + 15 = 60; on a 400-rated engine 30 + 25 + 20 = 75; on a 100-rated engine 15 + 10 + 5 = 30. Cost is that BV at 1,310 C-Bills a point. Heat does not enter the figure, as for any canon weapon. The reach is only 3 hexes, so even at 30 damage the lance is a small number beside a PPC, and a fixed figure borrowed from a long-range weapon would have overrated it several times over.

## Omni-Laser

*u/heavyarmormecha, r/battletech, "Custom Weapons: Omni-Laser".* One laser with three modes; the replies called it overpowered.

| Item | Value |
| --- | --- |
| **Rules level** | Custom Homebrew |
| **Tech base** | Inner Sphere |
| **Introduced** | 3150 (ours, from the author's Experimental availability) |
| **Weight** | 10 tons |
| **Slots** | 4 |
| **Range** | 6 / 12 / 18 |
| **Heat and damage** | Focus mode: 20 heat, 16 damage (the other modes are in the rules text) |
| **Battle Value** | 288 (derived) |
| **Cost** | 377,000 C-Bills (derived) |

The player picks a mode at the start of the Weapons Phase and keeps it until the next one. Focus: 16 damage to one location, with a through-armor critical roll at -2 if armor still covers it. Pulse: 18 heat, four 5-damage shots on the cluster table, -1 to hit. Dazzler: 12 heat, fifteen 1-damage shots, with a heavy effect on infantry, battle armor and ProtoMechs. A critical hit disables the weapon.

**How the figures are derived.** Priced at the strongest mode, as the canon MML is priced at its LRM mode. Focus does 16 damage over 18 hexes: BV 288. Cost 288 x 1,310 = 377,280, rounded to 377,000. The other two modes add nothing.

## Pile Bunker

*u/FweeCom, r/battletech, "Homebrew Equipment: Pile Bunker".* An explosive-driven spike for close work. The author calls the numbers tentative.

| Item | Value |
| --- | --- |
| **Rules level** | Custom Homebrew |
| **Weight** | 5 tons |
| **Slots** | 5 |
| **Damage** | 15 on a hit, and the target makes a Piloting roll at +1 |
| **Heat** | 2 |
| **To hit** | +1 |
| **Ammunition** | 3 shots a ton, explosive (5 damage a shot if the ton is hit) |
| **Battle Value** | 19 (derived) |
| **Cost** | 25,000 C-Bills (derived) |
| **Ammunition** | BV 2 and 1,000 C-Bills a ton (derived) |

**How the figures are derived.** It is a physical weapon, so its BV is the canon melee figure: 15 damage x 1.275 = 19.1, rounded to 19. Cost 19 x 1,310 = 24,890, rounded to 25,000. The ammunition ton is an eighth of the weapon's BV: 19 / 8 = 2.4, rounded to 2, and 2 x 450 C-Bills, the canon median for ammunition, is 900, rounded to 1,000. The dates are the pile driver's (1950, never extinct), as the post gives none.

## PPC-X

*Apocryphal. A weapon of the MechWarrior 5: Mercenaries expansion "Solaris Showdown"; tabletop line from u/Severe_Ad_5022 and u/Omega_Chris_8352 in a thread begun by u/Distinct-Duck-7120.* A PPC that splits its shot into a burst of ion bolts.

The PPC-X began in the stables of Solaris VII. Solaris Arms, the Lyran firm that builds a few arena 'Mechs a year for the great games, wanted a weapon that gave the crowd more to watch than one blue-white bolt. Its engineers fitted a PPC with an ion separator at the muzzle, a ring of field coils that splits each discharge into a spread of ion bolts. Where a PPC pours all its energy into one hole, the PPC-X scatters it: every bolt strikes in a different place, and each leaves a brief disruption field where it lands. Fewer duels end in one blow and more end in stripped arms, legs and weapons, which is what a stable's sponsors pay to see. Built by a small works for a single market, it never reached the Lyran armies. It is found in the arena stables, and in the hands of mercenaries who buy it on Solaris.

| Item | Value |
| --- | --- |
| **Rules level** | Apocryphal |
| **Tech base** | Inner Sphere (ours) |
| **Introduced** | 3015, the year the game is set (ours) |
| **Weight** | 7 tons |
| **Slots** | 3 |
| **Heat** | 10 |
| **Range** | No minimum, 5 / 9 / 12 |
| **Damage** | Three bolts of 5 on the cluster table (15 if all strike), -1 to hit |
| **Battle Value** | 180 (derived) |
| **Cost** | 236,000 C-Bills (derived) |

**How the tabletop line was reached.** The game's stock PPC-X (tier 0) is 7 tons, 19.2 damage, 20 rounds a minute, 8.4 heat and 600 meters, against the game's PPC at 10 damage, 10 rounds a minute, 9.6 heat and 736 meters. The game's heat is the tabletop heat times 0.96 (PPC 10 becomes 9.6, ER PPC 15 becomes 14.4), so the PPC-X reads as about 20 damage and 9 heat at tabletop scale, with a reach about 0.8 of the PPC's. u/Severe_Ad_5022 posted the one complete tabletop line (7 tons, 3 slots, 10 heat, 5 / 9 / 12, -1 to hit, on the cluster table) with 12 damage. By owner ruling the damage is three groups of 5, 15, a compromise between his 12 and the game's roughly 20.

**How the figures are derived.** 15 damage over 12 hexes: BV 180. Cost 180 x 1,310 = 235,800, rounded to 236,000. The same method gives the canon PPC 180 against 176 printed. Nothing adjusts for the -1 to hit.

## Re-Engineered Fusion Engine

*u/Bookwyrm517, r/battletech, "Feedback for a custom engine type", with ideas from u/FweeCom and u/MasonStonewall.* A fusion engine a third lighter than a standard one, squat and wide.

| Item | Value |
| --- | --- |
| **Rules level** | Custom Homebrew |
| **Tech base** | Inner Sphere |
| **Weight** | A third less than a standard engine of the same rating, rounded up to the half ton (0.67 of the standard weight) |
| **Slots** | 3 in the center torso and 3 in each side torso |
| **Heat** | As a standard engine |
| **Introduced** | 3062, the light engine's (ours) |
| **Cost** | The XL engine's multiplier (ours) |

It is destroyed if a side torso is lost, as an XL engine is; the author kept that on purpose so it would not outlast a light engine. Three engine hits destroy it, as with any fusion engine. It frees three center torso slots, as a compact engine does, which makes it a good match for tripods and for 'Mechs with a center torso cockpit (the owner's observation, not the author's). It is not offered above rating 400 or on superheavy 'Mechs, which the post does not cover.

**How the Battle Value was reached.** An engine's BV multiplier prices what losing the engine to a side torso hit costs. The standard engine is 1.0, the light engine (which survives a side torso loss) 0.75, the XL engine 0.5. The Re-Engineered engine dies with a side torso exactly as the XL does, so we give it the XL's 0.5 and the XL's Alpha Strike structure column. Its cost uses the XL engine's multiplier, and its dates are the light engine's, as the post gives none. u/FweeCom's heat-sink idea and u/MasonStonewall's rating-divided-by-20 are credited but not adopted, as the author did not adopt them.

## Tandem Charge SRM House Rule

*u/Magical_Savior, r/battletech, "Tandem Charge SRM - House Rules".* An alternate rule for the existing Tandem-Charge SRM ammunition, which its author finds far too strong for its Battle Value. In the app it is a Special Ruleset, not a new item.

- **Ammunition:** a ton holds half the rounds, rounded up.
- **Free critical check:** each attack gets one, as armor-piercing rounds do, at the first location hit, one roll per launcher. Roll 2D6: a critical hit on a 12 for a launcher of 2 or 3 tubes, an 11 for 4 or 5, a 10 for 6 or 7, and a 9 for the MML-9.
- **Vehicles and battle armor:** which are critically hit automatically, take one critical hit for every 3 missiles, as with Infernos.
- **Armor that ignores it:** against Hardened armor and Ferro-Lamellor armor the rounds get no critical check.

The launcher sizes are our reading of the post's grouped lines. The rule is recorded as text only, so the builder still gives the ammunition its printed rounds a ton.

## Other Items Priced the Same Way

The same pass filled in every other Custom Homebrew, Apocryphal and Munchkin item that lacked a Battle Value or cost. A figure the author gave was never changed.

| Item | Battle Value | Cost | Method |
| --- | --- | --- | --- |
| SRM-8, SRM-10 and the SRT versions | 79 and 99 | as given | The canon SRM line carried on from 4 and 6 tubes |
| One-shot SRM-8, SRM-10 and the SRT versions | 16 and 20 | as given | A fifth of the reloadable launcher |
| Streak SRM-8, Streak SRM-10 and the Streak SRT versions | 119 and 149 | as given | The canon Streak SRM line carried on |
| One-shot Streak SRM-8, Streak SRM-10 and the Streak SRT versions | 24 and 30 | as given | A fifth of the reloadable launcher |
| AC/15 (Solaris7) | 151 | 250,000 C-Bills | Midway between the canon AC/10 and AC/20 |
| LB 15-X AC | 193 | as given | Midway between the canon LB 10-X and 20-X |
| Ultra AC/15 | 246 | as given | Midway between the canon Ultra AC/10 and AC/20 |
| AC/15, LB 15-X and Ultra AC/15 ammunition | 19, 25 and 31 a ton | as given | Midway between the canon size 10 and 20 rounds |
| Disruptor (MekTek) | 150 | 197,000 C-Bills | Damage 10 over 15 hexes |
| Gatling Laser | 72 | as given | Six shots of 2 over 6 hexes |
| Long Range Flamer | 60 | as given | Damage 5 over 12 hexes |
| Light Blazer (Gothic, Apocryphal) | 63 | 83,000 C-Bills | Damage 7 over 9 hexes |
| The Penitrator | 103 | 135,000 C-Bills | The dice by band: 7 hexes at 1.25, 5 at 4.5, 12 at 3.5, 12 at 2.5 |
| EII Point Defense System | 32 | 100,000 C-Bills | The canon Anti-Missile System, which does the same job |
| Null-Signature System (custom) | 0 | 1,400,000 C-Bills | The canon Null Signature System |
| SABOT, VHE and Inferno Gauss, and Long Range Flamer fuel | the standard round's | the standard round's | Special rounds carry their standard round's BV in canon |
| Rotary rifle ammunition (light, medium, heavy) | 6, 9 and 13 a ton | as given | An eighth of the weapon's BV |
| Laser arrays, modular C3, power boosters, periscope, magnetic grapples, EMP ammunition | 0 | as given | The canon figure for their kind; the notes say so |

Two groups are not priced, and the notes say why: the COIL weapons, whose ranges are not in hexes and so cannot be summed, and the standard rocket launcher ammunition, which has no weapon to follow.
