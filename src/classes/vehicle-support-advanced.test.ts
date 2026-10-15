import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";

// Advanced Support Vehicles (TO:AUE pp.16-71): Rail and Large Naval units, rebuilt from the book's worked examples.
const supportVehicle = (motive: string, tons: number): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType(motive);
    vehicle.setSupportVehicle(true);
    vehicle.setHasTurret(false);
    vehicle.setTonnage(tons);
    return vehicle;
};

const adelanteTractor = (): Vehicle => {
    const vehicle = supportVehicle("rail", 600);
    vehicle.setSupportVehicleTechRating("structural", "d");
    vehicle.setSupportVehicleChassisModification("tractor", true);
    vehicle.setSupportVehicleEngine("fusion");
    vehicle.setSupportVehicleTechRating("engine", "d");
    vehicle.setCruiseMP(12);
    vehicle.setBAR(7);
    vehicle.setSupportVehicleTechRating("armor", "d");
    for (const [location, points] of [["front", 40], ["frontLeft", 35], ["frontRight", 35], ["rearLeft", 35], ["rearRight", 35], ["rear", 20]] as const) {
        vehicle.setArmorAllocation(location, points);
    }
    for (let i = 0; i < 5; i++) vehicle.addEquipmentFromTag("quarters-crew");
    return vehicle;
};

const jormungand = (): Vehicle => {
    const vehicle = supportVehicle("naval-surface", 60000);
    vehicle.setSupportVehicleTechRating("structural", "c");
    vehicle.setSupportVehicleChassisModification("armored", true);
    vehicle.setSupportVehicleEngine("fusion");
    vehicle.setSupportVehicleTechRating("engine", "c");
    vehicle.setCruiseMP(6);
    vehicle.setAdditionalHeatSinks(40);
    vehicle.setTurretCount(5);
    vehicle.setBAR(10);
    vehicle.setSupportVehicleTechRating("armor", "c");
    vehicle.setArmorAllocation("front", 304);
    for (const location of ["frontLeft", "frontRight", "rearLeft", "rearRight", "rear"] as const) vehicle.setArmorAllocation(location, 300);
    for (const turret of ["turret", "turret2", "turret3", "turret4", "turret5"] as const) vehicle.setArmorAllocation(turret, 257);
    return vehicle;
};

