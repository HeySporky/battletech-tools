import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import Walker from '../../../../classes/walker';
import { mechEngineTypes } from '../../../../data/mech-engine-types';
import { mechGyroTypes } from '../../../../data/mech-gyro-types';
import { getFutureWarsWeightClass } from '../../../../data/future-wars-construction';
import {
    WALKER_EDITIONS, WALKER_EDITION_RULES, WALKER_MAX_TONS, WALKER_MIN_TONS, WALKER_TON_STEP, WalkerEdition, WalkerLocation,
} from '../../../../data/walker-construction';
import { IAppGlobals } from '../../../app-router';
import InputField from "../../../components/form_elements/input_field";
import { WalkerCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import WalkerStatusBar from './_statusBar';
import { UnitGameSettingsBlock } from '../../../components/game-settings-block';
const ArrowCircleRight = FaArrowCircleRight as any;

const range = (from: number, to: number, step = 1): number[] => Array.from({ length: Math.max(0, Math.floor((to - from) / step) + 1) }, (_unused, index) => from + index * step);
const engineName = (tag: string): string => mechEngineTypes.find((type) => type.tag === tag)?.name ?? tag;
const gyroName = (tag: string): string => mechGyroTypes.find((type) => type.tag === tag)?.name ?? tag;
const JUMP_JET_NAMES: Record<string, string> = { standard: "Standard Jump Jets", improved: "Improved Jump Jets" };

export default class WalkerCreatorChassis extends React.Component<IChassisProps> {
    constructor(props: IChassisProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Steps 1-3 | Walker Creator");
    }

    // Every control changes the loaded Walker and saves it.
    update = (change: (walker: Walker) => void): void => {
        const walker = this.props.appGlobals.currentWalker;
        if (walker) {
            change(walker);
            this.props.appGlobals.saveCurrentWalker(walker);
        }
    }

    render = (): JSX.Element => {
        const walker = this.props.appGlobals.currentWalker;
        if (!walker) return <></>;
        const industrial = walker.isIndustrial();
        const editionRules = walker.getEditionRules();
        const variant = walker.usesVariantSlots();
        const heavy = getFutureWarsWeightClass(walker.getTons())?.tag === "heavy";
        const jumpTypes = walker.getJumpJetTypeOptions();

        return (
            <UIPage current="classic-battletech-walker-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <WalkerCreatorSideMenu appGlobals={this.props.appGlobals} current="chassis" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <WalkerStatusBar walker={walker} />
                        <TextSection label="Steps 1-3: Edition, Chassis, Engine and Armor">
                            <p className="smaller-text" data-testid="walker-credit">
                                <strong>Fan-made (Custom Homebrew).</strong> {walker.getCredit()}
                            </p>
                            <label>
                                Printing of the rules:
                                <select data-testid="walker-edition" value={walker.getEdition()} onChange={(e) => { const value = e.currentTarget.value as WalkerEdition; this.update((w) => w.setEdition(value)); }}>
                                    {WALKER_EDITIONS.map((edition) => <option key={edition} value={edition}>{WALKER_EDITION_RULES[edition].name}</option>)}
                                </select>
                            </label>
                            <p className="smaller-text" data-testid="walker-edition-text">
                                {editionRules.source}. Anti-infantry weapons in the center torso: base to-hit {editionRules.antiInfantryBaseToHit}.
                                Assault control section: {editionRules.assaultControlSlots} slots under the variant slot counts.
                            </p>
                            {/* The shared settings block decides what every field below offers (#324): rules level, tech base, era, rulesets. */}
                            <UnitGameSettingsBlock unitType="walker" unit={walker} appGlobals={this.props.appGlobals} onChange={() => this.update(() => undefined)} />
                            <p className="smaller-text" data-testid="walker-slots-text">
                                {variant
                                    ? "Slot counts: Flint's variant (a Future Wars construction ruleset is ticked)."
                                    : "Slot counts: the standard rules (each leg and outer torso 6, the center torso and control section 12). Tick a Future Wars construction ruleset above for Flint's variant counts."}
                            </p>

                            <InputField
                                label="Name (e.g. Mule MUL-4W)"
                                value={walker.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((w) => w.setName(value)); }}
                            />
                            <label>
                                <input type="checkbox" data-testid="walker-industrial" checked={industrial}
                                    onChange={(e) => { const value = e.currentTarget.checked; this.update((w) => w.setIndustrial(value)); }} />
                                &nbsp;Industrial walker (NGCFells's, inspired by Flint and the IndustrialMech rules)
                            </label>
                            {industrial ? (
                                <label>
                                    <input type="checkbox" data-testid="walker-afc" checked={walker.hasAdvancedFireControl()}
                                        onChange={(e) => { const value = e.currentTarget.checked; this.update((w) => w.setAdvancedFireControl(value)); }} />
                                    &nbsp;Advanced Fire Control
                                </label>
                            ) : null}
                            <label>
                                Tonnage:
                                <select data-testid="walker-tons" value={walker.getTons()} onChange={(e) => { const value = +e.currentTarget.value; this.update((w) => w.setTons(value)); }}>
                                    {range(WALKER_MIN_TONS, WALKER_MAX_TONS, WALKER_TON_STEP).map((tons) => <option key={tons} value={tons}>{tons} tons</option>)}
                                </select>
                            </label>
                            <p className="smaller-text">
                                Internal structure {walker.getStructureWeight()} tons ({walker.getTotalStructure()} points); cockpit {walker.getCockpitWeight()} tons
                                ({walker.getCockpitName()}); gyro {walker.getGyroWeight()} tons.
                            </p>

                            <label>
                                Engine:
                                <select data-testid="walker-engine" value={walker.getEngineType()} onChange={(e) => { const value = e.currentTarget.value; this.update((w) => w.setEngineType(value)); }}>
                                    {Array.from(new Set([...walker.getEngineTypeOptions(), walker.getEngineType()])).map((tag) => <option key={tag} value={tag}>{engineName(tag)}</option>)}
                                </select>
                            </label>
                            <label>
                                Walking MP (as a biped; the walker moves at x 1.25):
                                <select data-testid="walker-walk" value={walker.getWalkMP()} onChange={(e) => { const value = +e.currentTarget.value; this.update((w) => w.setWalkMP(value)); }}>
                                    {range(1, walker.getMaxWalkMP()).map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                                </select>
                            </label>
                            <p className="smaller-text" data-testid="walker-engine-text">
                                Walking MP on four legs {walker.getWalkerWalkMP()}, Running MP {walker.getRunMP()}. Engine rating {walker.getEngineRating()},
                                {" "}{walker.getEngineWeight()} tons.
                            </p>
                            <label>
                                Gyro:
                                <select data-testid="walker-gyro" value={walker.getGyroType()} onChange={(e) => { const value = e.currentTarget.value; this.update((w) => w.setGyroType(value)); }}>
                                    {Array.from(new Set([...walker.getGyroTypeOptions(), walker.getGyroType()])).map((tag) => <option key={tag} value={tag}>{gyroName(tag)}</option>)}
                                </select>
                            </label>

                            {variant ? (
                                <fieldset className="fieldset">
                                    <legend>Control section (Flint's variant)</legend>
                                    {heavy ? (
                                        <label>
                                            <input type="checkbox" data-testid="walker-large-cockpit" checked={walker.getLargeCockpit()}
                                                onChange={(e) => { const value = e.currentTarget.checked; this.update((w) => w.setLargeCockpit(value)); }} />
                                            &nbsp;The 4-ton cockpit (a few heavy 'Mechs)
                                        </label>
                                    ) : null}
                                    <label>
                                        <input type="checkbox" data-testid="walker-extra-sensors" checked={walker.hasExtraSensors()}
                                            onChange={(e) => { const value = e.currentTarget.checked; this.update((w) => w.setExtraSensors(value)); }} />
                                        &nbsp;Extra sensors (one more slot, half a ton)
                                    </label>
                                    <label>
                                        <input type="checkbox" data-testid="walker-extra-life-support" checked={walker.hasExtraLifeSupport()}
                                            onChange={(e) => { const value = e.currentTarget.checked; this.update((w) => w.setExtraLifeSupport(value)); }} />
                                        &nbsp;Extra life support (one more slot, half a ton)
                                    </label>
                                </fieldset>
                            ) : null}

                            <label>
                                Jump jets{jumpTypes.length === 0 ? " (this engine cannot lift them)" : ""}:
                                <select data-testid="walker-jump" disabled={jumpTypes.length === 0 && walker.getJumpJets() === 0} value={walker.getJumpJets()}
                                    onChange={(e) => { const value = +e.currentTarget.value; this.update((w) => w.setJumpJets(value)); }}>
                                    {range(0, Math.max(walker.getMaxJumpMP(), walker.getJumpJets())).map((jets) => <option key={jets} value={jets}>{jets}</option>)}
                                </select>
                            </label>
                            {jumpTypes.length > 1 ? (
                                <label>
                                    Jump jet type:
                                    <select data-testid="walker-jump-type" value={walker.getJumpJetType()} onChange={(e) => { const value = e.currentTarget.value; this.update((w) => w.setJumpJetType(value)); }}>
                                        {jumpTypes.map((tag) => <option key={tag} value={tag}>{JUMP_JET_NAMES[tag] ?? tag}</option>)}
                                    </select>
                                </label>
                            ) : null}
                            <p className="smaller-text">Jump jets are placed automatically in the legs and outer torsos (NGCFells's; Flint neither allows nor bans them).</p>

                            <h3>Armor</h3>
                            <p className="smaller-text" data-testid="walker-armor-text">
                                Standard armor, 16 points a ton; at most twice a location's structure. {walker.getArmorPoints()} points, {walker.getArmorWeight()} tons.
                            </p>
                            <table className="table table-sm" data-testid="walker-armor">
                                <thead>
                                    <tr><th>Location</th><th className="text-center">Structure</th><th className="text-center">Maximum</th><th className="text-center">Armor</th></tr>
                                </thead>
                                <tbody>
                                    {walker.getLocations().map((location: WalkerLocation) => (
                                        <tr key={location}>
                                            <td>{walker.getLocationName(location)}</td>
                                            <td className="text-center">{walker.getStructure(location)}</td>
                                            <td className="text-center">{walker.getMaxArmor(location)}</td>
                                            <td className="text-center">
                                                <input
                                                    type="number" min={0} max={walker.getMaxArmor(location)} style={{ width: "5em" }}
                                                    aria-label={`${walker.getLocationName(location)} armor`} data-testid={`walker-armor-${location}`}
                                                    value={walker.getArmor(location)}
                                                    onChange={(e) => { const value = +e.currentTarget.value; this.update((w) => w.setArmor(location, Number.isFinite(value) ? value : 0)); }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/walker-creator/equipment`} className="btn btn-primary pull-right btn-sm">
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
