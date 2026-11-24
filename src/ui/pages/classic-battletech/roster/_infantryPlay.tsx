import * as React from 'react';
import InfantryPlatoon, { INFANTRY_ATTACK_KINDS, INFANTRY_ENGINEER_TASKS, INFANTRY_SPECIAL_FEATURES, InfantryAttackKind } from '../../../../classes/infantry-platoon';

const formatModifier = (modifier: number): string => modifier > 0 ? `+${modifier}` : `${modifier}`;

/**
 * Play panel for a conventional infantry platoon in the roster: resolve attacks against it (Total Warfare
 * pp.215-217) or mark troopers off by hand, and read the damage it does with the troopers it has left.
 */
export default class InfantryPlayPanel extends React.Component<IInfantryPlayPanelProps, IInfantryPlayPanelState> {

    constructor(props: IInfantryPlayPanelProps) {
        super(props);
        this.state = {
            line: 0,
            kind: "direct",
            damage: 5,
            clearTerrain: false,
            stunDice: 7,
            atmosphere: "standard",
            moraleFrom: "",
            gunsToFire: 1,
            shotsEach: 1,
            roll: 7,
            inferno: false,
            overWater: false,
            extraPlatoons: 0,
            wounded: 5,
            dropRolls: "",
            environmentDamage: 5,
            log: [],
        };
    }

    private _say = (lines: string[]): void => {
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
        this._changed();
    }

