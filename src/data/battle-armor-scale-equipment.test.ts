import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import Vehicle from "../classes/vehicle";
import { EXPERIMENTAL_RULES_LEVEL, getBattleArmorScaleListByTech, getCompatibleAmmo, getEquipmentListByTech, getWeaponShotsPerTon } from "./equipment-registry";
import { getBattleArmorScaleEquipment, getBattleArmorScaleExplosionDamage, getBattleArmorScaleHeat, getBattleArmorScaleWeight } from "./battle-armor-scale-equipment";

// Vehicle-Mounted Battle Armor Equipment: BattleTech Adventures: Ghosts of Obeedah pp.53-54.

const find = (techBase: "is" | "clan", tag: string) => getBattleArmorScaleEquipment(techBase).find((item) => item.tag === tag)!;

function mech(): BattleMech {
    const battleMech = new BattleMech();
    battleMech.setTech("is");
    battleMech.setEra("dark-ages");
    battleMech.setTonnage(20);
    return battleMech;
}

function tank(engineType: string = "standard"): Vehicle {
    const vehicle = new Vehicle();
    vehicle.setTech("is");
    vehicle.setEra("dark-ages");
    vehicle.setTonnage(40);
    vehicle.setCruiseMP(5);
    vehicle.setEngineType(engineType);
    return vehicle;
}

const addToMech = (battleMech: BattleMech, tag: string) =>
    battleMech.addEquipmentFromTag(tag, "is", undefined, false, undefined, "", false, [], undefined, undefined)!;

