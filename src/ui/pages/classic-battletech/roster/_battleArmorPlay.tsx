import * as React from 'react';
import BattleArmor, {
    BATTLE_ARMOR_ATTACK_KINDS, BATTLE_ARMOR_LOCATION_NAMES, BATTLE_ARMOR_SWARM_DEFENDER_MODIFIERS, BattleArmorAttackKind, BattleArmorCarrierKind,
} from '../../../../classes/battle-armor';
import { IBattleArmorCarrier } from '../../../../classes/battle-armor-transport';
import { findBattleArmorEquipment, findBattleArmorMineType } from '../../../../data/battle-armor-equipment';
import { findInfantryWeapon } from '../../../../data/infantry-weapons';

const formatModifier = (modifier: number): string => modifier >= 0 ? `+${modifier}` : `${modifier}`;

/**
 * Play panel for a battle armor squad in the roster: mark damage on each trooper or resolve an attack against the
 * squad (Total Warfare p.219), read its weapons, and find its Leg and Swarm attack numbers (TW pp.220-221).
 */
export default class BattleArmorPlayPanel extends React.Component<IBattleArmorPlayPanelProps, IBattleArmorPlayPanelState> {

    constructor(props: IBattleArmorPlayPanelProps) {
        super(props);
        this.state = {
            kind: "standard",
            damage: "5",
            areaEffect: false,
            defenders: 0,
            carrierPosition: "",
            carrierDamage: 5,
            log: [],
        };
    }

    // The squad mounts one of the force's units, or dismounts.
    ride = (uuid: string): void => {
        const carrier = (this.props.carriers ?? []).find((item) => item.uuid === uuid);
        this.props.squad.setRiding(carrier ? carrier.uuid : "", carrier ? carrier.kind : "mech");
        this.setState({ carrierPosition: "" });
        this._changed();
    }

    carrierHit = (position: string): void => {
        const result = this.props.squad.resolveCarrierHit(position, this.state.carrierDamage);
        this.setState({ log: [...result.log, ...this.state.log].slice(0, 40) });
        this._changed();
    }

    private _changed = (): void => {
        this.props.onChange(this.props.squad);
    }

    // "5, 5, 2" is three Damage Value groupings; each strikes a trooper of its own.
    private _groupings = (): number[] =>
        this.state.damage.split(/[^0-9]+/).filter((part) => part !== "").map((part) => Math.min(999, +part)).filter((value) => value > 0);

    resolve = (): void => {
        const lines = this.props.squad.resolveAttack(this.state.kind, this._groupings(), this.state.areaEffect);
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
        this._changed();
    }

    // Clicking a circle marks damage up to it; clicking the last marked circle clears it.
    setDamage = (trooper: number, points: number): void => {
        const squad = this.props.squad;
        squad.setTrooperDamage(trooper, squad.getTrooperDamage(trooper) === points ? points - 1 : points);
        this._changed();
    }

