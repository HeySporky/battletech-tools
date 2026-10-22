import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

// Improved Magnetic Grapples (Custom Homebrew): an upgrade on the magnetic sole plates every 'Mech has (Explorer Corps p.86).

const TAG = "custom-mech-improved-magnetic-grapples";

const build = (): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setTonnage(50);
    mech.setWalkSpeed(4);
    return mech;
};
const add = (mech: BattleMech) => mech.addEquipmentFromTag(TAG, "custom", "", false, undefined, "", false, [], undefined, undefined)!;
const place = (mech: BattleMech, item: { uuid?: string }, loc: string, key: string) =>
    mech.moveCritical("un", mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid), loc, (mech.getCriticals() as any)[key].findIndex((critical: unknown) => !critical));
const offered = (mech: BattleMech, includeCustom: boolean, rulesLevel: number) =>
    mech.getAvailableEquipment(includeCustom, rulesLevel).some(item => item.tag === TAG);

describe("Improved Magnetic Grapples (Custom Homebrew)", () => {
    it("are offered only at the Custom Homebrew rules level", () => {
        const mech = build();
        expect(offered(mech, false, CUSTOM_HOMEBREW_RULES_LEVEL - 1)).toBe(false);
        expect(offered(mech, true, CUSTOM_HOMEBREW_RULES_LEVEL)).toBe(true);
    });

    it("go one to a foot, half a ton and 1 slot each, and never in an arm or torso", () => {
        const mech = build();
        const left = add(mech);
        const second = add(mech);
        expect(left.weight).toBe(0.5);
        expect(place(mech, left, "ll", "leftLeg")).toBe(true);
        expect(place(mech, second, "ll", "leftLeg")).toBe(false);
        expect(place(mech, second, "la", "leftArm")).toBe(false);
        expect(place(mech, second, "ct", "centerTorso")).toBe(false);
        expect(place(mech, second, "rl", "rightLeg")).toBe(true);
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
    });

    it("note that every 'Mech already has magnetic sole plates", () => {
        const item = build().getAvailableEquipment(true, CUSTOM_HOMEBREW_RULES_LEVEL).find(entry => entry.tag === TAG)!;
        expect(item.notes).toContain("Explorer Corps p.86");
        expect(item.name).toBe("Improved Magnetic Grapples (Custom)");
    });

    it("go in all four feet of a four-legged 'Mech", () => {
        const mech = build();
        mech.setMechType("quad");
        expect(mech.isQuad()).toBe(true);
        for (const [loc, key] of [["fll", "frontLeftLeg"], ["frl", "frontRightLeg"], ["ll", "leftLeg"], ["rl", "rightLeg"]]) {
            expect(place(mech, add(mech), loc, key)).toBe(true);
        }
        expect(mech.getAvailableEquipment(true, CUSTOM_HOMEBREW_RULES_LEVEL).find(item => item.tag === TAG)?.available).toBe(false);
    });
});
