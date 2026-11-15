import React, { type JSX } from 'react';
import { IAcesGameSupportCard } from '../../../../classes/aces-game';

interface IAcesSupportCardsProps {
    cards: IAcesGameSupportCard[];
    /** The most cards the Command card lets the automated force spend at once; null when it names none. */
    limit: number | null;
    onlyIfStructure: boolean;
    onSpend: ( ids: string[] ) => { ok: boolean; reason: string } | void;
    onAdd: ( name: string ) => void;
    onRemove: ( id: string ) => void;
}

interface IAcesSupportCardsState {
    ticked: string[];
    newName: string;
    message: string;
}

/** The Battlefield Support cards the automated force holds: pick which to spend, up to the Command card's limit. */
export default class AcesSupportCards extends React.Component<IAcesSupportCardsProps, IAcesSupportCardsState> {
    public state: IAcesSupportCardsState = { ticked: [], newName: "", message: "" };

    private _toggle = ( id: string, on: boolean ) => {
        this.setState( { ticked: on ? this.state.ticked.concat( [ id ] ) : this.state.ticked.filter( ( entry ) => entry !== id ), message: "" } );
    }

    private _spend = () => {
        const result = this.props.onSpend( this.state.ticked );
        if( result && !result.ok ) {
            this.setState( { message: result.reason } );
        } else {
            this.setState( { ticked: [], message: "" } );
        }
    }

    private _add = () => {
        const name = this.state.newName.trim();
        if( !name ) return;
        this.props.onAdd( name );
        this.setState( { newName: "" } );
    }

    public render(): JSX.Element {
        const { cards, limit, onlyIfStructure } = this.props;
        const inHand = cards.filter( ( card ) => card.spentTurn === null );
        const spent = cards.filter( ( card ) => card.spentTurn !== null );
        const ticked = this.state.ticked.filter( ( id ) => inHand.some( ( card ) => card.id === id ) );
        const full = limit !== null && ticked.length >= limit;
        return (
            <div className="aces-support-cards">
                <h4>Battlefield Support cards</h4>
                {onlyIfStructure ? <p>Battlefield Support is only spent when its damage gets through the target's armor.</p> : null}
                {limit !== null ? <p className="aces-muted">Spend up to {limit} this turn.</p> : null}
                {inHand.length > 0 ? (
                    <ul className="list-unstyled">
                        {inHand.map( ( card ) => {
                            const isTicked = ticked.indexOf( card.id ) > -1;
                            return (
                                <li key={card.id}>
                                    <label>
                                        <input type="checkbox" checked={isTicked} disabled={full && !isTicked} onChange={( e ) => this._toggle( card.id, e.currentTarget.checked )} />
                                        {" "}{card.name}
                                    </label>{" "}
                                    <button className="btn btn-link btn-sm" aria-label={"Remove " + card.name} onClick={() => this.props.onRemove( card.id )}>Remove</button>
                                </li>
                            );
                        } )}
                    </ul>
                ) : <p className="aces-muted">No unspent cards.</p>}
                <p>
                    <button className="btn btn-primary btn-sm" disabled={ticked.length === 0} onClick={this._spend}>Spend selected</button>
                </p>
                {this.state.message ? <p role="alert" className="text-danger">{this.state.message}</p> : null}
                {spent.length > 0 ? (
                    <ul className="list-unstyled aces-muted">
                        {spent.map( ( card ) => (
                            <li key={card.id}>
                                <span>{card.name} (spent turn {card.spentTurn})</span>{" "}
                                <button className="btn btn-link btn-sm" aria-label={"Remove " + card.name} onClick={() => this.props.onRemove( card.id )}>Remove</button>
                            </li>
                        ) )}
                    </ul>
                ) : null}
                <p>
                    <label>
                        Card name{" "}
                        <input type="text" value={this.state.newName} onChange={( e ) => this.setState( { newName: e.currentTarget.value } )} onKeyDown={( e ) => { if( e.key === "Enter" ) this._add(); }} />
                    </label>{" "}
                    <button className="btn btn-secondary btn-sm" onClick={this._add}>Add card</button>
                </p>
            </div>
        );
    }
}
