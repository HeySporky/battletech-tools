# Sonic Projectors (#645) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two Custom Homebrew weapons (a military and a law-enforcement sonic projector). Each is built, priced and converted to Alpha Strike, and played turn by turn in the roster with stun and rout on infantry. The canon Bombast Laser gets its power dial in play.

**Architecture:**
- **Records:** in `energy-custom.ts`.
- **Dial:** a pure helper module, `src/utils/dial-weapons.ts`, gives the setting's heat, to-hit and damage. BattleMech, vehicle and fighter play store the chosen setting per weapon uuid.
- **Infantry:** `InfantryPlatoon` gains stunned and fell-back play state.
- **Alpha Strike:** one of our special codes (SNC) plus a card block in `_asEWar.tsx`.

**Tech Stack:** TypeScript, React 18, Vitest (PowerShell only).

**Spec:** `docs/superpowers/specs/2026-11-22-sonic-projectors-design.md` (approved by NGCFells 2026-11-22). Issue #645.

## Global Constraints

- **Rules level:** Custom Homebrew, `rulesLevel: 6`, NOT OFFICIAL. Our Alpha Strike code exists only at levels 6-7 (`isCustomAlphaStrikeAbilityCode` / `allowsAlphaStrikeAbilityCode`).
- **Stats, exactly as the spec's records table:**

| Tag | Name | Weight | BM slots | Range (min/S/M/L) | Heat | Tech | Prototype / Introduced / Extinct / Reintroduced |
|---|---|---|---|---|---|---|---|
| `custom-sonic-projector-military` | Sonic Projector (Military) | 2 | 1 | 0/3/6/9 | 1 | C | 2410 / 2425 / – / – |
| `custom-sonic-projector-law-enforcement` | Sonic Projector (Law Enforcement) | 1 | 1 | 0/2/4/6 | 1 | C | 2290 / 2310 / – / – |

- **Dial:** Bombast: damage 7-12 equals the setting, heat equals the setting, to-hit +ceil((s - 7) / 2) (TO:AUE p.132).
- **Stun and rout:**
  - Stunned troopers return in the End Phase of the next turn. Stunned can't exceed living troopers.
  - Then a Morale Check (TO:AR pp.180-181). A failure means the platoon falls back: it must move away from the firer and makes no attacks next turn.
  - Immune: battle armor, sealed CI, vehicle crews.
  - Sonic: Thin atmosphere or denser only. A standard armor kit halves the dice, rounding down.
- **Credit** in notes, lore, TRO and news: NGCFells. No real-world brand names. The Havana syndrome is lore only.
- **Saves:** the new play state is optional. An old save loads with the dial at its top setting (12 for the Bombast) and no stun.
- **Condense and extend:** new source files: `src/utils/dial-weapons.ts` (with its test). Records go in `energy-custom.ts`; class state in the existing classes; UI in the existing play files.
- **Editions:** Custom Homebrew rides at the default edition (TW) and is apocryphal after it. The play rules work under every edition the roster plays (memory every-edition-every-rule).

## Review Focus

1. **Mechanized CI hit by stun.** Stunned counts in troopers, not damage points. A mechanized trooper (2 points) counts as 1 trooper.
2. **A platoon stunned while it is already part-stunned and part-dead.** Stunned never exceeds living troopers. When troopers die while some are stunned, the dead come off the stunned count first.
3. **Switching the dial after the weapon fired this turn.** The heat already counted for the turn follows the setting that was fired, not the new one. The picker locks once the weapon is marked fired.
4. **A sonic hit in Trace or Vacuum atmosphere.** No effect, and the line says why.
5. **Old save with a Bombast.** It fires at 12, as before.

---

### Task 1: Records, BV and cost, TRO, completeness

- Records in `energy-custom.ts`, the TRO section "Sonic Projectors" in `docs/lore/homebrew-equipment-tro.md` with the BV and cost derivations, and the completeness test.
- Mounting: sonic projectors on BM, IM, CV, SV.

### Task 2: The dial in Classic play (the Bombast Laser)

- `src/utils/dial-weapons.ts` with `getDialBand`, `clampDial`, and the unit setting helpers; the class methods `getDialSetting` and `setDialSetting` on BattleMech, Vehicle, AerospaceFighter and SmallCraft; the to-hit explanation; the sheet picker and footnote.

### Task 3: Stun and rout on infantry; sonic Deter

- `InfantryPlatoon.resolveStun`, `endTurnStun`, `getStunnedTroopers`, `isFellBack`, `setMoraleResult`, `isStunImmune`; the Stun Hit control in `_infantryPlay.tsx`; `endTurnStun` from `BattleMechForce.endEWarTurn`.

### Task 4: Alpha Strike: SNC

- The SNC special in `alpha-strike-special-abilities.ts`; the CI stun control in `_asEWar.tsx` and `resolveASStun` in `alpha-strike-ewar-play.ts`.

### Task 5: News, review, check

- The news bullet in `src/ui/pages/home.tsx`, the whole-branch review, and `npm run check`.
