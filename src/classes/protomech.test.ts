import { describe, expect, it } from "vitest";
import { getProtoMechLocationLimit, getProtoMechStructureRow, protoMechMissiles, protoMechStructureTable } from "../data/protomech-construction";
import ProtoMech, { PROTOMECH_HIT_LOCATIONS, getProtoMechCatalogItems, normalizeProtoMechExport } from "./protomech";
import { importProtoMechBlk } from "./protomech-blk";

/** Lara's Delphyne-2, the 9-ton worked example (TM pp.81-89). */
const delphyne = (): ProtoMech => {
    const proto = new ProtoMech();
    proto.setName("Delphyne-2");
    proto.setTons(9);
    proto.setWalkMP(5);
    proto.setJump("standard", 5);
    proto.setArmor("torso", 16);
    proto.setArmor("head", 6);
    proto.setArmor("la", 4);
    proto.setArmor("ra", 4);
    proto.setArmor("legs", 10);
    proto.addMount("er-micro-laser", "la");
    proto.addMount("er-micro-laser", "ra");
    proto.addMount("pm-srm", "torso", 3);
    proto.addMount("pm-srm", "torso", 3);
    proto.updateMount(2, { shots: 10 });
    proto.updateMount(3, { shots: 10 });
    return proto;
};

describe("ProtoMech construction (TM pp.80-89)", () => {
    it("builds the Delphyne-2 to exactly 9 tons", () => {
        const proto = delphyne();
        expect(proto.getStructureWeight()).toBe(900);
        expect(proto.getRunMP()).toBe(8);
        // 9 tons x 8 Running MP = 72, rounded up to the Master Engine Table's 75, which weighs 2 tons (TM p.84).
        expect(proto.getEngineRating()).toBe(72);
        expect(proto.getInstalledEngineRating()).toBe(75);
        expect(proto.getEngineWeight()).toBe(2000);
        expect(proto.getJumpWeight()).toBe(500);
        expect(proto.getHeatSinks()).toBe(2);
        expect(proto.getArmorWeight()).toBe(2000);
        expect(proto.getAmmoLoads()).toEqual([{ name: "SRM 3", shots: 20, kg: 600 }]);
        expect(proto.getWeight()).toBe(9000);
        expect(proto.getIssues()).toEqual([]);
    });

    it("builds the Siren-4 with 25 kg wasted and a boosted Running MP of 20", () => {
        const proto = new ProtoMech();
        proto.setTons(3);
        proto.setWalkMP(10);
        proto.setMyomerBooster(true);
        proto.setArmor("torso", 5);
        proto.setArmor("head", 2);
        proto.setArmor("la", 1);
        proto.setArmor("ra", 1);
        proto.setArmor("legs", 3);
        proto.addMount("er-micro-laser", "torso");
        expect(proto.getInstalledEngineRating()).toBe(45);
        expect(proto.getEngineWeight()).toBe(1000);
        expect(proto.getMyomerBoosterWeight()).toBe(75);
        expect(proto.getBoostedRunMP()).toBe(20);
        expect(proto.getMovementText()).toBe("10 / 15 (20) / 0");
        expect(proto.getRemainingWeight()).toBe(25);
        expect(proto.isLegal()).toBe(true);
    });

    it("weighs an engine under rating 40 at 25 kg a point: the Hydra's 36 is 900 kg", () => {
        const proto = new ProtoMech();
        proto.setTons(6);
        proto.setWalkMP(4);
        expect(proto.getEngineRating()).toBe(36);
        expect(proto.getEngineWeight()).toBe(900);
        proto.setMainGun(true);
        proto.addMount("pm-streak-srm", "mainGun", 3);
        proto.updateMount(0, { shots: 10 });
        expect(proto.getMountWeight(proto.getMounts()[0])).toBe(1500);
        expect(proto.getAmmoLoads()[0].kg).toBe(300);
    });

    it("limits each location's items and weight", () => {
        const proto = new ProtoMech();
        proto.setTons(5);
        proto.addMount("er-medium-laser-clan", "la");
        expect(proto.getIssues().some((issue) => issue.includes("Left Arm: 1000 kg"))).toBe(true);
        proto.removeMount(0);
        proto.addMount("er-micro-laser", "torso");
        proto.addMount("er-micro-laser", "torso");
        proto.addMount("er-micro-laser", "torso");
        expect(proto.getIssues().some((issue) => issue.includes("Torso: 3 items, over the limit of 2"))).toBe(true);
        // The main gun exists only when chosen, and takes one item of any weight.
        expect(proto.addMount("clan-er-large-laser", "mainGun")).toBe(false);
        proto.setMainGun(true);
        expect(proto.addMount("clan-er-large-laser", "mainGun")).toBe(true);
        proto.setMainGun(false);
        expect(proto.getMounts().some((mount) => mount.location === "mainGun")).toBe(false);
    });

    it("needs heat sinks for energy weapons only, and none for chemical lasers (TM p.86; TO:AUE p.131)", () => {
        const proto = new ProtoMech();
        proto.setTons(9);
        proto.addMount("er-medium-laser-clan", "torso");
        expect(proto.getHeatSinks()).toBe(5);
        proto.addMount("clan-medium-chemical-laser", "torso");
        proto.addMount("clan-machine-gun", "la");
        expect(proto.getHeatSinks()).toBe(5);
        // Chemical laser ammunition: 1,000 kg / 30 shots; 15 shots are 500 kg (Svartalfa Ultra, TRO: Prototypes p.91).
        proto.updateMount(1, { shots: 15 });
        expect(proto.getAmmoLoads()[0]).toEqual({ name: "Medium Chemical Laser", shots: 15, kg: 500 });
        expect(proto.getShotWeight(proto.getMounts()[2])).toBe(5);
    });

    it("adds LRM ammunition by missile and rounds the total up to the kilogram", () => {
        const proto = new ProtoMech();
        proto.addMount("pm-lrm", "la", 2);
        proto.addMount("pm-lrm", "ra", 2);
        proto.updateMount(0, { shots: 4 });
        proto.updateMount(1, { shots: 2 });
        // 12 missiles x 8.33 kg = 99.96 kg.
        expect(proto.getAmmoLoads()).toEqual([{ name: "LRM 2", shots: 6, kg: 100 }]);
    });

    it("offers the plasma cannon, which the ammunition table lists (TM p.88), and no fixed-size missile racks", () => {
        const tags = getProtoMechCatalogItems().map((item) => item.tag);
        expect(tags).toContain("plasma-cannon");
        expect(tags).toContain("er-micro-laser");
        expect(tags).not.toContain("clan-lrm-5");
        expect(tags).not.toContain("clan-streak-srm-2");
    });
});

