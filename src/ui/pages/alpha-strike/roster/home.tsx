import { FaDice, FaDownload, FaFileImport, FaPlusCircle, FaPrint, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import React, { type JSX } from 'react';
import { Link } from 'react-router';
import AlphaStrikeGroup, { IASGroupExport } from '../../../../classes/alpha-strike-group';
import { AlphaStrikeUnit, getMULDisplayName } from '../../../../classes/alpha-strike-unit';
import { makeURLSlug } from '../../../../utils/makeURLSlug';
import { IAppGlobals } from '../../../app-router';
import StandardModal from '../../../components/standard-modal';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import InputCheckbox from '../../../components/form_elements/input_checkbox';
import InputNumeric from '../../../components/form_elements/input_numeric';
import './home.scss';
import AlphaStrikeAddUnitsView from './_AddUnitsPage';
import CurrentForceList from './_CurrentForceList';
import AlphaStrikeUnitEditViewModal from './_showAlphaStrikeUnit';
import { CONST_FORCE_PACKS, IForcePack } from "../../../../data/force-packs-mechs";
import { loadMULListItems } from "../../../../data/mul-list-items";
import { joinListWithEndLabel } from "../../../../utils/joinListWithEndLabel";
import { formationBonuses } from '../../../..//data/formation-bonuses';
import RulesEditionSelect from '../../../components/rules-edition-select';
import { getAlphaStrikeEdition, getAlphaStrikeRulesLevelOptions, getSelectableAlphaStrikeEditions } from '../../../../data/rules-editions';
const Dice = FaDice as any;
const Download = FaDownload as any;
const FileImport = FaFileImport as any;
const PlusCircle = FaPlusCircle as any;
const Print = FaPrint as any;
const Trash = FaTrash as any;
const ChevronDown = FaChevronDown as any;
const ChevronUp = FaChevronUp as any;

export default class AlphaStrikeRosterHome extends React.Component<IHomeProps, IHomeState> {

    fileReader: FileReader | null = null;

    constructor(props: IHomeProps) {
        super(props);

        // Restore collapsed favorites from localStorage
        let collapsedFavorites: string[] = [];
        try {
            const saved = localStorage.getItem('collapsedFavorites');
            if (saved) {
                collapsedFavorites = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading collapsed favorites:', e);
        }

        this.state = {
            updated: false,
            showASUnit: null,
            editASUnit: false,
            addingUnitsModal: false,
            collapsedFavorites: collapsedFavorites,
        }

        this.props.appGlobals.makeDocumentTitle("Alpha Strike Roster");

    }

    addForcePack = async (
      e: React.FormEvent<HTMLButtonElement>,
      pack: IForcePack,
    ) => {
      if( e && e.preventDefault ) e.preventDefault();

      const currentASForce = this.props.appGlobals.currentASForce;
      if( currentASForce) {
        const newGroup = new AlphaStrikeGroup();
        newGroup.groupLabel = pack.groupLabel;

        newGroup.customName = pack.name;

        // Members are looked up in the bundled MUL by full name (Name and Variant, e.g. "Locust IIC 4"), then in the
        // custom unit list for the Aces emplacement cards the MUL does not list (#191).
        const units = await loadMULListItems(["mul2", "custom"]);
        pack.members.forEach((member, index) => {
          const item = units.find((unit) => getMULDisplayName(unit).toLowerCase() === member.trim().toLowerCase());
          if( !item ) {
            console.warn("Force pack member not found in the bundled MUL: '" + member + "'");
            return;
          }
          const newUnit = new AlphaStrikeUnit();
          newUnit.importMUL( item );
          const skill = pack.skills?.[index] ?? (pack.tech === "clan" ? 3 : undefined);
          if( skill !== undefined ) newUnit.setSkill(skill);
          newGroup.members.push(newUnit);
        });

        if( newGroup.members.length > 0 ) {
          newGroup.setAvailableFormationBonuses(formationBonuses.filter(x=>x.IsValid(newGroup, currentASForce?.groups ?? [])))
          for(const group of currentASForce?.groups ?? []){
              if(group.needsToCheckBonuses()){
                  group.setAvailableFormationBonuses( formationBonuses.filter(x=>x.IsValid(group, currentASForce?.groups ?? [])));
              }
          }
          currentASForce.groups.push( newGroup );
          currentASForce.syncQuirksInPlay();
          this.props.appGlobals.saveCurrentASForce( currentASForce );
          this.setState({
            updated: true,
          })
        }
      }
    }

    toggleFavoriteCollapse = (uuid: string): void => {
      const { collapsedFavorites } = this.state;
      const newCollapsed = [...collapsedFavorites];
      const collapseIndex = newCollapsed.indexOf(uuid);
      
      if (collapseIndex > -1) {
        newCollapsed.splice(collapseIndex, 1);
      } else {
        newCollapsed.push(uuid);
      }
      
      this.setState({ collapsedFavorites: newCollapsed });
      
      // Save to localStorage
      try {
        localStorage.setItem('collapsedFavorites', JSON.stringify(newCollapsed));
      } catch (e) {
        console.error('Error saving collapsed favorites:', e);
      }
    }

    removeFavoriteConfirm = ( asFavGroupIndex: number ): void => {

      this.props.appGlobals.openConfirmDialog(
        "Confirmation",
        "Are you sure you want to delete this favorite group?",
        "Yes",
        "No",
        () => {
          this.props.appGlobals.removeASGroupFavorite(asFavGroupIndex);
        }
      );
    }

    loadASFavorite = (asFavGroup: AlphaStrikeGroup ): void => {
      if( this.props.appGlobals.currentASForce ) {
        asFavGroup.setNew();
        this.props.appGlobals.currentASForce.groups.push( asFavGroup );
        this.props.appGlobals.currentASForce.syncQuirksInPlay();
        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
      }
    }

    // The Alpha Strike Companion's quirks in play (quirks design, plan 3); off by default.
    setQuirksInPlay = ( newValue: boolean ): void => {
      if( this.props.appGlobals.currentASForce ) {
        this.props.appGlobals.currentASForce.quirksInPlay = newValue;
        this.props.appGlobals.currentASForce.syncQuirksInPlay();
        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
      }
    }

    // The force's rules edition and level (#646).
    setRulesEdition = ( tag: string ): void => {
      if( this.props.appGlobals.currentASForce ) {
        this.props.appGlobals.currentASForce.setRulesEdition( tag );
        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        this.forceUpdate();
      }
    }

    setRulesLevel = ( event: React.ChangeEvent<HTMLSelectElement> ): void => {
      if( this.props.appGlobals.currentASForce ) {
        this.props.appGlobals.currentASForce.setRulesLevel( event.currentTarget.value === "" ? undefined : +event.currentTarget.value );
        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        this.forceUpdate();
      }
    }

    // The year play checks quirks' years against; a cleared box goes back to each design's era start.
    setGameYear = ( newValue: number ): void => {
      if( this.props.appGlobals.currentASForce ) {
        this.props.appGlobals.currentASForce.setGameYear( newValue );
        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
      }
    }

    openViewUnit = ( theUnit: AlphaStrikeUnit ): void => {
      const showASUnit = theUnit;

      this.setState({
        showASUnit: showASUnit,
        editASUnit: false,
      })
    }

    openEditUnit = ( showASUnit: AlphaStrikeUnit ): void => {

      this.setState({
        showASUnit: showASUnit,
        editASUnit: true,

      })
    }

    closeShowUnitDialog = (): void => {
      this.setState({
        showASUnit: null,
      })
    }

    selectFile = async (e: React.FormEvent<HTMLInputElement>): Promise<void> => {
      if( e && e.preventDefault ) e.preventDefault();
      if( e.currentTarget.files && e.currentTarget.files.length > 0 ) {
        const foundFile = e.currentTarget.files[0];
        // console.log( "test", foundFIle );
        if( foundFile.type === "application/json" ) {
          this.fileReader = new FileReader();
          this.fileReader.onloadend = this.handleFileRead;
          this.fileReader.readAsText( foundFile );
        }

      }
    }

    handleFileRead = (_e: any) => {
      if( this.fileReader ) {
        const content = this.fileReader.result;

        // console.log("content", content)
        try {
          if( content ) {
            const data: IASGroupExport = JSON.parse( content.toString() )

            // let btFavASGroup = this.props.appGlobals.favoriteASGroup;
            // for( let item of data ) {
            const parsedItem =  new AlphaStrikeGroup(data);
            // }

            this.props.appGlobals.saveASGroupFavorite( parsedItem );
          }
        }
        catch (err) {
          console.error("Could not import JSON", err)
        }
      }
    }

    closeAddingUnits = (
        e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault()
      }

      this.setState({
        addingUnitsModal: false,
      })

    }

    openAddingUnits = (
      e: React.FormEvent<HTMLButtonElement>
  ) => {
    if( e && e.preventDefault ) {
      e.preventDefault()
    }

    this.setState({
      addingUnitsModal: true,
    })

  }

    render = (): JSX.Element => {
      return (
        <>
<AlphaStrikeUnitEditViewModal
  appGlobals={this.props.appGlobals}
  showASUnit={this.state.showASUnit}
  editASUnit={this.state.editASUnit}
  closeShowUnitDialog={this.closeShowUnitDialog}
/>
<StandardModal
  show={this.state.addingUnitsModal}
  onClose={this.closeAddingUnits}
  className="modal-xl"
  title="Adding units to Current Force"
>
        <AlphaStrikeAddUnitsView
          appGlobals={this.props.appGlobals}
          openEditUnit={this.openEditUnit}
          openViewUnit={this.openViewUnit}
        />
</StandardModal>

        <UIPage current="alpha-strike-roster" appGlobals={this.props.appGlobals}>

          {this.props.appGlobals.currentASForce ? (
            <div className="row">
              <div className="col-12">
                <RulesEditionSelect
                  value={this.props.appGlobals.currentASForce.rulesEdition}
                  onChange={this.setRulesEdition}
                  editions={getSelectableAlphaStrikeEditions()}
                  nameOf={(tag) => getAlphaStrikeEdition(tag).name}
                />
                <label>
                  Rules Level:
                  <select value={this.props.appGlobals.currentASForce.rulesLevel ?? ""} onChange={this.setRulesLevel}>
                    <option value="">No limit</option>
                    {getAlphaStrikeRulesLevelOptions(this.props.appGlobals.currentASForce.rulesEdition).map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          {this.props.appGlobals.currentASForce && this.props.appGlobals.currentASForce.getTotalUnits() > 0 ? (
            <div className="row">
              <div className="col-12">
                <InputCheckbox
                  label="Use design quirks"
                  description="Applies the Alpha Strike Companion's quirks of units built in the app, in play"
                  checked={this.props.appGlobals.currentASForce.quirksInPlay}
                  setValue={this.setQuirksInPlay}
                />
                {this.props.appGlobals.currentASForce.quirksInPlay ? (
                  <InputNumeric
                    label="Game year"
                    description="Quirks that have ended or not yet begun by this year don't apply; leave it blank to use each design's era start"
                    value={this.props.appGlobals.currentASForce.gameYear ?? ""}
                    setValue={this.setGameYear}
                  />
                ) : null}
              </div>
              <div className="col-6">
                <Link
                  to={`${process.env.PUBLIC_URL}/alpha-strike/roster/play`}
                  className="btn btn-primary no-margin full-width"
                  title="Click here to go into 'Play Mode'"
                >
                    <Dice />&nbsp;Play Mode
                </Link><br />
                <br />
              </div>
              <div className="col-6">
                <Link
                  to={`${process.env.PUBLIC_URL}/alpha-strike/roster/print`}
                  className="btn btn-primary no-margin full-width"
                  title="Click here to go to a printable version of this page"
                >
                    <Print />&nbsp;Print Force
                </Link><br />
                <br />
              </div>
            </div>
          ) : (
            <></>
          )}
          <div className="row">
            <div className="col-lg-6">
              <CurrentForceList
                  appGlobals={this.props.appGlobals}
                  openAddingUnits={this.openAddingUnits}
                  openEditUnit={this.openEditUnit}
              />
            </div>
            <div className="col-lg-6">

            {this.props.appGlobals.favoriteASGroups.length > 0 ? (

<TextSection
  label="Favorite Alpha Strike Groups"
>

{this.props.appGlobals.favoriteASGroups.map( (asFavGroup, asFavGroupIndex) => {
  const isCollapsed = this.state.collapsedFavorites.includes(asFavGroup.uuid);
  return (<fieldset key={asFavGroupIndex} className="fieldset">
    <legend>
      <button
        onClick={() => this.toggleFavoriteCollapse(asFavGroup.uuid)}
        className="btn btn-link btn-sm"
        style={{ padding: 0, marginRight: '8px' }}
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? <ChevronDown /> : <ChevronUp />}
      </button>
      {asFavGroup.getName(0)}
    </legend>

    <div className="pull-right">
      <a
          className="btn btn-primary btn-sm"
          title="Export this favorite to a JSON format to transfer between devices"
          href={`data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(asFavGroup.export())
          )}`}
          download={"as-group-favorite-export-" + makeURLSlug(asFavGroup.getName(0)) + ".json"}
        >
          <Download />
        </a>
      <button
        onClick={() => this.loadASFavorite(asFavGroup)}
        title="Load this favorite group to your current force"
        className="btn-sm btn-primary btn"
      >
        <FileImport />
      </button>

      <button
        onClick={() => this.removeFavoriteConfirm( asFavGroupIndex)}
        title="Remove this favorite"
        className="btn-sm btn-danger btn"
      >
        <Trash />
      </button>
    </div>
    <div className="text-center">
      <br />
      <strong># Units/Points</strong>: {asFavGroup.getTotalUnits()}/{asFavGroup.getTotalPoints()}
    </div>

    {!isCollapsed && (
    <table className="table tighter-padding">
      <thead>
        <tr>
          <th>Name</th>
          <th>Pilot</th>
          <th>Points</th>
        </tr>
      </thead>

      {asFavGroup.members.length > 0 ? (
        <>
        {asFavGroup.members.map( (asFavGroupUnit, asFavGroupUnitIndex) => {
          return (
            <tbody key={asFavGroupUnitIndex}>
            <tr>
              <td>
                {asFavGroupUnit.customName ? (
                  <><strong>{asFavGroupUnit.customName}</strong><br /></>
                ) : (
                  <></>
                )}
                {asFavGroupUnit.name}

              </td>
              <td>{asFavGroupUnit.currentSkill}</td>
              <td>{asFavGroupUnit.currentPoints}</td>

            </tr>
            </tbody>
          )
        })}
        </>
      ) : (
        <tbody>
        <tr><td colSpan={3} className="text-center">No Units</td></tr>
        </tbody>
      )}

    </table>
    )}
  </fieldset>
  )
})}

</TextSection>
): null}

<TextSection
label="Quickly add a ForcePack"
>
<ul className="styleless">
  {CONST_FORCE_PACKS.map( (pack, packindex) => {
    return (
      <li key={packindex} className="force-pack-row">
        <button
          className="btn btn-md btn-primary margin-right"
          aria-label={`Add the ${pack.name}`}
          onClick={(e) => this.addForcePack( e, pack)}
        >
          <PlusCircle />
        </button>
        {/* Its own column, so wrapped text stays beside the button instead of running under it (issue 19). */}
        <div className="force-pack-text">
          {pack.name}<br />
          <div className="small-text">{joinListWithEndLabel(pack.members, "and")}</div>
          {pack.note ? <div className="small-text" data-testid="force-pack-note">{pack.note}</div> : null}
        </div>
      </li>
    )
  })}
  </ul>
</TextSection>

<TextSection
label='Import to your AS Favorites'
>
<div className="text-small">Use this uploader to restore your favorites from another device. The file will be named, unless it was renamed, "as-group-favorite-export-*,json"</div>

<label
title="Click here to select a JSON file exported this page"
>
Import JSON:&nbsp;
<input
  type="file"
  style={{width: "auto"}}
  onChange={this.selectFile}
/>
</label>
<br />
</TextSection>
            </div>
          </div>

          </UIPage>
        </>
      );
    }
}

interface IHomeProps {
  appGlobals: IAppGlobals;

}

interface IHomeState {
  updated: boolean;

  // searchText: string;
  showASUnit: AlphaStrikeUnit | null;
  editASUnit: boolean;

  addingUnitsModal: boolean;
  collapsedFavorites: string[];
}
