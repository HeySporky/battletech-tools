import React, { useState, type JSX } from 'react';
import { Campaign } from '../../../../classes/campaign/campaign';
import { QUALITIES, QUALITY_LABELS, Quality } from '../../../../classes/campaign/unit-campaign';
import {
    IMh1987Line, IMh1987State, IMh1987Terms, Mh1987Area, Mh1987CampaignMission, Mh1987Condition, Mh1987Mission,
    Mh1987Overhead, Mh1987SquadType, MH1987_AREAS, MH1987_AREA_LABELS, MH1987_CATEGORY_MISSIONS,
    MH1987_COMMAND_LABELS, MH1987_EMPLOYER_POSITION, MH1987_GUARANTEE_LABELS, MH1987_MISSION_LABELS,
    MH1987_SALVAGE_LABELS, MH1987_TYPES, MH1987_TYPE_IDS, mh1987ContractTerms, mh1987MissionCategory,
    mh1987MonthlyCosts, mh1987Morale, mh1987Negotiate, mh1987NegotiationPool, mh1987ReadState, mh1987Reputation,
    mh1987EndContract, mh1987ResolveMonth, mh1987SignContract, IMh1987NegotiationStep,
} from '../../../../data/campaign-editions/mercenarys-handbook-1987';
import { generateUUID } from '../../../../utils/generateUUID';
import { campaignRoll, formatMoney } from './campaign-store';

const MISSIONS = Object.keys( MH1987_MISSION_LABELS ) as Mh1987Mission[];
const CONDITIONS: Mh1987Condition[] = ["new", "salvaged", "destroyed"];
const OVERHEADS: Mh1987Overhead[] = [5, 10, 15, 20];
const SOURCE = "Mercenary's Handbook (FASA 1616, 1987)";

const numberOr = ( value: string, fallback: number ): number => {
    const n = Number( value );
    return isFinite( n ) ? n : fallback;
};

