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

    // Limits as implemented by MegaMek (TestTank.maxTonnage); published MUL vessels run from 25 t up.
    it("caps Naval hulls at 300 tons (555 Superheavy) with no 100-ton minimum", () => {
        expect(getVehicleTonnageBounds("naval-surface", 2)).toEqual({ min: 1, max: 300 });
        expect(getVehicleTonnageBounds("naval-sub", 3)).toEqual({ min: 1, max: 555 });
    });
});

describe("Vehicle construction basics", () => {
    it("defaults to a Tracked vehicle with a turret", () => {
        const vehicle = new Vehicle();
        expect(vehicle.getMotiveType().tag).toBe("tracked");
        expect(vehicle.hasTurret()).toBe(true);
    });

    it("keeps the turret when switching to a Naval hull (naval vessels may mount turrets)", () => {
        const vehicle = new Vehicle();
        vehicle.setMotiveType("naval-surface");
        expect(vehicle.hasTurret()).toBe(true);
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
    it("gives 1 structure point per 10 tons (rounded up) uniformly across all locations, including the turret", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(60);
        expect(vehicle.getStructureAllocation()).toEqual({ front: 6, left: 6, right: 6, rear: 6, rotor: 0, turret: 6 });
        vehicle.setTonnage(21);
        expect(vehicle.getStructureAllocation().front).toBe(3);
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

    it("converts Cruise MP to inches with the t code for Tracked", () => {
        const vehicle = new Vehicle();
        vehicle.setCruiseMP(5);
        expect(vehicle.getAlphaStrikeMovement()).toBe(10);
        expect(vehicle.getAlphaStrikeMovementType()).toBe("t");
    });

    // Codes as printed on Master Unit List cards (e.g. 10"t, 8"w, 18"h, 18"v, 10"g, 24"n, 6"s).
    it("uses the MUL movement code for every motive type", () => {
        const vehicle = new Vehicle();
        const codes: Record<string, string> = {
            tracked: "t", wheeled: "w", hover: "h", vtol: "v", wige: "g",
            "naval-surface": "n", hydrofoil: "n", "naval-sub": "s",
        };
        for (const [motive, code] of Object.entries(codes)) {
            vehicle.setMotiveType(motive);
            expect(vehicle.getAlphaStrikeMovementType(), motive).toBe(code);
        }
    });

    it("uses the h suffix for Hover vehicles", () => {
        const vehicle = new Vehicle();
        vehicle.setMotiveType("hover");
        expect(vehicle.getAlphaStrikeMovementType()).toBe("h");
    });
});


describe("Vehicle engine weight", () => {
    it("adds x1.5 shielding to fusion engines but not to ICE", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(25);
        vehicle.setCruiseMP(4); // rating 100
        vehicle.setEngineType("standard");
        expect(vehicle.getEngineWeight()).toBe(4.5); // 3 x 1.5
        vehicle.setEngineType("ice");
        expect(vehicle.getEngineWeight()).toBe(6); // 3 x 2, unshielded
    });

    it("subtracts the motive type's suspension factor from the engine rating", () => {
        const vehicle = new Vehicle();
        vehicle.setMotiveType("hover");
        vehicle.setTonnage(25);
        vehicle.setCruiseMP(8);
        expect(vehicle.getSuspensionFactor()).toBe(130);
        expect(vehicle.getEngineRating()).toBe(70); // 25 x 8 - 130
        vehicle.setMotiveType("wheeled");
        expect(vehicle.getEngineRating()).toBe(180); // 200 - 20
        vehicle.setMotiveType("tracked");
        expect(vehicle.getEngineRating()).toBe(200);
    });
});

describe("Vehicle rules level", () => {
    it("is Standard-legal by default and Custom Homebrew with custom equipment", () => {
        const vehicle = new Vehicle();
        expect(vehicle.getRequiredRulesLevel()).toBe(0);
    });
});

// Motive type rules (TechManual Combat Vehicles; values as implemented by MegaMek TestTank / Tank,
// book not in hand).
describe("Vehicle motive types", () => {
    const build = (motive: string, tonnage: number): Vehicle => {
        const vehicle = new Vehicle();
        vehicle.setMotiveType(motive);
        vehicle.setTonnage(tonnage);
        return vehicle;
    };
    const weightOf = (vehicle: Vehicle, name: string) => vehicle.getWeights().find((entry) => entry.name === name)?.weight;

    it("caps each motive type at its standard and Superheavy tonnage", () => {
        const expected: Record<string, [number, number]> = {
            wheeled: [80, 160], hover: [50, 100], wige: [80, 160], vtol: [30, 60],
            "naval-surface": [300, 555], hydrofoil: [100, 100], "naval-sub": [300, 555],
        };
        for (const [motive, [standard, superheavy]] of Object.entries(expected)) {
            expect(getVehicleTonnageBounds(motive, 2), motive).toEqual({ min: 1, max: standard });
            expect(getVehicleTonnageBounds(motive, 3), motive).toEqual({ min: 1, max: superheavy });
        }
    });

    it("subtracts each motive type's suspension factor from the engine rating", () => {
        expect(build("wheeled", 40).getSuspensionFactor()).toBe(20);
        expect(build("hover", 10).getSuspensionFactor()).toBe(40);
        expect(build("vtol", 20).getSuspensionFactor()).toBe(95);
        expect(build("wige", 15).getSuspensionFactor()).toBe(45);
        expect(build("hydrofoil", 25).getSuspensionFactor()).toBe(150);
        expect(build("naval-surface", 100).getSuspensionFactor()).toBe(30);
        expect(build("naval-sub", 100).getSuspensionFactor()).toBe(30);

        const hover = build("hover", 20);
        hover.setCruiseMP(10);
        expect(hover.getEngineRating()).toBe(20 * 10 - 85);
    });

    it("never rates an engine below 10 and caps Cruise MP at a 400 rating (500 with Large engines)", () => {
        const vtol = build("vtol", 10);
        vtol.setCruiseMP(5);
        expect(vtol.getEngineRating()).toBe(10);
        expect(build("tracked", 50).getMaxCruiseMP(2)).toBe(8);
        expect(build("hover", 50).getMaxCruiseMP(2)).toBe(Math.floor((400 + 235) / 50));
        expect(build("tracked", 50).getMaxCruiseMP(4)).toBe(10);
    });

    it("adds 5% control systems to every vehicle and 10% lift or dive equipment where needed", () => {
        expect(weightOf(build("tracked", 40), "Control Systems")).toBe(2);
        expect(weightOf(build("hover", 25), "Control Systems")).toBe(1.5);
        expect(weightOf(build("hover", 25), "Lift Equipment")).toBe(2.5);
        expect(weightOf(build("wige", 40), "Lift Equipment")).toBe(4);
        expect(weightOf(build("vtol", 25), "Rotor Assembly")).toBe(2.5);
        expect(weightOf(build("hydrofoil", 50), "Hydrofoil Equipment")).toBe(5);
        expect(weightOf(build("naval-sub", 100), "Dive Equipment")).toBe(10);
        for (const motive of ["tracked", "wheeled", "naval-surface"]) {
            expect(build(motive, 40).getLiftEquipmentWeight(), motive).toBe(0);
        }
    });

    it("gives VTOLs a rotor with its own structure and at most 2 armor points", () => {
        const vtol = build("vtol", 30);
        vtol.setCruiseMP(8);
        expect(vtol.getLocations().map((loc) => loc.tag)).toEqual(["front", "left", "right", "rear", "rotor"]);
        expect(vtol.getStructureAllocation().rotor).toBe(3);
        vtol.setArmorAllocation("rotor", 10);
        expect(vtol.getArmorAllocation().rotor).toBe(2);
        vtol.allocateArmorClear();
        vtol.setArmorAllocation("front", 20);
        vtol.allocateMaxArmor();
        expect(vtol.getArmorAllocation().rotor).toBe(2);
        expect(build("tracked", 30).getLocations().some((loc) => loc.tag === "rotor")).toBe(false);
    });

    it("gives VTOLs only a chin turret, which is Advanced", () => {
        const vtol = build("vtol", 20);
        expect(vtol.hasTurret()).toBe(false);
        expect(vtol.getRequiredRulesLevel()).toBe(0);
        vtol.setHasTurret(true);
        expect(vtol.getTurretName()).toBe("Chin Turret");
        expect(vtol.getLocations().map((loc) => loc.name)).toContain("Chin Turret");
        expect(vtol.getRequiredRulesLevel()).toBe(3);
    });

    it("puts equipment in body locations or the turret, never the rotor", () => {
        const vtol = build("vtol", 20);
        vtol.addEquipmentFromTag("medium-laser");
        const laser = vtol.getEquipmentList()[0];
        vtol.setEquipmentLocation(laser.uuid!, "rotor");
        expect(laser.location ?? "").toBe("");
        vtol.setEquipmentLocation(laser.uuid!, "front");
        expect(laser.location).toBe("front");
    });

    it("returns turret equipment to the unallocated list and drops its armor when the turret is removed", () => {
        const tank = build("tracked", 50);
        tank.addEquipmentFromTag("medium-laser");
        const laser = tank.getEquipmentList()[0];
        tank.setEquipmentLocation(laser.uuid!, "turret");
        tank.setArmorAllocation("turret", 10);
        tank.setMotiveType("vtol");
        expect(laser.location).toBe("");
        expect(tank.getArmorAllocation().turret).toBe(0);
    });

    it("keeps Hardened armor off VTOL, hover and WiGE vehicles", () => {
        for (const motive of ["vtol", "hover", "wige"]) {
            expect(build(motive, 20).getAvailableArmorTypes().some((armor) => armor.tag === "hardened"), motive).toBe(false);
        }
    });

    it("treats vehicles over the standard cap as Superheavy (Advanced), with double structure except at sea", () => {
        const wheeled = build("wheeled", 100);
        expect(wheeled.isSuperheavy()).toBe(true);
        expect(wheeled.getRequiredRulesLevel()).toBe(3);
        expect(wheeled.getStructureWeight()).toBe(20);
        expect(build("wheeled", 80).isSuperheavy()).toBe(false);
        const vessel = build("naval-surface", 400);
        expect(vessel.isSuperheavy()).toBe(true);
        expect(vessel.getStructureWeight()).toBe(40);
    });

    it("round-trips a VTOL with rotor armor and a chin turret, and loads older saves without a rotor entry", () => {
        const vtol = build("vtol", 25);
        vtol.setHasTurret(true);
        vtol.setArmorAllocation("rotor", 2);
        const restored = new Vehicle(vtol.exportJSON());
        expect(restored.getMotiveType().tag).toBe("vtol");
        expect(restored.hasChinTurret()).toBe(true);
        expect(restored.getArmorAllocation().rotor).toBe(2);

        const legacy = JSON.parse(build("tracked", 40).exportJSON());
        delete legacy.armorAllocation.rotor;
        expect(new Vehicle(JSON.stringify(legacy)).getArmorAllocation().rotor).toBe(0);
    });
});
