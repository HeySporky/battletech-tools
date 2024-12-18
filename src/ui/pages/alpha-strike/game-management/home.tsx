import { FaDice, FaDownload, FaFileImport, FaPlusCircle, FaPrint, FaTrash } from "react-icons/fa";
import React from 'react';
import { Link } from 'react-router-dom';
import { IAppGlobals } from '../../../app-router';
import StandardModal from '../../../components/standard-modal';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import { MdTableView } from "react-icons/md";
import { generateScenarioDeployments, getDeploymentById, IAlphaStrikeMPDeployment, IAlphaStrikeMPDeploymentSet } from "../../../../data/alpha-strike-mp-deployments";

export default class AlphaStrikeGameManagementHome extends React.Component<IAlphaStrikeGameManagementProps, iAlphaStrikeGameManagementState> {

    currentDeploymentSet: IAlphaStrikeMPDeploymentSet = {
        name: "Test",
        deploymentIds: [1, 2, 3, 4],
        deploymentWeights: [2,1,1,2]
    }

    numberOfDeployments: number = 3;

    constructor(props: IAlphaStrikeGameManagementProps) {
            super(props);
            this.state = {
                updated: false,
            }
            this.props.appGlobals.currentDeployments = generateScenarioDeployments(this.currentDeploymentSet, this.numberOfDeployments);

        }


        regenerateDeployments = () => {
            this.props.appGlobals.currentDeployments = generateScenarioDeployments(this.currentDeploymentSet, this.numberOfDeployments);
            this.setState({updated: true});
        }
    
        render = (): JSX.Element => {
          return (
            <UIPage current="alpha-strike-home" appGlobals={this.props.appGlobals}>
    
              <TextSection
                label="Alpha Strike Match Play"
              >
                {this.props.appGlobals.currentDeployments !== null && this.props.appGlobals.currentDeployments.length > 0 ? (
                    <div>
                        <h3>Available Deployments</h3>
                        <div className="row">
                            {this.props.appGlobals.currentDeployments.map((d) => {
                                return(
                                    <div className="col-md-4">
                                        <div className="deployment-card">
                                            <h4>{d.name}</h4>
                                            <p>{d.description}</p>
                                            <button className="btn btn-danger btn-sm"><FaTrash />&nbsp;Ban</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : null}

                  <button className="btn btn-primary btn-md" onClick={this.regenerateDeployments}><FaDice />&nbsp;Regenerate</button>
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