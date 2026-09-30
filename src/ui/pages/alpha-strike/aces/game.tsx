import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';
import AlphaStrikeMPMaps from '../../../components/svg/alpha-strike-mp-maps';
import { AcesGame, acesPhases, getAcesAbilityValue, TAcesPhase } from '../../../../classes/aces-game';
import {
    applyAcesCriticalToUnit,
    chooseAcesTokenUnit,
    evaluateAcesStrategy,
    getAcesDestroyObjectiveStats,
    getAcesOrdersForPhase,
    getAcesUnitStats,
    newAcesRngState,
    rollAcesCriticalHit,
    rollAcesMotiveDamage,
    TAcesRuleset,
} from '../../../../classes/aces-engine';
import { TAcesPriorityToken, TAcesSide } from '../../../../classes/aces-helpers';
import { IAcesCardLibrary, IAcesCommandCard, IAcesSpecialOrder, newAcesCardLibrary, TAcesSpecialOrderKind } from '../../../../data/aces-cards';
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
import { getAcesCampaigns, getAcesCardLibrary, getAcesGame, saveAcesGame } from '../../../../dataSaves';
import AcesToHitCalculator from './_to-hit-calculator';
import AcesCardReader, { IAcesReaderEnemy, IAcesReaderUnit } from './_card-reader';
import { AcesCommandCardView } from './_aces-card-view';
import AcesText from './_aces-text';
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
            library: newAcesCardLibrary(),
            scenarioPick: "",
            warnings: [],
            readerUUID: "",
            strategyAnswers: {},
            critMessage: "",
        }

        this.props.appGlobals.makeDocumentTitle("Aces Game Tracker");
    }

    componentDidMount = async () => {
        const data = await getAcesGame( this.props.appGlobals.appSettings );
        const campaigns = await getAcesCampaigns( this.props.appGlobals.appSettings );
        const library = await getAcesCardLibrary( this.props.appGlobals.appSettings );
        const game = new AcesGame( data );
        this.setState({
            game: game,
            library: library,
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
        // Units dealt from the card library show their top card's numbers.
        this.state.game.syncPrioritiesFromCards( this.state.library );
        this._save();
    }

    private _number = ( value: string ): number | null => {
        if( value.trim() === "" ) return null;
        const rv = +value;
        return isNaN( rv ) ? null : rv;
    }

    /* ----- card library ----- */

    /** The face-up Command card, when the players entered their Command deck in the library. */
    private _commandCard = (): IAcesCommandCard | null => {
        const game = this.state.game!;
        const cards = this.state.library.commandCards;
        const byId = game.commandCardId ? cards.find( ( card ) => card.id === game.commandCardId ) : null;
        if( byId && byId.letter === game.commandCard ) return byId;
        const deck = game.commandDeck.trim().toLowerCase();
        return cards.find( ( card ) => card.letter === game.commandCard && ( !deck || card.deck.toLowerCase() === deck ) ) || null;
    }

    private _specialOrder = ( kind: TAcesSpecialOrderKind ): IAcesSpecialOrder | null => {
        return this.state.library.specialOrders.find( ( order ) => order.kind === kind ) || null;
    }

    /** The players' units, from the current Alpha Strike roster, as candidates for the card reader. */
    private _enemies = (): IAcesReaderEnemy[] => {
        const force = this.props.appGlobals.currentASForce;
        const rv: IAcesReaderEnemy[] = [];
        if( force ) {
            for( const group of force.groups ) {
                for( const unit of group.members ) {
                    if( unit.isWrecked() ) continue;
                    rv.push( { id: unit.uuid, name: unitName( unit ), stats: getAcesUnitStats( unit ) } );
                }
            }
        }
        return rv;
    }

    private _readerUnit = ( unit: AlphaStrikeUnit ): IAcesReaderUnit => {
        return {
            name: unitName( unit ),
            isBattleMech: unit.type.toUpperCase() === "BM",
            canJump: unit.jumpMove > 0 || unit.move.some( ( move ) => move.type.toLowerCase() === "j" ),
            canIndirectFire: getAcesAbilityValue( unit, "IF" ) !== null,
            ovRating: getAcesAbilityValue( unit, "OV" ) || 0,
            currentHeat: unit.currentHeat,
            fireControlHits: unit.fireControlHits.filter( ( hit ) => hit ).length,
        };
    }

    private _dealFromLibrary = () => {
        this._update( ( game ) => {
            game.setDeckPoolsFromLibrary( this.state.library );
            const dealt = Object.keys( game.deckPools ).length;
            game.addLog( dealt > 0 ? "Dealt Aces decks from the card library." : "The card library has no Aces cards for these decks." );
        } );
    }

    private _loadSortie = () => {
        const scenario = this.state.library.scenarios.find( ( item ) => item.id === this.state.scenarioPick );
        if( !scenario ) return;
        let warnings: string[] = [];
        this._update( ( game ) => {
            warnings = game.loadScenario( scenario, this.state.library.cards.length > 0 ? this.state.library : null );
            const command = this._commandCard();
            game.commandCardId = command ? command.id : "";
        } );
        this.setState({ warnings: warnings });
    }

    private _rollCritical = ( unit: AlphaStrikeUnit ) => {
        this._update( ( game ) => {
            const state = game.getUnitState( unit.uuid );
            const result = rollAcesCriticalHit( game.ruleset, unit.type, state.isEmplacement, game.rng );
            let message = unitName( unit ) + " critical hit" + ( result.roll !== null ? " (" + result.roll + ")" : "" ) + ": " + result.label + ".";
            if( result.effect !== "use-asce-table" && !applyAcesCriticalToUnit( unit, result.effect ) ) {
                message += " Mark it on the card by hand.";
            }
            game.addLog( message );
            this.setState({ critMessage: message });
        } );
    }

    /** Motive systems damage for a vehicle under the Aces rules (Aces p.4). */
    private _rollMotive = ( unit: AlphaStrikeUnit ) => {
        this._update( ( game ) => {
            const motive = rollAcesMotiveDamage( unit.move.length > 0 ? unit.move[0].type : "", game.rng );
            let message = unitName( unit ) + " motive roll " + motive.roll + ": " + motive.label + ".";
            if( motive.effect !== "none" && !applyAcesCriticalToUnit( unit, motive.effect ) ) message += " Mark it on the card by hand.";
            game.addLog( message );
            this.setState({ critMessage: message });
        } );
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
                    <legend>Rules and dice</legend>
                    <div className="aces-inline">
                        <label>Rules:{" "}
                            <select aria-label="Rules" value={game.ruleset} onChange={( e ) => { const value = e.currentTarget.value as TAcesRuleset; this._update( ( g ) => { g.ruleset = value; g.addLog( "Rules set to " + ( value === "aces" ? "Aces additional rules" : "Alpha Strike: Commander's Edition" ) + "." ); } ); }}>
                                <option value="aces">Aces additional rules (Aces pp.4-6)</option>
                                <option value="asce">Alpha Strike: Commander's Edition only</option>
                            </select>
                        </label>
                        <span className="aces-muted">Dice seed {game.rng.seed}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => this._update( ( g ) => { g.rng = newAcesRngState(); g.addLog( "New dice seed " + g.rng.seed + "." ); } )}>New seed</button>
                    </div>
                    <p className="aces-muted">
                        The Aces rules change vehicle critical hits and motive damage, infantry and emplacement hits and
                        transports; switching to Commander's Edition sends critical hits to its own tables. The seed is
                        saved with the game, so a reload rolls the same dice.
                    </p>
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Card library and sortie</legend>
                    <p className="aces-muted">
                        Your library holds {this.state.library.cards.length} Aces cards, {this.state.library.commandCards.length} Command
                        cards, {this.state.library.specialOrders.length} Special Orders and {this.state.library.scenarios.length} sorties.
                        {" "}<Link to={`${process.env.PUBLIC_URL}/alpha-strike/aces/library`}>Open the Card Library</Link>
                    </p>
                    <div className="aces-inline">
                        <button className="btn btn-primary btn-sm" onClick={this._dealFromLibrary} disabled={this.state.library.cards.length === 0}>Deal decks from my library</button>
                        <label>Sortie:{" "}
                            <select aria-label="Sortie" value={this.state.scenarioPick} onChange={( e ) => this.setState( { scenarioPick: e.currentTarget.value } )}>
                                <option value="">Choose...</option>
                                {this.state.library.scenarios.map( ( scenario ) => (
                                    <option key={scenario.id} value={scenario.id}>{( scenario.code ? scenario.code + " - " : "" ) + scenario.name}</option>
                                ) )}
                            </select>
                        </label>
                        <button className="btn btn-primary btn-sm" onClick={this._loadSortie} disabled={!this.state.scenarioPick}>Load sortie</button>
                    </div>
                    {this.state.warnings.length > 0 ? (
                        <ul className="aces-issue-error">{this.state.warnings.map( ( warning, index ) => <li key={index}>{warning}</li> )}</ul>
                    ) : null}
                    <div className="aces-inline">
                        <strong>Special Orders in play:</strong>
                        <label><input type="checkbox" checked={game.specialOrders.movementObjective} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { g.specialOrders.movementObjective = value; } ); }} /> Movement Objective</label>
                        <label><input type="checkbox" checked={game.specialOrders.destroyObjective} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { g.specialOrders.destroyObjective = value; } ); }} /> Destroy Objective</label>
                        <label><input type="checkbox" checked={game.specialOrders.indirectAttacks} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { g.specialOrders.indirectAttacks = value; } ); }} /> Indirect Attacks</label>
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
                <button className="btn btn-primary btn-sm" onClick={() => this._update( ( g ) => {
                    g.nextPhase();
                    // Damage lands at the start of the End Phase; carried infantry go down with their transport (Aces p.5).
                    for( const unit of g.getAutomatedUnits() ) {
                        if( unit.isWrecked() && g.getPassengers( unit.uuid ).length > 0 ) g.handleTransportDestroyed( unit.uuid );
                    }
                    this.setState({ readerUUID: "", critMessage: "" });
                } )}>
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
                    <button className="btn btn-primary btn-sm" onClick={() => this._update( ( g ) => { g.rollInitiative(); } )}>Roll Initiative</button>
                </div>
                {this._renderCommandOrders( "initiative" )}
                <p className="aces-muted">
                    Draw each automated unit's top Aces card and enter its movement priority below. Move First and Move
                    Last tokens override the number (<em>Aces</em> p.8).
                </p>
                {this._renderUnitTable( "initiative" )}
            </>
        );
    }

    /** The face-up Command card's orders for a phase, with a Move First / Move Last suggestion (Aces p.8). */
    private _renderCommandOrders = ( phase: TAcesPhase ): JSX.Element | null => {
        const game = this.state.game!;
        const card = this._commandCard();
        if( !card ) return null;
        const orders = getAcesOrdersForPhase( card, phase );
        const units = game.getLiveAutomatedUnits().map( ( unit ) => {
            const state = game.getUnitState( unit.uuid );
            return {
                id: unit.uuid,
                name: unitName( unit ),
                stats: getAcesUnitStats( unit ),
                eligible: !state.cannotMove && !state.forcedWithdrawal && !state.fleeing && !state.isEmplacement && !state.transportedBy,
            };
        } );
        return (
            <div className="aces-command-orders">
                <p><strong>Command card {card.deck} {card.letter}</strong></p>
                {orders.length > 0 ? (
                    <ul>
                        {orders.map( ( order, index ) => {
                            const choice = order.token ? chooseAcesTokenUnit( order, units ) : null;
                            return (
                                <li key={index}>
                                    <AcesText text={order.text} />
                                    {choice ? (
                                        <>
                                            {" "}<span className="aces-muted">{choice.trace[choice.trace.length - 1]}</span>
                                            {choice.unitId ? (
                                                <>{" "}<button className="btn btn-secondary btn-sm" onClick={() => this._update( ( g ) => { g.assignToken( choice.unitId!, order.token ); } )}>Give token</button></>
                                            ) : null}
                                        </>
                                    ) : null}
                                </li>
                            );
                        } )}
                    </ul>
                ) : <p className="aces-muted">No orders for this phase.</p>}
                <details>
                    <summary>Show the Command card</summary>
                    <AcesCommandCardView card={card} />
                </details>
            </div>
        );
    }

    /** The card reader for the selected automated unit, or the next one in the queue. */
    private _renderReader = ( phase: "movement" | "combat", queue: AlphaStrikeUnit[] ): JSX.Element | null => {
        const game = this.state.game!;
        const unit = ( this.state.readerUUID ? game.getUnit( this.state.readerUUID ) : null ) || queue[0] || null;
        if( !unit ) return null;
        const state = game.getUnitState( unit.uuid );
        const card = game.getTopCard( unit.uuid, this.state.library );
        let behaviorOrder: IAcesSpecialOrder | null = null;
        if( state.fleeing ) behaviorOrder = this._specialOrder( "fleeing" );
        else if( state.forcedWithdrawal ) behaviorOrder = this._specialOrder( "forced-withdrawal" );
        const commandCard = this._commandCard();
        const override = getAcesOrdersForPhase( commandCard, "movement" ).find( ( order ) => order.behavior );
        const movementObjective = game.specialOrders.movementObjective ? this._specialOrder( "movement-objective" ) : null;
        const enemies = this._enemies();
        if( game.specialOrders.destroyObjective ) {
            // Destroy Objective targets are chosen like units, with the defaults from Aces p.17.
            enemies.push( { id: "destroy-objective", name: "Destroy Objective", stats: getAcesDestroyObjectiveStats(), isObjective: true } );
        }
        return (
            <AcesCardReader
                phase={phase}
                card={card}
                commandCard={commandCard}
                unit={this._readerUnit( unit )}
                enemies={enemies}
                behaviorOrder={behaviorOrder}
                behaviorOverride={override ? override.behavior : null}
                preFilters={movementObjective ? movementObjective.preFilters : []}
                resetKey={phase + unit.uuid + ( card ? card.id : "" ) + game.turn}
                onLog={( message ) => this._update( ( g ) => g.addLog( message ) )}
                onDone={() => {
                    this._update( ( g ) => {
                        if( phase === "movement" ) {
                            g.markMoved( unit.uuid, true );
                        } else if( state.deckId && !state.isEmplacement ) {
                            g.cycleCard( unit.uuid );
                        } else {
                            state.attacked = true;
                        }
                    } );
                    this.setState({ readerUUID: "" });
                }}
            />
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
                {this._renderCommandOrders( "movement" )}
                {this._renderReader( "movement", queue )}
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
                {this._renderCommandOrders( "combat" )}
                {this._renderReader( "combat", queue )}
                {this.state.critMessage ? <p><strong>{this.state.critMessage}</strong></p> : null}
                {this._renderSupport()}
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
                {this._renderCommandOrders( "end" )}
                {this._renderStrategy()}
                {this._renderUnitTable( "end" )}
            </>
        );
    }

    /** Support attacks after every automated unit has attacked (Aces p.20). */
    private _renderSupport = (): JSX.Element | null => {
        const card = this._commandCard();
        if( !card || ( card.emplacements.length === 0 && card.artillery.length === 0 && card.bsp.length === 0 && !card.supportOrders ) ) return null;
        return (
            <details>
                <summary>Support attacks (<em>Aces</em> p.20)</summary>
                <p className="aces-muted">After all automated units attack: emplacements, then artillery, then Battlefield Support cards, lowest Target Number first.</p>
                {card.supportOrders ? <p><AcesText text={card.supportOrders} /></p> : null}
                {card.supportOnlyIfStructure ? <p>Battlefield Support is only spent when its damage gets through the target's armor.</p> : null}
            </details>
        );
    }

    /** Strategy decisions on the Command card (Aces p.21). */
    private _renderStrategy = (): JSX.Element | null => {
        const game = this.state.game!;
        const card = this._commandCard();
        if( !card || card.strategy.length === 0 ) return null;
        const enemyWithNoArmor = this._enemies().some( ( enemy ) => enemy.stats.armor === 0 && enemy.stats.structure > 0 );
        const result = evaluateAcesStrategy( card, this.state.strategyAnswers, { objectiveComplete: game.automatedObjectiveComplete, enemyWithNoArmor: enemyWithNoArmor } );
        return (
            <div className="aces-reader">
                <h4>Strategy decision</h4>
                <label>
                    <input type="checkbox" checked={game.automatedObjectiveComplete} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { g.automatedObjectiveComplete = value; } ); }} />
                    {" "}The automated force has completed its objective
                </label>
                <ul className="aces-reader-trace">{result.trace.map( ( line, index ) => <li key={index}>{line}</li> )}</ul>
                {result.pending ? (
                    <div className="aces-reader-question">
                        <p><strong>{result.pending.letter}:</strong> <AcesText text={result.pending.text} /></p>
                        <button className="btn btn-primary btn-sm" onClick={() => this.setState( { strategyAnswers: { ...this.state.strategyAnswers, [result.pending!.letter]: true } } )}>True</button>{" "}
                        <button className="btn btn-secondary btn-sm" onClick={() => this.setState( { strategyAnswers: { ...this.state.strategyAnswers, [result.pending!.letter]: false } } )}>False</button>
                    </div>
                ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => {
                        this._update( ( g ) => {
                            if( result.letter ) {
                                g.commandCard = result.letter;
                                const next = this._commandCard();
                                g.commandCardId = next ? next.id : "";
                            }
                            g.addLog( result.trace[result.trace.length - 1] );
                        } );
                        this.setState({ strategyAnswers: {} });
                    }}>{result.letter ? "Put card " + result.letter + " on top" : "Keep card " + card.letter}</button>
                )}
            </div>
        );
    }

    /** Turn track: Waypoints due this turn, objectives and the sortie end (Aces p.32). */
    private _renderTurnTrack = (): JSX.Element | null => {
        const game = this.state.game!;
        if( game.turnLimit === null && game.waypoints.length === 0 && game.objectives.length === 0 ) return null;
        const due = game.getWaypointsDue();
        const over = game.isSortieOver();
        const turns: number[] = [];
        const last = Math.max( game.turnLimit || 0, game.turn, ...game.waypoints.map( ( waypoint ) => waypoint.turn ) );
        for( let turn = 1; turn <= last; turn++ ) turns.push( turn );
        return (
            <TextSection label="Sortie">
                {over.over ? <p className="aces-sortie-over"><strong>The sortie is over: {over.reason}</strong></p> : null}
                <div className="aces-turn-track">
                    {turns.map( ( turn ) => {
                        const waypoints = game.waypoints.filter( ( waypoint ) => waypoint.turn === turn );
                        return (
                            <div key={turn} className={"aces-turn-space" + ( turn === game.turn ? " current" : "" ) + ( game.turnLimit !== null && turn > game.turnLimit ? " past-limit" : "" )}>
                                <strong>{turn}</strong>
                                {waypoints.map( ( waypoint, index ) => <span key={index} className={waypoint.resolved ? "aces-muted" : ""}> {waypoint.label || "WP"}</span> )}
                            </div>
                        );
                    } )}
                </div>
                {due.length > 0 ? (
                    <ul>
                        {due.map( ( waypoint, index ) => (
                            <li key={index}>
                                <strong>Waypoint {waypoint.label}:</strong> {waypoint.text}{" "}
                                <button className="btn btn-primary btn-sm" onClick={() => this._update( ( g ) => g.resolveWaypoint( waypoint ) )}>Resolved</button>
                            </li>
                        ) )}
                    </ul>
                ) : null}
                {game.objectives.length > 0 ? (
                    <ul className="list-unstyled">
                        {game.objectives.map( ( objective, index ) => (
                            <li key={index}>
                                <label>
                                    <input type="checkbox" checked={objective.complete} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( g ) => { g.objectives[index].complete = value; g.addLog( "Objective " + ( value ? "complete" : "reopened" ) + ": " + objective.text ); } ); }} />
                                    {" "}{objective.kind === "secondary" ? "Secondary" : "Primary"}: {objective.text}{objective.sp !== null ? " (" + objective.sp + " SP)" : ""}
                                </label>
                            </li>
                        ) )}
                    </ul>
                ) : null}
            </TextSection>
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
                                    {this._renderTransport( unit, phase )}
                                </td>
                                <td>
                                    {( phase === "movement" && !state.moved ) || ( phase === "combat" && !state.attacked ) ? (
                                        !wrecked && !state.isEmplacement && !state.transportedBy ? (
                                            <><button className="btn btn-secondary btn-sm" onClick={() => this.setState( { readerUUID: unit.uuid } )}>Read card</button>{" "}</>
                                        ) : null
                                    ) : null}
                                    {( phase === "combat" || phase === "end" ) && !wrecked ? (
                                        <>
                                            <button className="btn btn-secondary btn-sm" onClick={() => this._rollCritical( unit )}>Critical hit</button>{" "}
                                            {game.ruleset === "aces" && ( unit.type.toUpperCase() === "CV" || unit.type.toUpperCase() === "SV" ) ? (
                                                <><button className="btn btn-secondary btn-sm" onClick={() => this._rollMotive( unit )}>Motive roll</button>{" "}</>
                                            ) : null}
                                        </>
                                    ) : null}
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

    /** Mount and dismount controls for automated infantry (Aces p.5). */
    private _renderTransport = ( unit: AlphaStrikeUnit, phase: TAcesPhase ): JSX.Element | null => {
        const game = this.state.game!;
        const state = game.getUnitState( unit.uuid );
        const type = unit.type.toUpperCase();
        if( state.transportedBy ) {
            const transport = game.getUnit( state.transportedBy );
            return (
                <div>
                    Aboard {transport ? unitName( transport ) : "a transport"}
                    {phase === "movement" && !state.mountedThisTurn ? (
                        <>
                            {" "}<button className="btn btn-secondary btn-sm" onClick={() => this._update( ( g ) => {
                                const result = g.dismount( unit.uuid, false );
                                if( !result.ok ) g.addLog( unitName( unit ) + ": " + result.reason );
                            } )}>Dismount</button>
                        </>
                    ) : null}
                </div>
            );
        }
        if( phase !== "movement" || ( type !== "CI" && type !== "BA" ) || state.moved ) return null;
        const transports = game.getLiveAutomatedUnits().filter( ( item ) => item.uuid !== unit.uuid && !game.getUnitState( item.uuid ).transportedBy );
        if( transports.length === 0 ) return null;
        return (
            <div>
                <select aria-label={"Mount " + unitName( unit )} value="" onChange={( e ) => {
                    const transportUUID = e.currentTarget.value;
                    if( !transportUUID ) return;
                    this._update( ( g ) => {
                        const result = g.mount( unit.uuid, transportUUID, g.getUnitState( transportUUID ).moved );
                        if( !result.ok ) g.addLog( unitName( unit ) + " can't mount: " + result.reason );
                    } );
                }}>
                    <option value="">Mount...</option>
                    {transports.map( ( item ) => <option key={item.uuid} value={item.uuid}>{unitName( item )}</option> )}
                </select>
            </div>
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
                            {this._renderTurnTrack()}
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
    library: IAcesCardLibrary;
    scenarioPick: string;
    warnings: string[];
    /** Unit the card reader shows; empty follows the activation queue. */
    readerUUID: string;
    strategyAnswers: { [letter: string]: boolean };
    critMessage: string;
}
