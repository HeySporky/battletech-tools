import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";
import BattleArmor from "./battle-armor";
import Building from "./building";
import CapitalShip from "./capital-ship";
import InfantryPlatoon from "./infantry-platoon";
import ProtoMech from "./protomech";
import SmallCraft from "./small-craft";
import Vehicle from "./vehicle";
import { getUnitTroAdapter } from "./unit-tro";

// TRO fields round 2: every other Classic type carries a Technical Readout and gives the shared sheet an adapter.
describe("Technical Readout on the other Classic unit types", () => {
    const makers = [
        { label: "vehicle", make: () => new Vehicle(), load: (json: string) => new Vehicle(json) },
        { label: "fighter", make: () => new AerospaceFighter(), load: (json: string) => new AerospaceFighter(json) },
        { label: "infantry platoon", make: () => new InfantryPlatoon(), load: (json: string) => new InfantryPlatoon(json) },
        { label: "battle armor", make: () => new BattleArmor(), load: (json: string) => new BattleArmor(json) },
        { label: "ProtoMech", make: () => new ProtoMech(), load: (json: string) => new ProtoMech(json) },
        { label: "Small Craft", make: () => new SmallCraft(), load: (json: string) => new SmallCraft(json) },
        { label: "capital ship", make: () => new CapitalShip(), load: (json: string) => new CapitalShip(json) },
        { label: "building", make: () => new Building(), load: (json: string) => new Building(json) },
    ];
    for (const { label, make, load } of makers) {
        it("saves and loads a " + label + "'s TRO and gives the sheet a title and construction rows", () => {
            const unit = make();
            unit.setName("Testudo");
            unit.tro.setProduction("manufacturer", "Kallon Industries");
            unit.tro.setText("overview", "A test design.");
            const loaded = load(unit.exportJSON());
            expect(loaded.tro.getProduction("manufacturer")).toBe("Kallon Industries");
            expect(loaded.tro.getText("overview")).toBe("A test design.");
            const adapter = getUnitTroAdapter(loaded);
            expect(adapter.getSpecValues().title).toBe("Testudo");
            expect(adapter.getConstructionRows().length).toBeGreaterThan(0);
        });
    }
});

describe("ProtoMech Technical Readout sheet", () => {
    it("gives the mass in tons, not kilograms", () => {
        const proto = new ProtoMech();
        proto.setTons(9);
        const spec = getUnitTroAdapter(proto).getSpecValues();
        expect(spec.mass).toBe("9 tons");
        expect(spec.subtitle).toContain("9 tons");
    });
});

// TRO 3039's Scorpion: 25 tons, 100 ICE engine, turret AC/5 and machine gun, 64 points of armor.
const scorpion = (): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType("tracked");
    vehicle.setTonnage(25);
    vehicle.setEngineType("ice");
    vehicle.setCruiseMP(4);
    vehicle.setHasTurret(true);
    ["front", "right", "left", "rear", "turret"].forEach((location, index) => vehicle.setArmorAllocation(location as never, [16, 11, 11, 10, 16][index]));
    for (const [tag, location, weight] of [["machine-gun", "turret"], ["autocannon-standard-b", "turret"], ["ammo-machine-gun-standard", "", 0.5], ["ammo-ac-5-standard", ""]] as [string, string, number?][]) {
        vehicle.addEquipmentFromTag(tag);
        const item = vehicle.getEquipmentList().at(-1)!;
        if (weight) item.weight = weight;
        if (location) vehicle.setEquipmentLocation(item.uuid!, location);
    }
    vehicle.setTonnage(25);
    return vehicle;
};

const totalMass = (rows: { mass?: string; heading?: boolean }[]): number =>
    Math.round(rows.filter((row) => !row.heading && row.mass).reduce((sum, row) => sum + Number(row.mass), 0) * 1000) / 1000;

