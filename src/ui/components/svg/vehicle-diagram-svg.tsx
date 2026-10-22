import React, { type JSX } from 'react';
import { IVehicleArmorAllocation, IVehicleMotiveType, IVehicleStructureAllocation, VehicleLocation } from '../../../data/data-interfaces';
import DamageCircleSVG from './damage-circle-svg';

// Schematic top-down Combat Vehicle record sheet diagram (hand-built shapes, not traced artwork), front at the top.
// Front/Rear span the hull; Left/Right run along the sides; the turret (or a VTOL's rotor) sits in the middle,
// and a VTOL chin turret sits under the nose. An outline behind the boxes draws the vehicle from above for its
// motive type: tracks, wheels, hover skirt, WiGE wings, VTOL rotor and skids, or a ship's hull.
export default class VehicleDiagramSVG extends React.Component<IVehicleDiagramSVGProps, IVehicleDiagramSVGState> {
    outlineColor = "rgb(150,150,150)";

    // Structure then armor pips inside a w x h area, shrinking the pips until both groups fit.
    renderPips(structure: number, armor: number, x: number, y: number, w: number, h: number, location?: VehicleLocation): JSX.Element {
        let spacing = 18;
        const rowsFor = (count: number, perRow: number) => Math.ceil(count / perRow);
        let perRow = Math.max(1, Math.floor((w - 16) / spacing));
        while (spacing > 7 && (rowsFor(structure, perRow) + rowsFor(armor, perRow) + 1) * spacing > h) {
            spacing -= 1;
            perRow = Math.max(1, Math.floor((w - 16) / spacing));
        }
        // DamageCircleSVG draws its circle 3 units inside this radius.
        const radius = Math.max(4, spacing * 0.5);
        // In play, damaged pips are filled and clicking a pip marks (or clears) damage up to it.
        const damaged = (keyPrefix: string) => location
            ? (keyPrefix === "is" ? this.props.structureDamage : this.props.armorDamage)?.[location] ?? 0
            : 0;
        const onClick = (keyPrefix: string) => keyPrefix === "is" ? this.props.onToggleStructure : this.props.onToggleArmor;
        const pips = (count: number, top: number, keyPrefix: string) => Array.from({ length: count }, (_, i) => (
            <DamageCircleSVG
                key={`${keyPrefix}${i}`}
                xLoc={x + 16 + (i % perRow) * spacing + spacing / 2}
                yLoc={top + Math.floor(i / perRow) * spacing + spacing / 2}
                radius={radius}
                strokeWidth={spacing < 12 ? 1 : 1.5}
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
                <text x={x} y={y + spacing / 2 + 3} fontSize={9}>IS</text>
                {pips(structure, y, "is")}
                {armor > 0 ? <text x={x} y={armorTop + spacing / 2 + 3} fontSize={9}>AR</text> : null}
                {pips(armor, armorTop, "ar")}
            </g>
        );
    }

    renderLocation(label: string, x: number, y: number, width: number, height: number, structure: number, armor: number, location?: VehicleLocation, rx: number = 0): JSX.Element {
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} rx={rx} fill="rgb(255,255,255)" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                <text x={x + width / 2} y={y + 14} fontSize={11} fontWeight="bold" textAnchor="middle">{label}</text>
                {this.renderPips(structure, armor, x + 4 + rx / 4, y + 20, width - 8 - rx / 2, height - 24 - rx / 3, location)}
            </g>
        );
    }

    renderCircleLocation(label: string, cx: number, cy: number, r: number, structure: number, armor: number, location?: VehicleLocation): JSX.Element {
        // Pips go in the square inscribed in the circle, below the label.
        const half = Math.floor(r * 0.7);
        return (
            <g>
                <circle cx={cx} cy={cy} r={r} fill="rgb(255,255,255)" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                <text x={cx} y={cy - half - 4} fontSize={11} fontWeight="bold" textAnchor="middle">{label}</text>
                {this.renderPips(structure, armor, cx - half, cy - half + 4, half * 2, half * 2 - 4, location)}
            </g>
        );
    }

    // The outline drawn for each motive type; the rest fall back to the nearest.
    outlineKind(): "tracked" | "wheeled" | "hover" | "vtol" | "wige" | "naval" {
        switch (this.props.motive.tag) {
            case "tracked":
            case "hover":
            case "vtol":
            case "wige":
                return this.props.motive.tag;
            case "naval-surface":
            case "hydrofoil":
            case "naval-sub":
                return "naval";
            default:
                // Wheeled, and rail (wheels on a track).
                return "wheeled";
        }
    }

    // The vehicle seen from above, drawn behind the location boxes.
    renderOutline(): JSX.Element {
        const kind = this.outlineKind();
        const hull = <rect x={55} y={15} width={390} height={590} rx={28} />;
        let shape: JSX.Element;
        switch (kind) {
            case "tracked":
                shape = (
                    <>
                        {hull}
                        {[8, 450].map((x) => (
                            <g key={x}>
                                <rect x={x} y={30} width={42} height={560} rx={20} />
                                {Array.from({ length: 19 }, (_, i) => <line key={i} x1={x + 4} y1={52 + i * 28} x2={x + 38} y2={52 + i * 28} strokeWidth={2} />)}
                            </g>
                        ))}
                    </>
                );
                break;
            case "wheeled":
                shape = (
                    <>
                        {hull}
                        {[110, 240, 380, 510].map((y) => (
                            <g key={y}>
                                <rect x={22} y={y - 40} width={30} height={80} rx={9} />
                                <rect x={448} y={y - 40} width={30} height={80} rx={9} />
                            </g>
                        ))}
                    </>
                );
                break;
            case "hover":
                shape = (
                    <>
                        <rect x={6} y={6} width={488} height={608} rx={100} strokeDasharray="14 7" strokeWidth={6} />
                        <rect x={45} y={25} width={410} height={570} rx={50} />
                    </>
                );
                break;
            case "wige":
                shape = (
                    <>
                        {hull}
                        <polygon points="55,190 4,300 4,370 55,390" />
                        <polygon points="445,190 496,300 496,370 445,390" />
                    </>
                );
                break;
            case "vtol":
                shape = (
                    <>
                        <path d="M250,8 C400,8 445,90 445,200 L445,480 C445,560 380,600 300,606 L200,606 C120,600 55,560 55,480 L55,200 C55,90 100,8 250,8 Z" />
                        <rect x={10} y={150} width={14} height={330} rx={7} />
                        <rect x={476} y={150} width={14} height={330} rx={7} />
                        <g strokeWidth={8}>
                            <line x1={30} y1={190} x2={470} y2={430} />
                            <line x1={30} y1={430} x2={470} y2={190} />
                        </g>
                    </>
                );
                break;
            default:
                shape = (
                    <>
                        {this.props.motive.tag === "naval-sub"
                            ? <rect x={55} y={8} width={390} height={604} rx={150} />
                            : <polygon points="250,4 445,140 445,610 55,610 55,140" />}
                        {this.props.motive.tag === "hydrofoil" ? (
                            <g strokeWidth={6}>
                                <line x1={2} y1={170} x2={55} y2={170} />
                                <line x1={445} y1={170} x2={498} y2={170} />
                                <line x1={2} y1={540} x2={55} y2={540} />
                                <line x1={445} y1={540} x2={498} y2={540} />
                            </g>
                        ) : null}
                    </>
                );
        }
        return <g data-testid={`vehicle-outline-${kind}`} fill="none" stroke={this.outlineColor} strokeWidth={4}>{shape}</g>;
    }

    render = (): JSX.Element => {
        const s = this.props.structure;
        const a = this.props.armor;
        const width = this.props.width ?? 500;
        const height = 620;
        // Placed at x, y inside a record sheet's own SVG rather than centred on the page.
        const embedded = this.props.x !== undefined;
        const has = (tag: VehicleLocation) => this.props.locations.some((loc) => loc.tag === tag);
        const nameOf = (tag: VehicleLocation) => (this.props.locations.find((loc) => loc.tag === tag)?.name ?? tag).toUpperCase();
        const isChinTurret = has("turret") && this.props.motive.turret === "chin";
        // A Large Naval Vessel with three or more turrets (TO:AUE p.60): the turrets in a grid down the hull.
        const turretGrid = has("turret3") ? this.props.locations.filter((loc) => loc.tag.startsWith("turret")) : [];
        const gridRows = Math.ceil(turretGrid.length / 2);
        // The gun of the (front) turret points over the front, between the Front box and the turret.
        const gun = (top: number) => (
            <rect data-testid="vehicle-turret-gun" x={243} y={148} width={14} height={top - 146} fill="rgb(255,255,255)" stroke="rgb(0,0,0)" strokeWidth={1.5} />
        );

        return (
            <svg
                x={embedded ? this.props.x : undefined}
                y={embedded ? this.props.y : undefined}
                width={width}
                height={Math.round(width / 500 * height)}
                viewBox={`0 0 500 ${height}`}
                style={embedded ? undefined : { display: "block", margin: "0 auto", maxWidth: "100%", height: "auto" }}
            >
                {this.renderOutline()}
                <text x={496} y={14} fontSize={11} fontWeight="bold" textAnchor="end" fill="rgb(110,110,110)">{this.props.motive.name.toUpperCase()}</text>
                {has("turret") && !isChinTurret && turretGrid.length === 0 ? gun(has("turret2") ? 170 : 190) : null}
                {this.renderLocation("FRONT", 110, 30, 280, 120, s.front, a.front, "front")}
                {has("frontLeft") ? (
                    <>
                        {this.renderLocation("FRONT LEFT", 70, 160, 100, 145, s.frontLeft ?? 0, a.frontLeft ?? 0, "frontLeft")}
                        {this.renderLocation("REAR LEFT", 70, 315, 100, 145, s.rearLeft ?? 0, a.rearLeft ?? 0, "rearLeft")}
                    </>
                ) : this.renderLocation("LEFT", 70, 160, 100, 300, s.left, a.left, "left")}
                {has("rotor") ? this.renderCircleLocation("ROTOR", 250, isChinTurret ? 350 : 310, isChinTurret ? 72 : 78, s.rotor ?? 0, a.rotor ?? 0, "rotor") : null}
                {has("turret") && isChinTurret ? this.renderLocation(nameOf("turret"), 180, 162, 140, 100, s.turret, a.turret, "turret") : null}
                {has("turret") && !isChinTurret && !has("turret2") ? this.renderLocation(nameOf("turret"), 180, 190, 140, 250, s.turret, a.turret, "turret", 36) : null}
                {has("turret2") && turretGrid.length === 0 ? this.renderLocation(nameOf("turret2"), 180, 170, 140, 135, s.turret2 ?? 0, a.turret2 ?? 0, "turret2", 24) : null}
                {has("turret2") && turretGrid.length === 0 ? this.renderLocation(nameOf("turret"), 180, 315, 140, 135, s.turret, a.turret, "turret", 24) : null}
                {turretGrid.map((loc, index) => {
                    const cellHeight = 300 / gridRows;
                    return (
                        <g key={loc.tag} data-testid={`vehicle-turret-${loc.tag}`}>
                            {this.renderLocation(nameOf(loc.tag), 178 + (index % 2) * 73, 162 + Math.floor(index / 2) * cellHeight, 71, cellHeight - 4,
                                s[loc.tag as keyof IVehicleStructureAllocation] ?? 0, a[loc.tag as keyof IVehicleArmorAllocation] ?? 0, loc.tag)}
                        </g>
                    );
                })}
                {this.props.motive.tag === "naval-sub" && !has("turret") ? (
                    <rect x={210} y={230} width={80} height={140} rx={35} fill="none" stroke={this.outlineColor} strokeWidth={4} />
                ) : null}
                {has("frontRight") ? (
                    <>
                        {this.renderLocation("FRONT RIGHT", 330, 160, 100, 145, s.frontRight ?? 0, a.frontRight ?? 0, "frontRight")}
                        {this.renderLocation("REAR RIGHT", 330, 315, 100, 145, s.rearRight ?? 0, a.rearRight ?? 0, "rearRight")}
                    </>
                ) : this.renderLocation("RIGHT", 330, 160, 100, 300, s.right, a.right, "right")}
                {this.renderLocation("REAR", 110, 470, 280, 120, s.rear, a.rear, "rear")}
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
    x?: number;
    y?: number;
}

interface IVehicleDiagramSVGState {
}
