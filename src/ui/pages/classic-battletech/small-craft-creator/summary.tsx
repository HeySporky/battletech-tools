import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft } from "react-icons/fa";
import { IAppGlobals } from '../../../app-router';
import SanitizedHTML from '../../../components/sanitized-html';
import SmallCraftAlphaStrikeCard from '../../../components/small-craft-as-card';
import SmallCraftCreatorSideMenu from '../../../components/small-craft-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;

export default class SmallCraftCreatorSummary extends React.Component<ISummaryProps> {
    constructor(props: ISummaryProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Summary | Small Craft Creator");
    }

    render = (): JSX.Element => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (!craft) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const issues = craft.getIssues(rulesLevel);
        const notes = craft.getNotes();
        const alphaStrike = craft.getAlphaStrikeStats();
        const required = craft.getRequiredRulesLevel();

        return (
            <UIPage current="classic-battletech-small-craft-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <SmallCraftCreatorSideMenu appGlobals={this.props.appGlobals} current="summary" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`Summary: ${`${craft.getName()} ${craft.getModel()}`.trim() || "Small Craft"}`}>
                            {issues.length === 0 ? (
                                <p data-testid="sc-legal"><strong>This Small Craft is legal under the construction rules.</strong></p>
                            ) : (
                                <>
                                    <p className="color-red"><strong>This Small Craft is not legal yet:</strong></p>
                                    <ul className="color-red" data-testid="sc-summary-issues">
                                        {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                    </ul>
                                </>
                            )}

                            <p data-testid="sc-summary">
                                <strong>Type</strong>: {craft.getShapeName()} Small Craft, {craft.getTonnage()} tons &nbsp;|&nbsp;
                                <strong>Tech</strong>: {craft.getTech().name} &nbsp;|&nbsp;
                                <strong>Era</strong>: {craft.getEra().name} &nbsp;|&nbsp;
                                <strong>Battle Value</strong>: {craft.getBattleValue()} &nbsp;|&nbsp;
                                <strong>Cost</strong>: {craft.getCBillCost().toLocaleString("en-US")} C-bills
                            </p>
                            <p>
                                <strong>Thrust</strong>: {craft.getSafeThrust()} safe / {craft.getMaxThrust()} max &nbsp;|&nbsp;
                                <strong>Structural Integrity</strong>: {craft.getStructuralIntegrity()} &nbsp;|&nbsp;
                                <strong>Armor</strong>: {craft.getTotalArmorPoints()} points of {craft.getArmorType().name} &nbsp;|&nbsp;
                                <strong>Heat sinks</strong>: {craft.getTotalHeatSinks()} {craft.getHeatSinkType().name} &nbsp;|&nbsp;
                                <strong>Fuel</strong>: {craft.getFuelPoints()} points &nbsp;|&nbsp;
                                <strong>Crew</strong>: {craft.getCrew()}, passengers {craft.getPassengers()} &nbsp;|&nbsp;
                                <strong>Rules level needed</strong>: {required <= 2 ? "Standard" : required === 3 ? "Advanced" : "Experimental"}
                            </p>
                            {notes.length > 0 ? (
                                <ul className="smaller-text" data-testid="sc-notes">
                                    {notes.map((note, index) => <li key={index}>{note}</li>)}
                                </ul>
                            ) : null}

                            <h3>Weight</h3>
                            <table className="table" data-testid="sc-weight-log">
                                <tbody>
                                    {craft.getWeights().map((entry, index) => (
                                        <tr key={index}><td>{entry.name}</td><td className="text-right">{entry.weight} tons</td></tr>
                                    ))}
                                    <tr><th>Total</th><th className="text-right">{craft.getCurrentTonnage()} of {craft.getTonnage()} tons</th></tr>
                                </tbody>
                            </table>

                            <h3>Battle Value Calculation</h3>
                            <SanitizedHTML raw={true} html={craft.getBattleValueLog()} />
                            <p className="smaller-text">
                                TechManual pp. 311-313: a Small Craft is worked as a fighter is, with a Unit Type Modifier of 1.0
                                (p. 316). Rear-facing wing weapons on an aerodyne craft count as rear-firing.
                            </p>

                            <h3>Cost Calculation</h3>
                            <SanitizedHTML raw={true} html={craft.getCBillCostLog()} />
                            <p className="smaller-text">
                                TechManual pp. 283-285. Quarters are paid for through life support, and standard cargo space is free.
                            </p>

                            <h3>Alpha Strike</h3>
                            <SmallCraftAlphaStrikeCard craft={craft} />
                            <SanitizedHTML raw={true} html={alphaStrike.calcLog} />
                            <p className="smaller-text">
                                Converted as a large aerospace unit under the Alpha Strike Companion (pp. 92-102, 115-116, 144) with
                                its errata v1.6: four firing arcs, each with its own damage. A published Small Craft should use its
                                Master Unit List card; those cards run a few points higher than the Companion's formula gives.
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/record-sheet`} className="btn btn-primary pull-right btn-sm">View Record Sheet</Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/print-as`} className="btn btn-primary pull-right btn-sm">View Alpha Strike Card</Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/crew`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