describe("Vehicle Technical Readout construction table", () => {
    it("lists every ton of the Scorpion, the way TRO 3039 does", () => {
        const rows = getUnitTroAdapter(scorpion()).getConstructionRows();
        expect(totalMass(rows)).toBe(25);
        expect(rows.slice(0, 8)).toEqual([
            { label: "Internal Structure", mass: "2.5" },
            { label: "Internal Combustion Engine", value: "100", mass: "6" },
            { label: "Cruising MP", value: "4", indent: true },
            { label: "Flank MP", value: "6", indent: true },
            { label: "Heat Sinks", value: "0", mass: "0" },
            { label: "Control Systems", mass: "1.5" },
            { label: "Armor Factor (Standard)", value: "64", mass: "4" },
            { label: "Turret", mass: "1" },
        ]);
        expect(rows).toContainEqual({ label: "Internal Structure / Armor by location", heading: true });
        expect(rows).toContainEqual({ label: "Front", value: "3 / 16", indent: true });
        expect(rows).toContainEqual({ label: "Turret", value: "3 / 16", indent: true });
        expect(rows).toContainEqual({ label: "Autocannon/5", value: "Turret", mass: "8" });
        expect(rows).toContainEqual({ label: "AC/5 - Standard Ammo", value: "Body", mass: "1" });
    });

    it("names locations for the equipment makes, and leaves ammunition out of them", () => {
        const copies = getUnitTroAdapter(scorpion()).getEquipmentCopies();
        expect(copies.map((copy) => [copy.name, copy.locationLabel])).toEqual([["Machine Gun", "Turret"], ["Autocannon/5", "Turret"]]);
    });

    it("names a reinforced chassis and a jumping vehicle's Jumping MP", () => {
        const vehicle = scorpion();
        vehicle.setStructureType("reinforced");
        vehicle.setJumpMP(2);
        const rows = getUnitTroAdapter(vehicle).getConstructionRows();
        expect(rows[0].label).toBe("Internal Structure (Reinforced)");
        expect(rows).toContainEqual({ label: "Jumping MP", value: "2", indent: true });
        expect(getUnitTroAdapter(vehicle).getComponentRows()[0].label).toBe("Chassis (Reinforced)");
        expect(totalMass(rows)).toBe(vehicle.getCurrentTonnage());
    });

    it("adds up to a support vehicle's mass, kilogram items included", () => {
        const vehicle = new Vehicle();
        vehicle.setMotiveType("wheeled");
        vehicle.setSupportVehicle(true);
        vehicle.setHasTurret(false);
        vehicle.setTonnage(20);
        vehicle.setCruiseMP(4);
        vehicle.addEquipmentFromTag("machine-gun");
        vehicle.addEquipmentFromTag("ammo-machine-gun-standard");
        vehicle.getEquipmentList().at(-1)!.weight = 0.2;
        vehicle.setTonnage(20);
        const rows = getUnitTroAdapter(vehicle).getConstructionRows();
        expect(totalMass(rows)).toBe(vehicle.getCurrentTonnage());
        expect(rows.some((row) => row.label.startsWith("Items weighed in kilograms"))).toBe(true);
    });
});

// TechManual's TRB-D36 Thunderbird (TM p.313): 100 tons, Safe Thrust 5, SI 10, 224 points of armor, 25 heat sinks.
const thunderbird = (): AerospaceFighter => {
    const fighter = new AerospaceFighter();
    fighter.setTonnage(100);
    fighter.setSafeThrust(5);
    fighter.setFuelTons(5);
    fighter.setArmorAllocation("nose", 70);
    fighter.setArmorAllocation("leftWing", 52);
    fighter.setArmorAllocation("rightWing", 52);
    fighter.setArmorAllocation("aft", 50);
    fighter.setAdditionalHeatSinks(15);
    for (const arc of ["nose", "leftWing", "rightWing"]) fighter.addEquipmentFromTag("large-laser", arc);
    fighter.addEquipmentFromTag("lrm-20", "leftWing");
    fighter.addEquipmentFromTag("lrm-20", "rightWing");
    for (const arc of ["nose", "nose", "nose", "aft", "aft"]) fighter.addEquipmentFromTag("medium-laser", arc);
    for (let ton = 0; ton < 4; ton++) fighter.addEquipmentFromTag("ammo-lrm-standard");
    return fighter;
};

