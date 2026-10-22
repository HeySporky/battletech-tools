import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";
import BattleArmor from "./battle-armor";
import { BattleMech } from "./battlemech";
import CapitalShip from "./capital-ship";
import SmallCraft from "./small-craft";
import Vehicle from "./vehicle";

// Each unit class saves its quirks, and a weapon quirk still points at its weapon after a save and a load.
interface IQuirkUnit {
    quirks: { add: (quirk: { tag: string; equipmentUuid?: string }) => string | null; getAll: () => { tag: string; equipmentUuid?: string }[] };
    exportJSON: () => string;
}

const roundTrip = <T extends IQuirkUnit>(unit: T, weaponUuid: string, load: (json: string) => T, uuids: (unit: T) => string[]) => {
    expect(unit.quirks.add({ tag: "quirk-rugged" })).toBeNull();
    expect(unit.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: weaponUuid })).toBeNull();
    const loaded = load(unit.exportJSON());
    expect(loaded.quirks.getAll()).toEqual(unit.quirks.getAll());
    expect(uuids(loaded)).toContain(weaponUuid);
};

describe("quirks in saves", () => {
    it("round-trips a BattleMech's quirks", () => {
        const mech = new BattleMech();
        const laser = mech.addEquipmentFromTag("medium-laser", "is", "rt", false, undefined, "", false, [], undefined, undefined)!;
        expect(mech.getQuirkUnitType()).toBe("mech");
        roundTrip(mech, laser.uuid!, (json) => new BattleMech(json), (unit) => unit.getInstalledEquipment().map((item) => item.uuid!));
    });

    it("round-trips a vehicle's quirks", () => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag("medium-laser");
        const laser = vehicle.getEquipmentList()[vehicle.getEquipmentList().length - 1];
        expect(vehicle.getQuirkUnitType()).toBe("vehicle");
        roundTrip(vehicle, laser.uuid!, (json) => new Vehicle(json), (unit) => unit.getEquipmentList().map((item) => item.uuid!));
    });

    it("round-trips an aerospace fighter's quirks", () => {
        const fighter = new AerospaceFighter();
        const laser = fighter.addEquipmentFromTag("medium-laser", "nose")!;
        expect(fighter.getQuirkUnitType()).toBe("fighter-small-craft");
        roundTrip(fighter, laser.uuid!, (json) => new AerospaceFighter(json), (unit) => unit.getEquipmentList().map((item) => item.uuid!));
    });

    it("round-trips a Small Craft's quirks, and calls a DropShip a DropShip", () => {
        const craft = new SmallCraft();
        const laser = craft.addEquipmentFromTag("large-laser", "nose")!;
        expect(craft.getQuirkUnitType()).toBe("fighter-small-craft");
        roundTrip(craft, laser.uuid!, (json) => new SmallCraft(json), (unit) => unit.getEquipmentList().map((item) => item.uuid!));
        craft.setCraftType("dropShip");
        expect(craft.getQuirkUnitType()).toBe("dropship");
    });

    it("round-trips a large craft's quirks", () => {
        const ship = new CapitalShip();
        const laser = ship.addEquipmentFromTag("large-laser", "nose")!;
        expect(ship.getQuirkUnitType()).toBe("large-craft");
        roundTrip(ship, laser.uuid!, (json) => new CapitalShip(json), (unit) => unit.getEquipmentList().map((item) => item.uuid!));
    });

    it("round-trips battle armor's quirks, keeping each item's uuid", () => {
        const suit = new BattleArmor();
        expect(suit.addItem("is-er-small-laser", "la")).toBe(true);
        const laser = suit.getItems()[0];
        expect(suit.getQuirkUnitType()).toBe("battle-armor");
        roundTrip(suit, laser.uuid!, (json) => new BattleArmor(json), (unit) => unit.getItems().map((item) => item.uuid!));
    });

    it("loads a save without quirks as a unit without quirks", () => {
        const mech = new BattleMech();
        const loaded = new BattleMech(mech.exportJSON());
        expect(loaded.quirks.getAll()).toEqual([]);
        expect(loaded.export().quirks).toBeUndefined();
    });
});
