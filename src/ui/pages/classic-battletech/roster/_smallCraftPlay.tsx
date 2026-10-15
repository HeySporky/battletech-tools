import * as React from 'react';
import SmallCraft, { SMALL_CRAFT_CRITICAL_TRACKS, SMALL_CRAFT_HEAT_TRIGGERS } from '../../../../classes/small-craft';
import { SMALL_CRAFT_FACINGS, SmallCraftArc, SmallCraftFacing } from '../../../../data/small-craft-construction';
import { SMALL_CRAFT_ATTACK_DIRECTIONS, SmallCraftAttackDirection } from '../../../../data/small-craft-hit-tables';
import FighterDiagramSVG from '../../../components/svg/fighter-diagram-svg';
import { smallCraftName } from './_smallCraftGroupTable';

// The fighter diagram names its side facings as wings; a Small Craft's are left and right.
const DIAGRAM_FACING: Record<string, SmallCraftFacing> = { nose: "nose", leftWing: "left", rightWing: "right", aft: "aft" };

/**
 * Play panel for a Small Craft in the roster: resolve hits (hit location, Damage Threshold, Structural Integrity
 * and critical hits, Total Warfare pp.237-240), or mark damage by hand on the diagram and the critical tracks.
 */
export default class SmallCraftPlayPanel extends React.Component<ISmallCraftPlayPanelProps, ISmallCraftPlayPanelState> {

    constructor(props: ISmallCraftPlayPanelProps) {
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
        this.props.onChange(this.props.craft);
    }

    rollDice = (): void => {
        this.setState({ roll: Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2 });
    }

