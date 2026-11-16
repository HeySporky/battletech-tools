import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";
import { getDualTurretHit, getFacingAfterFallDirection, getSuperheavyVehicleHitLocation } from "../data/vehicle-hit-tables";
import { buildVehicle as build } from "../test-support/builders";

// Combat Vehicle rules from Total Warfare (corrected 2010 PDF): Combat Vehicles pp. 192-199, Firing
// Arcs p. 104, turret rotation p. 99, Facing After a Fall p. 68 and underwater hull breaches p. 121.
const mount = (vehicle: Vehicle, tag: string, location: string) => {
    vehicle.addEquipmentFromTag(tag);
    const item = vehicle.getEquipmentList()[vehicle.getEquipmentList().length - 1];
    vehicle.setEquipmentLocation(item.uuid || "", location);
    return vehicle.getEquipmentList().find((entry) => entry.uuid === item.uuid)!;
};

describe("Ammunition explosions (TW p. 194)", () => {
    it("totals every explosive ammunition bin: Damage Value times shots, missiles times their damage (TW p. 125)", () => {
        const tank = build("tracked");
        mount(tank, "srm-2", "front");
        mount(tank, "ammo-srm-standard", "body");
        mount(tank, "machine-gun", "front");
        mount(tank, "ammo-machine-gun-standard", "body");
        // SRM-2: 50 shots x 2 missiles x 2 = 200 (the TW p. 125 example); machine gun: 200 x 2 = 400.
        expect(tank.getAmmunitionExplosionDamage()).toBe(600);
    });

    it("counts only the shots left in a bin", () => {
        const tank = build("tracked");
        mount(tank, "srm-2", "front");
        const bin = mount(tank, "ammo-srm-standard", "body");
        bin.currentAmmo = 10;
        expect(tank.getAmmunitionExplosionDamage()).toBe(40);
    });

    it("the Ammunition critical applies the total to the location's internal structure and loses all ammunition", () => {
        const tank = build("tracked");
        mount(tank, "machine-gun", "front");
        const bin = mount(tank, "ammo-machine-gun-standard", "body");
        bin.currentAmmo = 1;
        const text = tank.applyCriticalHit("ammunition", "left");
        expect(text).toContain("2 damage");
        expect(tank.getStructureRemaining("left")).toBe(tank.getStructureAllocation().left - 2);
        expect(tank.getArmorRemaining("left")).toBe(10);
        expect(tank.carriesAmmo()).toBe(false);
        // Internal structure damage calls for a critical hit roll (TW p. 193).
        expect(tank.takeFollowUpRolls()).toEqual([{ kind: "critical", location: "left" }]);
    });

    it("with CASE the damage goes to the rear armor (excess ignored) and the crew is stunned", () => {
        const tank = build("tracked");
        mount(tank, "machine-gun", "front");
        mount(tank, "ammo-machine-gun-standard", "body");
        mount(tank, "case", "body");
        expect(tank.hasCASE()).toBe(true);
        tank.applyCriticalHit("ammunition", "left");
        expect(tank.getArmorRemaining("rear")).toBe(0);
        expect(tank.getStructureRemaining("rear")).toBe(tank.getStructureAllocation().rear);
        expect(tank.getStructureRemaining("left")).toBe(tank.getStructureAllocation().left);
        expect(tank.getInPlay().criticals.crewStunnedTurns).toBe(1);
        expect(tank.isDestroyed()).toBe(false);
    });

    it("destroys the vehicle in the editions before Total Warfare; with CASE the rear armor blows out and the crew survive (CT p.30)", () => {
        // These editions are not yet selectable for a vehicle, so the edition is set directly.
        const tank = build("tracked");
        mount(tank, "machine-gun", "front");
        mount(tank, "ammo-machine-gun-standard", "body");
        (tank as any)._rulesEdition = "citytech";
        expect(tank.applyCriticalHit("ammunition", "left")).toContain("the vehicle explodes (CT p.30)");
        expect(tank.isDestroyed()).toBe(true);
        expect(tank.getDestroyedReason()).toBe("ammunition exploded");

        const cased = build("tracked");
        mount(cased, "machine-gun", "front");
        mount(cased, "ammo-machine-gun-standard", "body");
        mount(cased, "case", "body");
        (cased as any)._rulesEdition = "master-rules";
        expect(cased.applyCriticalHit("ammunition", "left")).toContain("CASE blows out the rear armor and the crew survive (BMR p.126)");
        expect(cased.getArmorRemaining("rear")).toBe(0);
        expect(cased.isDestroyed()).toBe(true);
    });

    it("a Clan chassis has CASE built in; an Inner Sphere one only with CASE mounted (TM p.210)", () => {
        const tank = build("tracked");
        expect(tank.hasCASE()).toBe(false);
        tank.setTech("clan");
        expect(tank.hasCASE()).toBe(true);
        tank.setTech("mclan");
        expect(tank.hasCASE()).toBe(true);
        tank.setTech("mis");
        expect(tank.hasCASE()).toBe(false);
    });
});