describe("Ultraheavy, Quad and Glider ProtoMechs (IO:AE pp.93-96)", () => {
    it("holds the table to its Armor Factor column", () => {
        for (const row of protoMechStructureTable) {
            const biped = row.head.maxArmor + row.torso.maxArmor + 2 * row.arm.maxArmor + row.legs.maxArmor;
            const quad = row.head.maxArmor + row.torso.maxArmor + row.quadLegs.maxArmor;
            expect(quad).toBe(biped);
        }
        // 17 at 3 tons and 51 at 10 tons without a main gun; the printed arm limit of 4 at 3 to 5 tons would break this.
        expect(getProtoMechStructureRow(3).arm.maxArmor).toBe(2);
        const ten = getProtoMechStructureRow(10);
        expect(ten.head.maxArmor + ten.torso.maxArmor + 2 * ten.arm.maxArmor + ten.legs.maxArmor).toBe(51);
        expect(ten.mainGun.maxArmor).toBe(6);
    });

    it("gives a Quad no arms, a larger torso and two MP for nothing", () => {
        const proto = new ProtoMech();
        proto.setTons(7);
        proto.setChassis("quad");
        proto.setWalkMP(5);
        expect(proto.getLocations()).toEqual(["head", "torso", "legs"]);
        expect(proto.getEngineRating()).toBe(42);
        expect(proto.getStructure("legs")).toBe(8);
        expect(getProtoMechLocationLimit("quad", 7, "torso")).toEqual({ items: 4, maxKg: 5000 });
        expect(getProtoMechLocationLimit("quad", 13, "mainGun")).toEqual({ items: 2, maxKg: null });
        expect(proto.addMount("er-micro-laser", "la")).toBe(false);
        expect(proto.addMount("protomech-quad-melee-system", "torso")).toBe(true);
        expect(proto.getFrenzyDamage()).toBe(2 + 4);
    });

    it("builds a Glider on the Ultraheavy chassis with WiGE movement and no jump jets", () => {
        const proto = new ProtoMech();
        proto.setJump("standard", 2);
        proto.setChassis("glider");
        expect(proto.getTons()).toBe(10);
        expect(proto.getJumpType()).toBe("none");
        proto.setTons(14);
        proto.setWalkMP(5);
        expect(proto.getEngineRating()).toBe(14 * 6);
        expect(proto.getCockpitWeight()).toBe(750);
        expect(proto.getGroundRunMP()).toBe(1);
        expect(proto.getMovementText()).toBe("1 / 1 on the ground; WiGE 5 / 8");
        expect(proto.getRequiredRulesLevel()).toBe(3);
    });

    it("takes a torso item for EDP armor and weighs it at 75 kg a point (IO:AE p.59)", () => {
        const proto = new ProtoMech();
        proto.setTons(7);
        proto.setArmorType("edp");
        proto.setArmor("torso", 10);
        expect(proto.getArmorWeight()).toBe(750);
        expect(proto.getLocationItems("torso")).toBe(1);
        expect(proto.getRequiredRulesLevel()).toBe(4);
    });

    it("weighs the magnetic clamp and partial wing by the ProtoMech's tonnage", () => {
        const proto = new ProtoMech();
        proto.setTons(5);
        proto.addMount("protomech-magnetic-clamp", "torso");
        expect(proto.getMountWeight(proto.getMounts()[0])).toBe(250);
        proto.setTons(9);
        expect(proto.getMountWeight(proto.getMounts()[0])).toBe(500);
        proto.setTons(10);
        expect(proto.getMountWeight(proto.getMounts()[0])).toBe(1000);
        proto.addMount("protomech-partial-wing", "torso");
        expect(proto.getMountWeight(proto.getMounts()[1])).toBe(2000);
        proto.setJump("standard", 2);
        expect(proto.getJumpMP()).toBe(4);
        proto.setChassis("quad");
        expect(proto.getIssues().some((issue) => issue.includes("Magnetic Clamp System cannot be mounted on a Quad"))).toBe(true);
    });
});

