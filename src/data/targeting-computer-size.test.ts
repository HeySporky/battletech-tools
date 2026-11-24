import { describe, expect, it } from "vitest";
import AerospaceFighter from "../classes/aerospace-fighter";
import { BattleMech } from "../classes/battlemech";
import Vehicle from "../classes/vehicle";

// A Targeting Computer weighs 1 ton per 4 tons (Clan: 5) of direct-fire weapons, rounded up (TM p.238), on every
// unit that mounts one. A PPC Capacitor's weight "has no effect on the computer's size or tonnage" (TO:AUE p.194).
const tcTons = (items: { tag: string; weight: number }[]) => items.find((item) => item.tag === "targeting-computer")?.weight;

describe("a Targeting Computer's size", () => {
    it("leaves a PPC Capacitor's ton out on a 'Mech: 4 ER Medium, 4 ER Small and a Snub-Nose PPC w/ Capacitor take 3 tons", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setTonnage(50);
        for (let n = 0; n < 4; n++) mech.addEquipmentFromTag("er-medium-laser", "", "", false, null, undefined, undefined, undefined, undefined, undefined);
        for (let n = 0; n < 4; n++) mech.addEquipmentFromTag("er-small-laser", "", "", false, null, undefined, undefined, undefined, undefined, undefined);
        mech.addEquipmentFromTag("snub-nose-ppc-capacitor", "", "", false, null, undefined, undefined, undefined, undefined, undefined);
        mech.addEquipmentFromTag("targeting-computer", "", "", false, null, undefined, undefined, undefined, undefined, undefined);
        // 4 + 2 + 6 = 12 tons of weapons: 3 tons, not the 4 that 13 would give.
        expect(tcTons(mech.getInstalledEquipment())).toBe(3);
    });

    it("is worked out on a combat vehicle: 2 Large Lasers (10 tons) take 3", () => {
        const tank = new Vehicle();
        tank.setTech("is");
        tank.setTonnage(60);
        tank.addEquipmentFromTag("large-laser");
        tank.addEquipmentFromTag("large-laser");
        tank.addEquipmentFromTag("targeting-computer");
        expect(tcTons(tank.getEquipmentList())).toBe(3);
    });

    it("is worked out on an aerospace fighter: 2 Large Lasers (10 tons) take 3", () => {
        const fighter = new AerospaceFighter();
        fighter.setTech("is");
        fighter.setTonnage(60);
        fighter.addEquipmentFromTag("large-laser", "nose");
        fighter.addEquipmentFromTag("large-laser", "nose");
        fighter.addEquipmentFromTag("targeting-computer", "nose");
        expect(tcTons(fighter.getEquipmentList())).toBe(3);
    });
});
