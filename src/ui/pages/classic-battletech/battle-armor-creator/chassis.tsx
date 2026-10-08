import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import BattleArmor, { BATTLE_ARMOR_LOCATION_NAMES, BATTLE_ARMOR_MAX_CARGO_HALF_TONS, BattleArmorArm } from '../../../../classes/battle-armor';
import {
    BATTLE_ARMOR_MAX_SQUAD, BattleArmorMotive, battleArmorFormations, battleArmorManipulators, battleArmorWeightClasses,
} from '../../../../data/battle-armor-construction';
import { getRulesLevelOptions } from '../../../../data/rules-level-options';
import { IAppGlobals } from '../../../app-router';
import BattleArmorCreatorSideMenu from '../../../components/battle-armor-creator-side-menu';
import InputField from "../../../components/form_elements/input_field";
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import BattleArmorStatusBar from './_statusBar';
const ArrowCircleRight = FaArrowCircleRight as any;

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_unused, index) => from + index);
const MOTIVE_NAMES: Record<BattleArmorMotive, string> = { none: "None", jump: "Jump Jets", vtol: "VTOL System", umu: "UMU System" };

export default class BattleArmorCreatorChassis extends React.Component<IChassisProps> {
    constructor(props: IChassisProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Steps 1-4 | Battle Armor Creator");
    }

    // Every control changes the loaded suit and saves it.
    update = (change: (suit: BattleArmor) => void): void => {
        const suit = this.props.appGlobals.currentBattleArmor;
        if (suit) {
            change(suit);
            this.props.appGlobals.saveCurrentBattleArmor(suit);
        }
    }

    updateRulesLevel = (e: React.FormEvent<HTMLSelectElement>): void => {
        const appSettings = this.props.appGlobals.appSettings;
        appSettings.mechRulesFilter = +e.currentTarget.value;
        this.props.appGlobals.saveAppSettings(appSettings);
    }

