import {
    ACES_AM_ATTACK_MODIFIER,
    ACES_AM_CONVENTIONAL_INFANTRY_MODIFIER,
    ACES_AM_TARGET_CARRYING_BA_MODIFIER,
    ACES_BATTLE_ARMOR_TARGET_MODIFIER,
    ACES_EMPLACEMENT_ATTACK_MODIFIER,
    ACES_FORCED_WITHDRAWAL_PRIORITY_MODIFIER,
    ACES_IF_MODIFIER,
    ACES_IF_SPOTTER_ATTACKING_MODIFIER,
    ACES_IF_SPOTTER_MAX_RANGE,
    ACES_INITIATIVE_COMMANDER_DESTROYED_MODIFIER,
    ACES_INITIATIVE_LAST_WINNER_MODIFIER,
    ACES_MAX_AUTOMATED_TARGET_NUMBER,
    ACES_MOVE_FIRST_PRIORITY,
    ACES_MOVE_LAST_PRIORITY,
    TAcesDeckId,
} from "../data/aces-rules";
import { AlphaStrikeUnit } from "./alpha-strike-unit";

/*
 * Rules helpers for BattleTech: Aces (see src/data/aces-rules.ts for the cited tables). Everything here takes
 * plain values so the rules can be tested without a full Alpha Strike unit; the *ForUnit adapters read an
 * AlphaStrikeUnit.
 */

/* ---------------------------------------------------------------------------------------------------------------
 * Target numbers: ASCE p.44 Attack Modifiers Table, with the Aces additions (Aces pp.3-6)
 * ------------------------------------------------------------------------------------------------------------- */

export type TAcesMovementMode = "standstill" | "ground" | "jump" | "immobile";
export type TAcesAttackType = "weapon" | "indirect" | "charge" | "dfa" | "anti-mech";
export type TAcesRangeBracket = "short" | "medium" | "long" | "extreme";

export interface IAcesSpotterInput {
    movement: TAcesMovementMode;
    isInfantry?: boolean;
    /** The spotter also makes its own attack this turn (Aces p.3). */
    alsoAttacking?: boolean;
    /** Distance from the spotter to the target, for the 42" limit (Aces p.3). */
    rangeToTargetInches: number;
}

export interface IAcesToHitInput {
    skill: number;
    /** Distance from the attacker to the target. Not used for physical attacks. */
    rangeInches: number;
    attackType: TAcesAttackType;

    attackerMovement: TAcesMovementMode;
    attackerIsInfantry?: boolean;
    attackerIsConventionalInfantry?: boolean;
    attackerIsEmplacement?: boolean;
    attackerFireControlHits?: number;
    attackerHeat?: number;
    /** The attacker is also spotting for an indirect fire attack this turn (Aces p.3). */
    attackerIsSpotting?: boolean;
    secondaryTarget?: boolean;

    /** Alpha Strike type of the target (BM, CV, BA, CI, ...). */
    targetType: string;
    targetTMM: number;
    targetMovement: TAcesMovementMode;
    /** JMPS# as a positive number, JMPW# as a negative number. */
    targetJumpAdjustment?: number;
    targetIsLarge?: boolean;
    targetIsAirborneVTOL?: boolean;
    targetIsEmplacement?: boolean;
    targetCarryingBattleArmor?: boolean;
    /** Intervening or occupied woods (from the spotter's line of sight for indirect fire). */
    woods?: boolean;
    /** Partial cover (from the spotter's line of sight for indirect fire). Only 'Mechs can claim it in Aces. */
    partialCover?: boolean;

    /** Required for indirect fire. */
    spotter?: IAcesSpotterInput;
    /** The attacker is an automated (Aces) unit: TN 13+ means the target is ignored (Aces p.18). */
    automatedAttacker?: boolean;
}

export interface IAcesModifier {
    label: string;
    value: number;
}

export interface IAcesToHitResult {
    targetNumber: number;
    rangeBracket: TAcesRangeBracket | null;
    modifiers: IAcesModifier[];
    /** False when the attack cannot be made as described. */
    allowed: boolean;
    notes: string[];
}

/** Range brackets in inches (ASCE p.44). */
export const getAcesRangeBracket = ( inches: number ): TAcesRangeBracket => {
    if( inches <= 6 ) return "short";
    if( inches <= 24 ) return "medium";
    if( inches <= 42 ) return "long";
    return "extreme";
}

