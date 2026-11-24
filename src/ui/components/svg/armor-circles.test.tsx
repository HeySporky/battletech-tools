import React from "react";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import { BIPED_ARMOR_BUBBLES, bubblePositions, QUAD_ARMOR_BUBBLES, type IArmorBubbleLocation } from "./armor-bubble-layouts";
import BipedArmorCircles from "./biped-armor-circles";
import DamageCircleSVG from "./damage-circle-svg";
import QuadArmorCircles from "./quad-armor-circles";
import { BIPED_STRUCTURE_BUBBLES, QUAD_STRUCTURE_BUBBLES } from "./structure-bubble-layouts";

// Every armor bubble shows and toggles its own point of armor: bubble N of a location is filled by armorDamaged(loc, N)
// and a click toggles index N. Hand-written lines once had eight wrong (#589): Biped CT 46 toggled 56, LT/RT 33
// toggled 333, LT 25 showed bubble 2; Quad CT 39 and 51 toggled 19 and 50, the front legs' 27 toggled 17.

type BubbleProps = {
    isFilled: boolean; clickLocation: string; clickIndex: number; xLoc: number; yLoc: number; radius: number; strokeWidth?: number;
};

/** DamageCircleSVG draws its circle 3 short of its radius, with a 2-wide stroke unless told otherwise. */
const ring = (bubble: BubbleProps) => ({ radius: bubble.radius - 3, stroke: bubble.strokeWidth ?? 2 });

// A bubble too small for its stroke reads as a black dot, damaged or not: 200 t bubbles once drew at radius 0 to 2
// with the full 2-wide stroke (#589).
const unreadable = (drawn: BubbleProps[]) => drawn
    .filter((bubble) => ring(bubble).radius < 2 * ring(bubble).stroke)
    .map((bubble) => `${bubble.clickLocation} ${bubble.clickIndex}: r ${ring(bubble).radius}, stroke ${ring(bubble).stroke}`)
    .slice(0, 3);

/** The DamageCircleSVG elements a render returns, in order, through any fragments. */
const bubbles = (node: React.ReactNode): BubbleProps[] => {
    if (Array.isArray(node)) {
        return node.flatMap(bubbles);
    }
    if (!React.isValidElement(node)) {
        return [];
    }
    if (node.type === DamageCircleSVG) {
        return [node.props as BubbleProps];
    }
    return bubbles((node.props as { children?: React.ReactNode }).children);
};

/** A 'Mech stand-in with as much armor as each location's table holds, recording which bubbles it is asked about. */
const fakeMech = (seen: string[], layout: readonly IArmorBubbleLocation[]) => ({
    getArmorAllocation: () => Object.fromEntries(layout.map((location) => [location.field, location.points.length])),
    getMaxLocationArmor: () => 999,
    armorDamaged: (loc: string, index: number) => {
        seen.push(loc + ":" + index);
        return false;
    },
}) as unknown as BattleMech;

// Name, component, and how many bubbles the sheet has room for.
const cases = [
    ["Biped", BipedArmorCircles, 378, BIPED_ARMOR_BUBBLES],
    ["Quad", QuadArmorCircles, 411, QUAD_ARMOR_BUBBLES],
] as const;

const drawnPerLocation = (drawn: BubbleProps[]): Record<string, number> => {
    const perLocation: Record<string, number> = {};
    for (const bubble of drawn) {
        perLocation[bubble.clickLocation] = (perLocation[bubble.clickLocation] ?? 0) + 1;
    }
    return perLocation;
};

