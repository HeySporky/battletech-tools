# Spec A: Runtime SSW import, custom content intake, and PR submission

Date: 2026-09-30. Branch: `feature/ssw-runtime-import`. Status: approved design, awaiting spec review.

This is the first of three specs that finish the Solaris Skunk Werks (`.ssw`) importer:

- **Spec A (this one):** import any `.ssw` file from the UI, review it, turn unknown equipment and
  components into custom drafts, and submit finished drafts as a pull request to the fork.
- **Spec B:** importer coverage. IndustrialMechs and Primitive 'Mechs, the two OmniMech parse failures,
  OmniMech configurations, critical-slot placement, mapping every canon armor, structure, engine, gyro,
  myomer and cockpit name SSW uses, and a canon cockpit catalog (`mech-cockpit-types.ts`).
- **Spec C:** canon equipment that has no catalog record yet (TODO §2, "Canon equipment with no catalog
  record"), researched from the rulebook library.

## Goal

A user can drop one or more `.ssw` files into the app and get each design as a saved BattleMech. Anything
the app doesn't recognize is never silently dropped or silently replaced: it becomes a custom draft
record in the exact format of the catalog it belongs to. The design imports with correct weight and
criticals right away; the user fills in the stats later and can propose the finished record for the
fork's custom catalogs with one button.

Success criteria:

1. Any `.ssw` file the importer can parse imports from the UI with a review screen; a file it can't parse
   fails on its own line with a reason, without stopping the batch.
2. No unknown equipment name or component name is dropped or replaced without being reported.
3. Every unknown item becomes one draft (merged across the batch), installed as a placeholder so the
   design's weight and criticals are right.
4. Saved designs that use drafts reload with those drafts in place.
5. A completed draft is submitted as a PR whose diff inserts records into the existing
   `src/data/mech-custom-*.ts` files, in the same literal format as the entries already there, so the
   maintainer can merge or copy it without reformatting.
6. The source `.ssw` files are available to the reviewer and never reach `master`.

## Facts this design rests on

- An SSW `<equipment>` element carries only `name`, `type` (`energy`, `ballistic`, `missile`,
  `ammunition`, `equipment`, `physical`, ...), `location` with a slot `index`, `splitlocation`, `tons`
  (variable-weight items) and `vglammo`/`vglarc`. Checked across all 3,358 files in
  `WorkingData_DEV/SSWdata`. A file never carries an item's stats, so custom stats must come from the user.
- Saved 'Mechs reference equipment by `tag` only (`_restoreEquipmentItem` -> `addEquipmentFromTag`), so a
  user-defined item must stay registered in the browser or the design loses it on reload.
- Today the importer silently replaces unknown components: `setEngineTypeByName` falls back to the first
  engine, `setGyroTypeByName` to the Standard gyro, and the armor mapping in `importSSWXML` knows 8 names
  (anything else stays Standard). Internal structure, cockpit and myomer are not read. None of this is
  reported in `_sswImportErrors`.
- Only weapons, equipment and ammunition have `mech-custom-*` catalogs. Armor, structure, gyro, engine,
  heat sink, jump jet and myomer each have one canon file, read directly by the construction code.
  Cockpits are hard-coded in `battlemech.ts` (no catalog).
- `src/utils/githubContribution.ts` already runs a browser-only fork/branch/commit/PR flow with the user's
  personal access token, for one file. The Custom MUL Editor uses it against `ngcfells/battletech-tools`.
- `src/data/custom-mul-local.ts` is the existing pattern for browser-local custom records.

## Components

All new logic lives in `src/utils/` and `src/data/`; `battlemech.ts` gets small hooks only.

### `src/utils/sswImportSession.ts`

Input: an array of `{ fileName: string, xml: string }`.

For each file, parse it in its own `try` and produce:

- `fileName`, `xml` (kept for evidence), `mech: BattleMech | null`;
- `status`: `clean`, `warnings`, `unresolved` (has placeholder drafts), `failed`;
- `failureReason` for `failed` (malformed XML, missing `<mech>`, unsupported `mech_type`);
- `sswBV2` (from `getSSWXMLBasicInfo`) and our BV;
- `unresolved`: the unresolved entries the importer reported (below);
- `warnings`: everything else in `_sswImportErrors`.

It then groups unresolved entries across the batch by **kind + faction + name** (case-insensitive), so a
name used by six designs yields one draft, and re-imports the affected designs with the drafts registered.

### Importer hooks (`battlemech.ts`)

`importSSWXML` keeps `_sswImportErrors` and adds a structured list `getSSWUnresolved()` of
`{ kind, name, faction, sswType, location, slotIndexes, splitLocations, tons }`, where `kind` is one of
`equipment`, `ammunition`, `armor`, `structure`, `engine`, `gyro`, `heatSink`, `jumpJet`, `myomer`,
`cockpit`.

- `_installSSWEquipment` records an unresolved entry where it now only pushes the error string.
- The armor mapping, `setEngineTypeByName`, `setGyroTypeByName`, and new reads of `<structure>`,
  `<cockpit>`, myomer, heat-sink and jump-jet types record an unresolved entry when a name resolves to
  nothing. The current fallback still runs, so the design builds, but the substitution is now reported.
- Spec B replaces fallbacks with proper canon mappings; spec A only makes them visible.

### `src/data/custom-content-local.ts`

Browser-local drafts in `localStorage` (key `localCustomContent`), modeled on `custom-mul-local.ts`:
read/write wrapped in `try`, `save` returns `false` when storage is unavailable.

```ts
interface ICustomContentDraft {
    id: string;                 // uuid
    kind: CustomContentKind;    // equipment | ammunition | armor | structure | engine | gyro | heatSink | jumpJet | myomer
    faction: "is" | "clan" | "universal";
    targetCatalogId: string;    // e.g. "mech-custom-ammo", "mech-custom-armor-types"
    record: object;             // the catalog record, nullable where the stat is unknown
    status: "draft" | "complete";
    sourceFiles: { fileName: string; designs: string[]; sha256: string }[];
    sourceNote: string;         // submitter's source/notes for the PR
    prUrl?: string;
}
```

The `record` follows the target catalog's interface field-for-field. Stats the file doesn't give are
`null` in the draft. `introduced`/`extinct`/`reintroduced` start `null` ("unknown is not zero").

Draft placeholder values derived from the file:

- name: the SSW name, with the `(IS) `/`(CL) `/`(T) `/`(R) ` markers removed;
- category: from `<type>` (`energy` -> Energy Weapons, `ballistic` -> Ballistic Weapons, `missile` ->
  Missile Weapons, `ammunition` -> ammunition, `physical`, otherwise equipment/misc);
- BattleMech slots: the longest contiguous run of slot indexes in one location for that item, or the sum
  of `splitlocation` sizes;
- weight: `<tons>` when present, otherwise `null`;
- `book: "Custom"`, `page: 0`, and `notes` naming the source file(s);
- `space.battlemech` = the derived slot count; every other `space` field starts `null` and must be set
  (a number, or `-1` for "cannot be mounted") before the draft can be marked complete, so domain
  legality is always an explicit choice.

### Custom component catalogs (new, empty)

Seven new files, each an empty literal array typed with the canon interface and carrying the same
disclaimer header as the existing custom catalogs:

| File | Export | Interface |
| --- | --- | --- |
| `mech-custom-armor-types.ts` | `mechCustomArmorTypes` | `IArmorType` |
| `mech-custom-internal-structure-types.ts` | `mechCustomInternalStructureTypes` | `IInternalStructure` |
| `mech-custom-gyro-types.ts` | `mechCustomGyroTypes` | `IGyro` |
| `mech-custom-engine-types.ts` | `mechCustomEngineTypes` | `IEngineType` |
| `mech-custom-heat-sink-types.ts` | `mechCustomHeatSinkTypes` | `IHeatSync` |
| `mech-custom-jump-jet-types.ts` | `mechCustomJumpJetTypes` | `IJumpJet` |
| `mech-custom-myomer-types.ts` | `mechCustomMyomerTypes` | `IMyomerType` |

Created once; every later submission merges into them. No custom cockpit catalog until spec B creates
the canon one.

### `src/data/custom-component-registry.ts`

One lookup per component kind: canon catalog first, then (only when the design's rules level is Custom
Homebrew) the custom catalog, then local drafts. Matches by tag, name, `alternateName`, `altNames`,
`altTags`, the same identifiers `findImportedEquipment` uses. The component setters in `battlemech.ts`
(`setArmorType`, `setEngineType(ByName)`, `setGyroType(ByName)`, the structure, heat-sink, jump-jet and
myomer setters) call it instead of looping over the canon array; canon behaviour is unchanged.

Equipment and ammunition drafts register with `findImportedEquipment`'s custom pass and with
`addEquipmentFromTag`, so saves that use them reload.

A design with any custom or draft component or item needs the Custom Homebrew rules level, through the
existing `item.book === "Custom"` check in `equipment-registry.ts` and its component equivalent.

### Custom tags

Every new custom record's tag carries the submitter:

```text
[ammo-]<submitter>-[is-|clan-]<slug>
```

- `<submitter>`: the GitHub login, lowercased, characters outside `[a-z0-9-]` replaced by `-`.
- `is-`/`clan-` only when the record is faction-specific; universal records have none.
- `<slug>`: from the name, following the target catalog's existing slug style (ammo ends in the round
  type, `-standard` for a weapon's standard round).

Examples: `ammo-ngcfells-ac-25-standard` (universal), `ammo-ngcfells-is-ac-25-standard`,
`ammo-ngcfells-clan-ac-25-standard`, `ngcfells-clan-coil-l`, `ngcfells-is-reactive-armor-mk2`.

The login is only known once a token is entered, so a draft starts with a provisional tag
`local-[is-|clan-]<slug>` (ammo: `ammo-local-...`). On submission the final tag is written to the record
and the provisional tag is added to `altTags`, so designs saved with the provisional tag still resolve.
The local draft is updated to the final tag. The 57 existing custom records keep their tags.

### `src/utils/customCatalogMerge.ts`

Pure functions, string in, string out:

- `serializeCatalogRecord(record, fileContents, exportName)`: writes the record as a TypeScript object
  literal in the target file's style: field order of the file's first entry, 4-space indentation, quote
  and trailing-comma style, `null` for unknown values. Fields the first entry lacks go after its fields in
  interface order.
- `mergeCatalogRecords(fileContents, exportName, records)`: inserts the serialized records before the
  closing `];` of the named export array and returns the new file text. Throws `TagClashError` listing any
  tag, `altTag` or name already present in the file.
- Never reformats existing entries; the PR diff is additions only.

### `src/utils/githubContribution.ts` (extended)

Add `submitGithubMultiFileContribution(request)`; the existing exports keep working unchanged.

```ts
interface IGithubMultiFileContributionRequest {
    token: string;
    targetOwner: string;
    targetRepo: string;
    files: { path: string; contents: (currentContents: string | null) => string }[];
    evidenceFiles?: { path: string; contents: string }[];
    branchPrefix: string;              // "custom-content"
    evidenceBranchPrefix?: string;     // "custom-content-evidence"
    commitMessage: string;
    pullRequestTitle: string;
    pullRequestBody: (evidenceBranchUrl: string | null) => string;
}
```

Flow, in this order so a failure leaves nothing half-made:

1. Get the user, the target repo's default branch, and fork (or not) exactly as the single-file flow does.
2. Fetch every target file from the default branch and run each `contents` function. Any throw (tag
   clash) stops here, before anything is written.
3. Create blobs, one tree, one commit for the catalog files; create ref `custom-content/<id>`.
4. If `evidenceFiles`: blobs, tree, commit on the same base; create ref `custom-content-evidence/<id>`.
5. Open the PR from `custom-content/<id>`. If opening it fails, delete both refs created in 3-4.

`<id>` is `<submitter>-<yyyymmdd>-<short random>`.

### Configuration (`src/configVars.ts`)

```ts
export const CONST_CUSTOM_CONTENT_GITHUB_OWNER = "ngcfells";
export const CONST_CUSTOM_CONTENT_GITHUB_REPO = "battletech-tools";
export const CONST_CUSTOM_CONTENT_EVIDENCE_PATH = "tools/custom-content-submissions";
```

`.gitignore` on master gains `tools/custom-content-submissions/` as a backstop.

### UI

- **`ssw-file-import.tsx`** (Mech Creator -> Imports, new "Import .ssw files" section; route under the
  mech creator):
  - file input (`multiple`, `accept=".ssw"`) and a drop zone;
  - review list: one row per file with name, model, tonnage, status badge, our BV vs SSW BV2, and counts
    of warnings and unresolved items;
  - row detail: the 'Mech summary (existing `BattleMechSVG`/TRO view), warnings, unresolved items with
    links to their drafts, and the "incomplete stats" banner when a placeholder lacks stats;
  - "Save selected" and "Save all importable" into the user's 'Mech saves.
- **`custom-content-drafts.tsx`** (reachable from the review screen and from the Equipment Editor menu):
  - list of local drafts with kind, tag, status, source designs, PR link;
  - draft editor: equipment and ammunition use `EquipmentEditForm`; each component kind gets a small form
    of its interface's fields;
  - "Mark complete" validates the required fields for the kind;
  - token box and "Submit selected as PR" with the same token wording, `sessionStorage` option and
    `password` input as the Equipment Editor and Custom MUL Editor.

Required fields before "complete":

| Kind | Required |
| --- | --- |
| Weapon | weight, BattleMech slots, damage, heat, all range bands, BV, cost, introduced |
| Ammunition | weight per ton, rounds per ton, feeds-weapon tag, BV, cost, explosive, introduced |
| Other equipment | weight, slots, BV (or defensive BV rule), cost, introduced |
| Armor | points per ton multiplier by faction, slots, BV multiplier, cost multiplier, introduced |
| Structure | weight multiplier, slots, BV multiplier, cost multiplier, introduced |
| Engine | weight multiplier/table, side-torso slots, BV multiplier, cost multiplier, introduced |
| Gyro | weight multiplier, slots, BV multiplier, cost multiplier, introduced |
| Heat sink | dissipation, weight, slots, cost, introduced |
| Jump jet | weight per class, slots, cost, introduced |
| Myomer | weight rule, slots, cost, introduced |

The exact field names come from each interface when the forms are built; the table states intent.

### Placeholder behaviour

A placeholder is installed with its known weight and slots. The runtime copy uses `0` for a stat that is
still `null` (the construction code needs numbers), and the design is flagged **"incomplete custom stats:
BV, heat and cost are not reliable"** on the review screen, in the Mech Creator, and in the saved record.
A `null` is never written into a catalog file as `0`; the serializer refuses a record that is not complete.

## Pull request content

One PR per submission, containing every selected complete draft:

- **Branch `custom-content/<id>`**: one commit changing each affected `mech-custom-*.ts` file, additions
  only. The PR targets the target repo's default branch.
- **Branch `custom-content-evidence/<id>`**: the source `.ssw` files under
  `tools/custom-content-submissions/<id>/<fileName>`. Never merged; the maintainer deletes it when done.
- **PR body:**
  - one line per record: kind, final tag, name, target file, faction;
  - the designs and source files that use it, with SHA-256 hashes, and a link to the evidence branch;
  - the submitter's source note;
  - "User-supplied, unverified homebrew. Review stats, sources and licensing before merging. Custom
    content is gated by the Custom Homebrew rules level and never enters canon lists or canon BV/PV."
- Title: `Custom content: <name>` or `Custom content: <n> records`.

## Upstream (HeySporky/battletech-tools)

If this feature is offered upstream, the PR description must say:

- The submission target is three constants in `src/configVars.ts`
  (`CONST_CUSTOM_CONTENT_GITHUB_OWNER`, `..._REPO`, `..._EVIDENCE_PATH`). Upstream sets them to its own
  repo so users' submissions go there.
- Add `tools/custom-content-submissions/` to `.gitignore`; evidence lives on the separate
  `custom-content-evidence/<id>` branches and is never merged.
- The seven `mech-custom-*-types.ts` files and `custom-component-registry.ts` are part of the change; the
  component setters' canon behaviour is unchanged.
- Custom tags carry the submitter's GitHub login (`[ammo-]<login>-[is-|clan-]<slug>`).

The upstream PR is a fresh branch from `upstream/master` and is prepared, not opened, unless the user
says so.

## Error handling

| Case | Behaviour |
| --- | --- |
| Malformed XML, no `<mech>`, unsupported `mech_type` | That file's row is `failed` with the reason; others continue. |
| Unknown equipment or component name | Placeholder draft, row `unresolved`, never silent. |
| Fallback component used | Reported as unresolved (spec B maps the canon names). |
| Unknown cockpit | Reported as unresolved; no custom intake until spec B. |
| Tag clash on the target file | Submission stops before writing; the draft shows the clash and a suggested tag. |
| GitHub API failure | Nothing left half-made (see the flow); drafts stay unsubmitted; error shown. |
| Storage unavailable or full | Warning that drafts won't survive a reload (Custom MUL Editor wording). |
| Token missing | Submit button disabled with the reason. |

## Testing

Unit tests next to the source:

- `customCatalogMerge.test.ts`: serialize and merge into each existing custom file; the result parses as
  TypeScript, keeps existing entries byte-for-byte, matches the first entry's field order, and passes the
  existing canonical ammo format and tag-uniqueness tests; tag clash throws; incomplete record refused.
- `sswImportSession.test.ts`: fixtures with an injected unknown weapon, an unknown ammunition, an unknown
  armor type, a malformed file and an unsupported `mech_type`; merging of a name shared by two designs;
  placeholder slot and weight derivation (contiguous run, split location, `<tons>`).
- `custom-component-registry.test.ts`: canon wins over custom; custom only at Custom Homebrew; drafts
  resolve; provisional tag resolves through `altTags` after finalization.
- `githubContribution.test.ts`: mocked `fetch`; call order for the multi-file flow; nothing written on a
  tag clash; refs deleted when the PR call fails; existing single-file flow unchanged.
- Custom tag builder: the examples above, including login sanitizing.
- Regression: the bundled SSW designs import exactly as before (the existing pinned list in
  `battlemech.test.ts` and `importedEquipment.test.ts`).
- e2e (Playwright): import two fixture files through the UI, see both rows, open one, save it, reload,
  and the saved design still has its placeholder item.

Verification against the baseline in `.claude/rules/astech-rules.md` §7: `npm test`, `npm run lint`,
`npx tsc --noEmit -p tsconfig.json`.

## Out of scope

- Spec B items: IndustrialMechs and Primitive 'Mechs, OmniMech parse failures and configurations,
  critical placement, canon component name mapping, cockpit catalog.
- Spec C: missing canon equipment records.
- SSW export, BV agreement with SSW, `.zip`/folder import.
- Re-tagging the 57 existing custom records.
