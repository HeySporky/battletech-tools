import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";
import { BattleMechGroup } from "./battlemech-group";
import Pilot from "./pilot";
import { getVehicleCriticalEffect, getVehicleHitLocation, getVehicleMotiveDamageLevel } from "../data/vehicle-hit-tables";

// Play-mode rules from Total Warfare (corrected 2010 PDF), Combat Vehicles pp. 192-199, and the
// TW record sheets' tables.
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

describe("Combat vehicle tables (TW pp. 193-196)", () => {
    it("Ground Combat Vehicle Hit Location Table: criticals on 2/12 (8 from the side), motive rolls on daggers", () => {
        expect(getVehicleHitLocation(2, "front", false)).toEqual({ area: "front", critical: true, motive: false });
        expect(getVehicleHitLocation(5, "front", false)).toEqual({ area: "right", critical: false, motive: true });
        expect(getVehicleHitLocation(9, "rear", false)).toEqual({ area: "right", critical: false, motive: true });
        expect(getVehicleHitLocation(8, "left", false)).toEqual({ area: "side", critical: true, motive: false });
        expect(getVehicleHitLocation(9, "right", false)).toEqual({ area: "rear", critical: false, motive: true });
        expect(getVehicleHitLocation(12, "rear", false)).toEqual({ area: "turret", critical: true, motive: false });
    });

    it("VTOL Combat Vehicle Hit Location Table: rotors on 3, 4, 10, 11 and 12 (critical)", () => {
        for (const roll of [3, 4, 10, 11]) expect(getVehicleHitLocation(roll, "front", true).area).toBe("rotor");
        expect(getVehicleHitLocation(12, "left", true)).toEqual({ area: "rotor", critical: true, motive: false });
        expect(getVehicleHitLocation(9, "front", true).area).toBe("left");
    });

    it("Critical Hits Tables, with the Fuel Tank (fusion) and Ammunition (none aboard) substitutions", () => {
        const ice = { fusionEngine: false, carriesAmmo: true };
        expect(getVehicleCriticalEffect(5, "front", false, ice)).toBe("none");
        expect(getVehicleCriticalEffect(6, "front", false, ice)).toBe("driverHit");
        expect(getVehicleCriticalEffect(12, "turret", false, ice)).toBe("turretBlownOff");
        expect(getVehicleCriticalEffect(12, "side", false, ice)).toBe("fuelTank");
        expect(getVehicleCriticalEffect(12, "side", false, { fusionEngine: true, carriesAmmo: true })).toBe("engineHit");
        expect(getVehicleCriticalEffect(11, "rear", false, { fusionEngine: false, carriesAmmo: false })).toBe("weaponDestroyed");
        expect(getVehicleCriticalEffect(6, "front", true, ice)).toBe("coPilotHit");
        expect(getVehicleCriticalEffect(11, "rotor", true, ice)).toBe("rotorsDestroyed");
    });

    it("Motive System Damage Table bands", () => {
        expect(getVehicleMotiveDamageLevel(5)).toBe("none");
        expect(getVehicleMotiveDamageLevel(7)).toBe("minor");
        expect(getVehicleMotiveDamageLevel(9)).toBe("moderate");
        expect(getVehicleMotiveDamageLevel(11)).toBe("heavy");
        expect(getVehicleMotiveDamageLevel(14)).toBe("immobilized");
    });
});

describe("Vehicle play mode: damage", () => {
    it("takes damage to armor first, then internal structure, which calls for a critical roll (TW p. 193)", () => {
        const tank = buildTank();
        const structure = tank.getStructureAllocation().front;
        const result = tank.takeDamage("front", 12);
        expect(result).toEqual({ armor: 10, structure: 2, locationDestroyed: false, criticalRoll: true });
        expect(tank.getStructureRemaining("front")).toBe(structure - 2);
        expect(tank.isDamaged()).toBe(true);
    });

    it("is destroyed when a body location loses all its structure", () => {
        const tank = buildTank();
        expect(tank.takeDamage("rear", 100).locationDestroyed).toBe(true);
        expect(tank.isDestroyed()).toBe(true);
    });

    it("losing all the turret's structure destroys the vehicle (TW p. 128)", () => {
        const tank = buildTank();
        tank.takeDamage("turret", 100);
        expect(tank.getInPlay().criticals.turretDestroyed).toBe(true);
        expect(tank.isDestroyed()).toBe(true);
    });

    it("toggles record-sheet pips: marking up to a pip, clicking a marked pip clears back to it", () => {
        const tank = buildTank();
        tank.toggleArmorPip("left", 3);
        expect(tank.getInPlay().armorDamage.left).toBe(4);
        tank.toggleArmorPip("left", 1);
        expect(tank.getInPlay().armorDamage.left).toBe(1);
    });

    it("a hit with no turret strikes the side attacked (TW p. 193)", () => {
        const vehicle = buildTank("wheeled");
        vehicle.setHasTurret(false);
        expect(vehicle.resolveHitArea("turret", "left")).toBe("left");
        expect(vehicle.resolveHitArea("turret", "front")).toBe("front");
        expect(vehicle.resolveHitArea("side", "right")).toBe("right");
    });
});

