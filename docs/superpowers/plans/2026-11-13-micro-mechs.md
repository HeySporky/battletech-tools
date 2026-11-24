# Micro-Mechs Implementation Plan (#173)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan. The owner's
> execution method is **one chunk per session**, each ending with a commit, a ledger entry and a handoff, and the
> session is cleared before the next chunk. Do not run two chunks in one session. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A Micro-Mech (a fan-made 10 to 19 ton walker with one torso) can be built, saved, printed on its own
record sheet, added to a roster and played, with an Alpha Strike card, under the Custom Homebrew rules level.

**Architecture:** A unit type of its own, after the ProtoMech's pattern: one class (`MicroMech`), one construction
data file, one equipment table file, its own creator pages and record sheet. It is **not** a 'Mech type and touches
nothing in `battlemech.ts`: a Micro-Mech has one torso with a 12-slot table, 2- and 3-slot limbs, kilogram weights
in quarter tons, no heat scale, launchers sold by the tube, a 4-weapon limit and its own Battle Value and cost
changes, and `BattleMech` assumes the opposite of each throughout.

**Tech Stack:** TypeScript, React, Vitest. No new dependencies.

**Spec:** issue #173, and the source document below. This plan is Chunk 4 of
`docs/superpowers/plans/2026-11-12-custom-homebrew-batch.md`; that plan's Global Constraints apply here too.

**Source:** "Micro-Mechs", version 6.1.0.2. In the library: `ResourceLibrary/Custom/text/Micro-Mechs6-1-0-2.txt`
(prose) and `Micro-Mechs6-1-0-2.raw.txt` (**read every table from the raw file**: the layout extract scrambles the
columns). The PDF is `JBTIICRework/fan-made/rules-and-variants/MicroMechs602.pdf`. `micromechwarrior.pdf` is a
different work (a short role-playing game) and is not a source for this.

The rules summary, the sample checks and every call made while planning are in the batch ledger
(`.superpowers/sdd/2026-11-12-custom-homebrew-batch/`, entry "Chunk 4"). Read it before Chunk A.

## Global Constraints

- Every Micro-Mech is Custom Homebrew. The creator is offered only at that level or above; a saved Micro-Mech
  still opens and prints below it.
- Read the document before writing a number. A number the document does not give is left out or labelled as ours.
- The document says a Micro-Mech follows the BattleMech rules "except where noted". Where it is silent and a
  number is needed, read the BattleMech rule in the books the document names (BattleTech Master Rules, Revised;
  Maximum Tech; Tactical Handbook) and cite the page read.
- Credit on the creator page, the record sheet and every equipment record's notes, in the wording given in
  owner ruling 1.
- New equipment records go in the Custom Homebrew catalogs with their tags in
  `src/data/__fixtures__/tech-lists.json`. No record is added to, or changed in, a canon catalog.
- No Micro-Mech is written to a MegaMek or Solaris Skunk Werks format.
- No kept bundled design may change. If a bundle test fails, stop for the owner.
- Failing test first. `npx vitest run --project unit src/classes src/data src/utils`, then `npm run check`.
- Commit and push `beta`. Ask the owner before any deploy, `master` fast-forward or news entry.

## Session protocol (every chunk)

As in the batch plan: read the handoff, this plan and the ledger; do the first chunk not marked done; test, commit,
push; append to the ledger what was built and every call that was ours; rewrite the top block of the handoff; stop.

## Models

| Chunk | Work | Model |
|---|---|---|
| A | Construction core: the class, weights, slots, armor, save format | Opus 5.5 |
| B | Equipment table records, mounts, ammunition, heat sinks | Sonnet 5.5 |
| C | Cost, the document's Battle Value and our provisional BV2 | Fable 5.2 |
| D | Creator pages, saves, menus | Sonnet 5.5 |
| E | Record sheet, print, roster | Sonnet 5.5 |
| F | Play mode: damage, criticals, pilot, movement | Opus 5.5 |
| G | Alpha Strike ruleset: design it, then the card | Fable 5.2 |
| H | Sample designs, verify, report | Sonnet 5.5 |