describe("Firing arcs and turrets (TW pp. 99, 104, 192)", () => {
    it("body weapons fire into the 'Mech arc of their location; turret weapons into a rotatable forward arc", () => {
        const tank = build("tracked");
        expect(tank.getWeaponFiringArc(mount(tank, "medium-laser", "front"))).toEqual({ arc: "front", turretRotation: null });
        expect(tank.getWeaponFiringArc(mount(tank, "medium-laser", "left"))).toEqual({ arc: "left", turretRotation: null });
        expect(tank.getWeaponFiringArc(mount(tank, "medium-laser", "rear"))).toEqual({ arc: "rear", turretRotation: null });
        const turretLaser = mount(tank, "medium-laser", "turret");
        expect(tank.getWeaponFiringArc(turretLaser)).toEqual({ arc: "front", turretRotation: 0 });
        expect(tank.setTurretFacing("turret", 2)).toBe(true);
        expect(tank.getWeaponFiringArc(turretLaser)).toEqual({ arc: "front", turretRotation: 2 });
        expect(tank.describeFiringArc(tank.getWeaponFiringArc(turretLaser))).toBe("Turret, 2 hexsides right");
        expect(tank.setTurretFacing("turret", -1)).toBe(true);
        expect(tank.describeFiringArc(tank.getWeaponFiringArc(turretLaser))).toBe("Turret, 1 hexside left");
    });

    it("the turret returns forward in the End Phase unless it is jammed or locked", () => {
        const tank = build("tracked");
        tank.setTurretFacing("turret", 3);
        tank.turnReset();
        expect(tank.getTurretFacing("turret")).toBe(0);
        tank.setTurretFacing("turret", 3);
        tank.applyCriticalHit("turretJam", "turret");
        tank.turnReset();
        expect(tank.getTurretFacing("turret")).toBe(3);
        expect(tank.canRotateTurret("turret")).toBe(false);
        expect(tank.setTurretFacing("turret", 1)).toBe(false);
    });

    it("a turret cannot rotate after Turret Locks or an Engine Hit", () => {
        const locked = build("tracked");
        locked.applyCriticalHit("turretLocks", "turret");
        expect(locked.canRotateTurret("turret")).toBe(false);
        const engine = build("tracked");
        engine.applyCriticalHit("engineHit", "rear");
        expect(engine.canRotateTurret("turret")).toBe(false);
    });
});

describe("Naval hull integrity (TW pp. 121, 198)", () => {
    it("surface vessels roll for front, side and rear hits: 10+ from underwater attackers, otherwise only 12; never for the turret", () => {
        const ship = build("naval-surface");
        expect(ship.getHullBreachTarget("front", false)).toBe(12);
        expect(ship.getHullBreachTarget("left", true)).toBe(10);
        expect(ship.getHullBreachTarget("turret", true)).toBeNull();
        expect(build("hydrofoil").getHullBreachTarget("rear", false)).toBe(12);
        expect(build("tracked").getHullBreachTarget("front", true)).toBeNull();
    });

    it("submerged submarines roll 10+ for any location; surfaced ones do not roll", () => {
        const sub = build("naval-sub");
        expect(sub.getHullBreachTarget("turret", false)).toBe(10);
        sub.setSurfaced(true);
        expect(sub.getHullBreachTarget("front", false)).toBeNull();
    });

    it("damage calls for a Hull Integrity roll; a breached location's weapons stop working", () => {
        const ship = build("naval-surface");
        const gun = mount(ship, "medium-laser", "front");
        ship.resolveAttack(7, "front", 2);
        expect(ship.takeFollowUpRolls()).toEqual([{ kind: "hullBreach", location: "front", target: 12 }]);
        expect(ship.resolveFollowUpRoll({ kind: "hullBreach", location: "front", target: 12 }, 11)).toContain("holds");
        expect(ship.isBreached("front")).toBe(false);
        ship.resolveFollowUpRoll({ kind: "hullBreach", location: "front", target: 12 }, 12);
        expect(ship.isBreached("front")).toBe(true);
        expect(ship.getWeaponToHitModifier(gun)).toBeNull();
    });

    it("a location whose armor is gone is breached automatically", () => {
        const ship = build("naval-surface");
        ship.resolveAttack(7, "front", 10);
        expect(ship.isBreached("front")).toBe(true);
        expect(ship.takeFollowUpRolls().some((roll) => roll.kind === "hullBreach")).toBe(false);
    });
});

