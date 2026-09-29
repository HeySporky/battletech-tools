import React, { type JSX } from 'react';
import Vehicle, { formatVehicleASDamage } from '../../classes/vehicle';
import VehicleDiagramSVG from './svg/vehicle-diagram-svg';

// A combat vehicle record sheet: summary line, armor diagram, equipment by location and the
// converted Alpha Strike stats. With showDamage, pips marked in play are filled in.
export default class VehicleRecordSheet extends React.Component<IVehicleRecordSheetProps> {
    render = (): JSX.Element => {
        const vehicle = this.props.vehicle;
        const as = vehicle.getAlphaStrikeStats();
        const equipmentByLocation = (location: string) => vehicle.getEquipmentList().filter((item) => (item.location || "") === location);
        const pilot = vehicle.getPilot();

        return (
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
                    {this.props.showCrew ? <> &nbsp;|&nbsp; Gunnery {pilot.gunnery} / Driving {pilot.piloting}{pilot.name ? ` (${pilot.name})` : ""} &nbsp;|&nbsp; Adjusted BV {vehicle.getPilotAdjustedBattleValue()}</> : null}
                </p>

                <VehicleDiagramSVG
                    motive={vehicle.getMotiveType()}
                    locations={vehicle.getLocations()}
                    structure={vehicle.getStructureAllocation()}
                    armor={vehicle.getArmorAllocation()}
                    width={600}
                    armorDamage={this.props.showDamage ? vehicle.getInPlay().armorDamage : undefined}
                    structureDamage={this.props.showDamage ? vehicle.getInPlay().structureDamage : undefined}
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
                        <tr><td>Size / TMM</td><td>{as.size} / {as.tmm}</td></tr>
                        <tr><td>Movement</td><td>{as.movement}"{as.movementType}{as.jumpMovement ? ` / ${as.jumpMovement}"j` : ""}</td></tr>
                        <tr><td>Damage (S/M/L)</td><td>{formatVehicleASDamage(as.damageValues.short)}/{formatVehicleASDamage(as.damageValues.medium)}/{formatVehicleASDamage(as.damageValues.long)}</td></tr>
                        <tr><td>Armor / Structure</td><td>{as.armor} / {as.structure}</td></tr>
                        <tr><td>Special Abilities</td><td>{as.specialAbilities.join(", ")}</td></tr>
                        <tr><td>Point Value</td><td>{as.pointValue}</td></tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

interface IVehicleRecordSheetProps {
    vehicle: Vehicle;
    showCrew?: boolean;
    showDamage?: boolean;
}
