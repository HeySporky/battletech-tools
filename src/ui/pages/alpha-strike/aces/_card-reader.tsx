import React, { type JSX } from 'react';
import {
    acesBehaviorLabel,
    determineAcesBehavior,
    identifyAcesCombatTarget,
    identifyAcesMovementTarget,
    IAcesCandidate,
    IAcesUnitStats,
    resolveAcesMovementFilters,
    resolveAcesMoveType,
    resolveAcesOverheat,
    shouldAcesMakePhysicalAttack,
    TAcesFilterAnswer,
    TAcesJudgements,
} from '../../../../classes/aces-engine';
import {
    acesTextToPlain,
    IAcesCard,
    IAcesCommandCard,
    IAcesPriorityRule,
    IAcesSpecialOrder,
    TAcesBehavior,
} from '../../../../data/aces-cards';
import AcesText from './_aces-text';
import { AcesCardView } from './_aces-card-view';

/*
 * Walks one automated unit's top Aces card (Aces pp.11-20). The app answers what it can from the numbers; the
 * players answer what needs the table (distances, line of sight, printed conditions) and the reader moves on.
 */

export interface IAcesReaderEnemy {
    id: string;
    name: string;
    stats: IAcesUnitStats;
    isObjective?: boolean;
}

export interface IAcesReaderUnit {
    name: string;
    isBattleMech: boolean;
    canJump: boolean;
    canIndirectFire: boolean;
    ovRating: number;
    currentHeat: number;
    fireControlHits: number;
}

interface ICandidateInput {
    distance: string;
    canAttack: boolean;
    moved: boolean;
    targetNumber: string;
    doomed: boolean;
}

const blankInput = (): ICandidateInput => ( { distance: "", canAttack: true, moved: false, targetNumber: "", doomed: false } );

const toNumber = ( value: string ): number | null => value.trim() === "" || isNaN( +value ) ? null : +value;

export default class AcesCardReader extends React.Component<IAcesCardReaderProps, IAcesCardReaderState> {
    constructor(props: IAcesCardReaderProps) {
        super(props);
        this.state = this._blankState();
    }

    private _blankState = (): IAcesCardReaderState => {
        return {
            inputs: {},
            behaviorAnswers: {},
            skip: [],
            judgements: {},
            pick: [],
            altApplies: false,
            filterAnswers: [],
            damage: "",
            destroyedThisPhase: false,
            zeroMoveFromHeat: false,
            physical: { orderedByCard: false, baseContact: false, inMeleeRange: false, physicalDamage: "", },
        };
    }

    componentDidUpdate = ( prevProps: IAcesCardReaderProps ) => {
        if( prevProps.resetKey !== this.props.resetKey ) {
            this.setState( this._blankState() );
        }
    }

    private _input = ( id: string ): ICandidateInput => this.state.inputs[id] || blankInput();

    private _setInput = ( id: string, change: Partial<ICandidateInput> ) => {
        this.setState({ inputs: { ...this.state.inputs, [id]: { ...this._input( id ), ...change } } });
    }

    private _candidates = (): IAcesCandidate[] => {
        return this.props.enemies.map( ( enemy ) => {
            const input = this._input( enemy.id );
            return {
                id: enemy.id,
                name: enemy.name,
                stats: enemy.stats,
                isObjective: enemy.isObjective,
                distance: toNumber( input.distance ),
                canAttack: input.canAttack,
                moved: input.moved,
                targetNumber: toNumber( input.targetNumber ),
                doomed: input.doomed,
            };
        } );
    }

    private _log = ( message: string ) => {
        if( this.props.onLog ) this.props.onLog( this.props.unit.name + ": " + message );
    }

    /* ----- shared pieces ----- */

