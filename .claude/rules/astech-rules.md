# Astech Rules — Jeff's BattleTech Tools

These rules bind every Claude session in this workspace. You are **Astech**;
your role and mission are defined in `.claude/agents/astech.md`. Local-only
file: ignored by git, never commit it.

## 1. Repository topology and git safety

- Remotes: `origin` = ngcfells/battletech-tools (our fork), `upstream` =
  HeySporky/battletech-tools (community repo). Jeff's original
  (jdgwf/battletech-tools) is historical reference only.
- `wip-sync-branch` is the working branch. **`.github/workflows/nightly-wip-sync.yml`
  merges it into `origin/master` every night**, so anything pushed here ships
  to master within a day. Treat a push as a release.
- The `MUL` branch is owned by `mul-weekly-sync.yml`. Do not commit to it by
  hand unless asked.
- Commit or push only when the user asks. Never force-push, rewrite published
  history, or push to `upstream`.
- **Never run `npm run deploy-prod`**; it publishes to HeySporky's GitHub
  Pages. Do not run `deploy-dev` unless explicitly asked.
- Upstream contributions: a fresh branch from `upstream/master`, one focused
  change per PR, no dependency on our fork-only architecture unless that
  architecture is part of the PR. Prepare, don't open, unless told to.
- Never commit local-only material: `*_DEV/`, `.venv/`, `build/`, the nested
  `/battletech-tools/` copy, `.clinerules`, `cline_custom_modes.json`,
  `as_lookup_results.jsonl`, `*.bak`, or anything else in `.gitignore`.

## 2. Source precedence (BattleTech facts)

Canon is the authoritative source of truth (ASOT), per the user (2026-09-27):

1. Catalyst Game Labs rulebooks and official Alpha Strike material — canonical
   when the exact field is present (TW, TM, BMM, TO:AR, TO:AUE, SO, IO, CO,
   AS:CE, ASC, TROs/RSs, current errata).
2. battletech.com, including the official Master Unit List
   (masterunitlist.battletech.com) — canonical for published unit records and
   Alpha Strike cards.
3. Workspace knowledge: `_KNOWLEDGE_DEV/` (Sarna-derived, with book/page refs),
   `WorkingData_DEV/`, `tools/*.md` review ledgers, `tools/*-staging.jsonl`,
   `as_lookup_results.jsonl`.
4. Approved web references, in order: sarna.net, solaris7.com (http; forum
   reads), battletech.fandom.com, mordel.net. Prefer the canon book/page they
   cite over their own wording.
5. MegaMek / MegaMekLab / mm-data (local at `C:\repo\...`) — secondary
   cross-check for identity, tech base, and ammo shot counts. Not canon.
6. Fanon wikis (e.g. battletechfanon.fandom.com) are **custom-only** sources.
7. The PDF index at temp.2000webdesign.com is mixed provenance; verify the
   publisher and document before using any field from it.

Never invent a stat, date, citation, filename, page number, or URL. A search
snippet is a lead, not evidence. If you can't source a value, leave it
unresolved and say so. Don't fill it with a "plausible" number.

## 3. Equipment catalog rules

- Catalogs live in `src/data/mech-{is,clan,universal,custom}-*.ts` and are
  registered in `src/data/equipment-registry.ts`. They are **literal object
  arrays**. No generated or supplemental imports. Promote approved records
  directly into the catalog that owns them.
- **Universal** only when IS and Clan records match exactly on name, weight,
  BattleMech slots, damage, and every range value (`hasUniversalMetrics`).
  Any difference means separate IS and Clan entries. Never infer equivalence
  from a shared name or tag.
- Tags are unique within each catalog and across the runtime lists. Use
  `altTags`/`altNames` for aliases instead of adding duplicates.
- **Unknown is not zero.** In new or edited records, unknown dates are `null`
  and unresolved Alpha Strike values are marked as such. Legacy `0` values
  exist; don't spread them, and flag them when you touch them.
- Each record carries `book` and `page`. When you add or change a record, the
  source must support every numeric field you change.
- Workbook promotion follows `tools/alpha-strike-workbook-review-blocks.md`.
  Record the classification (`IS`/`Clan`/`Universal`/`Both (Stats Differ)`)
  in the ledger **before** you edit catalog files.
- Apocryphal, vehicle-only, aerospace, capital, infantry-only, and ProtoMech-
  only items must be labeled with domain legality (`space.*`, `metadata`). They
  never go into canon 'Mech lists as 'Mech-legal.
- Staging output (`tools/*-staging.jsonl`, Ollama or other model output) is
  review-only. Never write it straight into TypeScript.

### Ammunition model (agreed with the user 2026-09-27)

- Ammo records follow the first entry of `mech-clan-ammo.ts` field-for-field
  (enforced by the "canonical ammo format" test). Ammo *feeds* weapons: one
  record per round type, not per launcher size, except where rounds differ
  physically (e.g. Thunderbolt 5/10/15/20 are distinct single missiles).
- Universal = identical IS and Clan availability windows (IO tech progression,
  indexed via MegaMek). Otherwise split into IS and Clan records; Star League
  gear the Clans fielded until replaced gets a Clan copy with the Clan
  extinction date. `introduced` = production year (prototype if none).
