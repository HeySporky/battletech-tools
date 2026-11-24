import React, { useEffect, useMemo, useState, type JSX } from 'react';
import { Link } from 'react-router';
import { AlphaStrikeUnit } from '../../../../classes/alpha-strike-unit';
import AlphaStrikeForce from '../../../../classes/alpha-strike-force';
import { BattleMech } from '../../../../classes/battlemech';
import { BattleMechForce } from '../../../../classes/battlemech-force';
import { refreshForceUnit, snapshotAlphaStrikeUnit, snapshotBattleMech } from '../../../../classes/campaign/campaign-force';
import { Campaign, STEP_LABELS } from '../../../../classes/campaign/campaign';
import { FightSize, ICampaignBattleResult, ICampaignTarget } from '../../../../classes/campaign/campaign-types';
import { findSpecialRuleset, RulesetCategory } from '../../../../data/special-rulesets';
import { IStarPlanet, IStarSystemDetail, IStarSystemIndexEntry, MEGAMEK_DATA_SOURCE, readSourced, StoredSourced } from '../../../../data/star-systems/star-system-types';
import {
    DEFAULT_JUMP_RANGE_LY, getDistanceLY, getFactionName, getFewestJumps, getStarSystemIndex, getSystemGarrisons, getSystemOwners,
    IStarSystemSites, loadStarSystemDetail, loadStarSystemIndex, loadStarSystemSites,
} from '../../../../data/star-systems/star-systems';
import { getCurrentASForce, getCurrentCBTForce } from '../../../../dataSaves';
import { generateUUID } from '../../../../utils/generateUUID';
import { EMPTY_RULESET_FILTER, IRulesetListFilter } from '../../../../utils/ruleset-list';
import { IAppGlobals } from '../../../app-router';
import RulesetList from '../../../components/special-rulesets/ruleset-list';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { MH1987_ID } from '../../../../data/campaign-editions/mercenarys-handbook-1987';
import CampaignSetup from './campaign-setup';
import { formatMoney, useCampaign } from './campaign-store';
import EditionMh1987 from './edition-mh1987';
import { MH3055_ID } from '../../../../data/campaign-editions/mercenarys-handbook-3055';
import EditionMh3055 from './edition-mh3055';
import SystemSearch from './system-search';

const INTENTS: ICampaignTarget["intent"][] = ["travel", "assault", "defend"];

/** A catalog field with its source marked when it is not MegaMek Data (the footer credits MegaMek Data once). */
function SourcedValue<T>( props: { field: StoredSourced<T> | null | undefined; unit?: string } ): JSX.Element | null {
    const read = readSourced( props.field );
    if( !read || read.value === null || read.value === undefined || read.value === "" ) return null;
    return (
        <span>
            {String( read.value )}{props.unit ?? ""}
            {read.source !== MEGAMEK_DATA_SOURCE ? <span className="smaller-text"> [{read.source}]</span> : null}
        </span>
    );
}

/** The planet's population and socio-industrial code on the date: the latest entry on or before it. */
const planetOnDate = ( planet: IStarPlanet, date: string ): { population?: number; socioIndustrial?: string } => {
    const out: { population?: number; socioIndustrial?: string } = {};
    for( const event of planet.events ) {
        if( event.date > date ) break;
        if( event.population !== undefined ) out.population = event.population;
        if( event.socioIndustrial !== undefined ) out.socioIndustrial = event.socioIndustrial;
    }
    return out;
};