## Owner rulings (2026-11-13)

1. **Credit and reference.** The original author is **Solarmech**. His DeviantArt post "Micro-Mechs for
   BattleTech, Part 1" (Apr 29, 2019; saved in `ResourceLibrary/scrapes/deviantart/`) says he devised them many
   years ago and is posting them to be archived. It names no magazine or fanzine; none of the held ones carries
   the article. The 6.1.0.2 document is another person's revision of a copy found online in late 2000, with
   appendices by Discord. Credit: "Micro-Mechs by Solarmech. This version (6.1.0.2) was revised by an unnamed
   editor with Discord, who wrote the Battle Value, cost and conversion appendices."
   **Ruling (2026-11-13): both texts are offered, as selectable versions** (see Versions below).
2. **Battle Value.** Two figures. The document's own (Battle Value 1 with its changes) for BV1 editions, and a
   **provisional BV2 of ours** for BV2 editions, made by running the document's changes over the BV2 procedure
   (TechManual) with each item's BV2 figure. Both are marked provisional and the notes say the BV2 is ours.
3. **Alpha Strike.** We write an Alpha Strike ruleset for Micro-Mechs (Chunk G). It is ours, marked NOT OFFICIAL.
4. **Samples.** Yes: ship the four designs, the Tunnel Rat with our figures and a note.
5. **Free heat sinks.** Follow the rules text: engine rating / 10, rounded down.
6. **Ranges.** The book's range where a book prints the weapon; otherwise extrapolate, and say so in the notes.
7. **Dates.** No date limit on the chassis; each weapon keeps its own date.
8. **Play mode.** Built in (Chunk F).
9. **Cost rounding (Chunk C).** Round each fraction up and count the ammunition carried: this gives the three sound
   samples' printed costs.
10. **Sample Battle Values (Chunk C).** Keep the rules text. The Storm (223, printed 217) and the Hillman (339,
    printed 352) are not adjusted; the breakdown shows the printed figure beside ours. Our BV2 stays as built.
11. **Alpha Strike (Chunk G, 2026-11-14).** The ruleset in `docs/superpowers/specs/2026-11-14-micro-mech-alpha-strike.md`
    is approved: armor by Alpha Strike's rule, one ability `MCR`, the first Engine Hit as written, type `MM`. Every
    code is explained in our rules, and Micro-Mechs have a TRO - JBT entry with credits (`docs/lore/micro-mechs-tro.md`).
12. **Upper Leg Actuator hit (2026-11-14).** +4 on Piloting Skill Rolls, as the document's Piloting Skill Roll Table
    prints (its critical hit text says +2).
13. **Card heat (2026-11-14).** The Alpha Strike card leaves the heat scale and OV off a Micro-Mech, as an official
    vehicle card does.
14. **Other games (2026-11-14).** Build the Micro-Mech Bay (AeroTech 2 supplement) into DropShip and capital ship
    construction. The RolePlaying and BattleForce 2 appendices, and the bay's emergency play rule, are stubs
    (`src/data/micro-mech-other-games.ts`) for separate tools to come, as Classic BattleTech and Alpha Strike are.
15. **Alpha Strike transport (2026-11-14).** "We have created our own AS rules for these units": the Micro-Mech
    Bay gives its carrier `MMT#`, extrapolated from `MT#` / `PT#`, with the emergency rule in its text (spec
    section 3).

## Versions (owner ruling, 2026-11-13)

A Micro-Mech carries a `version`, chosen first in the creator, saved with the design and printed on the sheet:

- `"6.1.0.2"`: the revised document with Discord's appendices. The default: it is the only complete text.
- `"solarmech-2019"`: the author's own post, "Micro-Mechs for BattleTech, Part 1"
  (`ResourceLibrary/scrapes/deviantart/solarmech-micro-mechs-part-1-795743489.txt`).

