import * as React from 'react';
import Building, { BUILDING_CRITICAL_HITS } from '../../../../classes/building';
import { buildingSummary } from './_buildingGroupTable';

const roll1D6 = (): number => Math.floor(Math.random() * 6) + 1;

/**
 * Play panel for a gun emplacement or other building in the roster: resolve attacks against a hex with scaled
 * damage, armor and the Damage Threshold (TO:AR pp.118-119, 124, 128), roll on the Advanced Building Critical
 * Hits Table, and track each hex's weapons, gunners, turret and ammunition.
 */
export default class BuildingPlayPanel extends React.Component<IBuildingPlayPanelProps, IBuildingPlayPanelState> {

    constructor(props: IBuildingPlayPanelProps) {
        super(props);
        this.state = {
            hex: 1,
            damage: 5,
            scaled: true,
            fromInside: false,
            criticalHex: 0,
            roll: "",
            die: "",
            aimedShot: false,
            log: [],
        };
    }

    private _changed = (): void => {
        this.props.onChange(this.props.building);
    }

    private _log = (lines: string[]): void => {
        this.setState((state) => ({ log: [...lines, ...state.log].slice(0, 40) }));
    }

    resolve = (): void => {
        const hex = Math.min(this.state.hex, this.props.building.getHexes());
        const result = this.props.building.applyDamage(hex, this.state.damage, this.state.scaled, this.state.fromInside);
        this._log(result.lines);
        if( result.criticalRoll ) this.setState({ criticalHex: hex });
        this._changed();
    }

    // Dice left blank are rolled here; filled in, they are the players' own roll.
    resolveCritical = (): void => {
        const hex = this.state.criticalHex || Math.min(this.state.hex, this.props.building.getHexes());
        const roll = +this.state.roll >= 2 ? +this.state.roll : roll1D6() + roll1D6();
        const die = +this.state.die >= 1 ? +this.state.die : roll1D6();
        this._log(this.props.building.resolveCriticalHit(hex, roll, die, this.state.aimedShot));
        this.setState({ criticalHex: 0, roll: "", die: "" });
        this._changed();
    }

