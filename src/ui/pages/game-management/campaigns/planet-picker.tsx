import React, { useEffect, useState, type JSX } from 'react';
import { IStarPlanet, IStarSystemIndexEntry, readSourced } from '../../../../data/star-systems/star-system-types';
import { getStarSystemIndex, loadStarSystemDetail } from '../../../../data/star-systems/star-systems';
import SystemSearch from './system-search';

const planetName = ( planet: IStarPlanet ): string => String( readSourced( planet.name )?.value ?? "" );

/**
 * The campaign planet: picked from a star system (its main planet first, then any of its planets) or typed as free
 * text. Shared by the new-campaign form and the campaign's Setup section.
 */
export default function PlanetPicker( props: { systemId: string | null; name: string; onChange: ( systemId: string | null, name: string ) => void } ): JSX.Element {
    // The planets of the system they were loaded for.
    const [loaded, setLoaded] = useState<{ systemId: string; planets: IStarPlanet[] } | null>( null );
    const [systemName, setSystemName] = useState<string | null>( null );
    const { systemId, onChange } = props;

    // A system set before this form opened (the Setup section) lists its planets too.
    useEffect( () => {
        if( !systemId ) return;
        let live = true;
        loadStarSystemDetail( systemId ).then( ( detail ) => { if( live && detail ) setLoaded( { systemId, planets: detail.planets } ); } );
        return () => { live = false; };
    }, [systemId] );

    // A system just picked takes its main planet.
    const pick = ( system: IStarSystemIndexEntry ) => {
        setSystemName( system.name );
        onChange( system.id, props.name );
        loadStarSystemDetail( system.id ).then( ( detail ) => {
            if( !detail ) return;
            setLoaded( { systemId: system.id, planets: detail.planets } );
            const main = detail.planets.find( ( p ) => p.sysPos === detail.primarySlot ) ?? detail.planets[0];
            onChange( system.id, main ? planetName( main ) : "" );
        } );
    };
    const planets = loaded && loaded.systemId === systemId ? loaded.planets : [];
    const shownSystem = systemName ?? ( systemId ? getStarSystemIndex().find( ( s ) => s.id === systemId )?.name ?? systemId : null );

    return (
        <>
            <SystemSearch label="Star system" onPick={pick} />
            {systemId ? (
                <p>
                    System: <strong>{shownSystem}</strong>{" "}
                    <button type="button" className="btn btn-link btn-sm" onClick={() => { setSystemName( null ); onChange( null, "" ); }}>Clear</button>{" "}
                    <label>
                        Planet{" "}
                        <select value={props.name} onChange={( e ) => onChange( systemId, e.currentTarget.value )}>
                            {planets.some( ( p ) => planetName( p ) === props.name ) || !props.name ? null : <option value={props.name}>{props.name}</option>}
                            {planets.map( ( p ) => <option key={planetName( p ) + p.sysPos} value={planetName( p )}>{planetName( p )}</option> )}
                        </select>
                    </label>
                </p>
            ) : (
                <p><label>Planet name <input type="text" value={props.name} placeholder="or pick a star system" onChange={( e ) => onChange( null, e.currentTarget.value )} /></label></p>
            )}
        </>
    );
}