describe("VTOL crashes (TW pp. 68, 197-198)", () => {
    it("Facing After a Fall: 1 front, 2-3 right side, 4 rear, 5-6 left side (TW p. 68)", () => {
        expect([1, 2, 3, 4, 5, 6].map(getFacingAfterFallDirection)).toEqual(["front", "right", "right", "rear", "left", "left"]);
    });

    it("falling damage is 1 point per 10 tons (round up) times elevation fallen + 1", () => {
        const vtol = build("vtol", 25);
        vtol.setElevation(3);
        expect(vtol.getFallDamage()).toBe(12);
    });

    it("Rotors Destroyed in flight crashes the VTOL: facing roll, then 5-point groupings on the VTOL table", () => {
        const vtol = build("vtol", 20);
        vtol.setElevation(2);
        vtol.applyCriticalHit("rotorsDestroyed", "rotor");
        expect(vtol.isCrashed()).toBe(true);
        expect(vtol.takeFollowUpRolls()).toEqual([{ kind: "crashFacing", damage: 6 }]);
        vtol.resolveFollowUpRoll({ kind: "crashFacing", damage: 6 }, 4);
        expect(vtol.takeFollowUpRolls()).toEqual([
            { kind: "crashHit", damage: 5, direction: "rear", fall: true },
            { kind: "crashHit", damage: 1, direction: "rear", fall: true },
        ]);
    });

    it("rotor results are re-rolled; crash damage reaching internal structure makes the VTOL explode", () => {
        const vtol = build("vtol", 20);
        expect(vtol.resolveFollowUpRoll({ kind: "crashHit", damage: 5, direction: "rear", fall: true }, 3)).toContain("re-roll");
        expect(vtol.takeFollowUpRolls()).toEqual([{ kind: "crashHit", damage: 5, direction: "rear", fall: true }]);
        vtol.resolveFollowUpRoll({ kind: "crashHit", damage: 5, direction: "rear", fall: true }, 7);
        expect(vtol.getArmorRemaining("rear")).toBe(5);
        expect(vtol.isDestroyed()).toBe(false);
        vtol.resolveFollowUpRoll({ kind: "crashHit", damage: 6, direction: "rear", fall: true }, 7);
        expect(vtol.isDestroyed()).toBe(true);
        expect(vtol.getDestroyedReason()).toBe("exploded");
    });

    it("a VTOL crashing into water is destroyed", () => {
        const vtol = build("vtol", 20);
        vtol.setOverDeepWater(true);
        vtol.applyCriticalHit("rotorsDestroyed", "rotor");
        expect(vtol.isDestroyed()).toBe(true);
        expect(vtol.takeFollowUpRolls()).toEqual([]);
    });

    it("a landed VTOL whose rotor is destroyed does not crash", () => {
        const vtol = build("vtol", 20);
        vtol.setLanded(true);
        vtol.applyCriticalHit("rotorsDestroyed", "rotor");
        expect(vtol.takeFollowUpRolls()).toEqual([]);
        expect(vtol.isImmobile()).toBe(true);
    });

    it("Engine Damage in flight: a Driving Skill Roll at +4 over clear, paved, rough or building hexes lands it", () => {
        const vtol = build("vtol", 20);
        vtol.applyCriticalHit("engineHit", "rear");
        const [roll] = vtol.takeFollowUpRolls();
        expect(roll).toEqual({ kind: "drivingSkill", reason: "engineDamage", target: 9 });
        vtol.resolveFollowUpRoll(roll, 9);
        expect(vtol.getInPlay().landed).toBe(true);
        expect(vtol.isCrashed()).toBe(false);
        expect(vtol.isImmobile()).toBe(true);
    });

    it("a failed landing roll crashes the VTOL; over other terrain it crashes automatically", () => {
        const failed = build("vtol", 20);
        failed.applyCriticalHit("engineHit", "rear");
        failed.resolveFollowUpRoll(failed.takeFollowUpRolls()[0], 8);
        expect(failed.isCrashed()).toBe(true);
        expect(failed.takeFollowUpRolls()[0].kind).toBe("crashFacing");
        const woods = build("vtol", 20);
        woods.setOverLandableTerrain(false);
        woods.applyCriticalHit("engineHit", "rear");
        expect(woods.isCrashed()).toBe(true);
        expect(woods.takeFollowUpRolls()[0].kind).toBe("crashFacing");
    });

    it("Pilot Hit: a failed Driving Skill Roll drops the VTOL one elevation", () => {
        const vtol = build("vtol", 20);
        vtol.setElevation(3);
        vtol.applyCriticalHit("pilotHit", "front");
        const [roll] = vtol.takeFollowUpRolls();
        // Piloting 5 + Pilot Hit +2.
        expect(roll).toEqual({ kind: "drivingSkill", reason: "pilotHit", target: 7 });
        vtol.resolveFollowUpRoll(roll, 6);
        expect(vtol.getInPlay().elevation).toBe(2);
    });

    it("a sideslip crash does hexes moved x tonnage / 10 in 5-point groupings on the side that hit (TW p. 68)", () => {
        const vtol = build("vtol", 20);
        vtol.setMovement("flank", 6);
        vtol.startSideslipCrash("left");
        expect(vtol.takeFollowUpRolls()).toEqual([
            { kind: "crashHit", damage: 5, direction: "left", fall: false },
            { kind: "crashHit", damage: 5, direction: "left", fall: false },
            { kind: "crashHit", damage: 2, direction: "left", fall: false },
        ]);
        expect(vtol.getInPlay().landed).toBe(true);
    });
});

