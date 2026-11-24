import EWarNotes from '../../../components/ewar-notes';
import * as React from 'react';
import Walker from '../../../../classes/walker';
import {
    WALKER_ATTACK_DIRECTIONS, WALKER_HIT_TABLE, WALKER_LOCATIONS, WalkerAttackDirection, WalkerLocation,
} from '../../../../data/walker-construction';
import { formatBattleValue } from '../../../../data/battle-value';

const signed = (value: number): string => (value > 0 ? `+${value}` : `${value}`);
const COLUMN_NAMES = { rightFront: "Right Front/(Rear)", front: "Front/(Rear)", leftFront: "Left Front/(Rear)" } as const;

/**
 * Play panel for a walker (Clell Flint's, Custom Homebrew, #172) in the roster: the sheet's armor, structure, critical
 * slots, pilot hits and ammunition, with the working legs, movement, modifiers and firing arcs they leave. Inspired by
 * Flint's rules (Best-of pp.36-37; Future Wars #11 pp.25-27); Total Warfare where he says "as a regular mech"; what he
 * leaves open is NGCFells's (the ledger lists it).
 */
export default class WalkerPlayPanel extends React.Component<IWalkerPlayPanelProps, IWalkerPlayPanelState> {

    constructor(props: IWalkerPlayPanelProps) {
        super(props);
        this.state = { direction: "f", inHex: false, location: "ft", damage: 5, log: [] };
    }

    private _changed = (): void => {
        this.props.onChange(this.props.walker);
        this.forceUpdate();
    }

    private _log = (lines: string[]): void => {
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
    }

    applyHit = (): void => {
        const walker = this.props.walker;
        const lines = walker.applyDamage(this.state.location, this.state.damage);
        this._log([`${this.state.damage} damage to the ${walker.getLocationName(this.state.location)}.`, ...lines]);
        this._changed();
    }

    // Rolls 2D6 on the column for the hex face the attack comes through, then applies the damage there.
    rollHit = (): void => {
        const walker = this.props.walker;
        const hit = walker.rollHitLocation(this.state.direction, this.state.inHex);
        const face = WALKER_ATTACK_DIRECTIONS.find((each) => each.tag === hit.direction)!;
        const column = this.state.inHex ? "front" : face.column;
        const lines = walker.applyDamage(hit.location, this.state.damage);
        this._log([
            `Rolled ${hit.roll} (${face.name}, ${COLUMN_NAMES[column]} column): "${hit.cell}", ${this.state.damage} damage to the ${walker.getLocationName(hit.location)}${hit.critical ? "; roll for a critical hit there" : ""}.`,
            ...lines,
        ]);
        this.setState({ location: hit.location });
        this._changed();
    }

    rollCritical = (location: WalkerLocation): void => {
        const walker = this.props.walker;
        this._log([`${walker.getLocationName(location)}:`, ...walker.rollCriticalHit(location)]);
        this._changed();
    }

    rollIndustrial = (): void => {
        this._log(["End Phase damage check:", ...this.props.walker.rollIndustrialDamageCheck()]);
        this._changed();
    }

    // Clicking a circle marks damage up to it; clicking the last marked circle clears it.
    private _toggle = (current: number, clicked: number): number => (current === clicked ? clicked - 1 : clicked);

    toggleSlot = (location: WalkerLocation, slot: number): void => {
        const walker = this.props.walker;
        const lines = walker.setSlotHit(location, slot, !walker.isSlotHit(location, slot));
        if (lines.length > 0) this._log([`${walker.getLocationName(location)}, slot ${slot + 1}:`, ...lines]);
        this._changed();
    }

