import * as React from 'react';
import {
    BATTLEDROIDS_BASIC_MIN_ARMOR_COLUMN, BattledroidsBasicAttackerMove, BattledroidsBasicFacing, battledroidsBasicDroids,
    getBattledroidsBasicArmorValue, getBattledroidsBasicDamageEffect, getBattledroidsBasicDamageNumber, getBattledroidsBasicRange,
    getBattledroidsBasicToHit,
} from '../../data/battledroids-basic-game';

const rollTwoDice = (): number => 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);

/**
 * Basic Battledroids (BD pp.3-6): pick the firing droid and its target from the ten the rulebook prints, and the
 * panel works out the To-Hit Number, the Armor Value and the Damage Number, and rolls the shot if asked.
 */
export default class BattledroidsBasicGame extends React.Component<Record<string, never>, IBattledroidsBasicGameState> {

    constructor(props: Record<string, never>) {
        super(props);
        this.state = {
            attacker: 7,
            target: 6,
            hexes: 7,
            attackerMove: "stationary",
            targetHexesMoved: 0,
            targetJumped: false,
            lightWoodsBetween: 0,
            targetInLightWoods: false,
            targetInHeavyWoods: false,
            facing: "front",
            log: [],
        };
    }

    roll = (): void => {
        const result = this._result();
        if (!result.range || result.damageValue <= 0 || !result.damage) return;
        const lines: string[] = [];
        const toHitRoll = rollTwoDice();
        if (result.toHit >= 13 || toHitRoll < result.toHit) {
            lines.push(`To-hit roll ${toHitRoll} against ${result.toHit}: miss.`);
        } else {
            const damageRoll = rollTwoDice();
            if (damageRoll < result.damage.number) {
                lines.push(`To-hit roll ${toHitRoll} against ${result.toHit}: hit. Damage roll ${damageRoll} against ${result.damage.number}: the armor holds.`);
            } else {
                const effectRoll = rollTwoDice();
                lines.push(`To-hit roll ${toHitRoll} against ${result.toHit}: hit. Damage roll ${damageRoll} against ${result.damage.number}: penetrated. Damage Effects roll ${effectRoll}: ${getBattledroidsBasicDamageEffect(effectRoll)}`);
            }
        }
        this.setState({ log: [...lines, ...this.state.log].slice(0, 20) });
    }

    private _result = () => {
        const attacker = battledroidsBasicDroids[this.state.attacker];
        const target = battledroidsBasicDroids[this.state.target];
        const range = getBattledroidsBasicRange(this.state.hexes);
        const damageValue = range ? attacker.damage[range] : 0;
        const armorValue = getBattledroidsBasicArmorValue(target.armor, this.state.facing);
        const toHit = range ? getBattledroidsBasicToHit({
            range,
            attackerMove: this.state.attackerMove,
            targetHexesMoved: this.state.targetHexesMoved,
            targetJumped: this.state.targetJumped,
            lightWoodsBetween: this.state.lightWoodsBetween,
            targetInLightWoods: this.state.targetInLightWoods,
            targetInHeavyWoods: this.state.targetInHeavyWoods,
        }) : 0;
        return { attacker, target, range, damageValue, armorValue, toHit, damage: getBattledroidsBasicDamageNumber(damageValue, armorValue) };
    }

