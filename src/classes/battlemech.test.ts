import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { validateChassisCombination } from "../data/mech-internal-structure-types";

describe("BattleMech engine availability by era", () => {
    it("shows the expected Inner Sphere engines for a Star League mech", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setTonnage(20);
        mech.setEra("star-league");

        const availableEngineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(availableEngineTags).toEqual(["standard", "xl", "ice", "cell", "fission"]);
    });

    it("includes engines introduced during the selected era", () => {
        const mech = new BattleMech();
        mech.setEra("star-league");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).toContain("xl");
    });

    it("excludes engines in the gap between extinction and reintroduction", () => {
        const mech = new BattleMech();
        mech.setEra("late-sw-lt");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).not.toContain("xl");
    });

    it("includes reintroduced engines when the selected era overlaps reintroduction", () => {
        const mech = new BattleMech();
        mech.setEra("jihad");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).toContain("xl");
    });

    it("keeps Clan engines available after Inner Sphere extinction", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        mech.setEra("jihad");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).toContain("clan_xl");
        expect((mech as any)._itemIsAvailable(2300, 2500, 3070, true)).toBe(true);
    });
});

describe("BattleMech TRO anatomy", () => {
    it("renders Tripod legs instead of Quad front and rear legs", () => {
        const mech = new BattleMech();
        mech.setType("tripod");

        const troHtml = mech.makeTROHTML();

        expect(troHtml).toContain("Center Leg");
        expect(troHtml).not.toContain("Front Leg");
        expect(troHtml).not.toContain("Rear Leg");
    });
});

