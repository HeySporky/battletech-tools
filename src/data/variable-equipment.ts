import { IDamagePerRange, IEquipmentItem } from "./data-interfaces";
import { coilBattleValue, costFromBattleValue, fusionLanceBattleValue, fusionLanceHexDamage } from "./derived-values";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*
* Sizing rules for 'Mech equipment whose weight, slots, cost, damage or BV depend on the * unit (TechManual and Tactical Operations: Advanced Units & Equipment construction rules)
*/

export type VariableEquipmentFormula =
    | "hatchet"
    | "sword"
    | "retractable-blade"
    | "mace"
    | "lance"
    | "claw"
    | "talons"
    | "spikes"
    | "variable-range-targeting"
    | "multi-trac-ii"
    | "masc-is"
    | "masc-clan"
    | "supercharger"
    | "targeting-computer-is"
    | "targeting-computer-clan"
    | "partial-wing-is"
    | "partial-wing-clan"
    | "jump-booster"
    | "tracks"
    | "quadvee-wheels"
    | "environmental-sealing"
    | "extended-fuel-tank"
    | "aes-arm"
    | "aes-leg"
    | "talons"
    | "drone-operating-system"
    | "drone-carrier-control"
    | "cargo-standard"
    | "cargo-liquid"
    | "cargo-insulated"
    | "ram-plate"
    | "naval-c3"
    | "naval-tug-adaptor"
    | "light-sail"
    | "mech-turret"
    | "modular-c3"
    | "fusion-lance"
    | "coil-s"
    | "coil-m"
    | "coil-l";

export interface IVariableEquipmentContext {
    /** Unit tonnage. */
    tonnage: number;
    /** Fusion/ICE engine rating (0 when none). */
    engineRating: number;
    /** Engine weight in tons (0 when none). */
    engineWeight: number;
    /** Tons of direct-fire weapons the targeting computer serves (TM p.238). */
    directFireWeaponWeight: number;
    /** Triple-Strength Myomer doubles physical weapon BV (TM p.303). */
    hasTSM?: boolean;
    /** Four-legged chassis (Quad, QuadVee): leg-mounted gear fills more legs. */
    isQuad?: boolean;
    /** Size chosen for the installed item (Mechanical Jump Booster: jump MP; cargo bay: tons). */
    size?: number;
    /** Drones a Drone Carrier Control System controls (TO:AUE p.117). */
    drones?: number;
    /** Tons of weapons and equipment in a BattleMech Turret, not counting ammunition and heat sinks (TO:AUE p.158). */
    turretWeight?: number;
    /** Running MP as Battle Value counts it, MASC and the like included (a Ram Plate's charge). */
    runMP?: number;
    /** Torso locations (left, center, right) that carry Spikes: each adds to a Ram Plate's charge. */
    torsoSpikes?: number;
}

/** Weight class index: 1 light (<= 35 t), 2 medium (<= 55), 3 heavy (<= 75), 4 assault and heavier. */
export function weightClassIndex(tonnage: number): number {
    if (tonnage <= 35) return 1;
    if (tonnage <= 55) return 2;
    if (tonnage <= 75) return 3;
    return 4;
}

export interface IVariableEquipmentSize {
    weight: number;
    slots: number;
    cbills: number;
    damage?: number | IDamagePerRange;
    battleValue?: number;
}

/** Round up to the next half ton ('Mech construction standard rounding). */
export function roundUpHalfTon(value: number): number {
    return Math.ceil(value * 2 - 1e-9) / 2;
}

/**
 * Direct-fire weapons for targeting computer purposes (TM p.238): energy and ballistic
 * weapons other than flamers, machine guns, AMS and non-combat sprayers.
 */
export function isTargetingComputerWeapon(item: IEquipmentItem): boolean {
    if (item.isAmmo || item.isMelee || item.battleValueDefensive) return false;
    if (item.category !== "Energy Weapons" && item.category !== "Ballistic Weapons") return false;
    const tag = item.tag.toLowerCase();
    return !/(flamer|machine-gun|(^|-)mg(-|$)|ams|apds|fluid-gun|nail-gun|rivet-gun)/.test(tag);
}

