import React from 'react';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { IVehicleArmorAllocation } from '../../../../data/data-interfaces';
import { IAppGlobals } from '../../../app-router';
import InputNumeric from '../../../components/form_elements/input_numeric';
import VehicleCreatorSideMenu from '../../../components/vehicle-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

const ARMOR_LOCATIONS: { tag: keyof IVehicleArmorAllocation; name: string }[] = [
    { tag: "front", name: "Front" },
    { tag: "left", name: "Left" },
    { tag: "right", name: "Right" },
    { tag: "rear", name: "Rear" },
    { tag: "turret", name: "Turret" },
];

export default class VehicleCreatorArmor extends React.Component<IArmorProps, IArmorState> {
    constructor(props: IArmorProps) {
        super(props);
        this.state = { updated: false };
        this.props.appGlobals.makeDocumentTitle("Step 2 | Vehicle Creator");
    }

    updateArmorType = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setArmorType(e.currentTarget.value);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateArmorPoints = (location: keyof IVehicleArmorAllocation, points: number): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setArmorAllocation(location, points);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    allocateMax = (): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.allocateMaxArmor();
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    allocateClear = (): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.allocateArmorClear();
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateArmorTonnage = (tons: number): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setArmorTonnage(tons);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    stepArmorTonnage = (delta: number): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            this.updateArmorTonnage(vehicle.getArmorWeight() + delta);
        }
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;

        const armor = vehicle.getArmorAllocation();
        const maxArmor = vehicle.getMaxArmorAllocation();
        const locations = vehicle.hasTurret() ? ARMOR_LOCATIONS : ARMOR_LOCATIONS.filter((loc) => loc.tag !== "turret");

        return (
            <UIPage current="classic-battletech-vehicle-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <VehicleCreatorSideMenu appGlobals={this.props.appGlobals} current="armor" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Step 2: Allocate Armor">
                            <label>
                                Armor Type:
                                <select value={vehicle.getArmorType().tag} onChange={this.updateArmorType}>
                                    {vehicle.getAvailableArmorTypes().map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>

                            <p>
                                <strong>Max Armor</strong>: {vehicle.getMaxArmorPoints()} points ({vehicle.getMaxArmorTonnage()} tons) &nbsp;|&nbsp;
                                <strong>Remaining Tonnage</strong>: {vehicle.getRemainingTonnage()}
                            </p>

                            <label>
                                Armor Tonnage:
                                <div className="inline-block">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => this.stepArmorTonnage(-0.5)}>-</button>
                                    <InputNumeric
                                        value={vehicle.getArmorWeight()}
                                        min={0}
                                        max={vehicle.getMaxArmorTonnage()}
                                        step={0.5}
                                        setValue={this.updateArmorTonnage}
                                    />
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => this.stepArmorTonnage(0.5)}>+</button>
                                </div>
                            </label>

                            <button className="btn btn-primary btn-sm" onClick={this.allocateMax}>Max Armor</button>
                            &nbsp;
                            <button className="btn btn-secondary btn-sm" onClick={this.allocateClear}>Clear Armor</button>

                            <table className="table">
                                <thead>
                                    <tr><th>Location</th><th>Structure</th><th>Armor</th><th>Max</th></tr>
                                </thead>
                                <tbody>
                                    {locations.map((loc) => (
                                        <tr key={loc.tag}>
                                            <td>{loc.name}</td>
                                            <td>{vehicle.getStructureAllocation()[loc.tag]}</td>
                                            <td>
                                                <InputNumeric
                                                    value={armor[loc.tag]}
                                                    min={0}
                                                    max={maxArmor[loc.tag]}
                                                    setValue={(newValue) => this.updateArmorPoints(loc.tag, newValue)}
                                                />
                                            </td>
                                            <td>{maxArmor[loc.tag]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/equipment-selection`} className="btn btn-primary pull-right btn-sm">Next: Equipment Selection <ArrowCircleRight /></Link>
                                <div className="inline-block text-left">
                                    <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/step1`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                                </div>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IArmorProps {
    appGlobals: IAppGlobals;
}

interface IArmorState {
    updated: boolean;
}
