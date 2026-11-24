# #183 'Mech ammunition explosion: plan (2026-11-02)

## Goal
In 'Mech play mode, a rolled critical hit on an explosive ammunition slot explodes that bin. The damage goes to internal structure, with transfer and CASE, and the play log says what happened. Today the slot is only marked as hit.

## Rules: check these against TW and MegaMek before coding
- 'Mechs differ from vehicles. Only the bin that is hit explodes, not all the ammunition aboard (TW "Ammunition", critical hit effects).
- Damage = shots left in that bin × the Damage Value of one shot. Missiles count every missile, as in vehicles (TW p.125).
- The damage goes straight to the internal structure of the bin's location, never armor. Excess transfers inward by the Damage Transfer Diagram.
- The MechWarrior takes 2 damage. The Mech class has no pilot-damage tracker, so this only goes in the log.
- CASE (or Clan CASE through `hasClanCASE()`): the damage stops at the bin's location and the excess is lost. Check TW p.143 for what happens to that location's rear armor.
- CASE II (TO:AUE): verify before coding. If the rule is unclear, apply plain CASE behavior and add a TODO line to the log.
- A bin that is empty, or not explosive, does not explode. Use the existing `BattleMech._isExplosiveAmmoSlot`.
- Out of scope: Gauss and other explosive components, and heat-induced explosions. They can become a follow-up issue.

## Edition aware from the start (user requirement, 2026-11-02)
The user does not want to come back later for an edition pass. Every edition gets its explosion rules now.
- Today only BattleDroids sets `playRules` (`src/data/rules-editions.ts`, `IEditionPlayRules`). Every other edition returns undefined and plays by Total Warfare.
- Do not hard-code the TW rule. Add a data record for the explosion rules:
  - Add `ammoExplosion: IAmmoExplosionRules` to `IRulesEdition`. Don't add it to `playRules`: `getEditionPlayRules()` being undefined is what switches the other play paths to TW, so a playRules entry for every edition would change them.
  - Set the record on every 'Mech edition: battledroids, battletech-2nd-edition, battletech-manual, battletech-compendium, battletech-3rd-edition, compendium-rules-of-warfare, battletech-4th-edition, master-rules, master-rules-revised, classic-battletech-box-set, total-warfare, battlemech-manual, core-rulebook.
  - Add a getter `getEditionAmmoExplosionRules(tag)` that falls back to the total-warfare record.
- Fields. Add or drop fields based on what the books actually differ on:
  - `explodes: boolean`. Does an ammo critical explode at all in this edition?
  - `scope: "bin" | "all"`. The bin that was hit, or all ammunition aboard.
  - `damage: "shots-left" | "full-bin"`. Most editions track shots, but check.
  - `transfers: boolean`. Does damage transfer inward past the location?
  - `pilotDamage: number`. 0 when the edition has no pilot damage for it.
  - `book` and `page`: the citation for this record, as other records carry.
  - `verified: boolean`. Set false where the book text was not available. Log a "(rules not verified for <edition>)" note when one of these records is used.
- CASE and CASE II need no edition check of their own. `isInRulesEdition` already keeps them off designs in editions that lack them, so "has CASE" is enough. If an edition's CASE behaved differently, add a `caseBehavior` field.
- Rule text: read each edition's rulebook section on ammunition criticals. Cite pages as the existing records do, e.g. "(BD p.15)". If a book's text isn't available in the session, ask the user for the page instead of guessing. Never write a guessed rule as verified.
- Both roll paths must call the same explosion code: `rollCriticalHit` (TW editions) and `rollEditionCriticalHit` (BattleDroids).
- Tests: one test for each distinct record, at least TW and BattleDroids, plus one for an edition where `pilotDamage` or `scope` differs, if any does.

## Expanded scope: every unit type (user, 2026-11-02)
"While we are there," the user asked for ammunition explosions to be edition aware for every unit type, wherever a rulebook lists such a ruling. That makes #183 the first item of a wider round. Rewrite the edition section above to fit this:
- Key the record by unit type: `ammoExplosion?: Partial<Record<RulesEditionUnitType, IAmmoExplosionRules>>` on `IRulesEdition`.
  - The unit-type books (CityTech, CityTech 2nd, AeroTech, AeroTech 2 and AT2R, BattleTroops, ClanTroops) are editions in their own right, with `unitTypes`. They carry records only for their own types.
  - A unit looks up its own edition tag plus its unit type. When there is no record, it falls back to the total-warfare record for that unit type.
  - When no book has a ruling for a unit type, there is no record and no explosion. Don't make one up.
