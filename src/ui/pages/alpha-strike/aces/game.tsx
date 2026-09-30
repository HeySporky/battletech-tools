import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';
import AlphaStrikeMPMaps from '../../../components/svg/alpha-strike-mp-maps';
import { AcesGame, acesPhases, TAcesPhase } from '../../../../classes/aces-game';
import { TAcesPriorityToken, TAcesSide } from '../../../../classes/aces-helpers';
import AlphaStrikeForce from '../../../../classes/alpha-strike-force';
import AlphaStrikeGroup from '../../../../classes/alpha-strike-group';
import { AlphaStrikeUnit } from '../../../../classes/alpha-strike-unit';
import {
    acesCombatSteps,
    acesDecks,
    acesEndPhaseSteps,
    acesMovementSteps,
    acesNonCampaignDifficulty,
    getAcesDeck,
    TAcesDeckId,
} from '../../../../data/aces-rules';
import { generateScenarioDeployments, getDeploymentById } from '../../../../data/alpha-strike-mp-deployments';
import { generateAvailableScenarios, getScenarioById } from '../../../../data/alpha-strike-mp-scenarios';
import { generateScenarioTerrains, getTerrainById } from '../../../../data/alpha-strike-mp-terrain';
import { getAcesCampaigns, getAcesGame, saveAcesGame } from '../../../../dataSaves';
import AcesToHitCalculator from './_to-hit-calculator';
import './aces.scss';

const phaseLabels: { [phase in TAcesPhase]: string } = {
    "initiative": "Initiative",
    "movement": "Movement",
    "combat": "Combat",
    "end": "End",
};

// The Match Play generator's weighted sets, reused to roll a battlefield for an Aces game.
const deploymentSet = { name: "Match Play", deploymentIds: [1, 2, 3, 4], deploymentWeights: [2, 1, 1, 2] };
const scenarioSet = { name: "Match Play", scenarioIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], scenarioWeights: [2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1] };
const terrainSet = { name: "Match Play", terrainIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], terrainWeights: [1, 2, 3, 6, 5, 6, 5, 4, 3, 1] };

const unitName = ( unit: AlphaStrikeUnit ): string => {
    return unit.customName ? unit.customName + " (" + unit.name + ")" : unit.name;
}

export default class AcesGamePage extends React.Component<IAcesGamePageProps, IAcesGamePageState> {
    constructor(props: IAcesGamePageProps) {
        super(props);
        this.state = {
            game: null,
            campaigns: [],
            forceSource: "current",
            showCards: false,
            showSetup: true,
            showToHit: false,
        }

        this.props.appGlobals.makeDocumentTitle("Aces Game Tracker");
    }

    componentDidMount = async () => {
        const data = await getAcesGame( this.props.appGlobals.appSettings );
        const campaigns = await getAcesCampaigns( this.props.appGlobals.appSettings );
        const game = new AcesGame( data );
        this.setState({
            game: game,
            campaigns: campaigns.map( ( campaign ) => ( { id: campaign.id, name: campaign.name || "Unnamed campaign" } ) ),
            showSetup: game.getAutomatedUnits().length === 0,
        });
    }

    private _save = () => {
        if( !this.state.game ) return;
        saveAcesGame( this.props.appGlobals.appSettings, this.state.game.export() );
        this.setState({ game: this.state.game });
    }

    private _update = ( change: ( game: AcesGame ) => void ) => {
        if( !this.state.game ) return;
        change( this.state.game );
        this._save();
    }

    private _number = ( value: string ): number | null => {
        if( value.trim() === "" ) return null;
        const rv = +value;
        return isNaN( rv ) ? null : rv;
    }

    /* ----- setup ----- */

    private _getSourceForce = (): AlphaStrikeForce | null => {
        if( this.state.forceSource === "current" ) {
            return this.props.appGlobals.currentASForce;
        }
        const group = this.props.appGlobals.favoriteASGroups[ +this.state.forceSource ];
        if( !group ) return null;
        const force = new AlphaStrikeForce();
        force.groups = [ new AlphaStrikeGroup( group.export() ) ];
        return force;
    }

