import { describe, expect, it } from "vitest";
import { findCalcDefProblems } from "../data/calc-steps";
import { PROTOMECH_BV1_STEPS, PROTOMECH_BV2_STEPS, PROTOMECH_COST_STEPS } from "../data/calc-steps-protomech";
import { PROTOMECH_ADVANCED_RULES_LEVEL, PROTOMECH_RULES_LEVEL, getProtoMechLocationLimit, getProtoMechStructureRow, protoMechMissiles, protoMechStructureTable } from "../data/protomech-construction";
import ProtoMech, { PROTOMECH_HIT_LOCATIONS, formatProtoMechASDamage, getProtoMechCatalogItems, normalizeProtoMechExport } from "./protomech";
import { importProtoMechBlk } from "./protomech-blk";
import { BattleMechGroup } from "./battlemech-group";

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

    it("values the quad melee system at the whole Frenzy damage x 1.25 (IO:AE p.190; user ruling 2026-11-02)", () => {
        const proto = new ProtoMech();
        proto.setTons(7);
        proto.setChassis("quad");
        proto.addMount("protomech-quad-melee-system", "torso");
        // Base Frenzy 2 + the system's 2 x 2 = 6 damage, x 1.25.
        expect(proto.getBattleValueLog().some((line) => line.startsWith("ProtoMech Quad Melee Weapon System (Torso): 7.5 (TM p.306; IO:AE p.190)"))).toBe(true);
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

    it("brings a MegaMek file's Technical Readout fields across (TRO round 2, #78)", () => {
        const text = [
            "<UnitType>", "ProtoMek", "</UnitType>", "<Name>", "Test", "</Name>", "<Model>", "2", "</Model>",
            "<cruiseMP>", "6", "</cruiseMP>", "<armor>", "3", "7", "2", "2", "4", "</armor>", "<tonnage>", "5.0", "</tonnage>",
            "<manufacturer>", "Bowie Industries", "</manufacturer>", "<primaryFactory>", "Brim", "</primaryFactory>",
            "<systemManufacturers>", "ENGINE:Kenhi", "JUMP_JET:Hellespont", "</systemManufacturers>",
            "<overview>", "<p>A fast raider.</p>", "</overview>",
        ].join("\n");
        const { proto } = importProtoMechBlk(text);
        expect(proto!.tro.getProduction("manufacturer")).toBe("Bowie Industries");
        expect(proto!.tro.getProduction("primaryFactory")).toBe("Brim");
        expect([proto!.tro.getComponent("engine"), proto!.tro.getComponent("jumpJets")]).toEqual(["Kenhi", "Hellespont"]);
        expect(proto!.tro.getText("overview")).toBe("A fast raider.");
    });
});

describe("ProtoMech designs in print", () => {
    const svartalfa = (name: string): ProtoMech => {
        const proto = new ProtoMech();
        proto.setName(name);
        proto.setChassis("glider");
        proto.setTons(14);
        proto.setWalkMP(4);
        proto.setMainGun(true);
        // Printed armor: head 9, torso 23, arms 6 each, legs 14, main gun 7.
        (["head", "torso", "la", "ra", "legs", "mainGun"] as const).forEach((location, index) => proto.setArmor(location, [9, 23, 6, 6, 14, 7][index]));
        proto.addMount("clan-medium-chemical-laser", "ra");
        proto.addMount("clan-medium-chemical-laser", "la");
        proto.addMount("clan-machine-gun", "torso");
        proto.addMount("pm-streak-srm", "mainGun", 6);
        [15, 15, 50, 10].forEach((shots, index) => proto.updateMount(index, { shots }));
        return proto;
    };

    it("matches the Svartalfa Ultra's weights and Battle Value of 540 (TRO: Prototypes p.91)", () => {
        const proto = svartalfa("Svartalfa Ultra");
        expect(proto.getInstalledEngineRating()).toBe(60);
        expect(proto.getEngineWeight()).toBe(1500);
        expect(proto.getHeatSinks()).toBe(0);
        expect(proto.getAmmoLoads().map((load) => load.kg)).toEqual([1000, 250, 600]);
        // The published design is allowed its 7 points on a main gun whose limit is 6 (IO:AE p.96), as a note.
        expect(proto.getTotalArmor()).toBe(65);
        expect(proto.getRemainingWeight()).toBe(0);
        expect(proto.isLegal()).toBe(true);
        expect(proto.getAllowedExceptions()[0]).toContain("allowed as published");
        expect(proto.getBattleValue()).toBe(540);
        expect(new ProtoMech(proto.exportJSON()).getArmor("mainGun")).toBe(7);
    });

    it("holds any other design to the main gun's limit", () => {
        const proto = svartalfa("My Glider");
        expect(proto.getArmor("mainGun")).toBe(6);
        expect(proto.getAllowedExceptions()).toEqual([]);
        // Renaming a published design takes the allowance away.
        const renamed = svartalfa("Svartalfa Ultra");
        renamed.setName("Something Else");
        expect(renamed.getArmor("mainGun")).toBe(6);
    });
});

