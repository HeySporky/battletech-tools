import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { FW_POWER_ARMOR_RULESET } from "../data/future-wars-power-armor";
import { buildMech } from "../test-support/builders";

/**
 * Power Armor plan, Chunk A (#172): Bill Swisher's Power Armor built as a BattleMech under a construction Special
 * Ruleset (Best-of pp.14-16; Future Wars #14 pp.43-45 for the sheets).
 */
const PA = FW_POWER_ARMOR_RULESET;

const build = (tonnage: number, walk: number = 4, rulesets: string[] = [PA], type: string = "biped"): BattleMech =>
    buildMech({ type, tonnage, walk, homebrew: rulesets });

type Slots = Record<string, ({ tag: string; name: string; placeholder?: boolean; uuid: string } | null)[]>;
const criticals = (mech: BattleMech) => mech.getCriticals() as unknown as Slots;
/** Every slot of a location by tag, placeholders under the tag of the item they continue. */
const slotTags = (mech: BattleMech, location: string): (string | null)[] => {
    let last: string | null = null;
    return criticals(mech)[location].map(slot => {
        if (!slot) return (last = null);
        if (slot.placeholder) return last;
        return (last = slot.tag);
    });
};
const weight = (mech: BattleMech, name: string) => mech.getWeightBreakdown().find(row => row.name === name)?.weight;
const LOCATIONS = ["hd", "ct", "lt", "rt", "la", "ra", "ll", "rl"];
const addWeapon = (mech: BattleMech, tag: string) =>
    mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined);

