import { describe, expect, it } from "vitest";
import AerospaceFighter, { AEROSPACE_VSTOL_RULES_LEVEL } from "./aerospace-fighter";

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

describe("Fighter Battle Value (TechManual pp.302-304)", () => {
    it("gives the TRB-D36 Thunderbird a Battle Value of 1,932 (TM p.313)", () => {
        const fighter = thunderbird();
        expect(fighter.getRemainingTonnage()).toBe(0);
        expect(fighter.getStructuralIntegrity()).toBe(10);
        expect(fighter.getMaxThrust()).toBe(8);
        expect(AerospaceFighter.speedFactor(8)).toBe(1.37);
        expect(fighter.getBattleValue()).toBe(1932);
        // Defensive: (224 x 2.5 + 10 x 2 - 15 for the LRM ammunition) x 1.2 = 678.
        expect(fighter.getBattleValueLog()).toContain("= 678.00");
        // The third large laser crosses the Heat Efficiency of 31; the medium lasers after it are halved.
        expect(fighter.getBattleValueLog()).toContain("Weapon Battle Rating 915.00");
    });

    it("drops the ammunition penalty with CASE or a Clan chassis, and uses 1.1 for a conventional fighter (TM pp.302, 316)", () => {
        const fighter = thunderbird();
        fighter.setTech("clan");
        expect(fighter.getBattleValueLog()).not.toContain("no CASE");

        const buster = mechbuster();
        // Defensive (50 x 2.5 + 5 x 2) x 1.1 = 148.5; offensive 3 x 46 x 1.37 = 189.06: no heat halving on a
        // conventional fighter.
        expect(buster.getBattleValue()).toBe(338);
    });
});

describe("Fighter cost (TechManual pp.283-285)", () => {
    it("prices the 'Mechbuster's structure at 337,633 C-bills (TM p.277)", () => {
        const fighter = mechbuster();
        expect(fighter.getRemainingTonnage()).toBe(0);
        // 337,633.33 structural + 3 medium lasers at 40,000, x (1 + 50 / 200).
        expect(fighter.getCBillCost()).toBe(Math.round((337633.3333 + 120000) * 1.25));
        expect(fighter.getCBillCostLog()).toContain("Avionics (4,000 x 5 t): 20,000");
        expect(fighter.getCBillCostLog()).toContain("Subtotal 457,633");
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
