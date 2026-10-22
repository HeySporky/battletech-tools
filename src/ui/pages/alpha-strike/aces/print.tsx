import React, { type JSX } from 'react';
import { FaArrowCircleLeft, FaPrint } from "react-icons/fa";
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import { AcesGame, IAcesGameExport } from '../../../../classes/aces-game';
import { IAcesCardLibrary } from '../../../../data/aces-cards';
import { getAcesDeck } from '../../../../data/aces-rules';
import { getAcesCardLibrary, getAcesGame } from '../../../../dataSaves';
import { AcesCardView, AcesCommandCardView, AcesScenarioView, AcesSpecialOrderView } from './_aces-card-view';
import './aces.scss';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const PrintIcon = FaPrint as any;

/*
 * Printable sheets: the players' library cards, for use away from a screen, and a game sheet with the turn track,
 * objectives, automated roster and log.
 */

type TPrintPart = "cards" | "commandCards" | "specialOrders" | "scenarios" | "game";

const partLabels: { [part in TPrintPart]: string } = {
    cards: "Aces cards",
    commandCards: "Command cards",
    specialOrders: "Special Orders",
    scenarios: "Sorties",
    game: "Game sheet",
};

export default class AcesPrintPage extends React.Component<IAcesPrintPageProps, IAcesPrintPageState> {
    constructor(props: IAcesPrintPageProps) {
        super(props);
        this.state = {
            library: null,
            game: null,
            parts: { cards: true, commandCards: true, specialOrders: true, scenarios: true, game: false },
        };
        this.props.appGlobals.makeDocumentTitle("Printing Aces Cards");
    }

    componentDidMount = async () => {
        const library = await getAcesCardLibrary( this.props.appGlobals.appSettings );
        const data: IAcesGameExport | null = await getAcesGame( this.props.appGlobals.appSettings );
        this.setState({ library: library, game: data ? new AcesGame( data ) : null });
    }

    private _renderGameSheet = ( game: AcesGame ): JSX.Element => {
        const last = Math.max( game.turnLimit || 0, game.turn, 8, ...game.waypoints.map( ( waypoint ) => waypoint.turn ) );
        const turns: number[] = [];
        for( let turn = 1; turn <= last; turn++ ) turns.push( turn );
        return (
            <div className="aces-print-section">
                <h2>{game.name || "Aces game"}</h2>
                <p>Rules: {game.ruleset === "aces" ? "Aces additional rules" : "Alpha Strike: Commander's Edition"} · Command deck {game.commandDeck || "-"}, card {game.commandCard} · Dice seed {game.rng.seed}</p>
                <table className="aces-print-track">
                    <tbody>
                        <tr>{turns.map( ( turn ) => <th key={turn} className={game.turnLimit !== null && turn > game.turnLimit ? "past-limit" : ""}>{turn}</th> )}</tr>
                        <tr>{turns.map( ( turn ) => <td key={turn}>{game.waypoints.filter( ( waypoint ) => waypoint.turn === turn ).map( ( waypoint ) => waypoint.label ).join( " " )}</td> )}</tr>
                    </tbody>
                </table>
                {game.waypoints.length > 0 ? (
                    <ul>{game.waypoints.map( ( waypoint, index ) => <li key={index}>Turn {waypoint.turn} {waypoint.label}: {waypoint.text}</li> )}</ul>
                ) : null}
                {game.objectives.length > 0 ? (
                    <ul className="list-unstyled">{game.objectives.map( ( objective, index ) => (
                        <li key={index}>{objective.complete ? "☒" : "☐"} {objective.kind === "secondary" ? "Secondary" : "Primary"}: {objective.text}{objective.sp !== null ? " (" + objective.sp + " SP)" : ""}</li>
                    ) )}</ul>
                ) : null}
                <table className="aces-print-roster">
                    <thead><tr><th>Automated unit</th><th>Deck</th><th>Move</th><th>Combat</th><th>Orders</th></tr></thead>
                    <tbody>
                        {game.getAutomatedUnits().map( ( unit ) => {
                            const state = game.getUnitState( unit.uuid );
                            const deck = getAcesDeck( state.deckId );
                            const orders = [ state.forcedWithdrawal ? "FW" : "", state.fleeing ? "Fleeing" : "", state.isEmplacement ? "Emplacement" : "", state.transportedBy ? "Transported" : "" ].filter( ( item ) => item );
                            return (
                                <tr key={unit.uuid}>
                                    <td>{unit.customName ? unit.customName + " (" + unit.name + ")" : unit.name}{unit.isWrecked() ? " (destroyed)" : ""}</td>
                                    <td>{deck ? deck.name : "-"}</td>
                                    <td>{state.movePriority === null ? "" : state.movePriority}</td>
                                    <td>{state.combatPriority === null ? "" : state.combatPriority}</td>
                                    <td>{orders.join( ", " )}</td>
                                </tr>
                            );
                        } )}
                    </tbody>
                </table>
                {game.log.length > 0 ? (
                    <>
                        <h3>Log</h3>
                        <ol className="aces-print-log">{game.log.map( ( entry, index ) => <li key={index}>{entry}</li> )}</ol>
                    </>
                ) : null}
            </div>
        );
    }

