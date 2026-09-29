import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";
import { BattleMechGroup } from "./battlemech-group";
import Pilot from "./pilot";

// Play-mode effects follow Total Warfare's combat vehicle rules as implemented by MegaMek
// (Tank.addMovementDamage, Tank critical effects, ComputeAttackerToHitMods). Answered from the
// MegaMek implementation, not the book in hand.
const buildTank = (motive: string = "tracked"): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType(motive);
    vehicle.setTonnage(motive === "vtol" ? 20 : 50);
    vehicle.setEngineType("ice");
    vehicle.setCruiseMP(motive === "vtol" ? 8 : 5);
    if (motive !== "vtol") vehicle.setHasTurret(true);
    for (const loc of vehicle.getLocations()) {
        vehicle.setArmorAllocation(loc.tag, loc.tag === "rotor" ? 2 : 10);
    }
    vehicle.addEquipmentFromTag("medium-laser");
    const laser = vehicle.getEquipmentList()[vehicle.getEquipmentList().length - 1];
    vehicle.setEquipmentLocation(laser.uuid || "", motive === "vtol" ? "front" : "turret");
    return vehicle;
};

const laserOf = (vehicle: Vehicle) => vehicle.getEquipmentList().find((item) => item.name.includes("Laser"))!;

describe("Vehicle play mode: damage", () => {
    it("takes damage to armor first, then internal structure", () => {
        const tank = buildTank();
        const structure = tank.getStructureAllocation().front;
        const result = tank.takeDamage("front", 12);
        expect(result).toEqual({ armor: 10, structure: 2, locationDestroyed: false });
        expect(tank.getArmorRemaining("front")).toBe(0);
        expect(tank.getStructureRemaining("front")).toBe(structure - 2);
        expect(tank.isDamaged()).toBe(true);
    });

    it("is destroyed when a body location loses all its structure", () => {
        const tank = buildTank();
        expect(tank.takeDamage("rear", 100).locationDestroyed).toBe(true);
        expect(tank.isDestroyed()).toBe(true);
    });

    it("destroying the turret's structure destroys the turret, not the vehicle", () => {
        const tank = buildTank();
        tank.takeDamage("turret", 100);
        expect(tank.getInPlay().criticals.turretDestroyed).toBe(true);
        expect(tank.isDestroyed()).toBe(false);
        expect(tank.getWeaponToHitModifier(laserOf(tank))).toBeNull();
    });

    it("toggles record-sheet pips: marking up to a pip, clicking a marked pip clears back to it", () => {
        const tank = buildTank();
        tank.toggleArmorPip("left", 3);
        expect(tank.getInPlay().armorDamage.left).toBe(4);
        tank.toggleArmorPip("left", 1);
        expect(tank.getInPlay().armorDamage.left).toBe(1);
        tank.toggleArmorPip("left", 0);
        expect(tank.getInPlay().armorDamage.left).toBe(0);
    });

    it("a VTOL crashes when its rotor is destroyed", () => {
        const vtol = buildTank("vtol");
        expect(vtol.isCrashed()).toBe(false);
        vtol.takeDamage("rotor", 100);
        expect(vtol.isCrashed()).toBe(true);
    });
});

