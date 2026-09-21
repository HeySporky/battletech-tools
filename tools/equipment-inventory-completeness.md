# Phase 1 Equipment Inventory

## Verified Foundations

- Canonical equipment records are registered through `equipment-registry.ts`.
- Catalog summaries expose item, ammo, weapon, duplicate-tag, and source-gap
  counts through `getEquipmentCatalogSummaries()`.
- Universal ownership is filtered through the registry rather than duplicated
  in Inner Sphere and Clan runtime lists.
- Missile-family regression coverage includes Clan LRMs, SRMs, Streak variants,
  ATM/iATM, OS launchers, and LRT/SRT launcher records.

## Current Catalog Scope

- Inner Sphere: ballistic, energy, miscellaneous, missile, and artillery
  catalogs.
- Clan: ballistic, energy, miscellaneous, missile, and artillery catalogs.
- Universal: shared equipment catalog with metric-based equality checks.
- Custom: existing custom equipment catalogs remain isolated from canon lists.

## Confirmed Missile Coverage

- Inner Sphere: standard and Artemis LRMs/SRMs, Streak SRMs, Extended LRMs,
  Enhanced LRMs, MMLs, MRMs, Thunderbolts, Mortars, and Rocket Launchers.
- Clan: standard/Streak/Artemis LRMs, standard/Streak/Artemis SRMs, ATM,
  iATM, one-shot LRM/SRM, and LRT/SRT launcher families.
- Universal: Rocket Launcher 20.
- Clan MRM/MRT records are intentionally absent because Clan technology does
  not field those families in this catalog scope.

## Remaining Phase 1 Gaps

- Complete canon population for all non-missile equipment families and alternate
  munitions.
- Verified source metadata and domain legality on every legacy record.
- Dedicated LRT/SRT/MRT ammunition and TOR numeric profiles remain review-only;
  no Clan MRT/MRM promotion is planned.
- ATM/iATM ammunition subtypes and special alternate munitions need authoritative
  source mappings before promotion beyond the basic records.
- Obsolete, apocryphal, conflicting, and domain-specific scraped records still
  require explicit disposition.

Phase 1 is therefore structurally implemented and testable, but canon
population is not closed. The remaining work is source verification and
promotion, not a new catalog architecture.