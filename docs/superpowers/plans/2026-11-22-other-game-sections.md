# RolePlaying, BattleForce and AeroTech Sections Implementation Plan (#635)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three new sections, each with its first cut (spec section 2): a RolePlaying character sheet under A Time of War, a BattleForce 2 converter and force builder, and AeroTech 2 Revised records and play for the aerospace units; then each section's other editions; the Micro-Mechs appendices (#173) built in each.

**Architecture:** Per the spec (`docs/superpowers/specs/2026-11-22-other-game-sections-design.md`): pages in `src/ui/pages/{roleplaying,battleforce,aerotech}/` with `_router.tsx`, routes in `src/ui/app-router.tsx`, menu entries in `top-menu.tsx`; one class and one data file per game; Classic BattleTech designs are the input.

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** `docs/superpowers/specs/2026-11-22-other-game-sections-design.md`.

## Global Constraints

- Extract first (`C:/repo/ResourceLibrary/text`: `AToW-CGL-2022-V30Dated20220606.txt`, `BattleForce2-FASA-1703-1997.txt`, `AeroTech-2-Revised-FanPro-35011-scan.ocr.txt` and the others in the spec); page images for scanned tables, written back whole into every printing's extract and `_corrected_pages.md`.
- Every edition of each game, in turn (memory every-edition-every-rule).
- The Micro-Mech appendix rules stay Custom Homebrew (6), credited as now (TRO - JBT: Micro-Mechs).
- Condense and extend: the new files are the three page folders, three class files and three data files the spec names, each with its test beside it; `micro-mech-other-games.ts` stubs become those data files' first records (moved, not copied).
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Section names and editions.** Recommended: "RolePlaying", "BattleForce", "AeroTech", each with an edition select; first editions AToW, BattleForce 2, AeroTech 2 Revised (spec choice 1).
2. **First cut.** Recommended: the spec section 2 list; play for BattleForce comes after its converter.
3. **Character storage.** Recommended: local storage and the existing backup/restore, like rosters; no account.

## Usual checklist

| Item | Task |
|---|---|
| Records (RPG skills/traits; BF2 conversions; AT2 records) | 1-3 |
| Construction | none (designs come from the creators) |
| Record sheet (the RPG character sheet; BF2 unit card; AT2 record sheet) | 1-3 |
| Play (AT2 play; BF2 play later) | 3, 4 |
| Alpha Strike | none (its own section) |
| TRO | a line on each TRO page linking to the unit's BF2 and AT2 views |
| Credits (Micro-Mechs appendices as now; each book in `rulesets-attribution.tsx`) | 1-3 |
| News, review, check, deploy, issue comments | 5 |

## Review Focus

- BF2 conversion of each unit type against BF2's worked examples (the book's own numbers).
- AT2 values that differ from TW (armor, thrust, heat) come from AT2R tables, never from TW.
- Character sheet arithmetic: XP to attribute and skill levels as AToW's tables give them.

---

### Task 1: RolePlaying section, A Time of War character sheet

**Files:** `src/ui/pages/roleplaying/` (new: `_router.tsx`, `home.tsx`, `character.tsx`), `src/classes/rpg-character.ts` (new), `src/data/rpg-rules.ts` (new: attributes, skills, traits, life path stages from AToW; the Micro-Mech skills, trait, Training field and training events as level 6 records), routes and menu. Test: `src/classes/rpg-character.test.ts`.

- [ ] Read AToW's character creation chapter (life paths, XP costs) and record the tables in the ledger `.superpowers/sdd/2026-11-22-other-game-sections/progress.md` with pages.
- [ ] Failing tests: XP spent to attribute and skill levels; a life path stage applies its fixed XP; the Vehicle (Modified) trait for 10-19 t; the Micro-Mech skills appear only at level 6; save, load and print.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `RolePlaying: a section with A Time of War character sheets (#635)`.

### Task 2: BattleForce section, BattleForce 2 converter and force builder

**Files:** `src/ui/pages/battleforce/` (new), `src/classes/battleforce-unit.ts` (new), `src/data/battleforce-rules.ts` (new; the BF2 tables; the Micro-Mech class Mi rules from the stub). Test: `src/classes/battleforce-unit.test.ts`.

- [ ] Failing tests: BF2's worked conversion examples for a 'Mech, a vehicle and infantry convert to the book's numbers; a Micro-Mech converts with structure 1, no overheat and the medium/long range weapon lists; a force totals.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `BattleForce: a section with BattleForce 2 conversion and forces (#635)`.

### Task 3: AeroTech section, AeroTech 2 Revised records and play

**Files:** `src/ui/pages/aerotech/` (new), `src/classes/aerotech-unit.ts` (new; reads a fighter, small craft or large craft class and gives its AT2R values), `src/data/aerotech-rules.ts` (new; the Micro-Mech emergency bay rule from the stub). Test: `src/classes/aerotech-unit.test.ts`.

- [ ] Failing tests: an AT2R record for a fighter matches the AT2R sample sheet; the emergency bay rule (two Micro-Mechs in a 'Mech bay, deployment doubled, no orbital drop) in AT2 play; AT2 movement and heat in play.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `AeroTech: a section with AeroTech 2 Revised records and play (#635)`.

### Task 4: The other editions

- [ ] One edition per commit, each read on the page first: MechWarrior 1st, 2nd, 3rd and the CBT RPG for RolePlaying; BattleForce (1987) and the SO BattleForce for BattleForce, with BF2 play; AeroTech (1986) and AeroTech 2 (1994) for AeroTech. Failing tests per edition difference. Commits `<Section>: <edition> (#635)`.

### Task 5: Checklist, review and ship

- [ ] **News:** a bullet per section.
- [ ] **Check:** `npm run check`.
- [ ] **Review:** astech Opus review of each section's rules. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #635 (and #173 for its appendices) in NGCFells' voice; close #635 when every edition is in; give the URLs.

## Models

Opus for the rules reading and conversions (Tasks 1-4); Sonnet for the pages. Review: Opus.
