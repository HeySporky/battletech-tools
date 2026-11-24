import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft } from "react-icons/fa";
import { IAppGlobals } from '../../../app-router';
import { BuildingCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { unitRulesLevel } from '../../../components/game-settings-block';
const ArrowCircleLeft = FaArrowCircleLeft as any;

export default class BuildingCreatorSummary extends React.Component<ISummaryProps> {
    constructor(props: ISummaryProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Summary | Building Creator");
    }

    render = (): JSX.Element => {
        const building = this.props.appGlobals.currentBuilding;
        if (!building) return <></>;
        const rulesLevel = unitRulesLevel(this.props.appGlobals.currentBuilding, this.props.appGlobals.appSettings);
        const issues = building.getIssues(rulesLevel);
        const notes = building.getNotes();
        const classification = building.getClassification();
        const generator = building.getGenerator();
        const weights = building.getWeights();

        return (
            <UIPage current="classic-battletech-building-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <BuildingCreatorSideMenu appGlobals={this.props.appGlobals} current="summary" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`Summary: ${building.getName() || classification.name}`}>
                            {issues.length === 0 ? (
                                <p><strong>This building is legal under the Tactical Operations construction rules.</strong></p>
                            ) : (
                                <>
                                    <p className="color-red"><strong>This building is not legal yet:</strong></p>
                                    <ul className="color-red">
                                        {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                    </ul>
                                </>
                            )}

                            <p data-testid="building-summary">
                                <strong>Type</strong>: {building.getTypeName()} &nbsp;|&nbsp;
                                <strong>Tech</strong>: {building.getTech().name} &nbsp;|&nbsp;
                                <strong>CF</strong>: {building.getCF()}{building.isCapitalScale() ? " (capital scale)" : ""} &nbsp;|&nbsp;
                                <strong>Armor Factor</strong>: {building.getArmorPoints()} &nbsp;|&nbsp;
                                <strong>Size</strong>: {building.getSizeText()} &nbsp;|&nbsp;
                                <strong>Cost</strong>: {building.getCBillCost().toLocaleString("en-US")} C-bills
                            </p>
                            <p>
                                <strong>Capacity</strong>: {building.getTotalWeight()} of {building.getTotalCapacity()} tons used, {building.getRemainingCapacity()} remaining &nbsp;|&nbsp;
                                <strong>Power</strong>: {generator ? `${generator.name} generator (${building.getGeneratorWeight()} tons)` : "Local grid"} &nbsp;|&nbsp;
                                <strong>Energy Weapon Heat</strong>: {building.getEnergyWeaponHeat()} of {building.getHeatDissipation()} sunk &nbsp;|&nbsp;
                                <strong>Minimum Crew</strong>: {building.getMinimumGunners()} gunners, {building.getMinimumNonGunners()} other crew, {building.getMinimumOfficers()} officers
                            </p>
                            <p className="smaller-text">
                                Gunners are each crewed Heavy weapon's tonnage / 5, rounded up; other crew is 1 for each ton of communications
                                equipment, 3 for a field kitchen and 5 for a MASH theater; officers one for up to 9 crew or one for every 10, in
                                military buildings only (TO:AR p. 130).
                            </p>
                            {notes.length > 0 ? (
                                <ul>
                                    {notes.map((note, index) => <li key={index}>{note}</li>)}
                                </ul>
                            ) : null}

                            <h3>Weights</h3>
                            <table className="table" data-testid="building-weights">
                                <tbody>
                                    {weights.map((entry, index) => (
                                        <tr key={index}><td>{entry.name}{entry.location && building.getHexes() > 1 ? `, ${entry.location.toLowerCase()}` : ""}</td><td className="text-right">{entry.weight}</td></tr>
                                    ))}
                                    {weights.length === 0 ? <tr><td colSpan={2}>Nothing installed.</td></tr> : null}
                                    <tr><td><strong>Total</strong></td><td className="text-right"><strong>{building.getTotalWeight()}</strong></td></tr>
                                </tbody>
                            </table>

                            <h3>Cost</h3>
                            <ul data-testid="building-cost-log">
                                {building.getCBillCostLog().map((line, index) => <li key={index}>{line}</li>)}
                            </ul>
                            <p className="smaller-text">
                                Tactical Operations: Advanced Rules p. 208. Its table prices no turrets, power amplifiers or heat sinks for
                                buildings: those take their TechManual prices (pp. 279-280). No Battle Value method for buildings was found in the rulebooks.
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/building-creator/record-sheet`} className="btn btn-primary pull-right btn-sm">View Record Sheet</Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/building-creator/print-tro`} className="btn btn-primary pull-right btn-sm">Print the TRO sheet</Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/building-creator/technical-readout`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
