import { describe, expect, it } from "vitest";
import { getQuirk } from "./quirk-registry";
import { quirks } from "./quirks";
import { APOCRYPHAL_RULES_LEVEL } from "./rules-level-options";

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
                expect(["Campaign Operations", "BattleMech Manual", "Strategic Operations", "Campaign Operations Errata v5.0"], quirk.name).toContain(source.book);
                expect(source.page, quirk.name).toBeGreaterThan(0);
            }
        }
    });
});

describe("MegaMek quirk codes", () => {
    it("finds a quirk by its MegaMek code", () => {
        expect(getQuirk("command_mech")?.tag).toBe(getQuirk("Command 'Mech")?.tag);
        expect(getQuirk("imp_com")?.tag).toBe("quirk-improved-communications");
        expect(getQuirk("rugged_2")?.tag).toBe("quirk-rugged");
        expect(getQuirk("battle_fists_la")?.tag).toBe("quirk-battlefists");
        expect(getQuirk("stable_weapon")?.tag).toBe("quirk-stabilized-weapon");
        expect(getQuirk("no_arms")?.tag).toBe("quirk-no-minimal-arms");
    });

    it("gives no two quirks the same code", () => {
        const codes = quirks.flatMap((quirk) => quirk.altNames.filter((name) => /^[a-z0-9_]+$/.test(name)));
        expect(codes.filter((code, index) => codes.indexOf(code) !== index)).toEqual([]);
    });
});

// Effects as read from the page images: Campaign Operations pp.225-235 (with its v5.0 errata) and the Alpha Strike
// Companion pp.59-67.
// The quirks whose rule is not one the app models as a number: listed in play as "not yet applied in play".
const EXPECTED_UNAPPLIED = [
    "quirk-compact-mech", "quirk-extended-torso-twist", "quirk-fine-manipulators", "quirk-hyper-extending-actuators",
    "quirk-improved-communications", "quirk-improved-sensors", "quirk-jettison-capable-weapon", "quirk-multi-trac",
    "quirk-rugged", "quirk-rumble-seat", "quirk-scout-bike", "quirk-variable-range-targeting", "quirk-vestigial-hands",
    "quirk-vtol-rotor-arrangement", "quirk-trailer-hitch", "quirk-em-interference", "quirk-large-dropship",
    "quirk-low-mounted-arms", "quirk-no-ejection-system", "quirk-no-torso-twist", "quirk-non-functional-item",
    "quirk-obsolete", "quirk-poor-performance", "quirk-ramshackle", "quirk-slow-traverse", "quirk-static-ammo-feed",
    "quirk-un-streamlined",
];

// The Alpha Strike Companion's lists (pp.60-61), by our tags.
const ALPHA_STRIKE = [
    "quirk-accurate-weapon", "quirk-anti-aircraft-targeting", "quirk-atmospheric-flyer", "quirk-battle-computer",
    "quirk-battlefists", "quirk-combat-computer", "quirk-command-mech", "quirk-compact-mech", "quirk-cowl",
    "quirk-distracting", "quirk-docking-arms", "quirk-easy-to-maintain", "quirk-easy-to-pilot",
    "quirk-extended-torso-twist", "quirk-hyper-extending-actuators", "quirk-improved-communications",
    "quirk-improved-sensors", "quirk-improved-targeting", "quirk-internal-bomb-bay", "quirk-modular-weapons",
    "quirk-multi-trac", "quirk-narrow-low-profile", "quirk-overhead-arms", "quirk-protected-actuators",
    "quirk-reinforced-legs", "quirk-searchlight", "quirk-trailer-hitch", "quirk-variable-range-targeting",
    "quirk-ammunition-feed-problem", "quirk-atmospheric-flight-instability", "quirk-cooling-system-flaws",
    "quirk-cramped-cockpit", "quirk-difficult-ejection", "quirk-difficult-to-maintain", "quirk-em-interference",
    "quirk-exposed-actuators", "quirk-exposed-weapon-linkage", "quirk-fragile-fuel-tank", "quirk-gas-hog",
    "quirk-hard-to-pilot", "quirk-illegal-design", "quirk-inaccurate-weapon", "quirk-large-dropship",
    "quirk-low-mounted-arms", "quirk-no-minimal-arms", "quirk-no-ejection-system", "quirk-no-torso-twist",
    "quirk-obsolete", "quirk-oversized", "quirk-poor-life-support", "quirk-poor-performance", "quirk-poor-sealing",
    "quirk-poor-targeting", "quirk-poor-workmanship", "quirk-prototype", "quirk-sensor-ghosts",
    "quirk-static-ammo-feed", "quirk-un-streamlined", "quirk-weak-legs", "quirk-weak-undercarriage",
];

