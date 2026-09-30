/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 * Any original, fan-made content or custom homebrew data processed by this tool
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 */

import { generateUUID } from "../utils/generateUUID";
import { acesDecks, IAcesSource, TAcesDeckId } from "./aces-rules";

/*
 * BattleTech: Aces card and sortie records. Players type in the cards and sorties they own; the app ships one
 * sample of each kind (aces-card-samples.ts), transcribed from the printed examples and cited to the page.
 *
 * Card text keeps the printed wording. Icons are written as bracket tokens (see acesIconTokens) so a card can be
 * typed on any keyboard and still render with its icons: "in [lowest] enemy [range]" reads "in the attack range of
 * the fewest enemies" (Aces p.9 and the rulebook back cover).
 */

export const ACES_CARD_LIBRARY_VERSION = 1;

export type TAcesColor = "red" | "yellow" | "blue";
export const acesColors: TAcesColor[] = [ "red", "yellow", "blue" ];

/** Movement icons (Aces p.9): Ground, Sprinting, Jumping, Standstill. */
export type TAcesMoveType = "ground" | "sprint" | "jump" | "standstill";
export const acesMoveTypes: TAcesMoveType[] = [ "ground", "sprint", "jump", "standstill" ];

export type TAcesBehavior = "aggressive" | "balanced" | "cautious";
export const acesBehaviorIds: TAcesBehavior[] = [ "aggressive", "balanced", "cautious" ];

/**
 * Icon tokens for card text (Aces p.9). Label is what the app prints; meaning is the rulebook definition in our
 * own words.
 */
export const acesIconTokens: { token: string, label: string, meaning: string }[] = [
    { token: "moved", label: "✔", meaning: "Moved: has moved this turn or is immobile" },
    { token: "notmoved", label: "✖", meaning: "Not moved: can still move this turn" },
    { token: "highest", label: "▲", meaning: "Highest: currently has the most of the stat (include heat, STL, BA +1)" },
    { token: "lowest", label: "▼", meaning: "Lowest: currently has the least of the stat" },
    { token: "los", label: "👁", meaning: "Line of sight" },
    { token: "nolos", label: "⊘", meaning: "No line of sight" },
    { token: "range", label: "⌖", meaning: "In attack range: can see it at a range with non-zero damage" },
    { token: "closer", label: "›‹", meaning: "Get closer: into the rear or outside the firing arc if able" },
    { token: "spacing", label: "‹›", meaning: "Maintain spacing: try to be this far from the target" },
    { token: "zone", label: "◎", meaning: "Zone: circular distance for identifying targets" },
    { token: "S", label: "‹S›", meaning: "Short range (6\")" },
    { token: "M", label: "‹M›", meaning: "Medium range (24\")" },
    { token: "L", label: "‹L›", meaning: "Long range (42\")" },
    { token: "ground", label: "G", meaning: "Ground movement" },
    { token: "sprint", label: "S", meaning: "Sprinting movement" },
    { token: "jump", label: "J", meaning: "Jumping movement" },
    { token: "standstill", label: "■", meaning: "Standstill" },
    { token: "moveobj", label: "⊗", meaning: "Movement Objective" },
    { token: "destroyobj", label: "⊕", meaning: "Destroy Objective" },
    { token: "red", label: "RED", meaning: "Red enemy on the current Command card" },
    { token: "yellow", label: "YELLOW", meaning: "Yellow enemy on the current Command card" },
    { token: "blue", label: "BLUE", meaning: "Blue enemy on the current Command card" },
];

export interface IAcesTextSegment {
    kind: "text" | "icon";
    value: string;
    /** For icons: the display label and tooltip. */
    label?: string;
    meaning?: string;
}

/** Splits card text into plain text and icon tokens. Unknown bracket words are left as text. */
export const parseAcesText = ( text: string ): IAcesTextSegment[] => {
    const rv: IAcesTextSegment[] = [];
    const pattern = /\[([A-Za-z]+)\]/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while( ( match = pattern.exec( text ) ) !== null ) {
        const icon = acesIconTokens.find( ( entry ) => entry.token === match![1] || entry.token === match![1].toLowerCase() );
        if( !icon ) continue;
        if( match.index > last ) rv.push( { kind: "text", value: text.substring( last, match.index ) } );
        rv.push( { kind: "icon", value: icon.token, label: icon.label, meaning: icon.meaning } );
        last = match.index + match[0].length;
    }
    if( last < text.length ) rv.push( { kind: "text", value: text.substring( last ) } );
    return rv;
}

/** Plain-text reading of card text, for logs and screen readers. */
export const acesTextToPlain = ( text: string ): string => {
    return parseAcesText( text ).map( ( segment ) => segment.kind === "icon" ? segment.label : segment.value ).join( "" );
}

/* ---------------------------------------------------------------------------------------------------------------
 * Priority rules: target filters, Command card color lists, support priorities
 * ------------------------------------------------------------------------------------------------------------- */

/** Stats the engine can read off an Alpha Strike unit to rank candidates. */
export type TAcesStat =
    "armor" | "structure" | "armor-lost" | "structure-lost" | "tmm" | "pv" | "mv" |
    "damage-s" | "damage-m" | "damage-l" | "size" | "heat";