describe("WiGE vehicles (TW p. 199)", () => {
    it("Engine damage in flight calls for an unmodified Driving Skill Roll to land", () => {
        const wige = build("wige");
        wige.applyCriticalHit("engineHit", "rear");
        expect(wige.takeFollowUpRolls()).toEqual([{ kind: "drivingSkill", reason: "engineDamage", target: 5 }]);
    });

    it("must land when damage leaves it unable to enter five hexes a turn", () => {
        const wige = build("wige");
        wige.setCruiseMP(3);
        expect(wige.mustLand()).toBe(false);
        wige.addMotiveHit("moderate");
        expect(wige.mustLand()).toBe(true);
        wige.setLanded(true);
        expect(wige.mustLand()).toBe(false);
    });
});

describe("Super-Heavy vehicles (Tactical Operations)", () => {
    it("Super-Heavy Vehicle Hit Location Table: front, rear, front side and rear side columns", () => {
        expect(getSuperheavyVehicleHitLocation(3, "front")).toEqual({ area: "right", critical: false, motive: true });
        expect(getSuperheavyVehicleHitLocation(3, "rearRight")).toEqual({ area: "rear", critical: false, motive: true });
        expect(getSuperheavyVehicleHitLocation(8, "frontLeft")).toEqual({ area: "side", critical: true, motive: false });
        expect(getSuperheavyVehicleHitLocation(5, "front")).toEqual({ area: "front", critical: false, motive: true });
        expect(getSuperheavyVehicleHitLocation(12, "rear")).toEqual({ area: "turret", critical: true, motive: false });
    });

    it("side results strike the split side attacked; Right/Left Side results the half nearest the attack", () => {
        const tank = build("tracked", 150);
        tank.setHasTurret(false);
        expect(tank.resolveAttack(6, "rearLeft", 1)[0]).toContain("Rear Left");
        expect(tank.resolveAttack(3, "front", 1)[0]).toContain("Front Right");
        expect(tank.resolveAttack(3, "rear", 1)[0]).toContain("Rear Left");
        // No turret: a Turret result strikes the side attacked.
        expect(tank.resolveAttack(10, "frontRight", 1)[0]).toContain("Front Right");
        tank.takeFollowUpRolls();
        tank.resolveAttack(8, "rearRight", 1);
        expect(tank.takeFollowUpRolls()).toEqual([{ kind: "critical", location: "rearRight" }]);
    });

    it("Super-Heavy VTOLs have six facings plus the rotor (TO p. 378)", () => {
        const vtol = build("vtol", 50);
        expect(vtol.isSuperheavy()).toBe(true);
        expect(vtol.getLocations().map((loc) => loc.tag)).toEqual(["front", "frontLeft", "frontRight", "rearLeft", "rearRight", "rear", "rotor"]);
    });
});

