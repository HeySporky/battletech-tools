import { describe, expect, it } from "vitest";
import { importFixedWingSupportBlk, importSupportVehicleBlk } from "./support-vehicle-blk";

// Synthetic MegaMek files: the shape of a MegaMekLab save, with made-up designs.
const block = (tag: string, ...lines: string[]): string[] => [`<${tag}>`, ...lines, `</${tag}>`];

describe("MegaMek Support Vehicle import", () => {
    const tank = [
        ...block("UnitType", "SupportTank"), ...block("Name", "Test Hauler"), ...block("Model", "TH-1"), ...block("year", "3050"),
        ...block("type", "IS Level 2"), ...block("motion_type", "Wheeled"), ...block("cruiseMP", "4"), ...block("engine_type", "0"),
        ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "7"),
        ...block("armor_type", "43"), ...block("armor", "10", "8", "8", "6"),
        ...block("Front Equipment", "Machine Gun", "No Such Gun"), ...block("Body Equipment", "IS Ammo MG - Half"),
        ...block("transporters", "cargobay:4.0:1:1::-1:0"), ...block("fuel", "1.0"), ...block("tonnage", "20.0"),
    ].join("\n");

    it("reads a ground Support Vehicle: motive, engine, BAR, armor, equipment, half-ton ammunition, cargo and fuel", () => {
        const { vehicle, issues } = importSupportVehicleBlk(tank);
        expect(vehicle).not.toBeNull();
        expect(vehicle?.getMotiveType().tag).toBe("wheeled");
        expect(vehicle?.getTonnage()).toBe(20);
        expect(vehicle?.getSupportVehicleEngine()?.tag).toBe("ice");
        expect(vehicle?.getBAR()).toBe(7);
        expect(vehicle?.getTotalArmorPoints()).toBe(32);
        const gun = vehicle?.getEquipmentList().find((item) => item.tag === "machine-gun");
        expect(gun?.location).toBe("front");
        // "- Half" is a half-ton lot of machine gun rounds (TM pp.107, 137).
        const ammo = vehicle?.getEquipmentList().find((item) => item.isAmmo);
        expect(ammo && vehicle?.isHalfTonBin(ammo)).toBe(true);
        expect(vehicle?.getBays().map((bay) => [bay.tag, bay.amount])).toEqual([["cargo", 4]]);
        expect(vehicle?.getSupportVehicleFuelWeight()).toBe(1);
        expect(issues).toEqual(["\"No Such Gun\" has no match in this catalog and was left off."]);
    });

    it("refuses files that are not ground or VTOL Support Vehicles", () => {
        expect(importSupportVehicleBlk(tank.replace("SupportTank", "Tank")).vehicle).toBeNull();
        expect(importSupportVehicleBlk("not a unit file").vehicle).toBeNull();
    });
});

describe("MegaMek Fixed-Wing Support Vehicle import", () => {
    const plane = [
        ...block("UnitType", "FixedWingSupport"), ...block("Name", "Test Spotter"), ...block("year", "3050"), ...block("type", "IS Level 2"),
        ...block("motion_type", "Aerodyne"), ...block("SafeThrust", "4"), ...block("heatsinks", "0"), ...block("engine_type", "0"),
        ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "5"),
        ...block("armor_type", "43"), ...block("armor", "4", "3", "3", "2"),
        ...block("Nose Equipment", "Machine Gun"), ...block("Body Equipment", "IS Ammo MG - Full", "STOLChassisMod"),
        ...block("transporters", "cargobay:1.0:1:1::-1:0"), ...block("fuel", "40"), ...block("tonnage", "10.0"),
    ].join("\n");

    it("reads a Fixed-Wing Support Vehicle into the fighter builder", () => {
        const { fighter, issues, notes } = importFixedWingSupportBlk(plane);
        expect(fighter?.isSupportVehicle()).toBe(true);
        expect(fighter?.getSupportMotive()).toBe("fixed-wing");
        expect(fighter?.getTonnage()).toBe(10);
        expect(fighter?.getSafeThrust()).toBe(4);
        expect(fighter?.getSupportEngine()?.tag).toBe("ice");
        expect(fighter?.getBAR()).toBe(5);
        expect(fighter?.getSupportVehicleSettings()?.chassisModifications).toContain("stol");
        expect(fighter?.getArmorAllocation()).toMatchObject({ nose: 4, leftWing: 3, rightWing: 3, aft: 2 });
        expect(fighter?.getEquipmentList().find((item) => !item.isAmmo)?.location).toBe("nose");
        expect(fighter?.getEquipmentList().some((item) => item.isAmmo)).toBe(true);
        expect(fighter?.getBays().map((bay) => [bay.tag, bay.amount])).toEqual([["cargo", 1]]);
        // Fuel is saved in Fuel Points (TM p.128) and bought by the half ton from 5 tons (TM p.129): 40 points become 50.
        expect(fighter?.getFuelPoints()).toBe(50);
        expect(notes.some((note) => note.startsWith("The file's 40 Fuel Points are 50 here"))).toBe(true);
        expect(issues).toEqual([]);
    });

    it("refuses other unit types", () => {
        expect(importFixedWingSupportBlk(plane.replace("FixedWingSupport", "ConvFighter")).fighter).toBeNull();
    });
});
