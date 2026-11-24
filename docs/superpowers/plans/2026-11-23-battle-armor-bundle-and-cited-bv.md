# Battle armor: bundled MUL designs (#600, the files left out) and cited Battle Value and cost (#599)

Specs: `docs/superpowers/specs/2026-10-25-bundled-mul-designs-design.md` (round 4) and
`docs/superpowers/specs/2026-11-10-cited-bv-and-cost-design.md` (Order of work, step 8: battle armor after Combat
Vehicles). Reading ledger: `docs/superpowers/plans/2026-11-10-cited-bv-ledger.md` (Task 6 adds a "Battle armor" part).
Progress ledger, with the audit, the probes and the readings:
`.superpowers/sdd/2026-11-23-battle-armor-bundle-and-cited-bv/progress.md` (git-ignored).

Worktree `C:/repo/btt-infrule`, branch `ba-round` (from `bv-gaps` at acafeb2bf).

**Built 2026-11-23 on `ba-round` (Tasks 1 to 11, ledger in the progress file).** Bundle 1,032 kept (was 921), 150 BV differs (108 with verdicts, 42 open), 6 without a MUL entry; BV2 and BV1 as cited steps; cost with trooper training (440 of 943 compared suits match MegaMek to the C-bill). Still owed: the 42 open differences (Asura SRM, Callisto B, Centaur Sqd6, Constable ECM/Sensor, Fenrir Longshot, Baka LRR Sqd6, Fa Sure David/MG, Longinus C PPC, Nighthawk Mk. XXII, Shen Long Pop-Up Mine, Stormbird Jade Falcon, TinStar, Trinity Killshot, Tunnel Rat Armored Glove/GL), the remaining cost differences against MegaMek (AP mount 500 on 136 suits, the assault rifle 80 on 62, and a tail), BV1 item values from BMR(R) pp.156-158 (provisional, BV2 figures used), the Alpha Strike check of the NIU, and the merge and deploy when NGCFells says.

**Status: building. NGCFells answered all eight owner calls "as recommended" (2026-11-23).** The BV and cost audit against MegaMek and the MUL is done (2026-11-23).
The BV1, BV2 and import-gap readings of Task 0 are done (2026-11-23, second session, below); the cost readings (TM
pp.276, 281-282, 296-298) and two construction reads are still open in Task 0. The owner calls (8) are ruled below.

Merged `origin/beta` at 427fc7849 before this round.

## Readings (Task 0, 2026-11-23)

Extract first; page images only where the text layer was garbled. Companion pp.187-190 were read from the page images
and written back whole (ResourceLibrary, see the end of this list).

