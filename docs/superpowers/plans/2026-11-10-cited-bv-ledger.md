# Cited Battle Value: reading ledger (#599)

What was read, where, and how our code compares. Everything here is in our own words; no rulebook text is copied.
The step ids are the keys of the definition tables in `src/data/calc-steps-mech-*.ts`.

How pages were read: the text extracts in `C:/repo/ResourceLibrary` (`library_search.py --page`), and the page image
(`render_page.py`, or a crop of it) wherever a table was involved or the extract ran columns together. "Image" in the
last column means the page image was checked.

## Sources read

| Source id | Document | Printing |
|---|---|---|
| `tm` | TechManual | Corrected Sixth Printing (2021) |
| `tm-bv-tables-4.1` | TechManual Battle Value chapter, re-issued | v4.1 |
| `tw` | Total Warfare | Corrected Eleventh Printing (2024) |
| `toaue` | Tactical Operations: Advanced Units & Equipment | 2022 printing |
| `ioae` | Interstellar Operations: Alternate Eras | 2022 printing |
| `ioae-errata-3.01` | IO: Alternate Eras errata | v3.01 (17 January 2023) |
| `bmr` | BattleTech Master Rules | FASA 1707 (1998) |
| `bmr-errata` | Classic BattleTech Master Rules errata, FanPro printings | As of 1 October 2004 |
| `bmrr` | BattleTech Master Rules, Revised Edition | FanPro 35000 (2005 printing) |
| `mt` | Maximum Tech | FASA 1700, Corrected Second Printing (1999) |
| `mt-revised` | Maximum Tech, Revised Edition | FanPro 35013, PDF version 1.0 (2005) |

The v4.1 Battle Value chapter was compared with TM pp.302-304 line by line for the 'Mech rules: the rules text is
the same. The IO:AE errata v3.01 has one Battle Value entry (Dead-Fire ammunition, p.190); it does not touch any
'Mech step below.

## Sources to ask the owner for

None for 'Mech BV2.

For BV1: Maximum Tech, first printing (FASA 1700, 1997). The library holds the corrected second printing (1999) and
the FanPro Revised (2005). Both print Inner Sphere Grenade Launcher BV 1; the owner recalls 15 in one printing.
Nothing waits on it.

## 'Mech BV2 (read 2026-11-10)

Code: `_calcBattleValue` and its helpers in `src/classes/battlemech.ts`.

### Defensive Battle Rating

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `bv2.def.armor` | TM p.302, table p.315; TO:AUE p.192 table | Armor points x 2.5 x the armor type modifier. TM: standard, ferro-fibrous, industrial, heavy industrial and stealth 1.0, commercial 0.5. TO:AUE adds ferro-lamellor 1.2, hardened 2.0, laser-reflective 1.5, reactive 1.5. | Yes | Image (TO:AUE p.192) |
| `bv2.def.armor.dark-age` | IO:AE p.185 table, p.190 table | Two tables that disagree: see Finding 3. | Follows p.190 (owner ruling 2026-11-10) | Image (both) |
| `bv2.def.armor.patchwork` | TO:AUE p.194 | Work the armor location by location with each location's modifier, sum, then x 2.5. | Yes | |
| `bv2.def.armor.torso-cockpit` | TO:AUE p.193 | Count the center torso armor, front and rear, twice, before the armor type modifier. | Yes | |
| `bv2.def.armor.modular` | TO:AUE p.192 | Modular armor's points count with the modifier of the armor in the same location; stealth still counts at full effect; the speed penalty is ignored everywhere in BV. | Yes | |
| `bv2.def.armor.harjel` | IO:AE p.185 | HarJel II x 1.1 and HarJel III x 1.2 on the armor of the locations that hold one, stacking with the armor type modifier. | Yes | Image |
| `bv2.def.armor.blue-shield` | TO:AUE p.192 | A Blue Shield adds 0.2 to the armor type modifier and to the structure type modifier, and counts as a Gauss weapon with a slot in every location but the head. | Yes (the record is explosive and spread over those locations) | Image |
| `bv2.def.structure` | TM p.302, table p.315; TO:AUE p.194 table | Structure points x 1.5 x the structure type modifier. Standard and endo steel 1.0, industrial 0.5; composite 0.5, endo-composite 1.0, reinforced 2.0. | Yes | |
| `bv2.def.structure.frankenmech` | TM p.302 | No rule for mixed structure types. | Our reading: per location | |
| `bv2.def.engine` | TM p.302, table p.315; TO:AUE p.193 table | The structure figure x the engine modifier: standard (ICE, fuel cell, fission), compact 1.0; light 0.75; Inner Sphere XL 0.5; Clan XL 0.75; Inner Sphere XXL 0.25; Clan XXL 0.5; a large engine as its type. | Yes | |
| `bv2.def.engine.superheavy` | IO:AE pp.187-188 | A Superheavy uses its own table: light 0.825, XL (IS) 0.75, XL (Clan) 0.825, XXL (IS) 0.5, XXL (Clan) 0.75, others 1.0. | Yes | The extract's columns are shifted; read against the code's values row by row |
| `bv2.def.gyro` | TM p.302, table p.315; IO:AE p.187 | Tonnage x 0.5, or x 1.0 for a heavy-duty gyro. A Superheavy's gyro, and a gyroless interface-cockpit 'Mech, count as a standard gyro. | Yes | |
| `bv2.def.equipment` | TM p.302 | Add the BV of defensive equipment: active probes, anti-missile systems, A-pods, B-pods, bridgelayers, ECM, marked with a dagger in the tables. | Yes (`battleValueDefensive`) | |
| `bv2.def.equipment.ams-ammo` | TM p.302 | AMS ammunition counts here, up to the BV of the systems. | Yes | |
| `bv2.def.equipment.armored` | TO:AUE p.192, p.195 note J | 5 percent of the protected item's BV for each slot; 5 points a slot when the item has no BV. | Yes | |
| `bv2.def.equipment.armored-gyro` | TO:AUE p.192 | Same rule; a gyro has no table BV. | No: see Finding 5 | |
| `bv2.def.equipment.total` | TM p.302 | The sum of the above. | Yes | |
| `bv2.def.explosive.ammo` | TM pp.302-303; TO:AUE p.193 | 15 points for each slot of explosive ammunition: a Clan 'Mech in the center torso, legs or head; an Inner Sphere XL 'Mech anywhere; another Inner Sphere 'Mech in the center torso, legs or head, in a location without CASE, or in an arm when neither it nor the location inward has CASE. A Clan 'Mech with an XXL engine counts as an Inner Sphere XL. CASE II excuses its own location and the one outward of it, legs excepted. | Yes, except Findings 1, 2 | |
| `bv2.def.explosive.lam-store` | IO:AE p.186 | Each LAM fuel slot and bomb bay slot counts as explosive ammunition. | Yes | |
| `bv2.def.explosive.component` | TM p.303; TO:AUE pp.192-193, p.195 notes | 1 point for each slot of a Gauss weapon under the same location rules. TO:AUE marks more items "treat as Gauss" or "explodes"; an HVAC counts one slot; a coolant pod 1 point a slot. | Yes | |
| `bv2.def.explosive.jump-jet` | IO:AE p.97 | Prototype improved jump jets may explode when damaged; no BV rule. | Our reading: 1 a slot | |
| `bv2.def.explosive.protected` | TM pp.302-303; TO:AUE p.193 | The cases above where nothing is subtracted. | Yes | |
| `bv2.def.explosive.arm-case-xl` | TM p.302 | For an Inner Sphere XL engine the page says any location. | No: see Finding 1 | |
| `bv2.def.explosive.superheavy` | IO:AE p.188 | A Superheavy counts as a Clan 'Mech where the location has CASE, and as an Inner Sphere 'Mech where it has none; CASE II with a Gauss weapon subtracts nothing. | Mostly: see Finding 7 | |
| `bv2.def.explosive.prototype-case` | IO:AE p.189 | Prototype CASE: "Ammo critical slots count as –8 BV, rather than –15", where CASE would protect them. | Yes, since 2026-11-10: see Finding 2 | Image |
| `bv2.def.harjel-slots` | IO:AE p.185 | Each HarJel slot takes 1 off the defensive figure. | Yes | Image |
| `bv2.def.subtotal` | TM pp.302-303 | Additions less subtractions. | Yes | |
| `bv2.def.floor` | TM p.302 | The subtractions cannot take the running total below 1. | Yes | |
| `bv2.def.tmm` | TM p.303, p.316 note; TW p.117; TO:AUE pp.192, 194 | The highest target movement modifier the 'Mech can reach, with the jump bonus, MASC, TSM, a supercharger, mechanical jump boosters and a partial wing counted. TW table: 0-2 hexes +0, 3-4 +1, 5-6 +2, 7-9 +3, 10-17 +4, 18-24 +5, 25 or more +6, jumping +1 more. | Yes | The TW extract's column is shifted; the row values are the standard table |
| `bv2.def.tmm.lam` | IO:AE p.186 | A standard LAM uses AirMech flank speed and +1 for being airborne; a bimodal LAM counts as a 'Mech. | Yes | |
| `bv2.def.tmm.umu` | TO:AUE p.192 | Calculate a UMU as if it were jump jets; with jump boosters too, use the better. | No: see Finding 6 | |
| `bv2.def.factor` | TM p.303, table p.316 | Defensive factor 1.0 at +0, rising 0.1 for each point of modifier. | Yes | Image |
| `bv2.def.factor.stealth` | TM p.303; TW p.142 | The factor counts stealth armor at its greatest effect; stealth armor gives +2 at long range. | Yes (+0.2) | |
| `bv2.def.factor.null-signature` | TO:AUE p.194, p.148 | Add the long-range modifier (+2). | Yes | |
| `bv2.def.factor.chameleon` | TO:AUE p.193, p.112 | Add the long-range modifier (+2). | Yes | |
| `bv2.def.factor.void-signature` | TO:AUE p.194 | Use the 'Mech's own modifier or the system's +3, whichever is higher; on a tie add 1. | Yes | |
| `bv2.def.rating` | TM p.303 | Running total x defensive factor. | Yes | |

