import React, { type JSX } from 'react';
import { getRulesEdition, getSelectableRulesEditions, IRulesEdition, RulesEditionUnitType } from '../../data/rules-editions';

/**
 * The Rules Edition control every unit creator opens Step 1 with: the edition decides what each field below it
 * offers. Only the editions with rules for `unitType` are listed.
 */
export default function RulesEditionSelect(props: { unitType: RulesEditionUnitType; value: string; onChange: (editionTag: string) => void; editions?: IRulesEdition[]; staleLabel?: string }): JSX.Element {
    // The shared settings block passes the editions the ticked rulesets allow.
    const editions = props.editions ?? getSelectableRulesEditions(props.unitType);
    return (
        <>
            <label>
                Rules Edition:
                <select value={props.value} onChange={(e) => props.onChange(e.currentTarget.value)}>
                    {/* A stored edition the list does not offer stays selected, marked with `staleLabel`. */}
                    {editions.some((edition) => edition.tag === props.value) ? null : (
                        <option value={props.value}>{getRulesEdition(props.value).name} ({props.staleLabel ?? "not offered"})</option>
                    )}
                    {editions.map((edition) => (
                        <option key={edition.tag} value={edition.tag}>{edition.name} ({edition.year})</option>
                    ))}
                </select>
            </label>
            {editions.length === 1 ? (
                <p className="smaller-text">
                    Only {getRulesEdition(props.value).name} is entered for this unit type so far: an earlier edition is added here once its rules for it are.
                </p>
            ) : null}
        </>
    );
}
