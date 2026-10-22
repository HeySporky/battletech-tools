import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";

// Support Vehicles (TM pp.116-139): the TechManual's worked examples rebuilt through the Vehicle class.
const supportVehicle = (motive: string, tons: number): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType(motive);
    vehicle.setSupportVehicle(true);
    vehicle.setHasTurret(false);
    vehicle.setTonnage(tons);
    return vehicle;
};

const add = (vehicle: Vehicle, tag: string, count: number = 1, location: string = ""): void => {
    for (let i = 0; i < count; i++) {
        vehicle.addEquipmentFromTag(tag);
        const item = vehicle.getEquipmentList()[vehicle.getEquipmentList().length - 1];
        expect(item.tag).toBe(tag);
        if (location) vehicle.setEquipmentLocation(item.uuid!, location);
    }
};

const weight = (vehicle: Vehicle, name: string): number | undefined => vehicle.getWeights().find((row) => row.name === name)?.weight;

const simca = (): Vehicle => {
    const vehicle = supportVehicle("wheeled", 2.5);
    vehicle.setSupportVehicleTechRating("structural", "d");
    vehicle.setSupportVehicleEngine("ice");
    vehicle.setSupportVehicleTechRating("engine", "d");
    vehicle.setCruiseMP(7);
    vehicle.setSupportVehicleFuel(0.042);
    vehicle.setSupportVehicleExtraCrew(2);
    // 3 crew seats and 4 more for stretchers, and 4 slots of paramedic equipment (TM p.137).
    add(vehicle, "seating-standard", 7);
    add(vehicle, "paramedic-equipment", 4);
    return vehicle;
};

