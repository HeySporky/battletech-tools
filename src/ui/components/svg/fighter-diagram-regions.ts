import type { FighterArc } from "../../../classes/aerospace-fighter";
import type { BubblePoint } from "./armor-bubble-layouts";
import { clipShape, ellipseShape, type Shape } from "./shape-bubbles";

/*
 * Where each arc's bubbles go on the aerospace armor diagram, for each craft silhouette: the arc's part of the
 * silhouette itself (a fighter's wing is the wing), in the diagram's 600 x 470 drawing units. A part is a convex
 * shape; an arc of several parts (a fighter's aft: the end of the fuselage and the tail fins) draws `outline` around
 * them all. Labels sit in the open space beside the craft, or inside a part where there is none.
 */

export type DiagramArc = FighterArc | "si";
export type DiagramSilhouette = "fighter" | "aerodyne" | "spheroid" | "airship" | "satellite";

export interface IArcRegion {
    parts: Shape[];
    outline?: Shape;
    /** The arc's name (and threshold, on a second line) at this point, anchored as an SVG text-anchor. */
    label: { at: BubblePoint; anchor: "start" | "middle" | "end" };
    /** Bubbles fill in rows from this edge outward (a wing from its root); from the arc's middle when not given. */
    fillFrom?: { anchor: BubblePoint; rowsAlong: "x" | "y" };
}

const WIDTH = 600;

/** The right-hand twin of a left-hand shape. */
const mirror = (shape: Shape): Shape => shape.map(([x, y]): BubblePoint => [WIDTH - x, y]).reverse();

const rect = (left: number, top: number, right: number, bottom: number): Shape => [[left, top], [right, top], [right, bottom], [left, bottom]];

/** Left and right wings (or side arcs) from the left one, labelled under each tip. */
const wings = (left: Shape, labelY: number, root: number, rootY: number): Pick<Record<DiagramArc, IArcRegion>, "leftWing" | "rightWing"> => ({
    leftWing: { parts: [left], label: { at: [8, labelY], anchor: "start" }, fillFrom: { anchor: [root, rootY], rowsAlong: "x" } },
    rightWing: { parts: [mirror(left)], label: { at: [WIDTH - 8, labelY], anchor: "end" }, fillFrom: { anchor: [WIDTH - root, rootY], rowsAlong: "x" } },
});

// A cranked delta with canards and twin fins (FighterDiagramSVG's fighter silhouette).
// The nose is the cone, the canards and the fuselage ahead of the Structural Integrity.
// Parts overlap, so no row of bubbles is lost where they meet.
const CANARD: Shape = [[280, 120], [270, 152], [208, 146], [210, 128]];
const FIGHTER: Record<DiagramArc, IArcRegion> = {
    nose: {
        parts: [
            [[300, 8], [320, 70], [330, 120], [345, 152], [345, 210], [255, 210], [255, 152], [270, 120], [280, 70]],
            CANARD,
            mirror(CANARD),
        ],
        outline: [[300, 8], [320, 70], [330, 120], [390, 128], [392, 146], [345, 152], [345, 210], [255, 210], [255, 152], [208, 146],
            [210, 128], [270, 120], [280, 70]],
        label: { at: [345, 34], anchor: "start" },
        fillFrom: { anchor: [300, 210], rowsAlong: "y" },
    },
    ...wings([[255, 152], [40, 262], [4, 300], [4, 318], [255, 312]], 345, 255, 240),
    si: {
        parts: [[[255, 210], [345, 210], [345, 312], [342, 340], [258, 340], [255, 312]]],
        label: { at: [300, 226], anchor: "middle" },
    },
    aft: {
        parts: [
            [[258, 340], [342, 340], [338, 392], [338, 452], [262, 452], [262, 392]],
            [[262, 392], [338, 392], [392, 446], [392, 452], [208, 452], [208, 446]],
        ],
        outline: [[258, 340], [342, 340], [338, 392], [392, 446], [392, 452], [208, 452], [208, 446], [262, 392]],
        label: { at: [404, 410], anchor: "start" },
        fillFrom: { anchor: [300, 340], rowsAlong: "y" },
    },
};

// A blunt lifting body with swept wings and a single dorsal fin.
const AERODYNE: Record<DiagramArc, IArcRegion> = {
    nose: {
        parts: [[[300, 6], [335, 14], [355, 50], [366, 110], [369, 160], [231, 160], [234, 110], [245, 50], [265, 14]]],
        label: { at: [385, 34], anchor: "start" },
        fillFrom: { anchor: [300, 160], rowsAlong: "y" },
    },
    ...wings([[228, 196], [40, 326], [6, 372], [6, 396], [228, 388]], 418, 228, 300),
    si: {
        parts: [[[231, 160], [369, 160], [372, 196], [372, 330], [228, 330], [228, 196]]],
        label: { at: [300, 176], anchor: "middle" },
    },
    aft: {
        parts: [[[228, 330], [372, 330], [372, 388], [362, 436], [334, 464], [266, 464], [238, 436], [228, 388]]],
        label: { at: [384, 446], anchor: "start" },
        fillFrom: { anchor: [300, 330], rowsAlong: "y" },
    },
};

