import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

// Issue 35: each 'Mech's option lists carry that 'Mech's availability marks; listing another 'Mech's
// options must not change them.
describe("'Mech option lists keep their own availability marks (issue 35)", () => {
    const mechIn = (era: string) => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.setEra(era);
        return mech;
    };
    const lists: [string, (mech: BattleMech) => { tag: string; available?: boolean }[], string][] = [
        ["engines", (mech) => mech.getAvailableEngines(), "xl"],
        ["armor", (mech) => mech.getAvailableArmorTypes(), "ferro-fibrous"],
        ["structure", (mech) => mech.getAvailableInternalStructures(), "endo-steel"],
        ["heat sinks", (mech) => mech.getAvailableHeatSinks(), "double"],
    ];
    for (const [name, list, tag] of lists) {
        it(`${name}: a Late Succession Wars list does not change a Civil War one`, () => {
            const modern = list(mechIn("civil-war"));
            expect(modern.find((option) => option.tag === tag)?.available).toBe(true);
            const old = list(mechIn("late-sw-lt"));
            expect(old.find((option) => option.tag === tag)?.available).toBe(false);
            expect(modern.find((option) => option.tag === tag)?.available).toBe(true);
        });
    }
    it("gyros, cockpits, myomer and jump jets are copies too", () => {
        const a = mechIn("civil-war");
        const b = mechIn("late-sw-lt");
        expect(a.getAvailableGyros()[0]).not.toBe(b.getAvailableGyros()[0]);
        expect(a.getAvailableCockpits()[0]).not.toBe(b.getAvailableCockpits()[0]);
        expect(a.getAvailableMyomerTypes()[0]).not.toBe(b.getAvailableMyomerTypes()[0]);
        expect(a.getAvailableJumpJets()[0]).not.toBe(b.getAvailableJumpJets()[0]);
    });
    it("a 'Mech is anachronistic by its own era, whatever another 'Mech listed", () => {
        const old = mechIn("late-sw-lt");
        old.setEngineType("xl");
        old.setArmorType("ferro-fibrous");
        // A Civil War 'Mech lists the same engine and armor as available.
        const modern = mechIn("civil-war");
        modern.getAvailableEngines();
        modern.getAvailableArmorTypes();
        expect(old.makeTROBBCode()).toContain("Anachronistic");
        expect(modern.makeTROBBCode()).not.toContain("Anachronistic");
    });
});
