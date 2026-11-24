import { IAcesCard, IAcesCardLibrary, IAcesCommandCard, IAcesScenario, IAcesScenarioObjective, IAcesWaypoint } from "../data/aces-cards";
import { acesDecks, ACES_CARDS_PER_DECK, getAcesDeck, TAcesDeckId } from "../data/aces-rules";
import { generateUUID } from "../utils/generateUUID";
import {
    acesCommandInitiativeModifier,
    getAcesCrippledReasonsForUnit,
    getAcesFrontLoadedMoveOrder,
    getAcesInitiativeModifiers,
    getAcesUnitLabels,
    IAcesModifier,
    IAcesMoveStep,
    isAcesEmplacementCard,
    sortAcesActivation,
    splitAcesDeck,
    suggestAcesDeckForUnit,
    TAcesPriorityToken,
    TAcesSide,
} from "./aces-helpers";
import { chooseAcesTokenUnit, getAcesOrdersForPhase, getAcesUnitStats, IAcesRngState, newAcesRngState, rollAces2D6, rollAcesD6, shuffleAces, TAcesRuleset } from "./aces-engine";
import AlphaStrikeForce, { IASForceExport } from "./alpha-strike-force";
import { AlphaStrikeUnit } from "./alpha-strike-unit";

/*
 * A game of Alpha Strike against a BattleTech: Aces automated force. The app tracks what the rules decide from
 * numbers (turn and phase, Initiative modifiers, activation order, front-loaded move counts, deck cycling, crippled
 * units). When the players have entered their cards in the card library, the game deals virtual piles from it and
 * the card reader walks each card; otherwise the players read their paper cards and type in the priorities.
 */

export type TAcesPhase = "initiative" | "movement" | "combat" | "end";

export const acesPhases: TAcesPhase[] = [ "initiative", "movement", "combat", "end" ];

export interface IAcesUnitState {
    unitUUID: string;
    deckId: TAcesDeckId | "";
    /** Cards in this unit's (possibly split) deck. */
    cardsInDeck: number;
    /** Cards tucked under since the last shuffle. */
    cardsCycled: number;
    /** Priority number on the movement side of the top card, entered by the players. */
    movePriority: number | null;
    /** Priority number on the combat side of the top card. */
    combatPriority: number | null;
    token: TAcesPriorityToken | null;
    forcedWithdrawal: boolean;
    fleeing: boolean;
    /** Cannot move this turn: immobile, shut down, emplacement, transported (Aces p.6). */
    cannotMove: boolean;
    isEmplacement: boolean;
    moved: boolean;
    attacked: boolean;
    /** Library card ids in this unit's pile, top card first; empty when the players read paper cards. */
    cardIds: string[];
    /** Transport carrying this unit (Aces p.5); a transported unit can't move, attack or spot. */
    transportedBy: string;
    mountedThisTurn: boolean;
    /** True for a unit brought in mid-game; only these can be taken back out. Optional so older saves load. */
    addedDuringPlay?: boolean;
}

/** A Battlefield Support card the automated force holds. The player names it; nothing about the card is shipped. */
export interface IAcesGameSupportCard {
    id: string;
    name: string;
    /** Game turn it was spent on, or null while still in hand. */
    spentTurn: number | null;
}

export interface IAcesGameWaypoint extends IAcesWaypoint {
    resolved: boolean;
}

export interface IAcesGameObjective extends IAcesScenarioObjective {
    complete: boolean;
}

/** Special Orders the automated force is under (Aces pp.16-17, 20). */
export interface IAcesGameSpecialOrders {
    movementObjective: boolean;
    destroyObjective: boolean;
    indirectAttacks: boolean;
}

export interface IAcesGameScenario {
    gameSize: "battle" | "skirmish";
    deploymentId: number | null;
    scenarioId: number | null;
    terrainId: number | null;
    notes: string;
}

export const ACES_GAME_EXPORT_VERSION = 2;

export interface IAcesGameExport {
    version: number;
    id: string;
    name: string;
    campaignId: string;
    turn: number;
    phase: TAcesPhase;
    automatedForce: IASForceExport | null;
    unitStates: IAcesUnitState[];
    /** Aces decks owned per deck type; each holds six cards. */
    decksOwned: { [deckId: string]: number };
    hasScouringSands: boolean;
    commandDeck: string;
    commandCard: string;
    automatedCommanderUUID: string;
    playerCommanderDestroyed: boolean;
    automatedCommanderDestroyed: boolean;
    forcedWithdrawal: boolean;
    initiativeWinner: TAcesSide | null;
    lastInitiativeWinner: TAcesSide | null;
    playerUnitsAbleToMove: number;
    scenario: IAcesGameScenario;
    log: string[];
    lastUpdated: string;
    // Version 2 fields are optional so version 1 saves still load.
    ruleset?: TAcesRuleset;
    rng?: IAcesRngState;
    scenarioRecordId?: string;
    turnLimit?: number | null;
    waypoints?: IAcesGameWaypoint[];
    objectives?: IAcesGameObjective[];
    automatedObjectiveComplete?: boolean;
    specialOrders?: IAcesGameSpecialOrders;
    commandCardId?: string;
    deckPools?: { [deckId: string]: string[] };
    /** Player units (by uuid) that have moved this turn, for the Command card conditions. */
    playerUnitsMoved?: string[];
    /** Battlefield Support cards the automated force holds. Optional so older saves load. */
    supportCards?: IAcesGameSupportCard[];
}

export const newAcesUnitState = ( unitUUID: string ): IAcesUnitState => {
    return {
        unitUUID: unitUUID,
        deckId: "",
        cardsInDeck: ACES_CARDS_PER_DECK,
        cardsCycled: 0,
        movePriority: null,
        combatPriority: null,
        token: null,
        forcedWithdrawal: false,
        fleeing: false,
        cannotMove: false,
        isEmplacement: false,
        moved: false,
        attacked: false,
        cardIds: [],
        transportedBy: "",
        mountedThisTurn: false,
    };
}

