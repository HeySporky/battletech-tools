# Quirks in Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quirks change play: every quirk record carries typed effects, a per-game "Use design quirks" switch turns
them on, Classic play applies them where the app computes the number and lists the rest on the unit's play panel, and
Alpha Strike play applies the Alpha Strike Companion's quirks.

**Architecture:** A closed `QuirkEffect` union goes on `IQuirk` as `effects` (and `alphaStrike` for the ASC list).
One resolver module turns a unit's active assignments into effects for a context (weapon, range band, target), and
the existing calculators call it: the 'Mech GATOR (`getTargetToHitFromWeapon`), the vehicle weapon rows, 'Mech heat
(`getTurnHeatDifference`), the force's Initiative line and the AS unit's to-hit numbers. Effects the app has no number
for (piloting rolls, criticals, maintenance, triggered rolls) are listed on a "Quirks in play" panel with their value
and trigger.

**Tech Stack:** TypeScript 7, React 18, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-21-quirks-design.md` (Goals: Play; Effects; User rulings 2, 3, 6, 8; Claude's
calls: the switch). Plans 1-2 are done (catalog, storage, sheet, canon assignments, importers). Plan 4 is the T&T and
comms catalog and the Lost Issues article; its reaction-time Initiative penalty plugs into Task 5's Initiative line.

## Global Constraints

- "No quirk stats invented. Every record and every assignment cites a book and page, or a TRO entry."
- Effect values come from the page each record already cites (`sources`), read from the page image, never the text
  extract of BMM pp.90-95 or CO p.228 ("garbled by the two-column layout"). The record's `summary` is a guide, not a
  source.
- "A quirk whose rule fits none of these is listed and shown with its rules text and marked 'not yet applied in
  play'; it never blocks a design. Adding a new effect type is the only change that needs code."
- "Quirks are an optional rule in play ... a per-game 'Use design quirks' switch, off by default; the builder and
  record sheet always show them."
- Ruling 2: AS card unchanged; "Design quirks that appear in published sourcebooks, but not in this book, have no
  effect in Alpha Strike play" (ASC p.59).
- Initiative: "Command 'Mech +1, Battle Computer +2, never stacked, CO p.225".
- "heat generated per turn (Combat Computer −4, floored at 0)".
- Summaries in our own words, never rulebook text. No MegaMek code or data.
- MegaMek/SSW never receive custom content.

## Review Focus

1. A quirk assigned with `fromYear`/`toYear` outside the game's year must not apply in play (the record sheet still
   lists it). Test in Task 2.
2. A weapon quirk on a destroyed or uninstalled weapon (OmniMech pod swapped out) must not apply. Test in Task 2.
3. Switch off (and every save made before this plan, where the field is missing) means no quirk changes any number.
   Test in Tasks 3 and 4.
4. Command 'Mech and Battle Computer on two units of one side give +2, not +3; a destroyed unit's quirk no longer
   counts. Test in Task 5.
5. Combat Computer on a 'Mech generating 3 heat leaves 0 generated, never negative generation that eats dissipation.
   Test in Task 4.

## File map

- Modify `src/data/quirk-interfaces.ts`: `QuirkEffect`, `IQuirk.effects`, `IQuirk.alphaStrike`.
- Modify `src/data/quirks.ts`: effects for all 87 records; `alphaStrike` for the ASC ones.
- Create `src/utils/quirk-effects.ts` (+ test): the resolver.
- Modify `src/classes/battlemech-force.ts`, `src/classes/alpha-strike-force.ts`: `quirksInPlay`.
- Modify `src/utils.ts` (`getTargetToHitFromWeapon`), `src/classes/battlemech.ts` (`getTurnHeatDifference`),
  `src/ui/pages/classic-battletech/roster/_vehiclePlay.tsx`, `play.tsx`, `home.tsx` (roster).
- Create `src/ui/components/quirks-in-play.tsx` (+ test): the panel.
- Modify `src/classes/alpha-strike-unit.ts`: carried quirks and their to-hit.

---

### Task 1: Effect types and effect data

**Files:**
- Modify: `src/data/quirk-interfaces.ts`, `src/data/quirks.ts`
- Test: `src/data/quirks.test.ts` (add cases)

**Interfaces:**
- Produces:

```ts
export type QuirkRangeBand = "short" | "medium" | "long";
export type QuirkEffect =
    | { type: "to-hit"; modifier: number; scope: "unit" | "weapon";
        rangeBand?: QuirkRangeBand | "parameter"; vsAirborne?: true; attack?: "weapon" | "punch" | "kick" | "physical" }
    | { type: "to-hit-against"; modifier: number; when?: string }
    | { type: "initiative"; modifier: number }
    | { type: "heat-generated"; modifier: number }
    | { type: "piloting"; modifier: number; trigger: string }
    | { type: "damage"; note: string }
    | { type: "maintenance"; multiplier: number }
    | { type: "triggered-roll"; target: number; trigger: string; outcome: string };
