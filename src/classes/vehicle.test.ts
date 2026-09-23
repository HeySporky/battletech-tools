import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";
import { getVehicleTonnageBounds } from "../data/vehicle-motive-types";

describe("Vehicle tonnage bounds by motive type and rules level", () => {
    it("caps Tracked vehicles at 100 tons under standard rules and 200 under Advanced+", () => {
        expect(getVehicleTonnageBounds("tracked", 2)).toEqual({ min: 1, max: 100 });
        expect(getVehicleTonnageBounds("tracked", 3)).toEqual({ min: 1, max: 200 });
    });

    it("caps VTOLs at 30 tons under standard rules and 60 under Advanced+", () => {
        expect(getVehicleTonnageBounds("vtol", 2)).toEqual({ min: 1, max: 30 });
        expect(getVehicleTonnageBounds("vtol", 3)).toEqual({ min: 1, max: 60 });
    });

    it("keeps Naval hulls starting at 100 tons regardless of rules level", () => {
        expect(getVehicleTonnageBounds("naval-surface", 2)).toEqual({ min: 100, max: 555 });
        expect(getVehicleTonnageBounds("naval-sub", 3)).toEqual({ min: 100, max: 100000 });
    });
});

describe("Vehicle construction basics", () => {
    it("defaults to a Tracked vehicle with a turret", () => {
        const vehicle = new Vehicle();
        expect(vehicle.getMotiveType().tag).toBe("tracked");
        expect(vehicle.hasTurret()).toBe(true);
    });

    it("removes the turret automatically when switching to a Naval hull", () => {
        const vehicle = new Vehicle();
        vehicle.setMotiveType("naval-surface");
        expect(vehicle.hasTurret()).toBe(false);
    });

    it("computes engine rating from tonnage x cruise MP", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(40);
        vehicle.setCruiseMP(5);
        expect(vehicle.getEngineRating()).toBe(200);
        expect(vehicle.getFlankMP()).toBe(8);
    });

    it("tracks structure, engine, and armor weight against total tonnage", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(40);
        vehicle.setCruiseMP(5);
        vehicle.setArmorAllocation("front", 20);

        expect(vehicle.getStructureWeight()).toBe(4);
        expect(vehicle.getCurrentTonnage()).toBeGreaterThan(0);
        expect(vehicle.getRemainingTonnage()).toBe(40 - vehicle.getCurrentTonnage());
    });

    it("round-trips through export/import JSON", () => {
        const vehicle = new Vehicle();
        vehicle.setName("Test Hauler");
        vehicle.setTonnage(55);
        vehicle.setMotiveType("wheeled");

        const restored = new Vehicle(vehicle.exportJSON());
        expect(restored.getName()).toBe("Test Hauler");
        expect(restored.getTonnage()).toBe(55);
        expect(restored.getMotiveType().tag).toBe("wheeled");
    });

    it("offers only armor marked for combat vehicles", () => {
        const vehicle = new Vehicle();
        expect(vehicle.getAvailableArmorTypes().every(armor => armor.unitTypes.combatVehicle)).toBe(true);
        expect(vehicle.getAvailableArmorTypes().some(armor => armor.tag === "stealth-basic")).toBe(true);
        expect(vehicle.getAvailableArmorTypes().some(armor => armor.tag === "modular")).toBe(false);
        vehicle.setArmorType("stealth-improved");
        expect(vehicle.getArmorType().tag).toBe("standard");
    });

    it("mounts one Modular Armor pack per location and applies its cruise penalty", () => {
        const vehicle = new Vehicle();
        vehicle.setEra("ilClan");
        vehicle.setCruiseMP(5);
        vehicle.addEquipmentFromTag("modular-armor");
        vehicle.addEquipmentFromTag("modular-armor");
        const [firstPack, secondPack] = vehicle.getEquipmentList().filter(item => item.isModularArmor);

        vehicle.setEquipmentLocation(firstPack.uuid!, "front");
        vehicle.setEquipmentLocation(secondPack.uuid!, "front");

        expect(firstPack.location).toBe("front");
        expect(secondPack.location).not.toBe("front");
        expect(vehicle.getCruiseMP()).toBe(4);
        expect(new Vehicle(vehicle.exportJSON()).hasActiveModularArmor()).toBe(true);
    });
});

describe("Vehicle Internal Structure Table and armor caps", () => {
    it("gives 1 structure point per 10 tons uniformly across all locations, including the turret", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(60);
        expect(vehicle.getStructureAllocation()).toEqual({ front: 6, left: 6, right: 6, rear: 6, turret: 6 });
    });

    it("zeroes out the turret structure entry when the vehicle has no turret", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(60);
        vehicle.setHasTurret(false);
        expect(vehicle.getStructureAllocation().turret).toBe(0);
    });

    it("caps total armor points at (tonnage x 3.5) + 40, not a per-location structure multiple", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(60);
        expect(vehicle.getMaxArmorPoints()).toBe(60 * 3.5 + 40);
        vehicle.setArmorAllocation("front", 9999);
        expect(vehicle.getArmorAllocation().front).toBe(vehicle.getMaxArmorPoints());
    });

    it("lets a 70-ton Tracked vehicle mount far more than 4.5 tons of armor", () => {
        // Regression test: the old (structure x 2)-per-location cap maxed a 70-ton tank at 4.5 tons.
        const vehicle = new Vehicle();
        vehicle.setMotiveType("tracked");
        vehicle.setTonnage(70);
        vehicle.allocateMaxArmor();
        expect(vehicle.getMaxArmorPoints()).toBe(70 * 3.5 + 40);
        expect(vehicle.getArmorWeight()).toBeGreaterThan(4.5);
    });

    it("sets armor by tonnage in 0.5-ton increments and distributes points across locations", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(60);
        vehicle.setArmorTonnage(10);
        expect(vehicle.getArmorWeight()).toBe(10);
        const total = Object.values(vehicle.getArmorAllocation()).reduce((sum, points) => sum + points, 0);
        expect(total).toBe(Math.floor(10 * vehicle.getArmorPointsPerTon()));
    });
});

describe("Vehicle Alpha Strike stats", () => {
    it("bands Size by tonnage", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(35);
        expect(vehicle.getAlphaStrikeSize()).toBe(1);
        vehicle.setTonnage(45);
        expect(vehicle.getAlphaStrikeSize()).toBe(2);
        vehicle.setTonnage(65);
        expect(vehicle.getAlphaStrikeSize()).toBe(3);
        vehicle.setTonnage(100);
        expect(vehicle.getAlphaStrikeSize()).toBe(4);
    });

    it("converts Cruise MP to inches with no movement suffix for Tracked", () => {
        const vehicle = new Vehicle();
        vehicle.setCruiseMP(5);
        expect(vehicle.getAlphaStrikeMovement()).toBe(10);
        expect(vehicle.getAlphaStrikeMovementType()).toBe("");
    });

    it("uses the h suffix for Hover vehicles", () => {
        const vehicle = new Vehicle();
        vehicle.setMotiveType("hover");
        expect(vehicle.getAlphaStrikeMovementType()).toBe("h");
    });
});

