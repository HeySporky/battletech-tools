# Sonic Projectors (#645) Design

Approved by NGCFells, 2026-11-22. This is Custom Homebrew (rules level 6), NOT OFFICIAL.

## Intent

Two non-lethal sonic weapons for crowd control, each in a law-enforcement and a military version, and the power dial the
canon Bombast Laser (TO:AUE p.132) prints. NGCFells designed the sonic weapons and their Age of War origin.

**Credit:** NGCFells. The credit goes in each record's notes, the TRO entry and the news bullet.

## Goals

- Two records: a military and a law-enforcement sonic projector, with the stats below.
- A **power dial** in Classic roster play for the Bombast Laser, which has no dial in play otherwise.
- **Stun and rout** on conventional infantry, tracked in play.
- An Alpha Strike conversion for each record (memory custom-items-get-as-conversion), at levels 6-7 only (memory our-rules-only-at-levels-6-7).
- Lore that runs from Terra's 21st century to the Age of War.

## Non-goals and anti-goals

- No real-world brand or product names in records or lore. The TRO says "Terra's early 21st-century sound cannons and pain-beam denial systems".
- The Havana syndrome is lore only. No rule depends on it.
- The sonic projector never kills and never damages armor.

## The records (energy-custom.ts; tech base Inner Sphere)

| Record | Tons | BM slots | Range (min/S/M/L) | Heat | Tech | Prototype | Introduced | Extinct | Reintroduced |
|---|---|---|---|---|---|---|---|---|---|
| Sonic Projector (Military) | 2 | 1 | 0/3/6/9 | 1 | C | 2410 | 2425 | – | – |
| Sonic Projector (Law Enforcement) | 1 | 1 | 0/2/4/6 | 1 | C | 2290 | 2310 | – | – |

- **Mounting.** The sonic projectors mount on BM, IM, CV and SV only.
- **Battle Value and cost** are derived by the Homebrew TRO method (`docs/lore/homebrew-equipment-tro.md`): the military projector is half the canon 'Mech Taser's 40 and 200,000 C-bills, the other non-damaging weapon, for no shutdown effect; the law-enforcement one is half the military projector's, for its shorter range.

## The dial (the Bombast Laser)

The firer sets the dial before declaring the attack. The setting is shown in the attack line, with its heat, to-hit and damage. The Bombast's canon table: damage 7-12, heat equals damage, to-hit +ceil((damage - 7) / 2).

- **Saves.** The picker's last setting is saved per weapon. Old saves default to the top setting, 12.

## Stun and rout

This applies to a Deter hit from a sonic projector on **conventional infantry**:

1. **Stunned troopers.** Roll 2D6. That many troopers are stunned: they don't count for the platoon's damage, and they come back in the End Phase of the next turn. A platoon can't have more stunned troopers than it has living troopers.
2. **Morale.** The platoon then makes a Morale Check (TO:AR pp.180-181, using the suppressing-fire handling). If it fails, the platoon **falls back**: on its next move it must move away from the firer, and it makes no attacks that turn.
3. **Immune:** battle armor, sealed infantry (an environment-sealed armor kit, or a unit with the SEAL special), vehicle crews and 'Mechs.
4. **Alpha Strike.** A CI unit takes no damage. It rolls 2D6 against 8; on a failure it must move away from the firer and cannot attack next turn. BA and sealed units are immune.

## The sonic projector

- **Hail mode:** a loudspeaker with no game effect. It is shown as a mode so scenarios can use it.
- **Deter mode:** stun and rout with 2D6. There is no to-hit modifier and it does no damage.
- **Atmosphere:** it works only in Thin atmosphere or denser, as with the canon *A Time of War* sonic stunner.
- **Who it affects:** standard infantry armor kits halve the dice, rounding down.

## Alpha Strike conversion (ours; levels 6-7)

A new `ESpecialAbilityType.Custom` code, **SNC** (sonic projector, either version): Deter, CI stun and rout. In Alpha Strike the law-enforcement version differs only by its range, shown on the card.

## Lore (TRO entry, records' lore)

- **Before spaceflight:** Terra's sound cannons and pain-beam denial systems of the early 21st century begin the line.
- **Terran Alliance (2100s-2300s):** sonic denial is ordinary police kit on Terra and the colonies. The personal sonic stunner (*A Time of War*) comes from that tradition. The first vehicle-scale sonic projector rides on riot trucks from 2310.
- **Age of War:** military sonic projectors follow in 2425, on vehicles and early BattleMechs.
- **After:** sonic projectors never go away.

## Constraints

- **Editions:** Custom Homebrew rides at the default edition (TW) and is apocryphal after it. The usual catalog `editions` handling applies.
- **Completeness:** the custom-completeness test requires notes, lore, rules, dates, tech rating, rules level, cost, and BV or a reason for none. The TRO entry gets a test that keeps it in step with the records.
- **Check the extract first.** Cite TO:AUE p.132 (Bombast), TO:AR pp.180-181 (Morale Checks) and *A Time of War* p.269 (sonic stunner), each confirmed from the ResourceLibrary extract.
- **Comments on #645 are written in NGCFells's voice.**

## Left to the builder

- The UI layout of the dial picker and the stunned and fell-back markers. Follow the existing roster play blocks.
- The exact BV and cost numbers, by the stated derivations, recorded in the TRO.
- The infantry kit check for "sealed": use whatever the platoon class already exposes for environmental sealing.
