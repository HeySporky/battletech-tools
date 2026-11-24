# Micro-Mech Alpha Strike ruleset (#173, Micro-Mech plan Chunk G)

**Status: approved by the owner on 2026-11-14 and built the same day.**

Owner rulings (2026-11-14): (1) armor by Alpha Strike's rule; (2) one ability, `MCR`, as best, with every code
explained in our rules, and a TRO - JBT entry for Micro-Mechs with credits; (3) the first Engine Hit as proposed;
(4) type code `MM`, as best. Added in the build, beyond the design: a weapon with no ammunition counts nothing;
the Caseless AC/5 keeps two fifths of the AC/5's value (its printed damage is 2); CASE prints when the torso has
CASE or every ammunition location has its own.

This ruleset is ours. No book and no Micro-Mech text has Alpha Strike rules for a Micro-Mech; the 6.1.0.2 document
converts to BattleForce 2 only. Every card made by it is marked NOT OFFICIAL. Each rule below is marked with where
it comes from:

- **[Doc]** the document's "Battle Force 2 Conversions" appendix (PDF p.12) or its play rules.
- **[AS]** the Alpha Strike conversion rules: Alpha Strike Companion (ASC), conversion chapter pp.91-141, with
  errata v1.6; play rules from Alpha Strike: Commander's Edition (AS:CE, 5th printing).
- **[Ours]** a call of ours, where neither says anything or the two differ.

## Read

- The document, raw text lines 576-592 (the BattleForce 2 appendix), lines 37-182 (play rules), and the four
  samples' "BattleForce2" lines (755-757, 841-843, 921-923, 1003-1005).
- BattleForce 2 (FASA 1703), pp.100-102: the conversion the document changes.
- ASC: unit type and Size table (p.92), Move (pp.92-94), armor (p.95), structure and the 'Mech Structure
  Conversion Table (p.97), weapons (pp.99-101), heat (pp.115-116). Special abilities (pp.116-133) and Point Value
  (pp.138-141) as `ProtoMech.getAlphaStrikeStats()` and `calculateGroundPointValue()` already carry them.
- AS:CE: stacking, partial cover ("'Mechs only"), physical attacks (pp.45-46), anti-'Mech attacks (p.46), the Heat
  special against a unit with no Heat Scale, critical hits (pp.49-50), unit heights. Page numbers not given here
  were not found in the text extract. Confirmed 2026-11-14 against the TW 11th printing (pp.116, 117, 122, 124, 127-128) and the AS:CE 2022 5th printing (pp.45-46, 50; the PDF page is the printed page + 1).
- Code: `ProtoMech.getAlphaStrikeStats()` and `getAlphaStrikeUnit()` (`src/classes/protomech.ts`),
  `src/utils/alphaStrikeGroundPointValue.ts`.

## 1. The card