One class and one set of pages serve both. Every rule that differs is a field of a per-version rules record
(`MICRO_MECH_VERSION_RULES` in `micro-mech-construction.ts`), never an `if (version === ...)` scattered through the
class. Read each row below in both texts before typing it; the 2019 column was read in the saved post on 2026-11-13.

| Rule | 6.1.0.2 | solarmech-2019 |
|---|---|---|
| Layouts | biped, quad | biped only |
| Structure weight | 10 percent of tonnage | 10 percent, rounded up to the quarter ton (11 t = 1.25) |
| Engine kinds | fusion, ICE | fusion, ICE, industrial fusion, industrial ICE, fuel cell |
| Fusion shielding | x 1.25, up to the quarter ton | x 1.5, up to the quarter ton |
| ICE weight | twice the fusion engine | not stated in Part 1: read the rule it falls back on, cite it |
| Jump jet | 125 kg | 500 kg |
| Heat sink | 125 kg, at most 10 extra | 500 kg, no limit stated |
| Free heat sinks | rating / 10, down | rating / 25, down, at least 3 |
| Power amplifiers (ICE) | 1 ton per 10 tons of energy weapons or part | 10 percent of them, up to the quarter ton |
| Armor | standard | standard or industrial |
| Head armor maximum | 2 x structure | 3 x structure |
| Weapon locations | any | not the head, not the legs |
| Ammunition locations | any | torso only |
| Tech base | Inner Sphere table | any but Clan |
| Sealing in vacuum | fusion | fusion or fuel cell |
| Torso overflow to the cockpit (play) | half | all |
| Gyro hit (play) | bonus lost, rolls 4 worse | rolls +4 |
| Swamp (play) | cannot get stuck | can get stuck, with a +2 bonus |
| Neurohelmet (play) | not mentioned | optional, a further -1 on Piloting rolls |
| ICE in water (play) | floods after two turns under | destroyed at depth 1 without a snorkel; see the post |

The 2019 post has **no equipment table, cost, Battle Value or samples** (it is Part 1 only). Under
`solarmech-2019` the app uses the 6.1.0.2 equipment table, cost and Battle Value rules, and says so on the sheet and
in the notes: "equipment, cost and Battle Value from version 6.1.0.2; the author's own tables are not published".
Where a 6.1.0.2 row leans on a 6.1.0.2 weight (jump jets in the cost formula, heat sinks), the 2019 weight is
used and the note says it is our joining of the two. If a Part 2 of the post is saved later, it replaces the
borrowed tables. The four samples are 6.1.0.2 designs; three are illegal under `solarmech-2019` and are not offered
there.

## Review Focus

- A backup or roster holding a Micro-Mech opened by a build that predates the type: the restore must skip it with
  a message, not fail.
- A user below Custom Homebrew: no menu link, but a saved Micro-Mech opens.
- A design switched from one version to the other: issues listed, nothing silently removed or re-weighed wrong.
- A weight a quarter ton over: reported as an issue, never rounded away. All weights are whole kilograms.
- A torso whose front and rear armor together exceed twice its structure.
- A fifth weapon, a split weapon, a banned item (AMS, hatchet, sword, MASC, Triple Strength Myomer).
- An ICE engine: no free heat sinks, power amplifiers counted, sealed-vacuum note.

---

## Chunk A: Construction core (done 2026-11-13, cloud; ledger `progress-cloud-micro-a.md`)

**Files:**
- Create: `src/data/micro-mech-construction.ts`, `src/classes/micro-mech.ts`, `src/classes/micro-mech.test.ts`

**Interfaces (produces):**
- `MicroMechVersion = "6.1.0.2" | "solarmech-2019"`, `MICRO_MECH_VERSION_RULES`, and on the class
  `getVersion/setVersion` (changing it re-checks the design and reports what is no longer legal; it deletes
  nothing). `MicroMechLayout = "biped" | "quad"`; `MicroMechLocation = "head" | "torso" | "torsoRear" | "la" | "ra" | "ll" |
  "rl" | "fll" | "frl"`; `MICRO_MECH_MIN_TONS = 10`, `MICRO_MECH_MAX_TONS = 19`.
