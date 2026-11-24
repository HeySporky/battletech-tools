import React, { useState, type JSX } from 'react';
import { Campaign, CAMPAIGN_SIDE_ROLES } from '../../../../classes/campaign/campaign';
import { CampaignSideRole } from '../../../../classes/campaign/campaign-types';
import PlanetPicker from './planet-picker';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A campaign's setup after it is made (review M4): its name and start date, its sides (rename, change role, add one)
 * and its planet (set, change or pick from a star system; the areas stay with it).
 */
export default function CampaignSetup( props: { campaign: Campaign; update: ( change: ( c: Campaign ) => void ) => void } ): JSX.Element {
    const { campaign, update } = props;
    const [date, setDate] = useState( campaign.startDate );
    const [sideName, setSideName] = useState( "" );
    const [sideRole, setSideRole] = useState<CampaignSideRole>( "other" );

    const changeSide = ( id: string, change: { name?: string; role?: CampaignSideRole } ) =>
        update( ( c ) => { c.sides = c.sides.map( ( s ) => ( s.id === id ? { ...s, ...change } : s ) ); } );

    const setPlanet = ( systemId: string | null, name: string ) => update( ( c ) => {
        if( c.planet ) {
            const planet = c.planet;
            // An empty planet with nothing on it goes; one with areas keeps them under the new name.
            const bare = planet.areas.length === 0 && planet.customDotTypes.length === 0 && planet.customCombinations.length === 0;
            c.planet = !systemId && !name.trim() && bare ? null : { ...planet, systemId, name };
        } else if( systemId || name.trim() ) {
            c.planet = { systemId, name, areas: [], customDotTypes: [], customCombinations: [] };
        }
    } );

    return (
        <div data-testid="campaign-setup">
            <p>
                <label>Campaign name <input type="text" value={campaign.name} onChange={( e ) => { const name = e.currentTarget.value; update( ( c ) => { c.name = name; } ); }} /></label>{" "}
                <label>Start date <input type="text" value={date} placeholder="3025-01-01" onChange={( e ) => {
                    const value = e.currentTarget.value;
                    setDate( value );
                    if( ISO_DATE.test( value ) ) update( ( c ) => { c.startDate = value; } );
                }} /></label>
                {ISO_DATE.test( date ) ? null : <span className="smaller-text"> Type a whole date, such as 3025-01-01.</span>}
            </p>
            <h4>Sides</h4>
            {campaign.sides.map( ( side ) => (
                <p key={side.id}>
                    <label>Name <input type="text" aria-label={"Name of " + side.name} value={side.name}
                        onChange={( e ) => changeSide( side.id, { name: e.currentTarget.value } )} /></label>{" "}
                    <label>
                        Role{" "}
                        <select aria-label={"Role of " + side.name} value={side.role} onChange={( e ) => changeSide( side.id, { role: e.currentTarget.value as CampaignSideRole } )}>
                            {CAMPAIGN_SIDE_ROLES.map( ( role ) => <option key={role} value={role}>{role}</option> )}
                        </select>
                    </label>
                </p>
            ) )}
            <p>
                <label>Side name <input type="text" aria-label="New side name" value={sideName} onChange={( e ) => setSideName( e.currentTarget.value )} /></label>{" "}
                <label>
                    Role{" "}
                    <select aria-label="New side role" value={sideRole} onChange={( e ) => setSideRole( e.currentTarget.value as CampaignSideRole )}>
                        {CAMPAIGN_SIDE_ROLES.map( ( role ) => <option key={role} value={role}>{role}</option> )}
                    </select>
                </label>{" "}
                <button type="button" className="btn btn-secondary btn-sm" disabled={!sideName.trim()} onClick={() => {
                    const name = sideName.trim();
                    update( ( c ) => { c.addSide( name, sideRole ); } );
                    setSideName( "" );
                }}>Add side</button>
            </p>
            <h4>Planet</h4>
            <PlanetPicker systemId={campaign.planet?.systemId ?? null} name={campaign.planet?.name ?? ""} onChange={setPlanet} />
        </div>
    );
}
