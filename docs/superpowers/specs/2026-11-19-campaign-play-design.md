# Campaign Play: design

Date: 2026-11-19. Branch `work/2026-11-19` (from beta 005f2972b). Issue #172 for the Future Wars parts.
Decided by NGCFells in conversation on 2026-11-19; marked "builder's call" where Claude filled a gap.

## Intent

Game Management gets **campaign play**: a saved campaign that carries a force, its money and its war from one game
night to the next. It covers both kinds of campaign the books print:

- **Unit campaigns**: one force (usually mercenary) with a C-bill ledger, contracts, repair, salvage, pilot
  experience. Mercenary's Handbook (1987, 3055), Field Manual: Mercenaries, Chaos Campaign, Campaign Operations,
  Mercenaries (2025), and BattleTech: Aces (already in the app).
- **Planet campaigns**: a war across a planet: areas, who holds them, supply, planetary assault. BattleForce (1987),
  BattleForce 2 (1997), Interstellar Operations; the Future Wars rules sit here.

Why: the Future Wars Economics article (Chunk H) needs somewhere to live, and NGCFells wants the canon campaign
systems of every edition in the app, with the Future Wars rules as alternates layered on them.

**NGCFells's instruction: "build smarter, not harder. Reuse, extend, be efficient."** One core, many editions; no
per-book tools.

## Goals

1. One campaign core (record, ledger, calendar, log, force, save/load/backup) used by every edition.
2. A planet layer on the same record: areas, controller, resource dots.
3. Each canon campaign system is an **edition**: a data file of its tables plus pure functions, chosen when the campaign
   is created. Editions are added one at a time after the core exists.
4. Fan rules (Future Wars Economics, the derived damage table, Reese's Planetary Assault) are **Special Rulesets**
   (category `campaign`, Custom Homebrew) that layer on whichever edition is in use.
5. BattleTech: Aces moves onto the core and becomes one edition; its saved campaigns still load.
6. Money comes from the app's own numbers: unit C-bill cost (`getCBillCostNumeric()` and the other unit classes'
   equivalents), BV, Alpha Strike PV. No edition re-prices a unit by hand.

## Non-goals

- Drawing planet maps. Areas are a list (name, terrain note, controller, dots); a player keeps the map on paper.
- Running the tactical battles. A battle's result is typed in (who fought, size of force, losses, who holds the
  ground); the core applies the edition's after-battle steps.
- Interstellar-scale (multi-system) war in the first pass. Interstellar Operations' inner-sphere-at-war level is
  read in the survey and planned later if the survey shows the core can carry it.

## Anti-goals (would count as failure even if it works)

- A copy of the force list, ledger or log per book (Approach B, rejected).
- Numbers invented and shown as canon. Every canon figure is read from the book's page (OCR checked against the page
  image) and checked by a test; every NGCFells-derived figure says so in the UI.
- Breaking existing Aces campaigns or full backups.

## Approaches (NGCFells picked A on 2026-11-19)

- **A. Shared core + editions as data (picked).** One campaign record and screens; each edition supplies tables and
  pure functions through one interface; fan rules are Special Rulesets on top. More design up front; each later
  edition is mostly reading tables into a data file.
- **B. One tool per book (as Aces today).** Fastest first ship; every book rebuilds force, ledger and log. Rejected:
  against "build smarter".
- **C. Calculators only.** Cheapest, no saved state, so not campaign play. Not picked, but A's pure functions are tested
  first, so calculator-style pages can ship early and grow into campaign screens.

## Decisions by NGCFells

1. **Both kinds** of campaign (unit and planet). Planet layer first, because Economics needs it.
2. **Economics is ONE ruleset**, the two printings merged (FW #5, 1987, pp.5-6, and *The Best of Future Wars* (1991)
   pp.33-34, both by Herb Barents). This is an exception to the standing "one ruleset per printing" rule; the
   ruleset's description says: "Both printings merged into one ruleset by NGCFells's decision."
3. **A derived damage table** for dots, since neither printing gives one (both leave it to the GM). Credited
   "Inspired by Herb Barents, *Future Wars* #5"; derived by NGCFells.
