import React, { type JSX } from 'react';
import './home.scss';
import {IAppGlobals} from '../../../app-router';
import SanitizedHTML from '../../../components/sanitized-html';
import { MechCreatorSideMenu } from '../../../components/creator-side-menus';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import MechCreatorStatusbar from '../../../components/mech-creator-status-bar';
import UIPage from '../../../components/ui-page';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';
import BattleMechSVG from '../../../components/svg/battlemech-svg';
import QuirkPicker from '../../../components/quirk-picker';
import CanonQuirksButton from '../../../components/canon-quirks-button';
import TextSection from '../../../components/text-section';
import { MechCalcBreakdown } from '../../../components/calc-breakdown';
import InputField from '../../../components/form_elements/input_field';
import { getMULGroundRoles } from '../../../../utils/mulUtilities';
import { mechRulesLevel } from '../../../components/design-lock';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

export default class MechCreatorSummary extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("Summary | 'Mech Creator");
    }

    setASRole = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setASRole( event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    setASCustomName = ( event: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setASCustomName( event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    setASSpecialAmmo = (event: React.FormEvent<HTMLSelectElement>): void => {
      if (this.props.appGlobals.currentBattleMech) {
        this.props.appGlobals.currentBattleMech.setAlphaStrikeSpecialAmmoTag(event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech(this.props.appGlobals.currentBattleMech);
        this.setState({ updated: !this.state.updated });
      }
    }

    setPilotName = ( event: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setPilotName( event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    setPilotPiloting = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setPilotPiloting( +event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    setPilotGunnery = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        this.props.appGlobals.currentBattleMech.setPilotGunnery( +event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( this.props.appGlobals.currentBattleMech );
      }
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentBattleMech)
        return <></>
      return (
        <>
          <MechCreatorStatusbar  appGlobals={this.props.appGlobals}  />
          <UIPage current="classic-battletech-mech-creator" appGlobals={this.props.appGlobals}>

            <div className="row">
              <div className="d-none d-md-block col-md-3 col-lg-2">
                <MechCreatorSideMenu
                  appGlobals={this.props.appGlobals}
                  current="summary"
                />
              </div>
              <div className="col-md-9 col-lg-10">
                  <div className="row">
                    <div className="col-md-12">
                      <TextSection
                        label="Summary"
                      >

                          <div className="row">
                            <div className="col-md-6">
                              <fieldset className="fieldset">
                                <legend>Mechwarrior Data</legend>
                                <div className="row">
                                  <div className="col-sm-12">
                                    <InputField
                                      label="Handle"
                                      value={this.props.appGlobals.currentBattleMech.getPilot().name}
                                      onChange={this.setPilotName}
                                    />
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="col-sm-6">
                                    <label>
                                      Piloting:<br />

                                      <select
                                        value={this.props.appGlobals.currentBattleMech.getPilot().piloting}
                                        onChange={this.setPilotPiloting}
                                      >
                                        <option value={0}>0</option>
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                        <option value={4}>4</option>
                                        <option value={5}>5</option>
                                        <option value={6}>6</option>
                                        <option value={7}>7</option>
                                        <option value={8}>8</option>
                                        <option value={9}>9</option>
                                        <option value={10}>10</option>
                                      </select>
                                    </label>
                                  </div>
                                  <div className="col-sm-6">
                                    <label>
                                      Gunnery:<br />
                                      <select
                                        value={this.props.appGlobals.currentBattleMech.getPilot().gunnery}
                                        onChange={this.setPilotGunnery}
                                      >
                                        <option value={0}>0</option>
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                        <option value={4}>4</option>
                                        <option value={5}>5</option>
                                        <option value={6}>6</option>
                                        <option value={7}>7</option>
                                        <option value={8}>8</option>
                                        <option value={9}>9</option>
                                        <option value={10}>10</option>
                                      </select>
                                    </label>
                                  </div>
                                </div>
                              </fieldset>
                            </div>
                            <div className="col-md-6">
                            <fieldset className="fieldset">
                                <legend>Alpha Strike</legend>

                                  <InputField
                                      label="Custom Name"
                                      value={this.props.appGlobals.currentBattleMech.getASCustomName()}
                                      onChange={this.setASCustomName}
                                    />

                                  <label>
                                    Alpha Strike Role:<br />
                                    {/* The roles published for ground units (issue 15); a role saved before the drop-down stays listed. */}
                                    <select
                                      aria-label="Alpha Strike Role"
                                      value={this.props.appGlobals.currentBattleMech.getASRole()}
                                      onChange={this.setASRole}
                                    >
                                      <option value="">None</option>
                                      {getMULGroundRoles().map(role => <option key={role} value={role}>{role}</option>)}
                                      {this.props.appGlobals.currentBattleMech.getASRole() && !getMULGroundRoles().includes(this.props.appGlobals.currentBattleMech.getASRole()) ? (
                                        <option value={this.props.appGlobals.currentBattleMech.getASRole()}>{this.props.appGlobals.currentBattleMech.getASRole()}</option>
                                      ) : null}
                                    </select>
                                  </label>

                                  {this.props.appGlobals.currentBattleMech.getAlphaStrikeSpecialAmmoOptions().length > 0 ? (
                                    <label>
                                      Special Ammunition:<br />
                                      <select
                                        value={this.props.appGlobals.currentBattleMech.getAlphaStrikeSpecialAmmoTag()}
                                        onChange={this.setASSpecialAmmo}
                                      >
                                        <option value="">Standard ammunition</option>
                                        {this.props.appGlobals.currentBattleMech.getAlphaStrikeSpecialAmmoOptions().map(ammo => (
                                          <option key={ammo.tag} value={ammo.tag}>{ammo.name}</option>
                                        ))}
                                      </select>
                                    </label>
                                  ) : null}
                              </fieldset>
                            </div>
                          </div>

                          <CanonQuirksButton
                            unit={this.props.appGlobals.currentBattleMech}
                            onApplied={() => {
                              this.props.appGlobals.saveCurrentBattleMech(this.props.appGlobals.currentBattleMech);
                              this.setState({ updated: !this.state.updated });
                            }}
                          />

                          <QuirkPicker
                            quirks={this.props.appGlobals.currentBattleMech.quirks}
                            unitType={this.props.appGlobals.currentBattleMech.getQuirkUnitType()}
                            editionTag={this.props.appGlobals.currentBattleMech.getRulesEdition()}
                            rulesLevel={mechRulesLevel(this.props.appGlobals)}
                            {...this.props.appGlobals.currentBattleMech.getQuirkTargets()}
                            onChange={() => this.props.appGlobals.saveCurrentBattleMech(this.props.appGlobals.currentBattleMech)}
                          />

                          <div className="row">
                            <div className="col-lg-6">
                              <h3 className="text-center">Technical Read Out</h3>
                              <div className="mech-tro some-padding">
                                <SanitizedHTML raw={true} html={this.props.appGlobals.currentBattleMech.makeTROHTML()} />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <h3 className="text-center">Record Sheets</h3>
                              <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/print-rs`} aria-label="Print the record sheet">
                                <BattleMechSVG
                                  mechData={this.props.appGlobals.currentBattleMech}
                                />
                              </Link>
                              <br />
                              <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/print-tro`} className="btn btn-sm btn-primary">Print the TRO sheet</Link>
                              <br />
                              <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/print-as`} aria-label="Print the Alpha Strike card">
                                <AlphaStrikeUnitSVG
                                  appGlobals={this.props.appGlobals}
                                  asUnit={this.props.appGlobals.currentBattleMech.getAlphaStrikeForceStats()}
                                  measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                                />
                              </Link>
                            </div>
                          </div>
                          <br />
                          <h3 className="text-center">Calculations</h3>
                          <MechCalcBreakdown mech={this.props.appGlobals.currentBattleMech} />
                          <br />
                          <h4 className="text-center">Alpha Strike</h4>
                          <div className="mech-tro some-padding">
                            <SanitizedHTML html={this.props.appGlobals.currentBattleMech.calcLogAS} raw={true} />
                          </div>

                          <div className="clear-both overflow-hidden">
                            <hr />
                          <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/exports`} className="btn btn-sm btn-primary pull-right">Exports <ArrowCircleRight /></Link>
                            <div className="inline-block text-left">
                              <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/step7`} className="btn btn-sm btn-primary"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
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

}