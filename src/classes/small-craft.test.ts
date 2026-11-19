import { describe, expect, it } from "vitest";
import { getSmallCraftFireControlWeight, getSmallCraftFreeHeatSinks } from "../data/small-craft-construction";
import { getSmallCraftHitLocation } from "../data/small-craft-hit-tables";
import SmallCraft, { normalizeSmallCraftExport } from "./small-craft";
import { importSmallCraftBlk } from "./small-craft-blk";
import { BattleMechGroup } from "./battlemech-group";

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

    it("gives a battle armor bay a door, or lets it use another unit bay's", () => {
        const craft = new SmallCraft();
        craft.addBay("battle-armor-clan", 2);
        expect(craft.getBays()[0].doors).toBe(1);
        craft.setBay(0, 2, 0);
        expect(craft.getIssues().some((issue) => issue.includes("Battle Armor Bay (5 troopers): needs a door"))).toBe(true);
        // The troopers can leave through a vehicle bay's door instead.
        craft.addBay("vehicle-light", 1);
        expect(craft.getIssues().some((issue) => issue.includes("door"))).toBe(false);
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

    it("explodes its most destructive ammunition on a failed heat Avoid Roll, as a fighter does (TW p.161)", () => {
        const craft = buildAquarius();
        // SRM 6 (12 a shot) beats LRM 10: 15 shots x 12 / 10 = 18 against SI 8; both SRM bins are lost.
        const log = craft.explodeAmmunition();
        expect(log.join(" ")).toContain("SRM");
        expect(craft.getInPlay().structureDamage).toBe(18);
        expect(craft.getInPlay().crewHits).toBe(1);
        expect(craft.getInPlay().explodedAmmo).toHaveLength(2);
        expect(craft.isDestroyed()).toBe(true);
        // A DropShip is Large Craft: zero net heat, so no heat explosion (TW p.161).
        const dropShip = buildAquarius();
        dropShip.setCraftType("dropShip");
        expect(dropShip.explodeAmmunition()).toEqual(["Large Craft run at zero net heat: no ammunition explodes from heat (TW p.161)"]);
        expect(dropShip.getInPlay().structureDamage).toBe(0);
    });

    it("runs a DropShip at zero net heat: a fired arc adds all its heat, and going over allows one arc and a Control Roll (TW p.161)", () => {
        const ship = buildAquarius();
        ship.setCraftType("dropShip");
        ship.setWeaponFired(ship.getArcFiringBays("nose")[0].items[0].uuid ?? "", true);
        expect(ship.getHeatGeneratedThisTurn()).toBe(ship.getArcHeat("nose"));
        expect(ship.applyHeatPhase().join(" ")).not.toContain("Avoid Roll");
        expect(ship.getInPlay().heat).toBe(0);
        ship.setAdditionalHeatSinks(0);
        for (const item of ship.getEquipmentList()) ship.setWeaponFired(item.uuid ?? "", true);
        const over = ship.getHeatGeneratedThisTurn() - ship.getHeatDissipation();
        expect(over).toBeGreaterThan(0);
        expect(ship.applyHeatPhase()[1]).toBe(`${over} heat over what the heat sinks dissipate: it may fire only one arc this turn, with a Control Roll at +${Math.ceil(over / 100)} (TW p.161)`);
        expect(ship.getInPlay().heat).toBe(0);
    });
});

