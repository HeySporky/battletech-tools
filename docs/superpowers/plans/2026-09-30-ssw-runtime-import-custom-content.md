# Runtime SSW Import and Custom Content Submission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import any `.ssw` file from the UI with a review screen. Turn items the catalogs don't know into local
placeholder drafts. Let the user submit completed drafts as one pull request that merges them into the existing
`mech-custom-*` catalog files.

**Architecture:** The importer (`battlemech.ts`) reports structured unresolved items. A session module imports a
batch of files, groups unresolved items into drafts, and stores them in `localStorage`. The equipment registry and a
new component registry register the drafts at runtime, so designs that use them load and save. A pure serializer
merges completed drafts into the catalog files' text. A multi-file GitHub flow commits them on one branch, with the
`.ssw` evidence on a separate branch that is never merged.

**Tech Stack:** TypeScript, React 19 (class components), Vite, Vitest (`unit` project in Node; `// @vitest-environment happy-dom` per file for DOM/localStorage), Playwright e2e, fast-xml-parser, GitHub REST API via `fetch`.

**Spec:** `docs/superpowers/specs/2026-09-30-ssw-runtime-import-custom-content-design.md`

**Scope (decided 2026-09-30):** build phase **A1** now: Tasks 1–8, 12 and 14, run natively with one whole-branch
review at the end. Phase **A2** (PR submission: Tasks 9, 10, 11, 13) is deferred, listed in `TODO.md`, and kept
here unchanged for later. While A2 is deferred:
- Task 12's detail panel lists draft names instead of linking to the drafts page.
- Task 14 skips the drafts-page step of the e2e test.
- Task 14 step 8 (upstream notes) waits for A2.

## Global Constraints

- Work on branch `feature/ssw-runtime-import`. Commit after each task. Never push, never push to `upstream`, never run `npm run deploy-prod`.
- 4-space indentation, match the surrounding file. `battlemech.ts`: small helpers only, no restructuring.
- Catalog records are literal object arrays. Custom content goes only in `mech-custom-*` catalogs and never changes canon lists, canon validation or canon BV/PV.
- "Unknown is not zero": a draft keeps `null` for unknown stats. Only the runtime copy uses `0`. A catalog file never gets a `0` written for an unknown value.
- Custom tag format: `[ammo-]<submitter>-[is-|clan-]<slug>`. Submitter is the GitHub login, lowercased, `[^a-z0-9-]` → `-`. Provisional tags use the submitter `local`.
- Submission target: `CONST_CUSTOM_CONTENT_GITHUB_OWNER = "ngcfells"`, `CONST_CUSTOM_CONTENT_GITHUB_REPO = "battletech-tools"`, `CONST_CUSTOM_CONTENT_EVIDENCE_PATH = "tools/custom-content-submissions"`.
- Branch names: `custom-content/<id>` and `custom-content-evidence/<id>`, with `<id>` = `<submitter>-<yyyymmdd>-<6 random [a-z0-9]>`.
- Shipped code must never reference `*_DEV` paths. The corpus audit reads its directory from an environment variable.
- Saved data stays backward compatible: existing BattleMech JSON saves and backups must still load.
- Verification baseline (unit project at `feature/ssw-runtime-import` `5f15de27`, which includes the component fix `834ef8f2`): `npm test` 575 passed / 0 failed; `npx tsc --noEmit -p tsconfig.json` 0 errors; `npx eslint src` 0 errors. Report new failures separately from these.
- Test output: `npm test` prints many pre-existing `moveCritical() failed` console errors. Redirect output to a file and grep for `×|FAIL|Tests ` rather than reading it raw.

## Review Focus

1. **A non-SSW, malformed or non-BattleMech file in a batch**: that row shows `failed` with a reason, and every other file still imports. (Task 8 test: `"a malformed file fails alone"`.)
2. **The same unknown name in two files, or in a file imported again later**: one draft, carrying both sources. No duplicate draft. (Task 7 tests: `"merges a name shared by two designs"`, `"reuses an existing draft"`.)
3. **A canon item without a catalog record yet (B-Pod, Primitive Structure)**: no draft is made, and nothing can be submitted for it. (Task 7 test: `"skips canon-pending names"`.)
4. **localStorage unavailable (private mode, quota)**: the save returns `false`, the UI warns, and the app still starts. (Task 3 test: `"save returns false when storage throws"`.)
5. **A design saved with a provisional `local-` tag, then the draft is submitted and gets its final tag**: the saved design still loads its item. (Task 11 test: `"a design saved with the provisional tag still loads after finalization"`.)

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/data/custom-content-types.ts` (new) | Shared types: kinds, factions, `ICustomContentDraft`, `ISSWUnresolvedItem`. |
| `src/utils/customTags.ts` (new) | Submitter sanitizing, slugs, tag building, provisional and final tags. |
| `src/data/custom-content-local.ts` (new) | Draft store in `localStorage`; runtime copies; registration with the registries. |
| `src/data/equipment-registry.ts` (modify) | `setLocalCustomEquipment` / `getLocalCustomEquipment`; the custom tier includes local drafts. |
| `src/utils/importedEquipment.ts` (modify) | `resetImportedEquipmentIndex`; the custom index includes local drafts. |
| `src/data/mech-custom-{armor,internal-structure,gyro,engine,heat-sink,jump-jet,myomer}-types.ts` (new) | Seven empty custom component catalogs. |
| `src/data/custom-component-registry.ts` (new) | Canon / custom / local tiers per component kind; `isCustomComponent`; catalog ids and export names. |
| `src/classes/battlemech.ts` (modify) | Restore custom equipment; component setters use the registry; rules level; unresolved items; occupancy. |
| `src/utils/ssw-corpus-audit.test.ts` (new) | Env-gated audit over a directory of `.ssw` files. |
| `src/data/ssw/ssw-canon-pending-names.ts` (new) | SSW names that are canon but have no record yet. |
| `src/utils/sswDraftBuilder.ts` (new) | Slot estimate, templates, grouping into drafts, required fields. |
| `src/utils/sswImportSession.ts` (new) | Batch import: results per file, drafts, re-import with drafts registered. |
| `src/utils/customCatalogMerge.ts` (new) | Serialize records in a catalog file's style and merge them before `];`. |
| `src/utils/githubContribution.ts` (modify) | `getGithubLogin`, `submitGithubMultiFileContribution` (Git Data API, evidence branch, rollback). |
| `src/utils/customContentSubmission.ts` (new) | Finalize tags, build files, evidence and PR body, then update the store. |
| `src/configVars.ts`, `.gitignore` (modify) | Submission target constants; evidence folder ignored. |
| `src/ui/pages/classic-battletech/mech-creator/ssw-file-import.tsx` (new) | Upload and review screen. |
| `src/ui/pages/custom-content-drafts.tsx` (new) | Draft list, editor, token, submission. |
| `src/ui/app-router.tsx`, `mech-creator/_router.tsx`, `mech-creator/imports.tsx` (modify) | Routes, startup registration, links. |
| `e2e/ssw-import.spec.ts`, `e2e/fixtures/*.ssw` (new) | End-to-end import of two files. |

---

### Task 1: Custom equipment survives a save and reload

`_restoreEquipmentItem` calls `addEquipmentFromTag` without `includeCustom`, so a custom item disappears when a saved
design reloads. Canon must still win: try canon first, then custom.

**Files:**
- Modify: `src/classes/battlemech.ts` (`_restoreEquipmentItem`, ~line 6003)
- Test: `src/classes/battlemech.test.ts`

**Interfaces:**
- Consumes: `addEquipmentFromTag(..., includeCustom)` (existing, 13th parameter).
- Produces: restore resolves custom tags. Later tasks rely on drafts reloading through this path.

- [ ] **Step 1: Write the failing test** (append inside the top-level `describe` in `battlemech.test.ts`)

```ts
    // Regression: a saved design lost its custom (homebrew) equipment on reload, because restoring a save looked
    // the tag up in the canon lists only. Canon still wins when a tag exists in both.
    it("keeps custom equipment through a save and reload", () => {
        const customTag = mechCustomEquipmentMisc[0].tag;
        const mech = new BattleMech();
        mech.setTonnage(50);
        const added = mech.addEquipmentFromTag(customTag, "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        expect(added?.tag).toBe(customTag);

        const reloaded = new BattleMech(mech.exportJSON(true));
        expect(reloaded.getInstalledEquipment().map((item) => item.tag)).toContain(customTag);
    });
```

Add the import at the top of the file: `import { mechCustomEquipmentMisc } from "../data/mech-custom-equipment-weapons-misc";`.
If `getInstalledEquipment` does not exist, use the public getter the file's other tests use for `_equipmentList`. Search for `equipmentList` in `battlemech.test.ts` and use the same accessor.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run --project unit src/classes/battlemech.test.ts -t "custom equipment through a save" > $S/t1.txt 2>&1; grep -E "×|✓|Tests |expected" $S/t1.txt`
Expected: FAIL, the reloaded list does not contain the custom tag.

- [ ] **Step 3: Implement**

In `_restoreEquipmentItem`, replace the single `addEquipmentFromTag` call with a canon pass and then a custom pass:

```ts
    private _restoreEquipmentItem( importItem: IBMEquipmentExport ): IEquipmentItem | null {
        // Canon first, so a custom record can never capture a canon save; then the custom catalogs
        // (homebrew and this browser's drafts).
        const restore = ( includeCustom: boolean ) => this.addEquipmentFromTag(
            importItem.tag,
            this.getTech().tag,
            importItem.loc,
            importItem.rear ? true : false,
            importItem.uuid,
            importItem.target || "",
            importItem.resolved ? true : false,
            undefined,
            importItem.weight,
            importItem.split_location,
            importItem.currentAmmo,
            importItem.selectedAmmoBinUUID,
            includeCustom,
        );
        const restoredEquipment = restore( false ) ?? restore( true );
```

Keep the rest of the method unchanged.

- [ ] **Step 4: Run the test and the full suite**

Run: `npx vitest run --project unit src/classes/battlemech.test.ts -t "custom equipment through a save"`, then `npm test > $S/full.txt 2>&1; grep -E "×|FAIL|Tests " $S/full.txt`
Expected: PASS; full suite 576 passed.

- [ ] **Step 5: Commit**

```bash
git add src/classes/battlemech.ts src/classes/battlemech.test.ts
git commit -m "BattleMech: restore custom equipment from a save (canon first)"
```

---

### Task 2: Shared types and the custom tag builder

**Files:**
- Create: `src/data/custom-content-types.ts`
- Create: `src/utils/customTags.ts`
- Test: `src/utils/customTags.test.ts`

**Interfaces:**
- Produces:
  - `CustomComponentKind`, `CustomContentKind`, `CustomFaction`, `ICustomContentSource`, `ICustomContentDraft`, `ISSWUnresolvedItem` (below).
  - `sanitizeSubmitter(login: string): string`
  - `slugifyName(name: string): string`
  - `ammoSlug(name: string): string`
  - `buildCustomTag(args: { submitter: string; faction: CustomFaction; slug: string; isAmmo: boolean }): string`
  - `PROVISIONAL_SUBMITTER = "local"`
  - `finalizeTag(provisionalTag: string, submitter: string): string`

- [ ] **Step 1: Create the types file**

```ts
// src/data/custom-content-types.ts
// Custom (homebrew) content drafted in this browser from imported designs, before it is submitted for the
// mech-custom-* catalogs. See docs/superpowers/specs/2026-09-30-ssw-runtime-import-custom-content-design.md.

export type CustomComponentKind = "armor" | "structure" | "engine" | "gyro" | "heatSink" | "jumpJet" | "myomer";
export type CustomContentKind = "equipment" | "ammunition" | CustomComponentKind;
export type CustomFaction = "is" | "clan" | "universal";

export interface ICustomContentSource {
    fileName: string;
    designs: string[];
    sha256: string;
}

export interface ICustomContentDraft {
    id: string;
    kind: CustomContentKind;
    faction: CustomFaction;
    /** Catalog id, e.g. "mech-custom-ammo" or "mech-custom-armor-types". */
    targetCatalogId: string;
    /** The catalog record, field-for-field; null where the stat is still unknown. */
    record: Record<string, unknown>;
    status: "draft" | "complete";
    /** The slot count was estimated from the SSW file and the user has not confirmed it yet. */
    slotsEstimated: boolean;
    sourceFiles: ICustomContentSource[];
    /** The source .ssw text by file name, for the PR's evidence branch. */
    sourceXml?: Record<string, string>;
    sourceNote: string;
    prUrl?: string;
}

/** An item or component an SSW import could not resolve to any record. */
export interface ISSWUnresolvedItem {
    kind: CustomContentKind | "cockpit";
    /** The name the importer looked up (markers such as "(IS) " removed; SSW ammo "@ X" read as "Ammo (X)"). */
    name: string;
    /** The name exactly as the file wrote it. */
    sswName: string;
    faction: "is" | "clan";
    /** SSW's <type> for equipment ("energy", "ammunition", ...); the component kind otherwise. */
    sswType: string;
    /** SSW location code, lowercased ("lt", "ra"); "" for components. */
    location: string;
    /** Starting slot, or -1. */
    slotIndex: number;
    splitLocations: { location: string; index: number }[];
    tons: number | null;
}
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/utils/customTags.test.ts
import { describe, expect, it } from "vitest";
import { ammoSlug, buildCustomTag, finalizeTag, sanitizeSubmitter, slugifyName } from "./customTags";

describe("custom tags", () => {
    it("sanitizes the submitter's GitHub login", () => {
        expect(sanitizeSubmitter("NgcFells")).toBe("ngcfells");
        expect(sanitizeSubmitter("some_user.name")).toBe("some-user-name");
        expect(sanitizeSubmitter("__")).toBe("anonymous");
    });

    it("slugs names the way the catalogs do", () => {
        expect(slugifyName("Coil (L)")).toBe("coil-l");
        expect(slugifyName("Reactive Armor Mk.2")).toBe("reactive-armor-mk-2");
    });

    it("slugs ammunition with its round type", () => {
        expect(ammoSlug("Ammo (AC/25)")).toBe("ac-25-standard");
        expect(ammoSlug("Ammo (LRM-10 Swarm)")).toBe("lrm-10-swarm");
    });

    it.each([
        [{ submitter: "ngcfells", faction: "universal", slug: "ac-25-standard", isAmmo: true }, "ammo-ngcfells-ac-25-standard"],
        [{ submitter: "ngcfells", faction: "is", slug: "ac-25-standard", isAmmo: true }, "ammo-ngcfells-is-ac-25-standard"],
        [{ submitter: "ngcfells", faction: "clan", slug: "ac-25-standard", isAmmo: true }, "ammo-ngcfells-clan-ac-25-standard"],
        [{ submitter: "ngcfells", faction: "clan", slug: "coil-l", isAmmo: false }, "ngcfells-clan-coil-l"],
        [{ submitter: "local", faction: "is", slug: "reactive-armor-mk-2", isAmmo: false }, "local-is-reactive-armor-mk-2"],
    ] as const)("builds %o as %s", (args, expected) => {
        expect(buildCustomTag(args)).toBe(expected);
    });

    it("replaces the provisional submitter with the real one", () => {
        expect(finalizeTag("ammo-local-is-ac-25-standard", "ngcfells")).toBe("ammo-ngcfells-is-ac-25-standard");
        expect(finalizeTag("local-coil-l", "ngcfells")).toBe("ngcfells-coil-l");
    });
});
```

- [ ] **Step 3: Run and confirm it fails**

Run: `npx vitest run --project unit src/utils/customTags.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement**

```ts
// src/utils/customTags.ts
import type { CustomFaction } from "../data/custom-content-types";

// Custom record tags carry the submitter: [ammo-]<submitter>-[is-|clan-]<slug>. A draft starts with the
// provisional submitter "local" until a GitHub login is known.
export const PROVISIONAL_SUBMITTER = "local";

export function sanitizeSubmitter(login: string): string {
    const cleaned = login.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    return cleaned || "anonymous";
}

export function slugifyName(name: string): string {
    return name.toLowerCase()
        .replace(/([a-z])\.?(\d)/g, "$1 $2")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** "Ammo (AC/25)" -> "ac-25-standard"; a name that already carries a round type keeps it. */
export function ammoSlug(name: string): string {
    const inner = name.replace(/^ammo\s*\((.*)\)$/i, "$1").replace(/\bammo\b/gi, "");
    const slug = slugifyName(inner);
    return /(-standard|-swarm|-thunder|-inferno|-precision|-armor-piercing|-flechette|-tracer|-er|-he|-fragmentation|-incendiary)(-|$)/.test(slug)
        ? slug
        : `${slug}-standard`;
}

export function buildCustomTag(args: { submitter: string; faction: CustomFaction; slug: string; isAmmo: boolean }): string {
    const parts = [args.submitter, args.faction === "universal" ? "" : args.faction, args.slug].filter((part) => part !== "");
    return (args.isAmmo ? "ammo-" : "") + parts.join("-");
}

export function finalizeTag(provisionalTag: string, submitter: string): string {
    return provisionalTag.replace(/^(ammo-)?local-/, `$1${submitter}-`);
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run --project unit src/utils/customTags.test.ts`
Expected: PASS. If `slugifyName("Reactive Armor Mk.2")` disagrees, fix the regex, not the test.

- [ ] **Step 6: Commit**

```bash
git add src/data/custom-content-types.ts src/utils/customTags.ts src/utils/customTags.test.ts
git commit -m "Custom content: shared types and submitter-tagged custom tags"
```

---

### Task 3: Local draft store and runtime registration of equipment drafts

**Files:**
- Create: `src/data/custom-content-local.ts`
- Modify: `src/data/equipment-registry.ts` (`getCatalogByTech`, new exports)
- Modify: `src/utils/importedEquipment.ts` (`getIndex`, new export)
- Modify: `src/ui/app-router.tsx` (register at startup)
- Test: `src/data/custom-content-local.test.ts`

