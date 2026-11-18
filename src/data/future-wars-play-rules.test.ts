import { afterEach, describe, expect, it } from "vitest";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { btSpecialRulesets, findSpecialRuleset, getRulesetConflict } from "./special-rulesets";
import { FUTURE_WARS_PLAY_RULESET_IDS, getFutureWarsPlayRules } from "./future-wars-play-rules";
import { testSpecialRuleset } from "../test-support/rulesets";

/** Best of Future Wars plan, Chunk D (#172): the fanzine's five optional play rules as Special Rulesets. */
const BOOK = "The Best of Future Wars, Volume One (1991)";

const EXPECTED: Array<[string, string, string, string]> = [
    ["fw-opportunity-fire", "Charles J. Tomaszewski", "p.17", "firePhase"],
    ["fw-strategic-movement", "Herb Barents", "pp.18-19", "movementModes"],
    ["fw-morale", "Herb Barents", "pp.22-26", "morale"],
    ["fw-weapon-malfunctions", "Karl Bruanning and Herb Barents", "p.29", "weaponFailure"],
    ["fw-long-range-wars", "Herb Barents", "pp.55-56", "weaponRanges"],
];

/** Printing alternates (#172, plan 2026-11-17-future-wars-printing-alternates): the original printings' twins. */
const ORIGINALS: Array<[string, string, string, string, string]> = [
    ["fw-morale-17", "fw-morale", "FW #17", "*Future Wars* #17 (1990), pp.36-40", "morale"],
    ["fw-weapon-malfunctions-9", "fw-weapon-malfunctions", "FW #9", "*Future Wars* #9 (1988), pp.10-11", "weaponFailure"],
    ["fw-long-range-wars-12", "fw-long-range-wars", "FW #12", "*Future Wars* #12 (1989), pp.12-13", "weaponRanges"],
];

const row = (id: string, title: string, label: string): string | undefined =>
    getFutureWarsPlayRules(id)?.tables.find((table) => table.title === title)?.rows.find(([key]) => key === label)?.[1];

