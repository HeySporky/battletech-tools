# Designs by Edition, Our Own Source Data, the Glossary and Custom MUL Upstream Implementation Plan (#590, #383, #382, #221)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each bundled design knows which editions it exists in and what BV scheme each edition uses, and the roster lists only the designs the force's edition has (#590 steps 2-3); each design checked against its book becomes `verified` and drops the Skunk Werks / MegaMek notice, and the source corpora are cut once all are verified (#383); a glossary page explains the app's terms and is linked where they appear (#382); and the Custom MUL entries go to Jeff upstream as their own PR if NGCFells says yes (#221).

**Architecture:**
- Editions: `src/data/rules-editions.ts` already has `getEditionAtPublication(year, month, unitType)` (~1342), `isOfferedInEdition` (~950) and the per-edition BV (`2026-11-03-edition-aware-bv.md`, which left "filtering units by edition availability" to #590). A design gets an `editions` block like an equipment record's (`IEditionRecord`): the first edition is the edition at its first printing (MUL intro date or the book's date), and its BV per edition is none / BV1 / BV2 from that edition's BV scheme. The CBT and AS forces already carry `rulesEdition` (`alpha-strike-force.ts`, `currentCBTForce.rulesEdition`); the roster add pages filter by it.
- Source: `src/utils/bundled-designs.ts:10` `BundledDesignSource = "ssw" | "megamek" | "mordel" | "verified"`; `src/data/bundled-mechs-build.ts` writes the notices (line ~54 and ~473).
- Glossary: one page `src/ui/pages/glossary.tsx` (route in `src/ui/app-router.tsx` beside `/about` ~959; menu entry in `src/ui/components/top-menu.tsx` beside "about" ~179), its terms in the page file, and a small `GlossaryLink` exported from that page for in-place links. Standing text reuses `UNIT_STANDINGS` (`src/utils/unit-standing.ts:11`) and the rules level labels from `rules-level-options.ts`; the glossary never duplicates them.

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues and their rulings: #590 (2026-10-27: the MUL stays the BV target; per-edition BV kept beside it; reuse the shared game settings block from #324), #383 (2026-10-27 plan), #382 (term list in the body).

## Global Constraints

- The MUL stays the BV target for the BV2 editions (#590 ruling); a gap is logged, never overridden.
- Every edition and every unit type (memory every-edition-every-rule); a unit a later edition drops stays available there as apocryphal (memory removed-items-stay-apocryphal), so the roster filter hides nothing a player could legally field: an edition that drops a design shows it under Apocryphal.
- The importers (SSW, MTF, BLK) stay forever (#383 step 2).
- A notice is dropped only for a design whose `source` is `verified` with a cited book and page; MegaMek CC BY-NC-SA files stay until the last design built from them is verified.
- Condense and extend: the glossary page and its test are the only new files; other tests extend `rules-editions.test.ts`, `bundled-designs.test.ts`, `bundled-mechs-build.test.ts`, the roster add page tests.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **#590 first edition when the MUL date and the book disagree.** Recommended: the book's printing date wins (books are the sources); the MUL intro year is the fallback for designs not yet checked.
2. **#590 roster filter default.** Recommended: on by default for new forces, with a "show every edition" switch on the add page (saved per force), so an old force does not lose units it already holds; units already in a force that its edition lacks show a warning, never removed.
3. **#382 where the links go.** Recommended: a small dotted-underline link on the first use per page of each term (standing badges, rules level selects, the unit picker source filter, BV/PV headings), opening the glossary at that term; no hover pop-ups (they fail on phones).
4. **#221 offer upstream?** Recommended: yes, as one PR to HeySporky/battletech-tools containing only the Custom MUL Editor, the `custom` MUL source and its loader, with the fan-made units themselves left out (Jeff can choose to ship an empty custom list); NGCFells opens it, the upstream leftovers plan (`2026-11-22-upstream-pr-leftovers.md`) pattern.
5. **#383 cut date.** Recommended: cut the corpora in one commit only after `verified` covers every shipped design; until then the progress count shows on the BV accuracy page (`bv-accuracy.tsx`).

## Usual checklist

| Item | Task |
|---|---|
| Records (design `editions`, `verified` sources) | 1, 3 |
| Construction | none |
| Record sheet (the notice line on bundled sheets follows the source) | 3 |
| Classic play | none |
| Alpha Strike (the AS roster filters by its own edition) | 2 |
| TRO (the TRO credit line follows the source) | 3 |
| Credits (`rulesets-attribution.tsx` and the TRO credit drop SSW/MegaMek only for verified designs) | 3 |
| News, review, check, deploy, issue comments | 6 |

## Review Focus

- An edition with no BV: the roster shows "no Battle Value in this edition" for every design, never 0.
- A design printed after an edition's last book: not in that edition except as apocryphal.
- A force saved before this change opens with the filter off.
- The notice is never dropped for a design whose source is not `verified`.
- The glossary uses the live `UNIT_STANDINGS` text (one source of truth).

---

### Task 1: Edition availability per design (#590 step 2)

**Files:** `src/utils/bundled-designs.ts` (an `editions` field on the bundled design entry: first edition tag and the BV per edition), `src/data/bundled-mechs-build.ts` and `bundled-units-build.ts` (fill it from the book date when verified, else the MUL intro year through `getEditionAtPublication`), `src/data/rules-editions.ts` (`getDesignEditions(design)`, `isDesignInEdition(design, editionTag)`). Test: `bundled-designs.test.ts`, `rules-editions.test.ts`.

- [ ] Failing tests: the Locust LCT-1V is in every edition from BattleTech 2nd edition on, with no BV under the pre-BMR editions, BV1 under BMR and BMR(R), BV2 from TW; a 3067 design is not in the Third Edition box except as apocryphal; the prototype rocket launchers 10/15/20 carry 15/18/19 under the IO editions (IO:AE p.189) and 17/21/22 elsewhere (#590 comment).
- [ ] Run `npx vitest run --project unit src/utils/bundled-designs.test.ts`, FAIL. Implement. Run, PASS. `npm run build:bundled`; check no TW BV moves. Commit `Designs know their editions and each edition's BV (#590)`.

### Task 2: The roster plays one edition (#590 step 3)

**Files:** `src/ui/pages/classic-battletech/roster/` add page and `src/ui/pages/alpha-strike/roster/_AddUnitsPage.tsx` (filter by the force's `rulesEdition`, OWNER CALL 2 switch), the force classes (a saved `showEveryEdition` flag), the shared `game-settings-block.tsx` (the roster uses it for edition and level, #324). Test: the roster add page tests, `alpha-strike-force.test.ts`.

- [ ] Failing tests: a Third Edition force lists no Clan designs; the switch shows them all; an old saved force opens with the switch on; a unit the edition lacks, already in the force, shows a warning.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Rosters list only the units their edition has (#590)`.

### Task 3: Verified designs drop the source notices (#383 step 1)

**Files:** `src/data/bundled-mechs-build.ts` (`verified` entries: a book and page field; no SSW/MegaMek notice for them), the bundled sheet and TRO credit line, `bv-accuracy.tsx` (a "verified against the book: N of M" count). Test: `bundled-mechs-build.test.ts`.

- [ ] Failing tests: a design marked `verified` with "TRO 3025 p.20" carries no MegaMek notice on its sheet, TRO or roster entry; a design still `megamek` keeps it; the count shows on the BV accuracy page.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Designs checked against their book drop the SSW and MegaMek notices (#383)`.
- [ ] Verification itself goes book by book with the book/magazine checklist; each book is a commit `Verified: <book> designs (#383)`.

### Task 4: Cut the source corpora (#383 step 3), when every design is verified

- [ ] When the count reads M of M: remove the converted corpora and notices the build no longer reads (grep the build scripts for each folder first), keep the importers and their test fixtures. `npm run check`. Commit `Our own source data: the SSW and MegaMek corpora are gone from the build (#383)`.

### Task 5: Glossary page (#382) and Custom MUL upstream (#221)

**Files:** `src/ui/pages/glossary.tsx` (new; terms from the #382 list: standing, rules levels and each edition's level names from `getRulesLevelOptionsForEdition`, rules editions and Special Rulesets, MUL / MUL 1.0 / custom list / Unit Lists, picker sources, BV / BV2 / PV / C-Bills, tech rating and availability, eras, tech base, the unit types, quirks), `src/ui/app-router.tsx`, `src/ui/components/top-menu.tsx`, and the places in OWNER CALL 3. Test: `src/ui/pages/glossary.test.tsx` (new, beside the page).

- [ ] Failing tests: the page lists every `UNIT_STANDING_ORDER` standing with its live description; every rules level of every edition; every term in #382; `GlossaryLink term="standing"` links to `/glossary#standing`; the menu has the entry.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `A glossary of the app terms, linked where they appear (#382)`.
- [ ] #221 (OWNER CALL 4): on a yes, build the upstream branch from `upstream/master` with the Custom MUL Editor, the `custom` MUL source and its loader only, run upstream tests, and hand NGCFells the branch to open the PR; on a no, comment and leave the issue open as "kept fork-only for now".

### Task 6: Checklist, review and ship

- [ ] **News:** bullets for the edition filter, the verified count and the glossary.
- [ ] **Check:** `npm run check`; `npm run build:bundled`; BV survey unchanged under TW.
- [ ] **Review:** astech Opus review of Tasks 1-2. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #590, #383, #382, #221 in NGCFells' voice; close the finished ones; give the URLs.

## Models

Tasks 1-2: Opus (edition rules). Tasks 3-5: Sonnet. Review: Opus.