    private _renderLibrary = ( library: IAcesCardLibrary ): JSX.Element => {
        const parts = this.state.parts;
        return (
            <>
                {parts.cards && library.cards.length > 0 ? (
                    <div className="aces-print-section"><h2>Aces cards</h2><div className="aces-print-grid">{library.cards.map( ( card ) => <AcesCardView key={card.id} card={card} /> )}</div></div>
                ) : null}
                {parts.commandCards && library.commandCards.length > 0 ? (
                    <div className="aces-print-section"><h2>Command cards</h2><div className="aces-print-grid">{library.commandCards.map( ( card ) => <AcesCommandCardView key={card.id} card={card} /> )}</div></div>
                ) : null}
                {parts.specialOrders && library.specialOrders.length > 0 ? (
                    <div className="aces-print-section"><h2>Special Orders</h2><div className="aces-print-grid">{library.specialOrders.map( ( order ) => <AcesSpecialOrderView key={order.id} order={order} /> )}</div></div>
                ) : null}
                {parts.scenarios && library.scenarios.length > 0 ? (
                    <div className="aces-print-section"><h2>Sorties</h2>{library.scenarios.map( ( scenario ) => <AcesScenarioView key={scenario.id} scenario={scenario} /> )}</div>
                ) : null}
            </>
        );
    }

    render = (): JSX.Element => {
        return (
            <>
                <header className="topmenu print-bar">
                    <ul className="main-menu">
                        <li><Link title="Back to the Aces Card Library" className="current" to={`${process.env.PUBLIC_URL}/alpha-strike/aces/library`}><ArrowCircleLeft /></Link></li>
                        <li><span title="Open the Print Dialog" onClick={() => window.print()} className="current"><PrintIcon /></span></li>
                    </ul>
                </header>
                <div className="aces-page aces-print">
                    <div className="aces-inline print-bar">
                        {( Object.keys( partLabels ) as TPrintPart[] ).map( ( part ) => (
                            <label key={part}>
                                <input type="checkbox" checked={this.state.parts[part]} onChange={( e ) => {
                                    const checked = e.currentTarget.checked;
                                    this.setState( { parts: { ...this.state.parts, [part]: checked } } );
                                }} /> {partLabels[part]}
                            </label>
                        ) )}
                    </div>
                    {!this.state.library ? <p>Loading...</p> : (
                        <>
                            {this.state.parts.game ? (
                                this.state.game ? this._renderGameSheet( this.state.game ) : <p className="aces-muted print-bar">No game in progress.</p>
                            ) : null}
                            {this._renderLibrary( this.state.library )}
                        </>
                    )}
                    <p className="aces-muted">Printed from Jeff's BattleTech Tools. BattleTech: Aces is published by Catalyst Game Labs; card text is the players' own entry.</p>
                </div>
            </>
        );
    }
}

interface IAcesPrintPageProps {
    appGlobals: IAppGlobals;
}

interface IAcesPrintPageState {
    library: IAcesCardLibrary | null;
    game: AcesGame | null;
    parts: { [part in TPrintPart]: boolean };
}
