import { describe, expect, it } from "vitest";
import { getSmallCraftFireControlWeight, getSmallCraftFreeHeatSinks } from "../data/small-craft-construction";
import { getSmallCraftHitLocation } from "../data/small-craft-hit-tables";
import SmallCraft, { normalizeSmallCraftExport } from "./small-craft";
import { importSmallCraftBlk } from "./small-craft-blk";

/** The Astrolux Star Yacht, the TechManual's worked Small Craft (pp.184-197). */
const buildAstrolux = (): SmallCraft => {
    const craft = new SmallCraft();
    craft.setName("Astrolux Star Yacht");
    craft.setTonnage(200);
    craft.setSafeThrust(5);
    craft.setFuelTons(20);
    craft.setStructuralIntegrity(8);
    craft.setArmorTons(5);
    craft.setArmorAllocation("nose", 33);
    craft.setArmorAllocation("left", 28);
    craft.setArmorAllocation("right", 28);
    craft.setArmorAllocation("aft", 23);
    craft.setQuarters("crew", 3);
    craft.setPassengers(7);
    craft.setQuarters("firstClass", 7);
    craft.addBay("cargo", 9);
    return craft;
};

/** The Aquarius Escort (TRO:3075), an armed aerodyne craft. */
const buildAquarius = (): SmallCraft => {
    const craft = new SmallCraft();
    craft.setName("Aquarius Escort");
    craft.setTonnage(200);
    craft.setSafeThrust(4);
    craft.setFuelTons(6);
    craft.setStructuralIntegrity(8);
    craft.setArmorTons(36);
    craft.setArmorAllocation("nose", 183);
    craft.setArmorAllocation("left", 162);
    craft.setArmorAllocation("right", 162);
    craft.setArmorAllocation("aft", 101);
    craft.setAdditionalHeatSinks(32);
    for (const tag of ["large-laser", "large-laser"]) craft.addEquipmentFromTag(tag, "nose");
    for (const arc of ["left", "right"]) {
        craft.addEquipmentFromTag("lrm-10", arc);
        craft.addEquipmentFromTag("srm-6", arc);
        craft.addEquipmentFromTag("medium-laser", `${arc}Aft`);
    }
    for (const tag of ["medium-laser", "medium-laser"]) craft.addEquipmentFromTag(tag, "aft");
    const ammoTags = craft.getAvailableEquipment(false, 4).filter((item) => item.isAmmo && !item.isSpecialAmmo);
    const lrm = ammoTags.find((item) => /^ammo-(is-)?lrm-standard$/.test(item.tag));
    const srm = ammoTags.find((item) => /^ammo-(is-)?srm-standard$/.test(item.tag));
    for (const ammo of [lrm, lrm, srm, srm]) craft.addEquipmentFromTag(ammo?.tag ?? "");
    craft.setCrew(6);
    craft.setOfficers(2);
    craft.setQuarters("crew", 0);
    craft.setQuarters("steerage", 6);
    return craft;
};

