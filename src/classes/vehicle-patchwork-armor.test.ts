import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";

// Patchwork Armor on Combat Vehicles (TO:AUE pp.188-189; IO:AE p.82): an armor type per location, each
// location weighed by the point and rounded up to the half ton, taking the item slots right of the slash in
// the Patchwork Armor Table.

const tank = (tech: string = "is"): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setTech(tech);
    vehicle.setEra("early-rep");
    vehicle.setMotiveType("tracked");
    vehicle.setTonnage(50);
    vehicle.setHasTurret(true);
    return vehicle;
};

const patchworkTank = (): Vehicle => {
    const vehicle = tank();
    vehicle.setArmorType("patchwork");
    vehicle.setArmorAllocation("front", 40);
    vehicle.setArmorAllocation("left", 30);
    vehicle.setArmorAllocation("right", 30);
    vehicle.setArmorAllocation("rear", 20);
    vehicle.setArmorAllocation("turret", 30);
    vehicle.setPatchworkArmorType("front", "reactive");
    vehicle.setPatchworkArmorType("left", "ferro-fibrous");
    return vehicle;
};

describe("Combat Vehicle armor item slots (TM p.105; TO:AUE p.93)", () => {
    it("takes the Combat Vehicle Armor Table's item slots for the armor type", () => {
        const standard = tank();
        const used = standard.getUsedItemSlots();
        expect(standard.getArmorItemSlots()).toBe(0);

        const ferro = tank();
        ferro.setArmorType("ferro-fibrous");
        expect(ferro.getArmorItemSlots()).toBe(2);
        expect(ferro.getUsedItemSlots()).toBe(used + 2);

        ferro.setArmorType("heavy-ferro-fibrous");
        expect(ferro.getArmorItemSlots()).toBe(3);
        ferro.setArmorType("vehicular-stealth");
        expect(ferro.getArmorItemSlots()).toBe(2);
        // Printed as 1 for Combat Vehicles in the Advanced Armor Table (TO:AUE p.93).
        ferro.setArmorType("hardened");
        expect(ferro.getArmorItemSlots()).toBe(1);

        const clan = tank("clan");
        clan.setArmorType("ferro-fibrous");
        expect(clan.getArmorItemSlots()).toBe(1);
    });
});