    /** Specialized infantry in play (TO:AUE pp.152-153, 162-163): the engineer task and its counters, paramedics, a combat drop, TAG and XCT. */
    renderSpecialties = (platoon: InfantryPlatoon): React.ReactNode => {
        const progress = platoon.getEngineerProgress();
        const task = progress?.task;
        const number = (value: number, set: (value: number) => void, max: number = 1000): React.ReactNode => (
            <input type="number" min={0} max={max} value={value} onChange={(e) => set(Math.max(0, +e.currentTarget.value || 0))} />
        );
        return (
            <fieldset className="fieldset" data-testid="infantry-specialties">
                <legend>Specialized Infantry</legend>
                <p className="small-text">{platoon.getSpecialtySheetText(true)}. Veteran or better; the most restrictive limits apply (TO:AUE p.152).</p>
                {progress ? (
                    <div data-testid="infantry-engineers">
                        <label>
                            Task (designated before the scenario):
                            <select value={task} onChange={(e) => { platoon.setEngineerTask(e.currentTarget.value); this._changed(); }}>
                                {platoon.getAvailableEngineerTasks().map((item) => <option key={item.tag} value={item.tag}>{item.name}</option>)}
                            </select>
                        </label>
                        <p className="small-text">{INFANTRY_ENGINEER_TASKS.find((item) => item.tag === task)?.text}</p>
                        {progress.needed !== null ? <p><strong>Work</strong>: {progress.turns} of {progress.needed} turns{task === "bridge" ? ` | bridge units spent ${progress.bridgeUnits} of 2` : ""}{task === "demolition" ? ` | damage set ${platoon.getDemolitionDamage()}` : ""}</p> : null}
                        {task === "sensor" ? <p><strong>Remote Sensors</strong>: {progress.sensors} of {progress.sensorsMax} set</p> : null}
                        {task === "firefighting" ? <p><strong>Turns in a row on this fire</strong>: {progress.fireTurns}</p> : null}
                        {task === "bridge" || task === "trench" || task === "demolition" ? (
                            <>
                                <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.workEngineers(false))}>Work a Turn</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => this._say(platoon.workEngineers(true))}>Work a Turn (Damaged This Turn)</button>
                            </>
                        ) : null}
                        {task === "bridge" ? (
                            <>
                                <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.completeBridge("light", this.state.overWater))}>Raise Light Bridge</button>
                                <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.completeBridge("medium", this.state.overWater))}>Raise Medium Bridge</button>
                                <label><input type="checkbox" checked={this.state.overWater} onChange={(e) => this.setState({ overWater: e.currentTarget.checked })} />&nbsp;Over water (CF doubled)</label>
                            </>
                        ) : null}
                        {task === "demolition" ? <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.detonateCharges())}>Detonate Charges (End Phase)</button> : null}
                        {task === "sensor" ? <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.deploySensor())}>Set a Remote Sensor</button> : null}
                        {task === "firefighting" || task === "minesweeping" ? (
                            <>
                                <label>2D6 roll: {number(this.state.roll, (value) => this.setState({ roll: value }), 20)}</label>
                                {task === "firefighting" ? (
                                    <>
                                        <label><input type="checkbox" checked={this.state.inferno} onChange={(e) => this.setState({ inferno: e.currentTarget.checked })} />&nbsp;Fire started by an Inferno or fuel-fed flamer (-2)</label>
                                        <label>Other platoons fighting it: {number(this.state.extraPlatoons, (value) => this.setState({ extraPlatoons: value }), 20)}</label>
                                        <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.resolveFirefight(this.state.roll, { inferno: this.state.inferno, extraPlatoons: this.state.extraPlatoons }))}>Fight the Fire</button>
                                    </>
                                ) : <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.resolveMinesweeping(this.state.roll))}>Disable the Mines</button>}
                            </>
                        ) : null}
                    </div>
                ) : null}
                {platoon.getParamedicCount() > 0 ? (
                    <div data-testid="infantry-paramedics">
                        <p><strong>Paramedics</strong>: {platoon.getActiveParamedics()} of {platoon.getParamedicCount()} on their feet, tending up to {platoon.getParamedicCapacity()} wounded</p>
                        <label>Wounded in the hex: {number(this.state.wounded, (value) => this.setState({ wounded: value }), 100000)}</label>
                        <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.tendWounded(this.state.wounded))}>Tend the Wounded</button>
                    </div>
                ) : null}
                {platoon.hasSpecialty("paratroops") ? (
                    <div data-testid="infantry-paratroops">
                        <label>2D6 rolls for the squads, in order, separated by commas:
                            <input type="text" value={this.state.dropRolls} placeholder="7, 3, 9" onChange={(e) => this.setState({ dropRolls: e.currentTarget.value })} />
                        </label>
                        <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.resolveParatroopDrop(this.state.dropRolls.split(",").map((part) => Number(part.trim())).filter((value) => Number.isFinite(value) && value >= 0)))}>Resolve the Combat Drop</button>
                    </div>
                ) : null}
                {platoon.getTagTrooperCount() > 0 ? (
                    <div data-testid="infantry-tag">
                        <p><strong>TAG troopers</strong>: {platoon.getTagTrooperCount()} ({platoon.getTagTroopersPerSquad()} a squad){platoon.isTagWorking() ? "" : ", not working (2 a squad needed)"}</p>
                        <button className="btn btn-primary btn-sm" onClick={() => this._say(platoon.fireTag())}>TAG Attack (3/6/9)</button>
                    </div>
                ) : null}
                {platoon.getXCTEnvironment() ? (
                    <div data-testid="infantry-xct">
                        <p><strong>XCT troops</strong>, {platoon.getXCTEnvironment()?.name}: {platoon.getXCTEnvironment()?.effect}</p>
                        <label>Environment damage before the troops' suits: {number(this.state.environmentDamage, (value) => this.setState({ environmentDamage: value }), 1000)}</label>
                        <button className="btn btn-secondary btn-sm" onClick={() => this._say([platoon.getXCTEnvironmentDamage(this.state.environmentDamage).text])}>Work Out the Damage</button>
                    </div>
                ) : null}
                <ul className="small-text">
                    {platoon.getSpecialtyNotes().map((note, index) => <li key={index}>{note}</li>)}
                </ul>
            </fieldset>
        );
    }

    private _changed = (): void => {
        this.props.onChange(this.props.platoon);
    }

    resolve = (): void => {
        const lines = this.props.platoon.resolveAttack(this.state.line, this.state.kind, this.state.damage, this.state.clearTerrain);
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
        this._changed();
    }

    /** A Stun hit (sonic projectors, #645): the dice rolled are the troopers stunned. */
    stun = (): void => {
        const turn = this.props.turn ?? 1;
        const lines = this.props.platoon.resolveStun(this.state.stunDice, turn, { sonic: true, atmosphere: this.state.atmosphere });
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
        this._changed();
    }

    /** The Morale Check after a stun (TO:AR pp.180-181); a failure means the platoon falls back. */
    morale = (passed: boolean): void => {
        const turn = this.props.turn ?? 1;
        this.props.platoon.setMoraleResult(passed, turn, this.state.moraleFrom || undefined);
        this.setState({ log: [passed ? "Morale Check passed" : "Morale Check failed: the platoon falls back next turn and makes no attacks", ...this.state.log].slice(0, 40) });
        this._changed();
    }

    // Clicking a trooper leaves that many active; clicking the last active trooper removes them too.
    toggleTrooper = (line: number, number: number): void => {
        const platoon = this.props.platoon;
        platoon.setLineTroopers(line, platoon.getLineTroopers(line) === number ? number - 1 : number);
        this._changed();
    }

    /** Fire the field guns (TO:AUE p.123): one facing for all, rounds kept for the platoon, no fire after moving or using infantry weapons. */
    fire = (): void => {
        const lines = this.props.platoon.fireFieldGuns(this.state.gunsToFire, this.state.shotsEach);
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
        this._changed();
    }

    renderFieldGuns = (platoon: InfantryPlatoon): React.ReactNode => {
        const weapon = platoon.getFieldGunWeapon();
        if (!weapon) return null;
        const reason = platoon.canFireFieldGuns();
        return (
            <fieldset className="fieldset" data-testid="infantry-field-guns">
                <legend>{platoon.isFieldArtillery() ? "Field Artillery" : "Field Guns"}</legend>
                <p>
                    <strong>{platoon.getFieldGunCount()} x {weapon.name}</strong> &nbsp;|&nbsp; <strong>Crewed</strong>: {platoon.getActiveFieldGuns()} of {platoon.getFieldGunCount()}
                    &nbsp;|&nbsp; <strong>Rounds left by ton</strong>: {platoon.getFieldGunShots().join(" / ")}
                </p>
                <label>
                    Facing (all guns):
                    <select value={platoon.getFieldGunFacing()} onChange={(e) => { platoon.setFieldGunFacing(+e.currentTarget.value); this._changed(); }}>
                        {[0, 1, 2, 3, 4, 5].map((facing) => <option key={facing} value={facing}>{facing}</option>)}
                    </select>
                </label>
                <label>
                    <input type="checkbox" checked={platoon.hasFieldGunMoved()} onChange={(e) => { platoon.setFieldGunMoved(e.currentTarget.checked); this._changed(); }} />
                    &nbsp;The platoon moved this turn
                </label>
                <label>
                    <input type="checkbox" checked={platoon.hasFieldGunUsedInfantryWeapons()} onChange={(e) => { platoon.setFieldGunUsedInfantryWeapons(e.currentTarget.checked); this._changed(); }} />
                    &nbsp;The platoon used its infantry weapons this turn
                </label>
                <label>
                    Guns firing:
                    <input type="number" min={1} max={Math.max(1, platoon.getActiveFieldGuns())} value={this.state.gunsToFire} onChange={(e) => this.setState({ gunsToFire: Math.max(1, +e.currentTarget.value || 1) })} />
                </label>
                <label>
                    Rounds each (Ultra or Rotary may fire more than one):
                    <input type="number" min={1} max={20} value={this.state.shotsEach} onChange={(e) => this.setState({ shotsEach: Math.max(1, +e.currentTarget.value || 1) })} />
                </label>
                <button className="btn btn-primary btn-sm" onClick={this.fire} disabled={reason !== null} title={reason ?? undefined}>Fire Field Guns</button>
                {reason ? <p className="small-text color-red" data-testid="infantry-field-guns-reason">{reason}.</p> : null}
                <ul className="small-text">
                    {platoon.getFieldGunPlayNotes().map((note, index) => <li key={index}>{note}</li>)}
                </ul>
            </fieldset>
        );
    }

    render = (): React.ReactNode => {
        const platoon = this.props.platoon;
        const lines = platoon.getSubPlatoons();
        const modifiers = platoon.getRangeModifiers();
        const features = platoon.getSpecialFeatures();
        const secondary = platoon.getSecondaryWeapon();
        const kind = INFANTRY_ATTACK_KINDS.find((item) => item.tag === this.state.kind) ?? INFANTRY_ATTACK_KINDS[0];
        const line = Math.min(this.state.line, lines.length - 1);

        return (
            <div className="infantry-play" data-testid="infantry-play">
                <h3>{platoon.getDisplayName()} <small>({platoon.getMotive().name} infantry, {platoon.getTroopers()} troopers)</small></h3>
                {platoon.isDestroyed() ? <h3 className="color-red text-center">DESTROYED</h3> : null}
                <p>
                    <strong>Movement</strong>: {platoon.getMovementText()} &nbsp;|&nbsp;
                    <strong>Gunnery</strong>: {platoon.getGunnery()} &nbsp;|&nbsp;
                    <strong>Anti-'Mech</strong>: {platoon.canMakeAntiMechAttacksNow() ? platoon.getAntiMechSkillNow() : "no Anti-'Mech attacks"} &nbsp;|&nbsp;
                    <strong>Weapons</strong>: {platoon.getPrimaryWeapon().name}{secondary && platoon.getSecondaryCount() > 0 ? ` and ${platoon.getSecondaryPerSquad()} ${secondary.name} per squad` : ""} &nbsp;|&nbsp;
                    <strong>Prohibited Terrain</strong>: {platoon.getProhibitedTerrain()}
                </p>
                {platoon.getMount() ? (
                    <p className="small-text" data-testid="infantry-play-beast">
                        <strong>{platoon.getMount()?.name}</strong> ({platoon.getBeastSize()?.name} creature): attacks against the platoon take {platoon.getAttackerToHitModifier() >= 0 ? "+" : ""}{platoon.getAttackerToHitModifier()} to-hit
                        and its damage is divided by {platoon.getDamageDivisor()}, rounded up (the rider's divisor plus the creature's, TO:AUE pp.108, 191).
                        {platoon.getBonusDamageText() ? ` ${platoon.getBonusDamageText()}; it stacks with anti-'Mech damage.` : ""}
                        {platoon.getMount()?.moveType === "VTOL" ? " It spends 1 MP each turn, even standing still, and keeps off the High Altitude Map." : ""}
                        {platoon.getBeastAntiMechNote() ? ` ${platoon.getBeastAntiMechNote()}` : ""}
                    </p>
                ) : null}
                {features.length > 0 ? <p className="small-text">{features.map((code) => INFANTRY_SPECIAL_FEATURES[code]).join("; ")}</p> : null}
                {platoon.getAugmentations().length > 0 ? (
                    <fieldset className="fieldset" data-testid="infantry-play-augmentation">
                        <legend>Augmentation (Interstellar Operations: Alternate Eras)</legend>
                        <ul className="small-text">
                            {platoon.getAugmentationPlayNotes().map((note, index) => <li key={index}>{note}</li>)}
                        </ul>
                    </fieldset>
                ) : null}

                {lines.map((troopers, lineIndex) => {
                    const active = platoon.getLineTroopers(lineIndex);
                    return (
                        <fieldset className="fieldset" key={lineIndex} data-testid="infantry-play-line">
                            <legend>{lines.length > 1 ? `Sub-Platoon ${lineIndex + 1}` : platoon.isClan() ? "Point" : "Platoon"}</legend>
                            <p className={active < troopers ? "color-red" : ""}>
                                <strong>Troopers</strong>: {active} of {troopers} &nbsp;|&nbsp;
                                <strong>Attack Damage</strong>: {platoon.getLineAttackDamage(lineIndex)}
                                {platoon.isLineDestroyed(lineIndex) ? <> &nbsp;|&nbsp; <strong>DESTROYED</strong></> : null}
                            </p>
                            <div>
                                {Array.from({ length: troopers }, (_unused, index) => index + 1).map((number) => (
                                    <button
                                        key={number}
                                        className={number <= active ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary"}
                                        style={{ minWidth: "2.6em", margin: "0 0.15em 0.15em 0", padding: "0.1em 0.2em" }}
                                        title={`Trooper ${number}: ${platoon.getDamageForTroopers(number)} damage with ${number} active`}
                                        aria-label={`${lines.length > 1 ? `Sub-platoon ${lineIndex + 1} trooper` : "Trooper"} ${number}${number <= active ? "" : " (eliminated)"}`}
                                        onClick={() => this.toggleTrooper(lineIndex, number)}
                                    >
                                        {number}
                                        <div className="small-text">{platoon.getDamageForTroopers(number)}</div>
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    );
                })}
                <p className="small-text">Each trooper shows the platoon's Max Weapon Damage with that many active. Click a trooper to set how many remain.</p>

                <table className="table" data-testid="infantry-play-ranges">
                    <tbody>
                        <tr>
                            <th>Range in Hexes</th>
                            {modifiers.map((_unused, range) => <td key={range} className="text-center">{range}</td>)}
                        </tr>
                        <tr>
                            <th>To-Hit Modifier</th>
                            {modifiers.map((modifier, range) => <td key={range} className="text-center">{formatModifier(modifier)}</td>)}
                        </tr>
                    </tbody>
                </table>

                {platoon.hasFieldGuns() ? this.renderFieldGuns(platoon) : null}

                {platoon.isSpecialized() || platoon.getParamedicCount() > 0 || platoon.getTagTrooperCount() > 0 || platoon.getXCT() || platoon.getMotive().vtol ? this.renderSpecialties(platoon) : null}

                <fieldset className="fieldset">
                    <legend>Resolve an Attack Against the Platoon</legend>
                    {lines.length > 1 ? (
                        <label>
                            Sub-Platoon:
                            <select value={line} onChange={(e) => this.setState({ line: +e.currentTarget.value })}>
                                {lines.map((_troopers, lineIndex) => <option key={lineIndex} value={lineIndex}>{lineIndex + 1}</option>)}
                            </select>
                        </label>
                    ) : null}
                    <label>
                        Attack Type:
                        <select value={this.state.kind} onChange={(e) => this.setState({ kind: e.currentTarget.value as InfantryAttackKind })}>
                            {INFANTRY_ATTACK_KINDS.map((item) => <option key={item.tag} value={item.tag}>{item.name}</option>)}
                        </select>
                    </label>
                    <label>
                        {kind.nonInfantryWeapon ? "Weapon Damage Value:" : "Damage:"}
                        <input type="number" min={0} max={1000} value={this.state.damage} onChange={(e) => this.setState({ damage: Math.max(0, +e.currentTarget.value || 0) })} />
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.clearTerrain} onChange={(e) => this.setState({ clearTerrain: e.currentTarget.checked })} />
                        &nbsp;Platoon is in Clear terrain (damage doubled)
                    </label>
                    <p className="small-text">
                        Troopers hit: {kind.formula}{kind.nonInfantryWeapon ? ", fractions rounded up; doubled against mechanized infantry" : ""}. Use a cluster
                        weapon's maximum damage (TW pp. 215-217).
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={this.resolve} disabled={platoon.isLineDestroyed(line)}>Apply Attack</button>
                </fieldset>

                {this.props.showStun || platoon.getStunnedTroopers() > 0 || platoon.isFellBack(this.props.turn ?? 1) ? (
                <fieldset className="fieldset" data-testid="infantry-stun">
                    <legend>Stun Hit (Sonic Projector)</legend>
                    {platoon.getStunnedTroopers() > 0 ? <p><strong>Stunned</strong>: {platoon.getStunnedTroopers()} troopers, back in the End Phase of the next turn</p> : null}
                    {platoon.isFellBack(this.props.turn ?? 1) ? <p className="color-red" data-testid="infantry-fell-back"><strong>Fell back</strong>: must move away from the firer and makes no attacks</p> : null}
                    <label>
                        Dice rolled:
                        <input type="number" min={0} max={1000} value={this.state.stunDice} onChange={(e) => this.setState({ stunDice: Math.max(0, +e.currentTarget.value || 0) })} />
                    </label>
                    <label>
                        Atmosphere:
                        <select value={this.state.atmosphere} onChange={(e) => this.setState({ atmosphere: e.currentTarget.value })}>
                            <option value="standard">Standard or denser</option>
                            <option value="thin">Thin</option>
                            <option value="trace">Trace or vacuum</option>
                        </select>
                    </label>
                    <label>
                        Fired by:
                        <input type="text" value={this.state.moraleFrom} onChange={(e) => this.setState({ moraleFrom: e.currentTarget.value })} />
                    </label>
                    <button className="btn btn-primary btn-sm" onClick={this.stun} disabled={platoon.isDestroyed()}>Apply Stun</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => this.morale(true)}>Morale Check Passed</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => this.morale(false)}>Morale Check Failed</button>
                    <p className="small-text">The stunned troopers do not count for the platoon's damage and return in the End Phase of the next turn. Then make a Morale Check (TO:AR pp.180-181). Battle armor, sealed kits and vehicle crews are immune.</p>
                </fieldset>
                ) : null}

                {this.state.log.length ? (
                    <ul className="small-text" data-testid="infantry-play-log">
                        {this.state.log.map((entry, index) => <li key={index}>{entry}</li>)}
                    </ul>
                ) : null}
            </div>
        )
    }
}

interface IInfantryPlayPanelProps {
    platoon: InfantryPlatoon;
    /** The force's current turn, for the stun and fall-back timers. */
    turn?: number;
    /** Show the Stun Hit controls: only where the force plays sonic projectors (#645, ours). */
    showStun?: boolean;
    onChange: (platoon: InfantryPlatoon) => void;
}

interface IInfantryPlayPanelState {
    line: number;
    kind: InfantryAttackKind;
    damage: number;
    clearTerrain: boolean;
    stunDice: number;
    atmosphere: string;
    moraleFrom: string;
    gunsToFire: number;
    shotsEach: number;
    roll: number;
    inferno: boolean;
    overWater: boolean;
    extraPlatoons: number;
    wounded: number;
    dropRolls: string;
    environmentDamage: number;
    log: string[];
}
