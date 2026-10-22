import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";
import { BattleMech } from "./battlemech";
import Vehicle from "./vehicle";
import { getRoboticControlCost, getRoboticControlSystemsFor, getRoboticControlWeight, getRoboticSkills } from "../data/robotic-control-systems";

// The published units of BattleTech Adventures: Ghosts of Obeedah (pp.71-78, record sheets pp.80-84), built from
// their record sheets. The book's designs use standard half-ton rounding, not Fractional Accounting (user ruling
// 2026-10-14), and its Battle Values leave out the 0.85 for a Smart Robotic Control System (IO:AE p.187), which
// the builders apply (user ruling 2026-10-14).

const roundHalf = (weight: number) => Math.ceil(weight * 2) / 2;

describe("Smart Robotic Control System (IO:AE pp.134-135)", () => {
    it("weighs the table's share of the unit, rounded up to the half ton, and nothing under 10 tons", () => {
        expect(getRoboticControlWeight("combat-vehicle", "srcs", 60, roundHalf)).toBe(3);
        // 7 percent of 60 tons is 4.2, rounded up.
        expect(getRoboticControlWeight("combat-vehicle", "srcs-improved", 60, roundHalf)).toBe(4.5);
        expect(getRoboticControlWeight("dropship", "srcs", 1000, roundHalf)).toBe(70);
        expect(getRoboticControlWeight("combat-vehicle", "srcs", 3, roundHalf)).toBe(0);
        expect(getRoboticControlWeight("combat-vehicle", "srcs-improved", 3, roundHalf)).toBe(1);
        expect(getRoboticControlWeight("combat-vehicle", "none", 60, roundHalf)).toBe(0);
    });

    it("gives the table's Skills, 1 better each when Improved, and no Improved grade for a conventional fighter", () => {
        expect(getRoboticSkills("combat-vehicle", "srcs")).toEqual({ gunnery: 5, piloting: 6 });
        expect(getRoboticSkills("combat-vehicle", "srcs-improved")).toEqual({ gunnery: 4, piloting: 5 });
        expect(getRoboticSkills("battlemech", "srcs")).toEqual({ gunnery: 5, piloting: 9 });
        expect(getRoboticSkills("combat-vehicle", "none")).toBeNull();
        expect(getRoboticControlSystemsFor("conventional-fighter").map((system) => system.tag)).toEqual(["none", "srcs"]);

        const fighter = new AerospaceFighter();
        fighter.setRoboticControl("srcs-improved");
        fighter.setFighterType("conventional");
        expect(fighter.getRoboticControl().tag).toBe("srcs");
    });

    it("costs 5,000 + 10,000 per ton of the system (IO:AE p.215)", () => {
        expect(getRoboticControlCost("srcs-improved", 4.5)).toBe(50000);
        expect(getRoboticControlCost("none", 0)).toBe(0);
    });
});

const hiScout = (): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType("tracked");
    vehicle.setTonnage(60);
    vehicle.setEngineType("cell");
    vehicle.setCruiseMP(4);
    vehicle.setHasTurret(true);
    ["front", "right", "left", "rear", "turret"].forEach((location, index) => vehicle.setArmorAllocation(location as never, [21, 21, 21, 20, 21][index]));
    const add = (tag: string, location: string = "") => {
        vehicle.addEquipmentFromTag(tag);
        const item = vehicle.getEquipmentList()[vehicle.getEquipmentList().length - 1];
        expect(item.tag).toBe(tag);
        if (location) vehicle.setEquipmentLocation(item.uuid!, location);
        return item;
    };
    add("machine-gun", "front");
    add("machine-gun", "front");
    add("ba-is-er-medium-laser", "turret");
    add("ba-is-er-medium-laser", "turret");
    add("machine-gun", "turret");
    add("machine-gun", "turret");
    add("ammo-machine-gun-standard");
    add("ammo-machine-gun-standard");
    const cells = add("ammo-ba-is-er-medium-laser");
    vehicle.setWeightAccounting("standard");
    vehicle.setAmmoBinShots(cells.uuid, 2000);
    // "the heat sinks and supplemental power packs needed to fire" (p.71): the design carries both.
    vehicle.setAdditionalHeatSinks(7);
    vehicle.setTroopSpace(12);
    vehicle.setRoboticControl("srcs-improved");
    return vehicle;
};

