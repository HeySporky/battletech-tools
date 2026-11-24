/**
 * Verdicts on the units whose Battle Value differs from the Master Unit List's (#599), kept by hand.
 *
 * The bundle build records every difference in src/data/bundled/<type>-accuracy.json. A difference stays "open" until
 * someone has read the rule and decided what it is: our bug (with the issue that tracks it), a fault in the file we
 * import, or a Master Unit List figure the rules do not support (with the citation). Nothing here changes a number.
 */
import type { IBundledMiss } from "./bundled-mechs-build";
import type { ICalcCitation } from "./calc-steps";
import type { BundledType } from "./bundled-units";

export type BvVerdict = "open" | "our-bug" | "import" | "mul-suspect";

export interface IBvVerdict {
    verdict: Exclude<BvVerdict, "open">;
    /** What was found, in our words. */
    note: string;
    /** The issue that tracks it; an our-bug verdict must have one. */
    issue?: number;
    /** The rule read; a mul-suspect verdict must have one. */
    cites?: ICalcCitation[];
}

/**
 * Each bundled type's count of Master Unit List entries with a matching design, as the last build wrote it. A round
 * that raises a count raises its floor.
 */
export const MATCHED_FLOORS: Record<BundledType, number> = {
    "mechs": 3944, "battle-armor": 1032, "fighters": 309, "infantry": 70, "protomechs": 70, "small-craft": 32,
    "support-vehicles": 41, "vehicles": 1055,
};

/** A conventional infantry platoon's BV, worked by the steps of TM p.309 (the worked platoon on p.310): ours and MegaMek's agree. */
const INFANTRY_MEGAMEK_AGREES = "Our value is the conventional infantry Battle Value worked step by step from the file (troopers, damage divisor, Defensive Factor, weapons, Anti-'Mech attacks, Speed Factor), and MegaMek's calculator gives the same value from the same file. Neither reproduces the list's figure, and no printed rule found yet does.";
const INFANTRY_BV_CITES: ICalcCitation[] = [{ source: "tm", page: "309" }, { source: "tm", page: "310" }];

/** ProtoMechs (#599, the ProtoMech round): BV2 by TM p.306, BV1 by BMR(R) pp.154-156. */
const PM_BV_CITES: ICalcCitation[] = [{ source: "tm", page: "306" }, { source: "tm", page: "316" }];
const PM_MEGAMEK_AGREES = "Our value is the ProtoMech Battle Value worked step by step from the file (armor, structure, defensive factor, weapons, ammunition, Speed Factor), and MegaMek's calculator gives the same value from the same file. No printed rule found reproduces the list's figure: it is not explained, and is filed here only because both calculators agree against it.";
/**
 * The list's ProtoMech LRM 3 figure: the first printing of the TechManual (FanPro, 2007) and the Master Rules, Revised Edition (p.155, the
 * ProtoMech Missile Weapons BV table) print the LRM 3 at 35 with 5 a ton of ammunition, and TRO 3060 and TRO 3075 worked their Battle Values with
 * them. The TechManual's corrected printings print 34 and 4 (Clan Weapons and Equipment BV Table, p.318), which is ours.
 */
const PM_LRM3_FIRST_PRINTING = (printed: string): string => `The list's value equals ours when the LRM 3 is worked at 35 with 5 a ton of ammunition, the figures of the TechManual's first printing (FanPro, 2007) and of the Master Rules, Revised Edition (p.155); ${printed} The TechManual's corrected printings give the LRM-3 as 34 with 4 a ton (Clan Weapons and Equipment BV Table, p.318), which is what ours uses.`;
const PM_LRM3_CITES: ICalcCitation[] = [{ source: "tm", page: "318" }, { source: "bmrr", page: "155" }];
/** A myomer booster: TM p.306 adds 1 to the Speed Factor's MP. */
const PM_BOOSTER_BOOK = "TM p.306 adds 1 to the Speed Factor's MP for a myomer booster (and counts the boosted Running MP toward the Defensive Factor only), which is what ours does.";
/** Battle armor (#600, #599): checked 2026-11-23 against MegaMek's calculator on the same files. */
const BA_BV_CITES: ICalcCitation[] = [{ source: "tm", page: "310" }, { source: "tm", page: "316" }];
const BA_MEGAMEK_AGREES = "Our value is the battle armor Battle Value worked step by step from the file (armor, Defensive Factor, weapons, ammunition by the kilogram, Anti-'Mech attacks, Speed Factor, unit size), and MegaMek's calculator gives the same value from the same file. Neither reproduces the list's figure, and no printed rule found yet does.";
const BA_BURDENED_CITES: ICalcCitation[] = [{ source: "tm", page: "310" }, { source: "tw", page: "220" }];
const BA_BURDENED = "Inner Sphere battle armor with body-mounted missile launchers cannot make anti-'Mech attacks until it jettisons them (TW p.220), and MegaMek and the list leave the Anti-'Mech term out for this suit. TM p.310 counts the term when the unit can perform Swarm Attacks, and the launchers can be jettisoned at any time, so ours keeps it (NGCFells 2026-11-23). The list keeps the term for 28 other suits with body launchers.";
const BA_SUPPORT_WEAPON = "The list and MegaMek count the squad support weapon in the Anti-'Mech term for the four-trooper Kage and not for the five- and six-trooper squads, which the list values as ours. Ours counts arm-mounted weapons only (NGCFells 2026-10-08), as TM p.310 divides a squad support weapon by the troopers and says nothing of it for Swarm attacks (NGCFells 2026-11-23).";
const BA_GRENADE_CITES: ICalcCitation[] = [{ source: "tm", page: "317" }, { source: "tm-errata-6.0", page: "34" }, { source: "cbt-companion", page: "190" }];
const BA_HEAVY_GRENADE = "The heavy grenade launcher is Battle Value 2 on TM p.317 (errata v6.0 p.34 keeps it under Battle Armor Equipment; the Companion p.190 prints the grenade launcher at 2). MegaMek values it at 1, and so does the list for this suit; the list values it at 2 for 15 others (NGCFells 2026-11-23).";
const BA_CLAMP_CITES: ICalcCitation[] = [{ source: "tm-errata-6.0", page: "34" }, { source: "tw", page: "228" }, { source: "tm", page: "167" }];
const BA_CLAMPS = "Magnetic clamps are Battle Value 1 on every suit that carries them (TM errata v6.0 p.34 and the Companion p.190 list them apart from the battle claw with magnets, 3; TW p.228 makes them a riding aid and TM p.167 says they give no anti-'Mech attack). MegaMek and the list leave the 1 out for this suit and count it for 46 others (NGCFells 2026-11-23).";
/** A Support Vehicle's BV, worked by the steps of TM pp.307-308 (the CellCo Ranger on p.308): ours and MegaMek's agree. */
const SV_MEGAMEK_AGREES = "Our value is the Support Vehicle Battle Value worked step by step from the file (armor x BAR / 10, structure, type modifier, Defensive Factor, weapons with the fire control adjustment, Speed Factor), and MegaMek's calculator gives the same value from the same file. Neither reproduces the list's figure, and no printed rule found yet does.";
const SV_BV_CITES: ICalcCitation[] = [{ source: "tm", page: "307" }, { source: "tm", page: "308" }, { source: "tm", page: "316" }];
const SV_BULLDOZER = "The Bulldozer's 10 carries the Battle Value table's dagger (TM p.317): it counts in the Defensive Battle Rating only, as ours and MegaMek's count it. The list's figure is ours with the 10 counted again as offensive equipment.";
const SV_SEALING = "Environmental Sealing adds +0.1 to the type modifier (TO:AUE p.193), as the printed Dromedary, HMRV DeConAid and Burro II values show for Support Vehicles; MegaMek leaves it out.";
const SV_SMALLS = "TRO: Irregulars prints the list's figure. Ours and MegaMek's are worked by TM pp.307-308 from the file and agree; no single reading reproduces the six small Support Vehicles' printed values (leaving out the structure fits the Monocycle, TrackBike and Scout ATV, not the Hoverbike or Minigun Cycle).";

