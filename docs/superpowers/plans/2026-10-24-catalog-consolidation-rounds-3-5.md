# Catalog consolidation, rounds 3-5: every catalog on the standing core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every catalog in `getAllCatalogs()` gives each record an `editions` list and a `techBase`. The shared tech
base is spelled `"universal"` everywhere, so the pending list in `catalog-registry.ts` can be retired.

**Architecture:** Data scripts add the missing fields; no stat changes. `servesTechBase()` in
`equipment-registry.ts` is the one test of "does this record serve this unit's tech base". The three catalog
interfaces that spelled the shared base `"both"` now take `techBase` from `ICatalogStanding`.

**Tech Stack:** TypeScript, Vitest (`--project unit`), Python data scripts (scratchpad, not committed).

**Spec:** `docs/superpowers/specs/2026-10-24-catalog-consolidation-design.md` (rounds 3, 4 and 5 of "Order of
work"; §1).

## Global Constraints

- No stat changes. Every unit's BV stays as it was, checked by the BV survey after each round.
- The `editions` given here are the Total Warfare-era editions that cover the record's unit type (§3). For every
  catalog in rounds 4-5 that is `["total-warfare"]`: BattleMech Manual and the Core Rulebook cover 'Mechs (and
  buildings) only. The 'Mech component catalogs already listed their editions.
- The pre-Total Warfare expansions (CityTech, AeroTech, BattleTroops, ClanTroops and their later editions) are not
  `complete` yet. Their entries are added when the book sweep (round 6) reads each one, as was done for the
  BattleMech editions.

## Review Focus

- A Clan 'Mech choosing a universal heat sink or myomer must still be offered it, and an IS 'Mech must not be offered
  a Clan-only one. Pinned by the `servesTechBase` standing test and the existing heat sink and myomer tests.
- Capital weapons on a small craft or capital ship of either tech base (`"universal"` replaces `"both"`).
- Infantry weapons and armor on platoons, battle armor, buildings and support vehicles of either tech base.
- Battle armor scale weapons now carry their own `techBase`. The BV survey shows no unit moved.

---

## Round 3: 'Mech components

- [x] `techBase: "universal"` on every engine, gyro, cockpit, heat sink, jump jet, armor, structure and myomer record
      that had none. 71 records; the IS-only and Clan-only records keep theirs.
- [x] `ICockpitType`, `IHeatSync` and `IMyomerType` take `CatalogTechBase`.
- [x] `servesTechBase(techBase, unitTech)` replaces the two inline checks in `getAvailableMyomerTypes` and
      `getAvailableHeatSinks`.

## Round 4: vehicle, support vehicle, aerospace and ProtoMech catalogs

- [x] Support vehicle armor, vehicle motive types and chassis modifications: `techBase: "universal"`.
- [x] ProtoMech-only equipment: `techBase: "clan"`. `IProtoMechEquipment` now extends `ICatalogStanding`.
- [x] Capital weapons, sub-capital weapons and aerospace armor: `"both"` becomes `"universal"`, and
      `ICapitalWeapon`, `IAerospaceArmorType` and `IProtoMechComponent` drop their `Omit<…, "techBase">`. Readers
      changed: `small-craft.ts`, `capital-ship.ts`.

## Round 5: battle armor and conventional infantry

- [x] Infantry weapons, infantry armor and battle armor armor: `"both"` becomes `"universal"`; the interfaces drop
      the `Omit`. Readers changed: `battle-armor.ts`, `building.ts`, `infantry-platoon.ts`, `infantry-weapons.ts`,
      `_light-weapons.tsx`.
- [x] Battle Armor Equipment Table rows and the battle-armor-scale items get `editions`. The scale items also get
      `techBase` (their `catalog` side).
- [x] `pendingStanding` is retired. The standing test now checks every non-custom catalog for editions and tech base.

## Verification (each round)

- [x] `npx vitest run --project unit`, `npx tsc --noEmit -p .`, `npx eslint` on the changed files.
- [x] BV survey after rounds 3, 4 and 5: identical to the baseline.
