import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import MicroMech from '../../../../classes/micro-mech';
import {
    MICRO_MECH_CREDIT, MICRO_MECH_MAX_TONS, MICRO_MECH_MIN_TONS, MICRO_MECH_VERSIONS, MICRO_MECH_VERSION_RULES,
    MicroMechEngineKind, MicroMechLayout, MicroMechVersion,
} from '../../../../data/micro-mech-construction';
import { IAppGlobals } from '../../../app-router';
import InputField from "../../../components/form_elements/input_field";
import { MicroMechCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import MicroMechStatusBar from './_statusBar';
import { UnitGameSettingsBlock } from '../../../components/game-settings-block';
const ArrowCircleRight = FaArrowCircleRight as any;

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_unused, index) => from + index);
const ENGINE_NAMES: Record<MicroMechEngineKind, string> = { fusion: "Fusion", ice: "Internal Combustion (ICE)" };
const LAYOUT_NAMES: Record<MicroMechLayout, string> = { biped: "Biped", quad: "Quad" };

export default class MicroMechCreatorChassis extends React.Component<IChassisProps, IChassisState> {
    constructor(props: IChassisProps) {
        super(props);
        this.state = { versionIssues: [] };
        this.props.appGlobals.makeDocumentTitle("Steps 1-3 | Micro-Mech Creator");
    }

    // Every control changes the loaded Micro-Mech and saves it.
    update = (change: (micro: MicroMech) => void): void => {
        const micro = this.props.appGlobals.currentMicroMech;
        if (micro) {
            change(micro);
            this.props.appGlobals.saveCurrentMicroMech(micro);
        }
    }

    // Switching the rules text keeps everything and says what is no longer legal.
    changeVersion = (version: MicroMechVersion): void => {
        const micro = this.props.appGlobals.currentMicroMech;
        if (!micro) return;
        const issues = micro.setVersion(version);
        this.setState({ versionIssues: issues });
        this.props.appGlobals.saveCurrentMicroMech(micro);
    }

