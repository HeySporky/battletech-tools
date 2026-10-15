import { describe, expect, it } from "vitest";
import {
    getSupportVehicleEngine, getSupportVehicleEngineWeight, getSupportVehicleGunners, getSupportVehicleItemSlots,
    getSupportVehicleMaxArmor, getSupportVehicleOfficers, getSupportVehicleRangeKm, getSupportVehicleStructureWeight,
    getSupportVehicleWeightClass, ISupportVehicleEngine, ISupportVehicleWeightClass, roundSupportVehicleWeight,
} from "./support-vehicle-construction";

const weightClass = (motive: Parameters<typeof getSupportVehicleWeightClass>[0], tons: number): ISupportVehicleWeightClass => {
    const row = getSupportVehicleWeightClass(motive, tons);
    if (!row) throw new Error(`no weight class for ${motive} at ${tons} t`);
    return row;
};
const engine = (tag: string): ISupportVehicleEngine => {
    const found = getSupportVehicleEngine(tag);
    if (!found) throw new Error(`no engine ${tag}`);
    return found;
};

describe("Support Vehicle construction (TM pp.116-139)", () => {
    it("sorts a Support Vehicle into its size class by motive and weight (Master Support Vehicle Weight Table, TM p.120)", () => {
        expect(weightClass("wheeled", 2.5)).toMatchObject({ size: "small", minTechRating: "a", baseChassisValue: 0.12, baseEngineValue: 0.0025 });
        expect(weightClass("vtol", 25)).toMatchObject({ size: "medium", minTechRating: "c", baseChassisValue: 0.25, baseEngineValue: 0.0025 });
        expect(weightClass("wheeled", 7)).toMatchObject({ size: "medium", baseChassisValue: 0.15, baseEngineValue: 0.0075 });
        expect(weightClass("wheeled", 80.5).size).toBe("large");
        // WiGE runs to 240 tons (errata v8.0, already in the 6th printing); Large Naval Vessels and Rail units are the
        // advanced Support Vehicles of TO:AUE (p.57).
        expect(weightClass("wige", 240).size).toBe("large");
        expect(weightClass("naval", 300.5)).toMatchObject({ size: "large", advanced: true, baseChassisValue: 0.17, baseEngineValue: 0.009 });
        expect(weightClass("rail", 600)).toMatchObject({ size: "large", advanced: true, baseChassisValue: 0.30, baseEngineValue: 0.005 });
        expect(getSupportVehicleWeightClass("naval", 100000.5)).toBeNull();
        expect(getSupportVehicleWeightClass("vtol", 60.5)).toBeNull();
    });

    it("gives 5 item slots plus 1 per 10 tons, rounded down (TM p.120)", () => {
        expect(getSupportVehicleItemSlots(2.5)).toBe(5);
        expect(getSupportVehicleItemSlots(22)).toBe(7);
        expect(getSupportVehicleItemSlots(45)).toBe(9);
    });

    it("rounds up to the kilogram on a Small Support Vehicle and to the half ton from 5 tons (TM p.123)", () => {
        expect(roundSupportVehicleWeight(0.496875, true)).toBe(0.497);
        expect(roundSupportVehicleWeight(0.3, true)).toBe(0.3);
        expect(roundSupportVehicleWeight(7.969, false)).toBe(8);
        expect(roundSupportVehicleWeight(1.5, false)).toBe(1.5);
    });

    it("computes the structure weight of the TM examples (TM p.125)", () => {
        // Simca: 0.12 x 1.0 (D) x 2,500 kg = 300 kg.
        expect(getSupportVehicleStructureWeight(weightClass("wheeled", 2.5), "d", [], 2.5)).toBe(0.3);
        // Swiftran: 0.25 x 0.85 (E) x 1.5 (Armored) x 25 = 7.969, up to 8.
        expect(getSupportVehicleStructureWeight(weightClass("vtol", 25), "e", ["armored"], 25)).toBe(8);
        // Hesiod: 0.15 x 0.85 (E) x 1.5 (Off-Road) x 1 (Omni) x 7 = 1.34, up to 1.5.
        expect(getSupportVehicleStructureWeight(weightClass("wheeled", 7), "e", ["off-road", "omni"], 7)).toBe(1.5);
        // 50-ton wheeled, Tech C, Amphibious and Armored: 22.64 tons, rounded up to 23 in the text (TM p.123).
        expect(getSupportVehicleStructureWeight(weightClass("wheeled", 50), "c", ["amphibious", "armored"], 50)).toBe(23);
    });

    it("computes the engine weight of the TM examples (TM p.128)", () => {
        // Simca: 0.0025 x 53 x 1.5 (D ICE) x 2,500 kg = 496.875, up to 497 kg.
        expect(getSupportVehicleEngineWeight(weightClass("wheeled", 2.5), engine("ice"), "d", 7, 2.5)).toBe(0.497);
        // Swiftran: 0.0025 x 125 x 1.3 (E ICE) x 25 = 10.156, up to 10.5.
        expect(getSupportVehicleEngineWeight(weightClass("vtol", 25), engine("ice"), "e", 11, 25)).toBe(10.5);
        // Hesiod: 0.0075 x 20 x 1.3 (E ICE) x 7 = 1.365, up to 1.5 (errata v8.0 corrects the printed 4 tons).
        expect(getSupportVehicleEngineWeight(weightClass("wheeled", 7), engine("ice"), "e", 4, 7)).toBe(1.5);
    });

    it("applies the minimum engine weights and the engines a Tech Rating cannot make (TM pp.126-127)", () => {
        const hover = weightClass("hover", 4.5);
        // A 4,500 kg hovervan's 600 kg engine is inflated to 20 percent of its weight, 900 kg (TM p.126).
        expect(getSupportVehicleEngineWeight(hover, engine("ice"), "f", 3, 4.5)).toBe(0.9);
        expect(getSupportVehicleEngineWeight(weightClass("wheeled", 20), engine("fission"), "d", 2, 20)).toBe(5);
        expect(getSupportVehicleEngineWeight(weightClass("wheeled", 20), engine("fusion"), "c", 2, 20)).toBe(5);
        expect(getSupportVehicleEngineWeight(weightClass("wheeled", 0.5), engine("fusion"), "f", 1, 0.5)).toBe(0.25);
        expect(getSupportVehicleEngineWeight(weightClass("wheeled", 20), engine("fusion"), "b", 2, 20)).toBeNull();
        expect(getSupportVehicleEngineWeight(weightClass("wheeled", 20), engine("ice"), "a", 2, 20)).toBeNull();
        // Errata v8.0: Steam at Tech Rating E is 2.6, ICE at B is 3.0.
        expect(engine("steam").multiplier.e).toBe(2.6);
        expect(engine("ice").multiplier.b).toBe(3.0);
    });

    it("finds the operating range from the fuel carried (TM pp.128-130)", () => {
        // Simca: 42 kg of fuel for a 497 kg ICE, 1 percent per 100 km: 845 km.
        expect(getSupportVehicleRangeKm(engine("ice"), 0.497, 0.042, false)).toBe(845);
        // Swiftran: 1 ton for a 10.5-ton ICE: 952 km.
        expect(getSupportVehicleRangeKm(engine("ice"), 10.5, 1, false)).toBe(952);
        // Hesiod: half a ton for a 1.5-ton alcohol ICE, 1.25 percent per 100 km: 2,666 km.
        expect(getSupportVehicleRangeKm(engine("ice"), 1.5, 0.5, true)).toBe(2666);
        // A 32-ton fuel cell needs 2.4 tons for 500 km (TM p.128): 2.5 tons goes a little further.
        expect(getSupportVehicleRangeKm(engine("fuel-cell"), 32, 2.5, false)).toBe(520);
        expect(getSupportVehicleRangeKm(engine("fusion"), 5, 0, false)).toBeNull();
    });

    it("caps armor at 4 plus a share of the tonnage by motive type (Support Vehicle Armor Table, TM p.134)", () => {
        expect(getSupportVehicleMaxArmor("vtol", 25)).toBe(29);
        expect(getSupportVehicleMaxArmor("wheeled", 7)).toBe(18);
        expect(getSupportVehicleMaxArmor("naval", 300)).toBe(104);
        // Errata v8.0 gives WiGE its own row, 0.5 a ton.
        expect(getSupportVehicleMaxArmor("wige", 50)).toBe(29);
    });

    it("counts gunners and officers (Support Vehicle Minimum Crew Table, TM p.131)", () => {
        expect(getSupportVehicleGunners("none", "d", 5)).toBe(3);
        expect(getSupportVehicleGunners("basic", "d", 1)).toBe(1);
        expect(getSupportVehicleGunners("advanced", "d", 8)).toBe(2);
        expect(getSupportVehicleGunners("advanced", "e", 8)).toBe(2);
        expect(getSupportVehicleGunners("advanced", "f", 13)).toBe(3);
        expect(getSupportVehicleGunners("basic", "d", 0)).toBe(0);
        expect(getSupportVehicleOfficers(3)).toBe(0);
        // The table's divisor is 6; the Dixon example divides by 5 (TM p.138).
        expect(getSupportVehicleOfficers(16)).toBe(3);
    });
});
