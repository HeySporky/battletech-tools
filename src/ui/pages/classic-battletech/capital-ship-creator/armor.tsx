import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import CapitalShip from '../../../../classes/capital-ship';
import { ADVANCED_AEROSPACE_FACINGS } from '../../../../data/advanced-aerospace-construction';
import { IAppGlobals } from '../../../app-router';
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
import InputNumeric from "../../../components/form_elements/input_numeric";
import NumberField from "./_numberField";
import { CapitalShipCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import CapitalShipStatusBar from './_statusBar';
import { unitRulesLevel } from '../../../components/game-settings-block';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

export default class CapitalShipCreatorArmor extends React.Component<IArmorProps> {
    constructor(props: IArmorProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Steps 3-4 | JumpShip and WarShip Creator");
    }

    update = (change: (ship: CapitalShip) => void): void => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (ship) {
            change(ship);
            this.props.appGlobals.saveCurrentCapitalShip(ship);
        }
    }

    render = (): JSX.Element => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (!ship) return <></>;
        const rulesLevel = unitRulesLevel(this.props.appGlobals.currentCapitalShip, this.props.appGlobals.appSettings);
        const unallocated = ship.getUnallocatedArmorPoints();

        return (
            <UIPage current="classic-battletech-capital-ship-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <CapitalShipCreatorSideMenu appGlobals={this.props.appGlobals} current="armor" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <CapitalShipStatusBar ship={ship} rulesLevel={rulesLevel} />
                        <TextSection label="Step 3: Add Heat Sinks">
                            <label>
                                Heat Sink Type:
                                <select value={ship.getHeatSinkType().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setHeatSinkType(value)); }}>
                                    {ship.getAvailableHeatSinkTypes(rulesLevel)
                                        .filter((option) => isOptionShown(option, option.tag === ship.getHeatSinkType().tag))
                                        .map((option) => <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>)}
                                </select>
                            </label>
                            <NumberField
                                label={`Additional Heat Sinks (1 ton each; ${ship.getFreeHeatSinks()} come free with the drive)`}
                                value={ship.getAdditionalHeatSinks()}
                                min={0}
                                max={ship.getTonnage()}
                                step={1}
                                setValue={(count) => this.update((s) => s.setAdditionalHeatSinks(count))}
                            />
                            <p>
                                <strong>Heat Sinks</strong>: {ship.getTotalHeatSinks()} &nbsp;|&nbsp;
                                <strong>Dissipation</strong>: {ship.getHeatDissipation()} &nbsp;|&nbsp;
                                <strong>Hottest weapon bay</strong>: <span className={ship.getHottestBayHeat() > ship.getHeatDissipation() ? "color-red" : ""}>{ship.getHottestBayHeat()}</span>
                            </p>
                            <p className="smaller-text">
                                Free heat sinks: 45 + the square root of the drive's tons x 2, rounded down (SO:AA p.139). The sinks must
                                cover at least the hottest single weapon bay (p.142); here an arc's weapons of one class share a bay,
                                split only where they pass 70 capital (700 standard) damage.
                            </p>
                        </TextSection>

                        <TextSection label="Step 4: Add Armor">
                            <label>
                                Armor Type:
                                <select value={ship.getArmorType().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setArmorType(value)); }}>
                                    {ship.getAvailableArmorTypes(rulesLevel)
                                        .filter((option) => isOptionShown(option, option.tag === ship.getArmorType().tag))
                                        .map((option) => <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>)}
                                </select>
                            </label>
                            <InputNumeric
                                label={`Armor (tons; up to ${ship.getMaxArmorTons().toLocaleString("en-US")})`}
                                value={ship.getArmorTons()}
                                min={0}
                                max={ship.getMaxArmorTons()}
                                step={0.5}
                                setValue={(value) => this.update((s) => s.setArmorTons(value))}
                            />
                            <p>
                                <strong>Capital Points per Ton</strong>: {ship.getArmorPointsPerTon() ?? "not available"} &nbsp;|&nbsp;
                                <strong>Bought</strong>: {ship.getPurchasedArmorPoints()} &nbsp;|&nbsp;
                                <strong>Free on each facing</strong>: {ship.getFreeArmorPerFacing()} &nbsp;|&nbsp;
                                <strong>To Allocate</strong>: <span data-testid="cs-armor-unallocated" className={unallocated < 0 ? "color-red" : ""}>{unallocated}</span>
                            </p>
                            <p className="smaller-text">
                                Most armor: the structure's weight / {ship.isWarShip() ? "50" : ship.isSpaceStation() ? "3, plus 60 tons" : "12"}, rounded down to the half ton.
                                Points are capital-scale, rounded down; each facing also gets Structural Integrity / 10 points free (SO:AA p.140).
                            </p>
                            <table className="table">
                                <thead>
                                    <tr><th>Facing</th><th>Bought Points</th><th>Total with Free</th></tr>
                                </thead>
                                <tbody>
                                    {ADVANCED_AEROSPACE_FACINGS.map((facing) => (
                                        <tr key={facing}>
                                            <td>{ship.getFacingName(facing)}</td>
                                            <td>
                                                <NumberField
                                                    label={ship.getFacingName(facing)}
                                                    value={ship.getArmorAllocation()[facing]}
                                                    min={0}
                                                    max={ship.getPurchasedArmorPoints()}
                                                    step={1}
                                                    setValue={(points) => this.update((s) => s.setArmorAllocation(facing, points))}
                                                />
                                            </td>
                                            <td>{ship.getFacingArmor(facing)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button className="btn btn-primary btn-sm" data-testid="cs-armor-spread" onClick={() => this.update((s) => s.allocateArmorEvenly())}>Spread the Points</button>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/equipment`} className="btn btn-primary pull-right btn-sm">Next: Weapons <ArrowCircleRight /></Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/chassis`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
