import React, { useEffect, useState, type JSX } from 'react';
import { FaBook, FaEye, FaPlusCircle } from "react-icons/fa";
import { BattleMech } from "../../classes/battlemech";
import { loadBundledMechDesign, loadBundledMechIndex } from "../../data/bundled-mechs";
import type { IBundledDesignHeader } from "../../utils/bundled-designs";
import { paginate } from '../../utils/paginate';
import { getSSWRulesLevelLabel } from '../../utils/sswUtils';
import type { IAppGlobals } from '../app-router';
import InputField from './form_elements/input_field';
import SearchResultsPager from './search-results-pager';
const Book = FaBook as any;
const Eye = FaEye as any;
const PlusCircle = FaPlusCircle as any;

const PAGE_SIZE = 25;

/**
 * The bundled 'Mechs (#241), filtered by name and Skunk Werks rules level and paged. Each design is imported only when
 * the user views or adds it. Every one was checked at build time against the Master Unit List's BV, or the file's.
 * `onTRO` adds a TRO button (#374).
 */
export default function BundledMechList( props: { appGlobals: IAppGlobals; onView( mech: BattleMech ): void; onAdd( mech: BattleMech ): void; onTRO?( mech: BattleMech ): void } ): JSX.Element {
    const [designs, setDesigns] = useState<IBundledDesignHeader[] | null>(null);
    const [page, setPage] = useState(0);
    // Its own filter, on Skunk Werks' rules levels: the app setting with a similar name is the creators' rules level.
    const [rulesLevel, setRulesLevel] = useState(-1);
    const [, setUpdated] = useState(0);
    useEffect( () => {
        let live = true;
        loadBundledMechIndex().then( (index) => { if( live ) setDesigns( index ); } )
            .catch( (error) => console.error("Unable to load the bundled 'Mechs", error) );
        return () => { live = false; };
    }, [] );

    const settings = props.appGlobals.appSettings;
    const save = ( change: () => void ) => {
        change();
        props.appGlobals.saveAppSettings( settings );
        setPage( 0 );
        setUpdated( (count) => count + 1 );
    };
    const name = settings.mechNameFilter.trim().toLowerCase();
    const shown = ( designs ?? [] ).filter( (design) => ( !name || (design.name + " " + design.model).toLowerCase().includes( name ) )
        && ( rulesLevel < 0 || design.rulesLevel === rulesLevel ) );
    const resultsPage = paginate( shown, page, PAGE_SIZE );
    const open = ( design: IBundledDesignHeader, then: ( mech: BattleMech ) => void ) => ( e: React.MouseEvent<HTMLButtonElement> ) => {
        e.preventDefault();
        loadBundledMechDesign( design ).then( then ).catch( (error) => console.error("Unable to load " + design.name, error) );
    };

    return (
        <>
            <div className="row">
                <div className="col">
                    <InputField type="search" placeholder="Filter" value={settings.mechNameFilter}
                        onChange={(e: React.FormEvent<HTMLInputElement>) => { const value = e.currentTarget.value; save( () => { settings.mechNameFilter = value; } ); }} />
                </div>
                <div className="col">
                    <label>
                        <select aria-label="Rules level" value={rulesLevel}
                            onChange={(e) => { setRulesLevel( +e.currentTarget.value ); setPage( 0 ); }}>
                            {[-1, 0, 1, 2, 3, 4].map( (level) => <option key={level} value={level}>{getSSWRulesLevelLabel( level )}</option> )}
                        </select>
                    </label>
                </div>
            </div>
            <SearchResultsPager page={resultsPage} onGo={setPage} />
            <table className="table">
                <thead>
                    <tr>
                        <th>Make</th>
                        <th className="min-width no-wrap text-left">Tech</th>
                        <th className="min-width no-wrap text-center">Rules</th>
                        <th className="min-width no-wrap text-center">Tonnage</th>
                        <th className="min-width no-wrap text-center">BV2</th>
                        <th className="min-width no-wrap text-center"><span className="visually-hidden">Actions</span></th>
                    </tr>
                </thead>
                <tbody>
                    {designs && shown.length === 0 ? (
                        <tr><td className="text-center" colSpan={6}>There are no 'mechs found with your filter preferences</td></tr>
                    ) : null}
                    {!designs ? <tr><td className="text-center" colSpan={6}>Loading...</td></tr> : null}
                    {resultsPage.items.map( (design) => (
                        <tr key={design.id}>
                            <td>{design.name} {design.model}</td>
                            <td className="min-width no-wrap text-left">{design.tech}</td>
                            <td className="min-width no-wrap text-left">{getSSWRulesLevelLabel( design.rulesLevel, true )}</td>
                            <td className="min-width no-wrap text-center">{design.tons}</td>
                            <td className="min-width no-wrap text-center">{design.bv}</td>
                            <td className="min-width no-wrap text-center">
                                <button className="btn btn-sm btn-primary" onClick={open( design, props.onView )} title={"View " + design.name + " " + design.model}><Eye /></button>
                                {props.onTRO ? <button className="btn btn-sm btn-primary" onClick={open( design, props.onTRO )} title={"Technical Readout of " + design.name + " " + design.model} aria-label={"TRO " + design.name + " " + design.model}><Book /></button> : null}
                                <button className="btn btn-sm btn-primary" onClick={open( design, props.onAdd )} title={"Add " + design.name + " " + design.model}><PlusCircle /></button>
                            </td>
                        </tr>
                    ) )}
                </tbody>
            </table>
            <SearchResultsPager page={resultsPage} onGo={setPage} below />
        </>
    );
}
