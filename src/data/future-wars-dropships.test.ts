import { describe, expect, it } from "vitest";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { CHANGE_LABELS, findSpecialRuleset, getRulesetBlock } from "./special-rulesets";
import {
    buildEidDropShip, buildHousemanDropShip, buildReeseDropShip, buildStockDropShip, DSJS_DROPSHIPS, EID_CHART_A, EID_CHART_B,
    emptyFwDropShipDesign, FW_DROPSHIP_RULESET_IDS, getEidFireFactorBonus, getFireFactor, getFwDropShipMethod, getHousemanDockingTons, getHousemanIntegrity,
    getReeseModelTonnage, IFwDropShipDesign, lookupFwBand, REESE_CHART_A, REESE_CHART_C, REESE_CHART_D, stockArmorPointsPerTon,
    stockBridgeMultiplier, stockBurnDay, stockCrew, stockHeatSinkDivisor, stockThrustPointsPerTon,
} from "./future-wars-dropships";

/** Future Wars DropShips plan (#172, 2026-11-19), Tasks 1 and 2. */

const meanError = (fit: (ship: typeof DSJS_DROPSHIPS[number]) => number | null, canon: (ship: typeof DSJS_DROPSHIPS[number]) => number | null): number => {
    const errors = DSJS_DROPSHIPS.map((ship) => [fit(ship), canon(ship)]).filter(([a, b]) => a !== null && b !== null).map(([a, b]) => Math.abs(a! - b!));
    return errors.reduce((total, error) => total + error, 0) / errors.length;
};