### Offensive Battle Rating

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `bv2.off.ammo` | TM p.303, tables pp.317-318 | Each weapon's and each ton of ammunition's BV comes from the tables. | Yes | |
| `bv2.off.ammo.unused` | TM p.303 | Ammunition cannot be worth more than the weapon it feeds. | Yes: no weapon, no value | |
| `bv2.off.ammo.cap` | TM p.303 | Total the BV of every weapon of one model and of all its ammunition; the ammunition counts up to the weapons' unmodified total. | Yes | |
| `bv2.off.ammo.total` | TM pp.303-304 (step 2) | Ammunition and non-defensive equipment are added to the weapon rating. | Yes | |
| `bv2.off.heat.efficiency` | TM p.303 | 6 + heat sink capacity (single 1, double 2) - the heat of the hottest movement, running or jumping. Stealth armor adds 10 to movement heat. An ICE IndustrialMech's movement heat is 0. | Yes | |
| `bv2.off.heat.radical` | IO:AE p.185, table p.190 | Text: capacity x 1.4, rounded up. Example and table: add heat sinks x 0.4, rounded up. | Follows the table: Finding 9 | Image |
| `bv2.off.heat.signature` | TM p.303; TO:AUE pp.112, 148, 161 | The systems make 6 (Chameleon) or 10 (Null, Void) heat while on. No BV rule for that heat. | Our reading: Finding 8 | |
| `bv2.off.heat.partial-wing` | TO:AUE p.192, p.105 | BV rule: use the jump distance with the wing bonus, standard atmosphere. The wing also sheds heat. | Our reading | |
| `bv2.off.heat.lam` | IO:AE p.186 | A LAM adds 9 in place of 6 and subtracts the movement heat of AirMech flank speed. | Yes | |
| `bv2.off.heat.emergency-coolant` | IO:AE p.190 table | RISC emergency coolant system: +4 heat efficiency. | Yes | Image |
| `bv2.off.heat.coolant-pod` | TO:AUE p.193 | Add heat sinks x (pods / 5), rounded up, at most twice the heat sinks. | Yes | |
| `bv2.off.heat.weapons` | TM p.303; TO:AUE p.194; IO:AE p.186 | The heat of firing every offensive weapon once, rear ones included: Ultra autocannons x 2, rotary x 6, Streak SRMs half, one-shot weapons a quarter. An insulated laser 1 less; a PPC capacitor's heat with its PPC; prototype ER large laser 13, prototype medium pulse laser 7. | Yes; see Finding 12 | |
| `bv2.off.weapon` | TM pp.303-304 (steps 1, 3-5), tables pp.317-318 | Heatless weapons at full value. If total weapon heat is no more than the efficiency, all at full value. Otherwise take weapons from the highest Modified BV down, the cooler one first between equals, adding their heat. | Yes | |
| `bv2.off.weapon.rear` | TM p.303 | Rear-firing torso, leg and head weapons count half, unless they are worth more than the forward ones there, when the forward ones count half. | Yes | |
| `bv2.off.weapon.turret` | TO:AUE p.194 | Turret weapons count as forward-firing when the forward non-turret weapons are worth more than the rear ones, otherwise as rear. | Yes | |
| `bv2.off.weapon.overheat` | TM p.304 (steps 6-7) | The weapon that reaches or passes the efficiency still counts in full; those after it count half. | Yes | |
| `bv2.off.weapons.total` | TM p.304 | The running weapon rating. | Yes | |
| `bv2.off.tonnage` | TM p.304 (step 8) | Add the 'Mech's tonnage. | Yes | |
| `bv2.off.tonnage.tsm` | TM p.304; IO:AE p.186 | TSM: tonnage x 1.5. Industrial TSM: x 1.15. Prototype TSM: x 1.5. | Yes | |
| `bv2.off.tonnage.aes` | TO:AUE p.192 | Add 10 percent of the tonnage for each limb with an AES. | Yes, tripods since 2026-11-10: see Finding 4 | |
| `bv2.off.speed` | TM p.304, table p.316; TO:AUE p.192 | Running MP + half the Jumping MP rounded up, with MASC, TSM (not industrial TSM), a supercharger or jump boosters at their most; then the table, or (1 + (that - 5) / 10) to the power 1.2, to two places. | Yes | |
| `bv2.off.speed.lam` | IO:AE p.186 | A LAM adds half its AirMech flank MP, rounded normally, to its 'Mech running MP. | Yes | |
| `bv2.off.rating` | TM p.304 | Weapon rating x speed factor. | Yes | |
| `bv2.off.industrial` | TM p.304 | An IndustrialMech without advanced fire control: x 0.9. | Yes | |