    render = (): React.ReactNode => {
        const building = this.props.building;
        const classification = building.getClassification();
        const type = building.getType();
        const hexes = Array.from({ length: building.getHexes() }, (_unused, index) => index + 1);
        const hexLabel = building.getHexLabel() === "hex" ? "Hex" : "Hexside";
        const selectedHex = Math.min(this.state.hex, building.getHexes());
        const mounts = building.getEquipment();

        return (
            <div className="building-play" data-testid="building-play">
                <h3>{building.getDisplayName()} <small>({buildingSummary(building)})</small></h3>
                {building.isDestroyed() ? <h3 className="color-red text-center">DESTROYED</h3> : null}
                <p>
                    {building.getMinimumGunners() > 0 ? <><strong>Gunnery</strong>: {building.getGunnery()} &nbsp;|&nbsp;</> : null}
                    <strong>Damage Scaling</strong>: x{classification.damageToBuilding} to the building, x{classification.damageToUnits} to units the building damages &nbsp;|&nbsp;
                    <strong>Entering a {building.getHexLabel()}</strong>: {type.mpCost === null ? "units cannot enter" : `+${type.mpCost} MP`}
                    {type.pilotingModifier === null ? "" : `, Piloting/Driving Skill Roll +${type.pilotingModifier}`}
                </p>
                {building.isGunEmplacement() ? (
                    <p className="small-text">A gun emplacement stacks, attacks and is attacked as a stationary vehicle, and tracks damage as a building (TO:AR p.115).</p>
                ) : null}

                {hexes.map((hex) => {
                    const state = building.getHexState(hex);
                    const hexMounts = mounts.filter((mount) => mount.hex === hex);
                    const hasWeapons = hexMounts.some((mount) => !mount.item.isAmmo && /Weapons$/.test(mount.item.category));
                    const hasTurret = hexMounts.some((mount) => mount.turret);
                    const name = `${hexLabel} ${hex}`;
                    return (
                        <fieldset className="fieldset" key={hex} data-testid="building-play-hex">
                            <legend>{hexes.length > 1 ? name : "Structure"}</legend>
                            {building.isHexDestroyed(hex) ? <p className="color-red"><strong>{building.isGunEmplacement() ? "DESTROYED" : "COLLAPSED"}</strong></p> : null}
                            <p className={state.armorDamage > 0 || state.cfDamage > 0 ? "color-red" : ""}>
                                {building.getArmorPoints() > 0 ? <><strong>Armor</strong>: {building.getHexArmor(hex)} of {building.getArmorPoints()} &nbsp;|&nbsp; </> : null}
                                <strong>Construction Factor</strong>: {building.getHexCF(hex)} of {building.getCF()} &nbsp;|&nbsp;
                                <strong>Damage Threshold</strong>: {building.getDamageThreshold(hex)}
                                {type.mpCost !== null ? <> &nbsp;|&nbsp; <strong>Absorbs</strong>: {building.getDamageAbsorbed(hex)} from each attack on a unit inside
                                    &nbsp;|&nbsp; <strong>Damage to a unit entering</strong>: {building.getUnitEntryDamage(hex)}</> : null}
                            </p>
                            <p>
                                {building.getArmorPoints() > 0 ? (
                                    <label>
                                        Armor left:
                                        <input type="number" aria-label={`${name} armor left`} min={0} max={building.getArmorPoints()} value={building.getHexArmor(hex)}
                                            onChange={(e) => { building.setHexArmor(hex, +e.currentTarget.value || 0); this._changed(); }} />
                                    </label>
                                ) : null}
                                <label>
                                    Construction Factor left:
                                    <input type="number" aria-label={`${name} Construction Factor left`} min={0} max={building.getCF()} value={building.getHexCF(hex)}
                                        onChange={(e) => { building.setHexCF(hex, +e.currentTarget.value || 0); this._changed(); }} />
                                </label>
                                {hexes.length > 1 && !building.isHexDestroyed(hex) ? (
                                    <button className="btn btn-secondary btn-sm" title="A collapsing hex halves the Construction Factor left on each adjacent hex of the same building (TO:AR p.121)"
                                        onClick={() => { this._log([`${name}: Construction Factor halved to ${building.halveHexCF(hex)} (adjacent hex collapsed, TO:AR p.121)`]); this._changed(); }}>
                                        Adjacent Hex Collapsed
                                    </button>
                                ) : null}
                            </p>
                            {hasWeapons ? (
                                <p>
                                    <label>
                                        <input type="checkbox" checked={state.gunnersKilled} onChange={(e) => { building.setGunnersKilled(hex, e.currentTarget.checked); this._changed(); }} />
                                        &nbsp;Gunners killed
                                    </label>
                                    <label>
                                        Turns gunners are stunned:
                                        <input type="number" aria-label={`${name} turns gunners are stunned`} min={0} max={99} value={state.gunnersStunned}
                                            onChange={(e) => { building.setGunnersStunned(hex, +e.currentTarget.value || 0); this._changed(); }} />
                                    </label>
                                    {hasTurret ? (
                                        <>
                                            <label>
                                                <input type="checkbox" checked={state.turretJammed} disabled={state.turretLocked} onChange={(e) => { building.setTurretJammed(hex, e.currentTarget.checked); this._changed(); }} />
                                                &nbsp;Turret jammed
                                            </label>
                                            <label>
                                                <input type="checkbox" checked={state.turretLocked} onChange={(e) => { building.setTurretLocked(hex, e.currentTarget.checked); this._changed(); }} />
                                                &nbsp;Turret locked
                                            </label>
                                        </>
                                    ) : null}
                                </p>
                            ) : null}
                            {hexMounts.length > 0 ? (
                                <table className="table" data-testid="building-play-equipment">
                                    <thead>
                                        <tr><th>Item</th><th>Heat</th><th>Damage</th><th>Min</th><th>Short</th><th>Medium</th><th>Long</th><th>Status</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {hexMounts.map((mount) => {
                                            const uuid = mount.item.uuid || "";
                                            const status = building.getMountStatus(uuid);
                                            const isWeapon = !mount.item.isAmmo && /Weapons$/.test(mount.item.category);
                                            return (
                                                <tr key={uuid} className={status ? "color-red" : ""}>
                                                    <td>{mount.item.name}{mount.turret ? " (T)" : ""}</td>
                                                    {mount.item.isAmmo ? (
                                                        <td colSpan={6}>
                                                            <label>
                                                                Shots left:
                                                                <input type="number" aria-label={`${mount.item.name} shots left`} min={0} max={building.getAmmoCapacity(uuid)} value={building.getAmmoShots(uuid)}
                                                                    disabled={!!status} onChange={(e) => { building.setAmmoShots(uuid, +e.currentTarget.value || 0); this._changed(); }} />
                                                                &nbsp;of {building.getAmmoCapacity(uuid)}
                                                            </label>
                                                        </td>
                                                    ) : (
                                                        <>
                                                            <td>{isWeapon ? mount.item.heat : ""}</td>
                                                            <td>{isWeapon && typeof mount.item.damage !== "object" ? mount.item.damage : ""}</td>
                                                            <td>{isWeapon ? mount.item.range?.min ?? "" : ""}</td>
                                                            <td>{isWeapon ? mount.item.range?.short ?? "" : ""}</td>
                                                            <td>{isWeapon ? mount.item.range?.medium ?? "" : ""}</td>
                                                            <td>{isWeapon ? mount.item.range?.long ?? "" : ""}</td>
                                                        </>
                                                    )}
                                                    <td>{status || "Working"}</td>
                                                    <td className="no-wrap">
                                                        {isWeapon && !building.isMountDestroyed(uuid) ? (
                                                            <button className="btn btn-secondary btn-sm" aria-label={`${mount.item.name}: ${building.hasMalfunction(uuid) ? "clear malfunction" : "malfunction"}`}
                                                                onClick={() => { building.setMalfunction(uuid, !building.hasMalfunction(uuid)); this._changed(); }}>
                                                                {building.hasMalfunction(uuid) ? "Clear Malfunction" : "Malfunction"}
                                                            </button>
                                                        ) : null}
                                                        {!mount.item.isAmmo ? (
                                                            <button className="btn btn-secondary btn-sm" aria-label={`${mount.item.name}: ${building.isMountDestroyed(uuid) ? "repair" : "destroy"}`}
                                                                onClick={() => { this._log(building.setMountDestroyed(uuid, !building.isMountDestroyed(uuid), true)); this._changed(); }}>
                                                                {building.isMountDestroyed(uuid) ? "Repair" : isWeapon ? "Destroyed" : "Inoperative"}
                                                            </button>
                                                        ) : null}
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

                <fieldset className="fieldset">
                    <legend>Resolve an Attack Against the Building</legend>
                    {hexes.length > 1 ? (
                        <label>
                            {hexLabel}:
                            <select value={selectedHex} onChange={(e) => this.setState({ hex: +e.currentTarget.value })}>
                                {hexes.map((hex) => <option key={hex} value={hex}>{hex}</option>)}
                            </select>
                        </label>
                    ) : null}
                    <label>
                        Damage:
                        <input type="number" min={0} max={10000} value={this.state.damage} onChange={(e) => this.setState({ damage: Math.max(0, +e.currentTarget.value || 0) })} />
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.scaled} onChange={(e) => this.setState({ scaled: e.currentTarget.checked })} />
                        &nbsp;Scaled Damage (x{classification.damageToBuilding}, TO:AR p.124)
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.fromInside} onChange={(e) => this.setState({ fromInside: e.currentTarget.checked })} />
                        &nbsp;Attack from inside the building (ignores armor)
                    </label>
                    <p className="small-text">
                        Enter one weapon's damage, or one Damage Value grouping, at a time. Armor is marked off first; a hit above the Damage Threshold that reaches
                        the Construction Factor calls for a critical hit roll (TO:AR pp.118-119, 128).
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={this.resolve} disabled={building.isHexDestroyed(selectedHex)}>Apply Attack</button>
                </fieldset>

                <fieldset className="fieldset" data-testid="building-play-critical">
                    <legend>Advanced Building Critical Hits Table</legend>
                    {this.state.criticalHex > 0 ? <p className="color-red"><strong>A critical hit roll is due{hexes.length > 1 ? ` against ${hexLabel.toLowerCase()} ${this.state.criticalHex}` : ""}.</strong></p> : null}
                    <p className="small-text">{BUILDING_CRITICAL_HITS.map((row) => `${row.min === row.max ? row.min : `${row.min}-${row.max}`}: ${row.name}`).join("; ")}.</p>
                    <label>
                        2D6 roll:
                        <input type="number" min={2} max={12} placeholder="rolled for you" value={this.state.roll} onChange={(e) => this.setState({ roll: e.currentTarget.value })} />
                    </label>
                    <label>
                        1D6 roll:
                        <input type="number" min={1} max={6} placeholder="rolled for you" value={this.state.die} onChange={(e) => this.setState({ die: e.currentTarget.value })} />
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.aimedShot} onChange={(e) => this.setState({ aimedShot: e.currentTarget.checked })} />
                        &nbsp;Successful aimed shot (+2)
                    </label>
                    <button className="btn btn-primary btn-sm" onClick={this.resolveCritical}>Resolve Critical Hit</button>
                </fieldset>

                {this.state.log.length ? (
                    <ul className="small-text" data-testid="building-play-log">
                        {this.state.log.map((entry, index) => <li key={index}>{entry}</li>)}
                    </ul>
                ) : null}
            </div>
        )
    }
}

interface IBuildingPlayPanelProps {
    building: Building;
    onChange: (building: Building) => void;
}

interface IBuildingPlayPanelState {
    hex: number;
    damage: number;
    scaled: boolean;
    fromInside: boolean;
    /** The hex a critical hit roll is due against, or 0. */
    criticalHex: number;
    roll: string;
    die: string;
    aimedShot: boolean;
    log: string[];
}
