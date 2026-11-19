/*
 * Space turn tracker (design 2026-10-22). House rules for the anti-orbital Long Tom round, in TRO.md (user rulings
 * 2026-10-22): 6 ground turns pass for each space turn; a gun fires the round once a space turn; firing any round
 * before the next space turn risks a 2D6 roll; a shot is resolved at the start of the next space turn.
 */

export const GROUND_TURNS_PER_SPACE_TURN = 6;

const groundTurn = (turn: number): number => Math.max(1, Math.floor(turn) || 1);

/** Ground turns 1-6 are space turn 1, 7-12 space turn 2, and so on. */
export function getSpaceTurn(turn: number): number {
    return Math.ceil(groundTurn(turn) / GROUND_TURNS_PER_SPACE_TURN);
}

/** Ground turns left in this space turn, counting this one: 6 on turn 1, 1 on turn 6. */
export function getGroundTurnsUntilNextSpaceTurn(turn: number): number {
    return GROUND_TURNS_PER_SPACE_TURN - ((groundTurn(turn) - 1) % GROUND_TURNS_PER_SPACE_TURN);
}

/** The first ground turn of a space turn (1, 7, 13...), when its space phase resolves the shots in flight. */
export function isSpaceTurnStart(turn: number): boolean {
    return (groundTurn(turn) - 1) % GROUND_TURNS_PER_SPACE_TURN === 0;
}

/** Ground turns before a gun that fired in a given space turn may safely fire again; 0 when it may now. */
export function getCooldownGroundTurns(turn: number, lastSpaceTurnFired: number | null): number {
    return lastSpaceTurnFired === getSpaceTurn(turn) ? getGroundTurnsUntilNextSpaceTurn(turn) : 0;
}

export type EarlyFireResult = "destroyed" | "misfire" | "normal";

/** Firing early, 2D6: 2-4 the gun is destroyed, 5-8 it misfires, 9-12 it fires normally. Null for any other roll. */
export function getEarlyFireResult(roll: number): EarlyFireResult | null {
    if (!Number.isInteger(roll) || roll < 2 || roll > 12) return null;
    if (roll <= 4) return "destroyed";
    if (roll <= 8) return "misfire";
    return "normal";
}

export type ResolutionOutcome = "in-hex" | "one-hex" | "two-plus" | "bystander" | "defense";

export const RESOLUTION_ROLLS: Record<ResolutionOutcome, { label: string; roll: string }> = {
    "in-hex": { label: "Target still in the aimed hex", roll: "Normal attack roll" },
    "one-hex": { label: "Target moved one hex away", roll: "Normal attack roll at +4" },
    "two-plus": { label: "Target moved two hexes or more", roll: "Miss, no roll" },
    "bystander": { label: "Something else moved into the hex", roll: "Normal attack roll against it" },
    "defense": { label: "Fighters or point defense try to stop it", roll: "Stopped only on a natural 12" },
};

export const MISFIRE_REMINDER = "Misfire: roll 1D6 for direction from the aimed hex on the Scatter Diagram (TacOps p.182), "
    + "then 3D6 for the hexes it travels. It does normal damage where it lands, friendly units included; off the playing area it is lost.";

export const HIT_REMINDER = "Hit: 5 standard damage, applied on the target's own record sheet. Against capital armor, the standard damage is totaled, divided by 10 and rounded normally (TW p.238, errata v6.0).";
