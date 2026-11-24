# BattleTech Gothic as a Rules Edition, Abominations and Necrotic Structure Implementation Plan (#280, #261)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BattleTech Gothic (CGL 2025) becomes a rules edition of its own, as NGCFells ruled on #280 (2026-10-26: "Gothic materials are sources... but for the Gothic edition of the game. For all of the non-Gothic versions, consider all content from Gothic that is not already in the base non-Gothic games to be apocryphal"). Abominations become a unit kind with their record sheets, play and Biotechnical Readouts; the Gothic supplemental rules (Dazzle Mode Lasers, Expanded Flamers, Abomination Handlers, Frayed MechWarriors) and the 3015 'Mech variants come in; the fan abomination data sheets from #280's post and u/Bookwyrm517's Necrotic Structure (#261, "add as part of Gothic") ride on top at Custom Homebrew.

**Architecture:** A new `battletech-gothic` entry in `btRulesEditions` (`src/data/rules-editions.ts`, after `core-rulebook` ~806) with its own levels; Gothic-only content gets `editions: { "battletech-gothic": ... }` and is Apocryphal (5) elsewhere through the existing per-edition level rules (`getRecordLevelInEdition` ~912). The light blazer already sits in `equipment-energy.ts` ~84 as Gothic-only; it moves under the new edition. Abominations are a new unit kind: a class `src/classes/abomination.ts` (record from the Gothic Abomination Record Sheets, p.64), a creator-free sample list `src/data/gothic-abominations.ts` (the Biotechnical Readout's nine-plus abominations, pp.94-104), a record sheet, a play view, and an Alpha Strike conversion.

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** #280's ruling; `C:/repo/ResourceLibrary/text/BattleTech-Rulebook-Gothic.txt` (contents p.3: Abominations pp.64-78, Supplemental Rules pp.79-80, Scenarios pp.81-90, Weapons and Equipment p.91-93, Biotechnical Readout pp.94-104, TRO 3015), `BattleTechDeluxeRecordSheetsGothic-CGL-2025.txt`, `BattleTech-GOTHIC-Primer-spreads-3-24a.txt`.

## Global Constraints

- Extract first; the Gothic book's tables and record sheets are checked against page images before entry, each image page written back whole into every printing's extract and `_corrected_pages.md`.
- Under `battletech-gothic`, Gothic content is canon at its printed level; under every other edition, Gothic content not already in that edition is Apocryphal (5) (#280 ruling); canon content Gothic shares keeps its own level everywhere.
- Every unit type Gothic prints (memory every-edition-every-rule); a new unit kind gets a TRO Unit Types readout (memory plans-carry-full-checklist).
- Fan content (#280's post, #261) is Custom Homebrew (6), credited to its poster with the link; read the post first (#261 has the thread pasted in its comment of 2026-11-20; #280's post is not saved: Task 6 waits for it).
- Alpha Strike: Gothic prints no AS values, so abomination conversions are inferred, at the abomination's level, `alphaStrike.inferred: true` (memory our-rules-only-at-levels-6-7); Necrotic Structure gets ours at level 6 (memory custom-items-get-as-conversion).
- Condense and extend: the new files are `abomination.ts`, `gothic-abominations.ts`, the abomination sheet and play components, each with its test, and `docs/lore/gothic-tro.md` (the TRO - JBT readout and the Unit Types entry). Everything else extends existing files.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Where Gothic sits in the edition timeline.** Recommended: a parallel edition (2025, its own levels: Gothic prints no level names, so "Gothic" as one Standard level plus Apocryphal / Custom Homebrew / Munchkin), selectable in every creator and roster, never the default.
2. **Abominations in the creators.** Gothic prints no construction rules for abominations. Recommended: no abomination creator; the printed abominations are samples, and fan abominations (Task 6) are entered as records in the same data file.
3. **AS conversion of abominations.** Recommended: inferred conversion from the record as if a ProtoMech-like unit of its size class (move, armor/structure, damage by range from its attacks), flagged inferred; a level 6 option only if NGCFells prefers our own rules instead.
4. **3015 'Mech variants and the Gothic TRO.** Recommended: the TRO 3015 designs (UrbanMech, Firestarter, Phoenix Hawk, Scorpion, Rifleman, Marauder, Atlas, King Crab and the rest) as bundled designs with `battletech-gothic` availability, each checked against the Deluxe Record Sheets.

## Usual checklist

| Item | Task |
|---|---|
| Records with notes, dates, BV, cost (Gothic items; abominations; Necrotic Structure) | 2, 3, 5, 6 |
| Construction (Gothic items offered under Gothic, apocryphal elsewhere; Necrotic Structure) | 2, 5 |
| Record sheet (abomination sheet; Gothic items on 'Mech sheets) | 3 |
| Classic play (abomination movement, attacks, damage, falling, drowning, heat, Frayed MechWarriors, handlers, Dazzle mode, expanded flamers) | 4 |
| Alpha Strike (inferred abomination cards; Gothic items; Necrotic Structure ours) | 3, 5 |
| TRO (Biotechnical Readouts, TRO 3015, the Unit Types readout for abominations, `gothic-tro.md`) | 3, 5 |
| Credits (Gothic credits in `rulesets-attribution.tsx`; the fan posters) | 1, 6 |
| News, review, check, deploy, issue comments | 7 |

## Review Focus

- A Gothic-only item under Total Warfare: offered only at Apocryphal and above, with the "Gothic only" note.
- The light blazer keeps its BV and values (it moves, it does not change).
- Abomination damage and Frayed MechWarrior rules: the book's tables, never TW's.
- Swarmer, Hulk, Giant and Titan classes each follow their own movement and damage rules (pp.66-77).

---

### Task 1: The Gothic edition (#280)

**Files:** `src/data/rules-editions.ts` (the `battletech-gothic` entry, levels, unit types it prints, play rules switches), `src/ui/pages/rulesets-attribution.tsx` (Gothic credit). Test: `rules-editions.test.ts`, `edition-standing.test.ts`.

- [ ] Failing tests: the edition is selectable in every creator and roster; Gothic-only records are canon under it and Apocryphal under TW, BMM and CRB; the light blazer is offered under Gothic at Standard and under TW only at Apocryphal.
- [ ] Run `npx vitest run --project unit src/data/rules-editions.test.ts`, FAIL. Implement. Run, PASS. Commit `BattleTech Gothic is a rules edition of its own (#280)`.

### Task 2: Gothic weapons, equipment and supplemental rules

- [ ] Read pp.79-80 and 91-93 (Weapons and Equipment Table p.93, Abomination-Mounted Weapons Table p.92); list each item and rule in the ledger `.superpowers/sdd/2026-11-22-gothic/progress.md` with its page; mark what exists.
- [ ] One family per commit: failing test (values as printed, Gothic availability, apocryphal elsewhere, AS conversion inferred, TRO line), implement, PASS. Commits `Gothic: <family> (#280)`.

### Task 3: Abominations as a unit kind

**Files:** `src/classes/abomination.ts`, `src/data/gothic-abominations.ts` (Frayed MechWarrior, Gnat, Werebeast, Devil, Cricket, Tyrant, Rampager, Colossus, Troll King, Stone Giant, Ravager and the rest, pp.94-104), the abomination record sheet component, the TRO Unit Types readout, `docs/lore/gothic-tro.md`, the roster group table. Tests beside each.

- [ ] Failing tests: each abomination loads with its printed class, movement, armor, attacks and skills; its sheet renders the Gothic layout (check against the Deluxe Record Sheets); it adds to a CBT roster under Gothic and at Apocryphal elsewhere; its AS card converts, flagged inferred (OWNER CALL 3); its TRO page and the Unit Types readout render.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Gothic: abominations, their sheets, readouts and AS cards (#280)`.

### Task 4: Abomination play

- [ ] Failing tests per rule (pp.64-78): movement by class, weapon attacks, damage from and to abominations, physical attacks, falling, crashing and drowning, heat, Frayed MechWarriors, battlefield support, handlers; the Dazzle mode and expanded flamer options for 'Mechs.
- [ ] Run, FAIL. Implement in the abomination play view and the 'Mech play view. Run, PASS. Commit `Gothic: abomination play and the supplemental rules (#280)`.

### Task 5: TRO 3015 designs and the scenarios (OWNER CALL 4); Necrotic Structure (#261)

- [ ] TRO 3015 designs, each checked against its Deluxe Record Sheet; failing test per design; commit `Gothic: the TRO 3015 designs (#280)`.
- [ ] The three scenarios (Lucidium Monstra, Bug Hunt, Blasphemy!) and the Additional Variations in match play; commit `Gothic: scenarios (#280)`.
- [ ] Necrotic Structure: read the thread pasted on #261 (2026-11-20); record the values in the ledger; failing test (weight, slots, its effect in play, BV, cost, our AS conversion at level 6, TRO line, credit u/Bookwyrm517); implement as a structure type offered with the Gothic edition at Custom Homebrew; commit `Custom Homebrew: Necrotic Structure, with Gothic (#261)`.

### Task 6: Fan abomination data sheets (#280's post)

- [ ] Blocked until the post (u/EasterEggArt, https://www.reddit.com/r/battletech/comments/1wr9gog/) is saved into `C:/repo/ResourceLibrary/scrapes/reddit/1wr9gog.txt` or pasted on #280. Then: each data sheet as a Custom Homebrew record in `gothic-abominations.ts`, failing test, credit, commit `Custom Homebrew: fan abominations from u/EasterEggArt (#280)`.

### Task 7: Checklist, review and ship

- [ ] **News:** bullets for the edition, abominations, the designs, Necrotic Structure.
- [ ] **Check:** `npm run check`; BV survey unchanged under TW.
- [ ] **Review:** astech Opus review. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #280 and #261 in NGCFells' voice; close when done; give the URLs.

## Models

Opus for Tasks 1, 3, 4 (edition rules, new unit kind, play). Sonnet for Tasks 2, 5, 6. Review: Opus.
