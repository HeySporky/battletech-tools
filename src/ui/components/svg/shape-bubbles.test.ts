import { describe, expect, it } from "vitest";
import { circleShape, clipShape, edgeDistance, insideShape, packBubbles, roundedRectShape, type Shape } from "./shape-bubbles";

const square: Shape = [[0, 0], [100, 0], [100, 100], [0, 100]];
// A swept wing: wide at the root, a narrow tip.
const wing: Shape = [[0, 0], [200, 80], [200, 110], [0, 140]];

describe("bubbles packed inside a shape (#589 follow-up: bubbles follow the drawing, not a square)", () => {
    it.each([1, 7, 40, 150, 600])("places %i bubbles, each wholly inside a swept wing", (count) => {
        const { points, pitch } = packBubbles({ within: [wing] }, count, { maxPitch: 18 });
        expect(points).toHaveLength(count);
        for (const point of points) {
            expect(insideShape(wing, point)).toBe(true);
            expect(edgeDistance(wing, point)).toBeGreaterThanOrEqual(pitch / 2 - 1e-9);
        }
    });

    it("uses the largest bubbles that fit, up to the widest spacing", () => {
        expect(packBubbles({ within: [square] }, 4, { maxPitch: 18 }).pitch).toBe(18);
        const crowded = packBubbles({ within: [square] }, 100, { maxPitch: 18 }).pitch;
        expect(crowded).toBeGreaterThan(9);
        expect(crowded).toBeLessThanOrEqual(10);
    });

    it("keeps bubbles off the boxes it is told to avoid (a label)", () => {
        const label = { x: 20, y: 0, w: 60, h: 20 };
        const { points, pitch } = packBubbles({ within: [square], avoid: [label] }, 30, { maxPitch: 18 });
        for (const [x, y] of points) {
            const clear = x + pitch / 2 <= label.x || x - pitch / 2 >= label.x + label.w || y - pitch / 2 >= label.y + label.h;
            expect(clear).toBe(true);
        }
    });

    it("fills from the anchor outward, so a part-filled shape keeps its bubbles together", () => {
        const all = packBubbles({ within: [square] }, 100, { maxPitch: 10 }).points;
        const near = packBubbles({ within: [square] }, 100, { maxPitch: 10, anchor: [50, 100] }).points;
        expect(Math.max(...near.slice(0, 10).map(([, y]) => y))).toBeGreaterThan(80);
        expect(all).toHaveLength(100);
    });

    it("places each bubble inside every shape it is given (a section of a hull)", () => {
        const hull = circleShape(50, 50, 50);
        const { points, pitch } = packBubbles({ within: [hull, square] }, 30, { maxPitch: 18 });
        for (const point of points) {
            expect(edgeDistance(hull, point)).toBeGreaterThanOrEqual(pitch / 2 - 1e-9);
        }
    });

    it("shares bubbles out evenly across separate limbs, each filling from its own middle", () => {
        const legs = [0, 1, 2, 3].map((i): Shape => [[i * 100, 0], [i * 100 + 80, 0], [i * 100 + 80, 100], [i * 100, 100]]);
        const { points } = packBubbles(legs.map((leg) => ({ within: [leg] })), 9, { maxPitch: 18, spreadParts: true });
        const perLeg = legs.map((leg) => points.filter((point) => insideShape(leg, point)).length);
        expect(perLeg).toEqual([3, 2, 2, 2]);
        // The first bubble of each leg is its middle one.
        for (const [x, y] of points.slice(0, 4)) {
            expect(Math.hypot((x % 100) - 40, y - 50)).toBeLessThan(13);
        }
    });

    it("returns nothing for no bubbles", () => {
        expect(packBubbles({ within: [square] }, 0, { maxPitch: 18 }).points).toEqual([]);
    });
});

describe("shapes", () => {
    it("clips a section to a convex hull", () => {
        const clipped = clipShape([[-50, -50], [50, -50], [50, 50], [-50, 50]], square);
        expect(clipped.every(([x, y]) => x >= 0 && x <= 50 && y >= 0 && y <= 50)).toBe(true);
        expect(insideShape(clipped, [25, 25])).toBe(true);
        expect(insideShape(clipped, [75, 25])).toBe(false);
    });

    it("rounds a rectangle's corners", () => {
        const rounded = roundedRectShape(0, 0, 100, 100, 30);
        expect(insideShape(rounded, [2, 2])).toBe(false);
        expect(insideShape(rounded, [50, 2])).toBe(true);
    });
});
