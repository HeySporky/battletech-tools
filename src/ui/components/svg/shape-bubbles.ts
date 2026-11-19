import type { BubblePoint } from "./armor-bubble-layouts";

/*
 * Bubbles placed inside a drawn shape (a vehicle's front, a fighter's wing), so they follow the drawing rather than
 * sitting in a square box over it (#589 follow-up). A shape is a convex polygon, [x, y] corners in drawing units.
 * packBubbles finds the widest spacing at which a location's bubbles all fit, each bubble wholly inside every shape
 * it is given and clear of the boxes it must avoid (labels), and fills from an anchor point outward.
 */

export type Shape = BubblePoint[];

export interface IBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface IBubbleRegion {
    /** Each bubble goes wholly inside all of these. */
    within: Shape[];
    /** And wholly clear of these (a label, a gun barrel). */
    avoid?: IBox[];
}

export interface IPackOptions {
    /** The widest bubble spacing; fewer bubbles than fill the shape at this spacing are drawn at it. */
    maxPitch: number;
    /** Bubbles fill from the one nearest this point outward; the middle of the shape by default. */
    anchor?: BubblePoint;
    /**
     * Fill in rows instead: the row nearest the anchor along this axis first, each row from the anchor's line outward
     * (a vehicle's Front fills from its inner edge toward the bow).
     */
    rowsAlong?: "x" | "y";
    /** Several regions are separate limbs (a ProtoMech's legs): share the bubbles out evenly, each from its own middle. */
    spreadParts?: boolean;
}

/** An ellipse as a polygon, for a spheroid craft's hull or an airship's envelope. */
export const ellipseShape = (cx: number, cy: number, rx: number, ry: number, sides: number = 48): Shape =>
    Array.from({ length: sides }, (_, i): BubblePoint => [cx + rx * Math.cos(2 * Math.PI * i / sides), cy + ry * Math.sin(2 * Math.PI * i / sides)]);

/** A circle as a polygon, for a rotor or a round turret. */
export const circleShape = (cx: number, cy: number, r: number, sides: number = 32): Shape => ellipseShape(cx, cy, r, r, sides);

/** A rectangle with rounded corners, the top two rounded by `rTop` and the bottom two by `rBottom`. */
export const roundedRectShape = (x: number, y: number, w: number, h: number, rTop: number, rBottom: number = rTop): Shape => {
    const arc = (cx: number, cy: number, r: number, from: number): BubblePoint[] => Array.from({ length: 7 }, (_, i): BubblePoint => {
        const angle = (from + i * 15) * Math.PI / 180;
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    });
    return [
        ...arc(x + w - rTop, y + rTop, rTop, 270),
        ...arc(x + w - rBottom, y + h - rBottom, rBottom, 0),
        ...arc(x + rBottom, y + h - rBottom, rBottom, 90),
        ...arc(x + rTop, y + rTop, rTop, 180),
    ];
};

const signedArea = (shape: Shape): number => shape.reduce((sum, [x1, y1], i) => {
    const [x2, y2] = shape[(i + 1) % shape.length];
    return sum + x1 * y2 - x2 * y1;
}, 0) / 2;

/** Which side of the edge a to b the point is on, positive on the inside of a shape wound like `turn`. */
const side = ([ax, ay]: BubblePoint, [bx, by]: BubblePoint, [px, py]: BubblePoint, turn: number): number =>
    turn * ((bx - ax) * (py - ay) - (by - ay) * (px - ax));

// Each shape's winding, worked out once: insideShape runs for every grid point tried.
const windings = new WeakMap<Shape, number>();

export const insideShape =(shape: Shape, point: BubblePoint): boolean => {
    let turn = windings.get(shape);
    if (turn === undefined) {
        turn = Math.sign(signedArea(shape));
        windings.set(shape, turn);
    }
    return shape.every((corner, i) => side(corner, shape[(i + 1) % shape.length], point, turn) >= 0);
};

/** How far the point is from the shape's nearest edge. */
export const edgeDistance = (shape: Shape, [px, py]: BubblePoint): number => shape.reduce((closest, [ax, ay], i) => {
    const [bx, by] = shape[(i + 1) % shape.length];
    const dx = bx - ax, dy = by - ay;
    const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.min(closest, Math.hypot(px - ax - t * dx, py - ay - t * dy));
}, Infinity);

/** The part of `shape` inside the convex `hull` (Sutherland-Hodgman). */
export const clipShape = (shape: Shape, hull: Shape): Shape => {
    const turn = Math.sign(signedArea(hull));
    return hull.reduce((output, a, i) => {
        const b = hull[(i + 1) % hull.length];
        const crossing = (p: BubblePoint, q: BubblePoint): BubblePoint => {
            const sp = side(a, b, p, turn), sq = side(a, b, q, turn);
            const t = sp / (sp - sq);
            return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
        };
        return output.flatMap((p, j) => {
            const q = output[(j + 1) % output.length];
            const pIn = side(a, b, p, turn) >= 0, qIn = side(a, b, q, turn) >= 0;
            if (pIn && qIn) return [q];
            if (pIn) return [crossing(p, q)];
            if (qIn) return [crossing(p, q), q];
            return [];
        });
    }, shape);
};

