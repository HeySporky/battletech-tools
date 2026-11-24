import { describe, expect, it } from "vitest";
import { advanceAutocannonTurn, canFireRate, declareClear, isPermanentJam, resolveClear, getJamThreshold, getSelectedShots, recordToHitRoll } from "./autocannon-play";

describe("autocannon jam thresholds (TW p.140)", () => {
    it.each([[1, 0], [2, 2], [3, 2], [4, 3], [5, 3], [6, 4]])("RAC at %i shots jams on %i or less", (s, t) => expect(getJamThreshold("rac", s)).toBe(t));
    it("an Ultra at double rate jams on a 2", () => {
        expect(getJamThreshold("ultra", 2)).toBe(2);
        expect(getJamThreshold("ultra", 1)).toBe(0);
    });
});

describe("autocannon play state", () => {
    it("a jam on the to-hit roll still fires the shots and jams the weapon", () => {
        const state = { shots: 6 };
        expect(recordToHitRoll("rac", state, 4)).toEqual({ jammed: true });
        expect(state).toMatchObject({ jammed: true, fired: true });
    });
    it("a roll above the threshold does not jam", () => {
        expect(recordToHitRoll("rac", { shots: 6 }, 5).jammed).toBe(false);
    });
    it("a rotary jam is cleared by declaring in the End Phase, then a Gunnery +3 roll on the next turn (TW p.140)", () => {
        const play = { a: { shots: 2, jammed: true } as { shots: number; jammed?: boolean; clearing?: "declared" | "attempt" } };
        expect(declareClear("rac", play.a)).toBe(true);
        expect(play.a.clearing).toBe("declared");
        expect(resolveClear(play.a, true)).toBe(false);
        advanceAutocannonTurn(play);
        expect(play.a.clearing).toBe("attempt");
        expect(canFireRate(play.a)).toBe(false);
        expect(resolveClear(play.a, false)).toBe(false);
        expect(play.a.jammed).toBe(true);
        expect(play.a.clearing).toBeUndefined();
        expect(declareClear("rac", play.a)).toBe(true);
        advanceAutocannonTurn(play);
        expect(resolveClear(play.a, true)).toBe(true);
        expect(play.a.jammed).toBeUndefined();
        expect(canFireRate(play.a)).toBe(true);
    });
    it("a jammed Ultra stays jammed for the rest of the game (TW p.114)", () => {
        expect(isPermanentJam("ultra")).toBe(true);
        expect(declareClear("ultra", { jammed: true })).toBe(false);
    });
    it("an old save has 1 shot, not jammed", () => {
        expect(getSelectedShots("rac", undefined)).toBe(1);
        expect(canFireRate(undefined)).toBe(true);
    });
});