/** The Mercenary's Handbook (1987) edition: the unit's roster and monthly costs, contract negotiation, the Basic Campaign System. */
export default function EditionMh1987( props: { campaign: Campaign; update: ( change: ( c: Campaign ) => void ) => void } ): JSX.Element {
    const state = mh1987ReadState( props.campaign.editionState );
    const [mission, setMission] = useState<Mh1987Mission>( "garrison" );
    const [judgedFailed, setJudgedFailed] = useState( false );
    const [employer, setEmployer] = useState<Record<Mh1987Area, number>>( () => Object.fromEntries( MH1987_AREAS.map( ( a ) => [a, 50] ) ) as Record<Mh1987Area, number> );
    const [player, setPlayer] = useState<Record<Mh1987Area, number>>( () => Object.fromEntries( MH1987_AREAS.map( ( a ) => [a, 50] ) ) as Record<Mh1987Area, number> );
    const [order, setOrder] = useState<Mh1987Area[]>( MH1987_AREAS );
    const [negotiator, setNegotiator] = useState( 0 );
    const [agent, setAgent] = useState( 0 );
    const [deal, setDeal] = useState<{ terms: IMh1987Terms; steps: IMh1987NegotiationStep[]; poolLeft: number } | null>( null );
    const [advancePct, setAdvancePct] = useState( 25 );
    const [transportFee, setTransportFee] = useState( 0 );
    const [result, setResult] = useState( "" );

    const change = ( edit: ( s: IMh1987State, c: Campaign ) => void ) => props.update( ( c ) => {
        const s = mh1987ReadState( c.editionState );
        edit( s, c );
        c.editionState = s;
    } );
    const editLine = ( id: string, patch: Partial<IMh1987Line> ) => change( ( s ) => {
        s.roster = s.roster.map( ( l ) => ( l.id === id ? { ...l, ...patch } : l ) );
    } );

    const costs = mh1987MonthlyCosts( state );
    const reputation = mh1987Reputation( state.roster ) + state.reputationMod;
    const morale = mh1987Morale( state );
    const pool = mh1987NegotiationPool( reputation, negotiator, agent );
    const contract = state.contract && !state.contract.completed ? state.contract : null;
    const companies = Array.from( new Set( state.roster.filter( ( l ) => l.count > 0 && !( MH1987_TYPES[l.type] as { ship?: boolean } ).ship ).map( ( l ) => l.company ) ) );

    const rollMission = () => {
        const n = 1 + Math.floor( Math.random() * 100 );
        const options = MH1987_CATEGORY_MISSIONS[mh1987MissionCategory( n )];
        setMission( options[Math.floor( Math.random() * options.length )] );
    };
    const rollEmployer = () => setEmployer( Object.fromEntries( MH1987_AREAS.map( ( a ) => [a, MH1987_EMPLOYER_POSITION[campaignRoll.twoD6()]] ) ) as Record<Mh1987Area, number> );
    const move = ( index: number ) => setOrder( ( o ) => {
        const next = [...o];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        return next;
    } );
    const negotiate = () => {
        const settled = mh1987Negotiate( { employer, player, pool, order } );
        setDeal( { terms: mh1987ContractTerms( settled.final as Record<Mh1987Area, number>, mission ), steps: settled.steps, poolLeft: settled.poolLeft } );
    };
    const sign = () => {
        if( !deal ) return;
        const terms = deal.terms;
        props.update( ( c ) => {
            mh1987SignContract( c, mh1987ReadState( c.editionState ), { mission, terms, advancePct, transportFee, roll: campaignRoll } );
        } );
        setDeal( null );
    };
    const resolve = () => {
        if( !contract || contract.mission === "retainer" || contract.resolvedStep === props.campaign.step ) return;
        // The tables add the Morale Level as a whole number: Green 1, Regular 2, Veteran 3, Elite 4.
        const level = QUALITIES.indexOf( morale.label.toLowerCase() as Quality ) + 1;
        const month = mh1987ResolveMonth( contract.mission as Mh1987CampaignMission, level, companies.length ? companies : ["Company 1"], campaignRoll );
        const losses = month.companies.filter( ( r ) => r.salvagedSquads || r.destroyedSquads )
            .map( ( r ) => `${r.company}: ${r.salvagedSquads} salvaged, ${r.destroyedSquads} destroyed` ).join( "; " );
        const text = `${MH1987_MISSION_LABELS[contract.mission]}: resistance ${month.resistance}, outcome ${month.code} (${month.outcome.result}); `
            + `reputation ${month.reputationChange >= 0 ? "+" : ""}${month.reputationChange}, morale ${month.moraleChange >= 0 ? "+" : ""}${month.moraleChange}`
            + `${losses ? `; ${losses}` : "; no squads lost"}${month.plunder ? `; plunder ${formatMoney( month.plunder )}` : ""}`;
        // update() runs the change at once, so `booked` says whether the newest copy took it.
        let booked = false;
        change( ( s, c ) => {
            if( !s.contract || s.contract.resolvedStep === c.step ) return;
            booked = true;
            s.contract.resolvedStep = c.step;
            s.reputationMod += month.reputationChange;
            s.moraleMod += month.moraleChange;
            const sideId = c.sides.some( ( side ) => side.id === s.sideId ) ? s.sideId! : c.sides[0]?.id;
            if( sideId && month.plunder ) c.addLedger( { sideId, step: c.step, amount: month.plunder, currency: c.currency, reason: "Plunder", rule: `${SOURCE} p.50` } );
            c.addLog( text );
        } );
        setResult( booked ? text + ( losses ? ". Mark the lost squads on the roster." : "." ) : "This month was already resolved." );
    };

    return (
        <div data-testid="edition-mh1987">
            <p>
                <label>
                    Unit side{" "}
                    <select value={state.sideId ?? props.campaign.sides[0]?.id ?? ""} onChange={( e ) => { const id = e.currentTarget.value; change( ( s ) => { s.sideId = id; } ); }}>
                        {props.campaign.sides.map( ( s ) => <option key={s.id} value={s.id}>{s.name}</option> )}
                    </select>
                </label>{" "}
                <label>
                    Overhead{" "}
                    <select value={state.overheadPct} onChange={( e ) => { const pct = Number( e.currentTarget.value ) as Mh1987Overhead; change( ( s ) => { s.overheadPct = pct; } ); }}>
                        {OVERHEADS.map( ( pct ) => <option key={pct} value={pct}>{pct}%</option> )}
                    </select>
                </label>
            </p>

            <h4>Roster</h4>
            {state.roster.length === 0 ? <p className="smaller-text">No squads yet.</p> : (
                <table className="campaign-table">
                    <thead><tr><th>Type</th><th>Quality</th><th>Condition</th><th>Count</th><th>Company</th><th></th></tr></thead>
                    <tbody>
                        {state.roster.map( ( line, index ) => (
                            <tr key={line.id} data-testid={"mh1987-line-" + index}>
                                <td><select aria-label="Type" value={line.type} onChange={( e ) => editLine( line.id, { type: e.currentTarget.value as Mh1987SquadType } )}>
                                    {MH1987_TYPE_IDS.map( ( t ) => <option key={t} value={t}>{MH1987_TYPES[t].name}</option> )}
                                </select></td>
                                <td><select aria-label="Quality" value={line.quality} onChange={( e ) => editLine( line.id, { quality: e.currentTarget.value as Quality } )}>
                                    {QUALITIES.map( ( q ) => <option key={q} value={q}>{QUALITY_LABELS[q]}</option> )}
                                </select></td>
                                <td><select aria-label="Condition" value={line.condition} onChange={( e ) => editLine( line.id, { condition: e.currentTarget.value as Mh1987Condition } )}>
                                    {CONDITIONS.map( ( k ) => <option key={k} value={k}>{k}</option> )}
                                </select></td>
                                <td><input type="number" aria-label="Count" min={0} value={line.count} onChange={( e ) => editLine( line.id, { count: Math.max( 0, Math.round( numberOr( e.currentTarget.value, 0 ) ) ) } )} /></td>
                                <td><input type="text" aria-label="Company" value={line.company} onChange={( e ) => editLine( line.id, { company: e.currentTarget.value } )} /></td>
                                <td><button type="button" className="btn btn-danger btn-sm" onClick={() => change( ( s ) => { s.roster = s.roster.filter( ( l ) => l.id !== line.id ); } )}>Remove</button></td>
                            </tr>
                        ) )}
                    </tbody>
                </table>
            )}
            <p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => change( ( s ) => {
                    s.roster = s.roster.concat( { id: generateUUID(), type: "medium-mech", quality: "regular", condition: "new", count: 1, company: s.roster[s.roster.length - 1]?.company ?? "Company 1" } );
                } )}>Add squads</button>
            </p>

            <p data-testid="mh1987-costs">
                Each month: salaries {formatMoney( costs.salaries )}, supplies {formatMoney( costs.supplies )} ({costs.squads} squads),
                overhead {formatMoney( costs.overhead )}, maintenance {costs.maintenanceSP} SP less {costs.supportSP} SP of support
                = {formatMoney( costs.maintenanceCost )}. Total <strong>{formatMoney( costs.total )}</strong> C-bills.
            </p>
            <p>
                Reputation <strong>{reputation}</strong>, morale <strong>{morale.label}</strong> ({morale.level}).{" "}
                <label>Reputation changes <input type="number" aria-label="Reputation changes" value={state.reputationMod} onChange={( e ) => { const v = Math.round( numberOr( e.currentTarget.value, 0 ) ); change( ( s ) => { s.reputationMod = v; } ); }} /></label>{" "}
                <label>Morale changes <input type="number" aria-label="Morale changes" value={state.moraleMod} onChange={( e ) => { const v = Math.round( numberOr( e.currentTarget.value, 0 ) ); change( ( s ) => { s.moraleMod = v; } ); }} /></label>
            </p>

            {contract ? (
                <div>
                    <h4>Contract</h4>
                    <p>
                        {MH1987_MISSION_LABELS[contract.mission]}, {contract.terms.months} months from month {contract.startStep},
                        {" "}{contract.squads} squads at {formatMoney( contract.terms.ratePerSquadWeek )} a squad a week: {formatMoney( contract.total )} C-bills,
                        {" "}{formatMoney( contract.paid )} paid. {MH1987_GUARANTEE_LABELS[contract.terms.guarantee]}, {MH1987_COMMAND_LABELS[contract.terms.command]},
                        {" "}supply fee x{contract.terms.supplyModifier}, {MH1987_SALVAGE_LABELS[contract.terms.salvage]}.
                    </p>
                    {contract.mission !== "retainer" ? <p><button type="button" className="btn btn-primary btn-sm" onClick={resolve} disabled={contract.resolvedStep === props.campaign.step}>Resolve month</button>
                        {contract.resolvedStep === props.campaign.step ? <span className="smaller-text"> This month is resolved; advance a month to resolve the next.</span> : null}</p> : null}
                    {result ? <p className="smaller-text">{result}</p> : null}
                    <p>
                        {contract.terms.guarantee === "comstar" ? (
                            <label><input type="checkbox" aria-label="ComStar judged it unfulfilled" checked={judgedFailed}
                                onChange={( e ) => setJudgedFailed( e.currentTarget.checked )} /> ComStar judged it unfulfilled (the advance is repaid)</label>
                        ) : null}{" "}
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => {
                            props.update( ( c ) => mh1987EndContract( c, { judgedFailed } ) );
                            setJudgedFailed( false );
                        }}>End contract early</button>
                        <span className="smaller-text"> What was paid is kept; the rest is not paid.</span>
                    </p>
                </div>
            ) : (
                <div>
                    <h4>New contract</h4>
                    <p>
                        <label>
                            Mission{" "}
                            <select value={mission} onChange={( e ) => setMission( e.currentTarget.value as Mh1987Mission )}>
                                {MISSIONS.map( ( m ) => <option key={m} value={m}>{MH1987_MISSION_LABELS[m]}</option> )}
                            </select>
                        </label>{" "}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={rollMission}>Roll mission</button>{" "}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={rollEmployer}>Roll employer positions</button>
                    </p>
                    <p>
                        <label>Negotiator's Diplomacy <input type="number" aria-label="Negotiator's Diplomacy" min={0} value={negotiator} onChange={( e ) => setNegotiator( Math.max( 0, Math.round( numberOr( e.currentTarget.value, 0 ) ) ) )} /></label>{" "}
                        <label>Agent's Diplomacy <input type="number" aria-label="Agent's Diplomacy" min={0} value={agent} onChange={( e ) => setAgent( Math.max( 0, Math.round( numberOr( e.currentTarget.value, 0 ) ) ) )} /></label>{" "}
                        Pool: <strong>{pool}</strong>
                    </p>
                    <table className="campaign-table">
                        <thead><tr><th>Order</th><th>Area</th><th>Employer</th><th>Player</th></tr></thead>
                        <tbody>
                            {order.map( ( area, index ) => (
                                <tr key={area}>
                                    <td>{index + 1} {index > 0 ? <button type="button" className="btn btn-link btn-sm" aria-label={"Move " + MH1987_AREA_LABELS[area] + " up"} onClick={() => move( index )}>Up</button> : null}</td>
                                    <td>{MH1987_AREA_LABELS[area]}</td>
                                    <td><input type="number" aria-label={"Employer " + MH1987_AREA_LABELS[area]} min={1} max={100} value={employer[area]} onChange={( e ) => { const v = numberOr( e.currentTarget.value, 50 ); setEmployer( ( p ) => ( { ...p, [area]: v } ) ); }} /></td>
                                    <td><input type="number" aria-label={"Player " + MH1987_AREA_LABELS[area]} min={1} max={100} value={player[area]} onChange={( e ) => { const v = numberOr( e.currentTarget.value, 50 ); setPlayer( ( p ) => ( { ...p, [area]: v } ) ); }} /></td>
                                </tr>
                            ) )}
                        </tbody>
                    </table>
                    <p><button type="button" className="btn btn-secondary btn-sm" onClick={negotiate}>Negotiate</button></p>
                    {deal ? (
                        <div>
                            <p className="smaller-text">
                                {deal.steps.map( ( s ) => `${MH1987_AREA_LABELS[s.area]} ${s.final}${s.gained ? ` (+${s.gained} to the pool)` : s.spent ? ` (${s.spent} spent)` : ""}` ).join( "; " )}. Pool left {deal.poolLeft}.
                            </p>
                            <p>
                                {MH1987_MISSION_LABELS[mission]}: {deal.terms.months} months at {formatMoney( deal.terms.ratePerSquadWeek )} a squad a week,
                                {" "}{MH1987_GUARANTEE_LABELS[deal.terms.guarantee]}, {MH1987_COMMAND_LABELS[deal.terms.command]},
                                {" "}transport x{deal.terms.transportModifier}, supply x{deal.terms.supplyModifier}, {MH1987_SALVAGE_LABELS[deal.terms.salvage]}.
                            </p>
                            <p>
                                {deal.terms.guarantee === "advance-completion" || deal.terms.guarantee === "comstar" ? (
                                    <label>Advance % <input type="number" aria-label="Advance %" min={0} max={deal.terms.guarantee === "comstar" ? 25 : 100} value={advancePct} onChange={( e ) => setAdvancePct( numberOr( e.currentTarget.value, 0 ) )} /></label>
                                ) : null}{" "}
                                <label>Transport cost <input type="number" aria-label="Transport cost" min={0} value={transportFee} onChange={( e ) => setTransportFee( Math.max( 0, numberOr( e.currentTarget.value, 0 ) ) )} /></label>{" "}
                                <button type="button" className="btn btn-primary btn-sm" onClick={sign}>Sign contract</button>
                            </p>
                        </div>
                    ) : null}
                </div>
            )}
            <p className="smaller-text">
                {SOURCE}: Cost of Living, Creating Contracts and the Basic Campaign System. The Advanced Campaign System is not built yet.
            </p>
            <p className="smaller-text" data-testid="mh1987-readings">
                Readings: where the book leaves a rule open, NGCFells decided how to read it. Inspired by {SOURCE}, not printed
                there: remuneration is paid a squad a week, four weeks to the month; DropShips and JumpShips are crews, so they
                pay no supplies and count for no reputation, morale or contract squads; airmobile infantry maintenance
                (&quot;Airmobile +4&quot;) is 5 SP a squad; a force with no row on a mission&apos;s outcome table reads the nearest
                printed row; morale enters those tables as its band, Green 1 to Elite 4; a destroyed squad keeps its people
                (salary, supplies and morale) but makes no support points, counts for no reputation and is not hired.
            </p>
        </div>
    );
}
