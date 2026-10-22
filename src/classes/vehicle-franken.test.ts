import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";

// FrankenVehicles: a Custom Homebrew rule (the user's, 2026-10-14) after CO pp.213-214's FrankenMechs. A vehicle
// carries a turret taken from another vehicle no heavier than itself.

const tank = (): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setTech("is");
    vehicle.setEra("early-rep");
    vehicle.setMotiveType("tracked");
    vehicle.setTonnage(60);
    vehicle.setHasTurret(true);
    vehicle.addEquipmentFromTag("medium-laser", "turret");
    return vehicle;
};
const franken = (): Vehicle => {
    const vehicle = tank();
    vehicle.setFrankenVehicle(true);
    return vehicle;
};

describe("FrankenVehicles (Custom Homebrew)", () => {
    it("is offered at the Custom Homebrew rules level, to a vehicle with a turret", () => {
        expect(tank().canBeFrankenVehicle(4)).toBe(false);
        expect(tank().canBeFrankenVehicle(6)).toBe(true);
        const open = new Vehicle();
        expect(open.canBeFrankenVehicle(6)).toBe(open.hasTurret());
        expect(tank().setFrankenVehicle(true, 5)).toBe(false);
        expect(franken().getRequiredRulesLevel()).toBe(6);
    });

    it("gives the turret its donor's structure, from a vehicle no heavier than the chassis", () => {
        const vehicle = franken();
        expect(vehicle.getStructureAllocation().turret).toBe(6);
        vehicle.setFrankenVehicleTurret({ turretDonorTonnage: 35 });
        expect(vehicle.getStructureAllocation().turret).toBe(4);
        expect(vehicle.getStructureAllocation().front).toBe(6);
        expect(vehicle.setFrankenVehicleTurret({ turretDonorTonnage: 70 })?.turretDonorTonnage).toBe(35);
        // A lighter chassis brings the donor down with it.
        vehicle.setTonnage(30);
        expect(vehicle.getFrankenVehicle()?.turretDonorTonnage).toBe(30);
    });

    it("adds +1 to Driving Skill Rolls only when the turret is heavier than the original", () => {
        const vehicle = franken();
        // Starts as the chassis's own turret.
        expect(vehicle.getFrankenVehicle()?.originalTurretWeight).toBe(vehicle.getTurretLoadedWeight());
        expect(vehicle.getDrivingModifier()).toBe(0);
        vehicle.setFrankenVehicleTurret({ originalTurretWeight: 1 });
        expect(vehicle.getFrankenVehicleDrivingModifier()).toBe(1);
        expect(vehicle.getDrivingModifier()).toBe(1);
        expect(vehicle.getFrankenVehicleNotes()).toContain("Turret heavier than the chassis's own: +1 to Driving Skill Rolls.");
    });

    it("adds +1 to hit for turret weapons fired from the chassis, none when the commander fires them from the turret", () => {
        const vehicle = franken();
        const laser = vehicle.getEquipmentList().find((item) => item.tag === "medium-laser")!;
        const base = vehicle.getWeaponToHitModifier(laser);
        vehicle.setFrankenVehicleTurret({ turretGunner: "chassis" });
        expect(vehicle.getWeaponToHitModifier(laser)).toBe((base ?? 0) + 1);
        vehicle.setFrankenVehicleTurret({ turretGunner: "commander" });
        expect(vehicle.getWeaponToHitModifier(laser)).toBe(base);
    });

    it("rolls the turret linkage when the turret takes damage, and locks it on 10+", () => {
        const vehicle = franken();
        // Front column, 10: turret.
        vehicle.resolveAttack(10, "front", 5);
        const linkage = vehicle.takeFollowUpRolls().find((roll) => roll.kind === "turretLinkage")!;
        expect(linkage).toEqual({ kind: "turretLinkage", target: 10 });
        expect(vehicle.resolveFollowUpRoll(linkage, 9)).toContain("still turns");
        expect(vehicle.canRotateTurret("turret")).toBe(true);
        expect(vehicle.resolveFollowUpRoll(linkage, 10)).toContain("the turret locks");
        expect(vehicle.canRotateTurret("turret")).toBe(false);
        // A locked turret rolls no more.
        vehicle.resolveAttack(10, "front", 5);
        expect(vehicle.takeFollowUpRolls().some((roll) => roll.kind === "turretLinkage")).toBe(false);
        // An ordinary vehicle never rolls it.
        const plain = tank();
        plain.resolveAttack(10, "front", 5);
        expect(plain.takeFollowUpRolls().some((roll) => roll.kind === "turretLinkage")).toBe(false);
    });

    it("is not an OmniVehicle, and loses the rule with its turret", () => {
        const vehicle = tank();
        vehicle.setOmni(true);
        vehicle.setFrankenVehicle(true);
        expect(vehicle.isOmni()).toBe(false);
        expect(vehicle.setOmni(true)).toBe(false);
        vehicle.setHasTurret(false);
        expect(vehicle.isFrankenVehicle()).toBe(false);
    });

    it("saves and reloads, checking each value", () => {
        const vehicle = franken();
        vehicle.setFrankenVehicleTurret({ turretDonorTonnage: 40, originalTurretWeight: 3, turretGunner: "chassis", turretDonorName: "Vedette" });
        const saved = vehicle.export();
        const loaded = new Vehicle(JSON.stringify(saved));
        expect(loaded.getFrankenVehicle()).toEqual({ turretDonorTonnage: 40, originalTurretWeight: 3, turretGunner: "chassis", turretDonorName: "Vedette" });
        expect(loaded.getStructureAllocation().turret).toBe(4);
        const tampered = new Vehicle(JSON.stringify({ ...saved, frankenVehicle: { turretDonorTonnage: 900, originalTurretWeight: -2, turretGunner: "x" } }));
        expect(tampered.getFrankenVehicle()).toEqual({ turretDonorTonnage: 60, originalTurretWeight: 0, turretGunner: "commander" });
        expect(new Vehicle(JSON.stringify(tank().export())).isFrankenVehicle()).toBe(false);
    });
});
