import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import Pilot from '../../../../classes/pilot';
import Vehicle from '../../../../classes/vehicle';
import { IAppGlobals } from '../../../app-router';
import MULSearchButton from './_mulSearchButton';
import StatBar from '../../../components/stat-bar';
import { formatBattleValue } from '../../../../data/battle-value';
import { BattleMech } from '../../../../classes/battlemech';
import { BattleMechForce } from '../../../../classes/battlemech-force';
import type { C3Role, IC3Network } from '../../../../utils/ewar-play';
const Trash = FaTrash as any;

const C3_NETWORK_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];

const C3_TYPE_NAMES: [IC3Network["type"], string][] = [["master-slave", "Master/Slave"], ["c3i", "C3i"], ["boosted", "Boosted"], ["naval", "Naval"], ["nova", "Nova link"], ["modular", "Modular"]];
const C3_ROLE_NAMES: [C3Role, string][] = [["master", "Master"], ["slave", "Slave"], ["emergency", "Emergency Master"]];

/**
 * A C3 unit's network in its force (BV v4.1 p.23): while editing, pickers for the network, its type and the unit role in it, with
 * the labels of any limit the edition refuses (E-War Phase 3); its name and role otherwise; nothing without C3.
 */
/**
 * A vehicle's tractor-trailer rig (Maximum Tech p.92): while editing, a picker for the vehicle that pulls it (any other vehicle in the
 * force); otherwise the tractor it is hitched to, or the trailers it pulls. Under Battle Value 1 the tractor and each trailer are rated
 * on the combined rig's MP and their values add up.
 */
export const RigField = (props: { force: BattleMechForce; unit: Vehicle; edit: boolean; onChange: () => void }): React.ReactNode => {
    const [labels, setLabels] = React.useState<string[]>([]);
    const uuid = props.unit.getUUID();
    const vehicles = props.force.groups.flatMap((group) => group.vehicles).filter((vehicle) => vehicle !== props.unit);
    const tractor = props.force.getRigTractor(uuid);
    const trailers = props.force.getRigTrailers(uuid);
    if( !props.edit ) {
        if( tractor ) return <div className='small-text' data-testid="rig-note"><strong>Pulled by:</strong> {vehicles.find((vehicle) => vehicle.getUUID() === tractor)?.getName() ?? "a tractor"} (rig Flank {props.force.getRigFlankMP(tractor)})</div>;
        return trailers.length > 0 ? <div className='small-text' data-testid="rig-note"><strong>Pulls:</strong> {trailers.map((trailer) => trailer.getName()).join(", ")} (rig Flank {props.force.getRigFlankMP(uuid)})</div> : null;
    }
    if( vehicles.length === 0 || trailers.length > 0 ) return trailers.length > 0 ? <div className='small-text'><strong>Pulls:</strong> {trailers.map((trailer) => trailer.getName()).join(", ")} (rig Flank {props.force.getRigFlankMP(uuid)})</div> : null;
    return (
        <div className='small-text'>
            <label>
                Pulled by (trailer):{" "}
                <select data-testid="rig-tractor-select" value={tractor} onChange={(e) => { setLabels(props.force.setRig(uuid, e.currentTarget.value)); props.onChange(); }}>
                    <option value="">None</option>
                    {vehicles.map((vehicle) => <option key={vehicle.getUUID()} value={vehicle.getUUID()}>{vehicle.getName()}</option>)}
                </select>
            </label>
            {labels.length > 0 ? <div className="text-danger" data-testid="rig-labels">{labels.join(" ")}</div> : null}
        </div>
    );
};

export const C3NetworkField = (props: { force: BattleMechForce; unit: BattleMech | Vehicle; edit: boolean; onChange: () => void }): React.ReactNode => {
    const [labels, setLabels] = React.useState<string[]>([]);
    if( !props.unit.getBattleValueC3Type() ) {
        return null;
    }
    const uuid = props.unit.getUUID();
    const network = props.force.c3Networks[uuid] ?? "";
    const record = props.force.c3Records.find((entry) => entry.members.some((member) => member.uuid === uuid));
    const role = record?.members.find((member) => member.uuid === uuid)?.role;
    if( !props.edit ) {
        return network ? <div className='small-text'><strong>C3 network:</strong> {network}{role && role !== "member" ? ` (${role})` : ""}</div> : null;
    }
    const apply = (result: string[]): void => { setLabels(result); props.onChange(); };
    return (
        <div className='small-text'>
            <label>
                C3 network:{" "}
                <select data-testid="c3-network-select" value={network} onChange={(e) => apply( props.force.setC3Network(uuid, e.currentTarget.value) )}>
                    <option value="">None</option>
                    {[...new Set([...C3_NETWORK_NAMES, network].filter(Boolean))].map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
            </label>
            {record ? (
                <>
                    {" "}
                    <label>
                        Type:{" "}
                        <select data-testid="c3-type-select" value={record.type} onChange={(e) => apply( props.force.setC3NetworkType(network, e.currentTarget.value as IC3Network["type"]) )}>
                            {C3_TYPE_NAMES.map(([type, name]) => <option key={type} value={type}>{name}</option>)}
                        </select>
                    </label>
                    {record.type === "master-slave" || record.type === "boosted" ? (
                        <>
                            {" "}
                            <label>
                                Role:{" "}
                                <select data-testid="c3-role-select" value={role ?? "slave"} onChange={(e) => apply( props.force.setC3Network(uuid, network, e.currentTarget.value as C3Role) )}>
                                    {C3_ROLE_NAMES.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                                </select>
                            </label>
                        </>
                    ) : null}
                </>
            ) : null}
            {labels.length > 0 ? <div className="text-danger" data-testid="c3-network-labels">{labels.join(" ")}</div> : null}
        </div>
    );
};

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
                        {this.props.showEdit ? <th className="min-width no-wrap"><span className="visually-hidden">Actions</span></th> : null}
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
                    const pilotBV = formatBattleValue((edition) => vehicle.getPilotAdjustedBattleValue(edition), "vehicle", this.props.appGlobals.currentCBTForce?.rulesEdition);
                    const baseBV = formatBattleValue((edition) => vehicle.getBattleValue(edition), "vehicle", this.props.appGlobals.currentCBTForce?.rulesEdition);
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
                                    <C3NetworkField force={force} unit={vehicle} edit={!!this.props.showEdit} onChange={this._save} />
                                    <RigField force={force} unit={vehicle} edit={!!this.props.showEdit} onChange={this._save} />
                                </td>
                                <td className="min-width no-wrap text-center">{vehicle.getTonnage()}</td>
                                <td className="min-width no-wrap text-center small-text">{vehicle.getTech().name}{vehicle.isOmni() ? " (Omni)" : ""}</td>
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
                                <MULSearchButton unitLabel="vehicles" onClick={this.props.onSearchMUL} />
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
    onSearchMUL?: ( e: React.FormEvent<HTMLButtonElement> ) => void;
    showEdit: boolean;
}

interface IVehicleGroupTableState {
    addVehicleIndex: number;
}
