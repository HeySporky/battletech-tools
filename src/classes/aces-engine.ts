import {
    acesBehaviorIds,
    IAcesBehaviorColumn,
    IAcesCard,
    IAcesCommandCard,
    IAcesCommandOrder,
    IAcesOverheatRow,
    IAcesPriorityRule,
    IAcesSpecialOrder,
    IAcesStrategyRow,
    TAcesBehavior,
    TAcesColor,
    TAcesMoveType,
    TAcesStat,
    acesTextToPlain,
} from "../data/aces-cards";
import {
    acesMotiveSystemsTable,
    acesVehicleCriticalHitTable,
    ACES_MAX_AUTOMATED_TARGET_NUMBER,
    ACES_MOTIVE_HOVER_WHEELED_MODIFIER,
    lookupAcesTable,
    TAcesMotiveEffect,
    TAcesVehicleCritical,
} from "../data/aces-rules";
import { AlphaStrikeUnit } from "./alpha-strike-unit";

/*
 * The Aces card-reading engine. It works through an Aces, Command or Special Order card the way the rulebook
 * describes, deciding everything that numbers decide (behavior order, Zones, stat tie-breakers, OV, tokens,
 * strategy decisions, support order) and asking the players only what depends on the table: distances, line of
 * sight, where a filter can be met. Every function is pure so a turn can be replayed from the saved answers.
 */

/* ---------------------------------------------------------------------------------------------------------------
 * Rules variant switch
 * ------------------------------------------------------------------------------------------------------------- */

/**
 * "asce" plays by Alpha Strike: Commander's Edition as written. "aces" adds the Aces rulebook's additional rules
 * for Alpha Strike (Aces pp.3-6): the Aces vehicle critical hit and motive tables, infantry and emplacement
 * critical hits that are always Weapon Hits, and the Aces indirect fire and emplacement modifiers.
 */
export type TAcesRuleset = "asce" | "aces";

/* ---------------------------------------------------------------------------------------------------------------
 * Seeded dice (stored with the game so a turn replays the same)
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesRngState {
    seed: number;
    calls: number;
}

export const newAcesRngState = ( seed: number | null = null ): IAcesRngState => {
    const rv = seed === null ? Math.floor( Math.random() * 0xFFFFFFFF ) : seed;
    return { seed: rv >>> 0, calls: 0 };
}

/**
 * Next number in [0, 1). A mulberry32 step keyed by seed and call count, so the state is just two integers and the
 * sequence continues exactly after a save and reload.
 */
export const acesRandom = ( state: IAcesRngState ): number => {
    state.calls++;
    let t = ( state.seed + Math.imul( state.calls, 0x6D2B79F5 ) ) >>> 0;
    t = Math.imul( t ^ ( t >>> 15 ), t | 1 );
    t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 );
    return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
}

export const rollAcesD6 = ( state: IAcesRngState ): number => {
    return Math.floor( acesRandom( state ) * 6 ) + 1;
}

export const rollAces2D6 = ( state: IAcesRngState ): number => {
    return rollAcesD6( state ) + rollAcesD6( state );
}