describe("Fighter Technical Readout construction table", () => {
    it("lists every ton of the Thunderbird, with thrust, structural integrity and armor by arc", () => {
        const fighter = thunderbird();
        const rows = getUnitTroAdapter(fighter).getConstructionRows();
        expect(totalMass(rows)).toBe(fighter.getCurrentTonnage());
        expect(rows[0].label).toMatch(/^Engine \(/);
        expect(rows.slice(1, 4)).toEqual([
            { label: "Safe Thrust", value: "5", indent: true },
            { label: "Maximum Thrust", value: "8", indent: true },
            { label: "Structural Integrity", value: "10", mass: "0" },
        ]);
        expect(rows.some((row) => row.label === "Cockpit and Controls" && row.mass === "3")).toBe(true);
        expect(rows.some((row) => row.label.startsWith("Fuel (") && row.mass === "5")).toBe(true);
        expect(rows.some((row) => row.label.startsWith("Heat Sinks (25") && row.mass === "15")).toBe(true);
        expect(rows).toContainEqual({ label: "Armor by location", heading: true });
        expect(rows).toContainEqual({ label: "Nose", value: "70", indent: true });
        expect(rows).toContainEqual({ label: "Aft", value: "50", indent: true });
        expect(rows).toContainEqual({ label: "Large Laser", value: "Left Wing", mass: "5" });
        expect(rows.filter((row) => row.label === fighter.getEquipmentList().at(-1)!.name)).toHaveLength(4);
    });

    it("names arcs for the equipment makes, and leaves ammunition out of them", () => {
        const copies = getUnitTroAdapter(thunderbird()).getEquipmentCopies();
        expect(copies).toHaveLength(10);
        expect(copies[0].locationLabel).toBe("Nose");
        expect(copies.at(-1)!.locationLabel).toBe("Aft");
    });

    it("adds up to a support aircraft's mass and gives its structural integrity", () => {
        const fighter = new AerospaceFighter();
        fighter.setFighterType("support");
        fighter.setSupportMotive("fixed-wing");
        fighter.setTonnage(35);
        fighter.setSafeThrust(4);
        fighter.setFuelTons(8.5);
        fighter.addEquipmentFromTag("quarters-officer", "fuselage");
        const rows = getUnitTroAdapter(fighter).getConstructionRows();
        expect(totalMass(rows)).toBe(fighter.getCurrentTonnage());
        expect(rows[0]).toEqual({ label: "Chassis (Structural Integrity)", value: `${fighter.getStructuralIntegrity()}`, mass: `${fighter.getStructureWeight()}` });
    });
});

describe("Infantry Technical Readout construction table", () => {
    // TechManual's worked example: Eberhard's Marian Hegemony foot platoon, auto-rifles and 2 support machine guns a squad.
    const eberhard = (): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setFormation("marian-hegemony")).toBe(true);
        expect(platoon.setPrimaryWeapon("inf-auto-rifle")).toBe(true);
        expect(platoon.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
        platoon.setSecondaryPerSquad(2);
        return platoon;
    };

    it("prints transport weight, tech base, movement, formation, platoon make-up and armor, then the weapons", () => {
        const platoon = eberhard();
        const rows = getUnitTroAdapter(platoon).getConstructionRows();
        expect(rows[0]).toEqual({ label: "Transport Weight", mass: `${platoon.getWeight()}` });
        expect(rows).toContainEqual({ label: "Tech Base", value: "Inner Sphere" });
        expect(rows).toContainEqual({ label: `Motive (${platoon.getMotive().name})`, value: platoon.getMovementText() });
        expect(rows).toContainEqual({ label: "Formation", value: platoon.getFormation().name });
        expect(rows).toContainEqual({ label: "Platoon", value: `${platoon.getSquads()} squads of ${platoon.getSquadSize()} (${platoon.getTroopers()} troopers)` });
        expect(rows).toContainEqual({ label: "Armor Kit (None)", value: "Damage Divisor 1" });
        expect(rows).toContainEqual({ label: "Weapons and Equipment", value: "Location", mass: "Mass", heading: true });
        expect(rows).toContainEqual({ label: platoon.getSecondaryWeapon()!.name, value: `${platoon.getSecondaryCount()} troopers (2 per squad)`, mass: undefined });
    });

    it("names the special features and the anti-'Mech training", () => {
        const platoon = eberhard();
        platoon.setAntiMechKit(true);
        const rows = getUnitTroAdapter(platoon).getConstructionRows();
        expect(rows).toContainEqual({ label: "Anti-'Mech Training", value: `Skill ${platoon.getAntiMechSkill()}` });
        // Two support machine guns a squad give heavy burst (TM p.150).
        expect(rows).toContainEqual({ label: "Special Features", value: "B" });
    });
});