describe("ProtoMech machine gun arrays and special munitions", () => {
    it("links machine guns mounted anywhere and values the array at 0.67 of them (TM pp.228, 318)", () => {
        const proto = new ProtoMech();
        proto.setTons(6);
        proto.addMount("clan-machine-gun", "la");
        proto.addMount("clan-machine-gun", "ra");
        proto.updateMount(0, { shots: 20 });
        proto.updateMount(1, { shots: 20 });
        const before = proto.getBattleValueLog().join("\n");
        expect(before).not.toContain("Machine Gun Array");
        proto.addMount("clan-machine-gun-array", "torso");
        expect(proto.getMountWeight(proto.getMounts()[2])).toBe(250);
        expect(proto.getMachineGunArrays()[0].length).toBe(2);
        // Two machine guns at 5: 10 x 0.67.
        expect(proto.getBattleValueLog().join("\n")).toContain("Machine Gun Array (Clan) (Torso): 6.7");
        expect(proto.getIssues().some((issue) => issue.includes("machine gun array"))).toBe(false);
        proto.removeMount(1);
        expect(proto.getIssues().some((issue) => issue.includes("machine gun array links two to four"))).toBe(true);
    });

    it("weighs special missiles by the munition's multiplier and offers no Artemis missiles (TO:AUE p.173; TM p.206)", () => {
        const proto = new ProtoMech();
        proto.addMount("pm-lrm", "torso", 3);
        proto.updateMount(0, { shots: 10 });
        const options = proto.getAmmoOptions(proto.getMounts()[0]).map((ammo) => ammo.tag);
        expect(options).toContain("ammo-lrm-standard");
        expect(options).toContain("ammo-clan-lrm-ftl");
        expect(options.some((tag) => tag.includes("artemis"))).toBe(false);
        // 30 missiles x 8.33 kg.
        expect(proto.getAmmoLoads()[0].kg).toBe(250);
        // Follow-the-leader missiles come 60 to the ton against 120: twice the weight.
        proto.updateMount(0, { ammoTag: "ammo-clan-lrm-ftl" });
        expect(proto.getAmmoLoads()[0].kg).toBe(500);
        expect(new ProtoMech(proto.exportJSON()).getAmmoLoads()[0].kg).toBe(500);
        // A Streak launcher fires only its own missiles.
        proto.addMount("pm-streak-srm", "torso", 2);
        expect(proto.getAmmoOptions(proto.getMounts()[1]).map((ammo) => ammo.tag)).toEqual(["ammo-clan-streak-srm-standard"]);
    });
});

describe("ProtoMech Points in a roster group", () => {
    it("counts the Point's Battle Value and tonnage and survives a save", () => {
        const group = new BattleMechGroup();
        const point = delphyne();
        point.setPointSize(4);
        point.applyDamage(1, "head", 2);
        group.protoMechs.push(point);
        expect(group.getTotalBattleValue()).toBe(316 * 4);
        expect(group.getTotalTons()).toBe(36);
        expect(group.getTotalUnits()).toBe(1);
        expect(group.getTech()).toBe("Clan");
        expect(group.isUnderStrength()).toBe(true);
        const restored = new BattleMechGroup(JSON.parse(JSON.stringify(group.export())));
        expect(restored.protoMechs[0].getArmorLeft(1, "head")).toBe(4);
        expect(new BattleMechGroup(JSON.parse(JSON.stringify(group.export(true)))).protoMechs[0].isDamaged()).toBe(false);
        // A group saved before ProtoMechs has none, and a group without them saves no list.
        expect(new BattleMechGroup().export().protoMechs).toBeUndefined();
    });
});

