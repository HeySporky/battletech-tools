import { describe, expect, it } from "vitest";
import Building, { BUILDING_RULES_LEVEL, normalizeBuildingExport } from "./building";
import { BUILDING_CLASSIFICATIONS, BUILDING_GENERATORS, findBuildingClassification } from "../data/building-classifications";
import { findInfantryWeapon, infantryWeapons } from "../data/infantry-weapons";

// The three buildings Tactical Operations: Advanced Rules designs as its running examples (pp.127-131).

// Kenyon's Clan gun emplacement: Heavy, CF 80, 80 points of armor.
const kenyon = (): Building => {
    const building = new Building();
    building.setTech("clan");
    building.setClassification("gun-emplacement");
    building.setType("heavy");
    building.setCF(80);
    building.setArmorTons(4);
    return building;
};

// Tara's central fortress building: Hardened, CF 150, 6 hexes, 5 levels, 9 tons of armor a hex.
const tara = (): Building => {
    const building = new Building();
    building.setClassification("fortress");
    building.setType("hardened");
    building.setCF(150);
    building.setHexes(6);
    building.setLevels(5);
    building.setArmorTons(9);
    return building;
};

describe("Building Classification and Type Table (TO:AR p.113)", () => {
    it("gives every classification its types, with Construction Factor ranges that do not overlap", () => {
        expect(BUILDING_CLASSIFICATIONS.map((classification) => classification.tag).sort()).toEqual(
            ["bridge", "castles-brian", "fence", "fortress", "gun-emplacement", "hangar", "standard", "tent", "wall"]);
        for (const classification of BUILDING_CLASSIFICATIONS) {
            expect(classification.types.length).toBeGreaterThan(0);
            for (let index = 1; index < classification.types.length; index++) {
                expect(classification.types[index].minCF).toBe(classification.types[index - 1].maxCF + 1);
            }
        }
    });

    it("quotes the rows the book's examples use", () => {
        const standard = findBuildingClassification("standard");
        expect(standard?.types.map((type) => type.tag)).toEqual(["light", "medium", "heavy"]);
        // Ryana's mall: Medium Standard, CF 16 to 40, 8 hexes and 8 levels; Light Standard, CF 1 to 15, 6 hexes and 5 levels.
        expect(standard?.types[1]).toMatchObject({ minCF: 16, maxCF: 40, maxHexes: 8, maxLevels: 8 });
        expect(standard?.types[0]).toMatchObject({ minCF: 1, maxCF: 15, maxHexes: 6, maxLevels: 5 });
        // Kenyon's gun emplacement: Heavy is CF 41 to 90, fixed at 1 hex and 1 level.
        expect(findBuildingClassification("gun-emplacement")?.types[2]).toMatchObject({ minCF: 41, maxCF: 90, maxHexes: 1, maxLevels: 1 });
        expect(findBuildingClassification("fortress")?.types.map((type) => type.tag)).toEqual(["medium", "heavy", "hardened"]);
        // Castles Brian: Heavy CF 35 to 90, 35 hexes and 10 levels; Hardened CF 91 to 150, 70 hexes and 15 levels.
        const castle = findBuildingClassification("castles-brian");
        expect(castle?.types[0]).toMatchObject({ tag: "heavy", minCF: 35, maxCF: 90, maxHexes: 35, maxLevels: 10, mpCost: 4, pilotingModifier: 4 });
        expect(castle?.types[1]).toMatchObject({ tag: "hardened", minCF: 91, maxCF: 150, maxHexes: 70, maxLevels: 15, mpCost: 5, pilotingModifier: 5 });
        expect(castle?.costPerCF).toBe(1000000);
    });

    it("lists the Power Generators Table's multipliers (TO:AR p.132)", () => {
        const multiplier = (tag: string) => BUILDING_GENERATORS.find((generator) => generator.tag === tag)?.weightMultiplier;
        expect(multiplier("fusion")).toBe(1);
        expect(multiplier("fission")).toBe(1.5);
        expect(multiplier("steam")).toBe(3);
        expect(multiplier("solar")).toBe(3);
        expect(multiplier("ice-petrol")).toBe(1.5);
        expect(multiplier("ice-coal")).toBe(2);
        expect(multiplier("fuel-cell")).toBe(1);
        expect(multiplier("external")).toBe(0.5);
    });
});

