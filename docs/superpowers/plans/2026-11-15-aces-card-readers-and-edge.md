# Aces card readers (Command, Special Orders, Edge) and Edge abilities (#592, #93) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Players fill their own Aces card library from photos of every card type (behavior, Command, Special Orders, Edge), and Named Pilots pick Edge abilities from the entered Edge cards with reminders during play.

**Architecture:** Each card type gets a `scan…Card( io: ICardScanIO )` in its own file under `src/classes/`, built on the shared `card-scan-io.ts` pieces, scored locally against Rekikire's photos by the gitignored harness (`src/zz-local/`, `tools-local/aces-harness/`). The library (`src/data/aces-cards.ts`) gains an Edge card type. The campaign page picks Edge abilities from it; the game page reminds per phase.

**Tech Stack:** TypeScript, tesseract.js (browser) / tesseract.js + pngjs (harness), React, vitest from PowerShell.

**Spec:** Issues #592 (comment 2026-11-15) and #93 (scope update 2026-11-03 and comment 2026-11-15) on ngcfells/battletech-tools; the 2026-11-02 Edge decision in `C:/repo/JBTToolsSupportFiles/handoff.md` ("Edge ability cards (#93), decided 2026-11-02").

**Models:** Tasks 1-5 (harness, orientation, readers): Opus 5.5. They need judgment over OCR output and repeated harness runs; switch a reader to Fable 5.2 only if its score stalls below the target after two rounds. Tasks 6-9 (Edge library, pilots, reminders, news): Sonnet 5.5 implementers. Per-task reviews: Sonnet 5.5; whole-branch review: Opus 5.5.

## Global Constraints

- **No card text ships.** Nothing from `tools-local/` (photos, typed library, phrase lists) goes into `src/` outside `src/zz-local/`, into tests, issues or commits. Committed tests use synthetic OCR lines written for the test. Reading a player's own card into their own library (on their device) is the purpose and is fine.
- The one shipped Edge sample is ours, built from a custom unit's needs and marked NOT OFFICIAL (2026-11-02 decision).
- Every reader shows the existing "OCR isn't perfect" note and the "checked against the card" box before saving.
- Library and game save formats stay loadable: new fields optional; `ACES_CARD_LIBRARY_VERSION` stays 1 (a missing `edgeCards` reads as `[]`).
- Harness: `run.ps1` deletes `eng.traineddata` after a run; run vitest from PowerShell; scripts go to files (heredoc-with-apostrophe hook).
- Commit on `beta` per task; do not push or deploy without the owner.

## Review Focus

