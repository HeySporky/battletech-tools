import React, { type JSX } from 'react';
import { FaDice, FaDownload, FaFileImport, FaHeart, FaPrint, FaTrash } from "react-icons/fa";
import { Link } from 'react-router';
import { BattleMech } from "../../../../classes/battlemech";
import { BattleMechGroup, ICBTGroupExport } from '../../../../classes/battlemech-group';
import { unitGroupNames } from '../../../../data/group-names';
import { makeURLSlug } from '../../../../utils/makeURLSlug';
import { IAppGlobals } from '../../../app-router';
import InputCheckbox from '../../../components/form_elements/input_checkbox';
import InputNumeric from '../../../components/form_elements/input_numeric';
import InputField from '../../../components/form_elements/input_field';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import BattleMechTableGroup from './_tableGroup';
import { vehicleName } from './_vehicleGroupTable';
import { fighterName } from './_fighterGroupTable';
import { smallCraftName } from './_smallCraftGroupTable';
import { capitalShipName } from './_capitalShipGroupTable';
import { buildingSummary } from './_buildingGroupTable';
import { formatBattleValue } from '../../../../data/battle-value';
import { DEFAULT_RULES_EDITION } from '../../../../data/rules-editions';
import RulesEditionSelect from '../../../components/rules-edition-select';
const Dice = FaDice as any;
const Print = FaPrint as any;
const Heart = FaHeart as any;
const Trash = FaTrash as any;
const Download = FaDownload as any;
const FileImport = FaFileImport as any;

export default class BattleMechRosterHome extends React.Component<IHomeProps, IHomeState> {

    fileReader: FileReader | null = null;

    constructor(props: IHomeProps) {
        super(props);

        this.state = {
            updated: false,
            showBMUnit: null,
            editBMUnit: false,

        }

        this.props.appGlobals.makeDocumentTitle("Classic BattleTech Roster");

    }

