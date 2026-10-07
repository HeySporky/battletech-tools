import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft } from "react-icons/fa";
import { FIGHTER_ARCS, FIGHTER_LOCATIONS } from '../../../../classes/aerospace-fighter';
import { IAppGlobals } from '../../../app-router';
import FighterCreatorSideMenu from '../../../components/fighter-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;

export default class FighterCreatorSummary extends React.Component<ISummaryProps> {
    constructor(props: ISummaryProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Summary | Fighter Creator");
    }

    render = (): JSX.Element => {
        const fighter = this.props.appGlobals.currentFighter;
        if (!fighter) return <></>;
        const issues = fighter.getIssues(this.props.appGlobals.appSettings.mechRulesFilter);
        const armor = fighter.getArmorAllocation();
        const title = `${fighter.getModel()} ${fighter.getName()}`.trim() || "Unnamed Fighter";

        return (
            <UIPage current="classic-battletech-fighter-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <FighterCreatorSideMenu appGlobals={this.props.appGlobals} current="summary" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`Summary: ${title}`}>
                            {issues.length === 0 ? (
                                <p><strong>This design is legal under the TechManual construction rules.</strong></p>
                            ) : (
                                <>
                                    <p className="color-red"><strong>This design is not legal yet:</strong></p>
                                    <ul className="color-red">
                                        {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                    </ul>
                                </>
                            )}

                            <p>
                                <strong>Type</strong>: Aerospace Fighter &nbsp;|&nbsp;
                                <strong>Tech</strong>: {fighter.getTech().name} &nbsp;|&nbsp;
                                <strong>Era</strong>: {fighter.getEra().name} &nbsp;|&nbsp;
                                <strong>Tonnage</strong>: {fighter.getTonnage()}
                            </p>
                            <p>
                                <strong>Thrust</strong>: {fighter.getSafeThrust()} safe / {fighter.getMaxThrust()} max &nbsp;|&nbsp;
                                <strong>Structural Integrity</strong>: {fighter.getStructuralIntegrity()} &nbsp;|&nbsp;
                                <strong>Fuel</strong>: {fighter.getFuelPoints()} points &nbsp;|&nbsp;
                                <strong>Heat Sinks</strong>: {fighter.getTotalHeatSinks()} {fighter.getHeatSinkType().name} ({fighter.getHeatDissipation()} dissipated, {fighter.getWeaponHeat()} weapon heat) &nbsp;|&nbsp;
                                <strong>External Stores</strong>: {fighter.getExternalStoresHardpoints()} hardpoints
                            </p>

                            <h3>Armor ({fighter.getArmorType().name})</h3>
                            <p>
                                {FIGHTER_ARCS.map((arc) => (
                                    <span key={arc.tag}><strong>{arc.name}</strong>: {armor[arc.tag]}&nbsp;&nbsp;</span>
                                ))}
                                <strong>Total</strong>: {fighter.getTotalArmorPoints()} of {fighter.getMaxArmorPoints()}
                            </p>

                            <h3>Weights</h3>
                            <table className="table">
                                <thead>
                                    <tr><th>Component</th><th className="text-right">Tons</th></tr>
                                </thead>
                                <tbody>
                                    {fighter.getWeights().map((entry, index) => (
                                        <tr key={index}><td>{entry.name}</td><td className="text-right">{entry.weight}</td></tr>
                                    ))}
                                    <tr>
                                        <td><strong>Total</strong></td>
                                        <td className="text-right"><strong>{fighter.getCurrentTonnage()} of {fighter.getTonnage()}</strong></td>
                                    </tr>
                                </tbody>
                            </table>

                            <h3>Weapons and Equipment by Location</h3>
                            <table className="table">
                                <thead>
                                    <tr><th>Location</th><th>Items</th><th className="text-right">Weapon Slots</th></tr>
                                </thead>
                                <tbody>
                                    {FIGHTER_LOCATIONS.map((location) => {
                                        const items = fighter.getEquipmentList().filter((item) => item.location === location.tag);
                                        return (
                                            <tr key={location.tag}>
                                                <td>{location.name}</td>
                                                <td>{items.length > 0 ? items.map((item) => item.name).join(", ") : "-"}</td>
                                                <td className="text-right">
                                                    {location.tag === "fuselage" ? "-" : `${fighter.getArcSlotsUsed(location.tag)}/${fighter.getArcSlots(location.tag)}`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/equipment`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
