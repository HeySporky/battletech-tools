import React from 'react';
import { IAppGlobals } from '../../app-router';
import { AlphaStrikeUnit } from '../../../classes/alpha-strike-unit';
import './alpha-strike-unit-token.scss';
import BattleTechLogo from '../battletech-logo';

export default class AlphaStrikeUnitToken extends React.Component<IAlphaStrikeUnitTokenProps, IAlphaStrikeUnitTokenState> {

    render = (): JSX.Element => {
        if( !this.props.asUnit ) {
            return <></>
        }

        let classes = ["alpha-strike-unit-token"];
        classes.push(this.props.asUnit.type.toLowerCase());
        classes.push(this.props.asUnit.abilities.indexOf("LG") > -1 ? 'superheavy' : "");

        return (

            <div className={classes.join(" ")}>
                <div className='front'>
                    {this.props.asUnit.imageURL ? ( <img alt="unit portrait" src={this.props.asUnit.imageURL}></img> ) : null}
                    <div className="unit-name">
                        <div className="custom-name">{this.props.asUnit.customName}</div>
                    </div>
                </div>
                <div className='back'>
                    <div className="unit-name">
                        {this.props.asUnit.customName ? (<div className="custom-name">{this.props.asUnit.customName}</div>) : null }
                        <div className="class">{this.props.asUnit.name}</div>
                    </div>
                    <div className='group'>{this.props.groupName}</div>
                    <svg version="1.1" x="0px" y="0px" viewBox="0 0 180 30" xmlns="http://www.w3.org/2000/svg">
                        <BattleTechLogo
                            xLoc={0}
                            yLoc={0}
                            width={80}
                            baseColor='rgb(35,31,32)'
                            altColor='rgb(105,106,108)'
                        />
                    </svg>
                </div>
            </div>
        )
    }
}

interface IAlphaStrikeUnitTokenProps {
    asUnit: AlphaStrikeUnit | null;
    groupName: string;
    appGlobals: IAppGlobals;
    className?: string;
}

interface IAlphaStrikeUnitTokenState {

}