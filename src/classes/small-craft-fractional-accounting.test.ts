import { describe, expect, it } from "vitest";
import SmallCraft from "./small-craft";
import ProtoMech from "./protomech";
import { EXPERIMENTAL_RULES_LEVEL } from "../data/equipment-registry";

// Fractional Accounting on Small Craft: Tactical Operations: Advanced Units & Equipment pp.188-189. Battle armor
// weapons on Small Craft and ProtoMechs: BattleTech Adventures: Ghosts of Obeedah pp.53-54.

// The Astrolux Star Yacht, the TechManual's worked Small Craft (pp.184-197): 200 tons, 20 tons of fuel, 5 tons of armor.
function astrolux(): SmallCraft {
    const craft = new SmallCraft();
    craft.setTech("is");
    craft.setEra("dark-ages");
    craft.setTonnage(200);
    craft.setSafeThrust(5);
    craft.setFuelTons(20);
    craft.setStructuralIntegrity(8);
    craft.setArmorTons(5);
    return craft;
}

const fractional = (craft: SmallCraft): SmallCraft => {
    craft.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL);
    return craft;
};

describe("Fractional Accounting on Small Craft (TO:AUE pp.188-189)", () => {
    it("is offered only at the Experimental rules level, and makes the design Experimental", () => {
        const craft = astrolux();
        expect(craft.setWeightAccounting("fractional", 3)).toBe("standard");
        expect(craft.getRequiredRulesLevel()).toBeLessThan(EXPERIMENTAL_RULES_LEVEL);
        expect(craft.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL)).toBe("fractional");
        expect(craft.getRequiredRulesLevel()).toBe(EXPERIMENTAL_RULES_LEVEL);
        expect(craft.setWeightAccounting("standard", 0)).toBe("standard");
    });

    it("weighs the Astrolux's fuel pumps to the kilogram: 2 percent of 20 tons is 0.4, not 0.5", () => {
        const craft = astrolux();
        expect(craft.getFuelPumpWeight()).toBe(0.5);
        const before = craft.getCurrentTonnage();
        fractional(craft);
        expect(craft.getFuelPumpWeight()).toBe(0.4);
        // The 5 tons of armor were 80 points; bought by the point they still weigh 5 tons.
        expect(craft.getPurchasedArmorPoints()).toBe(80);
        expect(craft.getArmorTons()).toBe(5);
        expect(craft.getCurrentTonnage()).toBe(before - 0.1);
    });

    it("drops the half-ton rounding of the engine, structure and controls", () => {
        const craft = new SmallCraft();
        craft.setTonnage(105);
        craft.setSafeThrust(6);
        craft.setStructuralIntegrity(9);
        // 105 x 6 x 0.065 = 40.95 (TM p.185); 9 x 105 / 200 = 4.725 (TM p.187); 105 x 0.0075 = 0.7875 (TM p.189).
        expect(craft.getEngineWeight()).toBe(41);
        expect(craft.getStructureWeight()).toBe(5);
        expect(craft.getControlsWeight()).toBe(1);
        fractional(craft);
        expect(craft.getEngineWeight()).toBe(40.95);
        expect(craft.getStructureWeight()).toBe(4.725);
        expect(craft.getControlsWeight()).toBe(0.788);
    });

    it("buys armor by the point up to the tonnage limit, and rounds back up to the half ton when turned off", () => {
        const craft = fractional(astrolux());
        expect(craft.setPurchasedArmorPoints(33)).toBe(33);
        // 33 x 0.0625 = 2.0625 tons, rounded up to the kilogram.
        expect(craft.getArmorTons()).toBe(2.063);
        expect(craft.getAvailableArmorPoints()).toBe(33 + craft.getBonusArmorPoints());
        // Structural Integrity 8 x 4.5 = 36 tons at most (TM p.191): 576 points.
        expect(craft.setPurchasedArmorPoints(100000)).toBe(576);
        craft.setPurchasedArmorPoints(33);
        craft.setWeightAccounting("standard");
        expect(craft.getArmorTons()).toBe(2.5);
        expect(craft.getPurchasedArmorPoints()).toBe(40);
    });

    it("keeps fuel in half-ton lots (TM p.186)", () => {
        expect(fractional(astrolux()).setFuelTons(2.3)).toBe(2.5);
    });

    it("carries ammunition by the shot", () => {
        const craft = fractional(astrolux());
        craft.addEquipmentFromTag("machine-gun", "nose");
        const bin = craft.addEquipmentFromTag("ammo-machine-gun-standard")!;
        expect(craft.getAmmoBinShotsPerTon(bin)).toBe(200);
        expect(craft.setAmmoBinShots(bin.uuid, 37)).toBe(37);
        expect(bin.weight).toBe(0.185);
        craft.setWeightAccounting("standard");
        expect(bin.weight).toBe(0.5);
    });

    it("survives a save and load", () => {
        const craft = fractional(astrolux());
        craft.setPurchasedArmorPoints(33);
        craft.addEquipmentFromTag("machine-gun", "nose");
        const bin = craft.addEquipmentFromTag("ammo-machine-gun-standard")!;
        craft.setAmmoBinShots(bin.uuid, 37);

        const loaded = new SmallCraft(craft.exportJSON());
        expect(loaded.usesFractionalAccounting()).toBe(true);
        expect(loaded.getPurchasedArmorPoints()).toBe(33);
        expect(loaded.getEquipmentList().find((item) => item.isAmmo)!.weight).toBe(0.185);
        expect(loaded.getCurrentTonnage()).toBe(craft.getCurrentTonnage());
        expect(loaded.getImportIssues()).toEqual([]);

        const saved = JSON.parse(craft.exportJSON());
        delete saved.weightAccounting;
        expect(new SmallCraft(JSON.stringify(saved)).usesFractionalAccounting()).toBe(false);
    });
});