export class AcesGame {
    public id: string = generateUUID();
    public name: string = "";
    public campaignId: string = "";
    public turn: number = 1;
    public phase: TAcesPhase = "initiative";
    public automatedForce: AlphaStrikeForce = new AlphaStrikeForce();
    public unitStates: IAcesUnitState[] = [];
    public decksOwned: { [deckId: string]: number } = {};
    public hasScouringSands: boolean = false;
    public commandDeck: string = "";
    public commandCard: string = "A";
    public automatedCommanderUUID: string = "";
    public playerCommanderDestroyed: boolean = false;
    public automatedCommanderDestroyed: boolean = false;
    public forcedWithdrawal: boolean = false;
    public initiativeWinner: TAcesSide | null = null;
    public lastInitiativeWinner: TAcesSide | null = null;
    public playerUnitsAbleToMove: number = 0;
    /** Player units that moved this turn; ticking one once carries to every automated unit card reading. */
    public playerUnitsMoved: string[] = [];
    public supportCards: IAcesGameSupportCard[] = [];
    public scenario: IAcesGameScenario = {
        gameSize: "battle",
        deploymentId: null,
        scenarioId: null,
        terrainId: null,
        notes: "",
    };
    public log: string[] = [];
    /** Rules switch: the Aces additional rules, or plain Alpha Strike: Commander's Edition rules. */
    public ruleset: TAcesRuleset = "aces";
    /** Seeded dice, saved with the game so a reload continues the same sequence. */
    public rng: IAcesRngState = newAcesRngState();
    public scenarioRecordId: string = "";
    public turnLimit: number | null = null;
    public waypoints: IAcesGameWaypoint[] = [];
    public objectives: IAcesGameObjective[] = [];
    /** Strategy decision "objective complete" (Aces p.21): the automated force finished its own objective. */
    public automatedObjectiveComplete: boolean = false;
    public specialOrders: IAcesGameSpecialOrders = {
        movementObjective: false,
        destroyObjective: false,
        indirectAttacks: false,
    };
    /** Library id of the face-up Command card, when the players entered their Command deck. */
    public commandCardId: string = "";
    /** Library card ids for each deck type, one entry per copy owned (Aces p.38). */
    public deckPools: { [deckId: string]: string[] } = {};

    constructor( importData: IAcesGameExport | null = null ) {
        if( importData ) {
            this.import( importData );
        }
    }

    /* ----- units ----- */

    public getAutomatedUnits(): AlphaStrikeUnit[] {
        const rv: AlphaStrikeUnit[] = [];
        for( const group of this.automatedForce.groups ) {
            for( const unit of group.members ) {
                rv.push( unit );
            }
        }
        return rv;
    }

    public getUnit( unitUUID: string ): AlphaStrikeUnit | null {
        return this.getAutomatedUnits().find( ( unit ) => unit.uuid === unitUUID ) || null;
    }

    public getUnitState( unitUUID: string ): IAcesUnitState {
        let state = this.unitStates.find( ( entry ) => entry.unitUUID === unitUUID );
        if( !state ) {
            state = newAcesUnitState( unitUUID );
            const unit = this.getUnit( unitUUID );
            if( unit ) {
                // A Battlefield Support emplacement card (type BD, IMMOBILE) starts ticked as one, with no deck (Aces p.6, p.31).
                state.isEmplacement = isAcesEmplacementCard( unit );
                state.deckId = state.isEmplacement ? "" : suggestAcesDeckForUnit( unit, this.hasScouringSands ) || "";
            }
            this.unitStates.push( state );
        }
        return state;
    }

    /** Units still in the fight (not destroyed). */
    public getLiveAutomatedUnits(): AlphaStrikeUnit[] {
        return this.getAutomatedUnits().filter( ( unit ) => !unit.isWrecked() );
    }

    /**
     * Replaces the automated force with a copy of another force (e.g. the current Alpha Strike roster). Units get
     * new ids so the copy never collides with the roster it came from.
     */
    public setAutomatedForce( force: AlphaStrikeForce ) {
        this.automatedForce = new AlphaStrikeForce( force.export() );
        for( const unit of this.getAutomatedUnits() ) {
            unit.uuid = generateUUID();
            unit.reset();
        }
        this.unitStates = [];
        this.syncUnitStates();
        this.assignDecks();
    }

    /**
     * Brings another unit into the automated force mid-game. It joins as a fresh copy (new id, undamaged) and gets
     * its own deck dealt; the other decks and every other unit's state are left alone. Aces names no rule for this,
     * so the unit simply acts from the current phase on (not moved, not attacked).
     */
    public addAutomatedUnit( unit: AlphaStrikeUnit, groupIndex: number = 0 ): AlphaStrikeUnit {
        const copy = new AlphaStrikeUnit();
        copy.importUnit( unit.export() );
        copy.uuid = generateUUID();
        copy.reset();
        this.automatedForce.addToGroup( copy, groupIndex );
        const state = this.getUnitState( copy.uuid );
        state.addedDuringPlay = true;
        if( state.deckId ) this.dealDeck( state.deckId );
        this.addLog( this.getUnitLabel( copy ) + " joins the automated force." );
        return copy;
    }

