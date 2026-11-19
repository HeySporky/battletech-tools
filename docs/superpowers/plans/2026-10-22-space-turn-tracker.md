# Space Turn Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An optional tracker on the play screen that keeps the space and ground turns in step and records each anti-orbital Long Tom shot from firing to resolution.

**Architecture:** Pure rules functions (turn arithmetic, the 2D6 early-fire table, the resolution table) live in one
module. A `SpaceTracker` class holds the saved state (option, shots in flight, cooldowns, destroyed guns) and the
actions (fire, early-fire roll, resolve). It hangs off `BattleMechForce` and is saved with it. The UI adds a roster
checkbox, a turn-bar strip, per-unit gun controls and a resolution dialog. All UI renders nothing while the option is off.

**Tech Stack:** TypeScript, React 18 (class components on the play page), Vitest, @testing-library/react with happy-dom.

**Spec:** `docs/superpowers/specs/2026-10-22-space-turn-tracker-design.md` (the tabletop rules it follows are in `TRO.md`, Long Tom Artillery: Anti-Orbital Ammo).

## Global Constraints

- 6 ground turns to a space turn. Space turn = ceil(ground turn / 6): turns 1-6 are space turn 1, 7-12 are 2, 13-18 are 3.
- Early-fire 2D6: 2-4 catastrophic failure (weapon destroyed for the rest of the game); 5-8 misfire (round spent, scatters, gun cannot fire again this turn); 9-12 fires normally.
- Misfire reminder text: 1D6 for direction from the aimed hex on the Scatter Diagram (TacOps p.182), 3D6 hexes; normal damage where it lands, friendly units included; lost if off the playing area.
- Resolution: still in hex = normal attack roll; one hex away = normal roll at +4; two or more = miss, no roll; something else in the hex = normal roll against it; fighters or point defense = stopped only on a natural 12.
- Hit reminder: "2 capital (20 standard)".
- The anti-orbital round's tag: `ammo-is-long-tom-anti-orbital` (match with `equipmentMatchesIdentifier`, so its altTags count).
- Option off: no new controls, no new phases, and the saved force carries only `spaceInPlay: false` beyond today's fields.
- The tracker never blocks a ground turn: no button outside the tracker's own controls is disabled by it.
- The app rolls no dice. The player types each roll in.
- Never invent a stat, date, citation or page number. The only citations used are the ones above.
- Commit on `beta` per task. Trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push to `upstream`; never run `npm run deploy-prod`.

## Review Focus

1. **Saves from before this feature.** A force saved without `spaceInPlay` or `spaceTracker` loads with the option off and play unchanged. Task 2 pins it.
2. **Bad saved data.** A hand-edited or corrupt `spaceTracker` (non-array shots, negative turns, thousands of entries) loads bounded, without throwing. Task 2 pins it.
3. **Roll typed out of range.** An early-fire roll of 1, 13, 0 or non-integer is refused, with no state change. Task 1 and Task 3 pin it.
4. **Turn moved by hand, backwards.** After setting the turn from 13 back to 5, the space turn shows 1. A gun that fired in space turn 3 is not "cooling down" with a negative count. Task 1 pins the cooldown arithmetic for a last-fired turn in the future.
5. **Unit removed from the roster with a shot in flight.** The shot still lists (by saved gun and unit name) and can be resolved. Firing controls for that unit simply vanish. Task 3 pins it.

---

### Task 1: Rules functions

**Files:**
- Create: `src/utils/space-turn.ts`
- Test: `src/utils/space-turn.test.ts`

