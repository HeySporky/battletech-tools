# TODO

## Status of the standard migration TODOs

- [x] Pin Node 20 LTS (later removed once react-scripts was gone - see below)
- [x] Audit dynamic data registries
- [x] Centralize equipment catalog access
- [x] Add graceful MUL fallback
- [x] Verify build and typecheck
- [x] Add custom equipment catalogs (Rules Level 5)
- [x] Modernize equipment editor (+ GitHub PR contribution flow)
- [x] Populate bundled MUL snapshot (40 verified units from archived MUL API captures)
- [x] Migrate build to Vite
  - [x] Scaffold `vite.config.mts`, root `index.html`, `process.env.PUBLIC_URL` shim
  - [x] Remove `react-scripts`/Jest/`@testing-library/*`
  - [x] Remove the Node `engines` pin (no longer needed once react-scripts/webpack was gone)
  - [x] Move to latest widely-supported TypeScript (6.0.3 - TS7 is too new for `typescript-eslint` as of this writing)
  - [x] Add flat ESLint config (`eslint.config.mjs`) since removing react-scripts removed CRA's built-in lint pass
  - [x] Clean up env type files (`react-app-env.d.ts` removed, `vite-env.d.ts` kept)
  - [x] Fix `vite preview` base-path bug (was serving `index.html` for every asset request)
  - [x] Smoke test: build output verified byte-for-byte correct, SPA fallback verified, bundle content verified
  - [ ] Full manual/browser route-by-route smoke test (build-level smoke test only done so far)
  - [ ] Decide on a Vitest setup (or explicitly decide not to have tests) now that Jest is gone
  - [ ] Code-split the ~7.6MB main JS chunk (Vite warns on this; CRA warned on the same thing)

## Lint cleanup backlog (191 problems: 160 errors, 31 warnings)

Generated via `npm run lint` on the `vite-migration` branch. Rule breakdown:

| Count | Rule |
|------:|------|
| 56 | `@typescript-eslint/no-empty-object-type` |
| 41 | `no-useless-assignment` |
| 31 | `@typescript-eslint/no-unused-vars` |
| 31 | `@typescript-eslint/ban-ts-comment` |
| 13 | `no-empty` |
| 8 | `no-useless-escape` |
| 6 | `@typescript-eslint/no-unsafe-function-type` |
| 4 | `@typescript-eslint/no-require-imports` |
| 1 | `@typescript-eslint/no-duplicate-enum-values` |

None of these were fixed as part of the Vite/TS6 migration - they're pre-existing code health items surfaced by the new lint tooling now that CRA's bundled ESLint pass is gone. Tracked here for a future dedicated pass, file by file:

### src/bin/convert-ssw-to-bttools.ts

- [ ] L7:10 `warning` **@typescript-eslint/no-unused-vars** - 'convertSSWToJeffBattleTechTools' is defined but never used.

### src/bin/ssw-equipment-checker.ts

- [ ] L19:9 `warning` **@typescript-eslint/no-unused-vars** - 'ammunitionDataSSW' is assigned a value but never used.
- [ ] L20:9 `warning` **@typescript-eslint/no-unused-vars** - 'equipmentDataSSW' is assigned a value but never used.
- [ ] L21:9 `warning` **@typescript-eslint/no-unused-vars** - 'weaponsDataSSW' is assigned a value but never used.
- [ ] L22:9 `warning` **@typescript-eslint/no-unused-vars** - 'physicalsDataSSW' is assigned a value but never used.

### src/classes/alpha-strike-unit.ts

- [ ] L366:17 `error` **no-useless-assignment** - The value assigned to 'tmpMoveObj' is not used in subsequent statements.
- [ ] L985:13 `error` **no-useless-assignment** - The value assigned to 'pvDifference' is not used in subsequent statements.
- [ ] L1359:17 `error` **no-useless-assignment** - The value assigned to 'tmpTMM' is not used in subsequent statements.
- [ ] L2008:13 `error` **no-useless-assignment** - The value assigned to 'bestMovement' is not used in subsequent statements.

### src/classes/battlemech.ts

