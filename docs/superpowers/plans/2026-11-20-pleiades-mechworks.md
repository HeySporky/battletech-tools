# Pleiades Mechworks fan equipment (#640, #641) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the Pleiades Mechworks fan items (AC/12 and its ammo, Boosted AC rounds, Personal ECM, Blue Saviour, Pilot Suit cockpit, Hardsuit and VTOL Hardsuit) in the catalog and make them work in roster play.

**Architecture:** Records go in the existing Custom Homebrew catalog files and are priced/dated by the Batch Chunk 6 derived-values pipeline. Play rules are plain functions in `src/utils/future-wars-play.ts` (header widened to "fan equipment play rules"), with state on the existing `BattleMech.futureWarsPlay` (`IFutureWarsPlayState`, battlemech.ts ~289) and UI in roster `play.tsx`. Every hook is a no-op unless the unit mounts the item.

**Tech Stack:** TypeScript, React, vitest (`npm run check` = lint + unit + data tests), repo in `C:/repo/btt-rebuild`, branch `bv-gaps` (= origin/beta).

**Spec:** `docs/superpowers/specs/2026-11-20-pleiades-mechworks-design.md` (read it first; all post numbers are in it).

## Global Constraints

- Work in `C:/repo/btt-rebuild` on `bv-gaps`; `npm run check` green before push; deploy `git deploy-beta`; news bullet in the current news entry.
- Condensed (owner): extend existing files, no new file per item. Tests only in `src/data/custom-homebrew-reddit-batch.test.ts` and `src/classes/battlemech-best-of-future-wars-play.test.ts` (plus `src/data/custom-completeness.test.ts` guards that already run). A new file needs its reason written in the task.
- TDD: failing test first for each behaviour.
- Custom Homebrew: `catalog: "custom"`, `rulesLevel: 6` (`CUSTOM_HOMEBREW_RULES_LEVEL`), credit u/PleiadesMechworks; numbers not in the post are "ours" and say so in `notes`; dates/ratings via `DATING_RULES` (derived-custom-values.ts:188).
- Each record passes `custom-completeness.test.ts` and appears on `docs/lore/homebrew-equipment-tro.md` card "Community Homebrew and Apocryphal Equipment".
- BV is computed by the builder; sheet BV gaps go in notes, never forced.
- Bash heredocs with an apostrophe are blocked by a hook: write script files.
- Reddit is not fetchable; the pasted text (issue bodies #640/#641) and ResourceLibrary `scrapes/reddit/1rbyavi*` are the source.

## Review Focus

- Blue Saviour halving of 1 damage: stays 1 (minimum 1), not 0. Test with 1 and 2.
- Heavy PPC 15 with Blue Saviour + Laser Reflective: 15 -> 7 -> 3.
- A 'Mech without Blue Saviour/Pilot Suit/Boosted ammo plays exactly as before (no extra heat, no halving, same skills).
- Blue Saviour failure: roll equal to target survives (only "less than" fails); active turns 1-6 never roll; once failed or exploded it never reactivates, and the state clears with the game and survives save/load.
- Crit on a Blue Saviour slot while inactive/failed/already exploded: no explosion; head slot crit explodes in the head.

---

### Task 0: Confirm Clan VTOL is legal on a PA(L) suit

**Files:** read only: battle armor creator (`src/data/battle-armor-construction.ts`, `battle-armor-equipment.ts`), TM pp.164-165.

- [ ] **Step 1:** Check whether the creator accepts a Clan-tech VTOL motive on a PA(L) chassis (find the legality check by grepping "VTOL" in the two files). Check the book text in the library if needed.
- [ ] **Step 2:** If allowed: continue. If the creator wrongly forbids what the book allows: fix it with a failing test first in `custom-homebrew-reddit-batch.test.ts`. If the BOOK forbids it: STOP and ask NGCFells (do not continue to Task 7).
- [ ] **Step 3:** Commit any fix: `git commit -m "Battle armor: Clan VTOL on PA(L) (TM pp.164-165)"`.

### Task 1: Autocannon/12 and its seven munitions

**Files:**
- Modify: `src/data/ballistic-custom.ts` (weapon record `custom-ac-12`), `src/data/ammo-custom.ts` (`ammo-custom-ac-12-<standard|armor-piercing|precision|flechette|flak|tracer|caseless>`), `src/data/derived-custom-values.ts` (`DATING_RULES` lines for tech rating/dates where the post gives none), `docs/lore/homebrew-equipment-tro.md`, lore/rules via the record or `src/data/custom-lore-rules.ts` (follow the existing pattern for neighbours).
- Test: `src/data/custom-homebrew-reddit-batch.test.ts`

**Interfaces:**
- Produces: tags `custom-ac-12`, `ammo-custom-ac-12-standard` and six munition tags (names above), used by Task 2's `ammo-custom-ac-12-boosted` sibling pattern.

- [ ] **Step 1: Write failing tests** in a new `describe("Pleiades Mechworks AC/12")`: record `custom-ac-12` has damage 12, heat 4, range 4/8/12 min 0, weight 13, 7 slots, cbills 300000, battleValue 142, prototype/introduced 3020, 8 shots a ton, techBase "is", in no canon catalog (copy the `getEquipmentCatalogDefinitions` pattern at the top of the file); `ammo-custom-ac-12-standard` BV 18, cbills 10000; seven AC/12 munitions exist and each one's shots/BV/cbills equal the AC/12 standard's scaled by the same ratio the AC/10 munition has to AC/10 standard (assert via the ratio, not literals).
- [ ] **Step 2:** Run `npx vitest run src/data/custom-homebrew-reddit-batch.test.ts -t "AC/12"`; expect FAIL (record not found).
- [ ] **Step 3:** Add the weapon record next to the other `ballisticCustom` entries: copy the shape of an existing ballistic-custom record built from a canon neighbour (AC/10 `ac-10` in `equipment-ballistic.ts`), override with the post's numbers, `book: "Custom"`, notes crediting u/PleiadesMechworks (Flying Foxes lore text, Federated Suns origin, "headcaps", ours-marks). Add `custom-ac-12` and the ammo rows to `DATING_RULES` only where dates/rating are not given (rating like `ac-10`). Add the munition records by a helper in `ammo-custom.ts` modelled on `clanBreechAmmo` (line 31) that derives each from the AC/12 standard using the AC/10 munition ratios from `ammo.ts` (~2537-2729).
- [ ] **Step 4:** Add the weapon and ammo to the homebrew TRO card; run the new tests plus `npx vitest run src/data/custom-completeness.test.ts`; expect PASS. Alpha Strike comes from `derived-alpha-strike.ts` automatically; confirm the record has non-empty `alphaStrike` (completeness test covers it).
- [ ] **Step 5:** Commit `Custom Homebrew: Autocannon/12 and its munitions (#641)`.

### Task 2: Boosted Autocannon Rounds with extra heat in play

**Files:**
- Modify: `src/data/data-interfaces.ts` (`IAmmoProfile`: add `extraHeat?: number`), `src/data/ammo-custom.ts` (five records `ammo-custom-<ac-2|ac-5|ac-10|ac-12|ac-20>-boosted` with `ammoProfile.range`, `extraHeat`, shotsPerTon/BV from the spec table), `DATING_RULES` (date before Precision ammo via `{ like: "ammo-ac-10-precision" }` prototype line, why written), `src/classes/battlemech.ts` (weapon heat when fired from a bin: where `getFutureWarsItemHeat` is used, ~1508, and the play heat path), `src/utils.ts` only if `getTargetToHitFromWeapon` (~896) needs nothing new (it already reads `ammo.ammoProfile.range`).
- Test: `custom-homebrew-reddit-batch.test.ts` (records), `battlemech-best-of-future-wars-play.test.ts` (heat).

**Interfaces:**
- Produces: `IAmmoProfile.extraHeat?: number`; a `BattleMech` method that returns a weapon's heat for the bin selected (find the existing method that selects ammo per weapon, `getAmmoBinWeapon` is the reverse lookup) adding `extraHeat`.

- [ ] **Step 1: Failing tests:** (a) table values for all five records (min/short/medium/long, extraHeat 2,2,3,4,5, shots 22,10,5,4,2, BV 6,12,21,22,29); (b) in `battlemech-best-of-future-wars-play.test.ts`: an AC/10 with a Boosted bin selected reports heat 3 higher than with the standard bin (10 -> 13); `getTargetToHitFromWeapon` range band at 20 hexes uses the boosted range (AC/5 boosted: 20 is medium, +2); a 'Mech with standard ammo is unchanged.
- [ ] **Step 2:** Run those tests; expect FAIL.
- [ ] **Step 3:** Add `extraHeat` to `IAmmoProfile`; add the five records (tech base IS, cost ours = standard ammo cost x the multiplier of the nearest canon special munition, written in notes); wire `extraHeat` into the firing-heat path for the selected bin.
- [ ] **Step 4:** Run tests + completeness test; expect PASS.
- [ ] **Step 5:** Commit `Custom Homebrew: Boosted Autocannon Rounds (#641)`.

### Task 3: Personal ECM Suite and Stealth Armor's requirement

**Files:**
- Modify: `src/data/misc-custom.ts` (`custom-personal-ecm`: 0.5 t, 1 slot, 200000 cbills, defensive BV 20, IS), `DATING_RULES` (date from the lore: Nighthawk BA ECM 2720; rating `{ like: "guardian-ecm" }` or the Guardian's actual tag, find it in `equipment-misc.ts`), Stealth Armor's ECM requirement check in `battlemech.ts` (grep "stealth" with "ecm"), TRO card.
- Test: `custom-homebrew-reddit-batch.test.ts`

- [ ] **Step 1: Failing tests:** record numbers as above; a 'Mech with Stealth Armor and only a Personal ECM reports the Stealth ECM requirement unmet; with a Guardian ECM it is met.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Add the record (notes: no ECCM mode, own hex only, play effect arrives with E-War phase 2); make the Stealth requirement check exclude `custom-personal-ecm`.
- [ ] **Step 4:** Run tests + completeness; expect PASS. **Step 5:** Commit `Custom Homebrew: "Personal" ECM Suite (#641)`.

### Task 4: Blue Saviour record and construction

**Files:**
- Modify: `src/data/misc-custom.ts` (`custom-blue-saviour`: 5 t, `spreadLocations: "all"`, `explosive: true`, prototype 3151, no production date, IS, Taurian-only in notes/lore, cost 1,000,000 / rating E / BV rule from Blue Shield, `equipment-misc.ts:481`), the BV hook at `battlemech.ts` ~1029 (extend the Blue Shield branch with the same +0.2 only if the notes' derivation says Blue Saviour follows Blue Shield's BV rule; write the derivation in notes either way), 'Mechs-only limit (follow how `blue-shield` is limited), `DATING_RULES`, TRO card.
- Test: `custom-homebrew-reddit-batch.test.ts`

- [ ] **Step 1: Failing tests:** record fields above; one slot in every location including head when built into a 'Mech (see `battlemech-ssw-battle-value.test.ts:218` for how Blue Shield slots are asserted); not mountable on a vehicle/BA.
- [ ] **Step 2:** Run; FAIL. **Step 3:** implement. **Step 4:** run + completeness; PASS. **Step 5:** Commit `Custom Homebrew: Blue Saviour Dispersion Field record (#641)`.

### Task 5: Blue Saviour and Reflective armor play rules

**Files:**
- Modify: `src/utils/future-wars-play.ts` (widen header; add the functions below), `src/classes/battlemech.ts` (`IFutureWarsPlayState` fields `blueSaviour?: { active: boolean; activeTurns: number; failed: boolean; exploded: boolean }`; heat +7 in the heat phase; crit hook; clears with the game like other fields), `src/ui/pages/classic-battletech/roster/play.tsx` (on/off control in End Phase, outgoing halved damage on attack rows, one "attacking weapon: energy / other" control in the take-damage dialog ~1190-1225, `takeDamage(amount, location, rear)` caller, damage log entered vs applied, reminder lines).
- Test: `battlemech-best-of-future-wars-play.test.ts`

**Interfaces (all in `future-wars-play.ts`):**
- `halveEnergyDamage(damage: number): number` = `Math.max(1, Math.floor(damage / 2))` (0 stays 0).
- `getBlueSaviourFailureTarget(activeTurns: number): number | undefined` = undefined while `activeTurns <= 6`; else `2 + (activeTurns - 6)`.
- `blueSaviourFails(activeTurns: number, roll2d6: number): boolean` = roll **less than** target.
- `getIncomingEnergyDamage(damage: number, o: { blueSaviourActive: boolean; reflective: boolean }): number` applies halve once per true flag.
- `getBlueSaviourReminders(o: { hasStealth: boolean }): string[]` with lines: "missiles: treat as AMS", "inside a hostile ECM field, no ECCM", "cannot be hidden", and "stealth off" when `hasStealth`.
- Consumes: `isEnergyWeapon(item)` (write in the same module: catalog energy lasers, PPCs, flamers, plasma, infantry particle weapons; non-capital).

- [ ] **Step 1: Failing tests** (pure functions): `halveEnergyDamage(1)=1`, `(2)=1`, `(15)=7`; `getIncomingEnergyDamage(15,{blueSaviourActive:true,reflective:true})=3`; target `undefined` at 6, `3` at 7, `8` at 12; `blueSaviourFails(7,2)` true, `(7,3)` false. Then `BattleMech` tests: heat +7 only when active; state saves/loads (use the file's existing save/load round-trip pattern) and clears on game clear; a crit on a Blue Saviour slot active and unexploded produces a 5-point explosion in that location (CASE-contained per the existing ammo-explosion path, head included) and sets `exploded`; second crit, inactive crit, and failed crit produce none; a 'Mech without the item is unchanged.
- [ ] **Step 2:** Run; FAIL.
- [ ] **Step 3:** Implement the module functions, state, heat, crit hook (route through the existing ammunition-explosion path ~7507-7536), then the play.tsx controls: toggle (End Phase), start-of-turn 2D6 check after turn 6 (use the app's dice helper), outgoing halved damage per hit on attack rows, one weapon-type control in the damage dialog, entered/applied in the damage log, reminder lines. Plasma: halve damage only.
- [ ] **Step 4:** Run `npx vitest run src/classes/battlemech-best-of-future-wars-play.test.ts`; PASS. Run the app (`run` skill) and check the controls once by hand.
- [ ] **Step 5:** Commit `Roster play: Blue Saviour and energy halving (#641)`.

### Task 6: Pilot Suit cockpit

**Files:**
- Modify: `src/data/mech-cockpit-types.ts` (`pilot-suit` next to `interface`, line 188: weight 5, techBase "is", rulesLevel 6 / Custom, prototype 3151, no gyro allowed, slots and placement limits as the Interface Cockpit; cost/BV ours), `src/classes/battlemech.ts` (everywhere `_interfaceCockpit` appears: 2689, 2778, 3827, 4139, 4426, 5207, 10031, 10494, 12765, 15129, 15332: add a pilot-suit equivalent by the same mechanism, preferably by deriving from the cockpit tag rather than a new field per site; `_getBattleValueSkills` ~2434 gets -1 piloting and -1 gunnery; the full-head ejection included without extra weight/cost; play skills 1 better), play.tsx (ejection control available; no-gyro line "falls if the MechWarrior is knocked out (no gyro)"), TRO card/lore with cross-links to Hardsuit and Blue Saviour, `DATING_RULES`.
- Test: `battlemech-best-of-future-wars-play.test.ts` and records in `custom-homebrew-reddit-batch.test.ts`.

- [ ] **Step 1: Failing tests:** cockpit record fields; a 'Mech with the cockpit and no gyro builds with no errors, a 'Mech with the Interface Cockpit rules still passes; pilot gunnery 4/piloting 5 plays as 3/4; BV uses the adjusted skills (BV differs from a standard cockpit by the skill-table ratio) or, if the BV code cannot take it, the multiplier route in the notes; placement limits equal the Interface Cockpit's (same rejections).
- [ ] **Step 2:** Run; FAIL. **Step 3:** implement. **Step 4:** run + completeness + `npm run check` unit subset for battlemech tests; PASS. **Step 5:** Commit `Custom Homebrew: Pilot Suit cockpit (#640)`.

### Task 7: Hardsuit PA(L) and VTOL Hardsuit designs

**Files:**
- Modify: wherever other ready-made custom battle armor designs live (find one with `grep -rn "Custom" src/data/custom-mul.ts` and the battle armor `.ts` data; follow it; no new file unless nothing fits, reason in the commit).
- Test: `custom-homebrew-reddit-batch.test.ts`

- [ ] **Step 1: Failing tests:** both designs load in the BA creator and in the unit search/roster add path; Hardsuit PA(L): IS, squad 5, ground 3 / jump 3, 2 Armored Gloves, Fuel Tank, Mission Equipment Storage 45 kg, Standard armor 2, all of Mechanized/Swarm/Leg/AP yes, introduced 2768; VTOL: Clan tech, 3083, VTOL 7, ground 3, 2 Armored Gloves, Mission Equipment 10 kg, armor 2, no fuel tank; both carry the computed BV and cost, with sheet BV 63 and 84 and the gap noted in notes.
- [ ] **Step 2:** Run; FAIL. **Step 3:** build them (lore from the posts, credit u/PleiadesMechworks). **Step 4:** PASS, then open each in the app and check the sheet prints. **Step 5:** Commit `Custom Homebrew: Hardsuit and VTOL Hardsuit battle armor (#640)`.

### Task 8: Sources, review, ship

- [ ] **Step 1:** Confirm ResourceLibrary `scrapes/reddit/` has the posts and sheets with the CREDITS line (done in ace4015f2); add commenters only if their idea is used.
- [ ] **Step 2:** Run the astech agent (model: opus) to review the whole branch for rules correctness; fix findings with tests.
- [ ] **Step 3:** `npm run check` (all green; 3 old lint warnings are baseline). Add a news bullet to the current news entry.
- [ ] **Step 4:** Push bv-gaps, `git deploy-beta`, confirm "Published".
- [ ] **Step 5:** Close #640 and #641 with evidence (commits, deploy, what ships, and the two reminder lines that E-War phases 1-2 replace). Update `JBTToolsSupportFiles/handoff.md` (next: E-War brainstorm).