export const acesStats: { id: TAcesStat, label: string }[] = [
    { id: "armor", label: "Armor" },
    { id: "structure", label: "Structure" },
    { id: "armor-lost", label: "Armor lost" },
    { id: "structure-lost", label: "Structure lost" },
    { id: "tmm", label: "TMM" },
    { id: "pv", label: "PV" },
    { id: "mv", label: "MV" },
    { id: "damage-s", label: "S damage" },
    { id: "damage-m", label: "M damage" },
    { id: "damage-l", label: "L damage" },
    { id: "size", label: "Size" },
    { id: "heat", label: "Heat" },
];

/**
 * One numbered line of a target list. Exactly one of stat, color or judged applies:
 * - stat + direction: the engine ranks by the unit's current value;
 * - color: use the current Command card's list for that color;
 * - judged: the players decide which candidates match (e.g. "Objective", "Attacked by ally this turn").
 */
export interface IAcesPriorityRule {
    text: string;
    stat?: TAcesStat | null;
    direction?: "highest" | "lowest" | null;
    color?: TAcesColor | null;
    /** Set for rules about a Destroy Objective; the engine matches units flagged as the objective. */
    objective?: boolean;
    /** A line the source doesn't show clearly; the engine skips it. */
    unresolved?: boolean;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Aces cards (Aces p.7)
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesBehaviorColumn {
    /** Shaded condition at the top; empty for the Cautious default. */
    condition: string;
    /** Zone rings in inches, closest first ("12\") 18\") 24\")"); empty when a keyword is used. */
    zoneRings: number[];
    zoneKeyword: "" | "nearest" | "any";
    /** ⌖ filter: only enemies the unit can attack after moving (Aces p.12). */
    targetInAttackRange: boolean;
    /** ✔ filter: only enemies that have moved (Aces p.12). */
    targetMoved: boolean;
    /** Chip after the filters: a Command card color, "nearest", or nothing. */
    targetSelect: TAcesColor | "nearest" | "";
    moveType: TAcesMoveType;
    /** Parenthesized alternative, e.g. "(J if needed)" or "(S if there are no enemies in 36\")". */
    altMoveType: TAcesMoveType | null;
    altMoveWhen: string;
    /** Ranked movement filters, printed text with icon tokens. */
    filters: string[];
}

export type TAcesOverheatAlso = "" | "destroyed" | "could-hit-structure" | "has-heat";
export type TAcesOverheatAction = "max" | "up-to" | "no-attack";

/** One OV instruction row on the combat side (Aces pp.7, 19). */
export interface IAcesOverheatRow {
    text: string;
    tnAtMost: number | null;
    tnAtLeast: number | null;
    join: "and" | "or";
    also: TAcesOverheatAlso;
    action: TAcesOverheatAction;
    ovLimit: number | null;
}

export interface IAcesCombatSide {
    zoneRings: number[];
    zoneKeyword: "" | "nearest" | "any";
    filters: IAcesPriorityRule[];
    overheat: IAcesOverheatRow[];
}

export interface IAcesCard {
    id: string;
    /** Deck name as printed ("Brawler"). */
    deck: string;
    deckId: TAcesDeckId | "";
    /** Card id in the deck, e.g. "4/6". */
    cardNumber: string;
    movePriority: number | null;
    combatPriority: number | null;
    aggressive: IAcesBehaviorColumn;
    balanced: IAcesBehaviorColumn;
    cautious: IAcesBehaviorColumn;
    combat: IAcesCombatSide;
    source: IAcesSource | null;
    sample: boolean;
    notes: string;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Command cards (Aces p.8)
 * ------------------------------------------------------------------------------------------------------------- */

export type TAcesOrderPhase = "initiative" | "movement" | "combat" | "end" | "any";

export interface IAcesCommandOrder {
    phase: TAcesOrderPhase;
    text: string;
    /** Orders that hand out a Move First / Move Last token, and how to pick the unit. */
    token: "move-first" | "move-last" | null;
    tokenRank: IAcesPriorityRule[];
    /** An order that overrides behavior for the phase (Aces p.11). */
    behavior: TAcesBehavior | null;
}

export type TAcesStrategyAuto = "" | "objective-complete" | "enemy-no-armor";

export interface IAcesStrategyRow {
    letter: string;
    text: string;
    /** Conditions the app can check from the game; everything else the players answer. */
    auto: TAcesStrategyAuto;
}

export interface IAcesCommandCard {
    id: string;
    /** Deck name, e.g. "Star Captain". */
    deck: string;
    faction: string;
    letter: string;
    cardNumber: string;
    orders: IAcesCommandOrder[];
    red: IAcesPriorityRule[];
    yellow: IAcesPriorityRule[];
    blue: IAcesPriorityRule[];
    supportOrders: string;
    /** Support order the engine checks: spend Battlefield Support only when it would hit structure. */
    supportOnlyIfStructure: boolean;
    emplacementZoneRings: number[];
    emplacements: IAcesPriorityRule[];
    artillery: IAcesPriorityRule[];
    bsp: IAcesPriorityRule[];
    strategy: IAcesStrategyRow[];
    source: IAcesSource | null;
    sample: boolean;
    notes: string;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Special Order cards (Aces pp.8, 16-17, 20)
 * ------------------------------------------------------------------------------------------------------------- */

export type TAcesSpecialOrderKind = "forced-withdrawal" | "fleeing" | "movement-objective" | "destroy-objective" | "indirect-attacks" | "other";

export interface IAcesSpecialOrder {
    id: string;
    kind: TAcesSpecialOrderKind;
    name: string;
    cardNumber: string;
    /** Printed priority: -500 is a modifier (Forced Withdrawal), 000 an absolute priority (Indirect Attacks). */
    priority: number | null;
    priorityIsModifier: boolean;
    /** Rules on the card, summarized. */
    rules: string[];
    /** Replacement behavior column (Forced Withdrawal, Fleeing). */
    column: IAcesBehaviorColumn | null;
    /** Filters numbered 0a, 0b ... applied before every column's own filters (Movement Objective). */
    preFilters: string[];
    /** Spotter selection list (Indirect Attacks). */
    spotter: string[];
    source: IAcesSource | null;
    sample: boolean;
    notes: string;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Sorties (Aces pp.28-33; Aces SS)
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesScenarioUnit {
    name: string;
    skill: number | null;
    /** Aces deck for opposing units. */
    deck: string;
    deckId: TAcesDeckId | "";
}

export interface IAcesScenarioObjective {
    kind: "primary" | "secondary";
    type: "destroy" | "movement" | "other";
    text: string;
    sp: number | null;
}

export interface IAcesWaypoint {
    /** Turn track space the token sits on. */
    turn: number;
    label: string;
    text: string;
}

export interface IAcesSpecialRule {
    phase: TAcesOrderPhase | "setup";
    name: string;
    text: string;
}

export interface IAcesScenario {
    id: string;
    /** Sortie code as printed, e.g. "00". */
    code: string;
    name: string;
    campaign: string;
    playArea: string;
    playerPVLimit: number | null;
    playerUnits: IAcesScenarioUnit[];
    playerUnitsNote: string;
    opposingName: string;
    opposingPV: number | null;
    commandDeck: string;
    commandStartCard: string;
    opposingUnits: IAcesScenarioUnit[];
    objectives: IAcesScenarioObjective[];
    turnLimit: number | null;
    sortieEnd: string;
    reconnaissance: string;
    waypointSetup: string;
    waypoints: IAcesWaypoint[];
    specialRules: IAcesSpecialRule[];
    /** Stacked deck order, top card first, for guided sorties. */
    deckOrder: { deck: string, cards: string[] }[];
    /** Story text is not stored: point players at the book entry instead. */
    storyReference: string;
    source: IAcesSource | null;
    sample: boolean;
    notes: string;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Library: everything a player has entered, saved together
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesCardLibrary {
    version: number;
    cards: IAcesCard[];
    commandCards: IAcesCommandCard[];
    specialOrders: IAcesSpecialOrder[];
    scenarios: IAcesScenario[];
}

/* ----- constructors ----- */

export const newAcesBehaviorColumn = (): IAcesBehaviorColumn => {
    return {
        condition: "",
        zoneRings: [],
        zoneKeyword: "",
        targetInAttackRange: false,
        targetMoved: false,
        targetSelect: "",
        moveType: "ground",
        altMoveType: null,
        altMoveWhen: "",
        filters: [],
    };
}

export const newAcesCard = (): IAcesCard => {
    return {
        id: generateUUID(),
        deck: "",
        deckId: "",
        cardNumber: "",
        movePriority: null,
        combatPriority: null,
        aggressive: newAcesBehaviorColumn(),
        balanced: newAcesBehaviorColumn(),
        cautious: { ...newAcesBehaviorColumn(), zoneKeyword: "nearest" },
        combat: { zoneRings: [], zoneKeyword: "", filters: [], overheat: [] },
        source: null,
        sample: false,
        notes: "",
    };
}

export const newAcesCommandCard = (): IAcesCommandCard => {
    return {
        id: generateUUID(),
        deck: "",
        faction: "",
        letter: "A",
        cardNumber: "",
        orders: [],
        red: [],
        yellow: [],
        blue: [],
        supportOrders: "",
        supportOnlyIfStructure: false,
        emplacementZoneRings: [],
        emplacements: [],
        artillery: [],
        bsp: [],
        strategy: [],
        source: null,
        sample: false,
        notes: "",
    };
}

export const newAcesSpecialOrder = (): IAcesSpecialOrder => {
    return {
        id: generateUUID(),
        kind: "other",
        name: "",
        cardNumber: "",
        priority: null,
        priorityIsModifier: false,
        rules: [],
        column: null,
        preFilters: [],
        spotter: [],
        source: null,
        sample: false,
        notes: "",
    };
}

export const newAcesScenario = (): IAcesScenario => {
    return {
        id: generateUUID(),
        code: "",
        name: "",
        campaign: "",
        playArea: "48x48\"",
        playerPVLimit: null,
        playerUnits: [],
        playerUnitsNote: "",
        opposingName: "",
        opposingPV: null,
        commandDeck: "",
        commandStartCard: "A",
        opposingUnits: [],
        objectives: [],
        turnLimit: null,
        sortieEnd: "",
        reconnaissance: "",
        waypointSetup: "",
        waypoints: [],
        specialRules: [],
        deckOrder: [],
        storyReference: "",
        source: null,
        sample: false,
        notes: "",
    };
}

export const newAcesCardLibrary = (): IAcesCardLibrary => {
    return {
        version: ACES_CARD_LIBRARY_VERSION,
        cards: [],
        commandCards: [],
        specialOrders: [],
        scenarios: [],
    };
}

/* ----- normalizing imported or saved records ----- */

const str = ( value: unknown, fallback: string = "" ): string => typeof value === "string" ? value : fallback;
const num = ( value: unknown ): number | null => {
    if( value === null || value === undefined || value === "" ) return null;
    const rv = +( value as number );
    return isFinite( rv ) ? rv : null;
}
const bool = ( value: unknown ): boolean => value === true;
const arr = <T>( value: unknown, map: ( item: unknown ) => T | null ): T[] => {
    if( !Array.isArray( value ) ) return [];
    const rv: T[] = [];
    for( const item of value ) {
        const mapped = map( item );
        if( mapped !== null ) rv.push( mapped );
    }
    return rv;
}
const obj = ( value: unknown ): Record<string, unknown> => value && typeof value === "object" && !Array.isArray( value ) ? value as Record<string, unknown> : {};
const oneOf = <T extends string>( value: unknown, options: readonly T[], fallback: T ): T => options.indexOf( value as T ) > -1 ? value as T : fallback;
const rings = ( value: unknown ): number[] => arr( value, ( item ) => {
    const rv = num( item );
    return rv !== null && rv > 0 ? rv : null;
} );
const strings = ( value: unknown ): string[] => arr( value, ( item ) => typeof item === "string" ? item : null );
const source = ( value: unknown ): IAcesSource | null => {
    const data = obj( value );
    if( typeof data.book !== "string" ) return null;
    return { book: data.book, page: num( data.page ) || 0 };
}
const statIds = acesStats.map( ( stat ) => stat.id );

export const normalizeAcesPriorityRule = ( value: unknown ): IAcesPriorityRule | null => {
    if( typeof value === "string" ) return { text: value };
    const data = obj( value );
    if( typeof data.text !== "string" ) return null;
    const rv: IAcesPriorityRule = { text: data.text };
    if( statIds.indexOf( data.stat as TAcesStat ) > -1 ) rv.stat = data.stat as TAcesStat;
    if( data.direction === "highest" || data.direction === "lowest" ) rv.direction = data.direction;
    if( acesColors.indexOf( data.color as TAcesColor ) > -1 ) rv.color = data.color as TAcesColor;
    if( data.objective === true ) rv.objective = true;
    if( data.unresolved === true ) rv.unresolved = true;
    return rv;
}

export const normalizeAcesBehaviorColumn = ( value: unknown ): IAcesBehaviorColumn => {
    const data = obj( value );
    const altMoveType = acesMoveTypes.indexOf( data.altMoveType as TAcesMoveType ) > -1 ? data.altMoveType as TAcesMoveType : null;
    return {
        condition: str( data.condition ),
        zoneRings: rings( data.zoneRings ),
        zoneKeyword: oneOf( data.zoneKeyword, [ "", "nearest", "any" ] as const, "" ),
        targetInAttackRange: bool( data.targetInAttackRange ),
        targetMoved: bool( data.targetMoved ),
        targetSelect: oneOf( data.targetSelect, [ "", "nearest", "red", "yellow", "blue" ] as const, "" ),
        moveType: oneOf( data.moveType, acesMoveTypes, "ground" ),
        altMoveType: altMoveType,
        altMoveWhen: str( data.altMoveWhen ),
        filters: strings( data.filters ),
    };
}

const normalizeOverheatRow = ( value: unknown ): IAcesOverheatRow | null => {
    const data = obj( value );
    if( typeof data.text !== "string" ) return null;
    return {
        text: data.text,
        tnAtMost: num( data.tnAtMost ),
        tnAtLeast: num( data.tnAtLeast ),
        join: data.join === "or" ? "or" : "and",
        also: oneOf( data.also, [ "", "destroyed", "could-hit-structure", "has-heat" ] as const, "" ),
        action: oneOf( data.action, [ "max", "up-to", "no-attack" ] as const, "up-to" ),
        ovLimit: num( data.ovLimit ),
    };
}

export const normalizeAcesCard = ( value: unknown ): IAcesCard | null => {
    const data = obj( value );
    if( typeof data.deck !== "string" ) return null;
    const combat = obj( data.combat );
    return {
        id: str( data.id ) || generateUUID(),
        deck: data.deck,
        deckId: str( data.deckId ) as TAcesDeckId | "",
        cardNumber: str( data.cardNumber ),
        movePriority: num( data.movePriority ),
        combatPriority: num( data.combatPriority ),
        aggressive: normalizeAcesBehaviorColumn( data.aggressive ),
        balanced: normalizeAcesBehaviorColumn( data.balanced ),
        cautious: normalizeAcesBehaviorColumn( data.cautious ),
        combat: {
            zoneRings: rings( combat.zoneRings ),
            zoneKeyword: oneOf( combat.zoneKeyword, [ "", "nearest", "any" ] as const, "" ),
            filters: arr( combat.filters, normalizeAcesPriorityRule ),
            overheat: arr( combat.overheat, normalizeOverheatRow ),
        },
        source: source( data.source ),
        sample: bool( data.sample ),
        notes: str( data.notes ),
    };
}

const normalizeOrder = ( value: unknown ): IAcesCommandOrder | null => {
    const data = obj( value );
    if( typeof data.text !== "string" ) return null;
    return {
        phase: oneOf( data.phase, [ "initiative", "movement", "combat", "end", "any" ] as const, "any" ),
        text: data.text,
        token: data.token === "move-first" || data.token === "move-last" ? data.token : null,
        tokenRank: arr( data.tokenRank, normalizeAcesPriorityRule ),
        behavior: acesBehaviorIds.indexOf( data.behavior as TAcesBehavior ) > -1 ? data.behavior as TAcesBehavior : null,
    };
}

const normalizeStrategyRow = ( value: unknown ): IAcesStrategyRow | null => {
    const data = obj( value );
    if( typeof data.letter !== "string" || typeof data.text !== "string" ) return null;
    return {
        letter: data.letter,
        text: data.text,
        auto: oneOf( data.auto, [ "", "objective-complete", "enemy-no-armor" ] as const, "" ),
    };
}

export const normalizeAcesCommandCard = ( value: unknown ): IAcesCommandCard | null => {
    const data = obj( value );
    if( typeof data.deck !== "string" ) return null;
    return {
        id: str( data.id ) || generateUUID(),
        deck: data.deck,
        faction: str( data.faction ),
        letter: str( data.letter, "A" ) || "A",
        cardNumber: str( data.cardNumber ),
        orders: arr( data.orders, normalizeOrder ),
        red: arr( data.red, normalizeAcesPriorityRule ),
        yellow: arr( data.yellow, normalizeAcesPriorityRule ),
        blue: arr( data.blue, normalizeAcesPriorityRule ),
        supportOrders: str( data.supportOrders ),
        supportOnlyIfStructure: bool( data.supportOnlyIfStructure ),
        emplacementZoneRings: rings( data.emplacementZoneRings ),
        emplacements: arr( data.emplacements, normalizeAcesPriorityRule ),
        artillery: arr( data.artillery, normalizeAcesPriorityRule ),
        bsp: arr( data.bsp, normalizeAcesPriorityRule ),
        strategy: arr( data.strategy, normalizeStrategyRow ),
        source: source( data.source ),
        sample: bool( data.sample ),
        notes: str( data.notes ),
    };
}

export const normalizeAcesSpecialOrder = ( value: unknown ): IAcesSpecialOrder | null => {
    const data = obj( value );
    if( typeof data.name !== "string" ) return null;
    return {
        id: str( data.id ) || generateUUID(),
        kind: oneOf( data.kind, [ "forced-withdrawal", "fleeing", "movement-objective", "destroy-objective", "indirect-attacks", "other" ] as const, "other" ),
        name: data.name,
        cardNumber: str( data.cardNumber ),
        priority: num( data.priority ),
        priorityIsModifier: bool( data.priorityIsModifier ),
        rules: strings( data.rules ),
        column: data.column ? normalizeAcesBehaviorColumn( data.column ) : null,
        preFilters: strings( data.preFilters ),
        spotter: strings( data.spotter ),
        source: source( data.source ),
        sample: bool( data.sample ),
        notes: str( data.notes ),
    };
}

const normalizeScenarioUnit = ( value: unknown ): IAcesScenarioUnit | null => {
    const data = obj( value );
    if( typeof data.name !== "string" ) return null;
    return {
        name: data.name,
        skill: num( data.skill ),
        deck: str( data.deck ),
        deckId: str( data.deckId ) as TAcesDeckId | "",
    };
}

export const normalizeAcesScenario = ( value: unknown ): IAcesScenario | null => {
    const data = obj( value );
    if( typeof data.name !== "string" ) return null;
    return {
        id: str( data.id ) || generateUUID(),
        code: str( data.code ),
        name: data.name,
        campaign: str( data.campaign ),
        playArea: str( data.playArea ),
        playerPVLimit: num( data.playerPVLimit ),
        playerUnits: arr( data.playerUnits, normalizeScenarioUnit ),
        playerUnitsNote: str( data.playerUnitsNote ),
        opposingName: str( data.opposingName ),
        opposingPV: num( data.opposingPV ),
        commandDeck: str( data.commandDeck ),
        commandStartCard: str( data.commandStartCard, "A" ) || "A",
        opposingUnits: arr( data.opposingUnits, normalizeScenarioUnit ),
        objectives: arr( data.objectives, ( item ) => {
            const entry = obj( item );
            if( typeof entry.text !== "string" ) return null;
            return {
                kind: entry.kind === "secondary" ? "secondary" : "primary",
                type: oneOf( entry.type, [ "destroy", "movement", "other" ] as const, "other" ),
                text: entry.text,
                sp: num( entry.sp ),
            } as IAcesScenarioObjective;
        } ),
        turnLimit: num( data.turnLimit ),
        sortieEnd: str( data.sortieEnd ),
        reconnaissance: str( data.reconnaissance ),
        waypointSetup: str( data.waypointSetup ),
        waypoints: arr( data.waypoints, ( item ) => {
            const entry = obj( item );
            const turn = num( entry.turn );
            if( turn === null ) return null;
            return { turn: turn, label: str( entry.label ), text: str( entry.text ) };
        } ),
        specialRules: arr( data.specialRules, ( item ) => {
            const entry = obj( item );
            if( typeof entry.text !== "string" ) return null;
            return {
                phase: oneOf( entry.phase, [ "setup", "initiative", "movement", "combat", "end", "any" ] as const, "any" ),
                name: str( entry.name ),
                text: entry.text,
            } as IAcesSpecialRule;
        } ),
        deckOrder: arr( data.deckOrder, ( item ) => {
            const entry = obj( item );
            if( typeof entry.deck !== "string" ) return null;
            return { deck: entry.deck, cards: strings( entry.cards ) };
        } ),
        storyReference: str( data.storyReference ),
        source: source( data.source ),
        sample: bool( data.sample ),
        notes: str( data.notes ),
    };
}

export const normalizeAcesCardLibrary = ( value: unknown ): IAcesCardLibrary => {
    const data = obj( value );
    return {
        version: ACES_CARD_LIBRARY_VERSION,
        cards: arr( data.cards, normalizeAcesCard ),
        commandCards: arr( data.commandCards, normalizeAcesCommandCard ),
        specialOrders: arr( data.specialOrders, normalizeAcesSpecialOrder ),
        scenarios: arr( data.scenarios, normalizeAcesScenario ),
    };
}

/**
 * Merges imported records into a library. Records with the same id are replaced; the rest are added.
 */
export const mergeAcesCardLibrary = ( base: IAcesCardLibrary, incoming: IAcesCardLibrary ): IAcesCardLibrary => {
    const merge = <T extends { id: string }>( a: T[], b: T[] ): T[] => a.filter( ( item ) => !b.some( ( other ) => other.id === item.id ) ).concat( b );
    return {
        version: ACES_CARD_LIBRARY_VERSION,
        cards: merge( base.cards, incoming.cards ),
        commandCards: merge( base.commandCards, incoming.commandCards ),
        specialOrders: merge( base.specialOrders, incoming.specialOrders ),
        scenarios: merge( base.scenarios, incoming.scenarios ),
    };
}

/* ----- reading typed lines (the library editor takes one line per rule) ----- */

const statSynonyms: { [label: string]: TAcesStat } = {
    "armor": "armor", "structure": "structure", "armor lost": "armor-lost", "structure lost": "structure-lost",
    "tmm": "tmm", "pv": "pv", "mv": "mv", "move": "mv", "s damage": "damage-s", "m damage": "damage-m",
    "l damage": "damage-l", "size": "size", "heat": "heat",
};

/**
 * Reads one typed target-list line. "[lowest] Armor" ranks by a stat; "[yellow]" (optionally followed by "list" or
 * "command list") uses a Command card color list; "[destroyobj] Objective" matches objectives; anything else is
 * judged by the players. A leading "?" marks a line the source doesn't show clearly.
 */
export const parseAcesPriorityLine = ( line: string ): IAcesPriorityRule => {
    let text = line.trim();
    if( text.startsWith( "?" ) ) {
        return { text: text.substring( 1 ).trim(), unresolved: true };
    }
    const color = /^\[(red|yellow|blue)\](\s*(command\s+)?list)?$/i.exec( text );
    if( color ) return { text: text, color: color[1].toLowerCase() as TAcesColor };
    if( /\[destroyobj\]/i.test( text ) ) return { text: text, objective: true };
    const ranked = /^\[(highest|lowest)\]\s*(.+)$/i.exec( text );
    if( ranked ) {
        const stat = statSynonyms[ ranked[2].trim().toLowerCase() ];
        if( stat ) return { text: text, stat: stat, direction: ranked[1].toLowerCase() as "highest" | "lowest" };
    }
    text = text.replace( /\s+/g, " " );
    return { text: text };
}

export const formatAcesPriorityLine = ( rule: IAcesPriorityRule ): string => {
    return ( rule.unresolved ? "? " : "" ) + rule.text;
}

/**
 * Reads a printed OV instruction, e.g. "If TN6 or less and OV might let unit hit target's structure: Use up to 3
 * OV." Returns null when the action after the colon isn't one the engine knows.
 */
export const parseAcesOverheatLine = ( line: string ): IAcesOverheatRow | null => {
    const text = line.trim();
    const colon = text.lastIndexOf( ":" );
    if( colon < 0 ) return null;
    const condition = text.substring( 0, colon );
    const action = text.substring( colon + 1 );
    const atMost = /TN\s*(\d+)\s*or\s+less/i.exec( condition );
    const atLeast = /TN\s*(\d+)\s*or\s+more/i.exec( condition );
    let also: TAcesOverheatAlso = "";
    if( /destroyed/i.test( condition ) ) also = "destroyed";
    else if( /structure/i.test( condition ) ) also = "could-hit-structure";
    else if( /\bheat\b/i.test( condition.replace( /overheat/ig, "" ) ) ) also = "has-heat";
    const join: "and" | "or" = /\bor\b/i.test( condition.replace( /or\s+(less|more)/ig, "" ) ) ? "or" : "and";
    const upTo = /up\s+to\s+(\d+)/i.exec( action );
    let rowAction: TAcesOverheatAction;
    let limit: number | null = null;
    if( /(don'?t|do not)\s+attack/i.test( action ) ) rowAction = "no-attack";
    else if( /maximum/i.test( action ) ) rowAction = "max";
    else if( upTo ) {
        rowAction = "up-to";
        limit = +upTo[1];
    }
    else return null;
    return {
        text: text,
        tnAtMost: atMost ? +atMost[1] : null,
        tnAtLeast: atLeast ? +atLeast[1] : null,
        join: join,
        also: also,
        action: rowAction,
        ovLimit: limit,
    };
}

/** Zone text: "12 18 24" (inches, closest first), "nearest" or "any". */
export const parseAcesZone = ( text: string ): { zoneRings: number[], zoneKeyword: "" | "nearest" | "any" } => {
    const value = text.trim().toLowerCase();
    if( value === "nearest" || value === "any" ) return { zoneRings: [], zoneKeyword: value };
    const numbers = ( value.match( /\d+(\.\d+)?/g ) || [] ).map( ( item ) => +item ).filter( ( item ) => item > 0 );
    return { zoneRings: numbers, zoneKeyword: "" };
}

export const formatAcesZone = ( zoneRings: number[], zoneKeyword: "" | "nearest" | "any" ): string => {
    return zoneKeyword ? zoneKeyword : zoneRings.join( " " );
}

/**
 * A Command card order line: "phase | printed text | behavior". Move First / Move Last orders are recognized from
 * the text and their ranking read from the parenthesized list, e.g. "(▲M Damage, ▲PV)".
 */
export const parseAcesCommandOrderLine = ( line: string ): IAcesCommandOrder | null => {
    const parts = line.split( "|" ).map( ( part ) => part.trim() );
    if( parts.length < 2 || !parts[1] ) return null;
    const phases: TAcesOrderPhase[] = [ "initiative", "movement", "combat", "end", "any" ];
    const phase = phases.indexOf( parts[0].toLowerCase() as TAcesOrderPhase ) > -1 ? parts[0].toLowerCase() as TAcesOrderPhase : "any";
    const text = parts[1];
    let token: "move-first" | "move-last" | null = null;
    if( /move\s+first/i.test( text ) ) token = "move-first";
    if( /move\s+last/i.test( text ) ) token = "move-last";
    const list = /\(([^)]*)\)/.exec( text );
    const tokenRank = token && list ? list[1].split( "," ).map( ( item ) => parseAcesPriorityLine( item ) ) : [];
    const behavior = parts[2] && acesBehaviorIds.indexOf( parts[2].toLowerCase() as TAcesBehavior ) > -1 ? parts[2].toLowerCase() as TAcesBehavior : null;
    return { phase: phase, text: text, token: token, tokenRank: tokenRank, behavior: behavior };
}

export const formatAcesCommandOrderLine = ( order: IAcesCommandOrder ): string => {
    return order.phase + " | " + order.text + ( order.behavior ? " | " + order.behavior : "" );
}

/** A strategy decision line: "letter | condition". The app answers "objective is complete" and "no armor" rows. */
export const parseAcesStrategyLine = ( line: string ): IAcesStrategyRow | null => {
    const parts = line.split( "|" ).map( ( part ) => part.trim() );
    if( parts.length < 2 || !/^[A-Za-z]$/.test( parts[0] ) ) return null;
    let auto: TAcesStrategyAuto = "";
    if( /objective\s+is\s+complete/i.test( parts[1] ) ) auto = "objective-complete";
    else if( /no\s+armor/i.test( parts[1] ) ) auto = "enemy-no-armor";
    return { letter: parts[0].toUpperCase(), text: parts[1], auto: auto };
}

const splitBar = ( line: string ): string[] => line.split( "|" ).map( ( part ) => part.trim() );

/** Deck id for a printed deck name ("Brawler", "Scout (Hover)"); empty when it isn't a known deck. */
export const acesDeckIdFromName = ( name: string ): TAcesDeckId | "" => {
    const wanted = name.trim().toLowerCase();
    if( !wanted ) return "";
    const deck = acesDecks.find( ( entry ) => entry.name.toLowerCase() === wanted || entry.id === wanted )
        || acesDecks.find( ( entry ) => entry.name.toLowerCase().startsWith( wanted ) );
    return deck ? deck.id : "";
}

/** A sortie unit line: "name | skill | deck". */
export const parseAcesScenarioUnitLine = ( line: string ): IAcesScenarioUnit | null => {
    const parts = splitBar( line );
    if( !parts[0] ) return null;
    const skill = parts[1] ? num( parts[1] ) : null;
    const deck = parts[2] || "";
    return { name: parts[0], skill: skill, deck: deck, deckId: acesDeckIdFromName( deck ) };
}

export const formatAcesScenarioUnitLine = ( unit: IAcesScenarioUnit ): string => {
    return [ unit.name, unit.skill === null ? "" : String( unit.skill ), unit.deck ].join( " | " ).replace( /(\s\|\s)+$/, "" );
}

/** An objective line: "primary|secondary | destroy|movement|other | text | SP". */
export const parseAcesObjectiveLine = ( line: string ): IAcesScenarioObjective | null => {
    const parts = splitBar( line );
    if( parts.length < 3 || !parts[2] ) return null;
    return {
        kind: parts[0].toLowerCase() === "secondary" ? "secondary" : "primary",
        type: oneOf( parts[1].toLowerCase(), [ "destroy", "movement", "other" ] as const, "other" ),
        text: parts[2],
        sp: parts[3] ? num( parts[3] ) : null,
    };
}

export const formatAcesObjectiveLine = ( objective: IAcesScenarioObjective ): string => {
    return [ objective.kind, objective.type, objective.text ].join( " | " ) + ( objective.sp === null ? "" : " | " + objective.sp );
}

/** A Waypoint line: "turn | label | text". */
export const parseAcesWaypointLine = ( line: string ): IAcesWaypoint | null => {
    const parts = splitBar( line );
    const turn = num( parts[0] );
    if( turn === null ) return null;
    return { turn: turn, label: parts[1] || "", text: parts.slice( 2 ).join( " | " ) };
}

export const formatAcesWaypointLine = ( waypoint: IAcesWaypoint ): string => {
    return waypoint.turn + " | " + waypoint.label + ( waypoint.text ? " | " + waypoint.text : "" );
}

/** A special rule line: "phase | name | text" (phase: setup, initiative, movement, combat, end or any). */
export const parseAcesSpecialRuleLine = ( line: string ): IAcesSpecialRule | null => {
    const parts = splitBar( line );
    if( parts.length < 2 ) return null;
    const phase = oneOf( parts[0].toLowerCase(), [ "setup", "initiative", "movement", "combat", "end", "any" ] as const, "any" );
    return { phase: phase, name: parts[1], text: parts.slice( 2 ).join( " | " ) };
}

export const formatAcesSpecialRuleLine = ( rule: IAcesSpecialRule ): string => {
    return rule.phase + " | " + rule.name + ( rule.text ? " | " + rule.text : "" );
}

/** A stacked deck line: "Deck: 383, 253, 643". */
export const parseAcesDeckOrderLine = ( line: string ): { deck: string, cards: string[] } | null => {
    const colon = line.indexOf( ":" );
    if( colon < 1 ) return null;
    const cards = line.substring( colon + 1 ).split( "," ).map( ( item ) => item.trim() ).filter( ( item ) => item !== "" );
    return { deck: line.substring( 0, colon ).trim(), cards: cards };
}

export const formatAcesDeckOrderLine = ( order: { deck: string, cards: string[] } ): string => {
    return order.deck + ": " + order.cards.join( ", " );
}

/** Splits a text area into its non-blank lines. */
export const acesLines = ( text: string ): string[] => text.split( /\r?\n/ ).map( ( line ) => line.trim() ).filter( ( line ) => line !== "" );

/* ----- validation ----- */

/** Problems that would stop the engine reading a card. Empty when the card is usable. */
export const validateAcesCard = ( card: IAcesCard ): string[] => {
    const rv: string[] = [];
    if( !card.deck.trim() ) rv.push( "Deck name is missing." );
    if( card.movePriority === null ) rv.push( "Movement priority number is missing." );
    if( card.combatPriority === null ) rv.push( "Combat priority number is missing." );
    const columns: [ string, IAcesBehaviorColumn ][] = [ [ "Aggressive", card.aggressive ], [ "Balanced", card.balanced ], [ "Cautious", card.cautious ] ];
    for( const [ label, column ] of columns ) {
        if( label !== "Cautious" && !column.condition.trim() ) rv.push( label + " column has no condition." );
        if( column.zoneRings.length === 0 && !column.zoneKeyword ) rv.push( label + " column has no Zone." );
        const sorted = column.zoneRings.slice().sort( ( a, b ) => a - b );
        if( sorted.join() !== column.zoneRings.join() ) rv.push( label + " column Zone rings should be listed closest first." );
    }
    if( card.combat.zoneRings.length === 0 && !card.combat.zoneKeyword ) rv.push( "Combat side has no Zone." );
    for( const row of card.combat.overheat ) {
        if( row.action === "up-to" && ( row.ovLimit === null || row.ovLimit < 0 ) ) rv.push( "OV row \"" + row.text + "\" needs an OV limit." );
        if( row.tnAtMost === null && row.tnAtLeast === null && !row.also ) rv.push( "OV row \"" + row.text + "\" has no condition." );
    }
    return rv;
}

export const validateAcesCommandCard = ( card: IAcesCommandCard ): string[] => {
    const rv: string[] = [];
    if( !card.deck.trim() ) rv.push( "Deck name is missing." );
    if( !/^[A-Z]$/.test( card.letter ) ) rv.push( "Command letter should be a single capital letter." );
    for( const color of acesColors ) {
        if( card[color].length === 0 ) rv.push( "The " + color + " target list is empty." );
    }
    for( const row of card.strategy ) {
        if( !/^[A-Z]$/.test( row.letter ) ) rv.push( "Strategy row \"" + row.text + "\" needs a card letter." );
    }
    return rv;
}

export const validateAcesScenario = ( scenario: IAcesScenario ): string[] => {
    const rv: string[] = [];
    if( !scenario.name.trim() ) rv.push( "Sortie name is missing." );
    if( scenario.opposingUnits.length === 0 ) rv.push( "No opposing units listed." );
    if( scenario.objectives.length === 0 ) rv.push( "No objectives listed." );
    if( scenario.turnLimit !== null && scenario.turnLimit < 1 ) rv.push( "Turn limit should be at least 1." );
    for( const waypoint of scenario.waypoints ) {
        if( waypoint.turn < 1 ) rv.push( "Waypoint \"" + waypoint.label + "\" needs a turn track space." );
    }
    return rv;
}