- [ ] L21:23 `error` **@typescript-eslint/no-require-imports** - A `require()` style import is forbidden.
- [ ] L550:13 `error` **no-useless-assignment** - The value assigned to 'engineModifier' is not used in subsequent statements.
- [ ] L1170:95 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1170:109 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1174:96 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1174:110 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1179:96 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1179:110 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1183:91 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1183:105 `error` **no-useless-escape** - Unnecessary escape character: \".
- [ ] L1553:17 `error` **no-useless-assignment** - The value assigned to 'structurePoints' is not used in subsequent statements.
- [ ] L1575:13 `error` **no-useless-assignment** - The value assigned to 'structurePoints' is not used in subsequent statements.
- [ ] L1612:13 `error` **no-useless-assignment** - The value assigned to 'structurePoints' is not used in subsequent statements.
- [ ] L1634:13 `error` **no-useless-assignment** - The value assigned to 'structurePoints' is not used in subsequent statements.
- [ ] L1965:13 `error` **no-useless-assignment** - The value assigned to 'heat_damage_long' is not used in subsequent statements.
- [ ] L1966:13 `error` **no-useless-assignment** - The value assigned to 'heat_damage_extreme' is not used in subsequent statements.
- [ ] L2193:13 `error` **no-useless-assignment** - The value assigned to 'col3Padding' is not used in subsequent statements.
- [ ] L2194:13 `error` **no-useless-assignment** - The value assigned to 'col4Padding' is not used in subsequent statements.
- [ ] L2245:9 `error` **no-useless-assignment** - The value assigned to 'col4Padding' is not used in subsequent statements.
- [ ] L2425:21 `error` **no-useless-assignment** - The value assigned to 'areaWeight' is not used in subsequent statements.
- [ ] L2457:17 `error` **no-useless-assignment** - The value assigned to 'areaWeight' is not used in subsequent statements.
- [ ] L2612:13 `error` **no-useless-assignment** - The value assigned to 'singleJJWeight' is not used in subsequent statements.
- [ ] L3417:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L3434:13 `error` **no-useless-assignment** - The value assigned to 'hs_nickname' is not used in subsequent statements.
- [ ] L4804:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L4806:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L4818:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L4820:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L4875:13 `error` **no-useless-assignment** - The value assigned to 'importObject' is not used in subsequent statements.
- [ ] L4884:18 `warning` **@typescript-eslint/no-unused-vars** - 'err' is defined but never used.
- [ ] L5864:15 `warning` **@typescript-eslint/no-unused-vars** - 'typeTag' is assigned a value but never used.
- [ ] L6962:30 `warning` **@typescript-eslint/no-unused-vars** - 'hsIndex' is defined but never used.
- [ ] L7677:13 `error` **no-useless-assignment** - The value assigned to 'itemName' is not used in subsequent statements.
- [ ] L7844:45 `error` **no-empty** - Empty block statement.
- [ ] L7847:50 `error` **no-empty** - Empty block statement.
- [ ] L7850:43 `error` **no-empty** - Empty block statement.
- [ ] L8003:54 `error` **no-empty** - Empty block statement.
- [ ] L8183:50 `error` **no-empty** - Empty block statement.
- [ ] L8187:52 `error` **no-empty** - Empty block statement.
- [ ] L8408:78 `error` **no-empty** - Empty block statement.

### src/data/alpha-strike-special-abilities.ts

- [ ] L3:5 `error` **@typescript-eslint/no-duplicate-enum-values** - Duplicate enum member value 1.

### src/data/data-interfaces.ts

- [ ] L1:10 `warning` **@typescript-eslint/no-unused-vars** - 'string' is defined but never used.

### src/data/formation-bonuses.ts

- [ ] L33:13 `warning` **@typescript-eslint/no-unused-vars** - 'group' is defined but never used.

### src/data/mech-internal-structure-types.ts

- [ ] L65:3 `warning` **@typescript-eslint/no-unused-vars** - 'rulesLevel' is assigned a value but never used.

### src/jdgAnalytics.ts

- [ ] L3:5 `warning` **@typescript-eslint/no-unused-vars** - 'appSessionID' is assigned a value but never used.
- [ ] L4:5 `warning` **@typescript-eslint/no-unused-vars** - 'appVersion' is assigned a value but never used.

### src/ui/app-router.tsx

- [ ] L28:36 `warning` **@typescript-eslint/no-unused-vars** - 'IAlphaStrikeMPDeploymentSet' is defined but never used.
- [ ] L32:13 `error` **@typescript-eslint/no-require-imports** - A `require()` style import is forbidden.
- [ ] L109:45 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used.
- [ ] L114:44 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used.
- [ ] L486:26 `error` **@typescript-eslint/no-unsafe-function-type** - The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type.
- [ ] L606:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.
- [ ] L627:27 `error` **@typescript-eslint/no-unsafe-function-type** - The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type.
- [ ] L640:26 `error` **@typescript-eslint/no-unsafe-function-type** - The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type.

### src/ui/classes/alerts.ts

