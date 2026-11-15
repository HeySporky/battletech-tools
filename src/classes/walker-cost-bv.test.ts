import { describe, expect, it } from "vitest";
import Walker from "./walker";
import { WALKER_LOCATIONS, WalkerLocation } from "../data/walker-construction";
import { ICalcBreakdown, ICalcStep, findCalcDefProblems } from "../data/calc-steps";
import { WALKER_BV2_STEPS, WALKER_BV_NOTE, WALKER_COST_NOTE, WALKER_COST_STEPS, getWalkerBv1Steps } from "../data/calc-steps-walker";
import { editionHasBattleValue, getBattleValueRules, getSpeedFactor } from "../data/battle-value";

// Clell Flint's walkers (#172), Chunk C of docs/superpowers/plans/2026-11-13-future-wars-walkers.md: cost and Battle
// Value. Flint printed neither, so there is no target number: these tests pin the steps (the BattleMech's procedures
// run over a walker's ten locations) on two hand-built walkers, and that every step is provisional.

const latestEra = (walker: Walker): void => {
    const eras = walker.getAvailableEras();
    expect(walker.setEra(eras[eras.length - 1].tag)).toBe(true);
};
const mount = (walker: Walker, tag: string, location: WalkerLocation, inTurret = false): void => {
    const result = walker.addEquipment(tag, location, inTurret);
    expect(result.reason).toBeUndefined();
    expect(result.added).toBe(true);
};
const armorAll = (walker: Walker, points: number): void => {
    for (const location of WALKER_LOCATIONS) walker.setArmor(location, Math.min(points, walker.getMaxArmor(location)));
};
const steps = (breakdown: ICalcBreakdown, id: string): ICalcStep[] => breakdown.steps.filter((step) => step.id === id);
const value = (breakdown: ICalcBreakdown, id: string): number | undefined => {
    const found = steps(breakdown, id);
    expect(found, id).toHaveLength(1);
    return found[0].value;
};

/** 25 tons, biped Walking MP 6 (engine 150): walks 8, runs 12. Two medium lasers, 10 single heat sinks. */
const buildLight = (): Walker => {
    const walker = new Walker();
    expect(walker.setTons(25)).toBe(true);
    expect(walker.setWalkMP(6)).toBe(true);
    mount(walker, "medium-laser", "ft");
    mount(walker, "medium-laser", "lfl");
    armorAll(walker, 6);
    expect(walker.getIssues()).toEqual([]);
    return walker;
};

/**
 * 80 tons, biped Walking MP 3 (engine 240): walks 4, runs 6, jumps 3. A turret with a PPC; a PPC in the rear torso; an
 * AC/10 in the front torso (seven slots: it splits); two tons of its ammunition in the left torso and one in the right
 * torso behind CASE; a medium laser in each front leg. 10 single heat sinks.
 */
const buildAssault = (): Walker => {
    const walker = new Walker();
    latestEra(walker);
    expect(walker.setTons(80)).toBe(true);
    expect(walker.setWalkMP(3)).toBe(true);
    walker.setTurret(true);
    expect(walker.setJumpJets(3)).toBe(true);
    mount(walker, "standard-ppc", "cs", true);
    mount(walker, "standard-ppc", "rrt");
    mount(walker, "autocannon-standard-c", "ft");
    mount(walker, "ammo-ac-10-standard", "lt");
    mount(walker, "ammo-ac-10-standard", "lt");
    mount(walker, "case", "rt");
    mount(walker, "ammo-ac-10-standard", "rt");
    mount(walker, "medium-laser", "lfl");
    mount(walker, "medium-laser", "rfl");
    armorAll(walker, 16);
    expect(walker.getIssues()).toEqual([]);
    return walker;
};

