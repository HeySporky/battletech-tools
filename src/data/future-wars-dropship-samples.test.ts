import { describe, expect, it } from "vitest";
import SmallCraft from "../classes/small-craft";
import { getFwDropShipSamples } from "./future-wars-dropship-samples";
import { getDsJsFitTable, getSheetSamplesReadout, getVerificationTable } from "./future-wars-dropships-readout";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

/** Future Wars DropShips plan (#172), Task 5: the sample designs, every figure below read from the sheets and pages. */

const load = (id: string): SmallCraft => {
    const sample = getFwDropShipSamples().find((each) => each.id === id);
    if (!sample) throw new Error(`no sample ${id}`);
    return new SmallCraft(JSON.stringify(sample.save));
};
const weight = (craft: SmallCraft, prefix: string): number | undefined => craft.getWeights().find((entry) => entry.name.startsWith(prefix))?.weight;
const count = (craft: SmallCraft, name: string): number => craft.getEquipmentList?.().filter((item) => item.name === name).length ?? 0;

describe("Future Wars sample DropShips", () => {
    it("has the six sheet designs and the twelve verification builds, each with its method ticked", () => {
        const samples = getFwDropShipSamples();
        expect(samples.filter((sample) => sample.group === "sheet").map((sample) => sample.id))
            .toEqual(["pioneer-a", "pioneer-b", "pioneer-c", "union-12", "thunderwolf", "goliath-r"]);
        expect(samples.filter((sample) => sample.group === "canon")).toHaveLength(12);
        for (const sample of samples) {
            const craft = new SmallCraft(JSON.stringify(sample.save));
            expect(craft.getFwDropShipMethod(), sample.id).toBe(sample.method);
            expect(craft.getTonnage(), sample.id).toBe(sample.tonnage);
            expect(craft.getRequiredRulesLevel(), sample.id).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
            expect(craft.tro.export()?.text?.notes, sample.id).toContain("NOT OFFICIAL");
        }
    });

    it("builds Stock's Pioneer to his rule, with the sheet's 990-ton engine in its notes (FW #16 pp.34-36)", () => {
        for (const [id, crew, cargo] of [["pioneer-a", 35, 1240], ["pioneer-b", 15, 2355], ["pioneer-c", 55, 100]] as const) {
            const craft = load(id);
            expect(craft.getModel()).toBe(id.slice(-1).toUpperCase());
            expect(craft.getShape()).toBe("aerodyne");
            expect(craft.getSafeThrust()).toBe(3);
            expect(craft.getMaxThrust()).toBe(5);
            // 3,900 / (15 / 3), where the sheet prints 990.
            expect(craft.getEngineWeight()).toBe(780);
            // "Structural Integrity: 9 351 TONS".
            expect(craft.getStructureWeight()).toBe(351);
            expect(craft.getFuelTons()).toBe(180);
            expect(craft.getStrategicFuelPerDay()).toBe(2.98);
            expect(craft.getTotalArmorPoints()).toBe(480);
            expect(craft.getArmorAllocation()).toEqual({ nose: 110, left: 85, right: 85, aft: 200 });
            expect(craft.getCrew()).toBe(crew);
            expect(weight(craft, "Cargo")).toBe(cargo);
            expect(craft.tro.export()?.text?.notes).toContain("990 tons");
            expect(craft.tro.export()?.production?.manufacturer).toBe("Brigadier Corporation");
        }
        expect(load("pioneer-a").getEra().tag).toBe("late-sw-lt");
    });

    it("builds Reese's UNION-12 to his sheet (FW #36 p.19)", () => {
        const craft = load("union-12");
        expect(craft.getEngineWeight()).toBe(4286);
        expect(craft.getStructureWeight()).toBe(2515);
        expect(craft.getFuelTons()).toBe(10800);
        expect(craft.getFuelPoints()).toBe(43200);
        expect(craft.getBurnDays()).toBe(30);
        expect(craft.getControlsWeight()).toBe(25);
        expect(craft.getFreeHeatSinks()).toBe(126);
        expect(craft.getArmorTons()).toBe(53);
        expect(weight(craft, "Cargo")).toBe(964);
        expect(craft.getOfficers()).toBe(12);
        expect(craft.getCrew()).toBe(58);
        // His 166 tons of weapons and 21 of ammunition (p.17).
        const items = craft.getWeights().filter((entry) => entry.item);
        expect(items.reduce((total, entry) => total + entry.weight, 0)).toBe(187);
        expect(craft.getArcFireFactors("nose")?.factors).toBe(7);
    });

    it("builds the THUNDERWOLF and GOLIATH-R by Reese's rule, the sheets' own figures in their notes (FW #36 pp.20-21)", () => {
        const wolf = load("thunderwolf");
        expect(wolf.getMaxThrust()).toBe(3);
        expect(wolf.getStructureWeight()).toBe(12);
        // Four engines of 12.75 tons on the sheet: 404 / (16 / 2) is 50.5, split four ways and armored.
        expect(wolf.getEngineWeight()).toBe(51);
        expect(wolf.getControlsWeight()).toBe(3);
        expect(wolf.getArmorTons()).toBe(14);
        expect(wolf.getTotalHeatSinks()).toBe(37);
        expect(wolf.tro.export()?.text?.notes).toContain("108 tons, 7.5");
        const goliath = load("goliath-r");
        expect(goliath.getFuelTons()).toBe(7200);
        expect(goliath.getControlsWeight()).toBe(25);
        expect(goliath.getEra().tag).toBe("star-league");
        expect(goliath.tro.export()?.text?.notes).toContain("4,931");
        expect(goliath.getIssues(CUSTOM_HOMEBREW_RULES_LEVEL).some((issue) => issue.includes("armor points are allocated"))).toBe(true);
    });

    it("rebuilds the canon Leopard, Union and Overlord from DropShips and JumpShips (pp.38-43) under each method", () => {
        const leopard = load("leopard-eid");
        // 1,720 / (16 / 4) = 430; Eid's bridge 1,720 x 0.0075 = 12.9.
        expect(leopard.getEngineWeight()).toBe(430);
        expect(leopard.getControlsWeight()).toBe(12.9);
        expect(leopard.getArmorAllocation()).toEqual({ nose: 100, left: 90, right: 90, aft: 200 });
        expect(count(leopard, "PPC")).toBe(2);
        expect(count(leopard, "Large Laser")).toBe(5);
        expect(count(leopard, "Medium Laser")).toBe(7);
        expect(count(leopard, "LRM 20")).toBe(3);
        // Reese's 20 days at 1,440 / 10 = 144 tons a day.
        expect(load("leopard-reese").getFuelTons()).toBe(2880);
        expect(load("union-reese").getFuelTons()).toBe(4800);
        // Houseman: 17.2 tons a point of thrust; integrity 7 is 21% of 1,720.
        expect(load("leopard-houseman").getEngineWeight()).toBe(204);
        expect(load("leopard-houseman").getStructureWeight()).toBe(361.2);
        // Integrity 11, past his table: 33% of 3,500.
        expect(load("union-houseman").getStructureWeight()).toBe(1155);
        const overlord = load("overlord-stock");
        expect(count(overlord, "PPC")).toBe(6);
        expect(count(overlord, "Autocannon/20")).toBe(2);
        expect(count(overlord, "Autocannon/5")).toBe(6);
        expect(overlord.getBays().map((bay) => [bay.tag, bay.amount])).toEqual([["mech", 36], ["fighter", 6]]);
        // Stock's engine 9,700 / (15 / 3) = 1,940.
        expect(overlord.getEngineWeight()).toBe(1940);
        for (const sample of getFwDropShipSamples().filter((each) => each.group === "canon")) {
            expect(new SmallCraft(JSON.stringify(sample.save)).getCurrentTonnage(), sample.id).toBeGreaterThan(sample.tonnage);
        }
    });
});

