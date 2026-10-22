# Beta feedback: era-first builders, ammo, tonnage, sponsons, vehicle sheet

Date: 2026-10-21. Status: approved by the user in chat 2026-10-21 (all four recommended options).

## Why

The user built a Thumper ArtVee on the beta site and reported seven problems. Each item below is one task with its
own tests and commit, in this order.

## Items

1. **Era first, and the era gates the tech base.** The Clan tech base is not selectable in the Star League era (user
   ruling; it replaces the 2026-09-30 decision in commit 92cc23ba). In every builder the era select comes right after
   the rules edition and rules level selects, lists every era the unit type can use, and the tech base select offers
   only the bases that era allows (intersected with what the rules edition allows). Picking an era the current base
   cannot use switches the base: Mixed Clan to Clan, Mixed IS to IS, Clan to IS, IS to Clan. A loaded design keeps its
   tech base; its era moves to the nearest open one (the classes' existing `setEra` behaviour).
   - `star-league` becomes IS only. Clan and Mixed start at `clan-founding-years` / `clan-inv` as now.
2. **Ammunition sort keys.** One format for every ammo record: `ammo, <weapon>, <munition>[, <side>]`, weapon names
   spelled the same in every record of that weapon (e.g. `long tom`, never `long-tom` or `long tom artillery`;
   `artillery` is not a separate leading word). A test pins the format and that every record of one weapon shares
   its `ammo, <weapon>` prefix.
3. **Ammunition list shows only ammo for mounted weapons**, with a "Show all ammunition" checkbox (off by default)
   in each builder's equipment list. Matching uses `getCompatibleAmmo`.
4. **Tonnage bar.** Every builder's equipment pages show a bar that stays on screen: tons used / total and remaining,
   and slots (or critical spaces) used / total where the unit has them; red when over.
5. **Sponsons are placement locations.** With sponson turrets, Left Sponson and Right Sponson are placement choices
   beside Left and Right; the designer decides which side weapons go in them. Sponson weight is 5% of each sponson's
   weapons, rounded up to the half ton, and both sponsons must carry the same weapon tonnage (TO p.348 and the turret
   construction rule: "an alternative to standard side-mounted weapons", weight from the weapons "assigned to" the
   turret). Critical hits treat sponson weapons as side weapons (TO p.348). Old saves: side weapons on a sponson
   vehicle load into the sponsons, as they were treated before.
6. **Vehicle ammunition prints its location.** Combat Vehicle ammunition goes in the Body (TM Step 5: only
   non-weapon items such as ammunition and sensors may be placed there; page to be confirmed from the PDF). The
   record sheet's ammo lines print "BD".
7. **Vehicle armor diagram.** Centred horizontally; a top-down outline per motive type (tracked hull with treads,
   wheeled, hover with skirt, VTOL with rotor, naval hull, WiGE, and the rest falling back to the nearest), with
   the turret when there is one; armor and structure circles larger than now.

8. **Readable warning text.** (Added by the user mid-pass, 2026-10-21.) The red warning and error text across the
   app is too small to read. No text smaller than 0.75rem anywhere; warning text at least 0.875rem, keeping
   WCAG 2.1 AA contrast (4.5:1) for the red against its background.

9. **Anti-orbital Long Tom rounds: discussion only, not built in this pass.** (Requested on the Star League Discord
   server, a BattleTech group, by SmilingNid, with ideas from Vehrec, Arkaxe and Ryan DesCastris; added by the user 2026-10-21.) Decide the
   mechanics and the rules level (Apocryphal, Custom or Munchkin) with the user before any code.
   **Decided 2026-10-22:** Custom (rules level 6), built in as Long Tom ammunition. It makes a surface-to-orbit
   attack under the StratOps rules for capital weapons (pp.91, 97-99), as a ballistic attack, for 2 capital-scale
   damage (the Long Tom's 25, TO:AUE p.96, at 10 to 1 is 2.5, rounded down by user ruling). 3 shots a ton (half the standard round's 5, rounded up). 60,000 C-bills a
   ton, twice Copperhead, for its three stages, extra explosive and guided payload. Tech rating E, as Copperhead.
   Era: Inner Sphere only, a Federated Suns development after the Smoke Jaguars razed Edo on Turtle Bay from orbit
   (7 May 3050, Era Report: 3052 p.17) so that it could never happen to them; prototype 3055, introduced 3062, used
   against the Word of Blake in the Jihad. Tag `ammo-is-long-tom-anti-orbital`. Battle Value is the standard
   round's 46 until ruled. **Battle Value ruled 2026-10-22: 28** (46 a ton prorated to 3 shots; the orbital reach adds no
   ground-map range). **Map play, user's rules 2026-10-22, design pending:** rounds in space are longer than ground turns,
   so several ground turns pass between shots (extra propellant, and the breech cools and is inspected). The target must
   be in the first section of the space/atmospheric map; anything farther is out of reach. A target that has moved one
   hex out of the aimed hex can still be hit, but it is unlikely. Something else that has moved into the hex may be hit.
   The round is too small for defenses to target well: fighters and point defense are rarely useful against it, but
   now and then they get lucky. **Numbers ruled 2026-10-22:** 6 ground turns to a space turn, one shot a space turn; one
   hex off is the normal attack roll at +4, two or more a miss; a bystander in the hex is hit on the normal roll; fighters
   and point defense stop it only on a natural 12. The app tracks turns and rounds; players keep a physical map.
   Era availability is still open (lost Star League tech, or a new development); BV is the standard round's until ruled.

10. **Record sheets carry every chart and rules helper an official sheet has.** (Added by the user 2026-10-21.)
    For each unit type, review the official record sheets and give ours the same tables and helpers, laid out as
    close as we can without copying them; our silhouettes stay our own. A player who prints our sheet has everything
    the official sheet for that unit type would give them (or the closest similar sheet, for our custom unit types).
    Its own design and plan, not built in this pass.

## Non-goals

- No change to which equipment a tech base may mount, beyond the Star League ruling.
- No change to Battle Value or cost rules.

## Claude's calls

- Era-switch fallback order for the tech base (item 1).
- Sort key format details (item 2).
- The tonnage bar's look and where it sticks (item 4).
- Old sponson saves load with side weapons in the sponsons (item 5).