describe("Small Craft fire full weapon bays (TM pp.195, 199; user ruling 2026-10-22)", () => {
    const craft = (): SmallCraft => {
        const built = new SmallCraft();
        built.addEquipmentFromTag("large-laser", "nose");
        built.addEquipmentFromTag("medium-laser", "nose");
        built.addEquipmentFromTag("srm-6", "nose");
        return built;
    };

    it("groups an arc's weapons into the bays it fires", () => {
        const bays = craft().getArcFiringBays("nose");
        expect(bays.map((bay) => bay.weapons)).toEqual([2, 1]);
        expect(bays[0].items.map((item) => item.name)).toEqual(["Large Laser", "Medium Laser"]);
    });

    it("fires every working weapon of a bay together, and its heat with them", () => {
        const built = craft();
        const [lasers] = built.getArcFiringBays("nose");
        built.setWeaponDestroyed(lasers.items[1].uuid ?? "", true);
        built.setBayFired("nose", 0, true);
        expect(built.isBayFired("nose", 0)).toBe(true);
        expect(built.getHeatGeneratedThisTurn()).toBe(lasers.items[0].heatAero ?? lasers.items[0].heat);
        expect(built.isBayFired("nose", 1)).toBe(false);
        built.setBayFired("nose", 0, false);
        expect(built.getHeatGeneratedThisTurn()).toBe(0);
    });

    it("cannot fire a bay whose weapons are all destroyed", () => {
        const built = craft();
        const srms = built.getArcFiringBays("nose")[1];
        built.setWeaponDestroyed(srms.items[0].uuid ?? "", true);
        built.setBayFired("nose", 1, true);
        expect(built.isBayFired("nose", 1)).toBe(false);
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
        // The file's 16 aboard include the 6 in the battle armor bay, who need no quarters (TM p.239); the other 10
        // are crew, though only four have quarters.
        expect(craft.getCrew()).toBe(10);
        expect(result.issues).toEqual(["\"No Such Gun\" has no match in this catalog and was left off."]);
        expect(importSmallCraftBlk(blk.replace("200.0", "5.0")).craft).toBeNull();
        const quirked = importSmallCraftBlk(`${blk}\n<quirks>\nlow_profile\n</quirks>`);
        expect((quirked.craft as SmallCraft).quirks.getAll()).toEqual([{ tag: "quirk-narrow-low-profile" }]);
        // A DropShip weighs 200 tons or more (TM p.184).
        expect(importSmallCraftBlk(blk.replace("SmallCraft", "Dropship").replace("200.0", "150.0")).craft).toBeNull();
        // The file's Technical Readout fields come across too (TRO fields, #78).
        const fluffed = importSmallCraftBlk(`${blk}\n<manufacturer>\nWangker Aerospace\n</manufacturer>\n<systemManufacturers>\nENGINE:Rawlings\n</systemManufacturers>\n<history>\n<p>Built for the Periphery trade.</p>\n</history>`);
        const troCraft = fluffed.craft as SmallCraft;
        expect(troCraft.tro.getProduction("manufacturer")).toBe("Wangker Aerospace");
        expect(troCraft.tro.getComponent("engine")).toBe("Rawlings");
        expect(troCraft.tro.getText("battleHistory")).toBe("Built for the Periphery trade.");
    });

    it("reads a small BLK file in well under a second (#86)", () => {
        const blk = [
            "<UnitType>", "SmallCraft", "</UnitType>", "<Name>", "Test Shuttle", "</Name>", "<type>", "IS Level 2", "</type>",
            "<transporters>", "steeragequarters:20.0:0:-1::-1:0", "cargobay:10.0:1:1::-1:0", "</transporters>",
            "<SafeThrust>", "5", "</SafeThrust>", "<heatsinks>", "12", "</heatsinks>", "<fuel>", "800", "</fuel>", "<armor>", "100", "80", "80", "60", "</armor>",
            "<Nose Equipment>", "LRM 15", "LRM 15", "ISArtemisIV", "ISArtemisIV", "IS Ammo LRM-15", "</Nose Equipment>",
            "<Left Side Equipment>", "LRM 10", "ISArtemisIV", "(R) Medium Laser", "</Left Side Equipment>",
            "<structural_integrity>", "8", "</structural_integrity>", "<tonnage>", "200.0", "</tonnage>", "<crew>", "10", "</crew>",
        ].join("\n");
        importSmallCraftBlk(blk);
        const start = performance.now();
        const result = importSmallCraftBlk(blk);
        const elapsed = performance.now() - start;
        expect(result.craft?.getEquipmentList().filter((item) => item.tag.endsWith("-artemis-iv"))).toHaveLength(3);
        // Every setter recalculates Battle Value; it took about 5 s here while each Artemis launcher copied the whole catalog.
        expect(elapsed).toBeLessThan(1000);
    });
});

