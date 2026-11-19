import * as React from 'react';
import MicroMech, { MICRO_MECH_HIT_LOCATIONS } from '../../../../classes/micro-mech';
import { MicroMechLocation } from '../../../../data/micro-mech-construction';
import { formatBattleValue } from '../../../../data/battle-value';

const rollD6 = (): number => 1 + Math.floor(Math.random() * 6);
const signed = (value: number): string => (value > 0 ? `+${value}` : `${value}`);

/**
 * Play panel for a Micro-Mech (fan-made, Custom Homebrew, #173) in the roster: the record sheet's armor, structure,
 * cockpit, critical slots, pilot hits and ammunition, with the movement and modifiers they leave. Rules from the
 * "Micro-Mech Rules" section of the design's version; the BattleMech rules (Total Warfare) where it defers to them.
 */
export default class MicroMechPlayPanel extends React.Component<IMicroMechPlayPanelProps, IMicroMechPlayPanelState> {

    constructor(props: IMicroMechPlayPanelProps) {
        super(props);
        this.state = {
            location: "torso",
            rear: false,
            damage: 5,
            log: [],
        };
    }

    private _changed = (): void => {
        this.props.onChange(this.props.micro);
        this.forceUpdate();
    }

    private _log = (lines: string[]): void => {
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
    }

    applyHit = (): void => {
        const micro = this.props.micro;
        const name = micro.getLocationName(this.state.location) + (this.state.rear && this.state.location === "torso" ? " (rear)" : "");
        const lines = micro.applyDamage(this.state.location, this.state.damage, this.state.rear);
        this._log([`${this.state.damage} damage to the ${name}.`, ...lines]);
        this._changed();
    }

    // Rolls 2D6 on the BattleMech Hit Location Table: the three torso locations are the one torso.
    rollHit = (): void => {
        const micro = this.props.micro;
        const roll = rollD6() + rollD6();
        const location = MICRO_MECH_HIT_LOCATIONS[micro.getLayout()][roll];
        const lines = micro.applyDamage(location, this.state.damage, this.state.rear);
        this._log([`Rolled ${roll}: ${this.state.damage} damage to the ${micro.getLocationName(location)}${this.state.rear && location === "torso" ? " (rear)" : ""}${roll === 2 ? "; a 2 may be a critical hit (roll on the Determining Critical Hits Table)" : ""}.`, ...lines]);
        this.setState({ location });
        this._changed();
    }

    rollCritical = (location: MicroMechLocation): void => {
        const micro = this.props.micro;
        this._log([`${micro.getLocationName(location)}:`, ...micro.rollCriticalHit(location)]);
        this._changed();
    }

    // Clicking a circle marks damage up to it; clicking the last marked circle clears it.
    private _toggle = (current: number, clicked: number): number => (current === clicked ? clicked - 1 : clicked);

    toggleSlot = (location: MicroMechLocation, slot: number): void => {
        const micro = this.props.micro;
        const lines = micro.setSlotHit(location, slot, !micro.isSlotHit(location, slot));
        if (lines.length > 0) this._log([`${micro.getLocationName(location)}, slot ${slot + 1}:`, ...lines]);
        this._changed();
    }

