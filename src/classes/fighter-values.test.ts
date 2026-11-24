import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import AerospaceFighter, { AEROSPACE_VSTOL_RULES_LEVEL } from "./aerospace-fighter";
import { findCalcDefProblems, type ICalcBreakdown } from "../data/calc-steps";
import { FIGHTER_BV2_STEPS, FIGHTER_COST_STEPS, getFighterBv1Steps } from "../data/calc-steps-fighter";

// TechManual's Battle Value example, the 100-ton TRB-D36 Thunderbird (TM p.313): Safe Thrust 5, Structural
// Integrity 10, 224 points of armor, 25 single heat sinks, 3 large lasers, 2 LRM 20s with 4 tons of ammunition
// and 5 medium lasers, two of them aft.
const thunderbird = (): AerospaceFighter => {
    const fighter = new AerospaceFighter();
    fighter.setTonnage(100);
    fighter.setSafeThrust(5);
    fighter.setFuelTons(5);
    fighter.setArmorAllocation("nose", 70);
    fighter.setArmorAllocation("leftWing", 52);
    fighter.setArmorAllocation("rightWing", 52);
    fighter.setArmorAllocation("aft", 50);
    fighter.setAdditionalHeatSinks(15);
    for (const arc of ["nose", "leftWing", "rightWing"]) fighter.addEquipmentFromTag("large-laser", arc);
    fighter.addEquipmentFromTag("lrm-20", "leftWing");
    fighter.addEquipmentFromTag("lrm-20", "rightWing");
    for (const arc of ["nose", "nose", "nose", "aft", "aft"]) fighter.addEquipmentFromTag("medium-laser", arc);
    for (let ton = 0; ton < 4; ton++) fighter.addEquipmentFromTag("ammo-lrm-standard");
    return fighter;
};

// TechManual's cost example, the laser 'Mechbuster (TM p.277).
const mechbuster = (): AerospaceFighter => {
    const fighter = new AerospaceFighter();
    fighter.setFighterType("conventional");
    fighter.setTonnage(50);
    fighter.setSafeThrust(5);
    fighter.setEngineType("ice");
    fighter.setFuelTons(4);
    fighter.setArmorAllocation("nose", 18);
    fighter.setArmorAllocation("leftWing", 11);
    fighter.setArmorAllocation("rightWing", 11);
    fighter.setArmorAllocation("aft", 10);
    fighter.setAdditionalHeatSinks(9);
    for (let count = 0; count < 3; count++) fighter.addEquipmentFromTag("medium-laser", "nose");
    return fighter;
};

describe("Fighter Battle Value (TechManual pp.311-313)", () => {
    it("gives the TRB-D36 Thunderbird a Battle Value of 1,932 (TM p.313)", () => {
        const fighter = thunderbird();
        expect(fighter.getRemainingTonnage()).toBe(0);
        expect(fighter.getStructuralIntegrity()).toBe(10);
        expect(fighter.getMaxThrust()).toBe(8);
        expect(AerospaceFighter.speedFactor(8)).toBe(1.37);
        expect(fighter.getBattleValue()).toBe(1932);
        // Defensive: (224 x 2.5 + 10 x 2 - 15 for the LRM ammunition) x 1.2 = 678.
        expect(fighter.getBattleValueLog()).toContain("565 x 1.2 (Aerospace Fighter) = 678");
        // The third large laser crosses the Heat Efficiency of 31; the medium lasers after it are halved.
        expect(fighter.getBattleValueLog()).toContain("Weapon Battle Rating: 915");
    });

    it("drops the ammunition penalty with CASE or a Clan chassis, and uses 1.1 for a conventional fighter (TM pp.311, 316)", () => {
        const fighter = thunderbird();
        fighter.setTech("clan");
        expect(fighter.getBattleValueLog()).not.toContain("no CASE");

        const buster = mechbuster();
        // Defensive (50 x 2.5 + 5 x 2) x 1.1 = 148.5; offensive 3 x 46 x 1.37 = 189.06: no heat halving on a
        // conventional fighter.
        expect(buster.getBattleValue()).toBe(338);
    });

    it("counts a launcher with Artemis IV at 20 percent over the plain launcher (TM p.312)", () => {
        const plain = new AerospaceFighter();
        plain.setTonnage(50);
        plain.setSafeThrust(5);
        plain.addEquipmentFromTag("lrm-20", "nose");
        const artemis = new AerospaceFighter();
        artemis.setTonnage(50);
        artemis.setSafeThrust(5);
        expect(artemis.addEquipmentFromTag("lrm-20-artemis-iv", "nose")).not.toBeNull();
        // LRM 20: 181, x 1.2 = 217.2, both x the Speed Factor of 1.37 for Max Thrust 8.
        const weapon = (fighter: AerospaceFighter) => fighter.getBattleValueBreakdown("total-warfare").steps.find((step) => step.id === "af.bv2.off.weapon")?.value;
        expect(weapon(plain)).toBe(181);
        expect(weapon(artemis)).toBeCloseTo(217.2, 9);
        expect(artemis.getBattleValue() - plain.getBattleValue()).toBe(Math.round(36.2 * 1.37));
    });
});

