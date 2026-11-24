import React, { type JSX } from "react";
import { ITroConstructionRow } from "../../data/technical-readout-interfaces";

/** The construction table at the foot of a Technical Readout sheet; every unit type's adapter supplies its rows. */
export default function TroConstructionTable(props: { rows: ITroConstructionRow[] }): JSX.Element {
    return (
        <table className="tro-construction">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Value</th>
                    <th>Mass</th>
                </tr>
            </thead>
            <tbody>
                {props.rows.map((row, index) => (
                    row.heading
                        ? <tr key={index}><th colSpan={3}>{row.label}</th></tr>
                        : (
                            <tr key={index} className={row.indent ? "indent" : undefined}>
                                <td>{row.label}</td>
                                <td>{row.value}</td>
                                <td>{row.mass}</td>
                            </tr>
                        )
                ))}
            </tbody>
        </table>
    );
}
