# Equipment Wiring, Domain Catalogs, Newer Weapon and Armor Play, FrankenMech Leftovers Implementation Plan (#165, #167, #170, #182)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every misc item in #165 has a sourced record and is offered by the builders that may mount it; the domain catalogs #170 still owes exist; the newer weapons and armor play as their books say (#182); and the FrankenMech leftovers (#167) are done: Centurion susceptibility in play, Quality Rating and refit time in the campaign tool.

**Architecture:** Records go into the existing catalogs (`src/data/equipment-misc.ts`, the battle armor and ProtoMech component files, `capital-weapons.ts`, the large-craft systems list). Builders already filter by `space` per unit type; wiring is making sure each record's `space` and rules level are right and each creator lists it. Play effects join the existing play helpers: weapon fire in `src/utils.ts` (the 'Mech to-hit path near line ~1177) and the vehicle play view, armor effects in `battlemech.ts`'s damage path beside Laser Reflective (~6613-6631, which E-War Phase 5 built), and the campaign tool in `src/classes/campaign/`.

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues. Leads from #165's Sarna pass (review-only; "TO" pages may be the pre-split book): Drone OS/Carrier Control TO p.305, Recon Camera TO p.337, Sprayer TM p.248, Fluid Suction TM p.248, Liquid Storage TM p.239, Comms Equipment TM p.212, Paramedic TM p.233, Booby Trap TO p.297, Chaff Pod TO p.299, Collapsible Command Module TO p.301, Artemis V TO p.283, Apollo TO p.331, DNI Unbound p.66, Buzzsaw Unbound p.70, RISC Laser Pulse Module IO p.93, Super-Cooled Myomer IO p.94, Ram Plate OTP: Hanseatic Crusade p.30.

## Already done (verified 2026-11-22; tick on the issues)

