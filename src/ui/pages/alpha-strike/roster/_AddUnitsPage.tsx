import * as React from 'react';
import { FaBars, FaEye, FaPlus } from "react-icons/fa";
import { Link } from 'react-router';
import { AlphaStrikeUnit, getMULDisplayName, IASMULUnit } from '../../../../classes/alpha-strike-unit';
import { getMULRecordStanding } from '../../../../utils/unit-standing';
import UnitStandingBadge, { UnitStandingLegend } from '../../../components/unit-standing-badge';
import { BattleMech } from '../../../../classes/battlemech';
import AerospaceFighter from '../../../../classes/aerospace-fighter';
import InfantryPlatoon from '../../../../classes/infantry-platoon';
import BattleArmor from '../../../../classes/battle-armor';
import ProtoMech from '../../../../classes/protomech';
import MicroMech from '../../../../classes/micro-mech';
import Walker from '../../../../classes/walker';
import { loadMULListItems, MUL_SOURCE_LABELS } from '../../../../data/mul-list-items';
import { getMULASSearchResults } from '../../../../utils';
import { countAbilityCodes, IAbilityCodeCount } from '../../../../utils/mulAbilities';
import { getMULEraLabel } from '../../../../utils/mulUtilities';
import { filterMULByRulesets, filterMULByStanding, IMULSearchFilters } from '../../../../utils/mulSearchFilters';
import { IAppGlobals } from '../../../app-router';
import MULSearchFilters from '../../../components/mul-search-filters';
import SearchResultsPager from '../../../components/search-results-pager';
import TextSection from '../../../components/text-section';
import CurrentForceList from './_CurrentForceList';
import ScanUnitCard from './_ScanUnitCard';
import { generateUUID } from '../../../../utils/generateUUID';
import { paginate } from '../../../../utils/paginate';
import type { JSX } from "react";
const Bars = FaBars as any;
const Eye = FaEye as any;
const Plus = FaPlus as any;

// Rendering every match froze the page once a search returned the whole bundled MUL (~8.7k units).
const SEARCH_RESULTS_PAGE_SIZE = 25;

//TODO: Clearfix Hack for overflowing results
/*
.clearfix::after {
  content: "";
  clear: both;
  display: table;
}

*/

export default class AlphaStrikeAddUnitsView extends React.Component<IAlphaStrikeAddUnitsViewProps, IAlphaStrikeAddUnitsViewState> {

    private searchTimeout: NodeJS.Timeout | null = null;

    // Kept off React state: setState is applied asynchronously, and cached MUL searches can resolve
    // before it lands, which made every search look superseded and left "Searching..." up forever.
    private latestSearchId: string = '';

    private searchResultsHeading = React.createRef<HTMLHeadingElement>();

    constructor( props: IAlphaStrikeAddUnitsViewProps ) {
        super(props)


        this.state = {
          abilityCodes: [],
          searchResults: [],
            contextMenuSearch: -1,
            contextMenuSavedBattleMechs: -1,
            searchSort: 'Name',
            isSearching: false,
            searchPage: 0,
        }
    }

      componentDidMount() {
        // Search on opening even with no filters, so the unit lists show their units (#377).
        void this.updateSearchResults();
        void this.loadAbilityCodes();
      }

    // Suggestions come from the abilities in the unit lists being searched.
    loadAbilityCodes = async (): Promise<void> => {
      const units = await loadMULListItems( this.props.appGlobals.appSettings.alphaStrikeMULSources );
      this.setState({
        abilityCodes: countAbilityCodes( units ),
      });
    }

    componentWillUnmount() {
        // Clean up timeout when component unmounts
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }

    toggleContextMenuSearch = ( searchIndex: number ): void => {
        let newIndex: number = -1;
        if( this.state.contextMenuSearch !== searchIndex) {
          newIndex = searchIndex;
        }

        this.setState({
          contextMenuSearch: newIndex,
          contextMenuSavedBattleMechs: -1,
        })
      }

      toggleContextMenuSavedBattleMechs = ( searchIndex: number ): void => {
        let newIndex: number = -1;
        if( this.state.contextMenuSavedBattleMechs !== searchIndex) {
          newIndex = searchIndex;
        }

        this.setState({
          contextMenuSavedBattleMechs: newIndex,
          contextMenuSearch: -1,
        })
      }

    // The Alpha Strike search keeps its filters in its own flat settings; the shared filter UI works on IMULSearchFilters.
    getSearchFilters = (): IMULSearchFilters => {
        const settings = this.props.appGlobals.appSettings;
        return {
          term: settings.alphaStrikeSearchTerm,
          rules: settings.alphaStrikeSearchRules,
          tech: settings.alphaStrikeSearchTech,
          role: settings.alphaStrikeSearchRole,
          era: settings.alphaStrikeSearchEra,
          type: settings.alphaStrikeSearchType,
          factions: settings.alphaStrikeSearchFactions,
          factionSearchTerm: settings.alphaStrikeFactionSearchTerm,
          abilities: settings.alphaStrikeSearchAbilities,
          abilitySearchTerm: settings.alphaStrikeAbilitySearchTerm,
          sources: settings.alphaStrikeMULSources,
          rulesets: settings.alphaStrikeSearchRulesets,
          standings: settings.alphaStrikeSearchStandings,
        };
    }

