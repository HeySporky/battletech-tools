import React from 'react';
import { Link } from 'react-router-dom';
import { IAppGlobals } from '../../../app-router';
import VehicleCreatorSideMenu from '../../../components/vehicle-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';

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
                                {vehicle.hasTurret() ? " - Turreted" : " - No Turret"}
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
                                    <tr><td>Front</td><td>{structure.front}</td><td>{armor.front}</td><td>{maxArmor.front}</td></tr>
                                    <tr><td>Left</td><td>{structure.left}</td><td>{armor.left}</td><td>{maxArmor.left}</td></tr>
                                    <tr><td>Right</td><td>{structure.right}</td><td>{armor.right}</td><td>{maxArmor.right}</td></tr>
                                    <tr><td>Rear</td><td>{structure.rear}</td><td>{armor.rear}</td><td>{maxArmor.rear}</td></tr>
                                    {vehicle.hasTurret() ? (
                                        <tr><td>Turret</td><td>{structure.turret}</td><td>{armor.turret}</td><td>{maxArmor.turret}</td></tr>
                                    ) : null}
                                </tbody>
                            </table>

                            <h3>Alpha Strike Stats</h3>
                            <table className="table">
                                <tbody>
                                    <tr><td>Size</td><td>{as.size}</td></tr>
                                    <tr><td>Movement</td><td>{as.movement}{as.movementType}"</td></tr>
                                    <tr><td>Damage (S/M/L/E)</td><td>{as.damage.short}/{as.damage.medium}/{as.damage.long}/{as.damage.extreme}</td></tr>
                                    <tr><td>Armor</td><td>{as.armor ?? "Pending verified conversion"}</td></tr>
                                    <tr><td>Structure</td><td>{as.structure ?? "Pending verified conversion"}</td></tr>
                                    <tr><td>Overheat (OV)</td><td>{as.overheat ?? "Pending verified conversion"}</td></tr>
                                    <tr><td>Point Value</td><td>{as.pointValue ?? "Pending verified conversion"}</td></tr>
                                </tbody>
                            </table>
                            <p className="smaller-text">
                                Armor/Structure/Overheat/Point Value conversions are not yet implemented for
                                Combat Vehicles - see TODO.md Phase 2.
                            </p>

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