/** Keyed by bvVerdictKey. */
export const BV_VERDICTS: Record<string, IBvVerdict> = {
    // Bombard BMB-1X
    "mul:103586": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the M-Pods are not counted as explosive. The Battle Value table marks the M-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot (a mark added in a later printing).", cites: [{ source: "toaue", page: "195" }] },
    // Hachiwara HCA-3T
    "mul:100753": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the M-Pods are not counted as explosive. The Battle Value table marks the M-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot (a mark added in a later printing).", cites: [{ source: "toaue", page: "195" }] },
    // Hachiwara HCA-4T
    "mul:107252": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the M-Pods are not counted as explosive. The Battle Value table marks the M-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot (a mark added in a later printing).", cites: [{ source: "toaue", page: "195" }] },
    // Hachiwara HCA-4U
    "mul:103158": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the M-Pods are not counted as explosive. The Battle Value table marks the M-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot (a mark added in a later printing).", cites: [{ source: "toaue", page: "195" }] },
    // Juggernaut JG-R9TX1 'Leapin' Lil'
    "mul:104550": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the M-Pods are not counted as explosive. The Battle Value table marks the M-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot (a mark added in a later printing).", cites: [{ source: "toaue", page: "195" }] },
    // Neanderthal NTL-AG
    "mul:100409": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the M-Pods are not counted as explosive. The Battle Value table marks the M-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot (a mark added in a later printing).", cites: [{ source: "toaue", page: "195" }] },
    // Ronin SA-RN7
    "mul:106825": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the M-Pods are not counted as explosive. The Battle Value table marks the M-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot (a mark added in a later printing).", cites: [{ source: "toaue", page: "195" }] },
    // Scarecrow UCU-F4
    "mul:101662": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the B-Pods are not counted as explosive. The Battle Value table marks the B-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot.", cites: [{ source: "tm", page: "317" }] },
    // Thunderbolt TDR-9Nr
    "mul:107546": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the B-Pods are not counted as explosive. The Battle Value table marks the B-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot.", cites: [{ source: "tm", page: "317" }] },
    // Minsk 2
    "mul:108489": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the B-Pods are not counted as explosive. The Battle Value table marks the B-Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot.", cites: [{ source: "tm", page: "317" }] },
    // Ti Ts'ang TSG-10L
    "mul:100218": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Chaff Pod is not counted as explosive. The Battle Value table marks the Chaff Pod to be treated as a Gauss weapon in the defensive rating, 1 point a slot.", cites: [{ source: "toaue", page: "195" }] },
    // Berserker BRZ-C3
    "mul:104953": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the physical weapon's Battle Value is worked from its damage without Triple-Strength Myomer. The table's footnote takes the damage after all modifications such as Triple-Strength Myomer, which doubles it.", cites: [{ source: "tm", page: "317" }, { source: "toaue", page: "195" }] },
    // Black Knight BL-6-KNT (Ian)
    "mul:105347": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the physical weapon's Battle Value is worked from its damage without Triple-Strength Myomer. The table's footnote takes the damage after all modifications such as Triple-Strength Myomer, which doubles it.", cites: [{ source: "tm", page: "317" }, { source: "toaue", page: "195" }] },
    // Centurion CN9-YLW2 'Yen Lo Wang'
    "mul:104260": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the physical weapon's Battle Value is worked from its damage without Triple-Strength Myomer. The table's footnote takes the damage after all modifications such as Triple-Strength Myomer, which doubles it.", cites: [{ source: "tm", page: "317" }, { source: "toaue", page: "195" }] },
    // Charger CGR-3Kr
    "mul:103187": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the physical weapon's Battle Value is worked from its damage without Triple-Strength Myomer. The table's footnote takes the damage after all modifications such as Triple-Strength Myomer, which doubles it.", cites: [{ source: "tm", page: "317" }, { source: "toaue", page: "195" }] },
    // Mantis MTS-L
    "mul:101745": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the physical weapon's Battle Value is worked from its damage without Triple-Strength Myomer. The table's footnote takes the damage after all modifications such as Triple-Strength Myomer, which doubles it.", cites: [{ source: "tm", page: "317" }, { source: "toaue", page: "195" }] },
    // Atlas AS7-S2
    "mul:105418": { verdict: "mul-suspect", note: "The list's value equals the JBT value when every slot of the split Heavy Gauss Rifle is counted as explosive. The rule counts a Gauss weapon slot only in the center torso, legs or head, or where CASE does not protect it; the slots in the CASE-protected side torso are spared.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "303" }] },
    // Banshee BNC-6S
    "mul:100691": { verdict: "mul-suspect", note: "The list's value equals the JBT value when every slot of the split Heavy Gauss Rifle is counted as explosive. The rule counts a Gauss weapon slot only in the center torso, legs or head, or where CASE does not protect it; the slots in the CASE-protected side torso are spared.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "303" }] },
    // Caesar CES-4S
    "mul:104378": { verdict: "mul-suspect", note: "The list's value equals the JBT value when every slot of the split Heavy Gauss Rifle is counted as explosive. The rule counts a Gauss weapon slot only in the center torso, legs or head, or where CASE does not protect it; the slots in the CASE-protected side torso are spared.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "303" }] },
    // Goliath GOL-4S
    "mul:107105": { verdict: "mul-suspect", note: "The list's value equals the JBT value when every slot of the split Heavy Gauss Rifle is counted as explosive. The rule counts a Gauss weapon slot only in the center torso, legs or head, or where CASE does not protect it; the slots in the CASE-protected side torso are spared.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "303" }] },
    // Hauptmann HA1-OC
    "mul:106426": { verdict: "mul-suspect", note: "The list's value equals the JBT value when every slot of the split Heavy Gauss Rifle is counted as explosive. The rule counts a Gauss weapon slot only in the center torso, legs or head, or where CASE does not protect it; the slots in the CASE-protected side torso are spared.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "303" }] },
    // Blood Asp (Star Adder) I
    "mul:101859:I": { verdict: "mul-suspect", note: "The list's value equals the JBT value when every slot of the split Heavy Gauss Rifle is counted as explosive. The rule counts a Gauss weapon slot only in the center torso, legs or head, or where CASE does not protect it; the slots in the CASE-protected side torso are spared.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "303" }] },
    // Hellbringer (Loki) G
    "mul:106138:G": { verdict: "mul-suspect", note: "The list's value equals the JBT value when every slot of the split Heavy Gauss Rifle is counted as explosive. The rule counts a Gauss weapon slot only in the center torso, legs or head, or where CASE does not protect it; the slots in the CASE-protected side torso are spared.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "303" }] },
    // Devastator DVS-2-EC
    "mul:104733": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Improved Gauss Rifles are not counted as explosive. The rule takes 1 point for each Gauss weapon slot that CASE does not protect.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "303" }] },
    // Excalibur EXC-B2b-EC
    "mul:103102": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Improved Gauss Rifles are not counted as explosive. The rule takes 1 point for each Gauss weapon slot that CASE does not protect.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "303" }] },
    // Awesome AWS-11V
    "mul:107437": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the four slots of the ER PPC and its capacitor are counted as explosive. The Battle Value table marks a PPC with a capacitor to be treated as a Gauss weapon in the defensive rating, and no reduction is made for a Gauss weapon in a location with CASE II (the same in the 2008 printing, the 2019 errata and the 7th printing).", cites: [{ source: "toaue", page: "193" }, { source: "toaue", page: "194" }] },
    // Revenant UBM-1A
    "mul:106408": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the final value is multiplied by 0.95. The rule for a Smart Robotic Control System multiplies it by 0.85.", cites: [{ source: "ioae", page: "187" }] },
    // Wasp WSP-3L
    "mul:103134": { verdict: "mul-suspect", note: "The list's value equals the JBT value when every heat-generating weapon is halved. Heat efficiency here is zero or less, and the rule still counts the first weapon chosen at its full value before halving the rest.", cites: [{ source: "tm", page: "303" }, { source: "tm", page: "304" }] },
    // Wulfen C
    "mul:108098": { verdict: "mul-suspect", note: "The list's value equals the JBT value when every heat-generating weapon is halved. Heat efficiency here is zero or less, and the rule still counts the first weapon chosen at its full value before halving the rest.", cites: [{ source: "tm", page: "303" }, { source: "tm", page: "304" }] },
    // Skinwalker (Ryoken III-XP) B
    "mul:108133": { verdict: "mul-suspect", note: "The list's value equals the JBT value when no gyro is counted. The rule for a 'Mech whose interface cockpit replaces the gyro counts it as having a standard gyro. We believe the list is incorrect here: it follows an older ruling and has not been updated to the current rules, which its later Recognition Guide entries for the same cockpit do follow.", cites: [{ source: "ioae", page: "187" }] },
    // Skinwalker (Ryoken III-XP) D
    "mul:102511": { verdict: "mul-suspect", note: "The list's value equals the JBT value when no gyro is counted. The rule for a 'Mech whose interface cockpit replaces the gyro counts it as having a standard gyro. We believe the list is incorrect here: it follows an older ruling and has not been updated to the current rules, which its later Recognition Guide entries for the same cockpit do follow.", cites: [{ source: "ioae", page: "187" }] },
    // Skinwalker (Ryoken III-XP) Prime
    "mul:108669": { verdict: "mul-suspect", note: "The list's value equals the JBT value when no gyro is counted. The rule for a 'Mech whose interface cockpit replaces the gyro counts it as having a standard gyro. We believe the list is incorrect here: it follows an older ruling and has not been updated to the current rules, which its later Recognition Guide entries for the same cockpit do follow.", cites: [{ source: "ioae", page: "187" }] },
    // Parash 3
    "mul:104943": { verdict: "mul-suspect", note: "The list's value equals the JBT value when no gyro is counted. The rule for a 'Mech whose interface cockpit replaces the gyro counts it as having a standard gyro. We believe the list is incorrect here: it follows an older ruling and has not been updated to the current rules, which its later Recognition Guide entries for the same cockpit do follow.", cites: [{ source: "ioae", page: "187" }] },
    // Seraph C-SRP-O Invictus
    "mul:100663": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the physical weapon's Battle Value is worked from its damage without Triple-Strength Myomer. The table's footnote takes the damage after all modifications such as Triple-Strength Myomer, which doubles it.", cites: [{ source: "tm", page: "317" }, { source: "toaue", page: "195" }] },
    // Seraph C-SRP-OA Dominus
    "mul:107321": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the physical weapon's Battle Value is worked from its damage without Triple-Strength Myomer. The table's footnote takes the damage after all modifications such as Triple-Strength Myomer, which doubles it.", cites: [{ source: "tm", page: "317" }, { source: "toaue", page: "195" }] },
    // Seraph C-SRP-OR (Ravana)
    "mul:107272": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the physical weapon's Battle Value is worked from its damage without Triple-Strength Myomer. The table's footnote takes the damage after all modifications such as Triple-Strength Myomer, which doubles it.", cites: [{ source: "tm", page: "317" }, { source: "toaue", page: "195" }] },
    // Raider JL-3B
    "mul:100204": { verdict: "mul-suspect", note: "The list's value equals the JBT value when movement heat is zero. The rule gives zero movement heat to IndustrialMechs with an internal combustion engine only, and this design is a BattleMech.", cites: [{ source: "tm", page: "303" }] },
    // Triskelion TRK-4V
    "mul:104220": { verdict: "mul-suspect", note: "The list's value equals the JBT value multiplied by 1.05. The rule works a tripod's Battle Value as a biped BattleMech's, with no multiplier.", cites: [{ source: "ioae", page: "188" }] },
    // Pwwka S-PW-1LAM
    "mul:104131": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the defensive factor leaves out the extra +1 for an airborne target. The rule for a Land-Air 'Mech takes the AirMech flank speed and adds that +1.", cites: [{ source: "ioae", page: "186" }] },
    // Waneta S-WN-2LAM
    "mul:105075": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the defensive factor leaves out the extra +1 for an airborne target. The rule for a Land-Air 'Mech takes the AirMech flank speed and adds that +1.", cites: [{ source: "ioae", page: "186" }] },
    // Screamer LAM SCR-1X-LAM
    "mul:104075": { verdict: "mul-suspect", note: "The list's value equals a plain BattleMech's: ground movement for the defensive factor and the speed factor, and bomb bays not counted as explosive. The rule for a Land-Air 'Mech takes its AirMech flank speed for both, with +1 for an airborne target.", cites: [{ source: "ioae", page: "186" }] },
    // Alpha Wolf A
    "mul:107017": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Coolant Pod adds nothing to the heat sink capacity. The rule adds the number of heat sinks times a fifth of the number of pods, rounded up: 4 here.", cites: [{ source: "toaue", page: "193" }] },
    // Grand Dragon DRG-5K (Emory)
    "mul:100783": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Prototype ER Large Laser takes the standard ER Large Laser's Battle Value. The table gives the prototype its own, lower value.", cites: [{ source: "ioae", page: "186" }, { source: "ioae", page: "189" }] },
    // Hunchback HBK-4G (Shakir)
    "mul:102608": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Prototype Medium Pulse Lasers take the standard laser's Battle Value and heat. The table gives the prototype its own, lower value, and the rule counts 7 heat for it.", cites: [{ source: "ioae", page: "186" }, { source: "ioae", page: "189" }] },
    // Super Griffin GRF-2N-X
    "mul:102800": { verdict: "mul-suspect", note: "The list's value equals the JBT value when no weapon's Battle Value is halved for heat. The rule gives prototype improved jump jets twice a standard jump jet's heat, so this design's six make 12 movement heat and its weapons pass the heat it can sink.", cites: [{ source: "ioae", page: "97" }] },
    // Cataphract CTF-2X (George)
    "mul:103219": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the three prototype double heat sinks each sink 1 heat. The rule has them work as Inner Sphere double heat sinks, and the Battle Value table gives them no adjustment.", cites: [{ source: "ioae", page: "65" }, { source: "ioae", page: "189" }] },
    // Anzu ZU-G60
    "mul:103922": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-dark-age", page: "134" }] },
    // Archangel C-ANG-OC Comminus
    "mul:105936": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-jihad", page: "272" }] },
    // Archer ARC-5R
    "mul:107400": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rg-ilclan-10", page: "27" }] },
    // Demeter WLD-1-M AgroMech MOD
    "mul:103855": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "tro-irregulars", page: "97" }] },
    // Gargoyle (Man O' War) T
    "mul:107466": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rg-ilclan-11", page: "39" }] },
    // Grand Crusader GRN-D-01-X
    "mul:100807": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's. The 2021 printing of the same sheet prints the list's value; the 2022 printing prints the JBT value.", cites: [{ source: "rg-ilclan-23", page: "37" }] },
    // Hierofalcon A
    "mul:106181": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rg-ilclan-3", page: "20" }] },
    // Ice Ferret (Fenris) J
    "mul:103579": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rg-ilclan-4", page: "25" }] },
    // Jackalope JLP-NH 'Tepoztecatl'
    "mul:101228": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-shrapnel-2", page: "14" }] },
    // Merlin MLN-1P
    "mul:101501": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rg-ilclan-26", page: "25" }] },
    // Poseidon PSD-V2
    "mul:100025": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-dark-age", page: "261" }] },
    // Regent A
    "mul:104973": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's. The 2021 printing of the same sheet prints the list's value; the 2022 printing prints the JBT value.", cites: [{ source: "rg-ilclan-21", page: "27" }] },
    // Savage Wolf (Mad Cat Mk IV) Prime
    "mul:102249": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-dark-age", page: "192" }] },
    // Scarecrow UCU-F4r
    "mul:100976": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-dark-age", page: "72" }] },
    // Shogun SHG-3E
    "mul:108235": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-tro3150", page: "296" }] },
    // Templar III TLR2-OB
    "mul:105868": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-tro3150", page: "216" }] },
    // Vision Quest VQ-1NC
    "mul:104965": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "tro-golden-century", page: "101" }] },
    // Hercules HRC-LS-9004
    "mul:107622": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Blue Shield slot in the right arm is counted as explosive. A hit on an active Blue Shield is an explosion that CASE contains, and no reduction is taken for explosive slots in the location of CASE II or one location out from it: the right torso carries CASE II, so the right arm's slot is spared with the torso's.", cites: [{ source: "toaue", page: "108" }, { source: "toaue", page: "193" }] },
    // Buccaneer BCN-6PX 'Pan'
    "mul:100620": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the ER Medium Laser is the Clan model. The published record sheet gives the Inner Sphere weapon's damage and ranges.", cites: [{ source: "xtro-royal-fantasy", page: "45" }] },
    // Kraken (Bane) XR
    "mul:102778": { verdict: "mul-suspect", note: "The publisher's write-up for this design prints the JBT value, not the list's.", cites: [{ source: "xtro-clans", page: "8" }] },
    // Savage Coyote Z
    "mul:106163": { verdict: "mul-suspect", note: "The list's value equals the JBT value when both ER Medium Lasers count in full. The first of them takes the weapon heat past what the design can sink, and the rule halves every weapon after that one.", cites: [{ source: "tm", page: "303" }] },
    // Gladiator GLD-1R (Keller)
    "mul:100119": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the gyro adds nothing to the defensive rating. The rule adds the tonnage times the gyro's modifier.", cites: [{ source: "tm", page: "302" }] },
    // Wolfhound WLF-2X
    "mul:103846": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the gyro adds nothing to the defensive rating. The rule adds the tonnage times the gyro's modifier.", cites: [{ source: "tm", page: "302" }] },
    // Turkina U
    "mul:100869": { verdict: "mul-suspect", note: "The list's value equals the JBT value when one of the eight armored slots is counted, not all eight. The rule gives an armored component with no Battle Value of its own 5 points a slot.", cites: [{ source: "toaue", page: "193" }] },
    // Xanthos XNT-6O
    "mul:108227": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Coolant Pod is charged 15 points like a slot of ammunition. The rule subtracts 1 point a Coolant Pod slot.", cites: [{ source: "toaue", page: "193" }] },
    // Malak C-MK-OS Caelestis
    "mul:101689": { verdict: "mul-suspect", note: "The list's value equals the JBT value when one slot of the ER PPC and its capacitor is counted as explosive, not all four. The Battle Value table marks a PPC with a capacitor to be treated as a Gauss weapon in the defensive rating, 1 point a slot.", cites: [{ source: "toaue", page: "194" }, { source: "toaue", page: "195" }] },
    // Griffin GRF-1RG
    "mul:108074": { verdict: "import", note: "The file JBT imports carries fewer armor points than the published record sheet (Recognition Guide: ilClan, vol. 1). With the sheet's armor the JBT value equals the list's." },
    // Osprey OSP-36
    "mul:102563": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the engine modifier is 1.0. The design carries an Inner Sphere XL engine, for which the table gives 0.5.", cites: [{ source: "tm", page: "302" }, { source: "tm", page: "315" }] },
    // Antlion LK-3D
    "mul:103175": { verdict: "mul-suspect", note: "The list's value equals the JBT value when 'Mech Mortar ammunition is counted at 1.2 times its table value. The table gives a ton 1, 2, 3 or 6 points by launcher size, the same for Inner Sphere and Clan launchers.", cites: [{ source: "toaue", page: "194" }, { source: "toaue", page: "197" }] },
    // Woodsman D
    "mul:106880": { verdict: "mul-suspect", note: "The list's value equals the JBT value when 'Mech Mortar ammunition is counted at 1.2 times its table value. The table gives a ton 1, 2, 3 or 6 points by launcher size, the same for Inner Sphere and Clan launchers.", cites: [{ source: "toaue", page: "194" }, { source: "toaue", page: "197" }] },
    // Crossbow D
    "mul:107702": { verdict: "mul-suspect", note: "The list's value equals the JBT value when 'Mech Mortar ammunition is counted at 1.2 times its table value. The table gives a ton 1, 2, 3 or 6 points by launcher size, the same for Inner Sphere and Clan launchers.", cites: [{ source: "toaue", page: "194" }, { source: "toaue", page: "197" }] },
    // Osteon A
    "mul:106162": { verdict: "mul-suspect", note: "The list's value equals the JBT value when 'Mech Mortar ammunition is counted at 1.2 times its table value. The table gives a ton 1, 2, 3 or 6 points by launcher size, the same for Inner Sphere and Clan launchers.", cites: [{ source: "toaue", page: "194" }, { source: "toaue", page: "197" }] },
    // Thunderbolt IIC 2
    "mul:102300": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the improved heavy large laser's side torso slots are counted as explosive. On a Clan 'Mech only Gauss-type slots in the center torso, legs or head count, and this is a Clan chassis with a standard fusion engine.", cites: [{ source: "tm", page: "302" }] },
    // Pariah (Septicemia) US
    "mul:108567": { verdict: "mul-suspect", note: "The list's value equals the JBT value when both Spot Welders are counted in full. A Spot Welder generates 2 heat, so each counts half once the heat efficiency is passed.", cites: [{ source: "tm", page: "303" }, { source: "tm", page: "344" }] },
    // Trebuchet TBT-7MM 'Merida'
    "mul:105864": { verdict: "import", note: "The file JBT imports carries one armor point fewer on the right arm than the published record sheet (XTRO: Royal Fantasy). With the sheet's armor the JBT value equals the list's.", cites: [{ source: "xtro-royal-fantasy", page: "55" }] },
    // Prey Seeker PY-SR30
    "mul:101223": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the machine gun arrays count 6.7 less. The Battle Value table gives an array the total of all its machine guns multiplied by 0.67, and the other designs with light machine gun arrays agree with the list under that rule.", cites: [{ source: "tm", page: "317" }] },
    // Skinwalker (Ryoken III-XP) C
    "mul:104379": { verdict: "mul-suspect", note: "The list's value equals the JBT value when no gyro is counted and the ammunition in the left arm is counted as unprotected. The rule for an interface cockpit that replaces the gyro counts a standard gyro, and the record sheet shows CASE in that arm. We believe the list is incorrect here: it follows an older ruling and has not been updated to the current rules. The list's later Recognition Guide entries for the same 'Mech agree with the JBT value with the gyro counted, and its entry for the Goshawk II RISC of the same book agrees with arm ammunition left unpenalised.", cites: [{ source: "ioae", page: "187" }, { source: "tm", page: "303" }] },
    // Emperor EMP-6A-EC
    "mul:100943": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Prototype Streak SRM 4 counts 45. The Battle Value table gives it 59.", cites: [{ source: "ioae", page: "189" }] },
    // Starslayer STY-2C-EC
    "mul:102870": { verdict: "mul-suspect", note: "The list's value equals the JBT value when the Prototype Streak SRM 4 counts 45. The Battle Value table gives it 59.", cites: [{ source: "ioae", page: "189" }] },
    // Grand Titan T-IT-N13M
    "mul:103954": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-3145-ntnu", page: "195" }] },
    // Deep Lord RCL-Z1M MilitiaMech
    "mul:106834": { verdict: "mul-suspect", note: "The publisher's record sheet for this design prints the JBT value, not the list's.", cites: [{ source: "rs-prototypes", page: "70" }] },
    // Temax Cat Ninjabolt TMC-NB
    "mul:105409": { verdict: "mul-suspect", note: "The list's value (and the readout's) equals the JBT value when the HVAC/10 is charged 1 point for each of its slots as an explosive component. The Battle Value table counts an HVAC as a Gauss weapon of one slot.", cites: [{ source: "toaue", page: "195" }, { source: "toaue-errata-7.0", page: "195" }] },
    // Fighters (#599 fighter round, 2026-11-22): checked against MegaMek's own calculator, file by file.
    // Ahab AHB-443b (fighter)
    "mul:103674": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Ahab AHB-643 (fighter)
    "mul:100568": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Avar A (fighter)
    "mul:106848": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Avar E (fighter)
    "mul:104191": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Batu D (fighter)
    "mul:107026": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Centurion CNT-2D (fighter)
    "mul:102923": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Chaeronea 2 (fighter)
    "mul:106285": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Chaeronea 4 (fighter)
    "mul:100122": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Cheetah II F-12A (fighter)
    "mul:105336": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Chippewa CHP-W7T (fighter)
    "mul:106962": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Chippewa CHP-W8 (fighter)
    "mul:108217": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Corax CRX-OD (fighter)
    "mul:108273": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Corax CRX-OR (fighter)
    "mul:102269": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Corsair (Bob) 'Roswell' (fighter)
    "mul:102440": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Corsair CSR-12D (fighter)
    "mul:108339": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Corsair CSR-V12b (fighter)
    "mul:106254": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Dagger DARO-1 (fighter)
    "mul:102430": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Dagger DARO-1C (fighter)
    "mul:102175": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Dagger DARO-1D (fighter)
    "mul:106512": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Deathstalker F-77 (fighter)
    "mul:104360": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Deathstalker F-77A (fighter)
    "mul:103236": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Defiance DFC-OD (fighter)
    "mul:103543": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Eisensturm EST-OD (fighter)
    "mul:103075": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Hammerhead HMR-HD (fighter)
    "mul:104747": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Heavy Strike Fighter Bat Hawk (fighter)
    "mul:101736": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Heavy Strike Fighter Inseki (fighter)
    "mul:104110": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Heavy Strike Fighter Meteor (fighter)
    "mul:104108": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Hellcat HCT-213D (fighter)
    "mul:107557": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Hellcat II HCT-213B (fighter)
    "mul:104856": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Hellcat II HCT-213C (fighter)
    "mul:102363": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Hellcat II HCT-214 (fighter)
    "mul:105340": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Hellcat II HCT-215 (fighter)
    "mul:101391": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Huscarl HSCL-1-OB (fighter)
    "mul:101619": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Huscarl HSCL-1-OR (fighter)
    "mul:101955": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Hydaspes (Algar) (fighter)
    "mul:103683": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Hydaspes 3 (fighter)
    "mul:106235": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Issedone C (fighter)
    "mul:107275": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Jagatai X (fighter)
    "mul:101550": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Jengiz E (fighter)
    "mul:103908": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Jengiz Prime (fighter)
    "mul:104492": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Jengiz X (fighter)
    "mul:101002": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Kirghiz E (fighter)
    "mul:102147": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Lancer LX-3 (fighter)
    "mul:107253": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Lightning LTN-G15 (fighter)
    "mul:108042": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Lightning LTN-G16D (fighter)
    "mul:103133": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Lightning LTN-G16L (fighter)
    "mul:101753": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Lightning LTN-G16O (fighter)
    "mul:108671": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Lightning LTN-G16S (fighter)
    "mul:104601": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Lightning LTN-G16T (fighter)
    "mul:101221": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Lucifer III LCR-3 (fighter)
    "mul:106507": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Mechbuster (fighter)
    "mul:101225": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Mechbuster (Mary) (fighter)
    "mul:101690": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Medium Strike Fighter Defender II C (fighter)
    "mul:101523": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Morgenstern MR-1S (fighter)
    "mul:101500": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Morgenstern MR-1SB (fighter)
    "mul:102722": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Morgenstern MR-1SD (fighter)
    "mul:107439": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Morgenstern MR-1SE (fighter)
    "mul:102517": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Oni ON-2 (fighter)
    "mul:105032": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Ostrogoth A (fighter)
    "mul:106266": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Ostrogoth B (fighter)
    "mul:103577": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Ostrogoth C (fighter)
    "mul:100297": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Ostrogoth Prime (fighter)
    "mul:108218": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Persepolis (fighter)
    "mul:108315": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Planetlifter Air Transport 'SuperPelican' aka 'Waddle' (fighter)
    "mul:107420": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Poignard PGD-Y3 (fighter)
    "mul:108226": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Rapier RPR-100 (fighter)
    "mul:100608": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Rapier RPR-101 (fighter)
    "mul:102736": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Rapier RPR-102 (fighter)
    "mul:105924": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Rapier RPR-300S (fighter)
    "mul:100615": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Rapier RPR-300X (fighter)
    "mul:100792": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Riever F-100 (fighter)
    "mul:106314": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Riever F-100a (fighter)
    "mul:100796": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Riever F-100b (fighter)
    "mul:103141": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Riever F-700 (fighter)
    "mul:102099": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Rogue RGU-133E (fighter)
    "mul:103108": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Sabutai B (fighter)
    "mul:101272": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Sabutai E (fighter)
    "mul:106207": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Sabutai X (fighter)
    "mul:101644": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Sagittarii SGT-2R (fighter)
    "mul:101052": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Sagittarii SGT-3R (fighter)
    "mul:102674": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Sagittarii SGT-4R (fighter)
    "mul:104790": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Schrack SCK-OB (fighter)
    "mul:108037": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Scytha B (fighter)
    "mul:100436": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Scytha E (fighter)
    "mul:108433": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Scytha X (fighter)
    "mul:104384": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Shikra SKR-4N (fighter)
    "mul:106385": { verdict: "mul-suspect", note: "The list's value (and MegaMek's) equals the JBT value when the Chaff Pods are not counted. The Battle Value table treats a Chaff Pod as a Gauss weapon in the defensive rating, 1 point each, as the 'Mech ruling has it.", cites: [{ source: "tm", page: "311" }, { source: "toaue", page: "195" }] },
    // Shilone SL-17AC (fighter)
    "mul:108186": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Shilone SL-18 (fighter)
    "mul:102465": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Shiva SHV-OD (fighter)
    "mul:104801": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Sholagar SL-22 (fighter)
    "mul:108558": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Slayer SL-15 (fighter)
    "mul:102128": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Slayer SL-15 (Eric) (fighter)
    "mul:100401": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Stingray F-90S (fighter)
    "mul:107364": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Stingray F-94 (fighter)
    "mul:101587": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Stuka STU-D7 (fighter)
    "mul:108006": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Stuka STU-K5b (fighter)
    "mul:105635": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Swift SWF-606 (fighter)
    "mul:100365": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Swift SWF-606R (fighter)
    "mul:107945": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Tatsu MIK-OD (fighter)
    "mul:102235": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Tatsu MIK-OE (fighter)
    "mul:103891": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Tatsu MIK-OF (fighter)
    "mul:108123": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Thunderbird TRB-D46 (fighter)
    "mul:105765": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Thunderbird TRB-D50 (fighter)
    "mul:101578": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Thunderbird TRB-D56 (fighter)
    "mul:103930": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Transgressor TR-14 'AC' (fighter)
    "mul:104326": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Transit TR-10 (fighter)
    "mul:105903": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Transit TR-11 (fighter)
    "mul:101199": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Trident TRN-3T (fighter)
    "mul:106246": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Trident TRN-3U (fighter)
    "mul:107171": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Troika CMT-3TV (Viktor) (fighter)
    "mul:108192": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Troika CMT-7T (fighter)
    "mul:103164": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Turk E (fighter)
    "mul:105909": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Typhoon TFN-3A (fighter)
    "mul:104023": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Typhoon TFN-3M (fighter)
    "mul:103327": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Typhoon TFN-5H (fighter)
    "mul:105215": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Tyre 3 (fighter)
    "mul:100402": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Vandal E (fighter)
    "mul:105873": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Vandal Prime (fighter)
    "mul:106917": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Vulcan VLC-5N (fighter)
    "mul:107728": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Vulcan VLC-8N (fighter)
    "mul:100668": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Wusun A (fighter)
    "mul:103409": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Wusun B (fighter)
    "mul:102409": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Wusun C (fighter)
    "mul:103664": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Wusun D (fighter)
    "mul:105656": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Wusun Prime (fighter)
    "mul:107029": { verdict: "mul-suspect", note: "MegaMek's own Battle Value calculator gives the file JBT imports the same value as JBT (its unit export, 2026-11-22), so the list differs from both. Every step of ours is cited to the aerospace procedure. Whether the file matches the printed design was not checked.", cites: [{ source: "tm", page: "311" }, { source: "tm", page: "312" }, { source: "tm", page: "313" }] },
    // Conventional infantry (#600, #599): checked 2026-11-23 against MegaMek's calculator on the same files.
    // AA Mechanized Infantry Mechanized AA Infantry
    "mul:108393": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Bridge-builder Engineers Take the Time III-chi; Forty-eighth Division
    "mul:102246": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Anti-Infantry Clan Jade Falcon Police
    "mul:106611": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Foot Point (Flamer Basic)
    "mul:102633": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Foot Point (MG Basic)
    "mul:106176": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Jump Point (Flamer Basic)
    "mul:106123": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // The Clan LRM points: built as mixed technology (the Corean FarShot is Inner Sphere only, TM p.300; TO:AUE p.189).
    // Clan Mechanized Hover Point (LRM Advanced)
    "mul:106007": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (LRM Advanced)
    "mul:106784": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (LRM Advanced)
    "mul:106722": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (LRM Advanced)
    "mul:107196": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // HALO Paratrooper Lyran Paratrooper Corps
    "mul:101818": { verdict: "mul-suspect", note: "The list's 110 is MegaMek's value for the file, which gives each squad two heavy recoilless rifles. Paratroops carry one secondary weapon a squad (every printing of the Specialized Infantry Types Table), and the TRO prints 18 rifles and 3 heavy recoilless rifles in 21 (7/3); JBT builds that design, 115. The TRO's own figure is 103.", cites: [{ source: "toaue", page: "153" }, { source: "tro-3085", page: "202" }] },
    // Clan Jump Point (Laser Basic)
    "mul:102616": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Jump Point (MG Basic)
    "mul:100467": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Jump Point (Rifle Basic)
    "mul:102849": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Jump Point (SRM Basic)
    "mul:105406": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (Flamer Advanced)
    "mul:100285": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (Flamer Basic)
    "mul:103956": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (Laser Advanced)
    "mul:106761": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (Laser Basic)
    "mul:106263": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (MG Advanced)
    "mul:106831": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (MG Basic)
    "mul:100845": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (Rifle Advanced)
    "mul:101024": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (Rifle Basic)
    "mul:106434": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (SRM Advanced)
    "mul:104293": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Hover Point (SRM Basic)
    "mul:108498": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Infantry Mimir/Watch Counter Insurgency Point
    "mul:104346": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (Flamer Advanced)
    "mul:106656": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (Flamer Basic)
    "mul:104033": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (Laser Advanced)
    "mul:107450": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (Laser Basic)
    "mul:101177": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (MG Advanced)
    "mul:107231": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (MG Basic)
    "mul:107583": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (Rifle Advanced)
    "mul:102802": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (Rifle Basic)
    "mul:106552": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (SRM Advanced)
    "mul:102535": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Tracked Point (SRM Basic)
    "mul:101282": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (Flamer Advanced)
    "mul:102527": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (Flamer Basic)
    "mul:102918": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (Laser Advanced)
    "mul:107927": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (Laser Basic)
    "mul:103145": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (MG Advanced)
    "mul:106712": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (MG Basic)
    "mul:104224": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (Rifle Advanced)
    "mul:104402": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (Rifle Basic)
    "mul:108458": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (SRM Advanced)
    "mul:101920": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Mechanized Wheeled Point (SRM Basic)
    "mul:105209": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (Flamer Advanced)
    "mul:108626": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (Flamer Basic)
    "mul:105266": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (Laser Advanced)
    "mul:103822": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (Laser Basic)
    "mul:101893": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (MG Advanced)
    "mul:101321": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (MG Basic)
    "mul:102626": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (Rifle Advanced)
    "mul:105999": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (Rifle Basic)
    "mul:106368": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (SRM Advanced)
    "mul:100846": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Clan Motorized Point (SRM Basic)
    "mul:103253": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Combat Engineer Royal Engineers; 1st Lyran Royal Guards RCT
    "mul:102987": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Fast Recon Cavalry Point
    "mul:104140": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Field Gun Infantry (Motorized Batteries)
    "mul:100892": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Field Gun Infantry Platoon (AC/10)
    "mul:100424": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Heavy Infantry Heavy Urban Response Platoon
    "mul:105879": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Heavy Support Infantry Irian Technologies SWAT Team
    "mul:100231": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Hover Assault Infantry Johnston Industries Rapid Response Force
    "mul:107965": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Manei Domini Attack Squad 'Tau Zombie'
    "mul:108662": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Manei Domini Recon Squad 'Tau Wraith'
    "mul:102484": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Assault XCT Word of Blake Militia NBC
    "mul:102479": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Field Artillery 71st Mechanized
    "mul:106790": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Hover Platoon (ComStar) (Flamer)
    "mul:106759": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Hover Platoon (ComStar) (Laser)
    "mul:100350": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Hover Platoon (ComStar) (MG)
    "mul:107920": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Hover Platoon (ComStar) (Rifle)
    "mul:106347": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Hover Platoon (ComStar) (SRM)
    "mul:107012": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Hover Platoon (DCMS) (LRM 3065+)
    "mul:105591": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Hover Platoon (Rifle AA)
    "mul:102250": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Tracked Platoon (ComStar) (Flamer)
    "mul:102644": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Tracked Platoon (ComStar) (Laser)
    "mul:103402": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Tracked Platoon (ComStar) (MG)
    "mul:103767": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Tracked Platoon (ComStar) (Rifle)
    "mul:103903": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Tracked Platoon (ComStar) (SRM)
    "mul:107990": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Tracked Platoon (DCMS) (LRM 3065+)
    "mul:102683": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Tracked Platoon (Rifle AA)
    "mul:102973": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Wheeled Platoon (ComStar) (Flamer)
    "mul:102010": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Wheeled Platoon (ComStar) (Laser)
    "mul:108469": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Wheeled Platoon (ComStar) (MG)
    "mul:105970": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Wheeled Platoon (ComStar) (Rifle)
    "mul:107821": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Wheeled Platoon (ComStar) (SRM)
    "mul:106465": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Wheeled Platoon (DCMS) (LRM 3065+)
    "mul:101933": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Mechanized Wheeled Platoon (Rifle AA)
    "mul:107884": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Minesweepers Thirty-fifth Cluster Support Force; Red Chasseurs
    "mul:100756": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Missile Artillery Infantry Kommando Special Forces
    "mul:105057": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Heavy Infantry Motstand/Mimir Troop
    "mul:103298": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Infantry Dark Caste Bandits
    "mul:108333": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized MG Galatean Support Wheels
    "mul:100617": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (ComStar) (Flamer)
    "mul:105622": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (ComStar) (Laser)
    "mul:100453": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (ComStar) (MG)
    "mul:101947": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (ComStar) (Rifle)
    "mul:104765": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (ComStar) (SRM)
    "mul:103182": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (LRM)
    "mul:101650": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (Rifle AA)
    "mul:106574": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (Taurian) (Flamer)
    "mul:101399": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (Taurian) (LRM)
    "mul:107626": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (Taurian) (Laser)
    "mul:108025": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (Taurian) (MG)
    "mul:100186": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (Taurian) (Rifle)
    "mul:101796": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized Platoon (Taurian) (SRM)
    "mul:102392": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Motorized XCT Infantry Explorer Corps Hostile Environment
    "mul:107235": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Pirate Lady Death's 'Pacification' Squads
    "mul:107484": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Recon Infantry Recon Battalion; 201st Pesht Assault Team; 3rd Proserpina Hussars
    "mul:108702": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Riot Police Word of Blake Protectorate Militia Pacification Unit
    "mul:101470": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // SpecOps Paratrooper MI6 Extraction Team
    "mul:107866": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Submersible Mechanized Infantry Kraken Unleashed - The Mermen
    "mul:105387": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // Surveillance Specialist Com Guards Battlefield Data Miners
    "mul:100832": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // TAG Spotter Infantry Stalwart Support - Spotter Infantry
    "mul:102413": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // VTOL Infantry Hachiman Taro Enterprise Extraction Force
    "mul:107244": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // XCT Marine Special Asteroid Support Forces
    "mul:101519": { verdict: "mul-suspect", note: INFANTRY_MEGAMEK_AGREES, cites: INFANTRY_BV_CITES },
    // ---- ProtoMechs (#599, the ProtoMech round). MegaMek's calculator (0.51.01) on the same files is the check, as in the fighter and infantry rounds. ----
    // Centaur (BLK: Centaur.blk); TRO 3060 (CGL) p.195 prints 192
    "mul:106035": { verdict: "mul-suspect", note: PM_LRM3_FIRST_PRINTING("TRO 3060 (CGL) p.195 prints the Centaur at 192, the list's figure."), cites: [...PM_LRM3_CITES, { source: "tro-3060-cgl", page: "195" }] },
    // Procyon 3
    "mul:102215": { verdict: "mul-suspect", note: PM_LRM3_FIRST_PRINTING("with its Heavy Small Laser the same sum comes to 163, the list's figure."), cites: PM_LRM3_CITES },
    // Triton 2
    "mul:104007": { verdict: "mul-suspect", note: PM_LRM3_FIRST_PRINTING("the same sum comes to 274, the list's figure."), cites: PM_LRM3_CITES },
    // Basilisk; TRO 3075 p.161 prints 319
    "mul:104351": { verdict: "mul-suspect", note: PM_LRM3_FIRST_PRINTING("TRO 3075 p.161 prints the Basilisk at 319, the list's figure."), cites: [...PM_LRM3_CITES, { source: "tro-3075", page: "161" }] },
    // Minotaur 4
    "mul:105152": { verdict: "mul-suspect", note: "The list's value equals ours when the ProtoMech AC/2's ammunition is left out (16 shots, 1.6 BV, 2.8 once the Speed Factor is applied: 191 less that is 188). The Clan Weapons and Equipment BV Table [Addendum] prints the ProtoMech AC/2 at 34 with ammunition 4 a ton, and TM p.306 counts the ammunition of every weapon up to the weapon's own BV.", cites: [{ source: "toaue", page: "196" }, { source: "tm", page: "306" }] },
    // Siren 4: boosted Running MP 20 gives the list's 88 (and MegaMek's 88)
    "mul:100661": { verdict: "mul-suspect", note: `The list's value (and MegaMek's) equals ours when the Speed Factor is worked from the booster's boosted Running MP, 20, in place of the Running MP 15 + 1. ${PM_BOOSTER_BOOK} Worked that way the Siren 4 is 88.`, cites: PM_BV_CITES },
    // Centaur 4: boosted Running MP 12 gives MegaMek's 227, one under the list's 228
    "mul:106132": { verdict: "mul-suspect", note: `The list's value is above even the figure MegaMek's calculator gives from the boosted Running MP, 12 (227, against ours at Running MP 9 + 1 = 214). ${PM_BOOSTER_BOOK}`, cites: PM_BV_CITES },
    // Basilisk (Quad) B: the list's 218 equals ours when the booster adds nothing to the Speed Factor
    "mul:104262": { verdict: "mul-suspect", note: `The list's value equals ours (223) when the myomer booster's +1 is left out of the Speed Factor (Running MP 12, not 13); MegaMek's calculator gives 234 (the boosted Running MP 16, and the Quad Melee System at 5 where WoR p.210 prints the Basilisk (Quad) at 258 only with it at 7.5). ${PM_BOOSTER_BOOK}`, cites: [...PM_BV_CITES, { source: "wor", page: "210" }] },
    // Procyon Z: the list's 180 equals ours (182) less the magnetic clamp's 1 x Speed Factor 1.89
    "mul:106911": { verdict: "mul-suspect", note: "The list's value equals ours (182) when the Magnetic Clamp System is counted at 0; IO:AE p.190 (Wars of Reaving equipment) prints its Item BV as 1.", cites: [{ source: "ioae", page: "190" }] },
    // Roc Z: the list's 221 equals ours (223) less the clamp's 1 x 1.76
    "mul:102356": { verdict: "mul-suspect", note: "The list's value equals ours (223) when the Magnetic Clamp System is counted at 0; IO:AE p.190 (Wars of Reaving equipment) prints its Item BV as 1.", cites: [{ source: "ioae", page: "190" }] },
    // Centaur Z: leaving the clamp out gives 181, still 2 above the list's 179
    "mul:101791": { verdict: "mul-suspect", note: `${PM_MEGAMEK_AGREES} Leaving the Magnetic Clamp System out of ours (IO:AE p.190 prints its BV as 1) gives 181, still 2 above the list.`, cites: [...PM_BV_CITES, { source: "ioae", page: "190" }] },
    // Minotaur Z: leaving the clamp out gives 299, still 4 above the list's 295
    "mul:103374": { verdict: "mul-suspect", note: `${PM_MEGAMEK_AGREES} Leaving the Magnetic Clamp System out of ours (IO:AE p.190 prints its BV as 1) gives 299, still 4 above the list.`, cites: [...PM_BV_CITES, { source: "ioae", page: "190" }] },
    // Orc 2
    "mul:100768": { verdict: "mul-suspect", note: PM_MEGAMEK_AGREES, cites: PM_BV_CITES },
    // Triton 4
    "mul:102487": { verdict: "mul-suspect", note: PM_MEGAMEK_AGREES, cites: PM_BV_CITES },
    // Boggart Ultraheavy ProtoMech 2
    "mul:104076": { verdict: "mul-suspect", note: PM_MEGAMEK_AGREES, cites: PM_BV_CITES },
    // Hobgoblin Ultraheavy ProtoMech 2
    "mul:107455": { verdict: "mul-suspect", note: PM_MEGAMEK_AGREES, cites: PM_BV_CITES },

    // Battle armor (#600, #599): the 21 files where MegaMek and the list agree against ours are the owner calls of 2026-11-23; the rest agree with MegaMek.
    // Afreet Medium Battle Armor (Interdictor)(Sqd4): ours 196, list 189, MegaMek 196
    "mul:107317": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Afreet Medium Battle Armor (Interdictor)(Sqd5): ours 264, list 255, MegaMek 264
    "mul:107628": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Afreet Medium Battle Armor (Interdictor)(Sqd6): ours 339, list 327, MegaMek 339
    "mul:101780": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Ailette Zero-G Engineering Exoskeleton (Sqd4): ours 6, list 20, MegaMek 6
    "mul:107446": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Ailette Zero-G Engineering Exoskeleton (Sqd5): ours 8, list 27, MegaMek 8
    "mul:101823": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Ailette Zero-G Engineering Exoskeleton (Sqd6): ours 10, list 35, MegaMek 10
    "mul:108032": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Amazon Battle Armor [MRR](Sqd6): ours 568, list 566, MegaMek 568
    "mul:104419": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Cavalier II Battle Armor [PPC](Sqd4): ours 311, list 293, MegaMek 311
    "mul:104742": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Cavalier II Battle Armor [PPC](Sqd5): ours 419, list 395, MegaMek 419
    "mul:105917": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Cavalier II Battle Armor [PPC](Sqd6): ours 539, list 507, MegaMek 539
    "mul:106472": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Cavalier II Battle Armor [SRM](Sqd5): ours 340, list 339, MegaMek 340
    "mul:106226": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Cavalier II Battle Armor [SRM](Sqd6): ours 437, list 436, MegaMek 437
    "mul:105884": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Centaur Battle Armor (Sqd4): ours 273, list 269, MegaMek 269
    "mul:107004": { verdict: "mul-suspect", note: BA_CLAMPS, cites: BA_CLAMP_CITES },
    // Centaur Battle Armor (Sqd5): ours 367, list 362, MegaMek 362
    "mul:106620": { verdict: "mul-suspect", note: BA_CLAMPS, cites: BA_CLAMP_CITES },
    // Clan Medium Battle Armor (Naval) 'Bär' (Sqd4): ours 273, list 269, MegaMek 273
    "mul:107786": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Clan Medium Battle Armor (Naval) 'Bär' (Sqd5): ours 368, list 362, MegaMek 368
    "mul:102961": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Clan Medium Battle Armor (Naval) 'Bär' (Sqd6): ours 473, list 465, MegaMek 473
    "mul:104433": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Djinn Battle Armor (Reflective) 'Terrorizer' [Laser] (Sqd4): ours 221, list 211, MegaMek 221
    "mul:101336": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Elemental Battle Armor (Headhunter)(Sqd3): ours 154, list 155, MegaMek 154
    "mul:103825": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Elemental Battle Armor (Headhunter)(Sqd6): ours 385, list 386, MegaMek 385
    "mul:103636": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Elemental III Battle Armor [AP Gauss](Sqd4): ours 395, list 396, MegaMek 395
    "mul:101825": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Elemental III Battle Armor [Flamer](Sqd4): ours 267, list 266, MegaMek 267
    "mul:103702": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Elemental III Battle Armor [Flamer](Sqd5): ours 359, list 357, MegaMek 359
    "mul:103318": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Elemental III Battle Armor [Flamer](Sqd6): ours 462, list 459, MegaMek 462
    "mul:105005": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Elemental III Battle Armor [MicroPL](Sqd5): ours 435, list 434, MegaMek 435
    "mul:103393": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Elemental III Battle Armor [MicroPL](Sqd6): ours 559, list 558, MegaMek 559
    "mul:101040": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Fenrir Battle Armor [VSP](Sqd4): ours 194, list 189, MegaMek 189
    "mul:101508": { verdict: "mul-suspect", note: BA_HEAVY_GRENADE, cites: BA_GRENADE_CITES },
    // Fenrir Battle Armor [VSP](Sqd5): ours 261, list 255, MegaMek 255
    "mul:103152": { verdict: "mul-suspect", note: BA_HEAVY_GRENADE, cites: BA_GRENADE_CITES },
    // Fenrir Battle Armor [VSP](Sqd6): ours 336, list 328, MegaMek 328
    "mul:106183": { verdict: "mul-suspect", note: BA_HEAVY_GRENADE, cites: BA_GRENADE_CITES },
    // Fenrir II Assault Battle Armor (AI)(Sqd6): ours 595, list 592, MegaMek 595
    "mul:106354": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gnome Battle Armor 'Dwarf'(Sqd4): ours 162, list 276, MegaMek 162
    "mul:107303": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gnome Battle Armor (Sqd5): ours 581, list 580, MegaMek 581
    "mul:104415": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gnome Battle Armor (Upgrade) [MRR](Sqd4): ours 408, list 391, MegaMek 408
    "mul:102827": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gnome Battle Armor (Upgrade) [MRR](Sqd5): ours 549, list 526, MegaMek 549
    "mul:101805": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gnome Battle Armor (Upgrade) [MRR](Sqd6): ours 706, list 676, MegaMek 706
    "mul:107320": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gorilla Exoskeleton 'Falcata'(Sqd5): ours 80, list 77, MegaMek 80
    "mul:107065": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gorilla Exoskeleton 'Falcata'(Sqd6): ours 103, list 99, MegaMek 103
    "mul:100283": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gray Death Scout Suit 'The Willow Wisps'(Sqd4): ours 146, list 201, MegaMek 146
    "mul:108449": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gray Death Scout Suit 'The Willow Wisps'(Sqd5): ours 197, list 271, MegaMek 197
    "mul:106219": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gray Death Scout Suit 'The Willow Wisps'(Sqd6): ours 253, list 348, MegaMek 253
    "mul:104648": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gray Death Standard Suit [Laser](Sqd5): ours 303, list 305, MegaMek 303
    "mul:101612": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Gray Death Strike Suit (Prototype)(Sqd4): ours 329, list 328, MegaMek 329
    "mul:102708": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Hantu AIX-210(Sqd6): ours 76, list 72, MegaMek 76
    "mul:101279": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Infiltrator Mk. II Battle Armor (Magnetic)(Sqd4): ours 257, list 253, MegaMek 253
    "mul:106395": { verdict: "mul-suspect", note: BA_CLAMPS, cites: BA_CLAMP_CITES },
    // IS Standard Battle Armor (Baka) [LRR](Sqd4): ours 224, list 191, MegaMek 191
    "mul:100809": { verdict: "mul-suspect", note: BA_BURDENED, cites: BA_BURDENED_CITES },
    // IS Standard Battle Armor (Baka) [LRR](Sqd5): ours 302, list 257, MegaMek 257
    "mul:103394": { verdict: "mul-suspect", note: BA_BURDENED, cites: BA_BURDENED_CITES },
    // IS Standard Battle Armor (Baka) [SL](Sqd4): ours 207, list 182, MegaMek 182
    "mul:101404": { verdict: "mul-suspect", note: BA_BURDENED, cites: BA_BURDENED_CITES },
    // IS Standard Battle Armor (Baka) [SL](Sqd5): ours 279, list 245, MegaMek 245
    "mul:101987": { verdict: "mul-suspect", note: BA_BURDENED, cites: BA_BURDENED_CITES },
    // IS Standard Battle Armor (Baka) [SL](Sqd6): ours 359, list 315, MegaMek 315
    "mul:106111": { verdict: "mul-suspect", note: BA_BURDENED, cites: BA_BURDENED_CITES },
    // Kage Light Battle Armor [ECM](Sqd5): ours 152, list 153, MegaMek 152
    "mul:106331": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Kage Light Battle Armor [Flamer](Sqd4): ours 111, list 117, MegaMek 117
    "mul:101873": { verdict: "mul-suspect", note: BA_SUPPORT_WEAPON, cites: BA_BV_CITES },
    // Kage Light Battle Armor [Laser](Sqd4): ours 116, list 126, MegaMek 126
    "mul:102070": { verdict: "mul-suspect", note: BA_SUPPORT_WEAPON, cites: BA_BV_CITES },
    // Kage Light Battle Armor [MG](Sqd4): ours 111, list 117, MegaMek 117
    "mul:102457": { verdict: "mul-suspect", note: BA_SUPPORT_WEAPON, cites: BA_BV_CITES },
    // Kanazuchi Assault Battle Armor 'Cyclops'(Sqd4): ours 558, list 630, MegaMek 558
    "mul:106307": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Kanazuchi Assault Battle Armor 'Cyclops'(Sqd5): ours 752, list 848, MegaMek 752
    "mul:104462": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Kanazuchi Assault Battle Armor 'Cyclops'(Sqd6): ours 967, list 1090, MegaMek 967
    "mul:100970": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Kanazuchi Assault Battle Armor (Support)(Sqd4): ours 368, list 365, MegaMek 368
    "mul:107761": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Kanazuchi Assault Battle Armor (Support)(Sqd5): ours 496, list 491, MegaMek 496
    "mul:100004": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Kanazuchi Assault Battle Armor (Support)(Sqd6): ours 638, list 632, MegaMek 638
    "mul:108284": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Kanazuchi Assault Battle Armor (Upgrade) [Battle Claw](Sqd5): ours 470, list 471, MegaMek 470
    "mul:108486": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Longinus Battle Armor (Magnetic)(Sqd4): ours 251, list 247, MegaMek 247
    "mul:107855": { verdict: "mul-suspect", note: BA_CLAMPS, cites: BA_CLAMP_CITES },
    // Nephilim Assault Battle Armor (Narc)(Sqd5): ours 552, list 522, MegaMek 552
    "mul:104309": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Nephilim Assault Battle Armor (Plasma)(Sqd4): ours 366, list 336, MegaMek 366
    "mul:108478": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Ogre Battle Armor (Interdictor)(Sqd4): ours 342, list 341, MegaMek 342
    "mul:102860": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Ravager Assault Battle Armor (LRM)(Sqd5): ours 544, list 543, MegaMek 544
    "mul:100647": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Ravager Assault Battle Armor (LRM)(Sqd6): ours 700, list 699, MegaMek 700
    "mul:100843": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Resgate PA(L) (Support)(Sqd6): ours 163, list 203, MegaMek 163
    "mul:107952": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Rhino Battle Armor (Sqd4): ours 352, list 473, MegaMek 352
    "mul:106721": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Rhino Battle Armor (Sqd5): ours 474, list 568, MegaMek 474
    "mul:108030": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Rhino Battle Armor (Sqd6): ours 609, list 731, MegaMek 609
    "mul:103833": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Salamander Battle Armor (Laser)(Sqd4): ours 293, list 292, MegaMek 293
    "mul:106224": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Se'irim Medium Battle Armor (Anti-Infantry)(Sqd4): ours 201, list 241, MegaMek 201
    "mul:100418": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Se'irim Medium Battle Armor (Anti-Infantry)(Sqd5): ours 270, list 324, MegaMek 270
    "mul:100293": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Se'irim Medium Battle Armor (Anti-Infantry)(Sqd6): ours 347, list 416, MegaMek 347
    "mul:101935": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Shedu Assault Battle Armor (PPC)(Sqd4): ours 376, list 360, MegaMek 376
    "mul:108152": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Shedu Assault Battle Armor (PPC)(Sqd5): ours 507, list 485, MegaMek 507
    "mul:104116": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Shedu Assault Battle Armor (PPC)(Sqd6): ours 651, list 624, MegaMek 651
    "mul:107413": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Shedu Assault Battle Armor (Support)(Sqd4): ours 360, list 364, MegaMek 360
    "mul:100031": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Shedu Assault Battle Armor (Support)(Sqd5): ours 485, list 490, MegaMek 485
    "mul:101483": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Shedu Assault Battle Armor (Support)(Sqd6): ours 624, list 631, MegaMek 624
    "mul:104111": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Stormbird Battle Armor (Sqd4): ours 472, list 470, MegaMek 472
    "mul:106685": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Stormbird Battle Armor (Sqd5): ours 635, list 633, MegaMek 635
    "mul:101978": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Stormbird Battle Armor (Sqd6): ours 817, list 813, MegaMek 817
    "mul:108206": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Surat (Gray Death) Solahma Suit (Sqd4): ours 267, list 265, MegaMek 267
    "mul:107656": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Surat (Gray Death) Solahma Suit (Sqd5): ours 359, list 357, MegaMek 359
    "mul:108483": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Surat (Gray Death) Solahma Suit (Sqd6): ours 462, list 459, MegaMek 462
    "mul:104475": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Sylph Battle Armor 'TinkerBelle'(Sqd4): ours 272, list 271, MegaMek 272
    "mul:107030": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Tornado PA(L) P12 'Hurricane'(Sqd5): ours 63, list 64, MegaMek 63
    "mul:102422": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Tornado PA(L) P12 'Hurricane'(Sqd6): ours 81, list 82, MegaMek 81
    "mul:104902": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Tortoise II (SRM)(Sqd6): ours 1365, list 1364, MegaMek 1365
    "mul:108531": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Trinity Medium Battle Armor (Asterion Upgrade)[MRR](Sqd4): ours 231, list 251, MegaMek 231
    "mul:108579": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Trinity Medium Battle Armor (Asterion Upgrade)[MRR](Sqd5): ours 311, list 338, MegaMek 311
    "mul:100322": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Trinity Medium Battle Armor (Asterion Upgrade)[MRR](Sqd6): ours 400, list 435, MegaMek 400
    "mul:102965": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Trinity Medium Battle Armor (Theseus RL)[LRR](Sqd4): ours 251, list 203, MegaMek 203
    "mul:107712": { verdict: "mul-suspect", note: BA_BURDENED, cites: BA_BURDENED_CITES },
    // Trinity Medium Battle Armor (Theseus RL)[LRR](Sqd5): ours 338, list 273, MegaMek 273
    "mul:103249": { verdict: "mul-suspect", note: BA_BURDENED, cites: BA_BURDENED_CITES },
    // Trinity Medium Battle Armor (Theseus RL)[LRR](Sqd6): ours 435, list 352, MegaMek 352
    "mul:105167": { verdict: "mul-suspect", note: BA_BURDENED, cites: BA_BURDENED_CITES },
    // Tunnel Rat IV Mining Exoskeleton [Armored Glove/LMG](Sqd4): ours 71, list 54, MegaMek 71
    "mul:105998": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Tunnel Rat IV Mining Exoskeleton [Armored Glove/LMG](Sqd5): ours 96, list 73, MegaMek 96
    "mul:101429": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Tunnel Rat IV Mining Exoskeleton [Armored Glove/LMG](Sqd6): ours 123, list 94, MegaMek 123
    "mul:104977": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Tunnel Rat IV Mining Exoskeleton [Battle Claw/GL](Sqd4): ours 51, list 44, MegaMek 44
    "mul:105670": { verdict: "mul-suspect", note: BA_HEAVY_GRENADE, cites: BA_GRENADE_CITES },
    // Tunnel Rat IV Mining Exoskeleton [Battle Claw/GL](Sqd5): ours 69, list 60, MegaMek 60
    "mul:105550": { verdict: "mul-suspect", note: BA_HEAVY_GRENADE, cites: BA_GRENADE_CITES },
    // Tunnel Rat IV Mining Exoskeleton [Battle Claw/GL](Sqd6): ours 88, list 77, MegaMek 77
    "mul:107623": { verdict: "mul-suspect", note: BA_HEAVY_GRENADE, cites: BA_GRENADE_CITES },
    // Undine Battle Armor 'Sebastian'(Sqd4): ours 227, list 229, MegaMek 227
    "mul:104358": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Void Medium Battle Armor (Minelayer)(Sqd4): ours 314, list 312, MegaMek 314
    "mul:107186": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Void Medium Battle Armor Caltrop(Sqd4): ours 381, list 425, MegaMek 381
    "mul:103255": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Void Medium Battle Armor Caltrop(Sqd5): ours 513, list 573, MegaMek 513
    "mul:100566": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Void Medium Battle Armor Caltrop(Sqd6): ours 659, list 735, MegaMek 659
    "mul:102619": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },
    // Warg Assault Battle Armor (Reactive)(Sqd5): ours 758, list 756, MegaMek 758
    "mul:104527": { verdict: "mul-suspect", note: BA_MEGAMEK_AGREES, cites: BA_BV_CITES },

    // ---- Support Vehicles (the Support Vehicle round, #599, #600) ----
    "mul:106966": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:100535": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:106494": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:102498": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    // Bishop Transport VTOL: ours 190 carries Environmental Sealing's +0.1; MegaMek's 171 leaves it out. The list's 199 is not reproduced.
    "mul:107980": { verdict: "mul-suspect", note: `${SV_SEALING} The list's 199 is not reproduced by any reading found.`, cites: [...SV_BV_CITES, { source: "toaue", page: "193" }] },
    // Büffel VII and VIII: the Bulldozer's 10 is defensive only.
    "mul:103061": { verdict: "mul-suspect", note: SV_BULLDOZER, cites: [{ source: "tm", page: "307" }, { source: "tm", page: "317" }] },
    "mul:107851": { verdict: "mul-suspect", note: SV_BULLDOZER, cites: [{ source: "tm", page: "307" }, { source: "tm", page: "317" }] },
    "mul:105171": { verdict: "mul-suspect", note: SV_BULLDOZER, cites: [{ source: "tm", page: "307" }, { source: "tm", page: "317" }] },
    "mul:104420": { verdict: "mul-suspect", note: SV_BULLDOZER, cites: [{ source: "tm", page: "307" }, { source: "tm", page: "317" }] },
    "mul:106528": { verdict: "mul-suspect", note: `${SV_BULLDOZER} The Oppie rates at Speed Factor 0.77, so 7.7 more; TRO 3075 p.63 prints 903.`, cites: [{ source: "tm", page: "317" }, { source: "tro-3075", page: "63" }] },
    "mul:102729": { verdict: "mul-suspect", note: `${SV_BULLDOZER} The Oppie rates at Speed Factor 0.77, so 7.7 more; TRO 3075 p.63 prints 903.`, cites: [{ source: "tm", page: "317" }, { source: "tro-3075", page: "63" }] },
    "mul:107347": { verdict: "mul-suspect", note: "Touring the Stars: Tortuga Prime p.10 prints 43, and the list copies it. The Debbie's armor and structure alone rate 121.77 (60 points x 2.5 x 0.5 + 32 x 1.5, x 0.9 tracked, x 1.1), before its eighteen flamers and machine guns; MegaMek's calculator gives 232.", cites: [...SV_BV_CITES, { source: "tts-tortuga-prime", page: "10" }] },
    "mul:101466": { verdict: "mul-suspect", note: "Touring the Stars: Tortuga Prime p.10 prints 5, and the list copies it. The Outrider's armor and structure alone rate 12.48 (6 points x 2.5 x 0.4 + 4 x 1.5, x 0.8 wheeled, x 1.3), before its support machine gun; MegaMek's calculator gives our 17.", cites: [...SV_BV_CITES, { source: "tts-tortuga-prime", page: "10" }] },
    // Hi-Scout drones: TRO 3039 p.71 prints "Battle Value: N/A" for both.
    "mul:101326": { verdict: "mul-suspect", note: "TRO 3039 p.71 prints no armor for the NapFind (\"Armor Factor (BAR 2): 0\") and no Battle Value (\"N/A\"); the file's front armor point is corrected to the book's 0 (blk-design-corrections). MegaMek's 11 and the list's count that point.", cites: [...SV_BV_CITES, { source: "tro-3039", page: "71" }] },
    "mul:100023": { verdict: "mul-suspect", note: `TRO 3039 p.71 prints no Battle Value for the PathTrak ("N/A"). ${SV_MEGAMEK_AGREES}`, cites: [...SV_BV_CITES, { source: "tro-3039", page: "71" }] },
    "mul:101317": { verdict: "mul-suspect", note: SV_SMALLS, cites: SV_BV_CITES },
    "mul:103121": { verdict: "mul-suspect", note: SV_SMALLS, cites: SV_BV_CITES },
    "mul:104556": { verdict: "mul-suspect", note: SV_SMALLS, cites: SV_BV_CITES },
    "mul:102004": { verdict: "mul-suspect", note: SV_SMALLS, cites: SV_BV_CITES },
    "mul:106126": { verdict: "mul-suspect", note: `${SV_SMALLS} The SRM variant's 18 is the base Minigun Cycle's.`, cites: SV_BV_CITES },
    "mul:107444": { verdict: "mul-suspect", note: SV_SMALLS, cites: SV_BV_CITES },
    "mul:103497": { verdict: "mul-suspect", note: SV_SMALLS, cites: SV_BV_CITES },
    "mul:102245": { verdict: "mul-suspect", note: SV_SMALLS, cites: SV_BV_CITES },
    "mul:101765": { verdict: "mul-suspect", note: SV_SMALLS, cites: SV_BV_CITES },
    "mul:106136": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:100842": { verdict: "mul-suspect", note: `TRO 3085 p.54 prints 351 for the J-37, as ours. ${SV_MEGAMEK_AGREES}`, cites: [...SV_BV_CITES, { source: "tro-3085", page: "54" }] },
    "mul:103863": { verdict: "mul-suspect", note: `The current J-37's printed 351 (TRO 3085 p.54) is ours by the same steps; the original's BAR 5 armor and small laser give 206. ${SV_MEGAMEK_AGREES}`, cites: [...SV_BV_CITES, { source: "tro-3085", page: "54" }] },
    "mul:104699": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:104721": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:103836": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:105280": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:106376": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:107846": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:102131": { verdict: "mul-suspect", note: `TRO: Irregulars prints 173 for the base Prime Mover; the list's 284 is for this LRM version. ${SV_MEGAMEK_AGREES}`, cites: SV_BV_CITES },
    "mul:106586": { verdict: "mul-suspect", note: `TRO 3075 p.222 prints 747, as ours. ${SV_MEGAMEK_AGREES}`, cites: [...SV_BV_CITES, { source: "tro-3075", page: "222" }] },
    "mul:101948": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:104633": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:103797": { verdict: "mul-suspect", note: SV_MEGAMEK_AGREES, cites: SV_BV_CITES },
    "mul:106083": { verdict: "mul-suspect", note: "IO:AE p.189 prints 17 BV a ton for Primitive Prototype AC/20 ammunition; the four tons give 68. MegaMek's calculator and the list count it as standard AC/20 ammunition, 22 a ton (88), which gives 732.", cites: [{ source: "ioae", page: "189" }] },
    "mul:107507": { verdict: "mul-suspect", note: `TRO 3085 p.52 prints 189, as ours. ${SV_MEGAMEK_AGREES}`, cites: [...SV_BV_CITES, { source: "tro-3085", page: "52" }] },
};

