import React, { useState, type JSX } from 'react';
import { Campaign } from '../../../../classes/campaign/campaign';
import { QUALITIES, QUALITY_LABELS, Quality, rangeLookup } from '../../../../classes/campaign/unit-campaign';
import {
    IMh3055Person, IMh3055RatingInputs, IMh3055State, IMh3055Unit, Mh3055Employer, Mh3055Mission, Mh3055Position,
    MH3055_CORPORATIONS, MH3055_EMPLOYER_NAMES, MH3055_MERCENARY_EMPLOYERS, MH3055_MINOR_PERIPHERY, MH3055_MISSIONS,
    MH3055_MISSION_NAMES, MH3055_RATING_PAY, MH3055_SALARIES, MH3055_TEMPLATES, mh3055BattleLoss, mh3055ContractMonths, mh3055ContractOffers,
    Mh3055ContractEnd, mh3055ContractPay, mh3055DragoonsRating, mh3055EndContract, mh3055EmployerMultiplier, mh3055EmployerRoll, mh3055JobRoll,
    mh3055Maintenance, mh3055MinorPowerRoll, mh3055Payroll, mh3055ReadState, mh3055Salvage, mh3055SignContract,
    mh3055StraightSupport, mh3055SupportPoints, mh3055Transport, mh3055WeeklyOverhead,
} from '../../../../data/campaign-editions/mercenarys-handbook-3055';
import { generateUUID } from '../../../../utils/generateUUID';
import { campaignRoll, formatMoney } from './campaign-store';

const SOURCE = "Mercenary's Handbook 3055 (FASA 1670, 1993)";
const EMPLOYERS = Object.keys( MH3055_EMPLOYER_NAMES ) as Mh3055Employer[];
const MISSIONS = Object.keys( MH3055_MISSION_NAMES ) as Mh3055Mission[];
const POSITIONS = Object.keys( MH3055_SALARIES ) as Mh3055Position[];
const TEMPLATE_IDS = Object.keys( MH3055_TEMPLATES );

const POSITION_LABELS: Record<Mh3055Position, string> = {
    mechwarrior: "MechWarrior", aerospace: "Aerospace pilot", armor: "Armor crew", infantry: "Infantry", scout: "Scout",
    artillery: "Artillery crew", technician: "Technician", engineer: "Engineer", mechanic: "Mechanic", medic: "Medic",
    specialist: "Specialist", c3: "C3 (communications)", administration: "Administration",
};

const SALVAGE_LABELS = { none: "no salvage rights", exchange: "exchange salvage", full: "full salvage rights" };

const numberOr = ( value: string, fallback: number ): number => {
    const n = Number( value );
    return isFinite( n ) ? n : fallback;
};
const whole = ( value: string ): number => Math.max( 0, Math.round( numberOr( value, 0 ) ) );

type EndKind = "lost" | "uncompleted" | "guilty" | "cleared";
interface ITerms { support: number; battleLoss: number; transport: number; commercial: number; salvage: keyof typeof SALVAGE_LABELS }

