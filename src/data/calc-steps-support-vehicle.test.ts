import { describe, expect, it } from "vitest";
import Vehicle from "../classes/vehicle";
import { findCalcDefProblems } from "./calc-steps";
import { SUPPORT_VEHICLE_BV2_STEPS, SUPPORT_VEHICLE_COST_STEPS } from "./calc-steps-support-vehicle";

// The CellCo Ranger APC of TM p.308: 17 tons, wheeled, Cruise 3, 38 points of BAR 7, a turret machine gun and a half
// ton of ammunition, no fire control.
const ranger = (): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType("wheeled");
    vehicle.setSupportVehicle(true);
    vehicle.setHasTurret(true);
    vehicle.setTonnage(17);
    vehicle.setCruiseMP(3);
    vehicle.setBAR(7);
    vehicle.setSupportVehicleTechRating("armor", "d");
    for (const [location, points] of [["front", 10], ["left", 8], ["right", 8], ["rear", 6], ["turret", 6]] as const) {
        vehicle.setArmorAllocation(location, points);
    }
    vehicle.addEquipmentFromTag("machine-gun");
    vehicle.setEquipmentLocation(vehicle.getEquipmentList()[0].uuid!, "turret");
    vehicle.addEquipmentFromTag("ammo-machine-gun-standard");
    vehicle.getEquipmentList()[1].weight = 0.5;
    vehicle.setTonnage(17);
    return vehicle;
};

describe("Support Vehicle BV2 and cost as cited steps (TM pp.280-285, 307-308, 316)", () => {
    it("has clean definitions tables", () => {
        expect(findCalcDefProblems(SUPPORT_VEHICLE_BV2_STEPS)).toEqual([]);
        expect(findCalcDefProblems(SUPPORT_VEHICLE_COST_STEPS)).toEqual([]);
    });

    it("rates the CellCo Ranger through the Support Vehicle steps, every step cited", () => {
        const breakdown = ranger().getBattleValueBreakdown("total-warfare");
        expect(breakdown.result).toBe(91);
        for (const id of ["cv.bv2.def.armor.support", "cv.bv2.off.firecontrol"]) {
            expect(breakdown.steps.find((step) => step.id === id)?.status, id).toBe("cited");
        }
        for (const step of breakdown.steps) expect(SUPPORT_VEHICLE_BV2_STEPS[step.id], step.id).toBeDefined();
    });

    // TO:AUE pp.156-157: a tenth of the engine's weight; a Support Vehicle pays 10,000 a ton of engine (MegaMek's reading).
    it("sizes and prices a Support Vehicle's supercharger by its engine weight", () => {
        const vehicle = ranger();
        vehicle.addEquipmentFromTag("supercharger");
        const supercharger = vehicle.getEquipmentList().find((item) => item.variableFormula === "supercharger")!;
        expect(supercharger.cbills).toBe(Math.round(vehicle.getEngineWeight() * 10000));
    });

    it("prices a Support Vehicle as steps that add to its cost", () => {
        const vehicle = ranger();
        const breakdown = vehicle.getCostBreakdown("total-warfare");
        expect(breakdown.result).toBe(vehicle.getCBillCost());
        expect(breakdown.steps.map((step) => step.id)).toEqual(expect.arrayContaining(["sv.cost.chassis", "sv.cost.engine", "sv.cost.armor", "sv.cost.tech-rating", "sv.cost.final"]));
        for (const step of breakdown.steps) expect(SUPPORT_VEHICLE_COST_STEPS[step.id], step.id).toBeDefined();
        const rows = breakdown.steps.filter((step) => !["sv.cost.subtotal", "sv.cost.multiplier", "sv.cost.omni", "sv.cost.final"].includes(step.id));
        const subtotal = breakdown.steps.find((step) => step.id === "sv.cost.subtotal")!.value!;
        expect(rows.reduce((sum, step) => sum + (step.value ?? 0), 0)).toBeCloseTo(subtotal, 6);
        expect(breakdown.steps.find((step) => step.id === "sv.cost.chassis")?.cites).toEqual([{ source: "tm", page: "280" }]);
    });
});
