import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { buildMech } from "../test-support/builders";

// 'Mech handheld weapons (#611): construction in Maximum Tech p.79 and Tactical Operations: Advanced Units & Equipment pp.126-128;
// the BV is added to the carrying 'Mech's final BV (Maximum Tech p.92; TO:AUE p.193).
const MASTER = "master-rules-revised";
const LASER = { entries: [{ tag: "medium-laser" }], armor: 0 };
const mech = (edition = "total-warfare", tons = 50): BattleMech => {
    const unit = buildMech({ tonnage: tons, walk: 4 });
    unit.setRulesEdition(edition);
    return unit;
};

describe("which 'Mechs may carry a handheld weapon", () => {
    it("takes a biped with both hands, in the editions that print the rules", () => {
        expect(mech().canCarryHandheld().allowed).toBe(true);
        expect(mech(MASTER).canCarryHandheld().allowed).toBe(true);
        expect(mech("battletech-compendium").canCarryHandheld().allowed).toBe(false);
    });

    it("needs two full sets of arm and hand actuators: not an armless, four-legged or one-handed 'Mech", () => {
        const quad = buildMech({ tonnage: 50, walk: 4, type: "quad" });
        expect(quad.canCarryHandheld().allowed).toBe(false);
        const armless = mech();
        armless.setArmless(true);
        expect(armless.canCarryHandheld().allowed).toBe(false);
        const oneHand = mech();
        oneHand.removeHandActuator("ra");
        expect(oneHand.canCarryHandheld().reason).toMatch(/hand/i);
        expect(oneHand.setHandheldWeapon(LASER)).toBe(false);
    });

    it("is offered at Experimental rules in Total Warfare and at Advanced rules in the Master Rules", () => {
        expect(mech().getHandheldOption(3).available).toBe(false);
        expect(mech().getHandheldOption(4).available).toBe(true);
        expect(mech(MASTER).getHandheldOption(2).available).toBe(false);
        expect(mech(MASTER).getHandheldOption(3).available).toBe(true);
    });
});

describe("a handheld weapon's Battle Value is added to the carrier's final BV", () => {
    it("adds the weapon, its ammunition and its armor factor x 2 once under BV2 (TO:AUE p.193)", () => {
        const unit = mech();
        const before = unit.getBattleValue();
        expect(unit.setHandheldWeapon({ entries: [{ tag: "medium-laser" }], armor: 16 })).toBe(true);
        expect(unit.getBattleValue() - before).toBe(46 + 32);
        expect(unit.getBattleValueBreakdown().steps.map((step) => step.id)).toContain("bv2.final.handheld");
        expect(unit.setHandheldWeapon(null)).toBe(true);
        expect(unit.getBattleValue()).toBe(before);
    });

    it("adds its BV1 under the Master Rules editions (Maximum Tech p.92)", () => {
        const unit = mech(MASTER);
        const before = unit.getBattleValue();
        unit.setHandheldWeapon({ entries: [{ tag: "medium-laser" }], armor: 16 });
        const gain = unit.getBattleValue() - before;
        expect(gain).toBe(unit.getHandheldAnalysis()!.battleValue);
        expect(gain).toBeGreaterThan(32);
        expect(unit.getBattleValueBreakdown().steps.map((step) => step.id)).toContain("bv1.l3.final.handheld");
    });

    it("leaves a 'Mech with no handheld weapon exactly where it was", () => {
        const unit = mech();
        expect(unit.getBattleValueBreakdown().steps.map((step) => step.id)).not.toContain("bv2.final.handheld");
    });

    it("prices it at twice its parts in the C-bill cost, and adds no tonnage or slots", () => {
        const unit = mech();
        const cost = unit.getCBillCostNumeric();
        const tons = unit.getCurrentTonnage();
        unit.setHandheldWeapon(LASER);
        expect(unit.getCBillCostNumeric() - cost).toBe(Math.round(2 * (40000 + 3 * 2000) * 1.5));
        expect(unit.getCurrentTonnage()).toBe(tons);
    });
});

describe("the cargo limit", () => {
    it("holds the weight to 10 percent of the 'Mech's tonnage, 20 percent with active Triple-Strength Myomer", () => {
        const unit = mech("total-warfare", 50);
        unit.setHandheldWeapon({ entries: [{ tag: "medium-laser", count: 2 }], armor: 0 });
        expect(unit.getHandheldAnalysis()!.weight).toBe(8);
        expect(unit.getHandheldCargoLimit()).toBe(5);
        expect(unit.getHandheldIssues().join(" ")).toMatch(/cargo limit/i);
        unit.setHandheldWeapon(LASER);
        expect(unit.getHandheldIssues()).toEqual([]);
    });
});

