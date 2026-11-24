# Star systems: credits and rules

## MegaMek Data (the base)

`data/index.json` and `data/detail-*.json` are built by `scripts/star-systems/import_mekhq_systems.py` from MekHQ's
`data/universe/planetary_systems/canon_systems.zip`. Their notice, kept as the files carry it:

> MegaMek Data (C) 2025 by The MegaMek Team is licensed under CC BY-NC-SA 4.0.
> To view a copy of this license, visit https://creativecommons.org/licenses/by-nc-sa/4.0/
>
> NOTICE: The MegaMek organization is a non-profit group of volunteers creating free software for the BattleTech
> community.
>
> MechWarrior, BattleMech, `Mech and AeroTech are registered trademarks of The Topps Company, Inc. All Rights
> Reserved.
>
> Catalyst Game Labs and the Catalyst Game Labs logo are trademarks of InMediaRes Productions, LLC.
>
> MechWarrior Copyright Microsoft Corporation. MegaMek Data was created under Microsoft's "Game Content Usage Rules"
> <https://www.xbox.com/en-US/developers/rules> and it is not endorsed by or affiliated with Microsoft.

What is kept: position, star, recharge stations, each planet's type, position, gravity, atmosphere, pressure,
temperature, water, owners, socio-industrial ratings, and population (a figure that comes with a change of owner or
rating, and one every 50 years; MegaMek estimates one every ten). A field MegaMek cites keeps its citation; one it
does not is shown as "MegaMek Data".

`data/factions.json` is built by `scripts/star-systems/import_mekhq_factions.py` from MekHQ's `data/universe/factions`
and `data/universe/commands` (same licence, notice in the file): each owner code's name and its name changes by year,
so a campaign shows the name the faction went by on its date. A code MegaMek Data does not name (CEI, SE) is shown as
the code.

## Verified against our books (NGCFells's rule, 2026-11-19)

MegaMek's data is the base; our own books verify it. Each disagreement found in a book becomes an entry in
`star-system-corrections.json` with the book and page, and the book wins. The cross-check also reads the Inner
Sphere Cartography Society's maps (https://iscs.teamspam.net/): 2750, 3040 (Michael J. Flynn), the 3062 JumpShip
paths map and their undated map.

## Sites and garrisons (`star-systems-sites.json`)

Collected by hand from our own books, each entry with its book and page: industrial sites from the Objectives books
(2011-13), and which units were on which world, by date, from Objective Raids (1992), the House books and
Handbooks, the Field Manuals and the Combat Manuals. Not MegaMek Data.
