import { describe, expect, it } from "vitest";
import { SPACE_MINEFIELD_CAPACITY, getSpaceMineControlModifier, resolveSpaceMineAttack } from "./space-mines";

// TO:AUE p.178 (Space Mines) and p.138 (Space Dispensers): attack capacity 6 a cluster, the Space Mines Table.
describe("space minefields", () => {
    it("rolls a Control Roll at +3 on entering, less 2 with an Active Probe", () => {
        expect(getSpaceMineControlModifier(false)).toBe(3);
        expect(getSpaceMineControlModifier(true)).toBe(1);
    });

    it("starts a laid cluster at attack capacity 6", () => {
        expect(SPACE_MINEFIELD_CAPACITY).toBe(6);
    });

    it("reproduces the Sholagar and WarShip example: 15 damage, then 100, and the field is spent", () => {
        const first = resolveSpaceMineAttack(3, "fighter", 3);
        expect(first).toEqual({ damage: 15, capacity: 2, destroyed: false });
        const second = resolveSpaceMineAttack(first.capacity, "large", 6);
        expect(second).toEqual({ damage: 100, capacity: -1, destroyed: true });
    });

    it("applies each craft size from the table, with its maximum damage and capacity loss", () => {
        expect(resolveSpaceMineAttack(6, "fighter", 9)).toMatchObject({ damage: 20, capacity: 5 });
        expect(resolveSpaceMineAttack(6, "dropship", 2)).toMatchObject({ damage: 20, capacity: 4 });
        expect(resolveSpaceMineAttack(6, "dropship", 9)).toMatchObject({ damage: 50, capacity: 4 });
        expect(resolveSpaceMineAttack(6, "large", 1)).toMatchObject({ damage: 20, capacity: 3 });
        // A craft that passed the Control Roll takes nothing and costs the field nothing.
        expect(resolveSpaceMineAttack(6, "large", 0)).toEqual({ damage: 0, capacity: 6, destroyed: false });
        // A destroyed field attacks no more.
        expect(resolveSpaceMineAttack(0, "fighter", 4)).toEqual({ damage: 0, capacity: 0, destroyed: true });
    });
});
