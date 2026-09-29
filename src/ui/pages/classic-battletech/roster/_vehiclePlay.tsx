import * as React from 'react';
import Vehicle, { IVehicleCriticalHits, VEHICLE_MAX_SENSOR_HITS, VehicleMotiveHit, VehicleMovementMode } from '../../../../classes/vehicle';
import { IDamagePerRange, IEquipmentItem, VehicleLocation } from '../../../../data/data-interfaces';
import { getVehicleHitLocation, VEHICLE_CRITICAL_EFFECT_NAMES, VehicleAttackDirection } from '../../../../data/vehicle-hit-tables';
import TextSection from '../../../components/text-section';
import VehicleDiagramSVG from '../../../components/svg/vehicle-diagram-svg';
import { vehicleName } from './_vehicleGroupTable';

const MOTIVE_LEVELS: { level: VehicleMotiveHit; label: string }[] = [
    { level: "minor", label: "Minor (+1 driving)" },
    { level: "moderate", label: "Moderate (-1 Cruising MP, +2 driving)" },
    { level: "heavy", label: "Heavy (half Cruising MP, +3 driving)" },
    { level: "immobilized", label: "Major (immobile)" },
];

type CriticalFlag = Exclude<keyof IVehicleCriticalHits, "sensorHits" | "stabilizers" | "crewStunnedTurns" | "rotorDamage">;

// Checkbox list per vehicle kind; "ground" also covers naval, hover and WiGE (TW pp. 194-198).
const CRITICALS: { key: CriticalFlag; label: string; vtol?: boolean; ground?: boolean; turret?: boolean }[] = [
    { key: "driverHit", label: "Driver Hit (+2 driving)", ground: true },
    { key: "commanderHit", label: "Commander Hit (+1 to-hit and driving)", ground: true },
    { key: "pilotHit", label: "Pilot Hit (+2 driving)", vtol: true },
    { key: "coPilotHit", label: "Co-Pilot Hit (+1 to-hit)", vtol: true },
    { key: "crewStunned", label: "Crew Stunned this turn (Cruising only, no attacks)" },
    { key: "crewKilled", label: "Crew Killed" },
    { key: "engineHit", label: "Engine Hit (immobile; no energy/pulse weapons)" },
    { key: "fuelTankHit", label: "Fuel Tank (exploded)" },
    { key: "ammoExploded", label: "Ammunition exploded" },
    { key: "cargoHit", label: "Cargo/Infantry Hit" },
    { key: "turretJammed", label: "Turret Jammed", turret: true },
    { key: "turretLocked", label: "Turret Locked", turret: true },
    { key: "turretBlownOff", label: "Turret Blown Off", turret: true },
    { key: "flightStabilizer", label: "Flight Stabilizer (Cruising only, +3 driving, +1 to-hit)", vtol: true },
    { key: "rotorsDestroyed", label: "Rotors Destroyed", vtol: true },
];

const DIRECTIONS: { value: VehicleAttackDirection; label: string }[] = [
    { value: "front", label: "Front" },
    { value: "left", label: "Left Side" },
    { value: "right", label: "Right Side" },
    { value: "rear", label: "Rear" },
];

const roll2D6 = (): number => Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;

const formatDamage = (damage: number | IDamagePerRange | undefined): string => {
    if (damage === undefined) return "-";
    if (typeof damage === "number") return damage.toString();
    return `${damage.short}/${damage.medium}/${damage.long}`;
};

type PendingRoll = { kind: "critical"; location: VehicleLocation } | { kind: "motive"; direction: VehicleAttackDirection };

/**
 * Play-mode record sheet for a combat vehicle. Attacks resolve on the Total Warfare hit location,
 * critical hit and motive system damage tables (TW pp. 192-198); pips, motive damage and critical
 * hits can also be marked by hand. Weapon to-hit numbers include gunnery and this vehicle's own
 * modifiers; add the target's movement and terrain at the table.
 */
export default class VehiclePlayPanel extends React.Component<IVehiclePlayPanelProps, IVehiclePlayPanelState> {