- `microMechStructureTable` (tons, head, torso, arm, leg) and `MICRO_MECH_SLOTS` (fixed and free slots by location).
- `class MicroMech implements IGameSettingsUnit`, with the ProtoMech's method names where the meaning is the same
  (`getTons`, `setTons`, `getWalkMP`, `setWalkMP`, `getRunMP`, `getEngineRating`, `getInstalledEngineRating`,
  `getEngineWeight`, `getStructure`, `getMaxArmor`, `getArmor`, `setArmor`, `getWeightLog`, `getWeight`,
  `getRemainingWeight`, `getIssues`, `getNotes`, `getRequiredRulesLevel`, `export`, `import`, `exportJSON`,
  `importJSON`) plus `getLayout/setLayout`, `getEngineKind/setEngineKind` (`"fusion" | "ice"`),
  `getGyroWeight`, `getCockpitWeight`, `hasLowerArm(side)/setLowerArm(side, boolean)`, `getJumpJets/setJumpJets`,
  `isSealed/setSealed`, `getFreeHeatSinks`, `getSlots(location)`, `getFreeSlots(location)`.
- `IMicroMechExport` and `normalizeMicroMechExport(raw)`, after `normalizeProtoMechExport`.

- [x] **Step 0: Read both texts' construction sections** and fill `MICRO_MECH_VERSION_RULES` from the Versions
  table, correcting the table (and the ledger) wherever the page says otherwise.
- [x] **Step 1: Read** the document's Construction section and both record sheets, and the ledger's summary.
  Confirm each number below against the raw text before typing it.
- [x] **Step 2: Write the failing tests.** The four sample designs are the fixtures. Each line of each sample's
  weight table was recomputed from the rules while planning and agrees with the document:

```ts
const build = (tons: number, layout: "biped" | "quad", walk: number, jets: number, armor: number) => {
    const micro = new MicroMech();
    micro.setLayout(layout); micro.setTons(tons); micro.setWalkMP(walk); micro.setJumpJets(jets);
    micro.setArmorPoints(armor);   // or setArmor per location; see below
    return micro;
};
it.each([
    // name, tons, layout, walk, installed rating, engine kg, gyro kg, structure kg, free sinks
    ["Storm STM-3X", 11, "biped", 6, 70, 2500, 750, 1100, 7],
    ["Tunnel Rat TNR-1X", 13, "biped", 4, 55, 2000, 750, 1300, 5],
    ["Hillman HMN-2X", 15, "quad", 5, 75, 2500, 750, 1500, 7],
    ["Slayer SL-X4", 18, "quad", 5, 90, 3750, 1000, 1800, 9],
])("%s: engine, gyro and structure as the document prints them", (_name, tons, layout, walk, rating, engine, gyro, structure, sinks) => { /* ... */ });
```

  Also: cockpit 1,500 kg; a jump jet 125 kg and one slot, legs and torso only; armor 62.5 kg a point (46 points =
  2,875 kg; 54 = 3,375; 60 = 3,750); the Storm's armor (head 4, torso 16, rear 6, arms 4 each, legs 6 each) is
  legal and is the 11-ton maximum (46), and one more torso point is an issue; sealing weighs what the structure
  weighs; an ICE weighs twice the fusion engine and has no free heat sinks; tonnage 9 or 20 is refused; no Endo
  Steel, Ferro-Fibrous, XL or Light engine exists to choose; a biped has 26 slots (head 2, arms 3, legs 3,
  torso 12) of which 12 are free, 10 with both lower arms; a quad has no arms and four 3-slot legs; the required
  rules level is Custom Homebrew; `importJSON(exportJSON())` round-trips; `normalizeMicroMechExport` rejects
  junk and clamps out-of-range values with an issue for each; a save with no `version` loads as 6.1.0.2.
  Then the same design under `solarmech-2019`, one test per row of the Versions table: an 11-ton structure is
  1,250 kg; a rating-70 fusion engine is 3,000 kg; a jump jet 500 kg; free heat sinks at rating 70 are 3 (at
  least 3) and at 100 are 4; head armor may reach 6; a quad is refused; and switching the Storm to it reports
  the overweight and nothing is removed.
