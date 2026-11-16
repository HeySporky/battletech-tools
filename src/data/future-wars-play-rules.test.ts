import { afterEach, describe, expect, it } from "vitest";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { btSpecialRulesets, findSpecialRuleset, getRulesetConflict } from "./special-rulesets";
import { FUTURE_WARS_PLAY_RULESET_IDS, getFutureWarsPlayRules } from "./future-wars-play-rules";

/** Best of Future Wars plan, Chunk D (#172): the fanzine's five optional play rules as Special Rulesets. */
const BOOK = "The Best of Future Wars, Volume One (1991)";

const EXPECTED: Array<[string, string, string, string]> = [
    ["fw-opportunity-fire", "Charles J. Tomaszewski", "p.17", "firePhase"],
    ["fw-strategic-movement", "H. Barents", "pp.18-19", "movementModes"],
    ["fw-morale", "H. Barents", "pp.22-26", "morale"],
    ["fw-weapon-malfunctions", "Karl Bruanning", "p.29", "weaponFailure"],
    ["fw-long-range-wars", "Herb Barents", "pp.55-56", "weaponRanges"],
];

const row = (id: string, title: string, label: string): string | undefined =>
    getFutureWarsPlayRules(id)?.tables.find((table) => table.title === title)?.rows.find(([key]) => key === label)?.[1];

describe("Best of Future Wars play rulesets (#172, Chunk D)", () => {
    afterEach(() => {
        const index = btSpecialRulesets.findIndex((ruleset) => ruleset.id === "test-ranges");
        if (index >= 0) btSpecialRulesets.splice(index, 1);
    });

    it("registers all five, Custom Homebrew, credited to the author and printed page", () => {
        expect(FUTURE_WARS_PLAY_RULESET_IDS).toEqual(EXPECTED.map(([id]) => id));
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
        btSpecialRulesets.push({ id: "test-ranges", name: "Test ranges", description: "", source: { title: "test" }, changes: ["weaponRanges"] });
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