// #599: the fighter BV2 as cited steps, each read on its page (TM pp.311-316; TO:AUE p.193; IO:AE p.187).
describe("Fighter Battle Value 2 as cited steps", () => {
    // To three places, as the steps show them: 565 x 1.2 is 677.9999... in floating point.
    const values = (breakdown: ICalcBreakdown, id: string) => breakdown.steps.filter((step) => step.id === id)
        .map((step) => typeof step.value === "number" ? Math.round(step.value * 1000) / 1000 : step.value);

    it("works the TRB-D36 Thunderbird at every number TM p.313 prints", () => {
        const breakdown = thunderbird().getBattleValueBreakdown("total-warfare");
        expect([breakdown.kind, breakdown.edition, breakdown.scheme, breakdown.result]).toEqual(["battle-value", "total-warfare", "bv2", 1932]);
        expect(values(breakdown, "af.bv2.def.armor")).toEqual([560]);
        expect(values(breakdown, "af.bv2.def.structure")).toEqual([20]);
        expect(values(breakdown, "af.bv2.def.explosive")).toEqual([-15]);
        expect(values(breakdown, "af.bv2.def.subtotal")).toEqual([565]);
        expect(values(breakdown, "af.bv2.def.rating")).toEqual([678]);
        expect(values(breakdown, "af.bv2.off.ammo")).toEqual([92]);
        expect(values(breakdown, "af.bv2.off.heat.efficiency")).toEqual([31]);
        expect(values(breakdown, "af.bv2.off.heat.weapons")).toEqual([51]);
        // Highest Modified BV first; the third large laser crosses 31, and every heat-making weapon after it is halved.
        expect(values(breakdown, "af.bv2.off.weapon")).toEqual([181, 181, 123, 123, 123, 23, 23, 23, 11.5, 11.5]);
        expect(values(breakdown, "af.bv2.off.weapons.total")).toEqual([915]);
        expect(values(breakdown, "af.bv2.off.speed")).toEqual([1.37]);
        expect(values(breakdown, "af.bv2.off.rating")).toEqual([1253.55]);
        expect(values(breakdown, "af.bv2.final.round")).toEqual([1932]);
        expect(breakdown.steps.filter((step) => step.status !== "cited").map((step) => step.id)).toEqual([]);
        // The log is the steps.
        expect(thunderbird().getBattleValueLog()).toContain("Weapon Battle Rating");
        expect(thunderbird().getBattleValueLog()).toContain("TM p.312");
    });

    it("assumes CASE on a Clan fighter, and gives a conventional fighter 1.1 and no heat (TM pp.311-312, 316)", () => {
        const clan = thunderbird();
        clan.setTech("clan");
        const breakdown = clan.getBattleValueBreakdown("total-warfare");
        expect(values(breakdown, "af.bv2.def.explosive")).toEqual([]);
        expect(breakdown.steps.map((step) => step.id)).toContain("af.bv2.def.clan-case");
        const buster = mechbuster().getBattleValueBreakdown("total-warfare");
        expect(buster.steps.find((step) => step.id === "af.bv2.def.rating")?.detail).toContain("x 1.1");
        expect(buster.steps.map((step) => step.id)).toContain("af.bv2.off.heat.conventional");
        expect(values(buster, "af.bv2.off.heat.efficiency")).toEqual([]);
        expect(buster.result).toBe(338);
    });

    // Fixed test-first (#599 fighter queue): our Clan LRM 20 records carried an aerospace heat of 4 (the one-shot 5);
    // TW p.304 prints 6 in the one heat column ground and aerospace units share. Kirghiz B 4086 -> 3935 = MUL.
    it("counts a Clan LRM 20 at 6 heat, as TW p.304 prints it", () => {
        for (const tag of ["clan-lrm-20", "clan-lrm-20-artemis-v", "clan-lrm-20-ios", "clan-lrm-20-os"]) {
            const fighter = new AerospaceFighter();
            fighter.setTech("clan");
            fighter.setTonnage(50);
            fighter.setSafeThrust(5);
            expect(fighter.addEquipmentFromTag(tag, "nose"), tag).not.toBeNull();
            const heat = values(fighter.getBattleValueBreakdown("total-warfare"), "af.bv2.off.heat.weapons")[0];
            expect(heat, tag).toBe(tag.endsWith("-os") || tag.endsWith("-ios") ? 1.5 : 6);
        }
    });

    // Fixed test-first (#599 fighter queue): TM p.312 halves "the forward-firing weapons" when the aft ones are worth
    // more. A fighter's wing weapons fire forward, so the nose and wings are weighed together against the aft, as the
    // MUL and MegaMek do (Slayer SL-15C 1,379 -> 1,321 = MUL). We had weighed the nose alone.
    it("weighs the nose and wings together against the aft, and halves the weaker (TM p.312)", () => {
        const fighter = new AerospaceFighter();
        fighter.setTonnage(80);
        fighter.setSafeThrust(6);
        fighter.addEquipmentFromTag("srm-6", "nose");
        fighter.addEquipmentFromTag("medium-laser", "nose");
        for (const arc of ["leftWing", "leftWing", "rightWing", "rightWing"]) fighter.addEquipmentFromTag("medium-laser", arc);
        fighter.addEquipmentFromTag("lrm-15", "aft");
        fighter.addEquipmentFromTag("medium-laser", "aft");
        const steps = fighter.getBattleValueBreakdown("total-warfare").steps.filter((step) => step.id === "af.bv2.off.weapon");
        const halved = steps.filter((step) => step.detail?.includes("weaker of")).map((step) => step.label);
        expect(halved.sort()).toEqual(["LRM 15 (Aft)", "Medium Laser (Aft)"]);
    });

    // Fixed test-first (#599 fighter queue): a machine gun array was carried at no value. It is worth 0.67 x the
    // machine guns it links in its location (TM pp.228, 317), as on a 'Mech or vehicle. Turk E 1,769 -> MegaMek's 1,811.
    it("values a machine gun array at 0.67 x the machine guns it links (TM pp.228, 317)", () => {
        const fighter = new AerospaceFighter();
        fighter.setTech("clan");
        fighter.setTonnage(50);
        fighter.setSafeThrust(6);
        for (let gun = 0; gun < 3; gun++) expect(fighter.addEquipmentFromTag("clan-heavy-machine-gun", "leftWing")).not.toBeNull();
        expect(fighter.addEquipmentFromTag("clan-heavy-machine-gun-array", "leftWing")).not.toBeNull();
        const array = fighter.getBattleValueBreakdown("total-warfare").steps.find((step) => step.id === "af.bv2.off.weapon" && /Array/.test(step.label));
        expect(array?.value).toBeCloseTo(3 * 6 * 0.67, 6);
        expect(array?.cites).toContainEqual({ source: "tm", page: "317" });
    });

    // Fixed test-first (#599 fighter queue): modular armor's 10 points a pack (TO:AUE p.93) were left out of the armor's
    // BV. They count at 2.5 a point as a vehicle's do; MegaMek and the MUL agree (Issedone C 635 -> MegaMek's 725).
    it("counts modular armor's points with the armor, provisionally", () => {
        const fighter = new AerospaceFighter();
        fighter.setTonnage(50);
        fighter.setSafeThrust(6);
        expect(fighter.addEquipmentFromTag("modular-armor", "nose")).not.toBeNull();
        const step = fighter.getBattleValueBreakdown("total-warfare").steps.find((entry) => entry.id === "af.bv2.def.armor.modular");
        expect([step?.value, step?.status]).toEqual([25, "provisional"]);
    });

    // Fixed test-first (#599 fighter queue): the BV table treats an HVAC as a Gauss weapon in the defensive rating
    // (TO:AUE p.195), as a 'Mech's explosive components are; the fighter only looked for Gauss names. Rapier RPR-300X
    // 1,971 -> MegaMek's 1,968.
    it("takes 1 point for each weapon the table treats as a Gauss weapon, an HVAC among them (TM p.311; TO:AUE p.195)", () => {
        const fighter = new AerospaceFighter();
        fighter.setTonnage(60);
        fighter.setSafeThrust(5);
        fighter.addEquipmentFromTag("is-hvac-10", "nose");
        fighter.addEquipmentFromTag("is-hvac-10", "nose");
        fighter.addEquipmentFromTag("standard-gauss-rifle", "leftWing");
        const step = fighter.getBattleValueBreakdown("total-warfare").steps.find((entry) => entry.id === "af.bv2.def.gauss");
        expect(step?.value).toBe(-3);
        expect(step?.cites).toContainEqual({ source: "toaue", page: "195" });
    });

    // Fixed test-first: the fighter did not apply its drone operating system (TO:AUE p.193).
    it("takes a drone operating system's 0.8 off every weapon and 0.95 off the total, not off ammunition (TO:AUE p.193)", () => {
        const make = (drone: boolean) => {
            const fighter = new AerospaceFighter();
            fighter.setTonnage(50);
            fighter.setSafeThrust(5);
            fighter.addEquipmentFromTag("lrm-10", "nose");
            fighter.addEquipmentFromTag("ammo-lrm-standard");
            if (drone) expect(fighter.addEquipmentFromTag("drone-operating-system", "fuselage")).not.toBeNull();
            return fighter;
        };
        const plain = make(false).getBattleValueBreakdown("total-warfare");
        const drone = make(true).getBattleValueBreakdown("total-warfare");
        expect(values(plain, "af.bv2.off.weapon")).toEqual([90]);
        expect(values(drone, "af.bv2.off.weapon")).toEqual([72]);
        expect(values(drone, "af.bv2.off.ammo")).toEqual(values(plain, "af.bv2.off.ammo"));
        const speed = values(drone, "af.bv2.off.speed")[0]!;
        const defensive = values(drone, "af.bv2.def.rating")[0]!;
        expect(drone.steps.map((step) => step.id)).toContain("af.bv2.final.drone");
        expect(drone.result).toBe(Math.round((defensive + (72 + values(plain, "af.bv2.off.ammo")[0]!) * speed) * 0.95));
        expect(make(true).getBattleValue()).toBe(drone.result);
    });

    it("has no Battle Value before the Master Rules", () => {
        const breakdown = thunderbird().getBattleValueBreakdown("battletech-4th-edition");
        expect([breakdown.scheme, breakdown.result]).toEqual(["none", null]);
    });

    it("are clean definitions, each with one of the three sections", () => {
        expect(findCalcDefProblems(FIGHTER_BV2_STEPS)).toEqual([]);
        for (const [id, def] of Object.entries(FIGHTER_BV2_STEPS)) {
            expect(id.startsWith("af.bv2."), id).toBe(true);
            expect(["Defensive Battle Rating", "Offensive Battle Rating", "Final Battle Value"], id).toContain(def.section);
        }
    });
});

