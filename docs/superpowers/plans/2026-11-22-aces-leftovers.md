# BattleTech: Aces, What Is Left (#187, #188, #189, #190, #192, #193, #194, #195, #196, #197, #198, #199, #200, #202)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every open Aces list item: per-unit turn state (#187), a stat-query API (#188), combat vehicles and infantry rules (#189, #190), Scouring Sands abilities (#192), extras (#193), OPFOR objectives (#194), the sortie setup checklist (#195), playing a sortie: Waypoints, escape edges, Edge (#196), printables (#197), Apolakkia availability and terrain (#198), the box OPFOR units against the MUL (#199), unit cards for both sides (#200), and one regression test per rule (#202).

**Architecture:** The Aces code is already large: the engine (`src/classes/aces-engine.ts`: behavior, targets, movement, overheat, physicals), the game state (`src/classes/aces-game.ts`), the campaign (`src/classes/aces-campaign.ts`: named pilots, logs, SP), rules data (`src/data/aces-rules.ts`), cards (`src/data/aces-cards.ts`), and the pages in `src/ui/pages/alpha-strike/aces/` (`game.tsx`, `campaign.tsx`, `print.tsx`, `rules.tsx`, `library.tsx`). Every item below extends those files. Many items are partly done (the issue bodies say "Partial"), so Task 1 is an audit that ticks what exists.

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues (moved from Ideas #72); the earlier Aces plans `2026-11-15-aces-card-readers-and-edge.md` and `2026-11-15-aces-rekikire-followups.md` for conventions. Rules: `C:/repo/ResourceLibrary/text/Battletech-Aces-RuleBook.txt` (and `.ocr.txt` where the text is thin), `Battletech-Aces-Rules-20230310.txt` (rules sheet), `battletech-aces-scouring-sands-campaign-books.txt` (*Aces SS*), `BattletechAcesScouringSandsLogSheets-CGL-2025.txt`, `BattleTechRecordSheetsAcesScouringSands-CGL-2026.txt`.

## Not in this plan (blocked on sources)

- #186 (the other Aces boxes) and #227 (Snowblind ForcePacks) need the books and cards first. Each gets a comment listing what is needed.

## Global Constraints

- Extract first; page image only when in doubt, written back whole.
- Do not change `ACES_CARD_LIBRARY_VERSION` or `ACES_GAME_EXPORT_VERSION`; new export fields are optional so older saves load (the rule of the earlier Aces plans).
- Code style in these files: 4-space indent, spaces inside parentheses (`foo( a, b )`), as the existing code.
- Card text and art never ship; only game data (#592's rule).
- Our own layouts for printables, never copies of the official sheets (#197).
- Both rulesets the engine knows (`TAcesRuleset = "asce" | "aces"`, `aces-engine.ts:52`) keep working; Aces-only rules apply under `aces`.
- Condense and extend: no new source files except tests where a rule has none. Tests extend `aces-engine.test.ts`, `aces-game.test.ts`, `aces-campaign.test.ts`, `aces-helpers.test.ts`, `aces-cards.test.ts` and the page tests in `src/ui/pages/alpha-strike/aces/`.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **#193 automated allies:** recommended: an ally is an automated unit on the player's side, drawn and driven by the same engine as the OPFOR (its own deck), shown with an "Ally" badge; it never counts toward the player's PV cap (Aces p.38 wording to be checked).
2. **#199 mismatches with the box cards:** recommended: the MUL stays the target (the #590 ruling); a box card that differs is recorded in the unit's notes with both values, and the Aces game uses the box card's value only for the box's own sorties.

## Usual checklist

| Item | Task |
|---|---|
| Records (rules data, availability list, OPFOR units) | 2, 6, 9 |
| Construction | none |
| Record sheet / printables (our layouts) | 8 |
| Play (Aces engine and game) | 2-7, 10 |
| Alpha Strike (the units are AS units already) | 2, 5 |
| TRO | none |
| Credits | none (canon) |
| News, review, check, deploy, issue comments | 11 |

## Review Focus

- An old saved Aces game loads with default turn state (no flags set) and plays on.
- The stat-query API returns the same numbers the UI shows today for every unit in `aces-card-samples.ts` scenarios (snapshot), so moving the UI onto it changes nothing visible.
- Escape edges: a unit that leaves by an escape edge counts as escaped, not destroyed, for salvage and the log.
- Edge spends: once per Combat Phase for +1 pip; a raised 12 is not a critical; rerolls only where Aces p.24 allows.
- The regression tests use the book's worked examples with their page in the test name.

---

### Task 1: Audit what exists

- [ ] For each bullet of every issue above, find the code and test that does it (grep the terms in the files named in Architecture), and record done / partial / missing with file and line in the ledger `.superpowers/sdd/2026-11-22-aces-leftovers/progress.md`. Tasks 2-10 skip what is done. The final issue comments tick those lines.

### Task 2: Per-unit turn state and the stat-query API (#187, #188)

**Files:** `src/classes/aces-game.ts` (per-unit `turnState`: movement mode used and the TMM it produced, moved/attacked, Move First/Last tokens, Forced Withdrawal, Fleeing, escaped, mounted-on-transport, Force Commander, Named Pilot link, Edge tokens left, destroyed-by-ammo), `src/classes/aces-engine.ts` (`getAcesUnitQuery(unit, game): { mv: { current, starting }; tmm; armor: { current, lost, starting }; structure; damage: { s, m, l, e }; ov; pv; size }` with the BA +1, STL and heat effects, Aces p.9; the engine reads only this). Test: `aces-game.test.ts`, `aces-engine.test.ts`.

- [ ] Failing tests: each turn-state field round-trips in the export and resets as the turn phases say; `getAcesUnitQuery` gives TMM +1 for battle armor, the STL effect and the heat effect (Aces p.9); the engine's existing tests pass when `getAcesUnitStats` (`aces-engine.ts:112`) reads through the query.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Aces: per-unit turn state and the stat-query API (#187, #188)`.

### Task 3: Combat vehicles and infantry (#189, #190)

- [ ] Vehicles (Aces p.4): failing tests for heat applied as damage, Charge as the only physical attack, TUR#, the motive table's +1 for hover and wheeled checked against the existing motive tracking, and a ground vehicle movement cost reference table on the rules page. Implement in `aces-engine.ts`, `aces-helpers.ts`, `rules.tsx`. Commit `Aces: combat vehicle rules (#189)`.
- [ ] Infantry (Aces pp.5-6): failing tests for the 360-degree arc and no rear, no AMM, battle armor +1 TN, the always-Weapon-Hit critical, Anti-'Mech attacks (+1 TN; +3 more for conventional infantry; +3 against a target carrying battle armor; a critical check on any damage), the transport rules (IT#/CAR#, MEC/OMNI mount at 2" and dismount at half MV, no Sprint the turn it loads), and the OMNI hit split (battle armor takes the hit on 1D6 5-6, per attack roll). Implement. Commit `Aces: infantry rules (#190)`.

### Task 4: Scouring Sands abilities (#192)

- [ ] Compare each of ECM (12"), FLK, JMPS#, SRCH, TAG, TUR# and alternate munitions in *Aces SS* p.19 with `src/data/alpha-strike-special-abilities.ts` (ASCE wording); add an `acesNote` where they differ; probe scan ranges (4" base, LPRB 8", PRB 12", BH 16") apply only to Waypoints (Aces p.24). Failing tests that the Aces note shows under the `aces` ruleset and the probe ranges feed the Waypoint scan. Commit `Aces: Scouring Sands abilities (#192)`.

### Task 5: Extras, OPFOR objectives, unit cards for both sides (#193, #194, #200)

- [ ] Allies (OWNER CALL 1), non-campaign difficulty (80%/120% PV, skill +/-1 without recalculating PV, p.38; the PV helper exists, add the skill shift), and a quick-reference panel of icons and keywords (back cover, p.40) in `rules.tsx`. Commit `Aces: allies, difficulty and the quick reference (#193)`.
- [ ] OPFOR builder objectives (#194): define objectives on the automated force (from the sortie or by hand), shown and scored in the End Phase. Commit `Aces: OPFOR objectives (#194)`.
- [ ] Both sides' cards (#200): the player side uses the same in-play unit cards as the automated side, and the automated units show priority, behavior, target and tokens beside their cards. Commit `Aces: unit cards for both sides (#200)`.

### Task 6: Sortie setup checklist (#195)

- [ ] A setup page section (`campaign.tsx` / `game.tsx`) walking pp.30-31: log entry, briefing by entry ID, Reconnaissance SP, play area and Waypoint setup; player force PV cap after difficulty; OMNI reconfiguration cost (Size x 5 SP, or PV difference x 40 SP when the new variant costs more); Named Pilots by type, wounded pilots excluded, force commander chosen; then the OPFOR and special rules. Failing tests for the SP costs and exclusions; implement in `aces-campaign.ts`. Commit `Aces: sortie setup checklist (#195)`.

### Task 7: Playing a sortie: Initiative, escape edges, End Phase, Waypoints, Edge (#196)

- [ ] Failing tests: the last Initiative winner takes -2; a force whose commander is destroyed takes -2 (both exist per the issue: verify, add tests if missing); escape edges set per sortie and a unit leaving by one is escaped; the strict End Phase order (sortie rules, damage, heat, objectives, strategy, turn track, Waypoints); Waypoint reveal and scan (p.24) with Task 4's probe ranges; Edge spends: +1 pip once per Combat Phase (a raised 12 causes no critical), reroll motive, reroll a critical, and the Edge abilities (p.24). Implement in `aces-game.ts` and `game.tsx`. Commit `Aces: escape edges, End Phase order, Waypoints and Edge spends (#196)`.

### Task 8: Printables (#197)

- [ ] `print.tsx`: Campaign Log, Player Force Roster, Sortie Log and Named Pilot card, in our own layout (not copies of `BattletechAcesScouringSandsLogSheets-CGL-2025`), filled from the campaign. Failing render tests per printable (happy-dom, React render, no markup parsing). Commit `Aces: printable campaign log, roster, sortie log and pilot card (#197)`.

### Task 9: Apolakkia availability and terrain; box OPFOR units (#198, #199)

- [ ] Availability list (*Aces SS* p.20): check that SP = PV x 40 for every row (failing test over `aces-rules.ts`'s list); the terrain legend CF values and the river and canyon rules (*Aces SS* p.18) on the rules page and in the engine where movement or LOS needs them. Commit `Aces: Apolakkia availability check and terrain rules (#198)`.
- [ ] Box OPFOR units (Bane 3, Marauder IIC, Thunderbolt IIC, Summoner H, Rifleman C2, Howler, Locust IIC 4, Fulcrum Heavy Hover Tank): a test that each is in our MUL data and its PV and specials match the box card (from `Battletech-Aces-Cards-20230310.txt` and the record sheets extract); mismatches per OWNER CALL 2. Commit `Aces: box OPFOR units checked against the MUL (#199)`.

### Task 10: One regression test per rule (#202)

- [ ] Add, in `aces-engine.test.ts` and `aces-campaign.test.ts`, one test per rule named for the rule and its page, from the book's worked examples: IF p.3; Determine Behavior and Identify Target pp.11-13; Forced Withdrawal priority 625 - 500 = 125, p.16; Destroy Objective TMM -4, p.17; BSP ordering p.21; and the campaign examples. A test that fails exposes a bug: fix it test-first in the same commit. Commit `Aces: a regression test for every rule, from the book's examples (#202)`.

### Task 11: Checklist, review and ship

- [ ] **News:** one bullet per finished issue.
- [ ] **Check:** `npm run check`.
- [ ] **Review:** astech Opus review of the engine changes. Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on each issue in NGCFells' voice; close the finished ones; give the URLs.

## Models

Task 1: Haiku. Tasks 2, 7, 10: Opus (engine). Tasks 3-6, 8-9: Sonnet.
