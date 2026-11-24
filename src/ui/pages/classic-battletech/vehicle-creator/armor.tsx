import React, { type JSX } from 'react';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import { Link } from 'react-router';
import { IVehicleArmorAllocation, VehicleLocation } from '../../../../data/data-interfaces';
import { IAppGlobals } from '../../../app-router';
import InputNumeric from '../../../components/form_elements/input_numeric';
import { VehicleCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
import { supportVehicleArmor } from '../../../../data/support-vehicle-armor';
import { SUPPORT_VEHICLE_TECH_RATINGS } from '../../../../data/support-vehicle-construction';
import { unitRulesLevel } from '../../../components/game-settings-block';
import ComponentTechBaseChoice from '../../../components/component-tech-base-choice';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

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

    updateBAR = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setBAR(+e.currentTarget.value);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateArmorTechRating = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setSupportVehicleTechRating("armor", e.currentTarget.value);
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

    updatePatchworkType = (location: VehicleLocation, armorTag: string): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setPatchworkArmorType(location, armorTag);
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

    updateTotalArmorPoints = (points: number): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setArmorPoints(points);
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
        const locations = vehicle.getLocations();
        const support = vehicle.getSupportVehicleSettings();
        const rulesLevel = unitRulesLevel(this.props.appGlobals.currentVehicle, this.props.appGlobals.appSettings);
        const patchwork = vehicle.isPatchworkArmor();

        return (
            <UIPage current="classic-battletech-vehicle-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <VehicleCreatorSideMenu appGlobals={this.props.appGlobals} current="armor" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Step 2: Allocate Armor">
                            {support ? (
                                <>
                                    <label>
                                        Barrier Armor Rating (BAR):
                                        <select value={support.bar} onChange={this.updateBAR}>
                                            {supportVehicleArmor.map((option) => {
                                                const kg = option.kgPerPoint[support.armorTechRating];
                                                const armored = option.armoredChassisRatings.includes(support.armorTechRating);
                                                return (
                                                    <option key={option.bar} value={option.bar}>
                                                        BAR {option.bar} ({kg ? `${kg} kg a point${armored ? ", needs the Armored chassis" : ""}` : "not made at this Tech Rating"})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </label>
                                    <label>
                                        Armor Tech Rating:
                                        <select value={support.armorTechRating} onChange={this.updateArmorTechRating}>
                                            {SUPPORT_VEHICLE_TECH_RATINGS.map((rating) => (
                                                <option key={rating} value={rating}>{rating.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <p className="smaller-text">
                                        Damage greater than the BAR in a single hit can cause a critical hit even when armor remains (TW p.206).
                                        Support Vehicle armor is bought by the point and its weight rounded up: to the kilogram under 5 tons, to the half ton from 5 tons (TM p.134).
                                    </p>
                                </>
                            ) : (
                                <label>
                                    Armor Type:
                                    <select value={vehicle.getArmorType().tag} onChange={this.updateArmorType}>
                                        {vehicle.getAvailableArmorTypes(unitRulesLevel(this.props.appGlobals.currentVehicle, this.props.appGlobals.appSettings))
                                            .filter((option) => isOptionShown(option, option.tag === vehicle.getArmorType().tag))
                                            .map((option) => (
                                                <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
                                            ))}
                                    </select>
                                </label>
                            )}
                            <ComponentTechBaseChoice
                                label="Armor Version"
                                choices={vehicle.getComponentTechBases("armor")}
                                value={vehicle.getArmorTechBase()}
                                clanDesign={vehicle.getTech().tag === "clan"}
                                onChange={(techBase) => { vehicle.setArmorTechBase(techBase); this.props.appGlobals.saveCurrentVehicle(vehicle); }}
                            />

                            <p>
                                <strong>Max Armor</strong>: {vehicle.getMaxArmorPoints()} points{patchwork ? null : ` (${vehicle.getMaxArmorTonnage()} tons)`} &nbsp;|&nbsp;
                                <strong>Remaining Tonnage</strong>: {vehicle.getRemainingTonnage()}
                                {vehicle.getArmorItemSlots() > 0 ? <> &nbsp;|&nbsp; <strong>Armor Item Slots</strong>: {vehicle.getArmorItemSlots()}</> : null}
                            </p>

                            {patchwork ? (
                                <p data-testid="patchwork-armor-note">
                                    <strong>Armor Weight</strong>: {vehicle.getArmorWeight()} tons.{" "}
                                    <span className="smaller-text">
                                        Patchwork Armor (Advanced, TO:AUE p. 189): each location takes its own armor type, weighed by the
                                        point and rounded up to the half ton per location, and that type's item slots.
                                    </span>
                                </p>
                            ) : vehicle.usesFractionalAccounting() ? (
                                <label data-testid="fractional-armor-points">
                                    Armor Points (Fractional Accounting, TO:AUE p.188):
                                    <div className="inline-block">
                                        <input
                                            type="number"
                                            min={0}
                                            max={vehicle.getMaxAffordableArmorPoints()}
                                            value={vehicle.getArmorPoints()}
                                            onChange={(e) => this.updateTotalArmorPoints(+e.currentTarget.value)}
                                        />
                                        &nbsp;{vehicle.getArmorWeight()} tons at {vehicle.getFractionalArmorTonsPerPoint().toFixed(4)} tons per point
                                    </div>
                                </label>
                            ) : (
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
                            )}

                            <button className="btn btn-primary btn-sm" onClick={this.allocateMax}>Max Armor</button>
                            &nbsp;
                            <button className="btn btn-secondary btn-sm" onClick={this.allocateClear}>Clear Armor</button>

                            {vehicle.getMotiveType().hasRotor ? (
                                <p className="smaller-text">A VTOL rotor holds at most 2 armor points.</p>
                            ) : null}

                            <table className="table">
                                <thead>
                                    <tr><th>Location</th>{patchwork ? <th>Armor Type</th> : null}<th>Structure</th><th>Armor</th><th>Max</th>{patchwork ? <th>Weight</th> : null}</tr>
                                </thead>
                                <tbody>
                                    {locations.map((loc) => (
                                        <tr key={loc.tag}>
                                            <td>{loc.name}</td>
                                            {patchwork ? (
                                                <td data-testid={`patchwork-armor-${loc.tag}`}>
                                                    <select aria-label={`${loc.name} Armor Type`} value={vehicle.getPatchworkArmorType(loc.tag).tag} onChange={(e) => this.updatePatchworkType(loc.tag, e.currentTarget.value)}>
                                                        {vehicle.getAvailablePatchworkArmorTypes(rulesLevel)
                                                            .filter((option) => isOptionShown(option, option.tag === vehicle.getPatchworkArmorType(loc.tag).tag))
                                                            .map((option) => (
                                                                <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
                                                            ))}
                                                    </select>
                                                </td>
                                            ) : null}
                                            <td>{vehicle.getStructureAllocation()[loc.tag] ?? 0}</td>
                                            <td>
                                                <InputNumeric
                                                    value={armor[loc.tag] ?? 0}
                                                    min={0}
                                                    max={maxArmor[loc.tag] ?? 0}
                                                    ariaLabel={`${loc.name} armor points`}
                                                    setValue={(newValue) => this.updateArmorPoints(loc.tag, newValue)}
                                                />
                                            </td>
                                            <td>{maxArmor[loc.tag] ?? 0}</td>
                                            {patchwork ? (
                                                <td>
                                                    {vehicle.getPatchworkLocationWeight(loc.tag)} t
                                                    {vehicle.getPatchworkLocationSlots(loc.tag) > 0 ? `, ${vehicle.getPatchworkLocationSlots(loc.tag)} slot${vehicle.getPatchworkLocationSlots(loc.tag) === 1 ? "" : "s"}` : ""}
                                                </td>
                                            ) : null}
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
