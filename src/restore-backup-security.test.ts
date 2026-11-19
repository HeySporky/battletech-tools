// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { MAX_ACES_CAMPAIGNS, MAX_RESTORE_GROUPS, MAX_VEHICLE_SAVES, restoreFullBackup, IFullBackup } from "./dataSaves";
import SmallCraft from "./classes/small-craft";
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
        expect(Date.now() - started).toBeLessThan(4000);
        expect(messages.filter((msg) => msg.severity === "add")).toHaveLength(MAX_VEHICLE_SAVES);
        expect(messages.some((msg) => msg.severity === "warning" && msg.message.includes(String(MAX_VEHICLE_SAVES)))).toBe(true);
    // About 0.3 s since vehicles stopped copying the whole equipment catalog on load (#86).
    });

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

    // Review of the unit-builder bundle: the newer "current unit" types were only checked once the overwrite box
    // was ticked, so the preview never listed what restoring them would clean.
    it("lists what a current Small Craft would have cleaned in the preview, before any box is ticked", () => {
        const bad = { ...JSON.parse(new SmallCraft().exportJSON()), tonnage: 5000, equipment: [null, { tag: "no-such-item", location: "nose" }] };
        const preview = restoreFullBackup(backup({ currentSmallCraft: JSON.stringify(bad) }), appGlobals())
            .filter((msg) => msg.severity === "warning").map((msg) => msg.message);
        expect(preview.length).toBeGreaterThan(0);
        expect(preview.every((msg) => msg.startsWith("If you overwrite your current Small Craft: "))).toBe(true);
    });

    // #34: restored favourite groups only lived in memory and were gone on the next page load.
    it("saves the restored favourite groups", () => {
        const saved: Record<string, unknown[]> = {};
        const globals = {
            favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [], fighterSaves: [],
            infantrySaves: [], battleArmorSaves: [], protoMechSaves: [], smallCraftSaves: [], capitalShipSaves: [], buildingSaves: [],
            appSettings: {},
        } as Record<string, unknown>;
        // Every appGlobals.saveX(...) records what it was given.
        const appGlobals = new Proxy(globals, {
            get: (target, key: string) => key in target ? target[key]
                : key.startsWith("save") ? (value: unknown[]) => { saved[key] = value; } : undefined,
        });
        const io = backup({
            favoriteASGroups: [{ uuid: "as1", name: "AS favourites", members: [], groups: [] }],
            favoriteCBTGroups: [{ uuid: "cbt1", name: "CBT favourites", units: [] }],
        });
        restoreFullBackup(io, appGlobals as never, false, false, false, true);
        expect(saved.saveFavoriteASGroups).toHaveLength(1);
        expect(saved.saveFavoriteCBTGroups).toHaveLength(1);
    });

    it("caps the Alpha Strike favourite groups it reads, as it does the Classic ones, and says so", () => {
        const favoriteASGroups = Array.from({ length: MAX_RESTORE_GROUPS + 5 }, (_, i) => ({ uuid: "a" + i, name: "g" + i, members: [], groups: [] }));
        const messages = restoreFullBackup(backup({ favoriteASGroups }), appGlobals());
        expect(messages.filter((msg) => msg.severity === "add")).toHaveLength(MAX_RESTORE_GROUPS);
        expect(messages.some((msg) => msg.severity === "warning" && msg.message.includes(String(MAX_RESTORE_GROUPS)))).toBe(true);
        expect(() => restoreFullBackup(backup({ favoriteASGroups: { uuid: "x" } }), appGlobals())).not.toThrow();
    });

    it("caps the Aces campaigns it reads and skips entries that are not campaigns", () => {
        const acesCampaigns = [null, { name: "no id" }, ...Array.from({ length: MAX_ACES_CAMPAIGNS + 5 }, (_, i) => ({ id: "c" + i, name: "Campaign " + i }))];
        const messages = restoreFullBackup(backup({ acesCampaigns }), appGlobals());
        expect(messages.filter((msg) => msg.severity === "add")).toHaveLength(MAX_ACES_CAMPAIGNS - 2);
        const warnings = messages.filter((msg) => msg.severity === "warning").map((msg) => msg.message);
        expect(warnings.some((msg) => msg.includes(String(MAX_ACES_CAMPAIGNS)))).toBe(true);
        expect(warnings.filter((msg) => msg.includes("not readable"))).toHaveLength(2);
    });
});