// IQuirk gains:
effects?: QuirkEffect[];          // absent or [] = "not yet applied in play"
alphaStrike?: { effects: QuirkEffect[]; cost: number; source: IQuirkSource };
```

`rangeBand: "parameter"` takes the band from the assignment's parameter (Improved/Poor Targeting). `trigger`, `when`,
`note` and `outcome` are short phrases in our own words ("fall", "kick", "4+: a false contact").

- [ ] **Step 1: Write the failing tests** in `quirks.test.ts`:

```ts
it("gives Accurate Weapon -1 to its weapon's to-hit", () => {
    expect(findQuirk("quirk-accurate-weapon")?.effects).toEqual([{ type: "to-hit", modifier: -1, scope: "weapon" }]);
});
it("gives Anti-Aircraft Targeting -2 against airborne targets", () => {
    expect(findQuirk("quirk-anti-aircraft-targeting")?.effects).toEqual([{ type: "to-hit", modifier: -2, scope: "unit", vsAirborne: true }]);
});
it("gives Improved Targeting -1 in the band it was assigned", () => { /* rangeBand: "parameter", modifier -1 */ });
it("gives Command 'Mech +1 and Battle Computer +2 Initiative", () => { /* type "initiative" */ });
it("gives Combat Computer -4 heat generated", () => { /* type "heat-generated", modifier -4 */ });
it("gives every quirk an effects list, empty only where no effect type fits", () => {
    const unapplied = quirks.filter((q) => !q.effects?.length).map((q) => q.tag);
    expect(unapplied).toEqual(EXPECTED_UNAPPLIED); // the list Step 3 ends with, written into the test
});
it("keeps alphaStrike only on quirks the Alpha Strike Companion lists, each cited to ASC pp.59-66", () => { ... });
```

(`findQuirk` is the existing lookup in `quirk-registry.ts`; use whatever it is named there.)

- [ ] **Step 2: Run** `npx vitest run src/data/quirks.test.ts < /dev/null`. Expected: the new cases FAIL.
- [ ] **Step 3: Add the types and enter effects for all 87 records,** reading each record's cited page
  image (CO pp.225-234 first, BMM pp.82-89 for 'Mech-only quirks). Then enter `alphaStrike` from ASC pp.59-66 (the
  errata v1.5 printing the spec cites, `JBTIICRework/text/68-Alpha-Strike-Companion-2022-06-06-v1-5.txt` to find the
  pages, the PDF page image for values). A quirk whose rule fits no type gets `effects: []`. Log each page read in the
  ledger. Write the final unapplied list into `EXPECTED_UNAPPLIED`.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then `npm run typecheck`.
- [ ] **Step 5: Commit** "Quirks: play effects for every quirk, and the Alpha Strike Companion's list".

### Task 2: The resolver

**Files:**
- Create: `src/utils/quirk-effects.ts`, `src/utils/quirk-effects.test.ts`

**Interfaces:**
- Consumes: `QuirkList.getActive(installedUuids, year)` (`src/classes/quirk-list.ts`), `QuirkEffect`.
- Produces:

```ts
export interface IAppliedQuirkEffect { effect: QuirkEffect; quirkName: string; label: string /* "Accurate Weapon (-1)" */ }
export function getQuirkEffects(list: QuirkList, installedUuids: string[], year: number | undefined): IAppliedQuirkEffect[];
export function getQuirkToHit(list: QuirkList, installedUuids: string[], year: number | undefined,
    context: { weaponUuid?: string; rangeBand?: QuirkRangeBand; vsAirborne?: boolean; attack?: "weapon" | "punch" | "kick" | "physical" }
): { modifier: number; labels: string[] };
export function getQuirkHeatGenerated(list: QuirkList, installedUuids: string[], year: number | undefined): number; // sum, e.g. -4
export function getQuirkInitiative(list: QuirkList, installedUuids: string[], year: number | undefined): { modifier: number; label: string } | null; // largest
```

A weapon-scope effect applies only when `context.weaponUuid` equals the assignment's `equipmentUuid` or is in its
`bayUuids`; a unit-scope effect applies to every weapon attack (and `attack` defaults to "weapon"). An effect with
`vsAirborne` applies only when `context.vsAirborne`; with `rangeBand` only in that band (`"parameter"`: the assignment's
`parameter`, lower-cased).

- [ ] **Step 1: Write the failing tests:** Accurate on weapon A gives -1 for A and 0 for B; Improved Targeting
  (Long) gives -1 at long, 0 at short; Anti-Aircraft gives -2 only with `vsAirborne`; an assignment with
  `toYear: 3024` gives nothing in 3025 (Review Focus 1); an assignment on a uuid missing from `installedUuids` gives
  nothing (Review Focus 2); Combat Computer gives -4 heat; Command 'Mech plus Battle Computer on one unit gives +2.
- [ ] **Step 2: Run** `npx vitest run src/utils/quirk-effects.test.ts < /dev/null`. Expected: FAIL, module missing.
- [ ] **Step 3: Implement** the four functions.
- [ ] **Step 4: Run** it. Expected: PASS.
- [ ] **Step 5: Commit** "Quirks: resolve a unit's quirks into play effects".

### Task 3: The "Use design quirks" switch

**Files:**
- Modify: `src/classes/battlemech-force.ts`, `src/classes/alpha-strike-force.ts`,
  `src/ui/pages/classic-battletech/roster/home.tsx`, the AS roster page that holds the AS force options
- Test: the two force classes' test files; `e2e/quirks-play.spec.ts` (create)

**Interfaces:**
- Produces: `quirksInPlay: boolean` on both forces (default `false`), exported as `quirksInPlay?: boolean` and read
  back as `!!data.quirksInPlay`.

- [ ] **Step 1: Write the failing tests:** a new force has `quirksInPlay === false`; setting it to true round-trips
  through export/import; importing an export without the field gives `false` (Review Focus 3).
- [ ] **Step 2: Run** the force tests. Expected: FAIL.
- [ ] **Step 3: Implement** the field, and a checkbox "Use design quirks" beside "Space forces in this game" on the
  Classic roster page (same pattern, `home.tsx:55` and `:203`), and the same on the AS roster's force options.
- [ ] **Step 4: Run** them. Expected: PASS.
- [ ] **Step 5: Commit** "Roster: a per-game switch for design quirks, off by default".

### Task 4: Classic 'Mech and vehicle play

**Files:**
- Modify: `src/utils.ts` (`getTargetToHitFromWeapon`, after the heat modifier block), `src/classes/battlemech.ts`
  (`getTurnHeatDifference`), `src/ui/pages/classic-battletech/roster/_vehiclePlay.tsx` (`renderWeaponRow`),
  `play.tsx` (pass the switch)
- Test: `src/utils.test.ts` or the existing GATOR tests in `src/classes/battlemech.test.ts`; `_vehiclePlay.test.tsx`

**Interfaces:**
- Consumes: Task 2's `getQuirkToHit`, `getQuirkHeatGenerated`; Task 3's `quirksInPlay`.
- Produces: `getTargetToHitFromWeapon(mech, index, target, equipmentList, quirksInPlay = false)`;
  `BattleMech.getTurnHeatDifference(equipmentList, quirksInPlay = false)`. The quirk to-hit joins `otherModifiers`
  and `otherModifiersExplanation` with its labels ("Accurate Weapon (-1)"). The range band passed is the one the
  GATOR has just worked out, so the quirk block moves after the range block.

Heat: generated heat (movement plus weapons) plus the quirk modifier, floored at 0, then dissipation:

```ts
const generated = Math.max(0, move + weapons + (quirksInPlay ? getQuirkHeatGenerated(...) : 0));
return generated - dissipation;
```

- [ ] **Step 1: Write the failing tests:** an Accurate medium laser at short range shows one less to-hit than the
  same laser without the quirk, and its explanation contains "Accurate Weapon (-1)"; with `quirksInPlay` false it
  is unchanged (Review Focus 3); a Combat Computer 'Mech that walked and fired 2 heat of weapons (3 generated) with
  10 dissipation has a turn heat difference of -10, not -11 (Review Focus 5); a vehicle with an Accurate weapon shows
  its to-hit row one lower.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** and thread `currentCBTForce.quirksInPlay` from `play.tsx` (both call sites, lines near
  1589 and 2307) and from `record-sheet-equipment-table.tsx` (pass `false`: the printed sheet shows no live quirk
  math). Vehicle quirks come from `vehicle.quirks`.
- [ ] **Step 4: Run** the unit tests and `npx vitest run < /dev/null`. Expected: PASS.
- [ ] **Step 5: Commit** "Classic play: quirk to-hit modifiers and Combat Computer heat".

### Task 5: Initiative and the "Quirks in play" panel

**Files:**
- Create: `src/ui/components/quirks-in-play.tsx`, `src/ui/components/quirks-in-play.test.tsx`
- Modify: `src/classes/battlemech-force.ts` (`getInitiativeModifier`), `play.tsx` and each `_*Play.tsx` for a unit
  type with `quirks` (vehicle, fighter, battle armor, small craft, capital ship), plus the turn header in `play.tsx`

**Interfaces:**
- Consumes: Task 2's `getQuirkEffects`, `getQuirkInitiative`.
- Produces: `BattleMechForce.getInitiativeModifier(): { modifier: number; label: string } | null`: the largest of its
  active (not destroyed) units' Initiative effects, never summed; `<QuirksInPlay effects={IAppliedQuirkEffect[]} />`
  lists each effect as "Name: what it does" with its number and trigger, and each quirk with no effects as
  "Name: not yet applied in play". Plan 4 adds the T&T reaction-time average to `getInitiativeModifier`.

- [ ] **Step 1: Write the failing tests:** a force with a Command 'Mech on one 'Mech and a Battle Computer on another
  gives `{ modifier: 2 }` with the Battle Computer label; destroying the Battle Computer 'Mech gives +1 (Review
  Focus 4); the panel renders "Exposed Actuators" with its piloting note and "not yet applied in play" for an
  unapplied quirk; the panel renders nothing when the switch is off.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.** The turn header shows "Initiative: +2 (Battle Computer)" while the switch is on.
- [ ] **Step 4: Run** them, then `e2e/quirks-play.spec.ts`: a 'Mech with Accurate Weapon in a roster, switch on,
  shows the lower to-hit and the panel; switch off, neither. Expected: PASS.
- [ ] **Step 5: Commit** "Classic play: the side's quirk Initiative, and each unit's quirks in play".

### Task 6: Alpha Strike play

**Files:**
- Modify: `src/classes/alpha-strike-unit.ts`, the designs' AS conversion (`getAlphaStrikeForceStats` in
  `battlemech.ts`, and the vehicle's), the AS play view that shows `currentToHitShort`...
- Test: `src/classes/alpha-strike-unit.test.ts`

**Interfaces:**
- Consumes: Task 1's `alphaStrike` effects; Task 3's AS `quirksInPlay`.
- Produces: AS units made from a design carry `quirks?: string[]` (tags of its active unit-level quirks that have an
  `alphaStrike` record), saved and loaded; MUL units carry none (the MUL has no quirk data). `calcCurrentValues` adds
  the to-hit effects of those quirks per band while the AS force's `quirksInPlay` is on. The AS card does not change
  (ruling 2).

- [ ] **Step 1: Write the failing tests:** a unit with an ASC to-hit quirk (the one Task 1's data gives) shows that
  band's to-hit changed with the switch on and unchanged with it off; a non-ASC quirk changes nothing; quirks
  round-trip through export/import.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** them and the full suite. Expected: PASS.
- [ ] **Step 5: Commit** "Alpha Strike play: the Companion's quirks, for units made from a design".

### Task 7: Docs

- [ ] Update `TODO.md` (quirks: play effects done; plan 4 next), `development-status.tsx` (Done item) and the
  home page news under the current date's entry: one bullet on quirks in play, in the style of its neighbours.
  Run `npx vitest run < /dev/null`, `npm run typecheck`, `npm run lint`. Commit "Docs: quirks in play".