- **BMR (FASA 1998) p.142** (pdf 151): Infantry Battle Values table, BV and BV (Anti-'Mech Trained) columns, per
  standard unit (Clan Point of 5, IS squad of 4), "Adjust the BV proportionally for units of nonstandard size" (Clan
  Flamer 245 = 49 per trooper). No formula. Battle armor rows: Clan Standard Flamer/MG/Small Laser 245/234/279 (anti-'Mech
  only), Gnome 360 (not anti-'Mech), Salamander 247; IS Standard Flamer/MG/Small Laser/SRM 150/141/177/132 (all four
  in the anti-'Mech column, SRM too); Kage 79/77/88/63 (TAG); Kanazuchi 251 (not anti-'Mech); Longinus 168/159/195;
  Achileus 88/86/95; Gray Death Scout 63/65/74; Infiltrator 60; Sloth 109.
- **BMR errata (FanPro) p.12** "Infantry Battle Values (p. 142)": cut the three conventional LRM lines only. No battle
  armor change.
- **BMR(R) (FanPro 35000) p.155**: the same table and text, adding Sylph 211 (anti-'Mech), Undine 168, Fa Shih
  87/85/94/75 (TAG), Fenrir (MPL 222, 2 SPL 138, 3 SL 148, 3 MG 106, SRM 4 166; none anti-'Mech), Infiltrator Mk. II 121,
  Purifier ER SL/Narc/TAG 184/89/70; the conventional LRM lines are already gone (errata applied). Prints "Kanazuchi
  Assault Battle Armr Squad". BMR(R) p.150 (pdf 160) prices battle armor as fixed per-Point/squad costs (Clan Standard
  Point 3,500,000, IS Standard squad 2,400,000, ...), no construction.
- **CBT Companion (Classic BattleTech RPG Companion, FanPro 10975) pp.187-190** (page images): the BV1 battle armor
  formula, the only one in print. p.187: Trooper Training Costs table keyed by **Tech Base**: Inner Sphere 150,000, Clan
  200,000, "applied for each trooper in a formation"; Elemental Point (511,330 x 5) + (200,000 x 5) = 3,556,650. Step 1:
  armor points x 2 (fire resistant 3) + 1.5, +1 for ECM, x Defensive Movement Factor (1.0 + 0.1 per TMM, Stealth Modifier
  Table: camo/basic/prototype/standard stealth +2, improved stealth/mimetic +3, added to the TMM). p.188: "For units with
  detachable missile packs, use the best modifier for movement"; direct fire = all but SRM, advanced SRM, MRM and
  FarShot LRM; ammunition kg / 1,000 x the per-1,000 kg BV, fractions kept; Anti-BattleMech: "If the unit is capable of
  performing Swarm attacks, add the BV of all direct-fire weapons plus the BV of vibro-claws and/or claws and magnets
  that aid Swarm operations"; anti-personnel weapons only when the unit has no other offensive weapon; squad support
  weapon BV / troopers; Speed Factor table 1-12 = 0.54 to 1.89, best single movement mode. p.189: Missile Weapons BV
  Table; Step 3 rounds **per suit** then multiplies by the suits in the unit; Elemental 25.80 + 30.1124 = 55.9224, 56 x 5
  = 280 (prints ".077" for 0.77). p.190: Component BV Table: Battle Claw and Magnets 3, Mechanized Magnetic Clamps 1
  (separate rows), squad support weapon "Var.", ECM 1 (defensive), mine dispensers 5 (10 mines each), Pop-up Mine 6,
  Micro Grenade Launcher 1, **Grenade Launcher 2**, Compact Narc 1; anti-personnel weapons table. p.191 (extract):
  skill multipliers (Gunnery only), anti-personnel weapons ignored unless the suit has no other weapon. Finding: the
  Companion's Elemental (small laser, SRM 2) is 280, BMR(R) p.155 prints the Clan Standard Small Laser Point at 279.
- **Maximum Tech** (FASA 1999 corrected 2nd printing and FanPro Revised): no battle armor BV or cost. p.90 Level Three BV
  covers 'Mech and vehicle items only ("If a specific rule is not addressed ... no significant impact on BV"). p.61: EI
  neural implants on battle armor (every trooper implanted; +1 damage per hit). p.39: heavy-armor conventional infantry
  cannot swarm.
- **TO:AUE p.192**: Angel ECM (BA) as ECM but adds 2; BA laser-reflective and reactive armor at the fire-resistant BV;
  BA mechanical jump booster and BA myomer booster MP count in the Defensive and Speed Factors; BA detachable weapon
  pack: "use their standard movement rates (after all weapon packs are detached)". Equipment not in the TM/TO tables is BV
  0 (p.192 intro).
- **TO:AUE p.195** note P: "Mine Dispenser: BV is equal to a 10-point minefield of the appropriate type of mine."
  **p.197** Minefield BV Table (four TO printings agree): Standard 4 per 5 points (8 for 10), Active 6, Command
  Detonated 6, Inferno 5, Vibrabomb 5, Space 5, EMP 45 per hex. Our `battleArmorMineTypes` already holds 8/12/12/10/10/45.
- **TO:AUE p.225**: BA construction data (Mine Dispenser 20,000 / 5,000 per mine, 50 kg, 2 slots; DWP +18,000; myomer
  booster 75,000 x MP; Angel ECM 750,000; laser-reflective/reactive 37,000).
- **IO:AE pp.184-186**: EI neural implants lower Piloting and Gunnery by 1 for the BV skill multiplier only on a unit
  with an EI neural interface (p.184); dermal armor +3 BV and TSM implants +1 BV per augmented battle armor trooper,
  before skill (p.184); grappler lines and climbing claws x1.2 Anti-'Mech BR, conventional infantry (p.185); IS
  ProtoMech interface no BV (p.186). **IO:AE p.187**: "The BattleMech Neural Interface Unit alone has a Battle Value of
  0"; interface cockpit x1.30 on the 'Mech. **IO:AE p.110**: NIU on a PA(L) suit only, 100 kg, 2 torso slots; ejected
  pilot is a 1-trooper battle armor unit. **IO:AE p.180**: NIU cost from the Jihad Equipment table, implant cost waived.
- **TW p.228** (and TW errata v11.01 p.48, same text): "A battle armor unit equipped with magnetic clamps can mount
  standard BattleMechs and vehicles as though the carrying units were Omni units." A riding aid. **TM p.167**: clamps
  do not allow anti-'Mech attacks without the manipulators (capabilities table, "Uses Magnetic Clamps" row footnoted).
- **TM p.317 / p.318** (3rd and 4th printings): Grenade Launcher (Heavy) **2** / 0, Grenade Launcher (Micro) 1 / 0;
  **TM errata v6.0 p.34** moves both under a new "Battle Armor Equipment" header at the same BVs and lists Battle Claw (w/
  Magnets) 3/pair and Heavy Battle Claw (w/ Magnets) 3/pair apart from Magnetic Clamps 1. **TM p.256** (the record's
  page) is the grenade launcher and heat sensor construction page and prints no BV. The FanPro 2007 first-printing
  extract of p.317 is column-garbled at this row (not used).
- **TM p.256**: heat sensor "Tech Base: Inner Sphere and Clan" (Headhunter's `ISBAHeatSensor` on a Clan suit is legal).
  **IO:AE p.85**: battle armor APDS (Aegis), to read in Task 2.
- ResourceLibrary write-back: Companion pp.187-190 whole, into `SourcebookCompanion.txt`/`.raw.txt` (indices 187-190,
  LF) and the FanPro 10975 scan `.ocr.txt` (indices 186-189, CRLF), logged in `text/_corrected_pages.md`. Not committed
  there yet (this round commits on `ba-round` only).

## Audit (2026-11-23, summary; numbers and file lists in the progress ledger)

- 1,188 MegaMek files in `unit_files/battlearmor`. Bundle at acafeb2bf: 921 kept, 267 left out (166 BV differs, 86 no
  MUL entry, 15 import gaps).
- MegaMek's calculator on the same files: 801 ours = MUL = MegaMek; 120 ours = MUL where MegaMek differs; of the 166
  differs, 83 give MegaMek's value (MUL odd), 40 give a value where MegaMek = MUL, 43 differ from both.
- The 86 "no MUL entry" files are on the MUL under renamed variants. The legacy MUL archive the build already reads for
  infantry maps 81 of them to a live record with ours = MUL (guard: same squad size).
- Main BV causes: Tengu x12 jump lost on import (fix); burdened IS suits and the Anti-'Mech term (owner call 1); magnetic
  clamp BV outside the Anti-'Mech term (owner call 6); squad support weapon in Anti-'Mech (MUL split by squad size:
  verdicts); heavy grenade launcher 2 vs 1 (TM p.317 prints 2: verdicts); ammunition shots and BV (Phalanx, Fenrir
  Longshot); myomer booster written per location (Groundhog); trooper-specific ECM (Kage [ECM]); mine dispenser BV.
- Import gaps (15): IS heat sensor on a Clan suit (Headhunter x4), UMU on the Sea Fox x3, VTOL on the Tornado G17 x3,
  battle armor APDS (Aegis x3), BattleMech neural interface unit (Clan Interface Armor, Machina Domini).
- Cost: every file differs from MegaMek. TM p.285 adds a Training Cost per trooper (150,000 Inner Sphere, 200,000
  Clan) that our cost leaves out; TM p.286 works Max's Purifier to 3,456,000 and 3,523,500.
- BV1 for battle armor is `pending` under master-rules (BMR p.142) and master-rules-revised (CBT Companion pp.187-191);
  the Companion prints the formula, the BMR books only a table (owner call 7).
- No battle armor step file exists; BV and cost write text logs (`battle-armor.ts` `_suitBattleValue`, `_calcCost`).

## Global constraints

- The rule for the math (spec): every step read on its page; the books' worked examples are tests (Purifier 466 and
  Grenadier 326, TM pp.310-311; Purifier cost 3,456,000 and 3,523,500, TM p.286); a step is `cited`, `provisional` with
  a note, or `source-missing`; no tuning to hit the MUL; misses shown. MegaMek is a cross-check, never the authority.
- Model use: rules reading and anything that decides a number on Opus (Task 0); building on Sonnet; one Opus `astech`
  whole-branch review in Task 11.
- Extract first; page image only when missing or garbled; every page image goes back whole into every printing's
  extract (.txt and .raw.txt) and `ResourceLibrary/text/_corrected_pages.md`; commit there (CRLF), no push.
- Every edition, every rule; removed items stay apocryphal; a book offering an item for an edition makes it available
  there.
- Test-first; condense and extend (`battle-armor.ts`, `battle-armor-blk.ts`, `blk-unit-import.test.ts`,
  `battle-armor.test.ts`, `battle-armor-extended.test.ts`, `src/data/battle-armor-equipment.ts`,
  `src/data/bundled-units-build.ts`, `calc-breakdown.tsx`, `bv-verdicts.ts`). New file only for the steps:
  `src/data/calc-steps-battle-armor.ts`.
- Vitest from PowerShell (`npx vitest run --project unit <path>`). Never grep `src/data/equipment-*.ts` without
  `cut -c1-200`. No apostrophes in Bash; scripts with Write. Probes in `src/zz-local/ba-*.test.ts` and the ledger
  `probes/` are never committed.
- Commits, comments and news in NGCFells's voice, plain, first person; no co-author or generated-with lines.

## Owner calls (all eight ruled "as recommended" by NGCFells, 2026-11-23)

1. **Burdened suits and the Anti-'Mech BV.** TW p.220 bars IS suits with body-mounted missile launchers from anti-'Mech
   attacks until they jettison them; TM p.310 counts the term when the unit "can perform Swarm Attacks". MegaMek drops
   it; the MUL keeps it in 28 files and drops it in 8. BMR p.142 / BMR(R) p.155 put the IS Standard SRM squad in the
   anti-'Mech column (132), so BV1 kept it too. **Recommend: keep it** (a design capability; the launchers can be
   jettisoned at any time), a `cited` step naming both pages, and `mul-suspect` verdicts for the 8 (Trinity (Theseus
   RL)[LRR] x3, IS Standard (Baka) x5).
2. **Training cost by tech base or by troopers.** TM p.285 prices training by "Inner Sphere troopers" and "Clan
   troopers"; p.286 ties the Purifier's to "Inner Sphere troops"; the Companion p.187 table is keyed "Tech Base" (IS
   150,000, Clan 200,000). **Recommend: by the suit's tech base** (Clan suit, Clan troopers), a mixed-tech suit by its
   chassis tech base, a note on the step that a force fielding the suit with the other side's troopers pays the other
   rate; a creator toggle only if NGCFells wants it. Training applies at every edition (Companion p.187 for BMR(R)).
