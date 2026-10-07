import * as React from 'react';
import AerospaceFighter, { FIGHTER_ARCS, FIGHTER_CRITICAL_TRACKS, FighterArc } from '../../../../classes/aerospace-fighter';
import { FIGHTER_ATTACK_DIRECTIONS, FighterAttackDirection } from '../../../../data/fighter-hit-tables';
import FighterDiagramSVG from '../../../components/svg/fighter-diagram-svg';
import { fighterName } from './_fighterGroupTable';

/**
 * Play panel for a fighter in the roster: resolve hits (hit location, Damage Threshold, Structural Integrity and
 * critical hits, Total Warfare pp.237-240), or mark damage by hand on the diagram and the critical tracks.
 */
export default class FighterPlayPanel extends React.Component<IFighterPlayPanelProps, IFighterPlayPanelState> {

    constructor(props: IFighterPlayPanelProps) {
        super(props);
        this.state = {
            direction: "nose",
            roll: 7,
            damage: 5,
            natural12: false,
            log: [],
        };
    }

    private _changed = (): void => {
        this.props.onChange(this.props.fighter);
    }

    rollDice = (): void => {
        this.setState({ roll: Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2 });
    }

    resolve = (): void => {
        const lines = this.props.fighter.resolveAttack(this.state.roll, this.state.direction, this.state.damage, { natural12: this.state.natural12 });
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40), natural12: false });
        this._changed();
    }

    // Clicking a pip marks damage up to it; clicking the last damaged pip clears it.
    toggleArmor = (arc: FighterArc, index: number): void => {
        const fighter = this.props.fighter;
        const current = fighter.getInPlay().armorDamage[arc];
        fighter.setArmorDamage(arc, current === index + 1 ? index : index + 1);
        this._changed();
    }

    toggleStructure = (index: number): void => {
        const fighter = this.props.fighter;
        const current = fighter.getInPlay().structureDamage;
        fighter.setStructureDamage(current === index + 1 ? index : index + 1);
        this._changed();
    }

    render = (): React.ReactNode => {
        const fighter = this.props.fighter;
        const play = fighter.getInPlay();
        const toHit = fighter.getDamageToHitModifier();
        const weapons = fighter.getEquipmentList().filter((item) => !item.isAmmo && fighter.getItemSlots(item) > 0);
        const storesCarried = fighter.getExternalStoresHardpointsUsed() > 0;

        return (
            <div className="fighter-play" data-testid="fighter-play">
                <h3>{fighterName(fighter)} <small>({fighter.getFighterTypeName()}, {fighter.getTonnage()} tons)</small></h3>
                {fighter.isDestroyed() ? <h3 className="color-red text-center">DESTROYED</h3>
                    : fighter.isEngineDestroyed() ? <h3 className="color-red text-center">ENGINE DESTROYED - SHUT DOWN</h3> : null}
                <p>
                    <strong>Thrust</strong>: {fighter.getCurrentSafeThrust()} safe / {fighter.getCurrentMaxThrust()} max &nbsp;|&nbsp;
                    <strong>Heat Sinking</strong>: {fighter.getCurrentHeatDissipation()}{play.engine > 0 ? ` (+${play.engine * 2} heat a turn from engine hits)` : ""} &nbsp;|&nbsp;
                    <strong>To-Hit from Damage</strong>: {toHit === null ? "cannot attack" : `+${toHit}`} &nbsp;|&nbsp;
                    <strong>Control Rolls</strong>: +{fighter.getControlRollModifier()}{play.gear ? " (+5 landing)" : ""} &nbsp;|&nbsp;
                    <strong>Pilot</strong>: Gunnery {fighter.getPilot().gunnery} / Piloting {fighter.getPilot().piloting}
                </p>

                <fieldset className="fieldset">
                    <legend>Resolve a Hit</legend>
                    <label>
                        Attack from:
                        <select value={this.state.direction} onChange={(e) => this.setState({ direction: e.currentTarget.value as FighterAttackDirection })}>
                            {FIGHTER_ATTACK_DIRECTIONS.map((direction) => <option key={direction.tag} value={direction.tag}>{direction.name}</option>)}
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
                        <input type="number" min={0} max={200} value={this.state.damage} onChange={(e) => this.setState({ damage: Math.max(0, +e.currentTarget.value || 0) })} />
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.natural12} onChange={(e) => this.setState({ natural12: e.currentTarget.checked })} />
                        &nbsp;The to-hit roll was a natural 12
                    </label>
                    <button className="btn btn-secondary btn-sm" onClick={this.rollDice}>Roll Location</button>
                    &nbsp;
                    <button className="btn btn-primary btn-sm" onClick={this.resolve} disabled={fighter.isDestroyed()}>Apply Hit</button>
                    <p className="small-text">
                        One hit at a time: cluster weapons hit in 5-point groupings, each with its own location roll. Critical hit
                        checks (8+ on 2D6) are rolled for you (TW pp. 238-239).
                    </p>
                </fieldset>

                {this.state.log.length ? (
                    <ul className="small-text" data-testid="fighter-play-log">
                        {this.state.log.map((line, index) => <li key={index}>{line}</li>)}
                    </ul>
                ) : null}

                <FighterDiagramSVG
                    armor={fighter.getArmorAllocation()}
                    structuralIntegrity={fighter.getStructuralIntegrity()}
                    thresholds={fighter.getDamageThresholds()}
                    armorDamage={play.armorDamage}
                    structureDamage={play.structureDamage}
                    onToggleArmor={this.toggleArmor}
                    onToggleStructure={this.toggleStructure}
                    width={600}
                    key={FIGHTER_ARCS.map((arc) => play.armorDamage[arc.tag]).join("-") + "-" + play.structureDamage}
                />

                <h4>Critical Damage</h4>
                <p>
                    {FIGHTER_CRITICAL_TRACKS.map((track) => (
                        <label key={track.tag} style={{ marginRight: "1em" }}>
                            {track.name}:
                            <select
                                aria-label={track.name + " hits"}
                                value={play[track.tag]}
                                onChange={(e) => { fighter.setCriticalHits(track.tag, +e.currentTarget.value); this._changed(); }}
                            >
                                {Array.from({ length: track.boxes + 1 }, (_, hits) => <option key={hits} value={hits}>{hits} of {track.boxes}</option>)}
                            </select>
                        </label>
                    ))}
                    <label style={{ marginRight: "1em" }}>
                        Heat sinks lost:
                        <input type="number" aria-label="Heat sinks lost" min={0} max={fighter.getTotalHeatSinks()} value={play.heatSinks}
                            onChange={(e) => { fighter.setHeatSinksLost(+e.currentTarget.value || 0); this._changed(); }} />
                    </label>
                    <label style={{ marginRight: "1em" }}>
                        <input type="checkbox" checked={play.gear} onChange={(e) => { fighter.setGearDamaged(e.currentTarget.checked); this._changed(); }} />
                        &nbsp;Landing gear damaged
                    </label>
                    {storesCarried ? (
                        <label>
                            <input type="checkbox" checked={play.storesDropped} onChange={(e) => { fighter.setStoresDropped(e.currentTarget.checked); this._changed(); }} />
                            &nbsp;External stores dropped ({fighter.getExternalStores().map((store) => `${store.count} x ${store.name}`).join(", ")}{play.bombsLost ? `; ${play.bombsLost} useless` : ""})
                        </label>
                    ) : null}
                </p>

                <h4>Weapons</h4>
                <table className="table">
                    <thead>
                        <tr><th>Weapon</th><th>Arc</th><th className="text-center">Heat</th><th className="text-center">Destroyed</th></tr>
                    </thead>
                    <tbody>
                        {weapons.map((item) => (
                            <tr key={item.uuid} className={fighter.isWeaponDestroyed(item.uuid ?? "") ? "color-red" : ""}>
                                <td>{item.name}</td>
                                <td>{FIGHTER_ARCS.find((arc) => arc.tag === item.location)?.name ?? "-"}</td>
                                <td className="text-center">{item.heatAero ?? item.heat ?? 0}</td>
                                <td className="text-center">
                                    <input
                                        type="checkbox"
                                        aria-label={item.name + " destroyed"}
                                        checked={fighter.isWeaponDestroyed(item.uuid ?? "")}
                                        onChange={(e) => { fighter.setWeaponDestroyed(item.uuid ?? "", e.currentTarget.checked); this._changed(); }}
                                    />
                                </td>
                            </tr>
                        ))}
                        {weapons.length === 0 ? <tr><td colSpan={4}>No weapons mounted.</td></tr> : null}
                    </tbody>
                </table>
            </div>
        );
    }
}

interface IFighterPlayPanelProps {
    fighter: AerospaceFighter;
    onChange: (fighter: AerospaceFighter) => void;
}

interface IFighterPlayPanelState {
    direction: FighterAttackDirection;
    roll: number;
    damage: number;
    natural12: boolean;
    log: string[];
}
