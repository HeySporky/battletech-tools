import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import Vehicle from "../classes/vehicle";
import { importVehicleBlk } from "../classes/vehicle-blk";
import { findCalcDefProblems } from "./calc-steps";
import { VEHICLE_BV2_STEPS, VEHICLE_COST_STEPS, getVehicleBv1Steps, getVehicleCostSteps } from "./calc-steps-vehicle";
import { getVehiclePrintedRule, TURRET_WEAPON_ARC } from "./vehicle-printings";

const block = (tag: string, ...lines: string[]): string[] => [`<${tag}>`, ...lines, `</${tag}>`];

// The Hephaestus Scout Tank Prime of TM pp.99 and 308: 30 tons, Hover, Cruise 8, 96 armor points, a half-ton turret
// with two Clan medium pulse lasers and a TAG, an active probe and an ECM suite. Rebuilt from a MegaMek file's shape.
export const HEPHAESTUS_PRIME = [
    ...block("UnitType", "Tank"), ...block("Name", "Hephaestus Scout Tank"), ...block("Model", "Prime"), ...block("year", "3064"),
    ...block("type", "Clan Level 2"), ...block("motion_type", "Hover"), ...block("cruiseMP", "8"), ...block("engine_type", "0"),
    ...block("clan_engine", "false"), ...block("armor_type", "1"), ...block("armor_tech_level", "6"), ...block("omni", "1"),
    ...block("armor", "20", "20", "20", "18", "18"),
    ...block("Body Equipment", "CLActiveProbe", "CLECMSuite:OMNI"),
    ...block("Turret Equipment", "CLMediumPulseLaser:OMNI", "CLMediumPulseLaser:OMNI", "CLTAG:OMNI"),
    ...block("tonnage", "30.0"), ...block("baseChassisTurretWeight", "0.5"),
].join("\n");

const stepValue = (vehicle: Vehicle, id: string, edition = "total-warfare"): number | undefined =>
    vehicle.getBattleValueBreakdown(edition).steps.filter((step) => step.id === id).pop()?.value;

describe("Combat Vehicle BV2 as cited steps (TM pp.307-308, 316)", () => {
    it("has a clean definitions table", () => {
        expect(findCalcDefProblems(VEHICLE_BV2_STEPS)).toEqual([]);
    });

    it("works the Hephaestus Prime at every number TM p.308 prints", () => {
        const { vehicle } = importVehicleBlk(HEPHAESTUS_PRIME);
        const breakdown = vehicle!.getBattleValueBreakdown("total-warfare");
        // Defensive: 96 x 2.5 + 15 x 1.5 + 73 = 335.5, x 0.7 = 234.85, x 1.4 = 328.79.
        expect(stepValue(vehicle!, "cv.bv2.def.armor")).toBe(240);
        expect(stepValue(vehicle!, "cv.bv2.def.structure")).toBe(22.5);
        expect(stepValue(vehicle!, "cv.bv2.def.subtotal")).toBe(335.5);
        expect(stepValue(vehicle!, "cv.bv2.def.type")).toBeCloseTo(234.85, 2);
        expect(stepValue(vehicle!, "cv.bv2.def.rating")).toBeCloseTo(328.79, 2);
        // Offensive: 222 + 15 = 237, x 1.89 = 447.93.
        expect(stepValue(vehicle!, "cv.bv2.off.weight")).toBe(15);
        expect(stepValue(vehicle!, "cv.bv2.off.base")).toBe(237);
        expect(stepValue(vehicle!, "cv.bv2.off.speed")).toBe(1.89);
        expect(stepValue(vehicle!, "cv.bv2.off.rating")).toBeCloseTo(447.93, 2);
        expect(stepValue(vehicle!, "cv.bv2.final.sum")).toBeCloseTo(776.72, 2);
        expect(breakdown.result).toBe(777);
        expect(vehicle!.getBattleValue("total-warfare")).toBe(777);
    });

    it("emits only step ids the table defines, and cites TM page 307 for the turret step", () => {
        const { vehicle } = importVehicleBlk(HEPHAESTUS_PRIME);
        const steps = vehicle!.getBattleValueBreakdown("total-warfare").steps;
        for (const step of steps) expect(VEHICLE_BV2_STEPS[step.id], step.id).toBeDefined();
        const turret = steps.find((step) => step.id === "cv.bv2.off.weapon.turret");
        expect(turret?.cites.some((cite) => cite.source === "tm" && cite.page === "307")).toBe(true);
        expect(turret?.status).toBe("cited");
    });

    it("renders the log from the steps, with no provisional tail", () => {
        const { vehicle } = importVehicleBlk(HEPHAESTUS_PRIME);
        const log = vehicle!.getBattleValueLog("total-warfare");
        expect(log).toContain("TM p.307");
        expect(log).not.toContain("(provisional)<br");
    });

    it("rates the CellCo Ranger by the rule text through the Support Vehicle steps (TM pp.307-308, owner call 3)", () => {
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
        const armor = vehicle.getBattleValueBreakdown("total-warfare").steps.find((step) => step.id === "cv.bv2.def.armor.support");
        // Read and cited in the Support Vehicle round (calc-steps-support-vehicle.ts).
        expect(armor?.status).toBe("cited");
        expect(armor?.value).toBeCloseTo(66.5, 2);
        expect(stepValue(vehicle, "cv.bv2.def.rating")).toBeCloseTo(78.24, 2);
        expect(vehicle.getBattleValue("total-warfare")).toBe(91);
    });
});

