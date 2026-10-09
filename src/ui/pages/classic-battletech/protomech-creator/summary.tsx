import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft } from "react-icons/fa";
import { IAppGlobals } from '../../../app-router';
import ProtoMechCreatorSideMenu from '../../../components/protomech-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;

export default class ProtoMechCreatorSummary extends React.Component<ISummaryProps> {
    constructor(props: ISummaryProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Summary | ProtoMech Creator");
    }

    render = (): JSX.Element => {
        const proto = this.props.appGlobals.currentProtoMech;
        if (!proto) return <></>;
        const issues = proto.getIssues();
        const notes = proto.getNotes();
        const point = proto.getPointSize();

        return (
            <UIPage current="classic-battletech-protomech-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <ProtoMechCreatorSideMenu appGlobals={this.props.appGlobals} current="summary" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`Summary: ${proto.getDisplayName()}`}>
                            {issues.length === 0 ? (
                                <p data-testid="pm-legal"><strong>This ProtoMech is legal under the construction rules.</strong></p>
                            ) : (
                                <>
                                    <p className="color-red"><strong>This ProtoMech is not legal yet:</strong></p>
                                    <ul className="color-red" data-testid="pm-summary-issues">
                                        {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                    </ul>
                                </>
                            )}

                            <p data-testid="pm-summary">
                                <strong>Type</strong>: {proto.getWeightClassName()} ProtoMech, {proto.getTons()} tons, {proto.getChassisName()} &nbsp;|&nbsp;
                                <strong>Tech</strong>: {proto.getTechName()} &nbsp;|&nbsp;
                                <strong>Era</strong>: {proto.getEra().name} &nbsp;|&nbsp;
                                <strong>Battle Value</strong>: {proto.getBattleValue()}{point > 1 ? ` (Point of ${point}: ${proto.getPointBattleValue()})` : ""} &nbsp;|&nbsp;
                                <strong>Cost</strong>: {proto.getCBillCost().toLocaleString("en-US")} C-bills{point > 1 ? ` (Point: ${proto.getPointCBillCost().toLocaleString("en-US")})` : ""}
                            </p>
                            <p>
                                <strong>Weight</strong>: {proto.getWeight()} of {proto.getMaxWeight()} kg &nbsp;|&nbsp;
                                <strong>Movement</strong>: {proto.getMovementText()} &nbsp;|&nbsp;
                                <strong>Engine Rating</strong>: {proto.getInstalledEngineRating()} &nbsp;|&nbsp;
                                <strong>Armor</strong>: {proto.getTotalArmor()} points of {proto.getArmorTypeName()} &nbsp;|&nbsp;
                                <strong>Structure</strong>: {proto.getTotalStructure()} points &nbsp;|&nbsp;
                                <strong>Heat sinks</strong>: {proto.getHeatSinks()}
                            </p>
                            <p>
                                <strong>Gunnery</strong>: {proto.getGunnery()} &nbsp;|&nbsp;
                                <strong>Skill-Adjusted Battle Value</strong>: {proto.getSkillAdjustedBattleValue()} (x {proto.getSkillMultiplier().toFixed(2)}){point > 1 ? `, Point ${proto.getSkillAdjustedPointBattleValue()}` : ""} &nbsp;|&nbsp;
                                <strong>Frenzy attack</strong>: {proto.getFrenzyDamage()} damage &nbsp;|&nbsp;
                                <strong>Rules level needed</strong>: {proto.getRequiredRulesLevel() <= 2 ? "Standard" : proto.getRequiredRulesLevel() === 3 ? "Advanced" : "Experimental"}
                            </p>
                            {notes.length > 0 ? (
                                <ul className="smaller-text">
                                    {notes.map((note, index) => <li key={index}>{note}</li>)}
                                </ul>
                            ) : null}

                            <h3>Weight</h3>
                            <table className="table" data-testid="pm-weight-log">
                                <tbody>
                                    {proto.getWeightLog().map((line, index) => <tr key={index}><td>{line.label}</td><td className="text-right">{line.kg} kg</td></tr>)}
                                    <tr><th>Total</th><th className="text-right">{proto.getWeight()} kg</th></tr>
                                </tbody>
                            </table>

                            <h3>Battle Value Calculation</h3>
                            <ul data-testid="pm-bv-log">
                                {proto.getBattleValueLog().map((line, index) => <li key={index}>{line}</li>)}
                            </ul>
                            <p className="smaller-text">
                                TechManual pp. 306-307, for Gunnery 4; the Speed Factor and Defensive Factors tables are on p. 316 and the
                                skill multiplier on p. 315. A myomer booster adds 1 to the speed factor's MP and counts at its boosted
                                Running MP toward the Defensive Factor.
                            </p>

                            <h3>Cost Calculation</h3>
                            <ul data-testid="pm-cost-log">
                                {proto.getCBillCostLog().map((line, index) => <li key={index}>{line}</li>)}
                            </ul>
                            <p className="smaller-text">
                                TechManual pp. 279, 283 and 285; Ultraheavy, Quad and Glider components from IO:AE p. 215. Missile launchers are
                                priced by the tube except at the standard rack sizes; ammunition is not part of a unit's cost.
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/protomech-creator/record-sheet`} className="btn btn-primary pull-right btn-sm">View Record Sheet</Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/protomech-creator/equipment`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