    render = (): React.ReactNode => {
        const squad = this.props.squad;
        const capacity = squad.getTrooperCapacity();
        const movement = squad.getPlayMovement();
        const capabilities = squad.getCapabilities();
        const active = squad.getActiveTroopers();
        const bar = squad.getAntiMechBar();
        const leg = squad.getLegAttackModifier();
        const swarm = squad.getSwarmAttackModifier();
        const defenderModifier = this.state.defenders > 0 && active > 0 ? BATTLE_ARMOR_SWARM_DEFENDER_MODIFIERS[active]?.[this.state.defenders] ?? 0 : 0;
        const armor = squad.getArmor();
        const carriers = this.props.carriers ?? [];
        const riding = squad.getRiding();
        const carrier = riding ? carriers.find((item) => item.uuid === riding.uuid) ?? null : null;
        const occupied = riding ? squad.getOccupiedPositions(riding.kind) : [];
        const carrierPosition = occupied.includes(this.state.carrierPosition) ? this.state.carrierPosition : occupied[0] ?? "";

        return (
            <div className="battle-armor-play" data-testid="battle-armor-play">
                <h3>{squad.getDisplayName()} <small>({squad.getWeightClass().name} battle armor, {squad.getSquadSize()} troopers)</small></h3>
                {squad.isDestroyed() ? <h3 className="color-red text-center">DESTROYED</h3> : null}
                <p>
                    <strong>Movement</strong>: <span data-testid="battle-armor-play-movement">{movement.text}</span> &nbsp;|&nbsp;
                    <strong>Gunnery</strong>: {squad.getGunnery()} &nbsp;|&nbsp;
                    <strong>Anti-'Mech</strong>: {capabilities.swarm || capabilities.leg ? squad.getAntiMechSkill() : "no Anti-'Mech attacks"} &nbsp;|&nbsp;
                    <strong>Mechanized</strong>: {capabilities.mechanized ? "Yes" : "No"} &nbsp;|&nbsp;
                    <strong>Armor</strong>: {armor.name}{armor.special !== "None" && squad.getArmorPoints() > 0 ? ` (${armor.special})` : ""}
                </p>
                {movement.notes.map((note, index) => <p key={index} className="small-text">{note}</p>)}
                {squad.hasDetachableMissiles() ? (
                    <label>
                        <input type="checkbox" data-testid="battle-armor-jettison-missiles" checked={!squad.carriesMissilePacks()} onChange={(e) => { squad.setMissilesJettisoned(e.currentTarget.checked); this._changed(); }} />
                        &nbsp;Detachable missile packs jettisoned
                    </label>
                ) : null}
                {squad.hasWeaponPacks() ? (
                    <label>
                        <input type="checkbox" data-testid="battle-armor-jettison-packs" checked={!squad.carriesWeaponPacks()} onChange={(e) => { squad.setPacksJettisoned(e.currentTarget.checked); this._changed(); }} />
                        &nbsp;Detachable weapon packs jettisoned (the weapons in them are lost)
                    </label>
                ) : null}

                <fieldset className="fieldset">
                    <legend>Troopers</legend>
                    {Array.from({ length: squad.getSquadSize() }, (_unused, trooper) => {
                        const damage = squad.getTrooperDamage(trooper);
                        return (
                            <div key={trooper} data-testid="battle-armor-play-trooper" className={squad.isTrooperActive(trooper) ? "" : "color-red"}>
                                <strong>{trooper + 1}</strong>&nbsp;
                                {Array.from({ length: capacity }, (_point, point) => point + 1).map((point) => (
                                    <button
                                        key={point}
                                        className={point <= damage ? "btn btn-sm btn-secondary" : "btn btn-sm btn-primary"}
                                        style={{ minWidth: "1.9em", margin: "0 0.12em 0.15em 0", padding: "0.05em 0.2em" }}
                                        title={point === capacity ? "The trooper" : `Armor point ${point}`}
                                        aria-label={`Trooper ${trooper + 1} ${point === capacity ? "trooper" : `armor point ${point}`}${point <= damage ? " (marked)" : ""}`}
                                        onClick={() => this.setDamage(trooper, point)}
                                    >
                                        {point === capacity ? "T" : point <= damage ? "x" : "o"}
                                    </button>
                                ))}
                                {squad.isTrooperActive(trooper) ? null : <strong> destroyed</strong>}
                            </div>
                        );
                    })}
                    <p className="small-text">
                        Each trooper has {squad.getArmorPoints()} armor and 1 for the soldier inside ("T"), and fights at full capacity until destroyed (TW p. 219).
                        Click a circle to mark damage up to it. {active} of {squad.getSquadSize()} active.
                    </p>
                </fieldset>

                <table className="table" data-testid="battle-armor-play-weapons">
                    <thead>
                        <tr><th>Weapon or Equipment</th><th>Location</th><th>Damage</th><th>Range (min/sht/med/lng)</th><th>Shots</th></tr>
                    </thead>
                    <tbody>
                        {squad.getItems().map((entry, index) => {
                            const equipment = findBattleArmorEquipment(entry.tag);
                            if (!equipment) return null;
                            const shots = squad.getItemShots(entry);
                            const jettisoned = (entry.dwp && !squad.carriesWeaponPacks()) || (entry.detachable && !squad.carriesMissilePacks());
                            const lost = jettisoned || squad.isItemLost(entry);
                            return (
                                <tr key={index} className={lost ? "color-red" : ""}>
                                    <td>
                                        {equipment.name}
                                        {entry.squadSupport ? " (squad support weapon: one trooper fires it)" : ""}
                                        {entry.dwp ? " (detachable weapon pack)" : ""}{entry.detachable ? " (detachable)" : ""}{jettisoned ? " - jettisoned" : ""}
                                        {entry.trooper ? ` (trooper ${entry.trooper} only${squad.isItemLost(entry) ? ": lost with the trooper" : ""})` : ""}
                                        {equipment.mineDispenser ? ` (${findBattleArmorMineType(entry.mine).name} mines)` : ""}
                                        {equipment.notes ? <div className="small-text">{equipment.notes}</div> : null}
                                    </td>
                                    <td>{BATTLE_ARMOR_LOCATION_NAMES[entry.location]}</td>
                                    <td>{equipment.damage}</td>
                                    <td>{equipment.range}</td>
                                    <td>{shots > 0 ? shots : equipment.oneShot === "always" ? "1" : ""}</td>
                                </tr>
                            );
                        })}
                        {squad.getAPMounts().map((mount, index) => {
                            const weapon = findInfantryWeapon(mount.weapon);
                            return (
                                <tr key={`ap-${index}`}>
                                    <td>Anti-personnel mount: {weapon ? weapon.name : "empty"}</td>
                                    <td>{BATTLE_ARMOR_LOCATION_NAMES[mount.location]}</td>
                                    <td>{weapon ? weapon.damage : ""}</td>
                                    <td>{weapon ? `Base range ${weapon.baseRange}` : ""}</td>
                                    <td></td>
                                </tr>
                            );
                        })}
                        {squad.getItems().length + squad.getAPMounts().length === 0 ? <tr><td colSpan={5}>No weapons or equipment</td></tr> : null}
                    </tbody>
                </table>
                <p className="small-text">
                    A non-missile weapon attack by the squad rolls on the Cluster Hits Table for the troopers active to find how many hit (TW p. 218).
                    Attacks by non-infantry units against the squad add 1 to the to-hit number (TW p. 219).
                </p>

                <fieldset className="fieldset" data-testid="battle-armor-play-antimech">
                    <legend>Anti-'Mech Attacks</legend>
                    {bar ? <p>{bar}</p> : (
                        <>
                            <p>
                                <strong>Leg attack</strong>: {leg === null ? "not possible" : `Anti-'Mech Skill ${squad.getAntiMechSkill()} ${formatModifier(leg)} = ${squad.getAntiMechSkill() + leg}; ${squad.getLegAttackDamage()} damage on the Kick Location Table and a roll on the Determining Critical Hits Table`}
                            </p>
                            <p>
                                <strong>Swarm attack</strong>: {swarm === null ? "not possible" : `Anti-'Mech Skill ${squad.getAntiMechSkill()} ${formatModifier(swarm)}${defenderModifier ? ` ${formatModifier(defenderModifier)}` : ""} = ${squad.getAntiMechSkill() + swarm + defenderModifier}`}
                                {swarm !== null && squad.getAntiMechBonusDamage() > 0 ? `; the myomer booster adds ${squad.getAntiMechBonusDamage()} damage` : ""}
                            </p>
                            {swarm !== null ? (
                                <label>
                                    Friendly mechanized battle armor troopers riding the target:
                                    <select value={this.state.defenders} onChange={(e) => this.setState({ defenders: +e.currentTarget.value })}>
                                        {[0, 1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count === 0 ? "None" : count}</option>)}
                                    </select>
                                </label>
                            ) : null}
                            <p className="small-text">
                                Modifiers by troopers active (Leg Attacks and Swarm Attacks Tables, TW p. 221); add target movement and terrain. A prone
                                'Mech is -2, an immobile 'Mech or vehicle -4, a vehicle -2 to a swarm attack. Claws with magnets are counted.
                            </p>
                        </>
                    )}
                    {capabilities.notes.map((note, index) => <p key={index} className="small-text">{note}</p>)}
                </fieldset>

                {capabilities.mechanized ? (
                    <fieldset className="fieldset" data-testid="battle-armor-play-transport">
                        <legend>Mechanized Battle Armor</legend>
                        <label>
                            Riding:
                            <select data-testid="battle-armor-play-carrier" value={carrier ? carrier.uuid : ""} onChange={(e) => this.ride(e.currentTarget.value)}>
                                <option value="">On foot</option>
                                {carriers.map((item) => (
                                    <option key={item.uuid} value={item.uuid}>
                                        {item.name}{item.kind === "mech" ? (item.omni ? " (OmniMech)" : " ('Mech, not an Omni)") : item.omni ? " (OmniVehicle)" : item.omni === false ? " (vehicle, not an Omni)" : " (vehicle)"}{item.carrying ? `, carrying ${item.carrying}` : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {carriers.length === 0 ? <p className="small-text">Add a 'Mech or vehicle to the force for the squad to ride.</p> : null}
                        {riding && carrier ? (
                            <>
                                {carrier.carrying ? (
                                    <p className="color-red" data-testid="battle-armor-play-carrier-full">{carrier.name} already carries {carrier.carrying}: a carrier may transport one battle armor unit at a time (TW p. 226).</p>
                                ) : null}
                                {carrier.omni === false && !squad.hasMagneticClamps() ? (
                                    <p className="color-red" data-testid="battle-armor-play-not-omni">{carrier.name} is not an Omni: only battle armor with magnetic clamps may ride it (TW p. 227).</p>
                                ) : null}
                                {carrier.omni === null && !squad.hasMagneticClamps() ? (
                                    <p className="small-text">Without magnetic clamps the squad may only ride an Omni (TW p. 227).</p>
                                ) : null}
                                <table className="table">
                                    <thead><tr><th>Trooper</th><th>Rides on</th></tr></thead>
                                    <tbody>
                                        {Array.from({ length: squad.getSquadSize() }, (_unused, trooper) => (
                                            <tr key={trooper} className={squad.isTrooperActive(trooper) ? "" : "color-red"}>
                                                <td>{trooper + 1}</td>
                                                <td>{squad.getTransportPosition(trooper, riding.kind as BattleArmorCarrierKind)}{squad.isTrooperActive(trooper) ? "" : " (destroyed)"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="small-text">
                                    {riding.kind === "mech"
                                        ? "The 'Mech may not fire a torso-mounted weapon from a location a trooper occupies, and may not dump ammunition with a trooper on a rear torso."
                                        : "The vehicle may not fire a weapon from a side or rear location a trooper occupies; its turret is free. It may spend no VTOL, WiGE or Jumping MP."}
                                    {" "}An Omni loses no MP; a standard unit carrying a squad with magnetic clamps loses 1 Walking or Cruising MP. The squad cannot be
                                    attacked while it rides: it takes damage only when the carrier is hit where a trooper rides (TW pp. 226-227).
                                </p>
                                {occupied.length > 0 ? (
                                    <>
                                        <label>
                                            Carrier hit in:
                                            <select value={carrierPosition} onChange={(e) => this.setState({ carrierPosition: e.currentTarget.value })}>
                                                {occupied.map((position) => <option key={position} value={position}>{position}</option>)}
                                            </select>
                                        </label>
                                        <label>
                                            Damage:
                                            <input type="number" min={1} max={999} value={this.state.carrierDamage} onChange={(e) => this.setState({ carrierDamage: Math.max(1, +e.currentTarget.value || 1) })} />
                                        </label>
                                        <button className="btn btn-primary btn-sm" data-testid="battle-armor-play-carrier-hit" onClick={() => this.carrierHit(carrierPosition)}>Roll for the Troopers There</button>
                                        <p className="small-text">On 1D6 of 5-6 the trooper takes the damage first; what is left goes on to the carrier (TW p. 227).</p>
                                    </>
                                ) : null}
                            </>
                        ) : null}
                    </fieldset>
                ) : null}

                <fieldset className="fieldset">
                    <legend>Resolve an Attack Against the Squad</legend>
                    <label>
                        Attack Type:
                        <select value={this.state.kind} onChange={(e) => this.setState({ kind: e.currentTarget.value as BattleArmorAttackKind })}>
                            {BATTLE_ARMOR_ATTACK_KINDS.map((item) => <option key={item.tag} value={item.tag}>{item.name}</option>)}
                        </select>
                    </label>
                    <label>
                        Damage Value groupings:
                        <input type="text" data-testid="battle-armor-play-damage" value={this.state.damage} onChange={(e) => this.setState({ damage: e.currentTarget.value.slice(0, 80) })} />
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.areaEffect} onChange={(e) => this.setState({ areaEffect: e.currentTarget.checked })} />
                        &nbsp;Area-effect weapon (every trooper takes the damage)
                    </label>
                    <p className="small-text">
                        Enter each Damage Value grouping, separated by commas ("5, 5, 2" for a cluster weapon). Each grouping strikes a trooper found
                        with 1D6; damage beyond what destroys that trooper is wasted (TW p. 219).
                    </p>
                    <button className="btn btn-primary btn-sm" data-testid="battle-armor-play-apply" onClick={this.resolve} disabled={squad.isDestroyed() || this._groupings().length === 0}>Apply Attack</button>
                </fieldset>

                {this.state.log.length ? (
                    <ul className="small-text" data-testid="battle-armor-play-log">
                        {this.state.log.map((entry, index) => <li key={index}>{entry}</li>)}
                    </ul>
                ) : null}
            </div>
        )
    }
}

export interface IBattleArmorPlayCarrier extends IBattleArmorCarrier {
    /** Another battle armor unit already riding it, by name. */
    carrying?: string;
}

interface IBattleArmorPlayPanelProps {
    squad: BattleArmor;
    /** The force's 'Mechs and vehicles, which the squad may ride. */
    carriers?: IBattleArmorPlayCarrier[];
    onChange: (squad: BattleArmor) => void;
}

interface IBattleArmorPlayPanelState {
    kind: BattleArmorAttackKind;
    /** Damage Value groupings as typed. */
    damage: string;
    areaEffect: boolean;
    /** Friendly mechanized battle armor troopers on the target of a swarm attack. */
    defenders: number;
    carrierPosition: string;
    carrierDamage: number;
    log: string[];
}
