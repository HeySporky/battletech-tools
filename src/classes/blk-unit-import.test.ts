import { describe, expect, it } from "vitest";
import { getBlkUnitKind, importBlkUnit } from "./blk-unit-import";
import Vehicle from "./vehicle";

const block = (tag: string, ...lines: string[]): string[] => [`<${tag}>`, ...lines, `</${tag}>`];
const tank = [
    ...block("UnitType", "Tank"), ...block("Name", "Test Tank"), ...block("Model", "TT-1"), ...block("year", "3025"), ...block("type", "IS Level 1"),
    ...block("motion_type", "Tracked"), ...block("cruiseMP", "4"), ...block("engine_type", "0"), ...block("armor_type", "0"),
    ...block("armor", "10", "8", "8", "6"), ...block("Front Equipment", "Medium Laser"), ...block("tonnage", "30.0"),
].join("\n");

describe("the one MegaMek unit file reader", () => {
    it("picks the reader by the file's UnitType", () => {
        expect(getBlkUnitKind(tank)).toBe("vehicles");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nSupportTank\n<"))).toBe("support-vehicles");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nBattleArmor\n<"))).toBe("battle-armor");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nDropship\n<"))).toBe("small-craft");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nProtoMek\n<"))).toBe("protomechs");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nFixedWingSupport\n<"))).toBe("fixed-wing-support");
        expect(getBlkUnitKind("hello")).toBeNull();
    });

    it("reads a file of a kind the page builds", () => {
        const result = importBlkUnit(tank, ["vehicles", "support-vehicles"]);
        expect(result.kind).toBe("vehicles");
        expect(result.unit).toBeInstanceOf(Vehicle);
        expect(result.issues).toEqual([]);
    });

    it("refuses a file of another kind, naming what it holds, and a type this app does not read", () => {
        expect(importBlkUnit(tank, ["battle-armor"])).toEqual({ kind: "vehicles", unit: null, notes: [],
            issues: ["This file holds a Combat Vehicle, not battle armor: load it in that unit's creator."] });
        expect(importBlkUnit(tank.replace(">\nTank\n<", ">\nWarship\n<")).issues).toEqual(["This file holds a Warship, which this app does not read yet."]);
        expect(importBlkUnit("hello").issues).toEqual(["This is not a MegaMek unit file."]);
    });
});
