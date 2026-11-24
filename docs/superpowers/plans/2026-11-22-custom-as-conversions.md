# Alpha Strike for Every Custom and Munchkin Record (#647) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every Custom Homebrew/Munchkin record, and every canon record still "not yet looked up", gets an Alpha Strike conversion or one fixed reason. A guard test keeps it that way.

**Architecture:**
- **Records:** each record's `alphaStrike` block gains specials, damage, a munition key, or a `noConversion` reason.
- **Specials:** our new specials go in `CONST_AS_SPECIAL_ABILITIES` as `ESpecialAbilityType.Custom`.
- **Play:** their play extends the existing Alpha Strike play module `src/utils/alpha-strike-ewar-play.ts` and its panel `_asEWar.tsx`, as SLA and CHF did.
- **Munitions:** the ASCE Alternate Munitions table becomes one data file, chosen through the existing special-ammo selection.

**Tech Stack:** TypeScript, React 18, Vitest (run from PowerShell).

**Spec:** `docs/superpowers/specs/2026-11-22-custom-as-conversions-design.md` (every value below comes from it). Issue #647.

**Execution (NGCFells, 2026-11-22):** approved. Build NATIVELY on Sonnet 5.5 (superpowers:executing-plans), task by task, in this session's own context with no subagent per task. Then run one whole-branch review by the astech agent on Opus (Task 7 Step 8). Keep a ledger at `.superpowers/sdd/2026-11-22-custom-as-conversions/progress.md`.

## Global Constraints

- **Rules level (NGCFells, 2026-11-22):**
  - **Custom Homebrew and Munchkin items:** our codes and our munitions only at levels 6-7. Gate them with `allowsAlphaStrikeAbilityCode`; munition rows carry `custom: true`.
  - **Canon and Apocryphal items no book converts** (CRB plasma rifles, the canon Chaff Pod, the Hailstorm): the conversion stays at the item's own level. The block gets `inferred: true` and a note `Inferred (NGCFells, 2026-11-22, #647): no book converts it; extrapolated from <basis>`. Inferred codes are not gated and do not raise the card's level.
  - **Book lookups** (Task 2) show at every level with their source.
- **Notes:** each of our conversions has a note starting `Ours (NGCFells, 2026-11-22, #647):` that names the nearest canon special and the item's author.
- **Banned notes:** "Custom equipment: no Alpha Strike conversion", "... no Alpha Strike effect", "Unverified custom equipment" (in an `alphaStrike.notes`) and "Unresolved: ... not yet looked up". None may remain.
- **Sources:** check the ResourceLibrary extract first (`C:/repo/ResourceLibrary/text/Alpha-Strike-Companion.txt`, `AlphaStrikeCompanion-CGL-2022-V16Dated20221206.txt`, `Alpha-Strike-Commander-s-Edition.raw.txt`). Cite the page found there. Pull a page image only if the extract is garbled, and write any image read back into the extract.
- **Bash hook:** no apostrophes in Bash commands; write scripts with Write. Run vitest from PowerShell.
- **Usual checklist (memory plans-carry-full-checklist):**

| Item | Task |
|---|---|
| Records (AS blocks, notes) | 2, 3, 4, 6 |
| Construction and record sheets | unchanged: no item's Classic stats change |
| Classic play | unchanged |
| Alpha Strike conversion | 2, 3, 4, 6 |
| Alpha Strike play | 2 (MTAS), 5, 6 |
| TRO entries and the TRO guard test | 7 |
| Credits (in the news), news, check, review, deploy, issue comment | 7 |

## Review Focus

1. **A canon unit carrying a canon item we now convert** at level 0-4:
   - Book values (BattleMech Taser, Coolant Pod, Recon Camera, MRM Apollo) give the book result.
   - Inferred ones (Chaff Pod CHF1, plasma rifles) show at the item's level without raising the card to 6.
   - Task 2 tests a level 2 'Mech with a Taser (`MTAS1`, level unchanged) and a level 4 'Mech with a Chaff Pod (`CHF1`, card level 4).