describe("Best of Future Wars play rulesets (#172, Chunk D)", () => {
    afterEach(() => {
        const index = btSpecialRulesets.findIndex((ruleset) => ruleset.id === "test-ranges");
        if (index >= 0) btSpecialRulesets.splice(index, 1);
    });

    it("registers all five reprint rulesets (and lists the three original printings after them), Custom Homebrew, credited to the author and printed page", () => {
        expect(FUTURE_WARS_PLAY_RULESET_IDS).toEqual([...EXPECTED.map(([id]) => id), ...ORIGINALS.map(([id]) => id)]);
        for (const [id, author, page, change] of EXPECTED) {
            const ruleset = findSpecialRuleset(id);
            expect(ruleset, id).toBeDefined();
            expect(ruleset!.minRulesLevel, id).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
            expect(ruleset!.source.title, id).toContain(author);
            expect(ruleset!.source.title, id).toContain(BOOK);
            expect(ruleset!.source.title, id).toMatch(new RegExp(`${page.replace(".", "\\.")}$`));
            expect(ruleset!.changes, id).toEqual([change]);
            expect(ruleset!.description.length, id).toBeGreaterThan(0);
        }
    });

    it("lets the five be used together, and with Clell Flint's construction rules", () => {
        const ids = EXPECTED.map(([id]) => id);
        for (const id of ids) {
            expect(getRulesetConflict(ids.filter((other) => other !== id), id), id).toBeUndefined();
            expect(getRulesetConflict(["best-of-future-wars-construction"], id), id).toBeUndefined();
        }
    });

    it("refuses another ruleset that changes the weapon ranges alongside The Long Range Wars", () => {
        btSpecialRulesets.push(testSpecialRuleset({ id: "test-ranges", name: "Test ranges", changes: ["weaponRanges"] }));
        expect(getRulesetConflict(["fw-long-range-wars"], "test-ranges")?.id).toBe("fw-long-range-wars");
    });

    it("has a rules summary with at least one table for each, every table citing its page", () => {
        for (const [id] of EXPECTED) {
            const rules = getFutureWarsPlayRules(id);
            expect(rules, id).toBeDefined();
            expect(rules!.summary.length, id).toBeGreaterThan(0);
            expect(rules!.tables.length, id).toBeGreaterThan(0);
            for (const table of rules!.tables) {
                expect(table.page, `${id} ${table.title}`).toMatch(/^BoFW pp?\.\d/);
                expect(table.rows.length, `${id} ${table.title}`).toBeGreaterThan(0);
            }
        }
        expect(getFutureWarsPlayRules("sample-no-clans")).toBeUndefined();
    });

    it("prints Opportunity Fire's numbers (p.17)", () => {
        expect(row("fw-opportunity-fire", "Opportunity Fire", "To-hit at short / medium / long")).toBe("6 / 8 / 10 (Gunnery 4), plus the usual targeting modifiers");
        expect(row("fw-opportunity-fire", "Opportunity Fire", "Target walked / ran / jumped")).toBe("+0 / +1 / +2; hexes moved are not counted");
        expect(row("fw-opportunity-fire", "Opportunity Fire", "Firer moved this turn")).toBe("+2");
    });

    it("prints Strategic Movement's numbers (pp.18-19)", () => {
        expect(row("fw-strategic-movement", "Strategic Movement", "Movement")).toBe("Walking and running MP doubled");
        expect(row("fw-strategic-movement", "Strategic Movement", "Heat, walking")).toBe("2, plus 1 for each MP beyond the normal walking MP");
        expect(row("fw-strategic-movement", "Strategic Movement", "Heat, running")).toBe("2, plus 2 for each MP beyond the normal running MP");
        expect(row("fw-strategic-movement", "Strategic Movement", "Turning")).toBe("2 MP a hexside, and a Piloting Skill Roll for each; a fall on a failure");
    });

    it("prints the morale tables in full (pp.23-26)", () => {
        const morale = getFutureWarsPlayRules("fw-morale")!;
        expect(row("fw-morale", "Morale check", "Militia / Green / Regular / Veteran / Elite / Crack")).toBe("7 / 7 / 6 / 6 / 5 / 5");
        const mechResults = morale.tables.find((table) => table.title === "'Mech results (2D6 + modifiers)")!;
        expect(mechResults.rows.map(([roll]) => roll)).toEqual(["-5", "-4", "-3", "-2", "-1", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14+"]);
        expect(row("fw-morale", "When a 'Mech checks", "Head hit")).toBe("A hit to the head (named in the text on p.23, not in the chart)");
        expect(row("fw-morale", "When a 'Mech checks", "A friend routs")).toBe("A friendly unit within 10 hexes and in LOS rolls -5 on the results table");
        expect(row("fw-morale", "When a 'Mech checks", "A friend breaks")).toBeUndefined();
        expect(row("fw-morale", "'Mech modifiers", "Lost leg")).toBe("-5");
        expect(row("fw-morale", "'Mech modifiers", "On fire from an Inferno round")).toBe("-4");
        expect(row("fw-morale", "Vehicle modifiers", "Immobile")).toBe("-4");
        expect(row("fw-morale", "Vehicle results (2D6 + modifiers)", "2 or less")).toBe("Rout; leaves as soon as it can; every unit in LOS checks morale; surrenders if immobile");
        expect(row("fw-morale", "Infantry modifiers", "In a hardened building")).toBe("+5");
        expect(row("fw-morale", "Infantry results (2D6 + modifiers)", "7+")).toBe("No effect");
    });

    it("prints the malfunction tables in full (p.29)", () => {
        const malfunctions = getFutureWarsPlayRules("fw-weapon-malfunctions")!;
        const rolls = (title: string): string[] => malfunctions.tables.find((table) => table.title === title)!.rows.map(([roll]) => roll);
        expect(rolls("Flamers (1D6)")).toEqual(["1", "2", "3", "4", "5", "6"]);
        expect(rolls("Missiles (2D6)")).toEqual(["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
        expect(rolls("Autocannons and machine guns (2D6)")).toEqual(["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
        expect(rolls("Lasers (3D6)")).toEqual(["3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"]);
        expect(row("fw-weapon-malfunctions", "Lasers (3D6)", "18")).toBe("Total burn-through: 1D6 damage and 2D6 heat");
        expect(row("fw-weapon-malfunctions", "Missiles (2D6)", "12")).toBe("Missile explodes on launch: 2D6 damage and 1D6 heat");
    });

    it("prints The Long Range Wars' numbers (pp.55-56)", () => {
        expect(row("fw-long-range-wars", "New range bands", "Extended / extreme")).toBe("2 x long / 2 x extended (a PPC: 36 / 72)");
        expect(row("fw-long-range-wars", "New range bands", "Base to-hit, extended / extreme")).toBe("10 / 13");
        expect(row("fw-long-range-wars", "Modifiers at extended and extreme range", "Firer walked / ran / jumped")).toBe("+2 / +3 / +5");
        expect(row("fw-long-range-wars", "Modifiers at extended and extreme range", "Target moved 7-9 / 10+ hexes")).toBe("+4 / +5");
        expect(row("fw-long-range-wars", "Option: eight-sided dice", "Base to-hit, short / medium / long / extended / extreme")).toBe("4 / 7 / 10 / 13 / 16");
    });
});

describe("Future Wars printing alternates (#172)", () => {
    it("pairs each reprint ruleset with its original printing, the two refusing each other", () => {
        for (const [twin, best, tag, cite, change] of ORIGINALS) {
            const original = findSpecialRuleset(twin);
            expect(original, twin).toBeDefined();
            expect(original!.minRulesLevel, twin).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
            expect(original!.category, twin).toBe("play");
            expect(original!.source.tag, twin).toBe(tag);
            expect(original!.source.title, twin).toContain(cite);
            expect(original!.source.title, twin).not.toContain(BOOK);
            expect(original!.changes, twin).toEqual([change]);
            expect(original!.name, twin).toMatch(/\(Future Wars #\d+ printing\)$/);
            expect(findSpecialRuleset(best)!.name, best).toMatch(/\(Best of Future Wars printing\)$/);
            expect(getRulesetConflict([best], twin)?.id, twin).toBe(best);
            expect(getRulesetConflict([twin], best)?.id, best).toBe(twin);
            for (const table of getFutureWarsPlayRules(twin)!.tables) expect(table.page, `${twin} ${table.title}`).toMatch(/^FW #\d+ pp?\.\d/);
        }
    });

    it("prints the FW #17 morale rules where they differ from the reprint", () => {
        expect(row("fw-morale-17", "Morale check", "Disorganized / broken / routed")).toBe("+1 / +2 / +3 to the class's number");
        expect(row("fw-morale-17", "'Mech results (2D6 + modifiers)", "13")).toBe("Carry on; enraged: up 1 on the morale scale");
        expect(row("fw-morale-17", "'Mech results (2D6 + modifiers)", "-4")).toBe("Routed until off the board; leaves the battle as soon as it can; no fighting");
        expect(row("fw-morale-17", "When a 'Mech checks", "Internal damage spread")).toBe("Once three locations have internal damage, every time it takes damage");
        expect(row("fw-morale-17", "When a 'Mech checks", "Damage spread")).toBeUndefined();
        // The rows the printings share are shared (FW #17 p.40 prints "Every 4th man lost -1", as the reprint does).
        expect(row("fw-morale-17", "'Mech results (2D6 + modifiers)", "8")).toBe(row("fw-morale", "'Mech results (2D6 + modifiers)", "8"));
        expect(row("fw-morale-17", "Infantry modifiers", "Every fourth trooper lost")).toBe("-1");
        expect(getFutureWarsPlayRules("fw-morale-17")!.summary).toContain("a rout lasts until the unit is off the board");
    });

    it("prints the FW #9 malfunction rows where they differ from the reprint", () => {
        expect(row("fw-weapon-malfunctions-9", "Lasers (3D6)", "16")).toBe("+2 to-hit, +5 heat when used");
        expect(row("fw-weapon-malfunctions-9", "Lasers (3D6)", "17")).toBe("Burned out: it can no longer be used");
        expect(row("fw-weapon-malfunctions-9", "Flamers (1D6)", "5")).toBe("No effect (the original prints no row 5; NGCFells ruled a 5 does nothing)");
        expect(row("fw-weapon-malfunctions-9", "Autocannons and machine guns (2D6)", "11")).toContain("roll twice on this table");
        expect(row("fw-weapon-malfunctions-9", "Missiles (2D6)", "8")).toContain("no firing or jumping");
    });

    it("prints the FW #12 ranging without the reprint's slow-target limit, and malfunctions on 2 or 3 with eight-sided dice", () => {
        expect(row("fw-long-range-wars-12", "Modifiers at extended and extreme range", "Ranging")).toBe("-1 for each turn in a row the same 'Mech fires at the target");
        expect(getFutureWarsPlayRules("fw-long-range-wars-12")!.summary).not.toContain("6 hexes");
        expect(row("fw-long-range-wars-12", "Option: eight-sided dice", "Weapon Malfunctions")).toBe("A malfunction on a to-hit roll of 2 or 3");
    });
});