    /** Takes back a unit added by mistake. Only units added during play can go; false otherwise. */
    public removeAutomatedUnit( unitUUID: string ): boolean {
        const state = this.unitStates.find( ( entry ) => entry.unitUUID === unitUUID );
        if( !state || !state.addedDuringPlay ) return false;
        const unit = this.getUnit( unitUUID );
        if( !unit ) return false;
        const label = this.getUnitLabel( unit );
        for( let groupIndex = 0; groupIndex < this.automatedForce.groups.length; groupIndex++ ) {
            const unitIndex = this.automatedForce.groups[groupIndex].members.indexOf( unit );
            if( unitIndex > -1 ) {
                this.automatedForce.removeUnitFromGroup( groupIndex, unitIndex );
                break;
            }
        }
        this.unitStates = this.unitStates.filter( ( entry ) => entry.unitUUID !== unitUUID );
        if( this.automatedCommanderUUID === unitUUID ) this.automatedCommanderUUID = "";
        // Units that shared its deck split it again; a deck of its own has nothing left to deal.
        if( state.deckId && this.getUnitsUsingDeck( state.deckId ).length > 0 ) this.dealDeck( state.deckId );
        this.addLog( label + " leaves the automated force (added by mistake)." );
        return true;
    }

    public addSupportCard( name: string ): IAcesGameSupportCard {
        const card: IAcesGameSupportCard = { id: generateUUID(), name: name.trim() || "Battlefield Support card", spentTurn: null };
        this.supportCards.push( card );
        return card;
    }

    public removeSupportCard( id: string ) {
        this.supportCards = this.supportCards.filter( ( card ) => card.id !== id );
    }

    /**
     * Spends the chosen unspent cards this turn. Spending more than the Command card's limit, or a card that is
     * unknown or already spent, is refused and spends none.
     */
    public spendSupportCards( ids: string[], limit: number | null ): { ok: boolean; reason: string } {
        const unique = ids.filter( ( id, index ) => ids.indexOf( id ) === index );
        if( unique.length === 0 ) return { ok: false, reason: "Choose at least one card." };
        const alreadySpent = this.supportCards.filter( ( card ) => card.spentTurn === this.turn && unique.indexOf( card.id ) === -1 ).length;
        if( limit !== null && alreadySpent + unique.length > limit ) {
            return { ok: false, reason: "The Command card allows up to " + limit + " Battlefield Support card" + ( limit === 1 ? "" : "s" ) + " per turn; " + alreadySpent + " already spent this turn, " + unique.length + " chosen." };
        }
        const chosen = unique.map( ( id ) => this.supportCards.find( ( card ) => card.id === id ) );
        if( chosen.some( ( card ) => !card || card.spentTurn !== null ) ) {
            return { ok: false, reason: "Only cards still in hand can be spent." };
        }
        for( const card of chosen ) card!.spentTurn = this.turn;
        this.addLog( "Battlefield Support spent: " + chosen.map( ( card ) => card!.name ).join( ", " ) + "." );
        return { ok: true, reason: "" };
    }

    /** Adds states for new units and drops states for removed ones. */
    public syncUnitStates() {
        const ids = this.getAutomatedUnits().map( ( unit ) => unit.uuid );
        this.unitStates = this.unitStates.filter( ( state ) => ids.indexOf( state.unitUUID ) > -1 );
        for( const id of ids ) {
            this.getUnitState( id );
        }
    }

    /** Units in play that use a deck type. Emplacements don't use Aces decks (Aces p.31). */
    public getUnitsUsingDeck( deckId: string ): AlphaStrikeUnit[] {
        return this.getLiveAutomatedUnits().filter( ( unit ) => {
            const state = this.getUnitState( unit.uuid );
            return state.deckId === deckId && !state.isEmplacement;
        } );
    }

    public getDecksOwned( deckId: string ): number {
        const owned = this.decksOwned[deckId];
        return typeof owned === "number" && owned >= 0 ? owned : 1;
    }

    /**
     * Deals the deck types out: a unit with its own copy of the deck gets six cards; units sharing too few copies
     * split the cards evenly with extras set aside (Aces p.38).
     */
    public assignDecks() {
        for( const deck of acesDecks ) {
            this.dealDeck( deck.id );
        }
    }

    public dealDeck( deckId: string ): { cardsPerUnit: number, setAside: number } {
        const units = this.getUnitsUsingDeck( deckId );
        const totalCards = this.getDecksOwned( deckId ) * ACES_CARDS_PER_DECK;
        let split = { cardsPerUnit: ACES_CARDS_PER_DECK, setAside: totalCards - units.length * ACES_CARDS_PER_DECK };
        if( units.length * ACES_CARDS_PER_DECK > totalCards ) {
            split = splitAcesDeck( totalCards, units.length );
        }
        const pool = this.deckPools[deckId] || [];
        const dealt = pool.length > 0 ? shuffleAces( pool, this.rng ) : [];
        units.forEach( ( unit, index ) => {
            const state = this.getUnitState( unit.uuid );
            state.cardsInDeck = split.cardsPerUnit;
            state.cardsCycled = 0;
            state.cardIds = dealt.slice( index * split.cardsPerUnit, ( index + 1 ) * split.cardsPerUnit );
        } );
        return split;
    }

    /* ----- card library ----- */

    /**
     * Builds virtual decks from the players' card library: every card entered for a deck type, once per copy owned.
     * Units then play from these piles, so the app can read the top card instead of the players typing priorities.
     * A deck type with fewer than six entered cards still deals; the pile is just short.
     */
    public setDeckPoolsFromLibrary( library: IAcesCardLibrary ) {
        this.deckPools = {};
        for( const deck of acesDecks ) {
            const cards = library.cards.filter( ( card ) => card.deckId === deck.id );
            if( cards.length === 0 ) continue;
            const pool: string[] = [];
            for( let copy = 0; copy < this.getDecksOwned( deck.id ); copy++ ) {
                for( const card of cards ) pool.push( card.id );
            }
            this.deckPools[deck.id] = pool;
        }
        this.assignDecks();
        this.syncPrioritiesFromCards( library );
    }