describe("ProtoMech Alpha Strike conversion (ASC pp.92-141, errata v1.6)", () => {
    const damage = (proto: ProtoMech): string => {
        const values = proto.getAlphaStrikeStats().damageValues;
        return [values.short, values.medium, values.long].map(formatProtoMechASDamage).join("/");
    };

    it("converts the Delphyne-2 as its Master Unit List card: 10\"j, 2/1/0, Armor 1, Structure 1, 13 points", () => {
        const stats = delphyne().getAlphaStrikeStats();
        expect(stats.move).toBe("10\"j");
        expect(stats.tmm).toBe(2);
        expect(stats.armor).toBe(1);
        expect(stats.structure).toBe(1);
        expect(damage(delphyne())).toBe("2/1/0");
        expect(stats.specialAbilities).toEqual([]);
        expect(stats.pointValue).toBe(13);
        const unit = delphyne().getAlphaStrikeUnit();
        expect(unit.type).toBe("PM");
        expect(unit.basePoints).toBe(13);
    });

    it("rates tube launchers by the Cluster Hits Table at 7 and LRMs for indirect fire", () => {
        const proto = new ProtoMech();
        proto.setTons(9);
        proto.setMainGun(true);
        proto.addMount("pm-lrm", "mainGun", 12);
        proto.updateMount(0, { shots: 10 });
        // 12 tubes hit with 8 missiles at a roll of 7: 0.8 at every range, and LRM 1/1/1 with IF 1.
        expect(damage(proto)).toBe("1/1/1");
        expect(proto.getAlphaStrikeStats().specialAbilities).toEqual(["IF1"]);
        // The LRM special needs a full point at Medium range before rounding: 20 tubes, 12 missiles, 1.2.
        proto.updateMount(0, { tubes: 20 });
        expect(proto.getAlphaStrikeStats().specialAbilities).toEqual(["IF1", "LRM1/1/1"]);
        // Fewer than ten shots a weapon: x 0.75 (ASC p.101 as corrected by errata v1.6).
        proto.updateMount(0, { tubes: 5, shots: 9 });
        expect(damage(proto)).toBe("0*/0*/0*");
        expect(proto.getAlphaStrikeStats().specialAbilities).toEqual(["IF0*"]);
    });

    it("moves a boosted ProtoMech as with MASC and marks energy-only designs ENE", () => {
        const proto = new ProtoMech();
        proto.setTons(3);
        proto.setWalkMP(10);
        proto.setMyomerBooster(true);
        proto.addMount("er-micro-laser", "torso");
        const stats = proto.getAlphaStrikeStats();
        // 10 MP x 1.25 = 12.5, rounded to 13 MP: 26 inches, as the Siren 4's card has.
        expect(stats.move).toBe("26\"");
        expect(stats.specialAbilities).toEqual(["ENE"]);
        expect(damage(proto)).toBe("0*/0/0");
    });

    it("gives a Glider two Move values and GLD, and a jump stronger than the ground Move JMPS (ASC p.124; errata v1.6)", () => {
        const glider = new ProtoMech();
        glider.setChassis("glider");
        glider.setTons(14);
        glider.setWalkMP(4);
        const stats = glider.getAlphaStrikeStats();
        expect(stats.move).toBe("2\"/8\"g");
        expect(stats.specialAbilities).toContain("GLD");
        const jumper = new ProtoMech();
        jumper.setTons(15);
        jumper.setWalkMP(3);
        jumper.setJump("extended", 5);
        expect(jumper.getAlphaStrikeStats().move).toBe("6\"/10\"j");
        expect(jumper.getAlphaStrikeStats().specialAbilities).toContain("JMPS1");
    });

    it("names clamps by weight, melee systems MEL and a plasma cannon by its heat", () => {
        const proto = new ProtoMech();
        proto.setTons(13);
        proto.setChassis("quad");
        proto.setMainGun(true);
        proto.addMount("plasma-cannon", "mainGun");
        proto.updateMount(0, { shots: 10 });
        proto.addMount("protomech-quad-melee-system", "torso");
        const stats = proto.getAlphaStrikeStats();
        expect(damage(proto)).toBe("0/0/0");
        expect(stats.specialAbilities).toEqual(["HT1/1/1", "MEL"]);
        const light = new ProtoMech();
        light.addMount("protomech-magnetic-clamp", "torso");
        expect(light.getAlphaStrikeStats().specialAbilities).toContain("MCS");
        light.setTons(10);
        expect(light.getAlphaStrikeStats().specialAbilities).toContain("UCS");
    });
});