**Interfaces:**
- Produces:
  - `GROUND_TURNS_PER_SPACE_TURN = 6`
  - `getSpaceTurn(groundTurn: number): number`. Ground turns below 1 count as 1.
  - `getGroundTurnsUntilNextSpaceTurn(groundTurn: number): number`. Counts the current ground turn: 6 at turn 1, 1 at turn 6.
  - `getCooldownGroundTurns(groundTurn: number, lastSpaceTurnFired: number | null): number`. Returns `getGroundTurnsUntilNextSpaceTurn(groundTurn)` when `lastSpaceTurnFired === getSpaceTurn(groundTurn)`, else 0. A last-fired turn ahead of now returns 0.
  - `type EarlyFireResult = "destroyed" | "misfire" | "normal"`
  - `getEarlyFireResult(roll: number): EarlyFireResult | null`. Returns null unless the roll is an integer from 2 to 12.
  - `type ResolutionOutcome = "in-hex" | "one-hex" | "two-plus" | "bystander" | "defense"`
  - `RESOLUTION_ROLLS: Record<ResolutionOutcome, { label: string; roll: string }>`
  - `MISFIRE_REMINDER: string`, `HIT_REMINDER: string`. Copy them from Global Constraints.

- [ ] **Step 1: Write the failing tests**

```ts
describe("space turn arithmetic", () => {
    it.each([[1, 1, 6], [6, 1, 1], [7, 2, 6], [12, 2, 1], [13, 3, 6]])("ground turn %i is space turn %i with %i to go", (turn, space, left) => {
        expect(getSpaceTurn(turn)).toBe(space);
        expect(getGroundTurnsUntilNextSpaceTurn(turn)).toBe(left);
    });
    it("treats turn 0 as turn 1", () => expect(getSpaceTurn(0)).toBe(1));
});
describe("cooldown", () => {
    it("counts down while the gun fired this space turn", () => {
        expect(getCooldownGroundTurns(8, 2)).toBe(5);
        expect(getCooldownGroundTurns(12, 2)).toBe(1);
    });
    it("is clear from the next space turn", () => expect(getCooldownGroundTurns(13, 2)).toBe(0));
    it("is clear for a gun that never fired", () => expect(getCooldownGroundTurns(3, null)).toBe(0));
    it("is clear when the turn was moved back past the shot", () => expect(getCooldownGroundTurns(5, 3)).toBe(0));
});
describe("early fire", () => {
    it.each([[2, "destroyed"], [4, "destroyed"], [5, "misfire"], [8, "misfire"], [9, "normal"], [12, "normal"]])("%i is %s", (roll, result) =>
        expect(getEarlyFireResult(roll)).toBe(result));
    it.each([1, 13, 0, 7.5, NaN])("refuses %s", (roll) => expect(getEarlyFireResult(roll)).toBeNull());
});
describe("resolution table", () => {
    it("gives the roll for each outcome", () => {
        expect(RESOLUTION_ROLLS["one-hex"].roll).toMatch(/\+4/);
        expect(RESOLUTION_ROLLS["two-plus"].roll).toMatch(/miss/i);
        expect(RESOLUTION_ROLLS.defense.roll).toMatch(/natural 12/);
        expect(HIT_REMINDER).toContain("2 capital (20 standard)");
        expect(MISFIRE_REMINDER).toContain("TacOps p.182");
    });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/utils/space-turn.test.ts`
Expected: FAIL. The module does not exist yet.

- [ ] **Step 3: Implement the module**

- [ ] **Step 4: Run them and watch them pass**

Run: `npx vitest run src/utils/space-turn.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add src/utils/space-turn.ts src/utils/space-turn.test.ts` and commit "Space turn tracker: turn arithmetic and the early-fire and resolution tables".

---

### Task 2: Tracker state, saved with the force

**Files:**
- Create: `src/classes/space-tracker.ts`
- Modify: `src/classes/battlemech-force.ts`: the `ICBTForceExport` interface, the field list, `export()` and `import()`.
- Test: `src/classes/space-tracker.test.ts`

