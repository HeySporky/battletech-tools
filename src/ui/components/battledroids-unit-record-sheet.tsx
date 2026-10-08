import * as React from 'react';
import BattledroidsUnit from '../../classes/battledroids-unit';

/**
 * Record sheet for a tank, jeep or infantry squad of Expert Battledroids (BD pp.22-23). The rulebook prints none:
 * this one lists what its rules give the unit, with boxes to mark off.
 */
export default class BattledroidsUnitRecordSheet extends React.Component<IBattledroidsUnitRecordSheetProps> {
    render = (): React.ReactNode => {
        const unit = this.props.unit;
        const kind = unit.getKind();
        const boxes = (total: number, left: number) => (
            <span aria-label={`${left} of ${total}`}>
                {Array.from({ length: total }, (_unused, index) => (index < left || !this.props.showDamage ? "□" : "■")).join(" ")}
            </span>
        );
        return (
            <div className="battledroids-unit-record-sheet" data-testid="battledroids-unit-record-sheet">
                <h2>{unit.getDisplayName()}</h2>
                <p>
                    <strong>{kind.name}</strong>, Battledroids (1984) p.{unit.getDesign().page} &nbsp;|&nbsp;
                    <strong>Gunnery</strong>: {unit.getGunnery()} &nbsp;|&nbsp;
                    <strong>Movement Points</strong>: {kind.movementPoints}{kind.movementPointsFiring !== kind.movementPoints ? ` (${kind.movementPointsFiring} in a turn it fires)` : ""} &nbsp;|&nbsp;
                    <strong>To-Hit Modifier Against It</strong>: {kind.toHitModifier > 0 ? `+${kind.toHitModifier}` : "None"}
                </p>
                <p>{unit.getDesign().notes}</p>
                {this.props.showDamage && unit.isDestroyed() ? <h3 className="color-red">DESTROYED</h3> : null}

                {kind.armor ? (
                    <table className="table">
                        <thead><tr><th>Armor</th><th>Points</th></tr></thead>
                        <tbody>
                            {unit.getArmorLocations().map((location) => (
                                <tr key={location}>
                                    <td className="text-capitalize">{location}</td>
                                    <td>{boxes(unit.getArmor(location), unit.getArmorLeft(location))}</td>
                                </tr>
                            ))}
                            <tr>
                                <td>Tracks</td>
                                <td>{this.props.showDamage && unit.isImmobilized() ? "Hit: the tank cannot move" : "□ Hit (the tank cannot move)"}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <p><strong>Damage</strong>: {boxes(unit.getDamageToDestroy(), unit.getDamageToDestroy() - unit.getDamage())} (destroyed when all are marked)</p>
                )}

                <table className="table">
                    <thead><tr><th>Weapon</th><th>Arc</th><th>Damage</th><th>Min</th><th>Short</th><th>Medium</th><th>Long</th><th>Shots</th></tr></thead>
                    <tbody>
                        {unit.getWeaponLines().map((line) => (
                            <tr key={line.line}>
                                <td>{line.name}</td>
                                <td>{line.arc}</td>
                                <td>{line.damage}</td>
                                <td>{line.range.min || "-"}</td>
                                <td>{line.range.short}</td>
                                <td>{line.range.medium}</td>
                                <td>{line.range.long}</td>
                                <td>{this.props.showDamage ? `${line.shotsLeft} of ${line.shots}` : line.shots}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {kind.armor ? (
                    <table className="table">
                        <thead><tr><th>Tank Hit Locations (two dice)</th><th>Front / Back</th><th>Side</th></tr></thead>
                        <tbody>
                            <tr><td>2-3</td><td>Tracks</td><td>Tracks</td></tr>
                            <tr><td>4</td><td>Armor</td><td>Tracks</td></tr>
                            <tr><td>5-9</td><td>Armor</td><td>Armor</td></tr>
                            <tr><td>10-12</td><td>Turret</td><td>Turret</td></tr>
                        </tbody>
                    </table>
                ) : null}

                <ul className="small-text">
                    <li><strong>Stacking</strong>: {kind.stacking}</li>
                    <li><strong>Movement</strong>: {kind.movement}</li>
                    {kind.combat.map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
            </div>
        )
    }
}

interface IBattledroidsUnitRecordSheetProps {
    unit: BattledroidsUnit;
    showDamage: boolean;
}
