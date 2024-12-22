import React from "react";

export default class AlphaStrikeMPMaps extends React.Component<IAlphaStrikeMPMapsProps, IAlphaStrikeMPMapsState> {
    constructor(props: IAlphaStrikeMPMapsProps) {
        super(props);
        this.state = {
            updated: false,
        }
    }

    render() {
        return (
            <div>
                <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="40" x="0" y="0" style={{ fill: 'rgb(255,255,255)' }} />
                    <line x1="0" y1="10" x2="60" y2="10" style={{ stroke: 'rgb(0,0,0)', strokeWidth: .25 }} />
                </svg>
            </div>
        );
    }

}

export interface IAlphaStrikeMPMapsProps {

}

export interface IAlphaStrikeMPMapsState {
    updated: false;
}