describe("Hi-Scout Armored Automata Carrier (Ghosts of Obeedah p.80)", () => {
    it("weighs exactly 60 tons, with a 4.5-ton Improved SRCS and 2,000 shots of power cells", () => {
        const vehicle = hiScout();
        expect(vehicle.usesFractionalAccounting()).toBe(false);
        expect(vehicle.getRoboticControlWeight()).toBe(4.5);
        expect(vehicle.getEngineWeight()).toBe(14);
        expect(vehicle.getAmmoBinShots(vehicle.getEquipmentList().find((item) => item.tag === "ammo-ba-is-er-medium-laser")!)).toBe(2000);
        expect(vehicle.getCurrentTonnage()).toBe(60);
    });

    it("drives at Gunnery 4 / Driving 5 and has BV 448: the sheet's 527 x 0.85 (IO:AE p.187)", () => {
        const vehicle = hiScout();
        expect(vehicle.getRoboticSkills()).toEqual({ gunnery: 4, piloting: 5 });
        expect(vehicle.getBattleValue()).toBe(448);
        expect(vehicle.getBattleValueLog()).toContain("x 0.85 (Smart Robotic Control System, IO:AE p.187)");
        expect(vehicle.getPilotAdjustedBattleValue()).toBe(448);
        vehicle.setRoboticControl("none");
        expect(vehicle.getBattleValue()).toBe(527);
    });

    it("is Experimental, costs the SRCS, and keeps it and standard rounding through a save", () => {
        const vehicle = hiScout();
        expect(vehicle.getRequiredRulesLevel()).toBe(4);
        expect(vehicle.getCBillCostLog()).toContain("Smart Robotic Control System (Improved) (4.5 t): 50,000");
        const reloaded = new Vehicle(vehicle.exportJSON());
        expect(reloaded.getRoboticControl().tag).toBe("srcs-improved");
        expect(reloaded.usesFractionalAccounting()).toBe(false);
        expect(reloaded.getCurrentTonnage()).toBe(60);
        expect(reloaded.getBattleValue()).toBe(448);
    });
});

describe("Mk. 20 SwiftStar Fighter Drone (Ghosts of Obeedah p.84)", () => {
    const swiftStar = (): AerospaceFighter => {
        const fighter = new AerospaceFighter();
        fighter.setTonnage(30);
        fighter.setSafeThrust(10);
        // Fuel Points 400: 80 a ton for a 30-ton fighter.
        fighter.setFuelTons(5);
        fighter.setArmorType("ferro-aluminum");
        fighter.setArmorAllocation("nose", 15);
        fighter.setArmorAllocation("leftWing", 13);
        fighter.setArmorAllocation("rightWing", 13);
        fighter.setArmorAllocation("aft", 12);
        fighter.addEquipmentFromTag("medium-pulse-laser", "nose");
        fighter.addEquipmentFromTag("medium-pulse-laser", "nose");
        fighter.addEquipmentFromTag("medium-laser", "leftWing");
        fighter.addEquipmentFromTag("medium-laser", "rightWing");
        fighter.setRoboticControl("srcs");
        return fighter;
    };

    it("fills its 30 tons with a 1.5-ton SRCS on top of the cockpit", () => {
        const fighter = swiftStar();
        expect(fighter.getRoboticControlWeight()).toBe(1.5);
        expect(fighter.getRemainingTonnage()).toBe(0);
    });

    it("flies at Gunnery 5 / Piloting 6; BV 523, 450 at those Skills (the sheet's 529 leaves out the 0.85)", () => {
        const fighter = swiftStar();
        expect(fighter.getRoboticSkills()).toEqual({ gunnery: 5, piloting: 6 });
        expect(fighter.getBattleValue()).toBe(523);
        // The sheet prints 529: 615.4 x 0.86 (Gunnery 5 / Piloting 6, TM p.315), without the 0.85.
        expect(fighter.getPilotAdjustedBattleValue()).toBe(450);
        expect(new AerospaceFighter(fighter.exportJSON()).getRoboticControl().tag).toBe("srcs");
    });
});

