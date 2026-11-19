# Shared game settings block and Special Rulesets (#324)

Written 2026-10-26. Status: approved by the user 2026-10-26. Builder check done; answers folded in.

## Why

Each Classic unit builder ('Mech, Vehicle, Fighter, Small Craft, Capital Ship, Battle Armor, ProtoMech, Infantry,
Building) wires its own Rules Edition and Rules Level selectors (`rules-edition-select.tsx`,
`rules-level-select.tsx`). Tech base and era are wired separately per builder, and the 'Mech builder has them further
down its first tab. The duplication costs lines of code. Worse, the order is unhelpful: a choice made lower on the form
can change a choice already made above it.

The user wants one shared block of selectors, used by every builder and by Alpha Strike, as the very first step. That
way everything else on the page relates only to those choices, and changes only flow downward.

## The block, in order

0. **Special Rulesets**: yes/no, default **No**. A one-line description sits beside it. Draft: "Optional and
   homebrew rules that change how the game plays or how units are built. Leave this off for standard BattleTech."
   Yes opens the Special Rulesets window (below), where the user ticks rulesets. It comes first because a ruleset can
   set the minimum edition and reshape every list below it (user ruling).
1. **Edition**: the most important choice after rulesets.
2. **Rules Level**: what is allowed at all under the edition.
3. **Tech Base**.
4. **Era**: only eras valid for the tech base and the rulesets are offered. Clan and Mixed tech start at Clan Founding
   Years, and there is no Clan in the Star League (user ruling 2026-10-26, which replaces "era before tech base").

Rules:
- Each step offers only what the steps above allow.
- Changing a step resets any later step whose value no longer fits, to the nearest valid value (the existing
  `getClosestEraForTech` / `fitTechToEra` behaviour). Nothing ever changes a step above the one being edited.
- Nothing further down a builder may change these values. Equipment lists, era-specific options, Battledroids
  printed-unit pickers and so on read from the block.

## Special Rulesets window

A large pop-up window over the builder or roster (user ruling 2026-10-26), so an unsaved design is never lost. It
reuses the app's `StandardModal`. A "Choose rulesets" button beside the yes/no reopens it.


- One checkbox per ruleset. Only rulesets that change gameplay or construction go here. A single custom item or unit
  type (ArtVee, VTOLAM) does not (#324).
- A ruleset is a data record:
  - `id`, `name`, `description`, and `source` (title and link, for attribution).
  - Optional `minEdition`.
  - Optional limits on the steps below: allowed rules levels, tech bases removed, eras removed or replaced.
  - `changes`: the list of things it changes (for example `techBases`, `eras`, `heat`, `bv`).
- **Conflicts**: two rulesets whose `changes` lists overlap cannot both be ticked. Once one is ticked, the other's
  checkbox is disabled and names the ruleset it clashes with.
- **Sample ruleset only, for now** (user ruling): "Sample: The Clans never existed (alternate universe)". It removes
  the Clan and Mixed tech bases (`changes: ["techBases"]`) and has no edition or rules-level limit. Real rulesets
  arrive later through their own issues.

## Where it applies

- All nine Classic builders: the block replaces each builder's own edition, rules level, tech base and era controls,
  and the old per-builder wiring is deleted.
- Alpha Strike (user ruling): the AS unit creator, and the AS roster's MUL search filters (tech, era and rules there
  follow the block).
- **Builder's call:** the Classic roster's MUL search follows the block the same way, for consistency.

## Attribution (#324)

Every card, record sheet, TRO and printout of a unit built with rulesets names them, with the source link. Example:
"Special Rulesets: Sample: The Clans never existed (alternate universe), <source>". Nothing is shown when no rulesets
are in use.

## Calls made by the designer (check these)

1. **The settings live on each design.** Each saved unit stores its own rulesets, edition, rules level, tech base and
   era. Today rules level is one global app setting (`appSettings.mechRulesFilter`, about 87 uses). That setting
   becomes only the default for new designs and for roster searches.
