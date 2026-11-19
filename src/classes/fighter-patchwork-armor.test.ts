import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";

// Patchwork Armor on fighters (TO:AUE pp.188-189): an armor type per arc, each arc weighed by the point and
// rounded up to the half ton, giving up the weapon slots right of the slash in the Patchwork Armor Table.

const fighter = (tech: string = "is"): AerospaceFighter => {
    const unit = new AerospaceFighter();
    unit.setTech(tech);
    unit.setEra("early-rep");
    unit.setTonnage(50);
    return unit;
};

const patchworkFighter = (): AerospaceFighter => {
    const unit = fighter();
    unit.setArmorType("patchwork");
    unit.setArmorAllocation("nose", 80);
    unit.setArmorAllocation("leftWing", 60);
    unit.setArmorAllocation("rightWing", 60);
    unit.setArmorAllocation("aft", 40);
    unit.setPatchworkArmorType("nose", "ferro-aluminum");
    unit.setPatchworkArmorType("leftWing", "heavy-ferro-aluminum");
    unit.setPatchworkArmorType("aft", "light-ferro-aluminum");
    return unit;
};

describe("Patchwork Armor on fighters (TO:AUE pp.188-189)", () => {
    it("is offered from the Advanced rules level and needs it", () => {
        const unit = fighter();
        const patchwork = (level: number) => unit.getAvailableArmorTypes(level).find((armor) => armor.tag === "patchwork");
        expect(patchwork(2)?.available).toBe(false);
        expect(patchwork(3)?.available).toBe(true);
        unit.setArmorType("patchwork");
        expect(unit.getRequiredRulesLevel()).toBe(3);
    });

    it("weighs each arc by its type's tons per point, rounded up to the half ton", () => {
        const unit = patchworkFighter();
        // 80 x 0.0558 = 4.464; 60 x 0.0504 = 3.024; 60 x 0.0625 = 3.75; 40 x 0.0590 = 2.36.
        expect(unit.getPatchworkArcWeight("nose")).toBe(4.5);
        expect(unit.getPatchworkArcWeight("leftWing")).toBe(3.5);
        expect(unit.getPatchworkArcWeight("rightWing")).toBe(4);
        expect(unit.getPatchworkArcWeight("aft")).toBe(2.5);
        expect(unit.getArmorWeight()).toBe(14.5);
        expect(unit.getUnallocatedArmorPoints()).toBe(0);
    });

    it("gives up the type's weapon slots in each arc that carries it", () => {
        const unit = patchworkFighter();
        expect(unit.getArcSlots("nose")).toBe(4);
        expect(unit.getArcSlots("leftWing")).toBe(3);
        expect(unit.getArcSlots("rightWing")).toBe(5);
        expect(unit.getArcSlots("aft")).toBe(4);
    });

    it("prices each arc's armor at its own type's cost per ton", () => {
        const log = patchworkFighter().getCBillCostLog();
        expect(log).toContain("Armor, Nose (Ferro-Aluminum, 4.5 t)");
        expect(log).toContain("Armor, Left Wing (Heavy Ferro-Aluminum, 3.5 t)");
        expect(log).toContain("Armor, Right Wing (Standard Armor (Aerospace), 4 t)");
    });

    it("offers a Clan fighter only the Clan armor the table lists", () => {
        const unit = fighter("clan");
        unit.setArmorType("patchwork");
        expect(unit.getAvailablePatchworkArmorTypes(3).map((armor) => armor.tag)).toEqual(["aerospace-standard", "clan-ferro-aluminum"]);
        expect(unit.setPatchworkArmorType("nose", "ferro-aluminum").tag).toBe("aerospace-standard");
        unit.setPatchworkArmorType("nose", "clan-ferro-aluminum");
        expect(unit.getArcSlots("nose")).toBe(4);
        // A change of tech base drops what the new one cannot carry.
        unit.setTech("is");
        expect(unit.getPatchworkArmorType("nose").tag).toBe("aerospace-standard");
    });

    it("reports an arc's armor that the era does not allow", () => {
        const unit = patchworkFighter();
        expect(unit.getIssues(3).filter((issue) => issue.includes("not available"))).toEqual([]);
        unit.setEra("late-sw-rn");
        expect(unit.getIssues(3).join(" ")).toContain("Left Wing: Heavy Ferro-Aluminum is not available in the selected era.");
    });

    it("names each arc's armor for the record sheet", () => {
        expect(patchworkFighter().getArmorDescription()).toBe("Patchwork Armor (Nose: Ferro-Aluminum, Left Wing: Heavy Ferro-Aluminum, "
            + "Right Wing: Standard Armor (Aerospace), Aft: Light Ferro-Aluminum)");
    });

    it("saves and reloads the arc types", () => {
        const saved = patchworkFighter().export();
        expect(saved.patchworkArmor).toEqual({ nose: "ferro-aluminum", leftWing: "heavy-ferro-aluminum", rightWing: "aerospace-standard", aft: "light-ferro-aluminum" });
        const loaded = new AerospaceFighter(JSON.stringify(saved));
        expect(loaded.getPatchworkArmorType("leftWing").tag).toBe("heavy-ferro-aluminum");
        expect(loaded.getArmorWeight()).toBe(14.5);
        expect(loaded.getImportIssues()).toEqual([]);
    });
});
