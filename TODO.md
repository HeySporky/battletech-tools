# TODO

## Status of the standard migration TODOs

- [x] Pin Node 20 LTS (superseded: Node 20 went EOL 2026-04-30 - see "Runtime and tooling" below)
- [x] Audit dynamic data registries
- [x] Centralize equipment catalog access
- [x] Add graceful MUL fallback
- [x] Verify build and typecheck
- [x] Add custom equipment catalogs (Rules Level 5)
- [x] Modernize equipment editor (+ GitHub PR contribution flow)
- [x] Populate bundled MUL snapshot (40 verified units from archived MUL API captures)
- [x] Migrate build to Vite
  - [x] Scaffold `vite.config.mts`, root `index.html`, `process.env.PUBLIC_URL` shim
  - [x] Remove `react-scripts`/Jest/`@testing-library/*` (testing-library is back, for Vitest)
  - [x] Add flat ESLint config (`eslint.config.mjs`) since removing react-scripts removed CRA's built-in lint pass
  - [x] Clean up env type files (`react-app-env.d.ts` removed, `vite-env.d.ts` kept)
  - [x] Fix `vite preview` base-path bug (was serving `index.html` for every asset request)
  - [x] Smoke test: build output verified byte-for-byte correct, SPA fallback verified, bundle content verified
  - [x] Route-by-route smoke test - automated in `e2e/smoke.spec.ts` (every top-level route, desktop + mobile)
  - [x] Decide on a Vitest setup - Vitest 5 (unit + browser mode) and Playwright E2E, see README "Testing"
  - [ ] Code-split the ~7.6MB main JS chunk (Vite warns on this; CRA warned on the same thing)

## Runtime and tooling

- [x] Node 26 baseline (`.nvmrc` / `.node-version`); `engines` accepts `^22.22 || ^24 || >=26` (React Router 8 needs 22.22+, Vitest 5 needs 22.12+)
- [x] Commit `package-lock.json`; `npm ci` everywhere, `npm audit` at 0 vulnerabilities
- [x] Vite 8, React 19.3, React Router 8 (`react-router`), fast-xml-parser 5, ESLint 10, typescript-eslint 8.71
- [x] Dual-track TypeScript: `npm run typecheck` uses TS 7 (native) where a binary exists, TS 6.0.3 elsewhere
      (Android/Termux) and for ESLint
- [x] Sass: `@import` -> `@use`, `darken`/`lighten` -> `color.adjust` (no Dart Sass 3 deprecations left)
- [x] CI: ubuntu/windows/macos x Node 22/24/26, plus browser-mode and E2E jobs (`.github/workflows/ci.yml`)
- [ ] Drop the `typescript-7` alias and make TS 7 the only `typescript` once typescript-eslint supports TS >= 6.1
      and TS 7 ships the JS API (or an Android binary) - then remove the fallback in `scripts/typecheck.mjs`
- [ ] Turn `prefer-const` / `no-var` back on after an `eslint --fix` commit (see lint backlog)
- [ ] Add lint back to `npm run check` and make the CI lint job blocking once the backlog below is empty

## Engine bugs found by the new tests

- [x] BV Speed Factor crashed on odd Jump MP (fractional table index; 72 of 508 SSW mechs, and it truncated the
      background SSW import at startup). Fixed with the canonical TM p. 316 formula (MegaMek parity).
      Upstream has a different bug in the same function (wrong formula above 25 MP): branch
      `fix/speed-factor-above-25-mp`, to be offered to HeySporky as an issue + PR.