describe("Small Craft Technical Readout construction table", () => {
    // The Aquarius Escort (TRO:3075): 200 tons, aerodyne, two large lasers in the nose, LRM/SRM pairs in the wings.
    const aquarius = (): SmallCraft => {
        const craft = new SmallCraft();
        craft.setName("Aquarius Escort");
        craft.setTonnage(200);
        craft.setSafeThrust(4);
        craft.setFuelTons(6);
        craft.setStructuralIntegrity(8);
        craft.setArmorTons(36);
        craft.setArmorAllocation("nose", 183);
        craft.setArmorAllocation("left", 162);
        craft.setArmorAllocation("right", 162);
        craft.setArmorAllocation("aft", 101);
        craft.setAdditionalHeatSinks(32);
        craft.addEquipmentFromTag("large-laser", "nose");
        craft.addEquipmentFromTag("lrm-10", "left");
        craft.addEquipmentFromTag("medium-laser", "rightAft");
        craft.setQuarters("crew", 3);
        craft.addBay("cargo", 9);
        return craft;
    };

    it("lists every ton, with thrust under the engine, armor by side, then the weapons", () => {
        const craft = aquarius();
        const rows = getUnitTroAdapter(craft).getConstructionRows();
        expect(totalMass(rows)).toBe(craft.getCurrentTonnage());
        expect(rows[0].label).toMatch(/^Engine \(/);
        expect(rows.slice(1, 3)).toEqual([
            { label: "Safe Thrust", value: "4", indent: true },
            { label: "Maximum Thrust", value: "6", indent: true },
        ]);
        expect(rows).toContainEqual({ label: "Armor by location", heading: true });
        expect(rows).toContainEqual({ label: "Nose", value: "183", indent: true });
        expect(rows).toContainEqual({ label: "Left Wing", value: "162", indent: true });
        expect(rows).toContainEqual({ label: "Large Laser", value: "Nose", mass: "5" });
        expect(rows).toContainEqual({ label: "Medium Laser", value: "Right Wing (Rear)", mass: "1" });
        // Quarters and bays belong with the hull, above the weapons.
        const heading = rows.findIndex((row) => row.label === "Weapons and Equipment");
        const cargo = rows.findIndex((row) => row.label.startsWith("Cargo"));
        expect(cargo).toBeGreaterThan(-1);
        expect(cargo).toBeLessThan(heading);
    });

    it("gives the spec block and the equipment makes by arc, capital weapons included", () => {
        const craft = aquarius();
        const adapter = getUnitTroAdapter(craft);
        expect(adapter.getSpecValues()).toMatchObject({ title: "Aquarius Escort", mass: "200 tons", cruisingSpeed: "Safe Thrust 4", maximumSpeed: "Maximum Thrust 6" });
        expect(adapter.getSpecValues().subtitle).toContain("Small Craft");
        const copies = adapter.getEquipmentCopies();
        expect(copies.map((copy) => copy.locationLabel)).toEqual(["Nose", "Left Wing", "Right Wing (Rear)"]);
        expect(copies.every((copy) => copy.uuid)).toBe(true);
    });

    it("gives a DropShip's capital weapons a make and a construction row", () => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setTonnage(3000);
        ship.setSafeThrust(3);
        const mount = ship.addCapitalWeapon("barracuda", "nose");
        expect(mount).not.toBeNull();
        const adapter = getUnitTroAdapter(ship);
        expect(adapter.getSpecValues().subtitle).toContain("DropShip");
        expect(adapter.getEquipmentCopies()).toEqual([expect.objectContaining({ uuid: mount!.uuid, name: "Barracuda", locationLabel: "Nose" })]);
        expect(adapter.getConstructionRows().some((row) => row.label.startsWith("Barracuda") && row.value === "Nose")).toBe(true);
        expect(totalMass(adapter.getConstructionRows())).toBe(ship.getCurrentTonnage());
    });
});

