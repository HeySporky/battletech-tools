import * as React from 'react';
import CapitalShip, { CAPITAL_SHIP_CRITICAL_TRACKS } from '../../../../classes/capital-ship';
import { ADVANCED_AEROSPACE_FACINGS } from '../../../../data/advanced-aerospace-construction';
import { CAPITAL_MISSILE_CRITICAL_CHANCE, CAPITAL_SHIP_ATTACK_DIRECTIONS, CapitalShipAttackDirection } from '../../../../data/capital-ship-hit-tables';
import { findCapitalWeapon } from '../../../../data/capital-weapon-helpers';
import { capitalShipName } from './_capitalShipGroupTable';

/**
 * Play panel for a JumpShip, WarShip or space station in the roster: resolve hits (SO:AA p.83 hit locations, Damage
 * Thresholds, Structural Integrity and critical hits, TW pp.237-240, SO:AA p.82), mark damage by hand, and fire arcs
 * within the heat sinks' capacity (zero net heat).
 */
export default class CapitalShipPlayPanel extends React.Component<ICapitalShipPlayPanelProps, ICapitalShipPlayPanelState> {

    constructor(props: ICapitalShipPlayPanelProps) {
        super(props);
        this.state = {
            direction: "nose",
            roll: 7,
            damage: 10,
            standardScale: false,
            natural12: false,
            missileTag: "",
            log: [],
        };
    }

    private _changed = (): void => {
        this.props.onChange(this.props.ship);
    }

    private _log = (lines: string[]): void => {
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
    }

    rollDice = (): void => {
        this.setState({ roll: Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2 });
    }

    resolve = (): void => {
        const lines = this.props.ship.resolveAttack(this.state.roll, this.state.direction, this.state.damage, {
            standardScale: this.state.standardScale, natural12: this.state.natural12, missileTag: this.state.missileTag || undefined,
        });
        this._log(lines);
        this.setState({ natural12: false });
        this._changed();
    }

