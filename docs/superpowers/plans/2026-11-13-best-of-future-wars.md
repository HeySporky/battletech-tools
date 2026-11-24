# Best of Future Wars Implementation Plan (#172, the rest of the fanzine)

> **2026-11-17: Chunks F to L are re-planned in `2026-11-17-future-wars-originals.md`**, against the original
> *Future Wars* issues. Read that plan first; the chunk text below still holds where it does not override it.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan. The owner's
> execution method is **one chunk per session**, each ending with a commit, a ledger entry and a handoff, and the
> session is cleared before the next chunk. Do not run two chunks in one session. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Everything with game use in *The Best of Future Wars, Volume One* comes into the app under the Custom
Homebrew rules level (owner ruling 5, 2026-11-13: "get them all"), with the eleven *Future Wars* 'Mech designs
that the HeavyMetal Pro files name (owner ruling 6).

**Architecture:** Each item goes where its kind lives. Equipment: records in the `*-custom.ts` catalogs, as the
*Future Wars* #32 smoke devices already are (`misc-custom.ts`, `ammo-custom.ts`). Optional play rules: **Special
Rulesets** (`src/data/special-rulesets.ts`, #324), each with an in-app rules summary and, where the rule changes a
number the play panel shows, a tool in roster play. A construction variant (DropShips): a Special Ruleset on the
small craft creator. A new kind of unit (Power Armor): its own read-and-design chunk that writes its own plan. The
campaign, role-playing and scenario articles have no home in the app today: they become a "Future Wars" rules section
under Game Management (our summary, the author's credit, and a calculator or roller where the article does arithmetic
or rolls on a table). The designs: a sample file like the other sample files.

**Tech Stack:** TypeScript, React, Vitest. No new dependencies.

**Spec:** issue #172 and the owner rulings in `2026-11-13-compact-mechs.md`. The batch plan's Global Constraints
apply.

**Source:** `JBTIICRework/magazines/Future Wars/Future Wars Magazine - Best of - Future Wars Magazine.pdf` (scan, no
text layer; in a cloud clone `git lfs pull --include="<path>"`). Printed page = PDF page - 1 up to printed p.35;
PDF 37-44 is an art insert; after it printed = PDF - 9. OCR text:
`ResourceLibrary/text/Future-Wars-Magazine-Best-of-Future-Wars-Magazine.ocr.txt` (form feed = PDF page). **Prose
from the OCR; every number and table from the page image.** The designs: *Future Wars* #33 (text layer) and #32 (OCR),
same folder.

## Global Constraints

- Everything here is Custom Homebrew: fan material from a fanzine (library rule: `magazines` fanzines are
  custom-only). Offered only at that level or above; a saved unit carrying it still opens below it.
- Credit the author as printed and cite the printed page: "<Author>, '<Title>', *The Best of Future Wars, Volume One*
  (1991), p.N". A stat the article does not give is left at the catalog's "unverified" convention or labelled ours,
  with the reasoning, as `misc-custom.ts` does for the smoke devices ("Not printed in Future Wars #32: ...").
- Rules summaries are in our own words, short; no article is reproduced.
- New records in the target catalog layout (`<category>-custom.ts`), tags in `src/data/__fixtures__/tech-lists.json`.
  Never a canon catalog, never canon BV or PV math.
- No kept bundled design may change (the bundle tests). Failing test first. `npx vitest run --project unit src/classes
  src/data src/utils`, then `npm run check`. Commit and push; ask before any deploy or news entry.

## Session protocol (every chunk)

As in the batch plan: read the handoff, this plan and the ledger; do the first chunk not marked done; test, commit,
push; append to the ledger what was built and every call that was ours; rewrite the top block of the handoff; stop.

## Models

| Chunk | Work | Model |
|---|---|---|
| A | Equipment records: Gatling Laser, Long Range Flamer, EII PDS, VHE and Inferno Gauss shells, SABOT, Penitrator | Sonnet 5.5 |
| B | Items that modify another: Pom-Pom (rapid-fire AC), Swing Fire Missile System, Power Booster | Opus 5.5 |
| C | Play effects of A and B in roster play | Opus 5.5 |
| D | Play-rule rulesets: registry entries and rules summaries (five) | Sonnet 5.5 |
| E | Play-rule tools in roster play | Opus 5.5 |
| F | Power Armor: read, design, write its plan | Fable 5.2 |
| G | DropShip construction: read, design, write its plan | Fable 5.2 |
| H | Game Management "Future Wars" section: read and design the four articles | Fable 5.2 |
| I | Build H's design | Sonnet 5.5 |
| J | *Future Wars* #33 designs (nine) | Sonnet 5.5 |
| K | *Future Wars* #32 Pulsars: the Kin weapons, then the two designs | Opus 5.5 |
| L | Verify and report | Sonnet 5.5 |

Chunks A, D, F, G, H and J do not depend on one another. B needs A. C needs A and B. E needs D. I needs H. K needs
the weapons its article defines.

## Review Focus

- A weapon with `battleValue: 0` (unverified): the BV breakdown must not divide by it or drop its heat.
- A Pom-Pom or Swing Fire mount left behind when its weapon is removed: an issue, not a crash or a silent delete.
- Two Special Rulesets that change the same thing (Long Range Wars and anything else touching ranges): refused by
  the conflict rule.
- A roster saved with a ruleset that a later build lacks: opens with a message.

---

## Chunk A: Equipment records

**Files:** `src/data/weapon-custom.ts` (or the energy / ballistic / missile `*-custom.ts` file the registry already
uses for custom weapons: check `equipment-registry.ts` first), `src/data/ammo-custom.ts`, `src/data/misc-custom.ts`,
`src/data/__fixtures__/tech-lists.json`; test `src/data/best-of-future-wars.test.ts`.

| Item | Printed p. | Author | What the page gives (read on the page; confirm every value) |
|---|---|---|---|
| Gatling Laser | 27 | Karl Sanders | damage 2 a hit, 6 shots a round, to-hit as an SRM 6; range 1-2 / 3-4 / 5-6; 4 t; 2 slots; 50,000 C |
| Long Range Flamer + ammo | 28 | Karl Sanders | 5 + 5 heat, then 2 + 5, then 0 + 5 over three turns; range 1-4 / 5-8 / 9-12; 15 shots a ton; heat 8; 5 t; 2 slots; 65,000 C |
| EII Point Defense System + ammo | 8 | Mike Reese | 2 t with 0.5 t ammo built in (50 bursts); 2 slots; an extra ton = 100 bursts; damage 4; MG range, maximum 3 |
| VHE Gauss shell | 9-11 | Chris Congdon | 5 shots a ton; damage 20 / 5; range 1-4 / 5-12 / 13-19 |
| Liao Inferno Gauss shell | 11 | Chris Congdon | 8 shots a ton; 2 damage + 10 heat a turn for 5 turns; range 1-7 / 8-15 / 16-22; critical: 30 heat (20 with CASE) + 1 a shell |
| SABOT shells (autocannon) | 21 | Charles J. Tomaszewski | half damage outside, a quarter inside, rounded up; one SABOT round per five; critical check at +1 (the chart is an image: read it) |
| The Penitrator launcher + missile | 20 | Herb Barents | launcher 3 t (as an SRM 6), on the upper torso; missile 0.5 t; 36-hex range; about 250,000 C a ton; a critical roll per hit; external and internal damage by range (the table is an image: read it) |

- [ ] **Step 1:** Read each page image. Ledger: every figure printed and every one missing, per item. Dates: none are
  printed; the articles set dates in the story (the PDS is "experimental", the VHE shell 3040, the Penitrator a
  captured item). Use the story's year as `introduced` where it gives one and say so; otherwise `null`.
- [ ] **Step 2: Failing tests:** each record's printed values; each is Custom Homebrew; each carries the credit and
  the page; each tag is in `tech-lists.json`; the ammunition feeds its weapon (VHE and Inferno feed the Gauss Rifle;
  SABOT feeds the autocannons the chart lists; LR Flamer ammo feeds the LR Flamer).
- [ ] **Step 3:** Records. Unit tests, `npm run check`.
- [ ] **Step 4:** Commit `Custom Homebrew: Best of Future Wars equipment (#172)`, push, ledger, handoff.

## Chunk B: Items that modify another

| Item | Printed p. | What the page gives |
|---|---|---|
| Rapid Fire Autocannon (Pom-Pom) | 27 | an autocannon conversion: AC weight +5 t, +2 slots, double heat a round, fires twice a round (each shot rolled), range cut 1 / 2 / 3 hexes off its bands, cost +100,000 a gun; prone to breakdown (roll twice on the malfunction table, take the worst) |
| Swing Fire Missile System | 27 | an SRM or LRM rack conversion that swivels 180 degrees: 3 t a rack, 2 slots a rack, 75,000 C; accuracy suffers (read the modifier on the page) |
| Power Booster | 28 | 2 t, 1 slot, 750,000 C; hooked to ONE system (a weapon: extra range and damage by a table; legs: +2 running MP at 1 heat a hex; jump jets: +50 percent jump at double heat); a burn-out roll each use (5 or less fails; two turns running: 9 or less; three: 11 or less; a fourth: burns out; a 2 burns out the system too) |

- [ ] **Step 1:** Find how the app links one item to another (the PPC Capacitor and Artemis links in
  `battlemech.ts`: `grep -n -i "capacitor\|linkedTo\|linkTag"`), and follow it. Read the three pages.
- [ ] **Step 2: Failing tests:** each mount needs its target in the same location; removing the target leaves an issue;
  weights, slots, heat and cost change as the page says; the Pom-Pom's range bands move; the Power Booster's target
  kind picks its effect.
- [ ] **Step 3:** Implement, unit tests, `npm run check`, commit `Custom Homebrew: Pom-Pom, Swing Fire Missile System and
  Power Booster (#172)`, push, ledger, handoff.

## Chunk C: Play effects of the equipment

**Files:** `src/ui/pages/classic-battletech/roster/play.tsx` and its 'Mech play panel; `src/classes/battlemech.ts`
in-play helpers (+ tests).

- [ ] **Step 1:** List each item's play rule in the ledger (LR Flamer burn over three turns and stacking heat up to 10;
  PDS: declare, roll 1D6 (SRM) or 1D6+1 (LRM) missiles stopped, one burst a salvo; Inferno Gauss heat for 5 turns;
  SABOT round count and the +1 critical check; Penitrator critical roll a hit; Gatling Laser's cluster roll as SRM 6;
  Pom-Pom's two shots; Power Booster's burn-out track).
