import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import Vehicle from "./vehicle";
import AerospaceFighter from "./aerospace-fighter";
import SmallCraft from "./small-craft";
import CapitalShip from "./capital-ship";

// Clan artillery has its own Battle Value: Long Tom 560 (IS 368), Sniper 96 (IS 85), Thumper 48 (IS 43)
// (TO:AUE Clan Weapons and Equipment BV Table, p.197). With a single weapon and no ammunition, the weapon's share of
// the Battle Value scales with its listed BV, so the Clan-over-IS ratio of the added BV is the ratio of the listed values.
type Unit = { setTech(tag: string): unknown; getBattleValue(): number };
const addedBV = (make: () => Unit, add: (unit: Unit) => unknown, tech: string) => {
    const bare = make();
    bare.setTech(tech);
    const armed = make();
    armed.setTech(tech);
    expect(add(armed)).toBeTruthy();
    return armed.getBattleValue() - bare.getBattleValue();
};
const expectClanRatio = (make: () => Unit, add: (unit: Unit) => unknown, clan: number, is: number) => {
    expect(addedBV(make, add, "clan") / addedBV(make, add, "is")).toBeCloseTo(clan / is, 1);
};

describe("Clan artillery Battle Value on every unit that can mount it (issue 38)", () => {
    it("'Mech: Long Tom 560 against 368", () => {
        const make = () => { const mech = new BattleMech(); mech.setTonnage(100); mech.setWalkSpeed(3); return mech as unknown as Unit; };
        expectClanRatio(make, (unit) => { (unit as unknown as BattleMech).addEquipmentFromTag("long-tom-artillery", "is", "", false, undefined, "", false, [], undefined, undefined); return true; }, 560, 368);
    });
    it("vehicle: Long Tom 560 against 368", () => {
        const make = () => { const tank = new Vehicle(); tank.setTonnage(100); return tank as unknown as Unit; };
        expectClanRatio(make, (unit) => (unit as unknown as Vehicle).addEquipmentFromTag("long-tom-artillery", "front").length > 0, 560, 368);
    });
    it("aerospace fighter: Sniper 96 against 85", () => {
        const make = () => { const fighter = new AerospaceFighter(); fighter.setTonnage(100); return fighter as unknown as Unit; };
        expectClanRatio(make, (unit) => (unit as unknown as AerospaceFighter).addEquipmentFromTag("sniper-artillery", "nose"), 96, 85);
    });
    it("Small Craft: Long Tom 560 against 368", () => {
        const make = () => new SmallCraft() as unknown as Unit;
        expectClanRatio(make, (unit) => (unit as unknown as SmallCraft).addEquipmentFromTag("long-tom-artillery", "nose"), 560, 368);
    });
    it("capital ship: Long Tom 560 against 368", () => {
        const make = () => new CapitalShip() as unknown as Unit;
        expectClanRatio(make, (unit) => (unit as unknown as CapitalShip).addEquipmentFromTag("long-tom-artillery", "nose"), 560, 368);
    });
});