export const getAcesRangeModifier = ( bracket: TAcesRangeBracket ): number => {
    switch( bracket ) {
        case "short": return 0;
        case "medium": return 2;
        case "long": return 4;
        default: return 6;
    }
}

/** Attacker Movement Modifier (ASCE p.44). Infantry never apply an AMM (Aces p.5). */
export const getAcesAttackerMovementModifier = ( movement: TAcesMovementMode, isInfantry: boolean = false ): number => {
    if( isInfantry ) return 0;
    if( movement === "jump" ) return 2;
    if( movement === "standstill" || movement === "immobile" ) return -1;
    return 0;
}

/** Target Movement Modifier (ASCE p.44). */
export const getAcesTargetMovementModifier = (
    movement: TAcesMovementMode,
    tmm: number,
    jumpAdjustment: number = 0,
): number => {
    if( movement === "immobile" ) return -4;
    if( movement === "standstill" ) return 0;
    if( movement === "jump" ) return tmm + 1 + jumpAdjustment;
    return tmm;
}

/** Only 'Mechs get partial cover: vehicles, infantry and other token units never do (Aces pp.3-5). */
export const canClaimAcesPartialCover = ( targetType: string ): boolean => {
    const type = targetType.trim().toUpperCase();
    return type === "BM" || type === "IM";
}

export const calculateAcesToHit = ( input: IAcesToHitInput ): IAcesToHitResult => {
    const modifiers: IAcesModifier[] = [];
    const notes: string[] = [];
    let allowed = true;
    const add = ( label: string, value: number ) => {
        if( value !== 0 ) modifiers.push( { label: label, value: value } );
    };

    const isPhysical = input.attackType === "charge" || input.attackType === "dfa" || input.attackType === "anti-mech";
    const isIndirect = input.attackType === "indirect";
    const targetType = input.targetType.trim().toUpperCase();

    let rangeBracket: TAcesRangeBracket | null = null;
    if( !isPhysical ) {
        rangeBracket = getAcesRangeBracket( input.rangeInches );
        add( "Range (" + rangeBracket + ")", getAcesRangeModifier( rangeBracket ) );
    }

    add( "Attacker movement", getAcesAttackerMovementModifier( input.attackerMovement, !!input.attackerIsInfantry ) );

    if( isIndirect ) {
        if( !input.spotter ) {
            allowed = false;
            notes.push( "Indirect fire needs a spotter (Aces p.3)." );
        } else {
            add( "Spotter movement", getAcesAttackerMovementModifier( input.spotter.movement, !!input.spotter.isInfantry ) );
            if( input.spotter.rangeToTargetInches > ACES_IF_SPOTTER_MAX_RANGE ) {
                allowed = false;
                notes.push( "The spotter must be within " + ACES_IF_SPOTTER_MAX_RANGE + "\" of the target (Aces p.3)." );
            }
            if( input.spotter.alsoAttacking ) {
                add( "Spotter is also attacking", ACES_IF_SPOTTER_ATTACKING_MODIFIER );
            }
        }
        add( "Indirect fire", ACES_IF_MODIFIER );
        notes.push( "Damage is the IF# value at every range; the attacker cannot add Overheat (Aces p.3)." );
    }

    const targetMovement = input.targetIsEmplacement ? "immobile" : input.targetMovement;
    add( "Target movement", getAcesTargetMovementModifier( targetMovement, input.targetTMM, input.targetJumpAdjustment || 0 ) );

    if( input.woods ) {
        add( "Woods", 1 );
    }
    if( input.partialCover ) {
        if( canClaimAcesPartialCover( targetType ) ) {
            add( "Partial cover", 1 );
        } else {
            notes.push( "Only 'Mechs receive the partial cover modifier (Aces pp.3-5)." );
        }
    }

    if( input.secondaryTarget ) add( "Secondary target", 1 );
    if( input.attackerIsSpotting && !isIndirect ) add( "Also spotting for indirect fire", ACES_IF_SPOTTER_ATTACKING_MODIFIER );
    if( input.attackerIsEmplacement ) add( "Attacker is an emplacement", ACES_EMPLACEMENT_ATTACK_MODIFIER );

    // Fire control and heat do not apply to physical attacks (ASCE p.44 notes 7-8).
    if( !isPhysical ) {
        add( "Fire control hits", ( input.attackerFireControlHits || 0 ) * 2 );
        add( "Heat", input.attackerHeat || 0 );
    }

    if( input.attackType === "charge" ) add( "Charge", 1 );
    if( input.attackType === "dfa" ) add( "Death from above", 1 );
    if( input.attackType === "anti-mech" ) {
        add( "Anti-'Mech attack", ACES_AM_ATTACK_MODIFIER );
        if( input.attackerIsConventionalInfantry ) add( "Conventional infantry", ACES_AM_CONVENTIONAL_INFANTRY_MODIFIER );
        if( input.targetCarryingBattleArmor ) add( "Target transporting battle armor", ACES_AM_TARGET_CARRYING_BA_MODIFIER );
    }

    if( targetType === "BA" ) add( "Target is battle armor", ACES_BATTLE_ARMOR_TARGET_MODIFIER );
    if( input.targetIsAirborneVTOL ) add( "Target is an airborne VTOL", 1 );
    if( input.targetIsLarge ) add( "Target is Large", -1 );

    const targetNumber = input.skill + modifiers.reduce( ( total, mod ) => total + mod.value, 0 );

    if( input.automatedAttacker && targetNumber > ACES_MAX_AUTOMATED_TARGET_NUMBER ) {
        allowed = false;
        notes.push( "Target Number 13 or more: an automated unit ignores this target and picks another (Aces p.18)." );
    }

    return {
        targetNumber: targetNumber,
        rangeBracket: rangeBracket,
        modifiers: modifiers,
        allowed: allowed,
        notes: notes,
    };
}