/** The Mercenary's Handbook 3055 edition: combatants and personnel, the Dragoons Rating, and contracts. */
export default function EditionMh3055( props: { campaign: Campaign; update: ( change: ( c: Campaign ) => void ) => void } ): JSX.Element {
    const state = mh3055ReadState( props.campaign.editionState );
    const [employer, setEmployer] = useState<Mh3055Employer>( "fedcom" );
    const [employerDetail, setEmployerDetail] = useState( "" );
    const [corporationRoll, setCorporationRoll] = useState( 7 );
    const [mission, setMissionRaw] = useState<Mh3055Mission>( "garrison" );
    const [jobNote, setJobNote] = useState( "" );
    const [vsClans, setVsClans] = useState( false );
    const [months, setMonths] = useState( MH3055_MISSIONS.garrison.minMonths );
    const [bonuses, setBonuses] = useState( 0 );
    const [advancePct, setAdvancePct] = useState( 25 );
    const [upFront, setUpFront] = useState( false );
    const [offers, setOffers] = useState<number | null>( null );
    const [endKind, setEndKind] = useState<EndKind>( "lost" );
    const [hearingModifier, setHearingModifier] = useState( 0 );
    const [terms, setTerms] = useState<ITerms | null>( null );

    const change = ( edit: ( s: IMh3055State, c: Campaign ) => void ) => props.update( ( c ) => {
        const s = mh3055ReadState( c.editionState );
        edit( s, c );
        c.editionState = s;
    } );
    const editUnit = ( id: string, patch: Partial<IMh3055Unit> ) => change( ( s ) => {
        s.roster = s.roster.map( ( l ) => ( l.id === id ? { ...l, ...patch } : l ) );
    } );
    const editPerson = ( id: string, patch: Partial<IMh3055Person> ) => change( ( s ) => {
        s.personnel = s.personnel.map( ( l ) => ( l.id === id ? { ...l, ...patch } : l ) );
    } );
    const editRating = ( patch: Partial<IMh3055RatingInputs> ) => change( ( s ) => { s.rating = { ...s.rating, ...patch }; } );

    const setMission = ( m: Mh3055Mission ) => {
        setMissionRaw( m );
        setMonths( MH3055_MISSIONS[m].minMonths );
    };

    const payroll = mh3055Payroll( state.personnel );
    const needed = mh3055Maintenance( state.roster );
    const generated = mh3055SupportPoints( state.personnel );
    const dragoons = mh3055DragoonsRating( state.rating );
    const employerMultiplier = mh3055EmployerMultiplier( employer, corporationRoll );
    const pay = mh3055ContractPay( { biweeklyPayroll: payroll, rating: dragoons.rating, employerMultiplier, mission, vsClans,
        months: mh3055ContractMonths( mission, months ), bonuses } );
    const contract = state.contract && !state.contract.completed ? state.contract : null;

    const rollEmployer = () => {
        const first = mh3055EmployerRoll( campaignRoll.twoD6() );
        let picked: Mh3055Employer;
        let detail = "";
        if( first === "minor-power" ) {
            picked = mh3055MinorPowerRoll( campaignRoll.twoD6() );
        } else {
            picked = first;
        }
        if( picked === "corporation" ) {
            const name = MH3055_CORPORATIONS[campaignRoll.twoD6() - 2];
            const payRoll = campaignRoll.twoD6();
            setCorporationRoll( payRoll );
            detail = `${name}, pay roll ${payRoll}`;
        } else if( picked === "minor-periphery" ) {
            detail = MH3055_MINOR_PERIPHERY[campaignRoll.d6() - 1];
        } else if( picked === "mercenary" ) {
            detail = rangeLookup( MH3055_MERCENARY_EMPLOYERS, campaignRoll.twoD6() );
        }
        setEmployer( picked );
        setEmployerDetail( detail );
    };
    const rollJob = () => {
        let found = mh3055JobRoll( employer, campaignRoll.twoD6() );
        let note = "";
        if( found.special ) {
            found = mh3055JobRoll( "special", campaignRoll.twoD6() );
            note = "Special Job Table. ";
        }
        if( found.missions.length > 0 ) setMission( found.missions[0] );
        setVsClans( found.target === "clans" );
        if( found.missions.length > 1 ) note += `Choose ${found.missions.map( ( m ) => MH3055_MISSION_NAMES[m] ).join( " or " )}. `;
        if( found.target ) note += `Target: ${found.target === "clans" ? "the Clans" : found.target === "periphery" ? "the Periphery" : "a Successor State"}. `;
        if( found.supporting ) note += "Supporting another mercenary unit's assault. ";
        setJobNote( note.trim() );
    };
    const rollTerms = () => setTerms( {
        support: mh3055StraightSupport( campaignRoll.twoD6(), dragoons.rating, employer ),
        battleLoss: mh3055BattleLoss( campaignRoll.twoD6(), dragoons.rating, employer ),
        transport: mh3055Transport( campaignRoll.d6(), "ships" ),
        commercial: mh3055Transport( campaignRoll.d6(), "commercial" ),
        salvage: mh3055Salvage( campaignRoll.twoD6(), employer, vsClans ),
    } );
    const sign = () => props.update( ( c ) => {
        mh3055SignContract( c, mh3055ReadState( c.editionState ), { employer, mission, vsClans, months,
            employerMultiplier, bonuses, advancePct, upFront } );
    } );

    const r = state.rating;
    const ratingNumber = ( key: keyof IMh3055RatingInputs, label: string ) => (
        <label>{label} <input type="number" aria-label={label} min={0} value={r[key] as number} onChange={( e ) => { const v = whole( e.currentTarget.value ); editRating( { [key]: v } ); }} /></label>
    );

    return (
        <div data-testid="edition-mh3055">
            <p>
                <label>
                    Unit side{" "}
                    <select value={state.sideId ?? props.campaign.sides[0]?.id ?? ""} onChange={( e ) => { const id = e.currentTarget.value; change( ( s ) => { s.sideId = id; } ); }}>
                        {props.campaign.sides.map( ( s ) => <option key={s.id} value={s.id}>{s.name}</option> )}
                    </select>
                </label>
            </p>

            <h4>Combatants</h4>
            {state.roster.length === 0 ? <p className="smaller-text">No combatants yet.</p> : (
                <table className="campaign-table">
                    <thead><tr><th>Template</th><th>Quality</th><th>Count</th><th>Support</th><th></th></tr></thead>
                    <tbody>
                        {state.roster.map( ( line, index ) => (
                            <tr key={line.id} data-testid={"mh3055-unit-" + index}>
                                <td><select aria-label="Template" value={line.template} onChange={( e ) => editUnit( line.id, { template: e.currentTarget.value } )}>
                                    {TEMPLATE_IDS.map( ( t ) => <option key={t} value={t}>{MH3055_TEMPLATES[t].name}</option> )}
                                </select></td>
                                <td><select aria-label="Quality" value={line.quality} onChange={( e ) => editUnit( line.id, { quality: e.currentTarget.value as Quality } )}>
                                    {QUALITIES.map( ( q ) => <option key={q} value={q}>{QUALITY_LABELS[q]}</option> )}
                                </select></td>
                                <td><input type="number" aria-label="Count" min={0} value={line.count} onChange={( e ) => editUnit( line.id, { count: whole( e.currentTarget.value ) } )} /></td>
                                <td>{formatMoney( line.count * MH3055_TEMPLATES[line.template].support )} SP</td>
                                <td><button type="button" className="btn btn-danger btn-sm" onClick={() => change( ( s ) => { s.roster = s.roster.filter( ( l ) => l.id !== line.id ); } )}>Remove</button></td>
                            </tr>
                        ) )}
                    </tbody>
                </table>
            )}
            <p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => change( ( s ) => {
                    s.roster = s.roster.concat( { id: generateUUID(), template: "medium-mech", quality: "regular", count: 1 } );
                } )}>Add combatants</button>
            </p>

            <h4>Personnel</h4>
            {state.personnel.length === 0 ? <p className="smaller-text">No personnel yet.</p> : (
                <table className="campaign-table">
                    <thead><tr><th>Position</th><th>Experience</th><th>Count</th><th>Anti-'Mech</th><th></th></tr></thead>
                    <tbody>
                        {state.personnel.map( ( line, index ) => (
                            <tr key={line.id} data-testid={"mh3055-person-" + index}>
                                <td><select aria-label="Position" value={line.position} onChange={( e ) => editPerson( line.id, { position: e.currentTarget.value as Mh3055Position } )}>
                                    {POSITIONS.map( ( p ) => <option key={p} value={p}>{POSITION_LABELS[p]}</option> )}
                                </select></td>
                                <td><select aria-label="Experience" value={line.quality} onChange={( e ) => editPerson( line.id, { quality: e.currentTarget.value as Quality } )}>
                                    {QUALITIES.map( ( q ) => <option key={q} value={q}>{QUALITY_LABELS[q]}</option> )}
                                </select></td>
                                <td><input type="number" aria-label="Count" min={0} value={line.count} onChange={( e ) => editPerson( line.id, { count: whole( e.currentTarget.value ) } )} /></td>
                                <td><input type="checkbox" aria-label="Anti-'Mech" checked={line.antiMech} onChange={( e ) => editPerson( line.id, { antiMech: e.currentTarget.checked } )} /></td>
                                <td><button type="button" className="btn btn-danger btn-sm" onClick={() => change( ( s ) => { s.personnel = s.personnel.filter( ( l ) => l.id !== line.id ); } )}>Remove</button></td>
                            </tr>
                        ) )}
                    </tbody>
                </table>
            )}
            <p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => change( ( s ) => {
                    s.personnel = s.personnel.concat( { id: generateUUID(), position: "mechwarrior", quality: "regular", count: 1, antiMech: false } );
                } )}>Add personnel</button>
            </p>

            <p data-testid="mh3055-costs">
                Payroll {formatMoney( payroll )} C-bills a payday, two paydays a month ({formatMoney( payroll * 2 )}).
                {" "}Maintenance {formatMoney( needed )} SP a week; the support staff generate {formatMoney( generated )} SP a week
                {needed > generated ? <strong> (short {formatMoney( needed - generated )} SP)</strong> : null}.
                {contract ? <> Overhead {formatMoney( Math.round( mh3055WeeklyOverhead( contract.total, contract.months ) * 4 ) )} C-bills a month.</> : null}
            </p>

            <h4>Dragoons Rating</h4>
            <p data-testid="mh3055-rating">
                <strong>{dragoons.points}</strong> points: Dragoons Rating <strong>{dragoons.rating}</strong> (pay x{MH3055_RATING_PAY[dragoons.rating]}).
            </p>
            <p>
                {ratingNumber( "completed", "Contracts completed" )}{" "}
                {ratingNumber( "uncompleted", "Contracts failed" )}{" "}
                {ratingNumber( "losses", "Losses" )}{" "}
                {ratingNumber( "breaches", "Contract breaches" )}
            </p>
            <p>
                {ratingNumber( "supportPct", "Support %" )}{" "}
                {ratingNumber( "transportPct", "Transport %" )}{" "}
                {ratingNumber( "techPct", "Technicians %" )}{" "}
                {ratingNumber( "leadership", "Commander's Leadership" )}{" "}
                <label>Unit experience <select aria-label="Unit experience" value={r.experience} onChange={( e ) => { const q = e.currentTarget.value as Quality; editRating( { experience: q } ); }}>
                    {QUALITIES.map( ( q ) => <option key={q} value={q}>{QUALITY_LABELS[q]}</option> )}
                </select></label>{" "}
                <label><input type="checkbox" aria-label="Owns a JumpShip" checked={r.jumpShip} onChange={( e ) => { const v = e.currentTarget.checked; editRating( { jumpShip: v } ); }} /> Owns a JumpShip</label>
            </p>

            {contract ? (
                <div>
                    <h4>Contract</h4>
                    <p>
                        {MH3055_MISSION_NAMES[contract.mission]} for {MH3055_EMPLOYER_NAMES[contract.employer]}{contract.vsClans ? " against the Clans" : ""},
                        {" "}{contract.months} months from month {contract.startStep}: {formatMoney( Math.round( contract.total ) )} C-bills,
                        {" "}{formatMoney( Math.round( contract.drawn ) )} drawn. Each month books the paydays, overhead and the draw.
                    </p>
                    <p>
                        <label>
                            How the contract ends{" "}
                            <select aria-label="How the contract ends" value={endKind} onChange={( e ) => setEndKind( e.currentTarget.value as EndKind )}>
                                <option value="lost">Lost</option>
                                <option value="uncompleted">Not completed</option>
                                <option value="guilty">Breach hearing: guilty</option>
                                <option value="cleared">Breach hearing: cleared</option>
                            </select>
                        </label>{" "}
                        {endKind === "guilty" ? (
                            <><label>Hearing modifier <input type="number" aria-label="Hearing modifier" value={hearingModifier} onChange={( e ) => setHearingModifier( Number( e.currentTarget.value ) || 0 )} style={{ width: "4em" }} /></label>{" "}</>
                        ) : null}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                            const end: Mh3055ContractEnd = endKind === "lost" || endKind === "uncompleted"
                                ? { kind: endKind }
                                : { kind: "hearing", guilty: endKind === "guilty", roll: endKind === "guilty" ? campaignRoll.twoD6() + hearingModifier : 0 };
                            props.update( ( c ) => mh3055EndContract( c, end ) );
                        }}>End contract</button>
                    </p>
                    <p className="smaller-text">
                        Lost (p.111) suspends the rest of the pay; a guilty breach hearing (p.110) rolls 2D6 plus the gamemaster's modifier
                        for the fine and hiring ban. What was drawn is kept.
                    </p>
                </div>
            ) : (
                <div>
                    <h4>New contract</h4>
                    <p>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOffers( mh3055ContractOffers( campaignRoll.twoD6(), dragoons.rating ) )}>Roll offers</button>
                        {offers !== null ? <> {offers} contract offer{offers === 1 ? "" : "s"} this month.</> : null}
                    </p>
                    <p>
                        <label>
                            Employer{" "}
                            <select aria-label="Employer" value={employer} onChange={( e ) => { setEmployer( e.currentTarget.value as Mh3055Employer ); setEmployerDetail( "" ); }}>
                                {EMPLOYERS.map( ( id ) => <option key={id} value={id}>{MH3055_EMPLOYER_NAMES[id]}</option> )}
                            </select>
                        </label>{" "}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={rollEmployer}>Roll employer</button>{" "}
                        {employer === "corporation" ? (
                            <label>Corporation pay roll <input type="number" aria-label="Corporation pay roll" min={2} max={12} value={corporationRoll} onChange={( e ) => setCorporationRoll( numberOr( e.currentTarget.value, 7 ) )} /></label>
                        ) : null}{" "}
                        {employerDetail ? <span className="smaller-text">{employerDetail}.</span> : null}
                    </p>
                    <p>
                        <label>
                            Mission{" "}
                            <select aria-label="Mission" value={mission} onChange={( e ) => setMission( e.currentTarget.value as Mh3055Mission )}>
                                {MISSIONS.map( ( m ) => <option key={m} value={m}>{MH3055_MISSION_NAMES[m]}</option> )}
                            </select>
                        </label>{" "}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={rollJob}>Roll job</button>{" "}
                        <label><input type="checkbox" aria-label="Against the Clans" checked={vsClans} onChange={( e ) => setVsClans( e.currentTarget.checked )} /> Against the Clans</label>{" "}
                        {jobNote ? <span className="smaller-text">{jobNote}</span> : null}
                    </p>
                    <p>
                        <label>Months <input type="number" aria-label="Months" min={1} value={months} onChange={( e ) => setMonths( Math.max( 1, whole( e.currentTarget.value ) ) )} /></label>{" "}
                        <span className="smaller-text">{mission === "objective-raid" ? "At most 2." : `At least ${MH3055_MISSIONS[mission].minMonths}.`}</span>{" "}
                        <label>Bonuses a month <input type="number" aria-label="Bonuses a month" min={0} value={bonuses} onChange={( e ) => setBonuses( Math.max( 0, numberOr( e.currentTarget.value, 0 ) ) )} /></label>
                    </p>
                    <p data-testid="mh3055-pay">
                        Pay x{MH3055_RATING_PAY[dragoons.rating]} (rating) x{employerMultiplier} (employer) x{MH3055_MISSIONS[mission].multiplier} (mission){vsClans ? " x2 (Clans)" : ""}:
                        {" "}{formatMoney( Math.round( pay.monthly ) )} C-bills a month, <strong>{formatMoney( Math.round( pay.total ) )}</strong> in all.
                    </p>
                    <p>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={rollTerms}>Roll support, transport and salvage</button>
                        {terms ? (
                            <span className="smaller-text">
                                {" "}Straight support {terms.support}% or battle loss {terms.battleLoss}%; transport {terms.transport}% (own ships)
                                {" "}or {terms.commercial}% (commercial); {SALVAGE_LABELS[terms.salvage]}.
                            </span>
                        ) : null}
                    </p>
                    <p>
                        <label>Advance % <input type="number" aria-label="Advance %" min={0} max={25} value={advancePct} onChange={( e ) => setAdvancePct( Math.min( 25, Math.max( 0, numberOr( e.currentTarget.value, 0 ) ) ) )} /></label>{" "}
                        {dragoons.rating === "A" ? (
                            <label><input type="checkbox" aria-label="Paid in full up front" checked={upFront} onChange={( e ) => setUpFront( e.currentTarget.checked )} /> Paid in full up front (7% fee)</label>
                        ) : null}{" "}
                        <button type="button" className="btn btn-primary btn-sm" onClick={sign}>Sign contract</button>
                    </p>
                </div>
            )}
            <p className="smaller-text">
                {SOURCE}: pay and maintenance (pp.86-89), the Dragoons Rating (p.100), contracts (pp.102-108) and the Combatant
                Templates (pp.112-114), lost contracts (p.111) and breach hearings (pp.109-110). Per-design Combat Values are not built yet.
            </p>
            <p className="smaller-text" data-testid="mh3055-readings">
                Readings: where the book leaves a rule open, NGCFells decided how to read it. Inspired by {SOURCE}, not printed
                there: a month is two paydays and four weeks of maintenance and overhead; the Bonding Commission&apos;s 5% fee is
                taken on the first draw only; an A-rated unit paid in full up front pays 7% (5% plus the extra 2%); on a 2-6
                month contract the upkeep portion is paid each month as an &quot;Upkeep draw&quot;; overhead is charged only while
                a contract runs.
            </p>
        </div>
    );
}