- A photo whose phone rotation flag turns the card sideways (all 168 of Rekikire's photos carry EXIF orientation 6) must still read (Task 2 test `reads a card turned a quarter`).
- A Command card back or a card of another type given to the wrong reader returns a warning, not a half-filled card (Tasks 3-5 `wrong card` tests).
- A library exported before Edge cards existed imports with `edgeCards: []` (Task 6 test).
- A Named Pilot whose saved Edge ability names no entered card keeps it and shows it as typed (Task 7 test).
- Reminders never show Edge text the player did not enter; with no linked campaign the panel is absent (Task 8 tests).

---

### Task 1: Harness for every card set, with the browser's orientation

**Files (all gitignored, local):**
- Create: `tools-local/aces-harness/prep.py` (JPG to PNG per set, EXIF applied the way a browser shows it, scaled to 2000 px wide)
- Modify: `tools-local/aces-harness/run.ps1` (`-Set behavior|command|special|edge`, default behavior)
- Modify: `src/zz-local/aces-rek-harness.test.ts` (`ACES_KIND` picks the scan function; prints one JSON result per photo as now)
- Create: `tools-local/aces-harness/score-command.cjs`, `score-special.cjs` (keys: `rek/aces-card-library.json` `commandCards` / `specialOrders`), `score-edge.cjs` (key: `rek/edge-key.json`, typed locally from the 11 photos in Task 5)

- [ ] **Step 1:** `prep.py <set>` writes `rek/png-<set>/*.png`: `ImageOps.exif_transpose`, then scale so the width is 2000 (the browser's `cardWidth`). Run it for all four sets; expect 132 / 20 / 5 / 11 files.
- [ ] **Step 2:** Run the behavior set as is: `.\tools-local\aces-harness\run.ps1 -Set behavior -Out r-all-0.txt`. Expected: most photos fail the layout (sideways). Save the score as the orientation baseline; keep `baseline.txt` (the old 18 upright PNGs) for comparison.
- [ ] **Step 3:** No commit (local only). Note the scores in the ledger `.superpowers/sdd/2026-11-15-aces-readers/progress.md`.

### Task 2: Quarter-turn orientation

**Files:**
- Modify: `src/classes/card-scan-io.ts` (add `cardScanTurn`)
- Modify: `src/classes/card-scan-browser.ts` (`scanCardPhoto` options)
- Modify: `src/zz-local/aces-rek-harness.test.ts` (same retry as the browser)
- Test: `src/classes/card-scan-io.test.ts`, `src/classes/aces-card-scan.test.ts`

**Interfaces:**
- Produces:
  - `export const cardScanTurn = ( data: ArrayLike<number>, width: number, height: number, quarters: 1 | 2 | 3 ): { data: Uint8ClampedArray; width: number; height: number }` (clockwise quarter turns)
  - `export interface ICardScanOptions<T> { shape: "landscape" | "portrait"; found: ( result: T ) => boolean }`
  - `scanCardPhoto<T>( file: Blob, scan: ( io: ICardScanIO ) => Promise<T>, options?: ICardScanOptions<T> ): Promise<T>`: when the photo's shape differs from `shape`, turn it 1 quarter first; if `found` is false, try 3 quarters, then the 2-quarter turn of the first try; return the first found result, else the first result.
  - Shapes: behavior cards and Special Orders landscape; Command and Edge cards portrait.

- [ ] **Step 1: Failing tests:** `cardScanTurn` on a 3x2 image with distinct pixels gives the expected 2x3 layouts for 1, 2, 3 quarters, and 4 turns of 1 restore the input. A fake `ICardScanIO` scan test: `scanWithTurns` (the pure helper `scanCardPhoto` uses, exported for tests) calls the scan up to three times and returns the first `found` result.
- [ ] **Step 2:** Run, see them fail.
- [ ] **Step 3:** Implement; the harness uses the same helper on `pngjs` data.
- [ ] **Step 4:** Unit tests pass; harness `-Set behavior` scores within 1 point of `baseline.txt` per field type on the 18 old photos and reads the other 114.
- [ ] **Step 5: Commit** `Card reader: photos turned a quarter or upside down read too (#592)`

### Task 3: Command card reader

**Files:**
- Create: `src/classes/aces-command-card-scan.ts`
- Modify: `src/ui/pages/alpha-strike/aces/library.tsx` (photo input on the Command card form, as on the behavior card form)
- Test: `src/classes/aces-command-card-scan.test.ts`, `src/ui/pages/alpha-strike/aces/aces-card-scan-ui.test.tsx`

**Interfaces:**
- Consumes: `parseAcesPriorityLine` (with #637's Starting Armor support), `restoreAcesScanIcons`, `acesScanTagColour`, `matchAcesPhrase`.
- Produces: `export interface IAcesCommandScanResult { found: boolean; deck: string; faction: string; letter: string; cardNumber: string; orders: IAcesCommandOrder[]; red: IAcesPriorityRule[]; yellow: IAcesPriorityRule[]; blue: IAcesPriorityRule[]; warnings: string[] }`, `scanAcesCommandCard( io: ICardScanIO ): Promise<IAcesCommandScanResult>`, `applyAcesCommandScan( card: IAcesCommandCard | null, scan: IAcesCommandScanResult ): IAcesCommandCard`.

Layout (portrait, from the photos): title band (deck, faction) at top left, letter box top right; ORDERS panel right of the portrait (phase heading in bold, then the order); three columns below headed RED / YELLOW / BLUE (find them by the header colours with `acesScanTagColour`), numbered lines with ▲ / ▼ / ⌖ icons; card number bottom left ("7/10"). If photos show a second side (support, emplacement, artillery, Battlefield Support, strategy rows), read it into the same result and score it.

- [ ] **Step 1: Failing tests** on synthetic OCR lines through a fake `ICardScanIO` (the pattern in `aces-card-scan.test.ts`): a red column of "1. [up] M damage", "2. [up] starting Armor" becomes `[ { stat: "damage-m", direction: "highest" }, { stat: "armor-start", direction: "highest" } ]`; an order block "Initiative Phase:" + text becomes `{ phase: "initiative", text }`; a behavior card fed in returns `found: false` with a warning.
- [ ] **Step 2:** Run, fail. **Step 3:** Implement. **Step 4:** Unit tests pass; harness `-Set command` scored by `score-command.cjs`. Target: at least 90% of fields right over the 20 photos; list the misses in the ledger.
- [ ] **Step 5: Commit** `Card reader: Aces Command cards (#592)`

### Task 4: Special Orders reader

**Files:**
- Create: `src/classes/aces-special-order-scan.ts`
- Modify: `library.tsx` (photo input on the Special Order form)
- Test: `src/classes/aces-special-order-scan.test.ts`

**Interfaces:**
- Consumes: `parseAcesScanColumn` for the right-hand behavior column, `parseAcesScanHeader`-style priority read ("-500", "000").
- Produces: `IAcesSpecialOrderScanResult { found: boolean; name: string; kind: TAcesSpecialOrderKind; cardNumber: string; priority: number | null; priorityIsModifier: boolean; rules: string[]; column: IAcesBehaviorColumn | null; preFilters: string[]; spotter: string[]; warnings: string[] }`, `scanAcesSpecialOrder( io )`, `applyAcesSpecialOrderScan( order, scan )`.

Layout (landscape): name and category top left, priority box top right (a leading "-" means a modifier), rules panel left (bullets become `rules` lines), behavior column right, "Special Order n/5" bottom left. `kind` from the name ("Forced Withdrawal" to `forced-withdrawal`, etc.; unknown to `other`).

- [ ] **Step 1: Failing tests** with synthetic lines: "-500" gives `priority 500, priorityIsModifier true`; "000" gives `0, false`; name "Fleeing" gives kind `fleeing`.
- [ ] **Steps 2-4:** as Task 3; target every field right on at least 4 of the 5 photos.
- [ ] **Step 5: Commit** `Card reader: Aces Special Orders cards (#592)`

### Task 5: Edge card reader

**Order:** run Task 6 first; this task consumes its types.

**Files:**
- Create: `src/classes/aces-edge-card-scan.ts`
- Create (local): `tools-local/aces-harness/rek/edge-key.json` (typed from the 11 photos; local only)
- Test: `src/classes/aces-edge-card-scan.test.ts`

**Interfaces:**
- Consumes: Task 6's `IAcesEdgeCard`, `TAcesEdgePhase`, `TAcesEdgeTrigger`.
- Produces: `IAcesEdgeScanResult { found: boolean; name: string; category: string; cardNumber: string; condition: string; text: string; cost: number | null; phase: TAcesEdgePhase; trigger: TAcesEdgeTrigger; warnings: string[] }`, `scanAcesEdgeCard( io )`, `applyAcesEdgeScan( card, scan )`.

Layout (portrait): art top, name and category ("MOVEMENT") on the dark band, a bold condition line ending in ":", body text, "n/12" bottom left. `cost` from "Spend N Edge"; `phase` from the category or condition words (movement, combat/attack, end, initiative, else `any`); `trigger` from the condition by keyword table (Task 6's list).

- [ ] Steps as Task 3. Target: name, category, card number, cost and phase right on at least 10 of 11; body text at least 95% of words. **Commit** `Card reader: Aces Edge cards (#592, #93)`

### Task 6: Edge cards in the card library (#93)

**Files:**
- Modify: `src/data/aces-cards.ts` (type, constructor, normalize, validate, merge, `IAcesCardLibrary.edgeCards`)
- Modify: `src/data/aces-card-samples.ts` (one sample of ours, NOT OFFICIAL)
- Modify: `src/ui/pages/alpha-strike/aces/library.tsx` (a fifth kind "Edge cards": form, list, JSON, photo input from Task 5)
- Test: `src/data/aces-cards.test.ts`, a library UI test

**Interfaces:**
- Produces:
```ts
export type TAcesEdgePhase = "initiative" | "movement" | "combat" | "end" | "any";
export type TAcesEdgeTrigger = "none" | "moving" | "attacking" | "attacked" | "critical-hit" | "enemy-rear" | "damaged" | "other";
export interface IAcesEdgeCard {
    id: string; name: string; category: string; cardNumber: string;
    cost: number | null; phase: TAcesEdgePhase; trigger: TAcesEdgeTrigger;
    /** The player's own words from their card; stays in their library. */
    condition: string; text: string;
    source: IAcesSource | null; sample: boolean; notes: string;
}
export const newAcesEdgeCard = (): IAcesEdgeCard;
export const normalizeAcesEdgeCard = ( value: unknown ): IAcesEdgeCard | null;
export const validateAcesEdgeCard = ( card: IAcesEdgeCard ): string[]; // name required; cost null or 0-9
```
- [ ] **Step 1: Failing tests:** an old library JSON without `edgeCards` normalizes with `edgeCards: []`; merge adds Edge cards by id; validation flags an empty name; the sample's notes contain "NOT OFFICIAL".
- [ ] **Steps 2-4:** implement, run the Aces suite. **Step 5: Commit** `Aces: Edge cards in the card library (#93)`

### Task 7: Named Pilots pick Edge abilities from entered cards (#93)

**Files:**
- Modify: `src/ui/pages/alpha-strike/aces/campaign.tsx:375-386`
- Test: a campaign UI test (`aces-campaign-edge.test.tsx`)

**Interfaces:**
- Consumes: library `edgeCards` (`getAcesCardLibrary`), `AcesNamedPilot.edgeAbilities: string[]`, `edgeAbilityCount`.

- [ ] **Step 1: Failing tests:** with two Edge cards entered, the pilot's Edge field offers them as checkboxes; ticking one stores its name; more ticks than `edgeAbilityCount` shows a warning; a saved name with no card is listed as "typed" and kept; with no Edge cards entered the free-text field remains.
- [ ] **Steps 2-4**, **Commit** `Aces: Named Pilots pick Edge abilities from the card library (#93)`

### Task 8: Edge reminders during play (#93)

**Files:**
- Create: `src/ui/pages/alpha-strike/aces/_edge-reminders.tsx`
- Modify: `src/ui/pages/alpha-strike/aces/game.tsx` (render per phase when `game.campaignId` is set)
- Test: `aces-edge-reminders.test.tsx`

**Interfaces:**
- Produces: `export const getAcesEdgeReminders = ( pilots: AcesNamedPilot[], cards: IAcesEdgeCard[], phase: TAcesPhase ): { pilot: string; card: IAcesEdgeCard }[]` (living pilots only; phase match or `any`), and the component listing pilot, card name, cost and the player's own condition line, plus a fixed hint per trigger ("enemy-rear": "if the unit is in an enemy's rear arc").

- [ ] **Step 1: Failing tests:** a movement-phase card shows in Movement and not in Combat; a killed pilot's cards don't show; no campaign gives no panel; only entered text appears.
- [ ] **Steps 2-4**, **Commit** `Aces: Edge ability reminders during play (#93)`

### Task 9: News, full check, report

- [ ] News `<li>`s in `src/ui/pages/home.tsx` (the readers, Edge cards, pilots, reminders; thanks to Rekikire for the photos).
- [ ] `npm run check`: exit 0.
- [ ] Commit `News: Aces card readers and Edge abilities`; report harness scores to the owner; push and deploy only on their go-ahead; then comment on #592 and #93 (scores, what is left).