describe("Walker step tables", () => {
    it("are sound and wholly provisional, each note opening with the not-published line", () => {
        const tables = [WALKER_COST_STEPS, WALKER_BV2_STEPS, getWalkerBv1Steps("master-rules"), getWalkerBv1Steps("master-rules-revised")];
        for (const defs of tables) {
            expect(findCalcDefProblems(defs)).toEqual([]);
            expect(Object.keys(defs).length).toBeGreaterThan(10);
            for (const def of Object.values(defs)) expect(def.status).toBe("provisional");
        }
        for (const def of Object.values(WALKER_COST_STEPS)) expect(def.note?.startsWith(WALKER_COST_NOTE)).toBe(true);
        for (const def of Object.values(WALKER_BV2_STEPS)) expect(def.note?.startsWith(WALKER_BV_NOTE)).toBe(true);
        expect(WALKER_BV_NOTE).toBe("Battle Value by the BattleMech rules applied to a Future Wars Walker; not published.");
    });

    it("keep the BattleMech step's pages and price the turret from both turret rows read", () => {
        expect(WALKER_BV2_STEPS["walker.bv2.def.armor"].cites).toContainEqual({ source: "tm", page: "302" });
        expect(WALKER_COST_STEPS["walker.cost.actuators"].cites).toContainEqual({ source: "tm", page: "278" });
        expect(WALKER_COST_STEPS["walker.cost.turret"].cites).toEqual([{ source: "toaue", page: "223" }, { source: "tm", page: "279" }]);
        expect(getWalkerBv1Steps("master-rules")["walker.bv1.def.armor"].cites).toEqual([{ source: "bmr", page: "139" }]);
        expect(getWalkerBv1Steps("master-rules-revised")["walker.bv1.def.armor"].cites).toEqual([{ source: "bmrr", page: "152" }]);
    });

    it("give the walker the BattleMech's Battle Value system in every edition", () => {
        expect(getBattleValueRules("total-warfare", "walker").scheme).toBe("bv2");
        expect(getBattleValueRules("master-rules-revised", "walker")).toMatchObject({ scheme: "bv1" });
        expect(getBattleValueRules("master-rules-revised", "walker").pending).toBeUndefined();
        expect(editionHasBattleValue("battletech-3rd-edition", "walker")).toBe(false);
    });
});

