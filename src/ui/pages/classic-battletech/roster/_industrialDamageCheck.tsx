import * as React from 'react';
import { BattleMech } from '../../../../classes/battlemech';
import type { JSX } from "react";

// An IndustrialMech's End Phase damage check after a fall or a successful physical attack (TW pp.68, 144).
export default class InPlayIndustrialDamageCheck extends React.Component<IInPlayIndustrialDamageCheckProps, IInPlayIndustrialDamageCheckState> {

    state: IInPlayIndustrialDamageCheckState = { levelsFallen: 0, log: [] };

    setLevelsFallen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const levels = Math.floor(Number(e.currentTarget.value));
        this.setState({ levelsFallen: Number.isFinite(levels) && levels > 0 ? Math.min(levels, 99) : 0 });
    }

    roll = (e: React.FormEvent<HTMLButtonElement>) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({ log: this.props.mechData.rollIndustrialMechDamageCheck( this.state.levelsFallen ) });
        this.props.onChange( this.props.mechData );
    }

    render = (): JSX.Element => {
        return (
            <fieldset className="fieldset" data-testid="industrial-damage-check">
                <legend>IndustrialMech Damage Check</legend>
                <p className="small-text">
                    Once in the End Phase of a turn in which this IndustrialMech fell or was hit by a physical attack (TW pp.68, 144).
                </p>
                <label>
                    Levels fallen (0 for a physical attack):{" "}
                    <input type="number" min={0} max={99} value={this.state.levelsFallen} onChange={this.setLevelsFallen} />
                </label>
                <div className="small-text">
                    <button className="btn btn-sm btn-primary" onClick={this.roll}>
                        Roll the Damage Check
                    </button>
                    {this.state.log.map( (line, index) => <div key={index}>{line}</div> )}
                </div>
            </fieldset>
        );
    }
}

interface IInPlayIndustrialDamageCheckProps {
    mechData: BattleMech;
    onChange( nv: BattleMech ): void;
}

interface IInPlayIndustrialDamageCheckState {
    levelsFallen: number;
    log: string[];
}