describe("Power Armor construction (Best-of p.16)", () => {
    it("builds a two-legged 'Mech of 5, 10 or 15 tons", () => {
        expect([5, 10, 15].map(tons => build(tons).usesPowerArmorConstruction())).toEqual([true, true, true]);
        expect(build(20).usesPowerArmorConstruction()).toBe(false);
        expect(build(10, 4, [PA], "quad").usesPowerArmorConstruction()).toBe(false);
        expect(build(10, 4, []).usesPowerArmorConstruction()).toBe(false);
    });

    it("reports a tonnage or a type the rules do not build, and builds it by the standard rules", () => {
        const heavy = build(20);
        expect(heavy.getChassisEquipmentViolations()).toContain("Power Armor (Special Ruleset) is built at 5, 10 or 15 tons on two legs; this 20-ton Biped is built by the standard rules.");
        expect(heavy.getLocationSlotCount("la")).toBe(12);
        expect(build(10, 4, [PA], "quad").getChassisEquipmentViolations().some(v => /^Power Armor \(Special Ruleset\)/.test(v))).toBe(true);
        expect(build(10).getChassisEquipmentViolations().some(v => /^Power Armor \(Special Ruleset\)/.test(v))).toBe(false);
    });

    it("has six slots a location and twelve in the center torso, at every tonnage", () => {
        for (const tons of [5, 10, 15]) {
            const mech = build(tons);
            expect(LOCATIONS.map(loc => mech.getLocationSlotCount(loc))).toEqual([6, 12, 6, 6, 6, 6, 6, 6]);
            expect(LOCATIONS.map(loc => criticals(mech)[{ hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm", ll: "leftLeg", rl: "rightLeg" }[loc]!].length))
                .toEqual([6, 12, 6, 6, 6, 6, 6, 6]);
        }
    });

    it("puts the waldo where the sheets put the pilot: head slots 3-4 and center torso slots 11-12, beside the printed life support and sensors", () => {
        const mech = build(10, 7);
        expect(slotTags(mech, "head")).toEqual(["life-support", "sensors", "cockpit", "cockpit", "sensors", "life-support"]);
        expect(criticals(mech).head[2]?.name).toBe("Pilot");
        expect(slotTags(mech, "centerTorso")).toEqual(["engine", "engine", "engine", "gyro", "gyro", "gyro", "gyro", "engine", "engine", "engine", "cockpit", "cockpit"]);
        expect(criticals(mech).centerTorso[10]?.name).toBe("Pilot");
    });

    it("weighs and prices the waldo in place of the cockpit: 0.5 tons, 50,000 C-bills", () => {
        const mech = build(10, 7);
        expect(mech.getCockpitType().tag).toBe("power-armor-waldo");
        expect(mech.getCockpitWeight()).toBe(0.5);
        expect(weight(mech, "Power Armor Waldo System")).toBe(0.5);
        expect(weight(mech, "Cockpit")).toBeUndefined();
        expect(mech.getCostBreakdown().steps.find(step => step.label === "Power Armor Waldo System")?.value).toBe(50000);
        expect(mech.getAvailableCockpits(CUSTOM_HOMEBREW_RULES_LEVEL).map(cockpit => cockpit.tag)).toEqual(["power-armor-waldo"]);
    });

    it("keeps the upper and lower arm actuators; the hand is optional", () => {
        const mech = build(10);
        mech.removeLowerArmActuator("ra");
        expect(mech.hasLowerArmActuator("ra")).toBe(true);
        expect(slotTags(mech, "rightArm").slice(0, 3)).toEqual(["shoulder", "upper-arm-actuator", "lower-arm-actuator"]);
        mech.removeHandActuator("la");
        expect(mech.hasHandActuator("la")).toBe(false);
        expect(mech.hasLowerArmActuator("la")).toBe(true);
    });

    it("reports a suit built without arms", () => {
        const mech = build(10);
        mech.setArmless(true);
        expect(mech.getChassisEquipmentViolations()).toContain("Power Armor needs both arms, with their upper and lower arm actuators (Best-of p.16).");
    });

    it("keeps the standard head structure at 10 and 15 tons, with at most twice that in head armor", () => {
        for (const tons of [10, 15]) {
            const mech = build(tons);
            expect(mech.getMaxHeadArmor()).toBe(mech.getInternalStructure().head * 2);
            expect(mech.getMaxHeadArmor()).toBe(6);
        }
        const mech = build(10);
        mech.setHeadArmor(7);
        expect(mech.getChassisEquipmentViolations()).toContain("Head armor 7 is more than twice the head's 3 internal structure points (Power Armor, Best-of p.16): at most 6.");
    });

    it("refuses weapons in the head or center torso", () => {
        const mech = build(5, 6);
        addWeapon(mech, "small-laser");
        const index = mech.getUnallocatedCriticals().findIndex(slot => slot?.tag === "small-laser");
        expect(mech.moveCritical("un", index, "ct", 6)).toBe(true);
        expect(mech.getChassisEquipmentViolations()).toContain("Small Laser is in the center torso: Power Armor carries no weapons in the head or center torso (Best-of p.15).");
    });
});

describe("The 5-ton suit (Best-of p.16)", () => {
    it("has no gyro: no weight, no slots", () => {
        const mech = build(5, 6);
        expect(mech.getGyroWeight()).toBe(0);
        expect(slotTags(mech, "centerTorso")).toEqual(["engine", "engine", "engine", "engine", "engine", "engine", null, null, null, null, "cockpit", "cockpit"]);
        expect(mech.getGyro().tag).toBe("none");
    });

    it("has structure H1 CT3 ST2 A1 L1, and at most 2 head armor", () => {
        const structure = build(5).getInternalStructure();
        expect([structure.head, structure.centerTorso, structure.leftTorso, structure.rightTorso, structure.leftArm, structure.rightArm, structure.leftLeg, structure.rightLeg])
            .toEqual([1, 3, 2, 2, 1, 1, 1, 1]);
        expect(build(5).getMaxHeadArmor()).toBe(2);
    });

    it("shields a fusion engine with half its weight, rounded up to the half ton", () => {
        const mech = build(5, 12); // rating 60: a 1.5-ton standard fusion engine
        expect(mech.getEngineWeight()).toBe(1.5);
        expect(weight(mech, "Fusion Engine Shielding")).toBe(1);
        expect(weight(build(10, 6), "Fusion Engine Shielding")).toBeUndefined();
    });

    it("carries flamers, machine guns and small lasers only", () => {
        const mech = build(5, 6);
        addWeapon(mech, "small-laser");
        addWeapon(mech, "machine-gun");
        expect(mech.getChassisEquipmentViolations().filter(v => /5-ton Power Armor/.test(v))).toEqual([]);
        addWeapon(mech, "medium-laser");
        expect(mech.getChassisEquipmentViolations()).toContain("Medium Laser: a 5-ton Power Armor suit carries only flamers, machine guns and small lasers (Best-of p.16).");
        expect(build(10, 6).getChassisEquipmentViolations().filter(v => /5-ton Power Armor/.test(v))).toEqual([]);
    });
});

describe("Without the ruleset", () => {
    it("a 10-ton 'Mech reads as today", () => {
        const mech = build(10, 7, []);
        expect(LOCATIONS.map(loc => mech.getLocationSlotCount(loc))).toEqual([6, 12, 12, 12, 12, 12, 6, 6]);
        expect(mech.getCockpitType().tag).toBe("standard");
        expect(mech.getCockpitWeight()).toBe(3);
        expect(mech.getGyroWeight()).toBe(1);
        expect(mech.getGyro().tag).toBe("standard");
        expect(mech.getMaxHeadArmor()).toBe(9);
        expect(mech.getInternalStructure().head).toBe(3);
        mech.removeLowerArmActuator("ra");
        expect(mech.hasLowerArmActuator("ra")).toBe(false);
        expect(slotTags(mech, "head")).toEqual(["life-support", "sensors", "cockpit", null, "sensors", "life-support"]);
    });

    it("ticking and unticking the ruleset moves a 10-ton 'Mech between the two builds", () => {
        const mech = build(10, 7, []);
        mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesets: [PA] });
        expect(mech.getLocationSlotCount("la")).toBe(6);
        expect(mech.getCockpitWeight()).toBe(0.5);
        mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesets: [] });
        expect(mech.getLocationSlotCount("la")).toBe(12);
        expect(mech.getCockpitWeight()).toBe(3);
    });

    it("a 5-ton suit unticked goes back to the edition's structure and a gyro", () => {
        const mech = build(5, 6);
        mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesets: [] });
        expect(mech.getInternalStructure().head).toBe(3);
        expect(mech.getGyro().tag).toBe("standard");
        expect(mech.getGyroWeight()).toBe(1);
    });

    it("round-trips the ruleset through exportJSON and importJSON", () => {
        const copy = new BattleMech();
        copy.importJSON(build(5, 6).exportJSON());
        expect(copy.usesPowerArmorConstruction()).toBe(true);
        expect(copy.getInternalStructure().head).toBe(1);
        expect(copy.getGyroWeight()).toBe(0);
    });
});
