import { FaDice, FaTrash } from "react-icons/fa";
import React from 'react';
import { IAppGlobals } from '../../../app-router';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import AlphaStrikeMPMaps from "../../../components/svg/alpha-strike-mp-maps";
import { generateScenarioDeployments, IAlphaStrikeMPDeploymentSet } from "../../../../data/alpha-strike-mp-deployments";
import { generateAvailableScenarios, IAlphaStrikeMPScenarioSet } from "../../../../data/alpha-strike-mp-scenarios";
import { generateScenarioTerrains, IAlphaStrikeMPTerrainSet } from "../../../../data/alpha-strike-mp-terrain";

export default class AlphaStrikeGameManagementHome extends React.Component<IAlphaStrikeGameManagementProps, iAlphaStrikeGameManagementState> {

    currentDeploymentSet: IAlphaStrikeMPDeploymentSet = {
        name: "Match Play",
        deploymentIds: [1, 2, 3, 4],
        deploymentWeights: [2,1,1,2]
    }

    currentScenarioSet: IAlphaStrikeMPScenarioSet = {
        name: "Match Play",
        scenarioIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        scenarioWeights: [2,2,2,2,2,2,1,1,1,1,1,1]
    }

    currentTerrainSet: IAlphaStrikeMPTerrainSet = {
        name: "Match Play",
        terrainIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        terrainWeights: [1,2,3,6,5,6,5,4,3,1]
    }

    numberOfOptions: number = 3;
    gameSize: string = "battle";
    generateTerrain: string = "no";
    

    constructor(props: IAlphaStrikeGameManagementProps) {
            super(props);
            this.state = {
                updated: false,
            }
            if(this.props.appGlobals.currentDeployments === undefined || this.props.appGlobals.currentDeployments === null){
                this.props.appGlobals.currentDeployments = generateScenarioDeployments(this.currentDeploymentSet, this.numberOfOptions);
                this.props.appGlobals.currentScenarios = generateAvailableScenarios(this.currentScenarioSet, this.numberOfOptions);
                this.props.appGlobals.currentTerrains = generateScenarioTerrains(this.currentTerrainSet, this.numberOfOptions);
            }
        }


        regenerateCards = () => {
            this.props.appGlobals.currentDeployments = generateScenarioDeployments(this.currentDeploymentSet, this.numberOfOptions);
            this.props.appGlobals.currentScenarios = generateAvailableScenarios(this.currentScenarioSet, this.numberOfOptions);
            this.props.appGlobals.currentTerrains = generateScenarioTerrains(this.currentTerrainSet, this.numberOfOptions);
            console.log(this.props.appGlobals.currentTerrains);
            this.setState({updated: true});
        }

