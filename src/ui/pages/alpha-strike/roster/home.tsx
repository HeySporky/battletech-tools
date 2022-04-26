import { FaDice, FaDownload, FaFileImport, FaPrint, FaTrash } from "react-icons/fa";
import React from 'react';
import { Link } from 'react-router-dom';
import AlphaStrikeGroup, { IASGroupExport } from '../../../../classes/alpha-strike-group';
import { AlphaStrikeUnit } from '../../../../classes/alpha-strike-unit';
import { makeURLSlug } from '../../../../utils/makeURLSlug';
import { IAppGlobals } from '../../../app-router';
import StandardModal from '../../../components/standard-modal';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import AlphaStrikeAddUnitsView from './_AddUnitsPage';
import CurrentForceList from './_CurrentForceList';
import AlphaStrikeUnitEditViewModal from './_showAlphaStrikeUnit';

export default class AlphaStrikeRosterHome extends React.Component<IHomeProps, IHomeState> {

    fileReader: FileReader | null = null;

    constructor(props: IHomeProps) {
        super(props);

        this.state = {
            updated: false,
            showASUnit: null,
            editASUnit: false,
            addingUnitsModal: false,
        }

        this.props.appGlobals.makeDocumentTitle("Alpha Strike Roster");

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
        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
      }
    }

    openViewUnit = ( theUnit: AlphaStrikeUnit ): void => {
      let showASUnit = theUnit;

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
      e.preventDefault();
      if( e.currentTarget.files && e.currentTarget.files.length > 0 ) {
        let foundFile = e.currentTarget.files[0];
        // console.log( "test", foundFIle );
        if( foundFile.type === "application/json" ) {
          this.fileReader = new FileReader();
          this.fileReader.onloadend = this.handleFileRead;
          this.fileReader.readAsText( foundFile );
        }

      }
    }

    handleFileRead = (e: any) => {
      if( this.fileReader ) {
        let content = this.fileReader.result;

        // console.log("content", content)
        try {
          if( content ) {
            let data: IASGroupExport = JSON.parse( content.toString() )

            // let btFavASGroup = this.props.appGlobals.favoriteASGroup;
            // for( let item of data ) {
            let parsedItem =  new AlphaStrikeGroup(data);
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

    render = (): React.ReactFragment => {
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

          {this.props.appGlobals.currentASForce && this.props.appGlobals.currentASForce.getTotalUnits() > 0 ? (
            <div className="row">
              <div className="col-6">
                <Link
                  to={`${process.env.PUBLIC_URL}/alpha-strike/roster/play`}
                  className="btn btn-primary no-margin full-width"
                  title="Click here to go into 'Play Mode'"
                >
                    <FaDice />&nbsp;Play Mode
                </Link><br />
                <br />
              </div>
              <div className="col-6">
                <Link
                  to={`${process.env.PUBLIC_URL}/alpha-strike/roster/print`}
                  className="btn btn-primary no-margin full-width"
                  title="Click here to go to a printable version of this page"
                >
                    <FaPrint />&nbsp;Print Force
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
  return (<fieldset key={asFavGroupIndex} className="fieldset">
    <legend>{asFavGroup.getName(0)}</legend>

    <div className="pull-right">
      <a
          className="btn btn-primary btn-sm"
          title="Export this favorite to a JSON format to transfer between devices"
          href={`data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(asFavGroup.export())
          )}`}
          download={"as-group-favorite-export-" + makeURLSlug(asFavGroup.getName(0)) + ".json"}
        >
          <FaDownload />
        </a>
      <button
        onClick={() => this.loadASFavorite(asFavGroup)}
        title="Load this favorite group to your current force"
        className="btn-sm btn-primary btn"
      >
        <FaFileImport />
      </button>

      <button
        onClick={() => this.removeFavoriteConfirm( asFavGroupIndex)}
        title="Remove this favorite"
        className="btn-sm btn-danger btn"
      >
        <FaTrash />
      </button>
    </div>
    <div className="text-center">
      <br />
      <strong># Units/Points</strong>: {asFavGroup.getTotalUnits()}/{asFavGroup.getTotalPoints()}
    </div>

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
  </fieldset>
  )
})}

</TextSection>
): null}

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
}