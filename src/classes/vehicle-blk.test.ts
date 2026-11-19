import { describe, expect, it } from "vitest";
import { importFixedWingSupportBlk, importSupportVehicleBlk, importVehicleBlk } from "./vehicle-blk";
import Vehicle from "./vehicle";

// Synthetic MegaMek files: the shape of a MegaMekLab save, with made-up designs.
const block = (tag: string, ...lines: string[]): string[] => [`<${tag}>`, ...lines, `</${tag}>`];

describe("MegaMek Support Vehicle import", () => {
    const tank = [
        ...block("UnitType", "SupportTank"), ...block("Name", "Test Hauler"), ...block("Model", "TH-1"), ...block("year", "3050"),
        ...block("type", "IS Level 2"), ...block("motion_type", "Wheeled"), ...block("cruiseMP", "4"), ...block("engine_type", "0"),
        ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "7"),
        ...block("armor_type", "43"), ...block("armor", "10", "8", "8", "6"),
        ...block("Front Equipment", "Machine Gun", "No Such Gun"), ...block("Body Equipment", "IS Ammo MG - Half"),
        ...block("transporters", "cargobay:4.0:1:1::-1:0"), ...block("fuel", "1.0"), ...block("tonnage", "20.0"),
    ].join("\n");

    it("reads a ground Support Vehicle: motive, engine, BAR, armor, equipment, half-ton ammunition, cargo and fuel", () => {
        const { vehicle, issues } = importSupportVehicleBlk(tank);
        expect(vehicle).not.toBeNull();
        expect(vehicle?.getMotiveType().tag).toBe("wheeled");
        expect(vehicle?.getTonnage()).toBe(20);
        expect(vehicle?.getSupportVehicleEngine()?.tag).toBe("ice");
        expect(vehicle?.getBAR()).toBe(7);
        expect(vehicle?.getTotalArmorPoints()).toBe(32);
        const gun = vehicle?.getEquipmentList().find((item) => item.tag === "machine-gun");
        expect(gun?.location).toBe("front");
        // "- Half" is a half-ton lot of machine gun rounds (TM pp.107, 137).
        const ammo = vehicle?.getEquipmentList().find((item) => item.isAmmo);
        expect(ammo && vehicle?.isHalfTonBin(ammo)).toBe(true);
        expect(vehicle?.getBays().map((bay) => [bay.tag, bay.amount])).toEqual([["cargo", 4]]);
        expect(vehicle?.getSupportVehicleFuelWeight()).toBe(1);
        expect(issues).toEqual(["\"No Such Gun\" has no match in this catalog and was left off."]);
    });

    it("reads fire control wherever the file lists it (Brunel Dump Truck AC20 lists it in the Rear block)", () => {
        const { vehicle } = importSupportVehicleBlk(tank.replace("<Front Equipment>", "<Rear Equipment>\nBasic Fire Control\n</Rear Equipment>\n<Front Equipment>"));
        expect(vehicle?.getSupportVehicleFireControl()).toBe("basic");
    });

    it("brings the file's quirks across, on the weapon it names", () => {
        const { vehicle, issues } = importSupportVehicleBlk(`${tank}\n<quirks>\nlow_profile\n</quirks>\n<weaponQuirks>\naccurate:FR:0:Machine Gun\n</weaponQuirks>`);
        const gun = vehicle!.getEquipmentList().find((item) => item.tag === "machine-gun")!;
        expect(vehicle!.quirks.getAll()).toEqual([{ tag: "quirk-narrow-low-profile" }, { tag: "quirk-accurate-weapon", equipmentUuid: gun.uuid }]);
        expect(issues).toEqual(["\"No Such Gun\" has no match in this catalog and was left off."]);
    });

    it("brings the file's Technical Readout fields across (TRO fields, #78)", () => {
        const { vehicle } = importSupportVehicleBlk(`${tank}\n<manufacturer>\nAgromotive\n</manufacturer>\n<systemManufacturers>\nENGINE:Nissan\nCHASSIS:Hauler\n</systemManufacturers>\n<overview>\n<p>A farm hauler.</p>\n</overview>`);
        expect(vehicle!.tro.getProduction("manufacturer")).toBe("Agromotive");
        expect(vehicle!.tro.getComponent("engine")).toBe("Nissan");
        expect(vehicle!.tro.getComponent("chassis")).toBe("Hauler");
        expect(vehicle!.tro.getText("overview")).toBe("A farm hauler.");
    });

    it("refuses files that are not ground or VTOL Support Vehicles", () => {
        expect(importSupportVehicleBlk(tank.replace("SupportTank", "Tank")).vehicle).toBeNull();
        expect(importSupportVehicleBlk("not a unit file").vehicle).toBeNull();
    });
});