    private _loadForce = () => {
        const force = this._getSourceForce();
        if( !force || force.getTotalUnits() === 0 ) return;
        const load = () => {
            this._update( ( game ) => {
                game.setAutomatedForce( force );
                game.reset();
                game.addLog( "Loaded " + game.getAutomatedUnits().length + " automated units (" + game.automatedForce.getTotalPoints() + " PV)." );
            } );
        };
        if( this.state.game && this.state.game.getAutomatedUnits().length > 0 ) {
            this.props.appGlobals.openConfirmDialog(
                "Replace automated force?",
                "This replaces the automated force and restarts the game at turn 1.",
                "Replace",
                "Cancel",
                load,
            );
        } else {
            load();
        }
    }

    private _restart = () => {
        this.props.appGlobals.openConfirmDialog(
            "Restart game?",
            "All automated units are repaired and the game returns to turn 1. Deck assignments are kept.",
            "Restart",
            "Cancel",
            () => this._update( ( game ) => game.reset() ),
        );
    }

    private _rollBattlefield = () => {
        this._update( ( game ) => {
            game.scenario.deploymentId = generateScenarioDeployments( deploymentSet, 1 )[0].id;
            game.scenario.scenarioId = generateAvailableScenarios( scenarioSet, 1 )[0].id;
            game.scenario.terrainId = generateScenarioTerrains( terrainSet, 1 )[0].id;
        } );
    }