    constructor(props: IVehiclePlayPanelProps) {
        super(props);
        this.state = {
            direction: "front",
            damageAmount: 5,
            hitRoll: "",
            pendingRoll: null,
            pendingRollValue: "",
            log: [],
        }
    }

    private _changed = (): void => {
        this.props.onChange(this.props.vehicle);
    }

    private _log = (entries: string[], pendingRoll: PendingRoll | null, queue: PendingRoll[] = []): void => {
        this.setState((state) => ({
            log: [...entries, ...state.log].slice(0, 30),
            pendingRoll: pendingRoll ?? queue[0] ?? null,
            pendingQueue: pendingRoll ? queue : queue.slice(1),
            pendingRollValue: "",
        }));
        this._changed();
    }

    /** One attack (one Damage Value grouping): hit location, damage, then any motive/critical rolls. */
    resolveHit = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const vehicle = this.props.vehicle;
        const roll = this.state.hitRoll ? +this.state.hitRoll : roll2D6();
        const hit = getVehicleHitLocation(roll, this.state.direction, !!vehicle.getMotiveType().hasRotor);
        const location = vehicle.resolveHitArea(hit.area, this.state.direction);
        const locationName = vehicle.getLocations().find((loc) => loc.tag === location)?.name ?? location;
        const result = vehicle.takeDamage(location, this.state.damageAmount);
        const entries = [`Hit location ${roll}: ${locationName} takes ${result.armor} armor / ${result.structure} structure`
            + (location === "rotor" ? " (rotor: damage / 10, round up; -1 Cruising MP)" : "")];
        const queue: PendingRoll[] = [];
        if (hit.motive && !vehicle.getMotiveType().hasRotor) queue.push({ kind: "motive", direction: this.state.direction });
        if (hit.critical || result.criticalRoll) queue.push({ kind: "critical", location });
        if (result.locationDestroyed) entries.unshift(`${locationName} internal structure destroyed`);
        this.setState({ hitRoll: "" });
        this._log(entries, null, queue);
    }

    resolvePendingRoll = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const pending = this.state.pendingRoll;
        if (!pending) return;
        const vehicle = this.props.vehicle;
        const roll = this.state.pendingRollValue ? +this.state.pendingRollValue : roll2D6();
        const queue = this.state.pendingQueue ?? [];
        if (pending.kind === "motive") {
            const modifier = vehicle.getMotiveDamageRollModifier(pending.direction);
            const level = vehicle.rollMotiveDamage(roll, pending.direction);
            this._log([`Motive System Damage ${roll} +${modifier} = ${roll + modifier}: ${level === "none" ? "no effect" : level}`], null, queue);
        } else {
            const effect = vehicle.resolveCriticalRoll(roll, pending.location);
            const description = vehicle.applyCriticalHit(effect, pending.location);
            this._log([`Critical Hit ${roll} (${vehicle.getCriticalColumn(pending.location)}): ${effect === "none" ? VEHICLE_CRITICAL_EFFECT_NAMES.none : description}`], null, queue);
        }
    }

    skipPendingRoll = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const queue = this.state.pendingQueue ?? [];
        this.setState({ pendingRoll: queue[0] ?? null, pendingQueue: queue.slice(1), pendingRollValue: "" });
    }

    resetVehicle = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.vehicle.resetInPlay();
        this.setState({ log: [], pendingRoll: null, pendingQueue: [] });
        this._changed();
    }

    renderWeaponRow = (weapon: IEquipmentItem, gunnery: number): React.ReactNode => {
        const vehicle = this.props.vehicle;
        const modifier = vehicle.getWeaponToHitModifier(weapon);
        const status = vehicle.getWeaponStatus(weapon.uuid);
        const target = (rangeModifier: number) => modifier === null ? "-" : `${gunnery + modifier + rangeModifier}+`;
        const range = weapon.range;
        return (
            <tr key={weapon.uuid} className={status === "ok" && modifier !== null ? "" : "color-red"}>
                <td>{weapon.name}{weapon.rear ? " (R)" : ""}</td>
                <td className="text-center">{weapon.location ? vehicle.getLocations().find((loc) => loc.tag === weapon.location)?.name ?? weapon.location : "-"}</td>
                <td className="text-center">{formatDamage(weapon.damage)}</td>
                <td className="text-center no-wrap">
                    {range ? `${range.min ? range.min + " / " : ""}${range.short}/${range.medium}/${range.long}` : "-"}
                </td>
                <td className="text-center">{target(0)}</td>
                <td className="text-center">{target(2)}</td>
                <td className="text-center">{target(4)}</td>
                <td className="text-center">
                    <select
                        aria-label={`${weapon.name} status`}
                        value={status}
                        onChange={(e) => {
                            vehicle.setWeaponStatus(weapon.uuid || "", e.currentTarget.value as "ok" | "jammed" | "destroyed");
                            this._changed();
                        }}
                    >
                        <option value="ok">OK</option>
                        <option value="jammed">Malfunction</option>
                        <option value="destroyed">Destroyed</option>
                    </select>
                </td>
            </tr>
        );
    }

    render = (): React.ReactNode => {
        const vehicle = this.props.vehicle;
        const inPlay = vehicle.getInPlay();
        const crits = inPlay.criticals;
        const pilot = vehicle.getPilot();
        const locations = vehicle.getLocations();
        const isVTOL = !!vehicle.getMotiveType().hasRotor;
        const weapons = vehicle.getEquipmentList().filter((item) => !item.isAmmo && (item.damage !== undefined || item.range));
        const movementModes: { mode: VehicleMovementMode; label: string; mp: number }[] = [
            { mode: "stationary", label: "Stationary", mp: 0 },
            { mode: "cruise", label: "Cruise", mp: vehicle.getEffectiveCruiseMP() },
        ];
        if (!vehicle.isCruiseOnly()) movementModes.push({ mode: "flank", label: "Flank", mp: vehicle.getEffectiveFlankMP() });
        if (vehicle.getEffectiveJumpMP() > 0) movementModes.push({ mode: "jump", label: "Jump", mp: vehicle.getEffectiveJumpMP() });
        const maxHexes = movementModes.find((m) => m.mode === inPlay.movementMode)?.mp ?? 0;
        const cannotFire = vehicle.getCannotFireReason();
        const pending = this.state.pendingRoll;

        return (
            <div className="vehicle-play" data-testid="vehicle-play">
                <TextSection label={vehicleName(vehicle)}>
                    <p>
                        {vehicle.getTonnage()} t {vehicle.getMotiveType().name} &ndash; Gunnery {pilot.gunnery} / Driving {pilot.piloting}
                        {pilot.name ? <> &ndash; Commander: {pilot.name}</> : null}
                    </p>
                    {vehicle.isDestroyed() ? (
                        <h3 className="color-red text-center">
                            DESTROYED{crits.crewKilled ? " (crew killed)" : crits.fuelTankHit ? " (fuel tank exploded)" : crits.turretBlownOff ? " (turret blown off)" : vehicle.isSunk() ? " (sank)" : ""}
                        </h3>
                    ) : null}
                    {vehicle.isCrashed() ? <h3 className="color-red text-center">CRASHED</h3> : null}
                    {!vehicle.isDestroyed() && vehicle.isImmobile() ? <h3 className="color-red text-center">IMMOBILE (-4 to be hit)</h3> : null}
                    {crits.crewStunnedTurns > 0 ? <p className="color-red text-center">Crew stunned for {crits.crewStunnedTurns} more turn(s), starting next turn</p> : null}

                    <div className="row">
                        <div className="col-md-6">
                            <VehicleDiagramSVG
                                motive={vehicle.getMotiveType()}
                                locations={locations}
                                structure={vehicle.getStructureAllocation()}
                                armor={vehicle.getArmorAllocation()}
                                armorDamage={inPlay.armorDamage}
                                structureDamage={inPlay.structureDamage}
                                onToggleArmor={(loc, index) => { vehicle.toggleArmorPip(loc, index); this._changed(); }}
                                onToggleStructure={(loc, index) => { vehicle.toggleStructurePip(loc, index); this._changed(); }}
                            />
                            <p className="smaller-text">Click a pip to mark damage up to it; click a marked pip to clear it.</p>

                            <fieldset className="fieldset">
                                <legend>Resolve an Attack</legend>
                                <label>
                                    Attack from:{" "}
                                    <select
                                        aria-label="Attack direction"
                                        value={this.state.direction}
                                        onChange={(e) => this.setState({ direction: e.currentTarget.value as VehicleAttackDirection })}
                                    >
                                        {DIRECTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    </select>
                                </label>{" "}
                                <label>
                                    Damage:{" "}
                                    <input
                                        type="number"
                                        aria-label="Damage amount"
                                        min={1}
                                        value={this.state.damageAmount}
                                        onChange={(e) => this.setState({ damageAmount: Math.max(0, +e.currentTarget.value) })}
                                        style={{ width: "4em" }}
                                    />
                                </label>{" "}
                                <label>
                                    2D6:{" "}
                                    <input
                                        type="number"
                                        aria-label="Hit location roll"
                                        min={2}
                                        max={12}
                                        placeholder="roll"
                                        value={this.state.hitRoll}
                                        onChange={(e) => this.setState({ hitRoll: e.currentTarget.value })}
                                        style={{ width: "4em" }}
                                    />
                                </label>{" "}
                                <button className="btn btn-primary btn-sm" onClick={this.resolveHit} disabled={!!pending}>Apply Hit</button>
                                <p className="smaller-text">
                                    Leave 2D6 blank to roll. Resolve each Damage Value grouping (e.g. each 5-point LRM cluster)
                                    as its own hit. Motive and critical rolls follow the table results and any internal
                                    structure damage (TW pp. 192-197).
                                </p>
                                {pending ? (
                                    <div className="alert alert-warning" data-testid="pending-roll">
                                        <strong>{pending.kind === "motive"
                                            ? `Motive System Damage roll (+${vehicle.getMotiveDamageRollModifier(pending.direction)})`
                                            : `Critical Hit roll: ${locations.find((loc) => loc.tag === pending.location)?.name ?? pending.location}`}</strong>{" "}
                                        <input
                                            type="number"
                                            aria-label="Pending roll"
                                            min={2}
                                            max={12}
                                            placeholder="roll"
                                            value={this.state.pendingRollValue}
                                            onChange={(e) => this.setState({ pendingRollValue: e.currentTarget.value })}
                                            style={{ width: "4em" }}
                                        />{" "}
                                        <button className="btn btn-primary btn-sm" onClick={this.resolvePendingRoll}>Roll</button>{" "}
                                        <button className="btn btn-secondary btn-sm" onClick={this.skipPendingRoll}>Skip</button>
                                    </div>
                                ) : null}
                                {this.state.log.length > 0 ? (
                                    <ul className="small-text" data-testid="vehicle-play-log">
                                        {this.state.log.map((entry, index) => <li key={index}>{entry}</li>)}
                                    </ul>
                                ) : null}
                            </fieldset>

                            <table className="table text-center">
                                <thead>
                                    <tr><th>Location</th><th>Armor</th><th>Structure</th>{isVTOL ? null : <th>Stabilizer Hit</th>}</tr>
                                </thead>
                                <tbody>
                                    {locations.map((loc) => (
                                        <tr key={loc.tag}>
                                            <td>{loc.name}</td>
                                            <td>{vehicle.getArmorRemaining(loc.tag)} / {vehicle.getArmorAllocation()[loc.tag] ?? 0}</td>
                                            <td>{vehicle.getStructureRemaining(loc.tag)} / {vehicle.getStructureAllocation()[loc.tag] ?? 0}</td>
                                            {isVTOL && loc.tag === "rotor" ? null : (
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`${loc.name} stabilizer hit`}
                                                        checked={crits.stabilizers.includes(loc.tag)}
                                                        onChange={(e) => { vehicle.setStabilizerHit(loc.tag, e.currentTarget.checked); this._changed(); }}
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="col-md-6">
                            <fieldset className="fieldset">
                                <legend>Movement</legend>
                                <select
                                    aria-label="Movement mode"
                                    value={inPlay.movementMode}
                                    onChange={(e) => { vehicle.setMovement(e.currentTarget.value as VehicleMovementMode, inPlay.hexesMoved); this._changed(); }}
                                >
                                    {movementModes.map((m) => <option key={m.mode} value={m.mode}>{m.label} ({m.mp} MP)</option>)}
                                </select>{" "}
                                {inPlay.movementMode !== "stationary" ? (
                                    <label>
                                        Hexes moved:{" "}
                                        <input
                                            type="number"
                                            aria-label="Hexes moved"
                                            min={0}
                                            max={maxHexes}
                                            value={inPlay.hexesMoved}
                                            onChange={(e) => { vehicle.setMovement(inPlay.movementMode, Math.min(maxHexes, +e.currentTarget.value)); this._changed(); }}
                                            style={{ width: "4em" }}
                                        />
                                    </label>
                                ) : null}
                                {vehicle.isAirborneCapable() ? (
                                    <label className="d-block">
                                        <input
                                            type="checkbox"
                                            checked={inPlay.landed}
                                            onChange={(e) => { vehicle.setLanded(e.currentTarget.checked); this._changed(); }}
                                        />{" "}Landed (not airborne)
                                    </label>
                                ) : null}
                                {vehicle.getMotiveType().tag === "hover" ? (
                                    <label className="d-block">
                                        <input
                                            type="checkbox"
                                            checked={inPlay.overDeepWater}
                                            onChange={(e) => { vehicle.setOverDeepWater(e.currentTarget.checked); this._changed(); }}
                                        />{" "}Over Depth 1+ water (sinks if immobilized)
                                    </label>
                                ) : null}
                                <p>
                                    <strong>Cruise/Flank</strong>: {vehicle.getEffectiveCruiseMP()}/{vehicle.getEffectiveFlankMP()}
                                    {vehicle.getJumpMP() > 0 ? <> &nbsp;|&nbsp; <strong>Jump</strong>: {vehicle.getEffectiveJumpMP()}</> : null}
                                    {vehicle.isCruiseOnly() ? <> (Cruising only)</> : null}
                                    <br />
                                    <strong>Attacker Movement Modifier</strong>: +{vehicle.getAttackerMovementModifier()}
                                    {" "}&nbsp;|&nbsp; <strong>Target Movement Modifier</strong>: {vehicle.getTargetMovementModifier() >= 0 ? "+" : ""}{vehicle.getTargetMovementModifier()}
                                    <br />
                                    <strong>Driving Skill Modifier</strong>: +{vehicle.getDrivingModifier()}
                                    {" "}(target {pilot.piloting + vehicle.getDrivingModifier()}+)
                                </p>
                            </fieldset>
                            {isVTOL ? (
                                <fieldset className="fieldset">
                                    <legend>Rotor</legend>
                                    <label>
                                        Rotor hits (-1 Cruising MP each):{" "}
                                        <input
                                            type="number"
                                            aria-label="Rotor hits"
                                            min={0}
                                            value={inPlay.rotorHits}
                                            onChange={(e) => { vehicle.setRotorHits(+e.currentTarget.value); this._changed(); }}
                                            style={{ width: "4em" }}
                                        />
                                    </label>{" "}
                                    <label>
                                        Rotor Damage criticals (-1 each):{" "}
                                        <input
                                            type="number"
                                            aria-label="Rotor damage criticals"
                                            min={0}
                                            value={crits.rotorDamage}
                                            onChange={(e) => { vehicle.setRotorDamage(+e.currentTarget.value); this._changed(); }}
                                            style={{ width: "4em" }}
                                        />
                                    </label>
                                </fieldset>
                            ) : (
                                <fieldset className="fieldset">
                                    <legend>Motive System Damage</legend>
                                    {inPlay.motiveHits.length > 0 ? (
                                        <ul className="small-text">
                                            {inPlay.motiveHits.map((hit, index) => (
                                                <li key={index}>
                                                    {MOTIVE_LEVELS.find((m) => m.level === hit)?.label ?? hit}{" "}
                                                    <button
                                                        className="btn btn-secondary btn-xs"
                                                        onClick={() => { vehicle.removeMotiveHit(index); this._changed(); }}
                                                        title="Remove this motive damage result"
                                                    >x</button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="small-text">No motive damage.</p>}
                                    {MOTIVE_LEVELS.map((m) => (
                                        <button
                                            key={m.level}
                                            className="btn btn-secondary btn-xs"
                                            onClick={() => { vehicle.addMotiveHit(m.level); this._changed(); }}
                                        >+ {m.label}</button>
                                    ))}
                                    <p className="smaller-text">Movement penalties stack; each driving modifier counts once (max +6), TW p. 193.</p>
                                </fieldset>
                            )}
                            <fieldset className="fieldset">
                                <legend>Critical Hits</legend>
                                {CRITICALS.filter((item) => (isVTOL ? !item.ground : !item.vtol) && (!item.turret || vehicle.hasTurret())).map((item) => (
                                    <label key={item.key} className="d-block">
                                        <input
                                            type="checkbox"
                                            checked={!!crits[item.key]}
                                            onChange={(e) => { vehicle.setCriticalHit(item.key, e.currentTarget.checked); this._changed(); }}
                                        />{" "}{item.label}
                                    </label>
                                ))}
                                <label>
                                    Sensor Hits (+1 to-hit each; the {VEHICLE_MAX_SENSOR_HITS}th stops all fire):{" "}
                                    <select
                                        aria-label="Sensor hits"
                                        value={crits.sensorHits}
                                        onChange={(e) => { vehicle.setSensorHits(+e.currentTarget.value); this._changed(); }}
                                    >
                                        {Array.from({ length: VEHICLE_MAX_SENSOR_HITS + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </label>
                            </fieldset>
                            <button className="btn btn-secondary btn-sm" onClick={this.resetVehicle}>Reset Vehicle Damage</button>
                        </div>
                    </div>

                    <h4>Weapons</h4>
                    {cannotFire ? <p className="color-red"><strong>Cannot fire:</strong> {cannotFire}</p> : null}
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Weapon</th>
                                <th className="text-center">Loc</th>
                                <th className="text-center">Damage</th>
                                <th className="text-center">Range</th>
                                <th className="text-center">Short</th>
                                <th className="text-center">Med</th>
                                <th className="text-center">Long</th>
                                <th className="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weapons.length > 0 ? weapons.map((weapon) => this.renderWeaponRow(weapon, pilot.gunnery)) : (
                                <tr><td colSpan={8} className="text-center">No weapons</td></tr>
                            )}
                        </tbody>
                    </table>
                    <p className="smaller-text">
                        To-hit numbers include gunnery, this vehicle's movement, sensor hits, Commander/Co-Pilot/Flight
                        Stabilizer hits, and a stabilizer hit in the weapon's location (attacker movement doubled). Add
                        the target's movement modifier, terrain and other modifiers at the table. Minimum range
                        penalties are not included. Clearing a malfunction or a turret jam takes a Weapon Attack Phase
                        with no attacks (TW p. 195).
                    </p>
                </TextSection>
            </div>
        );
    }
}

interface IVehiclePlayPanelProps {
    vehicle: Vehicle;
    onChange: (vehicle: Vehicle) => void;
}

interface IVehiclePlayPanelState {
    direction: VehicleAttackDirection;
    damageAmount: number;
    hitRoll: string;
    pendingRoll: PendingRoll | null;
    pendingQueue?: PendingRoll[];
    pendingRollValue: string;
    log: string[];
}
