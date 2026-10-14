import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { EXPERIMENTAL_RULES_LEVEL } from "../data/equipment-registry";
import { fractionalArmorTonsPerPoint, getFractionalArmorTonsPerPoint, getFractionalEngineWeight, roundUpToKilogram } from "../data/fractional-accounting";

// Fractional Accounting: Tactical Operations: Advanced Units & Equipment pp.188-189.

function fractionalMech(tonnage: number, walk: number): BattleMech {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-age");
    mech.setTonnage(tonnage);
    mech.setWalkSpeed(walk);
    mech.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL);
    return mech;
}

function addItem(mech: BattleMech, tag: string) {
    return mech.addEquipmentFromTag(tag, "is", "lt", false, undefined, "", false, [], undefined, undefined)!;
}

describe("Fractional Accounting tables (TO:AUE p.188)", () => {
    it("rounds figures up to the kilogram", () => {
        expect(roundUpToKilogram(9.8235)).toBe(9.824);
        expect(roundUpToKilogram(22.125)).toBe(22.125);
        expect(roundUpToKilogram(0.005)).toBe(0.005);
        expect(roundUpToKilogram(0)).toBe(0);
    });

    it("weighs a 350-rated light fusion engine at 22.125 tons, the book's example", () => {
        expect(getFractionalEngineWeight("light", 29.5)).toBe(22.125);
    });

    it("applies each engine type's multiplier to the standard fusion weight", () => {
        expect(getFractionalEngineWeight("standard", 29.5)).toBe(29.5);
        expect(getFractionalEngineWeight("compact", 29.5)).toBe(44.25);
        expect(getFractionalEngineWeight("xl", 29.5)).toBe(14.75);
        expect(getFractionalEngineWeight("clan_xl", 29.5)).toBe(14.75);
        expect(getFractionalEngineWeight("xxl", 29.5)).toBe(9.824);
        expect(getFractionalEngineWeight("ice", 29.5)).toBe(59);
        expect(getFractionalEngineWeight("cell", 29.5)).toBe(35.4);
        expect(getFractionalEngineWeight("fission", 29.5)).toBe(51.625);
    });

    it("keeps the engine minimums: 0.25 tons for fusion, 5 tons for fission", () => {
        expect(getFractionalEngineWeight("xxl", 0.5)).toBe(0.25);
        expect(getFractionalEngineWeight("xl", 0.5)).toBe(0.25);
        expect(getFractionalEngineWeight("fission", 0.5)).toBe(5);
    });

    it("leaves an engine type the table does not list at its standard weight", () => {
        expect(getFractionalEngineWeight("primitive", 29.5)).toBeNull();
    });

    it("uses the printed tons per point, and points per ton for armor the table does not list", () => {
        expect(getFractionalArmorTonsPerPoint("standard", "is", 16)).toBe(0.0625);
        expect(getFractionalArmorTonsPerPoint("ferro-fibrous", "is", 17.92)).toBe(0.0558);
        expect(getFractionalArmorTonsPerPoint("ferro-fibrous", "clan", 19.2)).toBe(0.0521);
        expect(getFractionalArmorTonsPerPoint("hardened", "is", 8)).toBe(0.125);
        expect(fractionalArmorTonsPerPoint["ballistic-reinforced"]).toBeUndefined();
        expect(getFractionalArmorTonsPerPoint("ballistic-reinforced", "is", 12)).toBeCloseTo(1 / 12, 10);
    });
});

