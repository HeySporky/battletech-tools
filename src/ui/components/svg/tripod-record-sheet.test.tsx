import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import BattleMechSVG from "./battlemech-svg";
import * as tripodDiagram from "./tripod-diagram-svg";

// A 100-ton Tripod with every location at its maximum armor (Center Leg 42).
const maxedMech = (type: string): BattleMech => {
    const mech = new BattleMech();
    mech.setEra("ilClan");
    mech.setType(type);
    mech.setTonnage(100);
    mech.setArmorWeight(mech.getMaxArmorTonnage());
    mech.setHeadArmor(9);
    mech.setCenterTorsoArmor(40);
    mech.setCenterTorsoRearArmor(22);
    mech.setLeftTorsoArmor(30);
    mech.setLeftTorsoRearArmor(12);
    mech.setRightTorsoArmor(30);
    mech.setRightTorsoRearArmor(12);
    mech.setLeftArmArmor(34);
    mech.setRightArmArmor(34);
    mech.setLeftLegArmor(42);
    mech.setRightLegArmor(42);
    if (type === "tripod") {
        mech.setCenterLegArmor(42);
    }
    return mech;
};

const circleCount = (markup: string) => (markup.match(/<circle/g) ?? []).length;

const insidePolygon = (x: number, y: number, polygon: [number, number][]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
};

// Issue 77: the Tripod record sheet draws the Biped art with a Center Leg, as IO:AE's Tripod sheet does.
describe("Tripod record sheet (issue 77)", () => {
    it("draws the Biped art with a Center Leg in the armor, structure and damage transfer diagrams", () => {
        const markup = renderToStaticMarkup(<BattleMechSVG mechData={maxedMech("tripod")} />);
        expect(markup).toContain('aria-label="Tripod armor diagram"');
        expect(markup).toContain('aria-label="Tripod internal structure diagram"');
        expect(markup).toContain('aria-label="Tripod damage transfer diagram"');
        expect((markup.match(/class="tripod-center-leg"/g) ?? []).length).toBe(3);
        expect(markup).not.toContain("TRIPOD ARMOR");
        expect(markup).toContain("CENTER LEG");
    });

    it("prints a bubble for every point of Center Leg armor and structure, past 30", () => {
        const tripod = maxedMech("tripod");
        const extra = circleCount(renderToStaticMarkup(<BattleMechSVG mechData={tripod} />))
            - circleCount(renderToStaticMarkup(<BattleMechSVG mechData={maxedMech("biped")} />));
        expect(tripod.getArmorAllocation().centerLeg).toBe(42);
        expect(extra).toBe(42 + (tripod.getInternalStructure().centerLeg ?? 0));
    });

    it("prints all 84 points of a 200-ton superheavy Tripod's Center Leg armor", () => {
        const superheavy = (type: string) => {
            const mech = new BattleMech();
            mech.setType(type);
            mech.setTonnage(200);
            mech.allocateArmorMax();
            return mech;
        };
        const tripod = superheavy("tripod");
        const extra = circleCount(renderToStaticMarkup(<BattleMechSVG mechData={tripod} />))
            - circleCount(renderToStaticMarkup(<BattleMechSVG mechData={superheavy("biped")} />));
        expect(tripod.getArmorAllocation().centerLeg).toBe(84);
        expect(extra).toBe(84 + (tripod.getInternalStructure().centerLeg ?? 0));
    });

    // Up to twice today's superheavy allowance, for an armor that may one day double it.
    it("keeps every Center Leg bubble inside the Center Leg it draws", () => {
        const sheet = new BattleMechSVG({ mechData: new BattleMech() });
        const check = (layout: tripodDiagram.ITripodCenterLegBubbleLayout, polygon: tripodDiagram.SheetPoint[], centerX: number, top: number) => {
            for (const count of [layout.max, 84, 168]) {
                for (const bubble of tripodDiagram.tripodCenterLegBubbles(count, layout)) {
                    const x = centerX + bubble.x;
                    const y = top + layout.firstRowY + bubble.y;
                    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                        expect(insidePolygon(x + dx * (bubble.radius + 3), y + dy * (bubble.radius + 3), polygon)).toBe(true);
                    }
                }
            }
        };
        check(tripodDiagram.TRIPOD_ARMOR_CENTER_LEG_LAYOUT, tripodDiagram.TRIPOD_SHEET_ARMOR_CENTER_LEG, sheet.armorBoxLeft + sheet.armorBoxWidth / 2, sheet.armorBoxTop);
        check(tripodDiagram.TRIPOD_INTERNAL_CENTER_LEG_LAYOUT, tripodDiagram.TRIPOD_SHEET_INTERNAL_CENTER_LEG, sheet.isBoxLeft + sheet.isBoxWidth / 2, sheet.isBoxTop);
    });

    it("closes the Center Torso's bracket", () => {
        const markup = renderToStaticMarkup(<BattleMechSVG mechData={maxedMech("tripod")} />);
        expect(markup).not.toMatch(/\[\s*(<!-- -->)?\d+\s*(<!-- -->)?\)/);
    });
});