/** Fisher-Yates shuffle using the seeded dice; returns a new array. */
export const shuffleAces = <T>( items: T[], state: IAcesRngState ): T[] => {
    const rv = items.slice();
    for( let index = rv.length - 1; index > 0; index-- ) {
        const swap = Math.floor( acesRandom( state ) * ( index + 1 ) );
        const temp = rv[index];
        rv[index] = rv[swap];
        rv[swap] = temp;
    }
    return rv;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Unit stats used by ▲/▼ priorities (Aces p.9: current values, including heat, STL and the BA +1)
 * ------------------------------------------------------------------------------------------------------------- */

export type IAcesUnitStats = { [stat in TAcesStat]: number };

const firstNumber = ( value: string | number, fallback: number ): number => {
    const match = /-?\d+/.exec( String( value ) );
    return match ? +match[0] : fallback;
}

/** Reads the current stats of an Alpha Strike unit. */
export const getAcesUnitStats = ( unit: AlphaStrikeUnit ): IAcesUnitStats => {
    unit.calcCurrentValues();
    const armor = unit.getCurrentArmor();
    const structure = unit.getCurrentStructure();
    let tmm = firstNumber( unit.currentTMM, unit.tmm );
    if( unit.type === "BA" ) tmm += 1;
    return {
        "armor": armor,
        "structure": structure,
        "armor-lost": unit.armor - armor,
        "structure-lost": unit.structure - structure,
        "tmm": tmm,
        "pv": unit.currentPoints || unit.basePoints,
        "mv": unit.move.length > 0 ? unit.move[0].currentMove : 0,
        "damage-s": +unit.currentDamage.short || 0,
        "damage-m": +unit.currentDamage.medium || 0,
        "damage-l": +unit.currentDamage.long || 0,
        "size": unit.size,
        "heat": unit.currentHeat,
    };
}

/** Default stats for a Destroy Objective that isn't a unit (Aces p.17). */
export const getAcesDestroyObjectiveStats = ( currentCF: number = 0, startingCF: number = 0 ): IAcesUnitStats => {
    return {
        "armor": currentCF,
        "structure": currentCF,
        "armor-lost": 0,
        "structure-lost": 0,
        "tmm": -4,
        "pv": Number.MAX_SAFE_INTEGER,
        "mv": 0,
        "damage-s": 0,
        "damage-m": 0,
        "damage-l": 0,
        "size": startingCF,
        "heat": 0,
    };
}

/* ---------------------------------------------------------------------------------------------------------------
 * Narrowing a set of candidates with a priority list (Aces pp.12, 18)
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesCandidate {
    id: string;
    name: string;
    stats: IAcesUnitStats;
    /** Inches from the automated unit, measured by the players. */
    distance?: number | null;
    isObjective?: boolean;
    /** Enemy has moved this turn or is immobile (Aces p.9). */
    moved?: boolean;
    /** The automated unit can attack it: after moving (Movement Phase) or now (Combat Phase). */
    canAttack?: boolean;
    /** Target Number against it (Combat Phase). */
    targetNumber?: number | null;
    /** Has already taken enough damage to be destroyed this turn (Aces p.18). */
    doomed?: boolean;
}

/** The players' answers to judged lines, keyed by the line's text: ids of the candidates that match. */
export type TAcesJudgements = { [ruleText: string]: string[] };

export interface IAcesNarrowResult {
    remaining: IAcesCandidate[];
    trace: string[];
    /** A judged line the players must answer before narrowing can go on. */
    pending: IAcesPriorityRule | null;
}

const bestByStat = ( candidates: IAcesCandidate[], stat: TAcesStat, direction: "highest" | "lowest" ): IAcesCandidate[] => {
    const values = candidates.map( ( candidate ) => candidate.stats[stat] );
    const best = direction === "highest" ? Math.max( ...values ) : Math.min( ...values );
    return candidates.filter( ( candidate ) => candidate.stats[stat] === best );
}

const names = ( candidates: IAcesCandidate[] ): string => candidates.map( ( candidate ) => candidate.name ).join( ", " );

/**
 * Applies a priority list top to bottom as tie-breakers: stop as soon as one candidate is left. A line that would
 * leave nobody is ignored. Color lines expand into the Command card's list for that color (Aces pp.12, 18).
 */
export const narrowAcesCandidates = (
    candidates: IAcesCandidate[],
    rules: IAcesPriorityRule[],
    commandCard: IAcesCommandCard | null,
    judgements: TAcesJudgements = {},
    trace: string[] = [],
): IAcesNarrowResult => {
    let remaining = candidates.slice();
    for( const rule of rules ) {
        if( remaining.length <= 1 ) break;
        const label = acesTextToPlain( rule.text );
        if( rule.unresolved ) {
            trace.push( "Skipped unreadable line \"" + label + "\"." );
            continue;
        }
        if( rule.color ) {
            if( !commandCard ) {
                trace.push( "No Command card: skipped the " + rule.color + " list." );
                continue;
            }
            trace.push( "Using the " + rule.color + " list on " + commandCard.deck + " " + commandCard.letter + "." );
            const inner = narrowAcesCandidates( remaining, commandCard[rule.color], null, judgements, trace );
            if( inner.pending ) return { remaining: inner.remaining, trace: trace, pending: inner.pending };
            remaining = inner.remaining;
            continue;
        }
        let matched: IAcesCandidate[];
        if( rule.stat && rule.direction ) {
            matched = bestByStat( remaining, rule.stat, rule.direction );
        } else if( rule.objective ) {
            matched = remaining.filter( ( candidate ) => candidate.isObjective );
        } else {
            const answer = judgements[rule.text];
            if( !answer ) return { remaining: remaining, trace: trace, pending: rule };
            matched = remaining.filter( ( candidate ) => answer.indexOf( candidate.id ) > -1 );
        }
        if( matched.length === 0 ) {
            trace.push( "\"" + label + "\" matches nobody: ignored." );
            continue;
        }
        if( matched.length < remaining.length ) {
            trace.push( "\"" + label + "\" leaves " + names( matched ) + "." );
        } else {
            trace.push( "\"" + label + "\" doesn't separate them." );
        }
        remaining = matched;
    }
    return { remaining: remaining, trace: trace, pending: null };
}

