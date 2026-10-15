import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";
import { EXPERIMENTAL_RULES_LEVEL } from "../data/equipment-registry";

// Fractional Accounting on fighters: Tactical Operations: Advanced Units & Equipment pp.188-189. Battle armor
// weapons on aerospace units: BattleTech Adventures: Ghosts of Obeedah pp.53-54.

function aerospace(tonnage: number = 50, safeThrust: number = 9): AerospaceFighter {
    const fighter = new AerospaceFighter();
    fighter.setTech("is");
    fighter.setEra("dark-ages");
    fighter.setTonnage(tonnage);
    fighter.setSafeThrust(safeThrust);
    return fighter;
}

// TechManual's 'Mechbuster (TM pp.184-196): a 50-ton conventional fighter with a 250 turbine and three medium lasers.
function mechbuster(): AerospaceFighter {
    const fighter = new AerospaceFighter();
    fighter.setTech("is");
    fighter.setEra("dark-ages");
    fighter.setFighterType("conventional");
    fighter.setTonnage(50);
    fighter.setSafeThrust(5);
    fighter.setEngineType("ice");
    fighter.setFuelTons(2);
    return fighter;
}

const fractional = (fighter: AerospaceFighter): AerospaceFighter => {
    fighter.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL);
    return fighter;
};

