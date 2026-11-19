import { describe, expect, it } from "vitest";
import { QuirkList } from "../classes/quirk-list";
import { IAssignedQuirk } from "../data/quirk-interfaces";
import { BattleMech } from "../classes/battlemech";
import { getCarrierQuirkEffects, getQuirkEffects, getQuirkHeatGenerated, getQuirkInitiative, getQuirkToHit, getQuirkWeaponHeat } from "./quirk-effects";

const listOf = (...assigned: IAssignedQuirk[]): QuirkList => {
    const list = new QuirkList();
    for (const quirk of assigned) {
        expect(list.add(quirk)).toBeNull();
    }
    return list;
};

const INSTALLED = ["laser-a", "laser-b"];

describe("getQuirkToHit", () => {
    it("gives Accurate Weapon -1 to its own weapon only", () => {
        const list = listOf({ tag: "quirk-accurate-weapon", equipmentUuid: "laser-a" });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "short" })).toEqual({ modifier: -1, labels: ["Accurate Weapon (-1)"] });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-b", rangeBand: "short" })).toEqual({ modifier: 0, labels: [] });
    });

    it("gives a bay quirk to every weapon of the bay", () => {
        const list = listOf({ tag: "quirk-accurate-weapon", bayUuids: ["laser-a", "laser-b"] });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-b", rangeBand: "short" }).modifier).toBe(-1);
    });

    it("gives Improved Targeting (Long) -1 at long range and nothing at short", () => {
        const list = listOf({ tag: "quirk-improved-targeting", parameter: "long" });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "long" })).toEqual({ modifier: -1, labels: ["Improved Targeting (Long) (-1)"] });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "short" }).modifier).toBe(0);
    });

    it("gives Anti-Aircraft Targeting -2 only against an airborne target", () => {
        const list = listOf({ tag: "quirk-anti-aircraft-targeting" });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "medium", vsAirborne: true }).modifier).toBe(-2);
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "medium" }).modifier).toBe(0);
    });

    it("gives Stabilized Weapon -1 only after running or flanking", () => {
        const list = listOf({ tag: "quirk-stabilized-weapon", equipmentUuid: "laser-a" });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "short", attackerRanOrFlanked: true }).modifier).toBe(-1);
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "short" }).modifier).toBe(0);
    });

    it("keeps punch quirks off weapon attacks", () => {
        const list = listOf({ tag: "quirk-battlefists" });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "short" }).modifier).toBe(0);
        expect(getQuirkToHit(list, INSTALLED, 3025, { attack: "punch" }).modifier).toBe(-1);
    });

    it("adds Sensor Ghosts to Accurate Weapon", () => {
        const list = listOf({ tag: "quirk-accurate-weapon", equipmentUuid: "laser-a" }, { tag: "quirk-sensor-ghosts" });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "long" })).toEqual({ modifier: 0, labels: ["Accurate Weapon (-1)", "Sensor Ghosts (+1)"] });
    });

    // Review Focus 1: an assignment's years.
    it("ignores an assignment whose years do not include the game's year", () => {
        const list = listOf({ tag: "quirk-sensor-ghosts", toYear: 3024 });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "short" }).modifier).toBe(0);
        expect(getQuirkToHit(list, INSTALLED, 3024, { weaponUuid: "laser-a", rangeBand: "short" }).modifier).toBe(1);
    });

    // Review Focus 2: an OmniMech's pod swapped out.
    it("ignores a weapon quirk on a weapon not installed", () => {
        const list = listOf({ tag: "quirk-accurate-weapon", equipmentUuid: "laser-gone" });
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-gone", rangeBand: "short" }).modifier).toBe(0);
    });
});

describe("heat", () => {
    it("gives Combat Computer -4 heat generated", () => {
        expect(getQuirkHeatGenerated(listOf({ tag: "quirk-combat-computer" }), INSTALLED, 3025)).toBe(-4);
        expect(getQuirkHeatGenerated(listOf(), INSTALLED, 3025)).toBe(0);
    });

    it("changes a weapon's heat for a cooling jacket quirk, never below the quirk's minimum", () => {
        const list = listOf({ tag: "quirk-improved-cooling-jacket", equipmentUuid: "laser-a" }, { tag: "quirk-poor-cooling-jacket", equipmentUuid: "laser-b" });
        expect(getQuirkWeaponHeat(list, INSTALLED, 3025, "laser-a", 3)).toBe(2);
        expect(getQuirkWeaponHeat(list, INSTALLED, 3025, "laser-a", 1)).toBe(1);
        expect(getQuirkWeaponHeat(list, INSTALLED, 3025, "laser-b", 3)).toBe(4);
    });
});

describe("getQuirkInitiative", () => {
    it("gives Command 'Mech +1 and Battle Computer +2", () => {
        expect(getQuirkInitiative(listOf({ tag: "quirk-command-mech" }), INSTALLED, 3025)).toEqual({ modifier: 1, label: "Command 'Mech (+1)", title: "Command 'Mech" });
        expect(getQuirkInitiative(listOf({ tag: "quirk-battle-computer" }), INSTALLED, 3025)).toEqual({ modifier: 2, label: "Battle Computer (+2)", title: "Battle Computer" });
        expect(getQuirkInitiative(listOf(), INSTALLED, 3025)).toBeNull();
    });
});

// Barrel Fist: the arm with it punches without the +1 for lacking a hand (CO p.225), so -1 on that arm's punches only.
describe("Barrel Fist", () => {
    it("takes 1 off punches from its own arm, and nothing from the other arm or for weapons", () => {
        const list = listOf({ tag: "quirk-barrel-fist", location: "la" });
        expect(getQuirkToHit(list, INSTALLED, 3025, { attack: "punch", location: "la" }).modifier).toBe(-1);
        expect(getQuirkToHit(list, INSTALLED, 3025, { attack: "punch", location: "ra" }).modifier).toBe(0);
        expect(getQuirkToHit(list, INSTALLED, 3025, { weaponUuid: "laser-a", rangeBand: "short", location: "la" }).modifier).toBe(0);
    });
});

describe("what a quirk is on, in play", () => {
    it("names the weapon a weapon quirk is on, and the location of a location quirk", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.addEquipmentFromTag("medium-laser", "is", "rt", false, undefined, "a", false, [], undefined, undefined);
        expect(mech.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: mech.equipmentList[0].uuid })).toBeNull();
        expect(mech.quirks.add({ tag: "quirk-protected-actuators" })).toBeNull();
        const effects = getCarrierQuirkEffects(mech);
        expect(effects.find((applied) => applied.quirkName === "Accurate Weapon")?.on).toBe("Medium Laser (RT)");
        expect(effects.find((applied) => applied.quirkName === "Protected Actuators")?.on).toBeUndefined();
    });
});

describe("getQuirkEffects", () => {
    it("lists each active quirk's effects with a label, and a quirk with none once with no effect", () => {
        const list = listOf({ tag: "quirk-exposed-actuators" }, { tag: "quirk-multi-trac" });
        expect(getQuirkEffects(list, INSTALLED, 3025)).toEqual([
            { quirkName: "Exposed Actuators", title: "Exposed Actuators", label: "Exposed Actuators (-1)", effect: { type: "to-hit-against", modifier: -1, when: "Leg and Swarm attacks" } },
            { quirkName: "Multi-Trac", title: "Multi-Trac", label: "Multi-Trac", effect: null },
        ]);
    });
});
