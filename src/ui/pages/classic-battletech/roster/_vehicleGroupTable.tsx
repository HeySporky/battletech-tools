import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import Pilot from '../../../../classes/pilot';
import Vehicle from '../../../../classes/vehicle';
import { IAppGlobals } from '../../../app-router';
import StatBar from '../../../components/stat-bar';
const Trash = FaTrash as any;

/**
 * The combat vehicles in a Classic BattleTech roster group: add saved vehicles from the
 * Vehicle Creator, set the crew's gunnery and driving skills, and see damage at a glance.
 */
export default class VehicleGroupTable extends React.Component<IVehicleGroupTableProps, IVehicleGroupTableState> {

    constructor(props: IVehicleGroupTableProps) {
        super(props);
        this.state = {
            addVehicleIndex: -1,
        }
    }

    private _save = (): void => {
        if( this.props.appGlobals.currentCBTForce ) {
            this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        }
    }

    addVehicle = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const save = this.props.appGlobals.vehicleSaves[this.state.addVehicleIndex];
        const force = this.props.appGlobals.currentCBTForce;
        if( save && force && force.groups[this.props.bmGroupIndex] ) {
            const vehicle = new Vehicle( JSON.stringify(save) );
            vehicle.newUUID();
            vehicle.resetInPlay();
            force.groups[this.props.bmGroupIndex].vehicles.push( vehicle );
            this._save();
            this.setState({ addVehicleIndex: -1 });
        }
    }

    removeVehicle = (e: React.FormEvent<HTMLButtonElement>, vehicle: Vehicle, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + vehicleName(vehicle) + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].vehicles.splice(index, 1);
                    this._save();
                }
            }
        );
    }

    updateCrew = (vehicle: Vehicle, field: "name" | "piloting" | "gunnery", value: string): void => {
        const pilot = new Pilot( vehicle.getPilot().export() );
        if( field === "name" ) {
            pilot.name = value;
        } else {
            pilot[field] = +value;
        }
        vehicle.setPilot( pilot );
        this._save();
    }

    render = (): React.ReactNode => {
        const force = this.props.appGlobals.currentCBTForce;
        if( !force || !force.groups[this.props.bmGroupIndex] ) {
            return null;
        }
        const vehicles = force.groups[this.props.bmGroupIndex].vehicles;
        const saves = this.props.appGlobals.vehicleSaves;

        if( vehicles.length === 0 && !this.props.showAdd ) {
            return null;
        }

        return (
            <table className="table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"></th> : null}
                        <th>Vehicle</th>
                        <th>Tons</th>
                        <th>Tech</th>
                        <th className="min-width no-wrap text-center">Driving</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                        <th className="min-width no-wrap text-center">Points</th>
                    </tr>
                </thead>
                {vehicles.map( (vehicle, index) => {
                    const pilot = vehicle.getPilot();
                    const pilotBV = vehicle.getPilotAdjustedBattleValue();
                    const baseBV = vehicle.getBattleValue();
                    return (
                        <tbody key={vehicle.getUUID()}>
                            <tr>
                                {this.props.showEdit ? (
                                    <td className="min-width no-wrap text-center">
                                        <button
                                            onClick={(e) => this.removeVehicle(e, vehicle, index)}
                                            title="Click here to remove this vehicle."
                                            className="btn btn-danger btn-sm"
                                        >
                                            <Trash />
                                        </button>
                                    </td>
                                ) : null}
                                <td>
                                    {vehicleName(vehicle)}
                                    <div className='small-text'>
                                        {vehicle.getMotiveType().name}
                                        {this.props.showEdit ? (
                                            <>
                                                {" "}&ndash; Commander:{" "}
                                                <input
                                                    type="text"
                                                    aria-label="Vehicle commander name"
                                                    value={pilot.name}
                                                    onChange={(e) => this.updateCrew(vehicle, "name", e.currentTarget.value)}
                                                />
                                            </>
                                        ) : pilot.name && pilot.name.trim() ? (
                                            <> &ndash; <strong>Commander:</strong> {pilot.name}</>
                                        ) : null}
                                    </div>
                                </td>
                                <td className="min-width no-wrap text-center">{vehicle.getTonnage()}</td>
                                <td className="min-width no-wrap text-center small-text">{vehicle.getTech().name}</td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <SkillSelect label="Driving skill" value={pilot.piloting} onChange={(value) => this.updateCrew(vehicle, "piloting", value)} />
                                    ) : pilot.piloting}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <SkillSelect label="Gunnery skill" value={pilot.gunnery} onChange={(value) => this.updateCrew(vehicle, "gunnery", value)} />
                                    ) : pilot.gunnery}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {pilotBV}
                                    {pilotBV !== baseBV ? <div className='small-text'>Base: {baseBV}</div> : null}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={this.props.showEdit ? 7 : 6}>
                                    {vehicle.isDestroyed() ? (
                                        <div className="text-center color-bright-red"><strong>This Vehicle is Destroyed</strong></div>
                                    ) : vehicle.isDamaged() ? (
                                        <div className="text-center color-bright-red"><strong>This Vehicle is Damaged</strong></div>
                                    ) : <div className="text-center">This Vehicle is Undamaged</div>}
                                    <div className="bars">
                                        <StatBar
                                            color="blue"
                                            background="#aaa"
                                            currentPercentage={vehicle.getArmorPercentage()}
                                            currentNumber={vehicle.getCurrentArmor()}
                                            height={8}
                                            title="Current Armor Status"
                                        />
                                        <StatBar
                                            color="white"
                                            background="#aaa"
                                            currentPercentage={vehicle.getStructurePercentage()}
                                            currentNumber={vehicle.getCurrentStructure()}
                                            height={8}
                                            title="Current Internal Structure Status"
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
                            <td colSpan={this.props.showEdit ? 7 : 6}>
                                {saves.length > 0 ? (
                                    <>
                                        <select
                                            aria-label="Saved vehicle to add"
                                            value={this.state.addVehicleIndex}
                                            onChange={(e) => this.setState({ addVehicleIndex: +e.currentTarget.value })}
                                        >
                                            <option value={-1}>Select a saved vehicle...</option>
                                            {saves.map( (save, saveIndex) => (
                                                <option key={saveIndex} value={saveIndex}>
                                                    {`${save.name || ""} ${save.model || ""}`.trim() || "Unnamed Vehicle"} ({save.tonnage} t)
                                                </option>
                                            ))}
                                        </select>{" "}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={this.state.addVehicleIndex < 0}
                                            onClick={this.addVehicle}
                                            title="Add the selected vehicle to this group"
                                        >
                                            Add Vehicle
                                        </button>
                                    </>
                                ) : (
                                    <span className="small-text">Save vehicles in the Vehicle Creator to add them to this group.</span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
        )
    }
}

const SkillSelect = (props: { label: string; value: number; onChange: (value: string) => void }) => (
    <select aria-label={props.label} value={props.value} onChange={(e) => props.onChange(e.currentTarget.value)}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map( (skill) => <option key={skill} value={skill}>{skill}</option> )}
    </select>
);

export const vehicleName = (vehicle: Vehicle): string => {
    return `${vehicle.getName()} ${vehicle.getModel()}`.trim() || "Unnamed Vehicle";
}

interface IVehicleGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IVehicleGroupTableState {
    addVehicleIndex: number;
}
