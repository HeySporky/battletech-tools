import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import Building from '../../../../classes/building';
import { IAppGlobals } from '../../../app-router';
const Trash = FaTrash as any;

/** One line on what a building is: "Heavy Gun Emplacement, CF 80, 1 hex, 1 level". */
export const buildingSummary = (building: Building): string => {
    const type = building.getType();
    return `${type.tag === "none" ? "" : type.name + " "}${building.getClassification().name}, CF ${building.getCF()}${building.isCapitalScale() ? " (capital scale)" : ""}, `
        + `${building.getHexes()} ${building.getHexLabel(building.getHexes() !== 1)}, ${building.getLevels()} ${building.getLevels() === 1 ? "level" : "levels"}`;
};

/**
 * The gun emplacements and other buildings in a Classic BattleTech roster group: add saved buildings from the
 * Building Creator, set their gunners' skill, and see their condition at a glance. No Battle Value method for
 * buildings was found in the rulebooks, so they add nothing to the group's points.
 */
export default class BuildingGroupTable extends React.Component<IBuildingGroupTableProps, IBuildingGroupTableState> {

    constructor(props: IBuildingGroupTableProps) {
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

    addBuilding = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const save = this.props.appGlobals.buildingSaves[this.state.addIndex];
        const force = this.props.appGlobals.currentCBTForce;
        if( save && force && force.groups[this.props.bmGroupIndex] ) {
            const building = new Building( JSON.stringify(save) );
            building.newUUID();
            force.groups[this.props.bmGroupIndex].buildings.push( building );
            this._save();
            this.setState({ addIndex: -1 });
        }
    }

    removeBuilding = (e: React.FormEvent<HTMLButtonElement>, building: Building, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + building.getDisplayName() + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].buildings.splice(index, 1);
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
        const buildings = force.groups[this.props.bmGroupIndex].buildings;
        const saves = this.props.appGlobals.buildingSaves;

        if( buildings.length === 0 && !this.props.showAdd ) {
            return null;
        }

        return (
            <table className="table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"></th> : null}
                        <th>Building</th>
                        <th className="min-width no-wrap text-center">Armor</th>
                        <th>Tech</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                        <th className="min-width no-wrap text-center">Points</th>
                    </tr>
                </thead>
                {buildings.map( (building, index) => (
                    <tbody key={building.getUUID()}>
                        <tr>
                            {this.props.showEdit ? (
                                <td className="min-width no-wrap text-center">
                                    <button
                                        onClick={(e) => this.removeBuilding(e, building, index)}
                                        title="Click here to remove this building."
                                        className="btn btn-danger btn-sm"
                                    >
                                        <Trash />
                                    </button>
                                </td>
                            ) : null}
                            <td>
                                {building.getDisplayName()}
                                <div className='small-text'>{buildingSummary(building)}</div>
                            </td>
                            <td className="min-width no-wrap text-center">{building.getArmorPoints()}</td>
                            <td className="min-width no-wrap text-center small-text">{building.getTech().name}</td>
                            <td className="min-width no-wrap text-center">
                                {building.getMinimumGunners() === 0 ? "-" : this.props.showEdit ? (
                                    <select aria-label="Building gunnery skill" value={building.getGunnery()} onChange={(e) => { building.setGunnery(+e.currentTarget.value); this._save(); }}>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map( (skill) => <option key={skill} value={skill}>{skill}</option> )}
                                    </select>
                                ) : building.getGunnery()}
                            </td>
                            <td className="min-width no-wrap text-center" title="No Battle Value method for buildings was found in the rulebooks">-</td>
                        </tr>
                    </tbody>
                ))}
                {this.props.showAdd ? (
                    <tfoot>
                        <tr>
                            <td colSpan={this.props.showEdit ? 6 : 5}>
                                {saves.length > 0 ? (
                                    <>
                                        <select
                                            aria-label="Saved building to add"
                                            value={this.state.addIndex}
                                            onChange={(e) => this.setState({ addIndex: +e.currentTarget.value })}
                                        >
                                            <option value={-1}>Select a saved building...</option>
                                            {saves.map( (save, saveIndex) => (
                                                <option key={saveIndex} value={saveIndex}>
                                                    {save.name || "Unnamed Building"} (CF {save.cf})
                                                </option>
                                            ))}
                                        </select>{" "}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={this.state.addIndex < 0}
                                            onClick={this.addBuilding}
                                            title="Add the selected building to this group"
                                        >
                                            Add Building
                                        </button>
                                    </>
                                ) : (
                                    <span className="small-text">Save buildings in the Building Creator to add them to this group.</span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
        )
    }
}

interface IBuildingGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IBuildingGroupTableState {
    addIndex: number;
}