describe("Rail Support Vehicles: the Adelante (TO:AUE pp.56-71)", () => {
    it("is a Rail motive type only Support Vehicles use, at the Advanced rules level", () => {
        const vehicle = new Vehicle();
        vehicle.setMotiveType("rail");
        expect(vehicle.isSupportVehicle()).toBe(true);
        expect(vehicle.getRequiredRulesLevel()).toBe(3);
        vehicle.setSupportVehicle(false);
        expect(vehicle.getMotiveType().tag).toBe("wheeled");
    });

    it("builds the 600-ton primary tractor: chassis 216 t, engine 312 t, BAR 7 armor 9 t, 41 slots", () => {
        const vehicle = adelanteTractor();
        expect(vehicle.isAdvancedSupportVehicle()).toBe(true);
        expect(vehicle.getStructureWeight()).toBe(216);
        // Movement Factor 4 + (12 - 2)^2 = 104; 0.005 x 104 x 1.0 x 600.
        expect(vehicle.getEngineWeight()).toBe(312);
        expect(vehicle.getFlankMP()).toBe(18);
        expect(vehicle.getMaxArmorPoints()).toBe(304);
        expect(vehicle.getArmorWeight()).toBe(9);
        expect(vehicle.getTotalItemSlots()).toBe(41);
        expect(vehicle.getStructureAllocation().front).toBe(60);
        expect(vehicle.getLocations().map((loc) => loc.tag)).toEqual(["front", "frontLeft", "frontRight", "rearLeft", "rearRight", "rear"]);
        expect(vehicle.getCrew()).toBe(3);
        // 600 - 216 - 312 - 35 quarters - 9 armor.
        expect(vehicle.getRemainingTonnage()).toBe(28);
        expect(vehicle.canHaveTurret()).toBe(false);
        expect(vehicle.getSupportVehicleIssues()).toEqual([]);
    });

    it("builds the 120-ton Omni railcar: Tractor and Trailer, no engine, BAR 9 Tech F armor", () => {
        const vehicle = supportVehicle("rail", 120);
        vehicle.setSupportVehicleTechRating("structural", "f");
        vehicle.setSupportVehicleChassisModification("tractor", true);
        vehicle.setSupportVehicleChassisModification("trailer", true);
        vehicle.setOmni(true);
        vehicle.setSupportVehicleEngine("none");
        vehicle.setBAR(9);
        vehicle.setSupportVehicleTechRating("armor", "f");
        for (const [location, points] of [["front", 16], ["left", 16], ["right", 16], ["rear", 15]] as const) vehicle.setArmorAllocation(location, points);
        expect(vehicle.getStructureWeight()).toBe(15.5);
        expect(vehicle.getMaxArmorPoints()).toBe(64);
        // 63 x 47 kg = 2,961 kg, rounded up to 3 tons (the Advanced Support Vehicle Armor Weights table).
        expect(vehicle.getArmorWeight()).toBe(3);
        expect(vehicle.getTotalItemSlots()).toBe(17);
        expect(vehicle.getStructureAllocation().front).toBe(12);
        expect(vehicle.getCrew()).toBe(0);
        expect(vehicle.getRemainingTonnage()).toBe(101.5);
    });

    it("needs the External Power Pickup for an External engine, and keeps it off a MagLev", () => {
        const vehicle = supportVehicle("rail", 50);
        vehicle.setSupportVehicleTechRating("structural", "b");
        vehicle.setSupportVehicleEngine("external");
        vehicle.setSupportVehicleTechRating("engine", "b");
        expect(vehicle.getSupportVehicleIssues().join(" ")).toContain("External Power Pickup");
        vehicle.setSupportVehicleChassisModification("external-power-pickup", true);
        vehicle.setSupportVehicleChassisModification("tractor", true);
        // TO:AUE p.58: 0.20 x 1.3 x 1.1 x 1.2 x 50 = 17.16, rounded up to 17.5.
        expect(vehicle.getStructureWeight()).toBe(17.5);
        expect(vehicle.getSupportVehicleIssues().join(" ")).not.toContain("External Power Pickup chassis");
        vehicle.setSupportVehicleTechRating("structural", "d");
        vehicle.setSupportVehicleEngine("maglev");
        vehicle.setSupportVehicleTechRating("engine", "d");
        expect(vehicle.getSupportVehicleIssues().join(" ")).toContain("MagLev");
        expect(new Vehicle().getAvailableSupportVehicleEngines().some((engine) => engine.tag === "maglev")).toBe(false);
    });

    it("prices it without a Tech Rating multiplier, x (1 + tons / 250) (TO:AUE p.229)", () => {
        const vehicle = adelanteTractor();
        expect(vehicle.getCBillCostLog()).toContain("x 1 (Structural Tech Rating D)");
        expect(vehicle.getCBillCostLog()).toContain("/ 250");
    });

    it("slows a Rail Tractor by the rail towing table, never below 2 MP (TO:AUE p.17)", () => {
        const vehicle = adelanteTractor();
        expect(vehicle.getMaxTowTons()).toBe(3000);
        vehicle.setTowedTons(300);
        expect(vehicle.getEffectiveCruiseMP()).toBe(12);
        vehicle.setTowedTons(1200);
        // More than half up to twice: -3 or a third, whichever is less.
        expect(vehicle.getEffectiveCruiseMP()).toBe(9);
        vehicle.setTowedTons(2400);
        expect(vehicle.getEffectiveCruiseMP()).toBe(6);
        vehicle.setTowedTons(3000);
        expect(vehicle.getEffectiveCruiseMP()).toBe(4);
    });
});