    /**
     * Stacks a unit's pile in a printed order (priority numbers, top card first), as the guided tutorial asks
     * (Aces SS p.5). Cards missing from the library are skipped; returns the priorities that were missing.
     */
    public stackDeck( unitUUID: string, priorities: string[], library: IAcesCardLibrary ): string[] {
        const state = this.getUnitState( unitUUID );
        const ids: string[] = [];
        const missing: string[] = [];
        for( const priority of priorities ) {
            const card = library.cards.find( ( entry ) => entry.deckId === state.deckId && entry.movePriority === +priority );
            if( card ) {
                ids.push( card.id );
            } else {
                missing.push( priority );
            }
        }
        state.cardIds = ids;
        state.cardsCycled = 0;
        this.syncPrioritiesFromCards( library );
        return missing;
    }

    public getTopCard( unitUUID: string, library: IAcesCardLibrary ): IAcesCard | null {
        const state = this.getUnitState( unitUUID );
        if( state.cardIds.length === 0 ) return null;
        return library.cards.find( ( card ) => card.id === state.cardIds[0] ) || null;
    }

    /** Copies the priority numbers from each unit's top card into the tracker. */
    public syncPrioritiesFromCards( library: IAcesCardLibrary ) {
        for( const state of this.unitStates ) {
            const card = this.getTopCard( state.unitUUID, library );
            if( card ) {
                state.movePriority = card.movePriority;
                state.combatPriority = card.combatPriority;
            }
        }
    }

    public setUnitDeck( unitUUID: string, deckId: TAcesDeckId | "" ) {
        const state = this.getUnitState( unitUUID );
        const oldDeck = state.deckId;
        state.deckId = deckId;
        if( oldDeck ) this.dealDeck( oldDeck );
        if( deckId ) this.dealDeck( deckId );
    }

    /**
     * Step 5 of the Combat Phase: tuck the top card under. When the combat side shows on top, every card has been
     * used: flip and shuffle, recombining split decks (Aces pp.19, 38). Returns true when a shuffle is due.
     */
    public cycleCard( unitUUID: string ): boolean {
        const state = this.getUnitState( unitUUID );
        state.cardsCycled++;
        state.attacked = true;
        if( state.cardIds.length > 1 ) {
            state.cardIds = state.cardIds.slice( 1 ).concat( state.cardIds[0] );
        }
        if( state.cardsInDeck > 0 && state.cardsCycled >= state.cardsInDeck ) {
            if( state.deckId ) {
                this.dealDeck( state.deckId );
                const deck = getAcesDeck( state.deckId );
                this.addLog( "Reshuffle the " + ( deck ? deck.name : state.deckId ) + " deck" + ( this.getUnitsUsingDeck( state.deckId ).length > 1 ? " (recombine and split it again)" : "" ) + "." );
            } else {
                state.cardsCycled = 0;
                state.cardIds = shuffleAces( state.cardIds, this.rng );
            }
            return true;
        }
        return false;
    }

    /* ----- turn flow ----- */

    public addLog( message: string ) {
        this.log.push( "Turn " + this.turn + " (" + this.phase + "): " + message );
        if( this.log.length > 500 ) {
            this.log = this.log.slice( this.log.length - 500 );
        }
    }

    /** The Command card is the face-up card from the players' library, when they entered one. */
    public getInitiativeModifiers( side: TAcesSide, commandCard: IAcesCommandCard | null = null ): IAcesModifier[] {
        const campaign = this.campaignId !== "";
        const commanderDestroyed = side === "player" ? this.playerCommanderDestroyed : this.isAutomatedCommanderDestroyed();
        const commandOrder = side === "automated" && commandCard ? acesCommandInitiativeModifier( commandCard.orders ) : 0;
        return getAcesInitiativeModifiers( this.lastInitiativeWinner === side, commanderDestroyed, campaign, commandOrder );
    }

    public isAutomatedCommanderDestroyed(): boolean {
        if( this.automatedCommanderDestroyed ) return true;
        const commander = this.automatedCommanderUUID ? this.getUnit( this.automatedCommanderUUID ) : null;
        return commander !== null && commander.isWrecked();
    }

    /* ----- dice ----- */

    public rollD6(): number {
        return rollAcesD6( this.rng );
    }

    public roll2D6(): number {
        return rollAces2D6( this.rng );
    }

    /**
     * Rolls Initiative for both sides with the Aces modifiers (Aces p.32), rerolling ties. Players who roll their
     * own dice set the winner by hand instead.
     */
    public rollInitiative( commandCard: IAcesCommandCard | null = null ): { player: number, automated: number, winner: TAcesSide } {
        const modifiers = ( side: TAcesSide ) => this.getInitiativeModifiers( side, commandCard );
        const total = ( side: TAcesSide ) => this.roll2D6() + modifiers( side ).reduce( ( sum, modifier ) => sum + modifier.value, 0 );
        let player = total( "player" );
        let automated = total( "automated" );
        while( player === automated ) {
            player = total( "player" );
            automated = total( "automated" );
        }
        const winner: TAcesSide = player > automated ? "player" : "automated";
        const listed = ( side: TAcesSide ) => {
            const list = modifiers( side ).map( ( modifier ) => modifier.label + " " + ( modifier.value > 0 ? "+" : "" ) + modifier.value );
            return list.length > 0 ? " (" + list.join( ", " ) + ")" : "";
        };
        this.addLog( "Initiative roll: players " + player + listed( "player" ) + ", automated force " + automated + listed( "automated" ) + "." );
        this.setInitiativeWinner( winner );
        return { player: player, automated: automated, winner: winner };
    }

    /* ----- sortie ----- */

