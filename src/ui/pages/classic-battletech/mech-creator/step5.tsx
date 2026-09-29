import React, { type JSX } from 'react';
import { FaArrowCircleLeft, FaArrowCircleRight, FaPlus, FaTrash } from "react-icons/fa";
import { Link } from 'react-router';
import { IEquipmentItem } from '../../../../data/data-interfaces';
import { isOmniFixedOnly } from '../../../../data/equipment-registry';
import { sortEquipment } from '../../../../utils';
import { IAppGlobals } from '../../../app-router';
import AvailableEquipment from '../../../components/available-equipment';
import InputCheckbox from '../../../components/form_elements/input_checkbox';
import MechCreatorSideMenu from '../../../components/mech-creator-side-menu';
import MechCreatorStatusbar from '../../../components/mech-creator-status-bar';
import SanitizedHTML from '../../../components/sanitized-html';
import StandardModal from '../../../components/standard-modal';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Plus = FaPlus as any;
const Trash = FaTrash as any;

export default class MechCreatorStep5 extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = {
            updated: false,
            showAddDialog: false,
          equipmentCatalog: "all",
        }

        this.props.appGlobals.makeDocumentTitle("Step 5 | 'Mech Creator");
    }

    addEquipment = ( item: IEquipmentItem ): boolean => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.addEquipmentFromTag(
          item.tag,
          this.props.appGlobals.currentBattleMech.getTech().tag,
          "",
          false,
          null,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          this.props.appGlobals.appSettings.mechRulesFilter === 5,
        );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );

        return true;
      }
      return false;
    }

    setSize = ( itemUUID: string | undefined, size: number ): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setEquipmentSize( itemUUID, size );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    setFixed = ( itemUUID: string | undefined, fixed: boolean ): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setEquipmentFixed( itemUUID, fixed );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    stripPods = (): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.stripPodEquipment();
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    switchConfiguration = ( name: string ): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.switchOmniConfiguration( name );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    addConfiguration = ( copyCurrent: boolean ): void => {
      const mech = this.props.appGlobals.currentBattleMech;
      if( !mech ) return;
      const name = window.prompt( copyCurrent ? "Name for the copied configuration:" : "Name for the new configuration:", "" );
      if( !name ) return;
      if( !mech.addOmniConfiguration( name, copyCurrent ) ) {
        window.alert( "A configuration named \"" + name.trim() + "\" already exists." );
        return;
      }
      this.props.appGlobals.saveCurrentBattleMech( mech );
    }

    renameConfiguration = (): void => {
      const mech = this.props.appGlobals.currentBattleMech;
      if( !mech ) return;
      const current = mech.getActiveOmniConfiguration();
      const name = window.prompt( "Rename configuration \"" + current + "\" to:", current );
      if( !name || name.trim() === current ) return;
      if( !mech.renameOmniConfiguration( current, name ) ) {
        window.alert( "A configuration named \"" + name.trim() + "\" already exists." );
        return;
      }
      this.props.appGlobals.saveCurrentBattleMech( mech );
    }

    deleteConfiguration = (): void => {
      const mech = this.props.appGlobals.currentBattleMech;
      if( !mech ) return;
      const current = mech.getActiveOmniConfiguration();
      if( !window.confirm( "Delete configuration \"" + current + "\"? Its pod equipment will be removed." ) ) return;
      mech.deleteOmniConfiguration( current );
      this.props.appGlobals.saveCurrentBattleMech( mech );
    }

    setBombCount = ( tag: string, count: number ): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setBombCount( tag, count );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    removeEquipment = ( itemUUID: string | undefined ): boolean => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.removeEquipment(
          itemUUID
        );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );

        return true;
      }
      return false;
    }

    setRear = (
      itemUUID: string | undefined,
      isRear: boolean
    ): boolean => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setRear(
          itemUUID,
          isRear,
        );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );

        return true;
      }
      return false;
    }

    setWeight = (
      itemUUID: string | undefined,
      weight: number,
    ): boolean => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setweight(
          itemUUID,
          weight,
        );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );

        return true;
      }
      return false;
    }

    openInstallDialog = (): void => {
      this.setState({
        showAddDialog: true,
      });
    }

    closeInstallDialog = (): void => {
      this.setState({
        showAddDialog: false,
      });
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentBattleMech)
        return <></>
      const currentMech = this.props.appGlobals.currentBattleMech;
      const techTag = currentMech.getTech().tag;
      const includeClan = techTag === "clan" || techTag === "mis" || techTag === "mclan";
      const includeIS = techTag === "is" || techTag === "mis" || techTag === "mclan";
      const includeCustom = this.props.appGlobals.appSettings.mechRulesFilter === 5;
      return (
        <>
            <StandardModal
              show={this.state.showAddDialog}
              onClose={this.closeInstallDialog}
              className="modal-xl"
              title="Installing Equipment"
            >

              <div className="form">
                  <div>
                      <AvailableEquipment
                        appGlobals={this.props.appGlobals}
                        equipment={currentMech.getAvailableEquipmentByCatalog(this.state.equipmentCatalog, includeCustom, this.props.appGlobals.appSettings.mechRulesFilter)}
                        addFunction={this.addEquipment}
                        hideUnavailable={this.props.appGlobals.currentBattleMech.hideNonAvailableEquipment}
                      />
                  </div>
              </div>

            </StandardModal>
            <MechCreatorStatusbar  appGlobals={this.props.appGlobals}  />
          <UIPage current="classic-battletech-mech-creator" appGlobals={this.props.appGlobals}>

            <div className="row">
              <div className="d-none d-md-block col-md-3 col-lg-2">
                <MechCreatorSideMenu
                  appGlobals={this.props.appGlobals}
                  current="step5"
                />
              </div>
              <div className="col-md-9 col-lg-10">
                  <div className="row">
                    <div className="col-md-12 col-lg-8">
                      <TextSection
                        label="Step 5: Add weapons, ammunition and other equipment"
                      >

                          <button
                            className="btn btn-primary pull-right btn-sm"
                            title="Open the add dialog"
                            onClick={this.openInstallDialog}
                          >
                            <Plus />
                          </button>

                          <h3 className="text-center">Installed Equipment</h3>

                          <label>
                            Equipment Catalog:
                            <select
                              value={this.state.equipmentCatalog}
                              onChange={(event: React.FormEvent<HTMLSelectElement>) => this.setState({ equipmentCatalog: event.currentTarget.value as IHomeState["equipmentCatalog"] })}
                            >
                              <option value="all">All Available</option>
                              {includeIS ? <option value="is">Inner Sphere</option> : null}
                              {includeClan ? <option value="clan">Clan</option> : null}
                              <option value="universal">Universal</option>
                              {includeCustom ? <option value="custom">Custom</option> : null}
                            </select>
                          </label>

                          {this.props.appGlobals.currentBattleMech.isOmnimech ? (
                            <fieldset className="fieldset">
                              <legend>OmniMech Base Chassis</legend>
                              <p className="smaller-text">
                                Tick <strong>Fixed</strong> for equipment built into the base chassis. Everything
                                else is pod-mounted. The pod space left over defines the model line that every
                                configuration (Prime, A, B...) is built into.
                              </p>
                              <p>
                                Pod space: <strong>{this.props.appGlobals.currentBattleMech.getOmniPodSpace().totalSlots}</strong> slots,
                                &nbsp;<strong>{this.props.appGlobals.currentBattleMech.getOmniPodSpace().podTonnage}</strong> tons
                              </p>
                              <button className="btn-sm btn btn-secondary" onClick={this.stripPods}>
                                Strip Pods
                              </button>

                              <h4>Configurations</h4>
                              <label>
                                Active configuration:&nbsp;
                                <select
                                  value={currentMech.getActiveOmniConfiguration()}
                                  onChange={(event: React.FormEvent<HTMLSelectElement>) => this.switchConfiguration(event.currentTarget.value)}
                                >
                                  {currentMech.getOmniConfigurationNames().map( (name) => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </select>
                              </label>
                              &nbsp;
                              <button className="btn-sm btn btn-primary" onClick={() => this.addConfiguration(false)} title="New configuration with empty pods on this base chassis">
                                New
                              </button>
                              <button className="btn-sm btn btn-primary" onClick={() => this.addConfiguration(true)} title="New configuration starting from the current pods">
                                Copy
                              </button>
                              <button className="btn-sm btn btn-secondary" onClick={this.renameConfiguration}>
                                Rename
                              </button>
                              <button
                                className="btn-sm btn btn-danger"
                                onClick={this.deleteConfiguration}
                                disabled={currentMech.getOmniConfigurationNames().length < 2}
                              >
                                Delete
                              </button>
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th>Configuration</th>
                                    <th>Pod Tons</th>
                                    <th>BV</th>
                                    <th>Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentMech.getOmniConfigurationStats().map( (stats) => (
                                    <tr key={stats.name}>
                                      <td>{stats.name === currentMech.getActiveOmniConfiguration() ? <strong>{stats.name}</strong> : stats.name}</td>
                                      <td>{stats.podTonnage}</td>
                                      <td>{stats.battleValue}</td>
                                      <td>{stats.cost.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </fieldset>
                          ) : null}

                          {currentMech.isLAM() ? (
                            <fieldset className="fieldset">
                              <legend>LAM Fuel and Bombs</legend>
                              <p>
                                Fuel: <strong>{currentMech.getLAMFuelPoints()}</strong> points
                                (80 base + 80 per Fuel Tank).
                                Bomb Bays: <strong>{currentMech.getBombBayCount()}</strong> of 20 maximum,
                                &nbsp;<strong>{currentMech.getBombLoadoutSlots()}</strong> bomb slots loaded.
                              </p>
                              <p className="smaller-text">
                                Install Bomb Bays in the left or right torso, then load bombs here. A bomb
                                that needs several slots must fit in the bays of one location. Bombs add no
                                weight or cost (IO pp.110, 186). Loaded bombs add their BV (provisional,
                                via MegaMek).
                              </p>
                              {currentMech.getBombBayCount() > 0 ? (
                                <table className="table">
                                  <thead>
                                    <tr>
                                      <th>Bomb</th>
                                      <th>Slots</th>
                                      <th>BV</th>
                                      <th>Loaded</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentMech.getAvailableBombs(this.props.appGlobals.appSettings.mechRulesFilter).map( (bomb) => (
                                      <tr key={bomb.tag}>
                                        <td>{bomb.name}</td>
                                        <td>{bomb.bombBaySlots}</td>
                                        <td>{bomb.battleValue}</td>
                                        <td>
                                          <input
                                            type="number"
                                            min={0}
                                            max={20}
                                            value={currentMech.getBombLoadout()[bomb.tag] ?? 0}
                                            onChange={(event: React.FormEvent<HTMLInputElement>) => this.setBombCount(bomb.tag, +event.currentTarget.value)}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : null}
                            </fieldset>
                          ) : null}

                          {this.props.appGlobals.currentBattleMech.getInstalledEquipment().length > 0 ? (

                              <table className="table">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    {/* <th>Sort</th> */}
                                    <th>Weight</th>
                                    <th>Rear</th>
                                    {this.props.appGlobals.currentBattleMech.isOmnimech ? <th>Fixed</th> : null}
                                    <th>&nbsp;</th>
                                  </tr>
                                </thead>

                                {this.props.appGlobals.currentBattleMech.getInstalledEquipment().sort( sortEquipment ).map( (item, itemIndex) => {
                                  return (
                                    <tbody key={itemIndex}>
                                    <tr>
                                      <td>
                                        {item.name}
                                        {item.sizeLabel ? (
                                          <label className="smaller-text">
                                            {item.sizeLabel}:&nbsp;
                                            <select
                                              value={item.size ?? 1}
                                              onChange={( event: React.FormEvent<HTMLSelectElement>) => this.setSize( item.uuid, +event.currentTarget.value)}
                                              className="width-auto"
                                            >
                                              {Array.from({ length: item.sizeMax ?? 1 }, (_value, index) => index + 1).map( (option) => (
                                                <option key={option} value={option}>{option}</option>
                                              ))}
                                            </select>
                                          </label>
                                        ) : null}
                                        {item.spreadSlots ? (
                                          <div className="smaller-text">{item.space.battlemech} slots, placed one at a time</div>
                                        ) : null}
                                      </td>
                                      <td>
                                        {item.minAmmoTons && item.isAmmo && item.minAmmoTons < 1 ? (
                                          <select
                                            value={item.weight}
                                            onChange={( event: React.FormEvent<HTMLSelectElement>) => this.setWeight( item.uuid, +event.currentTarget.value)}
                                            className="width-auto"
                                          >
                                            <option value={.5}>0.5</option>
                                            <option value={1}>1</option>
                                          </select>
                                        ) : (
                                          <>{item.weight}</>
                                        )}
                                        </td>
                                      <td>
                                        <InputCheckbox
                                          label=""
                                          checked={item.rear ? true : false}
                                          onChange={( event: React.FormEvent<HTMLInputElement>) => this.setRear( item.uuid, event.currentTarget.checked)}
                                        />
                                      </td>
                                      {this.props.appGlobals.currentBattleMech?.isOmnimech ? (
                                        <td>
                                          <InputCheckbox
                                            label=""
                                            checked={item.omniFixed ? true : false}
                                            readOnly={isOmniFixedOnly(item)}
                                            onChange={( event: React.FormEvent<HTMLInputElement>) => this.setFixed( item.uuid, event.currentTarget.checked)}
                                          />
                                        </td>
                                      ) : null}
                                      <td className="text-right">
                                        <button
                                          className="btn-sm btn btn-danger"
                                          onClick={() => this.removeEquipment( item.uuid )}
                                        >
                                          <Trash />
                                        </button>

                                      </td>
                                    </tr>
                                    </tbody>
                                  )
                                })}

                                <tfoot>
                                  <tr>
                                    <th colSpan={5} className="font-weight-normal text-center">
                                      Don't be surprised if you toggle Rear and the item is moved to the bottom of the sorting list.
                                    </th>
                                  </tr>
                                </tfoot>
                              </table>
                          ) : (
                            <>
                            <hr className="clear-both" />
                            <br />
                            <p className="text-center">No equipment has been installed.</p>
                            <p className="text-center">Click the
                            &nbsp;<button
                              className="btn btn-primary btn-xs no-margin"
                              title="Open the add dialog"
                              onClick={this.openInstallDialog}
                            >
                              <Plus />
                            </button>&nbsp;
                            to the top left to install equipment.</p>
                            </>
                          )}
                          <div className="clear-both overflow-hidden">
                            <hr />
                            <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/step6`} className="btn btn-primary pull-right btn-sm">Next Step <ArrowCircleRight /></Link>
                            <div className="inline-block text-left">
                              <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/step4`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
                          </div>
                          </TextSection>

                    </div>
                    <div className="d-none d-lg-block col-lg-4">
                    <TextSection

                    >
                      <div className="mech-tro">
                        <SanitizedHTML raw={true} html={this.props.appGlobals.currentBattleMech.makeTROHTML()} />
                      </div>
                    </TextSection>
                    </div>
                  </div>

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
    showAddDialog: boolean;
  equipmentCatalog: "all" | "is" | "clan" | "custom" | "universal";

}