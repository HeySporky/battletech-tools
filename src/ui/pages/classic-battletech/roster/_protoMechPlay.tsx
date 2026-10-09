import * as React from 'react';
import ProtoMech, { PROTOMECH_CRITICAL_BOXES, PROTOMECH_CRITICAL_EFFECTS, PROTOMECH_HIT_LOCATIONS } from '../../../../classes/protomech';
import { ProtoMechLocation } from '../../../../data/protomech-construction';

const rollD6 = (): number => 1 + Math.floor(Math.random() * 6);

/**
 * Play panel for a ProtoMech Point in the roster: each ProtoMech has its own armor, structure, critical hit boxes,
 * ammunition and warrior. A hit is placed by the ProtoMech Hit Location Table, or rolled (Total Warfare pp.185-187).
 */
export default class ProtoMechPlayPanel extends React.Component<IProtoMechPlayPanelProps, IProtoMechPlayPanelState> {

    constructor(props: IProtoMechPlayPanelProps) {
        super(props);
        this.state = {
            unit: 0,
            location: "torso",
            damage: 5,
            log: [],
        };
    }

    private _changed = (): void => {
        this.props.onChange(this.props.point);
    }

    private _log = (lines: string[]): void => {
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
    }

    applyHit = (): void => {
        const point = this.props.point;
        const lines = point.applyDamage(this.state.unit, this.state.location, this.state.damage);
        this._log([`ProtoMech ${this.state.unit + 1}: ${this.state.damage} damage to the ${point.getLocationName(this.state.location)}.`, ...lines]);
        this._changed();
    }

    // Rolls 2D6 on the ProtoMech Hit Location Table; a 3 or 11 is a near miss.
    rollHit = (): void => {
        const point = this.props.point;
        const roll = rollD6() + rollD6();
        const location = PROTOMECH_HIT_LOCATIONS[roll];
        if (!location) {
            this._log([`ProtoMech ${this.state.unit + 1}: rolled ${roll}, a near miss. No damage${point.isGlider() ? "; a Glider in flight loses 1 WiGE Cruising MP (IO:AE p.94)" : ""}.`]);
            return;
        }
        const lines = point.applyDamage(this.state.unit, location, this.state.damage);
        this._log([`ProtoMech ${this.state.unit + 1}: rolled ${roll}, ${this.state.damage} damage to the ${point.getLocationName(point.getLocations().includes(location) ? location : "torso")}.`, ...lines]);
        this.setState({ location: point.getLocations().includes(location) ? location : "torso" });
        this._changed();
    }

    // Clicking a circle marks damage up to it; clicking the last marked circle clears it.
    setDamage = (unit: number, location: ProtoMechLocation, points: number): void => {
        const point = this.props.point;
        point.setLocationDamage(unit, location, point.getLocationDamage(unit, location) === points ? points - 1 : points);
        this._changed();
    }

    setCriticals = (unit: number, location: ProtoMechLocation, hits: number): void => {
        const point = this.props.point;
        point.setCriticals(unit, location, point.getCriticals(unit, location) === hits ? hits - 1 : hits);
        this._changed();
    }

