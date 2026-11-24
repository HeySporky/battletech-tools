# E-War Layer in Roster Play: Design

Date: 2026-11-20. Owner: NGCFells. Repo: `C:/repo/btt-rebuild`, branch bv-gaps (= origin/beta).

## Intent

Classic BattleTech roster play has no electronic warfare today: no ECM, AMS, Artemis, Narc, TAG, C3, probes or
stealth, for any unit. The catalog already holds most of these items, but play ignores them. NGCFells: "Do it all
if we are missing it... Include all E-War items and rules." And on scope: "Every edition. On everything.
Everytime." (memory every-edition-every-rule.md).

Success: every E-War item a unit carries does what its rules say in play, on every unit type that can carry it, under
every rules edition that has it. The to-hit numbers, cluster rolls and notes the play views show already include
those effects.

## Goals

- Every E-War item and rule: missiles and defenses (AMS, Laser AMS, APDS, Artemis IV/V, Apollo, Narc, iNarc and its
  pods, TAG, Light TAG, semi-guided ammo, Streak/ECM interaction), ECM (Guardian, Angel, Clan, Watchdog, Nova CEWS,
  BA and Personal ECM), ECCM mode, probes (Beagle, Bloodhound, Clan, Light), stealth systems (Stealth armor,
  Null-Signature, Void-Signature, Chameleon LPS, Mimetic), C3 (Master, Slave, Boosted, Improved, Emergency Master,
  Nova CEWS network), and the rest (ghost targets, EW Equipment, communications equipment, aero ECM).
- Every unit type roster play has: 'Mech, vehicle, fighter, small craft, capital ship, infantry, battle armor,
  ProtoMech, MicroMech, walker, building, Battledroids unit, Future Wars 'Mech (where it can carry or face the item).
- Every rules edition that prints the item or rule, each with its own book's version of it.
- Ships in phases, each with its own plan and beta deploy.

## Non-goals

- No hex map, no line-of-fire geometry. Coverage and line of fire are declared by the player.
- No rebuilding of an Alpha Strike rule the Alpha Strike roster already applies (today it applies none of its E-War
  specials).
- No change to Battle Value or construction rules, except where the Phase 0 audit finds a missing or wrong item.

## Anti-goals

- A rule applied under an edition that does not print it, or with another edition's numbers.
- Rules copied into each unit class so they drift apart (memory condense-and-extend.md).
- Rules taken from memory or OCR text: every rule is read from the book's page image, the extract written back and
  logged (memory extracts-from-page-images.md).
- Effects the player cannot see: every modifier shows a label with its value, as the woods and heat modifiers do now.

## Constraints

- Condense and extend: reuse existing files. The one new file is the rules module (nothing existing fits: the
  quirk module is quirk-only, future-wars-play.ts is fan rules). Tests go in the area's existing test files where one
  fits.
- Saves: new state is optional in every export and import shape; old saves load with no E-War state.
- Vitest runs in PowerShell only.

## How it works today (what this touches)