    resolve = (): void => {
        const lines = this.props.craft.resolveAttack(this.state.roll, this.state.direction, this.state.damage, { natural12: this.state.natural12 });
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40), natural12: false });
        this._changed();
    }

    applyHeat = (): void => {
        const lines = this.props.craft.applyHeatPhase();
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
        this._changed();
    }

    // Clicking a pip marks damage up to it; clicking the last damaged pip clears it.
    toggleArmor = (diagramFacing: string, index: number): void => {
        const craft = this.props.craft;
        const facing = DIAGRAM_FACING[diagramFacing];
        if (!facing) return;
        const current = craft.getInPlay().armorDamage[facing];
        craft.setArmorDamage(facing, current === index + 1 ? index : index + 1);
        this._changed();
    }

    toggleStructure = (index: number): void => {
        const craft = this.props.craft;
        const current = craft.getInPlay().structureDamage;
        craft.setStructureDamage(current === index + 1 ? index : index + 1);
        this._changed();
    }

    render = (): React.ReactNode => {
        const craft = this.props.craft;
        const play = craft.getInPlay();
        const toHit = craft.getDamageToHitModifier();
        const weapons = craft.getEquipmentList().filter((item) => !item.isAmmo && item.location && item.location !== "hull");
        const pending = craft.getPendingWeaponCritical();
        const heatTriggers = SMALL_CRAFT_HEAT_TRIGGERS.filter((trigger) => trigger.levels.some((level) => play.heat >= level));
        const armor = craft.getArmorAllocation();
        const thresholds = craft.getDamageThresholds();

        return (
            <div className="fighter-play" data-testid="small-craft-play">
                <h3>{smallCraftName(craft)} <small>({craft.getShapeName()} Small Craft, {craft.getTonnage()} tons)</small></h3>
                {craft.isDestroyed() ? <h3 className="color-red text-center">DESTROYED</h3>
                    : craft.isEngineDestroyed() ? <h3 className="color-red text-center">ENGINE DESTROYED</h3> : null}
                <p data-testid="small-craft-play-status">
                    <strong>Thrust</strong>: {craft.getCurrentSafeThrust()} safe / {craft.getCurrentMaxThrust()} max &nbsp;|&nbsp;
                    <strong>Heat Sinking</strong>: {craft.getHeatDissipation()} &nbsp;|&nbsp;
                    <strong>To-Hit from Damage</strong>: {toHit === null ? "cannot attack" : `+${toHit}`} &nbsp;|&nbsp;
                    <strong>Control Rolls</strong>: +{craft.getControlRollModifier()}{play.gear ? " (+5 landing)" : ""} &nbsp;|&nbsp;
                    <strong>Crew</strong>: Gunnery {craft.getPilot().gunnery} / Piloting {craft.getPilot().piloting}
                </p>

                <fieldset className="fieldset">
                    <legend>Resolve a Hit</legend>
                    <label>
                        Attack from:
                        <select value={this.state.direction} onChange={(e) => this.setState({ direction: e.currentTarget.value as SmallCraftAttackDirection })}>
                            {SMALL_CRAFT_ATTACK_DIRECTIONS.map((direction) => <option key={direction.tag} value={direction.tag}>{direction.name}</option>)}
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
                        <input type="number" min={0} max={500} value={this.state.damage} onChange={(e) => this.setState({ damage: Math.max(0, +e.currentTarget.value || 0) })} />
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.natural12} onChange={(e) => this.setState({ natural12: e.currentTarget.checked })} />
                        &nbsp;The to-hit roll was a natural 12
                    </label>
                    <button className="btn btn-secondary btn-sm" onClick={this.rollDice}>Roll Location</button>
                    &nbsp;
                    <button className="btn btn-primary btn-sm" onClick={this.resolve} disabled={craft.isDestroyed()}>Apply Hit</button>
                    <p className="small-text">
                        One hit at a time: cluster weapons hit in 5-point groupings, each with its own location roll. Critical hit
                        checks (8+ on 2D6) are rolled for you (TW pp. 238-239).
                    </p>
                </fieldset>

                {pending ? (
                    <fieldset className="fieldset" data-testid="small-craft-pending-weapon">
                        <legend>Weapon Critical Hit: {craft.getFacingName(pending.facing)}</legend>
                        <p>The <strong>{pending.chooser}</strong> player chooses the weapon that stops working (TW p. 240).</p>
                        {pending.weapons.map((item) => (
                            <button key={item.uuid} className="btn btn-danger btn-sm" style={{ marginRight: "0.5em" }}
                                onClick={() => { craft.resolvePendingWeaponCritical(item.uuid ?? ""); this._changed(); }}>
                                Destroy {item.name}
                            </button>
                        ))}
                        <button className="btn btn-secondary btn-sm" onClick={() => { craft.skipPendingWeaponCritical(); this._changed(); }}>Skip</button>
                    </fieldset>
                ) : null}

                {this.state.log.length ? (
                    <ul className="small-text" data-testid="small-craft-play-log">
                        {this.state.log.map((line, index) => <li key={index}>{line}</li>)}
                    </ul>
                ) : null}

                <FighterDiagramSVG
                    armor={{ nose: armor.nose, leftWing: armor.left, rightWing: armor.right, aft: armor.aft }}
                    structuralIntegrity={craft.getStructuralIntegrity()}
                    thresholds={{ nose: thresholds.nose, leftWing: thresholds.left, rightWing: thresholds.right, aft: thresholds.aft }}
                    armorDamage={{ nose: play.armorDamage.nose, leftWing: play.armorDamage.left, rightWing: play.armorDamage.right, aft: play.armorDamage.aft }}
                    structureDamage={play.structureDamage}
                    sideLabels={{ left: craft.getFacingName("left"), right: craft.getFacingName("right") }}
                    onToggleArmor={this.toggleArmor}
                    onToggleStructure={this.toggleStructure}
                    width={600}
                    key={SMALL_CRAFT_FACINGS.map((facing) => play.armorDamage[facing]).join("-") + "-" + play.structureDamage}
                />

                <h4>Critical Damage</h4>
                <p>
                    {SMALL_CRAFT_CRITICAL_TRACKS.map((track) => (
                        <label key={track.tag} style={{ marginRight: "1em" }}>
                            {track.name}:
                            <select
                                aria-label={track.name + " hits"}
                                value={play[track.tag]}
                                onChange={(e) => { craft.setCriticalHits(track.tag, +e.currentTarget.value); this._changed(); }}
                            >
                                {Array.from({ length: track.boxes + 1 }, (_, hits) => <option key={hits} value={hits}>{hits} of {track.boxes}</option>)}
                            </select>
                        </label>
                    ))}
                    <label style={{ marginRight: "1em" }}>
                        <input type="checkbox" checked={play.gear} onChange={(e) => { craft.setGearDamaged(e.currentTarget.checked); this._changed(); }} />
                        &nbsp;Landing gear damaged
                    </label>
                    <label style={{ marginRight: "1em" }}>
                        <input type="checkbox" checked={play.lifeSupport} onChange={(e) => { craft.setLifeSupportDamaged(e.currentTarget.checked); this._changed(); }} />
                        &nbsp;Life support failed
                    </label>
                    {craft.getBayDoors() > 0 ? (
                        <label style={{ marginRight: "1em" }}>
                            Bay doors damaged:
                            <input type="number" aria-label="Bay doors damaged" min={0} max={craft.getBayDoors()} value={play.doorsDamaged}
                                onChange={(e) => { craft.setDoorsDamaged(+e.currentTarget.value || 0); this._changed(); }} />
                        </label>
                    ) : null}
                    <label>
                        Cargo lost (%):
                        <input type="number" aria-label="Cargo lost percent" min={0} max={100} value={play.cargoLostPercent}
                            onChange={(e) => { craft.setCargoLostPercent(+e.currentTarget.value || 0); this._changed(); }} />
                    </label>
                </p>

                <fieldset className="fieldset" data-testid="small-craft-heat">
                    <legend>Heat</legend>
                    <p className={play.heat >= 5 ? "color-red" : ""}>
                        <strong>Heat Scale</strong>: {play.heat} &nbsp;|&nbsp;
                        <strong>This turn</strong>: +{craft.getHeatGeneratedThisTurn()} generated, -{craft.getHeatDissipation()} dissipated
                    </p>
                    {heatTriggers.length ? (
                        <p className="small-text">
                            Avoid Rolls at this heat: {heatTriggers.map((trigger) => `${trigger.name} (${trigger.levels.filter((level) => play.heat >= level).pop()}+)`).join(", ")}.
                            The Avoid numbers are on the record sheet's Heat Scale (TW p. 161).
                        </p>
                    ) : null}
                    <label>
                        Set heat:
                        <input type="number" aria-label="Current heat" min={0} max={200} value={play.heat}
                            onChange={(e) => { craft.setHeat(+e.currentTarget.value || 0); this._changed(); }} />
                    </label>
                    <button className="btn btn-primary btn-sm" onClick={this.applyHeat}>End Turn: Apply Heat</button>
                    <p className="small-text">Tick the weapons fired this turn below. A Small Craft tracks heat as a fighter does (TW p. 161).</p>
                </fieldset>

                <h4>Weapons</h4>
                <table className="table">
                    <thead>
                        <tr><th>Weapon</th><th>Arc</th><th className="text-center">Heat</th><th className="text-center">Fired</th><th className="text-center">Destroyed</th></tr>
                    </thead>
                    <tbody>
                        {weapons.map((item) => (
                            <tr key={item.uuid} className={craft.isWeaponDestroyed(item.uuid ?? "") ? "color-red" : ""}>
                                <td>{item.name}</td>
                                <td>{craft.getArcName(item.location as SmallCraftArc)}</td>
                                <td className="text-center">{item.heatAero ?? item.heat ?? 0}</td>
                                <td className="text-center">
                                    <input
                                        type="checkbox"
                                        aria-label={item.name + " fired"}
                                        disabled={craft.isWeaponDestroyed(item.uuid ?? "")}
                                        checked={craft.isWeaponFired(item.uuid ?? "")}
                                        onChange={(e) => { craft.setWeaponFired(item.uuid ?? "", e.currentTarget.checked); this._changed(); }}
                                    />
                                </td>
                                <td className="text-center">
                                    <input
                                        type="checkbox"
                                        aria-label={item.name + " destroyed"}
                                        checked={craft.isWeaponDestroyed(item.uuid ?? "")}
                                        onChange={(e) => { craft.setWeaponDestroyed(item.uuid ?? "", e.currentTarget.checked); this._changed(); }}
                                    />
                                </td>
                            </tr>
                        ))}
                        {weapons.length === 0 ? <tr><td colSpan={5}>No weapons mounted.</td></tr> : null}
                    </tbody>
                </table>
            </div>
        );
    }
}

interface ISmallCraftPlayPanelProps {
    craft: SmallCraft;
    onChange: (craft: SmallCraft) => void;
}

interface ISmallCraftPlayPanelState {
    direction: SmallCraftAttackDirection;
    roll: number;
    damage: number;
    natural12: boolean;
    log: string[];
}
