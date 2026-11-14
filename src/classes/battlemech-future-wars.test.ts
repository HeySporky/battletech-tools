import { afterEach, describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { btSpecialRulesets, findSpecialRuleset, getRulesetConflict, ISpecialRuleset } from "../data/special-rulesets";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import {
    FUTURE_WARS_CONSTRUCTION_RULESETS, FUTURE_WARS_WEIGHT_CLASSES, getFutureWarsCockpit, getFutureWarsEngineSlots,
    getFutureWarsGyroSlots, getFutureWarsSlots,
} from "../data/future-wars-construction";

/**
 * Compact 'Mechs plan, Chunk B (#172): Clell Flint's "Alternate Rules for Building Mechs in BattleTech" (The Best of
 * Future Wars, Volume One, printed pp.35-36; Future Wars #11 p.24) as a Special Ruleset.
 */
const BEST_OF = "best-of-future-wars-construction";
const ISSUE_11 = "future-wars-11-construction";

const build = (tonnage: number, walk: number = 4, rulesets: string[] = [BEST_OF], type: string = "biped"): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setMechType(type);
    mech.setTonnage(tonnage);
    mech.setWalkSpeed(walk);
    mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, rulesets });
    return mech;
};

type Slots = Record<string, ({ tag: string; name: string; placeholder?: boolean; uuid: string } | null)[]>;
const criticals = (mech: BattleMech) => mech.getCriticals() as unknown as Slots;
/** Every slot of a location by tag, placeholders under the tag of the item they continue. */
const slotTags = (mech: BattleMech, location: string): (string | null)[] => {
    const slots = criticals(mech)[location];
    let last: string | null = null;
    return slots.map(slot => {
        if (!slot) return (last = null);
        if (slot.placeholder) return last;
        return (last = slot.tag);
    });
};
const count = (mech: BattleMech, location: string, tag: string) => slotTags(mech, location).filter(t => t === tag).length;
const weight = (mech: BattleMech, name: string) => mech.getWeightBreakdown().find(row => row.name === name)?.weight;

describe("Future Wars construction tables (Best-of pp.35-36)", () => {
    it("has four weight classes ending at 35, 55, 75 and 100 tons", () => {
        expect(FUTURE_WARS_WEIGHT_CLASSES.map(c => [c.tag, c.maxTons])).toEqual([["light", 35], ["medium", 55], ["heavy", 75], ["assault", 100]]);
    });
    it("head slots: light 5, medium 6, heavy 7, assault 8", () => {
        expect([35, 40, 75, 80].map(t => getFutureWarsSlots(t, "hd"))).toEqual([5, 6, 7, 8]);
    });
    it("each arm: light 6, medium 8, heavy 10, assault 12", () => {
        expect([20, 55, 60, 100].map(t => getFutureWarsSlots(t, "la"))).toEqual([6, 8, 10, 12]);
    });
    it("each leg: light 7, medium 10, heavy 12, assault 16", () => {
        expect([35, 40, 60, 80].map(t => getFutureWarsSlots(t, "rl"))).toEqual([7, 10, 12, 16]);
    });
    it("right and left torso: light 7, medium 10, heavy 12, assault 16", () => {
        expect([35, 40, 60, 80].map(t => getFutureWarsSlots(t, "lt"))).toEqual([7, 10, 12, 16]);
        expect(getFutureWarsSlots(80, "rightTorso")).toBe(16);
    });
    it("center torso: light 11, medium 14, heavy 18, assault 20", () => {
        expect([35, 40, 60, 80].map(t => getFutureWarsSlots(t, "ct"))).toEqual([11, 14, 18, 20]);
    });
    it("head structure: light 3, medium 4, heavy 5, assault 6", () => {
        expect(FUTURE_WARS_WEIGHT_CLASSES.map(c => c.headStructure)).toEqual([3, 4, 5, 6]);
    });
    it("has no class over 100 tons and no row for a location a biped lacks", () => {
        expect(getFutureWarsSlots(105, "hd")).toBeUndefined();
        expect(getFutureWarsSlots(50, "fll")).toBeUndefined();
    });
    it("engine slots by engine weight, at each band's edges", () => {
        expect([0.5, 4, 4.5, 6, 6.5, 9, 9.5, 12, 12.5, 16, 16.5, 30, 30.5, 52.5].map(getFutureWarsEngineSlots))
            .toEqual([4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10]);
        expect(getFutureWarsEngineSlots(0)).toBe(0);
    });
    it("gyro: one slot a ton", () => {
        expect([1, 2, 3, 4, 1.5].map(getFutureWarsGyroSlots)).toEqual([1, 2, 3, 4, 2]);
    });
    it("cockpit: light 2 t / 1, medium 3 t / 1, heavy 3 t / 1 or 4 t / 2, assault 4 t / 2, with life support to match", () => {
        const row = (tons: number, large = false) => {
            const c = getFutureWarsCockpit(tons, large)!;
            return [c.tons, c.slots, c.lifeSupportSlots];
        };
        expect(row(35)).toEqual([2, 1, 1]);
        expect(row(55)).toEqual([3, 1, 1]);
        expect(row(55, true)).toEqual([3, 1, 1]);
        expect(row(70)).toEqual([3, 1, 1]);
        expect(row(70, true)).toEqual([4, 2, 2]);
        expect(row(100)).toEqual([4, 2, 2]);
    });
});

