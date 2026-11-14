import { describe, expect, it } from "vitest";
import { getCriticalTables, rollCriticalLine } from "./critical-tables";

/**
 * A location's critical slots in tables of six (Compact 'Mechs plan, Chunk D, #172). Canon: one table for a 6-slot
 * location, two picked by 1-3 / 4-6 for a 12-slot one (TW p.124). Ours, for Flint's other lengths: tables of six,
 * the last one short; 6 / tables numbers each when that divides evenly, else one number each and re-roll the rest.
 */
describe("getCriticalTables", () => {
    const shape = (slots: number) => getCriticalTables(slots).map(t => [t.start, t.length, t.label]);

    it("a 6-slot location is one table with no table roll", () => {
        expect(shape(6)).toEqual([[0, 6, ""]]);
    });
    it("a 12-slot location is two tables, 1-3 and 4-6 (TW p.124)", () => {
        expect(shape(12)).toEqual([[0, 6, "1-3"], [6, 6, "4-6"]]);
    });
    it("a 5-slot location is one short table; a 2-slot one too", () => {
        expect(shape(5)).toEqual([[0, 5, ""]]);
        expect(shape(2)).toEqual([[0, 2, ""]]);
    });
    it("7, 8, 10 and 11 slots are two tables, the second short", () => {
        expect(shape(7)).toEqual([[0, 6, "1-3"], [6, 1, "4-6"]]);
        expect(shape(11)).toEqual([[0, 6, "1-3"], [6, 5, "4-6"]]);
    });
    it("14, 16 and 18 slots are three tables, 1-2, 3-4 and 5-6", () => {
        expect(shape(16)).toEqual([[0, 6, "1-2"], [6, 6, "3-4"], [12, 4, "5-6"]]);
        expect(shape(18).map(t => t[2])).toEqual(["1-2", "3-4", "5-6"]);
    });
    it("20 slots are four tables, 1, 2, 3 and 4 (5 and 6 are rolled again)", () => {
        expect(shape(20)).toEqual([[0, 6, "1"], [6, 6, "2"], [12, 6, "3"], [18, 2, "4"]]);
    });
    it("no slots, no tables", () => {
        expect(getCriticalTables(0)).toEqual([]);
    });
});

describe("rollCriticalLine", () => {
    const roll = (slots: number, dice: number[]) => {
        const queue = [...dice];
        return rollCriticalLine(slots, () => queue.shift()!);
    };

    it("one die picks the line of a one-table location", () => {
        expect(roll(6, [4])).toMatchObject({ index: 3, table: null, line: 4 });
    });
    it("a line past the end of a short table is rolled again", () => {
        expect(roll(5, [6])).toMatchObject({ index: null, line: 6 });
        expect(roll(20, [4, 3])).toMatchObject({ index: null, tableNumber: 4, line: 3 });
    });
    it("two dice, table then line, in a 12-slot location", () => {
        expect(roll(12, [2, 5])).toMatchObject({ index: 4, tableNumber: 1, line: 5 });
        expect(roll(12, [4, 1])).toMatchObject({ index: 6, tableNumber: 2, line: 1 });
    });
    it("a table roll with no table is rolled again, using one die", () => {
        const queue = [5, 1];
        expect(rollCriticalLine(20, () => queue.shift()!)).toMatchObject({ index: null, table: null, tableRoll: 5 });
        expect(queue).toEqual([1]);
    });
    it("16 slots: 5 picks the third table", () => {
        expect(roll(16, [5, 4])).toMatchObject({ index: 15, tableNumber: 3, line: 4 });
    });
});
