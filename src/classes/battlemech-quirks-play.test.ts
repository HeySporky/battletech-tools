import { describe, expect, it } from "vitest";
import { getTargetToHitFromWeapon } from "../utils";
import { BattleMech, ITargetToHit } from "./battlemech";
import { BattleMechForce } from "./battlemech-force";

// Design quirks in Classic play (quirks design, plan 3): applied only with the game's "Use design quirks" switch on.
const SHORT_RANGE = { name: "Target", active: true, range: 1, movement: 0, otherMods: 0, jumped: false, primary: true, inRearArc: false };

const mechWith = (...tags: string[]): BattleMech => {
    const mech = new BattleMech();
    mech.setTonnage(50);
    mech.setWalkSpeed(4);
    for (const tag of tags) {
        mech.addEquipmentFromTag(tag, "is", "rt", false, undefined, "a", false, [], undefined, undefined);
    }
    return mech;
};

describe("quirk to-hit in the GATOR", () => {
    it("gives an Accurate medium laser one less to-hit, with the quirk named", () => {
        const mech = mechWith("medium-laser");
        const laser = mech.equipmentList[0];
        const plain = getTargetToHitFromWeapon(mech, 0, SHORT_RANGE, null, true).finalToHit;
        expect(mech.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: laser.uuid })).toBeNull();
        const gator = getTargetToHitFromWeapon(mech, 0, SHORT_RANGE, null, true);
        expect(gator.finalToHit).toBe(plain - 1);
        expect(gator.otherModifiersExplanation).toContain("Accurate Weapon (-1)");
    });

    // Review Focus 3: switch off, or a save from before the switch.
    it("changes nothing with the switch off", () => {
        const mech = mechWith("medium-laser");
        const plain = getTargetToHitFromWeapon(mech, 0, SHORT_RANGE).finalToHit;
        mech.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: mech.equipmentList[0].uuid });
        expect(getTargetToHitFromWeapon(mech, 0, SHORT_RANGE).finalToHit).toBe(plain);
        expect(getTargetToHitFromWeapon(mech, 0, SHORT_RANGE, null, false).otherModifiersExplanation ?? "").not.toContain("Accurate");
    });

    it("applies Improved Targeting only in its own range band", () => {
        const mech = mechWith("medium-laser");
        const long = { ...SHORT_RANGE, range: 9 };
        const plainShort = getTargetToHitFromWeapon(mech, 0, SHORT_RANGE, null, true).finalToHit;
        const plainLong = getTargetToHitFromWeapon(mech, 0, long, null, true).finalToHit;
        mech.quirks.add({ tag: "quirk-improved-targeting", parameter: "long" });
        expect(getTargetToHitFromWeapon(mech, 0, SHORT_RANGE, null, true).finalToHit).toBe(plainShort);
        expect(getTargetToHitFromWeapon(mech, 0, long, null, true).finalToHit).toBe(plainLong - 1);
    });

    // Anti-Aircraft Targeting: -2 against airborne (not grounded) units, not jumping 'Mechs (CO p.225).
    it("gives Anti-Aircraft Targeting -2 against an airborne target only", () => {
        const mech = mechWith("medium-laser");
        const plain = getTargetToHitFromWeapon(mech, 0, SHORT_RANGE, null, true).finalToHit;
        mech.quirks.add({ tag: "quirk-anti-aircraft-targeting" });
        expect(getTargetToHitFromWeapon(mech, 0, SHORT_RANGE, null, true).finalToHit).toBe(plain);
        expect(getTargetToHitFromWeapon(mech, 0, { ...SHORT_RANGE, airborne: true }, null, true).finalToHit).toBe(plain - 2);
    });

    it("leaves an out-of-range shot impossible", () => {
        const mech = mechWith("medium-laser");
        mech.quirks.add({ tag: "quirk-sensor-ghosts" });
        expect(getTargetToHitFromWeapon(mech, 0, { ...SHORT_RANGE, range: 30 }, null, true).finalToHit).toBe(-1);
    });
});