// #599: the fighter BV1 of AeroTech 2 (AT2 pp.53-54) and AeroTech 2 Revised (AT2R p.81), with the Master Rules'
// equipment Battle Values and Speed Factor Table. No book works a fighter, so this one is worked by hand.
describe("Fighter Battle Value 1 as cited steps", () => {
    // 50 tons, Safe Thrust 5 (Maximum 8), 5 tons of fuel, 60 armor points, 10 single heat sinks; a PPC and an LRM-10
    // in the nose, a medium laser aft, a ton of LRM-10 ammunition and no CASE.
    const striker = (tech = "is"): AerospaceFighter => {
        const fighter = new AerospaceFighter();
        fighter.setTech(tech);
        fighter.setTonnage(50);
        fighter.setSafeThrust(5);
        fighter.setFuelTons(5);
        fighter.setArmorAllocation("nose", 20);
        fighter.setArmorAllocation("leftWing", 15);
        fighter.setArmorAllocation("rightWing", 15);
        fighter.setArmorAllocation("aft", 10);
        expect(fighter.addEquipmentFromTag(tech === "clan" ? "er-ppc-clan" : "standard-ppc", "nose")).not.toBeNull();
        expect(fighter.addEquipmentFromTag(tech === "clan" ? "clan-lrm-10" : "lrm-10", "nose")).not.toBeNull();
        expect(fighter.addEquipmentFromTag(tech === "clan" ? "er-medium-laser-clan" : "medium-laser", "aft")).not.toBeNull();
        expect(fighter.addEquipmentFromTag("ammo-lrm-standard")).not.toBeNull();
        return fighter;
    };
    const values = (breakdown: ICalcBreakdown, id: string) => breakdown.steps.filter((step) => step.id === id)
        .map((step) => typeof step.value === "number" ? Math.round(step.value * 1000) / 1000 : step.value);

    for (const edition of ["master-rules", "master-rules-revised"]) {
        it(`works the defensive and offensive ratings as written (${edition})`, () => {
            const fighter = striker();
            expect([fighter.getStructuralIntegrity(), fighter.getMaxThrust(), fighter.getHeatDissipation()]).toEqual([5, 8, 10]);
            const breakdown = fighter.getBattleValueBreakdown(edition);
            expect([breakdown.scheme, breakdown.edition]).toEqual(["bv1", edition]);
            // Defensive: 60 x 2 + 5 x 1.5 + 5 tons of fuel - 1 ton of explosive ammunition x 20 - (17 heat - 10) x 5.
            expect(values(breakdown, "af.bv1.def.armor")).toEqual([120]);
            expect(values(breakdown, "af.bv1.def.structure")).toEqual([7.5]);
            expect(values(breakdown, "af.bv1.def.fuel")).toEqual([5]);
            expect(values(breakdown, "af.bv1.def.explosive")).toEqual([-20]);
            expect(values(breakdown, "af.bv1.def.heat")).toEqual([-35]);
            expect(values(breakdown, "af.bv1.def.subtotal")).toEqual([77.5]);
            expect(values(breakdown, "af.bv1.def.rating")).toEqual([93]);
            // Offensive: PPC 176, LRM-10 90, the aft medium laser 46 at full value, ammunition 11.
            expect(values(breakdown, "af.bv1.off.weapon")).toEqual([176, 90, 46]);
            expect(values(breakdown, "af.bv1.off.ammo")).toEqual([11]);
            expect(values(breakdown, "af.bv1.off.base")).toEqual([323]);
            // 17 heat over 10: X = 10 x 323 / 17 = 190, Y = (323 - 190) / 2 = 66.5.
            expect(values(breakdown, "af.bv1.off.heat")).toEqual([256.5]);
            expect(values(breakdown, "af.bv1.off.bombing")).toEqual([50]);
            expect(values(breakdown, "af.bv1.off.speed")).toEqual([1.37]);
            expect(values(breakdown, "af.bv1.off.rating")).toEqual([419.905]);
            expect(breakdown.result).toBe(513);
            expect(fighter.getBattleValue(edition)).toBe(513);
            expect(breakdown.steps.every((step) => step.cites.length > 0)).toBe(true);
            expect(breakdown.steps.find((step) => step.id === "af.bv1.def.armor")?.cites).toEqual([{ source: edition === "master-rules" ? "at2" : "at2r", page: edition === "master-rules" ? "53" : "81" }]);
        });
    }

    it("charges a Clan fighter's ammunition 10 a ton, its CASE built in (AT2R p.65; provisional under AT2)", () => {
        const revised = striker("clan").getBattleValueBreakdown("master-rules-revised");
        expect(values(revised, "af.bv1.def.explosive.case")).toEqual([-10]);
        expect(revised.steps.find((step) => step.id === "af.bv1.def.clan-case")?.status).toBe("cited");
        const original = striker("clan").getBattleValueBreakdown("master-rules");
        expect(original.steps.find((step) => step.id === "af.bv1.def.clan-case")?.status).toBe("provisional");
    });

    // #599 review: AeroTech 2's errata (the p.46 change) has a conventional fighter make no heat with its non-energy
    // weapons, as getWeaponHeat counts it; BV1 charged their heat anyway.
    it("charges a conventional fighter no heat for its non-energy weapons", () => {
        const fighter = new AerospaceFighter();
        fighter.setFighterType("conventional");
        fighter.setTonnage(50);
        fighter.setSafeThrust(5);
        fighter.setEngineType("ice");
        fighter.addEquipmentFromTag("autocannon-lbx-10", "nose");
        fighter.addEquipmentFromTag("autocannon-lbx-10", "nose");
        expect(fighter.getWeaponHeat()).toBe(0);
        expect(fighter.getHeatDissipation()).toBe(0);
        for (const edition of ["master-rules", "master-rules-revised"]) {
            const steps = fighter.getBattleValueBreakdown(edition).steps.map((step) => step.id);
            expect(steps, edition).not.toContain("af.bv1.def.heat");
            expect(steps, edition).not.toContain("af.bv1.off.heat");
        }
    });

    it("caps ammunition at its weapons' BV, as AeroTech 2 does", () => {
        const fighter = striker();
        for (let ton = 0; ton < 9; ton++) fighter.addEquipmentFromTag("ammo-lrm-standard");
        const breakdown = fighter.getBattleValueBreakdown("master-rules-revised");
        expect(values(breakdown, "af.bv1.off.ammo.cap")).toEqual([90]);
        expect(values(breakdown, "af.bv1.def.explosive")).toEqual([-200]);
    });

    it("are clean definitions under both editions", () => {
        for (const edition of ["master-rules", "master-rules-revised"]) {
            const defs = getFighterBv1Steps(edition);
            expect(findCalcDefProblems(defs), edition).toEqual([]);
            for (const id of Object.keys(defs)) expect(id.startsWith("af.bv1."), id).toBe(true);
        }
    });
});

