import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import Vehicle from "../classes/vehicle";
import { findUnitCatalogRecord } from "./equipment-lookup";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

// A design saved in someone's browser keeps loading when the catalog no longer holds an item it carries: the item is
// dropped, everything else stays, and the design exports cleanly again.
const MADE_UP_ITEM = "custom-withdrawn-item";
const MADE_UP_AMMO = "ammo-custom-withdrawn-item";

describe("saved designs with equipment the catalog no longer holds", () => {
    it("has no record for a made-up tag, and still holds canon autocannons", () => {
        const tags = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment.map((item) => item.tag));
        expect(tags).not.toContain(MADE_UP_ITEM);
        expect(findUnitCatalogRecord("is", MADE_UP_ITEM)).toBeFalsy();
        expect(tags).toEqual(expect.arrayContaining(["rotary-ac-5", "clan-autocannon-uac-10"]));
    });

    it("loads a saved 'Mech with the unknown items dropped", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("dark-ages");
        mech.setTonnage(65);
        mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
        mech.addEquipmentFromTag("autocannon-standard-c", "is", "rt", false, null, "", false, [], undefined, undefined, -1, "", true);
        mech.addEquipmentFromTag("ammo-ac-10-standard", "is", "rt", false, null, "", false, [], undefined, undefined, -1, "", true);
        mech.addEquipmentFromTag("medium-laser", "is", "lt", false, null, "", false, [], undefined, undefined, -1, "", true);
        const saved = JSON.parse(mech.exportJSON());
        const swap: Record<string, string> = { "autocannon-standard-c": MADE_UP_ITEM, "ammo-ac-10-standard": MADE_UP_AMMO };
        let swapped = 0;
        for (const entry of saved.equipment) if (swap[entry.tag]) { entry.tag = swap[entry.tag]; swapped++; }
        expect(swapped).toBe(2);
        const loaded = new BattleMech(JSON.stringify(saved));
        const tags = loaded.getInstalledEquipment().map((item) => item.tag);
        expect(tags).toContain("medium-laser");
        expect(tags.filter((tag) => tag.includes("withdrawn"))).toEqual([]);
        expect(() => loaded.exportJSON()).not.toThrow();
    });

    it("loads a saved vehicle with the unknown items dropped", () => {
        const vehicle = new Vehicle();
        vehicle.setTech("is");
        vehicle.setTonnage(60);
        vehicle.addEquipmentFromTag("autocannon-standard-c", "front", false, undefined, true);
        vehicle.addEquipmentFromTag("medium-laser", "front", false, undefined, true);
        const saved = JSON.parse(vehicle.exportJSON());
        let swapped = 0;
        for (const entry of saved.equipment) if (entry.tag === "autocannon-standard-c") { entry.tag = MADE_UP_ITEM; swapped++; }
        expect(swapped).toBe(1);
        const loaded = new Vehicle(JSON.stringify(saved));
        const tags = loaded.getEquipmentList().map((item) => item.tag);
        expect(tags).toContain("medium-laser");
        expect(tags.filter((tag) => tag.includes("withdrawn"))).toEqual([]);
    });
});

describe("saved designs with fields the app no longer reads", () => {
    it("loads a saved vehicle with made-up extra fields as a plain vehicle", () => {
        const vehicle = new Vehicle();
        vehicle.setTech("is");
        vehicle.setEra("star-league");
        vehicle.setTonnage(55);
        vehicle.setMotiveType("tracked");
        vehicle.setHasTurret(true);
        vehicle.setCruiseMP(4);
        vehicle.addEquipmentFromTag("medium-laser", "front", false, undefined, true);
        const saved = JSON.parse(vehicle.exportJSON());
        saved.withdrawnMode = true;
        saved.inPlay = { ...(saved.inPlay ?? {}), withdrawnState: "active", withdrawnCounter: 3, withdrawnFlag: true };
        saved.equipment.push({ tag: MADE_UP_ITEM, location: "turret", rear: false, uuid: "1cd4cb2d-1bce-4fe5-b667-862ee7c0e175" });
        const loaded = new Vehicle(JSON.stringify(saved));
        expect(loaded.getMotiveType().tag).toBe("tracked");
        expect(loaded.getTonnage()).toBe(55);
        expect(loaded.getEquipmentList().map((item) => item.tag)).toEqual(["medium-laser"]);
        expect(loaded.getCruiseMP()).toBeGreaterThan(0);
        expect(() => loaded.getBattleValue()).not.toThrow();
        expect(loaded.exportJSON()).not.toContain("withdrawn");
    });
});