// A sphere on three landing legs, cut like a picture frame: the Nose across the top, the sides, the Aft at the bottom.
const SPHERE = ellipseShape(300, 222, 274, 212);
const SPHEROID: Record<DiagramArc, IArcRegion> = {
    nose: {
        parts: [clipShape([[0, 0], [WIDTH, 0], [400, 130], [200, 130]], SPHERE)],
        label: { at: [300, 34], anchor: "middle" },
        fillFrom: { anchor: [300, 130], rowsAlong: "y" },
    },
    leftWing: {
        parts: [clipShape([[0, 0], [200, 130], [200, 314], [0, 444]], SPHERE)],
        label: { at: [104, 214], anchor: "middle" },
        fillFrom: { anchor: [200, 222], rowsAlong: "x" },
    },
    rightWing: {
        parts: [clipShape([[WIDTH, 0], [WIDTH, 444], [400, 314], [400, 130]], SPHERE)],
        label: { at: [496, 214], anchor: "middle" },
        fillFrom: { anchor: [400, 222], rowsAlong: "x" },
    },
    si: {
        parts: [rect(200, 130, 400, 314)],
        label: { at: [300, 146], anchor: "middle" },
    },
    aft: {
        parts: [clipShape([[200, 314], [400, 314], [WIDTH, 444], [0, 444]], SPHERE)],
        label: { at: [300, 404], anchor: "middle" },
        fillFrom: { anchor: [300, 314], rowsAlong: "y" },
    },
};

// A rigid envelope, its swept tail fins reaching out under the side arcs.
const ENVELOPE = ellipseShape(300, 232, 108, 226);
const AIRSHIP: Record<DiagramArc, IArcRegion> = {
    nose: {
        parts: [clipShape(rect(0, 0, WIDTH, 150), ENVELOPE)],
        label: { at: [420, 34], anchor: "start" },
        fillFrom: { anchor: [300, 150], rowsAlong: "y" },
    },
    ...wings(clipShape([[205, 110], [40, 250], [10, 330], [10, 438], [220, 410]], rect(0, 0, 186, 470)), 136, 186, 340),
    si: {
        parts: [clipShape(rect(0, 150, WIDTH, 320), ENVELOPE)],
        label: { at: [300, 168], anchor: "middle" },
    },
    aft: {
        parts: [clipShape(rect(0, 320, WIDTH, 470), ENVELOPE)],
        label: { at: [420, 446], anchor: "start" },
        fillFrom: { anchor: [300, 320], rowsAlong: "y" },
    },
};

// A boxy bus, a solar panel on a strut to each side: the panels are the side arcs.
const SATELLITE: Record<DiagramArc, IArcRegion> = {
    nose: {
        parts: [rect(206, 8, 394, 150)],
        label: { at: [404, 34], anchor: "start" },
        fillFrom: { anchor: [300, 150], rowsAlong: "y" },
    },
    ...wings(rect(8, 142, 202, 334), 118, 202, 238),
    si: {
        parts: [rect(206, 150, 394, 320)],
        label: { at: [300, 166], anchor: "middle" },
    },
    aft: {
        parts: [rect(206, 320, 394, 462)],
        label: { at: [404, 446], anchor: "start" },
        fillFrom: { anchor: [300, 320], rowsAlong: "y" },
    },
};

export const ARC_REGIONS: Record<DiagramSilhouette, Record<DiagramArc, IArcRegion>> = {
    fighter: FIGHTER,
    aerodyne: AERODYNE,
    spheroid: SPHEROID,
    airship: AIRSHIP,
    satellite: SATELLITE,
};

/** The regions stretched to a taller diagram (a DropShip's), `scale` times as tall. */
export const stretchRegions = (regions: Record<DiagramArc, IArcRegion>, scale: number): Record<DiagramArc, IArcRegion> => {
    const stretch = (shape: Shape): Shape => shape.map(([x, y]): BubblePoint => [x, y * scale]);
    const point = ([x, y]: BubblePoint): BubblePoint => [x, y * scale];
    return Object.fromEntries(Object.entries(regions).map(([arc, region]) => [arc, {
        parts: region.parts.map(stretch),
        outline: region.outline ? stretch(region.outline) : undefined,
        label: { at: point(region.label.at), anchor: region.label.anchor },
        fillFrom: region.fillFrom ? { anchor: point(region.fillFrom.anchor), rowsAlong: region.fillFrom.rowsAlong } : undefined,
    }])) as Record<DiagramArc, IArcRegion>;
};