describe("TRO - JBT: Future Wars DropShips, generated pages", () => {
    it("prints every DS&JS DropShip beside the formulae", () => {
        const table = getDsJsFitTable();
        // Leopard: 10 points a ton, 1.84, crew 9 (formula 1.2378 x 1,720^0.3211 = 13.5, so 14), 16 armor, bridge 13 / 9 = 1.4 (formula 1).
        expect(table).toContain("| Leopard | 39 | A | 1,720 | 10 | 1.84 | 9 / 14 | 16 | 1.4 / 1 |");
        expect(table).toContain("| Intruder | 49 | S | 3,000 | - / 6 |");
        expect(table.split("\n").filter((line) => line.startsWith("| ") && !line.startsWith("| Ship"))).toHaveLength(19);
    });

    it("weighs the verification builds as the creator does", () => {
        const table = getVerificationTable();
        const union = table.split("\n").find((line) => line.startsWith("| Union |"))!;
        const tonnage = (id: string) => load(id).getCurrentTonnage().toLocaleString("en-US");
        expect(union).toContain(`| ${tonnage("union-stock")} (+`);
        expect(union).toContain(`${tonnage("union-reese")} (+`);
    });

    it("gives each sheet design a page with its credit and notes", () => {
        const text = getSheetSamplesReadout();
        expect(text).toContain("## The Authors' Designs");
        for (const heading of ["### Pioneer A", "### Pioneer B", "### Pioneer C", "### UNION-12", "### THUNDERWOLF", "### GOLIATH-R"]) expect(text).toContain(heading);
        expect(text).toContain("*Mark Stock, Future Wars #16 (1990), pp.34-36.*");
        expect(text).toContain("*Mike Reese, Future Wars #36 (1993), p.21.*");
        expect(text).toContain("**Weighed by the rule:** 3,915.5 tons, 15.5 over");
    });
});