describe("Small Craft in a roster group", () => {
    it("counts the craft's Battle Value and tonnage and survives a save", () => {
        const group = new BattleMechGroup();
        const craft = buildAquarius();
        craft.resolveAttack(7, "nose", 12, { criticalRolls: [2] });
        group.smallCraft.push(craft);
        expect(group.getTotalBattleValue()).toBe(2233);
        expect(group.getTotalTons()).toBe(200);
        expect(group.getTotalUnits()).toBe(1);
        expect(group.isUnderStrength()).toBe(true);
        const restored = new BattleMechGroup(JSON.parse(JSON.stringify(group.export())));
        expect(restored.smallCraft[0].getInPlay().armorDamage.nose).toBe(12);
        expect(new BattleMechGroup(JSON.parse(JSON.stringify(group.export(true)))).smallCraft[0].isDamaged()).toBe(false);
        // A group saved before Small Craft has none, and a group without them saves no list.
        expect(new BattleMechGroup().export().smallCraft).toBeUndefined();
    });
});

describe("DropShip weapon bays", () => {
    it("groups an arc's weapons of one class into a bay and sums their heat and damage (TM pp.194-195)", () => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setTonnage(3000);
        for (const tag of ["large-laser", "large-laser", "medium-laser", "medium-laser", "medium-laser"]) ship.addEquipmentFromTag(tag, "nose");
        ship.addEquipmentFromTag("lrm-10", "nose");
        const bays = ship.getArcWeaponBays("nose");
        // TechManual's own example: 2 large lasers and 3 medium lasers deliver 31 at Short and 16 at Medium.
        expect(bays.find((bay) => bay.weaponNames.includes("Large Laser"))).toMatchObject({ weapons: 5, heat: 25, values: [31, 16, 0, 0], capital: false });
        expect(bays).toHaveLength(2);
        expect(ship.getArcWeaponBays("aft")).toEqual([]);
        expect(ship.getArcHeat("nose")).toBe(25 + 4);
    });
});

describe("DropShip ammunition by the round (TM p.194)", () => {
    const build = (carried?: number) => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setTonnage(3000);
        ship.addEquipmentFromTag("autocannon-standard-d", "nose");
        const bin = ship.addEquipmentFromTag("ammo-ac-20-standard", "nose")!;
        if (carried !== undefined) ship.setAmmoBinCarriedShots(bin.uuid, carried);
        return { ship, bin: ship.getEquipmentList().find((item) => item.uuid === bin.uuid)! };
    };

    it("rounds the mass up to the whole ton but keeps the rounds carried, for the sheet and the Battle Value", () => {
        const full = build();
        const { ship, bin } = build(2);
        // "Must round up the mass of any ammunition to the nearest ton regardless of the number of rounds carried."
        expect(bin.weight).toBe(1);
        expect(ship.getAmmoBinShots(bin)).toBe(2);
        expect(ship.getAmmoSheetLines().join()).toMatch(/ 2$/);
        // AC/20 ammunition is 22 BV a ton (TM p.317): 2 of 5 rounds count 8.8 of it.
        expect(full.ship.getBattleValueLog()).toMatch(/= 22\.00/);
        expect(ship.getBattleValueLog()).toMatch(/= 8\.80/);
    });

    it("saves the rounds, and a whole-ton change of the bin fills it", () => {
        const { ship, bin } = build(2);
        const copy = new SmallCraft();
        copy.importJSON(ship.exportJSON());
        expect(copy.getAmmoBinShots(copy.getEquipmentList().find((item) => item.isAmmo)!)).toBe(2);
        ship.setAmmoBinTons(bin.uuid, 2);
        expect(ship.getAmmoBinShots(bin)).toBe(10);
    });
});

