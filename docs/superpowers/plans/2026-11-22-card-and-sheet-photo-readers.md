# Card Photo Reader Remainder and the Record Sheet Photo Reader Implementation Plan (#592, #598)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The card photo reader reads the Alpha Strike cards still left on #592 (MechWarrior / pilot cards, Aces sortie cards, and the Support, Objectives and Initiative cards the app models), and a record sheet photo reader reads printed and hand-filled sheets of every unit type and edition into a custom design and, optionally, a game in progress (#598, after #595, which is closed).

**Architecture:** The readers run in the browser on tesseract.js (`src/classes/card-scan-browser.ts`, loaded on demand; nothing leaves the device). Shared plain-code pieces in `src/classes/card-scan-io.ts` (binarize modes, `cardScanRows`, rotation). Each card kind has its own `scan<Kind>Card(io)` beside the existing ones (`aces-card-scan.ts`, `aces-command-card-scan.ts`, `aces-edge-card-scan.ts`, `alpha-strike-card-scan.ts`) and a review form with the "checked against the card" box. The sheet reader is the same pattern at sheet size: find the sheet kind from its printed labels, then read each field from its known box, count pips, and match weapon names against the equipment catalog; the result goes through the custom-unit path #595 built (bundled custom unit list entry) for designs, and into the play-mode state for a game in progress.

**Tech Stack:** TypeScript, React, tesseract.js (browser), Vitest (PowerShell).

**Spec:** #592 (list and notes), #598 (rulings 2026-10-29: output both; every sheet of every edition, Battledroids included; after #595). Test photos are kept local in the reader test harness, never shipped (#592 2026-11-15 comment).

## Global Constraints

- Card text and art never ship; photos stay on the device; only game data is read.
- Best effort, warn, the player overrides every field; nothing is saved before the "checked against the card/sheet" box.
- Every unit type, every edition's sheet layout (memory every-edition-every-rule).
- Test photos stay out of git (the harness reads them from a local folder named in `.gitignore`); the tests in git use small synthetic images built in the test.
- Condense and extend: one new reader file per card kind is the existing pattern; the sheet reader is one file `src/classes/record-sheet-scan.ts` with its layouts as data inside it; tests beside each.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Which Support / Objectives / Initiative cards.** Recommended: only the ones the app models today (Aces scenario objectives `IAcesScenarioObjective` in `src/data/aces-cards.ts` ~330 and the Aces sortie `IAcesScenario` ~350); the others wait until the app models them, with a line on #592 listing which.
2. **MechWarrior cards.** Recommended: the Aces Named Pilot cards (skill, Edge, abilities: `aces-campaign.ts`) and the Alpha Strike pilot cards with Special Pilot Abilities (`alpha-strike-special-abilities.ts`); the read pilot goes onto the selected unit.
3. **Game in progress from a sheet.** Recommended: read marked armor and structure pips, heat, ammo used and critical hits into a new play session for that unit; never merge into a session already open.
4. **Sheet layouts order.** Recommended: TW-era 'Mech sheets first (most common), then the other TW unit types, then BMR / Third Edition / Battledroids layouts.

## Usual checklist

| Item | Task |
|---|---|
| Records (the read design, the read pilot, the read session) | 1-5 |
| Construction (a read design goes through the creator's validation) | 4 |
| Record sheet (the reader reads them; nothing printed changes) | 3-5 |
| Classic play (game in progress, Task 5) | 5 |
| Alpha Strike (pilot cards, Aces cards) | 1, 2 |
| TRO | none |
| Credits (photo sets thanked in news as their senders allow) | 6 |
| News, review, check, deploy, issue comments | 6 |

## Review Focus

- A misread number never saves silently: every field shows the read value and its confidence.
- A photo turned a quarter turn or upside down still reads (the rotation pass).
- A hand-filled pip count against a printed pip pattern: crossed-out and filled pips both count as marked.
- A weapon name that matches two catalog items: the player picks; no guess.

---

### Task 1: MechWarrior / pilot cards (#592)

**Files:** `src/classes/alpha-strike-pilot-card-scan.ts` (new, `scanPilotCard(io)`), its test, the pilot review form in the AS roster and Aces campaign pages.

- [ ] Failing tests on synthetic images: skill, Edge, abilities read; an unknown ability name is listed for the player, not dropped.
- [ ] Run, FAIL. Implement. Run, PASS. Check against the local photo set and record the hit rate in the ledger `.superpowers/sdd/2026-11-22-photo-readers/progress.md`. Commit `Card reader: MechWarrior and pilot cards (#592)`.

### Task 2: Aces sortie and objective cards (#592)

**Files:** `src/classes/aces-scenario-card-scan.ts` (new), its test, the Aces scenario library page.

- [ ] Failing tests: units, objectives (primary/secondary), waypoints and special rules read into `IAcesScenario`.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Card reader: Aces sorties and objectives (#592)`.
- [ ] Comment on #592 listing the Support / Initiative cards still waiting on the app (OWNER CALL 1).

### Task 3: Sheet kind detection (#598)

**Files:** `src/classes/record-sheet-scan.ts` (new: `detectSheetKind(io)`, layouts as data: label anchors per unit type and edition), its test.

- [ ] List every sheet layout the app prints and the older ones in the library (`record-sheets/`), one row each in the ledger.
- [ ] Failing tests: each layout detected from its anchors on a synthetic render of our own sheet (render it with the app's sheet code, then degrade it: blur, skew, low contrast).
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Sheet reader: knows which sheet it is looking at (#598)`.

### Task 4: Design from a sheet (#598)

- [ ] Failing tests per layout (OWNER CALL 4 order): tonnage, movement, heat sinks, armor per location, weapons by location (catalog match), and the design validates in its creator; the result saves through the #595 custom-unit path.
- [ ] Run, FAIL. Implement. Run, PASS. One commit per layout family `Sheet reader: <unit type> sheets into a design (#598)`.

### Task 5: Game in progress from a hand-filled sheet (#598)

- [ ] Failing tests: marked pips, heat, ammo used and crits become a new play session (OWNER CALL 3).
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Sheet reader: a hand-filled sheet becomes a game in progress (#598)`.

### Task 6: Checklist, review and ship

- [ ] **News:** bullets per reader.
- [ ] **Check:** `npm run check`.
- [ ] **Review:** Sonnet review per task; Opus review of Task 4.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #592 and #598 in NGCFells' voice; close #592 when its list is done; give the URLs.

## Models

Sonnet throughout; Opus review for Task 4.