describe("Fighter step definitions", () => {
    it("are each listed in the reading ledger, with its sources", () => {
        const ledger = fs.readFileSync(path.join(__dirname, "../../docs/superpowers/plans/2026-11-10-cited-bv-ledger.md"), "utf8");
        const ids = [FIGHTER_BV2_STEPS, getFighterBv1Steps("master-rules"), getFighterBv1Steps("master-rules-revised"), FIGHTER_COST_STEPS].flatMap(Object.keys);
        for (const id of ids) expect(ledger, id).toContain("`" + id + "`");
        for (const source of ["at2", "at2r"]) expect(ledger, source).toContain("| `" + source + "` |");
    });
});

// A Clan structure presumes CASE where it stores ammunition or explosive equipment (TM p.210), and TM p.292 prices CASE at
// 50,000 in one row for both tech bases: billed to a fighter as to a 'Mech (NGCFells 2026-11-23). A fighter's ammunition
// has no arc of its own, so it is stored in the fuselage; explosive weapons are billed in their own arc.
describe("Clan CASE in the fighter cost (TM pp.210, 292)", () => {
    const clanFighter = (tech: string): AerospaceFighter => {
        const fighter = new AerospaceFighter();
        fighter.setTech(tech);
        fighter.setTonnage(50);
        fighter.setSafeThrust(5);
        fighter.addEquipmentFromTag("medium-laser", "nose");
        return fighter;
    };

    it("bills the fuselage for ammunition and each arc for an explosive weapon on a Clan fighter, and nothing on an Inner Sphere one", () => {
        const clan = clanFighter("clan");
        clan.addEquipmentFromTag("clan-lrm-20", "leftWing");
        clan.addEquipmentFromTag("ammo-lrm-standard");
        clan.addEquipmentFromTag("clan-gauss-rifle", "nose");
        const steps = clan.getCostBreakdown().steps.filter((step) => step.id === "af.cost.clan-case");
        expect(steps.map((step) => step.value)).toEqual([100000]);
        expect(steps[0].detail).toContain("nose");
        expect(steps[0].detail).toContain("fuselage");
        const inner = clanFighter("is");
        inner.addEquipmentFromTag("lrm-20", "leftWing");
        inner.addEquipmentFromTag("ammo-lrm-standard");
        expect(inner.getCostBreakdown().steps.filter((step) => step.id === "af.cost.clan-case")).toHaveLength(0);
    });
});

