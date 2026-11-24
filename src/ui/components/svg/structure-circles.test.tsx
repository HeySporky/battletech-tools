import React from "react";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import BattleMechSVG from "./battlemech-svg";
import DamageCircleSVG from "./damage-circle-svg";

// Every internal structure bubble shows and toggles its own point: bubble N of a location is filled by
// structureDamaged(loc, N) and a click toggles index N. The hand-written lines held 3/33/25/20/30 (Biped head, CT,
// side torso, arm, leg), so a superheavy's structure ran off the sheet: 200 t needs 4/60/42/33/42 (#589).

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

const LOCATIONS: Record<string, string> = {
    hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm",
    ll: "leftLeg", rl: "rightLeg", cl: "centerLeg",
};

const sheetBubbles = (type: string, tons: number, seen: string[] = []) => {
    const mech = new BattleMech();
    mech.setType(type);
    mech.setTonnage(tons);
    const structureDamaged = mech.structureDamaged.bind(mech);
    mech.structureDamaged = (loc: string, index: number) => {
        seen.push(loc + ":" + index);
        return structureDamaged(loc, index);
    };
    return { mech, drawn: bubbles(new BattleMechSVG({ mechData: mech, inPlay: true }).render()) };
};

describe("'Mech internal structure bubbles", () => {
    for (const type of ["biped", "quad", "tripod"]) {
        for (const tons of [20, 100, 200]) {
            it(`${type} ${tons} t: one bubble per point of structure in every location`, () => {
                const { mech, drawn } = sheetBubbles(type, tons);
                const structure = mech.getInternalStructure() as unknown as Record<string, number>;
                const perLocation: Record<string, number> = {};
                for (const bubble of drawn) {
                    perLocation[bubble.clickLocation] = (perLocation[bubble.clickLocation] ?? 0) + 1;
                }
                const expected = Object.fromEntries(Object.entries(LOCATIONS)
                    .filter(([loc, field]) => (structure[field] ?? 0) > 0 && (loc !== "cl" || type === "tripod"))
                    .map(([loc, field]) => [loc, structure[field]]));
                expect(perLocation).toEqual(expected);
                expect(unreadable(drawn)).toEqual([]);
            });
        }

        it(`${type}: bubble N of each location shows and toggles index N`, () => {
            const seen: string[] = [];
            const { drawn } = sheetBubbles(type, 200, seen);
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
    }
});