/** The campaign's star system: planets, owner, Objectives sites and garrisons on the campaign's date. */
function SystemPanel( props: { system: IStarSystemIndexEntry; date: string; sites: IStarSystemSites | null } ): JSX.Element {
    const [detail, setDetail] = useState<IStarSystemDetail | null>( null );
    useEffect( () => {
        let live = true;
        loadStarSystemDetail( props.system.id ).then( ( d ) => { if( live ) setDetail( d ?? null ); } );
        return () => { live = false; };
    }, [props.system.id] );
    const owners = getSystemOwners( props.system, props.date );
    // Sites are listed whatever the date: most predate the book that names them, so each shows its book's year.
    const sites = props.sites?.sites.filter( ( s ) => s.systemId === props.system.id ) ?? [];
    const garrisons = props.sites ? getSystemGarrisons( props.sites.garrisons, props.system.id, props.date ) : [];
    return (
        <div>
            <p>
                <strong>{props.system.name}</strong> ({props.system.x.toFixed( 2 )}, {props.system.y.toFixed( 2 )})
                {detail?.spectralType ? <> star <SourcedValue field={detail.spectralType} /></> : null}.
                Owner on {props.date}: {owners.length > 0 ? owners.map( ( code ) => getFactionName( code, props.date ) ).join( ", " ) : "none recorded"}.
            </p>
            {detail ? (
                <table className="campaign-table">
                    <thead><tr><th>Planet</th><th>Type</th><th>Gravity</th><th>Atmosphere</th><th>Temp.</th><th>Water</th><th>Population</th><th>USILR</th></tr></thead>
                    <tbody>
                        {detail.planets.map( ( planet, index ) => {
                            const onDate = planetOnDate( planet, props.date );
                            return (
                                <tr key={index}>
                                    <td><SourcedValue field={planet.name} /></td>
                                    <td>{planet.type}</td>
                                    <td><SourcedValue field={planet.gravity} unit=" g" /></td>
                                    <td><SourcedValue field={planet.atmosphere} /></td>
                                    <td><SourcedValue field={planet.temperature} unit=" °C" /></td>
                                    <td><SourcedValue field={planet.water} unit="%" /></td>
                                    <td className="number">{onDate.population !== undefined ? formatMoney( onDate.population ) : ""}</td>
                                    <td>{onDate.socioIndustrial ?? ""}</td>
                                </tr>
                            );
                        } )}
                    </tbody>
                </table>
            ) : <p className="smaller-text">Loading planets...</p>}
            <h4>Objectives sites</h4>
            {sites.length === 0 ? <p className="smaller-text">None in the books checked so far.</p> : (
                <ul>{sites.map( ( site ) => <li key={site.id}>{site.planet}: {site.name} ({site.products.join( ", " )}{site.heavy ? ", heavy" : ""}) - as of {site.date.slice( 0, 4 )}, {site.source}</li> )}</ul>
            )}
            <h4>Garrisons</h4>
            {garrisons.length === 0 ? <p className="smaller-text">None in the books checked so far on or before this date.</p> : (
                <ul>{garrisons.map( ( g, i ) => <li key={i}>{g.date.slice( 0, 4 )}, {getFactionName( g.faction, g.date )}: {g.units.join( ", " )} ({g.source})</li> )}</ul>
            )}
        </div>
    );
}

/** The rule on a ledger entry the GM typed in; only these can be removed. */
const BY_HAND = "Entered by hand";

/** A row for the GM to book an entry the rules leave to them (repair bills, hand-entered rulings). */
function AddLedgerEntry( props: { onAdd: ( reason: string, amount: number ) => void } ): JSX.Element {
    const [reason, setReason] = useState( "" );
    const [amount, setAmount] = useState( "" );
    const value = Number( amount );
    const ready = reason.trim() !== "" && amount.trim() !== "" && isFinite( value ) && value !== 0;
    return (
        <p>
            <label>Reason <input type="text" aria-label="Reason" value={reason} onChange={( e ) => setReason( e.currentTarget.value )} /></label>{" "}
            <label>Amount <input type="number" aria-label="Amount" value={amount} onChange={( e ) => setAmount( e.currentTarget.value )} /></label>{" "}
            <button type="button" className="btn btn-secondary btn-sm" disabled={!ready} onClick={() => {
                props.onAdd( reason.trim(), Math.round( value ) );
                setReason( "" );
                setAmount( "" );
            }}>Add entry</button>
        </p>
    );
}