describe("Patchwork Armor on Combat Vehicles (TO:AUE pp.188-189)", () => {
    it("is offered from the Advanced rules level and needs it", () => {
        const vehicle = tank();
        const patchwork = (level: number) => vehicle.getAvailableArmorTypes(level).find((armor) => armor.tag === "patchwork");
        expect(patchwork(2)?.available).toBe(false);
        expect(patchwork(3)?.available).toBe(true);
        expect(vehicle.getRequiredRulesLevel()).toBe(0);
        vehicle.setArmorType("patchwork");
        expect(vehicle.getRequiredRulesLevel()).toBe(3);
    });

    it("weighs each location by its type's tons per point, rounded up to the half ton", () => {
        const vehicle = patchworkTank();
        // Reactive: 40 x 0.0625 = 2.5; Ferro-Fibrous (I.S.): 30 x 0.0558 = 1.674, so 2; Standard: 1.875, 1.25 and 1.875.
        expect(vehicle.getPatchworkLocationWeight("front")).toBe(2.5);
        expect(vehicle.getPatchworkLocationWeight("left")).toBe(2);
        expect(vehicle.getPatchworkLocationWeight("right")).toBe(2);
        expect(vehicle.getPatchworkLocationWeight("rear")).toBe(1.5);
        expect(vehicle.getPatchworkLocationWeight("turret")).toBe(2);
        expect(vehicle.getArmorWeight()).toBe(10);
        expect(vehicle.getWeights().find((row) => row.name === "Armor")?.weight).toBe(10);
    });

    it("takes the vehicle column's item slots in each location that carries the type", () => {
        const vehicle = patchworkTank();
        expect(vehicle.getPatchworkLocationSlots("front")).toBe(1);
        expect(vehicle.getPatchworkLocationSlots("left")).toBe(1);
        expect(vehicle.getPatchworkLocationSlots("right")).toBe(0);
        expect(vehicle.getArmorItemSlots()).toBe(2);
        // Heavy Ferro-Fibrous: 3 slots as the only armor, 2 per location as patchwork.
        vehicle.setPatchworkArmorType("rear", "heavy-ferro-fibrous");
        expect(vehicle.getPatchworkLocationSlots("rear")).toBe(2);
        expect(vehicle.getArmorItemSlots()).toBe(4);
    });

    it("applies each location's Battle Value modifier and cost per ton", () => {
        const vehicle = patchworkTank();
        expect(vehicle.getBattleValueLog()).toContain("Armor (Front): 40 points x 2.5 x 1.5 (Reactive Armor) = 150.00");
        expect(vehicle.getBattleValueLog()).toContain("Armor (Left): 30 points x 2.5 x 1 (Ferro Fibrous) = 75.00");
        expect(vehicle.getCBillCostLog()).toContain("Armor, Front (Reactive Armor, 2.5 t)");
        expect(vehicle.getCBillCostLog()).toContain("Armor, Left (Ferro Fibrous, 2 t)");

        const standard = patchworkTank();
        standard.setPatchworkArmorType("front", "standard");
        expect(vehicle.getBattleValue()).toBeGreaterThan(standard.getBattleValue());
    });

    it("groups like armor for the Alpha Strike armor value (ASC errata v1.6, p.97)", () => {
        const vehicle = patchworkTank();
        // 150 points: 5.
        expect(vehicle.getAlphaStrikeArmor()).toBe(5);
        // Hardened doubles its own 40 points: 190 / 30 = 6.33.
        vehicle.setPatchworkArmorType("front", "hardened");
        expect(vehicle.getAlphaStrikeArmor()).toBe(6);
    });

    it("keeps Hardened armor off Hover vehicles, location by location", () => {
        const vehicle = patchworkTank();
        expect(vehicle.setPatchworkArmorType("rear", "hardened").tag).toBe("hardened");
        vehicle.setMotiveType("hover");
        expect(vehicle.getPatchworkArmorType("rear").tag).toBe("standard");
        expect(vehicle.getAvailablePatchworkArmorTypes(3).map((armor) => armor.tag)).not.toContain("hardened");
        expect(vehicle.setPatchworkArmorType("rear", "hardened").tag).toBe("standard");
    });

    it("offers only armor the table gives Combat Vehicle slots for, and never patchwork itself", () => {
        const tags = tank().getAvailablePatchworkArmorTypes(3).map((armor) => armor.tag);
        expect(tags).toEqual(expect.arrayContaining(["standard", "ferro-fibrous", "light-ferro-fibrous", "heavy-ferro-fibrous",
            "vehicular-stealth", "hardened", "laser-reflective", "reactive"]));
        expect(tags).not.toContain("patchwork");
        // Modular armor "is treated as an item, not as armor"; the prototype is not on the table.
        expect(tags).not.toContain("modular");
        expect(tags).not.toContain("ferro-fibrous-prototype");
    });

    it("forgets the location types when the armor type changes", () => {
        const vehicle = patchworkTank();
        vehicle.setArmorType("standard");
        vehicle.setArmorType("patchwork");
        expect(vehicle.getPatchworkArmorType("front").tag).toBe("standard");
    });

    it("fills the most armor whose per-location weights fit the tonnage free", () => {
        const points = (vehicle: Vehicle) => Object.values(vehicle.getArmorAllocation()).reduce((sum: number, value) => sum + (value ?? 0), 0);
        const vehicle = patchworkTank();
        vehicle.allocateMaxArmor();
        expect(vehicle.getRemainingTonnage()).toBeGreaterThanOrEqual(0);
        expect(points(vehicle)).toBe(vehicle.getMaxArmorPoints());

        // With little tonnage free, the points stop where the next one would not fit.
        const tight = patchworkTank();
        tight.setCruiseMP(5);
        while (tight.getRemainingTonnage() > 4) tight.addEquipmentFromTag("medium-laser");
        const budget = tight.getArmorWeight() + tight.getRemainingTonnage();
        tight.allocateMaxArmor();
        expect(tight.getArmorWeight()).toBeLessThanOrEqual(budget);
        expect(points(tight)).toBeLessThan(tight.getMaxArmorPoints());
        expect(points(tight)).toBeGreaterThan(points(patchworkTank()));
    });

    it("names each location's armor for the record sheet", () => {
        expect(patchworkTank().getArmorDescription())
            .toBe("Patchwork Armor (Front: Reactive Armor, Left: Ferro Fibrous, Right: Standard, Rear: Standard, Turret: Standard)");
        expect(tank().getArmorDescription()).toBe("Standard");
    });

    it("saves and reloads the location types, replacing one it cannot carry", () => {
        const vehicle = patchworkTank();
        const saved = vehicle.export();
        expect(saved.patchworkArmor).toMatchObject({ front: "reactive", left: "ferro-fibrous", right: "standard" });

        const loaded = new Vehicle(JSON.stringify(saved));
        expect(loaded.getPatchworkArmorType("front").tag).toBe("reactive");
        expect(loaded.getArmorWeight()).toBe(10);
        expect(loaded.getImportIssues()).toEqual([]);

        const bad = new Vehicle(JSON.stringify({ ...saved, patchworkArmor: { ...saved.patchworkArmor, rear: "ferro-lamellor" } }));
        expect(bad.getPatchworkArmorType("rear").tag).toBe("standard");
        expect(bad.getImportIssues().join(" ")).toContain('Replaced patchwork armor "ferro-lamellor" (Rear)');
    });
});
