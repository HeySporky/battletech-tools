import { describe, expect, it } from "vitest";
import { getAerospaceArmorPointsPerTon } from "./aerospace-armor-types";
import {
    getAdvancedAerospaceArcs,
    getAdvancedAerospaceArmorPoints,
    getAdvancedAerospaceBaseCrew,
    getAdvancedAerospaceControlsWeight,
    getAdvancedAerospaceEngineWeight,
    getAdvancedAerospaceFireControlWeight,
    getAdvancedAerospaceFreeArmorPerFacing,
    getAdvancedAerospaceFreeHeatSinks,
    getAdvancedAerospaceFuelPointsPerTon,
    getAdvancedAerospaceFuelPumpWeight,
    getAdvancedAerospaceMaxArmorTons,
    getAdvancedAerospaceMaxThrust,
    getAdvancedAerospaceMinimumGunners,
    getAdvancedAerospaceMinimumOfficers,
    getAdvancedAerospaceStrategicFuelPerDay,
    getAdvancedAerospaceStructureWeight,
    getJumpSailIntegrity,
    getJumpSailWeight,
    getKFDriveIntegrity,
    getKFDriveWeight,
    getMaxDockingCollars,
} from "./advanced-aerospace-construction";

// The three worked examples of the construction chapter (SO:AA pp.132-147), step by step.
describe("Advanced aerospace construction (SO:AA pp.130-149)", () => {
    it("Alliance-class space station, 100,000 tons, Inner Sphere", () => {
        expect(getAdvancedAerospaceStructureWeight("spaceStation", 100000, 1)).toBe(1000);
        expect(getAdvancedAerospaceEngineWeight("spaceStation", 100000, 0)).toBe(1200);
        expect(getAdvancedAerospaceFuelPointsPerTon(100000)).toBe(10);
        expect(getAdvancedAerospaceFuelPumpWeight(10000)).toBe(200);
        expect(getAdvancedAerospaceStrategicFuelPerDay("spaceStation", 100000)).toBeCloseTo(1.975);
        expect(getAdvancedAerospaceControlsWeight("spaceStation", 100000)).toBe(100);
        expect(getAdvancedAerospaceBaseCrew("spaceStation", 100000)).toBe(65);
        expect(getAdvancedAerospaceMinimumOfficers(65)).toBe(11);
        expect(getAdvancedAerospaceFreeHeatSinks(1200)).toBe(93);
        expect(getAdvancedAerospaceMaxArmorTons("spaceStation", 1000)).toBe(393);
        expect(getAdvancedAerospaceFreeArmorPerFacing(1)).toBe(0);
        expect(42 / getAerospaceArmorPointsPerTon("capital-standard", "advanced-aerospace", "is", 100000)!).toBe(52.5);
        // 72 standard weapons need 12 gunners, and 77 crew 13 officers (p.144).
        expect(getAdvancedAerospaceMinimumGunners(72, 0)).toBe(12);
        expect(getAdvancedAerospaceMinimumOfficers(77)).toBe(13);
        expect(getAdvancedAerospaceArcs("spaceStation")).toHaveLength(6);
    });

    it("Odyssey-class JumpShip, 345,000 tons, Clan", () => {
        expect(getAdvancedAerospaceStructureWeight("jumpShip", 345000, 1)).toBe(2300);
        expect(getAdvancedAerospaceEngineWeight("jumpShip", 345000, 0)).toBe(4140);
        expect(getAdvancedAerospaceMaxThrust("jumpShip", 0)).toBe(0);
        expect(getAdvancedAerospaceFuelPointsPerTon(345000)).toBe(2.5);
        expect(getAdvancedAerospaceFuelPumpWeight(1000)).toBe(20);
        expect(getAdvancedAerospaceStrategicFuelPerDay("jumpShip", 345000)).toBeCloseTo(3.952);
        expect(getKFDriveWeight("jumpShip", 345000)).toBe(327750);
        expect(getKFDriveIntegrity("jumpShip", 345000)).toBe(7);
        expect(getJumpSailWeight("jumpShip", 345000)).toBe(76);
        expect(getJumpSailIntegrity(76)).toBe(5);
        expect(getAdvancedAerospaceControlsWeight("jumpShip", 345000)).toBe(863);
        expect(getAdvancedAerospaceBaseCrew("jumpShip", 345000)).toBe(24);
        expect(getAdvancedAerospaceMinimumOfficers(24)).toBe(4);
        expect(getAdvancedAerospaceFreeHeatSinks(4140)).toBe(135);
        expect(getAdvancedAerospaceMaxArmorTons("jumpShip", 2300)).toBe(191.5);
        expect(getAdvancedAerospaceArmorPoints(168, getAerospaceArmorPointsPerTon("capital-standard", "advanced-aerospace", "clan", 345000)!)).toBe(84);
        // 26 weapons (the AMS need no gunner) want 5 gunners; 29 crew want 5 officers (p.144).
        expect(getAdvancedAerospaceMinimumGunners(26, 0)).toBe(5);
        expect(getAdvancedAerospaceMinimumOfficers(29)).toBe(5);
        expect(getAdvancedAerospaceArcs("jumpShip")).not.toContain("leftBroadside");
    });

    it("McKenna-class WarShip, 1,930,000 tons, Safe Thrust 3, SI 95, Inner Sphere", () => {
        expect(getAdvancedAerospaceMaxThrust("warShip", 3)).toBe(5);
        expect(getAdvancedAerospaceEngineWeight("warShip", 1930000, 3)).toBe(347400);
        expect(getAdvancedAerospaceFuelPointsPerTon(1930000)).toBe(2.5);
        expect(getAdvancedAerospaceFuelPumpWeight(1600)).toBe(32);
        expect(getAdvancedAerospaceStrategicFuelPerDay("warShip", 1930000)).toBe(39.52);
        expect(getAdvancedAerospaceStructureWeight("warShip", 1930000, 95)).toBe(183350);
        expect(getKFDriveWeight("warShip", 1930000)).toBe(873325);
        expect(getKFDriveIntegrity("warShip", 1930000)).toBe(37);
        expect(getJumpSailWeight("warShip", 1930000)).toBe(127);
        expect(getJumpSailIntegrity(127)).toBe(8);
        expect(getAdvancedAerospaceControlsWeight("warShip", 1930000)).toBe(4825);
        expect(getAdvancedAerospaceBaseCrew("warShip", 1930000)).toBe(431);
        expect(getAdvancedAerospaceMinimumOfficers(431)).toBe(72);
        expect(getAdvancedAerospaceFreeHeatSinks(347400)).toBe(878);
        expect(getAdvancedAerospaceMaxArmorTons("warShip", 183350)).toBe(3667);
        expect(getAdvancedAerospaceFreeArmorPerFacing(95)).toBe(10);
        expect(getAdvancedAerospaceArmorPoints(1603.5, getAerospaceArmorPointsPerTon("ferro-carbide", "advanced-aerospace", "is", 1930000)!)).toBe(1282);
        // 78 capital weapons need 78 gunners; 509 crew want 85 officers, 579 want 97 (p.145).
        expect(getAdvancedAerospaceMinimumGunners(0, 78)).toBe(78);
        expect(getAdvancedAerospaceMinimumOfficers(509)).toBe(85);
        expect(getAdvancedAerospaceMinimumOfficers(579)).toBe(97);
        expect(getAdvancedAerospaceArcs("warShip")).toContain("leftBroadside");
        expect(getAdvancedAerospaceFireControlWeight("warShip", 20, 22900)).toBe(0);
    });

    it("docking collars: one per 50,000 tons, rounded up (TO:AUE p.116; SO:AA p.142 per errata v5.0)", () => {
        // The errata corrects the examples: the Odyssey may have 7, the McKenna 39 (pp.144-145).
        expect(getMaxDockingCollars(345000)).toBe(7);
        expect(getMaxDockingCollars(1930000)).toBe(39);
        expect(getMaxDockingCollars(50000)).toBe(1);
        expect(getMaxDockingCollars(49500)).toBe(0);
    });
});
