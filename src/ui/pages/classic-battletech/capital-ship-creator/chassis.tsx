import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import CapitalShip, { MAX_CAPITAL_SHIP_SAFE_THRUST } from '../../../../classes/capital-ship';
import { advancedAerospaceTypes } from '../../../../data/advanced-aerospace-construction';
import { btTechOptions } from '../../../../data/tech-options';
import { chooseEra, getEraChoices, getTechChoices } from '../../../../data/era-choice';
import { CUSTOM_HOMEBREW_RULES_LEVEL, getRulesLevelOptions } from '../../../../data/rules-level-options';
import { IAppGlobals } from '../../../app-router';
import InputField from "../../../components/form_elements/input_field";
import InputNumeric from "../../../components/form_elements/input_numeric";
import NumberField from "./_numberField";
import CapitalShipCreatorSideMenu from '../../../components/capital-ship-creator-side-menu';
import RulesEditionSelect from '../../../components/rules-edition-select';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import CapitalShipStatusBar from './_statusBar';
const ArrowCircleRight = FaArrowCircleRight as any;

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_value, index) => from + index);
const tons = (value: number): string => value.toLocaleString("en-US");

export default class CapitalShipCreatorChassis extends React.Component<IChassisProps> {
    constructor(props: IChassisProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Steps 1-2 | JumpShip and WarShip Creator");
    }