**Interfaces:**
- Consumes: Task 1's `getSpaceTurn`.
- Produces:
  ```ts
  export interface IAntiOrbitalShot {
      id: string;                // generateUUID()
      gunKey: string;            // `${unitUuid}:${weaponUuid}`
      unitName: string;
      weaponName: string;
      aimedHex: string;          // as typed, trimmed, at most 16 characters
      targetName: string;        // as typed, trimmed, at most 60 characters; may be ""
      firedGroundTurn: number;
      firedSpaceTurn: number;
  }
  export interface ISpaceTrackerExport {
      shotsInFlight: IAntiOrbitalShot[];
      lastFired: Record<string, number>;   // gunKey -> space turn
      destroyedGuns: string[];             // gunKeys
  }
  export class SpaceTracker {
      shotsInFlight: IAntiOrbitalShot[];
      lastFired: Record<string, number>;
      destroyedGuns: string[];
      constructor(saved?: unknown);
      export(): ISpaceTrackerExport;
      getDueShots(groundTurn: number): IAntiOrbitalShot[];   // firedSpaceTurn < getSpaceTurn(groundTurn)
  }
  ```
- On `BattleMechForce`: `spaceInPlay: boolean = false` and `spaceTracker: SpaceTracker = new SpaceTracker()`.
- `ICBTForceExport` gains `spaceInPlay?: boolean` and `spaceTracker?: ISpaceTrackerExport`. `export()` always writes
  `spaceInPlay`. It writes `spaceTracker` only while `spaceInPlay` is true.

- [ ] **Step 1: Write the failing tests**

```ts
it("is off by default and saves only the off flag", () => {
    const saved = new BattleMechForce().export();
    expect(saved.spaceInPlay).toBe(false);
    expect("spaceTracker" in saved).toBe(false);
});
it("loads a force saved before the tracker with the option off", () => {
    const old = new BattleMechForce().export();
    delete (old as Partial<ICBTForceExport>).spaceInPlay;
    expect(new BattleMechForce(old).spaceInPlay).toBe(false);
});
it("saves and reloads the option, shots in flight, cooldowns and destroyed guns", () => {
    const force = new BattleMechForce();
    force.spaceInPlay = true;
    force.spaceTracker.shotsInFlight.push({ id: "s1", gunKey: "u:w", unitName: "Gun 1", weaponName: "Long Tom", aimedHex: "0712", targetName: "Lola III", firedGroundTurn: 3, firedSpaceTurn: 1 });
    force.spaceTracker.lastFired["u:w"] = 1;
    force.spaceTracker.destroyedGuns.push("u:x");
    const back = new BattleMechForce(JSON.parse(JSON.stringify(force.export())));
    expect(back.spaceInPlay).toBe(true);
    expect(back.spaceTracker.export()).toEqual(force.spaceTracker.export());
});
it("reads corrupt saved state bounded and without throwing", () => {
    const tracker = new SpaceTracker({ shotsInFlight: "x", lastFired: { a: -4, b: "2" }, destroyedGuns: Array(5000).fill("g") });
    expect(tracker.shotsInFlight).toEqual([]);
    expect(tracker.lastFired).toEqual({});
    expect(tracker.destroyedGuns.length).toBeLessThanOrEqual(MAX_TRACKED_GUNS);
});
it("lists a shot as due from the next space turn", () => {
    const tracker = new SpaceTracker({ shotsInFlight: [{ id: "s1", gunKey: "u:w", unitName: "", weaponName: "", aimedHex: "1", targetName: "", firedGroundTurn: 3, firedSpaceTurn: 1 }] });
    expect(tracker.getDueShots(6)).toHaveLength(0);
    expect(tracker.getDueShots(7)).toHaveLength(1);
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/classes/space-tracker.test.ts`
Expected: FAIL. `SpaceTracker` does not exist.

- [ ] **Step 3: Implement `SpaceTracker` and wire it into `BattleMechForce`**