/* ---------------------------------------------------------------------------------------------------------------
 * Crippled units (Forced Withdrawal Special Order card, Aces p.8/16; ASCE p.127)
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesCrippleInput {
    startingArmor: number;
    currentArmor: number;
    startingStructure: number;
    currentStructure: number;
    /** Medium and long damage; minimal damage (0*) still counts as damage. */
    startingMediumDamage: number;
    startingLongDamage: number;
    startingMediumMinimal?: boolean;
    startingLongMinimal?: boolean;
    currentMediumDamage: number;
    currentLongDamage: number;
    currentMediumMinimal?: boolean;
    currentLongMinimal?: boolean;
    startingMove: number;
    currentMove: number;
    immobile?: boolean;
    isEmplacement?: boolean;
    /** Emplacements are crippled at 0 damage (Aces p.6). */
    currentShortDamage?: number;
    currentShortMinimal?: boolean;
}

export const getAcesCrippledReasons = ( input: IAcesCrippleInput ): string[] => {
    const reasons: string[] = [];

    if( input.isEmplacement ) {
        const noDamage = ( input.currentShortDamage || 0 ) === 0 && !input.currentShortMinimal
            && input.currentMediumDamage === 0 && !input.currentMediumMinimal
            && input.currentLongDamage === 0 && !input.currentLongMinimal;
        if( noDamage ) reasons.push( "Damage: emplacement reduced to 0 damage (Aces p.6)" );
        return reasons;
    }

    if( input.currentArmor <= 0 && input.currentStructure <= Math.ceil( input.startingStructure / 2 ) ) {
        reasons.push( "Armor: no armor left and structure at half or less (rounded up)" );
    }

    const startedWithDamage = input.startingMediumDamage > 0 || !!input.startingMediumMinimal
        || input.startingLongDamage > 0 || !!input.startingLongMinimal;
    const hasDamage = input.currentMediumDamage > 0 || !!input.currentMediumMinimal
        || input.currentLongDamage > 0 || !!input.currentLongMinimal;
    if( startedWithDamage && !hasDamage ) {
        reasons.push( "Damage: 0 for all Medium- and Long-range attacks" );
    }

    if( input.immobile || ( input.startingMove > 0 && input.currentMove <= 0 ) ) {
        reasons.push( "Movement: immobilized" );
    } else if( input.currentMove < input.startingMove / 2 ) {
        reasons.push( "Movement: less than half MV through critical hit effects" );
    }

    return reasons;
}