- [ ] L13:22 `error` **@typescript-eslint/no-unsafe-function-type** - The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type.
- [ ] L48:46 `error` **@typescript-eslint/no-unsafe-function-type** - The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type.
- [ ] L77:26 `error` **@typescript-eslint/no-unsafe-function-type** - The `Function` type accepts any function-like value. Prefer explicitly defining any function parameters and return type.

### src/ui/components/alpha-strike-equipment-entry.tsx

- [ ] L164:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/battletech-logo.tsx

- [ ] L6:13 `error` **no-useless-assignment** - The value assigned to 'width' is not used in subsequent statements.
- [ ] L7:13 `error` **no-useless-assignment** - The value assigned to 'height' is not used in subsequent statements.
- [ ] L8:13 `error` **no-useless-assignment** - The value assigned to 'xLoc' is not used in subsequent statements.
- [ ] L9:13 `error` **no-useless-assignment** - The value assigned to 'yLoc' is not used in subsequent statements.
- [ ] L96:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/critical-allocation-section.tsx

- [ ] L41:17 `error` **no-useless-assignment** - The value assigned to 'critIndexAdjust' is not used in subsequent statements.
- [ ] L103:33 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.

### src/ui/components/critical-entry.tsx

- [ ] L15:13 `error` **no-useless-assignment** - The value assigned to 'valueCriticalDivisor' is not used in subsequent statements.
- [ ] L197:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/damage-input.tsx

- [ ] L385:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/form_elements/input_checkbox.tsx

- [ ] L11:18 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used.
- [ ] L98:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/form_elements/input_numeric.tsx

- [ ] L9:13 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L17:13 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L35:13 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L188:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/form_elements/textarea_field.tsx

- [ ] L50:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/mech-creator-side-menu.tsx

- [ ] L110:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/mech-creator-status-bar.tsx

- [ ] L37:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/range-input.tsx

- [ ] L181:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/sanitized-html.tsx

- [ ] L3:20 `error` **@typescript-eslint/no-require-imports** - A `require()` style import is forbidden.
- [ ] L92:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/standard-modal.tsx

- [ ] L184:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/stat-bar.tsx

- [ ] L58:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/alpha-strike-print-unit.tsx

- [ ] L532:26 `error` **no-useless-assignment** - The value assigned to 'critLineStart' is not used in subsequent statements.

### src/ui/components/svg/alpha-strike-unit-svg.tsx

- [ ] L622:45 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L659:45 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L878:91 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.
- [ ] L880:39 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.

### src/ui/components/svg/alpha-strike-unit-token.tsx

- [ ] L55:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/battlemech-armor-biped.svg.tsx

- [ ] L28:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/battlemech-heat-effects-box-svg.tsx

- [ ] L139:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/battlemech-svg.tsx

- [ ] L1877:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/biped-armor-circles.tsx

- [ ] L563:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/biped-armor-diagram.tsx

- [ ] L98:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/biped-damage-transfer-diagram-svg.tsx

- [ ] L93:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/biped-internal-structure-diagram-svg.tsx

- [ ] L87:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/biped-rear-armor-diagram-svg.tsx

- [ ] L93:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/component-damage-svg.tsx

- [ ] L225:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/crit-allocation-table-svg.tsx

- [ ] L37:13 `error` **no-useless-assignment** - The value assigned to 'boxHeight' is not used in subsequent statements.
- [ ] L176:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/damage-circle-svg.tsx

- [ ] L92:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/die-svg.tsx

- [ ] L383:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/heat-sink-svg.tsx

- [ ] L647:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/heat-track-svg.tsx

- [ ] L36:13 `error` **no-useless-assignment** - The value assigned to 'boxBG' is not used in subsequent statements.
- [ ] L210:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/pilot-hit-track-svg.tsx

- [ ] L181:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/quad-armor-circles.tsx

- [ ] L568:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/quad-armor-diagram-svg.tsx

- [ ] L90:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/quad-damage-transfer-diagram-svg.tsx

- [ ] L93:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/quad-internal-structure-damage-svg.tsx

- [ ] L88:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/quad-rear-armor-diagram-svg.tsx

- [ ] L94:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/record-sheet-equipment-table.tsx

- [ ] L75:13 `error` **no-useless-assignment** - The value assigned to 'rearDesignation' is not used in subsequent statements.
- [ ] L128:47 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.
- [ ] L203:33 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L206:33 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L304:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/record-sheet-gator-table.tsx

- [ ] L185:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/record-sheet-group-box-svg.tsx

- [ ] L128:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/svg-group-options.tsx

- [ ] L61:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/take-damage-button.tsx

- [ ] L57:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/svg/target-select-svg.tsx

- [ ] L60:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/to-hit-table.tsx

