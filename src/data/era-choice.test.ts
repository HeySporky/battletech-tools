import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import BattleArmor from "../classes/battle-armor";
import InfantryPlatoon from "../classes/infantry-platoon";
import Vehicle from "../classes/vehicle";
import { chooseEra, chooseEraByTechBase, getTechChoices } from "./era-choice";

// The era is picked first and decides the tech base (user ruling 2026-10-21).
describe("era-first choices", () => {
    it("switches a Clan vehicle to the Inner Sphere when the Star League era is picked", () => {
        const vehicle = new Vehicle();
        vehicle.setTech("clan");
        vehicle.setEra("clan-golden-years");
        chooseEra(vehicle, "star-league");
        expect(vehicle.getEra().tag).toBe("star-league");
        expect(vehicle.getTech().tag).toBe("is");
    });

    it("switches an Inner Sphere 'Mech to Clan when a Clan-only era is picked, and keeps Mixed Tech where it is allowed", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        chooseEra(mech, "clan-founding-years");
        expect(mech.getEra().tag).toBe("clan-founding-years");
        expect(mech.getTech().tag).toBe("clan");
        mech.setTech("mclan");
        chooseEra(mech, "jihad");
        expect(mech.getTech().tag).toBe("mclan");
    });

    it("offers only the era's own tech bases", () => {
        const all = ["is", "clan", "mis", "mclan"];
        const vehicle = new Vehicle();
        vehicle.setEra("star-league");
        expect(getTechChoices(vehicle.getEra(), all)).toEqual(["is"]);
        vehicle.setEra("jihad");
        expect(getTechChoices(vehicle.getEra(), all)).toEqual(all);
    });

    it("switches battle armor and infantry between Clan and Inner Sphere by era, and drops Mixed Tech where the era has none", () => {
        const suit = new BattleArmor();
        suit.setTechBase("clan");
        chooseEraByTechBase(suit, "star-league");
        expect(suit.getTechBase()).toBe("is");
        expect(suit.getEra().tag).toBe("star-league");
        suit.setMixedTech(true);
        chooseEraByTechBase(suit, "clan-founding-years");
        expect(suit.isMixedTech()).toBe(false);
        expect(suit.getTechBase()).toBe("clan");
        expect(suit.getEra().tag).toBe("clan-founding-years");
        const platoon = new InfantryPlatoon();
        platoon.setTechBase("clan");
        chooseEraByTechBase(platoon, "star-league");
        expect(platoon.getTechBase()).toBe("is");
        expect(platoon.getEra().tag).toBe("star-league");
    });
});
