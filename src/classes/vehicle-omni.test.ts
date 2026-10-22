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
        expect(tank.getCBillCostLog()).toContain("x 1.25 (OmniVehicle)");
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
