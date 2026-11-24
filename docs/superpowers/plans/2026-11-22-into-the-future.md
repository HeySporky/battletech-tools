# Battletech Into The Future Imports Implementation Plan (#229-#240)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring in the Battletech Into The Future (battletechfuture.com) homebrew: the Advanced HOTAS cockpit (#229), Battletech Vengeance equipment (#230), Aurigan Trade Alliance equipment (#231), the Army Composition rarity validator (#232), GI Joe x Battletech Story Points (#233), the 6 Tech Level construction rules (#234), the Clan Reformation TRO (#235), the MegaMekLab-block designs (#236), the GI Joe 'Mechs (#237), the Aurigan Reaches TRO (#238), the catalog record sheets (#239), and the Drug Bust police scenario (#240).

**Architecture:** Fan-made equipment goes into the existing catalogs as level 6 records (`src/data/equipment-*.ts`, `src/data/mech-cockpit-types.ts` for cockpits), each with notes, credit, an Alpha Strike conversion (memory custom-items-get-as-conversion) and its own TRO line. Designs arrive as MegaMek files (`.mtf`/`.blk`, read by `battlemech-mtf.ts` and `blk-unit-import.ts`) or as stat blocks entered by hand, and ship through the custom unit list (`src/data/mul/custom/custom-units.json`, the #595 bundled custom-unit path) at Custom Homebrew. Story Points are a play-mode resource beside Edge in `roster/play.tsx`. The rarity rules are a force validator beside the existing force checks. The police scenario goes into match play (`src/ui/pages/game-management/match-play/`). Credits follow the VTOLAM pattern (`docs/superpowers/specs/2026-10-25-vtolam-design.md`): paraphrased text, the author and link in Notes and in a TRO - JBT readout.

**Tech Stack:** TypeScript, React, Vitest (PowerShell); Python 3.11 for the page saves.

**Spec:** the twelve issues (moved from Ideas #92 on 2026-10-25; check what is done first). Sources are the battletechfuture.com pages each issue links; #231's sourcebook is a Google Doc.

## Global Constraints

- Standing and level: everything here is fan-made, Custom Homebrew (6) (memory our-rules-only-at-levels-6-7 applies to our own conversions of it); an item whose author calls it unbalanced, or whose effect breaks the canon power curve (Story Points rerolls, Bioroid cockpits), goes to Munchkin (7) only where OWNER CALL 1 says.
- Every edition and unit type the item could ride (memory every-edition-every-rule): TW-era construction by default; LAM revival rules ride every LAM edition.
- Credits: each author by name with the page link, in the record notes, the TRO - JBT readout (`docs/lore/` one readout file for the site: `docs/lore/into-the-future-tro.md`, the one new lore file), and `rulesets-attribution.tsx`. No copied prose: paraphrase.
- Crossover IP (GI Joe, Gundam's RX-78 and Zaku, Macross-style designs): names kept as the site gives them, marked fan-made crossover in the notes; no art.
- Check before adding: Ferro-Lamellor (canon) and C3i (canon) already exist; never two records for one item.
- Save each source page first into `C:/repo/ResourceLibrary/scrapes/battletechfuture.com/` (as the other site scrapes are kept) so the work does not depend on the live site.
- Condense and extend: no new source files except the lore readout; tests extend the catalog, cockpit, force and play tests.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Level for the strong items.** Recommended: Custom Homebrew (6) for all equipment and designs; Munchkin (7) for Story Points (#233) and the Bioroid cockpits (#230), since each lets a unit ignore canon limits.
2. **#234 the 6 Tech Level tree.** The issue says it may be one to leave out; standing rule: every open issue gets built. Recommended: build it last, as its own Special Ruleset ("Into The Future tech levels") that a design opts into, so it never touches the TW tree; its items are level 6 inside it.
3. **#239 catalog sheets (about 70 image-only sheets).** Recommended: transcribe them by hand from the images in batches of ten (each batch a commit), checking each against the creator's validation; no OCR guesses ship.
4. **#238 Aurigan Reaches TRO with no BV.** Recommended: our BV by the rules; the notes say "no BV given by the source".
5. **#231 Google Doc source.** Recommended: NGCFells saves the doc as PDF into the library (`unsorted/`); work starts from the saved copy.

## Usual checklist

| Item | Task |
|---|---|
| Records with notes, dates, BV, cost, credit | 2, 3, 4, 6-8 |
| Construction | 2, 3, 4, 9 |
| Record sheet (new items on every sheet that can carry them; Story Points box) | 2-5 |
| Classic play (Bioroid cockpits, Story Points, LAM revival, HOTAS) | 2, 3, 5 |
| Alpha Strike (every item and design converted; inferred for designs, ours for items at 6-7) | 2-4, 6-8 |
| TRO (each item and design; `into-the-future-tro.md`; the TRO - JBT page) | 2-8 |
| Credits (each author, page link) | every task |
| News, review, check, deploy, issue comments | 10 |

## Review Focus

- The Union PPCs with built-in capacitors: heat and damage per the source, and the capacitor never double-counted with a separate PPC Capacitor.
- Compact AC weights and slots against the canon ACs (the source's numbers, never a guess).
- Story Points cannot be spent outside a force that opts into the GI Joe rules.
- Rarity validator: percentage caps rounded as the source says; copy limits per force.

---

### Task 1: Save the sources

- [ ] Save each linked page (#229, #230, #232, #233, #234, #235 and its 11 MegaMek files, #236, #237, #238, #239 sheet images, #240) into `C:/repo/ResourceLibrary/scrapes/battletechfuture.com/` with the page date; add them to `_index.md`. Record in the ledger `.superpowers/sdd/2026-11-22-into-the-future/progress.md` what each page gives. Commit and push ResourceLibrary.

### Task 2: Advanced HOTAS cockpit (#229)

**Files:** `src/data/mech-cockpit-types.ts` (a level 6 record: 2 t, one life-support slot, double cost, needs implants), `src/classes/battlemech.ts` (the implant requirement check), the play view (its effect as the page gives it). Test: `battlemech-cockpits.test.ts` (or the cockpit test that exists; grep `mech-cockpit-types` in `src/**/*.test.ts`).

- [ ] Failing tests: weight, slot, cost doubling, refused without implants, its play effect, its AS conversion, its TRO line and credit (@realmechislove).
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Into The Future: the Advanced HOTAS cockpit (#229)`.

### Task 3: Battletech Vengeance equipment (#230)

Items: Compact AC/2, /5, /10, /20; Union Light, Medium and Heavy PPCs (built-in capacitor); Union BSPFD; Clan Light Gauss; Union Light FF, Heavy FF armor; Improved Compact Heat Sink; Galactic K-F drive; Bioroid Cockpit and Bioroid Command Cockpit (with play rules); Clan LAM revival rules.

- [ ] One family per commit (ACs; PPCs; BSPFD; Gauss; armor; heat sink; K-F drive on capital ships; cockpits; LAM revival as a Clan tech-base option on the LAM creator): failing test (weight, slots, heat, damage, ranges, cost, BV, AS conversion, TRO line, credit), run, FAIL, implement, run, PASS. Commits `Into The Future: Vengeance <family> (#230)`.

### Task 4: Aurigan Trade Alliance equipment (#231)

Items: Aurigan Ultra AC, Clan compact gyro, Clan MRM, BattleMech Grenade Launcher, Advanced C3i-mini (OWNER CALL 5 for the source).

- [ ] Same steps as Task 3, one commit per item: `Into The Future: Aurigan <item> (#231)`.

### Task 5: Story Points (#233) and the rarity validator (#232)

**Files:** `src/ui/pages/classic-battletech/roster/play.tsx` and the force class (a Story Point pool when the force opts into the GI Joe rules: reroll, ignore a critical hit, more ammo), the force validation (Core / Special / Rare per unit, percentage caps, copy limits). Test: the play and force tests.

- [ ] Failing tests for each spend and each cap; run, FAIL; implement; run, PASS. Commits `Into The Future: GI Joe Story Points in play (#233)`, `Into The Future: Army Composition rarity check on rosters (#232)`.

### Task 6: Clan Reformation TRO (#235) and the MegaMekLab-block designs (#236)

- [ ] Import the 11 MegaMek files and the Zorro OmniVehicle (7 configurations) through the importers; each design checks against its file. The #236 designs: enter from their stat blocks, check our BV against the block's BV; list mismatches in the ledger (the Shockwave Carrier waits on the iTaser record: add it first, Task 3 pattern). Failing test per design (BV, armor, weapons); ship them on the custom unit list. Commits `Into The Future: Clan Reformation designs (#235)`, `Into The Future: MegaMekLab-block designs, <group> (#236)`.

### Task 7: GI Joe 'Mechs (#237) and the Aurigan Reaches TRO (#238)

- [ ] 28 GI Joe 'Mechs from their stat blocks (Arashikage, Coda and Jazz with their special rules in notes and play); the 12 Aurigan Reaches designs (OWNER CALL 4). Failing test per design. Commits `Into The Future: GI Joe x Battletech Mechs (#237)`, `Into The Future: Aurigan Reaches designs (#238)`.

### Task 8: Catalog record sheets (#239) and the Drug Bust scenario (#240)

- [ ] Transcribe the ~70 Helios, Stone Rhino, Archer, Blackjack, Victor, Dragon and Crusader variants in batches of ten (OWNER CALL 3), each checked against its creator's validation; commit per batch `Into The Future: catalog sheets batch <n> (#239)`.
- [ ] The Drug Bust scenario in match play: setup, forces, objectives, special rules (paraphrased, credited). Failing test that the scenario loads and scores; commit `Into The Future: the Drug Bust police scenario (#240)`.

### Task 9: 6 Tech Level construction rules (#234)

- [ ] Read the page in full; write a spec `docs/superpowers/specs/<date>-into-the-future-tech-levels-design.md` (OWNER CALL 2: a Special Ruleset a design opts into) before any code; then a follow-up plan from it.

### Task 10: Checklist, review and ship

- [ ] **News:** bullets per family, crediting each author.
- [ ] **Check:** `npm run check`; `npm run build:bundled`.
- [ ] **Review:** astech Opus review of Tasks 3-5. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #229-#240 in NGCFells' voice; close the finished ones; give the URLs.

## Models

Task 1: Haiku. Tasks 2-4, 6-8: Sonnet. Task 5 and Task 9: Opus. Review: Opus.
