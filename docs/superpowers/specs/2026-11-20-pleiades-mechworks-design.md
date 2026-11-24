# Pleiades Mechworks fan equipment (#640, #641): design

Date: 2026-11-20. Issues: #641 (Blue Saviour Dispersion Field, Boosted Autocannon Rounds, "Personal" ECM Suite,
Autocannon/12), #640 (Pilot Suit and its cockpit), plus the Hardsuit and VTOL Hardsuit battle armor the Pilot Suit
builds on. All by u/PleiadesMechworks on r/NormalBattletech; the owner pasted the posts and the two record sheets.

## Intent

The owner files fan content as issues so the tools carry it, and has ruled that every open issue is built in full
("If it is there we are building it"; "I want them all. Everything."). For this batch the owner said: **play effects,
and everything is able to be used from play.** So each item must be buildable in the 'Mech / battle armor creators,
priced (Battle Value, cost), printed, dated, described (Lore and Rules), converted for Alpha Strike where it carries
damage, and must do what its rules say in roster play.

Success: a player can build a 'Mech with any of these, take it into roster play and have the tool apply the rules
(heat, damage, ranges, rolls, explosions, skill modifiers) without house-keeping by hand beyond what canon equipment of
the same kind already asks of them.

## Goals

- Every item below is in the catalog at the Custom Homebrew level, credited to u/PleiadesMechworks, with the post's
  numbers where the post gives them and our derived numbers (marked "ours") where it does not.
- Each passes `custom-completeness.test.ts` (notes, lore, rules, level, date, tech rating, BV or a zero rule, cost,
  Alpha Strike where in scope) and appears on the TRO - JBT card "Community Homebrew and Apocryphal Equipment"
  (`docs/lore/homebrew-equipment-tro.md`).
- Roster play applies each item's rules (below).
- The two Hardsuits are ready-made battle armor designs that load in the battle armor creator and in roster play.
- The source posts and the two sheet images are saved in `C:/repo/ResourceLibrary/scrapes/reddit/` with a CREDITS
  line (u/PleiadesMechworks; commenters only where an idea of theirs is used).

## Sequencing (owner, 2026-11-20)

Roster play has no electronic warfare today (no ECM, AMS, Artemis, Narc, C3, probes or stealth to-hit, for canon units
either). The owner chose to build the whole E-War layer in play (separate design, phases 0-3) and to do this small
batch FIRST. So this batch ships everything except the parts that need E-War play:
- Personal ECM: catalog, construction, BV, cost, lore, sheet now; its play effect lands with E-War phase 2 (ECM).
- Blue Saviour: everything now except "treated as having AMS against missiles" (E-War phase 1) and "inside a hostile
  ECM field" (E-War phase 2). Until then the play view shows those two as reminder lines; the E-War phases replace
  the reminders with the real effect.

## Non-goals

- General Reflective Armor play rules beyond its energy halving (see Blue Saviour).
- Any E-War play (ECM, AMS) beyond the reminder lines above.
- An LB-X or other variant of the AC/12 beyond what is listed under "Open for the owner".
- New Alpha Strike special abilities for Blue Saviour or the Pilot Suit (canon Blue Shield has none either).

## Anti-goals

- Copying a canon record's numbers and calling them the author's. Anything not in a post is "ours" and says so.
- A play effect that silently changes canon units. Every play hook is a no-op unless the unit mounts the item.
- Taking the sheets' printed BVs on trust: the builder computes BV; any gap from the sheet is noted, not forced.

## Constraints

- Work in `C:/repo/btt-rebuild`, branch `bv-gaps` (= origin/beta). `npm run check` green before push; deploy with
  `git deploy-beta`; a news bullet in the current news entry.
- TDD: each behaviour has a failing test first (repo practice since Batch Chunk 6).
- Follow the Batch Chunk 6 pipeline: catalog files `ballistic-custom.ts`, `ammo-custom.ts`, `misc-custom.ts`;
  derived values via `derived-values.ts` / `derived-custom-values.ts` (`DATING_RULES`); Alpha Strike via
  `derived-alpha-strike.ts`; lore/rules via the item records or `custom-lore-rules.ts`; play rules modelled on
  `src/utils/future-wars-play.ts` (state that survives save/load and clears with the game).
