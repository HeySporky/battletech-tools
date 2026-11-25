import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import VehicleCreatorSideMenu from '../../../components/vehicle-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import InputField from "../../../components/form_elements/input_field";
import InputCheckbox from "../../../components/form_elements/input_checkbox";
import InputNumeric from "../../../components/form_elements/input_numeric";
import { mechEngineTypes } from '../../../../data/mech-engine-types';
import { btTechOptions } from '../../../../data/tech-options';
import { btEraOptions } from '../../../../data/era-options';
import { getRulesLevelOptions } from '../../../../data/rules-level-options';
import { vehicleMotiveTypes } from '../../../../data/vehicle-motive-types';
import { getVehicleTonnageBounds } from '../../../../data/vehicle-motive-types';
import { FaArrowCircleRight } from "react-icons/fa";
const ArrowCircleRight = FaArrowCircleRight as any;

export default class VehicleCreatorStep1 extends React.Component<IStep1Props, IStep1State> {
    constructor(props: IStep1Props) {
        super(props);
        this.state = { updated: false };
        this.props.appGlobals.makeDocumentTitle("Step 1 | Vehicle Creator");
    }

    updateName = (e: React.FormEvent<HTMLInputElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setName(e.currentTarget.value);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateModel = (e: React.FormEvent<HTMLInputElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setModel(e.currentTarget.value);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateTech = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setTech(e.currentTarget.value);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateEra = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setEra(e.currentTarget.value);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateRulesLevel = (e: React.FormEvent<HTMLSelectElement>): void => {
        const appSettings = this.props.appGlobals.appSettings;
        appSettings.mechRulesFilter = +e.currentTarget.value;
        this.props.appGlobals.saveAppSettings(appSettings);

        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            this.clampTonnage(vehicle, appSettings.mechRulesFilter);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateMotiveType = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setMotiveType(e.currentTarget.value);
            this.clampTonnage(vehicle, this.props.appGlobals.appSettings.mechRulesFilter);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateTonnage = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setTonnage(+e.currentTarget.value);
            this.clampTonnage(vehicle, this.props.appGlobals.appSettings.mechRulesFilter);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateHasTurret = (e: React.FormEvent<HTMLInputElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setHasTurret(e.currentTarget.checked);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateEngineType = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setEngineType(e.currentTarget.value);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateCruiseMP = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setCruiseMP(+e.currentTarget.value);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateDualTurret = (e: React.FormEvent<HTMLInputElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setDualTurret(e.currentTarget.checked);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateJumpMP = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setJumpMP(+e.currentTarget.value);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateTroopSpace = (tons: number): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setTroopSpace(tons);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateHeatSinks = (count: number): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setAdditionalHeatSinks(count);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    // Keeps tonnage within the Standard/Superheavy bounds for the selected motive type and rules level,
    // and Cruise MP within what an engine can deliver at that tonnage.
    clampTonnage = (vehicle: NonNullable<IAppGlobals["currentVehicle"]>, rulesLevel: number): void => {
        const { min, max } = getVehicleTonnageBounds(vehicle.getMotiveType().tag, rulesLevel);
        const tonnage = vehicle.getTonnage();
        if (tonnage < min) vehicle.setTonnage(min);
        else if (tonnage > max) vehicle.setTonnage(max);
        const maxCruise = vehicle.getMaxCruiseMP(rulesLevel);
        if (vehicle.getCruiseMP() > maxCruise) vehicle.setCruiseMP(maxCruise);
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;

        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const { min, max } = getVehicleTonnageBounds(vehicle.getMotiveType().tag, rulesLevel);
        const tonnageOptions: number[] = [];
        for (let tons = min; tons <= max; tons++) {
            tonnageOptions.push(tons);
        }
        const cruiseOptions: number[] = [];
        for (let mp = 0; mp <= Math.max(vehicle.getMaxCruiseMP(rulesLevel), vehicle.getCruiseMP()); mp++) {
            cruiseOptions.push(mp);
        }
        const motive = vehicle.getMotiveType();
        // The chin turret is Advanced (3079 prototype, 3080 production; as implemented by MegaMek).
        const turretAllowed = motive.turret !== "chin" || rulesLevel >= 3 || vehicle.hasTurret();

        return (
            <>
                <UIPage current="classic-battletech-vehicle-creator" appGlobals={this.props.appGlobals}>
                    <div className="row">
                        <div className="d-none d-md-block col-md-3 col-lg-2">
                            <VehicleCreatorSideMenu appGlobals={this.props.appGlobals} current="step1" />
                        </div>
                        <div className="col-md-9 col-lg-10">
                            <TextSection label="Step 1: Design the Chassis">
                                <InputField
                                    label="Vehicle Model # (e.g. SRT-1, Vedette)"
                                    value={vehicle.getModel()}
                                    onChange={this.updateModel}
                                />

                                <InputField
                                    label="Vehicle Model Name"
                                    value={vehicle.getName()}
                                    onChange={this.updateName}
                                />

                                <label>
                                    Technology Base:
                                    <select value={vehicle.getTech().tag} onChange={this.updateTech}>
                                        {btTechOptions.map((option) => (
                                            <option key={option.tag} value={option.tag}>{option.name}</option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Rules Level:
                                    <select value={rulesLevel} onChange={this.updateRulesLevel}>
                                        {getRulesLevelOptions().map((option) => (
                                            <option key={option.id} value={option.id}>{option.name}</option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Motive Type:
                                    <select value={vehicle.getMotiveType().tag} onChange={this.updateMotiveType}>
                                        {vehicleMotiveTypes.map((option) => (
                                            <option key={option.tag} value={option.tag}>{option.name}</option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Tonnage:
                                    <select value={vehicle.getTonnage()} onChange={this.updateTonnage}>
                                        {tonnageOptions.map((tons) => (
                                            <option key={tons} value={tons}>{tons}</option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Vehicle Era:
                                    <select value={vehicle.getEra().tag} onChange={this.updateEra}>
                                        {btEraOptions.map((option) => (
                                            <option key={option.tag} value={option.tag}>{option.name}</option>
                                        ))}
                                    </select>
                                </label>

                                {turretAllowed ? (
                                    <InputCheckbox
                                        label={motive.turret === "chin" ? "Has a Chin Turret (Advanced)" : "Has a Turret"}
                                        checked={vehicle.hasTurret()}
                                        onChange={this.updateHasTurret}
                                    />
                                ) : (
                                    <p className="smaller-text">VTOLs can only mount a chin turret, which needs the Advanced rules level.</p>
                                )}
                                {vehicle.hasTurret() && vehicle.canHaveDualTurret() ? (
                                    <InputCheckbox
                                        label="Dual Turrets (front and rear)"
                                        checked={vehicle.hasDualTurret()}
                                        onChange={this.updateDualTurret}
                                    />
                                ) : null}

                                {vehicle.getRequiredRulesLevel() > rulesLevel ? (
                                    <p className="color-red smaller-text">
                                        This design needs the {getRulesLevelOptions().find((option) => option.id === vehicle.getRequiredRulesLevel())?.name} rules
                                        level{vehicle.isSuperheavy() ? " (Superheavy vehicle)" : ""}{vehicle.hasChinTurret() ? " (chin turret)" : ""}{vehicle.getJumpMP() > 0 ? " (jump jets)" : ""} and
                                        is not legal at the selected level. Printing will ask for confirmation.
                                    </p>
                                ) : null}

                                <h3>Movement and Engine</h3>
                                <label>
                                    Engine Type:
                                    <select value={vehicle.getEngineType().tag} onChange={this.updateEngineType}>
                                        {mechEngineTypes.map((option) => (
                                            <option key={option.tag} value={option.tag}>{option.name}</option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Cruise MP:
                                    <select value={vehicle.getCruiseMP()} onChange={this.updateCruiseMP}>
                                        {cruiseOptions.map((mp) => (
                                            <option key={mp} value={mp}>{mp} (Flank {Math.ceil(mp * 1.5)})</option>
                                        ))}
                                    </select>
                                </label>

                                {motive.allowsJumpJets && (rulesLevel >= 3 || vehicle.getJumpMP() > 0) ? (
                                    <label>
                                        Jump MP (vehicular jump jets, Advanced):
                                        <select value={vehicle.getJumpMP()} onChange={this.updateJumpMP}>
                                            {Array.from({ length: vehicle.getCruiseMP() + 1 }, (_, mp) => (
                                                <option key={mp} value={mp}>{mp}</option>
                                            ))}
                                        </select>
                                    </label>
                                ) : null}

                                <p>
                                    <strong>Engine Rating</strong>: {vehicle.getEngineRating()} ({vehicle.getTonnage()} t x {vehicle.getCruiseMP()} MP
                                    - suspension factor {vehicle.getSuspensionFactor()}) &nbsp;|&nbsp;
                                    <strong>Engine Weight</strong>: {vehicle.getEngineWeight()} t &nbsp;|&nbsp;
                                    <strong>Control Systems</strong>: {vehicle.getControlSystemsWeight()} t
                                    {motive.liftEquipment ? <> &nbsp;|&nbsp; <strong>{motive.liftEquipment}</strong>: {vehicle.getLiftEquipmentWeight()} t</> : null}
                                </p>

                                <p>
                                    <strong>Heat Sinks</strong>: {vehicle.getRequiredHeatSinks()} required for energy weapons and equipment,
                                    {" "}{vehicle.getFreeHeatSinks()} free from the engine, {vehicle.getWeightedHeatSinks()} t
                                    {vehicle.getPowerAmplifierWeight() > 0 ? <> &nbsp;|&nbsp; <strong>Power Amplifiers</strong>: {vehicle.getPowerAmplifierWeight()} t</> : null}
                                    {" "}&nbsp;|&nbsp; <strong>Crew</strong>: {vehicle.getCrew()}
                                    {" "}&nbsp;|&nbsp; <strong>Item Slots</strong>: <span className={vehicle.getUsedItemSlots() > vehicle.getTotalItemSlots() ? "color-red" : ""}>{vehicle.getUsedItemSlots()} / {vehicle.getTotalItemSlots()}</span>
                                </p>

                                <label>
                                    Troop Space (tons of infantry compartment):
                                    <InputNumeric
                                        value={vehicle.getTroopSpace()}
                                        min={0}
                                        step={0.5}
                                        setValue={this.updateTroopSpace}
                                    />
                                </label>

                                <label>
                                    Extra Heat Sinks:
                                    <InputNumeric
                                        value={vehicle.getAdditionalHeatSinks()}
                                        min={0}
                                        step={1}
                                        setValue={this.updateHeatSinks}
                                    />
                                </label>

                                <p>
                                    <strong>Current Tonnage</strong>: {vehicle.getCurrentTonnage()} &nbsp;|&nbsp;
                                    <strong>Remaining Tonnage</strong>: <span className={vehicle.getRemainingTonnage() < 0 ? "color-red" : ""}>{vehicle.getRemainingTonnage()}</span>
                                </p>

                                <div className="clear-both overflow-hidden">
                                    <hr />
                                    <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/armor`} className="btn btn-primary pull-right btn-sm">Next: Armor <ArrowCircleRight /></Link>
                                </div>
                            </TextSection>
                        </div>
                    </div>
                </UIPage>
            </>
        );
    }
}

interface IStep1Props {
    appGlobals: IAppGlobals;
}

interface IStep1State {
    updated: boolean;
}
