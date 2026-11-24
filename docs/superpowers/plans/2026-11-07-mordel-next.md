# mordel.net import: what's left (handoff, 2026-11-07; updated 2026-11-09)

Branch `mordel-user-key`. The user keys, Settings, roster and designer import, the shipped list and
"My Mordel designs" are built and reviewed. What follows is the work after that.

## Picking this up in a cloud session

The branch is not on the public GitHub repo. It lives in the private repo `NGCFells2/ResourceLibrary`,
folder `Custom/cloud-handoff/battletech-tools/` (start with `Custom/cloud-handoff/CLOUD-START.md`):

- `battletech-tools.bundle`: every unpushed branch, this one included. The clone must have the bundle's base
  commits, so deepen it first (`git fetch --depth=1000 origin master`), then
  `git fetch <path>/battletech-tools.bundle 'refs/heads/mordel-user-key:refs/heads/mordel-user-key'`.
- `mordel-mirror.tar.gz`: the mordel.net unit details (56,043 units, full pull 2026-11-07). Unpack it to
  `tools/mordel-sync/.mirror/`, which is git-ignored. **It holds member designs: never commit it to
  battletech-tools, which is public.**
- `zz-gaps.test.ts`, `zz-bv.test.ts`: scratch harnesses. Copy them to `src/utils/mordel/`, change the
  `MIRROR` and `OUT` paths at the top, and run them with `npx vitest run src/utils/mordel/zz-gaps.test.ts`.
  The gaps harness takes `SLICE` and `SLICES` (run 4 slices at once: about 8 minutes, against well over 30
  for one) and writes `gaps-<slice>.json` plus a `.progress` file; `merge_gaps.py` joins them. Move them out
  of `src/` before `npm run check` or a commit.

Rules: no push, merge or deploy of battletech-tools without the owner's OK. The mordel.net key never goes
in a file, URL, log or commit. No member designs in committed test fixtures.

## 1. Alt names and tags (owner's call: do it). DONE 2026-11-09, except as noted

mordel.net items carry names only (no tags), so this is `altNames`. Commits 85604b97 and 2656b753:

- Every "X (Prototype)" weapon name mordel.net uses is an alt name of our Prototype or Primitive Prototype
  record (IO:AE pp.112, 189, 211).
- "Blue Shield PFD" is an alt name of the Blue Shield.
- RISC Super-Cooled Myomer: the MegaMek import read `myomer:Super-Cooled` as TSM. It is now that myomer,
  with its slots (IO:AE p.88); a superheavy takes half, rounded up (IO:AE pp.156-157).
- RISC Laser Pulse Module: paired with its laser like the PPC Capacitor (IO:AE p.87), by associated_id, or
  with the marked laser in its location when there is no link.
- Ladders by length (20 m steps; two member designs with 1, 5 or 10 m stay flagged); the light fluid
  suction system by unit kind.
- "Superheavy" myomer on a superheavy is standard myomer (IO:AE p.156): its 842 notes are gone.
- The vehicle BLK reader no longer cuts "primitive" out of `primitive-prototype-*` ammunition lines.

Gaps run (2026-11-09): units with an issue went from 5,319 to 5,110 'Mechs, 121 to 116 IndustrialMechs and 950 to
940 vehicles. ProtoMechs stayed at 84.

Not alt names, so moved on:

- **Command Console** on vehicles: TO:AUE p.113 lists the Cockpit Command Console for CV and SV, but our vehicles
  do not model it at all. A feature, part of section 3.
- **Blue Shield on vehicles**: TO:AUE p.108 allows it on CV, SV, AF and CF (1 slot in every location, carried in
  the body), but our record has `combatVehicle: -1`. Section 3.
- **Booby Trap**: only an Alpha Strike special ability here, not an equipment record. Section 3.
- **Bays, compartments, cubicles, seats, drop chutes** on vehicles (`Bay, Infantry (Foot)`,
  `Compartment, Battle Armor`, `Cubicle, 'Mech`, `Seat (Combat Crew)`, ...): transport space, section 2.

## NEXT (stopped 2026-11-09 mid-section 2, account change)

1. Run `npm run check` first: the last commit (wip, superheavy engine slots) has only had the converter tests.
2. Finish superheavy layout in `mordel-mtf.ts`: armor and structure slots halve too (IO:AE pp.155, 157; our model
   already does, `getCriticalSlots`). Apply the same `half()` to `armorSlots` and `structureSlots`. Test: a 150-ton
   design with IS Endo Steel writes 7 `IS Endo-Steel` slots, Clan Endo-Composite 2. Expected to clear most of the
   630 "CT has more than 12 slots" and the side torso and endo steel overflows (all superheavies), then rerun gaps.
3. Then the rest of this section.

## 2. Every unit kind imports (owner's call: do it)

The converters must take every unit on mordel.net. Not yet supported:

- LAMs: Avionics, Landing Gear, LAM Bomb Bay.
- QuadVees: Conversion Gear, QuadVee Wheels.
- Compact heat sinks, Superheavy myomer.
- Vehicles with engine "None" (trailers and the like).
- Placement: Environmental Sealing, Tracks, Endo Steel slots. "Unallocated Criticals". The Cargo add-on.
- Ammo read as standard rounds: Arrow IV Non-Homing, Fluid Gun Water, 'Mech Mortar Armor-Piercing.

## 3. Missing catalog items

Add with book citations (book over MegaMek, newest printing wins, errata first): Anti-'Mech Pod, Dumper,
Minesweeper, Mobile Field Base, Compartment (Battle Armor), Smart Robotic Control System,
PPC (Prototype), RISC Heat Sink Override Kit. The gaps run may add more.

## 4. Battle Value

Owner's rule: where our BV differs from mordel.net's, assume ours is wrong and find out why. Only when the
rules and errata show we are right does the case go in a report for Scott.

`zz-bv.test.ts` with `BV_CANON=1` sorts every canon mismatch:

- `theirsIsMul`: mordel.net matches the MUL, we don't. Ours to fix.
- `oursIsMul`: we match the MUL, mordel.net doesn't. Check the rules; if we hold, it goes to Scott.
- `allDiffer`, `noMul`: work through by hand.

From the earlier partial mirror: 'Mechs 3,930 of 4,269 canon match, vehicles 942 of 1,002, ProtoMechs
80 of 85. `tools/mordel-sync/canon-mismatch-report.json` has the 381 canon mismatches from the full pull
(290 BV, median gap 22).

## 5. Docs to bring up to date

- `docs/superpowers/plans/2026-11-07-mordel-storage-memo.md`, section "The list": still describes the
  dev-only gate. The list now ships (Scott agreed).
- `docs/superpowers/specs/2026-11-06-mordel-user-key-design.md`: mark the shipping question answered.

Run `npm run check` before each commit.