3. **Archive matching for battle armor.** **Recommend: yes**, the same legacy-archive lookup the infantry build uses,
   matched only when the squad size agrees (81 files join the bundle, no math change); and fix the TinStar (Original)
   match to TinStar, not Raiden.
4. **Squad support weapon in the Anti-'Mech term (Kage).** The 2026-10-08 ruling counts arm-mounted weapons only. The
   MUL counts the support MG in Sqd4 and not in Sqd5/6. The Companion p.188 and TM p.310 divide a squad support weapon by
   the troopers and say nothing of it in the Anti-'Mech term. **Recommend: keep the ruling**, verdicts for the Sqd4
   files.
5. **Heavy grenade launcher BV.** Settled by the reading: TM p.317 (IS) and p.318 (Clan) print Grenade Launcher
   (Heavy) 2, Micro 1; TM errata v6.0 p.34 keeps 2 under the new Battle Armor Equipment header; Companion p.190 prints
   Grenade Launcher 2. TM p.256 prints no BV. **Recommend: keep 2, re-cite the record's BV to TM p.317 (errata v6.0
   p.34)**, `mul-suspect` verdicts for Fenrir [VSP] x3 and Tunnel Rat [BC-GL] x3 (MegaMek's 1).
6. **(new) Magnetic clamps: Other Equipment or the Anti-'Mech term.** TM p.310 adds to Anti-'Mech "vibro-claws and/or
   claws and magnets that aid Swarm operations"; TM errata v6.0 p.34 and Companion p.190 list the magnet battle claws
   apart from the clamps (BV 1); TW p.228 makes clamps a riding aid and TM p.167 says they give no anti-'Mech attack.
   The draft's fix (clamp only inside Anti-'Mech) follows the MUL (Centaur x2, Longinus/Infiltrator (Mag) Sqd4 without
   it), not the text. **Recommend: keep ours** (clamp BV 1 under Other Equipment on every suit, the literal reading),
   `mul-suspect` verdicts for the files the MUL leaves it out of; drop the draft's Task 4 clamp change.