    /**
     * Sets the game up from a sortie record: turn limit, objectives, Waypoints, Command deck and starting card, and
     * the deck for each automated unit whose name matches one of the sortie's opposing units. With a card library,
     * the piles are dealt from it and stacked in the sortie's printed order.
     */
    public loadScenario( scenario: IAcesScenario, library: IAcesCardLibrary | null = null ): string[] {
        const warnings: string[] = [];
        this.scenarioRecordId = scenario.id;
        this.name = ( scenario.code ? scenario.code + " - " : "" ) + scenario.name;
        this.turnLimit = scenario.turnLimit;
        this.objectives = scenario.objectives.map( ( objective ) => ( { ...objective, complete: false } ) );
        this.waypoints = scenario.waypoints.map( ( waypoint ) => ( { ...waypoint, resolved: false } ) );
        this.commandDeck = scenario.commandDeck;
        this.commandCard = scenario.commandStartCard || "A";
        this.automatedObjectiveComplete = false;
        this.scenario.notes = scenario.notes;
        for( const entry of scenario.opposingUnits ) {
            if( !entry.deckId ) continue;
            const wanted = entry.name.toLowerCase();
            const unit = this.getAutomatedUnits().find( ( item ) => ( item.name + " " + item.variant ).toLowerCase().indexOf( wanted ) > -1
                || wanted.indexOf( item.name.toLowerCase() ) > -1 );
            if( unit ) {
                this.getUnitState( unit.uuid ).deckId = entry.deckId;
            } else {
                warnings.push( "No automated unit matches " + entry.name + "." );
            }
        }
        if( library ) {
            this.setDeckPoolsFromLibrary( library );
            for( const order of scenario.deckOrder ) {
                const deckName = order.deck.toLowerCase();
                for( const state of this.unitStates ) {
                    const deck = getAcesDeck( state.deckId );
                    if( !deck || deck.name.toLowerCase() !== deckName ) continue;
                    const missing = this.stackDeck( state.unitUUID, order.cards, library );
                    if( missing.length > 0 ) {
                        warnings.push( deck.name + " cards not in the library: " + missing.join( ", " ) + ". Stack the paper deck for those." );
                    }
                }
            }
        } else {
            this.assignDecks();
        }
        this.addLog( "Sortie loaded: " + this.name + "." );
        return warnings;
    }

    /** Waypoints on the current turn track space, resolved bottom to top (Aces p.32). */
    public getWaypointsDue(): IAcesGameWaypoint[] {
        return this.waypoints.filter( ( waypoint ) => waypoint.turn === this.turn && !waypoint.resolved ).reverse();
    }

    public resolveWaypoint( waypoint: IAcesGameWaypoint ) {
        waypoint.resolved = true;
        this.addLog( "Waypoint resolved: " + ( waypoint.label || "turn " + waypoint.turn ) + "." );
    }

    /** The sortie ends after its final turn or once every primary objective is complete (Aces p.32). */
    public isSortieOver(): { over: boolean, reason: string } {
        const primary = this.objectives.filter( ( objective ) => objective.kind === "primary" );
        if( primary.length > 0 && primary.every( ( objective ) => objective.complete ) ) {
            return { over: true, reason: "Primary objective complete." };
        }
        if( this.turnLimit !== null && this.turn > this.turnLimit ) {
            return { over: true, reason: "Final turn played." };
        }
        return { over: false, reason: "" };
    }

    /* ----- transport (Aces p.5) ----- */

    public getPassengers( transportUUID: string ): AlphaStrikeUnit[] {
        return this.getAutomatedUnits().filter( ( unit ) => this.getUnitState( unit.uuid ).transportedBy === transportUUID );
    }

    public mount( passengerUUID: string, transportUUID: string, transportHasMoved: boolean ): { ok: boolean, reason: string } {
        const passenger = this.getUnit( passengerUUID );
        const transport = this.getUnit( transportUUID );
        if( !passenger || !transport ) return { ok: false, reason: "Unit not found." };
        const check = canAcesMount( transport, passenger, this.getPassengers( transportUUID ), transportHasMoved );
        if( !check.ok ) return check;
        const state = this.getUnitState( passengerUUID );
        state.transportedBy = transportUUID;
        state.mountedThisTurn = true;
        state.cannotMove = true;
        state.moved = true;
        state.token = null;
        this.addLog( this.getUnitLabel( passenger ) + " mounts " + this.getUnitLabel( transport ) + ". The transport can't Sprint this turn." );
        return check;
    }

    public dismount( passengerUUID: string, transportSprinted: boolean ): { ok: boolean, reason: string } {
        const state = this.getUnitState( passengerUUID );
        const passenger = this.getUnit( passengerUUID );
        if( !passenger || !state.transportedBy ) return { ok: false, reason: "Not mounted." };
        if( state.mountedThisTurn ) return { ok: false, reason: "Can't dismount in the turn it mounted (Aces p.5)." };
        if( transportSprinted ) return { ok: false, reason: "Can't dismount from a transport that Sprinted (Aces p.5)." };
        state.transportedBy = "";
        state.cannotMove = false;
        state.moved = true;
        const move = passenger.move.length > 0 ? Math.ceil( passenger.move[0].currentMove / 2 ) : 0;
        const reason = "Dismounts in base contact, then may move up to " + move + "\" (Ground, or Jump from an OMNI unit).";
        this.addLog( this.getUnitLabel( passenger ) + ": " + reason );
        return { ok: true, reason: reason };
    }

    /**
     * A destroyed transport kills infantry carried inside (IT#); battle armor riding an OMNI unit is placed in base
     * contact with it instead (Aces p.5).
     */
    public handleTransportDestroyed( transportUUID: string ): string[] {
        const rv: string[] = [];
        const transport = this.getUnit( transportUUID );
        for( const passenger of this.getPassengers( transportUUID ) ) {
            const state = this.getUnitState( passenger.uuid );
            state.transportedBy = "";
            state.cannotMove = false;
            const name = this.getUnitLabel( passenger );
            if( transport && transport.hasAbility( "OMNI" ) && passenger.type.toUpperCase() === "BA" ) {
                rv.push( name + " is placed in base contact with the destroyed Omni unit." );
            } else {
                passenger.takeDamage( passenger.getCurrentArmor() + passenger.getCurrentStructure() );
                passenger.applyRound();
                rv.push( name + " is destroyed with its transport." );
            }
        }
        for( const line of rv ) this.addLog( line );
        return rv;
    }