4. **Editions to read**: BattleForce, BattleForce 2, the Mercenary's Handbooks, and the rest listed under Sources.
5. **Approach A.**

## What the Economics article says (read from page images, 2026-11-19)

Both printings: a planet map; resource types light manufacturing, heavy manufacturing, mining, radioactive materials,
oil, food, refining, processing ("you can add more or subtract"); a coloured dot per resource placed by terrain
(mining in rough/mountain, manufacturing near cities, food on plains); **1 million C-bills a dot**; dots worked
together yield more; **payday every three months**; the money pays people, parts and armor; destruction scales with
the size of the fight; food is easiest to destroy, heavy industry hardest; partisans attack as the war lengthens.

FW #5 only: mining + refining + heavy manufacturing = **7 million**; two food + one processing = **6 million**; oil +
refining + processing = **12 million**; "you cannot use ALL of the dots in conjunction with other dots";
manufacturing, processing and refining yield more than other things; heavy manufacturing leads to light; "make up a
table for each of the things on your planet" (destruction).

Best-of only: the combination pays more only when its dots share a **county** (cuts transport costs): "double or
even triple" (no fixed figures); scorched earth; commando forces (BattleTroops/BattleForce); the backers may pull the
plug if the operation will never pay. (The re-plan's note that the reprint adds a MechWarrior "pain factor" paragraph
is wrong: pp.33-34 have none. Correct the plan.)

## Economics ruleset (merged) — rules as built

- Ruleset id `fw-economics`, category `campaign`, `changes: ["planetEconomics"]`, Custom Homebrew, tag "FW #5",
  author Herb Barents, sources both printings. Needs the planet layer (any edition with one, or none: it also runs
  on a campaign with no edition rules).
