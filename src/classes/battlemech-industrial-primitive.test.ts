import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { getCockpitType } from "../data/mech-cockpit-types";

const build = (options: { tech?: string, era?: string, type?: string, tonnage?: number, walk?: number, structure?: string, engine?: string } = {}) => {
    const mech = new BattleMech();
    mech.setTech(options.tech ?? "is");
    mech.setEra(options.era ?? "dark-ages");
    if (options.type) mech.setMechType(options.type);
    mech.setTonnage(options.tonnage ?? 50);
    if (options.structure) mech.setInternalStructureType(options.structure);
    if (options.engine) mech.setEngineType(options.engine);
    mech.setWalkSpeed(options.walk ?? 3);
    return mech;
};
const offered = (list: { tag: string, available?: boolean }[]) => list.filter(item => item.available).map(item => item.tag);
const add = (mech: BattleMech, tag: string) => mech.addEquipmentFromTag(tag, mech.getTech().tag, "", false, undefined, "", false, [], undefined, undefined);
const weightOf = (mech: BattleMech, name: string) => mech.getWeightBreakdown().find(entry => entry.name === name)?.weight;

describe("IndustrialMech construction limits (TM pp.68-72)", () => {
    it("offers standard fusion, ICE, fuel cell and fission engines only (TM p.68)", () => {
        const mech = build({ structure: "industrial" });
        expect(offered(mech.getAvailableEngines(4))).toEqual(["standard", "ice", "cell", "fission"]);
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
        mech.setEngineType("xl");
        expect(mech.getChassisEquipmentViolations()).toEqual(["IndustrialMechs may use only standard fusion, ICE, fuel cell or fission engines."]);
        // A BattleMech keeps the wider choice.
        expect(offered(build().getAvailableEngines(2))).toContain("xl");
    });

    it("offers the standard gyro only (TM p.69)", () => {
        const mech = build({ structure: "industrial" });
        expect(offered(mech.getAvailableGyros(4))).toEqual(["standard"]);
        mech.setGyroType("heavy-duty");
        expect(mech.getChassisEquipmentViolations()).toEqual(["IndustrialMechs may use only standard gyros."]);
    });

    it("offers single heat sinks only (TM p.71)", () => {
        const mech = build({ structure: "industrial" });
        expect(offered(mech.getAvailableHeatSinks(4))).toEqual(["single"]);
        mech.setHeatSinksType("double");
        expect(mech.getChassisEquipmentViolations()).toEqual(["IndustrialMechs may use only single heat sinks."]);
    });

    it("offers standard jump jets only, and none without a fusion or fission engine (TM p.69)", () => {
        const mech = build({ structure: "industrial" });
        expect(offered(mech.getAvailableJumpJets(4))).toEqual(["standard"]);
        expect(mech.getMaxJumpSpeed()).toBe(3);
        mech.setJumpSpeed(3);
        expect(mech.getJumpSpeed()).toBe(3);
        mech.setEngineType("fission");
        expect(mech.getJumpSpeed()).toBe(3);
        // "None of the three IndustrialMechs ... employ fission or fusion engine types, so they may not mount jump jets."
        mech.setEngineType("ice");
        expect(mech.getMaxJumpSpeed()).toBe(0);
        expect(mech.getJumpSpeed()).toBe(0);
        expect(offered(mech.getAvailableJumpJets(4))).toEqual([]);
        mech.setEngineType("cell");
        expect(mech.getMaxJumpSpeed()).toBe(0);
        mech.setEngineType("standard");
        mech.setJumpSpeed(2);
        mech.setJumpJetType("improved");
        expect(mech.getChassisEquipmentViolations()).toEqual(["IndustrialMechs may use only standard jump jets."]);
    });

    it("keeps MASC and Triple-Strength Myomer off IndustrialMechs, and Industrial TSM off BattleMechs (TM p.70)", () => {
        const industrial = build({ structure: "industrial" });
        expect(offered(industrial.getAvailableMyomerTypes(4))).toEqual(["standard", "industrial-tsm"]);
        expect(offered(build().getAvailableMyomerTypes(2))).toEqual(["standard", "tsm"]);
        // "Clan-made IndustrialMechs do not have access to Industrial TSM."
        expect(offered(build({ structure: "industrial", tech: "clan" }).getAvailableMyomerTypes(4))).toEqual(["standard"]);

        industrial.setMyomerType("tsm");
        expect(industrial.getChassisEquipmentViolations()).toEqual(["Triple-Strength Myomer cannot be mounted on an IndustrialMech."]);
        industrial.setMyomerType("standard");
        add(industrial, "masc");
        expect(industrial.getChassisEquipmentViolations()).toEqual(["MASC cannot be mounted on an IndustrialMech."]);

        const battlemech = build();
        battlemech.setMyomerType("industrial-tsm");
        expect(battlemech.getChassisEquipmentViolations()).toEqual(["Industrial Triple-Strength Myomer can only be mounted on an IndustrialMech."]);
    });
});

