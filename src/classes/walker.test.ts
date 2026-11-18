import { describe, expect, it } from "vitest";
import Walker, { normalizeWalkerExport } from "./walker";
import {
    WALKER_EDITION_RULES,
    WALKER_LOCATIONS,
    WalkerLocation,
    getWalkerSlotCount,
    getWalkerStructure,
    getWalkerTurret,
    walkerStructureTable,
} from "../data/walker-construction";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { mechEngineOptions } from "../data/mech-engine-options";
import { buildWalker as build } from "../test-support/builders";

// Clell Flint's walkers (#172), Chunk A of docs/superpowers/plans/2026-11-13-future-wars-walkers.md. Every table value
// below was read on the page images: Best-of pp.36-38 (PDF 45-47) and Future Wars #11 pp.25-27.

describe("Walker structure table (Best-of p.37, #11 p.26)", () => {
    // [tons, center torso, other torsos, legs, control section]
    const printed: [number, number, number, number, number][] = [
        [10, 1, 2, 1, 2], [15, 2, 2, 2, 2], [20, 3, 3, 3, 3], [25, 4, 4, 4, 4], [30, 5, 5, 5, 5],
        [35, 6, 6, 6, 6], [40, 6, 7, 6, 7], [45, 7, 8, 7, 8], [50, 8, 10, 8, 10], [55, 9, 11, 9, 11],
        [60, 10, 12, 10, 12], [65, 10, 13, 10, 13], [70, 11, 14, 11, 14], [75, 12, 15, 12, 15], [80, 13, 15, 13, 15],
        [85, 14, 16, 14, 16], [90, 15, 17, 15, 17], [95, 16, 18, 16, 18], [100, 17, 19, 17, 19],
    ];

    it("has every printed row", () => {
        expect(walkerStructureTable.map((row) => row.tons)).toEqual(printed.map((row) => row[0]));
    });

    it.each(printed)("%i tons: CT %i, other torsos %i, legs %i, control %i", (tons, ct, torso, leg, control) => {
        const walker = build(tons, 1);
        expect(walker.getStructure("ct")).toBe(ct);
        for (const location of ["ft", "rrt", "lt", "rt"] as WalkerLocation[]) expect(walker.getStructure(location)).toBe(torso);
        for (const location of ["lfl", "rfl", "lrl", "rrl"] as WalkerLocation[]) expect(walker.getStructure(location)).toBe(leg);
        expect(walker.getStructure("cs")).toBe(control);
        expect(getWalkerStructure("cs", tons)).toBe(control);
    });

    it.each(printed.map((row) => row[0]))("%i tons: structure weighs 10 percent", (tons) => {
        expect(build(tons, 1).getStructureWeight()).toBeCloseTo(tons / 10, 6);
    });

    it("allows at most twice the structure in armor in every location, the control section included", () => {
        const walker = build(50, 4);
        for (const location of WALKER_LOCATIONS) {
            expect(walker.getMaxArmor(location)).toBe(walker.getStructure(location) * 2);
            walker.setArmor(location, 999);
            expect(walker.getArmor(location)).toBe(walker.getStructure(location) * 2);
        }
        expect(walker.getMaxArmor()).toBe(WALKER_LOCATIONS.reduce((sum, location) => sum + walker.getStructure(location) * 2, 0));
    });
});

