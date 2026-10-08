import * as React from 'react';
import { BattleMech } from '../../classes/battlemech';
import {
    battledroidsFacingAfterFall, battledroidsPilotingModifiers, getBattledroidsFallingDamage, getBattledroidsHeatEffects,
    getBattledroidsPhysicalDamage, getBattledroidsPilotingTarget,
} from '../../data/battledroids-rules';

const rollDie = (): number => 1 + Math.floor(Math.random() * 6);

/**
 * What a battledroid's player keeps working out in an Expert Battledroids game: the Heat Scale's effects at its
 * heat, the damage of its physical attacks, Piloting Skill Rolls and falls (BD pp.11-15, 19-21).
 */
export default class BattledroidsDroidHelper extends React.Component<IBattledroidsDroidHelperProps, IBattledroidsDroidHelperState> {

    constructor(props: IBattledroidsDroidHelperProps) {
        super(props);
        this.state = {
            counts: {},
            intoWater: false,
            log: [],
        };
    }

    private _piloting = (): number => this.props.mechData.getPilot()?.piloting ?? 5;

    private _log = (lines: string[]): void => {
        this.setState({ log: [...lines, ...this.state.log].slice(0, 20) });
    }

    rollPiloting = (): void => {
        const target = getBattledroidsPilotingTarget(this._piloting(), this.state.counts);
        const roll = rollDie() + rollDie();
        this._log([`Piloting Skill Roll ${roll} against ${target}: ${roll >= target ? "the droid stays up, or gets up" : "the droid falls, or stays down"}.`]);
    }

    rollFall = (): void => {
        const mech = this.props.mechData;
        const damage = getBattledroidsFallingDamage(mech.getTonnage(), this.state.counts.levels ?? 0, this.state.intoWater);
        const facing = battledroidsFacingAfterFall[rollDie() - 1];
        const groups = [...Array(Math.floor(damage / 5)).fill(5), ...(damage % 5 ? [damage % 5] : [])];
        const warrior = rollDie() + rollDie();
        this._log([
            `Fall: ${damage} damage in groups of ${groups.join(", ")}, each located on the ${facing.column} column. New facing: ${facing.facing}.`,
            `DroidWarrior roll ${warrior} against Piloting ${this._piloting()}: ${warrior < this._piloting() ? "1 point of damage" : "unhurt"}.`,
        ]);
    }

    render = (): React.ReactNode => {
        const mech = this.props.mechData;
        const heat = getBattledroidsHeatEffects(mech.currentHeat);
        const physical = getBattledroidsPhysicalDamage(mech.getTonnage());
        const target = getBattledroidsPilotingTarget(this._piloting(), this.state.counts);
        return (
            <details className="battledroids-droid-helper" data-testid="battledroids-droid-helper">
                <summary><strong>Battledroids: heat, physical attacks and Piloting Skill Rolls</strong> <span className="small-text">(click to open)</span></summary>
                <p data-testid="battledroids-droid-heat">
                    <strong>Heat {mech.currentHeat}</strong>:{" "}
                    {heat.move || heat.fire || heat.shutdownAvoid || heat.ammoExplosionAvoid ? (
                        [
                            heat.move ? `-${heat.move} MP` : "",
                            heat.fire ? `+${heat.fire} to hit (already in the to-hit numbers)` : "",
                            heat.shutdownAvoid >= 13 ? "shut down" : heat.shutdownAvoid ? `shutdown, avoid on ${heat.shutdownAvoid}+` : "",
                            heat.ammoExplosionAvoid ? `ammunition explosion, avoid on ${heat.ammoExplosionAvoid}+` : "",
                        ].filter((effect) => effect).join("; ")
                    ) : "no effect"}
                    {" "}(BD pp.12-13)
                </p>
                <p data-testid="battledroids-droid-physical">
                    <strong>Physical attacks at {mech.getTonnage()} tons</strong>: punch {physical.punch} (base 4), kick {physical.kick} (base 3),
                    charge {physical.chargePerHex} for each hex moved (base 5), club {physical.club} (base 4); push (base 4) does no damage (BD pp.11-12, 19-21).
                </p>
                <fieldset className="fieldset">
                    <legend>Piloting Skill Roll (BD p.15)</legend>
                    {battledroidsPilotingModifiers.map((entry) => (
                        <label key={entry.tag}>
                            {entry.label} ({entry.modifier > 0 ? "+" : ""}{entry.modifier}{entry.max > 1 ? " each" : ""}):
                            {entry.max > 1 ? (
                                <input
                                    type="number"
                                    min={0}
                                    max={entry.max}
                                    value={this.state.counts[entry.tag] ?? 0}
                                    onChange={(e) => this.setState({ counts: { ...this.state.counts, [entry.tag]: Math.min(entry.max, Math.max(0, +e.currentTarget.value || 0)) } })}
                                />
                            ) : (
                                <input
                                    type="checkbox"
                                    checked={(this.state.counts[entry.tag] ?? 0) > 0}
                                    onChange={(e) => this.setState({ counts: { ...this.state.counts, [entry.tag]: e.currentTarget.checked ? 1 : 0 } })}
                                />
                            )}
                        </label>
                    ))}
                    <label>
                        <input type="checkbox" checked={this.state.intoWater} onChange={(e) => this.setState({ intoWater: e.currentTarget.checked })} />
                        &nbsp;A fall would be into a water hex (damage halved)
                    </label>
                    <p>
                        <strong>Piloting Skill {this._piloting()}, roll needed</strong>: <span data-testid="battledroids-droid-piloting">{target}</span> or more
                        &nbsp;|&nbsp; <strong>Falling damage</strong>:{" "}
                        <span data-testid="battledroids-droid-fall">{getBattledroidsFallingDamage(mech.getTonnage(), this.state.counts.levels ?? 0, this.state.intoWater)}</span>
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={this.rollPiloting}>Roll</button>{" "}
                    <button className="btn btn-secondary btn-sm" onClick={this.rollFall}>The Droid Falls</button>
                    <p className="small-text">Standing up costs 2 MP and needs a roll. Mark the fall's damage with the Take Damage button.</p>
                </fieldset>
                {this.state.log.length ? (
                    <ul className="small-text" data-testid="battledroids-droid-log">
                        {this.state.log.map((entry, index) => <li key={index}>{entry}</li>)}
                    </ul>
                ) : null}
            </details>
        )
    }
}

interface IBattledroidsDroidHelperProps {
    mechData: BattleMech;
}

interface IBattledroidsDroidHelperState {
    counts: Record<string, number>;
    intoWater: boolean;
    log: string[];
}
