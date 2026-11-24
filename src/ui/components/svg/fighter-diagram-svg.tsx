import React, { type JSX } from 'react';
import { FighterArc, IFighterArmorAllocation } from '../../../classes/aerospace-fighter';
import { drawnBubble } from './armor-bubble-layouts';
import DamageCircleSVG from './damage-circle-svg';
import { ARC_REGIONS, stretchRegions, type DiagramArc, type DiagramSilhouette, type IArcRegion } from './fighter-diagram-regions';
import { packBubbles, shapePoints, type IBox } from './shape-bubbles';

const TITLE_SIZE = 10, THRESHOLD_SIZE = 9;

// Schematic top-down aerospace record sheet diagram (hand-built shapes, not traced artwork): nose at the top, a wing on
// each side, aft at the bottom and the Structural Integrity track in the fuselage between them. Each arc is its part
// of the craft's silhouette (fighter-diagram-regions.ts), and its bubbles are packed inside that shape.
export default class FighterDiagramSVG extends React.Component<IFighterDiagramSVGProps> {
    outlineColor = "rgb(170,170,170)";

    // The silhouette whose shapes the arcs take; play mode, with no silhouette drawn, takes a fighter's.
    get shape(): DiagramSilhouette {
        const silhouette = this.props.silhouette;
        return silhouette === true || !silhouette ? "fighter" : silhouette;
    }

    // An arc's label: its name and count, and its threshold below when given, with the box they cover.
    renderLabel(region: IArcRegion, title: string, threshold?: number): { label: JSX.Element; box: IBox } {
        const [x, y] = region.label.at;
        const width = Math.max(title.length * 6.2, threshold === undefined ? 0 : 11 * 5.4) + 4;
        const left = region.label.anchor === "start" ? x - 2 : region.label.anchor === "end" ? x - width + 2 : x - width / 2;
        const label = (
            <g>
                <text x={x} y={y} fontSize={TITLE_SIZE} fontWeight="bold" textAnchor={region.label.anchor}>{title}</text>
                {threshold !== undefined ? <text x={x} y={y + 11} fontSize={THRESHOLD_SIZE} textAnchor={region.label.anchor}>Threshold {threshold}</text> : null}
            </g>
        );
        return { label, box: { x: left, y: y - TITLE_SIZE, w: width, h: TITLE_SIZE + (threshold === undefined ? 3 : 14) } };
    }

    // An arc (or the Structural Integrity track): its shape, label and bubbles. In play, damaged bubbles are filled and
    // clicking one marks (or clears) damage up to it.
    renderRegion(arc: DiagramArc, region: IArcRegion, title: string, count: number, damaged: number, threshold: number | undefined,
        onClick?: (index: number) => void): JSX.Element {
        const { label, box } = this.renderLabel(region, title, threshold);
        const { points, pitch } = packBubbles(region.parts.map((part) => ({ within: [part], avoid: [box] })), count,
            { maxPitch: this.props.maxPipSpacing ?? 20, ...region.fillFrom });
        const bubble = drawnBubble(pitch / 2);
        const fill = arc === "si" ? "rgb(245,245,245)" : "rgb(255,255,255)";
        const testId = arc === "si" ? undefined : `armor-diagram-${arc}`;
        return (
            <g key={arc} data-testid={testId} data-arc={arc} data-damage={arc === "si" ? undefined : damaged}>
                {region.outline
                    ? (
                        <>
                            {region.parts.map((part, i) => <polygon key={i} points={shapePoints(part)} fill={fill} stroke="none" />)}
                            <polygon points={shapePoints(region.outline)} fill="none" stroke="rgb(0,0,0)" strokeWidth={1.5} />
                        </>
                    )
                    : region.parts.map((part, i) => <polygon key={i} points={shapePoints(part)} fill={fill} stroke="rgb(0,0,0)" strokeWidth={1.5} />)}
                {label}
                {points.map(([x, y], i) => (
                    <DamageCircleSVG
                        key={`${arc}${i}`}
                        xLoc={x}
                        yLoc={y}
                        radius={bubble.radius}
                        strokeWidth={bubble.strokeWidth}
                        isFilled={i < damaged}
                        inPlay={!!onClick}
                        clickLocation={arc}
                        clickIndex={i}
                        clickFunction={(_location: string, index: number) => onClick?.(index)}
                    />
                ))}
            </g>
        );
    }