- [x] **Step 3: See them fail.**
- [x] **Step 4: Implement.** Engine weight: the standard fusion weight for the installed rating from
  `mechEngineOptions` (as `ProtoMech.getEngineWeight` reads it), x 1.25, rounded **up** to 250 kg. Installed
  rating: tonnage x Walking MP, rounded up to the next rating the table lists. Gyro: rating / 100, rounded up to
  250 kg. Keep every weight in whole kilograms (armor is counted in points; its weight is points x 62.5, and the
  total must come to a quarter-ton step: an odd half-point lot is an issue, not a rounding). Free heat sinks: rating / 10, rounded down
  (owner ruling 5). The class holds no equipment yet: Chunk B adds mounts.
- [x] **Step 5:** Unit tests and `npm run check`.
- [x] **Step 6:** Commit `Custom Homebrew: Micro-Mech construction core (#173)`, push, ledger, handoff.

## Chunk B: Equipment, ammunition, heat sinks (done 2026-11-13, cloud; ledger `progress-cloud-micro-b.md`)

**Files:**
- Create: `src/data/micro-mech-equipment-custom.ts`, `src/data/micro-mech-equipment-custom.test.ts`
- Modify: `src/classes/micro-mech.ts`, `src/classes/micro-mech.test.ts`, `src/data/__fixtures__/tech-lists.json`
  (only if the records carry catalog tags the fixture pins; check what the fixture covers first)

**Interfaces (produces):**
- `IMicroMechItem { tag, name, kind: "energy" | "ballistic" | "missile" | "equipment", heat, damage, weightKg, slots,
  cost, battleValue, tubes?, family?, canonTag?, ammo?: { shotsPerQuarterTon: [n, n, n, n], costPerTon, bvPerTon },
  notes }` and `microMechItems: IMicroMechItem[]`: one record per table row, values as printed.
- `canonTag` names our catalog record for the same weapon, **for range and date only**; weight, slots, cost and BV
  always come from the document's row.
- On `MicroMech`: `getMounts`, `addMount(tag, location)`, `removeMount`, `getAmmoLots`, `setAmmo(mountIndex, kg)`,
  `getHeatSinks`, `setExtraHeatSinks`, `getEnergyHeat`, `getPowerAmplifierWeight`.

- [x] **Step 1: Read** both tables in the raw text. List in the ledger every row that has no record in our
  catalogs, and the range source found for it (owner ruling 6): the page read in
  Maximum Tech, the Tactical Handbook or a later book, or "extrapolated by us" with the reasoning (for a tube
  launcher size we lack, the range of its launcher family).
- [x] **Step 2: Failing tests.** Pin a spread of rows exactly as printed, at least: ER Small Laser (heat 2,
  damage 3, 500 kg, 1 slot, 11,250, BV 17); Large Laser (8, 8, 5,000, 2, 100,000, 124); Machine Gun (0, 2, 500, 1,
  5,000, 5); LRM 9 (3,600 kg, 2 slots, 99,900, BV 78; 4/7/10/13 shots per quarter-ton step); SRM 6 (3,000 kg, 2
  slots); Recoilless Rifle (Heavy) (325 kg; 6/12/18/25 shots); Grenade Launcher (100 kg; 6/12/18/24 shots);
  Beagle Active Probe (1,500 kg, 2 slots). Count the rows per kind against the table. Then the rules: a fifth
  weapon is an issue; a missile group of any size is one weapon; ammunition comes in 250 kg lots, at least one lot
  per ammunition weapon, at most 1,000 kg a slot; the banned items cannot be mounted; heat sinks (free plus
  extra, at most 10 extra at 125 kg) must cover the summed heat of the energy weapons; an ICE needs a ton of power
  amplifiers per 10 tons of energy weapons or part. And the four samples come to their printed totals: 10,975;
  12,975; 14,975; 17,925 kg, with the Storm at 25 of 26 slots.
