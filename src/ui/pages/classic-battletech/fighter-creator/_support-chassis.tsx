import React, { type JSX } from 'react';
import { FaTrash } from "react-icons/fa";
import AerospaceFighter from '../../../../classes/aerospace-fighter';
import {
    SUPPORT_AIRCRAFT_MOTIVES, SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS, SUPPORT_VEHICLE_FIRE_CONTROL, SUPPORT_VEHICLE_TECH_RATINGS,
} from '../../../../data/support-vehicle-construction';
import { AIRCRAFT_BAY_TYPES, getVehicleBayType, getVehicleBayWeight } from '../../../../data/vehicle-transport-bays';
import InputCheckbox from "../../../components/form_elements/input_checkbox";
import InputNumeric from "../../../components/form_elements/input_numeric";
const Trash = FaTrash as any;

/**
 * The chassis of an Airship, Fixed-Wing or Satellite Support Vehicle (TM pp.116-139; TO:AUE pp.52-71): type, weight,
 * Tech Ratings, chassis modifications, engine and thrust, fuel, heat sinks, fire control, crew and bays.
 */
export default class SupportAircraftChassis extends React.Component<ISupportAircraftChassisProps, ISupportAircraftChassisState> {
    constructor(props: ISupportAircraftChassisProps) {
        super(props);
        this.state = { newBay: AIRCRAFT_BAY_TYPES[0].tag };
    }