const FIGHT_SIZES: FightSize[] = ["lance", "company", "battalion", "regiment"];

/**
 * The spec's after-battle form (review M12): per side, whether it fought, at what size and which of its force units it
 * lost; where the battle was (optional) and who holds the ground. Campaign.recordBattle logs it and runs the hooks.
 */
function AfterBattle( props: { campaign: Campaign; onRecord: ( result: ICampaignBattleResult ) => void } ): JSX.Element {
    const { campaign } = props;
    const [fought, setFought] = useState<Record<string, FightSize>>( {} );
    const [losses, setLosses] = useState<string[]>( [] );
    const [areaId, setAreaId] = useState( "" );
    const [heldBy, setHeldBy] = useState( "" );
    const areas = campaign.planet?.areas ?? [];
    const sides = campaign.sides.filter( ( s ) => fought[s.id] );
    const toggle = <T,>( list: T[], item: T ): T[] => ( list.includes( item ) ? list.filter( ( i ) => i !== item ) : list.concat( item ) );
    const record = () => {
        props.onRecord( {
            areaId: areaId || undefined,
            sides: sides.map( ( s ) => ( {
                sideId: s.id, size: fought[s.id],
                losses: losses.filter( ( id ) => campaign.force.some( ( u ) => u.id === id && u.sideId === s.id ) ),
            } ) ),
            heldBySideId: heldBy || null,
        } );
        setFought( {} );
        setLosses( [] );
        setAreaId( "" );
        setHeldBy( "" );
    };
    return (
        <div data-testid="campaign-battle">
            {campaign.sides.map( ( side ) => {
                const units = campaign.force.filter( ( u ) => u.sideId === side.id );
                return (
                    <p key={side.id}>
                        <label>
                            <input type="checkbox" aria-label={side.name + " fought"} checked={!!fought[side.id]} onChange={() => {
                                const next = { ...fought };
                                if( next[side.id] ) delete next[side.id];
                                else next[side.id] = "lance";
                                setFought( next );
                            }} /> {side.name} fought
                        </label>{" "}
                        {fought[side.id] ? (
                            <>
                                <label>
                                    Size{" "}
                                    <select aria-label={side.name + " size"} value={fought[side.id]}
                                        onChange={( e ) => setFought( { ...fought, [side.id]: e.currentTarget.value as FightSize } )}>
                                        {FIGHT_SIZES.map( ( size ) => <option key={size} value={size}>{size}</option> )}
                                    </select>
                                </label>{" "}
                                {units.length > 0 ? <>Lost:{" "}</> : null}
                                {units.map( ( unit ) => (
                                    <label key={unit.id}>
                                        <input type="checkbox" aria-label={"Lost " + unit.name} checked={losses.includes( unit.id )}
                                            onChange={() => setLosses( toggle( losses, unit.id ) )} /> {unit.name}{" "}
                                    </label>
                                ) )}
                            </>
                        ) : null}
                    </p>
                );
            } )}
            <p>
                {areas.length > 0 ? (
                    <label>
                        Area{" "}
                        <select aria-label="Area" value={areaId} onChange={( e ) => setAreaId( e.currentTarget.value )}>
                            <option value="">(none)</option>
                            {areas.map( ( a ) => <option key={a.id} value={a.id}>{a.name}</option> )}
                        </select>
                    </label>
                ) : null}{" "}
                <label>
                    Held by{" "}
                    <select aria-label="Held by" value={heldBy} onChange={( e ) => setHeldBy( e.currentTarget.value )}>
                        <option value="">No one</option>
                        {campaign.sides.map( ( s ) => <option key={s.id} value={s.id}>{s.name}</option> )}
                    </select>
                </label>{" "}
                <button type="button" className="btn btn-primary btn-sm" disabled={sides.length === 0} onClick={record}>Record battle</button>
            </p>
            <p className="smaller-text">Lost units are marked on the Force list; the area passes to the side that holds the ground.</p>
        </div>
    );
}