describe("MegaMek Combat Vehicle import", () => {
    const tank = [
        ...block("UnitType", "Tank"), ...block("Name", "Test Tank"), ...block("Model", "TT-2"), ...block("year", "3060"),
        ...block("type", "IS Level 2"), ...block("motion_type", "Tracked"), ...block("cruiseMP", "4"), ...block("engine_type", "2"),
        ...block("armor_type", "1"), ...block("armor_tech_level", "1"), ...block("armor", "30", "20", "20", "15", "25"),
        ...block("Front Equipment", "ISSRM6", "ISSRM6"), ...block("Right Equipment", "Machine Gun"), ...block("Left Equipment"), ...block("Rear Equipment"),
        ...block("Turret Equipment", "Medium Laser"),
        ...block("Body Equipment", "ISSRM6 Ammo", "ISCASE", "ISLimitedAmphibiousChassis", "IS Ammo MG - Half"), ...block("tonnage", "50.0"),
    ].join("\n");

    it("reads a tracked tank: engine, armor type and points, turret, equipment, ammunition, CASE and chassis modification", () => {
        const { vehicle, issues } = importVehicleBlk(tank);
        expect(issues).toEqual([]);
        expect(vehicle!.isSupportVehicle()).toBe(false);
        expect(vehicle!.getMotiveType().tag).toBe("tracked");
        expect(vehicle!.getTonnage()).toBe(50);
        expect(vehicle!.getCruiseMP()).toBe(4);
        expect(vehicle!.getEngineType().tag).toBe("xl");
        expect(vehicle!.getArmorType().tag).toBe("ferro-fibrous");
        expect(vehicle!.getTotalArmorPoints()).toBe(110);
        expect(vehicle!.hasTurret()).toBe(true);
        expect(vehicle!.getEquipmentList().filter((item) => item.location === "front")).toHaveLength(2);
        expect(vehicle!.getEquipmentList().find((item) => item.location === "turret")?.tag).toBe("medium-laser");
        expect(vehicle!.getEquipmentList().filter((item) => item.isAmmo)).toHaveLength(2);
        expect(vehicle!.getChassisModifications().map((mod) => mod.tag)).toEqual(["limited-amphibious"]);
    });

    it("reads a Clan engine and a VTOL's rotor and chin turret", () => {
        const vtol = [
            ...block("UnitType", "VTOL"), ...block("Name", "Test Copter"), ...block("year", "3060"), ...block("type", "Clan Level 2"),
            ...block("motion_type", "VTOL"), ...block("cruiseMP", "8"), ...block("engine_type", "2"), ...block("armor_type", "0"),
            ...block("armor", "8", "6", "6", "4", "2", "5"), ...block("Front Equipment"), ...block("Right Equipment"), ...block("Left Equipment"),
            ...block("Rear Equipment"), ...block("Rotor Equipment"), ...block("Turret Equipment", "CLERMediumLaser"), ...block("tonnage", "20.0"),
        ].join("\n");
        const { vehicle, issues } = importVehicleBlk(vtol);
        expect(issues).toEqual([]);
        expect(vehicle!.getMotiveType().tag).toBe("vtol");
        expect(vehicle!.getEngineType().tag).toBe("clan_xl");
        expect(vehicle!.getArmorAllocation().rotor).toBe(2);
        expect(vehicle!.getArmorAllocation().turret).toBe(5);
        expect(vehicle!.getEquipmentList().find((item) => item.location === "turret")).toBeDefined();
    });

    // Donar Assault Helicopter (Close Support): the file lists the probe before the Mast Mount that holds it
    // (TO:AUE p.162), and what the rotor cannot hold is reported, not quietly moved.
    it("reads a Mast Mount and what it holds into the rotor, in either order", () => {
        const vtol = [
            ...block("UnitType", "VTOL"), ...block("Name", "Test Copter"), ...block("year", "3060"), ...block("type", "Clan Level 2"),
            ...block("motion_type", "VTOL"), ...block("cruiseMP", "8"), ...block("engine_type", "2"), ...block("armor_type", "0"),
            ...block("armor", "8", "6", "6", "4", "2", "5"), ...block("Front Equipment"), ...block("Right Equipment"), ...block("Left Equipment"),
            ...block("Rear Equipment"), ...block("Rotor Equipment", "CLActiveProbe", "ISMastMount"), ...block("Turret Equipment", "CLERMediumLaser"), ...block("tonnage", "20.0"),
        ].join("\n");
        const { vehicle, issues } = importVehicleBlk(vtol);
        expect(issues).toEqual([]);
        expect(vehicle!.getEquipmentList().filter((item) => item.location === "rotor").map((item) => item.tag).sort()).toEqual(["clan-active-probe", "vtol-mast-mount"]);
        const unmounted = importVehicleBlk(vtol.replace("ISMastMount\n", ""));
        expect(unmounted.issues).toEqual(["\"CLActiveProbe\" cannot go in the rotor and was mounted unplaced."]);
    });

    it("reads vehicular jump jets as Jump MP and refuses Support Vehicle files", () => {
        const jumper = tank.replace("<Rear Equipment>", "<Rear Equipment>\nVehicleJumpJet\nVehicleJumpJet\nVehicleJumpJet").replace("Tracked", "Wheeled");
        const { vehicle, issues } = importVehicleBlk(jumper);
        expect(issues).toEqual([]);
        expect(vehicle!.getJumpMP()).toBe(3);
        expect(importVehicleBlk(tank.replace(">\nTank\n<", ">\nSupportTank\n<")).vehicle).toBeNull();
    });

    // Behemoth: SRM 6 rounds are worth 7 BV a ton, not the 3 of the SRM 2 also aboard (MUL BV 1173, not 1167).
    it("loads each bin for the launcher it names, and keeps it through a save", () => {
        const mixed = tank.replace("ISSRM6\nISSRM6", "ISSRM2\nISSRM6").replace("ISSRM6 Ammo", "IS Ammo SRM-6");
        const { vehicle, issues } = importVehicleBlk(mixed);
        expect(issues).toEqual([]);
        const bin = vehicle!.getEquipmentList().find((item) => item.isAmmo && /srm/.test(item.tag));
        expect(bin).toBeDefined();
        expect(vehicle!.getAmmoBinWeapon(bin!)?.tag).toBe("srm-6");
        expect(vehicle!.getBattleValueLog()).toContain("Ammunition for srm-6 = 7.00");
        const reload = new Vehicle();
        reload.importJSON(vehicle!.exportJSON());
        expect(reload.getBattleValue()).toBe(vehicle!.getBattleValue());
        expect(reload.getAmmoBinWeapon(reload.getEquipmentList().find((item) => item.isAmmo && /srm/.test(item.tag))!)?.tag).toBe("srm-6");
    });

    // SM2 Heavy Artillery Vehicle: a Clan vehicle with an Inner Sphere Sniper prices it at the Inner Sphere
    // 85 BV, not the Clan 96 (TO:AUE p.197 tables; MUL BV 1028, not 1039).
    it("prices an Inner Sphere artillery piece on a Clan vehicle at its Inner Sphere BV, and keeps it through a save", () => {
        const sniper = tank.replace("IS Level 2", "Clan Level 3").replace("ISSRM6\nISSRM6", "ISSniper").replace("ISSRM6 Ammo", "ISSniperAmmo").replace("50.0", "60.0")
            .replace("\nISCASE", "").replace("Medium Laser", "CLERMediumLaser");
        const { vehicle, issues } = importVehicleBlk(sniper);
        expect(issues).toEqual([]);
        expect(vehicle!.getBattleValueLog()).toContain("Sniper (front) = 85.00");
        const reload = new Vehicle();
        reload.importJSON(vehicle!.exportJSON());
        expect(reload.getBattleValue()).toBe(vehicle!.getBattleValue());
    });

    // AC/2 Carrier: four armor values, so no turret, and 4 x 6 internal structure (MUL BV 403, not 413).
    it("gives a vehicle with four armor values no turret", () => {
        const carrier = tank.replace(/<armor>[\s\S]*?<\/armor>/, block("armor", "30", "20", "20", "15").join("\n"))
            .replace(/<Turret Equipment>[\s\S]*?<\/Turret Equipment>\n?/, "");
        const { vehicle, issues } = importVehicleBlk(carrier);
        expect(issues).toEqual([]);
        expect(vehicle!.hasTurret()).toBe(false);
        expect(Object.values(vehicle!.getStructureAllocation()).reduce((sum, points) => sum + (points ?? 0), 0)).toBe(20);
    });
});