    render = (): JSX.Element => {
        const unit = this.props.fighter;
        const update = this.props.update;
        const support = unit.getSupportVehicleSettings();
        if (!support) return <></>;
        const weightClass = unit.getSupportWeightClass();
        const installed = unit.getSupportChassisModifications();
        const offered = unit.getAvailableSupportChassisModifications();
        const engine = unit.getSupportEngine();
        const small = unit.getTonnage() < 5;
        const ratingOptions = SUPPORT_VEHICLE_TECH_RATINGS.map((rating) => <option key={rating} value={rating}>{rating.toUpperCase()}</option>);
        const thrustOptions: number[] = [];
        const step = support.motive === "airship" ? 0.25 : 1;
        for (let thrust = unit.getMinSafeThrust(); thrust <= unit.getMaxSafeThrust() + 1e-9; thrust += step) thrustOptions.push(Math.round(thrust * 100) / 100);
        const fuelKg = unit.getSupportFuelKgPerPoint();
        return (
            <>
                <label>
                    Support Vehicle Type:
                    <select value={support.motive} onChange={(e) => { const value = e.currentTarget.value; update((f) => f.setSupportMotive(value)); }}>
                        {SUPPORT_AIRCRAFT_MOTIVES.map((option) => <option key={option.tag} value={option.tag}>{option.name}</option>)}
                    </select>
                </label>
                <InputNumeric
                    label={`Weight in tons (by the kilogram under 5 tons, by the half ton from 5; at most ${unit.getMaxTonnage()})`}
                    value={unit.getTonnage()}
                    min={unit.getMinTonnage()}
                    max={unit.getMaxTonnage()}
                    step={small ? 0.001 : 0.5}
                    setValue={(tons) => update((f) => f.setTonnage(tons))}
                />
                <p>
                    <strong>Size</strong>: {weightClass ? `${weightClass.size[0].toUpperCase()}${weightClass.size.slice(1)}${weightClass.advanced ? " (TO:AUE, Advanced)" : ""}` : "out of range"}
                    {weightClass ? <> &nbsp;|&nbsp; <strong>Minimum Structural Tech Rating</strong>: {weightClass.minTechRating.toUpperCase()}</> : null}
                    {" "}&nbsp;|&nbsp; <strong>Overall Tech Rating</strong>: {unit.getSupportOverallTechRating()?.toUpperCase()}
                </p>
                <label>
                    Structural Tech Rating:
                    <select value={support.structuralTechRating} onChange={(e) => { const value = e.currentTarget.value; update((f) => f.setSupportTechRating("structural", value)); }}>{ratingOptions}</select>
                </label>
                <p className="smaller-text">Chassis modifications (TM pp.122-123; TO:AUE p.59):</p>
                {SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.filter((mod) => offered.includes(mod.tag) || (installed.includes(mod.tag) && mod.tag !== "omni")).map((mod) => (
                    <InputCheckbox
                        key={mod.tag}
                        label={`${mod.name} (x ${mod.multiplier}, Tech ${mod.minTechRating.toUpperCase()}): ${mod.description}`}
                        checked={installed.includes(mod.tag)}
                        setValue={(checked: boolean) => update((f) => f.setSupportChassisModification(mod.tag, checked))}
                    />
                ))}
                <InputCheckbox
                    label="Omni (Tech E; weapons and equipment may be pod-mounted; cost x 1.25, TM pp.122, 285)"
                    checked={unit.isOmni()}
                    setValue={(checked: boolean) => update((f) => f.setOmni(checked))}
                />
                {support.motive === "satellite" ? (
                    <InputCheckbox
                        label="Unmanned (no crew; no weapons or crew-served equipment but satellite communications, TO:AUE p.66)"
                        checked={!!support.unmanned}
                        setValue={(checked: boolean) => update((f) => f.setUnmanned(checked))}
                    />
                ) : null}
                <p><strong>Chassis Weight</strong>: {unit.getStructureWeight()} t &nbsp;|&nbsp; <strong>Structural Integrity</strong>: {unit.getStructuralIntegrity()} (no weight)</p>

                <h3>Engine and Thrust</h3>
                <label>
                    Engine Type:
                    <select value={support.engine} onChange={(e) => { const value = e.currentTarget.value; update((f) => f.setSupportEngine(value)); }}>
                        {unit.getAvailableSupportEngines().map((option) => <option key={option.tag} value={option.tag}>{option.name}</option>)}
                    </select>
                </label>
                <label>
                    Engine Tech Rating:
                    <select value={support.engineTechRating} onChange={(e) => { const value = e.currentTarget.value; update((f) => f.setSupportTechRating("engine", value)); }}>{ratingOptions}</select>
                </label>
                {support.motive !== "satellite" ? (
                    <label>
                        Safe Thrust:
                        <select value={unit.getSafeThrust()} onChange={(e) => { const value = +e.currentTarget.value; update((f) => f.setSafeThrust(value)); }}>
                            {thrustOptions.map((thrust) => <option key={thrust} value={thrust}>{thrust}</option>)}
                        </select>
                    </label>
                ) : <p className="smaller-text">A Satellite's engine only keeps station: Movement Factor 1, no thrust in play (TO:AUE p.62).</p>}
                <p>
                    <strong>Max Thrust</strong>: {unit.getMaxThrust()} &nbsp;|&nbsp; <strong>Engine Rating</strong>: {unit.getEngineRating()} &nbsp;|&nbsp;
                    <strong>Engine Weight</strong>: {unit.getEngineWeight()} t ({engine?.name})
                </p>

                <h3>Fuel</h3>
                <InputNumeric
                    label={support.motive === "satellite" ? "Station-keeping fuel (tons)" : "Fuel (tons)"}
                    value={unit.getFuelTons()}
                    min={0}
                    max={unit.getTonnage()}
                    step={small ? 0.001 : 0.5}
                    setValue={(tons) => update((f) => f.setFuelTons(tons))}
                />
                <p>
                    {support.motive === "satellite" ? <><strong>Burn Days</strong>: {unit.getSatelliteBurnDays()} (TO:AUE p.63)</>
                        : fuelKg === null ? "This engine needs no Fuel Points (TM p.129)."
                            : <><strong>Fuel Points</strong>: {unit.getFuelPoints()} ({fuelKg} kg a point, TM p.128)</>}
                </p>

                <h3>Heat Sinks, Fire Control and Crew</h3>
                <InputNumeric
                    label={`Heat Sinks (1 ton each; heavy energy weapons make ${unit.getRequiredHeatSinks()} heat, TM p.133)`}
                    value={unit.getAdditionalHeatSinks()}
                    min={0}
                    step={1}
                    setValue={(count) => update((f) => f.setAdditionalHeatSinks(count))}
                />
                <label>
                    Fire Control:
                    <select value={support.fireControl} onChange={(e) => { const value = e.currentTarget.value; update((f) => f.setSupportFireControl(value)); }}>
                        {Object.entries(SUPPORT_VEHICLE_FIRE_CONTROL).map(([tag, option]) => (
                            <option key={tag} value={tag}>{option.name} (+{option.toHit} to-hit{option.weightFactor ? `, ${option.weightFactor * 100}% of the weapons' weight` : ""})</option>
                        ))}
                    </select>
                </label>
                <InputNumeric
                    label="Extra Crew"
                    value={unit.getSupportExtraCrew()}
                    min={0}
                    step={1}
                    setValue={(crew) => update((f) => f.setSupportExtraCrew(crew))}
                />
                <p>
                    <strong>Fire Control Weight</strong>: {unit.getSupportFireControlWeight()} t &nbsp;|&nbsp; <strong>Crew</strong>: {unit.getCrew()} (TM p.131) &nbsp;|&nbsp;
                    <strong>Item Slots</strong>: <span className={unit.getUsedItemSlots() > unit.getTotalItemSlots() ? "color-red" : ""}>{unit.getUsedItemSlots()} / {unit.getTotalItemSlots()}</span>
                </p>

                <h3>Transport Bays</h3>
                {unit.getBays().length > 0 ? (
                    <table className="table" data-testid="aircraft-bays">
                        <thead><tr><th>Bay</th><th>Tons, Bays or Cubicles</th><th>Doors</th><th>Weight</th><th></th></tr></thead>
                        <tbody>
                            {unit.getBays().map((bay, index) => {
                                const type = getVehicleBayType(bay.tag);
                                const name = unit.getBayName(bay);
                                return (
                                    <tr key={`${bay.tag}-${index}`}>
                                        <td>{name}</td>
                                        <td>
                                            <InputNumeric
                                                title={`${name}: ${type?.tonsEach === null ? "tons" : "bays or cubicles"}`}
                                                value={bay.amount}
                                                min={type?.tonsEach === null ? 0.001 : 1}
                                                step={type?.tonsEach === null ? (small ? 0.001 : 0.5) : 1}
                                                setValue={(amount: number) => update((f) => f.setBay(index, amount, bay.doors))}
                                            />
                                        </td>
                                        <td>
                                            <InputNumeric
                                                title={`${name}: doors`}
                                                value={bay.doors}
                                                min={0}
                                                step={1}
                                                setValue={(doors: number) => update((f) => f.setBay(index, bay.amount, doors))}
                                            />
                                        </td>
                                        <td>{Math.round(getVehicleBayWeight(bay) * 1000) / 1000} t</td>
                                        <td><button className="btn btn-danger btn-sm" title={`Remove ${name}`} onClick={() => update((f) => f.removeBay(index))}><Trash /></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : null}
                <label>
                    Add a bay:
                    <select value={this.state.newBay} onChange={(e) => this.setState({ newBay: e.currentTarget.value })}>
                        {AIRCRAFT_BAY_TYPES.map((type) => <option key={type.tag} value={type.tag}>{type.name} ({type.tonsEach === null ? "by the ton" : `${type.tonsEach} t each`})</option>)}
                    </select>
                </label>
                <button className="btn btn-primary btn-sm" onClick={() => update((f) => f.addBay(this.state.newBay))}>Add Bay</button>
                <p className="smaller-text">1 item slot for each bay or compartment, 1 for each container, 1 for all infantry bays of a type (TM p.239, errata v8.0).</p>
            </>
        );
    }
}

interface ISupportAircraftChassisProps {
    fighter: AerospaceFighter;
    update: (change: (fighter: AerospaceFighter) => void) => void;
}

interface ISupportAircraftChassisState {
    newBay: string;
}
