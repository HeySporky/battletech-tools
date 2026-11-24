# Rules Editions: What Is Left (#203, #204, #207, #208, #209, #631)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every creator hides the fields an edition lacks (#203); every edition has its own rules level names, construction level and printed units (#204); the Master Rules' own Battle Value and each edition's cost rules are built (#207 item 1, #631); the ICE engine is offered to 'Mechs only where the book allows (#207 item 2); play follows the edition for every unit type (#207 item 3); missile damage and shots per ton by edition (#207 item 4); the Fourth Edition and Introduction to BattleTech designs (#208); and the Core Rulebook's changes to Total Warfare are modelled (#209).

**Architecture:** Editions are `src/data/rules-editions.ts` (`btRulesEditions`, tags `battledroids` through `core-rulebook`, each with `levels`). The 'Mech Creator's `EditionChoice` (`src/ui/components/edition-choice.tsx`) hides fields; the other creators gain it through the shared `game-settings-block.tsx`. Cost per edition follows the BV pattern: per-edition step definitions (the provisional `cost.rules-edition` step at `battlemech.ts:2397` goes away when an edition's own rules land). CRB changes are a per-rule `editions` entry `core-rulebook` with its own values, the way Narc's CRB -1 already is (`rules-editions.ts` ~84-98).

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues; `docs/superpowers/specs/2026-10-15-rules-edition-levels-battledroids-design.md` and its plan (the pattern the other editions follow); `docs/superpowers/specs/2026-10-21-catalogs-editions-design.md`.

## Rules (extract first; `C:/repo/ResourceLibrary/text`)

- BMR cost and BV: `BattleTechMasterRules-FASA-1707-1998.txt`; BMR(R) in its own extract (grep `Master Rules, Revised` in the file list); BattleTech Manual (1987) `BattleTechManualTheRulesOfWarfare-FASA-1626-1987.txt` pp.78-84 (ICE for vehicles only); BattleTech Compendium and Rules of Warfare; 2nd/3rd/4th edition boxes (scans: `.ocr.txt`).
- Core Rulebook: `Battletech-Core-Rulebook.txt` (designer's notes p.247 on the scope of its changes); `How-the-Core-Rulebooks-Work.txt`.
- Fourth Edition 'Mech sheets: `rulebooks-legacy/BattleTech, Fourth Edition box - 'Mech sheets and tables (FASA 1604, 32p scan).pdf` in the library (OCR text available: all 24 designs); the 1992 Third Edition record sheets (`record-sheets/Battletech-3rd-Edition-RecordSheets.pdf`, 14 sheets and the 3025 'Mech Stats sheet). Check the page images before entering a design.

## Global Constraints

- Extract first; page images for every stat block entered from a scan (#208), each written back whole into every printing's extract and `_corrected_pages.md`.
- Every edition, every unit type (memory every-edition-every-rule). Removed items stay apocryphal; book offers make an item available.
- Today's numbers under Total Warfare never move (BV survey, cost tests).
- Condense and extend: no new source files. Tests extend `battlemech-rules-edition.test.ts`, `unit-rules-edition.test.ts`, `battlemech-cost-breakdown.test.ts`, `battle-value.test.ts`, `edition-standing.test.ts`, and each creator's existing tests.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **The two missing TCI kit sheets (#204):** the Dougram Jakt-type Shadow Hawk and the plain Soltic H8 Griffin are entered from the book's SHD-2H and GRF-1N and marked inferred today. Recommended: keep them inferred until a sheet photo turns up; the issue lists them as wanted (in the comment), and the 1985-86 TCI sets go to the Second Edition pass in Task 2.
2. **Master Rules BV (#207):** Recommended: BMR and BMR(R) BV1 are already built through `battle-value.ts` (`MECH_MASTER_RULES`, `MECH_MASTER_RULES_REVISED`); item 1 of #207 is about the editions before BMR that print no BV at all, which show "no Battle Value in this edition" instead of the current figure. Cost rules per edition are the remaining work (Task 3).

## Usual checklist

| Item | Task |
|---|---|
| Records (edition fields, level names, Fourth Edition designs) | 2, 5, 6 |
| Construction (fields hidden by edition, ICE limit) | 1, 4 |
| Record sheet (each edition's sheet layout where one exists; the 4th edition designs' sheets) | 5 |
| Classic play by edition, every unit type | 4 |
| Alpha Strike | none (AS editions are their own plan) |
| TRO | the designs' TRO pages (5) |
| Credits | none (canon) |
| News, review, check, deploy, issue comments | 7 |

## Review Focus

- A design saved under one edition and opened under another: fields the new edition lacks are hidden, not deleted; switching back restores them.
- An edition that prints no BV: the roster shows "no Battle Value in this edition", never 0 and never the TW number.
- The ICE engine on a 'Mech under the BattleTech Manual: refused; under editions that offer it to 'Mechs: offered.
- CRB values apply only under `core-rulebook`; TW and BMM keep theirs.

---

### Task 1: Fields by edition in the other creators (#203)

**Files:** `src/ui/components/edition-choice.tsx` (generalise beyond the 'Mech Creator), `src/ui/components/game-settings-block.tsx`, each creator's steps (vehicles, fighters, small craft, infantry, battle armor, ProtoMechs, buildings: `src/ui/pages/classic-battletech/<x>-creator/`), each class's `isOfferedInEdition`-style checks. Test: each creator's tests and `unit-rules-edition.test.ts`.

- [ ] For each creator: list the fields each edition lacks (from that edition's book: e.g. no BAR under BMR for combat vehicles, no Small Craft before AeroTech 2's rules where so) in the ledger `.superpowers/sdd/2026-11-22-rules-editions/progress.md`; failing test that the field is hidden under that edition and shown under TW; implement; run, PASS. One commit per creator: `Rules editions: <creator> hides fields its edition lacks (#203)`.

### Task 2: Rules levels for the other editions (#204)

- [ ] One edition at a time (2nd, 3rd, 4th edition boxes, Compendium, Rules of Warfare, BMR, BMR(R), Classic BattleTech box), as the Battledroids plan did: the edition's own level names, its construction level, and the units it prints (from its book), each cited. Failing tests in `edition-standing.test.ts`; implement in `rules-editions.ts`; commit `Rules editions: <edition> level names and printed units (#204)`.

### Task 3: Cost rules by edition (#207 item 1, #631)

**Files:** `src/classes/battlemech.ts` (cost breakdown: per-edition step definitions, as BV has), `src/data/battle-value.ts` sibling for cost if one exists (grep `getCostRules`; else a `COST_RULES` table in `battlemech.ts` beside the cost code). Test: `battlemech-cost-breakdown.test.ts`.

- [ ] Read each older edition's cost rules on the page (BMR, BMR(R), Max Tech for Level 3; find the cost chapter with `grep -n -i "cost" <extract>` and cite the page markers). Failing tests: a BMR(R) Locust's cost follows BMR(R)'s formula; the `cost.rules-edition` provisional step is gone for editions whose rules landed and remains for those not yet built; TW costs unchanged. Same for vehicles and fighters where the edition prints cost rules. Commit per edition `Cost: <edition> rules (#631)`.

### Task 4: ICE on 'Mechs, play by edition, missile values (#207 items 2-4)

- [ ] ICE: failing test that the BattleTech Manual (BTM pp.78-84) does not offer ICE to BattleMechs; check each other edition's book. Implement in `getAvailableEngines`. Commit `Rules editions: ICE on 'Mechs only where the book allows (#207)`.
- [ ] Play by edition for vehicles, fighters, infantry and buildings: list each play rule that differs by edition (from the books), add the edition switch to that play path (the Battledroids play path is the pattern), failing test per difference. One commit per unit type `Play: <unit type> follows the rules edition (#207)`.
- [ ] Missile damage per missile and shots per ton by edition: failing test that a record with an `editionStats` damage or shots value uses it under that edition in play and on the sheet (none differs today; the test uses a fixture record). Commit `Rules editions: missile damage and shots by edition (#207)`.

### Task 5: Fourth Edition and Introduction to BattleTech designs (#208)

- [ ] From the Fourth Edition sheets (OCR first, then page images), enter the four designs missing from the edition (WTH-1 Whitworth, VND-1R Vindicator, CP-10-Z Cyclops, BNC-3E Banshee) and the Assassin as ASN-21, with `battletech-4th-edition` availability, and check the other 19 against what the edition carries. From the 1992 Third Edition sheets, check the 14 designs and the 3025 'Mech Stats sheet. Failing tests per design (armor, weapons, heat sinks as printed). Commit `Rules editions: Fourth Edition box designs from the sheets (#208)`.
- [ ] The Introduction to BattleTech book is still wanted for the library: the issue comment says so (no work until it is found).

### Task 6: Core Rulebook changes to Total Warfare (#209)

- [ ] Read CRB p.247 (designer's notes) and `How-the-Core-Rulebooks-Work.txt`; list every rule the CRB changes against TW in the ledger, with pages on both sides. For each change: failing test that under `core-rulebook` the CRB value applies and TW keeps its own; implement as an `editions`/`editionStats` entry or a per-edition play rule. One commit per rule family `Rules editions: Core Rulebook <rule> (#209)`.

### Task 7: Checklist, review and ship

- [ ] **News:** bullets per family.
- [ ] **Check:** `npm run check`; BV survey and TW cost unchanged.
- [ ] **Review:** astech Opus review. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #203, #204, #207, #208, #209, #631 in NGCFells' voice; close the finished ones; give the URLs.

## Models

Tasks 1, 4: Sonnet. Tasks 2, 3, 5, 6: Opus (reading each edition's book). Review: Opus.