/**
 * Verdicts on bundled designs the Master Unit List has no Battle Value for, so no MUL figure can differ: ours against
 * MegaMek's calculator, by file. They are kept apart from BV_VERDICTS, whose keys must be units that still differ from the list.
 */
export interface INoMulVerdict {
    /** MegaMek's calculator gives another value; the book is followed. */
    verdict: "megamek-differs";
    note: string;
    cites: ICalcCitation[];
}

/**
 * Giant, Main and Swift Guardian (Shrapnel, Volume 21): each carries a Smart Robotic Control System. Ours applies the
 * Battle Value multiplier IO:AE p.187 prints for it (x 0.85 here); MegaMek's calculator leaves it out and gives 803, 640
 * and 106 against our 683, 544 and 90 (NGCFells 2026-11-23: keep the book).
 */
const SRCS_BOOK_FOLLOWED = "MegaMek's calculator gives a higher value because it leaves out the Smart Robotic Control System multiplier that IO:AE p.187 prints for the Battle Value (x 0.85 on this design). The book is followed.";
/**
 * The Gothic 'Mechs MegaMek's files hold and the Master Unit List lacks (Firestarter FS9-HB, Marauder MAD-3H, King Crab KGC-0KP and the Shrapnel Phoenix
 * Hawk 'Hammer Hawk'): each carries Light Blazers, a Gothic-only laser. BattleTech Gothic prints its heat 6, damage 7 and ranges 3 / 6 / 9 (Weapons and
 * Equipment Table, p.93) and no Battle Value, so ours is derived (equipment-energy.ts: its 7 damage over the 9 hexes it reaches, 63); MegaMek's own table
 * gives 65. The whole difference is that 2 a blazer, times the Speed Factor, with the blazers past the heat efficiency counted half. Ours stands, as
 * an inferred figure for NGCFells to review.
 */
