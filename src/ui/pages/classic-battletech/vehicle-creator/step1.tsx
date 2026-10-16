import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Vehicle, { IFrankenVehicle } from '../../../../classes/vehicle';
import VehicleCreatorSideMenu from '../../../components/vehicle-creator-side-menu';
import VehicleBays from './_vehicle-bays';
import RulesEditionSelect from '../../../components/rules-edition-select';
import RulesLevelSelect from '../../../components/rules-level-select';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import InputField from "../../../components/form_elements/input_field";
import InputCheckbox from "../../../components/form_elements/input_checkbox";
import InputNumeric from "../../../components/form_elements/input_numeric";
import { btTechOptions } from '../../../../data/tech-options';
import { getRulesLevelOptions } from '../../../../data/rules-level-options';
import { vehicleMotiveTypes } from '../../../../data/vehicle-motive-types';
import { getVehicleTonnageBounds } from '../../../../data/vehicle-motive-types';
import { SRCS_RULES_LEVEL } from '../../../../data/robotic-control-systems';
import { FaArrowCircleRight } from "react-icons/fa";
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
import { SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS, SUPPORT_VEHICLE_FIRE_CONTROL, SUPPORT_VEHICLE_TECH_RATINGS } from '../../../../data/support-vehicle-construction';
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

    toggleFractionalAccounting = (): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setWeightAccounting(
                vehicle.usesFractionalAccounting() ? "standard" : "fractional",
                this.props.appGlobals.appSettings.mechRulesFilter,
            );
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

    updateRulesLevel = (level: number): void => {
        const appSettings = this.props.appGlobals.appSettings;
        appSettings.mechRulesFilter = level;
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

    updateOmni = (e: React.FormEvent<HTMLInputElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setOmni(e.currentTarget.checked);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateFrankenVehicle = (e: React.FormEvent<HTMLInputElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setFrankenVehicle(e.currentTarget.checked, this.props.appGlobals.appSettings.mechRulesFilter);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateFrankenVehicleTurret = (turret: Partial<IFrankenVehicle>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setFrankenVehicleTurret(turret);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateSponsonTurrets = (e: React.FormEvent<HTMLInputElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setSponsonTurrets(e.currentTarget.checked);
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

    updateRoboticControl = (e: React.FormEvent<HTMLSelectElement>): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setRoboticControl(e.currentTarget.value);
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

    // Support Vehicle settings (TM pp.116-139). Each handler changes the vehicle, then saves it.
    private changeVehicle = (change: (vehicle: NonNullable<IAppGlobals["currentVehicle"]>) => void): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            change(vehicle);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    updateUnitType = (e: React.FormEvent<HTMLSelectElement>): void => {
        const support = e.currentTarget.value === "support";
        this.changeVehicle((vehicle) => {
            vehicle.setSupportVehicle(support);
            this.clampTonnage(vehicle, this.props.appGlobals.appSettings.mechRulesFilter);
        });
    }

    updateSupportTonnage = (tons: number): void => {
        this.changeVehicle((vehicle) => {
            vehicle.setTonnage(tons);
            this.clampTonnage(vehicle, this.props.appGlobals.appSettings.mechRulesFilter);
        });
    }

    updateStructuralTechRating = (e: React.FormEvent<HTMLSelectElement>): void => {
        const rating = e.currentTarget.value;
        this.changeVehicle((vehicle) => vehicle.setSupportVehicleTechRating("structural", rating));
    }

    updateEngineTechRating = (e: React.FormEvent<HTMLSelectElement>): void => {
        const rating = e.currentTarget.value;
        this.changeVehicle((vehicle) => vehicle.setSupportVehicleTechRating("engine", rating));
    }

    updateSupportEngine = (e: React.FormEvent<HTMLSelectElement>): void => {
        const tag = e.currentTarget.value;
        this.changeVehicle((vehicle) => vehicle.setSupportVehicleEngine(tag));
    }

    updateChassisModification = (tag: string, installed: boolean): void => {
        this.changeVehicle((vehicle) => vehicle.setSupportVehicleChassisModification(tag, installed));
    }

    updateAlternativeFuel = (alternativeFuel: boolean): void => {
        this.changeVehicle((vehicle) => vehicle.setSupportVehicleAlternativeFuel(alternativeFuel));
    }

    updateFuel = (tons: number): void => {
        this.changeVehicle((vehicle) => vehicle.setSupportVehicleFuel(tons));
    }

    updateFireControl = (e: React.FormEvent<HTMLSelectElement>): void => {
        const fireControl = e.currentTarget.value;
        this.changeVehicle((vehicle) => vehicle.setSupportVehicleFireControl(fireControl));
    }

    updateExtraCrew = (crew: number): void => {
        this.changeVehicle((vehicle) => vehicle.setSupportVehicleExtraCrew(crew));
    }

    updateTurretCount = (count: number): void => {
        this.changeVehicle((vehicle) => vehicle.setTurretCount(count));
    }

    // Keeps tonnage within the Standard/Superheavy bounds for the selected motive type and rules level,
    // and Cruise MP within what an engine can deliver at that tonnage. A Support Vehicle keeps its own bounds.
    clampTonnage = (vehicle: NonNullable<IAppGlobals["currentVehicle"]>, rulesLevel: number): void => {
        if (!vehicle.isSupportVehicle()) {
            const { min, max } = getVehicleTonnageBounds(vehicle.getMotiveType().tag, rulesLevel);
            const tonnage = vehicle.getTonnage();
            if (tonnage < min) vehicle.setTonnage(min);
            else if (tonnage > max) vehicle.setTonnage(max);
        }
        const maxCruise = vehicle.getMaxCruiseMP(rulesLevel);
        if (vehicle.getCruiseMP() > maxCruise) vehicle.setCruiseMP(maxCruise);
    }

    // Chassis, engine, fuel, fire control and crew of a Support Vehicle, and what makes the design illegal.
    renderSupportVehicle = (vehicle: NonNullable<IAppGlobals["currentVehicle"]>, cruiseOptions: number[]): JSX.Element => {
        const support = vehicle.getSupportVehicleSettings();
        const weightClass = vehicle.getSupportVehicleWeightClass();
        const engine = vehicle.getSupportVehicleEngine();
        if (!support) return <></>;
        const installed = vehicle.getSupportVehicleChassisModifications();
        const offered = vehicle.getAvailableSupportVehicleChassisModifications();
        const range = vehicle.getSupportVehicleRangeKm();
        const issues = vehicle.getSupportVehicleIssues();
        const ratingOptions = SUPPORT_VEHICLE_TECH_RATINGS.map((rating) => (
            <option key={rating} value={rating}>{rating.toUpperCase()}</option>
        ));
        return (
            <>
                <h3>Support Vehicle Chassis</h3>
                <p>
                    <strong>Size</strong>: {weightClass ? `${weightClass.size[0].toUpperCase()}${weightClass.size.slice(1)}` : "too heavy"}
                    {weightClass ? <> &nbsp;|&nbsp; <strong>Minimum Structural Tech Rating</strong>: {weightClass.minTechRating.toUpperCase()}</> : null}
                    {" "}&nbsp;|&nbsp; <strong>Overall Tech Rating</strong>: {vehicle.getSupportVehicleOverallTechRating()?.toUpperCase()}
                </p>
                <label>
                    Structural Tech Rating:
                    <select value={support.structuralTechRating} onChange={this.updateStructuralTechRating}>{ratingOptions}</select>
                </label>
                <p className="smaller-text">Chassis modifications (TM pp.122-123):</p>
                {SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.filter((mod) => offered.includes(mod.tag) || installed.includes(mod.tag)).map((mod) => {
                    const implied = !offered.includes(mod.tag);
                    return (
                        <InputCheckbox
                            key={mod.tag}
                            label={`${mod.name} (x ${mod.multiplier}, Tech ${mod.minTechRating.toUpperCase()}${implied ? ", from the motive type or OmniVehicle" : ""}): ${mod.description}`}
                            checked={installed.includes(mod.tag)}
                            readOnly={implied}
                            setValue={(checked: boolean) => this.updateChassisModification(mod.tag, checked)}
                        />
                    );
                })}
                <p><strong>Chassis Weight</strong>: {vehicle.getStructureWeight()} t</p>

                <h3>Movement and Engine</h3>
                <label>
                    Engine Type:
                    <select value={support.engine} onChange={this.updateSupportEngine}>
                        {vehicle.getAvailableSupportVehicleEngines().map((option) => (
                            <option key={option.tag} value={option.tag}>{option.name}</option>
                        ))}
                    </select>
                </label>
                {support.engine !== "none" ? (
                    <>
                        <label>
                            Engine Tech Rating:
                            <select value={support.engineTechRating} onChange={this.updateEngineTechRating}>{ratingOptions}</select>
                        </label>
                        <label>
                            Cruise MP:
                            <select value={vehicle.getBaseCruiseMP()} onChange={this.updateCruiseMP}>
                                {cruiseOptions.map((mp) => (
                                    <option key={mp} value={mp}>{mp} (Flank {Math.ceil(mp * 1.5)})</option>
                                ))}
                            </select>
                        </label>
                    </>
                ) : null}
                {installed.includes("hydrofoil") ? <p className="smaller-text">Hydrofoil: Cruising MP x 1.25 = {vehicle.getCruiseMP()} (TM p.123).</p> : null}
                <p>
                    <strong>Engine Rating</strong>: {vehicle.getEngineRating()} (Cruising MP x weight, at most 500) &nbsp;|&nbsp;
                    <strong>Engine Weight</strong>: {vehicle.getEngineWeight()} t
                </p>
                {engine && engine.fuelPercentPer100Km !== null ? (
                    <>
                        {engine.tag === "ice" ? (
                            <InputCheckbox
                                label="Runs on alcohol or natural gas (1.25 percent of the engine a 100 km)"
                                checked={!!support.alternativeFuel}
                                setValue={this.updateAlternativeFuel}
                            />
                        ) : null}
                        <label>
                            Fuel (tons):
                            <InputNumeric
                                value={support.fuelTons}
                                min={0}
                                step={vehicle.getTonnage() < 5 ? 0.001 : 0.5}
                                setValue={this.updateFuel}
                            />
                        </label>
                        <p><strong>Range</strong>: {range ?? 0} km (TM p.128)</p>
                    </>
                ) : null}

                <h3>Fire Control and Crew</h3>
                <label>
                    Fire Control:
                    <select value={support.fireControl} onChange={this.updateFireControl}>
                        {Object.entries(SUPPORT_VEHICLE_FIRE_CONTROL).map(([tag, option]) => (
                            <option key={tag} value={tag}>{option.name} (+{option.toHit} to-hit{option.weightFactor ? `, ${option.weightFactor * 100}% of the weapons' weight` : ""})</option>
                        ))}
                    </select>
                </label>
                <p>
                    <strong>Fire Control Weight</strong>: {vehicle.getSupportVehicleFireControlWeight()} t &nbsp;|&nbsp;
                    <strong>Minimum Crew</strong>: {vehicle.getSupportVehicleMinimumCrew()} (TM p.131)
                </p>
                <label>
                    Extra Crew:
                    <InputNumeric
                        value={vehicle.getSupportVehicleExtraCrew()}
                        min={0}
                        step={1}
                        setValue={this.updateExtraCrew}
                    />
                </label>
                {vehicle.getTonnage() < 5 ? (
                    <p className="smaller-text">A Small Support Vehicle needs a seat (Seating equipment) for each crewman and passenger (TM p.132).</p>
                ) : null}
                {issues.length > 0 ? (
                    <ul className="color-red smaller-text">
                        {issues.map((issue) => <li key={issue}>{issue}</li>)}
                    </ul>
                ) : null}
            </>
        );
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
        const support = vehicle.getSupportVehicleSettings();
        const cruiseOptions: number[] = [];
        // A Support Vehicle chooses the Cruising MP its engine is built for (a hydrofoil gets x 1.25 on top).
        const currentCruise = support ? vehicle.getBaseCruiseMP() : vehicle.getCruiseMP();
        for (let mp = 0; mp <= Math.max(vehicle.getMaxCruiseMP(rulesLevel), currentCruise); mp++) {
            cruiseOptions.push(mp);
        }
        const motive = vehicle.getMotiveType();
        // The chin turret is Advanced (3079 prototype, 3080 production; as implemented by MegaMek).
        const turretAllowed = support ? vehicle.canHaveTurret() || vehicle.hasTurret() : motive.turret !== "chin" || rulesLevel >= 3 || vehicle.hasTurret();

        return (
            <>
                <UIPage current="classic-battletech-vehicle-creator" appGlobals={this.props.appGlobals}>
                    <div className="row">
                        <div className="d-none d-md-block col-md-3 col-lg-2">
                            <VehicleCreatorSideMenu appGlobals={this.props.appGlobals} current="step1" />
                        </div>
                        <div className="col-md-9 col-lg-10">
                            <TextSection label="Step 1: Design the Chassis">
                                {/* The rules edition comes first: it decides what every field below offers. */}
                                <RulesEditionSelect unitType="vehicle" value={vehicle.getRulesEdition()} onChange={(tag) => { vehicle.setRulesEdition(tag); this.props.appGlobals.saveCurrentVehicle(vehicle); }} />
                                <RulesLevelSelect editionTag={vehicle.getRulesEdition()} value={rulesLevel} onChange={this.updateRulesLevel} />
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
                                    Unit Type:
                                    <select value={support ? "support" : "combat"} onChange={this.updateUnitType}>
                                        <option value="combat">Combat Vehicle</option>
                                        <option value="support">Support Vehicle (TM pp.116-139)</option>
                                    </select>
                                </label>

                                <label>
                                    Technology Base:
                                    <select value={vehicle.getTech().tag} onChange={this.updateTech}>
                                        {btTechOptions.map((option) => (
                                            <option key={option.tag} value={option.tag}>{option.name}</option>
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

                                {support ? (
                                    <label>
                                        Weight in tons (by the kilogram under 5 tons, by the half ton from 5; at most {vehicle.getSupportVehicleMaxTonnage()}):
                                        <InputNumeric
                                            value={vehicle.getTonnage()}
                                            min={0.1}
                                            max={vehicle.getSupportVehicleMaxTonnage()}
                                            step={vehicle.getTonnage() < 5 ? 0.001 : 0.5}
                                            setValue={this.updateSupportTonnage}
                                        />
                                    </label>
                                ) : (
                                    <label>
                                        Tonnage:
                                        <select value={vehicle.getTonnage()} onChange={this.updateTonnage}>
                                            {tonnageOptions.map((tons) => (
                                                <option key={tons} value={tons}>{tons}</option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                <label>
                                    Vehicle Era:
                                    <select value={vehicle.getEra().tag} onChange={this.updateEra}>
                                        {vehicle.getAvailableEras().map((option) => (
                                            <option key={option.tag} value={option.tag}>{option.name}</option>
                                        ))}
                                    </select>
                                </label>
                                {vehicle.getEra().description ? (
                                    <p className="smaller-text">{vehicle.getEra().description}</p>
                                ) : null}

                                <InputCheckbox
                                    label="OmniVehicle (one base chassis; weapons and equipment may be pod-mounted; cost x 1.25, TM pp. 97, 285)"
                                    checked={vehicle.isOmni()}
                                    onChange={this.updateOmni}
                                />
                                {vehicle.isLargeNavalVessel() ? (
                                    <InputNumeric
                                        label={`Turrets (Template ${vehicle.getLargeVesselTemplate()?.template}: up to ${vehicle.getMaxTurrets()}, one per hex of length; TO:AUE p.60)`}
                                        value={vehicle.getTurretCount()}
                                        min={0}
                                        max={vehicle.getMaxTurrets()}
                                        step={1}
                                        setValue={this.updateTurretCount}
                                    />
                                ) : turretAllowed ? (
                                    <InputCheckbox
                                        label={motive.turret === "chin" ? "Has a Chin Turret (Advanced)" : "Has a Turret"}
                                        checked={vehicle.hasTurret()}
                                        onChange={this.updateHasTurret}
                                    />
                                ) : support ? (
                                    <p className="smaller-text">VTOL, Convertible and Large Rail Support Vehicles may not mount a turret (TM pp.123-124; TO:AUE p.71).</p>
                                ) : (
                                    <p className="smaller-text">VTOLs can only mount a chin turret, which needs the Advanced rules level.</p>
                                )}
                                {vehicle.hasTurret() && vehicle.canHaveDualTurret() ? (
                                    <InputCheckbox
                                        label="Dual Turrets (front and rear; Advanced)"
                                        checked={vehicle.hasDualTurret()}
                                        onChange={this.updateDualTurret}
                                    />
                                ) : null}
                                {vehicle.canHaveSponsonTurrets() || vehicle.hasSponsonTurrets() ? (
                                    <InputCheckbox
                                        label="Sponson Turrets (Advanced; side weapons in a pair of 180-degree sponsons, no jump jets)"
                                        checked={vehicle.hasSponsonTurrets()}
                                        onChange={this.updateSponsonTurrets}
                                    />
                                ) : null}
                                {vehicle.getSponsonIssue() ? <p className="color-red smaller-text">{vehicle.getSponsonIssue()} (TO p. 411).</p> : null}
                                {vehicle.canUseFractionalAccounting(rulesLevel) || vehicle.usesFractionalAccounting() ? (
                                    <div data-testid="fractional-accounting-option">
                                        <InputCheckbox
                                            label="Fractional Accounting (Experimental)"
                                            checked={vehicle.usesFractionalAccounting()}
                                            onChange={this.toggleFractionalAccounting}
                                        />
                                        <p className="smaller-text">
                                            Construction option (TO:AUE p.188): engine, structure, control, lift, turret and armor
                                            weights are not rounded to the half ton, only up to the kilogram. Armor is bought by
                                            the point and ammunition by the shot.
                                        </p>
                                        {vehicle.defaultsToFractionalAccounting() ? (
                                            <p className="smaller-text" data-testid="fractional-accounting-default">
                                                On by default with battle armor equipment mounted (Ghosts of Obeedah p.54); it may be turned off.
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}

                                {vehicle.isFrankenVehicle() || vehicle.canBeFrankenVehicle(rulesLevel) ? (
                                    <InputCheckbox
                                        label="FrankenVehicle (Custom Homebrew: a turret taken from another vehicle)"
                                        checked={vehicle.isFrankenVehicle()}
                                        onChange={this.updateFrankenVehicle}
                                    />
                                ) : null}
                                {vehicle.getFrankenVehicle() ? (
                                    <fieldset className="fieldset" data-testid="franken-vehicle">
                                        <legend>FrankenVehicle Turret (Custom Homebrew)</legend>
                                        <p className="smaller-text">
                                            The chassis sets the tonnage, motive type and structure. The turret comes from a vehicle no heavier
                                            than this one and keeps that vehicle's structure points (1 per 10 tons). Driving Skill Rolls take +1
                                            if the loaded turret is heavier than the one the chassis was built for; turret weapons take +1 to hit
                                            unless the commander, riding in the turret, fires them; and whenever the turret takes damage, its
                                            mismatched linkages lock it on 2D6 {Vehicle.FRANKEN_TURRET_LOCK_TARGET}+. Not an OmniVehicle.
                                        </p>
                                        <label>
                                            Turret donor vehicle:
                                            <input
                                                type="text"
                                                value={vehicle.getFrankenVehicle()?.turretDonorName ?? ""}
                                                maxLength={Vehicle.FRANKEN_DONOR_NAME_LENGTH}
                                                onChange={(e) => this.updateFrankenVehicleTurret({ turretDonorName: e.currentTarget.value })}
                                            />
                                        </label>
                                        <label>
                                            Turret donor tonnage:
                                            <input
                                                type="number" min={1} max={vehicle.getTonnage()} step={1}
                                                value={vehicle.getFrankenVehicle()?.turretDonorTonnage}
                                                onChange={(e) => this.updateFrankenVehicleTurret({ turretDonorTonnage: +e.currentTarget.value })}
                                            />
                                        </label>
                                        <label>
                                            Chassis's original turret, loaded (tons; 0 if it had none):
                                            <input
                                                type="number" min={0} max={vehicle.getTonnage()} step={0.5}
                                                value={vehicle.getFrankenVehicle()?.originalTurretWeight}
                                                onChange={(e) => this.updateFrankenVehicleTurret({ originalTurretWeight: +e.currentTarget.value })}
                                            />
                                        </label>
                                        <label>
                                            Turret weapons fired by:
                                            <select
                                                value={vehicle.getFrankenVehicle()?.turretGunner}
                                                onChange={(e) => this.updateFrankenVehicleTurret({ turretGunner: e.currentTarget.value === "chassis" ? "chassis" : "commander" })}
                                            >
                                                <option value="commander">The commander, in the turret</option>
                                                <option value="chassis">A gunner in the chassis (+1 to hit)</option>
                                            </select>
                                        </label>
                                        <p className="smaller-text" data-testid="franken-vehicle-summary">
                                            Turret: {vehicle.getStructureAllocation().turret ?? 0} structure points; {vehicle.getTurretLoadedWeight()} tons loaded.
                                            {vehicle.getFrankenVehicleDrivingModifier() > 0 ? " Heavier than the original: +1 to Driving Skill Rolls." : ""}
                                        </p>
                                    </fieldset>
                                ) : null}

                                {vehicle.getRequiredRulesLevel() > rulesLevel ? (
                                    <p className="color-red smaller-text">
                                        This design needs the {getRulesLevelOptions().find((option) => option.id === vehicle.getRequiredRulesLevel())?.name} rules
                                        level{vehicle.isSuperheavy() && !support ? " (Superheavy vehicle)" : ""}{vehicle.hasChinTurret() ? " (chin turret)" : ""}{vehicle.getJumpMP() > 0 ? " (jump jets)" : ""}{vehicle.hasDualTurret() ? " (dual turrets)" : ""}{vehicle.hasSponsonTurrets() ? " (sponson turrets)" : ""}{vehicle.isFrankenVehicle() ? " (FrankenVehicle)" : ""}{vehicle.getRoboticControl().tag !== "none" ? " (robotic control)" : ""} and
                                        is not legal at the selected level. Printing will ask for confirmation.
                                    </p>
                                ) : null}

                                {support ? this.renderSupportVehicle(vehicle, cruiseOptions) : (<>
                                <h3>Movement and Engine</h3>
                                <label>
                                    Engine Type:
                                    <select value={vehicle.getEngineType().tag} onChange={this.updateEngineType}>
                                        {vehicle.getAvailableEngineTypes(rulesLevel)
                                            .filter((option) => isOptionShown(option, option.tag === vehicle.getEngineType().tag))
                                            .map((option) => (
                                                <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
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
                                </>)}

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

                                <VehicleBays appGlobals={this.props.appGlobals} />

                                <label>
                                    Extra Heat Sinks:
                                    <InputNumeric
                                        value={vehicle.getAdditionalHeatSinks()}
                                        min={0}
                                        step={1}
                                        setValue={this.updateHeatSinks}
                                    />
                                </label>

                                {rulesLevel >= SRCS_RULES_LEVEL || vehicle.getRoboticControl().tag !== "none" ? (
                                    <div data-testid="robotic-control-option">
                                        <label>
                                            Robotic Control (Advanced):
                                            <select value={vehicle.getRoboticControl().tag} onChange={this.updateRoboticControl}>
                                                {vehicle.getAvailableRoboticControls().map((system) => (
                                                    <option key={system.tag} value={system.tag}>{system.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                        {vehicle.getRoboticSkills() ? (
                                            <p className="smaller-text" data-testid="robotic-control-summary">
                                                {vehicle.getRoboticControlWeight()} t; the vehicle drives itself at Gunnery {vehicle.getRoboticSkills()?.gunnery} /
                                                Driving {vehicle.getRoboticSkills()?.piloting}, and its Battle Value is multiplied by 0.85 (IO:AE pp.134-135, 187).
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}

                                {vehicle.getAvailableChassisModifications().length > 0 && (rulesLevel >= 3 || vehicle.getChassisModifications().length > 0) ? (
                                    <fieldset data-testid="chassis-modifications">
                                        <legend>Chassis Modifications (Advanced, TO:AUE pp.114-115)</legend>
                                        {vehicle.getAvailableChassisModifications().map((mod) => (
                                            <label key={mod.tag} title={mod.description}>
                                                <input
                                                    type="checkbox"
                                                    checked={vehicle.hasChassisModification(mod.tag)}
                                                    onChange={(e) => {
                                                        const on = e.currentTarget.checked;
                                                        this.changeVehicle((current) => current.setChassisModification(mod.tag, on));
                                                    }}
                                                />{" "}
                                                {mod.name}{vehicle.getChassisModificationWeight(mod) > 0 ? ` (${vehicle.getChassisModificationWeight(mod)} t)` : ""}
                                            </label>
                                        ))}
                                    </fieldset>
                                ) : null}

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