describe("Building construction (TO:AR pp.126-131)", () => {
    it("starts as a legal gun emplacement", () => {
        const building = new Building();
        expect(building.isGunEmplacement()).toBe(true);
        expect(building.getIssues()).toEqual([]);
        expect(building.getRequiredRulesLevel()).toBe(BUILDING_RULES_LEVEL);
    });

    it("gives a hex CF x levels of internal weight capacity (Ryana's mall, p.128)", () => {
        const central = new Building();
        central.setClassification("standard");
        central.setType("medium");
        central.setCF(40);
        central.setHexes(6);
        central.setLevels(3);
        expect(central.getCapacityPerHex()).toBe(120);
        const shop = new Building();
        shop.setClassification("standard");
        shop.setType("light");
        shop.setCF(15);
        shop.setLevels(2);
        expect(shop.getCapacityPerHex()).toBe(30);
        // Standard buildings may not install armor (p.128).
        expect(shop.canMountArmor()).toBe(false);
        expect(shop.setArmorTons(2)).toBe(0);
    });

    it("triples a hangar's capacity, to 600 tons a hex for every 4 levels (p.127)", () => {
        const hangar = new Building();
        hangar.setClassification("hangar");
        hangar.setType("light");
        hangar.setCF(8);
        hangar.setLevels(2);
        expect(hangar.getCapacityPerHex()).toBe(48);
        hangar.setType("hardened");
        hangar.setCF(75);
        hangar.setLevels(4);
        expect(hangar.getCapacityPerHex()).toBe(600);
        hangar.setLevels(5);
        expect(hangar.getCapacityPerHex()).toBe(1125);
    });

    it("gives tents, fences and bridges no capacity and no equipment (p.127)", () => {
        for (const tag of ["tent", "fence", "bridge"]) {
            const building = new Building();
            building.setClassification(tag);
            expect(building.getCapacityPerHex()).toBe(0);
            expect(building.addEquipmentFromTag("medium-laser")).toBeNull();
            expect(building.getAvailableEquipment().length).toBe(0);
        }
    });

    it("keeps a gun emplacement at 1 hex and 1 level", () => {
        const building = kenyon();
        expect(building.setHexes(3)).toBe(1);
        expect(building.setLevels(2)).toBe(1);
        expect(building.getCapacityPerHex()).toBe(80);
    });

    it("armors Kenyon's gun emplacement: 4 tons of Clan armor give 80 points and leave 76 tons (p.128)", () => {
        const building = kenyon();
        expect(building.getArmorPointsPerTon()).toBe(20);
        expect(building.getMaxArmorPoints()).toBe(80);
        expect(building.getArmorPoints()).toBe(80);
        expect(building.getRemainingCapacity()).toBe(76);
    });

    it("armors Tara's fortress: 9 tons a hex give 144 points and leave 741 tons a hex (p.129)", () => {
        const building = tara();
        expect(building.getCapacityPerHex()).toBe(750);
        expect(building.getArmorPointsPerTon()).toBe(16);
        // 150 points would take 9.375 tons, so 10 full tons: the tenth ton is only partly used.
        expect(building.getMaxArmorTons()).toBe(10);
        expect(building.getArmorPoints()).toBe(144);
        expect(building.getHexLoads().map((load) => load.remaining)).toEqual([741, 741, 741, 741, 741, 741]);
        building.setArmorTons(10);
        expect(building.getArmorPoints()).toBe(150);
    });

    it("spreads a generator evenly over the hexes: 30 tons of fusion plant take 5 tons a hex (p.131)", () => {
        const building = tara();
        building.setGenerator("fusion");
        // 6 hexes x 5 levels = 30, x 1 for fusion.
        expect(building.getGeneratorWeight()).toBe(30);
        expect(building.getHexLoads()[0].generator).toBe(5);
        expect(building.getHexLoads()[0].remaining).toBe(736);
        building.setGenerator("fission");
        expect(building.getGeneratorWeight()).toBe(45);
        building.setGenerator("");
        expect(building.getGenerator()).toBeNull();
    });

    it("builds Kenyon's gun emplacement to the book's weights (p.130)", () => {
        const building = kenyon();
        // Two Clan ER Large Lasers, 12 heat each: 24 heat sinks and 0.8 tons of power amplifiers on grid power.
        expect(building.addEquipmentFromTag("clan-er-large-laser", 1, true)).not.toBeNull();
        expect(building.addEquipmentFromTag("clan-er-large-laser", 1, true)).not.toBeNull();
        expect(building.getEnergyWeaponHeat()).toBe(24);
        expect(building.getIssues().some((issue) => issue.includes("heat sinks must cover"))).toBe(true);
        building.setHeatSinks(24);
        expect(building.getPowerAmplifierWeight(1)).toBe(0.8);
        // Two Artemis IV LRM 20s at 6 tons each, with 5 tons of ammunition a launcher.
        expect(building.addEquipmentFromTag("clan-lrm-20-artemis-iv", 1, true)).not.toBeNull();
        expect(building.addEquipmentFromTag("clan-lrm-20-artemis-iv", 1, true)).not.toBeNull();
        for (let ton = 0; ton < 10; ton++) expect(building.addEquipmentFromTag("ammo-clan-lrm-artemis-iv")).not.toBeNull();
        // 20 tons of weapons in the turret: a 2-ton turret; ammunition, heat sinks and amplifiers are not counted.
        expect(building.getTurretWeight(1)).toBe(2);
        expect(building.getHeavyWeaponTons(1)).toBe(20);
        // CF 80 / 3, rounded down.
        expect(building.getHeavyWeaponLimitPerHex()).toBe(26);
        expect(building.getTotalWeight()).toBe(60.8);
        // 76 tons after armor, less 56.8: 19.2 tons remain.
        expect(building.getRemainingCapacity()).toBe(19.2);
        expect(building.getIssues()).toEqual([]);
        // Gunners: each weapon's tonnage / 5, rounded up (1 + 1 + 2 + 2); one officer for 9 crew or fewer.
        expect(building.getMinimumGunners()).toBe(6);
        expect(building.getMinimumOfficers()).toBe(1);
    });

    it("needs no power amplifiers on a fusion generator, but still sinks its heat as a vehicle does (TO:AR p.129; user ruling)", () => {
        const building = kenyon();
        building.addEquipmentFromTag("clan-er-large-laser");
        building.addEquipmentFromTag("clan-er-large-laser");
        building.setGenerator("fusion");
        expect(building.getPowerAmplifierWeight(1)).toBe(0);
        // The generator brings no free heat sinks (TO:AUE p.83): all 24 points must be covered.
        expect(building.getIssues().join(" ")).toContain("24 heat, 0 sunk");
        building.setHeatSinks(24);
        expect(building.getIssues()).toEqual([]);
        // 1 hex x 1 level, plus 10 percent of 8 tons of energy weapons: 1.8, rounded up.
        expect(building.getGeneratorWeight()).toBe(2);
    });

    it("asks for no power amplifier for a flamer or a weapon that fires ammunition (user ruling)", () => {
        const building = new Building();
        building.setType("heavy");
        building.setCF(90);
        // A flamer vents plasma, and a plasma rifle fires ammunition: neither draws on an amplifier.
        expect(building.addEquipmentFromTag("standard-flamer")).not.toBeNull();
        expect(building.addEquipmentFromTag("er-flamer")).not.toBeNull();
        expect(building.addEquipmentFromTag("plasma-rifle")).not.toBeNull();
        expect(building.getPowerAmplifierWeight(1)).toBe(0);
        building.addEquipmentFromTag("medium-laser");
        expect(building.getPowerAmplifierWeight(1)).toBe(0.1);
        const clan = kenyon();
        expect(clan.addEquipmentFromTag("clan-large-chemical-laser")).not.toBeNull();
        expect(clan.getPowerAmplifierWeight(1)).toBe(0);
    });

    it("limits Heavy weapons by hex and flags an overloaded hex (p.129)", () => {
        const building = new Building();
        building.setType("light");
        building.setCF(15);
        expect(building.getHeavyWeaponLimitPerHex()).toBe(5);
        building.addEquipmentFromTag("standard-ppc");
        expect(building.getHeavyWeaponTons(1)).toBe(7);
        expect(building.getIssues().some((issue) => issue.includes("7 tons of Heavy weapons; the limit is 5"))).toBe(true);
        const fortress = tara();
        // CF 150 / 10 for each of 5 levels.
        expect(fortress.getHeavyWeaponLimitPerHex()).toBe(75);
        fortress.setCF(91);
        fortress.setLevels(1);
        expect(fortress.getHeavyWeaponLimitPerHex()).toBe(9.1);
    });

    it("mounts Heavy weapons only on gun emplacements and fortresses (p.129)", () => {
        const standard = new Building();
        standard.setClassification("standard");
        expect(standard.canMountHeavyWeapons()).toBe(false);
        expect(standard.addEquipmentFromTag("medium-laser")).toBeNull();
        expect(standard.getAvailableEquipment().some((item) => /Weapons$/.test(item.category) || item.isAmmo)).toBe(false);
        expect(new Building().getAvailableEquipment().some((item) => item.tag === "medium-laser")).toBe(true);
        expect(new Building().getAvailableEquipment().some((item) => item.category === "Melee")).toBe(false);
    });

    it("keeps turrets off a solar-powered roof and ammunition out of turrets", () => {
        const building = kenyon();
        const laser = building.addEquipmentFromTag("clan-er-large-laser", 1, true);
        const ammo = building.addEquipmentFromTag("ammo-clan-lrm-artemis-iv", 1, true);
        expect(laser?.turret).toBe(true);
        expect(ammo?.turret).toBe(false);
        building.setHeatSinks(12);
        building.setGenerator("solar");
        expect(building.getIssues().some((issue) => issue.includes("no room on the roof"))).toBe(true);
        building.setEquipmentTurret(laser?.item.uuid ?? "", false);
        expect(building.getIssues()).toEqual([]);
    });

    it("moves equipment back onto the building when hexes are removed", () => {
        const building = tara();
        const laser = building.addEquipmentFromTag("medium-laser", 6);
        expect(laser?.hex).toBe(6);
        building.setHexes(2);
        expect(building.getEquipment()[0].hex).toBe(2);
    });
});

describe("Building cost (TO:AR p.208)", () => {
    it("prices a bare gun emplacement: 20,000 x CF, x (1 + CF / 100)", () => {
        const building = new Building();
        building.setType("heavy");
        building.setCF(80);
        expect(building.getCBillCost()).toBe(20000 * 80 * 1.8);
    });

    it("adds armor by tech base, the generator by the ton and unspecified equipment by the hex", () => {
        const building = tara();
        // Structure 20,000 x 150 x 6 hexes x 5 levels; armor 10,000 x 54 tons.
        expect(building.getCBillCost()).toBe((20000 * 150 * 6 * 5 + 10000 * 54) * 2.5);
        building.setGenerator("fusion");
        building.setUnspecifiedEquipment(true);
        expect(building.getCBillCost()).toBe((20000 * 150 * 6 * 5 + 10000 * 54 + 10000 * 30 + 5000 * 150 * 6) * 2.5);
        const clan = kenyon();
        expect(clan.getCBillCost()).toBe((20000 * 80 + 15000 * 4) * 1.8);
        expect(clan.getCBillCostLog().at(-1)).toContain("1 + CF 80 / 100");
    });

    it("counts a bridge as one level and a wall by the hexside", () => {
        const bridge = new Building();
        bridge.setClassification("bridge");
        bridge.setType("medium");
        bridge.setCF(40);
        bridge.setHexes(3);
        expect(bridge.getCBillCost()).toBe(Math.round(12000 * 40 * 3 * 1.4));
        const wall = new Building();
        wall.setClassification("wall");
        wall.setType("light");
        wall.setCF(10);
        wall.setHexes(4);
        wall.setLevels(2);
        expect(wall.getHexLabel(true)).toBe("hexsides");
        expect(wall.getCBillCost()).toBe(Math.round(5000 * 10 * 4 * 2 * 1.1));
    });
});

