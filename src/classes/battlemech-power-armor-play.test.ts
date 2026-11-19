import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech, ITargetToHit } from "./battlemech";
import { FW_POWER_ARMOR_RULESET } from "../data/future-wars-power-armor";
import { buildMech } from "../test-support/builders";
import { getTargetToHitFromWeapon } from "../utils";

/**
 * Power Armor plan, Chunk C (#172): Bill Swisher's play rules for Power Armor in roster play (The Best of Future Wars,
 * Volume One, pp.14-15).
 */
const PA = FW_POWER_ARMOR_RULESET;

const build = (tonnage: number, rulesets: string[] = [PA], walk: number = 6): BattleMech =>
    buildMech({ type: "biped", tonnage, walk, homebrew: rulesets });

const addItem = (mech: BattleMech, tag: string) =>
    mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined)!;

/** Place a new item in the first free slot of a location. */
const placeIn = (mech: BattleMech, tag: string, location: string, key: string) => {
    const item = addItem(mech, tag);
    const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid);
    const slot = mech.getCriticals()[key].findIndex(critical => !critical);
    expect(mech.moveCritical("un", from, location, slot)).toBe(true);
    return { item, slot };
};

const structureLost = (mech: BattleMech, location: string) =>
    Array.from({ length: 20 }, (_, index) => mech.structureDamaged(location, index)).filter(Boolean).length;

const target = (extra: Partial<ITargetToHit> = {}): ITargetToHit => ({
    name: "", active: true, range: 1, movement: 0, otherMods: 0, jumped: false, primary: true, inRearArc: false, ...extra,
});

afterEach(() => { vi.restoreAllMocks(); });

describe("Attacking a Power Armor suit (Best-of p.14)", () => {
    it("is +1 to hit when the target is a suit", () => {
        const mech = build(50, []);
        addItem(mech, "medium-laser");
        const index = mech.equipmentList.findIndex(item => item.tag === "medium-laser");
        mech.equipmentList[index].target = "a";
        const plain = getTargetToHitFromWeapon(mech, index, target());
        const suit = getTargetToHitFromWeapon(mech, index, target({ powerArmor: true }));
        expect(suit.finalToHit).toBe(plain.finalToHit + 1);
        expect(suit.otherModifiersExplanation).toContain("Power Armor Target (+1)");
    });
});

describe("The suit's pilot (Best-of pp.15-16)", () => {
    it("a 5-ton suit's pilot of Piloting 4 is +2 on every Piloting Skill Roll; Piloting 3 or a 10-ton suit is not", () => {
        const five = build(5);
        five.setPilotPiloting(4);
        expect(five.getPilotingSkillModifier()).toBe(2);
        five.setPilotPiloting(3);
        expect(five.getPilotingSkillModifier()).toBe(0);
        const ten = build(10);
        ten.setPilotPiloting(4);
        expect(ten.getPilotingSkillModifier()).toBe(0);
    });

    it("the suit's own Piloting modifier is one method, read by the roster panel and the Piloting Skill Roll", () => {
        const five = build(5);
        five.setPilotPiloting(4);
        expect(five.getPowerArmorPilotingModifier()).toBe(2);
        five.setPilotPiloting(3);
        expect(five.getPowerArmorPilotingModifier()).toBe(0);
        const mech = build(50, []);
        mech.setPilotPiloting(4);
        expect(mech.getPowerArmorPilotingModifier()).toBe(0);
    });

    it("a critical hit on the pilot in the head kills the pilot", () => {
        const mech = build(10);
        // Head lines 3-4 are the pilot.
        const log = mech.rollCriticalHit("hd", { chance: 8, lines: [3] });
        expect(log).toContain("Line 3: Pilot is hit.");
        expect(log).toContain("The pilot is killed (Power Armor, The Best of Future Wars p.15).");
    });

    it("a critical hit on the pilot in the center torso is 1D6 hits", () => {
        vi.spyOn(Math, "random").mockReturnValue(0.5); // 1D6 = 4
        const mech = build(10);
        // Center torso lines 11-12: the second table (4-6), lines 5-6.
        const log = mech.rollCriticalHit("ct", { chance: 8, lines: [4, 5] });
        expect(log).toContain("Line 4-6, 5: Pilot is hit.");
        expect(log).toContain("The pilot takes 1D6 = 4 hits: mark them on the Hits track (Power Armor, The Best of Future Wars p.15).");
    });

    it("an ammunition explosion is 1 hit to the pilot, not 2, while it stays out of the center torso", () => {
        const mech = build(10);
        addItem(mech, "machine-gun");
        const { item, slot } = placeIn(mech, "ammo-machine-gun-standard", "lt", "leftTorso");
        item.currentAmmo = 1; // 2 damage: the left torso's 3 structure holds it.
        const log = mech.rollCriticalHit("lt", { chance: 8, lines: [slot + 1] });
        expect(structureLost(mech, "ct")).toBe(0);
        expect(log).not.toContain("The MechWarrior takes 2 damage (TW p.125, TO:AUE p.111)");
        expect(log.at(-1)).toBe("The pilot takes 1 hit (Power Armor, The Best of Future Wars p.15).");
    });

    it("an ammunition explosion that reaches the center torso kills the pilot", () => {
        const mech = build(10);
        addItem(mech, "machine-gun");
        const { item, slot } = placeIn(mech, "ammo-machine-gun-standard", "lt", "leftTorso");
        item.currentAmmo = 3; // 6 damage: 3 through the left torso, 3 into the center torso.
        const log = mech.rollCriticalHit("lt", { chance: 8, lines: [slot + 1] });
        expect(structureLost(mech, "ct")).toBeGreaterThan(0);
        expect(log.at(-1)).toBe("The explosion reaches the center torso: the pilot is killed (Power Armor, The Best of Future Wars p.15).");
    });

    it("without the ruleset a 'Mech's pilot crits and explosions read as before", () => {
        const mech = build(50, []);
        const log = mech.rollCriticalHit("hd", { chance: 8, lines: [3] });
        expect(log.join(" ")).not.toMatch(/Power Armor/);
        expect(mech.getPilotingSkillModifier()).toBe(0);
    });
});

describe("Leaving the suit (Best-of p.15, rule 12)", () => {
    it("unlatching takes a full turn with no firing; the pilot is out of the suit after the End Phase", () => {
        const mech = build(10);
        expect(mech.getPowerArmorExit()).toBeUndefined();
        mech.startPowerArmorExit();
        expect(mech.getPowerArmorExit()).toBe("unlatching");
        expect(mech.getFutureWarsRulesetNoFire(undefined)).toMatch(/unlatching the front plate/);
        mech.turnReset();
        expect(mech.getPowerArmorExit()).toBe("out");
        expect(mech.getFutureWarsRulesetNoFire(undefined)).toMatch(/left the suit/);
    });

    it("can be called off before the End Phase", () => {
        const mech = build(10);
        mech.startPowerArmorExit();
        mech.cancelPowerArmorExit();
        expect(mech.getPowerArmorExit()).toBeUndefined();
        expect(mech.getFutureWarsRulesetNoFire(undefined)).toBeUndefined();
    });

    it("is offered only to a suit", () => {
        const mech = build(50, []);
        mech.startPowerArmorExit();
        expect(mech.getPowerArmorExit()).toBeUndefined();
    });
});
