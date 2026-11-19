import { describe, expect, it } from "vitest";
import {
    getDropShipBaseCrew, getDropShipFreeHeatSinks, getDropShipFuelPointsPerTon, getDropShipMaxBayDoors,
    getDropShipStrategicFuelPerDay,
} from "../data/small-craft-construction";
import SmallCraft from "./small-craft";
import { importSmallCraftBlk } from "./small-craft-blk";

/** Dawn's Arcadia, the TechManual's worked Clan military aerodyne DropShip (TM pp.184-195). */
const buildArcadia = (): SmallCraft => {
    const ship = new SmallCraft();
    ship.setName("Arcadia");
    ship.setCraftType("dropShip");
    ship.setMilitary(true);
    ship.setTech("clan");
    ship.setShape("aerodyne");
    ship.setTonnage(3000);
    ship.setSafeThrust(6);
    ship.setFuelTons(200);
    ship.setStructuralIntegrity(11);
    ship.setArmorTons(49.5);
    ship.setHeatSinkType("double");
    ship.setAdditionalHeatSinks(160);
    ship.setQuarters("crew", 0);
    return ship;
};

/** Chris's Nekohono'o, the TechManual's worked Inner Sphere military spheroid DropShip (TM pp.184-195, 284-285). */
const buildNekohonoo = (): SmallCraft => {
    const ship = new SmallCraft();
    ship.setName("Nekohono'o");
    ship.setCraftType("dropShip");
    ship.setMilitary(true);
    ship.setTech("is");
    ship.setShape("spheroid");
    ship.setTonnage(16000);
    ship.setSafeThrust(5);
    ship.setFuelTons(400);
    ship.setStructuralIntegrity(16);
    ship.setArmorType("ferro-aluminum");
    ship.setArmorTons(57);
    ship.setHeatSinkType("double");
    ship.setAdditionalHeatSinks(107);
    ship.setQuarters("crew", 0);
    return ship;
};

describe("DropShip construction tables (TM pp.184-196)", () => {
    it("reads the Aerospace Fuel Table by DropShip weight (TM p.186)", () => {
        expect(getDropShipFuelPointsPerTon(200)).toBe(80);
        expect(getDropShipFuelPointsPerTon(2999)).toBe(40);
        expect(getDropShipFuelPointsPerTon(3000)).toBe(30);
        expect(getDropShipFuelPointsPerTon(100000)).toBe(10);
        expect(getDropShipStrategicFuelPerDay(16000, true)).toBe(1.84);
        expect(getDropShipStrategicFuelPerDay(16000, false)).toBe(4.22);
        expect(getDropShipStrategicFuelPerDay(999, false)).toBe(1.84);
    });

    it("gives 3 or 4 base crew and 1 for every 5,000 tons, rounded up (TM p.189)", () => {
        expect(getDropShipBaseCrew(16000, true)).toBe(8);
        expect(getDropShipBaseCrew(3000, true)).toBe(5);
        expect(getDropShipBaseCrew(3000, false)).toBe(4);
    });

    it("gives military DropShips more free heat sinks (TM p.193)", () => {
        expect(getDropShipFreeHeatSinks(5200, "spheroid", true)).toBe(188);
        expect(getDropShipFreeHeatSinks(1098, "aerodyne", true)).toBe(54);
        expect(getDropShipFreeHeatSinks(1098, "aerodyne", false)).toBe(18);
    });

    it("allows 7 bay doors plus the weight / 50,000, rounded up (TM p.196)", () => {
        expect(getDropShipMaxBayDoors(20000)).toBe(8);
        expect(getDropShipMaxBayDoors(80000)).toBe(9);
    });
});