/** Reads the crippled-check values off a unit in play. */
export const getAcesCrippleInputForUnit = ( unit: AlphaStrikeUnit ): IAcesCrippleInput => {
    // Heat also lowers Move, but only critical hit effects count toward crippling: read Move with heat at 0.
    const heat = unit.currentHeat;
    unit.currentHeat = 0;
    unit.calcCurrentValues();
    const startingMove = unit.move.length > 0 ? unit.move[0].move : 0;
    const currentMove = unit.move.length > 0 ? unit.move[0].currentMove : 0;
    unit.currentHeat = heat;
    unit.calcCurrentValues();
    return {
        startingArmor: unit.armor,
        currentArmor: unit.getCurrentArmor(),
        startingStructure: unit.structure,
        currentStructure: unit.getCurrentStructure(),
        startingMediumDamage: +unit.damage.medium || 0,
        startingLongDamage: +unit.damage.long || 0,
        startingMediumMinimal: unit.damage.mediumMinimal,
        startingLongMinimal: unit.damage.longMinimal,
        currentMediumDamage: +unit.currentDamage.medium || 0,
        currentLongDamage: +unit.currentDamage.long || 0,
        currentMediumMinimal: unit.currentDamage.mediumMinimal,
        currentLongMinimal: unit.currentDamage.longMinimal,
        currentShortDamage: +unit.currentDamage.short || 0,
        currentShortMinimal: unit.currentDamage.shortMinimal,
        startingMove: startingMove,
        currentMove: currentMove,
        immobile: unit.immobile,
    };
}

export const getAcesCrippledReasonsForUnit = ( unit: AlphaStrikeUnit ): string[] => {
    if( unit.isWrecked() ) return [];
    return getAcesCrippledReasons( getAcesCrippleInputForUnit( unit ) );
}

/* ---------------------------------------------------------------------------------------------------------------
 * "Front-loaded" unequal numbers of units (Aces p.6)
 * ------------------------------------------------------------------------------------------------------------- */

export type TAcesSide = "player" | "automated";

export interface IAcesMoveStep {
    side: TAcesSide;
    count: number;
}

/**
 * Before each pair of movements, a side with more units left to move moves 2, more than twice as many moves 3,
 * and so forth, i.e. ceil(more / fewer). The Initiative loser moves first in each pair. Units that cannot move
 * this turn (immobile, shut down, emplacements, transported infantry) are not counted.
 */