Export `MAX_TRACKED_GUNS = 200` and `MAX_SHOTS_IN_FLIGHT = 200`. Validate the saved state the same way as `vehicle.ts`
does (`savedStrings`, `savedNumber` style). A shot entry missing a string `id` or `gunKey`, or holding a turn below 1,
is dropped. A `lastFired` value that is not an integer of 1 or more is dropped.

- [ ] **Step 4: Run them, then the force's own tests**

Run: `npx vitest run src/classes/space-tracker.test.ts src/classes/battlemech-force`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit as "Space turn tracker: saved state on the force".

---

### Task 3: Anti-orbital guns and the actions

**Files:**
- Modify: `src/classes/space-tracker.ts`
- Test: `src/classes/space-tracker-guns.test.ts`

**Interfaces:**
- Consumes: Task 1 (all) and Task 2 (`SpaceTracker`, `IAntiOrbitalShot`). Also `getCompatibleAmmo`,
  `equipmentMatchesIdentifier` and `getWeaponShotsPerTon` from `src/data/equipment-registry.ts`, and
  `getComboArtillery` from `src/data/artillery-custom.ts`.
- Produces:
  ```ts
  export const ANTI_ORBITAL_AMMO_TAG = "ammo-is-long-tom-anti-orbital";
  export interface IAntiOrbitalGun {
      key: string; unitUuid: string; unitName: string;
      weapon: IEquipmentItem; bins: IEquipmentItem[];   // the unit's anti-orbital bins
      shotsLeft: number;                                // summed over bins
  }
  export function findAntiOrbitalGuns(force: BattleMechForce): IAntiOrbitalGun[];
  export type FireResult =
      | { result: "fired"; shot: IAntiOrbitalShot }
      | { result: "needs-roll"; cooldown: number }
      | { result: "misfire"; reminder: string }
      | { result: "destroyed" }
      | { result: "refused"; reason: string };
  // On SpaceTracker:
  isGunDestroyed(gun: IAntiOrbitalGun): boolean;
  getGunCooldown(gun: IAntiOrbitalGun, groundTurn: number): number;
  fire(gun: IAntiOrbitalGun, aimedHex: string, targetName: string, groundTurn: number, earlyRoll?: number): FireResult;
  rollEarlyFireForOtherRound(gun: IAntiOrbitalGun, roll: number): EarlyFireResult | null;
  resolve(shotId: string): boolean;   // removes the shot; false if no such shot
  ```

**Rules the code follows:**
- **Qualifying guns.** Look in `group.members` (`equipmentList`, `uuid`, `getName()`), `group.vehicles`
  (`getEquipmentList()`, `getUUID()`, `getName()`) and `group.buildings` (`getEquipment().map((m) => m.item)`,
  `getUUID()`, `getName()`). A weapon qualifies when `getCompatibleAmmo(piece, round)` is true, where `piece` is
  `getComboArtillery(weapon) ?? weapon` and `round` is the catalog record for `ANTI_ORBITAL_AMMO_TAG`. A combo gun
  also needs `vehicle.getArtVeeMode() === "siege"`. The unit must also carry at least one bin that matches
  `ANTI_ORBITAL_AMMO_TAG`.
- **Shots left in a bin.** Use `currentAmmo` when it is a number of 0 or more, capped at capacity; otherwise use the
  capacity. Capacity is `floor(getWeaponShotsPerTon(piece, bin) × (bin.weight || 1) + 1e-6)`. This matches
  `BattleMech.getAmmoBinRemaining`.
- **Spending a shot.** Set `currentAmmo` on the first bin with a shot left to one fewer. Play mode on 'Mechs and
  vehicles already counts shots in `currentAmmo`.