describe("Vehicular Dual Turret (TO p. 347)", () => {
    it("1D6, -2 through the front arc, +2 through the rear: 3 or less hits the forward turret", () => {
        expect(getDualTurretHit(5, "front")).toBe("turret2");
        expect(getDualTurretHit(6, "front")).toBe("turret");
        expect(getDualTurretHit(1, "rear")).toBe("turret2");
        expect(getDualTurretHit(2, "rear")).toBe("turret");
        expect(getDualTurretHit(3, "left")).toBe("turret2");
        expect(getDualTurretHit(4, "left")).toBe("turret");
    });

    it("attacks roll for the turret struck; the forward turret cannot turn to fire through the rear hexside", () => {
        const tank = build("tracked", 60);
        tank.setDualTurret(true);
        expect(tank.resolveAttack(10, "front", 1, { turretRoll: 6 })[0]).toContain("Rear Turret");
        expect(tank.resolveAttack(10, "front", 1, { turretRoll: 5 })[0]).toContain("Front Turret");
        expect(tank.setTurretFacing("turret2", 3)).toBe(false);
        expect(tank.setTurretFacing("turret", 3)).toBe(true);
    });
});

describe("Attack resolution in the model", () => {
    it("resolveAttack applies the hit and queues motive and critical rolls", () => {
        const tank = build("tracked");
        const log = tank.resolveAttack(5, "front", 1);
        expect(log[0]).toContain("Right");
        expect(tank.takeFollowUpRolls()).toEqual([{ kind: "motive", direction: "front" }]);
        tank.resolveAttack(2, "front", 1);
        expect(tank.takeFollowUpRolls()).toEqual([{ kind: "critical", location: "front" }]);
    });

    it("new play state survives export/import", () => {
        const sub = build("naval-sub");
        sub.setSurfaced(true);
        sub.setTurretFacing("turret", 2);
        sub.resolveFollowUpRoll({ kind: "hullBreach", location: "left", target: 10 }, 10);
        const copy = new Vehicle(sub.exportJSON());
        expect(copy.getInPlay().surfaced).toBe(true);
        expect(copy.getTurretFacing("turret")).toBe(2);
        expect(copy.isBreached("left")).toBe(true);
    });
});

