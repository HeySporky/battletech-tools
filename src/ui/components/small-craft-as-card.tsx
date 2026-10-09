import React, { type JSX } from 'react';
import SmallCraft, { SMALL_CRAFT_AS_ARCS, formatSmallCraftASDamage } from '../../classes/small-craft';

// The Alpha Strike card of a Small Craft. Like a DropShip, it is a large aerospace unit: armor, structure and a
// Threshold, and a line of damage for each of its four firing arcs (Alpha Strike Companion pp.101-102).
export default class SmallCraftAlphaStrikeCard extends React.Component<ISmallCraftAlphaStrikeCardProps> {
    render = (): JSX.Element => {
        const craft = this.props.craft;
        const stats = craft.getAlphaStrikeStats();
        const cell: React.CSSProperties = { border: "1px solid #000", padding: "0.2em 0.6em", textAlign: "center" };
        const head: React.CSSProperties = { ...cell, background: "#ddd", fontWeight: "bold" };
        const pips = (count: number, structure: boolean): JSX.Element[] => Array.from({ length: count }, (_pip, pip) => (
            <span key={pip} style={{
                display: "inline-block", width: "0.85em", height: "0.85em", border: "1px solid #000", borderRadius: "50%", marginRight: "0.12em",
                background: structure ? "#999" : "#fff", verticalAlign: "middle",
            }} />
        ));

        return (
            <div data-testid="small-craft-as-card" style={{ border: "2px solid #000", borderRadius: "0.6em", padding: "0.8em 1em", maxWidth: "46em", background: "#fff", color: "#000" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ margin: 0 }}>{`${craft.getName()} ${craft.getModel()}`.trim() || "Small Craft"}</h3>
                    <strong data-testid="small-craft-as-pv">PV: {stats.pointValue}</strong>
                </div>
                <p style={{ margin: "0.4em 0" }} data-testid="small-craft-as-line">
                    <strong>TP</strong>: {stats.type} &nbsp; <strong>SZ</strong>: {stats.size} &nbsp;
                    <strong>THR</strong>: {stats.movement}{stats.moveCode} &nbsp; <strong>TH</strong>: {stats.threshold} &nbsp;
                    <strong>Skill</strong>: 4
                </p>
                <table style={{ borderCollapse: "collapse", marginBottom: "0.5em" }} data-testid="small-craft-as-arcs">
                    <thead>
                        <tr><th style={head}>Arc</th><th style={head}>S (+0)</th><th style={head}>M (+2)</th><th style={head}>L (+4)</th><th style={head}>E (+6)</th></tr>
                    </thead>
                    <tbody>
                        {SMALL_CRAFT_AS_ARCS.map((arc) => (
                            <tr key={arc.tag}>
                                <td style={{ ...cell, textAlign: "left" }}>{arc.name} (STD)</td>
                                {stats.arcs[arc.tag].map((value, index) => <td key={index} style={cell}>{formatSmallCraftASDamage(value)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p style={{ margin: "0.3em 0" }}><strong>A ({stats.armor})</strong>: {pips(stats.armor, false)}</p>
                <p style={{ margin: "0.3em 0" }}><strong>S ({stats.structure})</strong>: {pips(stats.structure, true)}</p>
                <p style={{ margin: "0.3em 0" }}><strong>Special</strong>: {stats.specialAbilities.join(", ") || "none"}</p>
            </div>
        );
    }
}

interface ISmallCraftAlphaStrikeCardProps {
    craft: SmallCraft;
}
