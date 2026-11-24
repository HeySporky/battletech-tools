import { describe, expect, it } from "vitest";
import BattleArmor from "./battle-armor";
import { getBattleArmorCarrierLoad } from "./battle-armor-transport";
import Vehicle from "./vehicle";

describe("OmniVehicles (TM pp.95-97, 285)", () => {
    it("is a standard vehicle until it is built as an Omni, which costs a quarter more", () => {
        const tank = new Vehicle();
        tank.addEquipmentFromTag("medium-laser");
        expect(tank.isOmni()).toBe(false);
        const cost = tank.getCBillCost();
        expect(tank.setOmni(true)).toBe(true);
        expect(tank.getCBillCost()).toBe(Math.round(cost * 1.25));
        expect(tank.getCostBreakdown().steps.find((step) => step.id === "cv.cost.omni")?.value).toBe(1.25);
        tank.setOmni(false);
        expect(tank.getCBillCost()).toBe(cost);
    });

    it("marks equipment as pod-mounted or fixed to the base chassis", () => {
        const tank = new Vehicle();
        const laser = tank.addEquipmentFromTag("medium-laser")[0];
        // Only an OmniVehicle has pods.
        expect(tank.setPodMounted(laser.uuid, true)).toBe(false);
        tank.setOmni(true);
        expect(tank.getPodTonnage()).toBe(0);
        expect(tank.setPodMounted(laser.uuid, true)).toBe(true);
        expect(tank.getPodTonnage()).toBe(laser.weight);
        expect(tank.getPodSpace()).toBeGreaterThanOrEqual(laser.weight);
        tank.removeEquipment(laser.uuid ?? "");
        expect(tank.getPodTonnage()).toBe(0);
    });

    it("offers Clan CASE on an Inner Sphere-chassis Mixed Tech vehicle only, weightless, protecting the ammunition (TM p.210)", () => {
        const tank = new Vehicle();
        expect(tank.canChooseClanCASE()).toBe(false);
        expect(tank.setClanCASE(true)).toBe(false);
        tank.setTech("mis");
        expect(tank.canChooseClanCASE()).toBe(true);
        expect(tank.hasCASE()).toBe(false);
        const before = tank.getCurrentTonnage();
        expect(tank.setClanCASE(true)).toBe(true);
        expect(tank.hasCASE()).toBe(true);
        expect(tank.getCurrentTonnage()).toBe(before);
        tank.setTech("is");
        expect(tank.hasClanCASE()).toBe(false);
    });

    it("is saved with the vehicle, and a vehicle saved before Omnis were recorded loads as standard", () => {
        const tank = new Vehicle();
        const laser = tank.addEquipmentFromTag("medium-laser")[0];
        const old = tank.export() as unknown as Record<string, unknown>;
        expect(old.omni).toBeUndefined();
        expect(new Vehicle(JSON.stringify(old)).isOmni()).toBe(false);
        tank.setOmni(true);
        tank.setPodMounted(laser.uuid, true);
        const loaded = new Vehicle(tank.exportJSON());
        expect(loaded.isOmni()).toBe(true);
        expect(loaded.isPodMounted(laser.uuid)).toBe(true);
        expect(loaded.getCBillCost()).toBe(tank.getCBillCost());
        // A pod flag on a vehicle that is not an Omni is ignored.
        const saved = tank.export();
        const plain = new Vehicle(JSON.stringify({ ...saved, omni: false }));
        expect(plain.isPodMounted(laser.uuid)).toBe(false);
    });

    // TM p.108: an OmniVehicle's turret weighs the same in every configuration, set by the base chassis, and its
    // equipment (ammunition aside) may weigh no more than 10 times the turret.
    it("keeps the base chassis turret weight across configurations, and flags a turret loaded past 10 times it", () => {
        const tank = new Vehicle();
        tank.setTonnage(50);
        tank.setHasTurret(true);
        const laser = tank.addEquipmentFromTag("large-laser")[0];
        tank.setEquipmentLocation(laser.uuid!, "turret");
        expect(tank.getTurretWeight("turret")).toBe(0.5);
        // Only an OmniVehicle has a fixed base chassis turret.
        expect(tank.setOmniTurretWeight(2)).toBe(0);
        tank.setOmni(true);
        expect(tank.setOmniTurretWeight(2)).toBe(2);
        expect(tank.getTurretWeight("turret")).toBe(2);
        expect(tank.getWeights().find((entry) => entry.name === tank.getTurretName())?.weight).toBe(2);
        expect(tank.getOmniTurretIssue()).toBeNull();
        expect(new Vehicle(tank.exportJSON()).getOmniTurretWeight()).toBe(2);
        tank.setOmniTurretWeight(0.5);
        for (const tag of ["large-laser", "large-laser"]) tank.setEquipmentLocation(tank.addEquipmentFromTag(tag).at(-1)!.uuid!, "turret");
        expect(tank.getOmniTurretIssue()).toContain("15 tons of turret equipment; the 0.5-ton base chassis turret holds 5 (TM p.108)");
        // No fixed weight set: the turret is 10 percent of what is in it, as before.
        tank.setOmniTurretWeight(0);
        expect(tank.getTurretWeight("turret")).toBe(1.5);
        tank.setOmni(false);
        expect(tank.getOmniTurretWeight()).toBe(0);
    });

    it("carries battle armor without magnetic clamps and without losing MP, where a standard vehicle does not (TW p.227)", () => {
        const squad = new BattleArmor();
        squad.setManipulator("la", "battle-claw");
        const tank = new Vehicle();
        squad.setRiding(tank.getUUID(), "vehicle");
        const standard = getBattleArmorCarrierLoad([squad], { uuid: tank.getUUID(), name: "Tank", kind: "vehicle", omni: tank.isOmni() });
        expect(standard.walkingPenalty).toBe(1);
        expect(standard.issues.join(" ")).toContain("no magnetic clamps");
        tank.setOmni(true);
        const omni = getBattleArmorCarrierLoad([squad], { uuid: tank.getUUID(), name: "Tank", kind: "vehicle", omni: tank.isOmni() });
        expect([omni.walkingPenalty, omni.issues]).toEqual([0, []]);
    });
});