describe("Support Vehicles: the TechManual examples (TM pp.116-139)", () => {
    it("builds the Simca, a Small wheeled ambulance, to the kilogram", () => {
        const vehicle = simca();
        expect(vehicle.isSupportVehicle()).toBe(true);
        expect(vehicle.getSupportVehicleWeightClass()?.size).toBe("small");
        expect(vehicle.getStructureWeight()).toBe(0.3);
        expect(vehicle.getEngineWeight()).toBe(0.497);
        expect(vehicle.getSupportVehicleRangeKm()).toBe(845);
        expect(vehicle.getFlankMP()).toBe(11);
        expect(vehicle.getTotalItemSlots()).toBe(5);
        expect(vehicle.getUsedItemSlots()).toBe(4);
        expect(vehicle.getCrew()).toBe(3);
        // 136 kg left over: the book gives it to a cargo bay.
        expect(vehicle.getRemainingTonnage()).toBe(0.136);
        expect(vehicle.getStructureAllocation().front).toBe(1);
        expect(vehicle.getSupportVehicleIssues()).toEqual([]);
    });

    it("prices the Simca: 4,043.75 C-bills of structure at Tech Rating D (TM pp.276-285)", () => {
        // (750 + 2,485) x 1.25 = 4,043.75 structure; 4 x 7,500 paramedic + 7 x 100 seats = 30,700; x (1 + 2.5 /
        // 200). The book's cargo bay and rear door are added in vehicle-support-equipment.test.ts.
        expect(simca().getCBillCost()).toBe(Math.round((4043.75 + 30700) * (1 + 2.5 / 200)));
        expect(simca().getCBillCostLog()).toContain("Structural subtotal x 1.25");
    });

    it("builds the Swiftran, a Medium armored VTOL medivac", () => {
        const vehicle = supportVehicle("vtol", 25);
        vehicle.setSupportVehicleTechRating("structural", "e");
        vehicle.setSupportVehicleChassisModification("armored", true);
        vehicle.setSupportVehicleTechRating("engine", "e");
        vehicle.setCruiseMP(11);
        vehicle.setSupportVehicleFuel(1);
        vehicle.setBAR(10);
        vehicle.setSupportVehicleTechRating("armor", "d");
        expect(vehicle.getMaxArmorPoints()).toBe(29);
        for (const [location, points] of [["rotor", 2], ["front", 8], ["left", 7], ["right", 7], ["rear", 5]] as const) {
            vehicle.setArmorAllocation(location, points);
        }
        add(vehicle, "seating-standard", 20);
        add(vehicle, "paramedic-equipment", 6);
        expect(vehicle.getStructureWeight()).toBe(8);
        expect(vehicle.getEngineWeight()).toBe(10.5);
        expect(vehicle.getSupportVehicleRangeKm()).toBe(952);
        expect(vehicle.getArmorWeight()).toBe(2);
        expect(vehicle.getStructureAllocation()).toMatchObject({ front: 3, rotor: 3 });
        expect(vehicle.canHaveTurret()).toBe(false);
        // The seats and paramedic equipment are weighed in kilograms and rounded up together: 3 tons.
        expect(weight(vehicle, "Items weighed in kilograms (3000 kg)")).toBe(3);
        // The last half ton went to a cargo bay in the book.
        expect(vehicle.getRemainingTonnage()).toBe(0.5);
        expect(vehicle.getUsedItemSlots()).toBe(6);
        expect(vehicle.getTotalItemSlots()).toBe(7);
        expect(vehicle.getSupportVehicleIssues()).toEqual([]);
    });

    it("builds the Hesiod, a Medium off-road wheeled Support OmniVehicle on alcohol", () => {
        const vehicle = supportVehicle("wheeled", 7);
        vehicle.setOmni(true);
        vehicle.setSupportVehicleTechRating("structural", "e");
        vehicle.setSupportVehicleChassisModification("off-road", true);
        vehicle.setSupportVehicleTechRating("engine", "e");
        vehicle.setCruiseMP(4);
        vehicle.setSupportVehicleAlternativeFuel(true);
        vehicle.setSupportVehicleFuel(0.5);
        vehicle.setBAR(4);
        vehicle.setSupportVehicleTechRating("armor", "e");
        for (const [location, points] of [["front", 5], ["left", 5], ["right", 5], ["rear", 3]] as const) {
            vehicle.setArmorAllocation(location, points);
        }
        expect(vehicle.getSupportVehicleChassisModifications()).toEqual(["off-road", "omni"]);
        expect(vehicle.getStructureWeight()).toBe(1.5);
        expect(vehicle.getEngineWeight()).toBe(1.5);
        expect(vehicle.getSupportVehicleRangeKm()).toBe(2666);
        expect(vehicle.getMaxArmorPoints()).toBe(18);
        expect(vehicle.getArmorWeight()).toBe(0.5);
        expect(vehicle.getRemainingTonnage()).toBe(3);
        expect(vehicle.getCrew()).toBe(2);
        expect(vehicle.getSupportVehicleIssues()).toEqual([]);
    });

    it("rates the CellCo Ranger by the rule text: armor x 2.5 x BAR / 10 and weapons x 0.8 without fire control (TM pp.307-308)", () => {
        // 17-ton wheeled APC, Cruising MP 3 (Flank 5, TMM +2), 38 points of BAR 7, a turret, one machine gun with a
        // half ton of ammunition. The book's own figure, 53, leaves out the x 2.5 on armor (38 x 0.7 = 26.6).
        const vehicle = supportVehicle("wheeled", 17);
        vehicle.setHasTurret(true);
        vehicle.setCruiseMP(3);
        vehicle.setBAR(7);
        vehicle.setSupportVehicleTechRating("armor", "d");
        for (const [location, points] of [["front", 10], ["left", 8], ["right", 8], ["rear", 6], ["turret", 6]] as const) {
            vehicle.setArmorAllocation(location, points);
        }
        add(vehicle, "machine-gun", 1, "turret");
        add(vehicle, "ammo-machine-gun-standard");
        vehicle.getEquipmentList()[1].weight = 0.5;
        vehicle.setTonnage(17);
        // Defensive: (38 x 2.5 x 0.7 + 10 x 1.5) x 0.8 (wheeled) x 1.2 = 78.24.
        // Offensive: (5 + 0.5 ammo) x 0.8 + 17 / 2 = 12.9, x Speed Factor 1.0. Machine gun ammunition is 1 BV a ton
        // (TM p.317), so the half ton adds 0.5; the example counts it as 1.
        expect(vehicle.getBattleValueLog()).toContain("38 points x 2.5 x 0.7 (BAR 7 / 10) = 66.50");
        expect(vehicle.getBattleValueLog()).toContain("x 0.8 (no fire control)");
        expect(vehicle.getBattleValue()).toBe(Math.round(78.24 + 12.9));
    });
});