describe("Walker critical slots", () => {
    it("standard rules: six in each leg and outer torso, twelve in the center torso and control section", () => {
        for (const tons of [10, 50, 100]) {
            for (const location of WALKER_LOCATIONS) {
                const expected = location === "ct" || location === "cs" ? 12 : 6;
                expect(getWalkerSlotCount(location, tons, false, "best-of-1991")).toBe(expected);
                expect(getWalkerSlotCount(location, tons, false, "future-wars-11")).toBe(expected);
            }
        }
    });

    // [tons, leg, outer torso, center torso, control (Best-of), control (#11)]
    it.each([
        [10, 6, 6, 8, 7, 7], [35, 6, 6, 8, 7, 7],
        [40, 8, 8, 10, 8, 8], [55, 8, 8, 10, 8, 8],
        [60, 10, 10, 12, 12, 12], [75, 10, 10, 12, 12, 12],
        [80, 12, 12, 14, 14, 16], [100, 12, 12, 14, 14, 16],
    ])("variant, %i tons: legs %i, outer torsos %i, center torso %i, control %i (Best-of) / %i (#11)", (tons, leg, torso, ct, bestOf, issue11) => {
        for (const edition of ["best-of-1991", "future-wars-11"] as const) {
            expect(getWalkerSlotCount("lfl", tons, true, edition)).toBe(leg);
            expect(getWalkerSlotCount("rrl", tons, true, edition)).toBe(leg);
            for (const location of ["ft", "rrt", "lt", "rt"] as WalkerLocation[]) expect(getWalkerSlotCount(location, tons, true, edition)).toBe(torso);
            expect(getWalkerSlotCount("ct", tons, true, edition)).toBe(ct);
        }
        expect(getWalkerSlotCount("cs", tons, true, "best-of-1991")).toBe(bestOf);
        expect(getWalkerSlotCount("cs", tons, true, "future-wars-11")).toBe(issue11);
    });

    it("reads the variant from a ticked Future Wars construction ruleset, either printing", () => {
        const walker = build(80, 4);
        expect(walker.usesVariantSlots()).toBe(false);
        expect(walker.getSlots("cs")).toHaveLength(12);
        walker.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, ["future-wars-11-construction"]);
        expect(walker.usesVariantSlots()).toBe(true);
        expect(walker.getSlots("cs")).toHaveLength(14);
        walker.setEdition("future-wars-11");
        expect(walker.getSlots("cs")).toHaveLength(16);
        walker.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, ["sample-no-clans"]);
        expect(walker.usesVariantSlots()).toBe(false);
    });

    it("places the legs as 'Mech legs", () => {
        const walker = build(50, 4);
        for (const leg of ["lfl", "rfl", "lrl", "rrl"] as WalkerLocation[]) {
            expect(walker.getSlots(leg)).toEqual(["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", null, null]);
            expect(walker.getFreeSlots(leg)).toBe(2);
        }
    });

    it("standard rules: the control section is laid out as a 'Mech head, the center torso as a 'Mech's", () => {
        const walker = build(50, 4);
        expect(walker.getSlots("cs")).toEqual(["Life Support", "Sensors", "Cockpit", null, "Sensors", "Life Support", null, null, null, null, null, null]);
        expect(walker.getSlots("ct")).toEqual([
            "Standard Fusion", "Standard Fusion", "Standard Fusion", "Standard Gyro", "Standard Gyro", "Standard Gyro", "Standard Gyro",
            "Standard Fusion", "Standard Fusion", "Standard Fusion", null, null,
        ]);
    });

    it("variant: the control section holds the class's cockpit, life support and two sensors (as the Compact head)", () => {
        const light = build(25, 6, true);
        expect(light.getSlots("cs")).toEqual(["Life Support", "Sensors", "Sensors", "Cockpit", null, null, null]);
        expect(light.getCockpitWeight()).toBe(2);
        const assault = build(100, 3, true);
        expect(assault.getSlots("cs").slice(0, 6)).toEqual(["Life Support", "Life Support", "Sensors", "Sensors", "Cockpit", "Cockpit"]);
        expect(assault.getCockpitWeight()).toBe(4);
        const heavy = build(70, 4, true);
        expect(heavy.getCockpitWeight()).toBe(3);
        heavy.setLargeCockpit(true);
        expect(heavy.getCockpitWeight()).toBe(4);
        expect(heavy.getSlots("cs").filter((slot) => slot === "Cockpit")).toHaveLength(2);
        expect(build(50, 4).getCockpitWeight()).toBe(3);
    });

    it("variant: extra sensors and extra life support are a control section slot and half a ton each", () => {
        const walker = build(50, 4, true);
        const before = walker.getWeight();
        walker.setExtraSensors(true);
        walker.setExtraLifeSupport(true);
        expect(walker.getWeight()).toBeCloseTo(before + 1, 6);
        expect(walker.getSlots("cs")).toEqual(["Life Support", "Life Support", "Sensors", "Sensors", "Sensors", "Cockpit", null, null]);
    });

    it("variant: engine center-torso slots by engine weight, gyro one slot a ton", () => {
        const walker = build(50, 4, true); // rating 200: 8.5 tons, 6 slots; gyro 2 tons, 2 slots
        expect(walker.getSlots("ct")).toEqual([
            "Standard Fusion", "Standard Fusion", "Standard Fusion", "Standard Gyro", "Standard Gyro",
            "Standard Fusion", "Standard Fusion", "Standard Fusion", null, null,
        ]);
        walker.setGyroType("heavy-duty");
        expect(walker.getSlots("ct").filter((slot) => slot === "Heavy Duty Gyro")).toHaveLength(4);
    });

    it("puts an engine's side-torso slots in the left and right torsos (NGCFells's)", () => {
        const walker = build(50, 4);
        walker.setEngineType("xl");
        // Count the engine's slots: since Chunk B the heat sinks the engine cannot hold are placed too.
        const engine = (location: WalkerLocation) => walker.getSlots(location).filter((slot) => slot === walker.getEngineName());
        expect(engine("lt")).toHaveLength(3);
        expect(engine("rt")).toHaveLength(3);
        expect(engine("ft")).toHaveLength(0);
        expect(engine("rrt")).toHaveLength(0);
    });
});