Weapon modifiers inside a Modified BV (`MECH_BV2_WEAPON_CITES`):

| Modifier | Read on | What the page says |
|---|---|---|
| Targeting computer | TM p.303 | Each linked weapon x 1.25; not its ammunition. |
| Artemis IV | TM p.303 | The launcher + 20 percent; not its ammunition. |
| Machine gun array | TM p.317 note F | The total BV of the guns in the array x 0.67. |
| Actuator enhancement | TO:AUE p.192 | Weapons linked to an AES, physical ones included, x 1.25. |
| Drone operating system | TO:AUE p.193 | Every weapon x 0.8; not ammunition. |
| Apollo | TO:AUE p.195 note L | An MRM launcher with Apollo + 15 percent. |
| PPC capacitor | TO:AUE p.194 | The table lists the PPC and capacitor as one item; the capacitor's heat counts with the PPC's. |

### Final Battle Value

| Step id | Read on | What the page says | Code agrees? |
|---|---|---|---|
| `bv2.final.sum` | TM p.304 | Defensive + offensive ratings. | Yes |
| `bv2.final.cockpit` | TM p.304; TO:AUE p.193; IO:AE p.187 | Small cockpit x 0.95; torso-mounted cockpit x 0.95; interface cockpit x 1.30. | Yes |
| `bv2.final.drone` | TO:AUE p.193 | A drone operating system: final BV x 0.95, and no cockpit modifier. | Yes |
| `bv2.final.robotic` | IO:AE p.187 | Smart robotic control system: final BV x 0.85. | Yes |
| `bv2.final.override-kit` | IO:AE p.190 table | RISC heat sink override kit: final BV x 1.01. | Yes |
| `bv2.final.equipment` | none | A catch-all for any other record that multiplies the final BV. None exists today. | n/a |
| `bv2.final.round` | TM pp.302, 304 | Round to the nearest whole number, a half up. | Yes |
| `bv2.final.lam-bombs` | TM p.315; IO:AE p.186 | External stores add to a fighter's base BV before the skill multiplier. Nothing says LAM bombs do. | Our reading |

## 'Mech BV1 (read 2026-11-10 and 2026-11-11)