- `space.protomech`: -1 = cannot be mounted on a ProtoMech in any form. Ammo is
  -1 unless a ProtoMech-mountable weapon fires it (test-enforced).
- `isSpecialAmmo: false` only for a weapon's standard round; its tag ends in
  `-standard`. Tags carry `is-`/`clan-` in faction catalogs; universal has none;
  custom follows the same rule.
- `altTags` preserve every historical tag (Jeff's, upstream, ours) so old saves
  and the `ammo-<weaponTag>` convention still resolve. Never leave `[""]`.
- Ammo: `roundsPerTon`. Weapons: `shotsPerTon` = the **published** count, which
  beats the rounds ÷ tubes (rounded up) fallback (SRM 6 = 15, ATM 9 = 7,
  ELRM 20 = 4). Dual-mode launchers use `shotsPerTonByAmmo` keyed by ammo family
  (MML fires the LRM and SRM families; it has no ammo of its own).
- A family = the standard round plus special munitions sharing its tag prefix
  (`getAmmoFamily`). Bins bind to a launcher (`feedsWeaponTag`) and count shots.

## 4. Canon vs. custom homebrew

- Custom content goes only in `mech-custom-*` catalogs, gated by the
  **Custom Homebrew** rules level (`rules-level-options.ts`, `tag: "custom"`).
  It never leaks into canon lists, validation, or BV/PV math for canon units.
- Label custom records clearly (`book: "Custom"` or the fanon URL, plus
  `notes`). Ideas in `ideas_DEV/` (e.g. Penta/Hexapods) are design proposals,
  not rules, until the user approves them.
- When the user asks for a custom rule, design it to fit the game's existing
  balance and engineering logic. Call out anything that would be broken or
  would contradict canon.

## 5. Alpha Strike rules

- Don't derive Alpha Strike values from Classic range bands without an explicit,
  cited conversion rule. `convertTabletopWeaponToAlphaStrike` and
  `tools/alpha-strike-conversion-rules.json` entries marked `provisional` are
  calibrations, not canon. Keep that status visible.
- Published MUL cards beat computed conversions for existing units. Computed
  values are for custom or unpublished designs.
- Keep Classic (hexes, BV2) and Alpha Strike (inches, PV, damage bands) values
  in their own fields. Never mix scales.

## 6. Code conventions

- TypeScript + React 18 + Vite + Vitest. Match the surrounding file: 4-space
  indentation, existing naming, comment density, and Jeff's class-based model
  (`src/classes/battlemech.ts` is huge; add small helpers rather than
  restructuring it unless asked).
- Put domain logic in `src/classes/` or `src/data/` helpers, not in UI pages.
  Chassis-specific behavior (Biped/Quad/Tripod/LAM/QuadVee) goes through the
  shared model's capability queries.
- Keep saved-data backward compatibility. Existing BattleMech JSON exports and
  `dataSaves.ts` backups must still load. Schema changes go through
  `canonical-record.ts` versioning and migrations.
- Tests go next to the source (`*.test.ts`). Rules-driven changes get a
  regression test that names the rule, with a citation where practical.
- Preserve Jeff's credits and attribution (About page, license headers,
  `jdgAnalytics.ts`) and the data-licensing note in `src/data/README.md`.
- Never copy MegaMek/MegaMekLab source code into this MIT repo. They are GPL.
  Use them as reference only.

## 7. Verification

Run what's relevant: `npm test`, `npm run lint`, `npx tsc --noEmit -p tsconfig.json`.
Compare with the baseline below. Never claim "all green" when it isn't; report
new failures separately from pre-existing ones.

**Baseline as of 2026-09-27 (after misc equipment batch 2 and spread/movement wiring, uncommitted)** —
update this block when it changes:
- Vitest: 145 passed / 0 failed. `mul-list-items.test.ts` sits near its 5 s
  timeout and can flake under load.
- ESLint on `src`: 0 errors / 1 warning (`npx eslint src`). Repo-wide
  `npm run lint` also picks up `.venv/` and Node scripts missing Node globals.
- `tsc --noEmit`: 33 errors, mostly unused `@ts-expect-error` directives
  (`src/utils.ts`, `src/utils/replaceAll.ts`).

## 8. Large and generated files

- `tools/mul-sync/live-units.json` (~740k lines), `src/data/mul/*.json`, and the
  workbook JSON are huge. Search them with grep/jq/node; don't read them whole.
- Don't hand-edit MUL chunk data. Fix the sync or import code instead.

## 9. Working style

- Two distinct failed attempts at the same error means stop. Summarize what
  failed and ask the user. Never loop.
- Ask before destructive, outward-facing, or hard-to-reverse actions.
- `TODO.md` is the roadmap. Tick items off when they are done and verified. Add
  newly found gaps under the right phase.
- `.clinerules`, `cline_custom_modes.json`, `tools/ollama-guardrails.md`, and
  `tools/Modelfile.astech-qwen3` configure the local Ollama/Cline Astech worker.
  Keep them consistent with these rules, but edit them only when asked.
- Cite rules in answers as *Book p.N* (abbreviation plus page). If you're answering
  from memory without the book in hand, say so.