describe("ProtoMech files with Inner Sphere equipment", () => {
    it("enters the Gorgon 6's Angel ECM suite as the Clan record and says so", () => {
        const text = [
            "<UnitType>", "ProtoMek", "</UnitType>", "<Name>", "Gorgon", "</Name>", "<Model>", "6", "</Model>",
            "<motion_type>", "Biped", "</motion_type>", "<cruiseMP>", "5", "</cruiseMP>", "<armor>", "4", "12", "4", "4", "7", "</armor>",
            "<Body Equipment>", "EIInterface", "</Body Equipment>", "<Torso Equipment>", "ISAngelECMSuite", "</Torso Equipment>", "<tonnage>", "8.0", "</tonnage>",
        ].join("\n");
        const { proto, issues, notes } = importProtoMechBlk(text);
        expect(issues).toEqual([]);
        expect(notes?.[0]).toContain("Angel ECM Suite (Clan)");
        expect(proto?.getMounts()).toEqual([{ tag: "clan-angel-ecm", location: "torso" }]);
        expect(proto?.getMountWeight(proto.getMounts()[0])).toBe(2000);
        expect(proto?.getAlphaStrikeStats().specialAbilities).toContain("AECM");
    });
});

describe("E-War carrier (#642)", () => {
    const build = () => {
        const proto = delphyne();
        proto.addMount("clan-ecm-system", "torso");
        proto.addMount("clan-ams", "torso");
        return proto;
    };

    it("lists its E-War gear", () => {
        // Mounts carry no uuid, so the gear is listed without one; the weapons are not E-War gear.
        const gear = build().getEWarGear();
        expect(gear.map(item => item.kind)).toEqual(["ecm-clan", "ams"]);
        for (const item of gear) {
            expect(item.name).toBeTruthy();
            expect(item.destroyed).toBe(false);
        }
    });

    it("reports destroyed E-War gear", () => {
        // Destroyed when every ProtoMech still in the Point has lost the mount (isMountLost); one survivor keeps it working.
        const proto = build();
        const index = proto.getMounts().findIndex(mount => mount.tag === "clan-ecm-system");
        proto.setMountLost(0, index, true);
        expect(proto.getEWarGear().map(item => [item.kind, item.destroyed])).toEqual([["ecm-clan", false], ["ams", false]]);
        for (let unit = 1; unit < 5; unit++) proto.setMountLost(unit, index, true);
        expect(proto.getEWarGear().map(item => [item.kind, item.destroyed])).toEqual([["ecm-clan", true], ["ams", false]]);
    });

    it("lists its real Angel ECM tag", () => {
        const proto = new ProtoMech();
        proto.addMount("clan-angel-ecm", "torso");
        expect(proto.getEWarGear().map(item => [item.tag, item.kind])).toEqual([["clan-angel-ecm", "ecm-angel"]]);
    });

    it("lists stealth armor", () => {
        // A ProtoMech has only standard and EDP armor: no stealth type to list.
        const proto = new ProtoMech();
        proto.setArmorType("edp");
        expect(proto.getEWarGear()).toEqual([]);
    });

    it("saves E-War state and loads old saves without it", () => {
        const proto = build();
        expect(proto.export().ewarPlay).toBeUndefined();
        proto.ewarPlay.inHostileEcm = true;
        const saved = JSON.parse(JSON.stringify(proto.export()));
        expect(saved.ewarPlay).toEqual({ inHostileEcm: true });
        expect(proto.export(true).ewarPlay).toBeUndefined();
        expect(new ProtoMech(JSON.stringify(saved)).ewarPlay).toEqual({ inHostileEcm: true });
        delete saved.ewarPlay;
        expect(new ProtoMech(JSON.stringify(saved)).ewarPlay).toEqual({});
    });
});