    render = (): JSX.Element => {
        const micro = this.props.appGlobals.currentMicroMech;
        if (!micro) return <></>;
        const rules = micro.getRules();
        const quad = micro.isQuad();
        const armorLocations = micro.getLocations();

        return (
            <UIPage current="classic-battletech-micro-mech-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <MicroMechCreatorSideMenu appGlobals={this.props.appGlobals} current="chassis" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <MicroMechStatusBar micro={micro} />
                        <TextSection label="Steps 1-3: Version, Chassis, Engine and Armor">
                            <p className="smaller-text" data-testid="mm-credit">
                                <strong>Fan-made (Custom Homebrew), NOT OFFICIAL.</strong> {MICRO_MECH_CREDIT}
                            </p>
                            {/* The shared settings block comes first: it decides what every field below offers (#324). */}
                            <UnitGameSettingsBlock unitType="mech" unit={micro} appGlobals={this.props.appGlobals} onChange={() => this.update(() => undefined)} />
                            <label>
                                Rules text:
                                <select data-testid="mm-version" value={micro.getVersion()} onChange={(e) => this.changeVersion(e.currentTarget.value as MicroMechVersion)}>
                                    {MICRO_MECH_VERSIONS.map((version) => <option key={version} value={version}>{MICRO_MECH_VERSION_RULES[version].name}</option>)}
                                </select>
                            </label>
                            <p className="smaller-text">{rules.source}</p>
                            {rules.borrowsTablesFrom ? (
                                <p className="smaller-text" data-testid="mm-borrowed">
                                    Equipment, cost and Battle Value from version {rules.borrowsTablesFrom}; the author's own tables are not published.
                                </p>
                            ) : null}
                            {this.state.versionIssues.length > 0 ? (
                                <div className="color-red" data-testid="mm-version-issues">
                                    <p>Nothing was removed, but under {rules.name} the design is not legal yet:</p>
                                    <ul>{this.state.versionIssues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
                                </div>
                            ) : null}

                            <InputField
                                label="Name (e.g. Storm STM-3X)"
                                value={micro.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((m) => m.setName(value)); }}
                            />
                            <label>
                                Layout:
                                <select data-testid="mm-layout" value={micro.getLayout()} onChange={(e) => { const value = e.currentTarget.value as MicroMechLayout; this.update((m) => m.setLayout(value)); }}>
                                    {Array.from(new Set([...micro.getLayoutOptions(), micro.getLayout()])).map((layout) => <option key={layout} value={layout}>{LAYOUT_NAMES[layout]}</option>)}
                                </select>
                            </label>
                            <label>
                                Tonnage:
                                <select data-testid="mm-tons" value={micro.getTons()} onChange={(e) => { const value = +e.currentTarget.value; this.update((m) => m.setTons(value)); }}>
                                    {range(MICRO_MECH_MIN_TONS, MICRO_MECH_MAX_TONS).map((tons) => <option key={tons} value={tons}>{tons} tons</option>)}
                                </select>
                            </label>
                            <p className="smaller-text">
                                Internal structure {micro.getStructureWeight()} kg ({micro.getTotalStructure()} points); cockpit {micro.getCockpitWeight()} kg;
                                gyro {micro.getGyroWeight()} kg.
                            </p>

                            <label>
                                Engine:
                                <select data-testid="mm-engine-kind" value={micro.getEngineKind()} onChange={(e) => { const value = e.currentTarget.value as MicroMechEngineKind; this.update((m) => m.setEngineKind(value)); }}>
                                    {Array.from(new Set([...micro.getEngineKindOptions(), micro.getEngineKind()])).map((kind) => <option key={kind} value={kind}>{ENGINE_NAMES[kind]}</option>)}
                                </select>
                            </label>
                            <label>
                                Walking MP:
                                <select data-testid="mm-walk" value={micro.getWalkMP()} onChange={(e) => { const value = +e.currentTarget.value; this.update((m) => m.setWalkMP(value)); }}>
                                    {range(1, micro.getMaxWalkMP()).map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                                </select>
                            </label>
                            <p className="smaller-text" data-testid="mm-engine-text">
                                Running MP {micro.getRunMP()}. Engine rating {micro.getEngineRating()} (a rating-{micro.getInstalledEngineRating()} engine is installed), {micro.getEngineWeight()} kg;
                                {" "}{micro.getFreeHeatSinks()} free heat sinks.
                            </p>
                            <label>
                                Jump jets ({rules.jumpJetKg} kg and one slot each):
                                <select data-testid="mm-jump" value={micro.getJumpJets()} onChange={(e) => { const value = +e.currentTarget.value; this.update((m) => m.setJumpJets(value)); }}>
                                    {range(0, micro.getWalkMP()).map((jets) => <option key={jets} value={jets}>{jets}</option>)}
                                </select>
                            </label>
                            <label>
                                <input type="checkbox" data-testid="mm-sealed" checked={micro.isSealed()}
                                    disabled={!micro.isSealed() && !rules.vacuumEngines.includes(micro.getEngineKind())}
                                    onChange={(e) => { const value = e.currentTarget.checked; this.update((m) => m.setSealed(value)); }} />
                                &nbsp;Sealed for vacuum (weighs what the structure weighs; {rules.vacuumEngines.join(" or ")} engines only)
                            </label>
                            {!quad ? (
                                <fieldset className="fieldset">
                                    <legend>Lower Arm Actuator Groups</legend>
                                    {(["left", "right"] as const).map((side) => (
                                        <label key={side}>
                                            <input type="checkbox" data-testid={`mm-lower-arm-${side}`} checked={micro.hasLowerArm(side)} onChange={(e) => { const value = e.currentTarget.checked; this.update((m) => m.setLowerArm(side, value)); }} />
                                            &nbsp;{side === "left" ? "Left" : "Right"} arm has its lower arm group (removing it frees a slot)
                                        </label>
                                    ))}
                                </fieldset>
                            ) : null}

                            <h3>Armor</h3>
                            <p className="smaller-text" data-testid="mm-armor-text">
                                {MICRO_MECH_ARMOR_NOTE} {micro.getArmorPoints()} points, {micro.getArmorWeight()} kg.
                            </p>
                            <table className="table table-sm" data-testid="mm-armor">
                                <thead>
                                    <tr><th>Location</th><th className="text-center">Structure</th><th className="text-center">Maximum</th><th className="text-center">Armor</th></tr>
                                </thead>
                                <tbody>
                                    {armorLocations.map((location) => (
                                        <tr key={location}>
                                            <td>{micro.getLocationName(location)}</td>
                                            <td className="text-center">{location === "torsoRear" ? "-" : micro.getStructure(location)}</td>
                                            <td className="text-center">{location === "torsoRear" ? "shared" : micro.getMaxArmor(location)}</td>
                                            <td className="text-center">
                                                <input
                                                    type="number" min={0} max={micro.getMaxArmor(location)} style={{ width: "5em" }}
                                                    aria-label={`${micro.getLocationName(location)} armor`} data-testid={`mm-armor-${location}`}
                                                    value={micro.getArmor(location)}
                                                    onChange={(e) => { const value = +e.currentTarget.value; this.update((m) => m.setArmor(location, Number.isFinite(value) ? value : 0)); }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/micro-mech-creator/equipment`} className="btn btn-primary pull-right btn-sm">
                                    Next Step <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

const MICRO_MECH_ARMOR_NOTE = "Armor is 62.5 kg a point (four points to the quarter ton); the torso's front and rear share one maximum.";

interface IChassisProps {
    appGlobals: IAppGlobals;
}

interface IChassisState {
    versionIssues: string[];
}