describe("Saved buildings", () => {
    it("round-trips a design through its export", () => {
        const building = kenyon();
        building.setName("Battery Kenyon");
        building.addEquipmentFromTag("clan-er-large-laser", 1, true);
        building.setHeatSinks(12);
        building.setGenerator("fuel-cell");
        building.setUnspecifiedEquipment(true);
        const copy = new Building(building.exportJSON());
        expect(copy.export()).toEqual({ ...building.export(), lastUpdated: copy.lastUpdated });
        expect(copy.getImportIssues()).toEqual([]);
        expect(copy.getEquipment()[0].turret).toBe(true);
        expect(copy.getTotalWeight()).toBe(building.getTotalWeight());
    });

    it("validates an imported save field by field", () => {
        const loaded = new Building(JSON.stringify({
            name: 42, tech: "nonsense", classification: "castle", type: "colossal", cf: 9999, hexes: -4, levels: "tall", armorTons: 500,
            heatSinks: 1e9, generator: "antimatter", unspecifiedEquipment: "yes", __proto__: { polluted: true },
            equipment: [{ tag: "medium-laser", hex: 99, turret: "yes" }, { tag: "no-such-thing" }, 7],
        }));
        expect(loaded.getName()).toBe("");
        expect(loaded.getClassification().tag).toBe("gun-emplacement");
        expect(loaded.getCF()).toBe(loaded.getType().maxCF);
        expect(loaded.getHexes()).toBe(1);
        expect(loaded.getLevels()).toBe(1);
        expect(loaded.getArmorTons()).toBe(loaded.getMaxArmorTons());
        expect(loaded.getHeatSinks()).toBe(2000);
        expect(loaded.getGenerator()).toBeNull();
        expect(loaded.hasUnspecifiedEquipment()).toBe(false);
        expect(loaded.getEquipment().length).toBe(1);
        expect(loaded.getEquipment()[0]).toMatchObject({ hex: 1, turret: false });
        expect(loaded.getImportIssues().length).toBeGreaterThan(3);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(normalizeBuildingExport("nope").building).toBeNull();
        expect(normalizeBuildingExport({ name: "Bunker" }).building?.name).toBe("Bunker");
        expect(() => new Building("{not json")).not.toThrow();
    });
});