describe("Small Craft quirk targets: weapon bays (CO p.225)", () => {
    it("offers its bays, not its single weapons, as quirk targets", () => {
        const craft = new SmallCraft();
        craft.addEquipmentFromTag("large-laser", "nose");
        craft.addEquipmentFromTag("medium-laser", "nose");
        const targets = craft.getQuirkTargets();
        expect(targets.weapons).toEqual([]);
        expect(targets.bays).toHaveLength(1);
        expect(targets.bays![0].uuids).toHaveLength(2);
        expect(targets.bays![0].maxDamage).toBe(13);
        expect(targets.bays![0].label).toBe("Lasers: 1 Large Laser, 1 Medium Laser (Nose)");
        // Unit-wide costs still count every weapon.
        expect(targets.unitMaxDamage).toBe(13);
    });
});

describe("Small Craft capital weapon dates (design 2026-10-24-catalog-consolidation §2)", () => {
    it("offers a Clan DropShip the Light SCC on its Clan dates, not the Inner Sphere's", () => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setTech("clan");
        ship.setEra("jihad");
        // Light SCC: Inner Sphere 3073, Clan 3091 (TO:AUE p.155).
        expect(ship.getAvailableCapitalWeapons(3).some((weapon) => weapon.tag === "light-scc")).toBe(false);
        ship.setTech("is");
        expect(ship.getAvailableCapitalWeapons(3).some((weapon) => weapon.tag === "light-scc")).toBe(true);
    });
});

