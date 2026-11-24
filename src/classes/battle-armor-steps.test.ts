import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import BattleArmor from "./battle-armor";
import { findCalcDefProblems, type ICalcBreakdown, type ICalcStep } from "../data/calc-steps";
import { BATTLE_ARMOR_BMRR_STOCK_PRICES, BATTLE_ARMOR_BV1_TABLE_ROWS, BATTLE_ARMOR_BV2_STEPS, BATTLE_ARMOR_COST_STEPS, getBattleArmorBv1Steps } from "../data/calc-steps-battle-armor";

// #599, the battle armor round: the Battle Value and cost steps (calc-steps-battle-armor.ts), read 2026-11-23.

/** Max's Purifier (TM pp.162-171): 6 troopers, mimetic armor, jump 3, an ER small laser in a modular mount. */
const purifier = (troopers = 6): BattleArmor => {
    const suit = new BattleArmor();
    suit.setWeightClass("medium");
    suit.setMotive("jump", 3);
    suit.setManipulator("ra", "battle-claw");
    suit.setArmor("ba-mimetic");
    suit.setArmorPoints(6);
    suit.addItem("is-er-small-laser", "la");
    suit.updateItem(0, { modular: true });
    suit.setSquadSize(troopers);
    return suit;
};

/** The Grenadier [SRM/SL] squad (TM p.311). */
const grenadier = (): BattleArmor => {
    const suit = new BattleArmor();
    suit.setWeightClass("heavy");
    suit.setGroundMP(2);
    suit.setArmor("ba-stealth-standard");
    suit.setArmorPoints(9);
    suit.addItem("is-small-laser", "ra");
    suit.addItem("is-srm-4", "body");
    suit.updateItem(1, { shots: 7 });
    return suit;
};

/** The standard Clan Elemental Point (CBT Companion pp.187-189, 188): small laser, SRM 2 with 2 shots, battle claw. */
const elemental = (weapon = "clan-small-laser"): BattleArmor => {
    const suit = new BattleArmor();
    suit.setTechBase("clan");
    suit.setWeightClass("medium");
    suit.setMotive("jump", 3);
    suit.setManipulator("la", "battle-claw");
    suit.setArmorPoints(10);
    suit.addItem(weapon, "ra");
    suit.updateItem(0, { modular: true });
    suit.addItem("clan-srm-2", "body");
    suit.updateItem(1, { shots: 2 });
    suit.addAPMount("la");
    suit.setSquadSize(5);
    return suit;
};

const stepOf = (breakdown: ICalcBreakdown, id: string): ICalcStep => {
    const found = breakdown.steps.find((entry) => entry.id === id);
    if (!found) throw new Error(`no ${id} step in ${breakdown.steps.map((entry) => entry.id).join(", ")}`);
    return found;
};

describe("Battle armor step definitions", () => {
    it("are clean definitions: BV2, BV1 under both editions, and cost", () => {
        expect(findCalcDefProblems(BATTLE_ARMOR_BV2_STEPS)).toEqual([]);
        for (const id of Object.keys(BATTLE_ARMOR_BV2_STEPS)) expect(id.startsWith("ba.bv2."), id).toBe(true);
        for (const edition of ["master-rules", "master-rules-revised"]) {
            expect(findCalcDefProblems(getBattleArmorBv1Steps(edition)), edition).toEqual([]);
            for (const id of Object.keys(getBattleArmorBv1Steps(edition))) expect(id.startsWith("ba.bv1."), id).toBe(true);
        }
        expect(findCalcDefProblems(BATTLE_ARMOR_COST_STEPS)).toEqual([]);
        for (const id of Object.keys(BATTLE_ARMOR_COST_STEPS)) expect(id.startsWith("ba.cost."), id).toBe(true);
    });

    it("are each listed in the reading ledger", () => {
        const ledger = fs.readFileSync(path.join(__dirname, "../../docs/superpowers/plans/2026-11-10-cited-bv-ledger.md"), "utf8");
        const ids = [BATTLE_ARMOR_BV2_STEPS, getBattleArmorBv1Steps("master-rules"), getBattleArmorBv1Steps("master-rules-revised"), BATTLE_ARMOR_COST_STEPS].flatMap(Object.keys);
        for (const id of ids) expect(ledger, id).toContain("`" + id + "`");
    });

    it("cites the Master Rules' BV1 under the Revised Edition and marks it provisional under the 1998 edition (owner call 7)", () => {
        expect(getBattleArmorBv1Steps("master-rules-revised")["ba.bv1.def.armor"].status).toBe("cited");
        expect(getBattleArmorBv1Steps("master-rules")["ba.bv1.def.armor"].status).toBe("provisional");
        expect(getBattleArmorBv1Steps("master-rules")["ba.bv1.def.armor"].note).toContain("BMR p.142");
    });
});

