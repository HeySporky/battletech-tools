import { describe, expect, it } from "vitest";
import { getQuirkSheetLines } from "./quirk-sheet-lines";

const labels: Record<string, string> = { w1: "Medium Laser", w2: "AC/20" };
const weaponLabel = (uuid: string) => labels[uuid];

describe("getQuirkSheetLines", () => {
    it("prints nothing for no quirks", () => {
        expect(getQuirkSheetLines([], weaponLabel)).toEqual({ unit: [], weapons: [] });
    });

    it("prints a unit quirk by name", () => {
        expect(getQuirkSheetLines([{ tag: "quirk-command-mech" }], weaponLabel).unit).toEqual(["Command 'Mech"]);
    });

    it("prints a range bracket, a value and a location", () => {
        const lines = getQuirkSheetLines([
            { tag: "quirk-improved-targeting", parameter: "long" },
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-battlefists", location: "la" },
        ], weaponLabel);
        expect(lines.unit).toEqual(["Improved Targeting (Long)", "Rugged (1)", "Battlefists (LA)"]);
    });

    it("prints each form of year range", () => {
        const lines = getQuirkSheetLines([
            { tag: "quirk-command-mech", toYear: 3024 },
            { tag: "quirk-rugged", parameter: 2, fromYear: 3050 },
            { tag: "quirk-battle-computer", fromYear: 3025, toYear: 3049 },
        ], weaponLabel);
        expect(lines.unit).toEqual(["Command 'Mech (to 3024)", "Rugged (2, from 3050)", "Battle Computer (3025-3049)"]);
    });

    it("prints each weapon's quirk names together, and none for a weapon not on the unit", () => {
        const lines = getQuirkSheetLines([
            { tag: "quirk-accurate-weapon", equipmentUuid: "w1" },
            { tag: "quirk-stabilized-weapon", equipmentUuid: "w1" },
            { tag: "quirk-inaccurate-weapon", equipmentUuid: "w2", toYear: 3030 },
            { tag: "quirk-accurate-weapon", equipmentUuid: "gone" },
        ], weaponLabel);
        expect(lines.unit).toEqual([]);
        expect(lines.weapons).toEqual([
            { uuid: "w1", text: "Accurate Weapon, Stabilized Weapon" },
            { uuid: "w2", text: "Inaccurate Weapon (to 3030)" },
        ]);
    });

    it("prints a location by its name when given the unit's location names", () => {
        const lines = getQuirkSheetLines([{ tag: "quirk-fast-reload", location: "front" }], weaponLabel, (tag) => (tag === "front" ? "Front" : undefined));
        expect(lines.unit).toEqual(["Fast Reload (Front)"]);
    });

    it("prints a quirk this browser does not know by its tag", () => {
        expect(getQuirkSheetLines([{ tag: "quirk-custom-someone-elses" }], weaponLabel).unit).toEqual(["quirk-custom-someone-elses"]);
    });
});
