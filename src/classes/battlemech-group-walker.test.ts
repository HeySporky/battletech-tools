import { describe, expect, it } from "vitest";
import { BattleMechGroup } from "./battlemech-group";
import Walker from "./walker";
import { WALKER_LOCATIONS } from "../data/walker-construction";

// Walkers in a Classic BattleTech roster group (#172, Chunk E), after the Micro-Mechs' tests.

const mule = (): Walker => {
    const walker = new Walker();
    walker.setName("Mule MUL-4W");
    walker.setTons(50);
    walker.setWalkMP(4);
    for (const location of WALKER_LOCATIONS) walker.setArmor(location, 6);
    return walker;
};

describe("Walkers in a roster group", () => {
    it("counts a Walker's Battle Value, tonnage and unit", () => {
        const group = new BattleMechGroup();
        const walker = mule();
        group.walkers.push(walker);
        expect(group.getTotalBattleValue()).toBe(walker.getBattleValue());
        expect(group.getTotalBattleValue()).toBeGreaterThan(0);
        expect(group.getTotalTons()).toBe(50);
        expect(group.getTotalUnits()).toBe(1);
        expect(group.getTech()).toBe("Inner Sphere");
        expect(group.getBattleValueUnitTypes()).toEqual(["walker"]);
    });

    it("saves and reloads a Walker with its group, keeping its design", () => {
        const group = new BattleMechGroup();
        group.walkers.push(mule());
        const reloaded = new BattleMechGroup(JSON.parse(JSON.stringify(group.export())));
        expect(reloaded.walkers).toHaveLength(1);
        expect(reloaded.walkers[0].getName()).toBe("Mule MUL-4W");
        expect(reloaded.walkers[0].getCBillCost()).toBe(group.walkers[0].getCBillCost());
        expect(reloaded.walkers[0].getBattleValue()).toBe(group.walkers[0].getBattleValue());
    });

    it("gives a copied group its own Walker ids", () => {
        const group = new BattleMechGroup();
        const walker = mule();
        group.walkers.push(walker);
        const before = walker.getUUID();
        group.setNew();
        expect(walker.getUUID()).not.toBe(before);
    });

    it("loads an older group with no walkers, and leaves the key out when there are none", () => {
        const older = new BattleMechGroup().export();
        expect("walkers" in older).toBe(false);
        const reloaded = new BattleMechGroup(JSON.parse(JSON.stringify(older)));
        expect(reloaded.walkers).toEqual([]);
    });

    it("skips a saved entry that is not a Walker", () => {
        const group = new BattleMechGroup();
        group.walkers.push(mule());
        const saved = JSON.parse(JSON.stringify(group.export()));
        saved.walkers.push(null, "x", 5, { tons: "heavy" });
        expect(new BattleMechGroup(saved).walkers).toHaveLength(1);
    });
});