describe("saving and loading", () => {
    it("keeps the design and the play state", () => {
        const unit = mech();
        unit.setHandheldWeapon({ entries: [{ tag: "medium-laser" }], armor: 16 });
        unit.dropHandheld();
        const loaded = new BattleMech(unit.exportJSON());
        expect(loaded.getHandheldWeapon()).toEqual({ entries: [{ tag: "medium-laser" }], armor: 16 });
        expect(loaded.getHandheldPlay().state).toBe("dropped");
        expect(loaded.getBattleValue()).toBe(unit.getBattleValue());
    });
});

describe("in play (Total Warfare era: TO:AUE p.128)", () => {
    const carrier = () => {
        const unit = mech();
        unit.setHandheldWeapon({ entries: [{ tag: "medium-laser" }], armor: 8 });
        return unit;
    };

    it("starts carried and drops in the End Phase in the 'Mech's hex", () => {
        const unit = carrier();
        expect(unit.getHandheldPlay().state).toBe("carried");
        expect(unit.dropHandheld()).toMatch(/dropped/i);
        expect(unit.getHandheldPlay().state).toBe("dropped");
    });

    it("cannot be picked up in the End Phase it was dropped in, only a later one, and is used from the next turn", () => {
        const unit = carrier();
        unit.dropHandheld();
        expect(unit.canPickUpHandheld()).toBe(false);
        unit.turnReset();
        expect(unit.canPickUpHandheld()).toBe(true);
        expect(unit.pickUpHandheld()).toMatch(/picked up/i);
        expect(unit.isHandheldUsable()).toBe(false);
        unit.turnReset();
        expect(unit.isHandheldUsable()).toBe(true);
    });

    it("can be shot at on the ground: +1 to hit and the immobile -4", () => {
        const unit = carrier();
        unit.dropHandheld();
        expect(unit.getHandheldPlay().droppedTargetModifier).toBe(-3);
    });

    it("takes an arm hit on a 6 only, and is destroyed by damage past its armor with the excess going to the arm", () => {
        const unit = carrier();
        expect(unit.armHitStrikesHandheld(5)).toBe(false);
        expect(unit.armHitStrikesHandheld(6)).toBe(true);
        expect(unit.strikeHandheld(5)).toEqual({ destroyed: false, excess: 0 });
        expect(unit.getHandheldPlay().armorLeft).toBe(3);
        expect(unit.strikeHandheld(5)).toEqual({ destroyed: true, excess: 2 });
        expect(unit.getHandheldPlay().state).toBe("destroyed");
        expect(unit.isHandheldUsable()).toBe(false);
    });

    it("is dropped by a hit on either hand actuator", () => {
        const unit = carrier();
        expect(unit.handheldMustDrop()).toBe(false);
        unit.getCriticals().rightArm.find((slot) => slot.tag === "hand-actuator")!.damaged = true;
        expect(unit.handheldMustDrop()).toBe(true);
    });

    it("needs a Piloting Skill Roll to keep hold in a fall, with the arm actuator modifiers", () => {
        const unit = carrier();
        expect(unit.getHandheldHoldRollModifier()).toBe(0);
        unit.getCriticals().leftArm.find((slot) => slot.tag === "lower-arm-actuator")!.damaged = true;
        expect(unit.getHandheldHoldRollModifier()).toBe(1);
    });

    it("takes the weapon while a 'Mech with a carried handheld cannot punch, which the sheet note says", () => {
        expect(carrier().getHandheldNote()).toMatch(/no punching|cannot punch|makes no punching/i);
    });
});

describe("in play (Master Rules: Maximum Tech p.79)", () => {
    const carrier = () => {
        const unit = mech(MASTER);
        unit.setHandheldWeapon({ entries: [{ tag: "medium-laser" }], armor: 0 });
        return unit;
    };

    it("takes an arm hit on a 1 or a 6, and an unarmored weapon is destroyed by the first hit with the 'Mech unhurt", () => {
        const unit = carrier();
        expect(unit.armHitStrikesHandheld(1)).toBe(true);
        expect(unit.armHitStrikesHandheld(6)).toBe(true);
        expect(unit.armHitStrikesHandheld(3)).toBe(false);
        expect(unit.strikeHandheld(1)).toEqual({ destroyed: true, excess: 0 });
    });

    it("stops working when dropped and cannot be shot at", () => {
        const unit = carrier();
        unit.dropHandheld();
        expect(unit.isHandheldUsable()).toBe(false);
        expect(unit.getHandheldPlay().droppedTargetModifier).toBeUndefined();
    });

    it("drops only when no working hand actuator is left", () => {
        const unit = carrier();
        unit.getCriticals().rightArm.find((slot) => slot.tag === "hand-actuator")!.damaged = true;
        expect(unit.handheldMustDrop()).toBe(false);
        unit.getCriticals().leftArm.find((slot) => slot.tag === "hand-actuator")!.damaged = true;
        expect(unit.handheldMustDrop()).toBe(true);
    });
});

