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

    it("turns Fractional Accounting on by default when the first item is mounted on a 'Mech, and lets it be turned off", () => {
        const battleMech = mech();
        expect(battleMech.usesFractionalAccounting()).toBe(false);
        const laser = addToMech(battleMech, "ba-is-er-medium-laser");

        // "uses the Fractional Accounting construction option by default" (p.54); the book's Cherubs use standard rounding.
        expect(battleMech.defaultsToFractionalAccounting()).toBe(true);
        expect(battleMech.usesFractionalAccounting()).toBe(true);
        expect(battleMech.getRequiredRulesLevel()).toBeGreaterThanOrEqual(EXPERIMENTAL_RULES_LEVEL);
        expect(laser.heat).toBe(4);

        expect(battleMech.setWeightAccounting("standard")).toBe("standard");
        addToMech(battleMech, "ba-is-medium-laser");
        expect(battleMech.usesFractionalAccounting()).toBe(false);

        // Battle armor ammunition is still bought by the kilogram (p.54).
        const bin = addToMech(battleMech, "ammo-ba-is-medium-recoilless-rifle");
        addToMech(battleMech, "ba-is-medium-recoilless-rifle");
        expect(battleMech.canSetAmmoBinShots(bin)).toBe(true);
        expect(battleMech.setAmmoBinShots(bin.uuid, 125)).toBe(125);
        expect(bin.weight).toBe(0.25);
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

    it("turns Fractional Accounting on by default when the first item is mounted on a vehicle, and keeps a design saved without it", () => {
        const vehicle = tank();
        expect(vehicle.getAvailableEquipment(false, 3).some((item) => item.battleArmorScale)).toBe(false);
        expect(vehicle.getAvailableEquipment(false, EXPERIMENTAL_RULES_LEVEL).some((item) => item.tag === "ba-is-machine-gun")).toBe(true);

        vehicle.addEquipmentFromTag("ba-is-machine-gun");
        expect(vehicle.usesFractionalAccounting()).toBe(true);
        expect(vehicle.getRequiredRulesLevel()).toBeGreaterThanOrEqual(EXPERIMENTAL_RULES_LEVEL);

        vehicle.addEquipmentFromTag("ammo-ba-is-machine-gun");
        const bin = vehicle.getEquipmentList().find((item) => item.isAmmo)!;
        vehicle.setAmmoBinShots(bin.uuid, 75);
        expect(vehicle.setWeightAccounting("standard")).toBe("standard");
        // Battle armor ammunition stays by the kilogram when the option is off (p.54): 75 shots of 100 g.
        expect(bin.weight).toBe(0.008);
        vehicle.addEquipmentFromTag("ba-is-machine-gun");
        expect(vehicle.usesFractionalAccounting()).toBe(false);

        const reloaded = new Vehicle(vehicle.exportJSON());
        expect(reloaded.usesFractionalAccounting()).toBe(false);
        expect(reloaded.getEquipmentList().find((item) => item.isAmmo)?.weight).toBe(0.008);
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

    it("offers non-weapon equipment at its standard weight in one slot, but no mobility, fuel, power or life support gear", () => {
        const tags = [...getBattleArmorScaleEquipment("is"), ...getBattleArmorScaleEquipment("clan")].map((item) => item.tag);
        for (const tag of ["ba-is-active-probe", "ba-clan-active-probe", "ba-is-ecm-suite", "ba-is-angel-ecm", "ba-is-camo-system", "ba-is-c3-system",
            "ba-is-cutting-torch", "ba-is-searchlight", "ba-is-remote-sensor-dispenser", "ba-is-mine-dispenser", "ba-clan-heat-sensor", "ba-clan-improved-sensors"]) {
            expect(tags).toContain(tag);
        }
        expect(tags.filter((tag) => /jump-booster|myomer-booster|parafoil|partial-wing|fuel-tank|power-pack|life-support|space-operations|dropchute|magnetic-clamps|harjel|mission-equipment/.test(tag))).toEqual([]);

        // Not rounded to the quarter ton, as weapons are: TM pp.346-348.
        expect(find("is", "ba-is-cutting-torch").weight).toBe(0.005);
        expect(find("is", "ba-is-ecm-suite").weight).toBe(0.1);
        expect(find("clan", "ba-clan-active-probe").weight).toBe(0.15);
        expect(find("is", "ba-is-camo-system").space.combatVehicle).toBe(1);
        expect(find("is", "ba-is-active-probe").battleValue).toBe(0);
    });

    it("notes that battle armor stealth gear and C3 work only on a unit of 3 tons or less (p.55)", () => {
        for (const tag of ["ba-is-ecm-suite", "ba-is-angel-ecm", "ba-is-camo-system", "ba-is-c3-system", "ba-is-improved-c3-system"]) {
            expect(find("is", tag).notes).toContain("3 tons or less");
            expect(find("is", tag).alphaStrike.specialAbility).toEqual([]);
        }
        expect(find("is", "ba-is-active-probe").notes).not.toContain("3 tons or less");
        expect(find("is", "ba-is-active-probe").alphaStrike.specialAbility).toEqual(["LPRB"]);
    });

    it("mounts non-weapon equipment on a vehicle and a 'Mech by the kilogram", () => {
        const vehicle = tank();
        // Fractional Accounting changes the rest of the vehicle's weights, so it is on before the baseline is taken.
        expect(vehicle.setWeightAccounting("fractional", EXPERIMENTAL_RULES_LEVEL)).toBe("fractional");
        const before = vehicle.getCurrentTonnage();
        vehicle.addEquipmentFromTag("ba-is-cutting-torch");
        expect(vehicle.defaultsToFractionalAccounting()).toBe(true);
        expect(vehicle.getCurrentTonnage() - before).toBeCloseTo(0.005, 6);

        const battleMech = mech();
        expect(battleMech.getAvailableEquipment(false, EXPERIMENTAL_RULES_LEVEL).some((item) => item.tag === "ba-is-active-probe")).toBe(true);
        const probe = addToMech(battleMech, "ba-is-active-probe");
        expect(probe.weight).toBe(0.25);
        expect(battleMech.usesFractionalAccounting()).toBe(true);
    });

    it("offers the Taser, Pop-Up Mine, Bomb Rack and Tube Artillery, which are not missile weapons", () => {
        // Weights from the battle armor tables, rounded up to the quarter ton: 300, 200, 100 and 500 kg.
        const taser = find("is", "ba-is-taser");
        expect([taser.weight, taser.heat, taser.damage, taser.isOneShot, taser.battleValue]).toEqual([0.5, 1, 1, true, 15]);
        expect(taser.ammoTypes).toBeUndefined();
        const mine = find("is", "ba-is-pop-up-mine");
        expect([mine.weight, mine.heat, mine.damage, mine.isOneShot, mine.battleValue]).toEqual([0.25, 0, 4, true, 6]);
        const bombs = find("clan", "ba-clan-bomb-rack");
        expect([bombs.weight, bombs.damage, bombs.isOneShot, bombs.battleValue]).toEqual([0.25, 2, true, 11]);
        expect(getBattleArmorScaleEquipment("is").some((item) => item.tag === "ba-clan-bomb-rack")).toBe(false);

        // TO:AUE p.96: 3 points to the hex and 1 to those around it, 2 mapsheets, 15 kg a shot.
        const tube = find("is", "ba-is-tube-artillery");
        expect([tube.weight, tube.heat, tube.damage, tube.range.maxMapSheets, tube.category]).toEqual([0.5, 1, 3, 2, "Artillery Weapons"]);
        expect(tube.notes).toContain("1 to each adjacent hex");
        const shells = find("is", "ammo-ba-is-tube-artillery");
        expect(getCompatibleAmmo(tube, shells)).toBe(true);
        expect(getWeaponShotsPerTon(tube, shells)).toBeCloseTo(1000 / 15);
        expect(shells.battleValue).toBe(4);
    });

    it("mounts a Taser and Tube Artillery on a vehicle, with shells bought by the shot", () => {
        const vehicle = tank();
        vehicle.addEquipmentFromTag("ba-is-taser");
        vehicle.addEquipmentFromTag("ba-is-tube-artillery");
        vehicle.addEquipmentFromTag("ammo-ba-is-tube-artillery");
        const bin = vehicle.getEquipmentList().find((item) => item.isAmmo)!;
        vehicle.setAmmoBinShots(bin.uuid, 4);
        // 4 shells at 15 kg: 60 kg.
        expect(bin.weight).toBe(0.06);
        expect(vehicle.getAmmoBinShots(bin)).toBe(4);
        expect(vehicle.usesFractionalAccounting()).toBe(true);
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
