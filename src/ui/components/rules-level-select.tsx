import React, { type JSX } from 'react';
import { getRulesLevelOptionsForEdition, getShownRulesLevel } from '../../data/rules-editions';

/**
 * The Rules Level control, straight under the Rules Edition in every unit creator: the edition's own level names,
 * then Apocryphal, Custom Homebrew and Munchkin. A stored level the edition does not list shows as the next one up,
 * and the stored setting is left alone until the player picks a level.
 */
export default function RulesLevelSelect(props: { editionTag: string; value: number; onChange: (level: number) => void }): JSX.Element {
    return (
        <label>
            Rules Level:
            <select value={getShownRulesLevel(props.editionTag, props.value)} onChange={(e) => props.onChange(+e.currentTarget.value)}>
                {getRulesLevelOptionsForEdition(props.editionTag).map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                ))}
            </select>
        </label>
    );
}
