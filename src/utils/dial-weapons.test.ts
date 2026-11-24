import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import Vehicle from "../classes/vehicle";
import { BattleMechForce } from "../classes/battlemech-force";
import { carriesSonicGear, clampDial, classicForceUsesSonic, describeDial, getDialBand } from "./dial-weapons";

describe("power dial (#645)", () => {
    it("Bombast 12 is 12 damage, 12 heat, +3; 7 is +0", () => {
        expect(getDialBand("bombast", 12)).toEqual({ band: "strike", damage: 12, heat: 12, toHit: 3 });
        expect(getDialBand("bombast", 8)).toMatchObject({ toHit: 1 });
        expect(getDialBand("bombast", 7)).toMatchObject({ toHit: 0 });
    });

    it("holds a setting to the printed 7-12", () => {
        expect(getDialBand("bombast", 3)).toMatchObject({ heat: 7 });
        expect(getDialBand("bombast", 20)).toMatchObject({ heat: 12 });
    });

    it("clamps to the record's dial; no setting is the top", () => {
        expect(clampDial({ min: 2, max: 4 }, 9)).toBe(4);
        expect(clampDial({ min: 2, max: 12 }, undefined)).toBe(12);
        expect(clampDial({ min: 7, max: 12 }, 3)).toBe(7);
    });

    it("says what the setting does", () => {
        expect(describeDial("bombast", 12)).toBe("Dial 12 (Bombast): 12 heat, +3 to hit, 12 damage");
    });
});

describe("who plays sonic projectors (#645, ours)", () => {
    it("a canon force does not; a force with a sonic projector or a level 6 Mech does", () => {
        const force = new BattleMechForce();
        force.groups[0].members.push(new BattleMech());
        force.groups[0].vehicles.push(new Vehicle());
        expect(classicForceUsesSonic(force.groups)).toBe(false);
        const tank = new Vehicle();
        tank.addEquipmentFromTag("custom-sonic-projector-law-enforcement");
        force.groups[0].vehicles.push(tank);
        expect(classicForceUsesSonic(force.groups)).toBe(true);
        const custom = new BattleMechForce();
        const mech = new BattleMech();
        mech.applyGameSettings({ ...mech.getGameSettings(6), rulesLevel: 6 });
        custom.groups[0].members.push(mech);
        expect(classicForceUsesSonic(custom.groups)).toBe(true);
    });

    it("sees a sonic projector, not a Bombast", () => {
        expect(carriesSonicGear([{ sonic: true }])).toBe(true);
        expect(carriesSonicGear([{}])).toBe(false);
    });
});
