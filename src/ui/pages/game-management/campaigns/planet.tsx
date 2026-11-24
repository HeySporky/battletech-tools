import React, { useEffect, useState, type JSX } from 'react';
import { Link } from 'react-router';
import { Campaign } from '../../../../classes/campaign/campaign';
import { getPlanetCombinations } from '../../../../classes/campaign/campaign-rules';
import { FightSize, ICampaignArea, ICampaignCombination, ICustomDotType } from '../../../../classes/campaign/campaign-types';
import { FW_FIGHT_SIZE_MODIFIERS, isDefenderRestraint, rollAreaDamage, rollPartisans } from '../../../../data/future-wars-economic-damage';
import { FW_DOT_TYPES, FW_DOT_VALUE, getBestAreaIncome } from '../../../../data/future-wars-economics';
import { findSpecialRuleset } from '../../../../data/special-rulesets';
import { loadStarSystemSites } from '../../../../data/star-systems/star-systems';
import { generateUUID } from '../../../../utils/generateUUID';
import { IAppGlobals } from '../../../app-router';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { campaignDice, formatMoney, useCampaign } from './campaign-store';

const FIGHT_SIZES = Object.keys( FW_FIGHT_SIZE_MODIFIERS ) as FightSize[];

/** Every dot type on this planet: the printed eight and the GM's own. */
const dotTypes = ( custom: ICustomDotType[] ): { id: string; name: string }[] =>
    ( FW_DOT_TYPES as { id: string; name: string }[] ).concat( custom.map( ( t ) => ( { id: t.id, name: t.name } ) ) );

const typeName = ( id: string, custom: ICustomDotType[] ): string => dotTypes( custom ).find( ( t ) => t.id === id )?.name ?? id;

type Update = ( change: ( c: Campaign ) => void ) => void;

/** Change one area of the planet through the campaign. */
const changeArea = ( update: Update, areaId: string, change: ( area: ICampaignArea ) => ICampaignArea ) =>
    update( ( c ) => { if( c.planet ) c.planet = { ...c.planet, areas: c.planet.areas.map( ( a ) => ( a.id === areaId ? change( a ) : a ) ) }; } );

