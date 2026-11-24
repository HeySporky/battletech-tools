# Planning Round Summary, 2026-11-22

Every open enhancement that had no spec or plan now has one, except the ones listed under Blocked and Already done. Content-lead issues, #600, #599 and #644 (parked) were left out on purpose.

- **Planned:** 150 issues in 27 plans (2 with a spec).
- **Routed, waiting on thread text:** 22 Reddit issues (`2026-11-22-reddit-unsaved-posts.md` says where each goes once its thread is saved).
- **Blocked on a source:** #186 (the other Aces boxes) and #227 (the Snowblind campaign book and cards).
- **Already done or already planned elsewhere:** #110 (done under #76), #113 and #116 (`2026-09-30-ssw-runtime-import-custom-content.md` Tasks 9-13), #140 (large-craft card, #32), #143 (pod conversions, #647 plan), #172 and #175 (`2026-11-12-custom-homebrew-batch.md` and the Future Wars plans), #241 (the #600/#599 stream), #250 (`2026-11-12-custom-homebrew-batch.md` chunk 3).

Every plan carries the full checklist (records, construction, record sheet, play, Alpha Strike, TRO, credits, news, review, deploy, issue comment), is written to the recommended answer of each OWNER CALL, and says commit messages are plain, first person, with no co-author or generated-with line.

## Plans and their OWNER CALLS

### `docs/superpowers/plans/2026-11-22-aces-leftovers.md`

