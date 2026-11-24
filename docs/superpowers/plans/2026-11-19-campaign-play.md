# Campaign Play (survey, core, planet layer + Future Wars Economics) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Survey every campaign edition, then build the shared campaign core, a verified star system catalog (MekHQ
data as base, checked against our books and the ISCS maps), the planet layer and the merged Future Wars Economics
ruleset with NGCFells's derived damage table, as the first shippable piece of campaign play.

**Architecture:** One saved `Campaign` record (sides, ledgers, log, force snapshots, optional planet) in
`src/classes/campaign/`; Economics and damage are pure functions in `src/data/`; the two rulesets are Special Rulesets
(category `campaign`) hooked into the campaign's step advance; screens under `game-management/campaigns/`.

**Tech Stack:** TypeScript, React (class and function components as the neighbours use), react-router, vitest +
testing-library.

**Spec:** `docs/superpowers/specs/2026-11-19-campaign-play-design.md` (approved by NGCFells 2026-11-19).

**Later plans (written after Task 1's check-in, one each):** Aces onto the core (adapter; the campaign list shows Aces
campaigns), planet editions (BattleForce 2, BattleForce 1987, Reese's Planetary Assault, Interstellar Operations),
unit editions (Mercenary's Handbook 1987, 3055, Field Manual: Mercenaries, Chaos Campaign, Campaign Operations,
Mercenaries 2025). Other Classic BattleTech unit types in the force (vehicles, fighters...) come with the first unit
edition; this plan snapshots 'Mechs and Alpha Strike units only.

## Global Constraints

- Work in `C:/repo/btt-work` on branch `work/2026-11-19`; check `git branch --show-current` before every commit.
- Tests run in **PowerShell only**: `npx vitest run <path>`; the full gate is `npm run check` (PowerShell).
- Every canon or fanzine figure is read from the page image (OCR is a lead only) and pinned by a test.
- User-facing text names **NGCFells** as the one who decided or derived anything; never "owner", "ours", "the app".
- Economics ruleset text must contain: "Both printings merged into one ruleset by NGCFells's decision."
- Damage table credit: "Inspired by Herb Barents, *Future Wars* #5"; derived by NGCFells. Fan rulesets show NOT OFFICIAL.
- Sources: *Future Wars* #5 (1987) pp.5-6 and *The Best of Future Wars, Volume One* (1991) pp.33-34, both Herb Barents.
- No Bash heredocs (write files with the Write tool). Do not edit ResourceLibrary while another agent is active there.
- New saved collections cap at 500 and are optional keys in the full backup (older backups still restore).
- Commit message footer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A backup with no `campaigns` key, or with malformed campaign entries, restores everything else and skips the bad
   ones with a warning (Task 3 test).
2. A campaign whose saved 'Mech was deleted or edited still opens and plays from its snapshot (Task 4 test).
3. Destroyed dots pay nothing and cannot sit in a combination (Task 8 test).
4. An area with no controller pays no one at payday, and a side with no areas gets no ledger entry (Task 10 test).
5. Advancing several months at once pays every third month exactly once, never at month 0 (Task 10 test).

---

### Task 1: Survey the campaign editions, then check in with NGCFells

**Files:**
- Create: `.superpowers/sdd/2026-11-19-campaign-play/survey.md` (ledger)
- Modify: `docs/superpowers/plans/2026-11-17-future-wars-originals.md` (line 45: remove the "pain factor" claim; line
  73/169: Chunk H Economics now points here)

**Interfaces:**
- Produces: the final `ICampaignEdition` hook list (names and signatures) written into this plan's Task 2 before it
  starts, after NGCFells approves.

- [ ] **Step 1:** For each source in the spec's "Sources to read" table, read its campaign chapters (text extract in
  `C:/repo/ResourceLibrary/text`; numbers, tables and names checked on the page image rendered from
  `C:/repo/JBTIICRework`). Ledger row per book/printing: what it tracks (money unit, time step, contracts, repair,
  salvage, experience, supply, territory, interstellar travel: jump range, transit to the jump point by star type,
  recharge), each table with page, and the hooks it needs. Objective Raids (1992) and the eight Objectives books
  (2011-13): ledger which planets they cover, what per planet (garrison, factories and products, conditions, raid
  rules) and in what year; propose at the check-in whether they seed the system catalog (Task 5) and the planet
  layer's starting dots (a factory = a manufacturing dot), so NGCFells decides before Task 5. Note real rule differences
  between printings (separate editions) and misprints (follow the original).