describe("Structural modifications and fittings (TO:AR pp.131-139, 208)", () => {
    const fortress = (type: string, cf: number, hexes: number, levels: number): Building => {
        const building = new Building();
        building.setClassification("fortress");
        building.setType(type);
        building.setCF(cf);
        building.setHexes(hexes);
        building.setLevels(levels);
        return building;
    };

    it("offers each modification only to the classes and types the rules name", () => {
        const emplacement = kenyon();
        expect([emplacement.canSeal(), emplacement.canSetCeilings(), emplacement.canBeSubsurface(), emplacement.canMountDoors(), emplacement.canBeTunnel()])
            .toEqual([true, false, false, false, false]);
        expect(emplacement.canHaveHeavyMetalSuperstructure()).toBe(true);
        emplacement.setType("medium");
        expect(emplacement.canHaveHeavyMetalSuperstructure()).toBe(false);
        const wall = new Building();
        wall.setClassification("wall");
        expect([wall.canSeal(), wall.canMountDoors(), wall.canBeSubsurface()]).toEqual([false, true, false]);
        const hangar = new Building();
        hangar.setClassification("hangar");
        expect([hangar.canBeTunnel(), hangar.canSetCeilings(), hangar.canBeSubsurface()]).toEqual([true, false, true]);
        // A modification is dropped when the building changes to something that cannot have it.
        hangar.setTunnel(true);
        hangar.setSubsurface("underground");
        hangar.setClassification("wall");
        expect([hangar.isTunnel(), hangar.getSubsurface()]).toEqual([false, "none"]);
    });

    it("takes a quarter of the capacity for a heavy metal superstructure, rounded down (TO:AR p.135)", () => {
        const building = fortress("heavy", 90, 6, 2);
        expect(building.getCapacityPerHex()).toBe(180);
        building.setHeavyMetalSuperstructure(true);
        expect(building.getCapacityPerHex()).toBe(135);
        building.setCF(41);
        expect(building.getCapacityPerHex()).toBe(61);
    });

    it("halves an underground building's size limits, rounded up (TO:AR p.138)", () => {
        // A Hardened fortress: 20 hexes and 30 levels on the surface, 10 and 15 underground.
        const building = fortress("hardened", 150, 20, 30);
        building.setSubsurface("underground");
        expect([building.getMaxHexes(), building.getMaxLevels(), building.getHexes(), building.getLevels()]).toEqual([10, 15, 10, 15]);
        building.addEquipmentFromTag("medium-laser", 1, true);
        expect(building.getIssues().join(" ")).toContain("no rooftop equipment or turrets");
        // Underwater: sealed, and no deeper than the Construction Factor.
        const light = new Building();
        light.setClassification("hangar");
        light.setType("light");
        light.setCF(8);
        light.setSubsurface("underwater");
        expect(light.isSealed()).toBe(true);
        expect(light.setSealed(false)).toBe(true);
        light.setDepth(9);
        expect(light.getIssues().join(" ")).toContain("no deeper than its Construction Factor");
        light.setDepth(8);
        expect(light.getIssues()).toEqual([]);
    });

    it("weighs an industrial elevator by its capacity and reach (TO:AR p.136)", () => {
        const building = fortress("heavy", 90, 2, 4);
        building.addElevator(2, 75, 3);
        // 75 tons / 20 = 4 tons, times 3 levels above the ground.
        expect(building.getElevatorWeight()).toBe(12);
        expect(building.getHexLoads().map((load) => load.total)).toEqual([0, 12]);
        // No more than the Construction Factor, no higher than the roof.
        building.setElevator(0, 2, 500, 9);
        expect(building.getElevators()[0]).toEqual({ hex: 2, capacity: 90, levels: 4 });
        building.addEquipmentFromTag("medium-laser", 2, true);
        expect(building.getIssues().join(" ")).toContain("reaches the roof");
        building.setCF(41);
        expect(building.getElevators()[0].capacity).toBe(41);
    });

    it("stores 0.91 tons of liquid for each ton of capacity (TO:AR p.134)", () => {
        const hangar = new Building();
        hangar.setClassification("hangar");
        hangar.setType("hardened");
        hangar.setCF(75);
        hangar.setHexes(4);
        // CF 75 x 4 levels x 3 is past the hangar limit of 600 tons a hex for every 4 levels.
        hangar.setLevels(4);
        // Paul's tank farm: 2,110 tons of capacity hold a month's 1,920 tons of fuel.
        hangar.setLiquidStorage(2110);
        expect(hangar.getLiquidCapacity()).toBeCloseTo(1920.1, 1);
        expect(hangar.getHexLoads()[0].fittings).toBe(527.5);
        expect(hangar.getRemainingCapacity()).toBe(2400 - 2110);
    });

    it("lets automated weapons do without gunners, and counts crew for other equipment (TO:AR pp.130-131)", () => {
        const building = kenyon();
        const laser = building.addEquipmentFromTag("clan-er-large-laser", 1, true);
        building.addEquipmentFromTag("clan-er-large-laser", 1, true);
        expect(building.getMinimumGunners()).toBe(2);
        building.setEquipmentAutomated(laser?.item.uuid || "", true);
        expect(building.getMinimumGunners()).toBe(1);
        expect(building.getAutomatedWeaponTons()).toBe(4);
        // Stunned or dead gunners do not stop an automated weapon.
        // Artillery cannot be automated.
        const fort = new Building();
        fort.setClassification("fortress");
        fort.setType("hardened");
        fort.setLevels(5);
        const thumper = fort.addEquipmentFromTag("thumper-artillery");
        expect(thumper).not.toBeNull();
        fort.setEquipmentAutomated(thumper?.item.uuid || "", true);
        expect(thumper?.automated).toBe(false);
        // Ryana's food court: three field kitchens need 9 staff (TO:AR p.130).
        const mall = new Building();
        mall.setClassification("standard");
        mall.setType("medium");
        mall.setLevels(3);
        for (let kitchen = 0; kitchen < 3; kitchen++) expect(mall.addEquipmentFromTag("field-kitchen")).not.toBeNull();
        expect(mall.getMinimumNonGunners()).toBe(9);
        expect(mall.getMinimumOfficers()).toBe(0);
    });

    it("adds other buildings' hexes to the generator (TO:AR p.131)", () => {
        // Tara's complex: 30 hex-levels in the central building and 48 in the two beside it, 78 tons of fusion generator.
        const building = tara();
        building.setGenerator("fusion");
        building.setPoweredHexes(48);
        expect(building.getGeneratorWeight()).toBe(78);
        expect(building.getHexLoads()[0].generator).toBe(13);
        building.setGenerator("");
        expect(building.getPoweredHexes()).toBe(0);
    });

    it("prices the modifications and fittings (TO:AR p.208)", () => {
        const building = fortress("heavy", 50, 2, 2);
        const plain = 20000 * 50 * 2 * 2;
        expect(building.getCBillCost()).toBe(plain * 1.5);
        building.setSealed(true);
        building.setHeavyMetalSuperstructure(true);
        building.setCeilings("low");
        building.setSubsurface("underground");
        expect(building.getStructureCostMultiplier()).toBeCloseTo(1.5 * 1.25 * 1.1 * 5, 4);
        building.addDoor(2);
        building.addDoor(1);
        building.addElevator(1, 40, 1);
        building.setLiquidStorage(10);
        const laser = building.addEquipmentFromTag("medium-laser");
        building.setEquipmentAutomated(laser?.item.uuid || "", true);
        const log = building.getCBillCostLog().join("\n");
        expect(log).toContain("Large Doors (10,000 x 3 levels): 30,000");
        expect(log).toContain("Industrial Elevators (15,000 x 2 t): 30,000");
        expect(log).toContain("Fuel Storage (100 x 10 t): 1,000");
        expect(log).toContain("Weapon Automation (1,000 x 1 t): 1,000");
        // The laser draws grid power: 0.1 tons of power amplifiers at 20,000 a ton.
        const expected = (plain * building.getStructureCostMultiplier() + 30000 + 30000 + 1000 + 1000 + (laser?.item.cbills || 0) + 2000) * 1.5;
        expect(building.getCBillCost()).toBe(Math.round(expected));
        const hangar = new Building();
        hangar.setClassification("hangar");
        hangar.setTunnel(true);
        expect(hangar.getStructureCostMultiplier()).toBe(1.875);
        expect(hangar.addEquipmentFromTag("field-kitchen")).toBeNull();
        expect(hangar.getIssues().join(" ")).toContain("A tunnel needs a large door at each connection");
    });

    it("round-trips the modifications and cleans hostile ones", () => {
        const building = fortress("heavy", 90, 3, 4);
        building.setSealed(true);
        building.setHeavyMetalSuperstructure(true);
        building.setCeilings("high");
        building.setSubsurface("underwater");
        building.setDepth(12);
        building.addDoor(3);
        building.addElevator(2, 60, 2);
        building.setLiquidStorage(25);
        building.setGenerator("fusion");
        building.setPoweredHexes(7);
        const laser = building.addEquipmentFromTag("medium-laser", 3);
        building.setEquipmentAutomated(laser?.item.uuid || "", true);
        const copy = new Building(building.exportJSON());
        expect(copy.export()).toEqual({ ...building.export(), lastUpdated: copy.lastUpdated });
        expect(copy.getImportIssues()).toEqual([]);
        expect(copy.getCBillCost()).toBe(building.getCBillCost());

        const hostile = new Building(JSON.stringify({
            ...building.export(), classification: "gun-emplacement", type: "light", cf: 10, sealed: "yes", heavyMetal: 1, ceilings: "vaulted", subsurface: "orbital",
            depth: -3, tunnel: "true", doors: [1e9, "tall", {}], elevators: [{ hex: 1e9, capacity: -5, levels: "all" }, 7], liquidStorage: 1e12, poweredHexes: -1,
        }));
        expect([hostile.isSealed(), hostile.hasHeavyMetalSuperstructure(), hostile.getCeilings(), hostile.getSubsurface(), hostile.isTunnel()])
            .toEqual([false, false, "standard", "none", false]);
        expect(hostile.getDepth()).toBe(1);
        expect(hostile.getDoors()).toEqual([]);
        expect(hostile.getElevators()).toEqual([{ hex: 1, capacity: 1, levels: 1 }]);
        expect(hostile.getLiquidStorage()).toBeLessThanOrEqual(hostile.getTotalCapacity());
        // A save from before these options existed still loads plain.
        const old = building.export();
        for (const key of ["sealed", "heavyMetal", "ceilings", "subsurface", "depth", "tunnel", "doors", "elevators", "liquidStorage", "poweredHexes"] as const) delete old[key];
        const plain = new Building(JSON.stringify(old));
        expect([plain.isSealed(), plain.getDoors().length, plain.getElevators().length, plain.getStructureCostMultiplier()]).toEqual([false, 0, 0, 1]);
    });
});

describe("Conventional Infantry Weapons Table weights and clips (TM pp.349-352, 298-301)", () => {
    it("carries each weapon's weight, clip weight, shots and bursts as the table prints them", () => {
        // Auto-Rifle: 4.0 kg / 0.48 kg (30/2); cost 80 / 2.
        expect(findInfantryWeapon("inf-auto-rifle")).toMatchObject({ weight: 4, ammoWeight: 0.48, shots: 30, bursts: 2, disposable: false, ammoCost: 2, powerCells: false });
        // Machine Gun (Support): 44.0 kg / 5 kg (100/5).
        expect(findInfantryWeapon("inf-machine-gun-support")).toMatchObject({ weight: 44, ammoWeight: 5, shots: 100, bursts: 5 });
        // Particle Cannon (Support): 1,800.0 kg / 25 kg (150), on energy cells.
        expect(findInfantryWeapon("inf-particle-cannon-support")).toMatchObject({ weight: 1800, ammoWeight: 25, shots: 150, bursts: null, ammoCost: null, powerCells: true });
        // Rocket Launcher (LAW): 4.0 kg / NA (1-D), a single-use weapon.
        expect(findInfantryWeapon("inf-rocket-launcher-law")).toMatchObject({ weight: 4, ammoWeight: null, shots: 1, disposable: true, ammoCost: null });
        // Blade (Sword): 3.0 kg / NA (NA).
        expect(findInfantryWeapon("inf-blade-sword")).toMatchObject({ weight: 3, ammoWeight: null, shots: null, disposable: false });
    });

    it("gives every record a weight, and a clip to every weapon that is priced for ammunition", () => {
        for (const weapon of infantryWeapons) {
            expect(weapon.weight, weapon.tag).toBeGreaterThanOrEqual(0);
            if (weapon.ammoCost !== null) expect(weapon.ammoWeight, weapon.tag).not.toBeNull();
            if (weapon.disposable) expect(weapon.shots, weapon.tag).toBe(1);
            if (weapon.inferno) expect(weapon.weight, weapon.tag).toBe(findInfantryWeapon(weapon.tag.replace(/-inferno$/, ""))?.weight);
        }
    });
});

