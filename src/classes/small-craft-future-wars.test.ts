import { describe, expect, it } from "vitest";
import SmallCraft from "./small-craft";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { FW_DROPSHIP_RULESET_IDS, FwDropShipMethod } from "../data/future-wars-dropships";

/** Future Wars DropShips plan (#172, 2026-11-19), Task 3: the four methods inside the Small Craft builder. */

const dropShip = (method: FwDropShipMethod | null, tonnage: number, shape: "aerodyne" | "spheroid"): SmallCraft => {
    const craft = new SmallCraft();
    craft.setCraftType("dropShip");
    craft.setShape(shape);
    if (method) craft.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, [FW_DROPSHIP_RULESET_IDS[method]]);
    craft.setTonnage(tonnage);
    return craft;
};

const weight = (craft: SmallCraft, prefix: string): number | undefined => craft.getWeights().find((entry) => entry.name.startsWith(prefix))?.weight;

describe("Future Wars DropShips in the Small Craft builder", () => {
    it("builds Reese's UNION-12 hull: any tonnage, fuel by the day, his charts", () => {
        const craft = dropShip("reese", 22860, "spheroid");
        expect(craft.getTonnage()).toBe(22860);
        craft.setSafeThrust(3);
        craft.setStructuralIntegrity(11);
        craft.setFwOptions({ fuelDays: 30 });
        craft.setArmorTons(53);
        craft.addBay("mech", 12);
        craft.addBay("fighter", 2);
        craft.setCrew(68);
        craft.setOfficers(12);
        craft.setPassengers(14);
        expect(craft.getEngineWeight()).toBe(4286);
        expect(craft.getStructureWeight()).toBe(2515);
        expect(craft.getFuelTons()).toBe(10800);
        expect(craft.getStrategicFuelPerDay()).toBe(360);
        expect(craft.getBurnDays()).toBe(30);
        expect(craft.getControlsWeight()).toBe(25);
        expect(craft.getArmorPointsPerTon()).toBe(12);
        expect(craft.getAvailableArmorPoints()).toBe(636);
        expect(craft.getFreeHeatSinks()).toBe(126);
        expect(weight(craft, "Cubicles")).toBe(2100);
        expect(weight(craft, "Fuel Tanks")).toBeUndefined();
        // His 20,426 less the 187 tons of book weapons and ammunition, with the 14 pilots at 70 tons.
        expect(craft.getCurrentTonnage()).toBe(20436 - 166 - 21);
        expect(craft.getIssues(CUSTOM_HOMEBREW_RULES_LEVEL)).toEqual([]);
        expect(craft.getNotes().some((note) => note.includes("Mike Reese"))).toBe(true);
        expect(craft.getBattleValue()).toBeGreaterThan(0);
    });

    it("weighs Houseman's Leopard thrusters at 204 tons and notes his missing heat-sink rule", () => {
        const craft = dropShip("houseman", 1720, "aerodyne");
        craft.setSafeThrust(4);
        craft.setStructuralIntegrity(7);
        expect(craft.getEngineWeight()).toBe(204);
        expect(craft.getFreeHeatSinks()).toBe(0);
        expect(craft.getNotes().some((note) => note.includes("no heat-sink rule"))).toBe(true);
    });

    it("recalculates when a method is ticked or unticked after the design is built", () => {
        const craft = dropShip(null, 3500, "spheroid");
        craft.setSafeThrust(3);
        craft.setStructuralIntegrity(11);
        const techManual = craft.getCurrentTonnage();
        craft.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, [FW_DROPSHIP_RULESET_IDS.eid]);
        expect(craft.getEngineWeight()).toBe(656.25);
        expect(craft.getCurrentTonnage()).not.toBe(techManual);
        craft.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, []);
        expect(craft.getCurrentTonnage()).toBe(techManual);
    });

    it("works out fire factors per arc: four large pulse lasers make 36 damage, 4 factors, and +2 under Eid", () => {
        const craft = dropShip("eid", 3500, "spheroid");
        for (let count = 0; count < 4; count++) craft.addEquipmentFromTag("large-pulse-laser", "nose");
        craft.addEquipmentFromTag("lrm-20", "aft");
        expect(craft.getArcFireFactors("nose")).toEqual({ factors: 4, bonus: 2, maxDamage: 36 });
        expect(craft.getArcFireFactors("aft")).toEqual({ factors: 2, bonus: 0, maxDamage: 20 });
        craft.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, [FW_DROPSHIP_RULESET_IDS.reese]);
        expect(craft.getArcFireFactors("nose")?.bonus).toBe(0);
        craft.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, [FW_DROPSHIP_RULESET_IDS.houseman]);
        expect(craft.getArcFireFactors("nose")).toBeNull();
    });

    it("needs the Custom Homebrew rules level under a method", () => {
        expect(dropShip(null, 3500, "spheroid").getRequiredRulesLevel()).toBeLessThan(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(dropShip("houseman", 3500, "spheroid").getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("never applies a method to a Small Craft", () => {
        const craft = new SmallCraft();
        craft.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, [FW_DROPSHIP_RULESET_IDS.stock]);
        expect(craft.getFwDropShipMethod()).toBeUndefined();
    });

    it("saves and loads the methods' choices", () => {
        const craft = dropShip("stock", 3500, "spheroid");
        craft.setFwOptions({ stock: { bridgeMultiplier: 3, heatSinkDivisor: 12 }, fuelDays: 25 });
        const loaded = new SmallCraft(JSON.stringify(craft.export()));
        expect(loaded.getFwDropShipMethod()).toBe("stock");
        expect(loaded.getFwOptions()).toEqual({ fuelDays: 25, engines: 1, stock: { bridgeMultiplier: 3, heatSinkDivisor: 12 }, houseman: {} });
        expect(loaded.getTonnage()).toBe(3500);
        expect(loaded.getCurrentTonnage()).toBe(craft.getCurrentTonnage());
        // An unset Stock value goes back to the formula.
        loaded.setFwOptions({ stock: { bridgeMultiplier: undefined } });
        expect(loaded.getFwOptions().stock).toEqual({ heatSinkDivisor: 12 });
        // A TechManual design saves no Future Wars block.
        expect(dropShip(null, 3500, "spheroid").export().futureWarsDropShip).toBeUndefined();
    });
});
