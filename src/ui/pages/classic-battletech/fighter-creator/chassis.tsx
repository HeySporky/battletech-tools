import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import AerospaceFighter, { FIGHTER_MIN_TONNAGE, FIGHTER_TYPES } from '../../../../classes/aerospace-fighter';
import { btTechOptions } from '../../../../data/tech-options';
import { getRulesLevelOptions } from '../../../../data/rules-level-options';
import { SRCS_RULES_LEVEL } from '../../../../data/robotic-control-systems';
import { IAppGlobals } from '../../../app-router';
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
import FighterCreatorSideMenu from '../../../components/fighter-creator-side-menu';
import InputField from "../../../components/form_elements/input_field";
import InputNumeric from "../../../components/form_elements/input_numeric";
import RulesEditionSelect from '../../../components/rules-edition-select';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import SupportAircraftChassis from './_support-chassis';
const ArrowCircleRight = FaArrowCircleRight as any;

const range = (from: number, to: number, step: number = 1): number[] => {
    const values: number[] = [];
    for (let value = from; value <= to; value += step) values.push(value);
    return values;
};

export default class FighterCreatorChassis extends React.Component<IChassisProps> {
    constructor(props: IChassisProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Step 1 | Fighter Creator");
    }

    // Every control changes the loaded fighter and saves it.
    update = (change: (fighter: AerospaceFighter) => void): void => {
        const fighter = this.props.appGlobals.currentFighter;
        if (fighter) {
            change(fighter);
            this.props.appGlobals.saveCurrentFighter(fighter);
        }
    }

    updateRulesLevel = (e: React.FormEvent<HTMLSelectElement>): void => {
        const appSettings = this.props.appGlobals.appSettings;
        appSettings.mechRulesFilter = +e.currentTarget.value;
        this.props.appGlobals.saveAppSettings(appSettings);
    }

