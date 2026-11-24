import React, { type JSX } from 'react';
import { IRulesLevelOption } from '../../data/data-interfaces';
import { getRulesLevelOptionsForEdition, getShownRulesLevel } from '../../data/rules-editions';

/**
 * The Rules Level control, straight under the Rules Edition in every unit creator: the edition's own level names,
 * then Apocryphal, Custom Homebrew and Munchkin. A stored level the edition does not list shows as the next one up,
 * and the stored setting is left alone until the player picks a level.
 */
export default function RulesLevelSelect(props: { editionTag: string; value: number; onChange: (level: number) => void; options?: IRulesLevelOption[]; staleLabel?: string }): JSX.Element {
    const options = props.options ?? getRulesLevelOptionsForEdition(props.editionTag);
    const shown = getShownRulesLevel(props.editionTag, props.value);
    return (
        <label>
            Rules Level:
            <select value={shown} onChange={(e) => props.onChange(+e.currentTarget.value)}>
                {/* A level the list does not offer (a ruleset's minimum) stays selected, marked with `staleLabel`. */}
                {options.some((option) => option.id === shown) ? null : (
                    <option value={shown}>{getRulesLevelOptionsForEdition(props.editionTag).find((option) => option.id === shown)?.name ?? shown} ({props.staleLabel ?? "not offered"})</option>
                )}
                {options.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                ))}
            </select>
        </label>
    );
}