- [ ] **Step 2: Failing tests**, one per rule. **Step 3:** Implement as panel helpers (counters, rollers, reminders).
- [ ] **Step 4:** Unit tests, `npm run check`, commit `Custom Homebrew: Best of Future Wars equipment in play (#172)`,
  push, ledger, handoff.

## Chunk D: Play-rule rulesets

**Done 2026-11-16.** Registry entries in `special-rulesets.ts`; summaries and full tables in
`src/data/future-wars-play-rules.ts`; `FutureWarsRulesReference` shows one, folded, in the Special Rulesets window.
**For Chunk E:** rosters keep rulesets only as search filters, so the play tools read each unit's own rulesets
(`getUnitRulesets`), and `<FutureWarsRulesReference rulesetId=... />` drops into the play panel. The ledger lists the
calls that were ours (Strategic Movement heat per MP beyond normal, morale pass on base or more, malfunction tables
for the four printed kinds only, no ranging cap).

**Files:** `src/data/special-rulesets.ts` (+ test); a summary component per ruleset after
`src/ui/components/battledroids-rules-reference.tsx`.

| Ruleset id | Article | Printed p. | `changes` |
|---|---|---|---|
| `fw-opportunity-fire` | Rules Variant: Opportunity Fire, Charles J. Tomaszewski | 17 | `["firePhase"]` |
| `fw-strategic-movement` | Strategic Movement for BattleTech, H. Barents | 18-19 | `["movementModes"]` |
| `fw-morale` | Stand, I Say!! Morale in BattleTech, H. Barents | 22-26 | `["morale"]` |
| `fw-weapon-malfunctions` | Weapons Malfunctions During Combat, Karl Bruanning | 29 | `["weaponFailure"]` |
| `fw-long-range-wars` | The Long Range Wars, Herb Barents | 55-56 | `["weaponRanges"]` |