describe("Light and Medium weapons on buildings (TO:AR pp.129-130; TM pp.136-137; TO:AUE p.83)", () => {
    const hall = (): Building => {
        const building = new Building();
        building.setClassification("standard");
        building.setType("medium");
        building.setCF(40);
        return building;
    };

    it("lets only hangars, standard buildings and walls mount them (TO:AR p.129)", () => {
        for (const classification of BUILDING_CLASSIFICATIONS) {
            const building = new Building();
            building.setClassification(classification.tag);
            const allowed = ["hangar", "standard", "wall"].includes(classification.tag);
            expect(building.canMountLightWeapons(), classification.tag).toBe(allowed);
            expect(building.addLightWeapon("inf-auto-rifle") !== null, classification.tag).toBe(allowed);
        }
    });

    it("counts Standard weapons as Light and Support weapons as Medium, and keeps melee weapons to custom rules (TM p.136; user ruling)", () => {
        expect(Building.getLightWeaponClass(findInfantryWeapon("inf-auto-rifle")!)).toBe("Light");
        expect(Building.getLightWeaponClass(findInfantryWeapon("inf-machine-gun-support")!)).toBe("Medium");
        expect(Building.getLightWeaponClass(findInfantryWeapon("inf-blade-sword")!)).toBe("Melee");
        const building = hall();
        expect(building.getAvailableLightWeapons().every((weapon) => weapon.type !== "melee")).toBe(true);
        expect(building.getAvailableLightWeapons(6).some((weapon) => weapon.type === "melee")).toBe(true);
        const trap = new Building();
        trap.setClassification("standard");
        expect(trap.addLightWeapon("inf-blade-sword")).not.toBeNull();
        expect(trap.getIssues(3).join(" ")).toContain("only under custom rules");
        expect(trap.getIssues(6)).toEqual([]);
        expect(trap.getRequiredRulesLevel()).toBe(6);
        // A Clan-only weapon is not offered to an Inner Sphere building.
        expect(building.getAvailableLightWeapons().some((weapon) => weapon.techBase === "clan")).toBe(false);
    });

    it("allows 6 a hex for each level (TO:AR p.129)", () => {
        const building = hall();
        building.setLevels(2);
        expect(building.getLightWeaponLimitPerHex()).toBe(12);
        for (let count = 0; count < 12; count++) building.addLightWeapon("inf-auto-rifle");
        expect(building.getIssues()).toEqual([]);
        building.addLightWeapon("inf-auto-rifle");
        expect(building.getIssues().join(" ")).toContain("13 Light and Medium weapons; the limit is 12");
    });

    it("weighs the weapon and its extra clips, with the first clip free (TM p.136)", () => {
        const building = hall();
        const rifle = building.addLightWeapon("inf-auto-rifle")!;
        expect(building.getLightWeaponWeight(1)).toBe(0.004);
        expect(Building.getLightMountShots(rifle)).toBe(30);
        building.setLightWeaponClips(rifle.uuid, 5);
        // 4 kg + 5 x 0.48 kg = 6.4 kg.
        expect(building.getLightWeaponWeight(1)).toBe(0.006);
        expect(Building.getLightMountWeight(rifle)).toBe(0.0064);
        expect(Building.getLightMountShots(rifle)).toBe(180);
        expect(building.getHexLoads()[0].lightWeapons).toBe(0.006);
        // A single-use weapon carries no clips.
        const law = building.addLightWeapon("inf-rocket-launcher-law")!;
        building.setLightWeaponClips(law.uuid, 3);
        expect(law.clips).toBe(0);
        expect(Building.getLightMountShots(law)).toBe(1);
    });

    it("weighs a pintle at 5 percent of its weapons, to the kilogram, and adds turret weapons to the turret (TO:AUE p.83)", () => {
        const building = hall();
        const gun = building.addLightWeapon("inf-machine-gun-support", 1, "pintle")!;
        building.setLightWeaponClips(gun.uuid, 4);
        // 44 kg x 0.05 = 2.2 kg, up to 3 kg; the clips are not counted.
        expect(building.getPintleWeight(1)).toBe(0.003);
        // 44 kg + 4 x 5 kg + 3 kg.
        expect(building.getLightWeaponWeight(1)).toBe(0.067);
        building.setLightWeaponMount(gun.uuid, "turret");
        expect(building.getPintleWeight(1)).toBe(0);
        // 10 percent of 0.044 tons, up to the half ton.
        expect(building.getTurretWeight(1)).toBe(0.5);
        expect(building.hasTurret()).toBe(true);
    });

    it("needs each weapon's own crew, and no heat sinks or amplifiers (user ruling; TM pp.136-137)", () => {
        const building = hall();
        // The Support PPC has a crew of 5 on the infantry table, the laser rifle 1.
        building.addLightWeapon("inf-particle-cannon-support");
        building.addLightWeapon("inf-laser-rifle");
        expect(building.getMinimumGunners()).toBe(6);
        expect(building.getMinimumOfficers()).toBe(1);
        expect(building.getEnergyWeaponHeat()).toBe(0);
        expect(building.getPowerAmplifierWeight(1)).toBe(0);
        expect(building.getIssues()).toEqual([]);
    });

    it("rounds damage to the nearest point and sets ranges from the Base Range (TM p.136)", () => {
        // The book's own examples: a 0.53 weapon does 1 point, a 0.35 weapon none.
        expect(Building.getLightWeaponDamage({ ...findInfantryWeapon("inf-auto-rifle")!, damage: 0.53 })).toBe(1);
        expect(Building.getLightWeaponDamage({ ...findInfantryWeapon("inf-auto-rifle")!, damage: 0.35 })).toBe(0);
        expect(Building.getLightWeaponDamage({ ...findInfantryWeapon("inf-auto-rifle")!, damage: 0.5 })).toBe(1);
        expect(Building.getLightWeaponRanges({ ...findInfantryWeapon("inf-auto-rifle")!, baseRange: 2 })).toEqual({ short: 2, medium: 4, long: 6 });
        expect(Building.getLightWeaponRanges({ ...findInfantryWeapon("inf-auto-rifle")!, baseRange: 0 })).toEqual({ short: 0, medium: 1, long: 2 });
    });

    it("prices the weapon, extra clips and pintles (TM pp.280, 298-301)", () => {
        const building = hall();
        const base = building.getCBillCost();
        const rifle = building.addLightWeapon("inf-auto-rifle", 1, "pintle")!;
        building.setLightWeaponClips(rifle.uuid, 10);
        // 80 for the rifle, 10 x 2 for clips, and a 1 kg pintle at 1,000 a ton; all times 1.4 for CF 40.
        expect(building.getCBillCost() - base).toBe(Math.round((80 + 20 + 1) * 1.4));
        // An energy-cell weapon with extra clips adds one 200 C-bill supply of power cells.
        const laser = building.addLightWeapon("inf-laser-rifle")!;
        const before = building.getCBillCost();
        building.setLightWeaponClips(laser.uuid, 3);
        expect(building.getCBillCost() - before).toBe(Math.round(200 * 1.4));
        // Inferno clips cost half, as SRM inferno ammunition does against standard (user ruling): 80 against 40.
        const standard = building.addLightWeapon("inf-grenade-launcher")!;
        const start = building.getCBillCost();
        building.setLightWeaponClips(standard.uuid, 10);
        const inferno = building.addLightWeapon("inf-grenade-launcher-inferno")!;
        const middle = building.getCBillCost();
        building.setLightWeaponClips(inferno.uuid, 10);
        expect(building.getCBillCost() - middle).toBe(Math.round(400 * 1.4));
        expect(middle - start).toBe(Math.round((800 + 465) * 1.4));
    });

    it("saves and reloads its weapons, and reads a damaged save field by field", () => {
        const building = hall();
        building.setHexes(2);
        const gun = building.addLightWeapon("inf-machine-gun-support", 2, "pintle")!;
        building.setLightWeaponClips(gun.uuid, 2);
        const copy = new Building();
        copy.importJSON(building.exportJSON());
        expect(copy.getImportIssues()).toEqual([]);
        expect(copy.getLightWeapons()).toHaveLength(1);
        expect(copy.getLightWeapons()[0]).toMatchObject({ uuid: gun.uuid, hex: 2, mount: "pintle", clips: 2 });
        expect(copy.getTotalWeight()).toBe(building.getTotalWeight());

        const saved = building.export() as unknown as Record<string, unknown>;
        saved.lightWeapons = [
            { tag: "inf-auto-rifle", hex: 99, mount: "catapult", clips: -4 },
            { tag: "__proto__" }, { tag: "no-such-weapon" }, "nonsense", { tag: 7 },
        ];
        const damaged = new Building();
        damaged.importJSON(JSON.stringify(saved));
        expect(damaged.getLightWeapons()).toHaveLength(1);
        expect(damaged.getLightWeapons()[0]).toMatchObject({ hex: 2, mount: "fixed", clips: 0 });
        expect(damaged.getImportIssues().length).toBe(4);

        // A save from before Light and Medium weapons loads with none.
        const old = building.export() as unknown as Record<string, unknown>;
        delete old.lightWeapons;
        const loaded = new Building();
        loaded.importJSON(JSON.stringify(old));
        expect(loaded.getLightWeapons()).toEqual([]);
        expect(loaded.getImportIssues()).toEqual([]);

        // A classification that mounts none drops them.
        building.setClassification("fortress");
        expect(building.getLightWeapons()).toEqual([]);
    });

});