    render = (): React.ReactNode => {
        const result = this._result();
        const number = (value: string, max: number) => Math.min(max, Math.max(0, +value || 0));
        return (
            <details className="battledroids-basic-game" data-testid="battledroids-basic-game">
                <summary><strong>Basic Battledroids</strong> <span className="small-text">(the introductory game, BD pp.3-6: click to open)</span></summary>
                <p className="small-text">
                    The Basic game gives each of the rulebook's ten droids one Armor Value and a Damage Value for each range; it uses no record
                    sheet. A droid designed in the creator has no Basic game statistics.
                </p>
                <table className="table small-text">
                    <thead><tr><th>Droid</th><th>Move</th><th>Jump</th><th>Armor</th><th>Contact</th><th>Short</th><th>Medium</th><th>Long</th></tr></thead>
                    <tbody>
                        {battledroidsBasicDroids.map((droid) => (
                            <tr key={droid.name}>
                                <td>{droid.name}</td><td>{droid.move}</td><td>{droid.jump || "-"}</td><td>{droid.armor}</td>
                                <td>{droid.damage.contact || "-"}</td><td>{droid.damage.short || "-"}</td><td>{droid.damage.medium || "-"}</td><td>{droid.damage.long || "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <fieldset className="fieldset">
                    <legend>A Shot</legend>
                    <label>
                        Firing Droid:
                        <select value={this.state.attacker} onChange={(e) => this.setState({ attacker: +e.currentTarget.value })}>
                            {battledroidsBasicDroids.map((droid, index) => <option key={droid.name} value={index}>{droid.name}</option>)}
                        </select>
                    </label>
                    <label>
                        Its Movement:
                        <select value={this.state.attackerMove} onChange={(e) => this.setState({ attackerMove: e.currentTarget.value as BattledroidsBasicAttackerMove })}>
                            <option value="stationary">Stationary</option>
                            <option value="walked">Walked (+1)</option>
                            <option value="ran">Ran (+2)</option>
                            <option value="jumped">Jumped (+3)</option>
                        </select>
                    </label>
                    <label>
                        Target Droid:
                        <select value={this.state.target} onChange={(e) => this.setState({ target: +e.currentTarget.value })}>
                            {battledroidsBasicDroids.map((droid, index) => <option key={droid.name} value={index}>{droid.name}</option>)}
                        </select>
                    </label>
                    <label>
                        Range in Hexes:
                        <input type="number" min={1} max={30} value={this.state.hexes} onChange={(e) => this.setState({ hexes: number(e.currentTarget.value, 30) })} />
                    </label>
                    <label>
                        Hexes the Target Moved:
                        <input type="number" min={0} max={30} value={this.state.targetHexesMoved} onChange={(e) => this.setState({ targetHexesMoved: number(e.currentTarget.value, 30) })} />
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.targetJumped} onChange={(e) => this.setState({ targetJumped: e.currentTarget.checked })} />
                        &nbsp;The target jumped (+1)
                    </label>
                    <label>
                        Light Woods Hexes Between (3 block the line of sight):
                        <input type="number" min={0} max={2} value={this.state.lightWoodsBetween} onChange={(e) => this.setState({ lightWoodsBetween: number(e.currentTarget.value, 2) })} />
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.targetInLightWoods} onChange={(e) => this.setState({ targetInLightWoods: e.currentTarget.checked, targetInHeavyWoods: false })} />
                        &nbsp;The target is in light woods (+1)
                    </label>
                    <label>
                        <input type="checkbox" checked={this.state.targetInHeavyWoods} onChange={(e) => this.setState({ targetInHeavyWoods: e.currentTarget.checked, targetInLightWoods: false })} />
                        &nbsp;The target is in heavy woods (+2)
                    </label>
                    <label>
                        The Shot Crosses the Target's:
                        <select value={this.state.facing} onChange={(e) => this.setState({ facing: e.currentTarget.value as BattledroidsBasicFacing })}>
                            <option value="front">Front or side hexsides</option>
                            <option value="rear-side">Left or right rear hexside (Armor -1)</option>
                            <option value="rear">Rear hexside (Armor -2)</option>
                        </select>
                    </label>
                    <p data-testid="battledroids-basic-result">
                        {!result.range ? (
                            <strong>Out of range: the Range Table ends at 21 hexes.</strong>
                        ) : result.damageValue <= 0 ? (
                            <strong>The {result.attacker.name} has no attack at {result.range} range.</strong>
                        ) : (
                            <>
                                <strong>Range</strong>: {result.range} &nbsp;|&nbsp;
                                <strong>To-Hit Number</strong>: {result.toHit >= 13 ? `${result.toHit} (automatic miss)` : result.toHit} &nbsp;|&nbsp;
                                <strong>Damage Value</strong>: {result.damageValue} &nbsp;|&nbsp;
                                <strong>Armor Value</strong>: {result.armorValue} &nbsp;|&nbsp;
                                <strong>Damage Number</strong>: {result.damage ? result.damage.number : "not on the table"}
                                {result.damage?.belowTable ? ` (the table's lowest column, Armor Value ${BATTLEDROIDS_BASIC_MIN_ARMOR_COLUMN})` : ""}
                            </>
                        )}
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={this.roll} disabled={!result.range || result.damageValue <= 0 || !result.damage}>Roll the Shot</button>
                    <p className="small-text">
                        Roll the To-Hit Number or more to hit, then the Damage Number or more to penetrate, then two dice on the Damage Effects
                        Table: 2-4 and 10-12 destroyed; 5 weapons destroyed; 6 and 8 no move or fire for 2 turns; 7 for 1 turn; 9 MP halved.
                    </p>
                </fieldset>
                {this.state.log.length ? (
                    <ul className="small-text" data-testid="battledroids-basic-log">
                        {this.state.log.map((entry, index) => <li key={index}>{entry}</li>)}
                    </ul>
                ) : null}
            </details>
        )
    }
}

interface IBattledroidsBasicGameState {
    attacker: number;
    target: number;
    hexes: number;
    attackerMove: BattledroidsBasicAttackerMove;
    targetHexesMoved: number;
    targetJumped: boolean;
    lightWoodsBetween: number;
    targetInLightWoods: boolean;
    targetInHeavyWoods: boolean;
    facing: BattledroidsBasicFacing;
    log: string[];
}
