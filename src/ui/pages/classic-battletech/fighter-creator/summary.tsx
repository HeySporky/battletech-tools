import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft } from "react-icons/fa";
import { FIGHTER_ARCS, FIGHTER_LOCATIONS, formatFighterASDamage } from '../../../../classes/aerospace-fighter';
import { IAppGlobals } from '../../../app-router';
import FighterCreatorSideMenu from '../../../components/fighter-creator-side-menu';
import SanitizedHTML from '../../../components/sanitized-html';
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
        const as = fighter.getAlphaStrikeStats();
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
                                <strong>Type</strong>: {fighter.isOmni() ? "Omni " : ""}{fighter.getFighterTypeName()}{fighter.hasVSTOL() ? " (VSTOL)" : ""} &nbsp;|&nbsp;
                                <strong>Tech</strong>: {fighter.getTech().name} &nbsp;|&nbsp;
                                <strong>Era</strong>: {fighter.getEra().name} &nbsp;|&nbsp;
                                <strong>Tonnage</strong>: {fighter.getTonnage()} &nbsp;|&nbsp;
                                <strong>Battle Value</strong>: {fighter.getBattleValue()} &nbsp;|&nbsp;
                                <strong>Cost</strong>: {fighter.getCBillCost().toLocaleString("en-US")} C-bills
                            </p>
                            <p>
                                <strong>Thrust</strong>: {fighter.getSafeThrust()} safe / {fighter.getMaxThrust()} max &nbsp;|&nbsp;
                                <strong>Structural Integrity</strong>: {fighter.getStructuralIntegrity()} &nbsp;|&nbsp;
                                <strong>Fuel</strong>: {fighter.getFuelPoints()} points &nbsp;|&nbsp;
                                <strong>Heat Sinks</strong>: {fighter.getTotalHeatSinks()} {fighter.getHeatSinkType().name} ({fighter.getHeatDissipation()} dissipated, {fighter.getWeaponHeat()} weapon heat) &nbsp;|&nbsp;
                                <strong>External Stores</strong>: {fighter.getExternalStoresHardpointsUsed()} of {fighter.getExternalStoresHardpoints()} hardpoints
                                {fighter.getExternalStoresHardpointsUsed() > 0 ? <> (thrust {fighter.getLoadedSafeThrust()}/{fighter.getLoadedMaxThrust()} while loaded: {fighter.getExternalStores().map((store) => `${store.count} x ${store.name}`).join(", ")})</> : null}
                                {fighter.isOmni() ? <> &nbsp;|&nbsp; <strong>Pod Space</strong>: {fighter.getPodSpace()} tons</> : null}
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
                                                <td>{items.length > 0 ? items.map((item) => item.name + (fighter.isPodMounted(item.uuid ?? "") ? " (pod)" : "")).join(", ") : "-"}</td>
                                                <td className="text-right">
                                                    {location.tag === "fuselage" ? "-" : `${fighter.getArcSlotsUsed(location.tag)}/${fighter.getArcSlots(location.tag)}`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <h3>Alpha Strike Stats</h3>
                            <table className="table">
                                <tbody>
                                    <tr><td>Type / Size</td><td>{as.type} / {as.size}</td></tr>
                                    <tr><td>Thrust</td><td>{as.movement}a</td></tr>
                                    <tr><td>Damage (S/M/L)</td><td>{formatFighterASDamage(as.damageValues.short)}/{formatFighterASDamage(as.damageValues.medium)}/{formatFighterASDamage(as.damageValues.long)}</td></tr>
                                    <tr><td>Overheat (OV)</td><td>{as.overheat}</td></tr>
                                    <tr><td>Armor / Structure / Threshold</td><td>{as.armor} / {as.structure} / {as.threshold}</td></tr>
                                    <tr><td>Special Abilities</td><td>{as.specialAbilities.join(", ")}</td></tr>
                                    <tr><td>Point Value</td><td>{as.pointValue}</td></tr>
                                </tbody>
                            </table>
                            <SanitizedHTML raw={true} html={as.calcLog} />
                            <p className="smaller-text">
                                Converted with the Alpha Strike Companion rules, with the Point Value worked out as MegaMek does;
                                checked against Master Unit List cards. Published fighters should still use their MUL card.
                            </p>
                            <Link to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/print-as`} className="btn btn-primary btn-sm">Print Alpha Strike Card</Link>

                            <h3>Battle Value Calculation</h3>
                            <SanitizedHTML raw={true} html={fighter.getBattleValueLog()} />

                            <h3>Cost Calculation</h3>
                            <SanitizedHTML raw={true} html={fighter.getCBillCostLog()} />

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/record-sheet`} className="btn btn-primary pull-right btn-sm">View Record Sheet</Link>
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
