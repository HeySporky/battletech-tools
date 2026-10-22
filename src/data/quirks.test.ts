import { describe, expect, it } from "vitest";
import { getQuirk } from "./quirk-registry";
import { quirks } from "./quirks";

// From the Positive and Negative Quirk Tables (Campaign Operations pp.228 and 232), with each range-bracket row of
// Improved and Poor Targeting as one quirk, plus Trailer Hitch, which only Strategic Operations (2008) prints.
const POSITIVE = [
    "Accurate Weapon", "Anti-Aircraft Targeting", "Atmospheric Flyer", "Barrel Fist", "Battle Computer", "Battlefists",
    "Combat Computer", "Command 'Mech", "Compact 'Mech", "Cowl", "Directional Torso Mount", "Distracting",
    "Docking Arms", "Easy to Maintain", "Easy to Pilot", "Extended Torso Twist", "Fast Reload", "Fine Manipulators",
    "Good Reputation", "Hyper-Extending Actuators", "Improved Communications", "Improved Cooling Jacket",
    "Improved Life Support", "Improved Sensors", "Improved Targeting", "Internal Bomb Bay", "Jettison-Capable Weapon",
    "Modular Weapons", "Multi-Trac", "Narrow/Low Profile", "Nimble Jumper", "Overhead Arms", "Power Reverse",
    "Protected Actuators", "Reinforced Legs", "Rugged", "Rumble Seat", "Scout Bike", "Searchlight",
    "Stabilized Weapon", "Stable", "Ubiquitous", "Variable Range Targeting", "Vestigial Hands",
    "VTOL Rotor Arrangement", "Trailer Hitch",
];
const NEGATIVE = [
    "Ammunition Feed Problem", "Atmospheric Flight Instability", "Bad Reputation", "Cooling System Flaws",
    "Cramped Cockpit", "Difficult Ejection", "Difficult to Maintain", "EM Interference", "Exposed Actuators",
    "Exposed Weapon Linkage", "Fragile Fuel Tank", "Gas Hog", "Hard to Pilot", "Illegal Design", "Inaccurate Weapon",
    "Large DropShip", "Low-Mounted Arms", "No/Minimal Arms", "No Cooling Jacket", "No Ejection System",
    "No Torso Twist", "Non-Functional Item", "Non-Standard Parts", "Obsolete", "Oversized", "Poor Cooling Jacket",
    "Poor Life Support", "Poor Performance", "Poor Sealing", "Poor Targeting", "Poor Workmanship", "Prototype",
    "Ramshackle", "Sensor Ghosts", "Slow Traverse", "Static Ammo Feed", "Unbalanced", "Un-streamlined",
    "Weak Head Armor", "Weak Legs", "Weak Undercarriage",
];

const COST_FORMS = ["points", "choices", "per", "byAttach", "fromParameter"] as const;

describe("official quirks", () => {
    it("has every positive quirk in the tables", () => {
        expect(quirks.filter((quirk) => quirk.kind === "positive").map((quirk) => quirk.name).sort()).toEqual([...POSITIVE].sort());
    });

    it("has every negative quirk in the tables", () => {
        expect(quirks.filter((quirk) => quirk.kind === "negative").map((quirk) => quirk.name).sort()).toEqual([...NEGATIVE].sort());
    });

    it("gives every quirk a unique quirk- tag", () => {
        const tags = quirks.map((quirk) => quirk.tag);
        expect(new Set(tags).size).toBe(tags.length);
        expect(tags.every((tag) => tag.startsWith("quirk-"))).toBe(true);
    });

    it("gives every quirk unit types, sources, a summary, attachments and one cost form", () => {
        for (const quirk of quirks) {
            expect(quirk.unitTypes.length, quirk.name).toBeGreaterThan(0);
            expect(quirk.sources.length, quirk.name).toBeGreaterThan(0);
            expect(quirk.summary.trim(), quirk.name).not.toBe("");
            expect(quirk.attaches.length, quirk.name).toBeGreaterThan(0);
            expect(COST_FORMS.filter((form) => quirk.cost[form] !== undefined), quirk.name).toHaveLength(1);
        }
    });

    it("resolves every exclusion both ways", () => {
        for (const quirk of quirks) {
            for (const tag of quirk.excludes ?? []) {
                const other = getQuirk(tag);
                expect(other, `${quirk.name} excludes ${tag}`).toBeDefined();
                expect(other?.excludes ?? [], `${other?.name} excludes ${quirk.tag}`).toContain(quirk.tag);
            }
        }
    });

    it("keeps Battle Computer and Command 'Mech apart (CO p.225)", () => {
        expect(getQuirk("quirk-battle-computer")?.excludes).toContain("quirk-command-mech");
    });

    it("prices Command 'Mech at 2 points, 'Mechs only (CO p.225, p.228)", () => {
        const quirk = getQuirk("Command 'Mech");
        expect(quirk?.cost).toEqual({ points: 2 });
        expect(quirk?.unitTypes).toEqual(["mech"]);
    });

    it("prices Combat Computer at 3 points (CO p.225)", () => {
        expect(getQuirk("Combat Computer")?.cost).toEqual({ points: 3 });
    });

    it("prices Accurate Weapon by damage, 2 points for no damage (CO p.225)", () => {
        expect(getQuirk("Accurate Weapon")?.cost).toEqual({ per: { points: 1, damage: 5, scope: "weapon" }, zeroDamagePoints: 2 });
    });

    it("prices Improved Targeting 3, 4 or 5 by range bracket (CO p.228)", () => {
        const quirk = getQuirk("Improved Targeting");
        expect(quirk?.cost).toEqual({ choices: [3, 4, 5] });
        expect(quirk?.parameter?.options).toEqual(["short", "medium", "long"]);
    });

    it("finds the Strategic Operations spellings", () => {
        expect(getQuirk("Command BattleMech")?.tag).toBe("quirk-command-mech");
        expect(getQuirk("No Ejection Mechanism")?.tag).toBe("quirk-no-ejection-system");
    });

    it("cites a book and a page for every source", () => {
        for (const quirk of quirks) {
            for (const source of quirk.sources) {
                expect(["Campaign Operations", "BattleMech Manual", "Strategic Operations"], quirk.name).toContain(source.book);
                expect(source.page, quirk.name).toBeGreaterThan(0);
            }
        }
    });
});