        toggleDeployment = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            let curDeployments = this.props.appGlobals.currentDeployments!;
            for(let i = 0; i < curDeployments.length; i++) {
                if(curDeployments[i].uuid === e.currentTarget!.value) {
                    if(curDeployments[i].banned === false && this.props.appGlobals.currentDeployments!.filter(x => x.banned === true).length === this.numberOfOptions - 1){
                        continue;            
                    }
                    curDeployments[i].banned = !curDeployments[i].banned;
                }
            }   
            this.setState({updated: true});

        }

        toggleScenario = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            let curScenarios = this.props.appGlobals.currentScenarios!;
            for(let i = 0; i < curScenarios.length; i++) {
                if(curScenarios[i].uuid === e.currentTarget!.value) {
                    if(curScenarios[i].banned === false && this.props.appGlobals.currentScenarios!.filter(x => x.banned === true).length === this.numberOfOptions - 1){
                        continue;            
                    }
                    curScenarios[i].banned = !curScenarios[i].banned;
                }
            }   
            this.setState({updated: true});
        }

        toggleTerrain = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            let curTerrains = this.props.appGlobals.currentTerrains!;
            for(let i = 0; i < curTerrains.length; i++) {
                if(curTerrains[i].uuid === e.currentTarget!.value) {
                    if(curTerrains[i].banned === false && this.props.appGlobals.currentTerrains!.filter(x => x.banned === true).length === this.numberOfOptions - 1){
                        continue;            
                    }
                    curTerrains[i].banned = !curTerrains[i].banned;
                }
            }
            this.setState({updated: true});
        }

    
        render = (): JSX.Element => {
          return (
            <UIPage current="game-management-match-play" appGlobals={this.props.appGlobals}>
              <TextSection
                label="Alpha Strike Match Play Generator"
              >
                <div className="row" style={{margin: 'auto'}}>
                    <div className="col-md-2">
                    <label htmlFor="numberOfOptions">Use bans?</label>
                    <select value={this.numberOfOptions} onChange={(e) => {this.numberOfOptions = parseInt(e.currentTarget.value); this.regenerateCards(); this.setState({updated: true})}}>
                        <option value="1">No</option>
                        <option value="3">Yes</option>
                        </select>
 
                    </div>
                    <div className="col-md-2">
                    <label htmlFor="gameSize">Game Size?</label>
                    <select value={this.gameSize} onChange={(e) => {this.gameSize = e.currentTarget.value; this.setState({updated: true})}}>
                        <option value="battle">Battle (500 PV)</option>
                        <option value="skirmish">Skirmish (250 PV)</option>
                        </select>
 
                    </div>
                    <div className="col-md-2">
                    <label htmlFor="generateTerrain">Random Terrain Type?</label>
                    <select value={this.generateTerrain} onChange={(e) => {this.generateTerrain = e.currentTarget.value; this.setState({updated: true})}}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                        </select>
 
                    </div>
                    <div className="col-md-6 text-right">
                    <button className="btn btn-primary btn-md" onClick={this.regenerateCards}><FaDice />&nbsp;Reroll</button>
 
                    </div>
                </div>
                <br />< br/>
                {this.props.appGlobals.currentDeployments !== null && this.props.appGlobals.currentDeployments.length > 0 && this.props.appGlobals.currentScenarios !== null && this.props.appGlobals.currentScenarios.length > 0 && this.props.appGlobals.currentTerrains !== null && this.props.appGlobals.currentTerrains.length > 0 ? (
                    <div>
                        <h3><strong>Available Deployments</strong></h3>
                        <div className="row">
                            {this.props.appGlobals.currentDeployments.map((d) => {
                                return(
                                    <div className="col-md-4 mp-section" style={{opacity: d.banned ? 0.25 : 1}}>
                                        <div className="row" style={{'color':this.numberOfOptions > 1 && !d.banned && this.props.appGlobals.currentDeployments!.filter(x => x.banned === true).length === this.numberOfOptions - 1 ? 'green' : 'white'}}>
                                            <div className="col-md-10">
                                            <h4><strong>{d.name}</strong></h4>
                                            </div>
                                            <div className="col-md-2"><button style={{display: this.numberOfOptions < 2 ? 'none': 'block'}} className="btn btn-danger btn-sm" value={d.uuid} onClick={e => this.toggleDeployment(e)}><FaTrash />&nbsp;Ban</button></div>
                                            <p>{d.description}</p>
                                        </div>
                                    </div>                                    
                                )
                            })}
                            </div>
                            <div className="row">
                            {this.props.appGlobals.currentDeployments.map((d) => {
                                return(
                                    <div className="col-md-4">
                                        <div className="col-md-6">
                                    <AlphaStrikeMPMaps 
                                        battleSize={this.gameSize}
                                        deployment={d}
                                    />
                                    </div></div>
                                )
                            })}

                            </div>
                            <div className="row" style={{marginTop: '1em'}}>
                            <h3><strong>Available Scenarios</strong></h3>
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
                        {this.generateTerrain === "yes" ? (
                            <div className="row" style={{marginTop: '1em'}}>
                            <h3><strong>Available Terrain</strong></h3>
                            {this.props.appGlobals.currentTerrains.map((t) => {
                                return(
                                    <div className="col-md-4" style={{opacity: t.banned ? 0.25 : 1}}>
                                        <div className="row" style={{'color': this.numberOfOptions > 1 && !t.banned && this.props.appGlobals.currentTerrains!.filter(x => x.banned === true).length === this.numberOfOptions - 1 ? 'green' : 'white'}}>
                                            <div className="col-md-10">
                                            <h4><strong>{t.name}</strong></h4>
                                        </div>
                                        <div className="col-md-2"><button style={{display: this.numberOfOptions < 2 ? 'none': 'block'}} className="btn btn-danger btn-sm" value={t.uuid} onClick={e => this.toggleTerrain(e)}><FaTrash />&nbsp;Ban</button></div>
                                            
                                        </div>
                                    </div>
                                )
                            })}   
                            </div>
                        ) : null}
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