# Unit Image Implementation Plan (#95)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An uploaded unit picture, stored shrunk in the design, shown on every record sheet layout, the TRO and the Alpha Strike card.

**Architecture:** The image lives on `TechnicalReadout` (shared by every unit class), is resized in `src/utils/unit-image.ts`, uploaded from the shared creator TRO step, drawn by one `UnitImageSVG` in each sheet layout's free area, and copied into `AlphaStrikeUnit.imageURL` by each conversion.

**Tech Stack:** TypeScript, React, SVG, Canvas (`createImageBitmap`, `OffscreenCanvas` or `<canvas>`), Vitest with happy-dom.

**Spec:** `docs/superpowers/specs/2026-11-22-unit-image-design.md`

## Global Constraints

- Max 400 px long side; WebP 0.8, else JPEG 0.8. Over 80 KB, retry once at 0.6, then reject with the spec's exact message.
- `data:` URLs allowed only for `image/png`, `image/jpeg` and `image/webp` with base64. Never SVG.
- No sheet moves its other content. The image covers no printed element.
- No apostrophes in Bash commands or heredocs. Run vitest from PowerShell.

## Review Focus

- A design saved before this change (no `tro.image`) loads and prints exactly as before. Pin it with the existing sheet snapshots, which must not change.
- A hand-edited design whose `tro.image` is `data:image/svg+xml,...` or `javascript:`: dropped on load, never rendered.
- A very tall or very wide picture fits its slot without distortion (`meet`) and without spilling over.
- Backup and restore, plus design export and import, keep the image byte for byte.
- An Alpha Strike unit made from a design with no image keeps the MUL picture it already had.

---

### Task 1: Storage and the safe check

**Files:** Modify `src/classes/technical-readout.ts`, `src/data/technical-readout-interfaces.ts:33-40`, `src/utils/safeImageURL.ts`. Test: `src/classes/technical-readout.test.ts` (create if missing) and `src/utils/safeImageURL.test.ts`.

**Interfaces (produces):** `ITechnicalReadoutExport.image?: string`, `TechnicalReadout.getImage(): string`, `TechnicalReadout.setImage(dataUrl: string): void`, `isSafeImageDataURL(url: string): boolean` (exported from safeImageURL.ts).

- [ ] Failing tests:
  - Round trip: `setImage("data:image/webp;base64,AAAA")`, export, import, `getImage()` is the same.
  - `setImage("")` drops the `image` key from the export.
  - Import of `{ image: "data:image/svg+xml;base64,AAAA" }` gives `getImage() === ""`.
  - `safeImageURL("data:image/png;base64,AAAA")` returns it. `safeImageURL("data:image/svg+xml;base64,AAAA")`, `safeImageURL("data:text/html,x")` and `safeImageURL("javascript:alert(1)")` return `""`.
- [ ] Run, FAIL. Implement. Run `npx vitest run src/classes/technical-readout.test.ts src/utils/safeImageURL.test.ts`, PASS.
- [ ] Commit `Unit image: stored on the TRO, safe data URLs only (#95)`.

### Task 2: Resize on upload

**Files:** Create `src/utils/unit-image.ts`, test `src/utils/unit-image.test.ts`.

**Interfaces (produces):** `fitSize(width: number, height: number, max = 400): { width: number; height: number }`, `shrinkUnitImage(file: Blob, encode?: (canvas, type, quality) => Promise<Blob>): Promise<{ dataUrl: string } | { error: string }>`, `UNIT_IMAGE_MAX_BYTES = 80 * 1024`, `UNIT_IMAGE_TOO_BIG = "This picture is too detailed to store; try a smaller or simpler one."`

