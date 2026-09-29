// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Vehicle from "./vehicle";
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
