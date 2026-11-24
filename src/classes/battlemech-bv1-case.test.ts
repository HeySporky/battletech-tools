import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

// BV1: which CASE excuses explosive ammunition in an arm of an Inner Sphere 'Mech with a standard engine.
// Master Rules with the FanPro errata (p.12): only CASE in the next location inward.
// Master Rules, Revised Edition (p.153): CASE in the arm or in the next location inward.

const place = (mech: BattleMech, tag: string, location: string, key: string) => {
    const item = mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined)!;
    const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid);
    const slot = mech.getCriticals()[key].findIndex(critical => !critical);
    expect(mech.moveCritical("un", from, location, slot), `${tag} in ${location}`).toBe(true);
};

/** A 50-ton Inner Sphere 'Mech with an AC/10, a ton of its ammunition in the left arm, and CASE where `caseIn` says. */
const battleValue = (edition: string, caseIn: "arm" | "torso" | "none"): number => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setRulesEdition(edition);
    mech.setTonnage(50);
    mech.setWalkSpeed(3);
    mech.setArmorWeight(10);
    mech.addEquipmentFromTag("autocannon-standard-c", "is", "", false, undefined, "", false, [], undefined, undefined);
    place(mech, "ammo-ac-10-standard", "la", "leftArm");
    if (caseIn !== "none") place(mech, "case", "lt", "leftTorso");
    if (caseIn === "arm") {
        // Both books allow Inner Sphere CASE only in a torso (BMR p.128, BMR(R) p.136) and the designer refuses an arm,
        // so this is a design that arrived with it there (an import): the slot is moved by hand.
        const criticals = mech.getCriticals();
        const from = criticals.leftTorso.findIndex(critical => critical?.tag === "case");
        const to = criticals.leftArm.findIndex(critical => !critical);
        criticals.leftArm[to] = criticals.leftTorso[from];
        criticals.leftTorso[from] = null as never;
    }
    return mech.getBattleValue(edition);
};

describe("BV1: CASE and ammunition in an arm, by edition", () => {
    it("Master Rules (errata p.12): CASE in the arm itself does not excuse the ammunition", () => {
        expect(battleValue("master-rules", "arm")).toBe(battleValue("master-rules", "none"));
    });

    it("Master Rules (errata p.12): CASE in the side torso inward excuses it", () => {
        expect(battleValue("master-rules", "torso")).toBeGreaterThan(battleValue("master-rules", "none"));
    });

    it("Master Rules, Revised (p.153): CASE in the arm excuses it, as CASE in the side torso does", () => {
        expect(battleValue("master-rules-revised", "arm")).toBe(battleValue("master-rules-revised", "torso"));
        expect(battleValue("master-rules-revised", "arm")).toBeGreaterThan(battleValue("master-rules-revised", "none"));
    });
});
