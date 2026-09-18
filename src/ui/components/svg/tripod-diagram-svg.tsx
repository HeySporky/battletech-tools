import React from "react";

type TripodDiagramKind = "armor" | "internal" | "rear" | "transfer";

export interface ITripodRegion {
    id: string;
    points: string;
    label: string;
    x: number;
    y: number;
}

export interface ITripodBubblePosition {
    x: number;
    y: number;
}

export const TRIPOD_FRONT_REGIONS: ITripodRegion[] = [
    { id: "head", points: "370,70 430,70 415,125 385,125", label: "HEAD", x: 400, y: 105 },
    { id: "ct", points: "350,145 450,145 470,270 400,335 330,270", label: "CENTER TORSO", x: 400, y: 235 },
    { id: "lt", points: "330,150 245,165 235,275 315,300 345,245", label: "L. TORSO", x: 280, y: 230 },
    { id: "rt", points: "470,150 555,165 565,275 485,300 455,245", label: "R. TORSO", x: 520, y: 230 },
    { id: "la", points: "235,170 160,190 155,315 225,295", label: "L. ARM", x: 190, y: 255 },
    { id: "ra", points: "565,170 640,190 645,315 575,295", label: "R. ARM", x: 610, y: 255 },
    { id: "ll", points: "275,315 345,305 315,480 210,515", label: "L. LEG", x: 270, y: 420 },
    { id: "rl", points: "525,315 455,305 485,480 590,515", label: "R. LEG", x: 530, y: 420 },
    { id: "cl", points: "375,335 425,335 450,540 350,540", label: "CTR LEG", x: 400, y: 445 },
];

export const TRIPOD_REAR_REGIONS: ITripodRegion[] = [
    { id: "lt-rear", points: "190,120 300,120 285,300 205,300", label: "L. REAR", x: 245, y: 220 },
    { id: "ct-rear", points: "310,120 490,120 475,300 325,300", label: "CTR REAR", x: 400, y: 220 },
    { id: "rt-rear", points: "500,120 610,120 595,300 515,300", label: "R. REAR", x: 555, y: 220 },
];

export const TRIPOD_CENTER_LEG_BUBBLES: ITripodBubblePosition[] = Array.from({ length: 30 }, (_, index) => ({
    x: (index % 5) * 23 - 46,
    y: Math.floor(index / 5) * 25,
}));

const tripodTransferLinks = [
    "M400 147V180",
    "M300 280H180",
    "M500 280H620",
    "M350 470H180",
    "M450 470H620",
    "M400 575V625",
];

interface ITripodDiagramSVGProps {
    kind: TripodDiagramKind;
    xLoc?: number;
    yLoc?: number;
    width?: number;
    height?: number;
    bgColor?: string;
    strokeColor?: string;
}

const armorFill = "rgba(255, 85, 85, 0.12)";
const internalFill = "rgba(85, 255, 85, 0.12)";

export default function TripodDiagramSVG({
    kind,
    xLoc = 0,
    yLoc = 0,
    width = 700,
    height = 420,
    bgColor = "transparent",
    strokeColor = "rgb(0,0,0)",
}: ITripodDiagramSVGProps): JSX.Element {
    const isRear = kind === "rear";
    const isTransfer = kind === "transfer";
    const fill = kind === "internal" ? internalFill : armorFill;
    const title = kind === "armor" ? "TRIPOD ARMOR" : kind === "internal" ? "TRIPOD INTERNAL STRUCTURE" : kind === "rear" ? "TRIPOD REAR ARMOR" : "TRIPOD DAMAGE TRANSFER";

    return (
        <svg x={xLoc} y={yLoc} width={width} height={height} viewBox="0 0 800 650" role="img" aria-label={title}>
            <rect x="0" y="0" width="800" height="650" fill={bgColor} opacity="0" />
            <text x="400" y="35" textAnchor="middle" fill={strokeColor} fontSize="22" fontWeight="bold">{title}</text>
            {isRear ? (
                <g stroke={strokeColor} strokeWidth="3" fill={fill}>
                    {TRIPOD_REAR_REGIONS.map(region => <React.Fragment key={region.id}><polygon points={region.points} /><text x={region.x} y={region.y} fill={strokeColor} stroke="none" textAnchor="middle" fontSize="18">{region.label}</text></React.Fragment>)}
                </g>
            ) : isTransfer ? (
                <g stroke={strokeColor} strokeWidth="3" fill="none">
                    <circle cx="400" cy="105" r="42" />
                    <polygon points="340,180 460,180 500,320 400,390 300,320" fill={fill} />
                    <polygon points="225,215 315,225 300,360 215,340" fill={fill} />
                    <polygon points="485,225 575,215 585,340 500,360" fill={fill} />
                    <polygon points="300,360 365,350 335,540 245,570" fill={fill} />
                    <polygon points="435,350 500,360 555,570 465,540" fill={fill} />
                    <polygon points="375,390 425,390 450,575 350,575" fill={fill} />
                    {tripodTransferLinks.map(link => <path key={link} d={link} markerEnd="url(#tripod-arrow)" />)}
                    <defs>
                        <marker id="tripod-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L7,3 z" fill={strokeColor} />
                        </marker>
                    </defs>
                    <text x="400" y="105" fill={strokeColor} stroke="none" textAnchor="middle" fontSize="16">HEAD</text>
                    <text x="400" y="285" fill={strokeColor} stroke="none" textAnchor="middle" fontSize="16">CENTER TORSO</text>
                    <text x="400" y="620" fill={strokeColor} stroke="none" textAnchor="middle" fontSize="16">CENTER LEG</text>
                </g>
            ) : (
                <g stroke={strokeColor} strokeWidth="3" fill={fill}>
                    {TRIPOD_FRONT_REGIONS.map(region => <React.Fragment key={region.id}><polygon points={region.points} /><text x={region.x} y={region.y} fill={strokeColor} stroke="none" textAnchor="middle" fontSize={region.id === "ct" || region.id === "head" ? 16 : 14}>{region.label}</text></React.Fragment>)}
                </g>
            )}
        </svg>
    );
}