Each: `minRulesLevel` Custom Homebrew, `source` with the credit, a description of one or two sentences, and a summary
of the rule in our words (when it applies, what it changes, the numbers). Check the existing `changes` keys and the
conflict rule in `game-settings.ts`: if a canon optional rule in the app already changes the same thing (extreme
range from Tactical Operations, for one), say in the ledger whether the two may be used together and set `changes`
so the answer holds.

- [ ] **Step 1:** Read each article on the page images; the ledger gets each rule's numbers (Strategic Movement:
  x 2 movement on more than four map sheets, no movement modifier, heat 2 + 1 an MP walking and 2 + 2 an MP
  running, 2 MP a hexside turned with a Piloting roll each, no firing, stop when fired on; Opportunity Fire: one
  non-missile weapon during movement, to-hit 6 / 8 / 10, movement 0 / +1 / +2, +2 if the firer moved, the rest of
  the weapons at +1 later; Long Range Wars: extended = 2 x long, extreme = 2 x extended, base 10 and 13, its own
  movement modifiers; the morale and malfunction tables in full from the page).
- [ ] **Step 2: Failing tests:** the five rulesets are registered, Custom Homebrew, credited; two that change the
  same thing conflict; a summary renders for each.
- [ ] **Step 3:** Implement, unit tests, `npm run check`, commit `Custom Homebrew: Best of Future Wars play rulesets
  (#172)`, push, ledger, handoff.