describe("LAM and QuadVee chassis rules", () => {
    it("limits LAMs to 1 through 3 jump MP and a Standard Gyro", () => {
        const mech = new BattleMech();
        mech.setType("lam");
        mech.setJumpSpeed(0);
        expect(mech.getJumpSpeed()).toBe(1);
        mech.setJumpSpeed(8);
        expect(mech.getJumpSpeed()).toBe(3);
        mech.setGyroType("xl");
        expect(mech.getGyro().tag).toBe("standard");
    });

    it("restricts QuadVees to standard armor and internal structure", () => {
        const mech = new BattleMech();
        mech.setType("quadvee");
        mech.setArmorType("ferro-fibrous");
        mech.setInternalStructureType("endo-steel");
        expect(mech.getArmorType()).toBe("standard");
        expect(mech.getInternalStructureType()).toBe("standard");
    });

    it("persists the QuadVee tracked or wheeled motive selection", () => {
        const mech = new BattleMech();
        mech.setType("quadvee");
        mech.setQuadVeeMotive("wheeled");
        mech.setWalkSpeed(5);

        const restored = new BattleMech(mech.exportJSON(true));

        expect(restored.getQuadVeeMotive()).toBe("wheeled");
        expect(restored.getQuadVeeVehicleCruiseMP()).toBe(6);
        restored.setQuadVeeMotive("tracked");
        expect(restored.getQuadVeeVehicleCruiseMP()).toBe(5);
    });

    it("allows only chassis-appropriate transformation modes", () => {
        const lam = new BattleMech();
        lam.setType("lam");
        lam.setTransformationMode("aerospace");
        expect(lam.getTransformationMode()).toBe("aerospace");
        expect(lam.canUsePhysicalAttacksInCurrentMode()).toBe(false);

        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setTransformationMode("vehicle");
        expect(quadvee.getTransformationMode()).toBe("vehicle");
        expect(quadvee.canUseJumpJetsInCurrentMode()).toBe(false);
        expect(quadvee.getOperationalHeightLevels()).toBe(1);

        const biped = new BattleMech();
        biped.setTransformationMode("vehicle");
        expect(biped.getTransformationMode()).toBe("mech");
    });

    it("requires LAM avionics and landing gear in the mandated locations", () => {
        const mech = new BattleMech();
        mech.setType("lam");
        const criticals = mech.getCriticals();

        expect(criticals.head[3]?.tag).toBe("lam-avionics");
        expect(criticals.leftTorso.some(item => item?.tag === "lam-avionics")).toBe(true);
        expect(criticals.rightTorso.some(item => item?.tag === "lam-avionics")).toBe(true);
        expect(criticals.centerTorso.some(item => item?.tag === "lam-landing-gear")).toBe(true);
        expect(criticals.leftTorso.filter(item => item?.tag === "lam-landing-gear")).toHaveLength(1);
        expect(criticals.rightTorso.filter(item => item?.tag === "lam-landing-gear")).toHaveLength(1);
    });

    it("reserves both slots in all QuadVee legs for conversion gear", () => {
        const mech = new BattleMech();
        mech.setType("quadvee");
        const criticals = mech.getCriticals();

        expect(criticals.frontLeftLeg).toHaveLength(2);
        expect(criticals.frontRightLeg).toHaveLength(2);
        expect(criticals.leftLeg).toHaveLength(2);
        expect(criticals.rightLeg).toHaveLength(2);
        expect(criticals.frontLeftLeg.every(item => item?.tag === "quadvee-conversion" || item?.placeholder)).toBe(true);
        expect(criticals.frontRightLeg.every(item => item?.tag === "quadvee-conversion" || item?.placeholder)).toBe(true);
        expect(criticals.leftLeg.every(item => item?.tag === "quadvee-conversion" || item?.placeholder)).toBe(true);
        expect(criticals.rightLeg.every(item => item?.tag === "quadvee-conversion" || item?.placeholder)).toBe(true);
        expect(criticals.head.some(item => item?.tag === "multi-pilot-cockpit")).toBe(true);
        expect(criticals.centerTorso.some(item => item?.tag === "multi-pilot-cockpit")).toBe(true);
    });

    it("accounts for QuadVee conversion weight and dual cockpit weight", () => {
        const biped = new BattleMech();
        const quadvee = new BattleMech();
        quadvee.setType("quadvee");

        expect(quadvee.getCurrentTonnage() - biped.getCurrentTonnage()).toBe(3);
    });

    it("allows LAMs above 55 tons only at Custom Homebrew rules level", () => {
        expect(validateChassisCombination("standard", "lam", 60, 2)).toBe(false);
        expect(validateChassisCombination("standard", "lam", 60, 5)).toBe(true);
    });

    it("allows QuadVees to continue in Vehicle mode after gyro failure", () => {
        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setTransformationMode("vehicle");
        expect(quadvee.canOperateAfterGyroFailure()).toBe(true);
        expect(quadvee.hasMotiveSystemDamage()).toBe(false);

        const biped = new BattleMech();
        expect(biped.canOperateAfterGyroFailure()).toBe(false);
    });

    it("exposes chassis-specific combat capabilities", () => {
        const tripod = new BattleMech();
        tripod.setType("tripod");
        expect(tripod.hasFullTorsoTwist()).toBe(true);
        expect(tripod.getPilotingSkillModifier()).toBe(-1);
        expect(tripod.ignoresSecondaryTargetModifier()).toBe(true);

        const lam = new BattleMech();
        lam.setType("lam");
        lam.setTransformationMode("airmech");
        expect(lam.getAttackerMovementModifier()).toBe(3);

        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setTransformationMode("vehicle");
        expect(quadvee.hasFullTorsoTwist()).toBe(true);
        expect(quadvee.canUseHullDownRules()).toBe(true);
    });

    it("connects damaged QuadVee motive gear to Vehicle-mode Cruise MP", () => {
        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setQuadVeeMotive("wheeled");
        quadvee.setWalkSpeed(4);
        quadvee.setTransformationMode("vehicle");

        const frontLeg = quadvee.getCriticals().frontLeftLeg.find(item => item?.tag === "quadvee-conversion");
        expect(frontLeg).toBeDefined();
        frontLeg!.damaged = true;
        expect(quadvee.hasMotiveSystemDamage()).toBe(true);
        expect(quadvee.getQuadVeeVehicleCruiseMP()).toBe(0);
        expect(quadvee.getWalkSpeed()).toBe(0);
    });

    it("reduces effective movement after a leg is destroyed but preserves QuadVee vehicle motive", () => {
        const biped = new BattleMech();
        biped.setWalkSpeed(4);
        expect(biped.getWalkSpeed()).toBe(4);
        biped.takeDamage(100, "ll", false);
        expect(biped.getWalkSpeed()).toBe(3);

        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setWalkSpeed(4);
        quadvee.setQuadVeeMotive("wheeled");
        quadvee.setTransformationMode("vehicle");
        quadvee.takeDamage(100, "ll", false);
        expect(quadvee.getWalkSpeed()).toBe(5);
    });

    it("marks prohibited LAM equipment unavailable", () => {
        const mech = new BattleMech();
        mech.setType("lam");
        mech.setEra("ilClan");

        const equipment = mech.getAvailableEquipment(true);
        expect(equipment.find(item => item.tag === "gauss-rifle-heavy")?.available).toBe(false);
        expect(equipment.find(item => item.tag === "rotary-ac-2")?.available).toBe(false);
        expect(equipment.find(item => item.tag === "melee-hatchet")?.available).toBe(false);
    });

    it("applies Tripod cockpit, gyro, Omni, and one-leg stability rules", () => {
        const tripod = new BattleMech();
        tripod.setType("tripod");
        tripod.setWalkSpeed(4);
        tripod.toggleOmni();
        expect(tripod.isOmnimech).toBe(false);
        expect(tripod.getCockpitWeight()).toBe(4);
        expect(tripod.getCriticals().head.some(item => item?.tag === "multi-pilot-cockpit")).toBe(true);
        expect(tripod.getCriticals().centerTorso.some(item => item?.tag === "multi-pilot-cockpit")).toBe(true);
        tripod.takeDamage(100, "ll", false);
        expect(tripod.getWalkSpeed()).toBe(4);
    });
});