describe("DropShip construction model", () => {
    it("builds the Arcadia step for step (TM pp.184-195)", () => {
        const ship = buildArcadia();
        expect(ship.getCraftTypeName()).toBe("DropShip");
        expect(ship.getMaxThrust()).toBe(9);
        expect(ship.getEngineWeight()).toBe(1098);
        expect(ship.getFuelPoints()).toBe(6000);
        expect(ship.getFuelPumpWeight()).toBe(4);
        expect(ship.getBurnDays()).toBe(108.7);
        expect([ship.getMinStructuralIntegrity(), ship.getMaxStructuralIntegrity()]).toEqual([9, 270]);
        expect(ship.getStructureWeight()).toBe(165);
        expect(ship.getControlsWeight()).toBe(23);
        expect(ship.getBaseCrew()).toBe(5);
        expect(ship.getMaxArmorTons()).toBe(49.5);
        expect(ship.getPurchasedArmorPoints()).toBe(990);
        expect(ship.getAvailableArmorPoints()).toBe(1034);
        expect(ship.getFreeHeatSinks()).toBe(54);
        expect(ship.getTotalHeatSinks()).toBe(214);
        expect(ship.getRemainingTonnage()).toBe(1300.5);
    });

    it("builds the Nekohono'o step for step (TM pp.184-195)", () => {
        const ship = buildNekohonoo();
        expect(ship.getMaxThrust()).toBe(8);
        expect(ship.getEngineWeight()).toBe(5200);
        expect(ship.getFuelPumpWeight()).toBe(8);
        expect(ship.getStructureWeight()).toBe(512);
        expect(ship.getControlsWeight()).toBe(120);
        expect(ship.getBaseCrew()).toBe(8);
        expect(ship.getMaxArmorTons()).toBe(57.5);
        expect(ship.getFreeHeatSinks()).toBe(188);
        expect(ship.getTotalHeatSinks()).toBe(295);
        expect(ship.getRemainingTonnage()).toBe(9596);
    });

    it("prices the Nekohono'o's structure as the cost example does, times 28 for a spheroid (TM pp.284-285)", () => {
        // The example's 12,491,600 includes life support for 261 aboard and gunnery control for 6 armed arcs;
        // this hull is unarmed and carries its minimum crew of 8: 12,491,600 - 1,305,000 - 60,000 + 40,000.
        const ship = buildNekohonoo();
        expect(ship.getCrew()).toBe(8);
        expect(ship.getCBillCost()).toBe(11166600 * 28);
    });

    it("keeps the weight inside the DropShip range for its shape (TM p.184)", () => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setShape("spheroid");
        expect(ship.setTonnage(100000)).toBe(100000);
        expect(ship.setTonnage(12345)).toBe(12300);
        ship.setTonnage(100000);
        ship.setShape("aerodyne");
        expect(ship.getTonnage()).toBe(35000);
        expect(ship.setTonnage(50)).toBe(200);
    });

    it("saves and loads the craft type and military flag", () => {
        const ship = buildArcadia();
        const copy = new SmallCraft(ship.exportJSON());
        expect(copy.isDropShip()).toBe(true);
        expect(copy.isMilitary()).toBe(true);
        expect(copy.getTonnage()).toBe(3000);
        expect(copy.getRemainingTonnage()).toBe(1300.5);
    });

    it("loads a save from before DropShips as a Small Craft", () => {
        const craft = new SmallCraft();
        const saved = craft.export(true) as unknown as Record<string, unknown>;
        delete saved.craftType;
        delete saved.military;
        const copy = new SmallCraft(JSON.stringify(saved));
        expect(copy.isDropShip()).toBe(false);
        expect(copy.getTonnage()).toBe(200);
    });
});

