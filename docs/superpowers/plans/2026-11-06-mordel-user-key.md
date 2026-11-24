# Mordel.net user key Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users save their mordel.net API key, pick units from a shipped Mordel list (or their own designs), and add
them to Alpha Strike or Classic rosters or load them into the 'Mech designer.

**Architecture:** A key store and browser client in `src/utils/mordel/`, reusing `tools/mordel-sync/mordel-client.mjs`.
Converters turn a Mordel detail into an `IASMULUnit` (Alpha Strike), MegaMek `.mtf` text ('Mechs) or `.blk` text
(vehicles, ProtoMechs), fed to the importers the app already has. One `MordelUnitsPanel` component is plugged into
three pages. A Node script builds the shipped list from the sync mirror.

**Tech Stack:** React 19 class/function components, TypeScript, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-06-mordel-user-key-design.md`

**Execution:** native (executing-plans), one Opus whole-branch review at the end. The owner chose this flow before
going to bed.

## Global Constraints

- The key is sent only in the `X-API-Key` header; never in a URL, log line, error text, backup, export or the repo.
- Key storage: localStorage `mordelApiKey`, not AppSettings.
- No push, merge or deploy. The list data commit stays local.
- Tests use the Dola DOL-1A2 (canon, bm 23454, BV 826) or made-up units; no member designs in fixtures.
- `npm run typecheck`, `npm run lint`, `npm test` pass at the end of every task.

## Review Focus

- A 401 mid-use (revoked key): the panel must say the key was rejected, not show a generic error. Test in Task 1.
- No CORS in production builds: a network `TypeError` must read "mordel.net does not allow this site yet", not crash.
  Test in Task 1.
- A detail whose equipment the catalog can't find: the unit is still added with a warning listing the names. Test in
  Task 4.
- Mordel damage "0*" (minimal damage): must set the `...Min` flags, not become 0. Test in Task 2.
- A unit the list has but the API 404s (removed or private): hidden on this device with a note. Test in Task 6.

---

### Task 1: Key store, browser client, settings section, dev proxy

**Files:**
- Modify: `tools/mordel-sync/mordel-client.mjs` (omit `User-Agent` when `userAgent` is absent)
- Create: `src/utils/mordel/mordel-key.ts`, `src/utils/mordel/mordel-api.ts`, `src/utils/mordel/mordel-api.test.ts`
- Create: `src/ui/pages/settings/_mordel-key-settings.tsx`; Modify: `src/ui/pages/settings/home.tsx`
- Modify: `vite.config.ts` (proxies `/mordel-api` → `https://mordel.net/api/v1`, `/mordel-sandbox-api` →
  `https://sandbox.mordel.net/api/v1`)

**Interfaces (produces):**
- `getMordelKey(): string | null`, `saveMordelKey(key: string): void`, `removeMordelKey(): void`
- `getMordelServer(): "production" | "sandbox"`, `setMordelServer(s)`; `mordelBaseUrl(dev: boolean): string`
- `class MordelKeyError extends Error` (no key / rejected), `class MordelUnavailableError extends Error`
- `testMordelKey(key: string, fetchImpl?): Promise<"ok" | "rejected" | "unavailable">`
- `fetchMordelDetail(type: MordelType, id: number, opts?: { updated?: number | null; fetchImpl? }): Promise<IMordelDetail | null>` (cache `mordelDetailCache`, newest 50)
- `fetchMordelListSince(since: number, fetchImpl?): Promise<IMordelListRow[]>`
- Types `MordelType = "bm" | "cv" | "im" | "pm"`, `IMordelDetail`, `IMordelListRow` in `src/utils/mordel/mordel-types.ts`

- [ ] Tests: header carries the key and no `User-Agent`; URL never contains the key; 401 → `MordelKeyError` and
  `testMordelKey` → "rejected"; fetch `TypeError` → `MordelUnavailableError`; cache returns the cached copy for the
  same stamp and refetches for a newer one; cache keeps 50; `getFullBackup` output has no `mordelApiKey`.
- [ ] Implement; settings section shows saved state as `••••` + last 4, Save/Test/Remove, server select when the
  developer menu is on.
- [ ] Run tests, typecheck, lint; commit `feat(mordel): user API key in settings and browser client`.

### Task 2: Alpha Strike conversion

**Files:** Create `src/utils/mordel/mordel-alpha-strike.ts` + test. Modify `src/classes/alpha-strike-unit.ts`
(`MULSource` gains `"mordel"`).

**Interfaces:** `mordelToASMULUnit(row: IMordelListRow | IMordelDetail): IASMULUnit | null` (null without an
`alpha_strike` block). `Id` = Mordel id, `MulSource` "mordel", `BFAbilities` = specials joined by ",", damage "0*" →
`BFDamageXMin: true` with value 0, `Role.Name` = role, `Technology.Name` = tech base, `Name`/`Variant` from
`name_parts` (fallback: whole name).

