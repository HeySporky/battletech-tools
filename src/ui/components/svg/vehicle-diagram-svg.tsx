import React, { type JSX } from 'react';
import { IVehicleArmorAllocation, IVehicleMotiveType, IVehicleStructureAllocation, VehicleLocation } from '../../../data/data-interfaces';
import DamageCircleSVG from './damage-circle-svg';

// Schematic top-down Combat Vehicle record sheet diagram (hand-built shapes, not traced artwork).
// Front/Rear span the hull; Left/Right run along the sides; the turret (or a VTOL's rotor) sits in
// the middle, and a VTOL chin turret sits under the nose. A light outline behind the boxes shows
// the motive type: tracks, wheels, hover skirt, WiGE wings, or a ship's hull.
export default class VehicleDiagramSVG extends React.Component<IVehicleDiagramSVGProps, IVehicleDiagramSVGState> {
    outlineColor = "rgb(170,170,170)";

    // Structure then armor pips inside a w x h area, shrinking the pips until both groups fit.
    renderPips(structure: number, armor: number, x: number, y: number, w: number, h: number, location?: VehicleLocation): JSX.Element {
        let spacing = 16;
        const rowsFor = (count: number, perRow: number) => Math.ceil(count / perRow);
        let perRow = Math.max(1, Math.floor((w - 16) / spacing));
        while (spacing > 6 && (rowsFor(structure, perRow) + rowsFor(armor, perRow) + 1) * spacing > h) {
            spacing -= 1;
            perRow = Math.max(1, Math.floor((w - 16) / spacing));
        }
        const radius = Math.max(2, spacing * 0.42);
        // In play, damaged pips are filled and clicking a pip marks (or clears) damage up to it.
        const damaged = (keyPrefix: string) => location
            ? (keyPrefix === "is" ? this.props.structureDamage : this.props.armorDamage)?.[location] ?? 0
            : 0;
        const onClick = (keyPrefix: string) => keyPrefix === "is" ? this.props.onToggleStructure : this.props.onToggleArmor;
        const pips = (count: number, top: number, keyPrefix: string) => Array.from({ length: count }, (_, i) => (
            <DamageCircleSVG
                key={`${keyPrefix}${i}`}
                xLoc={x + 16 + (i % perRow) * spacing + radius}
                yLoc={top + Math.floor(i / perRow) * spacing + radius}
                radius={radius}
                isFilled={i < damaged(keyPrefix)}
                inPlay={!!onClick(keyPrefix) && !!location}
                clickLocation={location}
                clickIndex={i}
                clickFunction={(loc: string, index: number) => onClick(keyPrefix)?.(loc as VehicleLocation, index)}
            />
        ));
        const armorTop = y + (rowsFor(structure, perRow) + 1) * spacing;
        return (
            <g>
                <text x={x} y={y + radius + 3} fontSize={8}>IS</text>
                {pips(structure, y, "is")}
                {armor > 0 ? <text x={x} y={armorTop + radius + 3} fontSize={8}>AR</text> : null}
                {pips(armor, armorTop, "ar")}
            </g>
        );
    }

