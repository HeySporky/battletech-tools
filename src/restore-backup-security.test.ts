// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { MAX_VEHICLE_SAVES, restoreFullBackup, IFullBackup } from "./dataSaves";
import Vehicle from "./classes/vehicle";
import { BattleMechForce, MAX_FORCE_GROUPS } from "./classes/battlemech-force";

// Backups come from other people. Restoring one must stay bounded and report everything it cleans
// (OWASP review of branch VehicleCombat, second pass 2026-09-29: N1 and P4).
const appGlobals = () => ({
    favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [],
}) as never;

const vehicleSave = (name: string): Record<string, unknown> => {
    const vehicle = new Vehicle();
    vehicle.setName(name);
    return JSON.parse(vehicle.exportJSON());
};

const backup = (extra: Record<string, unknown>): IFullBackup => ({
    battleMechSaves: [], favoriteASGroups: [], ...extra,
}) as unknown as IFullBackup;

describe("Restoring a backup", () => {
    it("caps the number of saved vehicles it reads, and says so (N1)", () => {
        const saves = Array.from({ length: MAX_VEHICLE_SAVES + 50 }, (_, i) => ({ ...vehicleSave("v" + i), uuid: "u" + i }));
        const started = Date.now();
        const messages = restoreFullBackup(backup({ vehicleSaves: saves }), appGlobals());
        expect(Date.now() - started).toBeLessThan(20000);
        expect(messages.filter((msg) => msg.severity === "add")).toHaveLength(MAX_VEHICLE_SAVES);
        expect(messages.some((msg) => msg.severity === "warning" && msg.message.includes(String(MAX_VEHICLE_SAVES)))).toBe(true);
    // The 20-second bound above is the test; the runner's 5-second default sits below it (about 4 s on a slow machine).
    }, 30_000);

    it("reports cleaned vehicles in favorite groups and vehicles over the per-group limit (P4)", () => {
        const bad = { ...vehicleSave("bad"), equipment: [null] };
        const favoriteCBTGroups = [{ uuid: "g", name: "Favorites", units: [], vehicles: [bad, ...Array.from({ length: 120 }, () => vehicleSave("x"))] }];
        const messages = restoreFullBackup(backup({ favoriteCBTGroups }), appGlobals());
        const warnings = messages.filter((msg) => msg.severity === "warning").map((msg) => msg.message);
        expect(warnings.some((msg) => msg.includes("Favorites") && msg.includes("could not be read"))).toBe(true);
        expect(warnings.some((msg) => msg.includes("Favorites") && msg.includes("100"))).toBe(true);
    });

    it("reads a bounded, well-formed list of force groups", () => {
        expect(() => new BattleMechForce({ groups: "x" } as never)).not.toThrow();
        const force = new BattleMechForce({ groups: Array.from({ length: MAX_FORCE_GROUPS + 20 }, () => ({ units: [] })) } as never);
        expect(force.groups.length).toBe(MAX_FORCE_GROUPS);
    });

    it("labels current-vehicle and force warnings as conditional in the preview, and skips them when not overwriting", () => {
        const bad = { ...vehicleSave("bad"), equipment: [null] };
        const io = backup({ currentVehicle: JSON.stringify(bad), currentCBTForce: { groups: [{ units: [], vehicles: [bad] }] } });
        const preview = restoreFullBackup(io, appGlobals()).filter((msg) => msg.severity === "warning");
        expect(preview.length).toBeGreaterThan(0);
        expect(preview.every((msg) => msg.message.startsWith("If you overwrite"))).toBe(true);
    });
});