describe("quirk effects in play", () => {
    it("gives Accurate Weapon -1 to its weapon's to-hit", () => {
        expect(getQuirk("quirk-accurate-weapon")?.effects).toEqual([{ type: "to-hit", modifier: -1, scope: "weapon" }]);
    });

    it("gives Anti-Aircraft Targeting -2 against airborne targets", () => {
        expect(getQuirk("quirk-anti-aircraft-targeting")?.effects).toEqual([{ type: "to-hit", modifier: -2, scope: "unit", vsAirborne: true }]);
    });

    it("gives Improved Targeting -1 and Poor Targeting +1 in the band they were assigned", () => {
        expect(getQuirk("quirk-improved-targeting")?.effects).toEqual([{ type: "to-hit", modifier: -1, scope: "unit", rangeBand: "parameter" }]);
        expect(getQuirk("quirk-poor-targeting")?.effects).toEqual([{ type: "to-hit", modifier: 1, scope: "unit", rangeBand: "parameter" }]);
    });

    it("gives Stabilized Weapon -1 only after running or flanking", () => {
        expect(getQuirk("quirk-stabilized-weapon")?.effects).toEqual([{ type: "to-hit", modifier: -1, scope: "weapon", attackerRanOrFlanked: true }]);
    });

    it("gives Command 'Mech +1 and Battle Computer +2 Initiative", () => {
        expect(getQuirk("quirk-command-mech")?.effects).toEqual([{ type: "initiative", modifier: 1 }]);
        expect(getQuirk("quirk-battle-computer")?.effects).toEqual([{ type: "initiative", modifier: 2 }]);
    });

    it("gives Combat Computer -4 heat generated", () => {
        expect(getQuirk("quirk-combat-computer")?.effects).toEqual([{ type: "heat-generated", modifier: -4 }]);
    });

    it("changes a weapon's heat for the cooling jacket quirks", () => {
        expect(getQuirk("quirk-improved-cooling-jacket")?.effects).toEqual([{ type: "weapon-heat", modifier: -1, minimum: 1 }]);
        expect(getQuirk("quirk-poor-cooling-jacket")?.effects).toEqual([{ type: "weapon-heat", modifier: 1 }]);
        expect(getQuirk("quirk-no-cooling-jacket")?.effects).toEqual([{ type: "weapon-heat", modifier: 2 }]);
    });

    it("gives every quirk an effects list, empty only where no effect type fits", () => {
        expect(quirks.filter((quirk) => !quirk.effects).map((quirk) => quirk.tag)).toEqual([]);
        expect(quirks.filter((quirk) => !quirk.effects?.length).map((quirk) => quirk.tag).sort()).toEqual([...EXPECTED_UNAPPLIED].sort());
    });

    it("keeps alphaStrike only on the quirks the Alpha Strike Companion lists, on its quirk pages", () => {
        expect(quirks.filter((quirk) => quirk.alphaStrike).map((quirk) => quirk.tag).sort()).toEqual([...ALPHA_STRIKE].sort());
        for (const quirk of quirks.filter((each) => each.alphaStrike))
            expect(quirk.alphaStrike!.page, quirk.tag).toBeGreaterThanOrEqual(59);
        for (const quirk of quirks.filter((each) => each.alphaStrike))
            expect(quirk.alphaStrike!.page, quirk.tag).toBeLessThanOrEqual(67);
    });

    it("gives the Alpha Strike targeting quirks their to-hit by band, and Sensor Ghosts +1 to every weapon attack", () => {
        expect(getQuirk("quirk-improved-targeting")?.alphaStrike).toEqual({ cost: [3, 4, 5], page: 63, effects: [{ type: "to-hit", modifier: -1, scope: "unit", rangeBand: "parameter" }] });
        expect(getQuirk("quirk-poor-targeting")?.alphaStrike).toEqual({ cost: [-2, -3, -4], page: 67, effects: [{ type: "to-hit", modifier: 1, scope: "unit", rangeBand: "parameter" }] });
        expect(getQuirk("quirk-sensor-ghosts")?.alphaStrike?.effects).toEqual([{ type: "to-hit", modifier: 1, scope: "unit" }]);
        expect(getQuirk("quirk-variable-range-targeting")?.alphaStrike?.effects).toEqual([{ type: "to-hit", modifier: -1, scope: "unit" }]);
    });
});

// Campaign Operations errata v5.0 p.8 (from v4.0): No Torso Twist deleted, Weak Legs rewritten.
describe("the Campaign Operations errata", () => {
    // User ruling 2026-10-22: designs without a torso twist exist, so the quirk stays, at the Apocryphal level.
    it("keeps No Torso Twist at the Apocryphal level, citing the errata that deletes it", () => {
        const record = getQuirk("quirk-no-torso-twist");
        expect(record?.rulesLevel).toBe(APOCRYPHAL_RULES_LEVEL);
        expect(record?.sources).toContainEqual({ book: "Campaign Operations Errata v5.0", page: 8 });
        expect(record?.summary).toContain("errata");
    });

    it("rolls Weak Legs for the kicked leg only, and for both legs after its own Death From Above", () => {
        const record = getQuirk("quirk-weak-legs");
        expect(record?.summary).toBe("Its own Death From Above rolls for a critical hit on each leg; a kick rolls for the leg kicked. Either rolls even if no armor is breached.");
        expect(record?.sources).toContainEqual({ book: "Campaign Operations Errata v5.0", page: 8 });
    });
});
