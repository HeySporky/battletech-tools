# Catalog consolidation, round 1: the standing core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every catalog the same standing fields, one shared tech-dates filter that reads `clanDates` for every
record (equipment included), the pre-Total Warfare expansions as valid edition tags on one dated timeline, and a
catalog-wide test, with no data change and no BV change.

**Architecture:** A new `ICatalogStanding` interface in `data-interfaces.ts` that the catalog record types extend. One
`getTechDatesAvailability` in `equipment-registry.ts` replaces the per-class copies. `rules-editions.ts` gets an
edition timeline merging editions and expansions by publication date. A new `catalog-registry.ts` lists every catalog
for the new `catalog-standing.test.ts`.

**Tech Stack:** TypeScript, Vite, React 18 class components, Vitest (`--project unit`).

**Spec:** `docs/superpowers/specs/2026-10-24-catalog-consolidation-design.md` (round 1 of "Order of work"; §1, §2
"Dates per tech base", §3). It builds on `docs/superpowers/specs/2026-10-21-catalogs-editions-design.md`.

## Global Constraints

- No data change in any catalog file, and no unit's BV changes. Round 1 is structure only.
- 4-space indentation; comments match the surrounding density (one-line JSDoc on exported functions, with the rule's
  page where there is one).
- After each task: `npx vitest run --project unit <touched tests>`; at the end the full
  `npx vitest run --project unit` (baseline 211 files, 3163 tests at `7b568cfde`), `npx tsc --noEmit -p .`,
  `npx eslint <changed files>`.
- Work on `beta`. Never commit in `C:\repo\JBTIICRework`. Never push upstream.
- Use the Write tool, not heredocs, for any text with apostrophes.

## Review Focus

1. A mixed-tech unit offered a component or weapon whose IS dates are a prototype and whose Clan dates are in
   production. The expected behaviour is BattleMech's today: production wins over prototype. The aerospace fighter
   copy picks the IS prototype instead, so unifying changes it. Pinned in Task 2.
2. A Clan unit in the Star League era (before 2780) picks a component with `clanDates`. It keeps the Star League
   carry-over (`getStarLeagueCarryOverDates`) exactly as now. Pinned in Task 2.
3. An equipment record with no `clanDates`, on a Clan unit. Its own dates apply, unchanged (every equipment record
   today). Pinned in Task 2.
4. A record whose `editions` names an expansion (`citytech`). It must pass the catalog tests and sort between the
   editions by date, not fail as an unknown tag. Pinned in Task 3.
5. A save carrying a tag that is now an `altTags` alias. It still resolves (no merges happen this round, but the
   registry's alias check must not reject today's existing aliases). Pinned in Task 4.

---

### Task 0: BV baseline (scratch only, never committed)

**Files:** scratchpad `C:\Users\chris\AppData\Local\Temp\claude\c--repo-battletech-tools-master\3fba93ca-62e6-4e5e-8938-e09b1c704d01\scratchpad\`
(`zz-bv46.test.ts`, `zz-dsall47.test.ts`, `dsall.ps1`, `dslist.txt`, already copied there).

- [ ] **Step 1:** Run the 'Mech survey: copy `zz-bv46.test.ts` into `src/classes/`, run it with
  `OUT=<scratchpad>\bv-before-mechs.json` (default `TYPES`, the SSW corpus at
  `C:/repo/battletech-tools/WorkingData_DEV/SSWdata`), then delete the copy from `src/classes/`.
- [ ] **Step 2:** Run the DropShip/Small Craft survey: edit `dsall.ps1` so `$S` is this session's scratchpad and
  `OUT` is `bv-before-ds.tsv`, run it. It deletes its own copy.
- [ ] **Step 3:** Check `git status` shows no `zz-*` file in `src/`.

Expected: two baseline files in the scratchpad. Task 5 runs the same surveys and diffs the results.

### Task 1: The standing core type

**Files:**
- Modify: `src/data/data-interfaces.ts` (`IEditionHistory` at about line 76; `ITechDates` at about line 544; the
  catalog record interfaces)
- Modify: the record interfaces declared outside it: `src/data/infantry-weapons.ts` (`IInfantryWeapon`),
  `src/data/infantry-armor.ts`, `src/data/battle-armor-equipment.ts`, `src/data/battle-armor-armor-types.ts`,
  `src/data/aerospace-armor-types.ts`, `src/data/support-vehicle-armor.ts`, `src/data/vehicle-motive-types.ts`,
  `src/data/combat-vehicle-chassis-modifications.ts`, `src/data/support-vehicle-light-weapons.ts`,
  `src/data/battle-armor-scale-equipment.ts` (whichever of these declare their own record interface)

**Interfaces:**
- Produces:

```ts
export type CatalogTechBase = "is" | "clan" | "universal";

