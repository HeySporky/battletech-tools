import { describe, expect, it } from "vitest";
import Vehicle from "../classes/vehicle";
import { getCompatibleAmmo, getEquipmentCatalogDefinitions, getEquipmentRulesLevel, getWeaponShotsPerTon } from "./equipment-registry";
import { ammoCustom } from "./ammo-custom";
import { miscCustom } from "./misc-custom";

const find = (tag: string) => {
    const found = miscCustom.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};

describe("Future Wars #32 smoke devices (Custom Homebrew)", () => {
    it("registers both catalogs as custom, under misc and ammunition", () => {
        const defs = getEquipmentCatalogDefinitions();
        expect(defs.find((d) => d.id === "misc-custom")).toMatchObject({ custom: true, category: "misc" });
        expect(defs.find((d) => d.id === "ammo-custom")).toMatchObject({ custom: true, category: "ammunition" });
    });

    it("Smoker: half a ton, 3 heat, fed by its fuel at 50 hexes of smoke to the ton", () => {
        const smoker = find("custom-smoker");
        const fuel = ammoCustom.find((item) => item.tag === "ammo-custom-smoker-fuel")!;
        expect(smoker.weight).toBe(0.5);
        expect(smoker.heat).toBe(3);
        expect(smoker.space.combatVehicle).toBe(1);
        // Future Wars #32 prints no 'Mech slot count; the Vehicle Flamer analog gives 1 (user ruling 2026-10-21).
        expect(smoker.space.battlemech).toBe(1);
        expect(fuel.roundsPerTon).toBe(50);
        expect(getCompatibleAmmo(smoker, fuel)).toBe(true);
        expect(getWeaponShotsPerTon(smoker, fuel)).toBe(50);
        expect(smoker.notes).toContain("level 2");
        expect(smoker.notes).toMatch(/small fire, doing 5 points of damage and generating 10 points of heat/);
    });

    it("Buckler Smoke Dispenser: half a ton, 1 slot, 1 heat, 10 integral shots, no VTOL", () => {
        const buckler = find("custom-buckler-smoke-dispenser");
        expect(buckler.weight).toBe(0.5);
        expect(buckler.heat).toBe(1);
        expect(buckler.space.combatVehicle).toBe(1);
        expect(buckler.shotsPerTon).toBe(10);
        expect(buckler.excludedMotives).toEqual(["vtol"]);
        expect(buckler.notes).toContain("stationary");
    });

    it("both are rules level 6, universal, Future Wars #32 custom records", () => {
        for (const item of [find("custom-smoker"), find("custom-buckler-smoke-dispenser"), ...ammoCustom.filter((entry) => entry.tag === "ammo-custom-smoker-fuel")]) {
            expect(item.techBase).toBe("universal");
            expect(item.catalog).toBe("custom");
            expect(item.rulesLevel).toBe(6);
            expect(item.book).toBe("Future Wars #32");
            expect(getEquipmentRulesLevel(item)).toBe(6);
            expect(item.notes).toContain("Not printed in Future Wars #32");
        }
        expect(find("custom-smoker").page).toBe(9);
        expect(find("custom-buckler-smoke-dispenser").page).toBe(17);
    });

    // Values from the nearest canon device, never lost (user ruling 2026-10-21): Smoker = Vehicle Flamer (TM p.218),
    // fuel = Vehicle Flamer / Fluid Gun obscurant ammo, Buckler = Vehicular Grenade Launcher (TO:AUE p.127).
    it("cost, BV, dates and tech rating come from the analog devices", () => {
        const fuel = ammoCustom.find((item) => item.tag === "ammo-custom-smoker-fuel")!;
        expect(find("custom-smoker")).toMatchObject({ cbills: 7500, battleValue: 5, battleValueDefensive: true, introduced: 1950, extinct: null, techRating: "b" });
        expect(fuel).toMatchObject({ cbills: 1000, battleValue: 1, introduced: 1950, extinct: null, techRating: "b" });
        expect(find("custom-buckler-smoke-dispenser")).toMatchObject({ cbills: 10000, battleValue: 15, battleValueDefensive: true, introduced: 2100, extinct: null, techRating: "c" });
    });

    it("a tracked tank is offered the Buckler, a VTOL is not; both are offered the Smoker", () => {
        const offered = (motive: string) => {
            const vehicle = new Vehicle();
            vehicle.setMotiveType(motive);
            return vehicle.getAvailableEquipment(true, 6).filter((item) => item.available).map((item) => item.tag);
        };
        const tracked = offered("tracked");
        expect(tracked).toContain("custom-buckler-smoke-dispenser");
        expect(tracked).toContain("custom-smoker");
        expect(tracked).toContain("ammo-custom-smoker-fuel");
        const vtol = offered("vtol");
        expect(vtol).not.toContain("custom-buckler-smoke-dispenser");
        expect(vtol).toContain("custom-smoker");
    });
});