export default function CampaignHome( props: { appGlobals: IAppGlobals; id: string | undefined } ): JSX.Element {
    const { loaded, campaign, error, update } = useCampaign( props.appGlobals, props.id );
    const [indexReady, setIndexReady] = useState( false );
    const [sites, setSites] = useState<IStarSystemSites | null>( null );
    const [targetSystem, setTargetSystem] = useState<IStarSystemIndexEntry | null>( null );
    const [intent, setIntent] = useState<ICampaignTarget["intent"]>( "travel" );
    const [targetSide, setTargetSide] = useState( "" );
    const [forceSide, setForceSide] = useState( "" );
    const [message, setMessage] = useState( "" );
    const [editRulesets, setEditRulesets] = useState( false );
    const [filter, setFilter] = useState<IRulesetListFilter>( EMPTY_RULESET_FILTER );
    const [openGroups, setOpenGroups] = useState<Partial<Record<RulesetCategory, boolean>>>( { campaign: true } );

    useEffect( () => { props.appGlobals.makeDocumentTitle( "Campaign" ); }, [props.appGlobals] );
    useEffect( () => {
        let live = true;
        loadStarSystemIndex().then( () => { if( live ) setIndexReady( true ); } );
        loadStarSystemSites().then( ( data ) => { if( live ) setSites( data ); } );
        return () => { live = false; };
    }, [] );

    // The fewest-jumps search is a BFS over the whole index: run it once per (home, target), not on every render.
    const homeId = campaign?.planet?.systemId ?? null;
    const targetIds = ( campaign?.targets ?? [] ).map( ( t ) => t.systemId ).join( "|" );
    const jumpsTo = useMemo( () => {
        const rv = new Map<string, number | null>();
        const all = indexReady ? getStarSystemIndex() : [];
        const from = homeId ? all.find( ( s ) => s.id === homeId ) : undefined;
        if( !from ) return rv;
        for( const id of targetIds ? targetIds.split( "|" ) : [] ) {
            const to = all.find( ( s ) => s.id === id );
            if( to && !rv.has( id ) ) rv.set( id, getFewestJumps( from, to, DEFAULT_JUMP_RANGE_LY ) );
        }
        return rv;
    }, [indexReady, homeId, targetIds] );

    if( !loaded ) return <UIPage current="game-management-campaigns" appGlobals={props.appGlobals}><p>Loading...</p></UIPage>;
    if( !campaign ) {
        return (
            <UIPage current="game-management-campaigns" appGlobals={props.appGlobals}>
                <TextSection label="Campaign"><p>{error ? `This campaign cannot be opened: ${error}.` : "No campaign with this id."} <Link to="..">Back to campaigns</Link></p></TextSection>
            </UIPage>
        );
    }

    const index = indexReady ? getStarSystemIndex() : [];
    const home = campaign.planet?.systemId ? index.find( ( s ) => s.id === campaign.planet!.systemId ) ?? null : null;
    const date = campaign.currentDate();
    const sideFor = ( chosen: string ) => campaign.sides.find( ( s ) => s.id === chosen ) ?? campaign.sides[0];
    const hasEconomics = campaign.rulesetIds.includes( "fw-economics" );

    const addTarget = () => {
        const side = sideFor( targetSide );
        if( !targetSystem || !side ) return;
        const system = targetSystem;
        update( ( c ) => { c.targets = c.targets.concat( { id: generateUUID(), sideId: side.id, systemId: system.id, intent } ); } );
        setTargetSystem( null );
    };

    const addForce = async ( kind: "battlemech" | "alpha-strike" ) => {
        const side = sideFor( forceSide );
        if( !side ) return;
        const units = kind === "battlemech"
            ? await currentBattleMechs( props.appGlobals ) .then( ( list ) => list.map( ( mech ) => snapshotBattleMech( mech, side.id ) ) )
            : await currentAlphaStrikeUnits( props.appGlobals ).then( ( list ) => list.map( ( unit ) => snapshotAlphaStrikeUnit( unit, side.id ) ) );
        if( units.length === 0 ) {
            setMessage( kind === "battlemech" ? "The current Classic BattleTech force has no 'Mechs." : "The current Alpha Strike force has no units." );
            return;
        }
        setMessage( `Added ${units.length} unit${units.length === 1 ? "" : "s"} to ${side.name}.` );
        update( ( c ) => { c.force = c.force.concat( units ); } );
    };

    const refresh = async ( unitId: string ) => {
        const unit = campaign.force.find( ( u ) => u.id === unitId );
        if( !unit ) return;
        const saved = unit.kind === "battlemech"
            ? ( await currentBattleMechs( props.appGlobals ) ).find( ( m ) => m.getUUID() === unit.savedId )
            : ( await currentAlphaStrikeUnits( props.appGlobals ) ).find( ( u ) => u.uuid === unit.savedId );
        if( !saved ) {
            setMessage( `${unit.name} is not in the current force, so it cannot be refreshed.` );
            return;
        }
        setMessage( `${unit.name} refreshed.` );
        update( ( c ) => { c.force = c.force.map( ( u ) => ( u.id === unitId ? refreshForceUnit( u, saved ) : u ) ); } );
    };

    const toggleRulesets = ( ids: string[] ) => update( ( c ) => {
        for( const id of ids ) c.rulesetIds = c.rulesetIds.includes( id ) ? c.rulesetIds.filter( ( t ) => t !== id ) : c.rulesetIds.concat( id );
    } );

    return (
        <UIPage current="game-management-campaigns" appGlobals={props.appGlobals}>
            <div className="campaign-page">
                <TextSection label={campaign.name}>
                    <p>
                        <Link to="..">All campaigns</Link>
                        {hasEconomics ? <> | <Link to="planet">Planet economy</Link></> : null}
                        {" | "}<Link to="contract-sheet">Contract sheets</Link>{campaign.contractSheets.length > 0 ? ` (${campaign.contractSheets.length})` : null}
                    </p>
                    <p data-testid="campaign-step">
                        {campaign.edition?.name ?? "No edition rules"}. {campaign.timeStep[0].toUpperCase() + campaign.timeStep.slice( 1 )} {campaign.step} ({date})
                        {campaign.planet ? <>, on {campaign.planet.name}</> : null}.
                    </p>
                    <p><button type="button" className="btn btn-primary" onClick={() => update( ( c ) => c.advance( 1 ) )}>Advance a {campaign.timeStep}</button></p>
                    <p>
                        Rulesets: {campaign.rulesetIds.length === 0 ? "none" : campaign.rulesetIds.map( ( id ) => findSpecialRuleset( id )?.name ?? id ).join( ", " )}{" "}
                        <button type="button" className="btn btn-link btn-sm" onClick={() => setEditRulesets( !editRulesets )}>{editRulesets ? "Done" : "Change"}</button>
                    </p>
                    {editRulesets ? (
                        <RulesetList tickedIds={campaign.rulesetIds} filter={filter} onFilter={setFilter} openGroups={openGroups}
                            onGroupToggle={( category, isOpen ) => setOpenGroups( { ...openGroups, [category]: isOpen } )}
                            onToggle={toggleRulesets} onMoreInfo={() => undefined} categories={["campaign"]} />
                    ) : null}
                </TextSection>

                <TextSection label="Setup">
                    <CampaignSetup campaign={campaign} update={update} />
                </TextSection>

                {campaign.editionId === MH1987_ID ? (
                    <TextSection label="Mercenary's Handbook (1987)">
                        <EditionMh1987 campaign={campaign} update={update} />
                    </TextSection>
                ) : null}
                {campaign.editionId === MH3055_ID ? (
                    <TextSection label="Mercenary's Handbook 3055">
                        <EditionMh3055 campaign={campaign} update={update} />
                    </TextSection>
                ) : null}

                <TextSection label="Sides and ledgers">
                    {campaign.sides.map( ( side ) => {
                        const entries = campaign.ledger.filter( ( e ) => e.sideId === side.id );
                        return (
                            <div key={side.id} data-testid={"campaign-ledger-" + side.name}>
                                <h4>{side.name} ({side.role}): {formatMoney( campaign.balance( side.id ) )} {campaign.currency}</h4>
                                {entries.length === 0 ? <p className="smaller-text">No entries yet.</p> : (
                                    <table className="campaign-table">
                                        <thead><tr><th>Step</th><th>Reason</th><th>Amount</th><th></th></tr></thead>
                                        <tbody>
                                            {entries.map( ( e, index ) => (
                                                <tr key={e.id}>
                                                    <td>{e.step}</td><td>{e.reason}</td><td className="number">{formatMoney( e.amount )} {e.currency}</td>
                                                    <td>{e.rule === BY_HAND ? <button type="button" className="btn btn-danger btn-sm" aria-label={`Remove entry ${index + 1}: ${e.reason}`}
                                                        onClick={() => update( ( c ) => { c.ledger = c.ledger.filter( ( l ) => l.id !== e.id ); } )}>Remove</button> : null}</td>
                                                </tr>
                                            ) )}
                                        </tbody>
                                    </table>
                                )}
                                <AddLedgerEntry onAdd={( reason, amount ) => update( ( c ) => {
                                    c.addLedger( { sideId: side.id, step: c.step, amount, currency: c.currency, reason, rule: BY_HAND } );
                                } )} />
                            </div>
                        );
                    } )}
                </TextSection>

                <TextSection label="Force">
                    {campaign.force.length === 0 ? <p className="smaller-text">No units yet.</p> : (
                        <table className="campaign-table">
                            <thead><tr><th>Side</th><th>Name</th><th>Cost</th><th>BV</th><th>PV</th><th>Status</th><th></th></tr></thead>
                            <tbody>
                                {campaign.force.map( ( unit ) => (
                                    <tr key={unit.id}>
                                        <td>{campaign.sides.find( ( s ) => s.id === unit.sideId )?.name ?? ""}</td>
                                        <td>{unit.name}</td>
                                        <td className="number">{unit.cost !== null ? formatMoney( unit.cost ) : ""}</td>
                                        <td className="number">{unit.bv ?? ""}</td>
                                        <td className="number">{unit.pv ?? ""}</td>
                                        <td><input type="text" aria-label={"Status of " + unit.name} value={unit.status}
                                            onChange={( e ) => { const status = e.currentTarget.value; update( ( c ) => { c.force = c.force.map( ( u ) => ( u.id === unit.id ? { ...u, status } : u ) ); } ); }} /></td>
                                        <td>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => refresh( unit.id )}>Refresh</button>{" "}
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => update( ( c ) => { c.force = c.force.filter( ( u ) => u.id !== unit.id ); } )}>Remove</button>
                                        </td>
                                    </tr>
                                ) )}
                            </tbody>
                        </table>
                    )}
                    <p>
                        <label>
                            Add to side{" "}
                            <select value={forceSide} onChange={( e ) => setForceSide( e.currentTarget.value )}>
                                {campaign.sides.map( ( s ) => <option key={s.id} value={s.id}>{s.name}</option> )}
                            </select>
                        </label>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addForce( "battlemech" )}>Add from current Classic BattleTech force</button>{" "}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addForce( "alpha-strike" )}>Add from current Alpha Strike force</button>
                    </p>
                    {message ? <p className="smaller-text">{message}</p> : null}
                </TextSection>

                <TextSection label="After a battle">
                    <AfterBattle campaign={campaign} onRecord={( result ) => update( ( c ) => c.recordBattle( result ) )} />
                </TextSection>

                <TextSection label="Systems">
                    {home ? <SystemPanel system={home} date={date} sites={sites} />
                        : <p className="smaller-text">{campaign.planet?.systemId ? "Loading star systems..." : "The campaign planet is not in the star catalog."}</p>}
                    <div data-testid="campaign-targets">
                        <h4>Targets</h4>
                        {campaign.targets.length > 0 ? (
                            <table className="campaign-table">
                                <thead><tr><th>Side</th><th>System</th><th>Intent</th><th>Distance</th><th>Jumps</th><th></th></tr></thead>
                                <tbody>
                                    {campaign.targets.map( ( target ) => {
                                        const system = index.find( ( s ) => s.id === target.systemId );
                                        const jumps = jumpsTo.get( target.systemId ) ?? null;
                                        return (
                                            <tr key={target.id} data-testid={"target-row-" + target.systemId}>
                                                <td>{campaign.sides.find( ( s ) => s.id === target.sideId )?.name ?? ""}</td>
                                                <td>{system?.name ?? target.systemId}</td>
                                                <td>{target.intent}</td>
                                                <td className="number">{home && system ? getDistanceLY( home, system ).toFixed( 1 ) + " LY" : ""}</td>
                                                <td>{home && system ? ( jumps === null ? "out of reach" : `${jumps} jump${jumps === 1 ? "" : "s"}` ) : ""}</td>
                                                <td><button type="button" className="btn btn-danger btn-sm" onClick={() => update( ( c ) => { c.targets = c.targets.filter( ( t ) => t.id !== target.id ); } )}>Remove</button></td>
                                            </tr>
                                        );
                                    } )}
                                </tbody>
                            </table>
                        ) : null}
                        <SystemSearch label="Target system" onPick={setTargetSystem} />
                        <p>
                            {targetSystem ? <>Target: <strong>{targetSystem.name}</strong>{" "}</> : null}
                            <label>
                                Side{" "}
                                <select value={targetSide} onChange={( e ) => setTargetSide( e.currentTarget.value )}>
                                    {campaign.sides.map( ( s ) => <option key={s.id} value={s.id}>{s.name}</option> )}
                                </select>
                            </label>
                            <label>
                                Intent{" "}
                                <select value={intent} onChange={( e ) => setIntent( e.currentTarget.value as ICampaignTarget["intent"] )}>
                                    {INTENTS.map( ( i ) => <option key={i} value={i}>{i}</option> )}
                                </select>
                            </label>
                            <button type="button" className="btn btn-secondary btn-sm" disabled={!targetSystem} onClick={addTarget}>Add target</button>
                        </p>
                        <p className="smaller-text">Jumps count {DEFAULT_JUMP_RANGE_LY} light-years at most each.</p>
                    </div>
                    <p className="smaller-text">
                        Star systems: the JBT star system catalog, built by NGCFells on MegaMek Data (CC BY-NC-SA 4.0) and checked against
                        the BattleTech sourcebooks and the Inner Sphere Cartography Society maps; a field from a book shows its source in
                        brackets.
                    </p>
                </TextSection>

                <TextSection label="Log">
                    <ul>{campaign.log.slice().reverse().slice( 0, 100 ).map( ( l ) => {
                        // The step's own line ("Month 3") is its heading; other lines say which step they belong to.
                        const step = `${STEP_LABELS[campaign.timeStep]} ${l.step}`;
                        return <li key={l.id}>{l.text === step ? step : `${step}: ${l.text}`}</li>;
                    } )}</ul>
                </TextSection>
            </div>
        </UIPage>
    );
}

const currentBattleMechs = async ( appGlobals: IAppGlobals ): Promise<BattleMech[]> => {
    const data = await getCurrentCBTForce( appGlobals.appSettings );
    if( !data ) return [];
    return new BattleMechForce( data ).groups.flatMap( ( group ) => group.members );
};

const currentAlphaStrikeUnits = async ( appGlobals: IAppGlobals ): Promise<AlphaStrikeUnit[]> => {
    const data = await getCurrentASForce( appGlobals.appSettings );
    if( !data ) return [];
    return new AlphaStrikeForce( data ).groups.flatMap( ( group ) => group.members );
};