- [ ] L196:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/components/unallocated-equipment-list.tsx

- [ ] L62:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/about.tsx

- [ ] L95:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/alpha-strike/_router.tsx

- [ ] L45:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/alpha-strike/roster/_router.tsx

- [ ] L47:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/alpha-strike/roster/_toggleRulerHexes.tsx

- [ ] L46:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/alpha-strike/roster/home.tsx

- [ ] L246:23 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.

### src/ui/pages/alpha-strike/unit-creator/_router.tsx

- [ ] L46:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/alpha-strike/unit-creator/home.tsx

- [ ] L31:19 `error` **no-empty** - Empty block statement.

### src/ui/pages/classic-battletech/_router.tsx

- [ ] L47:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/classic-battletech/mech-creator/_router.tsx

- [ ] L105:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/classic-battletech/mech-creator/home.tsx

- [ ] L32:23 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.
- [ ] L49:15 `error` **no-empty** - Empty block statement.
- [ ] L132:13 `error` **no-useless-assignment** - The value assigned to 'currentBattleMech' is not used in subsequent statements.

### src/ui/pages/classic-battletech/mech-creator/imports.tsx

- [ ] L145:13 `error` **no-useless-assignment** - The value assigned to 'currentBattleMech' is not used in subsequent statements.

### src/ui/pages/classic-battletech/mech-creator/step6.tsx

- [ ] L211:17 `error` **no-useless-assignment** - The value assigned to 'selectedItemName' is not used in subsequent statements.
- [ ] L227:19 `error` **no-useless-assignment** - The value assigned to 'selectedItemName' is not used in subsequent statements.
- [ ] L231:19 `error` **no-useless-assignment** - The value assigned to 'selectedItemName' is not used in subsequent statements.
- [ ] L463:52 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used.
- [ ] L469:52 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used.
- [ ] L551:52 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used.
- [ ] L557:52 `warning` **@typescript-eslint/no-unused-vars** - 'event' is defined but never used.

### src/ui/pages/classic-battletech/roster/_criticalHitTable.tsx

- [ ] L31:25 `error` **no-useless-assignment** - The value assigned to 'crit' is not used in subsequent statements.
- [ ] L68:47 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.
- [ ] L119:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/classic-battletech/roster/_router.tsx

- [ ] L47:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/classic-battletech/roster/home.tsx

- [ ] L141:23 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.

### src/ui/pages/classic-battletech/roster/play.tsx

- [ ] L969:11 `error` **no-useless-assignment** - The value assigned to 'currentBM' is not used in subsequent statements.
- [ ] L1153:7 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1155:7 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1157:7 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1159:7 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1246:19 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1258:18 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1268:18 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L1284:18 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2593:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2595:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2597:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2599:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L2740:41 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.
- [ ] L2749:43 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.

### src/ui/pages/development-status.tsx

- [ ] L127:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/equipment-editor.tsx

- [ ] L31:13 `error` **no-useless-assignment** - The value assigned to 'currentListData' is not used in subsequent statements.

### src/ui/pages/game-management/_router.tsx

- [ ] L39:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/game-management/match-play/_router.tsx

- [ ] L34:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/settings/_router.tsx

- [ ] L40:11 `error` **@typescript-eslint/no-empty-object-type** - An empty interface declaration allows any non-nullish value, including literals like `0` and `""`.

### src/ui/pages/settings/backup-and-restore.tsx

- [ ] L127:23 `warning` **@typescript-eslint/no-unused-vars** - 'e' is defined but never used.
- [ ] L171:15 `error` **no-empty** - Empty block statement.

### src/utils.ts

- [ ] L703:9 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L749:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L751:17 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L777:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
- [ ] L780:25 `error` **no-useless-assignment** - The value assigned to 'minRange' is not used in subsequent statements.
- [ ] L781:21 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.

### src/utils/calculateAlphaStrikeValue.ts

- [ ] L124:13 `error` **no-useless-assignment** - The value assigned to 'bestMovement' is not used in subsequent statements.
- [ ] L149:13 `error` **no-useless-assignment** - The value assigned to 'highestDamage' is not used in subsequent statements.

### src/utils/getSSWXMLBasicInfo.ts

- [ ] L3:23 `error` **@typescript-eslint/no-require-imports** - A `require()` style import is forbidden.
- [ ] L66:41 `error` **no-empty** - Empty block statement.
- [ ] L69:46 `error` **no-empty** - Empty block statement.
- [ ] L72:39 `error` **no-empty** - Empty block statement.

### src/utils/replaceAll.ts

- [ ] L17:9 `error` **@typescript-eslint/ban-ts-comment** - Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.