describe("Weight-free heat sinks by engine type (TM p.71)", () => {
    it("gives 0 with an ICE, 1 with a fuel cell, 5 with fission and 10 with fusion", () => {
        const mech = build({ structure: "industrial" });
        const sinks = (engine: string) => {
            mech.setEngineType(engine);
            return [mech.getHeatSinks(), mech.getHeatSinksWeight(), mech.getHeatDissipation()];
        };
        expect(sinks("ice")).toEqual([0, 0, 0]);
        expect(sinks("cell")).toEqual([1, 0, 1]);
        expect(sinks("fission")).toEqual([5, 0, 5]);
        expect(sinks("standard")).toEqual([10, 0, 10]);
    });

    it("builds the book's CattleMaster: 25 tons, 100-rated ICE, one added heat sink inside the engine", () => {
        const mech = build({ structure: "industrial", tonnage: 25, walk: 4, engine: "ice" });
        expect(mech.getEngineRating()).toBe(100);
        expect(mech.getEngineWeight()).toBe(6);
        expect(mech.getGyroWeight()).toBe(1);
        expect(mech.getCockpitWeight()).toBe(3);
        // 20 tons after the structure, 14 after the engine, 13 after the gyro, 10 after the cockpit.
        expect(mech.getRemainingTonnage()).toBe(10);
        mech.setAdditionalHeatSinks(1);
        expect(mech.getHeatSinks()).toBe(1);
        expect(mech.getRemainingTonnage()).toBe(9);
        // "Engine Rating 100 / 25 = 4 critical-free sinks".
        expect(mech.getEngineHeatSinkCapacity()).toBe(4);
        expect(mech.getHeatSinkCriticalRequirements().number).toBe(0);
    });

    it("builds the book's Buster and Uni engines", () => {
        // Buster: 50 tons, Walking 3, rating 150: ICE 11 tons, gyro 2, cockpit 3, 24 tons left.
        const buster = build({ structure: "industrial", tonnage: 50, walk: 3, engine: "ice" });
        expect([buster.getEngineWeight(), buster.getGyroWeight(), buster.getRemainingTonnage(), buster.getHeatSinks()]).toEqual([11, 2, 24, 0]);
        // Uni: 70 tons, Walking 3, rating 210: fuel cell 11 tons, gyro 3, cockpit 3, 39 tons left, 1 free sink.
        const uni = build({ structure: "industrial", tonnage: 70, walk: 3, engine: "cell" });
        expect([uni.getEngineWeight(), uni.getGyroWeight(), uni.getRemainingTonnage(), uni.getHeatSinks()]).toEqual([11, 3, 39, 1]);
    });

    it("places every sink the engine cannot hold, counting the weight-free ones", () => {
        // TM p.71: a 100-rated fuel cell with 5 added sinks has 6, of which 4 are in the engine and 2 take slots.
        const mech = build({ structure: "industrial", tonnage: 25, walk: 4, engine: "cell" });
        mech.setAdditionalHeatSinks(5);
        expect(mech.getHeatSinks()).toBe(6);
        expect(mech.getHeatSinkCriticalRequirements().number).toBe(2);
    });

    it("charges for every heat sink the engine does not give free", () => {
        const mech = build({ structure: "industrial", tonnage: 25, walk: 4, engine: "ice" });
        const none = mech.getCBillCostNumeric();
        mech.setAdditionalHeatSinks(2);
        // 2,000 C-bills each, times the IndustrialMech cost multiplier (1 + tonnage / 400).
        expect(mech.getCBillCostNumeric() - none).toBe(Math.round(2 * 2000 * (1 + 25 / 400)));
    });
});