/** The standing every catalog record carries (design 2026-10-24 §1). */
export interface ICatalogStanding extends IEditionHistory {
    tag: string;
    name: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    techBase?: CatalogTechBase;
    /** Clan dates when they differ from the record's own (Inner Sphere or universal) dates. */
    clanDates?: ITechDates;
    rulesLevel?: number;
    book?: string;
}
```

  `techBase` stays optional in round 1; rounds 3-5 fill it and make it required. `page` is left off the core because
  the catalogs type it differently (number vs string); each keeps its own.

- [ ] **Step 1:** Add `CatalogTechBase` and `ICatalogStanding` beside `IEditionHistory`. Make `IEquipmentItem` and
  every catalog record interface listed above (and the 'Mech component interfaces in `data-interfaces.ts`:
  armor, engine, gyro, cockpit, heat sink, internal structure, jump jet, myomer) extend `ICatalogStanding`, deleting
  the fields each now inherits where the declarations are identical.
- [ ] **Step 2:** Run `npx tsc --noEmit -p .`. Where a child's field clashes with the core (a different `techBase`
  union, a required `tag` that a catalog lacks), keep the child's own declaration if it narrows the core's type.
  If it is wider, leave that interface off the core and list it in the commit message for round 3-5. Expected: tsc
  clean.
- [ ] **Step 3:** Run `npx vitest run --project unit src/data`. Expected: all pass (types only).
- [ ] **Step 4:** Commit: `Catalogs share one standing core: tag, tech base, editions, Clan dates (design 2026-10-24 §1)`.

### Task 2: One tech-dates filter for every unit and every record

**Files:**
- Modify: `src/data/equipment-registry.ts` (beside `getDatesAvailability`, about line 322)
- Modify: `src/classes/battlemech.ts` (`_techDatesAvailability`, `_clanDatesAvailability` at about 10098-10120; the
  equipment-list date check at about 11140-11146)
- Modify: `src/classes/vehicle.ts` (about 2770-2790; its equipment availability in `_setAvailability`)
- Modify: `src/classes/aerospace-fighter.ts` (about 1662-1675)
- Modify: `src/classes/small-craft.ts` (about 1255-1270, and the weapon dates at about 1061)
- Test: `src/data/tech-dates-availability.test.ts` (new)

**Interfaces:**
- Consumes: `ICatalogStanding.clanDates` (Task 1), `getDatesAvailability`, `getStarLeagueCarryOverDates`.
- Produces:

```ts
/** A unit's tech tag from tech-options.ts: "is", "clan", or a mixed base ("mis", "mclan"). */
export type UnitTechBase = string;

/**
 * Availability of a record for a unit of `unitTech` in an era: the Clan dates (`clanDates`, else the record's own)
 * for Clan units, with the Star League carry-over; the record's own dates for Inner Sphere units; for mixed tech,
 * whichever is in production, else whichever is a prototype.
 */