describe("Fighter cost (TechManual pp.283-285)", () => {
    it("prices the 'Mechbuster's structure at 337,633 C-bills (TM p.277)", () => {
        const fighter = mechbuster();
        expect(fighter.getRemainingTonnage()).toBe(0);
        // 337,633.33 structural + 3 medium lasers at 40,000, x (1 + 50 / 200).
        expect(fighter.getCBillCost()).toBe(Math.round((337633.3333 + 120000) * 1.25));
        expect(fighter.getCBillCostLog()).toContain("Avionics");
        expect(fighter.getCBillCostLog()).toContain("457,633.333");
    });

    // #599: the cost as cited steps; the laser 'Mechbuster at every number TM pp.284 and 286 print (TM p.277).
    it("works the 'Mechbuster's cost at every number the book prints", () => {
        const breakdown = mechbuster().getCostBreakdown();
        const value = (id: string) => breakdown.steps.filter((step) => step.id === id).map((step) => Math.round((step.value ?? NaN) * 1000) / 1000);
        expect(breakdown.kind).toBe("cost");
        expect(value("af.cost.avionics")).toEqual([20000]);
        expect(value("af.cost.structure")).toEqual([20000]);
        expect(value("af.cost.thruster")).toEqual([25000]);
        expect(value("af.cost.landing-gear")).toEqual([500]);
        expect(value("af.cost.engine")).toEqual([208333.333]);
        expect(value("af.cost.fuel")).toEqual([800]);
        expect(value("af.cost.armor")).toEqual([35000]);
        expect(value("af.cost.heat-sinks")).toEqual([18000]);
        expect(value("af.cost.power-amplifiers")).toEqual([10000]);
        expect(value("af.cost.structure.total")).toEqual([337633.333]);
        expect(value("af.cost.equipment")).toEqual([40000, 40000, 40000]);
        expect(value("af.cost.subtotal")).toEqual([457633.333]);
        expect(value("af.cost.tonnage-multiplier")).toEqual([1.25]);
        expect(value("af.cost.final")).toEqual([572042]);
        expect(breakdown.result).toBe(572042);
        expect(findCalcDefProblems(FIGHTER_COST_STEPS)).toEqual([]);
    });

    // TM p.282: ammunition need not be bought to find a unit's cost; it is shown as the loaded cost, as a 'Mech's is.
    it("leaves ammunition out of the cost and adds it to the loaded cost (TM p.282)", () => {
        const fighter = thunderbird();
        const breakdown = fighter.getCostBreakdown();
        const ammo = breakdown.steps.find((step) => step.id === "af.cost.ammo");
        expect(ammo?.value).toBe(4 * 30000);
        const final = breakdown.steps.find((step) => step.id === "af.cost.final")!.value!;
        expect(breakdown.steps.find((step) => step.id === "af.cost.final.loaded")?.value).toBe(final + 120000);
        expect(fighter.getCBillCost()).toBe(final);
    });

    it("multiplies an OmniFighter by 1.25 (TM p.285)", () => {
        const fighter = thunderbird();
        const standard = fighter.getCBillCost();
        fighter.setOmni(true);
        expect(fighter.getCBillCost()).toBe(Math.round(standard * 1.25));
    });
});