- [x] `setEngine(0)` logged an error and kept the old engine; 0 now clears it.
- [x] `_allocateCritical` matched by UUID only, so rebuilt items (heat sinks, ...) were never placed: 8,359 failed
      allocations / 4,314 unallocated components across the SSW import. Falls back to tag + rear now (upstream's rule).
- [x] Startup froze the UI for ~6 s (desktop) while importing every SSW mech in one loop; now imported in time slices.
      The same loop exists upstream - candidate for an upstream issue + PR.
- [ ] 50 components stay unallocated after SSW import across 12 mechs (42 jump jets; also heat-sink x3, plasma-rifle,
      heavy-ferro-fibrous, er-small-laser, c3-computer-slave, ecm-suite): ANH-3A Annihilator, AWS-10KM Awesome,
      CTF-5D Cataphract, CGR-KMZ Charger, CLNT-6S Clint, FS9-B Firestarter, JR7-C2 Jenner, CRK-5003-CJ Katana (Crockett),
      PNT-14S Panther, WTH-3 / WTH-K Whitworth, "Grinner" Wolfhound IIC. Compare their SSW placements with MegaMek.
- [ ] Firefly C: the SSW import drops the Clan SRM-2 launcher ("(CL) SRM-2") and maps its ammo to `ammo-srm-2`; a
      JSON save/load then drops that ammo too (not found in the Clan equipment list).
- [ ] BV differs from SSW's BV2 figure for many bundled mechs (221 of 508 exact) - reportedly addressed on the MUL
      branch; re-check `battlemech.test.ts` against SSW BV once that lands.

## Chassis diagram artwork (src/ui/components/svg)

Reviewed `battlemech-svg.tsx`'s Biped/Quad record-sheet diagram dispatch. Findings:

- Biped and Quad each have full hand-drawn SVG diagram sets (armor, rear armor, internal
  structure, damage transfer, armor circles) - these are original recreations of the record
  sheet layout, not licensed art assets.
- **Bug fixed**: the dispatch was a literal `getMechType().tag === "biped"` check, so LAM
  (tag `lam`) was silently falling through to the Quad diagrams/labels, which is wrong - LAMs
  are biped-anatomy (arms, two legs). Replaced with a `hasArms` boolean
  (`!isQuad() && !isQuadVee()`) applied consistently across all 7 branch points (armor,
  internal structure, damage transfer diagrams, and the 4 arm/leg crit-table labels).
- **QuadVee** correctly reuses the Quad diagram set - it has the same 4-leg, no-arm anatomy as
  Quad, so no separate art is needed there.
- **Tripod has no dedicated diagram at all.** It's structurally closest to Biped (has arms,
  two normal legs) but also has an extra Center Leg location that neither the Biped nor Quad
  silhouette has a slot for. Tripod now uses the Biped diagram (via `hasArms`) as the closest
  available approximation, plus a supplemental "CENTER LEG [n]" text readout added to both the
  Armor and Internal Structure boxes so that data (already fully tracked in `battlemech.ts` -
  `getArmorAllocation().centerLeg` / `getInternalStructure().centerLeg`) isn't silently hidden.
  This is a **stopgap, not real Tripod artwork**.
- [ ] Finish full Tripod-specific SVG silhouettes (armor, rear armor, internal structure, and
  damage transfer) matching the archived BattleTech Engineer reference. Interactive Center
  Leg armor and structure pips are now wired; the remaining gap is visual silhouette art.

## Lint cleanup backlog (71 problems: 40 errors, 31 warnings)

Generated from `npm run lint` (ESLint 10 + typescript-eslint 8.71). CI runs lint as a non-blocking job and
`npm run check` leaves it out until this list is empty; then add lint back to both. Rule breakdown:

| Count | Rule |
|------:|------|
| 31 | `@typescript-eslint/no-unused-vars` |
| 31 | `@typescript-eslint/ban-ts-comment` |
| 8 | `no-useless-escape` |
| 1 | `@typescript-eslint/no-duplicate-enum-values` |

`prefer-const` (~790 hits) and `no-var` (~20) are switched off in `eslint.config.mjs` for now; both are
auto-fixable (`npx eslint . --fix --rule 'prefer-const: error' --rule 'no-var: error'`) and deserve their own
reviewable commit before being turned back on.

None of these come from the modernization work - they are pre-existing code health items. File by file:

### src/bin/convert-ssw-to-bttools.ts

- [ ] L7:10 `warning` **@typescript-eslint/no-unused-vars** - 'convertSSWToJeffBattleTechTools' is defined but never used.

### src/bin/ssw-equipment-checker.ts

- [ ] L19:9 `warning` **@typescript-eslint/no-unused-vars** - 'ammunitionDataSSW' is assigned a value but never used.
- [ ] L20:9 `warning` **@typescript-eslint/no-unused-vars** - 'equipmentDataSSW' is assigned a value but never used.
- [ ] L21:9 `warning` **@typescript-eslint/no-unused-vars** - 'weaponsDataSSW' is assigned a value but never used.
- [ ] L22:9 `warning` **@typescript-eslint/no-unused-vars** - 'physicalsDataSSW' is assigned a value but never used.