Code: `_calcBattleValue1` in `src/classes/battlemech.ts`; `getBattleValue1Rater`, `getBattleValue1Ammo` and `MAX_TECH`
in `src/data/battle-value.ts`. The two Master Rules books print the same procedure; the table gives both pages
(BMR / BMR(R)). Page numbers are the printed ones. The Level 3 rows were read in both printings of Maximum Tech: the
FASA corrected second printing (`mt`, cited under master-rules; its p.90 says it builds on Master Rules pp.139-145)
and the FanPro Revised (`mt-revised`, cited under master-rules-revised). The two print these rules on the same pages
with the same figures; the item tables, the special ammunition table and the engine table were compared on the page
images of both.

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `bv1.def.armor` | BMR p.139 / BMR(R) p.152 | Total armor points x 2. | Yes | |
| `bv1.def.structure` | BMR p.139 / BMR(R) p.152 | Internal structure points x 1.5; x 0.75 with an XL engine. | Yes | |
| `bv1.def.structure.clan-xl` | BMR pp.139, 145 / BMR(R) pp.152, 159 | The rules text names only "XL engine" (0.75). The Goshawk example (a Clan XL) uses 91 x 1.125. | Follows the example: Finding 17 | |
| `bv1.def.structure.light-engine` | BMR(R) p.152 | x 1.125 with a Light engine. Not in the 1998 book (no Light engine there). | Yes; provisional under master-rules | |
| `bv1.def.tonnage` | BMR p.139 / BMR(R) p.152 | Add the 'Mech's tonnage. | Yes | |
| `bv1.def.equipment` | BMR p.139, tables pp.142-144 / BMR(R) p.152, tables pp.156-158 | Add the BV of defensive equipment: anti-missile systems with their ammunition, and ECM. Everything else is offensive. | Yes (A-Pods also counted defensive) | |
| `bv1.def.explosive` | BMR pp.139-140, errata p.12 / BMR(R) pp.152-153 | 20 points a ton of explosive ammunition, a Gauss rifle counting as a ton: Clan in center torso, legs or head; Inner Sphere XL anywhere; Inner Sphere standard (BMR(R): or Light) in center torso, legs, head, or a location without CASE; an arm, see Finding 15. | Yes, per edition (Finding 15, fixed) | |
| `bv1.def.heat` | BMR p.140 / BMR(R) p.153 | (Maximum heat - heat sink capacity) x 5, when positive. Maximum heat: all weapons fired, plus the hotter of running and jumping; Ultra autocannon x 2, Streak / 2, rear-firing weapons ignored. | Yes | |
| `bv1.def.heat.stealth` | BMR(R) p.154 | Stealth armor adds 10 to the maximum heat. Not in the 1998 book. | Yes; provisional under master-rules | |
| `bv1.def.subtotal` | BMR p.139 / BMR(R) p.152 | The subtractions cannot take the running total below 1. | Yes | |
| `bv1.def.factor` | BMR p.140, table p.32 / BMR(R) p.153, table p.33 | Multiply by the Defensive Movement Factor: 1 + the best Target Movement Modifier / 10 (table to +5 = 1.5), jumping and MASC or TSM counted. Attack Modifiers Table: 0-2 hexes 0, 3-4 +1, 5-6 +2, 7-9 +3, 10+ +4, jumped +1 more. | Yes (`getMovementModifier` capped at 4) | Image (both tables) |
| `bv1.def.rating` | BMR p.140 / BMR(R) p.153 | The defensive subtotal x the Defensive Movement Factor is the Defensive Battle Rating. | Yes | |
| `bv1.off.weapon` | BMR p.140, tables pp.142-144 / BMR(R) p.153, tables pp.156-158 | Add the BV of every weapon; rear-mounted ones at half. When the rear weapons are worth more than the rest, the rear counts as the front. | Yes | |
| `bv1.off.weapon.unlisted` | none | No rule: an item the edition's tables do not print. | We use the BV2 figure; provisional | |
| `bv1.off.targeting-computer` | BMR p.140, note D p.144 / BMR(R) p.153, note D p.158 | 20 percent of the BV of the weapons linked to it; no ammunition; rear weapons at half. | Yes | |
| `bv1.off.ammo` | BMR p.140 / BMR(R) p.153 | All ammunition at full BV, per ton, rear weapons' too. | Yes | |
| `bv1.off.base` | BMR p.140 / BMR(R) p.153 | Weapons + targeting computer + ammunition = Base Weapon Battle Rating. | Yes | |
| `bv1.off.heat` | BMR pp.140-141, errata p.12 / BMR(R) pp.153-154 | When maximum heat exceeds the sink capacity: X = sinks x base / maximum heat; Y = (base - X) / 2; the rating becomes X + Y. The errata restores the X line the 1998 printing garbles. | Yes | |
| `bv1.off.speed` | BMR pp.140-141, errata p.12 / BMR(R) pp.153-154 | Running MP + Jumping MP, +1 with MASC or TSM; the Speed Factor Table, which is ((MP - 5) / 10 + 1) ^ 1.2 to two places. The errata adds the rows for 0 (0.44) and 1 (0.54). | Yes | |
| `bv1.off.speed.stealth` | BMR(R) p.154 | Stealth armor adds 0.2 to the Speed Factor. Not in the 1998 book. | Yes; provisional under master-rules | |
| `bv1.off.rating` | BMR p.141 / BMR(R) p.154 | The modified weapon rating x the Speed Factor is the Offensive Battle Rating. | Yes | |
| `none.no-battle-value` | BMR p.139 | The Battle Value System section opens here; the editions before the 1998 Master Rules have none. | Yes | |
| `bv1.final.round` | BMR pp.139, 141 / BMR(R) pp.152, 154 | Defensive + Offensive; fractions are kept to the end, then rounded to the nearest whole number. | Yes | |
| `bv1.l3.item` | Max Tech (Revised) p.90 | The Level 3 equipment tables: BV and ammunition BV per ton (one-shot launchers after the slash). | Yes, but Finding 16 | Image |
| `bv1.l3.item.artemis-v` | Max Tech (Revised) p.90 | An Artemis V launcher is worth its launcher's BV x 1.3. | Yes | |
| `bv1.l3.ammo.special` | Max Tech (Revised) p.91 | Special ammunition is the standard ammunition's BV x a multiplier (armor-piercing 6, cluster 0.75, flechette 0.5 and so on); semi-guided only with TAG on the side. | Yes | |
| `bv1.l3.def.armor.hardened` | Max Tech (Revised) pp.90-91 | Hardened armor counts x 4 instead of x 2; in patchwork armor only the hardened points are doubled. Other special armors count as standard. | Yes | |
| `bv1.l3.def.engine` | Max Tech (Revised) p.91 | The Engine Multipliers table gives the internal structure multiplier for XXL and large engines. | Yes | Image |
| `bv1.l3.def.structure-type` | Max Tech (Revised) p.92 | Reinforced structure doubles the internal structure value; composite halves it. | Yes | |
| `bv1.l3.def.gyro` | Max Tech (Revised) p.92 | A heavy-duty gyro adds to the base defensive rating. | Yes (30) | |
| `bv1.l3.def.command-console` | Max Tech (Revised) p.91 | A command console adds 25 to the base defensive rating. | Yes | |
| `bv1.l3.def.enhanced-imaging` | Max Tech (Revised) p.91 | Enhanced Imaging takes 25 off the defensive rating. | Yes | |
| `bv1.l3.def.component-armor` | Max Tech (Revised) p.92 | 5 points for each critical slot protected by component armor. | Yes | |
| `bv1.l3.def.torso-cockpit` | Max Tech (Revised) p.91 | A torso-mounted cockpit adds the center torso armor, front and rear, x 2. | Yes | |
| `bv1.l3.def.case-ii` | Max Tech (Revised) p.92 | CASE II protects as CASE does; ammunition it covers costs 5 a ton. | Yes | |
| `bv1.l3.def.coolant-pod` | Max Tech (Revised) p.92 | Each coolant pod adds 1 to the heat sink capacity. | Yes | |
| `bv1.l3.def.factor.supercharger` | Max Tech (Revised) p.91 | The Defensive Movement Factor uses the best possible movement, the supercharger's included. | Yes | |
| `bv1.l3.def.factor.null-signature` | Max Tech (Revised) p.92 | A null-signature system adds 0.5 to the Defensive Movement Factor. Its 10 heat comes in as equipment heat. | Yes | |
| `bv1.l3.def.factor.armless` | Max Tech (Revised) p.92 | A 'Mech built without arms adds 0.1 to the Defensive Movement Factor. | Yes | |
| `bv1.l3.off.multi-trac` | Max Tech (Revised) p.91 | With Multi-Trac II, rear weapons count at full value, and in the heat. | Yes | |
| `bv1.l3.off.targeting.variable-range` | Max Tech (Revised) p.91 | A variable-range targeting system adds 10 percent to the weapon values, worked as a targeting computer is. | Yes | |
| `bv1.l3.off.targeting.enhanced-imaging` | Max Tech (Revised) p.91 | Enhanced Imaging adds 5 percent to the weapon values, the same way. | Yes | |
| `bv1.l3.off.speed.supercharger` | Max Tech (Revised) p.91 | A supercharger counts as MASC does in the Speed Factor (+1). | Yes | |
| `bv1.l3.final.jump-pack` | Max Tech (Revised) p.92 | A jump pack is left out of the movement figures and adds its Jumping MP x 5 to the final BV. | Yes | |

