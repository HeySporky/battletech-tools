import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import Vehicle from "./vehicle";
import AerospaceFighter from "./aerospace-fighter";
import { buildMech, buildVehicle } from "../test-support/builders";
import { equipmentMisc } from "../data/equipment-misc";

// TO:AUE p.109: Available To BM, IM, CV, SV, AF, CF, SC, DS, JS, WS, SS, MS; in the engine location (the center torso of a
// 'Mech, the body of a vehicle, the aft of a fighter). TO:AUE p.217 (Heavy Weapons and Equipment Construction Data, Corrected
// 6th printing): 100,000 C-bills, Var* tons, space M 1*, P NA, CV 1*, SV 1*, F 1*, SC 1*, DS/JS/WS/SS/MS 0*. BV 0 (p.216 table).
describe("Booby Trap on every unit type the book allows (TO:AUE pp.109, 216-217; #145)", () => {
    const record = equipmentMisc.find((item) => item.tag === "booby-trap")!;

    it("carries the printed price and space columns", () => {
        expect(record).toMatchObject({ cbills: 100000, battleValue: 0, rulesLevel: 4 });
        expect(record.space).toMatchObject({ battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 0 });
    });

    const addToMech = (mech: BattleMech) => mech.addEquipmentFromTag("booby-trap", mech.getTech().tag, "", false, undefined, "", false, [], undefined, undefined)!;
    const placeInMech = (mech: BattleMech, uuid: string | undefined, loc: string, key: string) =>
        mech.moveCritical("un", mech.unallocatedCriticals.findIndex((critical) => critical?.uuid === uuid), loc, (mech.getCriticals() as any)[key].findIndex((critical: unknown) => !critical));

    it("goes on a 'Mech in the center torso only: 10 percent to the half ton, one slot, 100,000 C-bills", () => {
        const mech = buildMech({ tonnage: 75 });
        expect(mech.getAvailableEquipment(false, 4).find((item) => item.tag === "booby-trap")?.available).toBe(true);
        const before = mech.getCBillCostNumeric();
        const trap = addToMech(mech);
        const mounted = mech.getInstalledEquipment().find((item) => item.uuid === trap.uuid) ?? trap;
        expect(mounted.weight).toBe(7.5);
        expect(placeInMech(mech, trap.uuid, "lt", "leftTorso")).toBe(false);
        expect(placeInMech(mech, trap.uuid, "ct", "centerTorso")).toBe(true);
        expect(mech.getCBillCostNumeric()).toBeGreaterThan(before);
    });

    const mountOnVehicle = (vehicle: Vehicle, location: string) => {
        vehicle.addEquipmentFromTag("booby-trap");
        const item = vehicle.getEquipmentList()[vehicle.getEquipmentList().length - 1];
        vehicle.setEquipmentLocation(item.uuid || "", location);
        return vehicle.getEquipmentList().find((entry) => entry.uuid === item.uuid)!;
    };

    it("goes in the body of a Combat Vehicle, never the turret, at 10 percent of the vehicle", () => {
        const tank = buildVehicle("tracked", 50);
        expect(tank.getAvailableEquipment(false, 4).some((item) => item.tag === "booby-trap")).toBe(true);
        const trap = mountOnVehicle(tank, "turret");
        expect(trap.location).toBeFalsy();
        tank.setEquipmentLocation(trap.uuid || "", "front");
        const placed = tank.getEquipmentList().find((entry) => entry.uuid === trap.uuid)!;
        expect([placed.location, placed.weight, placed.cbills]).toEqual(["front", 5, 100000]);
    });

    // ASC p.123: booby traps are explosive components, so a unit carrying one never gets ENE. ASC p.143 (Offensive Special
    // Ability Factor Table, aerospace units): BT adds Unit Size x (Highest Move x 0.5).
    it("takes ENE away from a 'Mech and adds nothing else to its card but BT", () => {
        const mech = buildMech({ tonnage: 75 });
        mech.addEquipmentFromTag("medium-laser", mech.getTech().tag, "", false, undefined, "", false, [], undefined, undefined);
        expect(mech.calcAlphaStrike().abilities).toContain("ENE");
        const trap = addToMech(mech);
        placeInMech(mech, trap.uuid, "ct", "centerTorso");
        const abilities = mech.calcAlphaStrike().abilities;
        expect(abilities).toContain("BT");
        expect(abilities).not.toContain("ENE");
    });

    it("takes ENE away from an aerospace fighter and adds Size x Thrust x 0.5 to its Point Value", () => {
        const fighter = new AerospaceFighter();
        fighter.setTonnage(50);
        fighter.addEquipmentFromTag("medium-laser");
        const before = fighter.getAlphaStrikeStats();
        expect(before.specialAbilities).toContain("ENE");
        fighter.addEquipmentFromTag("booby-trap", "aft");
        const after = fighter.getAlphaStrikeStats();
        expect(after.specialAbilities).toContain("BT");
        expect(after.specialAbilities).not.toContain("ENE");
        expect(after.calcLog).toContain(`BT ${after.size} x ${after.movement} x 0.5`);
    });

    it("is offered to a Support Vehicle and to an aerospace fighter", () => {
        const truck = buildVehicle("wheeled", 20);
        truck.setSupportVehicle(true);
        expect(truck.getAvailableEquipment(false, 4).some((item) => item.tag === "booby-trap")).toBe(true);
        const fighter = new AerospaceFighter();
        expect(fighter.getAvailableEquipment(false, 4).some((item) => item.tag === "booby-trap")).toBe(true);
    });
});
