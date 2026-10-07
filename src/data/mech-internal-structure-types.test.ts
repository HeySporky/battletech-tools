import { describe, expect, it } from "vitest";
import { mechInternalStructureTypes } from "./mech-internal-structure-types";

// BattleMech Internal Structure Table, TM p.47: [tons, head, center torso, side torso, arm, leg].
const table: [number, number, number, number, number, number][] = [
    [20, 3, 6, 5, 3, 4], [25, 3, 8, 6, 4, 6], [30, 3, 10, 7, 5, 7], [35, 3, 11, 8, 6, 8],
    [40, 3, 12, 10, 6, 10], [45, 3, 14, 11, 7, 11], [50, 3, 16, 12, 8, 12], [55, 3, 18, 13, 9, 13],
    [60, 3, 20, 14, 10, 14], [65, 3, 21, 15, 10, 15], [70, 3, 22, 15, 11, 15], [75, 3, 23, 16, 12, 16],
    [80, 3, 25, 17, 13, 17], [85, 3, 27, 18, 14, 18], [90, 3, 29, 19, 15, 19], [95, 3, 30, 20, 16, 20],
    [100, 3, 31, 21, 17, 21],
];

describe("BattleMech internal structure (TM p.47)", () => {
    const biped = mechInternalStructureTypes.find(structure => structure.tag === "standard")!.perMechType.biped;

    it.each(table)("a %i-ton biped has the table's structure points", (tons, head, centerTorso, torso, arm, leg) => {
        const row = biped[tons];
        expect([row.head, row.centerTorso, row.leftTorso, row.rightTorso, row.leftArm, row.rightArm, row.leftLeg, row.rightLeg])
            .toEqual([head, centerTorso, torso, torso, arm, arm, leg, leg]);
    });
});
