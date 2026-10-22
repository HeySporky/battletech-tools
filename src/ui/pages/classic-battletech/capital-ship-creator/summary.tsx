import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft } from "react-icons/fa";
import { IAppGlobals } from '../../../app-router';
import SanitizedHTML from '../../../components/sanitized-html';
import CapitalShipCreatorSideMenu from '../../../components/capital-ship-creator-side-menu';
import CapitalShipAlphaStrikeCard from '../../../components/capital-ship-as-card';
import QuirkPicker from '../../../components/quirk-picker';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;

export default class CapitalShipCreatorSummary extends React.Component<ISummaryProps> {
    constructor(props: ISummaryProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Summary | JumpShip and WarShip Creator");
    }

    render = (): JSX.Element => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (!ship) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const issues = ship.getIssues(rulesLevel);
        const notes = ship.getNotes();
        const typeName = ship.getShipTypeName();

        return (
            <UIPage current="classic-battletech-capital-ship-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <CapitalShipCreatorSideMenu appGlobals={this.props.appGlobals} current="summary" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`Summary: ${`${ship.getName()} ${ship.getModel()}`.trim() || typeName}`}>
                            {issues.length === 0 ? (
                                <p data-testid="cs-legal"><strong>This {typeName} is legal under the construction rules.</strong></p>
                            ) : (
                                <>
                                    <p className="color-red"><strong>This {typeName} is not legal yet:</strong></p>
                                    <ul className="color-red" data-testid="cs-summary-issues">
                                        {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                    </ul>
                                </>
                            )}
                            <p data-testid="cs-summary">
                                <strong>Type</strong>: {typeName}, {ship.getTonnage().toLocaleString("en-US")} tons &nbsp;|&nbsp;
                                <strong>Tech</strong>: {ship.getTech().name} &nbsp;|&nbsp;
                                <strong>Era</strong>: {ship.getEra().name} &nbsp;|&nbsp;
                                <strong>Cost</strong>: {ship.getCBillCost().toLocaleString("en-US")} C-bills &nbsp;|&nbsp;
                                <strong>Battle Value</strong>: <span data-testid="cs-bv">{ship.getBattleValue().toLocaleString("en-US")}</span>
                            </p>
                            <p>
                                <strong>Thrust</strong>: {ship.isWarShip() ? `${ship.getSafeThrust()} safe / ${ship.getMaxThrust()} max` : "station-keeping"} &nbsp;|&nbsp;
                                <strong>Structural Integrity</strong>: {ship.getStructuralIntegrity()} &nbsp;|&nbsp;
                                {ship.hasKFDrive() ? <><strong>K-F Integrity</strong>: {ship.getKFDriveIntegrity()}, <strong>Sail</strong>: {ship.getJumpSailIntegrity()} &nbsp;|&nbsp;</> : null}
                                <strong>Heat sinks</strong>: {ship.getTotalHeatSinks()} {ship.getHeatSinkType().name} &nbsp;|&nbsp;
                                <strong>Fuel</strong>: {ship.getFuelPoints().toLocaleString("en-US")} points &nbsp;|&nbsp;
                                <strong>Crew</strong>: {ship.getCrew()} ({ship.getOfficers()} officers), marines {ship.getMarines()}, passengers {ship.getPassengers()}
                            </p>
                            {notes.length > 0 ? (
                                <ul className="smaller-text" data-testid="cs-notes">
                                    {notes.map((note, index) => <li key={index}>{note}</li>)}
                                </ul>
                            ) : null}

                            <h3>Weight</h3>
                            <table className="table" data-testid="cs-weight-log">
                                <tbody>
                                    {ship.getWeights().map((entry, index) => (
                                        <tr key={index}><td>{entry.name}</td><td className="text-right">{entry.weight.toLocaleString("en-US")} tons</td></tr>
                                    ))}
                                    <tr><th>Total</th><th className="text-right">{ship.getCurrentTonnage().toLocaleString("en-US")} of {ship.getTonnage().toLocaleString("en-US")} tons</th></tr>
                                </tbody>
                            </table>

                            <QuirkPicker
                                quirks={ship.quirks}
                                unitType={ship.getQuirkUnitType()}
                                editionTag={ship.getRulesEdition()}
                                rulesLevel={this.props.appGlobals.appSettings.mechRulesFilter}
                                {...ship.getQuirkTargets()}
                                onChange={() => this.props.appGlobals.saveCurrentCapitalShip(ship)}
                            />

                            <h3>Battle Value Calculation</h3>
                            <SanitizedHTML raw={true} html={ship.getBattleValueLog()} />
                            <p className="smaller-text">
                                Strategic Operations: Advanced Aerospace Rules pp.148-149, on TechManual pp.311-313. Weapons are rated by
                                firing arc; where the book leaves a choice open (a tie, or which heat counts for the arc opposite the front)
                                MegaMek's reading is used, and the adjacent arc's heat counts with the front's, as p.149 words it.
                            </p>

                            <h3>Cost Calculation</h3>
                            <SanitizedHTML raw={true} html={ship.getCBillCostLog()} />
                            <p className="smaller-text">
                                Strategic Operations: Advanced Aerospace Rules p.146. A JumpShip or station has no Safe Thrust; its drive-unit
                                line is priced at station-keeping thrust. Quarters are paid for through life support.
                            </p>

                            <h3>Alpha Strike</h3>
                            <CapitalShipAlphaStrikeCard ship={ship} />
                            <SanitizedHTML raw={true} html={ship.getAlphaStrikeStats().calcLog} />
                            <p className="smaller-text">
                                Alpha Strike Companion pp.91-117 and 144, with errata v1.6. Fore-side arcs join a WarShip's Front as p.103 says;
                                the published WarShip cards split them between the Front and the broadsides, and round the Threshold
                                normally where p.95 rounds up. Space stations use the JumpShip's four arcs, as their cards and MegaMek do.
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/record-sheet`} className="btn btn-primary pull-right btn-sm">View Record Sheet</Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/print-as`} className="btn btn-primary pull-right btn-sm">View Alpha Strike Card</Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/crew`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
