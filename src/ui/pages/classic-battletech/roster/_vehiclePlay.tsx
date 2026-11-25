import * as React from 'react';
import Vehicle, { IVehicleCriticalHits, IVehicleMotiveDamage, VEHICLE_MAX_SENSOR_HITS, VehicleMovementMode } from '../../../../classes/vehicle';
import { IDamagePerRange, IEquipmentItem, VehicleLocation } from '../../../../data/data-interfaces';
import TextSection from '../../../components/text-section';
import VehicleDiagramSVG from '../../../components/svg/vehicle-diagram-svg';
import { vehicleName } from './_vehicleGroupTable';

const MOTIVE_DAMAGE: { key: keyof IVehicleMotiveDamage; label: string }[] = [
    { key: "minor", label: "Minor (+1 driving)" },
    { key: "moderate", label: "Moderate (-1 Cruise MP, +2 driving)" },
    { key: "heavy", label: "Heavy (half Cruise MP, +3 driving)" },
    { key: "immobilized", label: "Immobilized" },
];

const CRITICALS: { key: Exclude<keyof IVehicleCriticalHits, "sensorHits" | "stabilizers">; label: string }[] = [
    { key: "driverHit", label: "Driver Hit (+2 driving)" },
    { key: "commanderHit", label: "Commander Hit (+1 to-hit)" },
    { key: "crewStunned", label: "Crew Stunned (no attacks)" },
    { key: "crewKilled", label: "Crew Killed" },
    { key: "engineHit", label: "Engine Hit (immobile)" },
    { key: "fuelTankHit", label: "Fuel Tank" },
    { key: "cargoHit", label: "Cargo/Infantry Hit" },
    { key: "turretJammed", label: "Turret Jammed" },
    { key: "turretLocked", label: "Turret Locked" },
    { key: "turretDestroyed", label: "Turret Destroyed" },
];

const formatDamage = (damage: number | IDamagePerRange | undefined): string => {
    if (damage === undefined) return "-";
    if (typeof damage === "number") return damage.toString();
    return `${damage.short}/${damage.medium}/${damage.long}`;
};

/**
 * Play-mode record sheet for a combat vehicle: click pips to mark damage, track motive damage and
 * critical hits, set movement, and see each weapon's base to-hit number (gunnery + attacker
 * modifiers + range; add the target's movement and terrain at the table).
 */
export default class VehiclePlayPanel extends React.Component<IVehiclePlayPanelProps, IVehiclePlayPanelState> {

    constructor(props: IVehiclePlayPanelProps) {
        super(props);
        this.state = {
            damageLocation: "front",
            damageAmount: 5,
        }
    }

    private _changed = (): void => {
        this.props.onChange(this.props.vehicle);
    }