**Interfaces:**
- Consumes: `ICustomContentDraft` (Task 2).
- Produces:
  - `getLocalCustomContentDrafts(): ICustomContentDraft[]`
  - `saveLocalCustomContentDrafts(drafts: ICustomContentDraft[]): boolean` (also registers)
  - `registerLocalCustomContent(drafts?: ICustomContentDraft[]): void`
  - `toRuntimeRecord<T>(record: Record<string, unknown>): T`
  - `setLocalCustomEquipment(items: IEquipmentItem[]): void`, `getLocalCustomEquipment(): IEquipmentItem[]` (equipment-registry)
  - `resetImportedEquipmentIndex(): void` (importedEquipment)
  - Component registration is a no-op placeholder call here: Task 4 adds `setLocalCustomComponents`, and this task calls it then.

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/custom-content-local.test.ts
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { findImportedEquipment } from "../utils/importedEquipment";
import type { ICustomContentDraft } from "./custom-content-types";
import { getLocalCustomContentDrafts, registerLocalCustomContent, saveLocalCustomContentDrafts, toRuntimeRecord } from "./custom-content-local";
import { getEquipmentListByTech } from "./equipment-registry";
import { mechCustomEquipmentMisc } from "./mech-custom-equipment-weapons-misc";

const draft = (overrides: Partial<ICustomContentDraft> = {}): ICustomContentDraft => ({
    id: "d1",
    kind: "equipment",
    faction: "is",
    targetCatalogId: "mech-custom-equipment-weapons-misc",
    record: { ...JSON.parse(JSON.stringify(mechCustomEquipmentMisc[0])), name: "Widget Array", tag: "local-is-widget-array", altNames: ["Widget Array"], battleValue: null, book: "Custom" },
    status: "draft",
    slotsEstimated: true,
    sourceFiles: [],
    sourceNote: "",
    ...overrides,
});

afterEach(() => {
    localStorage.clear();
    registerLocalCustomContent([]);
    vi.restoreAllMocks();
});

describe("local custom content", () => {
    it("round-trips drafts through localStorage", () => {
        expect(saveLocalCustomContentDrafts([draft()])).toBe(true);
        expect(getLocalCustomContentDrafts().map((d) => d.id)).toEqual(["d1"]);
    });

    it("save returns false when storage throws", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
        expect(saveLocalCustomContentDrafts([draft()])).toBe(false);
    });

    it("reads an empty list from corrupt storage", () => {
        localStorage.setItem("localCustomContent", "{not json");
        expect(getLocalCustomContentDrafts()).toEqual([]);
    });

    it("runtime copies use 0 for unknown stats but keep unknown dates null", () => {
        const runtime = toRuntimeRecord<{ battleValue: number; introduced: number | null }>({ battleValue: null, introduced: null, range: { short: null } });
        expect(runtime.battleValue).toBe(0);
        expect(runtime.introduced).toBeNull();
        expect((runtime as any).range.short).toBe(0);
    });

    it("registered equipment drafts resolve by name, list with customs, and reload in a save", () => {
        saveLocalCustomContentDrafts([draft()]);
        expect(findImportedEquipment("Widget Array", "is")?.item.tag).toBe("local-is-widget-array");
        expect(getEquipmentListByTech("is", true).some((item) => item.tag === "local-is-widget-array")).toBe(true);
        expect(getEquipmentListByTech("is", false).some((item) => item.tag === "local-is-widget-array")).toBe(false);

        const mech = new BattleMech();
        mech.addEquipmentFromTag("local-is-widget-array", "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        const reloaded = new BattleMech(mech.exportJSON(true));
        expect(JSON.stringify(reloaded.export(true))).toContain("local-is-widget-array");
    });

    it("a canon tag still restores the canon record when a draft claims the same tag", () => {
        const canonTag = getEquipmentListByTech("is").find((item) => item.tag === "medium-laser")!.tag;
        saveLocalCustomContentDrafts([draft({ record: { ...draft().record, tag: canonTag } })]);
        const mech = new BattleMech();
        mech.addEquipmentFromTag(canonTag, "is", "un", false, null);
        const reloaded = new BattleMech(mech.exportJSON(true));
        expect(JSON.stringify(reloaded.export(true))).toContain('"name":"Medium Laser"');
    });
});
```

If `medium-laser` is not the IS Medium Laser tag, look it up with `grep -n 'name: "Medium Laser"' -A2 src/data/mech-is-equipment-weapons-energy.ts` and use that tag.

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run --project unit src/data/custom-content-local.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Registry: local custom equipment tier**

In `src/data/equipment-registry.ts`, after `equipmentCatalogDefinitions`:

```ts
// Custom drafts made in this browser (see custom-content-local.ts). They join the custom tier at runtime and
// never appear in the catalog definitions, summaries or exports.
let localCustomEquipment: IEquipmentItem[] = [];

export function setLocalCustomEquipment(items: IEquipmentItem[]): void {
    localCustomEquipment = items.map((item) => ({ ...item, catalog: "custom" }));
    standardAmmoBases = null;
    standardRoundsByFamily = null;
}

export function getLocalCustomEquipment(): IEquipmentItem[] {
    return localCustomEquipment;
}
```

Move the `let standardAmmoBases` and `let standardRoundsByFamily` declarations above this block if TypeScript reports use before declaration. In `getCatalogByTech`, append the local items to the custom tier:

```ts
function getCatalogByTech(techBase: EquipmentCatalog): IEquipmentItem[] {
    const items = equipmentCatalogDefinitions
        .filter((catalog) => catalog.techBase === techBase)
        .flatMap((catalog) => catalog.equipment)
        .filter((item) => techBase === "universal" || !isUniversalEquipment(item));
    return techBase === "custom" ? [...items, ...localCustomEquipment] : items;
}
```

Check that `IEquipmentItem.catalog` accepts `"custom"`. If its type differs, use the value `getEquipmentRulesLevel` compares against.

- [ ] **Step 4: Imported-equipment index: include local drafts, and a reset**

In `src/utils/importedEquipment.ts`:

```ts
import { EquipmentCatalog, getEquipmentCatalogDefinitions, getLocalCustomEquipment } from "../data/equipment-registry";
```

At the end of the `if (!indexes) { ... }` block in `getIndex`, before the closing brace:

```ts
            let custom = indexes.get("custom");
            if (!custom) {
                custom = { primary: new Map(), any: new Map() };
                indexes.set("custom", custom);
            }
            for (const item of getLocalCustomEquipment()) {
                add(custom.primary, item.name, item);
                add(custom.primary, item.tag, item);
                for (const identifier of getEquipmentIdentifiers(item)) {
                    add(custom.any, identifier, item);
                }
            }
```

And export:

```ts
/** Drops the lookup index so the next lookup sees newly registered local drafts. */
export function resetImportedEquipmentIndex(): void {
    indexes = null;
}
```

- [ ] **Step 5: The store**

```ts
// src/data/custom-content-local.ts
import type { IEquipmentItem } from "./data-interfaces";
import type { ICustomContentDraft } from "./custom-content-types";
import { setLocalCustomEquipment } from "./equipment-registry";
import { resetImportedEquipmentIndex } from "../utils/importedEquipment";

// Custom content drafts saved in this browser only, made from imported designs. They are registered with the
// equipment (and component) registries so designs that use them load; they can be proposed for the shared
// custom catalogs with a pull request.
const LOCAL_CUSTOM_CONTENT_STORAGE_KEY = "localCustomContent";
const DATE_FIELDS = new Set(["introduced", "extinct", "reintroduced", "prototype"]);