- [x] **Step 3: See them fail.**
- [x] **Step 4: Implement.** Records in the single-line shape the custom catalogs use. Every record's notes carry
  the credit. The one-slot ammunition wording contradicts itself in the document (ledger); follow the LB-5X
  example (one slot holds up to 1,000 kg for one weapon class) and say so in the notes.
- [x] **Step 5:** Unit tests and `npm run check`.
- [x] **Step 6:** Commit `Custom Homebrew: Micro-Mech equipment table (#173)`, push, ledger, handoff.

## Chunk C: Cost and Battle Value (done 2026-11-13, cloud; ledger `progress-cloud-micro-c.md`)

**Files:**
- Create: `src/data/calc-steps-micro-mech.ts`
- Modify: `src/classes/micro-mech.ts`, `src/classes/micro-mech.test.ts`

**Interfaces (produces):** `getCBillCost()`, `getCostBreakdown()`, `getBattleValue(edition?)`,
`getBattleValueBreakdown(edition?)`, `isBattleValueProvisional(): true`, through `getBattleValueFor` in
`src/data/battle-value.ts` so a BV1 edition gets the document's figure and a BV2 edition ours, in the step-trace shape #599 uses
(`src/data/calc-steps.ts`), each step citing the document's appendix or the Master Rules page read.

- [x] **Step 1: Read** the document's cost and Battle Value appendices, then the pages they stand on: the cost table
  and the Battle Value procedure in the BattleTech Master Rules, Revised (the document cites pp.149, 152, 157 and
  158; confirm which printing those numbers fit). `docs/superpowers/plans/2026-11-10-cited-bv-ledger.md` and
  `src/data/calc-steps-mech-bv1.ts` already record where the BV1 pages are and how they read.
- [x] **Step 2: Failing tests** for the document's changed rows (cockpit, life support, sensors, the four actuator
  groups, jump jets, sealing, ICE engine; ammunition penalties of 30, 30, 20 and 5; +0.1 on the defensive movement
  factor; no heat steps; part-ton ammunition unrounded).
- [x] **Step 3: Try the three good samples**: Storm 695,853 C-bills and BV 217; Hillman 852,898 and 352; Slayer
  1,073,387 and 531. Where our figure from the rules text agrees, pin it as a test. Where it does not, do **not**
  tune: record both figures and the step where they part in the ledger, show "the document prints N" on the
  breakdown, and bring it to the owner. The Tunnel Rat's printed figures are corrupt and are not targets.
- [x] **Step 4: Provisional BV2** (owner ruling 2). Read the BV2 procedure for 'Mechs (TechManual; the #599 step
  table `src/data/calc-steps-mech-bv2.ts` has the pages). Carry each of the document's changes across, and write
  down in the ledger, one line each, what the change becomes under BV2 and why: tonnage in the defensive rating;
  the ammunition penalties (BV2 counts explosive ammunition per slot, the document per ton: state the conversion
  chosen); +0.1 on the defensive factor; no heat steps, so no heat efficiency limit on weapons; part-ton
  ammunition. Each item uses its BV2 figure from our catalogs through `canonTag`; an item with no BV2 figure
  anywhere keeps the document's figure and the breakdown says so. Every step is `provisional` with a note. Tests
  pin the steps, not a target number: there is no published BV2 to match.
- [x] **Step 5: Implement**, unit tests, `npm run check`.
- [x] **Step 6:** Commit `Custom Homebrew: Micro-Mech cost and Battle Value (#173)`, push, ledger, handoff.

## Chunk D: Creator, saves, menus (done 2026-11-13, cloud; ledger `progress-cloud-micro-d.md`)

**Files:**
- Create: `src/ui/pages/classic-battletech/micro-mech-creator/` (`_router.tsx`, `_statusBar.tsx`, `home.tsx`,
  `chassis.tsx`, `equipment.tsx`, `summary.tsx`), after `protomech-creator/`
