import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import ProtoMech, { PROTOMECH_POINT_SIZE, ProtoMechJumpType } from '../../../../classes/protomech';
import {
    PROTOMECH_ADVANCED_RULES_LEVEL, PROTOMECH_CHASSIS, PROTOMECH_EXPERIMENTAL_RULES_LEVEL, PROTOMECH_MAX_STANDARD_TONS,
} from '../../../../data/protomech-construction';
import { getRulesLevelOptions } from '../../../../data/rules-level-options';
import { IAppGlobals } from '../../../app-router';
import InputField from "../../../components/form_elements/input_field";
import ProtoMechCreatorSideMenu from '../../../components/protomech-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import ProtoMechStatusBar from './_statusBar';
const ArrowCircleRight = FaArrowCircleRight as any;

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_unused, index) => from + index);
const JUMP_NAMES: Record<ProtoMechJumpType, string> = { none: "None", standard: "Jump Jets", extended: "Extended Jump Jet (XJJ) System", umu: "UMUs" };
const JUMP_LEVELS: Record<ProtoMechJumpType, number> = { none: 0, standard: 2, extended: 2, umu: PROTOMECH_EXPERIMENTAL_RULES_LEVEL };

export default class ProtoMechCreatorChassis extends React.Component<IChassisProps> {
    constructor(props: IChassisProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Steps 1-4 | ProtoMech Creator");
    }

    // Every control changes the loaded ProtoMech and saves it.
    update = (change: (proto: ProtoMech) => void): void => {
        const proto = this.props.appGlobals.currentProtoMech;
        if (proto) {
            change(proto);
            this.props.appGlobals.saveCurrentProtoMech(proto);
        }
    }

    updateRulesLevel = (e: React.FormEvent<HTMLSelectElement>): void => {
        const appSettings = this.props.appGlobals.appSettings;
        appSettings.mechRulesFilter = +e.currentTarget.value;
        this.props.appGlobals.saveAppSettings(appSettings);
    }