describe("Walker turret (Best-of p.36)", () => {
    it("standard rules: 2 slots and 3 tons; variant: 1/2, 2/3, 3/4.5, 4/6 by class", () => {
        expect(getWalkerTurret(30, false)).toEqual({ slots: 2, tons: 3 });
        expect(getWalkerTurret(100, false)).toEqual({ slots: 2, tons: 3 });
        expect(getWalkerTurret(35, true)).toEqual({ slots: 1, tons: 2 });
        expect(getWalkerTurret(40, true)).toEqual({ slots: 2, tons: 3 });
        expect(getWalkerTurret(75, true)).toEqual({ slots: 3, tons: 4.5 });
        expect(getWalkerTurret(80, true)).toEqual({ slots: 4, tons: 6 });
    });

    it("sits in the control section and weighs in", () => {
        const walker = build(75, 4, true);
        const before = walker.getWeight();
        walker.setTurret(true);
        expect(walker.hasTurret()).toBe(true);
        expect(walker.getWeight()).toBeCloseTo(before + 4.5, 6);
        expect(walker.getSlots("cs").filter((slot) => slot === "Turret")).toHaveLength(3);
        expect(walker.getWeightLog().some((line) => line.name === "Turret" && line.weight === 4.5)).toBe(true);
    });
});

describe("Walker engine, movement and gyro", () => {
    it("rates the engine on the biped Walking MP and weighs it from the 'Mech engine table", () => {
        const walker = build(60, 5);
        expect(walker.getWalkMP()).toBe(5);
        expect(walker.getEngineRating()).toBe(300);
        const row = mechEngineOptions.find((option) => option.rating === 300)!;
        expect(walker.getEngineWeight()).toBe(row.weight.standard);
        walker.setEngineType("xl");
        expect(walker.getEngineWeight()).toBe(row.weight.xl);
    });

    // Best-of p.37: "multiply by 1.25, dropping fractions of .25 and rounding up the rest".
    it.each([[1, 1], [2, 3], [3, 4], [4, 5], [5, 6], [6, 8], [7, 9], [8, 10], [9, 11], [10, 13]])(
        "biped Walking MP %i gives a walker %i", (walk, walker) => {
            const unit = build(20, walk);
            expect(unit.getWalkerWalkMP()).toBe(walker);
            expect(unit.getRunMP()).toBe(Math.ceil(walker * 1.5));
        });

    it("refuses an engine over rating 400", () => {
        const walker = build(100, 4);
        expect(walker.setWalkMP(5)).toBe(false);
        expect(walker.getWalkMP()).toBe(4);
    });

    it("weighs and places the gyro as on a 'Mech", () => {
        const walker = build(50, 5); // rating 250: 3 tons
        expect(walker.getGyroWeight()).toBe(3);
        walker.setGyroType("compact");
        expect(walker.getGyroWeight()).toBe(4.5);
        expect(walker.getSlots("ct").filter((slot) => slot === "Compact Gyro")).toHaveLength(2);
        walker.setGyroType("xl");
        expect(walker.getGyroWeight()).toBe(1.5);
    });

    it("weighs a whole walker", () => {
        const walker = build(50, 4);
        expect(walker.getWeightLog().map((line) => [line.name, line.weight])).toEqual([
            ["Internal Structure", 5], ["Engine", 8.5], ["Gyro", 2], ["Cockpit", 3],
        ]);
        walker.setArmor("ct", 16);
        expect(walker.getWeight()).toBe(19.5);
        expect(walker.getRemainingWeight()).toBe(30.5);
    });

    it("offers engines and gyros by tech base", () => {
        const walker = build(50, 4);
        expect(walker.getEngineTypeOptions()).toEqual(expect.arrayContaining(["standard", "xl", "light", "compact"]));
        expect(walker.getEngineTypeOptions()).not.toContain("clan_xl");
        expect(walker.setEngineType("clan_xl")).toBe(false);
        walker.setTechTag("clan");
        expect(walker.getTechTag()).toBe("clan");
        expect(walker.getEngineTypeOptions()).toContain("clan_xl");
        expect(walker.getGyroTypeOptions()).toEqual(["standard"]);
    });
});

