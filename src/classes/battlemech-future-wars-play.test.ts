import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { buildMech } from "../test-support/builders";

/** Compact 'Mechs plan, Chunk D (#172): critical hits in Flint's longer locations, rolled in tables of six. */
const BEST_OF = "best-of-future-wars-construction";

const build = (tonnage: number): BattleMech => buildMech({ tonnage, homebrew: [BEST_OF] });

describe("critical hits under Future Wars construction (#172)", () => {
    it("rolls the table, then the line, in a 20-slot center torso; an empty line and a number with no table are rolled again", () => {
        const mech = build(100);
        expect(mech.getCriticals().centerTorso).toHaveLength(20);
        // Table 4, line 1 is empty (slot 19); 5 picks no table; table 3, line 1 is slot 13 (the engine's second half).
        const log = mech.rollCriticalHit("ct", { chance: 8, lines: [4, 1, 5, 3, 1] });
        expect(log.at(-1)).toBe("Line 3, 1: Standard Fusion is hit.");
        expect(mech.isCriticalDamaged("ct", 12)).toBe(true);
        expect(mech.isCriticalDamaged("ct", 18)).toBe(false);
    });

    it("reaches the third table of a 16-slot leg", () => {
        const mech = build(100);
        const legs = mech.getCriticals().leftLeg;
        expect(legs).toHaveLength(16);
        // Nothing is in a leg past its four actuators, so line 5-6, 1 is empty; aim for an actuator after it.
        const log = mech.rollCriticalHit("ll", { chance: 8, lines: [5, 1, 1, 1] });
        expect(log).toContain("Line 1-2, 1: Hip is hit.");
        expect(mech.isCriticalDamaged("ll", 12)).toBe(false);
    });

    it("rolls one die for a 5-slot head and rolls a 6 again", () => {
        const mech = build(35);
        expect(mech.getCriticals().head).toHaveLength(5);
        // Life support, two sensors, cockpit; line 5 is empty and 6 is past the end: both rolled again.
        const log = mech.rollCriticalHit("hd", { chance: 8, lines: [6, 5, 4] });
        expect(log.at(-1)).toBe("Line 4: Cockpit is hit.");
        expect(mech.isCriticalDamaged("hd", 3)).toBe(true);
    });

    it("an edition's own roll (Battledroids) uses the same tables and rolls a number with no table again", () => {
        const mech = build(100);
        mech.setRulesEdition("battledroids");
        expect(mech.getEditionPlayRules()).toBeTruthy();
        expect(mech.usesFutureWarsConstruction()).toBe(true);
        expect(mech.rollCriticalHit("ct", { chance: 7, lines: [6, 3, 1] })).toEqual([
            "Critical hit roll 7: a critical hit.",
            "Table roll 6: no table, rolled again.",
            "Line 31: Standard Fusion is hit.",
        ]);
    });
});