describe("'Mech armor bubbles", () => {
    for (const [name, Component, total, layout] of cases) {
        it(`${name}: bubble N of each location shows and toggles index N`, () => {
            const seen: string[] = [];
            const props = { mechData: fakeMech(seen, layout), inPlay: true, armorBoxTop: 0, armorBoxLeft: 0, armorBoxWidth: 0 };
            const drawn = bubbles(new Component(props).render());
            expect(drawn.length).toBe(total);

            const next: Record<string, number> = {};
            const wrong: string[] = [];
            drawn.forEach((bubble, i) => {
                const index = next[bubble.clickLocation] ?? 0;
                next[bubble.clickLocation] = index + 1;
                if (bubble.clickIndex !== index || seen[i] !== bubble.clickLocation + ":" + index) {
                    wrong.push(`${bubble.clickLocation} bubble ${index}: click ${bubble.clickIndex}, shows ${seen[i]}`);
                }
            });
            expect(wrong).toEqual([]);
        });

        it(`${name}: a 200-ton superheavy shows every point of its armor`, () => {
            const mech = new BattleMech();
            mech.setType(name.toLowerCase());
            mech.setTonnage(200);
            mech.allocateArmorMax();
            const allocation = mech.getArmorAllocation() as unknown as Record<string, number>;
            const all = bubbles(new Component({ mechData: mech, inPlay: true, armorBoxTop: 0, armorBoxLeft: 0, armorBoxWidth: 0 }).render());
            const drawn = drawnPerLocation(all);
            expect(allocation.centerTorso + allocation.centerTorsoRear).toBe(120);
            expect(unreadable(all)).toEqual([]);
            for (const location of layout) {
                expect([location.loc, drawn[location.loc] ?? 0]).toEqual([location.loc, allocation[location.field]]);
            }
        });

        it(`${name}: never shows more armor than the rules allow a location`, () => {
            const mech = new BattleMech();
            mech.setType(name.toLowerCase());
            mech.setTonnage(100);
            mech.allocateArmorMax();
            const allocation = mech.getArmorAllocation();
            allocation.head = 30;
            allocation.leftLeg = 500;
            allocation.centerTorsoRear = 500;
            const drawn = drawnPerLocation(bubbles(new Component({ mechData: mech, inPlay: true, armorBoxTop: 0, armorBoxLeft: 0, armorBoxWidth: 0 }).render()));
            expect(drawn.hd).toBe(9);
            expect(drawn.ll).toBe(mech.getInternalStructure().leftLeg * 2);
            expect(drawn.ctr ?? 0).toBe(Math.max(mech.getInternalStructure().centerTorso * 2 - allocation.centerTorso, 0));
        });
    }
});

describe("armor and structure bubble positions", () => {
    const locations = [...BIPED_ARMOR_BUBBLES, ...QUAD_ARMOR_BUBBLES, ...BIPED_STRUCTURE_BUBBLES, ...QUAD_STRUCTURE_BUBBLES];
    const center = (points: [number, number][]) => [
        points.reduce((sum, [x]) => sum + x, 0) / points.length,
        points.reduce((sum, [, y]) => sum + y, 0) / points.length,
    ];

    it("fills a location from the center of its area outward", () => {
        for (const location of locations) {
            const [cx, cy] = center(location.points);
            const distances = bubblePositions(location.points, location.radius, location.points.length).points
                .map(([x, y]) => Math.hypot(x - cx, y - cy));
            expect(distances.every((distance, i) => i === 0 || distance >= distances[i - 1] - 1e-9), location.loc).toBe(true);
        }
    });

    // Superheavies, and an armor that may one day double today's allowance: past its table a location still shows a
    // bubble per point, smaller ones inside the table's own footprint, never overlapping.
    it("fits up to nine times the table, inside its footprint, without overlaps", () => {
        for (const location of locations) {
            const n = location.points.length;
            for (const count of [n + 1, 2 * n, 4 * n, 9 * n]) {
                const { points, radius } = bubblePositions(location.points, location.radius, count);
                expect(points.length).toBe(count);
                for (const [x, y] of points) {
                    const inside = location.points.some(([px, py]) => Math.max(Math.abs(x - px), Math.abs(y - py)) + radius <= location.radius);
                    expect(inside, `${location.loc} ${count}: ${x},${y}`).toBe(true);
                }
                for (let i = 0; i < points.length; i++) {
                    for (let j = i + 1; j < points.length; j++) {
                        if (Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]) < 2 * radius) {
                            expect.fail(`${location.loc} ${count}: bubbles ${i} and ${j} overlap`);
                        }
                    }
                }
            }
        }
    });
});