export function getLocalCustomContentDrafts(): ICustomContentDraft[] {
    try {
        if (typeof localStorage === "undefined") {
            return [];
        }
        const parsed = JSON.parse(localStorage.getItem(LOCAL_CUSTOM_CONTENT_STORAGE_KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Returns false when storage is unavailable (private mode, quota), so callers can warn the user. The drafts are
// registered either way, so the current session can use them.
export function saveLocalCustomContentDrafts(drafts: ICustomContentDraft[]): boolean {
    registerLocalCustomContent(drafts);
    try {
        localStorage.setItem(LOCAL_CUSTOM_CONTENT_STORAGE_KEY, JSON.stringify(drafts));
        return true;
    } catch {
        return false;
    }
}

/** A copy the construction code can use: unknown (null) stats become 0; unknown dates stay null. */
export function toRuntimeRecord<T>(record: Record<string, unknown>): T {
    const convert = (value: unknown, key: string): unknown => {
        if (value === null) return DATE_FIELDS.has(key) ? null : 0;
        if (Array.isArray(value)) return value.map((entry) => convert(entry, key));
        if (typeof value === "object") {
            return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, convert(v, k)]));
        }
        return value;
    };
    return convert(record, "") as T;
}

export function registerLocalCustomContent(drafts: ICustomContentDraft[] = getLocalCustomContentDrafts()): void {
    setLocalCustomEquipment(drafts
        .filter((draft) => draft.kind === "equipment" || draft.kind === "ammunition")
        .map((draft) => toRuntimeRecord<IEquipmentItem>(draft.record)));
    resetImportedEquipmentIndex();
}
```

If importing `../utils/importedEquipment` from `src/data` creates a circular-import error at runtime, move the
`resetImportedEquipmentIndex()` call into the callers (`sswImportSession`, the drafts page) and note it here.

- [ ] **Step 6: Register at startup**

In `src/ui/app-router.tsx`, import `registerLocalCustomContent` from `../data/custom-content-local` and call it at
the start of the async startup method that calls `getBattleMechSaves` (~line 182), before saves load:

```ts
        // This browser's custom content drafts must be registered before saved designs that use them load.
        registerLocalCustomContent();
```

- [ ] **Step 7: Run the tests and the full suite**

Run: `npx vitest run --project unit src/data/custom-content-local.test.ts`, then the full suite and `npx tsc --noEmit -p tsconfig.json`.
Expected: PASS; no other failures.

- [ ] **Step 8: Commit**

```bash
git add src/data/custom-content-local.ts src/data/custom-content-local.test.ts src/data/equipment-registry.ts src/utils/importedEquipment.ts src/ui/app-router.tsx
git commit -m "Custom content: local draft store, registered with the equipment lookups"
```

---

### Task 4: Custom component catalogs, component registry, setters and rules level

**Files:**
- Create: the seven `src/data/mech-custom-*-types.ts` files
- Create: `src/data/custom-component-registry.ts`
- Modify: `src/data/data-interfaces.ts` (`IMyomerType.altNames`)
- Modify: `src/classes/battlemech.ts` (setters, `_findSSWComponent`, `getRequiredRulesLevel`)
- Modify: `src/data/custom-content-local.ts` (register component drafts)
- Test: `src/data/custom-component-registry.test.ts`

**Interfaces:**
- Consumes: `CustomComponentKind` (Task 2), `toRuntimeRecord` (Task 3), `findAllByName` (`src/data/tag-match.ts`).
- Produces:
  - `type ComponentRecord<K extends CustomComponentKind>`
  - `getComponentTiers(kind)` → `[canon, custom, local]`
  - `getComponentRecords(kind)` → all three tiers, flattened
  - `setLocalCustomComponents(kind, records)`
  - `isCustomComponent(kind, record): boolean`
  - `CUSTOM_COMPONENT_CATALOGS: Record<CustomComponentKind, { id: string; exportName: string }>`
  - `CANON_COMPONENT_TEMPLATES: Record<CustomComponentKind, object>` (the first canon record, used as a template)

- [ ] **Step 1: Create the seven empty catalogs**

Each file uses the disclaimer header copied verbatim from `src/data/mech-custom-ammo.ts` (lines 3–15) and has one
export:

| File | Content after the header |
| --- | --- |
| `mech-custom-armor-types.ts` | `export const mechCustomArmorTypes: IArmorType[] = [\n];` |
| `mech-custom-internal-structure-types.ts` | `export const mechCustomInternalStructureTypes: IInternalStructure[] = [\n];` |
| `mech-custom-gyro-types.ts` | `export const mechCustomGyroTypes: IGyro[] = [\n];` |
| `mech-custom-engine-types.ts` | `export const mechCustomEngineTypes: IEngineType[] = [\n];` |
| `mech-custom-heat-sink-types.ts` | `export const mechCustomHeatSinkTypes: IHeatSync[] = [\n];` |
| `mech-custom-jump-jet-types.ts` | `export const mechCustomJumpJetTypes: IJumpJet[] = [\n];` |
| `mech-custom-myomer-types.ts` | `export const mechCustomMyomerTypes: IMyomerType[] = [\n];` |

The first line of each is the matching `import { IArmorType } from "./data-interfaces";` (or its interface).

- [ ] **Step 2: Add `altNames` to `IMyomerType`**

In `src/data/data-interfaces.ts`, after `altTags?: string[];` inside `IMyomerType`, add the same two lines the other component interfaces have:

```ts
    /** Other spellings of the name, such as Solaris Skunk Werks' ("XL Engine"), matched by name lookups. */
    altNames?: string[];
```

- [ ] **Step 3: Write the failing tests**

```ts
// src/data/custom-component-registry.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./equipment-registry";
import { getComponentRecords, isCustomComponent, setLocalCustomComponents } from "./custom-component-registry";
import { mechArmorTypes } from "./mech-armor-types";

const customArmor = { ...JSON.parse(JSON.stringify(mechArmorTypes[0])), name: "Widget Plate", tag: "local-is-widget-plate", altNames: ["Widget Plate"] };

afterEach(() => setLocalCustomComponents("armor", []));

describe("custom component registry", () => {
    it("lists canon records first, then custom, then local drafts", () => {
        setLocalCustomComponents("armor", [customArmor]);
        const records = getComponentRecords("armor");
        expect(records[0]).toBe(mechArmorTypes[0]);
        expect(records[records.length - 1].tag).toBe("local-is-widget-plate");
    });

    it("tells custom components from canon ones", () => {
        setLocalCustomComponents("armor", [customArmor]);
        expect(isCustomComponent("armor", mechArmorTypes[0])).toBe(false);
        expect(isCustomComponent("armor", getComponentRecords("armor").find((a) => a.tag === "local-is-widget-plate")!)).toBe(true);
    });

    it("a design with a custom armor needs Custom Homebrew and reloads with it", () => {
        setLocalCustomComponents("armor", [customArmor]);
        const mech = new BattleMech();
        mech.setArmorType("local-is-widget-plate");
        expect(mech.getArmorType()).toBe("local-is-widget-plate");
        expect(mech.getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(new BattleMech(mech.exportJSON(true)).getArmorType()).toBe("local-is-widget-plate");
    });

    it("canon armor keeps its rules level", () => {
        const mech = new BattleMech();
        mech.setArmorType("ferro-fibrous");
        expect(mech.getRequiredRulesLevel()).toBeLessThan(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("an SSW design resolves a custom armor by name", () => {
        setLocalCustomComponents("armor", [customArmor]);
        const xml = (sswTestFixtures as Record<string, string>)["Champion C"].replace(/<armor>([\s\S]*?)<type>[^<]+<\/type>/, "<armor>$1<type>Widget Plate</type>");
        const mech = new BattleMech();
        mech.importSSWXML(xml);
        expect(mech.getArmorType()).toBe("local-is-widget-plate");
    });
});
```

Add `import { sswTestFixtures } from "./ssw/sswTestFixtures";`. If the Champion C fixture is Clan and the armor
setter refuses an IS-only multiplier, set the template's `armorMultiplier` to `{ is: 16, clan: 16 }` in `customArmor`.

- [ ] **Step 4: Run and confirm they fail**

Run: `npx vitest run --project unit src/data/custom-component-registry.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 5: The registry**

```ts
// src/data/custom-component-registry.ts
import type { IArmorType, IEngineType, IGyro, IHeatSync, IInternalStructure, IJumpJet, IMyomerType } from "./data-interfaces";
import type { CustomComponentKind } from "./custom-content-types";
import { mechArmorTypes } from "./mech-armor-types";
import { mechEngineTypes } from "./mech-engine-types";
import { mechGyroTypes } from "./mech-gyro-types";
import { mechHeatSinkTypes } from "./mech-heat-sink-types";
import { mechInternalStructureTypes } from "./mech-internal-structure-types";
import { mechJumpJetTypes } from "./mech-jump-jet-types";
import { mechMyomerTypes } from "./mech-myomer-types";
import { mechCustomArmorTypes } from "./mech-custom-armor-types";
import { mechCustomEngineTypes } from "./mech-custom-engine-types";
import { mechCustomGyroTypes } from "./mech-custom-gyro-types";
import { mechCustomHeatSinkTypes } from "./mech-custom-heat-sink-types";
import { mechCustomInternalStructureTypes } from "./mech-custom-internal-structure-types";
import { mechCustomJumpJetTypes } from "./mech-custom-jump-jet-types";
import { mechCustomMyomerTypes } from "./mech-custom-myomer-types";

// Chassis components in three tiers: canon, the shared custom catalogs, and this browser's drafts. Lookups go
// in that order, so canon always wins. Using a custom or draft component makes a design Custom Homebrew.

interface IComponentRecordMap {
    armor: IArmorType;
    structure: IInternalStructure;
    engine: IEngineType;
    gyro: IGyro;
    heatSink: IHeatSync;
    jumpJet: IJumpJet;
    myomer: IMyomerType;
}
export type ComponentRecord<K extends CustomComponentKind> = IComponentRecordMap[K];

const canon: { [K in CustomComponentKind]: readonly IComponentRecordMap[K][] } = {
    armor: mechArmorTypes, structure: mechInternalStructureTypes, engine: mechEngineTypes, gyro: mechGyroTypes,
    heatSink: mechHeatSinkTypes, jumpJet: mechJumpJetTypes, myomer: mechMyomerTypes,
};
const custom: { [K in CustomComponentKind]: readonly IComponentRecordMap[K][] } = {
    armor: mechCustomArmorTypes, structure: mechCustomInternalStructureTypes, engine: mechCustomEngineTypes,
    gyro: mechCustomGyroTypes, heatSink: mechCustomHeatSinkTypes, jumpJet: mechCustomJumpJetTypes,
    myomer: mechCustomMyomerTypes,
};
const local: { [K in CustomComponentKind]: IComponentRecordMap[K][] } = {
    armor: [], structure: [], engine: [], gyro: [], heatSink: [], jumpJet: [], myomer: [],
};

export const CUSTOM_COMPONENT_CATALOGS: Record<CustomComponentKind, { id: string; exportName: string }> = {
    armor: { id: "mech-custom-armor-types", exportName: "mechCustomArmorTypes" },
    structure: { id: "mech-custom-internal-structure-types", exportName: "mechCustomInternalStructureTypes" },
    engine: { id: "mech-custom-engine-types", exportName: "mechCustomEngineTypes" },
    gyro: { id: "mech-custom-gyro-types", exportName: "mechCustomGyroTypes" },
    heatSink: { id: "mech-custom-heat-sink-types", exportName: "mechCustomHeatSinkTypes" },
    jumpJet: { id: "mech-custom-jump-jet-types", exportName: "mechCustomJumpJetTypes" },
    myomer: { id: "mech-custom-myomer-types", exportName: "mechCustomMyomerTypes" },
};

/** The first canon record of each kind: a draft's field template. */
export const CANON_COMPONENT_TEMPLATES: { [K in CustomComponentKind]: IComponentRecordMap[K] } = {
    armor: mechArmorTypes[0], structure: mechInternalStructureTypes[0], engine: mechEngineTypes[0],
    gyro: mechGyroTypes[0], heatSink: mechHeatSinkTypes[0], jumpJet: mechJumpJetTypes[0], myomer: mechMyomerTypes[0],
};

export function getComponentTiers<K extends CustomComponentKind>(kind: K): readonly (readonly IComponentRecordMap[K][])[] {
    return [canon[kind], custom[kind], local[kind]];
}

export function getComponentRecords<K extends CustomComponentKind>(kind: K): IComponentRecordMap[K][] {
    return getComponentTiers(kind).flat();
}

export function setLocalCustomComponents<K extends CustomComponentKind>(kind: K, records: IComponentRecordMap[K][]): void {
    local[kind] = records;
}

export function isCustomComponent<K extends CustomComponentKind>(kind: K, record: IComponentRecordMap[K] | null | undefined): boolean {
    return !!record && !canon[kind].some((candidate) => candidate.tag === record.tag);
}
```

- [ ] **Step 6: Setters use the registry**

In `src/classes/battlemech.ts`, import `getComponentRecords`, `getComponentTiers`, `isCustomComponent` and
`ComponentRecord` from `../data/custom-component-registry`, and `CustomComponentKind` from
`../data/custom-content-types`. Then change each lookup loop. Leave every other line alone.

- `setArmorType`: loop over `getComponentRecords("armor")` instead of `mechArmorTypes`. Add `break;` after `this._calc();` so the first accepted match wins.
- `setInternalStructureType`: `for( let is of getComponentRecords("structure"))`.
- `setEngineType`: `for( let engine of getComponentRecords("engine"))`.
- `setGyroType`: `for( let gyro of getComponentRecords("gyro"))`.
- `setHeatSinksType`: `for( let heatSink of getComponentRecords("heatSink"))`, and add `break;` after the assignment.
- `setJumpJetType`: `findByTag(getComponentRecords("jumpJet"), tag)`.
- `setMyomerType`: `findByTag(getComponentRecords("myomer"), tag)`.

Do not change `mechArmorTypes` uses outside these setters. The selection lists stay canon-only in spec A.

- [ ] **Step 7: SSW component lookup goes tier by tier**

Replace `_findSSWComponent` with a kind-based version, and update its six callers in `importSSWXML`: `mechEngineTypes`→`"engine"`, `mechGyroTypes`→`"gyro"`, `mechInternalStructureTypes`→`"structure"`, `mechArmorTypes`→`"armor"`, `mechHeatSinkTypes`→`"heatSink"`, `mechJumpJetTypes`→`"jumpJet"`.

```ts
    private _findSSWComponent<K extends CustomComponentKind>(
        kind: K,
        component: string,
        sswName: unknown,
        sswTechbase?: unknown,
    ): ComponentRecord<K> | undefined {
        const isClan = String( sswTechbase ) === "1";
        // Canon first, then the custom catalogs, then this browser's drafts.
        for( const tier of getComponentTiers( kind ) ) {
            const matches = findAllByName( tier as ComponentRecord<K>[], sswName );
            if( matches.length > 0 ) {
                const hasInnerSphereCriticals = ( record: ComponentRecord<K> ) => !!( record as { criticals?: { is?: unknown } } ).criticals?.is;
                return matches.find( ( record ) => hasInnerSphereCriticals( record ) !== isClan ) ?? matches[0];
            }
        }
        this._sswImportErrors.push( "Cannot find any " + component + " named: '" + sswName + "'" );
        return undefined;
    }
```

Keep the doc comment above it, and add one line: "Canon wins; custom and draft records answer only names canon doesn't."

- [ ] **Step 8: Rules level**

In `getRequiredRulesLevel()`, before `return level;`:

```ts
        // A custom or draft chassis component (custom-component-registry.ts) is homebrew.
        const components: [CustomComponentKind, { tag: string } | null | undefined][] = [
            ["armor", this._armorType], ["structure", this._selectedInternalStructure], ["engine", this._engineType],
            ["gyro", this._gyro], ["heatSink", this._heatSinkType], ["jumpJet", this._jumpJetType], ["myomer", this._myomerType],
        ];
        if (components.some(([kind, record]) => isCustomComponent(kind, record as never))) {
            level = Math.max(level, CUSTOM_HOMEBREW_RULES_LEVEL);
        }
```

- [ ] **Step 9: Register component drafts**

In `src/data/custom-content-local.ts` `registerLocalCustomContent`, after the equipment registration:

```ts
    for (const kind of ["armor", "structure", "engine", "gyro", "heatSink", "jumpJet", "myomer"] as const) {
        setLocalCustomComponents(kind, drafts
            .filter((draft) => draft.kind === kind)
            .map((draft) => toRuntimeRecord(draft.record)));
    }
```

Import `setLocalCustomComponents` from `./custom-component-registry`.

- [ ] **Step 10: Run the tests, the SSW tests and the full suite**

Run: `npx vitest run --project unit src/data/custom-component-registry.test.ts`, then `npx vitest run --project unit src/classes/battlemech.test.ts -t "SSW"`, then `npm test`, `npx tsc --noEmit -p tsconfig.json`.
Expected: all PASS; the 14 SSW component tests from commit `834ef8f2` stay green.

- [ ] **Step 11: Commit**

```bash
git add src/data/mech-custom-*-types.ts src/data/custom-component-registry.ts src/data/custom-component-registry.test.ts src/data/data-interfaces.ts src/data/custom-content-local.ts src/classes/battlemech.ts
git commit -m "Custom components: seven custom catalogs, a tiered registry, setters and rules level"
```

---

### Task 5: The importer reports structured unresolved items and slot occupancy

**Files:**
- Modify: `src/classes/battlemech.ts`
- Test: `src/classes/battlemech.test.ts`

**Interfaces:**
- Consumes: `ISSWUnresolvedItem` (Task 2).
- Produces:
  - `BattleMech.getSSWUnresolved(): ISSWUnresolvedItem[]`
  - `BattleMech.getCriticalOccupancy(sswLocation: string): boolean[]` (`true` = slot taken; length = slots in the location; `[]` for an unknown location)

- [ ] **Step 1: Write the failing tests**

```ts
    describe("SSW unresolved items", () => {
        const griffin = () => sswMechs.find((xml) => /name="Griffin" model="GRF-1N"/.test(xml))!;

        it("reports an unknown weapon with its faction, type, location and slot", () => {
            const xml = griffin().replace("<name manufacturer=\"Kreuss\">(IS) PPC</name>", "<name manufacturer=\"\">(IS) Widget Cannon</name>");
            const mech = new BattleMech();
            mech.importSSWXML(xml);
            expect(mech.getSSWUnresolved()).toEqual([expect.objectContaining({
                kind: "equipment", name: "Widget Cannon", sswName: "(IS) Widget Cannon", faction: "is",
                sswType: "energy", location: "ra", slotIndex: 4,
            })]);
        });

        it("reports unknown ammunition as ammunition", () => {
            const xml = griffin().replace(/@ LRM-10/g, "@ Widget Cannon");
            const mech = new BattleMech();
            mech.importSSWXML(xml);
            expect(mech.getSSWUnresolved().map((item) => [item.kind, item.name])).toContainEqual(["ammunition", "Ammo (Widget Cannon)"]);
        });

        it("reports an unknown armor type as an armor component", () => {
            const xml = griffin().replace("<type>Standard Armor</type>", "<type>Widget Plate</type>");
            const mech = new BattleMech();
            mech.importSSWXML(xml);
            expect(mech.getSSWUnresolved()).toEqual([expect.objectContaining({ kind: "armor", name: "Widget Plate", location: "", slotIndex: -1 })]);
        });

        it("reports an unknown cockpit", () => {
            const xml = griffin().replace(/(<cockpit>\s*<type[^>]*>)[^<]+/, "$1Torso-Mounted Cockpit");
            const mech = new BattleMech();
            mech.importSSWXML(xml);
            expect(mech.getSSWUnresolved()).toEqual([expect.objectContaining({ kind: "cockpit", name: "Torso-Mounted Cockpit" })]);
        });

        it("a clean import has no unresolved items, and occupancy marks the PPC's three slots", () => {
            const mech = new BattleMech();
            mech.importSSWXML(griffin());
            expect(mech.getSSWUnresolved()).toEqual([]);
            expect(mech.getCriticalOccupancy("ra").slice(4, 8)).toEqual([true, true, true, false]);
            expect(mech.getCriticalOccupancy("xx")).toEqual([]);
        });
    });
```

Before running, check the Griffin's PPC element in `src/data/ssw/sswMechs.ts`. If its name element differs from
`<name manufacturer="Kreuss">(IS) PPC</name>`, copy the exact element into the first test's `replace`. The probe
in the plan's research showed the PPC at `rightArm` slots 4–6 and LRM ammo, so the ammo replace should match.

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run --project unit src/classes/battlemech.test.ts -t "SSW unresolved" > $S/t5.txt 2>&1; grep -E "×|✓|Tests " $S/t5.txt`
Expected: FAIL, `getSSWUnresolved` is not a function.

- [ ] **Step 3: Implement**

Next to `private _sswImportErrors: string[] = [];` add:

```ts
    // Items and components an SSW import could not resolve, for the import review screen and custom drafts.
    private _sswUnresolved: ISSWUnresolvedItem[] = [];
```

In `importSSWXML`, next to `this._sswImportErrors = [];`, add `this._sswUnresolved = [];`.

In `_installSSWEquipment`'s not-found branch, after the `push` of the error string:

```ts
                const splitLocations = ( Array.isArray( item.splitlocation ) ? item.splitlocation : item.splitlocation ? [ item.splitlocation ] : [] )
                    .map( ( split: any ) => ( { location: String( split["#text"] ?? "" ).toLowerCase().trim(), index: +( split["@_index"] ?? -1 ) } ) );
                this._sswUnresolved.push( {
                    kind: String( item.type ).toLowerCase() === "ammunition" ? "ammunition" : "equipment",
                    name: itemName,
                    sswName: item.name["#text"],
                    faction: listTag,
                    sswType: String( item.type ?? "" ).toLowerCase(),
                    location,
                    slotIndex: allocationIndex,
                    splitLocations,
                    tons: item.tons !== undefined && Number.isFinite( +item.tons ) ? +item.tons : null,
                } );
```

In `_findSSWComponent`, give it the faction and record the unresolved component where it pushes the error:

```ts
        this._sswUnresolved.push( {
            kind, name: String( sswName ), sswName: String( sswName ),
            faction: isClan ? "clan" : String( sswTechbase ) === "0" ? "is" : ( this.getTech().tag === "clan" || this.getTech().tag === "mclan" ? "clan" : "is" ),
            sswType: kind, location: "", slotIndex: -1, splitLocations: [], tons: null,
        } );
```

In the cockpit block, where it pushes `"Cannot import the cockpit type: ..."`, also push
`{ kind: "cockpit", name: cockpitType, sswName: cockpitType, faction: ..., sswType: "cockpit", location: "", slotIndex: -1, splitLocations: [], tons: null }`.
Use the same faction expression as `_findSSWComponent`, with no techbase.

Add the public methods near `get sswImportErrors()`:

```ts
    public getSSWUnresolved(): ISSWUnresolvedItem[] {
        return this._sswUnresolved;
    }

    /** Which slots of a location (SSW code: "hd", "ct", "lt", ...) hold something; [] for an unknown location. */
    public getCriticalOccupancy( sswLocation: string ): boolean[] {
        const keys: Record<string, string> = {
            hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm",
            ll: "leftLeg", rl: "rightLeg", cl: "centerLeg", fll: "frontLeftLeg", frl: "frontRightLeg",
        };
        const slots = this.getCriticals()[ keys[ sswLocation.toLowerCase().trim() ] ?? "" ];
        return Array.isArray( slots ) ? slots.map( ( slot ) => !!slot ) : [];
    }
```

Import `ISSWUnresolvedItem` from `../data/custom-content-types`.

- [ ] **Step 4: Run the tests and the SSW set**

Run: `npx vitest run --project unit src/classes/battlemech.test.ts -t "SSW"`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/classes/battlemech.ts src/classes/battlemech.test.ts
git commit -m "SSW import: report unresolved items and components; critical slot occupancy"
```

---

### Task 6: SSW corpus audit and the canon-pending list

**Files:**
- Create: `src/utils/ssw-corpus-audit.test.ts`
- Create: `src/data/ssw/ssw-canon-pending-names.ts`
- Test: `src/data/ssw/ssw-canon-pending-names.test.ts`

**Interfaces:**
- Produces: `isSSWCanonPending(kind: string, name: string): boolean`, `SSW_CANON_PENDING_NAMES: readonly { kind: string; name: string; note: string }[]`

- [ ] **Step 1: The audit (skipped unless `SSW_AUDIT_DIR` is set)**

```ts
// src/utils/ssw-corpus-audit.test.ts
// Dev tool, not a regression test: imports every .ssw file under $SSW_AUDIT_DIR and writes the unresolved
// names, with counts and example designs, to $SSW_AUDIT_OUT (default: ssw-audit.json in the working directory).
// Run: SSW_AUDIT_DIR=<dir> SSW_AUDIT_OUT=<file> npx vitest run --project unit src/utils/ssw-corpus-audit.test.ts
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";
import { BattleMech } from "../classes/battlemech";

const dir = process.env.SSW_AUDIT_DIR;

const listFiles = (root: string): string[] => readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    return statSync(path).isDirectory() ? listFiles(path) : path.toLowerCase().endsWith(".ssw") ? [path] : [];
});

describe.skipIf(!dir)("SSW corpus audit", () => {
    it("lists every unresolved name", () => {
        const names = new Map<string, { kind: string; name: string; count: number; designs: string[] }>();
        const failures: { file: string; error: string }[] = [];
        let designs = 0;
        for (const file of listFiles(dir!)) {
            try {
                const mech = new BattleMech();
                mech.importSSWXML(readFileSync(file, "utf8"));
                designs++;
                for (const item of mech.getSSWUnresolved()) {
                    const key = `${item.kind}|${item.name.toLowerCase()}`;
                    const entry = names.get(key) ?? { kind: item.kind, name: item.name, count: 0, designs: [] };
                    entry.count++;
                    if (entry.designs.length < 5) entry.designs.push(`${mech.getName()} ${mech.model}`);
                    names.set(key, entry);
                }
            } catch (error) {
                failures.push({ file, error: String(error) });
            }
        }
        const report = { designs, failures, unresolved: [...names.values()].sort((a, b) => b.count - a.count) };
        writeFileSync(process.env.SSW_AUDIT_OUT ?? "ssw-audit.json", JSON.stringify(report, null, 2));
    }, 1_800_000);
});
```

- [ ] **Step 2: Run the audit over the local corpus**

Run (output goes to the scratchpad, never the repo):
`SSW_AUDIT_DIR=WorkingData_DEV/SSWdata SSW_AUDIT_OUT=$S/ssw-audit.json npx vitest run --project unit src/utils/ssw-corpus-audit.test.ts > $S/audit.txt 2>&1`
then `node -e "const r=require(process.argv[1]);console.log(r.designs,r.failures.length);for(const u of r.unresolved)console.log(u.count,u.kind,u.name)" $S/ssw-audit.json`.

Also run once with no variable set and confirm it reports `1 skipped`.

- [ ] **Step 3: Classify the names (Astech review)**

For each unresolved name, decide whether it is a canon item without a record yet. Check `TODO.md` §2 "Canon
equipment with no catalog record yet" and "Chassis component names with no record yet", and the rulebook text
extracts (`.claude/rules/rulebooks.md`). Canon names go into the list with the book and page that proves them
canon. A name you cannot prove canon stays off the list, so it becomes a custom draft. Record the decision for
every name in `$S/canon-pending-review.md`, and present that table to the user before committing.

- [ ] **Step 4: Write the failing test**

```ts
// src/data/ssw/ssw-canon-pending-names.test.ts
import { describe, expect, it } from "vitest";
import { isSSWCanonPending, SSW_CANON_PENDING_NAMES } from "./ssw-canon-pending-names";

describe("SSW canon-pending names", () => {
    it("matches by kind and case-insensitive name", () => {
        const first = SSW_CANON_PENDING_NAMES[0];
        expect(isSSWCanonPending(first.kind, first.name.toUpperCase())).toBe(true);
        expect(isSSWCanonPending(first.kind, "Widget Cannon")).toBe(false);
    });

    it("every entry cites a book and page", () => {
        for (const entry of SSW_CANON_PENDING_NAMES) {
            expect(entry.note, entry.name).toMatch(/p\.\s?\d+/);
        }
    });
});
```

- [ ] **Step 5: Implement the list**

```ts
// src/data/ssw/ssw-canon-pending-names.ts
// SSW names that are canon BattleTech items with no catalog record yet. An import that meets one reports it as
// "canon item, not yet in the catalog" instead of making a custom draft, so canon gear is never submitted as
// homebrew. Generated from the SSW corpus audit (src/utils/ssw-corpus-audit.test.ts) and reviewed by hand; each
// entry names the book and page that make it canon. Remove an entry when its record is added.
export const SSW_CANON_PENDING_NAMES: readonly { kind: string; name: string; note: string }[] = [
    // One line per reviewed name from Step 3, e.g.
    // { kind: "equipment", name: "B-Pod", note: "TO:AUE p.<n>" },
];

const keys = new Set(SSW_CANON_PENDING_NAMES.map((entry) => `${entry.kind}|${entry.name.trim().toLowerCase()}`));

export function isSSWCanonPending(kind: string, name: string): boolean {
    return keys.has(`${kind}|${name.trim().toLowerCase()}`);
}
```

Fill the array from the reviewed table. Every page must come from the book text. If the user has not approved the
table yet, commit the tool and an empty list, and add a TODO item.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run --project unit src/data/ssw/ssw-canon-pending-names.test.ts src/utils/ssw-corpus-audit.test.ts`
Expected: PASS (the audit skipped). With an empty list, the first test fails on `SSW_CANON_PENDING_NAMES[0]`.
Guard it with `it.skipIf(SSW_CANON_PENDING_NAMES.length === 0)`.

- [ ] **Step 7: Commit, and update TODO**

Tick "The audit harness was a throwaway test; add it as a dev tool" in `TODO.md` §2, with the run command.

```bash
git add src/utils/ssw-corpus-audit.test.ts src/data/ssw/ssw-canon-pending-names.ts src/data/ssw/ssw-canon-pending-names.test.ts TODO.md
git commit -m "SSW: corpus audit dev tool and the canon-pending names list"
```

---

### Task 7: Draft builder

**Files:**
- Create: `src/utils/sswDraftBuilder.ts`
- Test: `src/utils/sswDraftBuilder.test.ts`

**Interfaces:**
- Consumes: Task 2 types and `buildCustomTag`, `slugifyName`, `ammoSlug`, `PROVISIONAL_SUBMITTER`; Task 4 `CUSTOM_COMPONENT_CATALOGS`, `CANON_COMPONENT_TEMPLATES`; Task 6 `isSSWCanonPending`; `getEquipmentCatalogById` (equipment-registry).
- Produces:
  - `estimateSlots(start: number, occupancy: boolean[]): number`
  - `targetCatalogFor(kind: CustomContentKind, sswType: string): string`
  - `blankTemplate(kind: CustomContentKind, targetCatalogId: string): Record<string, unknown>`
  - `interface IDraftSourceEntry { item: ISSWUnresolvedItem; slots: number; design: string; source: ICustomContentSource }`
  - `buildDrafts(entries: IDraftSourceEntry[], existing: ICustomContentDraft[], newId?: () => string): ICustomContentDraft[]` (returns the full updated list: existing plus new)
  - `draftMatches(draft: ICustomContentDraft, item: ISSWUnresolvedItem): boolean`
  - `missingFields(draft: ICustomContentDraft): string[]`
  - `REQUIRED_FIELDS: Record<CustomContentKind, string[]>`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/sswDraftBuilder.test.ts
import { describe, expect, it } from "vitest";
import type { ISSWUnresolvedItem } from "../data/custom-content-types";
import { blankTemplate, buildDrafts, estimateSlots, missingFields, targetCatalogFor } from "./sswDraftBuilder";

const item = (overrides: Partial<ISSWUnresolvedItem> = {}): ISSWUnresolvedItem => ({
    kind: "equipment", name: "Widget Cannon", sswName: "(IS) Widget Cannon", faction: "is", sswType: "energy",
    location: "ra", slotIndex: 4, splitLocations: [], tons: null, ...overrides,
});
const source = (fileName: string) => ({ fileName, designs: [fileName.replace(".ssw", "")], sha256: "abc" });
let n = 0;
const newId = () => `id${++n}`;

describe("SSW draft builder", () => {
    it("estimates slots up to the next occupied slot", () => {
        expect(estimateSlots(4, [true, true, true, true, false, false, false, true])).toBe(3);
        expect(estimateSlots(10, Array(12).fill(false))).toBe(2);
        expect(estimateSlots(-1, [])).toBe(1);
    });

    it("picks the custom catalog by kind and SSW type", () => {
        expect(targetCatalogFor("equipment", "energy")).toBe("mech-custom-equipment-weapons-energy");
        expect(targetCatalogFor("equipment", "ballistic")).toBe("mech-custom-equipment-weapons-ballistic");
        expect(targetCatalogFor("equipment", "missile")).toBe("mech-custom-equipment-weapons-missile");
        expect(targetCatalogFor("equipment", "physical")).toBe("mech-custom-equipment-weapons-misc");
        expect(targetCatalogFor("ammunition", "ammunition")).toBe("mech-custom-ammo");
        expect(targetCatalogFor("armor", "armor")).toBe("mech-custom-armor-types");
    });

    it("templates follow the target catalog's first entry with every value unknown", () => {
        const template = blankTemplate("ammunition", "mech-custom-ammo");
        expect(Object.keys(template).slice(0, 3)).toEqual(["isAmmo", "isSpecialAmmo", "name"]);
        expect(template.battleValue).toBeNull();
        expect(template.name).toBe("");
    });

    it("builds a placeholder draft from the file's facts", () => {
        const [draft] = buildDrafts([{ item: item({ tons: 7 }), slots: 3, design: "Griffin GRF-1N", source: source("griffin.ssw") }], [], newId);
        expect(draft).toMatchObject({ kind: "equipment", faction: "is", targetCatalogId: "mech-custom-equipment-weapons-energy", status: "draft", slotsEstimated: true });
        expect(draft.record).toMatchObject({ name: "Widget Cannon", tag: "local-is-widget-cannon", altNames: ["Widget Cannon"], weight: 7, book: "Custom", introduced: null });
        expect((draft.record.space as Record<string, unknown>).battlemech).toBe(3);
        expect((draft.record.space as Record<string, unknown>).protomech).toBeNull();
    });

    it("merges a name shared by two designs", () => {
        const drafts = buildDrafts([
            { item: item(), slots: 3, design: "A", source: source("a.ssw") },
            { item: item({ name: "widget cannon" }), slots: 3, design: "B", source: source("b.ssw") },
        ], [], newId);
        expect(drafts).toHaveLength(1);
        expect(drafts[0].sourceFiles.map((s) => s.fileName)).toEqual(["a.ssw", "b.ssw"]);
    });

    it("reuses an existing draft", () => {
        const first = buildDrafts([{ item: item(), slots: 3, design: "A", source: source("a.ssw") }], [], newId);
        const second = buildDrafts([{ item: item(), slots: 3, design: "B", source: source("b.ssw") }], first, newId);
        expect(second).toHaveLength(1);
        expect(second[0].id).toBe(first[0].id);
        expect(second[0].sourceFiles).toHaveLength(2);
    });

    it("keeps IS and Clan items with one name apart", () => {
        expect(buildDrafts([
            { item: item(), slots: 3, design: "A", source: source("a.ssw") },
            { item: item({ faction: "clan" }), slots: 3, design: "B", source: source("b.ssw") },
        ], [], newId)).toHaveLength(2);
    });

    it("skips canon-pending names and cockpits", () => {
        expect(buildDrafts([{ item: item({ kind: "cockpit", name: "Torso-Mounted Cockpit" }), slots: 1, design: "A", source: source("a.ssw") }], [], newId)).toEqual([]);
    });

    it("ammunition gets an ammo tag and no slots field requirement", () => {
        const [draft] = buildDrafts([{ item: item({ kind: "ammunition", name: "Ammo (Widget Cannon)", sswType: "ammunition" }), slots: 1, design: "A", source: source("a.ssw") }], [], newId);
        expect(draft.record.tag).toBe("ammo-local-is-widget-cannon-standard");
        expect(draft.record.isAmmo).toBe(true);
        expect(missingFields(draft)).not.toContain("space.battlemech");
    });

    it("lists the missing required fields, the estimated slots and unset domain legality", () => {
        const [draft] = buildDrafts([{ item: item(), slots: 3, design: "A", source: source("a.ssw") }], [], newId);
        const missing = missingFields(draft);
        expect(missing).toEqual(expect.arrayContaining(["weight", "damage", "heat", "battleValue", "cbills", "introduced", "slotsEstimated", "space.protomech"]));
        expect(missing).not.toContain("space.battlemech");
    });
});
```

The canon-pending test above uses a cockpit, which is never drafted. Once Task 6 has a list entry, add an
equipment case using `SSW_CANON_PENDING_NAMES[0]`.

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run --project unit src/utils/sswDraftBuilder.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/utils/sswDraftBuilder.ts
import type { CustomContentKind, ICustomContentDraft, ICustomContentSource, ISSWUnresolvedItem } from "../data/custom-content-types";
import { CANON_COMPONENT_TEMPLATES, CUSTOM_COMPONENT_CATALOGS } from "../data/custom-component-registry";
import { getEquipmentCatalogById } from "../data/equipment-registry";
import { isSSWCanonPending } from "../data/ssw/ssw-canon-pending-names";
import { ammoSlug, buildCustomTag, PROVISIONAL_SUBMITTER, slugifyName } from "./customTags";

// Turns the items an SSW import could not resolve into custom content drafts: one per kind, faction and name,
// with what the file says (name, tons, an estimated slot count) and every other stat unknown (null).

export interface IDraftSourceEntry {
    item: ISSWUnresolvedItem;
    slots: number;
    design: string;
    source: ICustomContentSource;
    /** The file's text, kept with the draft for the PR's evidence branch. */
    xml?: string;
}

/** SSW stores only an item's first slot: count free slots from there to the next occupied one. */
export function estimateSlots(start: number, occupancy: boolean[]): number {
    if (start < 0 || start >= occupancy.length) return 1;
    let end = start + 1;
    while (end < occupancy.length && !occupancy[end]) end++;
    return end - start;
}

export function targetCatalogFor(kind: CustomContentKind, sswType: string): string {
    if (kind === "ammunition") return "mech-custom-ammo";
    if (kind !== "equipment") return CUSTOM_COMPONENT_CATALOGS[kind].id;
    switch (sswType) {
        case "energy": return "mech-custom-equipment-weapons-energy";
        case "ballistic": return "mech-custom-equipment-weapons-ballistic";
        case "missile": return "mech-custom-equipment-weapons-missile";
        default: return "mech-custom-equipment-weapons-misc";
    }
}

const unknownValues = (value: unknown): unknown => {
    if (value === null || typeof value === "number") return null;
    if (typeof value === "string") return "";
    if (typeof value === "boolean") return false;
    if (Array.isArray(value)) return [];
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, unknownValues(entry)]));
};

/** The target catalog's first entry (canon's first record for an empty component catalog), every value unknown. */
export function blankTemplate(kind: CustomContentKind, targetCatalogId: string): Record<string, unknown> {
    const first = kind === "equipment" || kind === "ammunition"
        ? getEquipmentCatalogById(targetCatalogId)?.[0]
        : CANON_COMPONENT_TEMPLATES[kind];
    return unknownValues(JSON.parse(JSON.stringify(first ?? {}))) as Record<string, unknown>;
}

export const REQUIRED_FIELDS: Record<CustomContentKind, string[]> = {
    equipment: ["weight", "space.battlemech", "battleValue", "cbills", "introduced"],
    ammunition: ["weight", "roundsPerTon", "battleValue", "cbills", "introduced"],
    armor: ["armorMultiplier.is", "armorMultiplier.clan", "costMultiplier", "introduced"],
    structure: ["crits.is", "crits.clan", "cost", "introduced"],
    engine: ["costMultiplier", "introduced"],
    gyro: ["weight_multiplier", "criticals", "costMultiplier", "introduced"],
    heatSink: ["dissipation", "cost", "introduced"],
    jumpJet: ["weight_multiplier.light", "weight_multiplier.medium", "weight_multiplier.heavy", "criticals", "costMultiplier", "introduced"],
    myomer: ["criticals", "costPerTon", "bvWeightMultiplier", "introduced"],
};
const WEAPON_FIELDS = ["damage", "heat", "range.short", "range.medium", "range.long"];

const valueAt = (record: Record<string, unknown>, path: string): unknown =>
    path.split(".").reduce<unknown>((value, key) => (value as Record<string, unknown> | null)?.[key], record);

export function missingFields(draft: ICustomContentDraft): string[] {
    const isWeapon = draft.kind === "equipment" && draft.targetCatalogId !== "mech-custom-equipment-weapons-misc";
    const paths = [...REQUIRED_FIELDS[draft.kind], ...(isWeapon ? WEAPON_FIELDS : [])];
    const missing = paths.filter((path) => {
        const value = valueAt(draft.record, path);
        return value === null || value === undefined || value === "";
    });
    if (draft.slotsEstimated && draft.kind === "equipment") missing.push("slotsEstimated");
    if (draft.kind === "equipment") {
        // Domain legality is always an explicit choice: a slot count, or -1 for "cannot be mounted".
        for (const [key, value] of Object.entries((draft.record.space ?? {}) as Record<string, unknown>)) {
            if (value === null) missing.push(`space.${key}`);
        }
    }
    return missing;
}

export function draftMatches(draft: ICustomContentDraft, item: ISSWUnresolvedItem): boolean {
    const names = [draft.record.name, ...((draft.record.altNames as string[] | undefined) ?? [])]
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.trim().toLowerCase());
    const sameFaction = draft.faction === "universal" || draft.faction === item.faction;
    return draft.kind === item.kind && sameFaction && names.includes(item.name.trim().toLowerCase());
}

const addSource = (draft: ICustomContentDraft, entry: IDraftSourceEntry): void => {
    const existing = draft.sourceFiles.find((source) => source.fileName === entry.source.fileName);
    if (!existing) {
        draft.sourceFiles.push({ ...entry.source, designs: [entry.design] });
    } else if (!existing.designs.includes(entry.design)) {
        existing.designs.push(entry.design);
    }
    if (entry.xml !== undefined) {
        draft.sourceXml = { ...(draft.sourceXml ?? {}), [entry.source.fileName]: entry.xml };
    }
};

const newDraft = (entry: IDraftSourceEntry, id: string): ICustomContentDraft => {
    const kind = entry.item.kind as CustomContentKind;
    const targetCatalogId = targetCatalogFor(kind, entry.item.sswType);
    const record = blankTemplate(kind, targetCatalogId);
    const isAmmo = kind === "ammunition";
    record.name = entry.item.name;
    record.tag = buildCustomTag({
        submitter: PROVISIONAL_SUBMITTER, faction: entry.item.faction,
        slug: isAmmo ? ammoSlug(entry.item.name) : slugifyName(entry.item.name), isAmmo,
    });
    record.altNames = [entry.item.name];
    if ("altTags" in record) record.altTags = [];
    if ("book" in record || kind === "equipment" || isAmmo) record.book = "Custom";
    if ("page" in record) record.page = null;
    if (isAmmo) { record.isAmmo = true; record.isSpecialAmmo = false; }
    if (entry.item.tons !== null && "weight" in record) record.weight = entry.item.tons;
    if (kind === "equipment" && record.space && typeof record.space === "object") {
        (record.space as Record<string, unknown>).battlemech = entry.slots;
    }
    record.notes = `Placeholder drafted from the SSW import of ${entry.design}; stats not yet entered.`;
    return {
        id, kind, faction: entry.item.faction, targetCatalogId, record, status: "draft",
        slotsEstimated: kind === "equipment", sourceFiles: [], sourceNote: "",
    };
};

export function buildDrafts(
    entries: IDraftSourceEntry[],
    existing: ICustomContentDraft[],
    newId: () => string = () => crypto.randomUUID(),
): ICustomContentDraft[] {
    const drafts = existing.map((draft) => JSON.parse(JSON.stringify(draft)) as ICustomContentDraft);
    for (const entry of entries) {
        if (entry.item.kind === "cockpit" || isSSWCanonPending(entry.item.kind, entry.item.name)) continue;
        let draft = drafts.find((candidate) => draftMatches(candidate, entry.item));
        if (!draft) {
            draft = newDraft(entry, newId());
            drafts.push(draft);
        }
        addSource(draft, entry);
    }
    return drafts;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run --project unit src/utils/sswDraftBuilder.test.ts`
Expected: PASS. If `blankTemplate("ammunition", ...)` keys differ from `isAmmo, isSpecialAmmo, name`, check the first entry of `mech-custom-ammo.ts`. The test is right, because the "canonical ammo format" test enforces that order.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sswDraftBuilder.ts src/utils/sswDraftBuilder.test.ts
git commit -m "SSW: build custom content drafts from unresolved items"
```

---

### Task 8: SSW import session

**Files:**
- Create: `src/utils/sswImportSession.ts`
- Test: `src/utils/sswImportSession.test.ts`

**Interfaces:**
- Consumes: `BattleMech.importSSWXML`, `getSSWUnresolved`, `getCriticalOccupancy`, `sswImportErrors`, `getBattleValue`, `getName`, `model` (getter); `getSSWXMLBasicInfo`; Task 7 `buildDrafts`, `estimateSlots`, `draftMatches`; Task 6 `isSSWCanonPending`; Task 3 `saveLocalCustomContentDrafts`, `getLocalCustomContentDrafts`.
- Produces:
  - `interface ISSWImportFile { fileName: string; xml: string }`
  - `type SSWImportStatus = "clean" | "warnings" | "unresolved" | "canonPending" | "failed"`
  - `interface ISSWImportResult { fileName; xml; sha256; designName; mech: BattleMech | null; status; failureReason?: string; sswBV2: number | null; ourBV: number | null; unresolved: ISSWUnresolvedItem[]; canonPending: string[]; warnings: string[]; draftIds: string[] }`
  - `runSSWImportSession(files: ISSWImportFile[], options?: { existingDrafts?: ICustomContentDraft[]; save?: (drafts) => boolean; newId?: () => string }): Promise<{ results: ISSWImportResult[]; drafts: ICustomContentDraft[]; saved: boolean }>`
  - `sha256Hex(text: string): Promise<string>`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/sswImportSession.test.ts
import { describe, expect, it } from "vitest";
import { sswMechs } from "../data/ssw/sswMechs";
import { registerLocalCustomContent } from "../data/custom-content-local";
import type { ICustomContentDraft } from "../data/custom-content-types";
import { runSSWImportSession } from "./sswImportSession";

const griffin = sswMechs.find((xml) => /name="Griffin" model="GRF-1N"/.test(xml))!;
const withWidget = griffin.replace(/\(IS\) PPC</, "(IS) Widget Cannon<");
let saved: ICustomContentDraft[] = [];
const options = () => ({ existingDrafts: [] as ICustomContentDraft[], save: (drafts: ICustomContentDraft[]) => { saved = drafts; registerLocalCustomContent(drafts); return true; } });

describe("SSW import session", () => {
    it("a clean file is clean and has our BV and SSW's", async () => {
        const { results } = await runSSWImportSession([{ fileName: "griffin.ssw", xml: griffin }], options());
        expect(results[0]).toMatchObject({ status: "clean", designName: "Griffin GRF-1N" });
        expect(results[0].sswBV2).toBeGreaterThan(0);
        expect(results[0].ourBV).toBeGreaterThan(0);
        expect(results[0].sha256).toMatch(/^[0-9a-f]{64}$/);
    });

    it("a malformed file fails alone", async () => {
        const { results } = await runSSWImportSession([
            { fileName: "broken.ssw", xml: "<mech><unclosed>" },
            { fileName: "notes.ssw", xml: "hello" },
            { fileName: "griffin.ssw", xml: griffin },
        ], options());
        expect(results.map((r) => r.status)).toEqual(["failed", "failed", "clean"]);
        expect(results[0].failureReason).toBeTruthy();
    });

    it("a non-BattleMech design fails with the reason", async () => {
        const industrial = griffin.replace("<mech_type>BattleMech</mech_type>", "<mech_type>IndustrialMech</mech_type>");
        const { results } = await runSSWImportSession([{ fileName: "agro.ssw", xml: industrial }], options());
        expect(results[0]).toMatchObject({ status: "failed" });
        expect(results[0].failureReason).toMatch(/IndustrialMech/);
    });

    it("an unknown weapon becomes one draft, and the design is re-imported with its placeholder", async () => {
        const { results, drafts } = await runSSWImportSession([
            { fileName: "a.ssw", xml: withWidget },
            { fileName: "b.ssw", xml: withWidget.replace('model="GRF-1N"', 'model="GRF-1X"') },
        ], options());
        expect(drafts).toHaveLength(1);
        expect(drafts[0].sourceFiles.map((s) => s.fileName)).toEqual(["a.ssw", "b.ssw"]);
        expect((drafts[0].record.space as Record<string, unknown>).battlemech).toBe(3);
        expect(results.map((r) => r.status)).toEqual(["unresolved", "unresolved"]);
        expect(results[0].draftIds).toEqual([drafts[0].id]);
        expect(drafts[0].sourceXml?.["a.ssw"]).toBe(withWidget);
        expect(JSON.stringify(results[0].mech!.export(true))).toContain(drafts[0].record.tag as string);
        expect(saved).toHaveLength(1);
    });
});
```

Check the Griffin XML for `<mech_type>BattleMech</mech_type>`. If the file writes it differently, copy its exact spelling into the replace.

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run --project unit src/utils/sswImportSession.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/utils/sswImportSession.ts
import { BattleMech } from "../classes/battlemech";
import { getLocalCustomContentDrafts, saveLocalCustomContentDrafts } from "../data/custom-content-local";
import type { ICustomContentDraft, ISSWUnresolvedItem } from "../data/custom-content-types";
import { isSSWCanonPending } from "../data/ssw/ssw-canon-pending-names";
import { getSSWXMLBasicInfo } from "./getSSWXMLBasicInfo";
import { buildDrafts, draftMatches, estimateSlots, IDraftSourceEntry } from "./sswDraftBuilder";

// Imports a batch of .ssw files: one result per file, the unresolved items turned into custom drafts (one per
// name across the batch), and the affected designs imported again with the drafts registered so they carry
// placeholders.

export interface ISSWImportFile { fileName: string; xml: string; }
export type SSWImportStatus = "clean" | "warnings" | "unresolved" | "canonPending" | "failed";
export interface ISSWImportResult {
    fileName: string;
    xml: string;
    sha256: string;
    designName: string;
    mech: BattleMech | null;
    status: SSWImportStatus;
    failureReason?: string;
    sswBV2: number | null;
    ourBV: number | null;
    unresolved: ISSWUnresolvedItem[];
    canonPending: string[];
    warnings: string[];
    draftIds: string[];
}

export async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const importOne = (xml: string): BattleMech => {
    const mech = new BattleMech();
    mech.importSSWXML(xml);
    return mech;
};

const fail = (base: Pick<ISSWImportResult, "fileName" | "xml" | "sha256">, reason: string): ISSWImportResult => ({
    ...base, designName: base.fileName, mech: null, status: "failed", failureReason: reason, sswBV2: null, ourBV: null,
    unresolved: [], canonPending: [], warnings: [], draftIds: [],
});

export async function runSSWImportSession(
    files: ISSWImportFile[],
    options: { existingDrafts?: ICustomContentDraft[]; save?: (drafts: ICustomContentDraft[]) => boolean; newId?: () => string } = {},
): Promise<{ results: ISSWImportResult[]; drafts: ICustomContentDraft[]; saved: boolean }> {
    const results: ISSWImportResult[] = [];
    const entries: IDraftSourceEntry[] = [];

    for (const file of files) {
        const base = { fileName: file.fileName, xml: file.xml, sha256: await sha256Hex(file.xml) };
        let info: ReturnType<typeof getSSWXMLBasicInfo> = null;
        try {
            info = getSSWXMLBasicInfo(file.xml);
        } catch (error) {
            results.push(fail(base, `Not a readable SSW file: ${String(error)}`));
            continue;
        }
        if (!info) { results.push(fail(base, "Not an SSW 'Mech file (no <mech> element).")); continue; }
        if (info.mech_type !== "BattleMech") { results.push(fail(base, `${info.mech_type || "This unit type"} designs are not supported yet; only BattleMechs import.`)); continue; }
        try {
            const mech = importOne(file.xml);
            const designName = `${mech.getName()} ${mech.model}`.trim();
            const unresolved = [...mech.getSSWUnresolved()];
            for (const item of unresolved) {
                const slots = estimateSlots(item.slotIndex, mech.getCriticalOccupancy(item.location));
                entries.push({ item, slots, design: designName, source: { fileName: file.fileName, designs: [designName], sha256: base.sha256 }, xml: file.xml });
            }
            results.push({
                ...base, designName, mech, status: "clean", sswBV2: info.bv2 > 0 ? info.bv2 : null, ourBV: mech.getBattleValue(),
                unresolved, canonPending: unresolved.filter((item) => isSSWCanonPending(item.kind, item.name)).map((item) => item.name),
                warnings: mech.sswImportErrors.filter((error) => !unresolved.some((item) => error.includes(`'${item.name}'`) || error.includes(`'${item.sswName}'`))),
                draftIds: [],
            });
        } catch (error) {
            results.push(fail(base, `The import failed: ${String(error)}`));
        }
    }

    const drafts = buildDrafts(entries, options.existingDrafts ?? getLocalCustomContentDrafts(), options.newId);
    const saved = (options.save ?? saveLocalCustomContentDrafts)(drafts);

    for (const result of results) {
        if (result.status === "failed") continue;
        result.draftIds = drafts.filter((draft) => result.unresolved.some((item) => draftMatches(draft, item))).map((draft) => draft.id);
        if (result.draftIds.length > 0) {
            // Again, now that the drafts are registered, so the design carries its placeholders.
            result.mech = importOne(result.xml);
            result.ourBV = result.mech.getBattleValue();
        }
        const otherUnresolved = result.unresolved.filter((item) => !isSSWCanonPending(item.kind, item.name) && item.kind !== "cockpit");
        result.status = otherUnresolved.length > 0 ? "unresolved"
            : result.canonPending.length > 0 ? "canonPending"
                : result.warnings.length > 0 || result.unresolved.length > 0 ? "warnings" : "clean";
    }
    return { results, drafts, saved };
}
```

If `getBattleValue()` needs a pilot or `_calc()` first, call `mech.calcBattleValue?.()` the way the existing BV tests in `battlemech.test.ts` do.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run --project unit src/utils/sswImportSession.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sswImportSession.ts src/utils/sswImportSession.test.ts
git commit -m "SSW: batch import session with drafts and re-import"
```

---

### Task 9: Catalog merge serializer

**Files:**
- Create: `src/utils/customCatalogMerge.ts`
- Test: `src/utils/customCatalogMerge.test.ts`

**Interfaces:**
- Produces:
  - `class TagClashError extends Error { clashes: string[] }`
  - `class IncompleteRecordError extends Error { fields: string[] }`
  - `serializeCatalogRecord(record: Record<string, unknown>, fileContents: string, exportName: string): string`
  - `mergeCatalogRecords(fileContents: string, exportName: string, records: Record<string, unknown>[]): string`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/customCatalogMerge.test.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { IncompleteRecordError, mergeCatalogRecords, serializeCatalogRecord, TagClashError } from "./customCatalogMerge";

const read = (name: string) => readFileSync(join(__dirname, "../data", `${name}.ts`), "utf8");
const parses = (text: string) => ts.transpileModule(text, { reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.ESNext } }).diagnostics ?? [];
const ammoRecord = () => {
    const first = /export const mechCustomAmmo[^=]*=\s*\[\s*(\{[\s\S]*?\n    \}),/.exec(read("mech-custom-ammo"))![1];
    const record = new Function(`return (${first});`)() as Record<string, unknown>;
    return { ...record, name: "Widget Ammo", tag: "ammo-ngcfells-is-widget-standard", altTags: ["ammo-local-is-widget-standard"], altNames: ["Ammo (Widget)"] };
};

describe("custom catalog merge", () => {
    it("adds a record to mech-custom-ammo, keeps the file byte-for-byte above it, and still parses", () => {
        const original = read("mech-custom-ammo");
        const merged = mergeCatalogRecords(original, "mechCustomAmmo", [ammoRecord()]);
        const closing = original.lastIndexOf("];");
        expect(merged.slice(0, original.lastIndexOf("}", closing) + 1)).toBe(original.slice(0, original.lastIndexOf("}", closing) + 1));
        expect(merged).toContain('tag: "ammo-ngcfells-is-widget-standard"');
        expect(parses(merged)).toEqual([]);
    });

    it("writes the fields in the first entry's order", () => {
        const text = serializeCatalogRecord(ammoRecord(), read("mech-custom-ammo"), "mechCustomAmmo");
        const keys = [...text.matchAll(/^\s{8}([A-Za-z]+):/gm)].map((match) => match[1]);
        expect(keys.slice(0, 5)).toEqual(["isAmmo", "isSpecialAmmo", "name", "altNames", "tag"]);
    });

    it("merges into an empty component catalog", () => {
        const merged = mergeCatalogRecords(read("mech-custom-armor-types"), "mechCustomArmorTypes", [{ name: "Widget Plate", tag: "ngcfells-is-widget-plate", introduced: 3070, extinct: null }]);
        expect(merged).toMatch(/mechCustomArmorTypes: IArmorType\[\] = \[\n    \{\n        name: "Widget Plate",/);
        expect(parses(merged)).toEqual([]);
    });

    it("handles a last entry with no trailing comma", () => {
        const text = 'export const list: X[] = [\n    {\n        name: "A",\n        tag: "a"\n    }\n];\n';
        const merged = mergeCatalogRecords(text, "list", [{ name: "B", tag: "b" }]);
        expect(merged).toBe('export const list: X[] = [\n    {\n        name: "A",\n        tag: "a"\n    },\n    {\n        name: "B",\n        tag: "b",\n    },\n];\n');
    });

    it("refuses a tag, alternate tag or name already in the file", () => {
        const text = 'export const list: X[] = [\n    {\n        name: "A",\n        tag: "a",\n        altTags: ["old-a"],\n    },\n];\n';
        expect(() => mergeCatalogRecords(text, "list", [{ name: "B", tag: "old-a" }])).toThrow(TagClashError);
        expect(() => mergeCatalogRecords(text, "list", [{ name: "a", tag: "b" }])).toThrow(TagClashError);
    });

    it("refuses a record with an unknown (null) stat, but allows unknown dates", () => {
        expect(() => serializeCatalogRecord({ name: "B", tag: "b", battleValue: null }, "", "list")).toThrow(IncompleteRecordError);
        expect(serializeCatalogRecord({ name: "B", tag: "b", extinct: null, reintroduced: null }, "", "list")).toContain("extinct: null");
    });
});
```

Check that `typescript` is importable from tests (it is a devDependency of every Vite TS project). If it isn't, replace `parses` with `new Function` evaluation of the array literal.

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run --project unit src/utils/customCatalogMerge.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/utils/customCatalogMerge.ts
// Adds custom records to a catalog file's text: written in the file's own style (field order of its first
// entry, 4-space indentation, double quotes, trailing commas) and inserted before the export's closing "];".
// Existing entries are never touched, so a pull request's diff is additions only.

const NULLABLE_FIELDS = new Set(["introduced", "extinct", "reintroduced", "prototype", "page"]);

export class TagClashError extends Error {
    constructor(public clashes: string[]) {
        super(`Already in the catalog: ${clashes.join(", ")}`);
        this.name = "TagClashError";
    }
}

export class IncompleteRecordError extends Error {
    constructor(public fields: string[]) {
        super(`Unknown values cannot be written to a catalog: ${fields.join(", ")}`);
        this.name = "IncompleteRecordError";
    }
}

const exportArrayBounds = (fileContents: string, exportName: string): { open: number; close: number } | null => {
    const start = new RegExp(`export const ${exportName}\\b[^=]*=\\s*\\[`).exec(fileContents);
    if (!start) return null;
    const open = start.index + start[0].length;
    let depth = 1;
    let inString: string | null = null;
    for (let index = open; index < fileContents.length; index++) {
        const char = fileContents[index];
        if (inString) {
            if (char === "\\") index++;
            else if (char === inString) inString = null;
            continue;
        }
        if (char === '"' || char === "'" || char === "`") inString = char;
        else if (char === "/" && fileContents[index + 1] === "/") index = fileContents.indexOf("\n", index);
        else if (char === "[" || char === "{" || char === "(") depth++;
        else if (char === "]" || char === "}" || char === ")") {
            depth--;
            if (depth === 0) return { open, close: index };
        }
    }
    return null;
};

/** Top-level keys of the export's first entry, in order. */
const firstEntryKeys = (fileContents: string, exportName: string): string[] => {
    const bounds = exportArrayBounds(fileContents, exportName);
    if (!bounds) return [];
    const body = fileContents.slice(bounds.open, bounds.close);
    const first = body.indexOf("{");
    if (first < 0) return [];
    const keys: string[] = [];
    let depth = 0;
    for (const match of body.slice(first).matchAll(/[{}[\]]|(?:^|[\s,{])([A-Za-z_][A-Za-z0-9_]*)\s*:/gm)) {
        const token = match[0].trim();
        if (token === "{" || token === "[") { depth++; continue; }
        if (token === "}" || token === "]") { depth--; if (depth === 0) break; continue; }
        if (depth === 1 && match[1]) keys.push(match[1]);
    }
    return keys;
};

const nullFields = (value: unknown, path: string): string[] => {
    if (value === null) return NULLABLE_FIELDS.has(path.split(".").pop() ?? "") ? [] : [path];
    if (Array.isArray(value)) return value.flatMap((entry, index) => nullFields(entry, `${path}[${index}]`));
    if (typeof value === "object") return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => nullFields(entry, path ? `${path}.${key}` : key));
    return [];
};

const literal = (value: unknown, indent: string): string => {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map((entry) => literal(entry, indent)).join(", ")}]`;
    const inner = `${indent}    `;
    const lines = Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => `${inner}${/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : JSON.stringify(key)}: ${literal(entry, inner)},`);
    return `{\n${lines.join("\n")}\n${indent}}`;
};

export function serializeCatalogRecord(record: Record<string, unknown>, fileContents: string, exportName: string): string {
    const missing = nullFields(record, "");
    if (missing.length > 0) throw new IncompleteRecordError(missing);
    const order = firstEntryKeys(fileContents, exportName);
    const ordered: Record<string, unknown> = {};
    for (const key of order) if (key in record) ordered[key] = record[key];
    for (const key of Object.keys(record)) if (!(key in ordered)) ordered[key] = record[key];
    return `    ${literal(ordered, "    ")},`;
}

export function mergeCatalogRecords(fileContents: string, exportName: string, records: Record<string, unknown>[]): string {
    const bounds = exportArrayBounds(fileContents, exportName);
    if (!bounds) throw new Error(`No exported array named ${exportName}`);
    const body = fileContents.slice(bounds.open, bounds.close);
    const taken = new Set([...body.matchAll(/\b(?:tag|name)\s*:\s*"([^"]+)"|"([^"]+)"/g)].map((match) => (match[1] ?? match[2]).toLowerCase()));
    const clashes = records.flatMap((record) => [record.tag, record.name, ...((record.altTags as string[] | undefined) ?? [])])
        .filter((value): value is string => typeof value === "string" && value !== "" && taken.has(value.toLowerCase()));
    if (clashes.length > 0) throw new TagClashError(clashes);

    const additions = records.map((record) => serializeCatalogRecord(record, fileContents, exportName)).join("\n");
    const before = fileContents.slice(0, bounds.close).replace(/\s*$/, "");
    const needsComma = !before.endsWith("[") && !before.endsWith(",");
    return `${before}${needsComma ? "," : ""}\n${additions}\n${fileContents.slice(bounds.close)}`;
}
```

The `taken` set is deliberately broad: every quoted string in the array, which covers tags, `altTags` and names.
That can over-report a clash (a note that quotes a tag). A false clash stops a submission with a clear message,
and a missed clash would ship a duplicate tag, so the safer error wins.

- [ ] **Step 4: Run the tests, then prove the result passes the catalog tests**

Run: `npx vitest run --project unit src/utils/customCatalogMerge.test.ts`
Expected: PASS. If the empty-catalog test's whitespace differs, fix `mergeCatalogRecords` so it produces `[\n    {` exactly.

Then, as a one-off check (not committed): write the merged `mech-custom-ammo.ts` from the first test over the real
file, run `npx vitest run --project unit src/data/equipment-registry.test.ts`, and confirm the canonical ammo format
and tag-uniqueness tests pass. Then `git checkout src/data/mech-custom-ammo.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/utils/customCatalogMerge.ts src/utils/customCatalogMerge.test.ts
git commit -m "Custom content: merge records into a catalog file in its own style"
```

---

### Task 10: Multi-file GitHub contribution with an evidence branch and rollback

**Files:**
- Modify: `src/utils/githubContribution.ts`
- Test: `src/utils/githubContribution.test.ts` (new)

**Interfaces:**
- Produces:
  - `getGithubLogin(token: string): Promise<string>`
  - `interface IGithubMultiFileContributionRequest` (below)
  - `submitGithubMultiFileContribution(request): Promise<{ pullRequestUrl: string; branch: string; evidenceBranchUrl: string | null }>`
- Existing exports (`submitEquipmentCatalogContribution`, `submitGithubFileContribution`, `IGithubContributionRequest`) keep their behaviour.

- [ ] **Step 1: Write the failing tests (mocked `fetch`)**

```ts
// src/utils/githubContribution.test.ts
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { submitGithubMultiFileContribution } from "./githubContribution";

type Call = { method: string; url: string; body?: any };
const calls: Call[] = [];
const respond = (status: number, body: unknown) => new Response(status === 204 ? null : JSON.stringify(body), { status });

const mockGithub = (overrides: { failPull?: boolean } = {}) => {
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
        const method = init.method ?? "GET";
        const body = init.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ method, url: url.replace("https://api.github.com", ""), body });
        const path = url.replace("https://api.github.com", "");
        if (path === "/user") return respond(200, { login: "ngcfells" });
        if (path === "/repos/ngcfells/battletech-tools") return respond(200, { default_branch: "master" });
        if (path.startsWith("/repos/ngcfells/battletech-tools/contents/")) return respond(200, { content: btoa("export const list = [\n];\n") });
        if (path.endsWith("/git/ref/heads/master")) return respond(200, { object: { sha: "base" } });
        if (path.endsWith("/git/commits/base")) return respond(200, { tree: { sha: "basetree" } });
        if (path.endsWith("/git/blobs")) return respond(201, { sha: `blob${calls.length}` });
        if (path.endsWith("/git/trees")) return respond(201, { sha: `tree${calls.length}` });
        if (path.endsWith("/git/commits")) return respond(201, { sha: `commit${calls.length}` });
        if (path.endsWith("/git/refs")) return respond(201, {});
        if (path.includes("/git/refs/heads/") && method === "DELETE") return respond(204, null);
        if (path.endsWith("/pulls")) return overrides.failPull ? respond(422, { message: "nope" }) : respond(201, { html_url: "https://github.com/pr/1" });
        return respond(404, { message: `unmocked ${method} ${path}` });
    }));
};

const request = (contents = (current: string | null) => `${current}// added\n`) => ({
    token: "t", targetOwner: "ngcfells", targetRepo: "battletech-tools", submissionId: "ngcfells-20260930-abc123",
    files: [{ path: "src/data/mech-custom-ammo.ts", contents }, { path: "src/data/mech-custom-armor-types.ts", contents }],
    evidenceFiles: [{ path: "tools/custom-content-submissions/ngcfells-20260930-abc123/a.ssw", contents: "<mech/>" }],
    commitMessage: "Custom content", pullRequestTitle: "Custom content: 2 records",
    pullRequestBody: (evidence: string | null) => `evidence: ${evidence}`,
});

