import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import MechCreatorSideMenu from '../../../components/mech-creator-side-menu';
import MechCreatorStatusbar from '../../../components/mech-creator-status-bar';
import SanitizedHTML from '../../../components/sanitized-html';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
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
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setWalkSpeed( +event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setJumpJetType = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setJumpJetType( event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setMyomerType = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setMyomerType( event.currentTarget.value );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setJumpingMP = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setJumpSpeed( +event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setEngineType = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
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
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setGyroType( event.currentTarget.value);
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
              <div className="col-md-9 col-lg-10">
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
                                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map( (option) => {
                                // Engine ratings above 400 (Large engines) are Experimental only.
                                const overMax = option > (this.props.appGlobals.currentBattleMech?.getMaxWalkSpeed(this.props.appGlobals.appSettings.mechRulesFilter) ?? 20);
                                if( overMax && option !== this.props.appGlobals.currentBattleMech?.getWalkSpeed() ) {
                                  return <React.Fragment key={option}></React.Fragment>;
                                }
                                return (
                                  <option key={option} value={option}>{option} MP</option>
                                )
                              })}
                              </select>
                            </label>

                          <label>
                          Myomer:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getMyomerType().tag}
                                onChange={this.setMyomerType}
                              >
                                {this.props.appGlobals.currentBattleMech.getAvailableMyomerTypes(this.props.appGlobals.appSettings.mechRulesFilter).map( (myomer) => {
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

                          <label>
                          Jump Jet Type:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getJumpJetType().tag}
                                onChange={this.setJumpJetType}
                              >
                                {this.props.appGlobals.currentBattleMech.getAvailableJumpJets(this.props.appGlobals.appSettings.mechRulesFilter).map( (jumpJet) => {
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
                                {this.props.appGlobals.currentBattleMech.getAvailableEngines(this.props.appGlobals.appSettings.mechRulesFilter)
                                  .filter( (engineData) => isOptionShown(engineData, engineData.tag === this.props.appGlobals.currentBattleMech?.getEngineType().tag) )
                                  .map( (engineData, engineIndex) => (
                                    <option key={engineIndex} value={engineData.tag}>{availabilityOptionLabel(engineData)}</option>
                                ))}
                              </select>
                            </label>
                            <h3>Gyro Type</h3>
                            <label>
                              Select Gyro Type:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getGyro().tag}
                                onChange={this.setGyroType}
                              >
                                {/* <option value={0}>-Select Jumping Speed-</option> */}
                                {this.props.appGlobals.currentBattleMech.getAvailableGyros(this.props.appGlobals.appSettings.mechRulesFilter)
                                  .filter( (gyroData) => isOptionShown(gyroData, gyroData.tag === this.props.appGlobals.currentBattleMech?.getGyro().tag) )
                                  .map( (gyroData, gyroIndex) => (
                                    <option key={gyroIndex} value={gyroData.tag}>{availabilityOptionLabel(gyroData)}</option>
                                ))}
                              </select>
                            </label>

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