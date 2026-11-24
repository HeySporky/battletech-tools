import { describe, expect, it } from "vitest";
import CapitalShip from "../classes/capital-ship";
import SmallCraft from "../classes/small-craft";
import { CONST_AS_SPECIAL_ABILITIES, ESpecialAbilityType } from "./alpha-strike-special-abilities";
import { MICRO_MECH_AEROTECH2, MICRO_MECH_OTHER_GAMES } from "./micro-mech-other-games";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { findTransportBayType } from "./small-craft-construction";
import { AIRCRAFT_BAY_TYPES, VEHICLE_BAY_TYPES } from "./vehicle-transport-bays";

// Micro-Mech Bay, from Micro-Mechs 6.1.0.2's AeroTech 2 supplement (Custom Homebrew, #173): 75 tons, one
// Micro-Mech of up to 19 tons, basic repair and quarters for its pilot and a technician, 15,000 C-bills.
describe("Micro-Mech Bay", () => {
    it("is a 75-ton, 15,000 C-bill bay for one Micro-Mech, with its pilot and technician, at Custom Homebrew", () => {
        const bay = findTransportBayType("micro-mech");
        expect(bay).toMatchObject({ tonsEach: 75, cost: 15000, personnel: 2, rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
        expect(bay?.costPerTon).toBeFalsy();
        expect(bay?.capacity).toContain("19 tons");
    });

    it("is an aerospace bay (the document's AeroTech 2 supplement): not offered on vehicles or support aircraft", () => {
        expect(VEHICLE_BAY_TYPES.some((type) => type.tag === "micro-mech")).toBe(false);
        expect(AIRCRAFT_BAY_TYPES.some((type) => type.tag === "micro-mech")).toBe(false);
    });

    it("weighs 75 tons a bay on a DropShip, takes a door, and makes the design Custom Homebrew", () => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setTonnage(3000);
        const before = ship.getRequiredRulesLevel();
        expect(before).toBeLessThan(CUSTOM_HOMEBREW_RULES_LEVEL);
        const bay = ship.addBay("micro-mech", 4);
        expect(bay?.doors).toBe(1);
        expect(ship.getBayWeight(ship.getBays()[0])).toBe(300);
        expect(ship.getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        ship.removeBay(0);
        expect(ship.getRequiredRulesLevel()).toBe(before);
    });

    it("makes a capital ship Custom Homebrew too, and survives a save", () => {
        const ship = new CapitalShip();
        ship.setShipType("warShip");
        ship.setTonnage(100000);
        ship.addBay("micro-mech", 2);
        expect(ship.getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        const loaded = new CapitalShip(ship.exportJSON());
        expect(loaded.getBays()).toEqual(ship.getBays());
        expect(loaded.getBayWeight(loaded.getBays()[0])).toBe(150);
    });

    it("gives a DropShip MMT# (NGCFells's) with its doors, and the canon unit-bay codes beside it, as the vehicles print them", () => {
        const ship = new SmallCraft();
        ship.setCraftType("dropShip");
        ship.setTonnage(3000);
        ship.addBay("micro-mech", 4);
        ship.addBay("mech", 2);
        const specials = ship.getAlphaStrikeStats().specialAbilities;
        expect(specials).toContain("MMT4-D1");
        expect(specials).toContain("MT2-D1");
    });

    it("gives a capital ship MMT# as it prints MT#", () => {
        const ship = new CapitalShip();
        ship.setShipType("warShip");
        ship.setTonnage(100000);
        ship.addBay("micro-mech", 2);
        expect(ship.getAlphaStrikeStats().specialAbilities).toContain("MMT2D1");
    });

    it("explains MMT# in the special abilities reference, as this app's own rule", () => {
        const mmt = CONST_AS_SPECIAL_ABILITIES.find((ability) => ability.tag === "MMT#");
        expect(mmt?.type).toBe(ESpecialAbilityType.Custom);
        expect(mmt?.summary.join(" ")).toMatch(/not an official/);
        expect(mmt?.summary.join(" ")).toMatch(/two Micro-Mechs/);
    });

    it("is what the AeroTech 2 stub says is built; the RPG and BattleForce 2 appendices are stubs for their own tools", () => {
        expect(MICRO_MECH_AEROTECH2.status).toBe("partial");
        expect(MICRO_MECH_AEROTECH2.built).toContain("\"micro-mech\"");
        expect(MICRO_MECH_AEROTECH2.rules.join(" ")).toMatch(/75 tons.*19 tons.*15,000 C-bills/);
        expect(MICRO_MECH_OTHER_GAMES.filter((stub) => stub.status === "stub").map((stub) => stub.game).sort()).toEqual(["battleforce2", "rpg"]);
    });
});
