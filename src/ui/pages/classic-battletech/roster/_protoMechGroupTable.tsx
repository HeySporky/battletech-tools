import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import ProtoMech, { PROTOMECH_POINT_SIZE } from '../../../../classes/protomech';
import { IAppGlobals } from '../../../app-router';
import StatBar from '../../../components/stat-bar';
const Trash = FaTrash as any;

/**
 * The ProtoMechs in a Classic BattleTech roster group: add saved designs from the ProtoMech Creator as Points, set
 * how many ProtoMechs each Point fields and its Gunnery skill, and see its strength at a glance.
 */
export default class ProtoMechGroupTable extends React.Component<IProtoMechGroupTableProps, IProtoMechGroupTableState> {

    constructor(props: IProtoMechGroupTableProps) {
        super(props);
        this.state = {
            addIndex: -1,
        }
    }

    private _save = (): void => {
        if( this.props.appGlobals.currentCBTForce ) {
            this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        }
    }

    addPoint = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const save = this.props.appGlobals.protoMechSaves[this.state.addIndex];
        const force = this.props.appGlobals.currentCBTForce;
        if( save && force && force.groups[this.props.bmGroupIndex] ) {
            const point = new ProtoMech( JSON.stringify(save) );
            point.newUUID();
            point.resetInPlay();
            force.groups[this.props.bmGroupIndex].protoMechs.push( point );
            this._save();
            this.setState({ addIndex: -1 });
        }
    }

    removePoint = (e: React.FormEvent<HTMLButtonElement>, point: ProtoMech, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + point.getDisplayName() + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].protoMechs.splice(index, 1);
                    this._save();
                }
            }
        );
    }

    render = (): React.ReactNode => {
        const force = this.props.appGlobals.currentCBTForce;
        if( !force || !force.groups[this.props.bmGroupIndex] ) {
            return null;
        }
        const points = force.groups[this.props.bmGroupIndex].protoMechs;
        const saves = this.props.appGlobals.protoMechSaves || [];

        if( points.length === 0 && !this.props.showAdd ) {
            return null;
        }

        return (
            <table className="table" data-testid="protomech-group-table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"></th> : null}
                        <th>ProtoMech Point</th>
                        <th>ProtoMechs</th>
                        <th>Tech</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                        <th className="min-width no-wrap text-center">Points</th>
                    </tr>
                </thead>
                {points.map( (point, index) => {
                    const adjustedBV = point.getSkillAdjustedPointBattleValue();
                    const baseBV = point.getPointBattleValue();
                    return (
                        <tbody key={point.getUUID()}>
                            <tr>
                                {this.props.showEdit ? (
                                    <td className="min-width no-wrap text-center">
                                        <button
                                            onClick={(e) => this.removePoint(e, point, index)}
                                            title="Click here to remove this Point."
                                            className="btn btn-danger btn-sm"
                                        >
                                            <Trash />
                                        </button>
                                    </td>
                                ) : null}
                                <td>
                                    {point.getDisplayName()}
                                    <div className='small-text'>{point.getTons()}-ton {point.getChassisName()} ProtoMech, {point.getMovementText()}; {point.getBattleValue()} BV each</div>
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <select aria-label="ProtoMechs in the Point" value={point.getPointSize()} onChange={(e) => { point.setPointSize(+e.currentTarget.value); this._save(); }}>
                                            {Array.from({ length: PROTOMECH_POINT_SIZE }, (_unused, size) => <option key={size + 1} value={size + 1}>{size + 1}</option> )}
                                        </select>
                                    ) : point.getPointSize()}
                                </td>
                                <td className="min-width no-wrap text-center small-text">{point.getTechName()}</td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <select aria-label="ProtoMech gunnery skill" value={point.getGunnery()} onChange={(e) => { point.setGunnery(+e.currentTarget.value); this._save(); }}>
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map( (skill) => <option key={skill} value={skill}>{skill}</option> )}
                                        </select>
                                    ) : point.getGunnery()}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {adjustedBV}
                                    {adjustedBV !== baseBV ? <div className='small-text'>Base: {baseBV}</div> : null}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={this.props.showEdit ? 6 : 5}>
                                    {point.isDestroyed() ? (
                                        <div className="text-center color-bright-red"><strong>This Point is Destroyed</strong></div>
                                    ) : point.isDamaged() ? (
                                        <div className="text-center color-bright-red"><strong>This Point is Damaged</strong></div>
                                    ) : <div className="text-center">This Point is at Full Strength</div>}
                                    <div className="bars">
                                        <StatBar
                                            color="white"
                                            background="#aaa"
                                            currentPercentage={Math.round(point.getActiveUnits() / point.getPointSize() * 100)}
                                            currentNumber={point.getActiveUnits()}
                                            height={8}
                                            title="ProtoMechs Active"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    )
                })}
                {this.props.showAdd ? (
                    <tfoot>
                        <tr>
                            <td colSpan={this.props.showEdit ? 6 : 5}>
                                {saves.length > 0 ? (
                                    <>
                                        <select
                                            aria-label="Saved ProtoMech to add"
                                            value={this.state.addIndex}
                                            onChange={(e) => this.setState({ addIndex: +e.currentTarget.value })}
                                        >
                                            <option value={-1}>Select a saved ProtoMech...</option>
                                            {saves.map( (save, saveIndex) => (
                                                <option key={saveIndex} value={saveIndex}>
                                                    {save.name || "Unnamed ProtoMech"} ({save.tons} tons, Point of {save.pointSize})
                                                </option>
                                            ))}
                                        </select>{" "}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={this.state.addIndex < 0}
                                            onClick={this.addPoint}
                                            title="Add the selected ProtoMech to this group as a Point"
                                        >
                                            Add ProtoMech Point
                                        </button>
                                    </>
                                ) : (
                                    <span className="small-text">Save designs in the ProtoMech Creator to add them to this group.</span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
        )
    }
}

interface IProtoMechGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IProtoMechGroupTableState {
    addIndex: number;
}
