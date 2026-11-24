import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import AerospaceFighter, { FIGHTER_ARCS, FighterArc } from '../../../../classes/aerospace-fighter';
import { IAppGlobals } from '../../../app-router';
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
import { FighterCreatorSideMenu } from '../../../components/creator-side-menus';
import InputNumeric from "../../../components/form_elements/input_numeric";
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { SUPPORT_VEHICLE_TECH_RATINGS } from '../../../../data/support-vehicle-construction';
import { unitRulesLevel } from '../../../components/game-settings-block';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

export default class FighterCreatorArmor extends React.Component<IArmorProps> {
    constructor(props: IArmorProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Step 2 | Fighter Creator");
    }

    update = (change: (fighter: AerospaceFighter) => void): void => {
        const fighter = this.props.appGlobals.currentFighter;
        if (fighter) {
            change(fighter);
            this.props.appGlobals.saveCurrentFighter(fighter);
        }
    }

    // Spread what is left of the maximum evenly, the remainder going to the nose first.
    allocateMax = (): void => {
        this.update((fighter) => {
            const max = fighter.getMaxArmorPoints();
            const each = Math.floor(max / FIGHTER_ARCS.length);
            FIGHTER_ARCS.forEach((arc, index) => fighter.setArmorAllocation(arc.tag, each + (index === 0 ? max - each * FIGHTER_ARCS.length : 0)));
        });
    }

    render = (): JSX.Element => {
        const fighter = this.props.appGlobals.currentFighter;
        if (!fighter) return <></>;
        const rulesLevel = unitRulesLevel(this.props.appGlobals.currentFighter, this.props.appGlobals.appSettings);
        const armor = fighter.getArmorAllocation();
        const remaining = fighter.getRemainingTonnage();
        const slots = fighter.getArmorType().fighterSlots;
        const over = fighter.getTotalArmorPoints() > fighter.getMaxArmorPoints();
        const patchwork = fighter.isPatchworkArmor();

        return (
            <UIPage current="classic-battletech-fighter-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <FighterCreatorSideMenu appGlobals={this.props.appGlobals} current="armor" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Step 2: Allocate Armor">
                            {fighter.isSupportVehicle() ? (
                                <>
                                    <label>
                                        Barrier Armor Rating (BAR):
                                        <select value={fighter.getBAR()} onChange={(e) => { const value = +e.currentTarget.value; this.update((f) => f.setBAR(value)); }}>
                                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => <option key={bar} value={bar}>BAR {bar}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        Armor Tech Rating:
                                        <select value={fighter.getSupportVehicleSettings()?.armorTechRating} onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setSupportTechRating("armor", value)); }}>
                                            {SUPPORT_VEHICLE_TECH_RATINGS.map((rating) => <option key={rating} value={rating}>{rating.toUpperCase()}</option>)}
                                        </select>
                                    </label>
                                    <p>
                                        <strong>Weight a Point</strong>: {fighter.getSupportArmorKgPerPoint() ?? "not made at this Tech Rating"} kg &nbsp;|&nbsp;
                                        <strong>Maximum</strong>: {fighter.getMaxArmorPoints()} points (TM p.134; TO:AUE p.69) &nbsp;|&nbsp;
                                        <strong>Armor Weight</strong>: {fighter.getArmorWeight()} t
                                    </p>
                                </>
                            ) : (<>
                            <label>
                                Armor Type:
                                <select value={fighter.getArmorType().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setArmorType(value)); }}>
                                    {fighter.getAvailableArmorTypes(rulesLevel)
                                        .filter((option) => isOptionShown(option, option.tag === fighter.getArmorType().tag))
                                        .map((option) => (
                                            <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
                                        ))}
                                </select>
                            </label>
                            <p>
                                {patchwork ? null : <><strong>Points per Ton</strong>: {fighter.getArmorPointsPerTon() ?? "n/a"} &nbsp;|&nbsp;</>}
                                <strong>Maximum</strong>: {fighter.getMaxArmorPoints()} points (tonnage x {fighter.getMaxArmorPointsPerTonOfFighter()}, TM p. 191)
                                {!patchwork && slots && slots.placement ? <> &nbsp;|&nbsp; <strong>Weapon slots given up</strong>: {slots.placement}</> : null}
                            </p>
                            {patchwork ? (
                                <p className="smaller-text" data-testid="patchwork-armor-note">
                                    Patchwork Armor (Advanced, TO:AUE p. 189): each arc takes its own armor type, weighed by the point and
                                    rounded up to the half ton per arc, and gives up that type's weapon slots in the arc.
                                </p>
                            ) : null}
                            </>)}

                            <div className="row">
                                {FIGHTER_ARCS.map((arc) => (
                                    <div className="col-6 col-md-3" key={arc.tag}>
                                        <InputNumeric
                                            label={arc.name}
                                            value={armor[arc.tag]}
                                            min={0}
                                            max={fighter.getMaxArmorPoints()}
                                            step={1}
                                            setValue={(points) => this.update((f) => f.setArmorAllocation(arc.tag as FighterArc, points))}
                                        />
                                        {patchwork ? (
                                            <div data-testid={`patchwork-armor-${arc.tag}`}>
                                                <label>
                                                    {arc.name} Armor Type:
                                                    <select value={fighter.getPatchworkArmorType(arc.tag).tag} onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setPatchworkArmorType(arc.tag, value)); }}>
                                                        {fighter.getAvailablePatchworkArmorTypes(rulesLevel)
                                                            .filter((option) => isOptionShown(option, option.tag === fighter.getPatchworkArmorType(arc.tag).tag))
                                                            .map((option) => (
                                                                <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
                                                            ))}
                                                    </select>
                                                </label>
                                                <div className="smaller-text">
                                                    {fighter.getPatchworkArcWeight(arc.tag)} tons
                                                    {fighter.getPatchworkArcSlots(arc.tag) > 0 ? `, ${fighter.getPatchworkArcSlots(arc.tag)} weapon slot${fighter.getPatchworkArcSlots(arc.tag) === 1 ? "" : "s"} given up` : ""}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>

                            <p className={over ? "color-red" : ""}>
                                <strong>Allocated</strong>: {fighter.getTotalArmorPoints()} points &nbsp;|&nbsp;
                                <strong>Armor Weight</strong>: {fighter.getArmorWeight()} tons
                                {patchwork ? null : <> &nbsp;|&nbsp; <strong>Paid for but unallocated</strong>: {Math.max(0, fighter.getUnallocatedArmorPoints())} points</>}
                            </p>
                            <p className={remaining < 0 ? "color-red" : ""}><strong>Remaining Tonnage</strong>: {remaining}</p>

                            <button className="btn btn-primary btn-sm" onClick={this.allocateMax}>Max Armor</button>
                            &nbsp;
                            <button className="btn btn-secondary btn-sm" onClick={() => this.update((f) => f.clearArmor())}>Clear Armor</button>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/equipment`} className="btn btn-primary pull-right btn-sm">
                                    Next: Weapons and Equipment <ArrowCircleRight />
                                </Link>
                                <div className="inline-block text-left">
                                    <Link to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/chassis`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
