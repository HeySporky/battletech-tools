import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import { MechCreatorSideMenu } from '../../../components/creator-side-menus';
import MechCreatorStatusbar from '../../../components/mech-creator-status-bar';
import SanitizedHTML from '../../../components/sanitized-html';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import { makeRange } from "../../../../utils/makeRange";
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
import DesignLockColumn, { mechRulesLevel } from '../../../components/design-lock';
import EditionChoice from '../../../components/edition-choice';
import ComponentTechBaseChoice from '../../../components/component-tech-base-choice';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

export default class MechCreatorStep3 extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("Step 3 | 'Mech Creator");

    }

    setAdditionalHeatSinks = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setAdditionalHeatSinks( +event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    setHeatSinkType = ( event: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setHeatSinksType( event.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentBattleMech)
        return <></>
      const weightDropDownMax = this.props.appGlobals.currentBattleMech.getMaxAdditionalHeatSinks();
      const heatSinkObj = this.props.appGlobals.currentBattleMech.getHeatSinksObj();
      return (
        <>
          <MechCreatorStatusbar  appGlobals={this.props.appGlobals}  />
          <UIPage current="classic-battletech-mech-creator" appGlobals={this.props.appGlobals}>

            <div className="row">
              <div className="d-none d-md-block col-md-3 col-lg-2">
                <MechCreatorSideMenu
                  appGlobals={this.props.appGlobals}
                  current="step3"
                />
              </div>
              <DesignLockColumn appGlobals={this.props.appGlobals}>
                  <div className="row">
                    <div className="col-md-12 col-lg-8">
                      <TextSection
                        label="Step 3: Add additional heat sinks"
                      >

                          <p className="text-center">
                            {this.props.appGlobals.currentBattleMech.getFreeHeatSinks() === 0
                              ? "This engine type comes with no heat sinks."
                              : this.props.appGlobals.currentBattleMech.getFreeHeatSinks() === 1
                                ? "This engine type comes with 1 heat sink."
                                : "Your BattleMech includes " + this.props.appGlobals.currentBattleMech.getFreeHeatSinks() + " heat sinks."}
                          </p>

                          <EditionChoice earlierEdition={this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition()}>
                            <label>
                                Heat Sink Technology :
                                <select
                                  value={this.props.appGlobals.currentBattleMech.getHeatSinksType()}
                                  onChange={this.setHeatSinkType}
                                >
                                  {this.props.appGlobals.currentBattleMech.getAvailableHeatSinks(mechRulesLevel(this.props.appGlobals)).map( (heatSink) => {
                                    const selected = heatSink.tag === this.props.appGlobals.currentBattleMech?.getHeatSinksType();
                                    if( !isOptionShown(heatSink, selected) ) {
                                      return <React.Fragment key={heatSink.tag}></React.Fragment>;
                                    }
                                    return (
                                      <option key={heatSink.tag} value={heatSink.tag}>{availabilityOptionLabel(heatSink)}</option>
                                    );
                                  })}

                                </select>
                              </label>
                          </EditionChoice>
                          <ComponentTechBaseChoice
                            label="Heat Sink Version"
                            choices={this.props.appGlobals.currentBattleMech.getComponentTechBases("heatSink")}
                            value={this.props.appGlobals.currentBattleMech.getHeatSinkTechBase()}
                            clanDesign={this.props.appGlobals.currentBattleMech.getTech().tag === "clan"}
                            onChange={(techBase) => { const mech = this.props.appGlobals.currentBattleMech; if (mech) { mech.setHeatSinkTechBase(techBase); this.props.appGlobals.saveCurrentBattleMech(mech); } }}
                          />
                            {heatSinkObj.notes ? (
                              <p className="text-center smaller-text">{heatSinkObj.notes}{heatSinkObj.book ? " (" + heatSinkObj.book + (heatSinkObj.page ? " p." + heatSinkObj.page : "") + ")" : ""}</p>
                            ) : null}

                            <label>
                              Add additional heat sinks:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getAdditionalHeatSinks()}
                                onChange={this.setAdditionalHeatSinks}
                              >
                                <option value={0}>None</option>
                                {makeRange(1, weightDropDownMax).map( (option) => {
                                return (
                                  <option key={option} value={option}>{option}</option>
                                )
                              })}
                              </select>
                            </label>
                              <br />
                              {this.props.appGlobals.currentBattleMech.getHeatSinkCriticalRequirements().number > 0 ? (
                                  <>{this.props.appGlobals.currentBattleMech.getHeatSinkCriticalRequirements().number === 1 ? (
                                      <p className="text-center">One critical slot is required for your engine class and selected heat sinks</p>
                                    ) : (
                                      <p className="text-center">{this.props.appGlobals.currentBattleMech.getHeatSinkCriticalRequirements().number} critical slots are required for your engine class and selected heat sinks</p>
                                    )}
                                  </>
                              ) : (
                                <p className="text-center">No additional critical slots are required for your engine class and selected heat sinks</p>
                              )}

                          <div className="clear-both overflow-hidden">
                            <hr />
                            <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/step4`} className="btn btn-primary pull-right btn-sm">Next Step <ArrowCircleRight /></Link>
                            <div className="inline-block text-left">
                              <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/step2`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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