describe("DropShip capital weapons (TM pp.194, 210, 342)", () => {
    const buildShip = (): SmallCraft => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setMilitary(true);
        ship.setShape("spheroid");
        ship.setTonnage(10000);
        ship.setEra("clan-invasion");
        ship.setSafeThrust(3);
        ship.setFuelTons(300);
        return ship;
    };

    it("lets only DropShips mount capital missile launchers (TM p.210)", () => {
        const craft = new SmallCraft();
        expect(craft.addCapitalWeapon("killer-whale", "nose")).toBeNull();
        expect(craft.getAvailableCapitalWeapons().map((weapon) => weapon.tag)).not.toContain("killer-whale");
        expect(buildShip().getAvailableCapitalWeapons().map((weapon) => weapon.tag)).toContain("killer-whale");
        // Sub-capital weapons are TO:AUE equipment, offered from the advanced rules level.
        expect(buildShip().getAvailableCapitalWeapons(2).map((weapon) => weapon.tag)).not.toContain("light-scc");
    });

    it("weighs and prices the launcher with its missiles and gives it a gunner of its own", () => {
        const ship = buildShip();
        const before = ship.getRemainingTonnage();
        const gunners = ship.getMinimumGunners();
        const mount = ship.addCapitalWeapon("killer-whale", "nose");
        expect(mount?.shots).toEqual({ "killer-whale": 10 });
        // 150 tons of launcher and 10 missiles of 50 tons (TM p.210).
        expect(ship.getRemainingTonnage()).toBe(before - 650);
        expect(ship.getMinimumGunners()).toBe(gunners + 1);
        expect(ship.getCBillCostLog()).toContain("Killer Whale and ammunition: 350,000");
        expect(ship.getWeaponHeat()).toBe(20);
    });

    it("needs at least 10 shots for each launcher (TM pp.194, 210)", () => {
        const ship = buildShip();
        const mount = ship.addCapitalWeapon("barracuda", "nose");
        ship.setCapitalWeaponShots(mount?.uuid ?? "", "barracuda", 9);
        expect(ship.getIssues().some((issue) => issue.startsWith("Barracuda: 9 shots carried"))).toBe(true);
        ship.setCapitalWeaponShots(mount?.uuid ?? "", "barracuda", 10);
        expect(ship.getIssues().some((issue) => issue.startsWith("Barracuda:"))).toBe(false);
    });

    it("loads an AR-10 with the three standard missiles and takes the heat of the hottest it carries (TM p.342)", () => {
        const ship = buildShip();
        const mount = ship.addCapitalWeapon("ar-10-launcher", "nose");
        expect(Object.keys(mount?.shots ?? {})).toEqual(["killer-whale", "white-shark", "barracuda"]);
        ship.setCapitalWeaponShots(mount?.uuid ?? "", "killer-whale", 0);
        ship.setCapitalWeaponShots(mount?.uuid ?? "", "barracuda", 10);
        expect(ship.getCapitalWeaponHeat(mount!)).toBe(10);
        ship.setCapitalWeaponShots(mount?.uuid ?? "", "white-shark", 2);
        expect(ship.getCapitalWeaponHeat(mount!)).toBe(15);
        // 250 tons of launcher, 10 Barracudas at 30 and 2 White Sharks at 40.
        expect(ship.getCapitalWeaponWeight(mount!)).toBe(630);
        ship.setCapitalWeaponShots(mount?.uuid ?? "", "kraken-t", 10);
        expect(mount?.shots["kraken-t"]).toBeUndefined();
    });

    it("counts the launcher and its ammunition, capped at the launcher's value, in the Front arc", () => {
        const ship = buildShip();
        const empty = ship.getBattleValue();
        ship.addCapitalWeapon("killer-whale", "nose");
        // 769 for the launcher; 10 missiles at 96 cap at 769. Max Thrust 5 has a Speed Factor of 1.
        expect(ship.getBattleValue() - empty).toBe(769 * 2);
        expect(ship.getBattleValueLog()).toContain("Ammunition for Killer Whale = 769.00 (capped at weapon BV)");
    });

    // MegaMek caps a DropShip's ammunition arc by arc, against the weapons in the arc that use it.
    it("caps each arc's capital missiles at the value of that arc's launchers (TM p.312)", () => {
        const ship = buildShip();
        const nose = ship.addCapitalWeapon("killer-whale", "nose");
        const left = ship.addCapitalWeapon("killer-whale", "left");
        ship.setCapitalWeaponShots(left?.uuid ?? "", "killer-whale", 2);
        // The nose's 10 missiles at 96 cap at its launcher's 769; the left's 2 count 192.
        expect(nose && left).toBeTruthy();
        expect(ship.getBattleValueLog()).toContain("Ammunition for Killer Whale = 961.00 (capped at weapon BV)");
    });

    it("caps an Artemis launcher's rounds at the launcher's unmodified value (TM p.312)", () => {
        const ship = buildShip();
        ship.addEquipmentFromTag("lrm-20-artemis-iv", "nose");
        const bin = ship.addEquipmentFromTag("ammo-is-lrm-artemis-iv", "nose");
        ship.setAmmoBinTons(bin?.uuid, 8);
        // 8 tons at 23 is 184: over the LRM-20's 181, under the 217.2 it counts with Artemis IV.
        expect(ship.getBattleValueLog()).toContain("Ammunition for lrm-20-artemis-iv = 181.00 (capped at weapon BV)");
    });

    it("saves and loads its capital weapons", () => {
        const ship = buildShip();
        const mount = ship.addCapitalWeapon("ar-10-launcher", "aft");
        ship.setCapitalWeaponShots(mount?.uuid ?? "", "white-shark", 4);
        const copy = new SmallCraft(ship.exportJSON());
        expect(copy.getCapitalWeapons().map((entry) => [entry.weapon.tag, entry.location, entry.shots])).toEqual([
            ["ar-10-launcher", "aft", { "killer-whale": 10, "white-shark": 4, "barracuda": 0 }],
        ]);
        expect(copy.getRemainingTonnage()).toBe(ship.getRemainingTonnage());
    });

    it("reads capital launchers and their ammunition from a MegaMek DropShip file", () => {
        const blk = [
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Carrier", "</Name>", "<Model>", "TC-1", "</Model>", "<year>", "3067", "</year>",
            "<type>", "IS Level 3", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
            "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
            "<Nose Equipment>", "(B) Capital Missile Launcher (AR10 Launcher)", "Capital Missile Launcher (AR10 Launcher)", "Ammo AR10 Killer Whale:20",
            "Ammo AR10 Barracuda:5", "(B) Sub-Capital Cannon (Light)", "Ammo Light SCC:10", "</Nose Equipment>",
            // The Artemis IV line is not marked "(R)" though its launcher faces the rear.
            "<Left Side Equipment>", "(R) LRM 20", "ISArtemisIV", "</Left Side Equipment>",
            "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
        ].join("\n");
        const result = importSmallCraftBlk(blk);
        const ship = result.craft as SmallCraft;
        expect(ship.isDropShip()).toBe(true);
        // The bay's ammunition is split between its launchers.
        expect(ship.getCapitalWeapons().map((mount) => [mount.weapon.tag, mount.location, mount.shots])).toEqual([
            ["ar-10-launcher", "nose", { "killer-whale": 10, "white-shark": 0, "barracuda": 3 }],
            ["ar-10-launcher", "nose", { "killer-whale": 10, "white-shark": 0, "barracuda": 2 }],
            ["light-scc", "nose", { "light-scc": 10 }],
        ]);
        expect(ship.getBays()[0].amount).toBe(518);
        expect(ship.getArcItems("leftAft").map((item) => item.tag)).toEqual(["lrm-20-artemis-iv"]);
        expect(result.issues).toEqual([]);
    });
});

