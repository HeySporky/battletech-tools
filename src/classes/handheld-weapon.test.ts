import { describe, expect, it } from "vitest";
import { analyseHandheld, getHandheldIssue, findHandheldItem } from "./handheld-weapon";

// 'Mech handheld weapons (#611): Maximum Tech p.79 construction and p.92 BV for the Master Rules editions, Tactical Operations:
// Advanced Units & Equipment pp.126-128 construction and p.193 BV from Total Warfare on.
describe("handheld weapon construction (Maximum Tech p.79 examples)", () => {
    it("builds Bob's handheld medium laser: 1 ton, 3 heat sinks of 1 ton each, 4 tons unarmored", () => {
        const result = analyseHandheld({ entries: [{ tag: "medium-laser" }], armor: 0 }, "master-rules-revised", "is");
        expect(result.issues).toEqual([]);
        expect(result.heatSinks).toBe(3);
        expect(result.weight).toBe(4);
    });

    it("builds the handheld SRM-6: 3 tons, 1 ton of ammunition, 4 heat sinks, 8 tons", () => {
        const result = analyseHandheld({ entries: [{ tag: "srm-6", shots: 15 }], armor: 0 }, "master-rules-revised", "is");
        expect(result.issues).toEqual([]);
        expect(result.heatSinks).toBe(4);
        expect(result.ammoTons).toBe(1);
        expect(result.weight).toBe(8);
    });

    it("builds the twin small laser handheld: 3 tons unarmored", () => {
        const result = analyseHandheld({ entries: [{ tag: "small-laser", count: 2 }], armor: 0 }, "master-rules-revised", "is");
        expect(result.heatSinks).toBe(2);
        expect(result.weight).toBe(3);
    });

    it("lets one handheld hold ten medium lasers, as the book does", () => {
        const result = analyseHandheld({ entries: [{ tag: "medium-laser", count: 10 }], armor: 0 }, "master-rules", "is");
        expect(result.issues).toEqual([]);
        expect(result.weight).toBe(40);
    });

    it("asks for ammunition on an ammunition weapon", () => {
        const result = analyseHandheld({ entries: [{ tag: "srm-6" }], armor: 0 }, "master-rules-revised", "is");
        expect(result.issues.join(" ")).toMatch(/ammunition/i);
    });

    it("keeps the equipment tables' other equipment out, but takes TAG", () => {
        expect(getHandheldIssue(findHandheldItem("is-ams")!, "master-rules-revised")).toMatch(/Other Equipment/);
        expect(getHandheldIssue(findHandheldItem("is-tag")!, "master-rules-revised")).toBeNull();
    });
});

describe("handheld weapon construction (TO:AUE pp.126-128)", () => {
    it("gives heat sinks to energy weapons only: the SRM-6 needs none, and carries its ammunition by the shot", () => {
        const result = analyseHandheld({ entries: [{ tag: "srm-6", shots: 15 }], armor: 0 }, "total-warfare", "is");
        expect(result.issues).toEqual([]);
        expect(result.heatSinks).toBe(0);
        expect(result.weight).toBe(4);
        // 7 shots: 7/15 of a ton, the final weight rounded up to the half ton.
        const seven = analyseHandheld({ entries: [{ tag: "srm-6", shots: 7 }], armor: 0 }, "total-warfare", "is");
        expect(seven.ammoTons).toBeCloseTo(7 / 15, 5);
        expect(seven.weight).toBe(3.5);
    });

    it("limits a handheld to six items, ammunition and heat sinks not counted", () => {
        expect(analyseHandheld({ entries: [{ tag: "medium-laser", count: 6 }], armor: 0 }, "total-warfare", "is").issues).toEqual([]);
        expect(analyseHandheld({ entries: [{ tag: "medium-laser", count: 7 }], armor: 0 }, "total-warfare", "is").issues.join(" ")).toMatch(/six items/);
    });

    it("weighs armor at 1 ton per 16 points, 8 points a half ton, standard armor only", () => {
        const armored = analyseHandheld({ entries: [{ tag: "medium-laser" }], armor: 9 }, "total-warfare", "is");
        expect(armored.armorTons).toBe(1);
        expect(armored.weight).toBe(5);
    });

    it("refuses an item with an exceptional location restriction: the Heavy Gauss Rifle", () => {
        expect(getHandheldIssue(findHandheldItem("gauss-rifle-heavy")!, "total-warfare")).toMatch(/location/i);
    });

    it("takes one physical weapon alone, not one that weighs by the carrier, and no shields or spikes", () => {
        expect(getHandheldIssue(findHandheldItem("melee-hatchet")!, "total-warfare")).toMatch(/weight/i);
        expect(getHandheldIssue(findHandheldItem("shield-small")!, "total-warfare")).toMatch(/Shields|Spikes/);
        const both = analyseHandheld({ entries: [{ tag: "melee-vibroblade-small" }, { tag: "medium-laser" }], armor: 0 }, "total-warfare", "is");
        expect(both.issues.join(" ")).toMatch(/physical weapon/i);
    });

    it("offers no handheld before the Master Rules", () => {
        expect(analyseHandheld({ entries: [{ tag: "medium-laser" }], armor: 0 }, "battletech-compendium", "is").issues.join(" ")).toMatch(/no handheld/i);
    });
});

describe("handheld weapon Battle Value (Maximum Tech p.92; TO:AUE p.193)", () => {
    it("is the weapons' BV plus the ammunition's plus the armor factor x 2 under BV2 editions", () => {
        const laser = analyseHandheld({ entries: [{ tag: "medium-laser" }], armor: 16 }, "total-warfare", "is");
        expect(laser.battleValue).toBe(46 + 32);
        const srm = analyseHandheld({ entries: [{ tag: "srm-6", shots: 15 }], armor: 0 }, "total-warfare", "is");
        // SRM-6: BV 59, one ton of ammunition 7.
        expect(srm.battleValue).toBe(59 + 7);
    });

    it("prorates ammunition by the shot", () => {
        const half = analyseHandheld({ entries: [{ tag: "srm-6", shots: 5 }], armor: 0 }, "total-warfare", "is");
        expect(half.battleValue).toBe(Math.round(59 + 7 * 5 / 15));
    });

    it("rates the parts with the edition's own tables under BV1", () => {
        const laser = analyseHandheld({ entries: [{ tag: "medium-laser" }], armor: 16 }, "master-rules-revised", "is");
        expect(laser.battleValue).toBe(laser.partsBattleValue + 32);
        expect(laser.partsBattleValue).toBeGreaterThan(0);
    });

    it("costs twice what its parts cost", () => {
        const laser = analyseHandheld({ entries: [{ tag: "medium-laser" }], armor: 0 }, "total-warfare", "is");
        // Medium laser 40,000 and 3 heat sinks at 2,000, doubled.
        expect(laser.cost).toBe(2 * (40000 + 3 * 2000));
    });
});
