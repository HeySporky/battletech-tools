# Future Wars Power Armor Implementation Plan (#172)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan. The owner's
> execution method is **one chunk per session**, each ending with a commit, a ledger entry and a handoff. Steps use
> checkbox (`- [ ]`) syntax.

**Goal:** Bill Swisher's Power Armor (5-, 10- and 15-ton suits built like a BattleMech) comes into the app under the
Custom Homebrew rules level: built in the 'Mech creator, printed, played in the roster.

**Architecture:** a **construction Special Ruleset on `BattleMech`**, as the Compact 'Mech rules are
(`best-of-future-wars-construction`, `src/data/future-wars-construction.ts`, `BattleMech.usesFutureWarsConstruction`).
Why not a unit type of its own (as walkers are): a suit has a 'Mech's locations, actuators, engine, gyro, heat sinks
and record sheet. The FW #14 sample suits are drawn on the standard FASA 'Mech sheet using the first six lines of each
location. The differences are slot counts (already one method, `getLocationSlotCount`), a cockpit replacement, the 5-ton
gyro and structure, a weapon limit at 5 tons, and play rules. The Battledroids edition already lets a 'Mech go down to 5
tons (`getMinWalkSpeed`, BD p.24 structure row), so nothing in the class assumes 10 tons as the floor.

**Tech Stack:** TypeScript, React, Vitest. No new dependencies.

**Sources (read 2026-11-17 on the page images):**
- Text: Bill Swisher, "Power Armor: The Poor Man's Battlemech", *The Best of Future Wars, Volume One* (1991), printed
  pp.14-16 (PDF 15-17). First printed in *Future Wars* #14 p.39 (1989); **the library's FW #14 scan lacks printed
  pp.39-42**, so the text is the Best-of's. Say so in the credit.
- Sample suits: *Future Wars* #14 printed pp.43-45 (PDF 31-33), three FASA 'Mech record sheets filled in by hand,
  **not in the Best-of**.

## Global Constraints

The Best-of plan's Global Constraints, the re-plan's credit rule (`2026-11-17-future-wars-originals.md`), and:
- Custom Homebrew only; a saved suit still opens below that level, with a message.
- No kept bundled design may change. A 'Mech without the ruleset must behave exactly as today: every new branch is
  behind `usesPowerArmorConstruction()`.
- Failing test first. `npx vitest run --project unit src/classes src/data src/utils` (PowerShell, or `env -u
  CLAUDECODE` in Bash), then `npm run check`. Commit and push `beta`; deploy and news by the standing permission.

## Session protocol

As the batch plan: read the handoff, this plan and the ledger; do the first chunk not marked done; test, commit, push;
ledger; rewrite the handoff's top block; stop.

## Models

| Chunk | Work | Model |
|---|---|---|
| A | Ruleset and construction rules in `BattleMech` | Opus 5.5 |
| B | Creator: ruleset pick, tonnages, waldo, issues | Sonnet 5.5 |
| C | Record sheet and play rules | Opus 5.5 |
| D | Battle Value, cost, Alpha Strike, dates, lore, TRO | Fable 5.2 (AS proposal to the owner first) |
| E | The three FW #14 sample suits (only if the owner says yes, re-plan Q4) | Sonnet 5.5 |
| F | Verify and report | Sonnet 5.5 |

## The rules (from the page images)

**History (lore, p.14):** House Steiner, short of light 'Mechs, funded a suit to back infantry in cities. A Tharkan
research project produced it in **2963**; the Estates-General blocked production at Hesperus II ("real Mechs" first).
Revived in **3026** for the planned Federated Suns / Lyran Commonwealth invasion of the Capellan Confederation; NAIS
and Lyran scientists could produce it again by 3027; **December 3027** Defiance Industries switched Hesperus II from
Zeus production to Power Armor; 230 suits by August 3028 at 38 a month; nearly 150 saw action on Liao worlds when the
Fourth Succession War began.

