import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import VehicleCreatorSideMenu from '../../../components/vehicle-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import SanitizedHTML from '../../../components/sanitized-html';
import { formatVehicleASDamage } from '../../../../classes/vehicle';

export default class VehicleCreatorSummary extends React.Component<ISummaryProps, ISummaryState> {
    constructor(props: ISummaryProps) {
        super(props);
        this.state = { updated: false };
        this.props.appGlobals.makeDocumentTitle("Summary | Vehicle Creator");
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;

        const as = vehicle.getAlphaStrikeStats();
        const structure = vehicle.getStructureAllocation();
        const maxArmor = vehicle.getMaxArmorAllocation();
        const armor = vehicle.getArmorAllocation();

        return (
            <UIPage current="classic-battletech-vehicle-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <VehicleCreatorSideMenu appGlobals={this.props.appGlobals} current="summary" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`${vehicle.getModel()} ${vehicle.getName()}`.trim() || "Vehicle Summary"}>
                            <p>
                                <strong>{vehicle.getMotiveType().name}</strong> - {vehicle.getTonnage()} tons
                                {vehicle.hasTurret() ? ` - ${vehicle.getTurretName()}` : " - No Turret"}
                                {` - Cruise ${vehicle.getCruiseMP()} / Flank ${vehicle.getFlankMP()}${vehicle.getJumpMP() > 0 ? ` / Jump ${vehicle.getJumpMP()}` : ""} - ${vehicle.getEngineType().name} ${vehicle.getEngineRating()} - Crew ${vehicle.getCrew()} - Item Slots ${vehicle.getUsedItemSlots()}/${vehicle.getTotalItemSlots()}`}
                            </p>

                            <p>
                                <strong>Battle Value</strong>: {vehicle.getBattleValue()} &nbsp;|&nbsp;
                                <strong>C-Bill Cost</strong>: {vehicle.getCBillCost().toLocaleString()}
                            </p>

                            <h3>Weight Summary</h3>
                            <table className="table">
                                <thead>
                                    <tr><th>Item</th><th>Weight</th></tr>
                                </thead>
                                <tbody>
                                    {vehicle.getWeights().map((item, index) => (
                                        <tr key={index}><td>{item.name}</td><td>{item.weight}</td></tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr><td><strong>Current Tonnage</strong></td><td>{vehicle.getCurrentTonnage()}</td></tr>
                                    <tr><td><strong>Remaining Tonnage</strong></td><td>{vehicle.getRemainingTonnage()}</td></tr>
                                </tfoot>
                            </table>

                            <h3>Internal Structure / Armor</h3>
                            <table className="table">
                                <thead>
                                    <tr><th>Location</th><th>Structure</th><th>Armor</th><th>Max Armor</th></tr>
                                </thead>
                                <tbody>
                                    {vehicle.getLocations().map((loc) => (
                                        <tr key={loc.tag}><td>{loc.name}</td><td>{structure[loc.tag] ?? 0}</td><td>{armor[loc.tag] ?? 0}</td><td>{maxArmor[loc.tag] ?? 0}</td></tr>
                                    ))}
                                </tbody>
                            </table>

                            <h3>Alpha Strike Stats</h3>
                            <table className="table">
                                <tbody>
                                    <tr><td>Size / TMM</td><td>{as.size} / {as.tmm}</td></tr>
                                    <tr><td>Movement</td><td>{as.movement}"{as.movementType}{as.jumpMovement ? ` / ${as.jumpMovement}"j` : ""}</td></tr>
                                    <tr><td>Damage (S/M/L)</td><td>{formatVehicleASDamage(as.damageValues.short)}/{formatVehicleASDamage(as.damageValues.medium)}/{formatVehicleASDamage(as.damageValues.long)}</td></tr>
                                    <tr><td>Armor / Structure</td><td>{as.armor} / {as.structure}</td></tr>
                                    <tr><td>Overheat (OV)</td><td>{as.overheat}</td></tr>
                                    <tr><td>Special Abilities</td><td>{as.specialAbilities.join(", ")}</td></tr>
                                    <tr><td>Point Value</td><td>{as.pointValue}</td></tr>
                                </tbody>
                            </table>
                            <SanitizedHTML raw={true} html={as.calcLog} />
                            <p className="smaller-text">
                                Converted with the Alpha Strike Companion rules as implemented by MegaMek; published
                                vehicles convert to their Master Unit List cards. Published units should still use their
                                MUL card.
                            </p>
                            <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/print-as`} className="btn btn-primary btn-sm">Print Alpha Strike Card</Link>

                            <h3>Battle Value Calculation</h3>
                            <SanitizedHTML raw={true} html={vehicle.getBattleValueLog()} />

                            <h3>C-Bill Cost Calculation</h3>
                            <SanitizedHTML raw={true} html={vehicle.getCBillCostLog()} />

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/record-sheet`} className="btn btn-primary pull-right btn-sm">View Record Sheet</Link>
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

interface ISummaryState {
    updated: boolean;
}