// Maximum Tech p.59: the targeting and tracking systems' range, anti-aircraft and multi-target modifiers.
describe("targeting and tracking systems in the GATOR (Maximum Tech p.59)", () => {
    // A medium laser (3/6/9), rear-mounted for a target in the rear arc; the list sorts, so find it by tag.
    const toHit = (target: ITargetToHit, ...tags: string[]) => {
        const mech = mechWith(...tags);
        mech.addEquipmentFromTag("medium-laser", "is", "rt", target.inRearArc, undefined, "a", false, [], undefined, undefined);
        return getTargetToHitFromWeapon(mech, mech.equipmentList.findIndex(item => item.tag === "medium-laser"), target);
    };
    const bands = (mech: BattleMech) => [1, 5, 9].map(range => getTargetToHitFromWeapon(mech, mech.equipmentList.findIndex(item => item.tag === "medium-laser"), { ...SHORT_RANGE, range }).rangeModifier);

    it("reads the long- and short-range systems' range modifiers, and the VRTS setting", () => {
        expect(bands(mechWith("medium-laser"))).toEqual([0, 2, 4]);
        expect(bands(mechWith("medium-laser", "targeting-long-range"))).toEqual([1, 2, 3]);
        expect(bands(mechWith("medium-laser", "targeting-short-range"))).toEqual([-1, 2, 5]);
        const vrts = mechWith("medium-laser", "targeting-variable-range");
        expect(bands(vrts)).toEqual([0, 2, 4]);
        vrts.targetingRangeSetting = "short";
        expect(bands(vrts)).toEqual([-1, 2, 5]);
        vrts.targetingRangeSetting = "long";
        const copy = new BattleMech();
        copy.importJSON(vrts.exportJSON());
        expect(bands(copy)).toEqual([1, 2, 3]);
    });

    it("gives anti-aircraft targeting -2 against airborne targets and +1 against the rest", () => {
        const plain = toHit(SHORT_RANGE).finalToHit;
        expect(toHit(SHORT_RANGE, "targeting-anti-aircraft").finalToHit).toBe(plain + 1);
        const airborne = toHit({ ...SHORT_RANGE, airborne: true }, "targeting-anti-aircraft");
        expect([airborne.finalToHit, airborne.otherModifiersExplanation]).toEqual([plain - 2, "Anti-Aircraft Targeting (-2)"]);
    });

    it("drops the secondary-target modifier with Multi-Trac: +1 outside the front arc, none with Multi-Trac II", () => {
        const secondary = { ...SHORT_RANGE, primary: false };
        const rear = { ...secondary, inRearArc: true };
        const plain = toHit(SHORT_RANGE).finalToHit;
        expect([toHit(secondary).finalToHit, toHit(rear).finalToHit]).toEqual([plain + 1, plain + 2]);
        expect(toHit(secondary).otherModifiersExplanation).toBe("Secondary Target In Front Arc (+1)");
        expect([toHit(secondary, "targeting-multi-trac").finalToHit, toHit(rear, "targeting-multi-trac").finalToHit]).toEqual([plain, plain + 1]);
        expect([toHit(secondary, "targeting-multi-trac-ii").finalToHit, toHit(rear, "targeting-multi-trac-ii").finalToHit]).toEqual([plain, plain]);
    });
});

describe("Combat Computer heat", () => {
    // Review Focus 5: generated heat floors at 0 and never eats into dissipation.
    it("leaves 3 generated heat at 0, so only dissipation counts", () => {
        const mech = mechWith("small-laser", "small-laser");
        mech.currentMovementMode = "w";
        const dissipation = mech.getActiveHeatDissipation();
        expect(mech.getTurnHeatDifference(null, true)).toBe(3 - dissipation);
        mech.quirks.add({ tag: "quirk-combat-computer" });
        expect(mech.getTurnHeatDifference(null, true)).toBe(-dissipation);
        expect(mech.getTurnHeatDifference()).toBe(3 - dissipation);
    });
});

// Cooling jacket weapon quirks change a fired weapon's heat (final review); Improved never below 1 (CO p.227).
describe("cooling jacket heat", () => {
    const firing = (tag: string, quirkTag: string | null): BattleMech => {
        const mech = mechWith(tag);
        const weapon = mech.equipmentList[0];
        weapon.target = "a";
        if (quirkTag) expect(mech.quirks.add({ tag: quirkTag, equipmentUuid: weapon.uuid })).toBeNull();
        return mech;
    };

    it("adds 2 heat for a No Cooling Jacket medium laser, with the switch on only", () => {
        const plain = firing("medium-laser", null).getActiveWeaponHeat();
        const mech = firing("medium-laser", "quirk-no-cooling-jacket");
        expect(mech.getActiveWeaponHeat(null, true)).toBe(plain + 2);
        expect(mech.getActiveWeaponHeat()).toBe(plain);
        mech.currentMovementMode = "w";
        expect(mech.getTurnHeatDifference(null, true) - mech.getTurnHeatDifference()).toBe(2);
    });

    it("takes 1 heat off an Improved Cooling Jacket small laser, never below 1", () => {
        const laser = firing("small-laser", "quirk-improved-cooling-jacket");
        expect(laser.getActiveWeaponHeat(null, true)).toBe(1);
        const medium = firing("medium-laser", "quirk-improved-cooling-jacket");
        expect(medium.getActiveWeaponHeat(null, true)).toBe(firing("medium-laser", null).getActiveWeaponHeat() - 1);
    });
});

describe("the force's Heat Phase", () => {
    it("applies Combat Computer heat only with the game's switch on", () => {
        const heatAfterTurn = (quirksInPlay: boolean): number => {
            const force = new BattleMechForce();
            const mech = mechWith("medium-laser", "medium-laser", "medium-laser", "medium-laser", "medium-laser");
            mech.currentMovementMode = "r";
            mech.quirks.add({ tag: "quirk-combat-computer" });
            force.groups[0].members.push(mech);
            force.quirksInPlay = quirksInPlay;
            force.applyHeat();
            return mech.currentHeat;
        };
        expect(heatAfterTurn(false) - heatAfterTurn(true)).toBe(4);
    });
});