2. **A level 4 unit carrying a level 6 item.** The unit's required level becomes 6 (`getRequiredRulesLevel`), so its card shows our code. Task 4 tests an Improved Taser on a Standard-level design: the card shows `ITAS1` and the card is level 6.
3. **Two items of a summed code** (two Tasers, two Bucklers). These must give `MTAS2` and `SMKB20`, not `MTAS1` twice. Tested in Tasks 2 and 4.
4. **Blue Saviour on a 'Mech with no energy weapons.** BSF must equal its standard damage, and a 'Mech with only energy weapons must get exactly half (AS rounding). Tested in Task 4.
5. **A special munition selected on a unit without the required special** (a Thunderbolt Semi-Guided on a 'Mech with no LRM special). The card shows the munition with "needs LRM", and play adds no modifier. Tested in Task 6.

---

### Task 1: The reason field, the munition key and the guard test

**Files:**
- Modify: `src/data/data-interfaces.ts` (the `alphaStrike` block, ~477)
- Create: `src/data/alpha-strike-conversion-guard.test.ts`

**Interfaces:**
- Produces:
  - `export type AlphaStrikeNoConversionReason = "standard-ammunition" | "feeds-special" | "carried-by-linked-weapons" | "carried-by-weapon" | "explosive-component-only" | "no-alpha-strike-rule" | "no-alpha-strike-munition";`
  - `alphaStrike.noConversion?: AlphaStrikeNoConversionReason`
  - `alphaStrike.munition?: string` (an `ASMunitionKey` from Task 6; a string here so Task 1 does not depend on Task 6)
  - `alphaStrike.inferred?: boolean` (our extrapolated conversion of a canon or Apocryphal item; it stays at the item's level)

- [ ] **Step 1: Write the guard test**

Collect every record from `getEquipmentCatalogDefinitions()`, deduplicated by tag. A record is *in scope* if `rulesLevel >= 6`, or if any `alphaStrike.notes` entry matches `/not yet looked up/`. It *passes* if any of these holds:
- `getAlphaStrikeEquipmentAbilityCodes(item).length > 0`
- the sum of its range damage is `> 0`
- `alphaStrike.munition` is set
- `alphaStrike.noConversion` is set

```ts
const PENDING_647 = new Set<string>([/* every tag the sweep finds today; Tasks 2-6 remove theirs */]);
it("every custom, Munchkin and unresolved record converts or states a reason", () => {
    const offenders = inScope.filter((item) => !passes(item)).map((item) => item.tag).filter((tag) => !PENDING_647.has(tag));
    expect(offenders).toEqual([]);
});
it("no record keeps a banned Alpha Strike note", () => {
    const banned = /no Alpha Strike (conversion|effect)|^Unverified custom equipment$|not yet looked up/i;
    expect(all.filter((item) => !PENDING_647.has(item.tag) && item.alphaStrike?.notes?.some((note) => banned.test(note))).map((item) => item.tag)).toEqual([]);
});
it("the pending list only shrinks", () => { expect(PENDING_647.size).toBeLessThanOrEqual(/* today's count */ 165); });
```

Fill `PENDING_647` by running the test once with an empty set and pasting the offender list. The 2026-11-22 sweep found 165 tags: 54 items and 86 ammo at level 6, 1 item and 3 ammo at level 7, 9 at level 5 and 13 canon.

- [ ] **Step 2: Run it and expect PASS (everything is pending)**

Run: `npx vitest run src/data/alpha-strike-conversion-guard.test.ts`. Expected: 3 pass.

- [ ] **Step 3: Add the two fields to the `alphaStrike` interface, each with a JSDoc line citing the spec**

- [ ] **Step 4: Commit:** `test(#647): Alpha Strike conversion guard with pending list`

---

### Task 2: Canon lookups, MTAS play, Coolant Pod heat

**Files:**
- Modify: `src/data/ballistic-custom.ts` or wherever `mech-taser` is defined (grep the tag); `src/data/equipment-missile.ts` (`mrm-*-apollo`); `src/data/equipment-misc.ts` (`m-pod`, `coolant-pod`, `recon-camera`, `b-pod`; the `vehicular-grenade-launcher` record by grep); `src/data/equipment-energy.ts` (`light-plasma-rifle`, `heavy-plasma-rifle`)
- Modify: `src/data/equipment-registry.ts` (`AS_SUMMED_EQUIPMENT_CODES`)
- Modify: `src/classes/battlemech.ts` (~3645: the Alpha Strike heat dissipation sum)
- Modify: `src/utils/alpha-strike-ewar-play.ts` (taser effect next to `getASTsempEffect` ~627, and the "MTAS" code in its play list ~32)
- Test: `src/data/alpha-strike-conversion-guard.test.ts`, `src/utils/alpha-strike-ewar-play.test.ts`, `src/classes/battlemech.test.ts`

**Interfaces:**
- Produces:
  - `AS_SUMMED_EQUIPMENT_CODES = ["CHF", "TSEMP", "MTAS", "ITAS", "SMKB"]`
  - `export function getASTaserEffect(kind: "MTAS" | "ITAS", targetType: string, targetSpecials: string[], roll: number): "none" | "shutdown" | "interference" | "infantry-damage"`
  - `export function applyASTaserHit(unit: IASEWarUnit, effect: ReturnType<typeof getASTaserEffect>, kind: "MTAS" | "ITAS"): void`

- [ ] **Step 1: Write the failing tests**
  - **Records:**
    - `mech-taser` has `specialAbility ["MTAS1"]`, heat 6, `rangeShort` 0.1.
    - `mrm-10-apollo` has 0.6/0.6, and `-20` 1.2, `-30` 1.8, `-40` 2.4.
    - `recon-camera` has `["RCN"]`.
    - `m-pod` and `b-pod` have `noConversion` `"explosive-component-only"`; `vehicular-grenade-launcher` has `"no-alpha-strike-rule"`.
    - `light-plasma-rifle` is heat 4, 0.4/0.4/0.4, notes include "Heat"; `heavy-plasma-rifle` is heat 12, 1.2/1.2/0.
  - **Summing:** `mergeAlphaStrikeCountedCodes(["MTAS1", "MTAS1"])` gives `["MTAS2"]`.
  - **Heat:** a 'Mech with 10 single heat sinks and 2 Coolant Pods converts with dissipation 12 (`_calcLogAS` shows "12 dissipation").
  - **Taser effect:** `getASTaserEffect("MTAS", "BM", [], 9)` is `"interference"` (9−2=7). `("MTAS", "BA", [], 6)` is `"shutdown"` (6+2). `("MTAS", "CI", [], 12)` is `"none"`, and so is `("MTAS", "BM", ["ABA"], 12)`. `("ITAS", "BM", [], 8)` is `"shutdown"` (no −2). `("ITAS", "CI", [], 2)` is `"infantry-damage"`.
  - **Taser hit:** `applyASTaserHit` with `"interference"` sets the same interference state the TSEMP sets, ending in the End Phase of the next turn. `"ITAS"` on a heat-tracking type also adds 1 heat.
  - **Canon level:** a level 2 'Mech with a BattleMech Taser has `MTAS1` on its card, and its card `rulesLevel` is unchanged.
  - **Inferred records:**
    - Both plasma rifles and the canon `chaff-pod` have `inferred: true` and a note starting `Inferred (NGCFells, 2026-11-22, #647)`.
    - A level 4 'Mech with a Chaff Pod shows `CHF1`, and its card `rulesLevel` is 4 (today the code is dropped below 6).
    - A level 6 'Mech with a Chaff Pod 2.0 still shows `CHF4`; a level 4 card with no inferred item never shows a custom code.
- [ ] **Step 2: Run them and expect FAIL**
- [ ] **Step 3: Implement.**
  - Each canon block carries a note with its source, e.g. `"ASC errata v1.6, Weapon Conversion Table: 'Mech Taser"`; take each page from the extract.
  - For the inferred gate, add `export function getAllowedAlphaStrikeCodes(item: IEquipmentItem, rulesLevel: number): string[]` to `src/data/equipment-registry.ts`. It returns every code when `item.alphaStrike.inferred` is set, and otherwise filters through `allowsAlphaStrikeAbilityCode`. Use it in `getAlphaStrikeEquipmentSpecials` and in the `battlemech.ts` loop (~3478).
  - The card-level bump (~3842) counts only codes that came from a non-inferred item. Add the Coolant Pod count (`matchesTag(item, "coolant-pod")`) to the dissipation at ~3645 and say so in the calc log. Remove these 13 tags from `PENDING_647`.
- [ ] **Step 4: Run the tests above plus `src/data src/utils/alpha-strike-ewar-play.test.ts` and expect PASS**
- [ ] **Step 5: Commit:** `feat(#647): canon Alpha Strike lookups (Taser, Apollo, Coolant Pod, Recon Camera, plasma rifles, pods); MTAS play`

---

### Task 3: Weapons that lost their damage

**Files:**
- Modify: `src/data/best-of-future-wars-conversions.ts`:
  - `swingFire` (~135): pass `alphaStrike` copied from `rack.alphaStrike`.
  - `boostedWeapon` (~170): add the plain-weapon note.
  - `boosterItem`: leave its block to Task 4.
- Modify: the `custom-eii-pds` record (`src/data/ballistic-custom.ts` ~426) and the `custom-penitrator` record (`src/data/missile-custom.ts`)
- Modify: the `custom-er-inarc`, `custom-small-laser-array`, `custom-medium-laser-array` and `custom-pile-bunker` records (`src/data/custom-lore-rules.ts`)
- Test: `src/data/best-of-future-wars-conversions.test.ts`, `src/data/alpha-strike-conversion-guard.test.ts`, `src/classes/battlemech.test.ts`

**Interfaces:** none new.

- [ ] **Step 1: Write the failing tests**
  - **Swing Fire:**
    - `custom-swing-fire-lrm-10`'s block equals `lrm-10`'s (0.3/0.6/0.6, notes include "LRM" and "Indirect Fire"), plus the `Ours` note.
    - `custom-swing-fire-srm-6`'s notes include "SRM".
    - The same holds for every Swing Fire record, generated as a table from `futureWarsSwingFires()`.
  - **EII PDS:** `custom-eii-pds` has `specialAbility ["AMS"]`, `rangeShort` 0.4, heat 1.
  - **Penitrator:** `custom-penitrator` has 0.15/0.35/0.25/0.25.
  - **Melee:** `custom-pile-bunker` has `specialAbility ["MEL"]`.
  - **ER iNarc:** `custom-er-inarc` keeps `["INARC"]`, and its notes start with `Ours`.
  - **Arrays:** both laser arrays have `noConversion` `"carried-by-linked-weapons"`. A 'Mech with a Medium Laser Array and three Medium Lasers in one arm converts with the same S/M/L damage as the same 'Mech without the array.
- [ ] **Step 2: Run them and expect FAIL**
- [ ] **Step 3: Implement as the spec says; remove these tags from `PENDING_647`**
- [ ] **Step 4: Run and expect PASS (plus `npx vitest run src/data`)**
- [ ] **Step 5: Commit:** `feat(#647): Alpha Strike damage for Swing Fire racks, EII PDS, Penitrator; MEL for the pile bunker`

---

### Task 4: Our new specials and their conversion

**Files:**
- Modify: `src/data/alpha-strike-special-abilities.ts`: add after `FLT` the entries `ITAS#`, `BSF#/#/#/#`, `NPC`, `HAIL`, `PSC`, `SMKT`, `SMKB#`, `PBR`, `PBJ`. Each has `type: ESpecialAbilityType.Custom`, `source: { book: "JBT conversion of the <item> (Custom Homebrew, NOT OFFICIAL)", page: 0 }`, and a summary holding the spec's rule text verbatim, with the item's author named.
- Modify: the records
  - `custom-improved-mech-taser` (`ballistic-custom.ts` ~45): `ITAS1`, heat 6, 0.1 short
  - `custom-blue-saviour` (`misc-custom.ts`): `BSF`
  - `custom-nuclear-pulse-cannon` (`artillery-custom.ts` ~112): `NPC`
  - `hailstorm-artillery` (`hailstorm-apocryphal.ts`): `HAIL`, `inferred: true`
  - `custom-mech-periscope`: `PSC`
  - `custom-smoker`: `SMKT`
  - `custom-buckler-smoke-dispenser`: `SMKB10`
  - `custom-power-booster-running` / `-jumping` (`best-of-future-wars-conversions.ts` `boosterItem`): `PBR` / `PBJ`
  - `custom-mech-improved-magnetic-grapples`: `noConversion "no-alpha-strike-rule"`
- Modify: `src/classes/battlemech.ts` AS loop (~3455-3610). Accumulate `energyDamage` from items whose `category === "Energy Weapons"` or whose `weaponType` includes `"DE"`. When a mounted item carries `BSF`, replace that code with `BSF<s>/<m>/<l>/<e>`, where each bracket is the bracket's final damage minus half its energy damage, rounded as the card's standard damage is rounded (use the same helper the LRM/AC damage codes use).
- Test: `src/data/alpha-strike-special-abilities.test.ts`, `src/classes/battlemech.test.ts`, the guard test

**Interfaces:**
- Consumes: `AS_SUMMED_EQUIPMENT_CODES` (Task 2)
- Produces: the nine codes above; the `BSF` card code in the form `BSF3/3/1/0`.

- [ ] **Step 1: Write the failing tests**
  - **Codes:** `isCustomAlphaStrikeAbilityCode` is true for `ITAS1`, `BSF3/3/1/0`, `NPC`, `HAIL`, `PSC`, `SMKT`, `SMKB10`, `PBR` and `PBJ`. `allowsAlphaStrikeAbilityCode("NPC", 4)` is false and `("NPC", 6)` is true.
  - **Required level:** a level 4 'Mech with an Improved 'Mech Taser shows `ITAS1`, and its card has `rulesLevel` 6.
  - **Summing:** two Buckler dispensers give `SMKB20`.
  - **Blue Saviour damage:**
    - A 'Mech with Blue Saviour and only ballistic weapons gets a BSF value equal to its S/M/L/E damage.
    - A 'Mech whose S/M/L damage of 4/4/2 is all lasers gets `BSF2/2/1/0`.
  - **Hailstorm at its own level:** a level 5 unit with Hailstorm shows `HAIL`, its card stays at level 5, and `hailstorm-artillery` has `inferred: true`.
- [ ] **Step 2: Run them and expect FAIL**
- [ ] **Step 3: Implement; remove these tags from `PENDING_647`**
- [ ] **Step 4: Run and expect PASS (plus `npx vitest run src/classes/battlemech.test.ts src/data`)**
- [ ] **Step 5: Commit:** `feat(#647): our Alpha Strike specials ITAS, BSF, NPC, HAIL, PSC, SMKT, SMKB, PBR, PBJ`

---

### Task 5: Alpha Strike play for our specials

**Files:**
- Modify: `src/utils/alpha-strike-ewar-play.ts`
  - `ASEWarCode` (~13) and its list (~32): add the nine codes.
  - `IASEWarPlayState` (~104): the new fields below.
  - `IASIncomingHit` (~336): `energy?: boolean; nuclear?: boolean`.
  - `getASIncomingDamage` (~349), `getASEWarToHit` (~395), `getASEWarStatus` (~547) and `applyASEWarEndRound` (~683).
- Modify: `src/ui/pages/alpha-strike/roster/_asEWar.tsx`: a card control for each special, following the SLA checkbox and the TSEMP buttons.
- Test: `src/utils/alpha-strike-ewar-play.test.ts`, `src/ui/pages/alpha-strike/roster/_asEWar.test.tsx`

**Interfaces:**
- Produces, in `IASEWarPlayState`:
  - `bsfOn?: boolean; bsfTurnsOn?: number; bsfDead?: boolean`
  - `boost?: { PBR?: { streak: number; dead?: boolean; usedThisTurn?: boolean }; PBJ?: { streak: number; dead?: boolean; usedThisTurn?: boolean } }`
  - `smokeLaid?: "trail" | "screen"; smokeTurnsLeft?: number; smokeUsesSpent?: number`
- Produces these functions:
  - `export function toggleASBlueSaviour(unit: IASEWarUnit, on: boolean): void`
  - `export function rollASBlueSaviourFailure(unit: IASEWarUnit, roll: number): boolean` (true = failed)
  - `export function applyASBlueSaviourCritical(unit: IASEWarUnit): number` (extra damage, 1 while on, else 0)
  - `export function useASPowerBooster(unit: IASEWarUnit, code: "PBR" | "PBJ", roll: number): { ok: boolean; burnout: boolean; line: string }`
  - `export function layASSmoke(unit: IASEWarUnit, code: "SMKT" | "SMKB", movedThisTurn: boolean): boolean`

- [ ] **Step 1: Write the failing tests** (the numbers are the spec's)
  - **Blue Saviour, incoming hits** (field on):
    - An energy hit of 5 becomes 2, and a 1 stays 1.
    - A missile hit of 3 becomes 2, with the line "Blue Saviour: -1 damage, as an AMS (BSF, ours)". It does not stack with the unit's own AMS: 3 still becomes 2.
    - With `nuclear: true` the damage is not reduced, by AMS or BSF alike.
  - **Blue Saviour, status:**
    - While on, `getASEWarStatus` reports the unit inside hostile ECM, and `isASStealthOn` is false.
    - `applyASEWarEndRound` adds 1 heat while on.
  - **Blue Saviour, failure:** with `bsfTurnsOn` 7, `rollASBlueSaviourFailure(unit, 2)` is true (below 3) and `(unit, 3)` is false.
  - **Blue Saviour, critical:** `applyASBlueSaviourCritical` returns 1 and sets `bsfDead`; afterwards `toggleASBlueSaviour(unit, true)` leaves it off.
  - **Power Booster:**
    - `useASPowerBooster(unit, "PBR", 5)` fails and marks it dead.
    - With roll 6 it succeeds, gives the line "+2\" Move this turn, +1 heat (PBR, ours)", and sets streak 1.
    - On the second turn in a row, a 9 fails. A natural 2 sets `burnout: true`.
    - The fourth turn in a row always fails.
    - An unused turn resets the streak in the End Phase.
  - **Smoke:**
    - `layASSmoke(unit, "SMKB", true)` is false (it moved).
    - With `false` it is true, spends one use, and fails once 10 uses per dispenser are spent.
    - The smoke lasts until the End Phase of the next turn.
  - **To-hit:** `getASEWarToHit` adds no line for `PSC`; the periscope shows only as a spotting line in `getASDefenseLines` or the status.
  - **Panel:**
    - It renders a Blue Saviour on/off control and a Power Booster "use" button with a roll entry.
    - It renders a Buckler/Smoker "lay smoke" button, and an energy/nuclear choice in the incoming-hit form.
    - No control renders for these specials on a level 4 unit.
- [ ] **Step 2: Run them and expect FAIL**
- [ ] **Step 3: Implement.** Follow the TSEMP pattern for the taser panel (Task 2's `applyASTaserHit` also gets its "Taser hit" button here, for MTAS and ITAS). Give each special its own play line.
- [ ] **Step 4: Run `npx vitest run src/utils/alpha-strike-ewar-play.test.ts src/ui/pages/alpha-strike` and expect PASS**
- [ ] **Step 5: Commit:** `feat(#647): Alpha Strike play for Blue Saviour, Power Boosters, smoke, tasers`

---

### Task 6: Alternate munitions

**Files:**
- Create: `src/data/alpha-strike-munitions.ts`
- Modify: every ammo record in the spec's Munitions table (`src/data/ammo.ts` for the canon AC and LRM/SRM munitions; `src/data/ammo-custom.ts`; `src/data/hailstorm-apocryphal.ts`; the custom builders in `derived-custom-values.ts` and `custom-lore-rules.ts` that generate the EMP, SABOT, boosted and Thunderbolt rounds: grep each tag)
- Modify: `src/classes/battlemech.ts` (`getAlphaStrikeSpecialAmmoTag` ~8232, and the card export ~10254): put the selected munition on the card as `asMunition`
- Modify: `src/utils/alpha-strike-ewar-play.ts`: `IASEWarUnit.munition?: ASMunitionKey`; a line in `getASEWarToHit`
- Test: `src/data/alpha-strike-munitions.test.ts`, the guard test, `src/utils/alpha-strike-ewar-play.test.ts`

**Interfaces:**
- Produces:
  - `export type ASMunitionKey = "ac-armor-piercing" | "ac-flak" | "ac-flechette" | "ac-precision" | "ac-tracer" | "msl-heat-seeking" | "msl-inferno" | "msl-magnetic-pulse" | "msl-mine-clearance" | "msl-semi-guided" | "msl-smoke" | "msl-swarm" | "msl-tandem-charge" | "msl-thunder" | "art-cluster" | "art-copperhead" | "art-flechette" | "art-illumination" | "art-smoke" | "boosted" | "emp" | "vhe" | "gauss-inferno";`
  - `export interface IASMunition { key: ASMunitionKey; name: string; toHit: number | null; requires: string[]; rule: string; page: number; custom?: boolean }` (`toHit` null where ASCE says "See rules")
  - `export const AS_MUNITIONS: readonly IASMunition[]`
  - `export function getASMunition(key: string | undefined, rulesLevel: number): IASMunition | undefined` (undefined for a `custom` row below level 6)
  - `export function canUseASMunition(munition: IASMunition, unitSpecials: string[]): boolean` (one of `requires` is among the unit's specials by base code; HAIL counts for `art-*`)

- [ ] **Step 1: Write the failing tests**
  - **Table values:** AP `toHit` +1 requires `["AC"]`; Flak −2; Precision −2; Semi-Guided −2 requires `["LRM"]`; Heat-Seeking −2 requires `["LRM", "SRM"]`, each with its page (143-146) as found in the extract.
  - **Level gate:** `getASMunition("emp", 5)` is undefined and `("emp", 6)` is defined. The Hailstorm's `art-*` rounds are canon rows, so they work at level 5 under the inferred `HAIL`.
  - **Required special:** `canUseASMunition(semiGuided, ["IF1", "SRM1/1"])` is false.
  - **Records:**
    - Every canon AC Armor-Piercing/Flak/Flechette/Precision/Tracer record (`ammo.ts`, every size) has its munition, as do the AC/12 Pleiades rounds.
    - `ammo-ac-10-sabot` is `"ac-armor-piercing"` with an `Ours` note.
    - `ammo-is-lrm-emp` is `"emp"` and `ammo-ac-2-boosted` is `"boosted"`.
    - `ammo-is-gauss-rifle-vhe` is `"vhe"`, `ammo-is-gauss-rifle-inferno` is `"gauss-inferno"`, and `ammo-hailstorm-cluster` is `"art-cluster"`.
    - `ammo-hailstorm-fae` has `noConversion "no-alpha-strike-munition"`, as do `ammo-machine-gun-ap` and `ammo-is-rotary-ac-2-caseless`.
    - `ammo-lb-15x-cluster` has `noConversion "carried-by-weapon"`.
    - Every standard round in the pending list has `"standard-ammunition"`.
  - **Play:** a unit with an AC special and `munition: "ac-armor-piercing"` gets the to-hit line "+1 Armor-Piercing ammo (ASCE p.143)" from `getASEWarToHit`. With `"msl-semi-guided"` and no LRM special it gets no line, and the card shows "needs LRM".
- [ ] **Step 2: Run them and expect FAIL**
- [ ] **Step 3: Implement**
  - Rule texts summarize the extract.
  - Our rows carry the spec's text and `custom: true`.
  - Remove every ammo tag from `PENDING_647`; `PENDING_647` is now empty, so delete the set and the "only shrinks" test.
- [ ] **Step 4: Run `npx vitest run src/data src/utils src/classes/battlemech.test.ts` and expect PASS**
- [ ] **Step 5: Commit:** `feat(#647): ASCE alternate munitions; every custom round converts or states why not`

---

### Task 7: TRO lines, guard, news, ship

**Files:**
- Modify: `docs/lore/homebrew-equipment-tro.md`, `docs/lore/best-of-future-wars-tro.md`, `docs/lore/ammunition-tro.md`: an "Alpha Strike: ..." sentence in each section that names a converted record, worded like the existing "Alpha Strike: LECM (ours, ...)" lines
- Modify: `src/data/alpha-strike-conversion-guard.test.ts` (the TRO test)
- Modify: the news page entry for 2026-11-22 (find it the way #643's news bullet was added, commit 38e5ef800)

- [ ] **Step 1: Write the failing TRO test.** Import each TRO markdown with `?raw` and split it on `\n## `. Every section that contains the `name` of a level 6-7 record must contain "Alpha Strike".
- [ ] **Step 2: Run it and expect FAIL (it lists the sections)**
- [ ] **Step 3: Write the TRO sentences.** Credit each item's author as the section already does, and mark our conversions "ours (NGCFells, 2026-11-22)".
- [ ] **Step 4: Run it and expect PASS**
- [ ] **Step 5: Add the news bullet** (credits live in the news): Alpha Strike for every custom item, the new specials by name, and the canon Taser/Apollo/Coolant Pod lookups.
- [ ] **Step 6: Run `npm run check`, then `npm run test:data`.** Expected: green, apart from the known load-sensitive Dire Wolf timeout, which passes alone.
- [ ] **Step 7: Commit:** `feat(#647): TRO Alpha Strike lines, guard test, news`
- [ ] **Step 8: Whole-branch review** by the astech agent on Opus. Fix every Critical and Important finding with a test.
- [ ] **Step 9: Ship.** Push `bv-gaps` to `origin/beta`, run `git deploy-beta`, and post the issue comment in NGCFells's voice (first person, casual). Tick the issue, close it, and give the comment URL for Discord. Update the handoff.
