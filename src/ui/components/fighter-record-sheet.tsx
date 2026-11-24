import React, { type JSX } from 'react';
import AerospaceFighter, { formatFighterASDamage } from '../../classes/aerospace-fighter';
import FighterRecordSheetSVG from './svg/fighter-record-sheet-svg';
import SupportAircraftRecordSheetSVG from './svg/support-aircraft-record-sheet-svg';

// A fighter record sheet: the full-page sheet (see FighterRecordSheetSVG) and, when asked, a second page with the
// converted Alpha Strike stats. Airships and Satellites print on their own sheet (see SupportAircraftRecordSheetSVG). With showDamage, damage marked in play is filled in.
export default class FighterRecordSheet extends React.Component<IFighterRecordSheetProps> {
    renderAlphaStrike(): JSX.Element {
        const as = this.props.fighter.getAlphaStrikeStats();
        return (
            <div className="print-page vehicle-sheet-extras" style={{ breakBefore: "page" }}>
                <h2 className="h3">Alpha Strike</h2>
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
            </div>
        );
    }

    render = (): JSX.Element => {
        const motive = this.props.fighter.getSupportMotive();
        const Sheet = motive === "airship" || motive === "satellite" ? SupportAircraftRecordSheetSVG : FighterRecordSheetSVG;
        return (
            <>
                <div className="print-page" style={{ maxHeight: "none" }}>
                    <Sheet fighter={this.props.fighter} showPilot={this.props.showPilot} showDamage={this.props.showDamage} />
                </div>
                {this.props.showAlphaStrike ? this.renderAlphaStrike() : null}
            </>
        );
    };
}

interface IFighterRecordSheetProps {
    fighter: AerospaceFighter;
    showPilot?: boolean;
    showDamage?: boolean;
    /** Adds a second page with the converted Alpha Strike stats. */
    showAlphaStrike?: boolean;
}