describe("Battle armor BV2 as cited steps (TM pp.310-311)", () => {
    it("works the Purifier Level I at every printed number: 466", () => {
        const breakdown = purifier().getBattleValueBreakdown("total-warfare");
        expect(breakdown.scheme).toBe("bv2");
        expect(stepOf(breakdown, "ba.bv2.def.armor").value).toBe(16);
        expect(stepOf(breakdown, "ba.bv2.def.factor").value).toBe(1.6);
        expect(stepOf(breakdown, "ba.bv2.def.rating").value).toBe(25.6);
        expect(stepOf(breakdown, "ba.bv2.off.direct").value).toBe(17);
        expect(stepOf(breakdown, "ba.bv2.off.anti-mech").value).toBe(17);
        expect(stepOf(breakdown, "ba.bv2.off.weapons").value).toBe(34);
        expect(stepOf(breakdown, "ba.bv2.off.speed").value).toBe(0.77);
        expect(stepOf(breakdown, "ba.bv2.off.rating").value).toBe(26.18);
        expect(stepOf(breakdown, "ba.bv2.final.suit")).toMatchObject({ value: 51.78, total: 52 });
        expect(stepOf(breakdown, "ba.bv2.final.size")).toMatchObject({ detail: "51.78 x 9", value: 466 });
        expect(breakdown.result).toBe(466);
        expect(stepOf(breakdown, "ba.bv2.def.rating").cites).toEqual([{ source: "tm", page: "310" }]);
    });

    it("works the Grenadier [SRM/SL] squad at every printed number: 326 (the book's 63 x 5.2 is the unrounded 62.66 x 5.2)", () => {
        const breakdown = grenadier().getBattleValueBreakdown("total-warfare");
        expect(stepOf(breakdown, "ba.bv2.def.armor").value).toBe(23.5);
        expect(stepOf(breakdown, "ba.bv2.def.factor").value).toBe(1.3);
        expect(stepOf(breakdown, "ba.bv2.def.rating").value).toBe(30.55);
        expect(stepOf(breakdown, "ba.bv2.off.direct").value).toBe(9);
        expect(stepOf(breakdown, "ba.bv2.off.missiles").value).toBe(40.4);
        expect(stepOf(breakdown, "ba.bv2.off.weapons").value).toBe(49.4);
        expect(stepOf(breakdown, "ba.bv2.off.speed").value).toBe(0.65);
        expect(stepOf(breakdown, "ba.bv2.off.rating").value).toBe(32.11);
        expect(stepOf(breakdown, "ba.bv2.final.suit")).toMatchObject({ value: 62.66, total: 63 });
        expect(stepOf(breakdown, "ba.bv2.final.size")).toMatchObject({ detail: "62.66 x 5.2", value: 326 });
        expect(stepOf(breakdown, "ba.bv2.final.size").note).toContain("325.832");
    });

    it("names the rule behind a burdened suit, a magnetic clamp and the APDS", () => {
        const burdened = new BattleArmor();
        burdened.setWeightClass("medium");
        burdened.setManipulator("la", "basic");
        burdened.setManipulator("ra", "basic");
        burdened.setArmorPoints(5);
        burdened.addItem("is-lrm-1", "body");
        burdened.addItem("is-small-laser", "ra");
        burdened.addItem("is-magnetic-clamps", "body");
        const breakdown = burdened.getBattleValueBreakdown("total-warfare");
        expect(stepOf(breakdown, "ba.bv2.off.anti-mech.burdened").cites.map((cite) => cite.source)).toEqual(["tm", "tw"]);
        expect(stepOf(breakdown, "ba.bv2.off.other.clamps").value).toBe(1);
        const aegis = new BattleArmor();
        aegis.setWeightClass("medium");
        aegis.addItem("is-advanced-point-defense-system", "ra");
        expect(stepOf(aegis.getBattleValueBreakdown("total-warfare"), "ba.bv2.def.apds")).toMatchObject({ status: "provisional", detail: "+7" });
    });

    it("gives no Battle Value before the Master Rules, and the edition's own scheme after", () => {
        const suit = purifier();
        expect(suit.getBattleValueBreakdown("battletech-4th-edition")).toMatchObject({ scheme: "none", result: null });
        expect(suit.getBattleValueBreakdown("total-warfare")).toMatchObject({ scheme: "bv2", result: suit.getBattleValue("total-warfare") });
        expect(suit.getBattleValueBreakdown("master-rules-revised")).toMatchObject({ scheme: "bv1", result: suit.getBattleValue("master-rules-revised") });
        expect(suit.getBattleValueBreakdown("master-rules")).toMatchObject({ scheme: "bv1", result: suit.getBattleValue("master-rules") });
    });

    it("shows the same steps as the log", () => {
        const suit = purifier();
        expect(suit.getBattleValueLog().join("\n")).toContain("Defensive Battle Rating: 16 x 1.6 = 25.6 (TM p.310)");
    });
});