describe("VTOL rotors (TW pp. 196-197)", () => {
    it("rotor hits take 1 point per 10 damage or fraction, and each hit costs 1 Cruising MP", () => {
        const vtol = buildTank("vtol");
        expect(vtol.takeDamage("rotor", 5).armor).toBe(1);
        expect(vtol.getEffectiveCruiseMP()).toBe(7);
        vtol.setLanded(true);
        expect(vtol.isCrashed()).toBe(false);
    });

    it("a destroyed rotor crashes a flying VTOL and makes it immobile, but never destroys it by itself (TW p. 128)", () => {
        const vtol = buildTank("vtol");
        vtol.takeDamage("rotor", 25);
        vtol.takeDamage("rotor", 25);
        expect(vtol.isCrashed()).toBe(true);
        expect(vtol.isImmobile()).toBe(true);
        expect(vtol.isDestroyed()).toBe(false);
    });

    it("Rotor Damage criticals cost 1 more MP; Flight Stabilizer is Cruising only, +3 driving, +1 to-hit", () => {
        const vtol = buildTank("vtol");
        vtol.applyCriticalHit("rotorDamage", "rotor");
        expect(vtol.getEffectiveCruiseMP()).toBe(7);
        vtol.applyCriticalHit("flightStabilizer", "rotor");
        expect(vtol.getEffectiveFlankMP()).toBe(7);
        expect(vtol.getDrivingModifier()).toBe(3);
        expect(vtol.getWeaponToHitModifier(laserOf(vtol))).toBe(1);
    });

    it("a second Co-Pilot or Pilot Hit is Crew Killed", () => {
        const vtol = buildTank("vtol");
        vtol.applyCriticalHit("coPilotHit", "front");
        expect(vtol.getWeaponToHitModifier(laserOf(vtol))).toBe(1);
        vtol.applyCriticalHit("coPilotHit", "front");
        expect(vtol.getInPlay().criticals.crewKilled).toBe(true);
    });

    it("airborne VTOLs get +1 target movement modifier (TW p. 196); landed ones do not", () => {
        const vtol = buildTank("vtol");
        vtol.setMovement("flank", 12);
        expect(vtol.getTargetMovementModifier()).toBe(5);
        vtol.setLanded(true);
        expect(vtol.getTargetMovementModifier()).toBe(4);
    });
});

describe("Motive system damage (TW p. 193)", () => {
    it("adds the attack direction and vehicle type modifiers", () => {
        expect(buildTank("hover").getMotiveDamageRollModifier("left")).toBe(5);
        expect(buildTank("tracked").getMotiveDamageRollModifier("rear")).toBe(1);
        expect(buildTank("wige").getMotiveDamageRollModifier("front")).toBe(4);
    });

    it("movement penalties stack but each driving modifier applies once (max +6)", () => {
        const tank = buildTank();
        expect(tank.rollMotiveDamage(8, "front")).toBe("moderate");
        tank.rollMotiveDamage(9, "front");
        expect(tank.getEffectiveCruiseMP()).toBe(3);
        expect(tank.getDrivingModifier()).toBe(2);
        tank.addMotiveHit("minor");
        tank.addMotiveHit("heavy");
        expect(tank.getEffectiveCruiseMP()).toBe(2);
        expect(tank.getDrivingModifier()).toBe(6);
    });

    it("Cruising MP reduced to 0 stops the vehicle without making it an immobile target; Major damage does", () => {
        const tank = buildTank();
        tank.setCruiseMP(1);
        tank.addMotiveHit("moderate");
        expect(tank.getEffectiveCruiseMP()).toBe(0);
        expect(tank.isImmobile()).toBe(false);
        tank.addMotiveHit("immobilized");
        expect(tank.isImmobile()).toBe(true);
        expect(tank.getTargetMovementModifier()).toBe(-4);
    });

    it("a hover vehicle immobilized over Depth 1+ water sinks", () => {
        const hover = buildTank("hover");
        hover.setOverDeepWater(true);
        hover.addMotiveHit("immobilized");
        expect(hover.isDestroyed()).toBe(true);
    });
});