    render = (): JSX.Element => {
        const proto = this.props.appGlobals.currentProtoMech;
        if (!proto) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const advanced = rulesLevel >= PROTOMECH_ADVANCED_RULES_LEVEL;
        const experimental = rulesLevel >= PROTOMECH_EXPERIMENTAL_RULES_LEVEL;
        const maxTons = advanced || proto.isUltraheavy() ? proto.getMaxTons() : PROTOMECH_MAX_STANDARD_TONS;
        const jumpType = proto.getJumpType();
        const glider = proto.isGlider();

        return (
            <UIPage current="classic-battletech-protomech-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <ProtoMechCreatorSideMenu appGlobals={this.props.appGlobals} current="chassis" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <ProtoMechStatusBar proto={proto} />
                        <TextSection label="Step 1: Design the Chassis">
                            <InputField
                                label="Name (e.g. Centaur 2, Roc)"
                                value={proto.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setName(value)); }}
                            />
                            <label>
                                Era:
                                <select data-testid="pm-era" value={proto.getEra().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setEra(value)); }}>
                                    {proto.getAvailableEras().map((option) => (
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
                                Chassis Type:
                                <select data-testid="pm-chassis" value={proto.getChassis()} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setChassis(value)); }}>
                                    {PROTOMECH_CHASSIS.filter((option) => option.rulesLevel <= rulesLevel || option.tag === proto.getChassis()).map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}{option.rulesLevel > 2 ? ` (Advanced; ${option.book} p. ${option.page})` : ""}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Tonnage:
                                <select data-testid="pm-tons" value={proto.getTons()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setTons(value)); }}>
                                    {range(proto.getMinTons(), Math.max(maxTons, proto.getTons())).map((tons) => (
                                        <option key={tons} value={tons}>{tons} tons{tons > PROTOMECH_MAX_STANDARD_TONS ? " (Ultraheavy)" : ""}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <input type="checkbox" data-testid="pm-main-gun" checked={proto.hasMainGun()} onChange={(e) => { const value = e.currentTarget.checked; this.update((p) => p.setMainGun(value)); }} />
                                &nbsp;Main gun mount (no weight; one item of any weight{proto.isQuad() ? ", in a turret" : ""})
                            </label>
                            {experimental || proto.hasInterfaceCockpit() ? (
                                <label>
                                    <input type="checkbox" checked={proto.hasInterfaceCockpit()} onChange={(e) => { const value = e.currentTarget.checked; this.update((p) => p.setInterfaceCockpit(value)); }} />
                                    &nbsp;Inner Sphere ProtoMech Interface cockpit (Experimental; makes the unit Mixed Technology; IO:AE p. 96)
                                </label>
                            ) : null}
                            <p className="smaller-text">
                                {proto.getWeightClassName()} ProtoMech, Clan technology base. Internal structure {proto.getStructureWeight()} kg
                                ({proto.getTotalStructure()} points); cockpit {proto.getCockpitWeight()} kg.
                                {!advanced ? " Ultraheavy (10 to 15 tons), Quad and Glider ProtoMechs are offered at the Advanced rules level." : ""}
                            </p>
                        </TextSection>

                        <TextSection label="Step 2: Install Engine and Control Systems">
                            <label>
                                {glider ? "WiGE Cruising MP:" : "Walking MP:"}
                                <select data-testid="pm-walk" value={proto.getWalkMP()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setWalkMP(value)); }}>
                                    {range(proto.getMinWalkMP(), proto.getMaxWalkMP()).map((mp) => (
                                        <option key={mp} value={mp}>{mp} ({glider ? "flanking" : "running"} {Math.ceil(mp * 1.5)})</option>
                                    ))}
                                </select>
                            </label>
                            <p className="smaller-text" data-testid="pm-engine">
                                Engine Rating {proto.getEngineRating()}{proto.getInstalledEngineRating() !== proto.getEngineRating() ? `, built as ${proto.getInstalledEngineRating()}` : ""}: {proto.getEngineWeight()} kg.
                                {proto.isQuad() || glider ? ` ${glider ? "Gliders" : "Quads"} find the rating from 2 MP less (IO:AE p. 96).` : ""}
                                {glider ? " On the ground a Glider moves 1 MP." : ""}
                            </p>
                            {glider ? null : (
                                <>
                                    <label>
                                        Jump Capability:
                                        <select data-testid="pm-jump-type" value={jumpType} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setJump(value, p.getJumpJets() || 1)); }}>
                                            {proto.getAvailableJumpTypes().filter((type) => JUMP_LEVELS[type] <= rulesLevel || type === jumpType).map((type) => (
                                                <option key={type} value={type}>{JUMP_NAMES[type]}{type === "umu" ? " (Experimental; TO:AUE p. 107)" : type === "extended" ? " (IO:AE p. 59)" : ""}</option>
                                            ))}
                                        </select>
                                    </label>
                                    {jumpType !== "none" ? (
                                        <label>
                                            {jumpType === "umu" ? "UMUs:" : "Jump Jets:"}
                                            <select data-testid="pm-jump-mp" value={proto.getJumpJets()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setJump(p.getJumpType(), value)); }}>
                                                {range(1, proto.getMaxJumpJets()).map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                                            </select>
                                            &nbsp;{proto.getJumpWeight()} kg
                                        </label>
                                    ) : null}
                                    <label>
                                        <input type="checkbox" data-testid="pm-booster" checked={proto.hasMyomerBooster()} onChange={(e) => { const value = e.currentTarget.checked; this.update((p) => p.setMyomerBooster(value)); }} />
                                        &nbsp;ProtoMech Myomer Booster ({proto.getTons() * 25} kg; Running MP {proto.getWalkMP() * 2} when engaged; TM p. 85)
                                    </label>
                                </>
                            )}
                        </TextSection>

                        <TextSection label="Step 3: Heat Sinks">
                            <p data-testid="pm-heat-sinks">
                                {proto.getHeatSinks()} heat sinks, {proto.getHeatSinkWeight()} kg: one for each point of heat the energy weapons make.
                                ProtoMechs get no heat sinks with the engine and do not track heat (TM p. 86).
                            </p>
                        </TextSection>

                        <TextSection label="Step 4: Add Armor">
                            {experimental || proto.getArmorType() === "edp" ? (
                                <label>
                                    Armor Type:
                                    <select data-testid="pm-armor-type" value={proto.getArmorType()} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setArmorType(value)); }}>
                                        <option value="standard">ProtoMech Standard Armor (50 kg a point)</option>
                                        <option value="edp">Electric Discharge ProtoMech Armor (Experimental; 75 kg a point, one torso item less; IO:AE p. 59)</option>
                                    </select>
                                </label>
                            ) : null}
                            <table className="table">
                                <thead>
                                    <tr><th>Location</th><th>Structure</th><th>Armor</th><th>Maximum</th></tr>
                                </thead>
                                <tbody>
                                    {proto.getLocations().map((location) => (
                                        <tr key={location}>
                                            <td>{proto.getLocationName(location)}</td>
                                            <td>{proto.getStructure(location)}</td>
                                            <td>
                                                <select aria-label={`${proto.getLocationName(location)} armor`} data-testid={`pm-armor-${location}`} value={proto.getArmor(location)} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setArmor(location, value)); }}>
                                                    {range(0, proto.getMaxArmor(location)).map((points) => <option key={points} value={points}>{points}</option>)}
                                                </select>
                                            </td>
                                            <td>{proto.getMaxArmor(location)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p>
                                <button className="btn btn-primary btn-sm" type="button" data-testid="pm-armor-max" onClick={() => this.update((p) => p.setMaximumArmor())}>Maximum Armor</button>
                                &nbsp;
                                <button className="btn btn-primary btn-sm" type="button" onClick={() => this.update((p) => p.clearArmor())}>Clear Armor</button>
                                &nbsp; {proto.getTotalArmor()} of {proto.getMaxTotalArmor()} points, {proto.getArmorWeight()} kg
                            </p>
                        </TextSection>

                        <TextSection label="Warrior and Point">
                            <label>
                                Gunnery Skill:
                                <select value={proto.getGunnery()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setGunnery(value)); }}>
                                    {range(0, 8).map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                                </select>
                            </label>
                            <label>
                                ProtoMechs in the Point:
                                <select data-testid="pm-point-size" value={proto.getPointSize()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setPointSize(value)); }}>
                                    {range(1, PROTOMECH_POINT_SIZE).map((size) => <option key={size} value={size}>{size}</option>)}
                                </select>
                            </label>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/protomech-creator/equipment`} className="btn btn-primary pull-right btn-sm">
                                    Step 5: Weapons and Equipment <ArrowCircleRight />
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
