# Unit image on record sheets, TROs and Alpha Strike cards (#95)

## Intent

A player uploads a picture of their unit in any unit creator. It travels with the design and shows on its record sheet (every edition's layout), its TRO and its Alpha Strike card.

## Decided by NGCFells (2026-11-22)

- **Stored in the design, shrunk.** The image is resized in the browser and stored as a data URL inside the design. It travels with save, export, backup and sharing.
- **On the record sheet, in each layout's own free area**, scaled to fit. Every sheet layout gets a slot.
- **Also on the Alpha Strike card** (NGCFells in the original discussion).

## Design

1. **One home for every unit class: `TechnicalReadout`.** Every unit class has `tro: TechnicalReadout`, exported as `tro` (`ITechnicalReadoutExport`). Add `image?: string` there, with `getImage(): string` and `setImage(dataUrl: string): void`; an empty string clears it. No unit class changes its own export.
2. **Resize on upload** (`src/utils/unit-image.ts`). The long side goes to at most 400 px, never upscaled. Encode as WebP at quality 0.8, falling back to JPEG 0.8 where the browser has no WebP encoder. If the result is over 80 KB, try once more at quality 0.6. Still over: reject with "This picture is too detailed to store; try a smaller or simpler one." Only `image/png`, `image/jpeg`, `image/webp` and `image/gif` files are taken (the first GIF frame).
3. **Safe to render.** `safeImageURL` also allows `data:image/png;base64,`, `data:image/jpeg;base64,` and `data:image/webp;base64,`, and nothing else under `data:` (no SVG). Loading a design runs the stored value through the same check, and a rejected value is dropped.
4. **Upload control**: on the shared Technical Readout step (`creator-tro-pages.tsx`), with a file input, a preview, and Remove. Every creator that uses the shared page gets it at once.
5. **Record sheets.** `UnitImageSVG` in `record-sheet-svg-kit.tsx` takes `{ href, x, y, width, height }` and draws `<image preserveAspectRatio="xMidYMid meet">`, or nothing when `href` is empty. Each sheet layout places it in its largest empty area. The rule: it covers no printed text, box, table or diagram, and is at least 20% of the sheet width wide where the layout has room. No sheet moves its other content.
6. **TRO.** The printed TRO sheet and the TRO page show the image above the text, at most 400 px wide.
7. **Alpha Strike.** Each unit class's Alpha Strike conversion sets `unit.imageURL = this.tro.getImage() || unit.imageURL`. The card already draws `imageURL` (`alpha-strike-unit-svg.tsx:298`). A roster unit keeps its picture through `AlphaStrikeUnit.export`.

## Non-goals

- Bundled MUL designs get no images.
- No upload on the Alpha Strike roster for MUL units (they already show the MUL picture).
- No cropping or editing tool.

## Checklist

TRO: section 6. Play: none. Record sheet: section 5, every layout. Alpha Strike: section 7. Credits: none. News: one bullet. Issue comment in NGCFells' voice, then close #95.
