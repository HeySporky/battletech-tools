import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";
import { EXPERIMENTAL_RULES_LEVEL } from "../data/equipment-registry";
import { getFractionalEngineWeight } from "../data/fractional-accounting";

// Fractional Accounting: Tactical Operations: Advanced Units & Equipment pp.188-189. The engine
// multipliers apply to "BattleMechs, IndustrialMechs, Combat Vehicles and fighters" (p.188).

function tank(tonnage: number, cruise: number, fractional: boolean = true): Vehicle {
    const vehicle = new Vehicle();
    vehicle.setTech("is");
    vehicle.setEra("dark-age");
    vehicle.setTonnage(tonnage);
    vehicle.setCruiseMP(cruise);
    if (fractional) vehicle.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL);
    return vehicle;
}

const ammoBin = (vehicle: Vehicle) => vehicle.getEquipmentList().find((item) => item.isAmmo)!;

describe("Fractional Accounting on a Combat Vehicle (TO:AUE pp.188-189)", () => {
    it("is off by default and can only be turned on at the Experimental rules level", () => {
        const vehicle = tank(40, 5, false);
        expect(vehicle.usesFractionalAccounting()).toBe(false);
        expect(vehicle.setWeightAccounting("fractional", 3)).toBe("standard");
        expect(vehicle.setWeightAccounting("fractional")).toBe("standard");
        expect(vehicle.export().weightAccounting).toBeUndefined();

        expect(vehicle.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL)).toBe("fractional");
        expect(vehicle.getRequiredRulesLevel()).toBeGreaterThanOrEqual(EXPERIMENTAL_RULES_LEVEL);
        expect(vehicle.setWeightAccounting("standard", 0)).toBe("standard");
    });

    it("applies the vehicle's engine shielding before the one rounding up to the kilogram", () => {
        // 9.8235 x 1.5 = 14.73525: one rounding gives 14.736, never a rounded 9.824 x 1.5.
        expect(getFractionalEngineWeight("xxl", 29.5, 1.5)).toBe(14.736);
        expect(getFractionalEngineWeight("xl", 0.5, 1.5)).toBe(0.375);
    });

    it("weighs a shielded fusion engine without the half-ton rounding", () => {
        const standard = tank(40, 5, false);
        expect(standard.getEngineRating()).toBe(200);
        // A 200-rated fusion engine weighs 8.5 tons; x 1.5 in a vehicle = 12.75, rounded up to 13.
        expect(standard.getEngineWeight()).toBe(13);

        const fractional = tank(40, 5);
        expect(fractional.getEngineWeight()).toBe(12.75);
        fractional.setEngineType("xl");
        expect(fractional.getEngineWeight()).toBe(6.375);
        fractional.setEngineType("ice");
        expect(fractional.getEngineWeight()).toBe(17);
    });

    it("does not round structure, control systems or lift equipment to the half ton", () => {
        const standard = tank(35, 4, false);
        standard.setMotiveType("hover");
        expect(standard.getStructureWeight()).toBe(3.5);
        expect(standard.getControlSystemsWeight()).toBe(2);
        expect(standard.getLiftEquipmentWeight()).toBe(3.5);

        const fractional = tank(35, 4);
        fractional.setMotiveType("hover");
        expect(fractional.getStructureWeight()).toBe(3.5);
        expect(fractional.getControlSystemsWeight()).toBe(1.75);
        expect(fractional.getLiftEquipmentWeight()).toBe(3.5);

        const odd = tank(33, 4);
        expect(odd.getStructureWeight()).toBe(3.3);
        expect(odd.getControlSystemsWeight()).toBe(1.65);
    });

    it("weighs armor by the point at the Fractional Armor Table weight", () => {
        const vehicle = tank(40, 5);
        expect(vehicle.setArmorPoints(33)).toBe(33);
        // 33 points x 0.0625 tons = 2.0625, up to the kilogram.
        expect(vehicle.getArmorWeight()).toBe(2.063);

        vehicle.setArmorType("ferro-fibrous");
        expect(vehicle.getFractionalArmorTonsPerPoint()).toBe(0.0558);
        expect(vehicle.getArmorWeight()).toBe(1.842);

        vehicle.setWeightAccounting("standard");
        expect(vehicle.getArmorPoints()).toBe(33);
        expect(vehicle.getArmorWeight()).toBe(2);
    });

    it("never mounts more armor than the point cap or the free tonnage allows", () => {
        const vehicle = tank(40, 5);
        vehicle.setArmorPoints(100000);
        expect(vehicle.getArmorPoints()).toBeLessThanOrEqual(vehicle.getMaxArmorPoints());
        expect(vehicle.getRemainingTonnage()).toBeGreaterThanOrEqual(0);

        vehicle.allocateArmorClear();
        vehicle.allocateMaxArmor();
        expect(vehicle.getArmorPoints()).toBe(vehicle.getMaxAffordableArmorPoints());
        expect(vehicle.getRemainingTonnage()).toBeGreaterThanOrEqual(0);
    });

    it("carries ammunition by the shot and puts bins back to the half ton when turned off", () => {
        const vehicle = tank(40, 5);
        vehicle.addEquipmentFromTag("machine-gun");
        vehicle.addEquipmentFromTag("ammo-machine-gun-standard");
        const bin = ammoBin(vehicle);

        expect(vehicle.getAmmoBinShotsPerTon(bin)).toBe(200);
        expect(vehicle.setAmmoBinShots(bin.uuid, 1)).toBe(1);
        expect(bin.weight).toBe(0.005);
        expect(vehicle.getAmmoBinShots(bin)).toBe(1);

        expect(vehicle.setAmmoBinShots(bin.uuid, 5000)).toBe(200);
        expect(bin.weight).toBe(1);

        vehicle.setAmmoBinShots(bin.uuid, 37);
        expect(bin.weight).toBe(0.185);
        vehicle.setWeightAccounting("standard");
        expect(bin.weight).toBe(0.5);
        expect(vehicle.setAmmoBinShots(bin.uuid, 10)).toBe(0);
    });

    it("totals weights to the kilogram", () => {
        const vehicle = tank(33, 4);
        vehicle.setEngineType("xxl");
        vehicle.setArmorPoints(41);
        const total = vehicle.getCurrentTonnage();
        expect(Math.round(total * 1000) / 1000).toBe(total);
    });

    it("survives a save and load with its armor and shots", () => {
        const vehicle = tank(40, 5);
        vehicle.setEngineType("xl");
        vehicle.setArmorPoints(57);
        vehicle.addEquipmentFromTag("machine-gun");
        vehicle.addEquipmentFromTag("ammo-machine-gun-standard");
        vehicle.setAmmoBinShots(ammoBin(vehicle).uuid, 37);

        const loaded = new Vehicle(vehicle.exportJSON());
        expect(loaded.usesFractionalAccounting()).toBe(true);
        expect(loaded.getArmorPoints()).toBe(57);
        expect(loaded.getArmorWeight()).toBe(vehicle.getArmorWeight());
        expect(loaded.getEngineWeight()).toBe(6.375);
        expect(ammoBin(loaded).weight).toBe(0.185);
        expect(loaded.getAmmoBinShots(ammoBin(loaded))).toBe(37);
        expect(loaded.getCurrentTonnage()).toBe(vehicle.getCurrentTonnage());
    });

    it("loads a vehicle saved before the option existed as standard accounting", () => {
        const vehicle = tank(40, 5, false);
        const saved = JSON.parse(vehicle.exportJSON());
        delete saved.weightAccounting;
        const loaded = new Vehicle(JSON.stringify(saved));
        expect(loaded.usesFractionalAccounting()).toBe(false);
        expect(loaded.getEngineWeight()).toBe(13);
    });
});