- **fire(), in this order:**
  1. Refuse a destroyed gun, an aimed hex that is empty after trimming, and a gun with no shots left.
  2. In cooldown with no `earlyRoll`, return `needs-roll` and change nothing.
  3. In cooldown with a roll that `getEarlyFireResult` rejects, refuse and change nothing.
  4. `destroyed`: spend the shot and add the gun to `destroyedGuns`. On a vehicle, also call
     `setWeaponStatus(weapon.uuid, "destroyed")`.
  5. `misfire`: spend the shot, set `lastFired`, return `MISFIRE_REMINDER`, and add no shot in flight.
  6. Otherwise (no cooldown, or `normal`): spend the shot, set `lastFired` to `getSpaceTurn(groundTurn)`, and push the shot.
- **rollEarlyFireForOtherRound()** covers the gun firing ground artillery during its cooldown. That round's ammunition
  is the player's existing play flow. Here, `destroyed` marks the gun destroyed, as in fire(). The other bands change nothing.

- [ ] **Step 1: Write the failing tests**

Build the force from a 'Mech or a vehicle that mounts a Long Tom and one ton of anti-orbital rounds (3 shots). Add
one test group of a building with the same, and one ArtVee with `custom-artvee-long-tom-combo`, as in
`_vehiclePlay.test.tsx`'s `thumperArtVee`. Tests:

- `it("finds a Long Tom with anti-orbital rounds and nothing else")`: one gun with `shotsLeft` 3. A unit with a Long
  Tom and only standard rounds gives none.
- `it("counts an ArtVee's combo gun only in Siege Mode")`
- `it("finds a building's Long Tom")`
- `it("fires: spends a shot, starts the cooldown and lists the shot")`: at turn 2, `fire(gun, "0712", "Lola III", 2)`
  returns `fired`. Then `shotsLeft` is 2, `getGunCooldown(gun, 2)` is 5, and `shotsInFlight` has 1 entry with
  `firedSpaceTurn` 1.
- `it("asks for the roll before firing early, and changes nothing")`: the second `fire` at turn 4 returns
  `{ result: "needs-roll", cooldown: 3 }`, and `shotsLeft` is still 2.
- `it.each([[3, "destroyed"], [6, "misfire"], [10, "fired"]])("an early roll of %i gives %s")`:
  - `destroyed`: `isGunDestroyed` is true, and a later fire at turn 13 is `refused`.
  - `misfire`: the result includes "3D6", and `shotsInFlight` still has 1 entry.
  - `fired`: `shotsInFlight` has 2 entries.
  - In all three, `shotsLeft` drops by 1.
- `it("refuses a roll out of range, an empty hex, and an empty bin")`
- `it("fires again freely from the next space turn")`: at turn 7, `fire(...)` returns `fired` with no roll.
- `it("a ground round fired early on 2-4 destroys the gun")`: `rollEarlyFireForOtherRound(gun, 2)` is `destroyed`;
  9 is `normal` and leaves the gun working.
- `it("marks a vehicle's weapon destroyed on its sheet")`: `vehicle.getWeaponStatus(weapon.uuid)` is `destroyed`.
- `it("resolves a shot even after its unit leaves the roster")`: fire, remove the unit's group member, and
  `getDueShots(7)` still lists the shot with its saved `unitName`. `resolve(id)` is true and empties the list.
  `findAntiOrbitalGuns` no longer lists the gun.

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/classes/space-tracker-guns.test.ts`
Expected: FAIL. `findAntiOrbitalGuns` is not exported.

- [ ] **Step 3: Implement the gun finder and the actions**

- [ ] **Step 4: Run them and watch them pass**

Run: `npx vitest run src/classes/space-tracker-guns.test.ts src/classes/space-tracker.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit as "Space turn tracker: anti-orbital guns, firing, the early-fire roll and resolution".

---

### Task 4: Setup option and the turn-bar strip

**Files:**
- Modify: `src/ui/pages/classic-battletech/roster/home.tsx`, at about line 186. Put the checkbox in a full-width row
  above the Play Mode and Print row.