    private _renderCandidates = ( combat: boolean ): JSX.Element => {
        if( this.props.enemies.length === 0 ) {
            return <p className="aces-muted">No enemy units listed. Load your own force in the Alpha Strike roster to have them here.</p>;
        }
        return (
            <table className="table tighter-padding aces-reader-candidates">
                <thead>
                    <tr>
                        <th>Enemy</th>
                        <th>Distance (")</th>
                        <th>{combat ? "In LOS and range" : "Attackable after moving"}</th>
                        {combat ? <th>TN</th> : <th>Moved</th>}
                        {combat ? <th>Already doomed</th> : null}
                    </tr>
                </thead>
                <tbody>
                    {this.props.enemies.map( ( enemy ) => {
                        const input = this._input( enemy.id );
                        return (
                            <tr key={enemy.id}>
                                <td>{enemy.name}<br /><span className="aces-muted">A {enemy.stats.armor} S {enemy.stats.structure} TMM {enemy.stats.tmm}</span></td>
                                <td><input type="number" className="aces-number" aria-label={"Distance to " + enemy.name} value={input.distance} onChange={( e ) => this._setInput( enemy.id, { distance: e.currentTarget.value } )} /></td>
                                <td><input type="checkbox" aria-label={"Can attack " + enemy.name} checked={input.canAttack} onChange={( e ) => this._setInput( enemy.id, { canAttack: e.currentTarget.checked } )} /></td>
                                {combat ? (
                                    <td><input type="number" className="aces-number" aria-label={"Target Number against " + enemy.name} value={input.targetNumber} onChange={( e ) => this._setInput( enemy.id, { targetNumber: e.currentTarget.value } )} /></td>
                                ) : (
                                    <td><input type="checkbox" aria-label={enemy.name + " moved"} checked={input.moved} onChange={( e ) => this._setInput( enemy.id, { moved: e.currentTarget.checked } )} /></td>
                                )}
                                {combat ? (
                                    <td><input type="checkbox" aria-label={enemy.name + " doomed"} checked={input.doomed} onChange={( e ) => this._setInput( enemy.id, { doomed: e.currentTarget.checked } )} /></td>
                                ) : null}
                            </tr>
                        );
                    } )}
                </tbody>
            </table>
        );
    }

    /** A judged line: the players tick which of the remaining candidates it fits. */
    private _renderJudgement = ( rule: IAcesPriorityRule, remaining: IAcesCandidate[] ): JSX.Element => {
        const selection = this.state.pick;
        return (
            <div className="aces-reader-question">
                <p><strong>Which of these match:</strong> <AcesText text={rule.text} /></p>
                <div className="aces-inline">
                    {remaining.map( ( candidate ) => (
                        <label key={candidate.id}>
                            <input
                                type="checkbox"
                                checked={selection.indexOf( candidate.id ) > -1}
                                onChange={( e ) => {
                                    const checked = e.currentTarget.checked;
                                    const next = selection.filter( ( id ) => id !== candidate.id ).concat( checked ? [ candidate.id ] : [] );
                                    this.setState({ pick: next });
                                }}
                            /> {candidate.name}
                        </label>
                    ) )}
                    <button className="btn btn-primary btn-sm" onClick={() => {
                        this.setState({ judgements: { ...this.state.judgements, [rule.text]: this.state.pick }, pick: [] });
                    }}>Answer</button>
                </div>
                <p className="aces-muted">Tick none if nobody matches; the line is then ignored.</p>
            </div>
        );
    }

    private _trace = ( lines: string[] ): JSX.Element => {
        return <ul className="aces-reader-trace">{lines.map( ( line, index ) => <li key={index}>{line}</li> )}</ul>;
    }

    /* ----- movement ----- */

    private _renderMovement = ( card: IAcesCard ): JSX.Element => {
        const specialOrder = this.props.behaviorOrder || null;
        const behavior = determineAcesBehavior( card, this.state.behaviorAnswers, {
            override: this.props.behaviorOverride || null,
            specialOrder: specialOrder,
            skip: this.state.skip,
        } );
        const out: JSX.Element[] = [];
        out.push( <div key="trace-b">{this._trace( behavior.trace )}</div> );
        if( behavior.pending ) {
            const pending = behavior.pending;
            out.push(
                <div key="behavior" className="aces-reader-question">
                    <p><strong>{acesBehaviorLabel( pending )}:</strong> <AcesText text={card[pending].condition || "(no condition printed)"} /></p>
                    <button className="btn btn-primary btn-sm" onClick={() => this.setState( { behaviorAnswers: { ...this.state.behaviorAnswers, [pending]: true } } )}>True</button>{" "}
                    <button className="btn btn-secondary btn-sm" onClick={() => this.setState( { behaviorAnswers: { ...this.state.behaviorAnswers, [pending]: false } } )}>False</button>
                </div>
            );
            return <>{out}</>;
        }
        out.push( <p key="behavior-result"><strong>Behavior: {acesBehaviorLabel( behavior.behavior )}</strong></p> );

        const target = identifyAcesMovementTarget( behavior.column, this._candidates(), this.props.commandCard, this.state.judgements );
        out.push( <div key="trace-t">{this._trace( target.trace )}</div> );
        if( target.pending ) {
            out.push( <div key="judge">{this._renderJudgement( target.pending, target.tied )}</div> );
            return <>{out}</>;
        }
        if( target.skipColumn ) {
            const current = behavior.behavior as TAcesBehavior;
            if( current === "cautious" || behavior.behavior === "forced-withdrawal" || behavior.behavior === "fleeing" ) {
                out.push( <p key="skip">No column has a valid target: the unit holds position (Ground movement).</p> );
                return <>{out}</>;
            }
            out.push(
                <p key="skip">
                    <button className="btn btn-primary btn-sm" onClick={() => this.setState( { skip: this.state.skip.concat( current ), filterAnswers: [] } )}>
                        Go to the next column
                    </button>
                </p>
            );
            return <>{out}</>;
        }
        if( target.target ) {
            out.push( <p key="target"><strong>Movement target: {target.target.name}</strong></p> );
        } else if( target.tied.length > 0 ) {
            out.push( <p key="tied">Tied: choose among {target.tied.map( ( candidate ) => candidate.name ).join( ", " )} as the golden rule says.</p> );
        }

        const moveType = resolveAcesMoveType( behavior.column, this.props.unit.canJump, this.state.altApplies );
        out.push(
            <div key="move" className="aces-inline">
                <strong>Movement: {moveType.moveType.charAt( 0 ).toUpperCase() + moveType.moveType.slice( 1 )}</strong>
                {moveType.note ? <span className="aces-muted">{moveType.note}</span> : null}
                {behavior.column.altMoveType ? (
                    <label>
                        <input type="checkbox" checked={this.state.altApplies} onChange={( e ) => this.setState( { altApplies: e.currentTarget.checked } )} />
                        {" "}Alternative applies: <AcesText text={behavior.column.altMoveWhen || behavior.column.altMoveType} />
                    </label>
                ) : null}
            </div>
        );

        const filters = resolveAcesMovementFilters( behavior.column, this.state.filterAnswers, this.props.preFilters || [] );
        out.push( <div key="trace-f">{this._trace( filters.trace )}</div> );
        if( filters.next !== null ) {
            const filter = filters.filters[filters.next];
            const answer = ( value: TAcesFilterAnswer ) => this.setState( { filterAnswers: this.state.filterAnswers.slice( 0, filters.next! ).concat( value ) } );
            out.push(
                <div key="filter" className="aces-reader-question">
                    <p><strong>Filter {filter.label}:</strong> <AcesText text={filter.text} /></p>
                    <p className="aces-muted">How many of the locations the unit can reach meet it?</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => answer( "none" )}>None</button>{" "}
                    <button className="btn btn-primary btn-sm" onClick={() => answer( "some" )}>Several</button>{" "}
                    <button className="btn btn-primary btn-sm" onClick={() => answer( "one" )}>Only one</button>
                </div>
            );
        } else if( filters.done ) {
            out.push(
                <p key="done">
                    <button className="btn btn-primary btn-sm" onClick={() => {
                        this._log( acesBehaviorLabel( behavior.behavior ) + ", " + moveType.moveType + ( target.target ? " toward " + target.target.name : "" ) + "." );
                        if( this.props.onDone ) this.props.onDone();
                    }}>Log and mark moved</button>
                </p>
            );
        }
        return <>{out}</>;
    }