describe("Vehicle-Mounted Battle Armor Equipment (Ghosts of Obeedah pp.53-54)", () => {
    it("rounds a weapon's weight up to the quarter ton", () => {
        expect(getBattleArmorScaleWeight(35)).toBe(0.25);
        expect(getBattleArmorScaleWeight(250)).toBe(0.25);
        expect(getBattleArmorScaleWeight(275)).toBe(0.5);
        expect(getBattleArmorScaleWeight(800)).toBe(1);
        expect(getBattleArmorScaleWeight(1000)).toBe(1);
        // TM p.346: the Medium Recoilless Rifle is 250 kg and the ER Medium Laser 800 kg on a suit.
        expect(find("is", "ba-is-medium-recoilless-rifle").weight).toBe(0.25);
        expect(find("is", "ba-is-er-medium-laser").weight).toBe(1);
        expect(find("clan", "ba-clan-support-ppc").weight).toBe(0.25);
    });

    it("gives 1 heat for every 250 kg of an energy weapon and every 500 kg of any other", () => {
        expect(getBattleArmorScaleHeat("energy", 1)).toBe(4);
        expect(getBattleArmorScaleHeat("energy", 0.25)).toBe(1);
        expect(getBattleArmorScaleHeat("ballistic", 0.25)).toBe(0);
        expect(getBattleArmorScaleHeat("ballistic", 0.5)).toBe(1);
        expect(find("is", "ba-is-er-medium-laser").heat).toBe(4);
        expect(find("is", "ba-is-medium-recoilless-rifle").heat).toBe(0);
        expect(find("is", "ba-is-king-david-light-gauss-rifle").heat).toBe(1);
    });

    it("takes one slot on every unit, is Experimental, and is named with the BA- prefix", () => {
        for (const techBase of ["is", "clan"] as const) {
            for (const item of getBattleArmorScaleEquipment(techBase)) {
                expect(item.space.battlemech).toBe(1);
                expect(item.space.combatVehicle).toBe(1);
                expect(item.rulesLevel).toBe(EXPERIMENTAL_RULES_LEVEL);
                expect(item.name.startsWith("BA-")).toBe(true);
                expect(item.introduced).toBe(3095);
                expect(item.battleArmorScale).toBe(true);
            }
        }
    });

    it("leaves out the missile weapons the rule bars", () => {
        const names = [...getBattleArmorScaleEquipment("is"), ...getBattleArmorScaleEquipment("clan")].map((item) => item.name);
        expect(names.filter((name) => /SRM|LRM|MRM|Rocket|Mortar|Narc/i.test(name))).toEqual([]);
    });

    it("keeps its tags clear of every catalog record", () => {
        const catalogTags = getEquipmentListByTech("mis", true).flatMap((item) => [item.tag, ...(item.altTags ?? [])]);
        const tags = getBattleArmorScaleListByTech("mis").map((item) => item.tag);
        expect(new Set(tags).size).toBe(tags.length);
        expect(tags.filter((tag) => catalogTags.includes(tag))).toEqual([]);
        expect(catalogTags.some((tag) => tag.startsWith("ba-") || tag.startsWith("ammo-ba-"))).toBe(false);
    });

    it("counts shots as the mass carried divided by the weight of one shot, rounded down", () => {
        const rifle = find("is", "ba-is-medium-recoilless-rifle");
        const rounds = find("is", "ammo-ba-is-medium-recoilless-rifle");
        expect(getCompatibleAmmo(rifle, rounds)).toBe(true);
        expect(getCompatibleAmmo(find("is", "ba-is-machine-gun"), rounds)).toBe(false);
        // 2 kg a shot (TM p.346): 500 shots in a ton.
        expect(getWeaponShotsPerTon(rifle, rounds)).toBe(500);

        // The book's own sheets: the Tankette Drone carries 75 shots (150 kg), a Cherub arm bin 125 (250 kg).
        const vehicle = tank();
        vehicle.addEquipmentFromTag("ba-is-medium-recoilless-rifle");
        vehicle.addEquipmentFromTag("ammo-ba-is-medium-recoilless-rifle");
        const bin = vehicle.getEquipmentList().find((item) => item.isAmmo)!;
        expect(vehicle.getAmmoBinShots(bin)).toBe(125);
        vehicle.setAmmoBinShots(bin.uuid, 75);
        expect(bin.weight).toBe(0.15);

        // Whole kilograms: 37 Support PPC shots at 0.33 kg are 12.21 kg, carried as 13 kg, which is 39 shots.
        vehicle.addEquipmentFromTag("ba-is-support-ppc");
        vehicle.addEquipmentFromTag("ammo-ba-is-support-ppc");
        const cells = vehicle.getEquipmentList().find((item) => item.tag === "ammo-ba-is-support-ppc")!;
        vehicle.setAmmoBinShots(cells.uuid, 37);
        expect(cells.weight).toBe(0.013);
        expect(vehicle.getAmmoBinShots(cells)).toBe(39);
    });

    it("turns Fractional Accounting on, and keeps it on, while an item is mounted on a 'Mech", () => {
        const battleMech = mech();
        expect(battleMech.usesFractionalAccounting()).toBe(false);
        const laser = addToMech(battleMech, "ba-is-er-medium-laser");

        expect(battleMech.requiresFractionalAccounting()).toBe(true);
        expect(battleMech.usesFractionalAccounting()).toBe(true);
        expect(battleMech.setWeightAccounting("standard")).toBe("fractional");
        expect(battleMech.getRequiredRulesLevel()).toBeGreaterThanOrEqual(EXPERIMENTAL_RULES_LEVEL);
        expect(laser.heat).toBe(4);

        battleMech.removeEquipment(laser.uuid!);
        expect(battleMech.requiresFractionalAccounting()).toBe(false);
        expect(battleMech.setWeightAccounting("standard")).toBe("standard");
    });

    it("offers the weapons on a 'Mech only at the Experimental rules level, without power cells", () => {
        const battleMech = mech();
        expect(battleMech.getAvailableEquipment(false, 3).some((item) => item.battleArmorScale)).toBe(false);

        const offered = battleMech.getAvailableEquipment(false, EXPERIMENTAL_RULES_LEVEL).filter((item) => item.battleArmorScale);
        expect(offered.some((item) => item.tag === "ba-is-medium-laser")).toBe(true);
        expect(offered.some((item) => item.tag === "ammo-ba-is-medium-recoilless-rifle")).toBe(true);
        expect(offered.some((item) => item.tag === "ammo-ba-is-medium-laser")).toBe(false);
        expect(offered.some((item) => item.tag.startsWith("ba-clan-"))).toBe(false);
    });

    it("turns Fractional Accounting on, and keeps it on, while an item is mounted on a vehicle", () => {
        const vehicle = tank();
        expect(vehicle.getAvailableEquipment(false, 3).some((item) => item.battleArmorScale)).toBe(false);
        expect(vehicle.getAvailableEquipment(false, EXPERIMENTAL_RULES_LEVEL).some((item) => item.tag === "ba-is-machine-gun")).toBe(true);

        vehicle.addEquipmentFromTag("ba-is-machine-gun");
        expect(vehicle.usesFractionalAccounting()).toBe(true);
        expect(vehicle.setWeightAccounting("standard")).toBe("fractional");
        expect(vehicle.getRequiredRulesLevel()).toBeGreaterThanOrEqual(EXPERIMENTAL_RULES_LEVEL);

        vehicle.removeEquipment(vehicle.getEquipmentList()[0].uuid!);
        expect(vehicle.setWeightAccounting("standard")).toBe("standard");
    });

    it("needs heat sinks for an energy weapon on a vehicle unless it is fed from power cells", () => {
        const vehicle = tank();
        vehicle.addEquipmentFromTag("ba-is-er-medium-laser");
        expect(vehicle.getRequiredHeatSinks()).toBe(4);
        vehicle.addEquipmentFromTag("ammo-ba-is-er-medium-laser");
        expect(vehicle.getRequiredHeatSinks()).toBe(0);
    });

    it("needs no power amplifiers for a battle armor energy weapon", () => {
        const vehicle = tank("ice");
        vehicle.addEquipmentFromTag("ba-is-er-medium-laser");
        expect(vehicle.getPowerAmplifierWeight()).toBe(0);
        vehicle.addEquipmentFromTag("medium-laser");
        expect(vehicle.getPowerAmplifierWeight()).toBeGreaterThan(0);
    });

    it("explodes for 20 points for each quarter-ton of ammunition left", () => {
        expect(getBattleArmorScaleExplosionDamage(1)).toBe(80);
        expect(getBattleArmorScaleExplosionDamage(0.25)).toBe(20);
        expect(getBattleArmorScaleExplosionDamage(0)).toBe(0);

        const vehicle = tank();
        vehicle.addEquipmentFromTag("ba-is-machine-gun");
        vehicle.addEquipmentFromTag("ammo-ba-is-machine-gun");
        // A quarter-ton bin of machine gun rounds: 20 points, not 2,500 shots x 2 damage.
        expect(vehicle.getAmmunitionExplosionDamage()).toBe(20);
    });

    it("survives a save and load on a 'Mech and on a vehicle", () => {
        const battleMech = mech();
        addToMech(battleMech, "ba-is-medium-recoilless-rifle");
        const bin = addToMech(battleMech, "ammo-ba-is-medium-recoilless-rifle");
        battleMech.setAmmoBinShots(bin.uuid, 75);
        const loadedMech = new BattleMech(battleMech.exportJSON());
        expect(loadedMech.usesFractionalAccounting()).toBe(true);
        const loadedBin = loadedMech.getInstalledEquipment().find((item) => item.isAmmo)!;
        expect(loadedBin.weight).toBe(0.15);
        expect(loadedMech.getAmmoBinCapacity(loadedBin)).toBe(75);

        const vehicle = tank();
        vehicle.addEquipmentFromTag("ba-is-medium-recoilless-rifle");
        vehicle.addEquipmentFromTag("ammo-ba-is-medium-recoilless-rifle");
        vehicle.setAmmoBinShots(vehicle.getEquipmentList().find((item) => item.isAmmo)!.uuid, 75);
        const loadedVehicle = new Vehicle(vehicle.exportJSON());
        expect(loadedVehicle.usesFractionalAccounting()).toBe(true);
        expect(loadedVehicle.getEquipmentList().find((item) => item.isAmmo)!.weight).toBe(0.15);
        expect(loadedVehicle.getCurrentTonnage()).toBe(vehicle.getCurrentTonnage());
    });
});
