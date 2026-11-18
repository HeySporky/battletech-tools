/**
 * 'Mech Battle Value 2 step definitions (#599): where each step of the calculation comes from.
 *
 * Every entry was read on the page it cites, on 2026-11-10; what each page says and how the code compares is in
 * docs/superpowers/plans/2026-11-10-cited-bv-ledger.md. `provisional` marks a step the books do not settle (or
 * settle two ways); its note says what we do and why. Change a citation only after reading the page.
 */
import { CalcStepDefs, CalcStepStatus, ICalcCitation, ICalcStepDef } from "./calc-steps";

const DEFENSIVE = "Defensive Battle Rating";
const OFFENSIVE = "Offensive Battle Rating";
const FINAL = "Final Battle Value";

const at = (source: string, page: string): ICalcCitation => ({ source, page });
const step = (section: string, cites: ICalcCitation[], status: CalcStepStatus = "cited", note?: string): ICalcStepDef =>
    note ? { section, cites, status, note } : { section, cites, status };
const provisional = (section: string, cites: ICalcCitation[], note: string): ICalcStepDef => step(section, cites, "provisional", note);

export const MECH_BV2_STEPS: CalcStepDefs = {
    // ---- Step 1: Defensive Battle Rating ----
    // Armor factor x 2.5 x the Armor Type Modifier (TM tables p.315; advanced types TO:AUE p.192).
    "bv2.def.armor": step(DEFENSIVE, [at("tm", "302"), at("tm", "315"), at("toaue", "192")]),
    "bv2.def.armor.dark-age": provisional(DEFENSIVE, [at("ioae", "185"), at("ioae", "190")],
        "The book prints two sets of multipliers. The table on p.185 gives Heat-Dissipating 1.05, Impact-Resistant 1 and Ballistic-Reinforced 1.2; the table on p.190 gives Heat-Dissipating 1.1, none for Impact-Resistant and Ballistic-Reinforced 1.5. Both give Anti-Penetrative Ablation 1.2. Errata v3.01 does not settle it. NGCFells uses p.190: it matches the 2016 Interstellar Operations tables, and the Master Unit List and published record sheets compute with it (every design we hold with these armors matches only on p.190's figures)."),
    "bv2.def.armor.patchwork": step(DEFENSIVE, [at("toaue", "194")]),
    "bv2.def.armor.torso-cockpit": step(DEFENSIVE, [at("toaue", "193")]),
    "bv2.def.armor.modular": step(DEFENSIVE, [at("toaue", "192")]),
    "bv2.def.armor.harjel": step(DEFENSIVE, [at("ioae", "185")]),
    "bv2.def.armor.blue-shield": step(DEFENSIVE, [at("toaue", "192")]),
    // Internal structure points x 1.5 x the structure type modifier (TM p.315; addendum TO:AUE p.194).
    "bv2.def.structure": step(DEFENSIVE, [at("tm", "302"), at("tm", "315"), at("toaue", "194")]),
    "bv2.def.structure.frankenmech": provisional(DEFENSIVE, [at("tm", "302")],
        "No rule covers a 'Mech of mixed internal structure types. Each location's points take that location's own type modifier."),
    // The engine type modifier on the structure figure (TM p.315; XXL and large engines TO:AUE p.193).
    "bv2.def.engine": step(DEFENSIVE, [at("tm", "302"), at("tm", "315"), at("toaue", "193")]),
    "bv2.def.engine.superheavy": step(DEFENSIVE, [at("ioae", "187-188")]),
    // Tonnage x the gyro modifier; a Superheavy's or a gyroless interface 'Mech's counts as standard (IO:AE p.187).
    "bv2.def.gyro": step(DEFENSIVE, [at("tm", "302"), at("tm", "315"), at("ioae", "187")]),
    "bv2.def.equipment": step(DEFENSIVE, [at("tm", "302")]),
    "bv2.def.equipment.ams-ammo": step(DEFENSIVE, [at("tm", "302")]),
    "bv2.def.equipment.armored": step(DEFENSIVE, [at("toaue", "192"), at("toaue", "195")]),
    "bv2.def.equipment.armored-gyro": provisional(DEFENSIVE, [at("toaue", "192")],
        "The rule is 5 percent of the protected item's BV for each slot, or 5 points a slot for an item with no BV. A gyro has no BV in the tables; NGCFells counts its gyro points (tonnage x gyro modifier) as its BV."),
    "bv2.def.equipment.total": step(DEFENSIVE, [at("tm", "302")]),
    // 15 points for each slot of explosive ammunition that the location's CASE, tech base and engine do not excuse.
    "bv2.def.explosive.ammo": step(DEFENSIVE, [at("tm", "302-303"), at("toaue", "193")]),
    "bv2.def.explosive.lam-store": step(DEFENSIVE, [at("ioae", "186")]),
    // 1 point for each slot of a Gauss weapon, or of an item the tables mark "treat as Gauss" or "explodes".
    "bv2.def.explosive.component": step(DEFENSIVE, [at("tm", "303"), at("toaue", "192-193"), at("toaue", "195")]),
    "bv2.def.explosive.jump-jet": provisional(DEFENSIVE, [at("tm", "303"), at("ioae", "97")],
        "Prototype improved jump jets explode when hit, but no Battle Value rule names them. NGCFells counts each slot as an explosive component: 1 point."),
    "bv2.def.explosive.protected": step(DEFENSIVE, [at("tm", "302-303"), at("toaue", "193")]),
    "bv2.def.explosive.arm-case-xl": provisional(DEFENSIVE, [at("tm", "302")],
        "For a 'Mech with an Inner Sphere XL engine the rule counts explosive ammunition in any location. We do not count an arm that has its own CASE, since that CASE keeps the blast out of the side torso."),
    "bv2.def.explosive.superheavy": step(DEFENSIVE, [at("ioae", "188")]),
    // Prototype CASE: "Ammo critical slots count as -8 BV, rather than -15" (IO:AE p.189 table).
    "bv2.def.explosive.prototype-case": step(DEFENSIVE, [at("ioae", "189")]),
    "bv2.def.harjel-slots": step(DEFENSIVE, [at("ioae", "185")]),
    "bv2.def.subtotal": step(DEFENSIVE, [at("tm", "302-303")]),
    "bv2.def.floor": step(DEFENSIVE, [at("tm", "302")]),
    // The highest target movement modifier the 'Mech can reach: running or jumping (+1), MASC and TSM counted.
    "bv2.def.tmm": step(DEFENSIVE, [at("tm", "303"), at("tm", "316"), at("tw", "117"), at("toaue", "192"), at("toaue", "194")]),
    "bv2.def.tmm.lam": step(DEFENSIVE, [at("ioae", "186")]),
    "bv2.def.tmm.umu": provisional(DEFENSIVE, [at("toaue", "192")],
        "The rule says to calculate a UMU system as if it were jump jets. NGCFells uses the UMU movement modifier without the +1 a jump earns, because a submerged 'Mech is not airborne."),
    "bv2.def.factor": step(DEFENSIVE, [at("tm", "303"), at("tm", "316")]),
    // Stealth armor at its greatest effect: +2 to hit at long range.
    "bv2.def.factor.stealth": step(DEFENSIVE, [at("tm", "303"), at("tw", "142")]),
    "bv2.def.factor.null-signature": step(DEFENSIVE, [at("toaue", "194"), at("toaue", "148")]),
    "bv2.def.factor.chameleon": step(DEFENSIVE, [at("toaue", "193"), at("toaue", "112")]),
    "bv2.def.factor.void-signature": step(DEFENSIVE, [at("toaue", "194")]),
    "bv2.def.factor.power-armor": provisional(DEFENSIVE, [at("best-of-future-wars", "14"), at("tm", "304")],
        "Custom Homebrew, by NGCFells: Bill Swisher's Power Armor gives no Battle Value. His rules put attacks on a suit at +1 to hit, so NGCFells counts it as one more point of Target Movement Modifier: +0.1 to the Defensive Factor (TM p.304)."),
    "bv2.def.rating": step(DEFENSIVE, [at("tm", "303")]),

    // ---- Step 2: Offensive Battle Rating ----
    "bv2.off.ammo": step(OFFENSIVE, [at("tm", "303"), at("tm", "317-318")]),
    // Ammunition no mounted weapon fires: capped at that weapon's BV, which is nothing.
    "bv2.off.ammo.unused": step(OFFENSIVE, [at("tm", "303")]),
    "bv2.off.ammo.cap": step(OFFENSIVE, [at("tm", "303")]),
    "bv2.off.ammo.total": step(OFFENSIVE, [at("tm", "303-304")]),
    // 6 + heat sink capacity - the heat of the hottest movement (stealth armor +10; an ICE IndustrialMech 0).
    "bv2.off.heat.efficiency": step(OFFENSIVE, [at("tm", "303")]),
    "bv2.off.heat.radical": provisional(OFFENSIVE, [at("ioae", "185"), at("ioae", "190")],
        "The rule text on p.185 says to multiply the heat sink capacity by 1.4, but its own example (15 double heat sinks give 36) and the table on p.190 add the number of heat sinks x 0.4, rounded up. NGCFells follows the table and the example's result."),
    "bv2.off.heat.signature": provisional(OFFENSIVE, [at("tm", "303"), at("toaue", "112, 148, 161")],
        "No rule says how the heat a Null-Signature, Void-Signature or Chameleon system makes while it runs enters the calculation. NGCFells takes it off the heat efficiency, as stealth armor's 10 points come off through movement heat."),
    "bv2.off.heat.partial-wing": provisional(OFFENSIVE, [at("toaue", "192"), at("toaue", "105")],
        "The Battle Value rule for a partial wing names only its jump bonus. NGCFells also adds the heat it sheds in a standard atmosphere to the heat efficiency."),
    "bv2.off.heat.lam": step(OFFENSIVE, [at("ioae", "186")]),
    "bv2.off.heat.emergency-coolant": step(OFFENSIVE, [at("ioae", "190")]),
    "bv2.off.heat.coolant-pod": step(OFFENSIVE, [at("toaue", "193")]),
    // Total weapon heat: Ultra x 2, rotary x 6, Streak half, one-shot a quarter; insulators and capacitors counted.
    "bv2.off.heat.weapons": step(OFFENSIVE, [at("tm", "303"), at("toaue", "194"), at("ioae", "186")]),
    // Weapons in order of Modified BV, the least heat first among equals, each at full value until the heat runs out.
    "bv2.off.weapon": step(OFFENSIVE, [at("tm", "303-304"), at("tm", "317-318")]),
    "bv2.off.weapon.rear": step(OFFENSIVE, [at("tm", "303")]),
    "bv2.off.weapon.turret": step(OFFENSIVE, [at("toaue", "194")]),
    "bv2.off.weapon.overheat": step(OFFENSIVE, [at("tm", "304")]),
    "bv2.off.weapons.total": step(OFFENSIVE, [at("tm", "304")]),
    "bv2.off.tonnage": step(OFFENSIVE, [at("tm", "304")]),
    "bv2.off.tonnage.tsm": step(OFFENSIVE, [at("tm", "304"), at("ioae", "186")]),
    "bv2.off.tonnage.aes": step(OFFENSIVE, [at("toaue", "192")]),
    // Running MP + half the Jumping MP, rounded up, against the Speed Factor Table.
    "bv2.off.speed": step(OFFENSIVE, [at("tm", "304"), at("tm", "316"), at("toaue", "192")]),
    "bv2.off.speed.lam": step(OFFENSIVE, [at("ioae", "186")]),
    "bv2.off.rating": step(OFFENSIVE, [at("tm", "304")]),
    "bv2.off.industrial": step(OFFENSIVE, [at("tm", "304")]),

    // ---- Step 3: Final Battle Value ----
    "bv2.final.sum": step(FINAL, [at("tm", "304")]),
    // Small cockpit x 0.95 (TM); torso-mounted x 0.95 (TO:AUE); interface cockpit x 1.3 (IO:AE).
    "bv2.final.cockpit": step(FINAL, [at("tm", "304"), at("toaue", "193"), at("ioae", "187")]),
    "bv2.final.drone": step(FINAL, [at("toaue", "193")]),
    "bv2.final.robotic": step(FINAL, [at("ioae", "187")]),
    "bv2.final.override-kit": step(FINAL, [at("ioae", "190")]),
    "bv2.final.equipment": provisional(FINAL, [],
        "This item's record multiplies the final Battle Value, and its rule has not yet been read on the page."),
    "bv2.final.round": step(FINAL, [at("tm", "302"), at("tm", "304")]),
    "bv2.final.lam-bombs": provisional(FINAL, [at("tm", "315"), at("ioae", "186")],
        "The LAM rules do not say how loaded bombs count. NGCFells adds their BV after rounding, as external stores are added to a fighter's base BV."),
};

/** Where each modifier inside a weapon's Modified BV comes from: added to that weapon's step when it applies. */
export const MECH_BV2_WEAPON_CITES = {
    targetingComputer: at("tm", "303"),
    artemisIV: at("tm", "303"),
    machineGunArray: at("tm", "317"),
    actuatorEnhancement: at("toaue", "192"),
    droneOperatingSystem: at("toaue", "193"),
    apollo: at("toaue", "195"),
    ppcCapacitor: at("toaue", "194"),
} satisfies Record<string, ICalcCitation>;