// TO:AUE p.105 (#612): the jump pack is Advanced equipment for ProtoMechs as well as 'Mechs. Pack tons give Jump MP and fuel
// points from the Jump Pack Table by the unit's weight, rounded up, at most Walking MP; the pack adds no design weight.
describe("ProtoMech jump pack (TO:AUE p.105)", () => {
    const packed = (tons: number, walk: number, packTons: number): ProtoMech => {
        const proto = new ProtoMech();
        proto.setTons(tons);
        proto.setWalkMP(walk);
        proto.setJump("pack");
        proto.setJumpPackTons(packTons);
        return proto;
    };

    it("is offered to a biped and quad but not a Glider", () => {
        expect(new ProtoMech().getAvailableJumpTypes()).toContain("pack");
        const glider = new ProtoMech();
        glider.setChassis("glider");
        expect(glider.getAvailableJumpTypes()).not.toContain("pack");
    });

    it("gives MP and fuel from the Jump Pack Table row of the unit's weight, MP capped at Walking MP", () => {
        // 9 tons is the 6 to 19 row: 5 Jump MP and 16 fuel a pack ton. 1 ton: 5 MP; half a ton rounds up to 3 MP.
        expect([packed(9, 5, 1).getJumpPackMP(), packed(9, 5, 1).getJumpPackFuel()]).toEqual([5, 16]);
        expect([packed(9, 5, 0.5).getJumpPackMP(), packed(9, 5, 0.5).getJumpPackFuel()]).toEqual([3, 8]);
        expect(packed(9, 4, 3).getJumpPackMP()).toBe(4);
        expect(packed(9, 4, 3).getJumpPackFuel()).toBe(48);
        // 4 tons is the 1 to 5 row: 10 MP and 20 fuel a pack ton.
        expect([packed(4, 6, 0.5).getJumpPackMP(), packed(4, 6, 0.5).getJumpPackFuel()]).toEqual([5, 10]);
    });

    it("adds no design weight, costs 20,000 C-bills a ton and gives the unit no Jumping MP for Battle Value or Alpha Strike", () => {
        const plain = packed(9, 5, 0);
        const withPack = packed(9, 5, 2);
        expect(withPack.getJumpWeight()).toBe(0);
        expect(withPack.getRemainingWeight()).toBe(plain.getRemainingWeight());
        expect(withPack.getJumpJets()).toBe(0);
        expect(withPack.getJumpMP()).toBe(0);
        expect(withPack.getBattleValue()).toBe(plain.getBattleValue());
        expect(Math.round(withPack.getCBillCost() - plain.getCBillCost())).toBe(Math.round(40000 * 1.09));
    });

    it("is no heavier than the unit or 20 tons, saves, loads and shows on the sheet notes", () => {
        expect(packed(9, 5, 30).getJumpPackTons()).toBe(9);
        const saved = packed(9, 5, 2).export();
        expect([saved.jumpType, saved.jumpPackTons]).toEqual(["pack", 2]);
        const loaded = new ProtoMech(JSON.stringify(saved));
        expect([loaded.getJumpType(), loaded.getJumpPackTons(), loaded.getJumpPackMP()]).toEqual(["pack", 2, 5]);
        expect(loaded.getNotes().join(" ")).toMatch(/jump pack: 2 tons, 5 Jump MP, 32 fuel points/i);
        expect(loaded.getMovementText()).toContain("pack");
    });

    // TO:AUE p.105 rates the pack Advanced; it carries no design weight, so the weight list holds no jump jet line for it (Opus review).
    it("makes the design Advanced and lists no jump jets in the weight", () => {
        expect(packed(9, 5, 0).getRequiredRulesLevel()).toBe(PROTOMECH_RULES_LEVEL);
        expect(packed(9, 5, 2).getRequiredRulesLevel()).toBe(PROTOMECH_ADVANCED_RULES_LEVEL);
        expect(packed(9, 5, 2).getWeightLog().map((line) => line.label).join(" ")).not.toMatch(/jump jets/i);
    });
});