/**
 * Zones (Aces p.12): with rings, pick the closest band that holds a candidate; anything beyond the last ring is the
 * final Zone. "nearest" keeps only the physically closest; "any" keeps everyone.
 */
export const selectAcesZone = ( candidates: IAcesCandidate[], rings: number[], keyword: "" | "nearest" | "any" ): IAcesCandidate[] => {
    if( candidates.length === 0 ) return [];
    const distance = ( candidate: IAcesCandidate ) => typeof candidate.distance === "number" ? candidate.distance : Number.MAX_SAFE_INTEGER;
    if( keyword === "any" || ( rings.length === 0 && keyword !== "nearest" ) ) return candidates.slice();
    if( keyword === "nearest" ) {
        const closest = Math.min( ...candidates.map( distance ) );
        return candidates.filter( ( candidate ) => distance( candidate ) === closest );
    }
    const sorted = rings.slice().sort( ( a, b ) => a - b );
    for( const ring of sorted ) {
        const inside = candidates.filter( ( candidate ) => distance( candidate ) <= ring );
        if( inside.length > 0 ) return inside;
    }
    return candidates.slice();
}

/* ---------------------------------------------------------------------------------------------------------------
 * Movement: behavior, target, movement type, filters (Aces pp.11-17)
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesBehaviorResult {
    behavior: TAcesBehavior | "forced-withdrawal" | "fleeing";
    column: IAcesBehaviorColumn;
    trace: string[];
    /** Behavior condition the players still need to answer. */
    pending: TAcesBehavior | null;
}

/**
 * Determine behavior (Aces p.11): check Aggressive then Balanced conditions; the first that is true is used,
 * otherwise Cautious. Forced Withdrawal and Fleeing units use the Special Order column instead (Aces p.16). A
 * Command card order can override the choice (Aces p.11). Columns in `skip` failed target identification and fall
 * through to the next column (Aces p.12).
 */
export const determineAcesBehavior = (
    card: IAcesCard,
    answers: { aggressive?: boolean | null, balanced?: boolean | null },
    options: {
        override?: TAcesBehavior | null,
        specialOrder?: IAcesSpecialOrder | null,
        skip?: TAcesBehavior[],
    } = {},
): IAcesBehaviorResult => {
    const trace: string[] = [];
    if( options.specialOrder && options.specialOrder.column ) {
        const kind = options.specialOrder.kind === "fleeing" ? "fleeing" : "forced-withdrawal";
        trace.push( "Using the " + options.specialOrder.name + " column instead of the Aces card." );
        return { behavior: kind, column: options.specialOrder.column, trace: trace, pending: null };
    }
    const skip = options.skip || [];
    if( options.override && skip.indexOf( options.override ) === -1 ) {
        trace.push( "The Command card sets the behavior to " + options.override + "." );
        return { behavior: options.override, column: card[options.override], trace: trace, pending: null };
    }
    for( const behavior of [ "aggressive", "balanced" ] as TAcesBehavior[] ) {
        if( skip.indexOf( behavior ) > -1 ) {
            trace.push( capitalize( behavior ) + " skipped: no valid target." );
            continue;
        }
        const answer = answers[behavior as "aggressive" | "balanced"];
        if( answer === undefined || answer === null ) {
            return { behavior: behavior, column: card[behavior], trace: trace, pending: behavior };
        }
        if( answer ) {
            trace.push( capitalize( behavior ) + ": \"" + acesTextToPlain( card[behavior].condition ) + "\" is true." );
            return { behavior: behavior, column: card[behavior], trace: trace, pending: null };
        }
        trace.push( capitalize( behavior ) + ": condition not met." );
    }
    trace.push( "Cautious (default)." );
    return { behavior: "cautious", column: card.cautious, trace: trace, pending: null };
}

const capitalize = ( value: string ): string => value.charAt( 0 ).toUpperCase() + value.slice( 1 );

export interface IAcesTargetResult {
    target: IAcesCandidate | null;
    /** Several remain after every filter: the physically closest wins (Aces p.18) or the golden rule applies. */
    tied: IAcesCandidate[];
    /** The column can't be used: fall through to the next behavior column (Aces p.12). */
    skipColumn: boolean;
    /** No enemies at all: hold position, counts as Ground movement, face the deployment area (Aces p.16). */
    noTargets: boolean;
    trace: string[];
    pending: IAcesPriorityRule | null;
}

