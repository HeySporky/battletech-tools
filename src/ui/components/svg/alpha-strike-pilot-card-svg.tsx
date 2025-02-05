import React from 'react';
import { IAppGlobals } from '../../app-router';
import BattleTechLogo from '../battletech-logo';
import './alpha-strike-card-svg.scss';

export default class AlphaStrikePilotCardSVG extends React.Component<IAlphaStrikePilotCardSVGProps, IAlphaStrikePilotCardSVGState> {

    render = (): JSX.Element => {
        if( !this.props.pilotAbilities || this.props.pilotAbilities.length < 1 ) {
            return <></>
        }

        return (

            <>
                <svg className={"alpha-strike-card " + this.props.className} version="1.1" x="0px" y="0px" viewBox="0 0 1050 750" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(0, 0)">
                <rect x="0" y="0" width="1050" height="750px" fill="rgb(0,0,0)"></rect>
                <rect x="20" y="20" style={{zIndex: -1}} width="1010" height="710" fill="rgb(255,255,255)"></rect>

                <g className='card-name' transform='translate(36, 50)'>
                    <text x="0" y="2" className="variant">{this.props.unitVariant}</text>
                    <text x="0" y="60" className="impact" fontSize="40">{this.props.unitClass}</text>
                </g>

                <g transform="translate(1030, 20)" className='point-value'>
                    <path d="M -100 -1 L -136 68 H -42 L -6 -1" fill="rgb(188,189,192"/>
                    <path d="M -226 -1 L -180 80 H 0" fill='transparent' stroke='rgb(0,0,0)' strokeWidth={3}/>
                    <path d="M -213 -1 L -174 68 H 0" fill='transparent' stroke='rgb(0,0,0)' strokeWidth={3}/>
                    <text x="-10" y="48" textAnchor="end" className='current'><tspan>Cost: </tspan>{this.props.totalCost}</text>
                </g>


                <foreignObject x="40" y="120" width="970" height="590">
                {this.props.pilotAbilities.map( (ability, abilityIndex) => {
                    if (!ability) {
                        return null;
                    }
                    return (

                    <React.Fragment key={abilityIndex}>
                        <div className={"pilot-ability"}>
                            <div className='ability-name'>{ability.ability.toString()}</div><div className='ability-cost'>Cost: {ability.cost}</div>
                            <p>{ability.summary.toString()}</p>
                        </div>
                    </React.Fragment>
                    )
                })}
                </foreignObject>



                {/* <text x="60" y="96" fontFamily="sans-serif" fontSize="60">{this.props.pilotAbility.ability.toUpperCase()}</text>
                <foreignObject x="60" y="112" width="930" height="600" fill='red'>
                    <p className='description'>{this.props.pilotAbility.summary.toString()}</p>
                </foreignObject> */}



                <g transform='translate(20, 650)'>
                <path d="M 0 50 L 19 80 H 0" fill="rgb(188,189,192"/>
                <path d="M 96 15 H 188 L 226 80 H 134" fill="rgb(188,189,192"/>
                <path d="M 300 15 H 392 L 430 80 H 338" fill="rgb(188,189,192"/>
                <path d="M 0 15 H 475 L 513 80" fill='transparent' stroke='rgb(0,0,0)' strokeWidth={3}/>
                <path d="M 0 0 H 486 L 532 80" fill='transparent' stroke='rgb(0,0,0)' strokeWidth={3}/>
                <text x="237" y="64" textAnchor="middle" className='card-title'>PILOT ABILITIES</text>
                </g>

                <BattleTechLogo
                    xLoc={586}
                    yLoc={660}
                    width={414}
                    baseColor='rgb(35,31,32)'
                    altColor='rgb(105,106,108)'
                />
                </g>
                </svg>
            </>
        )
    }
}

interface IAlphaStrikePilotCardSVGProps {
    pilotAbilities: any[];
    totalCost: number;
    unitVariant: string;
    unitClass: string;
    inPlay?: boolean;
    appGlobals: IAppGlobals;
    className?: string;
    forPrint?: boolean;
    showExtreme?: boolean;
    measurementsInHexes: boolean;
}

interface IAlphaStrikePilotCardSVGState {
    showTakeDamage: boolean;
}