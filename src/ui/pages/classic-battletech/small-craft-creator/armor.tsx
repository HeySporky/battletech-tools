import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import SmallCraft from '../../../../classes/small-craft';
import { SMALL_CRAFT_FACINGS } from '../../../../data/small-craft-construction';
import { IAppGlobals } from '../../../app-router';
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
import InputNumeric from "../../../components/form_elements/input_numeric";
import SmallCraftCreatorSideMenu from '../../../components/small-craft-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import SmallCraftStatusBar from './_statusBar';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

export default class SmallCraftCreatorArmor extends React.Component<IArmorProps> {
    constructor(props: IArmorProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Steps 3-4 | Small Craft Creator");
    }

    update = (change: (craft: SmallCraft) => void): void => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (craft) {
            change(craft);
            this.props.appGlobals.saveCurrentSmallCraft(craft);
        }
    }

    render = (): JSX.Element => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (!craft) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const unallocated = craft.getUnallocatedArmorPoints();
        const thresholds = craft.getDamageThresholds();

        return (
            <UIPage current="classic-battletech-small-craft-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <SmallCraftCreatorSideMenu appGlobals={this.props.appGlobals} current="armor" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <SmallCraftStatusBar craft={craft} rulesLevel={rulesLevel} />
                        <TextSection label="Step 3: Add Armor">
                            <label>
                                Armor Type:
                                <select value={craft.getArmorType().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((c) => c.setArmorType(value)); }}>
                                    {craft.getAvailableArmorTypes(rulesLevel)
                                        .filter((option) => isOptionShown(option, option.tag === craft.getArmorType().tag))
                                        .map((option) => (
                                            <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
                                        ))}
                                </select>
                            </label>
                            <InputNumeric
                                label={`Armor (tons; up to ${craft.getMaxArmorTons()})`}
                                value={craft.getArmorTons()}
                                min={0}
                                max={craft.getMaxArmorTons()}
                                step={0.5}
                                setValue={(tons) => this.update((c) => c.setArmorTons(tons))}
                            />
                            <p>
                                <strong>Points per Ton</strong>: {craft.getArmorPointsPerTon() ?? "not available"} &nbsp;|&nbsp;
                                <strong>Bought</strong>: {craft.getPurchasedArmorPoints()} &nbsp;|&nbsp;
                                <strong>Free from the Structure</strong>: {craft.getBonusArmorPoints()} &nbsp;|&nbsp;
                                <strong>To Allocate</strong>: <span data-testid="sc-armor-unallocated" className={unallocated < 0 ? "color-red" : ""}>{unallocated}</span>
                            </p>
                            <p className="smaller-text">
                                The most armor is Structural Integrity x {craft.isAerodyne() ? "4.5" : "3.6"} tons. The structure adds
                                its Structural Integrity in free points for each of the four facings; how the points are shared out
                                is up to the designer (TM pp. 191-192).
                            </p>

                            <table className="table">
                                <thead>
                                    <tr><th>Facing</th><th>Armor Points</th><th>Damage Threshold</th></tr>
                                </thead>
                                <tbody>
                                    {SMALL_CRAFT_FACINGS.map((facing) => (
                                        <tr key={facing}>
                                            <td>{craft.getFacingName(facing)}</td>
                                            <td>
                                                <InputNumeric
                                                    label={craft.getFacingName(facing)}
                                                    value={craft.getArmorAllocation()[facing]}
                                                    min={0}
                                                    max={craft.getAvailableArmorPoints()}
                                                    step={1}
                                                    setValue={(points) => this.update((c) => c.setArmorAllocation(facing, points))}
                                                />
                                            </td>
                                            <td>{thresholds[facing]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button className="btn btn-primary btn-sm" data-testid="sc-armor-spread" onClick={() => this.update((c) => c.allocateArmorEvenly())}>Spread the Points</button>
                            &nbsp;
                            <button className="btn btn-primary btn-sm" onClick={() => this.update((c) => c.clearArmor())}>Clear</button>
                            <p className="smaller-text">
                                A single hit that does more than a facing's Damage Threshold, a tenth of its armor, may cause a
                                critical hit (TW p. 239).
                            </p>
                        </TextSection>

                        <TextSection label="Step 4: Add Heat Sinks">
                            <label>
                                Heat Sink Type:
                                <select value={craft.getHeatSinkType().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((c) => c.setHeatSinkType(value)); }}>
                                    {craft.getAvailableHeatSinkTypes(rulesLevel)
                                        .filter((option) => isOptionShown(option, option.tag === craft.getHeatSinkType().tag))
                                        .map((option) => (
                                            <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
                                        ))}
                                </select>
                            </label>
                            <InputNumeric
                                label={`Additional Heat Sinks (1 ton each; ${craft.getFreeHeatSinks()} come free with the engine)`}
                                value={craft.getAdditionalHeatSinks()}
                                min={0}
                                max={200}
                                step={1}
                                setValue={(count) => this.update((c) => c.setAdditionalHeatSinks(count))}
                            />
                            <p>
                                <strong>Heat Sinks</strong>: {craft.getTotalHeatSinks()} &nbsp;|&nbsp;
                                <strong>Dissipation</strong>: {craft.getHeatDissipation()} &nbsp;|&nbsp;
                                <strong>Weapon Heat</strong>: {craft.getWeaponHeat()}
                            </p>
                            <p className="smaller-text">
                                Free heat sinks: engine tons / 60 on an aerodyne craft, the square root of engine tons x 1.6 on a
                                spheroid, rounded down (TM p. 193). A Small Craft tracks heat as a fighter does and may fire past its
                                heat sinks.
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/equipment`} className="btn btn-primary pull-right btn-sm">Next: Weapons <ArrowCircleRight /></Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/chassis`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