describe("Combat Vehicle Battle Value (TM pp.315-317)", () => {
    const plainLog = (vehicle: Vehicle) => vehicle.getBattleValueLog().replace(/<[^>]+>/g, "");
    const defensiveFactor = (vehicle: Vehicle) => /Defensive Factor: [^=]*= ([\d.]+)/.exec(plainLog(vehicle))?.[1];
    const speedMP = (vehicle: Vehicle) => /Speed Factor [\d.]+ \(MP (\d+)\)/.exec(plainLog(vehicle))?.[1];

    // TM p.316: the highest potential target modifier, with the maximum effects of stealth armor (+2 at long range).
    it("adds stealth armor's +2 to the target modifier for the Defensive Factor (Bolla Stealth Tank)", () => {
        const tank = build("wheeled");
        expect(defensiveFactor(tank)).toBe("1.30");
        mount(tank, "ecm-suite", "body");
        tank.setArmorType("vehicular-stealth");
        expect(tank.getArmorType().tag).toBe("vehicular-stealth");
        expect(defensiveFactor(tank)).toBe("1.50");
    });

    // TO:AUE pp.162, 194: the boosted speed, twice Cruising MP, gives the Speed and Defensive Factors.
    it("rates a VTOL with a jet booster at twice its Cruising MP (Kestrel VTOL Scout)", () => {
        const vtol = build("vtol");
        expect(speedMP(vtol)).toBe("12");
        mount(vtol, "vtol-jet-booster", "body");
        expect(speedMP(vtol)).toBe("16");
    });

    // TM p.317: weapons, ammunition and equipment; industrial tools and grenade launchers carry their own BV.
    it("counts offensive equipment: a backhoe and a vehicular grenade launcher (Engineering Vehicle)", () => {
        const tank = build("tracked");
        const before = tank.getBattleValue();
        mount(tank, "backhoe", "turret");
        mount(tank, "vehicular-grenade-launcher", "front");
        expect(plainLog(tank)).toContain("Backhoe");
        // 8 + 15 BV at Speed Factor 1.37 (Flank MP 8).
        expect(Math.abs(tank.getBattleValue() - before - 23 * 1.37)).toBeLessThan(1);
    });

    // TM p.228: 0.67 x the BV of the (up to four) machine guns linked in its location.
    it("rates a machine gun array at 0.67 of its linked machine guns (Magi Infantry Support Vehicle)", () => {
        const tank = build("tracked");
        for (let gun = 0; gun < 4; gun++) mount(tank, "machine-gun", "front");
        mount(tank, "is-machine-gun-array", "front");
        expect(plainLog(tank)).toContain("Machine Gun Array (front) = 13.40");
    });

    // TO:AUE p.157: a Supercharger boosts Flanking MP to twice Cruising MP, which counts for BV.
    it("rates a supercharged vehicle at twice its Cruising MP (Hanse MBT)", () => {
        const tank = build("tracked");
        tank.setCruiseMP(4);
        expect(speedMP(tank)).toBe("6");
        mount(tank, "supercharger", "body");
        expect(speedMP(tank)).toBe("8");
    });

    // TO:AUE p.194: each item in a VTOL Mast Mount (the Rotor location) costs 10 BV more.
    it("adds 10 BV to each item in a mast mount (Donar Assault Helicopter)", () => {
        const vtol = build("vtol");
        vtol.setTech("clan");
        mount(vtol, "vtol-mast-mount", "rotor");
        mount(vtol, "clan-active-probe", "rotor");
        expect(vtol.getEquipmentList().map((item) => `${item.tag}@${item.location}`)).toEqual(["vtol-mast-mount@rotor", "clan-active-probe@rotor"]);
        expect(plainLog(vtol)).toContain("Defensive Equipment: Clan Active Probe = 22");
    });

    // TM p.101: a Tracked or Wheeled vehicle's hitch weighs nothing, takes 1 item slot and sits front or rear.
    it("mounts a trailer hitch front or rear on a tracked or wheeled vehicle (J-27 Ordnance Transport)", () => {
        const tank = build("tracked");
        const offered = (vehicle: Vehicle) => vehicle.getAvailableEquipment().some((item) => item.tag === "trailer-hitch");
        expect(offered(tank)).toBe(true);
        expect(offered(build("hover"))).toBe(false);
        const hitch = mount(tank, "trailer-hitch", "rear");
        expect([hitch.location, hitch.weight, hitch.cbills, hitch.criticals ?? hitch.space.combatVehicle]).toEqual(["rear", 0, 0, 1]);
        tank.setEquipmentLocation(hitch.uuid ?? "", "turret");
        expect(tank.getEquipmentList()[0].location).toBe("rear");
    });

    // TM p.317: an unmotorized trailer finds its Speed Factor as if its Flanking MP were 1 (Gun Trailer, MUL BV 137).
    it("counts an unmotorized trailer's Flanking MP as 1 for the Speed Factor", () => {
        const trailer = build("tracked", 10);
        trailer.setCruiseMP(0);
        expect(trailer.getCruiseMP()).toBe(0);
        expect(speedMP(trailer)).toBe("1");
    });

    // TO:AUE p.162: only a Mast Mount opens the rotor, and it takes no weapons, TAG or C3 masters.
    it("keeps the rotor for a mast mount and the equipment it may hold", () => {
        const vtol = build("vtol");
        vtol.setTech("clan");
        mount(vtol, "clan-active-probe", "rotor");
        expect(vtol.getEquipmentList()[0].location).toBeUndefined();
        mount(vtol, "vtol-mast-mount", "rotor");
        vtol.setEquipmentLocation(vtol.getEquipmentList()[0].uuid ?? "", "rotor");
        expect(vtol.getEquipmentList()[0].location).toBe("rotor");
        mount(vtol, "clan-tag", "rotor");
        mount(vtol, "er-medium-laser-clan", "rotor");
        expect(vtol.getEquipmentList().slice(2).map((item) => item.location)).toEqual([undefined, undefined]);
        vtol.removeEquipment(vtol.getEquipmentList()[1].uuid ?? "");
        expect(vtol.getEquipmentList()[0].location).toBeUndefined();
    });

    // TO:AUE p.193: weapons x 0.8 (not their ammunition), the final BV x 0.95.
    it("takes 0.8 of a drone's weapon BV and 0.95 of its total (Zephyr Hovertank (Omnidrone))", () => {
        const tank = build("hover");
        mount(tank, "medium-laser", "turret");
        mount(tank, "drone-operating-system", "body");
        expect(plainLog(tank)).toContain("Medium Laser (turret) = 36.80");
        expect(plainLog(tank)).toMatch(/x 0\.95 \(Drone Operating System/);
    });
});