- **Condensed (owner):** reuse and extend existing files; no new file per item. Records go in the existing custom
  catalog files; play rules extend `src/utils/future-wars-play.ts` (its header widened to "fan equipment play rules")
  and the 'Mech's existing fan play state in `battlemech.ts`; tests go in the existing
  `custom-homebrew-reddit-batch.test.ts` and `battlemech-best-of-future-wars-play.test.ts`. A new file only where
  nothing fits, with the reason in the plan.
- Reddit cannot be fetched by our tools; the pasted text and images are the source.
- Bash heredocs containing an apostrophe are blocked by a hook: write script files.

## Approaches considered

1. **Batch Chunk 6 pipeline, with play hooks like Fanzine Chunks C/E (chosen).** Records in the existing custom
   catalog files, derived values by the existing method, play rules in a small play-rules module wired into the
   'Mech's play state and the roster play page. Fits everything already built; tests and readout already exist.
2. Text-only house rules (Rules field, no play hooks). Rejected: the owner asked for everything usable from play.
3. A separate "fan content" area with its own catalog. Rejected: duplicates the custom catalog and its guards.

## The items

### Autocannon/12 (#641)

Post gives: Inner Sphere, ballistic direct fire, 3020 (Federated Suns), heat 4, damage 12, no minimum, range 4/8/12,
13 t, 7 slots, 8 shots a ton, cost 300,000 (unloaded), ammo 10,000 a ton, BV 142, ammo BV 18 a ton. It "headcaps"
(author's reply: 12 damage to the head is allowed, no reduction).
- Records: weapon + standard ammunition. Era: introduced 3020, Federated Suns origin in lore/notes.
- Lore: the post's text (Flying Foxes, clanbuster mercs, later superseded by the AC/15).
- "The full range of specialist ammunition would be developed for its use": AC/12 versions of all seven AC/10
  munitions in the catalog (Standard, Armor-Piercing, Precision, Flechette, Flak, Tracer, Caseless), each derived from
  the AC/12 standard round by the same canon rule that turns AC/10 standard into that munition (shots a ton, BV and
  cost multipliers), "ours". Plus the Boosted round below.
- Alpha Strike: derived by `derived-alpha-strike.ts`.
- Play: an ordinary weapon; nothing new.

### Boosted Autocannon Rounds (#641)

Post gives, per weapon: minimum / short / medium / long range, extra heat on firing, shots a ton, BV per ton:

| Weapon | Min | Short | Med | Long | Extra heat | Shots/ton | BV/ton |
|---|---|---|---|---|---|---|---|
| AC/2 | 4 | 10 | 20 | 30 | 2 | 22 | 6 |
| AC/5 | 3 | 8 | 16 | 24 | 2 | 10 | 12 |
| AC/10 | 1 | 7 | 14 | 21 | 3 | 5 | 21 |
| AC/12 | 1 | 5 | 10 | 15 | 4 | 4 | 22 |
| AC/20 | 1 | 4 | 8 | 12 | 5 | 2 | 29 |

Not for light autocannons; damage unchanged. The table lists standard autocannons only, so Boosted ammo is made for
those five (IS standard ACs and the AC/12); not for LB-X, Ultra, Rotary, HVAC or light ACs.
- Records: one ammunition record per weapon. Cost per ton and dates are ours (cost from the standard ammo by a
  multiplier from the nearest canon special munition; date before Precision ammunition, which the lore says it
  inspired, set by a `DATING_RULES` line). Tech base Inner Sphere.
- Play: play already takes range bands from the selected bin (`ammoProfile.range` in `getTargetToHitFromWeapon`), so
  each Boosted record carries its bands and minimum there. New: an extra-heat field on the ammo profile, added to the
  weapon's heat when it fires from that bin. Mixed bins: the bin selected for the weapon decides.

### "Personal" ECM Suite (#641)

Post gives: same ECM capabilities as a Guardian ECM Suite, but only in the hex of the unit mounting it; no ECCM mode
(advanced rules); does not count as an ECM suite for armor that needs one (Stealth Armor). 0.5 t, 1 slot,
200,000 C-Bills, defensive BV 20.
- Record: Inner Sphere. Date ours (the lore: built from the Nighthawk's 2720 battle armor ECM, before the Mechworks
  could build battle armor itself). Tech rating ours from the Guardian.
- Construction: Stealth Armor's ECM requirement does not accept it.
- Play: E-War phase 4 (2026-11-21): the board names the friendly units in its hex and they count as inside friendly ECM while the suite works; no ECCM mode. Nothing in this batch.

### Blue Saviour Dispersion Field (#641)

Post gives:
- 5 t; one slot in every location, head included. 3151 (development halted by the Pleiades War), Taurian Defense
  Forces only.
- Switched on or off in the End Phase of any turn. While active: 7 heat a turn; damage from all non-capital energy
  weapons, incoming AND outgoing (infantry particle weapons included), is halved, rounded down, minimum 1; missiles
  are treated as if the unit had an anti-missile system (TW p.129); the unit counts as inside a hostile ECM field
  (TW p.134) it cannot negate with ECCM; Null-Signature System and Stealth Armor give no stealth benefit; the unit
  cannot be hidden (TW p.259). Autocannons and Gauss are not affected.
- With Laser Reflective Armor: halve for the Blue Saviour and round down, then halve again for the armor and round
  down (Heavy PPC 15 -> 7 -> 3).
- Failure: the first 6 active turns in a scenario (not necessarily consecutive) are safe; from then on, roll 2D6 at
  the start of each turn it is active; the target is 2 plus 1 for each active turn after the sixth; a roll **less
  than** the target fails it, and it stays off for the rest of the scenario.
- Critical hit on one of its slots while active: a 5-point ammunition explosion in that location (CASE contains it as
  for ammunition; MechWarrior feedback damage as an ammunition explosion), and the system is dead for the scenario.
  Later hits on its slots: no explosion, no effect. Inactive (off or failed): no explosion.

Records: Inner Sphere, prototype 3151, no production date; Taurian-only in notes/lore. Cost, BV and tech rating ours
(from Blue Shield: 1,000,000 C-Bills, rating E, BV rule TO:AUE p.192-194), the derivation written in the notes.
Construction: 'Mechs only, like Blue Shield; one slot in each location, head included (`spreadLocations: "all"`).

Play (all state saved with the force and cleared with the game, like `future-wars-play.ts`):
- An on/off control on the 'Mech's play view, usable in the End Phase. Shown only on a 'Mech that mounts it and has
  not lost it.
- Heat: +7 in the heat phase for a turn it was active.
- Active-turn count per game ("scenario" = one game; the count clears when the game is cleared, like the other fan
  play state); at the start of each turn it is active after the sixth, the tool takes (or rolls) the 2D6 and
  applies the failure.
- Outgoing: the 'Mech's non-capital energy weapons (catalog energy weapons: lasers, PPCs, flamers, plasma, and
  infantry particle weapons) show halved damage on their attack row while active, per hit, round down, minimum 1.
- Incoming: the take-damage dialog gains one "attacking weapon" control (energy / other). Energy damage entered for
  one hit is halved for an active Blue Saviour, then halved for Laser Reflective Armor (armor-type lookup; applies
  whether or not a Blue Saviour is fitted, as Reflective's own energy halving), each round down. The damage log
  records the entered and applied amounts. Two Blue Saviour units: the attacker's row halves, the defender's dialog
  halves again, so a quarter (each field is crossed once). Plasma: only the damage is halved, not its heat.
- Reminder lines while active: "missiles: treat as AMS" and "inside a hostile ECM field, no ECCM" now play in E-War phase 4
  (the lines stay only under an edition with no E-War rules). Also shown now: "stealth off" (when it has Null-Signature or Stealth Armor)
  and "cannot be hidden".
- Critical hit on a Blue Saviour slot: if active and not yet exploded, the 5-point explosion through the existing
  ammunition-explosion path (CASE, MechWarrior damage), head slot included, and the system marked dead; otherwise
  nothing.

### Pilot Suit and its cockpit (#640)

Post gives: a cockpit of 5 t including the Pilot Suit, always with a full-head ejection system. With a MechWarrior in
the suit: -1 to all Piloting and Gunnery rolls. It cannot be piloted without the suit (it has no ordinary controls).
A 'Mech with it need not mount a gyro, but without a gyro it cannot stay standing if the pilot is knocked out.
Prototype, alpha testing at 3151, stored after the Pleiades War. Built by reverse-engineering a Word of Blake Gestalt
cockpit.
- Record: a cockpit type next to the Interface Cockpit (`mech-cockpit-types.ts`), Inner Sphere, prototype 3151,
  rules level Custom Homebrew. Slots as the Interface Cockpit's (the post gives none; ours). Cost and BV ours: the
  -1/-1 counts through the pilot skill used for BV (as the existing cockpit skill adjustment does for Enhanced
  Imaging) if the BV code allows it; otherwise a multiplier derived from the skill table, written in the notes.
- Construction: carries a full-head ejection system with it (no separate item, no extra cost or weight; the 5 t
  covers it); allows "no gyro" as the Interface Cockpit does; the Interface Cockpit's placement limits exactly
  (BattleMechs only, head, the unit types it allows). A no-gyro 'Mech has no gyro hits; Piloting rolls are otherwise
  as normal.
- Play: Piloting and Gunnery are 1 better (through the existing cockpit skill adjustment in `battlemech.ts`); the
  full-head ejection control is available; play has no standing/prone state, so a no-gyro 'Mech shows the line
  "falls if the MechWarrior is knocked out (no gyro)".
- Lore cross-links to the Hardsuit and the Blue Saviour.

### Hardsuit and VTOL Hardsuit (battle armor designs, for #640)

From the sheets:
- **Hardsuit PA(L)**: Inner Sphere, squad of 5, ground MP 3, jump MP 3, 2 Armored Gloves, 1 Fuel Tank, Mission
  Equipment Storage 45 kg, Standard (Basic) armor 2 points a trooper, Mechanized / Swarm / Leg / AP all yes, sheet BV
  63 (printed "63/9"). Late 2760s: introduced 2768 (ours). About half a million C-Bills a suit (the post).
- **Hardsuit PA(L) VTOL**: Clan technology (the post), 3083, squad of 5, ground MP 3, VTOL MP 7, 2 Armored Gloves,
  Mission Equipment Storage 10 kg, no fuel tank, 2 armor, all four yes, sheet BV 84 (printed "84/12").
- Both printed BV pairs are 7 to 1 (63 = 9 x 7, 84 = 12 x 7), which looks like a seven-trooper figure, not five. The
  designs ship with our computed BV and cost; the sheet's figures go in the notes with the gap.
- VTOL Hardsuit tech base Clan (the post). First step of the plan: confirm the creator allows Clan VTOL on a PA(L)
  suit (TM pp.164-165); if it does not and the book allows it, fix the creator; if the book forbids it, stop and ask
  the owner.
- Built in the battle armor creator (all parts exist: PA(L), Armored Glove, Fuel Tank, variable Mission Equipment,
  Clan VTOL) and stored with the other ready-made custom designs so the unit search and roster can add them.
- Lore: the posts' text (noble thrill-seekers, Mechworks security teams, the Flying Foxes pilot, the 3083 VTOL
  version easier to fly than the Sylph).

## Left to the builder

- Exact file placement within the existing custom catalog files and play modules.
- The derived numbers (cost, BV, dates, tech ratings) by the existing method, each with an "ours" note.
- How the incoming-damage choice looks in the take-damage dialog, kept to one control.
- Tests per behaviour above; readout rows; news bullet wording.

## Calls made in design (not the owner's; check while reading)

- Boosted ammo only for the five standard autocannons in the post's table.
- AC/12 gets all seven AC/10 munitions, derived.
- Energy halving per hit, round down, minimum 1; both fields on one shot = a quarter.
- Reflective Armor's energy halving applies in play generally (the dialog asks the weapon type anyway).
- Blue Saviour failure count per game.
- Pilot Suit: Interface Cockpit slots and placement limits.
- Hardsuit introduced 2768; designs ship with computed BV.

## Open for the owner

Nothing. (Builder check 2026-11-20 answered; the only owner question, E-War play, was answered: build it all, after
this batch.)
