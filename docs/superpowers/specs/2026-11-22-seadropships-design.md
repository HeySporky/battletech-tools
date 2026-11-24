# SeaDropships: Flotation Hull, Pelican, Petrel, Gannet (#643 part 1) Design

Approved by NGCFells, 2026-11-22. This is Custom Homebrew (rules level 6), NOT OFFICIAL. It is not Apocryphal, because no printed book offers these. The canon water-landing rules they build on stay canon.

## Intent

Vehrec (2026-11-19) pictured the Pelican: an aerodyne DropShip with a deep hull that lands on water and motors around as a ship, and can still drop its landing gear. NGCFells made it a family of three: an assault carrier (the Pelican), a freighter and a patrol ship, all on one new hull option. The goal is a hull any aerodyne DropShip can take in the Small Craft Creator, three sample designs, and play rules in every edition that has DropShips.

**Credit:** Vehrec for the Pelican; NGCFells for the Petrel, the Gannet and the Flotation Hull. The credit goes in notes, the TRO, the credits page and the news bullet.

## What canon already says (checked 2026-11-22, every edition in the library)

| Book | Water |
|---|---|
| *AeroTech* (1986); *BattleTech Manual* (1987); *BattleSpace* (1993) | "Craft landing in water hex +3" (Landing Modifiers). There is no floating rule. |
| *DropShips & JumpShips* (1988) | No rules. Lore only. |
| *AeroTech 2* (1998) | A vertical landing on water leaves no crater. The water landing modifier is on the table. |
| *AeroTech 2 Revised* (2004) | "Unit landing in water or swamp hex +3". |
| *Total Warfare* | +3 for a water hex. In the standard rules, an aerospace unit landing in Depth 1+ water is destroyed (as SO restates). |
| *Strategic Operations* 2011 p.73; *SO: Advanced Aerospace Rules* 2021 p.61 | Water Landing and Liftoff: any DropShip or Small Craft may land in Depth 1+ water. An aerodyne horizontal water landing crashes (×10 damage). Vertical landing and liftoff carry aerodyne modifiers. **Floating DropShips in Combat:** the ship cannot move except to take off; heat sinks ×1.1; no −2 grounded to-hit; +1 to critical rolls on the Nose and Aft (aerodyne); it drifts under Water Flow; a spheroid may partly submerge. |
| *TO:AUE* p.114, Flotation Hull | Hover, VTOL, WiGE and conventional fighters land on and take off from water as clear terrain. A conventional fighter with it may lift off horizontally from water. Cost ×1.25. |

## Goals

- **DropShip Flotation Hull:** a hull option for **aerodyne DropShips** in the Small Craft Creator.
  - **Weight and cost:** 5% of the ship's tonnage, and ×1.25 cost, as the canon Flotation Hull.
  - **Landing and takeoff:** it lands and takes off **horizontally** on Depth 1+ water as on a runway, extending the TO:AUE p.114 conventional-fighter rule. Vertical water landings and liftoffs follow SO:AAR p.61. It can still deploy its gear for a runway or clear ground.
  - **Afloat:** it moves as a large naval vessel, **Cruise 2 / Flank 3** on the ground map, on water jets. All the other SO:AAR p.61 floating rules still apply (×1.1 heat sinks, no −2 grounded, +1 critical, drift).
  - **Older editions:** under *AeroTech*, the *BattleTech Manual*, *BattleSpace*, *AeroTech 2* and *AeroTech 2 Revised*, the +3 water landing modifier does not apply to it.
  - **Alpha Strike:** our special **FLT** (levels 6-7). The unit lands on water and moves afloat with the n movement mode.
- **Well Deck:** a new bay. It weighs 65 t: 50 t for the vehicle it holds plus 10% each for gates and seals, support equipment and berthage (NGCFells, 2026-11-22), has a stern door, and launches and recovers hover or naval vehicles of up to 50 tons each **only while the ship is afloat**.
- **The three sample designs,** built by *TechManual* DropShip construction:

| Ship | Job | Tons | Safe thrust | Carries | Weapons |
|---|---|---|---|---|---|
| Pelican (Vehrec) | Amphibious assault carrier | 4,000 | 4 | Well deck for 4 vehicles (≤50 t), 4 'Mech bays, 2 infantry bays | Beach support: LRMs, autocannons |
| Petrel | Ocean freighter | 7,000 | 3 | About 3,500 t cargo, 50 passengers | Light defensive |
| Gannet | Naval patrol | 2,000 | 5 | Small craft bay, quarters for weeks at sea | Heavy guns, LRT torpedoes usable while afloat |

- **Lore:**
  - **Star League:** the Terran Hegemony's ocean-world marines take the Pelican in 2655, merchant lines take the Petrel around 2690, and the Navy's coastal squadrons take the Gannet around 2710.
  - **Succession Wars:** all three survive on water worlds and in the Periphery, where a ship that needs no spaceport is worth keeping flying.

## Non-goals and anti-goals

- The hull is not for spheroids: a spheroid lands on its tail and has no deep hull. Spheroids keep the canon SO:AAR rules, partial submersion included.
- It does not make a DropShip a submarine.
- It would be a failure if a canon DropShip's water landing changed in any way.

## Approaches

There is one sensible way: a hull option plus sample designs, because the Pelican's whole point is a hull that any aerodyne can be built with. The alternatives were dropped:
- A fixed, unbuildable Pelican record ignores the creator the app already has.
- A naval vessel that flies would break both the naval and the DropShip construction rules.

## Constraints

- **Rules level and editions:** Custom Homebrew, rules level 6. It rides at the default edition and is apocryphal after it, as usual. Its play rules are written for every edition that has DropShips (the table above), including the waived +3 in the older books (memory every-edition-every-rule).
- **Records and TRO:** the custom-completeness test applies to the hull and the well deck.
  - **SeaDropships are a unit type in the TRO** (NGCFells, 2026-11-22). They get their own readout, `docs/lore/seadropships-tro.md`, registered in `src/ui/pages/classic-battletech/tro-jbt.tsx` under the `unit-types` category, as walkers, Micro-Mechs and power armor are. Its contents: history, the hull and well deck rules, the edition notes, and the three ships' readouts generated from their sample designs (a `seadropship-samples.ts` beside `future-wars-dropship-samples.ts`, read into the readout the way `future-wars-dropships-readout.ts` does it).
  - The hull and the well deck also get a line in the homebrew equipment TRO.
  - A test keeps both TROs in step with the records and samples.
- **Usual checklist (the plan carries each):**
  - The hull and well deck in the Small Craft Creator.
  - Construction rules, the printed DropShip record sheet (hull, well deck, Cruise/Flank afloat), and Classic play: water landing, takeoff, afloat movement, well-deck launch and recovery, and the SO floating rules.
  - The Alpha Strike FLT special on the converted cards.
  - Values, dates and lore; the samples; the TRO readouts; the credits page; news; the issue comment in NGCFells's voice; check and deploy.
- **Check the extract first.** The *AeroTech* (1986), *DropShips & JumpShips* and *AeroTech 2* extracts are stubs, so their `.ocr.txt` files were read. Cite pages only once confirmed, and pull a page image where the OCR is in doubt.
- Comments on #643 are written in NGCFells's voice.

## Left to the builder

- The exact weapon fits and the armor of each ship, within the job and the tonnage above, by *TechManual* construction.
- Battle Value and cost, which follow from construction.
- The UI for the hull option and the well deck in the Small Craft Creator, following the existing bay pickers.
- How Cruise 2 / Flank 3 shows in play, following the naval vehicle play blocks.