describe("Future Wars DropShip rulesets", () => {
    const ids = Object.values(FW_DROPSHIP_RULESET_IDS);

    it("registers four construction rulesets at Custom Homebrew, credited to author, issue and page", () => {
        const expected: Array<[string, string, string, string]> = [
            [FW_DROPSHIP_RULESET_IDS.stock, "Mark Stock", "FW #16", "Future Wars #16 (1990), p.32"],
            [FW_DROPSHIP_RULESET_IDS.eid, "Erik Eid", "FW #25", "Future Wars #25 (1991), pp.6-7"],
            [FW_DROPSHIP_RULESET_IDS.reese, "Mike Reese", "FW #36", "Future Wars #36 (1993), pp.14-21"],
            [FW_DROPSHIP_RULESET_IDS.houseman, "Doug Houseman", "FW #36", "Future Wars #36 (1993), pp.22-23"],
        ];
        for (const [id, author, tag, page] of expected) {
            const ruleset = findSpecialRuleset(id)!;
            expect(ruleset, id).toBeDefined();
            expect(ruleset.category).toBe("construction");
            expect(ruleset.minRulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
            expect(ruleset.changes).toEqual(["dropshipConstruction"]);
            expect(ruleset.source.author).toBe(author);
            expect(ruleset.source.tag).toBe(tag);
            expect(ruleset.source.publication).toBe("Future Wars");
            expect(ruleset.source.title).toContain(page);
            expect(ruleset.summary.length, id).toBeLessThanOrEqual(120);
            expect(ruleset.description, id).not.toMatch(/\bOurs\b/);
        }
        expect(CHANGE_LABELS.dropshipConstruction).toBe("DropShip construction");
    });

    it("lets only one method be ticked at a time", () => {
        for (const ticked of ids) {
            for (const other of ids.filter((id) => id !== ticked)) {
                const block = getRulesetBlock([ticked], other);
                expect(block?.kind).toBe("clash");
                expect(block?.reason).toContain("DropShip construction");
            }
        }
        expect(getFwDropShipMethod([])).toBeUndefined();
        expect(getFwDropShipMethod(["fw-morale", FW_DROPSHIP_RULESET_IDS.reese])).toBe("reese");
    });
});

describe("The printed tables", () => {
    it("reads Eid's and Reese's charts at their band edges", () => {
        expect([1900, 1901, 2900, 2901, 20000, 50001, 100000].map((t) => lookupFwBand(EID_CHART_A, t))).toEqual([10, 8, 8, 6, 6, 2, 2]);
        expect([500, 501, 100001].map((t) => lookupFwBand(REESE_CHART_A, t))).toEqual([100, 10, 1]);
        expect([700, 701, 4286, 11300, 11301].map((t) => lookupFwBand(EID_CHART_B, t))).toEqual([10, 11, 34, 97, 110]);
        expect([70000, 70001, 90001, 100001].map((t) => lookupFwBand(REESE_CHART_C, t))).toEqual([8, 6, 2, 1]);
        expect([65001, 100001, 200001, 300001].map((t) => lookupFwBand(REESE_CHART_D, t))).toEqual([6, 4, 2, 1]);
    });

    it("extends Houseman's integrity table without a cap, marking rows past 8 as NGCFells's", () => {
        expect(getHousemanIntegrity(1)).toEqual({ integrity: 1, percentOfMass: 3, internalStructure: 10, maxArmor: 20, acceleration: 1, extended: false });
        expect(getHousemanIntegrity(8)).toEqual({ integrity: 8, percentOfMass: 24, internalStructure: 80, maxArmor: 160, acceleration: 8, extended: false });
        expect(getHousemanIntegrity(11)).toEqual({ integrity: 11, percentOfMass: 33, internalStructure: 110, maxArmor: 220, acceleration: 11, extended: true });
        expect(getHousemanIntegrity(18)).toEqual({ integrity: 18, percentOfMass: 54, internalStructure: 180, maxArmor: 360, acceleration: 18, extended: true });
    });

    it("weighs Houseman's docking system by size, then 100 tons a further 5,000", () => {
        expect([100, 101, 400, 1000, 5000, 10000, 15000, 15001, 20000, 100000].map(getHousemanDockingTons))
            .toEqual([0, 25, 25, 50, 100, 200, 300, 400, 400, 2000]);
    });

    it("keeps every DS&JS DropShip, smallest first", () => {
        expect(DSJS_DROPSHIPS).toHaveLength(19);
        expect(DSJS_DROPSHIPS.map((ship) => ship.tonnage)).toEqual([...DSJS_DROPSHIPS.map((ship) => ship.tonnage)].sort((a, b) => a - b));
        const union = DSJS_DROPSHIPS.find((ship) => ship.name === "Union")!;
        expect(union).toMatchObject({ page: 41, tonnage: 3500, thrust: 3, structuralIntegrity: 11, engine: 630, fuelTons: 209, burnDay: 2.82, bridge: 27 });
    });
});

describe("Stock's looked-up values, as formulae fitted to DS&JS (NGCFells's extrapolation)", () => {
    it("fits thrust points a ton within 0.3 on average, never off by more than 2", () => {
        expect(meanError((s) => stockThrustPointsPerTon(s.tonnage), (s) => s.thrustPointsPerTon)).toBeLessThan(0.3);
        for (const ship of DSJS_DROPSHIPS.filter((s) => s.thrustPointsPerTon !== null)) {
            expect(Math.abs(stockThrustPointsPerTon(ship.tonnage) - ship.thrustPointsPerTon!), ship.name).toBeLessThanOrEqual(2);
        }
    });

    it("fits the burn-day within 0.35 on average and hits the Mammoth and Behemoth exactly", () => {
        expect(meanError((s) => stockBurnDay(s.tonnage), (s) => s.burnDay)).toBeLessThan(0.35);
        expect(stockBurnDay(52000)).toBe(8.37);
        expect(stockBurnDay(100000)).toBe(8.83);
        expect(stockBurnDay(3000)).toBe(1.84);
    });

    it("fits armor points a ton: 16 below 10,000 tons, then falling", () => {
        expect(meanError((s) => stockArmorPointsPerTon(s.tonnage), (s) => s.armorPointsPerTon)).toBeLessThan(0.5);
        expect([9700, 10000, 16000, 52000, 100000].map(stockArmorPointsPerTon)).toEqual([16, 13, 11, 8, 6]);
    });

    it("fits crew loosely (mean error under 8), and the bridge multiplier and heat-sink divisor inside Stock's ranges", () => {
        expect(meanError((s) => stockCrew(s.tonnage), (s) => s.crew)).toBeLessThan(8);
        for (const t of [100, 1400, 3500, 16000, 100000, 500000]) {
            expect(stockBridgeMultiplier(t)).toBeGreaterThanOrEqual(1);
            expect(stockBridgeMultiplier(t)).toBeLessThanOrEqual(10);
        }
        expect(stockHeatSinkDivisor(360)).toBe(10);
        expect(stockHeatSinkDivisor(13290)).toBe(25);
        expect(stockHeatSinkDivisor(50000)).toBe(25);
    });

    it("lets the builder override every looked-up value", () => {
        const design: IFwDropShipDesign = { ...emptyFwDropShipDesign(3500, "spheroid"), crew: 14, armorPoints: 640,
            stock: { bridgeMultiplier: 2, heatSinkDivisor: 12, armorPointsPerTon: 8, thrustPointsPerTon: 7, burnDay: 3 } };
        const result = buildStockDropShip(design);
        expect(result.bridgeTons).toBe(28);
        expect(result.freeHeatSinks).toBe(Math.floor(700 / 12));
        expect(result.armorTons).toBe(80);
        expect(result.thrustPointsPerTon).toBe(7);
        expect(result.burnDay).toBe(3);
    });
});

/** The DS&JS Union as Reese rebuilds it (FW #36 p.17): 3,500 tons, thrust 3, SI 11, 20 days, book weapons and bays. */
const reeseUnion: IFwDropShipDesign = {
    ...emptyFwDropShipDesign(3500, "spheroid"), thrust: 3, structuralIntegrity: 11, fuelDays: 20, armorPoints: 640,
    addedHeatSinks: 24, weaponTons: 166, ammoTons: 21, mechCubicles: 12, fighterCubicles: 2, officers: 6, crew: 28, passengers: 14,
};

describe("Reese's worked examples", () => {
    it("rebuilds the book Union line for line (FW #36 p.17)", () => {
        const result = buildReeseDropShip(reeseUnion);
        expect(result.engineTons).toBe(656);
        expect(result.structureTons).toBe(385);
        expect(result.burnDay).toBe(240);
        expect(result.fuelTons).toBe(4800);
        expect(result.bridgeTons).toBe(25);
        expect(result.armorTons).toBe(40);
        expect(result.freeHeatSinks).toBe(66);
        // Reese prints 8,437: his sum leaves out the 40 tons of armor, and he counts 12 MechWarriors and 2 pilots at
        // 5 tons as 60, not 70. By his rules the ship is 8,487 tons.
        expect(result.totalTons).toBe(8487);
        expect(result.totalTons - 40 - 10).toBe(8437);
    });

    it("builds the UNION-12 (FW #36 pp.17-18), his 20,426 tons but for the same 60-for-70 slip", () => {
        const union12: IFwDropShipDesign = { ...reeseUnion, tonnage: 22860, fuelDays: 30, addedHeatSinks: 0, officers: 12, crew: 56 };
        const result = buildReeseDropShip(union12);
        expect(result.engineTons).toBe(4286);
        expect(result.structureTons).toBe(2515);
        expect(result.thrustPointsPerTon).toBe(4);
        expect(result.fuelTons).toBe(10800);
        expect(result.bridgeTons).toBe(25);
        expect(result.armorPointsPerTon).toBe(12);
        expect(result.armorTons).toBe(53);
        expect(result.freeHeatSinks).toBe(126);
        expect(result.totalTons).toBe(20436);
        expect(result.issues).toEqual([]);
    });

    it("measures a 12-inch sphere by his rule's Pi (3.145), not the true one his example used", () => {
        expect(getReeseModelTonnage([{ kind: "sphere", diameter: 30 }]).tons).toBe(22885);
        expect(getReeseModelTonnage([{ kind: "box", height: 1, length: 2, width: 3 }]).tons).toBe(Math.round(6 * 23.1 * 0.07));
    });

    it("warns on structural integrity outside the Overthrust to three times it, and on more than eight combat doors", () => {
        const result = buildReeseDropShip({ ...reeseUnion, structuralIntegrity: 16, mechDoors: 9 });
        expect(result.issues.some((issue) => issue.includes("Overthrust (5)"))).toBe(true);
        expect(result.issues.some((issue) => issue.includes("eight doors"))).toBe(true);
    });
});

describe("Houseman's worked example", () => {
    it("gives the Leopard 204 tons of thrusters at thrust 4 (17 x 3 tons a point)", () => {
        const result = buildHousemanDropShip({ ...emptyFwDropShipDesign(1720, "aerodyne"), thrust: 4, structuralIntegrity: 7 });
        expect(result.engineTons).toBe(204);
        expect(result.structureTons).toBe(361.2);
    });

    it("refuses thrust over integrity, notes an extended integrity row, and checks the 25% limit", () => {
        const result = buildHousemanDropShip({ ...emptyFwDropShipDesign(1720, "aerodyne"), thrust: 5, structuralIntegrity: 4, weaponTons: 400 });
        expect(result.issues.some((issue) => issue.includes("may not exceed structural integrity"))).toBe(true);
        expect(result.issues.some((issue) => issue.includes("25%"))).toBe(true);
        const big = buildHousemanDropShip({ ...emptyFwDropShipDesign(100000, "spheroid"), thrust: 2, structuralIntegrity: 12 });
        expect(big.lines[0].note).toContain("NGCFells");
    });
});

describe("Fire factors (the Compendium rule as Eid and Reese print it)", () => {
    it("divides the maximum damage by ten, rounding up at .6", () => {
        expect([0, 5, 15, 16, 25, 26, 40, 45].map(getFireFactor)).toEqual([0, 0, 1, 2, 2, 3, 4, 4]);
    });

    it("gives Eid's +1 for every +4 of to-hit bonus: four pulse lasers lend +2", () => {
        expect(getEidFireFactorBonus(8)).toBe(2);
        expect(getEidFireFactorBonus(3)).toBe(0);
    });
});

describe("Eid", () => {
    it("builds the DS&JS Union by his charts", () => {
        const result = buildEidDropShip({ ...reeseUnion, fuelTons: 209 });
        expect(result.engineTons).toBe(656.25);
        expect(result.bridgeTons).toBe(26.25);
        expect(result.thrustPointsPerTon).toBe(6);
        expect(result.burnDay).toBe(1.84);
        expect(result.freeHeatSinks).toBe(65);
        expect(result.armorPointsPerTon).toBe(16);
        expect(result.issues).toEqual([expect.stringContaining("over the 3,500-ton hull")]);
    });

    it("wants integrity above the Overthrust, a crew of nine and no more than eight cubicle doors", () => {
        const result = buildEidDropShip({ ...emptyFwDropShipDesign(3500, "spheroid"), structuralIntegrity: 5, crew: 4, mechDoors: 9 });
        expect(result.issues.some((issue) => issue.includes("greater than the Overthrust"))).toBe(true);
        expect(result.issues.some((issue) => issue.includes("at least two pilots"))).toBe(true);
        expect(result.issues.some((issue) => issue.includes("8 cubicle doors"))).toBe(true);
    });
});
