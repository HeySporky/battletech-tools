import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";

// TechManual's worked example, the 50-ton 'Mechbuster (TM pp.184-196): Safe Thrust 5, a 250 turbine at 25 tons,
// 5 tons of controls, 2 tons of fuel, 50 points of standard armor (18/11/11/10) at 3.5 tons, 9 single heat sinks,
// three medium lasers with half a ton of power amplifiers, and the last 2 tons spent on more fuel.
const mechbusterChassis = (): AerospaceFighter => {
    const fighter = new AerospaceFighter();
    fighter.setFighterType("conventional");
    fighter.setTonnage(50);
    fighter.setSafeThrust(5);
    fighter.setEngineType("ice");
    fighter.setFuelTons(2);
    return fighter;
};

describe("Conventional fighter construction (TechManual)", () => {
    it("builds the 'Mechbuster to exactly 50 tons (TM pp.184-196)", () => {
        const fighter = mechbusterChassis();
        expect(fighter.getEngineRating()).toBe(250);
        expect(fighter.getMaxThrust()).toBe(8);
        expect(fighter.getEngineWeight()).toBe(25);
        expect(fighter.getFuelPoints()).toBe(320);
        expect(fighter.getStructuralIntegrity()).toBe(5);
        expect(fighter.getControlsWeight()).toBe(5);
        expect(fighter.getRemainingTonnage()).toBe(18);

        expect(fighter.getMaxArmorPoints()).toBe(50);
        fighter.setArmorAllocation("nose", 18);
        fighter.setArmorAllocation("leftWing", 11);
        fighter.setArmorAllocation("rightWing", 11);
        fighter.setArmorAllocation("aft", 10);
        expect(fighter.getArmorWeight()).toBe(3.5);
        expect(fighter.getRemainingTonnage()).toBe(14.5);

        // A turbine gives no free heat sinks (TM p.193).
        expect(fighter.getFreeHeatSinks()).toBe(0);
        fighter.setAdditionalHeatSinks(9);
        expect(fighter.getRemainingTonnage()).toBe(5.5);

        for (let count = 0; count < 3; count++) expect(fighter.addEquipmentFromTag("medium-laser", "nose")).not.toBeNull();
        expect(fighter.getPowerAmplifierWeight()).toBe(0.5);
        expect(fighter.getWeaponHeat()).toBe(9);
        expect(fighter.getRemainingTonnage()).toBe(2);

        fighter.setFuelTons(4);
        expect(fighter.getFuelPoints()).toBe(640);
        expect(fighter.getRemainingTonnage()).toBe(0);
        expect(fighter.getExternalStoresHardpoints()).toBe(10);
        expect(fighter.getIssues()).toEqual([]);
    });

    it("keeps tonnage to 5-50 and offers a turbine or a standard fusion engine to either tech base (TM pp.184-185)", () => {
        const fighter = new AerospaceFighter();
        fighter.setTonnage(100);
        fighter.setEngineType("xl");
        fighter.setHeatSinkType("double");
        fighter.setFighterType("conventional");
        expect(fighter.getTonnage()).toBe(50);
        expect(fighter.getEngineType().tag).toBe("standard");
        expect(fighter.getHeatSinkType().tag).toBe("single");
        expect(fighter.setHeatSinkType("double").tag).toBe("single");
        expect(fighter.getAvailableHeatSinkTypes().map((sink) => sink.tag)).toEqual(["single"]);
        for (const tech of ["is", "clan"]) {
            fighter.setTech(tech);
            expect(fighter.getAvailableEngineTypes().map((engine) => engine.tag).sort()).toEqual(["ice", "standard"]);
            expect(fighter.setEngineType("xl").tag).not.toBe("xl");
            expect(fighter.setEngineType("clan_xl").tag).not.toBe("clan_xl");
        }
        // The engine rating is tonnage x Safe Thrust, held to the 10-400 table.
        expect(fighter.getMinSafeThrust()).toBe(1);
        expect(fighter.getMaxSafeThrust()).toBe(8);
        fighter.setTonnage(5);
        expect(fighter.getMinSafeThrust()).toBe(2);
    });

    it("weighs a fusion engine at 1.5 times the table, with ten free heat sinks and no amplifiers (TM pp.185, 193, 195)", () => {
        const fighter = mechbusterChassis();
        fighter.setEngineType("standard");
        // A 250 standard fusion engine is 12.5 tons: x 1.5 = 18.75, rounded up to 19.
        expect(fighter.getEngineWeight()).toBe(19);
        expect(fighter.getFreeHeatSinks()).toBe(10);
        fighter.addEquipmentFromTag("medium-laser", "nose");
        expect(fighter.getPowerAmplifierWeight()).toBe(0);
    });

    it("needs heat sinks for its energy weapons only (TM p.193)", () => {
        const fighter = mechbusterChassis();
        fighter.addEquipmentFromTag("autocannon-standard-b", "nose");
        expect(fighter.getWeaponHeat()).toBe(0);
        expect(fighter.getIssues().join(" | ")).not.toContain("heat sinks");
        fighter.addEquipmentFromTag("medium-laser", "nose");
        expect(fighter.getWeaponHeat()).toBe(3);
        expect(fighter.getIssues().join(" | ")).toContain("needs heat sinks for all its energy weapons");
        fighter.setAdditionalHeatSinks(3);
        expect(fighter.getIssues().join(" | ")).not.toContain("heat sinks");
    });

    it("adds VSTOL equipment at 5 percent of tonnage, to conventional fighters only (TM p.190)", () => {
        const fighter = mechbusterChassis();
        expect(fighter.setVSTOL(true)).toBe(true);
        expect(fighter.getVSTOLWeight()).toBe(2.5);
        expect(fighter.getRemainingTonnage()).toBe(15.5);
        fighter.setTonnage(15);
        expect(fighter.getVSTOLWeight()).toBe(1);
        fighter.setFighterType("aerospace");
        expect(fighter.hasVSTOL()).toBe(false);
        expect(fighter.setVSTOL(true)).toBe(false);
    });

    it("saves its type, and reads a save without one as an aerospace fighter", () => {
        const fighter = mechbusterChassis();
        fighter.setVSTOL(true);
        fighter.addEquipmentFromTag("medium-laser", "aft");
        const copy = new AerospaceFighter(fighter.exportJSON());
        expect(copy.export()).toEqual({ ...fighter.export(), lastUpdated: copy.lastUpdated });
        expect(copy.getImportIssues()).toEqual([]);
        expect(copy.isConventional()).toBe(true);

        const { fighterType, vstol, ...older } = new AerospaceFighter().export();
        void fighterType; void vstol;
        const loaded = new AerospaceFighter(JSON.stringify({ ...older, tonnage: 75 }));
        expect(loaded.getFighterType()).toBe("aerospace");
        expect(loaded.getTonnage()).toBe(75);

        const hostile = new AerospaceFighter(JSON.stringify({ fighterType: { tag: "conventional" }, vstol: "yes", tonnage: 80, engineType: "ice" }));
        expect(hostile.getFighterType()).toBe("aerospace");
        expect(hostile.hasVSTOL()).toBe(false);
        expect(hostile.getEngineType().tag).toBe("standard");
        expect(hostile.getImportIssues().join(" | ")).toContain("unknown fighter type");
    });
});
