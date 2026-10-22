import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";

// Transport bays, communications equipment, ejection seats, Light and Medium weapons, pintles, extended fuel
// tanks, Tractors and Trailers on Combat and Support Vehicles (TM pp.131-137, 209-244; TW pp.205-206).
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

const combatVehicle = (motive: string, tons: number, engine: string = "ice"): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType(motive);
    vehicle.setTonnage(tons);
    vehicle.setEngineType(engine);
    vehicle.setCruiseMP(4);
    return vehicle;
};

describe("Transport bays on vehicles (TM p.239, errata v8.0)", () => {
    it("weighs, slots and prices bays: 1 slot a bay, 1 per container, one for all infantry bays of a type", () => {
        const vehicle = combatVehicle("tracked", 60);
        const slots = vehicle.getUsedItemSlots();
        vehicle.addBay("cargo");
        vehicle.setBay(0, 5, 0);
        vehicle.addBay("infantry-foot");
        vehicle.addBay("infantry-foot");
        vehicle.addBay("cargo-container");
        vehicle.setBay(3, 2, 0);
        expect(vehicle.getBaysWeight()).toBe(5 + 5 + 5 + 20);
        // Cargo 1, both foot bays 1, two containers 2.
        expect(vehicle.getUsedItemSlots()).toBe(slots + 4);
        expect(vehicle.getCBillCostLog()).toContain("Transport Bays and Doors");
        expect(vehicle.getAlphaStrikeStats().specialAbilities).toEqual(expect.arrayContaining(["CT25", "IT10"]));
    });

    it("gives unit bays their Alpha Strike transport specials and doors", () => {
        const vehicle = supportVehicle("naval-surface", 300);
        vehicle.addBay("vehicle-light");
        vehicle.setBay(0, 3, 3);
        expect(vehicle.getAlphaStrikeStats().specialAbilities).toEqual(expect.arrayContaining(["VTM3-D3", "MFB"]));
    });

    it("models the Simca's 136 kg cargo bay and rear door (TM p.137)", () => {
        const vehicle = supportVehicle("wheeled", 2.5);
        vehicle.setSupportVehicleEngine("ice");
        vehicle.setCruiseMP(7);
        vehicle.setSupportVehicleFuel(0.042);
        vehicle.setSupportVehicleExtraCrew(2);
        add(vehicle, "seating-standard", 7);
        add(vehicle, "paramedic-equipment", 4);
        vehicle.addBay("cargo");
        vehicle.setBay(0, 0.136, 1);
        expect(vehicle.getRemainingTonnage()).toBe(0);
        expect(vehicle.getUsedItemSlots()).toBe(5);
        expect(vehicle.getCBillCost()).toBe(Math.round((4043.75 + 30700 + 1000) * (1 + 2.5 / 200)));
        expect(vehicle.getSupportVehicleIssues()).toEqual([]);
    });

    it("limits bay doors and wants a door on a Large Support Vehicle's unit bays (TM p.209)", () => {
        const vehicle = supportVehicle("tracked", 150);
        vehicle.addBay("vehicle-light");
        vehicle.setBay(0, 1, 0);
        expect(vehicle.getSupportVehicleIssues().join(" ")).toContain("needs a bay door");
        // 7 + 1 per 50,000 tons, rounded up: 8.
        vehicle.setBay(0, 1, 8);
        expect(vehicle.getSupportVehicleIssues().join(" ")).not.toContain("at most 8");
        vehicle.setBay(0, 1, 9);
        expect(vehicle.getSupportVehicleIssues().join(" ")).toContain("at most 8");
    });

    it("saves bays and drops ones it does not know", () => {
        const vehicle = combatVehicle("wheeled", 40);
        vehicle.addBay("cargo-liquid");
        vehicle.setBay(0, 2.5, 1);
        const saved = vehicle.export();
        expect(new Vehicle(JSON.stringify(saved)).getBays()).toEqual([{ tag: "cargo-liquid", amount: 2.5, doors: 1 }]);
        const tampered = new Vehicle(JSON.stringify({ ...saved, bays: [{ tag: "warp-core", amount: 1, doors: 0 }, { tag: "cargo", amount: -4, doors: 9e9 }] }));
        expect(tampered.getBays()).toEqual([{ tag: "cargo", amount: 0.001, doors: 1000 }]);
        expect(tampered.getImportIssues()).toContain("Dropped transport bays that could not be read");
    });
});

