import { describe, expect, it } from "vitest";
import { importFixedWingSupportBlk, importSupportVehicleBlk, importVehicleBlk } from "./vehicle-blk";
import Vehicle from "./vehicle";

// Synthetic MegaMek files: the shape of a MegaMekLab save, with made-up designs.
const block = (tag: string, ...lines: string[]): string[] => [`<${tag}>`, ...lines, `</${tag}>`];

describe("MegaMek Support Vehicle import", () => {
    const tank = [
        ...block("UnitType", "SupportTank"), ...block("Name", "Test Hauler"), ...block("Model", "TH-1"), ...block("year", "3050"),
        ...block("type", "IS Level 2"), ...block("motion_type", "Wheeled"), ...block("cruiseMP", "4"), ...block("engine_type", "1"),
        ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "7"),
        ...block("armor_type", "43"), ...block("armor", "10", "8", "8", "6"),
        ...block("Front Equipment", "Machine Gun", "No Such Gun"), ...block("Body Equipment", "IS Ammo MG - Half"),
        ...block("transporters", "cargobay:4.0:1:1::-1:0"), ...block("fuel", "1.0"), ...block("tonnage", "20.0"),
    ].join("\n");

    // BLKFile's codes, as for Combat Vehicles: 0 fusion, 1 ICE, 6 fuel cell (the Boreas burns hydrogen), 8 none (a trailer).
    it("reads MegaMek's engine codes for a Support Vehicle", () => {
        const engineOf = (code: string) => importSupportVehicleBlk(tank.replace("<engine_type>\n1\n", `<engine_type>\n${code}\n`)).vehicle!.getSupportVehicleEngine()?.tag;
        expect(["0", "1", "6", "7", "10", "11", "12"].map(engineOf)).toEqual(["fusion", "ice", "fuel-cell", "fission", "steam", "battery", "solar"]);
    });

    // A trailer's engine "none" (code 8) needs the Trailer chassis modification, which the file lists in its body.
    it("reads a trailer with no engine", () => {
        const trailer = tank.replace("<engine_type>\n1\n", "<engine_type>\n8\n").replace("<cruiseMP>\n4\n", "<cruiseMP>\n0\n")
            .replace("<fuel>\n1.0\n", "<fuel>\n0.0\n").replace("IS Ammo MG - Half", "IS Ammo MG - Half\nSV Chassis Mod [Trailer]").replace("\nNo Such Gun\n", "\n");
        const { vehicle, issues } = importSupportVehicleBlk(trailer);
        expect(issues).toEqual([]);
        expect(vehicle!.getSupportVehicleEngine()?.tag).toBe("none");
        expect(vehicle!.getSupportVehicleIssues()).toEqual([]);
    });

    // Industrial equipment is vehicle equipment (TM pp.241-247: 1 item slot on a vehicle); cargo listed as equipment
    // ("Cargo:SIZE:20.0", the Lesseps Dump Truck) is a cargo bay on a vehicle (TM p.239).
    it("mounts industrial equipment and reads cargo listed as equipment as a cargo bay", () => {
        const dumper = tank.replace("\nNo Such Gun\n", "\nBackhoe\n").replace("IS Ammo MG - Half", "IS Ammo MG - Half\nCargo:SIZE:3.0")
            .replace("<transporters>\ncargobay:4.0:1:1::-1:0\n</transporters>\n", "");
        const { vehicle, issues } = importSupportVehicleBlk(dumper);
        expect(issues).toEqual([]);
        expect(vehicle!.getEquipmentList().some((item) => item.tag === "backhoe")).toBe(true);
        expect(vehicle!.getBays().map((bay) => [bay.tag, bay.amount])).toEqual([["cargo", 3]]);
        expect(vehicle!.getSupportVehicleIssues()).toEqual([]);
    });

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

    // "Machine Gun (Light)" is the infantry support weapon's name (BV 1.5); the vehicle gun is "Light Machine Gun".
    // The two-ton Ibex RV (Militarized MG) carries a pair on pintles (Handbook: House Marik p.154).
    it("reads an infantry weapon's name as that light weapon, not the vehicle weapon the matcher also finds", () => {
        const car = [
            ...block("UnitType", "SupportTank"), ...block("Name", "Test Car"), ...block("Model", "MG"), ...block("year", "3050"),
            ...block("type", "IS Level 2"), ...block("motion_type", "Wheeled"), ...block("cruiseMP", "5"), ...block("engine_type", "1"),
            ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "7"),
            ...block("armor_type", "48"), ...block("armor", "2", "2", "2", "2"), ...block("Body Equipment", "ISOffRoadChassis"),
            ...block("Right Equipment", "Machine Gun (Light)(PT):SIZE:1.0", "PintleTurret"), ...block("Left Equipment", "PintleTurret", "Machine Gun (Light)(PT):SIZE:1.0"),
            ...block("tonnage", "2.0"),
        ].join("\n");
        const { vehicle, issues } = importSupportVehicleBlk(car);
        const guns = vehicle!.getEquipmentList().filter((item) => !item.isAmmo);
        expect(guns.map((item) => [item.name, item.location, item.pintle, item.battleValue])).toEqual([
            [expect.stringContaining("Machine Gun (Light)"), "right", true, 1.5], [expect.stringContaining("Machine Gun (Light)"), "left", true, 1.5],
        ]);
        expect(issues).toEqual([]);
    });

    // TM p.317 table: Bulldozer 10, on the Defensive Battle Rating (Kallon UL-14 'Dual Bulldozer', TRO Vehicle Annex).
    it("counts a bulldozer's 10 BV as defensive equipment", () => {
        const dozer = tank.replace("Wheeled", "Tracked").replace("<Front Equipment>\nMachine Gun\nNo Such Gun\n</Front Equipment>", "<Front Equipment>\nBulldozer\n</Front Equipment>")
            .replace("IS Ammo MG - Half", "");
        const { vehicle } = importSupportVehicleBlk(dozer);
        expect(vehicle!.getEquipmentList().map((item) => item.tag)).toEqual(["bulldozer"]);
        expect(vehicle!.getBattleValueLog()).toContain("Defensive equipment: Bulldozer: 10");
    });

    // TM p.124: a VTOL Support Vehicle of any size has Front, Left, Right, Rear and Rotor; only Large ground ones split
    // their sides. The Large Cascatelle prints 6 structure in each of the five and armor 21/15/15/11/2.
    it("gives a Large VTOL Support Vehicle the five VTOL locations", () => {
        const vtol = [
            ...block("UnitType", "SupportVTOL"), ...block("Name", "Test Lifter"), ...block("Model", "L"), ...block("year", "3063"),
            ...block("type", "IS Level 2"), ...block("motion_type", "VTOL"), ...block("cruiseMP", "6"), ...block("engine_type", "1"),
            ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "6"),
            ...block("armor_type", "47"), ...block("armor", "21", "15", "15", "11", "2"), ...block("tonnage", "60.0"),
        ].join("\n");
        const { vehicle, issues } = importSupportVehicleBlk(vtol);
        expect(vehicle!.isSuperheavy()).toBe(true);
        expect(vehicle!.hasSplitSides()).toBe(false);
        expect(vehicle!.getLocations().map((location) => location.tag)).toEqual(["front", "left", "right", "rear", "rotor"]);
        expect(vehicle!.getTotalArmorPoints()).toBe(64);
        expect(vehicle!.getTotalStructurePoints()).toBe(30);
        expect(vehicle!.resolveHitArea("side", "frontLeft")).toBe("left");
        expect(issues).toEqual([]);
    });

    it("refuses files that are not ground or VTOL Support Vehicles", () => {
        expect(importSupportVehicleBlk(tank.replace("SupportTank", "Tank")).vehicle).toBeNull();
        expect(importSupportVehicleBlk("not a unit file").vehicle).toBeNull();
    });
});

