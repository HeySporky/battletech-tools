// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPrintedDroids } from "../../data/battledroids-mechs";
import { buildPrintedDroid } from "../../classes/printed-droid";
import { getRulesEdition } from "../../data/rules-editions";
import type { IAppGlobals } from "../app-router";
import { BattleMech } from "../../classes/battlemech";
import { confirmEditPrintedDroid, getDesignLockNote, keepDesignSettings, mechRulesLevel } from "./design-lock";

afterEach(() => vi.unstubAllGlobals());

// The lock follows the design's own rules level, not the app-wide one (#324 call 5).
describe("design lock (#324)", () => {
    it("locks a printed droid at the design's play level and the edit raises the design's level", () => {
        const mech = buildPrintedDroid(getPrintedDroids(0)[0]);
        const construction = getRulesEdition(mech.getRulesEdition()).constructionLevel!;
        mech.applyGameSettings({ ...mech.getGameSettings(construction), rulesLevel: 0 });
        const appGlobals = {
            currentBattleMech: mech,
            appSettings: { mechRulesFilter: construction },
            saveAppSettings: vi.fn(),
            saveCurrentBattleMech: vi.fn(),
        } as unknown as IAppGlobals;
        expect(mechRulesLevel(appGlobals)).toBe(0);
        expect(getDesignLockNote(appGlobals)).toMatch(/plays the printed droids only/);

        vi.stubGlobal("confirm", () => true);
        confirmEditPrintedDroid(appGlobals);
        expect(mech.getRulesLevel(99)).toBe(construction);
        expect(getDesignLockNote(appGlobals)).toBeNull();
    });

    it("a printed droid or sample picked in place of the design keeps the design's level and rulesets", () => {
        const current = new BattleMech();
        current.applyGameSettings({ ...current.getGameSettings(2), rulesLevel: 5, rulesets: ["sample-no-clans"] });
        const appGlobals = { currentBattleMech: current, appSettings: { mechRulesFilter: 2 } } as unknown as IAppGlobals;
        const next = keepDesignSettings(appGlobals, buildPrintedDroid(getPrintedDroids(5)[0]));
        expect(next.getRulesLevel(2)).toBe(5);
        expect(next.getRulesets()).toEqual(["sample-no-clans"]);
    });
});