const LIGHT_BLAZER_INFERRED = "Our Battle Value for the Light Blazer, 63, is derived because BattleTech Gothic (p.93) prints its heat, damage and ranges and no Battle Value; MegaMek's table gives 65. Each blazer's 2 BV, times the Speed Factor and with the blazers past the heat efficiency halved, is the whole difference. Ours stands as an inferred figure.";
const GOTHIC_CITES: ICalcCitation[] = [{ source: "gothic", page: "93" }];
/**
 * The three of the "7 MegaMek BV gaps" (#600) where ours stands. The Air Car and the Brunel Dump Truck (LRM) have no Master Unit List value; neither file carries
 * a "barrating" tag, and MegaMek then counts the armor at BAR 0, which adds nothing, while both give standard armor, BAR 10 (TM p.134). For the Brunel, Historical:
 * Operation Klondike says both armed Brunels "carry some nine and a half tons of standard armor" (152 points at 16 a ton). The Interdictor Pocket WarShip's
 * missile bins hold their rounds pro rata, where MegaMek rounds each bin down to whole tons; the book's partial-ton rules (TM p.306 for a ProtoMech's ammunition by
 * the kilogram, p.310 for battle armor's) keep the fraction and say nothing about rounding down.
 */
const BAR_BOOK_FOLLOWED = "MegaMek's calculator gives a lower value because the file carries no BAR rating, which it then reads as BAR 0 and counts the armor at nothing; the file gives standard armor, BAR 10 (TM p.134); the book is followed.";
export const NO_MUL_VERDICTS: Record<string, INoMulVerdict> = {
    "file:vehicles/Shrapnel/Vol 21/Giant Guardian.blk": { verdict: "megamek-differs", note: `Ours 683, MegaMek 803. ${SRCS_BOOK_FOLLOWED}`, cites: [{ source: "ioae", page: "187" }] },
    "file:vehicles/Shrapnel/Vol 21/Main Guardian.blk": { verdict: "megamek-differs", note: `Ours 544, MegaMek 640. ${SRCS_BOOK_FOLLOWED}`, cites: [{ source: "ioae", page: "187" }] },
    "file:vehicles/Shrapnel/Vol 21/Swift Guardian Tank.blk": { verdict: "megamek-differs", note: `Ours 90, MegaMek 106. ${SRCS_BOOK_FOLLOWED}`, cites: [{ source: "ioae", page: "187" }] },
    // 'Mechs MegaMek's files hold and the Master Unit List lacks (the custom unit list's own records): ours against MegaMek's calculator on the same file.
    "file:megamek/Gothic/Firestarter FS9-HB.mtf": { verdict: "megamek-differs", note: `Ours 746, MegaMek 754. ${LIGHT_BLAZER_INFERRED}`, cites: GOTHIC_CITES },
    "file:megamek/Gothic/Marauder MAD-3H.mtf": { verdict: "megamek-differs", note: `Ours 1,388, MegaMek 1,396. ${LIGHT_BLAZER_INFERRED}`, cites: GOTHIC_CITES },
    "file:megamek/Gothic/King Crab KGC-0KP.mtf": { verdict: "megamek-differs", note: `Ours 1,891, MegaMek 1,893. ${LIGHT_BLAZER_INFERRED}`, cites: GOTHIC_CITES },
    "file:megamek/Shrapnel/Gothic/Phoenix Hawk 'Hammer Hawk' PXH-1S.mtf": { verdict: "megamek-differs", note: `Ours 1,075, MegaMek 1,080. ${LIGHT_BLAZER_INFERRED}`, cites: GOTHIC_CITES },
    // Hobbled Scarecrow: two B-Pods in the legs. The Battle Value table treats a B-Pod as a Gauss weapon in the defensive rating, 1 point a slot (TM p.317, as for the Scarecrow UCU-F4 on the list); MegaMek's calculator does not count them.
    "file:megamek/3145/Davion/Scarecrow UCU-F4 Hobbled Scarecrow.mtf": { verdict: "megamek-differs", note: "Ours 1,431, MegaMek 1,433. MegaMek's calculator leaves out the 2 points the table's Gauss-weapon rule takes for the two B-Pods; the book is followed.", cites: [{ source: "tm", page: "317" }] },
    // Air Car, Brunel Dump Truck (LRM) and Interdictor Pocket WarShip: the three of the "7 MegaMek BV gaps" where ours stands (#600).
    "file:vehicles/3025 IS Land/Air Car.blk": { verdict: "megamek-differs", note: `Ours 154, MegaMek 75. ${BAR_BOOK_FOLLOWED}`, cites: [{ source: "tm", page: "134" }] },
    "file:vehicles/Operation Klondike/Brunel Dump Truck LRM.blk": { verdict: "megamek-differs", note: `Ours 1,330, MegaMek 965. ${BAR_BOOK_FOLLOWED} Operation Klondike gives the armed Brunels nine and a half tons of standard armor, 152 points.`, cites: [{ source: "tm", page: "134" }] },
    "file:dropships/TRO3085/Cutting Edge/IS/Interdictor Pocket Warship.blk": { verdict: "megamek-differs", note: "Ours 20,670, MegaMek 20,648. MegaMek's calculator rounds each Medium Missile Launcher bin down to whole tons (the nose's 44 LRM and 52 SRM rounds count as 3 and 4 tons); ours counts the rounds carried pro rata, as the book's partial-ton rules do and does not say to round down.", cites: [{ source: "tm", page: "306" }, { source: "tm", page: "310" }] },
};