describe("Battle armor weapons on Small Craft (Ghosts of Obeedah pp.53-54)", () => {
    it("are Experimental, take one weapon slot, and offer no power cells, as a Small Craft tracks heat", () => {
        const craft = astrolux();
        expect(craft.getAvailableEquipment(false, 3).some((item) => item.battleArmorScale)).toBe(false);
        const offered = craft.getAvailableEquipment(false, EXPERIMENTAL_RULES_LEVEL).filter((item) => item.battleArmorScale);
        expect(offered.find((item) => item.tag === "ba-is-er-medium-laser")!.criticals).toBe(1);
        expect(offered.some((item) => item.tag === "ammo-ba-is-medium-recoilless-rifle")).toBe(true);
        expect(offered.some((item) => item.tag === "ammo-ba-is-er-medium-laser")).toBe(false);
    });

    it("turn Fractional Accounting on by default, may be turned off, and count at Short range only", () => {
        const craft = astrolux();
        const laser = craft.addEquipmentFromTag("ba-is-er-medium-laser", "nose")!;
        expect(craft.usesFractionalAccounting()).toBe(true);
        expect(craft.getRequiredRulesLevel()).toBe(EXPERIMENTAL_RULES_LEVEL);
        expect(laser.weight).toBe(1);
        expect(laser.rangeAero).toBe("s");
        const [short, medium] = craft.getAlphaStrikeStats().arcs.nose;
        expect(medium.damage === 0 && !medium.minimal).toBe(true);
        expect(short.damage > 0 || short.minimal).toBe(true);

        expect(craft.setWeightAccounting("standard")).toBe("standard");
        craft.addEquipmentFromTag("ba-is-er-medium-laser", "nose");
        expect(craft.usesFractionalAccounting()).toBe(false);
    });
});

describe("Battle armor weapons on ProtoMechs (Ghosts of Obeedah pp.53-54)", () => {
    function proto(): ProtoMech {
        const unit = new ProtoMech();
        unit.setTons(9);
        unit.setWalkMP(5);
        unit.setEra("dark-ages");
        return unit;
    }

    it("are offered only at the Experimental rules level, Clan weapons only", () => {
        const unit = proto();
        expect(unit.getAvailableCatalogItems(3).some((item) => item.battleArmorScale)).toBe(false);
        const offered = unit.getAvailableCatalogItems(EXPERIMENTAL_RULES_LEVEL).filter((item) => item.battleArmorScale);
        expect(offered.some((item) => item.tag === "ba-clan-er-small-laser")).toBe(true);
        expect(offered.some((item) => item.tag.startsWith("ba-is-"))).toBe(false);
        // Ammunition is bought with the weapon, by the shot, not offered as an item.
        expect(offered.some((item) => item.isAmmo)).toBe(false);
    });

    it("weigh a multiple of 250 kg, need heat sinks for energy weapons, and make the design Experimental", () => {
        const unit = proto();
        expect(unit.addMount("ba-clan-er-small-laser", "torso")).toBe(true);
        const laser = unit.getMounts()[0];
        // 350 kg on a suit, rounded up to 500 kg; 1 heat for every 250 kg (p.54).
        expect(unit.getMountWeight(laser)).toBe(500);
        expect(unit.needsHeatSinks(laser)).toBe(true);
        expect(unit.getRequiredRulesLevel()).toBe(EXPERIMENTAL_RULES_LEVEL);
    });

    it("carry ammunition by the shot at the battle armor weight per shot, in whole kilograms", () => {
        const unit = proto();
        expect(unit.addMount("ba-clan-machine-gun", "la")).toBe(true);
        expect(unit.getMountWeight(unit.getMounts()[0])).toBe(250);
        unit.updateMount(0, { shots: 50 });
        expect(unit.getShotWeight(unit.getMounts()[0])).toBeCloseTo(0.1);
        // 50 shots x 0.1 kg = 5 kg.
        expect(unit.getAmmoWeight(unit.getMounts()[0])).toBe(5);
    });
});
