// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Vehicle, { MAX_MOTIVE_HITS, MAX_VEHICLE_EQUIPMENT, normalizeVehicleExport } from "./vehicle";
import { BattleMechGroup } from "./battlemech-group";
import { getDamageGroupings } from "../data/vehicle-hit-tables";
import SanitizedHTML from "../ui/components/sanitized-html";

// Saved vehicles come back from backups other people send. Import must not let that data run script, crash
// the roster on every visit, or hang the tab (OWASP review of branch VehicleCombat, 2026-09-29: X1-X3).
afterEach(cleanup);

const saveWithLaser = (motive: string = "tracked"): Record<string, unknown> => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType(motive);
    vehicle.addEquipmentFromTag("medium-laser");
    const laser = vehicle.getEquipmentList()[vehicle.getEquipmentList().length - 1];
    vehicle.setEquipmentLocation(laser.uuid || "", "front");
    return JSON.parse(vehicle.exportJSON());
};

const MARKUP = "<img src=x onerror=\"window.__owasp=1\">";

describe("Imported vehicles cannot inject markup into the calculation logs (X1, CWE-79)", () => {
    it("drops an equipment location that is not one of the vehicle's locations", () => {
        const save = saveWithLaser();
        (save.equipment as { tag: string; location?: string }[]).forEach((item) => { item.location = MARKUP; });
        const vehicle = new Vehicle(JSON.stringify(save));
        expect(vehicle.getEquipmentList().every((item) => !item.location)).toBe(true);
        const { container } = render(<SanitizedHTML raw={true} html={vehicle.getBattleValueLog()} />);
        expect(container.querySelector("img")).toBeNull();
    });

    it("keeps valid locations", () => {
        const vehicle = new Vehicle(JSON.stringify(saveWithLaser()));
        expect(vehicle.getEquipmentList().some((item) => item.location === "front")).toBe(true);
    });

    it("ignores non-numeric tonnage and never writes it into the cost log", () => {
        const save = saveWithLaser();
        save.tonnage = MARKUP;
        const vehicle = new Vehicle(JSON.stringify(save));
        expect(vehicle.getTonnage()).toBe(20);
        const { container } = render(<SanitizedHTML raw={true} html={vehicle.getCBillCostLog()} />);
        expect(container.querySelector("img")).toBeNull();
    });
});

describe("Imported play state is normalized (X2, CWE-20)", () => {
    it("malformed arrays and objects fall back to defaults instead of throwing later", () => {
        const save = saveWithLaser("hover");
        save.inPlay = {
            overDeepWater: true, motiveHits: {}, turretFacing: null, breachedLocations: "front",
            jammedWeapons: 7, destroyedWeapons: null, armorDamage: null, structureDamage: "x",
            criticals: { stabilizers: "front", sensorHits: "9", crewKilled: "yes" },
            crashDestroyed: "maybe", movementMode: "warp",
        };
        const group = new BattleMechGroup({ uuid: "g", name: "g", units: [], vehicles: [save] } as never);
        const vehicle = group.vehicles[0];
        expect(() => vehicle.isDestroyed()).not.toThrow();
        expect(vehicle.isDestroyed()).toBe(false);
        expect(vehicle.getTurretFacing("turret")).toBe(0);
        expect(vehicle.isBreached("front")).toBe(false);
        expect(vehicle.getInPlay().motiveHits).toEqual([]);
        expect(vehicle.getInPlay().criticals.stabilizers).toEqual([]);
        expect(vehicle.getInPlay().criticals.sensorHits).toBe(0);
        expect(vehicle.getInPlay().movementMode).toBe("stationary");
        expect(vehicle.getWeaponToHitModifier(vehicle.getEquipmentList()[0])).toBe(0);
    });

    it("keeps well-formed play state and filters unknown entries", () => {
        const save = saveWithLaser();
        save.inPlay = {
            motiveHits: ["minor", "bogus"], breachedLocations: ["front", "nowhere"], turretFacing: { turret: 2, turret9: 1 },
            armorDamage: { front: 3, nowhere: 9 }, crashDestroyed: "water", elevation: 2,
        };
        const vehicle = new Vehicle(JSON.stringify(save));
        const inPlay = vehicle.getInPlay();
        expect(inPlay.motiveHits).toEqual(["minor"]);
        expect(inPlay.breachedLocations).toEqual(["front"]);
        expect(inPlay.turretFacing).toEqual({ turret: 2 });
        expect(inPlay.armorDamage).toEqual({ front: 3 });
        expect(inPlay.crashDestroyed).toBe("water");
        expect(inPlay.elevation).toBe(2);
    });
});

describe("Imported numbers cannot hang the tab (X3, CWE-834)", () => {
    it("damage groupings reject non-finite damage and are capped", () => {
        expect(getDamageGroupings(12)).toEqual([5, 5, 2]);
        expect(getDamageGroupings(Infinity)).toEqual([]);
        expect(getDamageGroupings(Number.NaN)).toEqual([]);
        expect(getDamageGroupings(10_000_000).length).toBeLessThanOrEqual(1000);
    });

    it("imported elevation and hexes moved are clamped to finite bounds", () => {
        const save = saveWithLaser("vtol");
        save.inPlay = { elevation: 1e308, hexesMoved: 1e308 };
        const vehicle = new Vehicle(JSON.stringify(save));
        expect(Number.isFinite(vehicle.getFallDamage())).toBe(true);
        expect(vehicle.getInPlay().hexesMoved).toBeLessThanOrEqual(100);
    });
});

