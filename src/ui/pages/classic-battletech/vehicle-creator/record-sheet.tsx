import React from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import TrackedVehicleDiagramSVG from '../../../components/svg/tracked-vehicle-diagram-svg';

export default class VehicleCreatorRecordSheet extends React.Component<IRecordSheetProps, IRecordSheetState> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.state = { updated: false };
        this.props.appGlobals.makeDocumentTitle("Record Sheet | Vehicle Creator");
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;

        const as = vehicle.getAlphaStrikeStats();
        const equipmentByLocation = (location: string) => vehicle.getEquipmentList().filter((item) => item.location === location);

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/summary`} appGlobals={this.props.appGlobals}>
                <div className="print-page">
                    <h2>{`${vehicle.getModel()} ${vehicle.getName()}`.trim() || "Combat Vehicle"}</h2>
                    <p>
                        <strong>{vehicle.getMotiveType().name}</strong> - {vehicle.getTonnage()} tons &nbsp;|&nbsp;
                        Cruise {vehicle.getCruiseMP()} / Flank {vehicle.getFlankMP()} &nbsp;|&nbsp;
                        Armor: {vehicle.getArmorType().name} &nbsp;|&nbsp;
                        {vehicle.hasTurret() ? "Turreted" : "No Turret"}
                    </p>

                    <TrackedVehicleDiagramSVG
                        structure={vehicle.getStructureAllocation()}
                        armor={vehicle.getArmorAllocation()}
                        hasTurret={vehicle.hasTurret()}
                        width={600}
                    />

                    <table className="table">
                        <thead>
                            <tr><th>Location</th><th>Equipment</th></tr>
                        </thead>
                        <tbody>
                            {["front", "left", "right", "rear", "turret"].filter((loc) => loc !== "turret" || vehicle.hasTurret()).map((loc) => (
                                <tr key={loc}>
                                    <td style={{ textTransform: "capitalize" }}>{loc}</td>
                                    <td>{equipmentByLocation(loc).map((item) => item.name).join(", ") || "-"}</td>
                                </tr>
                            ))}
                            <tr>
                                <td>Unallocated</td>
                                <td>{equipmentByLocation("").map((item) => item.name).join(", ") || "-"}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3>Alpha Strike</h3>
                    <table className="table">
                        <tbody>
                            <tr><td>Size</td><td>{as.size}</td></tr>
                            <tr><td>Movement</td><td>{as.movement}{as.movementType}"</td></tr>
                            <tr><td>Damage (S/M/L/E)</td><td>{as.damage.short}/{as.damage.medium}/{as.damage.long}/{as.damage.extreme}</td></tr>
                            <tr><td>Armor</td><td>{as.armor ?? "Pending verified conversion"}</td></tr>
                            <tr><td>Structure</td><td>{as.structure ?? "Pending verified conversion"}</td></tr>
                            <tr><td>Point Value</td><td>{as.pointValue ?? "Pending verified conversion"}</td></tr>
                        </tbody>
                    </table>
                </div>
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}

interface IRecordSheetState {
    updated: boolean;
}
