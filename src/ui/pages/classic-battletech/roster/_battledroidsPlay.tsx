import * as React from 'react';
import BattledroidsUnit, { BattledroidsAttackSide } from '../../../../classes/battledroids-unit';
import BattledroidsRulesReference from '../../../components/battledroids-rules-reference';

/**
 * Play panel for a tank, jeep or infantry squad of Expert Battledroids (BD pp.22-23): its movement, its weapons
 * and shots, and attacks against it, located on the Tank Hit Locations table with the players' dice or the app's.
 */
export default class BattledroidsPlayPanel extends React.Component<IBattledroidsPlayPanelProps, IBattledroidsPlayPanelState> {

    constructor(props: IBattledroidsPlayPanelProps) {
        super(props);
        this.state = {
            side: "front",
            damage: 5,
            roll: 0,
            log: [],
        };
    }

    private _changed = (): void => {
        this.props.onChange(this.props.unit);
    }

    resolve = (): void => {
        const lines = this.props.unit.resolveHit(this.state.side, this.state.damage, this.state.roll >= 2 ? this.state.roll : undefined);
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
        this._changed();
    }

    render = (): React.ReactNode => {
        const unit = this.props.unit;
        const kind = unit.getKind();
        const isTank = !!kind.armor;

        return (
            <div className="battledroids-play" data-testid="battledroids-play">
                <h3>{unit.getDisplayName()} <small>({kind.name}, Battledroids p.{unit.getDesign().page})</small></h3>
                {unit.isDestroyed() ? <h3 className="color-red text-center">{unit.hasExploded() ? "DESTROYED (EXPLODED)" : "DESTROYED"}</h3> : null}
                <p>
                    <strong>Movement Points</strong>: <span data-testid="battledroids-play-mp">{unit.getMovementPoints()}</span>
                    {unit.isImmobilized() ? " (tracks hit)" : ""} &nbsp;|&nbsp;
                    <strong>Gunnery</strong>: {unit.getGunnery()} &nbsp;|&nbsp;
                    <strong>To-Hit Modifier Against It</strong>: {kind.toHitModifier > 0 ? `+${kind.toHitModifier}` : "None"}
                </p>
                {kind.movementPointsFiring !== kind.movementPoints ? (
                    <label>
                        <input type="checkbox" checked={unit.isFiring()} onChange={(e) => { unit.setFiring(e.currentTarget.checked); this._changed(); }} />
                        &nbsp;Intends to fire this turn ({kind.movementPointsFiring} MP instead of {kind.movementPoints})
                    </label>
                ) : null}
                <p className="small-text">{unit.getDesign().notes}</p>

                {isTank ? (
                    <fieldset className="fieldset">
                        <legend>Armor</legend>
                        <table className="table" data-testid="battledroids-play-armor">
                            <tbody>
                                {unit.getArmorLocations().map((location) => (
                                    <tr key={location}>
                                        <th className="text-capitalize">{location}</th>
                                        <td className={unit.getArmorLeft(location) < unit.getArmor(location) ? "color-red" : ""}>
                                            <input
                                                type="number"
                                                aria-label={`${location} armor left`}
                                                min={0}
                                                max={unit.getArmor(location)}
                                                value={unit.getArmorLeft(location)}
                                                onChange={(e) => { unit.setArmorLeft(location, +e.currentTarget.value || 0); this._changed(); }}
                                            />
                                            {" "}of {unit.getArmor(location)}
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <th>Tracks</th>
                                    <td>
                                        <label>
                                            <input type="checkbox" checked={unit.isImmobilized()} onChange={(e) => { unit.setImmobilized(e.currentTarget.checked); this._changed(); }} />
                                            &nbsp;Hit (the tank cannot move)
                                        </label>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </fieldset>
                ) : (
                    <p className={unit.getDamage() > 0 ? "color-red" : ""}>
                        <strong>Damage</strong>: {unit.getDamage()} of the {unit.getDamageToDestroy()} that {unit.getDamageToDestroy() === 1 ? "destroys" : "destroy"} it
                    </p>
                )}

                <table className="table" data-testid="battledroids-play-weapons">
                    <thead><tr><th>Weapon</th><th>Arc</th><th>Damage</th><th>Min</th><th>Short</th><th>Medium</th><th>Long</th><th>Shots Left</th></tr></thead>
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
                                <td className="no-wrap">
                                    <button className="btn btn-sm btn-secondary" aria-label={`Take back a shot from ${line.name}`} disabled={line.shotsLeft >= line.shots} onClick={() => { unit.changeShotsFired(line.line, -1); this._changed(); }}>+</button>
                                    {" "}<strong>{line.shotsLeft}</strong> of {line.shots}{" "}
                                    <button className="btn btn-sm btn-primary" aria-label={`Fire ${line.name}`} disabled={line.shotsLeft <= 0 || unit.isDestroyed()} onClick={() => { unit.changeShotsFired(line.line, 1); this._changed(); }}>Fire</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="small-text">
                    To hit: Gunnery {unit.getGunnery()}, +2 at medium range and +4 at long, +1 at the minimum range and for each hex closer,
                    plus the movement and terrain modifiers (see the rules below).
                </p>

                <fieldset className="fieldset">
                    <legend>Resolve a Hit Against the Unit</legend>
                    {isTank ? (
                        <>
                            <label>
                                Attack Comes From:
                                <select value={this.state.side} onChange={(e) => this.setState({ side: e.currentTarget.value as BattledroidsAttackSide })}>
                                    <option value="front">Front</option>
                                    <option value="left">Left Side</option>
                                    <option value="right">Right Side</option>
                                    <option value="back">Back</option>
                                </select>
                            </label>
                            <label>
                                Hit Location Roll (two dice; 0 lets the app roll):
                                <input type="number" min={0} max={12} value={this.state.roll} onChange={(e) => this.setState({ roll: Math.min(12, Math.max(0, +e.currentTarget.value || 0)) })} />
                            </label>
                        </>
                    ) : null}
                    <label>
                        Damage:
                        <input type="number" min={0} max={1000} value={this.state.damage} onChange={(e) => this.setState({ damage: Math.max(0, +e.currentTarget.value || 0) })} />
                    </label>
                    {isTank ? (
                        <p className="small-text">
                            Tank Hit Locations (BD p.22): from the front or back, 2-3 tracks, 4-9 armor, 10-12 turret; from a side, 2-4 tracks,
                            5-9 armor, 10-12 turret.
                        </p>
                    ) : null}
                    <button className="btn btn-primary btn-sm" onClick={this.resolve} disabled={unit.isDestroyed()}>Apply Hit</button>
                </fieldset>

                {this.state.log.length ? (
                    <ul className="small-text" data-testid="battledroids-play-log">
                        {this.state.log.map((entry, index) => <li key={index}>{entry}</li>)}
                    </ul>
                ) : null}

                <ul className="small-text">
                    <li><strong>Stacking</strong>: {kind.stacking}</li>
                    <li><strong>Movement</strong>: {kind.movement}</li>
                    {kind.combat.map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
                <BattledroidsRulesReference />
            </div>
        )
    }
}

interface IBattledroidsPlayPanelProps {
    unit: BattledroidsUnit;
    onChange: (unit: BattledroidsUnit) => void;
}

interface IBattledroidsPlayPanelState {
    side: BattledroidsAttackSide;
    damage: number;
    roll: number;
    log: string[];
}