/** "mul:<id>", "mul:<id>:<configuration>", or "file:<path>" where the Master Unit List has no entry. */
export const bvVerdictKey = (miss: IBundledMiss): string => {
    if (miss.mulId === null) return `file:${miss.file}`;
    return miss.config ? `mul:${miss.mulId}:${miss.config}` : `mul:${miss.mulId}`;
};

const lookUp = (verdicts: Record<string, IBvVerdict>, key: string): IBvVerdict | undefined =>
    Object.prototype.hasOwnProperty.call(verdicts, key) ? verdicts[key] : undefined;

/** The verdict entry for a miss, if one has been written. */
export const getBvVerdictEntry = (miss: IBundledMiss, verdicts: Record<string, IBvVerdict> = BV_VERDICTS): IBvVerdict | undefined =>
    lookUp(verdicts, bvVerdictKey(miss));

/** "open" when no verdict has been written for the miss. */
export const getBvVerdict = (miss: IBundledMiss, verdicts: Record<string, IBvVerdict> = BV_VERDICTS): BvVerdict =>
    getBvVerdictEntry(miss, verdicts)?.verdict ?? "open";

/** Verdict keys that match no unit in the record: the unit now matches, or its key changed. */
export const findStaleVerdictKeys = (verdicts: Record<string, IBvVerdict>, differs: IBundledMiss[]): string[] => {
    const keys = new Set(differs.map(bvVerdictKey));
    return Object.keys(verdicts).filter((key) => !keys.has(key));
};

/** What is wrong with the verdict entries, in words. Empty when they are clean. */
export const findVerdictProblems = (verdicts: Record<string, IBvVerdict>): string[] => {
    const problems: string[] = [];
    for (const [key, entry] of Object.entries(verdicts)) {
        if (!entry.note.trim()) problems.push(`${key}: no note`);
        if (entry.verdict === "mul-suspect" && !entry.cites?.length) problems.push(`${key}: mul-suspect needs a citation`);
        if (entry.verdict === "our-bug" && typeof entry.issue !== "number") problems.push(`${key}: our-bug needs an issue`);
    }
    return problems;
};
