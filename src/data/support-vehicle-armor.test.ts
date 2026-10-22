import { describe, expect, it } from "vitest";
import { getSupportVehicleArmorWeight, supportVehicleArmor } from "./support-vehicle-armor";

describe("Support Vehicle BAR armor catalog (TM pp.134, 206, 280)", () => {
    const bar = (rating: number) => supportVehicleArmor.find(armor => armor.bar === rating)!;

    it("lists BAR 2 through BAR 10", () => {
        expect(supportVehicleArmor.map(armor => armor.bar)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(supportVehicleArmor.map(armor => armor.tag)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => `sv-bar-${rating}`));
        for (const armor of supportVehicleArmor) {
            expect([armor.book, armor.page], armor.tag).toEqual(["TM", 206]);
        }
    });

    it("carries the weight per point by tech rating (TM p.134)", () => {
        expect(bar(2).kgPerPoint).toEqual({ a: 40, b: 25, c: 16, d: 13, e: 12, f: 11 });
        expect(bar(3).kgPerPoint).toEqual({ a: 60, b: 38, c: 24, d: 19, e: 17, f: 16 });
        expect(bar(4).kgPerPoint).toEqual({ a: null, b: 50, c: 32, d: 26, e: 23, f: 21 });
        expect(bar(5).kgPerPoint).toEqual({ a: null, b: 63, c: 40, d: 32, e: 28, f: 26 });
        expect(bar(6).kgPerPoint).toEqual({ a: null, b: null, c: 48, d: 38, e: 34, f: 32 });
        expect(bar(7).kgPerPoint).toEqual({ a: null, b: null, c: 56, d: 45, e: 40, f: 37 });
        expect(bar(8).kgPerPoint).toEqual({ a: null, b: null, c: null, d: 51, e: 45, f: 42 });
        expect(bar(9).kgPerPoint).toEqual({ a: null, b: null, c: null, d: 57, e: 51, f: 47 });
        expect(bar(10).kgPerPoint).toEqual({ a: null, b: null, c: null, d: 63, e: 56, f: 52 });
    });

    it("marks where the Armored chassis modification is needed and where BAR 10 takes ferro-fibrous slots", () => {
        expect(supportVehicleArmor.map(armor => armor.armoredChassisRatings)).toEqual([
            [], ["a"], [], ["b"], [], ["c"], ["d"], ["d", "e"], ["d", "e", "f"],
        ]);
        expect(bar(10).ferroFibrousSlotRatings).toEqual(["e", "f"]);
        expect(bar(9).ferroFibrousSlotRatings).toEqual([]);
    });

    it("carries cost per point, rating and dates (TM p.280, IO:AE p.29)", () => {
        expect(supportVehicleArmor.map(armor => armor.costPerPoint)).toEqual([50, 100, 150, 200, 250, 300, 400, 500, 625]);
        expect(supportVehicleArmor.map(armor => armor.techRating)).toEqual(["a", "a", "b", "b", "c", "c", "d", "d", "d"]);
        expect(supportVehicleArmor.map(armor => armor.availability)).toEqual([
            "A-A-A-A", "A-A-A-A", "B-B-A-A", "B-B-B-A", "C-B-B-A", "C-B-B-B", "C-C-B-B", "C-C-C-B", "D-D-D-C",
        ]);
        expect(supportVehicleArmor.map(armor => [armor.prototype, armor.introduced])).toEqual([
            [1950, 1950], [1950, 1950], [1950, 1950], [2100, 2100], [2100, 2100], [2250, 2300], [2425, 2435], [2440, 2450], [2460, 2470],
        ]);
    });

    it("weighs armor in kilograms, in tons rounded up to the half ton", () => {
        // TM p.134: 92 points of BAR 6 at Tech Rating D.
        expect(getSupportVehicleArmorWeight(6, "d", 92)).toEqual({ kg: 3496, tons: 3.5 });
        expect(getSupportVehicleArmorWeight(10, "d", 29)).toEqual({ kg: 1827, tons: 2 });
        expect(getSupportVehicleArmorWeight(8, "c", 10)).toBeNull();
        expect(getSupportVehicleArmorWeight(11, "d", 10)).toBeNull();
    });
});
