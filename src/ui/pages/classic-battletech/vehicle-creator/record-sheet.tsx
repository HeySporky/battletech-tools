import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import VehicleDiagramSVG from '../../../components/svg/vehicle-diagram-svg';

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
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={vehicle.getRequiredRulesLevel()}>
                <div className="print-page">
                    <h2>{`${vehicle.getModel()} ${vehicle.getName()}`.trim() || "Combat Vehicle"}</h2>
                    <p>
                        <strong>{vehicle.getMotiveType().name}</strong> - {vehicle.getTonnage()} tons &nbsp;|&nbsp;
                        Cruise {vehicle.getCruiseMP()} / Flank {vehicle.getFlankMP()}{vehicle.getJumpMP() > 0 ? ` / Jump ${vehicle.getJumpMP()}` : ""} &nbsp;|&nbsp;
                        Crew {vehicle.getCrew()} &nbsp;|&nbsp; Heat Sinks {vehicle.getTotalHeatSinks()} &nbsp;|&nbsp;
                        Armor: {vehicle.getArmorType().name} &nbsp;|&nbsp;
                        BV {vehicle.getBattleValue()} &nbsp;|&nbsp; {vehicle.getCBillCost().toLocaleString()} C-Bills &nbsp;|&nbsp;
                        {vehicle.hasTurret() ? vehicle.getTurretName() : "No Turret"} &nbsp;|&nbsp;
                        {vehicle.getEngineType().name} {vehicle.getEngineRating()}
                    </p>

                    <VehicleDiagramSVG
                        motive={vehicle.getMotiveType()}
                        locations={vehicle.getLocations()}
                        structure={vehicle.getStructureAllocation()}
                        armor={vehicle.getArmorAllocation()}
                        width={600}
                    />

                    <table className="table">
                        <thead>
                            <tr><th>Location</th><th>Equipment</th></tr>
                        </thead>
                        <tbody>
                            {vehicle.getLocations().filter((loc) => loc.tag !== "rotor").map((loc) => (
                                <tr key={loc.tag}>
                                    <td>{loc.name}</td>
                                    <td>{equipmentByLocation(loc.tag).map((item) => item.name).join(", ") || "-"}</td>
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
                            <tr><td>Movement</td><td>{as.movement}"{as.movementType}</td></tr>
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
