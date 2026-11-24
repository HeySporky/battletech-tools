# Quirks Plan 4: Targeting/Tracking and Comms Catalog, Lost Issues Rules (#98, #99)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, NGCFells' standing choice) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The last part of the quirks design: a catalog of named targeting/tracking (T&T) and communications systems, one of each on every unit, and the BattleTechnology "Lost Issues" T&T rules applied in play. Then (#99) custom T&T systems drawn from the lore, on the same records.

**Architecture:** The units already store the names as free text in the TRO (`TroProductionKey` "targeting" and "communications", `src/data/technical-readout-interfaces.ts:20`). A new catalog resolves those names (by `name` and `altNames`) to records holding the article's nine features, heat threshold, repair modifier, reset and override, plus the expansion modules. Play reads the resolved record through the quirk effects module, behind the force's existing `quirksInPlay` switch, so nothing changes for a game that does not use quirks.

**Tech Stack:** TypeScript, React class components, Vitest (run from PowerShell).

**Spec:** `docs/superpowers/specs/2026-10-21-quirks-design.md`, sections "T&T and comms systems as line items", "The Lost Issues article in play", "Non-goals" (the #99 custom quirks) and rulings 4, 5, 6, 8, 9 and 11.

## Source

- BattleTechnology Special Edition: The Lost Issues (1992), "Targeting/Tracking Systems" by Scott Messier. Only the OCR extract has text: `C:/repo/ResourceLibrary/text/BattleTechnology-Special-Edition-The-Lost-Issues.ocr.txt` (the `.txt` and `.raw.txt` are empty). The standard package table starts near line 5275, the failure table (Heat, Repair, Reset, Override) near line 5466, the module descriptions near line 5509, the footnotes (the "*" range systems, Standus 20's false contacts) near line 5371-5394.
- The OCR table rows are tab-split and some rows wrap (ALEXIS PHOTON TARGET ACQUISITION SYSTEM). Check every row against the page image before entering it; each image page goes back WHOLE into the `.txt` extract (it is empty today, so the page is written fresh) and is logged in `_corrected_pages.md`.

## Global Constraints

- Extract first; page image only where the OCR is missing, garbled or in doubt (here: every table page, since the table is the data). Each image page goes back whole into every printing's extract and `_corrected_pages.md`, then ResourceLibrary is pushed.
- Ruling 9: the article is plain canon while FASA held the licence. Its records carry `editions` for the FASA-era editions (BattleTech Compendium, BMR, BMR(R)) at the article's level and are apocryphal from Total Warfare on (memory removed-items-stay-apocryphal: never dropped).
- Ruling 11: names come from the shipped SSW files first (`<tandtsystem>`, `<commsystem>`), then the TROs. `altNames` carry the other spellings ("Targa-7, Vid-Com-17" for the article's "Targo 7/Vid Cam 17").
- No comms system has a rated source. Comms records are named line items with `rated: false` and no effects.
- Condense and extend: one new data file, `src/data/tandt-systems.ts` (T&T records, modules and comms names; there is no existing catalog of this record shape), with its test beside it. Everything else extends existing files.
- Every edition the article covers, every unit type that has a T&T system in the SSW/BLK data ('Mechs first; vehicles and aerospace read the same TRO keys).
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (plan is written to the recommended answer)

1. **A separate switch for the T&T rules?** Recommended: no new switch. The force's `quirksInPlay` switch ("Use design quirks") turns them on too, since the design spec files T&T under quirks. A unit whose system is "Unknown" or not in the catalog plays with no T&T effects.
2. **Reaction time (Initiative).** Spec ruling 8 already decided: the average of the side's active units' penalties, halves toward zero. No new call.
3. **#99 custom T&T systems.** Recommended: Task 6 lists every T&T or comms system the TROs describe with a behaviour (for example a system "known for losing lock in heavy rain") as a proposal table on #99; you pick, then they go in as `custom: true` records at Custom Homebrew (6) with our effects. Nothing is invented before you approve the list.

## Usual checklist

| Item | Task |
|---|---|
| Catalog records with notes, source, dates, editions | 1 |
| Units: resolve the system from the TRO names; the creator TRO step offers a picker | 2 |
| Record sheet line (T&T and comms beside the quirks) | 3 |
| Classic play: TAM, multi-targeting, lock-on range, heat breakdown, reset, override, modules, Initiative | 4, 5 |
| Alpha Strike | none: spec ruling 2 keeps quirks off the AS card, and the article has no AS meaning (stated in the records) |
| TRO entry | 3 (the TRO sheet prints the resolved system with its source) |
| Credits | Scott Messier and BattleTechnology in the records' notes and the TRO line |
| News, review, check, deploy, issue comment | 7 |

## Review Focus

- A design whose TRO says "Unknown" or a misspelled name: no effects, no crash, the sheet prints the name as typed.
- A force with quirks off: no attack, heat or Initiative number moves (pin with the existing roster tests).
- Heat breakdown fires at every multiple of the threshold reached this turn, once each, not every turn the unit stays hot.
- The "*" systems add 5 hexes to every range band for lock-on only, not to the weapons' range brackets.
- A saved design loads byte-for-byte the same (the system is resolved, never written back over the TRO text).

---

### Task 1: The catalog

**Files:**
- Create: `src/data/tandt-systems.ts`, `src/data/tandt-systems.test.ts`
- Modify: `src/data/quirk-interfaces.ts` (the record types, beside `IQuirk`)

**Interfaces (produces):**
- `interface ITandTSystem { tag: string; name: string; altNames: string[]; tam: number; tamEnergyOnly?: boolean; primaryTargets: number; secondaryTargets: number; targetId: boolean; damageId: boolean; lockOnIndicator: boolean; scanArc: 45 | 90 | 180 | 360; scanType: 1 | 2 | 3 | 4 | 5 | 6 | 7; lockOnRange: number; rangeBonus?: number; expansionPorts: number; heat: number; repair: number; reset: boolean; override: boolean; footnote?: string; editions: string[]; book: string; page: number; notes: string; custom?: true; }`
- `interface ITandTModule { tag: string; name: string; ports: number; reactionTime: number; effects: QuirkEffect[]; notes: string; }`
- `interface ICommsSystem { tag: string; name: string; altNames: string[]; rated: false; notes: string; }`
- `findTandTSystem(name: string): ITandTSystem | undefined`, `findCommsSystem(name: string): ICommsSystem | undefined` (case- and punctuation-blind match on `name` and `altNames`; "Unknown" and "" return undefined).

- [ ] **Step 1: Read the table pages** (extract, then page images) and write every row into the ledger `.superpowers/sdd/2026-11-22-quirks-plan-4/progress.md` first.
- [ ] **Step 2: Write the failing tests:** the RCA Instatrac Mark XII is `{ tam: 0, primaryTargets: 1, secondaryTargets: 3, targetId: true, scanArc: 90, lockOnRange: 31, expansionPorts: 5, heat: 10, repair: 1, reset: true, override: true }`; the Sloane 220 Lockover has TAM -2 and 2/6 targets; Standus 20 carries its false-contact footnote; `findTandTSystem("Octagon Tartrac, System C")` and `findTandTSystem("RCA Instatrac Mark XII")` (the two SSW fixture names, `src/data/ssw/sswTestFixtures.ts:91,715`) resolve; `findTandTSystem("Unknown")` is undefined; every record has `book`, `page` and `editions`; every SSW `<tandtsystem>` name in the bundled 'Mechs either resolves or is listed in a `TANDT_UNMATCHED` array with a reason (so the gap is visible, not silent).
- [ ] **Step 3: Run** `npx vitest run --project unit src/data/tandt-systems.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 4: Enter the records** (all standard packages, all modules, the comms names found in the SSW files).
- [ ] **Step 5: Run** the test. Expected: PASS.
- [ ] **Step 6: Commit** `Quirks: targeting/tracking and comms catalog from The Lost Issues (#98)`.

### Task 2: Units resolve their systems; the creator picker

**Files:**
- Modify: `src/classes/technical-readout.ts` (add `getTandTSystem(): ITandTSystem | undefined` and `getCommsSystem()`, read from the "targeting" and "communications" production values)
- Modify: `src/ui/components/creator-tro-pages.tsx` (the production fields: a datalist of catalog names for the two keys; free text still allowed)
- Test: `src/classes/technical-readout.test.ts`, `src/ui/components/creator-tro-pages.test.tsx`

- [ ] Failing tests: a TRO with targeting "RCA Instatrac Mark XII" returns that record; "Unknown" returns undefined; the TRO step shows the catalog names as suggestions and keeps a typed unknown name.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Quirks: units resolve their T&T and comms systems (#98)`.

### Task 3: Record sheet and TRO lines

**Files:**
- Modify: `src/utils/quirk-sheet-lines.ts` (`getQuirkSheetLines` gains a T&T line "T&T: <name> (TAM -1, 2/2, lock-on 31)" and a comms line; unknown names print as typed with no ratings)
- Modify: the TRO sheet component that prints the production keys (grep `communications` in `src/ui/components`)
- Test: `src/utils/quirk-sheet-lines.test.ts`

- [ ] Failing tests for both lines and the unknown case. Run, FAIL. Implement. Run, PASS. Commit `Quirks: T&T and comms on the record sheet and TRO (#98)`.

### Task 4: The article in play (attacks)

**Files:**
- Modify: `src/utils/quirk-effects.ts` (new `getTandTToHit(system, context: IQuirkAttackContext & { targetIndex: number; energyWeapon: boolean }): { modifier: number; labels: string[] }`, and `getTandTLockOnRange(system): number`)
- Modify: `src/utils.ts:1177` area (the 'Mech to-hit path that already adds `getQuirkToHit`) and `src/ui/pages/classic-battletech/roster/_vehiclePlay.tsx:296` (the vehicle path)
- Test: `src/utils/quirk-effects.test.ts`

- [ ] Failing tests: TAM applies to every attack (energy only where the footnote says so); a secondary target adds +1 (the article's rule) and a target past the system's primary+secondary count cannot be attacked (the to-hit returns an "out of targets" label); lock-on range for a "*" system is base + 5. Nothing applies when `quirksInPlay` is false.
- [ ] Run, FAIL. Implement. Run `npx vitest run --project unit src/utils/quirk-effects.test.ts src/classes/battlemech-force*.test.ts`, PASS. Commit `Quirks: Lost Issues targeting in play (#98)`.

### Task 5: Heat breakdown, reset, override, modules, Initiative

**Files:**
- Modify: `src/classes/battlemech.ts` (play state: `tandtState: { brokenDown: boolean; resetUsed: boolean; overrideTarget?: string; modulesOn: string[] }`, saved in the play export; old saves load with the defaults)
- Modify: `src/utils/quirk-effects.ts` (`checkTandTBreakdown(system, heatBefore, heatAfter): number[]` returns the multiples crossed; `getQuirkInitiative` adds the side's reaction time per spec ruling 8, modules' delay included)
- Modify: `src/classes/battlemech-force.ts:343` (Initiative already reads `getQuirkInitiative`)
- Modify: the 'Mech play heat step and its dialog in `src/ui/pages/classic-battletech/roster/` (grep `applyHeat`)
- Test: `src/utils/quirk-effects.test.ts`, `src/classes/battlemech-quirks-play.test.ts`

- [ ] Failing tests: heat 7 to 17 with threshold 8 asks for two breakdown checks (8 and 16); a reset gives a reroll and limits fire to the 45 degree forward arc that turn; override lets a secondary target become primary; a module that is on adds its delay to reaction time; a side of three units with penalties 1, 2, 0 gets Initiative -1 (1.0) and 1, 2 gets -1 (1.5 rounds toward zero); an old save loads with no breakdown.
- [ ] Run, FAIL. Implement. Run the area tests, PASS. Commit `Quirks: T&T heat breakdown, reset, override, modules and reaction time (#98)`.

### Task 6: #99, custom T&T systems from the lore (proposal first)

- [ ] **Step 1:** Search the TRO extracts for T&T and comms names with a described behaviour: `py -3.11 C:/repo/ResourceLibrary/library_search.py "targeting tracking system" --books` and a grep of `C:/repo/ResourceLibrary/text/TRO*.txt` for the catalog names. Record each hit (name, book, page, the behaviour in our own words) in the ledger.
- [ ] **Step 2:** Post the proposal table on #99 (NGCFells voice) with a suggested effect for each, built only from the existing `QuirkEffect` types. Stop until the owner picks.
- [ ] **Step 3 (after the pick):** add the picked records to `src/data/tandt-systems.ts` with `custom: true`, `rulesLevel` Custom Homebrew (6), effects from the approved table, notes "Ours (NGCFells, <date>): drawn from <book> p.<n>". Test that each is offered only at levels 6-7 and that canon records are unaffected. Commit `Quirks: custom T&T systems from the lore (#99)`.

### Task 7: Checklist, review and ship

- [ ] **News:** one bullet in the newest entry of `src/ui/pages/home.tsx`: "Targeting and tracking systems from BattleTechnology: The Lost Issues, on the sheet and in play (with design quirks on)".
- [ ] **Check:** `npm run check` from PowerShell. Expected: green except the known load-sensitive timeouts.
- [ ] **Review:** one astech Opus whole-branch review; fix Critical and Important findings test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta` (expect "Published").
- [ ] **Issues:** comment on #98 (and #99 after Task 6) in NGCFells' voice with what shipped; close #98 when done; give NGCFells the comment URLs.

## Models

Task 1 data entry and Tasks 2-3: Sonnet. Tasks 4-5 (play rules in `battlemech.ts`): Opus. Task 6 search: Haiku, then the owner.
