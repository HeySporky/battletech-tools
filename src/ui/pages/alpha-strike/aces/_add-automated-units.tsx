import React, { type JSX, useState } from 'react';
import { IASMULUnit } from '../../../../classes/alpha-strike-unit';
import { searchBundledMUL } from '../../../../utils';
import { newMULSearchFilters } from '../../../../utils/mulSearchFilters';

const maxResults = 20;

interface IAcesAddAutomatedUnitsProps {
    groups: string[];
    onAdd: ( record: IASMULUnit, skill: number, groupIndex: number ) => void;
}

/** Searches the MUL and adds the chosen unit to the automated force mid-game. */
export default function AcesAddAutomatedUnits( props: IAcesAddAutomatedUnitsProps ): JSX.Element {
    const [ term, setTerm ] = useState( "" );
    const [ skill, setSkill ] = useState( 4 );
    const [ groupIndex, setGroupIndex ] = useState( 0 );
    const [ results, setResults ] = useState<IASMULUnit[]>( [] );

    const search = async () => {
        const trimmed = term.trim();
        if( !trimmed ) {
            setResults( [] );
            return;
        }
        const found = await searchBundledMUL( newMULSearchFilters( { term: trimmed, sources: [ "mul2", "custom" ] } ) );
        setResults( found.slice( 0, maxResults ) );
    };

    return (
        <details>
            <summary>Add units during play</summary>
            <div className="aces-inline">
                <input type="text" aria-label="Search the MUL" placeholder="Unit name" value={term}
                    onChange={( e ) => setTerm( e.currentTarget.value )}
                    onKeyDown={( e ) => { if( e.key === "Enter" ) void search(); }} />
                <button className="btn btn-secondary btn-sm" onClick={() => void search()}>Search</button>
                <label>Skill{" "}
                    <select aria-label="Skill" value={skill} onChange={( e ) => setSkill( +e.currentTarget.value )}>
                        {[ 2, 3, 4, 5, 6 ].map( ( value ) => <option key={value} value={value}>{value}</option> )}
                    </select>
                </label>
                {props.groups.length > 1 ? (
                    <label>Group{" "}
                        <select aria-label="Group" value={groupIndex} onChange={( e ) => setGroupIndex( +e.currentTarget.value )}>
                            {props.groups.map( ( name, index ) => <option key={index} value={index}>{name}</option> )}
                        </select>
                    </label>
                ) : null}
            </div>
            {results.length > 0 ? (
                <ul className="aces-muted">
                    {results.map( ( record, index ) => {
                        const name = ( record.Name ?? "" ) + ( record.Variant ? " " + record.Variant : "" );
                        return (
                            <li key={( record.Id ?? "" ) + "-" + index}>
                                {name} - {record.BFType} - {record.BFPointValue} PV{" "}
                                <button className="btn btn-primary btn-sm" aria-label={"Add " + name}
                                    onClick={() => props.onAdd( record, skill, groupIndex )}>Add</button>
                            </li>
                        );
                    } )}
                </ul>
            ) : null}
        </details>
    );
}