describe("Power amplifiers on ICE and fuel cell 'Mechs (TM p.72)", () => {
    it("adds 10 percent of the energy weapon weight, rounded up to the half ton, with no slots", () => {
        // The CattleMaster: 2 small lasers (1 ton) need 0.5 tons of power amplifiers.
        const mech = build({ structure: "industrial", tonnage: 25, walk: 4, engine: "ice" });
        expect(mech.getPowerAmplifierWeight()).toBe(0);
        const before = mech.getRemainingTonnage();
        add(mech, "small-laser");
        add(mech, "small-laser");
        add(mech, "machine-gun");
        expect(mech.getPowerAmplifierWeight()).toBe(0.5);
        expect(weightOf(mech, "Power Amplifiers")).toBe(0.5);
        expect(mech.getRemainingTonnage()).toBe(before - 1 - 0.5 - 0.5);
        mech.setEngineType("cell");
        expect(mech.getPowerAmplifierWeight()).toBe(0.5);
    });

    it("costs 20,000 C-bills per ton of amplifier (TM pp.278-279)", () => {
        const mech = build({ structure: "industrial", tonnage: 25, walk: 4, engine: "fission" });
        add(mech, "small-laser");
        add(mech, "small-laser");
        expect(mech.getCBillCalcHTML()).not.toContain("Power Amplifiers");
        mech.setEngineType("ice");
        expect(mech.getCBillCalcHTML()).toContain("<strong>Power Amplifiers</strong><br /><span class=\"smaller-text\">20,000 x Amplifier Tonnage [0.5]</span></td><td>10,000</td>");
    });

    it("needs none with a fission or fusion engine", () => {
        const mech = build({ structure: "industrial", tonnage: 25, walk: 4, engine: "fission" });
        add(mech, "small-laser");
        expect(mech.getPowerAmplifierWeight()).toBe(0);
        mech.setEngineType("standard");
        expect(mech.getPowerAmplifierWeight()).toBe(0);
        expect(weightOf(mech, "Power Amplifiers")).toBeUndefined();
    });
});

describe("Dark Age armors on IndustrialMechs (IO:AE p.82)", () => {
    const darkAge = ["ballistic-reinforced", "heat-dissipating", "impact-resistant", "anti-penetrative-ablation"];
    const armor = (mech: BattleMech, rulesLevel: number) => offered(mech.getAvailableArmorTypes(rulesLevel)).filter(tag => darkAge.includes(tag)).sort();

    it("offers them only under Experimental Mixed-Tech rules", () => {
        // "IndustrialMechs may only mount these armor types under Experimental Mixed-Tech rules."
        expect(armor(build({ structure: "industrial", era: "ilClan" }), 4)).toEqual([]);
        expect(armor(build({ structure: "industrial", era: "ilClan", tech: "mis" }), 3)).toEqual([]);
        expect(armor(build({ structure: "industrial", era: "ilClan", tech: "mis" }), 4)).toEqual([...darkAge].sort());
        // A BattleMech has them at the Advanced level, as before.
        expect(armor(build({ era: "ilClan" }), 3)).toEqual([...darkAge].sort());
    });

    it("accepts one on a mixed-tech IndustrialMech, which then needs the Experimental rules level", () => {
        const mech = build({ structure: "industrial", era: "ilClan", tech: "mis" });
        expect(mech.setArmorType("heat-dissipating").tag).toBe("heat-dissipating");
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
        expect(mech.getRequiredRulesLevel()).toBe(4);
        // The industrial grades and Standard stay available.
        expect(offered(mech.getAvailableArmorTypes(4))).toEqual(expect.arrayContaining(["standard", "industrial", "commercial"]));
    });

    it("refuses one on an Inner Sphere IndustrialMech", () => {
        const mech = build({ structure: "industrial", era: "ilClan" });
        expect(mech.setArmorType("ballistic-reinforced").tag).toBe("standard");
        // Ferro-Fibrous and Stealth stay barred whatever the rules level (TM p.72).
        const mixed = build({ structure: "industrial", era: "ilClan", tech: "mis" });
        expect(mixed.setArmorType("ferro-fibrous").tag).toBe("standard");
        expect(offered(mixed.getAvailableArmorTypes(4))).not.toContain("ferro-fibrous");
    });
});