    // Our own craft, drawn for the printed sheet, or a dashed fighter outline in play mode.
    renderOutline(): JSX.Element {
        const fill = "rgb(222,222,222)", stroke = "rgb(150,150,150)";
        switch (this.props.silhouette) {
            case true:
            case "fighter":
                // A cranked delta with canards and twin fins.
                return <path data-testid="fighter-silhouette" fill={fill} stroke={stroke} strokeWidth={2}
                    d="M300,2 L322,70 L330,120 L390,128 L392,146 L345,152 L560,262 L596,300 L596,318 L345,312 L338,392 L392,446 L392,466 L322,452 L300,468 L278,452 L208,466 L208,446 L262,392 L255,312 L4,318 L4,300 L40,262 L255,152 L208,146 L210,128 L270,120 L278,70 Z" />;
            case "aerodyne":
                // A blunt lifting body with swept wings and a single dorsal fin.
                return <path data-testid="aerodyne-silhouette" fill={fill} stroke={stroke} strokeWidth={2}
                    d="M300,4 C342,10 362,64 368,130 L372,196 L560,326 L594,372 L594,396 L372,388 L362,436 L334,466 L266,466 L238,436 L228,388 L6,396 L6,372 L40,326 L228,196 L232,130 C238,64 258,10 300,4 Z" />;
            case "spheroid":
                // A sphere on three landing legs.
                return (
                    <g data-testid="spheroid-silhouette" fill={fill} stroke={stroke} strokeWidth={2}>
                        <path d="M140,360 L96,462 L130,462 L176,380 Z M460,360 L504,462 L470,462 L424,380 Z M282,420 L282,466 L318,466 L318,420 Z" />
                        <ellipse cx={300} cy={222} rx={280} ry={218} />
                    </g>
                );
            case "airship":
                // A rigid envelope with ribs, a gondola and swept tail fins reaching out under the side arcs.
                return (
                    <g data-testid="airship-silhouette" fill={fill} stroke={stroke} strokeWidth={2}>
                        <path d="M205,110 L40,250 L8,330 L8,440 L220,410 Z M395,110 L560,250 L592,330 L592,440 L380,410 Z" />
                        <ellipse cx={300} cy={232} rx={112} ry={230} />
                        <path fill="none" d="M300,2 L300,462 M245,14 C215,120 215,350 245,450 M355,14 C385,120 385,350 355,450" />
                        <path d="M286,455 L300,469 L314,455 Z" />
                    </g>
                );
            case "satellite":
                // A boxy bus with an antenna mast, and a solar panel on a strut to each side.
                return (
                    <g data-testid="satellite-silhouette" fill={fill} stroke={stroke} strokeWidth={2}>
                        <rect x={204} y={6} width={192} height={458} rx={6} />
                        <path fill="none" d="M300,6 L300,0 M204,235 L170,235 M396,235 L430,235" />
                        <rect x={6} y={140} width={204} height={196} rx={4} />
                        <rect x={390} y={140} width={204} height={196} rx={4} />
                        <path fill="none" d="M74,140 L74,336 M142,140 L142,336 M458,140 L458,336 M526,140 L526,336" />
                    </g>
                );
            default:
                // Play mode: the fighter's outline, dashed, around its arcs.
                return <path fill="none" stroke={this.outlineColor} strokeWidth={2} strokeDasharray="6 4"
                    d="M300,2 L322,70 L330,120 L390,128 L392,146 L345,152 L560,262 L596,300 L596,318 L345,312 L338,392 L392,446 L392,466 L322,452 L300,468 L278,452 L208,466 L208,446 L262,392 L255,312 L4,318 L4,300 L40,262 L255,152 L208,146 L210,128 L270,120 L278,70 Z" />;
        }
    }

    render = (): JSX.Element => {
        const toggle = this.props.onToggleArmor, toggleSI = this.props.onToggleStructure;
        const width = this.props.width ?? 600;
        // A DropShip's diagram stands taller, its arcs and silhouette stretched to fill a tall box.
        const height = this.props.tall ? 760 : 470;
        const regions = this.props.tall ? stretchRegions(ARC_REGIONS[this.shape], height / 470) : ARC_REGIONS[this.shape];
        const arcs: [FighterArc, string][] = [
            ["nose", "Nose"],
            ["leftWing", this.props.sideLabels?.left ?? "Left Wing"],
            ["rightWing", this.props.sideLabels?.right ?? "Right Wing"],
            ["aft", "Aft"],
        ];
        const si = this.props.structuralIntegrity;
        // Placed at x, y inside a record sheet's own SVG rather than scaled to the page.
        const embedded = this.props.x !== undefined;
        return (
            <svg
                x={embedded ? this.props.x : undefined}
                y={embedded ? this.props.y : undefined}
                viewBox={`0 0 600 ${height}`}
                width={width}
                height={embedded ? Math.round(width / 600 * height) : undefined}
                xmlns="http://www.w3.org/2000/svg"
                style={embedded ? undefined : { maxWidth: "100%", height: "auto" }}
            >
                {this.props.tall ? <g transform={`scale(1, ${height / 470})`}>{this.renderOutline()}</g> : this.renderOutline()}
                {arcs.map(([arc, name]) => {
                    const armor = this.props.armor[arc];
                    return this.renderRegion(arc, regions[arc], `${name} (${armor})`, armor, this.props.armorDamage?.[arc] ?? 0,
                        this.props.thresholds?.[arc], toggle ? (index) => toggle(arc, index) : undefined);
                })}
                {this.renderRegion("si", regions.si, `SI (${si})`, si, this.props.structureDamage ?? 0, undefined,
                    toggleSI ? (index) => toggleSI(index) : undefined)}
            </svg>
        );
    }
}

interface IFighterDiagramSVGProps {
    armor: IFighterArmorAllocation;
    structuralIntegrity: number;
    width?: number;
    /** Where to place the diagram inside a record sheet's own SVG; it stands alone when not given. */
    x?: number;
    y?: number;
    /** The widest pip spacing to start from; a printed sheet gives its pips more room than play mode. */
    maxPipSpacing?: number;
    /** A solid craft silhouette, as on a printed record sheet, in place of the dashed outline; true is a fighter. */
    silhouette?: boolean | "fighter" | "aerodyne" | "spheroid" | "airship" | "satellite";
    /** A taller diagram, 600 x 760, for a DropShip's armor. */
    tall?: boolean;
    /** Damage thresholds by arc, shown when given. */
    thresholds?: IFighterArmorAllocation;
    armorDamage?: IFighterArmorAllocation;
    structureDamage?: number;
    onToggleArmor?: (arc: FighterArc, index: number) => void;
    onToggleStructure?: (index: number) => void;
    /** Names for the two side arcs when the craft has no wings (a spheroid Small Craft's "Left Side"). */
    sideLabels?: { left: string; right: string };
}