    newGroup = (): void => {
      if( this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.currentCBTForce.newGroup();
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
    }

    // The space turn tracker in Play Mode (design 2026-10-22); off by default.
    setSpaceInPlay = ( newValue: boolean ): void => {
      if( this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.currentCBTForce.spaceInPlay = newValue;
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
    }

    // Quirk effects in Play Mode (quirks design, plan 3); off by default.
    setQuirksInPlay = ( newValue: boolean ): void => {
      if( this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.currentCBTForce.quirksInPlay = newValue;
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
    }

    // The rules edition being played: the force's Battle Values follow it (edition-aware BV plan, ruling 3).
    setRulesEdition = ( newValue: string ): void => {
      if( this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.currentCBTForce.rulesEdition = newValue;
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
    }

    // The year play checks quirks' years against; a cleared box goes back to each unit's era start.
    setGameYear = ( newValue: number ): void => {
      if( this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.currentCBTForce.setGameYear( newValue );
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
    }

    removeGroup = ( bmGroupIndex: number ): void => {
      if( this.props.appGlobals.currentCBTForce && this.props.appGlobals.currentCBTForce.groups.length > bmGroupIndex ) {
        if(this.props.appGlobals.currentCBTForce.groups[bmGroupIndex].getTotalUnits() === 0 ) {
          this.props.appGlobals.currentCBTForce.removeGroup(bmGroupIndex);
          this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        } else {
          this.props.appGlobals.openConfirmDialog(
            "Confirmation",
            "This group still contains units. Are you sure you want to still remove it?",
            "Yes",
            "No",
            () => {
              if( this.props.appGlobals.currentCBTForce ) {
                this.props.appGlobals.currentCBTForce.removeGroup(bmGroupIndex);
                this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
              }
            }
          );
        }
      }
    }

    selectGroupLabel = ( newName: string, groupIndex: number ): void => {
      if( this.props.appGlobals.currentCBTForce) {
      this.props.appGlobals.currentCBTForce.selectGroupLabel( newName, groupIndex );
      this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
    }
  }

    renameGroup = ( newName: string, bmGroupIndex: number ): void => {
      if( this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.currentCBTForce.renameGroup( newName, bmGroupIndex );
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
    }

    removeFavoriteConfirm = ( favGroupIndex: number ): void => {

      this.props.appGlobals.openConfirmDialog(
        "Confirmation",
        "Are you sure you want to delete this favorite group?",
        "Yes",
        "No",
        () => {
          this.props.appGlobals.removeCBTGroupFavorite(favGroupIndex);
        }
      );
    }

    loadBMFavorite = (favGroup: BattleMechGroup ): void => {
      if( this.props.appGlobals.currentCBTForce ) {
        favGroup.setNew();
        this.props.appGlobals.currentCBTForce.groups.push( favGroup );
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
    }

    openViewUnit = ( theUnit: BattleMech ): void => {
      const showBMUnit = theUnit;

      this.setState({
        showBMUnit: showBMUnit,
        editBMUnit: false,
      })
    }

    openEditUnit = ( showBMUnit: BattleMech ): void => {

      this.setState({
        showBMUnit: showBMUnit,
        editBMUnit: true,

      })
    }

    closeShowUnitDialog = (): void => {
      this.setState({
        showBMUnit: null,
      })
    }

    selectFile = async (e: React.FormEvent<HTMLInputElement>): Promise<void> => {
      e.preventDefault();
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
            const data: ICBTGroupExport = JSON.parse( content.toString() )

            // let btFavCBTGroup = this.props.appGlobals.favoriteCBTGroup;
            // for( let item of data ) {
            const parsedItem =  new BattleMechGroup(data);
            // }

            this.props.appGlobals.saveCBTGroupFavorite( parsedItem );
          }
        }
        catch (err) {
          console.error("Could not import JSON", err)
        }
      }
    }

    render = (): JSX.Element => {
      return (
        <>
{/* <BattleMechEditViewModal
  appGlobals={this.props.appGlobals}
  showBMUnit={this.state.showBMUnit}
  editBMUnit={this.state.editBMUnit}
  closeShowUnitDialog={this.closeShowUnitDialog}
/> */}

        <UIPage current="classic-battletech-roster" appGlobals={this.props.appGlobals}>

          <div className="alert alert-info">
            <h2 className="h4 text-center">Classic BattleTech Roster</h2>
            <p>Build a force from any unit you have saved in the creators: 'Mechs, vehicles, aerospace and conventional fighters, Small Craft and DropShips, capital ships, conventional infantry, battle armor, ProtoMechs, buildings and <em>Battledroids</em> units. Add groups, name them and set each unit's skills, and the force's tonnage and Battle Value are totaled for you.</p>
            <p><strong>Print Force</strong> prints the force list and a record sheet for every unit. <strong>Play Mode</strong> keeps electronic record sheets and walks you through each phase of the turn as you roll the dice and move your models on your own map. Play Mode is still being tested.</p>
            <p className="text-center">Please file an <a target="github" href="https://github.com/HeySporky/battletech-tools/issues">issue</a> for anything that doesn't work, or for ideas on how play should flow.</p>
          </div>
          {this.props.appGlobals.currentCBTForce && this.props.appGlobals.currentCBTForce.getTotalUnits() > 0 ? (
            <div className="row">
              <div className="col-12">
                <RulesEditionSelect
                  unitType="mech"
                  value={this.props.appGlobals.currentCBTForce.rulesEdition}
                  onChange={this.setRulesEdition}
                />
                <p className="smaller-text">Battle Values follow this edition. An edition with BV1 shows BV2 beside it, and one with no Battle Value shows only BV2.</p>
                <InputCheckbox
                  label="Space forces in this game"
                  description="Tracks space turns (6 ground turns each) and anti-orbital shots in Play Mode"
                  checked={this.props.appGlobals.currentCBTForce.spaceInPlay}
                  setValue={this.setSpaceInPlay}
                />
                <InputCheckbox
                  label="Use design quirks"
                  description="Applies the units' design quirks in Play Mode: to-hit, heat and Initiative"
                  checked={this.props.appGlobals.currentCBTForce.quirksInPlay}
                  setValue={this.setQuirksInPlay}
                />
                {this.props.appGlobals.currentCBTForce.quirksInPlay ? (
                  <InputNumeric
                    label="Game year"
                    description="Quirks that have ended or not yet begun by this year don't apply; leave it blank to use each unit's era start"
                    value={this.props.appGlobals.currentCBTForce.gameYear ?? ""}
                    setValue={this.setGameYear}
                  />
                ) : null}
              </div>
              <div className="col-6">
                <Link
                  to={`${process.env.PUBLIC_URL}/classic-battletech/roster/play`}
                  className="btn btn-primary no-margin full-width"
                  title="Click here to go into 'Play Mode'"
                >
                    <Dice />&nbsp;Play Mode
                </Link><br />
                <br />
              </div>
              <div className="col-6">
                <Link
                  to={`${process.env.PUBLIC_URL}/classic-battletech/roster/print`}
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
              <TextSection
                label='Current CBT Force'
              >
            {this.props.appGlobals.currentCBTForce ? (
                  <p className="text-center">
                  <strong>Total Groups</strong>: {this.props.appGlobals.currentCBTForce.getTotalGroups()}&nbsp;|&nbsp;
                  <strong>Total Units</strong>: {this.props.appGlobals.currentCBTForce.getTotalUnits()}&nbsp;|&nbsp;
                  <strong>Total Tons</strong>: {this.props.appGlobals.currentCBTForce.getTotalTons()}&nbsp;|&nbsp;
                  <strong>Total BV</strong>: {this.props.appGlobals.currentCBTForce.getBattleValueText()}

                </p>
                ) : null}
              {this.props.appGlobals.currentCBTForce ? (
                <>
                  {this.props.appGlobals.currentCBTForce.groups.map( (bmGroup, bmGroupIndex) => {
                    return (
                      <fieldset key={bmGroupIndex} className="fieldset">
                        <legend>{bmGroup.groupLabel} #{bmGroupIndex +1}</legend>

                    <div className="pull-right">
                      <button
                        onClick={() => this.props.appGlobals.saveCBTGroupFavorite( bmGroup )}
                        title={bmGroup.getTotalUnits() === 0 ? "A group need to have members to save as a favorite" : "Click here to add this group to your favorites."}
                        className="btn btn-primary btn-sm"
                        disabled={bmGroup.getTotalUnits() === 0}
                      >
                        <Heart />
                      </button>
                      <button
                        onClick={() => this.removeGroup(bmGroupIndex)}
                        title="Click here to remove this group."
                        className="btn btn-danger btn-sm"
                      >
                        <Trash />
                      </button>
                    </div>
                    <div className="width-80">
                        <div className="width-50">
                            <label>
                                <select
                                    title="Select your Group Organization Label"
                                    onChange={(event: React.FormEvent<HTMLSelectElement>) => this.selectGroupLabel(event.currentTarget.value, bmGroupIndex)}
                                    value={bmGroup.groupLabel}
                                >
                                    {unitGroupNames.map( (name, nameIndex) => {
                                        return (
                                            <option key={nameIndex}>{name}</option>
                                        )
                                    })}
                                </select>
                            </label>
                        </div>
                        <div className="width-50">
                            <InputField
                                title="Here you can name your unit"
                                placeholder={"Custom " + bmGroup.groupLabel + " Name"}
                                onChange={(event: React.FormEvent<HTMLInputElement>) => this.renameGroup(event.currentTarget.value, bmGroupIndex)}
                                value={bmGroup.customName}
                            />
                        </div>
                    </div>

                    <BattleMechTableGroup
                      appGlobals={this.props.appGlobals}
                      bmGroupIndex={bmGroupIndex}
                      showAdd={true}
                      showEdit={true}
                    />

                      </fieldset>
                    )
                  })}
                </>
              ) : null}
<p>
                  <button
                    onClick={this.newGroup}
                    className="display-block text-center btn btn-primary full-width no-margin"
                  >
                    New Group
                  </button>
                </p>
                {this.props.appGlobals.currentCBTForce ? (
                  <p className="text-center">
                  <strong>Total Groups</strong>: {this.props.appGlobals.currentCBTForce.getTotalGroups()}&nbsp;|&nbsp;
                  <strong>Total Units</strong>: {this.props.appGlobals.currentCBTForce.getTotalUnits()}&nbsp;|&nbsp;
                  <strong>Total Tons</strong>: {this.props.appGlobals.currentCBTForce.getTotalTons()}&nbsp;|&nbsp;
                  <strong>Total BV</strong>: {this.props.appGlobals.currentCBTForce.getBattleValueText()}

                </p>
                ) : null}
                </TextSection>
            </div>
            <div className="col-lg-6">

            {this.props.appGlobals.favoriteCBTGroups.length > 0 ? (

<TextSection
  label="Favorite CBT Groups"
>

{this.props.appGlobals.favoriteCBTGroups.map( (favGroup, favGroupIndex)=> {
  return (
    <fieldset className='fieldset'  key={favGroupIndex}>
      <legend>{favGroup.getName(favGroupIndex, true)}</legend>

      <div className="pull-right">
      <a
          className="btn btn-primary btn-sm"
          title="Export this favorite to a JSON format to transfer between devices"
          href={`data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(favGroup.export())
          )}`}
          download={"cbt-group-favorite-export-" + makeURLSlug(favGroup.getName(0)) + ".json"}
        >
          <Download />
        </a>
      <button
        onClick={() => this.loadBMFavorite(favGroup)}
        title="Load this favorite group to your current force"
        className="btn-sm btn-primary btn"
      >
        <FileImport />
      </button>

      <button
        onClick={() => this.removeFavoriteConfirm( favGroupIndex)}
        title="Remove this favorite"
        className="btn-sm btn-danger btn"
      >
        <Trash />
      </button>
    </div>

    <table className='table'>
      <thead>
        <tr>
          <th>Name</th>
          <th>Tons</th>
          <th>Tech</th>
          <th className="min-width no-wrap text-center">Piloting</th>
          <th className="min-width no-wrap text-center">Gunnery</th>
          <th className="min-width no-wrap text-center">Points</th>
        </tr>
      </thead>
      {favGroup.members.map( (mechObj, mechIndex) => {
            const pilotBV2 = formatBattleValue((edition) => mechObj.getPilotAdjustedBattleValue(edition), "mech", this.props.appGlobals.currentCBTForce?.rulesEdition);
            const baseBV2 = formatBattleValue((edition) => mechObj.getBattleValue(edition), "mech", this.props.appGlobals.currentCBTForce?.rulesEdition);

            return (
                <tbody key={mechIndex}>
                <tr>
                    <td>
                        {mechObj.getName()}
                        {mechObj.pilot.name && mechObj.pilot.name.trim() ? (
                            <div className='small-text'>
                                <strong>Pilot:</strong> {mechObj.pilot.name}
                            </div>
                        ) : null}

                    </td>
                    <td className="min-width no-wrap text-center">{mechObj.getTonnage()}</td>
                    <td className="min-width no-wrap text-center small-text">{mechObj.getTech().name}</td>
                    <td className="min-width no-wrap text-center">{mechObj.pilot.piloting}</td>
                    <td className="min-width no-wrap text-center">{mechObj.pilot.gunnery}</td>
                    <td className="min-width no-wrap text-center">
                        {pilotBV2 !== baseBV2 ? (
                            <>
                                {pilotBV2}
                                <div className='small-text'>Base: {baseBV2}</div>
                            </>
                        ) : (
                            <>{pilotBV2}</>
                        )}
                    </td>

                </tr>
                </tbody>
            )
        })}
      {favGroup.vehicles.map( (vehicle) => (
          <tbody key={vehicle.getUUID()}>
          <tr>
              <td>
                  {vehicleName(vehicle)}
                  <div className='small-text'>{vehicle.getMotiveType().name} Vehicle</div>
              </td>
              <td className="min-width no-wrap text-center">{vehicle.getTonnage()}</td>
              <td className="min-width no-wrap text-center small-text">{vehicle.getTech().name}</td>
              <td className="min-width no-wrap text-center">{vehicle.getPilot().piloting}</td>
              <td className="min-width no-wrap text-center">{vehicle.getPilot().gunnery}</td>
              <td className="min-width no-wrap text-center">{formatBattleValue((edition) => vehicle.getPilotAdjustedBattleValue(edition), "vehicle", this.props.appGlobals.currentCBTForce?.rulesEdition)}</td>
          </tr>
          </tbody>
      ))}
      {favGroup.fighters.map( (fighter) => (
          <tbody key={fighter.getUUID()}>
          <tr>
              <td>
                  {fighterName(fighter)}
                  <div className='small-text'>{fighter.getFighterTypeName()}</div>
              </td>
              <td className="min-width no-wrap text-center">{fighter.getTonnage()}</td>
              <td className="min-width no-wrap text-center small-text">{fighter.getTech().name}</td>
              <td className="min-width no-wrap text-center">{fighter.getPilot().piloting}</td>
              <td className="min-width no-wrap text-center">{fighter.getPilot().gunnery}</td>
              <td className="min-width no-wrap text-center">{formatBattleValue((edition) => fighter.getPilotAdjustedBattleValue(edition), "fighter", this.props.appGlobals.currentCBTForce?.rulesEdition)}</td>
          </tr>
          </tbody>
      ))}
      {favGroup.smallCraft.map( (craft) => (
          <tbody key={craft.getUUID()}>
          <tr>
              <td>
                  {smallCraftName(craft)}
                  <div className='small-text'>{craft.getShapeName()} Small Craft</div>
              </td>
              <td className="min-width no-wrap text-center">{craft.getTonnage()}</td>
              <td className="min-width no-wrap text-center small-text">{craft.getTech().name}</td>
              <td className="min-width no-wrap text-center">{craft.getPilot().piloting}</td>
              <td className="min-width no-wrap text-center">{craft.getPilot().gunnery}</td>
              <td className="min-width no-wrap text-center">{formatBattleValue((edition) => craft.getPilotAdjustedBattleValue(edition), "small-craft", this.props.appGlobals.currentCBTForce?.rulesEdition)}</td>
          </tr>
          </tbody>
      ))}
      {favGroup.capitalShips.map( (ship) => (
          <tbody key={ship.getUUID()}>
          <tr>
              <td>
                  {capitalShipName(ship)}
                  <div className='small-text'>{ship.getShipTypeName()}</div>
              </td>
              <td className="min-width no-wrap text-center">{ship.getTonnage()}</td>
              <td className="min-width no-wrap text-center small-text">{ship.getTech().name}</td>
              <td className="min-width no-wrap text-center">{ship.getPilot().piloting}</td>
              <td className="min-width no-wrap text-center">{ship.getPilot().gunnery}</td>
              <td className="min-width no-wrap text-center">{formatBattleValue((edition) => ship.getPilotAdjustedBattleValue(edition), "capital-ship", this.props.appGlobals.currentCBTForce?.rulesEdition)}</td>
          </tr>
          </tbody>
      ))}
      {favGroup.infantry.map( (platoon) => (
          <tbody key={platoon.getUUID()}>
          <tr>
              <td>
                  {platoon.getDisplayName()}
                  <div className='small-text'>{platoon.getMotive().name} conventional infantry, {platoon.getTroopers()} troopers</div>
              </td>
              <td className="min-width no-wrap text-center">{platoon.getWeight()}</td>
              <td className="min-width no-wrap text-center small-text">{platoon.getTechName()}</td>
              <td className="min-width no-wrap text-center">{platoon.canMakeAntiMechAttacks() ? platoon.getAntiMechSkill() : "-"}</td>
              <td className="min-width no-wrap text-center">{platoon.getGunnery()}</td>
              <td className="min-width no-wrap text-center">{formatBattleValue((edition) => platoon.getSkillAdjustedBattleValue(edition), "infantry", this.props.appGlobals.currentCBTForce?.rulesEdition)}</td>
          </tr>
          </tbody>
      ))}
      {(favGroup.battleArmor ?? []).map( (squad) => (
          <tbody key={squad.getUUID()}>
          <tr>
              <td>
                  {squad.getDisplayName()}
                  <div className='small-text'>{squad.getWeightClass().name} battle armor, {squad.getSquadSize()} troopers</div>
              </td>
              <td className="min-width no-wrap text-center">{squad.getSquadSize()}</td>
              <td className="min-width no-wrap text-center small-text">{squad.getTechName()}</td>
              <td className="min-width no-wrap text-center">{squad.getCapabilities().swarm || squad.getCapabilities().leg ? squad.getAntiMechSkill() : "-"}</td>
              <td className="min-width no-wrap text-center">{squad.getGunnery()}</td>
              <td className="min-width no-wrap text-center">{formatBattleValue((edition) => squad.getSkillAdjustedBattleValue(edition), "battle-armor", this.props.appGlobals.currentCBTForce?.rulesEdition)}</td>
          </tr>
          </tbody>
      ))}
      {(favGroup.protoMechs ?? []).map( (point) => (
          <tbody key={point.getUUID()}>
          <tr>
              <td>
                  {point.getDisplayName()}
                  <div className='small-text'>{point.getTons()}-ton {point.getChassisName()} ProtoMech, Point of {point.getPointSize()}</div>
              </td>
              <td className="min-width no-wrap text-center">{point.getTons() * point.getPointSize()}</td>
              <td className="min-width no-wrap text-center small-text">{point.getTechName()}</td>
              <td className="min-width no-wrap text-center">-</td>
              <td className="min-width no-wrap text-center">{point.getGunnery()}</td>
              <td className="min-width no-wrap text-center">{formatBattleValue((edition) => point.getSkillAdjustedPointBattleValue(edition), "protomech", this.props.appGlobals.currentCBTForce?.rulesEdition)}</td>
          </tr>
          </tbody>
      ))}
      {(favGroup.microMechs ?? []).map( (micro) => (
          <tbody key={micro.getUUID()}>
          <tr>
              <td>
                  {micro.getDisplayName()}
                  <div className='small-text'>{micro.getTons()}-ton {micro.isQuad() ? "quad" : "biped"} Micro-Mech (fan-made)</div>
              </td>
              <td className="min-width no-wrap text-center">{micro.getTons()}</td>
              <td className="min-width no-wrap text-center small-text">Inner Sphere</td>
              <td className="min-width no-wrap text-center">-</td>
              <td className="min-width no-wrap text-center">-</td>
              <td className="min-width no-wrap text-center">{formatBattleValue((edition) => micro.getBattleValue(edition), "mech", this.props.appGlobals.currentCBTForce?.rulesEdition)}</td>
          </tr>
          </tbody>
      ))}
      {(favGroup.walkers ?? []).map( (walker) => (
          <tbody key={walker.getUUID()}>
          <tr>
              <td>
                  {walker.getDisplayName()}
                  <div className='small-text'>{walker.getTons()}-ton {walker.isIndustrial() ? "industrial " : ""}Walker (fan-made)</div>
              </td>
              <td className="min-width no-wrap text-center">{walker.getTons()}</td>
              <td className="min-width no-wrap text-center small-text">{walker.getTechTag() === "clan" ? "Clan" : "Inner Sphere"}</td>
              <td className="min-width no-wrap text-center">-</td>
              <td className="min-width no-wrap text-center">-</td>
              <td className="min-width no-wrap text-center">{formatBattleValue((edition) => walker.getBattleValue(edition), "walker", this.props.appGlobals.currentCBTForce?.rulesEdition)}</td>
          </tr>
          </tbody>
      ))}
      {(favGroup.battledroidsUnits ?? []).map( (unit) => (
          <tbody key={unit.getUUID()}>
          <tr>
              <td>
                  {unit.getDisplayName()}
                  <div className='small-text'>{unit.getKind().name}, Battledroids p.{unit.getDesign().page}</div>
              </td>
              <td className="min-width no-wrap text-center">-</td>
              <td className="min-width no-wrap text-center small-text">Battledroids</td>
              <td className="min-width no-wrap text-center">-</td>
              <td className="min-width no-wrap text-center">{unit.getGunnery()}</td>
              <td className="min-width no-wrap text-center">-</td>
          </tr>
          </tbody>
      ))}
      {favGroup.buildings.map( (building) => (
          <tbody key={building.getUUID()}>
          <tr>
              <td>
                  {building.getDisplayName()}
                  <div className='small-text'>{buildingSummary(building)}</div>
              </td>
              <td className="min-width no-wrap text-center">-</td>
              <td className="min-width no-wrap text-center small-text">{building.getTech().name}</td>
              <td className="min-width no-wrap text-center">-</td>
              <td className="min-width no-wrap text-center">{building.getMinimumGunners() > 0 ? building.getGunnery() : "-"}</td>
              <td className="min-width no-wrap text-center">-</td>
          </tr>
          </tbody>
      ))}

<tfoot>
<tr>

<td colSpan={1}>
{favGroup.getTotalUnits() > 0 ? (
    <>
        {favGroup.getTotalUnits() > 1 ? (
            <>{favGroup.getTotalUnits()} Units</>
        ) : (
            <>One Unit</>
        )}
    </>
) : (
    <>No Units</>
)}
</td>
<td colSpan={4} className="text-center">
    {favGroup.getTotalTons()} Tons - {favGroup.getTech()}
</td>
<td colSpan={1} className="no-wrap text-right">BV: {favGroup.getBattleValueText(this.props.appGlobals.currentCBTForce?.rulesEdition ?? DEFAULT_RULES_EDITION)}</td>
</tr>
</tfoot>
    </table>
    </fieldset>
  )
 })}
</TextSection>
): null}

<TextSection
label='Import to your CBT Favorites'
>
<div className="text-small">Use this uploader to restore your favorites from another device. The file will be named, unless it was renamed, "cbt-group-favorite-export-*.json"</div>

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
  showBMUnit: BattleMech | null;
  editBMUnit: boolean;

}