describe("K-F boom and docking collar hits (TW p.240; AeroTech 2 Revised pp.29-30, 48-49)", () => {
    it("destroys a DropShip's K-F boom: it cannot be carried through hyperspace", () => {
        const ship = buildArcadia();
        const log = ship.resolveAttack(12, "nose", 0, { natural12: true, criticalRolls: [8] });
        expect(ship.getInPlay().kfBoom).toBe(true);
        expect(log.join(" ")).toContain("cannot be carried through hyperspace");
        expect(ship.isDamaged()).toBe(true);
        expect(ship.resolveAttack(12, "nose", 0, { natural12: true, criticalRolls: [8] }).join(" ")).toContain("already destroyed");
    });

    it("destroys a DropShip's docking collar: no docking, and a ship already docked cannot disconnect", () => {
        const ship = buildArcadia();
        const log = ship.resolveAttack(8, "aft", 0, { natural12: true, criticalRolls: [8] }).join(" ");
        expect(ship.getInPlay().dockingCollar).toBe("destroyed");
        expect(log).toContain("cannot dock with a JumpShip or WarShip");
        expect(log).toContain("cannot disconnect");
    });

    it("leaves a Small Craft as it was: it has neither", () => {
        const craft = new SmallCraft();
        craft.setStructuralIntegrity(5);
        expect(craft.resolveAttack(12, "nose", 0, { natural12: true, criticalRolls: [8] }).join(" ")).toContain("a Small Craft has none, no effect");
        expect(craft.getInPlay().kfBoom).toBe(false);
        craft.setKFBoomDestroyed(true);
        craft.setDockingCollar("destroyed");
        expect(craft.getInPlay().kfBoom).toBe(false);
        expect(craft.getInPlay().dockingCollar).toBe("working");
    });

    it("gives the docking reminders and the modifiers its own damage brings", () => {
        const ship = buildArcadia();
        expect(ship.getDockingNotes()).toEqual([]);
        ship.setDockingCollar("damaged");
        ship.setKFBoomDestroyed(true);
        expect(ship.getDockingNotes()).toEqual([
            "K-F boom destroyed: the DropShip cannot be carried through hyperspace (AT2R p.30).",
            "Docking collar damaged: a docking attempt takes twice as long (AT2R pp.48-49).",
        ]);
        ship.setDockingCollar("destroyed");
        expect(ship.getDockingNotes()[1]).toBe("Docking collar destroyed: the DropShip cannot dock with a JumpShip or WarShip, and if already docked it cannot disconnect (AT2R p.29).");
        ship.setCriticalHits("leftThruster", 2);
        ship.setCriticalHits("sensors", 1);
        expect(ship.getDockingModifiers()).toEqual([
            { condition: "Thruster damage, 2 boxes", modifier: 2 },
            { condition: "Sensor damage, 1 box", modifier: 1 },
            { condition: "Docking unit is a DropShip under 5,000 tons", modifier: -1 },
        ]);
    });

    it("keeps the boom and collar through a save", () => {
        const ship = buildArcadia();
        ship.setKFBoomDestroyed(true);
        ship.setDockingCollar("damaged");
        const copy = new SmallCraft(ship.exportJSON());
        expect(copy.getInPlay().kfBoom).toBe(true);
        expect(copy.getInPlay().dockingCollar).toBe("damaged");
    });
});

