# Quirks, and targeting/tracking and communications systems

Date: 2026-10-21. Status: approved by the user 2026-10-21 (rulings 8-11 added the same day).

## Why

Nothing in the app models quirks. The user wants to build any unit, give it the quirks its lore calls for, see them on
the record sheet, and have them change play. Older lore adds a second layer: every 'Mech's TRO entry names its
targeting and tracking (T&T) system and its communications system, and a 1992 BattleTechnology article rates the T&T
systems with play effects. New quirks keep appearing in new books, and players want homebrew ones, so both must be
easy to add.

## User rulings (2026-10-21)

1. **Scope.** All unit types. Quirks are assigned per the lore, shown on the record sheet, and applied in play.
2. **Alpha Strike follows the book.** Quirks are not shown on the AS data card ("Quirks are not featured on a unit's
   data card", ASC p.8). In AS play only the quirks in the Alpha Strike Companion's list apply, with its AS rules
   ("Design quirks that appear in published sourcebooks, but not in this book, have no effect in Alpha Strike play",
   ASC p.59).
3. **Extensible.** New canon quirks and custom quirks can be added as data, without code, whenever their effect is one
   the app already knows how to apply.
4. **The full Lost Issues article, modules included,** drives play for T&T systems.
5. **T&T and comms systems are line items on units**, and they can carry play effects of their own.
6. **Reaction time is the Initiative roll.** A "−N to reaction time" in the article makes the Initiative roll worse
   by N.
7. **BattleTechnology** (standing ruling): canon in the editions current when the issue was published, apocryphal
   from FanPro's takeover on.
8. **Reaction time averages.** A side's Initiative roll takes the average of its units' reaction-time penalties.
9. **The Lost Issues article is plain canon as long as FASA held the licence:** `battletech-compendium`,
   `battletech-3rd-edition`, `compendium-rules-of-warfare`, `battletech-4th-edition` and `master-rules`. It is
   apocryphal from `master-rules-revised` (FanPro) on.
10. **Quirks are offered under the Core Rulebook (2026).** The CRB does not print them: no "quirk" in either text
    extract, and its Optional Rules Checklist (p.255) lists none. The user ruled they are present or should be, so
    the official quirk records list `core-rulebook`, cited to CO and BMM.
11. **T&T and comms** names come from the SSW files first, then the TROs (Claude's call, confirmed).
12. **Directional Torso Mount's 3-point (turret) version is enforced quad-only** (QuadVees count as quads); the
    2-point version goes on any torso, the CT included.
13. **Trailer Hitch** (SO p.196) is canon in Total Warfare and apocryphal in the editions after it, marked
    "(apocryphal)" in the picker.

## Sources

| Source | Where | What it gives |
|---|---|---|
| Strategic Operations (2008) | pp.193-198 | First official quirk rules: positive and negative quirks with point costs, all unit types |
| Campaign Operations (2016, errata v5.0) | pp.225-234; Positive Quirk Table p.228, Negative Quirk Table after it | The current full list and which unit types each quirk applies to ('Mech, Vehicle, Battle Armor, Fighter/Small Craft, DropShip, JumpShip/WarShip/Space Station, with footnotes) |
| BattleMech Manual (2017, 7th corrected printing) | pp.82-89 rules; pp.90-95 BattleMech Quirk Table | 'Mech quirks with weapon quirks (Accurate, Inaccurate, Stabilized, Jettison-Capable, Exposed Weapon Linkage...); recommended quirks for most canon 'Mechs |
| Technical Readouts from TRO: Prototypes on, ForcePack record sheets and similar | each unit's entry | Official quirks per published unit |
| Alpha Strike Companion (2014, errata v1.5) | pp.59-66 | The AS quirk list, its unit types (BM, IM, CV, SV...) and AS costs |
| BattleTechnology: The Lost Issues (1992, Pacific Rim Publishing, under FASA licence) | "Targeting/Tracking Systems" by Scott Messier, p.60 on | About 85 named T&T systems rated on nine features and four failure ratings, and about 25 expansion modules |
| TRO 2750, 3025, 3026, 3050 and similar; the shipped SSW files | each unit's entry | The T&T and comms system each design carries. The SSW files have `<tandtsystem>` and `<commsystem>` on 508 designs, 67 of them named |

The text extracts of BMM pp.90-95 and CO p.228 are garbled by the two-column layout. Data entry reads those pages
from the PDFs, never from the text.

No rated comms source was found (searched every BattleTechnology issue and the special editions). Comms systems are
named line items for now; a rated source, if found, slots in like the T&T table.

## Goals

- **A quirk catalog.** One data file of official quirk records (positive and negative), with custom quirks in a
  `quirks-custom.ts` file and through the existing custom-content drafts, as for equipment. Each record has:
  - `tag`, `name`, `altNames` (spellings used by SSW, MegaMek and the books);
  - `kind`: positive or negative;
  - `cost`: a number, or a rule for variable costs (per 5 damage, per 7 damage, 1-or-2 choices), as printed;
  - `unitTypes`, as the CO tables grade them, with the footnote restrictions (VTOL only, quads only, light or medium
    with Jump MP ≥ Walk MP...);
  - `attaches`: unit, location, or mounted item (weapon or bay), and whether the quirk needs a parameter such as a
    range band (Improved Targeting Short/Medium/Long) or a value (Rugged 1 or 2, Weak Head Armor N);
  - `editions` (the catalogs model), `book` and `page` for every edition's source, and `custom?: true`;
  - `effects`: a list of typed effects (below);
  - `alphaStrike`: present only when the ASC lists it, with its AS effects and cost.
- **Quirks on units.** Every unit class stores its unit quirks, location quirks and per-mount weapon quirks, keeps them
  in saves and round-trips them. A 'Mech's canon quirks come from the BMM table or its TRO entry; the builder offers
  only quirks valid for that unit type in the selected edition (the catalogs' hide rule).
- **Point balance shown, not enforced.** The builder shows positive and negative point totals and notes the books'
  advice to balance them. It never blocks a design.
- **Eras.** A quirk assignment can carry a date range, for entries like "Bad Reputation (prior to 3025)" (BMM table)
  and the Mackie's Distracting (BMM p.83). It applies when the unit's era is inside the range.
- **T&T and comms systems as line items.** A catalog of named systems; each unit has one T&T system and one comms
  system slot (with "Unknown" allowed, as in the SSW data). T&T records carry the article's nine features, four
  failure ratings and expansion ports; installed modules fill ports. Editions per ruling 7.
- **Record sheet.** Quirks are listed on the Classic record sheet, weapon quirks beside their weapons, with T&T and
  comms systems. Not on the AS card (ruling 2).
- **Play.** Play mode applies every effect, in Classic and (for ASC quirks only) in Alpha Strike.
- **Importers.** SSW and BLK/MTF adapters read and write quirks and the T&T and comms names, matching by `altNames`.

## Effects

A small, closed set of effect types that data can combine:

- target-number modifier: for attacks by the unit, by a weapon, in a range band, against airborne targets, for
  punches or other physicals;
- target-number modifier against the unit (Narrow/Low Profile, jumping...);
- Initiative modifier: per side (Command 'Mech +1, Battle Computer +2, never stacked, CO p.225) and the T&T reaction
  time (rulings 6 and 8): the average of the side's active units' penalties, rounded to the nearest whole number with
  halves rounded toward zero (Claude's call), units with no T&T penalty counting as 0;
- heat generated per turn (Combat Computer −4, floored at 0);
- piloting-roll modifier, with its trigger (fall, kick, jump, skid...);
- critical and damage effects (Weak Head Armor, Exposed Actuators, Protected Actuators...);
- maintenance and cost multipliers, used by the campaign maintenance rules (Easy to Maintain, Rugged, Difficult to Maintain, Non-Standard Parts, Obsolete; CO maintenance chapter);
- a triggered roll with an outcome (Standus 20's false contacts on 4+, the Battle Computer module's 6+ check, T&T
  heat breakdown at each multiple of its threshold, Directional Torso Mount 9+).

A quirk whose rule fits none of these is listed and shown with its rules text and marked "not yet applied in play";
it never blocks a design. Adding a new effect type is the only change that needs code.

## The Lost Issues article in play

- Target Acquisition Modifier on every attack; Multi-Targeting: secondary targets +1 (the article's rule), the
  number of primary and secondary targets as rated.
- Lock-on range; the "*" systems add 5 hexes to every range band, as the article's example shows.
- Heat: a breakdown check each time heat reaches a multiple of the system's rating; Reset gives a reroll, and firing
  after a reset is limited to the 45° forward arc with the reset's reaction-time cost; Override lets the pilot switch
  to a secondary target.
- Repair modifier for the repair rules.
- Expansion modules fill ports, toggle on and off as the module table says, and add their time delay (reaction-time
  penalty) to the unit's Initiative while on.
- Standus 20 and the other noted systems behave as their footnotes say.

## Non-goals

- Custom T&T quirks from the lore beyond the Lost Issues table: a much later TODO (user, 2026-10-21). The catalog's
  `custom: true` path must allow them.

- No quirk stats invented. Every record and every assignment cites a book and page, or a TRO entry.
- No MegaMek code or data copied (GPL). MegaMek files are read only as imports, as today.
- The AS card does not change.

## Open, for the builder

- The CO pages for the maintenance multipliers (its maintenance chapter cites pp.226, 231 and 234; confirm at data
  entry).

## Claude's calls (marked for the user to check)

- **Quirks are an optional rule in play.** The books call them optional and say all players should agree (CO p.225,
  BMM p.82). Play mode gets a per-game "Use design quirks" switch, off by default; the builder and record sheet
  always show them.
- **Quirk editions.** The official quirk records start at `total-warfare` (Strategic Operations, 2008, is a Total
  Warfare-era rulebook) and carry `battlemech-manual` and `core-rulebook` (ruling 10). Earlier editions get them as apocryphal only where a FASA-era
  licensed source supports it, as with the Lost Issues systems.
- **T&T and comms names come from the SSW files first** (confirmed, ruling 11), then from the TROs, with `altNames` for the spellings that
  differ ("Targa-7, Vid-Com-17" for the article's "Targo 7/Vid Cam 17", "Dalban Hi-Rez" for "Dalban HiRez").
- **File names, field names and effect type names** are the builder's.
- **Delivery order:** the quirk catalog and storage on units first, then the record sheet and importers, then the play
  effects, then the T&T and comms catalog and the article's rules. Each is its own plan task with its own tests.