describe("Large Naval Vessels: the Jormungand (TO:AUE pp.56-71)", () => {
    it("builds the 60,000-ton battlecruiser to the book", () => {
        const vehicle = jormungand();
        expect(vehicle.isLargeNavalVessel()).toBe(true);
        expect(vehicle.getStructureWeight()).toBe(17595);
        // Movement Factor 4 + 6^2 = 40; 0.009 x 40 x 1.5 x 60,000.
        expect(vehicle.getEngineWeight()).toBe(32400);
        expect(vehicle.getTotalItemSlots()).toBe(635);
        expect(vehicle.getLargeVesselTemplate()?.template).toBe("E");
        expect(vehicle.getMaxTurrets()).toBe(9);
        expect(vehicle.getTurretCount()).toBe(5);
        expect(vehicle.getLocations()).toHaveLength(11);
        expect(vehicle.getStructureAllocation().turret5).toBe(60);
        expect(vehicle.getMaxArmorPoints()).toBe(3089);
        // 3,089 x 150 kg = 463.35 tons, rounded up to 463.5.
        expect(vehicle.getArmorWeight()).toBe(463.5);
        // Base crew 3 + 60,000 / 5,000 = 15, and 3 officers.
        expect(vehicle.getCrew()).toBe(18);
        expect(vehicle.getRemainingTonnage()).toBe(9501.5);
        expect(vehicle.getSupportVehicleIssues()).toEqual([]);
    });

    it("is Size 5 with SLG in Alpha Strike, and -4 to hit (ASC p.92; TO:AUE p.57)", () => {
        const vehicle = jormungand();
        expect(vehicle.getAlphaStrikeSize()).toBe(5);
        expect(vehicle.getAlphaStrikeStats().specialAbilities).toContain("SLG");
        expect(vehicle.getTemplateToHitModifier()).toBe(-4);
        // 11 locations x 60 structure, divided by 35 over 30,000 tons (ASC p.97); an arc each for front, sides, rear
        // and the 5 turrets (ASC p.103).
        expect(vehicle.getAlphaStrikeStructure()).toBe(19);
        expect(vehicle.getAlphaStrikeStats().arcs?.map((arc) => arc.name)).toEqual(["Front", "Left", "Right", "Rear", "Turret 1", "Turret 2", "Turret 3", "Turret 4", "Turret 5"]);
        expect(supportVehicle("naval-surface", 5000).getAlphaStrikeSize()).toBe(3);
        expect(supportVehicle("wheeled", 3).getAlphaStrikeSize()).toBe(1);
        expect(supportVehicle("tracked", 150).getAlphaStrikeSize()).toBe(3);
    });

    it("saves and loads its turrets", () => {
        const loaded = new Vehicle(jormungand().exportJSON());
        expect(loaded.getTurretCount()).toBe(5);
        expect(loaded.getArmorAllocation().turret5).toBe(257);
    });

    it("hits by the Large Naval Vessel table and survives losing a turret (TO:AUE pp.26-27)", () => {
        const vehicle = jormungand();
        // A 10 from the front is a turret: the first one standing.
        vehicle.resolveAttack(10, "front", 20);
        expect(vehicle.getArmorRemaining("turret")).toBe(237);
        vehicle.applyCriticalHit("turretBlownOff", "turret");
        expect(vehicle.getStructureRemaining("turret")).toBe(0);
        expect(vehicle.isDestroyed()).toBe(false);
        // The next turret result goes to Turret 2.
        vehicle.resolveAttack(11, "front", 10);
        expect(vehicle.getArmorRemaining("turret2")).toBe(247);
        // A 5 from the front strikes the hex to the right: the front-right armor.
        vehicle.resolveAttack(5, "front", 10);
        expect(vehicle.getArmorRemaining("frontRight")).toBe(290);
    });

    it("marks off crew boxes, shrugs off engine hits on 8+, and loses Cruising MP to engine and ammunition hits", () => {
        const vehicle = jormungand();
        vehicle.applyCriticalHit("crewKilled", "front");
        expect(vehicle.isDestroyed()).toBe(false);
        expect(vehicle.getInPlay().criticals.crewHits).toBe(1);
        vehicle.applyCriticalHit("engineHit", "rear");
        const check = vehicle.takeFollowUpRolls().find((roll) => roll.kind === "engineSurvival");
        expect(check).toBeDefined();
        expect(vehicle.resolveFollowUpRoll(check!, 9)).toContain("ignored");
        expect(vehicle.getEffectiveCruiseMP()).toBe(6);
        vehicle.resolveFollowUpRoll(check!, 5);
        expect(vehicle.getEffectiveCruiseMP()).toBe(5);
        expect(vehicle.isImmobile()).toBe(false);
        for (let i = 0; i < 5; i++) vehicle.applyCriticalHit("crewKilled", "front");
        expect(vehicle.isDestroyed()).toBe(true);
    });
});