describe("Support Vehicles in play (TW pp.206-207)", () => {
    const armoredTracked = (bar: number, armored: boolean): Vehicle => {
        // 100 tons: 10 structure points a location, so the second hit in the book's example breaches without destroying.
        const vehicle = supportVehicle("tracked", 100);
        if (armored) vehicle.setSupportVehicleChassisModification("armored", true);
        vehicle.setBAR(bar);
        for (const location of ["front", "left", "right", "rear"] as const) vehicle.setArmorAllocation(location, 12);
        return vehicle;
    };

    it("rolls a penetrating critical hit when one hit beats the BAR, -1 with the Armored chassis (TW p.206 example)", () => {
        // An Armored BAR 7 tracked Support Vehicle takes 8 points from a large laser in the front: 4 armor remains,
        // but 8 exceeds BAR 7, so a penetrating critical hit is rolled at -1.
        const vehicle = armoredTracked(7, true);
        const log = vehicle.resolveAttack(7, "front", 8);
        expect(vehicle.getArmorRemaining("front")).toBe(4);
        expect(log.join(" ")).toContain("8 damage exceeds BAR 7: roll for a penetrating critical hit (-1, Armored chassis)");
        expect(vehicle.takeFollowUpRolls()).toContainEqual({ kind: "critical", location: "front", modifier: -1 });
        // A second hit on a 2 rolls twice: the penetrating roll at -1 and the location's own critical roll.
        vehicle.resolveAttack(2, "front", 8);
        expect(vehicle.takeFollowUpRolls().filter((roll) => roll.kind === "critical")).toEqual([
            { kind: "critical", location: "front", modifier: -1 },
            { kind: "critical", location: "front" },
        ]);
    });

    it("rolls no penetrating critical hit at or under the BAR, nor on an Armored BAR 10 chassis", () => {
        const light = armoredTracked(7, false);
        light.resolveAttack(7, "front", 7);
        expect(light.takeFollowUpRolls()).toEqual([]);
        expect(armoredTracked(10, true).getPenetratingCriticalModifier(20)).toBeNull();
        expect(armoredTracked(10, false).getPenetratingCriticalModifier(20)).toBe(0);
        expect(new Vehicle().getPenetratingCriticalModifier(20)).toBeNull();
    });

    it("adds +2 to an armor-piercing critical roll against BAR under 10 (TW p.206)", () => {
        const vehicle = armoredTracked(7, false);
        vehicle.resolveAttack(7, "front", 5, { armorPiercing: 5 });
        // AC/5 armor-piercing: -3, +2 for the low BAR.
        expect(vehicle.takeFollowUpRolls()).toContainEqual({ kind: "critical", location: "front", modifier: -1 });
    });

    it("converts to Alpha Strike with armor x BAR / 10 and the BAR, AFC and BFC specials (ASC p.95)", () => {
        // 48 points of BAR 7: 33.6, rounded to 34, / 30 = 1.
        const vehicle = armoredTracked(7, false);
        expect(vehicle.getAlphaStrikeArmor()).toBe(1);
        expect(vehicle.getAlphaStrikeStats().specialAbilities).toContain("BAR");
        vehicle.setSupportVehicleFireControl("basic");
        expect(vehicle.getAlphaStrikeStats().specialAbilities).toContain("BFC");
        vehicle.setBAR(10);
        vehicle.setSupportVehicleFireControl("advanced");
        expect(vehicle.getAlphaStrikeStats().specialAbilities).toEqual(expect.arrayContaining(["AFC"]));
        expect(vehicle.getAlphaStrikeStats().specialAbilities).not.toContain("BAR");
        expect(vehicle.getAlphaStrikeArmor()).toBe(2);
    });

    it("adds the fire control modifier to its weapons' to-hit (TW p.206)", () => {
        const vehicle = supportVehicle("tracked", 40);
        add(vehicle, "machine-gun", 1, "front");
        const gun = vehicle.getEquipmentList()[0];
        expect(vehicle.getWeaponToHitModifier(gun)).toBe(2);
        vehicle.setSupportVehicleFireControl("basic");
        expect(vehicle.getWeaponToHitModifier(gun)).toBe(1);
        vehicle.setSupportVehicleFireControl("advanced");
        expect(vehicle.getWeaponToHitModifier(gun)).toBe(0);
    });
});