afterEach(() => { calls.length = 0; vi.unstubAllGlobals(); });

describe("multi-file GitHub contribution", () => {
    it("commits all files on one branch, the evidence on another, and opens one PR", async () => {
        mockGithub();
        const result = await submitGithubMultiFileContribution(request());
        expect(result.pullRequestUrl).toBe("https://github.com/pr/1");
        const refs = calls.filter((c) => c.url.endsWith("/git/refs")).map((c) => c.body.ref);
        expect(refs).toEqual(["refs/heads/custom-content/ngcfells-20260930-abc123", "refs/heads/custom-content-evidence/ngcfells-20260930-abc123"]);
        const pull = calls.find((c) => c.url.endsWith("/pulls"))!;
        expect(pull.body.head).toBe("ngcfells:custom-content/ngcfells-20260930-abc123");
        expect(pull.body.body).toContain("https://github.com/ngcfells/battletech-tools/tree/custom-content-evidence/ngcfells-20260930-abc123");
        const trees = calls.filter((c) => c.url.endsWith("/git/trees"));
        expect(trees[0].body.tree.map((t: any) => t.path)).toEqual(["src/data/mech-custom-ammo.ts", "src/data/mech-custom-armor-types.ts"]);
    });

    it("writes nothing when building a file throws (a tag clash)", async () => {
        mockGithub();
        await expect(submitGithubMultiFileContribution(request(() => { throw new Error("clash"); }))).rejects.toThrow("clash");
        expect(calls.some((c) => c.method !== "GET")).toBe(false);
    });

    it("deletes both branches when the PR cannot be opened", async () => {
        mockGithub({ failPull: true });
        await expect(submitGithubMultiFileContribution(request())).rejects.toThrow(/HTTP 422/);
        expect(calls.filter((c) => c.method === "DELETE").map((c) => c.url)).toEqual([
            "/repos/ngcfells/battletech-tools/git/refs/heads/custom-content/ngcfells-20260930-abc123",
            "/repos/ngcfells/battletech-tools/git/refs/heads/custom-content-evidence/ngcfells-20260930-abc123",
        ]);
    });
});
```

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run --project unit src/utils/githubContribution.test.ts`
Expected: FAIL, `submitGithubMultiFileContribution` is not exported.