- [ ] **Step 2:** Where an OCR extract is wrong on a passage used, list the correction in the ledger ("pending: another
  agent active in ResourceLibrary") instead of editing ResourceLibrary now.
- [ ] **Step 3:** Fix the re-plan's "pain factor" line and point Chunk H's Economics at this plan. Commit
  (`docs: campaign survey ledger; correct FW Economics reprint note`).
- [ ] **Step 4: STOP.** Show NGCFells the ledger summary and the proposed hook list. Write their answer into Task 2's
  Interfaces block. If the survey shows the core cannot carry an edition, take the design back to NGCFells.

### Task 2: Campaign core record

**Files:**
- Create: `src/classes/campaign/campaign-types.ts`, `src/classes/campaign/campaign.ts`
- Test: `src/classes/campaign/campaign.test.ts`

**Interfaces:**
- Produces (in `campaign-types.ts`):
  - `type CampaignTimeStep = "month" | "turn" | "track" | "sortie"` (approved by NGCFells 2026-11-19 at the Task 1
    check-in; travel is a duration in days logged against the step, never a step)
  - `type CampaignSideRole = "attacker" | "defender" | "other"`
  - `interface ICampaignSide { id: string; name: string; role: CampaignSideRole }`
  - `interface ICampaignLedgerEntry { id: string; sideId: string; step: number; amount: number; currency: string; reason: string; rule: string }`
  - `interface ICampaignLogEntry { id: string; step: number; text: string }`
  - `interface ICampaignDot { id: string; type: string; destroyed: boolean }`
  - `interface ICampaignArea { id: string; name: string; terrain: string; controllerSideId: string | null; dots: ICampaignDot[]; comboOverride: string[] | null }` (GM's chosen combination ids, in order; null = the app picks)
  - `interface ICampaignPlanet { systemId: string | null; name: string; areas: ICampaignArea[]; customDotTypes: ICustomDotType[] }` (`systemId` from Task 5's catalog; `name` = the planet's name in that system, or free text with no system)
  - `interface ICampaignTarget { id: string; sideId: string; systemId: string; intent: "travel" | "assault" | "defend" }`
  - `interface ICustomDotType { id: string; name: string; value: number; target: number }` (GM-added type; value
    default 1,000,000; destruction target default 8, builder's call: the middle of the table)
  - `interface ICampaignForceUnit` (Task 4 fills it; Task 2 stores it as given)
  - `interface ICampaignEdition { id: string; name: string; source: { title: string; publication: string; pages: string }; kind: "unit" | "planet" | "both"; currency: string; timeStep: CampaignTimeStep }` plus these optional hooks
    (approved by NGCFells 2026-11-19; an edition implements only what its book prints, screens show only its steps):
    `onStep?(c: Campaign): void`; `afterBattle?(c: Campaign, result: ICampaignBattleResult): void`;
    `repairCost?(c: Campaign, unit: ICampaignForceUnit, damage: unknown): ICampaignCost & { days?: number }`;
    `purchaseCost?(c: Campaign, unit: ICampaignForceUnit): ICampaignCost`;
    `contractOffer?(c: Campaign, terms: Record<string, unknown>): ICampaignContract`;
    `contractPay?(c: Campaign, contract: ICampaignContract): Omit<ICampaignLedgerEntry, "id">[]`;
    `rating?(c: Campaign): { value: number | string; label: string }`; `supply?(c: Campaign): void`;
    `control?(c: Campaign, area: ICampaignArea, result: ICampaignBattleResult): void`;
    `travelTime?(c: Campaign, fromSystemId: string, toSystemId: string): { days: number; jumps: number }`
  - `interface ICampaignCost { amount: number; currency: string }`
  - `type FightSize = "lance" | "company" | "battalion" | "regiment"`
  - `interface ICampaignBattleResult { areaId?: string; sides: { sideId: string; size: FightSize; losses: string[] }[]; heldBySideId: string | null }`
  - `interface ICampaignContract { id: string; name: string; terms: Record<string, unknown> }` (the unit editions
    plan fills it out)
  - `ICampaignArea` also carries `seized?: boolean` (BattleForce 2's seized vs default control) and `siteId?: string`
    (the Objectives site it was seeded from)
  - `interface ICampaignExport { version: 1; id: string; name: string; editionId: string | null; rulesetIds: string[]; startDate: string; step: number; sides: ICampaignSide[]; targets: ICampaignTarget[]; force: ICampaignForceUnit[]; ledger: ICampaignLedgerEntry[]; log: ICampaignLogEntry[]; planet: ICampaignPlanet | null; editionState: unknown }`
  - `CAMPAIGN_EXPORT_VERSION = 1`
- Produces (in `campaign.ts`): `class Campaign` with `constructor(data: ICampaignExport | null = null)`,
  `export(): ICampaignExport`, `import(data: unknown): void` (throws on non-object or missing id; drops malformed
  array items; caps each array at 5,000 entries), `get currency(): string` (edition's, else `"C"`),
  `get timeStep(): CampaignTimeStep` (edition's, else `"month"`), `balance(sideId: string, currency?: string): number`,
  `addLedger(entry: Omit<ICampaignLedgerEntry, "id">): void`, `addLog(text: string): void` (at the current step),
  `addSide(name: string, role: CampaignSideRole): ICampaignSide`, `currentDate(): string` (ISO `YYYY-MM-DD`:
  `startDate` plus `step` months on a month time step; `startDate` otherwise), `advance(steps?: number): void` (Task 10 adds the
  ruleset hooks; here it only moves `step` and logs "Month N" / "Sortie N").

- [ ] **Step 1: Write the failing tests:** `"round-trips through export and import"` (a campaign with two sides, one
  ledger entry, one log line, a planet with one area and two dots exports and re-imports deep-equal);
  `"balances each side's ledger in its currency"` (+5,000,000 and -1,200,000 on side A, +3 on side B: `balance(A)` =
  3,800,000, `balance(B)` = 3); `"refuses a non-object and skips malformed items"` (`import("x")` throws; a ledger
  item without `sideId` is dropped); `"advances months and logs each"` (`advance(3)`: step 3, three log lines);
  `"uses C-bills and months with no edition"`; `"counts the date in months"` (start `3025-01-15`, `advance(14)` →
  `3026-03-15`).
- [ ] **Step 2:** Run `npx vitest run src/classes/campaign/campaign.test.ts` (PowerShell). Expected: FAIL, module not
  found.
- [ ] **Step 3:** Implement the types and class (ids from `src/utils/generateUUID.ts`; editions looked up from
  `src/data/campaign-editions/index.ts`, which exports `CAMPAIGN_EDITIONS: ICampaignEdition[] = []` and
  `findCampaignEdition(id: string | null): ICampaignEdition | undefined`).
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Commit `Campaign play: core campaign record`.

### Task 3: Persistence and backup

**Files:**
- Modify: `src/dataSaves.ts` (beside the Aces campaign functions, lines ~28-45, ~99-102, ~137, ~880-910, ~1130-1141)
- Test: `src/dataSaves.test.ts`, `src/restore-backup-security.test.ts`

**Interfaces:**
- Consumes: `Campaign`, `ICampaignExport` (Task 2).
- Produces: `MAX_CAMPAIGNS = 500`, `saveCampaigns(appSettings, value: ICampaignExport[]): void`,
  `getCampaigns(appSettings): Promise<ICampaignExport[]>` (storage key `"campaigns"`), `IFullBackup.campaigns?`.

- [ ] **Step 1: Write the failing tests:** `"backs up and restores campaigns"` (two saved campaigns survive
  `getFullBackup` then restore); `"restores a backup with no campaigns key"`; `"skips an unreadable campaign with a
  warning"` and `"caps restored campaigns at 500"` (in the security test, following the Aces campaign cases there).
- [ ] **Step 2:** Run both test files. Expected: FAIL.
- [ ] **Step 3:** Implement following the Aces campaign pattern exactly (parse, cap, rebuild each through
  `new Campaign(raw).export()`, merge by id, "Add or replace campaign 'name'" messages).
- [ ] **Step 4:** Run both. Expected: PASS.
- [ ] **Step 5:** Commit `Campaign play: save, back up and restore campaigns`.

### Task 4: Force snapshots

**Files:**
- Create: `src/classes/campaign/campaign-force.ts`
- Test: `src/classes/campaign/campaign-force.test.ts`

**Interfaces:**
- Produces: `interface ICampaignForceUnit { id: string; sideId: string; kind: "battlemech" | "alpha-strike"; savedId: string | null; name: string; cost: number | null; bv: number | null; pv: number | null; snapshot: unknown; status: string }`;
  `snapshotBattleMech(mech: BattleMech, sideId: string): ICampaignForceUnit` (cost `getCBillCostNumeric()`, bv
  `getBattleValue()`, pv from its Alpha Strike conversion, snapshot `mech.export()`, savedId its uuid);
  `snapshotAlphaStrikeUnit(unit: AlphaStrikeUnit, sideId: string): ICampaignForceUnit` (cost `costCR`, pv
  `currentPV` or `basePoints` as the force page shows it, bv from the unit if present else null);
  `refreshForceUnit(unit: ICampaignForceUnit, saved: BattleMech | AlphaStrikeUnit): ICampaignForceUnit` (keeps id,
  sideId, status).

- [ ] **Step 1: Write the failing tests:** `"snapshots a 'Mech's cost, BV and PV"` (build a stock 'Mech the way
  neighbouring tests do; assert the three equal the class's own getters); `"keeps playing from the snapshot when the
  saved 'Mech is gone"` (snapshot, then re-create the 'Mech from `snapshot`: same name and cost);
  `"refresh replaces figures but keeps status"`; `"snapshots an Alpha Strike unit"`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `Campaign play: force snapshots`.

### Task 5: Star system catalog (import from MekHQ)

**Files:**
- Create: `scripts/star-systems/import_mekhq_systems.py` (developer tool, run by hand; Python 3 + PyYAML)
- Create: `src/data/star-systems/star-system-types.ts`, `src/data/star-systems/star-system-corrections.ts`
- Create (generated, committed): `src/data/bundled/star-systems-index.json`, `src/data/bundled/star-systems-detail.json`
- Create: `src/data/star-systems/STAR-SYSTEMS-CREDITS.md` (the CC BY-NC-SA 4.0 notice copied from the MekHQ files,
  ISCS credit, NGCFells's verification rule)
- Test: `src/data/star-systems/star-systems-data.test.ts`

**Interfaces:**
- Produces (types): `interface ISourced<T> { value: T; source: string }` (source = the MekHQ citation text, or the
  book and page after a correction); `interface IStarSystemIndexEntry { id: string; name: string; x: number; y: number;
  owners: { date: string; factions: string[] }[] }`; `interface IStarSystemDetail { id: string; spectralType:
  ISourced<string> | null; primarySlot: number | null; recharge: { date: string; nadir?: boolean; zenith?: boolean }[];
  planets: IStarPlanet[] }`; `interface IStarPlanet { name: ISourced<string>; type: string; sysPos: number;
  gravity?: number; atmosphere?: string; pressure?: string; temperature?: number; water?: number; events: { date:
  string; population?: number; socioIndustrial?: string; factions?: string[] }[] }`;
  `interface IStarSystemCorrection { systemId: string; path: string; value: unknown; source: string; note: string }`
  and `STAR_SYSTEM_CORRECTIONS: IStarSystemCorrection[]` (empty until Task 6).
- Objectives (approved by NGCFells 2026-11-19): `interface IStarSystemSite { id: string; systemId: string; planet:
  string; name: string; products: string[]; heavy: boolean; position?: string; date: string; source: string }`
  (`heavy` = makes 'Mechs, vehicles, fighters or ships: NGCFells's call); `interface IStarSystemGarrison { systemId:
  string; date: string; faction: string; units: string[]; source: string }` (unit deployments by date: which
  regiments are where; NGCFells asked for it 2026-11-19); both in `src/data/bundled/star-systems-sites.json`
  (`{ sites: [], garrisons: [] }`, hand-collected from our books in Task 6, so no MekHQ licence on it), loaded with
  the detail.
- The script reads the zip, keeps only these fields, applies `STAR_SYSTEM_CORRECTIONS` (exported to a JSON sidecar
  the script reads: `src/data/star-systems/star-system-corrections.json`; the `.ts` file re-exports it typed), and
  writes the two JSON files sorted by id. Index holds every system; detail is loaded only on campaign pages.

- [ ] **Step 1: Write the failing tests:** `"holds every canon system"` (index length 3,186; ids unique);
  `"places Terra at the origin and Tharkad where MekHQ does"` (Terra 0,0; Tharkad -212.999, 151.773); `"keeps each
  field's source"` (Tharkad spectral type G6V, source "25 Years of Art and Fiction, pg. 167"); `"applies a
  correction"` (run the script's correction step on a fixture; the corrected value and its book source win).
- [ ] **Step 2:** Run. Expected: FAIL (files missing).
- [ ] **Step 3:** Write and run the script: `python -I scripts/star-systems/import_mekhq_systems.py C:/repo/mekhq/MekHQ/data/universe/planetary_systems/canon_systems.zip`. Record the two files' sizes in the commit message.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `Star systems: catalog from MegaMek data (CC BY-NC-SA 4.0), to be verified against the books`.

### Task 6: Verify the catalog against the books and the ISCS maps (agent)

**Files:**
- Create: `scripts/star-systems/iscs_crosscheck.py`
- Create: `.superpowers/sdd/2026-11-19-campaign-play/star-systems-verification.md` (ledger)
- Modify: `src/data/star-systems/star-system-corrections.json`

- [ ] **Step 1: ISCS cross-check (every system).** The script reads the four ISCS PDFs (vector text + dots; the dot
  nearest each name label; 1.52 light-years a point, origin at Terra's dot, y flipped) and compares each named
  system with the index: position more than 3 light-years apart, a name missing on either side, owner in 2750 / 3040 /
  3062 (dot or region colour → faction; the legend gives the colours) different. Writes the disagreements to the
  ledger.
- [ ] **Step 2: Book check (agent, batches by source book).** For each cited book the library holds (look in
  JBTIICRework and `ResourceLibrary/text/_hashes.json`), open the cited page as an image and check the fields that
  cite it; for fields cited only "canon", search the extracts for the system and check what is found. Each mismatch:
  a correction (book wins, `source` = book and page) and a ledger row. Fields from "SUCS" or "assumption" are not
  changed; ledger counts them. Order: systems used by tests and the ISCS disagreements first, then by book.
- [ ] **Step 2b: Objectives sites and garrisons (agent, same batches).** From the eight Objectives books (2011-13)
  read each world's industrial sites (name, products, position, page) into `star-systems-sites.json`; deployments
  (which units are on which world, by date) from Objective Raids (1992, 3054), the House books and Handbooks
  (House Davion... 1980s; Handbook: House... 2010s), the Field Manuals and the Combat Manuals, each entry dated by
  its own book (era-honest). Text extracts lead, page images decide. This plan ships the first batch (Objective Raids
  and one Field Manual); the ledger lists the rest by book for later sessions. The ledger says
  which books are done; later sessions continue.
- [ ] **Step 3:** Re-run the import (Task 5 Step 3) and its tests. Expected: PASS.
- [ ] **Step 4:** Commit `Star systems: verified against the books (n corrections)`; the ledger says how much is
  verified, so later sessions continue the batches.

### Task 7: System lookups for campaigns

**Files:**
- Create: `src/data/star-systems/star-systems.ts`
- Test: `src/data/star-systems/star-systems.test.ts`

**Interfaces:**
- Consumes: Task 5's types and JSON.
- Produces: `getStarSystemIndex(): IStarSystemIndexEntry[]`; `loadStarSystemDetail(id: string):
  Promise<IStarSystemDetail | undefined>` (dynamic import of the detail JSON, as `bv-accuracy.tsx` imports its
  bundled JSON); `searchStarSystems(query: string, limit?: number): IStarSystemIndexEntry[]` (case- and
  apostrophe-insensitive, prefix matches first); `getSystemOwners(system: IStarSystemIndexEntry, date: string):
  string[]` (the last entry on or before the date); `getDistanceLY(a, b): number`; `getFewestJumps(a, b, jumpRange:
  number): number | null` (breadth-first over systems within `jumpRange`; null if unreachable);
  `DEFAULT_JUMP_RANGE_LY = 30` (confirm the figure and page in Task 1's survey; put the page in a comment).

- [ ] **Step 1: Write the failing tests:** `"finds Tharkad by a partial name"`; `"knows who held Tharkad in 3025"`
  (expect the value the index holds for that date, read in the test from the JSON, and the faction code it gives);
  `"measures Terra to Tharkad"` (≈ 261.5 light-years, to 1 decimal); `"counts jumps"` (Terra to a system 25 light-years
  away: 1; Terra to Tharkad: at least 9); `"returns null when no path exists"` (jump range 1).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `Star systems: search, owners by date, distance and jumps`.

### Task 8: Economics (pure)

**Files:**
- Create: `src/data/future-wars-economics.ts`
- Test: `src/data/future-wars-economics.test.ts`

**Interfaces:**
- Consumes: `ICampaignArea`, `ICampaignDot`, `ICustomDotType`, `ICampaignSide`, `ICampaignLedgerEntry` (Task 2).
- Produces:
  - `FW_DOT_TYPES: { id: FwDotType; name: string }[]` with ids `light-manufacturing`, `heavy-manufacturing`,
    `mining`, `radioactive-materials`, `oil`, `food`, `refining`, `processing`
  - `FW_DOT_VALUE = 1_000_000`, `FW_PAYDAY_MONTHS = 3`
  - `interface IFwCombination { id: string; name: string; needs: Record<string, number>; pays: { total: number } | { multiplier: 2 | 3 }; source: string }`
  - `FW_PRINTED_COMBINATIONS`: mining 1 + refining 1 + heavy-manufacturing 1 → total 7,000,000; food 2 + processing 1
    → 6,000,000; oil 1 + refining 1 + processing 1 → 12,000,000 (source "Future Wars #5 p.5")
  - `getBestAreaIncome(area: ICampaignArea, combos: IFwCombination[], custom: ICustomDotType[]): { total: number; used: { comboId: string; dotIds: string[]; pays: number }[]; loose: string[] }`
  - `getPayday(areas: ICampaignArea[], sides: ICampaignSide[], combos: IFwCombination[], custom: ICustomDotType[], step: number): Omit<ICampaignLedgerEntry, "id">[]` (one entry per side that controls at least one paying area; reason lists areas; rule `"fw-economics"`; currency `"C"`)
- Algorithm (not fixed by the tests alone): count the area's live dots by type; best = max over "no more
  combinations" (each loose dot pays its value) and, for each combination whose needs fit the remaining counts, its pay
  plus the best of the remainder; memoise on the counts. A multiplier combination pays multiplier x the sum of its
  dots' values. Ties: fewer combinations first.

- [ ] **Step 1: Write the failing tests:** `"pays a million a loose dot"` (3 dots → 3,000,000);
  `"pays the printed combinations"` (mining+refining+heavy → 7,000,000; food, food, processing → 6,000,000;
  oil+refining+processing → 12,000,000); `"picks the grouping that pays most"` (mining, refining, heavy, oil,
  processing → 14,000,000 via oil+refining+processing, mining and heavy loose); `"a dot sits in one combination only"`
  (food x4 + processing x1 → 6,000,000 + 2,000,000); `"destroyed dots pay nothing and join no combination"`;
  `"a GM combination pays double or triple"` (light x2 at multiplier 2 → 4,000,000; at 3 → 6,000,000);
  `"custom dot types pay their own value"`; `"the GM's grouping overrides the best one"` (the five-dot area with
  `comboOverride: ["mining-refining-heavy"]` → 9,000,000; an override combination that no longer fits is skipped); `"payday goes to each area's controller; no controller pays no one"`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `Future Wars: Economics (merged printings) income and payday`.

### Task 9: Derived damage table (pure)

**Files:**
- Create: `src/data/future-wars-economic-damage.ts`
- Test: `src/data/future-wars-economic-damage.test.ts`

**Interfaces:**
- Produces:
  - `FW_DOT_DESTROY_TARGETS: Record<FwDotType, number>`: food 6, oil 7, mining 8, radioactive-materials 8, refining 9,
    processing 9, light-manufacturing 10, heavy-manufacturing 11 (custom types use their `target`)
  - `type FightSize = "lance" | "company" | "battalion" | "regiment"`; `FW_FIGHT_SIZE_MODIFIERS`: lance -2, company 0,
    battalion 1, regiment 2
  - `interface IDotDamageInput { size: FightSize; defenderRestraint: boolean; scorchedEarth: boolean }`
  - `getDotDamageModifier(input: IDotDamageInput): number` (restraint -1, scorched earth +3)
  - `isDotDestroyed(target: number, naturalRoll: number, modifier: number): boolean` (natural 2 never destroys)
  - `isDefenderRestraint(area: ICampaignArea, sides: ICampaignSide[], step: number): boolean` (controller's role is
    defender and step < 3)
  - `rollAreaDamage(area, custom, input, roll2d6: () => number): { dotId: string; roll: number; destroyed: boolean }[]`
  - `rollPartisans(dot: ICampaignDot, custom, roll2d6: () => number): { roll: number; destroyed: boolean }` (-2 only)

- [ ] **Step 1: Write the failing tests:** `"prints NGCFells's table"` (each target above); `"food falls on 6+ in a
  company fight"` (roll 6 → destroyed, 5 → not); `"a lance fight takes 2 off"` (food, roll 7 → not); `"heavy
  industry needs 11+"` (regiment, roll 9 → destroyed; company, roll 10 → not); `"a natural 2 never destroys"`
  (food, regiment + scorched earth); `"defender's restraint only in the first quarter"` (defender-held: step 2 true,
  step 3 false; attacker-held: false); `"partisans roll at -2"` (food: 8 → destroyed, 7 → not).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `Future Wars: derived economic damage table (NGCFells, inspired by Barents)`.

### Task 10: The two rulesets and the campaign hooks

**Files:**
- Modify: `src/data/special-rulesets.ts` (two entries after the Future Wars play rulesets; `CHANGE_LABELS` gains
  `planetEconomics: "planet economics"`, `planetDamage: "economic damage"`)
- Create: `src/classes/campaign/campaign-rules.ts`
- Modify: `src/classes/campaign/campaign.ts` (`advance` calls the hooks)
- Modify: `src/ui/components/special-rulesets/ruleset-list.tsx` (optional prop `categories?: RulesetCategory[]`
  limits the list)
- Test: `src/classes/campaign/campaign-rules.test.ts`, `src/data/special-rulesets.test.ts`,
  `src/ui/components/special-rulesets/special-rulesets-step.test.tsx` (or the list's existing test file)

**Interfaces:**
- Consumes: Tasks 2, 8, 9.
- Produces:
  - Ruleset `fw-economics`: name "Future Wars: Economics", category `campaign`, `changes: ["planetEconomics"]`,
    `minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL`, source publication "Future Wars", tag "FW #5", author "Herb Barents",
    summary within 120 chars, description: dots, 1 million each, quarterly payday, the three printed combinations,
    same-area rule, double/triple for others, one combination a dot, and "Both printings merged into one ruleset by
    NGCFells's decision."
  - Ruleset `fw-economic-damage`: name "Future Wars: Economic Damage (derived)", `requires: ["fw-economics"]`,
    `changes: ["planetDamage"]`, tag "FW #5", author "Herb Barents", description says the table is derived by
    NGCFells, "Inspired by Herb Barents, Future Wars #5", and prints the table and modifiers.
  - `CAMPAIGN_RULE_HOOKS: Record<string, { onStep?: (campaign: Campaign) => void }>`; `fw-economics.onStep` writes
    `getPayday(...)` entries when `timeStep === "month"` and `step % 3 === 0 && step > 0`, and logs "Payday".
    `fw-economic-damage` has no step hook (rolls are made from the planet page, Task 11).

- [ ] **Step 1: Write the failing tests:** `"pays on months 3, 6 and 9 only"` (`advance(9)` → three paydays, none at
  0); `"no payday without the ruleset ticked"`; `"no payday on a sortie edition"` (a test edition with timeStep
  "sortie"); `"a side with no paying areas gets no entry"`; ruleset tests: `"economics says the merge was NGCFells's
  decision"`, `"economic damage needs economics"` (`getRulesetBlock(["fw-economic-damage"]...)` / requires check as
  existing tests do); list test: `"limits the list to campaign rulesets"`.
- [ ] **Step 2:** Run the four files. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS. Also run `npx vitest run src/data/special-rulesets.test.ts src/ui/components/special-rulesets` (no regressions in summary-length and CHANGE_LABELS checks).
- [ ] **Step 5:** Commit `Future Wars: Economics and Economic Damage rulesets in campaigns`.

### Task 11: Campaign screens

**Files:**
- Create: `src/ui/pages/game-management/campaigns/_router.tsx`, `list.tsx`, `campaign-home.tsx`, `planet.tsx`,
  `campaigns.scss`
- Modify: `src/ui/pages/game-management/_router.tsx` (route `campaigns/*`), `src/ui/pages/game-management/home.tsx`
  (link "Campaigns")
- Test: `src/ui/pages/game-management/campaigns/campaigns.test.tsx`

**Interfaces:**
- Consumes: Tasks 2-10; `getCurrentCBTForce`, `getCurrentASForce` from `dataSaves.ts` for adding units.
- Produces: routes `game-management/campaigns` (list + New), `.../campaigns/:id` (home), `.../campaigns/:id/planet`.

Screens (follow the Aces campaign page's look and its save-on-change pattern):
- List: name, edition ("No edition rules" for now), month, Open / Delete (confirm). New: name, start date, planet
  (system search via `searchStarSystems`, then one of its planets from `loadStarSystemDetail`, or free text), campaign rulesets
  through `RulesetList` with `categories={["campaign"]}`, sides (name + role, at least one).
- Home: step and Advance button; per-side balance and ledger table; log; force table (name, cost, BV, PV, status,
  Refresh, Remove) with "Add from current Classic BattleTech force" / "Add from current Alpha Strike force".
- Systems (always shown): the campaign's system with its planets (each field with its source), the owner on the
  campaign's date, and a targets table per side (system search, intent travel / assault / defend, distance in
  light-years and fewest jumps from the campaign's system). Each system also lists its Objectives sites and the
  garrisons on or nearest before the campaign's date (with book and page). Footer credits MegaMek Data (CC BY-NC-SA
  4.0) and ISCS.
- Planet (shown when `fw-economics` is ticked): areas (name, terrain, controller, dots by type with add/remove and a
  destroyed mark), custom dot types, GM combinations (needs + double/triple), payday preview per area with the grouping
  used; a "Seed dots from Objectives" button adds an area per site of the campaign planet (heavy manufacturing dot if
  `heavy`, else light), editable afterwards. When `fw-economic-damage` is ticked: an after-battle damage roller per area (fight size, scorched earth;
  restraint shown automatically) and a quarterly partisans roll; results logged and marked on the dots. Both rulesets
  show NOT OFFICIAL and their credits.

- [ ] **Step 1: Write the failing tests:** `"picks the campaign planet from a real system"` (search "Thark", choose
  Tharkad, a planet of it is offered); `"a target shows distance and jumps"`; `"creates a campaign with a side and saves it"`; `"advancing three months
  shows a payday in the controller's ledger"`; `"payday preview shows the grouping that pays most"` (the 14,000,000
  area); `"the damage roller marks destroyed dots and logs them"` (inject the roll); `"the planet page is hidden
  without Economics"`; `"shows NOT OFFICIAL and NGCFells's merge note"`; `"seeds dots from Objectives sites"`
  (fixture site with heavy: true becomes an area with one heavy manufacturing dot); `"lists a system's garrisons for
  the campaign's date"`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Check in Chromium (dev server): create a campaign, add an area with the five-dot set, advance 3
  months, roll damage; no console errors, no overflow at 375 px.
- [ ] **Step 6:** Commit `Campaign play: campaign, ledger, force and planet screens`.

### Task 13: Mercenary's Handbook (1987) edition

Added at NGCFells's request ("Make sure we get the Merca editions in as well before shipping", 2026-11-19). Figures
read from the 1987 scan's page images (the FanPro 2005 reprint matches; misprints follow the original, e.g. "Cacre").
Scope: Cost of Living, Creating Contracts and the Basic Campaign System (pp.36-50). The Advanced Campaign System
(pp.51-53+) is deferred to a follow-up.

**Files:**
- Create: `src/classes/campaign/unit-campaign.ts` (shared: `Quality`, `rangeLookup`, `CampaignRoll`)
- Create: `src/data/campaign-editions/mercenarys-handbook-1987.ts` + `.test.ts`
- Create: `src/ui/pages/game-management/campaigns/edition-mh1987.tsx`
- Modify: `src/data/campaign-editions/index.ts` (register), `list.tsx` (Edition select), `campaign-home.tsx` (edition
  panel), `campaign-store.ts` (`roll1d6` on the dice seam)

**Interfaces (produces):** `MH1987_EDITION: ICampaignEdition` (id `mh-1987`, kind `unit`, currency `C-bills`,
timeStep `month`, `onStep` posts the month's costs and contract pay to the unit's side); `IMh1987State` (sideId,
roster lines `{ id, type, quality, condition, count, company }`, overheadPct, moraleMod, reputationMod, contract);
pure `mh1987MonthlyCosts(state)`, `mh1987Reputation(roster)`, `mh1987Morale(state)`, `mh1987Negotiate(...)`,
`mh1987ContractTerms(...)`, `mh1987ResolveMonth(...)`.

- [ ] **Step 1:** Tests pin, from the pages: salaries (p.37: Elite MechWarrior 2,000, Green JumpShip 3,500), support
  points (5/10/20/30, Elite pilot 1), maintenance (p.38: Heavy 'Mech n 35 / s 123, Union DS n 70), 1 SP = 5,000,
  supplies 500 per squad, overhead 5-20% of salaries + supplies; reputation per company = ceil(points / 12) summed
  (p.36); morale bands (1.0-1.75 Green ... 3.5+ Elite); Employer Position 2D6 (p.41: 7 → 95); every negotiation table
  boundary (pp.42-44); Mission Modification rows (p.45: Objective Raid -6 / -50 / x1.75, length floored at 1); a
  negotiation worked from the p.41 rules (player above employer adds points; spending lowers the employer; final is
  the higher); Enemy Resistance (p.47: Garrison 7 → N) and outcome tables (pp.48-49: Offensive Heavy 2 → Q) and
  Outcome Description (A win +6 ... Q loss -6); `onStep` posts salaries, supplies, overhead and maintenance shortfall
  as separate ledger entries, plus 4 weeks of contract pay per month. Run: fail.
- [ ] **Step 2:** Implement. Run: pass. Commit `Mercenary's Handbook 1987 edition`.

### Task 14: Mercenary's Handbook 3055 edition

**Files:** Create `src/data/campaign-editions/mercenarys-handbook-3055.ts` + `.test.ts`,
`src/ui/pages/game-management/campaigns/edition-mh3055.tsx`; modify the same registry and screens as Task 13.

**Interfaces (produces):** `MH3055_EDITION` (id `mh-3055`, kind `unit`, currency `C-bills`, timeStep `month`: a month
is 4 weeks of maintenance and overhead and 2 biweekly paydays); `IMh3055State` (sideId, roster
`{ id, template, quality, count }` from the Combatant Templates, personnel `{ id, position, quality, count,
antiMech }`, rating inputs, contract); pure `mh3055Payroll`, `mh3055Maintenance`, `mh3055DragoonsRating`,
`mh3055ContractOffer`, `mh3055ContractPay`.

- [ ] **Step 1:** Tests pin, from the pages: Salary Table biweekly (p.89: Administration 640) and experience x1 /
  1.5 / 2 / 3 (anti-'Mech x2 more), the Crimson Crusaders' payroll 48,870; Weekly Maintenance by Combatant Templates
  Support Required (pp.112-114: Hvy 'Mech 375, Hvy Tracked 615, Support grades 675/1630/2810/3095 SP); Dragoons
  Rating points and bands (p.100: 0-45 D, 46-85 C, 86-120 B, 121+ A); Contract Offers (p.102); employer and job tables
  (pp.102-106, Periphery 2-3/3-6 misprint: a 3 reads the first row); payment = monthly salaries x rating (2.1 / 2.4 /
  2.7 / 3) x employer x mission (Clan 2); Straight Support / Battle Loss (+1 B or C, +2 A, +3 Marik); transport and
  salvage (+5 Combine or Rasalhague, -3 Clans); Contract Hearing. Run: fail.
- [ ] **Step 2:** Implement. Run: pass. Commit `Mercenary's Handbook 3055 edition`.

### Task 12: Ship

**Files:**
- Modify: `src/ui/pages/home.tsx` (news: today's entry gains a bullet "Campaigns (issue #172)": campaign record,
  Future Wars Economics with both printings merged by NGCFells's decision, NGCFells's derived damage table; Available
  Tools: Game Management gains Campaigns)
- Modify: `docs/superpowers/plans/2026-11-17-future-wars-originals.md` (Chunk H Economics ticked, pointing here)
- Modify: `C:/repo/JBTToolsSupportFiles/handoff.md` (new top block starting "FIRST: check memory, rules and guidelines")

- [ ] **Step 1:** `npm run check` in PowerShell. Expected: exit 0 (known 3 lint warnings only).
- [ ] **Step 2:** Commit `News: campaigns and Future Wars Economics`.
- [ ] **Step 3:** Merge `work/2026-11-19` into beta (fast-forward if possible), push origin, verify with
  `git ls-remote`, `git deploy-beta` (standing permission).
- [ ] **Step 4:** Handoff block (STATE, DONE, NEXT: the Aces plan and the edition plans from the survey) and commit it
  in JBTToolsSupportFiles.