describe("DropShip ammunition by weapon bay (TM pp.194-195, 312)", () => {
    // Two Gauss rifles and 12 tons in the nose, one and 5 tons aft, one rear-firing in each side with 2 tons.
    const importGaussShip = () => importSmallCraftBlk([
        "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Lighter", "</Name>", "<Model>", "TL-1", "</Model>", "<year>", "3067", "</year>",
        "<type>", "IS Level 2", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
        "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
        "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
        "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
        "<Nose Equipment>", "(B) ISGaussRifle", "ISGaussRifle", "IS Gauss Ammo:96", "</Nose Equipment>",
        "<Left Side Equipment>", "(R) (B) ISGaussRifle", "(R) IS Gauss Ammo:16", "</Left Side Equipment>",
        "<Right Side Equipment>", "(R) (B) ISGaussRifle", "(R) IS Gauss Ammo:16", "</Right Side Equipment>",
        "<Aft Equipment>", "(B) ISGaussRifle", "IS Gauss Ammo:40", "</Aft Equipment>",
        "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
    ].join("\n"));

    it("reads each ammunition line as one bin of whole tons in the bay's arc", () => {
        const result = importGaussShip();
        const ship = result.craft as SmallCraft;
        expect(ship.getEquipmentList().filter((item) => item.isAmmo).map((item) => [item.location, item.weight, ship.getAmmoBinShots(item)])).toEqual([
            ["nose", 12, 96], ["leftAft", 2, 16], ["rightAft", 2, 16], ["aft", 5, 40],
        ]);
        expect(result.issues).toEqual([]);
        // Ammunition is not one of an arc's weapons.
        expect(ship.getArcWeaponCount("nose")).toBe(2);
        expect(ship.getArcItems("nose").every((item) => !item.isAmmo)).toBe(true);
        // The sheet lists each bin with its arc and shots.
        expect(ship.getAmmoSheetLines()).toEqual([
            "Gauss Rifle - Standard Ammo (IS) (Nose) 96", "Gauss Rifle - Standard Ammo (IS) (Aft-Left) 16", "Gauss Rifle - Standard Ammo (IS) (Aft-Right) 16", "Gauss Rifle - Standard Ammo (IS) (Aft) 40",
        ]);
    });

    it("adds the ammunition located in each arc to that arc's Battle Value", () => {
        const ship = importGaussShip().craft as SmallCraft;
        // Gauss rifles at 320 and their ammunition at 40 a ton. Front (Nose): 640 + 480; Rear: (320 + 80) x 2 + 320 + 200.
        expect(ship.getBattleValueLog()).toContain("+ Front (Nose): 1120.00 x 1 = 1120.00");
        expect(ship.getBattleValueLog()).toContain("+ Rear (Aft-Left, Aft, Aft-Right): 1320.00 x 0.25 = 330.00");
    });

    it("keeps whole-ton bins and their arcs through a save", () => {
        const ship = importGaussShip().craft as SmallCraft;
        const nose = ship.getEquipmentList().find((item) => item.isAmmo && item.location === "nose")!;
        expect(ship.setAmmoBinTons(nose.uuid, 7.4)).toBe(7);
        const copy = new SmallCraft(ship.exportJSON());
        expect(copy.getEquipmentList().filter((item) => item.isAmmo).map((item) => [item.location, item.weight])).toEqual([
            ["nose", 7], ["leftAft", 2], ["rightAft", 2], ["aft", 5],
        ]);
        expect(copy.getRemainingTonnage()).toBe(ship.getRemainingTonnage());
    });

    it("buys Small Craft ammunition by the one-ton bin, in the bay of its weapon", () => {
        const craft = new SmallCraft();
        craft.addEquipmentFromTag("standard-gauss-rifle", "nose");
        const bin = craft.addEquipmentFromTag("ammo-is-gauss-rifle-standard", "nose")!;
        expect(bin.location).toBe("nose");
        expect(craft.setAmmoBinTons(bin.uuid, 4)).toBe(0);
        expect(bin.weight).toBe(1);
    });
});