describe("C-HRB-O Cherub Ultralight OmniMech (Ghosts of Obeedah pp.81-83)", () => {
    type Placement = [tag: string, location: string, criticals: string, shots?: number];
    const recoilless = (location: string, criticals: string): Placement => ["ba-is-medium-recoilless-rifle", location, criticals];
    const cherub = (tech: string, placements: Placement[]): BattleMech => {
        const mech = new BattleMech();
        mech.setTech(tech);
        mech.setEra("dark-ages");
        mech.setTonnage(15);
        mech.setWalkSpeed(7);
        mech.setCockpitType("small");
        mech.setArmorType("ferro-fibrous");
        mech.setArmorWeight(3);
        mech.setHeadArmor(7);
        mech.setCenterTorsoArmor(6);
        mech.setCenterTorsoRearArmor(4);
        mech.setLeftTorsoArmor(5);
        mech.setLeftTorsoRearArmor(3);
        mech.setRightTorsoArmor(5);
        mech.setRightTorsoRearArmor(3);
        mech.setLeftArmArmor(4);
        mech.setRightArmArmor(4);
        mech.setLeftLegArmor(6);
        mech.setRightLegArmor(6);
        const bins: [string, number][] = [];
        for (const [tag, location, criticals, shots] of placements) {
            const catalog = tag.startsWith("ba-clan-") ? "clan" : "is";
            const item = mech.addEquipmentFromTag(tag, catalog, "", false, undefined, "", false, [], undefined, undefined)!;
            expect(item?.tag).toBe(tag);
            const slots = (mech.getCriticals() as unknown as Record<string, unknown[]>)[criticals];
            const from = mech.unallocatedCriticals.findIndex((slot) => slot?.uuid === item.uuid);
            expect(mech.moveCritical("un", from, location, slots.findIndex((slot) => !slot))).toBe(true);
            if (shots) bins.push([item.uuid!, shots]);
        }
        expect(mech.setWeightAccounting("standard")).toBe("standard");
        for (const [uuid, shots] of bins) mech.setAmmoBinShots(uuid, shots);
        return mech;
    };

    it("Invictus: 8 battle armor Medium Recoilless Rifles and two 125-shot bins, BV 507", () => {
        const mech = cherub("is", [
            ...Array.from({ length: 4 }, () => recoilless("la", "leftArm")),
            ...Array.from({ length: 4 }, () => recoilless("ra", "rightArm")),
            ["rocket-launcher-10", "rt", "rightTorso"],
            ["ammo-ba-is-medium-recoilless-rifle", "ra", "rightArm", 125],
            ["ammo-ba-is-medium-recoilless-rifle", "ra", "rightArm", 125],
        ]);
        expect(mech.getTotalArmor()).toBe(53);
        expect(mech.getCurrentTonnage()).toBe(15);
        expect(mech.getBattleValue()).toBe(507);
    });

    it("Dominus: 6 battle armor Support PPCs, BV 537 by the rules (the sheet prints 517, unexplained)", () => {
        const mech = cherub("is", [
            ...Array.from({ length: 6 }, (): Placement => ["ba-is-support-ppc", "la", "leftArm"]),
            ["er-medium-laser", "ra", "rightArm"],
            ["rocket-launcher-10", "rt", "rightTorso"],
        ]);
        expect(mech.getCurrentTonnage()).toBe(15);
        // 20 under the rules: as if the Support PPCs counted 12 BV each (TM p.317 gives 14) or the design took a
        // -15 explosive penalty it has nothing to explain; flagged, not entered.
        expect(mech.getBattleValue()).toBe(537);
    });

    it("Comminus: 2 battle armor Clan Medium Pulse Lasers on a Mixed chassis, BV 695", () => {
        const mech = cherub("mis", [
            ["ba-clan-medium-pulse-laser", "la", "leftArm"],
            ["ba-clan-medium-pulse-laser", "ra", "rightArm"],
            ["rocket-launcher-10", "lt", "leftTorso"],
            ["rocket-launcher-10", "rt", "rightTorso"],
        ]);
        expect(mech.getCurrentTonnage()).toBe(15);
        expect(mech.getBattleValue()).toBe(695);
    });
});