describe("Communications equipment and ejection seats (TM pp.212-213)", () => {
    it("takes one slot for the whole set, adds a crewman a ton, and gives MHQ and RCN", () => {
        const vehicle = supportVehicle("wheeled", 40);
        const slots = vehicle.getUsedItemSlots();
        const crew = vehicle.getCrew();
        add(vehicle, "communications-equipment", 2);
        expect(vehicle.getCommunicationsTons()).toBe(2);
        expect(vehicle.getUsedItemSlots()).toBe(slots + 1);
        // 2 crew + 2 for the equipment: 4 non-officers need an officer (TM p.131).
        expect(crew).toBe(2);
        expect(vehicle.getCrew()).toBe(5);
        // 2 tons is a twentieth of 40.
        expect(vehicle.getAlphaStrikeStats().specialAbilities).toEqual(expect.arrayContaining(["MHQ2", "RCN"]));
        add(vehicle, "communications-equipment", 14);
        expect(vehicle.getSupportVehicleIssues().join(" ")).toContain("at most 15");
    });

    it("allows the Support Vehicle ejection seat on Small vehicles and VTOLs only, as a seat", () => {
        const small = supportVehicle("wheeled", 2);
        add(small, "support-vehicle-ejection-seat");
        expect(small.getSupportVehicleIssues().join(" ")).not.toContain("seat for each");
        const truck = supportVehicle("wheeled", 20);
        add(truck, "support-vehicle-ejection-seat");
        expect(truck.getSupportVehicleIssues().join(" ")).toContain("ejection seats");
        const vtol = supportVehicle("vtol", 20);
        add(vtol, "support-vehicle-ejection-seat");
        expect(vtol.getSupportVehicleIssues().join(" ")).not.toContain("ejection seats");
    });
});

describe("Light and Medium weapons and pintles on Small Support Vehicles (TM pp.136-137, 234)", () => {
    const jeep = (): Vehicle => {
        const vehicle = supportVehicle("wheeled", 3);
        vehicle.setSupportVehicleEngine("ice");
        vehicle.setCruiseMP(6);
        return vehicle;
    };

    it("mounts a Support weapon as a Medium weapon: kilograms with its clips, damage rounded, ranges x1/x2/x3", () => {
        const vehicle = jeep();
        const laser = vehicle.addLightWeapon("inf-support-pulse-laser", "front", 2);
        expect(laser).not.toBeNull();
        // 150 kg with one clip, 3 kg per extra clip.
        expect(laser!.weight).toBeCloseTo(0.156, 6);
        // Base damage 0.81 rounds to 1; Base Range 3.
        expect(laser!.damage).toBe(1);
        expect(laser!.range).toEqual({ min: 0, short: 3, medium: 6, long: 9 });
        expect(vehicle.getItemSlots(laser!)).toBe(1);
        expect(vehicle.getSupportVehicleIssues().join(" ")).not.toContain("heavy weapons");
    });

    it("weighs a pintle at 5 percent of its weapons, rounded up to the kilogram, and counts gunners by fire control", () => {
        const vehicle = jeep();
        const laser = vehicle.addLightWeapon("inf-support-pulse-laser", "left", 0, true)!;
        expect(laser.pintle).toBe(true);
        // 150 kg x 5% = 7.5 kg, rounded up to 8.
        expect(vehicle.getPintleWeight()).toBe(0.008);
        // No fire control: the weapon's own crew of 2, plus the driver.
        expect(vehicle.getSupportVehicleMinimumCrew()).toBe(3);
        vehicle.setSupportVehicleFireControl("basic");
        expect(vehicle.getSupportVehicleMinimumCrew()).toBe(2);
        vehicle.setSupportVehicleFireControl("advanced");
        expect(vehicle.getSupportVehicleMinimumCrew()).toBe(1);
    });

    it("keeps Light and Medium weapons off vehicles of 5 tons or more, and pintles off naval vehicles", () => {
        const truck = supportVehicle("wheeled", 10);
        expect(truck.addLightWeapon("inf-support-pulse-laser", "front")).toBeNull();
        const boat = supportVehicle("naval-surface", 3);
        const gun = boat.addLightWeapon("inf-support-pulse-laser", "front", 0, true)!;
        expect(gun.pintle).toBe(false);
    });

    it("saves the clips and pintle of a Light or Medium weapon", () => {
        const vehicle = jeep();
        vehicle.addLightWeapon("inf-support-pulse-laser", "rear", 3, true);
        const loaded = new Vehicle(vehicle.exportJSON());
        const laser = loaded.getEquipmentList().find((item) => item.tag === "sv-light-weapon-inf-support-pulse-laser");
        expect(laser?.size).toBe(3);
        expect(laser?.pintle).toBe(true);
        expect(laser?.weight).toBeCloseTo(0.159, 6);
    });
});