describe("Support Vehicle rules", () => {
    it("keeps Combat Vehicles at BAR 10 with no fire control penalty", () => {
        const tank = new Vehicle();
        expect(tank.isSupportVehicle()).toBe(false);
        expect(tank.getBAR()).toBe(10);
        expect(tank.getFireControlToHitModifier()).toBe(0);
    });

    it("gives basic fire control 5 percent of the weapons' weight and a +1 to-hit, advanced 10 percent and none (TM pp.131, 217)", () => {
        const vehicle = supportVehicle("tracked", 40);
        add(vehicle, "machine-gun", 4, "front");
        add(vehicle, "medium-laser", 2, "front");
        expect(vehicle.getFireControlToHitModifier()).toBe(2);
        vehicle.setSupportVehicleFireControl("basic");
        // 5 percent of 4 tons is 0.2, up to the half ton (the Dixon, TM p.138).
        expect(vehicle.getSupportVehicleFireControlWeight()).toBe(0.5);
        expect(vehicle.getFireControlToHitModifier()).toBe(1);
        vehicle.setSupportVehicleFireControl("advanced");
        expect(vehicle.getSupportVehicleFireControlWeight()).toBe(0.5);
        expect(vehicle.getFireControlToHitModifier()).toBe(0);
    });

    it("needs power amplifiers and heat sinks for heavy energy weapons without a fusion engine (TM pp.133, 136)", () => {
        const vehicle = supportVehicle("tracked", 40);
        add(vehicle, "medium-laser", 2, "front");
        expect(vehicle.getFreeHeatSinks()).toBe(0);
        expect(vehicle.getWeightedHeatSinks()).toBe(6);
        expect(vehicle.getPowerAmplifierWeight()).toBe(0.5);
        vehicle.setSupportVehicleEngine("fusion");
        expect(vehicle.getPowerAmplifierWeight()).toBe(0);
        expect(vehicle.getWeightedHeatSinks()).toBe(6);
    });

    it("counts gunners and officers into the crew (TM p.131)", () => {
        const vehicle = supportVehicle("tracked", 40);
        add(vehicle, "medium-laser", 4, "front");
        // Base 2, 4 tons of weapons / 2 without fire control = 2 gunners: 4 crew, so 1 officer.
        expect(vehicle.getCrew()).toBe(5);
        vehicle.setSupportVehicleFireControl("advanced");
        // 4 tons / 4 = 1 gunner: 3 crew, no officer.
        expect(vehicle.getCrew()).toBe(3);
    });

    it("keeps a Small Support Vehicle to light equipment and a seat per crewman (TM pp.132, 136)", () => {
        const vehicle = supportVehicle("wheeled", 3);
        expect(vehicle.getAvailableEquipment().find((item) => item.tag === "machine-gun")?.available).toBe(false);
        expect(vehicle.getAvailableEquipment().find((item) => item.tag === "paramedic-equipment")?.available).toBe(true);
        expect(vehicle.getSupportVehicleIssues()).toContain("A Small Support Vehicle needs a seat for each of its 1 crew (0 installed; TM p.132)");
    });

    it("checks Tech Ratings, chassis modifications, engines and armor against the book", () => {
        const vehicle = supportVehicle("hover", 20);
        vehicle.setSupportVehicleTechRating("structural", "b");
        expect(vehicle.getSupportVehicleIssues()).toContain("The structure needs at least Tech Rating C for this motive type and size (TM p.120)");
        expect(vehicle.getAvailableSupportVehicleEngines().map((engine) => engine.tag)).not.toContain("steam");
        expect(vehicle.getAvailableSupportVehicleChassisModifications()).not.toContain("amphibious");
        vehicle.setSupportVehicleTechRating("structural", "d");
        vehicle.setSupportVehicleChassisModification("environmental-sealing", true);
        expect(vehicle.getSupportVehicleIssues()).toContain("Armored, Amphibious, Environmentally Sealed and Submersible chassis need at least 1 armor point in every location (TM p.134)");
        vehicle.setBAR(10);
        vehicle.setArmorAllocation("front", 5);
        expect(vehicle.getSupportVehicleIssues()).toContain("BAR 10 armor at Tech Rating D needs the Armored chassis modification (TM p.134)");
        vehicle.setSupportVehicleTechRating("armor", "a");
        expect(vehicle.getSupportVehicleIssues()).toContain("BAR 10 armor does not exist at Tech Rating A (TM p.134)");
        vehicle.setSupportVehicleEngine("fusion");
        vehicle.setSupportVehicleTechRating("engine", "b");
        expect(vehicle.getSupportVehicleIssues()).toContain("Fusion engines do not exist at Tech Rating B (TM p.127)");
    });

    it("gives a Large Support Vehicle six facings at the Standard rules level (TM p.124)", () => {
        const vehicle = supportVehicle("tracked", 150);
        expect(vehicle.getSupportVehicleWeightClass()?.size).toBe("large");
        expect(vehicle.getLocations().map((location) => location.tag)).toEqual(["front", "frontLeft", "frontRight", "rearLeft", "rearRight", "rear"]);
        expect(vehicle.getRequiredRulesLevel()).toBeLessThanOrEqual(2);
    });

    it("makes a hydrofoil a naval Support Vehicle with the Hydrofoil modification: x 1.25 Cruising MP, at most 100 tons (TM pp.118, 123)", () => {
        const vehicle = supportVehicle("hydrofoil", 120);
        expect(vehicle.getTonnage()).toBe(100);
        expect(vehicle.getSupportVehicleChassisModifications()).toEqual(["hydrofoil"]);
        vehicle.setCruiseMP(6);
        expect(vehicle.getCruiseMP()).toBe(8);
    });

    it("saves and loads a Support Vehicle, rejecting settings it does not know", () => {
        const vehicle = simca();
        const restored = new Vehicle(vehicle.exportJSON());
        expect(restored.getSupportVehicleSettings()).toEqual(vehicle.getSupportVehicleSettings());
        expect(restored.getTonnage()).toBe(2.5);
        expect(restored.getRemainingTonnage()).toBe(0.136);
        const tampered = JSON.parse(vehicle.exportJSON());
        tampered.supportVehicle = { ...tampered.supportVehicle, engine: "warp", bar: 99, chassisModifications: ["off-road", "<script>"], structuralTechRating: "z" };
        const loaded = new Vehicle(JSON.stringify(tampered));
        expect(loaded.getSupportVehicleSettings()).toMatchObject({ engine: "ice", bar: 5, chassisModifications: ["off-road"], structuralTechRating: "d" });
        expect(loaded.getImportIssues().length).toBeGreaterThan(0);
        // A Combat Vehicle save loads as one.
        expect(new Vehicle(new Vehicle().exportJSON()).isSupportVehicle()).toBe(false);
    });
});