describe("Small Craft construction (TechManual pp.180-197)", () => {
    it("builds the book's Astrolux step by step", () => {
        const craft = buildAstrolux();
        expect(craft.getMaxThrust()).toBe(8);
        // 200 tons x 5 Safe Thrust x 0.065 (TM p.185).
        expect(craft.getEngineWeight()).toBe(65);
        // 20 tons of fuel: 1,600 points, 0.5 tons of pumps, nearly 11 days at 1 G (TM p.187).
        expect(craft.getFuelPoints()).toBe(1600);
        expect(craft.getFuelPumpWeight()).toBe(0.5);
        expect(craft.getBurnDays()).toBe(10.87);
        // Structural Integrity 8 to 240; 8 weighs 8 tons on an aerodyne craft (TM p.188).
        expect(craft.getMinStructuralIntegrity()).toBe(8);
        expect(craft.getMaxStructuralIntegrity()).toBe(240);
        expect(craft.getStructureWeight()).toBe(8);
        // Controls 1.5 tons and a crew of 3 (TM p.190).
        expect(craft.getControlsWeight()).toBe(1.5);
        expect(craft.getMinimumCrew()).toBe(3);
        // Up to 36 tons of armor; 5 tons give 80 points and the structure another 32 (TM p.192).
        expect(craft.getMaxArmorTons()).toBe(36);
        expect(craft.getPurchasedArmorPoints()).toBe(80);
        expect(craft.getBonusArmorPoints()).toBe(32);
        expect(craft.getUnallocatedArmorPoints()).toBe(0);
        // One heat sink comes free with the 65-ton engine (TM p.194).
        expect(craft.getFreeHeatSinks()).toBe(1);
        // 21 tons of crew quarters, 70 of first-class quarters and 9 of cargo fill the craft (TM p.196).
        expect(craft.getQuartersWeight()).toBe(91);
        expect(craft.getCurrentTonnage()).toBe(200);
        expect(craft.getIssues()).toEqual([]);
    });

    it("weighs a spheroid's structure over 500 and a Clan engine at 0.061", () => {
        const craft = new SmallCraft();
        craft.setShape("spheroid");
        craft.setTonnage(200);
        craft.setSafeThrust(6);
        craft.setStructuralIntegrity(9);
        // 9 x 200 / 500 = 3.6, rounded up to 4 (TM p.187).
        expect(craft.getStructureWeight()).toBe(4);
        expect(craft.getEngineWeight()).toBe(78);
        // Square root of 78 x 1.6, rounded down (TM p.193).
        expect(craft.getFreeHeatSinks()).toBe(11);
        expect(craft.getMaxArmorTons()).toBe(32);
        craft.setTech("clan");
        // 200 x 6 x 0.061 = 73.2, rounded up to the half ton.
        expect(craft.getEngineWeight()).toBe(73.5);
        expect(craft.getArmorPointsPerTon()).toBe(20);
    });

    it("keeps tonnage, Structural Integrity and armor inside the rules", () => {
        const craft = new SmallCraft();
        expect(craft.setTonnage(95)).toBe(100);
        expect(craft.setTonnage(203)).toBe(200);
        expect(craft.setTonnage(152)).toBe(150);
        craft.setSafeThrust(6);
        expect(craft.setStructuralIntegrity(1)).toBe(9);
        expect(craft.setStructuralIntegrity(5000)).toBe(270);
        craft.setStructuralIntegrity(9);
        expect(craft.setArmorTons(500)).toBe(40.5);
    });

    it("gives the free heat sinks and extra fire control of the tables", () => {
        expect(getSmallCraftFreeHeatSinks(65, "aerodyne")).toBe(1);
        expect(getSmallCraftFreeHeatSinks(52, "aerodyne")).toBe(0);
        // 13 weapons of 133 tons need 13.5 tons; 36 weapons of 276 tons need 83 (TM p.196).
        expect(getSmallCraftFireControlWeight(12, 100)).toBe(0);
        expect(getSmallCraftFireControlWeight(13, 133)).toBe(13.5);
        expect(getSmallCraftFireControlWeight(36, 276)).toBe(83);
    });

    it("counts a gunner for every six weapons and asks for quarters for everyone", () => {
        const craft = buildAquarius();
        // Ten weapons: two gunners on top of the base crew of three (TM p.189).
        expect(craft.getGunneryWeaponCount()).toBe(10);
        expect(craft.getMinimumCrew()).toBe(5);
        expect(craft.getCurrentTonnage()).toBe(200);
        expect(craft.getIssues()).toEqual([]);
        craft.setPassengers(2);
        expect(craft.getIssues().some((issue) => issue.includes("Quarters for 6 of 8"))).toBe(true);
    });

    it("wants side weapons matched and ten turns of fire", () => {
        const craft = buildAquarius();
        craft.addEquipmentFromTag("medium-laser", "left");
        expect(craft.getIssues().some((issue) => issue.includes("must carry the same weapons"))).toBe(true);
        craft.addEquipmentFromTag("medium-laser", "right");
        craft.addEquipmentFromTag("lrm-10", "nose");
        // Three LRM 10s need 30 shots; two tons hold 24 (TM p.194).
        const shortfall = craft.getAmmunitionShortfalls().find((entry) => entry.name === "LRM 10");
        expect(shortfall).toEqual({ name: "LRM 10", shots: 24, needed: 30 });
    });

    it("limits bay doors by shape and wants a door on a unit bay", () => {
        const craft = new SmallCraft();
        craft.addBay("vehicle-light", 1);
        craft.setBay(0, 1, 0);
        expect(craft.getIssues().some((issue) => issue.includes("needs a door"))).toBe(true);
        craft.setBay(0, 1, 3);
        expect(craft.getIssues().some((issue) => issue.includes("no more than 2"))).toBe(true);
        craft.setShape("spheroid");
        expect(craft.getIssues().some((issue) => issue.includes("bay doors"))).toBe(false);
        // Cargo and infantry need no door (TM p.196).
        const other = new SmallCraft();
        other.addBay("cargo", 10);
        other.addBay("infantry-foot", 1);
        expect(other.getIssues().some((issue) => issue.includes("door"))).toBe(false);
        expect(other.getBaysWeight()).toBe(15);
    });
});