2. Old saves load with no rulesets and their current values. A stored value the block would not offer is kept and
   shown as is, like `getShownRulesLevel` does today, until the user changes it.
3. Selecting rulesets in the window applies them to the design being built, or to the roster search the window was
   opened from.
4. **Downward reset is automatic, with a notice.** When an upstream change makes a later value invalid, the later value
   moves to the nearest valid one, and a short line under the block says what moved (for example "Era moved to Clan
   Invasion"). No confirmation step. This applies to loaded designs too, but only when the user edits a step; loading
   alone never changes a value (call 2).
5. **Builder-internal reads follow the design.** Every read of `appSettings.mechRulesFilter` inside a builder (equipment
   lists etc.) switches to the design's own rules level. The global setting remains only the default for new designs
   and for the roster searches.
6. **Steps a unit type does not use are hidden.** If a builder has no tech base or era today (check each: Infantry,
   Building, Battle Armor, etc.), the block hides that step for it instead of adding new behaviour. Editions marked
   `noEras` hide the Era step, as today.
7. The Era list comes from the existing data (`era-options` gives each era its tech bases; `getErasForTech`), minus
   anything the rulesets remove. Mixed tech before Clan Founding Years stays impossible. Edition-specific eras
   (Battledroids) are reached as today, through the edition step.
8. **Alpha Strike storage:** the AS unit creator stores the block on each custom unit. The AS and Classic roster
   searches store it with their existing search settings in app settings (`alphaStrikeSearchEra`/`Tech`,
   `cbtMULSearch`).
9. **A stored value the lists no longer offer is flagged.** For example, an old Clan save under the no-Clans ruleset
   keeps its Clan tech base until edited (call 2). The block shows that step with a warning ("not offered under the
   ticked rulesets") so the mismatch is visible. Round 2 (final review of round 1).
10. **Rules level keeps to the edition's own levels** (user ruling 2026-10-26). A game level the new edition lacks
   becomes its nearest game level (highest at or below, else lowest), never Apocryphal: Total Warfare Advanced under
   Battledroids is Expert Battledroids. Apocryphal, Custom Homebrew and Munchkin stay only if already picked.
   `getShownRulesLevel` follows the same rule (`fitRulesLevel`), replacing the 2026-10-15 "lowest listed level above".
11. **Attribution reads the unit's save**, never the current block state, so a printout always shows what the unit was
   built under.

12. **The last level picked is the default** (round 2). Picking a rules level in the block sets the design's level and
   the app-wide `mechRulesFilter`, so the next new design and the roster searches start from it (call 1). A level an
   edition change fitted does not touch the default. A printed droid or sample picked in place of the design keeps the
   design's level and rulesets, since the picker listed it under them.
13. **The rules level is shown fitted, never flagged** (round 2). The block shows it through `getShownRulesLevel`;
   only Edition, Tech Base and Era carry the call-9 warning.
14. **The edition decides the tech bases** (round 2). `getEditionTechBases` (moved out of the 'Mech class) filters the
   Tech Base step, so Battledroids offers Inner Sphere only, and the step is hidden under an earlier edition that
   offers one choice, as the builders did.
15. **The game settings are not design work** (round 2). The replace-design guard and the edition-switch state leave
   the level and rulesets out: changing only them never asks to save, and never blocks the way back to an edition.
   Going straight back to the edition a design just left restores it exactly, tech base, era and level included,
   unless a level was picked while away; the block's notice is dropped once the design differs from what it described.

16. **Each unit type has its own tech bases and earliest era** (round 3). Battle Armor and Infantry build Inner Sphere
   or Clan; a ProtoMech is Clan only, from the eras that reach 3055. The resolver filters by these, so a step with one
   choice is hidden (call 6): ProtoMech shows no Tech Base step.
17. **Battle Armor's Mixed technology stays a construction option** below the block (its own Advanced gate, TO:AUE
   p.189), not a fifth tech base: the suit's tech base is its chassis's. An era change still turns Mixed off in an era
   without it.
18. **A ruleset can take a whole unit type away** (user ruling 2026-10-26, replacing round 3's "flag the tech base").
   ProtoMechs do not exist when the Clans never existed: the ruleset lists them in `removesUnitTypes`. A ProtoMech
   design cannot tick it (the box is disabled, saying why; a forced toggle is refused). An older save that has it
   ticked keeps Clan and shows one warning that ProtoMechs do not exist under it; unticking it is always allowed.
   Round 4's roster MUL searches leave out every unit type a ticked ruleset removes.
19. **A sample loaded in place of the design keeps the design's level and rulesets** (round 3; ArtVee samples), as
   call 12 does for printed droids.

20. **The MUL searches take the Special Rulesets step only** (user ruling 2026-10-26, round 4). It sits on top of the
   shared MUL filters, in both rosters. They have no Edition step and keep the MUL's own Rules, Tech and Era values, with
   "All". Ticked rulesets trim the Tech, Type and Era lists (the Clan era aliases too) and leave their units out of the
   results, live search included: under no-Clans, no Clan or Mixed units and no ProtoMechs (call 18). The search's
   Rules filter stays the MUL's own; the app-wide level does not set it.
21. **A search change moves later filters, never earlier ones** (round 4), in the order Tech, Type, Era: Tech and Type
   move to All, Era to the offered era nearest by start year (a tie goes to the earlier). Picking Clan tech moves Age of
   War or Star League to the Early Succession War. One line under the step says what moved.
22. **The Alpha Strike creator shows Special Rulesets and Rules Level only** (user ruling 2026-10-26, round 4): one AS
   edition, and no tech base or era on a card. The block comes first. The card type stands for a Classic unit type
   (BattleMech, ProtoMech, Combat Vehicle, Aerospace as fighter), so under no-Clans the ProtoMech type is disabled with
   the reason, and a ProtoMech card cannot tick it. The rulesets are saved on the card (`rulesets`, left out when none).
23. **The AS creator's level is not the app-wide default** (round 4): a hand-built card starts at Custom Homebrew, so a
   level picked there does not change the Classic builders' or the searches' default (call 12 does not apply).
24. **Attribution wording** (round 5): "Special Rulesets: <name>, <source title>", a source URL after the title in
   parentheses, rulesets joined with "; ", each listed once on a sheet of several units. An id no longer in the registry
   still prints, as "<id> (ruleset no longer listed)", so a sheet never hides what a unit was built under.
25. **Where the credit sits** (round 5): on the shared sheet footer, right-aligned above the tables line; on the 'Mech
   sheet inside the black footer band (the notices close up when there is a credit); on the Alpha Strike card in the
   strip under the Special box; on the printed card down the edge beside the trademark notice; at the foot of the TRO
   sheet and the HTML Small Craft and capital ship cards. A line too long for its room is squeezed to fit.
26. **Cards made from Classic designs carry their rulesets** (round 5): each `getAlphaStrikeUnit()` and the 'Mech's
   `calcAlphaStrike()` copy the design's rulesets onto the card (call 11), so the AS roster credits them too.
27. **About lists the registry** (round 5): the About page's Special Rulesets section is built from the registry, so a
   new ruleset appears there with its source without an About edit.

## Non-goals

- No real rulesets yet beyond the sample.
- No change to how rules levels, editions and eras are defined (`rules-editions`, `era-options`).
- No map or scenario rules.

## Suggested rounds (one per session, per standing practice)

1. Data: ruleset registry and sample AU, settings type, resolver (allowed options per step given the steps above),
   downward reset, conflict check. Unit tests. **Done 2026-10-26.**
2. Shared `GameSettingsBlock` component and the Special Rulesets window; wire into the 'Mech builder and remove its old
   controls. **Done 2026-10-26.**
3. The other eight Classic builders; delete the old per-builder code. **Done 2026-10-26.**
4. Alpha Strike creator and both roster MUL searches. **Done 2026-10-26.**
5. Attribution on cards, sheets, TROs and printouts. About and home news. **Done 2026-10-26.**

## Left to the builder

The component API, file names, how per-design settings are stored inside each class's save format, and the wording of
the disabled-checkbox reason.