**Play (pp.14-15):** a one-level target; +1 to hit a suit; moves as a 'Mech. Stacking: up to 14 suits a hex, 7 when
sharing it with an infantry unit, a 'Mech or any other single unit. (1) +1 to hit. (2) A suit may punch, charge and kick
targets on its own level only, and may punch infantry in its hex while standing. (3) A suit may club a target on its
own level or the level above, using the punch or kick damage table for a same-level club. (4) A 'Mech may not punch a
suit on its level but may kick it; all 'Mech physical attack damage except DFA uses the ranged hit table; DFA uses the
punch table. (5) A suit's failed DFA: the pilot takes a hit and makes a Piloting roll to avoid another. (6) A suit cannot
club with a 'Mech limb or a tree, only a girder. (7) The pilot fills two critical slots in the head and two in the
center torso; no weapons in the head or center torso. (8) A head hit gives the pilot one hit; the head destroyed kills
the pilot. (9) Head critical on the pilot: killed. (10) Center torso critical on the pilot: 1d6 hits. (11) An ammo
explosion: 1 hit; if its damage reaches the center torso, the pilot is killed. (12) No ejection: unlatching the front
plate takes a full turn (no moving or firing); a center torso hit meanwhile gives 1d3 hits; alive and conscious at the
end phase, the pilot leaves the suit. (13) Building hexes, the Power Armor Building Effects Table (MP / pilot
modifier): 5 t Light 1/0, Medium 2/0, Heavy 2/+1, Hardened 3/+2; 10 t 1/0, 2/+1, 3/+2, 4/+3; 15 t 2/0, 3/+1, 4/+2, 5/+4.
Deployment (lore): infantry support, urban defense (Steiner); knee bashing (both); swarming (Davion); DropShip guards.

**Construction (p.16):** as a BattleMech, except: (1) upper and lower arm actuators required; (2) 3 slots an arm, 6 a
side torso, 2 a leg, none in the center torso (free slots, as the sheets show: each location has six lines, so an arm
is shoulder, upper, lower + 3, the hand actuator optional; a leg its four actuators + 2; the center torso is engine 6,
gyro 4, pilot 2); (3) no cockpit: a **0.5-ton waldo system, 50,000 C**; (4) a 5-ton suit has **no gyro**, and its pilot
needs Piloting 3 or better (4: +2 to all piloting; 5 or worse: cannot); (5) 5-ton structure **H1 CT3 ST2 A1 L1** (the
head can hold only 2 armor); (6) a 5-ton suit with a fusion engine needs **shielding of half the engine's weight**, as the
vehicle rules; 10 and 15 tons do not; (7) a 5-ton suit carries only **flamers, machine guns and small lasers**.

**The FW #14 sheets** (armor bubbles not filled in on any of them):