describe("MegaMek Fixed-Wing Support Vehicle import", () => {
    const plane = [
        ...block("UnitType", "FixedWingSupport"), ...block("Name", "Test Spotter"), ...block("year", "3050"), ...block("type", "IS Level 2"),
        ...block("motion_type", "Aerodyne"), ...block("SafeThrust", "4"), ...block("heatsinks", "0"), ...block("engine_type", "0"),
        ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "5"),
        ...block("armor_type", "43"), ...block("armor", "4", "3", "3", "2"),
        ...block("Nose Equipment", "Machine Gun"), ...block("Body Equipment", "IS Ammo MG - Full", "STOLChassisMod"),
        ...block("transporters", "cargobay:1.0:1:1::-1:0"), ...block("fuel", "40"), ...block("tonnage", "10.0"),
    ].join("\n");

    it("reads a Fixed-Wing Support Vehicle into the fighter builder", () => {
        const { fighter, issues, notes } = importFixedWingSupportBlk(plane);
        expect(fighter?.isSupportVehicle()).toBe(true);
        expect(fighter?.getSupportMotive()).toBe("fixed-wing");
        expect(fighter?.getTonnage()).toBe(10);
        expect(fighter?.getSafeThrust()).toBe(4);
        expect(fighter?.getSupportEngine()?.tag).toBe("ice");
        expect(fighter?.getBAR()).toBe(5);
        expect(fighter?.getSupportVehicleSettings()?.chassisModifications).toContain("stol");
        expect(fighter?.getArmorAllocation()).toMatchObject({ nose: 4, leftWing: 3, rightWing: 3, aft: 2 });
        expect(fighter?.getEquipmentList().find((item) => !item.isAmmo)?.location).toBe("nose");
        expect(fighter?.getEquipmentList().some((item) => item.isAmmo)).toBe(true);
        expect(fighter?.getBays().map((bay) => [bay.tag, bay.amount])).toEqual([["cargo", 1]]);
        // Fuel is saved in Fuel Points (TM p.128) and bought by the half ton from 5 tons (TM p.129): 40 points become 50.
        expect(fighter?.getFuelPoints()).toBe(50);
        expect(notes.some((note) => note.startsWith("The file's 40 Fuel Points are 50 here"))).toBe(true);
        expect(issues).toEqual([]);
    });

    it("brings the file's quirks across", () => {
        const { fighter } = importFixedWingSupportBlk(`${plane}\n<quirks>\nlow_profile\n</quirks>`);
        expect(fighter!.quirks.getAll()).toEqual([{ tag: "quirk-narrow-low-profile" }]);
    });

    it("brings the file's Technical Readout fields across (TRO fields, #78)", () => {
        const { fighter } = importFixedWingSupportBlk(`${plane}\n<primaryFactory>\nNew Avalon\n</primaryFactory>\n<systemManufacturers>\nENGINE:Rawlings\n</systemManufacturers>\n<history>\n<p>Flew border patrols.</p>\n</history>`);
        expect(fighter!.tro.getProduction("primaryFactory")).toBe("New Avalon");
        expect(fighter!.tro.getComponent("engine")).toBe("Rawlings");
        expect(fighter!.tro.getText("battleHistory")).toBe("Flew border patrols.");
    });

    it("refuses other unit types", () => {
        expect(importFixedWingSupportBlk(plane.replace("FixedWingSupport", "ConvFighter")).fighter).toBeNull();
    });
});