describe("Castles Brian (TO:AR pp.113, 115-116, 124-125, 127-129, 137-140)", () => {
    // The sample complex's Command Tower: a Heavy Castles Brian, 1 hex, 4 levels, CF 50, 32 tons of armor (TO:AR p.140).
    const tower = (): Building => {
        const building = new Building();
        building.setClassification("castles-brian");
        building.setType("heavy");
        building.setCF(50);
        building.setLevels(4);
        building.setArmorTons(32);
        return building;
    };
    // The sample complex's man-made cave: Hardened, 2 levels, CF 150, open-space construction, no armor (TO:AR p.141).
    const cave = (): Building => {
        const building = new Building();
        building.setClassification("castles-brian");
        building.setType("hardened");
        building.setCF(150);
        building.setLevels(2);
        building.setOpenSpace(true);
        return building;
    };

    it("carries 10 tons for each point of its capital-scale Construction Factor, per level (TO:AR p.127)", () => {
        const building = tower();
        expect(building.isCapitalScale()).toBe(true);
        expect(building.getStandardCF()).toBe(500);
        expect(building.getCapacityPerHex()).toBe(50 * 10 * 4);
    });

    it("divides its armor points by 10, rounded down, to a maximum of twice the Construction Factor (TO:AR pp.113, 128)", () => {
        const building = tower();
        // 32 tons x 16 points = 512 standard points: the book's "50 capital points, or 32 tons" (TO:AR p.140).
        expect(building.getArmorPoints()).toBe(51);
        expect(building.getMaxArmorPoints()).toBe(100);
        expect(building.getMaxArmorTons()).toBe(Math.ceil(1000 / 16));
        building.setArmorTons(500);
        expect(building.getArmorTons()).toBe(63);
        expect(building.getArmorPoints()).toBe(100);
        building.setTech("clan");
        expect(building.getArmorTons()).toBe(50);
        expect(building.getArmorPoints()).toBe(100);
    });

    it("does not divide its Construction Factor for Heavy weapon tonnage, and mounts no Light or Medium weapons (TO:AR p.129)", () => {
        const building = tower();
        expect(building.canMountHeavyWeapons()).toBe(true);
        expect(building.getHeavyWeaponLimitPerHex()).toBe(50 * 4);
        expect(building.canMountLightWeapons()).toBe(false);
    });

    it("is sealed by default at no cost, and keeps its full size underground (TO:AR pp.116, 135, 138)", () => {
        const building = tower();
        expect(building.isSealed()).toBe(true);
        expect(building.canSeal()).toBe(false);
        expect(building.setSealed(false)).toBe(true);
        expect(building.getStructureCostMultiplier()).toBe(1);
        building.setType("hardened");
        building.setSubsurface("underground");
        expect(building.getMaxHexes()).toBe(70);
        expect(building.getMaxLevels()).toBe(15);
        expect(building.getStructureCostMultiplier()).toBe(5);
        const fortress = new Building();
        fortress.setClassification("fortress");
        fortress.setType("hardened");
        fortress.setSubsurface("underground");
        expect(fortress.getMaxHexes()).toBe(10);
    });

    it("takes high or low ceilings and large doors (TO:AR pp.135-136)", () => {
        const building = tower();
        expect(building.setCeilings("high")).toBe("high");
        expect(building.addDoor(2)).toEqual([2]);
        // An elevator lifts what the Construction Factor supports: 10 tons a capital-scale point.
        building.addElevator(1, 400, 2);
        expect(building.getElevators()[0].capacity).toBe(400);
    });

    it("limits open-space construction to 600 tons with nothing on the roof (TO:AR p.137)", () => {
        const building = cave();
        expect(building.isOpenSpace()).toBe(true);
        expect(building.getCapacityPerHex()).toBe(600);
        building.setHexes(10);
        expect(building.getTotalCapacity()).toBe(600);
        expect(building.getStructureCostMultiplier()).toBe(2.5);
        expect(building.getIssues()).toEqual([]);
        expect(building.addEquipmentFromTag("medium-laser", 1, true)).not.toBeNull();
        expect(building.getIssues().join(" ")).toContain("Open-space construction mounts no rooftop equipment or turrets");
        // Only Castles Brian may use it.
        const fortress = new Building();
        fortress.setClassification("fortress");
        expect(fortress.canHaveOpenSpace()).toBe(false);
        expect(fortress.setOpenSpace(true)).toBe(false);
        building.setClassification("fortress");
        expect(building.isOpenSpace()).toBe(false);
    });

    it("costs 1,000,000 C-bills a point of CF, with the CF x 10 in the final multiplier (TO:AR p.208)", () => {
        const building = cave();
        // 1,000,000 x CF 150 x 1 hex x 2 levels x 2.5 for open space, x (1 + 1,500 / 100).
        expect(building.getCBillCost()).toBe(1000000 * 150 * 2 * 2.5 * 16);
        expect(building.getCBillCostLog().at(-1)).toContain("capital-scale CF 150 x 10");
    });

    it("round-trips through its export and refuses open space on another classification", () => {
        const building = cave();
        building.setHexes(3);
        const copy = new Building(building.exportJSON());
        expect(copy.getImportIssues()).toEqual([]);
        expect(copy.export()).toEqual({ ...building.export(), lastUpdated: copy.lastUpdated });
        expect(copy.isOpenSpace()).toBe(true);
        expect(copy.isSealed()).toBe(true);
        const forged = new Building(JSON.stringify({ ...building.export(), classification: "fortress", openSpace: true }));
        expect(forged.isOpenSpace()).toBe(false);
    });
});

