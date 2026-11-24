import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "./battlemech";

// SSW designs whose items were left unplaced, or dropped, on import (#43).
function importFixture(name: string): BattleMech {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const mech = new BattleMech();
    mech.importSSWXML(readFileSync(`src/utils/__fixtures__/${name}.ssw`, "utf8"));
    return mech;
}
const unplaced = (mech: BattleMech) => mech.getUnallocatedCriticals().map((item) => item.tag);
const tagsIn = (slots: ({ tag: string } | null | undefined)[]) => slots.map((slot) => slot?.tag ?? "");

describe("SSW import placement", () => {
    it("reads SSW's (CL) Mech Mortar 4 as the 2-slot Clan mortar: Antlion LK-3D", () => {
        const mech = importFixture("antlion-lk-3d");
        expect(unplaced(mech)).toEqual([]);
        expect(mech.getInstalledEquipment().filter((item) => item.tag === "clan-mech-mortar-4")).toHaveLength(2);
    });

    it("reads SSW's unprefixed ECM Suite as the 1-slot Clan suite on a Mixed Tech design: Spartan SPT-N4", () => {
        const mech = importFixture("spartan-spt-n4");
        expect(unplaced(mech)).toEqual([]);
        expect(mech.getCriticals().head[3]?.tag).toBe("clan-ecm-system");
    });

    it("puts Talons in both legs though SSW lists one, and imports the partial wing: Eyrie", () => {
        const mech = importFixture("eyrie");
        expect(unplaced(mech)).toEqual([]);
        expect(tagsIn(mech.getCriticals().leftLeg.slice(4, 6))).toEqual(["clan-talons", "clan-talons"]);
        expect(tagsIn(mech.getCriticals().rightLeg.slice(4, 6))).toEqual(["clan-talons", "clan-talons"]);
        // <partialwing tech="1" lsstart="2" rsstart="2" />: the Clan wing's 3 slots in each side torso.
        expect(mech.hasPartialWing()).toBe(true);
        expect(tagsIn(mech.getCriticals().leftTorso.slice(2, 5))).toEqual(["clan-partial-wing", "clan-partial-wing", "clan-partial-wing"]);
        expect(tagsIn(mech.getCriticals().rightTorso.slice(2, 5))).toEqual(["clan-partial-wing", "clan-partial-wing", "clan-partial-wing"]);
    });

    it("imports Mechanical Jump Boosters with their MP: Thunder Fox TFT-C3", () => {
        const mech = importFixture("thunder-fox-tft-c3");
        expect(unplaced(mech)).toEqual([]);
        expect(mech.getMechanicalJumpBoosterSpeed()).toBe(4); // <jumpbooster mp="4" />
    });

    it("sizes the Targeting Computer without the PPC Capacitor's ton: Hatchetman HCT-5DT", () => {
        const mech = importFixture("hatchetman-hct-5dt");
        expect(unplaced(mech)).toEqual([]);
        expect(mech.getInstalledEquipment().find((item) => item.tag === "targeting-computer")?.weight).toBe(3);
    });
});