- Modify: `src/dataSaves.ts` (`microMechSaves`, `currentMicroMech`, `MAX_MICRO_MECH_SAVES`, backup and restore),
  `src/ui/app-router.tsx`, `src/ui/app-unit-classes.ts`, `src/ui/pages/classic-battletech/_router.tsx`,
  `src/ui/pages/classic-battletech/home.tsx`, `src/ui/components/top-menu.tsx`,
  `src/ui/components/creator-side-menus.tsx`
- Test: a page test beside `chassis.tsx`; a restore test in `src/dataSaves.test.ts`

Follow every place `ProtoMech` is wired (`grep -n -i protomech` over the files above lists them). Reuse the shared
creator components (the game settings block, the status bar pattern); build nothing a second time.

- [x] **Step 1:** Failing tests: the creator link is absent below Custom Homebrew and present at it; a saved
  Micro-Mech opens at any level; a backup with `microMechSaves` restores with a message for each cleaned value.
- [x] **Step 2:** Implement; the chassis page shows the credit and the "fan-made" mark.
- [x] **Step 3:** Unit tests, `npm run check`, then run the app and build the Storm by hand in the creator.
- [x] **Step 4:** Commit `Custom Homebrew: Micro-Mech creator (#173)`, push, ledger, handoff.

## Chunk E: Record sheet, print, roster (done 2026-11-13, cloud; ledger `progress-cloud-micro-e.md`)

**Files:**
- Create: `src/ui/components/svg/micro-mech-record-sheet-svg.tsx` (+ test), `src/ui/components/micro-mech-record-sheet.tsx`,
  `micro-mech-creator/record-sheet.tsx`
- Modify: `src/classes/battlemech-group.ts` (`microMechs`), (`_addMechDialog.tsx` untouched: a Micro-Mech is on no MUL list; the group table adds from saves),
  `roster/_tableGroup.tsx`, `roster/print.tsx`, and a `roster/_microMechGroupTable.tsx`

The sheet follows the document's two record sheets (biped and quad): armor and structure by location with the rear
torso, the slot tables with their die ranges (head 1-3 / 4-6; limbs 1-2 / 3-4 / 5-6; torso two 6-slot columns), the
3-point cockpit armor, six pilot hits, weapons and ammunition, Walk / Run / Jump, and no heat scale. It prints the
play rules as notes in our own words, the credit, and the sheet trademark notice with the NOT OFFICIAL mark.

- [x] **Step 1:** Failing tests (the sheet renders each sample; the roster totals include a Micro-Mech's BV; an
  older roster without `microMechs` still loads).
- [x] **Step 2:** Implement. Play-mode tracking is Chunk F; keep the sheet's boxes addressable for it.
- [x] **Step 3:** Unit tests, `npm run check`, print the Storm and the Hillman and look at both sheets.
- [x] **Step 4:** Commit `Custom Homebrew: Micro-Mech record sheet and roster (#173)`, push, ledger, handoff.

## Chunk F: Play mode (done 2026-11-13, cloud; ledger `progress-cloud-micro-f.md`)

**Files:**
- Modify: `src/classes/micro-mech.ts` (+ test), `src/ui/pages/classic-battletech/roster/play.tsx`
- Create: `src/ui/pages/classic-battletech/roster/_microMechPlay.tsx` (+ test), after `_protoMechPlay.tsx`

**Interfaces (produces):** on `MicroMech`, an in-play state saved with the roster: `getInPlay`, `resetInPlay`,
`applyDamage(location, points, rear?)`, `getArmorLeft`, `getStructureLeft`, `getCockpitArmorLeft`,
`setSlotHit(location, slot, hit)`, `getPilotHits/setPilotHits`, `getShotsLeft/setShotsFired`, `getPlayMovement()`,
`getPilotingModifier()`, `canFireEnergyWeapons()`, `isDestroyed()`.

