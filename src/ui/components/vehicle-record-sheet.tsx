import React, { type JSX } from 'react';
import Vehicle, { formatVehicleASDamage } from '../../classes/vehicle';
import VehicleDiagramSVG from './svg/vehicle-diagram-svg';
import { SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS, SUPPORT_VEHICLE_FIRE_CONTROL } from '../../data/support-vehicle-construction';

// A Combat or Support Vehicle record sheet: summary line, armor diagram, equipment by location and the
// converted Alpha Strike stats. With showDamage, pips marked in play are filled in.
export default class VehicleRecordSheet extends React.Component<IVehicleRecordSheetProps> {
    render = (): JSX.Element => {
        const vehicle = this.props.vehicle;
        const as = vehicle.getAlphaStrikeStats();
        const equipmentByLocation = (location: string) => vehicle.getEquipmentList().filter((item) => (item.location || "") === location);
        const pilot = vehicle.getPilot();
        const support = vehicle.getSupportVehicleSettings();

        return (
            <div className="print-page">
                <h2>{`${vehicle.getModel()} ${vehicle.getName()}`.trim() || (support ? "Support Vehicle" : "Combat Vehicle")}</h2>
                <p>
                    <strong>{vehicle.isOmni() ? "Omni " : ""}{vehicle.getMotiveType().name}{support ? " Support Vehicle" : ""}</strong> - {vehicle.getTonnage()} tons &nbsp;|&nbsp;
                    Cruise {vehicle.getCruiseMP()} / Flank {vehicle.getFlankMP()}{vehicle.getJumpMP() > 0 ? ` / Jump ${vehicle.getJumpMP()}` : ""} &nbsp;|&nbsp;
                    Crew {vehicle.getCrew()} &nbsp;|&nbsp; Heat Sinks {vehicle.getTotalHeatSinks()} &nbsp;|&nbsp;
                    Armor: {support ? `BAR ${support.bar} (Tech ${support.armorTechRating.toUpperCase()})` : vehicle.getArmorDescription()} &nbsp;|&nbsp;
                    BV {vehicle.getBattleValue()} &nbsp;|&nbsp; {vehicle.getCBillCost().toLocaleString()} C-Bills &nbsp;|&nbsp;
                    {vehicle.hasTurret() ? vehicle.getTurretName() : "No Turret"}{vehicle.hasSponsonTurrets() ? " + Sponson Turrets" : ""} &nbsp;|&nbsp;
                    {support ? vehicle.getSupportVehicleEngine()?.name : vehicle.getEngineType().name} {vehicle.getEngineRating()}
                    {this.props.showCrew ? <> &nbsp;|&nbsp; Gunnery {pilot.gunnery} / Driving {pilot.piloting}{pilot.name ? ` (${pilot.name})` : ""} &nbsp;|&nbsp; Adjusted BV {vehicle.getPilotAdjustedBattleValue()}</> : null}
                </p>
                {support ? (
                    <p className="smaller-text">
                        Tech Rating {vehicle.getSupportVehicleOverallTechRating()?.toUpperCase()} (structure {support.structuralTechRating.toUpperCase()},
                        engine {support.engineTechRating.toUpperCase()}) &nbsp;|&nbsp; {SUPPORT_VEHICLE_FIRE_CONTROL[support.fireControl].name}
                        {vehicle.getFireControlToHitModifier() > 0 ? ` (+${vehicle.getFireControlToHitModifier()} to-hit)` : ""}
                        {vehicle.getSupportVehicleChassisModifications().length > 0 ? <> &nbsp;|&nbsp; {vehicle.getSupportVehicleChassisModifications()
                            .map((tag) => SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.find((mod) => mod.tag === tag)?.name).join(", ")}</> : null}
                        {vehicle.getSupportVehicleRangeKm() !== null ? <> &nbsp;|&nbsp; Range {vehicle.getSupportVehicleRangeKm()} km</> : null}
                    </p>
                ) : null}

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
                                <td>{loc.name}{vehicle.hasSponsonTurrets() && /left|right/i.test(loc.tag) ? " (sponson)" : ""}</td>
                                <td>{equipmentByLocation(loc.tag).map((item) => `${item.name}${item.pintle ? " (pintle)" : ""}`).join(", ") || "-"}</td>
                            </tr>
                        ))}
                        <tr>
                            <td>Unallocated</td>
                            <td>{equipmentByLocation("").map((item) => item.name).join(", ") || "-"}</td>
                        </tr>
                    </tbody>
                </table>
                {vehicle.getTroopSpace() > 0 || vehicle.getBays().length > 0 ? (
                    <p className="smaller-text" data-testid="vehicle-bays-sheet">
                        <strong>Transport</strong>: {[
                            ...(vehicle.getTroopSpace() > 0 ? [`Infantry Compartment ${vehicle.getTroopSpace()} t`] : []),
                            ...vehicle.getBays().map((bay) => `${vehicle.getBayName(bay)} ${bay.amount}${bay.doors > 0 ? ` (${bay.doors} door${bay.doors === 1 ? "" : "s"})` : ""}`),
                        ].join(", ")}
                    </p>
                ) : null}

                <h3>Alpha Strike</h3>
                <table className="table">
                    <tbody>
                        <tr><td>Size / TMM</td><td>{as.size} / {as.tmm}</td></tr>
                        <tr><td>Movement</td><td>{as.movement}"{as.movementType}{as.jumpMovement ? ` / ${as.jumpMovement}"j` : ""}</td></tr>
                        <tr><td>Damage (S/M/L)</td><td>{formatVehicleASDamage(as.damageValues.short)}/{formatVehicleASDamage(as.damageValues.medium)}/{formatVehicleASDamage(as.damageValues.long)}</td></tr>
                        {(as.arcs ?? []).map((arc) => (
                            <tr key={arc.name}><td>{arc.name} arc (S/M/L/E)</td><td>{[arc.damage.short, arc.damage.medium, arc.damage.long, arc.damage.extreme].map(formatVehicleASDamage).join("/")}</td></tr>
                        ))}
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
