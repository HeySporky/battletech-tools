import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import Vehicle from "./vehicle";

const TAG = "clan-lrm-5-artemis-v"; // rulesLevel 4 (Experimental), production 3085

const clanMech = (): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("clan");
    mech.setEra("ilClan");
    return mech;
};

describe("builders hide what the edition and level do not offer", () => {
    it("hides an Experimental weapon below Experimental", () => {
        const mech = clanMech();
        expect(mech.getAvailableEquipment(false, 3).some((item) => item.tag === TAG)).toBe(false);
        expect(mech.getAvailableEquipment(false, 4).some((item) => item.tag === TAG)).toBe(true);
    });

    it("keeps a hidden item installed", () => {
        const mech = clanMech();
        mech.addEquipmentFromTag(TAG, "", "", false, null, undefined, undefined, undefined, undefined, undefined);
        const battleValue = mech.getBattleValue();
        const restored = new BattleMech(mech.exportJSON(true));
        expect(restored.getAvailableEquipment(false, 3).some((item) => item.tag === TAG)).toBe(false);
        expect(restored.getInstalledEquipment().some((item) => item.tag === TAG)).toBe(true);
        expect(restored.getBattleValue()).toBe(battleValue);
    });

    it("vehicle pickers hide above the level", () => {
        const vehicle = new Vehicle();
        vehicle.setTech("clan");
        vehicle.setEra("ilClan");
        expect(vehicle.getAvailableEquipment(false, 3).some((item) => item.tag === TAG)).toBe(false);
        expect(vehicle.getAvailableEquipment(false, 4).some((item) => item.tag === TAG)).toBe(true);
    });
});

describe("the rules-edition issue list follows the pickers", () => {
    // Final review finding: custom equipment offered under an earlier edition was flagged as soon as it was installed.
    it("does not flag custom equipment the edition's picker offers", () => {
        const mech = new BattleMech();
        mech.setRulesEdition("battledroids");
        mech.addEquipmentFromTag("custom-ac-15", "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        expect(mech.getInstalledEquipment().some((item) => item.tag === "custom-ac-15")).toBe(true);
        expect(mech.getRulesEditionIssues(6).filter((line) => line.startsWith("Equipment:"))).toEqual([]);
    });
});
