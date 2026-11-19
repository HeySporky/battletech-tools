import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

describe("Alpha Strike heat-modified damage", () => {
    it("two LRM 5s on a cool 'Mech do not gain short-range damage (issue 62)", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.addEquipmentFromTag("lrm-5", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("lrm-5", "is", "lt", false, undefined, "", false, [], undefined, undefined);
        expect(mech.getAlphaStrikeForceStats().damage.short).toBeLessThanOrEqual(1);
    });
});