    renderLocation(label: string, x: number, y: number, width: number, height: number, structure: number, armor: number, location?: VehicleLocation): JSX.Element {
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} fill="rgb(255,255,255)" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                <text x={x + 4} y={y + 12} fontSize={10} fontWeight="bold">{label}</text>
                {this.renderPips(structure, armor, x + 4, y + 17, width - 8, height - 20, location)}
            </g>
        );
    }

    renderCircleLocation(label: string, cx: number, cy: number, r: number, structure: number, armor: number, blades: boolean = false, location?: VehicleLocation): JSX.Element {
        // Pips go in the square inscribed in the circle, below the label.
        const half = Math.floor(r * 0.7);
        return (
            <g>
                <circle cx={cx} cy={cy} r={r} fill="rgb(255,255,255)" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                {blades ? (
                    <g stroke={this.outlineColor} strokeWidth={3}>
                        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
                        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
                    </g>
                ) : null}
                <text x={cx} y={cy - half - 4} fontSize={10} fontWeight="bold" textAnchor="middle">{label}</text>
                {this.renderPips(structure, armor, cx - half, cy - half + 4, half * 2, half * 2 - 4, location)}
            </g>
        );
    }

    // Light outline of the motive system, drawn behind the location boxes.
    renderOutline(): JSX.Element | null {
        const stroke = this.outlineColor;
        switch (this.props.motive.tag) {
            case "tracked":
                return (
                    <g fill="none" stroke={stroke} strokeWidth={4}>
                        <rect x={2} y={40} width={96} height={320} rx={30} />
                        <rect x={402} y={40} width={96} height={320} rx={30} />
                    </g>
                );
            case "wheeled":
                return (
                    <g fill="none" stroke={stroke} strokeWidth={4}>
                        {[70, 200, 330].map((y) => (
                            <g key={y}>
                                <rect x={0} y={y - 30} width={14} height={60} rx={6} />
                                <rect x={486} y={y - 30} width={14} height={60} rx={6} />
                            </g>
                        ))}
                    </g>
                );
            case "hover":
                return <rect x={2} y={2} width={496} height={396} rx={70} fill="none" stroke={stroke} strokeWidth={5} strokeDasharray="12 6" />;
            case "wige":
                return (
                    <g fill="none" stroke={stroke} strokeWidth={4}>
                        <polygon points="100,140 0,230 0,270 100,250" />
                        <polygon points="400,140 500,230 500,270 400,250" />
                    </g>
                );
            case "vtol":
                return (
                    <g fill="none" stroke={stroke} strokeWidth={4}>
                        <line x1={250} y1={390} x2={250} y2={398} />
                        <rect x={220} y={392} width={60} height={6} />
                    </g>
                );
            case "naval-surface":
            case "hydrofoil":
            case "naval-sub":
                return (
                    <g fill="none" stroke={stroke} strokeWidth={4}>
                        <polygon points="250,0 490,80 490,395 10,395 10,80" />
                        {this.props.motive.tag === "hydrofoil" ? (
                            <g>
                                <line x1={0} y1={110} x2={20} y2={110} />
                                <line x1={480} y1={110} x2={500} y2={110} />
                                <line x1={0} y1={330} x2={20} y2={330} />
                                <line x1={480} y1={330} x2={500} y2={330} />
                            </g>
                        ) : null}
                    </g>
                );
            default:
                return null;
        }
    }

    render = (): JSX.Element => {
        const s = this.props.structure;
        const a = this.props.armor;
        const width = this.props.width ?? 500;
        const height = 400;
        const has = (tag: VehicleLocation) => this.props.locations.some((loc) => loc.tag === tag);
        const nameOf = (tag: VehicleLocation) => (this.props.locations.find((loc) => loc.tag === tag)?.name ?? tag).toUpperCase();
        const isChinTurret = has("turret") && this.props.motive.turret === "chin";

        return (
            <svg width={width} height={Math.round(width / 500 * height)} viewBox={`0 0 500 400`}>
                {this.renderOutline()}
                <text x={496} y={14} fontSize={11} fontWeight="bold" textAnchor="end" fill="rgb(120,120,120)">{this.props.motive.name.toUpperCase()}</text>
                {this.renderLocation("FRONT", 100, 10, 300, 70, s.front, a.front, "front")}
                {has("frontLeft") ? (
                    <>
                        {this.renderLocation("FRONT LEFT", 10, 90, 80, 105, s.frontLeft ?? 0, a.frontLeft ?? 0, "frontLeft")}
                        {this.renderLocation("REAR LEFT", 10, 205, 80, 105, s.rearLeft ?? 0, a.rearLeft ?? 0, "rearLeft")}
                    </>
                ) : this.renderLocation("LEFT", 10, 90, 80, 220, s.left, a.left, "left")}
                {has("rotor") ? this.renderCircleLocation("ROTOR", 250, 230, 80, s.rotor ?? 0, a.rotor ?? 0, true, "rotor") : null}
                {has("turret") && isChinTurret ? this.renderLocation(nameOf("turret"), 150, 86, 200, 56, s.turret, a.turret, "turret") : null}
                {has("turret") && !isChinTurret && !has("turret2") ? this.renderCircleLocation(nameOf("turret"), 250, 200, 90, s.turret, a.turret, false, "turret") : null}
                {has("turret2") ? this.renderCircleLocation(nameOf("turret2"), 250, 146, 54, s.turret2 ?? 0, a.turret2 ?? 0, false, "turret2") : null}
                {has("turret2") ? this.renderCircleLocation(nameOf("turret"), 250, 256, 54, s.turret, a.turret, false, "turret") : null}
                {this.props.motive.tag === "naval-sub" && !has("turret") ? (
                    <rect x={215} y={150} width={70} height={100} rx={30} fill="none" stroke={this.outlineColor} strokeWidth={4} />
                ) : null}
                {has("frontRight") ? (
                    <>
                        {this.renderLocation("FRONT RIGHT", 410, 90, 80, 105, s.frontRight ?? 0, a.frontRight ?? 0, "frontRight")}
                        {this.renderLocation("REAR RIGHT", 410, 205, 80, 105, s.rearRight ?? 0, a.rearRight ?? 0, "rearRight")}
                    </>
                ) : this.renderLocation("RIGHT", 410, 90, 80, 220, s.right, a.right, "right")}
                {this.renderLocation("REAR", 100, 320, 300, 70, s.rear, a.rear, "rear")}
            </svg>
        );
    }
}

interface IVehicleDiagramSVGProps {
    armorDamage?: Partial<Record<VehicleLocation, number>>;
    structureDamage?: Partial<Record<VehicleLocation, number>>;
    onToggleArmor?: (location: VehicleLocation, index: number) => void;
    onToggleStructure?: (location: VehicleLocation, index: number) => void;
    motive: IVehicleMotiveType;
    locations: { tag: VehicleLocation; name: string }[];
    structure: IVehicleStructureAllocation;
    armor: IVehicleArmorAllocation;
    width?: number;
}

interface IVehicleDiagramSVGState {
}