7. **(new) BV1 source by edition.** BMR (1998) p.142 and BMR(R) p.155 print only a table of stock suits with
   proportional scaling; the Companion pp.187-190 prints the only BV1 formula and points at BMR(R) for weapon BVs.
   **Recommend:** both master-rules editions use the Companion formula (`cited` under master-rules-revised; under
   master-rules `provisional`, noted that BMR 1998 prints the table only); the table rows are tests with misses shown
   (Companion Elemental 280 against BMR(R) Clan Small Laser 279); round per suit then multiply (Companion p.189).
8. **(new) BV1-era cost.** BMR(R) p.150 prices stock suits as fixed per-unit costs; the Companion prices a built suit
   plus training (p.187). **Recommend:** master-rules editions use the Companion construction cost plus training for
   any built suit, and show the BMR(R) fixed price beside it for the stock suits it lists (no override).

## Tasks

### Task 0: the readings still open (Opus)

Done 2026-11-23 (see Readings above): BV1 (BMR p.142 and errata p.12, BMR(R) p.155 and p.150, Companion pp.187-191,
Maximum Tech), BV2 (TM pp.317-318 and errata v6.0 p.34, TO:AUE pp.192, 195, 197, 225, IO:AE pp.184-187 and p.110, TW
p.228, TM p.167), heat sensor tech base (TM p.256: IS and Clan), NIU BV 0 (IO:AE p.187). Still open, read in the task
that needs them:
- Cost: TM pp.276, 281-282 (battle armor cost table), pp.296-298 (weapons), IO:AE p.180 (NIU cost); the Elemental
  [Laser] 500 C-bill difference (Task 8).