describe("OmniFighters, external stores and VSTOL", () => {
    it("separates pod-mounted equipment from the base chassis, on aerospace fighters only", () => {
        const fighter = thunderbird();
        const laser = fighter.getEquipmentList()[0];
        expect(fighter.setPodMounted(laser.uuid!, true)).toBe(false);
        expect(fighter.setOmni(true)).toBe(true);
        expect(fighter.setPodMounted(laser.uuid!, true)).toBe(true);
        expect(fighter.getPodSpace()).toBe(5);
        expect(fighter.getBaseChassisTonnage()).toBe(95);

        const copy = new AerospaceFighter(fighter.exportJSON());
        expect(copy.isOmni()).toBe(true);
        expect(copy.isPodMounted(laser.uuid!)).toBe(true);
        expect(copy.getPodSpace()).toBe(5);

        fighter.setFighterType("conventional");
        expect(fighter.isOmni()).toBe(false);
        expect(fighter.setOmni(true)).toBe(false);
    });

    it("carries one bomb per hardpoint and loses 1 Safe Thrust per 5 bombs, rounded up (TW p.247, TM p.196)", () => {
        // Total Warfare's example: an 85-ton Shiva has 17 hardpoints; ten cluster bombs take 2 off its Safe Thrust.
        const fighter = new AerospaceFighter();
        fighter.setTonnage(85);
        fighter.setSafeThrust(5);
        expect(fighter.getExternalStoresHardpoints()).toBe(17);
        fighter.setExternalStore("ammo-bomb-cluster", 10);
        expect(fighter.getExternalStoresHardpointsUsed()).toBe(10);
        expect(fighter.getLoadedSafeThrust()).toBe(3);
        expect(fighter.getLoadedMaxThrust()).toBe(5);
        fighter.setExternalStore("ammo-bomb-cluster", 17);
        expect(fighter.getLoadedSafeThrust()).toBe(1);

        const weight = fighter.getCurrentTonnage();
        const value = fighter.getBattleValue();
        fighter.setExternalStore("ammo-bomb-standard", 3);
        expect(fighter.getIssues().join(" | ")).toContain("External stores need 20 hardpoints; the fighter has 17");
        // Stores are neither construction weight nor part of the fighter's own Battle Value.
        expect(fighter.getCurrentTonnage()).toBe(weight);
        expect(fighter.getBattleValue()).toBe(value);
        // They join its BV before skill (BV v4.1 p.23): 17 cluster x 13 + 3 standard x 12 = 257, x 1.2 at 3/5.
        fighter.getPilot().gunnery = 3;
        expect(fighter.getPilotAdjustedBattleValue()).toBe(Math.round((value + 257) * 1.2));
        // The Core Rulebook's force adjustments (p.220) have no external stores.
        expect(fighter.getPilotAdjustedBattleValue("core-rulebook")).toBe(Math.round(value * 1.2));

        const copy = new AerospaceFighter(fighter.exportJSON());
        expect(copy.getExternalStores().map((store) => [store.tag, store.count])).toEqual([["ammo-bomb-cluster", 17], ["ammo-bomb-standard", 3]]);
        fighter.setExternalStore("ammo-bomb-cluster", 0);
        expect(fighter.getExternalStores().length).toBe(1);
        expect(fighter.setExternalStore("medium-laser", 2).length).toBe(1);

        const hostile = new AerospaceFighter(JSON.stringify({ externalStores: [{ tag: "medium-laser", count: 4 }, 7, { tag: "ammo-bomb-cluster", count: 1e9 }] }));
        expect(hostile.getExternalStores().map((store) => [store.tag, store.count])).toEqual([["ammo-bomb-cluster", 100]]);
        expect(hostile.getImportIssues().length).toBe(2);
    });

    it("offers VSTOL to an aerospace fighter only as an optional rule from the Advanced level (TM p.190)", () => {
        const fighter = new AerospaceFighter();
        fighter.setTonnage(50);
        expect(fighter.isVSTOLOffered(2)).toBe(false);
        expect(fighter.isVSTOLOffered(AEROSPACE_VSTOL_RULES_LEVEL)).toBe(true);
        expect(fighter.setVSTOL(true)).toBe(true);
        expect(fighter.getVSTOLWeight()).toBe(2.5);
        expect(fighter.getIssues(2).join(" | ")).toContain("optional rule");
        expect(fighter.getIssues(AEROSPACE_VSTOL_RULES_LEVEL).join(" | ")).not.toContain("optional rule");
        fighter.setFighterType("conventional");
        expect(fighter.isVSTOLOffered(0)).toBe(true);
        expect(fighter.getIssues(2).join(" | ")).not.toContain("optional rule");
    });
});