describe("capital and sub-capital weapons on buildings (TO:AR pp.129-130; TO:AUE p.83)", () => {
    it("offers them to fortresses and Castles Brian only, and never a Mass Driver (TO:AR p.129; TO:AUE p.135)", () => {
        expect(kenyon().canMountCapitalWeapons()).toBe(false);
        expect(kenyon().addCapitalWeapon("nl35")).toBeNull();
        expect(kenyon().getAvailableCapitalWeapons(4)).toEqual([]);
        const building = tara();
        expect(building.canMountCapitalWeapons()).toBe(true);
        const offered = building.getAvailableCapitalWeapons(4).map((weapon) => weapon.tag);
        expect(offered).toEqual(expect.arrayContaining(["nac-10", "heavy-n-gauss", "nl55", "heavy-n-ppc", "killer-whale", "ar-10-launcher", "kraken-t", "screen-launcher", "scl-1", "manta-ray"]));
        expect(offered.some((tag) => /mass-driver/.test(tag))).toBe(false);
        expect(building.addCapitalWeapon("light-mass-driver")).toBeNull();
        expect(building.addCapitalWeapon("no-such-weapon")).toBeNull();
        const castle = new Building();
        castle.setClassification("castles-brian");
        expect(castle.canMountCapitalWeapons()).toBe(true);
    });

    it("follows the technology base and the era", () => {
        const clan = tara();
        clan.setTech("clan");
        const clanTags = clan.getAvailableCapitalWeapons().map((weapon) => weapon.tag);
        // The tele-operated missiles and the Screen Launcher are Inner Sphere only (TM pp.210, 237).
        expect(clanTags).toContain("killer-whale");
        expect(clanTags).not.toContain("killer-whale-t");
        expect(clanTags).not.toContain("screen-launcher");
        // Extinct about 2950 and back in 3051 (IO:AE p.33).
        const late = tara();
        late.setEra("late-sw-rn");
        expect(late.getAvailableCapitalWeapons().map((weapon) => weapon.tag)).not.toContain("nac-10");
        late.setEra("star-league");
        expect(late.getAvailableCapitalWeapons().map((weapon) => weapon.tag)).toContain("nac-10");
        expect(late.getAvailableCapitalWeapons().map((weapon) => weapon.tag)).not.toContain("scl-1");
    });

    it("adds 10 percent for fire control to all but missile launchers, and needs fusion or fission power (TO:AUE p.83)", () => {
        const building = tara();
        const laser = building.addCapitalWeapon("nl35");
        expect(laser).not.toBeNull();
        expect(Building.getCapitalFireControlWeight(laser!.weapon)).toBe(70);
        expect(building.getCapitalFireControlWeight()).toBe(70);
        expect(building.getIssues().join(" ")).toContain("Without a fusion or fission generator");
        building.setGenerator("fuel-cell");
        expect(building.getIssues().join(" ")).toContain("Without a fusion or fission generator");
        building.setGenerator("fusion");
        expect(building.getIssues().join(" ")).not.toContain("Without a fusion or fission generator");
        // Capital energy weapons are not Heavy weapons: the generator weighs its 30 hexes and levels alone (TO:AR p.132).
        expect(building.getGeneratorWeight()).toBe(30);
        expect(building.getHexLoads()[0].heavyWeapons).toBe(0);
        expect(building.getHexLoads()[0].powerAmplifiers).toBe(0);

        const missiles = tara();
        const whale = missiles.addCapitalWeapon("killer-whale");
        expect(Building.getCapitalFireControlWeight(whale!.weapon)).toBe(0);
        expect(missiles.getIssues().join(" ")).not.toContain("fusion or fission");
        expect(missiles.addCapitalWeapon("piranha")).not.toBeNull();
        expect(missiles.addCapitalWeapon("screen-launcher")).not.toBeNull();
        expect(missiles.getIssues().join(" ")).not.toContain("fusion or fission");
    });

    it("divides a weapon too heavy for its hex evenly with the hexes next to it (TO:AUE p.83)", () => {
        const building = tara();
        building.setGenerator("fusion");
        const laser = building.addCapitalWeapon("nl35")!;
        // 700 tons and 70 of fire control, in a hex with 741 tons free less its 5-ton share of the generator.
        expect(building.getHexLoads()[0].capitalWeapons).toBe(770);
        expect(building.getIssues().join(" ")).toContain("Hex 1 carries 784 tons");
        building.setCapitalWeaponSharedHexes(laser.uuid, [2, 2, 1, 99, 2.5]);
        expect(laser.sharedHexes).toEqual([2]);
        expect(building.getHexLoads()[0].capitalWeapons).toBe(385);
        expect(building.getHexLoads()[1].capitalWeapons).toBe(385);
        expect(building.getHexLoads()[2].capitalWeapons).toBe(0);
        expect(building.getIssues().join(" ")).not.toContain("carries");
        // Moving the weapon into a hex it was sharing with drops that hex from the list.
        building.setCapitalWeaponHex(laser.uuid, 2);
        expect(laser.sharedHexes).toEqual([]);
        // Fewer hexes: the shares that no longer exist go.
        building.setCapitalWeaponSharedHexes(laser.uuid, [5, 6]);
        building.setHexes(4);
        expect(laser.sharedHexes).toEqual([]);
    });

    it("takes one capital weapon that is not a missile launcher in a hex, and no turret beside any (TO:AUE p.83)", () => {
        const building = new Building();
        building.setClassification("castles-brian");
        building.setType("hardened");
        building.setCF(150);
        building.setHexes(3);
        building.setLevels(5);
        building.setGenerator("fusion");
        const first = building.addCapitalWeapon("nl35")!;
        building.addCapitalWeapon("nl45");
        expect(building.getIssues().join(" ")).toContain("Hex 1 mounts 2 capital weapons that are not missile launchers; a hex takes one");
        building.setCapitalWeaponHex(first.uuid, 2);
        expect(building.getIssues().join(" ")).not.toContain("a hex takes one");
        // Any number of launchers beside the gun.
        building.addCapitalWeapon("killer-whale", 2);
        building.addCapitalWeapon("white-shark", 2);
        expect(building.getIssues().join(" ")).not.toContain("a hex takes one");
        building.setCapitalWeaponSharedHexes(first.uuid, [3]);
        expect(building.addEquipmentFromTag("lrm-20", 3, true)).not.toBeNull();
        expect(building.getIssues().join(" ")).toContain("Hex 3 holds a capital weapon, which leaves no room there for a turret or pintle mount");
    });

    it("carries ammunition by the shot and prices it as its book does", () => {
        const building = tara();
        const whale = building.addCapitalWeapon("killer-whale", 2)!;
        // A new launcher comes with 10 shots: 50 tons a missile (TM p.342).
        expect(whale.shots).toEqual({ "killer-whale": 10 });
        expect(Building.getCapitalAmmoWeight(whale)).toBe(500);
        expect(Building.getCapitalMountWeight(whale)).toBe(650);
        expect(building.getHexLoads()[1].capitalWeapons).toBe(650);
        const before = building.getCBillCostLog().find((line) => line.startsWith("Capital Weapons and Ammunition"));
        // 150,000 for the launcher and 20,000 a missile (TM pp.294, 296).
        expect(before).toBe("Capital Weapons and Ammunition: 350,000");
        building.setCapitalWeaponShots(whale.uuid, "killer-whale", 4);
        building.setCapitalWeaponShots(whale.uuid, "white-shark", 9);
        expect(whale.shots).toEqual({ "killer-whale": 4 });
        expect(building.getNotes().join(" ")).toContain("at least 10 shots on a DropShip");

        const guns = tara();
        const cannon = guns.addCapitalWeapon("nac-10")!;
        // 5 shots a ton (TO:AUE p.220); 30,000 C-bills a ton of ammunition (TO:AUE pp.221, 223).
        expect(Building.getCapitalAmmoWeight(cannon)).toBe(2);
        expect(guns.getCBillCostLog().find((line) => line.startsWith("Capital Weapons"))).toBe("Capital Weapons and Ammunition: 2,060,000");

        const launcher = tara();
        const ar10 = launcher.addCapitalWeapon("ar-10-launcher")!;
        expect(Object.keys(ar10.shots)).toEqual(["killer-whale", "white-shark", "barracuda"]);
        launcher.setCapitalWeaponShots(ar10.uuid, "killer-whale", 2);
        launcher.setCapitalWeaponShots(ar10.uuid, "white-shark", 3);
        launcher.setCapitalWeaponShots(ar10.uuid, "barracuda", 5);
        launcher.setCapitalWeaponShots(ar10.uuid, "kraken-t", 5);
        expect(Building.getCapitalShots(ar10)).toBe(10);
        expect(Building.getCapitalAmmoWeight(ar10)).toBe(2 * 50 + 3 * 40 + 5 * 30);
        expect(launcher.getCBillCostLog().find((line) => line.startsWith("Capital Weapons"))).toBe("Capital Weapons and Ammunition: 372,000");
    });

    it("needs 7 gunners a weapon and heat sinks for its lasers and PPCs (TO:AR p.130; TO:AUE p.83)", () => {
        const building = tara();
        building.setGenerator("fusion");
        const laser = building.addCapitalWeapon("nl35")!;
        building.setCapitalWeaponSharedHexes(laser.uuid, [2]);
        building.addCapitalWeapon("barracuda", 3);
        expect(building.getMinimumGunners()).toBe(14);
        expect(building.getMinimumOfficers()).toBe(2);
        expect(building.getEnergyWeaponHeat()).toBe(52);
        expect(building.getIssues().join(" ")).toContain("52 heat, 0 sunk");
        building.setHeatSinks(52);
        expect(building.getIssues()).toEqual([]);
        expect(building.getRequiredRulesLevel()).toBe(BUILDING_RULES_LEVEL);
        expect(building.getWeights().map((row) => row.name)).toEqual(expect.arrayContaining(["NL35, hex 1 with 2", "Barracuda, 10 shots, hex 3", "Capital Fire Control"]));
    });

    it("drops them when the classification changes", () => {
        const building = tara();
        building.addCapitalWeapon("killer-whale");
        building.setClassification("standard");
        expect(building.getCapitalWeapons()).toEqual([]);
    });

    it("saves and reloads them, and reads a damaged save field by field", () => {
        const building = tara();
        const whale = building.addCapitalWeapon("killer-whale", 2)!;
        building.setCapitalWeaponSharedHexes(whale.uuid, [3, 1]);
        building.addCapitalWeapon("scl-1", 4);
        const copy = new Building();
        copy.importJSON(building.exportJSON());
        expect(copy.getImportIssues()).toEqual([]);
        expect(copy.getCapitalWeapons().map((mount) => [mount.weapon.tag, mount.hex, mount.sharedHexes, mount.shots])).toEqual([
            ["killer-whale", 2, [1, 3], { "killer-whale": 10 }], ["scl-1", 4, [], {}],
        ]);
        expect(copy.getCapitalWeapons()[0].uuid).toBe(whale.uuid);
        expect(copy.getTotalWeight()).toBe(building.getTotalWeight());

        // An older save has no list at all.
        const plain = tara().export();
        expect(plain.capitalWeapons).toBeUndefined();

        const saved = JSON.parse(building.exportJSON());
        saved.capitalWeapons = [
            { tag: "killer-whale", hex: 99, sharedHexes: "2", shots: { "killer-whale": -4, "kraken-t": 50, __proto__: 1 }, uuid: 7 },
            { tag: "nac-10", hex: "x", sharedHexes: [2, "3", null, 2, 1], shots: { "nac-10": 1e9 } },
            { tag: "light-mass-driver" }, { tag: "nope" }, "junk", { hex: 1 },
        ];
        const damaged = new Building();
        damaged.importJSON(JSON.stringify(saved));
        expect(damaged.getCapitalWeapons().map((mount) => [mount.weapon.tag, mount.hex, mount.sharedHexes, mount.shots])).toEqual([
            ["killer-whale", 6, [], { "killer-whale": 0 }], ["nac-10", 1, [2], { "nac-10": 9999 }],
        ]);
        expect(damaged.getImportIssues().join(" | ")).toContain("Dropped Light Mass Driver");
        expect(damaged.getImportIssues().join(" | ")).toContain("Skipped unknown capital weapon \"nope\"");
        expect(damaged.getImportIssues().filter((line) => line.includes("could not be read")).length).toBe(2);

        saved.classification = "gun-emplacement";
        saved.capitalWeapons = [{ tag: "killer-whale" }];
        const emplacement = new Building();
        emplacement.importJSON(JSON.stringify(saved));
        expect(emplacement.getCapitalWeapons()).toEqual([]);
    });
});