describe("Fractional Accounting on a BattleMech (TO:AUE pp.188-189)", () => {
    it("is off by default and leaves standard weights alone", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("dark-age");
        mech.setTonnage(70);
        mech.setWalkSpeed(5);
        mech.setEngineType("light");

        expect(mech.usesFractionalAccounting()).toBe(false);
        expect(mech.getEngineWeight()).toBe(22.5);
        expect(mech.export().weight_accounting).toBeUndefined();
    });

    it("can only be turned on at the Experimental rules level, and makes the design Experimental", () => {
        const mech = new BattleMech();
        mech.setTech("is");

        expect(mech.canUseFractionalAccounting(2)).toBe(false);
        expect(mech.canUseFractionalAccounting(3)).toBe(false);
        expect(mech.setWeightAccounting("fractional", 3)).toBe("standard");
        expect(mech.setWeightAccounting("fractional")).toBe("standard");

        expect(mech.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL)).toBe("fractional");
        expect(mech.getRequiredRulesLevel()).toBeGreaterThanOrEqual(EXPERIMENTAL_RULES_LEVEL);

        // Turning it off needs no rules level.
        expect(mech.setWeightAccounting("standard", 0)).toBe("standard");
    });

    it("weighs engines by multiplier instead of the half-ton table", () => {
        const mech = fractionalMech(70, 5);
        mech.setEngineType("light");
        expect(mech.getEngineWeight()).toBe(22.125);
        mech.setEngineType("xl");
        expect(mech.getEngineWeight()).toBe(14.75);
        mech.setEngineType("standard");
        expect(mech.getEngineWeight()).toBe(29.5);
    });

    it("does not round internal structure to the half ton", () => {
        const mech = fractionalMech(55, 5);
        mech.setInternalStructureType("endo-steel");
        expect(mech.getInternalStructureWeight()).toBe(2.75);

        mech.setWeightAccounting("standard");
        expect(mech.getInternalStructureWeight()).toBe(3);
    });

    it("buys armor by the point at the Fractional Armor Table weight", () => {
        const mech = fractionalMech(55, 5);
        mech.setArmorType("ferro-fibrous");
        mech.setFractionalArmorPoints(152);

        // 152 points x 0.0558 tons = 8.4816, up to the kilogram.
        expect(mech.getArmorWeight()).toBe(8.482);
        expect(mech.getFractionalArmorPoints()).toBe(152);

        mech.setArmorType("standard");
        expect(mech.getFractionalArmorPoints()).toBe(152);
        expect(mech.getArmorWeight()).toBe(9.5);

        mech.setFractionalArmorPoints(1);
        expect(mech.getArmorWeight()).toBe(0.063);
    });

    it("never buys more armor than the chassis can carry", () => {
        const mech = fractionalMech(55, 5);
        mech.setFractionalArmorPoints(5000);
        expect(mech.getFractionalArmorPoints()).toBe(mech.getMaxArmor());
    });

    it("keeps the armor points when turned on, and rounds back to the half ton when turned off", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setTonnage(55);
        mech.setArmorWeight(9.5);

        mech.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL);
        expect(mech.getFractionalArmorPoints()).toBe(152);
        expect(mech.getArmorWeight()).toBe(9.5);

        mech.setFractionalArmorPoints(150);
        expect(mech.getArmorWeight()).toBe(9.375);

        mech.setWeightAccounting("standard");
        expect(mech.getArmorWeight()).toBe(9.5);
    });

    it("carries ammunition by the shot: 0.005 tons a machine gun shot, 0.04 tons an SRM 4 shot", () => {
        const mech = fractionalMech(55, 5);
        addItem(mech, "machine-gun");
        addItem(mech, "srm-4");
        const mgAmmo = addItem(mech, "ammo-machine-gun-standard");
        const srmAmmo = addItem(mech, "ammo-srm-standard");

        expect(mech.getAmmoBinShotsPerTon(mgAmmo)).toBe(200);
        expect(mech.getAmmoBinShotsPerTon(srmAmmo)).toBe(25);

        expect(mech.setAmmoBinShots(mgAmmo.uuid, 1)).toBe(1);
        expect(mgAmmo.weight).toBe(0.005);
        expect(mech.getAmmoBinCapacity(mgAmmo)).toBe(1);

        expect(mech.setAmmoBinShots(srmAmmo.uuid, 1)).toBe(1);
        expect(srmAmmo.weight).toBe(0.04);
        expect(mech.setAmmoBinShots(srmAmmo.uuid, 10)).toBe(10);
        expect(srmAmmo.weight).toBe(0.4);
        expect(mech.getAmmoBinCapacity(srmAmmo)).toBe(10);
    });

    it("holds a bin to one critical slot: from one shot to a full ton", () => {
        const mech = fractionalMech(55, 5);
        addItem(mech, "machine-gun");
        const mgAmmo = addItem(mech, "ammo-machine-gun-standard");

        expect(mech.setAmmoBinShots(mgAmmo.uuid, 5000)).toBe(200);
        expect(mgAmmo.weight).toBe(1);
        expect(mech.setAmmoBinShots(mgAmmo.uuid, 0)).toBe(1);
        expect(mgAmmo.weight).toBe(0.005);
    });

    it("counts every shot of every bin size back out of its weight", () => {
        const mech = fractionalMech(55, 5);
        addItem(mech, "machine-gun");
        addItem(mech, "srm-4");
        for (const bin of [addItem(mech, "ammo-machine-gun-standard"), addItem(mech, "ammo-srm-standard")]) {
            const shotsPerTon = mech.getAmmoBinShotsPerTon(bin);
            for (let shots = 1; shots <= shotsPerTon; shots++) {
                mech.setAmmoBinShots(bin.uuid, shots);
                expect(mech.getAmmoBinCapacity(bin)).toBe(shots);
            }
        }
    });

    it("does not set shots under standard accounting, and rounds bins up to the half ton when turned off", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setTonnage(55);
        addItem(mech, "machine-gun");
        const mgAmmo = addItem(mech, "ammo-machine-gun-standard");

        expect(mech.setAmmoBinShots(mgAmmo.uuid, 10)).toBe(0);
        expect(mgAmmo.weight).toBe(1);

        mech.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL);
        mech.setAmmoBinShots(mgAmmo.uuid, 10);
        expect(mgAmmo.weight).toBe(0.05);

        mech.setWeightAccounting("standard");
        expect(mgAmmo.weight).toBe(0.5);
    });

    it("totals weights to the kilogram", () => {
        const mech = fractionalMech(55, 5);
        mech.setEngineType("xxl");
        mech.setInternalStructureType("endo-steel");
        mech.setFractionalArmorPoints(101);

        const total = mech.getCurrentTonnage();
        expect(Math.round(total * 1000) / 1000).toBe(total);
        expect(mech.getRemainingTonnage()).toBe(Math.round((55 - total) * 1000) / 1000);
    });

    it("survives a save and load with its armor points and ammunition", () => {
        const mech = fractionalMech(55, 5);
        mech.setEngineType("light");
        mech.setArmorType("ferro-fibrous");
        mech.setFractionalArmorPoints(151);
        addItem(mech, "machine-gun");
        const mgAmmo = addItem(mech, "ammo-machine-gun-standard");
        mech.setAmmoBinShots(mgAmmo.uuid, 37);

        const saved = mech.exportJSON();
        expect(JSON.parse(saved).weight_accounting).toBe("fractional");

        const loaded = new BattleMech(saved);
        expect(loaded.usesFractionalAccounting()).toBe(true);
        expect(loaded.getFractionalArmorPoints()).toBe(151);
        expect(loaded.getArmorWeight()).toBe(mech.getArmorWeight());
        expect(loaded.getEngineWeight()).toBe(mech.getEngineWeight());
        expect(loaded.getCurrentTonnage()).toBe(mech.getCurrentTonnage());
        const loadedAmmo = loaded.getInstalledEquipment().find(item => item.isAmmo)!;
        expect(loadedAmmo.weight).toBe(0.185);
        expect(loaded.getAmmoBinCapacity(loadedAmmo)).toBe(37);
    });

    it("loads a design saved before the option existed as standard accounting", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setTonnage(55);
        mech.setArmorWeight(9.5);
        const saved = JSON.parse(mech.exportJSON());
        delete saved.weight_accounting;
        delete saved.fractional_armor_points;

        const loaded = new BattleMech(JSON.stringify(saved));
        expect(loaded.usesFractionalAccounting()).toBe(false);
        expect(loaded.getArmorWeight()).toBe(9.5);
    });
});
