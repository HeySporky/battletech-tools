# Custom Chassis Components, Custom Cockpits and the Last Cockpit Add-ons Implementation Plan (#114, #115, #171)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (#114) every custom chassis component catalog shows in the 'Mech creator's selection lists at Custom Homebrew; (#115) unknown cockpits in an import become drafts like other unknown items; (#171) the four deferred cockpit add-ons (DNI, Damage Interrupt Circuit, SLDF Advanced Neurohelmet, Virtual Reality Piloting Pod) are built, and the record sheet seats the second warrior of a command console, tripod or QuadVee.

**Architecture:** Engines, structure and gyros already read `getComponentRecords(kind)` from `src/data/custom-component-registry.ts` (canon, then the custom catalog, then this browser's drafts). The five other `getAvailable*` lists in `src/classes/battlemech.ts` (myomer ~5991, jump jets ~6004, gyros ~12515, heat sinks ~12552, armor ~13147) still map the canon arrays; they switch to the registry with the same Custom Homebrew gate the engine list uses (~12350). Cockpits join the registry as an eighth kind. The add-ons are flags beside the cockpit, saved as `features` the way the Command Console is (`command_console`, no schema bump).

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues; the SSW import design `docs/superpowers/specs/2026-09-30-ssw-runtime-import-custom-content-design.md` (drafts, the registry); IO:AE pp.62-63 for the add-ons (records in `src/data/mech-cockpit-types.ts` lines ~209-300 carry `constructionStatus: "deferred"` and cite the pages).

## Global Constraints

- Extract first: `C:/repo/ResourceLibrary/text/InterstellarOperationsAlternateEras-CGL-2021-Corrected2ndPrinting.txt` pp.62-63, 110 and the cost table pp.211-213 (the DNI's 250,000 vs 500,000 conflict is already flagged in its notes; keep the flag). Page image only when in doubt, written back whole.
- A custom component is offered only at Custom Homebrew (6) or Munchkin (7), but a design that already has one always keeps and shows it (the engine rule at ~12352).
- Every edition the add-ons exist in (IO:AE: TW, BMM, CRB editions, as their records say). The Battledroids and BMR editions do not offer them.
- Condense and extend: one new file only, `src/data/mech-custom-cockpit-types.ts`, because each registry kind has its own catalog (`CUSTOM_COMPONENT_CATALOGS`, registry line ~47). Tests extend `src/data/custom-component-registry.test.ts`, `src/classes/battlemech-command-console.test.ts`, `src/utils/sswDraftBuilder.test.ts`.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **DNI cost.** Recommended: keep 250,000 (the rules text, as MegaMek) and show the table's 500,000 in the TRO note, as the record says today.
2. **Second warrior on the sheet.** Recommended: a second MechWarrior monitor (name, Gunnery, Piloting, hits) printed under the first for a Command Console, a tripod and a QuadVee; play tracks its hits separately (the console's warrior takes the head hits too, as the pilot).

## Usual checklist

| Item | Task |
|---|---|
| Records (custom cockpit catalog; add-on records go from deferred to implemented) | 2, 3 |
| Construction in the creator | 1, 3 |
| Record sheet (second warrior, add-on notes) | 4 |
| Classic play (DIC, neurohelmet, VRPP, DNI effects; second warrior hits) | 3, 4 |
| Alpha Strike | each add-on states its conversion or reason: DNI and neurohelmet have no AS meaning beyond skill (reason stated); none at levels 6-7 needed |
| TRO entry | 3 (the TRO lists the add-ons under the cockpit) |
| Credits / news / review / check / deploy / issue comments | 5 |

## Review Focus

- A design saved with a custom armor or myomer at level 6, opened at level 2: it loads, keeps the item, shows it, and the item is not offered to others.
- A draft component (local drafts store) with a tag the catalog lacks: offered at level 6 with "(draft)", never at lower levels.
- Neurohelmet with DNI, EI or Machina Domini: refused with the IO:AE p.62 message.
- VRPP is a torso-mounted variant: the console and other cockpits are refused with it, as its record says.
- Old saves with `command_console` still load with one warrior's hits where the save has one.

---

### Task 1: The five lists read the registry (#114)

**Files:** Modify `src/classes/battlemech.ts` (`getAvailableMyomerTypes`, `getAvailableJumpJets`, `getAvailableGyros`, `getAvailableHeatSinks`, `getAvailableArmorTypes`, and the structure list near ~7555 if its selection list differs). Test: `src/data/custom-component-registry.test.ts`.

- [ ] Failing tests, one per kind: a custom record added to its `mech-custom-*-types.ts` test fixture (or a local draft via `custom-content-local.ts`) is offered at rules level 6, not offered at 2, and stays on a design that already has it at 2.
- [ ] Run `npx vitest run --project unit src/data/custom-component-registry.test.ts`. FAIL.
- [ ] Implement: each list iterates `getComponentRecords(kind)` and applies `isCustomComponent(kind, record)` with the engine list's gate. Run, then `npx vitest run --project unit src/classes/battlemech*.test.ts`. PASS, BV survey unchanged.
- [ ] Commit `'Mech creator: custom armor, structure, gyros, heat sinks, jump jets and myomer in the lists (#114)`.

### Task 2: Unknown cockpits become drafts (#115)

**Files:** Create `src/data/mech-custom-cockpit-types.ts` (empty array, typed `ICockpitType[]`). Modify `src/data/custom-component-registry.ts` (`"cockpit"` in `CUSTOM_COMPONENT_KINDS` and `CUSTOM_COMPONENT_CATALOGS`), `src/data/custom-content-types.ts` (`CustomContentKind` gains "cockpit"; drop the `| "cockpit"` special case at line ~39), `src/utils/sswDraftBuilder.ts:241` (stop skipping cockpits), `getAvailableCockpits` (~2807: add the custom and draft cockpits at level 6). Test: `src/utils/sswDraftBuilder.test.ts`, `custom-component-registry.test.ts`.

- [ ] Failing tests: an SSW file with an unknown cockpit name yields one cockpit draft with the file's slot count in the head and its tonnage from the gap guess; the drafted cockpit is offered at level 6; the 'Mech re-imports with it placed.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Custom content: draft unknown cockpits (#115)`.

### Task 3: The four cockpit add-ons (#171)

**Files:** Modify `src/data/mech-cockpit-types.ts` (the four records: `constructionStatus: "implemented"`), `src/classes/battlemech.ts` (`hasCockpitAddOn(tag)`, `setCockpitAddOn(tag, on, rulesLevel)`, saved in `features` like `command_console`; cost; BV per IO:AE p.188 where it prices them), the cockpit step of the 'Mech creator (grep `command_console` in `src/ui/pages/classic-battletech/mech-creator`). Test: `src/classes/battlemech-command-console.test.ts` (extend; rename the describe to "cockpit add-ons" only if the file gains a second describe).

- [ ] **Step 1:** Read IO:AE pp.62-63 in the extract; record each add-on's rules, cost, BV, legality and dates in the ledger `.superpowers/sdd/2026-11-22-mech-components-and-cockpits/progress.md`.
- [ ] **Step 2:** Failing tests: DNI is offered at Advanced and needs a pilot flagged with an implant (the pilot already has an implant field if EI uses one; grep `implant` in `pilot.ts`); DIC turns an internal explosion's 2 pilot hits into 1 and is disabled by a Life Support critical; the neurohelmet gives -1 Piloting and the Multi-Trac quirk effect while active, and is refused with DNI, EI or the interface cockpit; VRPP is refused with the Command Console and any other cockpit add-on; each costs what its record says; old saves load unchanged.
- [ ] **Step 3:** Run, FAIL. Implement construction and the play effects (the 'Mech play paths in `src/utils.ts` near the quirk to-hit and the pilot-hit code; grep `pilotHits`). Run, PASS.
- [ ] **Step 4:** TRO: the readout lists the add-ons under the cockpit (`src/classes/battlemech-tro.ts`); test in `battlemech-tro.test.ts`.
- [ ] **Step 5:** Commit `'Mech creator: DNI, Damage Interrupt Circuit, SLDF Neurohelmet and VR Piloting Pod (#171)`.

### Task 4: The second warrior on the sheet and in play (#171)

**Files:** Modify the 'Mech record sheet warrior box (grep `MechWarrior` in `src/ui/components/svg/record-sheet-*.tsx`), `src/classes/battlemech.ts` (`getCrewSeats(): 1 | 2`, a second pilot's hits in play state), the play damage path. Test: `src/ui/components/svg/` sheet test for 'Mechs (grep `Warrior Data` in tests), `battlemech-command-console.test.ts`.

- [ ] Failing tests: a Command Console 'Mech, a tripod and a QuadVee print two warrior monitors; a standard 'Mech prints one; a head hit with the console marks both warriors as IO:AE says (read the page first); a save with one warrior loads with the second unhurt.
- [ ] Run, FAIL. Implement. Run, PASS. Commit `Record sheet: the second warrior for consoles, tripods and QuadVees (#171)`.

### Task 5: Checklist, review and ship

- [ ] **News:** one bullet: custom components in every list, cockpit drafts, the four add-ons, the second warrior.
- [ ] **Check:** `npm run check`. Expected: green except known timeouts; BV survey unchanged.
- [ ] **Review:** astech Opus review of Tasks 3-4 (rules). Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #114, #115, #171 in NGCFells' voice; close when done; give the URLs.

## Models

Tasks 1-2: Sonnet. Tasks 3-4: Opus (rules in `battlemech.ts`). Review: Opus.