- Create: `src/ui/pages/classic-battletech/roster/_spaceTrackerBar.tsx`
- Modify: `src/ui/pages/classic-battletech/roster/play.tsx`
  - Render the bar inside `.turn-counter`, after the phase-name `<h5>` block.
  - In `nextTurn`, after the turn increments: if `spaceInPlay` and the new turn has due shots, open the resolution
    dialog (Task 5's `openSpaceResolutionDialog`).
- Test: `src/ui/pages/classic-battletech/roster/_spaceTrackerBar.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`getSpaceTurn`, `getGroundTurnsUntilNextSpaceTurn`); Task 2 (`spaceInPlay`, `spaceTracker.getDueShots`, `shotsInFlight`).
- Produces: `SpaceTrackerBar` (default export) with props
  `{ force: BattleMechForce; onResolve: () => void }`. It returns `null` while `force.spaceInPlay` is false.

The roster checkbox uses `InputCheckbox`, with the label "Space forces in this game" and the description "Tracks space turns
(6 ground turns each) and anti-orbital shots in Play Mode". Its handler sets `currentCBTForce.spaceInPlay` and calls
`saveCurrentCBTForce`.

The bar shows `Space turn {n}`, then `next in {k} ground turn(s)`, then one line per shot in flight:
`{unitName}: {weaponName} at hex {aimedHex}{targetName ? ` (${targetName})` : ""}`. While due shots exist, it also
shows a "Resolve {d} shot(s)" button that calls `onResolve`.

- [ ] **Step 1: Write the failing tests**

- `it("renders nothing while the option is off")`: `container.firstChild` is null.
- `it("shows the space turn and the countdown")`: at turn 7 the text is "Space turn 2" and "next in 6 ground turns". At turn 12 it is "next in 1 ground turn".
- `it("lists shots in flight and offers to resolve the due ones")`: there is one shot fired in space turn 1. At turn
  3, the gun and hex show and there is no Resolve button. At turn 7, "Resolve 1 shot" shows, and clicking it calls `onResolve`.

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/ui/pages/classic-battletech/roster/_spaceTrackerBar.test.tsx`
Expected: FAIL. The module does not exist.

- [ ] **Step 3: Implement the bar, the checkbox and the play-page wiring**

- [ ] **Step 4: Run the bar tests, then typecheck**

Run: `npx vitest run src/ui/pages/classic-battletech/roster/_spaceTrackerBar.test.tsx; npm run typecheck`
Expected: PASS; no type errors.

- [ ] **Step 5: Commit**

Commit as "Space turn tracker: setup option and the turn bar".

---

### Task 5: Gun controls and the resolution dialog

**Files:**
- Create: `src/ui/pages/classic-battletech/roster/_antiOrbitalControls.tsx`. It exports `AntiOrbitalGunControls` and
  `SpaceResolutionDialog`.
- Modify: `src/ui/pages/classic-battletech/roster/play.tsx`
  - Render `<AntiOrbitalGunControls>` as the first child of `<div className="selected-mech">`, with the selected unit's uuid.
  - Add `openSpaceResolutionDialog` and the dialog's open state.
  - Call `saveCurrentCBTForce` after each change.
- Test: `src/ui/pages/classic-battletech/roster/_antiOrbitalControls.test.tsx`

**Interfaces:**
- Consumes: Task 3 (`findAntiOrbitalGuns`, `fire`, `rollEarlyFireForOtherRound`, `getGunCooldown`,
  `isGunDestroyed`, `resolve`, `getDueShots`) and Task 1 (`RESOLUTION_ROLLS`, `HIT_REMINDER`).
- Produces:
  - `AntiOrbitalGunControls` with props `{ force: BattleMechForce; unitUuid: string; onChange: () => void }`. It
    renders `null` when the option is off or the unit has no anti-orbital gun.
  - `SpaceResolutionDialog` with props `{ force: BattleMechForce; onChange: () => void; onClose: () => void }`.
  - `play.tsx` method `openSpaceResolutionDialog = (): void`.

**What each gun row shows:**
- The weapon name, the shots left, and an "Aimed hex" text input (label "Aimed hex"). Also a "Target (optional)"
  input and a "Fire anti-orbital" button.
- In cooldown, it adds "Fires again in {k} ground turn(s). Firing any round before then risks the 2D6 table."
  - A "2D6 roll" numeric input appears.
  - "Fire anti-orbital" passes that roll.
  - An "Early ground shot" button calls `rollEarlyFireForOtherRound`.
- After a `misfire`, the row shows `MISFIRE_REMINDER`. After `destroyed` it shows "Destroyed: inoperable for the rest
  of the game", and all its controls are disabled.

**The resolution dialog:** for each due shot it shows:
- the gun, hex and target;
- a select of the five `RESOLUTION_ROLLS` labels, then the roll text for the chosen one;
- buttons "Hit" and "Miss".

"Hit" shows `HIT_REMINDER` and then removes the shot. "Miss" removes it. The dialog closes when no due shots remain.

- [ ] **Step 1: Write the failing tests**

Use the vehicle-with-Long-Tom force from Task 3's tests.

- `it("renders nothing while the option is off")`
- `it("fires and shows the cooldown")`: type hex "0712", then click Fire. "Fires again in 6 ground turns" shows, and so does a shot count of 2.
- `it("asks for a 2D6 roll to fire early, and a 3 destroys the gun")`
- `it("resolves a due shot with the +4 reminder and the hit damage")`: pick "one hex" and the "+4" text shows. Click Hit:
  "2 capital (20 standard)" shows, and `force.spaceTracker.shotsInFlight` is empty.

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/ui/pages/classic-battletech/roster/_antiOrbitalControls.test.tsx`
Expected: FAIL. The module does not exist.

- [ ] **Step 3: Implement the controls, the dialog and the play-page wiring**

- [ ] **Step 4: Run the tests, typecheck and lint**

Run: `npx vitest run src/ui/pages/classic-battletech/roster/_antiOrbitalControls.test.tsx; npm run typecheck; npx eslint src/ui/pages/classic-battletech/roster/_antiOrbitalControls.tsx src/ui/pages/classic-battletech/roster/_spaceTrackerBar.tsx src/ui/pages/classic-battletech/roster/play.tsx src/ui/pages/classic-battletech/roster/home.tsx src/classes/space-tracker.ts src/utils/space-turn.ts`
Expected: PASS; no type or lint errors.

- [ ] **Step 5: Commit**

Commit as "Space turn tracker: anti-orbital gun controls and the space-phase resolution dialog".

---

### Task 6: Docs, full suite, push and beta deploy

**Files:**
- Modify: `TODO.md`. In the anti-orbital item, replace "Still owed: map play" with the tracker being done.
- Modify: `src/ui/pages/home.tsx`. Add an Oct 22 News bullet: an optional space turn tracker for games with space forces, with anti-orbital shots.
- Modify: `src/ui/pages/development-status.tsx`. Add a struck-through line, "Space turn tracker for anti-orbital fire".
- Modify: `docs/superpowers/specs/2026-10-22-space-turn-tracker-design.md`. Change its status to "approved 2026-10-22; built".
- Modify: `TRO.md`. Add one line under the anti-orbital Game rules: "In Play Mode, turn on 'Space forces in this game'
  on the roster page to track the space turns and each shot."

- [ ] **Step 1: Make the edits**

- [ ] **Step 2: Run the full suite**

Run, from PowerShell: `Set-Location C:\repo\battletech-tools-master; npx vitest run *> <scratchpad>\suite.txt`.
Then check it with `Select-String "^ FAIL|  ×|Tests "`.
Expected: no FAIL lines. The count is the prior 2453 plus this plan's tests, with 2 skipped.

- [ ] **Step 3: Commit, push to origin beta, run `git deploy-beta`**

Commit as "Space turn tracker: docs and News".