- [ ] **Step 3: Implement**

Extract the "who am I, default branch, fork if needed" steps into a helper, and use it from both flows:

```ts
interface IHeadRepository { login: string; headOwner: string; defaultBranch: string; }

export async function getGithubLogin(token: string): Promise<string> {
    if (!token || !token.trim()) {
        throw new Error("A GitHub personal access token is required to submit a contribution.");
    }
    return (await githubRequest<{ login: string }>(`${GITHUB_API_BASE}/user`, token)).login;
}

async function prepareHeadRepository(token: string, upstreamOwner: string, upstreamRepo: string): Promise<IHeadRepository> {
    const login = await getGithubLogin(token);
    const { default_branch: defaultBranch } = await githubRequest<{ default_branch: string }>(
        `${GITHUB_API_BASE}/repos/${upstreamOwner}/${upstreamRepo}`, token);
    // The repo owner can't fork their own repo, so they branch in it directly.
    const ownsUpstream = login.toLowerCase() === upstreamOwner.toLowerCase();
    const headOwner = ownsUpstream ? upstreamOwner : login;
    if (!ownsUpstream) {
        // ...move the existing fork-and-poll block here unchanged...
    }
    return { login, headOwner, defaultBranch };
}
```

In `submitEquipmentCatalogContribution`, replace the first lines through the fork block with:

```ts
    const { headOwner, defaultBranch } = await prepareHeadRepository(token, upstreamOwner, upstreamRepo);
```

Then add the multi-file flow:

```ts
export interface IGithubMultiFileContributionRequest {
    token: string;
    targetOwner: string;
    targetRepo: string;
    /** <submitter>-<yyyymmdd>-<random>; names both branches. */
    submissionId: string;
    // Each file's new text, built from its current text on the target's default branch (null when absent). A
    // throw (such as a tag clash) stops the submission before anything is written.
    files: { path: string; contents: (currentContents: string | null) => string }[];
    evidenceFiles?: { path: string; contents: string }[];
    commitMessage: string;
    pullRequestTitle: string;
    pullRequestBody: (evidenceBranchUrl: string | null) => string;
}

async function commitFiles(token: string, owner: string, repo: string, baseSha: string, files: { path: string; contents: string }[], message: string): Promise<string> {
    const baseCommit = await githubRequest<{ tree: { sha: string } }>(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits/${baseSha}`, token);
    const tree = [];
    for (const file of files) {
        const blob = await githubRequest<{ sha: string }>(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/blobs`, token, {
            method: "POST", body: JSON.stringify({ content: toBase64(file.contents), encoding: "base64" }),
        });
        tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    const newTree = await githubRequest<{ sha: string }>(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees`, token, {
        method: "POST", body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
    });
    const commit = await githubRequest<{ sha: string }>(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits`, token, {
        method: "POST", body: JSON.stringify({ message, tree: newTree.sha, parents: [baseSha] }),
    });
    return commit.sha;
}

export async function submitGithubMultiFileContribution(
    request: IGithubMultiFileContributionRequest,
): Promise<{ pullRequestUrl: string; branch: string; evidenceBranchUrl: string | null }> {
    const { token, targetOwner, targetRepo, submissionId } = request;
    const { headOwner, defaultBranch } = await prepareHeadRepository(token, targetOwner, targetRepo);

    // Build every file first: a failure here leaves nothing behind.
    const files: { path: string; contents: string }[] = [];
    for (const file of request.files) {
        let current: string | null = null;
        try {
            const existing = await githubRequest<{ content: string }>(
                `${GITHUB_API_BASE}/repos/${targetOwner}/${targetRepo}/contents/${file.path}?ref=${defaultBranch}`, token);
            current = fromBase64(existing.content);
        } catch {
            current = null;
        }
        files.push({ path: file.path, contents: file.contents(current) });
    }

    const baseSha = (await githubRequest<{ object: { sha: string } }>(
        `${GITHUB_API_BASE}/repos/${headOwner}/${targetRepo}/git/ref/heads/${defaultBranch}`, token)).object.sha;
    const branch = `custom-content/${submissionId}`;
    const evidenceBranch = `custom-content-evidence/${submissionId}`;
    const createdRefs: string[] = [];
    const createRef = async (name: string, sha: string) => {
        await githubRequest(`${GITHUB_API_BASE}/repos/${headOwner}/${targetRepo}/git/refs`, token, {
            method: "POST", body: JSON.stringify({ ref: `refs/heads/${name}`, sha }),
        });
        createdRefs.push(name);
    };

    try {
        await createRef(branch, await commitFiles(token, headOwner, targetRepo, baseSha, files, request.commitMessage));
        let evidenceBranchUrl: string | null = null;
        if (request.evidenceFiles && request.evidenceFiles.length > 0) {
            const evidenceSha = await commitFiles(token, headOwner, targetRepo, baseSha, request.evidenceFiles,
                `Evidence for ${branch} (review only; never merge this branch)`);
            await createRef(evidenceBranch, evidenceSha);
            evidenceBranchUrl = `https://github.com/${headOwner}/${targetRepo}/tree/${evidenceBranch}`;
        }
        const pullRequest = await githubRequest<{ html_url: string }>(`${GITHUB_API_BASE}/repos/${targetOwner}/${targetRepo}/pulls`, token, {
            method: "POST",
            body: JSON.stringify({
                title: request.pullRequestTitle, head: `${headOwner}:${branch}`, base: defaultBranch,
                body: request.pullRequestBody(evidenceBranchUrl), maintainer_can_modify: true,
            }),
        });
        return { pullRequestUrl: pullRequest.html_url, branch, evidenceBranchUrl };
    } catch (error) {
        for (const name of createdRefs) {
            try {
                await githubRequest(`${GITHUB_API_BASE}/repos/${headOwner}/${targetRepo}/git/refs/heads/${name}`, token, { method: "DELETE" });
            } catch {
                // Best effort: a branch left behind is harmless and can be deleted by hand.
            }
        }
        throw error;
    }
}
```

Update the file's header comment: "commit the exported catalog file(s) to a new branch".

- [ ] **Step 4: Run the tests, then check the existing callers still compile**

Run: `npx vitest run --project unit src/utils/githubContribution.test.ts`, then `npx tsc --noEmit -p tsconfig.json`.
Expected: PASS; 0 tsc errors.

- [ ] **Step 5: Commit**

```bash
git add src/utils/githubContribution.ts src/utils/githubContribution.test.ts
git commit -m "GitHub contribution: multi-file PR with an evidence branch and rollback"
```

---

### Task 11: Submission orchestrator, configuration and `.gitignore`

**Files:**
- Create: `src/utils/customContentSubmission.ts`
- Modify: `src/configVars.ts`, `.gitignore`
- Test: `src/utils/customContentSubmission.test.ts`

**Interfaces:**
- Consumes: Task 2 `sanitizeSubmitter`, `finalizeTag`; Task 3 store; Task 4 `CUSTOM_COMPONENT_CATALOGS`; Task 7 `missingFields`; Task 9 `mergeCatalogRecords`; Task 10 `getGithubLogin`, `submitGithubMultiFileContribution`; `getEquipmentCatalogExportName`.
- Produces:
  - `finalizeDraft(draft: ICustomContentDraft, submitter: string): ICustomContentDraft`
  - `makeSubmissionId(submitter: string, now?: Date, random?: () => string): string`
  - `buildPullRequestBody(drafts: ICustomContentDraft[], sourceNote: string, evidenceBranchUrl: string | null): string`
  - `submitCustomContent(args: { token: string; drafts: ICustomContentDraft[]; xmlByFileName: Record<string, string>; sourceNote: string; deps?: { getLogin, submit } }): Promise<{ pullRequestUrl: string; drafts: ICustomContentDraft[] }>`

- [ ] **Step 1: Configuration**

Append to `src/configVars.ts`:

```ts
// Where "Submit custom content" opens its pull request, and where the source .ssw files go on the separate
// evidence branch (never merged). A fork that wants submissions sent to itself changes these three.
export const CONST_CUSTOM_CONTENT_GITHUB_OWNER = "ngcfells";
export const CONST_CUSTOM_CONTENT_GITHUB_REPO = "battletech-tools";
export const CONST_CUSTOM_CONTENT_EVIDENCE_PATH = "tools/custom-content-submissions";
```

Append to `.gitignore`:

```text
# Custom content submission evidence lives on custom-content-evidence/* branches only
tools/custom-content-submissions/
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/utils/customContentSubmission.test.ts
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { getLocalCustomContentDrafts, registerLocalCustomContent, saveLocalCustomContentDrafts } from "../data/custom-content-local";
import type { ICustomContentDraft } from "../data/custom-content-types";
import { mechCustomEquipmentMisc } from "../data/mech-custom-equipment-weapons-misc";
import { buildPullRequestBody, finalizeDraft, makeSubmissionId, submitCustomContent } from "./customContentSubmission";

const complete = (): ICustomContentDraft => ({
    id: "d1", kind: "equipment", faction: "is", targetCatalogId: "mech-custom-equipment-weapons-misc",
    record: { ...JSON.parse(JSON.stringify(mechCustomEquipmentMisc[0])), name: "Widget Array", tag: "local-is-widget-array", altNames: ["Widget Array"], altTags: [] },
    status: "complete", slotsEstimated: false,
    sourceFiles: [{ fileName: "a.ssw", designs: ["Griffin GRF-1X"], sha256: "f".repeat(64) }], sourceNote: "",
});

afterEach(() => { localStorage.clear(); registerLocalCustomContent([]); });

