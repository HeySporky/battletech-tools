import React from 'react';
import { Link } from 'react-router-dom';
import { IAppGlobals } from '../../../app-router';
import VehicleCreatorSideMenu from '../../../components/vehicle-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import InputField from "../../../components/form_elements/input_field";
import InputCheckbox from "../../../components/form_elements/input_checkbox";
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

    // Keeps tonnage within the Standard/Superheavy bounds for the selected motive type and rules level.
    clampTonnage = (vehicle: NonNullable<IAppGlobals["currentVehicle"]>, rulesLevel: number): void => {
        const { min, max } = getVehicleTonnageBounds(vehicle.getMotiveType().tag, rulesLevel);
        const tonnage = vehicle.getTonnage();
        if (tonnage < min) vehicle.setTonnage(min);
        else if (tonnage > max) vehicle.setTonnage(max);
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;

        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const { min, max } = getVehicleTonnageBounds(vehicle.getMotiveType().tag, rulesLevel);
        const tonnageOptions: number[] = [];
        for (let tons = min; tons <= max; tons += vehicle.getMotiveType().tag.startsWith("naval") ? 25 : 1) {
            tonnageOptions.push(tons);
        }

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

                                <InputCheckbox
                                    label="Has a Turret"
                                    checked={vehicle.hasTurret()}
                                    onChange={this.updateHasTurret}
                                />

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