### src/classes/battlemech.ts

- [ ] L1135:95 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1135:109 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1139:96 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1139:110 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1144:96 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1144:110 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1148:91 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1148:105 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L3382:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L4775:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L4777:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L4789:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L4791:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L4855:18 `warning` **@typescript-eslint/no-unused-vars** - 'err' is defined but never used.
- [ ] L5835:15 `warning` **@typescript-eslint/no-unused-vars** - 'typeTag' is assigned a value but never used.
- [ ] L6933:30 `warning` **@typescript-eslint/no-unused-vars** - 'hsIndex' is defined but never used. Allowed unused args must match /^_/u.

### src/data/alpha-strike-special-abilities.ts

- [ ] L3:5 `error` **@typescript-eslint/no-duplicate-enum-values** - Duplicate enum member value 1.

### src/data/data-interfaces.ts

- [ ] L1:10 `warning` **@typescript-eslint/no-unused-vars** - 'string' is defined but never used.

### src/data/formation-bonuses.ts

- [ ] L33:13 `warning` **@typescript-eslint/no-unused-vars** - 'group' is defined but never used. Allowed unused args must match /^_/u.

### src/data/mech-internal-structure-types.ts

- [ ] L65:3 `warning` **@typescript-eslint/no-unused-vars** - 'rulesLevel' is assigned a value but never used. Allowed unused args must match /^_/u.

### src/jdgAnalytics.ts

- [ ] L3:5 `warning` **@typescript-eslint/no-unused-vars** - 'appSessionID' is assigned a value but never used. Allowed unused args must match /^_/u.
- [ ] L4:5 `warning` **@typescript-eslint/no-unused-vars** - 'appVersion' is assigned a value but never used. Allowed unused args must match /^_/u.

### src/ui/app-router.tsx

- [ ] L28:36 `warning` **@typescript-eslint/no-unused-vars** - 'IAlphaStrikeMPDeploymentSet' is defined but never used.
- [ ] L108:45 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used. Allowed unused args must match /^_/u.
- [ ] L113:44 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used. Allowed unused args must match /^_/u.

### src/ui/components/critical-allocation-section.tsx

- [ ] L103:33 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.

### src/ui/components/form_elements/input_checkbox.tsx

- [ ] L12:18 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used. Allowed unused args must match /^_/u.

### src/ui/components/form_elements/input_numeric.tsx

- [ ] L11:13 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L19:13 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L37:13 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.

### src/ui/components/svg/alpha-strike-unit-svg.tsx

- [ ] L622:45 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L659:45 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L878:91 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.
- [ ] L880:39 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.

### src/ui/components/svg/record-sheet-equipment-table.tsx

- [ ] L128:47 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.
- [ ] L203:33 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L206:33 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.

### src/ui/pages/alpha-strike/roster/home.tsx

- [ ] L246:23 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.

### src/ui/pages/classic-battletech/mech-creator/home.tsx

- [ ] L32:23 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.

### src/ui/pages/classic-battletech/mech-creator/step6.tsx

- [ ] L463:52 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used. Allowed unused args must match /^_/u.
- [ ] L469:52 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used. Allowed unused args must match /^_/u.
- [ ] L551:52 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used. Allowed unused args must match /^_/u.
- [ ] L557:52 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used. Allowed unused args must match /^_/u.

### src/ui/pages/classic-battletech/roster/_criticalHitTable.tsx

- [ ] L69:47 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.

### src/ui/pages/classic-battletech/roster/home.tsx

- [ ] L141:23 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.

### src/ui/pages/classic-battletech/roster/play.tsx

- [ ] L1152:7 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1154:7 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1156:7 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1158:7 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1245:19 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1257:18 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1267:18 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1283:18 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2592:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2594:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2596:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2598:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2739:41 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.
- [ ] L2748:43 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.

### src/ui/pages/settings/backup-and-restore.tsx

- [ ] L127:23 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used. Allowed unused args must match /^_/u.

### src/utils.ts

- [ ] L703:9 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L749:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L751:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L777:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L781:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.

### src/utils/replaceAll.ts

- [ ] L17:9 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