    applyDamage = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.vehicle.takeDamage(this.state.damageLocation, this.state.damageAmount);
        this._changed();
    }

    resetVehicle = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.vehicle.resetInPlay();
        this._changed();
    }

    renderWeaponRow = (weapon: IEquipmentItem, gunnery: number): React.ReactNode => {
        const vehicle = this.props.vehicle;
        const modifier = vehicle.getWeaponToHitModifier(weapon);
        const status = vehicle.getWeaponStatus(weapon.uuid);
        const target = (rangeModifier: number) => modifier === null ? "-" : `${gunnery + modifier + rangeModifier}+`;
        const range = weapon.range;
        return (
            <tr key={weapon.uuid} className={status === "ok" ? "" : "color-red"}>
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
                        <option value="jammed">Jammed</option>
                        <option value="destroyed">Destroyed</option>
                    </select>
                </td>
            </tr>
        );
    }

    render = (): React.ReactNode => {
        const vehicle = this.props.vehicle;
        const inPlay = vehicle.getInPlay();
        const pilot = vehicle.getPilot();
        const locations = vehicle.getLocations();
        const weapons = vehicle.getEquipmentList().filter((item) => !item.isAmmo && (item.damage !== undefined || item.range));
        const movementModes: { mode: VehicleMovementMode; label: string; mp: number }[] = [
            { mode: "stationary", label: "Stationary", mp: 0 },
            { mode: "cruise", label: "Cruise", mp: vehicle.getEffectiveCruiseMP() },
            { mode: "flank", label: "Flank", mp: vehicle.getEffectiveFlankMP() },
        ];
        if (vehicle.getJumpMP() > 0) movementModes.push({ mode: "jump", label: "Jump", mp: vehicle.getEffectiveJumpMP() });
        const maxHexes = movementModes.find((m) => m.mode === inPlay.movementMode)?.mp ?? 0;

        return (
            <div className="vehicle-play" data-testid="vehicle-play">
                <TextSection label={vehicleName(vehicle)}>
                    <p>
                        {vehicle.getTonnage()} t {vehicle.getMotiveType().name} &ndash; Gunnery {pilot.gunnery} / Driving {pilot.piloting}
                        {pilot.name ? <> &ndash; Commander: {pilot.name}</> : null}
                    </p>
                    {vehicle.isDestroyed() ? <h3 className="color-red text-center">DESTROYED</h3> : null}
                    {vehicle.isCrashed() ? <h3 className="color-red text-center">CRASHED (rotor lost or VTOL immobilized)</h3> : null}
                    {!vehicle.isDestroyed() && vehicle.isImmobile() ? <h3 className="color-red text-center">IMMOBILE</h3> : null}

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
                            <label>
                                Take Damage:{" "}
                                <select
                                    aria-label="Damage location"
                                    value={this.state.damageLocation}
                                    onChange={(e) => this.setState({ damageLocation: e.currentTarget.value as VehicleLocation })}
                                >
                                    {locations.map((loc) => <option key={loc.tag} value={loc.tag}>{loc.name}</option>)}
                                </select>{" "}
                                <input
                                    type="number"
                                    aria-label="Damage amount"
                                    min={1}
                                    value={this.state.damageAmount}
                                    onChange={(e) => this.setState({ damageAmount: Math.max(0, +e.currentTarget.value) })}
                                    style={{ width: "4em" }}
                                />{" "}
                                <button className="btn btn-primary btn-sm" onClick={this.applyDamage}>Apply</button>
                            </label>
                            <table className="table text-center">
                                <thead>
                                    <tr><th>Location</th><th>Armor</th><th>Structure</th><th>Stabilizer Hit</th></tr>
                                </thead>
                                <tbody>
                                    {locations.map((loc) => (
                                        <tr key={loc.tag}>
                                            <td>{loc.name}</td>
                                            <td>{vehicle.getArmorRemaining(loc.tag)} / {vehicle.getArmorAllocation()[loc.tag] ?? 0}</td>
                                            <td>{vehicle.getStructureRemaining(loc.tag)} / {vehicle.getStructureAllocation()[loc.tag] ?? 0}</td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    aria-label={`${loc.name} stabilizer hit`}
                                                    checked={inPlay.criticals.stabilizers.includes(loc.tag)}
                                                    onChange={(e) => { vehicle.setStabilizerHit(loc.tag, e.currentTarget.checked); this._changed(); }}
                                                />
                                            </td>
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
                                <p>
                                    <strong>Cruise/Flank</strong>: {vehicle.getEffectiveCruiseMP()}/{vehicle.getEffectiveFlankMP()}
                                    {vehicle.getJumpMP() > 0 ? <> &nbsp;|&nbsp; <strong>Jump</strong>: {vehicle.getEffectiveJumpMP()}</> : null}
                                    <br />
                                    <strong>Attacker Movement Modifier</strong>: +{vehicle.getAttackerMovementModifier()}
                                    {" "}&nbsp;|&nbsp; <strong>Target Movement Modifier</strong>: +{vehicle.getTargetMovementModifier()}
                                    <br />
                                    <strong>Driving Skill Modifier</strong>: +{vehicle.getDrivingModifier()}
                                    {" "}(target {pilot.piloting + vehicle.getDrivingModifier()}+)
                                </p>
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend>Motive System Damage</legend>
                                {MOTIVE_DAMAGE.map((item) => (
                                    <label key={item.key} className="d-block">
                                        <input
                                            type="checkbox"
                                            checked={inPlay.motiveDamage[item.key]}
                                            onChange={(e) => { vehicle.setMotiveDamage(item.key, e.currentTarget.checked); this._changed(); }}
                                        />{" "}{item.label}
                                    </label>
                                ))}
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend>Critical Hits</legend>
                                {CRITICALS.filter((item) => vehicle.hasTurret() || !item.key.startsWith("turret")).map((item) => (
                                    <label key={item.key} className="d-block">
                                        <input
                                            type="checkbox"
                                            checked={inPlay.criticals[item.key]}
                                            onChange={(e) => { vehicle.setCriticalHit(item.key, e.currentTarget.checked); this._changed(); }}
                                        />{" "}{item.label}
                                    </label>
                                ))}
                                <label>
                                    Sensor Hits (+1 to-hit each; {VEHICLE_MAX_SENSOR_HITS} = cannot fire):{" "}
                                    <select
                                        aria-label="Sensor hits"
                                        value={inPlay.criticals.sensorHits}
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
                        To-hit numbers include gunnery, this vehicle's movement, sensor and commander hits, and stabilizer
                        damage in the weapon's location (the movement modifier applies again). Add the target's movement
                        modifier, terrain and other modifiers at the table. Minimum range penalties are not included.
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
    damageLocation: VehicleLocation;
    damageAmount: number;
}