describe("The turret weapon printing alternate (TM 3rd/4th printings against the 6th and BV v4.1)", () => {
    const armed = (): Vehicle => {
        // A rear gun alone, a front gun and a turret gun: the turret's arc decides which side is halved.
        const { vehicle } = importVehicleBlk([
            ...block("UnitType", "Tank"), ...block("Name", "Arc"), ...block("Model", "A"), ...block("year", "3060"),
            ...block("type", "IS Level 2"), ...block("motion_type", "Tracked"), ...block("cruiseMP", "4"), ...block("engine_type", "0"),
            ...block("armor_type", "0"), ...block("armor_tech_level", "1"), ...block("armor", "20", "20", "20", "20", "20"),
            ...block("Front Equipment", "Medium Laser"), ...block("Rear Equipment", "Large Laser"), ...block("Turret Equipment", "PPC"),
            ...block("tonnage", "50.0"),
        ].join("\n"));
        return vehicle!;
    };

    it("defaults to the current text: a turret weapon is in no arc and counts in full", () => {
        const vehicle = armed();
        expect(getVehiclePrintedRule(TURRET_WEAPON_ARC)?.printings[0].tag).toBe("tm-6th");
        expect(vehicle.getPrinting(TURRET_WEAPON_ARC).tag).toBe("tm-6th");
        const steps = vehicle.getBattleValueBreakdown("total-warfare").steps;
        const turret = steps.find((step) => step.id === "cv.bv2.off.weapon.turret");
        expect(turret?.detail).toContain("no arc");
        expect(turret?.cites.map((cite) => cite.source + cite.page)).toContain("tm307");
    });

    it("counts a turret weapon in the forward arc under the 3rd and 4th printing, and saves the choice", () => {
        const vehicle = armed();
        const before = vehicle.getBattleValue("total-warfare");
        const beforeHalved = vehicle.getBattleValueBreakdown("total-warfare").steps.filter((step) => /x 0.5 \((front|rear) arc/.test(step.detail ?? "")).length;
        vehicle.setPrinting(TURRET_WEAPON_ARC, "tm-3rd-4th");
        expect(vehicle.getPrinting(TURRET_WEAPON_ARC).tag).toBe("tm-3rd-4th");
        const turret = vehicle.getBattleValueBreakdown("total-warfare").steps.find((step) => step.id === "cv.bv2.off.weapon.turret.forward");
        expect(turret).toBeDefined();
        expect(turret?.detail).toContain("forward");
        expect(turret?.cites.some((cite) => cite.source === "tm" && cite.page === "307")).toBe(true);
        expect(beforeHalved).toBe(1);
        // The turret PPC (the largest) now joins the front arc, so the rear is the weaker: BV changes.
        expect(vehicle.getBattleValue("total-warfare")).not.toBe(before);
        const saved = vehicle.export();
        expect(JSON.stringify(saved)).toContain("tm-3rd-4th");
    });
});

describe("Combat Vehicle step definitions", () => {
    it("are each listed in the reading ledger", () => {
        const ledger = fs.readFileSync(path.join(__dirname, "../../docs/superpowers/plans/2026-11-10-cited-bv-ledger.md"), "utf8");
        for (const id of [...Object.keys(VEHICLE_BV2_STEPS), ...Object.keys(getVehicleBv1Steps("master-rules-revised")), ...Object.keys(VEHICLE_COST_STEPS)]) {
            expect(ledger, id).toContain("`" + id + "`");
        }
    });
});

describe("Combat Vehicle cost as cited steps (TM pp.279, 282-285; BMR p.137; BMR(R) p.150)", () => {
    const stepsOf = (vehicle: Vehicle, id: string, edition?: string) => vehicle.getCostBreakdown(edition).steps.filter((step) => step.id === id);
    const hephaestus = (pods: boolean): Vehicle => {
        const lines = pods ? HEPHAESTUS_PRIME : [
            ...block("UnitType", "Tank"), ...block("Name", "Hephaestus Scout Tank"), ...block("Model", "Base"), ...block("year", "3064"),
            ...block("type", "Clan Level 2"), ...block("motion_type", "Hover"), ...block("cruiseMP", "8"), ...block("engine_type", "0"),
            ...block("clan_engine", "false"), ...block("armor_type", "1"), ...block("armor_tech_level", "6"), ...block("omni", "1"),
            ...block("armor", "20", "20", "20", "18", "18"), ...block("Body Equipment", "CLActiveProbe"),
            ...block("tonnage", "30.0"), ...block("baseChassisTurretWeight", "0.5"),
        ].join("\n");
        return importVehicleBlk(lines).vehicle!;
    };

    it("has clean definitions tables for the current rules and both Master Rules editions", () => {
        for (const edition of ["total-warfare", "master-rules", "master-rules-revised"]) expect(findCalcDefProblems(getVehicleCostSteps(edition)), edition).toEqual([]);
    });

    it("works the Hephaestus at every number TM pp.283-285 prints", () => {
        // Base configuration: 427,500 structure + 200,000 active probe = 627,500, x 1.25 (Omni) x (1 + 30 / 50) = 1,255,000.
        const base = hephaestus(false);
        expect(stepsOf(base, "cv.cost.subtotal")[0].value).toBe(627500);
        expect(base.getCBillCost()).toBe(1255000);
        // Primary: 997,500 x 1.25 x 1.6 = 1,995,000.
        const primary = hephaestus(true);
        expect(stepsOf(primary, "cv.cost.subtotal")[0].value).toBe(997500);
        expect(stepsOf(primary, "cv.cost.multiplier")[0].value).toBeCloseTo(1.6, 10);
        expect(primary.getCBillCost()).toBe(1995000);
        expect(primary.getCostBreakdown("total-warfare").result).toBe(1995000);
        for (const step of primary.getCostBreakdown().steps) expect(VEHICLE_COST_STEPS[step.id], step.id).toBeDefined();
    });

    it("leaves ammunition out of the cost and shows a loaded cost (TM p.282)", () => {
        const tank = new Vehicle();
        tank.addEquipmentFromTag("autocannon-standard-b");
        const without = tank.getCBillCost();
        tank.addEquipmentFromTag("ammo-ac-5-standard");
        expect(tank.getCBillCost()).toBe(without);
        const ammo = stepsOf(tank, "cv.cost.ammo")[0].value!;
        expect(ammo).toBeGreaterThan(0);
        expect(stepsOf(tank, "cv.cost.final.loaded")[0].value).toBe(without + ammo);
    });

    it("bills Clan CASE 50,000 for each location that stores ammunition or explosives, and no Inner Sphere chassis (TM pp.210, 292)", () => {
        const clan = new Vehicle();
        clan.setTech("clan");
        clan.addEquipmentFromTag("clan-ultra-ac-5");
        clan.addEquipmentFromTag("ammo-clan-ultra-ac-5-standard");
        const caseSteps = stepsOf(clan, "cv.cost.clan-case");
        expect(caseSteps).toHaveLength(1);
        expect(caseSteps[0].value).toBe(50000);
        expect(caseSteps[0].cites.map((cite) => cite.source + cite.page)).toEqual(["tm210", "tm292"]);
        const inner = new Vehicle();
        inner.addEquipmentFromTag("autocannon-standard-b");
        inner.addEquipmentFromTag("ammo-ac-5-standard");
        expect(stepsOf(inner, "cv.cost.clan-case")).toHaveLength(0);
    });

    it("prices a supercharger at 10,000 x the engine rating (TO:AUE p.223) and communications equipment at 10,000 a ton (TM p.292)", () => {
        const tank = new Vehicle();
        tank.addEquipmentFromTag("supercharger");
        const supercharger = stepsOf(tank, "cv.cost.equipment.formula");
        expect(supercharger).toHaveLength(1);
        expect(supercharger[0].value).toBe(10000 * tank.getEngineRating());
        for (let tons = 0; tons < 6; tons++) tank.addEquipmentFromTag("communications-equipment");
        const comms = stepsOf(tank, "cv.cost.equipment.communications");
        expect(comms.reduce((sum, step) => sum + (step.value ?? 0), 0)).toBe(60000);
    });

    it("reads BMR p.137 and BMR(R) p.150 for the rows they print, and marks the rest provisional", () => {
        const tank = new Vehicle();
        tank.setJumpMP(2);
        const cite = (edition: string, id: string) => stepsOf(tank, id, edition)[0];
        expect(cite("total-warfare", "cv.cost.structure").cites.map((entry) => entry.source + entry.page)).toEqual(["tm279"]);
        expect(cite("master-rules", "cv.cost.structure").cites.map((entry) => entry.source + entry.page)).toEqual(["bmr137"]);
        expect(cite("master-rules-revised", "cv.cost.structure").cites.map((entry) => entry.source + entry.page)).toEqual(["bmrr150"]);
        expect(cite("master-rules", "cv.cost.structure").status).toBe("cited");
        // Vehicular jump jets are TO:AUE's: neither Master Rules table prints them.
        expect(cite("master-rules", "cv.cost.jump-jets").status).toBe("provisional");
        expect(cite("master-rules-revised", "cv.cost.jump-jets").note).toContain("p.150");
        expect(cite("total-warfare", "cv.cost.jump-jets").status).toBe("cited");
    });
});
