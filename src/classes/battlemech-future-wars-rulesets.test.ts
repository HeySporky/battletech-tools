import { describe, expect, it } from "vitest";
import { BattleMech, ITargetToHit } from "./battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { getTargetToHitFromWeapon } from "../utils";

/**
 * Best of Future Wars plan, Chunk E (#172): the five play-rule rulesets on a 'Mech in roster play. The numbers are in
 * `src/utils/future-wars-ruleset-tools.ts`; these tests pin what the 'Mech does with them: heat, to-hit, the morale
 * status over turns, malfunctions recorded on the weapon, and the play state kept in the save.
 */
const build = (rulesets: string[]): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setTonnage(65);
    mech.setWalkSpeed(4);
    mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, rulesets });
    return mech;
};
const mount = (mech: BattleMech, tag: string) => {
    mech.addEquipmentFromTag(tag, "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
    const index = mech.equipmentList.length - 1;
    mech.equipmentList[index].target = "a";
    return index;
};
const target = (mech: BattleMech, range: number, movement = 0): ITargetToHit =>
    ({ ...mech.getTarget("a"), active: true, range, movement, otherMods: 0, primary: true } as ITargetToHit);
const toHit = (mech: BattleMech, index: number, range: number, movement = 0) => getTargetToHitFromWeapon(mech, index, target(mech, range, movement));

describe("Best of Future Wars rulesets in play", () => {
    it("Strategic Movement's heat takes the place of the movement heat for the turn, and ends with it", () => {
        const mech = build(["fw-strategic-movement"]);
        expect(mech.getStrategicMovementMP()).toEqual({ walk: 8, run: 12 });
        mech.setStrategicMovement("r", 12);
        expect(mech.getActiveMoveHeat()).toBe(2 + 2 * 6);
        mech.setStrategicMovement("w", 6);
        expect(mech.getActiveMoveHeat()).toBe(2 + 2);
        mech.turnReset();
        expect(mech.futureWarsPlay.strategicMovement).toBeUndefined();
    });

    it("a 'Mech on Strategic Movement may not fire", () => {
        const mech = build(["fw-strategic-movement"]);
        const laser = mount(mech, "medium-laser");
        mech.setStrategicMovement("w", 6);
        const gator = toHit(mech, laser, 2);
        expect(gator.finalToHit).toBe(-1);
        expect(gator.explanation).toMatch(/Strategic Movement/);
    });

    it("after an opportunity shot the 'Mech's other weapons are +1 this turn, not the one that fired", () => {
        const mech = build(["fw-opportunity-fire"]);
        const first = mount(mech, "medium-laser");
        const second = mount(mech, "medium-laser");
        const before = toHit(mech, second, 2).finalToHit;
        mech.recordOpportunityShot(mech.equipmentList[first].uuid!);
        expect(toHit(mech, second, 2).finalToHit).toBe(before + 1);
        expect(toHit(mech, second, 2).otherModifiersExplanation).toMatch(/Opportunity Fire/);
        expect(toHit(mech, first, 2).finalToHit).toBe(-1);
        mech.turnReset();
        expect(toHit(mech, second, 2).finalToHit).toBe(before);
    });

    it("a failed morale check puts a status on the 'Mech: its fire modifier applies, and it counts down after the turn", () => {
        const mech = build(["fw-morale"]);
        const laser = mount(mech, "medium-laser");
        const before = toHit(mech, laser, 2).finalToHit;
        expect(mech.getMoraleClassIndex()).toBe(2); // Regular
        expect(mech.rollMorale(6, 2, 0)).toEqual({ passed: true });
        const check = mech.rollMorale(5, 4, 0);
        expect(check.passed).toBe(false);
        expect(check.total).toBe(4);
        expect(mech.futureWarsPlay.morale?.status).toMatchObject({ kind: "disorganized", turnsLeft: 2 });
        expect(toHit(mech, laser, 2).finalToHit).toBe(before + 5);
        mech.turnReset(); // the turn it was rolled
        mech.turnReset(); // one turn
        expect(mech.futureWarsPlay.morale?.status?.turnsLeft).toBe(1);
        mech.turnReset();
        expect(mech.futureWarsPlay.morale?.status).toBeUndefined();
        expect(toHit(mech, laser, 2).finalToHit).toBe(before);
    });

    it("a broken 'Mech may not fire; its status counts on the next roll; a second rout is a surrender", () => {
        const mech = build(["fw-morale"]);
        const laser = mount(mech, "medium-laser");
        expect(mech.rollMorale(2, 2, 0).result?.status).toBe("broken");
        expect(toHit(mech, laser, 2).finalToHit).toBe(-1);
        // Regular 0, broken -2, -3 more: -5, a rout.
        expect(mech.rollMorale(2, 2, -3).total).toBe(-3);
        expect(mech.futureWarsPlay.morale?.routs).toBe(1);
        mech.rollMorale(2, 2, -5);
        expect(mech.futureWarsPlay.morale?.routs).toBe(2);
        expect(mech.isMoraleSurrendered()).toBe(true);
    });

    it("Carry On results move the morale class and later rolls for the rest of the game", () => {
        const mech = build(["fw-morale"]);
        mech.rollMorale(2, 8, 0);
        expect(mech.getMoraleClassIndex()).toBe(0);
        mech.setMoraleClassIndex(4);
        mech.rollMorale(2, 8, 0); // Elite +2: 10, -2 on later rolls
        expect(mech.futureWarsPlay.morale?.laterRollModifier).toBe(-2);
        expect(mech.rollMorale(2, 8, 0).total).toBe(8);
    });

    it("under the FW #17 printing a shaken 'Mech needs more to pass, a rout lasts until it leaves, and a 13 raises it", () => {
        const mech = build(["fw-morale-17"]);
        expect(mech.getFutureWarsPrinting("morale")).toBe("original");
        expect(mech.getFutureWarsPrinting("malfunctions")).toBeUndefined();
        expect(mech.getFutureWarsPlayRulesets()).toEqual(["fw-morale-17"]);
        expect(mech.rollMorale(2, 2, 0).result?.status).toBe("broken"); // Regular, total 2: broken 2 turns
        expect(mech.rollMorale(7, 12, 0).passed).toBe(false); // broken Regular: 6 + 2 = 8 to pass
        expect(mech.rollMorale(8, 2, 0).passed).toBe(true);

        const routed = build(["fw-morale-17"]);
        expect(routed.rollMorale(2, 2, -6)).toMatchObject({ total: -4, result: { status: "routed", untilOffBoard: true } });
        for (let turn = 0; turn < 3; turn++) routed.turnReset();
        expect(routed.futureWarsPlay.morale?.status).toMatchObject({ kind: "routed", untilOffBoard: true });

        const enraged = build(["fw-morale-17"]);
        enraged.rollMorale(2, 12, 1);
        expect(enraged.getMoraleClassIndex()).toBe(3);
        enraged.setMoraleClassIndex(5);
        enraged.rollMorale(2, 10, 0); // Crack +3: 13
        expect(enraged.getMoraleClassIndex()).toBe(5);

        expect(build(["fw-morale"]).getFutureWarsPrinting("morale")).toBe("best-of");
        expect(build([]).getFutureWarsPrinting("morale")).toBeUndefined();
    });

    it("under the FW #9 printing a laser's 16 is +2 to-hit and an autocannon's 11 still fires", () => {
        const mech = build(["fw-weapon-malfunctions-9"]);
        expect(mech.getFutureWarsPlayRulesets()).toEqual(["fw-weapon-malfunctions-9"]);
        const laser = mount(mech, "medium-laser");
        const before = toHit(mech, laser, 2).finalToHit;
        expect(mech.recordWeaponMalfunction(mech.equipmentList[laser].uuid!, 16)).toMatchObject({ toHit: 2, heat: 5 });
        expect(toHit(mech, laser, 2).finalToHit).toBe(before + 2);
        const ac = mount(mech, "autocannon-5");
        const acUuid = mech.equipmentList[ac].uuid!;
        mech.recordWeaponMalfunction(acUuid, 11);
        expect(mech.getWeaponMalfunction(acUuid)?.out).toBe(false);
        expect(toHit(mech, ac, 2).finalToHit).toBeGreaterThan(0);
    });

    it("The Long Range Wars' range bands work under either printing", () => {
        const mech = build(["fw-long-range-wars-12"]);
        expect(toHit(mech, mount(mech, "medium-laser"), 15)).toMatchObject({ finalToHit: 4 + 6, rangeExplanation: "Extended" });
    });

    it("a malfunction is recorded on the weapon: its to-hit and heat while it fires; out of action until cleared", () => {
        const mech = build(["fw-weapon-malfunctions"]);
        const laser = mount(mech, "medium-laser");
        const uuid = mech.equipmentList[laser].uuid!;
        const before = toHit(mech, laser, 2).finalToHit;
        const heat = mech.getActiveWeaponHeat();
        expect(mech.recordWeaponMalfunction(uuid, 15)).toMatchObject({ toHit: 3, heat: 5 });
        expect(toHit(mech, laser, 2).finalToHit).toBe(before + 3);
        expect(mech.getActiveWeaponHeat()).toBe(heat + 5);
        mech.recordWeaponMalfunction(uuid, 17);
        expect(toHit(mech, laser, 2).finalToHit).toBe(-1);
        expect(mech.getActiveWeaponHeat()).toBe(0);
        mech.clearWeaponMalfunction(uuid, 1);
        expect(mech.getWeaponMalfunction(uuid)).toMatchObject({ toHit: 3, heat: 5, out: false });
        // No table: a PPC's 2 is only a miss.
        const ppc = mount(mech, "standard-ppc");
        expect(mech.recordWeaponMalfunction(mech.equipmentList[ppc].uuid!, 7)).toBeUndefined();
    });

    it("Long Range Wars adds extended and extreme range to the to-hit, with its own movement modifiers; off without the ruleset", () => {
        const plain = build([]);
        expect(toHit(plain, mount(plain, "medium-laser"), 15).finalToHit).toBe(-1);
        const mech = build(["fw-long-range-wars"]);
        const laser = mount(mech, "medium-laser");
        expect(toHit(mech, laser, 15)).toMatchObject({ finalToHit: 4 + 6, rangeExplanation: "Extended" });
        expect(toHit(mech, laser, 30)).toMatchObject({ finalToHit: 4 + 9, rangeExplanation: "Extreme" });
        expect(toHit(mech, laser, 37).finalToHit).toBe(-1);
        mech.currentMovementMode = "j";
        expect(toHit(mech, laser, 15, 3).finalToHit).toBe(4 + 6 + 5 + 4);
        mech.futureWarsPlay.ranging = 3;
        expect(toHit(mech, laser, 15, 2).finalToHit).toBe(4 + 6 + 5 + 2 - 3);
        // Ranging is for extended and extreme range only.
        mech.currentMovementMode = "n";
        expect(toHit(mech, laser, 2).finalToHit).toBe(4);
    });

    it("the rulesets' play state survives a save and load", () => {
        const mech = build(["fw-morale", "fw-weapon-malfunctions"]);
        const laser = mount(mech, "medium-laser");
        mech.rollMorale(2, 5, 0);
        mech.recordWeaponMalfunction(mech.equipmentList[laser].uuid!, 9);
        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect(copy.futureWarsPlay).toEqual(mech.futureWarsPlay);
    });

    // Final review fixes.
    it("a weapon that may not fire stays at no to-hit when the LR Flamer's own range penalty runs after", () => {
        const mech = build(["fw-strategic-movement"]);
        const flamer = mount(mech, "custom-lr-flamer");
        mech.setStrategicMovement("w", 6);
        expect(toHit(mech, flamer, 6).finalToHit).toBe(-1);
        expect(toHit(mech, flamer, 10).finalToHit).toBe(-1);
    });

    it("ranging counts only against a target that moved 6 hexes or less (standard modifier +2 or less)", () => {
        const mech = build(["fw-long-range-wars"]);
        const laser = mount(mech, "medium-laser");
        mech.futureWarsPlay.ranging = 3;
        expect(toHit(mech, laser, 15, 2).finalToHit).toBe(4 + 6 + 2 - 3);
        expect(toHit(mech, laser, 15, 3).finalToHit).toBe(4 + 6 + 4);
    });

    it("weapons that may not fire add no heat; the opportunity weapon's heat counts once, targeted or not", () => {
        const mech = build(["fw-strategic-movement", "fw-opportunity-fire", "fw-morale"]);
        const laser = mount(mech, "medium-laser");
        const heat = mech.getActiveWeaponHeat();
        expect(heat).toBe(3);
        mech.setStrategicMovement("w", 6);
        expect(mech.getActiveWeaponHeat()).toBe(0);
        mech.setStrategicMovement(null);
        mech.rollMorale(2, 2, 0); // broken: no firing
        expect(mech.getActiveWeaponHeat()).toBe(0);
        mech.futureWarsPlay.morale = {};
        const uuid = mech.equipmentList[laser].uuid!;
        mech.recordOpportunityShot(uuid);
        expect(mech.getActiveWeaponHeat()).toBe(heat);
        mech.equipmentList[laser].target = undefined;
        expect(mech.getActiveWeaponHeat()).toBe(heat);
    });
});
