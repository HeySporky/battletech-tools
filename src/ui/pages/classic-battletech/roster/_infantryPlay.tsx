import * as React from 'react';
import InfantryPlatoon, { INFANTRY_ATTACK_KINDS, INFANTRY_SPECIAL_FEATURES, InfantryAttackKind } from '../../../../classes/infantry-platoon';

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
            log: [],
        };
    }

    private _changed = (): void => {
        this.props.onChange(this.props.platoon);
    }

    resolve = (): void => {
        const lines = this.props.platoon.resolveAttack(this.state.line, this.state.kind, this.state.damage, this.state.clearTerrain);
        this.setState({ log: [...lines, ...this.state.log].slice(0, 40) });
        this._changed();
    }

    // Clicking a trooper leaves that many active; clicking the last active trooper removes them too.
    toggleTrooper = (line: number, number: number): void => {
        const platoon = this.props.platoon;
        platoon.setLineTroopers(line, platoon.getLineTroopers(line) === number ? number - 1 : number);
        this._changed();
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
                    <strong>Anti-'Mech</strong>: {platoon.canMakeAntiMechAttacks() ? platoon.getAntiMechSkill() : "no Anti-'Mech attacks"} &nbsp;|&nbsp;
                    <strong>Weapons</strong>: {platoon.getPrimaryWeapon().name}{secondary && platoon.getSecondaryCount() > 0 ? ` and ${platoon.getSecondaryPerSquad()} ${secondary.name} per squad` : ""} &nbsp;|&nbsp;
                    <strong>Prohibited Terrain</strong>: {platoon.getMotive().prohibitedTerrain}
                </p>
                {features.length > 0 ? <p className="small-text">{features.map((code) => INFANTRY_SPECIAL_FEATURES[code]).join("; ")}</p> : null}

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
    onChange: (platoon: InfantryPlatoon) => void;
}

interface IInfantryPlayPanelState {
    line: number;
    kind: InfantryAttackKind;
    damage: number;
    clearTerrain: boolean;
    log: string[];
}
