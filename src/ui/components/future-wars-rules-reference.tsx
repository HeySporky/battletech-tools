import * as React from 'react';
import { getFutureWarsPlayRules } from '../../data/future-wars-play-rules';
import { findSpecialRuleset } from '../../data/special-rulesets';

/** One Best of Future Wars play ruleset's summary and tables (#172), folded away until opened; nothing for any other ruleset. */
export default function FutureWarsRulesReference(props: { rulesetId: string; open?: boolean }): React.ReactElement | null {
    const rules = getFutureWarsPlayRules(props.rulesetId);
    const ruleset = findSpecialRuleset(props.rulesetId);
    if (!rules || !ruleset) {
        return null;
    }
    return (
        <details className="future-wars-rules-reference" data-testid={`future-wars-rules-${props.rulesetId}`} open={props.open}>
            <summary><strong>{ruleset.name}</strong> <span className="small-text">(rules summary; click to open)</span></summary>
            <p className="small-text">{rules.summary}</p>
            {rules.tables.map((table) => (
                <table className="table small-text" key={table.title}>
                    <thead>
                        <tr><th colSpan={2}>{table.title} <span className="font-weight-normal">({table.page})</span></th></tr>
                    </thead>
                    <tbody>
                        {table.rows.map(([label, value]) => (
                            <tr key={label}>
                                <td style={{ width: "40%" }}>{label}</td>
                                <td>{value}</td>
                            </tr>
                        ))}
                        {table.note ? <tr><td colSpan={2}>{table.note}</td></tr> : null}
                    </tbody>
                </table>
            ))}
            <p className="smaller-text">Source: {ruleset.source.title}. Summary in our words; see the article for the full rules.</p>
        </details>
    );
}
