// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../../data/rules-level-options";
import { getSpecialRulesets } from "../../../../data/special-rulesets";
import type { IAppGlobals } from "../../../app-router";
import MechCreatorStep2 from "./step2";
import MechCreatorStep4 from "./step4";
import MechCreatorStep6 from "./step6";
import { buildMech } from "../../../../test-support/builders";

/** Compact 'Mechs plan, Chunk C (#172): Clell Flint's construction rules in the 'Mech creator. */
afterEach(cleanup);

const BEST_OF = "best-of-future-wars-construction";

const build = (tonnage: number, rulesets: string[] = [BEST_OF]): BattleMech => buildMech({ tonnage, homebrew: rulesets });

const globals = (mech: BattleMech, mechRulesFilter: number = CUSTOM_HOMEBREW_RULES_LEVEL): IAppGlobals => ({
    appSettings: { developerMenu: false, uiTheme: "", equipmentFilter: "", installEquipCategory: "", mechRulesFilter },
    currentBattleMech: mech,
    saveCurrentBattleMech: vi.fn(),
    makeDocumentTitle: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    siteAlerts: { activeAlerts: [] },
} as unknown as IAppGlobals);

function renderWith(page: React.ReactElement): void {
    render(<MemoryRouter>{page}</MemoryRouter>);
}

describe("Future Wars construction in the creator (#172)", () => {
    it("is a Special Ruleset offered at Custom Homebrew and not below", () => {
        for (const id of [BEST_OF, "future-wars-11-construction"]) {
            const ruleset = getSpecialRulesets().find((entry) => entry.id === id);
            expect(ruleset?.minRulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        }
    });

    it("step 2 offers the 4-ton cockpit to a heavy 'Mech under the ruleset only", () => {
        renderWith(<MechCreatorStep2 appGlobals={globals(build(70))} />);
        expect(screen.getByLabelText(/4-ton cockpit/i)).toBeTruthy();
        cleanup();
        renderWith(<MechCreatorStep2 appGlobals={globals(build(40))} />);
        expect(screen.queryByLabelText(/4-ton cockpit/i)).toBeNull();
        cleanup();
        renderWith(<MechCreatorStep2 appGlobals={globals(build(70, []))} />);
        expect(screen.queryByLabelText(/4-ton cockpit/i)).toBeNull();
    });

    it("step 2 ticks the heavy cockpit and the two extras onto the 'Mech", () => {
        const mech = build(70);
        renderWith(<MechCreatorStep2 appGlobals={globals(mech)} />);
        fireEvent.click(screen.getByLabelText(/4-ton cockpit/i));
        expect(mech.getFutureWarsLargeCockpit()).toBe(true);
        fireEvent.click(screen.getByLabelText(/extra sensors/i));
        expect(mech.getExtraSensors()).toBe(true);
        fireEvent.click(screen.getByLabelText(/extra life support/i));
        expect(mech.getExtraLifeSupport()).toBe(true);
    });

    it("step 2 offers the extras under the ruleset only", () => {
        renderWith(<MechCreatorStep2 appGlobals={globals(build(40, []))} />);
        expect(screen.queryByLabelText(/extra sensors/i)).toBeNull();
        expect(screen.queryByLabelText(/extra life support/i)).toBeNull();
    });

    it("step 4 caps head armor at twice the head's structure", () => {
        const mech = build(100);
        const cap = mech.getMaxHeadArmor();
        expect(cap).toBeGreaterThan(9);
        renderWith(<MechCreatorStep4 appGlobals={globals(mech)} />);
        const select = screen.getAllByTitle("Change this BattleMech's head armor value")[0] as HTMLSelectElement;
        expect(within(select).getAllByRole("option")).toHaveLength(cap + 1);
    });

    it("step 4 keeps the head at 9 without the ruleset", () => {
        renderWith(<MechCreatorStep4 appGlobals={globals(build(100, []))} />);
        const select = screen.getAllByTitle("Change this BattleMech's head armor value")[0] as HTMLSelectElement;
        expect(within(select).getAllByRole("option")).toHaveLength(10);
    });

    it("step 6 lays out each location at its class's length", () => {
        const mech = build(100);
        renderWith(<MechCreatorStep6 appGlobals={globals(mech)} />);
        const slots = mech.getLocationSlotCount("centerTorso");
        expect(slots).toBeGreaterThan(12);
        expect(mech.criticals.centerTorso).toHaveLength(slots);
        expect(document.body.textContent).toContain("Standard Fusion");
    });

    it("step 6 says why an item cannot fit a short location", () => {
        const mech = build(20);
        const slots = mech.getLocationSlotCount("head");
        renderWith(<MechCreatorStep6 appGlobals={globals(mech)} />);
        expect(mech.getSlotFitMessage("head", slots + 1)).toMatch(/cannot fit the head/);
    });
});
