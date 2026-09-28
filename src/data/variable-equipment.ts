import { IEquipmentItem } from "./data-interfaces";

/*
 * Sizing rules for 'Mech equipment whose weight, slots, cost, damage or BV depend on the
 * unit (TechManual and Tactical Operations: Advanced Units & Equipment construction rules).
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
    | "targeting-computer-clan";

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
        // TO:AUE p.103: tonnage / 15 tons, fills the leg; BV is the extra kick damage (half a kick).
        case "talons": {
            const weight = Math.ceil(t / 15);
            const kickBonus = Math.round(Math.floor(t / 5) * 0.5);
            return { weight, slots: 2, cbills: Math.ceil(weight * 300), damage: kickBonus, battleValue: kickBonus * (ctx.hasTSM ? 2 : 1) };
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
    }
    return null;
}