- [ ] Failing tests:
  - `fitSize(1600, 800)` is `{ width: 400, height: 200 }`. `fitSize(300, 200)` is unchanged (no upscale). `fitSize(500, 2000)` is `{ width: 100, height: 400 }`.
  - With a stub `encode`: a 70 KB first encode is accepted. A 90 KB then 70 KB encode is accepted at quality 0.6 (assert the second call's quality). Two encodes over 80 KB give `{ error: UNIT_IMAGE_TOO_BIG }`.
  - A `text/plain` blob gives an error without calling `encode`.
  - When the WebP encode returns a blob whose type is not `image/webp`, it retries as JPEG.
- [ ] Run, FAIL. Implement (the default `encode` uses `canvas.toBlob`). Run, PASS.
- [ ] Commit `Unit image: shrink to 400 px and 80 KB (#95)`.

### Task 3: Upload on the creator TRO step

**Files:** Modify `src/ui/components/creator-tro-pages.tsx`. Test: `src/ui/components/creator-tro-pages.test.tsx` (extend).

- [ ] Failing tests:
  - The TRO step shows a "Unit picture" file input.
  - After a stubbed `shrinkUnitImage` resolves, the preview `<img>` has the data URL, and `host.tro.getImage()` equals it, and the save callback (the creator's `SaveUnitKey`) was called.
  - Remove clears it.
  - An error result shows the message and leaves the old image.
- [ ] Run, FAIL. Implement. Run `npx vitest run src/ui/components/creator-tro-pages.test.tsx`, PASS.
- [ ] Commit `Unit image: upload on every creator TRO step (#95)`.

### Task 4: UnitImageSVG and the 'Mech sheets

**Files:** Modify `src/ui/components/svg/record-sheet-svg-kit.tsx` (add `UnitImageSVG`), `battlemech-svg.tsx`, `battledroids-mech-record-sheet-svg.tsx`. Tests: their existing test files.

- [ ] Failing tests, per sheet:
  - With `tro.setImage(...)`, the sheet holds exactly one `<image>` whose `href` is the data URL and whose `preserveAspectRatio` is `xMidYMid meet`.
  - Its box lies inside the sheet's viewBox and overlaps no `<text>` element's bounding box. Compute this from the `x`/`y` attributes the kit already writes, and keep the check in a `assertImageClear(svg)` helper in `record-sheet-svg-kit.test.tsx` for reuse.
  - Without an image, the sheet's existing snapshot does not change.
- [ ] Run, FAIL. Implement: find each layout's largest empty area (render the sheet, read the snapshot) and place the image there. Run, PASS.
- [ ] Commit `Unit image: on the 'Mech record sheets (#95)`.

### Task 5: Every other sheet layout

**Files:** `vehicle-record-sheet-svg.tsx`, `support-aircraft-record-sheet-svg.tsx`, `fighter-record-sheet-svg.tsx` (and `aerospace-record-sheet-svg-blocks.tsx` if the slot is a block), `small-craft-record-sheet-svg.tsx`, `dropship-record-sheet-svg.tsx`, `capital-ship-record-sheet-svg.tsx`, `infantry-record-sheet-svg.tsx`, `battle-armor-record-sheet-svg.tsx`, `protomech-record-sheet-svg.tsx`, `building-record-sheet-svg.tsx`, `micro-mech-record-sheet-svg.tsx`, `walker-record-sheet-svg.tsx`, `battledroids-unit-record-sheet-svg.tsx`, plus each one's edition variants inside those files. Tests: each sheet's test file.

- [ ] Same three tests as Task 4 for each layout, using `assertImageClear`. Multi-unit sheets (infantry, battle armor, ProtoMech points, small craft with several units per page) get one image per unit block, each clear of that block's text.
- [ ] Run, FAIL. Implement one layout at a time. Run each layout's test. Then run `npx vitest run src/ui/components/svg`, PASS, with no snapshot changes for image-less designs.
- [ ] Commit per two or three layouts: `Unit image: on the <types> record sheets (#95)`.

### Task 6: TRO and Alpha Strike

**Files:** `src/ui/components/technical-readout-sheet.tsx` and `technical-readout-section.tsx` (image above the text), plus the `getAlphaStrike*` conversion in each class that builds one: `battlemech.ts:3861`, `vehicle.ts:4144`, `aerospace-fighter.ts:2347`, `battle-armor.ts:1961`, `infantry-platoon.ts:934`, `protomech.ts:1279`, `micro-mech.ts:1715`, `walker.ts:2419`. Tests: `src/classes/unit-image-alpha-strike.test.ts` (create) and the TRO sheet test.

- [ ] Failing tests:
  - For each of those eight classes, a fresh unit with `tro.setImage(url)` converts to an `AlphaStrikeUnit` whose `imageURL === url`. Without an image, `imageURL` is what it was before.
  - An `AlphaStrikeUnit` export and import keeps the data URL.
  - The TRO sheet renders an `<img>` with the data URL, at most 400 px wide.
- [ ] Run, FAIL. Implement. Run, PASS.
- [ ] Commit `Unit image: on the TRO and the Alpha Strike card (#95)`.

### Task 7: Checklist, review, ship

- [ ] **Backup:** a test in `src/ui/pages/settings/backup-and-restore` tests (or `dataSaves` tests) that a saved design with an image survives backup and restore.
- [ ] **News:** a bullet in the newest entry of `src/ui/pages/home.tsx`: "Unit pictures (issue #95)": upload in any creator, shown on the record sheet, the TRO and the Alpha Strike card, stored in the design.
- [ ] **Credits:** none. **Play:** none.
- [ ] `npm run check` from PowerShell: green (the known Dire Wolf timeout passes alone).
- [ ] Look at three sheets in the browser (`npm start`): 'Mech, vehicle and battle armor, each with a tall and a wide picture.
- [ ] One astech Opus whole-branch review. Fix Critical and Important findings test-first.
- [ ] `git push origin bv-gaps:beta`, `git deploy-beta` ("Published"). Comment on #95 in NGCFells' voice, close it, and give NGCFells the URL.
