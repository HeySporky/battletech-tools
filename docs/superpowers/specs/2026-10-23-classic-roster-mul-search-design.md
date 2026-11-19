# Classic Roster MUL search: design

Status: done (2026-10-23). Round 1: 'Mechs, shared filters, unit-list checkboxes, ArtVees in the custom list. Round 2: vehicles, support vehicles, fighters, infantry, battle armor and ProtoMechs match saved designs by name (`getClassicUnitEntries`) and go into their own group table.
Origin Ideas discussion #84.

Idea from **Camille, Centrella-Sworn** on the Star League Discord.

## Why

The Classic Roster's add dialog can only filter the bundled Solaris Skunk Werks 'Mechs by name and rules level.
The Alpha Strike roster already searches the bundled Master Unit List copy (`src/data/mul/`) by name, era, several
factions, tech, type, role, rules level and unit list. Classic players want the same search to build an
era- and faction-correct force.

## Rulings (user, 2026-10-23)

1. **Match by name.** A MUL entry carries Alpha Strike stats, not a Classic design. Each hit is matched by chassis +
   model against the user's saved designs first, then the bundled SSW 'Mechs. A match adds that design to the group.
   A hit with no match shows "No Classic design yet" and links to the creator.
2. **'Mechs first.** Round 1 covers BattleMechs and IndustrialMechs. Round 2 adds the other Classic types from their
   saved designs, each going into its own table in the group.
3. **Separate settings.** The Classic search keeps its own saved filters (`cbtMULSearch`), so it never changes the
   Alpha Strike search. The filter UI is one shared component that both rosters use.
4. **Reuse the Alpha Strike search.** Same filters and the same bundled-data search. The Alpha Strike-only special
   ability filter stays on the Alpha Strike page. The PV sort is not carried over.
5. **Unit lists are checkboxes** (user, mid-round): live MUL 2.0, MUL 1.0 leftovers and custom units can be ticked
   in any mix (never none). Settings saved as the old "mul2+mul1" strings still load.
6. **ArtVees in the custom list.** `src/data/artvee-mul.ts` builds their entries from the Vehicle Creator's own
   Alpha Strike conversion; `artvee-mul.test.ts` checks `custom-units.json` matches and regenerates it with
   `WRITE_ARTVEE_MUL=1`. Bugs found on the way and fixed: minimal indirect fire printed `IF0` (MUL: `IF0*`), and
   rear gear with no damage printed `REAR-/-/-` (MUL leaves it out).

## Matching

Keys are normalised (lower case, HTML entities decoded, quotes dropped, whitespace collapsed) from
`chassis + " " + model`. A MUL chassis with an alternate name in parentheses, such as "Mad Cat (Timber Wolf)", also
gives a key for each name. Both sides go through the same keys, so a nickname the MUL writes in quotes and SSW writes
with `&quot;` in its model still meets. An OmniMech gives a key for each configuration.
Measured on the bundled data: 486 of 508 SSW 'Mechs match a MUL entry before the entity fix, and the misses were
`&quot;` nicknames.

## Design

- `src/utils.ts`: `searchBundledMUL(filters)` runs the dropdown and search-term filters over `loadMULListItems`.
  The Alpha Strike offline path builds its matcher with the same helper.
- `src/utils/classicMULMatch.ts`: `getMULMatchKeys`, `buildClassicMechIndex(mechs)` and `findClassicMech(unit, index)`.
- `src/ui/components/mul-search-filters.tsx`: the shared filter fieldset (search term, rules, tech, type, era with Clan
  eras, role, faction picker, unit lists, and an optional ability picker). It takes an `IMULSearchFilters` value and
  an `onChange`. A `typeIDs` prop limits the Type list.
- Alpha Strike `_AddUnitsPage.tsx` renders the shared component, mapped onto its existing `alphaStrike*` settings.
- Classic `_addMechDialog.tsx` gets a "Master Unit List Search" fieldset with the shared component and a paged
  results table (name, tech, era, tons, BV): Add/View when a design matches, a creator link when none does.
- `AppSettings.cbtMULSearch: IMULSearchFilters`, saved with the settings.
- In-app news credits the idea.

## Round 1 plan

1. Test-first: `classicMULMatch` keys and lookup (alternate names, nicknames, entities, saved before bundled).
2. `searchBundledMUL` plus the shared matcher. The existing MUL search tests stay green.
3. `IMULSearchFilters`, `cbtMULSearch` settings and the shared `MULSearchFilters` component. The Alpha Strike page
   switches to it, and the Alpha Strike e2e search specs stay green.
4. Classic dialog search + results + add to group, with a component test that a found 'Mech lands in the group.
5. News entry, then commit, push, `git deploy-beta`.

## Round 2 (done)

Vehicles, fighters, infantry, battle armor, ProtoMechs, Support Vehicles and so on, from saved designs, added to
their own table in the group.