describe("Small Craft Battle Value and cost", () => {
    it("works the Aquarius Escort's Battle Value as TechManual pp.311-313 lay it out", () => {
        const craft = buildAquarius();
        // Defensive: 608 armor x 2.5 + SI 8 x 2 - 15 for each of two explosive ammunition types = 1,506.
        // Offensive: two Large Lasers 246, two LRM 10 180, two SRM 6 118, ammunition 36; the four rear-firing
        // Medium Lasers are the weaker group and count half, and the last two come after the heat limit of 38
        // is reached: 23 + 23 + 11.5 + 11.5. 649 x 1.12 for Maximum Thrust 6 = 726.88.
        expect(craft.getBattleValue()).toBe(2233);
        expect(SmallCraft.speedFactor(6)).toBe(1.12);
    });

    it("prices the Astrolux from the Aerospace Unit Structural Costs table (TM p.283)", () => {
        const craft = buildAstrolux();
        // Bridge 202,000, computer 200,000, life support 50,000, sensors 80,000, fire control 100,000,
        // structure 800,000, thruster 25,000, gear 2,000, drive 5,000, engine 65,000, tanks 4,000, armor 50,000,
        // one heat sink 2,000: 1,585,000, x 5 for 200 tons (1 + 200 / 50).
        expect(craft.getCBillCost()).toBe(7925000);
    });
});

describe("Small Craft in Alpha Strike (Alpha Strike Companion pp.92-102, 144)", () => {
    it("matches the Aquarius Escort's published armor, structure, Threshold and Move", () => {
        const stats = buildAquarius().getAlphaStrikeStats();
        expect(stats.type).toBe("SC");
        expect(stats.size).toBe(1);
        expect(`${stats.movement}${stats.moveCode}`).toBe("4a");
        expect(stats.armor).toBe(20);
        expect(stats.structure).toBe(4);
        expect(stats.threshold).toBe(2);
        // Rear-facing wing weapons fire into the rear arc (ASC p.102).
        expect(stats.arcs.rear[0].damage).toBeGreaterThan(0);
        expect(stats.specialAbilities).toContain("SPC");
    });

    it("splits a spheroid's side arcs between nose, sides and rear", () => {
        const craft = new SmallCraft();
        craft.setShape("spheroid");
        craft.setAdditionalHeatSinks(40);
        for (const arc of ["left", "right"]) {
            craft.addEquipmentFromTag("large-laser", arc);
            craft.addEquipmentFromTag("large-laser", arc);
        }
        const stats = craft.getAlphaStrikeStats();
        // Each fore-side arc gives half to the nose and half to its own side.
        expect(stats.arcs.nose[0].damage).toBe(stats.arcs.left[0].damage * 2);
        expect(stats.arcs.rear[0].damage).toBe(0);
        expect(stats.moveCode).toBe("p");
    });
});

describe("Small Craft in play (Total Warfare pp.237-240)", () => {
    it("reads the DropShips/Small Craft hit location table", () => {
        expect(getSmallCraftHitLocation(2, "nose")).toEqual({ facing: "nose", critical: "crew" });
        expect(getSmallCraftHitLocation(5, "nose")).toEqual({ facing: "right", critical: "thruster" });
        expect(getSmallCraftHitLocation(12, "aft")).toEqual({ facing: "aft", critical: "fuel" });
        expect(getSmallCraftHitLocation(6, "left")).toEqual({ facing: "left", critical: "cargo" });
        expect(getSmallCraftHitLocation(7, "above", 5)).toEqual({ facing: "left", critical: "weapon" });
        expect(getSmallCraftHitLocation(7, "above", 2)).toEqual({ facing: "right", critical: "weapon" });
    });

    it("takes armor, then half of the rest off the Structural Integrity, and checks for critical hits", () => {
        const craft = buildAstrolux();
        // Nose armor 33: Damage Threshold 4. A 10-point hit goes over it; the check of 9 crosses off a crew box.
        const log = craft.resolveAttack(2, "nose", 10, { criticalRolls: [9] });
        expect(craft.getInPlay().armorDamage.nose).toBe(10);
        expect(craft.getInPlay().crewHits).toBe(1);
        expect(log.join(" ")).toContain("Crew hit 1");
        // 30 more: 23 armor, and half of the 7 left over, rounded down, against the structure.
        craft.resolveAttack(2, "nose", 30, { criticalRolls: [2, 2] });
        expect(craft.getInPlay().armorDamage.nose).toBe(33);
        expect(craft.getCurrentStructure()).toBe(5);
        expect(craft.getDamageToHitModifier()).toBe(1);
    });

    it("loses 1 Safe Thrust for each engine hit and the engine on the sixth", () => {
        const craft = buildAstrolux();
        for (let hit = 0; hit < 2; hit++) craft.resolveAttack(6, "aft", 10, { criticalRolls: [8] });
        expect(craft.getCurrentSafeThrust()).toBe(3);
        expect(craft.getCurrentMaxThrust()).toBe(5);
        craft.setCriticalHits("engine", 6);
        expect(craft.isEngineDestroyed()).toBe(true);
        expect(craft.getCurrentSafeThrust()).toBe(0);
    });

    it("tracks heat as a fighter does", () => {
        const craft = buildAquarius();
        for (const item of craft.getEquipmentList()) craft.setWeaponFired(item.uuid ?? "", true);
        expect(craft.getHeatGeneratedThisTurn()).toBe(44);
        const log = craft.applyHeatPhase();
        expect(craft.getInPlay().heat).toBe(12);
        expect(log.join(" ")).toContain("Random movement");
    });
});