export function getTechDatesAvailability(
    item: ITechDates & { clanDates?: ITechDates },
    unitTech: UnitTechBase,
    rulesLevel: number,
    isAvailable: (introduced: number | null, extinct: number | null, reintroduced: number | null) => boolean,
): { available: boolean, asPrototype: boolean };
```

  Its body is BattleMech's `_techDatesAvailability` plus `_clanDatesAvailability`, moved. The classes keep thin
  private wrappers that pass `this.getTech().tag` (or `this._tech.tag`) and their own `_itemIsAvailable`, so callers
  don't change. `_usesStarLeagueVersion` stays in the classes.

- [ ] **Step 1: Write the failing tests** in `tech-dates-availability.test.ts`, with
  `isAvailable` = "the window overlaps year Y" for a fixed Y:
  - `clan unit reads clanDates`: item `{ introduced: 2600, extinct: 2830, reintroduced: 3044, clanDates: { introduced: 2844, extinct: null, reintroduced: null } }` (the Arrow IV standard ammo's two date sets) at Y=2900: `clan` → `{ available: true, asPrototype: false }`; `is` → `{ available: false, ... }`.
  - `no clanDates: own dates for clan`: same item without `clanDates` at Y=2900 → `clan` unavailable (extinct 2830).
  - `mixed prefers production over prototype`: item `{ prototype: 3040, introduced: 3060, extinct: null, reintroduced: null, clanDates: { introduced: 3050, extinct: null, reintroduced: null } }` at Y=3055, rulesLevel 4 (`EXPERIMENTAL_RULES_LEVEL`) → `"mis"` and `"mclan"` both return `{ available: true, asPrototype: false }`.
  - `star league carry-over`: item `{ introduced: 2700, extinct: null, reintroduced: null, clanDates: { introduced: 2830, extinct: null, reintroduced: null } }` at Y=2790 → `clan` available.
- [ ] **Step 2:** Run `npx vitest run --project unit src/data/tech-dates-availability.test.ts`. Expected: FAIL,
  `getTechDatesAvailability` is not exported.
- [ ] **Step 3:** Implement it in `equipment-registry.ts`, then replace the per-class bodies with wrappers. The
  small-craft `_datesAvailability` copy becomes a call to `getDatesAvailability`, as the fighter's already is.
- [ ] **Step 4:** Route the equipment-list date checks through it. In BattleMech's list builder (about 11140)
  replace the inline `prototypeOnly / inProduction / asPrototype` block with
  `getTechDatesAvailability(item, this.getTech().tag, rulesLevel, ...)`. Do the same in the vehicle, fighter, small
  craft, capital ship and building equipment lists where they check `item.introduced` inline. With no equipment
  record carrying `clanDates` yet, results are unchanged.
- [ ] **Step 5:** Add the fighter test to `src/classes/aerospace-fighter.test.ts`:
  `mixed tech takes the production window`. A mixed-tech fighter, at Experimental level in an era where a heat
  sink's IS dates are prototype-only and its Clan dates are in production, gets it as `available` and not
  `availableAsPrototype`. Build the heat sink fixture inline; don't rely on catalog data.
- [ ] **Step 6:** Run `npx vitest run --project unit src/data src/classes`. Expected: all pass.
- [ ] **Step 7:** Commit: `One tech-dates filter reads Clan dates for every unit and every record (design 2026-10-24 §2)`.

### Task 3: Expansions on the edition timeline

**Files:**
- Modify: `src/data/rules-editions.ts` (`IRulesEdition` about line 66, `editionOrder` at 500, `btRulesExpansions` at
  719, `getRecordOfferIssue` at 550)
- Modify: `src/data/catalog-editions.test.ts` (its `order` helper, line 30)
- Test: `src/data/rules-editions.test.ts`

**Interfaces:**
- Produces:

```ts
/** `month` (1-12) on IRulesEdition and IRulesExpansion: the publication month where the credits page prints one. */
month?: number;

/** Editions and expansions in publication order (year, then month, then editions before expansions in a tie). */
export function getEditionTimeline(): { tag: string; year: number; month?: number; unitTypes: RulesEditionUnitType[]; expansion: boolean }[];

/** Is `tag` an edition or expansion tag a record's `editions` may name? */
export function isKnownEditionTag(tag: string): boolean;

/**
 * The edition or expansion current for `unitType` at a book's publication (design ruling 7): the latest on the
 * timeline covering `unitType` and published no later than `year`/`month`. Undefined before the first.
 */
