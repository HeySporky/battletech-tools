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
  - [x] Remove the Node `engines` pin
  - [x] Move to TypeScript 6
  - [x] Add flat ESLint config
  - [x] Clean up env type files
  - [x] Fix `vite preview` base-path bug
  - [x] Verify build output and SPA fallback
  - [x] Route-by-route SPA smoke test completed against the Vite dev server
  - [x] Chromium workflow test completed for all creator steps and Biped, Quad, Tripod, LAM, and QuadVee chassis types
  - [ ] Decide on a Vitest setup (or explicitly decide not to have tests)
  - [ ] Code-split the large main JS chunk

## Chassis diagram artwork

- [x] Route LAMs through the Biped anatomy diagrams.
- [x] Keep QuadVee on the Quad anatomy diagrams.
- [x] Track and display Tripod center-leg armor and structure interactively.
- [x] Integrate the supplied Tripod-specific SVG layout into the interactive record sheet as broken-apart region arrays for armor, rear armor, internal structure, and damage transfer. Shared center-leg bubble coordinates drive both armor and structure overlays.

## Lint cleanup

- [x] Close all ESLint errors. `npm run lint` exits with 0 errors.
- [ ] Remove the remaining 33 `@typescript-eslint/no-unused-vars` warnings.
- [x] Scope the root lint run away from the nested `battletech-tools` scaffold.
- [x] Replace legacy `@ts-ignore` directives with checked `@ts-expect-error` directives.
- [x] Preserve intentional legacy compatibility patterns in the flat ESLint configuration.

## Distribution and local workspace hygiene

- [x] Review Vite/CRA output ignores and ensure generated build content is not synced.
- [x] Ignore any directory whose name ends in `_DEV` (for example, `workingFiles_DEV`).