/**
 * Tons of direct-fire weapons a Targeting Computer is sized from (TM p.238). A "w/ Capacitor" record carries its
 * PPC Capacitor's ton, whose weight "has no effect on the computer's size or tonnage" (TO:AUE p.194).
 */
export function getTargetingComputerWeaponWeight(items: readonly (IEquipmentItem | null | undefined)[]): number {
    return items
        .filter((item): item is IEquipmentItem => !!item && isTargetingComputerWeapon(item))
        .reduce((sum, item) => sum + (item.weight || 0) - (/(^|-)ppc-capacitor$/.test(item.tag) ? 1 : 0), 0);
}

/** Sizes the Targeting Computers on a vehicle or fighter from its direct-fire weapons (TM p.238). */
export function sizeTargetingComputers(items: IEquipmentItem[], tonnage: number): void {
    const directFireWeaponWeight = getTargetingComputerWeaponWeight(items);
    for (const item of items) {
        if (item.variableFormula !== "targeting-computer-is" && item.variableFormula !== "targeting-computer-clan") continue;
        const size = sizeVariableEquipment(item.variableFormula, { tonnage, engineRating: 0, engineWeight: 0, directFireWeaponWeight });
        if (size) {
            item.weight = size.weight;
            item.cbills = size.cbills;
        }
    }
}

const TONNAGE_SCALED_FORMULAS: VariableEquipmentFormula[] = ["drone-operating-system", "drone-carrier-control", "naval-c3", "naval-tug-adaptor", "light-sail"];

/**
 * Sizes the equipment that scales with the unit's tonnage alone (drone systems, TO:AUE p.117; naval C3, tug adaptor
 * and light sail, pp.135-146), for the builders that size no other variable equipment (fighters and aerospace
 * Support Vehicles, Small Craft, DropShips and capital ships).
 */
export function sizeTonnageScaledEquipment(items: IEquipmentItem[], tonnage: number): void {
    for (const item of items) {
        if (!item.variableFormula || !TONNAGE_SCALED_FORMULAS.includes(item.variableFormula)) continue;
        const size = sizeVariableEquipment(item.variableFormula, { tonnage, engineRating: 0, engineWeight: 0, directFireWeaponWeight: 0, drones: item.controlledDrones });
        if (size) {
            item.weight = size.weight;
            item.cbills = size.cbills;
        }
    }
}