describe("Small Craft saves and imports", () => {
    it("comes back the same from its own save", () => {
        const craft = buildAquarius();
        craft.addBay("battle-armor-is", 1);
        craft.resolveAttack(7, "nose", 12, { criticalRolls: [2] });
        const copy = new SmallCraft(craft.exportJSON());
        expect(copy.export()).toEqual(craft.export());
        expect(copy.getBattleValue()).toBe(craft.getBattleValue());
        expect(copy.getImportIssues()).toEqual([]);
    });

    it("cleans a damaged save and never throws", () => {
        expect(normalizeSmallCraftExport("nonsense").craft).toBeNull();
        const result = normalizeSmallCraftExport({ tonnage: 9000, shape: "cube", safeThrust: "fast", equipment: [{ tag: "no-such-thing" }, 7], bays: [{ tag: "moon" }], quarters: { crew: -4 } });
        expect(result.craft?.tonnage).toBe(200);
        expect(result.craft?.shape).toBe("aerodyne");
        expect(result.craft?.equipment).toEqual([]);
        expect(result.craft?.bays).toEqual([]);
        expect(result.issues.length).toBeGreaterThan(0);
    });

    it("reads a MegaMek Small Craft file", () => {
        const blk = [
            "<UnitType>", "SmallCraft", "</UnitType>", "<Name>", "Test Shuttle", "</Name>", "<Model>", "TS-1", "</Model>", "<year>", "3050", "</year>",
            "<type>", "IS Level 2", "</type>", "<motion_type>", "Spheroid", "</motion_type>",
            "<transporters>", "steeragequarters:20.0:0:-1::-1:0", "cargobay:10.0:1:1::-1:0", "battlearmorbay:1.0:1:2::-1:0", "</transporters>",
            "<SafeThrust>", "5", "</SafeThrust>", "<heatsinks>", "12", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "800", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "100", "80", "80", "60", "</armor>",
            "<Nose Equipment>", "Medium Laser", "LRM 15", "IS Ammo LRM-15", "ISArtemisIV", "No Such Gun", "</Nose Equipment>",
            "<Left Side Equipment>", "Medium Laser", "(R) Medium Laser", "</Left Side Equipment>",
            "<Right Side Equipment>", "Medium Laser", "(R) Medium Laser", "</Right Side Equipment>",
            "<structural_integrity>", "8", "</structural_integrity>", "<tonnage>", "200.0", "</tonnage>", "<crew>", "16", "</crew>", "<officers>", "1", "</officers>",
        ].join("\n");
        const result = importSmallCraftBlk(blk);
        const craft = result.craft as SmallCraft;
        expect(craft.getShape()).toBe("spheroid");
        expect(craft.getFuelTons()).toBe(10);
        expect(craft.getTotalArmorPoints()).toBe(320);
        // 320 points less the structure's 32, at 16 a ton.
        expect(craft.getArmorTons()).toBe(18);
        expect(craft.getTotalHeatSinks()).toBe(12);
        expect(craft.getArcItems("leftAft").map((item) => item.tag)).toEqual(["medium-laser"]);
        // The Artemis IV line fits the launcher in its arc.
        expect(craft.getArcItems("nose").map((item) => item.tag).sort()).toEqual(["lrm-15-artemis-iv", "medium-laser"]);
        expect(craft.getQuarters().steerage).toBe(4);
        expect(craft.getBays().map((bay) => bay.tag)).toEqual(["cargo", "battle-armor-is"]);
        // The file's 16 aboard take in the battle armor squads; four have quarters.
        expect(craft.getCrew()).toBe(4);
        expect(result.issues).toEqual(["\"No Such Gun\" has no match in this catalog and was left off."]);
        expect(importSmallCraftBlk(blk.replace("200.0", "5.0")).craft).toBeNull();
        expect(importSmallCraftBlk(blk.replace("SmallCraft", "Dropship")).craft).toBeNull();
    });
});
