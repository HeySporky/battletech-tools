# RolePlaying, BattleForce 2 and AeroTech 2 Sections: Design (#635)

**Status:** draft for NGCFells, 2026-11-22. Plan: `docs/superpowers/plans/2026-11-22-other-game-sections.md`.

## What the issue asks

Three more games, each with a section of its own beside Classic BattleTech and Alpha Strike: RolePlaying (characters, skills, traits, life paths), BattleForce 2 (unit conversion and play), AeroTech 2 (aerospace play). The first content waiting is the Micro-Mechs 6.1.0.2 appendices, stubbed in `src/data/micro-mech-other-games.ts` (Custom Homebrew).

## The open choices

### 1. Which editions each section covers

Standing rule: every edition, every rule (memory every-edition-every-rule). The library has, in `C:/repo/ResourceLibrary/text`:

| Game | Editions in the library |
|---|---|
| RolePlaying | MechWarrior (1st, 1986), MechWarrior 2nd (1991), MechWarrior 3rd (1999; the Russian printing is in text; the English one to check), Classic BattleTech RPG (2006), A Time of War (`AToW-CGL-2022-V30Dated20220606.txt`) and its Companion, the quick-starts |
| BattleForce | BattleForce (FASA 1987, `BattleForce-FASA.txt`), BattleForce 2 (FASA 1997, `BattleForce2-FASA-1703-1997.txt`), the SO / IO:BF BattleForce (2012 QSR, `BattleForceQSR-CGL-2012.txt`) |
| AeroTech | AeroTech (1986), AeroTech 2 (`AeroTech-2-FASA-1718-scan.ocr.txt`), AeroTech 2 Revised (`AeroTech-2-Revised-FanPro-35011-scan.ocr.txt`); TW / SO aerospace play already lives in Classic BattleTech |

**Recommended:** each section is named for its game family ("RolePlaying", "BattleForce", "AeroTech") and carries an edition select, the way Classic BattleTech's rules editions work (`src/data/rules-editions.ts`), starting with the edition the issue names (AToW for RolePlaying since the Micro-Mech appendix is written for it; BattleForce 2; AeroTech 2 Revised) and adding the others edition by edition. A Classic BattleTech design is the input everywhere: no second unit store.

### 2. How big the first cut of each section is

**Recommended first cut:**
- RolePlaying: a character sheet (attributes, skills, traits, life path stages) under AToW, saved in local storage like rosters, printable; the Micro-Mech skills, trait and Training field as level 6 options.
- BattleForce: convert any saved or bundled unit to a BF2 unit (BF2 p.100 for 'Mechs and the matching pages for the other types), shown as a BF2 card and printable; a BF2 force builder; play later.
- AeroTech: an AeroTech 2 Revised record for any fighter, small craft or large craft the app builds (the AT2 values differ from TW), and AT2 play on the existing aerospace play view with the AT2 rules switch; the Micro-Mech emergency bay rule rides here.

### 3. Where the code lives

**Recommended:** pages under `src/ui/pages/roleplaying/`, `src/ui/pages/battleforce/`, `src/ui/pages/aerotech/`, each with `_router.tsx` like `alpha-strike/`; menu entries in `src/ui/components/top-menu.tsx`; conversion code in one class file per game (`src/classes/battleforce-unit.ts`, `src/classes/aerotech-unit.ts`, `src/classes/rpg-character.ts`); rules data in one data file per game. The `micro-mech-other-games.ts` stubs become the first records, their `status` moving to "built".

### 4. Rules levels and standing

Canon rules from each book at their own level; the Micro-Mech appendices at Custom Homebrew (6), as now.

## Not in this design

Each section's detailed rules: they come from each book on the page when its plan task runs (extract first, page image when the scan is in doubt, written back whole).