export function getEditionAtPublication(year: number, month: number | undefined, unitType: RulesEditionUnitType): string | undefined;
```

  `editionOrder(tag)` becomes the tag's index on the timeline. No months are entered this round (round 6 reads them
  from the credits pages), so ordering falls back to the year.

- [ ] **Step 1: Write the failing tests** in `rules-editions.test.ts`:
  - `the timeline puts CityTech between the 1985 and 1987 editions`: `getEditionTimeline().map(e => e.tag)` has
    `citytech` after `battletech-2nd-edition` and before `battletech-manual`.
  - `expansions are known edition tags`: `isKnownEditionTag("citytech")` and `isKnownEditionTag("aerotech-2-revised")` are true; `isKnownEditionTag("nope")` is false.
  - `a 1995 vehicle book belongs to CityTech 2`: `getEditionAtPublication(1995, undefined, "vehicle")` is
    `"citytech-2nd-edition"`. `getEditionAtPublication(2021, 6, "vehicle")` is `"total-warfare"`.
    `getEditionAtPublication(2021, 6, "mech")` is `"battlemech-manual"`.
  - `a dropped expansion record is apocryphal after it`: a record `{ editions: ["citytech"] }` under
    `"total-warfare"` at the Apocryphal level gives `getRecordOfferIssue(...) === null`, and at level 2 gives `"edition"`.
- [ ] **Step 2:** Run `npx vitest run --project unit src/data/rules-editions.test.ts`. Expected: FAIL on the new
  exports.
- [ ] **Step 3:** Implement. `getRecordEditions`' derived path still walks `btRulesEditions` only, since
  expansions are never derived, just listed. Change `catalog-editions.test.ts`'s `order` to use the timeline index so
  an expansion tag is accepted.
- [ ] **Step 4:** Run `npx vitest run --project unit src/data`. Expected: all pass.
- [ ] **Step 5:** Commit: `The pre-Total Warfare expansions count as editions, on one dated timeline (design 2026-10-24 ruling 9, §3)`.

### Task 4: Every catalog in one registry, one standing test

**Files:**
- Create: `src/data/catalog-registry.ts`
- Test: `src/data/catalog-standing.test.ts` (new)

**Interfaces:**
- Consumes: `ICatalogStanding` (Task 1), `isKnownEditionTag` (Task 3), `getEquipmentCatalogDefinitions`.
- Produces:

```ts
export interface ICatalogEntry {
    /** Stable id, e.g. "equipment-energy", "mech-armor", "infantry-weapons". */
    id: string;
    records: ICatalogStanding[];
    custom: boolean;
    /** Rounds 3-5 move the catalog onto the full core; until then its records may lack editions or techBase. */
    pendingStanding?: boolean;
}

/** Every catalog of records that can be given to a unit or a member of one. */
export function getAllCatalogs(): ICatalogEntry[];
```

  It lists the equipment catalog definitions plus every component and unit-type catalog: the eight 'Mech component
  catalogs (with `mechLargeEngineTypes`), infantry weapons, infantry armor, battle armor equipment and armor,
  battle-armor-scale equipment, aerospace armor, support vehicle armor, motive types, chassis modifications, support
  vehicle light weapons, ProtoMech components, sub-capital weapons. Not listed: tonnages and `mechTypeOptions`
  (construction options, not things given to a unit). Mark `pendingStanding: true` on every catalog the existing
  `catalog-editions.test.ts` doesn't already cover.

- [ ] **Step 1: Write the failing tests** in `catalog-standing.test.ts`:
  - `every catalog record has a tag and a name` (all catalogs).
  - `tags are unique within each catalog, counting altTags` (all catalogs; different catalogs may share a tag such
    as `standard`, so the check is per catalog plus across all equipment catalogs together).
  - `every edition tag is known`: `editions`, `editionStats` and `apocryphalIn` keys pass `isKnownEditionTag`
    (all catalogs).
  - `clanDates sit only on IS or universal records`: no `techBase: "clan"` record has `clanDates` (all catalogs).
  - `catalogs on the full core list editions and tech base`: every non-custom, non-pending record has an `editions`
    array and a `techBase` (non-pending catalogs only).
  - `the pending list only shrinks`: the count of `pendingStanding` catalogs is at most the number written in the test
    (today's count). Rounds 3-5 lower it.
- [ ] **Step 2:** Run `npx vitest run --project unit src/data/catalog-standing.test.ts`. Expected: FAIL, the module
  doesn't exist.
- [ ] **Step 3:** Implement `catalog-registry.ts`. If a test fails on today's data (a duplicate tag, an unknown
  edition key), that is a real bug. Fix it in this task with its own RED test and a page cite, per the fix-all-found-bugs rule,
  not by loosening the test.
- [ ] **Step 4:** Run `npx vitest run --project unit src/data`. Expected: all pass.
- [ ] **Step 5:** Commit: `Every catalog in one registry, checked by one standing test (design 2026-10-24 §1)`.

### Task 5: Verify, ship, clean up

- [ ] **Step 1:** `npx vitest run --project unit`. Expected: all pass, file and test counts at or above the baseline.
- [ ] **Step 2:** `npx tsc --noEmit -p .` clean; `npx eslint` on every changed file clean.
- [ ] **Step 3:** Rerun both Task 0 surveys to `bv-after-*` and diff them against `bv-before-*`. Expected: identical
  BV on every row. Any difference stops the round: find the cause before shipping.
- [ ] **Step 4:** `git push origin beta`, `git deploy-beta`. Then fast-forward master in `C:/repo/battletech-tools`
  (`git merge --ff-only`, check it's clean, push).
- [ ] **Step 5:** Report to the user and stop: what shipped, the test counts, the BV diff result, any interface left off
  the core (Task 1 Step 2), and round 2 (twin merge) next.
