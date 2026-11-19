import React, { type JSX } from 'react';
import Vehicle, { formatVehicleASDamage } from '../../classes/vehicle';
import VehicleRecordSheetSVG from './svg/vehicle-record-sheet-svg';

// A Combat or Support Vehicle record sheet: the full-page sheet (see VehicleRecordSheetSVG) and, when asked, a
// second page with the converted Alpha Strike stats. With showDamage, pips marked in play are filled in.
export default class VehicleRecordSheet extends React.Component<IVehicleRecordSheetProps> {
    renderAlphaStrike(): JSX.Element {
        const vehicle = this.props.vehicle;
        const as = vehicle.getAlphaStrikeStats();
        return (
            <div className="print-page vehicle-sheet-extras" style={{ breakBefore: "page" }}>
                <h2 className="h3">Alpha Strike</h2>
                <table className="table">
                    <tbody>
                        <tr><td>Size / TMM</td><td>{as.size} / {as.tmm}</td></tr>
                        <tr><td>Movement</td><td>{as.movement}"{as.movementType}{as.jumpMovement ? ` / ${as.jumpMovement}"j` : ""}{vehicle.isArtVee() ? ` (Siege Mode 0")` : ""}</td></tr>
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

    render = (): JSX.Element => (
        <>
            <div className="print-page" style={{ maxHeight: "none" }}>
                <VehicleRecordSheetSVG vehicle={this.props.vehicle} showCrew={this.props.showCrew} showDamage={this.props.showDamage} />
            </div>
            {this.props.showAlphaStrike ? this.renderAlphaStrike() : null}
        </>
    );
}

interface IVehicleRecordSheetProps {
    vehicle: Vehicle;
    showCrew?: boolean;
    showDamage?: boolean;
    /** Adds a second page with the converted Alpha Strike stats. */
    showAlphaStrike?: boolean;
}