    updateSearchFilters = ( filters: IMULSearchFilters, search: boolean ): void => {
        const settings = this.props.appGlobals.appSettings;
        const termChanged = filters.term !== settings.alphaStrikeSearchTerm;
        const sourcesChanged = filters.sources.join() !== settings.alphaStrikeMULSources.join();
        settings.alphaStrikeSearchTerm = filters.term;
        settings.alphaStrikeSearchRules = filters.rules;
        settings.alphaStrikeSearchTech = filters.tech;
        settings.alphaStrikeSearchRole = filters.role;
        settings.alphaStrikeSearchEra = filters.era;
        settings.alphaStrikeSearchType = filters.type;
        settings.alphaStrikeSearchFactions = filters.factions;
        settings.alphaStrikeFactionSearchTerm = filters.factionSearchTerm;
        settings.alphaStrikeSearchAbilities = filters.abilities;
        settings.alphaStrikeAbilitySearchTerm = filters.abilitySearchTerm;
        settings.alphaStrikeMULSources = filters.sources;
        settings.alphaStrikeSearchRulesets = filters.rulesets;
        settings.alphaStrikeSearchStandings = filters.standings;
        this.props.appGlobals.saveAppSettings( settings );

        if( sourcesChanged ) {
          void this.loadAbilityCodes();
        }
        if( !search ) {
          return;
        }
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        if( termChanged ) {
          // Wait for the user to stop typing (500ms delay)
          this.searchTimeout = setTimeout(() => {
              this.updateSearchResults();
          }, 500);
        } else {
          this.updateSearchResults();
        }
    }

    updateSearchResults = async (): Promise<void> => {

      const currentSearchId = generateUUID();
      this.latestSearchId = currentSearchId;

      this.setState({
        isSearching: true
      });

      try {
        let data: IASMULUnit[] = await getMULASSearchResults(
          this.props.appGlobals.appSettings.alphaStrikeSearchTerm,
          this.props.appGlobals.appSettings.alphaStrikeSearchRules,
          this.props.appGlobals.appSettings.alphaStrikeSearchTech,
          this.props.appGlobals.appSettings.alphaStrikeSearchRole,
          this.props.appGlobals.appSettings.alphaStrikeSearchEra,
          this.props.appGlobals.appSettings.alphaStrikeSearchType,
          this.props.appGlobals.appSettings.alphaStrikeSearchFactions,
          !navigator.onLine,
          false,
          this.props.appGlobals,
          this.props.appGlobals.appSettings.alphaStrikeSearchAbilities,
        );
        // The live search knows nothing of Special Rulesets (#324): their units are left out here.
        data = filterMULByRulesets( data, this.props.appGlobals.appSettings.alphaStrikeSearchRulesets );
        data = filterMULByStanding( data, this.props.appGlobals.appSettings.alphaStrikeSearchStandings );

        if(this.latestSearchId !== currentSearchId) {
          // Don't set isSearching to false here - a newer search is running
          return;
        }

      data.sort((a: IASMULUnit, b: IASMULUnit): number => {
        const primarySort = this.state.searchSort;
        const secondarySort = this.state.searchSort === 'Name'
            ? 'BFPointValue'
            : 'Name';

        /* primary sort */
        if (a[primarySort] < b[primarySort]) return -1;
        else if (a[primarySort] > b[primarySort]) return 1;

        /* fallback sort to break primary sort ties */
        if (a[secondarySort] < b[secondarySort]) return -1;
        else if (a[secondarySort] > b[secondarySort]) return 1;

        return 0;
    });

    //   console.log("updateSearchResults data", data);
      this.setState({
        searchResults: data,
        contextMenuSearch: -1,
        isSearching: false,
        searchPage: 0,
      });

      const appSettings = this.props.appGlobals.appSettings;

      appSettings.alphasStrikeCachedSearchResults = data;
      // Search results stay in memory; saveAppSettings persists preferences and user work, not
      // deployment data that could hide fresher bundled MUL records after a reload.
      this.props.appGlobals.saveAppSettings( appSettings );

      } catch (error) {
        console.error("Search failed:", error);
        // Only turn off loading if this was the most recent search
        if(this.latestSearchId === currentSearchId) {
          this.setState({
            isSearching: false,
          });
        }
      }
    }

    addToGroup = (
      mulUnit: AlphaStrikeUnit,
      groupIndex: number = 0,
    ): void => {
      if( this.props.appGlobals.currentASForce ) {
        this.props.appGlobals.currentASForce.addToGroup( mulUnit, groupIndex );

        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        this.setState({
          contextMenuSearch: -1,
        });


      }
    }


    goToSearchPage = ( page: number ): void => {
        this.setState({
          searchPage: page,
          contextMenuSearch: -1,
        });
        this.searchResultsHeading.current?.scrollIntoView({ block: "nearest" });
    }

