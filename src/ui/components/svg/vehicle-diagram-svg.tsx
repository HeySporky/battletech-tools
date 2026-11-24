import React, { type JSX } from 'react';
import { IVehicleArmorAllocation, IVehicleMotiveType, IVehicleStructureAllocation, VehicleLocation } from '../../../data/data-interfaces';
import type { BubblePoint } from './armor-bubble-layouts';
import { drawnBubble } from './armor-bubble-layouts';
import DamageCircleSVG from './damage-circle-svg';
import { circleShape, clipShape, packBubbles, roundedRectShape, shapePoints, type IBox, type Shape } from './shape-bubbles';

// The middle of the hull, ringed by the Front, Left, Right and Rear sections; turrets and a rotor sit inside it.
const INNER = { left: 170, right: 330, top: 155, bottom: 465 };
// Where a Super-Heavy's Front Left and Rear Left (and Right) sections meet.
const SIDE_SPLIT = 310;
const STRUCTURE_FILL = "rgb(205,205,205)";
const LABEL_SIZE = 11;

const labelWidth = (label: string) => label.length * 7.4 + 4;

interface IVehicleSection {
    tag: VehicleLocation;
    label: string;
    shape: Shape;
    /** Where the label's baseline is centred, and how it is turned: -90 runs up a left side, 90 down a right one. */
    labelAt: BubblePoint;
    labelTurn?: number;
    /** Structure and armor bubbles fill in rows from this edge outward; from the section's own middle when not given. */
    fillFrom?: { anchor: BubblePoint; rowsAlong: "x" | "y" };
    avoid: IBox[];
}

// The box a label covers, so no bubble sits under it.
const labelBox = (label: string, [x, y]: BubblePoint, turn: number = 0): IBox => {
    const width = labelWidth(label);
    if (turn === -90) return { x: x - LABEL_SIZE, y: y - width / 2, w: LABEL_SIZE + 3, h: width };
    if (turn === 90) return { x: x - 3, y: y - width / 2, w: LABEL_SIZE + 3, h: width };
    return { x: x - width / 2, y: y - LABEL_SIZE, w: width, h: LABEL_SIZE + 3 };
};

// Schematic top-down Combat Vehicle record sheet diagram (hand-built shapes, not traced artwork), front at the top.
// The armored hull is cut into sections like a picture frame: Front and Rear across its ends, Left and Right down its
// sides (a Super-Heavy's split in two), and the turrets and a VTOL's rotor in the middle. Each section's structure
// bubbles (shaded) and armor bubbles are packed inside the section's own shape, structure nearest the middle. An
// outline behind the hull draws the vehicle from above for its motive type: tracks, wheels, hover skirt, WiGE wings,
// VTOL rotor and skids, or a ship's hull.
export default class VehicleDiagramSVG extends React.Component<IVehicleDiagramSVGProps, IVehicleDiagramSVGState> {
    outlineColor = "rgb(150,150,150)";

    // The armored hull, just inside the outline drawn for the motive type.
    hullShape(): Shape {
        switch (this.props.motive.tag) {
            case "hover":
                return roundedRectShape(50, 30, 400, 560, 45);
            case "vtol":
                return roundedRectShape(64, 16, 372, 584, 170, 70);
            case "naval-surface":
            case "hydrofoil":
                return [[250, 16], [437, 146], [437, 602], [63, 602], [63, 146]];
            case "naval-sub":
                return roundedRectShape(62, 15, 376, 590, 143);
            default:
                return roundedRectShape(61, 21, 378, 578, 22);
        }
    }

