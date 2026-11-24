import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";

// #647 I6: vehicles and trailers pick the special ammunition their Alpha Strike card plays as a munition.
describe("Vehicle special ammunition for Alpha Strike (#647)", () => {
    const build = (): Vehicle => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag("ac-10", "turret");
        vehicle.addEquipmentFromTag("ammo-is-ac-10-armor-piercing", "body");
        return vehicle;
    };
    it("offers the loaded special round and plays it as a munition", () => {
        const vehicle = build();
        const options = vehicle.getAlphaStrikeSpecialAmmoOptions();
        expect(options.map((ammo) => ammo.tag)).toContain("ammo-is-ac-10-armor-piercing");
        expect(vehicle.getAlphaStrikeUnit().munition).toBe("");
        vehicle.setAlphaStrikeSpecialAmmoTag("ammo-is-ac-10-armor-piercing");
        expect(vehicle.getAlphaStrikeSpecialAmmoTag()).toBe("ammo-is-ac-10-armor-piercing");
        expect(vehicle.getAlphaStrikeUnit().munition).toBe("ac-armor-piercing");
    });
    it("survives a save and load, and clears when the bin is gone", () => {
        const vehicle = build();
        vehicle.setAlphaStrikeSpecialAmmoTag("ammo-is-ac-10-armor-piercing");
        const restored = new Vehicle(JSON.stringify(vehicle.export()));
        expect(restored.getAlphaStrikeSpecialAmmoTag()).toBe("ammo-is-ac-10-armor-piercing");
        const empty = new Vehicle();
        expect(empty.setAlphaStrikeSpecialAmmoTag("ammo-is-ac-10-armor-piercing")).toBe("");
    });
});
