import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { buildMech } from "../test-support/builders";

/**
 * Best of Future Wars plan, Chunk B (#172): the Pom-Pom, Swing Fire and Power Booster on a 'Mech. A converted weapon is
 * one record, so it cannot be left behind by its weapon; the leg and jump-jet boosters are items of their own.
 */
const build = (jump: number = 0): BattleMech => buildMech({ tonnage: 65, jump, homebrew: true });
const mount = (mech: BattleMech, tag: string) => mech.addEquipmentFromTag(tag, "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);

describe("Best of Future Wars conversions on a 'Mech", () => {
    it("a Pom-Pom AC/20 mounts as one item of 19 tons and 12 slots", () => {
        const mech = build();
        const pomPom = mount(mech, "custom-pom-pom-ac-20");
        expect(pomPom?.weight).toBe(19);
        expect(pomPom?.space.battlemech).toBe(12);
        expect(mech.getInstalledEquipment().filter((item) => item.tag.startsWith("custom-pom-pom"))).toHaveLength(1);
    });

    it("a jump-jet Power Booster with no jump jets is an issue; with jump jets it is not", () => {
        const grounded = build(0);
        mount(grounded, "custom-power-booster-jumping");
        expect(grounded.getChassisEquipmentViolations()).toContain("Power Booster (Jump Jets) needs jump jets to boost (The Best of Future Wars p.28).");

        const jumper = build(4);
        mount(jumper, "custom-power-booster-jumping");
        expect(jumper.getChassisEquipmentViolations().filter((line) => line.startsWith("Power Booster"))).toEqual([]);
    });

    it("one Power Booster to a system: a second leg booster is an issue", () => {
        const mech = build();
        mount(mech, "custom-power-booster-running");
        expect(mech.getChassisEquipmentViolations().filter((line) => line.startsWith("Power Booster"))).toEqual([]);
        mount(mech, "custom-power-booster-running");
        expect(mech.getChassisEquipmentViolations()).toContain("Power Booster (Running): 2 mounted; at most 1 allowed.");
    });
});