const finishTarget = ( remaining: IAcesCandidate[], trace: string[], pending: IAcesPriorityRule | null, closestBreaksTie: boolean ): IAcesTargetResult => {
    if( pending ) {
        return { target: null, tied: remaining, skipColumn: false, noTargets: false, trace: trace, pending: pending };
    }
    if( remaining.length === 1 ) {
        trace.push( "Target: " + remaining[0].name + "." );
        return { target: remaining[0], tied: [], skipColumn: false, noTargets: false, trace: trace, pending: null };
    }
    const withDistance = remaining.filter( ( candidate ) => typeof candidate.distance === "number" );
    if( closestBreaksTie && withDistance.length === remaining.length && remaining.length > 1 ) {
        const closest = Math.min( ...withDistance.map( ( candidate ) => candidate.distance as number ) );
        const nearest = remaining.filter( ( candidate ) => candidate.distance === closest );
        if( nearest.length === 1 ) {
            trace.push( "Still tied: the closest, " + nearest[0].name + ", is the target." );
            return { target: nearest[0], tied: [], skipColumn: false, noTargets: false, trace: trace, pending: null };
        }
    }
    trace.push( "Still tied: " + names( remaining ) + ". Choose the one that benefits the automated force most." );
    return { target: null, tied: remaining, skipColumn: false, noTargets: false, trace: trace, pending: null };
}

/**
 * Identify the target for movement (Aces p.12). Filters first: ⌖ keeps enemies the unit can attack after moving,
 * ✔ keeps enemies that have moved; if either leaves nobody the column is skipped. Then the closest Zone, then the
 * color list or "nearest".
 */
export const identifyAcesMovementTarget = (
    column: IAcesBehaviorColumn,
    enemies: IAcesCandidate[],
    commandCard: IAcesCommandCard | null,
    judgements: TAcesJudgements = {},
): IAcesTargetResult => {
    const trace: string[] = [];
    if( enemies.length === 0 ) {
        trace.push( "No enemies in play: hold position (Ground movement) and face the deployment area." );
        return { target: null, tied: [], skipColumn: false, noTargets: true, trace: trace, pending: null };
    }
    let candidates = enemies.slice();
    if( column.targetInAttackRange ) {
        candidates = candidates.filter( ( candidate ) => candidate.canAttack );
        if( candidates.length === 0 ) {
            trace.push( "No enemy can be attacked after moving: skip this column." );
            return { target: null, tied: [], skipColumn: true, noTargets: false, trace: trace, pending: null };
        }
    }
    if( column.targetMoved ) {
        candidates = candidates.filter( ( candidate ) => candidate.moved || candidate.isObjective );
        if( candidates.length === 0 ) {
            trace.push( "No enemy has moved yet: skip this column." );
            return { target: null, tied: [], skipColumn: true, noTargets: false, trace: trace, pending: null };
        }
    }
    let remaining = selectAcesZone( candidates, column.zoneRings, column.zoneKeyword );
    trace.push( "Closest Zone holds " + names( remaining ) + "." );
    if( remaining.length > 1 && column.targetSelect === "nearest" ) {
        remaining = selectAcesZone( remaining, [], "nearest" );
        trace.push( "Nearest: " + names( remaining ) + "." );
    } else if( remaining.length > 1 && column.targetSelect ) {
        const color = column.targetSelect as TAcesColor;
        const result = narrowAcesCandidates( remaining, [ { text: "[" + color + "]", color: color } ], commandCard, judgements, trace );
        return finishTarget( result.remaining, trace, result.pending, false );
    }
    return finishTarget( remaining, trace, null, false );
}

export interface IAcesMoveTypeResult {
    moveType: TAcesMoveType;
    note: string;
}

/**
 * Movement type (Aces p.14): the icon sets it (Ground by default). A bare Jump icon falls back to Ground for a unit
 * that can't jump; "(J if needed)" jumps only when that reaches a better position; Sprint alternatives apply only
 * when their printed condition is true.
 */
export const resolveAcesMoveType = (
    column: IAcesBehaviorColumn,
    canJump: boolean,
    alternativeApplies: boolean,
): IAcesMoveTypeResult => {
    if( column.altMoveType && alternativeApplies ) {
        if( column.altMoveType === "jump" && !canJump ) {
            return { moveType: column.moveType === "jump" ? "ground" : column.moveType, note: "Can't jump: moves on the ground." };
        }
        return { moveType: column.altMoveType, note: acesTextToPlain( column.altMoveWhen ) };
    }
    if( column.moveType === "jump" && !canJump ) {
        return { moveType: "ground", note: "Can't jump: moves on the ground." };
    }
    return { moveType: column.moveType, note: "" };
}