/** The eight ProtoMechs of TRO 3060 as MegaMek's files give them: [name, BLK blocks, BV1 printed by the FanPro printing p.195, BV2 printed by the CGL 2010 printing]. */
const TRO_3060_PROTOMECHS: [string, string[], number, number][] = [
    ["Harpy", ["<cruiseMP>", "3", "</cruiseMP>", "<jumpingMP>", "3", "</jumpingMP>", "<armor>", "2", "4", "1", "1", "3", "</armor>",
        "<Body Equipment>", "Clan Machine Gun Ammo - Proto (20)", "ProtoMechJumpJet", "ProtoMechJumpJet", "ProtoMechJumpJet", "EIInterface", "</Body Equipment>", "<Torso Equipment>", "CLMG", "</Torso Equipment>", "<tonnage>", "2.0", "</tonnage>"], 28, 56],
    ["Siren", ["<cruiseMP>", "10", "</cruiseMP>", "<jumpingMP>", "0", "</jumpingMP>", "<armor>", "2", "5", "1", "1", "3", "</armor>",
        "<Body Equipment>", "Clan Light Machine Gun Ammo - Proto (20)", "EIInterface", "</Body Equipment>", "<Torso Equipment>", "CLLightMG", "CLLightMG", "</Torso Equipment>", "<tonnage>", "3.0", "</tonnage>"], 52, 86],
    ["Satyr", ["<cruiseMP>", "7", "</cruiseMP>", "<jumpingMP>", "0", "</jumpingMP>", "<armor>", "2", "5", "1", "1", "3", "</armor>",
        "<Body Equipment>", "EIInterface", "</Body Equipment>", "<Torso Equipment>", "CLERSmallLaser", "CLLightActiveProbe", "</Torso Equipment>", "<tonnage>", "4.0", "</tonnage>"], 98, 133],
    ["Hydra", ["<cruiseMP>", "4", "</cruiseMP>", "<jumpingMP>", "0", "</jumpingMP>", "<armor>", "3", "10", "3", "3", "7", "3", "</armor>",
        "<Body Equipment>", "Clan Streak SRM 3 Ammo (10)", "EIInterface", "</Body Equipment>", "<Torso Equipment>", "CLMicroPulseLaser", "</Torso Equipment>", "<Main Gun Equipment>", "CLStreakSRM3", "</Main Gun Equipment>", "<tonnage>", "6.0", "</tonnage>"], 139, 209],
    ["Roc", ["<cruiseMP>", "5", "</cruiseMP>", "<jumpingMP>", "5", "</jumpingMP>", "<armor>", "3", "10", "4", "4", "7", "3", "</armor>",
        "<Body Equipment>", "ProtoMechJumpJet", "ProtoMechJumpJet", "ProtoMechJumpJet", "ProtoMechJumpJet", "ProtoMechJumpJet", "EIInterface", "</Body Equipment>", "<Main Gun Equipment>", "CLERMediumLaser", "</Main Gun Equipment>", "<tonnage>", "7.0", "</tonnage>"], 284, 336],
    ["Gorgon", ["<cruiseMP>", "4", "</cruiseMP>", "<jumpingMP>", "0", "</jumpingMP>", "<armor>", "4", "12", "4", "4", "7", "3", "</armor>",
        "<Body Equipment>", "Clan Ammo LRM-10 (12)", "EIInterface", "</Body Equipment>", "<Torso Equipment>", "CLERMicroLaser", "</Torso Equipment>", "<Main Gun Equipment>", "CLLRM10", "</Main Gun Equipment>", "<tonnage>", "8.0", "</tonnage>"], 213, 295],
    ["Minotaur", ["<cruiseMP>", "3", "</cruiseMP>", "<jumpingMP>", "3", "</jumpingMP>", "<armor>", "5", "15", "3", "3", "10", "</armor>",
        "<Body Equipment>", "ProtoMechJumpJet", "ProtoMechJumpJet", "ProtoMechJumpJet", "EIInterface", "</Body Equipment>", "<Torso Equipment>", "CLERMediumLaser", "CLERMediumLaser", "</Torso Equipment>", "<tonnage>", "9.0", "</tonnage>"], 367, 424],
];
const troProto = (name: string, blocks: string[]): ProtoMech => {
    const text = ["<UnitType>", "ProtoMek", "</UnitType>", "<Name>", name, "</Name>", "<Model>", "", "</Model>", "<year>", "3060", "</year>", "<motion_type>", "Biped", "</motion_type>",
        "<armor_type>", "42", "</armor_type>", ...blocks].join("\n");
    const { proto } = importProtoMechBlk(text);
    return proto!;
};

