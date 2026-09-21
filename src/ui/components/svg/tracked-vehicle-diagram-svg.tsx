import React from 'react';
import DamageCircleSVG from './damage-circle-svg';

// Schematic top-down Tracked Combat Vehicle record sheet diagram (hand-built shapes, not traced
// artwork - no internet access was available to source an official record sheet silhouette).
// Front/Rear span the hull width; Left/Right run along the sides; Turret (if present) sits center.
export default class TrackedVehicleDiagramSVG extends React.Component<ITrackedVehicleDiagramSVGProps, ITrackedVehicleDiagramSVGState> {
    bubbleRadius = 7;
    bubbleSpacing = 16;
    rowSpacing = 18;

    // Lays out `count` bubbles into rows no wider than maxWidth, returning the circles plus total height used.
    renderBubbleRows(count: number, x: number, y: number, maxWidth: number): JSX.Element[] {
        const perRow = Math.max(1, Math.floor(maxWidth / this.bubbleSpacing));
        const bubbles: JSX.Element[] = [];
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            bubbles.push(
                <DamageCircleSVG
                    key={i}
                    xLoc={x + col * this.bubbleSpacing}
                    yLoc={y + row * this.rowSpacing}
                    radius={this.bubbleRadius}
                />
            );
        }
        return bubbles;
    }

    renderLocation(label: string, x: number, y: number, width: number, height: number, structure: number, armor: number): JSX.Element {
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} fill="none" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                <text x={x + 4} y={y + 12} fontSize={10} fontWeight="bold">{label}</text>
                <text x={x + 4} y={y + 26} fontSize={8}>IS</text>
                {this.renderBubbleRows(structure, x + 20, y + 22, width - 24)}
                <text x={x + 4} y={y + height - 8} fontSize={8}>AR</text>
                {this.renderBubbleRows(armor, x + 20, y + height - 12, width - 24)}
            </g>
        );
    }

    render = (): JSX.Element => {
        const s = this.props.structure;
        const a = this.props.armor;
        const width = this.props.width ?? 500;
        const height = 400;

        return (
            <svg width={width} height={Math.round(width / 500 * height)} viewBox={`0 0 500 400`}>
                {this.renderLocation("FRONT", 100, 10, 300, 70, s.front, a.front)}
                {this.renderLocation("LEFT", 10, 90, 80, 220, s.left, a.left)}
                {this.props.hasTurret ? (
                    <g>
                        <circle cx={250} cy={200} r={90} fill="none" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                        <text x={210} y={125} fontSize={10} fontWeight="bold">TURRET</text>
                        <text x={190} y={145} fontSize={8}>IS</text>
                        {this.renderBubbleRows(s.turret, 210, 140, 130)}
                        <text x={190} y={260} fontSize={8}>AR</text>
                        {this.renderBubbleRows(a.turret, 210, 255, 130)}
                    </g>
                ) : null}
                {this.renderLocation("RIGHT", 410, 90, 80, 220, s.right, a.right)}
                {this.renderLocation("REAR", 100, 320, 300, 70, s.rear, a.rear)}
            </svg>
        );
    }
}

interface ITrackedVehicleDiagramSVGProps {
    structure: { front: number; left: number; right: number; rear: number; turret: number };
    armor: { front: number; left: number; right: number; rear: number; turret: number };
    hasTurret: boolean;
    width?: number;
}

interface ITrackedVehicleDiagramSVGState {
}