export type TAcesFilterAnswer = "none" | "some" | "one";

export interface IAcesFilterProgress {
    /** Every filter in order: Special Order filters (0a, 0b ...) then the column's own. */
    filters: { label: string, text: string }[];
    /** Index of the next filter to ask about; null when finished. */
    next: number | null;
    done: boolean;
    outcome: "" | "single-location" | "golden-rule" | "standstill";
    trace: string[];
}

/**
 * Resolve movement (Aces pp.14, 17). Walks the ranked filters with the players' answers: a filter no location can
 * meet is ignored; one that several locations meet narrows the choice; one that only a single location meets ends
 * the search. At the end of the list the golden rule picks among what's left. Movement Objective filters come first
 * unless the column only stands still.
 */
export const resolveAcesMovementFilters = (
    column: IAcesBehaviorColumn,
    answers: TAcesFilterAnswer[],
    preFilters: string[] = [],
): IAcesFilterProgress => {
    const trace: string[] = [];
    const letters = "abcdefghij";
    const usePre = column.moveType !== "standstill" || column.altMoveType !== null;
    const filters = ( usePre ? preFilters.map( ( text, index ) => ( { label: "0" + letters.charAt( index ), text: text } ) ) : [] )
        .concat( column.filters.map( ( text, index ) => ( { label: String( index + 1 ), text: text } ) ) );
    if( column.moveType === "standstill" && column.altMoveType === null ) {
        trace.push( "Standstill: the unit doesn't move." );
        return { filters: filters, next: null, done: true, outcome: "standstill", trace: trace };
    }
    let narrowed = false;
    for( let index = 0; index < filters.length; index++ ) {
        const answer = answers[index];
        if( !answer ) {
            return { filters: filters, next: index, done: false, outcome: "", trace: trace };
        }
        const label = filters[index].label + ". " + acesTextToPlain( filters[index].text );
        if( answer === "none" ) {
            trace.push( label + ": no location qualifies, ignored." );
        } else if( answer === "some" ) {
            trace.push( label + ": narrows the possible locations." );
            narrowed = true;
        } else {
            trace.push( label + ": only one location qualifies. Move there." );
            return { filters: filters, next: null, done: true, outcome: "single-location", trace: trace };
        }
    }
    trace.push( ( narrowed ? "Several locations remain" : "No filter narrowed the choice" ) + ": pick the best of them for the automated unit (golden rule). If it already stands on the best spot, move 1\"." );
    return { filters: filters, next: null, done: true, outcome: "golden-rule", trace: trace };
}

/* ---------------------------------------------------------------------------------------------------------------
 * Combat (Aces pp.18-20)
 * ------------------------------------------------------------------------------------------------------------- */

/**
 * Identify the combat target (Aces p.18). Targets the unit can't attack, with a Target Number of 13+, or already
 * doomed are ignored. Closest Zone, then the card's filters, then the closest.
 */
export const identifyAcesCombatTarget = (
    card: IAcesCard,
    enemies: IAcesCandidate[],
    commandCard: IAcesCommandCard | null,
    judgements: TAcesJudgements = {},
    canIndirectFire: boolean = false,
): IAcesTargetResult & { indirect: boolean } => {
    const trace: string[] = [];
    const candidates = enemies.filter( ( candidate ) => {
        if( candidate.doomed ) return false;
        if( candidate.canAttack === false ) return false;
        if( typeof candidate.targetNumber === "number" && candidate.targetNumber > ACES_MAX_AUTOMATED_TARGET_NUMBER ) {
            trace.push( candidate.name + " ignored: Target Number " + candidate.targetNumber + "." );
            return false;
        }
        return true;
    } );
    if( candidates.length === 0 ) {
        trace.push( canIndirectFire ? "No target in line of sight and range: attack with indirect fire." : "No target in line of sight and range: no attack." );
        return { target: null, tied: [], skipColumn: false, noTargets: true, trace: trace, pending: null, indirect: canIndirectFire };
    }
    const zone = selectAcesZone( candidates, card.combat.zoneRings, card.combat.zoneKeyword );
    trace.push( "Closest Zone holds " + names( zone ) + "." );
    const result = narrowAcesCandidates( zone, card.combat.filters, commandCard, judgements, trace );
    return { ...finishTarget( result.remaining, trace, result.pending, true ), indirect: false };
}

