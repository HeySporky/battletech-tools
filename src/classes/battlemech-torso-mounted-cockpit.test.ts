import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "./battlemech";

// Torso-Mounted Cockpit (TO:AUE p.112): 4 tons; cockpit and sensors in the center torso, Life Support in each side
// torso, the head keeps its 2 sensor slots. BV: center torso armor counts twice, then x0.95 (p.193).
const tags = (slots: ({ tag: string } | null | undefined)[]) => slots.map((slot) => slot?.tag ?? "");

function mech(): BattleMech {
    const unit = new BattleMech();
    unit.setTech("is");
    unit.setEra("dark-ages");
    unit.setTonnage(50);
    unit.setWalkSpeed(5);
    return unit;
}

describe("a Torso-Mounted Cockpit", () => {
    it("is offered beside the Standard and Small cockpits, and moves the cockpit out of the head", () => {
        const unit = mech();
        expect(unit.getAvailableCockpits(4).map((cockpit) => cockpit.tag)).toEqual(["standard", "small", "torso-mounted", "interface"]);
        // It is Experimental (TO:AUE p.112).
        expect(unit.getAvailableCockpits(3).find((cockpit) => cockpit.tag === "torso-mounted")?.available).toBe(false);
        expect(unit.setCockpitType("torso-mounted").tag).toBe("torso-mounted");
        expect(unit.getCockpitWeight()).toBe(4);
        expect(unit.getRequiredRulesLevel()).toBe(4);
        const criticals = unit.getCriticals();
        expect(tags(criticals.head)).toEqual(["sensors", "sensors", "", "", "", ""]);
        expect(tags(criticals.centerTorso.slice(10, 12))).toEqual(["cockpit", "sensors"]);
        expect(tags(criticals.leftTorso.slice(0, 1))).toEqual(["life-support"]);
        expect(tags(criticals.rightTorso.slice(0, 1))).toEqual(["life-support"]);
    });

    it("counts the center torso armor twice and takes 0.95 of the BV: Night Stalker NSR-K1 is 1,149 (its SSW BV2)", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const unit = new BattleMech();
        unit.importSSWXML(readFileSync("src/utils/__fixtures__/night-stalker-nsr-k1.ssw", "utf8"));
        expect(unit.getBattleValue()).toBe(1149);
    });

    it("can't be combined with a Full-Head Ejection System (TO:AUE p.116)", () => {
        const unit = mech();
        unit.addEquipmentFromTag("full-head-ejection-system", "", "", false, null, undefined, undefined, undefined, undefined, undefined);
        expect(unit.getChassisEquipmentViolations().filter((text) => text.includes("Torso-Mounted"))).toEqual([]);
        unit.setCockpitType("torso-mounted");
        expect(unit.getChassisEquipmentViolations()).toContain("Full-Head Ejection System cannot be combined with a Torso-Mounted Cockpit (TO:AUE p.116).");
    });

    it("survives a save and load", () => {
        const unit = mech();
        unit.setCockpitType("torso-mounted");
        expect(new BattleMech(unit.exportJSON()).getCockpitType().tag).toBe("torso-mounted");
    });

    it("imports from SSW with every item where the file puts it: Night Stalker NSR-K1", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const unit = new BattleMech();
        unit.importSSWXML(readFileSync("src/utils/__fixtures__/night-stalker-nsr-k1.ssw", "utf8"));
        expect(unit.getCockpitType().tag).toBe("torso-mounted");
        expect(unit.getSSWUnresolved()).toEqual([]);
        expect(unit.getUnallocatedCriticals().map((item) => item.tag)).toEqual([]);
    });

    // "A 'Mech using this system may survive 2 sensor critical hits and still perform weapon attacks... Three sensor
    // hits (or more) completely blind" it (TO:AUE p.113). Its sensors sit in the head and the center torso (#615).
    it("counts the center torso sensors and fires until the third sensor hit", () => {
        const unit = mech();
        unit.setCockpitType("torso-mounted");
        unit.toggleCritical("ct", 11);
        expect(unit.sensorHits()).toBe(1);
        unit.toggleCritical("hd", 0);
        expect(unit.areSensorsDestroyed()).toBe(false);
        unit.toggleCritical("hd", 1);
        expect(unit.sensorHits()).toBe(3);
        expect(unit.areSensorsDestroyed()).toBe(true);
    });

    it("adds +2 to-hit at the first sensor hit, +4 at the second, and +4 Piloting once blind (TO:AUE p.113; TW p.117)", () => {
        const standard = mech();
        standard.toggleCritical("hd", 1);
        expect(standard.getSensorToHitModifier()).toBe(2);
        const unit = mech();
        unit.setCockpitType("torso-mounted");
        const piloting = unit.getPilotingSkillModifier();
        unit.toggleCritical("ct", 11);
        expect(unit.getSensorToHitModifier()).toBe(2);
        unit.toggleCritical("hd", 0);
        expect(unit.getSensorToHitModifier()).toBe(4);
        expect(unit.getPilotingSkillModifier()).toBe(piloting);
        unit.toggleCritical("ct", 11);
        unit.toggleCritical("hd", 1);
        expect(unit.getPilotingSkillModifier()).toBe(piloting + 4);
        unit.toggleCritical("ct", 11);
        expect(unit.getSensorToHitModifier()).toBe(0);
        expect(unit.getPilotingSkillModifier()).toBe(piloting + 4);
    });
});
