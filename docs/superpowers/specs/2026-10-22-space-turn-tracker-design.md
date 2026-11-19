# Space Turn Tracker and Anti-Orbital Fire: Design

Status: approved 2026-10-22; built (plan `docs/superpowers/plans/2026-10-22-space-turn-tracker.md`).
Parent: beta feedback item 9 (`2026-10-21-beta-feedback-design.md`). The round itself is built (commits 59fd4c02 to 6c7ea0e2).
Tabletop rules: `TRO.md`, Long Tom Artillery: Anti-Orbital Ammo.

## Intent

Some games have space forces as well as ground forces. Both sides play the space turn on the space/atmospheric map
section, then drop to the ground map for the shorter ground turns, then go back to space, and so on. An anti-orbital
Long Tom fires from the ground at a ship in that first space section. The app has no map system, and a full one is a
far-off goal that may never happen (user, 2026-10-22). So the app's job is to **keep the two clocks in step** and track
each anti-orbital shot. The players keep a physical map.

## Goals

1. **An option at setup.** A "Space forces in this game" checkbox on the roster page, next to Play Mode. It is off by
   default and saved with the force. When it is off, play looks exactly as it does today.
2. **Two clocks in the turn bar.** With the option on, the play screen's turn counter shows the space turn number and
   how many ground turns are left before the next space turn. There are 6 ground turns to a space turn (user ruling).
3. **Anti-orbital guns.** Each unit in the roster with a weapon that can fire the anti-orbital round, and a bin of it
   loaded, gets a "Fire anti-orbital" control. It asks for the aimed hex (typed in, from the physical map) and an
   optional target name. Firing spends a shot from the bin.
4. **Cooldown.** A gun fires the round once a space turn. After a shot, its control shows "fires again in N ground
   turns" until the next space turn begins. Until then the gun cannot safely fire **any** round, ground artillery
   included (user ruling 2026-10-22). If the player fires it early anyway, the app asks for a 2D6 roll first:

   | Roll | Result | The app records |
   | --- | --- | --- |
   | 2-4 | Catastrophic failure | The weapon is destroyed for the rest of the game |
   | 5-8 | Misfire | The round is spent and scatters (below); the gun cannot fire again this turn |
   | 9-12 | Fires normally | The shot, as usual |

   A misfire scatters from the aimed hex: 1D6 for direction on the Scatter Diagram (TacOps p.182), 3D6 hexes for
   distance (the Advanced Scatter roll for the worst misses). It goes off where it lands for its normal damage,
   friendly units included; off the playing area it is lost. The app shows these rolls as a reminder; players roll
   them at the table.
5. **Shots in flight.** Each shot is listed in the turn bar with its gun, aimed hex and target until it is resolved.
6. **Resolution in the space phase.** At the start of each space turn the app lists the shots in flight. For each one
   the player picks what happened. The app then shows the roll that applies (TRO.md rules, user rulings 2026-10-22):

   | What happened | Roll |
   | --- | --- |
   | Target still in the aimed hex | Normal attack roll |
   | Target moved one hex away | Normal attack roll at +4 |
   | Target moved two hexes or more | Miss, no roll |
   | Something else moved into the hex | Normal attack roll against it |
   | Fighters or point defense try to stop it | Stopped only on a natural 12 |

   The player records hit or miss. A hit reminds them of the damage: 5 standard (changed 2026-10-23 from 2 capital). The shot then leaves
   the list.

## Non-goals

- No drawn map, hex grid, movement or line of sight.
- No aerospace movement or space combat tracking beyond the turn count.
- No automatic damage to the target. The target is usually in the other player's force. Its owner applies the 2
  capital damage on that unit's own record sheet.
- No dice rolling by the app: players roll at the table, as they do now.

## Anti-goals

- Play for a game with no space forces must not change at all: no new controls, no new phases, nothing in the saved
  force beyond the off flag.
- The tracker must not stop a player from doing something at the table. It reminds and records; it never blocks a
  ground turn.

## Decided by the user

- Turn ratio: 6 ground turns to a space turn.
- Rolls: as in the table above.
- The cooldown blocks every round. Firing early risks the 2D6 table in goal 4; a misfire scatters as described there.
- The tracker lives on the play screen's turn counter. Gun controls sit with each unit; shots in flight are listed in
  the turn bar.
- It is a setup option, because a game without space forces has no use for it.

## My calls (for the user to check)

- **Order:** a game opens with space turn 1, followed by ground turns 1 to 6, then space turn 2 before ground turn 7,
  and so on. This is how the user described the loop ("space ... then back to ground ... then back to space").
- **Where the setup option goes:** a checkbox above the Play Mode button on the roster page. The roster has no setup
  screen of its own.
- **When the space phase happens:** at the start of the ground turn after every sixth one: the space turn changes
  from turn 7, 13, 19 and so on. Moving the ground turn counter by hand recomputes the space turn.
- **Which guns qualify:** any unit whose weapon can load the round (`getCompatibleAmmo`). This includes 'Mechs,
  vehicles, Support Vehicles, buildings and ArtVee combo guns in Siege Mode, wherever a Long Tom can be mounted.
- **Saved state:** the option, the shots in flight and each gun's last space turn fired are saved with the force, so
  a game resumes after a reload. Turning the option off mid-game hides the tracker but keeps that state, so turning it
  back on brings the shots in flight back; a game that never used the tracker saves only the off flag (my call,
  2026-10-22).
- **The space phase dialog** opens by itself only on the first ground turn of a space turn with shots due. Shots left
  unresolved stay on the turn bar with its Resolve button (my call, 2026-10-22). A gun's message shows only in the
  ground turn it was made.

## Open, for the user

None.

## Left to the builder

- Layout and wording of the controls, within the play screen's existing turn-counter style.
- The test cases, provided they cover: the off option changes nothing, the space-turn arithmetic at 6, 7, 12 and 13,
  the cooldown, the early-fire table (each band), a shot spending ammunition, the resolution table and saving and reloading.