    public setInitiativeWinner( winner: TAcesSide ) {
        this.initiativeWinner = winner;
        this.addLog( ( winner === "player" ? "Players" : "Automated force" ) + " won Initiative." );
    }

    /** Automated units that must still move this phase, in activation order. */
    public getMovementQueue(): AlphaStrikeUnit[] {
        return this.getActivationQueue( "movement" );
    }

    public getCombatQueue(): AlphaStrikeUnit[] {
        return this.getActivationQueue( "combat" );
    }

    public getActivationQueue( phase: "movement" | "combat" ): AlphaStrikeUnit[] {
        const units = this.getLiveAutomatedUnits().filter( ( unit ) => {
            const state = this.getUnitState( unit.uuid );
            if( phase === "movement" ) return !state.moved && !state.cannotMove && !state.isEmplacement && !state.transportedBy;
            return !state.attacked && !state.transportedBy;
        } );
        const inputs = units.map( ( unit ) => {
            const state = this.getUnitState( unit.uuid );
            return {
                id: unit.uuid,
                unit: unit,
                priority: phase === "movement" ? state.movePriority : state.combatPriority,
                pv: unit.currentPoints || unit.basePoints,
                token: state.token,
                forcedWithdrawal: state.forcedWithdrawal,
                fleeing: state.fleeing,
            };
        } );
        return sortAcesActivation( inputs, phase ).map( ( entry ) => entry.unit );
    }

    /** Automated units that count toward front-loaded unequal numbers this turn (Aces p.6). */
    public getAutomatedUnitsAbleToMove(): number {
        return this.getLiveAutomatedUnits().filter( ( unit ) => {
            const state = this.getUnitState( unit.uuid );
            return !state.cannotMove && !state.isEmplacement && !state.transportedBy && !unit.immobile;
        } ).length;
    }

    /** A unit name for the log and messages: same-name automated units are numbered in force order. */
    public getUnitLabel( unit: AlphaStrikeUnit ): string {
        return getAcesUnitLabels( this.getAutomatedUnits() ).get( unit.uuid ) || ( unit.customName || unit.name );
    }

    /** Sets the player move count from the roster: units still standing that are not immobile. No roster leaves it as typed. */
    public setPlayerUnitsFromForce( force: AlphaStrikeForce | null ) {
        if( !force ) return;
        let count = 0;
        for( const group of force.groups ) {
            for( const unit of group.members ) {
                if( !unit.isWrecked() && !unit.immobile ) count++;
            }
        }
        this.playerUnitsAbleToMove = count;
    }

    public setPlayerUnitMoved( id: string, moved: boolean ) {
        const rest = this.playerUnitsMoved.filter( ( entry ) => entry !== id );
        this.playerUnitsMoved = moved ? rest.concat( [ id ] ) : rest;
    }

    public getMoveOrder(): IAcesMoveStep[][] {
        if( !this.initiativeWinner ) return [];
        const loser: TAcesSide = this.initiativeWinner === "player" ? "automated" : "player";
        const automated = this.getAutomatedUnitsAbleToMove();
        const player = this.playerUnitsAbleToMove;
        return getAcesFrontLoadedMoveOrder(
            loser,
            loser === "player" ? player : automated,
            loser === "player" ? automated : player,
        );
    }

    /** Discards a Move First / Move Last token once the unit has moved (Aces p.8). */
    public markMoved( unitUUID: string, moved: boolean = true ) {
        const state = this.getUnitState( unitUUID );
        state.moved = moved;
        if( moved ) {
            state.token = null;
        }
    }

    /** Assigns a token, taking it from any unit that held it. Immobile, FW and Fleeing units can't hold one. */
    public assignToken( unitUUID: string, token: TAcesPriorityToken | null ): boolean {
        const state = this.getUnitState( unitUUID );
        if( token && ( state.forcedWithdrawal || state.fleeing || state.cannotMove || state.isEmplacement ) ) {
            return false;
        }
        if( token ) {
            for( const other of this.unitStates ) {
                if( other.token === token ) other.token = null;
            }
        }
        state.token = token;
        return true;
    }

    /**
     * Hands out the Move First / Move Last tokens the face-up Command card orders (Aces p.8). Old tokens are taken
     * back first, since the card in play decides who holds them. A tied ranking gives no token: the players choose.
     */
    public applyCommandTokens( card: IAcesCommandCard | null ) {
        for( const state of this.unitStates ) state.token = null;
        if( !card ) return;
        const units = this.getLiveAutomatedUnits().map( ( unit ) => {
            const state = this.getUnitState( unit.uuid );
            return {
                id: unit.uuid,
                name: this.getUnitLabel( unit ),
                stats: getAcesUnitStats( unit ),
                eligible: !state.moved && !state.cannotMove && !state.forcedWithdrawal && !state.fleeing && !state.isEmplacement && !state.transportedBy,
            };
        } );
        for( const order of getAcesOrdersForPhase( card, "initiative" ) ) {
            if( !order.token ) continue;
            const choice = chooseAcesTokenUnit( order, units );
            if( choice.unitId ) this.assignToken( choice.unitId, order.token );
        }
    }

    /**
     * Crippled automated units (End Phase step 2, Aces p.32). With Forced Withdrawal in play they are put under
     * the Forced Withdrawal order (Aces p.16).
     */
    public checkCrippled(): { unit: AlphaStrikeUnit, reasons: string[] }[] {
        const rv: { unit: AlphaStrikeUnit, reasons: string[] }[] = [];
        for( const unit of this.getLiveAutomatedUnits() ) {
            const state = this.getUnitState( unit.uuid );
            const reasons = getAcesCrippledReasonsForUnit( unit );
            if( reasons.length > 0 ) {
                rv.push( { unit: unit, reasons: reasons } );
                if( this.forcedWithdrawal && !state.forcedWithdrawal && !state.isEmplacement ) {
                    state.forcedWithdrawal = true;
                    state.token = null;
                    this.addLog( this.getUnitLabel( unit ) + " is crippled and under Forced Withdrawal." );
                }
            }
        }
        return rv;
    }