Applied to the force, not in the unit's own steps: the Arrow IV and TAG pairing, +200 to the unit (BMR p.144 and
BMR(R) p.158, note A). Read but not applied by the code (no step): a satellite uplink's value to the side (Max Tech
pp.91-92); a hand-held
weapon's own BV (Max Tech p.92); the Piloting change a torso or compact cockpit makes to the skill multiplier;
improved jump jet heat.

## 'Mech cost (read 2026-11-11)

Code: `_calcCBillCost` in `src/classes/battlemech.ts`, and the `cost` fields of the component records. The cost follows
the current rules under every rules edition: the function has no edition branch of its own (an edition changes only
the equipment prices its book prints). A component is `cited` only where its own table row was read; the lists are in
`READ_ROWS` in `src/data/calc-steps-mech-cost.ts`.

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `cost.cockpit` | TM p.277 table; TO:AUE p.219; IO:AE pp.215, 217 | Standard 200,000; Small 175,000; Industrial 100,000, with advanced fire control 200,000. Torso-mounted 750,000 (TO:AUE). QuadVee 375,000 (IO:AE p.215). Tripod 400,000, Superheavy Tripod 500,000 (IO:AE p.217). | Yes | Image |
| `cost.cockpit.primitive` | IO:AE p.117 text, p.215 table | Text: a primitive cockpit is the standard one in every way, cost included (200,000; industrial 100,000). Table: 100,000 and 50,000. | Follows the text (as the record's note says); provisional: Finding 21 | Image (table) |
| `cost.cockpit.record` | none | A cockpit whose row was not re-read (interface, superheavy and others). | Price from our records; provisional |  |
| `cost.cockpit.command-console` | TO:AUE p.219 | Cockpit Command Console 500,000. | Yes | Image |
| `cost.cockpit.enhanced-imaging` | none | Not re-read. The code comment names Maximum Tech p.87 for the add-on price. | Price from our records; provisional |  |
| `cost.cockpit.robotic` | IO:AE p.215 | Smart Robotic Control System: 5,000 + 10,000 x its tonnage. The other robotic control rows were not read. | Yes for the Smart system; provisional | Image |
| `cost.life-support` | TM p.277 | 50,000. | Yes | Image |
| `cost.sensors` | TM p.277 | 2,000 x unit tonnage. | Yes | Image |
| `cost.musculature` | TM p.277; IO:AE p.215 | Standard 2,000, Triple-Strength Myomer 16,000, Industrial TSM 12,000, each x unit tonnage. RISC Super-Cooled Myomer 10,000 x tonnage (IO:AE). | Yes | Image |
| `cost.musculature.record` | none | A myomer whose row was not re-read (prototype TSM). | Price from our records; provisional |  |
| `cost.musculature.primitive` | IO:AE p.215 | Primitive 'Mech musculature 1,000 x tonnage. | Yes | Image |
| `cost.musculature.superheavy` | IO:AE p.217 | Superheavy 'Mech musculature 12,000 x tonnage. | Yes | Image |
| `cost.structure` | TM p.278 | Standard 400, Endo-Steel 1,600, Industrial 300, each x unit tonnage. | Yes | Image |
| `cost.structure.record` | none | A structure type whose row was not re-read (endo-composite, reinforced, composite, prototype endo steel). | Price from our records; provisional |  |
| `cost.structure.superheavy` | IO:AE p.217 | Superheavy: standard 4,000, endo-composite 6,400, endo steel 16,000, industrial 3,000, each x tonnage. | Yes | Image |
| `cost.structure.tripod` | IO:AE p.217 | Tripod 'Mech structure: the structure cost x 1.2. | Yes | Image |
| `cost.structure.frankenmech` | none | No rule. | Our reading; provisional |  |
| `cost.actuators` | TM p.278 | Each: upper arm 100, lower arm 50, hand 80, upper leg 150, lower leg 80, foot 120, x unit tonnage. Shoulders and hips have no row. Only what is mounted is bought. | Yes | Image |
| `cost.actuators.superheavy` | IO:AE p.217 | Superheavy actuators: 2 x the standard cost. | Yes | Image |
| `cost.engine` | TM p.278; TO:AUE p.219 | (Multiplier x engine rating x unit tonnage) / 75. Standard fusion 5,000, light 15,000, XL 20,000, compact 10,000, internal combustion 1,250, fuel cell 3,500, fission 7,500. TO:AUE: XXL 100,000; large engines twice their type (ICE 2,500, fusion 10,000, light 30,000, XL 40,000, XXL 200,000). | Yes, but each engine is rounded to a whole C-bill: Finding 20 | Image |
| `cost.engine.record` | none | An engine whose row was not re-read (primitive). | Price from our records; provisional |  |
| `cost.gyro` | TM p.278 | Standard 300,000, compact 400,000, heavy-duty 500,000, XL 750,000, each x gyro tonnage. | Yes | Image |
| `cost.gyro.record` | none | A gyro whose row was not re-read. | Price from our records; provisional |  |
| `cost.gyro.superheavy` | IO:AE p.217 | Superheavy 'Mech gyro: 500,000 x its tonnage. | Yes | Image |
| `cost.jump-jets` | TM p.278 | Standard 200, improved 500, x (number of jump jets) squared x unit tonnage. | Yes | Image |
| `cost.jump-jets.record` | none | A jump jet type whose row was not re-read (UMU, prototypes). | Price from our records; provisional |  |
| `cost.jump-pack` | TO:AUE p.217 | Jump Pack / Drop Pack: 20,000 x its tonnage. | Yes |  |
| `cost.heat-sinks` | TM p.278 | Single with a fusion engine: 2,000 for each heat sink over 10; single with another engine: 2,000 for every one; double: 6,000 for every one. | Yes | Image |
| `cost.heat-sinks.record` | none | A heat sink type whose row was not re-read (laser, compact, prototypes). | Price from our records; provisional |  |
| `cost.power-amplifiers` | TM p.278 | 20,000 x amplifier tonnage. | Yes | Image |
| `cost.armor` | TM p.278; TO:AUE p.217; IO:AE p.215 | Per ton of armor: standard and heavy industrial 10,000, ferro-fibrous 20,000, light ferro-fibrous 15,000, heavy ferro-fibrous 25,000, stealth 50,000, commercial 3,000, industrial 5,000. Hardened 15,000 (TO:AUE). Anti-penetrative ablation 15,000, heat-dissipating 25,000, impact-resistant 20,000, ballistic-reinforced 25,000 (IO:AE). | Yes | Image (TM, IO:AE) |
| `cost.armor.record` | none | An armor whose row was not re-read (laser-reflective, reactive, ferro-lamellor and others). | Price from our records; provisional |  |
| `cost.armor.patchwork` | none | Not re-read. | Our reading; provisional |  |
| `cost.equipment` | TM p.282 | Every weapon and item mounted adds its listed cost to the structural cost. The Mongoose example confirms three rows: Beagle active probe 200,000, medium laser 40,000, small laser 11,250. | Rule yes; item prices from our records; provisional |  |
| `cost.ammo` | TM p.282 | Ammunition need not be bought to find a unit's cost. | Yes: left out of the cost; provisional for the prices |  |
| `cost.armored-components` | TO:AUE p.217 | Armored components: 150,000 for each critical slot. | Yes |  |
| `cost.quadvee-motive` | IO:AE p.215; TM p.278 | QuadVee wheels (750 x engine rating x tonnage) / 75; tracks (500 x engine rating x tonnage) / 75. | Yes | Image |
| `cost.conversion` | IO:AE p.215 table, notes p.218 | LAM conversion: bimodal WSC x 0.65, standard WSC x 0.75; QuadVee conversion WSC x 0.5. WSC is the cost of the unit's weapons, equipment and internal structure. | We take the share of the whole cost so far (owner ruling 2026-10-26); provisional | Image |
| `cost.conversion.homebrew` | none | A fan rule (VTOL LAM). | Provisional |  |
| `cost.subtotal` | TM p.282 | Structural cost + weapon and equipment costs. | Yes |  |
| `cost.omni` | TM p.285 table footnote | Omni Conversion Cost 1.25 for a unit built as an Omni, else 1. | Yes | Image |
| `cost.omni.homebrew` | none | A fan rule (Omni-LAM x 1.75). | Provisional |  |
| `cost.tonnage-multiplier` | TM p.285 table | BattleMechs: x (1 + tonnage / 100). IndustrialMechs: x (1 + tonnage / 400), with no Omni conversion. | Yes (the code tells an IndustrialMech by its Industrial internal structure) | Image |
| `cost.final` | TM p.274, p.285 | Text: no rounding until the end, then up to the nearest 0.01 C-bill. Examples: rounded down to the whole C-bill. | We round to the nearest whole C-bill: Finding 22; provisional |  |
| `cost.final.loaded` | TM p.282 | No rule for a loaded cost. | Our addition; provisional |  |
| `cost.rules-edition` | none | The older editions' cost rules were not read. | Not modelled; provisional. See Issues to file |  |

Environmental Sealing on an IndustrialMech, 225 x unit tonnage (TM p.278), is priced on its equipment item, so it
arrives under `cost.equipment`.

### Issues to file

- Cost under the rules editions before Total Warfare: the older books' own cost rules are not modelled
  (`cost.rules-edition`).

## Worked examples in the books

| Unit | Where | Numbers the book prints |
|---|---|---|
| MON-66 Mongoose | TM p.304 | Armor 89 x 2.5 = 222.5; structure 43 x 1.5 = 64.5; gyro 25 x 0.5 = 12.5; Beagle probe 10; subtotal 309.5; target modifier +4, factor 1.4; defensive rating 433.3. Medium laser 46 (three), small laser 9; heat efficiency 6 + 10 - 2 = 14; weapon heat 10; weapon rating 172; running MP 12, speed factor 1.89; offensive rating 325.08. Sum 758.38; BV 758. |
| TDR-10SE Thunderbolt | BV chapter v4.1 (the sixth printing's extract drops this example; TM p.302 names it) | Armor 200 x 2.5 = 500; structure 104 x 1.5 = 156; gyro 65 x 0.5 = 32.5; Guardian ECM 61; subtotal 749.5; one ton of LRM 10 ammunition in the left torso -15 = 734.5; target modifier +3 with MASC, factor 1.3; defensive rating 954.85. LRM 10 90, its ammunition 11, ER PPC 229 x 1.25 = 286.25, ER medium laser 62 x 1.25 = 77.5 (three); heat efficiency 6 + 24 - 4 = 26; weapon heat 34; order ER PPC (15), LRM 10 (19), ER medium (24), ER medium (29, over), third ER medium at half = 38.75; weapon rating 646; running MP 8 with MASC, jumping MP 4, speed factor 1.63; offensive rating 1,052.98. Sum 2,007.83 (BV 2,008). |
| WI-DM DemolitionMech | TM p.305 | Armor 85 x 2.5 = 212.5; structure 58 x 1.5 x 0.5 = 43.5; gyro 35 x 0.5 = 17.5; no defensive equipment; subtotal 273.5; target modifier +2, factor 1.2; defensive rating 328.2. Rock cutter 6, wrecking ball 8, small laser 9, tonnage 35; heat efficiency 6 + 1 - 2 = 5; weapon rating 58; running MP 5, speed factor 1.00; x 0.9 for no advanced fire control = 52.2. Sum 380.4; BV 380. |
| Phoenix Hawk LAM | IO:AE p.186 | Not yet usable: see Finding 10. |
| MON-66 Mongoose (cost) | TM pp.275, 282, 285 | Cockpit 200,000 + life support 50,000 + sensors 50,000 = 300,000. Musculature 50,000; endo steel 40,000; two sets of arm actuators 11,500; two sets of leg actuators 17,500; 419,000 so far. Engine (200-rated standard fusion) 333,333.333; gyro (2 tons) 600,000; 1,352,333.333. No heat sink or jump jet cost. Five tons of ferro-fibrous armor 100,000; structural cost 1,452,333.333. Beagle active probe 200,000, three medium lasers 120,000, small laser 11,250: 331,250; 1,783,583.333. x (1 + 25 / 100) = 2,229,479.166, rounded down to 2,229,479. |
| Uni CargoMech (cost) | TM pp.275, 282, 285 | A 70-ton quad IndustrialMech. Industrial cockpit 100,000 + 50,000 + 140,000 = 290,000. Musculature 140,000; industrial structure 21,000; environmental sealing 15,750; four legs of actuators 98,000; 564,750. Fuel cell engine (210) 784,000; gyro (3 tons) 900,000; 2,248,750. One single heat sink 2,000; nine tons of commercial armor 27,000; structural cost 2,277,750. Two lift hoists 100,000; 2,377,750. x (1 + 70 / 400) = 2,793,856.25, rounded down to 2,793,856. |
| Goshawk (BV1) | BMR p.145 and BMR(R) p.159, the same figures | Armor 173 x 2 = 346; structure 91 x 1.125 = 102.375; tonnage 55; no defensive equipment; 503.375; no explosive penalty; heat (30 - 22) x 5 = 40; 463.375; jumping gives +3, factor 1.3; defensive rating 602.3875. Large pulse laser 265, three medium pulse lasers 333, targeting computer 598 x 0.2 = 119.6, four machine guns 20 with half a ton of ammunition 0.5, two Streak SRM 2 80 with a ton of ammunition 5; base 823.1; X = 22 x 823.1 / 30 = 603.6066667; Y = 109.7466667; modified rating 713.3533334; running 9 + jumping 6 = 15, speed factor 2.30; offensive rating 1,640.72667; total 2,243.100167; BV 2,243. |

## Findings

Differences between the page and our code, and places where the books disagree with themselves. Nothing here was
changed while reading. Each is decided in the queue (plan Task 11) or by the owner.

1. **Inner Sphere XL engine and CASE in an arm.** TM p.302 counts explosive ammunition in any location of a 'Mech
   with an Inner Sphere XL engine. Our code excuses an arm that has its own CASE. The code comment says this follows
   the MUL, SSW and MegaMek. By the page, such ammunition costs 15 a slot. Shown as `provisional`.
2. **Prototype CASE.** IO:AE p.189 (table, checked on the image): ammunition slots count 8, not 15. Our code treats
   prototype CASE as CASE, so those slots cost nothing. This looks like our bug. FIXED 2026-11-10: in BV2, an
   ammunition slot spared only by prototype CASE now costs 8 (step `bv2.def.explosive.prototype-case`); where CASE
   gives no relief (Inner Sphere XL side torso) it still costs 15. Explosive components behind it are unchanged.
3. **Dark Age armor multipliers.** IO:AE p.185 prints Anti-Penetrative Ablation 1.2, Heat-Dissipating 1.05,
   Impact-Resistant 1, Ballistic-Reinforced 1.2. IO:AE p.190 prints 1.2, 1.1, none, and 1.5. Errata v3.01 is silent.
   Our records use p.190's (heat-dissipating 1.1, ballistic-reinforced 1.5). A question for Catalyst; shown as
   `provisional`. DECIDED 2026-11-10 (owner): keep p.190. Interstellar Operations (2016; errata v1.1, v1.21 silent)
   prints 1.2 / 1.1 / 1 / 1.5 in both its tables, and IO:AE errata v3.01 is silent. Tried p.185 (1.05, 1.2): all
   30 bundled designs with these armors (26 'Mechs, 4 vehicles; MUL and SSW/MegaMek file BVs) then fell 10 to 276
   BV below the published figure, e.g. Hatamoto-Godai HTM-30Z 1,899 to 1,710, Spider VTOLAM 898 to 816. The
   published BVs compute with p.190. Stays `provisional`, as the book still prints both; the 2023 third printing
   (not held) may settle it.
4. **AES on a tripod's legs.** TO:AUE p.192 adds 10 percent of the tonnage for each limb with an AES. Our code adds
   20 percent for a full set of legs unless the 'Mech is a quad (40), so a tripod's three legs give 20, not 30.
   FIXED 2026-11-10: 10 percent for each leg, so a tripod's three give 30 (`getAESBVMultiplier`).
5. **An armored gyro.** TO:AUE p.192 gives 5 points a slot for an item with no BV. Our code uses 5 percent of the
   gyro points for each slot; the comment says this follows MegaMek and SSW. Shown as `provisional`.
6. **UMU and the jump bonus.** TO:AUE p.192 says to calculate a UMU as if it were jump jets. Our code leaves out the
   +1 a jump earns. Shown as `provisional`.
7. **A Superheavy with CASE in the center torso, legs or head.** IO:AE p.188 treats it as a Clan 'Mech there, and a
   Clan 'Mech still pays for those locations. Our code subtracts nothing in any Superheavy location with CASE.
   FIXED 2026-11-18 (IO:AE p.188 read on the page: "treat the Superheavy 'Mech as a Clan 'Mech if the explosive
   components are in a location protected by any form of CASE"): CASE now spares a Superheavy's side torsos and arms
   only; its center torso, legs and head pay as a Clan 'Mech's do. No bundled design's BV moved (4,458 checked).
8. **Heat of the signature systems.** No rule. The code comment says it follows MegaMek, SSW and the MUL. Shown as
   `provisional`.
9. **Radical heat sinks.** IO:AE p.185's text (x 1.4) disagrees with its own example and with the table on p.190
   (heat sinks x 0.4). We follow the table. Shown as `provisional`; a question for Catalyst.
10. **The Phoenix Hawk LAM example** (IO:AE p.186): the extract's columns run together and the printed arithmetic
    does not add up as extracted (a weapon rating of 271 x 3.00 is not 651). Read the page image before using it as
    a test. READ 2026-11-18 (IO:AE 2nd corrected printing p.186, page image): the example is printed with arithmetic
    that does not add up (defensive 472, then 457 x 1.6; weapons and tonnage 123 + 4 x 46 + 50 = 357, printed 271;
    271 x 3.00 printed 651). It cannot be a test; its rules text (TMM from AirMech flank +1, fuel and bomb bay slots
    15 each, heat sink capacity + 9, speed factor from 'Mech running + half AirMech flank) is what we follow.
11. **Dead branches.** `_calcBattleValue` carries camouflage, prototype, standard and improved stealth and mimetic
    cases that are always false for a 'Mech. They are the battle armor rows of the TM p.316 table. Drop them when
    converting; no number changes. DONE (checked 2026-11-18): the battle armor rows are gone; the stealth and
    mimetic armor steps that remain are 'Mech armor types.
12. **Streak heat.** TM p.303 halves the heat of Streak SRMs. Our code halves every weapon flagged Streak (Streak
    LRMs too). Check TO:AUE's rule for Streak LRMs before changing anything.
13. **Stale note.** The Drone Operating System record's notes say its BV rule is not modelled. It is. FIXED
    2026-11-18: the note now gives the rule it follows (TO:AUE p.193).
14. **"Greater than" against "at least".** TM p.304 starts the heat steps when total weapon heat is greater than the
    efficiency; our code starts them when it is equal too. The result is the same: at equality the last weapon is
    the one that reaches the limit and still counts in full.
15. **BV1: CASE and ammunition in an arm (was "Finding A").** The BMR errata p.12 rewrites the arm line: arm
    ammunition is excused only by CASE in the next location inward. BMR(R) p.153 accepts CASE in the arm or the next
    location inward. Our code applies the BMR(R) rule under both editions. Owner ruling 2026-11-10: fix it per
    edition, in BV1 and in the designer's ammunition and CASE check. FIXED 2026-11-11: under master-rules only CASE
    inward excuses an arm (`armCaseInwardOnly` in `BV_RULES`); the step is now `cited`. The designer needed no change:
    both books allow Inner Sphere CASE only in a torso (BMR p.128, BMR(R) p.136) and the designer already refuses an
    arm under every edition, so the difference shows only on a design that arrives with CASE in an arm (an import).
    Clan CASE covers every location, so a Clan or Mixed design is not affected.
16. **BV1: Inner Sphere Grenade Launcher (was "Finding B").** Maximum Tech, Revised p.90 prints BV 1 (page image).
    Our Level 3 table has 4, which matches no page read. Owner ruling 2026-11-10: each Maximum Tech printing gives
    its values to the edition it belongs to; the FASA printing, if held, gives master-rules its own Level 3 table.
    FIXED 2026-11-11. The library holds the FASA corrected second printing (1999). Its pp.90-92 print the same
    tables and rules as the Revised: Grenade Launcher 1 in both the Inner Sphere and the Clan table. The value is
    now 1 under both editions, and master-rules reads its own Level 3 table (`MAX_TECH_FASA`, the same figures,
    cited to the FASA printing). Effect: a design with Level 3 gear now has the same BV1 under master-rules as
    under master-rules-revised, where before master-rules ignored Level 3. The owner recalls a printing with 15:
    it is neither printing held. A first printing (FASA, 1997) is not in the library: see "Sources to ask the
    owner for".
17. **BV1: the Clan XL engine.** Neither Master Rules book names the Clan XL in the rules text (only "XL engine",
    x 0.75). Both print the Goshawk example with 91 x 1.125. Our code follows the example. Shown as `provisional`.
18. **Stale comment.** `_calcBattleValue1` says the movement modifiers are on BMR(R) p.25. The Attack Modifiers
    Table is on p.33 (BMR p.32). Correct the comment when the function is converted (Task 5).
19. **BV1: a slip in the Goshawk example.** BMR p.145 and BMR(R) p.159 print 713.3533334 x 2.30 = 1,640.72667. The
    product is 1,640.71267. The printed total (2,243.100167) carries the slip; the BV rounds to 2,243 either way.
    Our test checks the true product.
20. **Cost: the engine is rounded early.** TM p.274 says no cost is rounded until the end. Our code rounds the engine
    cost to a whole C-bill as soon as it is worked out (the Mongoose's 333,333.333 becomes 333,333). The final cost
    can differ by a C-bill. Not changed while reading.
21. **Cost: the primitive cockpits.** IO:AE p.215 (table, page image) prints Primitive BattleMech Cockpit 100,000 and
    Primitive IndustrialMech Cockpit 50,000. Our records have 200,000 and 100,000. Not a bug: IO:AE p.117 says a
    primitive cockpit is the standard one in every way, costs included, and the record's note says the text is
    followed. The book contradicts itself; shown as `provisional`. A question for Catalyst.
22. **Cost: rounding the final cost.** TM p.274 says to round up to the nearest 0.01 C-bill at the end. The examples
    on p.285 round down to the whole C-bill (2,229,479.166 to 2,229,479; 2,793,856.25 to 2,793,856). Our code rounds
    to the nearest whole C-bill, and its log line shows the figure rounded up, so the log can read one C-bill above
    the cost the app uses. The log line is corrected when the function is converted (Task 7); the rounding rule is
    shown as `provisional`.
23. **Cost: Environmental Sealing (withdrawn).** TM p.278 prices it at 225 x unit tonnage. Our code has it: the
    equipment item is priced that way (a test pins the Uni's 15,750). No finding.

## Queue round 2026-11-18 (cloud session)

Counts at the start: 102 differ, 85 with a verdict, 17 open. Tools used: `src/zz-local/bv-log.test.ts` (one file's
steps) and `src/zz-local/bv-drift.test.ts` (every bundled design and configuration against its built BV; 4,458
checked, 0 moved, before and after this round's rule change). No bundle rebuild was possible in the cloud (the
mordel.net files are local only): the three design corrections below take effect at the next `npm run build:bundled`.

- **Fixed by design correction (the MegaMek file differs from the print).** A correction can now replace a slot
  (`slots` in `DESIGN_CORRECTIONS`).
  - BattleMaster BLR-3M (Rogers): the sheet's second medium laser in each side torso fires to the rear; the file
    mounts them forward. 1,819 -> 1,818 = MUL = sheet (Falcon Incursion PDF p.32).
  - Celerity CLR-03OMM 'Rajah': the readout mounts Spikes in the head too. 272 -> 278 = MUL = XTRO: Royal Fantasy p.6.
  - Warhammer WHM-X7 'The Lich': the readout armors the cockpit and both sensors (the file only the engine), and its
    arms are a Marauder MAD-5R's (75-ton structure, 12 points a side; the file builds a plain 70-ton Warhammer).
    1,785 -> 1,806; MUL and readout 1,807. One point still unexplained.
- **Verdicts written (mul-suspect):** Grand Titan T-IT-N13M (RS: 3145 NTNU sheet prints 2,533 = ours; MUL 2,553),
  Deep Lord RCL-Z1M (RS: Prototypes sheet prints 713 = ours; MUL 715), Temax Cat Ninjabolt TMC-NB (the printed and
  listed 1,475 charge the HVAC/10 1 a slot; TO:AUE p.195 and errata v7.0 count one slot).
- **Checked, still unexplained** (readout or sheet matches the file unless said; the rules MegaMek's BV code applies
  to these items were compared with ours and agree: engine and gyro multipliers, armored components, armor types,
  signature systems' TMM and heat, heat ordering, Radical Heat Sink, Artemis ammunition, explosive components):
  Fennec FEC-5CM 1,498 (MUL 1,445, sheet 1,438; the sheet's Large Re-engineered Laser heat 10 is IO:AE's 9 now, and
  does not move the BV), Thug THG-11ECX (Jose) 1,720 (1,668), Stealth STH-5X 2,155 (MUL 2,240, readout 2,222),
  Schwerer Gustav 1,643 (1,796), Valkyrie VLK-QW5 689 (701), Trebuchet TBT-K7R 1,415 (1,408), Bandersnatch Horus
  1,584 (1,587), Lumberjack LM4/C 316 (291, sheet 291), Patron PTN LoaderMech 73 (97; mordel file, not in the
  cloud), and from earlier rounds 'Gestalt' D2X-G and Skinwalker (Ryoken III-XP) A.
