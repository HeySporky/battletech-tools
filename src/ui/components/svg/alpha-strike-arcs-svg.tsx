import React, { type JSX } from 'react';
import { AS_ARC_NAMES, ASArcAttackClass, ASArcName, AlphaStrikeUnit } from '../../../classes/alpha-strike-unit';

// The back of a large craft's Alpha Strike card: damage for each firing arc, by attack class, laid out as the
// Master Unit List prints it (#32). JumpShips, WarShips and stations add the capital (CAP) column.
const CAPITAL_TYPES = ["JS", "WS", "SS"];
const RANGE_LABELS = ["S (+0)", "M (+2)", "L (+4)", "E (+6)"];

export function arcLabel(arc: ASArcName, capital: boolean): string {
    if (capital) {
        return { front: "Front Arc", rear: "Rear Arc", left: "Left Arc", right: "Right Arc" }[arc];
    }
    return { front: "Nose Arc", rear: "Aft Arc", left: "Left Wing", right: "Right Wing" }[arc];
}

export default class AlphaStrikeArcsSVG extends React.Component<IAlphaStrikeArcsSVGProps> {
    render = (): JSX.Element | null => {
        const unit = this.props.asUnit;
        if (!unit.arcs) return null;
        const width = this.props.width ?? 1000;
        const height = this.props.height ?? 640;
        const capital = CAPITAL_TYPES.includes(unit.type);
        const columns: ASArcAttackClass[] = capital ? ["std", "cap", "scap", "msl"] : ["std", "scap", "msl"];
        const margin = 20;
        const titleHeight = 60;
        const gap = 12;
        const panelWidth = (width - margin * 2 - gap) / 2;
        const panelHeight = (height - margin * 2 - titleHeight - gap) / 2;
        const rowHeight = panelHeight / 7;
        const labelWidth = 150;
        const columnWidth = (panelWidth - labelWidth - 40) / columns.length;
        const title = `${unit.name} ${unit.variant ?? ""}`.trim().toUpperCase();

        return (
            <svg data-testid="alpha-strike-card-back" className={this.props.className} version="1.1" x="0px" y="0px" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width={width} height={height} fill="rgb(0,0,0)" />
                <rect x="10" y="10" width={width - 20} height={height - 20} fill="rgb(255,255,255)" />
                <text x={margin + 10} y={margin + 38} fontFamily="sans-serif" fontWeight="bold" fontSize="30">{title}</text>
                <text x={width - margin - 10} y={margin + 38} fontFamily="sans-serif" textAnchor="end" fontSize="18">DAMAGE BY FIRING ARC</text>
                {AS_ARC_NAMES.map((arcName, index) => {
                    const arc = unit.arcs?.[arcName] ?? {};
                    const x = margin + (index % 2) * (panelWidth + gap);
                    const y = margin + titleHeight + Math.floor(index / 2) * (panelHeight + gap);
                    const columnX = (column: number) => x + labelWidth + 20 + columnWidth * (column + 0.5);
                    return (
                        <g key={arcName} data-testid={`arc-${arcName}`}>
                            <rect x={x} y={y} width={panelWidth} height={panelHeight} fill="rgb(209,210,212)" stroke="rgb(0,0,0)" strokeWidth={3} rx="18" ry="18" />
                            <text x={x + 28} y={y + panelHeight / 2} fontFamily="sans-serif" fontWeight="bold" fontSize="16" textAnchor="middle" transform={`rotate(270, ${x + 28}, ${y + panelHeight / 2})`}>
                                {arcLabel(arcName, capital).toUpperCase()}
                            </text>
                            {columns.map((column, columnIndex) => (
                                <text key={column} x={columnX(columnIndex)} y={y + rowHeight * 0.8} fontFamily="sans-serif" fontWeight="bold" fontSize="22" textAnchor="middle">{column.toUpperCase()}</text>
                            ))}
                            {RANGE_LABELS.map((label, row) => (
                                <React.Fragment key={label}>
                                    <text x={x + 50} y={y + rowHeight * (row + 1.8)} fontFamily="sans-serif" fontWeight="bold" fontSize="22">{label}</text>
                                    {columns.map((column, columnIndex) => (
                                        <text key={column} x={columnX(columnIndex)} y={y + rowHeight * (row + 1.8)} fontFamily="sans-serif" fontSize="24" textAnchor="middle">
                                            {arc[column]?.[row] ?? ""}
                                        </text>
                                    ))}
                                </React.Fragment>
                            ))}
                            <text x={x + 50} y={y + rowHeight * 5.8} fontFamily="sans-serif" fontWeight="bold" fontSize="22">SPE</text>
                            <text x={x + labelWidth} y={y + rowHeight * 5.8} fontFamily="sans-serif" fontSize="20" data-testid={`arc-${arcName}-spe`}>{arc.spe ?? ""}</text>
                        </g>
                    );
                })}
            </svg>
        );
    }
}

interface IAlphaStrikeArcsSVGProps {
    asUnit: AlphaStrikeUnit;
    className?: string;
    width?: number;
    height?: number;
}
