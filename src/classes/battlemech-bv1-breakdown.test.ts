import { describe, expect, it } from "vitest";
import { ICalcBreakdown, ICalcStep, renderCalcStepsHtml } from "../data/calc-steps";
import { MECH_BV1_STEPS, NO_BATTLE_VALUE_STEPS } from "../data/calc-steps-mech-bv1";
import { btRulesEditions } from "../data/rules-editions";
import { BattleMech } from "./battlemech";

// BV1 as cited steps (#599). The Goshawk is both Master Rules books' own worked example (BMR p.145, BMR(R) p.159):
// every number below is one the book prints. If one fails, check the page image, then fix the calculation.

const add = (mech: BattleMech, tag: string, tech = "is") => mech.addEquipmentFromTag(tag, tech, "", false, undefined, "", false, [], undefined, undefined)!;

/** The example's own inputs: 173 points of armor, 91 of structure on a Clan XL engine, 11 double heat sinks, 6/9/6. */
const goshawk = (): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("clan");
    mech.setEra("dark-ages");
    mech.setTonnage(55);
    mech.setInternalStructureType("standard");
    mech.setEngineType("clan_xl");
    mech.setWalkSpeed(6);
    mech.setArmorType("standard");
    mech.setArmorWeight(11);
    mech.setHeadArmor(9);
    mech.setCenterTorsoArmor(24);
    mech.setCenterTorsoRearArmor(8);
    mech.setLeftTorsoArmor(18);
    mech.setLeftTorsoRearArmor(6);
    mech.setRightTorsoArmor(18);
    mech.setRightTorsoRearArmor(6);
    mech.setLeftArmArmor(18);
    mech.setRightArmArmor(18);
    mech.setLeftLegArmor(24);
    mech.setRightLegArmor(24);
    mech.setHeatSinksType("double");
    mech.setAdditionalHeatSinks(1);
    mech.setJumpSpeed(6);
    for (const tag of ["clan_large-pulse-laser", "clan_medium-pulse-laser", "clan_medium-pulse-laser", "clan_medium-pulse-laser",
        "clan-machine-gun", "clan-machine-gun", "clan-machine-gun", "clan-machine-gun", "clan-streak-srm-2", "clan-streak-srm-2",
        "clan-targeting-computer"]) add(mech, tag, "clan");
    const streakAmmo = add(mech, "ammo-clan-streak-srm-standard", "clan");
    const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === streakAmmo.uuid);
    expect(mech.moveCritical("un", from, "lt", mech.getCriticals().leftTorso.findIndex(critical => !critical))).toBe(true);
    // Half a ton of machine gun ammunition.
    add(mech, "ammo-machine-gun-standard", "clan").weight = 0.5;
    return mech;
};

const steps = (breakdown: ICalcBreakdown, id: string): ICalcStep[] => breakdown.steps.filter((step) => step.id === id);
const last = (breakdown: ICalcBreakdown, id: string): ICalcStep => {
    const found = steps(breakdown, id);
    if (found.length === 0) throw new Error(`No step ${id}`);
    return found[found.length - 1];
};
const sum = (breakdown: ICalcBreakdown, id: string): number => steps(breakdown, id).reduce((total, step) => total + (step.value ?? NaN), 0);

