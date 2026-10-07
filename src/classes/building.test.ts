import { describe, expect, it } from "vitest";
import Building, { BUILDING_RULES_LEVEL, normalizeBuildingExport } from "./building";
import { BUILDING_CLASSIFICATIONS, BUILDING_GENERATORS, findBuildingClassification } from "../data/building-classifications";

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
            ["bridge", "fence", "fortress", "gun-emplacement", "hangar", "standard", "tent", "wall"]);
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

    it("needs no power amplifiers or covering heat sinks on a fusion generator (TO:AR p.129, TO:AUE p.83)", () => {
        const building = kenyon();
        building.addEquipmentFromTag("clan-er-large-laser");
        building.addEquipmentFromTag("clan-er-large-laser");
        building.setGenerator("fusion");
        expect(building.getPowerAmplifierWeight(1)).toBe(0);
        expect(building.getIssues()).toEqual([]);
        // 1 hex x 1 level, plus 10 percent of 8 tons of energy weapons: 1.8, rounded up.
        expect(building.getGeneratorWeight()).toBe(2);
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