    public nextPhase() {
        const index = acesPhases.indexOf( this.phase );
        if( this.phase === "end" ) {
            this.nextTurn();
            return;
        }
        if( this.phase === "combat" ) {
            // End Phase: apply this turn's damage and heat before checking crippled units.
            for( const unit of this.getAutomatedUnits() ) {
                unit.applyRound();
            }
            this.phase = "end";
            this.checkCrippled();
            return;
        }
        this.phase = acesPhases[index + 1];
    }

    public nextTurn() {
        this.turn++;
        this.phase = "initiative";
        this.lastInitiativeWinner = this.initiativeWinner;
        this.initiativeWinner = null;
        this.playerUnitsMoved = [];
        for( const state of this.unitStates ) {
            state.moved = false;
            state.attacked = false;
            state.movePriority = null;
            state.combatPriority = null;
            state.mountedThisTurn = false;
            if( state.transportedBy ) state.cannotMove = true;
        }
        const due = this.getWaypointsDue();
        if( due.length > 0 ) {
            this.addLog( due.length + " Waypoint" + ( due.length > 1 ? "s" : "" ) + " on the turn track this turn." );
        }
    }

    public reset() {
        for( const unit of this.getAutomatedUnits() ) {
            unit.reset();
        }
        const keep = this.unitStates.map( ( state ) => ( { unitUUID: state.unitUUID, deckId: state.deckId, isEmplacement: state.isEmplacement, addedDuringPlay: state.addedDuringPlay } ) );
        this.unitStates = keep.map( ( entry ) => {
            const fresh: IAcesUnitState = { ...newAcesUnitState( entry.unitUUID ), deckId: entry.deckId, isEmplacement: entry.isEmplacement };
            if( entry.addedDuringPlay ) fresh.addedDuringPlay = true;
            return fresh;
        } );
        this.rng = newAcesRngState( this.rng.seed );
        this.assignDecks();
        this.turn = 1;
        this.phase = "initiative";
        this.initiativeWinner = null;
        this.lastInitiativeWinner = null;
        this.playerCommanderDestroyed = false;
        this.automatedCommanderDestroyed = false;
        this.commandCard = "A";
        this.log = [];
        // A restart keeps the force's cards but they are all back in hand.
        for( const card of this.supportCards ) card.spentTurn = null;
        this.automatedObjectiveComplete = false;
        for( const waypoint of this.waypoints ) waypoint.resolved = false;
        for( const objective of this.objectives ) objective.complete = false;
    }

    /* ----- persistence ----- */

    public export(): IAcesGameExport {
        return {
            version: ACES_GAME_EXPORT_VERSION,
            id: this.id,
            name: this.name,
            campaignId: this.campaignId,
            turn: this.turn,
            phase: this.phase,
            automatedForce: this.automatedForce.export(),
            unitStates: this.unitStates.map( ( state ) => ( { ...state, cardIds: state.cardIds.slice() } ) ),
            decksOwned: { ...this.decksOwned },
            hasScouringSands: this.hasScouringSands,
            commandDeck: this.commandDeck,
            commandCard: this.commandCard,
            automatedCommanderUUID: this.automatedCommanderUUID,
            playerCommanderDestroyed: this.playerCommanderDestroyed,
            automatedCommanderDestroyed: this.automatedCommanderDestroyed,
            forcedWithdrawal: this.forcedWithdrawal,
            initiativeWinner: this.initiativeWinner,
            lastInitiativeWinner: this.lastInitiativeWinner,
            playerUnitsAbleToMove: this.playerUnitsAbleToMove,
            scenario: { ...this.scenario },
            log: this.log.slice(),
            lastUpdated: new Date().toISOString(),
            ruleset: this.ruleset,
            rng: { ...this.rng },
            scenarioRecordId: this.scenarioRecordId,
            turnLimit: this.turnLimit,
            waypoints: this.waypoints.map( ( waypoint ) => ( { ...waypoint } ) ),
            objectives: this.objectives.map( ( objective ) => ( { ...objective } ) ),
            automatedObjectiveComplete: this.automatedObjectiveComplete,
            specialOrders: { ...this.specialOrders },
            commandCardId: this.commandCardId,
            deckPools: JSON.parse( JSON.stringify( this.deckPools ) ),
            playerUnitsMoved: this.playerUnitsMoved.slice(),
            supportCards: this.supportCards.map( ( card ) => ( { ...card } ) ),
        };
    }