    private _renderSetup = (): JSX.Element => {
        const game = this.state.game!;
        const appGlobals = this.props.appGlobals;
        const playerPV = appGlobals.currentASForce ? appGlobals.currentASForce.getTotalPoints() : 0;
        const automatedPV = game.automatedForce.getTotalPoints();
        const pvPercentOptions = acesNonCampaignDifficulty.filter( ( option ) => option.pvPercent !== 100 );

        return (
            <>
                <fieldset className="fieldset">
                    <legend>Automated force</legend>
                    <div className="aces-inline">
                        <label>Load from:{" "}
                            <select value={this.state.forceSource} onChange={( e ) => this.setState( { forceSource: e.currentTarget.value } )}>
                                <option value="current">Current Alpha Strike roster</option>
                                {appGlobals.favoriteASGroups.map( ( group, index ) => (
                                    <option key={index} value={"" + index}>Favorite: {group.getName( 0 )} ({group.getTotalPoints()} PV)</option>
                                ) )}
                            </select>
                        </label>
                        <button className="btn btn-primary btn-sm" onClick={this._loadForce}>Load automated force</button>
                        <Link to={`${process.env.PUBLIC_URL}/alpha-strike/roster`}>Build it in the roster</Link>
                    </div>
                    <p className="aces-muted">
                        The automated force is copied, so the Alpha Strike roster stays free for your own force.
                        Currently {game.getAutomatedUnits().length} units, {automatedPV} PV.
                    </p>
                    <div className="aces-inline">
                        <label>Game name:{" "}
                            <input type="text" value={game.name} onChange={( e ) => { const value = e.currentTarget.value; this._update( ( g ) => { g.name = value; } ); }} />
                        </label>
                        <label>Automated force commander:{" "}
                            <select value={game.automatedCommanderUUID} onChange={( e ) => { const value = e.currentTarget.value; this._update( ( g ) => { g.automatedCommanderUUID = value; } ); }}>
                                <option value="">None</option>
                                {game.getAutomatedUnits().map( ( unit ) => <option key={unit.uuid} value={unit.uuid}>{unitName( unit )}</option> )}
                            </select>
                        </label>
                    </div>
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Difficulty (<em>Aces</em> p.38)</legend>
                    {playerPV > 0 ? (
                        <>
                            <p>
                                Your current roster is {playerPV} PV; the automated force is {automatedPV} PV
                                ({Math.round( automatedPV / playerPV * 100 )}% of yours).
                            </p>
                            <ul>
                                {pvPercentOptions.map( ( option ) => (
                                    <li key={option.id}>{option.label}: about {Math.round( playerPV * option.pvPercent / 100 )} PV</li>
                                ) )}
                            </ul>
                        </>
                    ) : (
                        <p className="aces-muted">Build your own force in the Alpha Strike roster to compare PV.</p>
                    )}
                    <p className="aces-muted">Skill changes: {acesNonCampaignDifficulty.filter( ( option ) => option.skillChange !== 0 ).map( ( option ) => option.label ).join( "; " )}.</p>
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Cards and decks</legend>
                    <div className="aces-inline">
                        <label>
                            <input type="checkbox" checked={game.hasScouringSands} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { g.hasScouringSands = value; } ); }} />
                            {" "}I own Scouring Sands (hover and JMPS decks)
                        </label>
                        <label>
                            <input type="checkbox" checked={game.forcedWithdrawal} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { g.forcedWithdrawal = value; } ); }} />
                            {" "}Forced Withdrawal in play
                        </label>
                        <label>Command deck:{" "}
                            <input type="text" placeholder="Name on your Command card" value={game.commandDeck} onChange={( e ) => { const value = e.currentTarget.value; this._update( ( g ) => { g.commandDeck = value; } ); }} />
                        </label>
                    </div>
                    <table className="table tighter-padding">
                        <thead>
                            <tr><th>Deck</th><th>Copies owned</th><th>Units using it</th><th>Cards each</th></tr>
                        </thead>
                        <tbody>
                            {acesDecks.filter( ( deck ) => deck.product === "Aces" || game.hasScouringSands ).map( ( deck ) => {
                                const units = game.getUnitsUsingDeck( deck.id );
                                const cards = units.length > 0 ? game.getUnitState( units[0].uuid ).cardsInDeck : null;
                                return (
                                    <tr key={deck.id}>
                                        <td>{deck.name}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="aces-number"
                                                min={0}
                                                value={game.getDecksOwned( deck.id )}
                                                onChange={( e ) => {
                                                    const value = Math.max( 0, +e.currentTarget.value || 0 );
                                                    this._update( ( g ) => { g.decksOwned[deck.id] = value; g.dealDeck( deck.id ); } );
                                                }}
                                            />
                                        </td>
                                        <td>{units.length}</td>
                                        <td>{cards === null ? "-" : cards}</td>
                                    </tr>
                                );
                            } )}
                        </tbody>
                    </table>
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Battlefield (Match Play generator)</legend>
                    <div className="aces-inline">
                        <label>Game size:{" "}
                            <select value={game.scenario.gameSize} onChange={( e ) => { const value = e.currentTarget.value === "skirmish" ? "skirmish" : "battle"; this._update( ( g ) => { g.scenario.gameSize = value; } ); }}>
                                <option value="battle">Battle</option>
                                <option value="skirmish">Skirmish</option>
                            </select>
                        </label>
                        <button className="btn btn-primary btn-sm" onClick={this._rollBattlefield}>Roll deployment, objective and terrain</button>
                        <label>Campaign:{" "}
                            <select value={game.campaignId} onChange={( e ) => { const value = e.currentTarget.value; this._update( ( g ) => { g.campaignId = value; } ); }}>
                                <option value="">None (single game)</option>
                                {this.state.campaigns.map( ( campaign ) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option> )}
                            </select>
                        </label>
                    </div>
                    <p className="aces-muted">
                        In a campaign, the sortie in your Aces book sets the map and objectives instead; the Initiative
                        penalties (<em>Aces</em> p.32) apply only when a campaign is linked.
                    </p>
                    {this._renderBattlefield()}
                    <label>Notes:{" "}
                        <textarea value={game.scenario.notes} onChange={( e ) => { const value = e.currentTarget.value; this._update( ( g ) => { g.scenario.notes = value; } ); }} />
                    </label>
                </fieldset>
            </>
        );
    }

    private _renderBattlefield = (): JSX.Element | null => {
        const scenario = this.state.game!.scenario;
        if( !scenario.deploymentId && !scenario.scenarioId && !scenario.terrainId ) return null;
        const deployment = scenario.deploymentId ? getDeploymentById( scenario.deploymentId ) : null;
        const objective = scenario.scenarioId ? getScenarioById( scenario.scenarioId ) : null;
        const terrain = scenario.terrainId ? getTerrainById( scenario.terrainId ) : null;
        return (
            <div className="row">
                {deployment ? (
                    <div className="col-lg-4">
                        <h4>Deployment: {deployment.name}</h4>
                        <p>{deployment.description}</p>
                        <p className="aces-muted">Edges: {scenario.gameSize === "skirmish" ? deployment.smalledges : deployment.largeedges}</p>
                        <AlphaStrikeMPMaps battleSize={scenario.gameSize} deployment={deployment} />
                    </div>
                ) : null}
                {objective ? (
                    <div className="col-lg-4">
                        <h4>Objective: {objective.name}</h4>
                        <p>{objective.description}</p>
                        <p className="aces-muted">Victory points: {scenario.gameSize === "skirmish" ? objective.victoryPointsSmall : objective.victoryPointsLarge}</p>
                    </div>
                ) : null}
                {terrain ? (
                    <div className="col-lg-4">
                        <h4>Terrain: {terrain.name}</h4>
                    </div>
                ) : null}
            </div>
        );
    }

    /* ----- turn ----- */

    private _renderPhaseBar = (): JSX.Element => {
        const game = this.state.game!;
        return (
            <div className="aces-phase-bar">
                <strong>Turn {game.turn}</strong>
                {acesPhases.map( ( phase ) => (
                    <span key={phase} className={"aces-phase" + ( phase === game.phase ? " current" : "" )}>{phaseLabels[phase]}</span>
                ) )}
                <button className="btn btn-primary btn-sm" onClick={() => this._update( ( g ) => g.nextPhase() )}>
                    {game.phase === "end" ? "Next turn" : "Next phase"}
                </button>
                <button className="btn btn-danger btn-sm" onClick={this._restart}>Restart</button>
            </div>
        );
    }

    private _renderInitiative = (): JSX.Element => {
        const game = this.state.game!;
        const sides: TAcesSide[] = [ "player", "automated" ];
        return (
            <>
                <div className="row">
                    {sides.map( ( side ) => {
                        const modifiers = game.getInitiativeModifiers( side );
                        return (
                            <div className="col-6" key={side}>
                                <h4>{side === "player" ? "Players" : "Automated force"}</h4>
                                {modifiers.length > 0 ? (
                                    <ul>
                                        {modifiers.map( ( modifier, index ) => <li key={index}>{modifier.label}: {modifier.value}</li> )}
                                    </ul>
                                ) : <p className="aces-muted">No Initiative modifiers.</p>}
                                <button
                                    className={"btn btn-sm " + ( game.initiativeWinner === side ? "btn-primary" : "btn-secondary" )}
                                    onClick={() => this._update( ( g ) => g.setInitiativeWinner( side ) )}
                                >
                                    {side === "player" ? "Players" : "Automated force"} won Initiative
                                </button>
                            </div>
                        );
                    } )}
                </div>
                <div className="aces-inline">
                    <label>
                        <input type="checkbox" checked={game.playerCommanderDestroyed} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { g.playerCommanderDestroyed = value; } ); }} />
                        {" "}Player force commander destroyed
                    </label>
                    <label>
                        <input type="checkbox" checked={game.automatedCommanderDestroyed} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { g.automatedCommanderDestroyed = value; } ); }} />
                        {" "}Automated commander destroyed (set automatically when that unit is destroyed)
                    </label>
                    <label>Command card:{" "}
                        <select value={game.commandCard} onChange={( e ) => { const value = e.currentTarget.value; this._update( ( g ) => { g.commandCard = value; } ); }}>
                            {[ "A", "B", "C", "D", "E" ].map( ( letter ) => <option key={letter} value={letter}>{letter}</option> )}
                        </select>
                    </label>
                </div>
                <p className="aces-muted">
                    Draw each automated unit's top Aces card and enter its movement priority below. Move First and Move
                    Last tokens override the number (<em>Aces</em> p.8).
                </p>
                {this._renderUnitTable( "initiative" )}
            </>
        );
    }

    private _renderMovement = (): JSX.Element => {
        const game = this.state.game!;
        const order = game.getMoveOrder();
        const queue = game.getMovementQueue();
        return (
            <>
                <div className="aces-inline">
                    <label>Player units able to move:{" "}
                        <input
                            type="number"
                            className="aces-number"
                            min={0}
                            value={game.playerUnitsAbleToMove}
                            onChange={( e ) => { const value = Math.max( 0, +e.currentTarget.value || 0 ); this._update( ( g ) => { g.playerUnitsAbleToMove = value; } ); }}
                        />
                    </label>
                    <span>Automated units able to move: {game.getAutomatedUnitsAbleToMove()}</span>
                </div>
                {order.length > 0 ? (
                    <p>
                        Move order (front-loaded, <em>Aces</em> p.6):{" "}
                        {order.map( ( pair ) => pair.map( ( step ) => step.count + " " + ( step.side === "player" ? "player" : "automated" ) ).join( ", then " ) ).join( " | " )}
                    </p>
                ) : <p className="aces-muted">Set the Initiative winner to see the move order.</p>}
                {queue.length > 0 ? (
                    <p>Next automated unit to move: <strong>{unitName( queue[0] )}</strong></p>
                ) : <p>Every automated unit has moved.</p>}
                <details>
                    <summary>Activation steps (<em>Aces</em> p.11)</summary>
                    <ol>{acesMovementSteps.map( ( step, index ) => <li key={index}>{step}</li> )}</ol>
                </details>
                {this._renderUnitTable( "movement" )}
            </>
        );
    }

    private _renderCombat = (): JSX.Element => {
        const game = this.state.game!;
        const queue = game.getCombatQueue();
        return (
            <>
                <p className="aces-muted">
                    Enter the combat priority from the flipped side of each unit's card. Cycling a card tucks it under the
                    deck; when the combat side comes back on top the deck is reshuffled (<em>Aces</em> p.19).
                </p>
                {queue.length > 0 ? (
                    <p>Next automated unit to attack: <strong>{unitName( queue[0] )}</strong></p>
                ) : <p>Every automated unit has attacked.</p>}
                <details>
                    <summary>Activation steps (<em>Aces</em> p.18)</summary>
                    <ol>{acesCombatSteps.map( ( step, index ) => <li key={index}>{step}</li> )}</ol>
                </details>
                <p>
                    <button className="btn btn-secondary btn-sm" onClick={() => this.setState( { showToHit: !this.state.showToHit } )}>
                        {this.state.showToHit ? "Hide" : "Show"} to-hit calculator
                    </button>
                </p>
                {this.state.showToHit ? <AcesToHitCalculator automatedAttacker={true} /> : null}
                {this._renderUnitTable( "combat" )}
            </>
        );
    }

    private _renderEnd = (): JSX.Element => {
        const game = this.state.game!;
        const crippled = game.getLiveAutomatedUnits().filter( ( unit ) => game.getUnitState( unit.uuid ).forcedWithdrawal );
        return (
            <>
                <ol>{acesEndPhaseSteps.map( ( step, index ) => <li key={index}>{step}</li> )}</ol>
                <p className="aces-muted">Damage and heat from this turn were applied when the End Phase began.</p>
                {crippled.length > 0 ? (
                    <p>Under Forced Withdrawal: {crippled.map( ( unit ) => unitName( unit ) ).join( ", " )}</p>
                ) : null}
                <p>
                    <button className="btn btn-secondary btn-sm" onClick={() => this._update( ( g ) => {
                        const result = g.checkCrippled();
                        g.addLog( result.length > 0
                            ? "Crippled: " + result.map( ( entry ) => unitName( entry.unit ) + " (" + entry.reasons.join( ", " ) + ")" ).join( "; " )
                            : "No crippled automated units." );
                    } )}>
                        Check crippled units again
                    </button>
                </p>
                {this._renderUnitTable( "end" )}
            </>
        );
    }

    private _renderUnitTable = ( phase: TAcesPhase ): JSX.Element => {
        const game = this.state.game!;
        let units = game.getAutomatedUnits();
        if( phase === "movement" ) units = [ ...game.getMovementQueue(), ...units.filter( ( unit ) => game.getMovementQueue().indexOf( unit ) === -1 ) ];
        if( phase === "combat" ) units = [ ...game.getCombatQueue(), ...units.filter( ( unit ) => game.getCombatQueue().indexOf( unit ) === -1 ) ];

        return (
            <table className="table tighter-padding">
                <thead>
                    <tr>
                        <th>Unit</th>
                        <th>Deck</th>
                        {phase === "initiative" || phase === "movement" ? <th>Move priority</th> : null}
                        {phase === "initiative" || phase === "movement" ? <th>Token</th> : null}
                        {phase === "combat" ? <th>Combat priority</th> : null}
                        <th>Orders</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {units.map( ( unit ) => {
                        const state = game.getUnitState( unit.uuid );
                        const wrecked = unit.isWrecked();
                        const deck = state.deckId ? getAcesDeck( state.deckId ) : null;
                        return (
                            <tr key={unit.uuid} className={wrecked ? "aces-muted" : ""}>
                                <td>
                                    {unitName( unit )}
                                    <br /><span className="aces-muted">{unit.type} {unit.role ? "- " + unit.role : ""} - {unit.currentPoints || unit.basePoints} PV{wrecked ? " - destroyed" : ""}</span>
                                </td>
                                <td>
                                    <select value={state.deckId} onChange={( e ) => { const value = e.currentTarget.value as TAcesDeckId | ""; this._update( ( g ) => g.setUnitDeck( unit.uuid, value ) ); }}>
                                        <option value="">None</option>
                                        {acesDecks.filter( ( entry ) => entry.product === "Aces" || game.hasScouringSands || entry.id === state.deckId ).map( ( entry ) => (
                                            <option key={entry.id} value={entry.id}>{entry.name}</option>
                                        ) )}
                                    </select>
                                    {deck ? <><br /><span className="aces-muted">Card {Math.min( state.cardsCycled + 1, state.cardsInDeck )} of {state.cardsInDeck}</span></> : null}
                                </td>
                                {phase === "initiative" || phase === "movement" ? (
                                    <td>
                                        <input type="number" className="aces-number" value={state.movePriority === null ? "" : state.movePriority} onChange={( e ) => { const value = this._number( e.currentTarget.value ); this._update( () => { state.movePriority = value; } ); }} />
                                    </td>
                                ) : null}
                                {phase === "initiative" || phase === "movement" ? (
                                    <td>
                                        <select value={state.token || ""} onChange={( e ) => { const value = ( e.currentTarget.value || null ) as TAcesPriorityToken | null; this._update( ( g ) => { g.assignToken( unit.uuid, value ); } ); }}>
                                            <option value="">None</option>
                                            <option value="move-first">Move First</option>
                                            <option value="move-last">Move Last</option>
                                        </select>
                                    </td>
                                ) : null}
                                {phase === "combat" ? (
                                    <td>
                                        <input type="number" className="aces-number" value={state.combatPriority === null ? "" : state.combatPriority} onChange={( e ) => { const value = this._number( e.currentTarget.value ); this._update( () => { state.combatPriority = value; } ); }} />
                                    </td>
                                ) : null}
                                <td>
                                    <label title="Forced Withdrawal (Aces p.16)"><input type="checkbox" checked={state.forcedWithdrawal} onChange={( e ) => { const value = e.currentTarget.checked; this._update( () => { state.forcedWithdrawal = value; if( value ) state.token = null; } ); }} /> FW</label>{" "}
                                    <label title="Fleeing"><input type="checkbox" checked={state.fleeing} onChange={( e ) => { const value = e.currentTarget.checked; this._update( () => { state.fleeing = value; if( value ) state.token = null; } ); }} /> Fleeing</label>{" "}
                                    <label title="Can't move this turn (e.g. Crew Stunned)"><input type="checkbox" checked={state.cannotMove} onChange={( e ) => { const value = e.currentTarget.checked; this._update( () => { state.cannotMove = value; if( value ) state.token = null; } ); }} /> Can't move</label>{" "}
                                    <label title="Emplacements don't use Aces decks (Aces p.31)"><input type="checkbox" checked={state.isEmplacement} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { state.isEmplacement = value; g.assignDecks(); } ); }} /> Emplacement</label>
                                </td>
                                <td>
                                    {phase === "movement" && !wrecked && !state.isEmplacement && !state.cannotMove ? (
                                        <button className={"btn btn-sm " + ( state.moved ? "btn-secondary" : "btn-primary" )} onClick={() => this._update( ( g ) => g.markMoved( unit.uuid, !state.moved ) )}>
                                            {state.moved ? "Undo move" : "Moved"}
                                        </button>
                                    ) : null}
                                    {phase === "combat" && !wrecked ? (
                                        state.attacked ? (
                                            <span className="aces-muted">Attacked</span>
                                        ) : (
                                            <button className="btn btn-primary btn-sm" onClick={() => this._update( ( g ) => {
                                                if( state.deckId && !state.isEmplacement ) {
                                                    g.cycleCard( unit.uuid );
                                                } else {
                                                    state.attacked = true;
                                                }
                                            } )}>
                                                {state.deckId && !state.isEmplacement ? "Attacked, cycle card" : "Attacked"}
                                            </button>
                                        )
                                    ) : null}
                                </td>
                            </tr>
                        );
                    } )}
                </tbody>
            </table>
        );
    }

    private _renderPhase = (): JSX.Element => {
        switch( this.state.game!.phase ) {
            case "movement": return this._renderMovement();
            case "combat": return this._renderCombat();
            case "end": return this._renderEnd();
            default: return this._renderInitiative();
        }
    }

    render = (): JSX.Element => {
        const game = this.state.game;
        return (
        <UIPage current="alpha-strike-aces" appGlobals={this.props.appGlobals}>
          <div className="aces-page">
            {!game ? (
                <TextSection label="Aces Game Tracker"><p>Loading...</p></TextSection>
            ) : (
                <>
                    <TextSection
                        label="Aces Game Setup"
                        labelButton={
                            <button className="btn btn-secondary btn-sm" onClick={() => this.setState( { showSetup: !this.state.showSetup } )}>
                                {this.state.showSetup ? "Hide" : "Show"}
                            </button>
                        }
                    >
                        {this.state.showSetup ? this._renderSetup() : (
                            <p className="aces-muted">{game.name || "Aces game"}: {game.getAutomatedUnits().length} automated units, {game.automatedForce.getTotalPoints()} PV.</p>
                        )}
                    </TextSection>

                    {game.getAutomatedUnits().length > 0 ? (
                        <>
                            <TextSection label={phaseLabels[game.phase] + " Phase"}>
                                {this._renderPhaseBar()}
                                {this._renderPhase()}
                            </TextSection>

                            <TextSection
                                label="Automated Unit Cards"
                                labelButton={
                                    <button className="btn btn-secondary btn-sm" onClick={() => this.setState( { showCards: !this.state.showCards } )}>
                                        {this.state.showCards ? "Hide" : "Show"}
                                    </button>
                                }
                            >
                                {this.state.showCards ? (
                                    <div className="aces-unit-cards">
                                        {game.getAutomatedUnits().map( ( unit ) => (
                                            <div className="unit-card" key={unit.uuid}>
                                                <AlphaStrikeUnitSVG
                                                    asUnit={unit}
                                                    inPlay={true}
                                                    appGlobals={this.props.appGlobals}
                                                    className="small-margins"
                                                    measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                                                    onChange={this._save}
                                                />
                                            </div>
                                        ) )}
                                    </div>
                                ) : <p className="aces-muted">Show the cards to mark damage, heat and critical hits on the automated units.</p>}
                            </TextSection>

                            <TextSection label="Game Log">
                                <div className="aces-log">
                                    {game.log.length > 0 ? (
                                        <ul>{game.log.slice().reverse().map( ( entry, index ) => <li key={index}>{entry}</li> )}</ul>
                                    ) : <p className="aces-muted">Nothing logged yet.</p>}
                                </div>
                            </TextSection>
                        </>
                    ) : null}
                </>
            )}
          </div>
        </UIPage>
        );
    }
}

interface IAcesGamePageProps {
    appGlobals: IAppGlobals;
}

interface IAcesGamePageState {
    game: AcesGame | null;
    campaigns: { id: string, name: string }[];
    forceSource: string;
    showCards: boolean;
    showSetup: boolean;
    showToHit: boolean;
}