- Dot types: the eight printed. GM may add a custom type (name, value 1 million unless set).
- Each dot: 1,000,000 C a quarter to the area's controller.
- **Combinations** (merge rule, shaped by the two texts; approved by NGCFells 2026-11-19):
  - A combination counts only when all its dots are in the **same area** (Best-of).
  - The three FW #5 combinations pay their printed totals: 7 / 6 / 12 million.
  - Any other combination the GM defines pays double (default) or triple (GM's choice) the dots' sum (Best-of).
  - A dot belongs to at most one combination ("cannot use ALL the dots", FW #5). The app picks the grouping that
    pays most and shows it; the GM can override.
- Payday: every 3 campaign months, a ledger entry per controller with the breakdown.

## Derived damage table (NGCFells, inspired by Barents). Approved by NGCFells 2026-11-19

After a battle in an area that holds dots, roll 2D6 for each dot there; on the target number or more the dot is
destroyed (pays nothing until the GM rebuilds it).

| Dot type | Destroyed on |
|---|---|
| Food | 6+ |
| Oil | 7+ |
| Mining, Radioactive materials | 8+ |
| Refining, Processing | 9+ |
| Light manufacturing | 10+ |
| Heavy manufacturing | 11+ |

Size of the fight (largest force on either side): lance or smaller -2, company +0, battalion +1, regiment or larger
+2. Defender's restraint (FW #5 p.6: defenders avoid wrecking their own planet early): -1 if the defender holds the
area and the campaign is in its first quarter. Scorched earth (Best-of p.34): the side leaving an area may declare it;
+3 to every roll there. Partisans (both printings): each quarter, for each area held by the invader, roll once for one
dot chosen by the GM at -2. A natural 2 never destroys.

## Architecture

### Core (`src/classes/campaign/`)

- `Campaign` record: id, name, edition id (or none), Special Rulesets ticked, start date, current month, force,
  ledger entries `{ month, amount, reason, rule }`, log entries, planet (optional), edition state (opaque, owned by
  the edition), export/import with a version number.
- Force: references to saved units/forces the app already has (Classic BattleTech force and Alpha Strike force
  saves), each with campaign state (damage, repair status, pilot). Cost read from the unit class.
- Calendar: months. Advancing a month runs the edition's and the rulesets' monthly hooks (pay, upkeep, payday each
  3 months).
- Persistence: `saveCampaigns` / `getCampaigns` in `dataSaves.ts`, included in the full backup (optional key, so
  older backups restore), cap as the other collections (500).

### Editions (`src/data/campaign-editions/<id>.ts`)

One interface, `ICampaignEdition`: id, name, source citation (book, printing, page), kind (`unit` | `planet` |
`both`), and optional hooks: `onMonth`, `afterBattle`, `repairCost`, `salvage`, `contractPay`, `pilotAdvance`,
`supply`. An edition implements only what its book prints; screens show only steps the edition has. Printings with
real rule differences are separate editions (as the standing reprint rule says); misprints follow the original.

### Planet layer

Planet: name, areas `{ id, name, terrain note, controller, dots[] }`, sides. Used by planet editions and by
`fw-economics` / the damage table / Reese's rules.

### Fan rules

Special Rulesets with `category: "campaign"` and change keys `planetEconomics`, `planetDamage`, `planetAssault`.
They plug into the same hooks after the edition's own.

### Aces

`AcesCampaign` becomes the Aces edition on the core. Its export version 1 imports into the new record unchanged in
meaning (test with a saved v1 campaign). Aces' screens keep working throughout.

### UI (`src/ui/pages/game-management/campaigns/`)

Campaign list, new campaign (name, edition, rulesets), campaign home (calendar, ledger, force, log), planet page
(areas and dots, payday preview, damage roller), after-battle form. Game Management home links it. Fan rulesets
show NOT OFFICIAL and their credits, as elsewhere.

## Sources to read (survey chunk)

All have text extracts in `ResourceLibrary/text`; natives in `JBTIICRework`. OCR checked against page images.

| Book | Year | Kind |
|---|---|---|
| BattleForce (FASA) | 1987 | campaign rules, lance repair (pp.61-67) |
| Mercenary's Handbook (FASA 1616; FanPro 2005 reprint) | 1987 / 2005 | unit |
| BattleTech Compendium (FASA 1640; 1691 Rules of Warfare) | 1990 / 1995 | check for campaign rules |
| Mercenary's Handbook 3055 (FASA 1670) | 1993 | unit |
| BattleForce 2 (FASA 1703) | 1997 | planet: Planetary Assault, Supply, Planetary Movement/Combat, Campaigns appendix |
| Field Manual: Mercenaries Revised (FanPro 10977) | 2005 | unit |
| Chaos Campaign (CGL 2008; rulebook 2009) | 2008-09 | unit (warchest points) |
| Strategic Operations (2011 and later printings, errata) | 2011+ | check for campaign / maintenance rules |
| Campaign Operations (2016, 2021, 2023, errata 2024) | 2016+ | unit and planet |
| Interstellar Operations BattleForce | 2021 | planet |
| BattleTech: Mercenaries (CGL) | 2025 | unit |
| Objective Raids (FASA 1665) | 1992 | planets: border worlds, garrisons, factories, raid rules, pirate points |
| Objectives: Capellan Confederation, Draconis Combine, Federated Suns (CGL 2011); Free Worlds League, Lyran Alliance, Periphery (2012); The Clans (2013) | 2011-13 | planets: industrial sites and products by world, planetary conditions for campaigns |
| *Future Wars* #5 pp.5-6; #16 pp.14-25 (Reese, Planetary Assault) | 1987 / 1990 | fan alternates |
| BattleTech: Aces | | unit (already built) |

For each: what it tracks (money, time step, contracts, repair, salvage, experience, supply, territory), its tables
with pages, and which hooks it needs. The result decides the `ICampaignEdition` hook list before the core is built.

## Build order (each a plan chunk; detailed in the plan)

1. Survey (read every source above; ledger table; finalise the hook list). Correct the re-plan's "pain factor" note.
2. Core + persistence + backup + empty campaign screens (no edition).
3. Planet layer + `fw-economics` + derived damage table (first shippable piece).
4. Aces onto the core.
5. Planet editions: BattleForce 2, BattleForce 1987, Reese's Planetary Assault (fan), Interstellar Operations.
6. Unit editions, oldest first: Mercenary's Handbook 1987, 3055, Field Manual: Mercenaries, Chaos Campaign, Campaign
   Operations, Mercenaries 2025.

Each chunk ends green (`npm run check` in PowerShell), news line, merge to beta, deploy (standing permission).

## Star systems (added by NGCFells, 2026-11-19)

"The app needs to have the systems and planets therein in order for players to be able to navigate to, or to assault
or defend them."

- **Base data: MekHQ** `C:/repo/mekhq/MekHQ/data/universe/planetary_systems/canon_systems.zip` (3,186 systems, CC
  BY-NC-SA 4.0, credit "MegaMek Data (C) The MegaMek Team"): coordinates, star type, recharge stations by date,
  every planet and moon, ownership / population / industry by date; most fields cite a book and page, others say
  "canon", "SUCS" (community atlas) or "assumption".
- **Verified against our own books** (NGCFells: "we use our own books to verify megamek... we are not cribbing someone
  else's work"): an agent checks cited fields against the library (page images), searches the books for fields
  cited only "canon", and records corrections in a corrections file the import applies (the book wins). Fields from
  SUCS or "assumption" are shown with that source.
- **Cross-check: the Inner Sphere Cartography Society maps** (`JBTIICRework/maps-and-art`, vector PDFs, about 2,100
  named systems each, 2750 / 3040 / 3062 + 3062 JumpShip paths; credit ISCS, iscs.teamspam.net; the 3040 map by
  Michael J. Flynn). Scale about 1.52 light-years a map point from Terra; Tharkad, Luthien and Sian match MekHQ's
  coordinates. Every system's position and its owner in those years is compared automatically; disagreements go to the
  verification ledger.
- In a campaign: the planet layer is a real system's planet (system id + planet name); the campaign has a start date,
  so the owner shown is the owner on the campaign's date; sides set targets `{ systemId, intent: travel | assault |
  defend }`; the app shows distance in light-years and the fewest jumps (jump range read in the survey; 30 light-years
  expected). Travel time comes with the editions.
- Not in this pass: a drawn star map (later); interstellar-scale war rules.

## Builder's calls after the review (Claude, 2026-11-19; NGCFells can overrule any)

1. **Currency and time step belong to the edition.** Each edition declares its money unit (C-bills, Aces Support
   Points, Chaos Campaign Warchest Points) and its time step (month, sortie, track). Ledger entries carry
   `{ step, amount, currency, reason, rule }`. The calendar advances one step of the edition's kind; with no edition
   it is months. `fw-economics` pays in C-bills every 3 months and needs an edition that keeps months (or none).
2. **The force holds a reference plus a snapshot.** When a unit joins, the campaign stores the saved unit's id and a
   copy of it (cost, BV, PV and the design). The campaign plays from the copy, so a later edit or delete of the saved
   unit changes nothing until the player presses "Refresh from saved unit". Export carries the copies, so a campaign
   moves between devices whole. Aces' inline roster maps straight onto the copies.
3. **Each side has its own ledger.** A planet campaign has sides `{ id, name, role: "attacker" | "defender" |
   "other" }`, more than two allowed; every side has a ledger, the player's force belongs to one side, and payday
   writes to the controller's ledger. A unit campaign has one side.
4. **Aces keeps its storage key, backup key and screens.** An adapter reads `acesCampaigns` into the core record and
   writes it back. Old backups need no conversion. Aces screens stay under `alpha-strike/aces`. The campaign list
   shows Aces campaigns beside the others.
5. **The survey ends with a check-in.** NGCFells reviews the survey ledger and the final hook list before the core
   (chunk 2) is built. If the survey shows the core cannot carry an edition, the design comes back to NGCFells.
6. **Campaign rulesets belong to the campaign only.** A unit's own Special Rulesets (construction and play) do not
   have to match the campaign's. Any saved unit can join, and no clash check is run. Campaign-category rulesets are
   ticked on the campaign, never on a unit.

## Left to the builder

File and component names within the folders above; screen layout (follow the existing Game Management and Aces
pages); the order of editions inside steps 5 and 6 if the survey shows dependencies; how the force picker reuses the
existing force saves.