describe("ProtoMech Battle Value and cost", () => {
    it("values the Delphyne-2 at 316 (TM p.307)", () => {
        const proto = delphyne();
        expect(proto.getTotalStructure()).toBe(20);
        expect(proto.getBattleValue()).toBe(316);
        expect(proto.getBattleValueLog().some((line) => line.includes("x 1.76"))).toBe(true);
        expect(proto.getPointBattleValue()).toBe(316 * 5);
    });

    it("costs the Delphyne-2 741,700 + 80,000 C-bills, x 1.09 (TM pp.279-285)", () => {
        expect(delphyne().getCBillCost()).toBe(Math.round(821700 * 1.09));
    });

    it("prices tube launchers by the tube except at standard rack sizes (TM p.283)", () => {
        const srm = protoMechMissiles.find((missile) => missile.family === "srm");
        expect(srm?.costPerTube).toBe(10000);
        expect(srm?.standardCost[4]).toBe(60000);
    });

    it("adds 1 to the speed factor's MP for a myomer booster (TM p.306)", () => {
        const proto = new ProtoMech();
        proto.setTons(5);
        proto.setWalkMP(6);
        proto.addMount("ap-gauss-rifle", "torso");
        proto.updateMount(0, { shots: 10 });
        const before = proto.getBattleValueLog().join("\n");
        proto.setMyomerBooster(true);
        const after = proto.getBattleValueLog().join("\n");
        expect(before).toContain("(Speed Factor, 9)");
        expect(after).toContain("(Speed Factor, 10)");
        // The boosted Running MP of 12 raises the target movement modifier from +3 to +4.
        expect(after).toContain("target movement modifier +4");
    });

    it("holds ammunition to the weapon's own value and reads the Piloting 5 column for skill", () => {
        const proto = new ProtoMech();
        proto.addMount("clan-machine-gun", "torso");
        proto.updateMount(0, { shots: 500 });
        expect(proto.getBattleValueLog().some((line) => line.includes("Ammunition: Machine Gun"))).toBe(true);
        proto.setGunnery(3);
        expect(proto.getSkillMultiplier()).toBeGreaterThan(1);
    });
});

describe("ProtoMech play (TW pp.185-187)", () => {
    it("passes damage beyond a location to the torso and tracks each ProtoMech of the Point apart", () => {
        const proto = delphyne();
        expect(PROTOMECH_HIT_LOCATIONS[3]).toBeNull();
        expect(PROTOMECH_HIT_LOCATIONS[12]).toBe("head");
        // An arm: 4 armor and 2 structure.
        const log = proto.applyDamage(0, "la", 8);
        expect(proto.isLocationDestroyed(0, "la")).toBe(true);
        expect(proto.getArmorLeft(0, "torso")).toBe(14);
        expect(log.join(" ")).toContain("Left Arm destroyed");
        expect(proto.isMountLost(0, 0)).toBe(true);
        expect(proto.isUnitDamaged(1)).toBe(false);
        // No main gun: the hit goes to the torso.
        proto.applyDamage(1, "mainGun", 3);
        expect(proto.getArmorLeft(1, "torso")).toBe(13);
    });

    it("slows the ProtoMech for leg hits and destroys it on the third torso hit", () => {
        const proto = delphyne();
        proto.setCriticals(0, "legs", 1);
        expect(proto.getPlayMovement(0).walk).toBe(4);
        proto.setCriticals(0, "legs", 2);
        expect(proto.getPlayMovement(0).walk).toBe(2);
        proto.setCriticals(0, "torso", 2);
        expect(proto.getPlayMovement(0).jump).toBe(2);
        proto.setCriticals(0, "torso", 3);
        expect(proto.isUnitDestroyed(0)).toBe(true);
        expect(proto.getActiveUnits()).toBe(4);
    });
});

