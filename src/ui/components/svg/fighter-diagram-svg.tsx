import React, { type JSX } from 'react';
import { FighterArc, IFighterArmorAllocation } from '../../../classes/aerospace-fighter';
import DamageCircleSVG from './damage-circle-svg';

// Schematic top-down fighter record sheet diagram (hand-built shapes, not traced artwork): nose at the top,
// a wing on each side, aft at the bottom and the Structural Integrity track in the fuselage between them.
export default class FighterDiagramSVG extends React.Component<IFighterDiagramSVGProps> {
    outlineColor = "rgb(170,170,170)";

    // Pips inside a w x h area, shrinking until they fit. In play, damaged pips are filled and clicking a pip
    // marks (or clears) damage up to it.
    renderPips(count: number, damaged: number, x: number, y: number, w: number, h: number, keyPrefix: string, onClick?: (index: number) => void): JSX.Element[] {
        let spacing = 14;
        let perRow = Math.max(1, Math.floor(w / spacing));
        while (spacing > 3.5 && Math.ceil(count / perRow) * spacing > h) {
            spacing -= 0.5;
            perRow = Math.max(1, Math.floor(w / spacing));
        }
        const radius = Math.max(1.4, spacing * 0.42);
        return Array.from({ length: count }, (_, i) => (
            <DamageCircleSVG
                key={`${keyPrefix}${i}`}
                xLoc={x + (i % perRow) * spacing + radius}
                yLoc={y + Math.floor(i / perRow) * spacing + radius}
                radius={radius}
                isFilled={i < damaged}
                inPlay={!!onClick}
                clickLocation={keyPrefix}
                clickIndex={i}
                clickFunction={(_location: string, index: number) => onClick?.(index)}
            />
        ));
    }

    renderArc(arc: FighterArc, label: string, x: number, y: number, width: number, height: number): JSX.Element {
        const armor = this.props.armor[arc];
        const toggle = this.props.onToggleArmor;
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} fill="rgb(255,255,255)" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                <text x={x + 4} y={y + 12} fontSize={10} fontWeight="bold">{label} ({armor})</text>
                {this.props.thresholds ? <text x={x + width - 4} y={y + 12} fontSize={9} textAnchor="end">Threshold {this.props.thresholds[arc]}</text> : null}
                {this.renderPips(armor, this.props.armorDamage?.[arc] ?? 0, x + 5, y + 18, width - 10, height - 22, arc, toggle ? (index) => toggle(arc, index) : undefined)}
            </g>
        );
    }

    render = (): JSX.Element => {
        const toggleSI = this.props.onToggleStructure;
        return (
            <svg viewBox="0 0 600 470" width={this.props.width ?? 600} xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: "100%", height: "auto" }}>
                <polygon points="300,4 345,150 590,250 590,300 345,300 330,440 380,462 220,462 270,440 255,300 10,300 10,250 255,150"
                    fill="none" stroke={this.outlineColor} strokeWidth={2} strokeDasharray="6 4" />
                {this.renderArc("nose", "Nose", 215, 20, 170, 130)}
                {this.renderArc("leftWing", "Left Wing", 15, 160, 190, 135)}
                {this.renderArc("rightWing", "Right Wing", 395, 160, 190, 135)}
                {this.renderArc("aft", "Aft", 215, 320, 170, 130)}
                <g>
                    <rect x={215} y={160} width={170} height={150} fill="rgb(245,245,245)" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                    <text x={219} y={172} fontSize={10} fontWeight="bold">Structural Integrity ({this.props.structuralIntegrity})</text>
                    {this.renderPips(this.props.structuralIntegrity, this.props.structureDamage ?? 0, 220, 180, 160, 124, "si", toggleSI ? (index) => toggleSI(index) : undefined)}
                </g>
            </svg>
        );
    }
}

interface IFighterDiagramSVGProps {
    armor: IFighterArmorAllocation;
    structuralIntegrity: number;
    width?: number;
    /** Damage thresholds by arc, shown when given. */
    thresholds?: IFighterArmorAllocation;
    armorDamage?: IFighterArmorAllocation;
    structureDamage?: number;
    onToggleArmor?: (arc: FighterArc, index: number) => void;
    onToggleStructure?: (index: number) => void;
}