describe("Capital ship Technical Readout construction table", () => {
    // A WarShip on the Vincent Mk 39's lines (SO:AA p.132): NAC/10s and large lasers in the fore and broadside arcs.
    const warShip = (): CapitalShip => {
        const ship = new CapitalShip();
        ship.setName("Vincent");
        ship.setModel("Mk 39");
        ship.setShipType("warShip");
        ship.setTonnage(420000);
        ship.setSafeThrust(4);
        ship.setStructuralIntegrity(40);
        ship.setArmorTons(104);
        ship.setArmorAllocation("nose", 12);
        const nac = ship.addCapitalWeapon("nac-10", "foreLeft");
        ship.setCapitalWeaponShots(nac!.uuid, "nac-10", 50);
        ship.addEquipmentFromTag("large-laser", "leftBroadside");
        ship.setQuarters("crew", 20);
        ship.addBay("cargo", 1000);
        ship.setDockingCollars(2);
        return ship;
    };

    it("lists every ton, with thrust under the engine, armor by facing, then the weapons", () => {
        const ship = warShip();
        const rows = getUnitTroAdapter(ship).getConstructionRows();
        expect(totalMass(rows)).toBe(ship.getCurrentTonnage());
        const engine = rows.findIndex((row) => row.label.startsWith("Engine"));
        expect(rows.slice(engine + 1, engine + 3)).toEqual([
            { label: "Safe Thrust", value: "4", indent: true },
            { label: "Maximum Thrust", value: "6", indent: true },
        ]);
        expect(rows).toContainEqual({ label: "Armor by location", heading: true });
        expect(rows).toContainEqual({ label: "Nose", value: `${12 + ship.getFreeArmorPerFacing()}`, indent: true });
        expect(rows).toContainEqual({ label: "Aft-Right", value: `${ship.getFreeArmorPerFacing()}`, indent: true });
        expect(rows).toContainEqual({ label: "Large Laser", value: "Left Broadside", mass: "5" });
        expect(rows.some((row) => row.label.startsWith("NAC/10 (50 shots)") && row.value === "Fore-Left")).toBe(true);
        // Quarters, bays and docking collars belong with the hull, above the weapons.
        const heading = rows.findIndex((row) => row.label === "Weapons and Equipment");
        for (const label of ["Cargo", "Docking Collars", "Quarters"]) {
            const index = rows.findIndex((row) => row.label.startsWith(label));
            expect(index, label).toBeGreaterThan(-1);
            expect(index, label).toBeLessThan(heading);
        }
    });

    it("gives the spec block, a K-F drive make, and the equipment makes by arc, capital weapons included", () => {
        const ship = warShip();
        const adapter = getUnitTroAdapter(ship);
        expect(adapter.getSpecValues()).toMatchObject({ title: "Vincent", mass: "420,000 tons", cruisingSpeed: "Safe Thrust 4", maximumSpeed: "Maximum Thrust 6" });
        expect(adapter.getSpecValues().subtitle).toContain("WarShip");
        expect(adapter.getComponentRows().map((row) => row.key)).toEqual(["chassis", "engine", "kfDrive", "armor"]);
        const copies = adapter.getEquipmentCopies();
        expect(copies.map((copy) => copy.locationLabel)).toEqual(["Left Broadside", "Fore-Left"]);
        expect(copies.every((copy) => copy.uuid)).toBe(true);
    });

    it("gives a space station a station-keeping drive and no K-F drive make", () => {
        const station = new CapitalShip();
        station.setShipType("spaceStation");
        station.setTonnage(100000);
        const adapter = getUnitTroAdapter(station);
        expect(adapter.getSpecValues().cruisingSpeed).toBe("Station-keeping");
        expect(adapter.getSpecValues().maximumSpeed).toBeUndefined();
        expect(adapter.getComponentRows().map((row) => row.key)).toEqual(["chassis", "engine", "armor"]);
        expect(totalMass(adapter.getConstructionRows())).toBe(station.getCurrentTonnage());
    });
});