function AreaPanel( props: { campaign: Campaign; area: ICampaignArea; update: Update; damage: boolean } ): JSX.Element {
    const { campaign, area, update } = props;
    const planet = campaign.planet!;
    const custom = planet.customDotTypes;
    const combos = getPlanetCombinations( planet );
    const income = getBestAreaIncome( area, combos, custom );
    const [addType, setAddType] = useState( "mining" );
    const [size, setSize] = useState<FightSize>( "lance" );
    const [scorched, setScorched] = useState( false );
    const [partisanDot, setPartisanDot] = useState( "" );
    const restraint = isDefenderRestraint( area, campaign.sides, campaign.step );
    const controller = campaign.sides.find( ( s ) => s.id === area.controllerSideId );
    const liveDots = area.dots.filter( ( d ) => !d.destroyed );

    const rollDamage = () => {
        const results = rollAreaDamage( area, custom, { size, defenderRestraint: restraint, scorchedEarth: scorched }, () => campaignDice.roll2d6() );
        const lost = results.filter( ( r ) => r.destroyed ).map( ( r ) => r.dotId );
        const names = lost.map( ( id ) => typeName( area.dots.find( ( d ) => d.id === id )!.type, custom ) );
        update( ( c ) => {
            if( !c.planet ) return;
            c.planet = { ...c.planet, areas: c.planet.areas.map( ( a ) => ( a.id === area.id ? { ...a, dots: a.dots.map( ( d ) => ( lost.includes( d.id ) ? { ...d, destroyed: true } : d ) ) } : a ) ) };
            c.addLog( `${area.name}: economic damage after a ${size} fight (rolls ${results.map( ( r ) => r.roll ).join( ", " )}): `
                + ( lost.length > 0 ? `${names.join( ", " )} destroyed` : "nothing destroyed" ) );
        } );
    };

    const rollPartisan = () => {
        const dot = liveDots.find( ( d ) => d.id === partisanDot ) ?? liveDots[0];
        if( !dot ) return;
        const result = rollPartisans( dot, custom, () => campaignDice.roll2d6() );
        update( ( c ) => {
            if( !c.planet ) return;
            if( result.destroyed ) {
                c.planet = { ...c.planet, areas: c.planet.areas.map( ( a ) => ( a.id === area.id ? { ...a, dots: a.dots.map( ( d ) => ( d.id === dot.id ? { ...d, destroyed: true } : d ) ) } : a ) ) };
            }
            c.addLog( `${area.name}: partisans against ${typeName( dot.type, custom )} (roll ${result.roll}): ${result.destroyed ? "destroyed" : "survives"}` );
        } );
    };

    return (
        <div className="campaign-area" data-testid={"area-" + area.id}>
            <p>
                <label>Area name <input type="text" value={area.name} onChange={( e ) => { const name = e.currentTarget.value; changeArea( update, area.id, ( a ) => ( { ...a, name } ) ); }} /></label>
                <label>Terrain <input type="text" value={area.terrain} onChange={( e ) => { const terrain = e.currentTarget.value; changeArea( update, area.id, ( a ) => ( { ...a, terrain } ) ); }} /></label>
                <label>
                    Held by{" "}
                    <select value={area.controllerSideId ?? ""} onChange={( e ) => { const id = e.currentTarget.value || null; changeArea( update, area.id, ( a ) => ( { ...a, controllerSideId: id } ) ); }}>
                        <option value="">No one</option>
                        {campaign.sides.map( ( s ) => <option key={s.id} value={s.id}>{s.name}</option> )}
                    </select>
                </label>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => update( ( c ) => { if( c.planet ) c.planet = { ...c.planet, areas: c.planet.areas.filter( ( a ) => a.id !== area.id ) }; } )}>Remove area</button>
            </p>
            <p>
                {area.dots.length === 0 ? <span className="smaller-text">No dots. </span> : area.dots.map( ( dot ) => (
                    <span key={dot.id} className={"campaign-dot" + ( dot.destroyed ? " destroyed" : "" )}>
                        {typeName( dot.type, custom )}{" "}
                        <button type="button" className="btn btn-link btn-sm" title={dot.destroyed ? "Mark repaired" : "Mark destroyed"}
                            onClick={() => changeArea( update, area.id, ( a ) => ( { ...a, dots: a.dots.map( ( d ) => ( d.id === dot.id ? { ...d, destroyed: !d.destroyed } : d ) ) } ) )}>
                            {dot.destroyed ? "repair" : "x"}
                        </button>
                        <button type="button" className="btn btn-link btn-sm" title="Remove dot"
                            onClick={() => changeArea( update, area.id, ( a ) => ( { ...a, dots: a.dots.filter( ( d ) => d.id !== dot.id ) } ) )}>remove</button>
                    </span>
                ) )}
            </p>
            <p>
                <label>
                    Dot type{" "}
                    <select value={addType} onChange={( e ) => setAddType( e.currentTarget.value )}>
                        {dotTypes( custom ).map( ( t ) => <option key={t.id} value={t.id}>{t.name}</option> )}
                    </select>
                </label>
                <button type="button" className="btn btn-secondary btn-sm"
                    onClick={() => changeArea( update, area.id, ( a ) => ( { ...a, dots: a.dots.concat( { id: generateUUID(), type: addType, destroyed: false } ) } ) )}>Add dot</button>
            </p>
            <p>
                Pays {formatMoney( income.total )} C-bills a quarter{controller ? ` to ${controller.name}` : " (held by no one, so it pays no one)"}
                {income.used.length > 0 ? <>: {income.used.map( ( u ) => `${combos.find( ( c ) => c.id === u.comboId )?.name ?? u.comboId} (${formatMoney( u.pays )})` ).join( "; " )}</> : null}
                {income.loose.length > 0 ? <>{income.used.length > 0 ? "; plus " : ": "}{income.loose.length} dot{income.loose.length === 1 ? "" : "s"} on {income.loose.length === 1 ? "its" : "their"} own</> : null}.
                {area.comboOverride ? <span className="smaller-text"> (the GM's grouping)</span> : null}
            </p>
            {combos.length > 0 ? (
                <p className="smaller-text">
                    <label>
                        Grouping{" "}
                        <select value={area.comboOverride ? area.comboOverride.join( "," ) : ""}
                            onChange={( e ) => { const v = e.currentTarget.value; changeArea( update, area.id, ( a ) => ( { ...a, comboOverride: v ? v.split( "," ) : null } ) ); }}>
                            <option value="">The one that pays most</option>
                            {combos.map( ( c ) => <option key={c.id} value={c.id}>Only {c.name}</option> )}
                        </select>
                    </label>
                </p>
            ) : null}
            {props.damage ? (
                <div>
                    <p>
                        <label>
                            Fight size{" "}
                            <select value={size} onChange={( e ) => setSize( e.currentTarget.value as FightSize )}>
                                {FIGHT_SIZES.map( ( s ) => <option key={s} value={s}>{s} ({FW_FIGHT_SIZE_MODIFIERS[s] >= 0 ? "+" : ""}{FW_FIGHT_SIZE_MODIFIERS[s]})</option> )}
                            </select>
                        </label>
                        <label><input type="checkbox" checked={scorched} onChange={( e ) => setScorched( e.currentTarget.checked )} /> Scorched earth (+3)</label>
                        {restraint ? <span className="smaller-text"> Defender's restraint applies (-1). </span> : null}
                        <button type="button" className="btn btn-warning btn-sm" disabled={liveDots.length === 0} onClick={rollDamage}>Roll damage</button>
                    </p>
                    {controller?.role === "attacker" && liveDots.length > 0 ? (
                        <p>
                            <label>
                                Partisans target{" "}
                                <select value={partisanDot} onChange={( e ) => setPartisanDot( e.currentTarget.value )}>
                                    {liveDots.map( ( d ) => <option key={d.id} value={d.id}>{typeName( d.type, custom )}</option> )}
                                </select>
                            </label>
                            <button type="button" className="btn btn-warning btn-sm" onClick={rollPartisan}>Roll partisans (-2)</button>
                        </p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

/** The GM's own dot types and combinations. */
function GmTables( props: { campaign: Campaign; update: Update } ): JSX.Element {
    const planet = props.campaign.planet!;
    const [newTypeName, setNewTypeName] = useState( "" );
    const [typeValue, setTypeValue] = useState( String( FW_DOT_VALUE ) );
    const [typeTarget, setTypeTarget] = useState( "8" );
    const [comboName, setComboName] = useState( "" );
    const [needs, setNeeds] = useState<Record<string, number>>( {} );
    const [multiplier, setMultiplier] = useState<2 | 3>( 2 );
    const setPlanet = ( change: ( p: NonNullable<Campaign["planet"]> ) => NonNullable<Campaign["planet"]> ) =>
        props.update( ( c ) => { if( c.planet ) c.planet = change( c.planet ); } );

    const addType = () => {
        const name = newTypeName.trim();
        if( !name ) return;
        const typed = Number( typeValue );
        const value = typeValue.trim() !== "" && Number.isFinite( typed ) ? Math.max( 0, typed ) : FW_DOT_VALUE;
        const target = Math.min( 12, Math.max( 2, Math.round( Number( typeTarget ) || 8 ) ) );
        setPlanet( ( p ) => ( { ...p, customDotTypes: p.customDotTypes.concat( { id: "gm-" + generateUUID(), name, value, target } ) } ) );
        setNewTypeName( "" );
    };

    /** Removes a GM dot type with its dots in every area and the GM combinations that need it. */
    const removeType = ( typeId: string ) => setPlanet( ( p ) => {
        const gone = new Set( p.customCombinations.filter( ( combo ) => typeId in combo.needs ).map( ( combo ) => combo.id ) );
        return {
            ...p,
            customDotTypes: p.customDotTypes.filter( ( x ) => x.id !== typeId ),
            customCombinations: p.customCombinations.filter( ( combo ) => !gone.has( combo.id ) ),
            areas: p.areas.map( ( a ) => {
                const dots = a.dots.filter( ( d ) => d.type !== typeId );
                // A GM grouping that named a removed combination drops it; an empty grouping goes back to the default.
                const kept = a.comboOverride?.filter( ( id ) => !gone.has( id ) ) ?? null;
                const comboOverride = kept && kept.length ? kept : null;
                return dots.length === a.dots.length && comboOverride?.length === a.comboOverride?.length ? a : { ...a, dots, comboOverride };
            } ),
        };
    } );

    const addCombination = () => {
        const name = comboName.trim();
        const picked = Object.fromEntries( Object.entries( needs ).filter( ( [, n] ) => n > 0 ) );
        if( !name || Object.keys( picked ).length === 0 ) return;
        const combo: ICampaignCombination = { id: "gm-" + generateUUID(), name, needs: picked, multiplier };
        setPlanet( ( p ) => ( { ...p, customCombinations: p.customCombinations.concat( combo ) } ) );
        setComboName( "" );
        setNeeds( {} );
    };

    return (
        <>
            <h4>The GM's dot types</h4>
            {planet.customDotTypes.length > 0 ? (
                <ul>{planet.customDotTypes.map( ( t ) => (
                    <li key={t.id}>{t.name}: {formatMoney( t.value )} C-bills, destroyed on {t.target}+{" "}
                        <button type="button" className="btn btn-link btn-sm" title="Also removes its dots and the combinations that need it" onClick={() => removeType( t.id )}>Remove</button>
                    </li>
                ) )}</ul>
            ) : null}
            <p>
                <label>Type name <input type="text" value={newTypeName} onChange={( e ) => setNewTypeName( e.currentTarget.value )} /></label>
                <label>Value <input type="number" min={0} step={100000} value={typeValue} onChange={( e ) => setTypeValue( e.currentTarget.value )} /></label>
                <label>Destroyed on <input type="number" min={2} max={12} value={typeTarget} onChange={( e ) => setTypeTarget( e.currentTarget.value )} />+</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addType}>Add dot type</button>
            </p>
            <h4>The GM's combinations</h4>
            {planet.customCombinations.length > 0 ? (
                <ul>{planet.customCombinations.map( ( c ) => (
                    <li key={c.id}>{c.name}: {Object.entries( c.needs ).map( ( [type, n] ) => `${n} ${typeName( type, planet.customDotTypes )}` ).join( ", " )}, pays {c.multiplier === 2 ? "double" : "triple"}{" "}
                        <button type="button" className="btn btn-link btn-sm" onClick={() => setPlanet( ( p ) => ( { ...p, customCombinations: p.customCombinations.filter( ( x ) => x.id !== c.id ) } ) )}>Remove</button>
                    </li>
                ) )}</ul>
            ) : null}
            <p>
                <label>Combination name <input type="text" value={comboName} onChange={( e ) => setComboName( e.currentTarget.value )} /></label>
                <label>
                    Pays{" "}
                    <select value={multiplier} onChange={( e ) => setMultiplier( Number( e.currentTarget.value ) === 3 ? 3 : 2 )}>
                        <option value={2}>double</option>
                        <option value={3}>triple</option>
                    </select>
                </label>
            </p>
            <p className="smaller-text">
                {dotTypes( planet.customDotTypes ).map( ( t ) => (
                    <label key={t.id}>{t.name} <input type="number" min={0} max={9} style={{ width: "3rem" }} value={needs[t.id] ?? 0}
                        onChange={( e ) => { const n = Math.max( 0, Math.min( 9, Math.round( Number( e.currentTarget.value ) || 0 ) ) ); setNeeds( { ...needs, [t.id]: n } ); }} /></label>
                ) )}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addCombination}>Add combination</button>
            </p>
        </>
    );
}


/** NOT OFFICIAL, the ruleset's description and its credit. */
function RulesetCredit( props: { id: string } ): JSX.Element | null {
    const ruleset = findSpecialRuleset( props.id );
    if( !ruleset ) return null;
    return (
        <div>
            <p><span className="not-official">NOT OFFICIAL</span> <strong>{ruleset.name}</strong></p>
            <p className="smaller-text">{ruleset.description}</p>
            <p className="smaller-text">Source: {ruleset.source.title}.</p>
        </div>
    );
}

export default function CampaignPlanet( props: { appGlobals: IAppGlobals; id: string | undefined } ): JSX.Element {
    const { loaded, campaign, error, update } = useCampaign( props.appGlobals, props.id );
    const [areaName, setAreaName] = useState( "" );
    const [message, setMessage] = useState( "" );
    useEffect( () => { props.appGlobals.makeDocumentTitle( "Campaign planet" ); }, [props.appGlobals] );

    const page = ( body: JSX.Element ) => (
        <UIPage current="game-management-campaigns" appGlobals={props.appGlobals}><div className="campaign-page">{body}</div></UIPage>
    );
    if( !loaded ) return page( <p>Loading...</p> );
    if( !campaign ) return page( <TextSection label="Planet economy"><p>{error ? `This campaign cannot be opened: ${error}.` : "No campaign with this id."} <Link to="../.." relative="path">Back to campaigns</Link></p></TextSection> );
    const back = <p><Link to=".." relative="path">Back to {campaign.name}</Link></p>;
    if( !campaign.rulesetIds.includes( "fw-economics" ) ) {
        return page( <TextSection label="Planet economy">{back}<p>Tick Future Wars: Economics in the campaign's rulesets (Change, on the campaign page) to play the planet's economy.</p></TextSection> );
    }
    const planet = campaign.planet;
    if( !planet ) return page( <TextSection label="Planet economy">{back}<p>This campaign has no planet yet: set one in Setup on the campaign page.</p></TextSection> );
    const damage = campaign.rulesetIds.includes( "fw-economic-damage" );

    const addArea = () => {
        const name = areaName.trim();
        if( !name ) return;
        update( ( c ) => { if( c.planet ) c.planet = { ...c.planet, areas: c.planet.areas.concat( { id: generateUUID(), name, terrain: "", controllerSideId: null, dots: [], comboOverride: null } ) }; } );
        setAreaName( "" );
    };

    const seed = async () => {
        const data = await loadStarSystemSites();
        const name = planet.name.trim().toLowerCase();
        const sites = data.sites.filter( ( s ) => s.systemId === planet.systemId && s.planet.trim().toLowerCase() === name
            && !planet.areas.some( ( a ) => a.siteId === s.id ) );
        if( sites.length === 0 ) {
            setMessage( planet.systemId ? "No Objectives sites left to seed for this planet." : "The planet is not in the star catalog, so it has no Objectives sites." );
            return;
        }
        setMessage( `Seeded ${sites.length} area${sites.length === 1 ? "" : "s"} from Objectives.` );
        update( ( c ) => {
            if( !c.planet ) return;
            c.planet = { ...c.planet, areas: c.planet.areas.concat( sites.map( ( site ) => ( {
                id: generateUUID(), name: site.name, terrain: "", controllerSideId: null, comboOverride: null, siteId: site.id,
                dots: [{ id: generateUUID(), type: site.heavy ? "heavy-manufacturing" : "light-manufacturing", destroyed: false }],
            } ) ) ) };
            c.addLog( `Seeded ${sites.length} area${sites.length === 1 ? "" : "s"} from Objectives: ${sites.map( ( s ) => s.name ).join( ", " )}` );
        } );
    };

    return page(
        <>
            <TextSection label={`${planet.name}: planet economy`}>
                {back}
                <p className="smaller-text">Payday comes every three campaign months; advance the campaign from its page.</p>
                {planet.areas.map( ( area ) => <AreaPanel key={area.id} campaign={campaign} area={area} update={update} damage={damage} /> )}
                <p>
                    <label>New area <input type="text" value={areaName} onChange={( e ) => setAreaName( e.currentTarget.value )} /></label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addArea}>Add area</button>{" "}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={seed}>Seed dots from Objectives</button>
                </p>
                {message ? <p className="smaller-text">{message}</p> : null}
            </TextSection>
            <TextSection label="The GM's tables">
                <GmTables campaign={campaign} update={update} />
            </TextSection>
            <TextSection label="Rules">
                <RulesetCredit id="fw-economics" />
                {damage ? <RulesetCredit id="fw-economic-damage" /> : null}
            </TextSection>
        </>,
    );
}