describe("Battle armor BV1 as cited steps (CBT Companion pp.187-190)", () => {
    it("works the Clan Elemental Point at every printed number: 56 a suit, 280 (the Companion prints 30.1124 for 39.12 x 0.77: 30.1224)", () => {
        const breakdown = elemental().getBattleValueBreakdown("master-rules-revised");
        expect(breakdown.scheme).toBe("bv1");
        expect(stepOf(breakdown, "ba.bv1.def.armor").value).toBe(21.5);
        expect(stepOf(breakdown, "ba.bv1.def.factor").value).toBe(1.2);
        expect(stepOf(breakdown, "ba.bv1.def.rating").value).toBe(25.8);
        expect(stepOf(breakdown, "ba.bv1.off.direct").value).toBe(9);
        expect(stepOf(breakdown, "ba.bv1.off.anti-mech").value).toBe(9);
        expect(stepOf(breakdown, "ba.bv1.off.missiles").value).toBe(21.12);
        expect(stepOf(breakdown, "ba.bv1.off.weapons").value).toBe(39.12);
        expect(stepOf(breakdown, "ba.bv1.off.speed").value).toBe(0.77);
        expect(stepOf(breakdown, "ba.bv1.off.rating").value).toBe(30.12);
        expect(stepOf(breakdown, "ba.bv1.final.suit").value).toBe(56);
        expect(stepOf(breakdown, "ba.bv1.final.squad")).toMatchObject({ detail: "56 x 5", value: 280 });
        expect(breakdown.result).toBe(280);
        expect(stepOf(breakdown, "ba.bv1.def.armor").status).toBe("cited");
    });

    it("is provisional under the 1998 Master Rules, which print only a table (owner call 7)", () => {
        const breakdown = elemental().getBattleValueBreakdown("master-rules");
        expect(breakdown.result).toBe(280);
        expect(stepOf(breakdown, "ba.bv1.def.armor").status).toBe("provisional");
    });

    it("shows its misses against the stock suits the Revised Master Rules table prints (BMR(R) p.155: Clan Standard 245 / 234 / 279; the Companion 280)", () => {
        const printed = Object.fromEntries(BATTLE_ARMOR_BV1_TABLE_ROWS.filter(([name]) => name.startsWith("Clan")).map(([name, , bv]) => [name, bv]));
        expect(printed).toEqual({ "Clan Standard (Flamer)": 245, "Clan Standard (Machine Gun)": 234, "Clan Standard (Small Laser)": 279 });
        const ours = {
            "Clan Standard (Flamer)": elemental("clan-flamer-ba").getBattleValue("master-rules-revised"),
            "Clan Standard (Machine Gun)": elemental("clan-machine-gun").getBattleValue("master-rules-revised"),
            "Clan Standard (Small Laser)": elemental().getBattleValue("master-rules-revised"),
        };
        // The Companion's formula against the table: +5, +16 and +1. The table is a stock-suit list, the formula the only one in print.
        expect(ours).toEqual({ "Clan Standard (Flamer)": 250, "Clan Standard (Machine Gun)": 250, "Clan Standard (Small Laser)": 280 });
    });

    it("rounds each suit and multiplies by the troopers, with no unit size table (Companion p.189)", () => {
        const suit = elemental();
        suit.setSquadSize(4);
        expect(suit.getBattleValue("master-rules-revised")).toBe(56 * 4);
    });
});