describe("DropShip ammunition feeds the launchers of its own bays", () => {
    // One kind of LRM round feeds every size of launcher; its BV a ton is that of the launcher it feeds (TM p.312).
    it("counts LRM rounds at the rate of the launcher in their arc", () => {
        const result = importSmallCraftBlk([
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Lighter", "</Name>", "<Model>", "TL-5", "</Model>", "<year>", "3067", "</year>",
            "<type>", "IS Level 2", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
            "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
            "<Nose Equipment>", "(B) ISLRM20", "IS Ammo LRM-20:24", "</Nose Equipment>",
            "<Aft Equipment>", "(B) ISLRM10", "IS Ammo LRM-10:24", "</Aft Equipment>",
            "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
        ].join(String.fromCharCode(10)));
        expect(result.issues).toEqual([]);
        const ship = result.craft as SmallCraft;
        const log = ship.getBattleValueLog();
        expect(log).toContain("Ammunition for lrm-20 = 92.00");
        expect(log).toContain("Ammunition for lrm-10 = 22.00");
    });

    it("counts each line's rounds at the rate of the launcher the line feeds (TM p.312)", () => {
        const result = importSmallCraftBlk([
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Lighter", "</Name>", "<Model>", "TL-8", "</Model>", "<year>", "3067", "</year>",
            "<type>", "IS Level 2", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
            "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
            "<Nose Equipment>", "(B) LRM 20", "LRM 15", "IS Ammo LRM-20 Artemis-capable:12", "IS Ammo LRM-15 Artemis-capable:16",
            "ISArtemisIV", "ISArtemisIV", "</Nose Equipment>",
            "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
        ].join(String.fromCharCode(10)));
        expect(result.issues).toEqual([]);
        // One kind of Artemis LRM round in one bay: the LRM-15's 2 tons count 17 a ton, not the LRM-20's 23.
        const ship = result.craft as SmallCraft;
        expect(ship.getBattleValueLog()).toContain("Ammunition for lrm-15-artemis-iv = 34.00");
        expect(ship.getBattleValueLog()).toContain("Ammunition for lrm-20-artemis-iv = 46.00");
        // The bins keep the launcher they feed through a save.
        expect(new SmallCraft(ship.exportJSON()).getBattleValueLog()).toContain("Ammunition for lrm-15-artemis-iv = 34.00");
    });

    it("reads an MML line's shots at the rate of its own kind of round", () => {
        const result = importSmallCraftBlk([
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Lighter", "</Name>", "<Model>", "TL-9", "</Model>", "<year>", "3080", "</year>",
            "<type>", "IS Level 2", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
            "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
            "<Nose Equipment>", "(B) ISMML9", "IS Ammo MML-9 LRM Artemis-capable:52", "IS Ammo MML-9 SRM Artemis-capable:176", "ISArtemisIV", "</Nose Equipment>",
            "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
        ].join(String.fromCharCode(10)));
        expect(result.issues).toEqual([]);
        // An MML-9 fires 13 LRM or 11 SRM salvos a ton (TM p.207): 52 LRM shots are 4 tons, 176 SRM shots 16.
        const bins = (result.craft as SmallCraft).getEquipmentList().filter((item) => item.isAmmo);
        expect(bins.map((bin) => bin.weight)).toEqual([4, 16]);
        expect(bins.map((bin) => (result.craft as SmallCraft).getAmmoBinShots(bin))).toEqual([52, 176]);
    });

    it("caps each arc's rounds at the value of that arc's launchers (TM p.312)", () => {
        const result = importSmallCraftBlk([
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Lighter", "</Name>", "<Model>", "TL-6", "</Model>", "<year>", "3067", "</year>",
            "<type>", "IS Level 2", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
            "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
            "<Nose Equipment>", "(B) LRM 20", "IS Ammo LRM-20:120", "</Nose Equipment>",
            "<Aft Equipment>", "(B) LRM 20", "IS Ammo LRM-20:6", "</Aft Equipment>",
            "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
        ].join(String.fromCharCode(10)));
        expect(result.issues).toEqual([]);
        // 20 tons at 23 in the nose cap at its launcher's 181; the aft's ton counts 23.
        expect((result.craft as SmallCraft).getBattleValueLog()).toContain("Ammunition for lrm-20 = 204.00 (capped at weapon BV)");
    });
});