describe("Extended fuel tanks (TM p.244, errata v8.0)", () => {
    it("lets an ICE Combat Vehicle carry them at 10 percent of the engine, rounded up to the half ton", () => {
        const vehicle = combatVehicle("wheeled", 40);
        const tank = vehicle.getAvailableEquipment().find((item) => item.tag === "extended-fuel-tank");
        expect(tank?.available).toBe(true);
        add(vehicle, "extended-fuel-tank");
        const mounted = vehicle.getEquipmentList().find((item) => item.tag === "extended-fuel-tank")!;
        expect(mounted.weight).toBe(Math.ceil(vehicle.getEngineWeight() / 10 * 2) / 2);
        expect(vehicle.carriesAmmo()).toBe(true);
        expect(vehicle.getAmmunitionExplosionDamage()).toBe(40 * mounted.weight);
    });

    it("keeps them off fusion Combat Vehicles and all Support Vehicles", () => {
        expect(combatVehicle("wheeled", 40, "standard").getAvailableEquipment().find((item) => item.tag === "extended-fuel-tank")?.available).toBe(false);
        expect(supportVehicle("wheeled", 40).getAvailableEquipment().find((item) => item.tag === "extended-fuel-tank")?.available).toBe(false);
    });
});

describe("Tractors, Trailers and Large Support Vehicles in play (TW pp.205-206)", () => {
    const tractor = (): Vehicle => {
        const vehicle = supportVehicle("wheeled", 40);
        vehicle.setSupportVehicleChassisModification("tractor", true);
        vehicle.setCruiseMP(6);
        return vehicle;
    };

    it("slows a Tractor by its Trailers' weight", () => {
        const vehicle = tractor();
        expect(vehicle.getMaxTowTons()).toBe(40);
        vehicle.setTowedTons(10);
        // Up to a quarter of its weight: 6 - min(3, 3) = 3; Flank 3 x 1.5 = 4.5, rounded up.
        expect(vehicle.getEffectiveCruiseMP()).toBe(3);
        expect(vehicle.getEffectiveFlankMP()).toBe(5);
        vehicle.setTowedTons(30);
        // More than a quarter: half, rounded down.
        expect(vehicle.getEffectiveCruiseMP()).toBe(3);
        vehicle.setTowedTons(500);
        expect(vehicle.getInPlay().towedTons).toBe(40);
    });

    it("lets a naval Tractor pull 5 times its weight", () => {
        const boat = supportVehicle("naval-surface", 100);
        boat.setSupportVehicleChassisModification("tractor", true);
        expect(boat.getMaxTowTons()).toBe(500);
    });

    it("makes an engineless Trailer an immobile target unless it is hitched", () => {
        const trailer = supportVehicle("wheeled", 20);
        trailer.setSupportVehicleChassisModification("trailer", true);
        trailer.setSupportVehicleEngine("none");
        expect(trailer.isImmobile()).toBe(true);
        trailer.setBeingTowed(true);
        expect(trailer.isImmobile()).toBe(false);
    });

    it("lets a Large Support Vehicle ignore the multiple-targets modifier", () => {
        expect(supportVehicle("tracked", 150).ignoresSecondaryTargetModifier()).toBe(true);
        expect(supportVehicle("tracked", 50).ignoresSecondaryTargetModifier()).toBe(false);
        expect(combatVehicle("tracked", 50).ignoresSecondaryTargetModifier()).toBe(false);
    });
});
