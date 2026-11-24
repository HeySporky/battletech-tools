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
| `at2` | AeroTech 2 | FASA 1718 (2000), scan |
| `at2r` | AeroTech 2, Revised Edition | FanPro 35011 (2004), scan |

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
| `bv2.def.factor.power-armor` | Best of FW p.14, TM p.304 | Swisher: "+1 to hit" a suit; no BV given. Ours: one more point of TMM, +0.1 to the Defensive Factor. | Provisional (Custom Homebrew) | Power Armor plan Chunk D, 2026-11-17 |
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
| `bv2.final.handheld` | TO:AUE p.193; Max Tech p.92 | A handheld weapon has its own BV: its weapons and ammunition plus its armor factor x 2, added directly to the carrying 'Mech's final BV. | Yes |

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
| `bv1.off.weapon.inferred` | none in the edition; BMR(R) pp.156-158 | No rule: the edition prints no BV for the item, and the record carries an inferred one (`battleValueInferred`). The 1998 Master Rules' Clan ATMs (Maximum Tech p.117, Level 2) carry BMR(R)'s figures back (NGCFells ruling D14, 2026-11-23). | Inferred; provisional | |
| `bv1.off.ammo.inferred` | none in the edition; BMR(R) pp.156-158 | The same for a weapon's ammunition BV per ton (ATM 14, 26, 36, 52). | Inferred; provisional | |
| `bv1.def.equipment.inferred` | none in the edition; BMR(R) pp.156-158 | The same for defensive equipment; no record uses it yet. | Inferred; provisional | |
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
| `bv1.l3.final.handheld` | Max Tech (Revised) p.92 | The handheld weapon's own BV (weapons, ammunition and armor x 2) is added directly to the final BV. | Yes | |

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
| `cost.handheld` | Max Tech p.87; TO:AUE p.219 | Handheld Weapon: 2 x normal cost (the cost table's 2xIC). Read here as twice the cost of its weapons, ammunition, heat sinks and armor. | Our reading |  |
| `cost.heat-sinks` | TM p.278 | Single with a fusion engine: 2,000 for each heat sink over 10; single with another engine: 2,000 for every one; double: 6,000 for every one. | Yes | Image |
| `cost.heat-sinks.record` | none | A heat sink type whose row was not re-read (laser, compact, prototypes). | Price from our records; provisional |  |
| `cost.power-amplifiers` | TM p.278 | 20,000 x amplifier tonnage. | Yes | Image |
| `cost.armor` | TM p.278; TO:AUE p.217; IO:AE p.215 | Per ton of armor: standard and heavy industrial 10,000, ferro-fibrous 20,000, light ferro-fibrous 15,000, heavy ferro-fibrous 25,000, stealth 50,000, commercial 3,000, industrial 5,000. Hardened 15,000 (TO:AUE). Anti-penetrative ablation 15,000, heat-dissipating 25,000, impact-resistant 20,000, ballistic-reinforced 25,000 (IO:AE). | Yes | Image (TM, IO:AE) |
| `cost.armor.record` | none | An armor whose row was not re-read (laser-reflective, reactive, ferro-lamellor and others). | Price from our records; provisional |  |
| `cost.armor.patchwork` | none | Not re-read. | Our reading; provisional |  |
| `cost.equipment` | TM p.282 | Every weapon and item mounted adds its listed cost to the structural cost. The Mongoose example confirms three rows: Beagle active probe 200,000, medium laser 40,000, small laser 11,250. | Rule yes; item prices from our records; provisional |  |
| `cost.ammo` | TM p.282 | Ammunition need not be bought to find a unit's cost. | Yes: left out of the cost; provisional for the prices |  |
| `cost.armored-components` | TO:AUE p.217 | Armored components: 150,000 for each critical slot. | Yes |  |
| `cost.clan-case` | TM pp.210, 292 | A Clan structure presumes CASE in every location that stores ammunition or explosive equipment; 50,000 a location, the one CASE row for both tech bases. | Yes | Tests |
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
- **Rebuilt on the PC 2026-11-19** (`npm run build:bundled`, mordel.net files present): the three corrections took
  effect as read. BattleMaster BLR-3M (Rogers) 1,819 -> 1,818 and Celerity CLR-03OMM 'Rajah' 272 -> 278 now match the
  MUL and join the bundle; The Lich 1,785 -> 1,806 (MUL 1,807). Matched 3,942 -> 3,944, `MECH_MATCHED_FLOOR` raised
  to 3,944. Every other bundled design is unchanged, all six unit types compared design by design (keyed by name,
  model and layout): 3,703 'Mechs kept, 2 added, 0 changed, 0 removed.

## Fighters (read 2026-11-22)

Code: `_calcBattleValue2`, `_calcBattleValue1` and `_calcCost` in `src/classes/aerospace-fighter.ts`; the step tables
are in `src/data/calc-steps-fighter.ts`. Aerospace and conventional fighters only: a Support Vehicle aircraft
(Fixed-Wing, Airship, Satellite) waits for the Support Vehicle round. The TechManual pages were read in the library's
extract of the 2020 Corrected Fourth Printing; the page numbers are the same as in the sixth. The AeroTech 2 pages
were read on the page images and written back to the library's extracts.

### BV2 (TM pp.311-316)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `af.bv2.def.armor` | TM p.311 | Total armor points x 2.5. | Yes | Text |
| `af.bv2.def.armor.modular` | TO:AUE p.93 (not a BV page) | Each modular armor pack adds 10 armor points. | Counted at 2.5 a point as a vehicle's are; provisional: Finding A11 |  |
| `af.bv2.def.structure` | TM p.311 | Structural Integrity x 2. | Yes | Text |
| `af.bv2.def.equipment` | TM pp.311, 317-318 | Add the defensive items (anti-missile systems, ECM, screen launchers: the dagger items in the tables). | Yes | Text |
| `af.bv2.def.equipment.ams-ammo` | TM p.311 | Anti-missile ammunition is added, no more than the system's own BV. | Yes | Text |
| `af.bv2.def.explosive` | TM p.311 | 15 for each type of explosive ammunition, whatever its tonnage, on an Inner Sphere fighter without CASE. | Yes | Text |
| `af.bv2.def.gauss` | TM p.311; TO:AUE p.195 | 1 for each Gauss weapon, the same condition; the TO:AUE table treats an HVAC, the pods and the other marked explosive items as Gauss weapons. | Fixed: Finding A12 | Text |
| `af.bv2.def.clan-case` | TM p.311 | Clan units have CASE: no explosive deduction. | Yes | Text |
| `af.bv2.def.floor` | TM p.311 | The deductions cannot take the rating below 1. | Yes | Text |
| `af.bv2.def.subtotal` | TM p.311 | The sum so far. | Yes | Text |
| `af.bv2.def.rating` | TM pp.311, 316 | x the Unit Type Modifier: aerospace fighter 1.2, conventional fighter 1.1. | Yes | Image (table) |
| `af.bv2.off.weapon` | TM pp.312, 317-318 | Each weapon at its table BV (x 1.2 with Artemis IV, x 1.25 linked to a targeting computer). Aft weapons count half, unless the nose-mounted ones are worth less, by unmodified BV; then the forward-firing ones count half. Weapons past the Heat Efficiency count half again. | Yes, with the wings among the forward-firing weapons: Finding A8 | Text |
| `af.bv2.off.ammo` | TM pp.312, 317-318 | Each ton of ammunition at its BV. | Yes | Text |
| `af.bv2.off.ammo.cap` | TM p.312 | Capped at the unmodified BV of all the weapons it feeds. | Yes | Text |
| `af.bv2.off.equipment` | TM p.312 | Offensive equipment at its BV. | Yes | Text |
| `af.bv2.off.heat.efficiency` | TM p.312 | 6 + the heat sink capacity. | Yes | Text |
| `af.bv2.off.heat.weapons` | TM p.312 | Every weapon's heat, aft ones too: Ultra x 2, rotary x 6, Streak half, one-shot a quarter. | Yes | Text |
| `af.bv2.off.heat.conventional` | TM p.312 | The heat rule names aerospace fighters, Small Craft and DropShips; a conventional fighter tracks no heat. | Yes | Text |
| `af.bv2.off.weapons.total` | TM p.312 | The weapon rating. | Yes | Text |
| `af.bv2.off.speed` | TM pp.313, 316 | Maximum Thrust against the Speed Factor table. | Yes | Image (table) |
| `af.bv2.off.rating` | TM p.313 | (Weapons + ammunition + equipment) x speed factor. | Yes | Text |
| `af.bv2.final.sum` | TM p.313 | Defensive + offensive. | Yes | Text |
| `af.bv2.final.robotic` | IO:AE p.187 | The Smart Robotic Control System's multiplier on the final BV. | Yes | Text |
| `af.bv2.final.drone` | TO:AUE p.193 | Drone operating system: weapons x 0.8 (not ammunition), the final BV x 0.95, no cockpit modifier. | Fixed: Finding A1 | Text |
| `af.bv2.final.equipment` | none | An item whose record multiplies the final BV and whose rule was not read. | Our records; provisional |  |
| `af.bv2.final.round` | TM pp.311, 313 | Round to the nearest whole number. | Yes | Text |
| `af.bv2.final.stores` | TM p.315 | Bombs and other external stores join the force's BV before skill, not the fighter's own. | Yes | Text |

### BV1 (AeroTech 2, and its Revised Edition)

AT2 (FASA, 2000) prints step 1 and the base weapon rating on p.53 and the rest on p.54, with the Master Rules'
equipment tables (BMR pp.142-144) and Speed Factor Table (BMR p.140). AT2R (FanPro, 2004) prints the same
procedure on p.81, with BMR(R) pp.156-158 and p.153. AT2R p.65 adds that Clan units have CASE. The Level 3 items
come from each edition's Maximum Tech (p.90; special ammunition p.91).

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `af.bv1.def.armor` | AT2 p.53; AT2R p.81 | Armor points x 2. | Yes | Image |
| `af.bv1.def.structure` | AT2 p.53; AT2R p.81 | Structural Integrity x 1.5. | Yes | Image |
| `af.bv1.def.fuel` | AT2 p.53; AT2R p.81 | Fuel tonnage added. | Yes | Image |
| `af.bv1.def.equipment` | AT2 p.53; AT2R p.81 | Defensive items (AMS with its ammunition, ECM, screen launchers) at their table BV. | Yes | Image |
| `af.bv1.def.explosive` | AT2 p.53; AT2R p.81 | 20 for each ton of explosive ammunition. | Yes | Image |
| `af.bv1.def.explosive.case` | AT2 p.53; AT2R p.81 | 10 a ton behind CASE. | Yes | Image |
| `af.bv1.def.clan-case` | AT2R p.65 | Clan units are fitted with CASE. AT2 does not say so. | Yes for AT2R; provisional for AT2: Finding A4 | Image |
| `af.bv1.def.heat` | AT2 p.53; AT2R p.81 | Maximum potential heat over the heat sink capacity, x 5, deducted. How the heat is counted is not said. | Our reading; provisional: Finding A5 | Image |
| `af.bv1.def.floor` | none (BMR pp.139-140; BMR(R) pp.152-153 for the 'Mech rule) | No floor is printed. | Our reading; provisional: Finding A6 | Image |
| `af.bv1.def.subtotal` | AT2 p.53; AT2R p.81 | The sum so far. | Yes | Image |
| `af.bv1.def.rating` | AT2 p.53; AT2R p.81 | x the class multiplier: aerospace fighter 1.2, conventional fighter 1.1. | Yes | Image |
| `af.bv1.off.weapon` | AT2 p.53; AT2R p.81 | Every weapon at the edition's table BV; aft weapons at full value. | Yes | Image |
| `af.bv1.off.weapon.unlisted` | none | An item the edition prints no BV for. | Our BV2 figure; provisional |  |
| `af.bv1.l3.item` | MT p.90 | A Level 3 item's BV1. | Yes | Image |
| `af.bv1.l3.ammo.special` | MT p.91 | Special ammunition's BV1. | Yes | Image |
| `af.bv1.off.targeting-computer` | AT2 p.53; BMR p.140 (BMR(R) p.153) | AT2 adds equipment at its BV; the Master Rules give a targeting computer 20 percent of the weapons it links. | Our reading; provisional | Image |
| `af.bv1.off.ammo` | AT2 p.53; AT2R p.81 | Each ton of ammunition at its BV. | Yes | Image |
| `af.bv1.off.ammo.cap` | AT2 p.53; AT2R p.81 | No more than the BV of the weapons it feeds. | Yes | Image |
| `af.bv1.off.base` | AT2 p.53; AT2R p.81 | The base weapon rating: weapons + ammunition + equipment. | Yes | Image |
| `af.bv1.off.heat` | AT2 p.54; AT2R p.81 | Over the heat sinks: X = heat sinks x base / maximum heat, Y = (base - X) / 2, rating X + Y. | Uses the capacity; provisional: Finding A3 | Image |
| `af.bv1.off.bombing` | AT2 p.54; AT2R p.81 | The Bombing Battle Rating is the fighter's tonnage. | Yes | Image |
| `af.bv1.off.speed` | AT2 p.54 (BMR p.140); AT2R p.81 (BMR(R) p.153) | Maximum Thrust against the Speed Factor Table. | Yes | Image |
| `af.bv1.off.rating` | AT2 p.54; AT2R p.81 | (Weapon rating + bombing) x speed factor. | Yes | Image |
| `af.bv1.final.round` | AT2 p.54; AT2R p.81 | Defensive + offensive, rounded. | Yes | Image |

### Cost (TM pp.282-285)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `af.cost.cockpit` | TM p.283 | Aerospace fighter cockpit 200,000. | Yes | Image |
| `af.cost.life-support` | TM p.283 | 50,000. | Yes | Image |
| `af.cost.sensors` | TM p.283 | 2,000 x tonnage (aerospace fighters). | Yes | Image |
| `af.cost.avionics` | TM pp.277, 283 | Conventional fighter avionics 4,000 x the controls' tonnage. | Yes | Image |
| `af.cost.vstol` | TM p.283 | VSTOL equipment 5,000 x its tonnage. | Yes | Image |
| `af.cost.robotic` | IO:AE p.215 | Smart Robotic Control System 5,000 + 10,000 x its tonnage. | Yes | Image |
| `af.cost.structure` | TM p.283 | Structural Integrity: 50,000 a point (aerospace), 4,000 a point (conventional). | Yes | Image |
| `af.cost.thruster` | TM p.283 | Attitude thruster 25,000. | Yes | Image |
| `af.cost.landing-gear` | TM p.283 | 10 x tonnage. | Yes | Image |
| `af.cost.engine` | TM p.283 | The engine type's rate x rating x tonnage / 75. | Yes | Image |
| `af.cost.fuel` | TM p.283 | 200 x fuel tonnage. | Yes | Image |
| `af.cost.armor` | TM p.283 | The armor type's cost x tonnage. | Yes | Image |
| `af.cost.armor.patchwork` | TM p.283; TO:AUE p.189 | Each arc at its own armor's cost per ton. | Our reading; provisional (the patchwork page was not re-read) |  |
| `af.cost.heat-sinks` | TM p.283 | Single 2,000, double 6,000, for every heat sink. | Yes | Image |
| `af.cost.power-amplifiers` | TM p.283 | 20,000 x their tonnage. | Yes | Image |
| `af.cost.structure.total` | TM pp.283-284 | The structural cost. | Yes | Image |
| `af.cost.equipment` | TM p.282 | Every weapon and item adds its listed cost. | Yes; each price from our records, provisional | Text |
| `af.cost.ammo` | TM p.282 | Ammunition need not be bought to find a unit's cost. | Fixed: Finding A2; provisional | Text |
| `af.cost.clan-case` | TM pp.210, 292 | A Clan fighter presumes CASE where it stores ammunition (the fuselage) or explosive equipment (its arc); 50,000 a location, the one CASE row for both tech bases. | Yes | Tests |
| `af.cost.subtotal` | TM pp.282, 284 | Structure + weapons and equipment. | Yes | Text |
| `af.cost.omni` | TM p.285 | OmniFighter x 1.25. | Yes | Text |
| `af.cost.tonnage-multiplier` | TM p.285 | x (1 + tonnage / 200). | Yes | Text |
| `af.cost.final` | TM pp.274, 285 | The final cost; two rounding rules (see the 'Mech Finding 22). | Nearest whole C-bill; provisional | Text |
| `af.cost.final.loaded` | TM p.282 | No such figure in the book: ours adds the ammunition carried. | Ours; provisional |  |

### Worked examples

| Unit | Where | Numbers the book prints |
|---|---|---|
| TRB-D36 Thunderbird | TM p.313 | Armor 224 x 2.5 = 560; SI 10 x 2 = 20; LRM ammunition without CASE -15; 565; x 1.2 = 678. Heat efficiency 31, weapon heat 51; two LRM 20s 181 each, three large lasers 123 each, then past the heat line the three nose medium lasers at half (23) and the two aft ones, the weaker group, at half again (11.5); ammunition 92; weapons 915; Safe Thrust 5, Maximum Thrust 8, speed factor 1.37; offensive 1,253.55. Sum 1,931.55; BV 1,932. Pinned in `fighter-values.test.ts`. |
| 'Mechbuster (cost) | TM pp.277, 284-286 | Avionics 20,000; SI 20,000; thruster 25,000; landing gear 500; engine 208,333.333; fuel 800; armor 35,000; heat sinks 18,000; power amplifiers 10,000; structure 337,633.333. Three medium lasers 120,000; 457,633.333. x (1 + 50 / 200) = 572,041.666, printed as 572,042. AT2R p.123 lists the 'MechBuster (Laser Variant) at 576,542 and BV 378. |
| A 50-ton fighter (BV1, worked by hand) | AT2 pp.53-54; AT2R p.81 | No example is printed. Our hand-worked check, the same under both books: armor 60 x 2 = 120, SI 5 x 1.5 = 7.5, fuel 5; one ton of LRM ammunition -20; heat (17 - 10) x 5 = -35; 77.5; x 1.2 = 93. PPC 176, LRM 10 90, aft medium laser 46, ammunition 11: base 323; X = 10 x 323 / 17 = 190, Y = (323 - 190) / 2 = 66.5: 256.5; bombing 50; Maximum Thrust 8, speed factor 1.37; offensive 419.905; BV 513. |

### Fighter findings

- **A1. Drone operating system (fixed).** TO:AUE p.193 cuts each weapon's BV by 0.2 (ammunition not) and the final
  BV by 0.05. Our code took only the final 0.95. Now both apply (`af.bv2.final.drone`, and the weapon step cites the
  page). No bundled design changes: the one MegaMek fighter with a drone system (Bullet Suicide Drone) is not
  bundled yet (its booby trap does not import).
- **A2. Ammunition in the cost (fixed).** TM p.282: ammunition need not be bought to find the cost, the same rule the
  'Mech cost follows. Our fighter cost added it. It is now left out and shown as the loaded cost
  (`af.cost.final.loaded`). The bundled fighters' costs drop by their ammunition; the 'Mechbuster's 572,042 is the
  book's. AT2R p.123's 576,542 is 4,500 higher: not explained yet.
- **A3. AT2's "total heat sinks".** The BV1 heat formula names the total heat sinks; the condition before it and the
  'Mech rule it follows use the capacity. We use the capacity: the same for single heat sinks, twice the count for
  double ones.
- **A4. Clan CASE in AT2.** Only AT2R (p.65) says Clan units have CASE. We give it under both books.
- **A5. Maximum heat in BV1.** AT2 names the maximum potential Heat Points but not how they are counted. We add every
  weapon's aerospace heat, aft ones too.
- **A6. No floor in BV1.** AT2 sets none; we stop the deductions at 1, as the 'Mech rule does.
- **A7. Stealth armor.** TO:AUE p.193 adds 0.3 to the armor multiplier of a fighter with stealth armor. The app has no
  fighter stealth armor yet; MegaMek files that carry it are left out of the bundle (an import gap, not a BV one).
- **A8. The forward-firing group (reading).** TM p.312 compares "nose-mounted" weapons with the aft ones and then
  halves "the forward-firing weapons". A fighter's wing weapons fire forward, so we weigh the nose and wings together
  against the aft, as the MUL and MegaMek do. We had weighed the nose alone. Five bundled fighters now match (Slayer
  SL-15C 1,379 -> 1,321 = MUL).
- **A9. Clan LRM 20 heat (fixed).** Our Clan LRM 20 records (plain, Artemis V, I-OS) carried an aerospace heat of 4,
  the one-shot 5. TW p.304 prints 6 in the one heat column ground and aerospace units share (read on the page image,
  written back to the library's extract). Kirghiz B, Turk C and Ogotai B now match the MUL.
- **A10. Ammunition bound to its launcher (fixed).** One kind of round feeds launchers of several sizes (MRM, LRM). A
  bin now keeps the launcher its file line names, and is saved with it. The ammunition is valued at that launcher's
  ammunition BV, and each launcher's round counts as its own type of explosive ammunition, since TM pp.317-318 give
  each its own row. We had booked every bin to the first launcher. Tatsu MIK-O 1,502 -> 1,541 = MUL; Typhoon TFN-3M
  1,623 -> MegaMek's 1,638.
- **A11. Modular armor (provisional).** Each pack's 10 points (TO:AUE p.93) were left out. They count at 2.5 a point,
  as a vehicle's do, and as MegaMek and the MUL count them; no page that says so for fighters was read. Issedone C
  635 -> MegaMek's 725.
- **A12. Items treated as Gauss weapons (fixed).** The fighter took 1 point only for weapons with Gauss in the name.
  The TO:AUE p.195 table treats an HVAC, the M-Pod, B-Pod and Chaff Pod and the other marked explosive items as Gauss
  weapons, as our 'Mech rules already read it. MegaMek and the MUL leave a fighter's Chaff Pods uncounted, as they do a
  'Mech's: Shikra SKR-4N is 2 under them now and has a verdict, as the Ti Ts'ang TSG-10L does.
- **A13. Machine gun arrays (fixed).** An array was carried at no value. It is worth 0.67 x the machine guns it links
  in its arc (TM pp.228, 317), as on a 'Mech or vehicle. Turk E 1,769 -> MegaMek's 1,811.
- **A14. A conventional fighter's BV1 heat (fixed, from the review).** AeroTech 2's errata (the p.46 change) has a
  conventional fighter make no heat with its non-energy weapons. BV1 charged it anyway; it now counts heat as
  `getWeaponHeat` does. Also from the review: a Support Vehicle aircraft is its own Battle Value unit type
  (`support-aircraft`, BV2 only), so a force under a Master Rules edition no longer shows its BV2 as a BV1 figure or
  reads the Master Rules skill table for it.
- **A15. Clan CASE not paid for (open).** TM p.311 treats a Clan design that did not pay for CASE as Inner Sphere.
  We have no way to mark that; a Clan fighter always has CASE here.
- **A16. AT2R's worked Eisensturm (open).** AT2R prints a worked Eisensturm that takes 20 a ton off for its 4 tons
  of Gauss ammunition. Our BV1 records do not mark Gauss ammunition explosive, so we come out near 2,615 against the
  printed 2,519. Read the page and rule whether the example or our records are right; add it as a test.
- **A17. OmniFighter base cost (open).** TM p.282 says an OmniFighter's base cost leaves out its pod-mounted items.
  Our cost (old and new) prices every item, then x 1.25. The `af.cost.equipment` step is provisional already.
- **Import gaps** (files left out, for the queue): small and primitive cockpits; reflective, ferro-lamellor and
  stealth armor; XXL engines; half-ton ammunition bins; cargo bays; laser insulators; Nova CEWS; SRCS in files; the
  PPC capacitor on Clan fighters; ICE conventional fighters with no heat sinks.

### Fighter queue round (2026-11-22)

Counts at the start: 300 matched, 138 differ. MegaMek's own unit export (its BV calculator, run on the same files)
was the check: for 115 of the 138 it already gave our value. After A8-A13: 309 matched, 129 differ.

- **Verdicts (125):** 124 where MegaMek gives the file our value, so the list differs from both (the file was not
  checked against the print); 1 Chaff Pod case (A12).
- **Open (4):** Shikra SKR-4M (ours 2,647, MegaMek 2,649 with its Chaff Pods uncounted, list 2,849); Shilone
  SL-17X (1,931; 1,934; 1,933); Sternensturm STM-OA (1,693; 1,692; 1,676: the PPC Capacitor now counts 1); Suzaku
  SU-14 (2,218; 2,216; 1,940). Each is within 3 of MegaMek and far from the list.
- **Not compared:** 102 files the import refuses (the import gaps above) and 8 with no MUL entry.

## Infantry (read 2026-11-23)

Code: `_calcBattleValue`, the BV1 table lookup and `_calcCost` in `src/classes/infantry-platoon.ts`; the step tables are in
`src/data/calc-steps-infantry.ts`. Conventional infantry only (battle armor has its own round). The TechManual pages
were read in the library's extract of the 2020 Corrected Fourth Printing and BV v4.1; the TO:AUE, Master Rules and
Maximum Tech pages were read on the page images (TO:AUE 7th printing 2024; BMR 1998; BMR(R); Maximum Tech 1999 and
Revised) and written back to the library's extracts. The full notes are in
`.superpowers/sdd/2026-11-23-infantry-bundle-and-cited-bv/progress.md`, "Readings".

### BV2 (TM pp.309-310, 314-319; TO:AUE pp.191, 193)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `ci.bv2.def.troopers` | TM p.309 | Troopers x 1.5. | Yes | Worked p.310: 21 x 1.5 = 31.5 |
| `ci.bv2.def.divisor` | TO:AUE p.191 | Sum of damage divisors (armor p.129) x 1.5, x Defensive Factor, x troopers. | Yes | Text |
| `ci.bv2.def.divisor.beast` | TO:AUE pp.191, 129, 107 | The mount's damage divisor joins the sum: (rider's divisor + mount's) x 1.5, an unarmored rider counting the 1 of Clothing, Fatigues/Civilian/Non-Armored (p.129). | Yes (NGCFells 2026-11-23: the sum, as printed; MegaMek multiplies). Play still divides by the armor's and the mount's divisors in turn (p.108). Beast Infantry (Aerial) 43 = MUL | Test |
| `ci.bv2.def.divisor.implant` | TO:AUE p.191, IO:AE p.74 | Dermal armor myomer implants add +1 to a platoon's damage divisor. | Yes | Text |
| `ci.bv2.def.factor` | TM pp.309, 315 | Defensive Factor from the highest target modifier, jump included. | Yes | Worked p.310: +2 -> 1.2 |
| `ci.bv2.def.factor.implant` | TM p.315, IO:AE pp.184-185 | Dermal camouflage counts +3 standing still and powered flight wings their VTOL movement, when higher than the ground modifier. | Yes | Test |
| `ci.bv2.def.factor.vtol` | TM p.315, TW p.117 | VTOL movement takes the "Jumped/Airborne (non-aerospace units)" +1 (TW p.117), which the Defensive Factors Table counts as any VTOL movement modifier. | Yes (NGCFells 2026-11-23 confirmed: counted as jumping) | Test |
| `ci.bv2.def.augmentation` | IO:AE p.184 | The pheromone gas effuser adds 0.05 a trooper before the Defensive Factor. | Yes | Test |
| `ci.bv2.def.factor.stealth` | TO:AUE p.191 | DEST +0.2, Sneak Camo +0.2, Sneak IR +0.2, Sneak ECM +0.1, cumulative. | Check values | Image |
| `ci.bv2.def.factor.beast` | TO:AUE p.191 | Very Large -0.1, Monstrous -0.2. | Yes | Image |
| `ci.bv2.def.rating` | TM p.309, TO:AUE p.191 | The Defensive Battle Rating. | Yes | Worked p.310: 37.8 |
| `ci.bv2.off.primary` | TM pp.309, 319 | Each individual weapon's BV. | Yes | Worked p.310: 18 x 1.79 |
| `ci.bv2.off.secondary` | TM pp.309, 319 | Each support weapon's BV. | Yes | Worked p.310 prints 3 x 17.34 = 52.02, the weapon table p.319 prints 17.35 (ours 52.05; rating 168.54 against 168.48; BV 168 either way) |
| `ci.bv2.off.anti-mech` | TM p.309 | Anti-'Mech capable: add the weapons again. | Yes | Worked p.310: 168.48 |
| `ci.bv2.off.anti-mech.beast` | TM p.309, TO:AUE pp.107-108 | The same for a platoon on Very Large creatures: the Creature Size Table bars Swarm and allows Leg attacks; the text of p.108 bars Leg attacks instead. | Yes: the table is followed (NGCFells 2026-11-23), the p.108 text quoted in the step, the notes and play | Text |
| `ci.bv2.off.primary.inferred` | TM pp.309, 319 | A weapon with no row on p.319 and no printed BV in its source (Gungnir, Snub-Nose, the Custom Homebrew Leiting-23): the inferred figure its record gives. | Provisional | Test |
| `ci.bv2.off.secondary.inferred` | TM pp.309, 319 | The same for a support weapon. | Provisional | Test |
| `ci.bv2.off.anti-mech.archaic` | TM p.309 | The weapons added again, archaic weapons left out (NGCFells 2026-11-23; MUL Otomo Guard 59, MegaMek). The page adds all of them. | Provisional (ruling) | Test |
| `ci.bv2.off.field-guns` | TO:AUE p.191, TM pp.317-318 | Add the BV of all field guns and field artillery. | Yes | Image |
| `ci.bv2.off.field-guns.ammo` | TO:AUE p.191 | And their ammunition. | Provisional: held to the guns' BV, as for any unit's ammunition (owner call) | Image |
| `ci.bv2.off.anti-mech.tool` | IO:AE p.191 | Grappler lines and climbing claws multiply the Anti-'Mech Battle Rating by 1.2. | Yes | Test |
| `ci.bv2.off.anti-mech.tool.archaic` | TM p.309, IO:AE p.191 | The same with archaic weapons left out (the archaic ruling). | Provisional (ruling) | Test |
| `ci.bv2.off.augmentation` | IO:AE pp.184-186 | Toxin gas effuser 0.23, triple-strength myomer 0.1, suicide implants 0.12, tail 0.2 and the prosthetic items' own values, each a trooper, added to the weapons. | Yes | Tests |
| `ci.bv2.off.disposable` | TO:AUE p.191 | Disposable weapons x 0.2. | Not modeled: a platoon has no disposable weapon of its own (the file field is refused on import); the step is never recorded | Image |
| `ci.bv2.off.speed` | TM pp.309, 316 | Fastest movement mode against the Speed Factor Table. | Yes | Text |
| `ci.bv2.off.rating` | TM p.309 | Weapon rating x Speed Factor. | Yes | Text |
| `ci.bv2.final.sum` | TM p.309 | Defensive + Offensive. | Yes | Text |
| `ci.bv2.final.type-modifier` | TO:AUE pp.191, 193 | x the Unit Type Modifier: Combat Engineers +0.1, Marines +0.3, Mountain +0.2, Paratroops +0.1, SCUBA +0.1, XCT +0.1. | Yes | Image |
| `ci.bv2.final.skill` | IO:AE pp.184, 191 | The pain shunt, a communications implant and the triple-core processor each take 1 off the Anti-'Mech skill, sensory implants 1 off Gunnery, for the skill multiplier. | Yes | Tests |
| `ci.bv2.final.round` | TM p.309 | Round to the nearest whole number, .5 up. | Yes | Text |

### BV1 (BMR p.142 with errata, BMR(R) p.155, Maximum Tech p.93)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `ci.bv1.table` | BMR p.142, BMR(R) p.155 | Platoon BV by motive (foot, jump, motorized) and weapon (flamer, laser, machine gun, rifle, SRM), plus an anti-'Mech trained column. | Yes | Image |
| `ci.bv1.table.lrm` | BMR p.142, BMR errata, Maximum Tech p.93 | The BMR printed LRM lines (56, 87, 75); the errata cuts them; Maximum Tech's LRM Infantry table gives the same numbers as Level 3. | Yes | Image |
| `ci.bv1.table.level3` | Maximum Tech p.93 | Motorized engineers 42 / 63. | Yes | Image |
| `ci.bv1.size` | BMR p.142, BMR(R) p.156 | Adjust the table BV proportionally for nonstandard size (written for battle armor). | Provisional | Image |
| `ci.bv1.equipment` | Maximum Tech p.93 | Sneak suits +1, ECM suits +1, heavy armor +14 (not anti-'Mech), Narc +1 a launcher, paratroops +1, submersible +1, TAG +1. | Yes; TAG +1 also for a TAG Troops platoon, once (NGCFells 2026-11-23) | Image |
| `ci.bv1.field-guns` | Maximum Tech p.93 | Each field gun's weapon BV from the Master Rules tables, no ammunition. | Yes | Image |
| `ci.bv1.field-guns.unlisted` | Maximum Tech p.93 | A gun the Master Rules tables do not print (a rifle, a rotary or hyper-velocity autocannon): its BV2 figure, as the 'Mech and fighter BV1 do. | Provisional | |
| `ci.bv1.submersible` | Maximum Tech pp.42, 93 | Submersible infantry are foot infantry equipped to operate underwater (p.42): a standard SCUBA platoon reads the foot line, +1 (p.93). | Yes | Text |
| `ci.bv1.specialty` | Maximum Tech p.93 | No line or equipment row for marines, mountain troops, XCT troops, paramedics, TAG troops, or foot and jump combat engineers. | Provisional: the weapon line is kept (NGCFells 2026-11-23); a TAG Troops platoon also takes the TAG equipment +1 | Test |
| `ci.bv1.map` | BMR p.142, BMR(R) p.155, Maximum Tech p.93 | The books name six weapon classes and some unit equipment; our weapons and armor are read onto them (a secondary of the MG, flamer, SRM, LRM or laser class names the platoon, else the primary; Sneak, Camo = camouflage sneak suit, Sneak, ECM = ECM suit, encumbering armor = heavy armor). | Provisional (owner call) | |
| `ci.bv1.motive` | BMR p.142, Maximum Tech p.93 | No line for motorized or mechanized SCUBA, VTOL or beast-mounted platoons. | Source missing | Image |
| `ci.bv1.mechanized` | BMR p.142, Maximum Tech p.93 | No line for mechanized infantry. | Source missing; no BV1 shown (NGCFells 2026-11-23 confirmed) | Image |
| `ci.bv1.weapon-class` | BMR p.142, Maximum Tech p.93 | No line for other weapons. | Source missing | Image |
| `ci.bv1.final.round` | BMR p.142 | The table value (rounded as printed). | Yes | Image |

### Cost (TM pp.276, 282, 298-301; Maximum Tech p.40; TO:AUE p.225)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `ci.cost.trooper` | TM pp.282, 276, 298-301 | Base Trooper Cost = 2,000 x square root of the weapon cost (p.282 table head); worked laser rifle 2,000 x sqrt 1,250 = 70,710.678 (p.276). | Yes | Image p.282; worked p.276 |
| `ci.cost.tag-troopers` | TO:AUE p.225, Maximum Tech p.40 | No row for TAG Troops: priced as a secondary-weapon trooper with a 50,000 C-bill TAG. | Provisional: the book is silent; NGCFells confirmed the pricing 2026-11-23 | |
| `ci.cost.secondary` | TM p.276 | One weapon type per platoon; each trooper priced by the weapon fired, as MegaMek does. | Provisional | |
| `ci.cost.armor` | TO:AUE p.129 | Armor kit cost per trooper. | Provisional: the kit's cost page has not been re-read | |
| `ci.cost.motive` | TM p.282 | Foot x 1.0, Motorized x 1.6, Jump x 2.6, Mechanized Hover/Wheeled/Tracked x 3.2 (the extract had the column a row off). | Yes | Image |
| `ci.cost.motive.vtol` | TO:AUE p.225 | Microlite TC x 4, micro-copter TC x 4.5, on the Total Unit Cost ("applied to final calculations"). | Yes: applied last, with the specialties (NGCFells 2026-11-23) | Image |
| `ci.cost.motive.scuba-mech` | TM p.282, TO:AUE p.225 | No row for Mechanized SCUBA: the mechanized multiplier x 3.2, as MegaMek. | Provisional: the book is silent; NGCFells confirmed 2026-11-23 | |
| `ci.cost.augmentation` | IO:AE pp.71, 179, 217 | Each implant's price for each trooper that carries it, added to the final cost; x 2 where the faction does not field it, x 2 again where extinct. | Yes | Tests |
| `ci.cost.anti-mech` | TM p.282 | Anti-'Mech Training and Equipment x 5.0. | Yes | Image |
| `ci.cost.specialization` | TO:AUE p.225 | Combat Engineers x 5, Marines x 3, Mountain x 2, Paratroops x 3, SCUBA x 2 (x 2.5 motorized), XCT x 1.5, each "TC x": the Total Unit Cost, "applied to final calculations". | Yes: after field guns, beasts, augmentation, Narc and TAG, before the paramedics (NGCFells 2026-11-23; was before the add-ons, as MegaMek) | Image |
| `ci.cost.narc` | Maximum Tech p.40 | Each Narc launcher adds 10,000 C-bills (1999 printing; Revised the same). | Yes | Text |
| `ci.cost.tag` | Maximum Tech p.40 | TAG equipment adds 50,000 C-bills. | Yes | Text |
| `ci.cost.field-guns` | TO:AUE p.225 | As the weapon. | Yes | Image |
| `ci.cost.beast` | TO:AUE p.225 | 5,000 x total unit tonnage. | Yes | Image |
| `ci.cost.paramedics` | TO:AUE p.225 | 0.375 x total unit cost per medic, added after the rest. | Yes (NGCFells 2026-11-23 confirmed the literal reading) | Image |
| `ci.cost.unpriced` | TM pp.298-301 | A fielded weapon the cost table does not price: no cost, said as a step. | Source missing | Test |
| `ci.cost.final` | TM p.276 | Per-trooper cost x motive x troopers, rounded down: Darrell's 28 motorized laser riflemen 3,167,838.38 to 3,167,838. | Yes | Worked p.276 (test) |

### Rulings of 2026-11-23 that move no step (NGCFells)

- Encumbering armor (TO:AUE p.130, "reduce the platoon's mobility by 1 MP (to a minimum of 1 MP per turn)"): off ground
  and VTOL MP, beast riders included (p.107 exempts only support weapons on Very Large and Monstrous creatures from MP
  loss); jump MP stays (the earlier ruling, Royal Gurkha 115 = MUL). The Speed Factor and Defensive Factor read the MP.
- Large creature riders carry no support weapons (p.107): the Support type of the Conventional Infantry Weapons Table
  (TM p.148, "a type (Melee, Standard or Support)"), whatever the crew.
- Beast rules are not gated by the 2008 Tactical Operations printing (its tables match; two sentences of the 7th
  printing are missing there).
- Confirmed as built: VTOL infantry counted as jumping for the target modifier; the SLDF Infantry Kit left out (no row);
  field guns in Alpha Strike by MegaMek's conversion, marked inferred; no BV1 for mechanized infantry.
- Clan field gun points whose file names an Inner Sphere gun are built as mixed technology on the Clan chassis (TO:AUE
  p.189), as the Clan LRM points. No book read lets a straight Clan (Solahma) platoon field Inner Sphere gear without the
  mixed technology option.

## ProtoMechs (read 2026-11-23)

Code: `_calcBattleValue`, `_calcBattleValue1` and `_calcCost` in `src/classes/protomech.ts`; the step tables are in
`src/data/calc-steps-protomech.ts`; the ProtoMech Missile Weapons BV table of the Master Rules, Revised Edition is
`PROTOMECH_BV1_MISSILES` in `src/data/protomech-construction.ts`. The TechManual pages were read in the library's extract of
the 2020 Corrected Fourth Printing and, where the extract is garbled, on the page image (p.318, the Clan Weapons and
Equipment BV Table); the TO:AUE (pp.196, 197), IO:AE (p.190), TRO: Prototypes (p.91) and TRO 3060 (FanPro, p.198) pages were
read on the page images and written back to the library's extracts. The full notes are in
`.superpowers/sdd/2026-11-23-protomechs-bundle-and-cited-bv/progress.md`.

### BV2 (TM pp.306-307, 316-318; TO:AUE pp.196-197; IO:AE p.190)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `pm.bv2.def.armor`, `.structure` | TM p.306 | Total Armor Factor x 2.5, total Internal Structure points x 1.5 (the Delphyne-2: 40 x 2.5 = 100, 20 x 1.5 = 30). | Yes | Text |
| `pm.bv2.def.equipment` | TM p.306 | Defensive equipment is active probes, anti-missile systems (with their ammunition, up to the systems' own BV) and ECM suites, the dagger items of the tables. | Yes | Text |
| `pm.bv2.def.factor` | TM pp.306, 316 | The highest potential target modifier, including the bonus for jump capability and for a myomer booster; Defensive Factors Table p.316; ProtoMechs add 0.1 (Defensive Factor Modifier Table). The Delphyne-2: +3, 1.3 + 0.1 = 1.4. | Yes | Text, image of p.316 |
| `pm.bv2.off.weapon`, `.ammo` | TM pp.306, 317-318 | Each weapon's BV and its ammunition: kilograms / 1,000 x the BV of a ton; the ammunition never counts for more than the weapon (the Delphyne-2's SRM 3: 600 kg x 4 = 2.4). | Yes | Text |
| `pm.bv2.off.weapon.missile` | TM p.318 | A ProtoMech launcher of any tube count is worth the Clan table's LRM, SRM or Streak SRM of that size. The corrected printings print LRM-2 24 (ammunition 3) and LRM-3 34 (4); the 2007 first printing printed 25 and 35 (5), as the Master Rules, Revised Edition did. | Yes (corrected) | Image of p.318; 2007 extract |
| `pm.bv2.off.weapon.protomech` | TO:AUE p.196 | ProtoMech AC/2 34 (ammunition 4), AC/4 49 (6); p.197: AC/8 66 (8), melee weapon Dmg x 1.25. Improved Heavy Laser (Small) 19, (Medium) 93, (Large) 296; Chemical Laser 7, 37, 99 (1, 5, 12). | Yes | Images |
| `pm.bv2.off.edp`, `.weapon` (clamp, Fusillade) | IO:AE p.190 | Electric Discharge ProtoMech Armor 32 (counted as a weapon; armor points counted as standard armor), Magnetic Clamp System 1, Fusillade Launcher 11, ProtoMech Quad Melee Weapon System (Dmg x 1.25), Extended Jump Jet System (BV as normal for its Running and Jumping MP), Glider ProtoMechs (WiGE Flank MP for the Speed Factor), ProtoMech Interface Cockpit 0. | Yes | Image |
| `pm.bv2.off.weapon.quad-melee` | IO:AE p.190 | "Dmg x 1.25", not saying which damage. The whole Frenzy damage with the system's added 2 a 5 tons is the only reading that gives the Basilisk (Quad) its printed 258 (WoR p.210); NGCFells ruled it 2026-11-02. | Yes, provisional | Image (WoR p.210) |
| `pm.bv2.off.weapon.rear` | TM p.303 | TM p.306 names no rear arc for a ProtoMech; the 'Mech rule (the weaker arc counts half) is used, as MegaMek does. | Provisional | Text |
| `pm.bv2.off.speed` | TM pp.306, 316 | Running MP + half the Jumping MP (rounded up), +1 for a myomer booster; Speed Factor Table p.316. The booster's boosted Running MP (twice the Walking MP, TM p.85) counts only toward the Defensive Factor. | Yes, provisional (the list differs, see Findings) | Text |
| `pm.bv2.final.sum` | TM p.306 | Add the two ratings, round to the nearest whole number (.5 up). The Delphyne-2: 182 + 134 = 316 (worked, p.307). | Yes | Test |
| `pm.bv2.final.handheld`, `pm.bv2.final.with-handheld` | TO:AUE pp.193, 128 | A handheld weapon has its own BV (its weapons and ammunition plus its armor factor x 2), added directly to the final BV after rounding. TO:AUE p.193 prints it for a BattleMech carrier; the same figure is used for a ProtoMech, which p.128 lets carry one and prints no other BV for. | Inferred | Test |

### BV1 (BMR(R) pp.153-156; TRO 3060 (FanPro) p.195)

BMR(R) p.155 prints "Calculating ProtoMech BV" as the vehicle procedure of pp.154-155 with three changes; TRO 3060 (FanPro
2003, p.195) prints the same changes and the eight ProtoMechs' Battle Values under them.

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `pm.bv1.def.*` | BMR(R) pp.153-155 | Total Armor Factor + Internal Structure ÷ 2 (a turret or rotor's counted too; a ProtoMech's main gun) + the BV of defensive equipment (antimissile systems with their ammunition, ECM suites; all else is offensive, so a probe is offensive), "Add ProtoMech Tonnage to Base Defensive Battle Rating", no Vehicle Type Modifier, x the Defensive Movement Factor (+0 to +5: 1.0 to 1.5) +0.1. | Yes | Text, worked units |
| `pm.bv1.off.weapon` | BMR(R) pp.154, 156-158 | The Clan table's BV for each weapon, rear weapons half. | Yes | Tables as entered for 'Mechs |
| `pm.bv1.off.weapon.missile` | BMR(R) p.155 | The ProtoMech Missile Weapons BV table, for a launcher of a non-standard number of tubes: LRM 1 17 (2), 2 25 (3), 3 35 (5), 4 46 (6), 6 69 (9), 7 92 (12), 8 93 (12), 9 95 (12), 11 139 (18), 12 141 (18), 13 161 (20), 14 163 (21), 16 214 (27), 17 215 (27), 18 217 (27), 19 218 (28); SRM 1 15 (2), 3 30 (4), 5 58 (8); Streak SRM 1 20 (3), 3 59 (8), 5 99 (13). | Yes (SRM 5 corrected) | Text of p.155 |
| `pm.bv1.off.weapon.srm5` | BMR(R) p.155; TRO 3060 (FanPro) p.195; TM errata v2.2 p.318 | BMR(R) prints the SRM 5 as 58 with 8 a ton; TRO 3060 (FanPro) prints 47 and 6, and the TechManual errata corrects the Clan table's SRM-5 from 58/12 and 8 to 47/9 and 6. 47 and 6 are used. | Provisional | Text |
| `pm.bv1.off.speed` | BMR(R) pp.153-154 | A vehicle's Speed Factor is Flanking MP + VTOL MP; BMR(R) names no ProtoMech change. A ProtoMech's Jumping MP is read as a 'Mech's (Running MP + Jumping MP), which the TRO 3060 BVs need. | Provisional | Worked units |

### Cost (TM pp.279, 282, 285; IO:AE p.215)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `pm.cost.cockpit` ... `pm.cost.armor` | TM p.279 | ProtoMech Structural Costs: Cockpit 500,000; Life Support 75,000; Sensors, Musculature 2,000 x tonnage; Internal Structure 400 x tonnage; Arm actuator 180 and Legs 540 x tonnage; Engine 5,000 x rating x tonnage / 75; Jump Jets 200 x jets² x tonnage; Myomer Booster 1,000 x rating x booster tonnage; Heat Sinks 2,000 each; Armor 625 a point. | Yes | Text, with the shifted columns checked against TRO 3060 (FanPro) p.195 and the Delphyne-2's 741,700 |
| `pm.cost.structure.ultraheavy` ... `.cockpit.ultraheavy` | IO:AE p.215 | Expanded ProtoMech Components: Ultraheavy Structure 400 x TT, Ultraheavy Cockpit 800,000, Quadruped Structure 500 x TT, Glider Structure 600 x TT. | Yes | Image |
| `pm.cost.weapons.tubes` | TM p.282 | ProtoMechs buy a non-standard launcher by the tube, 10,000 a tube (the Delphyne-2's SRM 3: 30,000). | Yes | Text |
| `pm.cost.handheld` | TO:AUE p.219 | Handheld Weapon: 2 x the cost of its weapons, ammunition, heat sinks and armor, added before the tonnage multiplier. | Our reading | Test |
| `pm.cost.final` | TM p.285 | ProtoMechs: (structural cost + weapon and equipment costs) x (1 + tonnage / 100). The Delphyne-2: 821,700 x 1.09. | Yes | Test |

Rows of equipment, extended and UMU jump jets, the jump pack and EDP armor are priced "from our records", provisional, until their rows are read.

### Worked examples

- Delphyne-2 (TM p.307): 316, every figure; cost 741,700 + 80,000 x 1.09 (TM pp.279-285). Tests.
- TRO 3060 (FanPro, 2003) pp.197-204 print the BV1 of the Harpy 28, Siren 52, Satyr 98, Centaur 140, Hydra 139, Roc 284, Gorgon 213
  and Minotaur 367, each reproduced. The CGL 2010 printing's BV2 of the same eight (56, 86, 133, 192, 209, 336, 295, 424) is reproduced
  but for the Centaur (190 against 192, below).
- Svartalfa Ultra (TRO: Prototypes p.91): 540 with the armor the page prints (65 points). Test.
- WoR pp.210-213: Basilisk (Quad) 258 and Boggart 538 are reproduced; the Hobgoblin prints 271 where ours is 271.72 (272, as the list has it).
  The Sprite (4 LRM 5, p.213) prints 589 where ours, MegaMek's and the list's value is 622 (4 x LRM 5 at 55, ammunition 14); the print would need
  an LRM 5 at 49. Not explained: a book printing that none of the three calculators reproduces, noted for NGCFells.

### Findings

1. **LRM 3 (and LRM 2) at the first printing's figures.** The 2007 TechManual and BMR(R) p.155 print the ProtoMech LRM 3 at 35 with 5 a
   ton; TRO 3060 and TRO 3075 worked their Battle Values with them, and the Master Unit List carries them: Centaur 192 (TRO 3060 CGL
   p.195), Basilisk 319 (TRO 3075 p.161), Procyon 3 163, Triton 2 274. The corrected TechManual prints 34 and 4 (p.318), so ours is 190, 318,
   161 and 272. Patching the table to 35 and 5 closes all four exactly and moves none of the other 64 matching designs. Filed as
   mul-suspect, with the corrected printing's page. (The Hippogriff's two LRM 2s match the list at 24 and 3: later books use the corrected table.)
2. **Myomer booster.** TM p.306: "Add 1 to the result if the ProtoMech is equipped with a myomer booster" to the Speed Factor's MP.
   The list (and MegaMek) rate the Siren 4 at the boosted Running MP, 20 (88; ours 84) and the Centaur 4 at 12 (list 228, MegaMek 227,
   ours 214), and the Basilisk (Quad) B at neither (list 218; ours 223 with +1, MegaMek 234). The book is followed; filed as mul-suspect.
3. **Magnetic Clamp System.** IO:AE p.190 prints Item BV 1. The list's Procyon Z and Roc Z equal ours less that 1 x the Speed Factor
   (180, 221). The Centaur Z and Minotaur Z are still 2 and 4 above the list with it left out. Filed.
4. **ProtoMech AC/2 ammunition.** The Minotaur 4's list value (188) is ours (191) without the AC/2's 16 shots of ammunition. TO:AUE p.196
   prints ammunition 4 a ton and TM p.306 counts it. Filed as mul-suspect.
5. **Svartalfa Ultra's armor.** TRO: Prototypes p.91 prints 65 points (legs 14, main gun 7); MegaMek's file has 64 (legs 15, main gun 5).
   A correction to the book's armor (blk-design-corrections.ts) makes it 540. Fixed.
6. **WoR Ultraheavy ProtoMechs not found on the list.** The Master Unit List files the Boggart, Hobgoblin and Sprite under the chassis
   name alone; seven MegaMek files had no entry. They are matched by name now (`MEGAMEK_MUL_IDS`): five equal the list, two (Boggart 2,
   Hobgoblin 2) are 7 and 3 under it with MegaMek's calculator agreeing with ours.
7. **Unexplained, MegaMek agrees with ours:** Orc 2 (171, list 170), Triton 4 (205, 207), Boggart 2 (490, 497), Hobgoblin 2 (302, 305),
   Centaur Z (183, 179), Minotaur Z (300, 295). Filed with the "MegaMek agrees" note; none is claimed as explained.
8. **TRO 3060's BV1 rule "Add ProtoMech Tonnage to Base Defensive Battle Rating"** is the Master Rules, Revised Edition's; Total Warfare has no such term.

## Combat Vehicles (read 2026-11-23)

Code: `_calcBattleValue2`, `_calcBattleValue1` and `_calcCost` in `src/classes/vehicle.ts`; the step tables are in
`src/data/calc-steps-vehicle.ts`. Combat Vehicles only; the Support Vehicle-only lines are provisional steps waiting for
the Support Vehicle round (owner call 3). The TechManual pages were read in the library's extract of its 2020 Corrected
Fourth Printing and the 2021 Sixth Printing (BV v4.1 the same); the TO:AUE pages in the 7th printing (2024). The full
readings, with the quotes, are in `.superpowers/sdd/2026-11-23-combat-vehicles-bundle-and-cited-bv/progress.md`.

### BV2 (TM pp.307-308, 316-318; TO:AUE pp.190-194)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `cv.bv2.def.armor` | TM p.307; TO:AUE p.192 | Armor points x 2.5, x the armor type modifier (TO:AUE p.192 table). | Yes | Hephaestus Prime 96 x 2.5 = 240 |
| `cv.bv2.def.armor.support` | TM pp.307-308 | Support Vehicle armor x BAR / 10. The CellCo Ranger example leaves out the x 2.5 (38 x 0.7 = 26.6). | Rule text kept; example read as a misprint; provisional (Support Vehicle round) | CellCo Ranger 53 |
| `cv.bv2.def.armor.patchwork` | TM p.307; TO:AUE pp.189, 192 | Armor type modifiers by type; no page for the per-location reading. | Provisional | Text |
| `cv.bv2.def.armor.modular` | TM p.307; TO:AUE p.93 | Modular armor adds points; none says it counts at 2.5 with no modifier. | Provisional | Text |
| `cv.bv2.def.structure` | TM p.307 | Internal structure x 1.5, rotor and turret included. | Yes | Hephaestus 15 x 1.5 = 22.5 |
| `cv.bv2.def.structure.reinforced` | TM p.307 | No vehicle page for reinforced structure. | Doubles, as a 'Mech's; provisional | Text |
| `cv.bv2.def.equipment` | TM pp.307, 317-318 | Add the defensive items (AMS, ECM, probes: the dagger items). | Yes | Hephaestus 12 + 61 = 73 |
| `cv.bv2.def.equipment.mast` | TO:AUE p.194 | VTOL Mast Mount: items in the rotor cost 10 BV more (the record's page). | Provisional | Text |
| `cv.bv2.def.equipment.ams-ammo` | TM p.307 | AMS ammunition is added up to the system's own BV. | Yes | Text |
| `cv.bv2.def.subtotal` | TM p.307 | Armor + structure + defensive equipment. | Yes | Hephaestus 335.5 |
| `cv.bv2.def.type` | TM pp.307, 316 | x the Unit Type Modifier: Tracked 0.9, Wheeled 0.8, Hover 0.7, Naval 0.6 (surface, hydrofoil, submarine), VTOL 0.7, WiGE 0.7. | Yes | Hephaestus x 0.7 = 234.85 |
| `cv.bv2.def.type.rail` | TM p.316; TO:AUE p.190 | Rail 0.6. | Yes | Text |
| `cv.bv2.def.chassis` | TO:AUE p.193 | Chassis modifications add to the Unit Type Modifier (Flotation +0.1, Limited Amphibious +0.1, Fully Amphibious +0.2, Dune Buggy +0.1, Environmental Sealing +0.1, Armored Motive System +0.1). | Yes | Text |
| `cv.bv2.def.factor` | TM pp.307, 316; TO:AUE pp.192, 194; TW p.199 | The highest potential target modifier; the footnote adds jump, MASC/TSM and any VTOL movement modifier; vehicular jump jets use jump movement like a 'Mech (TO:AUE p.194); stealth armor +2 (TO:AUE p.192); a WiGE takes +1 against airborne WiGEs (TW p.199). | Yes | Hephaestus x 1.4 = 328.79 |
| `cv.bv2.def.rating` | TM p.307 | The Defensive Battle Rating. | Yes | Hephaestus 328.79 |
| `cv.bv2.off.weapon` | TM pp.307, 317-318 | Each weapon's BV; Artemis IV x 1.2 (not the ammunition); a targeting computer x 1.25 (not the ammunition); the front half when the front is the weaker arc. | Yes | Text |
| `cv.bv2.off.weapon.rear` | TM pp.307, 317-318 | Rear-firing weapons count half, or the front half when the front's unmodified BV is lower. | Yes | Text |
| `cv.bv2.off.weapon.turret` | TM p.307 (2007, 6th printing, BV v4.1) | "Turret weapons are not included in any arc, and their full BV value is always used." | Yes (the default printing) | Hephaestus 2 x 111 = 222 |
| `cv.bv2.off.weapon.turret.forward` | TM p.307 (3rd, 4th printings, BV v4.0, 2.1) | Turret weapons are "always treated as facing forwards". | Yes (the apocryphal alternate, chosen per design) | Test |
| `cv.bv2.off.weapon.side` | TM pp.307, 317-318 | The page names front, rear and turret only. | Side arcs in full, as the MUL has it; provisional | Sea Skimmer Hydrofoil 288 |
| `cv.bv2.off.weapon.mga` | TM pp.228, 317-318 | A machine gun array is 0.67 x the (up to four) machine guns it links. | Yes | Magi test |
| `cv.bv2.off.weapon.grenade` | TM pp.317-318 | No row read for the vehicular grenade launcher. | In its arc; provisional | Text |
| `cv.bv2.off.equipment` | TM pp.317-318 | Industrial tools and mine dispensers: no page says they add in full. | Provisional | Text |
| `cv.bv2.off.drone` | TO:AUE p.193 | A Drone Remote Operating System: weapons x 0.8. | Yes | Zephyr Omnidrone |
| `cv.bv2.off.ammo` | TM pp.307, 317-318 | Ammunition at its BV. | Yes | Text |
| `cv.bv2.off.ammo.cap` | TM p.307 | Ammunition counts no more than the unmodified BV of all the weapons of that model. | Yes | Text |
| `cv.bv2.off.firecontrol` | TM pp.307, 316 | Support Vehicle heavy weapons and their ammunition x 0.8 (none), 0.9 (basic), 1.0 (advanced). | Provisional (Support Vehicle round) | CellCo Ranger |
| `cv.bv2.off.weight` | TM p.307 | Add the tonnage / 2. | Yes | Hephaestus 15 |
| `cv.bv2.off.base` | TM p.307 | Weapon Battle Rating + tonnage / 2. | Yes | Hephaestus 237 |
| `cv.bv2.off.speed` | TM pp.308, 316 | Flanking MP against the Speed Factor Table ("all vehicles except unmotorized trailers (assume Flanking MP 1)"); jump counts half (TO:AUE p.194). | Yes | Hephaestus 12 MP = 1.89 |
| `cv.bv2.off.speed.rail` | TM p.316; TO:AUE p.190 | A rail unit uses Cruise MP. | Yes | Text |
| `cv.bv2.off.rating` | TM p.308 | Base x the Speed Factor. | Yes | Hephaestus 447.93 |
| `cv.bv2.final.sum` | TM p.308 | Defensive + Offensive. | Yes | Hephaestus 776.72 |
| `cv.bv2.final.robotic` | IO:AE p.187 | A Smart Robotic Control System x 0.85. | Yes | Hi-Scout 448 |
| `cv.bv2.final.drone` | TO:AUE p.193 | A drone's final BV x 0.95. | Yes | Zephyr Omnidrone |
| `cv.bv2.final.round` | TM p.308 | Round (.5 up). | Yes | Hephaestus 777 |

### BV1 (BMR pp.140-143 with the FanPro errata p.12; BMR(R) pp.153-155, 121; Maximum Tech pp.90-92)

Read on 2026-11-23 on the page images (written back to the library's extracts). No book prints a vehicle BV1 worked example; the
checks are Maximum Tech's vehicle table (Scorpion 163, Vedette 229, J. Edgar 328, Sprint Laser Variant 352) and a tracked tank
worked by hand in `vehicle.test.ts`. Each Master Rules edition cites its own printing of Maximum Tech.

| Step id | Page (BMR / BMR(R)) | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `cv.bv1.def.armor` | p.141 / p.154 | Armor Factor. | Yes | Tracked tank 50 |
| `cv.bv1.def.structure` | p.141 (errata p.12) / p.154 | Internal Structure divided by 2, turret and rotor included (the 1998 page misses the sign). | Yes | Tracked tank 10 / 2 = 5 |
| `cv.bv1.def.equipment` | p.141 / p.154 | Defensive equipment at its BV1 (AMS with its ammunition, ECM, probes). | Yes | Text |
| `cv.bv1.def.equipment.unlisted` | p.141 / p.154 | The edition's tables print no figure for the item. | Falls back on the BV2 figure; provisional | Text |
| `cv.bv1.def.subtotal` | p.141 / p.154 | Armor + Internal Structure / 2 + defensive equipment. | Yes | 55 |
| `cv.bv1.def.type` | p.141 / p.154 | x the Vehicle Type Modifier: Tracked 0.8, Wheeled 0.7, Hover 0.6, Naval 0.5, VTOL 0.4. | Yes | 55 x 0.8 |
| `cv.bv1.def.type.wige` | p.141 / p.154 | No WiGE in either book. | Hover's 0.6; provisional | Text |
| `cv.bv1.def.movement` | pp.140-141 / pp.153-154 | x the Defensive Movement Factor: 1 + the highest potential TMM / 10, +1 for a VTOL. | Yes | Flank 8, TMM +3, 1.3 |
| `cv.bv1.def.rating` | p.141 / p.154 | The Defensive Battle Rating. | Yes | 57.2 |
| `cv.bv1.l3.def.armor.hardened` | Maximum Tech (own printing per edition) pp.90-91 | Hardened armor points count double. | Yes | Text |
| `cv.bv1.l3.def.rig` | Maximum Tech (own printing per edition) p.92 | A tractor and its trailers each take the Flank MP of the combined rig for the movement factors. |
| `cv.bv1.l3.def.chassis` | Maximum Tech (own printing per edition) p.92 | Chassis modifications add to the Vehicle Type Modifier (an amphibious hull 0.8 Wheeled). | Yes | Amphibious test, 166 |
| `cv.bv1.l3.def.item` | Maximum Tech (own printing per edition) p.92 | Minesweeper and coolant system add to the base Defensive Battle Rating. | Yes | Skulker minesweeper 185 |
| `cv.bv1.l3.def.movement` | Maximum Tech (own printing per edition) pp.91-92 | A supercharger or jet booster counts in the Defensive Movement Factor. | Yes; the booster reading is provisional | Text |
| `cv.bv1.l3.def.bridge` | Maximum Tech (own printing per edition) p.92 | A bridge-layer adds its BV after the modifiers. | Yes | Skulker bridge-layer 175 |
| `cv.bv1.l3.off.item` | Maximum Tech (own printing per edition) pp.90-92 | A bulldozer and a mast mount add to the Base Weapon Battle Rating. | Yes | Skulker bulldozer 165 |
| `cv.bv1.l3.off.ammo.special` | Maximum Tech (own printing per edition) p.91 | Special ammunition is a multiple of the standard ammo BV (semi-guided LRM x 6 beside TAG). | Yes | TAG share test |
| `cv.bv1.l3.off.multi-trac` | Maximum Tech (own printing per edition) p.91 | Multi-Trac II: every arc counts in full. | Yes | Text |
| `cv.bv1.l3.off.targeting.variable-range` | Maximum Tech (own printing per edition) p.91 | Variable-range targeting: 10 percent of the linked weapons. | Yes | Text |
| `cv.bv1.l3.off.crew` | Maximum Tech (own printing per edition) p.92 | Additional crew add to the Base Weapon Battle Rating. | Yes | Text |
| `cv.bv1.l3.off.speed.jump` | Maximum Tech (own printing per edition) p.92 | Jump MP adds to the Speed Factor MP. | Yes | Text |
| `cv.bv1.l3.off.speed.booster` | Maximum Tech (own printing per edition) p.91 | A supercharger or jet booster adds 1 to the Speed Factor MP, as MASC does. | Yes; provisional | Supercharger test |
| `cv.bv1.off.weapon` | p.141 / p.154 | Each weapon at its BV1. | Yes | 46 |
| `cv.bv1.off.weapon.unlisted` | p.141 / p.154 | As the defensive entry. | BV2 figure; provisional | Text |
| `cv.bv1.off.weapon.rear` | pp.141-142 / pp.154-155 | Rear weapons count half, unless they outweigh the other arcs: then the rear is the front. A turret is in no arc and counts full. | Yes | 46 / 2 = 23 |
| `cv.bv1.off.targeting-computer` | p.141, p.143 / p.154, p.121 | 20 percent of the weapons it links. | Yes | Skulker test |
| `cv.bv1.off.ammo` | p.141 / p.154 | Ammunition at its BV1 a ton. | Yes | Text |
| `cv.bv1.off.base` | p.141 / p.154 | Weapons + targeting computer + ammunition. | Yes | 115 |
| `cv.bv1.off.speed` | p.142 (errata p.12) / p.155 | Speed Factor for Flanking MP + VTOL MP. | Yes | MP 8 = 1.37 |
| `cv.bv1.off.speed.vtol` | p.142 / p.155 | "VTOL MP" is not defined. | Flank MP counted twice (fits Sprint 352 and Yellow Jacket); provisional | Sprint 352 |
| `cv.bv1.off.rating` | p.142 / p.155 | Base x Speed Factor. | Yes | 157.55 |
| `cv.bv1.final.round` | p.142 / p.155 | Defensive + Offensive, rounded. | Yes | 215 |

### Cost (TM pp.279-292; TO:AUE pp.219-223; BMR p.137; BMR(R) p.150)

Read on 2026-11-23: TM p.279 on the extract (the table columns run together; the Hephaestus worked on pp.283-285 checks every row),
TO:AUE pp.219 and 221 on page images, p.223 on the extract. Ammunition is left out and shown as a loaded cost (TM p.282, owner call 1);
a Clan chassis is billed 50,000 a location that stores ammunition or explosives (TM pp.210, 292, owner call 2). Under the 1998 Master
Rules and the Revised Edition the rows read BMR p.137 and BMR(R) p.150 where those Vehicle Costs Tables print one (owner call 7); the
rest stay provisional under them.

| Step id | Page | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `cv.cost.engine` | TM p.279; BMR p.137; BMR(R) p.150 | Engine rate (Standard 5,000, XL 20,000, ICE 1,250) x rating x tonnage / 75. | Yes | Hephaestus 220,000 |
| `cv.cost.engine.light` | TM p.279; BMR(R) p.150 | Light 15,000 (BMR(R) adds it; the 1998 table has none). | Yes | Text |
| `cv.cost.engine.later` | TM p.279 | Compact, XXL, Clan XL and the large engines (twice the base rate, TO:AUE p.219). | Yes | Text |
| `cv.cost.armor` | TM p.279; BMR p.137; BMR(R) p.150 | Standard 10,000, Ferro-Fibrous 20,000 a ton. | Yes | Hephaestus 100,000 |
| `cv.cost.armor.later` | TM p.279 | Light Ferro 15,000, Heavy Ferro 25,000 and the rest. | Yes | Text |
| `cv.cost.armor.patchwork` | TM p.279; TO:AUE p.189 | Each location at its own type's rate; no page for the per-location reading. | Provisional | Text |
| `cv.cost.structure` | TM p.279 | 10,000 x structure tons. | Yes | Hephaestus 30,000 |
| `cv.cost.control` | TM p.279 | 10,000 x control tons. | Yes | Hephaestus 15,000 |
| `cv.cost.robotic` | IO:AE p.215 | Smart Robotic Control System 5,000 + 10,000 x tons; other robotic systems from the records. | Provisional | Hi-Scout 50,000 |
| `cv.cost.power-amplifiers` | TM p.279 | 20,000 x tons. | Yes | Text |
| `cv.cost.heat-sinks` | TM p.279 | 2,000 x the sinks over the 10 a fusion engine supplies; every sink with another engine. | Yes | Text |
| `cv.cost.turret` | TM pp.279, 108 | 5,000 x the turret's tons; an OmniVehicle's turret is fixed at the base chassis. | Yes | Hephaestus 2,500 |
| `cv.cost.sponson` | TO:AUE p.223 | Sponson turrets 4,000 x item tons for the pair. | Yes | Text |
| `cv.cost.lift` | TM p.279 | Lift and dive equipment 20,000 x tons. | Yes | Hephaestus 60,000 |
| `cv.cost.rotor` | TM p.279 | Rotors 40,000 x tons. | Yes | Text |
| `cv.cost.jump-jets` | TO:AUE p.223 | Vehicle Jump Jet cost = 200 x tons x Jump MP squared. | Yes | 40 t, Jump 3: 72,000 |
| `cv.cost.chassis` | TO:AUE pp.219, 221 | Amphibious 10,000 x item tons; Dune Buggy 10 x TT x TT. | Yes | Dune Buggy 4,000 |
| `cv.cost.bays` | none | Transport bay prices come from the records. | Provisional | Text |
| `cv.cost.equipment` | TM p.282 | Every weapon and item adds its listed cost; each price from the records. | Provisional | Hephaestus 570,000 |
| `cv.cost.equipment.formula` | TO:AUE pp.219, 223 | Supercharger and VTOL jet booster 10,000 x engine rating; drone operating system 5,000 + 10,000 x tons; drone carrier control system 10,000 x tons. | Yes | Supercharger test |
| `cv.cost.equipment.communications` | TM pp.292, 284 | Communications equipment 10,000 a ton (the worked Dixon). | Yes | 6 tons 60,000 |
| `cv.cost.ammo` | TM p.282 | Ammunition need not be bought. | Yes; provisional (record prices) | Loaded-cost test |
| `cv.cost.clan-case` | TM pp.210, 292 | A Clan chassis presumes CASE where ammunition or explosives are stored; CASE costs 50,000. | Yes | Clan test |
| `cv.cost.subtotal` | TM pp.282, 285 | The structure, weapons and equipment before the final multipliers. | Yes | Hephaestus 997,500 |
| `cv.cost.omni` | TM p.285 | x 1.25 for an OmniVehicle. | Yes | Hephaestus 1,995,000 |
| `cv.cost.chassis-multiplier` | TO:AUE p.219 | Flotation Hull and Environmental Sealing x 1.25 the total cost. | Yes | Text |
| `cv.cost.multiplier` | TM p.285; BMR p.137; BMR(R) p.150 | 1 + tonnage / divisor: Tracked 100, Wheeled 200, Hover 50, VTOL 30, Naval 200, Hydrofoil 75, Submarine 50, WiGE 25. | Yes | Hephaestus x 1.6 |
| `cv.cost.final` | TM pp.274, 285 | Two rounding rules; the whole C-bill. | Provisional | Hephaestus 1,995,000 |
| `cv.cost.final.loaded` | TM p.282 | No book defines a loaded cost. | Provisional | Loaded-cost test |

## Battle armor (read 2026-11-23)

Code: `_suitBattleValue`, `_calcBattleValue`, `_suitBattleValue1`, `_calcBattleValue1` and `_calcCost` in `src/classes/battle-armor.ts`; the
step tables are in `src/data/calc-steps-battle-armor.ts`. The TechManual pages were read in the library's extract of the 2020
Corrected Fourth Printing and BV v4.1; the CBT Companion (FanPro 10975) pp.187-190 on the page images, written back to the library's
extracts; the Master Rules pages BMR p.142 and BMR(R) p.155 and the TO:AUE, IO:AE and TW pages from the extracts. The full notes
are in the plan's "Readings": `docs/superpowers/plans/2026-11-23-battle-armor-bundle-and-cited-bv.md`. NGCFells answered all eight
owner calls "as recommended" on 2026-11-23.

### BV2 (TM pp.310-311, 316-318; errata v6.0 p.34; TO:AUE pp.192, 195, 197; TW p.220)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `ba.bv2.suit` | TM p.310 | A suit's heading, where troopers carry different equipment. | Yes | Text |
| `ba.bv2.def.armor` | TM p.310 | Armor points (not the trooper's 1) x 2.5, fire-resistant 3.5, + 1. | Yes | Worked Purifier p.310: (6 x 2.5) + 1 = 16 |
| `ba.bv2.def.armor.special` | TM p.310; TO:AUE p.192 | Laser-reflective and reactive armor count at the fire-resistant 3.5. | Yes | Text |
| `ba.bv2.def.equipment` | TM p.310; TO:AUE p.192 | +1 for each of improved sensors, active probe, ECM; Angel ECM +2. Counted for each system a suit mounts: electronics one trooper carries cover the squad (Kage [ECM]), the same kind on several troopers is one system (ruling 2026-11-23). | Yes | Text |
| `ba.bv2.def.apds` | IO:AE p.85 | The page prints no Battle Value. 7 in the Defensive Battle Rating fits the 179 / 35 XTRO: Republic III prints for the Aegis (provisional). | Yes | (16 + 7) x 1.5 x 5.2 = 179.4 |
| `ba.bv2.def.factor` | TM pp.310, 316 | 1 + 0.1 a point of the highest target movement modifier (jump +1), + 0.1 for battle armor, + the Defensive Factor Modifier Table (Camo, Basic, Prototype, Standard Stealth +0.2; Improved, Mimetic +0.3); a detachable pack takes the best modifier (footnote). | Yes | Worked Purifier 1.2 + 0.1 + 0.3 = 1.6; Grenadier 1.0 + 0.1 + 0.2 = 1.3 |
| `ba.bv2.def.rating` | TM p.310 | The sum x the Defensive Factor. | Yes | Worked 25.6 and 30.55 |
| `ba.bv2.off.direct` | TM pp.310, 317-318; errata v6.0 p.34 (the v8.0 errata repeats the Battle Value of the grenade launchers, heavy 2 and micro 1) | The BV of every direct-fire weapon (everything but SRM, ASRM, MRM, rocket and LRM launchers, Compact Narc and Pop-up Mine); no ammunition. The heavy grenade launcher is 2, the micro 1. | Yes | Worked ER small laser 17; small laser 9 |
| `ba.bv2.off.missiles` | TM pp.310, 317-318; errata v6.0 p.34 | Launcher BV + (kilograms carried / 1,000) x the BV of a ton of its ammunition, fractions kept. | Yes | Worked SRM 4: 39 + (280 / 1,000) x 5 = 40.4 |
| `ba.bv2.off.anti-mech` | TM p.310; TW p.220 | If the unit can Swarm: the direct-fire weapons again, plus vibro-claws and claws and magnets. Only arm weapons are counted (NGCFells 2026-10-08, provisional). | Yes | Worked Purifier 17 |
| `ba.bv2.off.anti-mech.burdened` | TM p.310; TW p.220 | Inner Sphere suits with body-mounted missile launchers cannot attack 'Mechs until they jettison them; the term stays (owner call 1). | Yes | The 8 files the MUL drops it from are verdicts |
| `ba.bv2.off.anti-personnel` | TM pp.310, 319 | The BV of anti-personnel weapons from the Conventional Infantry Weapons table; the assault rifle adds nothing (181 suits). | Yes | Text |
| `ba.bv2.off.support` | TM p.310 | A squad support weapon's BV / the troopers. | Yes | Text |
| `ba.bv2.off.other` | TM pp.310, 317-318; errata v6.0 p.34 | The BV of other offensive equipment. | Yes | Text |
| `ba.bv2.off.other.clamps` | TM p.310; errata v6.0 p.34; TW p.228 | Magnetic clamps 1, listed apart from the battle claw with magnets (3); kept on every suit (owner call 6). | Yes | Text |
| `ba.bv2.off.mines` | TO:AUE pp.195, 197 | A mine dispenser is worth a 10-point minefield of its mines (standard 8, active and command-detonated 12, inferno and vibrabomb 10). | Yes | Minefield BV Table p.197 |
| `ba.bv2.off.weapons` | TM p.310 | The sum is the Weapon Battle Rating. | Yes | Worked 34 and 49.4 |
| `ba.bv2.off.speed` | TM pp.310, 316; TO:AUE p.192 | The Speed Factor Table at the highest movement mode; booster MP counts. | Yes | Worked 0.77 and 0.65 |
| `ba.bv2.off.rating` | TM p.310 | Weapon Battle Rating x Speed Factor. | Yes | Worked 26.18 and 32.11 |
| `ba.bv2.final.suit` | TM p.310 | Defensive + Offensive Battle Rating is one suit's BV. | Yes | Worked 51.78 and 62.66 |
| `ba.bv2.final.average` | TM p.310 | Unlike suits are averaged (as MegaMek does; provisional). | Yes | Text |
| `ba.bv2.final.size` | TM pp.310, 316 | The suit x the Battle Armor Unit Size Modifier (1.0, 2.2, 3.6, 5.2, 7.0, 9.0), rounded last. Finding: the book prints "63 x 5.2 = 325.832"; the unrounded 62.66 x 5.2 is. | Yes | Worked 466 and 326 |
| `ba.bv2.final.size.unlisted` | TM p.316 | No row for this number of troopers: 1. | Yes | Text |

### BV1 (CBT Companion pp.187-190; BMR p.142 and BMR(R) p.155 print a table of stock suits only)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `ba.bv1.suit` | Companion pp.187-190 | A suit's heading, where troopers carry different equipment. | Yes | Text |
| `ba.bv1.def.armor` | Companion p.187 | Armor points x 2 (fire resistant 3) + 1.5. | Yes | Elemental 10 x 2 + 1.5 = 21.5 |
| `ba.bv1.def.armor.special` | Companion p.187; TO:AUE p.192 | The Companion gives only Fire Resistant armor 3; laser-reflective and reactive armor did not exist, and TO:AUE p.192 counts them at the fire-resistant value (provisional). | Yes | Text |
| `ba.bv1.def.ecm` | Companion p.187 | +1 if the suit mounts ECM, once. Angel ECM's 2 and the advanced point defense system's 7 are carried over from BV2 (provisional). | Yes | Review 2026-11-23 |
| `ba.bv1.def.factor` | Companion pp.187-188 | The Defensive Movement Factor: 1.0 + 0.1 a point of the highest target movement modifier (jump included) plus the Stealth Modifier Table's +2 or +3; the best modifier for a detachable pack. | Yes | Elemental jump 3: +2 = 1.2 |
| `ba.bv1.def.rating` | Companion p.188 | The sum x the factor. | Yes | 21.5 x 1.2 = 25.80 |
| `ba.bv1.off.direct` | Companion pp.188-190 | The BV of all direct-fire weapons (all but SRM, advanced SRM, MRM and FarShot LRM launchers); the Missile Weapons and Component BV Tables, the Revised Master Rules pp.156-158 for what they leave out. | Yes | Small laser 9 |
| `ba.bv1.off.anti-mech` | Companion p.188 | If the unit can Swarm: the direct-fire weapons and the claws and magnets that aid it. Only arm weapons are counted (provisional). | Yes | Elemental Swarm (small laser) 9 |
| `ba.bv1.off.missiles` | Companion pp.188-189 | Launcher BV + ammunition kilograms / 1,000 x the table's ammunition BV. | Yes | Elemental SRM 2: 21 + (40 / 1,000) x 3 = 21.12 |
| `ba.bv1.off.anti-personnel` | Companion pp.188, 190 | Only for a unit with no other offensive weapon (provisional: weapon values from TM p.319). | Yes | Text |
| `ba.bv1.off.support` | Companion p.188 | A squad support weapon's BV / the troopers. | Yes | Text |
| `ba.bv1.off.other` | Companion pp.188, 190 | Other equipment from the Component BV Table. | Yes | Table |
| `ba.bv1.off.unlisted` | Companion pp.188, 190; BMR(R) pp.156-158 | An item the tables do not list: its BV2 figure (provisional). | Yes | Text |
| `ba.bv1.off.weapons` | Companion p.188 | The sum is the Weapon Battle Rating. | Yes | Elemental 39.12 |
| `ba.bv1.off.speed` | Companion p.188 | The Speed Factor Table, 1 to 12 MP: 0.54, 0.65, 0.77, 0.88, 1.00, 1.12, 1.24, 1.37, 1.50, 1.63, 1.76, 1.89. | Yes | Jump 3: 0.77 |
| `ba.bv1.off.rating` | Companion p.188 | Weapon Battle Rating x Speed Factor. Finding: the example prints "30.1124"; 39.12 x 0.77 is 30.1224. | Yes | 55.9224 total |
| `ba.bv1.final.suit` | Companion p.189 | Defensive + Offensive, rounded to a whole number (0.5 up) a suit. | Yes | Elemental 55.9224 -> 56 |
| `ba.bv1.final.squad` | Companion p.189 | x the suits in the unit (4 for a squad, 5 for a Point), no size table. | Yes | Elemental 56 x 5 = 280 (BMR(R) p.155 prints 279) |

### Cost (TM pp.281-282, 285-286, 296-298; TO:AUE p.225; IO:AE pp.180, 184; Companion p.187; BMR(R) p.150)

| Step id | Read on | What the page says | Code agrees? | Check |
|---|---|---|---|---|
| `ba.cost.suit` | TM p.285 | A suit's heading, where troopers carry different equipment. | Yes | Text |
| `ba.cost.chassis` | TM p.281 | The chassis cost by weight class. | Yes | Worked Purifier structure 425,000 |
| `ba.cost.ground` | TM p.281 | 25,000 for each Ground MP above the free one. | Yes | Text |
| `ba.cost.motive` | TM p.281 | Jump, VTOL or UMU MP x its cost per MP. | Yes | Text |
| `ba.cost.manipulator` | TM p.281; TO:AUE p.225 | Each manipulator and adaptor. | Yes | Text |
| `ba.cost.armor` | TM p.281 | Armor points x the type's cost per point. | Yes | Text |
| `ba.cost.clan` | TM p.281 | x 1.1 on the structure of a Clan suit. | Yes | Text |
| `ba.cost.structure` | TM pp.281, 285 | The Structural Cost. | Yes | Worked 425,000 |
| `ba.cost.equipment` | TM pp.296-298, 285; TO:AUE p.225 | Weapons, equipment and mounts at the cost tables. | Yes | Worked ER small laser 11,250 + modular mount 1,000 |
| `ba.cost.unpriced` | TM pp.296-298 | An item with no row adds nothing (provisional). | Yes | Text |
| `ba.cost.training` | TM p.285; Companion p.187 | Training: 150,000 for an Inner Sphere trooper, 200,000 for a Clan trooper, by the suit's technology base (a mixed suit's chassis; owner call 2). | Yes | Worked p.286; Companion Elemental |
| `ba.cost.implants` | IO:AE p.184 | EI neural implants 1,500,000 a trooper. | Yes | Text |
| `ba.cost.suit-total` | TM pp.285-286 | (Structure + weapons and equipment + training). Finding: p.286's prose says 451,000, the worked line 426,000 (3,456,000 / 6 - 150,000). | Yes | (426,000 + 150,000) x 6 = 3,456,000 |
| `ba.cost.final` | TM pp.285-286 | x the troopers per squad or Point. | Yes | (437,250 + 150,000) x 6 = 3,523,500; Companion Elemental (511,330 x 5) + (200,000 x 5) = 3,556,650 |
| `ba.cost.stock-price` | BMR(R) p.150 | A fixed price for each stock suit (Clan Point 3,500,000, IS squad 2,400,000, ...), shown beside the built cost, not replacing it (owner call 8). | Yes | Table |