export interface IAcesOverheatInput {
    /** Only BattleMechs check OV (Aces p.19). */
    isBattleMech: boolean;
    ovRating: number;
    currentHeat: number;
    targetNumber: number;
    /** Took enough damage to be destroyed this Combat Phase. */
    destroyedThisPhase: boolean;
    /** Reduced to 0 Move by heat: no weapon attack (Aces p.19). */
    zeroMoveFromHeat: boolean;
    /** Damage at the attack's range, and the target's armor left: used for "OV might let unit hit structure". */
    damage: number;
    targetArmor: number;
    indirect?: boolean;
}

export interface IAcesOverheatResult {
    attack: boolean;
    ov: number;
    reason: string;
}

/** Heat 4 shuts a unit down in Alpha Strike; automated units never overheat into shutdown (Aces p.19). */
const ACES_SHUTDOWN_HEAT = 4;

/**
 * Check OV (Aces pp.7, 19-20). Rows are read top to bottom; the first that matches applies. A unit destroyed this
 * phase uses its maximum OV. OV never takes the unit to shutdown, and can't be added to indirect fire (though a
 * row can still stop the attack).
 *
 * "OV might let unit hit target's structure" is read as: the damage alone stays in the armor, but damage plus the
 * allowed OV would go through it.
 */
export const resolveAcesOverheat = ( rows: IAcesOverheatRow[], input: IAcesOverheatInput ): IAcesOverheatResult => {
    if( input.zeroMoveFromHeat ) {
        return { attack: false, ov: 0, reason: "Reduced to 0 Move by heat: no weapon attack (Aces p.19)." };
    }
    if( !input.isBattleMech ) {
        return { attack: true, ov: 0, reason: "Only BattleMechs use the OV instructions (Aces p.19)." };
    }
    const safeOV = Math.max( 0, Math.min( input.ovRating, ACES_SHUTDOWN_HEAT - 1 - input.currentHeat ) );
    const allowed = ( limit: number ) => input.indirect ? 0 : Math.min( safeOV, limit );
    if( input.destroyedThisPhase ) {
        const ov = input.indirect ? 0 : input.ovRating;
        return { attack: true, ov: ov, reason: "Destroyed this phase: maximum OV (Aces p.19)." };
    }
    for( const row of rows ) {
        const tnMatch = ( row.tnAtMost === null || input.targetNumber <= row.tnAtMost )
            && ( row.tnAtLeast === null || input.targetNumber >= row.tnAtLeast );
        const hasTN = row.tnAtMost !== null || row.tnAtLeast !== null;
        const limit = row.action === "max" ? input.ovRating : ( row.ovLimit || 0 );
        let alsoMatch = false;
        if( row.also === "destroyed" ) alsoMatch = input.destroyedThisPhase;
        if( row.also === "has-heat" ) alsoMatch = input.currentHeat > 0;
        if( row.also === "could-hit-structure" ) {
            alsoMatch = input.damage <= input.targetArmor && input.damage + allowed( limit ) > input.targetArmor;
        }
        let match: boolean;
        if( !row.also ) {
            match = tnMatch;
        } else if( !hasTN ) {
            match = alsoMatch;
        } else {
            match = row.join === "or" ? tnMatch || alsoMatch : tnMatch && alsoMatch;
        }
        if( !match ) continue;
        const text = acesTextToPlain( row.text );
        if( row.action === "no-attack" ) return { attack: false, ov: 0, reason: text };
        const ov = allowed( limit );
        const capped = !input.indirect && ov < Math.min( limit, input.ovRating );
        return { attack: true, ov: ov, reason: text + ( capped ? " (capped to avoid shutdown)" : "" ) + ( input.indirect ? " No OV on indirect fire." : "" ) };
    }
    return { attack: true, ov: 0, reason: "No OV row applies." };
}

export interface IAcesPhysicalInput {
    orderedByCard: boolean;
    baseContact: boolean;
    inMeleeRange: boolean;
    physicalDamage: number;
    weaponDamage: number;
    fireControlHits: number;
    heat: number;
}

/**
 * Physical attacks (Aces p.20): only when a card or sortie rule calls for one, when the target is in base contact,
 * or when it is in melee range and the physical attack would do more damage, or the unit has a Fire Control hit,
 * or it has heat. Charge and Death from Above only when a card says so.
 */
export const shouldAcesMakePhysicalAttack = ( input: IAcesPhysicalInput ): { physical: boolean, reason: string } => {
    if( input.orderedByCard ) return { physical: true, reason: "A card or sortie rule calls for a physical attack." };
    if( input.baseContact ) return { physical: true, reason: "Target in base contact: a physical attack is the only way." };
    if( input.inMeleeRange ) {
        if( input.physicalDamage > input.weaponDamage ) return { physical: true, reason: "In melee range and the physical attack does more damage." };
        if( input.fireControlHits > 0 ) return { physical: true, reason: "In melee range with a Fire Control hit." };
        if( input.heat > 0 ) return { physical: true, reason: "In melee range with heat." };
    }
    return { physical: false, reason: "Weapon attack." };
}

