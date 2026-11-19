/**
 * Verdicts on the units whose Battle Value differs from the Master Unit List's (#599), kept by hand.
 *
 * The bundle build records every difference in src/data/bundled/<type>-accuracy.json. A difference stays "open" until
 * someone has read the rule and decided what it is: our bug (with the issue that tracks it), a fault in the file we
 * import, or a Master Unit List figure the rules do not support (with the citation). Nothing here changes a number.
 */
import type { IBundledMiss } from "./bundled-mechs-build";
import type { ICalcCitation } from "./calc-steps";

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

/** The count of Master Unit List 'Mech entries with a matching design that the last build wrote. A round that raises the count raises this. */
export const MECH_MATCHED_FLOOR = 3942;

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