    render = (): JSX.Element => {
        const suit = this.props.appGlobals.currentBattleArmor;
        if (!suit) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const weightClass = suit.getWeightClass();
        const motive = suit.getMotive();
        const motiveLimit = suit.getMotiveLimit(motive);
        const armor = suit.getArmor();
        const capabilities = suit.getCapabilities();

        return (
            <UIPage current="classic-battletech-battle-armor-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <BattleArmorCreatorSideMenu appGlobals={this.props.appGlobals} current="chassis" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <BattleArmorStatusBar suit={suit} />
                        <TextSection label="Step 1: Design the Chassis">
                            <InputField
                                label="Name (e.g. Elemental, Purifier Adaptive Battle Armor)"
                                value={suit.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setName(value)); }}
                            />
                            <label>
                                Technology Base:
                                <select data-testid="ba-tech-base" value={suit.getTechBase()} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setTechBase(value === "clan" ? "clan" : "is")); }}>
                                    <option value="is">Inner Sphere</option>
                                    <option value="clan">Clan</option>
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
                                Weight Class:
                                <select data-testid="ba-weight-class" value={weightClass.tag} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setWeightClass(value)); }}>
                                    {battleArmorWeightClasses.map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name} ({option.minWeight}-{option.maxWeight} kg)</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Body Type:
                                <select data-testid="ba-body-type" value={suit.getBodyType()} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setBodyType(value === "quad" ? "quad" : "humanoid")); }}>
                                    <option value="humanoid">Humanoid</option>
                                    {weightClass.quadSlots !== null ? <option value="quad">Quad</option> : null}
                                </select>
                            </label>
                            {suit.canUseExoskeletonChassis() ? (
                                <label>
                                    <input type="checkbox" checked={suit.usesExoskeletonChassis()} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.setExoskeletonChassis(value)); }} />
                                    &nbsp;An industrial exoskeleton on an Inner Sphere chassis weight (80 kg)
                                </label>
                            ) : null}
                            <p className="smaller-text">
                                Chassis {suit.getChassisWeight()} kg; weapon slots: {suit.isQuad() ? `${suit.getSlots("body")} in the body` : `${suit.getSlots("la")} in each arm and ${suit.getSlots("body")} in the body`}.
                                Every suit has 1 point of internal structure, the trooper (TM pp. 162-163).
                            </p>

                            <h3>Squad</h3>
                            <label>
                                Troopers:
                                <select data-testid="ba-squad-size" value={suit.getSquadSize()} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setSquadSize(value)); }}>
                                    {range(1, BATTLE_ARMOR_MAX_SQUAD).map((value) => <option key={value} value={value}>{value}</option>)}
                                </select>
                            </label>
                            <label>
                                Gunnery Skill:
                                <select value={suit.getGunnery()} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setGunnery(value)); }}>
                                    {range(0, 8).map((value) => <option key={value} value={value}>{value}</option>)}
                                </select>
                            </label>
                            <label>
                                Anti-'Mech Skill:
                                <select value={suit.getAntiMechSkill()} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setAntiMechSkill(value)); }}>
                                    {range(0, 8).map((value) => <option key={value} value={value}>{value}</option>)}
                                </select>
                            </label>
                            <p className="smaller-text">
                                Recommended formations (TM p. 172): {battleArmorFormations.filter((formation) => formation.techBase === suit.getTechBase()).map((formation) => `${formation.name} ${formation.troopers}`).join("; ")}. No squad has more than 6 troopers.
                            </p>
                        </TextSection>

                        <TextSection label="Step 2: Install Motive Systems">
                            <label>
                                Ground MP:
                                <select data-testid="ba-ground-mp" value={suit.getGroundMP()} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setGroundMP(value)); }}>
                                    {range(suit.getFreeGroundMP(), suit.getMaxGroundMP()).map((value) => (
                                        <option key={value} value={value}>{value}{value === suit.getFreeGroundMP() ? " (free)" : ` (+${(value - suit.getFreeGroundMP()) * weightClass.kgPerGroundMP} kg)`}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Non-Ground Movement:
                                <select data-testid="ba-motive" value={motive} onChange={(e) => { const value = e.currentTarget.value as BattleArmorMotive; this.update((s) => s.setMotive(value, 1)); }}>
                                    {suit.getAvailableMotives().map((option) => <option key={option} value={option}>{MOTIVE_NAMES[option]}</option>)}
                                </select>
                            </label>
                            {motiveLimit ? (
                                <label>
                                    {MOTIVE_NAMES[motive]} MP:
                                    <select data-testid="ba-motive-mp" value={suit.getMotiveMP()} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setMotive(motive, value)); }}>
                                        {range(1, motiveLimit.maxMP).map((value) => <option key={value} value={value}>{value} ({value * motiveLimit.kgPerMP} kg)</option>)}
                                    </select>
                                </label>
                            ) : null}
                            <p className="smaller-text">
                                {suit.isQuad() ? "Quads fit no jump jets, VTOL or UMU systems. " : suit.isClan() ? "" : "VTOL and UMU systems are Clan only. "}
                                Jump boosters and partial wings are added with the equipment in Step 5 (TM pp. 164-165).
                            </p>
                        </TextSection>

                        <TextSection label="Step 3: Add Manipulators">
                            {suit.isQuad() ? <p>Quad battle armor may not use manipulators (TM p. 166).</p> : (["la", "ra"] as BattleArmorArm[]).map((arm) => (
                                <div key={arm}>
                                    <label>
                                        {BATTLE_ARMOR_LOCATION_NAMES[arm]}:
                                        <select data-testid={`ba-manipulator-${arm}`} value={suit.getManipulator(arm).tag} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setManipulator(arm, value)); }}>
                                            {battleArmorManipulators.map((option) => (
                                                <option key={option.tag} value={option.tag}>{option.name} ({option.kg} kg{option.kind === "cargo" ? " a half ton lifted" : ""}{option.mustPair ? ", in pairs" : ""})</option>
                                            ))}
                                        </select>
                                    </label>
                                    {suit.getManipulator(arm).kind === "cargo" ? (
                                        <label>
                                            Lifting Capacity:
                                            <select value={suit.getArm(arm).cargoHalfTons} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setCargoHalfTons(arm, value)); }}>
                                                {range(1, BATTLE_ARMOR_MAX_CARGO_HALF_TONS).map((value) => <option key={value} value={value}>{value / 2} tons</option>)}
                                            </select>
                                        </label>
                                    ) : null}
                                    <label>
                                        <input type="checkbox" data-testid={`ba-adaptor-${arm}`} checked={suit.getArm(arm).adaptor} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.setAdaptor(arm, value)); }} />
                                        &nbsp;In a modular equipment adaptor (10 kg, 2 weapon slots in the arm)
                                    </label>
                                </div>
                            ))}
                            <p data-testid="ba-capabilities">
                                <strong>Swarm attacks</strong>: {capabilities.swarm ? "Yes" : "No"} &nbsp;|&nbsp;
                                <strong>Leg attacks</strong>: {capabilities.leg ? "Yes" : "No"} &nbsp;|&nbsp;
                                <strong>Mechanized battle armor</strong>: {capabilities.mechanized ? "Yes" : "No"}
                            </p>
                            {capabilities.notes.length > 0 ? <ul className="smaller-text">{capabilities.notes.map((note, index) => <li key={index}>{note}</li>)}</ul> : null}
                        </TextSection>

                        <TextSection label="Step 4: Add Armor">
                            <label>
                                Armor Type:
                                <select data-testid="ba-armor" value={armor.tag} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setArmor(value)); }}>
                                    {suit.getAvailableArmor(rulesLevel).map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name} ({suit.getArmorKgPerPoint(option)} kg a point, {option.slots} slots)</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Armor Points:
                                <select data-testid="ba-armor-points" value={suit.getArmorPoints()} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setArmorPoints(value)); }}>
                                    {range(0, suit.getMaxArmorPoints()).map((value) => <option key={value} value={value}>{value}</option>)}
                                </select>
                            </label>
                            <p className="smaller-text">
                                {weightClass.name} battle armor carries up to {suit.getMaxArmorPoints()} points (TM p. 169). {armor.name}: {armor.special}.
                                {suit.getArmorSlots() > 0 ? ` Its ${suit.getArmorSlots()} weapon slots may be found anywhere on the suit; the creator takes them from the slots left free.` : ""}
                                {armor.book !== "TM" ? ` ${armor.book} p.${armor.page}, Advanced rules.` : ""}
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/equipment`} className="btn btn-primary pull-right btn-sm">
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

interface IChassisProps {
    appGlobals: IAppGlobals;
}