describe("ProtoMech Battle Value as cited steps (#599)", () => {
    it("works the Delphyne-2 step by step, each step with its TM page (p.306, worked p.307)", () => {
        const breakdown = delphyne().getBattleValueBreakdown("total-warfare");
        expect(breakdown.scheme).toBe("bv2");
        expect(breakdown.result).toBe(316);
        const byId = (id: string) => breakdown.steps.filter((step) => step.id === id);
        expect(byId("pm.bv2.def.armor")[0].value).toBe(100);
        expect(byId("pm.bv2.def.structure")[0].value).toBe(30);
        expect(byId("pm.bv2.def.factor")[0].value).toBe(1.4);
        expect(byId("pm.bv2.def.rating")[0].value).toBe(182);
        expect(byId("pm.bv2.off.weapons.total")[0].value).toBe(76.4);
        expect(byId("pm.bv2.off.speed.plain")[0].value).toBe(1.76);
        expect(byId("pm.bv2.final.sum")[0].value).toBe(316);
        expect(breakdown.steps.every((step) => step.cites.length > 0)).toBe(true);
        expect(breakdown.steps.filter((step) => step.status !== "cited")).toEqual([]);
        expect(findCalcDefProblems(PROTOMECH_BV2_STEPS)).toEqual([]);
        expect(findCalcDefProblems(PROTOMECH_BV1_STEPS)).toEqual([]);
        expect(findCalcDefProblems(PROTOMECH_COST_STEPS)).toEqual([]);
    });

    it.each(TRO_3060_PROTOMECHS)("gives the %s the Battle Value 1 TRO 3060 (FanPro) p.195 prints, and the Battle Value 2 of the CGL printing", (name, blocks, bv1, bv2) => {
        const proto = troProto(name, blocks);
        expect(proto.getBattleValue("master-rules-revised")).toBe(bv1);
        expect(proto.getBattleValueBreakdown("master-rules-revised").scheme).toBe("bv1");
        expect(proto.getBattleValueBreakdown("master-rules-revised").result).toBe(bv1);
        expect(proto.getBattleValue("total-warfare")).toBe(bv2);
    });

    it("values the Centaur at 190, not the 192 TRO 3060 (CGL) prints: that BV works the LRM 3 at the 2007 TechManual's 35 and 5 a ton (TM p.318, later printings 34 and 4)", () => {
        const centaur = troProto("Centaur", ["<cruiseMP>", "6", "</cruiseMP>", "<jumpingMP>", "0", "</jumpingMP>", "<armor>", "3", "7", "2", "2", "4", "2", "</armor>",
            "<Body Equipment>", "Clan Ammo SRM-2 (10)", "Clan Ammo ProtoMech LRM-3 (8)", "EIInterface", "</Body Equipment>", "<Torso Equipment>", "CLSRM2", "CLLRM3", "</Torso Equipment>",
            "<Main Gun Equipment>", "CLERMicroLaser", "</Main Gun Equipment>", "<tonnage>", "5.0", "</tonnage>"]);
        expect(centaur.getBattleValue("total-warfare")).toBe(190);
        // BV1 works it at the Master Rules, Revised Edition's table (BMR(R) p.155: LRM 3 is 35, ammunition 5 a ton) and prints 140.
        expect(centaur.getBattleValue("master-rules-revised")).toBe(140);
        expect(centaur.getBattleValueBreakdown("master-rules-revised").steps.some((step) => step.id === "pm.bv1.off.weapon.missile" && step.value === 35)).toBe(true);
    });

    it("shows no Battle Value under the 1998 Master Rules and older editions, which have no ProtoMechs", () => {
        const proto = delphyne();
        expect(proto.getBattleValueBreakdown("master-rules").scheme).toBe("none");
        expect(proto.getBattleValueBreakdown("master-rules").result).toBeNull();
        expect(proto.getBattleValueBreakdown("battletech-4th-edition").result).toBeNull();
    });

    it("counts a probe as offensive equipment under BV1, as BMR(R) p.154 lists only AMS and ECM as defensive (the Satyr's 98)", () => {
        const satyr = troProto(TRO_3060_PROTOMECHS[2][0], TRO_3060_PROTOMECHS[2][1]);
        const steps = satyr.getBattleValueBreakdown("master-rules-revised").steps;
        expect(steps.some((step) => step.id === "pm.bv1.def.equipment")).toBe(false);
        expect(steps.find((step) => step.id === "pm.bv1.off.weapon" && step.label.startsWith("Light Active Probe"))?.value).toBe(7);
    });

    it("keeps a myomer booster's +1 to the Speed Factor as a provisional step with the note on the Master Unit List's reading (TM p.306)", () => {
        const proto = new ProtoMech();
        proto.setTons(3);
        proto.setWalkMP(10);
        proto.setMyomerBooster(true);
        proto.setArmor("torso", 5); proto.setArmor("head", 2); proto.setArmor("la", 1); proto.setArmor("ra", 1); proto.setArmor("legs", 3);
        proto.addMount("er-micro-laser", "torso");
        const speed = proto.getBattleValueBreakdown("total-warfare").steps.find((step) => step.id === "pm.bv2.off.speed")!;
        expect(speed.status).toBe("provisional");
        expect(speed.detail).toContain("+ 1 (myomer booster)");
        expect(speed.note).toContain("Siren 4");
        expect(proto.getBattleValue()).toBe(84);
    });

    it("gives the cost as cited steps that add up to the cost (TM pp.279, 282, 285)", () => {
        const breakdown = delphyne().getCostBreakdown();
        expect(breakdown.result).toBe(Math.round(821700 * 1.09));
        expect(breakdown.steps.find((step) => step.id === "pm.cost.structural-total")?.value).toBe(741700);
        expect(breakdown.steps.find((step) => step.id === "pm.cost.final")?.cites.map((cite) => cite.page)).toEqual(["285"]);
        expect(breakdown.steps.filter((step) => step.id === "pm.cost.weapons.tubes").length).toBe(2);
    });
});