describe("custom content submission", () => {
    it("finalizes the tag and keeps the provisional one as an alternate", () => {
        const draft = finalizeDraft(complete(), "ngcfells");
        expect(draft.record.tag).toBe("ngcfells-is-widget-array");
        expect(draft.record.altTags).toEqual(["local-is-widget-array"]);
    });

    it("makes a submission id from the login, date and a random suffix", () => {
        expect(makeSubmissionId("ngcfells", new Date("2026-09-30T12:00:00Z"), () => "abc123")).toBe("ngcfells-20260930-abc123");
    });

    it("writes the PR body with records, sources, hashes, evidence link and the homebrew warning", () => {
        const body = buildPullRequestBody([finalizeDraft(complete(), "ngcfells")], "From my campaign", "https://github.com/x/tree/e");
        expect(body).toContain("ngcfells-is-widget-array");
        expect(body).toContain("Griffin GRF-1X");
        expect(body).toContain("f".repeat(64));
        expect(body).toContain("https://github.com/x/tree/e");
        expect(body).toContain("From my campaign");
        expect(body).toContain("User-supplied, unverified homebrew");
    });

    it("refuses an incomplete draft before contacting GitHub", async () => {
        const getLogin = vi.fn();
        const draft = { ...complete(), status: "draft" as const };
        await expect(submitCustomContent({ token: "t", drafts: [draft], xmlByFileName: {}, sourceNote: "", deps: { getLogin, submit: vi.fn() } })).rejects.toThrow(/not complete/);
        expect(getLogin).not.toHaveBeenCalled();
    });

    it("a design saved with the provisional tag still loads after finalization", async () => {
        saveLocalCustomContentDrafts([complete()]);
        const mech = new BattleMech();
        mech.addEquipmentFromTag("local-is-widget-array", "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        const saved = mech.exportJSON(true);

        const submit = vi.fn(async () => ({ pullRequestUrl: "https://github.com/pr/2", branch: "b", evidenceBranchUrl: null }));
        await submitCustomContent({ token: "t", drafts: [complete()], xmlByFileName: { "a.ssw": "<mech/>" }, sourceNote: "", deps: { getLogin: async () => "NgcFells", submit } });

        expect(getLocalCustomContentDrafts()[0]).toMatchObject({ prUrl: "https://github.com/pr/2", record: { tag: "ngcfells-is-widget-array" } });
        expect(JSON.stringify(new BattleMech(saved).export(true))).toContain("Widget Array");
    });

    it("sends one file per target catalog and the source files as evidence", async () => {
        const submit = vi.fn(async (_request: any) => ({ pullRequestUrl: "u", branch: "b", evidenceBranchUrl: null }));
        await submitCustomContent({ token: "t", drafts: [complete()], xmlByFileName: { "a.ssw": "<mech/>" }, sourceNote: "", deps: { getLogin: async () => "ngcfells", submit } });
        const request = submit.mock.calls[0][0];
        expect(request.files.map((f: any) => f.path)).toEqual(["src/data/mech-custom-equipment-weapons-misc.ts"]);
        expect(request.evidenceFiles[0].path).toMatch(/^tools\/custom-content-submissions\/ngcfells-\d{8}-[a-z0-9]{6}\/a\.ssw$/);
        expect(request.files[0].contents('export const mechCustomEquipmentMisc: IEquipmentItem[] = [\n];\n')).toContain('tag: "ngcfells-is-widget-array"');
    });
});
```

- [ ] **Step 3: Run and confirm they fail**

Run: `npx vitest run --project unit src/utils/customContentSubmission.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement**

```ts
// src/utils/customContentSubmission.ts
import { CONST_CUSTOM_CONTENT_EVIDENCE_PATH, CONST_CUSTOM_CONTENT_GITHUB_OWNER, CONST_CUSTOM_CONTENT_GITHUB_REPO } from "../configVars";
import { CUSTOM_COMPONENT_CATALOGS } from "../data/custom-component-registry";
import { getLocalCustomContentDrafts, saveLocalCustomContentDrafts } from "../data/custom-content-local";
import type { CustomComponentKind, ICustomContentDraft } from "../data/custom-content-types";
import { getEquipmentCatalogExportName } from "../data/equipment-registry";
import { mergeCatalogRecords } from "./customCatalogMerge";
import { finalizeTag, sanitizeSubmitter } from "./customTags";
import { getGithubLogin, submitGithubMultiFileContribution } from "./githubContribution";
import { missingFields } from "./sswDraftBuilder";

// Submits complete custom content drafts as one pull request: final submitter tags, one change per custom
// catalog file, and the source .ssw files on a separate evidence branch.

export function finalizeDraft(draft: ICustomContentDraft, submitter: string): ICustomContentDraft {
    const provisional = String(draft.record.tag);
    const finalTag = finalizeTag(provisional, submitter);
    const altTags = [...((draft.record.altTags as string[] | undefined) ?? [])];
    if (finalTag !== provisional && !altTags.includes(provisional)) altTags.push(provisional);
    return { ...draft, record: { ...draft.record, tag: finalTag, altTags } };
}

export function makeSubmissionId(submitter: string, now: Date = new Date(), random: () => string = () => Math.random().toString(36).slice(2, 8).padEnd(6, "0")): string {
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    return `${submitter}-${date}-${random()}`;
}

const exportNameFor = (draft: ICustomContentDraft): string => {
    const component = Object.values(CUSTOM_COMPONENT_CATALOGS).find((catalog) => catalog.id === draft.targetCatalogId);
    const exportName = component?.exportName ?? getEquipmentCatalogExportName(draft.targetCatalogId);
    if (!exportName) throw new Error(`Unknown custom catalog: ${draft.targetCatalogId}`);
    return exportName;
};

export function buildPullRequestBody(drafts: ICustomContentDraft[], sourceNote: string, evidenceBranchUrl: string | null): string {
    const lines = [
        "## Custom content submission",
        "",
        ...drafts.map((draft) => `- **${draft.kind}** \`${draft.record.tag}\` "${draft.record.name}" -> \`src/data/${draft.targetCatalogId}.ts\` (${draft.faction})`),
        "",
        "### Sources",
        ...drafts.flatMap((draft) => draft.sourceFiles.map((source) => `- \`${source.fileName}\` (${source.designs.join(", ")}), SHA-256 \`${source.sha256}\``)),
        "",
        evidenceBranchUrl ? `Source files: ${evidenceBranchUrl} (evidence branch, never merge it; delete it after review).` : "No source files attached.",
        "",
        "### Submitter's notes",
        sourceNote.trim() || "(none)",
        "",
        "> User-supplied, unverified homebrew. Review stats, sources and licensing before merging. Custom content is gated by the Custom Homebrew rules level and never enters canon lists or canon BV/PV.",
    ];
    return lines.join("\n");
}

export async function submitCustomContent(args: {
    token: string;
    drafts: ICustomContentDraft[];
    xmlByFileName: Record<string, string>;
    sourceNote: string;
    deps?: { getLogin?: typeof getGithubLogin; submit?: typeof submitGithubMultiFileContribution };
}): Promise<{ pullRequestUrl: string; drafts: ICustomContentDraft[] }> {
    const incomplete = args.drafts.filter((draft) => draft.status !== "complete" || missingFields(draft).length > 0);
    if (incomplete.length > 0) {
        throw new Error(`These drafts are not complete: ${incomplete.map((draft) => draft.record.name).join(", ")}`);
    }
    const getLogin = args.deps?.getLogin ?? getGithubLogin;
    const submit = args.deps?.submit ?? submitGithubMultiFileContribution;

    const submitter = sanitizeSubmitter(await getLogin(args.token));
    const finalized = args.drafts.map((draft) => finalizeDraft(draft, submitter));
    const submissionId = makeSubmissionId(submitter);

    const byCatalog = new Map<string, ICustomContentDraft[]>();
    for (const draft of finalized) byCatalog.set(draft.targetCatalogId, [...(byCatalog.get(draft.targetCatalogId) ?? []), draft]);
    const files = [...byCatalog.entries()].map(([catalogId, drafts]) => ({
        path: `src/data/${catalogId}.ts`,
        contents: (current: string | null) => {
            if (current === null) throw new Error(`src/data/${catalogId}.ts does not exist on the target repository yet.`);
            return mergeCatalogRecords(current, exportNameFor(drafts[0]), drafts.map((draft) => draft.record));
        },
    }));
    const fileNames = [...new Set(finalized.flatMap((draft) => draft.sourceFiles.map((source) => source.fileName)))];
    const evidenceFiles = fileNames
        .filter((fileName) => args.xmlByFileName[fileName] !== undefined)
        .map((fileName) => ({ path: `${CONST_CUSTOM_CONTENT_EVIDENCE_PATH}/${submissionId}/${fileName}`, contents: args.xmlByFileName[fileName] }));

    const title = finalized.length === 1 ? `Custom content: ${finalized[0].record.name}` : `Custom content: ${finalized.length} records`;
    const result = await submit({
        token: args.token, targetOwner: CONST_CUSTOM_CONTENT_GITHUB_OWNER, targetRepo: CONST_CUSTOM_CONTENT_GITHUB_REPO,
        submissionId, files, evidenceFiles, commitMessage: title, pullRequestTitle: title,
        pullRequestBody: (evidenceBranchUrl) => buildPullRequestBody(finalized, args.sourceNote, evidenceBranchUrl),
    });

    const submitted = finalized.map((draft) => ({ ...draft, prUrl: result.pullRequestUrl }));
    const stored = getLocalCustomContentDrafts().map((draft) => submitted.find((candidate) => candidate.id === draft.id) ?? draft);
    saveLocalCustomContentDrafts(stored);
    return { pullRequestUrl: result.pullRequestUrl, drafts: submitted };
}
```

`exportNameFor` for an unused `CustomComponentKind` import: remove the import if ESLint flags it.

- [ ] **Step 5: Run the tests, lint and types**

Run: `npx vitest run --project unit src/utils/customContentSubmission.test.ts`, `npx eslint src/utils`, `npx tsc --noEmit -p tsconfig.json`.
Expected: PASS, 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/utils/customContentSubmission.ts src/utils/customContentSubmission.test.ts src/configVars.ts .gitignore
git commit -m "Custom content: submission orchestrator, target configuration, evidence folder ignored"
```

---

### Task 12: SSW file import page

**Files:**
- Create: `src/ui/pages/classic-battletech/mech-creator/ssw-file-import.tsx`
- Modify: `src/ui/pages/classic-battletech/mech-creator/_router.tsx` (route `ssw-file-import`)
- Modify: `src/ui/pages/classic-battletech/mech-creator/imports.tsx` (link at the top of the "Imports From Skunkwerks" section)
- Modify: `e2e/smoke.spec.ts` (add `"mech-creator/ssw-file-import"` to `ROUTES`)

**Interfaces:**
- Consumes: `runSSWImportSession`, `ISSWImportResult` (Task 8); `IAppGlobals` (`battleMechSaves`, `saveBattleMechSaves`, `saveCurrentBattleMech`, `makeDocumentTitle`); `missingFields` (Task 7); `getLocalCustomContentDrafts` (Task 3).
- Produces: route `/mech-creator/ssw-file-import`.

- [ ] **Step 1: Add the route to the smoke test and confirm it fails**

Add `"mech-creator/ssw-file-import"` to `ROUTES` in `e2e/smoke.spec.ts`.
Run: `npx playwright test e2e/smoke.spec.ts -g "ssw-file-import"`
Expected: FAIL, 404 page.

- [ ] **Step 2: The page**

