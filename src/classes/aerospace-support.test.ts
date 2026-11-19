import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";

// Airship, Fixed-Wing and Satellite Support Vehicles built in the fighter builder, checked against the worked
// examples: the Jetta Coruna and the Dixon (TM pp.116-141), the Cloud Nine and the Starcomm (TO:AUE pp.56-71).
const supportAircraft = (motive: string, tons: number): AerospaceFighter => {
    const unit = new AerospaceFighter();
    unit.setFighterType("support");
    unit.setSupportMotive(motive);
    unit.setTonnage(tons);
    return unit;
};

const add = (unit: AerospaceFighter, tag: string, location: string, count: number = 1): void => {
    for (let i = 0; i < count; i++) expect(unit.addEquipmentFromTag(tag, location)?.tag).toBe(tag);
};

const coruna = (): AerospaceFighter => {
    const unit = supportAircraft("fixed-wing", 35);
    unit.setSupportTechRating("structural", "d");
    unit.setSupportChassisModification("environmental-sealing", true);
    unit.setSupportEngine("fusion");
    unit.setSupportTechRating("engine", "d");
    unit.setSafeThrust(4);
    unit.setFuelTons(8.5);
    unit.setBAR(2);
    unit.setSupportTechRating("armor", "d");
    for (const [arc, points] of [["nose", 15], ["leftWing", 9], ["rightWing", 9], ["aft", 6]] as const) unit.setArmorAllocation(arc, points);
    add(unit, "quarters-officer", "fuselage");
    unit.addBay("cargo");
    unit.setBay(0, 1.5, 1);
    return unit;
};

const dixon = (): AerospaceFighter => {
    const unit = supportAircraft("airship", 300);
    unit.setSupportTechRating("structural", "d");
    unit.setSupportEngine("fusion");
    unit.setSupportTechRating("engine", "d");
    unit.setSafeThrust(2);
    unit.setAdditionalHeatSinks(6);
    unit.setBAR(7);
    unit.setSupportTechRating("armor", "d");
    for (const [arc, points] of [["nose", 29], ["leftWing", 25], ["rightWing", 25], ["aft", 25]] as const) unit.setArmorAllocation(arc, points);
    add(unit, "machine-gun", "nose", 3);
    add(unit, "machine-gun", "aft");
    add(unit, "ammo-machine-gun-standard", "fuselage", 5);
    add(unit, "medium-laser", "leftWing");
    add(unit, "medium-laser", "rightWing");
    add(unit, "sprayer-vehicular", "nose", 2);
    add(unit, "sprayer-vehicular", "aft", 2);
    unit.setSupportFireControl("basic");
    add(unit, "lift-hoist", "fuselage");
    add(unit, "communications-equipment", "fuselage", 6);
    add(unit, "searchlight", "nose");
    add(unit, "searchlight", "aft");
    unit.addBay("cargo-liquid");
    unit.setBay(0, 10, 0);
    unit.addBay("vehicle-light");
    unit.setBay(1, 1, 1);
    unit.addBay("vehicle-light");
    unit.setBay(2, 1, 1);
    unit.addBay("vehicle-light");
    unit.setBay(3, 1, 1);
    unit.addBay("infantry-compartment");
    unit.setBay(4, 3, 0);
    unit.addBay("infantry-compartment");
    unit.setBay(5, 3, 0);
    unit.addBay("cargo");
    unit.setBay(6, 8.94, 0);
    return unit;
};