| Stat | Rule | From |
|---|---|---|
| Type | **MM**, "Micro-Mech". The document's BattleForce class is "Mi"; Alpha Strike codes are two capitals. | Ours (Doc for the idea) |
| Size | 1. The 'Mech row "under 40 tons" (ASC p.92). | AS |
| Move | 2 inches a Walking MP; a jumping Micro-Mech prints `12"j`, or `10"/6"j` when the two differ (ASC pp.92-93). No MASC (banned). | AS |
| TMM | From the non-jumping Move, the standard table; `JMPS#` / `JMPW#` when the jump differs. | AS |
| Armor | All armor points (rear torso included, the cockpit's 3 points not included) / 30, rounded normally (ASC p.95). | AS; see call 1 |
| Structure | Always 1. | Doc, and AS agrees: the 'Mech table gives a 10- or 15-ton standard-engine 'Mech 1 (ASC p.97) |
| Threshold, Overheat | None. "They do not have an overheat rating." Heat conversion is for units that track heat (ASC p.115). | Doc, AS |
| Damage S/M/L | Section 2. | AS, Ours for rows no book converts |
| Specials | Section 3. | AS, Ours |
| Point Value | Section 5. | AS |
| Role | None. | Ours |
| Tech | Inner Sphere. | as the class |

## 2. Damage

The Companion's method (ASC pp.99-101): add each forward weapon's value at Short, Medium and Long; a sum above 0
and under 0.5 is 0*; any other sum is rounded up. A Micro-Mech has no rear-mounted weapons and no targeting
computer row. No heat step, so nothing is scaled down and there is no Overheat.

Each weapon's value:

1. **A table row that is the same weapon as a book weapon** (its `canonTag`): our catalog's Alpha Strike values
   for that weapon, which are the Companion's. [AS]
2. **A launcher with a tube count no book prints** (LRM 1-4, 6-9 ...; MRM; SRM 1, 3, 5; Streak; ELRM): the family's
   value for one missile hit x the Cluster Hits Table at a roll of 7 for that tube count, as the ProtoMech
   conversion already does for its tube launchers. LRMs keep the family's half value at Short (minimum range).
   Streak launchers hit with every tube. [Ours, on AS's method]
3. **Artemis IV**: the launcher's Artemis value (the Cluster Hits Table at 9 for an odd tube count), fitted to
   launchers in the order mounted, as the Battle Value step reads it. [AS; Ours for the order]
4. **Rows no book converts** (the three recoilless rifles, the light and heavy mortar, the grenade launcher):
   damage / 10 at each bracket the printed range reaches (Short always; Medium if the long range is over 3 hexes;
   Long if over 15), halved at Short for a minimum range. Heavy Recoilless Rifle 0.3/0.3/-; Grenade Launcher
   0.1/-/-. See call 2. [Ours]
5. **Few shots**: x 0.75 for a ballistic or missile weapon with fewer than 10 shots (Ultra AC 20, Rotary AC 60)
   (ASC p.101). A one-shot launcher (the Thunderbolt OS) x 0.1; rocket launchers as the table has them. [AS]
6. **No kick in the damage values.** The document adds a "damage factor of 1" for the kick to BattleForce's
   Point Blank damage. Alpha Strike keeps physical attacks out of the damage values (ASC p.101) and gives a
   standard physical attack damage equal to Size (AS:CE p.45): Size 1 is the document's 1-point kick. [AS]

## 3. Special abilities

**From the equipment and the damage, as the Companion has them [AS]:** `AC`, `FLK`, `LRM`, `SRM`, `IF#`, `HT`
(flamers), `ENE` (no ammunition carried), `CASE`, `CASEII`, `ECM`, `AECM`, `PRB`, `BH`, `RCN` (with a probe),
`TAG`, `C3M`, `C3S`, `C3I`, `SNARC`, `INARC`, `JMPS#`, `JMPW#`. `SEAL` when the design is environmentally sealed.
No `MEL`, `TSM`, `AMS`, `OVL` (banned items, no heat).

**`MCR`, "Micro-Mech" [Ours]:** one new ability on every Micro-Mech card, holding the play rules that matter at
this scale. The card prints the code; the ability text is shown under the card and in the print legend.

| MCR rule | Alpha Strike effect | From the document's |
|---|---|---|
| Low profile | 1 inch (1 level) tall, as a vehicle, for line of sight; never has partial cover | "treated as vehicles for Line of Sight"; "cannot make use of partial cover" |
| Stacking | Counts as a vehicle for stacking and displacement | "counts as a vehicle for stacking" |
| No heat | No Heat Scale and no Overheat. A Heat (`HT`) attack against it does its heat as damage, the AS:CE rule for a unit with no Heat Scale | "does not have a heat scale" |
| Too small to swarm | Cannot be the target of an anti-'Mech (`AM`) attack | "cannot be targets of leg or swarm attacks" |
| Light frame | Standard physical attack (1 damage) and charge only, both by the AS:CE rules; no Death From Above, no melee | kick 1 point; "one point of damage"; no DFA, punches, pushes, clubs |
| Engine | Critical hits on the 'Mech column. First Engine Hit: a unit with `ENE` can make no more weapon attacks; any other unit takes it as a Weapon Hit. Second: destroyed | first engine hit "cannot fire any energy weapons", second destroys |
| Unsealed | Without `SEAL` it follows the IndustrialMech limits for water and vacuum | sealing rules |

Rules of the document with no effect at this scale, left out: the pilot in the torso (an Ammo Hit already
destroys a unit without CASE, and result 12 stands for the cockpit), Piloting bonuses, the smaller slot tables,
buildings, swamps, ammunition dumping, climbing out. Version differences (6.1.0.2 / Solarmech 2019) change
nothing on the card except through the design itself.

**`MMT#`, "Micro-Mech Transport" [Ours, owner 2026-11-14]:** on the carrier, not the Micro-Mech. A Micro-Mech
Bay (the document's AeroTech 2 supplement) gives a DropShip, Small Craft or capital ship `MMT#`, written as that
class writes its other unit-bay codes (`MMT4-D1` on a DropShip, `MMT2D1` on a capital ship). It reads as `MT#` /
`PT#` (AS:CE pp.87-88) for Micro-Mechs only; no other unit may use the bay. The document's emergency rule
(two Micro-Mechs in a BattleMech bay, deployment time doubled, no orbital drop) becomes: an `MT#` bay may hold two
Micro-Mechs in place of one 'Mech, each counting as two units against what its doors deploy in a turn, and none
of them may be dropped. Text: `MICRO_MECH_TRANSPORT_AS_ABILITY_TEXT`.

With it, DropShips and Small Craft now print the canon unit-bay codes too (`AT`, `ST`, `MT`, `PT`, `VTM`, `VTH`,
`VTS` with their doors), which they lacked; capital ships already did.

## 4. Critical hits

The 'Mech column of the Determining Critical Hits Table (AS:CE p.50), with the Engine Hit reading in `MCR`. [AS, Ours]

## 5. Point Value

The ground procedure (ASC pp.138-141, errata v1.6) exactly as for a BattleMech: half the Size is added to the
Offensive Value; no ProtoMech + 1 on the defence modifier; no IndustrialMech reduction; no Overheat. `MCR` itself
is worth nothing either way (its rules pull both ways). It is run through the shared
`calculateGroundPointValue()` with the BattleMech lines. [AS; Ours for choosing the BattleMech lines]

## 6. The four samples

| Sample | Move | TMM | A/S | Damage | Specials | PV | The document's BattleForce 2 line |
|---|---|---|---|---|---|---|---|
| Storm STM-3X | 12"j | 2 | 2/1 | 1/0*/- | MCR | 11 | MP 6J, 1/1, 1/-/-, PV 2 |
| Tunnel Rat TNR-1X | 8"j | 1 | 2/1 | 1/1/- | MCR, PRB, RCN | 14 | MP 4j, 7/7, 3/1/-, prb, PV 11 (corrupt) |
| Hillman HMN-2X | 10" | 2 | 2/1 | 1/1/1 | MCR, IF1 | 14 | MP 5, 1/1, 1/1/1, PV 4 |
| Slayer SL-X4 | 10"j | 2 | 2/1 | 2/1/- | MCR, ENE | 13 | MP 5J, 2/1, 1/1/-, PV 5 |

Worked sums: Storm 0.3 (ER Small Laser) + 0.2 (Machine Gun) = 0.5 / 0.3 / 0. Tunnel Rat 0.5 + 0.1 + 0.3 = 0.9 /
0.8 / 0. Hillman 0.33 (Small Pulse Laser) + LRM 9 (5 hits: 0.25 / 0.5 / 0.5) = 0.58 / 0.5 / 0.5. Slayer 0.8 + 0.3
= 1.1 / 0.8 / 0. Armor points 46, 48, 54, 60.

Where the card and the document's line differ, and why:

- **MP**: the same figure (BattleForce MP = Walking MP; Alpha Strike prints inches).
- **Armor**: BattleForce 2 reads armor from a table; Alpha Strike divides by 30 and rounds. The Storm (46) and the
  Hillman (54) come to 2 where the document has 1. The Slayer agrees.
- **Damage**: the Hillman agrees. The Storm agrees but for the 0* (BattleForce 2 has no minimal damage). The
  Slayer's Short is 2 where the document has 1: Alpha Strike rounds 1.1 up, BattleForce 2 rounds normally.
- **Point Value**: not comparable. BattleForce 2's is Battle Value / 100.

## Calls that were ours

1. **Armor by Alpha Strike's rule**, not the document's BattleForce table, so a Micro-Mech's armor reads on the same
   scale as every other card.
2. **The grenade launcher by its printed range** (1/2/3: Short only). The document's BattleForce list puts it at
   Medium Range; the record sheet's range comes from Combat Equipment (owner ruling 6) and does not reach it.
3. **Odd tube counts** by the Cluster Hits Table at 7 (rule 2 of section 2).
4. **One ability, `MCR`,** rather than a code for each play rule: a card has little room, and no book explains
   any of these codes, so one text serves better than four.
5. **The first Engine Hit.** The document stops energy weapons; a card has no weapon list, so `ENE` units stop
   firing and others lose 1 from each damage value.
6. **The BattleMech Point Value lines**, with nothing added or taken off for `MCR`.
7. **Type code `MM`.**

## Build (done 2026-11-14; plan Step 4)

`getAlphaStrikeStats()` and `getAlphaStrikeUnit()` on `MicroMech`; `print-as.tsx` in the creator; the card marked
NOT OFFICIAL with `MulSource` set (#593); the `MCR` text in the special abilities reference; the type accepted by
`AlphaStrikeUnit` and the Point Value helper; the unit offered in the Alpha Strike roster's add page beside the
other custom units. Tests first, pinning the four samples above.