    render = (): React.ReactNode => {
        const point = this.props.point;
        const lines = point.getWeaponLines();
        const units = Array.from({ length: point.getPointSize() }, (_unused, unit) => unit);
        const circle = (structure: boolean, marked: boolean): React.CSSProperties => ({
            display: "inline-block", width: "1.2em", height: "1.2em", border: "1px solid #000", borderRadius: "50%", padding: 0,
            marginRight: "0.15em", background: marked ? "#000" : structure ? "#999" : "#fff", verticalAlign: "middle", cursor: "pointer",
        });
        const box = (marked: boolean): React.CSSProperties => ({
            display: "inline-block", width: "1.1em", height: "1.1em", border: "1px solid #000", padding: 0, marginRight: "0.2em",
            background: marked ? "#000" : "#fff", verticalAlign: "middle", cursor: "pointer",
        });

        return (
            <div className="text-section" data-testid="protomech-play-panel">
                <h3>{point.getDisplayName()}</h3>
                <p>
                    {point.getTons()}-ton {point.getChassisName()} ProtoMech &nbsp;|&nbsp; Movement {point.getMovementText()} &nbsp;|&nbsp;
                    Gunnery {point.getGunnery()} &nbsp;|&nbsp; Frenzy attack {point.getFrenzyDamage()} damage &nbsp;|&nbsp;
                    {point.getActiveUnits()} of {point.getPointSize()} active
                </p>

                <fieldset className="fieldset">
                    <legend>A Hit on the Point</legend>
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        ProtoMech:{" "}
                        <select aria-label="ProtoMech hit" data-testid="protomech-play-unit" value={this.state.unit} style={{ width: "auto" }} onChange={(e) => this.setState({ unit: +e.currentTarget.value })}>
                            {units.map((unit) => <option key={unit} value={unit}>{unit + 1}{point.isUnitDestroyed(unit) ? " (destroyed)" : ""}</option>)}
                        </select>
                    </label>
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        Damage:{" "}
                        <input type="number" min={1} max={999} aria-label="Damage" data-testid="protomech-play-damage" style={{ width: "5em" }} value={this.state.damage} onChange={(e) => this.setState({ damage: Math.min(999, Math.max(1, Math.round(+e.currentTarget.value) || 1)) })} />
                    </label>
                    <label style={{ display: "inline-block", marginRight: "1em" }}>
                        Location:{" "}
                        <select aria-label="Hit location" data-testid="protomech-play-location" value={this.state.location} style={{ width: "auto" }} onChange={(e) => this.setState({ location: e.currentTarget.value as ProtoMechLocation })}>
                            {point.getLocations().map((location) => <option key={location} value={location}>{point.getLocationName(location)}</option>)}
                        </select>
                    </label>
                    <button className="btn btn-primary btn-sm" type="button" data-testid="protomech-play-apply" onClick={this.applyHit}>Apply</button>
                    &nbsp;
                    <button className="btn btn-primary btn-sm" type="button" data-testid="protomech-play-roll" onClick={this.rollHit}>Roll the Location (2D6)</button>
                    <p className="small-text">
                        Damage beyond a location passes to the torso. Whenever internal structure is damaged, roll on the Determining
                        Critical Hits Table and cross off a box for each critical hit; each attack that crosses off a box also wounds
                        the warrior (TW p. 186).
                    </p>
                    {this.state.log.length > 0 ? (
                        <ul className="small-text" data-testid="protomech-play-log">
                            {this.state.log.map((line, index) => <li key={index}>{line}</li>)}
                        </ul>
                    ) : null}
                </fieldset>

                {units.map((unit) => {
                    const movement = point.getPlayMovement(unit);
                    const destroyed = point.isUnitDestroyed(unit);
                    return (
                        <fieldset className="fieldset" key={unit} data-testid={`protomech-play-unit-${unit}`}>
                            <legend>ProtoMech {unit + 1}{destroyed ? " - DESTROYED" : ""}</legend>
                            <p>
                                <strong>Movement</strong>: <span data-testid={`protomech-play-move-${unit}`}>{movement.text}</span>
                                {movement.toHit > 0 ? <> &nbsp;|&nbsp; <strong>To-hit</strong>: +{movement.toHit} on all attacks{movement.toHit >= 2 ? ", none at long range" : ""}</> : null}
                                &nbsp;|&nbsp; <strong>Warrior hits</strong>:{" "}
                                {Array.from({ length: 6 }, (_hit, hit) => (
                                    <button key={hit} type="button" aria-label={`ProtoMech ${unit + 1} warrior hit ${hit + 1}`} style={box(hit < point.getPilotHits(unit))} onClick={() => { point.setPilotHits(unit, point.getPilotHits(unit) === hit + 1 ? hit : hit + 1); this._changed(); }} />
                                ))}
                            </p>
                            <table className="table">
                                <thead>
                                    <tr><th>2D6</th><th>Location</th><th>Armor and Structure</th><th>Critical Hits</th></tr>
                                </thead>
                                <tbody>
                                    {point.getLocations().map((location) => {
                                        const damage = point.getLocationDamage(unit, location);
                                        const armor = point.getArmor(location);
                                        const criticals = point.getCriticals(unit, location);
                                        const rolls = Object.entries(PROTOMECH_HIT_LOCATIONS).filter((entry) => entry[1] === location).map((entry) => entry[0]).join(", ");
                                        return (
                                            <tr key={location}>
                                                <td className="min-width no-wrap">{rolls}</td>
                                                <td className="min-width no-wrap">{point.getLocationName(location)}{point.isLocationDestroyed(unit, location) ? <div className="color-red small-text">destroyed</div> : null}</td>
                                                <td>
                                                    {Array.from({ length: armor + point.getStructure(location) }, (_point, index) => (
                                                        <button
                                                            key={index} type="button"
                                                            aria-label={`ProtoMech ${unit + 1} ${point.getLocationName(location)} ${index < armor ? "armor" : "structure"} ${index + 1}`}
                                                            style={circle(index >= armor, index < damage)}
                                                            onClick={() => this.setDamage(unit, location, index + 1)}
                                                        />
                                                    ))}
                                                </td>
                                                <td className="small-text">
                                                    {PROTOMECH_CRITICAL_EFFECTS[location].slice(0, PROTOMECH_CRITICAL_BOXES[location]).map((effect, index) => (
                                                        <div key={index}>
                                                            <button type="button" aria-label={`ProtoMech ${unit + 1} ${point.getLocationName(location)} critical hit ${index + 1}`} style={box(index < criticals)} onClick={() => this.setCriticals(unit, location, index + 1)} />
                                                            {effect}
                                                        </div>
                                                    ))}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {lines.length > 0 ? (
                                <table className="table">
                                    <thead>
                                        <tr><th>Weapon</th><th>Loc</th><th>Dmg</th><th>Min</th><th>Sht</th><th>Med</th><th>Lng</th><th>Ammo</th><th>Lost</th></tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((line) => {
                                            const lost = point.isMountLost(unit, line.index);
                                            return (
                                                <tr key={line.index} style={lost ? { textDecoration: "line-through" } : undefined}>
                                                    <td>{line.name}</td>
                                                    <td>{line.location}</td>
                                                    <td>{line.damage}</td>
                                                    <td>{line.long ? line.min || "-" : ""}</td>
                                                    <td>{line.long ? line.short : ""}</td>
                                                    <td>{line.long ? line.medium : ""}</td>
                                                    <td>{line.long ? line.long : ""}</td>
                                                    <td className="no-wrap">
                                                        {line.shots === null ? "" : (
                                                            <>
                                                                <span data-testid={`protomech-play-shots-${unit}-${line.index}`}>{point.getShotsLeft(unit, line.index)}</span> of {line.shots}{" "}
                                                                <button className="btn btn-primary btn-sm" type="button" title={`Fire ${line.name}`} disabled={lost || point.getShotsLeft(unit, line.index) <= 0} onClick={() => { point.setShotsFired(unit, line.index, point.getShotsFired(unit, line.index) + 1); this._changed(); }}>Fire</button>
                                                                {" "}
                                                                <button className="btn btn-secondary btn-sm" type="button" title={`Reload ${line.name}`} disabled={point.getShotsFired(unit, line.index) <= 0} onClick={() => { point.setShotsFired(unit, line.index, 0); this._changed(); }}>Reload</button>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <input type="checkbox" aria-label={`ProtoMech ${unit + 1} ${line.name} lost`} checked={lost} onChange={(e) => { point.setMountLost(unit, line.index, e.currentTarget.checked); this._changed(); }} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : null}
                        </fieldset>
                    );
                })}
                {point.getNotes().length > 0 ? <p className="small-text">{point.getNotes().join(" ")}</p> : null}
            </div>
        );
    }
}

interface IProtoMechPlayPanelProps {
    point: ProtoMech;
    onChange: (point: ProtoMech) => void;
}

interface IProtoMechPlayPanelState {
    /** The ProtoMech of the Point the next hit strikes. */
    unit: number;
    location: ProtoMechLocation;
    damage: number;
    log: string[];
}