    render = (): React.ReactNode => {
        const micro = this.props.micro;
        const movement = micro.getPlayMovement();
        const piloting = micro.getPilotingModifier();
        const weapons = micro.getWeaponPlayLines();
        const lots = micro.getAmmoLots();
        const reason = micro.getDestroyedReason();
        const rules = micro.getRules();
        const circle = (structure: boolean, marked: boolean): React.CSSProperties => ({
            display: "inline-block", width: "1.2em", height: "1.2em", border: "1px solid #000", borderRadius: "50%", padding: 0,
            marginRight: "0.15em", background: marked ? "#000" : structure ? "#999" : "#fff", verticalAlign: "middle", cursor: "pointer",
        });
        const box = (marked: boolean): React.CSSProperties => ({
            display: "inline-block", width: "1.1em", height: "1.1em", border: "1px solid #000", padding: 0, marginRight: "0.2em",
            background: marked ? "#000" : "#fff", verticalAlign: "middle", cursor: "pointer",
        });
        const locations = micro.getLocations().filter((location) => location !== "torsoRear");

        return (
            <div className="text-section" data-testid="micro-mech-play-panel">
                <h3>{micro.getDisplayName()}{reason ? <span className="color-red"> - DESTROYED</span> : null}</h3>
                <p>
                    {micro.getTons()}-ton {micro.isQuad() ? "quad" : "biped"} Micro-Mech (fan-made, NOT OFFICIAL), {rules.name} &nbsp;|&nbsp;
                    Gunnery {micro.getGunnery()} / Piloting {micro.getPiloting()} &nbsp;|&nbsp;
                    BV {formatBattleValue((edition) => micro.getSkillAdjustedBattleValue(edition), "mech", micro.getRulesEdition())}
                </p>
                {reason ? <p className="color-red" data-testid="micro-play-destroyed">{reason}</p> : null}
                <p>
                    <strong>Movement</strong>: <span data-testid="micro-play-move">{movement.text}</span> &nbsp;|&nbsp;
                    <strong>Piloting Skill Rolls</strong>: <span data-testid="micro-play-piloting">{signed(piloting.total)}</span>
                    <span className="small-text"> ({piloting.lines.join(", ")})</span>
                    {micro.canFireEnergyWeapons() ? null : <> &nbsp;|&nbsp; <strong className="color-red">No energy weapons</strong> (engine hit)</>}
                    {micro.hasSensorDamage() ? <> &nbsp;|&nbsp; <strong>Sensors</strong>: +4 to hit, one target within short range</> : null}
                </p>
                {movement.notes.length > 0 ? <ul className="small-text">{movement.notes.map((note, index) => <li key={index}>{note}</li>)}</ul> : null}
                {rules.neurohelmet ? (
                    <label className="small-text">
                        <input type="checkbox" checked={micro.hasNeurohelmet()} onChange={(e) => { micro.setNeurohelmet(e.currentTarget.checked); this._changed(); }} />{" "}
                        Neurohelmet ({rules.neurohelmet})
                    </label>
                ) : null}

                <fieldset className="fieldset">
                    <legend>A Hit</legend>
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        Damage:{" "}
                        <input type="number" min={1} max={999} aria-label="Damage" data-testid="micro-play-damage" style={{ width: "5em" }} value={this.state.damage} onChange={(e) => this.setState({ damage: Math.min(999, Math.max(1, Math.round(+e.currentTarget.value) || 1)) })} />
                    </label>
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        Location:{" "}
                        <select aria-label="Hit location" data-testid="micro-play-location" value={this.state.location} style={{ width: "auto" }} onChange={(e) => this.setState({ location: e.currentTarget.value as MicroMechLocation })}>
                            {locations.map((location) => <option key={location} value={location}>{micro.getLocationName(location)}</option>)}
                        </select>
                    </label>
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        <input type="checkbox" aria-label="Attack from the rear" checked={this.state.rear} onChange={(e) => this.setState({ rear: e.currentTarget.checked })} /> From the rear
                    </label>
                    <button className="btn btn-primary btn-sm" type="button" data-testid="micro-play-apply" onClick={this.applyHit}>Apply</button>
                    &nbsp;
                    <button className="btn btn-primary btn-sm" type="button" data-testid="micro-play-roll" onClick={this.rollHit}>Roll the Location (2D6)</button>
                    <p className="small-text">
                        The BattleMech Hit Location Table, front or rear, with its three torso locations as the one torso (place a side
                        hit by hand). Damage beyond a limb or the head passes to the torso; past the torso structure,
                        {rules.torsoOverflowToCockpit < 1 ? " half of it (rounded down)" : " all of it"} reaches the cockpit, a pilot hit a point.
                        Roll for critical hits when internal structure is damaged.
                    </p>
                    {this.state.log.length > 0 ? (
                        <ul className="small-text" data-testid="micro-play-log">
                            {this.state.log.map((line, index) => <li key={index}>{line}</li>)}
                        </ul>
                    ) : null}
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Pilot and Cockpit</legend>
                    <p>
                        <strong>Pilot hits</strong>:{" "}
                        {Array.from({ length: 6 }, (_hit, hit) => (
                            <button key={hit} type="button" aria-label={`Pilot hit ${hit + 1}`} style={box(hit < micro.getPilotHits())} onClick={() => { micro.setPilotHits(this._toggle(micro.getPilotHits(), hit + 1)); this._changed(); }} />
                        ))}
                        &nbsp;|&nbsp; <strong>Cockpit armor</strong>:{" "}
                        {Array.from({ length: 3 }, (_point, point) => {
                            const lost = 3 - micro.getCockpitArmorLeft();
                            return <button key={point} type="button" aria-label={`Cockpit armor ${point + 1}`} style={circle(false, point < lost)} onClick={() => { micro.setCockpitDamage(this._toggle(lost, point + 1)); this._changed(); }} />;
                        })}
                    </p>
                    <p className="small-text">
                        The pilot sits in the torso: no hit from head or ordinary torso damage, 3 from an ammunition explosion, one for each
                        point of cockpit armor lost; killed when all three are gone or the Cockpit slot is hit.
                    </p>
                </fieldset>

                <table className="table">
                    <thead>
                        <tr><th>Location</th><th>Armor and Structure</th><th>Critical Slots</th></tr>
                    </thead>
                    <tbody>
                        {locations.map((location) => {
                            const name = micro.getLocationName(location);
                            const armorLost = micro.getArmor(location) - micro.getArmorLeft(location);
                            const structureLost = micro.getStructure(location) - micro.getStructureLeft(location);
                            const rearLost = micro.getArmor("torsoRear") - micro.getArmorLeft("torsoRear");
                            return (
                                <tr key={location} data-testid={`micro-play-location-${location}`}>
                                    <td className="min-width no-wrap">
                                        {name}
                                        {micro.isLocationDestroyed(location) ? <div className="color-red small-text">destroyed</div> : null}
                                        <div>
                                            <button className="btn btn-secondary btn-sm" type="button" title={`Roll for critical hits in the ${name}`} onClick={() => this.rollCritical(location)}>Roll Critical</button>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            {Array.from({ length: micro.getArmor(location) }, (_point, index) => (
                                                <button key={index} type="button" aria-label={`${name} armor ${index + 1}`} style={circle(false, index < armorLost)} onClick={() => { micro.setArmorDamage(location, this._toggle(armorLost, index + 1)); this._changed(); }} />
                                            ))}
                                        </div>
                                        {location === "torso" ? (
                                            <div>
                                                <span className="small-text">Rear: </span>
                                                {Array.from({ length: micro.getArmor("torsoRear") }, (_point, index) => (
                                                    <button key={index} type="button" aria-label={`Torso rear armor ${index + 1}`} style={circle(false, index < rearLost)} onClick={() => { micro.setArmorDamage("torsoRear", this._toggle(rearLost, index + 1)); this._changed(); }} />
                                                ))}
                                            </div>
                                        ) : null}
                                        <div>
                                            {Array.from({ length: micro.getStructure(location) }, (_point, index) => (
                                                <button key={index} type="button" aria-label={`${name} structure ${index + 1}`} style={circle(true, index < structureLost)} onClick={() => { micro.setStructureDamage(location, this._toggle(structureLost, index + 1)); this._changed(); }} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="small-text">
                                        {micro.getPlaySlots(location).map((slot, index) => (
                                            <div key={index} style={slot === null ? { color: "#777" } : undefined}>
                                                {slot === null ? <span style={{ display: "inline-block", width: "1.3em" }} /> : (
                                                    <button type="button" aria-label={`${name} slot ${index + 1} ${slot}`} data-testid={`micro-play-slot-${location}-${index + 1}`} style={box(micro.isSlotHit(location, index))} onClick={() => this.toggleSlot(location, index)} />
                                                )}
                                                {index + 1}. {slot ?? "Roll again"}
                                            </div>
                                        ))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {weapons.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr><th>Weapon</th><th>Loc</th><th>To-hit</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {weapons.map((line) => (
                                <tr key={line.mountIndex} style={line.destroyed ? { textDecoration: "line-through" } : undefined}>
                                    <td>{line.name}</td>
                                    <td>{micro.getLocationName(line.location)}</td>
                                    <td data-testid={`micro-play-weapon-tohit-${line.mountIndex}`}>{line.toHit ? signed(line.toHit) : "-"}</td>
                                    <td className="small-text">{line.canFire ? "Ready" : line.reasons.join("; ")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : null}

                {lots.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr><th>Ammunition</th><th>Loc</th><th>Shots</th></tr>
                        </thead>
                        <tbody>
                            {lots.map((lot, index) => (
                                <tr key={index}>
                                    <td>{lot.name}{lot.type === "cluster" ? " (cluster)" : ""}</td>
                                    <td>{micro.getLocationName(lot.location)}</td>
                                    <td className="no-wrap">
                                        <span data-testid={`micro-play-shots-${index}`}>{micro.getShotsLeft(index)}</span> of {lot.shots}{" "}
                                        <button className="btn btn-primary btn-sm" type="button" title={`Fire ${lot.name}`} disabled={micro.getShotsLeft(index) <= 0} onClick={() => { micro.setShotsFired(index, micro.getShotsFired(index) + 1); this._changed(); }}>Fire</button>
                                        {" "}
                                        <button className="btn btn-secondary btn-sm" type="button" title={`Reload ${lot.name}`} disabled={micro.getShotsFired(index) <= 0} onClick={() => { micro.setShotsFired(index, 0); this._changed(); }}>Reload</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : null}

                <ul className="small-text" data-testid="micro-play-notes">
                    {micro.getPlayNotes().map((note, index) => <li key={index}>{note}</li>)}
                </ul>
            </div>
        );
    }
}

interface IMicroMechPlayPanelProps {
    micro: MicroMech;
    onChange: (micro: MicroMech) => void;
}

interface IMicroMechPlayPanelState {
    location: MicroMechLocation;
    rear: boolean;
    damage: number;
    log: string[];
}