// NGCFells's ruling, 2026-11-14: industrial walkers are allowed ("probably the first place the tech would have been used").
// Flint gives none: ours, inspired by his walker rules and the IndustrialMech rules (TechManual pp.66-71).
describe("Industrial walkers (NGCFells's)", () => {
    const industrial = (tons: number, walk: number, variant = false): Walker => {
        const walker = build(tons, walk, variant);
        walker.setIndustrial(true);
        return walker;
    };

    it("keeps Flint's structure points and weighs industrial structure at 20 percent", () => {
        const walker = industrial(50, 4);
        expect(walker.isIndustrial()).toBe(true);
        expect(walker.getStructure("ct")).toBe(8);
        expect(walker.getStructure("cs")).toBe(10);
        expect(walker.getStructureWeight()).toBe(10);
        expect(walker.getWeightLog()[0]).toEqual({ name: "Industrial Internal Structure", weight: 10 });
    });

    it("offers the IndustrialMech engines and the standard gyro only", () => {
        const walker = industrial(50, 4);
        expect(walker.getEngineTypeOptions()).toEqual(["standard", "ice", "cell", "fission"]);
        expect(walker.getGyroTypeOptions()).toEqual(["standard"]);
        expect(walker.setEngineType("xl")).toBe(false);
        expect(walker.setEngineType("ice")).toBe(true);
        expect(walker.getEngineWeight()).toBe(17);
        walker.setTechTag("clan");
        expect(walker.getEngineTypeOptions()).toEqual(["standard", "ice", "cell"]);
    });

    it("a BattleMech walker takes no ICE, fuel cell or fission engine", () => {
        const walker = build(50, 4);
        for (const tag of ["ice", "cell", "fission"]) expect(walker.setEngineType(tag)).toBe(false);
    });

    it("variant: an ICE takes center-torso slots by its weight", () => {
        const heavy = industrial(60, 4, true);
        heavy.setEngineType("ice"); // rating 240, 23 tons: 9 slots, gyro 3: the heavy 12-slot center torso is full
        expect(heavy.getSlots("ct").filter((slot) => slot === "Internal Combustion Engine")).toHaveLength(9);
        expect(heavy.getFreeSlots("ct")).toBe(0);
        expect(heavy.getIssues()).toEqual([]);
        const medium = industrial(50, 4, true);
        medium.setEngineType("ice"); // 17 tons: 9 slots, gyro 2, in a 10-slot center torso
        expect(medium.getIssues()).toContain("Center Torso needs 11 slots for its fixed items and has 10.");
    });

    it("mounts the IndustrialMech cockpit, with Advanced Fire Control as an option", () => {
        const walker = industrial(50, 4);
        expect(walker.getCockpitName()).toBe("IndustrialMech Cockpit");
        expect(walker.getCockpitWeight()).toBe(3);
        expect(walker.hasAdvancedFireControl()).toBe(false);
        walker.setAdvancedFireControl(true);
        expect(walker.getCockpitName()).toBe("IndustrialMech Cockpit (Advanced Fire Control)");
        expect(walker.getCockpitWeight()).toBe(3);
        expect(build(50, 4).getCockpitName()).toBe("Cockpit");
        expect(industrial(25, 4, true).getCockpitWeight()).toBe(2);
    });

    it("keeps a BattleMech engine and gyro when switched to industrial, and reports them", () => {
        const walker = build(50, 4);
        walker.setEngineType("xl");
        walker.setGyroType("compact");
        walker.setIndustrial(true);
        expect(walker.getEngineType()).toBe("xl");
        expect(walker.getGyroType()).toBe("compact");
        const issues = walker.getIssues().join(" ");
        expect(issues).toMatch(/XL Fusion is not available to an industrial walker/);
        expect(issues).toMatch(/Compact Gyro is not available to an industrial walker/);
    });

    it("credits Flint with 'Inspired by' and names the IndustrialMech rules", () => {
        const walker = industrial(50, 4);
        expect(walker.getCredit()).toMatch(/Industrial walker: ours\. Inspired by Clell Flint's walker rules and the IndustrialMech rules \(TechManual pp\.66-71\)/);
        expect(build(50, 4).getCredit()).not.toMatch(/Industrial/);
    });

    it("round-trips, and an older save loads as a BattleMech walker", () => {
        const walker = industrial(60, 4);
        walker.setEngineType("fission");
        walker.setAdvancedFireControl(true);
        const copy = new Walker(walker.exportJSON());
        expect(copy.export()).toEqual(walker.export());
        expect(copy.isIndustrial()).toBe(true);
        expect(copy.hasAdvancedFireControl()).toBe(true);
        expect(JSON.parse(build(60, 4).exportJSON()).industrial).toBeUndefined();
        expect(new Walker(build(60, 4).exportJSON()).isIndustrial()).toBe(false);
    });
});

describe("Walker tonnage, rules level, editions and saves", () => {
    it("refuses tonnage off the structure table", () => {
        const walker = new Walker();
        for (const tons of [5, 105, 52, NaN]) expect(walker.setTons(tons)).toBe(false);
        expect(walker.setTons(10)).toBe(true);
        expect(walker.setTons(100)).toBe(true);
        expect(walker.getTons()).toBe(100);
    });

    it("is Custom Homebrew", () => {
        expect(new Walker().getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("defaults to the Best-of and credits the edition in use", () => {
        const walker = new Walker();
        expect(walker.getEdition()).toBe("best-of-1991");
        expect(walker.getCredit()).toMatch(/Clell Flint, Future Wars #11; reprinted in The Best of Future Wars, Volume One \(1991\)/);
        walker.setEdition("future-wars-11");
        expect(walker.getEditionRules()).toBe(WALKER_EDITION_RULES["future-wars-11"]);
        expect(walker.getCredit()).toMatch(/Future Wars #11 printing/);
    });

    it("reports an over-weight design", () => {
        const walker = build(10, 1);
        for (const location of WALKER_LOCATIONS) walker.setArmor(location, 999);
        walker.setTurret(true);
        expect(walker.getIssues().join(" ")).toMatch(/over the 10-ton limit/);
    });

    it("round-trips a save", () => {
        const walker = build(80, 4, true);
        walker.setName("Strider");
        walker.setEdition("future-wars-11");
        walker.setEngineType("light");
        walker.setGyroType("heavy-duty");
        walker.setTurret(true);
        walker.setExtraSensors(true);
        walker.setArmor("cs", 20);
        walker.setArmor("rfl", 7);
        const copy = new Walker(walker.exportJSON());
        expect(copy.export()).toEqual(walker.export());
        expect(copy.getImportIssues()).toEqual([]);
        expect(copy.usesVariantSlots()).toBe(true);
        expect(copy.getSlots("cs")).toHaveLength(16);
    });

    it("loads a save with no edition as the Best-of", () => {
        const saved = JSON.parse(build(40, 5).exportJSON());
        delete saved.edition;
        expect(new Walker(JSON.stringify(saved)).getEdition()).toBe("best-of-1991");
    });

    it("normalizeWalkerExport rejects junk and reports each clamp", () => {
        for (const junk of [null, 7, "walker", [], {}, { tons: "50", armor: {} }]) {
            expect(normalizeWalkerExport(junk).walker).toBeNull();
        }
        const saved = JSON.parse(build(50, 4).exportJSON());
        const { walker, issues } = normalizeWalkerExport({
            ...saved, tons: 105, walkMP: 9, edition: "future-wars-99", engineType: "warp-drive", gyroType: "none",
            armor: { ...saved.armor, ct: 500, zz: 3 },
        });
        expect(walker).not.toBeNull();
        expect(walker!.tons).toBe(100);
        expect(walker!.walkMP).toBe(4);
        expect(walker!.edition).toBe("best-of-1991");
        expect(walker!.engineType).toBe("standard");
        expect(walker!.gyroType).toBe("standard");
        expect(walker!.armor.ct).toBe(34);
        expect(issues).toHaveLength(6);
        expect(issues.join(" ")).toMatch(/Tonnage 105/);
        expect(issues.join(" ")).toMatch(/Walking MP 9/);
        expect(issues.join(" ")).toMatch(/future-wars-99/);
        expect(issues.join(" ")).toMatch(/warp-drive/);
        expect(issues.join(" ")).toMatch(/none/);
        expect(issues.join(" ")).toMatch(/Center Torso armor 500/);
    });
});