describe("Building Technical Readout construction table", () => {
    // Tara's central fortress (TO:AR pp.127-131): Hardened, CF 150, 6 hexes, 5 levels, 9 tons of armor a hex.
    const fortress = (): Building => {
        const building = new Building();
        building.setName("Tara Citadel");
        building.setClassification("fortress");
        building.setType("hardened");
        building.setCF(150);
        building.setHexes(6);
        building.setLevels(5);
        building.setArmorTons(9);
        building.setGenerator("fusion");
        building.setHeatSinks(60);
        building.addEquipmentFromTag("medium-laser", 2, true);
        const laser = building.addCapitalWeapon("nl35")!;
        building.setCapitalWeaponSharedHexes(laser.uuid, [2]);
        return building;
    };

    it("gives the superstructure, size and capacity, every ton of the load, then the weapons by hex", () => {
        const building = fortress();
        const rows = getUnitTroAdapter(building).getConstructionRows();
        expect(totalMass(rows)).toBe(building.getTotalWeight());
        expect(rows[0]).toEqual({ label: "Superstructure (Hardened Fortress)", value: "CF 150" });
        expect(rows).toContainEqual({ label: "Size", value: "6 hexes, 5 levels" });
        expect(rows).toContainEqual({ label: "Weight Capacity", value: `${building.getTotalWeight()} of ${building.getTotalCapacity()} tons used` });
        expect(rows).toContainEqual({ label: "Medium Laser (T)", value: "Hex 2", mass: "1" });
        expect(rows.some((row) => row.label.startsWith("NL35") && row.value === "Hex 1 with 2")).toBe(true);
        const heading = rows.findIndex((row) => row.label === "Weapons and Equipment");
        expect(rows.findIndex((row) => row.label.startsWith("Armor"))).toBeLessThan(heading);
        expect(rows.findIndex((row) => row.label.endsWith("Generator"))).toBeLessThan(heading);
        expect(rows.findIndex((row) => row.label === "Capital Fire Control")).toBeGreaterThan(heading);
    });

    it("gives the spec block, a generator make, and the equipment makes by hex", () => {
        const building = fortress();
        const adapter = getUnitTroAdapter(building);
        const spec = adapter.getSpecValues();
        expect(spec).toMatchObject({ title: "Tara Citadel", armorType: `${building.getArmorPoints()} points a hex` });
        expect(spec.mass).toBeUndefined();
        expect(spec.subtitle).toContain("Hardened Fortress");
        expect(spec.subtitle).toContain("6 hexes, 5 levels");
        expect(adapter.getComponentRows().map((row) => row.key)).toEqual(["chassis", "engine", "armor"]);
        const copies = adapter.getEquipmentCopies();
        expect(copies.map((copy) => copy.locationLabel)).toEqual(["Hex 2", "Hex 1 with 2"]);
        expect(copies.every((copy) => copy.uuid)).toBe(true);
    });

    it("names its modifications, and gives a building on the local grid no generator make", () => {
        const building = new Building();
        building.setClassification("standard");
        building.setSealed(true);
        building.setCeilings("high");
        const adapter = getUnitTroAdapter(building);
        expect(adapter.getConstructionRows()).toContainEqual({ label: "Modifications", value: "Environmentally sealed, high ceilings" });
        expect(adapter.getComponentRows().map((row) => row.key)).not.toContain("engine");
        expect(adapter.getSpecValues().title).toBe(building.getDisplayName());
    });
});