describe("DropShip Artemis launchers and their rounds", () => {
    // The file lists the fire control before its launchers, and an MML line names its LRM or SRM rounds.
    it("fits Artemis IV to MMLs and Clan LRMs and reads their Artemis-capable ammunition (TM p.207)", () => {
        const result = importSmallCraftBlk([
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Lighter", "</Name>", "<Model>", "TL-2", "</Model>", "<year>", "3067", "</year>",
            "<type>", "Mixed (IS Chassis)", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
            "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
            "<Nose Equipment>", "ISArtemisIV", "(B) ISMML9", "IS Ammo MML-9 LRM Artemis-capable:13", "IS Ammo MML-9 SRM Artemis-capable:11", "</Nose Equipment>",
            "<Aft Equipment>", "(B) CLLRM20", "Clan Ammo LRM-20 (Clan) Artemis-capable:12", "CLArtemisIV", "</Aft Equipment>",
            "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
        ].join(String.fromCharCode(10)));
        const ship = result.craft as SmallCraft;
        expect(result.issues).toEqual([]);
        expect(ship.getEquipmentList().map((item) => [item.tag, item.location, item.weight])).toEqual([
            ["mml-9-artemis-iv", "nose", expect.any(Number)], ["clan-lrm-20-artemis-iv", "aft", expect.any(Number)],
            ["ammo-is-lrm-artemis-iv", "nose", 1], ["ammo-is-srm-artemis-iv", "nose", 1], ["ammo-clan-lrm-artemis-iv", "aft", 2],
        ]);
    });

    // The file lists a capacitor apart from its PPC and does not mark it "(R)" for a rear-facing one.
    it("fits each PPC Capacitor to a PPC in its arc (TO:AUE p.131)", () => {
        const result = importSmallCraftBlk([
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Lighter", "</Name>", "<Model>", "TL-3", "</Model>", "<year>", "3067", "</year>",
            "<type>", "IS Level 3", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
            "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
            "<Left Side Equipment>", "(B) ISERPPC", "ISERPPC", "(R) (B) PPC", "PPC Capacitor", "PPC Capacitor", "PPC Capacitor", "</Left Side Equipment>",
            "<Right Side Equipment>", "(B) ISERPPC", "ISERPPC", "(R) (B) ISPPC", "PPC Capacitor", "PPC Capacitor", "PPC Capacitor", "</Right Side Equipment>",
            "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
        ].join(String.fromCharCode(10)));
        const ship = result.craft as SmallCraft;
        expect(result.issues).toEqual([]);
        expect(ship.getArcItems("left").map((item) => item.tag)).toEqual(["er-ppc-capacitor", "er-ppc-capacitor"]);
        expect(ship.getArcItems("leftAft").map((item) => item.tag)).toEqual(["ppc-capacitor"]);
        expect(ship.getArcItems("rightAft").map((item) => item.tag)).toEqual(["ppc-capacitor"]);
    });
});

describe("DropShip bay quirks from a MegaMek file", () => {
    // MegaMek names a weapon quirk's bay by its class: "PPC Bay", "AC Bay", "Pulse Laser Bay". Point Defense, Pulse Laser
    // and LB-X AC are bay classes of their own (TM p.195).
    it("puts a quirk named for a bay on that class of bay in its arc", () => {
        const result = importSmallCraftBlk([
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Lighter", "</Name>", "<Model>", "TL-4", "</Model>", "<year>", "3145", "</year>",
            "<type>", "IS Level 3", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
            "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
            "<Nose Equipment>", "(B) ISERPPC", "ISERPPC", "(B) ISRotaryAC5", "ISRotaryAC5 Ammo:40", "</Nose Equipment>",
            "<Aft Equipment>", "(B) ISERLargeLaser", "(B) ISLargePulseLaser", "(B) ISAntiMissileSystem", "ISAMS Ammo:24", "</Aft Equipment>",
            "<weaponQuirks>", "mod_weapons:NOS:1:PPC Bay", "mod_weapons:NOS:4:AC Bay", "mod_weapons:AFT:2:Pulse Laser Bay", "mod_weapons:AFT:3:AMS Bay", "</weaponQuirks>",
            "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
        ].join(String.fromCharCode(10)));
        const ship = result.craft as SmallCraft;
        expect(result.issues).toEqual([]);
        const tagsOf = (uuids: string[] | undefined) => (uuids ?? []).map((uuid) => ship.getEquipmentList().find((item) => item.uuid === uuid)?.tag);
        expect(ship.quirks.getAll().map((quirk) => [quirk.tag, tagsOf(quirk.bayUuids)])).toEqual([
            ["quirk-modular-weapons", ["er-ppc", "er-ppc"]],
            ["quirk-modular-weapons", ["rotary-ac-5"]],
            ["quirk-modular-weapons", ["large-pulse-laser"]],
            ["quirk-modular-weapons", ["is-ams"]],
        ]);
    });
});