/** An SVG polygon's points attribute for a shape. */
export const shapePoints = (shape: Shape): string => shape.map(([x, y]) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`).join(" ");

const fits = (region: IBubbleRegion, point: BubblePoint, r: number): boolean =>
    region.within.every((shape) => insideShape(shape, point) && edgeDistance(shape, point) >= r)
    && !(region.avoid ?? []).some(({ x, y, w, h }) =>
        point[0] + r > x && point[0] - r < x + w && point[1] + r > y && point[1] - r < y + h);

/**
 * The middle of every `pitch`-wide grid cell, the grid centred on the bounds of all the regions, where a bubble that
 * wide fits in one of them.
 */
const gridIn = (regions: IBubbleRegion[], pitch: number): BubblePoint[] => {
    const corners = regions.flatMap((region) => region.within.flat());
    const xs = corners.map(([x]) => x), ys = corners.map(([, y]) => y);
    const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const columns = Math.floor((right - left) / pitch), rows = Math.floor((bottom - top) / pitch);
    const x0 = (left + right - (columns - 1) * pitch) / 2, y0 = (top + bottom - (rows - 1) * pitch) / 2;
    const points: BubblePoint[] = [];
    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const point: BubblePoint = [x0 + column * pitch, y0 + row * pitch];
            if (regions.some((region) => fits(region, point, pitch / 2))) points.push(point);
        }
    }
    return points;
};

const packed = new Map<string, { points: BubblePoint[]; pitch: number }>();

/**
 * Where `count` bubbles go inside the region, and their spacing: the widest spacing up to `maxPitch` at which all of
 * them fit, found by halving the range. A bubble's footprint is a `pitch`-wide circle around its point. Several
 * regions are one area made of parts (a fighter's aft: the fuselage's end and the tail fins).
 */
export const packBubbles = (region: IBubbleRegion | IBubbleRegion[], count: number, options: IPackOptions): { points: BubblePoint[]; pitch: number } => {
    const regions = Array.isArray(region) ? region : [region];
    const wanted = Math.max(Math.floor(count), 0);
    if (wanted === 0) {
        return { points: [], pitch: options.maxPitch };
    }
    const key = JSON.stringify([regions, wanted, options]);
    const cached = packed.get(key);
    if (cached) {
        return cached;
    }
    let pitch = options.maxPitch;
    let points = gridIn(regions, pitch);
    if (points.length < wanted) {
        // No spacing wider than one that gives each bubble an equal share of the area can fit them all.
        const area = regions.reduce((sum, part) => sum + Math.min(...part.within.map((shape) => Math.abs(signedArea(shape)))), 0);
        let low = 0, high = Math.min(options.maxPitch, Math.sqrt(area / wanted));
        points = [];
        for (let step = 0; step < 24 && points.length < wanted; step++) {
            for (let i = 0; i < 12; i++) {
                const middle = (low + high) / 2;
                if (gridIn(regions, middle).length >= wanted) low = middle;
                else high = middle;
            }
            pitch = low;
            points = low > 0 ? gridIn(regions, low) : [];
            // The count is not quite monotonic in the spacing: start again below the one that came up short.
            high = low * 0.98;
            low = 0;
        }
    }
    const anchor = options.anchor ?? [
        points.reduce((sum, [x]) => sum + x, 0) / points.length,
        points.reduce((sum, [, y]) => sum + y, 0) / points.length,
    ];
    const across = options.rowsAlong === "x" ? 0 : 1, along = 1 - across;
    const order = (point: BubblePoint, from: BubblePoint): [number, number] => options.rowsAlong
        ? [Math.round(Math.abs(point[across] - from[across]) / pitch), Math.abs(point[along] - from[along])]
        : [Math.hypot(point[0] - from[0], point[1] - from[1]), 0];
    const sorted = (list: BubblePoint[], from: BubblePoint) => [...list].sort((a, b) => {
        const [a1, a2] = order(a, from), [b1, b2] = order(b, from);
        return a1 - b1 || a2 - b2 || a[1] - b[1] || a[0] - b[0];
    });
    let ordered: BubblePoint[];
    if (options.spreadParts && regions.length > 1) {
        // Each part fills from its own middle, the parts taking turns.
        const parts = regions.map((part) => points.filter((point) => regions.find((each) => fits(each, point, pitch / 2)) === part))
            .map((list) => sorted(list, [list.reduce((sum, [x]) => sum + x, 0) / list.length, list.reduce((sum, [, y]) => sum + y, 0) / list.length]));
        ordered = [];
        for (let rank = 0; rank < Math.max(...parts.map((list) => list.length)); rank++) {
            ordered.push(...parts.filter((list) => rank < list.length).map((list) => list[rank]));
        }
    } else {
        ordered = sorted(points, anchor);
    }
    const result = { points: ordered.slice(0, wanted), pitch };
    if (packed.size > 2000) {
        packed.clear();
    }
    packed.set(key, result);
    return result;
};
