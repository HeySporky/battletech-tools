# Technical Readout: Community Homebrew and Apocryphal Equipment

Weapons and engines taken from posts on r/battletech and from the MechWarrior 5 video game, built into the catalog at the Custom Homebrew and Apocryphal rules levels. NOT OFFICIAL. Each entry credits the people whose idea it is; where a number is NGCFells's rather than theirs, the item's notes in the equipment list say so.

## How NGCFells derives Battle Value and cost

Most fan posts give a weapon's weight, slots, heat, damage and range and stop there. A weapon with no Battle Value or cost would drop out of a 'Mech's totals, so wherever an author gave none NGCFells derives one, and the item's notes say so. This page gives the method in full, with the check run against canon weapons, so that you can use it for your own creations and judge how far to trust it. The code is in `derived-values.ts`; the tests that run the checks below are in `derived-values.test.ts`.

**What the figures are.** Battle Value (BV) is the number the builder adds up for a weapon. The Master Rules (BV1) print no figure for these weapons, so a BV1 total falls back on the same derived number (the catalog's own fallback). That is sound for direct-fire weapons: across the 163 catalog weapons that print a BV1, direct-fire BV1 and BV2 agree to within 2 points. They part ways on artillery (the Long Tom is 171 in BV1 and 368 in BV2) and on the Clan anti-missile system, and neither is derived. Cost is in C-Bills.

**The principle: price what the weapon does.** A weapon's Battle Value follows the damage it can deal over the hexes it can reach. A neighbour's number is never copied and scaled by weight; the work starts from the weapon's own damage and range, and a canon neighbour is used only to check the result or where the canon line already runs through the size needed.

**The methods:**

- **Direct-fire weapons (lasers, PPCs, flamers, gatling and cluster weapons):** BV = damage summed over every hex up to the long range. A flat 10 damage out to 18 hexes is 180. If damage falls in bands, each band counts at its own damage (the Snub-Nose PPC: 10 for 9 hexes, 8 for 4, 5 for 2 is 132). A cluster weapon counts its groups times their size. A weapon that rolls dice counts the average roll in each band.
- **Missile launchers of a size the canon stops short of (SRM, SRT and Streak SRM of 8 and 10 tubes):** carry the canon line on from its last two points. The canon SRM is 39 at 4 tubes and 59 at 6, so 8 tubes is 79 and 10 is 99. A one-shot launcher is a fifth of its reloadable twin.
- **Autocannon sizes between canon sizes (the 15-class):** the straight line between the canon 10 and 20 of the same family. The canon AC/10 is 123 and the AC/20 178, so the AC/15 is 151.
- **Physical weapons:** 1.275 BV a point of damage, the median of the canon hatchet, sword, mace, lance and claw.
- **Ammunition:** a ton is worth an eighth of its weapon's BV (the canon ratio runs .122 to .135). Special rounds carry their standard round's BV, as the canon special rounds do. Missile ammunition is 0, as in canon: its BV rides on the launcher.
- **Equipment that is not a weapon:** BV 0, as the canon C3 computer and MASC. The notes say so rather than leaving a bare 0.
- **Cost:** BV x 1,310 C-Bills, the median cost per BV point of the canon energy weapons, to the nearest 1,000. Where a canon neighbour exists (an anti-missile system, a null-signature system) its cost is taken.

**Alpha Strike values.** A unit's Alpha Strike card adds up each weapon's own Alpha Strike block, so a weapon with an empty block adds nothing to the card. For fan weapons NGCFells derives the block from the weapon's own stats by the conversion the canon weapons follow:

- **Damage** in each bracket is the weapon's expected damage divided by 10; a cluster weapon's expected damage is its hits on a roll of 7 on the Cluster Hits Table times the damage of each (the canon SRM 6: 4 hits x 2 = 8, which is 0.8).
- **Brackets** are reached when the weapon's long range reaches into them: short from 1 hex, medium from 4, long from 16, extreme from 24.
- **A minimum range** cuts the short bracket by a twelfth for each hex of it, to a quarter (the canon PPC, minimum 3: 0.75; the LRM, minimum 6: 0.5).
- **A bonus to hit** adds a twentieth a point (pulse lasers 10 per cent, extended-range pulse lasers 5); an **Ultra** autocannon counts half again the damage and twice the heat.
- **Heat** is the weapon's heat. The conversion does not cover long-range missiles, mortars, arrays, tasers, anti-missile systems or artillery, which keep their blocks as they are.

The test file checks 23 canon weapons (lasers, PPCs, autocannon, SRMs, heavy Gauss) and each comes out within 0.02 of the printed value. A weapon whose block already held values is never touched.

**Dates and tech ratings** the sources do not give come from a named canon neighbour (the Heavy PPC's for the Superheavy PPC, the Supercharger's for the Fusion Lance, the medium laser's for a laser, the Anti-Missile System's for the point defense system) or, for the Best of Future Wars items, from the catalog's 3025 baseline, since the fanzine prints no year. Each item's notes say which, and mark it as NGCFells's.

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

Plain lasers and PPCs come out within a few points of the printed figure. Weapons that hit hard for their reach (the Heavy PPC, the Snub-Nose) come out 15 to 20 per cent low, so a fan weapon like those will be rated a little under what a canon table would print. NGCFells has not added a correction: two weapons are too few to base one on, and a rule that overrates a weapon is worse than one that underrates it. Cost is looser than BV: the canon energy weapons run from 912 to 1,786 C-Bills a BV point (the middle half), so treat a derived cost as a starting figure.

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

**Where it came from.** The Tikograd Lances were built in a hurry on Tikonov III, a Capellan Confederation world, in the autumn of 3028, during the Battle of Tikonov (23 September to 18 October 3028, part of Operation RAT). The Federated Suns' Crucis Lancers under Charles Duncan besieged Tikograd, a fortified, heavily industrialized city. Pavel Ridzik commanded the defence; the Night Riders had cleared the sky; and Davion artillery was already breaking the walls. In the heavy-engine shops of the industrial sector a chief technician, Natalya Orlova, argued that a 'Mech's best weapon was its own reactor: bleed the plasma through a magnetic nozzle on the chest and throw the engine's heart at the enemy, harder the bigger the engine. Ridzik had nothing else, and her crews built a handful in under three weeks. A lance could kill a heavy 'Mech in two shots at three hexes, and the same surge could crack the carrier's own engine. The lances slowed the Seventh Crucis Lancers in the industrial sector, but Tikograd surrendered on 18 October. The Davion technicians who found the shops judged the design too dangerous to build, and the idea outlived the city. The world, the battle, its dates and the Houses are from Sarna; the workshop, Orlova and the number built are NGCFells's. The record is Inner Sphere, prototype and introduced 3028, never extinct. The "Supercharger roll" in the original post is only an engine surge; the lance needs no Supercharger technology.

**How the figures are derived.** The lance's damage depends on the engine, so a single printed number would be wrong for every 'Mech but one. Its Battle Value is a formula the builder works out for each 'Mech: the damage in hex 1, hex 2 and hex 3, added up, as for any direct-fire weapon. On a 250-rated engine that is 25 + 20 + 15 = 60; on a 400-rated engine 30 + 25 + 20 = 75; on a 100-rated engine 15 + 10 + 5 = 30. Cost is that BV at 1,310 C-Bills a point. Heat does not enter the figure, as for any canon weapon. The reach is only 3 hexes, so even at 30 damage the lance is a small number beside a PPC, and a fixed figure borrowed from a long-range weapon would have overrated it several times over.

## Omni-Laser

*u/heavyarmormecha, r/battletech, "Custom Weapons: Omni-Laser".* One laser with three modes; the replies called it overpowered.

| Item | Value |
| --- | --- |
| **Rules level** | Custom Homebrew |
| **Tech base** | Inner Sphere |
| **Introduced** | 3150 (NGCFells's, from the author's Experimental availability) |
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
| **Tech base** | Inner Sphere (NGCFells's) |
| **Introduced** | 3015, the year the game is set (NGCFells's) |
| **Weight** | 7 tons |
| **Slots** | 3 |
| **Heat** | 10 |
| **Range** | No minimum, 5 / 9 / 12 |
| **Damage** | Three bolts of 5 on the cluster table (15 if all strike), -1 to hit |
| **Battle Value** | 180 (derived) |
| **Cost** | 236,000 C-Bills (derived) |

**How the tabletop line was reached.** The game's stock PPC-X (tier 0) is 7 tons, 19.2 damage, 20 rounds a minute, 8.4 heat and 600 meters, against the game's PPC at 10 damage, 10 rounds a minute, 9.6 heat and 736 meters. The game's heat is the tabletop heat times 0.96 (PPC 10 becomes 9.6, ER PPC 15 becomes 14.4), so the PPC-X reads as about 20 damage and 9 heat at tabletop scale, with a reach about 0.8 of the PPC's. u/Severe_Ad_5022 posted the one complete tabletop line (7 tons, 3 slots, 10 heat, 5 / 9 / 12, -1 to hit, on the cluster table) with 12 damage. By NGCFells's ruling the damage is three groups of 5, 15, a compromise between his 12 and the game's roughly 20.

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
| **Introduced** | 3062, the light engine's (NGCFells's) |
| **Cost** | The XL engine's multiplier (NGCFells's) |

It is destroyed if a side torso is lost, as an XL engine is; the author kept that on purpose so it would not outlast a light engine. Three engine hits destroy it, as with any fusion engine. It frees three center torso slots, as a compact engine does, which makes it a good match for tripods and for 'Mechs with a center torso cockpit (NGCFells's observation, not the author's). It is not offered above rating 400 or on superheavy 'Mechs, which the post does not cover.

**How the Battle Value was reached.** An engine's BV multiplier prices what losing the engine to a side torso hit costs. The standard engine is 1.0, the light engine (which survives a side torso loss) 0.75, the XL engine 0.5. The Re-Engineered engine dies with a side torso exactly as the XL does, so NGCFells gives it the XL's 0.5 and the XL's Alpha Strike structure column. Its cost uses the XL engine's multiplier, and its dates are the light engine's, as the post gives none. u/FweeCom's heat-sink idea and u/MasonStonewall's rating-divided-by-20 are credited but not adopted, as the author did not adopt them.

## Tandem Charge SRM House Rule

*u/Magical_Savior, r/battletech, "Tandem Charge SRM - House Rules".* An alternate rule for the existing Tandem-Charge SRM ammunition, which its author finds far too strong for its Battle Value. In the app it is a Special Ruleset, not a new item.

- **Ammunition:** a ton holds half the rounds, rounded up.
- **Free critical check:** each attack gets one, as armor-piercing rounds do, at the first location hit, one roll per launcher. Roll 2D6: a critical hit on a 12 for a launcher of 2 or 3 tubes, an 11 for 4 or 5, a 10 for 6 or 7, and a 9 for the MML-9.
- **Vehicles and battle armor:** which are critically hit automatically, take one critical hit for every 3 missiles, as with Infernos.
- **Armor that ignores it:** against Hardened armor and Ferro-Lamellor armor the rounds get no critical check.

The launcher sizes are NGCFells's reading of the post's grouped lines. The rule is recorded as text only, so the builder still gives the ammunition its printed rounds a ton.

## COIL-S, COIL-M and COIL-L

*Apocryphal. Weapons of the BATTLETECH video game (Harebrained Schemes, Heavy Metal expansion); tabletop figures by DevianID in the battletech.com forum thread "A Hare-Brained Weapon", with Speedbump and namar13766.* COIL stands for "Contained Overflow Inertia Linkage": a weapon that banks the energy of the 'Mech's own stride and spends it in one beam.

| Item | COIL-S | COIL-M | COIL-L |
| --- | --- | --- | --- |
| **Weight** | 2 tons | 3 tons | 4 tons |
| **Slots** | 4 | 6 | 8 |
| **Damage** | 3 | 5 | 7 |
| **Heat** | 2 | 4 | 9 |
| **Range** | 1 / 2 / 3 | 3 / 6 / 9 | 5 / 10 / 15 |
| **To hit** | +1 | +1 | +1 |
| **Cost** | 110,000 C-Bills | 220,000 C-Bills | 360,000 C-Bills |
| **Battle Value** | 9 x the multiplier | 45 x the multiplier | 105 x the multiplier |

Damage and heat are multiplied by the movement modifier when it is over +1: a 'Mech that moved 5-6 hexes does twice the base, 7-9 hexes three times, 10-17 hexes four times; a 'Mech that stood still, moved 4 hexes or fewer, or jumped fires at the base figures. A critical hit to a COIL deals half its damage to the 'Mech as an explosion.

**Where it came from.** The COIL is a Clan Wolverine weapon, by NGCFells's ruling. Sarna's [Clan Wolverine](https://www.sarna.net/wiki/Clan_Wolverine) page puts a wolverine insignia on the chassis parts from the wreck of the Dobrev (itself one of the Clan's founding bloodnames), and has Natasha Kerensky's Black Widow Company apparently tasked with hunting down every trace of the Clan. The Wolverines existed from 11 June 2807; the Trial of Annihilation was announced on 25 October 2823 and the last ground battle was fought on 7 July 2824. So the COIL was prototyped about 2810 and made from 2815, and the Annihilation ended it in 2824. It returns in 3025, when the wreck's cargo reaches the Inner Sphere's markets. The Clans do not use it: the Not-Named Clan was erased, and its technology is shunned (desgra). The record is therefore Inner Sphere only. Sarna says nothing about a personal feud: Natasha's dislike of the weapon is her duty to wipe out every trace of the Clan.

**The Clans know it when it fires.** A Clan warrior cannot tell a COIL by sight, but the first shot gives it away: its beam has a firing pattern that every Clan warrior is taught to recognise as the mark of the Not-Named Clan. The moment a COIL fires, every Clan unit that can see it knows what it is, breaks Zellbrigen against the carrier, and makes destroying it the first priority, believing it belonged to Clan Wolverine. They keep attacking until it is dead. This is a ruling by NGCFells, not Sarna's. In play it means a COIL is the one weapon you do not take to a game with Clans on the board unless the unit is meant to be hunted.

**What was wrong, and the fix.** The catalog held the game's own numbers: ranges in meters (450 for the COIL-L), five times the tabletop damage, and the Standard rules level, so a 35-damage laser was offered in a Standard game. The ranges are now in hexes (30 meters a hex; the COIL-L's 315-meter medium band is 10 hexes, the last whole hex it covers), the damage and heat are the forum thread's, and the weapons sit at the Apocryphal level.

**How the Battle Value is derived.** The damage depends on how the 'Mech moved, so the Battle Value follows the 'Mech's running speed, as the Fusion Lance's follows its engine: base damage times the multiplier of the running speed times the hexes it reaches. A COIL-L on a 'Mech that walks 4 and runs 6 (a +2 modifier, twice the base) is 7 x 2 x 15 = 210; the figure on the catalog record is for a 'Mech whose running speed gives no bonus. The thread's other tabletop conversion, Izzy193's COIL-L, COIL-M and COIL-H with their own numbers, is a different design and is not used.

## Smoker, Periscope and Buckler Smoke Dispenser

*Future Wars #32 ("New Toys for Techs" and the Gargoyle Industries article) for the Smoker and the Buckler; the 'Mech Periscope is the Solaris7 forum's sensor mast. The eras are by NGCFells's ruling.*

| Item | Era | Tech base |
| --- | --- | --- |
| **Smoker** | 1950, never extinct | Inner Sphere and Clan |
| **'Mech Periscope** | Succession Wars (NGCFells dates it 2900) | Inner Sphere only |
| **Buckler Smoke Dispenser** | SLDF design, about 2650 (NGCFells's year) | Inner Sphere and Clan |

The **Smoker** is some of the oldest and simplest equipment on a 'Mech, a tank of oil and a nozzle, and it has never gone out of style. The **'Mech Periscope** is a Succession Wars invention, born in the Houses' water-world campaigns, where a wading or half-submerged 'Mech needs its sensors above the surface; the Clans took no part in those wars and do not field it. The **Buckler Smoke Dispenser** is an SLDF design for units that want to hide. It is common in second-line and garrison units and on ArtVees (artillery vehicles), which the SLDF fielded and the Clans kept, and in the Clans' second-line Solahma units rather than their front line. It left with the Exodus (2784) and stayed in the Inner Sphere; Future Wars #32 calls it "an old idea that has been largely overlooked". Gargoyle Industries, an Inner Sphere firm selling in the early Clan war (the 3050s), markets it; the article gives no end to that production.

## Reloading Rocket Launchers

*Custom Homebrew, by NGCFells: no outside author.* The catalog held rocket ammunition (240 rockets a ton, 45,000 C-Bills a ton, introduced 3067) with no launcher to fire it, and no published rule has a reloadable rocket launcher: the canon Rocket Launchers 10, 15 and 20 are one-shot, reloaded after a mission. So the three launchers are NGCFells's, built from the canon ones.

| Item | RRL 10 | RRL 15 | RRL 20 |
| --- | --- | --- | --- |
| **Weight** | 0.5 ton | 1 ton | 1.5 tons |
| **Slots** | 1 | 2 | 3 |
| **Heat** | 3 | 4 | 5 |
| **Salvos a ton** | 24 | 16 | 12 |
| **Battle Value** | 90 | 115 | 120 |
| **Cost** | 30,000 C-Bills | 60,000 C-Bills | 90,000 C-Bills |

The weight, slots, heat and ranges are the canon launcher's. The Battle Value and cost follow a rule the canon shows across the SRM, Streak SRM, SRT and LRM lines: a one-shot launcher is a fifth of its reloadable twin in Battle Value and half in cost, so the reloading launcher is five times the one-shot's Battle Value (18, 23 and 24) and twice its cost (15,000, 30,000 and 45,000). The ammunition ton rides on the launcher at an eighth of its Battle Value, 11, 14 and 15.

## Thunderbolt Torpedoes

*Custom Homebrew by Lopunny, posted on the QueerTech Discord server.* Lopunny asked for Thunderbolt torpedoes, with
the standard Thunderbolt launcher's statistics, because the big single missile works "really cool as big torpedo's".
Lopunny offered them as a torpedo launcher or as torpedo ammunition for the missile launcher; NGCFells ruled that they
are launchers of their own, as the canon LRT is apart from the LRM. A missile launcher has to vent the motor's
exhaust; a torpedo tube throws its round out on a charge of pressurized gas before the motor lights.

| Item | Thunderbolt Torpedo 5 | Thunderbolt Torpedo 10 | Thunderbolt Torpedo 15 | Thunderbolt Torpedo 20 |
| --- | --- | --- | --- | --- |
| **Weight** | 3 tons | 7 tons | 11 tons | 15 tons |
| **Slots** | 1 | 2 | 3 | 5 |
| **Heat** | 3 | 5 | 7 | 8 |
| **Damage** | 5 | 10 | 15 | 20 |
| **Range** | 5 / 6 / 12 / 18 | 5 / 6 / 12 / 18 | 5 / 6 / 12 / 18 | 5 / 6 / 12 / 18 |
| **Torpedoes a ton** | 12 | 6 | 4 | 3 |
| **Battle Value** | 64 | 127 | 229 | 305 |
| **Cost** | 50,000 C-Bills | 175,000 C-Bills | 325,000 C-Bills | 450,000 C-Bills |

Inner Sphere, introduced 3082 (Lopunny's year), tech rating E. Every figure is the Thunderbolt missile launcher's, as
canon torpedo launchers carry their missile counterpart's figures; the torpedoes cost and count as the standard
Thunderbolt round (50,000 C-Bills a ton). The torpedo fires only when the attacker stands in a Water hex of Depth 1 or
more, at a target in such a hex, with the line of sight traced through Water hexes. Torpedo launchers take only their
own torpedoes, and Thunderbolt missile launchers cannot fire them.

The Federated Suns' water-world navies built the torpedo in 3082. Wet-navy crews call it the heaviest single blow a
submarine or a wading 'Mech can throw.

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

Every Custom Homebrew, Apocryphal and Munchkin item now has its source note, lore, rules, introduction date, tech rating, rules level, cost, and Battle Value (or a stated reason for a 0), and every weapon the Alpha Strike conversion covers has Alpha Strike values. A test, `custom-completeness.test.ts`, fails if a new fan item lacks any of them.
