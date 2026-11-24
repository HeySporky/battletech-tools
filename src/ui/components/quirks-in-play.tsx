import * as React from 'react';
import { QuirkEffect } from '../../data/quirk-interfaces';
import { IAppliedQuirkEffect } from '../../utils/quirk-effects';

const signed = (value: number): string => (value > 0 ? `+${value}` : `${value}`);

/** What one effect does, in a few words. */
export const describeQuirkEffect = (effect: QuirkEffect | null): string => {
    if (!effect) return "not yet applied in play";
    switch (effect.type) {
        case "to-hit": {
            const attack = effect.attack === "punch" ? " for punches" : effect.attack === "arm-physical" ? " for arm physical attacks" : effect.attack === "physical" ? " for physical attacks" : "";
            const conditions = [
                effect.scope === "weapon" ? "this weapon" : effect.scope === "location" ? "from this location" : "",
                effect.rangeBand && effect.rangeBand !== "parameter" ? `at ${effect.rangeBand} range` : effect.rangeBand ? "in its range band" : "",
                effect.vsAirborne ? "against airborne targets" : "",
                effect.attackerRanOrFlanked ? "after running or flanking" : "",
            ].filter((part) => part);
            return `${signed(effect.modifier)} to-hit${attack}${conditions.length ? ` (${conditions.join(", ")})` : ""}`;
        }
        case "to-hit-against": return `${signed(effect.modifier)} to-hit against it: ${effect.when}`;
        case "initiative": return `${signed(effect.modifier)} to its side's Initiative (the side's largest counts)`;
        case "heat-generated": return `${signed(effect.modifier)} heat generated each turn, never below 0`;
        case "weapon-heat": return `${signed(effect.modifier)} heat when fired${effect.minimum !== undefined ? `, at least ${effect.minimum}` : ""}`;
        case "roll": return `${signed(effect.modifier)} to ${effect.roll}${effect.when ? ` ${effect.when}` : ""}`;
        case "triggered-roll": return `when ${effect.trigger}, on ${effect.target}+ ${effect.outcome}`;
        case "multiplier": return `${effect.of} ×${effect.value}`;
        case "damage": return effect.note;
    }
};

/**
 * A unit's design quirks in Play Mode, one line per effect: the ones the app works out (to-hit, heat, Initiative)
 * and the ones the players apply at the table. Nothing with the game's "Use design quirks" switch off.
 */
export default class QuirksInPlay extends React.Component<IQuirksInPlayProps> {
    render = (): React.ReactNode => {
        if (!this.props.quirksInPlay || this.props.effects.length === 0) return null;
        return (
            <div className="quirks-in-play" data-testid="quirks-in-play">
                <strong>Quirks in play</strong>
                <ul className="small-text">
                    {this.props.effects.map((applied, index) => (
                        <li key={index}>{applied.title}{applied.on ? ` on ${applied.on}` : ""}: {describeQuirkEffect(applied.effect)}</li>
                    ))}
                </ul>
            </div>
        );
    }
}

interface IQuirksInPlayProps {
    effects: IAppliedQuirkEffect[];
    /** The game's "Use design quirks" switch. */
    quirksInPlay: boolean;
}