    /* ----- combat ----- */

    private _renderCombat = ( card: IAcesCard ): JSX.Element => {
        const unit = this.props.unit;
        const out: JSX.Element[] = [];
        const result = identifyAcesCombatTarget( card, this._candidates(), this.props.commandCard, this.state.judgements, unit.canIndirectFire );
        out.push( <div key="trace">{this._trace( result.trace )}</div> );
        if( result.pending ) {
            out.push( <div key="judge">{this._renderJudgement( result.pending, result.tied )}</div> );
            return <>{out}</>;
        }
        const target = result.target;
        if( !target && !result.indirect ) {
            if( result.tied.length > 0 ) {
                out.push( <p key="tied">Tied: choose among {result.tied.map( ( candidate ) => candidate.name ).join( ", " )} as the golden rule says.</p> );
            }
            return <>{out}</>;
        }
        out.push( <p key="target"><strong>{result.indirect ? "Indirect fire" : "Target: " + target!.name}</strong></p> );

        const damage = toNumber( this.state.damage );
        const ov = resolveAcesOverheat( card.combat.overheat, {
            isBattleMech: unit.isBattleMech,
            ovRating: unit.ovRating,
            currentHeat: unit.currentHeat,
            targetNumber: target && typeof target.targetNumber === "number" ? target.targetNumber : 12,
            destroyedThisPhase: this.state.destroyedThisPhase,
            zeroMoveFromHeat: this.state.zeroMoveFromHeat,
            damage: damage === null ? 0 : damage,
            targetArmor: target ? target.stats.armor : 0,
            indirect: result.indirect,
        } );
        out.push(
            <div key="ov-inputs" className="aces-inline">
                <label>Damage at this range: <input type="number" className="aces-number" value={this.state.damage} onChange={( e ) => this.setState( { damage: e.currentTarget.value } )} /></label>
                <label><input type="checkbox" checked={this.state.destroyedThisPhase} onChange={( e ) => this.setState( { destroyedThisPhase: e.currentTarget.checked } )} /> Destroyed this phase</label>
                <label><input type="checkbox" checked={this.state.zeroMoveFromHeat} onChange={( e ) => this.setState( { zeroMoveFromHeat: e.currentTarget.checked } )} /> 0 Move from heat</label>
            </div>
        );
        out.push(
            <p key="ov">
                <strong>{ov.attack ? ( ov.ov > 0 ? "Attack with OV " + ov.ov : "Attack, no OV" ) : "No weapon attack"}</strong>
                {" "}<span className="aces-muted">{ov.reason}</span>
            </p>
        );

        if( target && !result.indirect ) {
            const physical = this.state.physical;
            const decision = shouldAcesMakePhysicalAttack( {
                orderedByCard: physical.orderedByCard,
                baseContact: physical.baseContact,
                inMeleeRange: physical.inMeleeRange,
                physicalDamage: toNumber( physical.physicalDamage ) || 0,
                weaponDamage: ( damage || 0 ) + ov.ov,
                fireControlHits: unit.fireControlHits,
                heat: unit.currentHeat,
            } );
            const set = ( change: Partial<IAcesCardReaderState["physical"]> ) => this.setState( { physical: { ...physical, ...change } } );
            out.push(
                <div key="physical" className="aces-inline">
                    <label><input type="checkbox" checked={physical.orderedByCard} onChange={( e ) => set( { orderedByCard: e.currentTarget.checked } )} /> Card or sortie calls for a physical attack</label>
                    <label><input type="checkbox" checked={physical.baseContact} onChange={( e ) => set( { baseContact: e.currentTarget.checked } )} /> Base contact</label>
                    <label><input type="checkbox" checked={physical.inMeleeRange} onChange={( e ) => set( { inMeleeRange: e.currentTarget.checked } )} /> In melee range</label>
                    {physical.inMeleeRange ? <label>Physical damage: <input type="number" className="aces-number" value={physical.physicalDamage} onChange={( e ) => set( { physicalDamage: e.currentTarget.value } )} /></label> : null}
                    <strong>{decision.physical ? "Physical attack" : "Weapon attack"}</strong> <span className="aces-muted">{decision.reason}</span>
                </div>
            );
        }
        out.push(
            <p key="done">
                <button className="btn btn-primary btn-sm" onClick={() => {
                    this._log( ( result.indirect ? "indirect fire" : "attacks " + target!.name ) + ( ov.ov > 0 ? " with OV " + ov.ov : "" ) + ". " + ov.reason );
                    if( this.props.onDone ) this.props.onDone();
                }}>{ov.attack ? "Log attack, cycle card" : "Log, cycle card"}</button>
            </p>
        );
        return <>{out}</>;
    }