describe("DropShip cruise missiles", () => {
    it("count their heat against the DropShip's Heat Efficiency (TO:AUE p.216)", () => {
        const result = importSmallCraftBlk([
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Test Lighter", "</Name>", "<Model>", "TL-7", "</Model>", "<year>", "3100", "</year>",
            "<type>", "IS Level 4", "</type>", "<motion_type>", "Spheroid", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<transporters>", "crewquarters:140.0:0:-1::-1:0", "cargobay:518.0:2:1::-1:0", "</transporters>",
            "<SafeThrust>", "3", "</SafeThrust>", "<heatsinks>", "100", "</heatsinks>", "<sink_type>", "0", "</sink_type>", "<fuel>", "3000", "</fuel>",
            "<armor_type>", "41", "</armor_type>", "<armor>", "200", "180", "180", "150", "</armor>",
            "<Nose Equipment>", "(B) ISCruiseMissile50", "ISCruiseMissile50Ammo:10", "</Nose Equipment>",
            "<structural_integrity>", "10", "</structural_integrity>", "<tonnage>", "10000.0", "</tonnage>", "<crew>", "20", "</crew>",
        ].join(String.fromCharCode(10)));
        // The table gives a Cruise Missile/50 no separate Aero heat: its 50 counts for aerospace units too.
        expect((result.craft as SmallCraft).getBattleValueLog()).toContain("Nose: weapons 601.00, heat 50");
    });
});

describe("DropShip Battle Value worked example (BV v4.1 pp.20-22)", () => {
    // The Dragau II of the example (= TM p.314): 1,372 points of armor, SI 15, Safe Thrust 9, 122 double heat sinks (244),
    // 6 AMS with 10 tons of rounds, 8 tons of heavy Gauss ammunition and 6 tons of LRM 15 ammunition in each wing.
    it("values the Dragau II at 14,243: Defensive 3,762 + Offensive 4,852.1 x 2.16", () => {
        const wing = ["(B) LRM 15", "LRM 15", "IS Ammo LRM-15 Artemis-capable:48", "ISArtemisIV", "ISArtemisIV", "(B) ISERPPC", "ISERPPC",
            "(B) ISLargeVSPLaser", "ISLargeVSPLaser", "(R) (B) ISLargeVSPLaser", "(R) ISLargeVSPLaser"];
        const result = importSmallCraftBlk([
            "<UnitType>", "Dropship", "</UnitType>", "<Name>", "Dragau II", "</Name>", "<Model>", "", "</Model>", "<year>", "3085", "</year>",
            "<type>", "IS Level 3", "</type>", "<motion_type>", "Aerodyne", "</motion_type>", "<designtype>", "1", "</designtype>",
            "<SafeThrust>", "9", "</SafeThrust>", "<heatsinks>", "122", "</heatsinks>", "<sink_type>", "1", "</sink_type>", "<fuel>", "6960", "</fuel>",
            "<armor_type>", "20", "</armor_type>", "<armor>", "444", "336", "336", "256", "</armor>",
            "<Nose Equipment>", "(B) ISHeavyGaussRifle", "ISHeavyGaussRifle", "ISHeavyGauss Ammo:32",
            "(B) Heavy PPC", "Heavy PPC", "Heavy PPC", "(B) Heavy PPC", "Heavy PPC", "Heavy PPC", "(B) ISAntiMissileSystem", "ISAntiMissileSystem", "ISAMS Ammo:48", "</Nose Equipment>",
            "<Left Side Equipment>", ...wing, "</Left Side Equipment>",
            "<Right Side Equipment>", ...wing, "</Right Side Equipment>",
            "<Aft Equipment>", "(B) ISLargeVSPLaser", "ISLargeVSPLaser", "(B) ISERMediumLaser", "ISERMediumLaser",
            "(B) ISAntiMissileSystem", "ISAntiMissileSystem", "ISAntiMissileSystem", "ISAntiMissileSystem", "ISAMS Ammo:72", "</Aft Equipment>",
            "<structural_integrity>", "15", "</structural_integrity>", "<tonnage>", "2500.0", "</tonnage>", "<crew>", "13", "</crew>",
        ].join(String.fromCharCode(10)));
        const ship = result.craft as SmallCraft;
        expect(result.issues).toEqual([]);
        expect(ship.getBattleValue()).toBe(14243);
    });
});