    render = (): React.ReactNode => {
        const ship = this.props.ship;
        const play = ship.getInPlay();
        const toHit = ship.getDamageToHitModifier();
        const pending = ship.getPendingWeaponCritical();
        const thresholds = ship.getDamageThresholds();
        const missiles = Object.keys(CAPITAL_MISSILE_CRITICAL_CHANCE);

        return (
            <div className="fighter-play" data-testid="capital-ship-play">
                <h3>{capitalShipName(ship)} <small>({ship.getShipTypeName()}, {ship.getTonnage().toLocaleString("en-US")} tons)</small></h3>
                {ship.isDestroyed() ? <h3 className="color-red text-center">DESTROYED</h3>
                    : ship.isEngineDestroyed() ? <h3 className="color-red text-center">ENGINE DESTROYED</h3> : null}
                <p data-testid="capital-ship-play-status">
                    {ship.isWarShip() ? <><strong>Thrust</strong>: {ship.getCurrentSafeThrust()} safe / {ship.getCurrentMaxThrust()} max &nbsp;|&nbsp;</> : null}
                    <strong>Heat Sinking</strong>: {ship.getHeatDissipation().toLocaleString("en-US")} &nbsp;|&nbsp;
                    <strong>To-Hit from Damage</strong>: {toHit === null ? "cannot attack" : `+${toHit}`} &nbsp;|&nbsp;
                    <strong>Control Rolls</strong>: +{ship.getControlRollModifier()} &nbsp;|&nbsp;
                    {ship.hasKFDrive() ? <><strong>K-F Drive Integrity</strong>: {ship.getCurrentKFDriveIntegrity()} of {ship.getKFDriveIntegrity()}{ship.canJump() ? "" : " (cannot jump)"} &nbsp;|&nbsp;</> : null}
                    <strong>Crew</strong>: Gunnery {ship.getPilot().gunnery} / Piloting {ship.getPilot().piloting}
                </p>

                <fieldset className="fieldset">
                    <legend>Resolve a Hit</legend>
                    <label>
                        Attack from:
                        <select value={this.state.direction} onChange={(e) => this.setState({ direction: e.currentTarget.value as CapitalShipAttackDirection })}>
                            {CAPITAL_SHIP_ATTACK_DIRECTIONS.map((direction) => <option key={direction.tag} value={direction.tag}>{direction.name}</option>)}
                        </select>
                    </label>
                    <label>
                        Hit location roll (2D6):
                        <select value={this.state.roll} onChange={(e) => this.setState({ roll: +e.currentTarget.value })}>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((roll) => <option key={roll} value={roll}>{roll}</option>)}
                        </select>
                    </label>
                    <label>
                        Damage:
                        <input type="number" aria-label="Damage" min={0} max={100000} value={this.state.damage} onChange={(e) => this.setState({ damage: Math.max(0, +e.currentTarget.value || 0) })} />
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.standardScale} onChange={(e) => this.setState({ standardScale: e.currentTarget.checked })} />
                        &nbsp;Standard-scale damage (divided by 10)
                    </label>
                    <label>
                        Capital missile:
                        <select aria-label="Capital missile" value={this.state.missileTag} onChange={(e) => this.setState({ missileTag: e.currentTarget.value })}>
                            <option value="">None</option>
                            {missiles.map((tag) => <option key={tag} value={tag}>{findCapitalWeapon(tag)?.name ?? tag} ({CAPITAL_MISSILE_CRITICAL_CHANCE[tag]}+)</option>)}
                        </select>
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.natural12} onChange={(e) => this.setState({ natural12: e.currentTarget.checked })} />
                        &nbsp;The to-hit roll was a natural 12
                    </label>
                    <button className="btn btn-secondary btn-sm" onClick={this.rollDice}>Roll Location</button>
                    &nbsp;
                    <button className="btn btn-primary btn-sm" onClick={this.resolve} disabled={ship.isDestroyed()}>Apply Hit</button>
                    <p className="small-text">
                        One attack at a time. Total a single attacker's standard-scale damage on a location before applying it (TW p. 238).
                        Critical hit checks are rolled for you: 8+ for the Damage Threshold, Structural Integrity and a natural 12, and a
                        capital missile's own number on any armor hit (TW p. 239).
                    </p>
                </fieldset>

                {pending ? (
                    <fieldset className="fieldset" data-testid="capital-ship-pending-weapon">
                        <legend>Weapon Critical Hit: {ship.getArcName(pending.arc)}</legend>
                        <p>The <strong>{pending.chooser}</strong> player chooses the bay that stops working (TW p. 240).</p>
                        {pending.bays.map((bay) => (
                            <button key={bay.index} className="btn btn-danger btn-sm" style={{ marginRight: "0.5em" }}
                                onClick={() => { ship.resolvePendingWeaponCritical(bay.index); this._changed(); }}>
                                Destroy the {bay.name} bay
                            </button>
                        ))}
                        <button className="btn btn-secondary btn-sm" onClick={() => { ship.skipPendingWeaponCritical(); this._changed(); }}>Skip</button>
                    </fieldset>
                ) : null}

                {this.state.log.length ? (
                    <ul className="small-text" data-testid="capital-ship-play-log">
                        {this.state.log.map((line, index) => <li key={index}>{line}</li>)}
                    </ul>
                ) : null}

                <h4>Armor and Structure (capital scale)</h4>
                <table className="table" data-testid="capital-ship-play-armor">
                    <thead><tr><th>Facing</th><th className="text-center">Threshold</th><th className="text-center">Armor left</th><th className="text-center">Damage</th></tr></thead>
                    <tbody>
                        {ADVANCED_AEROSPACE_FACINGS.map((facing) => (
                            <tr key={facing}>
                                <td>{ship.getFacingName(facing)}</td>
                                <td className="text-center">{thresholds[facing]}</td>
                                <td className="text-center">{ship.getCurrentFacingArmor(facing)} of {ship.getFacingArmor(facing)}</td>
                                <td className="text-center">
                                    <input type="number" aria-label={ship.getFacingName(facing) + " armor damage"} min={0} max={ship.getFacingArmor(facing)}
                                        value={play.armorDamage[facing]} onChange={(e) => { ship.setArmorDamage(facing, +e.currentTarget.value || 0); this._changed(); }} />
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td>Structural Integrity</td>
                            <td></td>
                            <td className="text-center">{ship.getCurrentStructure()} of {ship.getStructuralIntegrity()}</td>
                            <td className="text-center">
                                <input type="number" aria-label="Structural Integrity damage" min={0} max={ship.getStructuralIntegrity()}
                                    value={play.structureDamage} onChange={(e) => { ship.setStructureDamage(+e.currentTarget.value || 0); this._changed(); }} />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h4>Critical Damage</h4>
                <p>
                    {CAPITAL_SHIP_CRITICAL_TRACKS.map((track) => (
                        <label key={track.tag} style={{ marginRight: "1em" }}>
                            {track.name}:
                            <select aria-label={track.name + " hits"} value={play[track.tag]}
                                onChange={(e) => { ship.setCriticalHits(track.tag, +e.currentTarget.value); this._changed(); }}>
                                {Array.from({ length: track.max + 1 }, (_, hits) => <option key={hits} value={hits}>{hits} of {track.max}</option>)}
                            </select>
                        </label>
                    ))}
                    <label style={{ marginRight: "1em" }}>
                        <input type="checkbox" checked={play.lifeSupport} onChange={(e) => { ship.setLifeSupportDamaged(e.currentTarget.checked); this._changed(); }} />
                        &nbsp;Life support failed
                    </label>
                    {ship.hasKFDrive() ? (
                        <label style={{ marginRight: "1em" }}>
                            K-F drive damage:
                            <input type="number" aria-label="K-F drive damage" min={0} max={ship.getKFDriveIntegrity()} value={play.kfDriveDamage}
                                onChange={(e) => { ship.setKFDriveDamage(+e.currentTarget.value || 0); this._changed(); }} />
                        </label>
                    ) : null}
                    {ship.getDockingCollars() > 0 ? (
                        <label style={{ marginRight: "1em" }}>
                            Docking collars damaged:
                            <input type="number" aria-label="Docking collars damaged" min={0} max={ship.getDockingCollars()} value={play.dockingCollarsDamaged}
                                onChange={(e) => { ship.setDockingCollarsDamaged(+e.currentTarget.value || 0); this._changed(); }} />
                        </label>
                    ) : null}
                    {ship.getGravDeckCount() > 0 ? (
                        <label style={{ marginRight: "1em" }}>
                            Grav decks out:
                            <input type="number" aria-label="Grav decks out" min={0} max={ship.getGravDeckCount()} value={play.gravDecksDamaged}
                                onChange={(e) => { ship.setGravDecksDamaged(+e.currentTarget.value || 0); this._changed(); }} />
                        </label>
                    ) : null}
                    {ship.getBayDoors() > 0 ? (
                        <label style={{ marginRight: "1em" }}>
                            Bay doors damaged:
                            <input type="number" aria-label="Bay doors damaged" min={0} max={ship.getBayDoors()} value={play.doorsDamaged}
                                onChange={(e) => { ship.setDoorsDamaged(+e.currentTarget.value || 0); this._changed(); }} />
                        </label>
                    ) : null}
                    <label>
                        Cargo lost (%):
                        <input type="number" aria-label="Cargo lost percent" min={0} max={100} value={play.cargoLostPercent}
                            onChange={(e) => { ship.setCargoLostPercent(+e.currentTarget.value || 0); this._changed(); }} />
                    </label>
                </p>

                <fieldset className="fieldset" data-testid="capital-ship-heat">
                    <legend>Firing Arcs and Heat</legend>
                    <p>
                        <strong>This turn</strong>: {ship.getHeatThisTurn().toLocaleString("en-US")} of {ship.getHeatDissipation().toLocaleString("en-US")} heat
                        &nbsp;<button className="btn btn-secondary btn-sm" onClick={() => { ship.turnReset(); this._changed(); }}>New Turn</button>
                    </p>
                    <p className="small-text">
                        Large Craft run on zero net heat: firing an arc costs the heat of every working bay in it, and an arc that would pass
                        the heat sinks cannot fire (TW p. 161; SO:AA p. 82).
                    </p>
                    <table className="table">
                        <thead><tr><th>Arc</th><th>Bays</th><th className="text-center">Heat</th><th className="text-center">Fired</th></tr></thead>
                        <tbody>
                            {ship.getArcs().map((arc) => {
                                const bays = ship.getArcWeaponBays(arc);
                                if (bays.length === 0) return null;
                                return (
                                    <tr key={arc}>
                                        <td>{ship.getArcName(arc)}</td>
                                        <td>
                                            {bays.map((bay, index) => (
                                                <label key={index} style={{ display: "block" }} className={ship.isBayDestroyed(arc, index) ? "color-red" : ""}>
                                                    <input type="checkbox" aria-label={`${ship.getArcName(arc)} ${bay.name} bay destroyed`} checked={ship.isBayDestroyed(arc, index)}
                                                        onChange={(e) => { ship.setBayDestroyed(arc, index, e.currentTarget.checked); this._changed(); }} />
                                                    &nbsp;{bay.name} ({bay.weaponNames.join(", ")}){ship.isBayDestroyed(arc, index) ? " - destroyed" : ""}
                                                </label>
                                            ))}
                                        </td>
                                        <td className="text-center">{ship.getArcHeat(arc)}</td>
                                        <td className="text-center">
                                            <input type="checkbox" aria-label={ship.getArcName(arc) + " fired"} checked={ship.isArcFired(arc)}
                                                onChange={(e) => {
                                                    if (!ship.setArcFired(arc, e.currentTarget.checked)) this._log([`${ship.getArcName(arc)} cannot fire: its heat would pass the heat sinks, or it has nothing to fire`]);
                                                    this._changed();
                                                }} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </fieldset>
            </div>
        );
    }
}

interface ICapitalShipPlayPanelProps {
    ship: CapitalShip;
    onChange: (ship: CapitalShip) => void;
}

interface ICapitalShipPlayPanelState {
    direction: CapitalShipAttackDirection;
    roll: number;
    damage: number;
    standardScale: boolean;
    natural12: boolean;
    missileTag: string;
    log: string[];
}