describe("Fractional Accounting on fighters (TO:AUE pp.188-189)", () => {
    it("is offered only at the Experimental rules level, and makes the design Experimental", () => {
        const fighter = aerospace();
        expect(fighter.setWeightAccounting("fractional", 3)).toBe("standard");
        expect(fighter.setWeightAccounting("fractional")).toBe("standard");
        expect(fighter.getRequiredRulesLevel()).toBeLessThan(EXPERIMENTAL_RULES_LEVEL);

        expect(fighter.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL)).toBe("fractional");
        expect(fighter.getRequiredRulesLevel()).toBe(EXPERIMENTAL_RULES_LEVEL);
        // It can always be turned off.
        expect(fighter.setWeightAccounting("standard", 0)).toBe("standard");
    });

    it("weighs an aerospace fighter's engine by the Fractional Engine Multiplier (the book's 350 Light engine)", () => {
        const fighter = aerospace(50, 9);
        expect(fighter.getEngineRating()).toBe(350);
        fighter.setEngineType("light");
        expect(fighter.getEngineWeight()).toBe(22.5);
        fractional(fighter);
        // 29.5 tons standard x 0.75 = 22.125 tons, the example on TO:AUE p.188.
        expect(fighter.getEngineWeight()).toBe(22.125);
        fighter.setEngineType("xl");
        expect(fighter.getEngineWeight()).toBe(14.75);
        fighter.setEngineType("standard");
        expect(fighter.getEngineWeight()).toBe(29.5);
    });

    it("applies a conventional fighter's x 1.5 to a fusion engine before the one rounding, and frees VSTOL weight", () => {
        const fighter = new AerospaceFighter();
        fighter.setFighterType("conventional");
        fighter.setTonnage(25);
        fighter.setSafeThrust(6);
        fighter.setEngineType("standard");
        fighter.setVSTOL(true);
        expect(fighter.getEngineRating()).toBe(150);
        // 5.5 tons x 1.5 = 8.25, rounded up to 8.5 (TM p.185); 25 x 5% = 1.25, rounded up to 1.5 (TM p.190).
        expect(fighter.getEngineWeight()).toBe(8.5);
        expect(fighter.getVSTOLWeight()).toBe(1.5);
        fractional(fighter);
        expect(fighter.getEngineWeight()).toBe(8.25);
        expect(fighter.getVSTOLWeight()).toBe(1.25);
        expect(fighter.getControlsWeight()).toBe(2.5);
    });

    it("buys armor by the point at the Fractional Armor Table weight", () => {
        const fighter = aerospace();
        fighter.setArmorAllocation("nose", 100);
        expect(fighter.getArmorWeight()).toBe(6.5);
        fractional(fighter);
        expect(fighter.getFractionalArmorTonsPerPoint()).toBe(0.0625);
        expect(fighter.getArmorWeight()).toBe(6.25);
        expect(fighter.getUnallocatedArmorPoints()).toBe(0);

        // Ferro-aluminum is the aerospace form of Inner Sphere ferro-fibrous armor: 0.0558 tons a point.
        fighter.setArmorType("ferro-aluminum");
        expect(fighter.getFractionalArmorTonsPerPoint()).toBe(0.0558);
        expect(fighter.getArmorWeight()).toBe(5.58);
        fighter.setWeightAccounting("standard");
        expect(fighter.getArmorWeight()).toBe(6);
    });

    it("keeps fuel in half-ton lots (TM p.186)", () => {
        const fighter = fractional(aerospace());
        expect(fighter.setFuelTons(2.3)).toBe(2.5);
    });

    it("weighs the 'Mechbuster's power amplifiers to the kilogram", () => {
        const fighter = mechbuster();
        for (let count = 0; count < 3; count++) fighter.addEquipmentFromTag("medium-laser", "nose");
        // 10% of 3 tons of lasers, rounded up to the half ton (TM p.195).
        expect(fighter.getPowerAmplifierWeight()).toBe(0.5);
        fractional(fighter);
        expect(fighter.getPowerAmplifierWeight()).toBe(0.3);
    });

    it("carries ammunition by the shot, and puts bins back to the half ton when turned off", () => {
        const fighter = fractional(aerospace());
        fighter.addEquipmentFromTag("machine-gun", "nose");
        const bin = fighter.addEquipmentFromTag("ammo-machine-gun-standard")!;
        expect(fighter.getAmmoBinShotsPerTon(bin)).toBe(200);
        // One MG shot weighs 0.005 tons (the example on TO:AUE p.189).
        expect(fighter.setAmmoBinShots(bin.uuid, 1)).toBe(1);
        expect(bin.weight).toBe(0.005);
        expect(fighter.setAmmoBinShots(bin.uuid, 5000)).toBe(200);
        expect(bin.weight).toBe(1);
        fighter.setAmmoBinShots(bin.uuid, 37);
        expect(bin.weight).toBe(0.185);

        fighter.setWeightAccounting("standard");
        expect(bin.weight).toBe(0.5);
        expect(fighter.setAmmoBinShots(bin.uuid, 10)).toBe(0);
    });

    it("survives a save and load, and loads an older save with standard rounding", () => {
        const fighter = fractional(aerospace());
        fighter.setEngineType("light");
        fighter.setArmorAllocation("nose", 33);
        fighter.addEquipmentFromTag("machine-gun", "nose");
        const bin = fighter.addEquipmentFromTag("ammo-machine-gun-standard")!;
        fighter.setAmmoBinShots(bin.uuid, 37);

        const loaded = new AerospaceFighter(fighter.exportJSON());
        expect(loaded.usesFractionalAccounting()).toBe(true);
        expect(loaded.getEquipmentList().find((item) => item.isAmmo)!.weight).toBe(0.185);
        expect(loaded.getCurrentTonnage()).toBe(fighter.getCurrentTonnage());
        expect(loaded.getImportIssues()).toEqual([]);

        const saved = JSON.parse(fighter.exportJSON());
        delete saved.weightAccounting;
        expect(new AerospaceFighter(JSON.stringify(saved)).usesFractionalAccounting()).toBe(false);
    });
});

