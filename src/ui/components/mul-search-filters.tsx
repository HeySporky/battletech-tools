import * as React from 'react';
import { FaPlus, FaTrash } from "react-icons/fa";
import { MUL_SOURCE_OPTIONS } from '../../data/mul-list-items';
import { MULSource } from '../../classes/alpha-strike-unit';
import { IAbilityCodeCount } from '../../utils/mulAbilities';
import { changeMULSearchFilters, IMULSearchFilters, isMULEraOffered, isMULTechOffered, isMULTypeOffered } from '../../utils/mulSearchFilters';
import { getMULAerospaceRoles, getMULEraAliases, getMULEraIDs, getMULEraLabel, getMULFactionIDs, getMULFactionLabels, getMULGroundRoles, getMULTypeIDs, getMULTypeLabel } from '../../utils/mulUtilities';
import InputField from './form_elements/input_field';
import { STALE_WARNING } from './game-settings-block';
import SpecialRulesetsStep from './special-rulesets-step';
import UnitStandingBadge from './unit-standing-badge';
import { UNIT_STANDING_ORDER, UNIT_STANDINGS, UnitStanding } from '../../utils/unit-standing';
import type { JSX } from "react";
const Plus = FaPlus as any;
const Trash = FaTrash as any;

const MAX_ABILITY_SUGGESTIONS = 12;

// The Master Unit List search filters, shared by the Alpha Strike and Classic rosters. Each roster keeps its own
// IMULSearchFilters and runs the search; `search` is false for edits that do not change the results (typing in the
// faction or ability pickers). Special Rulesets come first (#324): they trim the Tech, Type and Era lists, and a change
// that leaves a later filter's value unoffered moves it, saying so in one line until the filters change again.
export default class MULSearchFilters extends React.Component<IMULSearchFiltersProps, { notice: { text: string; made: string } }> {

    state = { notice: { text: "", made: "" } };

    private change = ( changes: Partial<IMULSearchFilters>, search: boolean = true ): void => {
        const { filters, moves } = changeMULSearchFilters( this.props.filters, changes );
        this.setState({ notice: { text: moves.join( "; " ), made: JSON.stringify( filters ) } });
        this.props.onChange( filters, search );
    }

    // Ticking or unticking each id in turn, as the settings block does.
    private toggleRulesets = ( ids: string[] ): void => {
        const rulesets = ids.reduce( (ticked, id) => ticked.includes( id ) ? ticked.filter( (existing) => existing !== id ) : ticked.concat( id ), this.props.filters.rulesets );
        this.change({ rulesets });
    }

    private getFactionSuggestions = (): number[] => {
        const term = this.props.filters.factionSearchTerm.trim().toLowerCase();
        if( term.length < 3 ) {
            return [];
        }
        return getMULFactionIDs().filter( (factionID) =>
            !this.props.filters.factions.includes( factionID )
            && getMULFactionLabels( factionID ).toLowerCase().includes( term ) );
    }

    private getAbilitySuggestions = (): IAbilityCodeCount[] => {
        const term = this.props.filters.abilitySearchTerm.trim().toUpperCase();
        if( !term || !this.props.abilityCodes ) {
            return [];
        }
        const selectedCodes = this.props.filters.abilities.map( (filter) => filter.replace(/^!/, "") );
        return this.props.abilityCodes
            .filter( (ability) => ability.code.startsWith( term ) && !selectedCodes.includes( ability.code ) )
            .slice( 0, MAX_ABILITY_SUGGESTIONS );
    }

    private addAbilityFilter = ( code: string, exclude: boolean ): void => {
        this.change({
            abilities: this.props.filters.abilities
                .filter( (filter) => filter.replace(/^!/, "") !== code )
                .concat( exclude ? "!" + code : code ),
            abilitySearchTerm: "",
        });
    }

    private toggleSource = ( source: MULSource, checked: boolean ): void => {
        const ticked = this.props.filters.sources.filter( (existing) => existing !== source ).concat( checked ? [source] : [] );
        this.change({ sources: MUL_SOURCE_OPTIONS.map( (option) => option.value ).filter( (value) => ticked.includes( value ) ) });
    }

    private toggleStanding = ( standing: UnitStanding, checked: boolean ): void => {
        const ticked = this.props.filters.standings.filter( (existing) => existing !== standing ).concat( checked ? [standing] : [] );
        this.change({ standings: UNIT_STANDING_ORDER.filter( (value) => ticked.includes( value ) ) });
    }