describe("the arm-hit roll in the damage dialog (Maximum Tech p.79; TO:AUE p.128)", () => {
    // The test 'Mech carries no armor, so damage reaches the structure: count both.
    const health = (unit: BattleMech) => unit.getCurrentArmor() + unit.getCurrentStructure();
    const withWeapon = (edition: string, armor: number) => {
        const unit = mech(edition);
        unit.setHandheldWeapon({ entries: [{ tag: "medium-laser" }], armor });
        return unit;
    };

    it("asks for the roll on an arm hit, and in the front center torso only under Maximum Tech", () => {
        const tw = withWeapon("total-warfare", 8);
        expect(tw.handheldRollApplies("ra")).toBe(true);
        expect(tw.handheldRollApplies("ct")).toBe(false);
        const mt = withWeapon(MASTER, 0);
        expect(mt.handheldRollApplies("la")).toBe(true);
        expect(mt.handheldRollApplies("ct")).toBe(true);
        expect(mt.handheldRollApplies("ct", true)).toBe(false);
        expect(mt.handheldRollApplies("rl")).toBe(false);
    });

    it("TO:AUE: a 6 sends the damage to the weapon, and only what passes its armor reaches the arm", () => {
        const unit = withWeapon("total-warfare", 8);
        const before = health(unit);
        const hit = unit.takeDamage(5, "ra", false, { handheldRoll: 6 });
        expect(hit[0].criticalEffects[0]).toMatch(/handheld weapon is hit/i);
        expect(unit.getHandheldPlay().armorLeft).toBe(3);
        expect(health(unit)).toBe(before);
        unit.takeDamage(5, "ra", false, { handheldRoll: 6 });
        expect(unit.getHandheldPlay().state).toBe("destroyed");
        expect(health(unit)).toBe(before - 2);
    });

    it("a roll that misses the weapon, or no roll, leaves the arm to take it", () => {
        const unit = withWeapon("total-warfare", 8);
        const before = health(unit);
        unit.takeDamage(3, "ra", false, { handheldRoll: 5 });
        expect(unit.getHandheldPlay().armorLeft).toBe(8);
        expect(health(unit)).toBe(before - 3);
        unit.takeDamage(3, "ra", false);
        expect(unit.getHandheldPlay().armorLeft).toBe(8);
        expect(health(unit)).toBe(before - 6);
    });

    it("Maximum Tech: a 1 destroys an unarmored weapon and the 'Mech takes nothing", () => {
        const unit = withWeapon(MASTER, 0);
        const before = health(unit);
        const hit = unit.takeDamage(4, "ra", false, { handheldRoll: 1 });
        expect(hit[0].criticalEffects[0]).toMatch(/takes no damage/);
        expect(unit.getHandheldPlay().state).toBe("destroyed");
        expect(health(unit)).toBe(before);
    });
});

describe("a Triple-Strength Myomer 'Mech and a heavy handheld weapon (TO:AUE p.128)", () => {
    const twoLasers = { entries: [{ tag: "medium-laser", count: 2 }], armor: 0 };
    const withTsm = (edition: string, design: typeof twoLasers | typeof LASER) => {
        const unit = mech(edition, 50);
        unit.setMyomerType("tsm");
        unit.setHandheldWeapon(design);
        return unit;
    };

    it("must be dropped once heat is below 9 and the weapon weighs over 10 percent of the tonnage", () => {
        const unit = withTsm("total-warfare", twoLasers);
        expect(unit.getHandheldAnalysis()!.weight).toBe(8);
        unit.currentHeat = 12;
        expect(unit.handheldMustDrop()).toBe(false);
        unit.currentHeat = 8;
        expect(unit.handheldTsmForcesDrop()).toBe(true);
        expect(unit.handheldMustDrop()).toBe(true);
    });

    it("is not forced for a light weapon, a 'Mech without TSM, or under Maximum Tech", () => {
        expect(withTsm("total-warfare", LASER).handheldMustDrop()).toBe(false);
        const plain = mech("total-warfare", 50);
        plain.setHandheldWeapon(twoLasers);
        expect(plain.handheldMustDrop()).toBe(false);
        expect(withTsm(MASTER, twoLasers).handheldMustDrop()).toBe(false);
    });
});
