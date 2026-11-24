import { describe, expect, it } from "vitest";
import { energyCustom } from "./energy-custom";
import { equipmentEnergy } from "./equipment-energy";
import { isEquipmentOffered } from "./equipment-registry";
import equipmentReadout from "../../docs/lore/homebrew-equipment-tro.md?raw";

// Sonic projectors (#645): NGCFells.

const TAGS = ["custom-sonic-projector-military", "custom-sonic-projector-law-enforcement"];
const rec = (tag: string) => {
    const found = energyCustom.find((item) => item.tag === tag);
    if (!found) throw new Error(`missing ${tag}`);
    return found;
};

describe("sonic projectors (#645)", () => {
    it("sonic projectors are 1 heat and never lethal", () => {
        expect(rec("custom-sonic-projector-military")).toMatchObject({ weight: 2, heat: 1, sonic: true, damage: 0, introduced: 2425 });
        expect(rec("custom-sonic-projector-law-enforcement")).toMatchObject({ weight: 1, heat: 1, sonic: true, damage: 0, introduced: 2310 });
    });

    it("the Bombast Laser dials 7-12", () => {
        expect(equipmentEnergy.find((item) => item.tag === "bombast-laser")!.dial).toEqual({ min: 7, max: 12, kind: "bombast" });
    });

    it("every creator offers the sonic projectors at level 6 and not at level 4; they fit no aerospace unit", () => {
        for (const tag of TAGS) {
            expect(isEquipmentOffered(rec(tag), "total-warfare", 6)).toBe(true);
            expect(isEquipmentOffered(rec(tag), "total-warfare", 4)).toBe(false);
        }
        for (const tag of ["custom-sonic-projector-military", "custom-sonic-projector-law-enforcement"]) {
            expect(rec(tag).space.aerospaceFighter).toBe(-1);
            expect(rec(tag).space.dropShip).toBe(-1);
        }
    });

    it("the readout names each record and the credit", () => {
        for (const tag of TAGS) expect(equipmentReadout).toContain(rec(tag).name);
        expect(equipmentReadout).toMatch(/NGCFells/);
    });
});
