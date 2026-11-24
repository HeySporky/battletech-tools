/* Space minefields in play (Tactical Operations: Advanced Units & Equipment). */

// ---- Space minefields (TO:AUE p.138 Space Dispensers, p.178 Space Mines) ---------------------------------------------

/** Each space cluster a Space Mine Dispenser lays starts with this many attacks (TO:AUE p.138). */
export const SPACE_MINEFIELD_CAPACITY = 6;

export type SpaceMineTarget = "fighter" | "dropship" | "large";

/** The Space Mines Table (TO:AUE p.178): damage for each point of the Control Roll margin of failure, the most one attack does, and the capacity it uses. */
export const SPACE_MINES_TABLE: Record<SpaceMineTarget, { name: string; damagePerMoF: number; maxDamage: number; capacityReduction: number }> = {
    fighter: { name: "Fighter, Small Craft or satellite", damagePerMoF: 5, maxDamage: 20, capacityReduction: 1 },
    dropship: { name: "DropShip", damagePerMoF: 10, maxDamage: 50, capacityReduction: 2 },
    large: { name: "JumpShip, space station or WarShip", damagePerMoF: 20, maxDamage: 100, capacityReduction: 3 },
};

/** A unit entering a space minefield makes a Control Roll at +3, -2 with an Active Probe (TO:AUE p.178). */
export function getSpaceMineControlModifier(activeProbe: boolean): number {
    return activeProbe ? 1 : 3;
}

/**
 * One craft passing a minefield: damage is the margin of failure times the table figure, to its maximum (standard-scale
 * damage, to the Nose, in 5-point groups); the field loses the capacity reduction of the craft and is destroyed at 0 or
 * less, after the attack that took it there still does its damage. A field already spent attacks no more.
 */
export function resolveSpaceMineAttack(capacity: number, target: SpaceMineTarget, marginOfFailure: number): { damage: number; capacity: number; destroyed: boolean } {
    if (capacity <= 0) return { damage: 0, capacity, destroyed: true };
    const row = SPACE_MINES_TABLE[target];
    const margin = Math.max(0, Math.floor(marginOfFailure));
    if (margin === 0) return { damage: 0, capacity, destroyed: false };
    const left = capacity - row.capacityReduction;
    return { damage: Math.min(row.maxDamage, margin * row.damagePerMoF), capacity: left, destroyed: left <= 0 };
}