describe("Primitive BattleMechs (IO:AE pp.116-118)", () => {
    const mackie = () => {
        const mech = build({ era: "age-of-war", tonnage: 100, walk: 3 });
        mech.setPrimitive(true);
        return mech;
    };

    it("builds the book's Mackie: 100 tons, Walking 3, a 360-rated engine", () => {
        const mech = mackie();
        expect(mech.isPrimitive()).toBe(true);
        expect(mech.getWalkSpeed()).toBe(3);
        // "the rating is multiplied by 1.2 to give a final engine rating of 360 ... the weight is found to be 33 tons"
        expect(mech.getEngineRating()).toBe(360);
        expect(mech.getEngineWeight()).toBe(33);
        expect(mech.getInternalStructureWeight()).toBe(10);
        // "With a 360-rated engine, Charles' Mackie requires a 4-ton gyro."
        expect(mech.getGyroWeight()).toBe(4);
        expect(mech.getCockpitType()).toMatchObject({ tag: "primitive", weight: 5 });
        expect(mech.getCockpitWeight()).toBe(5);
        // 10 free sinks plus 7: 14 of the 17 sit in the engine (360 / 25), 3 take slots.
        mech.setAdditionalHeatSinks(7);
        expect(mech.getHeatSinks()).toBe(17);
        expect(mech.getEngineHeatSinkCapacity()).toBe(14);
        expect(mech.getHeatSinkCriticalRequirements().number).toBe(3);
        // "20 (armor tonnage) x 16 x 0.67 = 214.4, rounded down to 214"
        expect(mech.getArmorObj().tag).toBe("primitive");
        mech.setArmorWeight(20);
        expect(mech.getUnallocatedArmor()).toBe(214);
        // 100 - 10 structure - 33 engine - 4 gyro - 5 cockpit - 7 sinks - 20 armor.
        expect(mech.getRemainingTonnage()).toBe(21);
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
    });

    it("rounds the adjusted rating up to the next engine on the table", () => {
        // 55 tons x 4 = 220; x 1.2 = 264, which rounds up to 265.
        const mech = build({ era: "age-of-war", tonnage: 55, walk: 4 });
        mech.setPrimitive(true);
        expect(mech.getEngineRating()).toBe(265);
        expect(mech.getWalkSpeed()).toBe(4);
        // Leaving the Primitive rules restores the modern rating.
        mech.setPrimitive(false);
        expect(mech.getEngineRating()).toBe(220);
    });

    it("stops where the adjusted rating would pass 400", () => {
        const mech = mackie();
        expect(mech.getMaxWalkSpeed(4)).toBe(3);
        const light = build({ era: "age-of-war", tonnage: 20, walk: 4 });
        light.setPrimitive(true);
        // 20 tons: Walking 16 needs 384 -> 385; Walking 17 would need 408 -> 410.
        expect(light.getMaxWalkSpeed(4)).toBe(16);
    });

    it("offers primitive components only", () => {
        const mech = mackie();
        expect(offered(mech.getAvailableEngines(4))).toEqual(["standard", "ice", "cell", "fission"]);
        expect(offered(mech.getAvailableGyros(4))).toEqual(["standard"]);
        expect(offered(mech.getAvailableHeatSinks(4))).toEqual(["single"]);
        expect(offered(mech.getAvailableInternalStructures(4))).toEqual(["standard", "industrial"]);
        expect(offered(mech.getAvailableArmorTypes(4))).toEqual(["primitive"]);
        expect(offered(mech.getAvailableMyomerTypes(4))).toEqual(["standard"]);
        expect(mech.getAvailableCockpits(4).map(cockpit => [cockpit.tag, cockpit.available])).toEqual([["primitive", true]]);
    });

    it("applies the 1.2 multiplier to every engine type", () => {
        const mech = build({ era: "age-of-war", tonnage: 50, walk: 3 });
        mech.setPrimitive(true);
        expect(mech.getEngineRating()).toBe(180);
        const weights = ["standard", "ice", "cell", "fission"].map(engine => {
            mech.setEngineType(engine);
            return mech.getEngineWeight();
        });
        // The 180 row of the Master Engine Table (TM p.49).
        expect(weights).toEqual([7, 14, 8.5, 12.5]);
    });

    it("names the engine as a primitive one", () => {
        expect(mackie().getEngineName()).toBe("Primitive Fusion Engine");
        const mech = mackie();
        mech.setEngineType("ice");
        expect(mech.getEngineName()).toMatch(/^Primitive /);
    });

    it("replaces modern components when the Primitive rules are switched on", () => {
        const mech = build({ era: "dark-ages", tonnage: 50, walk: 4 });
        mech.setInternalStructureType("endo-steel");
        mech.setEngineType("xl");
        mech.setGyroType("xl");
        mech.setHeatSinksType("double");
        mech.setArmorType("ferro-fibrous");
        mech.setMyomerType("tsm");
        mech.setCockpitType("small");
        mech.setPrimitive(true);
        expect([
            mech.getInternalStructureType(), mech.getEngineType().tag, mech.getGyro().tag, mech.getHeatSinksType(),
            mech.getArmorObj().tag, mech.getMyomerType().tag, mech.getCockpitType().tag,
        ]).toEqual(["standard", "standard", "standard", "single", "primitive", "standard", "primitive"]);
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
    });

    it("is for Inner Sphere bipeds and quads of up to 100 tons, never an OmniMech", () => {
        expect(build({ type: "quad" }).canBePrimitive()).toBe(true);
        for (const type of ["tripod", "lam", "quadvee"]) {
            const mech = build({ type, tech: type === "quadvee" ? "clan" : "is" });
            expect(mech.canBePrimitive(), type).toBe(false);
            mech.setPrimitive(true);
            expect(mech.isPrimitive(), type).toBe(false);
        }
        expect(build({ tech: "clan" }).canBePrimitive()).toBe(false);
        expect(build({ tonnage: 150 }).canBePrimitive()).toBe(false);

        const omni = build();
        omni.toggleOmni();
        expect(omni.canBePrimitive()).toBe(false);

        const mech = mackie();
        mech.toggleOmni();
        expect(mech.isOmnimech).toBe(false);
        expect(mech.canBeOmniMech()).toBe(false);
    });

    it("reports a design that has stopped being Primitive-legal", () => {
        const mech = mackie();
        mech.setEngineType("xl");
        mech.setGyroType("xl");
        expect(mech.getChassisEquipmentViolations()).toEqual([
            "Primitive 'Mechs may use only ICE, fuel cell, fission or standard fusion engines.",
            "Primitive 'Mechs may use only standard gyros.",
        ]);
        mech.setEngineType("standard");
        mech.setGyroType("standard");
        mech.setTech("clan");
        expect(mech.getChassisEquipmentViolations()).toEqual(["Primitive 'Mechs can be built only with an Inner Sphere tech base."]);
        // The one armor type a Primitive 'Mech may mount cannot be swapped out.
        expect(mech.setArmorType("ferro-fibrous").tag).toBe("primitive");
    });

    it("keeps MASC and Superchargers off a Primitive 'Mech", () => {
        const mech = build({ era: "dark-ages", tonnage: 50, walk: 4 });
        mech.setPrimitive(true);
        add(mech, "masc");
        add(mech, "supercharger");
        expect(mech.getChassisEquipmentViolations()).toEqual([
            "MASC cannot be mounted on a Primitive 'Mech.",
            "Supercharger cannot be mounted on a Primitive 'Mech.",
        ]);
    });

    it("jumps only on a fusion or fission engine", () => {
        // Jump jets are a 2464 prototype, in production from 2471; the era check sees to the dates.
        const mech = build({ era: "age-of-war", tonnage: 50, walk: 3 });
        mech.setPrimitive(true);
        expect(mech.getMaxJumpSpeed()).toBe(3);
        mech.setEngineType("ice");
        expect(mech.getMaxJumpSpeed()).toBe(0);
        mech.setEngineType("fission");
        expect(mech.getMaxJumpSpeed()).toBe(3);
    });

    it("prices primitive musculature at 1,000 C-bills per ton and the cockpit as the standard one", () => {
        const mech = mackie();
        const log = mech.getCBillCalcHTML();
        expect(log).toContain("Primitive Musculature");
        expect(log).toContain("1,000 x Unit Tonnage [100]");
        expect(log).toContain("Primitive BattleMech Cockpit</strong></td><td>200,000");
        // The engine costs as a 360-rated standard fusion engine: 5,000 x 360 x 100 / 75.
        expect(log).toContain("Engine Rating [360]");
        expect(log).toContain("<td>2,400,000</td>");
    });

    it("is Advanced rules", () => {
        expect(mackie().getRequiredRulesLevel()).toBe(3);
        expect(build({ era: "age-of-war" }).getRequiredRulesLevel()).toBe(0);
    });

    it("survives a save and reload", () => {
        const mech = mackie();
        mech.setEngineType("fission");
        mech.setArmorWeight(20);
        const saved = mech.exportJSON();
        expect(JSON.parse(saved).features).toContain("primitive");
        const restored = new BattleMech(saved);
        expect(restored.isPrimitive()).toBe(true);
        expect(restored.getWalkSpeed()).toBe(3);
        expect(restored.getEngineRating()).toBe(360);
        expect(restored.getEngineType().tag).toBe("fission");
        expect(restored.getArmorObj().tag).toBe("primitive");
        expect(restored.getUnallocatedArmor()).toBe(214);
        expect(restored.getCockpitType().tag).toBe("primitive");
        // A modern design does not pick the flag up.
        expect(new BattleMech(build().exportJSON()).isPrimitive()).toBe(false);
    });
});

