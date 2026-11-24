import { afterEach, describe, expect, it } from "vitest";
import { changeGameSetting, describeGameSettingMove, getEditionTechBases, getGameSettingOptions, getStaleGameSettingSteps, getUnitTypeEras, IGameSettings } from "./game-settings";
import { btTechOptions } from "./tech-options";
import { btSpecialRulesets, getRulesetRemovingUnitType } from "./special-rulesets";
import { DEFAULT_RULES_EDITION, getSelectableRulesEditions } from "./rules-editions";
import { findEraByTag, getClosestEraForTech, getErasForTech } from "./era-options";
import { testSpecialRuleset } from "../test-support/rulesets";

const base: IGameSettings = { rulesets: [], edition: DEFAULT_RULES_EDITION, rulesLevel: 1, techBase: "clan", era: "clan-inv" };

describe("shared game settings (#324)", () => {
    afterEach(() => {
        const index = btSpecialRulesets.findIndex((ruleset) => ruleset.id === "test-techs");
        if (index >= 0) {
            btSpecialRulesets.splice(index, 1);
        }
    });

    it("offers no Clan or Mixed tech once the no-Clans universe is ticked, and moves the tech base and era down", () => {
        const result = changeGameSetting(base, { step: "rulesets", toggle: "sample-no-clans" }, "mech");
        expect(result.settings.rulesets).toEqual(["sample-no-clans"]);
        expect(result.settings.techBase).toBe("is");
        expect(result.moves.map((move) => move.step)).toEqual(["techBase"]);
        expect(getGameSettingOptions(result.settings, "mech").techBases).toEqual(["is"]);
    });

    it("offers only the edition's own tech bases", () => {
        expect(getEditionTechBases(DEFAULT_RULES_EDITION)).toEqual(btTechOptions.map((option) => option.tag));
        expect(getEditionTechBases("battledroids")).toEqual(["is"]);
        expect(getGameSettingOptions({ ...base, edition: "battledroids" }, "mech").techBases).toEqual(["is"]);
    });

    it("flags a stored tech base the ticked rulesets no longer offer, and nothing else", () => {
        expect(getStaleGameSettingSteps({ ...base, rulesets: ["sample-no-clans"] }, "mech")).toEqual(["techBase"]);
        expect(getStaleGameSettingSteps(base, "mech")).toEqual([]);
    });

    it("never moves a step above the one changed", () => {
        const result = changeGameSetting(base, { step: "techBase", value: "is" }, "mech");
        expect(result.settings.edition).toBe(base.edition);
        expect(result.settings.rulesLevel).toBe(base.rulesLevel);
        expect(result.settings.techBase).toBe("is");
    });

    it("reports a chain of moves in step order", () => {
        const result = changeGameSetting({ ...base, techBase: "is", era: "star-league" }, { step: "techBase", value: "clan" }, "mech");
        const expected = getClosestEraForTech(findEraByTag("star-league")!, "clan");
        expect(expected.tag).not.toBe("star-league");
        expect(result.moves).toEqual([{ step: "era", from: "star-league", to: expected.tag }]);
        expect(describeGameSettingMove(result.moves[0])).toBe("Era moved to " + expected.name);
    });

    it("leaves a stored value alone until an edit", () => {
        const stored: IGameSettings = { ...base, rulesets: ["sample-no-clans"] };
        const before = structuredClone(stored);
        getGameSettingOptions(stored, "mech");
        expect(stored).toEqual(before);
    });

    it("unticking a ruleset moves nothing still valid", () => {
        const on = changeGameSetting(base, { step: "rulesets", toggle: "sample-no-clans" }, "mech");
        const off = changeGameSetting(on.settings, { step: "rulesets", toggle: "sample-no-clans" }, "mech");
        expect(off.settings.rulesets).toEqual([]);
        expect(off.moves).toEqual([]);
    });

    it("hides eras under an edition without them and keeps the stored era", () => {
        const noEras = getSelectableRulesEditions("mech").find((edition) => edition.noEras)!;
        const result = changeGameSetting(base, { step: "edition", value: noEras.tag }, "mech");
        expect(getGameSettingOptions(result.settings, "mech").eras).toEqual([]);
        expect(result.settings.era).toBe(base.era);
        expect(result.moves.map((move) => move.step)).not.toContain("era");
    });

    it("refuses a ruleset that clashes with one already ticked", () => {
        btSpecialRulesets.push(testSpecialRuleset({ id: "test-techs", name: "test", changes: ["techBases"] }));
        const ticked: IGameSettings = { ...base, techBase: "is", rulesets: ["sample-no-clans"] };
        const result = changeGameSetting(ticked, { step: "rulesets", toggle: "test-techs" }, "mech");
        expect(result.refused?.id).toBe("sample-no-clans");
        expect(result.settings).toEqual(ticked);
        expect(result.moves).toEqual([]);
    });

    it("refuses a ruleset whose requirement is not ticked, and the untick of a requirement in use", () => {
        btSpecialRulesets.push(
            testSpecialRuleset({ id: "test-req-c", name: "C", changes: ["c"] }),
            testSpecialRuleset({ id: "test-req-d", name: "D", changes: ["d"], requires: ["test-req-c"] }),
        );
        try {
            const missing = changeGameSetting(base, { step: "rulesets", toggle: "test-req-d" }, "mech");
            expect(missing.settings).toEqual(base);
            expect(missing.block).toMatchObject({ kind: "needs", reason: "Needs C" });
            expect(missing.refused?.id).toBe("test-req-c");
            const both: IGameSettings = { ...base, rulesets: ["test-req-c", "test-req-d"] };
            const untick = changeGameSetting(both, { step: "rulesets", toggle: "test-req-c" }, "mech");
            expect(untick.settings).toEqual(both);
            expect(untick.block).toMatchObject({ kind: "neededBy", reason: "Needed by D" });
            expect(changeGameSetting(both, { step: "rulesets", toggle: "test-req-d" }, "mech").settings.rulesets).toEqual(["test-req-c"]);
        } finally {
            for (const id of ["test-req-c", "test-req-d"]) btSpecialRulesets.splice(btSpecialRulesets.findIndex((entry) => entry.id === id), 1);
        }
    });
    // Final review fixes.
    it("moves an unknown edition to the default edition, not the oldest", () => {
        const result = changeGameSetting({ ...base, edition: "edition-from-the-future" }, { step: "rulesets", toggle: "sample-no-clans" }, "mech");
        expect(result.settings.edition).toBe(DEFAULT_RULES_EDITION);
    });

    it("ignores a ruleset id the registry does not know", () => {
        const result = changeGameSetting(base, { step: "rulesets", toggle: "no-such-ruleset" }, "mech");
        expect(result.settings).toEqual(base);
        expect(result.moves).toEqual([]);
    });

    it("stores a rules level picked from a select as a number, with no move", () => {
        const result = changeGameSetting(base, { step: "rulesLevel", value: "3" }, "mech");
        expect(result.settings.rulesLevel).toBe(3);
        expect(result.moves).toEqual([]);
    });

    it("fits an edited value the lists do not offer", () => {
        const ticked: IGameSettings = { ...base, techBase: "is", rulesets: ["sample-no-clans"] };
        const result = changeGameSetting(ticked, { step: "techBase", value: "clan" }, "mech");
        expect(result.settings.techBase).toBe("is");
    });

    it("moves an unknown era to an era the tech base offers", () => {
        const result = changeGameSetting({ ...base, era: "no-such-era" }, { step: "techBase", value: "clan" }, "mech");
        expect(getErasForTech("clan").map((era) => era.tag)).toContain(result.settings.era);
    });

    it("moves the rules level when the edition does not list it, then reports each move in step order", () => {
        const battledroids = getSelectableRulesEditions("mech").find((edition) => edition.noEras)!;
        const result = changeGameSetting({ ...base, rulesLevel: 3 }, { step: "edition", value: battledroids.tag }, "mech");
        // Battledroids prints no Clan equipment, so the Clan tech base moves too.
        expect(result.moves.map((move) => move.step)).toEqual(["rulesLevel", "techBase"]);
        expect(result.settings.rulesLevel).toBe(2);
        expect(result.settings.techBase).toBe("is");
        expect(describeGameSettingMove(result.moves[0], battledroids.tag)).toBe("Rules Level moved to Expert Battledroids");
    });

    it("drops editions before a ruleset's minimum edition", () => {
        btSpecialRulesets.push(testSpecialRuleset({ id: "test-techs", name: "test", minEdition: DEFAULT_RULES_EDITION, changes: ["edition"] }));
        const tags = getGameSettingOptions({ ...base, rulesets: ["test-techs"] }, "mech").editions.map((edition) => edition.tag);
        expect(tags[0]).toBe(DEFAULT_RULES_EDITION);
        expect(tags).not.toContain("battledroids");
    });
    it("offers a unit type only its own tech bases", () => {
        const settings = { ...base, techBase: "is" };
        expect(getGameSettingOptions(settings, "battle-armor").techBases).toEqual(["is", "clan"]);
        expect(getGameSettingOptions(settings, "infantry").techBases).toEqual(["is", "clan"]);
        expect(getGameSettingOptions({ ...base, techBase: "clan" }, "protomech").techBases).toEqual(["clan"]);
        expect(getGameSettingOptions(settings, "vehicle").techBases).toEqual(btTechOptions.map((option) => option.tag));
    });

    it("a ProtoMech's eras start in 3055 and the no-Clans universe cannot be ticked on one (ProtoMechs do not exist)", () => {
        const proto = { ...base, techBase: "clan", era: getUnitTypeEras("protomech", "clan")[0].tag };
        expect(getGameSettingOptions(proto, "protomech").eras.every((era) => (era.yearEnd ?? Infinity) >= 3055)).toBe(true);
        expect(getGameSettingOptions(proto, "protomech").eras.length).toBeLessThan(getErasForTech("clan").length);
        const result = changeGameSetting(proto, { step: "rulesets", toggle: "sample-no-clans" }, "protomech");
        expect(result.settings).toBe(proto);
        expect(result.refused?.id).toBe("sample-no-clans");
        expect(result.removesUnitType).toBe(true);
        expect(getRulesetRemovingUnitType(["sample-no-clans"], "protomech")?.id).toBe("sample-no-clans");
        expect(getRulesetRemovingUnitType(["sample-no-clans"], "mech")).toBeUndefined();
        // An older save with it ticked keeps Clan: the design itself is flagged, not its tech base.
        const stored = { ...proto, rulesets: ["sample-no-clans"] };
        expect(getGameSettingOptions(stored, "protomech").techBases).toEqual(["clan"]);
        expect(getStaleGameSettingSteps(stored, "protomech")).toEqual([]);
        // It can still be unticked.
        expect(changeGameSetting(stored, { step: "rulesets", toggle: "sample-no-clans" }, "protomech").settings.rulesets).toEqual([]);
    });
});