    // Every location's section of the hull, with its label, and the turret's gun if it has one.
    sections(): { hull: Shape; sections: IVehicleSection[]; gun?: IBox } {
        const hull = this.hullShape();
        const xs = hull.map(([x]) => x), ys = hull.map(([, y]) => y);
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        const { left: L, right: R, top: T, bottom: B } = INNER;
        const has = (tag: VehicleLocation) => this.props.locations.some((loc) => loc.tag === tag);
        const nameOf = (tag: VehicleLocation) => (this.props.locations.find((loc) => loc.tag === tag)?.name ?? tag).toUpperCase();
        const sections: IVehicleSection[] = [];
        // Each outer section fills from its edge next to the middle outward.
        const outer = (tag: VehicleLocation, label: string, corners: Shape, labelAt: BubblePoint, labelTurn?: number) => {
            const fillFrom = labelTurn
                ? { anchor: [labelTurn < 0 ? L : R, labelAt[1]] as BubblePoint, rowsAlong: "x" as const }
                : { anchor: [250, labelAt[1] < SIDE_SPLIT ? T : B] as BubblePoint, rowsAlong: "y" as const };
            sections.push({ tag, label, shape: clipShape(corners, hull), labelAt, labelTurn, fillFrom, avoid: [labelBox(label, labelAt, labelTurn)] });
        };
        outer("front", "FRONT", [[x0, y0], [x1, y0], [R, T], [L, T]], [250, y0 + 28]);
        outer("rear", "REAR", [[L, B], [R, B], [x1, y1], [x0, y1]], [250, y1 - 12]);
        if (has("frontLeft")) {
            outer("frontLeft", "FRONT LEFT", [[x0, y0], [L, T], [L, SIDE_SPLIT], [x0, SIDE_SPLIT]], [x0 + 18, (T + SIDE_SPLIT) / 2], -90);
            outer("rearLeft", "REAR LEFT", [[x0, SIDE_SPLIT], [L, SIDE_SPLIT], [L, B], [x0, y1]], [x0 + 18, (SIDE_SPLIT + B) / 2], -90);
            outer("frontRight", "FRONT RIGHT", [[x1, y0], [x1, SIDE_SPLIT], [R, SIDE_SPLIT], [R, T]], [x1 - 18, (T + SIDE_SPLIT) / 2], 90);
            outer("rearRight", "REAR RIGHT", [[x1, SIDE_SPLIT], [x1, y1], [R, B], [R, SIDE_SPLIT]], [x1 - 18, (SIDE_SPLIT + B) / 2], 90);
        } else {
            outer("left", "LEFT", [[x0, y0], [L, T], [L, B], [x0, y1]], [x0 + 18, SIDE_SPLIT], -90);
            outer("right", "RIGHT", [[x1, y0], [x1, y1], [R, B], [R, T]], [x1 - 18, SIDE_SPLIT], 90);
        }

        // The middle: turrets from the front back, then a VTOL's rotor.
        const inner = (tag: VehicleLocation, shape: Shape, top: number) => {
            const label = nameOf(tag);
            const labelAt: BubblePoint = [250, top + 16];
            sections.push({ tag, label, shape, labelAt, avoid: [labelBox(label, labelAt)] });
        };
        const turrets = this.props.locations.map((loc) => loc.tag).filter((tag) => tag.startsWith("turret"));
        const gap = 6, width = R - L - 2 * gap;
        let gun: IBox | undefined;
        if (turrets.length >= 3) {
            // A Large Naval Vessel with three or more turrets (TO:AUE p.60): a grid down the hull, from the bow.
            const rows = Math.ceil(turrets.length / 2), cellW = (width - gap) / 2, cellH = (B - T - gap * (rows + 1)) / rows;
            turrets.forEach((tag, index) => {
                const left = L + gap + (index % 2) * (cellW + gap), top = T + gap + Math.floor(index / 2) * (cellH + gap);
                const label = nameOf(tag).replace("TURRET ", "T");
                const labelAt: BubblePoint = [left + cellW / 2, top + 15];
                sections.push({ tag, label, shape: roundedRectShape(left, top, cellW, cellH, 8), labelAt, avoid: [labelBox(label, labelAt)] });
            });
        } else {
            const stack: VehicleLocation[] = [...turrets].sort((a, b) => (b === "turret2" ? 1 : 0) - (a === "turret2" ? 1 : 0));
            const rotorSpace = has("rotor") ? (stack.length > 0 ? 2 * 72 + gap : B - T) : 0;
            const turretH = stack.length > 0 ? (B - T - rotorSpace - gap * (stack.length + 1)) / stack.length : 0;
            stack.forEach((tag, index) => {
                const top = T + gap + index * (turretH + gap);
                inner(tag, roundedRectShape(L + gap, top, width, turretH, Math.min(36, turretH / 4)), top);
            });
            if (has("rotor")) {
                const r = Math.min(76, (rotorSpace - gap) / 2), cy = B - gap / 2 - rotorSpace / 2;
                inner("rotor", circleShape(250, cy, r), cy - r + 4);
            }
            // The gun of the front turret points over the front, between the Front section and the turret.
            const chin = this.props.motive.turret === "chin";
            if (stack.length > 0 && !chin && !has("rotor")) {
                gun = { x: 243, y: T - 42, w: 14, h: 42 + gap + 2 };
                sections[0].avoid.push(gun);
            }
        }
        return { hull, sections, gun };
    }

