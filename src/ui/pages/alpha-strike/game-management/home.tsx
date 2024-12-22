import { FaDice, FaDownload, FaFileImport, FaPlusCircle, FaPrint, FaTrash } from "react-icons/fa";
import React, { MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { IAppGlobals } from '../../../app-router';
import StandardModal from '../../../components/standard-modal';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import AlphaStrikeMPMaps from "../../../components/svg/alpha-strike-mp-maps";
import { MdTableView } from "react-icons/md";
import { generateScenarioDeployments, getDeploymentById, IAlphaStrikeMPDeployment, IAlphaStrikeMPDeploymentSet } from "../../../../data/alpha-strike-mp-deployments";
import { generateAvailableScenarios, getScenarioById, IAlphaStrikeMPScenario, IAlphaStrikeMPScenarioSet } from "../../../../data/alpha-strike-mp-scenarios";

export default class AlphaStrikeGameManagementHome extends React.Component<IAlphaStrikeGameManagementProps, iAlphaStrikeGameManagementState> {

    currentDeploymentSet: IAlphaStrikeMPDeploymentSet = {
        name: "Test",
        deploymentIds: [1, 2, 3, 4],
        deploymentWeights: [2,1,1,2]
    }

    currentScenarioSet: IAlphaStrikeMPScenarioSet = {
        name: "Test",
        scenarioIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        scenarioWeights: [2,2,2,2,2,2,1,1,1,1,1,1]
    }

    numberOfOptions: number = 3;
    

    constructor(props: IAlphaStrikeGameManagementProps) {
            super(props);
            this.state = {
                updated: false,
            }
            this.props.appGlobals.currentDeployments = generateScenarioDeployments(this.currentDeploymentSet, this.numberOfOptions);
            this.props.appGlobals.currentScenarios = generateAvailableScenarios(this.currentScenarioSet, this.numberOfOptions);

        }


        regenerateCards = () => {
            this.props.appGlobals.currentDeployments = generateScenarioDeployments(this.currentDeploymentSet, this.numberOfOptions);
            this.props.appGlobals.currentScenarios = generateAvailableScenarios(this.currentScenarioSet, this.numberOfOptions);
            this.setState({updated: true});
        }

        toggleDeployment = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            let curDeployments = this.props.appGlobals.currentDeployments!;
            for(let i = 0; i < curDeployments.length; i++) {
                if(curDeployments[i].uuid === e.currentTarget!.value) {
                    curDeployments[i].banned = !curDeployments[i].banned;
                }
            }   
            this.setState({updated: true});

        }

        toggleScenario = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            let curScenarios = this.props.appGlobals.currentScenarios!;
            for(let i = 0; i < curScenarios.length; i++) {
                if(curScenarios[i].uuid === e.currentTarget!.value) {
                    curScenarios[i].banned = !curScenarios[i].banned;
                }
            }   
            this.setState({updated: true});
        }

    
        render = (): JSX.Element => {
          return (
            <UIPage current="alpha-strike-game-management" appGlobals={this.props.appGlobals}>
                <button className="btn btn-primary btn-md" onClick={this.regenerateCards}><FaDice />&nbsp;Regenerate</button>
              <TextSection
                label="Alpha Strike Match Play"
              >
                <div className="row">
                    <div className="col-md-1">
                    <label htmlFor="numberOfDeployments">Use bans?</label>
                    <select value={this.numberOfOptions} onChange={(e) => {this.numberOfOptions = parseInt(e.currentTarget.value); this.regenerateCards(); this.setState({updated: true})}}>
                        <option value="1">No</option>
                        <option value="3">Yes</option>
                        </select>
 
                    </div>
                </div>
                <br />< br/>
                {this.props.appGlobals.currentDeployments !== null && this.props.appGlobals.currentDeployments.length > 0 && this.props.appGlobals.currentScenarios !== null && this.props.appGlobals.currentScenarios.length > 0 ? (
                    <div>
                        <h3><strong>Available Deployments</strong></h3>
                        <div className="row">
                            {this.props.appGlobals.currentDeployments.map((d) => {
                                return(
                                    <div className="col-md-4" style={{opacity: d.banned ? 0.25 : 1}}>
                                        <div className="row" style={{'color':this.numberOfOptions > 1 && !d.banned && this.props.appGlobals.currentDeployments!.filter(x => x.banned === true).length === this.numberOfOptions - 1 ? 'green' : 'white'}}>
                                            <div className="col-md-10">
                                            <h4><strong>{d.name}</strong></h4>
                                            </div>
                                            <div className="col-md-2"><button style={{display: this.numberOfOptions < 2 ? 'none': 'block'}} className="btn btn-danger btn-sm" value={d.uuid} onClick={e => this.toggleDeployment(e)}><FaTrash />&nbsp;Ban</button></div>
                                            <p>{d.description}</p>
                                        </div>
                                        <div className="row">
                                            <AlphaStrikeMPMaps />
                                        </div>
                                    </div>
                                )
                            })}
                            <h3><strong>Available Scenarios</strong></h3>
                            </div><div className="row">
                            {this.props.appGlobals.currentScenarios.map((s) => {
                                return(
                                    <div className="col-md-4" style={{opacity: s.banned ? 0.25 : 1}}>
                                        <div className="row" style={{'color': this.numberOfOptions > 1 && !s.banned && this.props.appGlobals.currentScenarios!.filter(x => x.banned === true).length === this.numberOfOptions - 1 ? 'green' : 'white'}}>
                                            <div className="col-md-10">
                                            <h4><strong>{s.name}</strong></h4>
                                        </div>
                                        <div className="col-md-2"><button style={{display: this.numberOfOptions < 2 ? 'none': 'block'}} className="btn btn-danger btn-sm" value={s.uuid} onClick={e => this.toggleScenario(e)}><FaTrash />&nbsp;Ban</button></div>
                                            <p className="text-left">{s.description}</p>
                                            
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : null}

               </TextSection>
    
            </UIPage>
          );
        }
}

interface IAlphaStrikeGameManagementProps {
  appGlobals: IAppGlobals;
}

interface iAlphaStrikeGameManagementState {
  updated: boolean;
}