- Cover heat-triggered explosions too. They are ammo explosions with their own avoid-roll levels:
  - 'Mech heat scale, TW 19/23/28.
  - Fighter and small-craft heat, the `{ name: "Ammunition explosion", levels: [19, 23, 28] }` rows in aerospace-fighter.ts:175 and small-craft.ts:140.
  - BattleDroids `ammoExplosionAvoid` in battledroids-rules.ts.
  - Add `heatAvoid?: { heat: number; target: number }[]` to the record wherever the edition's heat table varies. Leave out any heat rows that are already per edition.
- Status of each unit type now. Audit each one and fill gaps only where a ruling exists:
  | Type | Today | Work |
  |---|---|---|
  | 'Mech | crit marks the slot only | #183, new code (sections below) |
  | Vehicle | `getAmmunitionExplosionDamage`/`applyAmmunitionExplosion`, all ammo (TW p.194), vehicle.ts:4081/4135/4450 | read scope, CASE and stun from the record instead of hard-coding |
  | Building | `getAmmunitionExplosionDamage(hex)` (TO:AR p.119), building.ts:1845/1914 | read from the record |
  | Fighter / Small Craft | heat-scale row only; check the aero crit table for an ammunition crit | add the crit explosion if the books list one; heat levels from the record |
  | Capital ship (DropShip, JumpShip, WarShip, station) | none found | check the TW/SO aero crit rules for ammo; add only if listed |
  | ProtoMech | none found | DONE (step 5): no ruling. Crits never hit ammunition (TW pp.185-186, BMR pp.54-55) and ProtoMechs track no heat (TM p.86), so no record and no explosion |
  | Battle Armor / Infantry | no crits | most likely no ruling; confirm and record "none" in the plan |
- Order of work, one commit each, all under #183 (or open a new issue for the non-Mech parts and reference it):
  1. Data model, getter, and the TW records for every unit type, with tests.
  2. 'Mech, with the sections below.
  3. Refactor Vehicle and Building onto the record. Existing tests must still pass unchanged.
  4. Fighter, Small Craft and capital ships.
  5. ProtoMech.
  6. Records for the earlier editions (BD … CBT box set, CT, AT, AT2), with citations, or `verified: false` and a question to the user.
- Stop after each step if the rounds get big. The user wants small rounds.

## Condense into one file (user rule, 2026-11-02; overrides the placement wording elsewhere in this plan)
Everything about ammunition explosions that isn't specific to one class goes in ONE new file, `src/data/ammo-explosion.ts`:
- The `IAmmoExplosionRules` interface.
- ONE table keyed by edition tag, then by unit type: `AMMO_EXPLOSION_RULES: Record<string, Partial<Record<RulesEditionUnitType, IAmmoExplosionRules>>>`. Keep it here, not as a field on each `IRulesEdition`, so the rules for every edition can be read in one place. This replaces the "add `ammoExplosion` to `IRulesEdition`" wording above.
- ONE entry function that does the whole job for any unit: `getAmmoExplosion(editionTag, unitType, bins, binWeapon, shotsLeft) => { rules, damage, log }`.
  - It looks up the rules, with the TW fallback.
  - It totals the damage (the code lifted from Vehicle `_damagePerShot` and the bin loop).
  - It builds the shared log lines: pilot damage, and the "not verified" note.
- Heat avoid levels come from the same record, through the same file.
- Each class keeps only what it must do itself: apply the damage to its own locations. That's a few lines each, through its existing `takeDamage` or `_explode`, extended with options.
- Tests: one file, `src/data/ammo-explosion.test.ts`, covering the table, the fallback and the damage for all unit types. The only per-class tests are assertions added to the class test files that already exist.