- 'Mech to-hit: `getTargetToHitFromWeapon` (src/utils.ts ~896) builds the number through a `systemModifier(modifier,
  label)` chain; attack ticks live on `ITargetToHit` (src/classes/battlemech.ts ~440: woods, darkness, immobile,
  aimed location, Power Armor).
- Cluster rolls: the 'Mech damage dialog (play.tsx ~1628) has 2-12 buttons calling `getClusterHitsPerRoll(roll,
  size)` (utils.ts ~814). The other play views (`_vehiclePlay.tsx`, `_fighterPlay.tsx`, `_battleArmorPlay.tsx`,
  `_infantryPlay.tsx`, `_microMechPlay.tsx`, `_smallCraftPlay.tsx`, `_futureWarsPlay.tsx`, and the rest) each work out
  their own to-hit (vehicles: `getWeaponToHitModifier`) and cluster handling.
- Shared pattern to copy: `src/utils/quirk-effects.ts`: a small carrier shape (`IQuirkCarrier`) any unit class
  satisfies, and `getQuirkToHit(...context)` returning `{ modifier, labels }`, called by the 'Mech and vehicle views.
- Edition rules: `IEditionPlayRules` on each edition in `src/data/rules-editions.ts` (`getEditionPlayRules`).
  Editions: BD, BT2, BTM, BTC, BT3, BTC:RoW, BT4, BMR, BMR(R), CBT box, TW (with TO, TO:AUE, TO:AR, IO:AE as its
  advanced rules), BMM, CRB; Maximum Tech rides on the earlier editions (`usesEarlierRulesEdition`).
- Force state: `BattleMechForce.c3Networks` (uuid -> network name) already exists for C3 Battle Value; `ICBTForceExport`
  saves it.

## Approaches

- **A. One shared E-War rules module on the quirk pattern** used by every play view.
- **B. Methods on each unit class.** Quick for 'Mechs, but the same rules copied into many classes; edition fixes drift.
  Rejected (condense rule).
- **C. A force-level E-War board as the source of coverage.** The player declares coverage once for the force.
- **Picked: A and C together** (NGCFells: "As stated a A and C combo... Both are valid"). The board declares; each
  unit's state can still be set or overridden by hand; the module works out the numbers.

## Design

### 1. The rules module: `src/utils/ewar-play.ts` (new)

- `IEWarCarrier`: the shape any unit class satisfies (as `IQuirkCarrier`): UUID, rules edition, game year, its E-War
  gear (read from its equipment by tag, with damaged/destroyed state), its `IEWarPlayState`.
- Pure functions, each taking the carrier, the attack context and the edition's E-War rules:
  - `getEWarToHit(attacker, attack)` -> `{ modifier, labels }[]` (stealth, Null-Sig, Void, Chameleon, Mimetic,
    Narc/TAG-guided, C3 range, ghost targets, probes cancelling, ECM cancelling each of those).
  - `getEWarClusterShift(attacker, weapon, ammo, attack)` -> shift and labels (Artemis +2, Narc +2, Apollo -1,
    AMS -4, each cancelled or kept per ECM and edition).
  - `getEWarDamageChange(...)` for defenses that remove missiles or damage rather than shift the roll (as each
    edition prints AMS: older editions roll a number of missiles destroyed).
  - `getEWarRange(...)` for C3 (the shortest range band in the network) and TAG/semi-guided.
  - `getEWarNotes(...)` for the rules the roster cannot apply itself (bubble sizes, hex-map effects), shown as text.
- No React, no unit-class imports: the module reads the carrier shape only, so every class uses it.

### 2. Edition rules: `IEWarPlayRules` in `src/data/rules-editions.ts` (extend)

- One optional `ewarPlayRules` per edition: which items exist in play and each one's numbers and behaviour as that
  book prints them (for example AMS as a cluster shift or as missiles destroyed; ECM bubble size; what ECM blocks).
  Each entry cites book and page. Absent for an edition = that edition has no E-War rule, so nothing applies.
- Which items an edition has follows the catalog's `editions` lists, as construction does now.

### 3. Per-unit state: `IEWarPlayState` (on each unit class, optional in its export)

- Own gear modes: ECM on/off, ECM or ECCM mode, Angel/Watchdog mode, stealth on/off, Null-Sig/Void/Chameleon on,
  C3 on.
- Coverage on the unit: inside hostile ECM, inside friendly ECM (or set by the board), Narc and iNarc pods attached
  (by type: homing, Haywire, Nemesis, ECM, explosive), TAGged this turn.
- Field names follow `futureWarsPlay` (BattleMech) and are saved and cleared the same way (Next Turn clears per-turn
  items such as TAG).

### 4. Per-attack ticks: on `ITargetToHit` and each view's attack context (extend)

- "Hostile ECM on this line of fire", "Friendly ECCM covers it", target in a C3 network spotter range (the range
  from the nearest networked unit), target's stealth state when it is not on the player's roster. Same style as the
  woods and darkness ticks.

### 5. Force E-War board (extend `BattleMechForce` and the roster play page)

- A panel on the roster play page that declares, for the whole force: which units sit inside each hostile and
  friendly ECM bubble, Narc/iNarc pods and TAG on enemy targets (by target letter), and C3 networks (reusing
  `c3Networks`, so Battle Value and play read one list).
- The board writes the per-unit state; a hand change on a unit overrides the board until the board is changed.
- Saved in `ICBTForceExport` (optional field `ewarBoard`).

### 6. Each play view (extend each existing `_*Play.tsx` and `play.tsx`)

- An E-War block (the unit's gear and modes, its coverage), the attack ticks, and the module's numbers fed into its
  own to-hit line and its cluster roll, with labels.

### Phases (each: own plan, TDD, astech review, `npm run check`, `git deploy-beta`, news bullet)

0. Catalog audit: every E-War item against each edition's rulebook and TW/TO/TO:AUE/TM/IO:AE (page images); add
   what is missing (Void-Signature and some BA E-War gear look missing), fix what is wrong. Also builds the module
   skeleton, `IEWarCarrier` on every unit class, `IEWarPlayState`, the edition table shape, and the empty board.
1. Missiles: AMS, Laser AMS, APDS, Artemis IV/V, Apollo, Narc, iNarc pods, TAG, Light TAG, semi-guided ammo, Streak
   and ECM cancelling them; cluster shifts in every view.
2. Stealth and sensors: Stealth armor, Null-Sig, Void-Sig, Chameleon, Mimetic, probes, ECCM, Angel, Watchdog, Nova.
3. C3 networks and the rest: all C3 types, ghost targets, EW Equipment, communications equipment, aero ECM.
4. Hooks waiting on this layer: Personal ECM own-hex effect; Blue Saviour's "treat missiles as AMS" and "inside
   hostile ECM" (`src/utils/future-wars-play.ts`). DONE (plan `2026-11-21-ewar-phase-4.md`, Calls 1-4 there, all confirmed by NGCFells 2026-11-21: the field is an extra AMS engagement on top of a real AMS; Appendix A rows `ecm-personal`, `blue-saviour`).
5. Alpha Strike E-War specials (section below).

A GitHub issue for the layer is opened when this design is approved; each phase posts its evidence there.

## Calls made in design (from the builder check; NGCFells to check)

1. **Whose gear, and when it counts.** Roster play rolls only the player's own attacks; incoming fire is entered in
   each view's existing take-damage dialog. So:
   - Attack effects (Artemis, Narc/TAG-guided fire, C3, probes, ECM on the line of fire) apply to the unit's own
     attacks, through its to-hit and cluster roll.
   - Own defenses (AMS, Laser AMS, APDS) apply in the take-damage dialog: the player marks "missile attack" and the
     launcher size, and the dialog applies the defense (cluster shift or missiles destroyed, per edition) and spends
     its ammo or heat.
   - Own stealth/Null-Sig/Void/Chameleon/Mimetic cannot change the enemy's roll in the app, so the unit's E-War block
     shows "+N to attacks against this unit" (and its heat or other cost is applied on this unit).
   - Enemy targets have no unit object: their state (stealth on, AMS, pods attached, TAGged, ECM) is held as ticks on
     the target (`ITargetToHit` and each view's target), and the board holds pods/TAG/bubbles by target letter.
2. **Which edition governs.** Each unit plays under its own rules edition (forces can mix them). The attacker's edition
   governs its attack, enemy gear included; the defender's edition governs its own defenses in the take-damage
   dialog. An item the governing edition does not have has no effect there, with a label saying so.
3. **Early editions, and items a later edition drops.** An item a later edition no longer prints stays available there as apocryphal and plays by the last printing (NGCFells, 2026-11-21; `apocryphal: true` copies of the Total Warfare entries under the BattleMech Manual and Core Rulebook). The catalog's `editions` lists decide which items exist under an edition; `ewarPlayRules` says
   how they play. Phase 0 reads every edition's rulebook (page images) and fills both; where they disagree, that is an
   audit finding fixed in the catalog. An edition with no E-War rules gets no `ewarPlayRules` and nothing applies.
   Maximum Tech items follow the app's existing Maximum Tech handling (`usesEarlierRulesEdition`) with Maximum Tech's
   own numbers.
4. **Board v hand changes.** Tracked per field, per unit. The board owns the coverage fields it sets (in/out of each
   bubble, pods, TAG); a hand change marks that one field overridden on that unit, and changing the board entry that
   sets the field clears the override for the units that entry names. Both are saved; the board's entries plus the
   overrides are the truth.
5. **Turn effects.** Per-turn items (TAG, this turn's ECM/ECCM mode where the book sets it in the End Phase, ghost
   targets) clear on Next Turn, on units and on the board; lasting ones (Narc/iNarc pods) stay until removed, per each
   edition's rule. Each item's timing is read from its book in its phase.
6. **Which unit types.** Phase 0 produces the item-by-unit-type matrix from TM/TO and each edition's books. Every play
   view gets the attack ticks for its own attacks; its E-War block shows only when the unit carries E-War gear.
7. **C3 networks.** Phase 3 extends `c3Networks` into network records (type, master/slave roles, members); the old
   uuid -> name map still loads, and Battle Value reads the same records.
8. **Battle Value.** A Phase 0 catalog fix may move BV or cost when the book says so; each change is listed in that
   phase's notes and news bullet, and the bundle is rebuilt, as with past rule fixes.

## Left to the builder

- Exact field names, the board's layout, and which existing test file each test joins.
- Per item and edition: the rule text, read from the page images during that phase's plan.
- How each non-'Mech view shows the ticks, as long as it matches its existing style.

## Alpha Strike (NGCFells: "Yes where gaps exist")

Alpha Strike roster play (`src/ui/pages/alpha-strike/roster/in-play.tsx`, `src/classes/alpha-strike-unit.ts`) lists
the specials as text and applies none of their effects. Phase 5 adds them where they are missing, in every Alpha
Strike edition the app has: ECM, LECM, WAT, AECM, AMS, RAMS, PRB, BH, LPRB, TAG, LTAG, SNARC, CNARC, INARC, C3M, C3S,
C3BSM, C3BSS, C3EM, C3I, C3RS, NOVA, STL, MAS, LMAS, and any others the Phase 0 audit finds. A special the 2013 book prints and the Commander's Edition drops stays available there as apocryphal and plays by the 2013 rule (same carry-forward as Call 3). It gets its own module
beside the Classic one (Alpha Strike's rules are not Classic's), with the same state, board and edition-table pattern.

## Appendix A: E-War item matrix

Rows are read from the page images of each edition rulebook (Phase 0 audit, #642). An edition not named in a row prints
no rule ("none"): Battledroids, BT2, BTM, BT3 (p.44) and BT4 (p.45) hold the 3025 weapons only (the BTM price list,
p.86, has no such item). The Classic BattleTech box set rulebook is not in the library: "unsure: rulebook not in the
library", no table entry filled. Pages are printed pages. "MT" is Maximum Tech (both printings). TW pages are the
corrected printings the catalog cites.

### Missiles and defenses

| kind | catalog tags | per edition | unit types | edition differences |
| --- | --- | --- | --- | --- |
| `ams` | `is-ams`, `clan-ams`; ammo `ammo-is-ams-standard`, `ammo-clan-ams-standard` | BTC p.117; BTC:RoW p.112; BMR p.122; BMR(R) p.130; TW p.129 (TO:AR p.98 optional rules); BMM p.118; CRB p.206 | 'Mech, vehicle (BTC); BA through launcher rules (TW p.229) | BTC, BTC:RoW (RoW p.112, rules text p.9901 of the extract): the AMS shoots down 1D6 (IS) or 2D6 (Clan) missiles BEFORE the to-hit roll, the survivors pick the Missile Hits Table column (heads 2, 4, 5, 6, 10, 15, 20; nearest head, a tie to the smaller; one survivor hits for 1; never more hits than survivors), 1 heat, and the ammunition spent is its own 1D6 x 2 roll; BMR, BMR(R): the result is the number shot down AND the ammunition used (one shot a missile), 1 heat, taken off after the table; TW, BMM: -4 to the Cluster Hits roll (held at 2), 1 heat and 1 ammunition per engagement, one missile attack a turn; CRB p.206: up to two missile attacks a turn and a roll below 2 destroys the whole flight (Laser AMS TO:AUE p.134 and BMM p.118, APDS IO:AE p.85 the same) |
| `laser-ams` | `is-laser-ams`, `clan-laser-ams` | MT p.72 (rides on BMR, BMR(R)); TO:AUE p.134 (TW); BMM p.118; CRB p.206 | as AMS | MT: variable heat (2D6; 12 assumed on a vehicle), 1.5 tons, 2 slots, 225,000 C-bills, both printings alike (tables pp.85-86, prices p.87); TW/BMM: no ammo; BMM 5 heat; CRB 7 heat IS, 5 Clan. Catalog: BMR and BMR(R) at Level 3 from MT (fix round 1, #642), TW, BMM, CRB |
| `apds` | `is-risc-apds`, `ammo-is-risc-apds-standard` | IO:AE p.85 (TW); CRB p.206; not printed in BMM | BM, IM, CV, SV, BA, MS (IO:AE p.85); not aerospace | BMM does not print it (no hit in its extract; its equipment tables and index have none): the catalog lists TW and CRB only (fix round 1, #642) |
| `artemis-iv` | `<launcher>-artemis-iv`, `ammo-*-artemis-iv` | BTC p.118; BTC:RoW p.113; BMR p.123; BMR(R) p.131; TW p.130 (missiles p.140); BMM p.110; CRB p.197 | 'Mech, vehicle | +2 on the Missile Hits / Cluster Hits roll in every edition; no effect on indirect LRM fire (BTC:RoW p.114, BMR p.123, CRB p.197); not with Streak, Narc, Swarm or Thunder; CRB/BMM: hostile ECM blocks it |
| `artemis-v` | `clan-*-artemis-v`, `ammo-clan-*-artemis-v` | MT p.75 (BMR, BMR(R)); TO:AUE p.95 (TW); BMM p.110; CRB p.197 | Clan 'Mech, vehicle, aerospace (TO:AUE p.95) | -1 to-hit and +3 Cluster Hits (maximum 12); MT: 1.5 tons, 2 slots, 250,000 C-bills, ammunition 5 x normal (table p.86, prices p.87), Clan SRM and LRM launchers only (no torpedoes). Catalog: the SRM and LRM launcher and ammo records are in BMR and BMR(R) at Level 3 from MT, plus TW, BMM, CRB; the torpedo records stay TW, BMM, CRB (fix round 1, #642) |
| `artemis-prototype` | `*-artemis-p` | IO:AE p.65 (TW) | IS 'Mech, vehicle | +1 Cluster Hits instead of +2; BMM does not print it (catalog: TW, CRB) |
| `apollo` | `mrm-*-apollo` | TO:AUE p.142 (TW); BMM p.113; CRB p.197 | IS 'Mech, vehicle, aerospace (attack value 6, TO:AUE p.142) | TW (TO:AUE p.142), BMM p.113: removes the MRM +1 to-hit penalty and the attacker subtracts 1 from the Cluster Hits roll (shift -1); CRB p.197: two modes, standard-fire (loses the standard -1 Cluster Hits MRM modifier, net 0 in this tool, which does not apply the base CRB MRM -1) and saturation (area effect, not built) |
| `narc` | `narc`, `clan-narc`, `*-narc-os`, `*-narc-ios`, `prototype-narc`, `*-compact-narc`; ammo `ammo-is-narc-standard`, `ammo-clan-narc-standard`, `ammo-is-narc-explosive`, `ammo-is-narc-bola`, `ammo-is-narc-shoot-and-sit`; Narc-capable `ammo-lrm-narc`, `ammo-is-srm-narc`, `ammo-clan-srm-narc`, `ammo-is-enhanced-lrm-narc-capable` | BTC p.120; BTC:RoW p.119; BMR p.133; BMR(R) p.145; TW p.138 (pods pp.141-142, BA p.229); BMM p.104; CRB p.188 | 'Mech, vehicle; BA, one launcher a trooper (TW p.229); infantry disposable launcher (MT p.40) | +2 on the Cluster Hits roll in every edition; BMR on: hostile ECM removes the +2; TW, BMM, CRB: indirect fire without a spotter; CRB: also -1 to-hit; Narc-capable missiles cost twice (BTC p.120); BMM does not print the prototype Narc, Bola pods (MT p.83: BMR, BMR(R) Level 3; TO:AUE p.180: TW, CRB) or shoot-and-sit pods (catalog: TW, CRB only for the prototype and shoot-and-sit) |
| `inarc` | `inarc`, `inarc-os`, `custom-er-inarc`; ammo `ammo-is-inarc-{standard,ecm,explosive,haywire,nemesis}` | none before BMR(R); BMR(R) pp.145-147; TW pp.139-142; BMM pp.104, 107-108; CRB pp.188, 193-194 | IS 'Mech, vehicle | homing pod: -1 to-hit and +2; ECM, haywire and Nemesis pods IS only; iNarc pods can be brushed off (BMR(R) p.146, TW p.139) |
| `tag` | `is-tag`, `clan-tag`, `prototype-tag`; Arrow IV homing ammo `ammo-*-arrow-iv-homing` | BTC p.117; BTC:RoW p.120 (also p.113); BMR p.134; BMR(R) p.147; TW p.142 (aerospace p.246); BMM p.113; CRB p.200 | 'Mech, vehicle, aerospace pod (TW p.246), ProtoMech, BA | BTC, BTC:RoW: spots for the Arrow IV homing missile only; BMR on: also designates for semi-guided LRMs (BMR p.131); TW on: TAG is rolled after the Movement Phase, before the Weapon Attack Phase; BMM does not print the prototype TAG (catalog: TW, CRB) |
| `light-tag` | `clan-light-tag` | BMR p.134; BMR(R) p.147; TW p.229 (battle armor); BMM p.114; CRB p.200 | Clan 'Mech, vehicle, BA | range 3/6/9 (TW p.229); none in BTC, BTC:RoW |

Other items of the family without an `EWarKind`: Streak SRM: BTC p.129, BTC:RoW p.120, BMR pp.129-130, BMR(R) pp.140-141, TW p.138, BMM p.104, CRB p.187; Streak LRM: MT p.81 (Clan, table p.86; catalog: BMR, BMR(R) at Level 3), TO:AUE p.139, BMM p.104, CRB p.187; the IO:AE prototype Streak SRMs and improved Clan launchers, the RISC APDS and Retro-Streak ammo are not in BMM; the improved Clan launchers and their ammunition (`clan-improved-*`), the 48 improved one-shot launchers (`*-ios`, TO:AUE p.139; BMM p.103 prints them, the CRB only the plain OS, p.182) and Maximum Tech's smoke and heat-seeking ammunition are not in the CRB (the last two also not in BMM) (catalog after fix rounds 2 and 3, #642: the Core Rulebook prints the items available as of 3150, CRB p.180, tables pp.248-253, and none of the prototype Narc, TAG and Artemis, improved Clan launchers, prototype Streak SRMs, Bola or shoot-and-sit pods or Retro-Streak ammo; it does print the APDS p.206 and the Extended LRM with Artemis IV p.185, so those stay); the Extended LRM has no Artemis IV in BMM (p.103, Advanced Fire Control: No); semi-guided LRMs (IS only, TAG-designated): BMR p.131, BMR(R) p.142, TW p.142, BMM p.107, CRB p.193; Bola Narc pods: MT p.83, TO:AUE p.180; smoke and heat-seeking LRM and SRM ammo (`ammo-lrm-smoke`, `ammo-srm-smoke`, `ammo-lrm-heat-seeking`, `ammo-srm-heatseeking`): MT p.82 (both printings; catalog: BMR and BMR(R) at Level 3, 1.5 x and 2 x normal price, p.87), plus TW (neither the BMM nor the CRB prints them); shoot-and-sit missiles: IO:AE p.126. ARAD and follow-the-leader missiles (TO:AUE p.180), dead-fire and retro-Streak missiles (IO:AE p.126) have no E-War state.

Ammo tags by weapon family (Phase 1): LRM `ammo-lrm-standard`, `ammo-is-lrm-artemis-iv`, `ammo-clan-lrm-artemis-iv`, `ammo-clan-lrm-artemis-v`, `ammo-lrm-narc`, `ammo-is-lrm-semi-guided`; SRM `ammo-srm-standard`, `ammo-is-srm-artemis-iv`, `ammo-clan-srm-artemis-iv`, `ammo-clan-srm-artemis-v`, `ammo-is-srm-narc`, `ammo-clan-srm-narc`; enhanced LRM `ammo-is-enhanced-lrm-{standard,artemis-iv,semi-guided,narc-capable}`; Streak `ammo-is-streak-srm-standard`, `ammo-is-streak-srm-retro-streak`, `ammo-clan-streak-srm-standard`, `ammo-clan-streak-lrm-standard`; Narc `ammo-is-narc-{standard,explosive,bola,shoot-and-sit}`, `ammo-clan-narc-standard`; iNarc `ammo-is-inarc-{standard,ecm,explosive,haywire,nemesis}`; AMS and APDS `ammo-is-ams-standard`, `ammo-clan-ams-standard`, `ammo-is-risc-apds-standard`.

### ECM, ECCM and probes

Pages are printed pages; MT = Maximum Tech (both printings, same pages); Revised MT cross-references use BMR(R) pages. "Unit types" lists who can carry the item under the cited rule.

| kind | catalog tags | per edition | unit types | edition differences |
| --- | --- | --- | --- | --- |
| `ecm-guardian` | `ecm-suite`; BA `is-ecm-suite`, `ba-is-ecm-suite`; micro `micro-guardian-ecm-suite` | BTC p.120; BTC:RoW p.116 (continues p.117); BMR p.126 (continues p.127); BMR(R) p.136 (continues p.137); TW p.134 (continues p.135; BA p.228); BMM p.112; CRB p.200; BT3, BT4, BTM, BD, BT2: none | 'Mech, vehicle; BA (own hex only, TW p.228; TM p.254, 0.1 t IS); aerospace: no effect between aerospace units (TW p.238; AT2R p.25) | BTC/RoW: nullifies enemy Beagle probes, Artemis IV, Narc beacons and C3 within 6 hexes or on a line passing within 6 (no effect on TAG or Clan targeting computers); BMR on: a "bubble" of radius 6 around the carrier and any enemy LOS traced through it, friendly units unaffected, one ECM suite per unit; TW/BMM/CRB: C3i joins the list; TW/CRB: Narc loses its bonus only when the pod is in the bubble; water: a suite above water cannot affect units underwater (TW p.135, BMM p.112); the BMM 6th printings (2021, Oct 2022, BattleMech-Manual.txt) add to the C3 line of the ECM rule (p.112) "as long as a 'Mech is not cut off, enemy ECM does not affect its ability to share C3 targeting data" (the 4th, 5th and 7th printings do not); CRB: "Activated" (p.180), hostile ECM blocks Artemis only when the attacker or target is in the radius, and LOS merely drawn through the radius has no effect (p.200), unlike every earlier book; BMM: only one suite works at a time |
| `ecm-clan` | `clan-ecm-system`; BA `clan-ecm-suite`, `ba-clan-ecm-suite` | BTC p.120 (table p.115: 6 hexes, 1 t, 1 slot, no text of its own); BTC:RoW p.116; BMR p.126; BMR(R) p.136; TW p.134; BMM p.112; CRB p.200 | as Guardian | same rules as the Guardian in every edition ("lighter and smaller", BMR p.126); BMM/CRB print it with the Guardian ("Clan (ECM suite) or Inner Sphere (Guardian)") |
| `ecm-guardian-prototype` | `guardian-ecm-prototype` | IO:AE p.66 (TW); not BMM, not CRB (CRB p.180: items available as of 3150; tables pp.248-253 list none) | as Guardian, 3 slots, 2 t | functions as the production Guardian (IO:AE p.66); BMM and CRB removed from the record's editions (fix, #642) |
| `ecm-angel` | `angel-ecm`, `clan-angel-ecm`; BA `is-angel-ecm`, `clan-angel-ecm`, `ba-is-angel-ecm`, `ba-clan-angel-ecm`; micro `micro-angel-ecm` | MT p.77 (continues p.78; BMR, BMR(R) Level 3); TO:AUE p.91 (TW); BMM p.113; CRB p.200; BTC to BT4: none | 'Mech, vehicle, BA, aerospace (TO:AUE p.91) | MT: blocks Artemis IV/V, Beagle, Bloodhound and Clan probes, C3, Streak (fires as a standard launcher) and Narc, counts as two ECM or ECCM suites (IS 2 t, Clan 1.5 t, both 2 slots, 750,000); TO:AUE/BMM/CRB: blocks the Bloodhound, C3 Boosted and Streak locks (a Streak fired into or through the bubble does not lock: Cluster Hits Table as a standard launcher); MT items added to the record's editions (BMR, BMR(R) Level 3, #642); MT's Clan Angel is 1.5 t, 2 slots (tables p.86), stored as `editionStats[edition].clan` on the one universal record (fix round 1); a pure Clan 'Mech gets it through `getEquipmentForEdition`, a Mixed Tech 'Mech picks the derived Clan entry `clan-angel-ecm` (fix round 3) |
| ECCM mode (no kind; a mode of `ecm-guardian`, `ecm-angel`) | | MT p.77 (diagram p.78); TO:AR p.98 (continues p.99; TW); not in BMM or CRB | any ECM carrier; infantry ECM; iNarc ECM pod (TO:AR p.99); communications equipment, 3-6 t is half an ECM suite, 7+ t one (TO:AR p.99, TM p.212) | switched in the End Phase or set at scenario start and noted on the record sheet; the ECM loses its normal function; one ECCM suite counters one ECM suite, equal or more friendly ECCM in a hex means the ECM does not work there; LOS through a hex covered by both is unaffected; Angel counts as two (MT) but Angel ECM is countered only by Angel ECCM and one Angel ECCM counters any amount of ordinary ECM, or an Angel may run as two ordinary suites (TO:AR p.99); a unit with Stealth armor cannot make ECM or ECCM fields while the armor is on (TO:AR p.99); an iNarc ECM pod can make an ECCM field (TO:AR p.99); ECM suites help a probe overcome ghost targets (TO:AR p.98, Concealing Information) |
| ghost targets (no kind; a mode of `ecm-guardian`) | | TO:AR p.100 (TW only) | any ECM carrier, also a cockpit command console (any unit) or 7+ t of communications equipment (up to six hexes away; TO:AR p.100) | the suite loses its normal function; each Weapon Attack Phase the unit targets one friendly or enemy unit in range of the suite (itself allowed) and makes a Piloting/Driving roll at +3: on success +1 to hit the friendly target, or +1 to the enemy target's own ranged attacks, to the end of the phase; several suites stack to +3 each way; an active probe of any kind ignores ghost-target modifiers; an Angel counts as 1 ECM or 1 ECCM at the same time; no effect on conventional infantry; an ECM suite cannot make ghost targets while friendly ECCM in the hex is less than the enemy ECM; a unit with Stealth armor and an Angel can, at +1 to hit with all its ranged attacks; the TO:AR p.98 Concealing Information cross-reference to Ghost Targets says p.98, the rule is on p.100 |
| `ecm-watchdog` | `clan-watchdog-cews` | TO:AUE p.90 (TW); BMM p.114; CRB p.201 (no rule before TW; MT does not print it) | 'Mech, vehicle, aerospace, ProtoMech (TO:AUE p.90) | works as the Clan ECM suite and Light Active Probe together; can be the ECM Stealth armor needs; one ECM at a time; BMM/CRB: same radius, range and function |
| `ecm-nova` | `clan-nova-cews` | IO:AE p.60 (TW only); not in BMM or CRB (fix, #642: BMM and CRB removed from the record; CRB p.180 and tables pp.248-253) | 'Mech, vehicle, aerospace (IO:AE p.60) | ECM, active probe and C3i in one: links up to two other Nova units, declared in the End Phase, linked from the next turn; ECM does not affect the link unless it comes from another hostile active Nova CEWS; no TAG; usable with Null-Signature and Chameleon; can be turned off in any End Phase; +2 heat while active; fusion engine required (IO:AE p.60) |
| `ecm-personal` | `custom-personal-ecm` (fan item) | custom (`misc-custom.ts`), no book | | custom homebrew, no book rule. Phase 4: a Guardian for its own hex only; the board names the friendly units in its hex (`IEWarBoard.personalEcm`) and they count as inside friendly ECM (`inFriendlyEcm`, `personalEcmOf`) while its suite is in ECM mode; an enemy Personal ECM is counted as one hostile suite by the player when the attacker, the target or a hex on the line is its hex |
| `blue-saviour` (Blue Saviour Dispersion Field, `custom-blue-saviour`, Pleiades Mechworks) | `isBlueSaviourOn?()` on the carrier, not a gear kind | custom (`future-wars-play.ts`) | TW p.129 (AMS), TW p.134 (ECM) | Phase 4. Missiles: one more AMS by the unit's edition (`rules.items.ams.defense`), once a turn (`maxPerTurn`), no ammunition, no heat of its own, after any real AMS or APDS with an engagement left; the Arrow IV / Thunder / Swarm / Flare exclusions apply. ECM: the unit counts as inside hostile ECM (its own attacks lose Artemis, Narc, Apollo; its C3 is cut off; an Emergency Master it is does not count turns) and friendly ECCM never cancels it. Stealth off and cannot-be-hidden stay reminder lines |
| `ecm-infantry` | `inf-armor-sneak-suit-ecm`, `-camo-ecm`, `-ir-ecm`, `-camo-ir-ecm` | MT p.38 (BMR, BMR(R) Level 3: camo and ECM suits); TO:AUE p.130 (Sneak Suits and Infantry Stealth Modifiers Table, TW); BMM, CRB: none | conventional infantry; MT: standard non-battle-armored infantry only | MT: an ECM suit hides a hidden unit from every detection, "not even a Bloodhound" (p.38); p.72 says a Bloodhound even spots hidden unarmored infantry unless they carry ECM, so the two pages agree for ECM infantry; cost x2 for each suit, x4 for both; TO:AUE: ECM sneak suit is invisible to standard and Light active probes only (the Bloodhound sees it); records `inf-armor-sneak-suit-camo`, `-ecm` and `-camo-ecm` gained BMR and BMR(R) Level 3 from MT (fix, #642); IR suits are not in MT |
| `probe-beagle` | `beagle-active-probe`, `is-active-probe` (BA), `ba-is-active-probe`, `micro-beagle-active-probe` | BTC p.118; BTC:RoW p.114; BMR p.122; BMR(R) p.130; TW p.129; BMM p.110; CRB p.197; BA TM p.252 | 'Mech, vehicle, BA (TM p.252: 10 kg, 4 hexes IS) | detects hidden units at the end of the Movement Phase inside its radius with LOS (Inner Sphere 4); BTC/RoW: 'Mechs and vehicles, not infantry; BMR on: also battle armor, not conventional infantry; TW: not BA with stealth armor; water: an above-water probe cannot detect a unit hidden underwater (TW p.129, BMM, CRB); only with the Hidden Units rules (BTC:RoW p.89, BMR p.77, TW p.256, BMM p.82); BMM/CRB: Light 3, Beagle 4, Active Probe 5, blocked by hostile ECM; MT: the optional rules and the double-blind sensor tables (MT pp.52-55: Sensor Range Table p.54, ECM Modifier Table p.55) |
| `probe-clan` | `clan-active-probe`, `ba-clan-active-probe` | BTC p.118 (table p.115); BTC:RoW p.114; BMR p.122; BMR(R) p.130; TW p.129; BMM p.110; CRB p.197 | 'Mech, vehicle, BA (5 hexes) | Clan radius 5 in every edition |
| `probe-light` | `clan-light-active-probe` | BMR p.122; BMR(R) p.130; TW p.129; BMM p.110; CRB p.197; BTC, RoW: none | 'Mech, vehicle | Clan only; range 3, 0.5 t, 1 slot (BMR Clan table p.117, BMR(R) table p.123, BMM p.110, CRB p.197); catalog editions already right |
| `probe-bloodhound` | `bloodhound-active-probe` | MT p.72 (BMR, BMR(R) Level 3; tables pp.85, 87, 90: 2 t, 3 slots, 8 hexes, 500,000, BV 25); TO:AUE p.90 (TW); BMM p.110; CRB p.197 | 'Mech, vehicle, aerospace (TO:AUE p.90, not BA) | 8 hexes; finds stealth and sneak units (BA stealth, Mimetic, Null-Signature) (MT, TO:AUE); BMM/CRB: immune to standard ECM, only Angel ECM stops it; MT items added to the record's editions (BMR, BMR(R) Level 3, #642) |
| `probe-beagle-prototype` | `beagle-active-probe-prototype` | IO:AE p.65 (TW); BMM and CRB do not print it (fix, #642) | as Beagle | the same rules as the Beagle (TW p.129) |

BA E-War gear in the catalog: Active Probe (IS and Clan), ECM Suite (IS and Clan), Angel ECM (IS and Clan), Heat Sensor, Improved Sensors, Remote Sensor Dispenser (the last three are not E-War kinds); no gear missing for this family (TM p.252-254 prints Active Probe and ECM Suite; TO:AUE p.91 and IO:AE p.46 print the BA Angel; there is no BA Light probe, Bloodhound or Watchdog, TO:AUE pp.90-91). TM p.252 prints the BA probe under the heading "Active Probe, Light" (a misprint: the BA equipment tables p.347 give the Inner Sphere BA Active Probe range 4, 250 kg, 2 slots, and the ECM suite 0 = own hex, 100 kg). Fix: `is-active-probe` (the Inner Sphere BA probe, which `getEWarKind` did not map) and the vehicle-scale `ba-is-active-probe`, `ba-clan-active-probe` now map to `probe-beagle` and `probe-clan`. BMR also prints a sensor pack that "functions like a Beagle active probe" on Scout battle armor and says Beagle and Clan probes cannot find hidden Kage units (BMR p.64 (image): Scout armor carries a sensor pack that functions like a Beagle probe; Kage suits are specially built so that Beagle and Clan probes cannot find hidden Kage units).

### Stealth (#642 Task 10; PARTIAL: part 1, 2026-11-21)

Pages are printed pages, read from page images (the page list is in `_corrected_pages.md`, "Task 10 part 1"). BTC, BTC:RoW, BT3, BT4, BTM, BT2, BD, CityTech, AeroTech, BattleTroops and ClanTroops print no stealth rule (text search; "Stealth Trinary" in ClanTroops is a name). The CBT box rulebook is not in the library.

| kind | catalog tags | per edition | unit types | edition differences |
| --- | --- | --- | --- | --- |
| stealth-armor | stealth-basic | BTC none; BTC:RoW none; BMR none; BMR(R) p.147 (+3 medium replacing the standard, +6 long; Guardian ECM suite required, it keeps working while engaged but the 'Mech suffers the effects of being inside an enemy ECM suite's radius (as in the TW first and 3rd printings; from the TW 4th printing on, and in BMM and CRB, the ECM is switched off and the enemy-ECM effects stay); no secondary target; Beagle and Clan probes cannot locate; 10 heat; 12 slots, construction p.119; BV +10 heat and +0.2 speed factor p.154); TW p.142 (TM pp.55-56, 206); BMM p.115; CRB p.202 | 'Mechs (Inner Sphere only; BMR(R): "Vehicles cannot mount stealth armor") | BMR(R) +3/+6 to-hit; TW, BMM, CRB +1 medium and +2 long (CRB: "stealth TN modifier"); TW: no effect on attacks by aerospace units, critical hits on stealth slots re-rolled; CRB: not detected by a standard probe, no C3 |
| stealth-vehicular | vehicular-stealth (`aerospaceFighter: true` already) | none before TO:AUE; TW (TO:AUE p.94, Experimental; TW p.142 for the rules) | CV, SV, AF, CF | Aerospace fighters get no benefit above the space/atmosphere interface if they expend Thrust; no aerospace stealth armor type is needed (Task 4's note answered) |
| stealth-ba | ba-stealth-basic, -standard, -prototype, -improved, `stealth-improved` (BA-only armor record, TM p.252) | BMR p.66 (Achileus +1/+4/+7, Infiltrator +3 medium +6 long; Kage p.64), BMR(R) p.69 (Infiltrator Mk. II +1/+3/+6 with limited ECM, Achileus p.67, Kage pp.69-70), TW p.228 (TM pp.252-253): prototype +1 medium +2 long, basic +1 medium +2 long, standard +1/+1/+2, improved +1/+2/+3 | Battle armor | BMR and BMR(R) print only unit-built-in stealth (no armor type), Beagle and Clan probes cannot locate those units; TW prints armor types. `stealth-improved` is mapped to `stealth-ba` (no book prints an Improved stealth armor for 'Mechs or vehicles); the `stealth-armor-improved` kind was dropped |
| mimetic | mimetic, ba-mimetic | BMR none; BMR(R) p.71 (Purifier, always on: +0 moved 3, +1 moved 2, +2 moved 1, +3 not moved); TW p.228 (+3 0 hexes, +2 1, +1 2, none 3+) | Battle armor | Same table in both; BMR 1998 has no Purifier or Mk. II |
| null-sig | null-signature-system, custom-null-signature-system | BMR and BMR(R) MT p.83 (Level 3, +3 medium +6 long, Bloodhound only, no advanced targeting computer, C3 or satellite uplink, 7 slots, 10 heat, 2,000,000 C-bills p.87); TW TO:AUE p.148 (+1 medium, +2 long and extreme; heat-seeking attacks treat the unit as 18 cooler; cumulative with Chameleon; no OmniPod); CRB p.209 (stealth TN +1/+2); BMM none (quirk lists only) | 'Mechs (Inner Sphere) | MT +3/+6 to-hit and no ECM needed stated; TO:AUE +1/+2 and no ECM suite needed; CRB stealth systems in general cut C3 |
| void-sig | void-signature-system | TW TO:AUE p.161 (needs an ECM suite which stops working; +3 for 0 hexes moved, +2 for 1-2, +1 for 3-5, none for 6+; only the Bloodhound; 10 heat; +1 to the controlling unit's ranged attacks; not with the Chameleon LPS); CRB p.209 (same numbers); none in MT, BMM | 'Mechs | none |
| chameleon | chameleon-lps | TW TO:AUE p.112 (+1 medium, +2 long and extreme, even against infantry; 6 heat; 6 slots; cumulative with Null-Signature; not with Stealth Armor or Void-Signature); CRB p.209 (same modifiers); none in MT, BMM | 'Mechs | TO:AUE p.112: the LPS cuts a C3 unit from its network like other stealth systems; CRB p.209: an active LPS does NOT prevent C3 or hostile ECM fields |

Stealth systems and ECM (read from images, part 2): TO:AR p.100: active stealth armor with an Angel ECM suite may generate ghost targets, at +1 to all its own ranged attacks; a unit with an active probe ignores ghost target modifiers unless it has active stealth armor. TO:AR p.191 ECM/Stealth Modifier Table (double-blind): sensor roll modifiers by the spotter's probe (Beagle, Bloodhound, Clan, Light, Watchdog, EW System, 'Mech sensor, vehicle sensor, communications equipment; seismic/IR/magscan NA) against the target's system (Void-Signature, Angel or Null-Signature, Standard Clan/Watchdog/Guardian, Stealth Armor (any armor with "stealth" in its title), infantry sneak ECM, sneak camo or IR, active visual camouflage); Phase 1's double-blind view needs that table as data. CRB p.199: an active stealth system (not the Chameleon LPS) cuts the unit off from its C3 network, not just degrades it; CRB p.231: only a Bloodhound reveals a hidden unit with an active stealth system other than the Chameleon LPS; CRB p.233: +2 TN to a scan of a unit with an active stealth system. IO:AE p.108: LAMs cannot mount stealth armor or the Chameleon LPS. Battle armor stealth costs (TM p.281, per armor point): prototype 50,000, basic 12,000, standard 15,000, improved 20,000, mimetic 15,000; BV defensive factor modifiers (TM p.316): camo, basic, prototype and standard stealth +0.2, improved stealth and mimetic +0.3; all match the catalog. TM pp.55-56: stealth armor takes 12 slots (2 in each arm, leg and side torso) and critical hits to them are re-rolled; TM p.169 weights: basic 30 Clan / 55 IS kg a point, improved 35/60, prototype 100 IS, standard 35/60, mimetic 50 IS; also match the catalog.

Read from images, part 3a: TM p.278 prices stealth armor at 50,000 C-bills x armor tonnage (rating E, X-X-E); IO:AE p.156 (superheavy 'Mechs): BattleMech stealth armor, Chameleon LPS, Null-Signature and Void-Signature have no effect, ECM Suites still work; IO:AE p.159 (tripods): stealth armor and the Chameleon LPS take extra slots in the third leg; TO:AR p.192: stealth needs only to be active, ECM jamming is reported to the spotter but a stealth system is not, ECCM cancels ECM; TO:AR p.190 sensor range table written back.

Printing difference found in part 4 (TW p.142, text compared across every printing): the FanPro first printing and the 2011 corrected 3rd printing say that while stealth armor is engaged "the ECM continues to function normally, but the 'Mech suffers effects as if in the radius of an enemy ECM suite" (p.134); the 2013 corrected 4th printing and every later one say "the ECM does not function". The TW edition table entry should follow the later wording (the catalog cites the 9th printing) and note the earlier one. The BA stealth, cost and BV tables (TM pp.169, 281, 316) read the same in the 3rd and 4th printings; the FanPro 2007 printing differs only in the heat sink ratings (D, D, E) and the MASC cost wording on p.278, and its Defensive Factors Table (p.315) runs +0 to +7.

Printing difference found in Task 13 (BMM Attack Modifiers Table, p.132 in the 2017 BETA, read from the image): the BETA prints Stealth Armor "+1 at short range and medium range, +2 at long range"; the 7th printing (p.134) and every later one print "+1 at medium range, +2 at long range". The BMM table entry follows the later printings.

Task 10 parts 3-4 (done 2026-11-21): BMM pp.27-28, 50-51, 111; CRB pp.64, 67, 102, 253; MT p.72 and tables pp.85, 92, 116 read from images and written back; other printings written or checked (list in `_corrected_pages.md`, parts 3a-4b); the Ruling 8 catalog commit (78441d43a) made.

### Expansions: CityTech 2nd Edition and ClanTroops (listed for a controller ruling; no edition-table slot, #642 Task 8b)

Read from the page images of the corrected 2nd printing and the 1608R printing (the two agree word for word). Printed page = extract index - 1; the text layer's own footers were wrong. CityTech 2nd Edition ("CT2") prints Clan and Inner Sphere equipment together: Equipment section pp.66-72, tables pp.61-63. ClanTroops prints no rule for the family.

| kind | catalog tags | CT2 | unit types | what CT2 prints |
| --- | --- | --- | --- | --- |
| `ams` | `is-ams`, `clan-ams` | pp.66-67; tables pp.61-62 (0.5 t, 1 slot, 1 heat; 12 IS or 24 Clan ammo) | 'Mech, vehicle; OmniMech pods may carry it (p.60) | 1D6 missiles shot down (IS) or 2D6 (Clan), ammo spent 2 x 1D6; engages the first salvo each turn automatically; not against Thunder or Swarm LRMs, but against Narc pods and Streak SRMs (a failed Streak lock disregards the shoot-down: no ammo, no heat); may be turned off in the End Phase and back on only in a later End Phase; ammo explodes as machine gun ammo |
| `artemis-iv` | `<launcher>-artemis-iv`, `ammo-*-artemis-iv` | p.67; tables pp.61, 63 (1 t, 1 slot) | 'Mech, vehicle | +2 on the Missile Hits Table; no effect on indirect LRM fire; not with Streak, Narc, Swarm or Thunder; usable with one-shot packs; same location as the launcher (a centre-torso launcher may use a head Artemis); one Artemis per launcher, and all launchers of a class (LRM or SRM) must carry it; ammo costs twice as much; Guardian ECM nullifies it (p.69) |
| `narc` | `narc`, `clan-narc`, `ammo-is-narc-standard`, `ammo-clan-narc-standard` | p.71; tables pp.61-62 (IS 3 t, 2 slots; Clan 2 t, 1 slot; 6 ammo; range 1-3/4-6/7-9 IS, 1-4/5-8/9-12 Clan) | 'Mech, vehicle | one pod per launcher per turn; a hit attaches the pod for the whole battle; every later Narc-equipped missile attack adds +2 on the Missile Hits Table; SRM and LRM only, not Streak, Artemis IV, Swarm or Thunder; Narc-capable missiles cost twice as much; other beacons in the hex do not confuse them; no firing into or inside buildings; an exploding pod does 2 damage; Guardian ECM nullifies it (p.69); no iNarc |
| Streak SRM (no `EWarKind`) | `streak-srm-2/4/6`, `clan-streak-srm-2/4/6`, `ammo-is-streak-srm-standard`, `ammo-clan-streak-srm-standard` | p.71 (single-shot launchers p.71); Clan table p.61 (SRM-2/4/6 1/2/3 t, 1/1/2 slots, 50/25/15 ammo, range 1-4/5-8/9-12); IS table p.62 (SRM-2 only: 1.5 t, 1 slot, 50 ammo, range 1-3/4-6/7-9) | 'Mech, vehicle | a standard to-hit roll each turn for the lock; if it fails the launcher does not fire, uses no ammo and makes no heat; if it succeeds every missile hits and hit locations are rolled as normal; one roll per launcher; the IS table prints no Streak SRM-4 or SRM-6 row (omission in the book) |
| `ecm-guardian`, `ecm-clan` | `ecm-suite`, `clan-ecm-system` | p.69; tables p.63 (Guardian 1.5 t, 2 slots, 6 hexes) and p.61 (Clan ECM Suite 1 t, 1 slot, 6 hexes) | 'Mech, vehicle | nullifies enemy Beagle probes (which notice the jamming), Artemis IV, Narc beacons and C³ computers within 6 hexes, and any such system whose line passes within 6 hexes; friendly systems unaffected; does not affect TAG or Clan targeting computers; a broken C³ command link stops the whole network, a cut slave is cut off alone |
| `probe-beagle`, `probe-clan` | `beagle-active-probe`, `clan-active-probe` | p.68; tables p.63 (1.5 t, 2 slots, 4 hexes IS) and p.61 (Clan Active Probe 5 hexes, 1 t, 1 slot) | 'Mech, vehicle | detects hidden 'Mechs and vehicles (not infantry, nothing hidden underwater) at the end of a Movement Phase inside 5 hexes (Clan) or 4 (IS) with line of sight; only matters with the hidden-unit rules (Special Case Rules p.53) |
| `tag`, `light-tag`, `apollo`, `inarc`, `laser-ams`, `apds`, semi-guided LRM, smoke and heat-seeking ammo | | none (TAG occurs once, p.69, as a device the Guardian does not affect) | | not printed |

ClanTroops (FASA 1664): no rule for AMS, Artemis, Narc, TAG or ECM ("Artemis" is a squad leader's name, p.53; "Run full ECM" is dialogue, p.50). p.12, 'Mech Weapon Table: Streak SRM 2/4/6 damage to infantry 16L/8L/4L/2L, 32L/16L/8L/4L/2L, 48L/24L/12L/6L/3L/1L, maximum 144 (Clan) and 108 (Inner Sphere, Streak SRM 2 only); p.10: smoke grenades (infantry; a 7-dot cloud that grows to 19 dots, +3 to fire through it; no E-War state).

Maximum Tech p.40 (all printings) prints an infantry disposable Narc launcher (one pod per squad launcher, up to four a platoon, +10,000 C-bills, SRM to-hit modifiers) and infantry TAG (+50,000 C-bills): the catalog has no record for either.

AeroTech 2 Revised (FanPro 35011) p.25, "ECM and Active Probes": ECM has no effect on combat between AT2 units; fighters, small craft and DropShips may carry ECM against ground units; on BattleTech mapsheets an aerospace unit's ECM works per BMR(R) p.136 and its active probe per BMR(R) p.130 (so the table entries above stand). The first AeroTech, BattleTroops, ClanTroops, CityTech (1986), AeroTech 2 (1718) and the BTM/BD/BT2 manuals print no ECM, probe or ECCM rule (AeroTech 2 lists ECM suites only in its BV rule, p.52, and an Active Probe in a Clan OmniFighter's record sheet, p.84). Expansion rules found for the controller: CityTech 2nd Edition (Guardian ECM p.69, Beagle p.68, Clan table p.61) and AeroTech 2 Revised (aerospace ECM p.25).

### C3 (Task 11, part 1: Master/Slave and C3i in the main printings)

| kind | catalog tags | per edition | unit types | edition differences |
|---|---|---|---|---|
| `c3-master`, `c3-slave` | `c3-computer-master`, `c3-computer-slave` | BTC p.118 ("command" computer); BTC:RoW pp.114-115; BMR pp.124-125; BMR(R) pp.134-135; TW pp.131-133; BMM pp.110-112; CRB pp.198-199; none in BT2, BTM, BT3, BT4, BD, Maximum Tech (text search, no rule) | 'Mech, vehicle (Inner Sphere only up to TW) | Master 5 t / 5 slots, Slave 1 t / 1 slot in every printing; a network never exceeds 12 units; BTC to BMR(R): a command/master computer links three slaves (BMR also says "up to four units"); TW on: a Master controls 1-3 Slaves or 1-3 Masters, never both, only four configurations (plus All-Master networks), one network per unit, a unit holding Master and Slave names the active one; BMR: a critical hit to the master or its carrier's loss ends its portion; TW: only the attacker needs LOS; range from the nearest networked unit with LOS in all; stealth armor range modifiers use the nearest networked unit (TW, BMM); TW/BMM/CRB: indirect fire gets nothing from C3 but TAG still helps; the Master (not Slaves) duplicates TAG in every edition; CRB: ECM degrades with +1/+2 TN, a Master in ECM degrades its Slaves, a network raises BV (p.220), active stealth cuts a unit off (not Chameleon LPS); BMM (6th printings, p.112): a network not cut off by ECM keeps sharing data |
| `c3i` | `c3i-computer` | BMR(R) p.135 (first book here to print C3i, read from the image; the 1998 BMR and earlier have none); TW p.133; BMM p.112; CRB p.199 | 'Mech, vehicle | up to six units, no Master, not mixable with Master/Slave, no TAG; one ECM field or one loss does not shut it down (CRB: treated as Slaves for ECM) |
| `c3-boosted-master`, `c3-boosted-slave` | `c3-boosted-master`, `c3-boosted-slave` | BMM p.112; CRB p.199; TW: TO:AUE (part 2) | 'Mech, vehicle | only Angel ECM blocks it; mixed with standard units: a non-boosted member is still cut off by ECM, a non-boosted master's data to boosted members is blocked in any ECM |

Task 11 part 2b (done 2026-11-21): naval C3, aero/capital ECM (SO, TW, AT2R), BMR(R) p.135 and the other printings (TW 1st/3rd/4th, BMM) (rows below). Carried: the infantry Narc launcher and TAG (Maximum Tech p.40) need an infantry field-gear model, so they are scheduled with the infantry E-War carriers in Phase 3 (the infantry platoon has no extra-gear slot today).

C3, Task 11 part 2a (TO:AUE pp.109-111, read from the 7th printing's clean text layer; other printings still to compare):

| kind | catalog tags | per edition | unit types | edition differences |
|---|---|---|---|---|
| `c3-boosted-master`, `c3-boosted-slave` | `c3-boosted-master`, `c3-boosted-slave` | TW: TO:AUE p.110 (table entry added); BMM p.112; CRB p.199 | 'Mech, vehicle, support vehicle, Mobile Structure (Available To BM, IM, CV, SV, MS) | as the Master/Slave rules, immune to hostile ECM except the Angel suite; does not work on a unit with stealth armor engaged |
| `c3-emergency-master` | `c3-emergency-master` | TW: TO:AUE p.110 (table entry added); none in BMM or CRB | BM, IM, CV, SV, MS | acts as a Slave; becomes the Master for up to 6 consecutive turns after the Master is destroyed or knocked out by ECM (turns inside hostile ECM do not count); cannot be switched off once active; cannot act as TAG; reset after the scenario |
| `c3-remote-sensor` | `c3-remote-sensor-launcher` | TW: TO:AUE pp.110-111 (table entry added); none elsewhere | BM, IM, CV, SV, SC, MS | hex-targeted Narc-style launcher; pod is a stationary Slave for 3 full turns after the launch turn, cannot exceed network limits, incompatible with C3i |
| `c3-slave` / `c3i` on battle armor | `is-c3-system` (BC3), `is-improved-c3-system` (BC3i) | TO:AUE p.109 (BC3 / BC3i); classified as `c3-slave` and `c3i` now | BA | a full squad (3 or more troopers, all with the same system) counts as one unit in a C3 network; fewer than 3 troopers loses the benefit |
| (rule, no kind) | none | Ghosts of Obeedah (CGL 2023) p.55 "Vehicle-Mounted Battle Armor Equipment" and p.56 special note | non-BA units | BA-based stealth, ECM suites, digital camo and C3 equipment work on a non-BA unit only if it weighs 3 tons or less; heavier units get no effect (Experimental, Both tech bases). Ghosts of Obeedah p.53 (Automata): self-contained AIs are largely immune to ECM fields (EMP, TSEMP and the like disrupt them). Expansion rule: Phase 1 decides the table shape (Ruling 4) |

C3, Task 11 part 2b, Naval C3 (TO:AUE p.144 and SO pp.105, 112, 309, 351, read from clean text layers):

| kind | catalog tags | per edition | unit types | edition differences |
|---|---|---|---|---|
| `c3-naval` | `naval-c3` | TW: TO:AUE p.144 (table entry added); SO p.112 (each unit may make an ECCM Control Roll, highest bonus shared), p.105 (DropShip orbit-to-surface range band -1), BattleForce NC3 p.351 (up to 6 Elements, -1 to hit, immune to ECM); none in BMM or CRB (catalog editions trimmed to Total Warfare) | JS, DS, SS, WS, Large Craft 200 t or more | links up to six Large Craft like C3i; range bracket from the networked unit nearest the target (attack outside normal range still barred); fighter and Small Craft ECM do not affect it, Large Craft ECM adds modifiers but does not negate it; units more than 60 hexes apart cannot join; weighs 1 percent of the vessel |

C3, Task 11 part 2b-2: aerospace ECM (page images read: SO pp.99-100 in all four printings; BMR(R) p.135):

| kind | catalog tags | per edition | unit types | edition differences |
|---|---|---|---|---|
| (rule, no kind; rides on `ecm-guardian`, `ecm-angel`, `ecm-watchdog`, EW Equipment and Naval C3) | none | TW p.238 (ECM has no effect on combat between aerospace units; on ground mapsheets the ECM of an aerospace unit at NoE altitude affects ground units and the reverse; the carrier always has its benefits); SO pp.99-100 (advanced aerospace: integral ECM field of every military Small Craft (own hex, adjacent hexes if it mounts a suite) and Large Craft (JumpShip, DropShip: adjacent hexes; WarShip, military Station: 2 hexes); +1 per ECM hex on the line of fire, never above +4; same class in one hex never stacks; fighter/Small Craft ECM is ignored by Large Craft; a suite on a Large Craft does nothing; ECCM: fighter or Small Craft tunes its suite to cancel fighter/Small Craft ECM in its hex and -1 on Large Craft ECM (one Large Craft only); Large Craft ECCM Control Roll, -1 per point of MoS, no modifiers, ECM stays on; Naval C3 members share the best roll; probes in Short or Medium Range band; critical hits shrink the field by one hex each; bearings-only missiles count only ECM between missile and target, tele-operated missiles lose control past three hostile ECM hexes); AT2R p.25 (BMR(R) era: no effect on combat between AT2 units, normal ECM when the fighter is on BattleTech mapsheets, BMR p.136); AeroTech (FASA 1986) has no E-War items at all (OCR search, no hits); AT2 1st edition (FASA) prints no ECM combat rule (equipment tables only; OCR search); AT2 errata FAQ: ECM and Active Probes do not function in AT2 rules but work in combined AT2-BattleTech games when the unit is "on the mapboard", C3 and C3i cannot be mounted or used on any AT2 craft, Stealth Armor cannot be mounted on aerospace fighters; none in BTC, BTC:RoW, BMR, BMM, CRB (no aerospace combat rules) | fighter, Small Craft, DropShip, JumpShip, WarShip, Station | TW 1st, 3rd (2011) and 4th (2013) printings of p.238 lack the ground-mapsheet sentence (5th, 2018, on have it). SO 2011 first printing: Small Craft/DropShip ECM damage and the WarShip add say "Sensor or FCS" (later printings: "Sensor or CIC" for the field, "FCS" only for the DropShip ECCM add), page refs go to TO (pp.278-279, 310, 332, 358) instead of TO:AUE (pp.90-91, 122, 144, 170), Fighter Squadron p.27 (later p.25). Phase 3 builds the aerospace ECM board from SO pp.99-100 for Total Warfare; the other editions print no aerospace field rule |

Nova CEWS network limits: already in the ECM section (IO:AE p.60: links up to two other Nova units, declared in the End Phase, linked from the next turn); Task 11 adds nothing.
Network limits per edition for Phase 3 (all printed above): BTC to BMR(R) master/slave three slaves per master, twelve units; BMR(R) C3i up to six units (new in this part); TW master/slave up to twelve, C3i up to six; boosted as master/slave; Naval C3 up to six Large Craft within 60 hexes; remote sensor pod a stationary Slave for 3 turns; Nova two others.

C3, Task 11 part 2b-3 (printing differences; page images read for TW 1st, 3rd, 4th p.131 and BMM 6th 2021 / Oct 2022 p.112; the rest by word compare against pages already read from images):

| kind | catalog tags | per edition | unit types | edition differences |
|---|---|---|---|---|
| (printing notes on `c3-master`, `c3-slave`, `c3i`) | none | TW p.131 (C3 Master/Slave) | 'Mech, vehicle | TW 1st printing (FanPro 2005): range comes from the networked unit nearest the target "with line of sight", no LOS paragraph, no Water paragraph; 3rd (2011, from the 2011 errata): "with line of sight" removed, LOS paragraph (the C3 system itself need not have LOS; hill example, Hexes C and D at range 2), Water paragraph (a C3 above a water hex cannot link to a C3 underwater; a naval vessel on the surface links both ways); 4th (2013) is the odd one: a unit mounting Master and Slave uses one at a time (declared at game start), and its LOS paragraph REVERSES the 3rd: the C3 system itself must have LOS, so Hexes C and D could not use unit B's range past the hill; its Stealth Armor paragraph is doubled and says apply range modifiers only from the target to the nearest networked unit; 5th (2018) on: LOS paragraph back to "need not have LOS", indirect fire reworded (a C3 network does not help launching or spotting indirect fire; TAG still helps), no longer "use the LRM Indirect Fire rules and gain no benefit"; same effect, TAG sentence new. TW pp.132-133 (diagram, four configurations, C3i): same rules in all four, wording only (BattleMech/'Mech, "Open Terrain #2 map"). Table entries follow the 5th-printing-and-later rule (need not have LOS) as the app's Total Warfare entry already does |
| (printing notes on `c3-master`) | none | BMM p.112 | 'Mech | BMM 1st printing (2017 BETA): the Master/Slave carrier "may announce switching between each for use of that system in the following turn" (End Phase); 2nd printing on delete it (a unit that mounts both names the operational system at the start of the game). ECM paragraph: "as long as a 'Mech is not cut off, enemy ECM does not affect its ability to share C3 targeting data" is added in the 6th printing (2021) and kept in the 7th; the 5th (2022 corrected) lacks it. 6th Oct 2022 and 7th break the page after "though the Master's" (the TAG sentence starts p.113); the 6th 2021 and 5th end the page with the whole TAG sentence. 3rd printing: C3 example text changed to "one hex of light woods" (p.111). Extracts already match the images |
| `chaff-pod` (new kind, no E-War equipment before) | `chaff-pod` (catalog editions trimmed to Total Warfare; the Custom Homebrew `custom-chaff-pod-2` is left as it is) | TW: TO:AUE p.111 (table entry added); BMM and CRB print no chaff pod (text search) | BM, IM, CV, SV, AF, CF, SC, DS, MS | one-shot; light smoke plus a 1-hex ECM bubble ECCM cannot negate plus anti-missile cover (all missiles on units in the hex except standard MRMs and Rocket Launchers) for the turn it is fired, friend and foe alike; TO:AUE 4th printing (2020) lacks the sentences "this is not actual ECM and so cannot be negated by ECCM" and "both friend and foe are affected" (the 7th prints them; the app follows the 7th). TO:AUE 7th and the BattleTech-Tactical-Operations-Advanced-Units-and-Equipment copy are word-identical on pp.109-111, 144; the 4th (2020) is the same on the C3 pages (pagination shifted by one) |
| `ew-equipment` (new kind, Task 13 review) | `ew-equipment` (catalog editions trimmed to Total Warfare: BMM names it only in its quirk list, p.87; the CRB not at all) | TW: TO:AUE p.123 (Experimental, IS, D/X-F-E; Beagle Active Probe and Guardian ECM Suite in one, both 3 hexes; one probe and one ECM at a time; not the Guardian for Stealth Armor, p.122); sensor range as the Clan Active Probe (TO:AR p.190); no earlier edition | BM, IM, CV, SV, AF, CF, SC, DS | as Beagle and Guardian at 3 hexes |
| `communications` (table entry, Task 13 review) | `communications-equipment` | TW: TO:AR p.99 (3-6 t is half an ECM suite for an ECCM field, 7+ t one suite, other bonus modifiers lost while it does) and p.100 (7+ t may make ghost targets); TM p.212 construction; no E-War rule in BMM, CRB or earlier editions | any unit that mounts it | ECCM source and ghost targets |

### Alpha Strike (Task 12)

Editions: `alpha-strike` (2013, book "AS", read from the Corrected 2nd Printing, 2015, clean text layer; printed page = extract index - 1) and `alpha-strike-commanders-edition` (ASCE, the 5th printing extract; the app's catalog already cites ASCE pages, and a test now checks each table page against its catalog entry). The Alpha Strike Companion (ASC, v1.6) is not an edition: it prints no E-War play rule, only the conversion of equipment to specials (pp.125-132, and the v1.6 errata) and PV factors; the app's conversion is Phase 5's to compare. `ewarRules.specials` holds the page each special's own entry starts on. MUL units that carry it (live data, 7,410 units with abilities).

| special | AS 2013 | ASCE | MUL units | what it does / difference |
|---|---|---|---|---|
| `ECM` | p.46 | p.77 | 734 | 12-inch bubble; friendly electronics unaffected; hostile probes, drones, Narc/iNarc, C3 shut down in it. Same text; ECM/ECCM optional rule 2013 p.91, ASCE p.161 |
| `AECM` | p.46 | p.76 | 120 | counts as two ECM suites (2013 and ASCE alike); the only ECM that beats a Bloodhound or a C3 Boosted network |
| `LECM` | p.47 | p.78 | 57 | ECM with a 2-inch radius; ASC v1.6 errata: only battle armor ECM suites convert to it |
| `WAT` | p.49 | p.80 | 28 | counts as ECM and LPRB together |
| `AMS` | p.46 | p.76 | 313 | -1 damage (minimum 1) from IF, SRM, LRM attacks, front arc only unless TUR; same text |
| `RAMS` | none | p.89 | 8 | RISC advanced point defense: AMS for itself, or -1 missile damage to a friendly unit within 2 inches |
| `PRB` | p.104 | p.82 | 350 | 18 inches, confers RCN, detects hidden units; ECM and Angel ECM overwhelm it. 2013 p.89 (blip rules, text layer) prints 16 inches where p.104 prints 18: a 2013 printing slip, ASCE says 18 throughout; entered as 18 (not seen on the image) |
| `LPRB` | p.107 | p.86 | 79 | 12 inches, same effects; the catalog lacked it (fixed); ASC v1.6 errata: any unit type with a Light Active Probe, or a non-BA unit with Electronic Warfare equipment, receives it |
| `BH` | p.105 | p.83 | 40 | 26 inches, unaffected by ECM and LECM; only Angel ECM beats it |
| `DRO` | p.106 | p.84 | 31 | a drone in hostile ECM shuts down until it is out; its controller in ECM shuts all of its drones down |
| `RSD#` | p.108 | p.88 | 45 | remote sensors: hidden-unit reveal and spotting, overwhelmed by ECM and Angel ECM |
| `TAG` / `LTAG` | p.109 / p.107 | p.90 / p.86 | 302 / 107 | designate homing artillery targets; LTAG Short range only; ECM does not affect TAG; RISC Homing Jammer stops it |
| `SNARC` / `CNARC` / `INARC` | p.107 | p.87 / p.87 / p.86 | 54 / 12 / 19 | an extra attack; the hit target takes +1 damage from IF, LRM and SRM attacks for the rest of the game unless it is inside a friendly ECM bubble; SNARC maximum range Medium, CNARC Short; same text in both |
| `C3M#`, `C3S`, `C3I`, `C3BSM#`, `C3BSS`, `C3EM#`, `C3RS` | pp.49-51 (entries p.51; C3BSM/BSS p.51) | pp.80-82 (C3BSM/BSS p.80, the rest p.82) | 68, 297, 217, 12, 36, 3, 4 | four-unit networks (C3i six), shared range bracket of the closest member with LOS; hostile ECM cuts a member off (a master inside the bubble kills the whole network); C3i has no master; Boosted ignores everything but Angel ECM. ASCE adds to C3EM: when it shuts down, the unit's own C3 slave burns out too, and it cannot rejoin until repaired |
| `NC3` | none | p.87 | 0 | up to 6 large craft, -1 to aerospace to-hit, immune to ECM but not to the SDS Jammer |
| `NOVA` | none | p.87 | 32 | Nova CEWS: gives ECM and PRB, and acts as a C3i network of up to 3 units that ECM, LECM and WAT cannot disrupt (only a hostile NOVA can); the ASC prints Nova only as a PV factor |
| `STL` | p.48 | p.79 | 509 | +1 Medium and +2 Long to hit (non-infantry); battle armor +1 Short and Medium, +2 Long; no ECM needed in Alpha Strike. ASC v1.6 errata: a Void-Signature System no longer converts to STL |
| `MAS` / `LMAS` | p.47 | p.78 | 80 / 36 | +3 / +2 to-hit on non-physical attacks while the unit stood still; ASC v1.6 errata: Void-Signature converts to MAS, Chameleon LPS does not |
| `JAM` | none | p.89 | 0 | SDS Jammer: cancels the -1 of ATAC and NC3 within its Extreme range |
| `DJ` / `HJ` | none | p.89 | 0 | RISC viral jammers: 34 inches, 5 turns, 2D6 per unit (9+ resists); Decoy takes out AECM, ECM, LECM, STL, WAT; Homing takes out TAG, all C3 and NOVA and adds +1 to IATM/LRM/CNARC/SNARC/SRM attacks; affects friend and foe |
| `TSEMP#` | none | p.90 | 33 | tight-stream EMP, an attack rather than a defense. NGCFells, 2026-11-21: build its effect in (Phase 5 Call 5). |
| `CHF#` (ours) | none | none | 0 | Chaff Pod (TO:AUE p.111). No Alpha Strike book converts it: the Companion to v1.6 and ASCE are silent, and the Companion's SCR# is capital-scale screen chaff. Our conversion (NGCFells, 2026-11-21; `ESpecialAbilityType.Custom`): CHF1 per canon pod, CHF4 for Chaff Pod 2.0, summed per unit. Each pod fires once a scenario at the end of the unit's movement and fills a 2-inch cloud until the End Phase: light smoke, an ECM bubble ECCM cannot negate, and AMS cover (−1, minimum 1, any arc) against IF/SRM/LRM attacks on units inside it, friend and foe alike; none in vacuum. Present only at Custom Homebrew (6) and Munchkin (7); a canon (0-4) or Apocryphal (5) design converts the pod to nothing. The catalog Chaff Pod is now `rulesLevel` 4 (Experimental, as its book has it). |