export interface IAcesSupportCard {
    id: string;
    name: string;
    targetNumber: number;
    damage: number;
}

/**
 * Battlefield Support cards are resolved lowest Target Number first; ties go to the higher damage (Aces p.20).
 */
export const orderAcesSupportCards = <T extends IAcesSupportCard>( cards: T[] ): T[] => {
    return cards.slice().sort( ( a, b ) => {
        if( a.targetNumber !== b.targetNumber ) return a.targetNumber - b.targetNumber;
        return b.damage - a.damage;
    } );
}

/** Support order check: a card that must hit structure is played only when its damage gets through the armor. */
export const acesSupportCardAllowed = ( commandCard: IAcesCommandCard | null, damage: number, targetArmor: number ): boolean => {
    if( !commandCard || !commandCard.supportOnlyIfStructure ) return true;
    return damage > targetArmor;
}

/** Order of support attacks after all automated units have attacked (Aces p.20). */
export const acesSupportAttackOrder = [ "Emplacements", "Artillery", "Battlefield Support cards" ];

/** The spotter doesn't attack when its damage is less than the total IF of the indirect firers (Aces p.20). */
export const acesSpotterAttacks = ( spotterDamage: number, indirectFireTotal: number ): boolean => {
    return spotterDamage >= indirectFireTotal;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Command cards (Aces pp.8, 10, 21)
 * ------------------------------------------------------------------------------------------------------------- */

/** Orders on a Command card that apply to a phase. */
export const getAcesOrdersForPhase = ( card: IAcesCommandCard | null, phase: string ): IAcesCommandOrder[] => {
    if( !card ) return [];
    return card.orders.filter( ( order ) => order.phase === phase || order.phase === "any" );
}

/**
 * A Move First / Move Last order: pick the unit by the order's ranking. Units that can't move, and units under
 * Forced Withdrawal or Fleeing orders, can't hold a token (Aces p.8).
 */
export const chooseAcesTokenUnit = (
    order: IAcesCommandOrder,
    units: ( IAcesCandidate & { eligible: boolean } )[],
): { unitId: string | null, tied: IAcesCandidate[], trace: string[] } => {
    const trace: string[] = [];
    const eligible = units.filter( ( unit ) => unit.eligible );
    if( eligible.length === 0 ) {
        trace.push( "No unit can take the token." );
        return { unitId: null, tied: [], trace: trace };
    }
    const result = narrowAcesCandidates( eligible, order.tokenRank, null, {}, trace );
    if( result.remaining.length === 1 ) {
        trace.push( result.remaining[0].name + " takes the " + ( order.token === "move-first" ? "Move First" : "Move Last" ) + " token." );
        return { unitId: result.remaining[0].id, tied: [], trace: trace };
    }
    trace.push( "Still tied: " + names( result.remaining ) + ". The players choose." );
    return { unitId: null, tied: result.remaining, trace: trace };
}

export interface IAcesStrategyResult {
    /** Letter of the Command card to put on top; null keeps the current card. */
    letter: string | null;
    pending: IAcesStrategyRow | null;
    trace: string[];
}

/**
 * Strategy decisions (Aces p.21): read the rows top to bottom and stop at the first true one; that letter's card
 * goes on top. If none is true the current card stays.
 */
export const evaluateAcesStrategy = (
    card: IAcesCommandCard,
    answers: { [letter: string]: boolean | null | undefined },
    auto: { objectiveComplete: boolean, enemyWithNoArmor: boolean },
): IAcesStrategyResult => {
    const trace: string[] = [];
    for( const row of card.strategy ) {
        let value: boolean | null | undefined = answers[row.letter];
        if( row.auto === "objective-complete" ) value = auto.objectiveComplete;
        if( row.auto === "enemy-no-armor" ) value = auto.enemyWithNoArmor;
        if( value === null || value === undefined ) {
            return { letter: null, pending: row, trace: trace };
        }
        const text = acesTextToPlain( row.text );
        if( value ) {
            trace.push( row.letter + ": " + text + ". Yes: Command card " + row.letter + " goes on top." );
            return { letter: row.letter, pending: null, trace: trace };
        }
        trace.push( row.letter + ": " + text + ". No." );
    }
    trace.push( "No strategy decision applies: card " + card.letter + " stays." );
    return { letter: null, pending: null, trace: trace };
}

/* ---------------------------------------------------------------------------------------------------------------
 * Critical hits under the rules switch (Aces pp.4-6)
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesCriticalResult {
    roll: number | null;
    effect: TAcesVehicleCritical | "weapon" | "use-asce-table";
    label: string;
}

/**
 * Critical hit for an automated or player unit. Under "aces": infantry (Aces p.5) and emplacements (Aces p.6) always
 * take a Weapon Hit; combat and support vehicles roll on the Aces Vehicle Critical Hit Table (Aces p.4). Anything
 * else, and everything under "asce", uses the Alpha Strike: Commander's Edition tables.
 */
export const rollAcesCriticalHit = (
    ruleset: TAcesRuleset,
    unitType: string,
    isEmplacement: boolean,
    rng: IAcesRngState,
): IAcesCriticalResult => {
    const type = unitType.toUpperCase();
    if( ruleset === "aces" ) {
        if( isEmplacement ) return { roll: null, effect: "weapon", label: "Weapon Hit (emplacements always take a Weapon Hit, Aces p.6)" };
        if( type === "CI" || type === "BA" ) return { roll: null, effect: "weapon", label: "Weapon Hit (infantry always take a Weapon Hit, Aces p.5)" };
        if( type === "CV" || type === "SV" ) {
            const roll = rollAces2D6( rng );
            const row = lookupAcesTable( acesVehicleCriticalHitTable, roll );
            return { roll: roll, effect: row.effect, label: row.label + " (Aces p.4)" };
        }
    }
    const roll = rollAces2D6( rng );
    return { roll: roll, effect: "use-asce-table", label: "Look up " + roll + " on the Alpha Strike: Commander's Edition critical hit table" };
}

/** Motive systems damage roll under "aces" (Aces p.4); hover and wheeled units add 1. */
export const rollAcesMotiveDamage = (
    moveType: string,
    rng: IAcesRngState,
): { roll: number, effect: TAcesMotiveEffect, label: string } => {
    let roll = rollAces2D6( rng );
    const type = moveType.toLowerCase();
    if( type === "h" || type === "w" ) roll += ACES_MOTIVE_HOVER_WHEELED_MODIFIER;
    const row = lookupAcesTable( acesMotiveSystemsTable, roll );
    return { roll: roll, effect: row.effect, label: row.label };
}

const markNext = ( permanent: boolean[], round: boolean[] ): boolean => {
    for( let index = 0; index < round.length; index++ ) {
        if( !permanent[index] && !round[index] ) {
            round[index] = true;
            return true;
        }
    }
    return false;
}

/**
 * Marks a critical hit or motive result on a unit's card for this round (applied in the End Phase like any other
 * damage). Returns false when the effect isn't tracked on the card (ammo, crew) or the boxes are full.
 */
export const applyAcesCriticalToUnit = ( unit: AlphaStrikeUnit, effect: string ): boolean => {
    unit.calcCurrentValues();
    switch( effect ) {
        case "weapon": return markNext( unit.weaponHits, unit.roundWeaponHits );
        case "fire-control": return markNext( unit.fireControlHits, unit.roundFireControlHits );
        case "mp": return markNext( unit.mpControlHits, unit.roundMpControlHits );
        case "engine": return markNext( unit.engineHits, unit.roundEngineHits );
        case "minus2-move-minus1-tmm": return markNext( unit.vehicleMotive910, unit.roundVehicleMotive910 );
        case "halve-move-tmm": return markNext( unit.vehicleMotive11, unit.roundVehicleMotive11 );
        case "immobilized":
            if( unit.vehicleMotive12 || unit.roundVehicleMotive12 ) return false;
            unit.roundVehicleMotive12 = true;
            return true;
        default: return false;
    }
}

/* ---------------------------------------------------------------------------------------------------------------
 * Small helpers for the UI
 * ------------------------------------------------------------------------------------------------------------- */

export const acesBehaviorLabel = ( behavior: string ): string => {
    if( behavior === "forced-withdrawal" ) return "Forced Withdrawal";
    if( behavior === "fleeing" ) return "Fleeing";
    return acesBehaviorIds.indexOf( behavior as TAcesBehavior ) > -1 ? capitalize( behavior ) : behavior;
}

/** Finds the card in a library whose deck and movement priority match what's showing on the table. */
export const findAcesCard = ( cards: IAcesCard[], deck: string, priority: number | null ): IAcesCard | null => {
    if( priority === null ) return null;
    const wanted = deck.trim().toLowerCase();
    return cards.find( ( card ) => card.movePriority === priority && ( !wanted || card.deck.toLowerCase() === wanted || card.deckId === wanted ) ) || null;
}
