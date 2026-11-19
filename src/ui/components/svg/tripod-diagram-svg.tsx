import React, { type JSX } from "react";
import { bubblePositions, type BubblePoint } from "./armor-bubble-layouts";
import BipedArmorDiagramSVG from "./biped-armor-diagram";
import BipedDamageTransferDiagramSVG from "./biped-damage-transfer-diagram-svg";
import BipedInternalStructureDiagramSVG from "./biped-internal-structure-diagram-svg";

/*
* A Tripod is drawn as the Biped art with a Center Leg between the two legs, as the
* IO:AE Tripod record sheet draws it (issue 77). The Center Leg outlines were measured
* in record-sheet coordinates, where battlemech-svg.tsx places each Biped art, and are
* converted into the art's own coordinate space, so they line up wherever the art is
* drawn: the record sheet and the 'Mech Creator's armor step.
*/

const ART_BASE_WIDTH = 744.09448819;
const ART_BASE_HEIGHT = 1052.3622047;

export type SheetPoint = [number, number];

interface IArtPlacement {
    x: number;
    y: number;
    width: number;
}

// Where the record sheet draws each Biped art (battlemech-svg.tsx).
export const TRIPOD_SHEET_ARMOR_ART: IArtPlacement = { x: 1263, y: -10, width: 700 };
export const TRIPOD_SHEET_INTERNAL_ART: IArtPlacement = { x: 1350, y: 1275, width: 420 };

const toArtPoints = (points: SheetPoint[], art: IArtPlacement): string => {
    const scale = ART_BASE_WIDTH / art.width;
    return points.map(([x, y]) => `${((x - art.x) * scale).toFixed(1)},${((y - art.y) * scale).toFixed(1)}`).join(" ");
};

// The Center Leg hangs below the Center Torso label, between the legs and above the rear armor.
export const TRIPOD_SHEET_ARMOR_CENTER_LEG: SheetPoint[] = [
    [1559, 662], [1666, 662], [1673, 705], [1678, 860], [1684, 888],
    [1541, 888], [1547, 860], [1552, 700],
];
const ARMOR_CENTER_LEG = toArtPoints(TRIPOD_SHEET_ARMOR_CENTER_LEG, TRIPOD_SHEET_ARMOR_ART);

// Below the Center Torso's structure label, which also sits between the legs.
export const TRIPOD_SHEET_INTERNAL_CENTER_LEG: SheetPoint[] = [
    [1550, 1697], [1610, 1697], [1614, 1740], [1616, 1838], [1619, 1846],
    [1541, 1846], [1544, 1838], [1546, 1740],
];
const INTERNAL_CENTER_LEG = toArtPoints(TRIPOD_SHEET_INTERNAL_CENTER_LEG, TRIPOD_SHEET_INTERNAL_ART);

// Measured with the damage transfer art at x 547.5, y 2200, 150 wide: the leg hangs from the
// Center Torso, and an arrow points from it into the Center Torso, as the side legs' arrows do.
const TRANSFER_ART: IArtPlacement = { x: 547.5, y: 2200, width: 150 };
const TRANSFER_CENTER_LEG = toArtPoints([
    [614, 2321], [631, 2321], [634, 2395], [636, 2407], [609, 2407], [611, 2395],
], TRANSFER_ART);
const TRANSFER_CENTER_LEG_ARROW = toArtPoints([
    [622.5, 2299], [629.5, 2309], [624.5, 2309], [624.5, 2318], [620.5, 2318], [620.5, 2309], [615.5, 2309],
], TRANSFER_ART);

export interface ITripodCenterLegBubbleLayout {
    // From the armor or structure box's horizontal center and top.
    labelY: number;
    firstRowY: number;
    columns: number;
    columnSpacing: number;
    rowSpacing: number;
    radius: number;
    // The grid's bubbles, as many as the Biped legs hold; more split into smaller ones (bubblePositions).
    max: number;
}

export const TRIPOD_ARMOR_CENTER_LEG_LAYOUT: ITripodCenterLegBubbleLayout = {
    labelY: 680, firstRowY: 711, columns: 5, columnSpacing: 19, rowSpacing: 19, radius: 9, max: 45,
};