BattleTech: Aces, What Is Left (#187, #188, #189, #190, #192, #193, #194, #195, #196, #197, #198, #199, #200, #202)

- **#193 automated allies:** an ally is an automated unit on the player's side, drawn and driven by the same engine as the OPFOR (its own deck), shown with an "Ally" badge; it never counts toward the player's PV cap (Aces p.38 wording to be checked).
- **#199 mismatches with the box cards:** the MUL stays the target (the #590 ruling); a box card that differs is recorded in the unit's notes with both values, and the Aces game uses the box card's value only for the box's own sorties.

### `docs/superpowers/plans/2026-11-22-aerospace-leftovers.md`

Aerospace Leftovers: Fighter Altitude and Air-to-Ground, Small Craft, Stations, SDS, Capital Weapon Editions Implementation Plan (#137, #145, #148, #149, #150, #151, #152)

- **#152 price for capital (expanded) fire control:** 10,000 C-bills per ton of Expanded Fire Control (the TechManual's targeting computer rate per ton), only at Custom Homebrew and Munchkin, noted "Ours (NGCFells, 2026-11-22): the books price none".
- **#145 the 5-ton Escape Pod and Life Boat samples:** they are equipment carried by large craft (SO), not Small Craft; the Small Craft creator refuses them (as now) and the BLK reader imports them as a "Life Boat / Escape Pod" equipment line on the carrying ship when one names them, and reports the stand-alone file as "an escape pod, not a unit".
- **#137 map scale:** the roster tracks altitude and velocity per fighter and applies the to-hit, control-roll and attack rules; it does not draw the aerospace map (play mode has no map).

### `docs/superpowers/plans/2026-11-22-alpha-strike-more-unit-types.md`

Alpha Strike: Buildings, Saved Vehicles and Craft, Capital Weapons and LAMs Implementation Plan (#138, #139, #141, #142)

- **Building damage per emplacement (#141):** the card is filled from the constructed building as a default (its emplacement weapons converted with the standard per-weapon conversion, capped at the AS CF per emplacement, armor capped at the CF), and the roster lets players edit each emplacement's damage and the armor within those caps.
- **Custom LAM types (VTOLAM, PAM, Omni-LAM):** they convert with the same LAM rules; their extra abilities, if any, get our specials at levels 6-7 only, and their PV stays provisional until their own rules are written.

### `docs/superpowers/plans/2026-11-22-atow-weapon-converter.md`

A Time of War Weapon Converter for Infantry Weapons Implementation Plan (#228)

- **Which reading of "add custom weapons":** both (the converter, and any weapons posted on the issue bundled), since open issues get built.
- **A converted weapon's BV when the table rule cannot reach it:** the table rule always, labelled "converted, BV by the table rule".

### `docs/superpowers/plans/2026-11-22-battletech-gothic-edition.md`

BattleTech Gothic as a Rules Edition, Abominations and Necrotic Structure Implementation Plan (#280, #261)

- **Where Gothic sits in the edition timeline:** a parallel edition (2025, its own levels: Gothic prints no level names, so "Gothic" as one Standard level plus Apocryphal / Custom Homebrew / Munchkin), selectable in every creator and roster, never the default.
- **Abominations in the creators:** no abomination creator; the printed abominations are samples, and fan abominations (Task 6) are entered as records in the same data file.
- **AS conversion of abominations:** inferred conversion from the record as if a ProtoMech-like unit of its size class (move, armor/structure, damage by range from its attacks), flagged inferred; a level 6 option only if NGCFells prefers our own rules instead.
- **3015 'Mech variants and the Gothic TRO:** the TRO 3015 designs (UrbanMech, Firestarter, Phoenix Hawk, Scorpion, Rifleman, Marauder, Atlas, King Crab and the rest) as bundled designs with `battletech-gothic` availability, each checked against the Deluxe Record Sheets.

### `docs/superpowers/plans/2026-11-22-buildings-and-mobile-structures.md`

Buildings: Play Rules Still Owed, and Mobile Structures Implementation Plan (#153, #154)

- **Building shape for splash and domino:** the play card gets a small hex-layout editor (rows of hexes, which hex holds which level count) saved with the game, so splash and domino can name the adjacent hexes; with no layout set, those rules show as reminders only.
- **Mobile Structures home:** in the Building Creator as a structure type, not a new creator: same armor, heat sinks and weapons, new motive and power steps.

### `docs/superpowers/plans/2026-11-22-canonical-format.md`

Canonical Format, Provenance, Import Review and Unit Domains Implementation Plan (#100, #101, #102, #105, #106, #107, #108)

Spec: `docs/superpowers/specs/2026-11-22-canonical-format-design.md`.

- **File extension (#100 asks the group):** keep `.json`, with `"format": "jbt-design"` inside, so any JSON tool opens it and the app recognises it by content.
- **What the creators' Export button writes:** an array of v2 records (one per saved design) in `jbt-designs.json`; Import reads v2, v1 and the old raw arrays.
- **File names in provenance:** base name only, never the folder path (privacy).
- **Review screen for bundled builds:** no; it is for player imports.

### `docs/superpowers/plans/2026-11-22-card-and-sheet-photo-readers.md`

Card Photo Reader Remainder and the Record Sheet Photo Reader Implementation Plan (#592, #598)

- **Which Support / Objectives / Initiative cards:** only the ones the app models today (Aces scenario objectives `IAcesScenarioObjective` in `src/data/aces-cards.ts` ~330 and the Aces sortie `IAcesScenario` ~350); the others wait until the app models them, with a line on #592 listing which.
- **MechWarrior cards:** the Aces Named Pilot cards (skill, Edge, abilities: `aces-campaign.ts`) and the Alpha Strike pilot cards with Special Pilot Abilities (`alpha-strike-special-abilities.ts`); the read pilot goes onto the selected unit.
- **Game in progress from a sheet:** read marked armor and structure pips, heat, ammo used and critical hits into a new play session for that unit; never merge into a session already open.
- **Sheet layouts order:** TW-era 'Mech sheets first (most common), then the other TW unit types, then BMR / Third Edition / Battledroids layouts.

### `docs/superpowers/plans/2026-11-22-data-checks-and-catalog.md`

Data Checks and Catalog Follow-ups Implementation Plan (#130, #132, #133, #181, #184, #185, #214, #216, #217)

- **#184 open findings:** F3 take the workbook row; F5 per-weapon fractions after a three-card check; rest of F4 and F12 take the workbook value only where two MUL cards agree; approve the Proposed: Clan Only rows after the validator confirms the book.
- **#216 file split:** the rules-level split is done by those fields, not by more files; Task 7 audits that every record states its level and every custom record lives in a custom file, then #216 closes on that evidence.
- **#217 manufacturers:** an optional `manufacturers: { name: string; book: string; page: number }[]` on catalog records, harvested only from printed TRO "Armament" and component lines (never invented), and a per-design make from its own TRO text where printed.

### `docs/superpowers/plans/2026-11-22-equipment-wiring.md`

Equipment Wiring, Domain Catalogs, Newer Weapon and Armor Play, FrankenMech Leftovers Implementation Plan (#165, #167, #170, #182)

- **Tracked movement mode (#182):** it means QuadVee / tracked 'Mech movement on tracks (IO:AE QuadVee vehicle mode and the TO:AUE Tracks item), played as vehicle-mode MP and terrain costs.
- **Campaign Quality Rating and refit (#167):** in the campaign tool (`2026-11-19-campaign-play.md`'s home) as a per-unit Quality Rating (A-F) with CO pp.211-214's refit time and cost classes, shown on the unit's campaign card; FrankenMechs get their refit class from CO.

### `docs/superpowers/plans/2026-11-22-homebrew-rules-designs-and-sources.md`

Homebrew Rules, Fan Designs, Monoped / Hexapod / Octapod 'Mechs, Fan Wikis and the NOVA Combat Books Implementation Plan (#174, #176, #177, #242, #244, #245, #246, #247, #258, #272, #273, #276, #289, #597)

- **#276:** build TO:AR's Picking Up and Throwing Vehicles (p.94) and Objects (pp.90-93) as canon Advanced play rules; the post's variant only as a level 6 option if, once the thread is saved, it differs.
- **Hexapods and octapods (#174):** extend the quad rules (four legs: TM quad construction) to six and eight legs at Custom Homebrew: two or four more leg locations, structure per the quad table, leg actuator crits, Piloting bonus per extra pair of legs kept, hit location table rows rolled per pair; the post's specifics replace any of ours once it is saved (https://www.reddit.com/r/battletech/comments/fb5ufe/, "Eight and six legged mech thoughts"; t...
- **One-legged 'Mechs (#242):** Munchkin; one Central Leg location, hopping movement (walking MP as posted), a Piloting roll each turn it moves, falls on any leg damage roll, the Pogo Locust's BV checked against its sheet's 1355.
- **#597 stats:** save the image into `scrapes/reddit/17tjmlv.jpg` first and transcribe; check our BV against the image's.
- **NOVA Combat Books (#244):** a first-cut simulator page for the six Combat Books (pick two books, flip to the maneuver pages as the books direct), with the seven Copilot terrain cards tidied and marked "PLACEHOLDER" wherever they show, replaced when the real cards arrive.
- **Wikis (#176, #177):** save each item page into `C:/repo/ResourceLibrary/scrapes/` (`lostech.miraheze.org/`, `battletechfanon.fandom.com/`), triage into a list on each issue (item, kind, stats given, level), then build in batches of ten as the equipment round does.

### `docs/superpowers/plans/2026-11-22-infantry-leftovers.md`

Conventional Infantry: Specializations and Their BV, Beast-Mounted Infantry, Field Guns and Artillery, Transport Checks Implementation Plan (#136, #610)

- **TM v8.0 "Motorized: 1.0":** read it as the base row the add-ons sit on for every non-mechanized platoon (foot, motorized, jump all start at 1.0 and the specialization adds its value), since the errata lists it in the same table; mechanized keeps its own row.
- **Field guns crew:** TO:AUE's crew counts reduce the platoon's armed troopers as printed; a platoon may mix field guns and personal weapons only as the book allows.

### `docs/superpowers/plans/2026-11-22-into-the-future.md`

Battletech Into The Future Imports Implementation Plan (#229-#240)

- **Level for the strong items:** Custom Homebrew (6) for all equipment and designs; Munchkin (7) for Story Points (#233) and the Bioroid cockpits (#230), since each lets a unit ignore canon limits.
- **#234 the 6 Tech Level tree:** build it last, as its own Special Ruleset ("Into The Future tech levels") that a design opts into, so it never touches the TW tree; its items are level 6 inside it.
- **#239 catalog sheets (about 70 image-only sheets):** transcribe them by hand from the images in batches of ten (each batch a commit), checking each against the creator's validation; no OCR guesses ship.
- **#238 Aurigan Reaches TRO with no BV:** our BV by the rules; the notes say "no BV given by the source".
- **#231 Google Doc source:** NGCFells saves the doc as PDF into the library (`unsorted/`); work starts from the saved copy.

### `docs/superpowers/plans/2026-11-22-lam-leftovers.md`

LAM Leftovers: Bomb BV, the Alamo and the Prototype Rocket Pod, Aerospace Pilot Skills Implementation Plan (#159, #160, #161)

- **#159 bomb BV:** keep the TM reading, mark it "inferred: IO:AE is silent; TM p.315's external-stores rule applied" in the BV log, and stop calling the BV provisional for it (memory: inferred conversions stay at the item's level, noted).
- **Nuclear weapons switch (#160):** a Special Ruleset entry "Nuclear Weapons (IO:AE)" in the shared game settings (`src/data/special-rulesets.ts`), off by default; the Alamo is offered only with it on.

### `docs/superpowers/plans/2026-11-22-library-housekeeping.md`

Reference Library Housekeeping Plan (#222, #223, #224, #225, #226, #601)

- **#226 publisher of 2008-09 WizKids-licensed books:** Catalyst Game Labs (CGL), since Catalyst published under the WizKids licence from 2007 and FanPro's licence had ended; the file name says CGL and the edition notes the licence holder.
- **#226 fan-made or official:** official when the file carries a FASA, FanPro or CGL copyright block or came from the publisher's site or store; fan-made otherwise.
- **Push day:** run part 1 on 2026-12-01 as planned, verify, then part 2 on 2027-01-01.

### `docs/superpowers/plans/2026-11-22-maximum-tech-and-bv-gear.md`

Maximum Tech in BMR and BMR(R), Gear BV Prices but Nobody Builds, Side Bonuses, Combat Drops Implementation Plan (#611, #612, #617, #622, #624, #628)

- **Side bonus stacking (#622, MT p.91):** as the book says, decided in the single side-bonus line, with the log naming which bonus won.
- **Handheld weapons (#611):** a handheld weapon is its own small design (TO:AUE p.193: weapons + ammo + armor x 2 BV), built in the 'Mech creator's equipment step as a "Handheld weapon" item with its own armor, carried in a hand actuator; its BV is added to the carrying 'Mech's final BV.
- **Trailer BV1 (#624):** the roster gets a "rig" link (tractor plus trailers in the same group); BV1 then uses the rig's MP for each; without a link a trailer reads Flank 1 as now.

### `docs/superpowers/plans/2026-11-22-mech-components-and-cockpits.md`

Custom Chassis Components, Custom Cockpits and the Last Cockpit Add-ons Implementation Plan (#114, #115, #171)

- **DNI cost:** keep 250,000 (the rules text, as MegaMek) and show the table's 500,000 in the TRO note, as the record says today.
- **Second warrior on the sheet:** a second MechWarrior monitor (name, Gunnery, Piloting, hits) printed under the first for a Command Console, a tripod and a QuadVee; play tracks its hits separately (the console's warrior takes the head hits too, as the pilot).

### `docs/superpowers/plans/2026-11-22-megamek-import-export.md`

MegaMek Import Gaps and Every Export Implementation Plan (#103, #117, #118, #119, #120, #122, #123, #155)

- **Svartalfa 3 (#123), 100 kg over, no printed sheet:** import it as the file has it, flag "100 kg over its tonnage in the MegaMek file; no printed sheet to check" on the design and in `protomechs-report.md`, and bundle it only if its BV matches the MUL. It stays out of the bundle otherwise, with that reason.
- **Export fidelity:** an export is "complete" when re-importing it through our own reader gives the same design and BV; byte-equality with a MegaMek or SSW save is not a goal.
- **Custom and Munchkin items in exports:** written under their own names with a comment saying the target tool will not know them.

### `docs/superpowers/plans/2026-11-22-other-design-formats.md`

HeavyMetal, The Drawing Board, The Mech Factory and Bulk Import Audits Implementation Plan (#104, #124, #125, #126, #127, #128, #129)

- **Writers before a perfect reader?:** keep that rule; the writer task starts only when the audit shows 100% byte-identical round trips (except files the audit lists as damaged).
- **Bundle the fan HMP sets?:** not in this plan.
- **The Mech Factory and The Vehicle Factory (#129):** Task 7 is a survey only; a reader is planned once a sample and a format description are in hand.

### `docs/superpowers/plans/2026-11-22-other-game-sections.md`

RolePlaying, BattleForce and AeroTech Sections Implementation Plan (#635)

Spec: `docs/superpowers/specs/2026-11-22-other-game-sections-design.md`.

- **Section names and editions:** "RolePlaying", "BattleForce", "AeroTech", each with an edition select; first editions AToW, BattleForce 2, AeroTech 2 Revised (spec choice 1).
- **First cut:** the spec section 2 list; play for BattleForce comes after its converter.
- **Character storage:** local storage and the existing backup/restore, like rosters; no account.

### `docs/superpowers/plans/2026-11-22-quirks-plan-4-tandt.md`

Quirks Plan 4: Targeting/Tracking and Comms Catalog, Lost Issues Rules (#98, #99)

- **A separate switch for the T&T rules?:** no new switch.
- **Reaction time (Initiative):** Spec ruling 8 already decided: the average of the side's active units' penalties, halves toward zero.
- **#99 custom T&T systems:** Task 6 lists every T&T or comms system the TROs describe with a behaviour (for example a system "known for losing lock in heavy rain") as a proposal table on #99; you pick, then they go in as `custom: true` records at Custom Homebrew (6) with our effects.

### `docs/superpowers/plans/2026-11-22-reddit-homebrew-equipment-round-2.md`

Reddit Homebrew Equipment, Round 2 Implementation Plan (#243, #248, #251, #252, #254-#257, #259, #260, #271, #274, #275)

- **#252 relative stats:** work each out from the weapon it modifies by the post's rule (ER Re-Engineered: +50% range, heat as the ER step adds; HV Rifles: double damage against BAR under 7; and so on), labelled ours, at Custom Homebrew.
- **#251 both versions:** the as-posted HTM family at Munchkin and the commenters' single-shot fix at Custom Homebrew, as two record families with distinct names ("HTM" and "HTM (Rebalanced)").
- **#257 Dazzler vs Gothic's Dazzle Mode Lasers:** keep them separate; the Dazzler's notes point at the Gothic rule (`2026-11-22-battletech-gothic-edition.md` Task 2).
- **#275:** read the post, write the best-fit record with every inferred value labelled ours, and post the proposed stats on #275 for a yes before committing.

### `docs/superpowers/plans/2026-11-22-reddit-unsaved-posts.md`

Reddit Intake Waiting on Thread Text (#262, #268, #269, #277-#279, #281-#288, #290-#297)

- **Saving the threads:** paste each thread into its issue as was done on 2026-11-20 (fastest), or save it into `scrapes/reddit/`; either unblocks the issue.

### `docs/superpowers/plans/2026-11-22-rules-editions-leftovers.md`

Rules Editions: What Is Left (#203, #204, #207, #208, #209, #631)

- **The two missing TCI kit sheets (#204):** keep them inferred until a sheet photo turns up; the issue lists them as wanted (in the comment), and the 1985-86 TCI sets go to the Second Edition pass in Task 2.
- **Master Rules BV (#207):** BMR and BMR(R) BV1 are already built through `battle-value.ts` (`MECH_MASTER_RULES`, `MECH_MASTER_RULES_REVISED`); item 1 of #207 is about the editions before BMR that print no BV at all, which show "no Battle Value in this edition" instead of the current figure.

### `docs/superpowers/plans/2026-11-22-sources-editions-glossary.md`

Designs by Edition, Our Own Source Data, the Glossary and Custom MUL Upstream Implementation Plan (#590, #383, #382, #221)

- **#590 first edition when the MUL date and the book disagree:** the book's printing date wins (books are the sources); the MUL intro year is the fallback for designs not yet checked.
- **#590 roster filter default:** on by default for new forces, with a "show every edition" switch on the add page (saved per force), so an old force does not lose units it already holds; units already in a force that its edition lacks show a warning, never removed.
- **#382 where the links go:** a small dotted-underline link on the first use per page of each term (standing badges, rules level selects, the unit picker source filter, BV/PV headings), opening the glossary at that term; no hover pop-ups (they fail on phones).
- **#221 offer upstream?:** yes, as one PR to HeySporky/battletech-tools containing only the Custom MUL Editor, the `custom` MUL source and its loader, with the fan-made units themselves left out (Jeff can choose to ship an empty custom list); NGCFells opens it, the upstream leftovers plan (`2026-11-22-upstream-pr-leftovers.md`) pattern.
- **#383 cut date:** cut the corpora in one commit only after `verified` covers every shipped design; until then the progress count shows on the BV accuracy page (`bv-accuracy.tsx`).

### `docs/superpowers/plans/2026-11-22-support-vehicle-leftovers.md`

Support Vehicles, Patchwork Armor and IndustrialMech Leftovers Implementation Plan (#157, #158, #166, #169, #179)

- **Naval and rail map rules (#158):** sinking, running aground, boarding, derailing and collisions become play-card actions with their rolls and results (the player says "ran aground" / "collided with X"), as the water landing rules did (`water-landing-play.ts`).
- **BV checks with BV 0 on the live MUL (#158):** check against MegaMek's BV (`src/data/megamek-bv.json`, as #241's no-BV round did) and the printed record sheets where we have them; list mismatches in `support-vehicles-report.md`.

### `docs/superpowers/plans/2026-11-22-tooling-cleanup-performance.md`

Tooling, Cleanup and Performance Implementation Plan (#210, #211, #220)

- **knip as a dependency?:** no; run it with `npx knip@<pinned version>` from the audit script, so `package.json` does not grow.
- **Bootstrap trim:** import only the Bootstrap SCSS partials the app uses (measured by a purge report), keep `react-bootstrap`; if the saving is under 20 KB gzipped, skip it.

## Blocked or waiting

- **#186:** needs the other Aces boxes (rules and cards) in the library.
- **#227:** needs the Snowblind campaign book and its unit cards.
- **#262, #268, #269, #277, #278, #279, #281, #282, #283, #284, #285, #286, #287, #288, #290, #291, #292, #293, #294, #295, #296, #297:** each needs its thread text pasted on the issue or saved into `C:/repo/ResourceLibrary/scrapes/reddit/<post id>.txt` (Reddit refuses automated fetching).
- Inside planned work, waiting on a source: #280 Task 6 (u/EasterEggArt post), #174 (the fb5ufe post, for the author's specifics), #231 (the Aurigan Google Doc saved as PDF), #597 (the post image), #211 (typescript-eslint support for TypeScript 7).