    public import( data: IAcesGameExport ) {
        if( !data || typeof data !== "object" ) return;
        const side = ( value: unknown ): TAcesSide | null => value === "player" || value === "automated" ? value : null;
        if( typeof data.id === "string" && data.id ) this.id = data.id;
        if( typeof data.name === "string" ) this.name = data.name;
        if( typeof data.campaignId === "string" ) this.campaignId = data.campaignId;
        this.turn = +data.turn > 0 ? +data.turn : 1;
        this.phase = acesPhases.indexOf( data.phase ) > -1 ? data.phase : "initiative";
        this.automatedForce = new AlphaStrikeForce( data.automatedForce || null );
        this.unitStates = Array.isArray( data.unitStates )
            ? data.unitStates.map( ( state ) => {
                const rv = { ...newAcesUnitState( state.unitUUID ), ...state };
                rv.cardIds = Array.isArray( rv.cardIds ) ? rv.cardIds.filter( ( id ) => typeof id === "string" ) : [];
                rv.transportedBy = typeof rv.transportedBy === "string" ? rv.transportedBy : "";
                rv.mountedThisTurn = !!rv.mountedThisTurn;
                return rv;
            } )
            : [];
        this.decksOwned = data.decksOwned && typeof data.decksOwned === "object" ? { ...data.decksOwned } : {};
        this.hasScouringSands = !!data.hasScouringSands;
        if( typeof data.commandDeck === "string" ) this.commandDeck = data.commandDeck;
        if( typeof data.commandCard === "string" && data.commandCard ) this.commandCard = data.commandCard;
        if( typeof data.automatedCommanderUUID === "string" ) this.automatedCommanderUUID = data.automatedCommanderUUID;
        this.playerCommanderDestroyed = !!data.playerCommanderDestroyed;
        this.automatedCommanderDestroyed = !!data.automatedCommanderDestroyed;
        this.forcedWithdrawal = !!data.forcedWithdrawal;
        this.initiativeWinner = side( data.initiativeWinner );
        this.lastInitiativeWinner = side( data.lastInitiativeWinner );
        this.playerUnitsAbleToMove = +data.playerUnitsAbleToMove || 0;
        if( data.scenario && typeof data.scenario === "object" ) {
            this.scenario = { ...this.scenario, ...data.scenario };
        }
        this.log = Array.isArray( data.log ) ? data.log.filter( ( line ) => typeof line === "string" ) : [];
        this.ruleset = data.ruleset === "asce" ? "asce" : "aces";
        if( data.rng && typeof data.rng.seed === "number" && typeof data.rng.calls === "number" ) {
            this.rng = { seed: data.rng.seed >>> 0, calls: Math.max( 0, Math.floor( data.rng.calls ) ) };
        }
        if( typeof data.scenarioRecordId === "string" ) this.scenarioRecordId = data.scenarioRecordId;
        this.turnLimit = typeof data.turnLimit === "number" && data.turnLimit > 0 ? data.turnLimit : null;
        this.waypoints = Array.isArray( data.waypoints )
            ? data.waypoints.filter( ( item ) => item && typeof item.turn === "number" ).map( ( item ) => ( { ...item, resolved: !!item.resolved } ) )
            : [];
        this.objectives = Array.isArray( data.objectives )
            ? data.objectives.filter( ( item ) => item && typeof item.text === "string" ).map( ( item ) => ( { ...item, complete: !!item.complete } ) )
            : [];
        this.automatedObjectiveComplete = !!data.automatedObjectiveComplete;
        if( data.specialOrders && typeof data.specialOrders === "object" ) {
            this.specialOrders = {
                movementObjective: !!data.specialOrders.movementObjective,
                destroyObjective: !!data.specialOrders.destroyObjective,
                indirectAttacks: !!data.specialOrders.indirectAttacks,
            };
        }
        if( typeof data.commandCardId === "string" ) this.commandCardId = data.commandCardId;
        this.playerUnitsMoved = Array.isArray( data.playerUnitsMoved ) ? data.playerUnitsMoved.filter( ( id ) => typeof id === "string" ) : [];
        this.supportCards = Array.isArray( data.supportCards )
            ? data.supportCards
                .filter( ( item ) => item && typeof item.id === "string" && item.id && typeof item.name === "string" )
                .map( ( item ) => ( { id: item.id, name: item.name, spentTurn: typeof item.spentTurn === "number" && item.spentTurn > 0 ? item.spentTurn : null } ) )
            : [];
        this.deckPools = {};
        if( data.deckPools && typeof data.deckPools === "object" ) {
            for( const key of Object.keys( data.deckPools ) ) {
                const pool = data.deckPools[key];
                if( Array.isArray( pool ) ) this.deckPools[key] = pool.filter( ( id ) => typeof id === "string" );
            }
        }
        this.syncUnitStates();
    }
}

/** The number after an ability code, e.g. IT4 -> 4, CAR2 -> 2; null when the unit lacks the ability. */
export const getAcesAbilityValue = ( unit: AlphaStrikeUnit, code: string ): number | null => {
    const pattern = new RegExp( "^" + code + "(\\d+(\\.\\d+)?)$", "i" );
    for( const ability of unit.abilities ) {
        const match = pattern.exec( ability.trim() );
        if( match ) return +match[1];
    }
    return null;
}

/**
 * Mounting a transport (Aces p.5): an IT# unit carries infantry whose CAR# totals no more than its IT#; battle
 * armor with MEC rides an OMNI unit, one at a time. Infantry mount before the transport moves.
 */
export const canAcesMount = (
    transport: AlphaStrikeUnit,
    passenger: AlphaStrikeUnit,
    aboard: AlphaStrikeUnit[],
    transportHasMoved: boolean,
): { ok: boolean, reason: string } => {
    const passengerType = passenger.type.toUpperCase();
    if( transportHasMoved ) return { ok: false, reason: "Infantry mount before the transport moves (Aces p.5)." };
    if( passengerType !== "CI" && passengerType !== "BA" ) return { ok: false, reason: "Only infantry can mount a transport." };
    const capacity = getAcesAbilityValue( transport, "IT" );
    const cargo = getAcesAbilityValue( passenger, "CAR" );
    if( capacity !== null && cargo !== null ) {
        const used = aboard.reduce( ( sum, unit ) => sum + ( getAcesAbilityValue( unit, "CAR" ) || 0 ), 0 );
        if( used + cargo > capacity ) return { ok: false, reason: "Not enough room: IT" + capacity + " already carries CAR " + used + "." };
        return { ok: true, reason: "Mounts inside (IT" + capacity + "). Costs 2\" of Move." };
    }
    if( transport.hasAbility( "OMNI" ) && passengerType === "BA" && passenger.hasAbility( "MEC" ) ) {
        if( aboard.some( ( unit ) => unit.type.toUpperCase() === "BA" ) ) return { ok: false, reason: "An Omni unit carries one battle armor unit." };
        return { ok: true, reason: "Rides the Omni unit (MEC). Costs 2\" of Move." };
    }
    return { ok: false, reason: "Needs IT# and CAR#, or an OMNI transport and battle armor with MEC." };
}