    render = (): JSX.Element => {
        const filters = this.props.filters;
        const allTypeOptions = this.props.typeOptions ?? getMULTypeIDs().map( (id) => ({ id, label: getMULTypeLabel( id ) }) );
        const typeOptions = allTypeOptions.filter( (option) => isMULTypeOffered( option.id, filters.rulesets ) );
        const techOffered = ( tech: string ) => isMULTechOffered( tech, filters.rulesets );
        const eraOffered = ( eraID: number ) => isMULEraOffered( eraID, filters.tech, filters.rulesets );
        const eraAliases = getMULEraAliases().filter( (alias) => eraOffered( alias.id ) );
        // A stored value the lists no longer offer (a search saved before, or a roster button's type) stays selected,
        // flagged as the settings block flags one (call 9), until the user picks another.
        const stale = ( offered: boolean, value: string | number, label: string ) => offered ? null
            : <option value={value}>{label} ({STALE_WARNING})</option>;
        const notice = this.state.notice.made === JSON.stringify( filters ) ? this.state.notice.text : "";
        const factionSuggestions = this.getFactionSuggestions();
        const abilitySuggestions = this.getAbilitySuggestions();

        return (
<fieldset className="fieldset">
    <div className="row">
        <div className="col-md-12 text-center">
            <SpecialRulesetsStep rulesets={filters.rulesets} notice={notice} onToggle={this.toggleRulesets} />
            {notice ? <p className="smaller-text" role="status">{notice}</p> : null}
        </div>
    </div>
    <div className="row">
        <div className="col-md-6 text-center">
            <InputField
                type="search"
                onChange={(event: React.FormEvent<HTMLInputElement>) => this.change({ term: event.currentTarget.value })}
                value={filters.term}
                label="Search Terms"
            />
        </div>
        <div className="col-md-6 text-center">
            <label>
                Search Rules:<br />
                <select onChange={(event) => this.change({ rules: event.currentTarget.value })} value={filters.rules}>
                    <option value="">All</option>
                    <option value="introductory">Introductory</option>
                    <option value="standard">Standard</option>
                    <option value="advanced">Advanced</option>
                    <option value="experimental">Experimental</option>
                </select>
            </label>
        </div>
    </div>
    <div className="row">
        <div className="col-md-6 text-center">
            <label>
                Search Tech:<br />
                <select onChange={(event) => this.change({ tech: event.currentTarget.value })} value={filters.tech}>
                    <option value="">All</option>
                    <option value="inner sphere">Inner Sphere</option>
                    {techOffered( "clan" ) ? <option value="clan">Clan</option> : null}
                    {stale( [ "", "inner sphere", ...( techOffered( "clan" ) ? [ "clan" ] : [] ) ].includes( filters.tech ), filters.tech, filters.tech === "clan" ? "Clan" : filters.tech )}
                </select>
            </label>

            <label>
                Type:<br />
                <select onChange={(event) => this.change({ type: +event.currentTarget.value })} value={filters.type}>
                    {typeOptions.length > 1 ? <option value={0}>All</option> : null}
                    {stale( !filters.type || typeOptions.some( (option) => option.id === filters.type ), filters.type,
                        allTypeOptions.find( (option) => option.id === filters.type )?.label ?? getMULTypeLabel( filters.type ) )}
                    {typeOptions.map( (option) => <option key={option.id} value={option.id}>{option.label}</option> )}
                </select>
            </label>
        </div>
        <div className="col-md-6 text-center">
            <label>
                Era:<br />
                <select onChange={(event) => this.change({ era: +event.currentTarget.value })} value={filters.era}>
                    <option value={0}>All</option>
                    {stale( eraOffered( filters.era ), filters.era, getMULEraLabel( filters.era ) )}
                    {getMULEraIDs().filter( eraOffered ).map( (eraID) => <option key={eraID} value={eraID}>{getMULEraLabel( eraID )}</option> )}
                    {eraAliases.length > 0 ? (
                        <optgroup label="Clan eras">
                            {eraAliases.map( (alias) => <option key={alias.id} value={alias.id}>{alias.label}</option> )}
                        </optgroup>
                    ) : null}
                </select>
            </label>

            <label>
                Role:<br />
                <select onChange={(event) => this.change({ role: event.currentTarget.value })} value={filters.role}>
                    <option value="">All</option>
                    <optgroup label="Ground Unit Roles">
                        {getMULGroundRoles().map( (role) => <option key={role} value={role}>{role}</option> )}
                    </optgroup>
                    <optgroup label="Aerospace Roles">
                        {getMULAerospaceRoles().map( (role) => <option key={role} value={role}>{role}</option> )}
                    </optgroup>
                </select>
            </label>
        </div>
    </div>
    <div className="row">
        <div className="col-md-12 text-center">
            <InputField
                type="search"
                onChange={(event: React.FormEvent<HTMLInputElement>) => this.change({ factionSearchTerm: event.currentTarget.value }, false)}
                value={filters.factionSearchTerm}
                label="Filter Availability By Factions"
                placeholder='Type 3 or more characters to search. MUL uses OR logic for multiple factions.'
            />
        </div>
        <div className="col-md-6 text-center">
            {factionSuggestions.length > 0 ? (
                <div>
                    Add to Faction Filter?<br />
                    {factionSuggestions.map( (factionID) => (
                        <div key={factionID} className="text-left">
                            <button onClick={() => this.change({ factions: filters.factions.concat( factionID ) })} className="btn-sm btn btn-primary" aria-label={"Add " + getMULFactionLabels(factionID) + " to the faction filter"}><Plus /></button>
                            &nbsp;{getMULFactionLabels(factionID)}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
        <div className="col-md-6 text-center">
            {filters.factions.length > 0 ? (
                <div>
                    Current Faction Filter:<br />
                    {filters.factions.map( (factionID) => (
                        <div key={factionID} className="text-left">
                            <button onClick={() => this.change({ factions: filters.factions.filter( (faction) => faction !== factionID ) })} className="btn btn-sm btn-danger" aria-label={"Remove " + getMULFactionLabels(factionID) + " from the faction filter"}><Trash /></button>
                            {getMULFactionLabels(factionID)}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    </div>
    {this.props.abilityCodes ? (
    <div className="row">
        <div className="col-md-12 text-center">
            <InputField
                type="search"
                onChange={(event: React.FormEvent<HTMLInputElement>) => this.change({ abilitySearchTerm: event.currentTarget.value }, false)}
                value={filters.abilitySearchTerm}
                label="Filter By Special Abilities"
                placeholder='Type an ability code, such as ECM, IF or TAG.'
            />
        </div>
        <div className="col-md-6 text-center">
            {abilitySuggestions.length > 0 ? (
                <div>
                    Add to Ability Filter?<br />
                    {abilitySuggestions.map( (ability) => (
                        <div key={ability.code} className="text-left">
                            <button onClick={() => this.addAbilityFilter(ability.code, false)} className="btn-sm btn btn-primary" title={"Only units with " + ability.code} aria-label={"Has " + ability.code}>Has</button>
                            <button onClick={() => this.addAbilityFilter(ability.code, true)} className="btn-sm btn btn-secondary" title={"Only units without " + ability.code} aria-label={"Lacks " + ability.code}>Lacks</button>
                            &nbsp;{ability.code} <span className="small-text">({ability.count} units)</span>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
        <div className="col-md-6 text-center">
            {filters.abilities.length > 0 ? (
                <div>
                    Current Ability Filter:<br />
                    {filters.abilities.map( (filter) => {
                        const label = filter.startsWith("!") ? "Lacks " + filter.substring(1) : "Has " + filter;
                        return (
                            <div key={filter} className="text-left">
                                <button onClick={() => this.change({ abilities: filters.abilities.filter( (existing) => existing !== filter ) })} className="btn btn-sm btn-danger" title={"Remove " + label + " from the filter"} aria-label={"Remove " + label + " from the filter"}><Trash /></button>
                                {label}
                            </div>
                        )
                    })}
                </div>
            ) : null}
        </div>
    </div>
    ) : null}
    <div className="row">
        <div className="col-md-12 text-center">
            <div role="group" aria-label="Unit Lists">
                Unit Lists:<br />
                {MUL_SOURCE_OPTIONS.map( (option) => {
                    const checked = filters.sources.includes( option.value );
                    return (
                        <label key={option.value} title={option.description} className="me-2">
                            <input
                                type="checkbox"
                                name={this.props.idPrefix + "MULSources"}
                                value={option.value}
                                checked={checked}
                                // At least one list stays ticked, or every search would come back empty.
                                disabled={checked && filters.sources.length === 1}
                                onChange={(event) => this.toggleSource( option.value, event.currentTarget.checked )}
                            />&nbsp;{option.label}
                        </label>
                    );
                })}
            </div>
            <div className="small-text">
                {MUL_SOURCE_OPTIONS.filter( (option) => filters.sources.includes( option.value ) ).map( (option) => option.description ).join( " " )}
                {this.props.sourcesNote}
            </div>
        </div>
    </div>
    <div className="row">
        <div className="col-md-12 text-center">
            <div role="group" aria-label="Standing">
                Standing:<br />
                {UNIT_STANDING_ORDER.map( (standing) => {
                    const checked = filters.standings.includes( standing );
                    return (
                        <label key={standing} title={UNIT_STANDINGS[standing].description} className="me-2">
                            <input
                                type="checkbox"
                                name={this.props.idPrefix + "MULStandings"}
                                value={standing}
                                checked={checked}
                                // At least one standing stays ticked, as with the unit lists.
                                disabled={checked && filters.standings.length === 1}
                                onChange={(event) => this.toggleStanding( standing, event.currentTarget.checked )}
                            />&nbsp;<UnitStandingBadge standing={standing} />{UNIT_STANDINGS[standing].label}
                        </label>
                    );
                })}
            </div>
            <div className="small-text">
                Canon is what the Master Unit List or MUL 1.0 lists. A fan-made unit keeps its rules level: tick Canon alone for an event that takes only official units.
            </div>
        </div>
    </div>
</fieldset>
        );
    }
}

interface IMULSearchFiltersProps {
    filters: IMULSearchFilters;
    onChange( filters: IMULSearchFilters, search: boolean ): void;
    /** Prefixes the Unit Lists checkboxes' name, e.g. "alphaStrike" gives "alphaStrikeMULSources". */
    idPrefix: string;
    /** The Type list's options (MUL type ids, or ids the caller maps itself); every MUL type when left out. */
    typeOptions?: { id: number; label: string }[];
    /** The special ability picker shows only when given (Alpha Strike). */
    abilityCodes?: IAbilityCodeCount[];
    sourcesNote?: React.ReactNode;
}
