import { IEquipmentItem } from "./data-interfaces";

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
    | "masc-is"
    | "masc-clan"
    | "supercharger"
    | "targeting-computer-is"
    | "targeting-computer-clan"
    | "partial-wing-is"
    | "partial-wing-clan"
    | "jump-booster"
    | "tracks"
    | "environmental-sealing"
    | "aes-arm"
    | "aes-leg"
    | "talons";

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
    /** Size chosen for the installed item (Mechanical Jump Booster: jump MP). */
    size?: number;
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
    damage?: number;
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
        // TM p.216 (IndustrialMechs): 10% of tonnage (half ton), one slot in each of 8 locations; 225 per ton.
        case "environmental-sealing":
            return { weight: roundUpHalfTon(t / 10), slots: 8, cbills: 225 * t, battleValue: 0 };
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
    }
    return null;
}