describe("custom rule: capital weapons share an ammunition bunker in a hex next to them (user, 2026-10-07)", () => {
    const battery = (): Building => {
        const building = tara();
        building.addCapitalWeapon("killer-whale", 1);
        building.addCapitalWeapon("killer-whale", 3);
        building.addCapitalWeapon("white-shark", 3);
        return building;
    };

    it("keeps ammunition with the weapon unless a bunker is named, and needs the Custom Homebrew level", () => {
        const building = battery();
        expect(building.usesAmmoBunkers()).toBe(false);
        expect(building.getHexLoads().map((load) => load.capitalWeapons)).toEqual([650, 0, 1170, 0, 0, 0]);
        expect(building.getRequiredRulesLevel()).toBe(BUILDING_RULES_LEVEL);
        for (const mount of building.getCapitalWeapons()) building.setCapitalWeaponAmmoHex(mount.uuid, 2);
        expect(building.getCapitalWeapons().map((mount) => mount.ammoHex)).toEqual([2, 2, 2]);
        // The launchers stay where they are; 20 Killer Whales and 10 White Sharks go to the bunker.
        expect(building.getHexLoads().map((load) => load.capitalWeapons)).toEqual([150, 1400, 270, 0, 0, 0]);
        expect(building.getAmmoBunkerShots(2)).toEqual({ "killer-whale": 20, "white-shark": 10 });
        expect(building.getAmmoBunkerShots(1)).toEqual({});
        expect(building.getRequiredRulesLevel()).toBe(6);
        expect(building.getIssues(3).join(" ")).toContain("shared bunker in another hex is a custom rule");
        expect(building.getIssues(6).join(" ")).not.toContain("custom rule");
        expect(building.getNotes().join(" ")).toContain("Custom rule: capital weapons in the hexes next to an ammunition bunker share it");
    });

    it("has no bunker for a weapon without ammunition, in the weapon's own hex or off the building", () => {
        const building = battery();
        const [whale] = building.getCapitalWeapons();
        building.setCapitalWeaponAmmoHex(whale.uuid, 1);
        expect(whale.ammoHex).toBeNull();
        building.setCapitalWeaponAmmoHex(whale.uuid, 99);
        expect(whale.ammoHex).toBeNull();
        building.setCapitalWeaponAmmoHex(whale.uuid, 6);
        expect(whale.ammoHex).toBe(6);
        building.setCapitalWeaponHex(whale.uuid, 6);
        expect(whale.ammoHex).toBeNull();
        building.setCapitalWeaponAmmoHex(whale.uuid, 5);
        building.setHexes(4);
        expect(whale.ammoHex).toBeNull();
        const laser = building.addCapitalWeapon("scl-1", 1)!;
        building.setCapitalWeaponAmmoHex(laser.uuid, 2);
        expect(laser.ammoHex).toBeNull();
    });

    it("saves the bunker and reads a bad one as none", () => {
        const building = battery();
        building.setCapitalWeaponAmmoHex(building.getCapitalWeapons()[0].uuid, 2);
        const copy = new Building();
        copy.importJSON(building.exportJSON());
        expect(copy.getCapitalWeapons().map((mount) => mount.ammoHex)).toEqual([2, null, null]);
        const saved = JSON.parse(building.exportJSON());
        saved.capitalWeapons[0].ammoHex = "2";
        saved.capitalWeapons[1].ammoHex = 3;
        saved.capitalWeapons[2].ammoHex = 2.5;
        const damaged = new Building();
        damaged.importJSON(JSON.stringify(saved));
        expect(damaged.getCapitalWeapons().map((mount) => mount.ammoHex)).toEqual([null, null, null]);
    });
});