- Turrets (#88), Chaff Pod (records and AS, #642/#647), Artemis V (E-War, #642), RISC Laser Pulse Module (#76), Command Console (#171).
- AMS interception with ammo use and TAG designation in play (E-War phases 1-5, `src/utils/ewar-play.ts`), Laser Reflective armor's halving (`battlemech.ts` ~6613-6631).

## Global Constraints

- Extract first (`C:/repo/ResourceLibrary/text`); a Sarna page number is a lead only: confirm it in the book's extract (TO:AUE / TO:AR / IO:AE split books) and cite the book page. Page image only when in doubt, written back whole.
- Every edition the item exists in, every unit type that may mount it; removed items stay apocryphal; a book offering an item for an edition makes it available there.
- Canon AS conversions from the Companion/errata; an inferred conversion stays at the item's level with `inferred: true`.
- The cockpit add-ons (DNI, DIC) are built in `2026-11-22-mech-components-and-cockpits.md`; Support Vehicle items in `2026-11-22-support-vehicle-leftovers.md`. Do not build them twice.
- Condense and extend: no new source files. Tests extend `src/data/misc-equipment*.test.ts` (grep), `battle-armor*.test.ts`, `protomech.test.ts`, `capital-ship.test.ts`, `battlemech-autocannon-play.test.ts`, `battlemech-ammo-explosion.test.ts`, `battlemech-frankenmech.test.ts`, `src/classes/campaign/*.test.ts`.
- Vitest: `npx vitest run --project unit <path>`, from PowerShell. No apostrophes in Bash commands or heredocs. Never grep `src/data/equipment-*.ts` without `| cut -c1-200`.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **Tracked movement mode (#182).** The issue says "tracked movement mode" with no more. Recommended: it means QuadVee / tracked 'Mech movement on tracks (IO:AE QuadVee vehicle mode and the TO:AUE Tracks item), played as vehicle-mode MP and terrain costs. If you meant something else, say so on #182 and that task changes.
2. **Campaign Quality Rating and refit (#167).** Recommended: in the campaign tool (`2026-11-19-campaign-play.md`'s home) as a per-unit Quality Rating (A-F) with CO pp.211-214's refit time and cost classes, shown on the unit's campaign card; FrankenMechs get their refit class from CO.

## Usual checklist

| Item | Task |
|---|---|
| Records with notes, lore, dates, BV, cost | 1, 2 |
| Construction (offered in every builder that may mount it) | 1, 2 |
| Record sheet (lines for the new items and armor) | 1, 3 |
| Classic play | 3, 4 |
| Alpha Strike (each record's conversion or reason; armor specials such as RCA, BHJ#, IRA where ASC gives them) | 1, 3 |
| TRO | each item on its unit's TRO line |
| Credits | none (canon) |
| News, review, check, deploy, issue comments | 5 |

## Review Focus

- MG Array: one attack roll for the array, cluster table by the number of linked guns, ammo per gun (TW / TM rules); an array with one gun destroyed fires with the rest.
- Reactive armor halves only area-effect and missile/artillery damage it names; Hardened armor's damage reduction and its Piloting penalty; Heat-Dissipating armor's heat reduction from flamers and infernos.
- Chemical lasers spend ammo per shot and explode as their ammo rules say.
- HVAC: the dust plume / smoke rule and its heat; jams if the rules say so.
- A FrankenMech in play is susceptible to the Centurion's effect only when a Centurion is on the board (play flag), per IO:AE p.80.

---

### Task 1: #165 misc equipment, every item sourced and offered

Items: EI Interface, drone OS/console, SRCS, IndustrialMech ejection seat, recon camera, sprayer, buzzsaw, fluid suction, ladder, vehicular mine dispenser, booby trap, cargo/liquid storage, comms equipment, collapsible command module, HarJel II/III, paramedic gear, ground-mobile HPG, RISC viral jammers, super-cooled myomer, QuadVee wheels, dumpers, Ram Plate.

- [ ] **Step 1:** For each item, grep its record (`grep -rn -i "<name>" src/data | cut -c1-200`) and every creator's offer list; mark in the ledger `.superpowers/sdd/2026-11-22-equipment-wiring/progress.md`: record ok / missing / unsourced; offered in which creators.
- [ ] **Step 2:** For each gap, in that order: read the book page (extract), failing test (record values; offered on each unit type its `space` allows at its rules level; AS conversion or reason), add or fix the record, wire the creator, run `npx vitest run --project unit src/data src/classes/<unit>*.test.ts`, PASS. One commit per small family: `Equipment: <family> sourced and offered (#165)`.

### Task 2: #170 the remaining domain catalogs

Owed: battle armor chassis, motive systems, manipulators and weapons; ProtoMech UMU, engine and structure-point tables; capital missile large-craft slot columns (SO), Naval C3 and other large-craft systems; the variable-size industrial items (Communications Equipment, Dumper, Extended Fuel Tanks, Ladder, Pintle Mount, Power Amplifiers, transport bays); primitive Small Craft and large craft armor.

- [ ] **Step 1:** For each, find where the rule lives today (often rules logic in the class, as actuators were): grep the class (`battle-armor.ts`, `protomech.ts`, `capital-ship.ts`, `small-craft.ts`, `vehicle.ts`). Note in the ledger.
- [ ] **Step 2:** Move each table into its catalog file beside the class (`src/data/battle-armor-*.ts`, `src/data/protomech-components.ts`, `src/data/capital-weapons.ts` slot columns, `src/data/aerospace-armor-types.ts` primitive armor, the misc catalog for variable-size items with a `variableFormula`), test-first: a test pins every value the class used before the move (snapshot of the class's outputs for the sample designs), then the class reads the catalog. Run, PASS, BV survey unchanged. One commit per domain: `Catalogs: <domain> tables as data (#170)`.

### Task 3: #182 newer weapon and armor play

- [ ] **Step 1:** Verify what plays today (the "Already done" list) and write the remaining list in the ledger.
- [ ] **Step 2, weapons:** failing tests then code for MG Array cluster fire (TW/TM), chemical laser ammo use (TO:AUE p.132), HVAC (TO:AUE pp.284-286 in the old TO; find it in the split book) in the 'Mech and vehicle play paths. Commit `Play: MG Arrays, chemical lasers and HVACs (#182)`.
- [ ] **Step 3, armor:** failing tests then code for Reactive, Hardened and Heat-Dissipating armor effects in the damage path beside Laser Reflective: a new `getIncomingDamageByArmor(amount, damageKind, armorTag)` next to `getIncomingEnergyDamage` (`src/utils/future-wars-play.ts:202`), called where `battlemech.ts` ~6628 calls it today. Every unit type that may carry the armor (vehicles, BA where allowed). AS: the armor specials ASC gives. Commit `Play: Reactive, Hardened and Heat-Dissipating armor (#182)`.
- [ ] **Step 4, tracked mode** (OWNER CALL 1): failing tests that a QuadVee in vehicle mode and a 'Mech with Tracks move on tracks with vehicle terrain costs; implement. Commit `Play: tracked movement mode (#182)`.

### Task 4: #167 FrankenMech leftovers

- [ ] Centurion: read IO:AE p.80; a force-level "Centurion present" switch in play; failing test that a FrankenMech then takes its effect; implement in the 'Mech play path. Commit `FrankenMechs: Centurion susceptibility in play (#167)`.
- [ ] Quality and refit (OWNER CALL 2): read CO pp.211-214 (`CampaignOperations-CGL-2023-Corrected4thPrinting.txt`); failing tests for Quality Rating per campaign unit and refit time and cost by class, FrankenMech refits included; implement in `src/classes/campaign/`. Commit `Campaign: Quality Rating and refits, FrankenMechs included (#167)`.

### Task 5: Checklist, review and ship

- [ ] **News:** one bullet per family.
- [ ] **Check:** `npm run check`; BV survey unchanged.
- [ ] **Review:** astech Opus review (rules). Fix Critical and Important test-first.
- [ ] **Ship:** push `beta`, `git deploy-beta`.
- [ ] **Issues:** comment on #165, #167, #170, #182 in NGCFells' voice; close the finished ones; give the URLs.

## Models

Tasks 1-2: Sonnet. Tasks 3-4: Opus (play rules). Review: Opus.
