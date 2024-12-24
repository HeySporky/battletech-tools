import React from "react";
import { IAlphaStrikeMPDeployment } from "../../../data/alpha-strike-mp-deployments";

export default class AlphaStrikeMPMaps extends React.Component<IAlphaStrikeMPMapsProps, IAlphaStrikeMPMapsState> {
    constructor(props: IAlphaStrikeMPMapsProps) {
        super(props);
        this.state = {
            updated: false,
        }
    }

    render = (): JSX.Element => {
        return (
            <div>
            {this.props.battleSize==="battle" && this.props.deployment.id === 1 ? (
               <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="40" x="0" y="0" style={{ fill: 'rgb(210, 210, 210)' }} />
                    <line x1="0" y1="5" x2="60" y2="5" style={{ stroke: 'rgb(0,0,0)', strokeWidth: .5 }} />
                    <line x1="0" y1="35" x2="60" y2="35" style={{ stroke: 'rgb(0,0,0)', strokeWidth: .5 }} />
                    <line x1="0" y1="0" x2="60" y2="0" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                    <line x1="0" y1="40" x2="60" y2="40" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />
                </svg>
            ) : (null)}
            {this.props.battleSize==="battle" && this.props.deployment.id === 2 ? (
               <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="40" x="0" y="0" style={{ fill: 'rgb(210, 210, 210)' }} />
                    <circle cx="0" cy="0" r="10" style={{fill: 'rgb(210,210,210', stroke: 'rgb(0,0,0)', strokeWidth: .5}} />
                    <circle cx="60" cy="40" r="10" style={{fill: 'rgb(210,210,210', stroke: 'rgb(0,0,0)', strokeWidth: .5}} />
                    <line x1="0" y1="0" x2="0" y2="40" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                    <line x1="60" y1="0" x2="60" y2="40" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                </svg>
            ) : (null)}
            {this.props.battleSize==="battle" && this.props.deployment.id === 3 ? (
               <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
               <rect width="60" height="40" x="0" y="0" style={{ fill: 'rgb(210, 210, 210)' }} />
               <circle cx="0" cy="0" r="10" style={{fill: 'rgb(210,210,210', stroke: 'rgb(0,0,0)', strokeWidth: .5}} />
               <circle cx="60" cy="0" r="10" style={{fill: 'rgb(210,210,210', stroke: 'rgb(0,0,0)', strokeWidth: .5}} />
               <line x1="0" y1="0" x2="60" y2="0" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
               <line x1="0" y1="40" x2="60" y2="40" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />
               <line x1="0" y1="40" x2="30" y2="30" style={{ stroke: 'rgb(0,0,0)', strokeWidth: .5 }} />
               <line x1="60" y1="40" x2="30" y2="30" style={{ stroke: 'rgb(0,0,0)', strokeWidth: .5 }} />
           </svg>
            ) : (null)}
            {this.props.battleSize==="battle" && this.props.deployment.id === 4 ? (
               <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="40" x="0" y="0" style={{ fill: 'rgb(210, 210, 210)' }} />
                    <line x1="0" y1="0" x2="60" y2="0" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                    <line x1="0" y1="40" x2="60" y2="40" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />
                </svg>
            ) : (null)}

            {this.props.battleSize==="skirmish" && this.props.deployment.id === 1 ? (
               <svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="30" x="0" y="0" style={{ fill: 'rgb(210, 210, 210)' }} />
                    <line x1="5" y1="0" x2="5" y2="30" style={{ stroke: 'rgb(0,0,0)', strokeWidth: .5 }} />
                    <line x1="35" y1="0" x2="35" y2="30" style={{ stroke: 'rgb(0,0,0)', strokeWidth: .5 }} />
                    <line x1="0" y1="0" x2="0" y2="30" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                    <line x1="40" y1="0" x2="40" y2="30" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                </svg>
            ) : (null)}
            {this.props.battleSize==="skirmish" && this.props.deployment.id === 2 ? (
               <svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="30" x="0" y="0" style={{ fill: 'rgb(210, 210, 210)' }} />
                    <circle cx="0" cy="0" r="10" style={{fill: 'rgb(210,210,210', stroke: 'rgb(0,0,0)', strokeWidth: .5}} />
                    <circle cx="40" cy="30" r="10" style={{fill: 'rgb(210,210,210', stroke: 'rgb(0,0,0)', strokeWidth: .5}} />
                    <line x1="0" y1="0" x2="0" y2="30" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                    <line x1="40" y1="0" x2="40" y2="30" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                </svg>
            ) : (null)}
            {this.props.battleSize==="skirmish" && this.props.deployment.id === 3 ? (
               <svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg">
               <rect width="40" height="30" x="0" y="0" style={{ fill: 'rgb(210, 210, 210)' }} />
               <circle cx="0" cy="0" r="10" style={{fill: 'rgb(210,210,210', stroke: 'rgb(0,0,0)', strokeWidth: .5}} />
               <circle cx="0" cy="30" r="10" style={{fill: 'rgb(210,210,210', stroke: 'rgb(0,0,0)', strokeWidth: .5}} />
               <line x1="0" y1="0" x2="0" y2="30" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
               <line x1="40" y1="0" x2="40" y2="30" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
               <line x1="40" y1="0" x2="30" y2="15" style={{ stroke: 'rgb(0,0,0)', strokeWidth: .5 }} />
               <line x1="40" y1="30" x2="30" y2="15" style={{ stroke: 'rgb(0,0,0)', strokeWidth: .5 }} />
           </svg>
            ) : (null)}
            {this.props.battleSize==="skirmish" && this.props.deployment.id === 4 ? (
               <svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="30" x="0" y="0" style={{ fill: 'rgb(210, 210, 210)' }} />
                    <line x1="0" y1="0" x2="0" y2="30" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                    <line x1="40" y1="0" x2="40" y2="30" style={{ stroke: 'rgb(255,0,0)', strokeWidth: 1 }} />
                </svg>
            ) : (null)}

            </div>
        );
    }

}

export interface IAlphaStrikeMPMapsProps {
    battleSize: string;
    deployment: IAlphaStrikeMPDeployment;
}

export interface IAlphaStrikeMPMapsState {
    updated: false;
}

