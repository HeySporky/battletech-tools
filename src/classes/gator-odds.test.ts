import { describe, expect, it } from "vitest";
import { getTargetToHitFromWeapon } from "../utils";
import { BattleMech } from "./battlemech";

// The GATOR's odds are the chance of rolling the to-hit number or more on 2d6, cut to two decimals.
const chanceOnTwoDice = (target: number): number => {
    let ways = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b >= target) ways++;
    return Math.floor((ways / 36) * 10000) / 100;
};

describe("the GATOR's chance of success", () => {
    it("is right for every to-hit number from 2 to 12", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.addEquipmentFromTag("medium-laser", "is", "rt", false, undefined, "a", false, [], undefined, undefined);
        const seen = new Set<number>();
        for (let otherMods = -6; otherMods <= 10; otherMods++) {
            const target = { name: "Target", active: true, range: 1, movement: 0, otherMods, jumped: false, primary: true, inRearArc: false };
            const gator = getTargetToHitFromWeapon(mech, 0, target);
            if (gator.finalToHit < 2 || gator.finalToHit > 12) continue;
            seen.add(gator.finalToHit);
            expect(gator.explanation, `to-hit ${gator.finalToHit}`).toBe(`This roll has a ${chanceOnTwoDice(gator.finalToHit)}% chance of success`);
        }
        expect(seen.size).toBe(11);
    });
});