```tsx
// src/ui/pages/classic-battletech/mech-creator/ssw-file-import.tsx
import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { getLocalCustomContentDrafts } from '../../../../data/custom-content-local';
import { missingFields } from '../../../../utils/sswDraftBuilder';
import { ISSWImportResult, runSSWImportSession } from '../../../../utils/sswImportSession';
import { IAppGlobals } from '../../../app-router';
import MechCreatorSideMenu from '../../../components/mech-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';

// Import any .ssw files from disk: one review row per file, then save the ones you want. Items the catalogs
// don't know become custom content drafts (see custom-content-drafts.tsx).
const STATUS_LABELS: Record<ISSWImportResult["status"], { label: string; className: string }> = {
    clean: { label: "Clean", className: "badge bg-success" },
    warnings: { label: "Warnings", className: "badge bg-warning text-dark" },
    unresolved: { label: "Placeholders", className: "badge bg-info text-dark" },
    canonPending: { label: "Canon item missing", className: "badge bg-secondary" },
    failed: { label: "Failed", className: "badge bg-danger" },
};

export default class MechCreatorSSWFileImport extends React.Component<ISSWFileImportProps, ISSWFileImportState> {
    constructor(props: ISSWFileImportProps) {
        super(props);
        this.state = { busy: false, results: [], selected: {}, openRow: -1, message: "", storageWarning: false };
        this.props.appGlobals.makeDocumentTitle("Import .ssw Files | 'Mech Creator");
    }

    readFiles = async (fileList: FileList | null): Promise<void> => {
        if (!fileList || fileList.length === 0) return;
        this.setState({ busy: true, message: "" });
        const files = await Promise.all([...fileList].map(async (file) => ({ fileName: file.name, xml: await file.text() })));
        const { results, saved } = await runSSWImportSession(files);
        const selected: Record<number, boolean> = {};
        results.forEach((result, index) => { selected[index] = result.status !== "failed"; });
        this.setState({ busy: false, results, selected, openRow: -1, storageWarning: !saved });
    }

    onFileInput = (event: React.ChangeEvent<HTMLInputElement>): void => { void this.readFiles(event.currentTarget.files); }
    onDrop = (event: React.DragEvent<HTMLDivElement>): void => { event.preventDefault(); void this.readFiles(event.dataTransfer.files); }
    toggle = (index: number): void => this.setState({ selected: { ...this.state.selected, [index]: !this.state.selected[index] } });

    incompleteCustomStats = (result: ISSWImportResult): boolean => {
        const drafts = getLocalCustomContentDrafts().filter((draft) => result.draftIds.includes(draft.id));
        return drafts.some((draft) => draft.status !== "complete" || missingFields(draft).length > 0);
    }

    saveSelected = (): void => {
        const saves = this.props.appGlobals.battleMechSaves ?? [];
        let count = 0;
        this.state.results.forEach((result, index) => {
            if (result.mech && this.state.selected[index]) { saves.push(result.mech.export(true)); count++; }
        });
        this.props.appGlobals.saveBattleMechSaves(saves);
        this.setState({ message: `${count} design${count === 1 ? "" : "s"} added to your 'Mech saves.` });
    }

    render = (): JSX.Element => {
        const open = this.state.results[this.state.openRow];
        return (
            <UIPage current="mech-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <MechCreatorSideMenu appGlobals={this.props.appGlobals} current="imports" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Import .ssw files">
                            <div className="drop-zone alert alert-secondary text-center" onDragOver={(event) => event.preventDefault()} onDrop={this.onDrop}>
                                <p>Drop Solaris Skunk Werks <code>.ssw</code> files here, or choose them:</p>
                                <input type="file" multiple accept=".ssw" onChange={this.onFileInput} aria-label="Choose .ssw files" />
                            </div>
                            {this.state.busy ? <div className="alert alert-info">Importing…</div> : null}
                            {this.state.storageWarning ? <div className="alert alert-warning">This browser would not save the custom content drafts (private mode or storage full). They work until you close this tab.</div> : null}
                            {this.state.message ? <div className="alert alert-success">{this.state.message}</div> : null}
                            {this.state.results.length > 0 ? (
                                <table className="table table-sm">
                                    <thead><tr><th></th><th>File</th><th>Design</th><th>Status</th><th className="text-end">BV (ours / SSW)</th><th className="text-end">Issues</th><th></th></tr></thead>
                                    <tbody>
                                        {this.state.results.map((result, index) => (
                                            <tr key={result.fileName + index}>
                                                <td><input type="checkbox" disabled={!result.mech} checked={!!this.state.selected[index]} onChange={() => this.toggle(index)} aria-label={`Select ${result.fileName}`} /></td>
                                                <td>{result.fileName}</td>
                                                <td>{result.designName}</td>
                                                <td><span className={STATUS_LABELS[result.status].className}>{STATUS_LABELS[result.status].label}</span></td>
                                                <td className="text-end">{result.ourBV ?? "-"} / {result.sswBV2 ?? "-"}</td>
                                                <td className="text-end">{result.warnings.length + result.unresolved.length}</td>
                                                <td><button type="button" className="btn btn-sm btn-secondary" onClick={() => this.setState({ openRow: this.state.openRow === index ? -1 : index })}>Details</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : null}
                            {open ? (
                                <div className="card card-body mb-3" data-testid="ssw-import-detail">
                                    <h4>{open.designName}</h4>
                                    {open.failureReason ? <div className="alert alert-danger">{open.failureReason}</div> : null}
                                    {this.incompleteCustomStats(open) ? <div className="alert alert-warning">Incomplete custom stats: BV, heat and cost are not reliable until the placeholders' stats are entered.</div> : null}
                                    {open.unresolved.length > 0 ? (
                                        <>
                                            <h5>Not in the catalogs</h5>
                                            <ul>{open.unresolved.map((item, index) => (
                                                <li key={index}>{item.kind}: {item.sswName}{open.canonPending.includes(item.name) ? " (canon item, not yet in the catalog; it cannot be submitted as custom)" : ""}</li>
                                            ))}</ul>
                                            {open.draftIds.length > 0 ? <Link to={`${process.env.PUBLIC_URL}/custom-content-drafts`}>Edit the custom content drafts</Link> : null}
                                        </>
                                    ) : null}
                                    {open.warnings.length > 0 ? (<><h5>Warnings</h5><ul>{open.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></>) : null}
                                </div>
                            ) : null}
                            {this.state.results.some((result) => result.mech) ? (
                                <button type="button" className="btn btn-primary" onClick={this.saveSelected}>Save selected to my 'Mechs</button>
                            ) : null}
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface ISSWFileImportProps { appGlobals: IAppGlobals; }
interface ISSWFileImportState {
    busy: boolean;
    results: ISSWImportResult[];
    selected: Record<number, boolean>;
    openRow: number;
    message: string;
    storageWarning: boolean;
}
```

Match `UIPage`'s props to how `imports.tsx` renders it. If it takes different props, copy that file's usage.

- [ ] **Step 3: Route and link**

In `_router.tsx`, import `MechCreatorSSWFileImport from './ssw-file-import'` and add next to the `imports` route:

```tsx
                <Route path={`ssw-file-import`} element={
                    <MechCreatorSSWFileImport
                        appGlobals={this.props.appGlobals}
                    />
                }/>
```

In `imports.tsx`, at the top of the `Imports From Skunkwerks` `TextSection`, before the `alert-info` div:

```tsx
                          <p><Link className="btn btn-primary" to={`${process.env.PUBLIC_URL}/mech-creator/ssw-file-import`}>Import your own .ssw files</Link></p>
```

- [ ] **Step 4: Run the smoke test, types and lint**

Run: `npx playwright test e2e/smoke.spec.ts`, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src/ui`
Expected: PASS, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/pages/classic-battletech/mech-creator/ssw-file-import.tsx src/ui/pages/classic-battletech/mech-creator/_router.tsx src/ui/pages/classic-battletech/mech-creator/imports.tsx e2e/smoke.spec.ts
git commit -m "Mech Creator: import .ssw files from disk with a review screen"
```

---

### Task 13: Custom content drafts page

**Files:**
- Create: `src/ui/pages/custom-content-drafts.tsx`
- Modify: `src/ui/app-router.tsx` (lazy route `custom-content-drafts`)
- Modify: the Equipment Editor page (`src/ui/pages/equipment-editor.tsx`): a link to the drafts page
- Modify: `e2e/smoke.spec.ts` (`"custom-content-drafts"` in `ROUTES`)

**Interfaces:**
- Consumes: Task 3 store; Task 7 `missingFields`; Task 11 `submitCustomContent`; `CONST_CUSTOM_CONTENT_GITHUB_OWNER`.
- Produces: route `/custom-content-drafts`.

- [ ] **Step 1: Add the route to the smoke test and confirm it fails**

Add `"custom-content-drafts"` to `ROUTES`. Run: `npx playwright test e2e/smoke.spec.ts -g "custom-content-drafts"`. Expected: FAIL.

- [ ] **Step 2: The page**

The editor is generic over the draft's own record. It lists every leaf field (path, value), with a number input
for numbers and nulls and a text input for strings, and checkboxes for booleans. That covers every kind without a
per-kind form, and follows the interface field-for-field. Required and still-unknown fields are highlighted.

```tsx
// src/ui/pages/custom-content-drafts.tsx
import React, { type JSX } from 'react';
import { CONST_CUSTOM_CONTENT_GITHUB_OWNER, CONST_CUSTOM_CONTENT_GITHUB_REPO } from '../../configVars';
import { getLocalCustomContentDrafts, saveLocalCustomContentDrafts } from '../../data/custom-content-local';
import type { ICustomContentDraft } from '../../data/custom-content-types';
import { submitCustomContent } from '../../utils/customContentSubmission';
import { missingFields } from '../../utils/sswDraftBuilder';
import { IAppGlobals } from '../app-router';
import TextSection from '../components/text-section';
import UIPage from '../components/ui-page';

// Custom content drafted from imported designs: fill in the stats, mark complete, and submit as one pull request.
const GITHUB_TOKEN_SESSION_KEY = "customContentGithubToken";
const SKIP_FIELDS = new Set(["tag", "altTags", "altNames", "alphaStrike"]);

const leafFields = (value: unknown, path = ""): { path: string; value: unknown }[] => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => SKIP_FIELDS.has(key) && !path ? [] : leafFields(entry, path ? `${path}.${key}` : key));
    }
    return [{ path, value }];
};

const setAt = (record: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
    const copy = JSON.parse(JSON.stringify(record)) as Record<string, unknown>;
    const keys = path.split(".");
    let target = copy as Record<string, unknown>;
    for (const key of keys.slice(0, -1)) target = target[key] as Record<string, unknown>;
    target[keys[keys.length - 1]] = value;
    return copy;
};

export default class CustomContentDrafts extends React.Component<ICustomContentDraftsProps, ICustomContentDraftsState> {
    constructor(props: ICustomContentDraftsProps) {
        super(props);
        let token = "";
        try { token = sessionStorage.getItem(GITHUB_TOKEN_SESSION_KEY) ?? ""; } catch { token = ""; }
        this.state = {
            drafts: getLocalCustomContentDrafts(), editingId: "", selected: {}, githubToken: token, rememberGithubToken: token !== "",
            sourceNote: "", isSubmitting: false, pullRequestUrl: "", error: "", storageWarning: false,
        };
        this.props.appGlobals.makeDocumentTitle("Custom Content Drafts");
    }

    store = (drafts: ICustomContentDraft[]): void => {
        const saved = saveLocalCustomContentDrafts(drafts);
        this.setState({ drafts, storageWarning: !saved });
    }

    updateDraft = (id: string, change: (draft: ICustomContentDraft) => ICustomContentDraft): void =>
        this.store(this.state.drafts.map((draft) => draft.id === id ? change(draft) : draft));

    updateField = (draft: ICustomContentDraft, path: string, raw: string, kind: "number" | "string" | "boolean", checked = false): void => {
        const value = kind === "boolean" ? checked : kind === "number" ? (raw.trim() === "" ? null : Number(raw)) : raw;
        this.updateDraft(draft.id, (current) => ({ ...current, status: "draft", record: setAt(current.record, path, value) }));
    }

    markComplete = (draft: ICustomContentDraft): void => {
        if (missingFields(draft).length === 0) this.updateDraft(draft.id, (current) => ({ ...current, status: "complete" }));
    }

    deleteDraft = (draft: ICustomContentDraft): void => this.store(this.state.drafts.filter((candidate) => candidate.id !== draft.id));

    updateGithubToken = (event: React.FormEvent<HTMLInputElement>): void => {
        const token = event.currentTarget.value;
        this.setState({ githubToken: token });
        try { if (this.state.rememberGithubToken) sessionStorage.setItem(GITHUB_TOKEN_SESSION_KEY, token); } catch { /* storage unavailable */ }
    }

    toggleRememberGithubToken = (event: React.FormEvent<HTMLInputElement>): void => {
        const remember = event.currentTarget.checked;
        this.setState({ rememberGithubToken: remember });
        try {
            if (remember) sessionStorage.setItem(GITHUB_TOKEN_SESSION_KEY, this.state.githubToken);
            else sessionStorage.removeItem(GITHUB_TOKEN_SESSION_KEY);
        } catch { /* storage unavailable */ }
    }

    submit = async (): Promise<void> => {
        const drafts = this.state.drafts.filter((draft) => this.state.selected[draft.id]);
        const xmlByFileName = Object.assign({}, ...drafts.map((draft) => draft.sourceXml ?? {})) as Record<string, string>;
        this.setState({ isSubmitting: true, error: "", pullRequestUrl: "" });
        try {
            const result = await submitCustomContent({ token: this.state.githubToken, drafts, xmlByFileName, sourceNote: this.state.sourceNote });
            this.setState({ isSubmitting: false, pullRequestUrl: result.pullRequestUrl, drafts: getLocalCustomContentDrafts(), selected: {} });
        } catch (error) {
            this.setState({ isSubmitting: false, error: error instanceof Error ? error.message : String(error) });
        }
    }

    renderEditor = (draft: ICustomContentDraft): JSX.Element => {
        const missing = new Set(missingFields(draft));
        return (
            <div className="card card-body mb-3">
                <h4>{String(draft.record.name)} <small className="text-muted">{String(draft.record.tag)}</small></h4>
                <p>Target: <code>src/data/{draft.targetCatalogId}.ts</code> · Faction: {draft.faction}</p>
                {draft.slotsEstimated ? (
                    <div className="alert alert-warning">
                        The slot count was estimated from the file (SSW stores only the first slot).
                        <button type="button" className="btn btn-sm btn-secondary ms-2" onClick={() => this.updateDraft(draft.id, (current) => ({ ...current, slotsEstimated: false }))}>The slot count is right</button>
                    </div>
                ) : null}
                <table className="table table-sm">
                    <tbody>
                        {leafFields(draft.record).map(({ path, value }) => (
                            <tr key={path} className={missing.has(path) ? "table-warning" : undefined}>
                                <th><label htmlFor={`${draft.id}-${path}`}>{path}</label></th>
                                <td>
                                    {typeof value === "boolean"
                                        ? <input id={`${draft.id}-${path}`} type="checkbox" checked={value} onChange={(event) => this.updateField(draft, path, "", "boolean", event.currentTarget.checked)} />
                                        : typeof value === "string"
                                            ? <input id={`${draft.id}-${path}`} type="text" value={value} onChange={(event) => this.updateField(draft, path, event.currentTarget.value, "string")} />
                                            : <input id={`${draft.id}-${path}`} type="number" step="any" value={value === null || value === undefined ? "" : String(value)} placeholder="unknown" onChange={(event) => this.updateField(draft, path, event.currentTarget.value, "number")} />}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" className="btn btn-success" disabled={missing.size > 0} onClick={() => this.markComplete(draft)}>
                    {missing.size > 0 ? `Mark complete (${missing.size} field${missing.size === 1 ? "" : "s"} missing)` : "Mark complete"}
                </button>
            </div>
        );
    }

    render = (): JSX.Element => {
        const editing = this.state.drafts.find((draft) => draft.id === this.state.editingId);
        const selected = this.state.drafts.filter((draft) => this.state.selected[draft.id]);
        const canSubmit = !this.state.isSubmitting && this.state.githubToken.trim() !== "" && selected.length > 0 && selected.every((draft) => draft.status === "complete");
        return (
            <UIPage current="equipment-editor" appGlobals={this.props.appGlobals}>
                <TextSection label="Custom content drafts">
                    {this.state.storageWarning ? <div className="alert alert-warning">This browser would not save the drafts (private mode or storage full).</div> : null}
                    {this.state.drafts.length === 0 ? <p>No drafts yet. Import <code>.ssw</code> files with unknown items to make some.</p> : (
                        <table className="table table-sm">
                            <thead><tr><th></th><th>Name</th><th>Kind</th><th>Tag</th><th>Status</th><th>Used by</th><th>PR</th><th></th></tr></thead>
                            <tbody>{this.state.drafts.map((draft) => (
                                <tr key={draft.id}>
                                    <td><input type="checkbox" aria-label={`Select ${String(draft.record.name)}`} checked={!!this.state.selected[draft.id]} onChange={() => this.setState({ selected: { ...this.state.selected, [draft.id]: !this.state.selected[draft.id] } })} /></td>
                                    <td>{String(draft.record.name)}</td>
                                    <td>{draft.kind}</td>
                                    <td><code>{String(draft.record.tag)}</code></td>
                                    <td>{draft.status}</td>
                                    <td>{draft.sourceFiles.flatMap((source) => source.designs).join(", ")}</td>
                                    <td>{draft.prUrl ? <a href={draft.prUrl} target="_blank" rel="noopener noreferrer">PR</a> : ""}</td>
                                    <td>
                                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => this.setState({ editingId: draft.id === this.state.editingId ? "" : draft.id })}>Edit</button>{" "}
                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => this.deleteDraft(draft)}>Delete</button>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    )}
                    {editing ? this.renderEditor(editing) : null}
                    <div className="alert alert-secondary">
                        <h4>Submit to {CONST_CUSTOM_CONTENT_GITHUB_OWNER}/{CONST_CUSTOM_CONTENT_GITHUB_REPO}</h4>
                        <p>
                            Pull requests use your own GitHub personal access token (needs the <code>public_repo</code> scope). The token is
                            used only to call GitHub's API directly from your browser - this app has no backend and never sees or stores it.
                            Your GitHub login becomes part of each record's tag.
                        </p>
                        <label>Sources and notes for the reviewer:<br />
                            <textarea className="full-width" value={this.state.sourceNote} onChange={(event) => this.setState({ sourceNote: event.currentTarget.value })} />
                        </label>
                        <br />
                        <label>GitHub Personal Access Token:<br />
                            <input type="password" autoComplete="off" value={this.state.githubToken} onChange={this.updateGithubToken} className="width-auto" />
                        </label>
                        <br />
                        <label><input type="checkbox" checked={this.state.rememberGithubToken} onChange={this.toggleRememberGithubToken} />&nbsp;Remember token for this browser tab only</label>
                        <br />
                        <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={() => void this.submit()}
                            title={canSubmit ? "Submit the selected drafts as one pull request" : "Select complete drafts and enter a token to submit"}>
                            Submit {selected.length || ""} selected as one PR
                        </button>
                        {this.state.isSubmitting ? <div className="alert alert-info">Submitting pull request…</div> : null}
                        {this.state.pullRequestUrl ? <div className="alert alert-success">Pull request created: <a href={this.state.pullRequestUrl} target="_blank" rel="noopener noreferrer">{this.state.pullRequestUrl}</a></div> : null}
                        {this.state.error ? <div className="alert alert-danger">{this.state.error}</div> : null}
                    </div>
                </TextSection>
            </UIPage>
        );
    }
}

interface ICustomContentDraftsProps { appGlobals: IAppGlobals; }
interface ICustomContentDraftsState {
    drafts: ICustomContentDraft[];
    editingId: string;
    selected: Record<string, boolean>;
    githubToken: string;
    rememberGithubToken: boolean;
    sourceNote: string;
    isSubmitting: boolean;
    pullRequestUrl: string;
    error: string;
    storageWarning: boolean;
}
```

The evidence text comes from `draft.sourceXml`, which Tasks 7 and 8 fill in from the imported files.

- [ ] **Step 3: Route and link**

In `src/ui/app-router.tsx`: `const CustomContentDrafts = React.lazy(() => import("./pages/custom-content-drafts"));`
and a route after the `custom-mul-editor` route, built the same way:

```tsx
                <Route path={`${process.env.PUBLIC_URL}/custom-content-drafts`}   element={
                    <CustomContentDrafts
                        appGlobals={appGlobals}
                    />
                }/>
```

Copy the exact `appGlobals` prop expression and any `Suspense` wrapper from the `custom-mul-editor` route.

In `equipment-editor.tsx`, near its existing submit section or top toolbar, add
`<Link to={`${process.env.PUBLIC_URL}/custom-content-drafts`}>Custom content drafts from imports</Link>`.

- [ ] **Step 4: Run the smoke tests, types and lint**

Run: `npx playwright test e2e/smoke.spec.ts`, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src/ui`
Expected: PASS, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/pages/custom-content-drafts.tsx src/ui/app-router.tsx src/ui/pages/equipment-editor.tsx e2e/smoke.spec.ts
git commit -m "Custom content drafts page: edit, complete and submit as one PR"
```

---

### Task 14: End-to-end test, verification and TODO

**Files:**
- Create: `e2e/fixtures/griffin-widget.ssw`, `e2e/fixtures/griffin-widget-b.ssw`
- Create: `e2e/ssw-import.spec.ts`
- Modify: `TODO.md`

- [ ] **Step 1: Fixtures**

Write the Griffin GRF-1N XML from `src/data/ssw/sswMechs.ts` to `e2e/fixtures/griffin-widget.ssw`, with
`(IS) PPC` replaced by `(IS) Widget Cannon`. Write a second copy with `model="GRF-1X"` as
`griffin-widget-b.ssw`. Use a short node script; don't paste the XML by hand.

- [ ] **Step 2: The e2e test**

```ts
// e2e/ssw-import.spec.ts
import { expect, test } from "@playwright/test";
import path from "node:path";

test("imports two .ssw files, saves one with its placeholder, and it survives a reload", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("mech-creator/ssw-file-import");
    await page.getByLabel("Choose .ssw files").setInputFiles([
        path.join(__dirname, "fixtures/griffin-widget.ssw"),
        path.join(__dirname, "fixtures/griffin-widget-b.ssw"),
    ]);
    await expect(page.getByRole("row", { name: /griffin-widget\.ssw/ })).toContainText("Placeholders");
    await expect(page.getByRole("row", { name: /griffin-widget-b\.ssw/ })).toContainText("Placeholders");

    await page.getByLabel("Select griffin-widget-b.ssw").uncheck();
    await page.getByRole("button", { name: "Save selected to my 'Mechs" }).click();
    await expect(page.getByText("1 design added")).toBeVisible();

    await page.goto("custom-content-drafts");
    await expect(page.getByRole("cell", { name: "Widget Cannon" })).toBeVisible();

    await page.reload();
    await page.goto("mech-creator");
    await expect(page.getByText("Griffin")).toBeVisible();
    expect(errors).toEqual([]);
});
```

Add a check that the saved Griffin still holds the placeholder: open it from the Mech Creator saves list (copy the
selectors that page uses) and expect `Widget Cannon` on its equipment or TRO view.

- [ ] **Step 3: Run the e2e test**

Run: `npx playwright test e2e/ssw-import.spec.ts`
Expected: PASS. If a selector misses, adjust the selector, not the behaviour.

- [ ] **Step 4: Full verification**

Run, with output in the scratchpad:
- `npm test` (expect 575 + the new tests, 0 failed)
- `npx vitest run` (all projects; compare with the baseline in `.claude/rules/astech-rules.md` §7)
- `npx tsc --noEmit -p tsconfig.json` (0 errors)
- `npx eslint src` (0 errors)
- `npx playwright test` (all e2e)

Report new failures separately from pre-existing ones.

- [ ] **Step 5: The SSW corpus check**

Run the Task 6 audit again over `WorkingData_DEV/SSWdata` and the bundled set. Record the totals in `TODO.md` §2 as
an audit dated 2026-09-30 (or the run date): designs imported, failures, distinct unresolved names, and how many
are canon-pending. Compare with the earlier audits there.

- [ ] **Step 6: TODO**

In `TODO.md` §2, tick "Runtime importer: import any `.ssw` file from the UI ... with the import review screen".
Add a ticked line for custom content drafts and PR submission. Add open items for anything deferred: selection
lists for custom components in the construction steps, a custom cockpit catalog, and the canon-pending names left
for spec C.

- [ ] **Step 7: Commit**

```bash
git add e2e/ssw-import.spec.ts e2e/fixtures TODO.md
git commit -m "SSW runtime import: e2e test, corpus audit totals, TODO"
```

- [ ] **Step 8: Upstream PR notes (prepare only)**

Write `$S/upstream-pr-notes.md` with the "Upstream (HeySporky/battletech-tools)" section of the spec, filled in
with the final file list and the three configuration constants. Don't create the branch or open the PR. That
happens after spec B, on the user's word.