- Construction: UMU limits on the Sea Fox chassis (TM p.270), VTOL on PA(L) (TM p.165 table), BA APDS (IO:AE p.85)
  (Task 2).
- B9 check: our standard mine row is already 8 (TO:AUE pp.195, 197); the Fa Shih [David]/[MG] 9 is likely the clamp
  point (owner call 6). Confirm from the BV log in Task 10.

### Task 1: reader fixes and silent losses (#600)

Failing tests in `blk-unit-import.test.ts`, each from a real file's lines, then fixes in `battle-armor-blk.ts`:
- `motion_type Leg` with `jumpingMP 2` gives Jump 2 (Tengu Heavy BA (ML): BV 349, MUL 349);
- a spread-slot item written once per location (`CLBAMyomerBooster:Body/LA/RA`) is one item (Groundhog: BV 4);
- the shot count of `BA-SRM4 Ammo:Body:Shots1#` written twice (Phalanx (A): BV 292);
- trooper-specific ECM as the file means it (Kage [ECM] (Sqd5)), once Task 0 reads the rule;
- anything still not carried over is an import issue.

### Task 2: the import gaps (#600)

Per Task 0: the heat sensor on a Clan suit (mixed tech), Sea Fox UMU, Tornado G17 VTOL, BA APDS record, BattleMech NIU
record (book and page each, availability by edition), with construction, record sheet, play and Alpha Strike lines;
each file imports clean and gives the MUL's BV (Headhunter 223, Sea Fox 130, Tornado G17 56, Aegis 179).

### Task 3: archive matching (#600, owner call 3)

`bundled-units-build.ts`: the legacy archive lookup for battle armor with the squad-size guard; TinStar (Original)
matched to TinStar. Test in `bundled-units.test.ts` (Grenadier BA [Flamer] (Sqd4) matches 108460 at 312; Nighthawk
Mk. XXX BH (Sqd1) does not match a Sqd4 record).