- [ ] Tests with the Dola: importMUL gives size 1, move 16"j, armor 3, structure 1, damage 1/1/0, PV 22, abilities
  ENE, MEL, TAG, role Scout. A "0*" damage sets the minimal flag.
- [ ] Implement, test, commit `feat(mordel): Alpha Strike unit from a Mordel row`.

### Task 3: Shipped list and loader

**Files:** Create `tools/mordel-sync/build-mordel-list.mjs` (+ `tools/mordel-sync/mordel-list-rows.mjs` pure
helpers, tested from `src/utils/mordelList.test.ts`); output `src/data/mordel/mordel_{type}_{n}.json` (2,000 rows a
chunk) and `tools/mordel-sync/canon-mismatch-report.json`. Create `src/data/mordel-list.ts`.

**Interfaces:**
- `listRowOf(detail): IMordelListRow` (fields per spec), `canonMatch(detail, mulIndex): { record, diffs: string[] } | null`
- `loadMordelList(): Promise<IMordelListRow[]>` (shipped chunks + device top-up rows from `mordelListTopUp`, deduped
  by `type/id`, newest `updated` wins, hidden ids removed); `hideMordelUnit(key)`; `topUpMordelList(fetchImpl?)`.

- [ ] Tests: row fields; a canon unit equal to its MUL record on BV/PV/size/move/armor/structure/damage is dropped;
  one differing on BV is kept and reported with `"BV 826 vs 830"`; match by `mul_id` via the legacy archive, fallback
  by chassis/model/tons.
- [ ] Implement, run the script on the mirror, record counts in the plan's notes; commit the script and tests
  (`feat(mordel): shipped list builder`) and the data in a separate commit marked LOCAL ONLY.

### Task 4: 'Mech conversion (bm, im)

**Files:** Create `src/utils/mordel/mordel-mtf.ts` + test.

**Interfaces:** `mordelToMtf(detail: IMordelDetail): { text: string; notes: string[] }`;
`importMordelMech(detail): { mech: BattleMech | null; issues: string[]; bvOk: boolean; ourBV: number }`.

- Header from engine/heat sinks/structure/armor/cockpit/gyro/myomer/configuration; slots: fixed parts in standard
  places, all actuators kept unless the arm overflows (hand, then lower arm), equipment in Mordel's order, dynamic
  armor/structure slots filled into empties (arms and legs first). Equipment names: heat sinks, jump jets, TSM,
  Artemis, ammo written in MegaMek form; everything else resolved with `findImportedEquipment` by the item's own
  technology and written as the catalog tag.
- [ ] Tests: the Dola converts with no issues and our BV = 826. A made-up unknown item gives an issue naming it and
  `bvOk` false.
- [ ] Harness (scratchpad, not committed): run over the mirror's canon bm/im, report issue and BV-match rates; fix the
  largest mapping gaps.
- [ ] Commit `feat(mordel): 'Mech import from Mordel details`.

### Task 5: Vehicles and ProtoMechs (cv, pm)

**Files:** Create `src/utils/mordel/mordel-blk.ts` + test.

**Interfaces:** `importMordelBlk(detail): { unit: Vehicle | ProtoMech | null; kind: "vehicle" | "protomech"; issues: string[]; bvOk: boolean }`
via `importBlkUnit`.

- [ ] Tests on a made-up tracked tank and a made-up ProtoMech; harness rate over the mirror canon cv/pm.
- [ ] Commit `feat(mordel): vehicle and ProtoMech import`. If out of time: the panel says "Classic import not ready"
  for these types.

### Task 6: Panel and wiring

**Files:** Create `src/ui/components/mordel-units-panel.tsx` (+ `.test.tsx`). Modify
`src/ui/pages/alpha-strike/roster/_AddUnitsPage.tsx`, `src/ui/pages/classic-battletech/roster/_addMechDialog.tsx`,
`src/ui/pages/classic-battletech/mech-creator/imports.tsx`.

**Interfaces:** `<MordelUnitsPanel mode="alpha-strike" | "classic" | "designer" onAddAS? onAddMech? onAddVehicle? onAddProtoMech? />`.
Tabs: "Mordel.net units" (list search) and "My Mordel designs" (`MORDEL_MY_UNITS_PATH` + paste a link or `type/id`).

- [ ] Tests: search filters by name/model; no key → link to settings; rejected key → message; 404 → unit hidden with
  a note; BV mismatch → warning shown and unit still added.
- [ ] Commit `feat(mordel): Mordel units panel in rosters and designer`.

### Task 7: Whole-branch review

- [ ] `npm run check`; one Opus review of the branch; fix every finding; update handoff and the mapping doc's
  questions for Scott.