describe("ProtoMech saves and MegaMek files", () => {
    it("round-trips a design with its play state", () => {
        const proto = delphyne();
        proto.applyDamage(2, "head", 3);
        proto.setShotsFired(0, 2, 4);
        const copy = new ProtoMech(proto.exportJSON());
        expect(copy.export()).toEqual(proto.export());
        expect(copy.getShotsLeft(0, 2)).toBe(6);
        expect(copy.getBattleValue()).toBe(316);
        expect(new ProtoMech(JSON.stringify(proto.export(true))).isDamaged()).toBe(false);
    });

    it("refuses what is not a ProtoMech and drops unknown equipment with a note", () => {
        expect(normalizeProtoMechExport({ name: "x" }).proto).toBeNull();
        expect(normalizeProtoMechExport([]).proto).toBeNull();
        const data = delphyne().export();
        data.mounts.push({ tag: "no-such-thing", location: "torso" });
        const result = normalizeProtoMechExport(data);
        expect(result.proto?.mounts.length).toBe(4);
        expect(result.issues[0]).toContain("no-such-thing");
        const broken = new ProtoMech();
        expect(broken.importJSON("{")).toBe(false);
    });

    it("reads a MegaMek ProtoMech file", () => {
        const text = [
            "<UnitType>", "ProtoMek", "</UnitType>", "<Name>", "Test", "</Name>", "<Model>", "2", "</Model>", "<year>", "3063", "</year>",
            "<motion_type>", "Biped", "</motion_type>", "<cruiseMP>", "6", "</cruiseMP>", "<jumpingMP>", "0", "</jumpingMP>",
            "<armor_type>", "42", "</armor_type>", "<armor>", "3", "7", "2", "2", "4", "3", "</armor>",
            "<Body Equipment>", "Clan Ammo SRM-2 (10)", "EIInterface", "</Body Equipment>",
            "<Torso Equipment>", "CLSRM2", "Mystery Gun", "</Torso Equipment>", "<tonnage>", "5.0", "</tonnage>",
        ].join("\n");
        const { proto, issues } = importProtoMechBlk(text);
        expect(proto?.getName()).toBe("Test 2");
        expect(proto?.getTons()).toBe(5);
        expect(proto?.hasMainGun()).toBe(true);
        expect(proto?.getTotalArmor()).toBe(21);
        expect(proto?.getMounts()).toEqual([{ tag: "pm-srm", location: "torso", tubes: 2, shots: 10 }]);
        expect(proto?.getEra().tag).toBe("civil-war");
        expect(issues).toEqual(["Unknown or unmountable equipment 'Mystery Gun' (Torso) was left off."]);
        expect(importProtoMechBlk("<UnitType>\nBattleArmor\n</UnitType>").proto).toBeNull();
    });
});

describe("ProtoMech designs in print", () => {
    it("matches the Svartalfa Ultra's weights (TRO: Prototypes p.91)", () => {
        const proto = new ProtoMech();
        proto.setChassis("glider");
        proto.setTons(14);
        proto.setWalkMP(4);
        proto.setMainGun(true);
        // Printed armor: head 9, torso 23, arms 6 each, legs 14, main gun 7. The main gun's limit is 6 (IO:AE p.96),
        // so the printed 65 points become 64 here.
        (["head", "torso", "la", "ra", "legs", "mainGun"] as const).forEach((location, index) => proto.setArmor(location, [9, 23, 6, 6, 14, 7][index]));
        proto.addMount("clan-medium-chemical-laser", "ra");
        proto.addMount("clan-medium-chemical-laser", "la");
        proto.addMount("clan-machine-gun", "torso");
        proto.addMount("pm-streak-srm", "mainGun", 6);
        [15, 15, 50, 10].forEach((shots, index) => proto.updateMount(index, { shots }));
        expect(proto.getInstalledEngineRating()).toBe(60);
        expect(proto.getEngineWeight()).toBe(1500);
        expect(proto.getHeatSinks()).toBe(0);
        expect(proto.getAmmoLoads().map((load) => load.kg)).toEqual([1000, 250, 600]);
        expect(proto.getTotalArmor()).toBe(64);
        expect(proto.getRemainingWeight()).toBe(50);
        expect(proto.isLegal()).toBe(true);
        // The printed Battle Value of 540 counts the 65th armor point: 2.5 x 1.4 = 3.5 more than this.
        expect(proto.getBattleValue()).toBe(536);
    });
});