describe("Primitive IndustrialMechs (IO:AE pp.117-118)", () => {
    const workMech = () => {
        const mech = build({ era: "age-of-war", tonnage: 50, walk: 3, structure: "industrial" });
        mech.setPrimitive(true);
        return mech;
    };

    it("takes industrial structure at 20 percent, a 5-ton cockpit and Commercial armor", () => {
        const mech = workMech();
        expect(mech.isIndustrialMech()).toBe(true);
        expect(mech.getInternalStructureWeight()).toBe(10);
        expect(mech.getCockpitType()).toMatchObject({ tag: "primitive-industrial", weight: 5, cost: 100000 });
        expect(mech.getArmorObj().tag).toBe("commercial");
        expect(offered(mech.getAvailableArmorTypes(4))).toEqual(["commercial"]);
        // 16 x 1.5 = 24 points per ton.
        mech.setArmorWeight(2);
        expect(mech.getUnallocatedArmor()).toBe(48);
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
        // "Primitive IndustrialMechs may only mount Commercial armor."
        expect(mech.setArmorType("industrial").tag).toBe("commercial");
    });

    it("can add Advanced Fire Control, which doubles the cockpit cost and adds no weight", () => {
        const mech = workMech();
        expect(mech.getAvailableCockpits(4).map(cockpit => cockpit.tag)).toEqual(["primitive-industrial", "primitive-industrial-advanced-fire-control"]);
        expect(mech.hasAdvancedFireControl()).toBe(false);
        expect(mech.setCockpitType("primitive-industrial-advanced-fire-control")).toMatchObject({ weight: 5, cost: 200000 });
        expect(mech.hasAdvancedFireControl()).toBe(true);
        expect(getCockpitType("primitive-industrial-advanced-fire-control")).toMatchObject({ book: "IO:AE", page: 117 });
        const restored = new BattleMech(mech.exportJSON());
        expect(restored.getCockpitType().tag).toBe("primitive-industrial-advanced-fire-control");
    });

    it("switches armor and cockpit when the structure changes", () => {
        const mech = workMech();
        mech.setInternalStructureType("standard");
        expect([mech.getCockpitType().tag, mech.getArmorObj().tag]).toEqual(["primitive", "primitive"]);
        mech.setInternalStructureType("industrial");
        expect([mech.getCockpitType().tag, mech.getArmorObj().tag]).toEqual(["primitive-industrial", "commercial"]);
    });
});
