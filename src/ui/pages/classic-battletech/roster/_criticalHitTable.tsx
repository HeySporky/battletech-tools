import * as React from 'react';
import { FaCheckSquare } from 'react-icons/fa';
import { MdDangerous } from 'react-icons/md';
import { BattleMech, ICriticalSlot } from '../../../../classes/battlemech';
import { getLocationName } from '../../../../utils';
import { makeRange } from '../../../../utils/makeRange';
import { getCriticalTables } from '../../../../utils/critical-tables';
import { IAppGlobals } from '../../../app-router';
import type { JSX } from "react";
const CheckSquare = FaCheckSquare as any;
const Dangerous = MdDangerous as any;

/**
 * How many lines play mode shows for a location: the 'Mech's own count under Clell Flint's construction rules (#172),
 * otherwise the sheet's canon tables (12 for torsos and arms, 6 for the head and legs; a quad's or QuadVee's front legs 6).
 */
export function getPlayCritSlotCount(mech: BattleMech, location: string): number {
    if (mech.usesFutureWarsConstruction()) return mech.getLocationSlotCount(location);
    const fourLegged = mech.isQuad() || mech.isQuadVee();
    return ["hd", "ll", "rl", "cl"].includes(location) || (fourLegged && ["la", "ra", "fll", "frl"].includes(location)) ? 6 : 12;
}

export default class InPlayCriticalHitTable extends React.Component<IInPlayCriticalHitTableProps, IInPlayCriticalHitTableState> {

    toggleCritical = (
        location: string,
        critSlotIndex: number
    ) => {
        if( this.props.mechData ) {
            this.props.mechData.toggleCritical(location, critSlotIndex );
            this.props.onChange( this.props.mechData );
        }
    }

    // Roll on the Determining Critical Hits Table (TW p.124), or by the design's edition (Battledroids: 7 or more, BD p.18).
    rollCritical = (e: React.FormEvent<HTMLButtonElement>) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({ log: this.props.mechData.rollCriticalHit( this.props.location ) });
        this.props.onChange( this.props.mechData );
    }

    render = (): JSX.Element => {
        let lastCritName = "";
        const editionRoll = this.props.mechData.getEditionPlayRules()?.criticalHitRoll;
        const modifier = this.props.mechData.getCriticalHitRollModifier();
        const rollLabel = editionRoll ? `${editionRoll}+` : modifier ? `8+, +${modifier} to the roll` : "8+";
        return(
            <fieldset className="fieldset">
                <legend>{getLocationName(this.props.location, this.props.mechData.isQuad() )}</legend>
                <table className="full-width">
                    <tbody>
                {makeRange(0, this.props.numberCritSlots - 1).map( ( critSlotIndex ) => {
                    let crit: ICriticalSlot | null = null;
                    let hr: JSX.Element | null = null;
                    // Tables of six (TW p.124; ours past 12 slots, #172), each with the die numbers that pick it.
                    const tables = getCriticalTables(this.props.numberCritSlots);
                    const table = tables.find( t => critSlotIndex >= t.start && critSlotIndex < t.start + t.length );
                    const line = critSlotIndex - (table ? table.start : 0) + 1;

                    if( table && tables.length > 1 && table !== tables[tables.length - 1] && critSlotIndex === table.start + table.length - 1 )
                        hr = <tr><td colSpan={4}><hr /></td></tr>

                    let firstColData = <React.Fragment></React.Fragment>
                    if( table && tables.length > 1 && critSlotIndex === table.start ) {
                        firstColData = <td rowSpan={table.length} data-testid="play-crit-table-dice">{table.label}</td>
                    }

                    if( this.props.critData[critSlotIndex]) {
                        crit = this.props.critData[critSlotIndex]
                        if( !crit.placeholder ) {
                            lastCritName = crit.name;
                        }
                        return (
                            <React.Fragment key={critSlotIndex}>
                            <tr>
                                {firstColData}

                                <td data-testid="play-crit-line" className={this.props.mechData.isCriticalDamaged( this.props.location, critSlotIndex  ) ? "color-brighter-red" : ""}>
                                    {line}
                                </td>
                                <td
                                    className={this.props.mechData.isCriticalDamaged( this.props.location, critSlotIndex  ) ? "color-brighter-red cursor-pointer font-weight-700" : "cursor-pointer"}
                                    onClick={() => this.toggleCritical( this.props.location, critSlotIndex )}
                                >
                                    {this.props.mechData.isCriticalDamaged( this.props.location, critSlotIndex  ) ? (
                                        <Dangerous />
                                    ) : (
                                        <CheckSquare className="color-green" />
                                    )}
                                    &nbsp;{lastCritName}
                                </td>
                            </tr>
                            {hr}
                            </React.Fragment>
                        )
                    } else {
                        return (
                            <React.Fragment key={critSlotIndex}>
                            <tr>
                                {firstColData}
                                <td data-testid="play-crit-line" className="color-light-gray font-weight-100">
                                    {line}
                                </td>
                                <td className="color-light-gray font-weight-100">
                                    ( Roll Again )
                                </td>
                            </tr>
                            {hr}
                            </React.Fragment>
                        )
                    }

                })}
                </tbody>
                </table>
                <div className="small-text">
                    <button className="btn btn-sm btn-primary" onClick={this.rollCritical} title="Roll when this location's internal structure is damaged">
                        Roll for a Critical Hit ({rollLabel})
                    </button>
                    {(this.state?.log ?? []).map( (line, index) => <div key={index}>{line}</div> )}
                </div>
            </fieldset>
        )
    }
}

interface IInPlayCriticalHitTableProps {
    appGlobals: IAppGlobals;
    mechData: BattleMech;
    critData: ICriticalSlot[];
    location: string;
    numberCritSlots: number;
    onChange( nv: BattleMech ): void;
}

interface IInPlayCriticalHitTableState {
    log?: string[];

}