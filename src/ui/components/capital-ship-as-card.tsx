import React, { type JSX } from 'react';
import CapitalShip, { CAPITAL_SHIP_AS_ARCS } from '../../classes/capital-ship';
import { LARGE_CRAFT_AS_ATTACK_CLASSES, formatLargeCraftASDamage } from '../../data/large-craft-alpha-strike';

// The Alpha Strike card of a JumpShip, WarShip or space station: armor, structure and a Threshold, and for each of its
// four arcs a line of damage per attack type it carries (standard, capital, sub-capital, missiles; ASC pp.102-103).
export default class CapitalShipAlphaStrikeCard extends React.Component<ICapitalShipAlphaStrikeCardProps> {
    render = (): JSX.Element => {
        const ship = this.props.ship;
        const stats = ship.getAlphaStrikeStats();
        const cell: React.CSSProperties = { border: "1px solid #000", padding: "0.2em 0.6em", textAlign: "center" };
        const head: React.CSSProperties = { ...cell, background: "#ddd", fontWeight: "bold" };
        const rows = CAPITAL_SHIP_AS_ARCS.flatMap((arc) => LARGE_CRAFT_AS_ATTACK_CLASSES
            .filter((attackClass) => attackClass === "STD" || stats.arcs[arc.tag][attackClass].some((value) => value.damage > 0 || value.minimal))
            .map((attackClass) => ({ arc, attackClass, values: stats.arcs[arc.tag][attackClass] })));

        return (
            <div data-testid="capital-ship-as-card" style={{ border: "2px solid #000", borderRadius: "0.6em", padding: "0.8em 1em", maxWidth: "46em", background: "#fff", color: "#000" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ margin: 0 }}>{`${ship.getName()} ${ship.getModel()}`.trim() || ship.getShipTypeName()}</h3>
                    <strong data-testid="capital-ship-as-pv">PV: {stats.pointValue}</strong>
                </div>
                <p style={{ margin: "0.4em 0" }} data-testid="capital-ship-as-line">
                    <strong>TP</strong>: {stats.type} &nbsp; <strong>SZ</strong>: {stats.size} &nbsp;
                    <strong>THR</strong>: {stats.movement}{stats.moveCode} &nbsp; <strong>TH</strong>: {stats.threshold} &nbsp;
                    <strong>Skill</strong>: 4
                </p>
                <table style={{ borderCollapse: "collapse", marginBottom: "0.5em" }} data-testid="capital-ship-as-arcs">
                    <thead>
                        <tr><th style={head}>Arc</th><th style={head}>S (+0)</th><th style={head}>M (+2)</th><th style={head}>L (+4)</th><th style={head}>E (+6)</th></tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={`${row.arc.tag}-${row.attackClass}`}>
                                <td style={{ ...cell, textAlign: "left" }}>{row.arc.name} ({row.attackClass})</td>
                                {row.values.map((value, index) => <td key={index} style={cell}>{formatLargeCraftASDamage(value)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p style={{ margin: "0.3em 0" }}><strong>Armor</strong>: {stats.armor} &nbsp; <strong>Structure</strong>: {stats.structure}</p>
                <p style={{ margin: "0.3em 0" }}><strong>Special</strong>: {stats.specialAbilities.join(", ") || "none"}</p>
            </div>
        );
    }
}

interface ICapitalShipAlphaStrikeCardProps {
    ship: CapitalShip;
}