## Chunk E: Play-rule tools

**Done 2026-11-16.** `src/utils/future-wars-ruleset-tools.ts`, `BattleMech.futureWarsPlay` (strategicMovement,
opportunityShot, morale, malfunctions, ranging), the to-hit in `getTargetToHitFromWeapon`, and the panel
`roster/_futureWarsRulesetTools.tsx`. 'Mechs only (ruling); rulings and 9 deferred minors in the ledger.

In roster play, shown only when the roster's ruleset is ticked: Strategic Movement (doubled MP and its heat, a
reminder of what it forbids); Opportunity Fire (an opportunity attack's to-hit); Morale (a check button when a
trigger in the article happens, the result applied as a status on the unit); Weapon Malfunctions (on a roll of 2,
the roll on the weapon's table, recorded on the weapon); Long Range Wars (the extended and extreme bands and their
to-hit shown on each weapon line).

- [ ] **Step 1:** Failing tests, one per tool. **Step 2:** Implement. **Step 3:** Unit tests, `npm run check`, play
  a lance with each ruleset in the app. **Step 4:** Commit `Custom Homebrew: Best of Future Wars play tools (#172)`,
  push, ledger, handoff.

## Chunk F: Power Armor (read, design, plan)

Bill Swisher, "Power Armor: The Poor Man's Battlemech", printed pp.14-16. A 5-, 10- or 15-ton suit built like a
BattleMech (3 slots an arm, 6 a side torso, 2 a leg, none in the center torso; a 0.5-ton waldo, 50,000 C, in place
of a cockpit; no gyro at 5 tons with a piloting limit; 5-ton structure H1 / CT3 / ST2 / A1 / L1; shielding on a
5-ton fusion suit; 5-ton weapons limited to flamers, MGs and small lasers), with play rules (+1 to hit, a one-level
target, 14 suits a hex, its own physical attack and pilot rules).