export const TRIPOD_INTERNAL_CENTER_LEG_LAYOUT: ITripodCenterLegBubbleLayout = {
    labelY: 462, firstRowY: 488, columns: 4, columnSpacing: 13, rowSpacing: 13, radius: 5.5, max: 32,
};

/** Bubble centers, relative to the layout's center and first row, filling the grid from its center outward. */
export const tripodCenterLegBubbles = (count: number, layout: ITripodCenterLegBubbleLayout): { x: number; y: number; radius: number }[] => {
    const grid = Array.from({ length: layout.max }, (_, index): BubblePoint => [
        (index % layout.columns - (layout.columns - 1) / 2) * layout.columnSpacing,
        Math.floor(index / layout.columns) * layout.rowSpacing,
    ]);
    const { points, radius } = bubblePositions(grid, layout.radius, count);
    return points.map(([x, y]) => ({ x, y, radius }));
};

interface ITripodDiagramSVGProps {
    armless?: boolean;
    className?: string;
    xLoc?: number;
    yLoc?: number;
    width?: number;
    bgColor?: string;
    strokeColor?: string;
}

// The same box the Biped art components give themselves, so a Tripod drops in where a Biped goes.
const TripodArtFrame = ( props: ITripodDiagramSVGProps & { label: string; children: React.ReactNode } ): JSX.Element => {
    const width = props.width ?? 744;
    const height = props.width ? Math.round(props.width / ART_BASE_WIDTH * ART_BASE_HEIGHT) : 627;
    return (
        <svg
            className={props.className}
            x={props.xLoc ?? 0}
            y={props.yLoc ?? 0}
            width={width}
            height={height}
            viewBox={"0 0 " + ART_BASE_WIDTH + " " + ART_BASE_HEIGHT}
            role="img"
            aria-label={props.label}
        >
            {props.children}
        </svg>
    );
};

export function TripodArmorDiagramSVG( props: ITripodDiagramSVGProps ): JSX.Element {
    const strokeColor = props.strokeColor ?? "rgb(0,0,0)";
    return (
        <TripodArtFrame {...props} label="Tripod armor diagram">
            <BipedArmorDiagramSVG width={ART_BASE_WIDTH} bgColor={props.bgColor} strokeColor={props.strokeColor} armless={props.armless} />
            <polygon className="tripod-center-leg" points={ARMOR_CENTER_LEG} fill={props.bgColor ?? "rgb(255,255,255)"} stroke={strokeColor} strokeWidth={6} strokeLinejoin="round" />
        </TripodArtFrame>
    );
}

export function TripodInternalStructureDiagramSVG( props: ITripodDiagramSVGProps ): JSX.Element {
    const strokeColor = props.strokeColor ?? "rgb(0,0,0)";
    return (
        <TripodArtFrame {...props} label="Tripod internal structure diagram">
            <BipedInternalStructureDiagramSVG width={ART_BASE_WIDTH} bgColor={props.bgColor} strokeColor={props.strokeColor} armless={props.armless} />
            <polygon className="tripod-center-leg" points={INTERNAL_CENTER_LEG} fill={props.bgColor ?? "rgb(255,255,255)"} stroke={strokeColor} strokeWidth={6} strokeLinejoin="round" />
        </TripodArtFrame>
    );
}

export function TripodDamageTransferDiagramSVG( props: ITripodDiagramSVGProps ): JSX.Element {
    const strokeColor = props.strokeColor ?? "rgb(0,0,0)";
    return (
        <TripodArtFrame {...props} label="Tripod damage transfer diagram">
            <BipedDamageTransferDiagramSVG width={ART_BASE_WIDTH} bgColor={props.bgColor} strokeColor={props.strokeColor} armless={props.armless} />
            <polygon className="tripod-center-leg" points={TRANSFER_CENTER_LEG} fill={props.bgColor ?? "rgb(255,255,255)"} stroke={strokeColor} strokeWidth={6} strokeLinejoin="round" />
            <polygon className="tripod-center-leg-arrow" points={TRANSFER_CENTER_LEG_ARROW} fill={strokeColor} />
        </TripodArtFrame>
    );
}