describe("Primitive Small Craft and DropShips (IO:AE pp.119-121)", () => {
    it("builds a Primitive DropShip to the rules of its year", () => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setShape("spheroid");
        ship.setMilitary(true);
        ship.setHeatSinkType("double");
        expect(ship.setPrimitiveYear(2243)).toBe(2243);
        ship.setTonnage(1200);
        ship.setSafeThrust(5);
        // 1,200 x 5 x 0.104 = 624; 1,200 x 0.012 = 14.4, to the half ton; the square root of 624 x 1.3, rounded down.
        expect(ship.getEngineWeight()).toBe(624);
        expect(ship.getControlsWeight()).toBe(14.5);
        expect(ship.getFreeHeatSinks()).toBe(28);
        expect(ship.getHeatSinkType().tag).toBe("single");
        expect(ship.getAvailableHeatSinkTypes(4).find((sink) => sink.tag === "double")?.available).toBe(false);
        // Civilian rules: 50 points a ton / 1.6; 2.82 tons a day x 1.6 = 4.512, rounded up to 0.01.
        expect(ship.isMilitary()).toBe(false);
        expect(ship.getFuelPointsPerTon()).toBe(31.25);
        expect(ship.getStrategicFuelPerDay()).toBe(4.52);
        // 15,000 tons for a spheroid of 2200-2249; 6,000 for an aerodyne.
        expect(ship.getMaxTonnage()).toBe(15000);
        ship.setShape("aerodyne");
        expect(ship.getMaxTonnage()).toBe(6000);
        expect(ship.getKFBoom()).toBe("none");
        ship.setStructuralIntegrity(15);
        ship.setArmorTons(10);
        expect(ship.getAvailableArmorPoints()).toBe(Math.floor((ship.getPurchasedArmorPoints() + 60) * 0.66));
        ship.setPrimitiveYear(null);
        expect(ship.isMilitary()).toBe(true);
        expect(ship.getMaxTonnage()).toBe(35000);
    });

    it("builds a Primitive Small Craft, Inner Sphere only", () => {
        const craft = new SmallCraft();
        craft.setTonnage(200);
        craft.setSafeThrust(5);
        craft.setPrimitiveYear(2120);
        // 1,000 x 0.143 = 143; 200 x 0.01575 = 3.15 → 3.5; 80 / 2.2 points a ton; 1.84 x 2.2 = 4.048 → 4.05.
        expect(craft.getEngineWeight()).toBe(143);
        expect(craft.getControlsWeight()).toBe(3.5);
        expect(craft.getFuelPointsPerTon()).toBeCloseTo(36.36, 2);
        expect(craft.getStrategicFuelPerDay()).toBe(4.05);
        expect(craft.getNotes().some((note) => note.includes("+1 to-hit"))).toBe(true);
        expect(craft.setPrimitiveYear(1900)).toBe(2100);
        craft.setTech("clan");
        expect(craft.isPrimitive()).toBe(false);
        expect(craft.setPrimitiveYear(2200)).toBeNull();
    });

    it("keeps the Primitive year and the K-F boom in a save", () => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setPrimitiveYear(2460);
        ship.setKFBoom("prototype");
        expect(ship.getIssues(2).some((issue) => issue.includes("Advanced"))).toBe(true);
        expect(ship.getIssues(3).some((issue) => issue.includes("K-F"))).toBe(false);
        expect(ship.getCBillCostLog()).toContain("Docking Collar (Prototype K-F Boom): 1,010,000");
        const copy = new SmallCraft(ship.exportJSON());
        expect(copy.getPrimitiveYear()).toBe(2460);
        expect(copy.getKFBoom()).toBe("prototype");
        ship.setKFBoom("standard");
        expect(ship.getIssues(3).some((issue) => issue.includes("2470"))).toBe(true);
    });

    it("imports MegaMek primitive armor as a Primitive DropShip (the Saturn Patrol Ship)", () => {
        const blk = [
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Saturn Patrol Ship", "</Name>", "<year>", "2243", "</year>",
            "<type>", "IS Level 4", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<collartype>", "2", "</collartype>",
            "<SafeThrust>", "5", "</SafeThrust>", "<heatsinks>", "29", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "4687", "</fuel>",
            "<armor_type>", "40", "</armor_type>", "<armor>", "110", "95", "95", "82", "</armor>",
            "<structural_integrity>", "15", "</structural_integrity>", "<tonnage>", "1200.0", "</tonnage>", "<designtype>", "1", "</designtype>",
        ].join("\n");
        const result = importSmallCraftBlk(blk);
        const ship = result.craft as SmallCraft;
        expect(result.issues).toEqual([]);
        expect(ship.getPrimitiveYear()).toBe(2243);
        expect(ship.getKFBoom()).toBe("none");
        expect(ship.getFreeHeatSinks() + ship.getAdditionalHeatSinks()).toBe(29);
        expect(ship.getFuelPoints()).toBe(4687);
        expect(ship.getTotalArmorPoints()).toBe(382);
        expect(ship.getUnallocatedArmorPoints()).toBeGreaterThanOrEqual(0);
    });
});

// Star League Ferro-Aluminum on a Clan Small Craft or DropShip, at Inner Sphere points per ton (#168).
describe("Star League Ferro-Aluminum on a Clan Small Craft", () => {
    const clanCraft = (era: string): SmallCraft => {
        const craft = new SmallCraft();
        craft.setTech("clan");
        craft.setEra(era);
        craft.setTonnage(200);
        return craft;
    };
    const offered = (craft: SmallCraft, tag: string) => craft.getAvailableArmorTypes().find((armor) => armor.tag === tag);

    it("offers it while the era holds the Star League version, at the Inner Sphere factor", () => {
        const craft = clanCraft("clan-founding-years");
        expect(offered(craft, "ferro-aluminum")?.available).toBe(true);
        expect(craft.setArmorType("ferro-aluminum").tag).toBe("ferro-aluminum");
        expect(craft.getArmorPointsPerTon()).toBe(17.92);
        craft.setArmorType("clan-ferro-aluminum");
        expect(craft.getArmorPointsPerTon()).toBe(24);
    });

    it("drops it once the Clan version is the only one in the era", () => {
        expect(offered(clanCraft("clan-golden-years"), "ferro-aluminum")).toBeUndefined();
    });
});