    // Every control changes the loaded vessel and saves it.
    update = (change: (ship: CapitalShip) => void): void => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (ship) {
            change(ship);
            this.props.appGlobals.saveCurrentCapitalShip(ship);
        }
    }

    updateRulesLevel = (e: React.FormEvent<HTMLSelectElement>): void => {
        const appSettings = this.props.appGlobals.appSettings;
        appSettings.mechRulesFilter = +e.currentTarget.value;
        this.props.appGlobals.saveAppSettings(appSettings);
    }

    render = (): JSX.Element => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (!ship) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;

        return (
            <UIPage current="classic-battletech-capital-ship-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <CapitalShipCreatorSideMenu appGlobals={this.props.appGlobals} current="chassis" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <CapitalShipStatusBar ship={ship} rulesLevel={rulesLevel} />
                        <TextSection label="Step 1: Design the Hull">
                            {/* The rules edition comes first: it decides what every field below offers. */}
                            <RulesEditionSelect unitType="capital-ship" value={ship.getRulesEdition()} onChange={(tag) => this.update((s) => s.setRulesEdition(tag))} />
                            <label>
                                Rules Level:
                                <select value={rulesLevel} onChange={this.updateRulesLevel}>
                                    {getRulesLevelOptions().map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                                </select>
                            </label>
                            {/* The era comes next and decides the tech bases offered below (user ruling 2026-10-21). */}
                            <label>
                                Era:
                                <select value={ship.getEra().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => chooseEra(s, value)); }}>
                                    {getEraChoices(btTechOptions.map((option) => option.tag)).map((option) => <option key={option.tag} value={option.tag}>{option.name}</option>)}
                                </select>
                            </label>
                            <InputField
                                label="Class (e.g. McKenna)"
                                value={ship.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setName(value)); }}
                            />
                            <InputField
                                label="Model or Refit"
                                value={ship.getModel()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setModel(value)); }}
                            />
                            <label>
                                Vessel Type:
                                <select data-testid="cs-type" value={ship.getShipType()} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setShipType(value)); }}>
                                    {advancedAerospaceTypes.map((type) => (
                                        <option key={type.tag} value={type.tag}>{type.name} ({tons(type.minTons)} to {tons(type.maxTons)} tons)</option>
                                    ))}
                                </select>
                            </label>
                            <p className="smaller-text">
                                {ship.isWarShip()
                                    ? "A WarShip has a maneuvering drive, a compact K-F drive and eight firing arcs, the broadsides included; it is built in 10,000-ton steps (SO:AA p.133)."
                                    : ship.isSpaceStation()
                                        ? "A space station keeps station and never jumps; it is built in 500-ton steps and has six firing arcs. One built to ride a JumpShip has a K-F boom (SO:AA pp.133, 139)."
                                        : "A JumpShip has a station-keeping drive, a standard K-F drive and six firing arcs; it is built in 1,000-ton steps (SO:AA p.133)."}
                            </p>
                            {ship.isWarShip() && (rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL || ship.isMonitor()) ? (
                                <label className="d-block">
                                    <input type="checkbox" data-testid="cs-monitor" checked={ship.isMonitor()} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.setMonitor(value)); }} />
                                    {" "}Monitor (Custom Homebrew): no K-F drive or sail. A keel of half the structure's weight takes the drive frame's place,
                                    the base crew doubles, and a JumpShip or WarShip carries it between systems on one docking collar for every 100,000 tons
                                    (after the SLDF's monitors, XTRO: Boondoggles p.19).
                                </label>
                            ) : null}
                            <label>
                                Technology Base:
                                <select value={ship.getTech().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setTech(value)); }}>
                                    {btTechOptions.filter((option) => getTechChoices(ship.getEra(), [option.tag]).length > 0).map((option) => <option key={option.tag} value={option.tag}>{option.name}</option>)}
                                </select>
                            </label>
                            <label>
                                Tonnage:
                                <input
                                    type="number"
                                    data-testid="cs-tonnage"
                                    min={ship.getMinTonnage()}
                                    max={ship.getMaxTonnage()}
                                    step={ship.getTonnageStep()}
                                    value={ship.getTonnage()}
                                    onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setTonnage(value)); }}
                                />
                            </label>
                            {ship.isSpaceStation() ? (
                                <label>
                                    <input type="checkbox" data-testid="cs-kf-boom" checked={ship.hasKFBoom()} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.setKFBoom(value)); }} />
                                    {" "}K-F boom: carried by a JumpShip, 100,000 tons at most, cost x 20 (SO:AA p.139)
                                </label>
                            ) : null}
                        </TextSection>

                        <TextSection label="Step 2: Structure, Drives, K-F Drive, Fuel and Controls">
                            {ship.isWarShip() ? (
                                <>
                                    <label>
                                        Safe Thrust:
                                        <select data-testid="cs-thrust" value={ship.getSafeThrust()} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setSafeThrust(value)); }}>
                                            {range(1, MAX_CAPITAL_SHIP_SAFE_THRUST).map((thrust) => <option key={thrust} value={thrust}>{thrust} (Max Thrust {Math.ceil(thrust * 1.5)})</option>)}
                                        </select>
                                    </label>
                                    <NumberField
                                        label={`Structural Integrity (${ship.getMinStructuralIntegrity()} to ${ship.getMaxStructuralIntegrity()})`}
                                        value={ship.getStructuralIntegrity()}
                                        min={ship.getMinStructuralIntegrity()}
                                        max={ship.getMaxStructuralIntegrity()}
                                        step={1}
                                        setValue={(value) => this.update((s) => s.setStructuralIntegrity(value))}
                                    />
                                </>
                            ) : null}
                            <p>
                                <strong>Structure</strong>: {tons(ship.getStructureWeight())} tons (SI {ship.getStructuralIntegrity()}) &nbsp;|&nbsp;
                                <strong>{ship.isWarShip() ? "Engine" : "Station-keeping drive"}</strong>: {tons(ship.getEngineWeight())} tons &nbsp;|&nbsp;
                                <strong>Controls</strong>: {tons(ship.getControlsWeight())} tons
                                {ship.isMonitor() ? <> &nbsp;|&nbsp; <strong>Keel (Custom)</strong>: {tons(ship.getKeelWeight())} tons</> : null}
                            </p>
                            <p className="smaller-text">
                                {ship.isWarShip()
                                    ? "Structural Integrity runs from Maximum Thrust to 30 times it and weighs SI x tonnage / 1,000. The engine weighs tonnage x Safe Thrust x 0.06."
                                    : `Structural Integrity is 1 and weighs tonnage / ${ship.isSpaceStation() ? 100 : 150}. The station-keeping drive weighs tonnage x 0.012.`}
                                {" "}All rounded up to the half ton; controls weigh tonnage x {ship.isSpaceStation() ? "0.001" : "0.0025"}, rounded up to the ton (SO:AA pp.134-137).
                            </p>

                            {ship.hasKFDrive() ? (
                                <>
                                    <p data-testid="cs-kf">
                                        <strong>{ship.isWarShip() ? "Compact" : "Standard"} K-F drive</strong>: {tons(ship.getKFDriveWeight())} tons, Integrity {ship.getKFDriveIntegrity()} &nbsp;|&nbsp;
                                        <strong>Jump sail</strong>: {ship.getJumpSailWeight()} tons, Integrity {ship.getJumpSailIntegrity()}
                                    </p>
                                    <label>
                                        <input type="checkbox" data-testid="cs-lf-battery" checked={ship.hasLithiumFusionBattery()} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.setLithiumFusionBattery(value)); }} />
                                        {" "}Lithium-fusion battery: a second jump, 1 percent of the vessel's weight (TO:AUE p.135)
                                    </label>
                                    <p className="smaller-text">
                                        A JumpShip or WarShip must have a K-F drive and its sail (SO:AA p.136 and errata v5.0), so they are
                                        always installed.
                                    </p>
                                </>
                            ) : ship.isMonitor() ? (
                                <p data-testid="cs-kf">
                                    <strong>No K-F drive</strong>: this monitor cannot jump. To change systems it docks to a JumpShip or WarShip
                                    with {ship.getCarrierCollarsNeeded()} free docking collars.
                                </p>
                            ) : null}

                            <InputNumeric
                                label="Fuel (tons)"
                                value={ship.getFuelTons()}
                                min={0}
                                max={ship.getTonnage()}
                                step={0.5}
                                setValue={(value) => this.update((s) => s.setFuelTons(value))}
                            />
                            <p>
                                <strong>Fuel Points</strong>: {tons(ship.getFuelPoints())} ({ship.getFuelPointsPerTon()} per ton) &nbsp;|&nbsp;
                                <strong>Tanks and Pumps</strong>: {ship.getFuelPumpWeight()} tons &nbsp;|&nbsp;
                                <strong>Burn-days</strong>: {ship.getBurnDays()} ({ship.getStrategicFuelPerDay()} tons a day)
                            </p>
                            <p className="smaller-text">
                                Stations and JumpShips burn a tenth of the listed fuel a day; tanks and pumps bring the fuel's weight up
                                by 2 percent, rounded up to the ton (SO:AA p.135).
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/armor`} className="btn btn-primary pull-right btn-sm">
                                    Next: Heat Sinks and Armor <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IChassisProps {
    appGlobals: IAppGlobals;
}
