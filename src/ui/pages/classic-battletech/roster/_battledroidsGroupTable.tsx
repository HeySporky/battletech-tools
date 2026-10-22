import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import BattledroidsUnit from '../../../../classes/battledroids-unit';
import { battledroidsUnitDesigns } from '../../../../data/battledroids-units';
import { IAppGlobals } from '../../../app-router';
import StatBar from '../../../components/stat-bar';
const Trash = FaTrash as any;

/**
 * The tanks, jeeps and infantry squads of Expert Battledroids (BD pp.22-23) in a roster group. They are fixed
 * designs, so they are added from the rulebook's list and not from a creator.
 */
export default class BattledroidsGroupTable extends React.Component<IBattledroidsGroupTableProps, IBattledroidsGroupTableState> {

    constructor(props: IBattledroidsGroupTableProps) {
        super(props);
        this.state = {
            addTag: "",
        }
    }

    private _save = (): void => {
        if( this.props.appGlobals.currentCBTForce ) {
            this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        }
    }

    addUnit = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const force = this.props.appGlobals.currentCBTForce;
        if( this.state.addTag && force && force.groups[this.props.bmGroupIndex] ) {
            force.groups[this.props.bmGroupIndex].battledroidsUnits.push( new BattledroidsUnit( this.state.addTag ) );
            this._save();
            this.setState({ addTag: "" });
        }
    }

    removeUnit = (e: React.FormEvent<HTMLButtonElement>, unit: BattledroidsUnit, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + unit.getDisplayName() + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].battledroidsUnits.splice(index, 1);
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
        const units = force.groups[this.props.bmGroupIndex].battledroidsUnits;

        if( units.length === 0 && !this.props.showAdd ) {
            return null;
        }
        const columns = this.props.showEdit ? 5 : 4;

        return (
            <table className="table" data-testid="battledroids-group-table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"></th> : null}
                        <th>Battledroids (1984) Tanks, Jeeps and Infantry</th>
                        <th>Weapons</th>
                        <th className="min-width no-wrap text-center">MP</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                    </tr>
                </thead>
                {units.map( (unit, index) => (
                    <tbody key={unit.getUUID()}>
                        <tr>
                            {this.props.showEdit ? (
                                <td className="min-width no-wrap text-center">
                                    <button
                                        onClick={(e) => this.removeUnit(e, unit, index)}
                                        title="Click here to remove this unit."
                                        className="btn btn-danger btn-sm"
                                    >
                                        <Trash />
                                    </button>
                                </td>
                            ) : null}
                            <td>
                                {unit.getDisplayName()}
                                <div className='small-text'>{unit.getKind().name}, BD p.{unit.getDesign().page}</div>
                            </td>
                            <td className="small-text">
                                {unit.getWeaponSummary().map( (weapon) => <div key={weapon}>{weapon}</div> )}
                            </td>
                            <td className="min-width no-wrap text-center">{unit.getKind().movementPoints} ({unit.getKind().movementPointsFiring} firing)</td>
                            <td className="min-width no-wrap text-center">
                                {this.props.showEdit ? (
                                    <select aria-label="Battledroids unit gunnery skill" value={unit.getGunnery()} onChange={(e) => { unit.setGunnery(+e.currentTarget.value); this._save(); }}>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map( (skill) => <option key={skill} value={skill}>{skill}</option> )}
                                    </select>
                                ) : unit.getGunnery()}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={columns}>
                                {unit.isDestroyed() ? (
                                    <div className="text-center color-bright-red"><strong>This Unit is Destroyed</strong></div>
                                ) : unit.isDamaged() ? (
                                    <div className="text-center color-bright-red"><strong>This Unit is Damaged</strong></div>
                                ) : <div className="text-center">This Unit is Undamaged</div>}
                                <div className="bars">
                                    <StatBar
                                        color="white"
                                        background="#aaa"
                                        currentPercentage={unit.getStrengthPercentage()}
                                        currentNumber={unit.getStrengthPercentage()}
                                        height={8}
                                        title="Strength Remaining"
                                    />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                ))}
                {this.props.showAdd ? (
                    <tfoot>
                        <tr>
                            <td colSpan={columns}>
                                <select
                                    aria-label="Battledroids unit to add"
                                    value={this.state.addTag}
                                    onChange={(e) => this.setState({ addTag: e.currentTarget.value })}
                                >
                                    <option value="">Select a Battledroids tank, jeep or infantry squad...</option>
                                    {battledroidsUnitDesigns.map( (design) => (
                                        <option key={design.tag} value={design.tag}>{design.name}</option>
                                    ))}
                                </select>{" "}
                                <button
                                    className="btn btn-primary btn-sm"
                                    disabled={!this.state.addTag}
                                    onClick={this.addUnit}
                                    title="Add the selected Battledroids unit to this group"
                                >
                                    Add Battledroids Unit
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
        )
    }
}

interface IBattledroidsGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IBattledroidsGroupTableState {
    addTag: string;
}