## Reuse and extend, smallest code (user rule, 2026-11-02)
Don't write a new function for something that already exists. Extend the existing one with a parameter or a data field. Keep the diff as small as possible. This overrides the "add X" wording in the sections below:
- **One damage helper for every unit type.** Move Vehicle `_damagePerShot` and the bin loop in `getAmmunitionExplosionDamage` into one shared, exported function in `src/data/ammo.ts` or the equipment helpers. It takes `(bins, binWeapon, shotsLeft)` and returns the damage. Vehicle, 'Mech, Building and aero all call it, and Vehicle's tests must stay green. Don't add a separate `getAmmoBinExplosionDamage` on BattleMech; call the shared helper with a single bin.
- **'Mech damage goes through `takeDamage`, not a new loop.** Add an options argument: `takeDamage(amount, location, rear, { structureOnly?: boolean, noTransfer?: boolean })`. `applyAmmunitionExplosion` then shrinks to a few lines: empty the bin, call `takeDamage`, return the log.
- **One crit hook.** `rollCriticalHit` and `rollEditionCriticalHit` both end in `toggleCritical` on the slot they pick. Put the explosion check in one private `_onSlotHit(location, index)` that both call, or inside the code path they share. Don't duplicate it.
- **Heat rows.** Extend the existing `{ name: "Ammunition explosion", levels: [...] }` rows and `battledroids-rules` `ammoExplosionAvoid` so they read the edition record. Don't add a parallel heat table.
- **One shape for the record.** `IAmmoExplosionRules` is a single interface and `getEditionAmmoExplosionRules(tag, unitType)` is a single getter. Only add a field when a book actually differs on it.
- **Before writing any function, grep** for an existing one that does the same job, e.g. `_explode` in vehicle.ts and building.ts. If there's a near match, extend it, and share it across classes if it can be.
- In the step-3 refactor, Vehicle and Building should lose lines, not gain them.

## Code (battletech-tools-master)
1. `src/classes/battlemech.ts`
   - Add `getAmmoBinExplosionDamage(bin)`. It returns `getAmmoBinRemaining(bin)` × damage per shot of `getAmmoBinWeapon(bin)`, or 0 when the bin isn't explosive, is empty, or has no weapon. Damage per shot is clusters × per-cluster, else `damage`, else `damage.short`, the same as Vehicle `_damagePerShot` (vehicle.ts:4002). Lift that function into a shared helper instead of copying it.
   - Add `applyAmmunitionExplosion(location, bin): string[]`:
     - Set `bin.currentAmmo = 0`.
     - Apply damage through `_takeStructureDamageAtLocation`, and transfer with `_moveDamageLocationIn` unless the location has CASE (`hasCASE(loc)` / `hasClanCASE()`). Reuse the transfer loop from `takeDamage` (~line 9448).
     - Call `_calc()`.
     - Return the log lines: damage, where it went, and "MechWarrior takes 2 damage".
   - In `rollCriticalHit` (~line 6104), after `toggleCritical` on the slot, find the bin with `slots[named].uuid` → `_equipmentList`. If it is explosive ammo, append the log lines from `applyAmmunitionExplosion`.
   - Check whether `rollEditionCriticalHit` (line 6041) also picks slots. If it does, add the same hook there.
   - Leave the manual `toggleCritical` click alone, because a click may be a correction. It does not explode anything.
2. UI: `_criticalHitTable.tsx` already shows the `rollCriticalHit` log, so the UI should need no change. Confirm in the browser.

## Tests (TDD), new file `src/classes/battlemech-ammo-explosion.test.ts`
Use the fixtures in `battlemech-industrial-play.test.ts` as the pattern. They roll with `{ chance, lines }`.
- A full AC/20 bin (5 shots) explodes for 100. It destroys the location and transfers inward.
- A partly spent bin uses only the shots left.
- An empty bin and a non-explosive bin don't explode.
- With CASE in the side torso, nothing transfers to the CT.
- A Clan Mech counts as having CASE everywhere.
- The log includes the MechWarrior line.

## Done when
- The new tests pass, and the related tests pass: `battlemech*`, `vehicle-combat`, `vehicle-play`.
- `tsc` is clean.
- A rolled crit on an ammo slot in the beta build shows the explosion.
- Commit with "(#183)", deploy to beta, comment on #183 and close it.
