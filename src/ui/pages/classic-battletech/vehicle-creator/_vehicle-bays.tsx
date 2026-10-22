import React, { type JSX } from 'react';
import { FaTrash } from "react-icons/fa";
import { IAppGlobals } from '../../../app-router';
import InputNumeric from "../../../components/form_elements/input_numeric";
import { getVehicleBayType, getVehicleBayWeight, VEHICLE_BAY_TYPES } from '../../../../data/vehicle-transport-bays';
const Trash = FaTrash as any;

/**
 * Transport bays on a Combat or Support Vehicle (TM p.239, errata v8.0): cargo by the ton, the others by the bay or
 * cubicle, each with its doors. One item slot per bay, one per container, one for all infantry bays of a type.
 */
export default class VehicleBays extends React.Component<IVehicleBaysProps, IVehicleBaysState> {
    constructor(props: IVehicleBaysProps) {
        super(props);
        this.state = { newBay: VEHICLE_BAY_TYPES[0].tag };
    }

    private change = (change: (vehicle: NonNullable<IAppGlobals["currentVehicle"]>) => void): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            change(vehicle);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;
        const smallSteps = vehicle.getTonnage() < 5;
        return (
            <>
                <h3>Transport Bays</h3>
                {vehicle.getBays().length > 0 ? (
                    <table className="table" data-testid="vehicle-bays">
                        <thead>
                            <tr><th>Bay</th><th>Tons, Bays or Cubicles</th><th>Doors</th><th>Weight</th><th></th></tr>
                        </thead>
                        <tbody>
                            {vehicle.getBays().map((bay, index) => {
                                const type = getVehicleBayType(bay.tag);
                                const name = vehicle.getBayName(bay);
                                return (
                                    <tr key={`${bay.tag}-${index}`}>
                                        <td>{name}<br /><span className="smaller-text">{type?.capacity}</span></td>
                                        <td>
                                            <InputNumeric
                                                title={`${name}: ${type?.tonsEach === null ? "tons" : "bays or cubicles"}`}
                                                value={bay.amount}
                                                min={type?.tonsEach === null ? 0.001 : 1}
                                                step={type?.tonsEach === null ? (smallSteps ? 0.001 : 0.5) : 1}
                                                setValue={(amount: number) => this.change((v) => v.setBay(index, amount, bay.doors))}
                                            />
                                        </td>
                                        <td>
                                            <InputNumeric
                                                title={`${name}: doors`}
                                                value={bay.doors}
                                                min={0}
                                                step={1}
                                                setValue={(doors: number) => this.change((v) => v.setBay(index, bay.amount, doors))}
                                            />
                                        </td>
                                        <td>{Math.round(getVehicleBayWeight(bay) * 1000) / 1000} t</td>
                                        <td>
                                            <button className="btn btn-danger btn-sm" title={`Remove ${name}`} onClick={() => this.change((v) => v.removeBay(index))}>
                                                <Trash />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : null}
                <label>
                    Add a bay:
                    <select value={this.state.newBay} onChange={(e) => this.setState({ newBay: e.currentTarget.value })}>
                        {VEHICLE_BAY_TYPES.map((type) => (
                            <option key={type.tag} value={type.tag}>{type.name} ({type.tonsEach === null ? "by the ton" : `${type.tonsEach} t each`})</option>
                        ))}
                    </select>
                </label>
                <button className="btn btn-primary btn-sm" onClick={() => this.change((v) => v.addBay(this.state.newBay))}>Add Bay</button>
                <p className="smaller-text">
                    1 item slot for each bay, 1 for each container, and 1 for all infantry bays of the same type (TM p.239, errata
                    v8.0). Unspent weight with a free slot may also go to cargo (TM p.120).
                </p>
            </>
        );
    }
}

interface IVehicleBaysProps {
    appGlobals: IAppGlobals;
}

interface IVehicleBaysState {
    newBay: string;
}