    render = (): React.ReactNode => {
        const walker = this.props.walker;
        const movement = walker.getPlayMovement();
        const piloting = walker.getPilotingModifier();
        const weapons = walker.getWeaponPlayLines();
        const ammo = walker.getAmmo();
        const reason = walker.getDestroyedReason();
        const rules = walker.getEditionRules();
        const face = WALKER_ATTACK_DIRECTIONS.find((each) => each.tag === this.state.direction)!;
        const column = this.state.inHex ? "front" : face.column;
        const circle = (structure: boolean, marked: boolean): React.CSSProperties => ({
            display: "inline-block", width: "1.2em", height: "1.2em", border: "1px solid #000", borderRadius: "50%", padding: 0,
            marginRight: "0.15em", background: marked ? "#000" : structure ? "#999" : "#fff", verticalAlign: "middle", cursor: "pointer",
        });
        const box = (marked: boolean): React.CSSProperties => ({
            display: "inline-block", width: "1.1em", height: "1.1em", border: "1px solid #000", padding: 0, marginRight: "0.2em",
            background: marked ? "#000" : "#fff", verticalAlign: "middle", cursor: "pointer",
        });

        return (
            <div className="text-section" data-testid="walker-play-panel">
                <h3>{walker.getDisplayName()}{reason ? <span className="color-red"> - DESTROYED</span> : null}</h3>
                <p>
                    {walker.getTons()}-ton {walker.isIndustrial() ? "industrial " : ""}walker (Custom Homebrew, inspired by Clell Flint; NOT OFFICIAL), {rules.name} &nbsp;|&nbsp;
                    Gunnery {walker.getGunnery()} / Piloting {walker.getPiloting()} &nbsp;|&nbsp;
                    BV {formatBattleValue((edition) => walker.getSkillAdjustedBattleValue(edition), "mech", walker.getRulesEdition())}
                </p>
                {reason ? <p className="color-red" data-testid="walker-play-destroyed">{reason}</p> : null}
                <EWarNotes unit={walker} onChange={() => this._changed()} />
                <p>
                    <strong>Working legs</strong>: <span data-testid="walker-play-legs">{walker.getWorkingLegs()}</span> &nbsp;|&nbsp;
                    <strong>Movement</strong>: <span data-testid="walker-play-move">{movement.text}</span> &nbsp;|&nbsp;
                    <strong>Piloting Skill Rolls</strong>: <span data-testid="walker-play-piloting">{signed(piloting.total)}</span>
                    {piloting.lines.length > 0 ? <span className="small-text"> ({piloting.lines.join(", ")})</span> : null} &nbsp;|&nbsp;
                    <strong>Physical</strong>: <span data-testid="walker-play-kick">{walker.canKick() ? "kicks in any direction; no punches" : "no kicks or punches"}</span>
                    {walker.getSensorHits() > 0 ? <> &nbsp;|&nbsp; <strong className="color-red">Sensors</strong>: {walker.areSensorsDestroyed() ? "destroyed, no weapon attacks" : "+2 to hit"}</> : null}
                </p>
                {movement.notes.length > 0 ? <ul className="small-text">{movement.notes.map((note, index) => <li key={index}>{note}</li>)}</ul> : null}

                <fieldset className="fieldset">
                    <legend>A Hit</legend>
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        Damage:{" "}
                        <input type="number" min={1} max={999} aria-label="Damage" data-testid="walker-play-damage" style={{ width: "5em" }} value={this.state.damage} onChange={(e) => this.setState({ damage: Math.min(999, Math.max(1, Math.round(+e.currentTarget.value) || 1)) })} />
                    </label>
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        Attack from:{" "}
                        <select aria-label="Attack direction" data-testid="walker-play-direction" value={this.state.direction} style={{ width: "auto" }} onChange={(e) => this.setState({ direction: e.currentTarget.value as WalkerAttackDirection })}>
                            {WALKER_ATTACK_DIRECTIONS.map((each) => <option key={each.tag} value={each.tag}>{each.name}</option>)}
                        </select>
                    </label>
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        <input type="checkbox" aria-label="Infantry or vehicle in the walker's hex" checked={this.state.inHex} onChange={(e) => this.setState({ inHex: e.currentTarget.checked })} /> Infantry or vehicle in its hex
                    </label>
                    <button className="btn btn-primary btn-sm" type="button" data-testid="walker-play-roll" onClick={this.rollHit}>Roll the Location (2D6)</button>
                    <br />
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        Or place it:{" "}
                        <select aria-label="Hit location" data-testid="walker-play-location" value={this.state.location} style={{ width: "auto" }} onChange={(e) => this.setState({ location: e.currentTarget.value as WalkerLocation })}>
                            {WALKER_LOCATIONS.map((location) => <option key={location} value={location}>{walker.getLocationName(location)}</option>)}
                        </select>
                    </label>
                    <button className="btn btn-primary btn-sm" type="button" data-testid="walker-play-apply" onClick={this.applyHit}>Apply</button>
                    {walker.isIndustrial() ? <>&nbsp;<button className="btn btn-secondary btn-sm" type="button" data-testid="walker-play-industrial" onClick={this.rollIndustrial}>End Phase Damage Check</button></> : null}

                    <table className="table small-text" data-testid="walker-play-hit-table">
                        <thead>
                            <tr><th>2D6</th><th>{COLUMN_NAMES[column]} ({this.state.inHex ? "in its hex" : face.rear ? "read the brackets" : "read the plain text"})</th></tr>
                        </thead>
                        <tbody>
                            {WALKER_HIT_TABLE.map((row) => <tr key={row.roll}><td>{row.roll}</td><td>{row[column]}</td></tr>)}
                        </tbody>
                    </table>
                    {this.state.log.length > 0 ? (
                        <ul className="small-text" data-testid="walker-play-log">
                            {this.state.log.map((line, index) => <li key={index}>{line}</li>)}
                        </ul>
                    ) : null}
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Pilot</legend>
                    <strong>Pilot hits</strong>:{" "}
                    {Array.from({ length: 6 }, (_hit, hit) => (
                        <button key={hit} type="button" aria-label={`Pilot hit ${hit + 1}`} style={box(hit < walker.getPilotHits())} onClick={() => { walker.setPilotHits(this._toggle(walker.getPilotHits(), hit + 1)); this._changed(); }} />
                    ))}
                    <span className="small-text"> One for each hit on the control section, two for an ammunition explosion.</span>
                </fieldset>

                <table className="table">
                    <thead>
                        <tr><th>Location</th><th>Armor and Structure</th><th>Critical Slots</th></tr>
                    </thead>
                    <tbody>
                        {WALKER_LOCATIONS.map((location) => {
                            const name = walker.getLocationName(location);
                            const armorLost = walker.getArmor(location) - walker.getArmorLeft(location);
                            const structureLost = walker.getStructure(location) - walker.getStructureLeft(location);
                            return (
                                <tr key={location} data-testid={`walker-play-location-${location}`}>
                                    <td className="min-width no-wrap">
                                        {name}
                                        {walker.isLocationDestroyed(location) ? <div className="color-red small-text">destroyed</div> : null}
                                        <div>
                                            <button className="btn btn-secondary btn-sm" type="button" title={`Roll for critical hits in the ${name}`} onClick={() => this.rollCritical(location)}>Roll Critical</button>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            {Array.from({ length: walker.getArmor(location) }, (_point, index) => (
                                                <button key={index} type="button" aria-label={`${name} armor ${index + 1}`} style={circle(false, index < armorLost)} onClick={() => { walker.setArmorDamage(location, this._toggle(armorLost, index + 1)); this._changed(); }} />
                                            ))}
                                        </div>
                                        <div>
                                            {Array.from({ length: walker.getStructure(location) }, (_point, index) => (
                                                <button key={index} type="button" aria-label={`${name} structure ${index + 1}`} style={circle(true, index < structureLost)} onClick={() => { walker.setStructureDamage(location, this._toggle(structureLost, index + 1)); this._changed(); }} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="small-text">
                                        {walker.getSlots(location).map((slot, index) => (
                                            <div key={index} style={slot === null ? { color: "#777" } : undefined}>
                                                {slot === null ? <span style={{ display: "inline-block", width: "1.3em" }} /> : (
                                                    <button type="button" aria-label={`${name} slot ${index + 1} ${slot}`} data-testid={`walker-play-slot-${location}-${index + 1}`} style={box(walker.isSlotHit(location, index))} onClick={() => this.toggleSlot(location, index)} />
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
                            <tr><th>Weapon</th><th>Loc</th><th>Arcs</th><th>To-hit</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {weapons.map((line) => (
                                <tr key={line.uuid} style={line.destroyed ? { textDecoration: "line-through" } : undefined}>
                                    <td>{line.name}</td>
                                    <td>{walker.getLocationName(line.location)}{line.inTurret ? " (turret)" : ""}</td>
                                    <td data-testid={`walker-play-arcs-${line.uuid}`}>{line.arcs.length > 0 ? line.arcs.join(", ") : "in its hex"}</td>
                                    <td>{line.toHit ? signed(line.toHit) : "-"}</td>
                                    <td className="small-text">{line.canFire ? "Ready" : line.reasons.join("; ")}{line.note ? <div>{line.note}</div> : null}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : null}

                {ammo.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr><th>Ammunition</th><th>Loc</th><th>Shots</th></tr>
                        </thead>
                        <tbody>
                            {ammo.map((bin, index) => (
                                <tr key={bin.uuid}>
                                    <td>{bin.name}</td>
                                    <td>{walker.getLocationName(bin.location)}</td>
                                    <td className="no-wrap">
                                        <span data-testid={`walker-play-shots-${index}`}>{walker.getShotsLeft(index)}</span> of {walker.getAmmoShots(index)}{" "}
                                        <button className="btn btn-primary btn-sm" type="button" title={`Fire ${bin.name}`} disabled={walker.getShotsLeft(index) <= 0} onClick={() => { walker.setShotsFired(index, walker.getShotsFired(index) + 1); this._changed(); }}>Fire</button>
                                        {" "}
                                        <button className="btn btn-secondary btn-sm" type="button" title={`Reload ${bin.name}`} disabled={walker.getShotsFired(index) <= 0} onClick={() => { walker.setShotsFired(index, 0); this._changed(); }}>Reload</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : null}

                <ul className="small-text" data-testid="walker-play-notes">
                    {walker.getPlayNotes().map((note, index) => <li key={index}>{note}</li>)}
                </ul>
            </div>
        );
    }
}

interface IWalkerPlayPanelProps {
    walker: Walker;
    onChange: (walker: Walker) => void;
}

interface IWalkerPlayPanelState {
    direction: WalkerAttackDirection;
    inHex: boolean;
    location: WalkerLocation;
    damage: number;
    log: string[];
}