// The Support Vehicle round (#600): what the bundle report left out on import.
describe("MegaMek Support Vehicle import: the Support Vehicle round", () => {
    const small = (equipment: string[], transporters: string[] = [], tons = "4.0") => [
        ...block("UnitType", "SupportTank"), ...block("Name", "Test Half-Track"), ...block("Model", "T"), ...block("year", "3050"),
        ...block("type", "IS Level 2"), ...block("motion_type", "Tracked"), ...block("cruiseMP", "4"), ...block("engine_type", "1"),
        ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "7"),
        ...block("armor_type", "47"), ...block("armor", "2", "2", "2", "2"), ...block("Body Equipment", "Advanced Fire Control"),
        ...equipment, ...(transporters.length ? block("transporters", ...transporters) : []), ...block("tonnage", tons),
    ].join("\n");

    // MegaMek's own names for infantry weapons (InfantryStandardSRM, InfantryAssaultRifle) are the records' altNames; a
    // ":SIZE:" is the clips carried, the first one standard (BLKFile: shots = size x the weapon's shots; TM p.136).
    it("reads MegaMek's infantry weapon names, and a SIZE as the clips carried", () => {
        const { vehicle, issues } = importSupportVehicleBlk(small([...block("Front Equipment", "InfantryStandardSRM:SIZE:1.0", "InfantryAssaultRifle(PT):SIZE:10.0",
            "InfantryHeavyGrenadeLauncher:SIZE:1.0", "InfantryTAG:SIZE:1.0", "Wire-Guided Missile Launcher:SIZE:1.0")]));
        expect(issues).toEqual([]);
        const weapons = vehicle!.getEquipmentList().filter((item) => item.tag.startsWith("sv-light-weapon-"));
        expect(weapons.map((item) => item.tag)).toEqual(["sv-light-weapon-inf-srm-launcher-standard-two-shot", "sv-light-weapon-inf-auto-rifle",
            "sv-light-weapon-inf-grenade-launcher-heavy", "sv-light-weapon-inf-tag-light-man-portable", "sv-light-weapon-inf-wire-guided-missile-launcher"]);
        expect(weapons[1].notes).toContain("9 extra clips");
        expect(weapons[1].pintle).toBe(true);
    });

    // TM p.237, the TM p.344 table (0.005 t, no slot) and p.293 (500 C-bills); the Croyle Cortez lists twelve.
    it("mounts a hand-held searchlight", () => {
        const { vehicle, issues } = importSupportVehicleBlk(small([...block("Front Equipment", "HHSearchlight", "HHSearchlight")]));
        expect(issues).toEqual([]);
        const lights = vehicle!.getEquipmentList().filter((item) => item.tag === "searchlight-handheld");
        expect(lights.map((item) => [item.location, item.weight, item.cbills, item.battleValue])).toEqual([["front", 0.005, 500, 0], ["front", 0.005, 500, 0]]);
    });

    // Ladders come in 20 m lengths to 100 m, 0.1 ton and 100 C-bills each 20 m (TM pp.243-244, 293): the SIZE is meters.
    it("reads a ladder's SIZE as its length", () => {
        const { vehicle, issues } = importSupportVehicleBlk(small([...block("Left Equipment", "Ladder:SIZE:20.0"), ...block("Right Equipment", "Ladder:SIZE:100.0")], [], "20.0"));
        expect(issues).toEqual([]);
        expect(vehicle!.getEquipmentList().map((item) => [item.tag, item.location])).toEqual([["ladder-100", "right"], ["ladder-20", "left"]]);
    });

    // A dumper weighs 5 percent of the cargo it dumps, in that cargo's location (TM p.243), 5,000 C-bills (p.293): the
    // Lesseps Dump Truck's "Dumper (Rear)" dumps the "Cargo:SIZE:" its Rear block lists.
    it("weighs a dumper from the cargo it dumps", () => {
        const { vehicle, issues } = importSupportVehicleBlk(small([...block("Rear Equipment", "Cargo:SIZE:12.0", "Dumper (Rear)")], [], "30.0"));
        expect(issues).toEqual([]);
        const dumper = vehicle!.getEquipmentList().find((item) => item.tag === "dumper");
        expect([dumper?.location, dumper?.weight, dumper?.cbills, dumper?.dumpedCargo]).toEqual(["rear", 1, 5000, 12]);
    });

    // MegaMek's infantry, battle armor and light vehicle bays: the size is the count of bays (InfantryBay: space x the
    // platoon's weight), battle armor the squads, a last field of 2 a Clan bay (TM p.239).
    it("reads infantry, battle armor and light vehicle bays", () => {
        const { vehicle, issues } = importSupportVehicleBlk(small([], ["infantrybay:2.0:1:2:Foot:-1:0", "battlearmorbay:3.0:1:3::-1:2", "lightvehiclebay:1.0:1:1::-1:0"], "150.0"));
        expect(issues).toEqual([]);
        expect(vehicle!.getBays().map((bay) => [bay.tag, bay.amount, bay.doors])).toEqual([["infantry-foot", 2, 1], ["battle-armor-clan", 3, 1], ["vehicle-light", 1, 1]]);
    });

    // The file gives the base Cruising MP, before a hydrofoil's x 1.25 (TM p.123): the Silverback Coastal Cutter's 6 is 8.
    it("reads a hydrofoil's base Cruise MP", () => {
        const foil = small([...block("Front Equipment", "Machine Gun")], [], "40.0").replace("Tracked", "Hydrofoil").replace("<cruiseMP>\n4\n", "<cruiseMP>\n6\n");
        const { vehicle, issues } = importSupportVehicleBlk(foil);
        expect(issues).toEqual([]);
        expect([vehicle!.getBaseCruiseMP(), vehicle!.getCruiseMP()]).toEqual([6, 8]);
    });

    // TM p.124: no turret on a VTOL Support Vehicle, but the VTOL Chin Turret is "Available To: CV, SV" (TO:AUE p.160).
    it("gives a Support VTOL a chin turret", () => {
        const vtol = [
            ...block("UnitType", "SupportVTOL"), ...block("Name", "Test Spotter"), ...block("Model", "S"), ...block("year", "3080"),
            ...block("type", "IS Level 3"), ...block("motion_type", "VTOL"), ...block("cruiseMP", "12"), ...block("engine_type", "0"),
            ...block("structural_tech_rating", "4"), ...block("engine_tech_rating", "4"), ...block("armor_tech_rating", "3"), ...block("barrating", "10"),
            ...block("armor_type", "51"), ...block("armor", "5", "2", "2", "2", "2", "2"), ...block("Body Equipment", "Armored Chassis"),
            ...block("Turret Equipment", "Small Laser", "Small Laser"), ...block("tonnage", "17.0"),
        ].join("\n");
        const { vehicle, issues } = importSupportVehicleBlk(vtol);
        expect(issues).toEqual([]);
        expect(vehicle!.hasChinTurret()).toBe(true);
        expect(vehicle!.getEquipmentList().map((item) => item.location)).toEqual(["turret", "turret"]);
    });

    // TO:AUE p.94: the Armored Motive System is "available only to Combat and Support Vehicles" (tracked, wheeled, hover,
    // hydrofoil, naval, WiGE); p.161: Vehicular Jump Jets, "Available To: CV, SV" (the Shackleton AESV carries both).
    it("fits an Armored Motive System and vehicular jump jets on a Support Vehicle", () => {
        const file = small([...block("Front Equipment", "Machine Gun")], [], "50.0").replace("<type>\nIS Level 2\n", "<type>\nIS Level 3\n").replace("<year>\n3050\n", "<year>\n3093\n")
            .replace("Advanced Fire Control", "Advanced Fire Control\nISArmoredMotiveSystem\nVehicleJumpJet\nVehicleJumpJet").replace("Tracked", "Wheeled");
        const { vehicle, issues } = importSupportVehicleBlk(file);
        expect(issues).toEqual([]);
        expect(issues).toEqual([]);
        expect(vehicle!.hasChassisModification("armored-motive")).toBe(true);
        expect(vehicle!.getJumpMP()).toBe(2);
        expect(vehicle!.getCBillCostLog()).toContain("Jump Jets");
    });

    // A drone bomb's rounds for no gun aboard ride as cargo and add no Battle Value (TM p.307).
    it("carries ammunition with no gun aboard", () => {
        const { vehicle, issues } = importSupportVehicleBlk(small([...block("Front Equipment", "Small Laser")]).replace("Advanced Fire Control", "Advanced Fire Control\nIS Machine Gun Ammo - Half"));
        expect(issues).toEqual([]);
        expect(vehicle!.getEquipmentList().filter((item) => item.isAmmo).length).toBe(1);
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

    // MegaMek files carry BLKFile's engine codes (0 fusion, 1 ICE, 2 XL, 3 XXL, 4 light, 5 compact, 6 fuel cell, 7 fission),
    // which BLKFile.translateEngineCode reads, not Engine's own constants: the Manticore (fusion) is 0, the Scorpion (ICE) 1.
    it("reads MegaMek's engine codes for a Combat Vehicle", () => {
        const engineOf = (code: string) => importVehicleBlk(tank.replace("<engine_type>\n2\n", `<engine_type>\n${code}\n`)).vehicle!.getEngineType().tag;
        expect(["0", "1", "2", "3", "4", "5", "6", "7"].map(engineOf)).toEqual(["standard", "ice", "xl", "xxl", "light", "compact", "cell", "fission"]);
    });

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
        expect(vehicle!.getBattleValueLog()).toContain("Ammunition for srm-6: 7");
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
        expect(vehicle!.getBattleValueLog()).toContain("Sniper (front): 85");
        const reload = new Vehicle();
        reload.importJSON(vehicle!.exportJSON());
        expect(reload.getBattleValue()).toBe(vehicle!.getBattleValue());
    });

    // Skulker Wheeled Scout Tank C (Recognition Guide: ilClan Vol. 28): Mixed Tech on an Inner Sphere chassis, with Clan
    // CASE, at 20 tons. Clan CASE weighs nothing (TM p.210; "CASE (0 tons for Clan designs)", TM p.196).
    it("reads Clan CASE on an Inner Sphere-chassis Mixed Tech vehicle as weightless, and keeps it through a save", () => {
        const mixed = tank.replace("IS Level 2", "Mixed (IS Chassis)").replace("ISCASE", "CLCASE");
        const { vehicle, issues } = importVehicleBlk(mixed);
        expect(issues).toEqual([]);
        expect(vehicle!.getTech().tag).toBe("mis");
        expect(vehicle!.hasClanCASE()).toBe(true);
        expect(vehicle!.hasCASE()).toBe(true);
        expect(vehicle!.getEquipmentList().some((item) => /case/.test(item.tag))).toBe(false);
        expect(vehicle!.getWeights().some((entry) => /CASE/.test(entry.name))).toBe(false);
        const reload = new Vehicle(vehicle!.exportJSON());
        expect(reload.hasClanCASE()).toBe(true);
        expect(reload.getCurrentTonnage()).toBe(vehicle!.getCurrentTonnage());
    });

    // Ajax Assault Tank (TRO 3067 p.27): the base chassis turret is 3.5 tons, in every configuration (TM p.108).
    it("reads an OmniVehicle's base chassis turret weight", () => {
        const omni = tank.replace("<tonnage>", "<omni>\n1\n</omni>\n<baseChassisTurretWeight>\n3.5\n</baseChassisTurretWeight>\n<tonnage>")
            .replace("Medium Laser", "Medium Laser:OMNI");
        const { vehicle, issues } = importVehicleBlk(omni);
        expect(issues).toEqual([]);
        expect(vehicle!.isOmni()).toBe(true);
        expect(vehicle!.getOmniTurretWeight()).toBe(3.5);
        expect(vehicle!.getTurretWeight("turret")).toBe(3.5);
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
        ...block("motion_type", "Aerodyne"), ...block("SafeThrust", "4"), ...block("heatsinks", "0"), ...block("engine_type", "1"),
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

describe("Support Vehicle Battle Value: the Support Vehicle round", () => {
    const sv = (motion: string, tons: string, body: string[], extra: string[] = []) => [
        ...block("UnitType", "SupportTank"), ...block("Name", "Test Carrier"), ...block("Model", "T"), ...block("year", "3050"),
        ...block("type", "IS Level 2"), ...block("motion_type", motion), ...block("tonnage", tons), ...block("cruiseMP", "4"), ...block("engine_type", "1"),
        ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "7"),
        ...block("armor_type", "47"), ...block("armor", "10", "10", "10", "10"), ...block("Body Equipment", ...body), ...extra,
    ].join("\n");
    const steps = (vehicle: Vehicle | null) => vehicle!.getBattleValueBreakdown("total-warfare").steps;

    // TO:AUE p.193: Dune Buggy and Environmental Sealing add +0.1 to the type modifier; the Dromedary's printed 341
    // (TRO 3075 p.294) needs it on a Support Vehicle too.
    it("adds Dune Buggy's +0.1 to a Support Vehicle's type modifier", () => {
        const { vehicle } = importSupportVehicleBlk(sv("Wheeled", "20", ["ISSVDuneBuggyChassis"]));
        const chassis = steps(vehicle).find((step) => step.id === "sv.bv2.def.chassis");
        expect(chassis?.value).toBe(0.1);
        expect(chassis?.cites).toEqual([{ source: "toaue", page: "193" }]);
        expect(steps(vehicle).find((step) => step.id === "cv.bv2.def.type")?.detail).toContain("x 0.9");
    });

    // The Shackleton AESV's printed 298 (Interstellar Players 3 p.112) carries the Armored Motive System's +0.1 alone.
    it("takes only the Armored Motive System's +0.1 beside Environmental Sealing", () => {
        const { vehicle, issues } = importSupportVehicleBlk(sv("Wheeled", "20", ["EnvironmentalSealing", "ISArmoredMotiveSystem"])
            .replace("<type>\nIS Level 2\n", "<type>\nIS Level 3\n").replace("<year>\n3050\n", "<year>\n3093\n"));
        expect(issues).toEqual([]);
        expect(vehicle!.hasChassisModification("armored-motive")).toBe(true);
        expect(steps(vehicle).find((step) => step.id === "sv.bv2.def.chassis")).toBeUndefined();
        expect(steps(vehicle).find((step) => step.id === "cv.bv2.def.chassis")?.value).toBe(0.1);
    });

    // A rail trailer finds its Speed Factor from Cruise MP (TO:AUE p.190), and an unmotorized trailer counts as MP 1 (TM p.308).
    it("rates a rail trailer at MP 1", () => {
        const text = sv("Rail", "40", ["SV Chassis Mod [Trailer]"]).replace("<cruiseMP>\n4\n", "<cruiseMP>\n0\n").replace("<engine_type>\n1\n", "<engine_type>\n8\n");
        const { vehicle } = importSupportVehicleBlk(text);
        const speed = steps(vehicle).find((step) => step.id === "cv.bv2.off.speed.rail");
        expect(speed?.detail).toContain("MP 1");
        expect(speed?.value).toBe(0.54);
    });

    it("cites the Support Vehicle armor and fire control steps", () => {
        const { vehicle } = importSupportVehicleBlk(sv("Tracked", "20", []));
        for (const id of ["cv.bv2.def.armor.support", "cv.bv2.off.firecontrol"]) {
            expect(steps(vehicle).find((step) => step.id === id)?.status).toBe("cited");
        }
    });
});