describe("Fixed-Wing Support Vehicles: the Jetta Coruna (TM pp.125-141)", () => {
    it("builds the 35-ton air yacht to the book", () => {
        const unit = coruna();
        expect(unit.isSupportVehicle()).toBe(true);
        expect(unit.getSupportWeightClass()?.size).toBe("medium");
        expect(unit.getStructureWeight()).toBe(7);
        // Movement Factor 4 + 4^2 = 20; 0.010 x 20 x 1.0 x 35.
        expect(unit.getEngineWeight()).toBe(7);
        expect(unit.getMaxThrust()).toBe(6);
        // 8.5 tons at 20 kg a Fuel Point.
        expect(unit.getFuelPoints()).toBe(425);
        expect(unit.getStructuralIntegrity()).toBe(4);
        expect(unit.getMaxArmorPoints()).toBe(39);
        expect(unit.getArmorWeight()).toBe(1);
        expect(unit.getTotalItemSlots()).toBe(8);
        expect(unit.getUsedItemSlots()).toBe(2);
        expect(unit.getCrew()).toBe(2);
        expect(unit.getRemainingTonnage()).toBe(0);
        expect(unit.getIssues()).toEqual([]);
    });

    it("gives BAR 2 facings a Damage Threshold of 0 and BAR 3-9 facings 1 (TW p.206)", () => {
        const unit = coruna();
        expect(unit.getDamageThresholds()).toEqual({ nose: 0, leftWing: 0, rightWing: 0, aft: 0 });
        unit.setBAR(5);
        expect(unit.getDamageThresholds().nose).toBe(1);
    });

    it("is a Size 2 SV in Alpha Strike moving by thrust, and rates by the aerospace BV rules", () => {
        const unit = coruna();
        const stats = unit.getAlphaStrikeStats();
        expect(stats.type).toBe("SV");
        expect(stats.size).toBe(2);
        expect(stats.movementCode).toBe("a");
        expect(stats.specialAbilities).toContain("BAR");
        // 39 points x 2.5 x 0.2 + SI 4 x 2 = 27.5, x 1.0 for a Fixed-Wing; no weapons.
        expect(unit.getBattleValue()).toBe(28);
    });

    it("saves and loads", () => {
        const loaded = new AerospaceFighter(coruna().exportJSON());
        expect(loaded.getSupportMotive()).toBe("fixed-wing");
        expect(loaded.getFuelPoints()).toBe(425);
        expect(loaded.getBays()).toEqual([{ tag: "cargo", amount: 1.5, doors: 1 }]);
        expect(loaded.getRemainingTonnage()).toBe(0);
        expect(loaded.getImportIssues()).toEqual([]);
    });
});

describe("Airship Support Vehicles: the Dixon (TM pp.125-141)", () => {
    it("builds the 300-ton police airship to the book", () => {
        const unit = dixon();
        expect(unit.getStructureWeight()).toBe(75);
        // Movement Factor 8; 0.008 x 8 x 1.0 x 300 = 19.2, rounded up to 19.5.
        expect(unit.getEngineWeight()).toBe(19.5);
        expect(unit.getMaxThrust()).toBe(3);
        expect(unit.getStructuralIntegrity()).toBe(6);
        expect(unit.getFuelPoints()).toBe(0);
        expect(unit.getMaxArmorPoints()).toBe(104);
        expect(unit.getArmorWeight()).toBe(5);
        // 5 percent of 4 tons of weapons, rounded up to the half ton.
        expect(unit.getSupportFireControlWeight()).toBe(0.5);
        expect(unit.getTotalItemSlots()).toBe(35);
        expect(unit.getUsedItemSlots()).toBe(22);
        // The sprayers' 60 kg and the 8.94-ton cargo bay make 9 tons between them (TM p.139).
        expect(unit.getRemainingTonnage()).toBe(0);
        expect(unit.getIssues()).toEqual([]);
    });

    it("counts gunners by the table's total weapon tonnage, not weapon by weapon as the example does (TM pp.131, 140)", () => {
        // Base 4 + 4 tons of weapons / 3 = 2 gunners + 6 for the communications equipment = 12; 2 officers.
        expect(dixon().getCrew()).toBe(14);
    });

    it("quarters its thrust and needs no fuel with a fusion engine", () => {
        const unit = supportAircraft("airship", 100);
        unit.setSupportEngine("fusion");
        unit.setSafeThrust(1.3);
        expect(unit.getSafeThrust()).toBe(1.25);
        expect(unit.getMaxThrust()).toBe(2);
        unit.setSafeThrust(5);
        expect(unit.getSafeThrust()).toBe(2);
        unit.setSupportEngine("ice");
        unit.setFuelTons(1);
        // Medium, Tech D: 20 kg a point, x 0.75 for an Airship = 15 kg.
        expect(unit.getFuelPoints()).toBe(66);
    });

    it("hits an Airship on the DropShip table and re-rolls a gear critical (TW p.206)", () => {
        const unit = dixon();
        // A 12 from the aft is the aft facing with a Fuel critical; a 11 is aft with a Gear critical, re-rolled.
        const log = unit.resolveAttack(11, "aft", 30, { criticalRolls: [12, 12, 12] }, () => 0.5);
        expect(log.join(" ")).toContain("Gear critical does not apply to an Airship");
        expect(unit.getInPlay().armorDamage.aft).toBe(25);
    });
});