    render = (): JSX.Element => {
        const fighter = this.props.appGlobals.currentFighter;
        if (!fighter) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const remaining = fighter.getRemainingTonnage();
        const conventional = fighter.isConventional();

        return (
            <UIPage current="classic-battletech-fighter-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <FighterCreatorSideMenu appGlobals={this.props.appGlobals} current="chassis" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Step 1: Design the Chassis">
                            {/* The rules edition comes first: it decides what every field below offers. */}
                            <RulesEditionSelect unitType="fighter" value={fighter.getRulesEdition()} onChange={(tag) => this.update((f) => f.setRulesEdition(tag))} />
                            <InputField
                                label="Fighter Model # (e.g. SL-17)"
                                value={fighter.getModel()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setModel(value)); }}
                            />
                            <InputField
                                label="Fighter Name (e.g. Shilone)"
                                value={fighter.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setName(value)); }}
                            />

                            <label>
                                Fighter Type:
                                <select value={fighter.getFighterType()} onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setFighterType(value)); }}>
                                    {FIGHTER_TYPES.map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            <p className="smaller-text">
                                {fighter.isSupportVehicle()
                                    ? "Fixed-Wing, Airship and Satellite Support Vehicles are built with the Support Vehicle rules and fly by aerospace rules (TM pp.116-139; Large Airships and Satellites, TO:AUE pp.52-71)."
                                    : conventional
                                    ? "A conventional fighter flies in atmosphere only: 5 to 50 tons, a turbine or standard fusion engine, single heat sinks and armor of one point per ton of fighter (TM pp. 184-193)."
                                    : "An aerospace fighter flies in atmosphere and space: 5 to 100 tons, a fusion engine and armor of up to eight points per ton of fighter (TM pp. 184-193)."}
                            </p>

                            <label>
                                Technology Base:
                                <select value={fighter.getTech().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setTech(value)); }}>
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
                                Era:
                                <select value={fighter.getEra().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setEra(value)); }}>
                                    {fighter.getAvailableEras().map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            {fighter.getEra().description ? <p className="smaller-text">{fighter.getEra().description}</p> : null}

                            {fighter.isSupportVehicle() ? <SupportAircraftChassis fighter={fighter} update={this.update} /> : (<>
                            <label>
                                Tonnage:
                                <select value={fighter.getTonnage()} onChange={(e) => { const value = +e.currentTarget.value; this.update((f) => f.setTonnage(value)); }}>
                                    {range(FIGHTER_MIN_TONNAGE, fighter.getMaxTonnage(), 5).map((tons) => (
                                        <option key={tons} value={tons}>{tons}</option>
                                    ))}
                                </select>
                            </label>

                            <h3>Thrust and Engine</h3>
                            <label>
                                Safe Thrust:
                                <select value={fighter.getSafeThrust()} onChange={(e) => { const value = +e.currentTarget.value; this.update((f) => f.setSafeThrust(value)); }}>
                                    {range(fighter.getMinSafeThrust(), fighter.getMaxSafeThrust()).map((thrust) => (
                                        <option key={thrust} value={thrust}>{thrust} (Max Thrust {Math.ceil(thrust * 1.5)})</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Engine Type:
                                <select value={fighter.getEngineType().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setEngineType(value)); }}>
                                    {fighter.getAvailableEngineTypes(rulesLevel)
                                        .filter((option) => isOptionShown(option, option.tag === fighter.getEngineType().tag))
                                        .map((option) => (
                                            <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
                                        ))}
                                </select>
                            </label>
                            <p>
                                <strong>Engine Rating</strong>: {fighter.getEngineRating()} ({fighter.getEngineWeight()} tons) &nbsp;|&nbsp;
                                <strong>Cockpit and Controls</strong>: {fighter.getControlsWeight()} tons &nbsp;|&nbsp;
                                <strong>Structural Integrity</strong>: {fighter.getStructuralIntegrity()} (no weight)
                            </p>
                            <p className="smaller-text">
                                {conventional
                                    ? "Engine rating = tonnage x Safe Thrust, from the Master Engine Table; a fusion engine weighs 1.5 times the table weight. Controls weigh a tenth of the tonnage (TM pp. 49, 185, 189). "
                                    : "Engine rating = tonnage x (Safe Thrust - 2), from the Master Engine Table (TM pp. 49, 185). "}
                                Structural Integrity is the higher of Safe Thrust and a tenth of the tonnage (TM p. 187).
                            </p>
                            {fighter.isVSTOLOffered(rulesLevel) || fighter.hasVSTOL() ? (
                                <label>
                                    <input type="checkbox" checked={fighter.hasVSTOL()} onChange={(e) => { const value = e.currentTarget.checked; this.update((f) => f.setVSTOL(value)); }} />
                                    &nbsp;VSTOL equipment ({fighter.getVSTOLWeight() || "5% of tonnage"}{fighter.hasVSTOL() ? " tons" : ""}, TM p. 190)
                                </label>
                            ) : null}
                            {!conventional && (fighter.isVSTOLOffered(rulesLevel) || fighter.hasVSTOL()) ? (
                                <p className="smaller-text">
                                    Optional rule, offered from the Advanced rules level. An aerospace fighter already lands and lifts
                                    off vertically; the equipment removes the +2 penalty for a vertical landing in atmosphere. TechManual
                                    p. 190 allows it in the rule text, but its Sabutai example on the same page says an aerospace
                                    fighter may not mount it. Agree with your group before using it.
                                </p>
                            ) : null}
                            {!conventional ? (
                                <label>
                                    <input type="checkbox" checked={fighter.isOmni()} onChange={(e) => { const value = e.currentTarget.checked; this.update((f) => f.setOmni(value)); }} />
                                    &nbsp;OmniFighter (weapons and equipment may be pod-mounted; cost x 1.25, TM p. 285)
                                </label>
                            ) : null}
                            {fighter.canUseFractionalAccounting(rulesLevel) || fighter.usesFractionalAccounting() ? (
                                <div data-testid="fractional-accounting-option">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={fighter.usesFractionalAccounting()}
                                            onChange={(e) => { const value = e.currentTarget.checked; this.update((f) => f.setWeightAccounting(value ? "fractional" : "standard", rulesLevel)); }}
                                        />
                                        &nbsp;Fractional Accounting (Experimental)
                                    </label>
                                    <p className="smaller-text">
                                        Construction option (TO:AUE p.188): engine, control, VSTOL, power amplifier and armor weights
                                        are not rounded to the half ton, only up to the kilogram. Armor is bought by the point and
                                        ammunition by the shot. Fuel is still bought in half tons (TM p. 186).
                                    </p>
                                    {fighter.defaultsToFractionalAccounting() ? (
                                        <p className="smaller-text" data-testid="fractional-accounting-default">
                                            On by default with battle armor equipment mounted (Ghosts of Obeedah p.54); it may be turned off.
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}

                            {rulesLevel >= SRCS_RULES_LEVEL || fighter.getRoboticControl().tag !== "none" ? (
                                <div data-testid="robotic-control-option">
                                    <label>
                                        Robotic Control (Advanced):
                                        <select value={fighter.getRoboticControl().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setRoboticControl(value)); }}>
                                            {fighter.getAvailableRoboticControls().map((system) => (
                                                <option key={system.tag} value={system.tag}>{system.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    {fighter.getRoboticSkills() ? (
                                        <p className="smaller-text" data-testid="robotic-control-summary">
                                            {fighter.getRoboticControlWeight()} t on top of the cockpit; the drone flies at Gunnery {fighter.getRoboticSkills()?.gunnery} /
                                            Piloting {fighter.getRoboticSkills()?.piloting}, and its Battle Value is multiplied by 0.85 (IO:AE pp.134-135, 187).
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}

                            <h3>Fuel</h3>
                            <InputNumeric
                                label="Fuel (tons)"
                                value={fighter.getFuelTons()}
                                min={0}
                                max={fighter.getTonnage()}
                                step={0.5}
                                setValue={(tons) => this.update((f) => f.setFuelTons(tons))}
                            />
                            <p><strong>Fuel Points</strong>: {fighter.getFuelPoints()} ({fighter.getFuelPointsPerTon()} per ton, TM p. 186)</p>

                            <h3>Heat Sinks</h3>
                            <label>
                                Heat Sink Type:
                                <select value={fighter.getHeatSinkType().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setHeatSinkType(value)); }}>
                                    {fighter.getAvailableHeatSinkTypes(rulesLevel)
                                        .filter((option) => isOptionShown(option, option.tag === fighter.getHeatSinkType().tag))
                                        .map((option) => (
                                            <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
                                        ))}
                                </select>
                            </label>
                            <InputNumeric
                                label={`Additional Heat Sinks (1 ton each; ${fighter.getFreeHeatSinks()} come free with the engine)`}
                                value={fighter.getAdditionalHeatSinks()}
                                min={0}
                                max={100}
                                step={1}
                                setValue={(count) => this.update((f) => f.setAdditionalHeatSinks(count))}
                            />
                            <p>
                                <strong>Heat Sinks</strong>: {fighter.getTotalHeatSinks()} &nbsp;|&nbsp;
                                <strong>Dissipation</strong>: {fighter.getHeatDissipation()} &nbsp;|&nbsp;
                                <strong>{conventional ? "Energy Weapon Heat" : "Weapon Heat"}</strong>: {fighter.getWeaponHeat()}
                            </p>
                            {conventional ? (
                                <p className="smaller-text">
                                    A conventional fighter must carry a heat sink for every point of heat its energy weapons make;
                                    other weapons make none (TM p. 193).
                                </p>
                            ) : null}
                            </>)}

                            <p className={remaining < 0 ? "color-red" : ""}><strong>Remaining Tonnage</strong>: {remaining}</p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/armor`} className="btn btn-primary pull-right btn-sm">
                                    Next: Armor <ArrowCircleRight />
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
