import * as React from 'react';
import { battledroidsRulesTables } from '../../data/battledroids-rules';
import BattledroidsBasicGame from './battledroids-basic-game';

/** The tables of Advanced and Expert Battledroids a game needs at hand, folded away until opened. */
export default class BattledroidsRulesReference extends React.Component<IBattledroidsRulesReferenceProps> {
    render = (): React.ReactNode => (
        <>
        <details className="battledroids-rules-reference" data-testid="battledroids-rules-reference" open={this.props.open}>
            <summary><strong>Battledroids (1984) rules for this unit</strong> <span className="small-text">(click to open)</span></summary>
            {battledroidsRulesTables.map((table) => (
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
        </details>
        <BattledroidsBasicGame />
        </>
    )
}

interface IBattledroidsRulesReferenceProps {
    open?: boolean;
}
