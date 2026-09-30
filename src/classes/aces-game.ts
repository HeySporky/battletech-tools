import { acesDecks, ACES_CARDS_PER_DECK, getAcesDeck, TAcesDeckId } from "../data/aces-rules";
import { generateUUID } from "../utils/generateUUID";
import {
    getAcesCrippledReasonsForUnit,
    getAcesFrontLoadedMoveOrder,
    getAcesInitiativeModifiers,
    IAcesModifier,
    IAcesMoveStep,
    sortAcesActivation,
    splitAcesDeck,
    suggestAcesDeckForUnit,
    TAcesPriorityToken,
    TAcesSide,
} from "./aces-helpers";
import AlphaStrikeForce, { IASForceExport } from "./alpha-strike-force";
import { AlphaStrikeUnit } from "./alpha-strike-unit";

/*
 * A game of Alpha Strike against a BattleTech: Aces automated force. The app tracks what the rules decide from
 * numbers (turn and phase, Initiative modifiers, activation order, front-loaded move counts, deck cycling, crippled
 * units) while the players read their own Aces and Command cards and judge everything on the table.
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
}

export interface IAcesGameScenario {
    gameSize: "battle" | "skirmish";
    deploymentId: number | null;
    scenarioId: number | null;
    terrainId: number | null;
    notes: string;
}

export const ACES_GAME_EXPORT_VERSION = 1;

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
    public scenario: IAcesGameScenario = {
        gameSize: "battle",
        deploymentId: null,
        scenarioId: null,
        terrainId: null,
        notes: "",
    };
    public log: string[] = [];

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
                state.deckId = suggestAcesDeckForUnit( unit, this.hasScouringSands ) || "";
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
        for( const unit of units ) {
            const state = this.getUnitState( unit.uuid );
            state.cardsInDeck = split.cardsPerUnit;
            state.cardsCycled = 0;
        }
        return split;
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
        if( state.cardsInDeck > 0 && state.cardsCycled >= state.cardsInDeck ) {
            if( state.deckId ) {
                this.dealDeck( state.deckId );
                const deck = getAcesDeck( state.deckId );
                this.addLog( "Reshuffle the " + ( deck ? deck.name : state.deckId ) + " deck" + ( this.getUnitsUsingDeck( state.deckId ).length > 1 ? " (recombine and split it again)" : "" ) + "." );
            } else {
                state.cardsCycled = 0;
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

    public getInitiativeModifiers( side: TAcesSide ): IAcesModifier[] {
        const campaign = this.campaignId !== "";
        const commanderDestroyed = side === "player" ? this.playerCommanderDestroyed : this.isAutomatedCommanderDestroyed();
        return getAcesInitiativeModifiers( this.lastInitiativeWinner === side, commanderDestroyed, campaign );
    }

    public isAutomatedCommanderDestroyed(): boolean {
        if( this.automatedCommanderDestroyed ) return true;
        const commander = this.automatedCommanderUUID ? this.getUnit( this.automatedCommanderUUID ) : null;
        return commander !== null && commander.isWrecked();
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
            if( phase === "movement" ) return !state.moved && !state.cannotMove && !state.isEmplacement;
            return !state.attacked;
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
            return !state.cannotMove && !state.isEmplacement && !unit.immobile;
        } ).length;
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
                    this.addLog( ( unit.customName || unit.name ) + " is crippled and under Forced Withdrawal." );
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
        for( const state of this.unitStates ) {
            state.moved = false;
            state.attacked = false;
            state.movePriority = null;
            state.combatPriority = null;
        }
    }

    public reset() {
        for( const unit of this.getAutomatedUnits() ) {
            unit.reset();
        }
        const keep = this.unitStates.map( ( state ) => ( { unitUUID: state.unitUUID, deckId: state.deckId, isEmplacement: state.isEmplacement } ) );
        this.unitStates = keep.map( ( entry ) => ( { ...newAcesUnitState( entry.unitUUID ), deckId: entry.deckId, isEmplacement: entry.isEmplacement } ) );
        this.assignDecks();
        this.turn = 1;
        this.phase = "initiative";
        this.initiativeWinner = null;
        this.lastInitiativeWinner = null;
        this.playerCommanderDestroyed = false;
        this.automatedCommanderDestroyed = false;
        this.commandCard = "A";
        this.log = [];
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
            unitStates: this.unitStates.map( ( state ) => ( { ...state } ) ),
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
            ? data.unitStates.map( ( state ) => ( { ...newAcesUnitState( state.unitUUID ), ...state } ) )
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
        this.syncUnitStates();
    }
}