- [ ] **Step 1:** Read pp.14-16 on the page images; rules summary in the ledger.
- [ ] **Step 2:** Decide the form, and write why in the plan. The candidates: a 'Mech type inside `BattleMech` (its
  locations are a 'Mech's, so the Compact plan's Chunk A slot-count method could carry it), or a unit type of its own
  after the walker plan. Check what the 5-ton Battledroids support already gives (`battledroids-unit.ts`, the
  Battledroids edition's 5-ton engine and structure rules).
- [ ] **Step 3:** Write `docs/superpowers/plans/<date>-future-wars-power-armor.md` with this plan's header and
  protocol and a model per chunk. Bring any question only the owner can answer in one message.
- [ ] **Step 4:** Commit the plan, push, ledger, handoff.

## Chunk G: DropShip construction (read, design, plan)

Mark Stock, "DropShip Construction", printed p.7: a 13-step procedure built on FASA's *DropShips and JumpShips*
(FASA 1619, 1988; two scans are in the library: see `ResourceLibrary/INDEX.md`). Drive tonnage = tonnage / (15 /
thrust); structural integrity tonnage = SI x tonnage / 100; bridge 1 to 10 x crew; engine heat sinks = engine weight
/ a ratio by engine size; bays 150 t; doors 5 t; vehicles 50 / 100 t; passengers and infantry by kind.

- [ ] **Step 1:** Read p.7 and the DS/JS tables it sends you to (thrust points a ton, fuel burn, crew, armor points a
  ton).
- [ ] **Step 2:** Compare with what `src/classes/small-craft.ts` and `src/data/small-craft-construction.ts` build
  today. Decide: a Special Ruleset that swaps the DropShip steps in the small craft creator (`changes:
  ["dropshipConstruction"]`), limited to the eras and editions it fits.
- [ ] **Step 3:** Write `docs/superpowers/plans/<date>-future-wars-dropships.md`, as in Chunk F. Commit, push, ledger,
  handoff.

## Chunk H: The Game Management "Future Wars" section (read and design)

| Article | Printed p. | Author | First reading |
|---|---|---|---|
| A Question on Economics | 33-34 | Herb Barents | resource "dots" on a planet map at 1 million C each, worth more together, paid quarterly: a calculator |
| BattleTech Planetary Assault Rules | 42-52 | Michael Reese | a strategic campaign on a planet (after MegaTraveller and SASS): armies, setup, terrain generation, engagement tables, victory: tables and rollers |
| MechWarrior in a Box | 57-59 | Mark Stock | a square-grid movement and phase system for the MechWarrior role-playing game: a summary with its tables |
| City Raid | 60-61 | Herb Barents | a BattleTech scenario told as a story: read whether it gives forces, map and victory terms; a scenario page if it does |

- [ ] **Step 1:** Read the four articles on the page images; ledger: the rules and tables of each.
- [ ] **Step 2:** Design the section (`src/ui/pages/game-management/future-wars/`): one page an article; what each
  page calculates or rolls; what is summary only. Write it as a spec, `docs/superpowers/specs/<date>-future-wars-
  game-management.md`, with the Chunk I steps (failing tests first).
- [ ] **Step 3:** Commit, push, ledger, handoff.

## Chunk I: Build the section

As Chunk H's spec says. Game Management's home page links the section only at Custom Homebrew. Unit tests, `npm run
check`, commit `Custom Homebrew: Future Wars campaign and role-playing pages (#172)`, push, ledger, handoff.

## Chunk J: *Future Wars* #33 designs

Nine designs, in the HMP folder and printed in *Future Wars* #33 (text layer; stat blocks about lines 2097-2330 of
`ResourceLibrary/text/Future-Wars-Magazine-Issue-033-Future-Wars-Magazine.txt`, record sheets after line 2600):
Yellow Jacket YLJ-01C, Shrew SRH-3W, Spider SDR-IIC, Trebuchet TBT-IIC, Waster WST-3R, JagerMech JM6-IIC, Thing
THN-1G, Shinobi SHI-1A, Poseidon PSD-9A.

**Files:** create `src/data/future-wars-designs.ts` (+ test), like the other sample files; wire it where the samples are
offered.

- [ ] **Step 1:** For each design, read the stat block and record sheet on the page images (the text layer is a lead;
  numbers from the image), credit its author as printed, and note any non-canon item. The HMP file
  (`WorkingData_DEV/HMPdata/hmpFiles/FutureWars/`; in the cloud it is in
  `ResourceLibrary/Custom/cloud-handoff/battletech-tools/WorkingData_DEV.tar.gz`) is a cross-check only: the printed
  page wins, and every disagreement goes in the ledger.
- [ ] **Step 2: Failing tests:** each design builds with no issue, matches its printed tonnage, movement, armor
  per location, weapons and heat sinks, is Custom Homebrew (its standing in the design list), and carries the credit;
  its BV is ours (computed), so the test pins it only after a human check, as the Micro-Mech samples do.
- [ ] **Step 3:** Implement, unit tests, `npm run check`, commit `Custom Homebrew: Future Wars #33 designs (#172)`,
  push, ledger, handoff.

## Chunk K: *Future Wars* #32 Pulsars

The Pulsar (Zaire McCuloghy, #32) is an alien "Kin" 'Mech: its weapons ("Pulse Particle Cannons", "Medium-Range
Lasers/Kin", "Short-Range Laser/Kin"), XL engine, jump jets and armor are Kin items. Read the article
(`Future-Wars-Magazine-Issue-032-Future-Wars-Magazine.ocr.txt` about line 382, and the page image) for the stats of
each Kin item; add each as a custom record (after Chunk A's pattern) or, where it is a canon item renamed, use the canon
record with the article's name in the notes. Then the Pulsar and "Pulsar 2" (find where Pulsar 2 is printed; if it is
not, it is the HMP file's own variant: say so, and enter it only with a note) as in Chunk J.

## Chunk L: Verify and report

- [ ] **Step 1:** `npm run check`; no bundled design changed.
- [ ] **Step 2:** Comment on #172 with what is in and what is not. Ask the owner about shipping.
