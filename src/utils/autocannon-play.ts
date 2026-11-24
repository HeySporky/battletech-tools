/**
 * Autocannon rate of fire and jams in play (#643): rotary (RAC) and Ultra ACs from Total Warfare. Pure functions over a
 * per-weapon state kept by uuid on the unit classes.
 */
import type { IEquipmentItem } from "../data/data-interfaces";

export type AutocannonKind = "rac" | "ultra";

/** One weapon's play state. Every field is absent until something happens. */
export interface IAutocannonPlayState {
    /** Shots selected for the next attack (RAC 1-6, Ultra 1-2). */
    shots?: number;
    jammed?: boolean;
    /** RAC clearing (TW p.140): declared in an End Phase, then the next turn is the attempt turn (no weapon attacks, Gunnery +3 at the end of the Weapon Attack Phase). */
    clearing?: "declared" | "attempt";
    /** Fired or tried to clear this turn: a cleared jam takes the turn. */
    fired?: boolean;
}

export type IAutocannonPlay = Record<string, IAutocannonPlayState>;

/** The roll (2D6, to-hit roll) at or below which the weapon jams. 0 means it cannot jam (TW p.140). */
export function getJamThreshold(kind: AutocannonKind, shots: number): number {
    switch( kind ) {
        case "ultra":
            return shots >= 2 ? 2 : 0;
        case "rac":
            if( shots >= 6 ) return 4;
            if( shots >= 4 ) return 3;
            if( shots >= 2 ) return 2;
            return 0;
        default:
            return 0;
    }
}

export function getMaxShots(kind: AutocannonKind): number {
    switch( kind ) {
        case "ultra": return 2;
        case "rac": return 6;
        default: return 1;
    }
}

/** What an item is in play, from its canon flags. */
export function getAutocannonKind(item: IEquipmentItem | undefined): AutocannonKind | undefined {
    if( !item ) return undefined;
    if( item.isRotary && item.ammoTypes?.length ) return "rac";
    if( item.isUltra ) return "ultra";
    return undefined;
}

/** Shots selected, 1 when never set; held to the weapon's cap. */
export function getSelectedShots(kind: AutocannonKind, state: IAutocannonPlayState | undefined): number {
    const cap = getMaxShots(kind);
    return Math.min(cap, Math.max(1, state?.shots ?? 1));
}

/**
 * The to-hit roll of an attack. The shots are fired either way (TW); on a roll at or under the jam threshold the weapon
 * is jammed for the next turn.
 */
export function recordToHitRoll(kind: AutocannonKind, state: IAutocannonPlayState, roll: number): { jammed: boolean } {
    const shots = getSelectedShots(kind, state);
    const threshold = getJamThreshold(kind, shots);
    state.fired = true;
    if( threshold > 0 && roll <= threshold ) {
        state.jammed = true;
        return { jammed: true };
    }
    return { jammed: false };
}

/** A jam that can never be cleared: an Ultra AC that jams is useless for the rest of the game (TW p.114). */
export function isPermanentJam(kind: AutocannonKind): boolean {
    return kind === "ultra";
}

/** Declare, in an End Phase, that a jammed rotary will be cleared next turn (TW p.140). Not for an Ultra, which stays jammed. */
export function declareClear(kind: AutocannonKind, state: IAutocannonPlayState): boolean {
    if( !state.jammed || isPermanentJam(kind) || state.clearing ) return false;
    state.clearing = "declared";
    return true;
}

/** The unit is on the attempt turn: it makes no weapon attacks, stands still or walks/cruises, and rolls at the end of the Weapon Attack Phase. */
export function isClearingAttempt(state: IAutocannonPlayState | undefined): boolean {
    return state?.clearing === "attempt";
}

/** The Gunnery Skill Roll at +3 on the attempt turn: success clears the jam, failure leaves it (a new declaration may follow). */
export function resolveClear(state: IAutocannonPlayState, success: boolean): boolean {
    if( state.clearing !== "attempt" ) return false;
    delete state.clearing;
    if( success ) delete state.jammed;
    return success;
}

/** A new turn: the fired flag clears, and a declared clearing attempt becomes this turn's attempt. */
export function advanceAutocannonTurn(play: IAutocannonPlay | undefined): void {
    if( !play ) return;
    for( const state of Object.values(play) ) {
        delete state.fired;
        if( state.clearing === "attempt" ) delete state.clearing;
        else if( state.clearing === "declared" ) state.clearing = "attempt";
    }
}

/** The weapon can fire this turn: not jammed, and not spending the turn on a clearing attempt. */
export function canFireRate(state: IAutocannonPlayState | undefined): boolean {
    return !state?.jammed && state?.clearing !== "attempt";
}

/** Status of a weapon: a jam first, then no ammunition left. */
export function canFire(state: IAutocannonPlayState | undefined, ammoLeft: number): "ready" | "no-ammo" | "jammed" {
    if( state?.jammed ) return "jammed";
    if( ammoLeft <= 0 ) return "no-ammo";
    return "ready";
}

export function normalizeAutocannonPlay(raw: unknown): IAutocannonPlay {
    if( !raw || typeof raw !== "object" ) return {};
    const out: IAutocannonPlay = {};
    for( const [uuid, value] of Object.entries(raw as Record<string, unknown>) ) {
        if( value && typeof value === "object" ) out[uuid] = { ...(value as IAutocannonPlayState) };
    }
    return out;
}
