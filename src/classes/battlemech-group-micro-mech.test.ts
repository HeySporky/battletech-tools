import { describe, expect, it } from "vitest";
import { BattleMechGroup } from "./battlemech-group";
import MicroMech from "./micro-mech";

const storm = (): MicroMech => {
    const micro = new MicroMech();
    micro.setTons(11);
    micro.setWalkMP(6);
    micro.setJumpJets(6);
    micro.setName("Storm STM-3X");
    micro.setArmor("head", 4);
    micro.setArmor("torso", 16);
    micro.setArmor("torsoRear", 6);
    micro.setArmor("la", 4);
    micro.setArmor("ra", 4);
    micro.setArmor("ll", 6);
    micro.setArmor("rl", 6);
    micro.addMount("micro-er-laser-small", "ra");
    return micro;
};

describe("Micro-Mechs in a roster group (#173, Chunk E)", () => {
    it("counts a Micro-Mech's Battle Value, tonnage and unit", () => {
        const group = new BattleMechGroup();
        const micro = storm();
        group.microMechs.push(micro);
        expect(group.getTotalBattleValue()).toBe(micro.getBattleValue());
        expect(group.getTotalBattleValue()).toBeGreaterThan(0);
        expect(group.getTotalTons()).toBe(11);
        expect(group.getTotalUnits()).toBe(1);
        expect(group.getTech()).toBe("Inner Sphere");
    });

    it("saves and reloads a Micro-Mech with its group, keeping its design", () => {
        const group = new BattleMechGroup();
        group.microMechs.push(storm());
        const reloaded = new BattleMechGroup(JSON.parse(JSON.stringify(group.export())));
        expect(reloaded.microMechs).toHaveLength(1);
        expect(reloaded.microMechs[0].getName()).toBe("Storm STM-3X");
        expect(reloaded.microMechs[0].getCBillCost()).toBe(group.microMechs[0].getCBillCost());
    });

    it("gives a copied group its own Micro-Mech ids", () => {
        const group = new BattleMechGroup();
        const micro = storm();
        group.microMechs.push(micro);
        const before = micro.getUUID();
        group.setNew();
        expect(micro.getUUID()).not.toBe(before);
    });

    it("loads an older group with no microMechs, and leaves the key out when there are none", () => {
        const older = new BattleMechGroup().export();
        expect("microMechs" in older).toBe(false);
        const reloaded = new BattleMechGroup(JSON.parse(JSON.stringify(older)));
        expect(reloaded.microMechs).toEqual([]);
    });

    it("skips a saved entry that is not an object, and caps the list", () => {
        const group = new BattleMechGroup();
        group.microMechs.push(storm());
        const saved = JSON.parse(JSON.stringify(group.export()));
        saved.microMechs.push(null, "x", 5);
        expect(new BattleMechGroup(saved).microMechs).toHaveLength(1);
    });
});