    handleSort = ({ target: { value } }: any) => {
        this.setState({ searchSort: value }, () => this.updateSearchResults());
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentASForce) {
        return <></>
      }

        const resultsPage = paginate( this.state.searchResults, this.state.searchPage, SEARCH_RESULTS_PAGE_SIZE );

        return(
            <>
                  <div className="row">
    <div className="col">
      <CurrentForceList
          appGlobals={this.props.appGlobals}
          // openAddingUnits={this.openAddingUnits}
          openEditUnit={this.props.openEditUnit}
      />
    </div>
    <div className="col">
        <TextSection
            label="Search for Units"
        >
            <div className="small-text text-center">
                We integrate with the <a href="https://masterunitlist.battletech.com/" target="_blank" rel="noopener noreferrer">Master Unit List</a> to make sure that all the stats are as official and as up to date as possible.
            </div>
{navigator && navigator.onLine ? (
    <>

<MULSearchFilters
    filters={this.getSearchFilters()}
    onChange={this.updateSearchFilters}
    idPrefix="alphaStrike"
    abilityCodes={this.state.abilityCodes}
    sourcesNote={this.props.appGlobals.appSettings.developerMenu ? (
      <>&nbsp;<Link to={`${process.env.PUBLIC_URL}/custom-mul-editor`}>Manage custom units</Link></>
    ) : null}
/>

                <h3 className="text-center" ref={this.searchResultsHeading}>
                  Search Results ({this.state.isSearching ? '...' : this.state.searchResults.length})
                  {this.state.isSearching && <span className="ms-2 text-muted">(Searching...)</span>}
                </h3>
                {!this.state.isSearching && resultsPage.totalPages > 1 ? (
                  <div className="small-text text-center">
                    Showing {resultsPage.firstIndex + 1}&ndash;{resultsPage.lastIndex + 1} of {this.state.searchResults.length}
                  </div>
                ) : null}
                <div className="search-sort-wrapper">
                    Sort:
                    <span>
                        <input
                            id="search-sort-name"
                            type="radio"
                            name="searchSort"
                            value="Name"
                            checked={this.state.searchSort === 'Name'}
                            onChange={this.handleSort}
                        />
                        <label htmlFor="search-sort-name">Name</label>
                    </span>
                    <span>
                        <input
                            id="search-sort-pv"
                            type="radio"
                            name="searchSort"
                            value="BFPointValue"
                            checked={this.state.searchSort === 'BFPointValue'}
                            onChange={this.handleSort}
                        />
                        <label htmlFor="search-sort-pv">PV</label>
                    </span>
                </div>
                  <UnitStandingLegend />
                  {!this.state.isSearching ? <SearchResultsPager page={resultsPage} onGo={this.goToSearchPage} /> : null}
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th><span className="visually-hidden">Actions</span></th>
                          <th>Name</th>
                          <th>Rules</th>
                          <th>Tech</th>
                          <th>Era</th>
                          <th>Type</th>
                          <th>Points</th>

                        </tr>
                        <tr>
                          <th><span className="visually-hidden">Actions</span></th>
                          <th colSpan={4}>Notes</th>
                          <th colSpan={2}>Role</th>
                        </tr>
                      </thead>

                      {this.state.isSearching ? (
                        <tbody>
                          <tr>
                            <td className="text-center" colSpan={7}>
                              <div className="text-muted">
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                Searching Master Unit List...
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      ) : this.state.searchResults.length > 0 ? (
                        <>
                          {resultsPage.items.map( (asUnit: IASMULUnit, pageIndex: number) => {
                            // Index into the full result list, so keys and the open context menu stay unique across pages.
                            const unitIndex = resultsPage.firstIndex + pageIndex;

                            return (
                              <tbody key={unitIndex}>
                              <tr>
                                <td rowSpan={2} valign="middle" style={{verticalAlign: "middle"}} className="text-left min-width no-wrap">

  {this.props.appGlobals.currentASForce && this.props.appGlobals.currentASForce.getTotalGroups() > 1 ?
    (
      <div className="drop-down-menu-container">
        <button
          className="btn-sm btn btn-primary"
          onClick={() => this.toggleContextMenuSearch(unitIndex)}
          title="Open the context menu for this unit"
        >
          <Bars />
        </button>
        <ul
          className={this.state.contextMenuSearch === unitIndex ? "styleless dd-menu active" : "styleless dd-menu"}
        >
          {this.props.appGlobals.currentASForce.groups.map( (asGroup, asGroupIndex) => {
            return (
              <li
                key={asGroupIndex}
                onClick={() => {
                  const unitObj = new AlphaStrikeUnit();
                  unitObj.importMUL( JSON.parse(JSON.stringify(asUnit)) );
                  this.addToGroup( unitObj, asGroupIndex)
                }}
                title={"Adds this unit to your group '" + asGroup.getName(asGroupIndex + 1) + "'"}
              >
                <Plus />&nbsp;
                Add to {asGroup.getName(asGroupIndex + 1)}
              </li>
            )
          })}

        </ul>
      </div>
    ) : (
      <button
        className="btn-sm btn btn-primary no-right-margin"
        onClick={() => {
          const unitObj = new AlphaStrikeUnit();
          unitObj.importMUL( JSON.parse(JSON.stringify(asUnit)) );
          this.addToGroup( unitObj, 0)
        }}
        title="Add this unit to your current group"
      >
        <Plus />
      </button>
  )}

    <button
      className="btn btn-primary btn-sm"
      onClick={() => {
        const unitObj = new AlphaStrikeUnit();
        unitObj.importMUL( asUnit );
        this.props.openViewUnit( unitObj )
      }}
      title="View this unit's Alpha Strike Card"
    >
      <Eye />
    </button>
  </td>
                                <td>
                                  <UnitStandingBadge standing={getMULRecordStanding(asUnit)} />
                                  {getMULDisplayName(asUnit)}
                                  {asUnit.MulSource && asUnit.MulSource !== "mul2" ? (
                                    <>
                                      &nbsp;<span
                                        className={asUnit.MulSource === "custom" ? "badge bg-warning text-dark" : "badge bg-secondary"}
                                        title={asUnit.CustomInfo
                                          ? `Non-canonical custom by ${asUnit.CustomInfo.author}${asUnit.CustomInfo.source ? ` (${asUnit.CustomInfo.source})` : ""}${asUnit.CustomInfo.local ? " - saved in this browser only" : ""}`
                                          : "Legacy MUL 1.0 record not listed on the current MUL"}
                                      >
                                        {MUL_SOURCE_LABELS[asUnit.MulSource]}{asUnit.CustomInfo?.local ? " (local)" : ""}
                                      </span>
                                      {asUnit.MulSource === "mul1" && !asUnit.BFPointValue ? (
                                        <span className="badge bg-danger" title="This legacy record has no Alpha Strike stats">&nbsp;No AS stats</span>
                                      ) : null}
                                    </>
                                  ) : null}
                                </td>

                                <td>{asUnit.Rules}</td>
                                <td>{asUnit.Technology.Name}</td>
                                <td>{getMULEraLabel(asUnit.EraId)}</td>
                                <td>{asUnit.BFType}</td>
                                <td>{asUnit.BFPointValue}</td>

                              </tr>
                              <tr>
                                <td colSpan={4} className=" text-left">
                                  <strong title="Move">MV</strong>: {asUnit.BFMove}
                                  &nbsp;|&nbsp;<strong title="Armor/Internal Structure values">A/IS</strong>: {asUnit.BFArmor}/{asUnit.BFStructure}
                                  &nbsp;|&nbsp;<strong title="Alpha Strike Damage Bands">Damage</strong>: {asUnit.BFDamageShort}/{asUnit.BFDamageMedium}/{asUnit.BFDamageLong}
                                  {asUnit.BFOverheat  && asUnit.BFOverheat > 0 ? (
                                    <>
                                    &nbsp;|&nbsp;<strong title="Overheat Value">OHV</strong>: {asUnit.BFOverheat}
                                    </>
                                  ) : null}
                                  {asUnit.BFAbilities && asUnit.BFAbilities.trim() ? (
                                    <>
                                      &nbsp;|&nbsp;<strong title="Special Abilities">Special</strong>: {asUnit.BFAbilities}
                                    </>
                                  ) : null}

                                </td>
                                <td colSpan={3} className=" text-left">
                                  {asUnit.Role.Name}
                                </td>
                              </tr>
                              </tbody>
                            )
                          })}
                        </>
                      ) : (
                        <>
                        {this.props.appGlobals.appSettings.alphaStrikeSearchTerm.length < 3 && this.props.appGlobals.appSettings.alphaStrikeSearchAbilities.length === 0 ? (
                          <tbody>
                          <tr>
                            <td className="text-center" colSpan={7}>
                              Please type a search term 3 or more characters.
                            </td>
                          </tr>
                          </tbody>
                        ) : (
                          <tbody>
                          <tr>
                            <td className="text-center" colSpan={7}>
                              Sorry, there are no matches with those parameters. It is a remote possibility that the MUL is down if other searches don't work.
                            </td>
                          </tr>
                          </tbody>
                        )}
                        </>
                      )}

                    </table>
                  </div>
                  {!this.state.isSearching ? <SearchResultsPager page={resultsPage} onGo={this.goToSearchPage} below /> : null}
    </>
) : (
    <div className="alert alert-warning">
        We're sorry, searching the Master Unit List for units requires an Internet connection, please connect to the Internet.
    </div>
)}

                </TextSection>

<ScanUnitCard appGlobals={this.props.appGlobals} addToGroup={this.addToGroup} />

{this.props.appGlobals.battleMechSaves && this.props.appGlobals.battleMechSaves.length > 0 ? (
    <TextSection
        label="Your Created BattleMechs"
    >
                  <table className="table">
                    <thead>
                      <tr>
                        <th><span className="visually-hidden">Actions</span></th>
                        <th>Name</th>
                        {/* <th>Rules</th>
                        <th>Tech</th>
                        <th>Era</th>
                        <th>Type</th> */}
                        <th>Points</th>

                      </tr>
                      <tr>
                        <th><span className="visually-hidden">Actions</span></th>
                        <th colSpan={3}>Notes</th>

                      </tr>
                    </thead>

        {this.props.appGlobals.battleMechSaves.map( (bm, unitIndex) => {
            const bmObj = new BattleMech();
            bmObj.import( bm );

            const asUnit = bmObj.calcAlphaStrike();

            return (
                <tbody key={unitIndex}>
                <tr>
                  <td className="text-left min-width no-wrap">

{this.props.appGlobals.currentASForce && this.props.appGlobals.currentASForce.getTotalGroups() > 1 ?
(
<div className="drop-down-menu-container">
    <button 
        className="btn btn-primary btn-sm" 
        onClick={() => this.toggleContextMenuSavedBattleMechs(unitIndex)} 
        title="Open the context menu for this unit"
    >
        <Bars />
    </button>
    <ul className={this.state.contextMenuSavedBattleMechs === unitIndex ? "styleless dd-menu active" : "styleless dd-menu"}> 
        {this.props.appGlobals.currentASForce.groups.map((asGroup, asGroupIndex) => {
            return (
                <li 
                    key={asGroupIndex} 
                    onClick={() => this.addToGroup(asUnit, asGroupIndex)} 
                    title={"Adds this unit to your group '" + asGroup.getName(asGroupIndex + 1) + "'"} 
                >
                    <Plus />&nbsp; Add to {asGroup.getName(asGroupIndex + 1)}
                </li>
            )
        })}
    </ul>
</div>
) : (
<button
className="btn btn-primary btn-sm no-right-margin"
onClick={() => this.addToGroup(asUnit, 0)}
title="Add this unit to your current group"
>
<Plus />
</button>
)}

<button
className="btn btn-primary btn-sm"
onClick={() => this.props.openViewUnit(asUnit)}
title="View this unit's Alpha Strike Card"
>
<Eye />
</button>
</td>
                  <td title={"UUID: " + asUnit.mechCreatorUUID}>{asUnit.name}</td>

                  {/* <td>{asUnit.r}</td>
                  <td>{asUnit.Technology.Name}</td>
                  <td>{asUnit.EraStart}</td>
                  <td>{asUnit.BFType}</td> */}
                  <td>{asUnit.basePoints}</td>

                </tr>
                <tr>
                  <td>&nbsp;</td>
                  <td colSpan={3} className="med-small-text">

                    <strong title="Alpha Strike Damage Bands">Damage</strong>: {asUnit.damage.short}/{asUnit.damage.medium}/{asUnit.damage.long}
                    {asUnit.overheat  && asUnit.overheat > 0 ? (
                      <>
                       &nbsp;|&nbsp;<strong title="Overheat Value">OHV</strong>: {asUnit.overheat}
                      </>
                    ) : null}
                    {asUnit.abilities.length > 0 ? (
                      <>
                        &nbsp;|&nbsp;<strong title="Special Abilities">Special</strong>: {asUnit.abilities.join(", ")}
                      </>
                    ) : null}

                  </td>
                </tr>
                </tbody>
            )
        }) }
            </table>
    </TextSection>
) : null}

{this.props.appGlobals.fighterSaves && this.props.appGlobals.fighterSaves.length > 0 ? (
    <TextSection
        label="Your Created Fighters"
    >
        <table className="table">
            <thead>
                <tr>
                    <th><span className="visually-hidden">Actions</span></th>
                    <th>Name</th>
                    <th>Points</th>
                </tr>
            </thead>
            {this.props.appGlobals.fighterSaves.map( (save, unitIndex) => {
                // Converted from the saved design; a published fighter should use its Master Unit List card.
                const asUnit = new AerospaceFighter( JSON.stringify(save) ).getAlphaStrikeUnit();
                const groups = this.props.appGlobals.currentASForce ? this.props.appGlobals.currentASForce.groups : [];
                return (
                    <tbody key={unitIndex}>
                        <tr>
                            <td className="text-left min-width no-wrap">
                                {groups.length > 1 ? groups.map( (asGroup, asGroupIndex) => (
                                    <button
                                        key={asGroupIndex}
                                        className="btn btn-primary btn-sm"
                                        onClick={() => this.addToGroup(asUnit, asGroupIndex)}
                                        title={"Adds this fighter to your group '" + asGroup.getName(asGroupIndex + 1) + "'"}
                                    >
                                        <Plus />&nbsp;{asGroupIndex + 1}
                                    </button>
                                )) : (
                                    <button
                                        className="btn btn-primary btn-sm no-right-margin"
                                        onClick={() => this.addToGroup(asUnit, 0)}
                                        title="Add this fighter to your current group"
                                    >
                                        <Plus />
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => this.props.openViewUnit(asUnit)}
                                    title="View this fighter's Alpha Strike Card"
                                >
                                    <Eye />
                                </button>
                            </td>
                            <td>{asUnit.name}</td>
                            <td>{asUnit.basePoints}</td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td colSpan={2} className="med-small-text">
                                <strong title="Alpha Strike Damage Bands">Damage</strong>: {asUnit.damage.short}/{asUnit.damage.medium}/{asUnit.damage.long}
                                {asUnit.overheat && asUnit.overheat > 0 ? <>&nbsp;|&nbsp;<strong title="Overheat Value">OHV</strong>: {asUnit.overheat}</> : null}
                                {asUnit.abilities.length > 0 ? <>&nbsp;|&nbsp;<strong title="Special Abilities">Special</strong>: {asUnit.abilities.join(", ")}</> : null}
                            </td>
                        </tr>
                    </tbody>
                )
            })}
        </table>
    </TextSection>
) : null}

{this.props.appGlobals.infantrySaves && this.props.appGlobals.infantrySaves.length > 0 ? (
    <TextSection
        label="Your Created Infantry"
    >
        <table className="table">
            <thead>
                <tr>
                    <th><span className="visually-hidden">Actions</span></th>
                    <th>Name</th>
                    <th>Points</th>
                </tr>
            </thead>
            {this.props.appGlobals.infantrySaves.map( (save, unitIndex) => {
                // Converted from the saved platoon; a published platoon should use its Master Unit List card.
                const asUnit = new InfantryPlatoon( JSON.stringify(save) ).getAlphaStrikeUnit();
                const groups = this.props.appGlobals.currentASForce ? this.props.appGlobals.currentASForce.groups : [];
                return (
                    <tbody key={unitIndex}>
                        <tr>
                            <td className="text-left min-width no-wrap">
                                {groups.length > 1 ? groups.map( (asGroup, asGroupIndex) => (
                                    <button
                                        key={asGroupIndex}
                                        className="btn btn-primary btn-sm"
                                        onClick={() => this.addToGroup(asUnit, asGroupIndex)}
                                        title={"Adds this platoon to your group '" + asGroup.getName(asGroupIndex + 1) + "'"}
                                    >
                                        <Plus />&nbsp;{asGroupIndex + 1}
                                    </button>
                                )) : (
                                    <button
                                        className="btn btn-primary btn-sm no-right-margin"
                                        onClick={() => this.addToGroup(asUnit, 0)}
                                        title="Add this platoon to your current group"
                                    >
                                        <Plus />
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => this.props.openViewUnit(asUnit)}
                                    title="View this platoon's Alpha Strike Card"
                                >
                                    <Eye />
                                </button>
                            </td>
                            <td>{asUnit.name}</td>
                            <td>{asUnit.basePoints}</td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td colSpan={2} className="med-small-text">
                                <strong title="Alpha Strike Damage Bands">Damage</strong>: {asUnit.damage.short}/{asUnit.damage.medium}/{asUnit.damage.long}
                                {asUnit.overheat && asUnit.overheat > 0 ? <>&nbsp;|&nbsp;<strong title="Overheat Value">OHV</strong>: {asUnit.overheat}</> : null}
                                {asUnit.abilities.length > 0 ? <>&nbsp;|&nbsp;<strong title="Special Abilities">Special</strong>: {asUnit.abilities.join(", ")}</> : null}
                            </td>
                        </tr>
                    </tbody>
                )
            })}
        </table>
    </TextSection>
) : null}

{this.props.appGlobals.battleArmorSaves && this.props.appGlobals.battleArmorSaves.length > 0 ? (
    <TextSection
        label="Your Created Battle Armor"
    >
        <table className="table" data-testid="as-battle-armor-saves">
            <thead>
                <tr>
                    <th><span className="visually-hidden">Actions</span></th>
                    <th>Name</th>
                    <th>Points</th>
                </tr>
            </thead>
            {this.props.appGlobals.battleArmorSaves.flatMap( (save, unitIndex) => {
                // Converted from the saved suit, the base design and each loadout; a published suit should use its Master Unit List card.
                const suit = new BattleArmor( JSON.stringify(save) );
                const suits = [suit, ...suit.getLoadouts().map( (_loadout, loadoutIndex) => suit.getLoadoutSuit(loadoutIndex) )];
                const groups = this.props.appGlobals.currentASForce ? this.props.appGlobals.currentASForce.groups : [];
                return suits.map( (item, itemIndex) => {
                    const asUnit = item.getAlphaStrikeUnit();
                    return (
                    <tbody key={`${unitIndex}-${itemIndex}`}>
                        <tr>
                            <td className="text-left min-width no-wrap">
                                {groups.length > 1 ? groups.map( (asGroup, asGroupIndex) => (
                                    <button
                                        key={asGroupIndex}
                                        className="btn btn-primary btn-sm"
                                        onClick={() => this.addToGroup(asUnit, asGroupIndex)}
                                        title={"Adds this squad to your group '" + asGroup.getName(asGroupIndex + 1) + "'"}
                                    >
                                        <Plus />&nbsp;{asGroupIndex + 1}
                                    </button>
                                )) : (
                                    <button
                                        className="btn btn-primary btn-sm no-right-margin"
                                        onClick={() => this.addToGroup(asUnit, 0)}
                                        title="Add this squad to your current group"
                                    >
                                        <Plus />
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => this.props.openViewUnit(asUnit)}
                                    title="View this squad's Alpha Strike Card"
                                >
                                    <Eye />
                                </button>
                            </td>
                            <td>{asUnit.name}</td>
                            <td>{asUnit.basePoints}</td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td colSpan={2} className="med-small-text">
                                <strong title="Alpha Strike Type">Type</strong>: {asUnit.type}&nbsp;|&nbsp;
                                <strong title="Alpha Strike Move">Move</strong>: {item.getAlphaStrikeStats().move}&nbsp;|&nbsp;
                                <strong title="Alpha Strike Damage Bands">Damage</strong>: {asUnit.damage.short}/{asUnit.damage.medium}/{asUnit.damage.long}
                                {asUnit.abilities.length > 0 ? <>&nbsp;|&nbsp;<strong title="Special Abilities">Special</strong>: {asUnit.abilities.join(", ")}</> : null}
                            </td>
                        </tr>
                    </tbody>
                    );
                });
            })}
        </table>
    </TextSection>
) : null}

{this.props.appGlobals.protoMechSaves && this.props.appGlobals.protoMechSaves.length > 0 ? (
    <TextSection
        label="Your Created ProtoMechs"
    >
        <table className="table" data-testid="as-protomech-saves">
            <thead>
                <tr>
                    <th><span className="visually-hidden">Actions</span></th>
                    <th>Name</th>
                    <th>Points</th>
                </tr>
            </thead>
            {this.props.appGlobals.protoMechSaves.map( (save, unitIndex) => {
                // Converted from the saved design, one ProtoMech to a card; a published ProtoMech should use its Master Unit List card.
                const proto = new ProtoMech( JSON.stringify(save) );
                const asUnit = proto.getAlphaStrikeUnit();
                const groups = this.props.appGlobals.currentASForce ? this.props.appGlobals.currentASForce.groups : [];
                return (
                    <tbody key={unitIndex}>
                        <tr>
                            <td className="text-left min-width no-wrap">
                                {groups.length > 1 ? groups.map( (asGroup, asGroupIndex) => (
                                    <button
                                        key={asGroupIndex}
                                        className="btn btn-primary btn-sm"
                                        onClick={() => this.addToGroup(asUnit, asGroupIndex)}
                                        title={"Adds this ProtoMech to your group '" + asGroup.getName(asGroupIndex + 1) + "'"}
                                    >
                                        <Plus />&nbsp;{asGroupIndex + 1}
                                    </button>
                                )) : (
                                    <button
                                        className="btn btn-primary btn-sm no-right-margin"
                                        onClick={() => this.addToGroup(asUnit, 0)}
                                        title="Add this ProtoMech to your current group"
                                    >
                                        <Plus />
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => this.props.openViewUnit(asUnit)}
                                    title="View this ProtoMech's Alpha Strike Card"
                                >
                                    <Eye />
                                </button>
                            </td>
                            <td>{asUnit.name}</td>
                            <td>{asUnit.basePoints}</td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td colSpan={2} className="med-small-text">
                                <strong title="Alpha Strike Type">Type</strong>: {asUnit.type}&nbsp;|&nbsp;
                                <strong title="Alpha Strike Move">Move</strong>: {proto.getAlphaStrikeStats().move}&nbsp;
                                <strong title="Alpha Strike Damage Bands">Damage</strong>: {asUnit.damage.short}/{asUnit.damage.medium}/{asUnit.damage.long}
                                {asUnit.abilities.length > 0 ? <>&nbsp;|&nbsp;<strong title="Special Abilities">Special</strong>: {asUnit.abilities.join(", ")}</> : null}
                            </td>
                        </tr>
                    </tbody>
                );
            })}
        </table>
    </TextSection>
) : null}

{this.props.appGlobals.microMechSaves && this.props.appGlobals.microMechSaves.length > 0 ? (
    <TextSection
        label="Your Created Micro-Mechs"
    >
        <p className="med-small-text">
            Custom Homebrew, NOT OFFICIAL: the Alpha Strike rules for a Micro-Mech (type MM, the MCR ability) are this app's own.
            {" "}<Link to={`${process.env.PUBLIC_URL}/classic-battletech/tro-jbt/micro-mechs`}>They are explained in TRO - JBT: Micro-Mechs.</Link>
        </p>
        <table className="table" data-testid="as-micro-mech-saves">
            <thead>
                <tr>
                    <th><span className="visually-hidden">Actions</span></th>
                    <th>Name</th>
                    <th>Points</th>
                </tr>
            </thead>
            {this.props.appGlobals.microMechSaves.map( (save, unitIndex) => {
                // Converted from the saved design by our own ruleset: a Micro-Mech is on no Master Unit List.
                const micro = new MicroMech( JSON.stringify(save) );
                const asUnit = micro.getAlphaStrikeUnit();
                const groups = this.props.appGlobals.currentASForce ? this.props.appGlobals.currentASForce.groups : [];
                return (
                    <tbody key={unitIndex}>
                        <tr>
                            <td className="text-left min-width no-wrap">
                                {groups.length > 1 ? groups.map( (asGroup, asGroupIndex) => (
                                    <button
                                        key={asGroupIndex}
                                        className="btn btn-primary btn-sm"
                                        onClick={() => this.addToGroup(asUnit, asGroupIndex)}
                                        title={"Adds this Micro-Mech to your group '" + asGroup.getName(asGroupIndex + 1) + "'"}
                                    >
                                        <Plus />&nbsp;{asGroupIndex + 1}
                                    </button>
                                )) : (
                                    <button
                                        className="btn btn-primary btn-sm no-right-margin"
                                        onClick={() => this.addToGroup(asUnit, 0)}
                                        title="Add this Micro-Mech to your current group"
                                    >
                                        <Plus />
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => this.props.openViewUnit(asUnit)}
                                    title="View this Micro-Mech's Alpha Strike Card"
                                >
                                    <Eye />
                                </button>
                            </td>
                            <td>{asUnit.name}</td>
                            <td>{asUnit.basePoints}</td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td colSpan={2} className="med-small-text">
                                <strong title="Alpha Strike Type">Type</strong>: {asUnit.type}&nbsp;|&nbsp;
                                <strong title="Alpha Strike Move">Move</strong>: {micro.getAlphaStrikeStats().move}&nbsp;
                                <strong title="Alpha Strike Damage Bands">Damage</strong>: {asUnit.damage.short}/{asUnit.damage.medium}/{asUnit.damage.long}
                                {asUnit.abilities.length > 0 ? <>&nbsp;|&nbsp;<strong title="Special Abilities">Special</strong>: {asUnit.abilities.join(", ")}</> : null}
                            </td>
                        </tr>
                    </tbody>
                );
            })}
        </table>
    </TextSection>
) : null}

{this.props.appGlobals.walkerSaves && this.props.appGlobals.walkerSaves.length > 0 ? (
    <TextSection
        label="Your Created Walkers"
    >
        <p className="med-small-text">
            Custom Homebrew, NOT OFFICIAL: the Alpha Strike rules for a walker (type WK, or IWK for an industrial walker; the WLK and AIF abilities)
            are this app's own, after Clell Flint's walker rules in Future Wars. View a card to read them.
        </p>
        <table className="table" data-testid="as-walker-saves">
            <thead>
                <tr>
                    <th><span className="visually-hidden">Actions</span></th>
                    <th>Name</th>
                    <th>Points</th>
                </tr>
            </thead>
            {this.props.appGlobals.walkerSaves.map( (save, unitIndex) => {
                // Converted from the saved design by our own ruleset: a walker is on no Master Unit List.
                const walker = new Walker( JSON.stringify(save) );
                const asUnit = walker.getAlphaStrikeUnit();
                const groups = this.props.appGlobals.currentASForce ? this.props.appGlobals.currentASForce.groups : [];
                return (
                    <tbody key={unitIndex}>
                        <tr>
                            <td className="text-left min-width no-wrap">
                                {groups.length > 1 ? groups.map( (asGroup, asGroupIndex) => (
                                    <button
                                        key={asGroupIndex}
                                        className="btn btn-primary btn-sm"
                                        onClick={() => this.addToGroup(asUnit, asGroupIndex)}
                                        title={"Adds this walker to your group '" + asGroup.getName(asGroupIndex + 1) + "'"}
                                    >
                                        <Plus />&nbsp;{asGroupIndex + 1}
                                    </button>
                                )) : (
                                    <button
                                        className="btn btn-primary btn-sm no-right-margin"
                                        onClick={() => this.addToGroup(asUnit, 0)}
                                        title="Add this walker to your current group"
                                    >
                                        <Plus />
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => this.props.openViewUnit(asUnit)}
                                    title="View this walker's Alpha Strike Card"
                                >
                                    <Eye />
                                </button>
                            </td>
                            <td>{asUnit.name}</td>
                            <td>{asUnit.basePoints}</td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td colSpan={2} className="med-small-text">
                                <strong title="Alpha Strike Type">Type</strong>: {asUnit.type}&nbsp;|&nbsp;
                                <strong title="Alpha Strike Move">Move</strong>: {walker.getAlphaStrikeStats().move}&nbsp;
                                <strong title="Alpha Strike Damage Bands">Damage</strong>: {asUnit.damage.short}/{asUnit.damage.medium}/{asUnit.damage.long}
                                {asUnit.abilities.length > 0 ? <>&nbsp;|&nbsp;<strong title="Special Abilities">Special</strong>: {asUnit.abilities.join(", ")}</> : null}
                            </td>
                        </tr>
                    </tbody>
                );
            })}
        </table>
    </TextSection>
) : null}
    </div>
  </div>
            </>
        )
    }
}

interface IAlphaStrikeAddUnitsViewProps {
    appGlobals: IAppGlobals;
    openEditUnit( showASUnit: AlphaStrikeUnit ): void;
    openViewUnit( theUnit: AlphaStrikeUnit ): void;
}

interface IAlphaStrikeAddUnitsViewState {
    abilityCodes: IAbilityCodeCount[];
    searchResults: IASMULUnit[];
    contextMenuSearch: number;
    contextMenuSavedBattleMechs: number;
    searchSort: 'Name' | 'BFPointValue';
    isSearching: boolean;
    searchPage: number;
}