describe("Large Airships and Satellites (TO:AUE pp.56-71)", () => {
    it("builds the Cloud Nine, a 1,000-ton Large Airship", () => {
        const unit = supportAircraft("airship", 1000);
        unit.setSupportTechRating("structural", "e");
        unit.setSupportEngine("fusion");
        unit.setSupportTechRating("engine", "e");
        unit.setSafeThrust(1);
        unit.setBAR(2);
        unit.setSupportTechRating("armor", "e");
        for (const [arc, points] of [["nose", 23], ["leftWing", 20], ["rightWing", 20], ["aft", 20]] as const) unit.setArmorAllocation(arc, points);
        expect(unit.isAdvancedSupportVehicle()).toBe(true);
        expect(unit.getStructureWeight()).toBe(255);
        expect(unit.getEngineWeight()).toBe(45);
        expect(unit.getStructuralIntegrity()).toBe(20);
        expect(unit.getMaxArmorPoints()).toBe(139);
        expect(unit.getArmorWeight()).toBe(1);
        expect(unit.getTotalItemSlots()).toBe(45);
        // Base crew 3 + 1,000 / 500 = 5, and an officer.
        expect(unit.getCrew()).toBe(6);
        expect(unit.getRemainingTonnage()).toBe(699);
        expect(unit.getRequiredRulesLevel()).toBe(3);
        expect(unit.getAlphaStrikeSize()).toBe(5);
        expect(unit.getAlphaStrikeStats().specialAbilities).toContain("SLG");
        expect(unit.getAlphaStrikeStats().movementCode).toBe("i");
    });

    it("builds the Starcomm, an unmanned 20-ton Satellite", () => {
        const unit = supportAircraft("satellite", 20);
        unit.setSupportTechRating("structural", "e");
        unit.setSupportEngine("solar");
        unit.setSupportTechRating("engine", "e");
        unit.setUnmanned(true);
        unit.setBAR(5);
        unit.setSupportTechRating("armor", "e");
        for (const [arc, points] of [["nose", 4], ["leftWing", 3], ["rightWing", 3], ["aft", 4]] as const) unit.setArmorAllocation(arc, points);
        unit.setFuelTons(0);
        expect(unit.getStructureWeight()).toBe(2.5);
        // A Satellite's Movement Factor is 1: 0.10 x 1 x 4.0 x 20.
        expect(unit.getEngineWeight()).toBe(8);
        expect(unit.getSafeThrust()).toBe(0);
        expect(unit.getStructuralIntegrity()).toBe(1);
        expect(unit.getMaxArmorPoints()).toBe(14);
        // 14 x 28 kg = 392 kg, rounded up to half a ton.
        expect(unit.getArmorWeight()).toBe(0.5);
        expect(unit.getTotalItemSlots()).toBe(7);
        expect(unit.getCrew()).toBe(0);
        expect(unit.getRemainingTonnage()).toBe(9);
        expect(unit.getAlphaStrikeStats().structure).toBe(1);
        expect(unit.getAlphaStrikeStats().movementCode).toBe("k");
        add(unit, "medium-laser", "nose");
        expect(unit.getIssues().join(" ")).toContain("unmanned Satellite");
    });

    it("keeps engines off the types that cannot use them (TM p.127; TO:AUE p.62)", () => {
        const satellite = supportAircraft("satellite", 20);
        expect(satellite.getAvailableSupportEngines().map((engine) => engine.tag)).toEqual(["battery", "fuel-cell", "solar", "fission", "fusion"]);
        const plane = supportAircraft("fixed-wing", 20);
        plane.setSupportEngine("battery");
        expect(plane.getIssues().join(" ")).toContain("Prop modification");
        plane.setSupportChassisModification("prop", true);
        expect(plane.getIssues().join(" ")).not.toContain("Prop modification");
        expect(supportAircraft("airship", 50).getAvailableSupportChassisModifications()).not.toContain("armored");
    });
});

describe("satellite-only equipment (TO:AUE pp.135, 138, 144)", () => {
    it("a light sail is 10% of a satellite, and only satellites take it or the space mine dispenser", () => {
        const satellite = supportAircraft("satellite", 42);
        expect(satellite.addEquipmentFromTag("light-sail", "aft")?.weight).toBe(5);
        expect(satellite.addEquipmentFromTag("naval-comm-scanner-suite-small", "nose")).not.toBeNull();
        expect(satellite.addEquipmentFromTag("naval-comm-scanner-suite-large", "nose")).toBeNull();
        const airship = supportAircraft("airship", 42);
        expect(airship.addEquipmentFromTag("light-sail", "aft")).toBeNull();
        expect(airship.addEquipmentFromTag("space-mine-dispenser", "nose")).toBeNull();
    });
});