describe.each(["master-rules", "master-rules-revised"])("The Master Rules' worked BV1 example, the Goshawk, under %s", (edition) => {
    it("matches the book at every printed step", () => {
        const breakdown = goshawk().getBattleValueBreakdown(edition);
        expect(breakdown).toMatchObject({ kind: "battle-value", scheme: "bv1", edition });
        expect(last(breakdown, "bv1.def.armor").value).toBe(346);
        expect(last(breakdown, "bv1.def.structure.clan-xl").value).toBe(102.375);
        expect(last(breakdown, "bv1.def.tonnage").value).toBe(55);
        expect(steps(breakdown, "bv1.def.equipment")).toHaveLength(0);
        expect(steps(breakdown, "bv1.def.explosive")).toHaveLength(0);
        expect(last(breakdown, "bv1.def.heat").value).toBe(-40);
        expect(last(breakdown, "bv1.def.subtotal").value).toBe(463.375);
        expect(last(breakdown, "bv1.def.factor").value).toBe(1.3);
        expect(last(breakdown, "bv1.def.rating").value).toBeCloseTo(602.3875, 6);
        // Large pulse laser 265, three medium pulse lasers 333, four machine guns 20, two Streak SRM 2 80.
        expect(sum(breakdown, "bv1.off.weapon")).toBe(698);
        expect(last(breakdown, "bv1.off.targeting-computer").value).toBeCloseTo(119.6, 6);
        expect(sum(breakdown, "bv1.off.ammo")).toBe(5.5);
        expect(last(breakdown, "bv1.off.base").value).toBeCloseTo(823.1, 6);
        expect(last(breakdown, "bv1.off.heat").value).toBeCloseTo(713.3533334, 6);
        expect(last(breakdown, "bv1.off.speed").value).toBe(2.3);
        // The book prints 1,640.72667 for 713.3533334 x 2.30; the product is 1,640.71267 (ledger Finding 19). The
        // total rounds to 2,243 either way.
        expect(last(breakdown, "bv1.off.rating").value).toBeCloseTo(1640.71267, 4);
        expect(last(breakdown, "bv1.final.round").value).toBe(2243);
        expect(breakdown.result).toBe(2243);
    });

    it("holds only this edition's bv1 steps and ends on getBattleValue(edition)", () => {
        const mech = goshawk();
        const breakdown = mech.getBattleValueBreakdown(edition);
        for (const step of breakdown.steps) {
            expect(step.id.startsWith("bv1."), step.id).toBe(true);
            expect(step.cites, step.id).toEqual(MECH_BV1_STEPS[edition][step.id].cites);
        }
        expect(breakdown.steps[breakdown.steps.length - 1]).toMatchObject({ id: "bv1.final.round", value: mech.getBattleValue(edition) });
    });
});

describe("'Mech Battle Value breakdown by edition", () => {
    it("gives an edition without Battle Value a null result and one cited step", () => {
        const breakdown = goshawk().getBattleValueBreakdown("battledroids");
        expect(breakdown).toMatchObject({ scheme: "none", result: null });
        expect(breakdown.steps).toHaveLength(1);
        expect(breakdown.steps[0].id).toBe("none.no-battle-value");
        expect(breakdown.steps[0].cites.length).toBeGreaterThan(0);
        expect(breakdown.steps[0].value).toBeUndefined();
        expect(Object.keys(NO_BATTLE_VALUE_STEPS)).toEqual(["none.no-battle-value"]);
    });

    it("breaks the same 'Mech down under every edition without throwing, with finite numbers", () => {
        const mech = goshawk();
        for (const edition of btRulesEditions) {
            const breakdown = mech.getBattleValueBreakdown(edition.tag);
            expect(["none", "bv1", "bv2"], edition.tag).toContain(breakdown.scheme);
            for (const step of breakdown.steps) {
                if (step.value !== undefined) expect(Number.isFinite(step.value), `${edition.tag} ${step.id}`).toBe(true);
                if (step.total !== undefined) expect(Number.isFinite(step.total), `${edition.tag} ${step.id}`).toBe(true);
            }
            if (breakdown.scheme !== "none") expect(breakdown.result, edition.tag).toBe(mech.getBattleValue(edition.tag));
        }
    });

    it("breaks down a bare 'Mech under BV1 without NaN", () => {
        const breakdown = new BattleMech().getBattleValueBreakdown("master-rules-revised");
        for (const step of breakdown.steps) if (step.value !== undefined) expect(Number.isFinite(step.value), step.id).toBe(true);
        expect(Number.isFinite(breakdown.result as number)).toBe(true);
    });

    it("renders calcLogBV from the design's own edition's steps, with no BV2 comparison block", () => {
        const mech = goshawk();
        mech.setRulesEdition("master-rules-revised");
        expect(mech.calcLogBV).toBe(renderCalcStepsHtml(mech.getBattleValueBreakdown().steps));
        expect(mech.calcLogBV).toContain("BMR(R) p.152");
        expect(mech.calcLogBV).not.toContain("for comparison");
        mech.setRulesEdition("battledroids");
        expect(mech.calcLogBV).toBe(renderCalcStepsHtml(mech.getBattleValueBreakdown().steps));
    });

    it("marks an item the edition's tables do not print, and names it as text", () => {
        const mech = goshawk();
        const laser = mech.getInstalledEquipment().find((item) => item.tag === "clan_large-pulse-laser")!;
        laser.name = "<b>Odd</b>";
        laser.editionStats = undefined;
        const unlisted = steps(mech.getBattleValueBreakdown("master-rules-revised"), "bv1.off.weapon.unlisted");
        expect(unlisted).toHaveLength(1);
        expect(unlisted[0]).toMatchObject({ status: "provisional", label: expect.stringContaining("<b>Odd</b>") });
        expect(renderCalcStepsHtml(unlisted)).not.toContain("<b>Odd</b>");
    });
});