describe("Walker cost", () => {
    it("prices a 25-ton light walker row by row", () => {
        const walker = buildLight();
        const cost = walker.getCostBreakdown();
        expect(cost.kind).toBe("cost");
        expect(cost.steps.every((step) => step.status === "provisional")).toBe(true);
        expect(value(cost, "walker.cost.cockpit")).toBe(200000);
        expect(value(cost, "walker.cost.life-support")).toBe(50000);
        expect(value(cost, "walker.cost.sensors")).toBe(2000 * 25);
        expect(value(cost, "walker.cost.musculature")).toBe(2000 * 25);
        expect(value(cost, "walker.cost.structure")).toBe(400 * 25);
        // Four legs: upper leg 150, lower leg 80, foot 120 a ton each.
        expect(value(cost, "walker.cost.actuators")).toBe(4 * (150 + 80 + 120) * 25);
        expect(value(cost, "walker.cost.engine")).toBe(5000 * 150 * 25 / 75);
        expect(value(cost, "walker.cost.gyro")).toBe(300000 * 2);
        expect(steps(cost, "walker.cost.jump-jets")).toHaveLength(0);
        expect(steps(cost, "walker.cost.turret")).toHaveLength(0);
        expect(value(cost, "walker.cost.heat-sinks")).toBe(0);
        expect(value(cost, "walker.cost.armor")).toBe(10000 * walker.getArmorWeight());
        expect(steps(cost, "walker.cost.equipment").map((step) => step.value)).toEqual([40000, 40000]);
        const subtotal = 200000 + 50000 + 50000 + 50000 + 10000 + 35000 + 250000 + 600000 + 10000 * walker.getArmorWeight() + 80000;
        expect(value(cost, "walker.cost.subtotal")).toBe(subtotal);
        expect(value(cost, "walker.cost.tonnage-multiplier")).toBe(1.25);
        expect(cost.result).toBe(Math.round(subtotal * 1.25));
        expect(walker.getCBillCost()).toBe(cost.result);
        expect(steps(cost, "walker.cost.final.loaded")).toHaveLength(0);
    });

    it("prices an 80-ton assault walker: jump jets, the turret at 7,500 C-bills a ton, ammunition left out", () => {
        const walker = buildAssault();
        const cost = walker.getCostBreakdown();
        expect(cost.steps.every((step) => step.status === "provisional")).toBe(true);
        expect(value(cost, "walker.cost.actuators")).toBe(1400 * 80);
        expect(value(cost, "walker.cost.engine")).toBe(5000 * 240 * 80 / 75);
        expect(value(cost, "walker.cost.gyro")).toBe(300000 * 3);
        expect(value(cost, "walker.cost.jump-jets")).toBe(200 * 3 * 3 * 80);
        // Flint's standard turret mechanism weighs 3 tons: 7,500 C-bills a ton (owner ruling 2026-11-14), midway between
        // the 'Mech turret's 10,000 (TO:AUE p.223) and a vehicle's 5,000 (TM p.279).
        expect(walker.getTurretWeight()).toBe(3);
        expect(value(cost, "walker.cost.turret")).toBe(22500);
        expect(steps(cost, "walker.cost.equipment").reduce((sum, step) => sum + (step.value ?? 0), 0)).toBe(200000 + 200000 + 200000 + 50000 + 40000 + 40000);
        expect(steps(cost, "walker.cost.ammo").map((step) => step.value)).toEqual([6000, 6000, 6000]);
        const subtotal = 200000 + 50000 + 160000 + 160000 + 32000 + 112000 + 1280000 + 900000 + 144000 + 22500
            + 10000 * walker.getArmorWeight() + 730000;
        expect(value(cost, "walker.cost.subtotal")).toBe(subtotal);
        expect(value(cost, "walker.cost.tonnage-multiplier")).toBe(1.8);
        expect(cost.result).toBe(Math.round(subtotal * 1.8));
        expect(value(cost, "walker.cost.final.loaded")).toBe(Math.round(subtotal * 1.8) + 18000);
    });

    it("prices an industrial walker as an IndustrialMech: cockpit, structure and the tonnage multiplier", () => {
        const walker = new Walker();
        latestEra(walker);
        walker.setIndustrial(true);
        expect(walker.setTons(40)).toBe(true);
        expect(walker.setWalkMP(3)).toBe(true);
        const cost = walker.getCostBreakdown();
        expect(value(cost, "walker.cost.cockpit")).toBe(100000);
        expect(value(cost, "walker.cost.structure")).toBe(300 * 40);
        expect(value(cost, "walker.cost.tonnage-multiplier")).toBe(1.1);
        walker.setAdvancedFireControl(true);
        expect(value(walker.getCostBreakdown(), "walker.cost.cockpit")).toBe(200000);
    });
});