| Printed p. | Type | Tons | MP | Weapons | Other slots |
|---|---|---|---|---|---|
| 43 | (type line not on the scan: the sheet's top is cut off above Tonnage) | 10 | 14 / 21 / 0 | small laser RA | heat sink LA 5, LL 5-6, RL 5-6 |
| 44 | IPA-2 (written "I PA - 2") | 10 | 7 / 11 / 3 | medium laser RA; 2 small lasers LA | HS RA 6, LT 1 and 3, RT 1; jump jets LT 2, RT 2 (**two jets for jump 3**: a finding); HS legs 5-6 |
| 45 | top half of the type line cut off; the lower halves fit "I PA - 3" | 15 | 3 / 5 / 2 | large laser RA; medium laser LA; small laser LT; small laser RT | HS LA 6, LT 2-3, RT 2-3; jump jets LT 4, RT 4; HS legs 5-6 |

All three put the pilot in head slots 3-4 and center torso slots 11-12 and keep the standard ten heat sinks
(engine-integral plus outside = 10 on each sheet: 5 + 5, 2 + 8, 1 + 9).

**What Swisher took from canon:** the 5-ton structure row is Battledroids' (BD p.24: H3 CT3 ST2 A1 L1) with the head cut
to 1. The 10- and 15-ton suits use the edition's table.

## Calls that are ours (each labelled in the notes; cost if wrong)

1. Tonnages 5, 10 and 15 only; biped only. Cost: none (the article names only these).
2. The waldo is a cockpit record (`power-armor-waldo`, custom catalog): 0.5 t, 50,000 C, head slots 3-4 and center
   torso slots 11-12 as the sheets show. Cost: slot order on a sheet.
3. Head armor maximum is twice head structure at every weight (the article's reason, "since the head only has 1
   structure point it can only hold 2", generalised): 6 at 10 and 15 tons rather than 9. Cost: 3 armor points a head.
4. The 5-ton weapon list is the three items of the article's era: Flamer (and Vehicle Flamer), Machine Gun, Small Laser.
   Later variants (ER, pulse, light and heavy MGs) refused. Cost: a few later weapons refused.
5. Shielding at 5 tons: fusion engines only (standard, light, XL, compact, XXL); its weight half the engine's, rounded
   up to the half ton as vehicle shielding; no slots. Cost: half a ton.
6. Battle Value and cost by the edition's rules on the design as built, with the waldo's cost for the cockpit's (as the
   Compact ruleset does). Cost: a provisional figure, labelled.
7. The +1 to hit and one-level target apply to attacks on the suit in roster play; stacking is a reminder only (the
   app has no hex stacking). Cost: none.
8. Dates: prototype 2963 (the Tharkan project), introduced 3027 (Defiance Industries, Hesperus II), never extinct;
   Inner Sphere (Lyran and Federated Suns). From the article's history, so no owner question.

## Questions for the owner

Only one, at Chunk D: the Alpha Strike card (no source). The re-plan's Q4 (the samples) was answered yes on 2026-11-17:
see Chunk E.

---

## Chunk A: Ruleset and construction

**Files:** `src/data/special-rulesets.ts` (+ test), new `src/data/future-wars-power-armor.ts` (+ test: the tables
above), `src/data/mech-cockpit-types.ts` or the custom cockpit catalog (the waldo), `src/classes/battlemech.ts`
(+ `battlemech-power-armor.test.ts`), `src/data/__fixtures__/tech-lists.json` if a tag is new.

- [ ] **Step 1: Failing tests.** Ruleset `fw-power-armor` registered, Custom Homebrew, credited, `changes:
  ["mechConstruction"]` (so it refuses to sit with Flint's rulesets). With it, on a biped of 5 / 10 / 15 t:
  `getLocationSlotCount` gives head 6, CT 12, arms 6, side torsos 6, legs 6; any other tonnage gives an issue, not a
  build. The waldo replaces the cockpit (0.5 t, 50,000 C, head 3-4 and CT 11-12); upper and lower arm actuators cannot
  be removed; a 5-ton suit has no gyro (0 t, 0 slots), structure H1 CT3 ST2 A1 L1, shielding with a fusion engine,
  and refuses a weapon outside the list; head armor maximum is twice head structure. Without the ruleset, every one of
  these reads as today (a 10-ton 'Mech's slot counts, cockpit, gyro, structure).
- [ ] **Step 2:** Implement after `usesFutureWarsConstruction` (`usesPowerArmorConstruction`), reading the tables from
  `future-wars-power-armor.ts`. Check every caller of `getLocationSlotCount` and the cockpit / gyro getters behaves
  for a 5-slot-short location (the Compact work made them read the method: confirm).
- [ ] **Step 3:** Unit tests, `npm run check` (bundle tests unchanged), commit `Custom Homebrew: Power Armor
  construction (#172)`, push, ledger, handoff.

## Chunk B: Creator

- [ ] Ruleset pick offers 5 / 10 / 15 t only; the waldo shows where the cockpit would; the gyro row reads "none" at 5
  t; the 5-ton weapon list filters the equipment picker; issues (head armor, missing actuators, pilot skill) show in the
  creator's issue list. Tests for each; play it in Chromium; commit `Custom Homebrew: Power Armor in the 'Mech creator
  (#172)`.

## Chunk C: Record sheet and play

- [ ] **Step 1:** Record sheet: six lines a location (the Compact work prints tables of six), "Pilot" in the waldo's
  four slots, the Building Effects Table and a short rules box on the sheet. Render 5, 10 and 15 t in Chromium.
- [ ] **Step 2: Failing tests, then implement** in roster play: +1 to hit a suit; a 'Mech's punch refused against a
  suit on its level; DFA damage on the punch table; the pilot-hit rules 5 and 8-11; the exit turn (12); the 5-ton pilot
  limit (refuse skill 5+, +2 piloting at 4); building MP and pilot modifiers by tonnage. Physical attack eligibility goes
  where the game's physical attack checks live (`grep -n -i "canPunch\|physical" src/classes/battlemech.ts`).
- [ ] **Step 3:** Unit tests, `npm run check`, commit `Custom Homebrew: Power Armor record sheet and play (#172)`.

## Chunk D: Values, dates, lore, TRO

- [x] (DONE 2026-11-17, 3f522fc0e) Battle Value and cost (call 6) with a test pinning one suit after a human check; dates (call 8) on the waldo and
  the ruleset readout; lore from the history above in our words; a TRO - JBT entry. Alpha Strike: bring the owner a
  proposal first (candidates: a size-1 BattleMech card with a special ability for the +1 to hit, after the Micro-Mech
  ruleset in `micro-mech.ts`). Commit `Custom Homebrew: Power Armor values and readout (#172)`.
- OWNER RULING 2026-11-17 (Alpha Strike): keep the converter's BattleMech card (type BM, Size 1; IPA-4 converts to
  MV 12", A1/S1, 1/0/0, ENE, 7 PV) and add a Custom special **PWA** (Power Armor), text written like WLK / MCR: +1 to
  hit it; 1 level tall (low profile, as MCR); stacking reminder; no ejection; physical attacks as the article. The Point
  Value counts the +1 to hit as +1 TMM in the defensive factor (ours, labelled).
- OWNER RULING 2026-11-17 (Battle Value): KEEP the BV2 counterpart, +1 TMM (+0.1 Defensive Factor) for the +1 to hit
  (`bv2.def.factor.power-armor`).

## Chunk E: The FW #14 sample suits (OWNER: YES, 2026-11-17)

OWNER RULINGS 2026-11-17 (re-plan Q4 answered yes):
- Armor: not printed on any sheet. Spread it as we would for a standard BattleMech (the creator's usual allocation up
  to each location's maximum); the notes say the armor is ours.
- IPA-2 jump 3 on two jets: add the missing third jump jet in the free right torso slot (RT 3); the notes say so.
- Names: the owner asked whether the others share a naming theme. They do: p.44 is written "I PA - 2", and p.45's
  cut-off type line keeps the lower halves of "I PA - 3"; p.43's type line is not on the scan at all (the top of the
  sheet is cut off). So: p.43 = **IPA-1**, p.44 = **IPA-2**, p.45 = **IPA-3**. For IPA-1 and IPA-3 the notes say we
  could not determine the original name from the scan and chose our own after the series (IPA-3's partial line fits it).

- OWNER REQUEST 2026-11-17 (Chunk B session): also ship a 5-ton suit of our own, **IPA-4** (no FW #14 sheet is 5 tons;
  next number in the series; notes say design and name are ours). Built and saved as
  `C:/repo/JBTToolsSupportFiles/designs/power-armor/IPA-4.json`: 5 t, Standard Fusion 30 (+0.5 t shielding), walk 6 / run 9 / jump 0,
  no gyro, waldo, small laser LA 5 and RA 5, ten single heat sinks (1 in the engine; RA 6, LT 1-2, RT 1-2, LL 5-6, RL 5-6), standard
  armor 1.5 t = 24 points (each location at its maximum, CT 5 + 1 rear), pilot 4/3; no issues; BV 139, 184,065 C at build
  (provisional until Chunk D). Era late-sw-rn. Load it as the fourth sample.
- [x] (DONE 2026-11-17) `src/data/power-armor-samples.ts` after `walker-samples.ts`: the three sheets as printed (table above), with the
  rulings above. Tests: each builds with no issue other than the noted ones and matches its sheet (weapons, slots,
  heat sinks, movement; the IPA-2 at jump 3 with three jets).

## Chunk F: Verify and report

- [x] `npm run check`; no bundled design changed; comment on #172; news line; deploy beta. (2026-11-17: check green; only 949bd6057, the quad-import rebuild, touched bundled data in A-E; the Nov 17 news bullet already covers Power Armor; home page Available Tools updated.)
