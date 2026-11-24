import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import { getFutureWarsWeightClass } from '../../../../data/future-wars-construction';
import { MechCreatorSideMenu } from '../../../components/creator-side-menus';
import MechCreatorStatusbar from '../../../components/mech-creator-status-bar';
import SanitizedHTML from '../../../components/sanitized-html';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
import DesignLockColumn, { mechRulesLevel } from '../../../components/design-lock';
import EditionChoice from '../../../components/edition-choice';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

export default class MechCreatorStep2 extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("Step 2 | 'Mech Creator");
    }

    setWalkingMP = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setWalkSpeed( +event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setJumpJetType = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setJumpJetType( event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setMyomerType = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setMyomerType( event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setJumpingMP = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setJumpSpeed( +event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setJumpPackTons = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setJumpPackTons( +event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setFrankenMechJumpJetClass = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        const value = event.currentTarget.value;
        currentMech.setFrankenMechJumpJetClass( value === "light" || value === "medium" || value === "heavy" ? value : null );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setEngineType = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setEngineType( event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setEngineTechBase = (event: React.FormEvent<HTMLSelectElement>): void => {
      if (this.props.appGlobals.currentBattleMech) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setEngineTechBase(event.currentTarget.value as "is" | "clan");
        this.props.appGlobals.saveCurrentBattleMech(currentMech);
        this.setState({ updated: !this.state.updated });
      }
    }

    setGyroType = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setGyroType( event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setCockpitType = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setCockpitType( event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setCommandConsole = ( event: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setCommandConsole( event.currentTarget.checked );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setFutureWarsLargeCockpit = ( event: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setFutureWarsLargeCockpit( event.currentTarget.checked );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setExtraSensors = ( event: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setExtraSensors( event.currentTarget.checked );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setExtraLifeSupport = ( event: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setExtraLifeSupport( event.currentTarget.checked );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setEnhancedImaging = ( event: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setEnhancedImaging( event.currentTarget.checked );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setRoboticControl = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setRoboticControl( event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentBattleMech) {
        return <></>
      }

      return (
        <>
          <MechCreatorStatusbar  appGlobals={this.props.appGlobals}  />
          <UIPage current="classic-battletech-mech-creator" appGlobals={this.props.appGlobals}>

            <div className="row">
              <div className="d-none d-md-block col-md-3 col-lg-2">
                <MechCreatorSideMenu
                  appGlobals={this.props.appGlobals}
                  current="step2"
                />
              </div>
              <DesignLockColumn appGlobals={this.props.appGlobals}>
                  <div className="row">
                    <div className="col-md-12 col-lg-8">
                      <TextSection
                        label="Step 2: Install engine and control systems"
                      >

                          <h3>Select Movement</h3>
                          <label>
                              Walking Movement Points:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getWalkSpeed()}
                                onChange={this.setWalkingMP}
                              >
                                <option value={0}>-Select Walking Speed-</option>
                                {Array.from({ length: Math.max(20, this.props.appGlobals.currentBattleMech?.getMaxWalkSpeed(mechRulesLevel(this.props.appGlobals)) ?? 20) }, (_, index) => index + 1).map( (option) => {
                                // Engine ratings above 400 (Large engines) are Experimental only; the Engine Table starts at 10.
                                const overMax = option > (this.props.appGlobals.currentBattleMech?.getMaxWalkSpeed(mechRulesLevel(this.props.appGlobals)) ?? 20)
                                  || option < (this.props.appGlobals.currentBattleMech?.getMinWalkSpeed() ?? 1);
                                if( overMax && option !== this.props.appGlobals.currentBattleMech?.getWalkSpeed() ) {
                                  return <React.Fragment key={option}></React.Fragment>;
                                }
                                return (
                                  <option key={option} value={option}>{option} MP</option>
                                )
                              })}
                              </select>
                            </label>

                          <EditionChoice earlierEdition={this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition()}>
                            <label>
                            Myomer:
                                <select
                                  value={this.props.appGlobals.currentBattleMech.getMyomerType().tag}
                                  onChange={this.setMyomerType}
                                >
                                  {this.props.appGlobals.currentBattleMech.getAvailableMyomerTypes(mechRulesLevel(this.props.appGlobals)).map( (myomer) => {
                                    const selected = myomer.tag === this.props.appGlobals.currentBattleMech?.getMyomerType().tag;
                                    if( !isOptionShown(myomer, selected) ) {
                                      return <React.Fragment key={myomer.tag}></React.Fragment>;
                                    }
                                    return (
                                      <option key={myomer.tag} value={myomer.tag}>{availabilityOptionLabel(myomer)}</option>
                                    )
                                  })}
                                </select>
                              </label>
                          </EditionChoice>

                          <EditionChoice earlierEdition={this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition()}>
                            <label>
                            Jump Jet Type:
                                <select
                                  value={this.props.appGlobals.currentBattleMech.getJumpJetType().tag}
                                  onChange={this.setJumpJetType}
                                >
                                  {this.props.appGlobals.currentBattleMech.getAvailableJumpJets(mechRulesLevel(this.props.appGlobals)).map( (jumpJet) => {
                                    const selected = jumpJet.tag === this.props.appGlobals.currentBattleMech?.getJumpJetType().tag;
                                    if( !isOptionShown(jumpJet, selected) ) {
                                      return <React.Fragment key={jumpJet.tag}></React.Fragment>;
                                    }
                                    return (
                                      <option key={jumpJet.tag} value={jumpJet.tag}>{availabilityOptionLabel(jumpJet)}</option>
                                    )
                                  })}
                                </select>
                              </label>
                          </EditionChoice>

                          {this.props.appGlobals.currentBattleMech.getFrankenMechJumpJetClasses().length > 0 ? (
                            <>
                              <label>
                                Jump Jet Size:
                                <select
                                  value={this.props.appGlobals.currentBattleMech.getFrankenMechJumpJetClass() ?? ""}
                                  onChange={this.setFrankenMechJumpJetClass}
                                >
                                  <option value="">Built for this 'Mech</option>
                                  {this.props.appGlobals.currentBattleMech.getFrankenMechJumpJetClasses().map( (jetClass) => (
                                    <option key={jetClass} value={jetClass}>Kept from a {jetClass === "light" ? "10-55" : jetClass === "medium" ? "60-85" : "90-100"} ton 'Mech</option>
                                  ))}
                                </select>
                              </label>
                              <p className="smaller-text">
                                FrankenMech (CO p.213): jump jets from a lighter 'Mech may be kept, giving their weight's share of a
                                Jumping MP (fractions dropped) and 1 heat each. Heavier jump jets cannot be mounted.
                              </p>
                            </>
                          ) : null}

                          {this.props.appGlobals.currentBattleMech.usesLighterJumpJets() ? (
                            <>
                              <label>
                                Jump Jets:
                                <select
                                  value={this.props.appGlobals.currentBattleMech.getJumpJetCount()}
                                  onChange={this.setJumpingMP}
                                >
                                  <option value={0}>-Select Jump Jets-</option>
                                  {Array.from({ length: this.props.appGlobals.currentBattleMech.getMaxJumpJetCount() }, (_, index) => index + 1).map( (jets) => (
                                    <option key={jets} value={jets}>{jets} jets</option>
                                  ))}
                                </select>
                              </label>
                              <p className="smaller-text" data-testid="frankenmech-jump">
                                Jumping MP: {this.props.appGlobals.currentBattleMech.getJumpSpeed()}, {this.props.appGlobals.currentBattleMech.getJumpHeat()} heat, {this.props.appGlobals.currentBattleMech.getJumpJetWeight()} tons.
                              </p>
                            </>
                          ) : (
                          <label>
                          {this.props.appGlobals.currentBattleMech.getJumpJetType().underwater ? "Underwater Movement Points (UMU)" : "Jumping Movement Points"}:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getJumpSpeed()}
                                onChange={this.setJumpingMP}
                              >
                                <option value={0}>-Select Jumping Speed-</option>
                                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map( (option) => {
                                // Jump MP is capped at walking MP (running MP with Improved jump jets).
                                const overMax = option > (this.props.appGlobals.currentBattleMech?.getMaxJumpSpeed() ?? 20);
                                if( overMax && option !== this.props.appGlobals.currentBattleMech?.getJumpSpeed() ) {
                                  return <React.Fragment key={option}></React.Fragment>;
                                }
                                return (
                                  <option key={option} value={option}>{option} MP</option>
                                )
                              })}
                              </select>
                            </label>
                          )}
                          {(() => {
                            const mech = this.props.appGlobals.currentBattleMech;
                            const jumpPack = mech.getJumpPackOption(mechRulesLevel(this.props.appGlobals));
                            if( !isOptionShown(jumpPack, mech.getJumpPackTons() > 0) ) return null;
                            return (
                              <label>
                                {availabilityOptionLabel(jumpPack)} (tons):
                                <select value={mech.getJumpPackTons()} onChange={this.setJumpPackTons} data-testid="jump-pack-tons">
                                  <option value={0}>None</option>
                                  {Array.from({ length: mech.getMaxJumpPackTons() * 2 }, (_, index) => (index + 1) / 2).map( (tons) => (
                                    <option key={tons} value={tons}>{tons} t</option>
                                  ))}
                                </select>
                                <span className="smaller-text"> {mech.getJumpPackMP()} MP, {mech.getJumpPackFuelText()}. Cargo: no design weight or slots.</span>
                              </label>
                            );
                          })()}
                            <EditionChoice earlierEdition={this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition()}>
                              <h3>Engine Type</h3>
                              {this.props.appGlobals.currentBattleMech.getTech().tag === "mis" || this.props.appGlobals.currentBattleMech.getTech().tag === "mclan" ? (
                                <label>
                                  Engine Technology:
                                  <select
                                    value={this.props.appGlobals.currentBattleMech.getEngineTechBase()}
                                    onChange={this.setEngineTechBase}
                                  >
                                    <option value="is">Inner Sphere</option>
                                    <option value="clan">Clan</option>
                                  </select>
                                </label>
                              ) : null}
                              <label>
                                Select Engine Type:
                                <select
                                  value={this.props.appGlobals.currentBattleMech.getEngineType().tag}
                                  onChange={this.setEngineType}
                                >
                                  {/* <option value={0}>-Select Jumping Speed-</option> */}
                                  {this.props.appGlobals.currentBattleMech.getAvailableEngines(mechRulesLevel(this.props.appGlobals))
                                    .filter( (engineData) => isOptionShown(engineData, engineData.tag === this.props.appGlobals.currentBattleMech?.getEngineType().tag) )
                                    .map( (engineData, engineIndex) => (
                                      <option key={engineIndex} value={engineData.tag}>{availabilityOptionLabel(engineData)}</option>
                                  ))}
                                </select>
                              </label>
                            </EditionChoice>
                            <EditionChoice earlierEdition={this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition()}>
                              <h3>Gyro Type</h3>
                              <label>
                                Select Gyro Type:
                                <select
                                  value={this.props.appGlobals.currentBattleMech.getGyro().tag}
                                  onChange={this.setGyroType}
                                >
                                  {/* <option value={0}>-Select Jumping Speed-</option> */}
                                  {this.props.appGlobals.currentBattleMech.getAvailableGyros(mechRulesLevel(this.props.appGlobals))
                                    .filter( (gyroData) => isOptionShown(gyroData, gyroData.tag === this.props.appGlobals.currentBattleMech?.getGyro().tag) )
                                    .map( (gyroData, gyroIndex) => (
                                      <option key={gyroIndex} value={gyroData.tag}>{availabilityOptionLabel(gyroData)}</option>
                                  ))}
                                </select>
                              </label>
                            </EditionChoice>
                            <EditionChoice earlierEdition={this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition()}>
                              <h3>Cockpit</h3>
                              <label>
                                Select Cockpit:
                                <select
                                  value={this.props.appGlobals.currentBattleMech.getCockpitType().tag}
                                  onChange={this.setCockpitType}
                                >
                                  {this.props.appGlobals.currentBattleMech.getAvailableCockpits(mechRulesLevel(this.props.appGlobals))
                                    .filter( (cockpitData) => isOptionShown(cockpitData, cockpitData.tag === this.props.appGlobals.currentBattleMech?.getCockpitType().tag) )
                                    .map( (cockpitData, cockpitIndex) => (
                                      <option key={cockpitIndex} value={cockpitData.tag}>{availabilityOptionLabel(cockpitData)}</option>
                                  ))}
                                </select>
                              </label>
                              {(() => {
                                const mech = this.props.appGlobals.currentBattleMech;
                                const console = mech.getCommandConsoleOption(mechRulesLevel(this.props.appGlobals));
                                if( !isOptionShown(console, mech.hasCommandConsole()) ) return null;
                                return (
                                  <label className="d-block">
                                    <input
                                      type="checkbox"
                                      checked={mech.hasCommandConsole()}
                                      onChange={this.setCommandConsole}
                                    />{" "}
                                    {availabilityOptionLabel(console)}: 3 tons, 1 head slot
                                  </label>
                                );
                              })()}
                              {(() => {
                                const mech = this.props.appGlobals.currentBattleMech;
                                if( !mech.usesFutureWarsConstruction() ) return null;
                                const heavy = getFutureWarsWeightClass( mech.getTonnage() )?.tag === "heavy";
                                return (
                                  <div data-testid="future-wars-head-options">
                                    {heavy ? (
                                      <label className="d-block">
                                        <input type="checkbox" checked={mech.getFutureWarsLargeCockpit()} onChange={this.setFutureWarsLargeCockpit} />{" "}
                                        4-ton cockpit (2 slots; Clell Flint's construction rules, Best-of p.35)
                                      </label>
                                    ) : null}
                                    <label className="d-block">
                                      <input type="checkbox" checked={mech.getExtraSensors()} onChange={this.setExtraSensors} />{" "}
                                      Extra sensors: 1 head slot, 0.5 tons
                                    </label>
                                    <label className="d-block">
                                      <input type="checkbox" checked={mech.getExtraLifeSupport()} onChange={this.setExtraLifeSupport} />{" "}
                                      Extra life support: 1 head slot, 0.5 tons
                                    </label>
                                  </div>
                                );
                              })()}
                              {(() => {
                                const mech = this.props.appGlobals.currentBattleMech;
                                const systems = mech.getAvailableRoboticControls(mechRulesLevel(this.props.appGlobals));
                                if( systems.length < 2 && mech.getRoboticControl().tag === "none" ) return null;
                                const skills = mech.getRoboticSkills();
                                return (
                                  <div data-testid="robotic-control-option">
                                    <label className="d-block">
                                      Robotic Control (Advanced):{" "}
                                      <select value={mech.getRoboticControl().tag} onChange={this.setRoboticControl}>
                                        {systems.map( (system) => (
                                          <option key={system.tag} value={system.tag}>{system.name}</option>
                                        ))}
                                      </select>
                                    </label>
                                    {skills ? (
                                      <p className="smaller-text">
                                        {mech.getRoboticControlWeight()} t on top of the cockpit; the 'Mech fights at Gunnery {skills.gunnery} /
                                        Piloting {skills.piloting}, and its Battle Value is multiplied by 0.85 (IO:AE pp.134-135, 187).
                                      </p>
                                    ) : null}
                                  </div>
                                );
                              })()}
                            </EditionChoice>
                            {/* Outside the cockpit choice: under BMR(R) the cockpit has one option and is hidden, yet Max Tech adds EI (p.60). */}
                            {(() => {
                              const mech = this.props.appGlobals.currentBattleMech;
                              const imaging = mech.getEnhancedImagingOption(mechRulesLevel(this.props.appGlobals));
                              if( !isOptionShown(imaging, mech.hasEnhancedImaging()) ) return null;
                              return (
                                <label className="d-block">
                                  <input
                                    type="checkbox"
                                    checked={mech.hasEnhancedImaging()}
                                    onChange={this.setEnhancedImaging}
                                  />{" "}
                                  {availabilityOptionLabel(imaging)}: no weight or slots
                                </label>
                              );
                            })()}

                            <div className="clear-both overflow-hidden">
                              <hr />
                              <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/step3`} className="btn btn-primary pull-right btn-sm">Next Step <ArrowCircleRight /></Link>
                              <div className="inline-block text-left">
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/step1`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
              </DesignLockColumn>

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