- [x] **Step 1: Read** the document's rules section again and list each play rule with its effect in the ledger.
- [x] **Step 2: Failing tests**, one per rule, named for the rule, with the play rows of the Versions table tested
  under both versions: damage moves from a limb or the head to the
  torso; half of what goes past the torso structure hits the 3-point cockpit and each cockpit point is a pilot
  hit; the pilot takes no hit from head or ordinary torso damage and 3 from an ammunition explosion (cockpit
  spared by CASE); the head and limb tables roll 1D6 over two or three slots; the first engine hit stops energy
  weapons and the second destroys the unit; a gyro hit loses the +1 and gives -4, no running or jumping; a lower
  leg hit is +2 and -2 Walking MP, an upper leg hit +2 and half MP, cumulative; arm group hits are +2 and +4 to
  hit, not cumulative; a sensor hit is +4 to hit; each jump jet hit is -1 Jump MP; destroyed when the pilot is
  dead, the engine has two hits or the torso structure is gone.
- [x] **Step 3: Implement**, with the play panel showing the sheet's boxes, the current movement and modifiers, and
  the rules that need no tracking (stacking, line of sight, physical attacks, buildings, ejecting) as notes.
- [x] **Step 4:** Unit tests, `npm run check`, play a Storm through a destroyed leg and an engine hit in the app.
- [x] **Step 5:** Commit `Custom Homebrew: Micro-Mech play mode (#173)`, push, ledger, handoff.

## Chunk G: Alpha Strike ruleset (done 2026-11-14, cloud; ledger `progress-cloud-micro-g.md`)

The document converts to BattleForce 2 only. The owner asked for an Alpha Strike ruleset of our own.

- [x] **Step 1: Read** the document's BattleForce 2 appendix; the Alpha Strike conversion rules for BattleMechs and
  for ProtoMechs (Alpha Strike Companion / Commander's Edition conversion chapter; cite the pages read); and how
  `ProtoMech.getAlphaStrikeStats()` and `getAlphaStrikeUnit()` do it in code.
- [x] **Step 2: Write the ruleset** as `docs/superpowers/specs/<date>-micro-mech-alpha-strike.md`: unit type code
  and size; Move from Walk and Jump MP; armor and structure (the document fixes BattleForce structure at 1: say
  whether Alpha Strike keeps that); damage by range band from the weapons, with no overheat value; special
  abilities, including one for each play rule that matters at this scale (pilot in the torso, no heat, cannot be
  swarmed, vehicle for stacking and line of sight); Point Value. Each rule says which it is: taken from the
  document's BattleForce 2 conversion, taken from the Alpha Strike conversion rules, or ours. Check it on the four
  samples against the document's BattleForce 2 lines (the Tunnel Rat's is corrupt).
- [x] **Step 3: Bring the ruleset to the owner** (asked 2026-11-14; the spec is `docs/superpowers/specs/2026-11-14-micro-mech-alpha-strike.md`)
  in one message. Build only after the answer.
- [x] **Step 4: Failing tests, then build:** `getAlphaStrikeStats()` and `getAlphaStrikeUnit()` on `MicroMech`, a
  `print-as.tsx` in the creator, the card marked NOT OFFICIAL with `MulSource` set (#593), and the unit offered in
  the Alpha Strike roster's add page beside the other custom units.
- [x] **Step 5:** Unit tests, `npm run check`, commit `Custom Homebrew: Micro-Mech Alpha Strike rules (#173)`,
  push, ledger, handoff. If the design and the build do not fit one session, stop after Step 3 and say so.

## Chunk H: Samples, verify, report

- [ ] **Step 1:** `src/data/micro-mech-samples.ts` after `pam-samples.ts`, the
  four designs, each with the document's name and a note for every place we differ from its print.
- [ ] **Step 2:** `npm run check`; confirm no bundled design changed (the bundle tests).
- [ ] **Step 3:** Comment on #173 with what is in and what is not (the RPG and DropShip bay appendices). Leave the issue open if anything the owner asked for is still out.
- [ ] **Step 4:** Ask the owner about shipping. No deploy, `master` fast-forward or news entry without the answer.