export const getAcesFrontLoadedMoveOrder = (
    initiativeLoser: TAcesSide,
    loserUnits: number,
    winnerUnits: number,
): IAcesMoveStep[][] => {
    const winner: TAcesSide = initiativeLoser === "player" ? "automated" : "player";
    const pairs: IAcesMoveStep[][] = [];
    let loserLeft = Math.max( 0, Math.floor( loserUnits ) );
    let winnerLeft = Math.max( 0, Math.floor( winnerUnits ) );

    while( loserLeft > 0 || winnerLeft > 0 ) {
        const pair: IAcesMoveStep[] = [];
        if( loserLeft === 0 || winnerLeft === 0 ) {
            if( loserLeft > 0 ) pair.push( { side: initiativeLoser, count: loserLeft } );
            if( winnerLeft > 0 ) pair.push( { side: winner, count: winnerLeft } );
            pairs.push( pair );
            break;
        }
        const loserMoves = loserLeft > winnerLeft ? Math.ceil( loserLeft / winnerLeft ) : 1;
        const winnerMoves = winnerLeft > loserLeft ? Math.ceil( winnerLeft / loserLeft ) : 1;
        pair.push( { side: initiativeLoser, count: Math.min( loserMoves, loserLeft ) } );
        pair.push( { side: winner, count: Math.min( winnerMoves, winnerLeft ) } );
        loserLeft -= Math.min( loserMoves, loserLeft );
        winnerLeft -= Math.min( winnerMoves, winnerLeft );
        pairs.push( pair );
    }

    return pairs;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Automated activation order (Aces pp.8, 11, 16, 18)
 * ------------------------------------------------------------------------------------------------------------- */

export type TAcesPriorityToken = "move-first" | "move-last";

export interface IAcesActivationInput {
    id: string;
    /** Priority number on the revealed side of the top Aces card; null when not entered yet. */
    priority: number | null;
    pv: number;
    token?: TAcesPriorityToken | null;
    forcedWithdrawal?: boolean;
    fleeing?: boolean;
}

/**
 * Movement priority: Move First = 000, Move Last = 1000 (Aces p.8); Forced Withdrawal subtracts 500, which can go
 * negative (Aces p.16). Units under Forced Withdrawal or Fleeing orders cannot hold a token (Aces p.8). In the
 * Combat Phase only the printed combat-side number counts; Special Orders have no effect there (Aces p.18).
 */
export const getAcesEffectivePriority = ( unit: IAcesActivationInput, phase: "movement" | "combat" ): number | null => {
    if( phase === "combat" ) return unit.priority;
    const canHoldToken = !unit.forcedWithdrawal && !unit.fleeing;
    if( canHoldToken && unit.token === "move-first" ) return ACES_MOVE_FIRST_PRIORITY;
    if( canHoldToken && unit.token === "move-last" ) return ACES_MOVE_LAST_PRIORITY;
    if( unit.priority === null ) return null;
    if( unit.forcedWithdrawal ) return unit.priority + ACES_FORCED_WITHDRAWAL_PRIORITY_MODIFIER;
    return unit.priority;
}

/**
 * Lowest priority first; ties go lowest PV first (Aces p.11). Units still tied keep their input order (the
 * players choose). Units without a priority go last.
 */
export const sortAcesActivation = <T extends IAcesActivationInput>( units: T[], phase: "movement" | "combat" ): T[] => {
    return units
        .map( ( unit, index ) => ( { unit: unit, index: index, priority: getAcesEffectivePriority( unit, phase ) } ) )
        .sort( ( a, b ) => {
            if( a.priority === null && b.priority !== null ) return 1;
            if( b.priority === null && a.priority !== null ) return -1;
            if( a.priority !== null && b.priority !== null && a.priority !== b.priority ) return a.priority - b.priority;
            if( a.unit.pv !== b.unit.pv ) return a.unit.pv - b.unit.pv;
            return a.index - b.index;
        } )
        .map( ( entry ) => entry.unit );
}

/* ---------------------------------------------------------------------------------------------------------------
 * Aces decks (Aces pp.10, 19, 38-39; Aces SS p.20)
 * ------------------------------------------------------------------------------------------------------------- */

/**
 * Splitting a shared deck: equal piles, one per unit; extras are set aside until the next reshuffle (Aces p.38).
 */
export const splitAcesDeck = ( totalCards: number, units: number ): { cardsPerUnit: number, setAside: number } => {
    if( units <= 0 ) return { cardsPerUnit: 0, setAside: totalCards };
    const cardsPerUnit = Math.floor( totalCards / units );
    return { cardsPerUnit: cardsPerUnit, setAside: totalCards - cardsPerUnit * units };
}

/**
 * The default deck for a unit from its role and movement (Aces p.39, Aces SS p.20). Returns null when the role has
 * no Aces deck; the players pick one (any unit can use any deck).
 */
export const suggestAcesDeck = (
    role: string,
    moveTypes: string[],
    abilities: string[],
    hasScouringSands: boolean,
): TAcesDeckId | null => {
    const normalized = role.trim().toLowerCase();
    const types = moveTypes.map( ( type ) => type.trim().toLowerCase() );
    const wheeledOrHover = types.indexOf( "w" ) > -1 || types.indexOf( "h" ) > -1;
    const hasJMPS = abilities.some( ( ability ) => /^jmps\d*$/i.test( ability.trim() ) );

    switch( normalized ) {
        case "ambusher": return "ambusher-infantry";
        case "brawler": return "brawler";
        case "missile boat": return "missile-boat";
        case "juggernaut": return "juggernaut";
        case "sniper": return "sniper";
        case "scout": return hasScouringSands && wheeledOrHover ? "scout-hover" : "scout";
        case "striker": return hasScouringSands && wheeledOrHover ? "striker-hover" : "striker";
        case "skirmisher": return hasScouringSands && hasJMPS ? "skirmisher-jmps" : "skirmisher";
        default: return null;
    }
}

export const suggestAcesDeckForUnit = ( unit: AlphaStrikeUnit, hasScouringSands: boolean ): TAcesDeckId | null => {
    return suggestAcesDeck(
        unit.role || "",
        unit.move.map( ( move ) => move.type || "" ),
        unit.abilities || [],
        hasScouringSands,
    );
}

/* ---------------------------------------------------------------------------------------------------------------
 * Initiative (Aces p.32)
 * ------------------------------------------------------------------------------------------------------------- */

export const getAcesInitiativeModifiers = (
    wonLastTurn: boolean,
    commanderDestroyed: boolean,
    campaign: boolean,
): IAcesModifier[] => {
    const rv: IAcesModifier[] = [];
    // The winner's penalty is a campaign rule (Aces p.32).
    if( campaign && wonLastTurn ) rv.push( { label: "Won Initiative last turn", value: ACES_INITIATIVE_LAST_WINNER_MODIFIER } );
    // A lost commander affects Initiative in any Aces game (Aces pp.32, 39).
    if( commanderDestroyed ) rv.push( { label: "Force Commander destroyed", value: ACES_INITIATIVE_COMMANDER_DESTROYED_MODIFIER } );
    return rv;
}