### Task 4: BV fixes from the readings (#599)

Test-first in `battle-armor.test.ts`: ammunition BV as TM p.310 (Fenrir Longshot); the heavy grenade launcher record
re-cited to TM p.317 (errata v6.0 p.34) at BV 2; the TO:AUE p.192 items (Angel ECM +2, laser-reflective/reactive at the
fire-resistant BV, booster MP in both factors, DWP at the detached movement); owner calls 1, 4 and 6 as ruled (if
NGCFells takes the draft's clamp fix instead: Centaur (Sqd4) 269).

### Task 5: rebuild the bundle, accuracy, floor (#600)

`npm run build:bundled -- units`; the report; `battle-armor-accuracy.json`; raise `MATCHED_FLOORS["battle-armor"]`;
`bv-verdicts.test.ts`, `bundled-units.test.ts`; look at a bundled suit in the MUL search (View, TRO, Add, Alpha Strike).

### Task 6: battle armor BV2 as cited steps (#599)

`src/data/calc-steps-battle-armor.ts` (`BATTLE_ARMOR_BV2_STEPS`) read on TM pp.310-311, p.316 and pp.317-318 (errata
v6.0 p.34), BV v4.1, TO:AUE pp.192, 195, 197, IO:AE pp.184 and 187, TW p.220; the Purifier and Grenadier at every printed number (note the book's "63 x 5.2"
finding); every emitted step id in the table; `_calcBattleValue` records steps; `getBattleValueBreakdown(edition)`; the
log renders from the steps.

### Task 7: battle armor BV1 as cited steps (#599)

`BATTLE_ARMOR_BV1_STEPS` on the Companion pp.187-190 formula (Defensive: armor x 2 or 3 + 1.5, +1 ECM, x 1.0 + 0.1 per
TMM with the Stealth Modifier Table; Offensive: direct fire + Anti-'Mech + missiles with ammunition by kg + other, x the
p.188 Speed Factor; round per suit, x suits), under master-rules-revised `cited` and master-rules per owner call 7;
mark both entered in `battle-value.ts`. Tests: the Companion Elemental 280 (p.189, every printed number) and the BMR
p.142 / BMR(R) p.155 table rows the bundle can build (Clan Standard, IS Standard, Kage, Longinus, Achileus, Fa Shih,
Purifier, Fenrir, Gnome, Salamander, Sylph, Undine, Kanazuchi, Sloth, Infiltrator, Infiltrator Mk. II, Gray Death),
misses shown.

### Task 8: battle armor cost as cited steps (#599)

Failing tests first: Purifier 3,456,000 and 3,523,500 (TM p.286), training per owner call 2, a Clan suit at 200,000;
the Companion Elemental Point 3,556,650 (p.187) under the master-rules editions, with the BMR(R) p.150 fixed price shown
beside it (owner call 8). `BATTLE_ARMOR_COST_STEPS` on TM pp.276, 281-282, 285-286, 296-298, TO:AUE p.225, IO:AE p.180;
`getCostBreakdown`. Finding for the step note: TM p.286 prose says 451,000, the worked line 426,000 (3,456,000 / 6 -
150,000). The cost of every bundled suit changes: rebuild (Task 5 again or here).

### Task 9: the breakdown view

`BattleArmorCalcBreakdown` in `calc-breakdown.tsx` (shared toggle, edition switch); the battle armor creator summary, the
add-units viewer (record sheet plus breakdown, MUL BV beside ours), the MUL search TRO view.

### Task 10: the queue

Rerun the probes; work B4 to B11 in the ledger one group at a time; `mul-suspect` verdicts with cites where MegaMek
gives ours (a shared note, as vehicles and infantry), `our-bug` with an issue where we are wrong and cannot fix now.

### Task 11: close the round

News bullet (`home.tsx`, NGCFells's voice); the reading ledger's "Battle armor" part; TRO (bundled suits carry their
readout), TRO Unit Types (any new item kind), credits (About page MegaMek notice names battle armor: check), Alpha
Strike (new items converted; our own conversions only at levels 6-7, inferred ones noted); `npm run check`; one Opus
`astech` whole-branch review; fixes test-first; merge and deploy only when NGCFells says; comments on #600 and #599 in
NGCFells's voice with the issue URLs; handoff.
