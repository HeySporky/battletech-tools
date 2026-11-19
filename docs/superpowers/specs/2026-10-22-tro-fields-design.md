# Technical Readout fields: design

Status: for user approval (2026-10-22). Mockups the user approved: `.superpowers/brainstorm/29235-1792720735/content/`
(`tro-sheet-layout.html`, layout B; `creator-section.html`).

## Why

The app builds units but keeps none of the text a Technical Readout (TRO) carries: the manufacturer and factory,
the makes of the engine, armor and weapons, and the Overview, Capabilities and Deployment prose. SSW and MegaMek
files carry that text, and the importers throw it away (TODO.md §2 asks for "manufacturer and fluff text" to be kept
for round-trips; Ideas #53). Custom designs, such as the ArtVee patterns (`docs/lore/artvee-tro.md`,
Ideas #69), need somewhere to hold the write-up and a way to print it.

## Goals

- An **optional** Technical Readout section in every unit creator. A design with nothing filled in behaves and
  saves exactly as today.
- **One shared resource**, built once (user ruling): one data record, one creator section, one printed sheet. Each
  unit type supplies only a small description of itself (its component rows, its equipment list, its construction
  table). There is no per-type TRO builder.
- Equipment makes: each piece of equipment can have a manufacturer and model. By default every copy of a type
  shares one make; the user can mark a type **mixed** and give each copy its own.
- A separate, printable **TRO sheet** in the modern two-column style (layout B).
- Carried through **import and export**: the app's JSON save, plus the SSW and MegaMek BLK importers.

## Non-goals

- No change to the record sheets. The TRO is its own sheet.
- No construction, BV, cost or play effect. Makes are text only.
- No shared text across variants of a chassis (rejected: each design keeps its own text).
- Buildings and gun emplacements: not in scope for the first two rounds (see Open item 1).
- No unit image on the sheet yet; layout B leaves the space for it (Ideas #14).

## Anti-goals

- Any required field, or any warning for an empty TRO.
- Breaking old saves, or making a save without TRO data larger or different.
- Per-unit-type copies of the TRO section or sheet.
- Rendering user or imported text as raw HTML without escaping (the existing `makeTROHTML` goes through
  `SanitizedHTML raw`; see its escaping comment at `src/classes/battlemech.ts:3090`).

## The shared record

One interface, used unchanged by every unit type, stored as an optional `tro` property on each unit's export
(`IBattleMechExport`, `IVehicleExport`, `IAerospaceFighterExport`, `ISmallCraftExport`, `ICapitalShipExport`,
`IBattleArmorExport`, `IProtoMechExport`, `IInfantryPlatoonExport`, and the support vehicle export). Absent means
empty. Every field inside is optional; an empty string is treated as absent and not saved.

- **Production:** manufacturer, primary factory, communications system, targeting & tracking system.
- **Components:** a map from a component key (`chassis`, `engine`, `armor`, `structure`, `heatSinks`, `jumpJets`,
  `gyro`, `cockpit`, `myomer`, `kfDrive`, ...) to one make string. One entry per component (user ruling).
- **Equipment makes:** keyed by equipment type (the catalog tag). Each holds a manufacturer and a model, a
  `mixed` flag, and, when mixed, a make per copy keyed by that copy's uuid.
- **Text:** Overview, Capabilities, Deployment, Battle History, Variants, Notable Units, Notes. Plain text with
  paragraph breaks.

My calls in this list:
- Battle History and Notes join the five sections in the approved mock, so SSW (`battlehistory`, `additional`) and
  BLK (`history`, `notes`) text round-trips without loss. Empty sections don't print.
- Ammunition, and items TROs never give a make (structural fittings such as CASE, actuators, ammo bins), get no
  make row. The unit type's description decides which equipment is listed.

## What each unit type supplies

A small adapter, a few lines each, next to the unit class:
- its component rows: key, label (e.g. "Engine (Fusion 280)"), in display order;
- its equipment copies: uuid, catalog tag, display name, location label (for the mixed rows);
- its spec-block values that come from the design (mass, speeds, jump, armor type, armament line);
- its construction table rows for the bottom of the sheet (see "The shared construction table").

Copies of equipment need stable uuids. 'Mech equipment has them; several other types' equipment exports mark
`uuid` optional (`IVehicleEquipmentExport`, `IFighterEquipmentExport`, `ISmallCraftEquipmentExport`,
`ICapitalShipEquipmentExport`). My call: a uuid is assigned, and from then on saved, only when it is needed, that is
when the user marks that type mixed (or an import brings in differing makes). A design that never uses Mixed saves
exactly as today.

A **copy** is one logical equipment item (one equipment entry with one uuid), never a critical slot, split part or
bay row. My call.

## The creator section (approved mock)

One shared React component, placed by each creator as its last step before Summary (the 'Mech Creator gets
"Step 7: Technical Readout" between Step 6 and Summary). Other creators put it in the same position: before their
summary or record-sheet page.

- Four groups: Production, Components (one make each), Equipment (one row per type: quantity, manufacturer,
  model, Mixed toggle), Text.
- **Mixed:** turning it on opens one row per copy, labelled by location, each starting with the type's make.
  Turning it off keeps the type's make and drops the per-copy ones.
- When the design changes: an added copy takes its type's make; a removed copy's make goes with it; a type
  removed from the design drops its entry; if a mixed type falls to one copy, it goes back to unmixed. A component
  whose kind changes (a new engine type) keeps its make; the user edits it.
- A "Print TRO sheet" button, and the same sheet in the creator's print menu.

## The printed sheet (layout B)

One shared sheet component fed by the adapter and the record:
- Title (chassis name), sub-line (model, tech base, mass).
- Spec block on the left: Mass, Chassis, Power Plant, Cruising/Maximum Speed, Jump Jets (where the type has them),
  Armor, Armament, Manufacturer, Primary Factory, Communications System, Targeting & Tracking. A line with nothing
  to show is left out. Space for a unit image on the right.
- Text sections in two columns, in the order above, empty ones left out.
- The unit's construction table at the bottom.
- The footer carries the trademark notice used on every sheet (memory: sheet trademark notice).

### The shared construction table (user ruling 2026-10-22)

Only the 'Mech builds a construction table today (`makeTROHTML`). Instead of one table per type, there is one
shared table component (user: always reuse components, and extend them where possible). Each unit type's adapter
lists its rows: item label, a middle value (rating, count or points; may be empty), mass, plus optional
sub-rows (the armor-by-location block, patchwork or FrankenMech lines). The shared component draws and escapes
them. The 'Mech's rows come from the same data `makeTROHTML` prints, so the two agree; the builder may move
`makeTROHTML` onto the shared component, as long as its current output on the creator pages is unchanged.

**Armament line:** built from the equipment makes, grouping copies with the same make and model: "2 Doombud
LRM-20, 2 Diverse Optics Type 2 Medium Laser, 2 Martell Medium Laser". A copy with no make prints its plain name.

My calls on the format:

- Each group prints as count, manufacturer, model, item name, joined by single spaces with empty parts left out:
  "2 Doombud LRM-20", "1 Diverse Optics Type 2 Medium Laser".
- No automatic plurals: names such as "Medium Laser (ER)" or "Streak SRM-2" pluralize badly, so the name prints as
  the catalog has it.
- If the make string already contains the item's name (case and hyphens/spaces ignored), as SSW strings often
  do ("Zeus LRM-15"), the name is not printed a second time.

The sheet is HTML, not SVG (my call): it is flowing text in columns, and the 'Mech construction table is already
HTML.

## Import and export

- **App JSON save:** the `tro` property, as above. No schema version bump is needed: it is optional and additive.
  The builder confirms that `canonical-record.ts` normalization passes it through and adds a test that an old save
  loads with no `tro` and saves without one.
- **SSW import ('Mechs)** fills the record from what the importer drops today: `<techbase manufacturer location>`
  to manufacturer and primary factory; the `manufacturer` attributes on `<structure>`, `<engine>`, `<armor>` to
  components; `<fluff>` children `overview`, `capabilities`, `battlehistory`, `deployment`, `variants`, `notables`,
  `additional`, `jumpjet_model`, `commsystem`, `tandtsystem`; and each equipment item's `<name manufacturer>` to that
  copy's make. Copies of a type that share a make import unmixed; differing makes import as mixed. SSW holds make
  and model in one string: import puts it all in the manufacturer field.
- **BLK import** (battle armor, ProtoMechs, Small Craft, support vehicles; the importers in `src/classes/*-blk.ts`):
  `<overview>`, `<capabilities>`, `<deployment>`, `<history>`, `<notes>`, `<manufacturer>`, `<primaryFactory>`,
  and the `TYPE:value` lines of `<systemManufacturers>` and `<systemModels>` (`CHASSIS`, `ENGINE`, `ARMOR`,
  `JUMP_JET`, `COMMUNICATIONS`, `TARGETING`). MegaMek's text holds `<p>` paragraphs: convert to plain paragraphs,
  never keep the markup. BLK has no per-weapon makes.
- An imported component make with no matching row on that unit type (a BLK `JUMP_JET` on a type with no jump
  jets row) is kept in the record and shown in the creator as an extra row under its imported label, so it is not
  lost. My call.
- **SSW and BLK export:** the app has no SSW, MTF or BLK writer today (the 'Mech exports page is a placeholder).
  When one is built (TODO.md §2), it writes these fields back in the same tags. The design records the tag mapping
  above so that writer can use it; round-trip tests belong to that work.

## Rounds

1. The shared record, adapter shape, creator section, printed sheet and construction table; the 'Mech Creator
   wired up (Step 7);
   SSW import of the TRO fields; JSON save round-trip tests.
2. Every other creator wired up with its adapter (including its construction table rows); BLK import of the TRO
   fields.

## Constraints

- Saved-data backward compatibility (astech rules §6).
- Domain logic in `src/classes/` or `src/data/` helpers, not in UI pages. Tests next to the source.
- Escape every user or imported string on the sheet and in the creator.
- Match the surrounding code style (4-space indent, Jeff's class-based model; small helpers rather than
  restructuring `battlemech.ts`).

## Left to the builder

- File names and where the shared component, sheet and record helpers live.
- The exact component keys per unit type, and each type's spec-block values.
- How the sheet prints (the existing print routes are the model), and how the text overflows onto a second page.
- Whether the existing "Import TRO Text" importer (`importTRO`, `src/classes/battlemech.ts:10918`) should also
  read the text sections; at minimum it must not wipe them.

## Open items for the user

1. Buildings and gun emplacements: left out for now. MegaMek's advanced-building files do carry overview,
   capabilities, history, manufacturer and factory, so they could use the same section later.