describe("Ground combat vehicle critical hits (TW pp. 193-195)", () => {
    it("moves down the column when a result does not apply, wrapping back to 6", () => {
        const tank = buildTank();
        // Rear 9 is Weapon Destroyed, but the rear has no weapons: move down to 10, Engine Hit.
        expect(tank.resolveCriticalRoll(9, "rear")).toBe("engineHit");
        tank.applyCriticalHit("engineHit", "rear");
        // Rear 10 (Engine Hit) is spent and 11 (Ammunition) needs ammo: 12 Fuel Tank (ICE).
        expect(tank.resolveCriticalRoll(10, "rear")).toBe("fuelTank");
    });

    it("Commander Hit stuns the crew next turn and adds +1 to-hit and driving", () => {
        const tank = buildTank();
        tank.applyCriticalHit("commanderHit", "front");
        expect(tank.getInPlay().criticals.crewStunned).toBe(false);
        tank.turnReset();
        expect(tank.getCannotFireReason()).toBe("Crew stunned");
        expect(tank.getEffectiveFlankMP()).toBe(tank.getEffectiveCruiseMP());
        tank.turnReset();
        expect(tank.getCannotFireReason()).toBeNull();
        expect(tank.getWeaponToHitModifier(laserOf(tank))).toBe(1);
        expect(tank.getDrivingModifier()).toBe(1);
    });

    it("Crew Stunned after Commander Hit and Driver Hit is Crew Killed", () => {
        const tank = buildTank();
        tank.applyCriticalHit("commanderHit", "front");
        tank.applyCriticalHit("driverHit", "front");
        tank.applyCriticalHit("crewStunned", "left");
        expect(tank.getInPlay().criticals.crewKilled).toBe(true);
        expect(tank.isDestroyed()).toBe(true);
    });

    it("Engine Hit: immobile, turret locked, and Direct-Fire Energy weapons stop working", () => {
        const tank = buildTank();
        tank.applyCriticalHit("engineHit", "rear");
        expect(tank.isImmobile()).toBe(true);
        expect(tank.getInPlay().criticals.turretLocked).toBe(true);
        expect(tank.getWeaponToHitModifier(laserOf(tank))).toBeNull();
    });

    it("sensors add +1 each; the fourth hit stops all fire", () => {
        const tank = buildTank();
        const laser = laserOf(tank);
        tank.applyCriticalHit("sensors", "front");
        tank.applyCriticalHit("sensors", "front");
        expect(tank.getWeaponToHitModifier(laser)).toBe(2);
        tank.setSensorHits(4);
        expect(tank.getWeaponToHitModifier(laser)).toBeNull();
    });

    it("a stabilizer hit doubles the attacker movement modifier for weapons in that location only", () => {
        const tank = buildTank();
        const laser = laserOf(tank);
        tank.setMovement("flank", 7);
        expect(tank.getWeaponToHitModifier(laser)).toBe(2);
        tank.applyCriticalHit("stabilizer", "turret");
        expect(tank.getWeaponToHitModifier(laser)).toBe(4);
        expect(tank.isCriticalApplicable("stabilizer", "turret")).toBe(false);
    });

    it("a second Turret Jam is Turret Locks; Turret Blown Off destroys the vehicle; Fuel Tank explodes it", () => {
        const tank = buildTank();
        tank.applyCriticalHit("turretJam", "turret");
        tank.applyCriticalHit("turretJam", "turret");
        expect(tank.getInPlay().criticals.turretLocked).toBe(true);
        tank.applyCriticalHit("turretBlownOff", "turret");
        expect(tank.isDestroyed()).toBe(true);
        const other = buildTank();
        other.applyCriticalHit("fuelTank", "left");
        expect(other.isDestroyed()).toBe(true);
    });

    it("Weapon Malfunction and Weapon Destroyed take a weapon in the location struck", () => {
        const tank = buildTank();
        const laser = laserOf(tank);
        tank.applyCriticalHit("weaponMalfunction", "turret");
        expect(tank.getWeaponStatus(laser.uuid)).toBe("jammed");
        tank.applyCriticalHit("weaponDestroyed", "turret", laser.uuid);
        expect(tank.getWeaponStatus(laser.uuid)).toBe("destroyed");
    });

    it("an ammunition explosion goes to internal structure, or with CASE to the rear armor and stuns the crew", () => {
        const tank = buildTank();
        tank.applyAmmunitionExplosion("left", 3, false);
        expect(tank.getArmorRemaining("left")).toBe(10);
        expect(tank.getStructureRemaining("left")).toBe(tank.getStructureAllocation().left - 3);
        const cased = buildTank();
        cased.applyAmmunitionExplosion("left", 4, true);
        expect(cased.getArmorRemaining("rear")).toBe(6);
        expect(cased.getInPlay().criticals.crewStunnedTurns).toBe(1);
    });
});

describe("Vehicle play mode: save and roster", () => {
    it("round-trips in-play state and crew through export/import", () => {
        const tank = buildTank();
        tank.takeDamage("front", 3);
        tank.addMotiveHit("minor");
        tank.setSensorHits(1);
        tank.setStabilizerHit("left", true);
        const pilot = new Pilot();
        pilot.gunnery = 0;
        pilot.piloting = 3;
        tank.setPilot(pilot);
        const copy = new Vehicle(tank.exportJSON());
        expect(copy.getArmorRemaining("front")).toBe(7);
        expect(copy.getMotiveHits()).toEqual(["minor"]);
        expect(copy.getInPlay().criticals.sensorHits).toBe(1);
        expect(copy.getInPlay().criticals.stabilizers).toEqual(["left"]);
        expect(copy.getPilot().gunnery).toBe(0);
        expect(copy.getPilot().piloting).toBe(3);
    });

    it("loads motive damage flags from saves made before the tables", () => {
        const saved = JSON.parse(buildTank().exportJSON());
        saved.inPlay.motiveHits = undefined;
        saved.inPlay.motiveDamage = { minor: true, moderate: false, heavy: true, immobilized: false };
        const copy = new Vehicle(JSON.stringify(saved));
        expect(copy.getMotiveHits()).toEqual(["minor", "heavy"]);
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