    renderSection(section: IVehicleSection): JSX.Element {
        const tag = section.tag;
        const structure = this.props.structure[tag as keyof IVehicleStructureAllocation] ?? 0;
        const armor = this.props.armor[tag as keyof IVehicleArmorAllocation] ?? 0;
        const { points, pitch } = packBubbles({ within: [section.shape], avoid: section.avoid }, structure + armor, { maxPitch: 18, ...section.fillFrom });
        const bubble = drawnBubble(pitch * 0.5);
        // In play, damaged bubbles are filled and clicking one marks (or clears) damage up to it.
        const [labelX, labelY] = section.labelAt;
        const bubbles = (from: number, count: number, kind: "is" | "ar") => {
            const damaged = (kind === "is" ? this.props.structureDamage : this.props.armorDamage)?.[tag] ?? 0;
            const onClick = kind === "is" ? this.props.onToggleStructure : this.props.onToggleArmor;
            return points.slice(from, from + count).map(([x, y], i) => (
                <DamageCircleSVG
                    key={`${kind}${i}`}
                    xLoc={x}
                    yLoc={y}
                    radius={bubble.radius}
                    strokeWidth={Math.min(1.5, bubble.strokeWidth)}
                    bgColor={kind === "is" ? STRUCTURE_FILL : undefined}
                    isFilled={i < damaged}
                    inPlay={!!onClick}
                    clickLocation={tag}
                    clickIndex={i}
                    clickFunction={(loc: string, index: number) => onClick?.(loc as VehicleLocation, index)}
                />
            ));
        };
        return (
            <g key={tag} data-location={tag}>
                <polygon points={shapePoints(section.shape)} fill="rgb(255,255,255)" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                <text x={labelX} y={labelY} fontSize={LABEL_SIZE} fontWeight="bold" textAnchor="middle"
                    transform={section.labelTurn ? `rotate(${section.labelTurn} ${labelX} ${labelY})` : undefined}>{section.label}</text>
                {bubbles(0, structure, "is")}
                {bubbles(structure, armor, "ar")}
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

    // The vehicle seen from above, drawn behind the hull.
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
        const width = this.props.width ?? 500;
        const height = 620;
        // Placed at x, y inside a record sheet's own SVG rather than centred on the page.
        const embedded = this.props.x !== undefined;
        const { hull, sections, gun } = this.sections();
        const legend = (x: number, fill: string, label: string) => (
            <g>
                <circle cx={x} cy={7} r={4} fill={fill} stroke="rgb(0,0,0)" strokeWidth={1} />
                <text x={x + 7} y={10} fontSize={9}>{label}</text>
            </g>
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
                {legend(8, "rgb(255,255,255)", "Armor")}
                {legend(50, STRUCTURE_FILL, "Structure")}
                <polygon data-testid="vehicle-hull" points={shapePoints(hull)} fill="rgb(255,255,255)" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                {this.props.motive.tag === "naval-sub" && !sections.some((section) => section.tag.startsWith("turret")) ? (
                    <rect x={210} y={240} width={80} height={140} rx={35} fill="none" stroke={this.outlineColor} strokeWidth={4} />
                ) : null}
                {sections.map((section) => this.renderSection(section))}
                {gun ? <rect data-testid="vehicle-turret-gun" x={gun.x} y={gun.y} width={gun.w} height={gun.h} fill="rgb(255,255,255)" stroke="rgb(0,0,0)" strokeWidth={1.5} /> : null}
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