describe("Walker Battle Value (provisional)", () => {
    it("is always provisional", () => {
        expect(new Walker().isBattleValueProvisional()).toBe(true);
    });

    it("rates a 25-ton light walker by the TechManual steps", () => {
        const walker = buildLight();
        const bv = walker.getBattleValueBreakdown("total-warfare");
        expect(bv.scheme).toBe("bv2");
        expect(bv.steps.length).toBeGreaterThan(10);
        expect(bv.steps.every((step) => step.status === "provisional" && step.note?.startsWith(WALKER_BV_NOTE))).toBe(true);
        const armor = walker.getArmorPoints() * 2.5;
        const structure = walker.getTotalStructure() * 1.5;
        expect(value(bv, "walker.bv2.def.armor")).toBe(armor);
        expect(value(bv, "walker.bv2.def.structure")).toBe(structure);
        expect(value(bv, "walker.bv2.def.engine")).toBe(structure);
        expect(value(bv, "walker.bv2.def.gyro")).toBe(12.5);
        expect(steps(bv, "walker.bv2.def.explosive.ammo")).toHaveLength(0);
        // The walker walks 8 and runs 12 (biped 6 x 1.25, x 1.5): a target movement modifier of +4.
        expect(walker.getRunMP()).toBe(12);
        expect(value(bv, "walker.bv2.def.tmm")).toBe(4);
        expect(value(bv, "walker.bv2.def.factor")).toBe(1.4);
        const defensive = (armor + structure + 12.5) * 1.4;
        expect(value(bv, "walker.bv2.def.rating")).toBeCloseTo(defensive, 6);
        // Heat efficiency 6 + 10 - 2 = 14 against 6 heat: no weapon is halved.
        expect(value(bv, "walker.bv2.off.heat.efficiency")).toBe(14);
        expect(value(bv, "walker.bv2.off.heat.weapons")).toBe(6);
        expect(steps(bv, "walker.bv2.off.weapon").map((step) => step.value)).toEqual([46, 46]);
        expect(value(bv, "walker.bv2.off.speed")).toBe(getSpeedFactor(12));
        const offensive = (92 + 25) * getSpeedFactor(12);
        expect(value(bv, "walker.bv2.off.rating")).toBeCloseTo(offensive, 6);
        expect(steps(bv, "walker.bv2.off.industrial")).toHaveLength(0);
        expect(bv.result).toBe(Math.round(defensive + offensive));
        expect(walker.getBattleValue("total-warfare")).toBe(bv.result);
    });

    it("rates an 80-ton assault walker: explosive slots by location, the turret in full, the heat steps", () => {
        const walker = buildAssault();
        const bv = walker.getBattleValueBreakdown("total-warfare");
        expect(bv.steps.every((step) => step.status === "provisional")).toBe(true);
        const armor = walker.getArmorPoints() * 2.5;
        const structure = walker.getTotalStructure() * 1.5;
        expect(value(bv, "walker.bv2.def.gyro")).toBe(40);
        // Two tons of ammunition in the left torso without CASE: 15 each. The ton behind CASE in the right torso is spared.
        expect(steps(bv, "walker.bv2.def.explosive.ammo").map((step) => [step.value, /Left Torso/.test(step.label)])).toEqual([[-15, true], [-15, true]]);
        expect(steps(bv, "walker.bv2.def.explosive.protected")).toHaveLength(1);
        expect(steps(bv, "walker.bv2.def.explosive.protected")[0].label).toMatch(/Right Torso/);
        expect(value(bv, "walker.bv2.def.subtotal")).toBe(armor + structure + 40 - 30);
        // Runs 6 (+2); jumps 3 (+1, and 1 more for jumping).
        expect(value(bv, "walker.bv2.def.tmm")).toBe(2);
        const defensive = (armor + structure + 40 - 30) * 1.2;
        expect(value(bv, "walker.bv2.def.rating")).toBeCloseTo(defensive, 6);

        // Three tons of AC/10 ammunition at 15: 45, under the gun's 123.
        expect(value(bv, "walker.bv2.off.ammo.total")).toBe(45);
        // Heat efficiency 6 + 10 - 3 (the jump) = 13; the weapons make 29.
        expect(value(bv, "walker.bv2.off.heat.efficiency")).toBe(13);
        expect(value(bv, "walker.bv2.off.heat.weapons")).toBe(29);
        // Highest BV first: both PPCs in full (the second reaches 13), then the AC/10 and the lasers at half.
        const turret = steps(bv, "walker.bv2.off.weapon.turret");
        expect(turret).toHaveLength(1);
        expect(turret[0].value).toBe(176);
        expect(steps(bv, "walker.bv2.off.weapon").map((step) => step.value)).toEqual([176]);
        expect(steps(bv, "walker.bv2.off.weapon.overheat").map((step) => step.value)).toEqual([61.5, 23, 23]);
        expect(value(bv, "walker.bv2.off.weapons.total")).toBe(459.5);
        // Running 6 + half of jumping 3, rounded: 8.
        expect(value(bv, "walker.bv2.off.speed")).toBe(getSpeedFactor(8));
        const offensive = (459.5 + 45 + 80) * getSpeedFactor(8);
        expect(value(bv, "walker.bv2.off.rating")).toBeCloseTo(offensive, 6);
        expect(bv.result).toBe(Math.round(defensive + offensive));
    });

    it("spares a Clan walker's outer torsos (built-in CASE) but not its center torso, legs or control section", () => {
        const walker = new Walker();
        walker.setTechTag("clan");
        latestEra(walker);
        expect(walker.setTons(80)).toBe(true);
        expect(walker.setWalkMP(3)).toBe(true);
        // The Clan machine gun and its ammunition have tags of their own: take both from the walker's offer.
        const offer = walker.getEquipmentOffer();
        const gun = offer.find((item) => !item.isAmmo && /^(clan-)?machine-gun$/.test(item.tag));
        expect(gun).toBeDefined();
        mount(walker, gun!.tag, "ft");
        const ammo = offer.find((item) => item.isAmmo && /^ammo-(clan-)?machine-gun-standard$/.test(item.tag) && item.weight === 1);
        expect(ammo).toBeDefined();
        mount(walker, ammo!.tag, "rrt");
        mount(walker, ammo!.tag, "lrl");
        const bv = walker.getBattleValueBreakdown("total-warfare");
        const explosive = steps(bv, "walker.bv2.def.explosive.ammo");
        expect(explosive).toHaveLength(1);
        expect(explosive[0].label).toMatch(/Left Rear Leg/);
    });

    it("rates an industrial walker as an IndustrialMech: structure halved, x 0.9 without Advanced Fire Control", () => {
        const walker = new Walker();
        latestEra(walker);
        walker.setIndustrial(true);
        expect(walker.setTons(40)).toBe(true);
        expect(walker.setWalkMP(3)).toBe(true);
        mount(walker, "medium-laser", "ft");
        const bv = walker.getBattleValueBreakdown("total-warfare");
        expect(value(bv, "walker.bv2.def.structure")).toBe(walker.getTotalStructure() * 1.5 * 0.5);
        const rating = value(bv, "walker.bv2.off.rating")!;
        expect(value(bv, "walker.bv2.off.industrial")).toBeCloseTo(rating * 0.9, 6);
        walker.setAdvancedFireControl(true);
        expect(steps(walker.getBattleValueBreakdown("total-warfare"), "walker.bv2.off.industrial")).toHaveLength(0);
        expect(walker.getBattleValue("total-warfare")).toBeGreaterThan(bv.result!);
    });

    it("works a BV1 under the Master Rules editions, by their steps", () => {
        const walker = buildAssault();
        const bv = walker.getBattleValueBreakdown("master-rules-revised");
        expect(bv.scheme).toBe("bv1");
        expect(bv.steps.every((step) => step.status === "provisional" && step.note?.startsWith(WALKER_BV_NOTE))).toBe(true);
        const armor = walker.getArmorPoints() * 2;
        const structure = walker.getTotalStructure() * 1.5;
        expect(value(bv, "walker.bv1.def.armor")).toBe(armor);
        expect(value(bv, "walker.bv1.def.structure")).toBe(structure);
        expect(value(bv, "walker.bv1.def.tonnage")).toBe(80);
        // 20 a ton for the two tons in the left torso; the ton behind CASE is spared.
        expect(steps(bv, "walker.bv1.def.explosive").map((step) => step.value)).toEqual([-20, -20]);
        // 29 weapon heat + 3 for the jump against 10 heat sinks: 22 over, 5 each.
        expect(value(bv, "walker.bv1.def.heat")).toBe(-110);
        expect(value(bv, "walker.bv1.def.subtotal")).toBe(armor + structure + 80 - 40 - 110);
        expect(value(bv, "walker.bv1.def.factor")).toBe(1.2);
        // Running 6 + Jumping 3.
        expect(value(bv, "walker.bv1.off.speed")).toBe(getSpeedFactor(9));
        expect(steps(bv, "walker.bv1.off.heat")).toHaveLength(1);
        expect(bv.result).toBe(walker.getBattleValue("master-rules-revised"));
        expect(bv.result).toBeGreaterThan(0);
        expect(walker.getBattleValueBreakdown("master-rules").scheme).toBe("bv1");
    });

    it("has no Battle Value under an edition older than the Master Rules, and says so in one step", () => {
        const bv = buildLight().getBattleValueBreakdown("battletech-3rd-edition");
        expect(bv.scheme).toBe("none");
        expect(bv.result).toBeNull();
        expect(bv.steps).toHaveLength(1);
    });

    it("reads its own rules edition by default", () => {
        const walker = buildLight();
        expect(walker.getBattleValue()).toBe(walker.getBattleValue(walker.getRulesEdition()));
        expect(walker.getBattleValueBreakdown().edition).toBe(walker.getRulesEdition());
    });
});
