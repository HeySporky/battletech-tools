import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft } from "react-icons/fa";
import { IAppGlobals } from '../../../app-router';
import { WalkerCreatorSideMenu } from '../../../components/creator-side-menus';
import CalcBreakdown from '../../../components/calc-breakdown';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { formatBattleValue } from '../../../../data/battle-value';
import { btRulesEditions } from '../../../../data/rules-editions';
const ArrowCircleLeft = FaArrowCircleLeft as any;

export default class WalkerCreatorSummary extends React.Component<ISummaryProps> {
    constructor(props: ISummaryProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Summary | Walker Creator");
    }

    render = (): JSX.Element => {
        const walker = this.props.appGlobals.currentWalker;
        if (!walker) return <></>;
        const issues = walker.getIssues();
        const jump = walker.getJumpMP();
        const equipment = walker.getEquipment();

        return (
            <UIPage current="classic-battletech-walker-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <WalkerCreatorSideMenu appGlobals={this.props.appGlobals} current="summary" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`Summary: ${walker.getDisplayName()}`}>
                            {issues.length === 0 ? (
                                <p data-testid="walker-legal"><strong>This Walker is legal under {walker.getEditionRules().name}.</strong></p>
                            ) : (
                                <>
                                    <p className="color-red"><strong>This Walker is not legal yet:</strong></p>
                                    <ul className="color-red" data-testid="walker-summary-issues">
                                        {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                    </ul>
                                </>
                            )}

                            <p data-testid="walker-summary">
                                <strong>Type</strong>: {walker.getTons()}-ton {walker.isIndustrial() ? "industrial " : ""}Walker (fan-made, Custom Homebrew) &nbsp;|&nbsp;
                                <strong>Printing</strong>: {walker.getEditionRules().name} &nbsp;|&nbsp;
                                <strong>Era</strong>: {walker.getEra().name} &nbsp;|&nbsp;
                                <strong>Battle Value</strong> (provisional): {formatBattleValue((edition) => walker.getBattleValue(edition), "walker", walker.getRulesEdition())} &nbsp;|&nbsp;
                                <strong>Cost</strong> (provisional): {walker.getCBillCost().toLocaleString("en-US")} C-bills
                            </p>
                            <p>
                                <strong>Weight</strong>: {walker.getWeight()} of {walker.getTons()} tons &nbsp;|&nbsp;
                                <strong>Movement</strong>: {walker.getWalkerWalkMP()}/{walker.getRunMP()}{jump > 0 ? `/${jump}` : ""} &nbsp;|&nbsp;
                                <strong>Engine</strong>: {walker.getEngineRating()} {walker.getEngineName()} &nbsp;|&nbsp;
                                <strong>Armor</strong>: {walker.getArmorPoints()} points &nbsp;|&nbsp;
                                <strong>Structure</strong>: {walker.getTotalStructure()} points &nbsp;|&nbsp;
                                <strong>Heat sinks</strong>: {walker.getHeatSinks()} &nbsp;|&nbsp;
                                <strong>Turret</strong>: {walker.hasTurret() ? `${walker.getTurretWeight()} tons` : "none"}
                            </p>
                            <p className="smaller-text">{walker.getCredit()}</p>

                            <h3>Weight</h3>
                            <table className="table" data-testid="walker-weight-log">
                                <tbody>
                                    {walker.getWeightLog().map((line, index) => <tr key={index}><td>{line.name}</td><td className="text-right">{line.weight} tons</td></tr>)}
                                    <tr><th>Total</th><th className="text-right">{walker.getWeight()} tons</th></tr>
                                </tbody>
                            </table>

                            <h3>Weapons and Equipment</h3>
                            <table className="table table-sm" data-testid="walker-equipment-list">
                                <tbody>
                                    {equipment.length === 0 ? <tr><td>Nothing mounted.</td></tr> : null}
                                    {equipment.map((each) => (
                                        <tr key={each.uuid}>
                                            <td>{each.name}</td>
                                            <td>{walker.getLocationName(each.location)}{each.inTurret ? " (turret)" : ""}{each.split ? ` and ${walker.getLocationName(each.split.location)}` : ""}</td>
                                            <td className="text-right">{each.weight} tons</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <h3>Battle Value and Cost Calculation</h3>
                            <p className="smaller-text" data-testid="walker-provisional">
                                No Battle Value or cost is published for a Walker. These are the BattleMech rules applied to a Walker (ours), and every step is
                                marked provisional; the turret mechanism costs 7,500 C-bills a ton (owner ruling, midway between the 'Mech and vehicle turrets).
                            </p>
                            <CalcBreakdown
                                battleValue={(edition) => walker.getBattleValueBreakdown(edition)}
                                cost={() => walker.getCostBreakdown()}
                                editions={btRulesEditions.filter((edition) => (edition.unitTypes ?? ["mech"]).includes("walker")).map((edition) => edition.tag)}
                                edition={walker.getRulesEdition()}
                            />

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/walker-creator/criticals`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
