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
