import { describe, expect, it } from "vitest";
import { IEquipmentItem } from "./data-interfaces";
import { AEROSPACE_HEAT_SCALE, FIGHTER_RETURN_TABLE, GROUND_MAP_STRAIGHT_MOVEMENT, getAerospaceDamageByBracket, toCapitalScale } from "./aerospace-record-sheet";

const weapon = (fields: Partial<IEquipmentItem>): IEquipmentItem => ({ name: "Test", tag: "test", ...fields } as IEquipmentItem);

describe("aerospace record sheet values", () => {
    it("a weapon's aerospace damage counts out to its aerospace range and is 0 beyond (TW p.30)", () => {
        expect(getAerospaceDamageByBracket(weapon({ damageAero: 8, rangeAero: "m" }))).toEqual([8, 8, 0, 0]);
        expect(getAerospaceDamageByBracket(weapon({ damageAero: 10, rangeAero: "e" }))).toEqual([10, 10, 10, 10]);
    });

    it("per-bracket aerospace values are used as listed", () => {
        expect(getAerospaceDamageByBracket(weapon({ damage: { short: 15, medium: 10, long: 5, aeroShort: 25, aeroMedium: 20, aeroLong: 10 } }))).toEqual([25, 20, 10, 0]);
    });

    it("damage with no aerospace range is unknown, not guessed", () => {
        expect(getAerospaceDamageByBracket(weapon({ damageAero: 3, rangeAero: "" }))).toBeNull();
        expect(getAerospaceDamageByBracket(weapon({ damageAero: 0 }))).toEqual([0, 0, 0, 0]);
    });

    it("capital scale is a tenth of standard, rounded normally (SO:AA p.9)", () => {
        expect(toCapitalScale(16)).toBe(2);
        expect(toCapitalScale(14)).toBe(1);
        expect(toCapitalScale(15)).toBe(2);
    });

    it("the Heat Scale's triggers match TW p.161", () => {
        const at = (text: string) => AEROSPACE_HEAT_SCALE.filter((row) => row.effect.startsWith(text)).map((row) => row.heat).sort((a, b) => a - b);
        expect(at("Random Movement")).toEqual([5, 10, 15, 20, 25]);
        expect(at("Ammo Exp.")).toEqual([19, 23, 28]);
        expect(at("Pilot Damage")).toEqual([21, 27]);
    });
});

describe("conventional fighter sheet tables", () => {
    it("ground map straight movement: velocity 1-12 for fighters, Small Craft and DropShips (TW p. 92)", () => {
        expect(GROUND_MAP_STRAIGHT_MOVEMENT.map((row) => row.velocity)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(GROUND_MAP_STRAIGHT_MOVEMENT[0]).toEqual({ velocity: 1, fighter: 8, smallCraft: 8, dropShip: 8 });
        expect(GROUND_MAP_STRAIGHT_MOVEMENT[1]).toEqual({ velocity: 2, fighter: 12, smallCraft: 14, dropShip: 16 });
        expect(GROUND_MAP_STRAIGHT_MOVEMENT[11]).toEqual({ velocity: 12, fighter: 52, smallCraft: 74, dropShip: 96 });
    });

    it("fighter return table: safe thrust to turns before the fighter returns", () => {
        expect(FIGHTER_RETURN_TABLE).toEqual([
            { safeThrust: "1-4", turns: 3 },
            { safeThrust: "5-8", turns: 2 },
            { safeThrust: "9-12", turns: 1 },
            { safeThrust: "13+", turns: 0 },
        ]);
    });
});