/** Size a variable piece of equipment for a unit; null when the formula is unknown. */
export function sizeVariableEquipment(
    formula: VariableEquipmentFormula,
    ctx: IVariableEquipmentContext,
): IVariableEquipmentSize | null {
    const t = ctx.tonnage;
    const physicalBV = (damage: number, multiplier: number) => damage * multiplier * (ctx.hasTSM ? 2 : 1);
    switch (formula) {
        // TM p.220: 1 ton and 1 slot per 15 tons (round up); damage tonnage / 5.
        case "hatchet": {
            const weight = Math.ceil(t / 15);
            const damage = Math.ceil(t / 5);
            return { weight, slots: weight, cbills: weight * 5000, damage, battleValue: physicalBV(damage, 1.5) };
        }
        // TM p.237: tonnage / 20 (half ton), tonnage / 15 slots; damage tonnage / 10 + 1.
        case "sword": {
            const weight = roundUpHalfTon(t / 20);
            const damage = Math.ceil(t / 10) + 1;
            return { weight, slots: Math.ceil(t / 15), cbills: weight * 10000, damage, battleValue: physicalBV(damage, 1.725) };
        }
        // TM p.236: 0.5 t mechanism + tonnage / 20 (half ton); 1 + tonnage / 20 slots.
        case "retractable-blade": {
            const bladeTons = Math.ceil(t / 20);
            const damage = Math.ceil(t / 10);
            return { weight: 0.5 + roundUpHalfTon(t / 20), slots: 1 + bladeTons, cbills: (1 + bladeTons) * 10000, damage, battleValue: physicalBV(damage, 1.725) };
        }
        // TO:AUE p.102: tonnage / 10 tons and slots; damage tonnage / 4.
        case "mace": {
            const weight = Math.ceil(t / 10);
            const damage = Math.ceil(t / 4);
            return { weight, slots: weight, cbills: 130000, damage, battleValue: physicalBV(damage, 1) };
        }
        // TO:AUE p.102: tonnage / 20 tons and slots; damage tonnage / 5.
        case "lance": {
            const weight = Math.ceil(t / 20);
            const damage = Math.ceil(t / 5);
            return { weight, slots: weight, cbills: Math.ceil(t * 150), damage, battleValue: physicalBV(damage, 1) };
        }
        // TO:AUE p.101: tonnage / 15 tons and slots; damage tonnage / 7.
        case "claw": {
            const weight = Math.ceil(t / 15);
            const damage = Math.ceil(t / 7);
            return { weight, slots: weight, cbills: Math.ceil(t * 200), damage, battleValue: physicalBV(damage, 1.275) };
        }
        // TO:AUE p.103: 0.5 t, 1 slot per location, 50 C-bills per unit ton.
        case "spikes":
            return { weight: 0.5, slots: 1, cbills: Math.ceil(t * 50), battleValue: 4 };
        // Maximum Tech p.59: 0.5 t, 1 head slot. p.87: Sensors cost tonnage x 10,000 (VRTS) or x 5,000 (Multi-Trac II)
        // instead of x 2,000, so the system carries the difference.
        case "variable-range-targeting":
        case "multi-trac-ii":
            return { weight: 0.5, slots: 1, cbills: t * (formula === "variable-range-targeting" ? 8000 : 3000), battleValue: 0 };
        // TM p.225: tonnage / 20 (IS) or / 25 (Clan), nearest whole ton, minimum 1; cost rating x tons x 1,000.
        case "masc-is":
        case "masc-clan": {
            const weight = Math.max(1, Math.round(t / (formula === "masc-is" ? 20 : 25)));
            return { weight, slots: weight, cbills: ctx.engineRating * weight * 1000, battleValue: 0 };
        }
        // TO:AUE p.157: 10% of engine weight (half ton), 1 slot; cost rating x 10,000.
        case "supercharger":
            return { weight: roundUpHalfTon(ctx.engineWeight / 10), slots: 1, cbills: ctx.engineRating * 10000, battleValue: 0 };
        // TM p.238: direct-fire weapon tons / 4 (IS) or / 5 (Clan), round up; slots = tons; 10,000 per ton.
        case "targeting-computer-is":
        case "targeting-computer-clan": {
            const weight = Math.ceil(ctx.directFireWeaponWeight / (formula === "targeting-computer-is" ? 4 : 5) - 1e-9);
            return { weight, slots: weight, cbills: weight * 10000, battleValue: 0 };
        }
        // TO:AUE p.105: 7% (IS) or 5% (Clan) of tonnage, half ton; 4 (IS) or 3 (Clan) slots per side torso.
        case "partial-wing-is":
        case "partial-wing-clan": {
            const weight = roundUpHalfTon(t * (formula === "partial-wing-is" ? 0.07 : 0.05));
            return { weight, slots: formula === "partial-wing-is" ? 8 : 6, cbills: Math.ceil(weight * 50000), battleValue: 0 };
        }
        // TO:AUE p.105: tonnage x jump MP x 5% (half ton), every leg slot pair; cost by weight class.
        case "jump-booster": {
            const mp = Math.max(1, ctx.size ?? 1);
            const cost = [50000, 50000, 75000, 150000, 300000][weightClassIndex(t)];
            return { weight: roundUpHalfTon(t * mp * 0.05), slots: ctx.isQuad ? 8 : 4, cbills: cost, battleValue: 0 };
        }
        // TM p.249: 10% of tonnage (half ton), one slot per leg; cost 500 x rating x tonnage / 75.
        case "tracks":
            return { weight: roundUpHalfTon(t * 0.1), slots: ctx.isQuad ? 4 : 2, cbills: Math.ceil(500 * ctx.engineRating * t / 75), battleValue: 0 };
        // IO:AE pp.128, 181: a QuadVee's Wheels, 15% of tonnage (half ton) in the Tracks' slots; (750 x rating x tonnage) / 75.
        case "quadvee-wheels":
            return { weight: roundUpHalfTon(t * 0.15), slots: 4, cbills: Math.ceil(750 * ctx.engineRating * t / 75), battleValue: 0 };
        // TM pp.70, 216 (IndustrialMechs): 10% of tonnage, "rounded up to the nearest full ton"; one slot in each
        // of 8 locations; 225 x tonnage C-bills (TM p.278).
        case "environmental-sealing":
            return { weight: Math.ceil(t / 10 - 1e-9), slots: 8, cbills: 225 * t, battleValue: 0 };
        // TM p.244: 10% of the engine weight (half ton); 'Mech slots equal to the tonnage, rounded up; 500 per ton (TM p.292).
        case "extended-fuel-tank": {
            const weight = roundUpHalfTon(ctx.engineWeight / 10);
            return { weight, slots: Math.ceil(weight), cbills: 500 * weight, battleValue: 0 };
        }
        // OTP: Hanseatic Crusade p.30: 1 ton per 10 tons of the unit, 1 slot in each torso; no cost printed.
        // No Battle Value is printed either. Owner ruling 2026-11-12: half the greatest charge damage (tonnage x
        // running MP / 10, each step rounded down), plus 1 for each torso carrying Spikes, times 1.1, in the
        // Offensive Battle Rating. It reproduces the 2,124 of the book's own Rhino record sheet (p.40).
        case "ram-plate": {
            const halfCharge = Math.floor(Math.floor(t * (ctx.runMP ?? 0) / 10 + 1e-9) / 2);
            const battleValue = halfCharge > 0 ? (halfCharge + (ctx.torsoSpikes ?? 0)) * 11 / 10 : 0;
            return { weight: roundUpHalfTon(t / 10), slots: 3, cbills: 0, battleValue };
        }
        // TO:AUE p.144: 1% of the vessel (half ton); 100,000 x item tons C-bills (p.221).
        case "naval-c3": {
            const weight = roundUpHalfTon(t / 100);
            return { weight, slots: 1, cbills: 100000 * weight, battleValue: 0 };
        }
        // TO:AUE p.146: 100 tons plus reinforcement of 10% of the vessel (half ton); 100,000 C-bills (p.221).
        case "naval-tug-adaptor":
            return { weight: 100 + roundUpHalfTon(t / 10), slots: 1, cbills: 100000, battleValue: 0 };
        // TO:AUE p.135: 10% of the satellite, to the kilogram under 5 tons and the ton from 5 tons; one rear slot;
        // 100,000 x item tons C-bills (p.221).
        case "light-sail": {
            const weight = t < 5 ? Math.ceil(t * 100 - 1e-9) / 1000 : Math.ceil(t / 10 - 1e-9);
            return { weight, slots: 1, cbills: Math.round(100000 * weight), battleValue: 0 };
        }
        // TO:AUE p.158: 10 percent of what the turret carries, half ton; one slot. 10,000 C-bills a ton, as MegaMek has it.
        case "mech-turret": {
            const weight = ctx.turretWeight ? roundUpHalfTon(ctx.turretWeight / 10) : 0;
            return { weight, slots: 1, cbills: weight * 10000, battleValue: 0 };
        }
        // TO:AUE p.91: one per limb; tonnage / 35 (biped) or / 50 (quad), half ton; slots by weight class.
        case "aes-arm":
        case "aes-leg": {
            const weight = roundUpHalfTon(t / (ctx.isQuad ? 50 : 35));
            return { weight, slots: weightClassIndex(t), cbills: Math.ceil(t * (formula === "aes-arm" ? 500 : 700)), battleValue: 0 };
        }
        // TO:AUE p.103: tonnage / 15 (round up), filling the feet; BV is the extra kick damage (half a kick).
        case "talons": {
            const weight = Math.ceil(t / 15);
            const kickBonus = Math.round(Math.floor(t / 5) * 0.5);
            return { weight, slots: ctx.isQuad ? 8 : 4, cbills: Math.ceil(weight * 300), battleValue: kickBonus * (ctx.hasTSM ? 2 : 1) };
        }
        // TO:AUE p.117: 10% of the drone's weight (half ton) plus the required half-ton sensor system, one item and one
        // slot; 5,000 + 10,000 x item tons C-bills (p.219), the 5,000 being the sensors (table note). Item tons read as
        // the 10% share, without the sensors (flagged).
        case "drone-operating-system": {
            const system = roundUpHalfTon(t * 0.1);
            return { weight: system + 0.5, slots: 1, cbills: 5000 + 10000 * system, battleValue: 0 };
        }
        // TO:AUE p.117: 2 tons plus 0.5 per controlled drone, one slot; 10,000 x item tons C-bills (p.219).
        case "drone-carrier-control": {
            const weight = 2 + 0.5 * Math.max(1, Math.floor(ctx.drones ?? 1));
            return { weight, slots: 1, cbills: 10000 * weight, battleValue: 0 };
        }
        // TM p.239: a 'Mech cargo bay weighs what it is built to carry, 1 slot a ton or fraction; per ton it costs
        // nothing (standard), 100 (liquid) or 250 (insulated) C-bills (TM p.293).
        case "cargo-standard":
        case "cargo-liquid":
        case "cargo-insulated": {
            const weight = Math.max(0.5, roundUpHalfTon(ctx.size ?? 1));
            const perTon = formula === "cargo-liquid" ? 100 : formula === "cargo-insulated" ? 250 : 0;
            return { weight, slots: Math.ceil(weight - 1e-9), cbills: perTon * weight, battleValue: 0 };
        }
        // Custom Homebrew (Solaris7 forum, misc-custom.ts): 1 ton for one linked unit, half a ton for each more, up to 11;
        // slots as a cargo bay's, 250,000 C-bills a ton (the C3 slave's).
        case "modular-c3": {
            const weight = 1 + 0.5 * (Math.min(11, Math.max(1, ctx.size ?? 1)) - 1);
            return { weight, slots: Math.ceil(weight - 1e-9), cbills: 250000 * weight, battleValue: 0 };
        }
        // Custom Homebrew (u/Magical_Savior, r/battletech 1mhvhwp): 4 tons, 2 slots; damage 10 plus 5 per 100 of engine rating or part
        // of 100 (15 to 30), 5 less each hex after the first, over 3 hexes. The author gave no Battle Value or cost, so both follow
        // what the weapon does (derived-values.ts): Battle Value is its damage over the hexes it reaches, cost the canon energy
        // median per Battle Value.
        case "fusion-lance": {
            const battleValue = fusionLanceBattleValue(ctx.engineRating);
            const [first, second, third] = fusionLanceHexDamage(ctx.engineRating);
            // Damage by hex, one hex to a band: the first, 5 less in the second, 10 less in the third.
            const damage: IDamagePerRange = { short: first, medium: second, long: third, aeroShort: first, aeroMedium: second, aeroLong: third };
            return { weight: 4, slots: 2, cbills: costFromBattleValue(battleValue), damage, battleValue };
        }
        // Apocryphal (BATTLETECH, Heavy Metal): the COIL weapons, at DevianID's tabletop Final Stats ("A Hare-Brained Weapon"). Damage and
        // heat are multiplied by the movement modifier when it is over +1, so Battle Value is priced at the 'Mech's running speed. Cost
        // is the catalog's (the game's own).
        case "coil-s":
        case "coil-m":
        case "coil-l": {
            const stats = { "coil-s": { weight: 2, slots: 4, damage: 3, reach: 3, cbills: 110000 }, "coil-m": { weight: 3, slots: 6, damage: 5, reach: 9, cbills: 220000 },
                "coil-l": { weight: 4, slots: 8, damage: 7, reach: 15, cbills: 360000 } }[formula];
            return { weight: stats.weight, slots: stats.slots, cbills: stats.cbills, damage: stats.damage, battleValue: coilBattleValue(stats.damage, stats.reach, ctx.runMP ?? 0) };
        }
    }
    return null;
}