describe("Battle armor cost as cited steps (TM pp.285-286)", () => {
    it("prices Max's Purifier at the worked 3,523,500, training included (TM p.286)", () => {
        const suit = purifier();
        expect(suit.getSuitCost()).toBe(437250);
        expect(suit.getTrooperTrainingCost()).toBe(150000);
        expect(suit.getCBillCost()).toBe((437250 + 150000) * 6);
        expect(suit.getCBillCost()).toBe(3523500);
        // The first worked line: the suit with its mount only, 426,000, with 150,000 of training, for 6 troopers.
        expect((suit.getSuitCost() - 11250 + 150000) * 6).toBe(3456000);
        const breakdown = suit.getCostBreakdown("total-warfare");
        expect(stepOf(breakdown, "ba.cost.training")).toMatchObject({ value: 150000 });
        expect(stepOf(breakdown, "ba.cost.final")).toMatchObject({ value: 3523500, emphasis: true });
        expect(breakdown.result).toBe(3523500);
        expect(stepOf(breakdown, "ba.cost.suit-total").note).toContain("451,000");
    });

    it("trains each trooper at the suit's technology base: 200,000 Clan, 150,000 Inner Sphere, a mixed suit by its chassis (owner call 2)", () => {
        expect(elemental().getTrooperTrainingCost()).toBe(200000);
        expect(purifier().getTrooperTrainingCost()).toBe(150000);
        const mixed = purifier();
        mixed.setMixedTech(true);
        expect(mixed.getTrooperTrainingCost()).toBe(150000);
        const clanChassis = elemental();
        clanChassis.setMixedTech(true);
        expect(clanChassis.getTrooperTrainingCost()).toBe(200000);
    });

    it("prices the Companion's standard Clan Elemental Point at 3,556,650 (Companion p.187)", () => {
        const suit = elemental();
        // Detachable SRM 2 (20,000), the AP mount (500) and the modular mount (1,000) over 478,500 give 500,000; the laser 11,250 and the rifle 80 give 511,330.
        suit.updateItem(1, { detachable: true });
        suit.setAPMountWeapon(0, "inf-auto-rifle");
        expect(suit.getSuitCost()).toBe(511330);
        expect(suit.getCBillCost()).toBe(511330 * 5 + 200000 * 5);
        expect(suit.getCBillCost()).toBe(3556650);
    });

    it("shows the Revised Master Rules' fixed price beside the built cost for a stock suit, never in place of it (BMR(R) p.150, owner call 8)", () => {
        const suit = purifier(4);
        suit.setName("Purifier Battle Armor");
        const built = suit.getCBillCost();
        const revised = suit.getCostBreakdown("master-rules-revised");
        expect(stepOf(revised, "ba.cost.stock-price")).toMatchObject({ value: 2400000, status: "provisional" });
        expect(revised.result).toBe(built);
        expect(suit.getCostBreakdown("master-rules").steps.some((entry) => entry.id === "ba.cost.stock-price")).toBe(true);
        expect(suit.getCostBreakdown("total-warfare").steps.some((entry) => entry.id === "ba.cost.stock-price")).toBe(false);
        expect(BATTLE_ARMOR_BMRR_STOCK_PRICES.length).toBe(20);
    });
});

describe("Battle armor Alpha Strike for the new equipment (#600)", () => {
    it("gives the advanced point defense system the RAMS special (ASC: RISC Advanced Point Defense System)", () => {
        const aegis = new BattleArmor();
        aegis.setWeightClass("medium");
        aegis.addItem("is-advanced-point-defense-system", "ra");
        expect(aegis.getAlphaStrikeStats().specialAbilities).toContain("RAMS");
        // The interface unit converts to nothing of its own.
        const interfaceSuit = new BattleArmor();
        interfaceSuit.setWeightClass("pa-l");
        interfaceSuit.addItem("is-battlemech-neural-interface-unit", "body");
        expect(interfaceSuit.getAlphaStrikeStats().specialAbilities).not.toContain("RAMS");
    });
});