describe("Vehicle play mode: motive damage and critical hits", () => {
    it("moderate motive damage costs 1 Cruise MP; heavy halves what is left, rounding up", () => {
        const tank = buildTank();
        tank.setMotiveDamage("moderate", true);
        expect(tank.getEffectiveCruiseMP()).toBe(4);
        expect(tank.getEffectiveFlankMP()).toBe(6);
        tank.setMotiveDamage("heavy", true);
        expect(tank.getEffectiveCruiseMP()).toBe(2);
        tank.setMotiveDamage("immobilized", true);
        expect(tank.getEffectiveCruiseMP()).toBe(0);
        expect(tank.isImmobile()).toBe(true);
    });

    it("an engine hit immobilizes the vehicle", () => {
        const tank = buildTank();
        tank.setCriticalHit("engineHit", true);
        expect(tank.getEffectiveCruiseMP()).toBe(0);
    });

    it("motive damage adds +1/+2/+3 and a driver hit +2 to driving rolls", () => {
        const tank = buildTank();
        tank.setMotiveDamage("minor", true);
        tank.setMotiveDamage("moderate", true);
        tank.setMotiveDamage("heavy", true);
        tank.setCriticalHit("driverHit", true);
        expect(tank.getDrivingModifier()).toBe(8);
    });

    it("sensor hits add +1 each, a commander hit +1, and 4 sensor hits stop the vehicle firing", () => {
        const tank = buildTank();
        const laser = laserOf(tank);
        expect(tank.getWeaponToHitModifier(laser)).toBe(0);
        tank.setSensorHits(2);
        tank.setCriticalHit("commanderHit", true);
        expect(tank.getWeaponToHitModifier(laser)).toBe(3);
        tank.setSensorHits(4);
        expect(tank.getWeaponToHitModifier(laser)).toBeNull();
    });

    it("a stabilizer hit in the weapon's location applies the attacker movement modifier again", () => {
        const tank = buildTank();
        const laser = laserOf(tank);
        tank.setMovement("flank", 7);
        expect(tank.getWeaponToHitModifier(laser)).toBe(2);
        tank.setStabilizerHit("turret", true);
        expect(tank.getWeaponToHitModifier(laser)).toBe(4);
    });

    it("jammed or destroyed weapons cannot fire", () => {
        const tank = buildTank();
        const laser = laserOf(tank);
        tank.setWeaponStatus(laser.uuid || "", "jammed");
        expect(tank.getWeaponToHitModifier(laser)).toBeNull();
        tank.setWeaponStatus(laser.uuid || "", "ok");
        expect(tank.getWeaponToHitModifier(laser)).toBe(0);
    });

    it("target movement modifier uses hexes moved, +1 for jumping and +1 for an airborne VTOL", () => {
        const tank = buildTank();
        tank.setMovement("cruise", 5);
        expect(tank.getTargetMovementModifier()).toBe(2);
        const vtol = buildTank("vtol");
        vtol.setMovement("flank", 12);
        expect(vtol.getTargetMovementModifier()).toBe(5);
    });
});

describe("Vehicle play mode: save and roster", () => {
    it("round-trips in-play state and crew through export/import", () => {
        const tank = buildTank();
        tank.takeDamage("front", 3);
        tank.setMotiveDamage("minor", true);
        tank.setSensorHits(1);
        tank.setStabilizerHit("left", true);
        const pilot = new Pilot();
        pilot.gunnery = 0;
        pilot.piloting = 3;
        tank.setPilot(pilot);
        const copy = new Vehicle(tank.exportJSON());
        expect(copy.getArmorRemaining("front")).toBe(7);
        expect(copy.getInPlay().motiveDamage.minor).toBe(true);
        expect(copy.getInPlay().criticals.sensorHits).toBe(1);
        expect(copy.getInPlay().criticals.stabilizers).toEqual(["left"]);
        expect(copy.getPilot().gunnery).toBe(0);
        expect(copy.getPilot().piloting).toBe(3);
    });

    it("exports without play damage when asked (saved designs)", () => {
        const tank = buildTank();
        tank.takeDamage("front", 3);
        expect(tank.export(true).inPlay).toBeUndefined();
    });

    it("adjusts BV for crew skill with the TM p. 305 table used for 'Mechs (G4/P5 x1.00, G3/P4 x1.38)", () => {
        const tank = buildTank();
        expect(tank.getPilotAdjustedBattleValue()).toBe(tank.getBattleValue());
        const pilot = new Pilot();
        pilot.gunnery = 3;
        pilot.piloting = 4;
        tank.setPilot(pilot);
        expect(tank.getPilotAdjustedBattleValue()).toBe(Math.round(tank.getBattleValue() * 1.38));
    });

    it("groups carry vehicles in totals and in saves; older saves without vehicles still load", () => {
        const group = new BattleMechGroup();
        const tank = buildTank();
        group.vehicles.push(tank);
        expect(group.getTotalUnits()).toBe(1);
        expect(group.getTotalTons()).toBe(50);
        expect(group.getTotaBV2()).toBe(tank.getBattleValue());
        const reloaded = new BattleMechGroup(group.export());
        expect(reloaded.vehicles.length).toBe(1);
        expect(reloaded.vehicles[0].getBattleValue()).toBe(tank.getBattleValue());

        const legacy = new BattleMechGroup({ name: "Old", units: [], uuid: "x", lastUpdated: new Date(), groupLabel: "Lance" });
        expect(legacy.vehicles).toEqual([]);
    });

    it("damaged vehicles mark the group under strength; turn reset clears movement", () => {
        const group = new BattleMechGroup();
        const tank = buildTank();
        group.vehicles.push(tank);
        expect(group.isUnderStrength()).toBe(false);
        tank.takeDamage("front", 1);
        expect(group.isUnderStrength()).toBe(true);
        tank.setMovement("cruise", 3);
        tank.turnReset();
        expect(tank.getInPlay().movementMode).toBe("stationary");
    });
});