// Second review pass (2026-09-29): the rest of the saved vehicle is validated too.
describe("Imported vehicle fields are validated (second pass)", () => {
    it("ignores a non-array equipment list, skips null entries and caps its length", () => {
        const notArray = saveWithLaser();
        notArray.equipment = { tag: "medium-laser" };
        expect(new Vehicle(JSON.stringify(notArray)).getEquipmentList()).toEqual([]);

        const withNull = saveWithLaser();
        (withNull.equipment as unknown[]).unshift(null);
        const vehicle = new Vehicle(JSON.stringify(withNull));
        expect(vehicle.getEquipmentList()).toHaveLength(1);
        expect(vehicle.getImportIssues().length).toBeGreaterThan(0);

        const huge = saveWithLaser();
        huge.equipment = Array.from({ length: 5000 }, () => ({ tag: "machine-gun" }));
        const started = Date.now();
        const capped = new Vehicle(JSON.stringify(huge));
        expect(capped.getEquipmentList().length).toBeLessThanOrEqual(MAX_VEHICLE_EQUIPMENT);
        expect(Date.now() - started).toBeLessThan(10000);
    });

    it("gives duplicate equipment ids fresh ones", () => {
        const save = saveWithLaser();
        const equipment = save.equipment as { uuid?: string }[];
        equipment.push({ ...equipment[0] });
        const vehicle = new Vehicle(JSON.stringify(save));
        const ids = vehicle.getEquipmentList().map((item) => item.uuid);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("coerces names, turret flag, structure type, jump MP, sponsons and armor to valid values", () => {
        const save = saveWithLaser();
        Object.assign(save, {
            uuid: 7, name: { x: 1 }, model: 42, nickname: ["a"], hasTurret: "yes", structureType: "constructor",
            cruiseMP: 4, jumpMP: 9, sponsonTurrets: true, armorAllocation: { front: 7.6, rotor: 50 },
        });
        const vehicle = new Vehicle(JSON.stringify(save));
        expect(typeof vehicle.getUUID()).toBe("string");
        expect(vehicle.getName()).toBe("");
        expect(vehicle.getModel()).toBe("");
        expect(vehicle.hasTurret()).toBe(true);
        expect(Number.isFinite(vehicle.getStructureWeight())).toBe(true);
        expect(vehicle.getJumpMP()).toBeLessThanOrEqual(4);
        expect(vehicle.hasSponsonTurrets() && vehicle.getJumpMP() > 0).toBe(false);
        expect(vehicle.getArmorAllocation().front).toBe(7);
    });

    it("normalizes the crew", () => {
        const save = saveWithLaser();
        save.pilot = { name: { evil: true }, gunnery: Infinity, piloting: -3, alphaStrikeAbilities: "all" };
        const pilot = new Vehicle(JSON.stringify(save)).getPilot();
        expect(pilot.name).toBe("");
        expect(pilot.gunnery).toBe(4);
        expect(pilot.piloting).toBe(0);
        expect(pilot.alphaStrikeAbilities).toEqual([]);
    });

    it("restores ammunition counts even when the bin is saved before its weapon", () => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag("ammo-machine-gun-standard");
        vehicle.addEquipmentFromTag("machine-gun");
        vehicle.getEquipmentList()[0].currentAmmo = 37;
        const copy = new Vehicle(vehicle.exportJSON());
        expect(copy.getEquipmentList().find((item) => item.isAmmo)?.currentAmmo).toBe(37);
    });

    it("keeps play state consistent with the rules the setters enforce", () => {
        const save = saveWithLaser();
        save.dualTurret = true;
        save.inPlay = { turretFacing: { turret2: 3, turret: 3 }, criticals: { engineHit: true }, motiveHits: Array(500).fill("minor") };
        const vehicle = new Vehicle(JSON.stringify(save));
        expect(vehicle.getInPlay().turretFacing).toEqual({ turret: 3 });
        expect(vehicle.getInPlay().criticals.turretLocked).toBe(true);
        expect(vehicle.getInPlay().motiveHits.length).toBeLessThanOrEqual(MAX_MOTIVE_HITS);
    });

    it("normalizeVehicleExport cleans a raw saved design and reports what it changed", () => {
        const { vehicle, issues } = normalizeVehicleExport({ name: 5, tonnage: "x", equipment: [null] });
        expect(vehicle?.name).toBe("");
        expect(vehicle?.tonnage).toBe(20);
        expect(issues.length).toBeGreaterThan(0);
        expect(normalizeVehicleExport(null).issues.length).toBeGreaterThan(0);
    });
});

describe("Imported entries stay independent (second pass: N4, N5)", () => {
    it("gives each mounted item its own nested data", () => {
        const save = saveWithLaser();
        (save.equipment as unknown[]).push({ tag: "medium-laser" });
        const vehicle = new Vehicle(JSON.stringify(save));
        const [first, second] = vehicle.getEquipmentList();
        expect(first.range).not.toBe(second.range);
        expect(first.alphaStrike).not.toBe(second.alphaStrike);
    });

    it("drops saved-vehicle and group entries that are not objects instead of making blank vehicles", () => {
        expect(normalizeVehicleExport("junk").vehicle).toBeNull();
        const group = new BattleMechGroup({ uuid: "g", name: "g", units: [], vehicles: [null, 7, "x", saveWithLaser()] } as never);
        expect(group.vehicles).toHaveLength(1);
    });
});