describe("Battle armor weapons on fighters (Ghosts of Obeedah pp.53-54)", () => {
    it("are offered only at the Experimental rules level, without power cells on an aerospace fighter", () => {
        const fighter = aerospace();
        expect(fighter.getAvailableEquipment(false, 3).some((item) => item.battleArmorScale)).toBe(false);
        const offered = fighter.getAvailableEquipment(false, EXPERIMENTAL_RULES_LEVEL).filter((item) => item.battleArmorScale);
        expect(offered.some((item) => item.tag === "ba-is-er-medium-laser")).toBe(true);
        expect(offered.some((item) => item.tag === "ammo-ba-is-medium-recoilless-rifle")).toBe(true);
        // An aerospace fighter tracks heat: its battle armor energy weapons run off heat sinks (p.54).
        expect(offered.some((item) => item.tag === "ammo-ba-is-er-medium-laser")).toBe(false);
        expect(offered.find((item) => item.tag === "ba-is-er-medium-laser")!.criticals).toBe(1);

        const conventional = mechbuster().getAvailableEquipment(false, EXPERIMENTAL_RULES_LEVEL);
        expect(conventional.some((item) => item.tag === "ammo-ba-is-er-medium-laser")).toBe(true);
    });

    it("turn Fractional Accounting on by default when the first one is mounted; it may be turned off and stays off", () => {
        const fighter = aerospace();
        const laser = fighter.addEquipmentFromTag("ba-is-er-medium-laser", "nose")!;
        expect(fighter.usesFractionalAccounting()).toBe(true);
        expect(fighter.getRequiredRulesLevel()).toBe(EXPERIMENTAL_RULES_LEVEL);
        // 800 kg, rounded up to 1 ton; 1 heat for every 250 kg (p.54).
        expect(laser.weight).toBe(1);
        expect(fighter.getWeaponHeat()).toBe(4);

        expect(fighter.setWeightAccounting("standard")).toBe("standard");
        fighter.addEquipmentFromTag("ba-is-er-medium-laser", "nose");
        expect(fighter.usesFractionalAccounting()).toBe(false);
        expect(new AerospaceFighter(fighter.exportJSON()).usesFractionalAccounting()).toBe(false);
    });

    it("count only at Short range for Alpha Strike, as their range on an aerospace unit is Short", () => {
        const fighter = aerospace();
        const laser = fighter.addEquipmentFromTag("ba-is-er-medium-laser", "nose")!;
        expect(laser.rangeAero).toBe("s");
        const damage = fighter.getAlphaStrikeStats().damageValues;
        expect(damage.medium.damage === 0 && !damage.medium.minimal).toBe(true);
        expect(damage.long.damage === 0 && !damage.long.minimal).toBe(true);
        expect(damage.short.damage > 0 || damage.short.minimal).toBe(true);
    });

    it("run a turbine fighter's energy weapons off power cells, which take them off the heat sinks", () => {
        const fighter = mechbuster();
        fighter.addEquipmentFromTag("ba-is-er-medium-laser", "nose");
        expect(fighter.getWeaponHeat()).toBe(4);
        expect(fighter.getIssues(EXPERIMENTAL_RULES_LEVEL).some((issue) => issue.includes("needs power cells"))).toBe(true);
        // No power amplifiers for a battle armor weapon (p.54).
        expect(fighter.getPowerAmplifierWeight()).toBe(0);

        fighter.addEquipmentFromTag("ammo-ba-is-er-medium-laser");
        expect(fighter.getWeaponHeat()).toBe(0);
        expect(fighter.getIssues(EXPERIMENTAL_RULES_LEVEL).some((issue) => issue.includes("needs power cells"))).toBe(false);
    });

    it("survive a save and load", () => {
        const fighter = aerospace();
        fighter.addEquipmentFromTag("ba-is-medium-recoilless-rifle", "nose");
        const bin = fighter.addEquipmentFromTag("ammo-ba-is-medium-recoilless-rifle")!;
        fighter.setAmmoBinShots(bin.uuid, 75);
        expect(bin.weight).toBe(0.15);

        const loaded = new AerospaceFighter(fighter.exportJSON());
        expect(loaded.usesFractionalAccounting()).toBe(true);
        expect(loaded.getEquipmentList().find((item) => item.isAmmo)!.weight).toBe(0.15);
        expect(loaded.getImportIssues()).toEqual([]);
    });
});
