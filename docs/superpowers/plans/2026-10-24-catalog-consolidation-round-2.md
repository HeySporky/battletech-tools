# Catalog consolidation, round 2: the twin merge (weapons and ammunition)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge every IS/Clan pair that differs only in dates into one universal record with the Clan dates in
`clanDates`. Keep apart every pair that differs in a real stat or by edition, and list each with its reason.

**Architecture:** A comparison script lists every IS/Clan pair across the equipment and ammo catalogs, field by field.
A merge script rewrites the IS record as `techBase: "universal"`, folds the Clan names and tags into `altNames` and
`altTags`, appends `clanDates`, and deletes the Clan record. Universal ammunition drops the `ammo-is-` prefix from its
tag, and the old tag stays as an alias.

**Tech Stack:** TypeScript, Vitest (`--project unit`), Python for the data scripts (scratchpad only, not committed).

**Spec:** `docs/superpowers/specs/2026-10-24-catalog-consolidation-design.md` (round 2 of "Order of work"; §2).

## Global Constraints

- A pair merges only when weight, slots, damage, range, heat, BV, cost and ammunition per ton all match (§2).
- The merged record keeps the IS dates and puts the Clan dates in `clanDates`. The shared filter reads `clanDates`
  as a full replacement, so it carries all four dates.
- Every retired tag still loads the merged record on both tech bases, through `altTags`.
- Every unit's BV stays as it was: the BV survey before and after must match.
- Universal ammunition tags carry no `ammo-is-`/`ammo-clan-` prefix, and their `sort` has no side suffix (the
  canonical ammo format test).

## Review Focus

- A Clan design saved with a Clan tag (`clan-er-flamer`, `ammo-clan-ac-5-standard`): it must still load, as the
  merged record. Covered by `twin-merge.test.ts`.
- A Clan unit in an era where only the Clan side had the item (Laser Insulator after 2820): it must still be offered.
  Covered by `seenBy` in `battlemech.test.ts` and the era-record tests.
- A weapon that finds its rounds by tag family (Artillery Cannons, autocannons): it must find the merged round.
  Covered by the BV survey and by the ArtVee and breech-loader tests.
- An item whose old edition prints the two sides apart: it must stay two records (see "Kept apart").
- The ProtoMech slot column: ProtoMechs are Clan units, so a merged record takes the Clan column.

---

## Merged (39 pairs)

| Record | Retired tags | Clan dates differ in |
|---|---|---|
| modular-armor, coolant-pod, full-head-ejection-system, mass, harjel, melee-claw, laser-insulator | `clan-<tag>` | prototype / introduced / extinct |
| ammo-long-tom-, ammo-sniper-, ammo-thumper-copperhead | `ammo-is-…`, `ammo-clan-…` | dates |
| ammo-long-tom-, ammo-sniper-, ammo-thumper-thunder | `ammo-is-…`, `ammo-clan-…-fascam` (FASCAM is the Clan name) | dates |
| ammo-mech-mortar-standard, ammo-arrow-iv-fae, ammo-lrt-standard, ammo-srt-standard | `ammo-is-…`, `ammo-clan-…` | dates |
| ammo-ac-2/5/10/20 standard, flak, tracer | `ammo-is-…`, `ammo-clan-…` | dates |
| er-flamer, heavy-flamer, angel-ecm | `clan-<tag>` | dates, ProtoMech column |
| long-tom-, sniper-, thumper-cannon | `clan-<tag>` | prototype (3012 / 3032) |
| ammo-lrm-narc, ammo-lrm-arad, ammo-heavy-flamer-standard, ammo-heavy-flamer-coolant | `ammo-is-…`, `ammo-clan-…` | dates, ProtoMech column |

The derived Hailstorm rounds follow the Long Tom's, so `ammo-hailstorm-copperhead` and `ammo-hailstorm-thunder` are
universal too.

- The **ProtoMech column**: the IS records said -1 and the Clan records gave the real count. A merged record takes
  the Clan count.
- The ER Flamer's `minAmmoTons`: 1 on the IS record, 0 on the Clan record. It is an energy weapon, so the merged
  record takes 0.
- The AC rounds keep the IS `editions`. The only Clan autocannons that fire them (the Star League AC) are Total
  Warfare era only, so the union is the IS list.

## Kept apart

Each pair here differs in a real stat, so it stays two records.

- **Weight or slots:** machine guns and machine gun arrays (light, standard, heavy), Gauss rifle, LB-X, Ultra, Rotary
  ACs, flamer, ER and pulse lasers, ER PPC and its capacitor, Laser AMS, AMS, LRM, SRM, Streak, LRT, SRT (each with
  its Artemis IV, I-OS and OS forms), Narc, 'Mech Mortars, ECM, CASE II, Arrow IV system, Partial Wing.
- **Formula:** MASC and the targeting computer: the Clan formula differs.
- **Ammunition BV or cost:** Rotary, Ultra AC/2, /5 and /20 rounds. The LRM Thunder and FASCAM rounds differ in
  minefield BV.
- **Editions:**
  - The A-Pod and the Arrow IV FASCAM round are Clan-only in the 1990 Compendium.
  - The heavy and light machine gun rounds and the Ultra AC/10 round are listed in different editions per side.
- **Tech rating:** TAG is rated E for the IS and F for the Clans. Its old-edition entries also cite a separate table
  per side.
- **Figures an older edition prints apart for each side:** the standard Arrow IV, Gauss and Streak SRM rounds carry
  `editionStats` page cites and notes from per-side tables.

`twin-merge.test.ts` pins both lists, so a later pass cannot quietly reopen a kept-apart pair.

## Tasks (done)

- [x] Compare every pair (`twins.py`); write the review table (`kept-apart.md`).
- [x] Batch 1, 29 pairs; retag universal ammunition; update references in `ammo-custom.ts`, `artillery-custom.ts`,
      `artvee-samples.ts`, `battledroids-mechs.ts`, `equipment-ballistic.ts`, `equipment-missile.ts`.
- [x] Batch 2, 10 pairs; retag the four rounds.
- [x] Date-table tests read a merged record through `seenBy` (IS: its own dates; Clan: `clanDates`).
- [x] Standing test: no record uses 0 for a missing date (on the record or in `clanDates`).
- [x] Regenerate `src/data/__fixtures__/tech-lists.json`. The diff is exactly the merges.
- [x] `npx vitest run --project unit`, `npx tsc --noEmit -p .`, `npx eslint` on the changed files.
- [x] BV survey: identical before and after.
