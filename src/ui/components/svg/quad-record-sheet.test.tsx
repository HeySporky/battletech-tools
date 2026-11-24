import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import BattleMechSVG from "./battlemech-svg";

// A four-legged 'Mech keeps its front legs in their own locations (frontLeftLeg/frontRightLeg), not the arms'; the
// sheet once read the empty arm records, so the front legs showed [0] armor and blank critical tables.
describe("Quad record sheet front legs", () => {
    for (const type of ["quad", "quadvee"]) {
        it(`${type}: labels the front legs' armor and lists their critical slots`, () => {
            const mech = new BattleMech();
            mech.setType(type);
            mech.setTonnage(100);
            mech.allocateArmorMax();
            mech.setFrontLeftLegArmor(17);
            const markup = renderToStaticMarkup(<BattleMechSVG mechData={mech} />);
            // Both front legs: the allocation mirrors left to right.
            expect((markup.match(/LEG \[17\]/g) ?? []).length).toBe(2);
            const legSlots = type === "quad" ? "Hip" : "QuadVee Conversion";
            expect((markup.match(new RegExp(legSlots, "g")) ?? []).length).toBeGreaterThanOrEqual(4);
        // A full sheet render passes 5 s when the whole suite runs at once.
        }, 20_000);
    }
});
