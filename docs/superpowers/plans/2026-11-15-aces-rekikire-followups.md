# Aces: Rekikire follow-ups (#637, #638, #605) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Aces game answers the target lines the unit cards can answer, hides "None." orders, lets the players add units to the automated force mid-game, and lets them pick which Battlefield Support cards to spend.

**Architecture:** Engine changes go in `src/data/aces-cards.ts` (line parsing, rule shape) and `src/classes/aces-engine.ts` (stats, narrowing, orders). Game state goes in `src/classes/aces-game.ts` (add/remove units, support cards), saved through the existing optional export fields. UI goes in `src/ui/pages/alpha-strike/aces/` as small components the game page renders.

**Tech Stack:** TypeScript, React class components, vitest + Testing Library (run vitest from PowerShell: `Set-Location C:\repo\battletech-tools-master; npx vitest run --project unit <files>`).

**Spec:** GitHub issues #637, #638 and #605 on ngcfells/battletech-tools (read them with `gh issue view <n> -R ngcfells/battletech-tools`).

**Models:** Tasks 1-2 and 5: Sonnet 5.5 implementer. Tasks 3-4: Sonnet 5.5 implementer. Reviews per task: Sonnet 5.5. A whole-branch review at the end: Opus 5.5.

## Global Constraints

- Never ship card text. Tests use made-up lines in the cards' format ("[highest] Starting Armor" is a format, not card text). Never read or copy from `tools-local/` into `src/`.
- Do not change `ACES_CARD_LIBRARY_VERSION` or `ACES_GAME_EXPORT_VERSION`; new export fields are optional so older saves still load.
- Code style in these files: 4-space indent, spaces inside parentheses (`foo( a, b )`), as the existing code.
- A Bash heredoc with an apostrophe is blocked by a hook: write scripts to a file.
- Commit on `beta` after each task, message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (or the implementing model's line). Do not push or deploy; the owner approves that.
- Cite rules as "Aces p.N" only where the page is already cited in the code for that rule.

## Review Focus

- A library saved before this change (rules without `stat`) must rank "Starting Armor" lines without re-entering cards (Task 1 test `re-reads an old saved rule`).
- An added unit must not reshuffle or reset the other units' decks and damage (Task 3 test `keeps the other units' state`).
- Saving and reloading a game keeps added units and spent support cards (Task 3 and Task 5 round-trip tests).
- A lowercase or spaced "none" order ("none", " None. ") is hidden too (Task 2 test).
- Spending more support cards than the order allows is refused (Task 5 test `refuses more than the limit`).

---

### Task 1: Rank lines the unit cards answer (#637)

**Files:**
- Modify: `src/data/aces-cards.ts` (`TAcesStat`, `acesStats`, `IAcesPriorityRule`, `normalizeAcesPriorityRule`, `statSynonyms`, `parseAcesPriorityLine`)
- Modify: `src/classes/aces-engine.ts` (`getAcesUnitStats`, `getAcesDestroyObjectiveStats`, `narrowAcesCandidates`)
- Test: `src/data/aces-cards.test.ts`, `src/classes/aces-engine.test.ts`

**Interfaces:**
- Produces: `TAcesStat` gains `"armor-start" | "structure-start"` (labels "Starting Armor", "Starting Structure"); `IAcesPriorityRule.noArmor?: boolean`.

- [ ] **Step 1: Write the failing tests**

In `aces-cards.test.ts`, `describe("parseAcesPriorityLine")`:
```ts
expect( parseAcesPriorityLine( "[highest] Starting Armor" ) ).toEqual( { text: "[highest] Starting Armor", stat: "armor-start", direction: "highest" } );
expect( parseAcesPriorityLine( "[lowest] Starting Structure" ).stat ).toBe( "structure-start" );
expect( parseAcesPriorityLine( "[highest] [M] damage" ) ).toMatchObject( { stat: "damage-m", direction: "highest" } );
expect( parseAcesPriorityLine( "[highest] [S] damage" ).stat ).toBe( "damage-s" );
expect( parseAcesPriorityLine( "no Armor" ) ).toEqual( { text: "no Armor", noArmor: true } );
expect( normalizeAcesPriorityRule( { text: "no Armor", noArmor: true } )?.noArmor ).toBe( true );
expect( parseAcesPriorityLine( "Hit target's Rear" ).stat ).toBeUndefined(); // stays judged
```
In `aces-engine.test.ts`, `describe("narrowAcesCandidates")`, using candidates built with `getAcesUnitStats` on two units (A: armor 6 of 6; B: armor 2 of 8 after 6 damage):
- `ranks Starting Armor from the printed value`: rule `{ text: "[highest] Starting Armor", stat: "armor-start", direction: "highest" }` leaves B, `pending` null.
- `re-reads an old saved rule`: rule `{ text: "[highest] Starting Armor" }` (no stat) leaves B, `pending` null.
- `filters no Armor`: rule `{ text: "no Armor" }` with B at armor 0 leaves B; with nobody at 0 the line is ignored (trace contains "matches nobody").
- A judged line `{ text: "Attacked by ally this turn" }` still returns it as `pending`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run --project unit src/data/aces-cards.test.ts src/classes/aces-engine.test.ts`
Expected: FAIL on the new cases.

- [ ] **Step 3: Implement**

- `getAcesUnitStats`: `"armor-start": unit.armor`, `"structure-start": unit.structure`. `getAcesDestroyObjectiveStats`: both `startingCF`.
- `statSynonyms`: add "starting armor", "starting structure"; in `parseAcesPriorityLine` strip brackets round a single range letter before lookup (`/\[([sml])\]/i` to `$1`). A line matching `/^no armor$/i` returns `{ text, noArmor: true }`.
- `normalizeAcesPriorityRule` keeps `noArmor === true`.
- `narrowAcesCandidates`: when a rule has no `stat`, `color`, `objective`, `noArmor` or `unresolved`, use `parseAcesPriorityLine( rule.text )` in its place before deciding it is judged. `noArmor` matches `candidate.stats.armor === 0`.

- [ ] **Step 4: Run to verify they pass**, then the whole Aces suite: `npx vitest run --project unit src/classes/aces src/data/aces src/ui/pages/alpha-strike/aces`. Expected: PASS.

- [ ] **Step 5: Commit** `Aces: rank Starting Armor, [S]/[M] damage and no Armor lines from the unit cards (#637)`

### Task 2: Hide "None." orders; ideal targets name a unit (#637)

**Files:**
- Modify: `src/classes/aces-engine.ts` (`getAcesOrdersForPhase`; add `isAcesNoOrder`)
- Modify: `src/ui/pages/alpha-strike/aces/_aces-card-view.tsx:104-105`
- Test: `src/classes/aces-engine.test.ts`, `src/ui/pages/alpha-strike/aces/aces-ideal-targets.test.tsx`, `src/ui/pages/alpha-strike/aces/aces-command-card-view.test.tsx`

**Interfaces:**
- Produces: `export const isAcesNoOrder = ( text: string ): boolean` (true for `/^\s*none\.?\s*$/i`).

- [ ] **Step 1: Write the failing tests**
- `getAcesOrdersForPhase` on a card whose orders are `[ { phase: "any", text: "None." }, { phase: "end", text: "none" }, { phase: "end", text: "Real order" } ]` returns only "Real order" for "end".
- Command card view: a card with only a "None." order renders no `<li>` containing "None".
- Ideal targets: a Command card with red list `[ { text: "[highest] Starting Armor" } ]` (no stat) and two player units renders "Ideal RED:" followed by the unit with the higher printed armor, and no "needs your answer".

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement** `isAcesNoOrder`; filter it out in `getAcesOrdersForPhase` and in the card view's order list (hide the `<ul>` when nothing is left). The ideal-target test passes through Task 1's re-read.
- [ ] **Step 4: Run the Aces suite (as Task 1 Step 4).** Expected: PASS.
- [ ] **Step 5: Commit** `Aces: a "None." order is no order (#637)`

### Task 3: Add and remove automated units during play, engine (#638)

**Files:**
- Modify: `src/classes/aces-game.ts`
- Test: `src/classes/aces-game.test.ts`

**Interfaces:**
- Consumes: `AlphaStrikeForce.addToGroup( unit, groupIndex )`, `AcesGame.dealDeck( deckId )`, `isAcesEmplacementCard` (aces-helpers).
- Produces:
  - `IAcesUnitState.addedDuringPlay?: boolean`
  - `AcesGame.addAutomatedUnit( unit: AlphaStrikeUnit, groupIndex: number = 0 ): AlphaStrikeUnit` returns the copy that joined (new uuid, reset; a group is created when the force has none).
  - `AcesGame.removeAutomatedUnit( unitUUID: string ): boolean` (only units with `addedDuringPlay`; false otherwise).

- [ ] **Step 1: Write the failing tests** (reuse `makeUnit` / `makeGame` in the file)
- `adds a unit with its own deck and a log line`: game of one Brawler; add a Striker; `getAutomatedUnits()` has 2; the new state has `deckId "striker"`, `addedDuringPlay true`; the log's last line contains "joins the automated force".
- `keeps the other units' state`: cycle the Brawler's card once and damage it (`currentArmor` lowered via the unit's damage method used elsewhere in the file), add a unit, then the Brawler's `cardsCycled` and armor are unchanged.
- `adds an emplacement card ticked, with no deck`: add `buildEmplacementMULRecords()[0]` imported into an `AlphaStrikeUnit`; state `isEmplacement true`, `deckId ""`.
- `removes only units added during play`: removing the added unit returns true and logs; removing the starting Brawler returns false.
- `keeps added units through save and load`: `new AcesGame( game.export() )` (or the file's existing round-trip pattern) still has the added unit with `addedDuringPlay true`.

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.** Copy the unit through `export()`/`importUnit()` (as `setAutomatedForce` copies), give it `generateUUID()`, `reset()`, add it with `addToGroup`, create its state through `getUnitState`, set `addedDuringPlay`, then `dealDeck` only for its own deck (not `assignDecks`, which re-deals every deck). Log `getUnitLabel( unit ) + " joins the automated force."` / `" leaves the automated force (added by mistake)."`. The added unit acts from the current phase on with a fresh state (not moved, not attacked): our choice, Aces names no rule for it.
- [ ] **Step 4: Run** `npx vitest run --project unit src/classes/aces-game.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `Aces: add units to the automated force during a game (#638)`

### Task 4: Add units during play, UI (#638)

**Files:**
- Create: `src/ui/pages/alpha-strike/aces/_add-automated-units.tsx`
- Modify: `src/ui/pages/alpha-strike/aces/game.tsx` (render it in the automated force section; a Remove button on rows whose state has `addedDuringPlay`)
- Test: `src/ui/pages/alpha-strike/aces/aces-add-units.test.tsx`

**Interfaces:**
- Consumes: `searchBundledMUL( newMULSearchFilters( { term, sources: [ "mul2", "custom" ] } ) )` (`src/utils.ts`, `src/utils/mulSearchFilters.ts`), Task 3's `addAutomatedUnit` / `removeAutomatedUnit`.
- Produces: `export default function AcesAddAutomatedUnits( props: { groups: string[]; onAdd: ( record: IASMULUnit, skill: number, groupIndex: number ) => void } ): JSX.Element`

- [ ] **Step 1: Write the failing test**
- Typing "Heavy Emplacement" and pressing Search lists "Heavy Emplacement AC/20"; choosing Skill 4 and pressing its Add button calls `onAdd` with that record, 4, 0.
- At most 20 results are listed; an empty search lists nothing and shows no error.
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement** inside a `<details><summary>Add units during play</summary>`: search box + Search button, Skill select 2-6 (default 4), group select when there is more than one group, results with name, type, PV and an Add button. The game page's `onAdd` imports the record into an `AlphaStrikeUnit` (`importMUL`), sets the skill, calls `addAutomatedUnit` inside `this._update`.
- [ ] **Step 4: Run** the new test and `aces-game.browser.test.tsx`. Expected: PASS.
- [ ] **Step 5: Commit** `Aces: search the MUL to add units during a game (#638)`

### Task 5: Choose which Battlefield Support cards to spend (#605)

**Files:**
- Modify: `src/classes/aces-game.ts` (state, export/import)
- Modify: `src/classes/aces-engine.ts` (add `getAcesSupportSpendLimit`)
- Modify: `src/ui/pages/alpha-strike/aces/game.tsx` (`_renderSupport`)
- Test: `src/classes/aces-game.test.ts`, `src/classes/aces-engine.test.ts`, `src/ui/pages/alpha-strike/aces/aces-game.browser.test.tsx` or a new `aces-support-cards.test.tsx`

**Interfaces:**
- Produces:
  - `export interface IAcesGameSupportCard { id: string; name: string; spentTurn: number | null; }`
  - `IAcesGameExport.supportCards?: IAcesGameSupportCard[]`; `AcesGame.supportCards: IAcesGameSupportCard[]`
  - `AcesGame.addSupportCard( name: string ): IAcesGameSupportCard`, `AcesGame.removeSupportCard( id: string )`
  - `AcesGame.spendSupportCards( ids: string[], limit: number | null ): { ok: boolean; reason: string }`
  - `export const getAcesSupportSpendLimit = ( supportOrders: string ): number | null` (the N in "up to N", else null)

- [ ] **Step 1: Write the failing tests**
- `getAcesSupportSpendLimit( "Spend up to 2 Battlefield Support cards" )` is 2; `""` is null.
- `spends the chosen cards and logs them`: two cards added, spend one with limit 2: its `spentTurn` is the game turn, log names it.
- `refuses more than the limit`: spending 3 with limit 2 returns `ok false` and spends none.
- `keeps support cards through save and load`.
- UI: with a Command card whose `supportOrders` says "up to 1", ticking a second card is disabled; "Spend selected" marks the ticked card spent; with `supportOnlyIfStructure` the existing reminder line still shows beside the list.
- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.** The player names the cards the automated force holds (their own cards: a free-text name per card, nothing shipped). `_renderSupport` lists unspent cards with checkboxes capped at the limit, a "Spend selected" button, spent cards greyed with their turn, and an add/remove control. Render the section whenever the force holds support cards, even if the Command card lists none.
- [ ] **Step 4: Run the Aces suite.** Expected: PASS.
- [ ] **Step 5: Commit** `Aces: choose which Battlefield Support cards to spend (#605)`

### Task 6: News, full check

**Files:**
- Modify: `src/ui/pages/home.tsx` (today's news entry: one `<li>` each for #637, #638, #605; credit Rekikire for the reports)

- [ ] **Step 1:** Add the news lines.
- [ ] **Step 2:** `npm run check` from PowerShell. Expected: exit 0, no failed tests, build clean.
- [ ] **Step 3: Commit** `News: Aces follow-ups from Rekikire's playtest`
- [ ] **Step 4:** Report to the owner; push and `git deploy-beta` only on their go-ahead, then comment on #637, #638, #605 and close them.