    render = (): JSX.Element => {
        const card = this.props.card;
        if( !card ) {
            return (
                <div className="aces-reader">
                    <p className="aces-muted">
                        No card from your library is on top of this unit's deck. Read the paper card, or enter the
                        deck's cards in the Card Library and deal from it.
                    </p>
                </div>
            );
        }
        return (
            <div className="aces-reader">
                <h4>{this.props.unit.name}: {this.props.phase === "movement" ? "Movement" : "Combat"}</h4>
                {this.props.phase === "movement" && this.props.preFilters && this.props.preFilters.length > 0 ? (
                    <p className="aces-muted">Movement Objective filters come first: {this.props.preFilters.map( acesTextToPlain ).join( "; " )}</p>
                ) : null}
                {this._renderCandidates( this.props.phase === "combat" )}
                {this.props.phase === "movement" ? this._renderMovement( card ) : this._renderCombat( card )}
                <button className="btn btn-secondary btn-sm" onClick={() => this.setState( this._blankState() )}>Start over</button>
                <details>
                    <summary>Show the card</summary>
                    <AcesCardView card={card} />
                </details>
            </div>
        );
    }
}

interface IAcesCardReaderProps {
    phase: "movement" | "combat";
    card: IAcesCard | null;
    commandCard: IAcesCommandCard | null;
    unit: IAcesReaderUnit;
    enemies: IAcesReaderEnemy[];
    /** Forced Withdrawal or Fleeing Special Order card whose column replaces the Aces card's. */
    behaviorOrder?: IAcesSpecialOrder | null;
    /** Behavior forced by a Command card order. */
    behaviorOverride?: TAcesBehavior | null;
    /** Movement Objective filters (0a, 0b ...). */
    preFilters?: string[];
    /** Changing it clears the answers (new unit or new card). */
    resetKey: string;
    onLog?: ( message: string ) => void;
    onDone?: () => void;
}

interface IAcesCardReaderState {
    inputs: { [enemyId: string]: ICandidateInput };
    behaviorAnswers: { aggressive?: boolean | null, balanced?: boolean | null };
    skip: TAcesBehavior[];
    judgements: TAcesJudgements;
    /** Candidates ticked for the judged line being asked. */
    pick: string[];
    altApplies: boolean;
    filterAnswers: TAcesFilterAnswer[];
    damage: string;
    destroyedThisPhase: boolean;
    zeroMoveFromHeat: boolean;
    physical: { orderedByCard: boolean, baseContact: boolean, inMeleeRange: boolean, physicalDamage: string };
}
