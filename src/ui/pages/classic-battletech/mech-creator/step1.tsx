import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { btEraOptions } from '../../../../data/era-options';
import { getAvailableTonnagesForMechType, getTonnageBoundsForMechType } from '../../../../data/mech-tonnages';
import { mechTypeOptions } from '../../../../data/mech-type-options';
import { btTechOptions } from '../../../../data/tech-options';
import { getRulesLevelOptions } from '../../../../data/rules-level-options';
import { IAppGlobals } from '../../../app-router';
import MechCreatorSideMenu from '../../../components/mech-creator-side-menu';
import MechCreatorStatusbar from '../../../components/mech-creator-status-bar';
import SanitizedHTML from '../../../components/sanitized-html';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import InputCheckbox from "../../../components/form_elements/input_checkbox";
import InputField from "../../../components/form_elements/input_field";
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

export default class MechCreatorStep1 extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("Step 1 | 'Mech Creator");
    }

    updateHideNonAvailableEquipment = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.hideNonAvailableEquipment = e.currentTarget.checked;
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateMake = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setModel( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateName = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setName( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    toggleOmni = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( e && e.preventDefault ) e.preventDefault();

      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.toggleOmni(this.props.appGlobals.appSettings.mechRulesFilter);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    togglePrimitive = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( e && e.preventDefault ) e.preventDefault();

      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setPrimitive( !currentMech.isPrimitive() );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateTech = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setTech( e.currentTarget.value);
        // A Clan tech base has no superheavy tonnages (IO:AE p.154).
        this.clampTonnageToChassisRules(currentMech, this.props.appGlobals.appSettings.mechRulesFilter);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
        this.setState({ updated: !this.state.updated });
      }
    }

    updateRulesLevel = ( e: React.FormEvent<HTMLSelectElement>): void => {
      const appSettings = this.props.appGlobals.appSettings;
      appSettings.mechRulesFilter = +e.currentTarget.value;
      this.props.appGlobals.saveAppSettings(appSettings);

      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        this.clampTonnageToChassisRules(currentMech, appSettings.mechRulesFilter);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateType = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setType( e.currentTarget.value);
        this.clampTonnageToChassisRules(currentMech, this.props.appGlobals.appSettings.mechRulesFilter);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    // Keeps the mech's tonnage (and Omni status) within the legal range for its chassis type and rules level.
    clampTonnageToChassisRules = ( currentMech: NonNullable<IAppGlobals["currentBattleMech"]>, rulesLevel: number): void => {
      if( currentMech.isOmnimech && !currentMech.canBeOmniMech( rulesLevel ) ) {
        currentMech.toggleOmni( rulesLevel );
      }
      const { min, max } = getTonnageBoundsForMechType( currentMech.getType().tag, rulesLevel, currentMech.getTech().tag );
      const tonnage = currentMech.getTonnage();
      if( tonnage < min ) {
        currentMech.setTonnage( min );
      } else if( tonnage > max ) {
        currentMech.setTonnage( max );
      }
    }

    updateLAMType = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setLAMType(e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech(currentMech);
      }
    }

    updateQuadVeeMotive = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setQuadVeeMotive(e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech(currentMech);
      }
    }

    updateTonnage = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setTonnage( +e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateStructureType = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setInternalStructureType( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateEra = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setEra( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
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
                  current="step1"
                />
              </div>
              <div className="col-md-9 col-lg-10">
                  <div className="row">
                    <div className="col-md-12 col-lg-8">
                      <TextSection
                        label="Step 1: Design the Chassis"
                      >


                          <InputField
                            label="Mech Model # (e.g. WSP-1A, Timber Wolf)"
                            value={this.props.appGlobals.currentBattleMech.model}
                            onChange={this.updateMake}
                          />

                           <InputField
                            label="Mech Model Name, or Omni Variant (e.g. Wasp, Prime, C )"
                            value={this.props.appGlobals.currentBattleMech.name}
                            onChange={this.updateName}
                          />

                          <label>
                            Technology Base:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getTech().tag}
                              onChange={this.updateTech}
                            >
                            {btTechOptions.map( (option) => {
                              return (
                                <option key={option.tag} value={option.tag}>{option.name}</option>
                              )
                            })}
                            </select>
                          </label>

                          <label>
                            Rules Level:
                            <select
                              value={this.props.appGlobals.appSettings.mechRulesFilter}
                              onChange={this.updateRulesLevel}
                            >
                            {getRulesLevelOptions().map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                            </select>
                          </label>

                          <label>
                            Mech Type:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getType().tag}
                              onChange={this.updateType}
                            >
                            {mechTypeOptions
                              .filter( (option) => option.rulesLevel <= this.props.appGlobals.appSettings.mechRulesFilter || option.tag === this.props.appGlobals.currentBattleMech?.getType().tag )
                              .map( (option) => {
                              return (
                                <option key={option.tag} value={option.tag}>{option.name}{option.notes ? ` (${option.notes})` : ""}</option>
                              )
                            })}
                            </select>
                          </label>
                          {this.props.appGlobals.currentBattleMech.getRequiredRulesLevel() > this.props.appGlobals.appSettings.mechRulesFilter ? (
                            <p className="color-red smaller-text">
                              This design requires the {getRulesLevelOptions().find( (option) => option.id === this.props.appGlobals.currentBattleMech?.getRequiredRulesLevel() )?.name} rules
                              level and is not legal at the selected level. Printing will ask for confirmation.
                            </p>
                          ) : null}

                          {this.props.appGlobals.currentBattleMech.isLAM() ? (
                            <label>
                              LAM Type:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getLAMType()}
                                onChange={this.updateLAMType}
                              >
                                <option value="standard">Standard (Mech / AirMech / Fighter)</option>
                                <option value="bimodal">Bimodal (Mech / Fighter)</option>
                              </select>
                            </label>
                          ) : null}

                          {this.props.appGlobals.currentBattleMech.isQuadVee() ? (
                            <label>
                              QuadVee Motive:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getQuadVeeMotive()}
                                onChange={this.updateQuadVeeMotive}
                              >
                                <option value="tracked">Tracked</option>
                                <option value="wheeled">Wheeled</option>
                              </select>
                            </label>
                          ) : null}

                          <InputCheckbox
                            label="Is an Omnimech"
                            checked={this.props.appGlobals.currentBattleMech.isOmnimech}
                            onChange={this.toggleOmni}
                          />
                          {this.props.appGlobals.currentBattleMech.isLAM() ? (
                            <p className="smaller-text">
                              {this.props.appGlobals.currentBattleMech.isOmniLAM()
                                ? "Omni-LAM (Custom Homebrew, Kronos Battle Systems fan rule): Inner Sphere only, arm actuators are fixed, cost x1.75."
                                : "Canon LAMs cannot be OmniMechs. The fan-made Omni-LAM is available to Inner Sphere LAMs at the Custom Homebrew rules level."}
                            </p>
                          ) : null}
                          {this.props.appGlobals.currentBattleMech.getOmniLAMViolations().map( (violation) => (
                            <p key={violation} className="color-red smaller-text">{violation}</p>
                          ))}

                          {this.props.appGlobals.currentBattleMech.isPrimitive() || this.props.appGlobals.currentBattleMech.canBePrimitive() ? (
                            <>
                              <InputCheckbox
                                label="Is a Primitive 'Mech"
                                checked={this.props.appGlobals.currentBattleMech.isPrimitive()}
                                onChange={this.togglePrimitive}
                              />
                              {this.props.appGlobals.currentBattleMech.isPrimitive() ? (
                                <p className="smaller-text">
                                  Primitive {this.props.appGlobals.currentBattleMech.isIndustrialMech() ? "IndustrialMech" : "BattleMech"} (IO:AE pp.116-118):
                                  the engine rating is Walking MP x tonnage x 1.2, with a 5-ton Primitive cockpit,
                                  {this.props.appGlobals.currentBattleMech.isIndustrialMech() ? " Commercial" : " Primitive"} armor, a standard gyro and single heat sinks.
                                  Choose Industrial structure below for a Primitive IndustrialMech.
                                  With equipment introduced after 2500 it is a RetroTech unit.
                                </p>
                              ) : null}
                            </>
                          ) : null}

                          <label>
                            Mech Era:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getEra().tag}
                              onChange={this.updateEra}
                            >
                            {btEraOptions.map( (option) => {
                              return (
                                <option key={option.tag} value={option.tag}>{option.name}</option>
                              )
                            })}
                            </select>
                          </label>

                            <InputCheckbox
                              checked={this.props.appGlobals.currentBattleMech.hideNonAvailableEquipment}
                              onChange={this.updateHideNonAvailableEquipment}
                              label="Hide non-available weapons and equipment (will be gray otherwise)"
                            />

                          <label>
                            Mech Tonnage:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getTonnage()}
                              onChange={this.updateTonnage}
                            >
                            {getAvailableTonnagesForMechType(
                              this.props.appGlobals.currentBattleMech.getType().tag,
                              this.props.appGlobals.appSettings.mechRulesFilter,
                              this.props.appGlobals.currentBattleMech.getTech().tag
                            ).map( (option) => {
                              return (
                                <option key={option.tons} value={option.tons}>{option.tons} ({option.type})</option>
                              )
                            })}
                            </select>
                          </label>

                          <label>
                            Internal Structure Type:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getInternalStructureType()}
                              onChange={this.updateStructureType}
                            >
                            {this.props.appGlobals.currentBattleMech.getAvailableInternalStructures(this.props.appGlobals.appSettings.mechRulesFilter).map( (option) => {
                              const selected = option.tag === this.props.appGlobals.currentBattleMech?.getInternalStructureType();
                              if( !option.available && !selected && this.props.appGlobals.currentBattleMech?.hideNonAvailableEquipment ) {
                                return <React.Fragment key={option.tag}></React.Fragment>;
                              }
                              return (
                                <option key={option.tag} value={option.tag} disabled={!option.available && !selected}>{option.name}{option.availableAsPrototype ? " (Prototype)" : ""}</option>
                              )
                            })}
                            </select>
                          </label>

                          <div className="clear-both overflow-hidden">
                          <hr />
                            <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/step2`} className="btn btn-primary pull-right btn-sm">Next Step <ArrowCircleRight /></Link>
                            <div className="inline-block text-left">
                              <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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

}