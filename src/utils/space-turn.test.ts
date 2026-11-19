import { describe, expect, it } from "vitest";
import {
    getCooldownGroundTurns, getEarlyFireResult, getGroundTurnsUntilNextSpaceTurn, getSpaceTurn, isSpaceTurnStart,
    HIT_REMINDER, MISFIRE_REMINDER, RESOLUTION_ROLLS,
} from "./space-turn";

// Space turn tracker (design 2026-10-22; rules in TRO.md, Long Tom Artillery: Anti-Orbital Ammo).
describe("space turn arithmetic", () => {
    it.each([[1, 1, 6], [6, 1, 1], [7, 2, 6], [12, 2, 1], [13, 3, 6]])("ground turn %i is space turn %i with %i to go", (turn, space, left) => {
        expect(getSpaceTurn(turn)).toBe(space);
        expect(getGroundTurnsUntilNextSpaceTurn(turn)).toBe(left);
    });

    it("treats turn 0 as turn 1", () => expect(getSpaceTurn(0)).toBe(1));
});

describe("cooldown", () => {
    it("counts down while the gun fired this space turn", () => {
        expect(getCooldownGroundTurns(8, 2)).toBe(5);
        expect(getCooldownGroundTurns(12, 2)).toBe(1);
    });

    it("is clear from the next space turn", () => expect(getCooldownGroundTurns(13, 2)).toBe(0));

    it("is clear for a gun that never fired", () => expect(getCooldownGroundTurns(3, null)).toBe(0));

    it("is clear when the turn was moved back past the shot", () => expect(getCooldownGroundTurns(5, 3)).toBe(0));
});

describe("early fire", () => {
    it.each([[2, "destroyed"], [4, "destroyed"], [5, "misfire"], [8, "misfire"], [9, "normal"], [12, "normal"]])("%i is %s", (roll, result) =>
        expect(getEarlyFireResult(roll)).toBe(result));

    it.each([1, 13, 0, 7.5, NaN])("refuses %s", (roll) => expect(getEarlyFireResult(roll)).toBeNull());
});

describe("resolution table", () => {
    it("gives the roll for each outcome", () => {
        expect(RESOLUTION_ROLLS["in-hex"].roll).toMatch(/normal attack roll/i);
        expect(RESOLUTION_ROLLS["one-hex"].roll).toMatch(/\+4/);
        expect(RESOLUTION_ROLLS["two-plus"].roll).toMatch(/miss/i);
        expect(RESOLUTION_ROLLS.bystander.roll).toMatch(/normal attack roll/i);
        expect(RESOLUTION_ROLLS.defense.roll).toMatch(/natural 12/);
        expect(HIT_REMINDER).toContain("5 standard");
        expect(HIT_REMINDER).toContain("rounded normally");
        expect(MISFIRE_REMINDER).toContain("TacOps p.182");
        expect(MISFIRE_REMINDER).toContain("3D6");
    });
});

describe("space turn start (minors, 2026-10-22)", () => {
    it("is the first ground turn of each space turn", () => {
        expect([1, 7, 13].map(isSpaceTurnStart)).toEqual([true, true, true]);
        expect([2, 6, 8, 12].map(isSpaceTurnStart)).toEqual([false, false, false, false]);
    });
});