// TO:AUE pp.126-128, 193, 219 (#611): a ProtoMech with two arms may carry a handheld weapon, outside its weight and slots.
describe("ProtoMech handheld weapon (TO:AUE pp.126-128)", () => {
    const gun = { entries: [{ tag: "clan-light-machine-gun", shots: 40 }], armor: 0 };
    const armed = (armor = 0): ProtoMech => {
        const proto = delphyne();
        expect(proto.setHandheldWeapon({ ...gun, armor })).toBe(true);
        return proto;
    };

    it("is offered to a biped at Experimental rules, not to a Quad or a Glider", () => {
        expect(delphyne().getHandheldOption(3).available).toBe(false);
        expect(delphyne().getHandheldOption(4).available).toBe(true);
        const quad = delphyne();
        quad.setChassis("quad");
        expect(quad.canCarryHandheld().allowed).toBe(false);
        expect(quad.setHandheldWeapon(gun)).toBe(false);
    });

    it("adds no design weight, rates the design Experimental and holds its weight to 10 percent of the tonnage", () => {
        const plain = delphyne();
        const proto = armed();
        expect(proto.getRemainingWeight()).toBe(plain.getRemainingWeight());
        expect(proto.getRequiredRulesLevel()).toBe(4);
        expect(plain.getRequiredRulesLevel()).toBeLessThan(4);
        expect(proto.getHandheldCargoLimit()).toBeCloseTo(0.9);
        expect(proto.getHandheldIssues()).toEqual([]);
        proto.setHandheldWeapon({ entries: [{ tag: "er-micro-laser", count: 2 }], armor: 0 });
        expect(proto.getHandheldIssues().join(" ")).toMatch(/cargo limit/i);
    });

    it("adds its own BV to the final BV and twice its parts to the cost", () => {
        const plain = delphyne();
        const proto = armed(8);
        const analysis = proto.getHandheldAnalysis()!;
        expect(analysis.battleValue).toBeGreaterThan(0);
        expect(proto.getBattleValue()).toBe(plain.getBattleValue() + analysis.battleValue);
        const steps = proto.getBattleValueBreakdown("total-warfare").steps;
        expect(steps.find((step) => step.id === "pm.bv2.final.handheld")?.value).toBe(analysis.battleValue);
        expect(steps.find((step) => step.id === "pm.bv2.final.with-handheld")?.value).toBe(proto.getBattleValue());
        expect(plain.getBattleValueBreakdown("total-warfare").steps.some((step) => step.id === "pm.bv2.final.handheld")).toBe(false);
        expect(Math.round(proto.getCBillCost() - plain.getCBillCost())).toBe(Math.round(analysis.cost * 1.09));
    });

    it("saves and loads the design and where each ProtoMech's weapon is", () => {
        const proto = armed(8);
        proto.dropHandheld(1);
        proto.strikeHandheld(0, 3);
        const loaded = new ProtoMech(JSON.stringify(proto.export()));
        expect(loaded.getHandheldWeapon()).toEqual({ entries: [{ tag: "clan-light-machine-gun", shots: 40 }], armor: 8 });
        expect(loaded.getHandheldPlay(1).state).toBe("dropped");
        expect(loaded.getHandheldPlay(0)).toEqual({ state: "carried", armorLeft: 5 });
        expect(loaded.getHandheldPlay(2)).toEqual({ state: "carried", armorLeft: 8 });
    });

    it("takes an arm hit on a 6, destroyed past its armor with the excess going to the arm", () => {
        const proto = armed(4);
        const log = proto.applyDamage(0, "ra", 3, 5);
        expect(log.join(" ")).not.toMatch(/handheld/i);
        expect(proto.getHandheldPlay(0).armorLeft).toBe(4);
        expect(proto.applyDamage(0, "ra", 3, 6).join(" ")).toMatch(/handheld weapon is hit.*1 left|takes the damage on its armor \(1 left\)/i);
        const before = proto.getLocationDamage(0, "ra");
        expect(proto.applyDamage(0, "ra", 3, 6).join(" ")).toMatch(/destroyed; 2 damage goes on/i);
        expect(proto.getHandheldPlay(0).state).toBe("destroyed");
        expect(proto.getLocationDamage(0, "ra")).toBe(before + 2);
    });

    it("must be dropped when an arm is destroyed, and picked up again only with both arms whole", () => {
        const proto = armed();
        expect(proto.handheldMustDrop(0)).toBe(false);
        proto.setLocationDamage(0, "la", proto.getLocationCapacity("la"));
        expect(proto.handheldMustDrop(0)).toBe(true);
        expect(proto.isHandheldUsable(0)).toBe(false);
        expect(proto.dropHandheld(0)).toMatch(/dropped/i);
        expect(proto.pickUpHandheld(0)).toBe("");
        expect(proto.pickUpHandheld(1)).toBe("");
        proto.dropHandheld(1);
        expect(proto.pickUpHandheld(1)).toMatch(/picked up/i);
    });
});