// The whole-branch review of 2026-11-23.
describe("Battle armor review fixes (#599)", () => {
    const kage = (): BattleArmor => {
        const suit = new BattleArmor();
        suit.setWeightClass("light");
        suit.setArmorPoints(5);
        suit.setSquadSize(4);
        return suit;
    };

    it("counts ECM once however many troopers carry one: an ECM suit on two troopers is not two systems in a suit", () => {
        const one = kage();
        one.addItem("is-ecm-suite", "body");
        one.updateItem(0, { trooper: 1 });
        const two = kage();
        two.addItem("is-ecm-suite", "body");
        two.updateItem(0, { trooper: 1 });
        two.addItem("is-ecm-suite", "body");
        two.updateItem(1, { trooper: 2 });
        const all = kage();
        all.addItem("is-ecm-suite", "body");
        expect(two.getBattleValue()).toBe(one.getBattleValue());
        expect(one.getBattleValue()).toBe(all.getBattleValue());
        for (const edition of ["master-rules-revised", "total-warfare"]) expect(two.getBattleValue(edition), edition).toBe(one.getBattleValue(edition));
    });

    it("counts a second ECM suit on the same trooper as the second system it is (TM p.310: +1 for each system the suit mounts)", () => {
        const suit = kage();
        suit.addItem("is-ecm-suite", "body");
        const single = suit.getBattleValue();
        suit.addItem("is-ecm-suite", "body");
        expect(suit.getBattleValue()).toBeGreaterThan(single);
        expect(suit.getBattleValueBreakdown("total-warfare").steps.find((entry) => entry.id === "ba.bv2.def.equipment")?.detail).toBe("+2");
    });

    it("marks the BV1 ECM step provisional, as the Companion adds only the ECM's 1 (p.187)", () => {
        const suit = kage();
        suit.addItem("is-ecm-suite", "body");
        const ecm = suit.getBattleValueBreakdown("master-rules-revised").steps.find((entry) => entry.id === "ba.bv1.def.ecm");
        expect(ecm).toMatchObject({ status: "provisional", detail: "+1" });
        suit.setArmor("ba-laser-reflective");
        expect(suit.getBattleValueBreakdown("master-rules-revised").steps.find((entry) => entry.id === "ba.bv1.def.armor.special")?.status).toBe("provisional");
    });

    it("gives the suit's Battle Value under the edition asked for, as the squad's is", () => {
        const suit = elemental();
        expect(suit.getSuitBattleValue("master-rules-revised")).toBe(56);
        expect(suit.getSuitBattleValue("master-rules-revised") * 5).toBe(suit.getBattleValue("master-rules-revised"));
        expect(suit.getSuitBattleValue()).toBe(suit.getSuitBattleValue("total-warfare"));
    });

    it("adds the anti-personnel weapons of a suit whose only gear is sensors, since a sensor fires nothing (Companion p.188)", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("light");
        suit.setArmorPoints(5);
        suit.addAPMount("body");
        suit.setAPMountWeapon(0, "inf-laser-rifle");
        suit.addItem("is-improved-sensors", "body");
        const steps = suit.getBattleValueBreakdown("master-rules-revised").steps;
        expect(steps.some((entry) => entry.id === "ba.bv1.off.anti-personnel")).toBe(true);
    });

    it("shows the Revised Master Rules' stock price for the Inner Sphere standard suit and the Gray Death Standard too", () => {
        const suit = purifier(4);
        suit.setName("IS Standard Battle Armor (Baka) [SL]");
        expect(suit.getCostBreakdown("master-rules-revised").steps.find((entry) => entry.id === "ba.cost.stock-price")?.value).toBe(2400000);
        suit.setName("Gray Death Std Suit [Laser]");
        expect(suit.getCostBreakdown("master-rules").steps.find((entry) => entry.id === "ba.cost.stock-price")?.value).toBe(2400000);
    });
});
