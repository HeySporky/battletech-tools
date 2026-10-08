import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft } from "react-icons/fa";
import { IAppGlobals } from '../../../app-router';
import BattleArmorCreatorSideMenu from '../../../components/battle-armor-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;

export default class BattleArmorCreatorSummary extends React.Component<ISummaryProps> {
    constructor(props: ISummaryProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Summary | Battle Armor Creator");
    }

    render = (): JSX.Element => {
        const suit = this.props.appGlobals.currentBattleArmor;
        if (!suit) return <></>;
        const issues = suit.getIssues();
        const notes = suit.getNotes();
        const capabilities = suit.getCapabilities();
        const weightClass = suit.getWeightClass();

        return (
            <UIPage current="classic-battletech-battle-armor-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <BattleArmorCreatorSideMenu appGlobals={this.props.appGlobals} current="summary" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`Summary: ${suit.getDisplayName()}`}>
                            {issues.length === 0 ? (
                                <p data-testid="ba-legal"><strong>This suit is legal under the TechManual construction rules.</strong></p>
                            ) : (
                                <>
                                    <p className="color-red"><strong>This suit is not legal yet:</strong></p>
                                    <ul className="color-red" data-testid="ba-summary-issues">
                                        {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                    </ul>
                                </>
                            )}

                            <p data-testid="ba-summary">
                                <strong>Type</strong>: {weightClass.name} battle armor, {suit.isQuad() ? "quad" : "humanoid"} &nbsp;|&nbsp;
                                <strong>Tech</strong>: {suit.isClan() ? "Clan" : "Inner Sphere"} &nbsp;|&nbsp;
                                <strong>Troopers</strong>: {suit.getSquadSize()} &nbsp;|&nbsp;
                                <strong>Battle Value</strong>: {suit.getBattleValue()} ({suit.getSuitBattleValue()} a suit) &nbsp;|&nbsp;
                                <strong>Cost</strong>: {suit.getCBillCost().toLocaleString("en-US")} C-bills ({suit.getSuitCost().toLocaleString("en-US")} a suit)
                            </p>
                            <p>
                                <strong>Weight</strong>: {suit.getWeight()} of {weightClass.maxWeight} kg &nbsp;|&nbsp;
                                <strong>Movement</strong>: {suit.getMovementText()} &nbsp;|&nbsp;
                                <strong>Armor</strong>: {suit.getArmorPoints()} points of {suit.getArmor().name}, and the trooper
                            </p>
                            <p>
                                <strong>Swarm attacks</strong>: {capabilities.swarm ? "Yes" : "No"} &nbsp;|&nbsp;
                                <strong>Leg attacks</strong>: {capabilities.leg ? "Yes" : "No"} &nbsp;|&nbsp;
                                <strong>Mechanized battle armor</strong>: {capabilities.mechanized ? "Yes" : "No"} &nbsp;|&nbsp;
                                <strong>Gunnery</strong>: {suit.getGunnery()} &nbsp;|&nbsp;
                                <strong>Anti-'Mech</strong>: {suit.getAntiMechSkill()} &nbsp;|&nbsp;
                                <strong>Skill-Adjusted Battle Value</strong>: {suit.getSkillAdjustedBattleValue()} (x {suit.getSkillMultiplier().toFixed(2)})
                            </p>
                            {capabilities.notes.length + notes.length > 0 ? (
                                <ul className="smaller-text">
                                    {[...capabilities.notes, ...notes].map((note, index) => <li key={index}>{note}</li>)}
                                </ul>
                            ) : null}

                            <h3>Weight</h3>
                            <table className="table" data-testid="ba-weight-log">
                                <tbody>
                                    {suit.getWeightLog().map((line, index) => <tr key={index}><td>{line.label}</td><td className="text-right">{line.kg} kg</td></tr>)}
                                    <tr><th>Total</th><th className="text-right">{suit.getWeight()} kg</th></tr>
                                </tbody>
                            </table>

                            <h3>Battle Value Calculation</h3>
                            <ul data-testid="ba-bv-log">
                                {suit.getBattleValueLog().map((line, index) => <li key={index}>{line}</li>)}
                            </ul>
                            <p className="smaller-text">
                                TechManual pp. 310-311, for Gunnery 4 and Anti-'Mech 5; the Speed Factor, Defensive Factors and Unit Size
                                Modifier tables are on p. 316 and the skill multiplier on p. 315.
                            </p>

                            <h3>Cost Calculation</h3>
                            <ul data-testid="ba-cost-log">
                                {suit.getCBillCostLog().map((line, index) => <li key={index}>{line}</li>)}
                            </ul>
                            <p className="smaller-text">
                                TechManual pp. 276, 281 and 296-298. Missile launchers are priced by the tube, a one-shot launcher at half;
                                ammunition is not part of a unit's cost. The squad support weapon is bought once for the squad.
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/record-sheet`} className="btn btn-primary pull-right btn-sm">View Record Sheet</Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/equipment`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface ISummaryProps {
    appGlobals: IAppGlobals;
}