Not specials but rules around them: ECM/ECCM mode (2013 p.91, ASCE p.161); Stealth and blip counters (2013 p.88, ASCE p.158); hidden units (ASCE p.168). The 2013 book prints no ECM rule for aerospace beyond the shutdown line (2013 p.45 "special electronics (such as ECM) stop working" while shut down).

#### Phase 5 (DONE, plan `2026-11-21-ewar-phase-5.md`)

Module `src/utils/alpha-strike-ewar-play.ts`, view `src/ui/pages/alpha-strike/roster/_asEWar.tsx`, state `AlphaStrikeUnit.ewarPlay` and `AlphaStrikeForce.ewarBoard` / `rulesEdition`. Roster play now applies every special in the table above in both Alpha Strike editions, by the edition's own page and numbers.

**Conversion fixes** (the ASC v1.6 errata and the MUL): Guardian ECM, C3 Master/Slave, Naval C3 and the RISC viral jammers had no Alpha Strike special; Chameleon LPS converted to MCS and now gives STL; Void-Signature gave STL and now gives MAS; Nova and Watchdog gain the ECM, PRB/LPRB and RCN the MUL lists; probes gain RCN; EW Equipment gains LPRB; a C3 Master gives TAG; TSEMP weapons convert (TSEMP#, TSEMP-O#, summed over both kinds as the Companion p.133 says); conventional infantry camo and DEST armor convert to LMAS; a unit never lists RCN twice. Ours (levels 6 and 7 only): the Personal ECM converts to LECM, the fan Null-Signature to STL, Modular C3 to C3I, Chaff Pods to CHF#.

**2013 against the Commander's Edition.** Only ASCE prints the STL own-ECM paragraph and its End Phase toggle (p.79; 2013 p.48 stops after the battle armor line) and the C3 slave burnout when an emergency master shuts down (p.82; 2013 p.51 lacks it). RAMS, NC3, NOVA, JAM, DJ, HJ and TSEMP are ASCE only. The numbers (radii and ranges in inches, network sizes) are in `IEWarItemRule.inches` and `.networkSize`.

**Calls 1-6** (NGCFells, 2026-11-21, all confirmed): (1) hostile ECM-mode suites are set against friendly ECCM-mode suites over a unit, the higher count wins and a tie cancels both; friendly ECM against hostile ECCM the same; a hostile Angel keeps its Angel-only effects only when its fields are both ECM and it wins. (2) Under ASCE a non-infantry unit with STL on counts as inside hostile ECM for its own probes, C3 and drones and projects no ECM (an AECM keeps one ECCM field); the 2013 book has none of it, and no End Phase toggle. (3) Narc +1 first, then AMS or RAMS -1, minimum 1. (4) Conventional infantry STL has no printed modifier (ASCE p.79, 2013 p.48 cover non-infantry and battle armor); stealthy infantry gets LMAS, as the MUL gives it. (5) TSEMP: uses per turn (or per scenario for -O), Short and Medium only, effect roll -1 BattleMech or aerospace, -2 LG, +2 support vehicle, none on CI, DropShips, VLG or SLG, 8+ shuts down, 7 or less +1 to attacks and Control Rolls, no stacking, gone in the next End Phase (ASCE p.90). (6) The Personal ECM is LECM: its own hex (2 inches), no ECCM mode.

Ours (CHF#): a unit inside a chaff cloud counts as inside hostile ECM that ECCM cannot negate and as covered by an any-arc AMS; the code is ignored below Custom Homebrew. Declared by the player: coverage, networks, drone control, line of sight and range (there is no hex map).