describe("The two Future Wars rulesets (owner ruling 3)", () => {
    it("lists the Best-of printing first, both at Custom Homebrew, both changing 'Mech construction", () => {
        expect([...FUTURE_WARS_CONSTRUCTION_RULESETS]).toEqual([BEST_OF, ISSUE_11]);
        const ids = btSpecialRulesets.map(r => r.id);
        expect(ids.indexOf(BEST_OF)).toBeLessThan(ids.indexOf(ISSUE_11));
        for (const id of FUTURE_WARS_CONSTRUCTION_RULESETS) {
            const ruleset = findSpecialRuleset(id)!;
            expect(ruleset.minRulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
            expect(ruleset.changes).toEqual(["mechConstruction"]);
            expect(ruleset.removesUnitTypes).toBeUndefined();
        }
        expect(findSpecialRuleset(BEST_OF)!.source.title).toBe("Clell Flint, 'Alternate Rules for Building Mechs in BattleTech', The Best of Future Wars, Volume One (1991), pp.35-36");
        expect(findSpecialRuleset(ISSUE_11)!.source.title).toBe("Clell Flint, 'Alternative Rules for Building Mechs in BattleTech', Future Wars #11, p.24");
    });
    it("cannot both be ticked (the conflict rule)", () => {
        expect(getRulesetConflict([BEST_OF], ISSUE_11)?.id).toBe(BEST_OF);
        expect(getRulesetConflict([ISSUE_11], BEST_OF)?.id).toBe(ISSUE_11);
    });
    it("build the same 'Mech under either printing", () => {
        expect(build(35, 4, [ISSUE_11]).usesFutureWarsConstruction()).toBe(true);
        expect(build(35, 4, [ISSUE_11]).getLocationSlotCount("ct")).toBe(11);
    });
});

describe("BattleMech under Clell Flint's construction rules", () => {
    it("is not in use without the ruleset", () => {
        const mech = build(35, 4, []);
        expect(mech.usesFutureWarsConstruction()).toBe(false);
        expect(mech.getLocationSlotCount("hd")).toBe(6);
        expect(mech.getInternalStructure().head).toBe(3);
        expect(mech.getMaxLocationArmor("head")).toBe(9);
    });

    it("sizes every location by class, either side of the 35 / 40 ton line", () => {
        const tags = ["hd", "la", "ra", "ll", "rl", "lt", "rt", "ct", "cl", "fll", "frl"];
        const light = build(35);
        expect(tags.map(t => light.getLocationSlotCount(t))).toEqual([5, 6, 6, 7, 7, 7, 7, 11, 0, 0, 0]);
        const medium = build(40);
        expect(tags.map(t => medium.getLocationSlotCount(t))).toEqual([6, 8, 8, 10, 10, 10, 10, 14, 0, 0, 0]);
        const names = ["head", "leftArm", "rightArm", "leftLeg", "rightLeg", "leftTorso", "rightTorso", "centerTorso"];
        expect(names.map(n => criticals(medium)[n].length)).toEqual([6, 8, 8, 10, 10, 10, 10, 14]);
    });

    it("re-sizes the locations when the tonnage crosses a class line", () => {
        const mech = build(35);
        mech.setTonnage(40);
        expect(criticals(mech).centerTorso.length).toBe(14);
        mech.setTonnage(80);
        expect(criticals(mech).centerTorso.length).toBe(20);
    });

    it("gives the head 3/4/5/6 structure and caps its armor at twice that", () => {
        for (const [tons, structure] of [[35, 3], [40, 4], [60, 5], [100, 6]]) {
            const mech = build(tons);
            expect(mech.getInternalStructure().head, `${tons} t`).toBe(structure);
            expect(mech.getMaxLocationArmor("head"), `${tons} t`).toBe(structure * 2);
        }
    });

    it("reports head armor over twice the head structure after a class change", () => {
        const mech = build(40);
        mech.setHeadArmor(8);
        expect(mech.getChassisEquipmentViolations().filter(v => /head armor/i.test(v))).toEqual([]);
        mech.setTonnage(35);
        expect(mech.getChassisEquipmentViolations()).toContain("Head armor 8 is more than twice the head's 3 internal structure points (Clell Flint's construction rules, Best-of p.35): at most 6.");
    });

    it("caps the head at twice its structure when armor is maximized", () => {
        const mech = build(80);
        mech.allocateArmorMax();
        expect(mech.getArmorAllocation().head).toBe(12);
    });

    it("weighs and places the cockpit by class: light 2 t and one slot", () => {
        const mech = build(35);
        expect(mech.getCockpitWeight()).toBe(2);
        expect(slotTags(mech, "head")).toEqual(["life-support", "sensors", "sensors", "cockpit", null]);
    });

    it("medium and most heavy cockpits: 3 t and one slot", () => {
        expect(build(50).getCockpitWeight()).toBe(3);
        const heavy = build(70);
        expect(heavy.getCockpitWeight()).toBe(3);
        expect(slotTags(heavy, "head")).toEqual(["life-support", "sensors", "sensors", "cockpit", null, null, null]);
    });

    it("a few heavies and every assault: 4 t, two slots and two life support", () => {
        const heavy = build(70);
        heavy.setFutureWarsLargeCockpit(true);
        expect(heavy.getFutureWarsLargeCockpit()).toBe(true);
        expect(heavy.getCockpitWeight()).toBe(4);
        expect(slotTags(heavy, "head")).toEqual(["life-support", "life-support", "sensors", "sensors", "cockpit", "cockpit", null]);
        const assault = build(100);
        expect(assault.getCockpitWeight()).toBe(4);
        expect(count(assault, "head", "cockpit")).toBe(2);
        expect(count(assault, "head", "life-support")).toBe(2);
    });

    it("offers the large cockpit only to a heavy 'Mech", () => {
        const medium = build(50);
        medium.setFutureWarsLargeCockpit(true);
        expect(medium.getFutureWarsLargeCockpit()).toBe(false);
        expect(medium.getCockpitWeight()).toBe(3);
    });

    it("puts two sensor slots in every head", () => {
        for (const tons of [20, 50, 70, 90]) expect(count(build(tons), "head", "sensors"), `${tons} t`).toBe(2);
    });

    it("extra sensors and extra life support: +0.5 t and +1 slot each", () => {
        const mech = build(50);
        const before = mech.getCurrentTonnage();
        mech.setExtraSensors(true);
        mech.setExtraLifeSupport(true);
        expect(mech.getExtraSensors()).toBe(true);
        expect(mech.getExtraLifeSupport()).toBe(true);
        expect(weight(mech, "Extra Sensors")).toBe(0.5);
        expect(weight(mech, "Extra Life Support")).toBe(0.5);
        expect(mech.getCurrentTonnage()).toBe(before + 1);
        expect(count(mech, "head", "sensors")).toBe(3);
        expect(count(mech, "head", "life-support")).toBe(2);
    });

    it("has no extras without the ruleset", () => {
        const mech = build(50, 4, []);
        mech.setExtraSensors(true);
        expect(weight(mech, "Extra Sensors")).toBeUndefined();
        expect(count(mech, "head", "sensors")).toBe(2);
    });

    it("takes engine center torso slots by engine weight and gyro slots by gyro weight", () => {
        // 35 t, walk 4: a 140 standard fusion engine, 5 t, and a 2-ton gyro.
        const mech = build(35);
        expect(mech.getEngineWeight()).toBe(5);
        expect(mech.getGyroWeight()).toBe(2);
        expect(count(mech, "centerTorso", "engine")).toBe(5);
        expect(count(mech, "centerTorso", "gyro")).toBe(2);
        // Half the engine, the gyro, then the rest of the engine.
        expect(slotTags(mech, "centerTorso").slice(0, 7)).toEqual(["engine", "engine", "engine", "gyro", "gyro", "engine", "engine"]);
    });

    it("gives a 3-ton gyro three slots", () => {
        // 60 t, walk 5: a 300 engine, 19 t (9 slots), and a 3-ton gyro.
        const mech = build(60, 5);
        expect(mech.getGyroWeight()).toBe(3);
        expect(count(mech, "centerTorso", "gyro")).toBe(3);
        expect(count(mech, "centerTorso", "engine")).toBe(9);
    });

    it("keeps an XL engine's side torso slots", () => {
        const mech = build(60, 5);
        mech.setEngineType("xl");
        expect(count(mech, "leftTorso", "engine")).toBe(3);
        expect(count(mech, "rightTorso", "engine")).toBe(3);
        expect(count(mech, "centerTorso", "engine")).toBe(getFutureWarsEngineSlots(mech.getEngineWeight() ?? 0));
    });

    it("refuses an item larger than its location at the class, with a message", () => {
        const mech = build(35);
        mech.addEquipmentFromTag("standard-gauss-rifle", "is", "", false, undefined, "", false, [], undefined, undefined);
        const index = mech.getUnallocatedCriticals().findIndex(slot => slot?.tag === "standard-gauss-rifle");
        expect(index).toBeGreaterThanOrEqual(0);
        expect(mech.moveCritical("un", index, "ra", 0)).toBe(false);
        expect(mech.getSlotFitMessage("ra", 7)).toBe("A 7-slot item cannot fit the right arm: it has 6 critical slots on a light 'Mech under Clell Flint's construction rules.");
        expect(mech.getSlotFitMessage("ra", 6)).toBeUndefined();
        expect(mech.moveCritical("un", index, "rt", 0)).toBe(true);
    });

    it("does not offer the small, torso-mounted or interface cockpit", () => {
        const mech = build(50);
        expect(mech.getAvailableCockpits(CUSTOM_HOMEBREW_RULES_LEVEL).map(c => c.tag)).toEqual(["standard"]);
        mech.setCockpitType("small");
        expect(mech.getCockpitType().tag).toBe("standard");
        expect(mech.getCockpitWeight()).toBe(3);
    });

    it("builds a small cockpit chosen before the ruleset as Flint's cockpit", () => {
        const mech = build(50, 4, []);
        mech.setCockpitType("small");
        mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesets: [BEST_OF] });
        expect(mech.getCockpitType().tag).toBe("standard");
        expect(mech.getCockpitWeight()).toBe(3);
        expect(slotTags(mech, "head").slice(0, 4)).toEqual(["life-support", "sensors", "sensors", "cockpit"]);
    });

    it("refuses a quad, with a message, and builds it by the standard rules", () => {
        const mech = build(50, 4, [BEST_OF], "quad");
        expect(mech.usesFutureWarsConstruction()).toBe(false);
        expect(mech.getLocationSlotCount("ct")).toBe(12);
        expect(mech.getChassisEquipmentViolations()).toContain("Clell Flint's construction rules (Special Ruleset) are for two-legged 'Mechs of up to 100 tons; this Quad is built by the standard rules. His four-legged rules are Walkers, a unit type of their own.");
    });

    it("lists what no longer fits when ticked on an existing 'Mech, and deletes nothing", () => {
        const mech = build(50, 4, []);
        mech.addEquipmentFromTag("standard-gauss-rifle", "is", "", false, undefined, "", false, [], undefined, undefined);
        const index = mech.getUnallocatedCriticals().findIndex(slot => slot?.tag === "standard-gauss-rifle");
        expect(mech.moveCritical("un", index, "ra", 4)).toBe(true);
        expect(count(mech, "rightArm", "standard-gauss-rifle")).toBe(7);

        mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesets: [BEST_OF] });
        expect(criticals(mech).rightArm.length).toBe(8);
        expect(count(mech, "rightArm", "standard-gauss-rifle")).toBe(0);
        expect(mech.getInstalledEquipment().filter(item => item.tag === "standard-gauss-rifle")).toHaveLength(1);
        expect(mech.getUnallocatedCriticals().some(slot => slot?.tag === "standard-gauss-rifle")).toBe(true);
        expect(mech.getChassisEquipmentViolations()).toContain("Gauss Rifle no longer fits the right arm (8 critical slots on a medium 'Mech under Clell Flint's construction rules): it is unallocated.");

        // Unticked, it goes back where it was.
        mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesets: [] });
        expect(count(mech, "rightArm", "standard-gauss-rifle")).toBe(7);
    });

    it("notes the ruleset on the Battle Value and cost breakdowns", () => {
        const mech = build(50);
        const note = "Built under Clell Flint's alternate construction rules (Future Wars); Battle Value and cost by Total Warfare on the design as built.";
        expect(mech.getBattleValueBreakdown().notes).toContain(note);
        expect(mech.getCostBreakdown().notes).toContain(note);
        expect(build(50, 4, []).getBattleValueBreakdown().notes).toBeUndefined();
    });

    it("round-trips the new choices through exportJSON and importJSON", () => {
        const mech = build(70);
        mech.setFutureWarsLargeCockpit(true);
        mech.setExtraSensors(true);
        mech.setExtraLifeSupport(true);
        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect(copy.getRulesets()).toEqual([BEST_OF]);
        expect(copy.getFutureWarsLargeCockpit()).toBe(true);
        expect(copy.getExtraSensors()).toBe(true);
        expect(copy.getExtraLifeSupport()).toBe(true);
        expect(copy.getCockpitWeight()).toBe(4);
        expect(criticals(copy).head.length).toBe(7);
        // Saved only when set.
        const plain = JSON.parse(build(70, 4, []).exportJSON());
        expect(plain.futureWarsLargeCockpit).toBeUndefined();
        expect(plain.extraSensors).toBeUndefined();
        expect(plain.extraLifeSupport).toBeUndefined();
    });

    describe("a save naming a ruleset the registry no longer lists", () => {
        let removed: ISpecialRuleset | undefined;
        afterEach(() => {
            if (removed) btSpecialRulesets.unshift(removed);
            removed = undefined;
        });

        it("loads with a message, keeps the ruleset, and reports what no longer fits rather than cutting it", () => {
            const mech = build(80);
            mech.addEquipmentFromTag("standard-gauss-rifle", "is", "", false, undefined, "", false, [], undefined, undefined);
            const index = mech.getUnallocatedCriticals().findIndex(slot => slot?.tag === "standard-gauss-rifle");
            expect(mech.moveCritical("un", index, "ll", 4)).toBe(true);
            const saved = mech.exportJSON();

            removed = btSpecialRulesets.splice(btSpecialRulesets.findIndex(r => r.id === BEST_OF), 1)[0];
            const copy = new BattleMech();
            copy.importJSON(saved);
            expect(copy.getRulesets()).toEqual([BEST_OF]);
            expect(copy.usesFutureWarsConstruction()).toBe(false);
            expect(copy.getChassisEquipmentViolations()).toContain(`Built under the Special Ruleset "${BEST_OF}", which this version of the app does not list: checked by the standard rules.`);
            expect(copy.getInstalledEquipment().filter(item => item.tag === "standard-gauss-rifle")).toHaveLength(1);
            expect(copy.getUnallocatedCriticals().some(slot => slot?.tag === "standard-gauss-rifle")).toBe(true);
            expect(copy.getChassisEquipmentViolations()).toContain("Gauss Rifle no longer fits the left leg (6 critical slots): it is unallocated.");
        });
    });
});
